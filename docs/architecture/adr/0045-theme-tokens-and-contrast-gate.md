---
id: ADR-0045
title: Theme tokens in one JSON file, proved by a blocking contrast gate
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0013, ADR-0027, IMPL-2026-10-30-phase1-stage-c-design, IMPL-2026-10-29-phase1-plan, SRS]
supersedes: [ADR-0013]
---

# ADR-0045: Theme tokens in one JSON file, proved by a blocking contrast gate

> **Status note:** accepted by the owner at the C1 gate, 2026-10-30, with option A for the primary button. Built on `phase1/stage-c-design` ([Stage C record §2.1](../../implementations/2026-10-30-phase1-stage-c-design.md)). The app reads the new tokens from D1 on; until then every screen still imports the v1 `tokens.ts`.

## Context

The v1 palette ([ADR-0013](0013-valentine-colour-palette.md)) has grey text, purple aurora gradients and no proof of contrast. `DESIGN.md` names the Sticker Diary's colour roles but no values, and its Contrast Gate Rule says a theme that fails 4.5:1 for text or 3:1 for large text, icons and marks does not ship (FR-SET-002, NFR-A11Y-001). The same colours must also reach the VectorCraft art, whose swatches carry token names (rehaul plan §5.4).

## Decision

1. **One source:** `src/theme/palette.json` holds every theme's tokens (25 roles, the same names in every theme) and the list of foreground/background pairs the UI draws, each with its floor.
2. **One function:** `src/theme/contrast.ts` (WCAG 2 relative luminance, translucent colours composited first) is used by `npm run check:contrast`, the Jest test and the swatch sheet, so the ratios the owner approves are the ones CI enforces.
3. **The gate blocks CI.** A pair under its floor, a theme missing a role or a pair naming an unknown token fails the build.
4. **The palette system:** soft fills (strawberry, leaf) carry the cocoa label; strong fills (the accent red, danger) carry a light label in the light theme. Destructive actions have their own `danger` token, never the brand red.
5. **The two free themes,** approved 2026-10-30: Strawberry Milk (light) and Midnight Plum (dark), all 52 pairs passing (record §2.1).

## Consequences

**Positive**
- A new theme (Phase 5's Plus themes) is a JSON block; CI proves it before anyone sees it.
- Art and UI can't drift: the art swatches and the app read the same names.

**Negative**
- The contrast script needs Node 22.6+ for type stripping (CI uses Node 22).
- The light theme's ring and input boundaries pass 3:1 with about 0.6 of headroom, so a lighter tweak fails CI. That is the point.

## Alternatives considered

- **Tokens in TypeScript only.** Rejected: VectorCraft and the review sheets would need a second copy.
- **A deep strawberry button with a white label (option B).** Shown to the owner; option A, the soft fill with cocoa, was chosen.
- **A non-blocking check.** Rejected: the Contrast Gate Rule says a failing theme doesn't ship.

## Links

- [Stage C record](../../implementations/2026-10-30-phase1-stage-c-design.md) §2.1, §4.1 · [Phase 1 plan §4.1](../../implementations/2026-10-29-phase1-plan.md#41-contrast-check-c1)

## Backlinks
<!-- backlinks:start -->
- ["Phase 1 Stage C (C1–C4): the Sticker Diary design system, display face, Classic brief and art"](../../implementations/2026-10-30-phase1-stage-c-design.md)
- [Requirements traceability (generated)](../../testing/TRACEABILITY.md)
<!-- backlinks:end -->
