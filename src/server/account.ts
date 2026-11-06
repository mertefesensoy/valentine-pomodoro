import { create } from 'zustand';
import { isStorageMigrated } from '../utils/storageMigration';
import { loadSync, saveSync } from '../utils/storage';

/**
 * Whether this install has an account (Phase 2 C1, ADR-0049). This module imports no SDK, because it's
 * what a solo launch reads instead of loading the client: with this false, nothing touches the server
 * or the Keychain for pairing. It holds no token, which live only in the Keychain (client.ts).
 *
 * After a reinstall this flag is gone while the Keychain isn't, so the install is solo again until the
 * person chooses to pair, and signing in then finds their couple on the server.
 */
export const ACCOUNT_KEY = 'account_v1';
/** The account exists but this install's session was refused, so the person has to sign in again. */
export const SESSION_ENDED_KEY = 'account_session_ended_v1';
/** A deletion went to the server and no answer has come back. It changes nothing visible (accountActions.ts). */
export const DELETION_PENDING_KEY = 'account_deletion_pending_v1';

function readFlag(key: string): boolean {
    if (!isStorageMigrated()) return false;
    return loadSync<unknown>(key, false) === true;
}

/** For screens that re-render when a person signs in, or their session ends. A solo launch reads one key. */
export type AccountNotice = 'deleted' | 'unpaired';

export const useAccountStore = create<{ present: boolean; sessionEnded: boolean; notice: AccountNotice | null }>()(() => {
    const present = readFlag(ACCOUNT_KEY);
    return { present, sessionEnded: present && readFlag(SESSION_ENDED_KEY), notice: null };
});

export function hasAccount(): boolean {
    return readFlag(ACCOUNT_KEY);
}

export function setSessionEnded(on: boolean): void {
    // Only someone with an account can have a session end: after deletion, a call finding no session means nothing.
    if (on && !hasAccount()) return;
    saveSync(SESSION_ENDED_KEY, on);
    useAccountStore.setState({ sessionEnded: on });
}

export function setHasAccount(on: boolean): void {
    saveSync(ACCOUNT_KEY, on);
    if (on) {
        useAccountStore.setState({ present: true, notice: null });
        return;
    }
    // In one write with the flag: a session can't have ended for an account that isn't there, and a call failing as the
    // Keychain empties mustn't leave that behind.
    saveSync(SESSION_ENDED_KEY, false);
    useAccountStore.setState({ present: false, sessionEnded: false });
}

/** For the line at the top of Settings after leaving. Not persisted: it's for now, and for this launch. */
export function setAccountNotice(notice: AccountNotice | null): void {
    useAccountStore.setState({ notice });
}

export function isDeletionPending(): boolean {
    return readFlag(DELETION_PENDING_KEY);
}

export function setDeletionPending(on: boolean): void {
    saveSync(DELETION_PENDING_KEY, on);
}
