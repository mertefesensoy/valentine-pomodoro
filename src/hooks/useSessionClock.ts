/**
 * useSessionClock.ts
 *
 * The session clock as components see it: the two-slot state, the live
 * remaining time of the active slot, and the clock's actions.
 *
 * Since Phase 1 B3 the state lives in the session store (src/stores/
 * sessionStore.ts), and the ticker, the AppState listener and the cold-start
 * check run once in the engine StoreGate mounts. This hook only reads, so any
 * number of components may call it, anywhere below StoreGate.
 *
 * It subscribes to the store's `tick`, so its caller re-renders once per
 * second while a session runs and `displayMs` (endAt − Date.now(), computed at
 * render) stays fresh. Call it only where the remaining time is shown or
 * needed; to only start or stop a session, use useSessionStore's actions.
 *
 * Time basis: Date.now() everywhere. This matches the wall-clock that
 * expo-notifications uses for scheduling, so the plane position, the timer
 * text, and the notification all agree.
 */

import type { SessionClockState } from '../types';
import { useSessionStore, type SessionStore } from '../stores/sessionStore';

export interface UseSessionClockReturn
    extends Pick<
        SessionStore,
        'start' | 'pause' | 'resume' | 'stop' | 'switchTo' | 'extend' | 'setSlotExtras' | 'onComplete'
    > {
    state: SessionClockState;
    /** Live remaining ms for the active slot. Recomputed at render time for subsecond accuracy. */
    displayMs: number;
}

// The store's actions never change identity, so they are read once.
const { start, pause, resume, stop, switchTo, extend, setSlotExtras, onComplete } = useSessionStore.getState();

export function useSessionClock(): UseSessionClockReturn {
    const clockState = useSessionStore((s) => s.clock);
    // Re-render once per second while a session runs (see the file comment).
    useSessionStore((s) => s.tick);

    // Live displayMs — render-time recompute for subsecond accuracy
    const { activeKind } = clockState;
    const activeSlot = activeKind ? clockState[activeKind] : null;
    const displayMs = activeSlot
        ? activeSlot.isRunning && activeSlot.endAt
            ? Math.max(0, activeSlot.endAt - Date.now())
            : activeSlot.pausedRemainingMs ?? 0
        : 0;

    return {
        state: clockState,
        displayMs,
        start, pause, resume, stop, switchTo, extend, setSlotExtras, onComplete,
    };
}
