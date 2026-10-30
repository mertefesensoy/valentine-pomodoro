#!/usr/bin/env node
/**
 * The D4 listening page: the three UI sounds and Fly's loop, each embedded as a data URI, with the
 * numbers from art/sound/report.json and each sound's notes as drawn from its script. The owner
 * approves the sounds from it (Phase 1 D4; FR-SET-004).
 *
 *   node scripts/sound/review.mjs                 → art/review/d4-sounds.html
 *   node scripts/sound/review.mjs --fragment FILE → the same page without the document wrapper
 *
 * Run scripts/sound/build.mjs first: the page shows what the build last wrote, and reads nothing
 * but the repo. Fly's original is art/sound/source/fly-ambient.m4a, today's shipped file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const uri = (rel) => `data:audio/mp4;base64,${fs.readFileSync(path.join(ROOT, rel)).toString('base64')}`;
const palette = JSON.parse(read('src/theme/palette.json'));
const report = JSON.parse(read('art/sound/report.json'));
const job = JSON.parse(read('art/sound/sounds.json'));
const baloo = /@font-face\{font-family:'Baloo 2 C2';font-weight:600;[^}]*\}/.exec(read('art/review/c2-type-specimen.html'))[0];
const sm = palette.themes.strawberryMilk.tokens;
const mp = palette.themes.midnightPlum.tokens;
const keys = ['page', 'paper', 'field', 'edge', 'edgeStrong', 'ink', 'inkSoft', 'primary', 'onPrimary', 'primaryInk', 'primarySoft', 'accentInk', 'successInk', 'ringTrack'];
const tok = (t) => keys.map((k) => `--${k}:${t[k]}`).join(';');
const num = (x, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const minus = (s) => String(s).replace(/^-/, '−');

const COPY = {
    'focus-start': { name: 'Focus start', gesture: 'Two soft notes rising a fifth, C5 to G5. The phrase stays open, because the work is ahead.' },
    'break-start': { name: 'Break start', gesture: 'Three notes stepping down to C5 and growing quieter: the exhale. It comes back to rest where focus start left off.' },
    complete: { name: 'Completion', gesture: 'A soft pop as the sticker is pressed on, then the notes climb to C6: the arc finished an octave up. The one delight.' },
};

/** The notes of a script: [{ ms, pitch, velocity, drum }], from its tempo (960 ticks per quarter) and note lines. */
function notesOf(scriptRel) {
    const text = read(scriptRel);
    const bpm = Number(/event\.tempo \{"bpm": ([\d.]+)\}/.exec(text)[1]);
    const drumClips = new Set();
    const clips = [...text.matchAll(/^midi\.new_clip \{"track": "([^"]+)"/gm)].map((m) => m[1]);
    const tracks = Object.fromEntries([...text.matchAll(/^track\.new \{.*"name": "([^"]+)", "instrument": "([^"]+)"\}/gm)].map((m) => [m[1], m[2]]));
    // Clip ids follow the track ids: n tracks take ids 1..n, so the k-th clip is id n + k.
    clips.forEach((track, k) => { if (tracks[track] === 'drum_synth') drumClips.add(Object.keys(tracks).length + 1 + k); });
    return [...text.matchAll(/^midi\.note_add \{"clip": (\d+), "pitch": (\d+), "start_ticks": (\d+), "length_ticks": \d+, "velocity": (\d+)\}/gm)].map((m) => ({
        ms: (Number(m[3]) * 60000) / (bpm * 960),
        pitch: Number(m[2]),
        velocity: Number(m[4]),
        drum: drumClips.has(Number(m[1])),
    }));
}

/** Bytes in an MP4's top-level `free` boxes: padding that holds no sound. */
function paddingBytes(rel) {
    const b = fs.readFileSync(path.join(ROOT, rel));
    let free = 0;
    for (let i = 0; i + 8 <= b.length;) {
        const n = b.readUInt32BE(i);
        if (b.toString('latin1', i + 4, i + 8) === 'free') free += n;
        i += n || b.length;
    }
    return free;
}

const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const noteName = (p) => `${NAMES[p % 12]}${Math.floor(p / 12) - 1}`;

/** The melody as dots: time across (0 to the sound's length), pitch up; the pop sits on the floor. */
function melody(sound) {
    const W = 280, H = 96, L = 8, R = 30, T = 14, B = 22;
    const notes = notesOf(job.sounds.find((s) => s.id === sound.id).script);
    const x = (ms) => L + (ms / (sound.seconds * 1000)) * (W - L - R);
    const y = (p) => T + ((89 - p) / (89 - 71)) * (H - T - B);
    const dots = notes.map((n) => n.drum
        ? `<rect x="${(x(n.ms) - 4).toFixed(1)}" y="${H - B + 4}" width="8" height="8" rx="2" class="pop"><title>pop at ${num(n.ms)} ms</title></rect><text x="${(x(n.ms) + 8).toFixed(1)}" y="${H - B + 11}" class="lab">pop</text>`
        : `<circle cx="${x(n.ms).toFixed(1)}" cy="${y(n.pitch).toFixed(1)}" r="${(2.5 + n.velocity / 30).toFixed(1)}" class="dot"><title>${noteName(n.pitch)} at ${num(n.ms)} ms</title></circle><text x="${(x(n.ms) + 8).toFixed(1)}" y="${(y(n.pitch) + 4).toFixed(1)}" class="lab">${noteName(n.pitch)}</text>`).join('');
    const end = x(sound.seconds * 1000);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${notes.filter((n) => !n.drum).map((n) => noteName(n.pitch)).join(', ')}">
      <line x1="${L}" y1="${H - B}" x2="${end}" y2="${H - B}" class="axis"/>
      <text x="${L}" y="${H - 2}" class="lab">0</text><text x="${end}" y="${H - 2}" class="lab" text-anchor="end">${num(sound.seconds, 2)} s</text>
      ${dots}</svg>`;
}

const meter = (label, value, max, unit, shown) => `
      <div class="meter"><span class="ml">${label}</span><span class="bar" aria-hidden="true"><i style="width:${Math.min(100, (value / max) * 100).toFixed(1)}%"></i></span><span class="mv">${shown} <small>of ${num(max, unit === 's' ? 1 : 0)} ${unit}</small></span></div>`;

const soundCard = (s) => `
    <article class="sound" aria-labelledby="h-${s.id}">
      <div class="head">
        <button class="play" type="button" data-src="${s.id}" id="play-${s.id}" aria-label="Play ${COPY[s.id].name}"><span class="tri" aria-hidden="true"></span></button>
        <div><h3 id="h-${s.id}">${COPY[s.id].name}</h3><p class="when">${s.use}</p></div>
      </div>
      <p>${COPY[s.id].gesture}</p>
      ${melody(s)}
      ${meter('Length', s.seconds, report.budget.seconds, 's', `${num(s.seconds, 2)} s`)}
      ${meter('Size', s.bytes / 1024, report.budget.bytes / 1024, 'KB', `${num(s.bytes / 1024, 1)} KB`)}
      <dl class="figs">
        <div><dt>Peak, decoded</dt><dd>${minus(num(s.decodedPeakDbfs, 3))} dBFS</dd></div>
        <div><dt>Loudness</dt><dd>${minus(num(s.momentaryMaxLufs, 1))} LUFS</dd></div>
      </dl>
    </article>`;

const fly = report.loops.find((l) => l.id === 'fly-ambient');
const seamless = report.loops.find((l) => l.id === 'fly-ambient-seamless');
const flyRow = (id, title, note, file, figs) => `
    <article class="loop" aria-labelledby="h-${id}">
      <div class="loophead"><h3 id="h-${id}">${title}</h3><button class="seam" type="button" data-loop="${id}" id="seam-${id}">Hear the loop point</button></div>
      <p>${note}</p>
      <audio controls preload="none" src="${uri(file)}" id="audio-${id}"></audio>
      <p class="small">${figs}</p>
    </article>`;

const sounds = Object.fromEntries(report.sounds.map((s) => [s.id, uri(s.file)]));

const body = `<title>D4 sounds</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: one diary column; the three sounds as paper cards side by side (stacked on a phone), Fly's three versions as rows under them, then what to confirm. Colours are the C1 tokens, both themes. */
${baloo}
:root { ${tok(sm)}; --display: 'Baloo 2 C2', ui-rounded, system-ui, sans-serif; --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${tok(mp)}; color-scheme: dark; } }
:root[data-theme="dark"] { ${tok(mp)}; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.5 var(--ui); }
.wrap { max-width: 1040px; margin: 0 auto; padding-block: 36px 72px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 28px; }
h1 { font: 600 clamp(32px, 5vw, 44px)/1.05 var(--display); margin: 0; text-wrap: balance; }
h2 { font: 600 24px/1.15 var(--display); margin: 0; text-wrap: balance; }
h3 { font: 600 20px/1.15 var(--display); margin: 0; }
p { margin: 0; }
.lede { color: var(--inkSoft); max-width: 66ch; margin-top: 10px; }
.bar-top { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: center; }
.pill { font: 600 15px/1 var(--ui); border: 0; border-radius: 999px; padding: 12px 20px; min-height: 44px; background: var(--primary); color: var(--onPrimary); cursor: pointer; }
.pill:focus-visible, .play:focus-visible, .seam:focus-visible { outline: 3px solid var(--primaryInk); outline-offset: 3px; }
.hint { color: var(--inkSoft); font-size: 14px; }
.sounds { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.sound, .loop, .panel { background: var(--paper); border: 1px solid var(--edge); border-radius: 22px; padding: 20px; display: grid; gap: 12px; min-width: 0; align-content: start; }
.head { display: flex; gap: 14px; align-items: center; }
.when { color: var(--inkSoft); font-size: 14px; }
.play { flex: none; width: 52px; height: 52px; border-radius: 50%; border: 0; background: var(--primary); cursor: pointer; display: grid; place-items: center; }
.play .tri { width: 0; height: 0; border-style: solid; border-width: 9px 0 9px 15px; border-color: transparent transparent transparent var(--onPrimary); margin-left: 4px; }
.play.on { background: var(--primaryInk); }
.play.on .tri { border-left-color: var(--paper); }
svg { width: 100%; height: auto; display: block; background: var(--field); border-radius: 14px; }
svg .axis { stroke: var(--edgeStrong); stroke-width: 1; }
svg .dot { fill: var(--primaryInk); }
svg .pop { fill: var(--accentInk); }
svg .lab { fill: var(--inkSoft); font: 600 10px var(--ui); }
.meter { display: grid; grid-template-columns: 52px 1fr auto; gap: 10px; align-items: center; font-size: 14px; }
.ml { color: var(--inkSoft); }
.bar { height: 8px; border-radius: 999px; background: var(--ringTrack); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--successInk); border-radius: 999px; }
.mv, .figs dd { font-variant-numeric: tabular-nums; }
.mv small { color: var(--inkSoft); font-size: 12px; }
.figs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0; }
.figs div { background: var(--field); border-radius: 14px; padding: 8px 12px; }
.figs dt { color: var(--inkSoft); font-size: 12px; }
.figs dd { margin: 0; font-weight: 600; }
.loops { display: grid; gap: 12px; }
.loophead { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; }
.seam { font: 600 14px/1 var(--ui); border: 1px solid var(--edgeStrong); border-radius: 999px; padding: 10px 16px; min-height: 44px; background: var(--paper); color: var(--ink); cursor: pointer; }
.seam.on { background: var(--primarySoft); border-color: var(--primaryInk); }
audio { width: 100%; }
.small { color: var(--inkSoft); font-size: 13px; font-variant-numeric: tabular-nums; }
.ask { background: var(--primarySoft); border-radius: 22px; padding: 20px; display: grid; gap: 10px; }
.ask ol { margin: 0; padding-left: 22px; display: grid; gap: 8px; }
footer { color: var(--inkSoft); font-size: 13px; display: grid; gap: 6px; }
code { font-size: 12px; overflow-wrap: anywhere; }
@media (prefers-reduced-motion: no-preference) { .play, .pill, .seam { transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1); } .play:active, .pill:active, .seam:active { transform: scale(0.97); } }
</style>
<div class="wrap">
  <header>
    <h1>Three small sounds, and Fly's loop</h1>
    <p class="lede">Phase 1, D4. Focus start, break start and completion, made in SoundCraft from its built-in synths only, so nothing needs a licence. They'll be heard in libraries and in bed, so they are short, soft and low in the register, and none of them is an alarm. Please listen on your phone's speaker as well as on headphones.</p>
  </header>

  <div class="bar-top">
    <button class="pill" type="button" id="play-set">Play all three in order</button>
    <span class="hint">Focus start, break start, then completion, with a pause between each.</span>
  </div>

  <section class="sounds" aria-label="The three sounds">${report.sounds.map(soundCard).join('')}
  </section>

  <section class="loops" aria-labelledby="h-fly">
    <h2 id="h-fly">Fly's ambient loop</h2>
    <p class="lede">Today's file is ${num(fly.source.bytes / 1024 / 1024, 2)} MB, of which ${num(paddingBytes(fly.source.file) / 1024)} KB is empty padding. Re-encoded as mono AAC at 64 kbit/s it is ${num(fly.bytes / 1024)} KB. One thing turned up: the recording has never looped cleanly. It opens with 112 ms of silence and a fade-in, and it ends on a hard cut, so every 70 seconds Fly's sound drops out for a moment and clicks. "Hear the loop point" plays the last four seconds and runs on into the start.</p>
    ${flyRow('original', "Today's file", 'What ships in v1.3.1, unchanged.', fly.source.file, `${num(fly.source.bytes / 1024)} KB · 96 kbit/s · ${num(fly.seam.sourceSamples / fly.sampleRate, 1)} s`)}
    ${flyRow('faithful', 'Re-encoded, same loop', 'The file this branch ships now: the same sound and the same dropout at the loop point.', fly.file, `${num(fly.bytes / 1024)} KB · ${num(fly.bitrate / 1000)} kbit/s · ${num(fly.samples / fly.sampleRate, 1)} s · same ${num(fly.samples)} samples, no time shift`)}
    ${flyRow('seamless', 'Re-encoded, seamless loop', `A suggestion for you to decide: the first ${num(seamless.seamless.trimStartSeconds, 2)} s (the silence and the fade-in) are trimmed, and the last ${num(seamless.seamless.crossfadeSeconds, 2)} s fade into the start, so it wraps with no gap. It is ${num((fly.samples - seamless.samples) / fly.sampleRate, 1)} s shorter.`, seamless.file, `${num(seamless.bytes / 1024)} KB · ${num(seamless.bitrate / 1000)} kbit/s · ${num(seamless.samples / seamless.sampleRate, 1)} s · start and end within ${num(Math.abs(seamless.seam.edgeRmsDbfs[0] - seamless.seam.edgeRmsDbfs[1]), 2)} dB of each other`)}
    <p class="small">The app restarts a loop by seeking to the start, which can add a short gap of its own on the phone. These buttons play each file's own join, with nothing added.</p>
  </section>

  <section class="ask" aria-labelledby="h-ask">
    <h2 id="h-ask">Please tell me</h2>
    <ol>
      <li>The three sounds: are they right as they are, or should any be softer, brighter, shorter or a different tune?</li>
      <li>Fly's loop: keep today's loop as it is, or use the seamless one?</li>
      <li>Does Fly at 64 kbit/s sound the same to you as today's file?</li>
    </ol>
    <p>Reply in the chat. Your words go into the D4 record as you write them.</p>
  </section>

  <footer>
    <p>Every figure comes from <code>art/sound/report.json</code>, written by <code>node scripts/sound/build.mjs</code>, which rebuilds each sound from its script in <code>art/sound/</code>; <code>--check</code> compares the rebuild with these files byte for byte. Loudness is the momentary maximum (EBU R 128, a 400 ms window), the fair comparison for sounds this short. Peaks are each sound decoded from the shipped file. Made with ${report.tools.soundcraft.replace(/ \(.*\)$/, '')} and ${report.tools.ffmpeg.replace(/^ffmpeg version /, 'ffmpeg ').replace(/-full_build.*$/, '')}.</p>
  </footer>
</div>
<script>
const SOUNDS = ${JSON.stringify(sounds)};
let playing = null;
let ctx = null;
let source = null;
const buffers = {};

function stopAll() {
  if (playing) { playing.audio.pause(); playing.button.classList.remove('on'); playing = null; }
  if (source) { try { source.node.stop(); } catch (e) {} source.button.classList.remove('on'); source.button.textContent = 'Hear the loop point'; source = null; }
  document.querySelectorAll('audio').forEach((a) => a.pause());
}

function play(id) {
  return new Promise((resolve) => {
    const button = document.getElementById('play-' + id);
    const audio = new Audio(SOUNDS[id]);
    playing = { audio, button };
    button.classList.add('on');
    audio.addEventListener('ended', () => { button.classList.remove('on'); if (playing && playing.audio === audio) playing = null; resolve(true); });
    audio.play().catch(() => { button.classList.remove('on'); resolve(false); });
  });
}

document.querySelectorAll('.play').forEach((b) => b.addEventListener('click', () => {
  const again = playing && playing.button === b;
  stopAll();
  if (!again) play(b.dataset.src);
}));

document.getElementById('play-set').addEventListener('click', async () => {
  stopAll();
  for (const id of ['focus-start', 'break-start', 'complete']) {
    if (!(await play(id))) return;
    await new Promise((r) => setTimeout(r, 1200));
  }
});

async function loopPoint(button) {
  const id = button.dataset.loop;
  if (source && source.button === button) { stopAll(); return; }
  stopAll();
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') await ctx.resume();
    button.textContent = 'Loading…';
    // The loop's data URI lives once, on its <audio> element.
    if (!buffers[id]) buffers[id] = await ctx.decodeAudioData(await (await fetch(document.getElementById('audio-' + id).src)).arrayBuffer());
    const buf = buffers[id];
    const node = ctx.createBufferSource();
    node.buffer = buf;
    node.loop = true;
    node.connect(ctx.destination);
    node.start(0, Math.max(0, buf.duration - 4));
    node.stop(ctx.currentTime + 8);
    source = { node, button };
    button.classList.add('on');
    button.textContent = 'Stop';
    node.onended = () => { if (source && source.node === node) { button.classList.remove('on'); button.textContent = 'Hear the loop point'; source = null; } };
  } catch (e) {
    button.textContent = 'This browser could not play it';
  }
}
document.querySelectorAll('.seam').forEach((b) => b.addEventListener('click', () => loopPoint(b)));
document.querySelectorAll('audio').forEach((a) => a.addEventListener('play', () => {
  if (playing) { playing.audio.pause(); playing.button.classList.remove('on'); playing = null; }
  if (source) { try { source.node.stop(); } catch (e) {} }
  document.querySelectorAll('audio').forEach((o) => { if (o !== a) o.pause(); });
}));
</script>
`;

const fragmentAt = process.argv.indexOf('--fragment');
if (fragmentAt !== -1) {
    fs.writeFileSync(process.argv[fragmentAt + 1], body);
} else {
    const out = path.join(ROOT, 'art/review/d4-sounds.html');
    fs.writeFileSync(out, '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style></head><body>') + '</body></html>\n');
    console.log(`wrote ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);
}
