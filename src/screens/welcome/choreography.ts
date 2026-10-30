/**
 * The welcome morph's choreography (Phase 1 D1; rebuilt after the build 48 device check, F5).
 *
 * The owner asked for a longer, livelier opening: squash and stretch, anticipation, staging, slow in
 * and slow out, secondary action and exaggeration. This module is the whole timeline as data and
 * pure functions of time, so the screen only maps numbers to transforms and the tests can audit
 * every beat. Every function is a worklet: the screen calls them on the UI thread each frame from
 * one shared value (milliseconds since the morph began), with no React render.
 *
 * Units. Positions are shares of the art box (x of its width, y of its height); the box is the
 * mark's own 784 × 576 artboard. Angles are degrees. Times are milliseconds.
 *
 * The beats (the record, §3.16 and §4):
 *    0– 600  Staging: the closed diary is held, centred; Pomo & Doro breathe on its top edge.
 *  600–1010  Anticipation: both crouch, the diary squashes under them, the cover leans back 8°.
 * 1010–1680  The leap: they stretch off the cover and fly parabolic arcs (constant gravity, so slow
 *            at the apex, fast at both ends) while the cover swings open through 180° on its spine
 *            and the left page, its other side, overshoots flat and settles back.
 * 1650–2040  The landing: an exaggerated squash, the pages giving under it and springing back, a
 *            damped rebound, and their joyful pose.
 * 2160–2700  Secondary action: a small hop, leaning towards each other.
 * 2700–3160  Becoming the faces: a stretch, then a dive into the page faces as they fade.
 * 3080–3650  Follow-through: the spread bumps and sparkles burst from the two faces.
 * 3500–4100  The line lands.
 * Doro is the heavier of the two: a later, lower leap and a deeper squash (overlapping action).
 */

export const DURATION = 4200;

/** Pomo's feet reach the page: the one haptic, on the frame of contact. */
export const LAND_MS = 1650;

/**
 * A character's square, as a share of the box's width; its feet sit at 93 % of its height. At 0.26
 * a body (77 % of the square) is wider than its page face's eyes, so landing on a face hides it.
 */
export const CHARACTER_SIZE = 0.26;
export const FEET = 0.93;

/** The box's height over its width (576 / 784). */
export const ASPECT = 576 / 784;

/** The closed diary's cover, hinged at the spine (x 0.5): its top and bottom edges, and its centre's offset right of the spine. */
const COVER_TOP = 34 / 576;
const COVER_BOTTOM = 500 / 576;
export const CLOSED_SHIFT = 0.21;

/** The pivots, as CSS transform-origin strings: the closed cover's foot, and the spine's foot. */
export const DIARY_ORIGIN = `${(50 + CLOSED_SHIFT * 100).toFixed(1)}% ${(COVER_BOTTOM * 100).toFixed(1)}%`;
export const SPREAD_ORIGIN = '50% 90%';
export const CHARACTER_ORIGIN = `50% ${(FEET * 100).toFixed(0)}%`;

/** The faces' centroids on the mark (each face group rotated ±5° about the spine foot). */
export const FACE = { pomo: { x: 0.373, y: 0.49 }, doro: { x: 0.627, y: 0.49 } } as const;

/** Where the feet stand on a page, so the body covers its face, eyes to smile (y 0.40–0.62). */
const LAND_Y = 0.64;

// ── Easing ────────────────────────────────────────────────────────────────────────────────────
// Closed forms, so a worklet needs no captured functions:
//   lin    constant speed
//   sine   (1 − cos πu) / 2: the gentle slow in and slow out of breathing and settling
//   inOut  cubic in-out: a deliberate move that gathers speed and lands softly
//   out    1 − (1 − u)⁴: an explosive start that brakes, for launches and impacts
//   in     u²: accelerating, like a body falling or diving
export type Ease = 'lin' | 'sine' | 'inOut' | 'out' | 'in';

export function ease(kind: Ease, u: number): number {
    'worklet';
    switch (kind) {
        case 'lin':
            return u;
        case 'sine':
            return (1 - Math.cos(Math.PI * u)) / 2;
        case 'inOut':
            return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        case 'out':
            return 1 - Math.pow(1 - u, 4);
        case 'in':
            return u * u;
    }
}

/** A keyframe: at `ms` the value is `value`, reached from the previous key along `ease` (default sine). */
export type Key = readonly [ms: number, value: number, ease?: Ease];

/** The value of a track at time `t`: held before the first key and after the last. */
export function track(t: number, keys: readonly Key[]): number {
    'worklet';
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
        const k = keys[i];
        if (t <= k[0]) {
            const prev = keys[i - 1];
            const span = k[0] - prev[0];
            const u = span > 0 ? (t - prev[0]) / span : 1;
            return prev[1] + (k[1] - prev[1]) * ease(k[2] ?? 'sine', u);
        }
    }
    return keys[keys.length - 1][1];
}

function clamp01(v: number): number {
    'worklet';
    return Math.min(Math.max(v, 0), 1);
}

// ── The diary ────────────────────────────────────────────────────────────────────────────────

const DIARY_SY: readonly Key[] = [[0, 1], [640, 1], [1000, 0.955, 'inOut'], [1120, 1.035, 'out'], [1300, 1]];
const DIARY_SX: readonly Key[] = [[0, 1], [640, 1], [1000, 1.025, 'inOut'], [1120, 0.985, 'out'], [1300, 1]];
/** The whole diary slides from cover-centred to spread-centred as it opens. */
const DIARY_SHIFT: readonly Key[] = [[0, -CLOSED_SHIFT], [1080, -CLOSED_SHIFT], [1620, 0, 'inOut']];
/**
 * The cover's angle about the spine. It leans back first (anticipation), then swings towards the
 * viewer and over (negative is towards the viewer for the right-hand cover). Past −90° the visible
 * face is the left page, its other side, which overshoots flat by 12° and settles (follow-through).
 */
const COVER_ANGLE: readonly Key[] = [[0, 0], [640, 0], [1000, 8, 'inOut'], [1460, -192, 'inOut'], [1700, -177], [1880, -180]];
/** The spread's bump as Pomo & Doro become its faces. */
const SPREAD_BUMP: readonly Key[] = [[0, 1], [3100, 1], [3200, 1.04, 'out'], [3330, 0.985], [3440, 1]];
/** The pages give under the landing and spring back past rest (box heights, down positive). */
const SPREAD_DIP: readonly Key[] = [[0, 0], [1650, 0], [1700, 0.014, 'out'], [1820, -0.004], [1920, 0]];

export type DiaryPose = {
    shiftX: number;
    sx: number;
    sy: number;
    coverAngle: number;
    coverOpacity: number;
    leftAngle: number;
    leftOpacity: number;
    rightOpacity: number;
    bump: number;
    dip: number;
};

export function diaryPose(t: number): DiaryPose {
    'worklet';
    const coverAngle = track(t, COVER_ANGLE);
    return {
        shiftX: track(t, DIARY_SHIFT),
        sx: track(t, DIARY_SX),
        sy: track(t, DIARY_SY),
        coverAngle,
        // One face shows at a time: the cover until it is edge-on, then the left page (both also
        // hide their backs natively; the switch keeps it exact).
        coverOpacity: coverAngle > -90 ? 1 : 0,
        leftAngle: coverAngle + 180,
        leftOpacity: coverAngle <= -90 ? 1 : 0,
        // The right page lies under the cover; it shows once the cover lifts, so no edge peeks out.
        rightOpacity: clamp01(-coverAngle / 20),
        bump: track(t, SPREAD_BUMP),
        dip: track(t, SPREAD_DIP),
    };
}

/** The closed cover's top edge, which moves down as the diary squashes about its foot. */
function coverTop(t: number): number {
    'worklet';
    return COVER_BOTTOM - (COVER_BOTTOM - COVER_TOP) * track(t, DIARY_SY);
}

// ── Pomo & Doro ──────────────────────────────────────────────────────────────────────────────

type Character = {
    seatX: number;
    /** Take-off and air time of the leap; `lift` is the arc's height term (H, below). */
    launch: number;
    air: number;
    lift: number;
    hop: number;
    /** +1 leans right (towards Doro), −1 leans left (towards Pomo). */
    lean: 1 | -1;
    sy: readonly Key[];
    sx: readonly Key[];
    rot: readonly Key[];
    opacity: readonly Key[];
    celebrate: readonly Key[];
    hopX: readonly Key[];
    diveY: readonly Key[];
};

/** The joy hop, the same for both: take-off and landing. */
const HOP = { launch: 2220, land: 2420 };

const POMO: Character = {
    seatX: 0.405,
    launch: 1010,
    air: 640,
    lift: 0.36,
    hop: 0.05,
    lean: 1,
    // Breathe, crouch and hold, stretch off, round at the apex, stretch falling, squash on impact,
    // rebound, settle; the hop; then stretch and dive.
    sy: [[0, 1], [300, 1.04], [600, 1], [960, 0.78, 'inOut'], [1010, 0.78], [1090, 1.2, 'out'], [1206, 1], [1610, 1.12, 'in'],
        [1650, 1.12], [1700, 0.66, 'out'], [1730, 0.66], [1840, 1.1, 'out'], [1940, 0.96], [2040, 1],
        [2160, 0.88], [2220, 1.08, 'out'], [2320, 1], [2400, 1.04], [2420, 1.04], [2460, 0.9, 'out'], [2560, 1],
        [2700, 1], [2860, 1.12], [3160, 0.42, 'in']],
    sx: [[0, 1], [300, 0.975], [600, 1], [960, 1.16, 'inOut'], [1010, 1.16], [1090, 0.85, 'out'], [1206, 1], [1610, 0.9, 'in'],
        [1650, 0.9], [1700, 1.32, 'out'], [1730, 1.32], [1840, 0.92, 'out'], [1940, 1.03], [2040, 1],
        [2160, 1.1], [2220, 0.94, 'out'], [2320, 1], [2400, 0.97], [2420, 0.97], [2460, 1.1, 'out'], [2560, 1],
        [2700, 1], [2860, 0.92], [3160, 0.62, 'in']],
    rot: [[0, 0], [1010, 0], [1100, -7, 'out'], [1610, 2], [1700, 0, 'out'], [2160, 0], [2420, 8], [2700, 0]],
    opacity: [[0, 1], [2960, 1], [3160, 0, 'in']],
    celebrate: [[0, 0], [1700, 0], [1820, 1]],
    hopX: [[0, 0], [2220, 0], [2420, 0.015], [2700, 0]],
    diveY: [[0, 0], [2860, 0], [3160, 1, 'inOut']],
};

const DORO: Character = {
    seatX: 0.595,
    launch: 1080,
    air: 600,
    lift: 0.3,
    hop: 0.035,
    lean: -1,
    // Heavier: a deeper crouch and squash, a smaller stretch, a lower and later leap.
    sy: [[0, 1], [100, 1], [380, 1.035], [660, 1], [1030, 0.74, 'inOut'], [1080, 0.74], [1160, 1.16, 'out'], [1240, 1], [1640, 1.1, 'in'],
        [1680, 1.1], [1730, 0.6, 'out'], [1770, 0.6], [1890, 1.08, 'out'], [1990, 0.95], [2100, 1],
        [2190, 0.86], [2240, 1.06, 'out'], [2340, 1], [2420, 1.03], [2440, 1.03], [2480, 0.88, 'out'], [2590, 1],
        [2740, 1], [2900, 1.1], [3190, 0.42, 'in']],
    sx: [[0, 1], [100, 1], [380, 0.98], [660, 1], [1030, 1.2, 'inOut'], [1080, 1.2], [1160, 0.88, 'out'], [1240, 1], [1640, 0.92, 'in'],
        [1680, 0.92], [1730, 1.45, 'out'], [1770, 1.45], [1890, 0.94, 'out'], [1990, 1.04], [2100, 1],
        [2190, 1.12], [2240, 0.95, 'out'], [2340, 1], [2420, 0.98], [2440, 0.98], [2480, 1.12, 'out'], [2590, 1],
        [2740, 1], [2900, 0.92], [3190, 0.62, 'in']],
    rot: [[0, 0], [1080, 0], [1170, 6, 'out'], [1640, -2], [1730, 0, 'out'], [2190, 0], [2440, -8], [2740, 0]],
    opacity: [[0, 1], [2990, 1], [3190, 0, 'in']],
    celebrate: [[0, 0], [1730, 0], [1850, 1]],
    hopX: [[0, 0], [2240, 0], [2440, -0.015], [2740, 0]],
    diveY: [[0, 0], [2900, 0], [3190, 1, 'inOut']],
};

export const CHARACTERS = { pomo: POMO, doro: DORO } as const;
export type Who = keyof typeof CHARACTERS;

/**
 * How far above the art box a character's head can reach, as a share of the box's height: seated
 * on the closed cover, then at the top of Pomo's leap, which scales with `room`. The screen keeps
 * this much headroom above the art so nothing is clipped; the tests check it bounds every frame.
 */
export function headroom(room = 1): number {
    return 0.28 + 0.14 * room;
}

/** Where the dive ends: the feet rise so the shrinking body's centre meets its face. */
const DIVE_Y = 0.55;

export type CharacterPose = {
    /** The feet, in box shares. */
    x: number;
    y: number;
    sx: number;
    sy: number;
    rot: number;
    opacity: number;
    /** The joyful pose's opacity over the idle one. */
    celebrate: number;
};

/**
 * One character at time `t`. `room` scales every jump's height: 1 normally, less where the art has
 * little headroom (compact height), so an arc never leaves the screen.
 *
 * The leap is a projectile: with s = (t − launch) / air in [0, 1], the feet follow
 *   x(s) = x₀ + (x₁ − x₀)·s,   y(s) = y₀ + (y₁ − y₀)·s − 4H·s(1 − s)
 * where (x₀, y₀) is the cover's top edge at take-off, (x₁, y₁) the face's spot on the page, and
 * H = lift × room. y is quadratic in t, so the vertical acceleration is constant (gravity): slow at
 * the apex, fastest at take-off and landing. The apex is at s* = (1 − (y₁ − y₀) / 4H) / 2.
 */
export function characterPose(who: Who, t: number, room = 1): CharacterPose {
    'worklet';
    const c = who === 'pomo' ? POMO : DORO;
    const face = who === 'pomo' ? FACE.pomo : FACE.doro;
    let x = c.seatX;
    let y = coverTop(Math.min(t, c.launch));
    if (t > c.launch) {
        const s = clamp01((t - c.launch) / c.air);
        const y0 = coverTop(c.launch);
        x = c.seatX + (face.x - c.seatX) * s;
        // The spot rides the pages' dip, which Pomo's landing starts before Doro's.
        const y1 = LAND_Y + track(t, SPREAD_DIP);
        y = y0 + (y1 - y0) * s - 4 * c.lift * room * s * (1 - s);
    }
    if (t >= c.launch + c.air) {
        x = face.x + track(t, c.hopX);
        y = LAND_Y;
        const hopLaunch = HOP.launch + (who === 'doro' ? 20 : 0);
        const hopLand = HOP.land + (who === 'doro' ? 20 : 0);
        if (t > hopLaunch && t < hopLand) {
            const s = (t - hopLaunch) / (hopLand - hopLaunch);
            y -= 4 * c.hop * room * s * (1 - s);
        }
        y += (DIVE_Y - LAND_Y) * track(t, c.diveY) + track(t, SPREAD_DIP);
    }
    return {
        x,
        y,
        sx: track(t, c.sx),
        sy: track(t, c.sy),
        rot: track(t, c.rot),
        opacity: track(t, c.opacity),
        celebrate: track(t, c.celebrate),
    };
}

// ── The sparkles ─────────────────────────────────────────────────────────────────────────────

/** Five from each face, as the spread takes them in: Pomo's strawberry, then Doro's matcha. */
export const PARTICLE_COUNT = 10;
const PARTICLE_START = 3090;
const PARTICLE_LIFE = 560;

export type ParticlePose = { x: number; y: number; scale: number; rot: number; opacity: number };

/**
 * Particle `i` at time `t`: a fan of five over the upper 120° from each face, each flying out with
 * a strong ease-out and falling a little under gravity, fading in fast and out slowly.
 */
export function particlePose(i: number, t: number): ParticlePose {
    'worklet';
    const pomo = i < 5;
    const k = i % 5;
    const face = pomo ? FACE.pomo : FACE.doro;
    const start = PARTICLE_START + k * 18 + (pomo ? 0 : 30);
    const u = clamp01((t - start) / PARTICLE_LIFE);
    const side = pomo ? -1 : 1;
    const angle = ((-90 + side * (-50 + 30 * k)) * Math.PI) / 180;
    const reach = 0.12 + 0.035 * (k % 2);
    const travel = ease('out', u);
    return {
        x: face.x + Math.cos(angle) * reach * travel,
        y: face.y + (Math.sin(angle) * reach * travel) / ASPECT + 0.06 * u * u,
        scale: u <= 0 ? 0.5 : 0.5 + 0.6 * ease('out', Math.min(u * 3, 1)) - 0.4 * u,
        rot: 45 + (k % 2 === 0 ? 1 : -1) * 200 * u,
        opacity: u <= 0 || u >= 1 ? 0 : u < 0.12 ? u / 0.12 : 1 - Math.pow((u - 0.12) / 0.88, 2),
    };
}

// ── The line ─────────────────────────────────────────────────────────────────────────────────

const LINE_OPACITY: readonly Key[] = [[0, 0], [3500, 0], [4100, 1, 'out']];
const LINE_RISE: readonly Key[] = [[0, 14], [3500, 14], [4100, 0, 'out']];

/** The line under the mark: its opacity, and how far below its place it still is, in points. */
export function linePose(t: number): { opacity: number; dy: number } {
    'worklet';
    return { opacity: track(t, LINE_OPACITY), dy: track(t, LINE_RISE) };
}
