#!/usr/bin/env node
/**
 * The C3 logo gate page: every concept in black and white, at every iOS icon size, with its
 * rationale, risks and the category survey (logo rules 2, 3, 5, 6). Built from the VectorCraft
 * exports in art/out/logo/, embedded as data URIs so one file works on Windows and on a phone.
 *
 *   node scripts/art/review-logo.mjs                 → art/review/c3-logo-concepts.html
 *   node scripts/art/review-logo.mjs --fragment FILE → the same page without the document wrapper
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const png = (rel) => `data:image/png;base64,${read(rel).toString('base64')}`;
const palette = JSON.parse(read('src/theme/palette.json'));
const baloo = /@font-face\{font-family:'Baloo 2 C2';font-weight:600;[^}]*\}/.exec(read('art/review/c2-type-specimen.html').toString())[0];

const SIZES = [
    [1024, 'App Store'], [180, 'Home screen, 60 pt @3x'], [120, 'Home @2x, Spotlight @3x'], [87, 'Settings, 29 pt @3x'],
    [80, 'Spotlight, 40 pt @2x'], [60, 'Notification, 20 pt @3x'], [40, 'Notification @2x'], [29, 'Settings @1x'], [20, 'Notification @1x'],
];

const CONCEPTS = [
    {
        id: 'c1-same-page', name: 'Same Page', line: 'Two pages of one open diary, leaning in.',
        why: 'A couple who studies together is, quite literally, on the same page. The open diary says study and stays inside the Sticker Diary; the two pages are the two of you, apart at the edges and bound at the spine.',
        wit: 'The idiom made literal. The spine is the one thing they share.',
        cast: 'Pomo & Doro become two pages. Sleepy is a dog-eared corner pulled up like a blanket; celebrating is the pages fanning like wings.',
        risk: 'An open book is the most common study symbol, so the lean and the faces carry the difference. Smiling-book clip art exists; the final drawing needs its own page curve.',
    },
    {
        id: 'c2-lean-on-me', name: 'Lean on Me', line: 'Two books that hold each other up.',
        why: 'Take one away and the other falls; together they stand. That is what a study partner does on a long night, and the A-shape they make reads at any size.',
        wit: 'Two books on a shelf, behaving like a couple.',
        cast: 'Pomo & Doro become two books: open while focusing, lying flat on a break, one napping on the other.',
        risk: 'At small sizes it can pass for a library or a "Books" category icon. The shelf line may go in the final drawing.',
    },
    {
        id: 'c3-colon', name: 'The Colon', line: 'The two of you live between the minutes and the seconds.',
        why: 'In 24:59 the colon is the one mark that never changes. Here it is the two of you, with every minute held between you. It also splits the word in two, pomo:doro, which is how the lettering would work.',
        wit: 'The most-seen character in the app turns out to be them.',
        cast: 'Pomo & Doro become two round dots with faces.',
        risk: 'Alone, two dots are generic, so this concept leans on its lettering, with the dots as the small-size mark. Round blob mascots are common.',
        lettering: true,
    },
    {
        id: 'c4-red-thread', name: 'Red Thread', line: 'One thread ties the two of you, however far apart.',
        why: 'An East Asian legend says an invisible red thread joins the people who are meant to meet. It may stretch or tangle, but it never breaks. That is long-distance study in a single line, and when colour arrives the thread becomes the brand red.',
        wit: 'Below about 30 px the two heads and the thread read as one smiling face.',
        cast: 'Pomo & Doro become two round friends on one thread: taut while focusing, looped on a break, tied in a bow to celebrate, wound into a pillow when sleepy.',
        risk: 'It says nothing about studying, which rule 8 allows. At middle sizes it can read as earbuds, so the thread has to stay thick enough for 20 px.',
    },
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const sm = palette.themes.strawberryMilk.tokens, mp = palette.themes.midnightPlum.tokens;
const keys = ['page', 'paper', 'field', 'edge', 'ink', 'inkSoft', 'primary', 'onPrimary', 'primaryInk', 'primarySoft', 'success', 'onSuccess'];
const tok = (t) => keys.map((k) => `--${k}:${t[k]}`).join(';');

function concept(c, i) {
    const big = png(`art/out/logo/logo-${c.id}-1024.png`);
    const strip = SIZES.slice(1).map(([px, use]) => `
        <figure class="size"><img class="px" data-px="${px}" width="${px}" height="${px}" src="${png(`art/out/logo/logo-${c.id}-${px}.png`)}" alt="">
        <figcaption><b>${px} px</b>${esc(use)}</figcaption></figure>`).join('');
    const inverse = [180, 60, 29].map((px) => `<img class="px inv" data-px="${px}" width="${px}" height="${px}" src="${png(`art/out/logo/logo-${c.id}-${px}.png`)}" alt="">`).join('');
    const svgBytes = read(`art/out/logo/logo-${c.id}.svg`).length;
    // The lettering sketch inlines the source mark cropped to its two dots (no tile, no background).
    const dots = read('art/src/logo/c3-colon.svg').toString()
        .replace(/<\?xml[^>]*>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/<rect[^>]*\/>/, '')
        .replace(/width="1024" height="1024" viewBox="0 0 1024 1024"/, 'viewBox="300 160 426 700" aria-hidden="true"');
    const colon = c.lettering ? `<div class="letter" aria-label="pomo:doro"><span>pomo</span>${dots}<span>doro</span></div>
        <p class="small">Lettering sketch in Baloo 2, the face you picked: the colon is the mark. The final wordmark waits for the public name.</p>` : '';
    return `
<section class="concept" id="${c.id}" aria-labelledby="h-${c.id}">
  <div class="lead">
    <div class="hero"><img src="${big}" alt="${esc(c.name)}, black on white"></div>
    <div class="words">
      <p class="eyebrow">Concept ${i + 1} of ${CONCEPTS.length}</p>
      <h2 id="h-${c.id}">${esc(c.name)}</h2>
      <p class="line">${esc(c.line)}</p>
      <dl>
        <div><dt>Why it fits</dt><dd>${esc(c.why)}</dd></div>
        <div><dt>Wit and warmth</dt><dd>${esc(c.wit)}</dd></div>
        <div><dt>The characters</dt><dd>${esc(c.cast)}</dd></div>
        <div><dt>Risks</dt><dd>${esc(c.risk)}</dd></div>
      </dl>
      ${colon}
    </div>
  </div>
  <h3>Every size, at its real pixels</h3>
  <div class="strip">${strip}</div>
  <h3>Reversed, white on black</h3>
  <div class="strip inverse">${inverse}<p class="small">The SVG master is ${(svgBytes / 1024).toFixed(1)} KB.</p></div>
</section>`;
}

const body = `<title>Logo concepts</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: a contact sheet. Each concept is one paper page: the mark large, its case beside it, then every size in a strip. The marks are black and white on purpose (logo rule 2); only the page chrome uses the C1 tokens. */
${baloo}
:root { ${tok(sm)}; --display: 'Baloo 2 C2', ui-rounded, system-ui, sans-serif; --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${tok(mp)}; color-scheme: dark; } }
:root[data-theme="dark"] { ${tok(mp)}; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.5 var(--ui); }
.wrap { max-width: 1120px; margin: 0 auto; padding-block: 36px 72px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 28px; }
h1 { font: 600 clamp(32px, 5vw, 46px)/1.05 var(--display); margin: 0; text-wrap: balance; }
.lede { color: var(--inkSoft); max-width: 70ch; margin: 10px 0 0; }
.panel { background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 20px; display: grid; gap: 12px; min-width: 0; }
.panel h2 { font: 600 24px/1.1 var(--display); margin: 0; }
.scroll { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; min-width: 560px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--edge); vertical-align: top; }
th { font-size: 12px; color: var(--inkSoft); }
.concept { background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 22px; display: grid; gap: 14px; min-width: 0; }
.lead { display: grid; grid-template-columns: minmax(0, 340px) minmax(0, 1fr); gap: 26px; align-items: start; }
@media (max-width: 720px) { .lead { grid-template-columns: minmax(0, 1fr); } }
.hero img { width: 100%; max-width: 340px; height: auto; border-radius: 22.37%; box-shadow: 0 0 0 1px var(--edge); display: block; }
.words { display: grid; gap: 10px; min-width: 0; }
.eyebrow { margin: 0; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--inkSoft); font-weight: 600; }
.words h2 { font: 600 clamp(30px, 4.5vw, 40px)/1.05 var(--display); margin: 0; }
.line { margin: 0; font-size: 18px; }
dl { margin: 0; display: grid; gap: 10px; }
dl div { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 12px; }
@media (max-width: 520px) { dl div { grid-template-columns: minmax(0, 1fr); gap: 0; } }
dt { color: var(--inkSoft); font-weight: 600; }
dd { margin: 0; max-width: 64ch; }
h3 { margin: 6px 0 0; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--inkSoft); }
.strip { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px 18px; background: var(--page); border: 1px solid var(--edge); border-radius: 14px; padding: 14px; }
.size { margin: 0; display: grid; gap: 6px; justify-items: start; }
.size figcaption { font-size: 11px; color: var(--inkSoft); line-height: 1.3; max-width: 110px; }
.size figcaption b { display: block; color: var(--ink); font-size: 12px; }
img.px { border-radius: 22.37%; box-shadow: 0 0 0 1px var(--edge); display: block; }
img.inv { filter: invert(1); box-shadow: none; }
.small { margin: 0; font-size: 12px; color: var(--inkSoft); }
.letter { display: flex; align-items: center; gap: 2px; font: 600 clamp(40px, 7vw, 64px)/1 var(--display); color: var(--ink); background: #fff; color: #000; border-radius: 14px; padding: 10px 16px; width: fit-content; max-width: 100%; }
.letter svg { height: 0.78em; width: auto; margin: 0.06em 0.04em 0; }
.pick { background: var(--primarySoft); border-radius: 22px; padding: 22px; display: grid; gap: 10px; }
.pick h2 { font: 600 26px/1.1 var(--display); margin: 0; }
.pick p { margin: 0; max-width: 72ch; }
footer { color: var(--inkSoft); font-size: 13px; }
</style>
<div class="wrap">
  <header>
    <h1>Logo concepts</h1>
    <p class="lede">Phase 1, C3. Four ideas for the mark, in black and white only, because a weak idea can't be rescued by colour. Each one tells one story and comes with the case for it, its risks, and what Pomo &amp; Doro would become. Pick one; colour, the app icon, the splash and the mark in context come after.</p>
  </header>

  <section class="panel" aria-labelledby="h-survey">
    <h2 id="h-survey">What the category already does</h2>
    <p class="small">From App Store listings and recalled store icons, 30 October 2026. Not exhaustive: the mark you pick gets a reverse-image search, and a trademark search with the name, before launch.</p>
    <div class="scroll"><table>
      <thead><tr><th>Group</th><th>Typical apps</th><th>Their habit</th></tr></thead>
      <tbody>
        <tr><td>Pomodoro timers</td><td>Focus To-Do, Be Focused, Focus Keeper, Pomofocus, Session</td><td>A tomato, a red disc, a ring or a clock face</td></tr>
        <tr><td>Focus by growing</td><td>Forest, Flora</td><td>A tree or a sprout</td></tr>
        <tr><td>Study companions</td><td>Study Bunny, Finch, Fatty Cat, VStudy</td><td>A small animal mascot</td></tr>
        <tr><td>Couples</td><td>Between, Paired, Lasting, Love Nudge, Locket, Widgetable</td><td>Hearts, two overlapping circles, a flame, chat bubbles, a lot of pink</td></tr>
      </tbody>
    </table></div>
    <p><b>So none of the four uses</b> a tomato, a clock or ring, a heart, an animal, a plant, overlapping circles or a sparkle, which now signals AI. Three first sketches were dropped on the way: two stickers in one die-cut (it read as a chat bubble), clinking cups (beer steins) and a pencil with an eraser (a rocket when small, and a pencil means "edit" on iOS).</p>
  </section>

  ${CONCEPTS.map(concept).join('\n')}

  <section class="pick" aria-labelledby="h-pick">
    <h2 id="h-pick">My recommendation: Same Page</h2>
    <p>It is the only concept that carries all three of your words at once: romantic (the two of you, leaning in), couples (two pages, one spine) and studying (an open diary). It also holds at 20 px better than any other. <b>Red Thread</b> is the more romantic and more unusual choice, if you're happy for the mark to say nothing about studying.</p>
    <p>Whichever you pick, the colour app icon will show it as a die-cut sticker on a Strawberry Milk page, so the icon belongs to the Sticker Diary too.</p>
  </section>

  <footer>Every image is a VectorCraft export rebuilt from <code>art/steps/*.steps.json</code> (<code>node scripts/art/build.mjs --check</code> confirms byte-identical rebuilds). Sizes are shown at their real pixels on this screen; the reversed row is a display inversion of the same files.</footer>
</div>
<script>
// Show each size at its real pixels: a 29 px export is 29 device pixels, not 29 CSS pixels on a 3x screen.
document.querySelectorAll('img.px').forEach((img) => { const w = Number(img.dataset.px) / (window.devicePixelRatio || 1); img.style.width = img.style.height = w + 'px'; });
</script>
`;

const fragmentAt = process.argv.indexOf('--fragment');
if (fragmentAt !== -1) {
    fs.writeFileSync(process.argv[fragmentAt + 1], body);
} else {
    const out = path.join(ROOT, 'art/review/c3-logo-concepts.html');
    fs.writeFileSync(out, '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style></head><body>') + '</body></html>\n');
    console.log(`wrote ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);
}
