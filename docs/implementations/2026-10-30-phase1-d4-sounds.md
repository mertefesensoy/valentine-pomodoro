---
id: IMPL-2026-10-30-phase1-d4-sounds
title: "Phase 1 D4: the SoundCraft sound set, and Fly's loop re-encoded"
status: done
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-stage-d, IMPL-2026-10-29-phase1-plan, ADR-0027, SRS]
---

# 2026-10-30 — Phase 1 D4: the SoundCraft sound set, and Fly's loop re-encoded

**Status:** **Done, 2026-10-30.** Approved by the owner from the listening page ("All approved, seamless", §7): the three sounds as built, and Fly's seamless loop, which now ships. The sounds are not wired into the app: the main Stage D session does that after D1 lands (Stage D plan §3.5).
**Branch:** `phase1/d4-sounds`, worktree `C:\vp\stage-d4`, cut from `phase1/stage-d` at `404380a`. Commits use `git commit -- <paths>`. No push, no merge, no EAS.
**Plan:** [Stage D plan](2026-10-30-phase1-stage-d.md) §3.5 and §4.5; [Phase 1 plan](2026-10-29-phase1-plan.md), the D4 row and §4.4; [ADR-0027](../architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md).

---

## 0. Read this first

- **Where this ran.** The session was started in `C:\vp\stage-d`, the main Stage D session's own worktree and branch. The owner had asked for D4 in its own worktree (Stage D plan §7, Q2), and a worktree for it already existed: `C:\vp\stage-d4` on `phase1/d4-sounds`, made at 17:44 from `404380a` and still clean. The session moved there before writing anything. Nothing was written in `C:\vp\stage-d` (`git -C C:/vp/stage-d status` stayed clean).
- **Tool versions, read first:**
  - `soundcraft-cli --version` gives `soundcraft-cli 0.14.0 (windows x86_64)`. That matches the plan's 0.14; unlike VectorCraft, SoundCraft has not drifted.
  - ffmpeg is `8.1.1-full_build-www.gyan.dev` (WinGet, on PATH). Its AAC encoder is ffmpeg's own (`aac`); this build has neither `libfdk_aac` nor Apple's AudioToolbox.
  - Both are recorded in `art/sound/sounds.json` (`tools`). `--check` compares bytes, which holds only on these builds, and the build says so when either differs.
- **Boundaries kept.** Only `art/sound/`, `scripts/sound/`, `src/assets/sounds/`, `art/review/d4-*` and this record changed, plus the backlink blocks and `TRACEABILITY.md` that `check-docs --write` regenerates. No `src/audio/`, settings, `package.json` or app code; no shared doc. Their text is in §10.
- **Two findings for the owner** (§8): Fly's ambient loop had never looped cleanly (the owner chose the seamless version, which now ships), and it is a phone recording, not a SoundCraft sound.

## 1. Problem / Motivation

- **No sounds.** Settings has had a sound toggle since v1 (FR-SET-001), but nothing plays: DEF-007's sound half. v1 never resolved where a completion sound should come from (`DECISIONS.md` Q1). FR-SET-004 asks for three short sounds (focus start, break start, completion), each ≤ 1.5 s and ≤ 25 KB (NFR-PERF-005).
- **Their character.** They will be heard in libraries and in bed. The brand is soft, warm kawaii stationery that never guilts ([`PRODUCT.md`](../../PRODUCT.md), [`DESIGN.md`](../../DESIGN.md)). So none of them can sound like an alarm, and none can be shrill. Completion plays with the sticker placement, the product's one delight moment.
- **Rebuildable.** Every shipped file must rebuild from its script, as the art does (`scripts/art/build.mjs --check`). All sounds are synthesised in SoundCraft so that nothing needs a licence (ADR-0027).
- **Fly's ambient loop is 1.19 MB.** `src/assets/sounds/fly-ambient.m4a` was 1,248,679 B. (Sizes in this record use 1 KB = 1,024 B, as the 25 KB = 25,600 B budget does.) The plan asked for mono AAC at about 64–96 kbit/s, with the loop seam checked.

## 2. What Changed

| File | Change |
|------|--------|
| `art/sound/sounds.json` | New. The job: each UI sound's script, bounce length and bitrate; each loop's source, output and options; the budgets; the tool builds the committed files came from. |
| `art/sound/focus-start.script`, `break-start.script`, `complete.script` | New. Each sound's source: a path-free `soundcraft-cli script` (one `COMMAND JSON` per line), commented line by line. |
| `art/sound/focus-start.scraft`, `break-start.scraft`, `complete.scraft` | New, generated. The SoundCraft session each script saves: the editable source, openable in the SoundCraft app. |
| `art/sound/report.json` | New, generated. Every measurement of every built file; the numbers in this record and on the listening page. |
| `art/sound/.gitattributes` | New. `* -text`, so the sessions and the report reach every checkout byte for byte whatever `core.autocrlf` says (the root `.gitattributes` does the same for the art folders). |
| `art/sound/source/fly-ambient.m4a` | Moved here from `src/assets/sounds/` (the same blob, so the repo does not grow). It is now the build's input for Fly's loop, so a rebuild never re-encodes its own output. |
| `scripts/sound/build.mjs` | New. The pipeline: script → session → bounce → mono → −1 dBFS → AAC, then the checks; `--check` rebuilds in a temp folder and compares bytes. |
| `scripts/sound/review.mjs` | New. Writes the listening page from the report, the shipped files and the scripts. |
| `src/assets/sounds/focus-start.m4a`, `break-start.m4a`, `complete.m4a` | New, generated. The three UI sounds. |
| `src/assets/sounds/fly-ambient.m4a` | Re-made, same name: the source with its leading silence and fade-in trimmed and its tail crossfaded into its head, so it loops without a gap (§3.4), as mono AAC-LC at 64 kbit/s. 562,231 B and 68.38 s (was 1,248,679 B and 70.29 s). The owner chose this seamless loop over a faithful re-encode (§7). No code changes. |
| `art/review/d4-fly-ambient-seamless.m4a` | Built in `a739f93` as the seamless candidate for the owner, and deleted once they chose it: it became `src/assets/sounds/fly-ambient.m4a` itself, byte for byte (SHA-256 `97adea64…`). |
| `art/review/d4-sounds.html` | New, generated. The listening page, embedding every sound once as a data URI. Published privately for the phone as https://claude.ai/artifact/67oZ8P8jyD7nYDZtXRpfrb. The owner approved from version 2 (3,290,305 B), which held three Fly versions and three questions. Since the approval it shows today's file, the shipped loop and the owner's words (2,517,194 B). |
| `docs/implementations/2026-10-30-phase1-d4-sounds.md` | This record. |

## 3. Implementation Approach

### 3.1 The sources

Each UI sound is one script under `art/sound/`. A script is the reviewable source; the `.scraft` session it saves is the editable one. SoundCraft is a DAW, so a sound is a session of instrument tracks holding MIDI notes:

- **Instruments:** `subtractive_synth` for the chime and `drum_synth` for completion's pop. The `sampler` is never used, and no audio file is imported. One built-in effect, `plate_reverb`, sits on each chime track for warmth (§5).
- **Timing:** each script sets 125 bpm. SoundCraft counts 960 ticks per quarter note (measured: 240 ticks at 120 bpm started a note 125 ms in), so one tick is exactly 0.5 ms (§4.6) and the note times read as milliseconds.
- **Path-free:** a script names no file. The build adds the work folder's paths, so the same script runs anywhere.
- **Stereo tracks:** SoundCraft 0.14 bounces a *mono* track at centre pan 6.02 dB louder on the right than on the left (measured: R = 2 × L, sample for sample). A stereo-format track bounces equal channels, so every script uses stereo tracks and the build folds them (§3.2).

### 3.2 The build, `scripts/sound/build.mjs`

For each UI sound in `sounds.json`:

1. `soundcraft-cli script <work>/<id>.script --save <work>/<id>.scraft`. The session's `name` field comes from the file name, so the work copy keeps the repo's base name and the session file comes out identical.
2. `soundcraft-cli script <work>/<id>.bounce.script --in <work>/<id>.scraft`, a one-line script holding `file.bounce_mix {path, format: wav, bit_depth: 32f, dither: false, start: 0, end: <samples>}`. The bounce comes from the *saved* session, which proves that the committed `.scraft` alone makes the sound. `end` is in samples at 48 kHz: 40,800 for 0.85 s and 52,800 for 1.1 s. A number like `0.5` is read as samples and bounces one sample.
3. **Fold to mono:** m[n] = (L[n] + R[n]) / 2. The plate's `width: 0` keeps L and R within −37.6 to −45.7 dB of each other relative to the peak, so this is a plain average, not a mix decision. The figure is in the report as `bounce.leftRightMaxDiffDb`.
4. **Scale:** the sample peak p = max |m[n]|, then every sample is multiplied by k = g / p, with g = 10^(−1/20) (§4.1). The result is written as a mono 32-bit float WAV, so ffmpeg encodes exactly what was measured.
5. **Encode:** `ffmpeg -i in.wav -map_metadata -1 -map_chapters -1 -fflags +bitexact -flags:a +bitexact -c:a aac -b:a 96k -ac 1 out.m4a`. There is no `-ar`, so no resampling: the UI sounds stay at 48 kHz. `+bitexact` keeps ffmpeg's version string out of the file and zeroes the creation times. The container has an edit list that hides the encoder's 1,024 priming samples (§4.4).
6. **Measure and check** (`measure`): ffprobe's container duration, the size, the bitrate, the peak of the file decoded by ffmpeg, `volumedetect`'s `max_volume`, and the EBU R 128 meter's true peak, momentary maximum and integrated loudness. The build exits 1 when any of these fails:
   - duration ≤ 1.5 s
   - size ≤ 25,600 B
   - decoded peak < 0 dBFS, both as computed and as `volumedetect` reads it
   - the bounce's last 10 ms ≥ 60 dB below its peak, so the bounce never cuts a tail off

Outputs: `art/sound/<id>.scraft`, `src/assets/sounds/<id>.m4a`, and `art/sound/report.json` for everything.

**Contracts.**
- `normalise(mono, rate, wavOut)`: input is a non-silent sample array; it writes the scaled float WAV and returns the measured peak and the applied gain in dB; afterwards the peak is g to float32 precision.
- `seamlessLoop(x, a, c)`: requires 0 ≤ a, 0 < c, a + 2c ≤ N; returns N − a − c samples (§4.5).
- `deliver(built, rel)`: in a build it copies into the repo; in `--check` it compares bytes and counts each difference. It has no other side effects.
- The work folder is `C:/vp-sound/build` (or `VP_SOUND_WORK`), emptied at the start of every build, as the art build uses `C:/vp-art`.

### 3.3 The three sounds

One voice and one key for all three: a soft chime in C major. The voice is a sine with a triangle an octave up at 22 %, a short filter blip on each attack (the "tine"), no sustain, a 4 ms attack (soft, but no click), and a small, dark plate reverb (mix 14–16 %, 0.6–0.8 s, damping 4.5–5 kHz, low cut 250 Hz). The register is C5–C6 (523–1,047 Hz fundamentals). That is high enough to carry on an iPhone speaker, which is weak below about 400 Hz; G4 at 392 Hz was tried first and moved up for that reason. It is low enough that no sound has energy above 4 kHz worth measuring (0.00–0.01 % in every window measured), and the spectral centroid stays between 553 and 1,264 Hz (Hann-windowed spans of 0–0.15, 0.15–0.4 and 0.4–0.8 s of each final bounce). That is the "never shrill" check.

The three form one phrase:

| Sound | Notes (time in ms, velocity) | Gesture |
|-------|------------------------------|---------|
| **Focus start** | C5 (0, 84) → G5 (110, 100) | Rises a fifth and stays open on the dominant, because the work is ahead. |
| **Break start** | G5 (0, 100) → E5 (200, 64) → C5 (400, 52); decay 380 ms | Steps back down to the tonic and grows quieter: the exhale. It comes to rest where focus start left off. |
| **Completion** | pop (0) · C5 (10, 76) → E5 (65, 80) → G5 (120, 86) → C6 + E6 (175, 100 and 44); decay 900 ms | A soft pop as the sticker is pressed on: `drum_synth`'s high tom, tuned up 9 semitones, decay 90 ms, 6 dB down. Then the arpeggio climbs to C6: the arc finished an octave up. |

**Balancing loudness.** All three are scaled to the same −1 dBFS peak, which equalises peaks, not loudness. The first break start sounded about 3 LU louder than the others, the relaxing cue being the loudest. Its peak came from the second note starting over the first. It was fixed by design, not by gain: a diminuendo (100 → 64 → 52), notes 200 ms apart and a shorter decay. That brought it level (§4.3). Two of the four variants tried decoded *above* 0 dBFS (§8.3), and the build rejected them.

### 3.4 Fly's loop

- **The finding.** The source has never looped cleanly. It opens with 112.5 ms of digital silence (−170 dBFS RMS over its first 50 ms), then fades in over about 150 ms, reaching its body level of −11.2 dBFS RMS by 300 ms. It ends on a hard cut at full level, with its last sample at −0.278. So at every wrap, every 70.3 s, the sound clicks, drops out for about 0.1 s and fades back in.
- **Two versions were offered.**
  - **A faithful re-encode.** The source decoded by ffmpeg, scaled to −1 dBFS (−0.76 dB, from a −0.24 dBFS peak) and encoded at 64 kbit/s with the source's 44.1 kHz kept: 579,315 B. It had the same 3,099,648 samples, no time shift (cross-correlation lag 0) and both edges within 0.13 dB of the input's. So it kept the seam unchanged, the only promise a faithful re-encode can make, click and dropout included.
  - **A seamless loop.** The first 17,408 samples (0.395 s: the silence and the fade-in) are trimmed. The last 66,560 samples (1.509 s) are crossfaded into the head with equal power and dropped (§4.5). The result is 3,015,680 samples (68.38 s). Every length is a whole number of 1,024-sample AAC frames, so the loop stays frame-aligned (§4.4). Its input join is 0.0069 against a 99.9th-percentile step of 0.0242, and its edges are at −11.85 and −11.96 dBFS RMS against a body of −11.99.
- **The seamless loop ships** (the owner, §7). Its `seamless` block moved from the candidate entry onto `fly-ambient` in `sounds.json`, the candidate entry and its file were removed, and the build was re-run. The shipped file is byte-identical to the candidate the owner heard (SHA-256 `97adea64…`), because the encoded bytes depend only on the samples and the flags, not on the entry's name. Going back to the faithful re-encode is one edit: drop the `seamless` block and rebuild.

### 3.5 `--check`: what is compared

`node scripts/sound/build.mjs --check` rebuilds everything in a fresh `os.tmpdir()` folder and compares, byte for byte:
- the three `.scraft` sessions
- the three UI `.m4a` files
- Fly's file
- `art/sound/report.json`, which carries every measurement and each file's SHA-256

It exits 1 on any difference or any failed budget. Both tools are deterministic here:
- **SoundCraft:** two bounces of the same session gave identical bytes, with and without the plate reverb. The session file carries no timestamp or absolute path; its only variable is the `name` taken from the file name (§3.2).
- **ffmpeg:** two encodes of the same WAV gave identical bytes.

Nothing needed pinning, unlike the art build's timestamps. What `--check` cannot prove is portability: another SoundCraft or ffmpeg build may produce different bytes, so the build names the builds it expects (§0).

### 3.6 The listening page

`node scripts/sound/review.mjs` writes `art/review/d4-sounds.html` from the report, the shipped files and the scripts. Its colours are the C1 tokens (Strawberry Milk light, Midnight Plum dark) from `src/theme/palette.json`, and its headings use Baloo 2 from the C2 specimen. It shows:
- **Each sound:** a play button, its use and gesture, its notes drawn from the script (time across, pitch up, the pop in the accent red), meters for duration and size against the budget, its decoded peak and its momentary loudness.
- **"Play all three in order",** to judge the set as a family.
- **Fly's versions,** each with a player and a "Hear the loop point" button. That button decodes the file with Web Audio and plays its last 4 s looping into its first 4 s, so each file's own join is heard with nothing added by a player. As the owner heard it, the page held today's file, the faithful re-encode and the seamless candidate, with the three questions of §7. The rows are built from the report, so after the approval the regenerated page shows today's file and the shipped loop, with the owner's words where the questions were.

Each file is embedded once as a data URI; the first draft embedded Fly's three files twice and weighed 6,476,044 B.

All playback goes through one Web Audio context, created and resumed inside the first tap, because iOS unlocks audio only inside a gesture. Each data URI is decoded straight from its base64 rather than fetched, so no content-security rule on the published copy can block it. "Play all three" schedules the three sounds on the context's clock, so nothing after the tap needs a new gesture. The page was driven once in the browser pane's Chromium from a localhost copy, with no console errors. The three sounds decoded at exactly 40,800, 52,800 and 52,800 samples, which shows the browser honours the edit list (§4.4). They were scheduled in order, and the seamless loop decoded (68.382 s) and played across its join. Safari on iOS was not tried; the owner's phone is that test.

The `--fragment` form was published privately so the owner can open it on a phone.

## 4. Mathematical / Statistical Details

### 4.1 Level: −1 dBFS

A level L in dBFS is the linear gain g = 10^(L/20), so −1 dBFS is g = 10^(−1/20) ≈ 0.891251. A mono bounce with sample peak p (linear, 0 < p ≤ 1) is multiplied by k = g / p. In decibels the applied gain is G = −1 − 20·log₁₀ p dB, which leaves about 1 dB for AAC's overshoot (Phase 1 plan §4.4).

| Sound | Mono peak p | Applied gain G | Decoded peak | Overshoot past −1 dBFS |
|-------|-------------|----------------|--------------|------------------------|
| focus-start | −18.57 dBFS | +17.57 dB | −1.005 dBFS | none (−0.005 dB) |
| break-start | −21.63 dBFS | +20.63 dB | −1.002 dBFS | none |
| complete | −13.75 dBFS | +12.75 dB | −1.004 dBFS | none |
| fly-ambient (the shipped seamless loop) | −0.24 dBFS | −0.76 dB | −0.849 dBFS | +0.151 dB |
| fly-ambient, faithful (offered, not chosen) | −0.24 dBFS | −0.76 dB | −1.087 dBFS | none |

The decoded peak is computed on ffmpeg's float decode, to 3 decimals. `volumedetect` reports the same peaks rounded to 0.1 dB (−1.0, −1.0, −1.0, −0.8, and −1.1 for the faithful file).

### 4.2 Size

At an average bitrate R (bit/s), a sound of duration T seconds carries about R·T/8 bytes of audio, plus the container. For the UI sounds the container is about 1.2 KB: the measured overhead, size − R·T/8, is 1,186, 1,230 and 1,231 B.

- **Focus start:** 94,246 × 0.85 / 8 = 10,014 B of audio + 1,185 B = 11,199 B.
- **Worst case allowed:** a 1.5 s sound at the 96 kbit/s target is 96,000 × 1.5 / 8 = 18,000 B + about 1,250 B = about 19,250 B. That is 75 % of the 25,600 B budget.
- **Fly, as shipped:** 64,285 × 68.382 / 8 ≈ 549,492 B of audio (the `mdat` box holds 549,693 B), plus a 12,502 B `moov` box, mostly the per-frame size table (2,946 frames × 4 B), plus 36 B of `ftyp` and `free`. That makes 562,231 B (549 KB), 45.0 % of the original's 1,248,679 B. The faithful re-encode was 579,315 B, 46.4 %, for the 1.9 s the seamless loop trims. The original was itself 96 kbit/s mono AAC: 843,536 B of audio, plus 385,316 B of empty `free` padding and a 6,980 B waveform box (`wafm`) from the phone that recorded it.

### 4.3 Loudness

These are ffmpeg's EBU R 128 meter (`ebur128`) readings. The meter K-weights the signal and computes L = −0.691 + 10·log₁₀(Σᵢ Gᵢ·zᵢ) LUFS, where zᵢ is channel i's mean square over the window. A mono file is one channel with G = 1, so these figures compare the sounds with each other, not with a playback level.

- **Momentary maximum** (a 400 ms window), the comparison figure for sounds this short: focus start **−14.4**, break start **−14.0**, completion **−14.1** LUFS, a spread of 0.4 LU. Before the redesign, break start measured −11.3 against −14.4 and −14.1.
- **Integrated loudness** (gated over 400 ms blocks) says little under about 1.5 s: −16.9, −15.2 and −16.8 LUFS. It is in the report for completeness.

### 4.4 Duration and AAC framing

AAC-LC codes 1,024 samples per frame, and ffmpeg's encoder adds 1,024 priming samples in front. The MP4's edit list (`elst`, `media_time` 1024) tells a player to skip them and to stop after the real length, so the container duration is exact: 0.85 s and 1.1 s. ffmpeg's decoder honours the skip but returns the zero-padded tail of the last frame, so the decoded counts are ⌈(N + 1024) / 1024⌉ × 1024 − 1024:

- **N = 40,800:** gives 40,960 (160 samples, 3.3 ms, of near-silence).
- **N = 52,800:** gives 53,248.
- **Fly, N = 3,015,680 = 2,945 × 1,024:** gives exactly 3,015,680. The source was frame-aligned (3,099,648 = 3,027 × 1,024), and the trim and the crossfade are whole frames, so the loop still is. That alignment, with no resampling, is what keeps a player that ignores the end trim from adding up to 23 ms of padding at every wrap.

The budget figure is the container duration. Fly's edit list is in the movie timescale, 1,000 per second. It says 68,382 ms (ffprobe reads 68.381995 s), while the 3,015,680 samples last 3,015,680 / 44,100 = 68.382766 s. ffmpeg decodes all 3,015,680 samples, because it trims by the media timescale (`mdhd`: 3,016,704 = 1,024 priming + 3,015,680). A player that cuts at the millisecond edit list instead drops the last 34 samples (0.77 ms). That is a step inside the noise at the wrap, not a gap. (The faithful file's edit list rounded the other way: 70,287 ms, 9 samples past its end.)

### 4.5 The loop seam

**The join.** For a decoded loop x[0..N−1], the join is J = |x[N−1] − x[0]|. It is judged against P₉₉.₉, the 99.9th percentile of the file's own sample-to-sample steps |x[n] − x[n−1]|.

- **Source:** J = 0.255 against P₉₉.₉ = 0.024, a step about 10 times the file's normal largest.
- **Faithful re-encode (not chosen):** J = 0.251 decoded; the same click.

**The crossfade.** With a = 17,408 trimmed samples and c = 66,560 crossfaded samples, the seamless loop is

  y[i] = x[N−c+i]·cos θᵢ + x[a+i]·sin θᵢ,  θᵢ = (π/2)·(i + ½)/c,  for 0 ≤ i < c
  y[i] = x[a+i],  for c ≤ i < N − a − c

- **The wrap,** y[last] → y[0], is x[N−c−1] → (almost) x[N−c]: a step the source itself makes.
- **The fade's end,** y[c−1] → y[c], is (almost) x[a+c−1] → x[a+c].
- **Why equal power:** the cabin noise at the two ends is uncorrelated, so the powers add, and cos² + sin² = 1 keeps the level flat. A linear fade would dip by 3 dB in the middle.
- **Frame alignment:** a = 17 × 1,024 and c = 65 × 1,024, so N − a − c = 2,945 × 1,024.

**Why the decoded join is reported, not gated.** AAC keeps the sound, not the waveform. At 64 kbit/s on this noise, a decoded sample can sit up to 0.09 (faithful) or 0.28 (seamless, at its last samples) from its input, at an SNR of 31.6 and 30.5 dB, with the error shaped under the signal where it is not heard. The encoder also treats each end of the file as a cliff into silence. So even a perfect input join decodes as J = 0.215 for the shipped loop. The build therefore checks each part where it can be checked:
- **The input join,** where the loop is made: 0.0069 ≤ P₉₉.₉ = 0.0242.
- **The decoded file's structure:** its length, a time shift of 0, a whole number of frames, and its 200 ms edges within 1 dB of the input's and within 1.5 dB of the body's.

The listening page plays each join for the ear.

### 4.6 Ticks to milliseconds

At tempo B bpm and 960 ticks per quarter note, one tick lasts 60,000 / (B × 960) ms. At B = 125 that is 0.5 ms exactly, so `start_ticks: 220` is 110 ms. The tick rate was measured, not assumed: a 240-tick offset at 120 bpm started a note 125 ms after the first, which is 240 × 60,000 / (120 × 960) = 125 ms.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| The two built-in synths as the only sound sources, with SoundCraft's built-in plate reverb | Synths only, dry; the `sampler` with an imported file | A dry sine pluck sounds clinical; a small plate gives the warmth the brief asks for. The reverb is SoundCraft's own processing and adds no samples, so "no third-party samples" holds. The sampler is the one thing that would import outside audio, and it is never used. |
| One chime voice, one key, and a melodic arc across the three | Three unrelated sounds; a different instrument per sound | The set reads as one family, and the order tells the session's story: open, rest, resolve. Each cue can still be told apart in under 200 ms. |
| C5–C6 register | G4–C5 (tried first); C6 and above | iPhone speakers are weak below about 400 Hz, so G4 nearly vanished. Above C6 a sine chime starts to sound like a notification ping. |
| Stereo instrument tracks, folded to mono in Node | Mono tracks; ffmpeg's `-ac 1` | SoundCraft 0.14's mono-track pan puts the right channel 6 dB above the left. Folding and scaling in Node means the peak that is measured is the one that is encoded. |
| Bounce from the saved `.scraft`, not straight from the script | `script --bounce` in one run | It proves the committed session alone makes the sound, and `--check` covers both the session and the bounce. |
| 96 kbit/s for the UI sounds | 64 kbit/s | They are at most 13.7 KB at 96 kbit/s, well inside 25 KB. The extra bits go to clean attacks, which is where AAC overshoots and smears. |
| Loudness balanced by design (break start's diminuendo) | Scale each sound to a common loudness instead of a common peak | The brief fixes the peak at −1 dBFS for headroom. Scaling down to a loudness target would break that contract, and the wiring would inherit three different peaks. |
| Fly's original moved to `art/sound/source/`, and the build encodes from it | Re-encode the file in place; keep only the output | An in-place encode would make each build re-encode its own output, one more lossy generation per build, and `--check` would compare generation N+1 with N. The move is the same git blob, so the repo does not grow. |
| Fly at 64 kbit/s | 96 kbit/s; a lossless remux that only drops the padding | At 96 kbit/s the audio stays about 824 KB (843,536 B), as it is in a remux. Only 64 kbit/s shrinks it: to 566 KB (579,315 B) faithfully, and to 549 KB (562,231 B) as the shipped seamless loop. The remux (lossless; the source without its 385,316 B of padding and its 6,980 B waveform box, about 836 KB) was the fallback had the owner heard a difference; they approved 64 kbit/s (§7). |
| The seamless loop offered as a candidate beside a faithful re-encode, not shipped unasked | Ship the seamless loop straight away; report the finding only | The brief asked for a re-encode. Trimming and crossfading changes the content, so it was the owner's call. The page let them hear both, and they chose the seamless loop (§7). |
| `art/sound/.gitattributes` with `* -text` | A line in the root `.gitattributes` | The root file is outside this task's paths. A nested file has the same effect, applies only here, and needs no shared change. |
| `report.json` committed and compared in `--check` | Measurements printed only | The numbers in this record and on the page can be regenerated and checked, not just trusted. |

## 6. Verification

Run from `C:\vp\stage-d4`:

```bash
node scripts/sound/build.mjs --check
node scripts/sound/review.mjs
node scripts/docs/check-docs.mjs
```

- [x] `soundcraft-cli --version` read first: 0.14.0 (§0).
- [x] Determinism: SoundCraft bounced the same session to identical bytes twice, dry and with the plate; ffmpeg encoded the same WAV to identical bytes twice; the session file has no timestamp or path (§3.5).
- [x] `node scripts/sound/build.mjs --check` exits 0: "every sound, session and the report match a clean rebuild".
- [x] Budgets: focus start 0.85 s and 11,199 B; break start 1.1 s and 14,010 B; completion 1.1 s and 14,069 B. Each is ≤ 1.5 s and ≤ 25,600 B, with a decoded peak < 0 dBFS (−1.005, −1.002, −1.004; `volumedetect` −1.0 each) and a tail ≥ 60 dB down (−84.2, −78.5, −81.7 dB).
- [x] Fly, the shipped seamless loop: mono AAC-LC at 64.29 kbit/s, 562,231 B, 3,015,680 samples (2,945 whole frames), lag 0, input join 0.0069 ≤ 0.0242, edges −11.85 and −11.96 against a body of −11.99 dBFS RMS, decoded peak −0.849 dBFS (§4.5).
- [x] The shipped Fly file is byte-identical to the candidate the owner heard (SHA-256 `97adea64…`).
- [x] The faithful re-encode, while it was built: 579,315 B, 3,099,648 samples as before, lag 0, decoded peak −1.087 dBFS, edges within 0.13 dB of the input's.
- [x] Every generated text file is LF only (a byte count of CR = 0 in each).
- [x] The listening page is built and published privately.
- [x] **The owner's approval, in their words (§7):** "All approved, seamless".
- [ ] After the wiring (main session): the sounds respect the silent switch and the Settings toggle on a device (needs a physical device; Stage D plan §6).

## 7. The owner's approval

**Approved, 2026-10-30.** The owner's words, verbatim:

> All approved, seamless

They listened on the [listening page](../../art/review/d4-sounds.html) (version 2 of the private copy), which asked three questions:
1. Are the three sounds right as they are, or should any be softer, brighter, shorter or a different tune?
2. Fly's loop: keep today's loop as it is, or use the seamless one?
3. Does Fly at 64 kbit/s sound the same as today's file?

Their reply matched, word for word, one of the two reply buttons this session offered with the question "Do the sounds sound right, and which Fly loop should ship?". The other button was "Approved, keep Fly as is". Read against the three questions, it approves:
1. the three sounds as built
2. the seamless loop
3. Fly at 64 kbit/s

What followed (§3.4):
- The seamless loop became `src/assets/sounds/fly-ambient.m4a`, byte-identical to what they heard.
- The candidate file was removed.
- The page now shows their words.

## 8. Findings and follow-ups

1. **Fly's loop had never been seamless.** The source has 112.5 ms of silence and a fade-in at the start and a hard cut at the end, so v1.3.1 drops out and clicks every 70 s (§3.4). The owner chose the seamless loop, which now ships (§7).
2. **Fly's provenance.** The source's metadata says it was recorded on an Android phone (`com.android.version=9`, created 2023-09-06), and it is not a SoundCraft sound. So ADR-0027's "every app sound is synthesised" holds for the three UI sounds but not for Fly. Who made the recording, and under what licence, is not recorded anywhere in the repo. That is TBD for the owner: replace it with a SoundCraft ambience, or record its origin. It was not changed here.
3. **AAC can overshoot by more than 1 dB.** Two rejected break-start variants decoded at +0.297 and +0.109 dBFS from a −1 dBFS input: 1.30 and 1.11 dB of overshoot on overlapping note onsets. The plan's "about 1 dB" of headroom (Phase 1 plan §4.4) is not always enough with ffmpeg's encoder. The decoded-peak gate caught both, and it is why the gate decodes every file rather than trusting the headroom.
4. **SoundCraft 0.14's mono-track pan** bounces the right channel 6.02 dB above the left at centre (§3.1). The scripts use stereo tracks to avoid it. This is worth reporting upstream.
5. **For the wiring (main session):**
   - The three files can play at the same volume; their loudness is within 0.4 LU.
   - `complete.m4a` opens with its pop at t = 0, so start it with the placement spring, not after it.
   - expo-audio restarts a loop by seeking, which may add a gap of its own on the device even with the seamless file. Worth a listen at the device check. `fly-ambient.m4a` is now 68.38 s long (was 70.29 s); nothing in the code depends on its length.

## 9. Related Docs

- [Stage D plan](2026-10-30-phase1-stage-d.md) §3.5, §4.5 · [Phase 1 plan](2026-10-29-phase1-plan.md), the D4 row and §4.4
- [ADR-0027](../architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md) · [ADR-0003](../architecture/adr/0003-expo-audio.md)
- [SRS](../srs/SRS.md): FR-SET-004, NFR-PERF-005, FR-SET-001 (DEF-007's sound half)
- [`PRODUCT.md`](../../PRODUCT.md) · [`DESIGN.md`](../../DESIGN.md) · [Documentation conventions](../process/DOCS.md)

## 10. Shared-doc updates to apply at merge

Ready to paste when this branch is merged with the owner's OK.

**`docs/README.md`**, top of the implementation-records table:

```markdown
| 2026-10-30 | [Phase 1 D4: the SoundCraft sound set, and Fly's loop re-encoded](implementations/2026-10-30-phase1-d4-sounds.md) |
```

**`docs/roadmap/ROADMAP.md`**, the Phase 1 table, a row under Stage D:

```markdown
| | D4 SoundCraft sounds: focus start, break start, completion; Fly's loop re-encoded and made seamless | **Done** on `phase1/d4-sounds` from `a739f93` ([D4](../implementations/2026-10-30-phase1-d4-sounds.md)); `scripts/sound/build.mjs --check` byte-identical; 0.85–1.1 s and 10.9–13.7 KB each; Fly 1.19 MB → 549 KB, now a seamless loop; approved by the owner on 2026-10-30 ("All approved, seamless"); wired into the app after D1 |
```

**`docs/srs/SRS.md`**, NFR-PERF-005's status:

```markdown
**Target:** Phase 1 C3, D4 · **Status:** planned (icons, illustrations and the mark met in C3 and C5, 2026-10-30: 79 assets within budget, checked by `scripts/art/check-budgets.mjs`; the UI sounds met in D4, 2026-10-30: three sounds of 11,199–14,069 B against 25,600 B, checked by `scripts/sound/build.mjs`, [D4 record](../implementations/2026-10-30-phase1-d4-sounds.md); mode scenes wait for their phases) · **Verify:** A
```

FR-SET-004 stays `planned` until the main session wires the sounds in, with the silent switch and the toggle; that session changes its status.

**`docs/architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md`**, appended to the status note:

```markdown
SoundCraft is 0.14.0, as planned (`soundcraft-cli --version`, 2026-10-30). The sound pipeline is built as `scripts/sound/build.mjs`: one path-free `soundcraft-cli` script per sound under `art/sound/`, saved as a `.scraft` session, bounced with `file.bounce_mix`, then folded to mono, scaled to −1 dBFS and encoded by ffmpeg 8.1.1, with byte-identical rebuilds checked by `--check` ([D4 record](../../implementations/2026-10-30-phase1-d4-sounds.md)). SoundCraft's built-in plate reverb is used with the two synths; the sampler is not. Fly's ambient loop is a 2023 phone recording, not a SoundCraft sound, so "every app sound" holds for the UI sounds only, until Fly's loop is replaced or its origin is recorded.
```

**`DECISIONS.md`**, Q1's status line (the file is otherwise kept as written; ADR-0027 assigns the formal close to E4):

```markdown
**Status**: Closed 2026-10-30 by Phase 1 D4: neither option. Every UI sound is synthesised in SoundCraft ([ADR-0027](docs/architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md)); the completion sound is `src/assets/sounds/complete.m4a`, approved by the owner on 2026-10-30 ([D4 record](docs/implementations/2026-10-30-phase1-d4-sounds.md)).
```

**`CHANGELOG.md`**, `[Unreleased]` → `### Added`:

```markdown
- **Stage D:** D4, the app's sounds, synthesised in SoundCraft 0.14 from its built-in synths: focus start, break start and completion (0.85–1.1 s and 10.9–13.7 KB each, mono AAC at a −1 dBFS peak, within 0.4 LU of each other), rebuilt byte for byte by `scripts/sound/build.mjs --check`; Fly's ambient loop re-encoded as mono AAC at 64 kbit/s and made seamless, so it no longer drops out and clicks every 70 s (its leading silence and fade-in trimmed, its end crossfaded into its start), 1.19 MB → 549 KB (a739f93, …).
```

**The Stage D plan**, §2's table:

```markdown
| `art/sound/`, `scripts/sound/`, `src/assets/sounds/`, `art/review/d4-*` | D4 | The sound sources, the pipeline, the three UI sounds, Fly's seamless loop and the listening page ([D4 record](2026-10-30-phase1-d4-sounds.md)). |
| `docs/implementations/2026-10-30-phase1-d4-sounds.md` | D4 | The D4 record. |
```

And §6's D4 line: `- [x] D4: three sounds, each ≤ 1.5 s and ≤ 25 KB, rebuilt byte for byte (D4 record). The silent switch and the toggle respected on the device (needs a physical device).` (the second half stays open until the wiring's device check).

## Backlinks
<!-- backlinks:start -->
- ["Phase 1 Stage D (D1–D4): the screens in the Sticker Diary design, plan"](2026-10-30-phase1-stage-d.md)
- ["Phase 1 D4, wired in: D4's sounds merged into Stage D and played by Classic"](2026-11-01-phase1-d4-wiring.md)
- ["Phase 1 D5: the general tutorial, Pomo & Doro show you around"](2026-11-01-phase1-d5-tutorial.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
