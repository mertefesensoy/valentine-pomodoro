import { Share } from 'react-native';
import { File, Paths } from 'expo-file-system';

import { setHasAccount, setJustDeleted } from '../../server/account';
import { requestDeletionCode } from '../../server/appleSignIn';
import { clearSession, invoke, Offline, rpc, SessionEnded } from '../../server/client';
import { PENDING_KEY } from '../../server/dayReports';
import { clearHome, HOME_KEY, homeClient, refreshHome } from '../../server/home';
import { clearPartner } from '../../server/partnerGlance';
import type { HomeSnapshot } from '../../server/types';
import { appStorage } from '../../utils/appStorage';

/**
 * What the account's rows do (Phase 2 D4). Reached only through the lazy groups, so a solo launch evaluates none of
 * this. Nothing here throws: the screen shows a status.
 */

export type ActionResult = 'ok' | 'offline' | 'session_ended' | 'failed';

function statusOf(error: unknown): Exclude<ActionResult, 'ok'> {
    if (error instanceof Offline) return 'offline';
    if (error instanceof SessionEnded) return 'session_ended';
    return 'failed';
}

/**
 * Unpairs, for you and your partner, on the server's word only.
 *   out: `ok` also for `not_paired`, since that's what was asked. Then your partner leaves this phone at once, with no
 *        "gone" line, because you did this yourself, and a fetch already on its way can't bring them back. The
 *        snapshot keeps `me`, so your name still shows if the refresh after it fails. The account stays.
 */
export async function unpairPartner(): Promise<ActionResult> {
    try {
        const { status } = await rpc<{ status: string }>('unpair');
        if (status !== 'ok' && status !== 'not_paired') return 'failed';
    } catch (error) {
        return statusOf(error);
    }
    clearPartner();
    await homeClient.cancelQueries({ queryKey: HOME_KEY });
    homeClient.setQueryData<HomeSnapshot>(HOME_KEY, (old) =>
        old ? { ...old, couple: null, partner: null, partner_today: null, partner_updated_at: null, notes: [] } : old,
    );
    await refreshHome().catch(() => {});
    return 'ok';
}

/** One step of forgetting an account: the account is already gone, so a failure here mustn't stop the next. */
async function attempt(step: () => unknown): Promise<void> {
    try {
        await step();
    } catch {
        // Whatever this held is about an account that no longer exists.
    }
}

/**
 * Leaves this phone solo, after the server has deleted the account. The account flag goes last, because it's what
 * flips the screens, and everything they read has to be gone by then. Your stats and notes aren't touched, and nor is
 * `pair_celebrated_v1`, since the morph is once per person.
 */
async function forgetAccount(): Promise<void> {
    await attempt(() => clearPartner());
    await attempt(() => homeClient.cancelQueries({ queryKey: HOME_KEY }));
    await attempt(() => clearHome());
    await attempt(() => appStorage.remove(PENDING_KEY));
    await attempt(() => clearSession());
    setJustDeleted(true);
    setHasAccount(false);
}

export type DeleteResult = ActionResult | 'cancelled';

/**
 * Deletes the account, after the caller's native alert: Apple's confirmation, then the server straight away, since
 * the code is single-use and lasts five minutes. Nothing here changes on this phone until the server says yes.
 *   out: `cancelled` if the person changed their mind at Apple's sheet; `ok` once this phone is solo. `delete-account`
 *        answers 401 only at its first step, before it spends the code, so the client's one retry of a 401 is safe.
 *        Apple refusing (502) and the delete failing (500) are `failed`, and trying again gets a fresh code.
 */
export async function deleteAccount(): Promise<DeleteResult> {
    let code: string | null;
    try {
        code = await requestDeletionCode();
    } catch {
        return 'failed';
    }
    if (!code) return 'cancelled';
    try {
        await invoke('delete-account', { authorization_code: code });
    } catch (error) {
        return statusOf(error);
    }
    await forgetAccount();
    return 'ok';
}

const EXPORT_NAME = 'valentine-pomodoro-data.json';

/**
 * Hands everything the server holds about you to the share sheet, as a JSON file, then removes the copy. iOS takes its
 * own copy when something is saved, so that's safe. It includes the notes you've received: your partner's words,
 * leaving at your choice.
 */
export async function downloadMyData(): Promise<ActionResult> {
    let file: File | null = null;
    try {
        const data = await rpc<unknown>('export_my_data');
        file = new File(Paths.cache, EXPORT_NAME);
        file.create({ overwrite: true });
        file.write(JSON.stringify(data, null, 2));
        await Share.share({ url: file.uri });
        return 'ok';
    } catch (error) {
        return statusOf(error);
    } finally {
        try {
            file?.delete();
        } catch {
            // It's in the cache, which the system clears.
        }
    }
}
