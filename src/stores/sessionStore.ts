import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { create } from 'zustand';
import type { PomodoroState, SessionClockState, SessionKind, SessionSlot } from '../types';
import { loadSync, saveSync, STORAGE_KEYS } from '../utils/storage';
import { isRecord } from './isRecord';

// The session store (Phase 1 B3): the two-slot session clock (`session_clock`)
// and the Pomodoro's own state (`timer_state`). Replaces useSessionClock's
// state and useTimer's persisted state.
//
// Time basis: Date.now() everywhere, the wall clock expo-notifications
// schedules against, so the plane, the timer text and the alert agree. The
// remaining time is always endAt − now (FR-TMR-003), never a counter.
//
// The clock's side effects (the 1 Hz ticker, the AppState listener and the
// cold-start completion check) are in useSessionClockEngine(), below, which
// StoreGate mounts exactly once. Components read the clock through the
// useSessionClock() facade (src/hooks/useSessionClock.ts).

export const IDLE_CLOCK: SessionClockState = { activeKind: null, pomodoro: null, fly: null };

export const INITIAL_POMODORO: PomodoroState = {
    phase: 'focus',
    completedFocusCountInCycle: 0,
    lastLoveNote: null,
};

export type CompletionHandler = (slot: SessionSlot, kind: SessionKind) => void;

// Functions, not state: subscribers register here and are called on completion.
const completionHandlers = new Set<CompletionHandler>();

export interface SessionStore {
    clock: SessionClockState;
    pomodoro: PomodoroState;
    /**
     * Incremented once per second while the active slot runs. Components that
     * show the remaining time subscribe to it, so they re-render with a fresh
     * Date.now(). This is the B3 form of the `setDisplayTick` chain the timer
     * guards protect (plan §4.5); B4 replaces it with a clock store that emits
     * per displayed second.
     */
    tick: number;

    /** Reads both keys from MMKV synchronously and re-saves the clock. Never throws. */
    hydrate(): void;

    start(input: { kind: SessionKind; durationMs: number; extras?: Partial<SessionSlot> }): void;
    pause(): void;
    resume(): void;
    stop(): void;
    /** Auto-pauses the running slot of the other kind (keeping its remaining time), then makes `kind` active. */
    switchTo(kind: SessionKind): void;
    extend(additionalMs: number): void;
    /** Merges extras into an existing slot without touching clock fields. */
    setSlotExtras(kind: SessionKind, extras: Partial<SessionSlot>): void;
    /** Registers a completion handler. Returns the unsubscribe function. */
    onComplete(handler: CompletionHandler): () => void;
    /** Replaces the Pomodoro state and persists it. */
    setPomodoro(pomodoro: PomodoroState): void;
}

export const useSessionStore = create<SessionStore>()((set, get) => {
    // Persist + publish in one call
    const commit = (clock: SessionClockState) => {
        set({ clock });
        saveSync(STORAGE_KEYS.SESSION_CLOCK, clock);
    };

    return {
        clock: IDLE_CLOCK,
        pomodoro: INITIAL_POMODORO,
        tick: 0,

        hydrate() {
            let clock = IDLE_CLOCK;
            let pomodoro = INITIAL_POMODORO;
            try {
                const storedClock = loadSync<unknown>(STORAGE_KEYS.SESSION_CLOCK, null);
                clock = { ...IDLE_CLOCK, ...(isRecord(storedClock) ? storedClock : {}) };

                // timer_state may be the pre-1.3 shape, with clock fields (ignored).
                const storedPomodoro = loadSync<unknown>(STORAGE_KEYS.TIMER_STATE, null);
                const old: Partial<PomodoroState> = isRecord(storedPomodoro) ? storedPomodoro : {};
                pomodoro = {
                    phase: old.phase ?? 'focus',
                    completedFocusCountInCycle: old.completedFocusCountInCycle ?? 0,
                    lastLoveNote: old.lastLoveNote ?? null,
                };
            } catch (error) {
                console.error('[sessionStore] hydrate failed; starting idle:', error);
                clock = IDLE_CLOCK;
                pomodoro = INITIAL_POMODORO;
            }
            set({ pomodoro, tick: 0 });
            // As useSessionClock did on load: re-save, which also replaces a
            // corrupt stored value with the idle clock.
            commit(clock);
        },

        start({ kind, durationMs, extras = {} }) {
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
            commit({ ...get().clock, activeKind: kind, [kind]: newSlot });
        },

        pause() {
            const state = get().clock;
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
        },

        resume() {
            const state = get().clock;
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
        },

        stop() {
            const state = get().clock;
            const { activeKind } = state;
            if (!activeKind) return;
            commit({ ...state, [activeKind]: null, activeKind: null });
        },

        switchTo(kind) {
            const state = get().clock;
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
        },

        extend(additionalMs) {
            const state = get().clock;
            const { activeKind } = state;
            if (!activeKind) return;
            const slot = state[activeKind];
            if (!slot?.isRunning || !slot.endAt || !slot.durationMs) return;
            const extended: SessionSlot = {
                ...slot,
                endAt: slot.endAt + additionalMs,
                durationMs: slot.durationMs + additionalMs,
            };
            commit({ ...state, [activeKind]: extended });
        },

        setSlotExtras(kind, extras) {
            const state = get().clock;
            const slot = state[kind];
            if (!slot) return;
            commit({ ...state, [kind]: { ...slot, ...extras } });
        },

        onComplete(handler) {
            completionHandlers.add(handler);
            return () => {
                completionHandlers.delete(handler);
            };
        },

        setPomodoro(pomodoro) {
            set({ pomodoro });
            saveSync(STORAGE_KEYS.TIMER_STATE, pomodoro);
        },
    };
});

// ─── Engine ───────────────────────────────────────────────────────────────────

/** Clears the slot and calls every handler. The caller has checked the slot ended. */
function completeSlot(slot: SessionSlot, kind: SessionKind) {
    const { clock } = useSessionStore.getState();
    const cleared: SessionClockState = { ...clock, [kind]: null, activeKind: null };
    useSessionStore.setState({ clock: cleared });
    saveSync(STORAGE_KEYS.SESSION_CLOCK, cleared);
    completionHandlers.forEach((h) => h(slot, kind));
}

/**
 * Idempotent completion: does nothing unless `slot` is still the live slot of
 * its kind (same endAt), so the ticker and the foreground event can both see
 * the end and the handlers still run exactly once (FR-TMR-005).
 */
function fireCompletion(slot: SessionSlot, kind: SessionKind) {
    const live = useSessionStore.getState().clock[kind];
    if (!live || live.endAt !== slot.endAt) return;
    completeSlot(slot, kind);
}

/** The active slot if it is running and its end has passed. */
function endedActiveSlot(): { slot: SessionSlot; kind: SessionKind } | null {
    const { clock } = useSessionStore.getState();
    const kind = clock.activeKind;
    if (!kind) return null;
    const slot = clock[kind];
    if (!slot?.isRunning || slot.endAt === null || slot.endAt > Date.now()) return null;
    return { slot, kind };
}

let engineInstances = 0;

/**
 * The session clock's side effects. Mounted exactly once, by StoreGate, after
 * the stores have hydrated (`active`).
 *
 * - On mount: a session that ended while the app was closed is completed at
 *   once (cold start).
 * - Every second: completes the active slot if its end has passed, otherwise
 *   increments `tick`.
 * - On returning to the foreground: completes the active slot if its end has
 *   passed while the app was in the background.
 *
 * Subscribes to nothing, so StoreGate never re-renders because of the clock.
 */
export function useSessionClockEngine(active: boolean): void {
    useEffect(() => {
        if (!active) return;

        if (__DEV__) {
            engineInstances++;
            if (engineInstances > 1) {
                console.error('[sessionStore] Multiple clock engines mounted. Only StoreGate may mount one.');
            }
        }

        // Cold start: the session completed while the app was closed.
        const ended = endedActiveSlot();
        if (ended) completeSlot(ended.slot, ended.kind);

        const interval = setInterval(() => {
            const { clock } = useSessionStore.getState();
            const { activeKind } = clock;
            if (!activeKind) return;
            const slot = clock[activeKind];
            if (!slot?.isRunning || !slot.endAt) return;
            if (slot.endAt <= Date.now()) {
                fireCompletion(slot, activeKind);
            } else {
                // Re-render the time displays so endAt − Date.now() stays fresh.
                useSessionStore.setState((s) => ({ tick: s.tick + 1 }));
            }
        }, 1000);

        const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState !== 'active') return;
            const endedInBackground = endedActiveSlot();
            if (endedInBackground) fireCompletion(endedInBackground.slot, endedInBackground.kind);
        });

        return () => {
            clearInterval(interval);
            sub.remove();
            if (__DEV__) engineInstances--;
        };
    }, [active]);
}
