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

function readFlag(): boolean {
    if (!isStorageMigrated()) return false;
    return loadSync<unknown>(ACCOUNT_KEY, false) === true;
}

/** For screens that re-render when a person signs in. */
export const useAccountStore = create<{ present: boolean }>()(() => ({ present: readFlag() }));

export function hasAccount(): boolean {
    return readFlag();
}

export function setHasAccount(on: boolean): void {
    saveSync(ACCOUNT_KEY, on);
    useAccountStore.setState({ present: on });
}
