---
id: ADR-0003
title: expo-audio for sound, not expo-av
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0027, ADR-0031]
---

# ADR-0003: expo-audio for sound, not expo-av

## Context

v1 needed a sound effect when a session completes. According to the Expo notice cited in DECISIONS §2, `expo-av` is deprecated and due for removal in SDK 55 or later.

## Decision

Use `expo-audio` for all app sound (DECISIONS §2).

As built: `expo-audio` (`~58.0.10`) is still the audio module on SDK 58. It plays the Fly Mode ambient loop (`useFlyModeAudio`). The Phase 1 sound set is to play through it too (task D4).

## Consequences

**Positive**
- The app went from SDK 54 to 58 without changing its audio library.
- Expo maintains it as the replacement for `expo-av`.

**Negative**
- The completion sound itself never shipped. Open question Q1 (a bell sound, or one the owner supplies) was never closed, and the README still describes the completion sound as stubbed (rehaul plan §2.2).
- Tests need a stub player for it. `jest.setup.ts` mocks `expo-audio` because the Timer screen tests open Fly (Stage A §2).
- Fly Mode's 9 expo-audio modules were part of every cold start until lazy Fly Mode ([ADR-0031](0031-lazy-fly-mode.md)) deferred them.

## Alternatives considered

- **`expo-av`.** Deprecated, and due for removal (DECISIONS §2).

The sound *content* (Q1) is settled separately: [ADR-0027](0027-vectorcraft-art-soundcraft-sounds.md) has SoundCraft synthesise every sound. The question is closed formally in Phase 1 release prep (E4).

## Links

- [`DECISIONS.md` §2](../../../DECISIONS.md#2-sound-module-expo-audio-not-expo-av) · [Q1](../../../DECISIONS.md#q1-sound-file)
- [Rehaul plan §2.2](../../implementations/2026-10-29-couples-rehaul-plan.md#22-decisionsmd)
- [Phase 1 plan, Stage D (D4)](../../implementations/2026-10-29-phase1-plan.md#stage-d--screens-in-the-new-design)
- [Phase 1 Stage A §2](../../implementations/2026-10-29-phase1-stage-a.md#2-what-changed)
- [Lazy Fly Mode §4](../../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md#4-mathematical--statistical-details)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
- ["Phase 1 D4: the SoundCraft sound set, and Fly's loop re-encoded"](../../implementations/2026-10-30-phase1-d4-sounds.md)
- ["Phase 1 D4, wired in: D4's sounds merged into Stage D and played by Classic"](../../implementations/2026-11-01-phase1-d4-wiring.md)
<!-- backlinks:end -->
