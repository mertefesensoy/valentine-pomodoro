// covers: NFR-A11Y-004
import { cubicBezier } from '../easing';

// The welcome morph's sampled easing (Phase 1 D1).
describe('cubicBezier', () => {
    it('runs from 0 to 1 and clamps outside', () => {
        const ease = cubicBezier(0.23, 1, 0.32, 1);
        expect(ease(0)).toBe(0);
        expect(ease(1)).toBe(1);
        expect(ease(-0.5)).toBe(0);
        expect(ease(2)).toBe(1);
    });

    it('is the identity for the linear curve', () => {
        const linear = cubicBezier(0.25, 0.25, 0.75, 0.75);
        for (const t of [0.1, 0.33, 0.5, 0.9]) expect(linear(t)).toBeCloseTo(t, 5);
    });

    it('matches CSS ease-out shape: fast start, never past 1', () => {
        const ease = cubicBezier(0.23, 1, 0.32, 1);
        expect(ease(0.25)).toBeGreaterThan(0.6);
        let prev = 0;
        for (let i = 1; i <= 100; i++) {
            const v = ease(i / 100);
            expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
            expect(v).toBeLessThanOrEqual(1 + 1e-9);
            prev = v;
        }
    });

    it('is point-symmetric for a symmetric curve (CSS ease-in-out, 0.42 0 0.58 1)', () => {
        const io = cubicBezier(0.42, 0, 0.58, 1);
        expect(io(0.5)).toBeCloseTo(0.5, 5);
        for (const t of [0.1, 0.2, 0.35]) expect(io(t) + io(1 - t)).toBeCloseTo(1, 5);
    });

    it("gives the morph's ease-in-out its known midpoint (0.77 0 0.175 1 is not symmetric)", () => {
        expect(cubicBezier(0.77, 0, 0.175, 1)(0.5)).toBeCloseTo(0.596, 3);
    });
});
