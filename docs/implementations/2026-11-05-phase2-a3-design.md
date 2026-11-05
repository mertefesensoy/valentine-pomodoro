---
id: IMPL-2026-11-05-phase2-a3-design
title: "Phase 2 A3: the design of pairing, your partner's day and the account screens"
status: done
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, DESIGN-WORKFLOW, ADR-0049, ADR-0051, SRS]
---

# 2026-11-05 — Phase 2 A3: the design of pairing, your partner's day and the account screens

**Status:** Done. The owner approved the briefs and contracts on 2026-11-05. D1 to D5 build them, each with its own finish review.
**Branch:** `docs/phase2-a3-design`, one pull request into `master`. No app code: D1 to D5 build this.
**Plan task:** [Phase 2 plan §3, A3](2026-11-05-phase2-plan.md#stage-a-baselines-budget-and-design-no-backend), by [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md).

---

## 1. Problem / Motivation

1.5.0 asks people who have never had an account to sign in, and gives them a partner's day and notes in return. A3 settles how that looks and works before any screen is built, covering where Pair lives, the sign-in sheet, sharing and entering a code, the first-pairing morph, the partner card, writing and receiving a note, unpair, delete, export, and the offline and error states.

## 2. What Changed

| File | Change |
|------|--------|
| `.impeccable/surfaces/app-pair-tsx.md` | New: the brief and direction contract for the pairing sheet. |
| `.impeccable/surfaces/app-partner-tsx.md` | New: the brief and contract for the partner's day, the strip and notes to your partner. |
| `.impeccable/surfaces/app-tabs-settings-tsx.md` | Adds the Phase 2 section: Your partner, Account and Privacy. |
| `.impeccable/surfaces/app-tabs-index-tsx.md` | Adds a pointer: the partner slot in 1.5 follows the new brief. |
| `scripts/design/pairing-sketches/build.mjs` | New: builds the review page's sketches from the repo's tokens and art. |
| `docs/process/DESIGN-WORKFLOW.md` | Two new rows in its table of tensions. |

## 3. Implementation Approach

The pipeline is DESIGN-WORKFLOW §2's steps 1 and 2. Steps 3 to 7 happen in D1 to D5.

### 3.1 Discovery: the owner's answers, 2026-11-05

Asked with the costs of each option:

| Question | The owner's answer |
|---|---|
| Where should someone find Pair? | "Timer strip when idle, and Settings (Recommended)" |
| What should the Timer show of a partner? | "Name and stickers on the strip (Recommended)" |
| If Show love notes is off and your partner wrote you a note? | "It waits on their card (Recommended)" |

### 3.2 The composition round

The pairing sheet is a whole new flow, so it got a structure round (`impeccable concept-seed --scope surface --mode operate`, `seed:0039ebbffa7e05be`). My ordered list of seven, by resonance:

1. Six dashed cells alone, as the sheet's hero
2. A chooser first, "I'm inviting" or "I was invited"
3. Pomo & Doro guiding each step in speech bubbles
4. **One grouped list** (dealt)
5. A stepper of single questions
6. **The postcard** (dealt)
7. **Facing pages** (dealt, the lead)

The sketches are coded, as an Operate surface is code-led: `node scripts/design/pairing-sketches/build.mjs`. The review page is a private artifact, [Pairing Compositions](https://claude.ai/artifact/3ogp3mnJU3rsKNymCKYQgu): each structure in four frames at 390 × 844, with the frames the owner's answers fixed. Six catalogue challengers were weighed and set aside, on audience and clarity. Two lent a discipline: one fixed cell per character (the split-flap board) and one job on each step (the feed).

**The owner chose "Facing pages (Recommended)"**, and of the fixed frames said "Yes, they're right (Recommended)".

### 3.3 The platform check of the briefs

`/apple-design` on the briefs and sketches, DESIGN-WORKFLOW's step 2, for React Native on iOS. Pages read: `sign-in-with-apple`, `managing-accounts`, `privacy`, `onboarding`, `offering-help`, `sheets`, `alerts`, `entering-data`, `feedback`, `virtual-keyboards`, `voiceover`. **Rating: Good; nothing Critical.** Each finding is already in the brief it applies to.

| # | Severity | Finding | Disposition |
|---|---|---|---|
| H-1 | High | `sign-in-with-apple.md › Displaying buttons`: "avoid making people scroll to see the button". At AX5 in Turkish, the spread and the why would push it below the fold | At AX sizes the pages stack small, and the button and Send my code stay in view |
| H-2 | High | `sign-in-with-apple.md › Using the system-provided buttons`: only the system's button guarantees an approved look, translation and a VoiceOver label. The sketch draws one | The build uses `AppleAuthenticationButton`: Continue, black in light, white in dark, corner radius 28 |
| H-3 | High | `sheets.md › Best practices`: "Display only one sheet at a time". Write a note from the partner sheet would stack the note editor's sheet on it | The content swaps in place within one sheet. Pairing's steps do too. The share sheet is the system's |
| H-4 | Medium | `sign-in-with-apple.md › Collecting data`: "Be transparent about the data you collect", and "welcome people by using the name" | Your page shows your name right after sign-in; Settings shows and edits it. The why states what's kept, and the copy proof holds it to the truth |
| H-5 | Medium | `managing-accounts.md › Deleting accounts`: "Tell people when account deletion will complete" | Deletion is immediate and says so when it's done. The Apple token is revoked (plan B3) |
| H-6 | Medium | `alerts.md › Best practices`: avoid alerts when the app starts, or merely to inform | A partner who's gone is one quiet line on the strip. Mistakes are inline. Alerts are kept for Unpair and Delete, each with a specific button title |
| H-7 | Medium | `entering-data.md`: let people paste, and validate dynamically | One real text field behind the cells: paste is accepted and cleaned, and it checks by itself at six characters |
| H-8 | Medium | `voiceover.md › Inform VoiceOver when visible content or layout changes occur` | Each step and error is announced (`AccessibilityInfo.announceForAccessibility`, as live regions are Android-only). The code is spelled out |
| H-9 | Low | Controls: the strip's line alone would be under 44 pt | The whole strip is one button |

### 3.4 Two additions to the design system

- **The first pairing's morph** is a third once-only exception to the one bounce, beside the welcome and the tour.
- **The code is set in the system face,** not Baloo 2, which stays where DESIGN.md puts it.

Both are in DESIGN-WORKFLOW's table. DESIGN.md itself is updated from the build, at D1's finish.

### 3.5 What the owner approved

The owner, 2026-11-05, on the page's "For your approval" section:

- **The briefs, the direction contracts and the two additions:** "Approve it (Recommended)".
- **Sign out:** "No sign out in 1.5.0 (Recommended)", with the cost stated: someone who hands their phone on must delete their account or unpair.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A structure round for the pairing sheet only | One for every surface | The strip, the sheet and Settings extend established surfaces, and new-work says not to run the tournament for those |
| One hidden field behind the cells | Six separate fields | One field gives paste, VoiceOver and the keyboard's own behaviour for free, and it's the standard approach |
| Ask Apple for the name only | The name and the email | Data minimisation (NFR-PRIV-001), and F4's labels list no email. C1 must prove it against the real project |
| The inviter's phone checks every 10 s while the sheet is open | Realtime; only at foreground | Realtime waits for Phase 3 (plan §5). Staying on the sheet is exactly when someone is waiting for their partner, and a poll bounded by the sheet's life is cheap |

## 6. Verification

- [x] The owner chose the structure and confirmed the frames (§3.2).
- [x] The platform check ran, and each finding has its disposition (§3.3).
- [x] The owner approved the briefs and the direction contracts (§3.5).
- [x] `node scripts/docs/check-docs.mjs`: 0 errors.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), A3 and §0.3
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md), [ADR-0049](../architecture/adr/0049-account-only-at-pairing.md), [ADR-0051](../architecture/adr/0051-anonymous-start-up-reports.md)
- [SRS](../srs/SRS.md): FR-ACC-002, FR-ACC-003, FR-ACC-004, FR-PAR-001, FR-PAR-002, FR-PAR-003, FR-NTE-003, NFR-PERF-008
