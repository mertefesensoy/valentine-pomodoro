/**
 * CSS-style cubic-bezier easing, sampled in a worklet (Phase 1 D1, the welcome morph).
 *
 * Contract: `cubicBezier(x1, y1, x2, y2)` returns `ease(t)` for t in [0, 1]; ease(0) = 0, ease(1) = 1.
 * Pure; usable on the UI thread (both functions are worklets). Reanimated's `Easing.bezier` returns a
 * factory for `withTiming`, not a function to sample, so the morph's stages sample this one instead.
 *
 * Maths: the curve is B(s) = 3(1−s)²s·P1 + 3(1−s)s²·P2 + s³ (P0 = 0, P3 = 1), per axis. For a given
 * x = t, solve Bx(s) = t for s by Newton–Raphson (8 steps from s = t, falling back to bisection when
 * the slope is flat), then return By(s). The x control points lie in [0, 1], so Bx is monotonic and
 * the root is unique.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
    'worklet';
    const ax = 1 + 3 * x1 - 3 * x2;
    const bx = 3 * x2 - 6 * x1;
    const cx = 3 * x1;
    const ay = 1 + 3 * y1 - 3 * y2;
    const by = 3 * y2 - 6 * y1;
    const cy = 3 * y1;
    return (t: number) => {
        'worklet';
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        let s = t;
        for (let i = 0; i < 8; i++) {
            const x = ((ax * s + bx) * s + cx) * s - t;
            const dx = (3 * ax * s + 2 * bx) * s + cx;
            if (Math.abs(x) < 1e-6) break;
            if (Math.abs(dx) < 1e-6) {
                // Flat slope: bisect instead.
                let lo = 0;
                let hi = 1;
                s = t;
                for (let j = 0; j < 20; j++) {
                    const v = ((ax * s + bx) * s + cx) * s;
                    if (v < t) lo = s;
                    else hi = s;
                    s = (lo + hi) / 2;
                }
                break;
            }
            s -= x / dx;
        }
        return ((ay * s + by) * s + cy) * s;
    };
}
