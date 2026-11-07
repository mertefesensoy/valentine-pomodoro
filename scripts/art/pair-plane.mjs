#!/usr/bin/env node
/**
 * The pairing sheet's paper plane scene (2026-11-07; docs/implementations/2026-11-07-phase2-pair-plane.md).
 *
 *   node scripts/art/pair-plane.mjs sources   write the drawing's sources to art/src/pair/
 *   node scripts/art/build.mjs art/jobs/pair.json   export them through VectorCraft (only this job: see the record)
 *   node scripts/art/pair-plane.mjs module    write src/screens/pair/planeArt.ts from the exports
 *
 * Contract
 *   in : the route, plane and hearts defined below, in one 361 x 280 artboard (points, on a 393 pt iPhone).
 *   out: one SVG source per colour, since the app draws them in the theme's tokens, and a data module of their paths.
 * The route is a chain of cubic Béziers. Its dots are spaced evenly along its length, by walking a fine polyline,
 * so a tight curve doesn't bunch them. Deterministic: no randomness, and numbers rounded to two decimals.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'art/src/pair');
const OUT = path.join(ROOT, 'art/out/illustration');
const MODULE = path.join(ROOT, 'src/screens/pair/planeArt.ts');
export const ARTBOARD = { w: 361, h: 280 };

// From above Pomo, up and round a loop, over the top, and down to above Doro.
const ROUTE = [
    [[88, 176], [92, 100], [140, 40], [186, 66]],
    [[186, 66], [228, 90], [206, 156], [164, 140]],
    [[164, 140], [120, 122], [170, 26], [262, 34]],
    [[262, 34], [306, 38], [318, 110], [296, 160]],
];
const DOT_SPACING = 15;
const DOT_RADIUS = 1.7;
const PLANE_AT = [262, 34];

const round = (n) => Number(n.toFixed(2));

function bezier([p0, p1, p2, p3], t) {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Points along the route, one every `spacing` units of its length. */
function evenlySpaced(spacing) {
    const fine = ROUTE.flatMap((seg) => Array.from({ length: 200 }, (_, i) => bezier(seg, i / 200)));
    fine.push(ROUTE.at(-1)[3]);
    const dots = [fine[0]];
    let walked = 0;
    for (let i = 1; i < fine.length; i++) {
        const step = Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]);
        walked += step;
        if (walked >= spacing) {
            dots.push(fine[i]);
            walked = 0;
        }
    }
    return dots;
}

const circle = ([x, y], r) => `M${round(x - r)} ${round(y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

/** A polygon around (cx, cy), scaled and turned, so the source holds absolute points and no transforms. */
function polygon(points, [cx, cy], scale, degrees) {
    const a = (degrees * Math.PI) / 180;
    const placed = points.map(([x, y]) => {
        const sx = x * scale;
        const sy = y * scale;
        return [round(cx + sx * Math.cos(a) - sy * Math.sin(a)), round(cy + sx * Math.sin(a) + sy * Math.cos(a))];
    });
    return `M${placed.map((p) => p.join(' ')).join('L')}Z`;
}

/** A heart of the given width, centred on (cx, cy). */
function heart([cx, cy], w) {
    const s = w / 24;
    const pt = (x, y) => `${round(cx + (x - 12) * s)} ${round(cy + (y - 12) * s)}`;
    return `M${pt(12, 21)}C${pt(5, 16)} ${pt(1, 12)} ${pt(1, 7.5)}C${pt(1, 4.5)} ${pt(3.5, 2.5)} ${pt(6.5, 2.5)}C${pt(8.5, 2.5)} ${pt(11, 3.5)} ${pt(12, 6)}C${pt(13, 3.5)} ${pt(15.5, 2.5)} ${pt(17.5, 2.5)}C${pt(20.5, 2.5)} ${pt(23, 4.5)} ${pt(23, 7.5)}C${pt(23, 12)} ${pt(19, 16)} ${pt(12, 21)}Z`;
}

// The plane, nose to the right, about its centre: a top wing and a lower wing that meet at the fold.
const WING_TOP = [[-27, -6], [27, -24], [-1, 6]];
const WING_LOW = [[-1, 6], [27, -24], [9, 22]];
const PLANE_SCALE = 1;
const PLANE_TURN = 20;

const DRAWINGS = {
    'pair-route': { title: 'The route between Pomo and Doro', d: evenlySpaced(DOT_SPACING).map((p) => circle(p, DOT_RADIUS)).join('') },
    'pair-plane-top': { title: 'The paper plane, top wing', d: polygon(WING_TOP, PLANE_AT, PLANE_SCALE, PLANE_TURN) },
    'pair-plane-low': { title: 'The paper plane, lower wing', d: polygon(WING_LOW, PLANE_AT, PLANE_SCALE, PLANE_TURN) },
    'pair-heart-big': { title: 'A heart', d: heart([118, 34], 14) },
    'pair-heart-small': { title: 'A small heart', d: heart([232, 134], 11) },
};

const FILLS = { 'pair-route': '#A07A72', 'pair-plane-top': '#FFFDFB', 'pair-plane-low': '#FDE4EB', 'pair-heart-big': '#E63946', 'pair-heart-small': '#F7A9BE' };

function writeSources() {
    fs.mkdirSync(SRC, { recursive: true });
    for (const [id, { title, d }] of Object.entries(DRAWINGS)) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ARTBOARD.w}" height="${ARTBOARD.h}" viewBox="0 0 ${ARTBOARD.w} ${ARTBOARD.h}"><title>${title}</title><path d="${d}" fill="${FILLS[id]}"/></svg>\n`;
        fs.writeFileSync(path.join(SRC, `${id}.svg`), svg);
    }
    console.log(`wrote ${Object.keys(DRAWINGS).length} sources to art/src/pair`);
}

function writeModule() {
    const exported = {};
    for (const id of Object.keys(DRAWINGS)) {
        const svg = fs.readFileSync(path.join(OUT, `${id}.svg`), 'utf8');
        // VectorCraft exports a straight-sided shape as a <polygon>.
        const ds = [
            ...[...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map((m) => m[1]),
            ...[...svg.matchAll(/<polygon\b[^>]*\bpoints="([^"]+)"/g)].map((m) => `M${m[1].trim().split(/\s+/).map((p) => p.replace(',', ' ')).join('L')}Z`),
        ];
        if (ds.length === 0) throw new Error(`${id}: no paths in the export`);
        exported[id] = ds.join('');
    }
    const key = (id) => id.replace(/^pair-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const body = Object.entries(exported).map(([id, d]) => `    ${key(id)}: ${JSON.stringify(d)},`).join('\n');
    const module = `// Generated by scripts/art/pair-plane.mjs from art/out/illustration/pair-*.svg. Do not edit.\n\nexport const PLANE_ARTBOARD = { w: ${ARTBOARD.w}, h: ${ARTBOARD.h} } as const;\n\nexport const planeArt = {\n${body}\n} as const;\n`;
    fs.writeFileSync(MODULE, module);
    console.log('wrote', path.relative(ROOT, MODULE), module.length, 'bytes');
}

const mode = process.argv[2];
if (mode === 'sources') writeSources();
else if (mode === 'module') writeModule();
else {
    console.error('usage: pair-plane.mjs sources|module');
    process.exit(1);
}
