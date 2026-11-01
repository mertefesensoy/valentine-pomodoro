---
id: IMPL-2026-11-01-phase1-d5-assets
title: "Phase 1 D5, the assets: Pomo & Doro's tour expressions and their babble"
status: done
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-11-01-phase1-d5-tutorial, IMPL-2026-10-30-phase1-d4-sounds]
---

# 2026-11-01 — Phase 1 D5, the assets: Pomo & Doro's tour expressions and their babble

**Status:** **Done, 2026-11-01.** Both pieces are approved by the owner in their words (§7), committed, and rebuilt byte for byte by every `--check`.
- **The pose sheet is approved, with the nubs:** "Approve, keep nubs".
- **The voices are approved:** version 2, with a small random pitch and volume variation on every syllable at playback. The owner's words: "version 2 with variation is the way to go". They sent version 1 back as too high-pitched and version 3 as "much worse" (§3.6).
- **Open, by the owner's choice:** a trial of more variation, which they called "experimental". The listening page offers ±20 and ±30 cents beside the approved ±10 (§3.7). Until they pick, the approved numbers stand.

Nothing is wired into the app.

**Branch:** `phase1/d5-assets`, worktree `C:\vp\stage-d5`, cut from `phase1/stage-d` at `2fb8d5a`. Commits use `git commit -- <paths>`. No push, no merge, no EAS. The main session fast-forwards `phase1/stage-d` to this branch on the owner's word. This session's own attempt to fast-forward was blocked by its permissions as a change to a shared checkout, and it left the move to the main session.
**Parent:** [D5 record](2026-11-01-phase1-d5-tutorial.md), step 4 (§0), the owner's round-2 request (§3.4) and the approved direction contract (§3.5; `.impeccable/surfaces/app-tutorial-tsx.md`).
**Pages,** both private:
- the pose sheet, [Pomo & Doro Pose Sheet](https://claude.ai/artifact/5VuUpod8BVNbwixWwSBVsp) (`art/review/d5-pose-sheet.html`);
- the listening page, [Pomo & Doro Voices](https://claude.ai/artifact/XExQVu4pibttaBikrHNxry) (`art/review/d5-voices.html`).

---

## 0. Read this first

- **Where this ran.** The session started in `C:\vp\stage-d`, the main D5 session's worktree. As D4's session did, it made its own worktree (`git worktree add -b phase1/d5-assets C:/vp/stage-d5 phase1/stage-d`) and moved there before writing anything. Nothing was written in `C:\vp\stage-d`.
- **Tool versions, read first:**
  - `vectorcraft-cli 0.18.0`, `soundcraft-cli 0.14.0 (windows x86_64)`, `ffmpeg 8.1.1-full_build-www.gyan.dev`.
  - The shipped art's `--check` passed on 0.18.0 before any change: every export was byte-identical.
  - `art/sound/sounds.json` already names these SoundCraft and ffmpeg builds.
- **Boundaries kept.** Only these changed, with no app wiring and no shared doc:
  - `art/`, `scripts/art/` and `scripts/sound/`;
  - `src/assets/sounds/babble/`;
  - 44 new modules in `src/components/stickers/art/`;
  - `art/review/d5-*`;
  - this record.
- **The plan came first.** This record was committed with the plan (§3.1) before any code, as the project's documentation-first rule asks.
- **The owner approved both pages** (§7). The pose sheet's open question was the hands, which C3's construction didn't have. The listening page's open questions were the voices, the level, the pace and the variation.

## 1. Problem / Motivation

The tutorial (`FR-ONB-001`, proposed) has Pomo & Doro take turns explaining the app. In round 2 of the composition (D5 record §3.4), the owner asked for:
- the pair "much more bigger";
- "new expressiosn and animations for expressions as well";
- babble voices, never a human voice.

The shipped art had five poses each, all whole drawings, so the pair couldn't blink, talk or change face without swapping a whole sticker. The app had no voices.

So D5's asset step needed:
- **the art:** Pomo & Doro's talking, happy, excited, curious, proud, winking and surprised faces, a wave, a point and the listener's look, in the shipped sticker style. Each drawing ≤ 30 KB (NFR-PERF-005), with the motion specified and shown.
- **the voices:** a few babble syllables each, from SoundCraft's built-in synths, ≤ 25 KB each, level-matched and a little below D4's UI sounds.
- **a page for each,** for the owner's approval, as D4's listening page was.

## 2. What Changed

| File | Change |
|------|--------|
| `scripts/art/tour-sources.mjs` | New. Writes the tour kit's 44 layer sources, their recipes and motion (`expressions.json`), and the art job, all from the shipped construction; `--check` compares. |
| `art/src/tour/*.svg` (44), `art/src/tour/expressions.json` | New, generated. The layer sources; each expression as a recipe of layers with a held transform; the motion and write-on numbers, the feet and the hands' pivots. |
| `art/jobs/tour.json` | New, generated. The job that builds the 44 layers (SVG and native file, no PNGs). |
| `art/steps/*-tour-*.steps.json`, `art/vc/*-tour-*.vectorcraft`, `art/out/illustration/*-tour-*.svg` | New, built by `scripts/art/build.mjs`: the command lists, the editable VectorCraft sources and the shipped vectors. |
| `src/components/stickers/art/{pomo,doro}Tour*.ts` (44) | New, emitted by `scripts/art/build-icon-components.mjs`, which picks up every `pomo-*` and `doro-*` export. Nothing imports them yet. |
| `scripts/art/tour-motion.js` | New. The motion and the write-on as a small browser script: each sticker's pose is a function of the clock and its last change. Both pages play it, and the builder can read it as a reference. |
| `scripts/art/tour-symbols.mjs` | New. The layers as inline `<symbol>`s for both pages. |
| `scripts/art/review-d5-poses.mjs`, `art/review/d5-pose-sheet.html` | New. The pose sheet and its generator. |
| `scripts/sound/babble-scripts.mjs` | New. The voice design in one table; writes one commented soundcraft-cli script per syllable; `--check` compares. |
| `art/sound/babble/*.script`, `*.scraft` (12 each) | New. Each syllable's script (generated) and the session it saves (built). |
| `art/sound/sounds.json` | New `babble` group: the 12 syllables (mouth, bounce length), the level target, the playback variation, the sample lines and the syllable order. D4's entries are unchanged. |
| `scripts/sound/build.mjs` | Builds the babble group (§3.5). The session-and-bounce steps moved into `bounceMono()`, which D4's sounds now share; their bytes are unchanged. |
| `art/sound/report.json` | Regenerated. D4's entries are unchanged, plus `babble`: every measurement of every syllable and of both sample lines. |
| `src/assets/sounds/babble/*.m4a` (12) | New, built. The syllables. |
| `scripts/sound/review-d5-voices.mjs`, `art/review/d5-voices.html` | New. The listening page and its generator. |
| This record | New. |

## 3. Implementation Approach

### 3.1 The plan (written before any code)

The plan committed in `a6006b4` set the shape this record follows:
- a layered art kit, rather than one drawing per expression;
- the motion played on a pose sheet, from the same numbers the build will use;
- the babble as a separate group in D4's pipeline, levelled by loudness;
- a listening page with D4's Web Audio playback.

It flagged two choices for the owner, the hands and the write-on pace. Both are on the pages.

### 3.2 The art: a layered kit

**Why layers.** A blink, a talking mouth and a face crossing in each change one feature. Drawn as whole stickers, every blink and every mouth shape would be a whole drawing, and a crossfade would fade one body over another. So each character is a kit of layers on the shipped 512 artboard, stacked the way the welcome stacks its diary layers:

| Layer | Per character | What |
|---|---|---|
| `body-cut` | 1 | The die-cut silhouette alone: the white edge, and Pomo's curl's. It carries the lift (the shadow). |
| `hand-{wave,point}-{left,right}` | 4 | A nub in the body's colour with its own 20-unit die-cut edge. |
| `body-fill` | 1 | The fill, the curl's fill and the cheeks, with no face. |
| `eyes-*` | 9 | open, blink, smile (the eye smile), sparkle, wide, wink, proud, look-left, look-right |
| `mouth-*` | 7 | smile, talk-small, talk-wide, talk-round, grin, wow, proud |

**The stacking order** is body-cut, hand, body-fill, eyes, mouth.
- **Why the hand sits between the cut and the fill:** the hand's fill meets the body's fill with no seam, its edge joins the body's edge, and the body's fill hides the hand's root, which is its pivot.
- **The first draft** put the hand under the whole body. The body's white edge then ran between arm and body, and the nub read as a separate blob.

**The construction stays locked.**
- **The body:** `body-cut` and `body-fill` are the shipped idle paths, minus the face.
- **The faces:** every face shape is written once in Pomo's units, around an anchor (an eye's centre, the mouth's top line). It is drawn for Doro scaled by K = 13.7 / 12.3 around Doro's anchors (§4.1).
- **Shapes reused from the shipped poses:** open and the mouth's smile (idle), the eye smile (break), the grin (celebrating).
- **New shapes:**
  - **sparkle:** celebrating's larger eye, with a four-point glint as its highlight;
  - **wide:** rounder, raised eyes with a smaller highlight;
  - **wink:** one open eye and one eye smile;
  - **proud:** a flatter, wider closed arc, with the "w" mouth;
  - **look:** both eyes moved 5.5 units sideways and 1.5 down;
  - **the talking mouths:** a small bowl, a wide bowl with its tongue, and an "o";
  - **wow:** a tall "O".

**Seen and changed while drawing,** each change checked in VectorCraft renders before the build:
- **Proud** first had half-lowered lids, which read as unimpressed. It became "^ω^": the closed arc and the "w" mouth, with the chin up.
- **The surprised "O" and the talking "small" and "round" mouths** grew, because they didn't read at speaking speed.
- **The hands** began as thin sticks with a ball, which read as antennae. They became short, even nubs: radius 30 for the wave and 25 for the point, reaching about 1.6 radii out.

**The hands are the owner's call.** C3 recorded that Pomo & Doro have "no ears, limbs or animal features". The task asks for a wave and a point, which need something to wave and point with. The kit adds a nub that grows out of the body only for those gestures and goes back after. The pose sheet asks about it directly and names the limb-free alternative: a lean and a look, with the ribbon doing all the pointing.

**Inside the 512 box.**
- **Nothing drawn leaves the artboard.** By their paths' control points, the outermost points of all 44 layers span x 1–511 and y 35–478.
- **Squash, stretch, breath and tilt** are transforms of the whole sticker's view, which don't clip.
- **The feet,** the transform origin, are at (256, 478) for Pomo and (256, 476) for Doro: the bottom of the die-cut edge.

**The expressions** (`art/src/tour/expressions.json`) are recipes:

| Expression | Eyes | Mouth | Hand | Held |
|---|---|---|---|---|
| At rest | open | smile | | |
| Talking | open | smile, then a talking mouth per syllable | | |
| Listening (left, right) | look-left / look-right | smile | | |
| Happy | smile | grin | | |
| Excited | sparkle | grin | | 2 % taller |
| Curious | open | talk-round | | tilt −9° |
| Proud | proud | proud | | tilt 3°, 3 % taller |
| A wink | wink | grin | | |
| Surprised | wide | wow | | 5 % taller |
| A wave | smile | grin | wave | |
| Pointing | look (the hand's side) | smile | point | |

**The pipeline:**
1. `node scripts/art/tour-sources.mjs` writes the sources and the job.
2. `node scripts/art/build.mjs art/jobs/tour.json` builds them like every other asset: select all, expand strokes, save `.vectorcraft`, export SVG.
3. `node scripts/art/build-icon-components.mjs` emits the modules.

That generator rewrites every module. With `core.autocrlf=true`, the 76 existing modules came back with LF endings instead of the checkout's CRLF, their content unchanged. They were restored with `git checkout`, so only the 44 new modules are in the commit.

### 3.3 The motion and the pose sheet

**The motion** is in `expressions.json` (`motion`), and `scripts/art/tour-motion.js` plays it:
- **A blink:** the eyes swap to `blink` for 110 ms every 2.8–5.2 s, at random. One blink in five is a double, 140 ms apart. Only open-eyed faces blink, and never mid-change.
- **Talking:**
  - Each babble syllable (§3.4) shows a talking mouth for the first 60 % of its slot, then the smile.
  - On the pose sheet the mouths are three shapes, never the same twice running.
  - On the listening page each syllable shows its own mouth, from `sounds.json`.
- **A change:** 280 ms of squash and stretch about the feet, keeping the area. The old face fades out as the new one fades in, crossing at the bottom of the squash. A held tilt or stretch eases in over 220 ms.
- **Breath:** the height moves ±1.2 %, Pomo every 3.4 s and Doro every 4.1 s, half as much while talking.
- **The wave:** the nub grows from its root over the change, then swings between −16° and +12°, 2.5 swings of 420 ms each.
- **The point:** a nudge of 10 units along the nub's own line, over 320 ms.
- **Under Reduce Motion, swaps only:**
  - no squash, breath, blink, talking loop or gesture;
  - a held tilt or stretch applies at once;
  - the nub is simply there.

**The pose sheet** (`node scripts/art/review-d5-poses.mjs`) reads only the repo: the built layers, the recipes, the tokens and Baloo 2. It has:
- **switches** for Strawberry Milk or Midnight Plum, and for Full motion or Reduce Motion, starting from the system setting;
- **"In the tour":** the pair at the contract's 190 and 140 pt, in a looping scene. A hello and a wave, a line each written on at the proposed pace, then the other faces.
- **a card for every expression,** showing both characters, each playing its own motion, with "Play the change" from rest;
- **a card that cycles through every expression;**
- **the motion table,** and the change drawn to scale;
- **the kit, layer by layer,** with sizes, the stacking order, the feet and the reach;
- **the faces at 64 and 44 pt;**
- **the owner's approval,** where its three questions were (the hands, the faces, the motion).

Each sticker's lift is drawn the way the app's `Sticker` draws it: the silhouette three times, 1 pt right and 2 pt down. The page was checked in the browser pane at desktop width and at 375 pt, in both themes and with Reduce Motion. There were no console errors and no sideways scroll.

### 3.4 How a line is spoken (proposed here)

The D5 record (§4) left the write-on pace and the syllable rate to the contract, and the contract didn't set them. They are proposed here, with the numbers in `expressions.json` (`motion.talk`), and played by `tour-motion.js`'s `writeOn()`.

- **The write-on:**
  - One character every 45 ms, about reading speed (§4.4).
  - A pause of 150 ms after a comma, and of 300 ms after a stop inside the line.
  - A tap finishes the line.
- **The syllables:**
  - A babble syllable on the line's 1st letter, then on every 3rd letter for Pomo and every 4th for Doro.
  - The count starts again after each pause.
  - The last syllable is the line's end: it rises for a question and falls otherwise.
- **Which syllable plays:**
  - The sample lines take the body syllables in a fixed order that never repeats one twice running (`sounds.json` `order`, 0 2 1 3 2 0 3 1). The level measurement uses this order (§3.5).
  - In the app, a random pick with no immediate repeat works as well.

This is the pacing the owner's sound-design notes recommend ("trigger a sound every 3rd or 4th character", resting at punctuation). Version 3 tried a different rule, and the owner rejected it (§3.6).

### 3.5 The voices: the babble in D4's pipeline

**The sources.** `scripts/sound/babble-scripts.mjs` holds the voice design in one table. It writes one commented, path-free script per syllable to `art/sound/babble/`.
- **A syllable** is one `subtractive_synth` note on a stereo track (SoundCraft 0.14 pans a mono track 6 dB right). It runs through a built-in `eq_7band`, then the built-in `plate_reverb`, D4's plate made smaller and quieter: mix 10 %, 0.4 s, size 25, width 0.
- **No sampler and no imported audio.**
- **Its pitch shape comes from a seed note:** 1 ms long at velocity 1, so 42 dB down with the synth's velocity sensitivity at 100 %. The note glides from the seed's pitch to its own over the voice's glide time.
- **The glide was probed first:** a seed at A4 and a note at A5 with a 60 ms glide rose from 440 to 880 Hz.

**Version 2's two voices** (the other versions: §3.6):

| | Pomo | Doro |
|---|---|---|
| Source | D4's chime voice: a sine, with a triangle an octave up at 18 % | A sine, with a triangle at the same pitch at 35 % |
| Shape | Springs up a major third into the note over 45 ms, holds 85 ms | Settles a semitone down onto the note over 60 ms, holds 115 ms |
| Body syllables | B♭4 → D5, C5 → E5, A♭4 → C5, F4 → A4 | A♭4 → G4, B♭4 → A4, B♭4 → B4, C♯5 → C5 |
| Line endings | up A4 → E5 (90 ms glide); down E5 → A4 | up G4 → D5 (110 ms glide); down B4 → E4 |
| Onset and release | attack 10 ms, release 70 ms | attack 16 ms, release 90 ms |
| Colour | No resonance; one bell of +2.5 to 3 dB at 0.8–1.4 kHz; 150 Hz high-pass; 3.5 kHz low-pass (24 dB/oct) | The same, with bells at 0.7–1.1 kHz |

**The build** (`scripts/sound/build.mjs`, the `babble` group in `sounds.json`):
1. Script, session, bounce, mono, as D4's sounds do. They now share `bounceMono()`, and D4's sounds rebuild byte for byte through it.
2. **One loudness for every syllable:** each is brought to the same K-weighted energy over 200 ms (§4.2).
3. **The sample line:** each voice's line is rendered from its syllables at the write-on schedule. The voice's gain is set so the line's EBU R 128 momentary maximum hits −20 LUFS. That is the meter D4's sounds were measured on.
4. **Encode and measure:** each syllable becomes mono AAC-LC at 96 kbit/s, with D4's bit-exact flags, in `src/assets/sounds/babble/<id>.m4a`.
5. **The gate:** the line is rendered again from the decoded files and checked against the target.

**The gates** (any failure exits 1):
- size ≤ 25,600 B;
- decoded peak below −1 dBFS, both as computed and by `volumedetect`, so under D4's peaks;
- the bounce's last 10 ms at least 60 dB below its peak;
- energy above 4 kHz under 1 %;
- mono AAC-LC;
- each line within ±0.5 LU of the target.

**The report** adds, per syllable:
- its starting and ending pitch;
- a pitch track every 5 ms across its voiced part;
- its voiced and sounding lengths;
- its spectral centroid.

A syllable's own momentary loudness is left out: shorter than the meter's 400 ms window, it reads −120.7 LUFS and says nothing.

**`--check`** rebuilds everything in a temp folder and compares every session, every file and the report, D4's included.

### 3.6 Three versions, and the owner's choice

| | Version 1 (`e27bc1f`) | Version 2 (`67fe39e`), chosen | Version 3 (`531fb36`), reverted |
|---|---|---|---|
| Source | Pomo: square + saw. Doro: triangle + square | A near-pure sine (D4's chime voice) with a triangle at 18–35 % | Saw + triangle through a low resonant filter |
| Register (body) | Pomo E5–B5, Doro B4–F♯5; top note C♯6 | Pomo A4–E5, Doro G4–C5 | As version 2, with Pomo's peaks to F♯5 |
| Edge | Resonance 15–40 %; bells up to +6 dB at 0.95–2.7 kHz; low-pass 4.5 kHz | No resonance; bells ≤ +3 dB below 1.5 kHz; low-pass 3.5 kHz | A resonant sweep peaking near 1 kHz; low-pass 3 kHz |
| Shape | One glide up into the note | One glide into the note | Pomo up past the note and back; Doro up, then a sigh down |
| Rhythm and choice | Every 3rd or 4th letter, in a fixed order | Every 3rd or 4th letter, in a fixed order | On the words' syllables, picked by vowel, height falling across the line |
| Lines | −18 LUFS, 3.8 LU under the UI sounds | −20 LUFS, 5.8 LU under | −20 LUFS, 5.8 LU under |
| Brightness (centroid) | 493–1,292 Hz | 339–682 Hz | 364–726 Hz |
| The owner | "the sounds sound to high pitched if i heard them out of the blue it could have hurt my ears can we make them softer sounds and more pleasent to hear as well as cute and kawaii" | "i like them better but now it is too much robotic instead of cute and kawaii how can we improv that" | "nope that's much worse revert it back to version 2" |

**Version 2 is restored exactly.** `478f2a3` and `f17d2d6` revert `531fb36` as new commits, so version 3 stays in the history. The tree then matched `67fe39e` for every path but this record, and `node scripts/sound/build.mjs --check` rebuilt version 2 byte for byte.

**What version 3 taught.**
- **The diagnosis held:** version 2's near-pure tone measured flat under a filter sweep. Its centroid stayed at 545–601 Hz, against 628–703 Hz on the saw-and-triangle source.
- **The cure was wrong for the owner's ear:** the fuller tone, the "pyon" shape and the speech-like rhythm together sounded much worse to them than version 2's plain softness.
- **What the next change should be:** the variation in §3.7. It is small, applied at playback, and leaves the files alone.

### 3.7 The owner's sound-design notes, and the playback variation

After the revert, the owner shared notes on mascot babble: making a creature sound, and making babble endearing rather than annoying. Read against version 2:

- **Already in version 2:**
  - a soft, warm, mid-range tone ("keep the frequencies warm and mid-range dominant"), with nothing in the 2–4 kHz band;
  - soft attacks and tails;
  - a small set of syllables ("pick 4 to 8 distinct syllables"), never the same file twice running;
  - a syllable on every 3rd or 4th character, resting at punctuation;
  - babble as long as its line;
  - Pomo higher and quicker (smaller, livelier), Doro lower and slower.
- **New: playback variation,** the notes' main cure for fatigue and the robotic feel ("randomly shift the pitch slightly up or down (usually by +/- 5 to 10 cents)", "vary the volume slightly with each syllable"):
  - each syllable plays at a random pitch shift, uniform in ±10 cents, and a random gain, uniform in ±1.5 dB, drawn fresh for every syllable;
  - the numbers are in `sounds.json` (`babble.playback`);
  - the files are untouched;
  - the listening page plays the variation by default, with a switch for plain version 2.
- **Approved, then "a bit more" to try.** The owner approved version 2 with this variation, and added: "We can up the variation a bit more to make a difference but that would be experimental".
  - The switch now offers Off, ±10 cents and ±1.5 dB (approved, the default), and two settings to try: ±20 cents with ±2 dB, and ±30 cents with ±3 dB.
  - It stops at ±30 cents, a third of a semitone, because past about that a voice starts to sound out of tune.
  - The trial settings live only in the page generator. `sounds.json` keeps the approved numbers until the owner picks.
- **Not used: recording voices, or human and animal sounds.** `PRODUCT.md` says every app sound is synthesised in SoundCraft, with no samples, and the brief says never a human voice. The page says so.
- **Asked, not done: babble that follows the mood.** For example, higher when happy or excited, higher still when surprised. The pair already change face, so the babble could follow. It's question 4 on the page.

**The listening page** (`node scripts/sound/review-d5-voices.mjs`, 252,171 B) embeds each file once. It has:
- **"Version 2: softer",** and the notes section above;
- **a card per voice:** the speaker talking, its mouth in step with the actual syllables, over its sample line writing on at the proposed pace, and each syllable as a tile with its measured pitch track;
- **"Play both lines":** with the variation on or off, and with English or Turkish lines. The Turkish lines are for pace only; the level is measured on the English ones.
- **a level row,** "Hear focus start, then both lines", against D4's three sounds;
- **the pace table and four questions.**

**Playback is D4's:** one Web Audio context created and resumed inside the tap, each data URI decoded from its base64, and every syllable of a line scheduled on the context's clock. The variation is the source's playback rate, 2^(c/1200) for c cents, and a gain node.

**Checked in the browser pane:**
- every file decodes to its exact length: 24,000 samples for a 0.5 s syllable, so the edit lists are honoured;
- both lines play with the variation on, with no console message;
- the layout holds at 375 pt with no sideways scroll.

Safari on the owner's phone is the real test.

**Both page generators read their inputs as LF.** One of them inlines `tour-motion.js`, and a CRLF checkout (`core.autocrlf=true`) first added a carriage return per line to the pages. Normalising on read makes a page the same from any clone.

## 4. Mathematical / Statistical Details

### 4.1 The face scale

Doro's shipped face is Pomo's scaled by K = 13.7 / 12.3 = 1.11382, the ratio of their idle eyes' horizontal radii. Every other shipped feature follows it to within 0.1 unit:
- the smile's half-width: 17.6 / 15.8 = 1.114;
- the grin: 23.5 / 21.1 = 1.114;
- the tongue and the eye smile's half-width;
- the strokes: 8.6 / 7.7 and 9.6 / 8.6.

So a new face shape is drawn once, as offsets (dx, dy) from Pomo's anchor a, and placed for Doro at a_Doro + K·(dx, dy).

| Anchor | Pomo | Doro |
|---|---|---|
| Eyes | (210.2, 289.0) and (301.8, 289.0) | (205.0, 301.4) and (307.0, 301.4) |
| Mouth | (256, 319.0) | (256, 328.8) |

### 4.2 Loudness

**The K-weighting** is BS.1770's two biquads at 48 kHz, with the standard's coefficients:
- a high shelf: b = (1.53513, −2.69170, 1.19839), a = (1, −1.69066, 0.73248);
- then a high-pass: b = (1, −2, 1), a = (1, −1.99005, 0.99007).

**A syllable's loudness** is

  L_syl = −0.691 + 10·log₁₀((1/N)·Σ y_K[n]²)

over its loudest 200 ms window (N = 9,600 samples, in steps of 480). For a syllable shorter than 200 ms, this is its whole K-weighted energy over a fixed 200 ms, about the ear's own integration time for short sounds.

**The levelling**, for a voice v with syllables i:
1. Each syllable gets g_i = −20 − L_i dB, so all of them share one loudness.
2. The line rendered from them measures M on the momentary meter (400 ms, ffmpeg's `ebur128`).
3. The voice's gain is G_v = T − M, with T = −20 LUFS.
4. Each syllable is encoded at g_i + G_v.

**Why Pomo's syllables sit 1.7 LU under Doro's.** The momentary maximum is the line's densest 400 ms. If that window holds n syllables, each with a mean square E over 200 ms, the window's mean square is about n·E·(200 / 400). So M ≈ L_syl + 10·log₁₀(n / 2).
- **Pomo:** slots of 135 ms give n = 2.96 and a predicted +1.70 dB. Measured: L_syl −21.7 and M −20.0, which is +1.7.
- **Doro:** slots of 180 ms give n = 2.22 and a predicted +0.46 dB. Measured: −20.0 and −20.0; its longer syllables and the pauses change what a window holds.

So each Pomo syllable is quieter than each Doro syllable, and the two lines are level.

| Version 2 | Pomo | Doro |
|---|---|---|
| Each syllable (L_syl) | −21.7 LUFS | −20.0 LUFS |
| The sample line (momentary max) | −20.0 LUFS | −20.0 LUFS |
| Under D4's UI sounds (−14.4, −14.0, −14.1; mean −14.17) | 5.83 LU | 5.83 LU |
| Decoded peaks | −12.9 to −11.5 dBFS | −13.2 to −12.1 dBFS |
| The line's peak | −11.3 dBFS | −12.0 dBFS |

- **The level:** version 1's lines were at −18 LUFS, which the owner found too loud and harsh, so the target is 2 LU lower. 1 LU is about the smallest change most people notice.
- **The peaks:** every one is more than 10 dB under D4's −1 dBFS. AAC's overshoot (up to 1.3 dB in D4, §8.3 there) can't reach it, nor can the playback variation's +1.5 dB.

**The playback variation.** A syllable's gain is 10^(u·1.5/20), with u uniform on [−1, 1], so between −1.5 and +1.5 dB. Its mean in dB is 0, so the line's average level doesn't move. Its pitch shift is c = 10u cents, played as a rate r = 2^(c/1200), between 0.99424 and 1.00579. That stretches or shortens the syllable by under 0.6 %, about 3 ms on a 0.5 s file.

### 4.3 Size

At an average bitrate R over a duration T, a file is about R·T/8 bytes of audio plus its container. The container overhead, size − R·T/8, measures 1,113–1,131 B here, against about 1.2 KB in D4.

| | Duration | Measured bitrate | Size | Share of the 25,600 B budget |
|---|---|---|---|---|
| Pomo | 0.5 s (line endings 0.55 s) | 88.9–95.5 kbit/s | 6,818–7,419 B | at most 29 % |
| Doro | 0.55 s (line endings 0.6 s) | 88.5–91.5 kbit/s | 7,304–7,911 B | at most 31 % |

They are that long so the bounce never cuts the plate's tail: the last 10 ms of each is at least 80.7 dB below its peak (gate: 60 dB).

**The art:**

| | Size |
|---|---|
| The 44 SVGs | 36,494 B in all, 266–2,828 B each |
| The heaviest expression drawn at once (Doro excited) | 4,905 B |
| The same expression with its animation frames (the blink, the talking mouths) | 5,683 B, against 30 KB |
| The native `.vectorcraft` sources | 1,385,583 B in all (JSON, about 31 KB each); the repo's `art/vc/` was 4.9 MB |
| The 44 modules | 41,182 B on disk, reaching the bundle only when imported |

### 4.4 Timings

**The write-on.** One character every 45 ms is 22.2 characters a second.
- **Reading speed:** adult silent reading of English is about 238 words a minute (Brysbaert, 2019). At about 5.7 characters a word, its space included, that is 238 × 5.7 / 60 ≈ 22.6 characters a second, so the line keeps pace with the eye.
- **The longest lines** the brief allows take 90 × 45 = 4.05 s in English and 110 × 45 = 4.95 s in Turkish, plus pauses.
- **The sample lines:**
  - Pomo: 62 characters, with a stop and a comma, writes on in 3.24 s, with 16 syllables;
  - Doro: 70 characters, with a stop, writes on in 3.45 s, with 14 syllables.

**The syllable rate** is 1,000 / (k × 45) a second:

| | Every k-th letter | Rate | Slot | Mouth open (0.6 × slot) |
|---|---|---|---|---|
| Pomo | k = 3 | 7.4 a second | 135 ms | 81 ms |
| Doro | k = 4 | 5.6 a second | 180 ms | 108 ms |

- **Speech:** people talk at about 4–6 syllables a second, so Pomo chatters and Doro talks.
- **Voiced length:** each syllable is voiced (within 12 dB of its loudest) for about 100 ms (Pomo) or 130 ms (Doro), and the line endings for 130 and 165 ms. So Pomo's syllables are separate bounces, and Doro's nearly join.

**The squash and stretch.** The height scale s_y runs through these keys (time, value): (0, 1), (70 ms, 0.92), (168 ms, 1.04), (280 ms, 1).
- **Between keys** it eases by the smoothstep S(u) = u²(3 − 2u).
- **The width** is s_x = 1 / s_y, so s_x·s_y = 1 and the area holds.
- **The faces cross:** the old face's opacity is 1 − S(t / 98) and the new one's is S((t − 56) / 98). Since S(a) + S(1 − a) = 1, both are 0.5 when t/98 + (t − 56)/98 = 1, at t = 77 ms, just after the bottom of the squash at 70 ms.
- **The holds** ease in by the same smoothstep over 220 ms.

**Breath** is s_y = 1 + 0.012·sin(2πt / P), with s_x = 1 / s_y and P = 3.4 s (Pomo) or 4.1 s (Doro). Their phase difference comes round every 1 / (1/3.4 − 1/4.1) = 19.9 s, from random starting phases, so the pair never settle into breathing together.

**The blink:** the interval is uniform on [2.8, 5.2] s, a mean of 4.0 s. A double blink spans 110 + 140 + 110 = 360 ms.

**The wave** is θ(t) = −2° − 14°·sin(2πt / 420 ms) for 2.5 swings (1,050 ms), so between −16° and +12°, then home to 0 over 160 ms. It is mirrored for the left hand.

**The point** is a nudge d(t) = 10·sin(πt / 320 ms) units along the nub's unit axis, for 0 ≤ t ≤ 320 ms.

### 4.5 The pitch readings

**The method.** Pitch is the first local peak of the normalised autocorrelation r(L), over 300–1,600 Hz, that comes within 90 % of the highest peak. So the octave below, a multiple of the period, never wins. The peak is refined by a parabola through it and its neighbours:

  L* = L + ½(r₋ − r₊) / (r₋ − 2r + r₊)

**The windows:** 20 ms for the starting and ending pitch, and 10 ms every 5 ms for the track.

**The voiced part only.** Readings run from the onset until the 5 ms RMS last comes within 12 dB of its loudest. Beyond that is the plate's tail, where the first readings wandered by up to two semitones.

**Every version 2 syllable settles on its designed note inside the voiced part:**
- Pomo's "pa" rises 546 → 588 Hz (D5), and its question ending 539 → 654 Hz (E5);
- Doro's "mo" falls 401 → 392 Hz (G4), and its line ending 422 → 330 Hz (E4).

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A layered kit (cut, hand, fill, eyes, mouth) on one artboard | A whole drawing per expression and per frame | A blink or a mouth swaps one small layer. A change crossfades only the face over a still body. One body serves every face, and the welcome already stacks layers. |
| The hand between the cut and the fill | The hand under the whole body; the hand in front, with its own outline | Under the body, the body's white edge cut between arm and body (the first draft). In front, a white outline would cross the fill. Between them, the nub grows out inside one edge. |
| Small nubs for the gestures, asked of the owner | No limbs: a lean and a look | A wave and a point need something to wave and point with. C3's "no limbs" is the owner's to relax, so the page asks. |
| Transforms (squash, tilt, breath) as view transforms, never drawn | Tilted or stretched drawings, as celebrating bakes its offset | Baked transforms leave the artboard and get clipped (celebrating's curl reaches y −26). View transforms don't clip, and the layers stay aligned. |
| No PNGs for the kit | PNGs at 512, 128 and 32 px, like the shipped poses | The layers are only ever drawn stacked, and the pose sheet draws them from the SVGs. |
| A source generator (`tour-sources.mjs`) | Hand-written source SVGs | 44 sources share one construction. A generator keeps every face on the grid and makes the construction auditable with `--check`. |
| One motion engine for both pages | Separate animation code per page | The talking mouth on the voices page moves exactly as on the pose sheet, and the builder has one reference. |
| The babble levelled by loudness, through a sample line | D4's −1 dBFS peak rule | Peak normalisation can't make the babble "a little below" anything. A line at the write-on pace is what will be heard, and measuring it on D4's meter compares like with like. |
| Version 2: the chime voice, an octave lower, no 2–4 kHz boost, a plate, 2 LU quieter | Only turning version 1 down | The owner's complaint was pitch and harshness, which level alone doesn't fix: the ear is most sensitive at 2–4 kHz, where version 1's square wave and bells sat. |
| Back to version 2 after version 3 | Tuning version 3 further | The owner's word: "much worse revert it back to version 2". |
| Variation at playback (±10 cents, ±1.5 dB), switchable | More syllables, or a new timbre | It is the owner's notes' own remedy. It leaves the chosen files untouched and costs nothing in size, and the switch lets the owner hear plain version 2 beside it. |
| No recorded or sampled sounds, despite the notes | Recording voices; animal sounds | `PRODUCT.md`: every app sound is synthesised in SoundCraft, with no samples. The brief: never a human voice. |
| Files of 0.5–0.6 s, with the plate's tail | Dry, 0.16–0.28 s | The tail is part of the softness. The tail gate needs it whole, and the files stay within 31 % of the budget. |
| The write-on at 45 ms a character | 30 ms (faster); 60 ms (slower) | At about reading speed, the line neither lags the eye nor races it. The page asks the owner. |

## 6. Verification

Run from `C:\vp\stage-d5`:

```bash
node scripts/art/tour-sources.mjs --check
node scripts/art/build.mjs --check
node scripts/art/check-budgets.mjs
node scripts/art/build-icon-components.mjs --check
node scripts/sound/babble-scripts.mjs --check
node scripts/sound/build.mjs --check
```

- [x] The versions read first: VectorCraft 0.18.0, SoundCraft 0.14.0, ffmpeg 8.1.1 (§0).
- [x] `tour-sources.mjs --check`: 46 files match.
- [x] `build.mjs --check` (art): every export matches a clean rebuild, the 44 new layers and every shipped asset.
- [x] `check-budgets.mjs`: 133 assets, none over budget; the tour layers are 266–2,828 B against 30,720 B.
- [x] `build-icon-components.mjs --check`: 120 drawings match. This is the command `Icon.test.tsx` runs in Jest. Jest itself wasn't run, because this new worktree has no `node_modules`.
- [x] `babble-scripts.mjs --check`: 12 scripts match.
- [x] `sound/build.mjs --check`: "every sound, session and the report match a clean rebuild".
  - It passed on every version, and again after the revert and after the playback variation was added.
  - D4's files stayed byte-identical through the refactor: `git status` showed none of them changed.
- [x] After the revert, the tree matched `67fe39e` for every path but this record (`git diff 67fe39e`, empty).
- [x] D4's page generator still runs on the extended report (`node scripts/sound/review.mjs --fragment`, to a scratch file).
- [x] The babble's gates on version 2:
  - 6,818–7,911 B;
  - decoded peaks −13.2 to −11.5 dBFS;
  - tails ≥ 80.7 dB down;
  - energy above 4 kHz ≤ 0.001 %;
  - both lines at −20.0 LUFS (±0.5).
- [x] Both pages in the browser pane:
  - both themes and Reduce Motion;
  - 375 pt with no sideways scroll;
  - no console errors;
  - every audio file decodes to its exact length;
  - both lines play with the variation on.
- [x] Both pages regenerate byte-identical to the committed ones from this CRLF checkout.
- [x] **The owner's approval of the pose sheet, in their words:** "Approve, keep nubs" (§7).
- [x] **The owner's approval of the voices, in their words:** "version 2 with variation is the way to go" (§7).
- [x] Every check run once more after both approvals, all passing: `tour-sources.mjs --check`, `build.mjs --check`, `check-budgets.mjs`, `build-icon-components.mjs --check`, `babble-scripts.mjs --check` and `sound/build.mjs --check`.
- [ ] Optional, the owner's: a variation level beyond the approved ±10 cents (±20 or ±30, §7).
- [ ] After the build (main session), on a physical device:
  - the motion;
  - the babble through expo-audio on the phone speaker, with the silent switch and Settings › Sound.

## 7. The owner's approval

**The pose sheet: approved, 2026-11-01.** The owner's words, verbatim:

> Approve, keep nubs

That was their reply, word for word, to the question "Does the pose sheet look right, with the nub hands for the wave and point?". The other reply offered was "Approve, no hands". It approves:
- the faces, the motion and the kit as drawn;
- the small nubs for the wave and the point.

So C3's "no limbs" gives way only for those two gestures: the nubs grow out and go back after, and everywhere else the pair stay limb-free. The page now shows their words where the questions were.

**The voices: approved, 2026-11-01.** The owner's words, verbatim:

> version 2 with variation is the way to go. We can up the variation a bit more to make a difference but that would be experimental

The approval covers version 2's twelve files and the playback variation of ±10 cents and ±1.5 dB (§3.7), as `sounds.json` records them. The second sentence opens a trial of more variation, which the listening page offers (±20 and ±30 cents). The owner picks; until then, the approved numbers stand.

**On the way there:**
- version 1: "the sounds sound to high pitched…";
- version 2: "i like them better but now it is too much robotic…";
- version 3: "nope that's much worse revert it back to version 2" (§3.6).

**Left open, the owner's to take up or not:**
- a bigger variation, ±20 or ±30 cents (the listening page's switch);
- babble that follows the mood (question 4 on the page).

Both start from the approved set and change only playback.

## 8. Findings and follow-ups

1. **For the builder (main session):**
   - **The kit's contract** is `art/src/tour/expressions.json`: the recipes, the feet, the hands' pivots and axes, the stacking order, and the motion and write-on numbers. `scripts/art/tour-motion.js` is a working reference of the same rules (`writeOn()` gives the syllable times).
   - **The lift:** draw the body's lift from `body-cut` and a hand's from the hand, both under `body-cut`, so the hand's shadow never falls on the body's white edge. The pose sheet does this. `Sticker` alone would draw a hand with its shadow in place.
   - **The babble:**
     - A voice picks body syllables at random, never the same twice running, and ends a line on its `up` or `down` syllable. Each syllable's `mouth` in `sounds.json` is the layer to show.
     - All 12 files play at the same volume. The levels are in the files, quieter than the UI sounds by design (§4.2).
     - **The approved variation** (`sounds.json` `babble.playback`): set each syllable's playback rate to 2^(c/1200), c uniform in ±10 cents, with pitch correction off, and its volume to 10^(g/20), g uniform in ±1.5 dB.
     - **expo-audio can do it** (58.0.10, read in `node_modules/expo-audio`, `ios/AudioModule.swift`):
       - set `player.shouldCorrectPitch = false` first, then call `player.setPlaybackRate(rate)`;
       - with correction off, `setPlaybackRate` sets the item's `audioTimePitchAlgorithm` to `.varispeed`, so the rate moves the pitch as on the listening page;
       - the rate is clamped to 0–2, and this one is 0.994–1.006;
       - the algorithm carries over when the player's source is replaced.

       Not yet heard on a device.
     - Each file carries its reverb tail, 0.5–0.6 s, and syllables overlap in a line (a new one every 135 or 180 ms). So use a player per syllable, or a small pool, rather than restarting one player.
2. **The module generator and line endings.** `build-icon-components.mjs` writes LF over the checkout's CRLF, so every existing module shows as modified with its content unchanged. It's worth teaching the generator to leave unchanged files alone. Not changed here: outside this task.
3. **Phone speakers below 400 Hz.** Doro's "mo" sits at G4 (392 Hz) and its line ending falls to E4 (330 Hz). iPhone speakers are weak there (D4 §3.3), so the device check will tell.

## 9. Related Docs

- [D5 record](2026-11-01-phase1-d5-tutorial.md) §3.4, §3.5 · [the tutorial brief and direction contract](../../.impeccable/surfaces/app-tutorial-tsx.md)
- [D4 record](2026-10-30-phase1-d4-sounds.md) (the sound pipeline this extends) · [Stage C record](2026-10-30-phase1-stage-c-design.md) §2.3 and §2.5 (the mascot method and the art pipeline)
- [ADR-0027](../architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md) · [ADR-0047](../architecture/adr/0047-same-page-mark-and-the-colon-characters.md)
- [`DESIGN.md`](../../DESIGN.md) · [`PRODUCT.md`](../../PRODUCT.md)
