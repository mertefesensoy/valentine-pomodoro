// covers: FR-FLY-001
// Build 52 device check (D2 record §3.17): peeked, the Fly sheet showed 85 pt on an 852 pt iPhone,
// so the camera-mode line under the timer went past the screen's edge, where the tab bar's glass
// showed it blurred. The peek strip holds the handle, the timer and that line.
import { PEEK_VISIBLE, portraitSnaps } from '../FlySheet';

describe("the Fly sheet's peek strip", () => {
    it('keeps the handle, the timer and the camera-mode line in view on a phone', () => {
        const { fullH, peek } = portraitSnaps(852);
        expect(fullH - peek).toBe(PEEK_VISIBLE);
        expect(PEEK_VISIBLE).toBeGreaterThanOrEqual(18 + 78 + 23);
    });

    it('stays a tenth of a tall window', () => {
        const { fullH, peek } = portraitSnaps(1366);
        expect(fullH - peek).toBeCloseTo(136.6);
    });
});
