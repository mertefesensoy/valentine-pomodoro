import { previousDayKey, useStatsStore } from '../stores/statsStore';
import type { DayStats } from '../types';
import { appStorage } from '../utils/appStorage';
import { getTodayKey } from '../utils/time';
import { rpc } from './client';
import { HOME_KEY, homeClient } from './home';
import type { HomeSnapshot } from './types';

/**
 * A paired person's day reaches the server (Phase 2 C3, FR-PAR-003). It listens to the stats store and
 * never reaches into it. The queue is a map from a day to its latest totals, in MMKV, so it survives the
 * app being killed and stays small. report_day keeps the largest values it has seen (plan §4), so
 * sending a day twice, or out of order, changes nothing.
 */
export const PENDING_KEY = 'day_reports_pending_v1';

const MS_PER_MINUTE = 60_000;

type DayReport = { p_day: string; p_focus_ms: number; p_sessions: number; p_goal_hit: boolean; p_goal_minutes: number | null };

function readQueue(): Record<string, DayReport> {
    try {
        const raw = appStorage.getString(PENDING_KEY);
        return raw ? (JSON.parse(raw) as Record<string, DayReport>) : {};
    } catch {
        return {};
    }
}

function writeQueue(queue: Record<string, DayReport>): void {
    if (Object.keys(queue).length === 0) appStorage.remove(PENDING_KEY);
    else appStorage.set(PENDING_KEY, JSON.stringify(queue));
}

const isPaired = () => Boolean(homeClient.getQueryData<HomeSnapshot>(HOME_KEY)?.couple);

/** Only today and yesterday: a session that crosses midnight is credited to the day it started. History waits for 1.6.0 (FR-MIG-003). */
function isRecent(dayKey: string): boolean {
    const today = getTodayKey();
    return dayKey === today || dayKey === previousDayKey(today);
}

function queueDay(dayKey: string, day: DayStats): void {
    if (!isRecent(dayKey)) return;
    const queue = readQueue();
    queue[dayKey] = {
        p_day: dayKey,
        p_focus_ms: day.focusMinutes * MS_PER_MINUTE,
        p_sessions: day.focusSessions,
        p_goal_hit: Boolean(day.goalHit),
        p_goal_minutes: day.goalMinutes ?? null,
    };
    writeQueue(queue);
}

let flushing: Promise<void> | null = null;

async function runFlush(): Promise<void> {
    if (!isPaired()) return;
    const days = Object.keys(readQueue()).sort();
    for (const day of days) {
        const report = readQueue()[day];
        if (!report) continue;
        let status: string | undefined;
        try {
            status = (await rpc<{ status: string }>('report_day', report)).status;
        } catch {
            // Offline, the server's away, or the session ended: it stays queued for the next chance.
            return;
        }
        if (status === 'not_paired') {
            writeQueue({});
            return;
        }
        const queue = readQueue();
        // A newer total may have replaced this while it was being sent: keep that one for next time.
        if (JSON.stringify(queue[day]) === JSON.stringify(report)) delete queue[day];
        writeQueue(queue);
    }
}

/** Sends what's queued, oldest day first. Only one flush runs at a time. Never throws. */
export function flushDayReports(): Promise<void> {
    if (!flushing) {
        flushing = runFlush().finally(() => {
            flushing = null;
        });
    }
    return flushing;
}

/** Queues today's totals and sends, so a person's day shows as soon as they pair, not only after a focus. */
export function reportToday(): Promise<void> {
    if (!isPaired()) return Promise.resolve();
    const today = getTodayKey();
    const day = useStatsStore.getState().days[today];
    if (day) queueDay(today, day);
    return flushDayReports();
}

/** Watches the stats store for credited focuses. Returns the unsubscribe function. */
export function startDayReports(): () => void {
    return useStatsStore.subscribe((state, previous) => {
        if (state.days === previous.days || !isPaired()) return;
        let changed = false;
        for (const [dayKey, day] of Object.entries(state.days)) {
            if (day !== previous.days[dayKey] && isRecent(dayKey)) {
                queueDay(dayKey, day);
                changed = true;
            }
        }
        if (changed) void flushDayReports();
    });
}
