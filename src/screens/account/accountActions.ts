import { Share } from 'react-native';
import { File, Paths } from 'expo-file-system';

import { isDeletionPending, setAccountNotice, setDeletionPending } from '../../server/account';
import { requestDeletionCode } from '../../server/appleSignIn';
import { invoke, Offline, rpc, SessionEnded } from '../../server/client';
import { forgetAccount } from '../../server/forgetAccount';
import { HOME_KEY, homeClient, refreshHome } from '../../server/home';
import { clearPartner } from '../../server/partnerGlance';
import type { HomeSnapshot } from '../../server/types';

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
    setAccountNotice('unpaired');
    // Not waited for: it's done, and VoiceOver shouldn't hear that late on a slow network.
    void refreshHome().catch(() => {});
    return 'ok';
}

export type DeleteResult = ActionResult | 'cancelled' | 'apple_failed';

/**
 * Deletes the account, after the caller's native alert: Apple's confirmation, then the server straight away, since
 * the code is single-use and lasts five minutes. Nothing here changes on this phone until the server says yes.
 *
 *   in : `onConfirmed`, called once Apple has said yes and the call is about to go, for saying so on screen.
 *   out: `cancelled` if the person changed their mind at Apple's sheet, and `apple_failed` if that sheet couldn't run.
 *        `ok` once this phone is solo. `delete-account` answers 401 only at its first step, before it spends the code,
 *        so the client's one retry of a 401 is safe. Apple refusing and the delete failing are `failed`, and trying
 *        again gets a fresh code.
 *
 * The marker says a deletion may have gone through with its answer lost, and only an answer clears it. So a later
 * refused session can be told apart from a real one: with the marker up from an earlier try, it means the account is
 * gone, and this phone should be solo, not asking someone to sign in to an account they deleted.
 */
export async function deleteAccount(onConfirmed?: () => void): Promise<DeleteResult> {
    let code: string | null;
    try {
        code = await requestDeletionCode();
    } catch {
        return 'apple_failed';
    }
    if (!code) return 'cancelled';
    onConfirmed?.();
    const answerLostBefore = isDeletionPending();
    setDeletionPending(true);
    try {
        await invoke('delete-account', { authorization_code: code });
    } catch (error) {
        if (error instanceof SessionEnded && answerLostBefore) {
            await forgetAccount();
            return 'ok';
        }
        // A lost answer leaves the question open, even if a snapshot cleared the marker while this was on its way. A real
        // answer only speaks for this try, so an earlier lost one stays open.
        setDeletionPending(error instanceof Offline || answerLostBefore);
        return statusOf(error);
    }
    await forgetAccount();
    return 'ok';
}

const EXPORT_NAME = 'valentine-pomodoro-data.json';

/**
 * Hands everything the server holds about you to the share sheet, as a JSON file, then removes the copy. iOS takes its
 * own copy when something is saved, so that's safe. It includes the notes you've received: your partner's words,
 * leaving at your choice. The row is disabled while this runs, so two can't share the one file name.
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
