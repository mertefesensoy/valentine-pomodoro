#!/usr/bin/env node
/**
 * The D5 pose sheet: Pomo & Doro's tour kit, every expression animated, in light and dark, for the
 * owner's approval (Phase 1 D5 assets; NFR-PERF-005, ADR-0047).
 *
 *   node scripts/art/review-d5-poses.mjs                 → art/review/d5-pose-sheet.html
 *   node scripts/art/review-d5-poses.mjs --fragment FILE → the same page without the document wrapper
 *
 * Reads only the repo: the built layers (art/out/illustration/<who>-tour-*.svg, from
 * scripts/art/build.mjs), the recipes and motion numbers (art/src/tour/expressions.json), the
 * theme tokens (src/theme/palette.json), Baloo 2 from the C2 specimen, and the motion engine
 * (scripts/art/tour-motion.js), which plays every sticker on the page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const KIT = JSON.parse(read('art/src/tour/expressions.json'));
const JOB = JSON.parse(read('art/jobs/tour.json'));
const palette = JSON.parse(read('src/theme/palette.json'));
const baloo = /@font-face\{font-family:'Baloo 2 C2';font-weight:600;[^}]*\}/.exec(read('art/review/c2-type-specimen.html'))[0];
const sm = palette.themes.strawberryMilk.tokens;
const mp = palette.themes.midnightPlum.tokens;
const keys = ['page', 'paper', 'field', 'edge', 'edgeStrong', 'ink', 'inkSoft', 'primary', 'onPrimary', 'primaryInk', 'primarySoft', 'successInk', 'ringTrack', 'ringFocus'];
/** The theme's sticker shadow as a colour and the opacity of each of its three layers (Sticker.tsx). */
const lift = (t) => {
    const m = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(t.stickerShadow);
    const alpha = parseInt(m[2], 16) / 255;
    return `--lift:#${m[1]};--liftLayer:${(1 - Math.pow(1 - alpha, 1 / 3)).toFixed(4)}`;
};
const tok = (t) => keys.map((k) => `--${k}:${t[k]}`).join(';') + ';' + lift(t);
const num = (x, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const kb = (bytes) => `${num(bytes / 1024, 1)} KB`;

// ── The layers: a <symbol> each, and a currentColor copy of the die-cut edge and the hands for the lift ──
const layers = JOB.assets.map((a) => {
    const svg = read(`art/out/illustration/${a.id}.svg`);
    const inner = svg.slice(svg.indexOf('</title>') + 8, svg.lastIndexOf('</svg>'));
    const coords = [...inner.matchAll(/ d="([^"]+)"/g)].flatMap((m) => m[1].match(/-?\d+(?:\.\d+)?/g).map(Number));
    const xs = coords.filter((_, i) => i % 2 === 0);
    const ys = coords.filter((_, i) => i % 2 === 1);
    return { id: a.id, inner, bytes: Buffer.byteLength(svg), bounds: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
});
const byId = Object.fromEntries(layers.map((l) => [l.id, l]));
const lifted = (l) => /-tour-(body-cut|hand-)/.test(l.id);
const SYMBOLS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${layers.map((l) =>
    `<symbol id="${l.id}" viewBox="0 0 512 512" overflow="visible">${l.inner}</symbol>`
    + (lifted(l) ? `<symbol id="${l.id}-s" viewBox="0 0 512 512" overflow="visible">${l.inner.replace(/ fill="#[0-9a-f]{6}"/gi, ' fill="currentColor"')}</symbol>` : '')).join('')}</defs></svg>`;

/** Every layer one expression draws at once, and with its animation frames (blink, talking mouths). */
function weight(who, e, side = 'right') {
    const eyes = e.eyes === 'look' ? `look-${side}` : e.eyes;
    const drawn = [`${who}-tour-body-cut`, `${who}-tour-body-fill`, `${who}-tour-eyes-${eyes}`, `${who}-tour-mouth-${e.mouth}`, ...(e.hand ? [`${who}-tour-hand-${e.hand}-${side}`] : [])];
    const frames = [...(e.blinks ? [`${who}-tour-eyes-blink`] : []), ...(e.talks ?? []).map((m) => `${who}-tour-mouth-${m}`)];
    const sum = (ids) => ids.reduce((t, id) => t + byId[id].bytes, 0);
    return { drawn: sum(drawn), all: sum([...new Set([...drawn, ...frames])]) };
}
const heaviest = Math.max(...KIT.expressions.flatMap((e) => ['pomo', 'doro'].map((w) => weight(w, e).all)));
const reach = layers.reduce((r, l) => [Math.min(r[0], l.bounds[0]), Math.min(r[1], l.bounds[1]), Math.max(r[2], l.bounds[2]), Math.max(r[3], l.bounds[3])], [512, 512, 0, 0]);

// ── The expression cards ─────────────────────────────────────────────────────────────────────
const M = KIT.motion;
const CARDS = [
    { expr: 'rest', name: 'At rest', note: 'The face the pair come back to. Blinks and breathes.', pomo: {}, doro: {} },
    { expr: 'talking', name: 'Talking', note: 'Three mouth shapes in step with the babble, the smile between syllables.', pomo: {}, doro: {} },
    { expr: 'listening', name: 'Listening', note: 'The listener holds still, eyes on the opening (here, on each other).', pomo: { expr: 'listening-right' }, doro: { expr: 'listening-left' } },
    { expr: 'happy', name: 'Happy', note: 'An eye smile and the open grin.', pomo: {}, doro: {} },
    { expr: 'excited', name: 'Excited', note: 'Sparkling eyes: a four-point glint in each. Held 2 % taller.', pomo: {}, doro: {} },
    { expr: 'curious', name: 'Curious', note: 'A head tilt of 9° about the feet, and a small "o".', pomo: {}, doro: {} },
    { expr: 'proud', name: 'Proud', note: 'Eyes closed in a wide arc, the little "w" smile, chin up: 3° and 3 % taller.', pomo: {}, doro: {} },
    { expr: 'wink', name: 'A wink', note: 'One eye open, one closed in the eye smile, with the grin.', pomo: {}, doro: {} },
    { expr: 'surprised', name: 'Surprised', note: 'Round, raised eyes and a tall "O". Held 5 % taller.', pomo: {}, doro: {} },
    { expr: 'wave', name: 'A wave', note: 'A nub grows from the body and swings 2½ times.', pomo: { side: 'left' }, doro: { side: 'right' } },
    { expr: 'point', name: 'Pointing', note: 'A nub points out, with a nudge; the eyes look the same way.', pomo: { side: 'left' }, doro: { side: 'right' } },
    { expr: 'cycle', name: 'One after another', note: 'Every expression in turn, a change every 1.6 s: watch the squash and the face crossing in.', pomo: { expr: 'rest' }, doro: { expr: 'rest' }, cycle: true },
];
const exprOf = (c, who) => KIT.expressions.find((e) => e.id === (c[who].expr ?? c.expr));
const recipe = (e) => [
    `eyes ${e.eyes === 'look' ? 'looking' : e.eyes}`,
    `mouth ${e.talks ? e.talks.join(', ') : e.mouth}`,
    ...(e.hand ? [`${e.hand} nub`] : []),
    ...(e.hold?.rotate ? [`tilt ${e.hold.rotate > 0 ? '' : '−'}${Math.abs(e.hold.rotate)}°`] : []),
    ...(e.hold?.sy ? [`${num((e.hold.sy - 1) * 100)} % taller`] : []),
].join(' · ');

const card = (c) => {
    if (c.cycle) {
        return `
    <article class="card" aria-labelledby="h-${c.expr}">
      <div class="cardhead"><h3 id="h-${c.expr}">${c.name}</h3></div>
      <div class="pair" data-card="${c.expr}" data-pomo="rest" data-doro="rest" data-pomo-side="left" data-doro-side="right"></div>
      <p>${c.note}</p>
      <p class="small" id="cycle-now">At rest</p>
    </article>`;
    }
    const p = exprOf(c, 'pomo');
    const d = exprOf(c, 'doro');
    const wp = weight('pomo', p, c.pomo.side);
    const wd = weight('doro', d, c.doro.side);
    return `
    <article class="card" aria-labelledby="h-${c.expr}">
      <div class="cardhead"><h3 id="h-${c.expr}">${c.name}</h3><button class="again" type="button" data-card="${c.expr}" aria-label="Play the change into ${c.name.toLowerCase()}">Play the change</button></div>
      <div class="pair" data-card="${c.expr}" data-pomo="${p.id}" data-doro="${d.id}" data-pomo-side="${c.pomo.side ?? 'right'}" data-doro-side="${c.doro.side ?? 'left'}"></div>
      <p>${c.note}</p>
      <p class="small">${recipe(p)}</p>
      <p class="small">Drawn at once: Pomo ${kb(wp.drawn)}, Doro ${kb(wd.drawn)}${wp.all !== wp.drawn ? `; with its frames ${kb(wp.all)} and ${kb(wd.all)}` : ''}. Budget 30 KB.</p>
    </article>`;
};

// ── The change, drawn to scale: height over the 280 ms, with the two face windows ────────────
function changeChart() {
    const W = 520, H = 190, L = 48, R = 16, T = 18, B = 58;
    const lo = 0.9, hi = 1.06;
    const x = (p) => L + p * (W - L - R);
    const y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);
    const smooth = (u) => u * u * (3 - 2 * u);
    const k = M.change.keys;
    const at = (p) => { for (let i = 1; i < k.length; i++) if (p <= k[i].at) return k[i - 1].sy + (k[i].sy - k[i - 1].sy) * smooth((p - k[i - 1].at) / (k[i].at - k[i - 1].at)); return 1; };
    const pts = Array.from({ length: 141 }, (_, i) => i / 140).map((p) => `${x(p).toFixed(1)},${y(at(p)).toFixed(1)}`).join(' ');
    const ms = (p) => `${num(p * M.change.totalMs)} ms`;
    const ticks = [0.9, 0.95, 1, 1.05].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="lab" text-anchor="end">${num(v * 100)} %</text>`).join('');
    const keysDots = k.map((kk) => `<circle cx="${x(kk.at)}" cy="${y(kk.sy)}" r="3.5" class="key"/><text x="${x(kk.at)}" y="${H - B + 16}" class="lab" text-anchor="middle">${ms(kk.at)}</text>`).join('');
    const band = (w, row, label, cls) => `<rect x="${x(w[0])}" y="${H - B + 24 + row * 15}" width="${x(w[1]) - x(w[0])}" height="10" rx="5" class="${cls}"/><text x="${x(w[1]) + 6}" y="${H - B + 33 + row * 15}" class="lab">${label} (${ms(w[0])} to ${ms(w[1])})</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Height through the change: down to 92 % at 70 ms, up to 104 % at 168 ms, back to 100 % at 280 ms. The old face fades out from 0 to 98 ms, the new one in from 56 to 154 ms.">
      ${ticks}<polyline points="${pts}" class="curve"/>${keysDots}
      ${band(M.change.faceOut, 0, 'old face out', 'out')}${band(M.change.faceIn, 1, 'new face in', 'in')}
    </svg>`;
}

// ── The kit, layer by layer ──────────────────────────────────────────────────────────────────
const thumb = (l, who) => {
    // A <use> of a symbol fills 100 % of the viewport unless sized, so each is pinned to the artboard.
    const use = (href, extra = '') => `<use href="#${href}" width="512" height="512"${extra}/>`;
    const base = /eyes|mouth/.test(l.id) ? use(`${who}-tour-body-cut`) + use(`${who}-tour-body-fill`) : '';
    const name = l.id.replace(`${who}-tour-`, '');
    const view = /eyes|mouth/.test(l.id) ? `${256 - 100} ${(who === 'pomo' ? 300 : 314) - 60} 200 120` : '0 0 512 512';
    // A hand is shown in place, between the body's edge and a faint fill; white layers on a darker ground.
    const drawing = l.id.includes('hand') ? use(`${who}-tour-body-cut`) + use(l.id) + use(`${who}-tour-body-fill`, ' opacity=".35"') : base + use(l.id);
    return `<figure class="thumb${/eyes|mouth/.test(l.id) ? '' : ' dark'}"><svg viewBox="${view}" aria-hidden="true">${drawing}</svg><figcaption>${name}<span>${num(l.bytes)} B</span></figcaption></figure>`;
};
const kitRow = (who) => `
      <div class="kitrow"><h3>${who === 'pomo' ? 'Pomo' : 'Doro'}</h3><div class="thumbs">${layers.filter((l) => l.id.startsWith(`${who}-`)).map((l) => thumb(l, who)).join('')}</div></div>`;

const body = `<title>Pomo &amp; Doro Pose Sheet</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: one diary column. The pair in the tour on a page-coloured stage, then every expression as a card (both characters), the motion's numbers, the kit layer by layer, small sizes, and the questions. Colours are the C1 tokens in both themes; the stickers keep their own fills. */
${baloo}
:root { ${tok(sm)}; --display: 'Baloo 2 C2', ui-rounded, system-ui, sans-serif; --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${tok(mp)}; color-scheme: dark; } }
:root[data-theme="dark"] { ${tok(mp)}; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.5 var(--ui); }
.wrap { max-width: 1080px; margin: 0 auto; padding-block: 32px 72px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 32px; }
h1 { font: 600 clamp(32px, 5vw, 44px)/1.05 var(--display); margin: 0; text-wrap: balance; }
h2 { font: 600 24px/1.15 var(--display); margin: 0; text-wrap: balance; }
h3 { font: 600 19px/1.15 var(--display); margin: 0; }
p { margin: 0; }
.lede { color: var(--inkSoft); max-width: 68ch; margin-top: 10px; }
section { display: grid; gap: 14px; min-width: 0; }
.controls { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; }
.seg { display: inline-flex; background: var(--field); border: 1.5px solid var(--edge); border-radius: 999px; padding: 3px; }
.seg button { font: 600 14px/1 var(--ui); border: 0; background: none; color: var(--inkSoft); padding: 10px 16px; min-height: 40px; border-radius: 999px; cursor: pointer; }
.seg button[aria-pressed="true"] { background: var(--paper); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--edgeStrong); }
.seg button:focus-visible, .again:focus-visible, .pill:focus-visible { outline: 3px solid var(--primaryInk); outline-offset: 2px; }
.label { color: var(--inkSoft); font-size: 13px; font-weight: 600; }
.stage { background: var(--page); border: 1.5px solid var(--edge); border-radius: 22px; padding: 20px 16px 8px; display: grid; justify-items: center; gap: 4px; overflow: hidden; }
.bubble { background: var(--paper); border: 1.5px solid var(--edge); border-radius: 22px; padding: 12px 16px; width: min(100%, 380px); min-height: 104px; position: relative; display: grid; gap: 4px; align-content: start; }
.bubble b { font-weight: 600; font-size: 15px; }
.bubble .line { font-size: 17px; line-height: 23px; min-height: 46px; }
.bubble .line .rest { color: transparent; }
.bubble::after { content: ""; position: absolute; bottom: -9px; width: 16px; height: 16px; background: var(--paper); border-right: 1.5px solid var(--edge); border-bottom: 1.5px solid var(--edge); transform: rotate(45deg); left: var(--tail, 30%); transition: left 200ms ease-out; }
.duo { display: flex; align-items: flex-end; justify-content: center; gap: 0; padding-top: 28px; }
.duo .who { display: grid; justify-items: center; }
.caption { color: var(--inkSoft); font-size: 13px; text-align: center; min-height: 20px; font-variant-numeric: tabular-nums; }
.stagebar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
.pill { font: 600 15px/1 var(--ui); border: 0; border-radius: 999px; padding: 12px 20px; min-height: 44px; background: var(--primary); color: var(--onPrimary); cursor: pointer; }
.pill.quiet { background: var(--paper); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--edge); }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
.card { background: var(--paper); border: 1.5px solid var(--edge); border-radius: 22px; padding: 16px; display: grid; gap: 8px; align-content: start; min-width: 0; }
.cardhead { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
.again { font: 600 13px/1 var(--ui); border: 1.5px solid var(--edgeStrong); border-radius: 999px; padding: 8px 12px; min-height: 36px; background: var(--paper); color: var(--ink); cursor: pointer; }
.pair { background: var(--page); border-radius: 14px; display: flex; align-items: flex-end; justify-content: center; gap: 6px; padding: 26px 8px 6px; cursor: pointer; overflow: hidden; }
.small { color: var(--inkSoft); font-size: 13px; font-variant-numeric: tabular-nums; }
.stk { display: block; }
.stk .lift { color: var(--lift); }
.stk .sl { opacity: var(--liftLayer); }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
.tablewrap { overflow-x: auto; background: var(--paper); border: 1.5px solid var(--edge); border-radius: 14px; }
th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--edge); }
tr:last-child td { border-bottom: 0; }
th { color: var(--inkSoft); font-size: 13px; font-weight: 600; }
td:first-child { font-weight: 600; white-space: nowrap; }
td { font-variant-numeric: tabular-nums; }
.chartwrap { background: var(--paper); border: 1.5px solid var(--edge); border-radius: 14px; padding: 12px; overflow-x: auto; }
.chart { width: 100%; min-width: 420px; height: auto; display: block; }
.chart .grid { stroke: var(--edge); stroke-width: 1; }
.chart .curve { fill: none; stroke: var(--ringFocus); stroke-width: 2.5; stroke-linejoin: round; }
.chart .key { fill: var(--paper); stroke: var(--ringFocus); stroke-width: 2; }
.chart .lab { fill: var(--inkSoft); font: 600 11px var(--ui); }
.chart .out { fill: var(--edgeStrong); }
.chart .in { fill: var(--successInk); }
.kitrow { display: grid; gap: 8px; }
.thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.thumb { margin: 0; background: var(--page); border: 1px solid var(--edge); border-radius: 14px; padding: 6px; display: grid; gap: 4px; }
.thumb svg { width: 100%; height: auto; aspect-ratio: 5 / 3; display: block; border-radius: 10px; }
.thumb.dark svg { background: var(--edgeStrong); }
.thumb figcaption { font-size: 11px; color: var(--inkSoft); display: flex; justify-content: space-between; gap: 4px; font-variant-numeric: tabular-nums; }
.order { margin: 0; padding-left: 22px; display: grid; gap: 4px; max-width: 72ch; }
.sizes { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-end; background: var(--page); border: 1.5px solid var(--edge); border-radius: 22px; padding: 24px 16px 12px; }
.sizes figure { margin: 0; display: grid; justify-items: center; gap: 6px; }
.sizes .row { display: flex; align-items: flex-end; gap: 2px; padding-top: 10px; }
.sizes figcaption { color: var(--inkSoft); font-size: 12px; }
.ask { background: var(--primarySoft); border-radius: 22px; padding: 20px; display: grid; gap: 10px; }
.ask ol { margin: 0; padding-left: 22px; display: grid; gap: 10px; max-width: 72ch; }
footer { color: var(--inkSoft); font-size: 13px; display: grid; gap: 6px; }
code { font-size: 12px; overflow-wrap: anywhere; }
</style>
${SYMBOLS}
<div class="wrap">
  <header>
    <h1>Pomo &amp; Doro, ready to show people around</h1>
    <p class="lede">Phase 1, D5. The new faces and gestures for the tutorial, drawn in VectorCraft on the shipped construction, and how they move. Each character is a small kit of layers (the body, a hand, the eyes, the mouth), so a blink swaps only the eyes, talking swaps only the mouth, and a new expression crosses in while the body squashes. Everything here runs on the real drawings. Nothing is in the app yet.</p>
  </header>

  <div class="controls" role="group" aria-label="View">
    <span class="label" id="l-theme">Page</span>
    <div class="seg" role="group" aria-labelledby="l-theme"><button type="button" id="t-light" aria-pressed="false">Strawberry Milk</button><button type="button" id="t-dark" aria-pressed="false">Midnight Plum</button></div>
    <span class="label" id="l-motion">Motion</span>
    <div class="seg" role="group" aria-labelledby="l-motion"><button type="button" id="m-full" aria-pressed="true">Full</button><button type="button" id="m-reduce" aria-pressed="false">Reduce Motion</button></div>
  </div>

  <section aria-labelledby="h-stage">
    <h2 id="h-stage">In the tour</h2>
    <p class="lede">At the contract's sizes: the speaker 190 pt, the listener 140 pt. The two lines are samples, not the tour's copy, writing on at ${num(1000 / M.talk.charMs, 1)} characters a second. The sound is on the voices page.</p>
    <div class="stage">
      <div class="bubble" id="bubble" aria-live="off"><b id="speaker">Pomo</b><div class="line" id="line"></div></div>
      <div class="duo"><div class="who" id="stage-pomo"></div><div class="who" id="stage-doro"></div></div>
      <p class="caption" id="caption"></p>
    </div>
    <div class="stagebar"><button class="pill quiet" type="button" id="replay">Play from the start</button><span class="small">The scene loops: a hello and a wave, a line each, then the other faces.</span></div>
  </section>

  <section aria-labelledby="h-faces">
    <h2 id="h-faces">Every expression</h2>
    <p class="lede">Each card plays its own motion. Tap a card, or Play the change, to see the pair change into it from rest. The cards follow the Page and Motion switches above.</p>
    <div class="cards">${CARDS.map(card).join('')}
    </div>
  </section>

  <section aria-labelledby="h-motion">
    <h2 id="h-motion">The motion</h2>
    <p class="lede">The numbers the build will use, as this page plays them. Every move is about the feet, the bottom of the die-cut edge, and keeps the area: when the height scales by s, the width scales by 1 / s.</p>
    <div class="tablewrap"><table>
      <thead><tr><th scope="col">Motion</th><th scope="col">How</th><th scope="col">Under Reduce Motion</th></tr></thead>
      <tbody>
        <tr><td>Blink</td><td>Eyes closed for ${M.blink.closedMs} ms, every ${num(M.blink.intervalMs[0] / 1000, 1)} to ${num(M.blink.intervalMs[1] / 1000, 1)} s at random; one blink in ${num(1 / M.blink.doubleChance)} is a double, ${M.blink.doubleGapMs} ms apart. Only on open-eyed faces, never mid-change.</td><td>None</td></tr>
        <tr><td>Talking</td><td>The line writes on at one character every ${M.talk.charMs} ms (${num(1000 / M.talk.charMs, 1)} a second), pausing ${M.talk.pauseMs.comma} ms after a comma and ${M.talk.pauseMs.stop} ms after a stop inside the line. A babble syllable starts on every ${M.talk.lettersPerSyllable.pomo}rd letter for Pomo and every ${M.talk.lettersPerSyllable.doro}th for Doro, and the mouth opens for the first ${num(M.talk.openShare * 100)} % of each syllable's slot in one of three shapes, never the same twice running; the smile between.</td><td>The mouth stays on the face's own smile</td></tr>
        <tr><td>A change</td><td>${M.change.totalMs} ms: the height dips to ${num(M.change.keys[1].sy * 100)} % at ${num(M.change.keys[1].at * M.change.totalMs)} ms, rises to ${num(M.change.keys[2].sy * 100)} % at ${num(M.change.keys[2].at * M.change.totalMs)} ms and settles at ${M.change.totalMs} ms, easing in and out between the keys. The old face fades out as the new one fades in, crossing at the bottom of the squash. A held tilt or stretch eases in over ${M.hold.ms} ms.</td><td>An instant swap, the held tilt or stretch at once</td></tr>
        <tr><td>Breath</td><td>Height ±${num(M.breath.amplitude * 100, 1)} % on a sine, Pomo every ${num(M.breath.periodMs.pomo / 1000, 1)} s and Doro every ${num(M.breath.periodMs.doro / 1000, 1)} s, so they never breathe in step; half as much while talking.</td><td>None</td></tr>
        <tr><td>Wave</td><td>The nub grows from its root over the change, then turns about the root between ${M.wave.degrees[0]}° and +${M.wave.degrees[1]}°, ${num(M.wave.cycles, 1)} swings of ${M.wave.periodMs} ms, and comes home.</td><td>The nub is there, still</td></tr>
        <tr><td>Point</td><td>The nub grows out, then nudges ${M.point.nudgeUnits} units along its own line and back over ${M.point.nudgeMs} ms.</td><td>The nub is there, still</td></tr>
      </tbody>
    </table></div>
    <div class="chartwrap">${changeChart()}</div>
  </section>

  <section aria-labelledby="h-kit">
    <h2 id="h-kit">The kit</h2>
    <p class="lede">${layers.length} layers, ${layers.length / 2} per character, all on the shipped 512 artboard, so they stack exactly. The body is the shipped silhouette with its face taken off; every face sits on the C3 grid (Doro's is Pomo's scaled by 13.7 / 12.3, as the shipped faces are). Each layer is ${num(Math.min(...layers.map((l) => l.bytes)))} to ${num(Math.max(...layers.map((l) => l.bytes)))} bytes, and the heaviest expression with all its frames is ${kb(heaviest)}, against 30 KB.</p>
    <ol class="order">
      <li><b>The die-cut edge</b> (white), which carries the lift.</li>
      <li><b>A hand</b>, only for a wave or a point: a nub in the body's colour with its own edge.</li>
      <li><b>The fill</b> and the cheeks. Drawn over the hand, it hides the hand's root, so the nub grows out of the body inside one edge.</li>
      <li><b>The eyes</b>, then <b>the mouth</b>.</li>
    </ol>
    <p class="small">The feet (the transform origin) are at (${KIT.feet.pomo.join(', ')}) for Pomo and (${KIT.feet.doro.join(', ')}) for Doro. Every drawing stays inside the artboard: the outermost points of all ${layers.length} layers span x ${num(reach[0])} to ${num(reach[2])} and y ${num(reach[1])} to ${num(reach[3])} of 0 to 512. Squash, breath and tilt are transforms of the whole sticker, which don't clip.</p>
    ${kitRow('pomo')}
    ${kitRow('doro')}
  </section>

  <section aria-labelledby="h-small">
    <h2 id="h-small">Small</h2>
    <p class="lede">At larger text sizes the pair shrink to a badge beside the speaker's name. The faces at 64 pt and at 44 pt.</p>
    <div class="sizes" id="sizes"></div>
  </section>

  <section class="ask" aria-labelledby="h-ask">
    <h2 id="h-ask">For you to decide</h2>
    <ol>
      <li><b>The hands.</b> C3 drew Pomo &amp; Doro with no limbs. A wave and a point need something, so this kit adds a small nub in the body's colour that grows out only for those two gestures and goes away after. Keep the nubs? The limb-free way would be a lean towards the control and the eyes looking at it, with the ribbon doing all the pointing.</li>
      <li><b>The faces.</b> Is each expression right, or should any be redrawn: softer, bigger, a different eye or mouth?</li>
      <li><b>The motion.</b> Does the squash on each change, the blink and the breath feel right, or too much, or too little?</li>
    </ol>
  </section>

  <footer>
    <p>Sources: <code>node scripts/art/tour-sources.mjs</code> writes the ${layers.length} layer sources (<code>art/src/tour/</code>) and the recipes and motion (<code>art/src/tour/expressions.json</code>); <code>node scripts/art/build.mjs</code> builds each through VectorCraft into <code>art/out/illustration/</code>, and <code>--check</code> rebuilds them byte for byte. This page is <code>node scripts/art/review-d5-poses.mjs</code>.</p>
  </footer>
</div>
<script>
const KIT = ${JSON.stringify(KIT)};
${read('scripts/art/tour-motion.js')}
</script>
<script>
(() => {
  const T = window.TourMotion;
  const root = document.documentElement;

  // ── The switches ──
  const themeButtons = { light: document.getElementById('t-light'), dark: document.getElementById('t-dark') };
  const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  function showTheme() {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : systemDark();
    themeButtons.light.setAttribute('aria-pressed', String(!dark));
    themeButtons.dark.setAttribute('aria-pressed', String(dark));
  }
  themeButtons.light.addEventListener('click', () => { root.dataset.theme = 'light'; showTheme(); });
  themeButtons.dark.addEventListener('click', () => { root.dataset.theme = 'dark'; showTheme(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', showTheme);
  showTheme();

  const motionButtons = { full: document.getElementById('m-full'), reduce: document.getElementById('m-reduce') };
  function setReduce(v) {
    T.reduce = v;
    motionButtons.full.setAttribute('aria-pressed', String(!v));
    motionButtons.reduce.setAttribute('aria-pressed', String(v));
  }
  motionButtons.full.addEventListener('click', () => setReduce(false));
  motionButtons.reduce.addEventListener('click', () => setReduce(true));
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  setReduce(rm.matches);
  rm.addEventListener?.('change', () => setReduce(rm.matches));

  // ── The stage ──
  const pomo = T.create('pomo', 190, { expr: 'rest' });
  const doro = T.create('doro', 140, { expr: 'rest' });
  document.getElementById('stage-pomo').appendChild(pomo.svg);
  document.getElementById('stage-doro').appendChild(doro.svg);
  // The pair stand on one line: the feet sit (512 − feet y) / 512 of each box above its bottom.
  pomo.svg.style.marginBottom = (-(512 - KIT.feet.pomo[1]) / 512 * 190) + 'px';
  doro.svg.style.marginBottom = (-(512 - KIT.feet.doro[1]) / 512 * 140) + 'px';
  doro.svg.style.marginLeft = '-14px';
  const lineEl = document.getElementById('line');
  const speakerEl = document.getElementById('speaker');
  const bubble = document.getElementById('bubble');
  const caption = document.getElementById('caption');
  const LINES = {
    pomo: "Hi! We're Pomo and Doro, and we'll show you around the diary.",
    doro: "Every focus you finish puts a sticker on today's page. Shall we look?",
  };
  const NAMES = Object.fromEntries(KIT.expressions.map((e) => [e.id, e.title.replace(/ \\(.*\\)$/, '').toLowerCase()]));
  // The scene: each beat sets both faces, and lasts its hold or its line plus a pause.
  const BEATS = [
    { pomo: 'rest', doro: 'rest', hold: 700 },
    { pomo: ['wave', 'left'], doro: 'happy', hold: 1700 },
    { pomo: 'talking', doro: 'listening-left', say: 'pomo', after: 600 },
    { pomo: 'happy', doro: 'excited', hold: 1100 },
    { pomo: 'listening-right', doro: 'talking', say: 'doro', after: 600 },
    { pomo: 'curious', doro: 'wink', hold: 1300 },
    { pomo: 'surprised', doro: ['point', 'right'], hold: 1500 },
    { pomo: 'proud', doro: 'proud', hold: 1500 },
  ];
  let beat = -1;
  let beatEnds = 0;
  let writing = null;
  function startBeat(i, now) {
    beat = i % BEATS.length;
    const b = BEATS[beat];
    for (const [who, s] of [['pomo', pomo], ['doro', doro]]) {
      const [id, side] = Array.isArray(b[who]) ? b[who] : [b[who]];
      T.set(s, id, { side, now, animate: true });
    }
    if (b.say) {
      const s = b.say === 'pomo' ? pomo : doro;
      const w = T.say(s, LINES[b.say], now);
      writing = { text: LINES[b.say], chars: w.chars, start: now };
      speakerEl.textContent = b.say === 'pomo' ? 'Pomo' : 'Doro';
      bubble.style.setProperty('--tail', b.say === 'pomo' ? '34%' : '62%');
      beatEnds = now + w.length + b.after;
    } else {
      beatEnds = now + b.hold;
    }
    caption.textContent = 'Pomo ' + NAMES[pomo.expr] + ' · Doro ' + NAMES[doro.expr];
  }
  T.onFrame((now) => {
    if (beat < 0 || now >= beatEnds) startBeat(beat + 1, now);
    if (writing) {
      const shown = T.reduce ? writing.text.length : writing.chars.filter((t) => now - writing.start >= t).length;
      const text = [...writing.text];
      lineEl.innerHTML = '';
      lineEl.append(text.slice(0, shown).join(''));
      const rest = document.createElement('span');
      rest.className = 'rest';
      rest.textContent = text.slice(shown).join('');
      lineEl.append(rest);
      if (shown >= text.length) writing = null;
    }
  });
  document.getElementById('replay').addEventListener('click', () => { beat = -1; beatEnds = 0; });

  // ── The cards ──
  const cards = [...document.querySelectorAll('.pair')].map((el) => {
    const sides = { pomo: el.dataset.pomoSide, doro: el.dataset.doroSide };
    const make = (who, px) => {
      const s = T.create(who, px, { expr: 'rest', side: sides[who], repeat: 3400 });
      s.svg.style.marginBottom = (-(512 - KIT.feet[who][1]) / 512 * px) + 'px';
      el.appendChild(s.svg);
      return s;
    };
    const c = { el, target: { pomo: el.dataset.pomo, doro: el.dataset.doro }, sides, pomo: make('pomo', 128), doro: make('doro', 112), id: el.dataset.card };
    c.play = (now) => {
      // From rest, or into rest from the happy face.
      const from = c.target.pomo === 'rest' ? 'happy' : 'rest';
      for (const who of ['pomo', 'doro']) {
        T.set(c[who], from, { now: now - 1e6, animate: false });
        T.set(c[who], c.target[who], { side: c.sides[who], now, animate: true });
      }
      if (c.id === 'talking') { T.say(c.pomo, 'Hello hello, this is how I talk!', now); T.say(c.doro, 'And this is how I talk, more slowly.', now); }
    };
    return c;
  });
  const start = performance.now();
  cards.forEach((c) => c.play(start));
  cards.forEach((c) => {
    if (c.id === 'cycle') return;
    c.el.addEventListener('click', () => c.play(performance.now()));
    document.querySelector('.again[data-card="' + c.id + '"]').addEventListener('click', () => c.play(performance.now()));
  });
  // The cycling card: every expression in turn (each listening side once), a change every 1.6 s.
  const cycler = cards.find((c) => c.id === 'cycle');
  const ORDER = ['happy', 'excited', 'curious', 'proud', 'wink', 'surprised', ['wave', 'left', 'right'], ['point', 'left', 'right'], 'rest'];
  const nowEl = document.getElementById('cycle-now');
  let step = 0;
  let nextAt = performance.now() + 1600;
  T.onFrame((now) => {
    if (now < nextAt) return;
    const o = ORDER[step % ORDER.length];
    const [id, ps, ds] = Array.isArray(o) ? o : [o];
    T.set(cycler.pomo, id, { side: ps, now });
    T.set(cycler.doro, id, { side: ds, now });
    nowEl.textContent = NAMES[id].charAt(0).toUpperCase() + NAMES[id].slice(1);
    step++;
    nextAt = now + 1600;
  });
  // The talking card keeps talking.
  const talker = cards.find((c) => c.id === 'talking');
  T.onFrame((now) => {
    for (const s of [talker.pomo, talker.doro]) {
      if (s.expr === 'talking' && (!s.talk || now - s.talk.start > s.talk.length + 700)) {
        T.say(s, s.who === 'pomo' ? 'Hello hello, this is how I talk!' : 'And this is how I talk, more slowly.', now);
      }
    }
  });

  // ── Small sizes ──
  const sizes = document.getElementById('sizes');
  for (const px of [64, 44]) {
    for (const expr of ['rest', 'talking', 'happy', 'surprised']) {
      const fig = document.createElement('figure');
      const row = document.createElement('div');
      row.className = 'row';
      const p = T.create('pomo', px, { expr });
      const d = T.create('doro', Math.round(px * 0.88), { expr });
      for (const [s, who] of [[p, 'pomo'], [d, 'doro']]) { s.svg.style.marginBottom = (-(512 - KIT.feet[who][1]) / 512 * s.px) + 'px'; row.appendChild(s.svg); }
      if (expr === 'talking') { const loop = (now) => { for (const s of [p, d]) if (!s.talk || now - s.talk.start > s.talk.length + 500) T.say(s, 'Hello hello, this is a line.', now); }; T.onFrame(loop); }
      const cap = document.createElement('figcaption');
      cap.textContent = px + ' pt, ' + NAMES[expr];
      fig.append(row, cap);
      sizes.appendChild(fig);
    }
  }
})();
</script>
`;

const fragmentAt = process.argv.indexOf('--fragment');
if (fragmentAt !== -1) {
    fs.writeFileSync(process.argv[fragmentAt + 1], body);
} else {
    const out = path.join(ROOT, 'art/review/d5-pose-sheet.html');
    fs.writeFileSync(out, '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style></head><body>') + '</body></html>\n');
    console.log(`wrote ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);
}
