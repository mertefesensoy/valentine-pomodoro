---
id: ADR-0027
title: VectorCraft for all vector art; SoundCraft for all app sounds
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0003, ADR-0012, ADR-0013, ADR-0026]
---

# ADR-0027: VectorCraft for all vector art; SoundCraft for all app sounds

> **Status note:** VectorCraft is 0.18.0 as of 2026-10-30, not 0.16. The art pipeline is built as `scripts/art/build.mjs`: one `steps.json` per asset, run headless in `C:/vp-art`, with byte-identical rebuilds checked by `--check` ([Stage C record](../../implementations/2026-10-30-phase1-stage-c-design.md) §2.3).

## Context

The v1 interface uses PNGs and 37 emoji glyphs as icons, across 13 files (finding F10). The rebrand needs an original kawaii set: the mascots Pomo & Doro, about 40 icons, mode scenes and theme packs. v1 never delivered its completion sound (`DECISIONS.md` Q1).

## Decision

Both are owner decisions from 2026-10-29.
- **Art:** all vector art is made with the open-source **VectorCraft** (v0.16, installed at `C:\Program Files\VectorCraft`) (rehaul plan §0).
- **Sound:** every app sound is made with **SoundCraft** (0.14, MIT/Apache-2.0, installed next to it) (Phase 1 plan §0, task D4).

**Art pipeline (§5.4).**
- Sources live in `art/src/*.svg`. VectorCraft jobs turn them into `art/vc/*.vectorcraft`, the editable source of truth, which is committed.
- From those come SVG React components (`--decimals 2 --outline-text`) and PNG @1x/2x/3x for icons and the splash.
- Each export has a `steps.json`, so it can be reproduced.
- Themes remap global swatches named after token names; nothing is recoloured by hand.

**Sound pipeline (D4).**
- Every sound is synthesised with SoundCraft's built-in instruments, so there are no third-party samples to license.
- The source is a committed `.scraft` session plus a `soundcraft-cli` script under `art/sound/`.
- The WAV is scaled to a −1 dBFS peak, $g = 10^{-1/20} \approx 0.891$, before ffmpeg encodes mono AAC at about 64–96 kbps. That leaves room for the inter-sample peaks that AAC decoding can add (Phase 1 plan §4.4).

## Consequences

**Positive**
- Small, themeable assets that can be rebuilt from source. The budgets are an icon ≤ 2 KB, an illustration ≤ 30 KB, and a UI sound ≤ 1.5 s and ≤ 25 KB.
- It closes Q1. The formal close is in Phase 1 release prep (E4).
- Emoji stay only in push copy and in user text (`PRODUCT.md`).

**Negative**
- Both tools are installed on one Windows machine. Exports must keep paths under 260 characters, so jobs run in a short directory such as `C:/vp-art` (§5.4).
- Not built yet (Phase 1 C3, D4). Every character must be checked for originality, with no resemblance to existing mascots.

## Alternatives considered

- **Art:** hand-drawn PNGs, Lottie or Rive (§9).
- **Sound:** v1's options for Q1 were a royalty-free bell (Freesound) or a file the owner would supply (`DECISIONS.md` Q1).

## Links

- [Rehaul plan §0](../../implementations/2026-10-29-couples-rehaul-plan.md#0-decisions-you-made-2026-10-29) · [§5.4](../../implementations/2026-10-29-couples-rehaul-plan.md#54-vectorcraft-art-pipeline) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions) · [§1.2, finding F10](../../implementations/2026-10-29-couples-rehaul-plan.md#12-what-is-wrong-with-it)
- [Phase 1 plan §0](../../implementations/2026-10-29-phase1-plan.md#0-decisions-you-made-2026-10-29) · [Stage C (C3)](../../implementations/2026-10-29-phase1-plan.md#stage-c--design-system-and-art-can-run-alongside-stage-b) · [Stage D (D4)](../../implementations/2026-10-29-phase1-plan.md#stage-d--screens-in-the-new-design) · [§4.4](../../implementations/2026-10-29-phase1-plan.md#44-sound-export-headroom-d4)
- [`PRODUCT.md`, capabilities and constraints](../../../PRODUCT.md#capabilities-and-constraints) · [`DECISIONS.md` Q1](../../../DECISIONS.md#q1-sound-file)

## Backlinks
<!-- backlinks:start -->
- [expo-audio for sound, not expo-av](0003-expo-audio.md)
- [The Same Page mark, Pomo & Doro as The Colon's two round characters, and no tomato anywhere](0047-same-page-mark-and-the-colon-characters.md)
- [Architecture decision records](README.md)
- ["Phase 1 D4: the SoundCraft sound set, and Fly's loop re-encoded"](../../implementations/2026-10-30-phase1-d4-sounds.md)
- ["Phase 1 Stage C (C1–C4): the Sticker Diary design system, display face, Classic brief and art"](../../implementations/2026-10-30-phase1-stage-c-design.md)
- ["Phase 1 Stage D (D1–D4): the screens in the Sticker Diary design, plan"](../../implementations/2026-10-30-phase1-stage-d.md)
- ["Phase 1 D4, wired in: D4's sounds merged into Stage D and played by Classic"](../../implementations/2026-11-01-phase1-d4-wiring.md)
<!-- backlinks:end -->
