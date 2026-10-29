import { appStorage } from './appStorage';
import { ensureMigrated } from './storageMigration';

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
