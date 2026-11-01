---
id: IMPL-2026-11-01-phase1-d5-tutorial
title: "Phase 1 D5: the general tutorial, Pomo & Doro show you around"
status: in-progress
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-stage-d, IMPL-2026-10-30-phase1-d1-classic, IMPL-2026-10-30-phase1-d4-sounds, IMPL-2026-11-01-phase1-d4-wiring, DESIGN-WORKFLOW, SRS]
---

# 2026-11-01 — Phase 1 D5: the general tutorial

**Status:** In progress. The brief is confirmed by the owner (2026-11-01, "Confirm the brief"); `/apple-design` reviews it next.
**Branch:** `phase1/stage-d` (worktree `C:\vp\stage-d`).
**Plan:** [Stage D plan](2026-10-30-phase1-stage-d.md) §3.9, added by the owner on 2026-11-01. This record holds what happens: each step's output, the owner's gates and the measurements.

**Requirements:** `FR-ONB-001` and `FR-ONB-002` (proposed; they join the SRS at merge, Stage D plan §9), NFR-PERF-005, NFR-A11Y-003, NFR-A11Y-004, NFR-I18N-001, FR-SET-004 (the babble follows the Sound switch).

---

## 0. Steps

DESIGN-WORKFLOW §2, as every new surface:

| Step | State |
|---|---|
| 1. Shape | **Confirmed** by the owner, 2026-11-01 ("Confirm the brief"); written from their five answers (§3.1) |
| 2. `/apple-design` on the brief | Running, 2026-11-01. Spike done alongside (§3.2): the layer lives inside the tab screens |
| 3. Composition round, then the direction contract | Pending: the dock, the bubble's placement, the opening, the Modes step, the motion row |
| 4. Assets: the pair's poses (VectorCraft) on a pose sheet, their babble (SoundCraft) on a listening page | Pending; possibly a parallel session, as D4's were |
| 5. Build (`animate-expo`) | Pending |
| 6. Critique, audit, HIG, `review-animations` | Pending |
| 7. `break-ui` in Turkish at AX5 | Pending |
| 8. Polish, then the copy review | Pending |
| 9. Device check | Pending |
| FINISH: the finish review, its verdict, DESIGN.md's "Tutorial (first run)" row | Pending |

## 1. Problem / Motivation

v1.4 adds presets, two Classic layouts, the Modes sheet, stickers and today's goal, the postcard Stats, a language choice and sounds. Nothing shows a newcomer where they are, nor a v1.3.1 user what changed. The only first-run screen is the one-time welcome, which is one beat by design: its brief says it "is not a tutorial".

The owner, 2026-11-01: "we need an onboarding tutorial featuring pomo and doro … a tuttorial that they will guide for the Valentine pomodoro." The owner set a rule for every version, which shapes the engine:
- one general tutorial for first-timers;
- one version tutorial per later feature release, for updaters;
- for v1.4, only the general one, for everyone.

## 2. What Changed

| File | Change |
|------|--------|
| `.impeccable/surfaces/app-tutorial-tsx.md` (new) | The tutorial's surface brief (§3.1), written with `impeccable surface-brief write` |
| This record (new) | D5's record |

## 3. Implementation Approach

### 3.1 Shape: the brief

`/impeccable shape app/tutorial.tsx` resolved from this worktree's own copy. Its context loaded PRODUCT.md, DESIGN.md and the welcome's brief, the screen the tutorial follows.

**The owner's answers, 2026-11-01** (two rounds, each the recommended option):

| Question | Answer |
|---|---|
| Where it sits beside the welcome | **Right after it**: the welcome's Start hands over to the tour |
| Where the pair explain | **Over the real screens**, with a spotlight on the control in question |
| How long | **About six steps**, one idea each, about a minute |
| Who presses a tab or a button | **You do**, with Next in the bubble as a backup |
| How it ends | **The invitation to the first focus**: Start focus spotlit, or "Not now" |

**The brief, in short** (in full: `.impeccable/surfaces/app-tutorial-tsx.md`):
- **Mode: Operate.** It's a teaching layer over the live tabs.
- **The steps:**
  1. Hello;
  2. the presets;
  3. today's row;
  4. the Modes button;
  5. Stats, after you tap its tab;
  6. Notes, after you tap its tab;
  7. back on the Timer, the invitation.
- **The pair:**
  - they stand in a dock, as stickers, and take turns;
  - the speaker's mouth moves while their babble plays and their line writes on in a paper bubble;
  - the listener reacts.
- **The opening:** the screen dims to a wash of the theme's ink (no blur), with a rounded opening around one control. Only the opening answers a tap, and it acts as the real control.
- **Shown:** once, right after the welcome, behind the welcome's calm-entry gate. It's remembered under its own additive key holding the version seen, and replayed from Settings › About.
- **Kept:** Skip at every step; Reduce Motion as pose swaps and fades; Dynamic Type; VoiceOver reading the bubbles with the babble silent; the babble following the Sound switch; every line in both languages.
- **Open for the contract:**
  - how the opening's tap acts as the control, since NativeTabs and native sheets sit above React Native views (a spike decides);
  - the Modes step;
  - the dock's place;
  - the motion table's "Tutorial (first run)" row, an owner-approved exception like "Welcome (once)".

### 3.2 Spike: how a spotlit tap reaches the real control

The brief left open how the opening's tap acts as the control, since NativeTabs and native sheets sit above React Native views. Read from the code, 2026-11-01; a device prototype confirms it.

- **NativeTabs is iOS's own tab bar controller.** Its host, `RNSTabBarController` (react-native-screens, `ios/tabs/host/`), subclasses `UITabBarController`. Each tab screen is a child view controller, and the bar sits above all of them.
- **So a layer drawn inside a tab screen never covers the bar.** A tap on the real Stats or Notes tab reaches the bar natively, with nothing to forward. The welcome's way, a root route (`presentation: 'fullScreenModal'`), would cover the bar and take every tap. **The layer lives inside the tab screens** (Timer, Stats, Notes), mounted like `StatusBarScrim`, and reads one tutorial store. The brief's `app/tutorial.tsx` route isn't needed.
- **An opening on an in-screen control** (the presets, today's row, the Modes button, Start focus) is a dim of four rectangles around a hole, with nothing over the hole. A tap there reaches the real control.
- **The Modes sheet** is a native form sheet over everything, the layer included. At that step, the sheet's own route (`app/modes.tsx`) shows the bubble.
- **What the layer can't do:** dim the tab bar or stop a tap on another tab. Mid-tour someone could go to Settings, so the contract decides what the layer says there (a gentle "come back", or waiting).
- **Positions** come from each control's own layout (`measureInWindow`), in the same window as the layer. Nothing is fixed.

## 4. Mathematical / Statistical Details

None yet. The write-on pace and the babble's syllable rate will be set, with their numbers, in the contract.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| The tour follows the welcome | Folding the welcome into it; offering it later | The owner's answer. The welcome keeps its one beat, and the tour starts while attention is fresh |
| Over the real screens | Its own illustrated pages; pages then one real step | The owner's answer. People learn where things really are |
| You press, with Next as a backup | The tour navigates for you | The owner's answer. The hands learn the controls, and Next means nobody gets stuck |
| It ends on the first focus | A goodbye | The owner's answer. The tour's last tap is the app's main action |
| A list of tutorials keyed by version | A one-off general tutorial | The owner's rule: later versions add a version tutorial as content, not a new engine |

## 6. Verification

- [x] The brief written and stored (`impeccable surface-brief write`).
- [x] The owner confirms the brief (2026-11-01, "Confirm the brief").
- [ ] The remaining steps of §0.

## 7. Related Docs

- [Stage D plan](2026-10-30-phase1-stage-d.md) §3.9 · [D1 record](2026-10-30-phase1-d1-classic.md) (the welcome) · [D4 record](2026-10-30-phase1-d4-sounds.md) and [D4 wiring](2026-11-01-phase1-d4-wiring.md) (the sounds and their session)
- The tutorial's brief: `.impeccable/surfaces/app-tutorial-tsx.md` · the welcome's brief: `.impeccable/surfaces/app-welcome-tsx.md`
