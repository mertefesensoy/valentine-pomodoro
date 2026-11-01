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
 *        glide rise from 440 to 880 Hz). Its vowel colour is the filter's resonant sweep plus one
 *        EQ bell near the second formant, and a 4.5 kHz low-pass keeps every syllable soft
 *        (D4's "never shrill"). No sampler and no imported audio. Output is a pure function of the
 *        table, so --check is byte-exact.
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
const VOICES = {
    pomo: {
        name: 'Pomo',
        character: 'higher and bouncier: a square wave with a little detuned saw, quick attacks, short syllables that spring up into their note',
        synth: { osc1_wave: 1, osc2_wave: 0, osc2_semitones: 0, osc2_detune: 6, osc_mix: 25, filter_attack: 18, filter_decay: 60, filter_sustain: 40, filter_release: 60, amp_attack: 6, amp_decay: 40, amp_sustain: 75, amp_release: 45, glide: 45 },
        noteMs: 80,
        syllables: [
            { id: 'pa', from: 76, to: 81, cutoff: 1300, resonance: 40, env: 50, bell: ['mid', 1500, 6, 1.5], vowel: 'an open "a"' },
            { id: 'pi', from: 79, to: 83, cutoff: 1700, resonance: 30, env: 40, bell: ['high_mid', 2700, 5, 2.5], vowel: 'a bright "i"' },
            { id: 'po', from: 74, to: 78, cutoff: 1000, resonance: 40, env: 40, bell: ['mid', 950, 6, 1.5], vowel: 'a round "o"' },
            { id: 'pe', from: 72, to: 76, cutoff: 1500, resonance: 30, env: 45, bell: ['high_mid', 2100, 5, 2.5], vowel: 'an "e"' },
            { id: 'up', role: 'up', from: 78, to: 85, cutoff: 1400, resonance: 40, env: 50, bell: ['mid', 1500, 6, 1.5], glide: 90, noteMs: 110, vowel: 'an "a" rising a sixth, for a question' },
            { id: 'down', role: 'down', from: 83, to: 76, cutoff: 1200, resonance: 35, env: 40, bell: ['mid', 1100, 5, 1.5], glide: 80, noteMs: 110, vowel: 'an "o" falling a fifth, for a line\'s end' },
        ],
    },
    doro: {
        name: 'Doro',
        character: 'lower and rounder: a triangle wave with a little square for presence, softer attacks, longer syllables that settle gently onto their note',
        synth: { osc1_wave: 3, osc2_wave: 1, osc2_semitones: 0, osc2_detune: 4, osc_mix: 20, filter_attack: 35, filter_decay: 90, filter_sustain: 50, filter_release: 80, amp_attack: 12, amp_decay: 60, amp_sustain: 80, amp_release: 70, glide: 50 },
        noteMs: 110,
        syllables: [
            { id: 'mo', from: 75, to: 74, cutoff: 800, resonance: 15, env: 25, bell: ['mid', 850, 5, 1.5], vowel: 'a round "o"' },
            { id: 'mu', from: 72, to: 71, cutoff: 700, resonance: 15, env: 20, bell: ['mid', 700, 4, 1.5], vowel: 'a soft "u"' },
            { id: 'ma', from: 75, to: 76, cutoff: 1000, resonance: 15, env: 30, bell: ['mid', 1300, 5, 1.5], vowel: 'an open "a"' },
            { id: 'me', from: 79, to: 78, cutoff: 1100, resonance: 15, env: 25, bell: ['high_mid', 1900, 4, 2], vowel: 'an "e"' },
            { id: 'up', role: 'up', from: 71, to: 78, cutoff: 900, resonance: 15, env: 30, bell: ['mid', 900, 5, 1.5], glide: 110, noteMs: 150, vowel: 'an "o" rising a fifth, for a question' },
            { id: 'down', role: 'down', from: 76, to: 69, cutoff: 750, resonance: 15, env: 20, bell: ['mid', 750, 4, 1.5], glide: 100, noteMs: 150, vowel: 'a "u" falling a fifth, for a line\'s end' },
        ],
    },
};

/** One syllable's script: path-free, one `COMMAND JSON` per line, each step commented. */
function script(who, v, s) {
    const id = `${who}-${s.id}`;
    const glide = s.glide ?? v.synth.glide;
    const ms = s.noteMs ?? v.noteMs;
    const [band, freq, gain, q] = s.bell;
    const synth = { ...v.synth, cutoff: s.cutoff, resonance: s.resonance, filter_env_amount: s.env, glide, velocity: 100, level: -6 };
    const eq = { hpf_on: 1, hpf_freq: 200, hpf_slope: 1, [`${band}_freq`]: freq, [`${band}_gain`]: gain, [`${band}_q`]: q, lpf_on: 1, lpf_freq: 4500, lpf_slope: 3 };
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
        `mix.instrument {"track": "Voice", "plugin": "subtractive_synth", "params": ${JSON.stringify(synth).replace(/,"/g, ', "').replace(/":/g, '": ')}}`,
        '',
        `# The vowel: a ${gain} dB bell at ${freq} Hz (Q ${q}); a 200 Hz high-pass and a 4.5 kHz low-pass (24 dB/oct) keep it clean and soft.`,
        `mix.insert {"track": "Voice", "slot": 0, "plugin": "eq_7band", "params": ${JSON.stringify(eq).replace(/,"/g, ', "').replace(/":/g, '": ')}}`,
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
