---
id: IMPL-2026-11-01-phase1-d5-tutorial
title: "Phase 1 D5: the general tutorial, Pomo & Doro show you around"
status: in-progress
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-stage-d, IMPL-2026-10-30-phase1-d1-classic, IMPL-2026-10-30-phase1-d4-sounds, IMPL-2026-11-01-phase1-d4-wiring, DESIGN-WORKFLOW, SRS]
---

# 2026-11-01 — Phase 1 D5: the general tutorial

**Status:** In progress. The brief is confirmed, the direction contract approved, the assets are on this branch, the tutorial is built (§3.8) and its four reviews pass (§3.9) `break-ui`'s breaks are fixed (§3.10), and polish and the copy review are done (§3.11), all 2026-11-01. The device check passed on build 58, sounds included (§3.12). FINISH is next, in [Stage E](2026-11-01-phase1-stage-e.md) S2.
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
| 3. Composition round, then the direction contract | **The bookmark ribbon**, the owner's pick, 2026-11-01, after two rounds (§3.4). **The contract is approved** by the owner, 2026-11-01 (§3.5) |
| 4. Assets: the pair's poses **and new expressions with their animations** (VectorCraft) on a pose sheet, their babble (SoundCraft) on a listening page | **Done**, 2026-11-01, in a parallel session; its own [assets record](2026-11-01-phase1-d5-assets.md). Both pages approved by the owner ("Approve, keep nubs"; "version 2 with variation is the way to go"). Fast-forwarded onto this branch on the owner's word (§3.6) |
| 5. Build (`animate-expo`) | **Built**, 2026-11-01, from its plan (§3.7, committed before any code): §3.8. Every guard green, 481 tests; not yet seen on a device |
| 6. Critique, audit, HIG, `review-animations` | **Done**, 2026-11-01, after three passes and three batches (§3.9): critique 32 → **35/40**, audit 15 → **18/20**, HIG Good → **Excellent**, motion not clean → **clean** |
| 7. `break-ui` in Turkish at AX5 | **Done**, 2026-11-01 (§3.10): 3 Broken and 1 Ugly, all fixed with the owner's two choices (a break line; the Turkish rephrased). The worst case is a Jest fixture, `tourWorstCase.test.tsx` |
| 8. Polish, then the copy review | **Done**, 2026-11-01 (§3.11): polish found nothing to change; the copy review passed 76 of 77, with the owner's one change applied |
| 9. Device check | **Passed on build 58**, 2026-11-01, the owner: "All visual tests are passed" and "Yes, sounds passed" (§3.12). Build 57 had stuck on the Stats step, under the ad banner (fixed in `03e86ea`) |
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
| `src/screens/tutorial/tutorials.ts` (new) | The content, keyed by version: six steps, their leads, faces, openings and lines per state; `dueTutorial()` |
| `src/screens/tutorial/tourStore.ts` (new) | The run, the mute, and the additive `tutorial` key (seen version, resume once) |
| `src/screens/tutorial/speech.ts`, `motion.ts`, `placement.ts` (new) | Pure: the write-on and syllables, the pair's motion as worklets, where the dock and ribbon go |
| `src/screens/tutorial/kit.ts` (new) | The tour kit's 44 layers by name, the expression recipes and the hands' pivots |
| `src/screens/tutorial/babble.ts`, `useSpeaking.ts` (new) | The 12 players with the approved variation; the line's clock |
| `src/screens/tutorial/TourCharacter.tsx`, `Ribbon.tsx`, `Bubble.tsx`, `TourLayer.tsx`, `ModesBubble.tsx`, `useTour.ts` (new) | The pair, the ribbon, the bubble, the layer with its scrim and VoiceOver openings, the Modes sheet's bubble, the hosts' hooks |
| `src/screens/tutorial/__tests__/` (new: 3 files, 46 tests) | The model against the pose sheet's files, the store and placement, the flow through the real screens |
| `src/screens/TimerScreen.tsx`, `classic/ClassicControls.tsx`, `classic/TodayStickers.tsx` | The gate, the four openings, the lazy layer, Start closing the tour, a preset moving step 1 on, Fly ending it |
| `src/screens/StatsScreen.tsx`, `LoveNotesScreen.tsx` | The week and Add as openings, the lazy layer, a tab's focus moving its lead on |
| `src/components/modes/ModeSheet.tsx` | The Modes step's bubble |
| `src/screens/SettingsScreen.tsx` | "Watch the tutorial again" |
| `src/stores/hydrateStores.ts`, `src/utils/storage.ts` | The tour store hydrates with the rest; the `tutorial` key |
| `src/theme/palette.json`, `palette.ts`, `scripts/design/check-contrast.mjs` | The `scrim` and `scrimStrong` tokens, and `dims`, their checks |
| `src/i18n/en.json`, `tr.json` | `tour.*`: 18 lines and the bubble's words, in both languages |
| `jest.setup.ts`; `contrast.test.ts`, `v131.test.tsx`, `router.test.tsx` | The audio mock gains `setPlaybackRate`; the dims checked; `tutorial` is new since v1.3.1; the router tests mark the tour seen, as they do the welcome |
| Everything in the [assets record](2026-11-01-phase1-d5-assets.md) §2 | Fast-forwarded from `phase1/d5-assets` (§3.6): the tour kit's art and modules, the babble and their build steps. Its own table lists each file |

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
- **Approved by the owner, 2026-11-01:** "Approve the contract".

### 3.6 The assets land on this branch

**The owner, 2026-11-01: "Fast-forward it",** in reply to "Shall I fast-forward phase1/stage-d to the assets branch (8c64c6e)?".

- **The move:** `git merge --ff-only refs/heads/phase1/d5-assets` took `phase1/stage-d` from `2fb8d5a` to `8c64c6e`. The assets branch was cut at `2fb8d5a` and nothing landed here since, so it is a fast-forward: no merge commit, and the twelve commits keep their IDs.
- **What it brings** (the assets record §2 lists each file):
  - the tour kit: 44 VectorCraft layers for the pair (bodies, eyes, mouths, the nub hands), each with its job in `art/jobs/tour.json`, its export in `art/out/illustration/` and its module in `src/components/stickers/art/`;
  - the babble: six syllables each for Pomo and Doro in `src/assets/sounds/babble/`, built by `scripts/sound/`;
  - the review pages `art/review/d5-*`, and the generated backlinks and TRACEABILITY lines.
- **Nothing is wired yet.** Under `src/` the move only adds files (56, all new), and no app file imports them, so the app is unchanged until the build (step 5).
- **The guards here,** where packages are installed (the assets worktree has none, so Jest couldn't run there):

| Guard | Result |
|---|---|
| `npx jest` | 61 suites, 433 tests, all pass (the count before the move: the assets add no tests) |
| `npx tsc --noEmit` | Clean, the 56 modules included |
| `npm run lint` | 0 errors, 29 warnings (unchanged) |
| `node scripts/art/build.mjs --check` | Every export matches a clean rebuild from its steps |
| `node scripts/sound/build.mjs --check` | Every sound matches; each pair's babble: 6 syllables, the sample line at −20 LUFS momentary max, 5.83 LU under the UI sounds |
| `node scripts/design/check-emoji.mjs`, `node scripts/i18n/check-raw-text.mjs` | Clean |
| `node scripts/docs/check-docs.mjs` | 126 docs, 103 requirements, 0 errors |
| `node scripts/react-compiler-report.js` | 81 compiled, 5 skipped (unchanged) |

- **Still open from the assets, by the owner's choice:** the trial of more variation in the babble's pitch (±20 or ±30 cents beside the approved ±10), which they called "experimental" (assets record §3.7). The build uses the approved ±10 cents and ±1.5 dB until they pick.

### 3.7 The build plan (written before any code)

**The owner, 2026-11-01: "Start the build".** `/animate-expo` resolved from this worktree, and impeccable's craft floor was read before the first UI edit. The plan follows the approved contract (`.impeccable/surfaces/app-tutorial-tsx.md`), the HIG dispositions (§3.3) and the assets record's numbers (§3.2–3.4, §4.4). The hand-over notes the assets session named (`d5-assets.md`) aren't on disk; its record carries the same content.

**The gate (`animate-expo` §1–2).** The tour is the rare, first-time tier: shown once, replayed by choice. The purpose is **explanation**, and the pair's entrance is its one **delight**. Tab changes stay the bar's own, with no animation.

**Files.** New, under `src/screens/tutorial/`:

| File | What |
|---|---|
| `tutorials.ts` | The content, a list keyed by version (the owner's per-version rule): each step's beats, speaker, face, target and line key per state. `dueTutorial()` picks the one to show. v1.4 has only the general tutorial, for everyone |
| `tourStore.ts` | The tour's state: the active step and beat, first run or replay, the mute. It persists one additive key, `tutorial`: the version last seen, and the step to resume at, once (T-9) |
| `speech.ts` | Pure. A line's write-on and syllable schedule (assets record §3.4) |
| `motion.ts` | Pure worklets. The squash and stretch, the faces crossing, the breath, the wave and the point, from `expressions.json`'s numbers (assets record §4.4) |
| `placement.ts` | Pure. Where the pair and bubble stand, and the ribbon's curve, from the opening and the screen |
| `babble.ts` | The 12 syllable players, created when the tour starts and released when it ends, with the approved variation |
| `TourCharacter.tsx` | Pomo or Doro from the tour kit's layers: the expression, blink, talking mouth, breath, squash, the hand |
| `Ribbon.tsx` | The bookmark ribbon: a band in `primary` with a `ringFocus` edge and a swallowtail tip, its curve animated on the UI thread |
| `Bubble.tsx` | The paper bubble: the speaker's name, the line writing on, the mute, Skip tour and Next |
| `TourLayer.tsx` | One screen's layer: the scrim with its opening, the ribbon, the bubble and the pair; VoiceOver's openings; the AX panel. Lazy-loaded |
| `useTour.ts` | The hosts' hooks: the gate after the welcome, which beat a screen shows, and a tab's focus moving a tab step on |
| `ModesBubble.tsx` | The short bubble the Modes sheet shows at the Modes step (T-4) |

Changed:

| File | Change |
|---|---|
| `src/theme/palette.json` | New roles `scrim` and `scrimStrong` (raised under Reduce Transparency and Increase Contrast), in both themes, and their contrast pairs |
| `src/utils/storage.ts` | One additive key, `tutorial`. No existing key or the B2 migration changes |
| `TimerScreen.tsx`, `ClassicControls.tsx`, `TodayStickers.tsx` | The gate, refs on the four openings (the presets, today's row, Modes, Start focus), the layer, and the tour closing before a session starts |
| `StatsScreen.tsx`, `LoveNotesScreen.tsx` | Refs on their openings (the week, Add) and the layer |
| `ModeSheet.tsx` | The Modes step's bubble; closing the sheet moves the tour on |
| `SettingsScreen.tsx` | "Watch the tutorial again" beside "Watch the welcome again" |
| `en.json`, `tr.json` | Every line, under `tour.*`. A line that names a control interpolates the control's own key |
| `jest.setup.ts` | The `expo-audio` mock gains `setPlaybackRate` |

**The steps.** Six (T-11). Odd steps are Pomo's, even ones Doro's. A tab step has two beats: a lead on the screen before, with the ribbon at the tab, then the step itself once the tab is in front.

| # | Lead | The step | Opening | Moves on |
|---|---|---|---|---|
| 1 | | Timer: hello, then pick a length | The presets and their key | A preset pressed, or Next |
| 2 | | Timer: a sticker per focus, filling today's goal | Today's row | Next |
| 3 | | Timer: the Modes button | Modes | The sheet closed, or Next |
| 4 | Timer: Stats is below | Stats: the week as postcards, the goal and streak | The week | The tab pressed, or Next; then Next |
| 5 | Stats: Notes is below | Notes: a love note after each focus; write your own | Add | The same |
| 6 | Notes: back to the Timer | Timer: the invitation | Start focus | Start focus, or Not now |

**The lines per state (T-6).** Step 1 for a new install, an updater, and a replay. Step 2 with the goal on or off. Step 3 with or without Fly. Step 4 for an empty week. Step 6 with "your first" only for a new install.

**The layer.**
- **Where it lives (the spike):** inside Timer, Stats and Notes, last in the screen's root view, like `StatusBarScrim`. It shows only when the active beat belongs to that screen, the screen is in front, and Classic is up (never over Fly).
- **The scrim:** four touch-blocking panels around the opening, with nothing over the hole, and its rounded corners drawn by one untouchable Svg. Between steps the opening glides on the sheet curve; under Reduce Motion it crossfades: a cover closes the old opening and another opens the new one.
- **The ribbon:** hangs from the top edge, the band as two strokes (a `ringFocus` edge under `primary`) and the swallowtail as one filled path. Its curve's four points interpolate between steps on the UI thread. It drops in at the start, and fades under Reduce Motion.
- **The pair:** the speaker in a 190 pt box, the listener scaled to 140 pt, both about their feet. The listener holds one pose, watching the opening, and only blinks (T-10). The tour kit stacks body-cut (with the lift), hand, body-fill, eyes, mouth.
- **The bubble:** `paper`, radius 22, the `edge` stroke, no shadow, 17 pt in the system face, with a tail to the speaker. One element for VoiceOver, "Pomo: …", then Next and Skip tour.
- **Placement:** the dock (the bubble over the pair) takes whichever side of the opening fits it best: above or below on a phone in portrait, left or right in landscape and on iPad. The pair shrink, never under half size, to fit.
- **Tab steps:** the whole page dims, and the ribbon drapes to just above the tab it names. The bar's own position decides top or bottom (iPadOS puts it at the top), and a tab's x is an even share of the bar, to be checked on device.

**Speaking.** A JavaScript clock reveals the line a character at a time, plays each syllable and opens the mouth, all from one schedule. Only the bubble's line re-renders, about 22 times a second; every transform stays on the UI thread. A tap finishes the line.
- **With VoiceOver on:** the whole line at once, no babble, and focus moves to the bubble at each beat.
- **Under Reduce Motion:** the line still writes on, but the mouth stays still, faces swap with no squash, breath, blink or gesture, and the bubble fades in.

**The babble.** Settings › Sound, the silent switch (D4's ambient session) and the tour's mute all silence it.
- **The variation:** a rate of 2^(c/1200), c uniform in ±10 cents, with pitch correction off, and a gain uniform in ±1.5 dB.
- **The gain's base:** expo-audio's volume stops at 1.0, so the gain's base is −1.5 dB, letting +1.5 dB reach unity. The voices then sit 1.5 dB under the measured −20 LUFS on average, about 7.3 LU under the UI sounds. It is a device-check item.

**The scrim's numbers** (contrast.ts, the contract's 45 %; `scrimStrong` at 60 %):

| | Strawberry Milk | Midnight Plum |
|---|---|---|
| The lit page against the dimmed page | 2.49 | 1.08 |
| A lit Start pill against a dimmed one (`primary`) | 2.13 (60 %: 2.87) | 2.82 (60 %: 4.24) |
| The bubble's paper against the dimmed page | 2.62 | 1.21 |

- **In Midnight Plum the empty page hardly darkens.** The dim shows on the content: the pink pill falls back 2.82:1, and text 3.13:1.
- **The bubble keeps the theme's own relation.** Paper fields already sit about 1.15:1 from that page, separated by tone and edge.
- **`check:contrast` gates the pill pair:** `scrim` on `primary` ≥ 2 and `scrimStrong` on `primary` ≥ 2.5.
- **The dark dim is a device-check item.** The 45 % stays as the contract set it.

**Shown and remembered.**
- **The gate:** after the welcome's Start, on a calm Timer (the welcome's own conditions), never when opened from a notification.
- **Replay:** from Settings › About, it starts on the Timer. With a session running or paused, it plays steps 2–5 and ends on "Done" at Notes, leaving the session alone (T-7). Step 1 is skipped there because the presets hide while a session runs.
- **Before a session:** Start focus closes the layer before the session starts, so the first Start's notification prompt lands on the Timer (T-3).
- **Fly:** choosing it in the Modes sheet hides the layer while Fly is up. The tab steps still work, and the invitation is dropped, finishing the tour.
- **On another tab:** the tour waits until its screen is back in front.

**Out of this step:** the reviews (step 6), `break-ui` (7), polish and the copy review (8; the tour's lines join a copy proof after v4), the device check (9), and DESIGN.md's row at FINISH.

### 3.8 The build

**Built as planned (§3.7), with seven changes found while building:**
- **Choosing Fly mid-tour ends the tour.** The plan kept the tab steps working under Fly, but a tour that can't show its bubble on the Timer leaves the person guessing. The tour finishes as if skipped, and Settings replays it.
- **A replay from Fly switches to Classic first.** It's the Modes sheet's own switch, so Fly's slot pauses as it does there.
- **The scrim's checks are their own list, `dims`.** The contrast test holds every WCAG pair to 4.5 or 3, and a dim is a separation, not a text floor. So `palette.json` gains `dims` beside `pairs`, `check:contrast` gates both, and the test checks dims on their own.
- **The pair and the bubble wait for the opening.** Before the control is measured they'd stand at a guessed place, then slide. They arrive once the opening is found; a control that can't be measured gets its beat after 600 ms, the whole page dimmed. Once arrived, they glide from beat to beat.
- **The first line waits for VoiceOver's answer.** The screen-reader check is asynchronous, so the line starts only once it's known, and a VoiceOver user never hears a syllable.
- **The entrance is the run's, once.** A layer mounts afresh on every tab step, and when a sheet over it closes (the Modes sheet, the note editor): the screen loses focus under a sheet. Each would have replayed the ribbon's drop and the pair's landing, more than the one delight the contract allows. The run now remembers that its entrance has played (`introduced`); a later layer fades in with the ribbon already hanging and the opening already open.
- **The page holds still while the tour is on it.** A drag through the opening moved the control and left the opening behind. The hosts' scroll views turn off dragging while the tour is on their screen (`scrollEnabled`); the tour's own `scrollTo`, which brings an opening clear of the AX panel, still moves the page, and the layer measures again after it.

**How it fits together.**
- **Lazy, as Fly is.** Timer, Stats and Notes import only the store and four small hooks. `TourLayer`, the kit's 44 modules, the voices and the motion load with `lazy()` the first time a tour reaches a screen.
- **The store** hydrates with the other five in `hydrateStores`; its key, `tutorial`, is additive.
- **Each tab screen** mounts the layer last in its root view, while the active beat is its own, it's in front, and (on the Timer) Classic is up. Focus moving to a tab moves a lead on (`useTourReach`); Next on a lead calls `router.navigate` to the tab, so both paths end the same way.
- **The Timer's openings** are refs on the presets row, today's row, the Modes button and the primary pill. `ClassicControls` and `TodayStickers` take them as props, wrapped in plain Views where the control is a `PressableScale`.
- **Pressing a preset** moves step 1 on 600 ms later, so the choice is seen first. Pressing Start focus calls `finish()` before the session starts (T-3).
- **The Modes sheet** shows `ModesBubble` while the tour is at the Modes step; its unmount, however the sheet closes, moves the tour on to Stats.
- **Settings › About** gains "Watch the tutorial again" under "Watch the welcome again".

**The layer, as built.**
- **The scrim:** four touch-blocking Views around the hole and one untouchable Svg for the rounded corners. Their frames animate on the UI thread: they're childless and absolutely placed, the one exception animate-expo allows. Reduce Motion crossfades through a cover; Reduce Transparency and Increase Contrast switch to `scrimStrong`.
- **The ribbon:** three animated Svg paths, the band's two strokes and the swallowtail. Their `d` is computed in a worklet from where the curve was, where it's going and how far along. The swallowtail's points end at the tip, and the band stops under it.
- **The pair:** each character is one 190 pt box scaled about its feet. Its layers stack body-cut (with the lift), hand, body-fill, then two face slots crossing on a change. The talking mouths and the blink are opacity on shared values. The breath, squash, hold, arrival and position are one transform.
- **The bubble:** the line's rest is laid out in a clear colour, so the bubble never grows as it writes. VoiceOver reads the line, then Next, then Skip tour, then the mute: the tree runs in that order and `row-reverse` draws it the other way round.
- **The voices:** the line's clock picks each syllable, so the mouth moves whether or not it sounds. The run ending frees the 12 players, wherever it ended.

**Two slips in the assets record, found by the tests** (`tutorialModel.test.ts` runs the pose sheet's own `tour-motion.js` in a sandbox against the app's schedule for every tour line, both languages):
- **The sample lines are a character shorter than §4.4 says.** Pomo's has 61 characters and writes on in 3,195 ms; Doro's has 69 and takes 3,405 ms. The record says 62 and 3.24 s, 70 and 3.45 s. The rules and the page agree with the app exactly; only the record's count is out. Nothing changes.
- **The faces cross at about 0.12 opacity each, not 0.5.** §4.4's "both are 0.5 at 77 ms" is a slip: S(a) + S(1 − a) = 1 places the crossing at 77 ms, but there both are S(21/98) ≈ 0.118. For about 40 ms around it the face is faint. That's the motion the owner approved on the pose sheet, so it stays. It's named for the device check and the finish review (§4).

**What the tests can't see.** Jest's native views never report a frame, so no opening is measured there: the openings, the ribbon's curve and the dock's placement are checked as pure functions (`placement.ts`) and on the device. The VoiceOver opening is checked as its own component.

**Measured here, 2026-11-01:**

| Guard | Result |
|---|---|
| `npx jest` | 64 suites, 481 tests (+3 suites, +48 tests), all pass |
| `npx tsc --noEmit` | Clean |
| `npm run lint` | 0 errors, 29 warnings (unchanged) |
| `node scripts/react-compiler-report.js` | 98 compiled, 5 skipped (unchanged); no file's worklet count changes |
| `npx reassure --branch` | Timer 13, Stats 1, Settings 1, Notes 1, leaf 12, settings-only 1 (unchanged) |
| `npm run check:contrast` | 26 WCAG pairs and 2 dims in each theme: all 56 checks pass |
| `node scripts/i18n/check-raw-text.mjs`, `node scripts/design/check-emoji.mjs` | Clean |
| `node scripts/art/build.mjs --check`, `node scripts/sound/build.mjs --check` | Every export and sound rebuilds byte for byte |

**Not measured yet:** the bundle. The kit's modules and the voices are now in the bundle (their evaluation is deferred), so E3's bytecode budget, already 7.34 % over, grows. It's measured at the next build.

**Owed to the device check** (step 9):
- the openings on every step, in both layouts, portrait and landscape, and on an iPad, whose tab bar may sit at the top;
- the ribbon's tab x against the real bar;
- the dark theme's dim (§3.7: the empty page darkens by 1.08:1);
- the faint face at the crossing;
- the babble's level against the UI sounds;
- VoiceOver's order and the acting openings;
- the AX panel.

### 3.9 The four reviews, and the fix batch (step 6)

**The owner, 2026-11-01: "Start the reviews".**

**How they ran.** As D2's did (D2 record §3.12):
- **The critique and the native audit** ran in this context, from source, against the direction contract. On a native platform the critique is Impeccable's design review alone, with no degraded banner. There's no Simulator here.
- **`/apple-design` (a code audit) and `review-animations`** each ran in a sub-agent briefed with the code, the contract and the owner's settled decisions, so neither read was anchored on the critique.
- **`review-animations`** is installed in the worktree but isn't offered as a skill, so its sub-agent applied `SKILL.md` and `STANDARDS.md` by hand, as D1's did.
- **The gates are D2's:** the audit ≥ 16/20 (NFR-UX-003), the critique ≥ 80 %, HIG with no Critical, the motion clean.

**First pass.** The critique's snapshot is `.impeccable/critique/2026-11-01T13-49-32Z__app-tutorial-tsx.md`.

| Review | Result | Gate |
|---|---|---|
| Critique | 32/40 (80 %), Good | Met |
| Native audit (A, P, T, C, Ad) | **15/20** (3, 3, 3, 4, **2**) | **Not met**: the small-phone overflow (H-1) |
| `/apple-design` | Good: no Critical, 2 High, 2 Medium, 4 Low; T-1 to T-11 built, except Voice Control under T-1 | Met |
| `review-animations` | **Not clean: block**, 15 findings | **Not met** |

**The owner's answers, 2026-11-01** (each the recommended option):
- **The opening:** "Outline it, both themes".
- **Next:** "Quieter Next".
- **Doro's name:** "Matcha for Doro".
- **The scope:** "Everything".

**The fix batch: every finding, dispositioned.** All are accepted unless the row says otherwise.

| # | Finding (source) | The fix |
|---|---|---|
| F-1 | The opening barely reads in Midnight Plum: about 1.1–1.4:1 around dark controls (critique P1) | A 2 pt `ringFocus` line traced on the opening's edge, in both themes (the owner) |
| F-2 | Next, a filled strawberry pill, outranks the lit control (critique P2) | `primarySoft` fill with a `primaryInk` label (the owner) |
| F-3 | Both speakers' names are strawberry (critique P3) | Doro's in `successInk` (the owner) |
| H-1 | On an SE with a long line the bubble's top is 3–48 pt above the screen (HIG High; reproduced) | `place()` flags an overflow when even half size can't fit; the layer then switches to the bottom panel for good. Above and below, the bubble's top is clamped to the safe area. The test asserts it |
| H-2 | Voice Control can't reach a lit control: the acting opening exists only under VoiceOver (HIG High) | The opening element is always there, with `pointerEvents="none"`, so a finger still reaches the real control |
| H-3 | VoiceOver's swipe on the presets moves the tour on before the value is read (HIG Medium) | Adjusting from VoiceOver never moves the step on; Next does |
| H-4 | The Modes sheet's line mentions Fly (which now ends the tour) and says "Close it", with no close button (HIG Medium) | One line: "Pick Ring or Facing pages here, then swipe down to go on." |
| H-5 | Skip tour's and the mute's tap areas overlap (HIG Low) | 16 pt between them, so their 8 pt slops meet but don't overlap |
| H-6 | Under Reduce Motion the bubble and pair jump while the opening crossfades (HIG Low; motion 14) | They dip out and in on the opening's 150 + 150 ms, moving while hidden |
| H-7 | "Watch the tutorial again" against "Skip tour"; "Press" against "Tap" (HIG Low) | "Watch the tour again"; "Tap" throughout ("dokun" in Turkish) |
| H-8 | A replay while a run waits on another tab shows nothing (HIG Low) | The waiting run finishes first, then the replay starts |
| C-1 | VoiceOver can't explore today's row or the week at their steps (critique P2) | Their openings are elements too, read-only, with the region's own words (today's summary; Stats' summary line) |
| C-2 | A preset press moves on 600 ms after the first press, cutting a comparison short (critique P2) | The wait restarts with each press, at 900 ms |
| C-3 | Skip tour alone has no press haptic (critique minor) | The default haptic |
| M-1 | Pomo's hello wave never shows: at mount the hand is drawn at zero size, Reduce Motion too (motion) | The hand grows, stays or goes back; the first wave starts after the landing |
| M-2 | The voice starts about 10 characters before the bubble is seen (motion) | The line holds until the bubble has faded in |
| M-3 | The dim's four panels animate their frames (motion, Std 7) | Solid panels placed and sized by translate and scale; the cover mounts only under Reduce Motion |
| M-4 | Two full-screen Svgs repaint every frame during a move (motion, Std 7) | The corners become four static quarter masks moved by transforms. The ribbon keeps its Svg: its cost is measured on the device first |
| M-5 | Retargets read animating shared values from JavaScript, a synchronous UI round trip (motion) | Each retarget runs in one UI-thread worklet |
| M-6 | For the first frames of a beat the pair and bubble head for the previous opening (motion, Std 6) | The opening is keyed to its beat, and everything holds its place until the new one is measured (600 ms fallback) |
| M-7 | A change inside 280 ms snaps the size, face and tilt (motion, Std 6) | A new pose waits until the current change settles |
| M-8 | A look flip that changes no layer still squashes; the listener squashes when its eyes turn (motion) | Only a changed recipe animates; a change of eyes alone swaps them quietly |
| M-9 | A lead closes the hole towards the screen's centre (motion, Std 5) | It closes about its own centre |
| M-10 | The bubble's tail jumps while the dock glides (motion) | The tail glides with the dock |
| M-11 | The role's scale runs 280 ms on another curve than the 420 ms position (motion) | The sheet curve and 420 ms, as the rest |
| M-12 | Proud is 2.9 % narrower than on the pose sheet; a blink can run into a change (motion) | The width ignores the held stretch, as the sheet does; the blink shows only between changes |
| M-13 | Fades on the default curve; on later layers two fades multiply (motion, Std 3) | The strong ease-out; a later layer's pair appear at once inside the layer's own fade |
| M-15 | Turning Reduce Motion on mid-tour replays the last animation (motion, Std 8) | The effects read Reduce Motion through a ref |
| — | A wrong tab leaves that screen bare (critique, a persona) | **Kept as decided** (§3.7): the tour waits, and the bar's own tab is the way back |
| — | The dim covers the status bar band (critique, minor) | **Kept**: the clock stays the system's, on the dimmed band |

The fixes follow this record. The four reviews run again once they're in.

**The first batch** is `576c7b2`: every row above, with tests for the wave, the outline, the quieter Next, Doro's colour, the panel fallback and the acting openings.

**Second pass.** The two sub-agents re-checked their own findings against `576c7b2`; the critique and the audit were re-scored here.
- **`/apple-design`: Excellent.** Seven of eight fixed; H-1 partly fixed. Three new items:
  - **Medium:** the fallback panel can now appear below font scale 1.6, where the hosts gave no room to scroll the opening clear of it.
  - **Low:** "swipe down" in the Modes sheet's line doesn't work for VoiceOver, and the sheet had no button.
  - **Low:** the speakers' names borrowed `primaryInk` (links) and `successInk` (goals reached).
- **The owner's three answers pass:**
  - the outline at 3.84 (light) and 8.06 (dark) against the lit side;
  - Next's label at 5.10 and 6.22;
  - Doro's name at 5.70 and 8.75.
- **`review-animations`: not clean, narrowly.** Nine rows fixed. Five were partly fixed:
  - **6:** a lead's new bubble height arrived after its glide began, and the line wrote on under the old name while held.
  - **8:** a "glance" could swallow a real change of pose.
  - **13:** later layers' pair popped in.
  - **14:** under Reduce Motion, the role scale and the tail moved before the dip.
  - **New with H-1:** the pair unmounted with no exit when the panel took over.

**The second batch** (`a2e1553`):
- a beat holds, with its line and name, until both its opening and its bubble's height are known (the bubble's within 120 ms);
- a glance needs the same pose;
- later layers' pair fade in over 150 ms;
- under Reduce Motion the role scale and the tail change while dipped;
- the pair fade out to the panel;
- the scroll room whenever the tour is on a screen;
- a Continue button in the Modes sheet's bubble ("…then tap Continue.");
- `pomoInk` and `doroInk` as roles of their own, aliasing the same values, with their contrast pairs.

**Third pass.**
- **`/apple-design`: Excellent, all three fixed.** One Low device-check note: removing `contentInset` doesn't move the offset, so a page the tour scrolled could stay up over blank space.
- **`review-animations`: clean, approve.** It noted three edge cases below a finding. One of them: under VoiceOver, with an opening that can't be measured, a line could be read under the last speaker's name.

**The last batch:**
- **`useTourScroll`,** one hook for the three hosts, scrolls the page back by what the tour moved it when the tour leaves.
- **VoiceOver's focus** moves only once a beat has settled.
- **A held line** shows nothing.

**Where it stands.** The second critique's snapshot is `.impeccable/critique/2026-11-01T14-25-35Z__app-tutorial-tsx.md`; the trend is 32 → 35.

| Review | First pass | Final | Gate |
|---|---|---|---|
| Critique | 32/40 | **35/40 (88 %)** | ≥ 80 %: met |
| Native audit (A, P, T, C, Ad) | 15/20 | **18/20** (4, 3, 4, 4, 3) | ≥ 16: met |
| `/apple-design` | Good, 2 High | **Excellent**, nothing above Low | No Critical: met |
| `review-animations` | Not clean, block | **Clean, approve** | Clean: met |

**Kept, with reasons:**
- No way back to a skipped line (critique P2): a fourth action in the bubble would cost more than it gives; the replay covers it.
- The wrong tab stays silent (§3.7).
- The dim covers the status bar band.

**Owed to the device check,** besides §3.8's list:
- **Cost and seams:**
  - what the ribbon's full-screen Svg costs per frame;
  - hairline seams where the transformed panels meet the corner masks mid-glide;
  - the corner masks' edge when scaled down.
- **Timing:** how the 120 ms hold feels.
- **Assistive and large-text checks:**
  - Voice Control's "Tap Start focus" through the opening that takes no touch;
  - the fallback panel on an SE at xxxLarge;
  - the page scrolling back.
- **Placement:** the outline in landscape and on iPad.

**Measured after the last batch, 2026-11-01:**
- `npx jest`: 64 suites, 484 tests.
- `npx tsc --noEmit`: clean.
- `npm run lint`: 0 errors, 29 warnings (unchanged).
- `node scripts/react-compiler-report.js`: 100 compiled, 5 skipped; no file's worklet count changes.
- `npx reassure --branch`: Timer 13, Stats 1, Settings 1, Notes 1, leaf 12, settings-only 1 (unchanged).
- `npm run check:contrast`: 60 checks in two themes, all pass.
- The raw-text and emoji checks: clean.

### 3.10 `break-ui` in Turkish at AX5 (step 7)

**The owner, 2026-11-01: "Run the stress test".**

**How it ran.** As D2's did (D2 record §3.13):
- **No in-app toggle.** A worst-case toggle in a TestFlight build would ship to the App Store, which `break-ui` forbids (rule 4).
- **The worst case is a Jest regression fixture,** `tourWorstCase.test.tsx`: the locale mocked to `tr-TR`, AX5 (font scale 3.1) on an iPhone SE-sized window (375 × 667), and the states below. It pins what holds; each break gets its assertion when it's fixed.
- **Logic findings are verified by rendering.**
- **Layout findings are inferred** from the styles and from `placement.ts`, which is pure, with SF Pro's advance at about 0.55 em a character. The TestFlight device check confirms them.

**The limits.**
- A line: 90 characters in English, 110 in Turkish, with names filled in (the model test enforces both).
- A control's name: its own key, so a lengthened label flows into the lines.
- The bubble: 360 pt wide at most; at AX sizes, a full-width panel whose line scrolls in 30 % of the screen's height.
- The text size is never capped (T-2).

**The worst case.**
- **Text:** every line-per-state variant (new install, updater, replay, goal off, empty week), both speakers, the longest Turkish lines, the tabs' and controls' Turkish names ("Karşılıklı sayfalar", "Zamanlayıcı", "Odağı başlat").
- **States:** a replay mid-session, and the invitation with a break up next.
- **Screens:** an SE at xxxLarge (1.35) and at AX5, an SE in landscape, an iPad with its tab bar at the top, and a control that can't be measured (in Jest, every one).

**What broke** (first pass, `ead9316`):

| # | Severity | Worst case | What happens | Verified or inferred | Fix |
|---|---|---|---|---|---|
| 1 | Broken | The invitation with a break up next (an updater whose v1.3.1 session stopped after a focus, or a replay) | The line says "Hazır olunca Odağı başlat düğmesine dokun", but the lit button reads "Molayı başlat"; tapping it ends the tour and starts a break | Verified (rendered) | A decision (below): a break line naming `controls.startBreak`, or no invitation when a break is next (`tutorials.ts:149-155`) |
| 2 | Broken on a 375 pt iPhone | The invitation's row at AX5 in Turkish | "Şimdi değil" at 46.5 pt is about 297 pt; with the 16 pt gap and the 44 pt mute that's 357 pt against the panel's 319 pt column. The group can't wrap, so the mute is pushed past the panel's edge. "Turu atla" is about 306 pt, a hair inside | Inferred | Cap the bubble's and the Modes bubble's action labels at 1.6×, as every other button in the app is (`ClassicControls`), and let the group wrap (`Bubble.tsx:80-96`, `ModesBubble.tsx`) |
| 3 | Broken | AX sizes in landscape on an SE (667 × 375) | The bottom panel is about 320 pt: the name row, a line at 30 % of the height and two action rows. The room above the landscape tab bar is about 310 pt. The panel's top runs off the screen, and no opening can show above it | Inferred | In compact height, the panel takes the half of the screen away from the opening, the contract's own landscape rule, with its line scrolling (`placement.ts` panel branch, `TourLayer.tsx`) |
| 4 | Ugly | Turkish words wider than the AX5 column (about 11 letters at 52.7 pt in 319 pt) | "odaklanacağını" (14 letters; the updater and replay hellos), "odaklanırken" (12; Modes) and "Odaklandığın" (12; the empty week) break mid-word. At risk at 11: "değiştirmek", "açabilirsin", "kartpostala", and the tab's own "Zamanlayıcı" | Inferred | A decision (below): rephrase the tour's lines to words of 10 letters or fewer |

**Decisions for the owner.**
- **#1, the invitation before a break:**
  - **Recommended:** a break line, "A break is next. Tap Start break when you're ready." It names the real button and keeps the tour's last tap the app's own.
  - **The alternative:** end on Done when a break is next, with no invitation.
- **#4, long Turkish words:**
  - **Recommended:** rephrase. These are the tour's own lines, and the copy review sees them in step 8. The tab's own "Zamanlayıcı" stays.
  - **The alternative:** accept, as D2 did for Settings' rows ("Güncellemeleri", "Geliştiricinin").

**The owner, 2026-11-01:** "Okay let's fix all of them. We will do your both recommendations for #1 and #4".

**The fixes** (every break now has its assertion in `tourWorstCase.test.tsx`, the model test or the placement test):

| # | Fixed by |
|---|---|
| 1 | **A break line.** The invitation names the button that's lit. With a break up next (`breakNext`, the session's phase), it says "A break is next. Tap Start break when you're ready." / "Sırada bir mola var. Hazır olunca Molayı başlat düğmesine dokun." (`tour.invite.break`, naming `controls.startBreak`). Rendered and asserted |
| 2 | **The buttons stop growing at 1.6×,** as every other button in the app does (`BUTTON_MAX_SCALE`: Next, Skip tour, Not now, Continue), and the group wraps. "Şimdi değil" and the mute now come to about 221 pt in the 319 pt column. The line is still never capped (T-2) |
| 3 | **In a compact height** (under 500 pt, Classic's rule), the AX panel takes the half away from the opening (`panelFrame`). Everywhere, the panel is never taller than the screen between its insets, with the line shrinking and scrolling inside it. A side panel needs no scroll for its opening |
| 4 | **The Turkish rephrased,** no word past 10 letters. The updater's hello says "Önce odak süreni seç.", the replay's "Odak süreni buradan seçersin." Modes says "Düzen seçmek ya da odak sırasında haritada uçmak için…", the week without a goal "Günlük hedefi aşağıdan açarsın.", the empty week "Odak yaptığın her gün burada bir kartpostal olur…" (the owner later chose "Odaklandığın" in the copy review, §3.11). The Timer tab's own "Zamanlayıcı" stays. The model test now holds every Turkish line to 10 letters a word. The new and changed lines join the copy review (step 8) |

**Measured after the fixes, 2026-11-01:**
- `npx jest`: 65 suites, 493 tests.
- `npx tsc --noEmit`: clean.
- `npm run lint`: 0 errors, 29 warnings (unchanged).
- `node scripts/react-compiler-report.js`: 100 compiled, 5 skipped.
- Reassure: unchanged.
- `check:contrast`: 60 checks, all pass.
- The raw-text and emoji checks: clean.
- The layout ones are still for the device check.

**What held up:**
- **Every line fits its budget** in both languages, with the controls' Turkish names filled in.
- **AX5 on an SE:**
  - the bubble is the panel and the pair a badge;
  - the line never caps and scrolls;
  - "İleri", "Turu atla" and the mute are all there.
- **The states:**
  - an updater gets "Yeniden merhaba! …";
  - with the goal off, the today line drops the goal;
  - an empty week says so;
  - a replay mid-session starts at today's row and ends on "Bitti" at Notes;
  - the Modes sheet says its Turkish line, with "Devam".
- **Small phones:** at xxxLarge a dock that can't fit switches to the panel, and the bubble never goes above the safe area (§3.9).
- **A control that can't be measured** still gets its beat after 600 ms, the whole page dimmed.
- **Turkish letters** (ç, ğ, ı, İ, ö, ş, ü) count as letters for the syllables, as on the pose sheet.
- **The opening reads in Midnight Plum:** the outline is 8.06:1 against the dim.

### 3.11 Polish and the copy review (step 8)

**The owner, 2026-11-01: "Let's continue on step 8".**

**Polish** (`/impeccable polish`, from source; there's no Simulator here). The pass ran the playbook's checks:
- **The system:** DESIGN.md's type roles, the tokens, neighbouring flows, and the states the tour can meet.
- **The critique's latest snapshot:** its two Priority Issues are the ones kept by decision (§3.9).

Found consistent, with nothing to change:
- **Type:**
  - the line is Body (17 pt, 23 pt line);
  - Next and Continue are the quiet pill's Button (16 pt semibold);
  - Skip tour is a Label (15 pt semibold);
  - the names are Captions (13 pt semibold).
  - The buttons stop at 1.6× like the app's others; the line never does.
- **Colour:** every colour is a token in both themes, checked by `check:contrast`:
  - the dim (`scrim`, `scrimStrong`) and the opening's outline (`ringFocus`);
  - Next (`primarySoft` with `primaryInk`);
  - the names (`pomoInk`, `doroInk`).
- **Copy:** "tour" and "Tap" throughout, in sentence case like the rest of the app. Each control is named by its own key.
- **States:**
  - the lazy layer shows nothing until loaded;
  - a voice that can't play leaves the tour silent;
  - a control that can't be measured gets its beat with the page dimmed;
  - the empty week, the goal off, a break next and a replay mid-session each have their line.
- **Code:** no dead code. Every export in `src/screens/tutorial/` is used, and lint reports nothing there.

**The critique snapshot is closed.** The playbook would have left it open, since its Priority Issues were kept rather than cleared. But the snapshot's target, `app/tutorial.tsx`, the brief's first route name, doesn't exist: the tour lives in `src/screens/tutorial/` (§3.2). The `critique-storage latest` helper reads a missing file as a changed one and closes the backlog, keeping its trend (32 → 35). Both kept items stay recorded in §3.9.

**The copy review: copy proof v5.**
- **The page:** `node scripts/design/copy-proof/build.mjs` gained a section for the tour, after the welcome (D5, `tour.*`). The page's intro now names both sets awaiting marks.
- **Published** to the same private artifact, so every mark is kept: https://claude.ai/artifact/TmachCPtjwYoFfYpPbVuvp (version 5).
- **It holds 307 items:** 265 strings and 21 default-note pairs.
- **Still to review:** D3's 46 strings (unmarked since v4) and the tour's 30 strings, Pomo & Doro's lines with the bubble's words and the replay row.
- **No marks since v4:** the `verdicts` db had none dated after 2026-11-01T11:15Z.
- **The owner's marks, read back 2026-11-01:** 77 marks dated after v4.
  - **76 "Looks right":** all of D3's 46 and 29 of the tour's 30, plus a re-mark of `stats.best`.
  - **One change:** `tour.stats.empty`, back to "Odaklandığın her gün burada bir kartpostal olur, bugünkü en önde durur."
- **The rule:** "Odaklandığın" is 12 letters, against §3.10's 10-letter rule, so it breaks mid-word at AX5 on a 375 pt iPhone.
  - Asked, the owner chose it: "Use mine".
  - It is the rule's second exception, after the tab's "Zamanlayıcı", and the model test names it.
  - Two Settings words were accepted the same way in D2.
- **Applied,** and the proof republished at the same link (version 6): the page shows the current text. **The copy review is complete.**

### 3.12 Build 57 (step 9's build)

**The owner, 2026-11-01: "Yes, build 57"**, in reply to the build ask, which named the steps:
- pushing `phase1/stage-d` by commit `38b9f51`;
- tagging and pushing `v1.4.0-tf.57`;
- the EAS build with TestFlight submission.

**Before the build,** every guard ran green at `38b9f51`:
- `npx jest`: 65 suites, 493 tests;
- lint (0 errors, 29 warnings), `tsc`, and the React Compiler report (100 compiled, 5 skipped);
- the raw-text and emoji checks, and `check:contrast`;
- the art and sound rebuilds, the asset budgets (133 assets) and the docs check.

**The build:**
- **The push:** `git push origin 38b9f51:refs/heads/phase1/stage-d` (`36319de..38b9f51`).
- **EAS production build** `3fabdef6-6810-4868-808f-4c1f517cb73d`, v1.4.0, iOS build 57, from `38b9f51`, with submission `da7cb4ee-10a2-49b9-b144-27a94454cc86` attached.
- **Finished** 2026-11-01T18:46:29Z, about seven minutes after it was queued at 18:39:53Z. The submission workflow `submit-ios.yaml` ran `SUCCESS` (run `01a1986f`, 18:46:30–18:46:45Z).
- **The IPA: 21,615,358 B,** +166,797 B (+0.78 %) on build 56 (21,448,561 B): the tour's code, its 44 art modules and its 12 voices.
- **The tag:** annotated `v1.4.0-tf.57` on `38b9f51`, pushed as `refs/tags/v1.4.0-tf.57`.
- **E3's bytecode measurement** is still owed (the pinned `expo export`).

**What the device check covers.** It is one phone session for the tour (step 9) and for the checks earlier steps still owe.

*The tour.* A tester who has seen the welcome gets the tour at the next calm launch after installing, since no tutorial has been seen. Settings › About › "Watch the tour again" replays it.

**Arrival and the steps:**
1. **The entrance.** The ribbon drops, the pair land and Pomo waves. The bubble arrives, the line writes on with the babble, and the presets are lit and outlined. A preset tap moves on a beat after the last tap.
2. **Every opening sits on its control,** in the Ring and in Facing pages:
   - the presets, today's row, Modes and Start focus;
   - the week on Stats, and Add on Notes.
3. **The Modes step.** Tapping Modes opens the sheet with Pomo's bubble and Continue; Continue closes it and goes on to Stats.
4. **The tab steps.** The ribbon's tip stands over the right tab. Tapping the real tab moves on, and so does Next.
5. **The invitation.** There's no Next, and Not now ends the tour. Start focus starts a focus, and the tour is gone before the notification prompt. With a break up next, the line names Start break.
6. **Interruptions.**
   - Skip tour ends the tour mid-way.
   - Killed mid-tour, it resumes at its step on the next launch, once.
   - A replay with a session running starts at today's row and ends on "Bitti" (Done) at Notes.

**Looks and motion:**

7. **Midnight Plum:** the dim, and the outlined opening.
8. **The faces:**
   - the change of face, including the faint moment at the crossing (§4.2);
   - the blink, the breath, and the wave on step 1.
9. **Smoothness:**
   - any stutter as the ribbon drapes from step to step;
   - hairline seams in the dim around the opening;
   - the corner masks' edges;
   - how the brief hold before a new step feels.

**Sound:**

10. **The babble:**
    - its level against the UI sounds;
    - the silent switch, Settings › Sound and the tour's mute each silence it.

**Accessibility and sizes:**

11. **VoiceOver:**
    - each step reads "Pomo: …", then Next, Skip tour and the mute, with no babble;
    - the presets adjust, and Modes and Start focus act from their openings.
12. **Voice Control:** "Tap Start focus" at the invitation.
13. **Reduce Motion:** no squash, breath, blink or talking; the opening crossfades; the bubble and the pair dip out and in.
14. **The largest text size (AX5) in Turkish:**
    - the bottom panel, its line scrolling, and the buttons fitting;
    - in landscape, the panel on the side away from the control;
    - the empty-week line's "Odaklandığın", the accepted mid-word break.
15. **Other screens:**
    - landscape at the default size: the dock on the side away from the control;
    - an iPad, if there is one: the tab bar at the top, and the ribbon's tab under it.

*Owed by earlier steps.*

16. **D3:** every screen in Turkish at the largest text size, nothing clipped. Build 56 passed it only at the default size.
17. **D4:** the three sounds (focus start, break start, completion):
    - the silent switch silences them;
    - music keeps playing under them;
    - the Sound switch silences them.
18. **D1 and D2:** the Ring idle, running and paused, and the Stats captures.

Items 7, 11, 13, 14 and 15 also make up E2's v1.4 checklist (dark mode, the largest text size, Turkish, Reduce Motion, landscape, iPad).

**The device check, first report (the owner, 2026-11-01):** "I got stuck on this part of the tutorial", with a capture of the Stats step at the default text size.
- **What happened, read from the capture and the code:**
  - The step lit the whole week, about 360 pt of a 390 × 844 screen: 207 to 566 pt. That left room for neither the bubble nor the pair, above (k ≈ 0.02) or below (k ≈ 0.24). So the layer fell back to its bottom panel (§3.9, H-1).
  - On Stats the ad banner is laid out after the layer and draws over it. It hid the panel's lower half, Next and Skip tour included, so nothing moved the tour on.
- **The fix (planned here, then built):**
  - **The tour keeps clear of the ad.** Stats passes the banner's height (`bottomReserve`). The layer adds it to the bottom inset for everything it places: the dock, the panel, the ribbon's tip on the tab step, and the measuring limit. The ad is never covered, and the bubble's actions are always above it.
  - **The Stats step lights today's postcard,** not the whole week. "Each day is a postcard, today in front" names it. At about 170 pt it leaves room for the pair to stand above it at full size (k ≈ 1.3 on the same screen), the step's intended look.
- **Built:**
  - `StatsScreen` measures the banner's slot from its `onLayout` (its height plus the 4 pt margin) and passes it to the layer. The layer's `insets.bottom` takes it for everything it places, while the tab bar's position and the tabs' x still read the real insets.
  - The opening is a ref on the today card.
  - **The regression test** replays the capture's numbers. The week overflows; today's postcard takes the pair above it at full size; a panel ends above a 70 pt banner.
  - **Checks:** `npx jest` 65 suites, 494 tests; lint, `tsc`, the raw-text check and Reassure unchanged.
  - **Not yet on a phone:** the fix needs the next build. On build 57 the Stats step can't be passed by touch.

**Build 58,** on the owner's word ("Yes, build 58"), in reply to an ask that named the push, the tag and the TestFlight build:
- **Before it,** every guard ran green at `03e86ea`: 494 tests, lint, `tsc`, the compiler report, the raw-text and emoji checks, contrast, the art and sound rebuilds, the budgets and the docs check.
- **The push:** `git push origin 03e86ea:refs/heads/phase1/stage-d` (`38b9f51..03e86ea`).
- **EAS production build** `0bdc6591-8212-44c3-8798-59ca42ea0c32`, iOS build 58, from `03e86ea`: queued 19:17:05Z, finished 19:24:10Z. Submission `2162c61d-be8b-4f8c-bd85-9a63bb5ca60e`; the `submit-ios.yaml` run `01a19891` succeeded.
- **The IPA:** 21,615,727 B (+369 B on build 57).
- **The tag:** annotated `v1.4.0-tf.58` on `03e86ea`, pushed.
- **The device check** carries on from build 57's list, the Stats step first.

**The device check on build 58: passed** (the owner, 2026-11-01): "wonderful everything is looking just like how i want it. All visual tests are passed."
- **Covered:** the tour end to end, the Stats step with its fix included, and D3's, D1's and D2's visual items (items 1–9, 11–16 and 18 of the list).
- **The sounds, passed** (the owner, 2026-11-01, asked separately because they aren't visual): "Yes, sounds passed". That covers the babble's level, the silent switch, Settings › Sound and the tour's mute (item 10), and D4's three sounds with the silent switch, the music mix and the Sound switch (item 17). **Every item of the list has passed.**

## 4. Mathematical / Statistical Details

### 4.1 Speaking (`speech.ts`; assets record §3.4)

For a line of characters c₀ … c_{n−1} and a speaker with k letters per syllable (Pomo 3, Doro 4):
- **Reveal times.** t₀ = 0, and t_{i+1} = t_i + 45 + p_i ms. The pause p_i is 150 after a comma (`,`, `;`, `:`), 300 after a stop (`.`, `!`, `?`, `…`) that isn't the last character, and 0 otherwise. The line is whole at T = t_n.
- **Syllables.** A letter counter L starts at 0. At each letter (Unicode `\p{L}`, so ç, ğ, ı, İ, ö, ş, ü count), if L mod k = 0 a syllable starts at t_i; then L increases by 1. A pause resets L to 0, so the next letter starts a syllable.
- **The ending.** The last syllable is replaced by the rising ending if the line ends in "?", and by the falling one otherwise.
- **The mouth.** It's open for 0.6 × 45k ms per syllable: 81 ms for Pomo, 108 ms for Doro.
- **Worked example.** Pomo's sample line has 61 characters, one stop inside and one comma, so T = 61 × 45 + 300 + 150 = 3,195 ms, with 16 syllables.

The test runs the pose sheet's own `writeOn` (`scripts/art/tour-motion.js`) on every tour line in both languages and requires identical times and syllables.

### 4.2 The pair's motion (`motion.ts`; assets record §4.4)

S(u) = u²(3 − 2u) on [0, 1], clamped.
- **Squash and stretch.** The height scale s_y(t) passes the keys (0, 1), (70, 0.92), (168, 1.04), (280, 1) ms, eased by S between keys. The width is s_x = 1/s_y, so s_x·s_y = 1 and the area holds.
- **The faces.** The old face's opacity is 1 − S(t/98); the new one's is S((t − 56)/98).
  - Setting them equal gives S(1 − t/98) = S((t − 56)/98), since 1 − S(a) = S(1 − a). So 1 − t/98 = (t − 56)/98, and t = 77 ms.
  - At 77 ms both are S(21/98) = 0.214² × (3 − 0.429) ≈ 0.118. §4.4 of the assets record says 0.5; the crossing time is right, the opacity isn't.
  - The face's combined opacity dips to about 0.24 for an instant. The device check judges it.
- **The hold.** A held tilt θ or stretch σ eases in as θ·S(t/220) from the previous face's value.
- **The breath.** s_y = 1 + 0.012·f·sin(2πt/P), with P = 3,400 ms (Pomo) or 4,100 ms (Doro) and f = 1, or 0.5 while talking. Only the speaker breathes (T-10).
- **The wave.** θ(t) = −2° − 14°·sin(2πt/420) for 0 ≤ t ≤ 1,050 ms, so it swings between −16° and +12°. It then eases from θ(1,050) = −2° back to 0 over 160 ms by 1 − S. It is mirrored for a left hand.
- **The point.** A nudge d(t) = 10·sin(πt/320) units along the nub's unit axis, for 0 ≤ t ≤ 320 ms, converted at 190/512 pt per unit.
- **The blink.** The wait is uniform on [2,800, 5,200] ms; one blink in five is a double, 110 + 140 + 110 ms.

### 4.3 The babble's variation (`babble.ts`; assets record §3.7)

For uniform draws r₁, r₂ in [0, 1):
- **Detune.** c = (2r₁ − 1)·10 cents, played as the rate 2^(c/1200), in [0.99424, 1.00579], with pitch correction off.
- **Gain.** g = (2r₂ − 1)·1.5 − 1.5 dB, so g lies in [−3, 0] dB, played as the volume 10^(g/20), in [0.708, 1].
- **Why the −1.5 dB base.** expo-audio's volume stops at 1, so the base sits 1.5 dB down and the top of the ±1.5 dB range reaches unity. The mean gain is −1.5 dB, so the voices average about −21.5 LUFS momentary against the measured −20, about 7.3 LU under the UI sounds.
- **The pick.** A body syllable is ⌊r·(m − 1)⌋ over the m − 1 syllables that aren't the last one, so it never repeats twice running.

### 4.4 Placement (`placement.ts`)

The speaker's box is B = 190 pt, the listener's 140 pt; the visible character stands h = 0.87B above its feet; the gap is 10 pt.
- **The pair's width** at scale k is (190 + 140 − 36)k = 294k pt.
- **Above an opening** with top y: the feet stand at y − 10, and the bubble's bottom at y − 10 − hk − 10.
  - The fit is k ≤ (y − 20 − H_b − inset_top − 8)/h, where H_b is the bubble's measured height.
  - Below an opening it's the same with the room under it. Left and right (wide screens) take the side's width over 294.
- **The choice.** The side with the largest fit wins, then k is clamped to [0.5, 1].
- **The ribbon onto an opening.** A = (W − 30, −12) and P = (x + w − 28, y − 6), with C₁ = (A_x, A_y + 0.45Δy) and C₂ = (P_x, P_y − 0.4Δy). An opening within 70 pt of the top gets a straight drop instead.
- **The ribbon onto a tab.** P = (tab_x, H − inset_bottom − 4), where tab_x is the tab's even share of the bar less 20 pt at each edge (to be checked on device).
- **Between beats.** The four points interpolate over 420 ms on the sheet curve (0.32, 0.72, 0, 1).

### 4.5 The scrim (contrast.ts, WCAG 2.x)

The dimmed colour is c = α·scrim + (1 − α)·lit per 8-bit channel; the ratio is (L₁ + 0.05)/(L₂ + 0.05).

| | Strawberry Milk | Midnight Plum |
|---|---|---|
| α = 0.45 (`scrim`): the lit Start pill against a dimmed one | 2.13 (floor 2) | 2.82 |
| α = 0.60 (`scrimStrong`): the same | 2.87 (floor 2.5) | 4.24 |
| α = 0.45: the lit page against the dimmed page (not gated) | 2.49 | 1.08 |

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| The tour follows the welcome | Folding the welcome into it; offering it later | The owner's answer. The welcome keeps its one beat, and the tour starts while attention is fresh |
| Over the real screens | Its own illustrated pages; pages then one real step | The owner's answer. People learn where things really are |
| You press, with Next as a backup | The tour navigates for you | The owner's answer. The hands learn the controls, and Next means nobody gets stuck |
| It ends on the first focus | A goodbye | The owner's answer. The tour's last tap is the app's main action |
| A list of tutorials keyed by version | A one-off general tutorial | The owner's rule: later versions add a version tutorial as content, not a new engine |
| The layer lazy-loaded inside each tab screen | One root route; the layer imported up front | The spike (§3.2): the native bar stays live above it. Lazy, the kit and voices never touch a cold start, and Reassure's counts hold |
| A JavaScript clock for the write-on, one render a character | A TextInput driven from the UI thread | The letters, the syllables and the mouth must stay in step, and the babble is played from JavaScript anyway. Only the bubble's text renders, about 22 times a second; every transform stays on the UI thread |
| The scrim's checks in their own `dims` list | Lower floors among the WCAG pairs | The contrast test keeps every pair to 4.5 or 3; a dim is a separation, not text |
| The voices' gain base at −1.5 dB | Variation only downwards; no variation | expo-audio's volume stops at 1; this keeps the approved ±1.5 dB spread, 1.5 dB softer on average, which the owner's "softer" brief welcomes |
| Choosing Fly ends the tour | Waiting out Fly | The tour never shows over Fly, and a hidden step leaves the person guessing; Settings replays it |
| The dock waits for the opening, with a 600 ms fallback | Placing it at once | Nothing slides in from a guessed place, and a control that can't be measured never strands the tour |
| The entrance once a run; later layers fade in | One entrance per layer | Layers remount on every tab step and after a sheet; the contract allows one delight |
| No dragging while the tour is on a screen | Re-measuring after every drag | A frozen page under a coach mark is expected, and the opening can never lag its control; the tour's own scroll still moves the page |

## 6. Verification

- [x] The brief written and stored (`impeccable surface-brief write`).
- [x] The owner confirms the brief (2026-11-01, "Confirm the brief").
- [x] The owner approves the direction contract (2026-11-01, "Approve the contract").
- [x] The assets approved in their record and fast-forwarded here, every guard green (§3.6).
- [x] The build plan committed before any code (§3.7).
- [x] The build: `npx jest` (64 suites, 481 tests), `npx tsc --noEmit`, `npm run lint`, `node scripts/react-compiler-report.js`, `npx reassure --branch`, `npm run check:contrast`, `node scripts/i18n/check-raw-text.mjs`, `node scripts/design/check-emoji.mjs`, `node scripts/art/build.mjs --check`, `node scripts/sound/build.mjs --check`, all green (§3.8).
- [x] The four reviews pass their gates after three passes (§3.9): critique 35/40, audit 18/20, HIG Excellent, motion clean; 484 tests.
- [x] `break-ui` in Turkish at AX5: 3 Broken and 1 Ugly fixed, each pinned by a test (§3.10); 493 tests.
- [x] Polish and the copy review: copy proof v5, 76 of 77 marks "Looks right", the one change applied (§3.11).
- [ ] The remaining steps of §0, the device check's lists in §3.8 and §3.9 among them.

## 7. Related Docs

- [Stage D plan](2026-10-30-phase1-stage-d.md) §3.9 · [D1 record](2026-10-30-phase1-d1-classic.md) (the welcome) · [D5 assets](2026-11-01-phase1-d5-assets.md) (the kit and the babble) · [D4 record](2026-10-30-phase1-d4-sounds.md) and [D4 wiring](2026-11-01-phase1-d4-wiring.md) (the sounds and their session)
- The tutorial's brief: `.impeccable/surfaces/app-tutorial-tsx.md` · the welcome's brief: `.impeccable/surfaces/app-welcome-tsx.md`
