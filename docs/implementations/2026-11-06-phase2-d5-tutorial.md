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
| `src/screens/tutorial/tourStore.ts` | A replay during a session skips the new step too, and a kill during a version tour keeps what was seen. |
| `src/screens/tutorial/useTour.ts`, `src/screens/pair/PairScreen.tsx`, `src/screens/partner/PartnerScreen.tsx`, `src/screens/tutorial/TourLayer.tsx` | Closing a sheet the strip opened moves the tour on, and the opening carries a hint. |
| `.impeccable/surfaces/app-tutorial-tsx.md`, `DESIGN.md` | 1.5's shape in the brief, and the account groups and the tour in the design system. |
| `src/screens/TimerScreen.tsx`, `src/screens/classic/SpreadPages.tsx` | The strip as an opening, on both layouts. |
| `src/i18n/en.json`, `src/i18n/tr.json` | The lines, drafts for the copy proof (D6). |
| `docs/implementations/2026-11-06-phase2-d4-account.md` | The owner's answer on the rare wrong message, which came with D4's push. |
| `src/screens/tutorial/__tests__/` | Below. |

## 3. Implementation Approach

**No new engine, art or sounds,** as the brief's standing rule says: the store serves a list of tutorials keyed by version, the babble speaks any line, and these use the existing faces. The one addition is an opening, `partner`, on the Timer: the strip on the Ring, or the partner page's foot on Facing Pages, registered like the others. Like them it's lit and live, so pressing it does what it does (opens the pairing sheet, or their day), and closing that sheet moves the tour on from `pair`, as Modes does, so someone who has just signed in and seen their code isn't told again to pair. It stays put from `pairNotes`, where moving on would end the tour.

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

**A kill part-way.** The stored value used to be overwritten with just `resumeAt`, which was fine while the only tour was for people with nothing seen. With a version tour that made someone updating into a first-timer, and they'd get the seven-step tour on the next launch. Both writes now keep `seen`, and a second kill counts as seen whatever it was before. A resume starts on the step, not its lead, when the step is on the Timer, since nothing presses that tab.

**The flag:** with `PAIRING_ENABLED` off, `TUTORIALS` and `GENERAL` are exactly as they were, so nothing shows before Stage F. One thing does change with it off: a resume onto a Timer step starts at the step, which is better for anyone on the shipped tour too. Finishing the general tour with it on stores 1.5, so a new install isn't shown the update tour too.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| **Two steps at the strip.** The owner: "Two steps, as described (Recommended)" | One step; no tour, only What's New | Both new things in about 15 seconds. One step leaves notes unmentioned, and no tour breaks the owner's standing rule |
| The new general step goes before the last | Right after Modes | It keeps the end as it is, an invitation to focus, and shifts one speaker rather than three |
| The opening stays live | Lit only | Every opening is lit and live, and pairing is exactly what this step suggests. It only ever reaches sign-in by the person's own press |
| Closing the sheet moves on from `pair` | Staying on the step, as Notes' Add does | Its line would replay in full, telling someone who has just signed in to pair |

## 6. Verification

- [x] `dueTutorial`: someone on 1.4 gets the 1.5 tour, a new install and 1.3.1 get the general one, and finishing either means nothing more is due.
- [x] The steps' speakers take turns, and their lines exist in both languages.
- [x] The tour reaches the strip on the Timer, and a replay during a session skips it (`tutorial15.test.tsx`). Jest never measures, so the opening's rectangle on Facing Pages is for the device.
- [x] With the flag off, the tutorials' steps are unchanged: `tutorialModel.test.ts`, `tourFlow.test.tsx`, `tourStoreAndPlacement.test.ts` and `tourWorstCase.test.tsx` pass, now mocking the flag off, so that they keep testing the shipped tour after F1.
- [x] With it on, in `tutorial15.test.tsx`: the walk from Notes through the new step, a kill during the 1.5 tour, a resume from the shipped six steps, closing a sheet, and someone already paired on both layouts.
- [x] The guards, and the bytecode: 4,586,584 B, which is 3,032 B for D5 and leaves 53,416 B of NFR-PERF-002 for D6.
- [ ] **Needs a device, at Stage F's first build:** the opening's rectangle on both layouts and at AX sizes; pressing it and coming back; the owner's listening to the new lines.

### The finish review, 2026-11-06

**From code only,** by a fresh `impeccable-finish-reviewer`, at `a523d5d`: critique 30/40 and native audit 17/20, disposition fix. Its fixes, all applied:

- **A kill during the 1.5 tour wiped `seen`,** so someone updating would have had the full seven steps on the next launch. Both writes keep it now, and a second kill counts as seen.
- **The second step offered notes to someone already paired:** "you can leave each other notes" reads as news to them, so they have their own line.
- **Closing the sheet the strip opened replayed the line,** telling someone who'd just signed in to pair. It moves on now, from `pair` only.
- **The shipped tour's tests would have changed meaning at F1,** when the flag turns on. They mock it off now, and the flag-on walk has tests of its own.
- **The opening's VoiceOver label dropped the partner's notice and the hint** that the strip carries outside the tour.
- **A resume could land on a lead for a tab nobody pressed,** so a resume onto a Timer step starts at the step. A resume onto Notes' lead, which sits on Stats, still shows nothing until Stats is opened. That was already so, and it's left.
- **The brief still said six steps,** and its "no sign-in inside the tour" needed squaring with a live strip.

**A narrow second pass,** at `85b73b5`: critique 34/40 and native audit 18/20, which meets NFR-UX-003's 16/20. It found one more suite pinning the shipped tour, `tourWorstCase.test.tsx`, and the opening's label dropping the "aren't paired any more" line that pressing it dismisses. Both are fixed, and so is `router.test.tsx`, whose `{ seen: '1.4' }` stops meaning "seen" with the flag on. It also confirmed that closing `/pair` or `/partner` moves the tour on whichever way the sheet was opened, which suits the next line, so that stays.

**The owner,** shown these scores and what's left below, on 2026-11-06: "Push, PR, merge when green (Recommended)".

**Left, with the reasons:**

- Done beside Skip tour on the last beat, and the opening's rectangle after a late refresh, are for the device.
- "Tap it to see it all" is slightly off for someone paired whose session has ended, where the press leads to signing in. It needs a replay in that state, so it's left.
- `resumeAt` isn't tied to a tutorial, so `{ seen: '1.4', resumeAt: 1 }` would index into a later version's tour. **The next version tutorial should store the tutorial's id with it.**
- The layer's `paired` reads the stored glance, and the Timer's also asks for an account. Deleting an account clears the glance before the account goes, so they can't differ on a device.
- With the flag on, other suites fail that this change doesn't touch: `classic`, `classicWorstCase`, `settings`'s "with pairing off", `features`, `router`'s count of queued tasks, which the start-up report joins, and perhaps `deferredStartup`. They're F1's to flip. `tourFlow.test.tsx` pins the reports off as well as pairing, and passes with the real flag on.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), D5
- [Phase 1 D5's record](2026-11-01-phase1-d5-tutorial.md), [D2's record](2026-11-06-phase2-d2-partner.md)
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md)
