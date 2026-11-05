// covers: FR-NTF-001
// DEF-005: scheduling a session's end notification is raced against a 1 s timeout, so that a slow
// system can't hold up the start of a session. When the timeout won, the slot recorded null and the
// id was thrown away when it arrived, so that notification could never be cancelled, and a paused or
// skipped session could still alert. These tests make scheduling slow and run the real session store.
import { act, renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useSessionState } from '../useSessionClock';
import { useNotifications } from '../useNotifications';
import { useTimer } from '../useTimer';
import { useSessionStore } from '../../stores/sessionStore';
import { DEFAULT_SETTINGS } from '../../constants/defaults';

jest.mock('expo-notifications', () => ({
    ...jest.requireActual<object>('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    setNotificationChannelAsync: jest.fn(async () => null),
    scheduleNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(async () => undefined),
}));

const schedule = jest.mocked(Notifications.scheduleNotificationAsync);
const cancel = jest.mocked(Notifications.cancelScheduledNotificationAsync);

/** Each `schedule` call gets its id after `delays[n]` ms, as a slow system would. */
function scheduleTakes(...delays: number[]) {
    delays.forEach((delay, i) => {
        schedule.mockImplementationOnce(
            () => new Promise<string>((resolve) => setTimeout(() => resolve(`id-${i + 1}`), delay)),
        );
    });
}

const advance = (ms: number) => act(async () => { await jest.advanceTimersByTimeAsync(ms); });
const slot = (kind: 'pomodoro' | 'fly' = 'pomodoro') => useSessionStore.getState().clock[kind];

async function renderTimer() {
    const { result } = await renderHook(() => {
        const session = useSessionState();
        return useTimer({ ...DEFAULT_SETTINGS, notifications: true }, () => 'a note', jest.fn(), session);
    });
    return result;
}

beforeEach(async () => {
    jest.useFakeTimers();
    schedule.mockReset();
    cancel.mockClear();
    await act(async () => useSessionStore.getState().stop());
});

afterEach(() => {
    jest.useRealTimers();
});

describe('a session-end notification that takes over a second to schedule (DEF-005)', () => {
    it('starts the session at the deadline, then keeps the id when it arrives, so a pause can cancel it', async () => {
        scheduleTakes(3000);
        const timer = await renderTimer();

        await act(async () => { timer.current.start(); });
        await advance(1000);
        expect(slot()?.isRunning).toBe(true);
        expect(slot()?.scheduledNotificationId ?? null).toBeNull();

        await advance(2000);
        expect(slot()?.scheduledNotificationId).toBe('id-1');
        expect(cancel).not.toHaveBeenCalled();

        await act(async () => { timer.current.pause(); });
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(cancel).toHaveBeenCalledWith('id-1');
    });

    it('cancels a late id when the session was paused before it arrived', async () => {
        scheduleTakes(3000);
        const timer = await renderTimer();

        await act(async () => { timer.current.start(); });
        await advance(1000);
        await act(async () => { timer.current.pause(); });

        await advance(2000);
        expect(cancel).toHaveBeenCalledWith('id-1');
        expect(slot()?.scheduledNotificationId ?? null).toBeNull();
    });

    it('cancels a late id when the session was skipped before it arrived', async () => {
        scheduleTakes(3000);
        const timer = await renderTimer();

        await act(async () => { timer.current.start(); });
        await advance(1000);
        await act(async () => { timer.current.skip(); });

        await advance(2000);
        expect(cancel).toHaveBeenCalledWith('id-1');
    });

    it('cancels an out-of-date id after a pause and resume, because it carries the old end time', async () => {
        scheduleTakes(3000, 100);
        const timer = await renderTimer();

        await act(async () => { timer.current.start(); });
        await advance(1000);
        await act(async () => { timer.current.pause(); });
        await act(async () => { timer.current.resume(); });
        await advance(100);
        expect(slot()?.scheduledNotificationId).toBe('id-2');

        await advance(2000);
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(cancel).toHaveBeenCalledWith('id-1');
        expect(slot()?.scheduledNotificationId).toBe('id-2');
    });

    it('keeps the newest id when the older one arrives first', async () => {
        scheduleTakes(3000, 5000);
        const timer = await renderTimer();

        await act(async () => { timer.current.start(); });
        await advance(1000);
        await act(async () => { timer.current.pause(); });
        await act(async () => { timer.current.resume(); });

        await advance(2000); // id-1 arrives, running, but it isn't the newest call
        expect(cancel).toHaveBeenCalledWith('id-1');
        expect(slot()?.scheduledNotificationId ?? null).toBeNull();

        await advance(3000); // id-2 arrives
        expect(slot()?.scheduledNotificationId).toBe('id-2');
        expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('logs a failure after the deadline and leaves the session running', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        schedule.mockImplementationOnce(
            () => new Promise<string>((_, reject) => setTimeout(() => reject(new Error('no')), 3000)),
        );
        const timer = await renderTimer();

        await act(async () => { timer.current.start(); });
        await advance(3000);
        expect(slot()?.isRunning).toBe(true);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});

describe('a resume whose notification comes back in time', () => {
    it('is cancelled if the person paused again before it came back', async () => {
        scheduleTakes(100, 500);
        const timer = await renderTimer();

        await act(async () => { timer.current.start(); });
        await advance(100);
        await act(async () => { timer.current.pause(); });
        expect(cancel).toHaveBeenCalledWith('id-1');

        await act(async () => { timer.current.resume(); });
        await advance(100);
        await act(async () => { timer.current.pause(); });
        await advance(400);

        expect(cancel).toHaveBeenCalledWith('id-2');
        expect(slot()?.scheduledNotificationId ?? null).toBeNull();
    });
});

describe('on time, nothing changes', () => {
    it('stores the id at once and cancels nothing', async () => {
        scheduleTakes(50);
        const timer = await renderTimer();

        await act(async () => { timer.current.start(); });
        await advance(50);

        expect(slot()?.scheduledNotificationId).toBe('id-1');
        expect(cancel).not.toHaveBeenCalled();
    });
});

// Fly has the same two calls, through the same functions, on its own slot.
describe('the helpers on the Fly slot', () => {
    it('keeps a late id on the fly slot, and leaves the Pomodoro slot alone', async () => {
        scheduleTakes(3000);
        const { result } = await renderHook(() => useNotifications());
        let returned: string | null | undefined;

        await act(async () => {
            void result.current
                .scheduleSlotEnd('fly', Date.now() + 60_000, 'Landed', 'Welcome')
                .then((id) => { returned = id; });
            await jest.advanceTimersByTimeAsync(1000);
        });
        expect(returned).toBeNull();
        await act(async () => useSessionStore.getState().start({ kind: 'fly', durationMs: 60_000 }));

        await advance(2000);
        expect(slot('fly')?.scheduledNotificationId).toBe('id-1');
        expect(slot()?.scheduledNotificationId ?? null).toBeNull();
    });

    it('a resume on the fly slot stores an id that comes back in time', async () => {
        scheduleTakes(100);
        const { result } = await renderHook(() => useNotifications());
        await act(async () => useSessionStore.getState().start({ kind: 'fly', durationMs: 60_000 }));

        await act(async () => {
            void result.current.rescheduleSlotEnd('fly', Date.now() + 60_000, 'Landed', 'Welcome');
            await jest.advanceTimersByTimeAsync(100);
        });

        expect(slot('fly')?.scheduledNotificationId).toBe('id-1');
        expect(cancel).not.toHaveBeenCalled();
    });
});
