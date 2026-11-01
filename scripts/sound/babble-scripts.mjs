#!/usr/bin/env node
/**
 * babble-scripts.mjs — the sources of Pomo & Doro's babble, one soundcraft-cli script per syllable
 * (Phase 1 D5 assets; FR-ONB-001, FR-SET-004, NFR-PERF-005; ADR-0027).
 *
 *   node scripts/sound/babble-scripts.mjs           write art/sound/babble/<id>.script
 *   node scripts/sound/babble-scripts.mjs --check   regenerate in memory and compare; exit 1 on any difference
 *
 * Contract
 *   in : the two voices and their syllables below (the voice design, in one table).
 *   out: art/sound/babble/<id>.script, path-free and commented, which scripts/sound/build.mjs saves
 *        as a session, bounces and encodes like D4's sounds (its `babble` group in sounds.json).
 *   how: a syllable is one `subtractive_synth` note on a stereo track (SoundCraft 0.14 pans a mono
 *        track 6 dB right), through one built-in `eq_7band`. Its pitch contour comes from a seed
 *        note: two ticks (1 ms) long at velocity 1 (with the synth's velocity sensitivity at 100 %, 42 dB
 *        down and released at once), so the real note glides from the seed's pitch to its own over
 *        the voice's glide time (probed 2026-11-01: a seed at A4 and a note at A5 with a 60 ms
 *        glide rise from 440 to 880 Hz). Its vowel colour is a gentle filter sweep plus one small EQ
 *        bell below 1.5 kHz; a 3.5 kHz low-pass and SoundCraft's plate, as in D4's chimes, keep every
 *        syllable soft (D4's "never shrill"). No sampler and no imported audio. Output is a pure
 *        function of the table, so --check is byte-exact.
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

// The voices. Times in ms; the session runs at 125 bpm, where one tick is 0.5 ms, so ticks = 2 × ms.
// Version 2, after the owner (2026-11-01): "the sounds sound to high pitched … can we make them softer
// sounds and more pleasent to hear as well as cute and kawaii". So both voices are now the app's own
// chime voice (D4: a sine with a little triangle), about an octave lower than version 1 (which was a
// square wave up to C#6), with no filter resonance, no boost in the ear's most sensitive 2–4 kHz band,
// softer attacks and a touch of D4's plate for warmth. The glides stay: they are the cute part.
const VOICES = {
    pomo: {
        name: 'Pomo',
        character: 'higher and bouncier: the chime voice (a sine, with a triangle an octave up at 18 %), syllables that spring up a major third into their note',
        synth: { osc1_wave: 2, osc2_wave: 3, osc2_semitones: 12, osc2_detune: 3, osc_mix: 18, resonance: 0, filter_attack: 14, filter_decay: 70, filter_sustain: 50, filter_release: 80, amp_attack: 10, amp_decay: 50, amp_sustain: 70, amp_release: 70, glide: 45 },
        noteMs: 85,
        syllables: [
            { id: 'pa', from: 70, to: 74, cutoff: 1800, env: 20, bell: [1200, 3, 1.2], vowel: 'an open "a"' },
            { id: 'pi', from: 72, to: 76, cutoff: 2000, env: 20, bell: [1400, 2.5, 1.2], vowel: 'a light "i"' },
            { id: 'po', from: 68, to: 72, cutoff: 1300, env: 15, bell: [800, 3, 1.2], vowel: 'a round "o"' },
            { id: 'pe', from: 65, to: 69, cutoff: 1600, env: 18, bell: [1100, 2.5, 1.2], vowel: 'an "e"' },
            { id: 'up', role: 'up', from: 69, to: 76, cutoff: 1800, env: 20, bell: [1200, 3, 1.2], glide: 90, noteMs: 115, vowel: 'an "a" rising a fifth, for a question' },
            { id: 'down', role: 'down', from: 76, to: 69, cutoff: 1300, env: 15, bell: [800, 3, 1.2], glide: 80, noteMs: 115, vowel: 'an "o" falling a fifth, for the end of a line' },
        ],
    },
    doro: {
        name: 'Doro',
        character: 'lower and rounder: a sine with a soft triangle at the same pitch, longer syllables that settle gently onto their note',
        synth: { osc1_wave: 2, osc2_wave: 3, osc2_semitones: 0, osc2_detune: 2, osc_mix: 35, resonance: 0, filter_attack: 25, filter_decay: 100, filter_sustain: 60, filter_release: 100, amp_attack: 16, amp_decay: 70, amp_sustain: 80, amp_release: 90, glide: 60 },
        noteMs: 115,
        syllables: [
            { id: 'mo', from: 68, to: 67, cutoff: 1000, env: 12, bell: [800, 3, 1.2], vowel: 'a round "o"' },
            { id: 'mu', from: 70, to: 69, cutoff: 900, env: 10, bell: [700, 3, 1.2], vowel: 'a soft "u"' },
            { id: 'ma', from: 70, to: 71, cutoff: 1200, env: 15, bell: [1000, 3, 1.2], vowel: 'an open "a"' },
            { id: 'me', from: 73, to: 72, cutoff: 1200, env: 12, bell: [1100, 2.5, 1.2], vowel: 'an "e"' },
            { id: 'up', role: 'up', from: 67, to: 74, cutoff: 1100, env: 15, bell: [900, 3, 1.2], glide: 110, noteMs: 150, vowel: 'an "o" rising a fifth, for a question' },
            { id: 'down', role: 'down', from: 71, to: 64, cutoff: 900, env: 10, bell: [750, 3, 1.2], glide: 100, noteMs: 150, vowel: 'a "u" falling a fifth, for the end of a line' },
        ],
    },
};

// D4's plate, smaller and quieter: a little warmth around each syllable without smearing a fast line.
const PLATE = { mix: 10, pre_delay: 8, decay: 0.4, size: 25, damping: 4500, diffusion: 80, width: 0, low_cut: 250 };

/** One syllable's script: path-free, one `COMMAND JSON` per line, each step commented. */
function script(who, v, s) {
    const id = `${who}-${s.id}`;
    const glide = s.glide ?? v.synth.glide;
    const ms = s.noteMs ?? v.noteMs;
    const [freq, gain, q] = s.bell;
    const synth = { ...v.synth, cutoff: s.cutoff, filter_env_amount: s.env, glide, velocity: 100, level: -6 };
    const eq = { hpf_on: 1, hpf_freq: 150, hpf_slope: 1, mid_freq: freq, mid_gain: gain, mid_q: q, lpf_on: 1, lpf_freq: 3500, lpf_slope: 3 };
    const params = (o) => JSON.stringify(o).replace(/,"/g, ', "').replace(/":/g, '": ');
    const dir = s.to > s.from ? 'rising' : s.to < s.from ? 'falling' : 'level';
    return [
        `# ${v.name}'s babble, "${s.id}"${s.role ? ` (the ${s.role === 'up' ? 'question' : 'line-end'} syllable)` : ''}: ${s.vowel}.`,
        `# ${note(s.from)} → ${note(s.to)} (${hz(s.from)} → ${hz(s.to)} Hz), ${dir}, over a ${glide} ms glide; the note holds ${ms} ms, then releases.`,
        `# Voice: ${v.character}.`,
        '#',
        `# Generated by scripts/sound/babble-scripts.mjs; scripts/sound/build.mjs saves art/sound/babble/${id}.scraft from it,`,
        '# bounces that session and encodes src/assets/sounds/babble/' + id + '.m4a. 125 bpm at 960 ticks per quarter: one tick is 0.5 ms.',
        '',
        `session.new {"name": "${id}", "sample_rate": 48000, "bit_depth": 24}`,
        'event.tempo {"bpm": 125}',
        '',
        '# The voice, on a stereo track (SoundCraft 0.14 pans a mono track 6 dB right at centre).',
        `track.new {"kind": "instrument", "format": "stereo", "name": "Voice", "instrument": "subtractive_synth"}`,
        `mix.instrument {"track": "Voice", "plugin": "subtractive_synth", "params": ${params(synth)}}`,
        '',
        `# The vowel: a ${gain} dB bell at ${freq} Hz (Q ${q}), nothing boosted above 1.5 kHz; a 150 Hz high-pass and a`,
        '# 3.5 kHz low-pass (24 dB/oct) keep it clean and soft.',
        `mix.insert {"track": "Voice", "slot": 0, "plugin": "eq_7band", "params": ${params(eq)}}`,
        '',
        "# Warmth: D4's plate, smaller and quieter (width 0 keeps the two channels together for the mono fold).",
        `mix.insert {"track": "Voice", "slot": 1, "plugin": "plate_reverb", "params": ${params(PLATE)}}`,
        '',
        '# The seed (two ticks at velocity 1, silent) sets where the glide starts; the syllable glides from it.',
        'midi.new_clip {"track": "Voice", "start": 0, "length": 48000}',
        `midi.note_add {"clip": 2, "pitch": ${s.from}, "start_ticks": 0, "length_ticks": 2, "velocity": 1}`,
        `midi.note_add {"clip": 2, "pitch": ${s.to}, "start_ticks": 2, "length_ticks": ${2 * ms}, "velocity": 100}`,
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
if (CHECK) {
    console.log(differences ? `✖ ${differences} script(s) differ` : `✔ ${files.size} scripts match`);
    process.exit(differences ? 1 : 0);
}
console.log(`wrote ${files.size} scripts`);
