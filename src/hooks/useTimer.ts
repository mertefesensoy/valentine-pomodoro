import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimerState, TimerPhase, Settings } from '../types';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import { minutesToMs, getTodayKey } from '../utils/time';

const INITIAL_TIMER_STATE: TimerState = {
    phase: 'focus',
    isRunning: false,
    endAt: null,
    remainingMs: null,
    completedFocusCountInCycle: 0,
    scheduledNotificationId: null,
    sessionPlannedMinutes: null,
};

interface UseTimerReturn {
    // State
    phase: TimerPhase;
    isRunning: boolean;
    remainingMs: number;
    completedFocusCountInCycle: number;

    // Actions
    start: () => void;
    pause: () => void;
    resume: () => void;
    skip: () => void;
    reset: () => void;
}

export function useTimer(settings: Settings): UseTimerReturn {
    const [state, setState] = useState<TimerState>(INITIAL_TIMER_STATE);
    const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load persisted state on mount
    useEffect(() => {
        load<TimerState>(STORAGE_KEYS.TIMER_STATE, INITIAL_TIMER_STATE).then((loaded) => {
            setState(loaded);
        });
    }, []);

    // Persist state whenever it changes
    const persistState = useCallback((newState: TimerState) => {
        setState(newState);
        save(STORAGE_KEYS.TIMER_STATE, newState);
    }, []);

    // Compute remaining time from endAt (timestamp-based, no drift)
    useEffect(() => {
        if (!state.isRunning || state.endAt === null) {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
                tickIntervalRef.current = null;
            }
            return;
        }

        // Tick every second to update UI
        tickIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, state.endAt! - now);

            if (remaining === 0) {
                // Session complete
                handleSessionComplete();
            } else {
                // Update remaining time (for display only, don't persist every tick)
                setState((prev: TimerState) => ({ ...prev, remainingMs: remaining }));
            }
        }, 1000);

        return () => {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
            }
        };
    }, [state.isRunning, state.endAt]); // handleSessionComplete not in deps to avoid circular dependency

    // Get duration for current phase
    const getCurrentDuration = useCallback((): number => {
        switch (state.phase) {
            case 'focus':
                return settings.durations.focus;
            case 'shortBreak':
                return settings.durations.shortBreak;
            case 'longBreak':
                return settings.durations.longBreak;
        }
    }, [state.phase, settings]);

    // Start a new session
    const start = useCallback(() => {
        const durationMinutes = getCurrentDuration();
        const durationMs = minutesToMs(durationMinutes);
        const now = Date.now();

        persistState({
            ...state,
            isRunning: true,
            endAt: now + durationMs,
            remainingMs: durationMs,
            sessionPlannedMinutes: durationMinutes, // Capture actual duration for stats
            // TODO: Schedule notification here (Phase 4)
            // scheduledNotificationId will be set in Phase 4
        });
    }, [state, getCurrentDuration, persistState]);

    // Pause the running session
    const pause = useCallback(() => {
        if (!state.isRunning || state.endAt === null) return;

        const now = Date.now();
        const remaining = Math.max(0, state.endAt - now);

        persistState({
            ...state,
            isRunning: false,
            endAt: null,
            remainingMs: remaining,
            // TODO: Cancel notification here (Phase 4)
            scheduledNotificationId: null,
        });
    }, [state, persistState]);

    // Resume paused session
    const resume = useCallback(() => {
        if (state.isRunning || state.remainingMs === null) return;

        const now = Date.now();

        persistState({
            ...state,
            isRunning: true,
            endAt: now + state.remainingMs,
            // TODO: Reschedule notification here (Phase 4)
        });
    }, [state, persistState]);

    // Skip to next phase
    const skip = useCallback(() => {
        // IMPORTANT: Do NOT increment stats when skipping focus
        const nextPhase = getNextPhase(
            state.phase,
            state.completedFocusCountInCycle,
            settings.longBreakEvery
        );

        persistState({
            ...INITIAL_TIMER_STATE,
            phase: nextPhase.phase,
            completedFocusCountInCycle: nextPhase.cycleCount,
        });
    }, [state, settings, persistState]);

    // Reset to initial state
    const reset = useCallback(() => {
        persistState(INITIAL_TIMER_STATE);
    }, [persistState]);

    // Handle session completion
    const handleSessionComplete = useCallback(() => {
        const wasFocus = state.phase === 'focus';

        // Update stats if focus was completed (not skipped)
        if (wasFocus && state.sessionPlannedMinutes !== null) {
            updateStats(state.sessionPlannedMinutes);
        }

        // Determine next phase
        const nextPhase = getNextPhase(
            state.phase,
            wasFocus ? state.completedFocusCountInCycle + 1 : state.completedFocusCountInCycle,
            settings.longBreakEvery
        );

        // TODO: Show love note card here (Phase 5)
        // TODO: Trigger haptics + sound here (Phase 9)

        persistState({
            ...INITIAL_TIMER_STATE,
            phase: nextPhase.phase,
            completedFocusCountInCycle: nextPhase.cycleCount,
        });
    }, [state, settings, persistState]);

    // Compute displayed remaining time
    const displayedRemainingMs = state.isRunning && state.endAt !== null
        ? Math.max(0, state.endAt - Date.now())
        : (state.remainingMs ?? minutesToMs(getCurrentDuration()));

    return {
        phase: state.phase,
        isRunning: state.isRunning,
        remainingMs: displayedRemainingMs,
        completedFocusCountInCycle: state.completedFocusCountInCycle,
        start,
        pause,
        resume,
        skip,
        reset,
    };
}

/**
 * Determine next phase based on current phase and cycle count
 */
function getNextPhase(
    currentPhase: TimerPhase,
    cycleCount: number,
    longBreakEvery: number
): { phase: TimerPhase; cycleCount: number } {
    if (currentPhase === 'focus') {
        // After focus: either short break or long break
        if (cycleCount >= longBreakEvery) {
            return { phase: 'longBreak', cycleCount: 0 }; // Reset cycle after long break
        } else {
            return { phase: 'shortBreak', cycleCount };
        }
    } else {
        // After any break: back to focus
        return { phase: 'focus', cycleCount };
    }
}

/**
 * Update stats for completed focus session
 * TODO: Move to useStats hook in Phase 6
 */
async function updateStats(focusMinutes: number): Promise<void> {
    try {
        const todayKey = getTodayKey();
        const stats = await load<Record<string, { focusSessions: number; focusMinutes: number }>>(
            STORAGE_KEYS.STATS,
            {}
        );

        const todayStats = stats[todayKey] || { focusSessions: 0, focusMinutes: 0 };
        todayStats.focusSessions += 1;
        todayStats.focusMinutes += focusMinutes;

        stats[todayKey] = todayStats;
        await save(STORAGE_KEYS.STATS, stats);
    } catch (error) {
        console.error('[useTimer] Failed to update stats:', error);
    }
}
