---
id: ADR-0012
title: System fonts only
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0013, ADR-0027]
---

# ADR-0012: System fonts only

> **Status note:** still in force. Phase 1 task C2 (planned, not done) adds a rounded display face for headings and the timer. Body text stays the system font. This record is superseded only for headings and the timer, and only once C2 ships.

## Context

v1 wanted a fast start, a native look and good readability, with a small bundle (DECISIONS §12).

## Decision

Use the system fonts: San Francisco on iOS and Roboto on Android. No custom fonts are loaded (DECISIONS §12).

As built: no `fontFamily` appears anywhere in `src/`. The one custom font in the repo, SpaceMono, was used only by the template's unused `Explore` screen, yet `App` blocked its first render on loading it. Phase 0 removed both the font and that gate, saving 93 KB of bundled assets (Phase 0 §3.4, §4).

## Consequences

**Positive**
- No font loading at start-up, and nothing to wait for before the first render.
- A native look and feel, and system text scaling (Dynamic Type) for free. The v2 plan keeps the system font for body text for exactly this reason (rehaul plan §5.2).

**Negative**
- The app has no typographic identity. The rehaul plan lists "system fonts only" as a stale v1 decision (§2.1), because the kawaii direction calls for a rounded display face.
- That display face must have full Turkish coverage (ğ ı İ ş ç ö ü) and tabular figures, so the timer digits never jiggle. The candidates are Fredoka, Baloo 2 and M PLUS Rounded 1c, under an OFL licence, embedded through the `expo-font` config plugin (Phase 1 C2).

## Alternatives considered

- **Google Fonts.** They add loading time and bundle size (DECISIONS §12).

## Links

- [`DECISIONS.md` §12](../../../DECISIONS.md#12-typography-system-fonts)
- [Rehaul plan §2.1](../../implementations/2026-10-29-couples-rehaul-plan.md#21-planmd-2026-01-07-v1-build-plan) · [§5.2, type](../../implementations/2026-10-29-couples-rehaul-plan.md#52-kawaii-direction-draft-for-designmd)
- [Phase 1 plan, Stage C (C2)](../../implementations/2026-10-29-phase1-plan.md#stage-c--design-system-and-art-can-run-alongside-stage-b)
- [Phase 0 §3.4](../../implementations/2026-10-29-phase0-foundation.md#34-cleanup) · [§4](../../implementations/2026-10-29-phase0-foundation.md#4-measurements-the-baselines)

## Backlinks
<!-- backlinks:start -->
- [Baloo 2 for the timer, headings and sticker captions; the system face for everything else](0046-display-face-baloo-2.md)
- [Architecture decision records](README.md)
- ["Phase 1 Stage C (C1–C4): the Sticker Diary design system, display face, Classic brief and art"](../../implementations/2026-10-30-phase1-stage-c-design.md)
<!-- backlinks:end -->
