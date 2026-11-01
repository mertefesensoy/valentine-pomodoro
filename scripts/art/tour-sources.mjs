#!/usr/bin/env node
/**
 * tour-sources.mjs — the sources of Pomo & Doro's tour kit, the layers the tutorial animates
 * (Phase 1 D5 assets; NFR-PERF-005, ADR-0047).
 *
 *   node scripts/art/tour-sources.mjs           write art/src/tour/*.svg, art/src/tour/expressions.json and art/jobs/tour.json
 *   node scripts/art/tour-sources.mjs --check   regenerate in memory and compare; exit 1 on any difference
 *
 * Contract
 *   in : nothing but the constants below, read from the shipped C3 sources (art/src/mascots/*-idle.svg,
 *        *-break.svg, *-celebrating.svg), so every new face sits on the locked construction.
 *   out: one SVG per layer, all on the shipped 512 × 512 artboard, so the layers stack exactly:
 *        - body-cut   the die-cut silhouette alone (the white edge, and Pomo's curl's), which carries the lift
 *        - hand       a short nub in the body's colour with its own die-cut edge (wave and point, each
 *                     side), drawn *between* the cut and the fill, so the nub grows out of the body inside
 *                     one continuous edge and its root stays hidden when it turns
 *        - body-fill  the fill, the curl's fill and the cheeks, with no face
 *        - eyes       both eyes of one expression
 *        - mouth      one mouth shape
 *        plus expressions.json (each expression as a recipe of layers and a held transform, and the
 *        motion numbers) and the job that builds the layers with scripts/art/build.mjs.
 *   how: every face shape is written once, in Pomo's units around an anchor (an eye's centre, the
 *        mouth's top line), and drawn for Doro scaled by K = 13.7 / 12.3 around Doro's anchors: the
 *        ratio of the two shipped idle eyes, which every other shipped face feature also follows
 *        (the smile, the grin, the tongue, the eye smile, all within 0.1 unit). Output is a pure
 *        function of the constants, so --check is byte-exact. Nothing drawn leaves the artboard:
 *        squash, stretch, tilt and breath are view transforms about the feet, which don't clip.
 * Writes only art/src/tour/ and art/jobs/tour.json; run from anywhere.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');

const INK = '#4A2C29';
const WHITE = '#FFFFFF';
const TONGUE = '#E06688';
const CHEEK = '#EE7A9C';
const CUT = 40; // the die-cut edge: a 40-unit white stroke, 20 units outside the fill (C3)

// The two characters, read from the shipped sources. `eyes` are the eye centres, `mouth` the
// middle of the mouth's top line, `feet` the bottom of the die-cut edge (the transform origin).
const CHARACTERS = {
    pomo: {
        name: 'Pomo',
        fill: '#F7A9BE',
        k: 1,
        body: { circle: { cx: 256, cy: 282, r: 176 } },
        curl: 'M262 108 C258 72 286 56 306 70 C322 82 312 104 294 100',
        cheeks: { at: [[178.6, 327.8], [333.4, 327.8]], rx: 21.1, ry: 11.3 },
        eyes: [[210.2, 289.0], [301.8, 289.0]],
        mouth: [256, 319.0],
        feet: [256, 478],
        // Hands, right side (the left side mirrors about x = 256): root hidden behind the fill, tip outside.
        hands: {
            wave: { root: [360, 222], tip: [403, 150], r: 30 },
            point: { root: [375, 299], tip: [446, 322], r: 25 },
        },
    },
    doro: {
        name: 'Doro',
        fill: '#9ED39A',
        k: 13.7 / 12.3,
        body: { path: 'M60 362 C60 212 150 134 256 134 C362 134 452 212 452 362 C452 426 392 456 256 456 C120 456 60 426 60 362 Z' },
        cheeks: { at: [[169.8, 336.9], [342.2, 336.9]], rx: 23.5, ry: 12.5 },
        eyes: [[205.0, 301.4], [307.0, 301.4]],
        mouth: [256, 328.8],
        feet: [256, 476],
        hands: {
            wave: { root: [352, 248], tip: [415, 182], r: 30 },
            point: { root: [372, 300], tip: [462, 318], r: 25 },
        },
    },
};

const n = (x) => String(Number(x.toFixed(2)));

/** A point in Pomo units around an anchor, drawn for character `c`. */
const at = (c, [ax, ay], dx, dy) => `${n(ax + dx * c.k)} ${n(ay + dy * c.k)}`;

// ── Eyes, in Pomo units around each eye's centre ─────────────────────────────────────────────
// open, smile, and the stroke widths are the shipped ones (idle, break); the rest are new.
const EYE_STROKE = 8.6;

const ellipse = (c, e, dx, dy, rx, ry, fill) => `<ellipse cx="${n(e[0] + dx * c.k)}" cy="${n(e[1] + dy * c.k)}" rx="${n(rx * c.k)}" ry="${n(ry * c.k)}" fill="${fill}"/>`;
const dot = (c, e, dx, dy, r, fill = WHITE) => `<circle cx="${n(e[0] + dx * c.k)}" cy="${n(e[1] + dy * c.k)}" r="${n(r * c.k)}" fill="${fill}"/>`;
const line = (c, d, width, colour = INK) => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${n(width * c.k)}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shape = (d, fill) => `<path d="${d}" fill="${fill}"/>`;

/** A four-point sparkle (each side a quadratic pulled to the centre), outer radius r. */
const sparkle = (c, e, dx, dy, r) => {
    const x = e[0] + dx * c.k;
    const y = e[1] + dy * c.k;
    const R = r * c.k;
    return shape(`M${n(x)} ${n(y - R)} Q${n(x)} ${n(y)} ${n(x + R)} ${n(y)} Q${n(x)} ${n(y)} ${n(x)} ${n(y + R)} Q${n(x)} ${n(y)} ${n(x - R)} ${n(y)} Q${n(x)} ${n(y)} ${n(x)} ${n(y - R)} Z`, WHITE);
};

const openEye = (c, e, dx = 0, dy = 0) => ellipse(c, e, dx, dy, 12.3, 15.4, INK) + dot(c, e, dx + 4.4, dy - 5.5, 3.9);
const smileEye = (c, e) => line(c, `M${at(c, e, -16, 5)} Q${at(c, e, 0, -16)} ${at(c, e, 16.1, 5)}`, EYE_STROKE);

const EYES = {
    open: { title: 'open', draw: (c, e) => openEye(c, e) },
    // A blink: the lid closed in a shallow curve, shallower than sleepy's, for about 110 ms.
    blink: { title: 'blink (closed)', draw: (c, e) => line(c, `M${at(c, e, -13.5, 1)} Q${at(c, e, 0, 8)} ${at(c, e, 13.5, 1)}`, EYE_STROKE) },
    // The eye smile: break's closed, upturned eyes.
    smile: { title: 'eye smile', draw: (c, e) => smileEye(c, e) },
    // Excited: celebrating's larger eye with a four-point sparkle for its highlight, and two small glints.
    sparkle: {
        title: 'sparkling',
        draw: (c, e) => ellipse(c, e, 0, 0, 14.2, 17.6, INK) + sparkle(c, e, 4.4, -6, 7.2) + dot(c, e, -5, 6.8, 2.7) + dot(c, e, 6.4, 5.6, 1.5),
    },
    // Surprised: rounder, a little raised, with a smaller highlight.
    wide: { title: 'wide', draw: (c, e) => ellipse(c, e, 0, -3, 14.8, 15.8, INK) + dot(c, e, 4.6, -8.4, 3.1) },
    // A wink: the right-hand eye closes into the eye smile.
    wink: { title: 'wink', draw: (c, e, side) => (side === 0 ? openEye(c, e) : smileEye(c, e)) },
    // Proud: pleased, eyes closed in a flatter, wider arc than the eye smile (with the little "w"
    // mouth and the chin up, it reads "^ω^").
    proud: { title: 'proud', draw: (c, e) => line(c, `M${at(c, e, -17.5, 3.5)} Q${at(c, e, 0, -10)} ${at(c, e, 17.5, 3.5)}`, EYE_STROKE) },
    // Looking aside: both eyes shifted together, a little down, as when the listener watches the opening.
    'look-left': { title: 'looking left', draw: (c, e) => openEye(c, e, -5.5, 1.5) },
    'look-right': { title: 'looking right', draw: (c, e) => openEye(c, e, 5.5, 1.5) },
};

// ── Mouths, in Pomo units around the mouth's anchor (the middle of the smile's top line) ──────
const MOUTH_STROKE = 7.7;
const tongue = (c, m, w, top, depth) => shape(`M${at(c, m, -w, top)} Q${at(c, m, 0, top + depth)} ${at(c, m, w, top)}`, TONGUE);

const MOUTHS = {
    // The shipped idle smile.
    smile: { title: 'smile', draw: (c, m) => line(c, `M${at(c, m, -15.8, 0)} Q${at(c, m, 0, 17.6)} ${at(c, m, 15.8, 0)}`, MOUTH_STROKE) },
    // The talking loop's three shapes: a small bowl, a wide one with its tongue, and an "o".
    'talk-small': { title: 'talking, small', draw: (c, m) => shape(`M${at(c, m, -11.5, 0.5)} C${at(c, m, -11.5, 13.5)} ${at(c, m, 11.5, 13.5)} ${at(c, m, 11.5, 0.5)} Z`, INK) },
    'talk-wide': {
        title: 'talking, wide',
        draw: (c, m) => shape(`M${at(c, m, -17.5, -1)} C${at(c, m, -17.5, 26)} ${at(c, m, 17.5, 26)} ${at(c, m, 17.5, -1)} Z`, INK) + tongue(c, m, 9.5, 12, 13),
    },
    'talk-round': { title: 'talking, round', draw: (c, m) => ellipse(c, m, 0, 8, 8.6, 10.4, INK) },
    // The shipped celebrating grin, with its tongue.
    grin: { title: 'grin', draw: (c, m) => shape(`M${at(c, m, -21.1, -1.8)} Q${at(c, m, 0, 35.2)} ${at(c, m, 21.1, -1.8)} Z`, INK) + tongue(c, m, 10.6, 12.3, 10.5) },
    // Surprised: a tall "O".
    wow: { title: 'surprised "O"', draw: (c, m) => ellipse(c, m, 0, 10, 11.5, 15, INK) + tongue(c, m, 7, 16.5, 10) },
    // Proud: the little "w" of a satisfied smile.
    proud: { title: 'proud', draw: (c, m) => line(c, `M${at(c, m, -15, 0)} Q${at(c, m, -7.5, 11.5)} ${at(c, m, 0, 1.5)} Q${at(c, m, 7.5, 11.5)} ${at(c, m, 15, 0)}`, MOUTH_STROKE) },
};

// ── The body and the hands ───────────────────────────────────────────────────────────────────
function bodyOf(c, fill, stroke = '') {
    const s = stroke ? ` stroke="${WHITE}" stroke-width="${CUT}" stroke-linejoin="round"` : '';
    return c.body.circle
        ? `<circle cx="${c.body.circle.cx}" cy="${c.body.circle.cy}" r="${c.body.circle.r}" fill="${fill}"${s}/>`
        : `<path d="${c.body.path}" fill="${fill}"${s}/>`;
}

const curl = (c, colour, width) => (c.curl ? `<path d="${c.curl}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"/>` : '');

/** The shipped die-cut silhouette: the body's white edge and the curl's. */
const bodyCut = (c) => bodyOf(c, WHITE, true) + curl(c, WHITE, 52);

/** The shipped body with no face: the fill, the curl's fill, the cheeks. */
function bodyFill(c) {
    const cheeks = c.cheeks.at.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${c.cheeks.rx}" ry="${c.cheeks.ry}" fill="${CHEEK}" opacity="0.55"/>`).join('');
    return bodyOf(c, c.fill) + curl(c, c.fill, 26) + cheeks;
}

/**
 * A nub: a round-capped bar of radius r from the root (inside the fill) to the tip, first in white
 * 20 units wider all round (its die-cut edge), then in the body's colour. Stacked between the
 * body's cut and its fill, the nub's fill joins the body's with no seam and its edge joins the
 * body's edge; the body's fill hides the root, which is the pivot when the hand turns.
 */
function hand(c, kind, side) {
    const h = c.hands[kind];
    const x = (v) => (side === 'right' ? v : 512 - v);
    const bar = (colour, width) => `<path d="M${n(x(h.root[0]))} ${n(h.root[1])} L${n(x(h.tip[0]))} ${n(h.tip[1])}" fill="none" stroke="${colour}" stroke-width="${n(width)}" stroke-linecap="round"/>`;
    return bar(WHITE, 2 * h.r + CUT) + bar(c.fill, 2 * h.r);
}

// ── The layers ───────────────────────────────────────────────────────────────────────────────
const layers = [];
for (const [who, c] of Object.entries(CHARACTERS)) {
    layers.push({ id: `${who}-tour-body-cut`, title: `${c.name}, tour: body, die-cut edge`, svg: bodyCut(c) });
    layers.push({ id: `${who}-tour-body-fill`, title: `${c.name}, tour: body, fill`, svg: bodyFill(c) });
    for (const kind of ['wave', 'point']) {
        for (const side of ['left', 'right']) layers.push({ id: `${who}-tour-hand-${kind}-${side}`, title: `${c.name}, tour: hand, ${kind}, ${side}`, svg: hand(c, kind, side) });
    }
    for (const [key, eye] of Object.entries(EYES)) {
        layers.push({ id: `${who}-tour-eyes-${key}`, title: `${c.name}, tour: eyes, ${eye.title}`, svg: c.eyes.map((e, side) => eye.draw(c, e, side)).join('') });
    }
    for (const [key, mouth] of Object.entries(MOUTHS)) {
        layers.push({ id: `${who}-tour-mouth-${key}`, title: `${c.name}, tour: mouth, ${mouth.title}`, svg: mouth.draw(c, c.mouth) });
    }
}

const svgFile = (l) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><title>${l.title}</title>${l.svg}</svg>\n`;

// ── The expressions: recipes of layers, a held transform, and the motion ─────────────────────
// A transform is about the feet: rotate in degrees (positive is clockwise), sx and sy as scales.
// `blinks` says whether the blink plays on that face; `talks` whether it is the talking face.
const EXPRESSIONS = [
    { id: 'rest', title: 'At rest', eyes: 'open', mouth: 'smile', blinks: true },
    { id: 'talking', title: 'Talking', eyes: 'open', mouth: 'smile', blinks: true, talks: ['talk-small', 'talk-wide', 'talk-round'] },
    { id: 'listening-left', title: 'Listening (watching the opening, left)', eyes: 'look-left', mouth: 'smile', blinks: true },
    { id: 'listening-right', title: 'Listening (watching the opening, right)', eyes: 'look-right', mouth: 'smile', blinks: true },
    { id: 'happy', title: 'Happy', eyes: 'smile', mouth: 'grin' },
    { id: 'excited', title: 'Excited', eyes: 'sparkle', mouth: 'grin', blinks: true, hold: { sy: 1.02 } },
    { id: 'curious', title: 'Curious', eyes: 'open', mouth: 'talk-round', blinks: true, hold: { rotate: -9 } },
    { id: 'proud', title: 'Proud', eyes: 'proud', mouth: 'proud', hold: { rotate: 3, sy: 1.03 } },
    { id: 'wink', title: 'A wink', eyes: 'wink', mouth: 'grin' },
    { id: 'surprised', title: 'Surprised', eyes: 'wide', mouth: 'wow', blinks: true, hold: { sy: 1.05 } },
    { id: 'wave', title: 'A wave', eyes: 'smile', mouth: 'grin', hand: 'wave' },
    { id: 'point', title: 'Pointing', eyes: 'look', mouth: 'smile', blinks: true, hand: 'point' },
];

// The motion, in milliseconds, units of the 512 artboard and scales. The pose sheet plays these
// numbers and the record (§4) derives them; the tutorial's builder copies them.
const MOTION = {
    blink: { closedMs: 110, intervalMs: [2800, 5200], doubleChance: 0.2, doubleGapMs: 140 },
    // The write-on (scripts/art/tour-speech.js): one character every 45 ms (22.2 a second, about
    // adult reading pace), a pause after a comma or a stop inside the line; a babble syllable on each
    // syllable of the text, at least 110 ms apart for Pomo and 150 ms for Doro; the mouth open for the
    // first 60 % of each syllable's slot.
    talk: { charMs: 45, pauseMs: { comma: 150, stop: 300 }, minGapMs: { pomo: 110, doro: 150 }, openShare: 0.6 },
    change: {
        totalMs: 280,
        keys: [
            { at: 0, sy: 1 },
            { at: 0.25, sy: 0.92 },
            { at: 0.6, sy: 1.04 },
            { at: 1, sy: 1 },
        ],
        faceOut: [0, 0.35],
        faceIn: [0.2, 0.55],
    },
    breath: { amplitude: 0.012, periodMs: { pomo: 3400, doro: 4100 }, talkingFactor: 0.5 },
    wave: { periodMs: 420, cycles: 2.5, degrees: [-16, 12] },
    point: { nudgeUnits: 10, nudgeMs: 320 },
    hold: { ms: 220 },
};

const expressions = {
    about: 'Generated by scripts/art/tour-sources.mjs. Each expression is a recipe of the tour kit layers (art/out/illustration/<who>-tour-*.svg, all on one 512 artboard), stacked in `order`: the die-cut edge of the body, a hand if any, the fill of the body, the eyes, the mouth. "look" means the side the hand points to. A hold is a transform about the feet, kept while the expression shows. Motion numbers are milliseconds, artboard units and scales; the D5 assets record derives them.',
    artboard: 512,
    feet: Object.fromEntries(Object.entries(CHARACTERS).map(([who, c]) => [who, c.feet])),
    // Each hand's pivot (its root, hidden in the fill) and the unit vector from the root to the tip.
    hands: Object.fromEntries(Object.entries(CHARACTERS).map(([who, c]) => [who, Object.fromEntries(['wave', 'point'].flatMap((kind) => ['left', 'right'].map((side) => {
        const h = c.hands[kind];
        const m = side === 'right' ? 1 : -1;
        const dx = (h.tip[0] - h.root[0]) * m;
        const dy = h.tip[1] - h.root[1];
        const len = Math.hypot(dx, dy);
        return [`${kind}-${side}`, { pivot: [side === 'right' ? h.root[0] : 512 - h.root[0], h.root[1]], axis: [Number((dx / len).toFixed(4)), Number((dy / len).toFixed(4))] }];
    })))])),
    order: ['body-cut', 'hand', 'body-fill', 'eyes', 'mouth'],
    expressions: EXPRESSIONS,
    motion: MOTION,
};

const job = {
    about: 'D5: Pomo & Doro\'s tour kit, the layers the tutorial stacks and animates (body, hands, eyes, mouths) on the shipped 512 artboard. Generated with its sources by scripts/art/tour-sources.mjs; built by scripts/art/build.mjs. No PNGs: the layers are only ever drawn stacked.',
    assets: layers.map((l) => ({ id: l.id, src: `art/src/tour/${l.id}.svg`, kind: 'illustration' })),
};

const files = new Map();
for (const l of layers) files.set(`art/src/tour/${l.id}.svg`, svgFile(l));
files.set('art/src/tour/expressions.json', JSON.stringify(expressions, null, 1) + '\n');
files.set('art/jobs/tour.json', JSON.stringify(job, null, 1) + '\n');

let differences = 0;
for (const [rel, text] of files) {
    const abs = path.join(ROOT, rel);
    if (CHECK) {
        if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== text) { differences++; console.log(`✖ ${rel} differs`); }
    } else {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, text);
    }
}
if (CHECK) {
    const extra = fs.existsSync(path.join(ROOT, 'art/src/tour')) ? fs.readdirSync(path.join(ROOT, 'art/src/tour')).filter((f) => !files.has(`art/src/tour/${f}`)) : [];
    for (const f of extra) { differences++; console.log(`✖ art/src/tour/${f} is not generated by this script`); }
    console.log(differences ? `✖ ${differences} file(s) differ` : `✔ ${files.size} files match`);
    process.exit(differences ? 1 : 0);
}
console.log(`wrote ${layers.length} layers, expressions.json and art/jobs/tour.json`);
