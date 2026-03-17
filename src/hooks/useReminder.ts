import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { load, save, STORAGE_KEYS } from '../utils/storage';
import type { ReminderSettings } from '../types';
import {
    ensureNotificationPermission,
    cancelScheduled,
    scheduleDailyReminder,
} from '../utils/notifications';

const DEFAULT_REMINDER: ReminderSettings = {
    enabled: false,
    timeHHMM: '19:00',
    quietHours: { enabled: true, startHHMM: '22:00', endHHMM: '08:00' },
    notificationId: null,
};

export function useReminder() {
    const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER);
    const [isReady, setIsReady] = useState(false);

    // Phase 6: Side effect trigger (moved out of setState updaters)
    const [saveVersion, setSaveVersion] = useState(0);

    const saveChainRef = useRef(Promise.resolve());
    const enqueueSave = useCallback((data: ReminderSettings) => {
        saveChainRef.current = saveChainRef.current
            .then(() => save(STORAGE_KEYS.REMINDER_V1, data))
            .catch((e) => console.error('[useReminder] save failed', e));
    }, []);

    // Phase 6: Save effect (pure, triggered by version bump)
    useEffect(() => {
        if (saveVersion === 0) return; // Skip initial mount
        if (!isReady) return;
        enqueueSave(reminder);
    }, [saveVersion, reminder, isReady, enqueueSave]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const loaded = await load<ReminderSettings>(STORAGE_KEYS.REMINDER_V1, DEFAULT_REMINDER);
                if (cancelled) return;
                setReminder(loaded);
            } finally {
                if (!cancelled) setIsReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // --- public API: explicit enable/disable (gated) ---
    const enableDailyReminder = useCallback(async (): Promise<boolean> => {
        if (Platform.OS === 'web') {
            console.warn('[useReminder] Web does not support scheduled notifications.');
            return false;
        }

        const ok = await ensureNotificationPermission();
        if (!ok) return false;

        try {
            // schedule fresh
            const id = await scheduleDailyReminder({
                timeHHMM: reminder.timeHHMM,
                quietHours: reminder.quietHours,
            });

            // Debug probe must NEVER affect logic
            if (__DEV__) {
                try {
                    const all = await Notifications.getAllScheduledNotificationsAsync();
                    console.log('[useReminder] scheduled count:', all.length, all.map(n => n.identifier));
                } catch (e) {
                    console.warn('[useReminder] debug getAllScheduledNotificationsAsync failed (ignored):', e);
                }
            }

            // ✅ Only mark enabled if scheduling succeeded
            setReminder((prev) => ({ ...prev, enabled: true, notificationId: id }));
            setSaveVersion(v => v + 1);
            return true;
        } catch (e) {
            console.error('[useReminder] enableDailyReminder failed:', e);
            // Ensure state stays OFF if scheduling fails
            setReminder((prev) => ({ ...prev, enabled: false, notificationId: null }));
            setSaveVersion(v => v + 1);
            return false;
        }
    }, [reminder.timeHHMM, reminder.quietHours]);

    const disableDailyReminder = useCallback(async () => {
        const id = reminder.notificationId;
        await cancelScheduled(id);

        setReminder((prev) => {
            const next = { ...prev, enabled: false, notificationId: null };
            // ✅ Pure: trigger save outside updater
            return next;
        });

        setSaveVersion(v => v + 1);
    }, [reminder.notificationId]);

    // reschedule when time/quiet hours change while enabled
    useEffect(() => {
        if (!isReady) return;
        if (!reminder.enabled) return;

        let cancelled = false;
        (async () => {
            try {
                const ok = await ensureNotificationPermission();
                if (!ok) return;

                // cancel old -> schedule new
                await cancelScheduled(reminder.notificationId);

                const id = await scheduleDailyReminder({
                    timeHHMM: reminder.timeHHMM,
                    quietHours: reminder.quietHours,
                });

                if (cancelled) return;

                setReminder((prev) => {
                    // only update if still enabled
                    if (!prev.enabled) return prev;
                    const next = { ...prev, notificationId: id };
                    return next;
                });

                if (!cancelled) {
                    setSaveVersion(v => v + 1);
                }
            } catch (e) {
                console.error('[useReminder] reschedule failed:', e);
                if (!cancelled) {
                    setReminder((prev) => ({ ...prev, enabled: false, notificationId: null }));
                    setSaveVersion(v => v + 1);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isReady,
        reminder.enabled,
        reminder.timeHHMM,
        reminder.quietHours.enabled,
        reminder.quietHours.startHHMM,
        reminder.quietHours.endHHMM,
    ]);

    const setReminderTimeHHMM = useCallback(
        (timeHHMM: string) => {
            setReminder((prev) => {
                const next = { ...prev, timeHHMM };
                // ✅ Pure: trigger save outside updater
                return next;
            });
            setSaveVersion(v => v + 1);
        },
        []
    );

    const setQuietHours = useCallback(
        (quietHours: ReminderSettings['quietHours']) => {
            setReminder((prev) => {
                const next = { ...prev, quietHours };
                // ✅ Pure: trigger save outside updater
                return next;
            });
            setSaveVersion(v => v + 1);
        },
        []
    );

    return {
        isReady,
        reminder,
        enableDailyReminder,
        disableDailyReminder,
        setReminderTimeHHMM,
        setQuietHours,
    };
}
