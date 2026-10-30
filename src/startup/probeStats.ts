/**
 * Summary statistics for the start-up probe (Phase 1 B7). Pure functions, no
 * React or storage: the hidden panel and the B7 record use the same numbers.
 * The formulas are written out in the B7 record §4.2 and §4.3.
 */

export type Summary = {
    n: number;
    median: number;
    q1: number;
    q3: number;
    min: number;
    max: number;
};

export type Shift = {
    /** Hodges–Lehmann estimate: the median of all pairwise differences y − x. */
    estimate: number;
    /** 95 % confidence interval; null when the samples are too small for one. */
    ci: [number, number] | null;
};

/**
 * Quantile p of a sorted sample, by linear interpolation between order
 * statistics (Hyndman and Fan's type 7, R's default):
 *   h = (n − 1)·p,  Q(p) = x[⌊h⌋] + (h − ⌊h⌋)·(x[⌊h⌋ + 1] − x[⌊h⌋])   (0-based)
 *
 * Precondition: `sorted` is ascending and non-empty; 0 ≤ p ≤ 1.
 */
export function quantile(sorted: readonly number[], p: number): number {
    const h = (sorted.length - 1) * p;
    const lo = Math.floor(h);
    const hi = Math.min(lo + 1, sorted.length - 1);
    return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

/** n, median, quartiles and range of a sample; null for an empty one. */
export function summarize(values: readonly number[]): Summary | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return {
        n: sorted.length,
        median: quantile(sorted, 0.5),
        q1: quantile(sorted, 0.25),
        q3: quantile(sorted, 0.75),
        min: sorted[0],
        max: sorted[sorted.length - 1],
    };
}

/**
 * How far `y` sits above `x`: the Hodges–Lehmann shift, the median of the
 * m·n differences y_i − x_j, with a 95 % interval from the K-th smallest to
 * the K-th largest difference, where
 *   K = ⌊mn/2 − 1.96·√(mn(m + n + 1)/12)⌋
 * (the normal approximation to the Mann–Whitney U distribution). When K < 1
 * the samples are too small for an interval and `ci` is null.
 *
 * Returns null when either sample is empty.
 */
export function hodgesLehmann(x: readonly number[], y: readonly number[]): Shift | null {
    const m = x.length;
    const n = y.length;
    if (m === 0 || n === 0) return null;

    const diffs: number[] = [];
    for (const yi of y) {
        for (const xj of x) diffs.push(yi - xj);
    }
    diffs.sort((a, b) => a - b);

    const mn = m * n;
    const k = Math.floor(mn / 2 - 1.96 * Math.sqrt((mn * (m + n + 1)) / 12));
    return {
        estimate: quantile(diffs, 0.5),
        ci: k >= 1 ? [diffs[k - 1], diffs[mn - k]] : null,
    };
}
