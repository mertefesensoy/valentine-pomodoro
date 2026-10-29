import { createMMKV } from 'react-native-mmkv';

/**
 * The app's key-value store from v1.4 on: MMKV's default instance
 * (`mmkv.default`), synchronous and in native memory (Phase 1 task B2).
 *
 * Read and write it through src/utils/storage.ts, which waits for the one-time
 * migration from AsyncStorage first. The migrator (storageMigration.ts) is the
 * only other writer. Under Jest, react-native-mmkv returns an in-memory mock.
 */
export const appStorage = createMMKV();
