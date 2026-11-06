import { useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { t } from "../i18n";
import { useSessionStore } from "../stores/sessionStore";
import type { SessionKind } from "../types";

/** How long starting or resuming a session waits for its end notification to be scheduled. */
const SCHEDULE_DEADLINE_MS = 1000;

/**
 * The newest schedule call for each kind of session. An id may stay on a running slot only if it
 * came from this call: an older one carries an end time from before a pause (DEF-005).
 */
const newestCall: Partial<Record<SessionKind, number>> = {};

export function useNotifications() {
    const ensurePermissions = useCallback(async (): Promise<boolean> => {
        const current = await Notifications.getPermissionsAsync();
        if (current.granted) return true;

        const requested = await Notifications.requestPermissionsAsync();
        return requested.granted;
    }, []);

    const ensureAndroidChannel = useCallback(async () => {
        if (Platform.OS !== "android") return;
        await Notifications.setNotificationChannelAsync("timer", {
            name: "Timer",
            importance: Notifications.AndroidImportance.HIGH,
        });
    }, []);

    const scheduleSessionEnd = useCallback(
        async (endAtMs: number, title: string, body: string): Promise<string | null> => {
            const ok = await ensurePermissions();
            if (!ok) return null;

            await ensureAndroidChannel();

            // Don't schedule if it's already in the past
            if (endAtMs <= Date.now() + 250) return null;

            // A date trigger must say so: expo-notifications (SDK 52 and later) reads one only from
            // `{ type: 'date', date }`. The old `{ date, channelId }` matched no trigger type and fell
            // through to null on iOS, "deliver now": each phase's end message arrived as it started
            // ("Time for a sweet break" when a focus began, the owner's long-standing bug, D2 record
            // §3.18).
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    // The system's own sound, so a locked phone hears a phase end (the owner, D4
                    // wiring). With the app open the handler (App.tsx) plays none: Classic's own
                    // sounds do (src/audio/uiSounds.ts).
                    sound: 'default',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: new Date(endAtMs),
                    channelId: "timer",
                },
            });

            return id;
        },
        [ensurePermissions, ensureAndroidChannel]
    );

    const cancelScheduled = useCallback(async (id: string | null) => {
        if (!id) return;
        try {
            await Notifications.cancelScheduledNotificationAsync(id);
        } catch {
            // Ignore: id may already have fired or been cleared
        }
    }, []);

    // An id that came back when nothing was waiting for it. Keep it on the slot if the slot is
    // still running on this call's end time, so a later pause can cancel it. Otherwise the person
    // has moved on (pause, skip, reset, a mode switch, or a newer call), so cancel it here.
    const keepOrCancel = useCallback(
        (kind: SessionKind, call: number, id: string) => {
            const { clock, setSlotExtras } = useSessionStore.getState();
            if (newestCall[kind] === call && clock[kind]?.isRunning) {
                setSlotExtras(kind, { scheduledNotificationId: id });
            } else {
                cancelScheduled(id).catch(console.warn);
            }
        },
        [cancelScheduled]
    );

    /**
     * For a session about to start. Resolves with the id if it comes back within the deadline, and
     * with null at the deadline if it hasn't, so a slow system can't hold the session up. An id that
     * comes back later goes through keepOrCancel (DEF-005). Rejects only if scheduling fails within
     * the deadline; a later failure is logged, since nothing is waiting for it.
     */
    const scheduleSlotEnd = useCallback(
        (kind: SessionKind, endAtMs: number, title: string, body: string) =>
            new Promise<string | null>((resolve, reject) => {
                const call = (newestCall[kind] ?? 0) + 1;
                newestCall[kind] = call;

                let late = false;
                const deadline = setTimeout(() => {
                    late = true;
                    resolve(null);
                }, SCHEDULE_DEADLINE_MS);

                scheduleSessionEnd(endAtMs, title, body).then(
                    (id) => {
                        if (!late) {
                            clearTimeout(deadline);
                            resolve(id);
                        } else if (id) {
                            keepOrCancel(kind, call, id);
                        }
                    },
                    (error) => {
                        if (!late) {
                            clearTimeout(deadline);
                            reject(error);
                        } else {
                            console.warn('Late notification scheduling failed:', error);
                        }
                    }
                );
            }),
        [scheduleSessionEnd, keepOrCancel]
    );

    /**
     * For a session that has just resumed, so its slot already exists. The same deadline, but the id
     * goes through keepOrCancel even when it's on time: the person can pause again within that time.
     */
    const rescheduleSlotEnd = useCallback(
        async (kind: SessionKind, endAtMs: number, title: string, body: string): Promise<void> => {
            const pending = scheduleSlotEnd(kind, endAtMs, title, body);
            const call = newestCall[kind] ?? 0; // scheduleSlotEnd set it before returning
            const id = await pending;
            if (id) keepOrCancel(kind, call, id);
        },
        [scheduleSlotEnd, keepOrCancel]
    );

    return { ensurePermissions, scheduleSessionEnd, scheduleSlotEnd, rescheduleSlotEnd, cancelScheduled };
}

/**
 * Fly's landing notification (moved here from FlyModeScreen in D2). Push-notification copy is
 * the one place emoji belong besides people's own notes (DESIGN.md), and this file holds it, so
 * the emoji check (`scripts/design/check-emoji.mjs`) allows this file.
 */
export const flightLandedContent = {
    title: `✈️ ${t('notifications.landed.title')}`,
    body: `${t('notifications.landed.body')} 💗`,
} as const;

/**
 * Get notification content for phase
 */
export function getNotificationContent(phase: 'focus' | 'shortBreak' | 'longBreak'): { title: string; body: string } {
    if (phase === 'focus') {
        return {
            title: `${t('notifications.focusDone.title')} 💗`,
            body: t('notifications.focusDone.body'),
        };
    } else {
        return {
            title: `${t('notifications.breakOver.title')} 💘`,
            body: t('notifications.breakOver.body'),
        };
    }
}
