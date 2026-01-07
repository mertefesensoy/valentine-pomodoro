import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Save a value to AsyncStorage with JSON serialization
 */
export async function save<T>(key: string, value: T): Promise<void> {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
        console.error(`[Storage] Failed to save ${key}:`, error);
        throw error;
    }
}

/**
 * Load a value from AsyncStorage with JSON deserialization
 * Returns defaultValue if key doesn't exist or parsing fails
 */
export async function load<T>(key: string, defaultValue: T): Promise<T> {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue === null) {
            return defaultValue;
        }
        return JSON.parse(jsonValue) as T;
    } catch (error) {
        console.error(`[Storage] Failed to load ${key}, using default:`, error);
        return defaultValue;
    }
}

/**
 * Remove a value from AsyncStorage
 */
export async function remove(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key);
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
    GIFT_MODE: 'gift_mode',
    LOVE_NOTES: 'love_notes',
} as const;
