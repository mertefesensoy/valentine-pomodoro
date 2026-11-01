---
id: IMPL-2026-11-01-phase1-d5-tutorial
title: "Phase 1 D5: the general tutorial, Pomo & Doro show you around"
status: in-progress
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-stage-d, IMPL-2026-10-30-phase1-d1-classic, IMPL-2026-10-30-phase1-d4-sounds, IMPL-2026-11-01-phase1-d4-wiring, DESIGN-WORKFLOW, SRS]
---

# 2026-11-01 — Phase 1 D5: the general tutorial

**Status:** In progress. The brief is confirmed, the direction contract approved, and the assets are done and on this branch (2026-11-01). The build has started from its plan (§3.7).
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
| 5. Build (`animate-expo`) | **In progress**, 2026-11-01. The plan is §3.7, committed before any code |
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
- [x] The owner approves the direction contract (2026-11-01, "Approve the contract").
- [x] The assets approved in their record and fast-forwarded here, every guard green (§3.6).
- [ ] The remaining steps of §0.

## 7. Related Docs

- [Stage D plan](2026-10-30-phase1-stage-d.md) §3.9 · [D1 record](2026-10-30-phase1-d1-classic.md) (the welcome) · [D5 assets](2026-11-01-phase1-d5-assets.md) (the kit and the babble) · [D4 record](2026-10-30-phase1-d4-sounds.md) and [D4 wiring](2026-11-01-phase1-d4-wiring.md) (the sounds and their session)
- The tutorial's brief: `.impeccable/surfaces/app-tutorial-tsx.md` · the welcome's brief: `.impeccable/surfaces/app-welcome-tsx.md`
