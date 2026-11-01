// covers: FR-NTF-001
// The long-standing notification bug (the owner, 2026-11-01): starting a focus showed "Time for a
// sweet break", and starting a break showed "Back to your goals". The session-end notification was
// scheduled with `{ date, channelId }`, a trigger with no `type`. expo-notifications (SDK 52 and
// later) reads a date trigger only from `{ type: 'date', date }`; anything else falls through to
// its default, which on iOS is `null`, meaning deliver now. So each phase's end-of-phase message
// arrived at its start (D2 record §3.18). These tests run the trigger the hook passes through the
// library's own parser.
import { renderHook, act } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { parseTrigger } from 'expo-notifications/build/scheduleNotificationAsync';
import { getNotificationContent, useNotifications } from '../useNotifications';

jest.mock('expo-notifications', () => ({
    ...jest.requireActual<object>('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    setNotificationChannelAsync: jest.fn(async () => null),
    scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
}));

const scheduled = () => jest.mocked(Notifications.scheduleNotificationAsync).mock.calls.at(-1)![0];

beforeEach(() => jest.mocked(Notifications.scheduleNotificationAsync).mockClear());

describe("a session's end notification", () => {
    it('is scheduled for the end of the session, not delivered at once', async () => {
        const { result } = await renderHook(() => useNotifications());
        const endAt = Date.now() + 25 * 60_000;
        let id: string | null = null;
        await act(async () => {
            id = await result.current.scheduleSessionEnd(endAt, 'Focus complete 💗', 'Time for a sweet break');
        });
        expect(id).toBe('notification-id');
        const request = scheduled();
        // What expo-notifications hands to iOS: a date trigger at the end, never null ("now").
        expect(parseTrigger(request.trigger)).toEqual({ type: 'date', timestamp: endAt, channelId: 'timer' });
        expect(request.content).toMatchObject({ title: 'Focus complete 💗', body: 'Time for a sweet break' });
        // The system's sound, so a locked phone hears it (the owner, D4 wiring).
        expect(request.content.sound).toBe('default');
    });

    it('is not scheduled for an end that has already passed', async () => {
        const { result } = await renderHook(() => useNotifications());
        await act(async () => {
            await result.current.scheduleSessionEnd(Date.now() - 1000, 'Focus complete 💗', 'Time for a sweet break');
        });
        expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
});

describe("each phase's end message", () => {
    it('says the focus is over at the end of a focus, and the break is over at the end of a break', () => {
        expect(getNotificationContent('focus')).toEqual({ title: 'Focus complete 💗', body: 'Time for a sweet break' });
        expect(getNotificationContent('shortBreak').body).toBe('Back to your goals');
        expect(getNotificationContent('longBreak').body).toBe('Back to your goals');
    });
});
