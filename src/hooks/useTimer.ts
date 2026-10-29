import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimerPhase, Settings, SessionSlot, PomodoroState } from '../types';
import { INITIAL_POMODORO, useSessionStore } from '../stores/sessionStore';
import { minutesToMs, getDayKeyFromDate, getTodayKey } from '../utils/time';
import { useNotifications, getNotificationContent } from './useNotifications';
import * as Haptics from 'expo-haptics';
import type { UseSessionClockReturn } from './useSessionClock';

// The current Pomodoro state, read at call time (not render time) by the
// handlers and actions below.
const currentPomodoro = (): PomodoroState => useSessionStore.getState().pomodoro;

interface UseTimerReturn {
    phase: TimerPhase;
    isRunning: boolean;
    remainingMs: number;
    completedFocusCountInCycle: number;
    showLoveNoteCard: boolean;
    lastLoveNote: string | null;
    start: () => void;
    pause: () => void;
    resume: () => void;
    skip: () => void;
    reset: () => void;
    dismissLoveNote: () => void;
}

export function useTimer(
    settings: Settings,
    pickRandomNote: (lastNote: string | null) => string,
    incrementFocus: (minutes: number, dayKey?: string, sessionId?: string) => void,
    session: UseSessionClockReturn,
): UseTimerReturn {
    // Phase, cycle count and last note: the session store's `pomodoro`
    // (key timer_state), hydrated before the first render (Phase 1 B3).
    const pomodoroState = useSessionStore((s) => s.pomodoro);
    const persistPomodoro = useSessionStore((s) => s.setPomodoro);

    const [showLoveNoteCard, setShowLoveNoteCard] = useState(false);

    const { scheduleSessionEnd, cancelScheduled } = useNotifications();

    // ── Cancel Pomodoro notification when mode switches away ─────────────────
    // switchTo() auto-pauses the clock but doesn't know about notification IDs.
    // This effect watches activeKind and cancels the notif when Pomodoro goes dormant.
    const prevActiveKindRef = useRef(session.state.activeKind);
    useEffect(() => {
        const prev = prevActiveKindRef.current;
        const curr = session.state.activeKind;
        prevActiveKindRef.current = curr;

        if (prev === 'pomodoro' && curr !== 'pomodoro') {
            const notifId = session.state.pomodoro?.scheduledNotificationId ?? null;
            if (notifId) {
                cancelScheduled(notifId).catch(console.warn);
                session.setSlotExtras('pomodoro', { scheduledNotificationId: null });
            }
        }
    }, [session.state.activeKind]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── onComplete subscriber ────────────────────────────────────────────────
    useEffect(() => {
        return session.onComplete((slot: SessionSlot, kind: string) => {
            if (kind !== 'pomodoro') return;

            const wasFocus = slot.phase === 'focus';
            const fCount = slot.completedFocusCountInCycle ?? currentPomodoro().completedFocusCountInCycle;

            if (wasFocus && slot.sessionPlannedMinutes) {
                const dayKey = slot.sessionStartedAt
                    ? getDayKeyFromDate(slot.sessionStartedAt)
                    : getTodayKey();
                incrementFocus(slot.sessionPlannedMinutes, dayKey, slot.sessionId ?? undefined);
            }

            const nextPhase = nextAfterComplete(
                slot.phase ?? currentPomodoro().phase,
                fCount,
                settings.longBreakEvery
            );

            let loveNote: string | null = null;
            if (wasFocus && settings.showLoveNotes) {
                loveNote = pickRandomNote(currentPomodoro().lastLoveNote);
            }

            if (settings.haptics) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }

            const newPomodoro: PomodoroState = {
                phase: nextPhase.phase,
                completedFocusCountInCycle: nextPhase.focusCountInCycle,
                lastLoveNote: loveNote ?? currentPomodoro().lastLoveNote,
            };
            persistPomodoro(newPomodoro);

            if (wasFocus && settings.showLoveNotes) {
                setShowLoveNoteCard(true);
            }
        }, 'pomodoro');
    }, [session.onComplete, settings, pickRandomNote, incrementFocus, persistPomodoro]);

    // ── getDuration helper ───────────────────────────────────────────────────
    const getCurrentDuration = useCallback((): number => {
        switch (pomodoroState.phase) {
            case 'focus': return settings.durations.focus;
            case 'shortBreak': return settings.durations.shortBreak;
            case 'longBreak': return settings.durations.longBreak;
        }
    }, [pomodoroState.phase, settings.durations]);

    // ── Actions ──────────────────────────────────────────────────────────────

    const start = useCallback(async () => {
        const durationMinutes = getCurrentDuration();
        const durationMs = minutesToMs(durationMinutes);
        const now = Date.now();

        let notificationId: string | null = null;
        if (settings.notifications) {
            try {
                const { title, body } = getNotificationContent(currentPomodoro().phase);
                notificationId = await Promise.race([
                    scheduleSessionEnd(now + durationMs, title, body),
                    new Promise<null>(resolve => setTimeout(() => resolve(null), 1000)),
                ]);
            } catch (e) {
                console.warn('Failed to schedule notification:', e);
            }
        }

        session.start({
            kind: 'pomodoro',
            durationMs,
            extras: {
                phase: currentPomodoro().phase,
                completedFocusCountInCycle: currentPomodoro().completedFocusCountInCycle,
                sessionPlannedMinutes: durationMinutes,
                scheduledNotificationId: notificationId,
            },
        });
    }, [getCurrentDuration, settings.notifications, scheduleSessionEnd, session]);

    const pause = useCallback(async () => {
        const notifId = session.state.pomodoro?.scheduledNotificationId ?? null;
        if (notifId) {
            cancelScheduled(notifId).catch(console.warn);
            session.setSlotExtras('pomodoro', { scheduledNotificationId: null });
        }
        session.pause();
    }, [session, cancelScheduled]);

    const resume = useCallback(async () => {
        const slot = session.state.pomodoro;
        if (!slot || slot.isRunning || slot.pausedRemainingMs === null) return;

        session.resume();

        if (settings.notifications) {
            const endAt = Date.now() + slot.pausedRemainingMs;
            try {
                const { title, body } = getNotificationContent(currentPomodoro().phase);
                const notifId = await Promise.race([
                    scheduleSessionEnd(endAt, title, body),
                    new Promise<null>(resolve => setTimeout(() => resolve(null), 1000)),
                ]);
                session.setSlotExtras('pomodoro', { scheduledNotificationId: notifId });
            } catch (e) {
                console.warn('Failed to reschedule notification:', e);
            }
        }
    }, [session, settings.notifications, scheduleSessionEnd]);

    const skip = useCallback(() => {
        const notifId = session.state.pomodoro?.scheduledNotificationId ?? null;
        if (notifId) cancelScheduled(notifId).catch(console.warn);
        session.stop();

        const next = nextAfterSkip(
            currentPomodoro().phase,
            currentPomodoro().completedFocusCountInCycle
        );
        persistPomodoro({ ...currentPomodoro(), phase: next.phase, completedFocusCountInCycle: next.focusCountInCycle });
    }, [session, cancelScheduled, persistPomodoro]);

    const reset = useCallback(() => {
        const notifId = session.state.pomodoro?.scheduledNotificationId ?? null;
        if (notifId) cancelScheduled(notifId).catch(console.warn);
        session.stop();
        persistPomodoro(INITIAL_POMODORO);
        setShowLoveNoteCard(false);
    }, [session, cancelScheduled, persistPomodoro]);

    const dismissLoveNote = useCallback(() => {
        setShowLoveNoteCard(false);
    }, []);

    // ── Derived values ────────────────────────────────────────────────────────

    const pomodoroSlot = session.state.pomodoro;
    const isRunning = pomodoroSlot?.isRunning === true;

    const remainingMs = (() => {
        if (!pomodoroSlot) return minutesToMs(getCurrentDuration());
        if (pomodoroSlot.isRunning && pomodoroSlot.endAt) {
            return Math.max(0, pomodoroSlot.endAt - Date.now());
        }
        return pomodoroSlot.pausedRemainingMs ?? minutesToMs(getCurrentDuration());
    })();

    return {
        phase: pomodoroState.phase,
        isRunning,
        remainingMs,
        completedFocusCountInCycle: pomodoroState.completedFocusCountInCycle,
        showLoveNoteCard,
        lastLoveNote: pomodoroState.lastLoveNote,
        start,
        pause,
        resume,
        skip,
        reset,
        dismissLoveNote,
    };
}

// ─── Phase state machines (unchanged logic) ───────────────────────────────────
// Exported for unit tests only (src/hooks/__tests__/timerPhases.test.ts).

export function nextAfterComplete(
    phase: TimerPhase,
    focusCountInCycle: number,
    longBreakEvery: number
): { phase: TimerPhase; focusCountInCycle: number } {
    if (phase === 'focus') {
        const newCount = focusCountInCycle + 1;
        if (newCount >= longBreakEvery) {
            return { phase: 'longBreak', focusCountInCycle: 0 };
        }
        return { phase: 'shortBreak', focusCountInCycle: newCount };
    }
    return { phase: 'focus', focusCountInCycle };
}

export function nextAfterSkip(
    phase: TimerPhase,
    focusCountInCycle: number
): { phase: TimerPhase; focusCountInCycle: number } {
    if (phase === 'focus') {
        return { phase: 'shortBreak', focusCountInCycle };
    }
    return { phase: 'focus', focusCountInCycle };
}
