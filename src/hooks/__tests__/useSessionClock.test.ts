import { useEffect } from 'react';
import { AppState } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useSessionClock } from '../useSessionClock';
import { StoreGate } from '../../stores/StoreGate';
import { save, STORAGE_KEYS } from '../../utils/storage';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import type { SessionKind, SessionSlot } from '../../types';

// Modern fake timers also fake Date.now(), so the clock store's scheduled
// wakes and the endAt − now arithmetic advance together. RNTL 14's act() and
// renderHook() are async, so every call is awaited.
jest.useFakeTimers();

type Handler = (slot: SessionSlot, kind: SessionKind) => void;

// Since Phase 1 B3 the clock's state is in the session store, and its
// scheduler, AppState listener and cold-start check run in the engine
// StoreGate mounts, so the hook is rendered under a StoreGate, as in the app.
async function renderClock(handler: Handler = jest.fn()) {
    return renderHook(() => {
        const clock = useSessionClock();
        const { onComplete } = clock;
        useEffect(() => onComplete(handler), [onComplete]);
        return clock;
    }, { wrapper: StoreGate });
}

/** Lets the async storage load in the mount effect settle. */
async function flushLoad() {
    await act(async () => {});
}

function appStateListener(): (state: string) => void {
    const calls = (AppState.addEventListener as jest.Mock).mock.calls;
    return calls[calls.length - 1][1];
}

beforeEach(async () => {
    await resetStorage();
    (AppState.addEventListener as jest.Mock).mockClear?.();
});

describe('useSessionClock', () => {
    it('counts down once per second while running', async () => {
        const { result } = await renderClock();
        await flushLoad();

        await act(() => result.current.start({ kind: 'pomodoro', durationMs: 60_000 }));
        expect(result.current.displayMs).toBe(60_000);

        await act(() => jest.advanceTimersByTime(1_000));
        expect(result.current.displayMs).toBe(59_000);

        await act(() => jest.advanceTimersByTime(9_000));
        expect(result.current.displayMs).toBe(50_000);
    });

    it('freezes remaining time while paused and continues on resume', async () => {
        const { result } = await renderClock();
        await flushLoad();

        await act(() => result.current.start({ kind: 'pomodoro', durationMs: 60_000 }));
        await act(() => jest.advanceTimersByTime(10_000));
        await act(() => result.current.pause());
        expect(result.current.displayMs).toBe(50_000);

        await act(() => jest.advanceTimersByTime(30_000));
        expect(result.current.displayMs).toBe(50_000);
        expect(result.current.state.pomodoro?.isRunning).toBe(false);

        await act(() => result.current.resume());
        await act(() => jest.advanceTimersByTime(1_000));
        expect(result.current.displayMs).toBe(49_000);
    });

    it('fires completion exactly once when the foreground event and the ticker both see the end', async () => {
        const handler = jest.fn();
        const { result } = await renderClock(handler);
        await flushLoad();

        await act(() => result.current.start({ kind: 'pomodoro', durationMs: 5_000, extras: { phase: 'focus' } }));

        // App was backgrounded: wall clock jumps past endAt without interval ticks.
        await act(() => jest.setSystemTime(Date.now() + 20_000));
        await act(() => appStateListener()('active'));
        await act(() => jest.advanceTimersByTime(3_000));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][1]).toBe('pomodoro');
        expect(handler.mock.calls[0][0].phase).toBe('focus');
        expect(result.current.state.pomodoro).toBeNull();
        expect(result.current.state.activeKind).toBeNull();
    });

    it('completes a session that ended while the app was closed, once, on cold start', async () => {
        const now = Date.now();
        const endedSlot: SessionSlot = {
            isRunning: true,
            endAt: now - 1_000,
            pausedRemainingMs: null,
            durationMs: 25 * 60_000,
            sessionStartedAt: now - 25 * 60_000 - 1_000,
            sessionId: 'cold-start-session',
            phase: 'focus',
        };
        await save(STORAGE_KEYS.SESSION_CLOCK, { activeKind: 'pomodoro', pomodoro: endedSlot, fly: null });

        const handler = jest.fn();
        const { result } = await renderClock(handler);
        await flushLoad();
        await act(() => jest.advanceTimersByTime(5_000));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].sessionId).toBe('cold-start-session');
        expect(result.current.state.pomodoro).toBeNull();
    });

    it('keeps a paused Pomodoro intact while a Fly session runs (two-slot preservation)', async () => {
        const { result } = await renderClock();
        await flushLoad();

        await act(() => result.current.start({ kind: 'pomodoro', durationMs: 60_000 }));
        await act(() => jest.advanceTimersByTime(15_000));
        await act(() => result.current.switchTo('fly'));
        await act(() => result.current.start({ kind: 'fly', durationMs: 30_000 }));
        await act(() => jest.advanceTimersByTime(10_000));

        expect(result.current.state.pomodoro?.isRunning).toBe(false);
        expect(result.current.state.pomodoro?.pausedRemainingMs).toBe(45_000);
        expect(result.current.displayMs).toBe(20_000);
    });
});
