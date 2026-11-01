/**
 * The pair's motion in the tour (Phase 1 D5): the numbers of the approved pose sheet
 * (`art/src/tour/expressions.json` `motion`, assets record §3.3 and §4.4), as pure functions of
 * time. Each is a worklet: the characters call them on the UI thread every frame from shared
 * values (milliseconds since a change, a gesture or a breath began), with no React render. The
 * tests check every constant here against the JSON, so the app and the pose sheet can't drift.
 *
 * Units: times in ms, angles in degrees, lengths in the 512 artboard's units.
 */

/** The change of expression: 280 ms of squash and stretch about the feet. */
export const CHANGE_MS = 280;
/** The height's keys (time, scale): squash at 70 ms, stretch at 168 ms, home at 280 ms. */
export const SQUASH_KEYS: readonly (readonly [number, number])[] = [
    [0, 1],
    [70, 0.92],
    [168, 1.04],
    [280, 1],
];
/** The old face fades out over 0–98 ms and the new one in over 56–154 ms: they cross at 77 ms. */
export const FACE_OUT: readonly [number, number] = [0, 98];
export const FACE_IN: readonly [number, number] = [56, 154];
/** A held tilt or stretch eases in over 220 ms. */
export const HOLD_MS = 220;

export const BLINK = { closedMs: 110, intervalMs: [2800, 5200] as const, doubleChance: 0.2, doubleGapMs: 140 } as const;
export const BREATH = { amplitude: 0.012, periodMs: { pomo: 3400, doro: 4100 }, talkingFactor: 0.5 } as const;
export const WAVE = { periodMs: 420, cycles: 2.5, homeMs: 160 } as const;
export const POINT = { nudgeUnits: 10, nudgeMs: 320 } as const;

/** The feet, the transform origin: the bottom of each die-cut edge, in artboard units. */
export const FEET = { pomo: [256, 478], doro: [256, 476] } as const;

/** u²(3 − 2u) on [0, 1], clamped. */
export function smoothstep(u: number): number {
    'worklet';
    const x = u < 0 ? 0 : u > 1 ? 1 : u;
    return x * x * (3 - 2 * x);
}

/** The height scale t ms into a change; the width is its reciprocal, so the area holds. */
export function squashAt(t: number): number {
    'worklet';
    if (t <= 0 || t >= CHANGE_MS) return 1;
    for (let i = 1; i < SQUASH_KEYS.length; i++) {
        const [t1, v1] = SQUASH_KEYS[i];
        if (t <= t1) {
            const [t0, v0] = SQUASH_KEYS[i - 1];
            return v0 + (v1 - v0) * smoothstep((t - t0) / (t1 - t0));
        }
    }
    return 1;
}

/** The old face's opacity t ms into a change. */
export function faceOutAt(t: number): number {
    'worklet';
    return 1 - smoothstep((t - FACE_OUT[0]) / (FACE_OUT[1] - FACE_OUT[0]));
}

/** The new face's opacity t ms into a change. */
export function faceInAt(t: number): number {
    'worklet';
    return smoothstep((t - FACE_IN[0]) / (FACE_IN[1] - FACE_IN[0]));
}

/** How far a held tilt or stretch has eased in, t ms into a change. */
export function holdAt(t: number): number {
    'worklet';
    return smoothstep(t / HOLD_MS);
}

/** The breath's height scale: 1 + a·f·sin(2πt/P), f halved while talking. */
export function breathAt(t: number, periodMs: number, factor: number): number {
    'worklet';
    return 1 + BREATH.amplitude * factor * Math.sin((2 * Math.PI * t) / periodMs);
}

/**
 * The wave's angle, t ms after it starts: −2° − 14°·sin(2πt/420) for 2.5 swings (−16° to +12°),
 * then home from −2° to 0 over 160 ms. For the right hand; the left mirrors it.
 */
export function waveAt(t: number): number {
    'worklet';
    const swing = WAVE.periodMs * WAVE.cycles;
    if (t <= 0) return 0;
    if (t <= swing) return -2 - 14 * Math.sin((2 * Math.PI * t) / WAVE.periodMs);
    const end = -2 - 14 * Math.sin((2 * Math.PI * swing) / WAVE.periodMs);
    return end * (1 - smoothstep((t - swing) / WAVE.homeMs));
}

/** The point's nudge along the nub's own axis, t ms after it starts: 10·sin(πt/320) units. */
export function pointAt(t: number): number {
    'worklet';
    if (t <= 0 || t >= POINT.nudgeMs) return 0;
    return POINT.nudgeUnits * Math.sin((Math.PI * t) / POINT.nudgeMs);
}

/** The next blink's wait and whether it's a double, from two uniform draws in [0, 1). */
export function nextBlink(r1: number, r2: number): { waitMs: number; double: boolean } {
    const [lo, hi] = BLINK.intervalMs;
    return { waitMs: lo + r1 * (hi - lo), double: r2 < BLINK.doubleChance };
}
