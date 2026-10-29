import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { create } from 'zustand';
import type { ReminderSettings, Settings } from '../types';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import { loadSync, saveSync, STORAGE_KEYS } from '../utils/storage';
import { cancelScheduled, ensureNotificationPermission, scheduleDailyReminder } from '../utils/notifications';
import { isRecord } from './isRecord';

// The settings store (Phase 1 B3): the user's settings (`settings`) and the
// daily reminder (`reminder_v1`). Replaces the useSettings and useReminder hooks
// that AppProvider hosted. Same keys and JSON shapes as v1.3.1.
//
// The reminder's reschedule-on-change effect is not here: it is a side effect
// of the reminder's fields changing, so it lives in useReminderScheduler(),
// which StoreGate mounts once.

export const DEFAULT_REMINDER: ReminderSettings = {
    enabled: false,
    timeHHMM: '19:00',
    quietHours: { enabled: true, startHHMM: '22:00', endHHMM: '08:00' },
    notificationId: null,
};

/** Defaults first, the stored value over them, `durations` merged one level down. */
function mergeSettings(base: Settings, patch: Record<string, unknown>): Settings {
    const durations = isRecord(patch.durations) ? patch.durations : {};
    return {
        ...base,
        ...patch,
        durations: { ...base.durations, ...durations },
    } as Settings;
}

function mergeReminder(stored: Record<string, unknown>): ReminderSettings {
    const quietHours = isRecord(stored.quietHours) ? stored.quietHours : {};
    return {
        ...DEFAULT_REMINDER,
        ...stored,
        quietHours: { ...DEFAULT_REMINDER.quietHours, ...quietHours },
    } as ReminderSettings;
}

export interface SettingsStore {
    settings: Settings;
    reminder: ReminderSettings;
    /** True once hydrate() has run. Everything below StoreGate sees true. */
    isReady: boolean;

    /** Reads both keys from MMKV synchronously. Never throws. */
    hydrate(): void;
    /** Merges `patch` (durations one level deep) and persists. */
    updateSettings(patch: Partial<Settings>): void;

    /** Asks for permission and schedules the daily reminder. Resolves false if either fails. */
    enableDailyReminder(): Promise<boolean>;
    disableDailyReminder(): Promise<void>;
    setReminderTimeHHMM(timeHHMM: string): void;
    setQuietHours(quietHours: ReminderSettings['quietHours']): void;
    /** Merges `patch` into the reminder and persists. Used by the scheduler. */
    patchReminder(patch: Partial<ReminderSettings>): void;
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
    settings: DEFAULT_SETTINGS,
    reminder: DEFAULT_REMINDER,
    isReady: false,

    hydrate() {
        try {
            const storedSettings = loadSync<unknown>(STORAGE_KEYS.SETTINGS, null);
            const storedReminder = loadSync<unknown>(STORAGE_KEYS.REMINDER_V1, null);
            set({
                settings: mergeSettings(DEFAULT_SETTINGS, isRecord(storedSettings) ? storedSettings : {}),
                reminder: isRecord(storedReminder) ? mergeReminder(storedReminder) : DEFAULT_REMINDER,
                isReady: true,
            });
        } catch (error) {
            console.error('[settingsStore] hydrate failed; using defaults:', error);
            set({ settings: DEFAULT_SETTINGS, reminder: DEFAULT_REMINDER, isReady: true });
        }
    },

    updateSettings(patch) {
        const settings = mergeSettings(get().settings, patch);
        set({ settings });
        saveSync(STORAGE_KEYS.SETTINGS, settings);
    },

    async enableDailyReminder() {
        if (Platform.OS === 'web') {
            console.warn('[settingsStore] Web does not support scheduled notifications.');
            return false;
        }

        const ok = await ensureNotificationPermission();
        if (!ok) return false;

        try {
            const { timeHHMM, quietHours } = get().reminder;
            const id = await scheduleDailyReminder({ timeHHMM, quietHours });

            // Debug probe must NEVER affect logic
            if (__DEV__) {
                try {
                    const all = await Notifications.getAllScheduledNotificationsAsync();
                    console.log('[settingsStore] scheduled count:', all.length, all.map((n) => n.identifier));
                } catch (e) {
                    console.warn('[settingsStore] debug getAllScheduledNotificationsAsync failed (ignored):', e);
                }
            }

            // Only mark enabled if scheduling succeeded
            get().patchReminder({ enabled: true, notificationId: id });
            return true;
        } catch (e) {
            console.error('[settingsStore] enableDailyReminder failed:', e);
            // Ensure state stays OFF if scheduling fails
            get().patchReminder({ enabled: false, notificationId: null });
            return false;
        }
    },

    async disableDailyReminder() {
        await cancelScheduled(get().reminder.notificationId);
        get().patchReminder({ enabled: false, notificationId: null });
    },

    setReminderTimeHHMM(timeHHMM) {
        get().patchReminder({ timeHHMM });
    },

    setQuietHours(quietHours) {
        get().patchReminder({ quietHours });
    },

    patchReminder(patch) {
        const reminder = { ...get().reminder, ...patch };
        set({ reminder });
        saveSync(STORAGE_KEYS.REMINDER_V1, reminder);
    },
}));
