import { useEffect } from 'react';
import { cancelScheduled, ensureNotificationPermission, scheduleDailyReminder } from '../utils/notifications';
import { useSettingsStore } from './settingsStore';

/**
 * Keeps the scheduled daily reminder in step with its settings (FR-NTF-002).
 * The effect useReminder ran inside AppProvider before Phase 1 B3, unchanged.
 *
 * While the reminder is enabled, every change of its time or quiet hours, and
 * the first run after hydration (each launch), cancels the old notification and
 * schedules a new one, then stores its id. If scheduling fails, the reminder
 * is switched off, so the switch never shows "on" with nothing scheduled.
 *
 * Mounted once, by StoreGate; `active` is false until the stores have hydrated.
 */
export function useReminderScheduler(active: boolean): void {
    const isReady = useSettingsStore((s) => s.isReady);
    const enabled = useSettingsStore((s) => s.reminder.enabled);
    const timeHHMM = useSettingsStore((s) => s.reminder.timeHHMM);
    const quietEnabled = useSettingsStore((s) => s.reminder.quietHours.enabled);
    const quietStart = useSettingsStore((s) => s.reminder.quietHours.startHHMM);
    const quietEnd = useSettingsStore((s) => s.reminder.quietHours.endHHMM);

    useEffect(() => {
        if (!active || !isReady || !enabled) return;

        let cancelled = false;
        (async () => {
            const { patchReminder } = useSettingsStore.getState();
            try {
                const ok = await ensureNotificationPermission();
                if (!ok) return;

                // cancel old -> schedule new
                await cancelScheduled(useSettingsStore.getState().reminder.notificationId);

                const id = await scheduleDailyReminder({
                    timeHHMM,
                    quietHours: { enabled: quietEnabled, startHHMM: quietStart, endHHMM: quietEnd },
                });

                if (cancelled) return;
                // only update if still enabled
                if (!useSettingsStore.getState().reminder.enabled) return;
                patchReminder({ notificationId: id });
            } catch (e) {
                console.error('[reminderScheduler] reschedule failed:', e);
                if (!cancelled) patchReminder({ enabled: false, notificationId: null });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [active, isReady, enabled, timeHHMM, quietEnabled, quietStart, quietEnd]);
}
