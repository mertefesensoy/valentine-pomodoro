import { language } from '../../i18n';
import { requestSignIn } from '../../server/appleSignIn';
import { Offline, rpc, SessionEnded, signInWithIdToken } from '../../server/client';
import { reportToday } from '../../server/dayReports';
import { fetchHome, HOME_KEY, homeClient, homeRestored, refreshHome } from '../../server/home';
import { startPairedRuntime } from '../../server/runtime';
import type { HomeSnapshot } from '../../server/types';
import { appStorage } from '../../utils/appStorage';

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

/**
 * Asks Apple, signs in, and saves the first name at once, because Apple sends it only on the first sign-in.
 * Starts the paired runtime, since this person now has an account. A cancel is not a failure.
 */
export async function signIn(): Promise<SignInResult> {
    try {
        const apple = await requestSignIn();
        if (!apple) return 'cancelled';
        await signInWithIdToken({ identityToken: apple.identityToken, rawNonce: apple.rawNonce });
        await rpc('set_profile', {
            p_display_name: apple.firstName,
            p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            p_locale: language,
        });
        const home = await homeClient.fetchQuery({ queryKey: HOME_KEY, queryFn: fetchHome, staleTime: 0 });
        startPairedRuntime();
        return { needsName: !home.me?.display_name };
    } catch (error) {
        return statusOf(error) === 'offline' ? 'offline' : 'failed';
    }
}

export async function saveName(name: string): Promise<'ok' | 'invalid' | 'offline' | 'failed'> {
    try {
        const { status } = await rpc<{ status: string }>('set_profile', { p_display_name: name });
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

const isOpen = (invite: HomeSnapshot['invite']) => Boolean(invite && new Date(invite.expires_at).getTime() > Date.now());

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

/** The morph plays once per person, at their first pairing: pairing again with someone new doesn't replay it. */
export const CELEBRATED_KEY = 'pair_celebrated_v1';

export function markCelebrated(coupleId: string): void {
    appStorage.set(CELEBRATED_KEY, coupleId);
}

export function wasCelebrated(): boolean {
    return appStorage.getString(CELEBRATED_KEY) !== undefined;
}
