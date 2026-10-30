/**
 * clockMath.ts
 *
 * The session clock's arithmetic (Phase 1 B4; the B4 record §4 states it with
 * notation). Everything here is a pure function of its arguments.
 *
 * The functions the UI thread also runs (the progress ring) are Reanimated
 * worklets, and the JS thread calls the very same functions (the clock store,
 * <TimerText>, the ring's first value). There is no second, worklet-only copy
 * that could drift from the JS one, as geoMath and geoMathWorklet can; the
 * tests still pin the two call paths equal.
 *
 * Time basis: Date.now() epoch ms everywhere (FR-TMR-003).
 */

import type { SessionSlot } from '../types';

/** ε of plan §4.2: how long after a displayed-second boundary the clock store wakes, to absorb timer jitter. */
export const EMISSION_EPSILON_MS = 4;

/**
 * Remaining ms of a session from its clock fields at `now`.
 *
 * - Running: `endAt − now`, never below 0 (FR-TMR-003).
 * - Otherwise: the paused remainder, or `idleMs` when there is none.
 *
 * `endAt` is ignored unless `isRunning`. Returns `idleMs` (which may be null:
 * nothing to show) only when not running and nothing is paused.
 */
export function remainingMsAt(
    isRunning: boolean,
    endAt: number,
    pausedRemainingMs: number | null,
    idleMs: number | null,
    now: number,
): number | null {
    'worklet';
    if (isRunning) return Math.max(0, endAt - now);
    return pausedRemainingMs ?? idleMs;
}

/**
 * Remaining ms of a slot at `now`: the rule useTimer, FlyModeScreen and
 * useSessionClock each applied at render before B4. No slot gives `idleMs`;
 * a slot counts as running only with an `endAt`.
 */
export function slotRemainingMs(slot: SessionSlot | null | undefined, idleMs: number | null, now: number): number | null {
    if (!slot) return idleMs;
    const running = slot.isRunning && !!slot.endAt;
    return remainingMsAt(running, slot.endAt ?? 0, slot.pausedRemainingMs, idleMs, now);
}

/** The whole seconds shown for `ms` remaining: ⌊ms / 1000⌋, formatTime's convention (plan §5). */
export function displayedSeconds(ms: number): number {
    'worklet';
    return Math.floor(ms / 1000);
}

/**
 * Delay until the displayed second next changes, for `remainingMs` > 0 (plan
 * §4.2, corrected in B4): d = (r mod 1000) + ε.
 *
 * Under ⌊r/1000⌋ the value k is shown while r ∈ [1000k, 1000k + 1000), so it
 * changes as soon as r drops below 1000k, which is (r mod 1000) ms from now.
 * At r mod 1000 = 0 the change is due at once, so d = ε. Each wake happens
 * ε after a boundary, so from then on d = 1000.
 */
export function nextEmissionDelayMs(remainingMs: number): number {
    return (remainingMs % 1000) + EMISSION_EPSILON_MS;
}

/** Ring progress for `remainingMs` of `totalMs`: 1 − r/total, clamped to [0, 1] (TimerScreen's formula before B4). */
export function progressOf(remainingMs: number, totalMs: number): number {
    'worklet';
    return Math.max(0, Math.min(1, 1 - remainingMs / totalMs));
}

/** The ring's `strokeDashoffset` for `progress` on a circle of `circumference`: C · (1 − p), p clamped to [0, 1]. */
export function ringDashOffset(circumference: number, progress: number): number {
    'worklet';
    return circumference * (1 - Math.min(1, Math.max(0, progress)));
}
