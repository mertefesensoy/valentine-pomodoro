#!/usr/bin/env node
/**
 * The App Store screenshots' preview page: the "Morning to night" set as the store shows it, for the
 * owner's approval (docs/implementations/2026-11-01-app-store-screenshots.md).
 *
 *   node scripts/art/review-store.mjs                    → art/review/store-preview.html (images from ../out/)
 *   node scripts/art/review-store.mjs --base <prefix> --out <file>
 *                                                         the same page with images under <prefix> (the
 *                                                         published copy maps them beside the page)
 *
 * Reads only the repo: the job (art/jobs/store.json) for the panels and their sizes, the captions
 * and the theme tokens. The PNGs are the pipeline's own exports (scripts/art/build.mjs), so what the
 * page shows is exactly what App Store Connect receives.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const arg = (name, fallback) => {
    const i = process.argv.indexOf(name);
    return i > 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg('--base', '../out/');
const OUT = arg('--out', 'art/review/store-preview.html');

const job = JSON.parse(read('art/jobs/store.json'));
const palette = JSON.parse(read('src/theme/palette.json')).themes;
const sm = palette.strawberryMilk.tokens;
const mp = palette.midnightPlum.tokens;

// The captions, as the generator sets them (its CAPTIONS, with the hand-set breaks as spaces).
const source = read('scripts/art/store-sources.py');
const captions = {};
for (const lang of ['en', 'tr']) {
    const block = new RegExp(`'${lang}': \\[([\\s\\S]*?)\\n    \\]`).exec(source)[1];
    captions[lang] = [...block.matchAll(/\(\s*(['"])(.*?)\1,\s*(['"])(.*?)\3\)/g)].map((m) => [m[2], m[4]].map((s) => s.replace(/\|/g, ' ')));
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const sets = {};
for (const asset of job.assets) {
    const [, device, lang] = /^store-(\w+)-(\w+)$/.exec(asset.id);
    const sizes = [...new Set(asset.crops.map((c) => c.name.slice(3)))];
    sets[`${device}-${lang}`] = {
        device,
        lang,
        strip: `${BASE}store/${asset.id}-${asset.png[0]}.png`,
        sizes,
        panels: [1, 2, 3, 4, 5].map((n) => ({
            n,
            src: `${BASE}store/${asset.id}-${String(n).padStart(2, '0')}-${sizes[0]}.png`,
            files: sizes.map((s) => `${asset.id}-${String(n).padStart(2, '0')}-${s}.png`),
            caption: captions[lang][n - 1],
        })),
    };
}

const panelImg = (p, cls) => `<img class="${cls}" src="${esc(p.src)}" alt="Panel ${p.n}: ${esc(p.caption[0])}" loading="lazy">`;

function setMarkup(key) {
    const s = sets[key];
    const ratio = s.device === 'iphone' ? '1320 / 2868' : '2064 / 2752';
    const rows = s.panels
        .map((p) => `<tr><td class="num">${p.n}</td><td><b>${esc(p.caption[0])}</b><br><span class="soft">${esc(p.caption[1])}</span></td><td class="files">${p.files.map((f) => `<code>${esc(f)}</code>`).join('<br>')}</td></tr>`)
        .join('');
    return `<section class="set" data-set="${key}" style="--ratio:${ratio}"${key === 'iphone-en' ? '' : ' hidden'}>
  <div class="view">
    <h2>In search results</h2>
    <p class="note">Search shows the first three side by side, so panels 1–3 are the triptych.</p>
    <div class="search">
      <div class="listing"><img class="icon" src="${BASE}logo/app-icon-light-180.png" alt=""><div><b>Valentine Pomodoro</b><span class="soft">Today's name on the store</span></div><span class="get">Get</span></div>
      <div class="three">${s.panels.slice(0, 3).map((p) => panelImg(p, 'shot')).join('')}</div>
    </div>
  </div>
  <div class="view">
    <h2>On the product page</h2>
    <p class="note">All five scroll as one carousel; the day carries on past the third panel. Scroll sideways.</p>
    <div class="carousel" tabindex="0" aria-label="The five screenshots">${s.panels.map((p) => panelImg(p, 'shot')).join('')}</div>
  </div>
  <div class="view">
    <h2>The whole strip</h2>
    <p class="note">One VectorCraft drawing; each panel is a crop of it, with the store's gap between them.</p>
    <div class="strip-wrap"><img class="strip" src="${esc(s.strip)}" alt="The whole strip, morning to night"></div>
  </div>
  <div class="view">
    <h2>Files for App Store Connect</h2>
    <p class="note">PNG, RGB with no alpha channel, at ${s.sizes.map((x) => x.replace('x', ' × ')).join(' and ')} px, in <code>art/out/store/</code>. Upload them in this order.</p>
    <div class="table-wrap"><table><thead><tr><th>#</th><th>Caption</th><th>Files</th></tr></thead><tbody>${rows}</tbody></table></div>
  </div>
</section>`;
}

const page = `<meta charset="utf-8">
<title>Morning to Night Triptych</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600&display=swap">
<style>
/* Layout: one review column; each view is a strip of real exports at the store's own proportions. */
:root {
  --page: ${sm.page}; --paper: ${sm.paper}; --field: ${sm.field}; --edge: ${sm.edge}; --edge-strong: ${sm.edgeStrong};
  --ink: ${sm.ink}; --ink-soft: ${sm.inkSoft}; --primary: ${sm.primary}; --on-primary: ${sm.onPrimary}; --primary-ink: ${sm.primaryInk};
  --display: 'Baloo 2', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif;
  --body: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mono: ui-monospace, 'SF Mono', Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --page: ${mp.page}; --paper: ${mp.paper}; --field: ${mp.field}; --edge: ${mp.edge}; --edge-strong: ${mp.edgeStrong};
  --ink: ${mp.ink}; --ink-soft: ${mp.inkSoft}; --primary: ${mp.primary}; --on-primary: ${mp.onPrimary}; --primary-ink: ${mp.primaryInk}; color-scheme: dark } }
:root[data-theme="dark"] {
  --page: ${mp.page}; --paper: ${mp.paper}; --field: ${mp.field}; --edge: ${mp.edge}; --edge-strong: ${mp.edgeStrong};
  --ink: ${mp.ink}; --ink-soft: ${mp.inkSoft}; --primary: ${mp.primary}; --on-primary: ${mp.onPrimary}; --primary-ink: ${mp.primaryInk}; color-scheme: dark }
body { background: var(--page); color: var(--ink); font: 16px/1.5 var(--body); }
main { max-width: 1120px; margin: 0 auto; padding-block: 32px 64px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 40px; }
h1, h2 { font-family: var(--display); font-weight: 600; text-wrap: balance; margin: 0; }
h1 { font-size: clamp(32px, 5vw, 48px); line-height: 1.05; }
h2 { font-size: 24px; line-height: 1.2; }
.lede { max-width: 62ch; margin: 8px 0 0; color: var(--ink-soft); }
.soft { color: var(--ink-soft); }
.note { margin: 4px 0 14px; color: var(--ink-soft); font-size: 15px; }
code { font: 13px/1.5 var(--mono); }
.controls { display: flex; flex-wrap: wrap; gap: 12px; }
.seg { display: inline-flex; padding: 3px; gap: 2px; background: var(--field); border: 1.5px solid var(--edge); border-radius: 999px; }
.seg button { font: 600 15px var(--body); color: var(--ink-soft); background: none; border: 1.5px solid transparent; border-radius: 999px; min-height: 40px; padding: 0 18px; cursor: pointer; }
.seg button[aria-pressed="true"] { color: var(--ink); background: var(--paper); border-color: var(--edge-strong); }
.seg button:focus-visible, .carousel:focus-visible { outline: 3px solid var(--primary-ink); outline-offset: 2px; }
.set { display: grid; gap: 40px; }
.shot { display: block; width: 100%; aspect-ratio: var(--ratio); border-radius: 6%/2.8%; background: var(--field); }
.search { max-width: 430px; background: var(--paper); border: 1.5px solid var(--edge); border-radius: 22px; padding: 14px; display: grid; gap: 12px; }
.listing { display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; align-items: center; }
.listing div { display: grid; min-width: 0; font-size: 15px; line-height: 1.3; }
.listing .soft { font-size: 13px; }
.icon { width: 56px; height: 56px; border-radius: 13px; }
.get { font: 700 14px var(--body); color: var(--primary-ink); background: var(--field); border-radius: 999px; padding: 5px 16px; }
.three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.three .shot { border-radius: 8%/3.6%; }
.carousel { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 10px; }
.carousel .shot { flex: 0 0 clamp(200px, 30%, 300px); scroll-snap-align: start; }
.set[data-set^="ipad"] .carousel .shot { flex-basis: clamp(260px, 42%, 420px); }
.strip-wrap { overflow-x: auto; border-radius: 14px; border: 1.5px solid var(--edge); }
.strip { display: block; width: 100%; min-width: 760px; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 15px; background: var(--paper); border: 1.5px solid var(--edge); border-radius: 14px; overflow: hidden; }
th, td { text-align: left; vertical-align: top; padding: 10px 14px; border-top: 1px solid var(--edge); }
th { font-size: 13px; color: var(--ink-soft); border-top: 0; }
.num { font-variant-numeric: tabular-nums; width: 2ch; }
.files { white-space: nowrap; }
footer { color: var(--ink-soft); font-size: 14px; max-width: 70ch; display: grid; gap: 6px; }
@media (prefers-reduced-motion: no-preference) { .carousel { scroll-behavior: smooth; } }
</style>
<main>
  <header>
    <h1>Morning to night</h1>
    <p class="lede">Valentine Pomodoro 1.4's App Store screenshots: one study day told across five panels, Pomo &amp; Doro living it from the milk-pink morning to the plum night. Every panel is an exact export, as App Store Connect receives it.</p>
  </header>
  <div class="controls">
    <div class="seg" role="group" aria-label="Language"><button id="lang-en" aria-pressed="true" data-lang="en">English</button><button id="lang-tr" aria-pressed="false" data-lang="tr">Türkçe</button></div>
    <div class="seg" role="group" aria-label="Device"><button id="dev-iphone" aria-pressed="true" data-device="iphone">iPhone</button><button id="dev-ipad" aria-pressed="false" data-device="ipad">iPad</button></div>
  </div>
  ${Object.keys(sets).map(setMarkup).join('\n  ')}
  <footer>
    <p>The screens are drawn in VectorCraft from the app's own tokens and strings. The system face (SF Pro) is set in Inter; Baloo 2 is the app's own. The day's data is a realistic example: a 100-minute goal, a week of 21 sessions, the default love notes.</p>
    <p>iPad: the app runs its phone column on iPad (no iPad layout in 1.4), and no iPad capture exists to check against, so these screens follow the code's layout rules.</p>
  </footer>
</main>
<script>
(() => {
  const state = { lang: 'en', device: 'iphone' };
  const show = () => {
    document.querySelectorAll('.set').forEach((el) => { el.hidden = el.dataset.set !== state.device + '-' + state.lang; });
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    document.querySelectorAll('[data-device]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.device === state.device)));
  };
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { state.lang = b.dataset.lang; show(); }));
  document.querySelectorAll('[data-device]').forEach((b) => b.addEventListener('click', () => { state.device = b.dataset.device; show(); }));
})();
</script>
`;

fs.mkdirSync(path.dirname(path.resolve(ROOT, OUT)), { recursive: true });
fs.writeFileSync(path.resolve(ROOT, OUT), page);
console.log(`✔ wrote ${OUT}`);
