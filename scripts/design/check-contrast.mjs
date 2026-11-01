#!/usr/bin/env node
/**
 * The contrast gate for the theme tokens (Phase 1 C1; NFR-A11Y-001, FR-SET-002).
 *
 *   npm run check:contrast                 check every declared pair in every theme
 *   npm run check:contrast -- --html FILE  also write the swatch sheet to FILE
 *
 * Reads src/theme/palette.json and uses src/theme/contrast.ts (run through Node's type
 * stripping), the same function the Jest test calls, so the sheet shows exactly the
 * ratios CI enforces. Exits 1 when a pair is under its floor, or when the token file
 * is inconsistent (a theme missing a role, a pair naming an unknown token).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPairs, contrastRatio, parseHex, composite, toHex } from '../../src/theme/contrast.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const palette = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/theme/palette.json'), 'utf8'));

const errors = [];
const roleNames = Object.keys(palette.roles);
const results = {};

for (const [id, theme] of Object.entries(palette.themes)) {
    const names = Object.keys(theme.tokens);
    for (const r of roleNames) if (!names.includes(r)) errors.push(`${id}: no value for the role "${r}"`);
    for (const n of names) if (!roleNames.includes(n)) errors.push(`${id}: "${n}" has no role in palette.roles`);
    try {
        // The WCAG pairs, then the dims (D5): separations, gated the same way.
        results[id] = checkPairs(theme.tokens, [...palette.pairs, ...(palette.dims ?? [])]);
    } catch (e) {
        errors.push(`${id}: ${e.message}`);
    }
}

const pad = (s, n) => String(s).padEnd(n);
let failures = 0;
for (const [id, rows] of Object.entries(results)) {
    console.log(`\n${palette.themes[id].name} (${palette.themes[id].scheme})`);
    for (const r of rows) {
        if (!r.pass) failures++;
        console.log(
            `  ${r.pass ? '✔' : '✖'} ${pad(`${r.fg} on ${r.bg}`, 28)} ${pad(`${r.fgHex} / ${r.bgHex}`, 22)} ` +
            `${r.ratio.toFixed(2).padStart(5)} ≥ ${r.min}   ${r.use}`,
        );
    }
}

const htmlAt = process.argv.indexOf('--html');
if (htmlAt !== -1) {
    const out = path.resolve(process.argv[htmlAt + 1]);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, swatchSheet());
    console.log(`\nSwatch sheet: ${path.relative(ROOT, out)}`);
}

const pairCount = Object.values(results).reduce((n, rows) => n + rows.length, 0);
if (errors.length) console.error('\n' + errors.map((e) => `✖ ${e}`).join('\n'));
console.log(`\n${failures || errors.length ? '✖' : '✔'} ${pairCount} pairs in ${Object.keys(results).length} themes, ${failures} under the floor, ${errors.length} token-file error(s)`);
process.exit(failures || errors.length ? 1 : 0);

// ---------------------------------------------------------------------------
// The swatch sheet: one self-contained HTML page per run, for the owner's C1 gate.

function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

/** The ring sample: a 270° arc in `color` over a full track. */
function ring(t, color) {
    const r = 34, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true">
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="${t.ringTrack}" stroke-width="9"/>
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"
        stroke-dasharray="${(c * 0.72).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 42 42)"/>
    </svg>`;
}

/** A placeholder sticker (a plain "done" sticker) to show the die-cut edge and the tinted shadow. */
function sticker(t) {
    const sh = parseHex(t.stickerShadow);
    const shadow = `rgba(${sh.r},${sh.g},${sh.b},${sh.a.toFixed(2)})`;
    return `<svg viewBox="0 0 96 96" width="76" height="76" aria-hidden="true" style="filter: drop-shadow(1.5px 3px 3px ${shadow})">
      <rect x="10" y="12" width="76" height="72" rx="26" fill="${t.stickerEdge}" transform="rotate(-6 48 48)"/>
      <rect x="16" y="18" width="64" height="60" rx="21" fill="${t.primary}" transform="rotate(-6 48 48)"/>
      <path d="M33 49 l10 10 20-22" fill="none" stroke="${t.onPrimary}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

function themeSection(id) {
    const theme = palette.themes[id];
    const t = theme.tokens;
    const rows = results[id] ?? [];
    const swatches = Object.entries(t).map(([name, hex]) => {
        const shown = parseHex(hex).a < 1 ? toHex(composite(parseHex(hex), parseHex(t.page))) : hex;
        return `<li class="sw">
          <span class="chip" style="background:${shown}"></span>
          <span class="meta"><b>${esc(name)}</b><code>${esc(hex)}</code><small>${esc(palette.roles[name])}</small></span>
        </li>`;
    }).join('');

    const pairRows = rows.map((r) => {
        const sample = r.min >= 4.5
            ? `<span class="sample" style="background:${r.bgHex};color:${r.fgHex}">Odaklan · 24:59</span>`
            : `<span class="sample" style="background:${r.bgHex}"><i style="background:${r.fgHex}"></i></span>`;
        return `<tr class="${r.pass ? '' : 'fail'}">
          <td>${sample}</td>
          <td><b>${esc(r.fg)}</b> on <b>${esc(r.bg)}</b><small>${esc(r.use)}</small></td>
          <td class="num">${r.ratio.toFixed(2)}</td>
          <td class="num">≥ ${r.min}</td>
          <td class="verdict">${r.pass ? 'Pass' : 'Fail'}</td>
        </tr>`;
    }).join('');

    const passed = rows.filter((r) => r.pass).length;
    return `<section class="theme" style="--page:${t.page};--paper:${t.paper};--field:${t.field};--edge:${t.edge};--edgeStrong:${t.edgeStrong};--ink:${t.ink};--inkSoft:${t.inkSoft};--primary:${t.primary};--onPrimary:${t.onPrimary};--primaryInk:${t.primaryInk};--primarySoft:${t.primarySoft};--accent:${t.accent};--onAccent:${t.onAccent};--success:${t.success};--onSuccess:${t.onSuccess};--successInk:${t.successInk};--danger:${t.danger};--onDanger:${t.onDanger};--dangerInk:${t.dangerInk}">
      <header class="th">
        <h2>${esc(theme.name)}</h2>
        <p>${theme.scheme === 'light' ? 'Light default' : 'Dark default'} · Free · <b>${passed} of ${rows.length}</b> pairs pass</p>
      </header>

      <div class="demo">
        <div class="paper">
          <div class="row">
            ${ring(t, t.ringFocus)}
            <div><div class="timer">24:59</div><div class="soft">Focus · Chapter 4 notes</div></div>
            ${sticker(t)}
          </div>
          <div class="row wrap">
            <button class="btn primary">Start focus</button>
            <span class="pill sel">25 / 5</span><span class="pill">50 / 10</span>
            <span class="badge">3</span>
          </div>
          <label class="input"><span class="soft">Intention</span><span class="ph">What are you studying?</span></label>
          <div class="row wrap">
            ${ring(t, t.ringBreak)}
            <div><div class="ok">Goal reached</div><div class="soft">4 of 4 sessions today</div></div>
            <button class="btn success">Take a break</button>
          </div>
          <div class="row wrap"><a class="link">Edit love notes</a><a class="destroy">Reset today</a><button class="btn danger">Delete</button></div>
        </div>
      </div>

      <h3>Tokens</h3>
      <ul class="grid">${swatches}</ul>

      <h3>Every pair, as CI checks it</h3>
      <div class="scroll"><table>
        <thead><tr><th>Sample</th><th>Pair and use</th><th class="num">Ratio</th><th class="num">Floor</th><th></th></tr></thead>
        <tbody>${pairRows}</tbody>
      </table></div>
    </section>`;
}

function swatchSheet() {
    const sm = palette.themes.strawberryMilk.tokens;
    const alt = { fill: sm.primaryInk, label: '#FFFFFF' };
    const altRatio = contrastRatio(alt.label, alt.fill);
    const chosenRatio = contrastRatio(sm.onPrimary, sm.primary);
    const total = Object.values(results).flat();
    const allPass = total.every((r) => r.pass) && !errors.length;

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sticker Diary swatches</title>
<style>
  :root { color-scheme: light; --sheet:#FBF7F5; --sheetInk:#3A2A28; --sheetSoft:#6F5A56; --line:#EADFDB; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--sheet); color: var(--sheetInk); font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .wrap-page { max-width: 1120px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 30px; line-height: 1.15; margin: 0 0 6px; letter-spacing: -0.01em; }
  .lede { color: var(--sheetSoft); max-width: 70ch; margin: 0 0 8px; }
  .status { display: inline-block; margin: 10px 0 28px; padding: 6px 12px; border-radius: 999px; font-weight: 600; background: ${allPass ? '#DDF1DA' : '#FBD9D6'}; color: ${allPass ? '#24582C' : '#8A1F27'}; }
  .theme { background: var(--page); color: var(--ink); border-radius: 22px; padding: 22px 18px; margin: 0 0 28px; border: 1px solid var(--edge); }
  .th h2 { margin: 0; font-size: 24px; }
  .th p { margin: 2px 0 16px; color: var(--inkSoft); }
  h3 { font-size: 15px; margin: 26px 0 10px; color: var(--inkSoft); text-transform: uppercase; letter-spacing: 0.06em; }
  .paper { background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 18px; display: grid; gap: 16px; max-width: 560px; }
  .row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .row > div { min-width: 0; }
  .timer { font-size: 44px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; line-height: 1; }
  .soft { color: var(--inkSoft); }
  .ok { color: var(--successInk); font-weight: 650; font-size: 18px; }
  .btn { font: inherit; font-weight: 600; font-size: 17px; border: 0; border-radius: 999px; padding: 12px 22px; min-height: 44px; }
  .btn.primary { background: var(--primary); color: var(--onPrimary); }
  .btn.success { background: var(--success); color: var(--onSuccess); }
  .btn.danger { background: var(--danger); color: var(--onDanger); }
  .pill { border-radius: 8px; padding: 7px 12px; background: var(--field); color: var(--ink); font-weight: 600; }
  .pill.sel { background: var(--primarySoft); color: var(--primaryInk); }
  .badge { display: inline-grid; place-items: center; min-width: 26px; height: 26px; border-radius: 999px; background: var(--accent); color: var(--onAccent); font-weight: 700; font-size: 14px; }
  .input { display: grid; gap: 4px; }
  .input .ph { display: block; background: var(--field); border: 1.5px solid var(--edgeStrong); border-radius: 14px; padding: 11px 14px; color: var(--inkSoft); }
  .link { color: var(--primaryInk); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
  .destroy { color: var(--dangerInk); font-weight: 600; }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
  .sw { display: flex; gap: 10px; align-items: flex-start; background: var(--paper); border: 1px solid var(--edge); border-radius: 14px; padding: 10px; }
  .chip { flex: none; width: 44px; height: 44px; border-radius: 10px; border: 1px solid var(--edge); }
  .meta { display: grid; min-width: 0; }
  .meta code { font: 12px ui-monospace, SFMono-Regular, Consolas, monospace; color: var(--inkSoft); }
  .meta small, td small { display: block; color: var(--inkSoft); font-size: 12px; line-height: 1.35; }
  .scroll { overflow-x: auto; background: var(--paper); border: 1px solid var(--edge); border-radius: 14px; }
  table { border-collapse: collapse; width: 100%; min-width: 560px; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--edge); vertical-align: middle; }
  th { font-size: 12px; color: var(--inkSoft); font-weight: 600; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .verdict { font-weight: 700; color: var(--successInk); }
  tr.fail .verdict { color: var(--dangerInk); }
  .sample { display: inline-flex; align-items: center; justify-content: center; min-width: 132px; height: 38px; padding: 0 10px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
  .sample i { display: block; width: 72px; height: 8px; border-radius: 99px; }
  .choice { background: #fff; border: 1px solid var(--line); border-radius: 22px; padding: 20px 18px; margin: 0 0 28px; }
  .choice h2 { margin: 0 0 4px; font-size: 20px; }
  .choice p { margin: 0 0 14px; color: var(--sheetSoft); max-width: 70ch; }
  .opts { display: flex; flex-wrap: wrap; gap: 16px; }
  .opt { border: 1px solid var(--line); border-radius: 14px; padding: 14px; background: ${sm.page}; min-width: 240px; }
  .opt b { display: block; margin-bottom: 8px; }
  .opt .btn { margin-bottom: 8px; }
  footer { color: var(--sheetSoft); font-size: 13px; }
  code { overflow-wrap: anywhere; }
  @media (max-width: 560px) {
    h1 { font-size: 24px; }
    .theme { padding: 18px 12px; border-radius: 18px; }
    .paper { padding: 14px; }
    .timer { font-size: 38px; }
    .opt { min-width: 0; flex: 1 1 100%; }
    .grid { grid-template-columns: 1fr; }
  }
</style></head>
<body><div class="wrap-page">
  <h1>The Sticker Diary: theme tokens</h1>
  <p class="lede">Phase 1, C1. Two free themes with the same roles: <b>Strawberry Milk</b> (light) and <b>Midnight Plum</b> (dark). Every text and background pair the interface will draw is listed under its theme, with its contrast ratio. Text needs <b>4.5:1</b>; large text, icons and non-text marks (the ring, input boundaries) need <b>3:1</b>.</p>
  <p class="lede">The ratios on this page come from the same function and the same file that CI checks (<code>npm run check:contrast</code>), so what you approve is what ships. The tilted check is a placeholder sticker showing the die-cut edge and the shadow; the characters come in C3.</p>
  <span class="status">${allPass ? `All ${total.length} pairs pass` : `${total.filter((r) => !r.pass).length} pair(s) fail`}</span>

  <section class="choice">
    <h2>One choice for you: the primary button</h2>
    <p>A pastel strawberry can't carry white text at 4.5:1. So either the fill stays soft and the label is cocoa (proposed: it reads like stationery and keeps the deeper pink for text and the ring), or the fill goes deep and the label is white (more conventional, louder).</p>
    <div class="opts">
      <div class="opt"><b>A · Proposed</b><button class="btn" style="background:${sm.primary};color:${sm.onPrimary}">Start focus</button><div style="color:${sm.inkSoft}">Cocoa on pastel strawberry · ${chosenRatio.toFixed(2)}:1</div></div>
      <div class="opt"><b>B · Alternative</b><button class="btn" style="background:${alt.fill};color:${alt.label}">Start focus</button><div style="color:${sm.inkSoft}">White on deep strawberry · ${altRatio.toFixed(2)}:1</div></div>
    </div>
  </section>

  ${Object.keys(palette.themes).map(themeSection).join('\n')}

  <footer>Generated by <code>scripts/design/check-contrast.mjs</code> from <code>src/theme/palette.json</code>. WCAG 2 relative luminance; translucent colours are composited over their background before the check (Phase 1 plan §4.1).</footer>
</div></body></html>
`;
}
