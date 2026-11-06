---
id: IMPL-2026-11-06-phase2-d5-tutorial
title: "Phase 2 D5: the 1.5 version tutorial"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-01-phase1-d5-tutorial, IMPL-2026-11-06-phase2-d2-partner, DESIGN-WORKFLOW, SRS]
---

# 2026-11-06 — Phase 2 D5: the 1.5 version tutorial

**Status:** Built and tested. The device check waits for Stage F's first build.
**Branch:** `feat/phase2-d5-tutorial`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, D5](2026-11-05-phase2-plan.md#stage-d-the-screens-behind-the-flag). Its brief is the tutorial's, `.impeccable/surfaces/app-tutorial-tsx.md`, whose standing rule says a later version tutorial needs content only. The owner approved this shape on 2026-11-06: "Two steps, as described (Recommended)".

---

## 1. Problem / Motivation

The owner's rule: one general tutorial for first-timers, and a short one for each feature version, for people updating. 1.5's new things are pairing and notes, and nothing yet tells someone updating that they exist.

Requirement: [FR-ONB-002](../srs/SRS.md#fr-onb-002). "Done when": the device check.

## 2. What Changed

| File | Change |
|------|--------|
| `src/screens/tutorial/tutorials.ts` | The 1.5 tutorial, and a step in the general one. Both only with `PAIRING_ENABLED`. |
| `src/screens/tutorial/tourStore.ts` | A replay during a session skips the new step too. |
| `src/screens/TimerScreen.tsx`, `src/screens/classic/SpreadPages.tsx` | The strip as an opening, on both layouts. |
| `src/i18n/en.json`, `src/i18n/tr.json` | The lines, drafts for the copy proof (D6). |
| `docs/implementations/2026-11-06-phase2-d4-account.md` | The owner's answer on the rare wrong message, which came with D4's push. |
| `src/screens/tutorial/__tests__/` | Below. |

## 3. Implementation Approach

**No new engine, art or sounds,** as the brief's standing rule says: the store serves a list of tutorials keyed by version, the babble speaks any line, and these use the existing faces. The one addition is an opening, `partner`, on the Timer: the strip on the Ring, or the partner page's foot on Facing Pages, registered like the others. Like them it's lit and live, so pressing it does what it does (opens the pairing sheet, or their day), and the tour carries on at the same step when the sheet closes.

**The 1.5 tutorial,** `kind: 'version'`, for someone whose `seen` is 1.4: two steps at the strip, one idea each.

1. Pomo: you can pair with your partner here, and see each other's day.
2. Doro: you can leave each other notes, which appear after a focus.

**The general tutorial** gains one step before the last, for new installs, and for someone coming straight from 1.3.1, who has seen no tutorial at all. T-11 has the pair take turns, so:

| Step | Speaker |
|------|---------|
| presets, today, modes, stats, notes | As before |
| **pair,** with a lead back to the Timer, since Notes comes before it | Doro |
| invite, which no longer needs its own lead | **Pomo** |

The last step's speaker changes so they keep taking turns. Its line doesn't name who's speaking.

**Someone already paired** can replay the tour, or reinstall and sign in, so the step has a second line about the strip being their partner, chosen by a new `paired` in `LineContext`.

**The Turkish** follows the tour's existing rule that no word runs past 10 letters, so a line can wrap at AX5, which ruled out "partnerinle" and "birbirinizin". The lines are drafts for the copy proof.

**A replay during a session** skips this step as it skips the presets and the invitation: the Pair line is gone while a session runs.

**The flag:** with `PAIRING_ENABLED` off, `TUTORIALS` and `GENERAL` are exactly as they were, so nothing shows before Stage F. Finishing the general tour with it on stores 1.5, so a new install isn't shown the update tour too.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| **Two steps at the strip.** The owner: "Two steps, as described (Recommended)" | One step; no tour, only What's New | Both new things in about 15 seconds. One step leaves notes unmentioned, and no tour breaks the owner's standing rule |
| The new general step goes before the last | Right after Modes | It keeps the end as it is, an invitation to focus, and shifts one speaker rather than three |
| The opening stays live | Lit only | Every opening is lit and live, and pairing is exactly what this step suggests |

## 6. Verification

- [x] `dueTutorial`: someone on 1.4 gets the 1.5 tour, a new install and 1.3.1 get the general one, and finishing either means nothing more is due.
- [x] The steps' speakers take turns, and their lines exist in both languages.
- [x] The tour reaches the strip on the Timer, and a replay during a session skips it (`tutorial15.test.tsx`). Jest never measures, so the opening's rectangle on Facing Pages is for the device.
- [x] With the flag off, the tutorials are unchanged: the existing `tutorialModel.test.ts` and `tourFlow.test.tsx` still pass as written.
- [x] The guards, and the bytecode: 4,585,732 B, which is 2,180 B for D5 and leaves 54,268 B of NFR-PERF-002 for D6.
- [ ] **Needs a device, at Stage F's first build:** the opening's rectangle on both layouts and at AX sizes; pressing it and coming back; the owner's listening to the new lines.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), D5
- [Phase 1 D5's record](2026-11-01-phase1-d5-tutorial.md), [D2's record](2026-11-06-phase2-d2-partner.md)
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md)
