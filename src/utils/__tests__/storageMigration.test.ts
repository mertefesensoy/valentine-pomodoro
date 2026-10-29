import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';
import { appStorage } from '../appStorage';
import {
    MIGRATION_DONE,
    MIGRATION_FLAG_KEY,
    ensureMigrated,
    migrateAsyncStorage,
    type MigrationTarget,
} from '../storageMigration';
import { V131_DEFAULT_LOVE_NOTES as FROZEN_V131_NOTES } from '../../constants/legacyLoveNotes';
import {
    CORRUPT_SESSION_CLOCK_ENTRIES,
    FRESH_INSTALL_ENTRIES,
    NOTES_NEVER_EDITED_ENTRIES,
    STATS_V1_USER_ENTRIES,
    TORN_SESSION_CLOCK,
    V131_DEFAULT_LOVE_NOTES,
    V131_FULL,
    V131_FULL_ENTRIES,
    type RawEntries,
} from '../../__fixtures__/storage/v131';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';

// Phase 1 task B2: the one-time copy of every AsyncStorage key into MMKV, tested
// against every A3 fixture. MMKV runs on its in-memory Jest implementation.

const LOVE_NOTES = 'love_notes';
const V131_NOTES_TEXT = JSON.stringify(V131_DEFAULT_LOVE_NOTES);

const FIXTURES: [name: string, entries: RawEntries][] = [
    ['v1.3.1 full install', V131_FULL_ENTRIES],
    ['notes never edited', NOTES_NEVER_EDITED_ENTRIES],
    ['corrupt session_clock', CORRUPT_SESSION_CLOCK_ENTRIES],
    ['stats v1 user (1.0.0 install)', STATS_V1_USER_ENTRIES],
    ['fresh install', FRESH_INSTALL_ENTRIES],
];

type Store = { getAllKeys(): string[]; getString(key: string): string | undefined };

/** Every key and its text, so two stores can be compared with toEqual. */
function contents(store: Store): Record<string, string | undefined> {
    return Object.fromEntries([...store.getAllKeys()].sort().map((k) => [k, store.getString(k)]));
}

async function asyncStorageContents(): Promise<Record<string, string | null>> {
    const keys = [...(await AsyncStorage.getAllKeys())].sort();
    return Object.fromEntries(await AsyncStorage.multiGet(keys));
}

/** What a run that never crashed leaves behind, in a store of its own. */
async function cleanRunResult(): Promise<Record<string, string | undefined>> {
    const reference = createMMKV({ id: `reference-${Math.random()}` });
    await migrateAsyncStorage(reference);
    return contents(reference);
}

/** appStorage, except that writing `failOnKey` (or the nth write) throws, like a crash at that point. */
function crashingTarget(crashAt: { key: string } | { nthWrite: number }): MigrationTarget {
    let writes = 0;
    return {
        getString: (key) => appStorage.getString(key),
        set: (key, value) => {
            writes += 1;
            if ('key' in crashAt ? key === crashAt.key : writes === crashAt.nthWrite) {
                throw new Error('simulated crash');
            }
            appStorage.set(key, value);
        },
    };
}

// The AsyncStorage Jest mock's methods are already jest.fn()s, so jest.spyOn
// returns them with every earlier call (seeding included) still counted; each
// spy here is cleared as it is taken.
beforeEach(async () => {
    await resetStorage();
    jest.restoreAllMocks();
});

describe.each(FIXTURES)('%s', (_name, entries) => {
    beforeEach(async () => {
        await AsyncStorage.multiSet(entries);
    });

    it('copies every key with its exact text, and writes the flag', async () => {
        await expect(migrateAsyncStorage(appStorage)).resolves.toBe('migrated');

        for (const [key, value] of entries) {
            expect(appStorage.getString(key)).toBe(value);
        }
        expect(appStorage.getString(MIGRATION_FLAG_KEY)).toBe(MIGRATION_DONE);
    });

    it('leaves AsyncStorage exactly as it was', async () => {
        const before = await asyncStorageContents();
        const writes = [
            jest.spyOn(AsyncStorage, 'setItem').mockClear(),
            jest.spyOn(AsyncStorage, 'multiSet').mockClear(),
            jest.spyOn(AsyncStorage, 'removeItem').mockClear(),
            jest.spyOn(AsyncStorage, 'multiRemove').mockClear(),
            jest.spyOn(AsyncStorage, 'mergeItem').mockClear(),
            jest.spyOn(AsyncStorage, 'clear').mockClear(),
        ];

        await migrateAsyncStorage(appStorage);

        for (const write of writes) expect(write).not.toHaveBeenCalled();
        expect(await asyncStorageContents()).toEqual(before);
    });

    it('a second run reads nothing and changes nothing', async () => {
        await migrateAsyncStorage(appStorage);
        const afterFirst = contents(appStorage);
        const getAllKeys = jest.spyOn(AsyncStorage, 'getAllKeys').mockClear();
        const set = jest.spyOn(appStorage, 'set');

        await expect(migrateAsyncStorage(appStorage)).resolves.toBe('already-done');

        expect(getAllKeys).not.toHaveBeenCalled();
        expect(set).not.toHaveBeenCalled();
        expect(contents(appStorage)).toEqual(afterFirst);
    });

    it('a crash between the copy and the flag re-runs to the same result', async () => {
        const expected = await cleanRunResult();

        await expect(migrateAsyncStorage(crashingTarget({ key: MIGRATION_FLAG_KEY }))).rejects.toThrow('simulated crash');
        expect(appStorage.getString(MIGRATION_FLAG_KEY)).toBeUndefined();

        await expect(migrateAsyncStorage(appStorage)).resolves.toBe('migrated');
        expect(contents(appStorage)).toEqual(expected);
    });
});

describe('a crash part-way through the copy', () => {
    it('leaves no flag, and the re-run gives the same result as a clean run', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);
        const expected = await cleanRunResult();

        await expect(migrateAsyncStorage(crashingTarget({ nthWrite: 5 }))).rejects.toThrow('simulated crash');
        expect(appStorage.getString(MIGRATION_FLAG_KEY)).toBeUndefined();
        expect(appStorage.getAllKeys()).toHaveLength(4);

        await migrateAsyncStorage(appStorage);
        expect(contents(appStorage)).toEqual(expected);
    });
});

describe('the Bengisu rule: existing installs keep the v1.3.1 default notes', () => {
    it('the frozen notes are the v1.3.1 set the A3 fixture extracted from the release branch', () => {
        expect(FROZEN_V131_NOTES).toEqual(V131_DEFAULT_LOVE_NOTES);
        expect(FROZEN_V131_NOTES).toHaveLength(20);
    });

    it('a v1.3.1 install that never edited its notes gets the v1.3.1 defaults written', async () => {
        await AsyncStorage.multiSet(NOTES_NEVER_EDITED_ENTRIES);
        await migrateAsyncStorage(appStorage);

        expect(appStorage.getString(LOVE_NOTES)).toBe(V131_NOTES_TEXT);
        expect(await AsyncStorage.getItem(LOVE_NOTES)).toBeNull();
    });

    it('a 1.0.0 install, with only pre-1.2 keys, counts as existing too', async () => {
        await AsyncStorage.multiSet(STATS_V1_USER_ENTRIES);
        await migrateAsyncStorage(appStorage);

        expect(appStorage.getString(LOVE_NOTES)).toBe(V131_NOTES_TEXT);
    });

    it('edited notes are copied as they are, never replaced', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);
        await migrateAsyncStorage(appStorage);

        expect(JSON.parse(appStorage.getString(LOVE_NOTES)!)).toEqual(V131_FULL.love_notes);
        expect(appStorage.getString(LOVE_NOTES)).not.toBe(V131_NOTES_TEXT);
    });

    it('a fresh install gets no notes key, so the app shows its current defaults', async () => {
        await migrateAsyncStorage(appStorage);

        expect(appStorage.getAllKeys()).toEqual([MIGRATION_FLAG_KEY]);
    });
});

describe('corrupt JSON', () => {
    it('is copied as-is; the migrator never parses values', async () => {
        await AsyncStorage.multiSet(CORRUPT_SESSION_CLOCK_ENTRIES);
        await migrateAsyncStorage(appStorage);

        expect(appStorage.getString('session_clock')).toBe(TORN_SESSION_CLOCK);
    });
});

describe('ensureMigrated', () => {
    it('runs the migration once for concurrent callers', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);
        const getAllKeys = jest.spyOn(AsyncStorage, 'getAllKeys').mockClear();

        await Promise.all([ensureMigrated(), ensureMigrated(), ensureMigrated()]);

        expect(getAllKeys).toHaveBeenCalledTimes(1);
        expect(appStorage.getString(MIGRATION_FLAG_KEY)).toBe(MIGRATION_DONE);
    });

    it('touches AsyncStorage no more once the flag is set', async () => {
        await ensureMigrated();
        const getAllKeys = jest.spyOn(AsyncStorage, 'getAllKeys').mockClear();

        await ensureMigrated();

        expect(getAllKeys).not.toHaveBeenCalled();
    });

    it('a failed migration is logged, not thrown, and the next call tries again', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(AsyncStorage, 'getAllKeys').mockRejectedValueOnce(new Error('storage unavailable'));

        await expect(ensureMigrated()).resolves.toBeUndefined();
        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(appStorage.getString(MIGRATION_FLAG_KEY)).toBeUndefined();

        await ensureMigrated();
        expect(appStorage.getString(MIGRATION_FLAG_KEY)).toBe(MIGRATION_DONE);
        expect(appStorage.getString('settings')).toBe(JSON.stringify(V131_FULL.settings));
    });
});
