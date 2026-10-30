import { hodgesLehmann, quantile, summarize } from '../probeStats';

// Phase 1 B7: the numbers the hidden panel and the B7 record (§4.2, §4.3)
// report for a TTI measurement. Expected values are worked by hand, and the
// quantiles match R's quantile(x, type = 7).

// covers: NFR-PERF-001
describe('probe statistics', () => {
    it('interpolates quantiles between order statistics (type 7)', () => {
        const oneToTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        // R: quantile(1:10, c(.25, .5, .75)) → 3.25 5.50 7.75
        expect(quantile(oneToTen, 0.25)).toBeCloseTo(3.25);
        expect(quantile(oneToTen, 0.5)).toBeCloseTo(5.5);
        expect(quantile(oneToTen, 0.75)).toBeCloseTo(7.75);
        expect(quantile(oneToTen, 0)).toBe(1);
        expect(quantile(oneToTen, 1)).toBe(10);
        expect(quantile([42], 0.75)).toBe(42);
    });

    it('summarises an unsorted sample without changing it', () => {
        const sample = [900, 700, 820, 760, 1400];
        expect(summarize(sample)).toEqual({ n: 5, median: 820, q1: 760, q3: 900, min: 700, max: 1400 });
        expect(sample).toEqual([900, 700, 820, 760, 1400]);
        expect(summarize([])).toBeNull();
    });

    it('the median and quartiles are not moved by one slow launch', () => {
        const calm = [800, 810, 820, 830, 840, 850, 860];
        const withOutlier = [800, 810, 820, 830, 840, 850, 5000];
        expect(summarize(withOutlier)?.median).toBe(summarize(calm)?.median);
        expect(summarize(withOutlier)?.q1).toBe(summarize(calm)?.q1);
    });

    it('estimates a shift as the median pairwise difference, with the K-th order statistics as its 95 % interval', () => {
        // x = 0..11, y = x + 100: the 144 differences are 100 + (i − j), with
        // 12 − |k| pairs at i − j = k. K = ⌊72 − 1.96·√300⌋ = 38; the 38th
        // smallest difference is at k = −3 (36 pairs have k ≤ −4), so 97, and
        // by symmetry the 38th largest is 103.
        const x = Array.from({ length: 12 }, (_, i) => i);
        const y = x.map((v) => v + 100);
        expect(hodgesLehmann(x, y)).toEqual({ estimate: 100, ci: [97, 103] });
    });

    it('a negative shift means y is faster', () => {
        expect(hodgesLehmann([10, 11, 12], [5, 6, 7])?.estimate).toBe(-5);
    });

    it('gives no interval when the samples are too small, and nothing for an empty one', () => {
        // m = n = 3: K = ⌊4.5 − 1.96·√5.25⌋ = ⌊0.009⌋ = 0.
        expect(hodgesLehmann([1, 2, 3], [4, 5, 6])).toEqual({ estimate: 3, ci: null });
        expect(hodgesLehmann([], [1])).toBeNull();
        expect(hodgesLehmann([1], [])).toBeNull();
    });
});
