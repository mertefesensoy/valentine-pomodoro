import type { SessionSlot } from '../../types';
import {
    EMISSION_EPSILON_MS as EPS,
    displayedSeconds,
    nextEmissionDelayMs,
    progressOf,
    remainingMsAt,
    ringDashOffset,
    slotRemainingMs,
} from '../clockMath';

// The session clock's arithmetic (Phase 1 B4; B4 record §4).

// covers: FR-TMR-006
describe('nextEmissionDelayMs, plan §4.2 as corrected in B4', () => {
    it('wakes ε after the boundary when the remainder is a whole number of seconds', () => {
        // A fresh 25:00 session: ⌊r/1000⌋ moves to 24:59 as soon as r < 1,500,000.
        expect(nextEmissionDelayMs(1_500_000)).toBe(EPS);
        expect(nextEmissionDelayMs(1_000)).toBe(EPS);
    });

    it('wakes ε after the next boundary otherwise', () => {
        expect(nextEmissionDelayMs(1_499_999)).toBe(999 + EPS);
        expect(nextEmissionDelayMs(999)).toBe(999 + EPS);
        expect(nextEmissionDelayMs(1)).toBe(1 + EPS);
    });

    it('settles to one wake every 1000 ms, each ε after a boundary', () => {
        for (let k = 1; k <= 30; k++) {
            expect(nextEmissionDelayMs(1000 * k - EPS)).toBe(1000);
        }
    });

    it('moves the display by exactly one second per wake, at most ε late, for every remainder', () => {
        for (let r = 1_000; r <= 6_000; r++) {
            const k = displayedSeconds(r);
            const d = nextEmissionDelayMs(r);
            // Still k at the boundary instant itself, one ms before the change.
            expect(displayedSeconds(r - (r % 1000))).toBe(k);
            // k − 1 one ms later, and still k − 1 at the wake: never a skipped second.
            expect(displayedSeconds(r - (r % 1000) - 1)).toBe(k - 1);
            expect(displayedSeconds(r - d)).toBe(k - 1);
            // The wake comes ε − 1 ms after the change.
            expect(d - ((r % 1000) + 1)).toBe(EPS - 1);
        }
    });

    it('wakes past the end in the last displayed second, where completion is due', () => {
        for (let r = 1; r < 1_000; r++) {
            expect(r - nextEmissionDelayMs(r)).toBe(-EPS);
        }
    });
});

// The rule each caller applied at render before B4, copied from useTimer
// (idle = the phase length), FlyModeScreen (idle = the flight or null) and
// useSessionClock (idle = 0). slotRemainingMs must agree with it everywhere.
function remainingBeforeB4(slot: SessionSlot | null, idleMs: number | null, now: number): number | null {
    if (!slot) return idleMs;
    if (slot.isRunning && slot.endAt) return Math.max(0, slot.endAt - now);
    return slot.pausedRemainingMs ?? idleMs;
}

function slot(fields: Partial<SessionSlot>): SessionSlot {
    return {
        isRunning: false,
        endAt: null,
        pausedRemainingMs: null,
        durationMs: 60_000,
        sessionStartedAt: 0,
        sessionId: 's',
        ...fields,
    };
}

// covers: FR-TMR-003, FR-TMR-004
describe('slotRemainingMs', () => {
    const now = 1_000_000;
    const slots: (SessionSlot | null)[] = [
        null,
        slot({ isRunning: true, endAt: now + 61_500 }),
        slot({ isRunning: true, endAt: now }),
        slot({ isRunning: true, endAt: now - 5_000 }),
        slot({ isRunning: true, endAt: null }),
        slot({ isRunning: false, pausedRemainingMs: 42_000 }),
        slot({ isRunning: false, pausedRemainingMs: 0 }),
        slot({ isRunning: false, pausedRemainingMs: null }),
    ];

    it('matches the pre-B4 render-time rule for every slot shape and idle value', () => {
        for (const s of slots) {
            for (const idle of [25 * 60_000, 0, null]) {
                expect(slotRemainingMs(s, idle, now)).toBe(remainingBeforeB4(s, idle, now));
            }
        }
    });

    it('is endAt − now while running, never negative (FR-TMR-003)', () => {
        expect(slotRemainingMs(slot({ isRunning: true, endAt: now + 1_234 }), 0, now)).toBe(1_234);
        expect(slotRemainingMs(slot({ isRunning: true, endAt: now - 1 }), 0, now)).toBe(0);
    });

    it('freezes at the paused remainder, whatever the time (FR-TMR-004)', () => {
        const paused = slot({ pausedRemainingMs: 50_000 });
        expect(slotRemainingMs(paused, 0, now)).toBe(50_000);
        expect(slotRemainingMs(paused, 0, now + 30_000)).toBe(50_000);
    });

    it('ignores endAt unless running', () => {
        expect(remainingMsAt(false, now + 9_000, 7_000, 0, now)).toBe(7_000);
        expect(remainingMsAt(false, now + 9_000, null, null, now)).toBeNull();
    });
});

describe('displayedSeconds', () => {
    it('floors, as formatTime does (plan §5: the ⌊r/1000⌋ convention)', () => {
        expect(displayedSeconds(1_500_000)).toBe(1_500);
        expect(displayedSeconds(1_499_999)).toBe(1_499);
        expect(displayedSeconds(999)).toBe(0);
        expect(displayedSeconds(0)).toBe(0);
    });
});

describe('progressOf and ringDashOffset', () => {
    it('is 0 with the whole session left and 1 at the end, clamped', () => {
        expect(progressOf(60_000, 60_000)).toBe(0);
        expect(progressOf(15_000, 60_000)).toBe(0.75);
        expect(progressOf(0, 60_000)).toBe(1);
        expect(progressOf(90_000, 60_000)).toBe(0);
        expect(progressOf(-1, 60_000)).toBe(1);
    });

    it('matches the formula TimerScreen rendered before B4', () => {
        const before = (remainingMs: number, totalMs: number) => Math.max(0, Math.min(1, 1 - remainingMs / totalMs));
        for (const total of [60_000, 5 * 60_000, 25 * 60_000]) {
            for (let r = -1_000; r <= total + 1_000; r += 997) {
                expect(progressOf(r, total)).toBe(before(r, total));
            }
        }
    });

    it('turns progress into a dash offset C · (1 − p), clamped', () => {
        expect(ringDashOffset(800, 0)).toBe(800);
        expect(ringDashOffset(800, 0.25)).toBe(600);
        expect(ringDashOffset(800, 1)).toBe(0);
        expect(ringDashOffset(800, 1.5)).toBe(0);
        expect(ringDashOffset(800, -0.5)).toBe(800);
    });
});
