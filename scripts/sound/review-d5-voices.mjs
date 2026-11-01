#!/usr/bin/env node
/**
 * The D5 listening page: Pomo & Doro's babble, each syllable and a sample line per character
 * written on at the tutorial's pace, with the speaker's mouth in step. The owner approves the
 * voices from it (Phase 1 D5 assets; FR-ONB-001, FR-SET-004).
 *
 *   node scripts/sound/review-d5-voices.mjs                 → art/review/d5-voices.html
 *   node scripts/sound/review-d5-voices.mjs --fragment FILE → the same page without the document wrapper
 *
 * Run scripts/sound/build.mjs first: the page shows what the build last wrote (art/sound/report.json,
 * src/assets/sounds/babble/), and reads nothing but the repo. Playback is D4's: one Web Audio
 * context created and resumed inside the first tap, each file decoded from its base64, and a line's
 * syllables scheduled on the context's clock, so nothing after the tap needs a new gesture.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tourLayers, tourSymbols } from '../art/tour-symbols.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// LF whatever the checkout's line endings, so the page is the same from any clone.
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const uri = (rel) => `data:audio/mp4;base64,${fs.readFileSync(path.join(ROOT, rel)).toString('base64')}`;
const palette = JSON.parse(read('src/theme/palette.json'));
const report = JSON.parse(read('art/sound/report.json'));
const job = JSON.parse(read('art/sound/sounds.json'));
const KIT = JSON.parse(read('art/src/tour/expressions.json'));
const baloo = /@font-face\{font-family:'Baloo 2 C2';font-weight:600;[^}]*\}/.exec(read('art/review/c2-type-specimen.html'))[0];
const sm = palette.themes.strawberryMilk.tokens;
const mp = palette.themes.midnightPlum.tokens;
const keys = ['page', 'paper', 'field', 'edge', 'edgeStrong', 'ink', 'inkSoft', 'primary', 'onPrimary', 'primaryInk', 'primarySoft', 'successInk', 'ringTrack', 'ringFocus'];
const lift = (t) => {
    const m = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(t.stickerShadow);
    const alpha = parseInt(m[2], 16) / 255;
    return `--lift:#${m[1]};--liftLayer:${(1 - Math.pow(1 - alpha, 1 / 3)).toFixed(4)}`;
};
const tok = (t) => keys.map((k) => `--${k}:${t[k]}`).join(';') + ';' + lift(t);
const num = (x, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const minus = (s) => String(s).replace(/^-/, '−');
const B = report.babble;
const PLAY = job.babble.playback;
const talk = B.talk;
const ui = B.level.uiSoundsMomentaryMaxLufs;
const uiMean = ui.reduce((a, b) => a + b, 0) / ui.length;

// The lines in Turkish, for the pace only: the level is measured on the English lines (sounds.json).
const LINES = {
    en: job.babble.lines,
    tr: {
        pomo: 'Merhaba! Biz Pomo ve Doro, sana günlüğü gezdireceğiz.',
        doro: 'Bitirdiğin her odak, bugünün sayfasına bir çıkartma yapıştırır. Bakalım mı?',
    },
};

const VOICE = {
    pomo: { name: 'Pomo', note: "Higher and bouncier. The app's own chime voice, a soft sine with a little sparkle an octave up, springing up into each note in short syllables." },
    doro: { name: 'Doro', note: 'Lower and rounder. A soft sine with a gentle triangle at the same pitch, settling onto each note in longer syllables.' },
};
const ROLE = { up: 'the question ending', down: 'the line ending' };
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const noteOf = (f) => { const p = Math.round(69 + 12 * Math.log2(f / 440)); return `${NAMES[p % 12]}${Math.floor(p / 12) - 1}`; };

/**
 * A syllable's measured pitch, drawn: the build's pitch track (every 5 ms, while the note sounds)
 * across 200 ms, on one log scale for all twelve (300 to 720 Hz), with A4 (440 Hz) dashed for reference.
 */
const LO = 300;
const HI = 720;
function contour(s) {
    const W = 120, H = 54, P = 8;
    const y = (f) => P + ((Math.log2(HI) - Math.log2(f)) / (Math.log2(HI) - Math.log2(LO))) * (H - 2 * P);
    const x = (ms) => P + (ms / 200) * (W - 2 * P);
    const pts = s.pitchTrackHz.map((f, i) => (f ? `${x(5 * i).toFixed(1)},${y(f).toFixed(1)}` : null)).filter(Boolean).join(' ');
    const [a, b] = s.pitchHz;
    return `<svg viewBox="0 0 ${W} ${H}" class="contour" role="img" aria-label="${noteOf(a)} to ${noteOf(b)}"><line x1="${P}" x2="${W - P}" y1="${y(440)}" y2="${y(440)}" class="ref"/><polyline points="${pts}" class="pitch"/></svg>`;
}

const tile = (s) => `
        <button class="syl" type="button" data-id="${s.id}" aria-label="Play ${s.id.split('-')[1]}${s.role ? `, ${ROLE[s.role]}` : ''}">
          <span class="sylname">${s.id.split('-')[1]}${s.role ? ` <small>${ROLE[s.role]}</small>` : ''}</span>
          ${contour(s)}
          <span class="sylnum">${noteOf(s.pitchHz[0])} → ${noteOf(s.pitchHz[1])} · ${s.voicedMs} ms · ${num(s.bytes / 1024, 1)} KB</span>
        </button>`;

const voiceCard = (who) => {
    const v = B.voices[who];
    const rate = 1000 / (talk.lettersPerSyllable[who] * talk.charMs);
    return `
    <article class="voice" aria-labelledby="h-${who}">
      <div class="voicehead"><h3 id="h-${who}">${VOICE[who].name}</h3><button class="pill" type="button" data-line="${who}">Play ${VOICE[who].name}'s line</button></div>
      <div class="scene"><div class="spk" id="spk-${who}"></div><div class="bubble"><b>${VOICE[who].name}</b><div class="line" id="line-${who}"></div></div></div>
      <p>${VOICE[who].note} A syllable on every ${talk.lettersPerSyllable[who] === 3 ? '3rd' : `${talk.lettersPerSyllable[who]}th`} letter, about ${num(rate, 1)} a second.</p>
      <div class="sylls">${v.syllables.map(tile).join('')}
      </div>
      <p class="small">The English line: ${v.line.syllables.length} syllables over ${num(v.line.seconds, 1)} s, at ${minus(num(v.line.momentaryMaxLufs, 1))} LUFS. Syllables ${num(Math.min(...v.syllables.map((s) => s.bytes)) / 1024, 1)}–${num(Math.max(...v.syllables.map((s) => s.bytes)) / 1024, 1)} KB of 25 KB, peaks ${minus(num(Math.max(...v.syllables.map((s) => s.decodedPeakDbfs)), 1))} dBFS at most, brightness (spectral centroid) ${num(Math.min(...v.syllables.map((s) => s.centroidHz)))}–${num(Math.max(...v.syllables.map((s) => s.centroidHz)))} Hz.</p>
    </article>`;
};

const SOUNDS = {
    ...Object.fromEntries(Object.values(B.voices).flatMap((v) => v.syllables.map((s) => [s.id, uri(s.file)]))),
    'focus-start': uri(report.sounds.find((s) => s.id === 'focus-start').file),
};
const VOICES = Object.fromEntries(Object.entries(job.babble.voices).map(([who, list]) => [who, list.map((s) => ({ id: s.id, role: s.role ?? null, mouth: s.mouth }))]));
const layers = tourLayers(ROOT);

const body = `<title>Pomo &amp; Doro Voices</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: one diary column. The two voices as paper cards side by side (stacked on a phone), each with its speaker talking over a written-on sample line and its syllables as tiles; then the level against D4's sounds, the pace, and the questions. Colours are the C1 tokens, both themes. */
${baloo}
:root { ${tok(sm)}; --display: 'Baloo 2 C2', ui-rounded, system-ui, sans-serif; --ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${tok(mp)}; color-scheme: dark; } }
:root[data-theme="dark"] { ${tok(mp)}; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.5 var(--ui); }
.wrap { max-width: 1040px; margin: 0 auto; padding-block: 36px 72px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 28px; }
h1 { font: 600 clamp(32px, 5vw, 44px)/1.05 var(--display); margin: 0; text-wrap: balance; }
h2 { font: 600 24px/1.15 var(--display); margin: 0; text-wrap: balance; }
h3 { font: 600 22px/1.15 var(--display); margin: 0; }
p { margin: 0; }
section { display: grid; gap: 14px; min-width: 0; }
.lede { color: var(--inkSoft); max-width: 66ch; margin-top: 10px; }
.bar-top { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: center; }
.pill { font: 600 15px/1 var(--ui); border: 0; border-radius: 999px; padding: 12px 20px; min-height: 44px; background: var(--primary); color: var(--onPrimary); cursor: pointer; }
.pill.on { background: var(--primaryInk); color: var(--paper); }
.pill.quiet { background: var(--paper); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--edge); }
.seg { display: inline-flex; background: var(--field); border: 1.5px solid var(--edge); border-radius: 999px; padding: 3px; }
.seg button { font: 600 14px/1 var(--ui); border: 0; background: none; color: var(--inkSoft); padding: 10px 16px; min-height: 40px; border-radius: 999px; cursor: pointer; }
.seg button[aria-pressed="true"] { background: var(--paper); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--edgeStrong); }
.pill:focus-visible, .syl:focus-visible, .seg button:focus-visible { outline: 3px solid var(--primaryInk); outline-offset: 3px; }
.hint { color: var(--inkSoft); font-size: 14px; max-width: 60ch; }
.voices { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
.voice, .panel { background: var(--paper); border: 1.5px solid var(--edge); border-radius: 22px; padding: 20px; display: grid; gap: 12px; min-width: 0; align-content: start; }
.voicehead { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
.scene { background: var(--page); border-radius: 14px; padding: 16px 12px 10px; display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: end; min-width: 0; }
.spk { width: 112px; display: flex; justify-content: center; padding-top: 18px; }
.bubble { background: var(--paper); border: 1.5px solid var(--edge); border-radius: 22px; padding: 10px 14px; display: grid; gap: 2px; align-self: center; min-width: 0; }
.bubble b { font-weight: 600; font-size: 14px; }
.bubble .line { font-size: 17px; line-height: 23px; min-height: 69px; }
.bubble .line .rest { color: transparent; }
.sylls { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; }
.syl { font: inherit; color: inherit; text-align: left; background: var(--page); border: 1.5px solid var(--edge); border-radius: 14px; padding: 8px 10px; display: grid; gap: 4px; cursor: pointer; min-height: 44px; }
.syl.on { border-color: var(--primaryInk); background: var(--primarySoft); }
.sylname { font: 600 17px/1.1 var(--display); }
.sylname small { font: 600 11px/1 var(--ui); color: var(--inkSoft); display: block; margin-top: 2px; }
.sylnum { font-size: 12px; color: var(--inkSoft); font-variant-numeric: tabular-nums; }
.contour { width: 100%; height: auto; display: block; }
.contour .ref { stroke: var(--edge); stroke-width: 1; stroke-dasharray: 3 3; }
.contour .pitch { fill: none; stroke: var(--ringFocus); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.small { color: var(--inkSoft); font-size: 13px; font-variant-numeric: tabular-nums; }
.stk { display: block; }
.stk .lift { color: var(--lift); }
.stk .sl { opacity: var(--liftLayer); }
.meters { display: grid; gap: 8px; }
.meter { display: grid; grid-template-columns: minmax(120px, 180px) 1fr 92px; gap: 10px; align-items: center; font-size: 14px; }
.meter .bar { height: 10px; border-radius: 999px; background: var(--ringTrack); overflow: hidden; }
.meter .bar i { display: block; height: 100%; border-radius: 999px; background: var(--successInk); }
.meter.ui .bar i { background: var(--edgeStrong); }
.meter .mv { text-align: right; font-variant-numeric: tabular-nums; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
.tablewrap { overflow-x: auto; background: var(--paper); border: 1.5px solid var(--edge); border-radius: 14px; }
th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--edge); font-variant-numeric: tabular-nums; }
tr:last-child td { border-bottom: 0; }
th { color: var(--inkSoft); font-size: 13px; font-weight: 600; }
.changed { background: var(--paper); border: 1.5px solid var(--edge); border-radius: 22px; padding: 20px; }
.changed p { max-width: 70ch; }
.ask { background: var(--primarySoft); border-radius: 22px; padding: 20px; display: grid; gap: 10px; }
.ask ol { margin: 0; padding-left: 22px; display: grid; gap: 10px; max-width: 72ch; }
footer { color: var(--inkSoft); font-size: 13px; display: grid; gap: 6px; }
code { font-size: 12px; overflow-wrap: anywhere; }
@media (max-width: 480px) { .meter { grid-template-columns: 1fr 80px; } .meter .bar { grid-column: 1 / -1; grid-row: 2; } }
@media (prefers-reduced-motion: no-preference) { .pill, .syl { transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1); } .pill:active, .syl:active { transform: scale(0.97); } }
</style>
${tourSymbols(layers)}
<div class="wrap">
  <header>
    <h1>How Pomo &amp; Doro talk</h1>
    <p class="lede">Phase 1, D5. The babble the pair speak in while their lines write on in the tutorial: a few made-up syllables each, synthesised in SoundCraft from its built-in synths, with no samples, no human voice and no words. Please listen on your phone's speaker as well as on headphones.</p>
  </header>

  <section class="changed" aria-labelledby="h-changed">
    <h2 id="h-changed">Version 2: softer</h2>
    <p>You said version 1 was too high-pitched and could hurt if it came out of the blue. So both voices now use the soft chime voice of the app's other sounds instead of a square wave, and sit about an octave lower: the highest note is E5 (659 Hz), where version 1 reached C♯6 (1,109 Hz). Nothing is boosted around 2 to 3 kHz any more, where the ear is most sensitive; the syllables start more gently, carry a touch of the chimes' small reverb, and play 2 LU quieter. Their brightness (spectral centroid) went from 0.5–1.3 kHz to ${num(Math.min(...Object.values(B.voices).flatMap((v) => v.syllables.map((s) => s.centroidHz))) / 1000, 2)}–${num(Math.max(...Object.values(B.voices).flatMap((v) => v.syllables.map((s) => s.centroidHz))) / 1000, 2)} kHz. The bouncy glides stay: they are the cute part.</p>
  </section>

  <section class="changed" aria-labelledby="h-notes">
    <h2 id="h-notes">Your sound-design notes, applied to version 2</h2>
    <p>Version 3 is gone: these are version 2's files, exactly. Your notes' main cure for a robotic babble is variation when each syllable plays, so that is what's new, and it changes nothing in the files:</p>
    <ul>
      <li><b>New: a little variation on every syllable.</b> Each one plays a tiny bit higher or lower (a random ±${PLAY.detuneCents} cents, a tenth of a semitone at most) and a touch louder or softer (±${num(PLAY.gainDb, 1)} dB), drawn fresh every time, so a line never repeats exactly. Use the switch to hear it against plain version 2.</li>
      <li><b>Already in version 2:</b> a soft, warm tone with nothing in the harsh 2–4 kHz band; soft starts and gentle tails; a small set of syllables, never the same one twice running; a syllable on every 3rd or 4th letter, resting at commas and full stops; and babble that lasts as long as the line does.</li>
      <li><b>Not used:</b> recording voices or animal sounds. The app's rule is that every sound is synthesised in SoundCraft, with no samples and never a human voice.</li>
    </ul>
  </section>

  <div class="bar-top">
    <button class="pill" type="button" id="play-both">Play both lines</button>
    <span class="hint" id="l-vary">Variation</span>
    <div class="seg" role="group" aria-labelledby="l-vary"><button type="button" id="vary-on" aria-pressed="true">On</button><button type="button" id="vary-off" aria-pressed="false">Off, plain version 2</button></div>
    <span class="hint" id="l-lang">Lines in</span>
    <div class="seg" role="group" aria-labelledby="l-lang"><button type="button" id="lang-en" aria-pressed="true">English</button><button type="button" id="lang-tr" aria-pressed="false">Türkçe</button></div>
    <span class="hint">If you hear nothing on an iPhone, check the ring switch: the app itself will stay quiet on silent.</span>
  </div>

  <section class="voices" aria-label="The two voices">${voiceCard('pomo')}${voiceCard('doro')}
  </section>

  <section aria-labelledby="h-level">
    <h2 id="h-level">Level</h2>
    <p class="lede">A little below the app's other sounds, so the babble sits under them. Each syllable is brought to one loudness, then each voice is set so its sample line measures ${minus(num(B.level.streamMomentaryLufs, 1))} LUFS on the same meter as D4's sounds (the loudest 400 ms): about ${num(uiMean - B.level.streamMomentaryLufs, 1)} LU under them. Every peak stays under D4's −1 dBFS.</p>
    <div class="panel">
      <div class="meters">${report.sounds.map((s) => `
        <div class="meter ui"><span>D4, ${s.id.replace('-', ' ')}</span><span class="bar" aria-hidden="true"><i style="width:${(((s.momentaryMaxLufs + 30) / 20) * 100).toFixed(1)}%"></i></span><span class="mv">${minus(num(s.momentaryMaxLufs, 1))} LUFS</span></div>`).join('')}${Object.entries(B.voices).map(([who, v]) => `
        <div class="meter"><span>${VOICE[who].name}'s line</span><span class="bar" aria-hidden="true"><i style="width:${(((v.line.momentaryMaxLufs + 30) / 20) * 100).toFixed(1)}%"></i></span><span class="mv">${minus(num(v.line.momentaryMaxLufs, 1))} LUFS</span></div>`).join('')}
      </div>
      <p class="small">Bars run from −30 to −10 LUFS. One step of 1 LU is about the smallest change most people notice.</p>
      <div class="bar-top"><button class="pill quiet" type="button" id="play-level">Hear focus start, then both lines</button></div>
    </div>
  </section>

  <section aria-labelledby="h-pace">
    <h2 id="h-pace">Pace</h2>
    <p class="lede">The tutorial didn't have a write-on speed yet, so this is the proposal, the same one the pose sheet plays.</p>
    <div class="tablewrap"><table>
      <thead><tr><th scope="col">What</th><th scope="col">Proposed</th></tr></thead>
      <tbody>
        <tr><td>Write-on</td><td>One character every ${talk.charMs} ms: ${num(1000 / talk.charMs, 1)} a second, about adult reading speed, so the line keeps up with the eye</td></tr>
        <tr><td>Pauses</td><td>${talk.pauseMs.comma} ms after a comma; ${talk.pauseMs.stop} ms after a full stop, question or exclamation mark inside the line</td></tr>
        <tr><td>Syllables</td><td>Pomo on every 3rd letter (about ${num(1000 / (3 * talk.charMs), 1)} a second), Doro on every 4th (about ${num(1000 / (4 * talk.charMs), 1)}); the count starts again after each pause, and the last syllable rises for a question and falls otherwise</td></tr>
        <tr><td>A full line</td><td>The longest allowed (90 characters in English, 110 in Turkish) takes about ${num((90 * talk.charMs) / 1000, 1)} s and ${num((110 * talk.charMs) / 1000, 1)} s plus pauses. A tap on the bubble finishes it at once</td></tr>
      </tbody>
    </table></div>
  </section>

  <section class="ask" aria-labelledby="h-ask">
    <h2 id="h-ask">For you to decide</h2>
    <ol>
      <li><b>The voices.</b> Are they soft and pleasant now, and still cute: clearly not a person, Pomo higher and bouncier, Doro lower and rounder? Should either be softer still, lower, slower or a different pitch?</li>
      <li><b>The level.</b> Is the babble at the right loudness next to focus start, or should it sit higher or lower?</li>
      <li><b>The pace.</b> Is ${num(1000 / talk.charMs, 1)} characters a second right for the write-on, or should it be faster or slower?</li>
      <li><b>The variation.</b> Keep it on, or plain version 2? Your notes also suggest the babble change with the mood. Pomo &amp; Doro already change face, so it could follow them: a little higher when happy or excited, and higher still when surprised. Want that tried?</li>
    </ol>
  </section>

  <footer>
    <p>Every figure comes from <code>art/sound/report.json</code>, written by <code>node scripts/sound/build.mjs</code>, which rebuilds each syllable from its script in <code>art/sound/babble/</code> (written by <code>node scripts/sound/babble-scripts.mjs</code>); <code>--check</code> compares the rebuild with the shipped files byte for byte. Pitches are measured from the shipped files, at the start and the end of each syllable. Sizes are in KB of 1,024 bytes, as the 25 KB budget is. Made with ${report.tools.soundcraft.replace(/ \(.*\)$/, '')} and ${report.tools.ffmpeg.replace(/^ffmpeg version /, 'ffmpeg ').replace(/-full_build.*$/, '')}. This page is <code>node scripts/sound/review-d5-voices.mjs</code>.</p>
  </footer>
</div>
<script>
const KIT = ${JSON.stringify(KIT)};
${read('scripts/art/tour-motion.js')}
</script>
<script>
(() => {
  // Every sound plays through one Web Audio context, created and resumed inside the first tap (iOS
  // unlocks audio only there). Each data URI is decoded straight from its base64, and a line's
  // syllables are scheduled on the context's own clock, so nothing after the tap needs a new gesture.
  const SOUNDS = ${JSON.stringify(SOUNDS)};
  const VOICES = ${JSON.stringify(VOICES)};
  const ORDER = ${JSON.stringify(job.babble.order)};
  const LINES = ${JSON.stringify(LINES)};
  const COUNTS = ${JSON.stringify(Object.fromEntries(Object.entries(B.voices).map(([w, v]) => [w, v.line.syllables.length])))};
  const T = window.TourMotion;
  let lang = 'en';
  let ctx = null;
  const buffers = {};
  let nodes = [];
  let timers = [];

  function unlock() {
    if (!ctx) {
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
  }
  function bytesOf(uri) {
    const bin = atob(uri.slice(uri.indexOf(',') + 1));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }
  function decode(id) {
    if (!buffers[id]) buffers[id] = new Promise((resolve, reject) => ctx.decodeAudioData(bytesOf(SOUNDS[id]), resolve, reject));
    return buffers[id];
  }
  const decodeAll = () => Promise.all(Object.keys(SOUNDS).map(decode));
  function stopAll() {
    nodes.forEach((n) => { try { n.stop(); } catch (e) {} });
    nodes = [];
    timers.forEach(clearTimeout);
    timers = [];
    document.querySelectorAll('.on').forEach((b) => b.classList.remove('on'));
    for (const who of Object.keys(speakers)) { T.set(speakers[who], 'rest'); writing[who] = null; }
  }
  // The playback variation (sounds.json babble.playback): a pitch shift in cents, made with the
  // playback rate (2^(cents/1200), which also stretches the syllable by under 0.6 %), and a gain in dB.
  const PLAY = ${JSON.stringify({ detuneCents: PLAY.detuneCents, gainDb: PLAY.gainDb })};
  let vary = true;
  const spread = (x) => (Math.random() * 2 - 1) * x;
  function play(id, when, { cents = 0, gainDb = 0 } = {}) {
    const node = ctx.createBufferSource();
    return decode(id).then((buffer) => {
      node.buffer = buffer;
      node.playbackRate.value = Math.pow(2, cents / 1200);
      const gain = ctx.createGain();
      gain.gain.value = Math.pow(10, gainDb / 20);
      node.connect(gain);
      gain.connect(ctx.destination);
      node.start(when);
      nodes.push(node);
      node.onended = () => { nodes = nodes.filter((n) => n !== node); };
      return buffer.duration;
    });
  }

  // ── The speakers ──
  const speakers = {};
  const writing = {};
  for (const who of ['pomo', 'doro']) {
    const s = T.create(who, who === 'pomo' ? 104 : 96, { expr: 'rest' });
    s.svg.style.marginBottom = (-(512 - KIT.feet[who][1]) / 512 * s.px) + 'px';
    document.getElementById('spk-' + who).appendChild(s.svg);
    speakers[who] = s;
  }
  function showLine(who, text) { document.getElementById('line-' + who).textContent = text; }
  for (const who of ['pomo', 'doro']) showLine(who, LINES.en[who]);

  /**
   * One line, sound and sight together: the write-on's syllable slots (the tutorial's rule, from
   * tour-motion.js), the body syllables in ORDER and the line-end syllable last, as the build's
   * level measurement renders it; each starts on the audio clock, and the mouth and the text follow
   * on the page's clock from the same moment.
   */
  async function speak(who, whenAudio) {
    const text = LINES[lang][who];
    const w = T.writeOn(text, who);
    if (lang === 'en' && w.syllables.length !== COUNTS[who]) console.warn('the page and the build count different syllables', who, w.syllables.length, COUNTS[who]);
    const list = VOICES[who];
    const body = list.filter((s) => !s.role);
    const picks = w.syllables.map((syl, i) => (i === w.syllables.length - 1 ? list.find((s) => s.role === syl.end) : body[ORDER[i % ORDER.length]]));
    await Promise.all(picks.map((p, i) => play(p.id, whenAudio + w.syllables[i].t / 1000, vary ? { cents: spread(PLAY.detuneCents), gainDb: spread(PLAY.gainDb) } : {})));
    const startPage = performance.now() + (whenAudio - ctx.currentTime) * 1000;
    timers.push(setTimeout(() => {
      const now = performance.now();
      T.set(speakers[who], 'talking', { now });
      T.say(speakers[who], text, now, picks.map((p) => p.mouth));
      writing[who] = { text, chars: w.chars, start: now };
      document.querySelector('[data-line="' + who + '"]').classList.add('on');
    }, Math.max(0, startPage - performance.now())));
    timers.push(setTimeout(() => {
      T.set(speakers[who], 'happy');
      document.querySelector('[data-line="' + who + '"]').classList.remove('on');
    }, Math.max(0, startPage - performance.now()) + w.length + 250));
    return w.length / 1000;
  }
  T.onFrame((now) => {
    for (const who of Object.keys(writing)) {
      const wr = writing[who];
      if (!wr) continue;
      const shown = wr.chars.filter((t) => now - wr.start >= t).length;
      const el = document.getElementById('line-' + who);
      const chars = [...wr.text];
      el.textContent = chars.slice(0, shown).join('');
      const rest = document.createElement('span');
      rest.className = 'rest';
      rest.textContent = chars.slice(shown).join('');
      el.appendChild(rest);
      if (shown >= chars.length) writing[who] = null;
    }
  });

  async function run(steps) {
    const ready = unlock();
    stopAll();
    try {
      await ready;
      await decodeAll();
      let t = ctx.currentTime + 0.08;
      for (const step of steps) {
        if (step === 'focus-start') t += (await play('focus-start', t)) + 0.9;
        else t += (await speak(step, t)) + 0.9;
      }
    } catch (e) {
      document.getElementById('play-both').textContent = 'This browser could not play them';
    }
  }
  function setVary(v) {
    vary = v;
    document.getElementById('vary-on').setAttribute('aria-pressed', String(v));
    document.getElementById('vary-off').setAttribute('aria-pressed', String(!v));
  }
  document.getElementById('vary-on').addEventListener('click', () => setVary(true));
  document.getElementById('vary-off').addEventListener('click', () => setVary(false));
  document.getElementById('play-both').addEventListener('click', () => run(['pomo', 'doro']));
  document.getElementById('play-level').addEventListener('click', () => run(['focus-start', 'pomo', 'doro']));
  document.querySelectorAll('[data-line]').forEach((b) => b.addEventListener('click', () => run([b.dataset.line])));
  document.querySelectorAll('.syl').forEach((b) => b.addEventListener('click', async () => {
    const ready = unlock();
    stopAll();
    try {
      await ready;
      await play(b.dataset.id, ctx.currentTime + 0.02);
      b.classList.add('on');
      timers.push(setTimeout(() => b.classList.remove('on'), 400));
    } catch (e) {
      b.setAttribute('aria-label', 'This browser could not play it');
    }
  }));
  function setLang(l) {
    lang = l;
    document.getElementById('lang-en').setAttribute('aria-pressed', String(l === 'en'));
    document.getElementById('lang-tr').setAttribute('aria-pressed', String(l === 'tr'));
    stopAll();
    for (const who of ['pomo', 'doro']) showLine(who, LINES[l][who]);
  }
  document.getElementById('lang-en').addEventListener('click', () => setLang('en'));
  document.getElementById('lang-tr').addEventListener('click', () => setLang('tr'));
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  T.reduce = rm.matches;
  rm.addEventListener?.('change', () => { T.reduce = rm.matches; });
})();
</script>
`;

const fragmentAt = process.argv.indexOf('--fragment');
if (fragmentAt !== -1) {
    fs.writeFileSync(process.argv[fragmentAt + 1], body);
} else {
    const out = path.join(ROOT, 'art/review/d5-voices.html');
    fs.writeFileSync(out, '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + body.replace('</style>', '</style></head><body>') + '</body></html>\n');
    console.log(`wrote ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);
}
