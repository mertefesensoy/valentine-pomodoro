/**
 * useSessionClock.ts
 *
 * The session clock as components see it: the two-slot state, the clock's
 * actions, and (useSessionClock only) the displayed remaining time.
 *
 * Since Phase 1 B3 the state lives in the session store (src/stores/
 * sessionStore.ts), and the scheduler, the AppState listener and the
 * cold-start check run once in the engine StoreGate mounts. These hooks only
 * read, so any number of components may call them, anywhere below StoreGate.
 *
 * Two hooks, by what the caller needs (Phase 1 B4):
 * - useSessionState(): state and actions. Re-renders on session changes only
 *   (start, pause, resume, stop, switch, completion), never because time
 *   passes. What screens use.
 * - useSessionClock(): the same, plus `displayMs`, through the clock store. It
 *   re-renders its caller once per displayed second while a session runs.
 *   The app's one time display is <TimerText>, which reads the clock store
 *   directly; this facade is what the guard probe and the clock tests read.
 *
 * Time basis: Date.now() everywhere. This matches the wall-clock that
 * expo-notifications uses for scheduling, so the plane position, the timer
 * text, and the notification all agree.
 */

import type { SessionClockState } from '../types';
import { useDisplayedSeconds } from '../stores/clockStore';
import { useSessionStore, type SessionStore } from '../stores/sessionStore';

export interface UseSessionStateReturn
    extends Pick<
        SessionStore,
        'start' | 'pause' | 'resume' | 'stop' | 'switchTo' | 'extend' | 'setSlotExtras' | 'onComplete'
    > {
    state: SessionClockState;
}

export interface UseSessionClockReturn extends UseSessionStateReturn {
    /**
     * The active slot's remaining time as displayed: ⌊remaining / 1000⌋ × 1000
     * ms, from the clock store's last sample (0 with no active slot). Updated
     * ε after each displayed-second boundary (plan §4.2), so it is always a
     * whole number of seconds.
     */
    displayMs: number;
}

// The store's actions never change identity, so they are read once.
const { start, pause, resume, stop, switchTo, extend, setSlotExtras, onComplete } = useSessionStore.getState();

export function useSessionState(): UseSessionStateReturn {
    const clockState = useSessionStore((s) => s.clock);
    return {
        state: clockState,
        start, pause, resume, stop, switchTo, extend, setSlotExtras, onComplete,
    };
}

export function useSessionClock(): UseSessionClockReturn {
    const session = useSessionState();
    // Re-renders once per displayed second while the active slot runs.
    const seconds = useDisplayedSeconds('active', 0) ?? 0;
    return { ...session, displayMs: seconds * 1000 };
}
