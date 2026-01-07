import { useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

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

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: false, // We handle sound separately via expo-audio
                },
                trigger: { date: new Date(endAtMs), channelId: "timer" } as any,
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

    return { ensurePermissions, scheduleSessionEnd, cancelScheduled };
}

/**
 * Get notification content for phase
 */
export function getNotificationContent(phase: 'focus' | 'shortBreak' | 'longBreak'): { title: string; body: string } {
    if (phase === 'focus') {
        return {
            title: 'Focus complete 💗',
            body: 'Time for a sweet break',
        };
    } else {
        return {
            title: "Break's over 💘",
            body: 'Back to your goals',
        };
    }
}
