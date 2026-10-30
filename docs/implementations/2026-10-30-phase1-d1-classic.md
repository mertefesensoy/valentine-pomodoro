---
id: IMPL-2026-10-30-phase1-d1-classic
title: "Phase 1 D1: Classic rebuilt in the Sticker Diary design, with the v1.4 welcome screen"
status: in-progress
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-stage-d, IMPL-2026-10-30-phase1-stage-c-design, IMPL-2026-10-29-phase1-plan, DESIGN-WORKFLOW, ADR-0045, ADR-0046, ADR-0047, SRS]
---

# 2026-10-30 — Phase 1 D1: Classic, and the v1.4 welcome screen

**Status:** In progress. The shape step is under way: the Classic direction contract is written, and the welcome screen is being shaped.
**Branch:** `phase1/stage-d` (worktree `C:\vp\stage-d`).
**Plan:** [Stage D plan](2026-10-30-phase1-stage-d.md) §3.2, which holds the approach, the contracts of each new module, the render budget and the device checklist. This record holds what happened: each step's output, the owner's gates, the scores and the measurements.

---

## 0. Gates and steps

| Step (DESIGN-WORKFLOW §2) | Classic | Welcome screen |
|---------------------------|---------|----------------|
| 1. Shape | Brief confirmed at C4. Direction contract written 2026-10-30 (§3.1). | In progress (§3.2) |
| 2. `/apple-design` on the brief | Good; no Critical; 4 Medium and 3 Low, all dispositioned (§3.1.1) | Pending |
| Owner: direction contracts | Pending | Pending |
| 3. Build (`animate-expo`) | — | — |
| 4. Critique, audit (≥ 16/20), HIG (no Critical), `review-animations` | — | — |
| 5. `break-ui` (TR at AX5) | — | — |
| 6. `polish`, `harden`, `clarify` | — | — |
| 7. Device check, build 48 | — | — |

**Skill resolution (2026-10-30).** The Skill tool loads Impeccable from `C:\vp\stage-c\.claude\skills\impeccable`, because this session started in stage-c (Stage D plan §0). `diff -rq` finds the stage-c and stage-d copies of `impeccable`, `apple-design`, `animate-expo`, `review-animations` and `break-ui` identical, Impeccable at `ece7280` in both. Every Impeccable command here runs stage-d's own launcher with stage-d as the working directory: `impeccable context` reports `projectRoot: C:\vp\stage-d`.

## 1. Problem / Motivation

See the [Stage D plan §1](2026-10-30-phase1-stage-d.md#1-problem--motivation). D1 is the first screen in the new design and the first native build that carries the new app icon, the splash and Baloo 2. Requirements: FR-SET-002, NFR-UX-003, NFR-PERF-004, NFR-A11Y-002, NFR-A11Y-004, NFR-I18N-001 (the face and the plumbing), FR-SET-005 (the plumbing), NFR-PERF-003 (held).

## 2. What Changed

| File | Change |
|------|--------|
| `.impeccable/surfaces/app-tabs-index-tsx.md` | The owner's D1 answers folded in: what each preset sets, the built control, copy as EN/TR keys, the love-note sheet that stays until it is dismissed, and the iOS route to the tab colour. Plus the six-block direction contract. |
| `docs/implementations/2026-10-30-phase1-d1-classic.md` | This record. |

## 3. Implementation Approach

### 3.1 The Classic direction contract

Written through `impeccable surface-brief write`, under `## Direction contract` in the brief. It has six blocks (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH) and the C4 seed reference `seed:d8d47ae43e992025`; all six blocks are present (verified with `grep`).
- **The thesis:** one diary page with one moving part.
- **The first viewport:** the phase line and the Modes button at the top. The ring at about 70 % of the width, holding the Baloo timer and "Break at 10:25". The partner strip, then today's sticker row. The preset row (or the cycle row), the primary pill (≥ 54 pt) and Skip in thumb reach.

The brief also settles four points:
- **Presets:** each sets all three durations (the owner).
- **The segmented control is built.** `UISegmentedControl` can't speak each segment in words (M-3), wrap Turkish at AX5, or crossfade in place.
- **The love-note sheet stays until it is dismissed.** WCAG 2.2.1; FR-NTE-001 sets no timing, and the v1 card closed after 8 s.
- **The tab colour on iOS** goes through `iconColor` and the selected `labelStyle`, because `tintColor` is Android-only in the installed `expo-router`.

**Evidence for the finish review.** Impeccable's iOS reference asks for Simulator screenshots, never a browser. There is no Mac here, so the review's screenshots come from the owner's iPhone on the TestFlight build, and are labelled as hardware evidence.

#### 3.1.1 `/apple-design` on what D1 changed (2026-10-30)

**Scope:** only what D1 changed in the brief. The C4 review (Stage C record §2.4, H-1 to L-4) covered the rest.

**Pages opened:** `accessibility.md`, `typography.md`, `color.md`, `segmented-controls.md`, `sheets.md`, `modality.md`, `branding.md`, `tab-bars.md`, `motion.md`, `playing-haptics.md`, and the skill's `cross-platform.md`.

**Rating: Good.** No Critical findings. The thesis: one diary page with one moving part. It will be remembered by Pomo & Doro beside the timer, and by the sticker pressed onto today.

| # | Sev. | Finding | Guideline | Disposition |
|---|------|---------|-----------|-------------|
| D1-M1 | Medium | The plan set the unselected tab colour to `inkSoft`. | `color.md › Liquid Glass color`: "By default, symbols and text on these elements follow a monochromatic color scheme, becoming darker when the underlying content is light, and lighter when it's dark." | Plan §3.2.4: only the selected colour is set (`primaryInk`); the unselected one stays the system's. |
| D1-M2 | Medium | The plan gave the built preset control a tab role inside a tablist, so VoiceOver would call each preset a "tab". | `tab-bars.md › Best practices`: "Use a tab bar to support navigation, not to provide actions"; `branding.md`: customised components keep "sizing, placement, and behavior". | Plan §3.2.5: each segment is a button with `selected` state, its words and its position ("1 of 4"), at native sizing. |
| D1-M3 | Medium | A small detent can't hold a long note at AX5. | `sheets.md › Mobile`: "Include a grabber in a resizable sheet"; `modality.md`: "Make it easy to identify a modal view's task." | Plan §3.2.8: a fitted detent plus a large one, the grabber visible, the note scrolling inside, and a short title. |
| D1-M4 | Medium | Baloo 2 doesn't respond to Bold Text by itself. | `typography.md`: "If you use a custom font, make sure it implements the same behaviors." | Plan §3.2.3: under Bold Text, 500 steps to 600. The timer stays 600, or gets a 700 instance if the device check shows it reads light. |
| D1-L1 | Low | The sticker placement must never hold up the next action. | `motion.md`: "Let people cancel motion"; `playing-haptics.md`: "Make haptics optional." | Build rule: Start and Skip stay live during the spring. It plays once per completion, never on a return to the tab. The success haptic follows `settings.haptics`. |
| D1-L2 | Low | The strawberry primary pill sits just above a bar whose selected tab is `primaryInk`. | `tab-bars.md`: "Avoid applying a similar color to tab labels and content layer backgrounds." | The two differ in lightness (pastel `#F7A9BE` against `#B03158`). At least 16 pt stays between the pill and the bar, checked on the device. |
| D1-L3 | Low | Segment labels: Apple asks for title-style capitalisation. | `segmented-controls.md › Content`: "uses title-style capitalization." | The labels are numerals ("25/5"), so nothing conflicts. Any word label ("Custom") follows the owner's sentence case (C4 L-3). |

**What works:**
- **The love note no longer closes itself** (`accessibility.md`: "Prefer dismissing views with an explicit action").
- **Four presets** sit within "no more than about five segments on iPhone", as "closely related choices that affect an object, state, or view" (`segmented-controls.md`).
- **The selected tab carries the brand colour,** as `branding.md` suggests ("an icon for the selected tab in a tab bar").
- **The welcome screen** is where Apple puts branding instead of the launch screen (`branding.md`: "consider displaying a welcome or onboarding screen").

### 3.2 The welcome screen

Filled in as the shape step runs.

## 4. Mathematical / Statistical Details

The numeric rules D1 implements are in the [Stage D plan §4](2026-10-30-phase1-stage-d.md#4-mathematical--statistical-details): contrast, tabular digits, the font build, the sticker spring, "Break at" and bytecode. Measurements go here as they are taken.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| The love-note sheet stays until it is dismissed | Keep v1's 8 s auto-close | A sheet that closes itself takes the text away from someone reading at a large size (WCAG 2.2.1, Timing Adjustable). The interstitial already waits for the sheet to close, so the ad policy is unchanged. |
| Run stage-d's Impeccable launcher, not stage-c's | Use the base directory the Skill tool reports | The copies are identical; stage-d's own launcher keeps every read and write inside this worktree. |

## 6. Verification

- [x] The Classic contract has all six blocks and the seed reference.
- [ ] Every step in §0, then the guards in the [Stage D plan §3.6](2026-10-30-phase1-stage-d.md#36-guards-green-at-every-commit), then the device checklist in §3.2.10 (needs a physical device).

## 7. Related Docs

- [Stage D plan](2026-10-30-phase1-stage-d.md) · [Stage C record](2026-10-30-phase1-stage-c-design.md) §2.4, §10 · [Design workflow](../process/DESIGN-WORKFLOW.md)
- The Classic brief: `.impeccable/surfaces/app-tabs-index-tsx.md`

## Backlinks
<!-- backlinks:start -->
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
