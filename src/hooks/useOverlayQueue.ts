/**
 * useOverlayQueue — serialized overlay state machine.
 *
 * Replaces ad-hoc queuedLoveNote state in TimerScreen.
 * Only one overlay is visible at a time.
 *
 * Priority order: GOAL_CELEBRATION → LOVE_NOTE → INTERSTITIAL_AD
 *
 * Usage:
 *   const { current, enqueue, dismiss } = useOverlayQueue();
 *   enqueue({ type: 'GOAL_CELEBRATION', dayKey, newStreak });
 *   enqueue({ type: 'LOVE_NOTE', note });
 *   enqueue({ type: 'INTERSTITIAL_AD' });
 *   // current is the highest-priority pending event
 *   // dismiss() pops it and shows the next
 */

import { useCallback, useState } from 'react';
// Love notes are plain strings in this codebase

export type OverlayEvent =
    | { type: 'GOAL_CELEBRATION'; dayKey: string; newStreak: number }
    | { type: 'LOVE_NOTE'; note: string }
    | { type: 'INTERSTITIAL_AD' };

// Lower number = higher priority (shown first)
const PRIORITY: Record<OverlayEvent['type'], number> = {
    GOAL_CELEBRATION: 0,
    LOVE_NOTE: 1,
    INTERSTITIAL_AD: 2,
};

function insertByPriority(queue: OverlayEvent[], event: OverlayEvent): OverlayEvent[] {
    // Deduplicate: don't add same type twice (except LOVE_NOTE which can queue once)
    if (event.type === 'GOAL_CELEBRATION') {
        const exists = queue.some(
            (e) => e.type === 'GOAL_CELEBRATION' && e.dayKey === event.dayKey
        );
        if (exists) return queue;
    } else if (event.type === 'INTERSTITIAL_AD') {
        if (queue.some((e) => e.type === 'INTERSTITIAL_AD')) return queue;
    }

    const next = [...queue, event];
    next.sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type]);
    return next;
}

export function useOverlayQueue() {
    const [queue, setQueue] = useState<OverlayEvent[]>([]);

    const enqueue = useCallback((event: OverlayEvent) => {
        setQueue((prev) => insertByPriority(prev, event));
    }, []);

    const dismiss = useCallback(() => {
        setQueue((prev) => prev.slice(1));
    }, []);

    const current = queue[0] ?? null;

    return { current, enqueue, dismiss };
}
