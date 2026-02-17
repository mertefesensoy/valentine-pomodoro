/**
 * Format milliseconds as MM:SS
 */
export function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Get today's date key in YYYY-MM-DD format
 */
export function getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Convert minutes to milliseconds
 */
export function minutesToMs(minutes: number): number {
    return minutes * 60 * 1000;
}

/**
 * Convert a local day key (YYYY-MM-DD) to UTC midnight timestamp
 * Used for DST-safe day difference calculations
 */
export function dayKeyToUtcMs(dayKey: string): number {
    const [y, m, d] = dayKey.split('-').map(Number);
    return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Calculate day difference between two day keys (a - b)
 * DST-safe: uses UTC midnight even though keys represent local dates
 */
export function diffDays(aKey: string, bKey: string): number {
    return Math.round((dayKeyToUtcMs(aKey) - dayKeyToUtcMs(bKey)) / 86400000);
}

/**
 * Convert epoch timestamp to day key (YYYY-MM-DD) in local timezone
 * Used for midnight attribution: credit focus session to the day it STARTED
 */
export function getDayKeyFromDate(timestamp: number): string {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
