import AsyncStorage from '@react-native-async-storage/async-storage';
import { appStorage } from '../../utils/appStorage';

/**
 * Empties both stores a test can see: the v1.3.1 AsyncStorage and the app's
 * MMKV (Phase 1 task B2). Clearing MMKV also clears the migration flag, so the
 * next storage read migrates again from whatever the test puts in AsyncStorage,
 * the way a first launch after the update does.
 *
 * Test-only. Both stores are module singletons that live for one test file.
 */
export async function resetStorage(): Promise<void> {
    await AsyncStorage.clear();
    appStorage.clearAll();
}
