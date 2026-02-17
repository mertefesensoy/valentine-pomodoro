import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import type { StatsMap, DayStats, StatsState, StreakState } from '../types';
import { getTodayKey, diffDays } from '../utils/time';

const DEFAULT_GOAL_MINUTES = 50;

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function parseDayKey(dayKey: string) {
    const [y, m, d] = dayKey.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function addDay(a?: DayStats, b?: DayStats): DayStats {
    // merge numeric counters; preserve goal snapshot + hit flags conservatively
    const aGoal = a?.goalMinutes;
    const bGoal = b?.goalMinutes;
    const goalMinutes = aGoal ?? bGoal;

    const goalHit = Boolean(a?.goalHit || b?.goalHit);

    // keep earliest goalHitAt if both exist
    const goalHitAt =
        a?.goalHitAt && b?.goalHitAt
            ? (a.goalHitAt < b.goalHitAt ? a.goalHitAt : b.goalHitAt)
            : (a?.goalHitAt ?? b?.goalHitAt);

    return {
        focusSessions: (a?.focusSessions ?? 0) + (b?.focusSessions ?? 0),
        focusMinutes: (a?.focusMinutes ?? 0) + (b?.focusMinutes ?? 0),
        goalMinutes,
        goalHit,
        goalHitAt,
    };
}

function mergeDays(loaded: StatsMap, current: StatsMap): StatsMap {
    const keys = new Set([...Object.keys(loaded), ...Object.keys(current)]);
    const next: StatsMap = {};
    keys.forEach((k) => {
        next[k] = addDay(loaded[k], current[k]);
    });
    return next;
}

function isV2(x: any): x is StatsState {
    return x && typeof x === 'object' && x.days && typeof x.goalMinutes === 'number' && x.streak;
}

function normalizeStreakForToday(streak: StreakState, todayKey: string): StreakState {
    if (!streak.lastHitDayKey) return { current: 0, best: streak.best ?? 0 };
    const daysSinceHit = diffDays(todayKey, streak.lastHitDayKey);

    // if last hit was 2+ days ago, streak is broken *today*
    if (daysSinceHit >= 2) {
        return { ...streak, current: 0 };
    }
    return streak;
}

export function useStats() {
    const [state, setState] = useState<StatsState>({
        days: {},
        goalMinutes: DEFAULT_GOAL_MINUTES,
        streak: { current: 0, best: 0 },
    });
    const [isReady, setIsReady] = useState(false);

    // Phase 6: Side effect triggers (moved out of setState updaters)
    const [saveVersion, setSaveVersion] = useState(0);
    const [celebrationTrigger, setCelebrationTrigger] = useState<{
        dayKey: string;
        newStreak: number;
        timestamp: number;
    } | null>(null);

    // optional: fire "goal reached" animation from UI
    const [goalHitPulse, setGoalHitPulse] = useState<null | { dayKey: string; newStreak: number }>(null);

    const saveChainRef = useRef(Promise.resolve());
    const enqueueSave = useCallback((data: StatsState) => {
        saveChainRef.current = saveChainRef.current
            .then(() => save(STORAGE_KEYS.STATS_V2, data))
            .catch((e) => console.error('[useStats] Failed to save:', e));
    }, []);

    // Phase 6: Save effect (pure, triggered by version bump)
    useEffect(() => {
        if (saveVersion === 0) return; // Skip initial mount
        if (!isReady) return;
        enqueueSave(state);
    }, [saveVersion, state, isReady, enqueueSave]);

    // Phase 6: Celebration effect (pure, triggered by celebrationTrigger)
    useEffect(() => {
        if (!celebrationTrigger) return;
        setGoalHitPulse({
            dayKey: celebrationTrigger.dayKey,
            newStreak: celebrationTrigger.newStreak,
        });
    }, [celebrationTrigger]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const loadedV2 = await load<StatsState | null>(STORAGE_KEYS.STATS_V2, null);

                // migrate from old v1 map if needed
                const loadedV1 = loadedV2 ? null : await load<StatsMap>(STORAGE_KEYS.STATS, {});

                if (cancelled) return;

                setState((prev) => {
                    const todayKey = getTodayKey();

                    if (loadedV2 && isV2(loadedV2)) {
                        const mergedDays = mergeDays(loadedV2.days, prev.days);
                        const streak = normalizeStreakForToday(loadedV2.streak, todayKey);

                        const next: StatsState = {
                            days: mergedDays,
                            goalMinutes: loadedV2.goalMinutes ?? DEFAULT_GOAL_MINUTES,
                            streak,
                        };

                        // ✅ Pure: trigger save via version bump (outside updater)
                        setSaveVersion(v => v + 1);
                        return next;
                    }

                    // v1 -> v2
                    const mergedDays = mergeDays(loadedV1 ?? {}, prev.days);
                    const next: StatsState = {
                        days: mergedDays,
                        goalMinutes: DEFAULT_GOAL_MINUTES,
                        streak: { current: 0, best: 0 },
                    };

                    // ✅ Pure: trigger save via version bump
                    setSaveVersion(v => v + 1);
                    return next;
                });
            } finally {
                if (!cancelled) setIsReady(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [enqueueSave]);

    const setGoalMinutes = useCallback(
        (minutes: number) => {
            const goal = clamp(Math.round(minutes), 0, 1440);
            setState((prev) => {
                const next = { ...prev, goalMinutes: goal };
                // ✅ Pure: trigger save outside updater
                return next;
            });
            setSaveVersion(v => v + 1);
        },
        []
    );

    const incrementFocus = useCallback(
        (minutes: number, dayKey?: string, sessionId?: string) => {
            const targetDayKey = dayKey ?? getTodayKey();
            const nowIso = new Date().toISOString();

            setState((prev) => {
                // ✅ Idempotency: prevent double-counting the same session
                if (sessionId && sessionId === prev.lastAppliedSessionId) {
                    if (__DEV__) {
                        console.warn('[useStats] Ignoring duplicate session:', sessionId);
                    }
                    return prev; // Already applied, no-op
                }

                const goalMinutes = prev.goalMinutes;

                const today: DayStats = prev.days[targetDayKey] ?? { focusSessions: 0, focusMinutes: 0 };

                // snapshot goal for the day the first time we touch it
                const dayGoal = today.goalMinutes ?? goalMinutes;

                const nextMinutes = today.focusMinutes + minutes;
                const nextSessions = today.focusSessions + 1;

                const wasHit = Boolean(today.goalHit);
                const nowHit = dayGoal > 0 && nextMinutes >= dayGoal;

                const hitTransition = !wasHit && nowHit;

                // update day record
                const nextDay: DayStats = {
                    ...today,
                    focusSessions: nextSessions,
                    focusMinutes: nextMinutes,
                    goalMinutes: dayGoal,
                    goalHit: wasHit || nowHit,
                    goalHitAt: hitTransition ? nowIso : today.goalHitAt,
                };

                // update streak only on first hit of the day
                let nextStreak = prev.streak;
                if (hitTransition) {
                    const yesterdayKeyDate = new Date();
                    yesterdayKeyDate.setDate(yesterdayKeyDate.getDate() - 1);
                    const yyyy = yesterdayKeyDate.getFullYear();
                    const mm = String(yesterdayKeyDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(yesterdayKeyDate.getDate()).padStart(2, '0');
                    const yesterdayKey = `${yyyy}-${mm}-${dd}`;

                    const yesterday = prev.days[yesterdayKey];
                    const shouldContinue =
                        (yesterday?.goalHit === true) || (prev.streak.lastHitDayKey === yesterdayKey);

                    const newCurrent = shouldContinue ? (prev.streak.current ?? 0) + 1 : 1;
                    const newBest = Math.max(prev.streak.best ?? 0, newCurrent);

                    nextStreak = { current: newCurrent, best: newBest, lastHitDayKey: targetDayKey };

                    // ✅ Pure: trigger celebration outside updater (prevents StrictMode double-fire)
                    setCelebrationTrigger({
                        dayKey: targetDayKey,
                        newStreak: newCurrent,
                        timestamp: Date.now(), // Unique trigger
                    });
                }

                const next: StatsState = {
                    ...prev,
                    days: { ...prev.days, [targetDayKey]: nextDay },
                    streak: nextStreak,
                    lastAppliedSessionId: sessionId ?? prev.lastAppliedSessionId,
                };

                if (__DEV__) {
                    console.log('[useStats] incrementFocus', {
                        minutes,
                        targetDayKey,
                        sessionId,
                        nextDay,
                        hitTransition,
                        newStreak: nextStreak,
                    });
                }

                // ✅ Pure: no save here, return state only
                return next;
            });

            // ✅ Trigger save outside updater (after setState completes)
            setSaveVersion(v => v + 1);
        },
        []
    );

    // derived views (same as your existing API)
    const today: DayStats = useMemo(() => {
        const k = getTodayKey();
        return state.days[k] ?? { focusSessions: 0, focusMinutes: 0 };
    }, [state.days]);

    const totals: DayStats = useMemo(() => {
        return Object.values(state.days).reduce(
            (acc, day) => ({
                focusSessions: acc.focusSessions + day.focusSessions,
                focusMinutes: acc.focusMinutes + day.focusMinutes,
            }),
            { focusSessions: 0, focusMinutes: 0 }
        );
    }, [state.days]);

    const last7Days = useMemo((): Array<[string, DayStats]> => {
        const now = new Date();
        const result: Array<[string, DayStats]> = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dayKey = `${yyyy}-${mm}-${dd}`;
            result.push([dayKey, state.days[dayKey] ?? { focusSessions: 0, focusMinutes: 0 }]);
        }

        return result;
    }, [state.days]);

    // IMPORTANT: streak should break if last hit was 2+ days ago (even if no new focus today)
    const streak = useMemo(() => {
        return normalizeStreakForToday(state.streak, getTodayKey());
    }, [state.streak]);

    return {
        // keep existing contract
        stats: state.days,
        isReady,
        incrementFocus,
        today,
        totals,
        last7Days,

        // new fields for your StatsScreen upgrade
        goalMinutes: state.goalMinutes,
        setGoalMinutes,
        streak,

        // hook for "Duolingo pop" animation
        goalHitPulse,
        clearGoalHitPulse: () => setGoalHitPulse(null),
    };
}
