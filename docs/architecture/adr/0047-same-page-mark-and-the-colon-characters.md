---
id: ADR-0047
title: The Same Page mark, Pomo & Doro as The Colon's two round characters, and no tomato anywhere
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0027, ADR-0020, IMPL-2026-10-30-phase1-stage-c-design, IMPL-2026-10-29-couples-rehaul-plan]
---

# ADR-0047: The Same Page mark, Pomo & Doro as The Colon's two round characters, and no tomato anywhere

> **Status note:** accepted by the owner on 2026-10-30, at the C1 gate (no tomato) and the C3 logo gate (the mark and the characters). The colour version, the app icon and the splash follow in C3; `PRODUCT.md` and `DESIGN.md` are updated through `/impeccable` (Stage C record §9).

## Context

`PRODUCT.md` made "a kawaii tomato couple" binding: *pomodoro* is Italian for tomato, so the mascots were to be two tomatoes. At the C1 gate the owner withdrew it: "It can be simillar to other pomodoros so let's not use any tomato in the design" and, for the logo, "no tomato. brainstorm a more unique approach". The category survey agreed: Pomodoro timers use tomatoes, red discs and clock rings; couples apps use hearts and overlapping circles; study companions use small animals.

Four black-and-white concepts were shown at every iOS size ([gate page](../../../art/review/c3-logo-concepts.html)): Same Page, Lean on Me, The Colon and Red Thread.

## Decision

The owner's words (2026-10-30): "We will use the logo of the Same Page and the mascots of The Colon. We will have many animations with pomo and doro and one of them is that they turn themselves into pages and creates the logo design of the Valentine Pomodoro."

1. **No tomato anywhere:** not in the mark, the app icon, the characters, any illustration or any placeholder. No clock, ring or heart in the mark either.
2. **The mark is Same Page:** two pages of one open diary, each with a face, leaning in. The couple is on the same page, apart at the edges and bound at the spine.
3. **Pomo & Doro are The Colon's characters:** two small round characters. Together they are the colon in the timer (24:59), and in lettering the colon between *pomo* and *doro*.
4. **One face for both.** The characters and the mark share one face design (the same eye size, spacing and smile), so that the signature animation, Pomo & Doro turning themselves into the two pages and forming the mark, reads as one continuous move.
5. **Pomo & Doro need telling apart:** a difference in silhouette, not a gendered cue. It is designed in C3 with the five sticker poses.

## Consequences

**Positive**
- The mark says study (a diary) and couple (two pages, one spine) without a category habit, and it holds at 20 px.
- The characters are simple enough to animate a lot, and their colon form ties them to the timer without drawing a clock.
- The pages-to-logo animation links the mascots to the mark, so the identity holds where the mark isn't shown.

**Negative**
- Round blob characters are common in kawaii art; their identity has to come from the faces, the poses and the colon idea, which C3's originality check records.
- `PRODUCT.md`'s binding line, the rehaul plan §3.1 and two of the four name candidates (Tomatwo, Two Tomatoes) no longer fit; the record lists the replacements.
- The morph animation is a new motion moment. Where it plays (launch, onboarding, pairing, recap) is decided with the motion rules: one delight per screen, Reduce Motion falls back to a crossfade, and nothing may slow the cold start (NFR-PERF-001).

## Alternatives considered

- **Keep the tomato** and differ through the couple and the sticker. Rejected by the owner.
- **Same Page with page characters,** or one concept for both mark and mascots. The owner chose to combine two concepts and tie them together with the animation.
- **Red Thread:** the most romantic, but it says nothing about studying.

## Links

- [Stage C record](../../implementations/2026-10-30-phase1-stage-c-design.md) §0, §2.3 · [ADR-0027](0027-vectorcraft-art-soundcraft-sounds.md) (VectorCraft art)

## Backlinks
<!-- backlinks:start -->
- ["Phase 1 Stage C (C1–C4): the Sticker Diary design system, display face, Classic brief and art"](../../implementations/2026-10-30-phase1-stage-c-design.md)
- [Requirements traceability (generated)](../../testing/TRACEABILITY.md)
<!-- backlinks:end -->
