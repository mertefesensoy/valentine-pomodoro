/**
 * tour-symbols.mjs — the tour kit's layers as inline SVG <symbol>s, for the D5 review pages
 * (scripts/art/review-d5-poses.mjs, scripts/sound/review-d5-voices.mjs).
 *
 * Contract
 *   tourLayers(root): reads art/jobs/tour.json and each built layer (art/out/illustration/<id>.svg);
 *     returns [{ id, inner, bytes, bounds }], `inner` the drawing without its <svg> and <title>,
 *     `bounds` [minX, minY, maxX, maxY] over every coordinate in its paths (control points
 *     included, so the drawing is inside them). Throws if a layer isn't built.
 *   tourSymbols(layers): one hidden <svg> of <symbol>s, id = the layer's id, plus a copy of the
 *     die-cut edge and of each hand drawn in currentColor (id + '-s'), which tour-motion.js uses
 *     for the lift. No side effects.
 */
import fs from 'node:fs';
import path from 'node:path';

export function tourLayers(root) {
    const job = JSON.parse(fs.readFileSync(path.join(root, 'art/jobs/tour.json'), 'utf8'));
    return job.assets.map((a) => {
        const svg = fs.readFileSync(path.join(root, `art/out/illustration/${a.id}.svg`), 'utf8');
        const inner = svg.slice(svg.indexOf('</title>') + 8, svg.lastIndexOf('</svg>'));
        const coords = [...inner.matchAll(/ d="([^"]+)"/g)].flatMap((m) => m[1].match(/-?\d+(?:\.\d+)?/g).map(Number));
        const xs = coords.filter((_, i) => i % 2 === 0);
        const ys = coords.filter((_, i) => i % 2 === 1);
        return { id: a.id, inner, bytes: Buffer.byteLength(svg), bounds: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
    });
}

export function tourSymbols(layers) {
    const lifted = (l) => /-tour-(body-cut|hand-)/.test(l.id);
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${layers.map((l) =>
        `<symbol id="${l.id}" viewBox="0 0 512 512" overflow="visible">${l.inner}</symbol>`
        + (lifted(l) ? `<symbol id="${l.id}-s" viewBox="0 0 512 512" overflow="visible">${l.inner.replace(/ fill="#[0-9a-f]{6}"/gi, ' fill="currentColor"')}</symbol>` : '')).join('')}</defs></svg>`;
}
