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
// The clock's side effects (the scheduler, the AppState listener and the
// cold-start completion check) are in useSessionClockEngine()
// (src/stores/clockStore.ts), which StoreGate mounts exactly once. They all
// complete sessions through completeEndedSession(), below. Components read the
// clock through the useSessionClock() facade (src/hooks/useSessionClock.ts).

export const IDLE_CLOCK: SessionClockState = { activeKind: null, pomodoro: null, fly: null };

export const INITIAL_POMODORO: PomodoroState = {
    phase: 'focus',
    completedFocusCountInCycle: 0,
    lastLoveNote: null,
};

export type CompletionHandler = (slot: SessionSlot, kind: SessionKind) => void;

// Functions, not state: subscribers register here, each with the kind of
// session it handles (null: every kind), and are called on completion.
const completionHandlers = new Map<CompletionHandler, SessionKind | null>();

function hasHandlerFor(kind: SessionKind): boolean {
    for (const k of completionHandlers.values()) {
        if (k === null || k === kind) return true;
    }
    return false;
}

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
    /**
     * Registers a completion handler for sessions of `kind` (default: every
     * kind). Returns the unsubscribe function. If a session of that kind has
     * already ended and is waiting for a handler (DEF-004), it is completed
     * now, during this call.
     */
    onComplete(handler: CompletionHandler, kind?: SessionKind): () => void;
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

        onComplete(handler, kind) {
            completionHandlers.set(handler, kind ?? null);
            // A session that ended before anything could handle it (DEF-004).
            const ended = endedActiveSlot();
            if (ended && (kind === undefined || kind === ended.kind)) fireCompletion(ended.slot, ended.kind);
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

/**
 * Idempotent completion: clears the slot and calls the handlers for its kind,
 * exactly once (FR-TMR-005).
 *
 * - Does nothing unless `slot` is still the live slot of its kind (same
 *   endAt), so the ticker, the foreground event, the cold-start check and a
 *   handler's registration can all see the end and it still completes once.
 * - Does nothing while no handler for `kind` is registered (DEF-004): the
 *   session stays ended-but-pending, and completes when one registers. On a
 *   phone the screens that handle completions mount only after the navigator
 *   has resolved its initial URL, after the clock has hydrated.
 */
function fireCompletion(slot: SessionSlot, kind: SessionKind) {
    const live = useSessionStore.getState().clock[kind];
    if (!live || live.endAt !== slot.endAt) return;
    if (!hasHandlerFor(kind)) return;

    const { clock } = useSessionStore.getState();
    const cleared: SessionClockState = { ...clock, [kind]: null, activeKind: null };
    useSessionStore.setState({ clock: cleared });
    saveSync(STORAGE_KEYS.SESSION_CLOCK, cleared);
    completionHandlers.forEach((k, h) => {
        if (k === null || k === kind) h(slot, kind);
    });
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

/**
 * Completes the active session if its end has passed, through fireCompletion's
 * guards: exactly once (FR-TMR-005), and only once a handler for its kind is
 * registered (DEF-004). Every completion path calls this: the clock store's
 * scheduler, the foreground event and the cold-start check. Safe to call at
 * any time; it does nothing unless a session has ended.
 */
export function completeEndedSession(): void {
    const ended = endedActiveSlot();
    if (ended) fireCompletion(ended.slot, ended.kind);
}
