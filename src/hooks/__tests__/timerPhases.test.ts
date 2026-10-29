import { nextAfterComplete, nextAfterSkip } from '../useTimer';

// Pins the v1 Pomodoro cycle so the v2 session engine can be checked against it.
describe('nextAfterComplete', () => {
    it('moves focus to a short break and counts the focus session', () => {
        expect(nextAfterComplete('focus', 0, 4)).toEqual({ phase: 'shortBreak', focusCountInCycle: 1 });
        expect(nextAfterComplete('focus', 2, 4)).toEqual({ phase: 'shortBreak', focusCountInCycle: 3 });
    });

    it('moves the Nth focus session to a long break and resets the cycle', () => {
        expect(nextAfterComplete('focus', 3, 4)).toEqual({ phase: 'longBreak', focusCountInCycle: 0 });
        expect(nextAfterComplete('focus', 1, 2)).toEqual({ phase: 'longBreak', focusCountInCycle: 0 });
    });

    it('returns from either break to focus without touching the count', () => {
        expect(nextAfterComplete('shortBreak', 2, 4)).toEqual({ phase: 'focus', focusCountInCycle: 2 });
        expect(nextAfterComplete('longBreak', 0, 4)).toEqual({ phase: 'focus', focusCountInCycle: 0 });
    });

    it('treats longBreakEvery = 1 as a long break after every focus', () => {
        expect(nextAfterComplete('focus', 0, 1)).toEqual({ phase: 'longBreak', focusCountInCycle: 0 });
    });
});

describe('nextAfterSkip', () => {
    // Current behaviour: a skipped focus never counts toward the long break.
    it('skips focus to a short break without counting it', () => {
        expect(nextAfterSkip('focus', 3)).toEqual({ phase: 'shortBreak', focusCountInCycle: 3 });
    });

    it('skips either break back to focus', () => {
        expect(nextAfterSkip('shortBreak', 1)).toEqual({ phase: 'focus', focusCountInCycle: 1 });
        expect(nextAfterSkip('longBreak', 0)).toEqual({ phase: 'focus', focusCountInCycle: 0 });
    });
});
