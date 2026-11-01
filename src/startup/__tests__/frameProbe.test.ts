// covers: NFR-PERF-004
import { completionFramesLine, frameStats, lastCompletionFrames, noteCompletionFrames } from '../frameProbe';

describe('frameStats', () => {
    it('reads a steady 60 Hz second as a pass', () => {
        const s = frameStats(Array.from({ length: 60 }, () => 16.67))!;
        expect(s.frames).toBe(60);
        expect(s.medianFps).toBeCloseTo(60, 0);
        expect(s.over32).toBe(0);
        expect(s.passes).toBe(true);
    });

    it('fails on a single frame over 32 ms, however good the median', () => {
        const s = frameStats([...Array.from({ length: 59 }, () => 8.33), 40])!;
        expect(s.medianFps).toBeCloseTo(120, 0);
        expect(s.worstMs).toBe(40);
        expect(s.over32).toBe(1);
        expect(s.passes).toBe(false);
    });

    it('fails a median under 58 fps (median frame over 17.24 ms)', () => {
        const s = frameStats(Array.from({ length: 50 }, () => 18))!;
        expect(s.medianFps).toBeLessThan(58);
        expect(s.passes).toBe(false);
    });

    it('takes the median of an even count, and drops non-frames', () => {
        expect(frameStats([10, 20, NaN, 0, -3])!.medianFps).toBeCloseTo(1000 / 15, 5);
        expect(frameStats([])).toBeNull();
    });
});

describe('the panel line', () => {
    it('reports nothing until a placement, then the last one', () => {
        expect(completionFramesLine()).toMatch(/none yet/);
        noteCompletionFrames(Array.from({ length: 60 }, () => 16.67));
        expect(lastCompletionFrames()?.passes).toBe(true);
        expect(completionFramesLine()).toMatch(/60 frames · median 60 fps · worst 17 ms · 0 over 32 ms · pass/);
    });
});
