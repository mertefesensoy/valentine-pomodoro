/**
 * useSessionClock.ts
 *
 * Shared wall-clock primitive for both Pomodoro and Fly Mode.
 *
 * Holds two independent session slots — pomodoro and fly — so a paused
 * Pomodoro at 15:00 is never disturbed when the user starts a Fly session.
 * Only one slot is "active" (driving displayMs and SharedValues) at a time.
 *
 * Must be instantiated exactly once, inside AppProvider.
 *
 * Time basis: Date.now() everywhere. This matches the wall-clock that
 * expo-notifications uses for scheduling, so the plane position, the timer
 * text, and the notification all agree.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import type { SessionClockState, SessionKind, SessionSlot } from '../types';

// ─── Dev-time singleton guard ─────────────────────────────────────────────────

let _instanceCount = 0;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const IDLE_CLOCK: SessionClockState = { activeKind: null, pomodoro: null, fly: null };

// ─── Public interface ─────────────────────────────────────────────────────────

export interface UseSessionClockReturn {
    state: SessionClockState;
    /** Live remaining ms for the active slot. Recomputed at render time for subsecond accuracy. */
    displayMs: number;
    endAtSV: SharedValue<number>;
    durationSV: SharedValue<number>;
    isRunningSV: SharedValue<boolean>;
    progressSV: SharedValue<number>;
    elapsedSV: SharedValue<number>;

    start(input: { kind: SessionKind; durationMs: number; extras?: Partial<SessionSlot> }): void;
    pause(): void;
    resume(): void;
    stop(): void;
    /** Auto-pauses the currently running slot (and saves its remainingMs) then switches activeKind. */
    switchTo(kind: SessionKind): void;
    extend(additionalMs: number): void;
    /** Merge extras into an existing slot without touching clock fields. */
    setSlotExtras(kind: SessionKind, extras: Partial<SessionSlot>): void;
    /** Register a completion handler. Returns an unsubscribe function. */
    onComplete(handler: (slot: SessionSlot, kind: SessionKind) => void): () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSessionClock(): UseSessionClockReturn {
    const [clockState, setClockState] = useState<SessionClockState>(IDLE_CLOCK);
    const clockStateRef = useRef<SessionClockState>(IDLE_CLOCK);

    // Incremented every second while a session is running so consumers (TimerScreen,
    // FlyModeScreen) re-render and get a fresh Date.now() for displayMs.
    const [, setDisplayTick] = useState(0);

    useEffect(() => { clockStateRef.current = clockState; }, [clockState]);

    const completionHandlers = useRef<Set<(slot: SessionSlot, kind: SessionKind) => void>>(new Set());

    // SharedValues — written on JS thread, always fresh on UI thread
    const endAtSV = useSharedValue<number>(Number.NEGATIVE_INFINITY);
    const durationSV = useSharedValue<number>(0);
    const isRunningSV = useSharedValue<boolean>(false);
    const progressSV = useSharedValue<number>(0);
    const elapsedSV = useSharedValue<number>(0);

    // ── Sync SharedValues from a given state ────────────────────────────────
    const syncSV = useCallback((state: SessionClockState) => {
        const { activeKind } = state;
        const slot = activeKind ? state[activeKind] : null;
        if (!slot?.isRunning || !slot.endAt || !slot.durationMs) {
            endAtSV.value = Number.NEGATIVE_INFINITY;
            isRunningSV.value = false;
            return;
        }
        const remaining = Math.max(0, slot.endAt - Date.now());
        const elapsed = slot.durationMs - remaining;
        endAtSV.value = slot.endAt;
        durationSV.value = slot.durationMs;
        isRunningSV.value = true;
        progressSV.value = Math.min(1, Math.max(0, elapsed / slot.durationMs));
        elapsedSV.value = Math.max(0, elapsed);
    }, [endAtSV, durationSV, isRunningSV, progressSV, elapsedSV]);

    // ── Persist + sync in one call ──────────────────────────────────────────
    const commit = useCallback((state: SessionClockState) => {
        setClockState(state);
        clockStateRef.current = state;
        save(STORAGE_KEYS.SESSION_CLOCK, state).catch(() => {});
        syncSV(state);
    }, [syncSV]);

    // ── Idempotent completion: clears slot, fires handlers exactly once ─────
    const fireCompletion = useCallback((slot: SessionSlot, kind: SessionKind) => {
        // Guard: if slot was already cleared (concurrent tick + AppState), do nothing
        const current = clockStateRef.current;
        const live = current[kind];
        if (!live || live.endAt !== slot.endAt) return;

        const cleared: SessionClockState = { ...current, [kind]: null, activeKind: null };
        commit(cleared);
        completionHandlers.current.forEach(h => h(slot, kind));
    }, [commit]);

    // ── Mount: load persisted state + cold-start completion check ──────────
    useEffect(() => {
        if (__DEV__) {
            _instanceCount++;
            if (_instanceCount > 1) {
                console.error('[useSessionClock] Multiple instances detected. Only one is allowed (inside AppProvider).');
            }
        }

        let cancelled = false;
        (async () => {
            const loaded = await load<SessionClockState>(STORAGE_KEYS.SESSION_CLOCK, IDLE_CLOCK);
            if (cancelled) return;

            const merged: SessionClockState = { ...IDLE_CLOCK, ...loaded };
            const { activeKind } = merged;
            const slot = activeKind ? merged[activeKind] : null;

            if (slot?.isRunning && slot.endAt !== null && slot.endAt <= Date.now()) {
                // Session completed while app was closed — fire completion immediately
                const cleared: SessionClockState = { ...merged, [activeKind!]: null, activeKind: null };
                commit(cleared);
                completionHandlers.current.forEach(h => h(slot, activeKind!));
                return;
            }

            commit(merged);
        })();

        return () => {
            cancelled = true;
            if (__DEV__) _instanceCount--;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── 1 Hz ticker: displayMs re-render + completion detection ────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const state = clockStateRef.current;
            const { activeKind } = state;
            if (!activeKind) return;
            const slot = state[activeKind];
            if (!slot?.isRunning || !slot.endAt) return;
            if (slot.endAt <= Date.now()) {
                fireCompletion(slot, activeKind);
            } else {
                // Nudge React to re-render so displayMs (endAt − Date.now()) stays fresh.
                setDisplayTick(t => t + 1);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [fireCompletion]);

    // ── AppState listener: warm-return completion + SharedValue re-sync ─────
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState !== 'active') return;
            const state = clockStateRef.current;
            const { activeKind } = state;
            if (!activeKind) return;
            const slot = state[activeKind];
            if (!slot?.isRunning || !slot.endAt) return;
            if (slot.endAt <= Date.now()) {
                fireCompletion(slot, activeKind);
            } else {
                syncSV(state); // re-sync SharedValues after background
            }
        });
        return () => sub.remove();
    }, [fireCompletion, syncSV]);

    // ── Methods ─────────────────────────────────────────────────────────────

    const start = useCallback((input: { kind: SessionKind; durationMs: number; extras?: Partial<SessionSlot> }) => {
        const { kind, durationMs, extras = {} } = input;
        const now = Date.now();
        const newSlot: SessionSlot = {
            isRunning: true,
            endAt: now + durationMs,
            pausedRemainingMs: null,
            durationMs,
            sessionStartedAt: now,
            sessionId: `${now}-${Math.random().toString(36).slice(2, 11)}`,
            ...extras,
        };
        commit({ ...clockStateRef.current, activeKind: kind, [kind]: newSlot });
    }, [commit]);

    const pause = useCallback(() => {
        const state = clockStateRef.current;
        const { activeKind } = state;
        if (!activeKind) return;
        const slot = state[activeKind];
        if (!slot?.isRunning || !slot.endAt) return;
        const paused: SessionSlot = {
            ...slot,
            isRunning: false,
            endAt: null,
            pausedRemainingMs: Math.max(0, slot.endAt - Date.now()),
        };
        commit({ ...state, [activeKind]: paused });
    }, [commit]);

    const resume = useCallback(() => {
        const state = clockStateRef.current;
        const { activeKind } = state;
        if (!activeKind) return;
        const slot = state[activeKind];
        if (!slot || slot.isRunning || slot.pausedRemainingMs === null) return;
        const resumed: SessionSlot = {
            ...slot,
            isRunning: true,
            endAt: Date.now() + slot.pausedRemainingMs,
            pausedRemainingMs: null,
        };
        commit({ ...state, [activeKind]: resumed });
    }, [commit]);

    const stop = useCallback(() => {
        const state = clockStateRef.current;
        const { activeKind } = state;
        if (!activeKind) return;
        commit({ ...state, [activeKind]: null, activeKind: null });
    }, [commit]);

    const switchTo = useCallback((kind: SessionKind) => {
        const state = clockStateRef.current;
        const { activeKind } = state;
        let updated = { ...state };

        // Auto-pause the currently running slot (different kind only)
        if (activeKind && activeKind !== kind) {
            const slot = state[activeKind];
            if (slot?.isRunning && slot.endAt) {
                const paused: SessionSlot = {
                    ...slot,
                    isRunning: false,
                    endAt: null,
                    pausedRemainingMs: Math.max(0, slot.endAt - Date.now()),
                };
                updated = { ...updated, [activeKind]: paused };
            }
        }

        commit({ ...updated, activeKind: kind });
    }, [commit]);

    const extend = useCallback((additionalMs: number) => {
        const state = clockStateRef.current;
        const { activeKind } = state;
        if (!activeKind) return;
        const slot = state[activeKind];
        if (!slot?.isRunning || !slot.endAt || !slot.durationMs) return;
        const extended: SessionSlot = {
            ...slot,
            endAt: slot.endAt + additionalMs,
            durationMs: slot.durationMs + additionalMs,
        };
        const newState = { ...state, [activeKind]: extended };
        commit(newState);
        // Write SharedValues immediately (don't wait for syncSV via commit tick)
        endAtSV.value = extended.endAt!;
        durationSV.value = extended.durationMs!;
    }, [commit, endAtSV, durationSV]);

    const setSlotExtras = useCallback((kind: SessionKind, extras: Partial<SessionSlot>) => {
        const state = clockStateRef.current;
        const slot = state[kind];
        if (!slot) return;
        commit({ ...state, [kind]: { ...slot, ...extras } });
    }, [commit]);

    const onComplete = useCallback((handler: (slot: SessionSlot, kind: SessionKind) => void) => {
        completionHandlers.current.add(handler);
        return () => { completionHandlers.current.delete(handler); };
    }, []);

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
        endAtSV, durationSV, isRunningSV, progressSV, elapsedSV,
        start, pause, resume, stop, switchTo, extend, setSlotExtras, onComplete,
    };
}
