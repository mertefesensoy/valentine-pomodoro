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

function Subscriber({ handler }: { handler: Handler }) {
    useEffect(() => useSessionStore.getState().onComplete(handler), [handler]);
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

afterEach(async () => {
    await resetStorage();
});

// covers: FR-TMR-005
describe('a session that ended while the app was killed (DEF-004)', () => {
    // Known defect until the DEF-004 fix: it.failing passes only while the test fails.
    it.failing('is completed once for a subscriber that mounts 150 ms after launch', async () => {
        const now = Date.now();
        const ended: SessionSlot = {
            isRunning: true,
            endAt: now - 60_000,
            pausedRemainingMs: null,
            durationMs: 25 * 60_000,
            sessionStartedAt: now - 26 * 60_000,
            sessionId: 'ended-while-killed',
            phase: 'focus',
            sessionPlannedMinutes: 25,
        };
        await save(STORAGE_KEYS.SESSION_CLOCK, { activeKind: 'pomodoro', pomodoro: ended, fly: null });

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
});
