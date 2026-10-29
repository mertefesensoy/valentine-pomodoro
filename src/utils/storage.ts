import { appStorage } from './appStorage';
import { ensureMigrated, isStorageMigrated } from './storageMigration';

// From v1.4 the app's data lives in MMKV (Phase 1 task B2). These helpers keep
// the async API the hooks already use; each one first awaits the one-time copy
// from v1.3.1's AsyncStorage, so nothing reads MMKV before the copy has
// finished, and no write can be overwritten by it. Values are JSON text, the
// same as v1.3.1 wrote, so migrated keys read back unchanged.

/**
 * Save a value as JSON
 */
export async function save<T>(key: string, value: T): Promise<void> {
    await ensureMigrated();
    try {
        appStorage.set(key, JSON.stringify(value));
    } catch (error) {
        console.error(`[Storage] Failed to save ${key}:`, error);
        throw error;
    }
}

/**
 * Load a JSON value
 * Returns defaultValue if key doesn't exist or parsing fails
 */
export async function load<T>(key: string, defaultValue: T): Promise<T> {
    await ensureMigrated();
    try {
        const jsonValue = appStorage.getString(key);
        if (jsonValue === undefined) {
            return defaultValue;
        }
        return JSON.parse(jsonValue) as T;
    } catch (error) {
        console.error(`[Storage] Failed to load ${key}, using default:`, error);
        return defaultValue;
    }
}

/**
 * Synchronous load, for the stores' hydration (Phase 1 B3). Same JSON format
 * and fallbacks as load(): a missing key or corrupt JSON returns defaultValue,
 * and corrupt JSON is logged.
 *
 * Reads nothing until the one-time migration has finished (the B2 invariant):
 * before that it returns defaultValue. StoreGate only hydrates once
 * isStorageMigrated() holds, so in the app this branch is never taken.
 */
export function loadSync<T>(key: string, defaultValue: T): T {
    if (!isStorageMigrated()) {
        console.error(`[Storage] loadSync(${key}) before the migration finished; using default`);
        return defaultValue;
    }
    try {
        const jsonValue = appStorage.getString(key);
        if (jsonValue === undefined) {
            return defaultValue;
        }
        return JSON.parse(jsonValue) as T;
    } catch (error) {
        console.error(`[Storage] Failed to load ${key}, using default:`, error);
        return defaultValue;
    }
}

/**
 * Save a value as JSON, synchronously once the migration has finished.
 *
 * Before the migration flag exists, a direct MMKV write could be overwritten
 * by the copy (the B2 invariant), so the write is handed to save(), which waits
 * for it. Such writes keep their call order: each one awaits the same
 * migration promise, and its continuation runs in the order they were queued.
 *
 * Never throws: a failed write is logged, as the hooks before B3 did with
 * save()'s rejection.
 */
export function saveSync<T>(key: string, value: T): void {
    if (!isStorageMigrated()) {
        save(key, value).catch((error) => {
            console.error(`[Storage] Failed to save ${key}:`, error);
        });
        return;
    }
    try {
        appStorage.set(key, JSON.stringify(value));
    } catch (error) {
        console.error(`[Storage] Failed to save ${key}:`, error);
    }
}

/**
 * Remove a value
 */
export async function remove(key: string): Promise<void> {
    await ensureMigrated();
    try {
        appStorage.remove(key);
    } catch (error) {
        console.error(`[Storage] Failed to remove ${key}:`, error);
        throw error;
    }
}

/**
 * Storage keys (centralized to avoid typos)
 */
export const STORAGE_KEYS = {
    TIMER_STATE: 'timer_state',
    SETTINGS: 'settings',
    STATS: 'stats',
    STATS_V2: 'stats_v2',
    GIFT_MODE: 'gift_mode',
    LOVE_NOTES: 'love_notes',
    UPDATE_META: 'update_meta', // { lastCheckAt: number, lastPromptedVersion: string | null }
    REMINDER_V1: 'reminder_v1',
    APP_MODE: 'app_mode',
    FLY_SESSION: 'fly_session',  // deprecated — clock state now in SESSION_CLOCK
    SESSION_CLOCK: 'session_clock',  // unified two-slot clock state (pomodoro + fly)
    FLY_PREFS: 'fly_prefs',         // user camera-mode preference (survives resets)
} as const;
