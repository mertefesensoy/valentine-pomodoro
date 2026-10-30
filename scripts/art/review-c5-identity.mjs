#!/usr/bin/env node
/**
 * C5: the one-page identity sheet. The Same Page mark (story, clear space, minimum sizes, versions,
 * misuse) and the system around it (colour, type, Pomo & Doro, voice, the lettering style).
 * Every image is a VectorCraft export from art/out/; colours come from src/theme/palette.json.
 *
 *   node scripts/art/review-c5-identity.mjs                 → art/review/c5-identity-sheet.html
 *   node scripts/art/review-c5-identity.mjs --fragment FILE → without the document wrapper
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const png = (rel) => `data:image/png;base64,${read(rel).toString('base64')}`;
const palette = JSON.parse(read('src/theme/palette.json'));
const baloo = /@font-face\{font-family:'Baloo 2 C2';font-weight:600;[^}]*\}/.exec(read('art/review/c2-type-specimen.html').toString())[0];
const L = palette.themes.strawberryMilk.tokens, D = palette.themes.midnightPlum.tokens;
const mark = (v, px = 256) => png(`art/out/logo/mark-${v}-${px}.png`);
const ill = (id, px = 128) => png(`art/out/illustration/${id}-${px}.png`);
const MATCHA = '#9ED39A';

const SWATCHES = [
    ['Milk', L.page, 'page'], ['Paper', L.paper, 'paper'], ['Cocoa', L.ink, 'ink'], ['Strawberry', L.primary, 'primary'],
    ['Deep strawberry', L.primaryInk, 'primaryInk'], ['Accent red', L.accent, 'accent'], ['Leaf', L.success, 'success'],
    ['Matcha (Doro)', MATCHA, 'art'], ['Midnight plum', D.page, 'page, dark'], ['Night strawberry', D.primary, 'primary, dark'],
];
const MISUSE = [
    ['Stretched', 'transform:scaleX(1.45)'],
    ['Rotated', 'transform:rotate(-18deg)'],
    ['Off-palette colour', 'filter:hue-rotate(150deg) saturate(2.2)'],
    ['Effects added', `filter:drop-shadow(6px 8px 0 #7a5cff) drop-shadow(0 0 12px #ffd400)`],
    ['Pages pulled apart', 'split'],
    ['A heart added', 'heart'],
    ['Text inside', 'text'],
    ['Busy ground, no edge', 'busy'],
];

function misuse([label, how]) {
    let art;
    const img = (style = '') => `<img src="${mark('colour')}" alt="" style="${style}">`;
    if (how === 'split') {
        art = `<span class="split"><img src="${mark('colour')}" alt="" style="clip-path:inset(0 50% 0 0);transform:translateX(-14px) rotate(-6deg)"><img src="${mark('colour')}" alt="" style="clip-path:inset(0 0 0 50%);transform:translateX(14px) rotate(6deg)"></span>`;
    } else if (how === 'heart') {
        art = `${img()}<svg class="over" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20z" fill="#E63946"/></svg>`;
    } else if (how === 'text') {
        art = `${img()}<span class="over txt">STUDY!</span>`;
    } else if (how === 'busy') {
        art = `<span class="busy"><img src="${mark('single-white')}" alt=""></span>`;
    } else {
        art = img(how);
    }
    return `<figure class="mis"><div class="frame">${art}<span class="no" aria-hidden="true"></span></div><figcaption>${label}</figcaption></figure>`;
}

const body = `<title>Same Page identity</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: one sheet in a 12-column paper grid. The mark leads; its rules, then the system around it. Printable on one landscape A3 page. */
${baloo}
:root { --page:${L.page}; --paper:${L.paper}; --edge:${L.edge}; --ink:${L.ink}; --soft:${L.inkSoft}; --primary:${L.primary}; --deep:${L.primaryInk}; --pSoft:${L.primarySoft}; --plum:${D.page};
        --display: 'Baloo 2 C2', ui-rounded, system-ui, sans-serif; --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink); font: 14px/1.45 var(--ui); }
.sheet { max-width: 1240px; margin: 0 auto; padding-block: 32px 56px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; }
.cell { background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 18px; min-width: 0; display: grid; gap: 10px; align-content: start; }
.span12 { grid-column: span 12; } .span7 { grid-column: span 7; } .span5 { grid-column: span 5; } .span6 { grid-column: span 6; } .span4 { grid-column: span 4; } .span8 { grid-column: span 8; }
@media (max-width: 860px) { .span7, .span5, .span6, .span4, .span8 { grid-column: span 12; } }
header.cell { background: transparent; border: 0; padding: 0 2px; }
h1 { font: 600 clamp(30px, 4.6vw, 44px)/1.05 var(--display); margin: 0; }
h2 { font: 600 20px/1.15 var(--display); margin: 0; }
p { margin: 0; max-width: 68ch; }
.soft { color: var(--soft); font-size: 13px; }
.hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; align-items: center; }
@media (max-width: 560px) { .hero { grid-template-columns: minmax(0, 1fr); } }
.hero img { width: 100%; max-width: 360px; height: auto; display: block; }
.story { font: 600 22px/1.25 var(--display); }
.clear { position: relative; width: min(300px, 100%); aspect-ratio: 784 / 576; margin: 0 auto; }
.clear img { position: absolute; inset: 16%; width: 68%; height: auto; }
.clear .box { position: absolute; inset: 0; border: 2px dashed var(--deep); border-radius: 6px; }
.clear .x { position: absolute; font: 600 13px var(--ui); color: var(--deep); }
.sizes { display: flex; gap: 18px; align-items: flex-end; flex-wrap: wrap; }
.sizes figure { margin: 0; display: grid; gap: 4px; justify-items: center; font-size: 12px; color: var(--soft); }
.sizes .bad { opacity: .45; }
.vers { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.vers figure { margin: 0; display: grid; gap: 6px; }
.vers .t { border-radius: 14px; padding: 16px; display: grid; place-items: center; aspect-ratio: 4 / 3; }
.vers .t img { width: 100%; height: auto; }
.vers figcaption { font-size: 12px; color: var(--soft); }
.mises { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
.mis { margin: 0; display: grid; gap: 6px; }
.mis .frame { position: relative; aspect-ratio: 4 / 3; border-radius: 14px; background: var(--page); border: 1px solid var(--edge); display: grid; place-items: center; overflow: hidden; }
.mis .frame > img, .mis .split img { width: 64%; height: auto; }
.mis .split { position: relative; width: 100%; height: 100%; display: grid; place-items: center; }
.mis .split img { position: absolute; }
.mis .over { position: absolute; width: 26%; height: auto; top: 18%; left: 37%; }
.mis .txt { font: 800 16px var(--ui); color: #FFF; top: 46%; left: 36%; width: auto; letter-spacing: .04em; }
.mis .busy { width: 100%; height: 100%; display: grid; place-items: center; background: repeating-linear-gradient(45deg, #F7A9BE 0 10px, #9ED39A 10px 20px, #FFF6F1 20px 30px); }
.mis .busy img { width: 64%; }
.mis .no { position: absolute; right: 8px; top: 8px; width: 22px; height: 22px; border-radius: 50%; background: ${L.danger}; }
.mis .no::before, .mis .no::after { content: ""; position: absolute; left: 10px; top: 5px; width: 2px; height: 12px; background: #fff; border-radius: 1px; transform: rotate(45deg); }
.mis .no::after { transform: rotate(-45deg); }
.mis figcaption { font-size: 12px; color: var(--soft); }
.sw { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }
.sw div { border-radius: 12px; border: 1px solid var(--edge); overflow: hidden; background: var(--paper); }
.sw i { display: block; height: 44px; }
.sw span { display: block; padding: 6px 8px; font-size: 11px; line-height: 1.3; }
.sw b { display: block; font-size: 12px; }
.type .d { font: 600 54px/1 var(--display); font-variant-numeric: tabular-nums; }
.type .b { font: 17px/1.4 var(--ui); }
.cast { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
.cast img { width: 96px; height: 96px; }
.letter { display: flex; align-items: center; gap: 2px; font: 600 clamp(36px, 5vw, 52px)/1 var(--display); }
.letter .c { display: grid; gap: 3px; margin: 0 2px; } .letter .c img { width: 0.36em; height: 0.36em; }
ul { margin: 0; padding-left: 18px; display: grid; gap: 4px; }
footer { grid-column: span 12; font-size: 12px; color: var(--soft); }
@page { size: A3 landscape; margin: 10mm; }
@media print { body { background: #fff; } .sheet { max-width: none; padding: 0; } .cell { break-inside: avoid; } }
</style>
<div class="sheet">
  <header class="cell span12">
    <h1>Same Page · identity sheet</h1>
    <p class="soft">Valentine Pomodoro (working name) · Phase 1, C5 · version 1.0, 30 October 2026 · for everyone who draws, writes or builds with the mark.</p>
  </header>

  <section class="cell span7" aria-labelledby="h-mark">
    <h2 id="h-mark">The mark</h2>
    <div class="hero">
      <img src="${mark('colour', 784)}" alt="The Same Page mark: two pages of one open diary, each with a face, leaning in">
      <div style="display:grid;gap:10px">
        <p class="story">Two pages of one diary, leaning in. Apart at the edges, bound at the spine: a couple on the same page.</p>
        <p class="soft">An open diary as a die-cut sticker: strawberry pages in a cocoa cover, with cocoa faces (the owner's change, 2026-10-30). It never shows a clock, a heart or a tomato, the category's habits (ADR-0047).</p>
      </div>
    </div>
  </section>

  <section class="cell span5" aria-labelledby="h-space">
    <h2 id="h-space">Clear space and size</h2>
    <div class="clear"><span class="box"></span><img src="${mark('colour', 784)}" alt=""><span class="x" style="top:4%;left:46%">X</span><span class="x" style="bottom:4%;left:46%">X</span><span class="x" style="left:4%;top:44%">X</span><span class="x" style="right:4%;top:44%">X</span></div>
    <p><b>Keep X clear on every side,</b> where X is a quarter of the mark's height. Nothing else enters that space.</p>
    <div class="sizes">${[64, 48, 32, 24].map((px) => `<figure><img src="${mark('colour', px)}" style="width:${px}px;height:auto" alt=""><span>${px} px</span></figure>`).join('')}<figure class="bad"><img src="${mark('colour', 16)}" style="width:16px;height:auto" alt=""><span>16 px: too small</span></figure></div>
    <p><b>Minimum width 24 px on screen, 10 mm in print:</b> below that the faces vanish. Smaller than that, the app icon carries the brand.</p>
  </section>

  <section class="cell span12" aria-labelledby="h-vers">
    <h2 id="h-vers">Versions</h2>
    <div class="vers">
      <figure><div class="t" style="background:${L.page}"><img src="${mark('colour')}" alt=""></div><figcaption><b>Colour.</b> The default, on milk and every light ground: strawberry pages, a cocoa cover.</figcaption></figure>
      <figure><div class="t" style="background:${D.page}"><img src="${mark('reversed')}" alt=""></div><figcaption><b>Reversed.</b> Strawberry pages for plum and other dark grounds.</figcaption></figure>
      <figure><div class="t" style="background:${L.primary}"><img src="${mark('single-cocoa')}" alt=""></div><figcaption><b>Single colour, cocoa.</b> One ink: print, embroidery, a stamp. The faces are cut out.</figcaption></figure>
      <figure><div class="t" style="background:${D.page}"><img src="${mark('single-white')}" alt=""></div><figcaption><b>Single colour, white.</b> One ink on dark or busy grounds.</figcaption></figure>
      <figure><div class="t" style="background:#D7DEE6"><img src="${png('art/out/logo/app-icon-light-180.png')}" style="width:56%;border-radius:22.37%" alt=""></div><figcaption><b>App icon.</b> The mark as a sticker on a strawberry tile, in default, dark and tinted.</figcaption></figure>
    </div>
  </section>

  <section class="cell span12" aria-labelledby="h-mis">
    <h2 id="h-mis">Never</h2>
    <div class="mises">${MISUSE.map(misuse).join('')}</div>
  </section>

  <section class="cell span6" aria-labelledby="h-col">
    <h2 id="h-col">Colour</h2>
    <div class="sw">${SWATCHES.map(([n, hex, role]) => `<div><i style="background:${hex}"></i><span><b>${n}</b>${hex}<br>${role}</span></div>`).join('')}</div>
    <p class="soft">Strawberry Milk by day, Midnight Plum by night. Flat fields, never gradients. Every text pair is proved by <code>npm run check:contrast</code> (ADR-0045).</p>
  </section>

  <section class="cell span6 type" aria-labelledby="h-type">
    <h2 id="h-type">Type</h2>
    <div class="d">24:59 · Bugün</div>
    <p class="soft">Baloo 2: the timer, screen titles, sticker captions. Tabular figures, the fi and fl ligatures off so a Turkish i keeps its dot (ADR-0046).</p>
    <p class="b">The system face for everything else, following Dynamic Type.</p>
  </section>

  <section class="cell span8" aria-labelledby="h-cast">
    <h2 id="h-cast">Pomo &amp; Doro</h2>
    <div class="cast"><img src="${ill('pomo-idle')}" alt="Pomo"><img src="${ill('pomo-celebrating')}" alt=""><img src="${ill('doro-idle')}" alt="Doro"><img src="${ill('doro-sleepy')}" alt=""></div>
    <ul>
      <li><b>Pomo,</b> the steady one: a round strawberry with one curl. <b>Doro,</b> the warm one: a wide matcha dome. Equals, the same visual weight.</li>
      <li>Together they are the colon in the timer. Flat fills, a white die-cut edge, a soft tinted shadow.</li>
      <li>The construction is locked: eye line at 52 %, eyes 26 % apart. Poses change the eyes, mouth and curl, never the build. They never sulk; sleepy is the lowest they go.</li>
    </ul>
  </section>

  <section class="cell span4" aria-labelledby="h-voice">
    <h2 id="h-voice">Voice and lettering</h2>
    <p>Warm, gentle, encouraging, with a quiet sense of humour. Never guilt, never pressure. Sentence case.</p>
    <div class="letter" aria-label="pomo:doro"><span>pomo</span><span class="c"><img src="${ill('pomo-idle', 32)}" alt=""><img src="${ill('doro-idle', 32)}" alt=""></span><span>doro</span></div>
    <p class="soft">The lettering style: Baloo 2, lower case, Pomo &amp; Doro as the colon. The final wordmark waits for the public name.</p>
  </section>

  <footer>Every image is a VectorCraft export rebuilt from <code>art/steps/*.steps.json</code> (<code>node scripts/art/build.mjs --check</code>); colours from <code>src/theme/palette.json</code>. Decisions: ADR-0045, ADR-0046, ADR-0047 and the Stage C record.</footer>
</div>
`;

const fragmentAt = process.argv.indexOf('--fragment');
if (fragmentAt !== -1) {
    fs.writeFileSync(process.argv[fragmentAt + 1], body);
} else {
    const out = path.join(ROOT, 'art/review/c5-identity-sheet.html');
    fs.writeFileSync(out, '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style></head><body>') + '</body></html>\n');
    console.log(`wrote ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);
}
