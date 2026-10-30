---
id: ADR-0013
title: Valentine colour palette
status: superseded
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0012, ADR-0027]
superseded_by: [ADR-0045]
---

# ADR-0013: Valentine colour palette

> **Status note:** superseded by [ADR-0045](0045-theme-tokens-and-contrast-gate.md) (2026-10-30): the Strawberry Milk and Midnight Plum token sets, approved by the owner (option A) and checked by `npm run check:contrast` in CI. The screens move to them in D1.

## Context

v1 was a Valentine gift. It needed soft, romantic colours with readable contrast (DECISIONS §13).

## Decision

| Role | Colour |
|------|--------|
| Primary actions | Cherry red `#E63946` |
| Accent | Blush pink `#F4A6B0` |
| Background | Warm cream `#FFF8F0`, with dark text |
| Secondary actions | Lavender `#D4A5D9` |

The plan was to target WCAG AA contrast, verified during the polish phase (DECISIONS §13).

As built: `src/theme/tokens.ts` carries cream, cherry red and lavender in `LightTheme` (`bg`, `accent`, `accentPurple`), next to a `DarkTheme` and a `ValentineSpec`. The same hex values are also hard-coded in `GiftModeModal.tsx` and `LoveNoteCard.tsx`.

## Consequences

**Positive**
- A calm, non-aggressive tone. Cherry red draws attention to primary actions without being harsh.

**Negative**
- The "verify during polish" step has no recorded result. The first automated check arrives with C1: `npm run check:contrast` requires 4.5:1 for body text and 3:1 for large text and icons (Phase 1 plan §4.1).
- The visuals that grew around it, lilac-to-violet-to-periwinkle aurora gradients and a blurred iOS tab bar, conflict with the rehaul's design rules. The plan drops them (finding F10).
- Two components bypass the theme with literal hex values, so the C1 token sets must reach them too.

## Alternatives considered

- None is recorded in `DECISIONS.md`.
- The v2 replacement is per-theme token sets: 2 free themes and Plus and seasonal themes (rehaul plan §3.5). Each is a full token set plus a VectorCraft illustration pack.

## Links

- [`DECISIONS.md` §13](../../../DECISIONS.md#13-color-palette-valentine-theme)
- [Rehaul plan §1.2, finding F10](../../implementations/2026-10-29-couples-rehaul-plan.md#12-what-is-wrong-with-it) · [§3.5, themes](../../implementations/2026-10-29-couples-rehaul-plan.md#35-ideas-and-themes-audit-you-asked-for-new-ideas) · [§5.2, colour](../../implementations/2026-10-29-couples-rehaul-plan.md#52-kawaii-direction-draft-for-designmd)
- [Phase 1 plan, Stage C (C1)](../../implementations/2026-10-29-phase1-plan.md#stage-c--design-system-and-art-can-run-alongside-stage-b) · [§4.1, contrast check](../../implementations/2026-10-29-phase1-plan.md#41-contrast-check-c1)

## Backlinks
<!-- backlinks:start -->
- [Theme tokens in one JSON file, proved by a blocking contrast gate](0045-theme-tokens-and-contrast-gate.md)
- [Architecture decision records](README.md)
- ["Phase 1 Stage C (C1–C4): the Sticker Diary design system, display face, Classic brief and art"](../../implementations/2026-10-30-phase1-stage-c-design.md)
<!-- backlinks:end -->
