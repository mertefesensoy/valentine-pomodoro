import { useMemo } from 'react';
import { create } from 'zustand';
import type { DayStats, StatsMap, StatsState, StreakState } from '../types';
import { diffDays, getTodayKey } from '../utils/time';
import { loadSync, saveSync, STORAGE_KEYS } from '../utils/storage';

// The stats store (Phase 1 B3): daily stats, the goal and the streak, key
// `stats_v2`, with a one-time read of the 1.0.x `stats` map. Replaces the
// useStats hook that AppProvider hosted. The derived views (today, totals, the
// last 7 days, the streak as shown today) are computed in useStatsViews().

export const DEFAULT_GOAL_MINUTES = 50;

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
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

/** The streak as it stands on `todayKey`: broken (current 0) if the last hit was 2+ days ago. */
export function normalizeStreakForToday(streak: StreakState, todayKey: string): StreakState {
    if (!streak.lastHitDayKey) return { current: 0, best: streak.best ?? 0 };
    const daysSinceHit = diffDays(todayKey, streak.lastHitDayKey);

    // if last hit was 2+ days ago, streak is broken *today*
    if (daysSinceHit >= 2) {
        return { ...streak, current: 0 };
    }
    return streak;
}

const EMPTY_STATS: StatsState = {
    days: {},
    goalMinutes: DEFAULT_GOAL_MINUTES,
    streak: { current: 0, best: 0 },
};

export interface GoalHitPulse {
    dayKey: string;
    newStreak: number;
}

export interface StatsStore extends StatsState {
    /** True once hydrate() has run. Everything below StoreGate sees true. */
    isReady: boolean;
    /** Set when a credit first reaches the day's goal; the Timer screen shows the celebration and clears it. */
    goalHitPulse: GoalHitPulse | null;

    /**
     * Reads `stats_v2` from MMKV synchronously, or, when it is absent, the
     * 1.0.x `stats` map, and writes the result back as `stats_v2`. Keeps
     * `lastAppliedSessionId` (DEF-002). Never throws.
     */
    hydrate(): void;
    /**
     * Credits one completed focus session of `minutes` to `dayKey` (default:
     * today). A `sessionId` equal to the last one credited is ignored
     * (FR-STA-002). The first credit that reaches the day's goal marks the day
     * hit, updates the streak and sets `goalHitPulse`. Persists.
     */
    incrementFocus(minutes: number, dayKey?: string, sessionId?: string): void;
    /** Rounds and clamps to 0–1440 minutes (0 = off), then persists. */
    setGoalMinutes(minutes: number): void;
    clearGoalHitPulse(): void;
}

/** The persisted part of the store, in the stored shape. */
function persisted(s: StatsState): StatsState {
    const out: StatsState = { days: s.days, goalMinutes: s.goalMinutes, streak: s.streak };
    if (s.lastAppliedSessionId !== undefined) out.lastAppliedSessionId = s.lastAppliedSessionId;
    return out;
}

export const useStatsStore = create<StatsStore>()((set, get) => ({
    ...EMPTY_STATS,
    isReady: false,
    goalHitPulse: null,

    hydrate() {
        try {
            const loadedV2 = loadSync<StatsState | null>(STORAGE_KEYS.STATS_V2, null);
            // migrate from old v1 map if needed
            const loadedV1 = loadedV2 ? null : loadSync<StatsMap>(STORAGE_KEYS.STATS, {});
            const todayKey = getTodayKey();

            let next: StatsState;
            if (loadedV2 && isV2(loadedV2)) {
                next = {
                    days: mergeDays(loadedV2.days, {}),
                    goalMinutes: loadedV2.goalMinutes ?? DEFAULT_GOAL_MINUTES,
                    streak: normalizeStreakForToday(loadedV2.streak, todayKey),
                };
                // DEF-002: the idempotency key survives a relaunch.
                if (typeof loadedV2.lastAppliedSessionId === 'string') {
                    next.lastAppliedSessionId = loadedV2.lastAppliedSessionId;
                }
            } else {
                // v1 -> v2
                next = {
                    days: mergeDays(loadedV1 ?? {}, {}),
                    goalMinutes: DEFAULT_GOAL_MINUTES,
                    streak: { current: 0, best: 0 },
                };
            }

            set({ ...next, lastAppliedSessionId: next.lastAppliedSessionId, isReady: true, goalHitPulse: null });
            saveSync(STORAGE_KEYS.STATS_V2, persisted(next));
        } catch (error) {
            console.error('[statsStore] hydrate failed; using empty stats:', error);
            set({ ...EMPTY_STATS, lastAppliedSessionId: undefined, isReady: true, goalHitPulse: null });
        }
    },

    incrementFocus(minutes, dayKey, sessionId) {
        const targetDayKey = dayKey ?? getTodayKey();
        const nowIso = new Date().toISOString();
        const prev = get();

        // ✅ Idempotency: prevent double-counting the same session
        if (sessionId && sessionId === prev.lastAppliedSessionId) {
            if (__DEV__) {
                console.warn('[statsStore] Ignoring duplicate session:', sessionId);
            }
            return; // Already applied, no-op
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
        let goalHitPulse = prev.goalHitPulse;
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
            goalHitPulse = { dayKey: targetDayKey, newStreak: newCurrent };
        }

        const next: StatsState = {
            days: { ...prev.days, [targetDayKey]: nextDay },
            goalMinutes,
            streak: nextStreak,
            lastAppliedSessionId: sessionId ?? prev.lastAppliedSessionId,
        };

        if (__DEV__) {
            console.log('[statsStore] incrementFocus', {
                minutes,
                targetDayKey,
                sessionId,
                nextDay,
                hitTransition,
                newStreak: nextStreak,
            });
        }

        set({ ...next, goalHitPulse });
        saveSync(STORAGE_KEYS.STATS_V2, persisted(next));
    },

    setGoalMinutes(minutes) {
        const goalMinutes = clamp(Math.round(minutes), 0, 1440);
        set({ goalMinutes });
        saveSync(STORAGE_KEYS.STATS_V2, persisted(get()));
    },

    clearGoalHitPulse() {
        set({ goalHitPulse: null });
    },
}));

/**
 * The streak as it stands today (FR-STA-005): broken if the last goal hit was
 * 2+ days ago, even with no focus today. Recomputed only when the stored
 * streak changes.
 */
export function useStreak(): StreakState {
    const storedStreak = useStatsStore((s) => s.streak);
    return useMemo(() => normalizeStreakForToday(storedStreak, getTodayKey()), [storedStreak]);
}

/**
 * The derived stats views, recomputed only when `days` or `streak` change.
 * (A selector that built these objects would return a new value on every
 * call, which useSyncExternalStore treats as a change on every render.)
 */
export function useStatsViews() {
    const days = useStatsStore((s) => s.days);
    const streak = useStreak();

    const today: DayStats = useMemo(() => {
        const k = getTodayKey();
        return days[k] ?? { focusSessions: 0, focusMinutes: 0 };
    }, [days]);

    const totals: DayStats = useMemo(() => {
        return Object.values(days).reduce(
            (acc, day) => ({
                focusSessions: acc.focusSessions + day.focusSessions,
                focusMinutes: acc.focusMinutes + day.focusMinutes,
            }),
            { focusSessions: 0, focusMinutes: 0 }
        );
    }, [days]);

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
            result.push([dayKey, days[dayKey] ?? { focusSessions: 0, focusMinutes: 0 }]);
        }

        return result;
    }, [days]);

    return { today, totals, last7Days, streak };
}
