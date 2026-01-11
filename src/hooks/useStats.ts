import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import type { StatsMap, DayStats } from '../types';
import { getTodayKey } from '../utils/time';

function addDay(a?: DayStats, b?: DayStats): DayStats {
    return {
        focusSessions: (a?.focusSessions ?? 0) + (b?.focusSessions ?? 0),
        focusMinutes: (a?.focusMinutes ?? 0) + (b?.focusMinutes ?? 0),
    };
}

function mergeStats(loaded: StatsMap, current: StatsMap): StatsMap {
    // union of keys, add values if overlapping
    const keys = new Set([...Object.keys(loaded), ...Object.keys(current)]);
    const next: StatsMap = {};
    keys.forEach((k) => {
        next[k] = addDay(loaded[k], current[k]);
    });
    return next;
}

export function useStats() {
    const [stats, setStats] = useState<StatsMap>({});
    const [isReady, setIsReady] = useState(false);

    // Serialize writes to avoid out-of-order AsyncStorage persistence
    const saveChainRef = useRef(Promise.resolve());
    const enqueueSave = useCallback((data: StatsMap) => {
        saveChainRef.current = saveChainRef.current
            .then(() => save(STORAGE_KEYS.STATS, data))
            .catch((e) => {
                console.error('[useStats] Failed to save stats:', e);
            });
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const loaded = await load<StatsMap>(STORAGE_KEYS.STATS, {});
                if (cancelled) return;

                setStats((prev) => {
                    const merged = mergeStats(loaded, prev);
                    // Optional: persist merged so disk matches memory
                    enqueueSave(merged);
                    return merged;
                });
            } finally {
                if (!cancelled) setIsReady(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [enqueueSave]);

    const incrementFocus = useCallback(
        (minutes: number) => {
            const todayKey = getTodayKey();

            setStats((prev) => {
                const today = prev[todayKey] ?? { focusSessions: 0, focusMinutes: 0 };

                const next: StatsMap = {
                    ...prev,
                    [todayKey]: {
                        focusSessions: today.focusSessions + 1,
                        focusMinutes: today.focusMinutes + minutes,
                    },
                };

                if (__DEV__) {
                    console.log('[useStats] incrementFocus', { minutes, todayKey, next: next[todayKey] });
                }

                enqueueSave(next);
                return next;
            });
        },
        [enqueueSave]
    );

    const today: DayStats = useMemo(() => {
        const k = getTodayKey();
        return stats[k] ?? { focusSessions: 0, focusMinutes: 0 };
    }, [stats]);

    const totals: DayStats = useMemo(() => {
        return Object.values(stats).reduce(
            (acc, day) => ({
                focusSessions: acc.focusSessions + day.focusSessions,
                focusMinutes: acc.focusMinutes + day.focusMinutes,
            }),
            { focusSessions: 0, focusMinutes: 0 }
        );
    }, [stats]);

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
            result.push([dayKey, stats[dayKey] ?? { focusSessions: 0, focusMinutes: 0 }]);
        }

        return result;
    }, [stats]);

    return { stats, isReady, incrementFocus, today, totals, last7Days };
}
