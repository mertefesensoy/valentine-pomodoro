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
| 2. `/apple-design` on the brief | **Good**, 2026-11-01: no Critical, 2 High, 5 Medium, 4 Low (§3.3). All accepted, T-4 in part; the contract carries them. Spike done alongside (§3.2): the layer lives inside the tab screens |
| 3. Composition round, then the direction contract | **The bookmark ribbon**, the owner's pick, 2026-11-01, after two rounds (§3.4). **The contract is written** (§3.5) and waits for the owner's approval |
| 4. Assets: the pair's poses **and new expressions with their animations** (VectorCraft) on a pose sheet, their babble (SoundCraft) on a listening page | Pending; possibly a parallel session, as D4's were. The expressions are the owner's addition (§3.4, round 2) |
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

### 3.3 `/apple-design` on the brief: Good

A subagent ran the skill on the confirmed brief and checked it against the live code. It opened 18 references, among them `onboarding.md`, `voiceover.md`, `modality.md`, `tab-bars.md`, `playing-audio.md` and `offering-help.md`.

**Rating: Good.** No Critical, 2 High, 5 Medium, 4 Low.
- **What works:** Skip at every step, with a replay; about a minute; teaching by doing on the real controls; D4's ambient session for the babble; no haptic per line; a tap finishes a line.
- **Checked here before deciding:**
  - Midnight Plum's `ink` is `#FFF3EE` (`palette.json`), so T-5 holds.
  - The first Start asks for notification permission (`useNotifications.ts:25`), so T-3's last point holds.
- **The review predates the spike.** Its platform notes assume a root route. The spike's layer inside the tab screens settles three of them:
  - **The tab bar is never dimmed,** and the bubble names the tab it points at, so there's no computed opening over the bar.
  - **No route closes when the tab changes.**
  - **A tap on a tab is the real one,** so the bar's own haptic (`tabPressHaptic`) fires.

| # | Finding | Disposition |
|---|---|---|
| T-1 High | VoiceOver: a write-on read half-way, and a modal layer hiding the real controls | **Accept.** With a screen reader on, the whole line shows at once and the babble stays silent. The bubble is one element, "Pomo: …", then Next, then Skip tour. The layer is `accessibilityViewIsModal`. An opening on an in-screen control is its own element, with the control's label and role, and acts as it, so Voice Control's "Tap Start focus" works. The tab bar is outside the layer, so VoiceOver reaches the real tab. The pair are hidden from VoiceOver. Each step sets VoiceOver's focus (`setAccessibilityFocus`; iOS has no live regions), and the layer follows the screen reader turning on or off |
| T-2 High | No room budget at AX sizes; a scrolled Timer can hide the control | **Accept.** From the app's AX switch (font scale 1.6), the bubble becomes a bottom panel whose text scrolls, with Next and Skip tour pinned under it, and the pair shrink to a badge beside the speaker's name. The text size isn't capped. The real page scrolls so the control clears the panel before it's measured. Each line has a budget (EN ≤ 90, TR ≤ 110 characters: three lines at the default size). The contract gives placements for landscape and iPad |
| T-3 Medium | The last step: Next would start a session; three ways out; "your first one" is wrong for updaters; "together" reads as the partner | **Accept.** The last step has no Next, and "Not now" takes Skip's place. The tour's own exit reads "Skip tour" / "Turu atla", never the Timer's Skip. Updaters and replays get their own last line, and no line says "together". The layer closes before the session starts, so the first Start's notification-permission alert lands on the Timer |
| T-4 Medium | Settle the Modes step: explain it and move on | **Accept in part.** The step is settled, but the owner's "you press" stays (§3.1). The Modes button's opening is pressable. The Modes sheet, its own route, shows a short bubble (Ring, Facing pages, Fly) while the tour is at this step, and closing it continues to Stats. Next moves on without opening the sheet. The layer isn't a presented sheet, so no second sheet stacks on it (`sheets.md`: one at a time) |
| T-5 Medium | The dim works backwards in Midnight Plum | **Accept.** A `scrim` token per theme: cocoa `#4A2C29` in Strawberry Milk, deep plum `#0D070F` in Midnight Plum. Its opacity is stated in the contract, raised under Reduce Transparency and Increase Contrast, and checked by `check:contrast` |
| T-6 Medium | Lines must match the screen: an empty week, the goal off | **Accept.** Lines per state: a new install's empty week ("fills as you focus"); the goal off (spotlight the "Turn on a daily goal" row, or drop the clause); updater or new install |
| T-7 Medium | Replay while a session runs | **Accept.** The replay switches to the Timer first. With a session running, it plays the steps before the invitation and ends on "Done", leaving the session alone. The row is never disabled without saying why |
| T-8 Low | No sound control inside the tour | **Accept.** A mute beside Skip tour silences the babble for the rest of the tour. Settings › Sound is left alone |
| T-9 Low | A tour killed half-way restarts from step 1 | **Accept.** The step is saved, and a relaunch resumes there, once. This amends the brief's "from the start" |
| T-10 Low | Four moving things; the listener's reactions | **Accept.** The listener holds one still pose, looking at the opening. Under Reduce Motion the talking loop stops too |
| T-11 Low | Seven steps for "about six"; the hello teaches nothing | **Accept.** The hello folds into the presets step, so there are six: (1) hello and the presets, (2) today's row, (3) the Modes button, (4) Stats, (5) Notes, (6) back on the Timer, the invitation |

### 3.4 The composition round (new-work §3: a whole surface inside an established world)

**The owner, 2026-11-01:** "Start the round".

**The ranked structures,** seven, ordered by resonance before the roll. Each fits the spike (§3.2): the layer inside the tab screens, a four-panel dim, the tab bar lit.
1. the margin notes: the pair as doodles in the diary's margin, a margin note with a drawn arrow;
2. peeking from the page's edge: half-stuck stickers above the tab bar, the bubble rising from them;
3. the comic-strip duet: a two-panel strip, one panel each, in turns;
4. the washi-tape frame: tape strips frame the opening, the note taped beside it;
5. the sticky note: the bubble a sticky note, the pair on its corner;
6. the puppet stage: a paper stage strip at the bottom, the rest dimmed like a theatre;
7. the bookmark ribbon: the pair ride the diary's ribbon down to the control.

**The roll:** `concept-seed --scope surface --mode operate` dealt **7, 4 and 3**, with 7 leading (key `48a753d9bc4e6da9fed319f4d709c6f1`).

**The six catalog challengers were declined** on audience identification and product clarity. A challenger may change the layout, never the pinned Sticker Diary look, and none beats the dealt lead for a kawaii couple learning their study timer.
- airport wayfinding signs;
- a boarding pass and gate board;
- a split-flap departures board;
- a dance notation score;
- a design annual's plates;
- a gridded type specimen.

Two lend a discipline to whichever structure wins: one message per bubble, its pointer fixed to the edge facing the control (the signs); and the spotlit control stays lit until it's pressed (the boarding pass).

**The sketches** are coded, since an Operate surface is code-led. `scripts/design/tutorial-sketches/build.mjs` builds them from the repo's tokens, the pair's art and Baloo 2 into `.impeccable/mocks/decision/tutorial-*.html` (git-ignored until the round resolves).
- **Each shows two frames over a replica of the real Timer at 390 × 844:** step 1 (hello and the presets, an opening on the presets row) and step 4 (on to Stats: the page dimmed, the tab bar lit).
- **All three use** the cocoa scrim (T-5), Skip tour and Next in the bubble (T-3), and the pair's current poses. Their talking and pointing poses come in the asset step.
- **Fixed after the first look:** the pair grew to 88 pt for the speaker and 62 for the listener; the ribbon drapes around the clock instead of cutting through it; the comic strip gained room for its buttons.

**The decision page:** a private artifact, [Tutorial Compositions](https://claude.ai/artifact/CMtnJTVezuwuumgEtVUhQa), with the three sketches live (the lead under "The roll") and the declined challengers in a quiet row.

**Round 2.** The owner, 2026-11-01, instead of picking: "make pomo and doro much more bigger on the screen for the tutorials for better aesthetic and we will comparte them again. Also i want new expressiosn and animations for expressions as well".
- **The pair, about twice as big:**
  - the speaker's sticker box is 190 pt (it was 88), the listener's 140 (it was 62);
  - the speaker wears its celebrating pose and the listener its idle one, both from the shipped art (`art/out/illustration/`, as symbols).
- **Each composition rearranged around them, with the spotlight still clear:**
  - **The ribbon:** the bubble floats above, and the pair stand at the ribbon's tip.
  - **The washi:** the pair stand tall on the note's top edge.
  - **The comic strip:** grows to 262 pt. It docks at the top when the spotlight is low, as in step 1, and above the tab bar for a tab, since a strip that tall can't share the bottom with the presets.
- **The decision page is republished** at the same address as version 2, and again waits for the owner's pick.
- **Fixed, the owner:** "the Pomo's top part get's cut". Pomo's celebrating art reaches 26 units above its 512 box (its curl and sparkles), and an inline SVG clips to its box. The sketches' symbols now draw outside it (`overflow="visible"`); the app's own sticker component isn't affected. The page is republished as version 3.

**New expressions and their animations** (the owner's addition) join the asset step (§0, step 4), beside the new poses:
- **For each of the pair, a set of expressions,** proposed for the pose sheet: talking (mouth shapes in step with the babble), happy (an eye smile), excited (sparkling eyes), curious (a head tilt), proud, a wink, surprised.
- **The animations:** a blink every few seconds; the talking mouth while a line writes on; a quick squash and stretch on each change of expression, with the new face crossing in; a soft breath at rest.
- **Under Reduce Motion,** expressions swap with no squash or loop. Like the welcome's, they're character animation, so they belong in DESIGN.md's "Tutorial (first run)" row, the owner's exception.
- **The pose sheet** shows the expressions and their motion for the owner's approval before they're built.

### 3.5 The pick and the direction contract

**The owner, 2026-11-01: "The bookmark ribbon",** the dealt lead, after round 2 and the curl fix. It was reported to the roll as `concept-seed --kind assigned` ("choice recorded").

**The sketches are kept** in `art/review/`:
- `d5-tutorial-ribbon.html`, the locked composition;
- `d5-tutorial-washi-not-chosen.html`;
- `d5-tutorial-comic-not-chosen.html`.

**The direction contract** is written into the brief (`.impeccable/surfaces/app-tutorial-tsx.md`) through `impeccable surface-brief write`, under `## Direction contract`.
- **It has all six blocks:** THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM and FINISH, with the seed reference `seed:48a753d9bc4e6da9`.
- **A new section, "Decided since the brief",** gathers what §3.2–3.4 settled, so the builder invents none of it:
  - the spike;
  - every HIG finding's outcome;
  - the pair's size;
  - the new expressions and their motion.
- **The contract waits for the owner's approval.**

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
