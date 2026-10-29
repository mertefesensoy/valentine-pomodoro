import { useEffect, useState, type ReactNode } from 'react';
import { act, render } from '@testing-library/react-native';
import { StoreGate } from '../StoreGate';
import { useSessionStore } from '../sessionStore';
import { save, STORAGE_KEYS } from '../../utils/storage';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import type { SessionKind, SessionSlot } from '../../types';

// DEF-004. On a phone, NavigationContainer renders nothing until
// Linking.getInitialURL() resolves (React Navigation 7, at most 150 ms), so the
// screens that subscribe to completions mount after that. A session that ended
// while the app was killed must still be completed once, for its subscriber.
jest.useFakeTimers();

type Handler = (slot: SessionSlot, kind: SessionKind) => void;

function Subscriber({ handler, kind }: { handler: Handler; kind?: SessionKind }) {
    useEffect(() => useSessionStore.getState().onComplete(handler, kind), [handler, kind]);
    return null;
}

/** Renders its children only after `ms`, the way the navigator's fallback does. */
function MountAfter({ ms, children }: { ms: number; children: ReactNode }) {
    const [show, setShow] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setShow(true), ms);
        return () => clearTimeout(t);
    }, [ms]);
    return show ? children : null;
}

/** Stores a clock whose `kind` slot ended a minute ago, as a killed app leaves it. */
async function seedEnded(kind: SessionKind, sessionId: string) {
    const now = Date.now();
    const ended: SessionSlot = {
        isRunning: true,
        endAt: now - 60_000,
        pausedRemainingMs: null,
        durationMs: 25 * 60_000,
        sessionStartedAt: now - 26 * 60_000,
        sessionId,
        ...(kind === 'pomodoro'
            ? { phase: 'focus' as const, sessionPlannedMinutes: 25 }
            : { originIata: 'IST', destinationIata: 'LUZ' }),
    };
    await save(STORAGE_KEYS.SESSION_CLOCK, { activeKind: kind, pomodoro: null, fly: null, [kind]: ended });
}

afterEach(async () => {
    await resetStorage();
});

// covers: FR-TMR-005
describe('a session that ended while the app was killed (DEF-004)', () => {
    it('is completed once for a subscriber that mounts 150 ms after launch', async () => {
        await seedEnded('pomodoro', 'ended-while-killed');

        const handler = jest.fn();
        await render(
            <StoreGate>
                <MountAfter ms={150}>
                    <Subscriber handler={handler} />
                </MountAfter>
            </StoreGate>,
        );
        await act(async () => {});
        await act(() => jest.advanceTimersByTime(150));
        await act(() => jest.advanceTimersByTime(5_000));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].sessionId).toBe('ended-while-killed');
        expect(handler.mock.calls[0][1]).toBe('pomodoro');
    });

    it('waits, without ticking, while nothing handles its kind, then completes once', async () => {
        await seedEnded('pomodoro', 'waiting');

        const handler = jest.fn();
        await render(
            <StoreGate>
                <MountAfter ms={10_000}>
                    <Subscriber handler={handler} kind="pomodoro" />
                </MountAfter>
            </StoreGate>,
        );
        await act(async () => {});
        await act(() => jest.advanceTimersByTime(9_000));

        // Pending: the slot is still there, nothing completed it, nothing ticked.
        expect(handler).not.toHaveBeenCalled();
        expect(useSessionStore.getState().clock.pomodoro?.sessionId).toBe('waiting');
        expect(useSessionStore.getState().tick).toBe(0);

        await act(() => jest.advanceTimersByTime(1_000));
        await act(() => jest.advanceTimersByTime(5_000));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].sessionId).toBe('waiting');
        expect(useSessionStore.getState().clock.pomodoro).toBeNull();
        expect(useSessionStore.getState().clock.activeKind).toBeNull();
    });

    it('a Fly session waits for the Fly handler, not the Pomodoro one', async () => {
        await seedEnded('fly', 'landed-while-killed');

        const pomodoroHandler = jest.fn();
        const flyHandler = jest.fn();
        // Classic's handler is there at once; Fly's arrives after its lazy load.
        await render(
            <StoreGate>
                <Subscriber handler={pomodoroHandler} kind="pomodoro" />
                <MountAfter ms={300}>
                    <Subscriber handler={flyHandler} kind="fly" />
                </MountAfter>
            </StoreGate>,
        );
        await act(async () => {});
        await act(() => jest.advanceTimersByTime(300));
        await act(() => jest.advanceTimersByTime(5_000));

        expect(pomodoroHandler).not.toHaveBeenCalled();
        expect(flyHandler).toHaveBeenCalledTimes(1);
        expect(flyHandler.mock.calls[0][0].sessionId).toBe('landed-while-killed');
        expect(flyHandler.mock.calls[0][1]).toBe('fly');
    });
});
