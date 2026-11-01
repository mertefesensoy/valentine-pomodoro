#!/usr/bin/env node
/**
 * The SoundCraft sound pipeline (Phase 1 D4; ADR-0027; FR-SET-004, NFR-PERF-005).
 *
 *   node scripts/sound/build.mjs           rebuild every sound in art/sound/sounds.json
 *   node scripts/sound/build.mjs --check   rebuild in a fresh temp folder and compare, byte for byte,
 *                                          with the committed files; exit 1 on any difference
 *
 * A UI sound is built from its soundcraft-cli script (art/sound/<id>.script, path-free):
 *
 *   1. `soundcraft-cli script <id>.script --save <id>.scraft`   the session, the editable source
 *   2. `soundcraft-cli script <bounce> --in <id>.scraft`         file.bounce_mix, 32-bit float, no dither
 *   3. fold the stereo bounce to mono, (L + R) / 2, and measure its sample peak p
 *   4. scale by g / p, g = 10^(-1/20), so the sample peak is -1 dBFS (Phase 1 plan §4.4)
 *   5. encode mono AAC-LC with ffmpeg, bit-exact and without metadata, into src/assets/sounds/<id>.m4a
 *   6. check: duration ≤ 1.5 s, size ≤ 25,600 B, decoded peak < 0 dBFS, tail ≥ 60 dB below the peak
 *
 * A loop (Fly's ambient) is built the same way from steps 3–5, from its source file, at its own
 * sample rate and bitrate, into its entry's `file`. Its check is the loop seam:
 *   - every loop: the decoded file has its input's sample count, no time shift, and each 200 ms
 *     edge within 1 dB of the input's (a faithful entry can only ever say "unchanged": it keeps the
 *     source's own seam, good or bad)
 *   - a `seamless` entry: the source's head trimmed and its tail crossfaded into the head
 *     (seamlessLoop); a whole number of AAC frames, a join inside the input's own sample-to-sample
 *     steps, and both edges within 1.5 dB of the body's level
 *
 * Writes: art/sound/<id>.scraft, src/assets/sounds/<id>.m4a, each loop's `file` and art/sound/report.json (every
 * measurement, read by the record and by scripts/sound/review.mjs). SoundCraft's bounce and
 * ffmpeg's AAC encoder are deterministic on one machine (checked 2026-10-30: two runs, identical
 * bytes), and the session file has no timestamps, so --check is a reproducibility test. It holds
 * only for the tool builds named in sounds.json `tools`; a different build is reported first.
 *
 * Environment: SOUNDCRAFT_CLI (default the Windows install), FFMPEG and FFPROBE (default on PATH),
 * VP_SOUND_WORK (the build's work folder, default C:/vp-sound/build; --check always uses a temp folder).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLI = process.env.SOUNDCRAFT_CLI ?? 'C:/Program Files/SoundCraft/soundcraft-cli.exe';
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const FFPROBE = process.env.FFPROBE ?? 'ffprobe';
const check = process.argv.includes('--check');
const JOB = JSON.parse(fs.readFileSync(path.join(ROOT, 'art/sound/sounds.json'), 'utf8'));
const BUDGET = JOB.budget;
/** −1 dBFS as a linear gain: g = 10^(−1/20) ≈ 0.891. */
const TARGET = 10 ** (BUDGET.peakDbfs / 20);
const WORK = (check ? fs.mkdtempSync(path.join(os.tmpdir(), 'vp-sound-check-')) : process.env.VP_SOUND_WORK ?? 'C:/vp-sound/build').replace(/\\/g, '/');

const db = (x) => 20 * Math.log10(x);
const round = (x, places) => Number(x.toFixed(places));

/** Runs a tool and returns its stdout; throws with its stderr on a non-zero exit. */
function tool(cmd, args, { buffer = false } = {}) {
    const r = spawnSync(cmd, args, { encoding: buffer ? 'buffer' : 'utf8', maxBuffer: 256 << 20 });
    if (r.error) throw r.error;
    if (r.status !== 0) throw new Error(`${path.basename(cmd)} ${args.join(' ')}\n${r.stderr}${r.stdout}`);
    return { out: r.stdout, err: buffer ? r.stderr.toString('utf8') : r.stderr };
}

function versions() {
    return {
        soundcraft: tool(CLI, ['--version']).out.trim(),
        ffmpeg: tool(FFMPEG, ['-hide_banner', '-version']).out.split(/\r?\n/)[0].replace(/ Copyright.*$/, ''),
    };
}

/** A 32-bit float WAV (format 3, or WAVE_FORMAT_EXTENSIBLE with float) as one Float32Array per channel. */
function readFloatWav(file) {
    const b = fs.readFileSync(file);
    if (b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WAVE') throw new Error(`${file}: not a WAV`);
    let fmt;
    let data;
    for (let i = 12; i + 8 <= b.length;) {
        const id = b.toString('latin1', i, i + 4);
        const n = b.readUInt32LE(i + 4);
        if (id === 'fmt ') fmt = { code: b.readUInt16LE(i + 8), channels: b.readUInt16LE(i + 10), rate: b.readUInt32LE(i + 12), bits: b.readUInt16LE(i + 22), sub: n >= 26 ? b.readUInt16LE(i + 32) : null };
        if (id === 'data') data = b.subarray(i + 8, i + 8 + n);
        i += 8 + n + (n & 1);
    }
    const code = fmt.code === 0xfffe ? fmt.sub : fmt.code;
    if (code !== 3 || fmt.bits !== 32) throw new Error(`${file}: expected 32-bit float, got format ${code} at ${fmt.bits} bits`);
    const frames = data.length / 4 / fmt.channels;
    const channels = Array.from({ length: fmt.channels }, () => new Float32Array(frames));
    for (let f = 0; f < frames; f++) for (let c = 0; c < fmt.channels; c++) channels[c][f] = data.readFloatLE((f * fmt.channels + c) * 4);
    return { rate: fmt.rate, channels };
}

/** Writes a mono 32-bit float WAV (format 3): what ffmpeg encodes, sample for sample. */
function writeFloatWav(file, samples, rate) {
    const data = Buffer.alloc(samples.length * 4);
    samples.forEach((v, i) => data.writeFloatLE(v, i * 4));
    const head = Buffer.alloc(44);
    head.write('RIFF', 0, 'latin1');
    head.writeUInt32LE(36 + data.length, 4);
    head.write('WAVEfmt ', 8, 'latin1');
    head.writeUInt32LE(16, 16);
    head.writeUInt16LE(3, 20); // IEEE float
    head.writeUInt16LE(1, 22); // mono
    head.writeUInt32LE(rate, 24);
    head.writeUInt32LE(rate * 4, 28);
    head.writeUInt16LE(4, 32);
    head.writeUInt16LE(32, 34);
    head.write('data', 36, 'latin1');
    head.writeUInt32LE(data.length, 40);
    fs.writeFileSync(file, Buffer.concat([head, data]));
}

/** Decodes any audio file to mono 32-bit float samples with ffmpeg (an AAC edit list is honoured). */
function decode(file) {
    const { out } = tool(FFMPEG, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', file, '-ac', '1', '-f', 'f32le', '-c:a', 'pcm_f32le', '-'], { buffer: true });
    return new Float32Array(out.buffer.slice(out.byteOffset, out.byteOffset + out.length));
}

function peakOf(x) {
    let p = 0;
    for (const v of x) p = Math.max(p, Math.abs(v));
    return p;
}

/**
 * Scales `mono` so its sample peak is exactly TARGET, writes it as the encoder's input and
 * returns the gain in dB. Contract: the input has a non-zero peak; the output's peak is TARGET
 * to float32 precision (one part in 2^24).
 */
function normalise(mono, rate, wavOut) {
    const p = peakOf(mono);
    if (!(p > 0)) throw new Error(`${wavOut}: silent`);
    const k = TARGET / p;
    writeFloatWav(wavOut, mono.map((v) => v * k), rate);
    return { peakDbfs: db(p), gainDb: db(k) };
}

/**
 * Mono AAC-LC in an MP4 (.m4a) container. +bitexact keeps ffmpeg's version string out of the
 * file and zeroes the creation times; -map_metadata -1 and -map_chapters -1 drop everything else.
 * The sample rate is the input's: no resampling step.
 */
function encode(wavIn, m4aOut, bitrate) {
    tool(FFMPEG, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', wavIn,
        '-map_metadata', '-1', '-map_chapters', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact',
        '-c:a', 'aac', '-b:a', bitrate, '-ac', '1', m4aOut]);
}

/**
 * The shipped file's numbers: container duration, size, decoded peak (two ways), loudness.
 * Loudness is ffmpeg's EBU R 128 meter with the mono stream as one channel, so the figures compare
 * the sounds with each other, not with a playback level. Integrated loudness is gated over 400 ms
 * blocks and says little about a sound under about 1.5 s; the momentary maximum (400 ms window)
 * is the figure to compare UI sounds by.
 */
function measure(m4a) {
    const probe = JSON.parse(tool(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', m4a]).out);
    const stream = probe.streams[0];
    const decoded = decode(m4a);
    const vd = tool(FFMPEG, ['-nostdin', '-hide_banner', '-i', m4a, '-af', 'volumedetect', '-f', 'null', '-']).err;
    const maxVolume = Number(/max_volume: (-?[\d.]+|-inf) dB/.exec(vd)[1]);
    const r128 = tool(FFMPEG, ['-nostdin', '-hide_banner', '-loglevel', 'verbose', '-i', m4a, '-af', 'ebur128=peak=true', '-f', 'null', '-']).err;
    const summary = r128.slice(r128.lastIndexOf('Summary:'));
    const momentary = [...r128.matchAll(/ t: [\d.]+ .* M:\s*(-?[\d.]+)/g)].map((m) => Number(m[1]));
    return {
        decoded,
        numbers: {
            codec: `${stream.codec_name} ${stream.profile}`,
            channels: stream.channels,
            sampleRate: Number(stream.sample_rate),
            seconds: round(Number(probe.format.duration), 6),
            samples: decoded.length,
            bytes: Number(probe.format.size),
            bitrate: Number(stream.bit_rate),
            decodedPeakDbfs: round(db(peakOf(decoded)), 3),
            volumedetectMaxDb: maxVolume,
            truePeakDbtp: Number(/Peak:\s+(-?[\d.]+|-inf) dBFS/.exec(summary)[1]),
            momentaryMaxLufs: Math.max(...momentary),
            loudnessLufs: Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)[1]),
        },
    };
}

function sha256(file) {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const failures = [];
const fail = (msg) => failures.push(msg);

/**
 * A script's session and its mono bounce: saves <WORK>/<id>.scraft from the script, bounces that
 * saved session from 0 to `seconds` (in samples at 48 kHz) as 32-bit float, and folds it to mono,
 * (L + R) / 2. Returns the mono samples, the bounce's end, SoundCraft's own figures, the sample peak
 * p, the largest L − R difference and the peak of the last 10 ms.
 */
function bounceMono(id, scriptRel, seconds) {
    const w = (ext) => `${WORK}/${id}${ext}`;
    fs.copyFileSync(path.join(ROOT, scriptRel), w('.script'));
    const made = tool(CLI, ['script', w('.script'), '--save', w('.scraft')]).out;
    if (/error|failed/i.test(made)) throw new Error(`${id}: ${made}`);

    const end = Math.round(seconds * 48000);
    fs.writeFileSync(w('.bounce.script'), `file.bounce_mix ${JSON.stringify({ path: w('.wav'), format: 'wav', bit_depth: '32f', dither: false, start: 0, end })}\n`);
    const line = tool(CLI, ['script', w('.bounce.script'), '--in', w('.scraft')]).out.split(/\r?\n/).find((l) => l.startsWith('file.bounce_mix:'));
    const info = JSON.parse(line.slice(line.indexOf('{')));

    const wav = readFloatWav(w('.wav'));
    if (wav.rate !== 48000 || wav.channels.length !== 2) throw new Error(`${id}: expected a 48 kHz stereo bounce`);
    const [l, r] = wav.channels;
    const mono = l.map((v, i) => (v + r[i]) / 2);
    let lr = 0;
    for (let i = 0; i < l.length; i++) lr = Math.max(lr, Math.abs(l[i] - r[i]));
    let tail = 0;
    for (let i = mono.length - 480; i < mono.length; i++) tail = Math.max(tail, Math.abs(mono[i]));
    return { mono, end, info, p: peakOf(mono), lr, tail };
}

/** One UI sound, from its script; returns its report entry. */
function buildSound(sound) {
    const w = (ext) => `${WORK}/${sound.id}${ext}`;
    const { mono, end, info: bounce, p, lr, tail } = bounceMono(sound.id, sound.script, sound.seconds);
    const level = normalise(mono, 48000, w('.mono.wav'));
    encode(w('.mono.wav'), w('.m4a'), sound.bitrate);
    const { numbers } = measure(w('.m4a'));

    if (numbers.seconds > BUDGET.seconds) fail(`${sound.id}: ${numbers.seconds} s is over ${BUDGET.seconds} s`);
    if (numbers.bytes > BUDGET.bytes) fail(`${sound.id}: ${numbers.bytes} B is over ${BUDGET.bytes} B`);
    if (!(numbers.decodedPeakDbfs < 0) || !(numbers.volumedetectMaxDb < 0)) fail(`${sound.id}: the decoded peak reaches 0 dBFS`);
    if (db(tail / p) > BUDGET.tailDb) fail(`${sound.id}: the last 10 ms are only ${db(tail / p).toFixed(1)} dB below the peak; the bounce cuts the tail`);
    return {
        id: sound.id,
        use: sound.use,
        file: `src/assets/sounds/${sound.id}.m4a`,
        session: `art/sound/${sound.id}.scraft`,
        bounce: { samples: end, seconds: sound.seconds, lufs: round(bounce.lufs, 2), peakDbfs: round(bounce.peak_db, 2), leftRightMaxDiffDb: round(db(lr / p), 1) },
        monoPeakDbfs: round(level.peakDbfs, 2),
        gainDb: round(level.gainDb, 2),
        tailDb: round(db(tail / p), 1),
        bitrateTarget: sound.bitrate,
        ...numbers,
        sha256: sha256(w('.m4a')),
    };
}

/**
 * The seamless loop: drops the first `a` samples (the source's leading silence and fade-in), then
 * replaces the first `c` samples of what is left with an equal-power crossfade from the source's
 * last `c` samples into them, and drops those last `c` samples:
 *
 *   y[i] = x[N−c+i]·cos θ_i + x[a+i]·sin θ_i,   θ_i = (π/2)·(i + ½)/c,   0 ≤ i < c
 *   y[i] = x[a+i],                               c ≤ i < N − a − c
 *
 * The wrap y[last] → y[0] is x[N−c−1] → (almost) x[N−c], and the crossfade's end y[c−1] → y[c]
 * is (almost) x[a+c−1] → x[a+c]: both are steps the source itself makes. Equal power, because
 * the cabin noise is uncorrelated between the two ends; a linear fade would dip by 3 dB in the
 * middle. Contract: 0 ≤ a, 0 < c, a + 2c ≤ N; returns N − a − c samples.
 */
function seamlessLoop(x, a, c) {
    const n = x.length;
    if (!(a >= 0 && c > 0 && a + 2 * c <= n)) throw new Error(`seamlessLoop: a = ${a}, c = ${c} do not fit ${n} samples`);
    const y = new Float32Array(n - a - c);
    for (let i = 0; i < c; i++) {
        const t = (Math.PI / 2) * ((i + 0.5) / c);
        y[i] = x[n - c + i] * Math.cos(t) + x[a + i] * Math.sin(t);
    }
    y.set(x.subarray(a + c, n - c), c);
    return y;
}

/** One loop, from its source file; returns its report entry with the seam measurements. */
function buildLoop(loop) {
    const w = (ext) => `${WORK}/${loop.id}${ext}`;
    const src = path.join(ROOT, loop.source);
    const rate = Number(JSON.parse(tool(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_streams', src]).out).streams[0].sample_rate);
    const source = decode(src);
    const cut = loop.seamless;
    const before = cut ? seamlessLoop(source, cut.trimStartSamples, cut.crossfadeSamples) : source;
    const level = normalise(before, rate, w('.mono.wav'));
    encode(w('.mono.wav'), w('.m4a'), loop.bitrate);
    const { decoded: after, numbers } = measure(w('.m4a'));

    const k = 10 ** (level.gainDb / 20);
    const n = Math.min(before.length, after.length);
    // Time shift: the lag (±2048 samples) that best lines up the first 2 s; 0 means none.
    let lag = 0;
    let best = -Infinity;
    for (let d = -2048; d <= 2048; d++) {
        let s = 0;
        for (let i = 4096; i < 4096 + 2 * rate; i++) s += before[i] * after[i + d];
        if (s > best) { best = s; lag = d; }
    }
    // The join: |x[N−1] − x[0]|, against the 99.9th percentile of the file's own sample-to-sample steps.
    const join = (x, scale) => {
        const steps = new Float32Array(x.length - 1);
        for (let i = 1; i < x.length; i++) steps[i - 1] = Math.abs(x[i] - x[i - 1]) * scale;
        steps.sort();
        return { jump: round(Math.abs(x[x.length - 1] - x[0]) * scale, 5), p999: round(steps[Math.floor(steps.length * 0.999)], 5) };
    };
    const rms = (x, a, b, scale) => {
        let s = 0;
        for (let i = a; i < b; i++) s += (x[i] * scale) ** 2;
        return round(db(Math.sqrt(s / (b - a))), 2);
    };
    const edge = Math.round(0.2 * rate);
    let sig = 0;
    let err = 0;
    let maxErr = 0;
    for (let i = 0; i < n; i++) {
        const e = after[i] - before[i] * k;
        sig += (before[i] * k) ** 2;
        err += e * e;
        maxErr = Math.max(maxErr, Math.abs(e));
    }
    // AAC keeps the sound, not the waveform: at 64 kbit/s a decoded sample can sit 0.2 away from its
    // input anywhere in the file, and the codec treats each end as a cliff into silence. So the join
    // is gated where it is made, on the encoder's input (`inputJoin`); the decoded join is reported
    // beside the codec's own error (`codecMaxError`), and the decoded file is gated on its structure:
    // length, time shift and the level at each edge.
    const seam = {
        sourceSamples: source.length,
        samples: after.length,
        lag,
        inputJoin: join(before, k),
        join: join(after, 1),
        codecMaxError: round(maxErr, 4),
        snrDb: round(10 * Math.log10(sig / err), 1),
        inputEdgeRmsDbfs: [rms(before, 0, edge, k), rms(before, before.length - edge, before.length, k)],
        edgeRmsDbfs: [rms(after, 0, edge, 1), rms(after, after.length - edge, after.length, 1)],
        bodyRmsDbfs: rms(after, 0, after.length, 1),
    };
    if (seam.samples !== before.length) fail(`${loop.id}: ${seam.samples} samples decoded, ${before.length} encoded; the loop's length changed`);
    if (lag !== 0) fail(`${loop.id}: shifted ${lag} samples against its input`);
    seam.edgeRmsDbfs.forEach((e, i) => {
        if (Math.abs(e - seam.inputEdgeRmsDbfs[i]) > 1) fail(`${loop.id}: an edge is at ${e} dBFS RMS after encoding, ${seam.inputEdgeRmsDbfs[i]} before`);
    });
    if (cut) {
        if (seam.samples % 1024 !== 0) fail(`${loop.id}: ${seam.samples} samples is not a whole number of AAC frames`);
        if (seam.inputJoin.jump > seam.inputJoin.p999) fail(`${loop.id}: the crossfaded loop's join jumps ${seam.inputJoin.jump}, more than its own steps (${seam.inputJoin.p999})`);
        for (const e of seam.edgeRmsDbfs) if (Math.abs(e - seam.bodyRmsDbfs) > 1.5) fail(`${loop.id}: an edge is at ${e} dBFS RMS, the body at ${seam.bodyRmsDbfs}`);
    }
    if (!(numbers.decodedPeakDbfs < 0) || !(numbers.volumedetectMaxDb < 0)) fail(`${loop.id}: the decoded peak reaches 0 dBFS`);
    if (numbers.channels !== 1 || numbers.codec !== 'aac LC') fail(`${loop.id}: not mono AAC-LC`);
    return {
        id: loop.id,
        use: loop.use,
        file: loop.file,
        source: { file: loop.source, bytes: fs.statSync(src).size, peakDbfs: round(db(peakOf(source)), 2) },
        ...(cut ? { seamless: { ...cut, trimStartSeconds: round(cut.trimStartSamples / rate, 4), crossfadeSeconds: round(cut.crossfadeSamples / rate, 4) } } : {}),
        gainDb: round(level.gainDb, 2),
        bitrateTarget: loop.bitrate,
        ...numbers,
        seam,
        sha256: sha256(w('.m4a')),
    };
}

// ── The babble (Phase 1 D5) ──────────────────────────────────────────────────────────────────

/**
 * BS.1770's K-weighting at 48 kHz: its high shelf (about +4 dB above 2 kHz), then its high-pass
 * near 38 Hz, each a biquad with the standard's own coefficients. Returns a new array.
 */
function kWeight(x) {
    const stages = [
        { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] },
        { b: [1, -2, 1], a: [-1.99004745483398, 0.99007225036621] },
    ];
    let y = Float64Array.from(x);
    for (const { b, a } of stages) {
        const out = new Float64Array(y.length);
        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        for (let n = 0; n < y.length; n++) {
            const v = b[0] * y[n] + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
            x2 = x1; x1 = y[n]; y2 = y1; y1 = v;
            out[n] = v;
        }
        y = out;
    }
    return y;
}

/**
 * A syllable's loudness in LUFS: −0.691 + 10·log10 of the K-weighted mean square over its loudest
 * 200 ms (10 ms steps). A syllable shorter than 200 ms counts as 200 ms with silence after it, so
 * this is its K-weighted energy over a fixed 200 ms, about the ear's own integration time.
 */
function syllableLufs(x, rate) {
    const k = kWeight(x);
    const w = Math.round(0.2 * rate);
    const hop = Math.round(0.01 * rate);
    let best = 0;
    for (let s = 0; s === 0 || s + w <= k.length; s += hop) {
        let e = 0;
        for (let i = s; i < Math.min(s + w, k.length); i++) e += k[i] * k[i];
        best = Math.max(best, e / w);
    }
    return -0.691 + 10 * Math.log10(best);
}

/** The EBU R 128 momentary maximum (400 ms) of a WAV, from ffmpeg's meter, as measure() reads it. */
function momentaryMax(wavFile) {
    const r128 = tool(FFMPEG, ['-nostdin', '-hide_banner', '-loglevel', 'verbose', '-i', wavFile, '-af', 'ebur128', '-f', 'null', '-']).err;
    return Math.max(...[...r128.matchAll(/ t: [\d.]+ .* M:\s*(-?[\d.]+)/g)].map((m) => Number(m[1])));
}

/**
 * The tutorial's write-on of one line (the same rule as scripts/art/tour-motion.js writeOn): one
 * character every charMs, a pause after a comma or after a stop inside the line, a syllable on the
 * 1st letter and every k-th letter after it, the count starting again after each pause. Returns
 * each syllable's start in ms; the last is the line's end, 'up' for a question, 'down' otherwise.
 */
function writeOn(text, talk, k) {
    const starts = [];
    let clock = 0;
    let letters = 0;
    const chars = [...text];
    chars.forEach((c, i) => {
        if (/\p{L}/u.test(c)) {
            if (letters % k === 0) starts.push(clock);
            letters++;
        }
        clock += talk.charMs;
        if (/[,;:]/.test(c)) { clock += talk.pauseMs.comma; letters = 0; }
        else if (/[.!?…]/.test(c) && i < chars.length - 1) { clock += talk.pauseMs.stop; letters = 0; }
    });
    return { starts, end: /\?\s*$/.test(text) ? 'up' : 'down', ms: clock };
}

/**
 * A voice's sample line as one mono signal: its syllables summed at their write-on starts, the
 * body syllables taken in `order`, the last slot the line-end syllable. `sounds` maps each
 * syllable id to its samples; `list` is the voice's entries in sounds.json.
 */
function renderLine(text, list, sounds, talk, k, order) {
    const { starts, end } = writeOn(text, talk, k);
    const body = list.filter((s) => !s.role);
    const picks = starts.map((_, i) => (i === starts.length - 1 ? list.find((s) => s.role === end) : body[order[i % order.length]]));
    const at = starts.map((t) => Math.round((t / 1000) * 48000));
    const length = Math.max(...at.map((a, i) => a + sounds[picks[i].id].length));
    const out = new Float32Array(length);
    at.forEach((a, i) => sounds[picks[i].id].forEach((v, j) => { out[a + j] += v; }));
    return { samples: out, syllables: picks.map((s, i) => ({ id: s.id, ms: starts[i] })) };
}

/** A radix-2 FFT of a real signal, Hann-windowed and zero-padded; returns the power per bin. */
function powerSpectrum(x) {
    let n = 1;
    while (n < x.length) n <<= 1;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < x.length; i++) re[i] = x[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (x.length - 1)));
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = (-2 * Math.PI) / len;
        for (let i = 0; i < n; i += len) {
            for (let k = 0; k < len / 2; k++) {
                const wr = Math.cos(ang * k);
                const wi = Math.sin(ang * k);
                const ur = re[i + k], ui = im[i + k];
                const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
                const vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
                re[i + k] = ur + vr; im[i + k] = ui + vi;
                re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
            }
        }
    }
    return { n, power: Array.from({ length: n / 2 }, (_, k) => re[k] * re[k] + im[k] * im[k]) };
}

/**
 * The pitch (Hz) of `windowMs` of `x` starting at `ms`: the normalised autocorrelation r(L) over lags
 * for 300–1,600 Hz, the first local peak within 90 % of the highest (so a multiple of the period, an
 * octave below, never wins), refined between samples by a parabola through it and its neighbours.
 */
function pitchAt(x, rate, ms, windowMs = 20) {
    const s = Math.round((ms / 1000) * rate);
    const w = Math.round((windowMs / 1000) * rate);
    const lo = Math.floor(rate / 1600);
    const hi = Math.ceil(rate / 300);
    const r = [];
    for (let L = lo - 1; L <= hi + 1; L++) {
        let c = 0, e1 = 0, e2 = 0;
        for (let i = 0; i < w; i++) { c += x[s + i] * x[s + i + L]; e1 += x[s + i] ** 2; e2 += x[s + i + L] ** 2; }
        r[L] = c / Math.sqrt(e1 * e2 || 1);
    }
    let top = -Infinity;
    for (let L = lo; L <= hi; L++) top = Math.max(top, r[L]);
    for (let L = lo; L <= hi; L++) {
        if (r[L] >= 0.9 * top && r[L] >= r[L - 1] && r[L] >= r[L + 1]) {
            const d = r[L - 1] - 2 * r[L] + r[L + 1];
            return Math.round(rate / (L + (d ? (0.5 * (r[L - 1] - r[L + 1])) / d : 0)));
        }
    }
    return null;
}

/**
 * One voice's syllables: each bounced, brought to one loudness, then scaled together so the
 * voice's sample line meets the level target; encoded, measured and checked. Returns the voice's
 * report entry.
 */
function buildVoice(who, list, group, talk) {
    const k = talk.lettersPerSyllable[who];
    const target = group.level.streamMomentaryLufs;
    const made = Object.fromEntries(list.map((s) => [s.id, bounceMono(s.id, s.script, s.seconds)]));
    // Step 3: each syllable to the same loudness (−20 LUFS here; step 4 sets the voice's level).
    const toCommon = Object.fromEntries(list.map((s) => [s.id, -20 - syllableLufs(made[s.id].mono, 48000)]));
    const scaled = Object.fromEntries(list.map((s) => [s.id, made[s.id].mono.map((v) => v * 10 ** (toCommon[s.id] / 20))]));
    // Step 4: the voice's gain, from its line at the common loudness.
    const before = renderLine(group.lines[who], list, scaled, talk, k, group.order);
    writeFloatWav(`${WORK}/${who}-line.wav`, before.samples, 48000);
    const voiceGain = target - momentaryMax(`${WORK}/${who}-line.wav`);

    // Step 5: encode each syllable at its final gain and measure the shipped file.
    const decoded = {};
    const syllables = list.map((s) => {
        const w = (ext) => `${WORK}/${s.id}${ext}`;
        const { mono, end, info, p, lr, tail } = made[s.id];
        const gainDb = toCommon[s.id] + voiceGain;
        writeFloatWav(w('.mono.wav'), mono.map((v) => v * 10 ** (gainDb / 20)), 48000);
        encode(w('.mono.wav'), w('.m4a'), group.bitrate);
        // A syllable is shorter than the meter's 400 ms window, so its momentary and integrated
        // loudness read −120.7 LUFS and say nothing; its level is syllableLufs, and its voice's is the line's.
        const { decoded: d, numbers: { momentaryMaxLufs, loudnessLufs, ...numbers } } = measure(w('.m4a'));
        decoded[s.id] = d;
        // Where it sounds: from the first to the last sample within 40 dB of its peak.
        const dp = peakOf(d);
        const on = d.findIndex((v) => Math.abs(v) > dp / 100);
        let off = d.length - 1;
        while (off > 0 && Math.abs(d[off]) <= dp / 100) off--;
        const { n, power } = powerSpectrum(d.subarray(on, off + 1));
        const total = power.reduce((a, b) => a + b, 0);
        const centroid = power.reduce((a, pw, bin) => a + pw * ((bin * 48000) / n), 0) / total;
        const above4k = power.reduce((a, pw, bin) => a + ((bin * 48000) / n > 4000 ? pw : 0), 0) / total;
        const soundingMs = ((off - on + 1) / 48) | 0;
        // The voiced part, where the note itself sounds: until the 5 ms RMS last comes within 12 dB of
        // its loudest. After it is the plate's tail, where a pitch reading means nothing.
        const rmsAt = (i) => { let e = 0; for (let j = i; j < i + 240; j++) e += d[j] * d[j]; return Math.sqrt(e / 240); };
        let loudest = 0;
        for (let i = on; i + 240 <= d.length; i += 240) loudest = Math.max(loudest, rmsAt(i));
        let voicedEnd = on;
        for (let i = on; i + 240 <= d.length; i += 240) if (rmsAt(i) >= loudest / 10 ** (12 / 20)) voicedEnd = i + 240;
        const voicedMs = ((voicedEnd - on) / 48) | 0;
        const entry = {
            id: s.id,
            ...(s.role ? { role: s.role } : {}),
            mouth: s.mouth,
            file: `src/assets/sounds/babble/${s.id}.m4a`,
            session: `art/sound/babble/${s.id}.scraft`,
            // Dry, on a stereo track: the two channels come out identical, so the fold loses nothing.
            bounce: { samples: end, seconds: s.seconds, peakDbfs: round(info.peak_db, 2), ...(lr ? { leftRightMaxDiffDb: round(db(lr / p), 1) } : { leftRightIdentical: true }) },
            syllableLufs: round(-20 - toCommon[s.id] + gainDb, 2),
            gainDb: round(gainDb, 2),
            tailDb: round(db(tail / p), 1),
            soundingMs,
            voicedMs,
            // The pitch where it starts (20 ms from 8 ms in) and where it ends (the last 20 ms of the voiced part).
            pitchHz: [pitchAt(d, 48000, on / 48 + 8), pitchAt(d, 48000, Math.max(on / 48 + 8, voicedEnd / 48 - 20))],
            // The contour: 10 ms windows every 5 ms across the voiced part.
            pitchTrackHz: Array.from({ length: Math.max(1, Math.floor((voicedEnd / 48 - 10 - on / 48) / 5) + 1) }, (_, i) => pitchAt(d, 48000, on / 48 + 5 * i, 10)),
            centroidHz: Math.round(centroid),
            above4kPercent: round(above4k * 100, 3),
            bitrateTarget: group.bitrate,
            ...numbers,
            sha256: sha256(w('.m4a')),
        };
        const b = group.budget;
        if (numbers.bytes > b.bytes) fail(`${s.id}: ${numbers.bytes} B is over ${b.bytes} B`);
        if (!(numbers.decodedPeakDbfs < b.peakCeilingDbfs) || !(numbers.volumedetectMaxDb < b.peakCeilingDbfs)) fail(`${s.id}: the decoded peak ${numbers.decodedPeakDbfs} dBFS is not under ${b.peakCeilingDbfs} dBFS`);
        if (db(tail / p) > b.tailDb) fail(`${s.id}: the last 10 ms are only ${db(tail / p).toFixed(1)} dB below the peak; the bounce cuts the tail`);
        if (entry.above4kPercent >= b.above4kPercent) fail(`${s.id}: ${entry.above4kPercent} % of its energy is above 4 kHz`);
        if (numbers.channels !== 1 || numbers.codec !== 'aac LC') fail(`${s.id}: not mono AAC-LC`);
        return entry;
    });

    // The line again, from the decoded files: what the tutorial will play.
    const after = renderLine(group.lines[who], list, decoded, talk, k, group.order);
    writeFloatWav(`${WORK}/${who}-line.wav`, after.samples, 48000);
    const lineLufs = momentaryMax(`${WORK}/${who}-line.wav`);
    if (Math.abs(lineLufs - target) > group.level.toleranceLu) fail(`${who}: the sample line is at ${lineLufs} LUFS, not ${target} ± ${group.level.toleranceLu}`);
    return {
        line: {
            text: group.lines[who],
            lettersPerSyllable: k,
            syllables: after.syllables,
            seconds: round(after.samples.length / 48000, 3),
            momentaryMaxLufs: lineLufs,
            peakDbfs: round(db(peakOf(after.samples)), 2),
        },
        voiceGainDb: round(voiceGain, 2),
        syllables,
    };
}

/** Puts a built file in the repo, or in --check compares it with the committed one. */
let differences = 0;
function deliver(built, rel) {
    const repo = path.join(ROOT, rel);
    const bytes = fs.readFileSync(built);
    if (check) {
        const same = fs.existsSync(repo) && Buffer.compare(bytes, fs.readFileSync(repo)) === 0;
        if (!same) { differences++; console.log(`✖ ${rel} differs from a clean rebuild`); }
    } else {
        fs.mkdirSync(path.dirname(repo), { recursive: true });
        fs.writeFileSync(repo, bytes);
    }
}

const installed = versions();
for (const key of Object.keys(JOB.tools)) {
    if (installed[key] !== JOB.tools[key]) console.log(`! ${key} is "${installed[key]}", the committed files came from "${JOB.tools[key]}"; bytes may differ`);
}
if (!check) fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

const report = { about: 'Generated by scripts/sound/build.mjs from art/sound/sounds.json. Do not edit.', tools: installed, budget: BUDGET, sounds: [], loops: [] };
for (const sound of JOB.sounds) {
    const entry = buildSound(sound);
    report.sounds.push(entry);
    deliver(`${WORK}/${sound.id}.scraft`, entry.session);
    deliver(`${WORK}/${sound.id}.m4a`, entry.file);
    console.log(`${check ? "✔ checked" : "✔ built"} ${sound.id}: ${entry.seconds} s, ${entry.bytes} B, decoded peak ${entry.decodedPeakDbfs} dBFS, momentary max ${entry.momentaryMaxLufs} LUFS`);
}
for (const loop of JOB.loops) {
    const entry = buildLoop(loop);
    report.loops.push(entry);
    deliver(`${WORK}/${loop.id}.m4a`, entry.file);
    console.log(`${check ? '✔ checked' : '✔ built'} ${loop.id}: ${entry.seconds} s, ${entry.bytes} B (source ${entry.source.bytes} B), decoded peak ${entry.decodedPeakDbfs} dBFS, join before encoding ${entry.seam.inputJoin.jump} (steps p99.9 ${entry.seam.inputJoin.p999}), edges ${entry.seam.edgeRmsDbfs.join(' / ')} dBFS RMS, lag ${entry.seam.lag}`);
}
if (JOB.babble) {
    const group = JOB.babble;
    const talk = JSON.parse(fs.readFileSync(path.join(ROOT, group.talk), 'utf8')).motion.talk;
    const ui = report.sounds.map((s) => s.momentaryMaxLufs);
    report.babble = { budget: group.budget, level: { ...group.level, uiSoundsMomentaryMaxLufs: ui }, talk, voices: {} };
    for (const [who, list] of Object.entries(group.voices)) {
        const voice = buildVoice(who, list, group, talk);
        voice.line.belowUiSoundsLu = round(ui.reduce((a, b) => a + b, 0) / ui.length - voice.line.momentaryMaxLufs, 2);
        report.babble.voices[who] = voice;
        for (const s of voice.syllables) {
            deliver(`${WORK}/${s.id}.scraft`, s.session);
            deliver(`${WORK}/${s.id}.m4a`, s.file);
        }
        const sizes = voice.syllables.map((s) => s.bytes);
        console.log(`${check ? '✔ checked' : '✔ built'} ${who}'s babble: ${voice.syllables.length} syllables, ${Math.min(...sizes)}–${Math.max(...sizes)} B, the sample line at ${voice.line.momentaryMaxLufs} LUFS momentary max (${voice.line.belowUiSoundsLu} LU under the UI sounds)`);
    }
}
fs.writeFileSync(`${WORK}/report.json`, JSON.stringify(report, null, 2) + '\n');
deliver(`${WORK}/report.json`, 'art/sound/report.json');

for (const f of failures) console.log(`✖ ${f}`);
if (check) {
    fs.rmSync(WORK, { recursive: true, force: true });
    console.log(differences ? `✖ ${differences} file(s) differ` : '✔ every sound, session and the report match a clean rebuild');
}
process.exit(failures.length || differences ? 1 : 0);
