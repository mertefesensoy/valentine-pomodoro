// covers: FR-NTF-001, NFR-I18N-001
// The daily reminder: its words from the string files (D3 record §3.3) and the system's sound, so a
// locked phone hears it (the owner, 2026-11-01; D4 wiring record).
import * as Notifications from 'expo-notifications';

import { scheduleDailyReminder } from '../notifications';

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(async () => 'reminder-id'),
    setNotificationChannelAsync: jest.fn(async () => {}),
    AndroidImportance: { DEFAULT: 3 },
    SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

describe('the daily reminder', () => {
    it('asks in the app’s words, with the system’s sound, every day at its time', async () => {
        await expect(scheduleDailyReminder({ timeHHMM: '12:34', quietHours: { enabled: false, startHHMM: '22:00', endHHMM: '08:00' } })).resolves.toBe('reminder-id');
        const request = jest.mocked(Notifications.scheduleNotificationAsync).mock.calls[0][0];
        expect(request.content).toMatchObject({ title: 'Valentine Pomodoro 💗', body: 'A little focus session today?', sound: 'default' });
        expect(request.trigger).toMatchObject({ type: 'daily', hour: 12, minute: 34 });
    });
});
