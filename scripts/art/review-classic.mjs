#!/usr/bin/env node
/**
 * The C4 gate page: the two Classic layouts at phone size (the decision sketches, inlined as
 * srcdoc frames), the brief's decisions, the HIG review and the questions for the owner.
 *
 *   node scripts/art/review-classic.mjs                 → art/review/c4-classic-gate.html
 *   node scripts/art/review-classic.mjs --fragment FILE → the same page without the document wrapper
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const palette = JSON.parse(read('src/theme/palette.json'));
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const baloo = /@font-face\{font-family:'Baloo 2 C2';font-weight:600;[^}]*\}/.exec(read('art/review/c2-type-specimen.html'))[0];
const sm = palette.themes.strawberryMilk.tokens, mp = palette.themes.midnightPlum.tokens;
const keys = ['page', 'paper', 'edge', 'ink', 'inkSoft', 'primary', 'primaryInk', 'primarySoft', 'success', 'onSuccess', 'field'];
const tok = (t) => keys.map((k) => `--${k}:${t[k]}`).join(';');

const phone = (file, label, note) => `
  <figure class="phone">
    <div class="screen"><iframe title="${label}" srcdoc="${attr(read(file))}" loading="lazy" scrolling="no"></iframe></div>
    <figcaption><b>${label}</b>${note}</figcaption>
  </figure>`;

const HIG = [
    ['H-1', 'High', 'The selected tab is system blue today; it becomes strawberry (primaryInk), the one brand colour on the bar.'],
    ['H-2', 'High', 'Your pages-to-logo animation must not play on every launch (Apple: no branding on the launch screen). It plays in onboarding, the first pairing or the weekly recap.'],
    ['M-1', 'Medium', 'Layouts follow the space available (size classes), not "iPad" or "landscape".'],
    ['M-2', 'Medium', 'VoiceOver reads Facing Pages in a fixed order: phase, timer, your page, your partner’s page, today, controls.'],
    ['M-3', 'Medium', 'Spoken labels: "Modes" for the mode button, "25 minutes focus, 5 minutes break" for each preset.'],
    ['M-4', 'Medium', 'The four tab icons get filled versions of the custom set; Apple prefers filled tab icons.'],
    ['M-5', 'Medium', 'The controls sit above the floating tab bar by its real height plus the home-indicator area.'],
    ['L-1..4', 'Low', 'One time line under the timer ("Break at 10:25"); the press feedback stays; button capitalisation is your call; the unused expo-blur package is noted.'],
];

const body = `<title>Classic gate</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: the two layouts side by side as phones, then the decisions and the review as one paper column. Colours are the C1 tokens. */
${baloo}
:root { ${tok(sm)}; --display: 'Baloo 2 C2', ui-rounded, system-ui, sans-serif; --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${tok(mp)}; color-scheme: dark; } }
:root[data-theme="dark"] { ${tok(mp)}; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.5 var(--ui); }
.wrap { max-width: 1080px; margin: 0 auto; padding-block: 36px 72px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 26px; }
h1 { font: 600 clamp(32px, 5vw, 44px)/1.05 var(--display); margin: 0; text-wrap: balance; }
h2 { font: 600 24px/1.15 var(--display); margin: 0; }
.lede { color: var(--inkSoft); max-width: 68ch; margin: 10px 0 0; }
.phones { display: flex; flex-wrap: wrap; gap: 28px; justify-content: center; }
.phone { margin: 0; display: grid; gap: 10px; justify-items: center; }
.screen { width: 300px; height: 649px; border-radius: 44px; overflow: hidden; border: 10px solid var(--ink); background: #fff; max-width: 100%; }
.screen iframe { width: 390px; height: 844px; border: 0; transform: scale(0.7179); transform-origin: 0 0; display: block; }
.phone figcaption { text-align: center; max-width: 300px; color: var(--inkSoft); font-size: 14px; }
.phone figcaption b { display: block; color: var(--ink); font: 600 20px/1.2 var(--display); }
.panel { background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 20px; display: grid; gap: 12px; min-width: 0; }
.panel ul { margin: 0; padding-left: 20px; display: grid; gap: 6px; }
.panel li, .panel p { max-width: 72ch; margin: 0; }
.scroll { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; min-width: 520px; }
td, th { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--edge); vertical-align: top; }
th { font-size: 12px; color: var(--inkSoft); }
.sev { font-weight: 700; white-space: nowrap; }
.ok { display: inline-block; background: var(--success); color: var(--onSuccess); border-radius: 999px; padding: 2px 10px; font-weight: 600; font-size: 13px; }
.ask { background: var(--primarySoft); border-radius: 22px; padding: 20px; display: grid; gap: 10px; }
.ask ol { margin: 0; padding-left: 22px; display: grid; gap: 8px; }
footer { color: var(--inkSoft); font-size: 13px; }
</style>
<div class="wrap">
  <header>
    <h1>Classic: the focus page</h1>
    <p class="lede">Phase 1, C4. Your choice: two layouts on one set of parts, The Ring by default and Facing Pages as the alternative. In both, the partner slot holds Pomo &amp; Doro in v1.4 and your partner in Phase 3, with nothing moving. The sketches show a running focus session; the brief, under it, covers every state.</p>
  </header>

  <div class="phones">
    ${phone('art/review/c4-classic-ring.html', 'The Ring', 'Default. The partner slot is the strip under the ring.')}
    ${phone('art/review/c4-classic-facing-pages.html', 'Facing Pages', 'The alternative. The partner slot is the right-hand page.')}
  </div>

  <section class="panel" aria-labelledby="h-brief">
    <h2 id="h-brief">What the brief decides</h2>
    <ul>
      <li><b>One large thing:</b> the timer, in Baloo 2 with steady digits. Everything else stays small and quiet while you focus.</li>
      <li><b>Thumb reach:</b> Start, Pause or Resume as the one strawberry pill; Skip beside it. Ending early is offered only while paused, and it asks first.</li>
      <li><b>Today's stickers</b> fill a row under the partner slot. Finishing a session presses its sticker onto that row: the one bouncy moment on this page.</li>
      <li><b>The presets</b> (25/5, 50/10, 52/17, 90/20) sit under the timer while nothing runs, then fold away.</li>
      <li><b>The mode button</b> opens a sheet of modes; under Classic you choose The Ring or Facing Pages. Settings has the same choice. Existing users keep The Ring.</li>
      <li><b>Love note and goal:</b> after a session the love note arrives in a small sheet, and "goal reached" appears inline on today's row. The ad policy is unchanged and never interrupts a session.</li>
      <li><b>At very large text sizes,</b> Facing Pages stacks its pages; nothing is cut off.</li>
    </ul>
  </section>

  <section class="panel" aria-labelledby="h-hig">
    <h2 id="h-hig">Apple HIG review <span class="ok">Good · no Critical findings</span></h2>
    <p>The tab bar as fixed for build 47 passes the Liquid Glass checklist: glass appears only where iOS draws it, nothing is painted under the bar, and the app has no hand-made blur.</p>
    <div class="scroll"><table>
      <thead><tr><th>#</th><th>Severity</th><th>Finding and what was done</th></tr></thead>
      <tbody>${HIG.map(([id, sev, text]) => `<tr><td>${id}</td><td class="sev">${sev}</td><td>${text}</td></tr>`).join('')}</tbody>
    </table></div>
  </section>

  <section class="ask" aria-labelledby="h-ask">
    <h2 id="h-ask">Please confirm</h2>
    <ol>
      <li>The brief as summarised above, both layouts included.</li>
      <li>Three assumptions from the questions you skipped: today's progress stays visible during focus; the presets live on the page when idle; a mode button opens a sheet.</li>
      <li>Button capitalisation: sentence case ("Start focus"), as the brand copy is written, or Apple's title style ("Start Focus")? Turkish stays sentence case either way.</li>
    </ol>
  </section>

  <footer>The full brief is <code>.impeccable/surfaces/app-tabs-index-tsx.md</code>; the review is in the Stage C record, section 2.4. Sketches are structure, not final art: Pomo &amp; Doro and the icons are placeholders until C3.</footer>
</div>
`;

const fragmentAt = process.argv.indexOf('--fragment');
if (fragmentAt !== -1) {
    fs.writeFileSync(process.argv[fragmentAt + 1], body);
} else {
    const out = path.join(ROOT, 'art/review/c4-classic-gate.html');
    fs.writeFileSync(out, '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style></head><body>') + '</body></html>\n');
    console.log(`wrote ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);
}
