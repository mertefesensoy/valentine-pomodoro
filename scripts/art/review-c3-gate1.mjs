#!/usr/bin/env node
/**
 * C3 gate 1: the Same Page mark in three colours (judged as home-screen icons), and Pomo & Doro's
 * foundations: the personality map, the rendering style and the locked construction, with the
 * first idle pose of each at test sizes. Every image is a VectorCraft export (art/out/), embedded.
 *
 *   node scripts/art/review-c3-gate1.mjs                 → art/review/c3-gate1.html
 *   node scripts/art/review-c3-gate1.mjs --fragment FILE → without the document wrapper
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const png = (rel) => `data:image/png;base64,${read(rel).toString('base64')}`;
const palette = JSON.parse(read('src/theme/palette.json'));
const baloo = /@font-face\{font-family:'Baloo 2 C2';font-weight:600;[^}]*\}/.exec(read('art/review/c2-type-specimen.html').toString())[0];
const sm = palette.themes.strawberryMilk.tokens, mp = palette.themes.midnightPlum.tokens;
const keys = ['page', 'paper', 'edge', 'ink', 'inkSoft', 'primary', 'primaryInk', 'primarySoft', 'success', 'onSuccess', 'field'];
const tok = (t) => keys.map((k) => `--${k}:${t[k]}`).join(';');

const OPTIONS = [
    { id: 'c-cocoa-sticker', name: 'C · Cocoa sticker on strawberry', rec: true,
      why: 'The diary as a die-cut sticker on a strawberry page: the Sticker Diary in one tile. Cocoa on strawberry is the strongest edge at 40 and 20 px, and the dark and tinted icons come from it directly.' },
    { id: 'a-strawberry-matcha', name: 'A · Strawberry and matcha pages',
      why: 'Each page wears one character’s colour, so the mark says "two of you" in colour as well. Softest and most charming; on a milk tile its edge is faint at small sizes (about 1.6:1).' },
    { id: 'b-strawberry-milk', name: 'B · Two strawberry pages',
      why: 'Two tones of one strawberry: one family, two pages. Warm and simple; same small-size softness as A.' },
];

const tile = (id, px, cls = '') => `<img class="tile ${cls}" data-px="${px}" width="${px}" height="${px}" src="${png(`art/out/logo/logo-colour-${id}-${px}.png`)}" alt="">`;
const blank = (px) => `<span class="ph" style="width:${px}px;height:${px}px" aria-hidden="true"></span>`;

function option(o) {
    const icon = png(`art/out/logo/logo-colour-${o.id}-180.png`);
    return `<article class="opt${o.rec ? ' rec' : ''}">
      <img class="tile hero" width="160" height="160" src="${icon}" alt="${o.name}">
      <div class="home" aria-label="${o.name} on a home screen, at 60 pt">
        <div class="row">${blank(60)}<img class="tile" width="60" height="60" src="${icon}" alt="">${blank(60)}</div>
      </div>
      <div class="sizes">${[60, 40, 20].map((px) => tile(o.id, px, 'px')).join('')}<span class="note">real pixels</span></div>
      <h3>${o.name}${o.rec ? ' <span class="badge">Recommended</span>' : ''}</h3>
      <p>${o.why}</p>
    </article>`;
}

const ch = (id, px) => `<img class="px" data-px="${px}" width="${px}" height="${px}" src="${png(`art/out/illustration/${id}-${px}.png`)}" alt="">`;

/** The construction diagram: guides drawn over the 512-unit artboard. */
function guides(kind) {
    const pomo = kind === 'pomo';
    const top = pomo ? 106 : 134, h = pomo ? 352 : 322, w = pomo ? 352 : 392;
    const ey = top + 0.52 * h, gap = 0.26 * w, cy = ey + 0.11 * h;
    return `<svg class="guide" viewBox="0 0 512 512" aria-hidden="true">
      <line x1="256" y1="40" x2="256" y2="480" />
      <line x1="40" y1="${ey}" x2="472" y2="${ey}" />
      <line x1="40" y1="${cy}" x2="472" y2="${cy}" class="soft" />
      <line x1="${256 - gap / 2}" y1="${ey - 60}" x2="${256 - gap / 2}" y2="${ey + 60}" class="soft" />
      <line x1="${256 + gap / 2}" y1="${ey - 60}" x2="${256 + gap / 2}" y2="${ey + 60}" class="soft" />
      <rect x="${256 - w / 2}" y="${top}" width="${w}" height="${h}" class="box" />
    </svg>`;
}

const body = `<title>Pomo, Doro and the mark</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: two chapters. The mark in colour, judged on a home-screen row; then Pomo & Doro's foundations, from personality to construction. C1 tokens. */
${baloo}
:root { ${tok(sm)}; --display: 'Baloo 2 C2', ui-rounded, system-ui, sans-serif; --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; --wall: #DDE3EA; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${tok(mp)}; --wall: #2B3440; color-scheme: dark; } }
:root[data-theme="dark"] { ${tok(mp)}; --wall: #2B3440; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.5 var(--ui); }
.wrap { max-width: 1100px; margin: 0 auto; padding-block: 36px 72px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 28px; }
h1 { font: 600 clamp(32px, 5vw, 44px)/1.05 var(--display); margin: 0; text-wrap: balance; }
h2 { font: 600 28px/1.1 var(--display); margin: 0; }
h3 { font: 600 19px/1.2 var(--display); margin: 0; }
.lede { color: var(--inkSoft); max-width: 70ch; margin: 8px 0 0; }
.opts { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 16px; }
.opt { background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 16px; display: grid; gap: 10px; align-content: start; min-width: 0; }
.opt.rec { border: 2px solid var(--primaryInk); }
.opt p { margin: 0; color: var(--inkSoft); }
.home { background: var(--wall); border-radius: 16px; padding: 14px 10px; }
.hero { justify-self: center; }
.note { font-size: 12px; color: var(--inkSoft); }
.row { display: flex; justify-content: center; align-items: center; gap: 22px; flex-wrap: wrap; }
.ph { display: block; border-radius: 22.37%; background: rgba(255,255,255,.55); }
.tile { border-radius: 22.37%; display: block; }
.sizes { display: flex; gap: 12px; align-items: flex-end; }
.badge { font: 600 12px var(--ui); background: var(--primarySoft); color: var(--primaryInk); border-radius: 999px; padding: 2px 8px; vertical-align: middle; }
.panel { background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 20px; display: grid; gap: 14px; min-width: 0; }
.scroll { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; min-width: 520px; }
td, th { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--edge); vertical-align: top; }
th { color: var(--inkSoft); font-weight: 600; width: 190px; }
.pair { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; }
.pair figure { margin: 0; display: grid; gap: 6px; justify-items: center; }
.pair figcaption { font-size: 13px; color: var(--inkSoft); text-align: center; max-width: 220px; }
.big { width: 220px; height: 220px; }
.cons { position: relative; width: 240px; height: 240px; }
.cons img, .cons svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.guide line, .guide rect { stroke: var(--primaryInk); stroke-width: 2; stroke-dasharray: 6 6; fill: none; }
.guide .soft { opacity: .5; }
.guide .box { stroke-dasharray: 2 6; opacity: .6; }
.tests { display: flex; gap: 14px; align-items: flex-end; background: var(--page); border: 1px solid var(--edge); border-radius: 14px; padding: 12px; }
.ask { background: var(--primarySoft); border-radius: 22px; padding: 20px; display: grid; gap: 8px; }
.ask ol { margin: 0; padding-left: 22px; display: grid; gap: 6px; }
footer { color: var(--inkSoft); font-size: 13px; }
</style>
<div class="wrap">
  <header>
    <h1>The mark in colour, and Pomo &amp; Doro</h1>
    <p class="lede">Phase 1, C3, gate 1. First the Same Page mark in three colourings, each judged where it will live: on a home screen, then at the small sizes. Then the foundations of Pomo &amp; Doro, in the order your mascot method sets: personality, rendering style, construction, and a first idle pose of each. The other poses wait for your yes on these.</p>
  </header>

  <section aria-labelledby="h-mark" style="display:grid;gap:14px">
    <h2 id="h-mark">The mark in colour</h2>
    <div class="opts">${OPTIONS.map(option).join('')}</div>
  </section>

  <section class="panel" aria-labelledby="h-map">
    <h2 id="h-map">Pomo &amp; Doro: the personality map</h2>
    <div class="scroll"><table><tbody>
      <tr><th>Voice</th><td>Warm, gentle, encouraging, with a quiet sense of humour. Never guilt, never pressure.</td></tr>
      <tr><th>Audience</th><td>University-age couples, 18 and over, mostly long-distance; Turkey is a core market.</td></tr>
      <tr><th>What they already love</th><td>Japanese and Korean stationery: sticker sheets, washi tape, study planners; soft flat characters on paper; café drinks like strawberry milk and matcha.</td></tr>
      <tr><th>Register</th><td>Cute enough to be loved, grown-up enough for a lecture hall. Playful, never babyish.</td></tr>
      <tr><th>Pomo, the steady one</th><td>Round and upright, with one curl that springs up when an idea lands. Starts things. Keeps the minutes: the top of the colon. Strawberry.</td></tr>
      <tr><th>Doro, the warm one</th><td>A soft dome that settles, sinks a little when sleepy and wobbles when happy. First to cheer. Keeps the seconds: the bottom of the colon. Matcha.</td></tr>
      <tr><th>Together</th><td>Equals and partners, never parent and child: the same visual weight (within 10 %). Strawberry and matcha are two flavours of one sweet, so the pair isn't coded by gender.</td></tr>
      <tr><th>Never</th><td>A tomato, an animal (the category's habit), sulking, crying or nagging, a gendered cue, a babyish face.</td></tr>
    </tbody></table></div>
  </section>

  <section class="panel" aria-labelledby="h-style">
    <h2 id="h-style">Rendering style</h2>
    <div class="pair">
      <figure><img class="big" src="${png('art/out/illustration/pomo-idle-512.png')}" alt="Pomo, flat style"><figcaption><b>Flat, die-cut (recommended).</b> Flat fills, no outline, no gradient; a white die-cut edge and a soft tinted shadow make it a sticker. The stationery register.</figcaption></figure>
      <figure><img class="big" src="${png('art/out/illustration/pomo-idle-outlined-512.png')}" alt="Pomo, outlined style"><figcaption><b>Outlined.</b> A cocoa outline round the body. Reads as cartoon and mass-market, closer to a children's app: the mismatch your article warns about.</figcaption></figure>
    </div>
  </section>

  <section class="panel" aria-labelledby="h-cons">
    <h2 id="h-cons">Construction, locked</h2>
    <div class="pair">
      <figure><div class="cons"><img src="${png('art/out/illustration/pomo-idle-512.png')}" alt="Pomo on the construction grid">${guides('pomo')}</div><figcaption>Pomo: a circle, 69 % of the 512 grid, one curl from the crown.</figcaption></figure>
      <figure><div class="cons"><img src="${png('art/out/illustration/doro-idle-512.png')}" alt="Doro on the construction grid">${guides('doro')}</div><figcaption>Doro: a dome 1.22 times wider than tall, the same area as Pomo within 10 %.</figcaption></figure>
    </div>
    <div class="scroll"><table><tbody>
      <tr><th>Eyes</th><td>On the eye line at 52 % of body height; 26 % of body width apart; each 7 % of width, an upright oval (1 : 1.25) with a shine at the upper right.</td></tr>
      <tr><th>Cheeks</th><td>11 % below the eye line, just outside the eyes; 12 % × 6 % of width; blush at 55 %.</td></tr>
      <tr><th>Mouth</th><td>Centred, 9 % of width, 8.5 % below the eye line. Expressions change the mouth and eyes, never the eye line or the spacing.</td></tr>
      <tr><th>Sticker edge</th><td>A 20-unit white die-cut edge (about 6 % of Pomo's width) and a soft shadow tinted from the theme.</td></tr>
      <tr><th>Colours</th><td>Pomo strawberry (<code>primary</code>), Doro matcha (the <code>success</code> leaf, one step deeper so it holds on cream), cocoa for the eyes and mouth (<code>ink</code>).</td></tr>
    </tbody></table></div>
    <h3>Every size, at its real pixels</h3>
    <div class="tests">${['pomo-idle', 'doro-idle'].map((id) => [128, 32, 16].map((px) => ch(id, px)).join('')).join('<span style="width:18px"></span>')}</div>
  </section>

  <section class="ask" aria-labelledby="h-ask">
    <h2 id="h-ask">Please decide</h2>
    <ol>
      <li>The app icon's colouring: C, A or B.</li>
      <li>The personality map and the flat, die-cut style.</li>
      <li>How Pomo &amp; Doro differ: a round strawberry with a curl, and a matcha dome.</li>
    </ol>
  </section>

  <footer>Every image is a VectorCraft export rebuilt from <code>art/steps/*.steps.json</code>; colours come from <code>src/theme/palette.json</code>. Home-screen neighbours are blank placeholders on purpose.</footer>
</div>
<script>
document.querySelectorAll('img.px').forEach((img) => { const w = Number(img.dataset.px) / (window.devicePixelRatio || 1); img.style.width = img.style.height = w + 'px'; });
</script>
`;

const fragmentAt = process.argv.indexOf('--fragment');
if (fragmentAt !== -1) {
    fs.writeFileSync(process.argv[fragmentAt + 1], body);
} else {
    const out = path.join(ROOT, 'art/review/c3-gate1.html');
    fs.writeFileSync(out, '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style></head><body>') + '</body></html>\n');
    console.log(`wrote ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);
}
