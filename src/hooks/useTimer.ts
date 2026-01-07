import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimerState, TimerPhase, Settings } from '../types';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import { minutesToMs } from '../utils/time';
import { useNotifications, getNotificationContent } from './useNotifications';
import * as Haptics from 'expo-haptics';

const INITIAL_TIMER_STATE: TimerState = {
    phase: 'focus',
    isRunning: false,
    endAt: null,
    remainingMs: null,
    completedFocusCountInCycle: 0,
    scheduledNotificationId: null,
    sessionPlannedMinutes: null,
    lastHandledEndAt: null, // Idempotency: prevent double-completion
    // Love note state (Phase 5)
    lastLoveNote: null,
    lastTransitionId: 0,
    showLoveNoteCard: false,
};

interface UseTimerReturn {
    // State
    phase: TimerPhase;
    isRunning: boolean;
    remainingMs: number;
    completedFocusCountInCycle: number;
    showLoveNoteCard: boolean;  // Phase 5: show love note
    lastLoveNote: string | null;  // Phase 5: current love note

    // Actions
    start: () => void;
    pause: () => void;
    resume: () => void;
    skip: () => void;
    reset: () => void;
    dismissLoveNote: () => void;  // Phase 5: dismiss love note card
}

export function useTimer(settings: Settings, pickRandomNote: (lastNote: string | null) => string, incrementFocus: (minutes: number) => void): UseTimerReturn {
    const [state, setState] = useState<TimerState>(INITIAL_TIMER_STATE);
    const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const { scheduleSessionEnd, cancelScheduled } = useNotifications();

    // Persist state whenever it changes (defined early for handleSessionComplete)
    const persistState = useCallback((newState: TimerState) => {
        setState(newState);
        save(STORAGE_KEYS.TIMER_STATE, newState);
    }, []);

    // Handle session completion (refactored to accept state parameter)
    const handleSessionComplete = useCallback(
        (s: TimerState) => {
            // Hard guard: cannot complete without an endAt
            if (s.endAt === null) return;

            // Idempotency check: only handle completion once per endAt
            if (s.endAt === s.lastHandledEndAt) {
                return; // Already handled this completion
            }

            const wasFocus = s.phase === 'focus';

            // Update stats if focus was completed (not skipped)
            if (wasFocus && s.sessionPlannedMinutes !== null) {
                incrementFocus(s.sessionPlannedMinutes);
            }

            // Determine next phase
            const nextPhase = getNextPhase(
                s.phase,
                wasFocus ? s.completedFocusCountInCycle + 1 : s.completedFocusCountInCycle,
                settings.longBreakEvery
            );

            // Pick love note ONLY on focus completion (not on breaks)
            let loveNote: string | null = null;
            let showCard = false;
            let transitionId = s.lastTransitionId;

            if (wasFocus && settings.showLoveNotes) {
                loveNote = pickRandomNote(s.lastLoveNote);
                showCard = true;
                transitionId = s.lastTransitionId + 1;
            }

            // Trigger haptics (Phase 9) - single trigger point
            if (settings.haptics) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // TODO(optional-feature): Add completion sound when sound asset is available
            // Requires: src/assets/sounds/complete.mp3 (0.5-1s chime)
            // Implementation: expo-audio v1.1.1 (NOT expo-av)

            persistState({
                ...INITIAL_TIMER_STATE,
                phase: nextPhase.phase,
                completedFocusCountInCycle: nextPhase.cycleCount,
                lastHandledEndAt: s.endAt,
                lastLoveNote: loveNote ?? s.lastLoveNote, // Preserve last note even on break completion
                lastTransitionId: transitionId,
                showLoveNoteCard: showCard,
            });
        },
        [settings.longBreakEvery, settings.showLoveNotes, persistState, pickRandomNote]
    );

    // Load persisted state on mount + check for cold-start completion
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const loaded = await load<TimerState>(STORAGE_KEYS.TIMER_STATE, INITIAL_TIMER_STATE);
            if (cancelled) return;

            // Merge with defaults to handle old persisted state missing new fields
            const merged: TimerState = { ...INITIAL_TIMER_STATE, ...loaded };

            // If session ended while app was closed, complete immediately using loaded state
            if (merged.isRunning && merged.endAt !== null && merged.endAt <= Date.now()) {
                handleSessionComplete(merged);
                return;
            }

            setState(merged);
        })();

        return () => {
            cancelled = true;
        };
    }, [handleSessionComplete]);



    // Handle app resume from background
    useEffect(() => {
        const { AppState } = require('react-native');
        const subscription = AppState.addEventListener('change', (nextAppState: string) => {
            if (nextAppState === 'active') {
                // App came to foreground - check if session ended while backgrounded
                setState((currentState: TimerState) => {
                    if (currentState.isRunning && currentState.endAt !== null) {
                        const now = Date.now();
                        const remaining = Math.max(0, currentState.endAt - now);

                        if (remaining === 0) {
                            // Session ended while backgrounded - complete immediately
                            handleSessionComplete(currentState);
                            return currentState; // handleSessionComplete will persist new state
                        } else {
                            // Update remaining time
                            return { ...currentState, remainingMs: remaining };
                        }
                    }
                    return currentState;
                });
            }
        });

        return () => {
            subscription.remove();
        };
    }, [handleSessionComplete]);

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
                // Session complete - use current state snapshot
                handleSessionComplete(state);
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
    const start = useCallback(async () => {
        const durationMinutes = getCurrentDuration();
        const durationMs = minutesToMs(durationMinutes);
        const now = Date.now();
        const endAt = now + durationMs;

        // Schedule notification if enabled
        let notificationId: string | null = null;
        if (settings.notifications) {
            const { title, body } = getNotificationContent(state.phase);
            notificationId = await scheduleSessionEnd(endAt, title, body);
        }

        persistState({
            ...state,
            isRunning: true,
            endAt,
            remainingMs: durationMs,
            sessionPlannedMinutes: durationMinutes,
            scheduledNotificationId: notificationId,
        });
    }, [state, getCurrentDuration, persistState, settings.notifications, scheduleSessionEnd]);

    // Pause the running session
    const pause = useCallback(async () => {
        if (!state.isRunning || state.endAt === null) return;

        const now = Date.now();
        const remaining = Math.max(0, state.endAt - now);

        // Cancel scheduled notification
        await cancelScheduled(state.scheduledNotificationId);

        persistState({
            ...state,
            isRunning: false,
            endAt: null,
            remainingMs: remaining,
            scheduledNotificationId: null,
        });
    }, [state, persistState, cancelScheduled]);

    // Resume paused session
    const resume = useCallback(async () => {
        if (state.isRunning || state.remainingMs === null) return;

        const now = Date.now();
        const endAt = now + state.remainingMs;

        // Reschedule notification if enabled
        let notificationId: string | null = null;
        if (settings.notifications) {
            const { title, body } = getNotificationContent(state.phase);
            notificationId = await scheduleSessionEnd(endAt, title, body);
        }

        persistState({
            ...state,
            isRunning: true,
            endAt,
            scheduledNotificationId: notificationId,
        });
    }, [state, persistState, settings.notifications, scheduleSessionEnd]);

    // Skip to next phase
    const skip = useCallback(async () => {
        // Cancel any scheduled notification
        await cancelScheduled(state.scheduledNotificationId);

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
    }, [state, settings, persistState, cancelScheduled]);

    // Reset to initial state
    const reset = useCallback(async () => {
        // Cancel any scheduled notification
        await cancelScheduled(state.scheduledNotificationId);

        persistState(INITIAL_TIMER_STATE);
    }, [persistState, state.scheduledNotificationId, cancelScheduled]);

    // handleSessionComplete moved to top of hook (before useEffects that depend on it)

    // Dismiss love note card
    const dismissLoveNote = useCallback(() => {
        persistState({
            ...state,
            showLoveNoteCard: false,
        });
    }, [state, persistState]);

    // Compute displayed remaining time
    const displayedRemainingMs = state.isRunning && state.endAt !== null
        ? Math.max(0, state.endAt - Date.now())
        : (state.remainingMs ?? minutesToMs(getCurrentDuration()));

    return {
        phase: state.phase,
        isRunning: state.isRunning,
        remainingMs: displayedRemainingMs,
        completedFocusCountInCycle: state.completedFocusCountInCycle,
        showLoveNoteCard: state.showLoveNoteCard,
        lastLoveNote: state.lastLoveNote,
        start,
        pause,
        resume,
        skip,
        reset,
        dismissLoveNote,
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


