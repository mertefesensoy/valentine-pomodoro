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

function readFlag(key: string): boolean {
    if (!isStorageMigrated()) return false;
    return loadSync<unknown>(key, false) === true;
}

/** For screens that re-render when a person signs in, or their session ends. A solo launch reads one key. */
export const useAccountStore = create<{ present: boolean; sessionEnded: boolean }>()(() => {
    const present = readFlag(ACCOUNT_KEY);
    return { present, sessionEnded: present && readFlag(SESSION_ENDED_KEY) };
});

export function hasAccount(): boolean {
    return readFlag(ACCOUNT_KEY);
}

export function setSessionEnded(on: boolean): void {
    saveSync(SESSION_ENDED_KEY, on);
    useAccountStore.setState({ sessionEnded: on });
}

export function setHasAccount(on: boolean): void {
    saveSync(ACCOUNT_KEY, on);
    useAccountStore.setState({ present: on });
}
