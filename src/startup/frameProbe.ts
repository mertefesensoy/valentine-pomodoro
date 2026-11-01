/**
 * The completion moment's frame times (Phase 1 D1; NFR-PERF-004), for B7's hidden panel
 * (Settings → About), like `bannerStatus`: in memory only, nothing stored or sent.
 *
 * The sticker placement arms a frame callback on the UI thread for one second
 * (`TodayStickers`), which hands its frame-to-frame deltas here once, at the end.
 *
 * Maths: with deltas Δ₁…Δₙ in ms, the median frame rate is 1000 / median(Δ) fps and the
 * worst frame is max(Δ). NFR-PERF-004 asks for a median of at least 58 fps (median Δ ≤ 17.24 ms)
 * and no frame over 32 ms (two 60 Hz vsyncs) during the completion moment.
 */
export type FrameStats = {
    frames: number;
    medianFps: number;
    worstMs: number;
    over32: number;
    passes: boolean;
};

export function frameStats(deltas: readonly number[]): FrameStats | null {
    const d = deltas.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
    if (!d.length) return null;
    const mid = d.length / 2;
    const median = d.length % 2 ? d[Math.floor(mid)] : (d[mid - 1] + d[mid]) / 2;
    const medianFps = 1000 / median;
    const worstMs = d[d.length - 1];
    const over32 = d.filter((x) => x > 32).length;
    return { frames: d.length, medianFps, worstMs, over32, passes: medianFps >= 58 && over32 === 0 };
}

let last: FrameStats | null = null;

export function noteCompletionFrames(deltas: number[]): void {
    last = frameStats(deltas);
}

export function lastCompletionFrames(): FrameStats | null {
    return last;
}

export function completionFramesLine(): string {
    if (!last) return 'Sticker placement frames (NFR-PERF-004): none yet this launch';
    return (
        `Sticker placement frames (NFR-PERF-004): ${last.frames} frames · median ${Math.round(last.medianFps)} fps` +
        ` · worst ${Math.round(last.worstMs)} ms · ${last.over32} over 32 ms · ${last.passes ? 'pass' : 'FAIL'}`
    );
}
