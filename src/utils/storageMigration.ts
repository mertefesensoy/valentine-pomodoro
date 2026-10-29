import AsyncStorage from '@react-native-async-storage/async-storage';
import { appStorage } from './appStorage';
import { V131_DEFAULT_LOVE_NOTES } from '../constants/legacyLoveNotes';

// The one-time copy of v1.3.1's AsyncStorage into MMKV (Phase 1 task B2).
//
// Order of writes, which is what makes a crash at any point safe:
//   1. every AsyncStorage key, its text copied unparsed
//   2. the v1.3.1 default notes, for an existing install that never edited them
//   3. the flag, LAST
// Until the flag exists the next launch simply runs all of it again, and every
// write is idempotent. AsyncStorage itself is never written or cleared: it stays
// as v1.3.1 left it for one release, so a rollback build still finds its data.

export const MIGRATION_FLAG_KEY = 'migration.asyncstorage_v1';
export const MIGRATION_DONE = 'done';

const LOVE_NOTES_KEY = 'love_notes';

/**
 * Every key an install of v1.3.1 or earlier can hold. Any one of them present
 * means "existing install", including a lapsed 1.0.x install that holds only
 * pre-1.2 keys (`timer_state`, `settings`, `stats`).
 */
export const V131_STORAGE_KEYS: readonly string[] = [
    'timer_state',
    'settings',
    'stats',
    'stats_v2',
    'gift_mode',
    LOVE_NOTES_KEY,
    'update_meta',
    'reminder_v1',
    'app_mode',
    'fly_session',
    'session_clock',
    'fly_prefs',
    'ad_policy_v1',
];

/** The two MMKV calls the migrator needs; a test can wrap them to simulate a crash. */
export interface MigrationTarget {
    getString(key: string): string | undefined;
    set(key: string, value: string): void;
}

/** The two AsyncStorage reads the migrator needs. */
export interface MigrationSource {
    getAllKeys(): Promise<readonly string[]>;
    multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
}

export type MigrationOutcome = 'already-done' | 'migrated';

/**
 * Copies every AsyncStorage key into `target`, then writes the flag.
 *
 * - If `target` already holds the flag: reads nothing, writes nothing,
 *   resolves `'already-done'`.
 * - Otherwise: copies each key's text exactly, without parsing, so corrupt
 *   JSON stays corrupt and is handled where it is read, as in v1.3.1. Then it
 *   applies the notes rule, writes the flag, and resolves `'migrated'`.
 * - **Notes rule (approved 2026-10-29):** if the source holds any v1.3.1 key
 *   but no `love_notes`, it writes the v1.3.1 default notes. A fresh install
 *   (no v1.3.1 key) gets no notes key, so the app's current defaults apply.
 * - Never writes to `source`.
 * - Rejects if a read or a write throws; the flag is then not written.
 */
export async function migrateAsyncStorage(
    target: MigrationTarget,
    source: MigrationSource = AsyncStorage,
): Promise<MigrationOutcome> {
    if (target.getString(MIGRATION_FLAG_KEY) === MIGRATION_DONE) return 'already-done';

    const keys = await source.getAllKeys();
    const entries = keys.length > 0 ? await source.multiGet(keys) : [];

    let isExistingInstall = false;
    let hasLoveNotes = false;
    for (const [key, value] of entries) {
        if (value === null) continue;
        target.set(key, value);
        if (V131_STORAGE_KEYS.includes(key)) isExistingInstall = true;
        if (key === LOVE_NOTES_KEY) hasLoveNotes = true;
    }

    if (isExistingInstall && !hasLoveNotes) {
        target.set(LOVE_NOTES_KEY, JSON.stringify(V131_DEFAULT_LOVE_NOTES));
    }

    target.set(MIGRATION_FLAG_KEY, MIGRATION_DONE);
    return 'migrated';
}

/**
 * True once the one-time copy has finished, i.e. the flag is in MMKV. A
 * synchronous MMKV read. The stores hydrate synchronously only when this holds
 * (Phase 1 B3); otherwise they wait for ensureMigrated().
 */
export function isStorageMigrated(): boolean {
    return appStorage.getString(MIGRATION_FLAG_KEY) === MIGRATION_DONE;
}

let inFlight: Promise<void> | null = null;

/**
 * Resolves once the app's store (`appStorage`) has been migrated. Every read
 * and write in storage.ts awaits it, so nothing touches MMKV before the copy
 * finishes, and a copy can never overwrite a newer value.
 *
 * - Fast path: the flag is read from MMKV on every call (synchronous). There is
 *   no module-level "done" boolean, so clearing MMKV starts over.
 * - Concurrent callers share one migration.
 * - Never rejects. A failure is logged and leaves no flag, so the next launch
 *   tries again. This launch then runs on whatever MMKV holds, which is what
 *   v1.3.1 does when AsyncStorage fails: its loads fall back to the defaults.
 */
export function ensureMigrated(): Promise<void> {
    if (isStorageMigrated()) return Promise.resolve();
    if (!inFlight) {
        inFlight = migrateAsyncStorage(appStorage)
            .then(
                () => undefined,
                (error) => {
                    console.error('[storageMigration] AsyncStorage → MMKV migration failed; will retry next launch:', error);
                },
            )
            .finally(() => {
                inFlight = null;
            });
    }
    return inFlight;
}
