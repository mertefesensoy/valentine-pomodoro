#!/usr/bin/env node
/**
 * babble-scripts.mjs — the sources of Pomo & Doro's babble, one soundcraft-cli script per syllable
 * (Phase 1 D5 assets; FR-ONB-001, FR-SET-004, NFR-PERF-005; ADR-0027).
 *
 *   node scripts/sound/babble-scripts.mjs           write art/sound/babble/<id>.script
 *   node scripts/sound/babble-scripts.mjs --check   regenerate in memory and compare; exit 1 on any
 *                                                   difference or any script the table doesn't make
 *
 * Contract
 *   in : the two voices and their syllables below (the voice design, in one table).
 *   out: art/sound/babble/<id>.script, path-free and commented, which scripts/sound/build.mjs saves
 *        as a session, bounces and encodes like D4's sounds (its `babble` group in sounds.json).
 *   how: a syllable is one or two legato `subtractive_synth` notes on a stereo track (SoundCraft 0.14
 *        pans a mono track 6 dB right), through a built-in `eq_7band` and `plate_reverb`.
 *        - Its pitch shape comes from a seed note, two ticks (1 ms) at velocity 1 (with the synth's
 *          velocity sensitivity at 100 %, 42 dB down), which the first note glides up from; a second
 *          note, starting as the first ends, glides on to where the syllable settles (probed
 *          2026-11-01: a seed at A4, D5 then E5 rose 1.4 semitones past E5's neighbour in 40 ms
 *          and settled, with no second attack).
 *        - Its vowel is the filter: a saw-and-triangle source through a resonant low-pass whose
 *          envelope sweeps up and back in the first 100 ms or so ("nya", "mwo"). A sine has no
 *          harmonics for a filter to shape, which is why version 2 sounded robotic.
 *        - It stays soft: the sweep peaks near 1–1.5 kHz, a 3 kHz low-pass (24 dB/oct) clears the
 *          ear's most sensitive band, and D4's plate, smaller, adds warmth.
 *        No sampler and no imported audio. Output is a pure function of the table, so --check is byte-exact.
 * Writes only art/sound/babble/*.script; run from anywhere.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const note = (p) => `${NAMES[p % 12]}${Math.floor(p / 12) - 1}`;
const hz = (p) => Math.round(440 * 2 ** ((p - 69) / 12));

// The voices, version 3. Times in ms; at 125 bpm one tick is 0.5 ms, so ticks = 2 × ms.
// Version 1 (a square wave up to C#6) was too high and harsh; version 2 (a near-pure sine an octave
// lower) was soft but, in the owner's words, "too much robotic instead of cute and kawaii". Version 3
// keeps version 2's register and softness and gives each syllable a vowel (a resonant filter sweep on
// a source with harmonics) and a cute pitch shape: Pomo springs up past the note and settles
// ("pyon"), Doro rises gently and sighs down a semitone ("mwo"). Each voice has a high and a low
// syllable for each vowel class (a; e and i; o and u) and two line endings; tour-speech.js picks them.
const VOICES = {
    pomo: {
        name: 'Pomo',
        character: 'higher and bouncier: a saw with a triangle through a resonant low-pass, springing up past each note and settling',
        synth: { osc1_wave: 0, osc2_wave: 3, osc2_semitones: 0, osc2_detune: 4, osc_mix: 50, filter_attack: 30, filter_decay: 110, filter_sustain: 35, filter_release: 80, amp_attack: 10, amp_decay: 50, amp_sustain: 70, amp_release: 45, glide: 40 },
        // A body syllable: the seed 3 semitones under the note, up to 2 over it for 45 ms, then settle on it for 55.
        body: (t) => ({ seed: t - 3, notes: [[t + 2, 45, 100], [t, 55, 85]] }),
        syllables: [
            { id: 'a-high', vowel: 'a', level: 'high', t: 74, filter: { cutoff: 450, resonance: 35, env: 70 } },
            { id: 'a-low', vowel: 'a', level: 'low', t: 70, filter: { cutoff: 450, resonance: 35, env: 70 } },
            { id: 'e-high', vowel: 'e', level: 'high', t: 76, filter: { cutoff: 520, resonance: 30, env: 55 } },
            { id: 'e-low', vowel: 'e', level: 'low', t: 72, filter: { cutoff: 520, resonance: 30, env: 55 } },
            { id: 'o-high', vowel: 'o', level: 'high', t: 73, filter: { cutoff: 380, resonance: 30, env: 45 } },
            { id: 'o-low', vowel: 'o', level: 'low', t: 69, filter: { cutoff: 380, resonance: 30, env: 45 } },
            { id: 'up', role: 'up', vowel: 'a', seed: 68, notes: [[76, 130, 100]], glide: 90, filter: { cutoff: 450, resonance: 35, env: 70 } },
            { id: 'down', role: 'down', vowel: 'o', seed: 73, notes: [[76, 45, 100], [67, 95, 85]], glide: 80, filter: { cutoff: 380, resonance: 30, env: 45 } },
        ],
    },
    doro: {
        name: 'Doro',
        character: 'lower and rounder: a triangle with a little saw through a gentler low-pass, rising softly into each note and sighing down a semitone',
        synth: { osc1_wave: 3, osc2_wave: 0, osc2_semitones: 0, osc2_detune: 3, osc_mix: 30, filter_attack: 45, filter_decay: 150, filter_sustain: 45, filter_release: 100, amp_attack: 16, amp_decay: 70, amp_sustain: 80, amp_release: 70, glide: 60 },
        // A body syllable: the seed 2 semitones under the note, on it for 70 ms, then down a semitone for 70.
        body: (t) => ({ seed: t - 2, notes: [[t, 70, 100], [t - 1, 70, 85]] }),
        syllables: [
            { id: 'a-high', vowel: 'a', level: 'high', t: 71, filter: { cutoff: 400, resonance: 25, env: 50 } },
            { id: 'a-low', vowel: 'a', level: 'low', t: 67, filter: { cutoff: 400, resonance: 25, env: 50 } },
            { id: 'e-high', vowel: 'e', level: 'high', t: 72, filter: { cutoff: 450, resonance: 22, env: 40 } },
            { id: 'e-low', vowel: 'e', level: 'low', t: 69, filter: { cutoff: 450, resonance: 22, env: 40 } },
            { id: 'o-high', vowel: 'o', level: 'high', t: 70, filter: { cutoff: 340, resonance: 22, env: 35 } },
            { id: 'o-low', vowel: 'o', level: 'low', t: 66, filter: { cutoff: 340, resonance: 22, env: 35 } },
            { id: 'up', role: 'up', vowel: 'o', seed: 65, notes: [[73, 160, 100]], glide: 110, filter: { cutoff: 340, resonance: 22, env: 35 } },
            { id: 'down', role: 'down', vowel: 'o', seed: 69, notes: [[71, 60, 100], [64, 110, 85]], glide: 100, filter: { cutoff: 340, resonance: 22, env: 35 } },
        ],
    },
};

// D4's plate, smaller and quieter: a little warmth around each syllable without smearing a fast line.
const PLATE = { mix: 10, pre_delay: 8, decay: 0.4, size: 25, damping: 4500, diffusion: 80, width: 0, low_cut: 250 };
const EQ = { hpf_on: 1, hpf_freq: 150, hpf_slope: 1, lpf_on: 1, lpf_freq: 3000, lpf_slope: 3 };
const VOWEL = { a: '"a"', e: '"e" or "i"', o: '"o" or "u"' };

/** One syllable's script: path-free, one `COMMAND JSON` per line, each step commented. */
function script(who, v, s) {
    const id = `${who}-${s.id}`;
    const shape = s.role ? { seed: s.seed, notes: s.notes } : v.body(s.t);
    const glide = s.glide ?? v.synth.glide;
    const synth = { ...v.synth, cutoff: s.filter.cutoff, resonance: s.filter.resonance, filter_env_amount: s.filter.env, glide, velocity: 100, level: -6 };
    const params = (o) => JSON.stringify(o).replace(/,"/g, ', "').replace(/":/g, '": ');
    const path = [shape.seed, ...shape.notes.map(([p]) => p)].map((p) => `${note(p)} (${hz(p)} Hz)`).join(' → ');
    let at = 2;
    const notes = shape.notes.map(([p, ms, vel]) => {
        const line = `midi.note_add {"clip": 2, "pitch": ${p}, "start_ticks": ${at}, "length_ticks": ${2 * ms}, "velocity": ${vel}}`;
        at += 2 * ms;
        return line;
    });
    const what = s.role === 'up' ? 'the question ending, rising' : s.role === 'down' ? 'the line ending, falling' : `the ${VOWEL[s.vowel]} syllable, ${s.level}`;
    return [
        `# ${v.name}'s babble, ${what}.`,
        `# ${path}, gliding ${glide} ms between notes; then it releases.`,
        `# Voice: ${v.character}.`,
        '#',
        `# Generated by scripts/sound/babble-scripts.mjs; scripts/sound/build.mjs saves art/sound/babble/${id}.scraft from it,`,
        `# bounces that session and encodes src/assets/sounds/babble/${id}.m4a. 125 bpm at 960 ticks per quarter: one tick is 0.5 ms.`,
        '',
        `session.new {"name": "${id}", "sample_rate": 48000, "bit_depth": 24}`,
        'event.tempo {"bpm": 125}',
        '',
        '# The voice, on a stereo track (SoundCraft 0.14 pans a mono track 6 dB right at centre). The vowel is the',
        `# filter: from ${s.filter.cutoff} Hz with ${s.filter.resonance} % resonance, its envelope sweeping up and back over the first ~100 ms.`,
        `track.new {"kind": "instrument", "format": "stereo", "name": "Voice", "instrument": "subtractive_synth"}`,
        `mix.instrument {"track": "Voice", "plugin": "subtractive_synth", "params": ${params(synth)}}`,
        '',
        '# Soft: a 150 Hz high-pass, and a 3 kHz low-pass (24 dB/oct) clear of the ear\'s most sensitive band.',
        `mix.insert {"track": "Voice", "slot": 0, "plugin": "eq_7band", "params": ${params(EQ)}}`,
        '',
        "# Warmth: D4's plate, smaller and quieter (width 0 keeps the two channels together for the mono fold).",
        `mix.insert {"track": "Voice", "slot": 1, "plugin": "plate_reverb", "params": ${params(PLATE)}}`,
        '',
        '# The seed (two ticks at velocity 1, silent) sets where the first glide starts; each note glides from the last.',
        'midi.new_clip {"track": "Voice", "start": 0, "length": 48000}',
        `midi.note_add {"clip": 2, "pitch": ${shape.seed}, "start_ticks": 0, "length_ticks": 2, "velocity": 1}`,
        ...notes,
        '',
    ].join('\n');
}

const files = new Map();
for (const [who, v] of Object.entries(VOICES)) {
    for (const s of v.syllables) files.set(`art/sound/babble/${who}-${s.id}.script`, script(who, v, s));
}

let differences = 0;
for (const [rel, text] of files) {
    const abs = path.join(ROOT, rel);
    if (CHECK) {
        if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== text) { differences++; console.log(`✖ ${rel} differs`); }
    } else {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, text);
    }
}
const dir = path.join(ROOT, 'art/sound/babble');
const stale = fs.readdirSync(dir).filter((f) => f.endsWith('.script') && !files.has(`art/sound/babble/${f}`));
if (CHECK) {
    for (const f of stale) { differences++; console.log(`✖ art/sound/babble/${f} is not made by this table`); }
    console.log(differences ? `✖ ${differences} script(s) differ` : `✔ ${files.size} scripts match`);
    process.exit(differences ? 1 : 0);
}
for (const f of stale) console.log(`! art/sound/babble/${f} is not made by this table any more; remove it and its session`);
console.log(`wrote ${files.size} scripts`);
