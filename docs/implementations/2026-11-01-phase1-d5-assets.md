---
id: IMPL-2026-11-01-phase1-d5-assets
title: "Phase 1 D5, the assets: Pomo & Doro's tour expressions and their babble"
status: in-progress
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-11-01-phase1-d5-tutorial, IMPL-2026-10-30-phase1-d4-sounds]
---

# 2026-11-01 — Phase 1 D5, the assets: Pomo & Doro's tour expressions and their babble

**Status:** Plan. Nothing is built yet; this section is the plan, written before any code.
**Branch:** `phase1/d5-assets`, worktree `C:\vp\stage-d5`, cut from `phase1/stage-d` at `2fb8d5a`. Commits use `git commit -- <paths>`. No push, no merge, no EAS.
**Parent:** [D5 record](2026-11-01-phase1-d5-tutorial.md), step 4 (§0), with the owner's round-2 request (§3.4) and the approved direction contract (§3.5; `.impeccable/surfaces/app-tutorial-tsx.md`).

---

## 0. The plan

**Where this runs.** The session was started in `C:\vp\stage-d`, the main D5 session's worktree. As D4's did, it made its own worktree (`git worktree add -b phase1/d5-assets C:/vp/stage-d5 phase1/stage-d`) and moved there before writing anything. Nothing is written in `C:\vp\stage-d`.

**Tool versions, read first:** `vectorcraft-cli 0.18.0`, `soundcraft-cli 0.14.0 (windows x86_64)`, `ffmpeg 8.1.1-full_build-www.gyan.dev`. The shipped art's `--check` passes on 0.18.0 before any change (every export byte-identical).

**Two pieces, each approved by the owner on its own page. Nothing is wired into the app.**

### 0.1 The art: a layered kit, not one drawing per expression

The tutorial animates faces: a blink, a talking mouth, a face crossing in on each change. Drawn as whole stickers, every blink and every mouth shape would be a whole new drawing, and a crossfade would fade one body over another. So the kit is **layers on one artboard**, stacked the way the welcome stacks its diary layers:

| Layer | Per character | What |
|---|---|---|
| body | 1 | The shipped silhouette, die-cut edge, fill, the curl (Pomo) and the cheeks, with no face |
| eyes | 9 | open, blink (closed), smile (eye smile), sparkle, wide, wink, proud, look-left, look-right |
| mouth | 7 | smile, talk-small, talk-wide, talk-round, grin, wow, proud |
| hand | 4 | wave-left, wave-right, point-left, point-right |

- **An expression is a recipe:** body + eyes + mouth (+ a hand) + a held transform (the curious tilt, the proud lean, the surprised stretch). Talking swaps the mouth, a blink swaps the eyes, and a change crossfades only the face while the body squashes.
- **The construction stays locked:** the body paths, the eye centres, the cheek and mouth positions and the colours come from the shipped sources (`art/src/mascots/`), so every new face sits on C3's grid.
- **Inside the 512 box:** nothing drawn reaches outside the artboard. Squash, stretch, tilt and breath are view transforms about the feet, which don't clip. The feet anchor (the bottom of the die-cut edge) is stated for the builder.
- **The hands are a question for the owner.** C3 says the pair have "no ears, limbs or animal features", and a wave or a point needs something. The proposal is a small mitten in the body's colour with its own die-cut edge, shown only for a gesture. The pose sheet asks it outright, with the limb-free alternative named.
- **The pipeline:** a generator, `scripts/art/tour-sources.mjs`, writes the sources into `art/src/tour/` from the shipped construction (with `--check`). One job, `art/jobs/tour.json`, builds them through `scripts/art/build.mjs` (steps, `.vectorcraft`, SVG). `scripts/art/build-icon-components.mjs` then emits one module per layer into `src/components/stickers/art/`; its `--check` runs in Jest, so the modules must be committed with the art.
- **Budgets:** each layer ≤ 30 KB, and each expression's layers together ≤ 30 KB (NFR-PERF-005), by `node scripts/art/check-budgets.mjs` and the pose sheet's own sums.

### 0.2 The motion, specified and demonstrated

On the pose sheet, with numbers the builder can copy:
- a blink every few seconds (random interval, an occasional double blink), on open-eyed faces only;
- the talking mouth, in step with the babble's syllables while a line writes on;
- a quick squash and stretch about the feet on each change of expression, area-preserving, with the new face crossing in at the squash;
- a soft breath at rest, at a different period for each character so they never breathe in step;
- the wave and the point, as the hand layer's rotation and nudge;
- **under Reduce Motion, swaps only:** no squash, blink, breath or talking loop, and the held transforms applied at once. The sheet follows the system setting and has its own toggle.

**The pose sheet,** `art/review/d5-pose-sheet.html`, written by `scripts/art/review-d5-poses.mjs` from the built SVGs: every expression of both characters, animated, in light and dark, at the contract's 190 and 140 pt and small, with the layer budget beside each.

### 0.3 The voices

- **Per character, a small set of babble syllables** from SoundCraft's `subtractive_synth` only (no sampler, no file imported): short pitched blips with a filter sweep for a vowel-like colour, and pitch contours set by a near-silent seed note that the main note glides from (probed: a seed at A4 and a note at A5 with a 60 ms glide rise from 440 to 880 Hz).
  - **Pomo:** higher and bouncier, shorter syllables with rising contours.
  - **Doro:** lower and rounder, longer syllables, softer filter, level or falling contours.
  - Each set includes a rising syllable for a question and a falling one for a line's end.
- **The build:** a separate `babble` group in `art/sound/sounds.json`, built by `scripts/sound/build.mjs` beside D4's sounds and covered by its `--check`. D4's `sounds` and `loops` and their report fields stay as they are, so D4's page generator still works.
- **Level:** D4's rule (every peak at −1 dBFS) can't make the babble "a little below" anything. So each syllable is scaled to one loudness, and a **stream** of syllables at the write-on pace is measured with the same EBU R 128 momentary maximum as D4's sounds, and gated at a target a few LU under them (§4). Every file's decoded peak stays under −1 dBFS.
- **Evidence for "higher and bouncier, lower and rounder" and "never shrill":** per syllable, the measured pitch range, length, spectral centroid and the energy above 4 kHz, as D4 did.
- **The write-on pace** isn't set anywhere yet (D5 record §4). It's proposed here as a number, with the syllable rate it implies, and shown on the listening page.

**The listening page,** `art/review/d5-voices.html`, written by `scripts/sound/review-d5-voices.mjs`: each character's syllables, then a sample line per character writing on at the proposed pace with its babble, played through one Web Audio context unlocked in the tap, as D4's page does. A level row plays D4's focus start beside the babble.

### 0.4 Done

Both pages approved by the owner in their own words; the assets committed on this branch; `node scripts/art/build.mjs --check`, `node scripts/art/check-budgets.mjs`, `node scripts/art/build-icon-components.mjs --check` and `node scripts/sound/build.mjs --check` green; this record complete.
