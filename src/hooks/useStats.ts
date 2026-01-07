import { useCallback, useEffect, useState, useMemo } from 'react';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import type { StatsMap, DayStats } from '../types';
import { getTodayKey } from '../utils/time';

export function useStats() {
    const [stats, setStats] = useState<StatsMap>({});
    const [isReady, setIsReady] = useState(false);

    // Load persisted stats on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const loaded = await load<StatsMap>(STORAGE_KEYS.STATS, {});
                if (cancelled) return;
                setStats(loaded);
            } finally {
                if (!cancelled) setIsReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Increment focus session stats
    const incrementFocus = useCallback(
        async (minutes: number) => {
            try {
                const todayKey = getTodayKey();
                const todayStats = stats[todayKey] || { focusSessions: 0, focusMinutes: 0 };

                const updated = {
                    ...stats,
                    [todayKey]: {
                        focusSessions: todayStats.focusSessions + 1,
                        focusMinutes: todayStats.focusMinutes + minutes,
                    },
                };

                setStats(updated);
                await save(STORAGE_KEYS.STATS, updated);
            } catch (error) {
                console.error('[useStats] Failed to increment focus:', error);
            }
        },
        [stats]
    );

    // Get today's stats
    const getToday = useCallback((): DayStats => {
        const todayKey = getTodayKey();
        return stats[todayKey] || { focusSessions: 0, focusMinutes: 0 };
    }, [stats]);

    // Get all-time totals
    const getTotals = useCallback((): DayStats => {
        return Object.values(stats).reduce(
            (acc, day) => ({
                focusSessions: acc.focusSessions + day.focusSessions,
                focusMinutes: acc.focusMinutes + day.focusMinutes,
            }),
            { focusSessions: 0, focusMinutes: 0 }
        );
    }, [stats]);

    // Get last N days (including today), returns array of [dayKey, DayStats]
    const getLastNDays = useCallback(
        (n: number): Array<[string, DayStats]> => {
            const now = new Date();
            const result: Array<[string, DayStats]> = [];

            for (let i = n - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dayKey = `${yyyy}-${mm}-${dd}`;

                result.push([dayKey, stats[dayKey] || { focusSessions: 0, focusMinutes: 0 }]);
            }

            return result;
        },
        [stats]
    );

    // Computed values
    const today = useMemo(() => getToday(), [getToday]);
    const totals = useMemo(() => getTotals(), [getTotals]);
    const last7Days = useMemo(() => getLastNDays(7), [getLastNDays]);

    return {
        stats,
        isReady,
        incrementFocus,
        today,
        totals,
        last7Days,
    };
}
