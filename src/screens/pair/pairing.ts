import { language } from '../../i18n';
import { requestSignIn } from '../../server/appleSignIn';
import { Offline, rpc, SessionEnded, signInWithIdToken } from '../../server/client';
import { reportToday } from '../../server/dayReports';
import { fetchHome, HOME_KEY, homeClient, homeRestored, refreshHome } from '../../server/home';
import { startPairedRuntime } from '../../server/runtime';
import type { HomeSnapshot } from '../../server/types';

/**
 * What the pairing sheet does (Phase 2 D1), on the server's functions (B3). Reached only by the lazy route,
 * so a solo launch never evaluates this. Nothing here throws: the screen shows a status.
 */

/** A–Z and 2–9 without I, L and O (plan §4; the check on invites.code). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * What someone typed or pasted, cleaned: capitals in English's rules, whatever the phone's language (a Turkish
 * i would otherwise become İ), keeping only the alphabet. `lookAlike` says an I, L or O was dropped, so the
 * screen can say why that key did nothing.
 */
export function cleanCode(raw: string): { code: string; lookAlike: boolean } {
    const upper = raw.normalize('NFKC').toLocaleUpperCase('en-US');
    let code = '';
    let lookAlike = false;
    for (const ch of upper) {
        if (ALPHABET.includes(ch)) code += ch;
        else if (ch === 'I' || ch === 'L' || ch === 'O' || ch === 'İ' || ch === 'ı') lookAlike = true;
    }
    return { code: code.slice(0, CODE_LENGTH), lookAlike };
}

export type ProblemStatus = 'invalid' | 'expired' | 'used' | 'own_code' | 'partner_paired' | 'rate_limited' | 'offline' | 'failed' | 'session_ended';

function statusOf(error: unknown): 'offline' | 'session_ended' | 'failed' {
    if (error instanceof Offline) return 'offline';
    if (error instanceof SessionEnded) return 'session_ended';
    return 'failed';
}

export type SignInResult = 'cancelled' | 'offline' | 'failed' | { needsName: boolean };

const deviceProfile = () => ({ p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone, p_locale: language });

/**
 * Asks Apple, signs in, and saves the first name at once, because Apple sends it only on the first sign-in.
 * Starts the paired runtime, since this person now has an account. A cancel is not a failure.
 */
export async function signIn(): Promise<SignInResult> {
    let firstName: string | null;
    try {
        const apple = await requestSignIn();
        if (!apple) return 'cancelled';
        firstName = apple.firstName;
        await signInWithIdToken({ identityToken: apple.identityToken, rawNonce: apple.rawNonce });
    } catch (error) {
        return statusOf(error) === 'offline' ? 'offline' : 'failed';
    }
    // Signed in from here, so nothing below can be called a failed sign-in. If it doesn't finish, the sheet shows
    // your page and carries on, and asks for a name once it can see that there isn't one.
    startPairedRuntime();
    try {
        await rpc('set_profile', { p_display_name: firstName, ...deviceProfile() });
        const home = await homeClient.fetchQuery({ queryKey: HOME_KEY, queryFn: fetchHome, staleTime: 0 });
        return { needsName: !home.me?.display_name };
    } catch {
        return { needsName: false };
    }
}

export async function saveName(name: string): Promise<'ok' | 'invalid' | 'offline' | 'failed'> {
    try {
        // With the time zone and language again: the sign-in that should have sent them may not have got through.
        const { status } = await rpc<{ status: string }>('set_profile', { p_display_name: name, ...deviceProfile() });
        if (status !== 'ok') return 'invalid';
        // Written here too, so a refresh that fails can't leave the sheet asking for a name it already has.
        homeClient.setQueryData<HomeSnapshot>(HOME_KEY, (old) => (old?.me ? { ...old, me: { ...old.me, display_name: name } } : old));
        await refreshHome().catch(() => {});
        return 'ok';
    } catch (error) {
        return statusOf(error) === 'offline' ? 'offline' : 'failed';
    }
}

export type CodeResult = { code: string } | { problem: 'offline' | 'failed' | 'already_paired' | 'no_name' };

/**
 * Makes a code, cancelling your earlier one, so it's only for when you've asked, or you certainly have none. The
 * new code goes into the cache at once: a refresh that fails must not leave the cancelled code on show.
 */
export async function newCode(): Promise<CodeResult> {
    try {
        const result = await rpc<{ status: string; code?: string; expires_at?: string }>('create_invite');
        if (result.status === 'ok' && result.code) {
            const invite = { code: result.code, expires_at: result.expires_at ?? new Date(Date.now() + DAY_MS).toISOString() };
            homeClient.setQueryData<HomeSnapshot>(HOME_KEY, (old) => (old ? { ...old, invite } : old));
            await refreshHome().catch(() => {});
            return { code: result.code };
        }
        return { problem: result.status === 'already_paired' ? 'already_paired' : 'failed' };
    } catch (error) {
        return { problem: statusOf(error) === 'offline' ? 'offline' : 'failed' };
    }
}

/** Whether a code can still be used. Pure, apart from reading the clock. */
export const isOpen = (invite: HomeSnapshot['invite'] | undefined) =>
    Boolean(invite && new Date(invite.expires_at).getTime() > Date.now());

/**
 * Your open code, or a new one. A new code cancels the one your partner may already hold, so it asks the server
 * first, and never makes one when it can't tell: with no answer it shows the last known code, or says so.
 * Someone with no name gets no code, since their partner would see nothing to recognise them by.
 */
export async function ensureCode(): Promise<CodeResult> {
    await homeRestored;
    let home: HomeSnapshot;
    try {
        home = await homeClient.fetchQuery({ queryKey: HOME_KEY, queryFn: fetchHome, staleTime: 0 });
    } catch (error) {
        const known = homeClient.getQueryData<HomeSnapshot>(HOME_KEY)?.invite;
        if (known && isOpen(known)) return { code: known.code };
        return { problem: statusOf(error) === 'offline' ? 'offline' : 'failed' };
    }
    if (home.couple) return { problem: 'already_paired' };
    if (!home.me?.display_name) return { problem: 'no_name' };
    if (home.invite && isOpen(home.invite)) return { code: home.invite.code };
    return newCode();
}

export type PreviewResult = { inviterName: string | null } | { problem: ProblemStatus | 'already_paired' };

/** Who a code belongs to. Changes nothing, beyond counting a wrong guess. */
export async function previewCode(code: string): Promise<PreviewResult> {
    try {
        const result = await rpc<{ status: string; inviter_name?: string | null }>('preview_invite', { p_code: code });
        if (result.status === 'ok') return { inviterName: result.inviter_name ?? null };
        return { problem: result.status as ProblemStatus | 'already_paired' };
    } catch (error) {
        return { problem: statusOf(error) };
    }
}

export type RedeemResult = 'ok' | { problem: ProblemStatus };

/**
 * Pairs. `already_paired` isn't an error here: if two people redeem each other's codes at the same moment,
 * the second answer can say so though they're paired with exactly who they typed (B3's record). So it
 * refreshes, and the snapshot says what's true.
 */
export async function redeemCode(code: string): Promise<RedeemResult> {
    try {
        const result = await rpc<{ status: string }>('redeem_invite', { p_code: code });
        if (result.status === 'ok' || result.status === 'already_paired') {
            await refreshHome().catch(() => {});
            await reportToday();
            const paired = homeClient.getQueryData<HomeSnapshot>(HOME_KEY)?.couple;
            return paired ? 'ok' : { problem: 'failed' };
        }
        return { problem: result.status as ProblemStatus };
    } catch (error) {
        return { problem: statusOf(error) };
    }
}

// They live with the strip's summary, so the Timer can read them with no server code.
export { CELEBRATED_KEY, markCelebrated, wasCelebrated } from '../../server/partnerGlance';
