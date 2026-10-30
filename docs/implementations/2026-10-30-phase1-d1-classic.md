---
id: IMPL-2026-10-30-phase1-d1-classic
title: "Phase 1 D1: Classic rebuilt in the Sticker Diary design, with the v1.4 welcome screen"
status: in-progress
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-stage-d, IMPL-2026-10-30-phase1-stage-c-design, IMPL-2026-10-29-phase1-plan, DESIGN-WORKFLOW, ADR-0045, ADR-0046, ADR-0047, SRS]
---

# 2026-10-30 — Phase 1 D1: Classic, and the v1.4 welcome screen

**Status:** In progress. The owner approved both direction contracts on 2026-10-30 ("Approve, build D1"); the build is under way.
**Branch:** `phase1/stage-d` (worktree `C:\vp\stage-d`).
**Plan:** [Stage D plan](2026-10-30-phase1-stage-d.md) §3.2, which holds the approach, the contracts of each new module, the render budget and the device checklist. This record holds what happened: each step's output, the owner's gates, the scores and the measurements.

---

## 0. Gates and steps

| Step (DESIGN-WORKFLOW §2) | Classic | Welcome screen |
|---------------------------|---------|----------------|
| 1. Shape | Brief confirmed at C4. Direction contract written 2026-10-30 (§3.1). | The owner chose The diary opens, 2026-10-30; brief and contract written (§3.2) |
| 2. `/apple-design` on the brief | Good; no Critical; 4 Medium and 3 Low, all dispositioned (§3.1.1) | Good; no Critical; 1 High and 2 Low, dispositioned (§3.2.1) |
| Owner: direction contracts | **Approved**, 2026-10-30 ("Approve, build D1") | **Approved**, 2026-10-30 ("Approve, build D1") |
| 3. Build (`animate-expo`) | Built, `635eb0a` (§3.9–3.10) | Built (§3.11) |
| 4. Critique, audit (≥ 16/20), HIG (no Critical), `review-animations` | Critique 31 → **35/40**; audit **16/20**; HIG Good, no Critical; motion clean after fixes (§3.12) | Critique **30/32**; audit **19/20**; HIG Good, no Critical; motion clean (§3.12) |
| 5. `break-ui` (TR at AX5) | 2 Broken and 1 Ugly fixed; 2 Fragile noted (§3.13) | 1 Broken fixed (§3.13) |
| 6. `polish`, `harden`, `clarify` | Done (§3.12–3.13); the Turkish copy waits for the owner's review | Done; the Turkish copy waits for the owner's review |
| 7. Device check, build 48 | Build 48 on EAS from `61fd06e` (§3.15). The owner's check, 2026-10-30: four findings (F1–F4, §3.16), fixed for build 49 | The same build. The owner asked for a livelier morph (F5, §3.16), rebuilt for build 49 |
| FINISH (both contracts): the finish review, its verdict, DESIGN.md | **Pending:** after the device check, with the owner's iPhone screenshots as the evidence | **Pending:** the same |

**FINISH is not yet discharged.** Each direction contract ends with "this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance". That waits for evidence this machine can't make:
- After the device check, a fresh `impeccable-finish-reviewer` gets both contracts and the owner's screenshots, labelled as hardware evidence.
- Then the documenter runs, as an ordinary extension: it compares against DESIGN.md and preserves it (E4 regenerates DESIGN.md in scan mode).
- **The welcome's bounce is DESIGN.md's one exception (build 49, F5).** DESIGN.md's motion table still gives the one bounce to the sticker placement. The owner's 2026-10-30 instruction amends that for the one-time welcome, which now has squash and stretch, its own bounce, and one burst of at most 12 sparkles (the welcome brief, amended). The finish review judges the welcome against the amended brief. The documenter carries the exception into DESIGN.md's motion table as a "Welcome (once)" row.
- The tab-icon PNGs carry their provenance through VectorCraft's `steps.json`; the build strips the PNG `tEXt` chunks for determinism, so `embed-prompt --scan` is checked then.

**Skill resolution (2026-10-30).** The Skill tool loads Impeccable from `C:\vp\stage-c\.claude\skills\impeccable`, because this session started in stage-c (Stage D plan §0). `diff -rq` finds the stage-c and stage-d copies of `impeccable`, `apple-design`, `animate-expo`, `review-animations` and `break-ui` identical, Impeccable at `ece7280` in both. Every Impeccable command here runs stage-d's own launcher with stage-d as the working directory: `impeccable context` reports `projectRoot: C:\vp\stage-d`.

## 1. Problem / Motivation

See the [Stage D plan §1](2026-10-30-phase1-stage-d.md#1-problem--motivation). D1 is the first screen in the new design and the first native build that carries the new app icon, the splash and Baloo 2. Requirements: FR-SET-002, NFR-UX-003, NFR-PERF-004, NFR-A11Y-002, NFR-A11Y-004, NFR-I18N-001 (the face and the plumbing), FR-SET-005 (the plumbing), NFR-PERF-003 (held).

## 2. What Changed

| File | Change |
|------|--------|
| `.impeccable/surfaces/app-tabs-index-tsx.md` | The owner's D1 answers folded in: what each preset sets, the built control, copy as EN/TR keys, the love-note sheet that stays until it is dismissed, and the iOS route to the tab colour. Plus the six-block direction contract. |
| `docs/implementations/2026-10-30-phase1-d1-classic.md` | This record. |
| `.impeccable/surfaces/app-welcome-tsx.md` | New. The welcome screen's brief and direction contract (§3.2). |
| `art/review/d1-welcome-*.html` | New. The three decision sketches: the locked composition, plus the two not chosen. |
| `art/type/build-fonts.py` | New. Builds the two embedded Baloo 2 instances from the hash-checked google/fonts file (§3.3); `--check` rebuilds and compares byte for byte. |
| `assets/fonts/Baloo2-Medium.ttf`, `assets/fonts/Baloo2-SemiBold.ttf`, `assets/fonts/OFL.txt` | New. The script's output and the licence. Nothing references them until the `expo-font` plugin entry lands with the build. |
| `.gitattributes` | `assets/fonts/** -text`, so `core.autocrlf` can't rewrite the licence and break the byte check. |
| `src/theme/useTheme.ts` | Returns the Sticker Diary theme from `palette.ts`: `theme`, `tokens`, `isDark`, plus the transitional `colors` (FR-SET-002; §3.4). |
| `src/theme/legacyColors.ts` | New. The v1 colour names mapped onto palette roles for the screens D2 hasn't rebuilt; gradients drawn flat; deleted at D2's end. |
| `src/theme/navigationTheme.ts`, `src/App.tsx` | The navigator's backgrounds come from the tokens instead of React Navigation's default light and dark themes. |
| `src/screens/{Stats,Settings,LoveNotes}Screen.tsx`, `src/startup/StartupDiagnostics.tsx` | Hard-coded white labels on `accent` and `accentPurple` fills now use `colors.onAccent`, which passes in both themes. |
| `src/theme/__tests__/legacyColors.test.ts` | New. Every legacy pair those screens draw, in both themes, at its floor; the gradients drawn flat. |
| `src/i18n/index.ts`, `casing.ts`, `en.json`, `tr.json`, `__tests__/i18n.test.ts` | New. The EN/TR plumbing the owner moved into D1: the language from the device, `t()` initialised synchronously, `upper()` with `tr-TR` casing, D1's strings with Turkish drafts, and tests of key and placeholder parity, plurals and casing (§3.5). |
| `package.json`, `package-lock.json` | Adds `expo-localization` 58.0.4 and `i18next` 26.4.6, pinned exactly to releases at least two weeks old. Removes `expo-blur`, `expo-symbols` and `@expo/vector-icons`, which nothing imports any more (§3.7). |
| `app.json` | The `expo-font` plugin lists the two Baloo 2 files (they reach `UIAppFonts`, checked with `expo config --type introspect`); `expo-localization`; `CFBundleLocalizations: ["en", "tr"]` for iOS's per-app language setting. |
| `src/theme/type.ts` | New. The Baloo 2 family names and the timer role; `displayFamily()` and `useBoldText()`, so the display roles step up a weight under Bold Text (HIG D1-M4). |
| `src/components/TimerText.tsx`, `__tests__/TimerText.test.tsx` | The leaf applies `fontVariant: ['tabular-nums']` after its caller's style, so every timer's digits stay steady; the test pins it (NFR-I18N-001, ADR-0046). |
| `app/(tabs)/_layout.tsx` | The four filled tab icons as template images; only the selected tab in `primaryInk`; the labels through `t()` (§3.6). |
| `art/jobs/icons.json`, `art/steps/icon-*-fill.steps.json`, `art/out/icon/icon-*-fill-25.png`, `assets/images/tabs/*` | The filled tab icons gain a 25 px export, and the `ship` field copies the 25, 50 and 75 px PNGs to `assets/images/tabs/tab-<name>{,@2x,@3x}.png`, so `build.mjs --check` covers them. |
| `src/components/ui/IconSymbol{,.ios}.tsx` | Removed: the tab bar was their only user. |
| `src/__tests__/router.test.tsx` | The tab-bar test now pins the template icons, the selected colour and the system's unselected appearance. |
| `scripts/art/build-icon-components.mjs` | New. Turns the VectorCraft exports into react-native-svg data: 50 icons, Pomo & Doro's poses and the mark's four versions, one module each; `--check` compares (§3.8). |
| `src/components/icons/Icon.tsx`, `src/components/icons/art/*.ts` | New. `<Icon glyph size color>` draws a C3 icon in `currentColor`; the 50 generated glyph modules. |
| `src/components/stickers/Sticker.tsx`, `src/components/stickers/art/*.ts` | New. `<Sticker art width>` draws a pose or a mark version in its own fills; the 16 generated modules. |
| `src/components/icons/__tests__/Icon.test.tsx` | New. Icons draw in the caller's colour and hide from VoiceOver without a label; stickers keep their fills and proportions; the generator's `--check` runs in Jest, so art and code can't drift apart. |
| `src/constants/presets.ts`, `src/constants/defaults.ts`, `src/types/index.ts`, `src/constants/__tests__/presets.test.tsx` | The four presets, each setting all three durations; the additive `classicLayout` setting (default `'ring'`), read defensively; tests that a v1.3.1 install hydrates to the Ring with every other value kept (FR-SET-001). |
| `src/__fixtures__/storage/v131.ts` | Types only: the v1.3.1 and v1.0 settings shapes omit `classicLayout`, which those versions never wrote. The pinned data is unchanged. |
| `src/theme/layout.ts` | New. The spacing scale (4 pt base) that DESIGN.md left to implementation, beside its radii, the edge weight and the 44 pt target. |
| `src/components/ui/PressableScale.tsx`, `src/components/ui/SegmentedControl.tsx` | New. Press feedback (0.97, 120 ms, haptic on press-in; dimming under Reduce Motion); the built segmented control (§3.9). |
| `src/components/TimerText.tsx` | An optional VoiceOver label builder (one element, the `timer` role) and fit-to-width, so "180:00" never clips. |
| `src/screens/TimerScreen.tsx`, `src/screens/classic/*` | Classic rebuilt: The Ring and Facing Pages on one component set, with the partner slot, today's stickers and the placement, the controls, the Modes button and the size-class layouts (§3.9). The engine wiring, the ad logic and the Fly branch are unchanged. |
| `app/_layout.tsx`, `app/love-note.tsx`, `app/modes.tsx`, `src/components/loveNote/LoveNoteSheet.tsx`, `src/components/modes/ModeSheet.tsx`, `src/stores/loveNoteSheetStore.ts` | New. The love note and the mode sheet as native form sheets over the tabs (§3.10). |
| `src/components/{GoalReachedPopup,CircularProgress,CalmBackground,PremiumCalmBackground}.tsx`, `package.json` | Removed with their last caller; `expo-linear-gradient` with them. |
| `src/i18n/en.json`, `tr.json` | `timer.session` added for the phase line. |
| `src/screens/__tests__/classic.test.tsx` | New. The Baloo timer with tabular figures and one VoiceOver element; a preset writes three durations and moves the selection; segments speak in words with a position, as buttons; End only while paused, with the stamp; Facing Pages; the mode sheet sets the layout and opens Fly. |
| `src/startup/frameProbe.ts`, `__tests__/frameProbe.test.ts`, `src/screens/classic/TodayStickers.tsx`, `src/startup/StartupDiagnostics.tsx` | New. NFR-PERF-004's readout (§3.14): for one second after a placement, the UI thread records each frame's delta and posts them once, at the end; B7's hidden panel shows the median fps, the worst frame and the frames over 32 ms. |
| `src/screens/welcome/useWelcomeGate.ts`, `__tests__/welcome.test.tsx` | The push waits for B7's `runAfterInteractive`, so the Timer paints first (§3.14). |
| `src/screens/SettingsScreen.tsx` | Settings › Appearance gains "Timer layout", the same built control as the mode sheet's (brief §3: the choice lives in both); its Reassure count stays 2. Settings is otherwise D2's. |
| `art/src/welcome/*.svg`, `art/jobs/welcome.json`, `art/steps/welcome-*.steps.json`, `art/vc/welcome-*.vectorcraft`, `art/out/illustration/welcome-*` | New. The welcome morph's art, built by VectorCraft (§3.11). |
| `scripts/art/build-icon-components.mjs`, `src/components/stickers/art/welcome*.ts` | The generator includes the welcome layers; the 10 generated modules. |
| `src/utils/storage.ts`, `src/stores/uiStore.ts`, `src/App.tsx`, `src/__fixtures__/storage/__tests__/v131.test.tsx` | The additive `welcome_v14` key; the welcome flag, its audience and the notification deferral; the fixture test's list of keys new since v1.3.1. |
| `src/screens/welcome/WelcomeScreen.tsx`, `useWelcomeGate.ts`, `app/welcome.tsx`, `app/_layout.tsx`, `src/screens/TimerScreen.tsx` | New. The welcome screen and its morph, the calm-entry gate, the full-screen route (§3.11). |
| `src/utils/easing.ts`, `src/utils/__tests__/easing.test.ts` | New. Cubic-bezier easing sampled in a worklet, tested against the linear identity, CSS's symmetric ease-in-out and the morph's own curve. |
| `src/screens/welcome/__tests__/welcome.test.tsx` | New. The gate: fresh installs wait behind the gift screen, an existing install is greeted once, a seen welcome never returns, a surviving session holds it until idle, a notification launch defers it. The screen: each audience's line, and Start marks it seen in storage. |
| `src/screens/__tests__/timerScreenOverlays.test.tsx`, `timerScreenTicks.test.tsx`, `flyLazyLoad.test.tsx`, `flyCredit.test.tsx`, `src/__tests__/router.test.tsx`, `splash.test.tsx` | Updated for "Start focus", the Modes sheet in place of Classic's inline Fly switch, the inline goal moment and the love-note sheet that stays until it is closed. Every ordering assertion is kept. |
| `src/screens/SettingsScreen.tsx`, `src/screens/__tests__/settingsKeyboard.test.tsx` | Build 49 (§3.16). F1: each number field renders its own Done bar (`NumberField`, with a unique `nativeID`), and each field now has an accessibility label. F4: the durations shown are Custom's. F5: About replays the welcome. |
| `src/navigation/sheetOptions.ts`, `src/navigation/__tests__/sheetOptions.test.ts`, `app/_layout.tsx`, `src/components/modes/ModeSheet.tsx` | Build 49, F2. New: theme-aware sheet options that give each sheet's Screen its own surface colour. The Modes sheet's root is now a ScrollView. |
| `src/screens/TimerScreen.tsx`, `src/components/ModeSwitcher.tsx` (removed), `src/screens/__tests__/flyLazyLoad.test.tsx` | Build 49, F3: Fly's way back is Classic's Modes button and sheet, kept outside `Suspense`. |
| `src/constants/presets.ts`, `src/types/index.ts`, `src/screens/classic/ClassicControls.tsx`, `src/i18n/en.json`, `tr.json`, `src/constants/__tests__/presets.test.tsx`, `src/screens/__tests__/classic.test.tsx`, `classicWorstCase.test.tsx` | Build 49, F4. The presets are 25/5, 50/10, 90/20 and Custom. Two optional settings fields, `presetChoice` and `customDurations`, are read defensively. The patches are pure, with tests, and the Custom key is in English and Turkish. |
| `src/screens/welcome/choreography.ts`, `src/screens/welcome/__tests__/choreography.test.ts`, `src/screens/welcome/WelcomeScreen.tsx`, `.impeccable/surfaces/app-welcome-tsx.md` | Build 49, F5. New: the welcome's keyframed timeline as a pure module, and its tests. The screen now runs on that timeline, and the brief carries the owner's amendment. |
| `src/utils/easing.ts`, `src/utils/__tests__/easing.test.ts` | Removed in build 49: the welcome was their only user, and its timeline uses closed-form easings (§4.2). |
| `docs/architecture/adr/0031-lazy-fly-mode.md` | An as-built note: the Modes button replaced `ModeSwitcher`, outside the same boundary. |
| `scripts/art/review-welcome-choreography.mjs`, `art/review/d1-welcome-choreography.html` | Build 49, F5. New: the browser preview of that same timeline, sampled at 60 Hz, for the owner. It is deterministic. |

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

### 3.2 The welcome screen: shaped, with its direction contract

**Discovery (2026-10-30)**, the owner's answers to Impeccable's shape round:
- the morph, one line, then Start
- one screen for everyone, with its own line for updaters and for fresh installs
- replayable from About (D2)

**Mode:** Experience. **Build path:** code-led, because image generation isn't available here (`generate-image` reports `OPENAI_API_KEY is not set`).

**The structure round:**
- **Seven structures,** ranked by resonance: 1 The Colon, 2 Apart then together, 3 Centre stage, 4 Sticker press, 5 The diary opens, 6 Today's page, 7 Washi tape.
- **The roll:** `concept-seed --scope surface --mode experience` dealt **5, 1 and 6**, with 5 leading (`seed:4270e69e80262e87`), plus six catalog challengers: drawcord cape, provenance ribbon, moiré gallery, design-annual plates, HyperCard stack and nixie counter.
- **The challengers:** all six were declined on both axes, audience identification and product clarity. Each brings a material the pinned world refuses (black silk, archival buff, black-and-white op art, print furniture, one-bit dither, neon). Each donated one discipline to the lead, written as a raise line in the brief.
- **The decision page:** served at `127.0.0.1:57501` with a 390 × 844 HTML sketch per card, built from the real art and an embedded Baloo 2.
  - The first sketches painted blank: the browser pane holds back `fonts.googleapis.com`, and a pending stylesheet blocks painting. The fix embeds the C2 specimen's Baloo 2 WOFF2 instead.
  - The page stayed unanswered for about 8 minutes, so the round moved to the structured question, as the skill directs.
- **The owner chose The diary opens,** the dealt lead (choice recorded with `concept-seed --kind assigned`).
- **The sketches are kept** in `art/review/d1-welcome-diary-opens.html` (the locked composition), `d1-welcome-colon-not-chosen.html` and `d1-welcome-todays-page-not-chosen.html`.

**The brief:** `.impeccable/surfaces/app-welcome-tsx.md`, written through `impeccable surface-brief write`, with the six-block contract and the seed; all six blocks are present.
- **The thesis:** the welcome is the diary itself, opened once. It refuses the onboarding carousel and the launch-screen logo moment.

#### 3.2.1 `/apple-design` on the welcome brief (2026-10-30)

**Pages opened:** `onboarding.md`, `launching.md`, `branding.md`, `modality.md`, `motion.md`, `playing-haptics.md`, `accessibility.md`, `dark-mode.md` (via `color.md`).

**Rating: Good.** No Critical findings; one High finding, dispositioned.

| # | Sev. | Finding | Guideline | Disposition |
|---|------|---------|-----------|-------------|
| W-H1 | High | The first v1.4 launch can land in the middle of a running or paused session (the clock is timestamp-based, so a session survives the update), or come from a notification. A welcome then covers the work. | `launching.md`: "Restore the previous state when your app restarts so people can continue where they left off"; PRODUCT principle 5, "Quiet during focus". | Brief §4: shown only on a calm entry (no running or paused session, not opened from a notification or deep link); otherwise it waits for Timer to be focused and idle. |
| W-L1 | Low | A flash between the static splash and the welcome's first frame. | `launching.md`: "Design a launch screen that's nearly identical to the first screen." | The welcome's ground is the splash colour, `#FFF6F1` / `#221726` (equal to the `page` tokens, checked). |
| W-L2 | Low | The pages-meet haptic. | `playing-haptics.md`: "Use system-provided haptic patterns according to their documented meanings"; "Make haptics optional." | If it stays after the device check: one light impact, following `settings.haptics`. |

**What works:**
- **It is the welcome screen Apple suggests** in place of a launch-time branding moment (`branding.md`, `launching.md`: "consider displaying it at the beginning of your onboarding flow").
- **It is brief and asks for nothing** (`onboarding.md`: "design a brief, enjoyable experience that doesn't require people to memorize a lot of information"; "Postpone nonessential setup flows").
- **It is replayable from About** (`onboarding.md`: "make sure it's easy for people to find if they want to view it later").
- **Start is live from the first frame** (`motion.md`: "Let people cancel motion").
- **Reduce Motion gets a crossfade,** and the line, not the motion, carries the meaning (`motion.md`: "Make motion optional").

### 3.3 Baloo 2, built (ADR-0046)

`python -P art/type/build-fonts.py` makes both files. It runs ahead of the direction-contract gate because ADR-0046 settles the face, and no screen uses the fonts until the build step.

| File | wght | Bytes | Glyphs | PostScript name | Digit advance under `tnum` |
|------|-----:|------:|-------:|-----------------|---------------------------:|
| `Baloo2-Medium.ttf` | 500 | 58,552 | 422 | `Baloo2-Medium` | 589 units, all ten equal |
| `Baloo2-SemiBold.ttf` | 600 | 58,568 | 422 | `Baloo2-SemiBold` | 594 units, all ten equal |

- **The source is verified:** `Baloo2[wght].ttf` matches `C:\vp\fonts\SHA256SUMS` (`d47a68525480…`) before anything reads it.
- **Self-checks:** all twelve Turkish letters are mapped; no ligature substitutes f+i or f+l; the digits are tabular; the PostScript names are distinct.
  - **The ligature check fails when it should:** a build that keeps `liga` stops at "a GSUB ligature still substitutes f+i or f+l".
- **Byte for byte:** the first `--check` found the files differed, because fontTools re-stamps `head.modified` on save. The script now copies the source's `head.created` and `head.modified` and turns off `recalcTimestamp`. Two `--check` runs then rebuilt all three files identically.
- **Size:** together 117,120 B, as ADR-0046 estimated (about 117 KB). They go into the binary, not the bytecode.


### 3.4 The theme switch (FR-SET-002)

`useTheme()` now returns `StrawberryMilk` or `MidnightPlum`, which makes FR-SET-002 implemented on this branch (§9 of the Stage D plan carries the SRS line for the merge).

**The adapter.** Stats, Settings, Notes, Gift and Fly's chrome still read the v1 names. `legacyColors()` maps each name onto a palette role, so they lose the purple aurora at once without being rebuilt twice. The mapping is in the Stage D plan §3.2.2. It also adds one key, `onAccent`.
- **Why `onAccent`:** v1 drew white labels on `accent` fills. Mapped to `primaryInk`, white passes in Strawberry Milk (6.1:1) but fails in Midnight Plum, where `primaryInk` is a light pink. The labels now take `onAccent`: white in light, plum `#221726` in dark (8.9:1).
- **The test,** `legacyColors.test.ts`, checks 14 pairs in each theme, every one at its floor.

**The navigator** draws its backgrounds (stack, sheets, tab scenes) from `page`, `paper`, `ink` and `edge`, instead of React Navigation's white and grey.

**Guards at this step:**
- Jest: 37 suites, 256 tests.
- `tsc`: clean.
- Lint: 0 errors (42 warnings, all in files D1 hasn't touched yet).
- Compiler report: unchanged, 47 compiled, 7 skipped, no worklet change.
- Contrast: 52/52 pairs.
- Reassure: unchanged. Settings-only 1, Timer 13, Stats 1, Settings 2, Notes 1, leaf 12.

### 3.5 EN/TR plumbing (FR-SET-005, NFR-I18N-001)

The owner moved D3's plumbing into D1 (Stage D plan §3.1).
- **The language:** `src/i18n/index.ts` picks the app's language from the device's preferred locales: the first Turkish or English one, otherwise English. iOS relaunches an app when its language changes, so the language is fixed for the process.
- **No i18next any more** (the owner's choice for the bytecode; [ADR-0048](../architecture/adr/0048-in-house-translator.md)). `t()` is our own: dotted keys, the device language then English, `{{name}}` interpolation, plurals through `Intl.PluralRules` (with `_zero` for 0, and English's rule if `Intl` is missing). Calling it in render is pure, so it adds nothing to the Reassure counts.
- **Turkish casing** goes through `upper()`, with `toLocaleUpperCase('tr-TR')`.
- **Versions:** `i18next` 26.4.6 was pinned first, then removed (above). `expo-localization` started at 58.0.4 on a two-weeks-old rule. Before the build, `expo-doctor` flagged it against SDK 58's expected `~58.0.5`, so it moved to that (Expo's own release, published 19 October): for a native module, the version the SDK is tested with outweighs the age rule. `expo-doctor` then passes 19 of 20; the one left, `@expo/config-plugins` installed directly, predates D1.
- **The strings:** only D1's new strings are keys so far. The test checks key and placeholder parity between the languages, plurals (English one/other and a zero form; Turkish uses one form after a number), and casing (`istatistik` → `İSTATİSTİK` in Turkish, `ISTATISTIK` in English).
- **Device check:** Hermes's `toLocaleUpperCase('tr-TR')` on the iPhone.

### 3.6 The tab bar (HIG H-1, M-4, D1-M1)

- **Icons:** the four filled C3 icons ship as 25 pt template images. React Native picks `@2x` or `@3x` by filename, and Jest needs the base name to exist, so the icon job now also exports 25 px.
- **The selected colour:** `NativeTabs` gets `iconColor={{ selected: primaryInk }}` and the selected label colour.
- **The unselected items** stay the system's monochrome. The native props show it: `selectedIconColor` and `selectedLabelStyle` are `#B03158`, and the normal appearance is empty.
- **The labels** come from `t()`.

### 3.7 Clean-up (HIG L-4)

- `expo-blur` had no importer.
- `IconSymbol` (with `expo-symbols` and `@expo/vector-icons`) lost its only user, the tab bar.
- All three packages are removed. `expo-symbols` was native code, so this also trims the binary.
- `expo-linear-gradient` stays until `PremiumCalmBackground` loses its last caller (D2).

**Guards after these steps:**
- `tsc`: clean.
- Jest: 38 suites, 265 tests, all passing once the tab-bar test was updated.
- Lint: 0 errors.
- Compiler report: 46 compiled (one fewer, with `IconSymbol` gone), 7 skipped, no worklet change.
- Art: `build.mjs --check` byte-identical; 79 assets within budget.

### 3.8 Icons and stickers as components (NFR-UX-002, pulled forward from D2)

D1 needs the "modes" icon and Pomo & Doro's poses, so the generator the plan put in D2 lands here.
- **One module per drawing.** Metro doesn't tree-shake, so a single map of all 66 drawings would put roughly 270 KB of path strings into the bytecode. With one module each, only what a screen imports ships.
- **Strict input.** `build-icon-components.mjs` reads each SVG's viewBox and `<path>` elements (`d`, `fill`, `fill-rule`, `opacity`), and stops on anything else, so a future exporter change can't be dropped silently.
- **Two outputs.** Icons ignore their exported fill and draw in `currentColor`. Stickers keep theirs, die-cut white edge included.
- **Enforced in Jest.** `--check` is byte-exact against the committed files, and a Jest test runs it.

### 3.9 Classic, built (brief and contract; DESIGN-WORKFLOW §2 step 3)

**The page.** It follows the contract's first viewport:
- the phase line ("Focus · session 2 of 4") with the Modes button
- the face: The Ring, or Facing Pages
- Pomo & Doro's strip and line, today's stickers, then the controls in thumb reach

Both layouts share `TimerText`, the poses, the row and the controls; `classicLayout` picks the face.
- **Sizes:** the ring is the smallest of 86 % of the readable width, 36 % of the height and 340 pt. The Baloo timer is a quarter of the ring and shrinks to fit one line, so "180:00" never clips.
- **Size classes:** compact height puts the face leading and a column trailing; regular width centres at 560 pt; at AX sizes Facing Pages stacks its pages.

**Motion, through `animate-expo`:**

| Motion | Gate | Tool | Values |
|---|---|---|---|
| Press | tens a day, feedback | CSS transition | scale 0.97, 120 ms, `(0.23, 1, 0.32, 1)`; dimming under Reduce Motion |
| Presets | occasional, state | CSS transition on the indicator's own-width translate | 200 ms, `(0.77, 0, 0.175, 1)`; the selection haptic on the change |
| Presets ↔ cycle row | per session, state | CSS opacity | 200 ms, in place |
| Phase change | per phase, state | two ring arcs (and two spine-bar fills) crossfading on CSS opacity, poses on keyed fades | 250 ms |
| Sticker placement | rare, delight | a custom entering layout animation | spring 450 ms at damping ratio 0.75; 12 paper bits over 600 ms; success haptic on the frame it lands; skipped for stickers already there |

None of it renders React per frame. Under Reduce Motion the placement is a 200 ms fade with no burst.

**Decisions made in the build:**
- **The goal moment keeps its place in the order.** The brief listed "the sticker placement, then the love-note sheet, then 'goal reached'". The build keeps the order the screen and its tests already had: the goal moment is part of the placement, inline on today's row for 1.4 s, then the love note, then the ad. Placed after the sheet, "goal reached" would appear only once the user had dismissed the note, cut off from the completion that caused it. The owner sees it at the device check.
- **The love-note sheet is `fitToContents` with no grabber.** That replaces the "fitted plus large detent" of HIG D1-M3: a single sized detent fits the note at every text size, reaching full height and scrolling at AX5. Because it isn't resizable, `sheets.md` asks for no grabber.
- **Paused shows a quiet stamp,** rotated −3°, in `primaryInk`, in place of the "Break at" line.

**Guards:**
- Jest: 40 suites, 277 tests, plus the 8 Classic tests.
- `tsc`: clean.
- Lint: 0 errors; warnings down from 42 to 35, none in D1's new files.
- Compiler: 59 compiled, 6 skipped (one fewer), no worklet change; every new component compiles.
- Reassure: unchanged. Settings-only 1, **Timer 13**, Stats 1, Settings 2, Notes 1, leaf 12.

### 3.10 The love note and the mode sheet (brief §6)

**The love-note sheet** is the `/love-note` form-sheet route.
- `TimerScreen` hands the note to a non-persisted store (`loveNoteSheetStore`) and pushes the route once the goal moment has gone and Timer is focused.
- The route closes the store when it unmounts, however it was closed, and `TimerScreen` then calls the engine's own `dismissLoveNote`. `useTimer` is unchanged.

**The mode sheet** is `/modes`. Classic is its first row, shown with the mark as a sticker and the layout choice under it; Fly is the second, where it can open.

### 3.11 The welcome screen, built (welcome brief and contract)

**The art (VectorCraft, `art/jobs/welcome.json`).** The morph needed one new drawing: the closed diary's cover.
- **The cover** is hinged at the spine, with a white die-cut edge. Its ribbon is milk, so Pomo & Doro stay the only colour until the handover ("Colour as event").
- **The mark's four layers,** copied exactly from the identity sources: the left and right die-cut edges (the spine goes with the left), under the left and right pages with their faces.
- **One artboard.** Everything sits on the mark's own 784 × 576 artboard, so the layers stack into the identity sheet's mark exactly (checked on a contact sheet).
- **Both themes:** colour and reversed, for dark grounds (C5), so 10 drawings of 1.2–1.8 KB each. All 89 assets pass `check-budgets.mjs`.

**The morph** runs on one shared value from 0 to 1 over 2.4 s ("One cord"):

| Span | What happens | Easing |
|------|--------------|--------|
| 0.15–0.55 | The cover scales shut toward the spine while both pages unfold out of it (scale-X about the box's centre, which is the spine). The closed diary's offset eases back, so the spread ends centred. | ease-out |
| 0.25–0.60 | Pomo & Doro walk from the cover's top edge to the two faces, shrinking by a quarter. | ease-in-out |
| 0.55–0.75 | They fade over the faces ("Layered handover"; "Unbroken custody": the faces were already part of the pages unfolding under them). | ease-out |
| 0.60–1.00 | The mark settles from 0.96 to 1; the line lands from 0.75. | ease-out |

There is no overshoot anywhere. A light haptic fires as p passes 0.6 (`useAnimatedReaction`, then `scheduleOnRN`), following Settings › Haptics; whether it stays is the device check's call. Under Reduce Motion the settled mark fades in.
- **The easing is sampled in a worklet** (`src/utils/easing.ts`, tested): Reanimated's `Easing.bezier` is a factory for `withTiming`, and its Jest mock has no `bezierFn`.

**The calm-entry gate** (`useWelcomeGate`; HIG W-H1) pushes `/welcome` once per process when all of these hold:
- Timer is focused and idle, in Classic, with no goal moment or love note pending.
- The store is hydrated.
- The first-launch gift screen is already dismissed, so two first-run screens never stack.
- The welcome isn't seen yet.
- The app wasn't opened from a notification (`deferWelcome()`, set in `App.tsx`'s notification listener).

**The audience is fixed at hydrate.** An install that had already seen the v1 gift screen is an existing user ("Your diary has a new look."); anything else is fresh ("Meet Pomo & Doro.").

**Storage:** one new additive key, `welcome_v14` (`{ seen: true }`), written by Start. The v1.3.1 fixture test lists it as new since v1.3.1. Nothing else changes, and the B2 migration is untouched.

**Presentation:** `fullScreenModal` with a fade, gestures off. Start fades it back into the Timer tab ("Same object").

**Found for D2.** Fresh installs still get v1's first-launch gift modal before the welcome. D2's Gift brief should decide whether the welcome replaces it for fresh installs.

### 3.12 The three reviews, and the fix batch (DESIGN-WORKFLOW §2 steps 4 and 6)

**How they ran.** This is a native platform, so the critique is Impeccable's design review alone (the detector reads web markup only). It ran in this context, with no degraded banner, as the critique reference allows. There is no Simulator on this machine, so every review reads the source and the built behaviour. The look is judged on the owner's iPhone at the device check, which may move the Accessibility and Adaptivity scores.

**How the gate is read.** The native audit is scored out of 20, which is NFR-UX-003's gate (≥ 16). The critique is scored out of 40 (out of 32 with two heuristics n/a), so "≥ 16/20" is read proportionally there: at least 80 %.

**Classic, first pass.** The snapshot is `.impeccable/critique/2026-10-30T18-52-45Z__app-tabs-index-tsx.md`.

| Review | Result | Findings |
|---|---|---|
| Critique | **31/40**, Good | P1: Skip ends a running focus with no guard. P2: the idle sticker row is blank. P2: "25/5" leans on recall. P3: the partner line is the same in every state. P3: the session count shows twice. |
| Audit (native) | **16/20** | Accessibility 3, Performance 3, Theming 4, Conformance 3, Adaptivity 3. P2: the ring keeps its size at AX5. P3: today's row draws heavy celebrating stickers. P3: the "+n" cell is fixed. |
| `/apple-design` (code audit) | Good, no Critical | B-M1: Skip is irreversible, with no warning (`alerts.md`, `undo-and-redo.md`). B-L1: the partner line says "studying" while idle. |
| `review-animations` | Not clean | Standard 8: the preset indicator slides under Reduce Motion. Standard 3: the particles use the default easing. Standard 9: press-in and release are symmetric. |

**The fix batch:**
- **Skip** asks in a native alert while a focus has run past its first minute; a break, or a focus under a minute old, skips at once.
- **The empty row** gets a dashed slot and "Finish a focus and your first sticker lands here".
- **The presets** carry a quiet "focus / break, in minutes" key, hidden from VoiceOver, which hears each segment in words.
- **The partner line** follows the state: ready, studying, on a break, waiting.
- **The ring** shrinks to 66 % of the width at AX sizes.
- **The "+n" cell** grows with its text.
- **Motion:** under Reduce Motion the indicator changes without sliding; the particles and the sticker's fade-in take the strong ease-out; the press snaps in at 100 ms and settles back over 180 ms.
- **Tests:** `classic.test.tsx` covers the Skip guard (and that confirming skips), the partner line by state, and the empty-row caption.

**Classic, after the fixes:**
- **Critique: 35/40** (88 %). The scores: status 4, real world 4, control 4, consistency 3, prevention 4, recognition 4, flexibility 3, minimalism 3, recovery 3, help 3. Still open: the session count shows twice (P3, kept: the dots are the visual, the phase line is spoken).
- **Audit: 16/20**, unchanged until the device check confirms the AX5 layout.
- **HIG:** B-M1 and B-L1 are fixed.
- **`review-animations`: clean.**
- **Kept on purpose: today's row keeps the celebrating stickers.** The sticker you earn should look earned. The device check's frame readout (NFR-PERF-004) decides whether they cost too much.

**The welcome screen:**

| Review | Result | Notes |
|---|---|---|
| Critique | **30/32**, Excellent | 7 and 10 n/a (Experience). Open: whether the flat scale-X "opening" reads as a squash (a feel question for the device), and Start is its only exit, by design, for a one-time screen. |
| Audit (native) | **19/20** | Adaptivity 3 until the device shows compact height. |
| `/apple-design` | Good, no Critical | W-H1 is in place (the calm-entry gate). **Medium, for D2:** a fresh install gets v1's gift modal, then the welcome: two first-run screens in a row (`onboarding.md`: "design a brief, enjoyable experience"). D2's Gift brief decides whether the welcome replaces the modal. |
| `review-animations` | Clean | 2.4 s is justified for a once-only explanation. Custom ease-out and ease-in-out, with no overshoot; Start interrupts it; Reduce Motion fades; transforms and opacity only. |

### 3.13 `break-ui`, the hardening and the copy pass (DESIGN-WORKFLOW §2 steps 5 and 6)

**How it ran.** There is no dev server or Simulator here, and a worst-case toggle inside a TestFlight build would ship to the App Store, which `break-ui` forbids (rule 4).
- **The worst-case data** is a Jest regression fixture instead, rendered in Turkish (`classicWorstCase.test.tsx`, with the device locale mocked to `tr-TR`).
- **The device check** reproduces each case through Settings: Turkish, the largest text size, a 180-minute focus and a 10-session cycle.
- **The layout findings are inferred** from the styles; Jest can't measure layout.

**The limits found:**
- focus 1–180 minutes
- long break up to 180
- the cycle 2–10 sessions (Settings' validators)
- a love note: unbounded

**What broke:**

| # | Severity | Worst case | What happened | Fix |
|---|---|---|---|---|
| 1 | Broken | the presets at AX sizes, wrapped into a 2×2 grid | The grid sat in an absolutely positioned layer inside a fixed reserved row, and spilled over the Start pill | The presets stay in flow, so the row takes their real height; the cycle row overlays it (`ClassicControls.tsx`) |
| 2 | Broken | the welcome line in Turkish at AX5 | 4–5 lines of uncapped 28 pt Baloo could run into Start | The line is capped at 1.6×; the art shrinks to 60 % at AX sizes; the body scrolls (`WelcomeScreen.tsx`) |
| 3 | Ugly | the goal moment at AX5 ("Hedefe ulaştın" and "30 günlük seri") | One row with no wrap, so it ran past the edges | It wraps and centres within the row; its text is capped at 1.6× (`TodayStickers.tsx`) |
| 4 | Fragile | a long love note with an unbroken URL | Readable (the sheet scrolls), but there is no length limit anywhere | **For the owner, with D2's Notes brief:** about 280 characters recommended |
| 5 | Fragile | "Karşılıklı sayfalar" in the two-segment layout control | Fits at the default size; wraps inside its segment at larger sizes | Holds; confirm on the device |

**What held up:**
- "180:00" fits the ring and the spine frame: it shrinks to one line, with tabular digits.
- The sticker row handles 0 (the empty slot and its caption), 1 ("1 session today") and 32 (two rows, then "+n").
- A 10-dot cycle fits one row.
- Long Turkish pill labels wrap inside content-sized pills.
- Compact height scrolls its trailing column, and iPad centres at 560 pt.

**The copy pass (`clarify`).** D1's English strings read in the brand's voice: warm, plain, sentence case. Each Turkish string is a draft, grammatical and in the same warm register. All of them go to the owner's copy review before build 48 ships, listed in §6.

### 3.14 Before build 48: the frame readout, the welcome's timing and what the build exercises

**The frame readout (NFR-PERF-004).** The plan promised it and the checklist relies on it, so it is built:
- **Capture:** a placement on a focused Timer arms a `useFrameCallback` on the UI thread. For one second it appends each `timeSincePreviousFrame` to a shared array, then posts the array once (`scheduleOnRN`).
- **Stopping:** the effect that armed the callback stops it at 1.5 s, and in its cleanup. An earlier form stopped it from inside its own report, which made the React Compiler skip the component ("Cannot access variable before it is declared"), so it was rewritten.
- **The summary:** `frameProbe.ts` computes the median fps, 1000 / median(Δ), the worst Δ and the count over 32 ms, and the panel shows them (Settings → About, B7's long-press).
- **Renders:** none; the Reassure counts are unchanged.

**The welcome waits for the first frame.** The gate queues its push through `runAfterInteractive`: after the root's first layout and the first idle moment, behind B7's deferred start-up work. The Timer always paints first, so no launch opens on a branding screen (HIG H-2). If the moment stops being calm before the task runs, the effect's cleanup cancels it.

**What build 48 does and doesn't exercise:**
- **Turkish is partial by design.** The Timer, the welcome, the love-note and mode sheets and the tab labels are in Turkish; Stats, Settings, Notes and the gift screen stay English until D2 and D3. On a Turkish device that mix is expected.
- **`Baloo2-Medium` and `useBoldText` ship unused in D1.** Every display string on these surfaces is SemiBold, so the Bold Text step-up (HIG D1-M4) is first exercised when D2 adds Medium roles. The fonts check still builds and verifies both instances.

**The owner's decisions before build 48 (2026-10-30):**
- **Build 48:** "Build, submit and tag". The EAS production build, the TestFlight submission, and the tag `v1.4.0-tf.48` pushed by commit ID. The branch itself stays unpushed.
- **The goal moment's order:** "Keep as built".
- **The bytecode:** "Replace i18next" (§4.1).
- **The Turkish copy:** "On the device, build 48". The owner sends corrections from the device check.

**The goal moment's order, as put to the owner.** The confirmed brief lists the sticker placement, then the love-note sheet, then "goal reached" inline. The build keeps the screen's existing order (§3.9): the goal moment with the placement, then the note, then the ad. Placed after the note, "goal reached" would appear only once the note was dismissed, cut off from the completion that caused it.

### 3.15 Build 48 (the owner's OK, 2026-10-30: "Build, submit and tag")

| Item | Value |
|---|---|
| Commit | `61fd06e` on `phase1/stage-d` (the branch stays unpushed; EAS uploads the committed tree) |
| Command | `eas build --platform ios --profile production --non-interactive --no-wait --auto-submit` |
| Version and build | 1.4.0 (48); EAS incremented the remote build number from 47 to 48 |
| EAS build | `59a5248c-75d0-4da5-be80-30e38c976e60` |
| Build result | **Finished** 2026-10-30 19:31 UTC; EAS reports the source as `61fd06e8` |
| TestFlight submission | `72b11e9c-7286-4d2d-891e-90af2b1679af`, **finished** (EAS's `submit-ios` workflow succeeded) |
| Tag | `v1.4.0-tf.48`, annotated (the tf.47 format), on `61fd06e`, **pushed** (the branch stays unpushed) |

**Binary (no budget exists; a measurement for E3).** These are EAS's compressed IPAs, read from the artifacts' `Content-Length`, not App Store thinned sizes.

| Build | IPA (B) |
|---|---:|
| 46 | 21,527,051 |
| 47 | 21,531,686 |
| **48 (D1)** | **21,600,473** (+68,787 B, +0.32 % on 47) |

The two Baloo 2 instances add about 117 KB. Removing `expo-symbols`, `expo-blur` and `expo-linear-gradient` takes some of that back.

### 3.16 The build 48 device check: the owner's findings, and the plan for build 49

The owner checked build 48 on an iPhone on 2026-10-30 (22:42) and sent two screenshots: the Modes sheet over the Ring, and Fly. They asked for five changes before D2 starts. This section was written and committed before any of the code.

**The findings, as the owner put them, and their causes:**

| # | Finding | Cause, read in the code |
|---|---------|------------------------|
| F1 | The number pad's Done bar works on Focus only; every number field in Settings needs it | React Native's Fabric `RCTInputAccessoryComponentView` binds an `InputAccessoryView` to **one** text input. In `didMoveToWindow` it walks the window for the first input whose `inputAccessoryViewID` matches, sets that input's accessory, and stops. All five fields share `NUMBER_DONE_ID`, so the first in the tree (Focus) gets the bar and the other four don't. The DEF-008 test asserted that every field carries the shared ID, which is the bug itself, so it passed. |
| F2 | The Modes sheet leaves a gap at the bottom where the page beneath shows | With `fitToContents`, `react-native-screens` lays the content out with no bottom anchor, and the sheet adds the 34 pt bottom safe area below it. That strip shows the Screen's own background, which only a route's `contentStyle.backgroundColor` sets (`ScreenStackItem` moves it onto the Screen "due to the safe area inset"). Our sheets paint their own View, so the strip shows the system's sheet material and the tab bar through it. The love-note sheet has the same structure and the same gap. |
| F3 | From Fly there is no way back to Classic the way you came | Classic opens Fly through the Modes button and sheet; Fly still shows v1's "Default / Fly" pill (`ModeSwitcher`, with emoji). |
| F4 | Presets 25/5, 50/10, 90/20 and Custom; no 52/17, so Settings' Timer Durations aren't useless | A preset overwrites `settings.durations`, so the durations typed in Settings are lost the moment a preset is chosen, and "Custom" was only the absence of a match. |
| F5 | The welcome's diary animation should be longer and livelier: squash and stretch, anticipation, staging, slow in and slow out, secondary actions, exaggeration | The morph is one 2.4 s cord with no anticipation, straight walks, and "ease-out, no overshoot" (the welcome brief's motion line, now amended by the owner). |

**The plan.**

- **F1, one Done bar per field.** A `NumberField` in Settings renders its `TextInput` with its own `InputAccessoryView` and a unique `nativeID`, placed after the input in the same row. That covers the five fields, including the daily goal's custom field, which mounts only while a goal is on. The test changes to what the bug was: every number field has a distinct `inputAccessoryViewID`, and the tree holds an accessory with that `nativeID`.
- **F2, the sheets paint their own inset.** The root layout reads the theme and gives each sheet route `contentStyle.backgroundColor`: the page colour for Modes, the paper colour for the love note (each sheet's own background). Root-level options are in place before the sheet presents, so the first frame is already painted. A small module (`src/navigation/sheetOptions.ts`) builds the options, with a test that each colour matches its sheet's.
- **F3, Modes in Fly.** In the Fly branch, the Modes button (the same glyph, label and sheet as Classic's) replaces `ModeSwitcher`. It stays outside Fly's `Suspense`, so Classic is reachable while Fly loads (ADR-0031). It sits at the top left on a paper chip, because Fly's compass holds the top right. `ModeSwitcher.tsx` is deleted.
- **F4, Custom keeps its own durations.** `PRESETS` becomes 25/5, 50/10 and 90/20. Two optional settings fields, read defensively the way `classicLayout` is, with no change to the storage migration:
  - `presetChoice`: `'25-5' | '50-10' | '90-20' | 'custom'`.
  - `customDurations`: the durations typed in Settings.
  - **The rules:**
    - Choosing a preset writes its durations to `settings.durations`, the field the session engine already reads, so the engine is unchanged.
    - Choosing Custom writes `customDurations` there.
    - Editing a duration in Settings edits `customDurations` and selects Custom, so a typed duration is always the one in use.
    - With nothing stored, the choice is the preset matching the current durations, else Custom, and `customDurations` is the current durations. So an existing install keeps exactly its v1.3.1 lengths, and a build 48 tester's 52/17 becomes Custom 52/17.
  - **The Timer:** the control reads 25/5 · 50/10 · 90/20 · Custom. With Custom selected, its key says "Custom: 40 / 8, set in Settings". Settings' Timer Durations section says that Custom uses them.
  - The patches are pure functions in `presets.ts`, with tests.
  - One consequence: an install with 50/10/20 (the v1.3.1 fixture) lands on Custom, because the 50/10 preset sets a 30-minute long break.
- **F5, the welcome reanimated.** The owner's instruction amends the welcome brief's motion line ("ease-out, no overshoot; the bounce belongs to the sticker placement"), and the amendment is written into the brief.
  - **The timeline.** It stays one progress value on the UI thread (no React render per frame) and keeps the art. The beats become explicit keyframes in a pure module (`src/screens/welcome/choreography.ts`), with per-segment easing and the timeline in milliseconds, about 4.4 s instead of 2.4 s:
    1. **Staging:** a held, closed diary, with Pomo & Doro breathing on its top edge.
    2. **Anticipation:** both crouch and the diary squashes under them.
    3. **The leap:** they stretch on take-off and fly a parabolic arc, which gives real gravity: slow at the apex, fast at the ends. The diary rebounds and the cover swings open; the pages unfold past flat and settle back.
    4. **The landing:** an exaggerated squash, the pages dip under the impact, a damped wobble, and a joyful pose. This is the one haptic.
    5. **A small hop toward each other.**
    6. **Becoming the faces:** a stretch, then a squash into the page; the pages bump and a burst of at most 12 particles follows.
    7. **The line lands.**
  - **Secondary action and character:**
    - The two are offset in time (overlapping action).
    - Pomo is lighter, with the higher hop.
    - Doro is heavier, with the lower hop and the bigger squash.
  - **Unchanged:**
    - Start is live from the first frame.
    - Reduce Motion is still the settled mark's fade.
    - The haptic follows Settings › Haptics.
  - **Verification:** the module is tested for its end state (exactly the static mark), its continuity, and that the anticipation and the squash exist. The build goes through `animate-expo` and then `review-animations`.
  - **An owner preview:** because there's no Simulator, a script samples the same module at 60 fps into an HTML preview in `art/review/`, so the owner can watch the choreography in a browser before build 49.
- **After the five:** the guards (§3.6 of the plan), the record, the Turkish copy table for the new strings, and the shared-doc text for FR-TMR-010, DEF-008 and ARCHITECTURE's `ModeSwitcher` row. Then the owner's OK for build 49. D2 waits until these are done.

#### 3.16.1 Built, finding by finding

| # | Commit | What shipped | Beyond the plan, and why |
|---|---|---|---|
| — | `9b0dafb` | This plan, committed before any code | |
| F1 | `cec4319` | One `InputAccessoryView` per field (Focus, Short Break, Long Break, the long-break interval and the custom goal), each with its own `nativeID`, placed after its input in the same row. An accessory lays out as its own root (`InputAccessoryShadowNode` is a root node, positioned absolutely), so it takes no room in the row. | Each field also gained an `accessibilityLabel`: VoiceOver had been reading only its value. |
| F2 | `1234ae8` | `sheetOptions(tokens)` gives each sheet's Screen its own surface colour: paper for the love note, page for Modes. | The Modes sheet's root became a ScrollView. Reading `react-native-screens` showed two things. The native stack already passes the theme's page colour as `contentStyle`, so `contentStyle` alone may not be what was missing. And the library sizes a sheet's root scroll view to the whole sheet (`coerceChildScrollViewComponentSizeToSize`), which is how the love note already paints its full surface. Both now hold for both sheets. Without a Simulator, which one closes the gap is left to the device check. The ScrollView also lets Modes scroll at AX sizes. |
| F3 | `eeeeef4` | A 44 pt paper chip with Classic's Modes glyph and label, at the top leading corner of Fly, opens the same sheet. `ModeSwitcher.tsx` is deleted, along with its emoji. | |
| F4 | `a3007ca` | As planned. The control reads 25/5 · 50/10 · 90/20 · Custom. With Custom selected, its key says "Custom: 40 / 8 min, set in Settings", and VoiceOver hears the same in the segment's label. Settings' Timer Durations notes that Custom uses them. A field left unchanged doesn't switch to Custom. | |
| F5 | `bdf2c14` | The timeline in `choreography.ts` (§4.2), the screen on it, the brief amended, and the preview. | <ul><li>**The cover now turns in perspective** (`rotateY` about the spine, with `perspective`), handing over to the left page at edge-on. Build 48's flat `scaleX` opening is gone: it was the device check's open question, whether it read as a squash. React Native builds `rotateY` and `perspective` as CSS does (`Transform.cpp`: m13 = −sin θ, m34 = −1/d), so the browser preview shows the phone's direction.</li><li>**The characters went from 0.22 to 0.26 of the art's width.** The preview showed the page faces' eyes peeking out beside their heads.</li><li>**The page dip was added during the review.** The plan named it, but the first build missed it.</li><li>**In dark mode, Pomo's sparkles are milk-white.** Pink sparkles vanished against the dark theme's pink pages.</li><li>**The art keeps headroom above it** for the leaps, so the ScrollView never clips a head at AX sizes or in landscape.</li></ul> |
| F5 | `a35e725` | Settings › About gains "Watch the welcome again", the brief's D2 replay pulled forward. The welcome shows once, and the owner's phone saw build 48's, so build 49 needs a way back to it. | |

**Skills:**
- **`animate-expo`** resolved and ran for F5. Its gate: the rare, first-time tier, with the purpose delight and explanation.
- **`review-animations`** is installed in the worktree, but this session doesn't offer it as a skill. Its standards were read from `.claude/skills/review-animations/SKILL.md` and applied by hand (§3.16.2).

#### 3.16.2 `review-animations` on the rebuilt welcome

| Before | After | Why |
| --- | --- | --- |
| `diaryPose` computed in each of five styles every frame; `characterPose` twice per character | `useDerivedValue`, once per frame per pose | A missed simplification: one computation per frame, with every layer reading it |
| No give under the landing, though the plan promised it | `SPREAD_DIP` on the inner spread, with Pomo & Doro riding it; Doro's landing spot tracks it, which the continuity test caught | Follow-through: the pages take the impact |
| Pink sparkles on the dark theme's pink pages | Milk-white glints for Pomo in dark | Half the burst was invisible in one theme |

**Verdict:**
- **Feel-breaking regressions:** none.
- **Performance:** transform and opacity only: `perspective` and `rotateY` are transforms. About 22 animated views run from one shared value on the UI thread, with no React render. The Reassure counts are unchanged.
- **Origin and physicality:**
  - The characters scale about their feet (93 % of their square), the diary about the closed cover's foot, and the spread about the spine's foot.
  - Nothing scales from 0: sparkles start at 0.5 with no opacity, and the characters end at 0.42 to 0.62 with no opacity.
- **Accessibility:** Reduce Motion fades in the settled mark; the characters and sparkles aren't rendered.
- **Tensions kept, with their reasons:**
  - **The length, 4.2 s, is past the 300 ms UI budget.** It's the rare tier, shown once, and Start is live from the first frame, so it never delays anyone.
  - **`in` (u²) on the fall and the dive.** That is character physics, not a UI response: the fall accelerates under gravity, and the dive's fade ends as the spread's bump and the sparkles begin, which mask the hand-over.
  - **A haptic on an entrance the user didn't cause.** It has been kept since D1, and the device decides.
- **Decision: Approve.**

#### 3.16.3 Guards and measurements (after `a35e725` and the clean-up that follows it)

| Guard | Result |
|---|---|
| Jest | 46 suites, 352 tests, all passing (after the unused `easing.ts` and its 5 tests went) |
| Lint (`npm run lint`) | 0 errors, 31 warnings (33 at D1; the deleted switcher took two) |
| React Compiler | 67 compiled, 6 skipped: no new skip and no worklet-count change. `NumberField`, `Diary`, `Character` and `Sparkle` compile; `SettingsScreen` was already skipped |
| Reassure | Unchanged: settings-only 1, Timer 13, Stats 1, Settings 2, Notes 1, leaf 12 |
| `timerTextTicks` and the two real-screen timer guards | Pass (in Jest) |
| `check:contrast` | 52 pairs in 2 themes, none under its floor |
| Art | `build.mjs --check`: every export matches a clean rebuild; `check-budgets`: 89 assets, none over budget |
| iOS bytecode (`expo export --platform ios`) | **4,043,564 B**: +17,156 B (+0.43 %) on build 48, mostly the timeline and the welcome's components. Now **4.86 % over** NFR-PERF-002's limit (4.41 % at build 48); E3 revisits |

**Fragile, for D2.** React Native 0.88 marks `InputAccessoryView` deprecated, and Jest logs the warning. It works today. D2's Settings rebuild should consider a stepper or a picker for these bounded numbers (HIG `entering-data.md` prefers choices over typing), or `react-native-keyboard-controller`'s toolbar.

**The owner's preview.** Run `node scripts/art/review-welcome-choreography.mjs`, then open `art/review/d1-welcome-choreography.html`. It has replay, 1× to 0.1× speed, a scrubber and a light/dark switch, and the page marks the haptic's frame.

### 3.17 Build 49 (the owner's OK, 2026-10-31: "Build 49")

| Item | Value |
|---|---|
| Commit | `9f0de71` on `phase1/stage-d` (the branch stays unpushed; EAS reports the source as `9f0de717`) |
| Command | `eas build --platform ios --profile production --non-interactive --no-wait --auto-submit --json` |
| Pre-flight | `expo-doctor`: 19 of 20 checks pass; the one left, `@expo/config-plugins` installed directly, predates D1 (§3.5). EAS account `sensoymertefe` |
| Version and build | 1.4.0 (49); EAS incremented the remote build number from 48 to 49 |
| EAS build | `2fe5428c-1bce-40e4-9390-6545d224602c`, queued 2026-10-31 00:11 (UTC+3) |
| Build result | In progress |
| TestFlight submission | `c2a26f6b-33a4-4dfb-9f49-fe14f2c9be62`, scheduled to run when the build finishes |
| Tag | `v1.4.0-tf.49`, annotated in the tf.48 format, on `9f0de71`, pushed once the build and the submission finish |

It carries the build 48 fixes and the reanimated welcome (§3.16). The device checklist is §6, "build 49".

## 4. Mathematical / Statistical Details

The numeric rules D1 implements are in the [Stage D plan §4](2026-10-30-phase1-stage-d.md#4-mathematical--statistical-details): contrast, tabular digits, the font build, the sticker spring, "Break at" and bytecode.

### 4.1 Bytecode after D1 (NFR-PERF-002; Stage D plan §4.7)

Both sides were measured with `npx expo export --platform ios --dump-sourcemap`, each from its own checkout. The base came from a temporary detached worktree at `ed8ab00`, since removed.

| Export | iOS bytecode (B) |
|---|---:|
| Base, `ed8ab00` (B6 + B7 + Stage C) | 3,918,816 |
| D1, `a510a08` | **4,079,756** |
| Δ | **+160,940 (+4.11 %)** |

Against NFR-PERF-002's limit of 3,856,208 B, D1 is **+223,548 B (+5.80 %) over**. Before D1 it was 1.47 % over, which the owner accepted until E3.

**Where the new bytes come from,** read from the two source maps as source characters added (a proxy for bytecode):

| Group | Source chars | Share |
|---|---:|---:|
| `i18next` | 83,852 | 35 % |
| Sticker and welcome art (SVG path data, `src/components/stickers/art`) | 70,644 | 30 % |
| `src/screens/classic`, `src/screens/welcome` | 40,098 | 17 % |
| `src/components/ui`, `icons`, `modes`, `loveNote` | 21,240 | 9 % |
| `expo-localization` | 7,087 | 3 % |
| The rest (`theme`, `i18n`, `utils`, `constants`, `app`) | 13,019 | 6 % |
| **Gone** (`GoalReachedPopup`, `CircularProgress`, the two gradient backgrounds, `expo-linear-gradient`) | −27,067 | |

**The two levers, for the owner:**
- **(a) The art as PNG assets.** The art could ship as `@2x`/`@3x` PNGs rendered through `Image`, which moves about 70 K out of the bytecode into the binary's assets. The cost is the vector crispness of the welcome's scaled layers.
- **(b) A small in-house `t()`** (interpolation, plus plurals through `Intl.PluralRules`, about 2 KB) in place of `i18next`. The handover names `i18next`.

Together they would bring D1 to about +1.5 % over the base. **E3 re-measures with the pinned two-platform command.**

**The owner chose (b), 2026-10-30 ("Replace i18next")**, recorded as [ADR-0048](../architecture/adr/0048-in-house-translator.md). Measured again with the same command at `1e232b1` plus the replacement:

| Export | iOS bytecode (B) |
|---|---:|
| D1 with i18next | 4,079,756 |
| D1 with the in-house translator | **4,026,408** (−53,348) |
| Against the base `ed8ab00` | +107,592 (+2.75 %) |
| Against NFR-PERF-002's limit | **+170,200 (+4.41 %)** |

The art stays SVG for now; E3 revisits both the limit and lever (a).

### 4.2 The welcome's choreography (build 49, F5; `src/screens/welcome/choreography.ts`)

**Units.** Time *t* is in milliseconds since the morph began, from 0 to 4,200. Positions are shares of the art box (x of its width W, y of its height H = 0.7347 W). Angles are in degrees.

**Keyframe tracks.** A track is a list of keys (tᵢ, vᵢ, easeᵢ). Between keys i−1 and i:

  v(t) = vᵢ₋₁ + (vᵢ − vᵢ₋₁) · easeᵢ(u),  u = (t − tᵢ₋₁) / (tᵢ − tᵢ₋₁)

The track holds v₀ before the first key and the last value after the last key.

**Easings,** in closed form so a worklet captures no functions. Each maps [0, 1] onto [0, 1]:

| Name | Formula | Used for |
|---|---|---|
| `lin` | u | constant speed |
| `sine` | (1 − cos πu) / 2 | breathing, settling: slow in and slow out |
| `inOut` | 4u³, or 1 − (2 − 2u)³ / 2 past u = ½ | deliberate moves (the crouch, the cover's turn, the slide to centre) |
| `out` | 1 − (1 − u)⁴ | explosive starts that brake (take-off, impact, rebound, the line landing) |
| `in` | u² | accelerating bodies (the last instants of the fall, the dive) |

**The leaps are projectiles.** With s = (t − launch) / air in [0, 1]:

  x(s) = x₀ + (x₁ − x₀) s,  y(s) = y₀ + (y₁ − y₀) s − 4H′ s (1 − s)

- (x₀, y₀) is the cover's top edge at take-off; (x₁, y₁) is the face's spot on the page, which moves with the pages' dip.
- H′ = lift × room.
- y is quadratic in t, so the vertical acceleration is constant: gravity. The leap is slowest at the apex, s* = (1 − (y₁ − y₀) / 4H′) / 2, and fastest at both ends.

| | Launch (ms) | Air (ms) | lift | Apex above take-off |
|---|---|---|---|---|
| Pomo | 1,010 | 640 | 0.36 | ≈ 0.13 H |
| Doro | 1,080 | 600 | 0.30 | ≈ 0.09 H |

`room` is 1, or 0.5 in a compact height.

**Squash and stretch** are keyframed scaleX and scaleY pairs about the feet:

| | Crouch | Take-off | Impact |
|---|---|---|---|
| Pomo | 0.78 × 1.16 | 1.2 × 0.85 | 0.66 × 1.32 |
| Doro | 0.74 × 1.2 | 1.16 × 0.88 | 0.6 × 1.45 |

Through the hop, the area sx·sy stays within 0.85 to 1.15, which the tests check, so the bodies read as soft but solid.

**The cover's turn,** θ(t): it leans back to +8° (anticipation), then swings to −192° (towards the viewer, so the near edge grows in perspective, d = 3W). It comes back to −177° and settles at −180°. The left page's angle is θ + 180°, so it overshoots flat by 12° and settles. One face shows at a time: the cover while θ > −90°, the page from then on.

**The headroom.**
- **Seated:** a head reaches 0.93 × 0.26 / 0.7347 − 0.059 ≈ 0.27 H above the art.
- **The apex:** Pomo's leap adds up to 0.14 H × room.
- **The bound:** the screen keeps `headroom(room)` = (0.28 + 0.14 room) H above the art, and the tests check it bounds every head on every frame.

**The sparkles.** There are ten, five per face. Sparkle k flies at angle −90° ∓ (−50° + 30°k), a fan over the upper 120°, to a reach of 0.12 to 0.155 W with the `out` easing. It falls 0.06 H × u² under gravity over 560 ms, fading in over the first 12 % and out as 1 − ((u − 0.12) / 0.88)².

**The haptic** fires once, as *t* crosses 1,650 ms. That is Pomo's launch plus her air time, the frame her feet reach the page.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| The love-note sheet stays until it is dismissed | Keep v1's 8 s auto-close | A sheet that closes itself takes the text away from someone reading at a large size (WCAG 2.2.1, Timing Adjustable). The interstitial already waits for the sheet to close, so the ad policy is unchanged. |
| Run stage-d's Impeccable launcher, not stage-c's | Use the base directory the Skill tool reports | The copies are identical; stage-d's own launcher keeps every read and write inside this worktree. |
| Build 49, F4: Custom stores its own durations beside the active ones | (a) Custom as the absence of a match, which build 48 had. (b) A Custom segment that opens Settings | (a) loses the typed durations the moment a preset is chosen: the owner's "useless". (b) makes one segment an action among selections. Storing `customDurations` keeps them, and the engine still reads only `durations`. |
| Build 49, F3: Fly's Modes button at the top leading corner | Move Fly's compass; keep the old pill | The compass belongs to the map and has its own landscape placement (FlySheet). The pill was a second way to switch modes, with emoji. |
| Build 49, F5: a keyframed timeline on one shared value | Springs per element; Lottie | One driver keeps every layer, the arcs and the haptic's frame in step and testable. Lottie would mean new art outside VectorCraft. Springs can't be audited beat by beat, nor sampled for the owner's preview. |
| Build 49, F5: the cover turns with `rotateY` in perspective | Keep build 48's `scaleX` | A flat scale reads as a squash, which was the device check's open question. A turn about the spine is how a book opens, and React Native's matrices match the preview's CSS. |
| Build 49, F5: About replays the welcome now | Wait for D2 | The owner's phone has already seen build 48's welcome, so without a replay the rebuilt one couldn't be checked on build 49. |

## 6. Verification

- [x] The Classic and welcome contracts each have all six blocks and their seed references.
- [x] DESIGN-WORKFLOW §2 steps 1–6 for both surfaces (§0, §3.1–3.13).
- [x] The guards in the [Stage D plan §3.6](2026-10-30-phase1-stage-d.md#36-guards-green-at-every-commit), green at every commit.
- [ ] **The owner's review of the Turkish copy:** every string in `src/i18n/tr.json`, which build 48 carries.
- [ ] **The device check, build 48** (`v1.4.0-tf.48`), on a physical iPhone through TestFlight, after the owner's OK for the EAS build and the submission:
  1. The new app icon in default, dark and tinted; the splash in light and dark.
  2. Baloo 2 renders, and the timer's digits hold still as they count.
  3. The selected tab is strawberry in both themes; the four template icons tint; the Turkish tab labels fit ("Zamanlayıcı").
  4. The Ring and Facing Pages in both themes: the presets and their key, the controls clear the floating bar, the Modes sheet, and Settings › Timer layout.
  5. The sticker placement's feel and haptic, and its frame readout (≥ 58 fps median, no frame over 32 ms; NFR-PERF-004). The phase crossfade. Skip's confirmation past the first minute.
  6. Reduce Motion: opacity only, with no slide on the presets.
  7. The love-note sheet stays until it is closed, then the interstitial.
  8. Compact height (landscape); the largest text size in **Turkish** (nothing clips: the presets grid, the goal moment, the welcome line); the VoiceOver order and labels; an iPad if one is available.
  9. The scroll edge effect under the bar when Facing Pages scrolls at accessibility sizes.
  10. The welcome: the Timer paints first, then the welcome fades in (never at launch); it shows once over the update from build 47, once on a fresh install (after the gift screen), never again; never over a running session. The morph's feel, whether its flat opening reads as a squash, the pages-meet haptic, and the Reduce Motion fade.
  11. `toLocaleUpperCase('tr-TR')` on Hermes (§3.5).
- [ ] **The device check, build 49** (after the owner's OK for the build), for the build 48 findings (§3.16):
  1. **F1:** every Settings number field (Focus, Short Break, Long Break, the long-break interval, the custom goal) shows the Done bar, and Done closes the keyboard.
  2. **F2:** no strip at the bottom of the Modes sheet or the love-note sheet, in light and dark. Modes scrolls at the largest text size.
  3. **F3:** in Fly, the top-left Modes button opens the sheet, and Classic returns from it, including while Fly is still loading.
  4. **F4:**
     - The presets read 25/5 · 50/10 · 90/20 · Custom.
     - Custom brings back the durations typed in Settings after a preset.
     - Editing a duration in Settings selects Custom.
     - The Custom key wraps cleanly in Turkish at AX5.
  5. **F5, the welcome,** through Settings › About › "Watch the welcome again":
     - The anticipation reads, and the cover's turn reads as a book opening.
     - The landing haptic lands on the frame of contact.
     - Nothing is clipped at the largest text size or in landscape.
     - Pomo's glints show in dark.
     - Reduce Motion is still a fade.

## 7. Related Docs

- [Stage D plan](2026-10-30-phase1-stage-d.md) · [Stage C record](2026-10-30-phase1-stage-c-design.md) §2.4, §10 · [Design workflow](../process/DESIGN-WORKFLOW.md)
- The Classic brief: `.impeccable/surfaces/app-tabs-index-tsx.md`


## 8. Turkish copy for the owner's review

Every string build 48 carries in Turkish, beside its English (generated from `src/i18n/en.json` and `tr.json`). Plural keys (`_one`, `_other`, `_zero`) are i18next's; Turkish uses one form after a number.

| Key | English | Turkish (draft) |
|---|---|---|
| `tabs.timer` | Timer | Zamanlayıcı |
| `tabs.stats` | Stats | İstatistik |
| `tabs.settings` | Settings | Ayarlar |
| `tabs.notes` | Notes | Notlar |
| `timer.phase.focus` | Focus | Odak |
| `timer.phase.shortBreak` | Short break | Kısa mola |
| `timer.phase.longBreak` | Long break | Uzun mola |
| `timer.phaseLine` | {{phase}} · session {{n}} of {{total}} | {{phase}} · {{total}} oturumdan {{n}}. |
| `timer.session` | session {{n}} of {{total}} | {{total}} oturumdan {{n}}. |
| `timer.nextChange.break` | Break at {{time}} | Mola: {{time}} |
| `timer.nextChange.focus` | Focus at {{time}} | Odak: {{time}} |
| `timer.paused` | Paused | Duraklatıldı |
| `timer.a11y.remaining` | {{minutes}}, {{seconds}} left, {{phase}}, session {{n}} of {{total}} | {{minutes}} {{seconds}} kaldı, {{phase}}, {{total}} oturumdan {{n}}. |
| `timer.a11y.minutes_one` | {{count}} minute | {{count}} dakika |
| `timer.a11y.minutes_other` | {{count}} minutes | {{count}} dakika |
| `timer.a11y.seconds_one` | {{count}} second | {{count}} saniye |
| `timer.a11y.seconds_other` | {{count}} seconds | {{count}} saniye |
| `controls.startFocus` | Start focus | Odağı başlat |
| `controls.startBreak` | Start break | Molayı başlat |
| `controls.pause` | Pause | Duraklat |
| `controls.resume` | Resume | Devam et |
| `controls.skip` | Skip | Atla |
| `controls.endSession` | End session | Oturumu bitir |
| `controls.endConfirm.title` | End this session? | Bu oturum bitsin mi? |
| `controls.endConfirm.message` | The timer goes back to the start. | Zamanlayıcı başa döner. |
| `controls.endConfirm.end` | End session | Oturumu bitir |
| `controls.endConfirm.cancel` | Cancel | Vazgeç |
| `controls.skipConfirm.title` | Skip the rest of this focus? | Bu odağın kalanı atlansın mı? |
| `controls.skipConfirm.message` | Your break starts now, and this session won't add a sticker. | Molan şimdi başlar; bu oturum çıkartma eklemez. |
| `controls.skipConfirm.skip` | Skip | Atla |
| `controls.skipConfirm.cancel` | Keep focusing | Odaklanmaya devam et |
| `presets.label` | {{focus}} minutes focus, {{rest}} minutes break | {{focus}} dakika odak, {{rest}} dakika mola |
| `presets.position` | {{n}} of {{total}} | {{total}} seçenekten {{n}}. |
| `presets.custom` | Custom | Özel |
| `presets.key` | focus / break, in minutes | odak / mola, dakika |
| `modes.button` | Modes | Modlar |
| `modes.title` | Modes | Modlar |
| `modes.classic` | Classic | Klasik |
| `modes.fly` | Fly | Uçuş |
| `modes.layout` | Timer layout | Zamanlayıcı düzeni |
| `modes.ring` | Ring | Halka |
| `modes.spread` | Facing pages | Karşılıklı sayfalar |
| `partner.ready` | Pomo & Doro are ready when you are | Pomo ve Doro hazır, sen ne zaman istersen |
| `partner.studying` | Pomo & Doro are studying with you | Pomo ve Doro seninle çalışıyor |
| `partner.break` | Pomo & Doro are on a break with you | Pomo ve Doro seninle molada |
| `partner.paused` | Pomo & Doro are waiting for you | Pomo ve Doro seni bekliyor |
| `today.a11y_one` | {{count}} session today | Bugün {{count}} oturum |
| `today.a11y_other` | {{count}} sessions today | Bugün {{count}} oturum |
| `today.a11y_zero` | No sessions yet today | Bugün henüz oturum yok |
| `today.more` | +{{count}} | +{{count}} |
| `today.empty` | Finish a focus and your first sticker lands here | Bir odak bitir, ilk çıkartman buraya yapışsın |
| `goal.reached` | Goal reached | Hedefe ulaştın |
| `goal.streak_one` | {{count}}-day streak | {{count}} günlük seri |
| `goal.streak_other` | {{count}}-day streak | {{count}} günlük seri |
| `loveNote.title` | A note for you | Sana bir not |
| `loveNote.close` | Close | Kapat |
| `welcome.updated` | Your diary has a new look. | Günlüğün yeni bir görünüme kavuştu. |
| `welcome.fresh` | Meet Pomo & Doro. | Pomo ve Doro ile tanış. |
| `welcome.start` | Start | Başla |
| `welcome.art` | Pomo and Doro become the pages of one diary | Pomo ve Doro tek bir günlüğün sayfalarına dönüşüyor |

**Added for build 49 (§3.16):**

| Key | English | Turkish (draft) |
|---|---|---|
| `presets.customLabel` | Custom: {{focus}} minutes focus, {{rest}} minutes break, set in Settings | Özel: {{focus}} dakika odak, {{rest}} dakika mola; Ayarlar'da belirlenir |
| `presets.customKey` | Custom: {{focus}} / {{rest}} min, set in Settings | Özel: {{focus}} / {{rest}} dk, Ayarlar'da belirlenir |
| `presets.settingsNote` | Custom on the Timer uses these durations. | Zamanlayıcıdaki Özel seçeneği bu süreleri kullanır. |
| `welcome.replay` | Watch the welcome again | Karşılamayı yeniden izle |

## Backlinks
<!-- backlinks:start -->
- [Load Fly Mode lazily](../architecture/adr/0031-lazy-fly-mode.md)
- [An in-house translator over i18next, for English and Turkish](../architecture/adr/0048-in-house-translator.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
