import { useEffect, useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { SessionClockState, SessionKind } from '../types';
import { displayedSeconds, nextEmissionDelayMs, slotRemainingMs } from '../utils/clockMath';
import { completeEndedSession, useSessionStore } from './sessionStore';

// The clock store (Phase 1 B4, plan §4.2): a useSyncExternalStore source that
// tells its subscribers when a displayed second may have changed. Only the
// <TimerText> leaf (and the useSessionClock facade) subscribe, so a running
// session re-renders one Text per second, not the screens around it.
//
// State: the session store's clock (read, never copied) and `sampledNow`, the
// wall clock as last sampled. Snapshots are pure functions of the two, so they
// stay stable between notifications. `sampledNow` is resampled:
// - on every session-clock change (start, pause, resume, stop, switch, extend,
//   completion, hydrate), with a notification;
// - at each scheduled wake, with a notification only if the running slot's
//   displayed second changed;
// - when the app returns to the foreground.
//
// The scheduler arms one setTimeout at a time, due (r mod 1000) + ε after
// the last sample, the instant the displayed second next changes. It runs
// only while useSessionClockEngine() is mounted, and arms nothing while no
// session runs (paused, idle) or once the running one has ended.

let sampledNow = Date.now();
const listeners = new Set<() => void>();

let engineMounted = false;
let timer: ReturnType<typeof setTimeout> | null = null;
// The running slot's displayed second at the last notification.
let notifiedSecond: number | null = null;

function notify() {
    listeners.forEach((listener) => listener());
}

/** The displayed second of the active slot at `now`, or null with no active slot. */
function activeSecondAt(clock: SessionClockState, now: number): number | null {
    const kind = clock.activeKind;
    if (!kind) return null;
    const ms = slotRemainingMs(clock[kind], null, now);
    return ms === null ? null : displayedSeconds(ms);
}

/** Arms the next wake, replacing any pending one. Arms nothing unless the engine is mounted and the active slot runs and hasn't ended. */
function reschedule() {
    if (timer !== null) {
        clearTimeout(timer);
        timer = null;
    }
    if (!engineMounted) return;
    const { clock } = useSessionStore.getState();
    const slot = clock.activeKind ? clock[clock.activeKind] : null;
    if (!slot?.isRunning || !slot.endAt) return;
    const remaining = slot.endAt - sampledNow;
    // Ended: completion is completeEndedSession's to decide. While no handler
    // can take the session it stays pending (DEF-004), and nothing ticks.
    if (remaining <= 0) return;
    timer = setTimeout(wake, nextEmissionDelayMs(remaining));
}

/** Resamples; notifies if the active displayed second changed; completes an ended session. */
function resampleAndComplete() {
    sampledNow = Date.now();
    const second = activeSecondAt(useSessionStore.getState().clock, sampledNow);
    if (second !== notifiedSecond) {
        notifiedSecond = second;
        notify();
    }
    // Completing clears the slot; that clock change resamples, notifies and
    // re-arms through the subscription below.
    completeEndedSession();
}

function wake() {
    timer = null;
    resampleAndComplete();
    reschedule();
}

// Every session-clock change resamples and notifies, so a snapshot never pairs
// a new slot with an old `now` (a fresh 25:00 start would otherwise read as
// 25:00 plus the time since the last sample). Registered when this module is
// first imported, before any component can subscribe to the session store, so
// it runs first on every change.
useSessionStore.subscribe((state, prev) => {
    if (state.clock === prev.clock) return;
    sampledNow = Date.now();
    notifiedSecond = activeSecondAt(state.clock, sampledNow);
    notify();
    reschedule();
});

/** useSyncExternalStore's subscribe. */
export function subscribeClock(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Whether the scheduler has a wake armed. For tests: none while paused, idle, or ended and waiting for a handler (DEF-004). */
export function isClockWakeArmed(): boolean {
    return timer !== null;
}

/** The wall clock as last sampled. Read it instead of Date.now() wherever a value must stay stable between notifications. */
export function getClockNow(): number {
    return sampledNow;
}

/**
 * The displayed whole seconds of a slot, ⌊remaining / 1000⌋, or null when
 * there is nothing to show. Re-renders its caller only when that number
 * changes: once per displayed second while the slot runs, never while it is
 * paused or idle.
 *
 * @param kind the slot, or 'active' for the active slot (none: idle)
 * @param idleMs what an absent slot (or a paused one with no remainder) shows
 */
export function useDisplayedSeconds(kind: SessionKind | 'active', idleMs: number | null): number | null {
    const getSnapshot = () => {
        const { clock } = useSessionStore.getState();
        const slotKind = kind === 'active' ? clock.activeKind : kind;
        const ms = slotRemainingMs(slotKind ? clock[slotKind] : null, idleMs, sampledNow);
        return ms === null ? null : displayedSeconds(ms);
    };
    return useSyncExternalStore(subscribeClock, getSnapshot, getSnapshot);
}

let engineInstances = 0;

/**
 * The session clock's side effects. Mounted exactly once, by StoreGate, after
 * the stores have hydrated (`active`).
 *
 * - On mount: a session that ended while the app was closed is completed
 *   (cold start), if a handler for its kind is registered; otherwise it waits
 *   for one (DEF-004, see fireCompletion). Then the scheduler starts.
 * - While the active slot runs: the scheduler wakes when its displayed second
 *   changes, notifies the clock store's subscribers, and completes the slot
 *   once its end has passed.
 * - On returning to the foreground: resamples (timers don't run in the
 *   background) and completes the active slot if its end has passed.
 *
 * Subscribes to nothing that renders, so StoreGate never re-renders because of
 * the clock. Unmounting stops the scheduler and clears its pending wake.
 */
export function useSessionClockEngine(active: boolean): void {
    useEffect(() => {
        if (!active) return;

        if (__DEV__) {
            engineInstances++;
            if (engineInstances > 1) {
                console.error('[clockStore] Multiple clock engines mounted. Only StoreGate may mount one.');
            }
        }

        // Cold start: a session that ended while the app was closed completes
        // here (resampleAndComplete), or waits for its handler. Then the
        // scheduler starts.
        engineMounted = true;
        resampleAndComplete();
        reschedule();

        const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState !== 'active') return;
            resampleAndComplete();
            reschedule();
        });

        return () => {
            engineMounted = false;
            reschedule(); // clears the pending wake
            sub.remove();
            if (__DEV__) engineInstances--;
        };
    }, [active]);
}
