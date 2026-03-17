import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type QuietHours = { enabled: boolean; startHHMM: string; endHHMM: string };

function parseHHMM(hhmm: string) {
    const [h, m] = hhmm.split(':').map((x) => Number(x));
    return { h: Number.isFinite(h) ? h : 0, m: Number.isFinite(m) ? m : 0 };
}

function setTimeOnDate(d: Date, hhmm: string) {
    const { h, m } = parseHHMM(hhmm);
    const out = new Date(d);
    out.setHours(h, m, 0, 0);
    return out;
}

// Quiet hours can cross midnight (e.g., 22:00 -> 08:00)
export function isWithinQuietHours(now: Date, qh: QuietHours) {
    if (!qh.enabled) return false;

    const start = setTimeOnDate(now, qh.startHHMM);
    const end = setTimeOnDate(now, qh.endHHMM);

    // not crossing midnight
    if (start <= end) {
        return now >= start && now < end;
    }

    // crossing midnight: quiet is [start..24h) U [0..end)
    return now >= start || now < end;
}

// If reminder time lands inside quiet hours, shift to quiet end (today or tomorrow)
export function sanitizeReminderTime(timeHHMM: string, quiet: QuietHours): string {
    if (!quiet.enabled) return timeHHMM;

    // If reminder time is between quiet start and quiet end, push to quiet end.
    // This is purely time-of-day logic.
    const toMin = (hhmm: string) => {
        const { h, m } = parseHHMM(hhmm);
        return h * 60 + m;
    };

    const t = toMin(timeHHMM);
    const s = toMin(quiet.startHHMM);
    const e = toMin(quiet.endHHMM);

    if (s <= e) {
        // quiet: s..e
        if (t >= s && t < e) return quiet.endHHMM;
    } else {
        // quiet crosses midnight: [s..1440) U [0..e)
        if (t >= s || t < e) return quiet.endHHMM;
    }
    return timeHHMM;
}

export async function ensureNotificationPermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const req = await Notifications.requestPermissionsAsync();
    return Boolean(req.granted);
}

export async function configureAndroidChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: 'Daily Reminder',
        importance: Notifications.AndroidImportance.DEFAULT,
    });
}

export async function cancelScheduled(notificationId?: string | null) {
    if (!notificationId) return;
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
        // if it doesn't exist anymore, ignore
    }
}

export async function scheduleDailyReminder(opts: {
    timeHHMM: string;
    quietHours: QuietHours;
}): Promise<string> {
    await configureAndroidChannel();

    const timeHHMM = sanitizeReminderTime(opts.timeHHMM, opts.quietHours);

    // Expo supports calendar trigger for repeating daily notifications.
    const { h, m } = parseHHMM(timeHHMM);

    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Valentine Pomodoro 💗',
            body: 'A little focus session today?',
            sound: false,
            ...(Platform.OS === 'android' ? { channelId: 'daily-reminder' } : {}),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: h,
            minute: m,
        } as any,
    });

    return id;
}
