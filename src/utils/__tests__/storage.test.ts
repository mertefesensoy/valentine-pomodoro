import AsyncStorage from '@react-native-async-storage/async-storage';
import { appStorage } from '../appStorage';
import { MIGRATION_DONE, MIGRATION_FLAG_KEY } from '../storageMigration';
import { load, remove, save, STORAGE_KEYS } from '../storage';
import { AdPolicy } from '../../ads/AdPolicy';
import { V131_FULL, V131_FULL_ENTRIES } from '../../__fixtures__/storage/v131';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';

// Phase 1 task B2: the app's storage helpers keep their async API but read and
// write MMKV, and none of them touches MMKV before the one-time migration from
// AsyncStorage has finished.

const MISSING = Symbol('missing');

// The AsyncStorage Jest mock's methods are already jest.fn()s, so jest.spyOn
// returns them with earlier calls still counted; spies are cleared as taken.
beforeEach(async () => {
    await resetStorage();
    jest.restoreAllMocks();
});

// covers: FR-MIG-002
describe('storage on MMKV', () => {
    it('a first load after the update reads the v1.3.1 value, migrated', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);

        expect(await load(STORAGE_KEYS.SETTINGS, MISSING)).toStrictEqual(V131_FULL.settings);
        expect(appStorage.getString(MIGRATION_FLAG_KEY)).toBe(MIGRATION_DONE);
    });

    it('save writes MMKV and never AsyncStorage', async () => {
        const setItem = jest.spyOn(AsyncStorage, 'setItem').mockClear();

        await save(STORAGE_KEYS.APP_MODE, 'fly');

        expect(appStorage.getString(STORAGE_KEYS.APP_MODE)).toBe(JSON.stringify('fly'));
        expect(setItem).not.toHaveBeenCalled();
        expect(await AsyncStorage.getItem(STORAGE_KEYS.APP_MODE)).toBeNull();
    });

    it('a save made before the migration ran is not overwritten by the copy', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);
        const newer = { ...V131_FULL.settings, sound: !V131_FULL.settings.sound };

        await save(STORAGE_KEYS.SETTINGS, newer);

        expect(await load(STORAGE_KEYS.SETTINGS, MISSING)).toStrictEqual(newer);
    });

    it('remove deletes from MMKV only', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);

        await remove(STORAGE_KEYS.FLY_PREFS);

        expect(await load(STORAGE_KEYS.FLY_PREFS, MISSING)).toBe(MISSING);
        expect(await AsyncStorage.getItem(STORAGE_KEYS.FLY_PREFS)).toBe(JSON.stringify(V131_FULL.fly_prefs));
    });

    // AdPolicy loads its state once per module instance; this is the only test
    // in the file that touches it, so its first load is this install's.
    it('the ad policy reads its v1.3.1 counters through the migration', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);

        await AdPolicy.recordSessionCompletion();

        const stored = JSON.parse(appStorage.getString('ad_policy_v1')!);
        expect(stored).toEqual({
            ...V131_FULL.ad_policy_v1,
            sessionsSinceLastAd: V131_FULL.ad_policy_v1.sessionsSinceLastAd + 1,
        });
        expect(await AsyncStorage.getItem('ad_policy_v1')).toBe(JSON.stringify(V131_FULL.ad_policy_v1));
    });
});
