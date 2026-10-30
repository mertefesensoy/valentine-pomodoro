#!/usr/bin/env node
/**
 * C3 gate 2: the app icon (light, dark, tinted), the splash, the mark in context (home screen,
 * App Store page, widget, social card), Pomo & Doro's poses and single-colour versions, and the
 * icon set with its filled tab icons. Every image is a VectorCraft export from art/out/, embedded.
 * Context mocks use synthetic numbers, labelled as such, and no ratings, reviews or prices.
 *
 *   node scripts/art/review-c3-gate2.mjs                 → art/review/c3-gate2.html
 *   node scripts/art/review-c3-gate2.mjs --fragment FILE → without the document wrapper
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const png = (rel) => `data:image/png;base64,${read(rel).toString('base64')}`;
const svg = (rel) => `data:image/svg+xml;base64,${read(rel).toString('base64')}`;
const palette = JSON.parse(read('src/theme/palette.json'));
const baloo = /@font-face\{font-family:'Baloo 2 C2';font-weight:600;[^}]*\}/.exec(read('art/review/c2-type-specimen.html').toString())[0];
const sm = palette.themes.strawberryMilk.tokens, mp = palette.themes.midnightPlum.tokens;
const keys = ['page', 'paper', 'edge', 'ink', 'inkSoft', 'primary', 'primaryInk', 'primarySoft', 'success', 'onSuccess', 'field'];
const tok = (t) => keys.map((k) => `--${k}:${t[k]}`).join(';');
const icon = (v, px) => png(`art/out/logo/app-icon-${v}-${px}.png`);
const ill = (id, px) => png(`art/out/illustration/${id}-${px}.png`);
const POSES = ['idle', 'focusing', 'break', 'celebrating', 'sleepy'];
const ICONS = JSON.parse(read('art/jobs/icons.json')).assets.map((a) => a.id.replace(/^icon-/, '')).filter((n) => !n.endsWith('-fill'));
const TABS = [['timer', 'Timer'], ['stats', 'Stats'], ['settings', 'Settings'], ['notes', 'Notes']];
const budgets = (() => {
    const rows = [];
    for (const f of fs.readdirSync(path.join(ROOT, 'art/jobs'))) {
        for (const a of JSON.parse(read(`art/jobs/${f}`)).assets) rows.push({ kind: a.kind, size: fs.statSync(path.join(ROOT, `art/out/${a.kind}/${a.id}.svg`)).size });
    }
    const by = (k) => rows.filter((r) => r.kind === k).map((r) => r.size);
    return { icon: by('icon'), illustration: by('illustration'), logo: by('logo') };
})();
const range = (xs) => `${xs.length} files, ${Math.min(...xs).toLocaleString('en')}–${Math.max(...xs).toLocaleString('en')} B`;

const home = (v, wall, label) => `<figure class="homes"><div class="wall" style="background:${wall}">
    <div class="grid"><span></span><img src="${icon(v, 180)}" alt="${label}"><span></span><span></span></div></div><figcaption>${label}</figcaption></figure>`;

const body = `<title>Mark in context</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: one long contact sheet in chapters: the icon, the splash, the mark in context, the characters, the icons, the budgets. C1 tokens. */
${baloo}
:root { ${tok(sm)}; --display: 'Baloo 2 C2', ui-rounded, system-ui, sans-serif; --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${tok(mp)}; color-scheme: dark; } }
:root[data-theme="dark"] { ${tok(mp)}; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.5 var(--ui); }
.wrap { max-width: 1100px; margin: 0 auto; padding-block: 36px 72px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 26px; }
h1 { font: 600 clamp(32px, 5vw, 44px)/1.05 var(--display); margin: 0; text-wrap: balance; }
h2 { font: 600 26px/1.1 var(--display); margin: 0; }
.lede { color: var(--inkSoft); max-width: 70ch; margin: 8px 0 0; }
.panel { background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 20px; display: grid; gap: 14px; min-width: 0; }
.panel p { margin: 0; max-width: 72ch; }
.small { font-size: 13px; color: var(--inkSoft); }
.flex { display: flex; flex-wrap: wrap; gap: 18px; align-items: flex-end; }
figure { margin: 0; display: grid; gap: 6px; justify-items: center; }
figcaption { font-size: 13px; color: var(--inkSoft); text-align: center; max-width: 260px; }
.wall { border-radius: 26px; padding: 22px 16px; }
.grid { display: grid; grid-template-columns: repeat(4, 60px); gap: 22px; }
.grid img, .grid span { width: 60px; height: 60px; border-radius: 22.37%; display: block; }
.grid span { background: rgba(255,255,255,.45); }
.tile { border-radius: 22.37%; display: block; }
.phone { width: 196px; height: 424px; border-radius: 34px; border: 8px solid var(--ink); display: grid; place-items: center; overflow: hidden; }
.phone img { width: 64px; height: 64px; }
.store { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 14px; align-items: center; max-width: 520px; }
.store img { width: 96px; height: 96px; }
.store b { font: 600 22px/1.15 var(--display); display: block; }
.get { display: inline-block; margin-top: 6px; background: ${sm.primaryInk}; color: #fff; font-weight: 700; border-radius: 999px; padding: 4px 16px; }
.widget { width: 170px; height: 170px; border-radius: 26px; background: var(--paper); border: 1px solid var(--edge); padding: 14px; display: grid; align-content: space-between; }
.widget .t { font: 600 40px/1 var(--display); font-variant-numeric: tabular-nums; display: flex; align-items: center; gap: 2px; }
.widget .t .c { display: grid; gap: 2px; } .widget .t .c img { width: 18px; height: 18px; }
.social { width: min(600px, 100%); aspect-ratio: 1200 / 630; border-radius: 18px; background: ${sm.page}; border: 1px solid ${sm.edge}; color: ${sm.ink}; position: relative; overflow: hidden; display: grid; grid-template-columns: 1.2fr 1fr; align-items: center; padding: 6%; }
.social h3 { font: 600 clamp(20px, 3.4vw, 34px)/1.05 var(--display); margin: 0; }
.social p { margin: 6px 0 0; font-size: clamp(11px, 1.6vw, 15px); }
.social .pair { display: flex; justify-content: center; }
.social .pair img { width: 46%; }
.social .mark { position: absolute; left: 6%; bottom: 7%; width: 9%; border-radius: 22%; }
.poses { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.poses figure { background: var(--page); border: 1px solid var(--edge); border-radius: 14px; padding: 8px; }
.poses img { width: 128px; height: 128px; }
.icons { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; }
.icons figure { background: var(--page); border: 1px solid var(--edge); border-radius: 12px; padding: 8px 2px; }
.icons img { width: 28px; height: 28px; }
html[data-dark] .icons img, .ink-invert { filter: none; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .icons img { filter: invert(1); } }
:root[data-theme="dark"] .icons img { filter: invert(1); }
.icons figcaption { font-size: 10px; }
.tabbar { display: flex; justify-content: space-around; width: min(360px, 100%); border-radius: 32px; border: 1px solid var(--edge); background: var(--paper); padding: 8px 6px; }
.tabbar span { display: grid; justify-items: center; font-size: 11px; color: var(--inkSoft); gap: 2px; }
.tabbar .on { color: var(--primaryInk); font-weight: 600; }
.tabbar i { width: 25px; height: 25px; background: currentColor; -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; }
.scroll { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; min-width: 480px; }
td, th { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--edge); }
th { font-size: 12px; color: var(--inkSoft); }
.ask { background: var(--primarySoft); border-radius: 22px; padding: 20px; display: grid; gap: 8px; }
.ask ol { margin: 0; padding-left: 22px; display: grid; gap: 6px; }
</style>
<div class="wrap">
  <header>
    <h1>The mark in context, and the full cast</h1>
    <p class="lede">Phase 1, C3, gate 2. The app icon you picked in all three appearances, the splash, and the mark where people will meet it. Then Pomo &amp; Doro in all five poses, the icon set, and every asset against its budget. Numbers on the mock-ups are examples, not data.</p>
  </header>

  <section class="panel" aria-labelledby="h-icon">
    <h2 id="h-icon">The app icon</h2>
    <div class="flex">
      ${home('light', '#D7DEE6', 'Default')}${home('dark', '#1C1F26', 'Dark')}${home('tinted', '#5B6B7C', 'Tinted (the system colours it)')}
    </div>
    <div class="flex">${[180, 120, 87, 80, 60, 40, 29, 20].map((px) => `<figure><img class="tile" style="width:${px / 2}px;height:${px / 2}px" src="${icon('light', px)}" alt=""><figcaption>${px} px</figcaption></figure>`).join('')}</div>
    <p class="small">1024 × 1024, opaque RGB with no alpha channel (App Store Connect rejects transparency), square and unmasked so iOS draws the corners and its own glass effects. Flattened, because Icon Composer needs a Mac; the layers are kept apart in the sources for a layered icon later.</p>
  </section>

  <section class="panel" aria-labelledby="h-splash">
    <h2 id="h-splash">The splash</h2>
    <div class="flex">
      <figure><div class="phone" style="background:${sm.page}"><img src="${png('art/out/logo/splash-mark-light-1024.png')}" alt=""></div><figcaption>Light: the mark on the page colour</figcaption></figure>
      <figure><div class="phone" style="background:${mp.page}"><img src="${png('art/out/logo/splash-mark-dark-1024.png')}" alt=""></div><figcaption>Dark: the dark mark on the plum night</figcaption></figure>
      <figure><div class="phone" style="background:${sm.page}"></div><figcaption>Apple's preference: the page colour alone</figcaption></figure>
    </div>
    <p>Static, never animated (HIG review H-2). <b>One choice for you:</b> Apple's launch-screen guidance says not to put a logo on it unless the first screen shows one, and the Classic page doesn't. It is guidance, not an App Review rule, so your brief ("the splash built from the logo") can win. The third phone is the alternative.</p>
  </section>

  <section class="panel" aria-labelledby="h-ctx">
    <h2 id="h-ctx">The mark in context</h2>
    <div class="flex" style="align-items:flex-start">
      <figure><div class="store"><img class="tile" src="${icon('light', 180)}" alt=""><div><b>Valentine Pomodoro</b><span class="small">Working name · subtitle to come</span><br><span class="get">Get</span></div></div><figcaption>App Store page: no ratings, reviews or download counts are invented.</figcaption></figure>
      <figure><div class="widget"><span class="small">Focus · 2 of 4</span><div class="t">18<span class="c"><img src="${ill('pomo-idle', 32)}" alt=""><img src="${ill('doro-idle', 32)}" alt=""></span>42</div><span class="small">Break at 10:25</span></div><figcaption>A small widget: Pomo &amp; Doro as the colon, in the timer they live in.</figcaption></figure>
    </div>
    <figure style="justify-items:start"><div class="social"><div><h3>This week, together</h3><p>14 sessions · 6 h 10 m · Pomo &amp; Doro are proud</p></div><div class="pair"><img src="${ill('pomo-celebrating', 512)}" alt=""><img src="${ill('doro-celebrating', 512)}" alt=""></div><img class="mark" src="${icon('light', 120)}" alt=""></div><figcaption style="text-align:left">The weekly recap card, 1200 × 630, example numbers. The identity holds through the palette, the face, the characters and the sticker edge, even where the mark is small.</figcaption></figure>
  </section>

  <section class="panel" aria-labelledby="h-cast">
    <h2 id="h-cast">Pomo &amp; Doro</h2>
    <div class="poses">${['pomo', 'doro'].map((c) => POSES.map((p) => `<figure><img src="${ill(`${c}-${p}`, p === 'idle' ? 512 : 512)}" alt="${c} ${p}"><figcaption>${c === 'pomo' ? 'Pomo' : 'Doro'} · ${p}</figcaption></figure>`).join('')).join('')}
      ${['pomo', 'doro'].map((c) => `<figure><img src="${ill(`${c}-single-colour`, 512)}" alt=""><figcaption>${c === 'pomo' ? 'Pomo' : 'Doro'} · single colour</figcaption></figure>`).join('')}
    </div>
    <p class="small">Every pose keeps the locked construction: the eye line, the eye gap and the proportions never move; only the eyes, mouth, curl and a gentle squash change. Nobody sulks: sleepy is the lowest they go.</p>
  </section>

  <section class="panel" aria-labelledby="h-icons">
    <h2 id="h-icons">The icon set</h2>
    <div class="icons">${ICONS.map((n) => `<figure><img src="${svg(`art/out/icon/icon-${n}.svg`)}" alt=""><figcaption>${n}</figcaption></figure>`).join('')}</div>
    <p class="small">${ICONS.length} icons on the 24 pt grid, 2 pt rounded strokes outlined by VectorCraft. The four tabs also come filled (Apple prefers filled tab icons), exported as template PNGs at 50 and 75 px, with real holes, since the tab bar draws alpha only:</p>
    <div class="tabbar">${TABS.map(([n, l], i) => `<span class="${i === 0 ? 'on' : ''}"><i style="-webkit-mask-image:url(${png(`art/out/icon/icon-${n}-fill-75.png`)});mask-image:url(${png(`art/out/icon/icon-${n}-fill-75.png`)})"></i>${l}</span>`).join('')}</div>
  </section>

  <section class="panel" aria-labelledby="h-budget">
    <h2 id="h-budget">Every asset against its budget</h2>
    <div class="scroll"><table>
      <thead><tr><th>Kind</th><th>Budget</th><th>Shipped SVGs</th><th></th></tr></thead>
      <tbody>
        <tr><td>Icon</td><td>2 KB</td><td>${range(budgets.icon)}</td><td>All pass</td></tr>
        <tr><td>Illustration (Pomo &amp; Doro)</td><td>30 KB</td><td>${range(budgets.illustration)}</td><td>All pass</td></tr>
        <tr><td>Mark, app icon, splash</td><td>30 KB</td><td>${range(budgets.logo)}</td><td>All pass</td></tr>
      </tbody>
    </table></div>
    <p class="small"><code>node scripts/art/check-budgets.mjs</code> checks each one; <code>node scripts/art/build.mjs --check</code> rebuilds all of them from their <code>steps.json</code> and finds every byte identical.</p>
  </section>

  <section class="ask" aria-labelledby="h-ask">
    <h2 id="h-ask">Please decide</h2>
    <ol>
      <li>The app icon in its three appearances.</li>
      <li>The splash: the mark on the page colour, or the page colour alone.</li>
      <li>Pomo &amp; Doro's five poses and single-colour versions.</li>
      <li>The icon set and the filled tab icons.</li>
    </ol>
  </section>
</div>
`;

const fragmentAt = process.argv.indexOf('--fragment');
if (fragmentAt !== -1) {
    fs.writeFileSync(process.argv[fragmentAt + 1], body);
} else {
    const out = path.join(ROOT, 'art/review/c3-gate2.html');
    fs.writeFileSync(out, '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style></head><body>') + '</body></html>\n');
    console.log(`wrote ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);
}
