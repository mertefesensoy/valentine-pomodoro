#!/usr/bin/env node
/**
 * The welcome morph's choreography as a browser preview (Phase 1 D1, build 48 finding F5).
 *
 * There is no iOS Simulator on the build machine, so the owner judges the rebuilt opening here
 * before build 49. The preview plays the app's own timeline: it imports
 * src/screens/welcome/choreography.ts (Node runs TypeScript by stripping types), samples it every
 * 1000/60 ms and embeds those numbers, so the page and the app share one source of motion. The art
 * is the app's own: the welcome layers and the mascot stickers, inlined.
 *
 * The page maps each sample to CSS exactly as WelcomeScreen.tsx maps it to React Native styles:
 * the same transform lists in the same order, the same transform origins, and perspective with
 * rotateY, whose matrices React Native builds as CSS does (Transform.cpp: m13 = −sin, m34 = −1/d).
 *
 * Usage: node scripts/art/review-welcome-choreography.mjs
 * Output: art/review/d1-welcome-choreography.html (deterministic: the same inputs, the same bytes).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const c = await import(pathToFileURL(join(root, 'src/screens/welcome/choreography.ts')).href);

const read = (p) => readFileSync(join(root, p));
const svg = (p) => `data:image/svg+xml;base64,${read(p).toString('base64')}`;
const round = (v) => Math.round(v * 10000) / 10000;

const LAYERS = ['edge-left', 'edge-right', 'page-left', 'page-right', 'cover'];
const art = {};
for (const variant of ['colour', 'reversed']) {
    art[variant] = Object.fromEntries(LAYERS.map((l) => [l, svg(`art/src/welcome/welcome-${l}-${variant}.svg`)]));
}
const mascots = {};
for (const who of ['pomo', 'doro']) {
    for (const pose of ['idle', 'celebrating']) mascots[`${who}-${pose}`] = svg(`art/out/illustration/${who}-${pose}.svg`);
}
const font = read('assets/fonts/Baloo2-SemiBold.ttf').toString('base64');
const palette = JSON.parse(read('src/theme/palette.json'));
const en = JSON.parse(read('src/i18n/en.json'));

// One sample per 60 Hz frame, and the last frame exactly.
const STEP = 1000 / 60;
const times = [];
for (let t = 0; t < c.DURATION; t += STEP) times.push(t);
times.push(c.DURATION);
const sample = (room) =>
    times.map((t) => {
        const d = c.diaryPose(t);
        const ch = (who) => {
            const p = c.characterPose(who, t, room);
            return [p.x, p.y, p.sx, p.sy, p.rot, p.opacity, p.celebrate].map(round);
        };
        const particles = Array.from({ length: c.PARTICLE_COUNT }, (_, i) => {
            const s = c.particlePose(i, t);
            return [s.x, s.y, s.scale, s.rot, s.opacity].map(round);
        });
        const l = c.linePose(t);
        return {
            d: [d.shiftX, d.sx, d.sy, d.coverAngle, d.coverOpacity, d.leftAngle, d.leftOpacity, d.rightOpacity, d.bump, d.dip].map(round),
            pomo: ch('pomo'),
            doro: ch('doro'),
            particles,
            line: [round(l.opacity), round(l.dy)],
        };
    });

const data = {
    step: STEP,
    duration: c.DURATION,
    landMs: c.LAND_MS,
    size: c.CHARACTER_SIZE,
    feet: c.FEET,
    aspect: c.ASPECT,
    headroom: c.headroom(1),
    origins: { diary: c.DIARY_ORIGIN, spread: c.SPREAD_ORIGIN, character: c.CHARACTER_ORIGIN },
    frames: sample(1),
};

const tokens = { light: palette.themes.strawberryMilk.tokens, dark: palette.themes.midnightPlum.tokens };

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Welcome Choreography</title>
<style>
@font-face { font-family: 'Baloo 2'; font-weight: 600; src: url(data:font/ttf;base64,${font}) format('truetype'); }
:root { --page: ${tokens.light.page}; --ink: ${tokens.light.ink}; --inkSoft: ${tokens.light.inkSoft}; --primary: ${tokens.light.primary}; --onPrimary: ${tokens.light.onPrimary}; --success: ${tokens.light.success}; --sparkPomo: ${tokens.light.primary}; --edge: ${tokens.light.edge}; --chrome: #f3f0ee; --chromeInk: #333; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --chrome: #1b1b1d; --chromeInk: #ddd; } }
:root[data-theme="dark"] { --page: ${tokens.dark.page}; --ink: ${tokens.dark.ink}; --inkSoft: ${tokens.dark.inkSoft}; --primary: ${tokens.dark.primary}; --onPrimary: ${tokens.dark.onPrimary}; --success: ${tokens.dark.success}; --sparkPomo: ${tokens.dark.stickerEdge}; --edge: ${tokens.dark.edge}; --chrome: #1b1b1d; --chromeInk: #ddd; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--chrome); color: var(--chromeInk); font: 14px/1.4 -apple-system, system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px; }
h1 { font-size: 16px; font-weight: 600; margin: 0; }
.phone { width: 393px; max-width: 100%; height: 852px; border-radius: 48px; background: var(--page); position: relative; overflow: hidden; box-shadow: 0 0 0 10px #111, 0 12px 40px rgba(0,0,0,.25); display: flex; flex-direction: column; padding: 83px 24px 50px; }
.body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px; }
.box { position: relative; width: 306px; height: 225px; }
.layer, .layer img { position: absolute; inset: 0; width: 100%; height: 100%; }
.layer { backface-visibility: hidden; }
.char { position: absolute; left: 0; top: 0; }
.char img { position: absolute; inset: 0; width: 100%; height: 100%; }
.spark { position: absolute; left: 0; top: 0; width: 8px; height: 8px; border-radius: 2px; }
.line { font-family: 'Baloo 2', sans-serif; font-weight: 600; font-size: 28px; line-height: 36px; text-align: center; color: var(--ink); margin: 0; }
.start { min-height: 56px; border-radius: 999px; background: var(--primary); color: var(--onPrimary); font-size: 18px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; max-width: 520px; }
button, select { font: inherit; padding: 6px 12px; border-radius: 8px; border: 1px solid #9998; background: transparent; color: inherit; cursor: pointer; }
input[type=range] { width: 260px; }
.note { max-width: 520px; color: inherit; opacity: .75; font-size: 13px; }
</style>
</head>
<body>
<h1>The welcome, rebuilt after build 48 (F5)</h1>
<div class="phone">
  <div class="body">
    <div class="box" id="box" style="margin-top: ${Math.ceil(225 * data.headroom)}px">
      <div class="layer" id="outer" style="transform-origin: ${data.origins.diary}">
        <div class="layer" id="inner" style="transform-origin: ${data.origins.spread}">
          <div class="layer" data-layer="edge-left"><img alt=""></div>
          <div class="layer" data-layer="edge-right"><img alt=""></div>
          <div class="layer" data-layer="page-left"><img alt=""></div>
          <div class="layer" data-layer="page-right"><img alt=""></div>
          <div class="layer" data-layer="cover"><img alt=""></div>
        </div>
      </div>
      <div class="char" id="pomo"><img alt="" data-pose="idle"><img alt="" data-pose="celebrating"></div>
      <div class="char" id="doro"><img alt="" data-pose="idle"><img alt="" data-pose="celebrating"></div>
    </div>
    <p class="line" id="line">${en.welcome.updated}</p>
  </div>
  <div class="start">${en.welcome.start}</div>
</div>
<div class="controls">
  <button id="replay">Replay</button>
  <select id="speed"><option value="1">1×</option><option value="0.5">0.5×</option><option value="0.25">0.25×</option><option value="0.1">0.1×</option></select>
  <button id="theme">Dark</button>
  <input id="scrub" type="range" min="0" max="${data.duration}" step="1" value="0" aria-label="Time">
  <span id="clock">0 ms</span>
</div>
<p class="note">The app's own timeline (src/screens/welcome/choreography.ts), sampled at 60 Hz, mapped to CSS as WelcomeScreen.tsx maps it to React Native. A dot marks the haptic's frame (${data.landMs} ms). The feel on the phone is judged on build 49.</p>
<script>
const ART = ${JSON.stringify(art)};
const MASCOTS = ${JSON.stringify(mascots)};
const D = ${JSON.stringify(data)};
const box = document.getElementById('box');
const W = 306, H = 225, S = W * D.size, P = W * 3;
const $ = (id) => document.getElementById(id);
const layers = Object.fromEntries([...document.querySelectorAll('[data-layer]')].map((el) => [el.dataset.layer, el]));
let theme = 'light';
function paintArt() {
  const v = theme === 'dark' ? 'reversed' : 'colour';
  for (const [k, el] of Object.entries(layers)) el.querySelector('img').src = ART[v][k];
}
for (const who of ['pomo', 'doro']) {
  const el = $(who);
  el.style.width = S + 'px'; el.style.height = S + 'px'; el.style.transformOrigin = D.origins.character;
  el.querySelector('[data-pose=idle]').src = MASCOTS[who + '-idle'];
  el.querySelector('[data-pose=celebrating]').src = MASCOTS[who + '-celebrating'];
}
const sparks = Array.from({ length: D.frames[0].particles.length }, (_, i) => {
  const s = document.createElement('div');
  s.className = 'spark';
  s.style.background = i < D.frames[0].particles.length / 2 ? 'var(--sparkPomo)' : 'var(--success)';
  box.appendChild(s);
  return s;
});
const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
function frameAt(t) {
  const x = Math.min(Math.max(t, 0), D.duration) / D.step;
  const i = Math.min(Math.floor(x), D.frames.length - 1);
  const a = D.frames[i], b = D.frames[Math.min(i + 1, D.frames.length - 1)], f = Math.min(x - i, 1);
  // Opacity switches (the cover's hand-over) stay switches: take the nearer sample for them.
  const near = f < 0.5 ? a : b;
  const d = mix(a.d, b.d, f); d[4] = near.d[4]; d[6] = near.d[6];
  return { d, pomo: mix(a.pomo, b.pomo, f), doro: mix(a.doro, b.doro, f), particles: a.particles.map((p, k) => mix(p, b.particles[k], f)), line: mix(a.line, b.line, f) };
}
function apply(t) {
  const fr = frameAt(t);
  const [shiftX, sx, sy, coverAngle, coverOpacity, leftAngle, leftOpacity, rightOpacity, bump, dip] = fr.d;
  $('outer').style.transform = 'translateX(' + shiftX * W + 'px) scaleX(' + sx + ') scaleY(' + sy + ')';
  $('inner').style.transform = 'translateY(' + dip * H + 'px) scale(' + bump + ')';
  for (const k of ['edge-left', 'page-left']) { layers[k].style.opacity = leftOpacity; layers[k].style.transform = 'perspective(' + P + 'px) rotateY(' + leftAngle + 'deg)'; }
  for (const k of ['edge-right', 'page-right']) layers[k].style.opacity = rightOpacity;
  layers.cover.style.opacity = coverOpacity;
  layers.cover.style.transform = 'perspective(' + P + 'px) rotateY(' + coverAngle + 'deg)';
  for (const who of ['pomo', 'doro']) {
    const [x, y, csx, csy, rot, opacity, celebrate] = fr[who];
    const el = $(who);
    el.style.opacity = opacity;
    el.style.transform = 'translateX(' + (x * W - S / 2) + 'px) translateY(' + (y * H - D.feet * S) + 'px) rotate(' + rot + 'deg) scaleX(' + csx + ') scaleY(' + csy + ')';
    el.querySelector('[data-pose=celebrating]').style.opacity = celebrate;
  }
  fr.particles.forEach(([x, y, scale, rot, opacity], i) => {
    sparks[i].style.opacity = opacity;
    sparks[i].style.transform = 'translateX(' + (x * W - 4) + 'px) translateY(' + (y * H - 4) + 'px) rotate(' + rot + 'deg) scale(' + scale + ')';
  });
  $('line').style.opacity = fr.line[0];
  $('line').style.transform = 'translateY(' + fr.line[1] + 'px)';
  $('scrub').value = Math.round(t);
  $('clock').textContent = Math.round(t) + ' ms' + (Math.abs(t - D.landMs) < 40 ? ' ●' : '');
}
let startAt = 0, playing = false, speed = 1;
function tick(now) {
  if (!playing) return;
  const t = (now - startAt) * speed;
  apply(t);
  if (t >= D.duration) { playing = false; return; }
  requestAnimationFrame(tick);
}
function play() { startAt = performance.now(); playing = true; requestAnimationFrame(tick); }
$('replay').onclick = play;
$('speed').onchange = (e) => { speed = Number(e.target.value); play(); };
$('scrub').oninput = (e) => { playing = false; apply(Number(e.target.value)); };
$('theme').onclick = () => {
  theme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  $('theme').textContent = theme === 'light' ? 'Dark' : 'Light';
  paintArt();
};
paintArt();
apply(0);
setTimeout(play, 400);
</script>
</body>
</html>
`;

writeFileSync(join(root, 'art/review/d1-welcome-choreography.html'), html);
console.log(`art/review/d1-welcome-choreography.html: ${times.length} frames, ${Math.round(html.length / 1024)} KB`);
