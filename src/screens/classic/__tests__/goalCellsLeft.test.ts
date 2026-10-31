// covers: FR-STA-004
import { goalCellsLeft } from '../TodayStickers';

// Today's row draws a dashed cell for each focus session still needed for the daily goal
// (finish review fix 6). The rule and these examples are the D1 record's §4.3.
describe('goalCellsLeft', () => {
    it('counts the sessions left in the current focus length, rounded up', () => {
        expect(goalCellsLeft({ goalMinutes: 50, minutesToday: 0, focusMinutes: 25, goalHit: false })).toBe(2);
        expect(goalCellsLeft({ goalMinutes: 50, minutesToday: 25, focusMinutes: 25, goalHit: false })).toBe(1);
        expect(goalCellsLeft({ goalMinutes: 50, minutesToday: 1, focusMinutes: 1, goalHit: false })).toBe(49);
    });

    it("counts the goal's minutes left, so sessions of other lengths still count in full", () => {
        // One 50-minute session against a 50-minute goal leaves nothing, whatever the focus is now.
        expect(goalCellsLeft({ goalMinutes: 50, minutesToday: 50, focusMinutes: 25, goalHit: false })).toBe(0);
        expect(goalCellsLeft({ goalMinutes: 100, minutesToday: 90, focusMinutes: 25, goalHit: false })).toBe(1);
    });

    it('leaves none once the goal is reached, when the goal is off, or with no focus length', () => {
        expect(goalCellsLeft({ goalMinutes: 50, minutesToday: 10, focusMinutes: 25, goalHit: true })).toBe(0);
        expect(goalCellsLeft({ goalMinutes: 0, minutesToday: 0, focusMinutes: 25, goalHit: false })).toBe(0);
        expect(goalCellsLeft({ goalMinutes: 50, minutesToday: 0, focusMinutes: 0, goalHit: false })).toBe(0);
        expect(goalCellsLeft({ goalMinutes: Number.NaN, minutesToday: 0, focusMinutes: 25, goalHit: false })).toBe(0);
    });
});
