---
id: ADR-0046
title: Baloo 2 for the timer, headings and sticker captions; the system face for everything else
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0012, IMPL-2026-10-30-phase1-stage-c-design, IMPL-2026-10-29-phase1-plan, SRS]
---

# ADR-0046: Baloo 2 for the timer, headings and sticker captions; the system face for everything else

> **Status note:** accepted by the owner at the C2 gate, 2026-10-30, embedded **with D1**. Until D1, the app still uses the system font everywhere ([ADR-0012](0012-system-fonts.md)), which this record supersedes for the timer, headings and sticker captions only.

## Context

`DESIGN.md` asks for a rounded display face with full Turkish coverage, tabular figures and a licence that allows embedding (NFR-I18N-001). The owner's candidates were Fredoka, Baloo 2 and M PLUS Rounded 1c. The audit read each google/fonts file with fontTools ([Stage C record §2.2](../../implementations/2026-10-30-phase1-stage-c-design.md)):

- **Fredoka 2.001 fails:** no İ, Ğ, ğ, Ş or ş, and proportional digits with no `tnum`.
- **Baloo 2 1.700 passes:** all twelve Turkish letters and a Turkish `locl`; `tnum` gives equal digits at every weight from 400 to 800.
- **M PLUS Rounded 1c 1.059 passes,** with fixed-width digits, but plainer Latin and a wide colon.
- **Nunito 3.602,** added as a stand-in, passes, but is one of the most-used faces in app templates.
- **Every face has an `fi` ligature that hides the dot on i,** which in Turkish blurs i and ı.

## Decision

1. **Baloo 2** sets the timer, screen titles and sticker captions. Body text, labels and controls stay in the system face, so Dynamic Type stays native.
2. **Embedded with D1** through the `expo-font` config plugin, as a Latin + Turkish subset (Basic Latin, Latin-1, Latin Extended-A, general punctuation, ₺) of two static weights, **with the `fi`/`fl` ligatures removed**. About 58 KB per weight.
3. **The timer sets `fontVariant: ['tabular-nums']`.** Baloo 2's default digits are proportional; D1's device check confirms on the iPhone that the variant reaches Core Text and the digits hold still.

## Consequences

**Positive**
- A voice of its own where the brand speaks: the timer and the stickers.
- Full Turkish, with the dot on i kept.

**Negative**
- Steady digits depend on one prop; a regression shows as a jiggling timer. D1 adds a test that the timer style carries the variant.
- About 117 KB of fonts join the binary.

## Alternatives considered

- **M PLUS Rounded 1c:** steady digits with no prop, but less character and a gappy timer colon.
- **Nunito:** passes, but common in templates.
- **Embed now, in Stage C:** rejected by the owner; one native build should carry the face with the screens that use it.

## Links

- [Stage C record §2.2](../../implementations/2026-10-30-phase1-stage-c-design.md) · [the specimen](../../../art/review/c2-type-specimen.html)

## Backlinks
<!-- backlinks:start -->
- [System fonts only](0012-system-fonts.md)
- [Architecture decision records](README.md)
- ["Phase 1 Stage C (C1–C4): the Sticker Diary design system, display face, Classic brief and art"](../../implementations/2026-10-30-phase1-stage-c-design.md)
- [Requirements traceability (generated)](../../testing/TRACEABILITY.md)
<!-- backlinks:end -->
