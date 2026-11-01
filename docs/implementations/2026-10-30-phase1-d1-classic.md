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
| 7. Device check, build 49 | Build 49 on EAS from `9f0de71`, submitted to TestFlight, tag `v1.4.0-tf.49` pushed (§3.17). The owner's check, 2026-10-31: "All well" except one finding (F6, §3.18): Fly's Modes button belongs at the top right, where the compass was. Fixed in build 50 | The same build: "All well" |
| 7. Device check, build 50 | Build 50 on EAS from `98f6a1f`, submitted to TestFlight, tag `v1.4.0-tf.50` pushed (§3.19). The owner's check, 2026-10-31: every check passed, "all well" (§6) | The same build; no welcome change since build 49 |
| FINISH (both contracts): the finish review, its verdict, DESIGN.md | **Done**, 2026-11-01. The verdict: **ship** (§3.23); the Ring is 275 pt and Skip clears the bar by 16 pt on build 56. **DESIGN.md written** from the shipped code, with its sidecar (§3.24). Round 1: recapture (no iPad); round 2: fix, eight fixes; the verdict pass: fix 7, rebuilt and resolved | **Captures waived by the owner** (§3.20). The verdict is the owner's device checks. **DESIGN.md's "Welcome (once)" row written** (§3.24) |

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
| `docs/architecture/adr/0031-lazy-fly-mode.md` | An as-built note: the Modes button replaced `ModeSwitcher`, outside the same boundary. After build 49, a second note: the button moved inside the boundary (F6). |
| `src/screens/FlyModeScreen.tsx`, `src/screens/TimerScreen.tsx`, `src/screens/__tests__/flyModesButton.test.tsx`, `flyLazyLoad.test.tsx` | After build 49, F6 (§3.18). Fly's Modes button heads Fly's own map-control column at the top right, with the compass under it. New: a test on the real Fly screen that the button comes first in that column and opens the sheet. |
| `src/components/stickers/Sticker.tsx`, `src/screens/classic/PoseSticker.tsx`, `SpreadPages.tsx`, `TodayStickers.tsx`, `PhaseRing.tsx`, `src/screens/TimerScreen.tsx`, `src/components/modes/ModeSheet.tsx`, `src/i18n/en.json`, `tr.json` | The finish review's eight fixes (§3.20). Stickers lift, through an opt-in shadow drawn inside the Svg. Facing Pages is rebuilt as the C4 sketch draws it, with the partner line on its right page. The Ring gets its paper partner strip and sizes itself to the height left. Today's row gets its label and goal cells. The Modes title is set in the system face, and Fly's tile stays visible. New strings: `today.label`, `today.left`, `spread.you`, `spread.doro`. |
| `src/screens/classic/__tests__/goalCellsLeft.test.ts`, `src/screens/__tests__/classic.test.tsx`, `src/components/icons/__tests__/Icon.test.tsx` | The finish review's fixes, tested. New: the goal-cell rule against §4.3's examples. Classic: the row's label and goal count; the partner line on Facing Pages' right page, facing and stacked; the Ring sized from its slot down to its floor, on a phone-sized window, since Jest's own window runs at font scale 2. Sticker: the lift drawn inside the Svg, and no lift without a shadow. |
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
| Build result | **Finished** 2026-10-30 21:17 UTC (00:17 UTC+3, 2026-10-31); EAS reports the source as `9f0de717` |
| TestFlight submission | `c2a26f6b-33a4-4dfb-9f49-fe14f2c9be62`, **finished**: EAS's `submit-ios` workflow started as the build completed and succeeded at 21:17:50 UTC |
| Tag | `v1.4.0-tf.49`, annotated in the tf.48 format, on `9f0de71`, **pushed**. The remote tag object is `82f66bc` and peels to `9f0de71`; the branch stays unpushed |

**Binary** (no budget exists; a measurement for E3, read like build 48's from the artifact's `Content-Length`):

| Build | IPA (B) |
|---|---:|
| 48 | 21,600,473 |
| **49** | **21,609,366** (+8,893 B, +0.04 % on 48) |

It carries the build 48 fixes and the reanimated welcome (§3.16). The device checklist is §6, "build 49". TestFlight lists the build once Apple finishes processing it.

### 3.18 The build 49 device check: one finding (F6)

**The owner, 2026-10-31:** "All well but one issue is the fly mode mode changer button should be at the top right of the screen where the compass is originally located."

F1, F2, F4 and F5 passed. F2 had been the one fix this machine couldn't prove (§3.16.1), and the phone settles it. F3 works, but in the wrong place.

| # | Finding | Cause |
|---|---|---|
| F6 | Fly's Modes button should be at the top right, where the compass was | Build 49 put it at the top leading corner, because the compass held the trailing one (§5). Classic has its Modes button at the top trailing corner, so the way back sat on the opposite side from the way in. |

**The plan, then the build:**
- **Where it goes.** The Modes button becomes the first chip in Fly's top-right control column, and the compass (and the camera button during a flight) moves one slot down, 8 pt under it. That is the plain reading of "where the compass is originally located": the button takes the compass's place, and the compass stays on the map, under it.
- **Why inside Fly's column, and not a button that floats over it.** In landscape the Fly sheet sits on the right. The column's `right` follows the sheet: 12 pt in portrait, then from 44 pt (just clear of the 32 pt peek strip) to the panel's width plus 12 as the sheet opens (`mapControlsAnimatedStyle`). A button that `TimerScreen` placed at `right: 12` couldn't follow that. It would sit on the peek strip, and over the corner of the open panel. So the button lives in `FlyModeScreen`'s column and slides with the compass.
- **What that costs.** The button is now inside Fly's `Suspense` boundary, so it doesn't exist while Fly's module evaluates on the first switch. ADR-0031 kept the switcher outside the boundary so the user could switch back during that wait. The wait is short: Hermes already ships the module in the one bundle, and only its evaluation is deferred (B1). The owner's placement outranks a way back during that split second. ADR-0031 gets a second as-built note.
- **How it looks.** Still Classic's 44 pt paper chip, with the token colours and the crisp edge, the same glyph and the same label. It has the compass's size and shape, but not the compass's shadow, since paper sits by tone and edge (DESIGN.md). The compass keeps v1's look until Fly is re-tokened (D2's `legacyColors` item), so the two chips differ in surface for now, the paper one above the v1 one.
- **Its contract.** It renders first in the column, has `accessibilityLabel` = `t('modes.button')` ("Modes" / "Modlar"), pushes `/modes`, and fires no haptic of its own, as in Classic. VoiceOver reaches it after the map, before the compass.
- **Its stacking order.** Build 49's button sat at zIndex 100, above everything Fly draws. The column was at 5, below `FlyTimerPill` (90), whose own comment claimed the controls were at 100. The pill's digits scale with Dynamic Type (`TimerText` sets no cap). At AX5 a centred "180:00" pill spans roughly 52–337 pt on a 390 pt phone, and the chip starts at about 334 pt, so the pill would paint over the way back for the whole flight. The column is now at 100, as the pill's comment says. Nothing else changes order. FlySheet is at 2. Fly's landing love note (`LoveNoteCard`, full-screen, no zIndex) was already under the column at 5, as it was under build 49's button. That stays as it was. Fly's re-tokening (D2) is the place to fix it.

| Change | Commit |
|---|---|
| `FlyModeScreen.tsx`: the Modes chip heads `mapControls` (`testID="fly-map-controls"`), and the compass takes `mapControlBtnGap`. `TimerScreen.tsx`: the floating Fly button and its style are gone, and the comment says where the button lives now. Tests: `flyModesButton.test.tsx` (new) renders the real Fly screen and checks that there is one Modes button, that it comes first in the column with the compass second, and that it pushes `/modes`. `flyLazyLoad.test.tsx` loses its press: its Fly stub has no button now, and its job is the lazy evaluation | `c935f3b` |
| `FlyModeScreen.tsx`: `mapControls` at zIndex 100, above the timer pill (the stacking order, above). The four Fly suites pass again (7 tests); lint clean on the file | `3a22768` |

**Guards** (after the move):

| Guard | Result |
|---|---|
| Jest | 47 suites, 353 tests, all passing (the new suite adds one test; the lazy-load test keeps its three) |
| Lint (`npm run lint`) | 0 errors, 31 warnings (unchanged) |
| TypeScript (`tsc --noEmit`) | Clean |
| React Compiler | 67 compiled, 6 skipped, no worklet-count change (unchanged) |
| Reassure (`npx reassure --branch`) | Unchanged: settings-only 1, Timer 13, Stats 1, Settings 2, Notes 1, leaf 12 |
| `check-docs` | 0 errors after `--write` (TRACEABILITY lists the new test) |
| iOS bytecode (`npx expo export --platform ios --dump-sourcemap`) | **4,044,240 B**: +676 B on build 49 (4,043,564 B). **4.88 % over** NFR-PERF-002's limit (4.86 % at build 49); E3 revisits |

**The bytecode command must keep `--dump-sourcemap`.** The same export without it wrote a 4,933,164 B `.hbc`, 22 % larger, under the same file name. Every figure in this record (§3.16.3, §4.1) used the flag, so only figures taken with it compare.

**The test's trace.** No SRS row covers the way back between modes. `flyModesButton.test.tsx` is tagged NFR-A11Y-003, for the two VoiceOver labels it asserts.

### 3.19 Build 50 (the owner's OK, 2026-10-31: "Build 50")

The question was "Build 50 with this fix and submit it to TestFlight?", so the OK covers the build and the submission. Builds 48 and 49 were asked with the tag push in the question; this one wasn't, so the tag was created but not pushed. The owner's next message, 2026-10-31, said "push the tag", and it was pushed.

| Item | Value |
|---|---|
| Commit | `98f6a1f` on `phase1/stage-d` (the branch stays unpushed). Since build 49's source (`9f0de71`), the only code change is F6 (§3.18): `c935f3b` and `3a22768`; the rest are records |
| Command | `eas build --platform ios --profile production --non-interactive --no-wait --auto-submit --json` |
| Pre-flight | The tree clean. `expo-doctor`: 19 of 20 checks pass; the one left is build 49's (§3.17) |
| Version and build | 1.4.0 (50); EAS incremented the remote build number from 49 to 50 |
| EAS build | `5ff314d5-d75b-4c6c-a62b-c86f25a59198`, queued 2026-10-31 08:26 UTC (11:26 UTC+3) |
| Build result | **Finished** 2026-10-31 08:32 UTC (11:32 UTC+3); EAS reports the source as `98f6a1f5` |
| TestFlight submission | `9a02ba7c-e87e-4acb-a11e-3e5609ae1014`, **finished**: EAS's `submit-ios` workflow started as the build completed and succeeded at 08:32:34 UTC |
| Tag | `v1.4.0-tf.50`, annotated in the tf.49 format, on `98f6a1f`, **pushed** after the owner's "push the tag". The remote tag object is `3922ebe` and peels to `98f6a1f`; the branch stays unpushed |

**Binary** (read from the artifact's `Content-Length`, as for builds 48 and 49):

| Build | IPA (B) |
|---|---:|
| 49 | 21,609,366 |
| **50** | **21,609,582** (+216 B on 49) |

It carries F6 and nothing else (§3.18). The device checklist is §6, "build 50". TestFlight lists the build once Apple finishes processing it.

### 3.20 The finish review (FINISH)

**Round 1, 2026-10-31: recapture.**
- **The evidence:** the owner's six iPhone captures from build 50: The Ring dark and paused; Facing Pages dark and light, paused; the Modes sheet over Classic and over Fly; Fly running. They passed the reviewer's evidence check.
- **Where they are:** untracked in `.impeccable/review/`, which is excluded locally (`.git/info/exclude`) because they're screenshots of the owner's phone.
- **Why the review stopped:** `app.json` ships iPad (`supportsTablet: true`, since v1.3.1), and no capture shows it. The brief promises a centred, readable width there (§6), and §3.9 and §3.13 record 560 pt.
- **Dropping iPad isn't open:** as far as is known, App Store Connect rejects an update that drops a device family the live version supports.
- **Asked of the owner:**
  - on an iPad: The Ring, Facing Pages and the Modes sheet, dark, in a paused session;
  - on the iPhone: idle with the presets, focus running, The Ring in light, and today's row after a completion.

**Round 2, 2026-10-31: fix.**
- **The owner's word on iPad:** "No iPad". The review then ran on the six iPhone captures. iPad stays shipped and is **unreviewed by capture**, a gap the owner accepted, so the reviewer judged regular width from the code only.
- **The rest was also judged from code:** idle, focus running, a break, completion, The Ring in light, landscape and Turkish at AX5.
- **Not read by the reviewer:** PRODUCT.md (it checked only that the file exists), the three Jest suites, `app/modes.tsx`, `app/love-note.tsx`, `sheetOptions.ts`, `TimerText.tsx`, the icons.
- **Keep, the reviewer's list:**
  - the Baloo timer as the only large thing, with its quiet rotated "Paused" stamp;
  - the exact `page` grounds;
  - one moving part;
  - the custom icons;
  - Fly's Modes button where the owner put it.

The eight material fixes are checked below against the two C4 sketches the owner picked (`art/review/c4-classic-ring.html`, `c4-classic-facing-pages.html`), DESIGN.md and the captures. None of the deviations was a recorded decision. `stickerShadow` is used nowhere in `src`.

| # | Finding | Disposition | The plan |
|---|---|---|---|
| 1 | Facing Pages: the spine frame covers the tops of both stickers | **Accept** | Rebuild the spread as the sketch draws it. Each page holds its label and its sticker at the top; the frame sits below the stickers; the right page's foot holds the partner line. The pages become absolute backgrounds behind a three-row content column (heads, frame, feet), so nothing overlaps a sticker by construction, with no measuring. VoiceOver keeps the frame first; the labels are decoration, and the line speaks. |
| 2 | The spread reads as three cards, not an open diary | **Accept**, in part | As the sketch draws it: outer corners 22, spine-side corners 8, each page tilted about its bottom spine-side corner (`transformOrigin`) by the brief's 1° (the sketch has 1.2°). The frame is filled in `page` with a 6 pt `page` halo that seats it on the spine, and bordered in `edge` (#8a). **Not taken: "the gutter closed to a spine".** The sketch keeps a gap between the pages (14 px), so the build keeps its 8 pt. |
| 3 | Stickers don't lift; in light the white die-cut edge vanishes into the paper | **Accept** | A soft shadow drawn inside the SVG: the art's silhouette in `stickerShadow`, offset 1 × 2 pt and blurred (`FeGaussianBlur`), under the art. It matches the sketch's `1px 3px 5px`. Not a view shadow: on a view with no background, iOS renders the shadow offscreen per sticker, the today row holds up to 16, and the ring repaints every frame during focus. It's opt-in (`lift`) on Pomo & Doro's poses and today's stickers, so the welcome's layered art is unchanged. The edge in light reads against the shadow, as in the sketch; the device check judges it. |
| 4 | Facing Pages has no partner slot: the pages hold only stickers | **Accept**, worded for brief §5 | "You" over Pomo on the left page, "Doro" over Doro on the right. The pair's line ("Pomo & Doro are studying with you", and its other states) moves to the right page's foot. The separate line under the spread goes. No "partner slot" text, which is the sketch's annotation: brief §5 says the slot "never promises pairing before pairing ships". New keys in English and Turkish, added to the copy table the owner reviews. |
| 5 | The Ring's partner strip lost the sketch's paper field, so the Ring page has no paper | **Accept** | One paper field (`paper`, an `edge` border, radius 22) holding a row: the pair at 40 pt, overlapping by 8 as in the sketch, then the line. No "partner slot" tag (#4). A single field on the page isn't a card inside a card. |
| 6 | Today's row has no label and no cells to fill, so "how today is going" doesn't read | **Accept**, with a goal rule | A "Today" label leads the row. Dashed cells stand for the sessions still needed for today's goal (§4.3), and filled stickers replace them as sessions complete. "+n" and the goal mark are unchanged. At 0 the dashed cells show. VoiceOver reads the count against the goal. The sketch's "3 of 4" text is not taken: the goal is in minutes, so a sessions count beside it would mislead. |
| 7 | Skip almost touches the tab bar, while a dead band sits above the cycle row | **Accept, with the cause corrected** | Measured in the captures, Facing Pages clears the bar by 16 pt (37 px), the page's bottom padding. So `insets.bottom` does include the bar, and B6's and the brief's M-5 claims hold. The Ring is the one that fails: its column is about 15 pt taller than the 852 pt screen, so it scrolls, its padding falls below the fold, and Skip's bottom edge meets the bar. **Fix:** the ring takes the height that is left. Its slot fills the column (`flexGrow: 1`, `flexBasis: 0`, with a floor), reports its height on layout, and the ring is the smaller of its width cap and that height. Before the first layout, and in Jest, the ring uses today's formula. **The band stays.** It is the presets' reserved height while running, the brief's "nothing jumps on Start" (§6). |
| 8 | Contract tokens and the Fly row | **Accept** a and b; **c in part** | (a) The spine frame uses `edge`, not `edgeStrong` (#2). (b) The Modes sheet title uses the system face; Baloo stays the timer's. (c) Fly's tile stays visible when Fly is selected: paper with an `edge` border on the selected row. No Fly sticker art exists, and the rules bar emoji and SF Symbols where custom art should be, so Fly as a sticker goes to D2 with Fly's re-tokening. |

**After the fixes:**
- **Guards:** Jest, lint, tsc, the React Compiler, Reassure, `check-docs`, and bytecode with `--dump-sourcemap`.
- **Build:** the owner's OK for build 51, with the tag push named in the question.
- **Evidence:** the owner recaptures the same six viewports.
- **Verdict:** the same reviewer scores each fix as resolved, partial or unresolved. Two rounds is the budget.
- **Then:** the documenter writes DESIGN.md, with the welcome exception.

**The fixes, as built** (the owner's OK, 2026-10-31: "Apply them"):

| Fix | Change | Commit |
|---|---|---|
| 3 | `Sticker.tsx`: an opt-in `shadow` (the theme's `stickerShadow`). The art's silhouette is drawn first, in the token's colour with its alpha on the group, offset 1 × 2 pt and blurred by `FeGaussianBlur` at a 1.5 pt deviation. The Svg grows by 12 % of the width on each side for the blur and gives that back in negative margins, so layout doesn't move. `PoseSticker` always lifts; today's stickers lift; the welcome's layers and the Modes sheet's mark don't. | `3fd834a` |
| 1, 2, 4, 8a | `SpreadPages.tsx`, rebuilt. The pages are absolute paper behind three rows (heads, the frame, feet): outer corners 22, spine corners 8, each leaning 1° about its bottom spine-side corner (`transformOrigin`). The heads carry "You" over Pomo and "Doro" over Doro (stickers 34 % of the page, at most 64 pt). The frame is filled in `page`, bordered in `edge`, and seated in a 4 pt `page` halo. The right page's foot holds the pair's line, which `TimerScreen` no longer draws under the spread. Stacked at AX sizes, Doro's page carries the line. | `3fd834a` |
| 5, 7 | `TimerScreen.tsx`. The Ring's partner strip is one paper field (radius 22, `edge`): the pair at 40 pt, Doro tucked 8 pt behind Pomo, and the line in `ink`. The Ring sits in a slot (`flexGrow: 1`, `flexBasis: 0`, a 200 pt floor) whose height, reported on layout, sizes it: the smaller of its cap (86 % of the column, at most 340 pt) and the slot. Before the first layout, at AX sizes and in landscape, the old rule. **The goal moment doesn't move the ring:** for its 1.4 s under today's row, the slot keeps the ring's height and its reports are ignored. The page scrolls for that moment, as it did before, and the timer doesn't shrink and grow back during the sticker placement. | `3fd834a` |
| 6 | `TodayStickers.tsx`: the "Today" label leads the row, and `goalCellsLeft` (§4.3) gives the dashed cells, capped at the row's two rows (none once "+n" fills them). Stickers replace dashed cells one for one, so the row keeps its height through the day. With a goal, the cells explain the empty row. With no goal, one dashed cell and the critique's sentence sit beside each other in the row. VoiceOver adds "2 more for today's goal". | `3fd834a` |
| 8b, 8c | `ModeSheet.tsx`: the title is set in the system face (22 pt, bold). Fly's tile is paper with an `edge` border on the selected row, and stays `primarySoft` otherwise. | `3fd834a` |

**Guards** (after the fixes):

| Guard | Result |
|---|---|
| Jest | 48 suites, 361 tests, all passing (+1 suite, +8 tests) |
| Lint (`npm run lint`) | 0 errors, 31 warnings (unchanged) |
| TypeScript (`tsc --noEmit`) | Clean |
| React Compiler (`node scripts/react-compiler-report.js`) | 67 compiled, 6 skipped, no worklet-count change (unchanged) |
| Reassure (`npx reassure --branch`) | Unchanged: Timer 13, Stats 1, Settings 2, Notes 1, leaf 12, settings-only 1. Jest's window runs at font scale 2, where the Ring keeps its fixed rule, so the slot's one extra render at mount isn't in these counts |
| `check-docs` | 0 errors after `--write` |
| iOS bytecode (`npx expo export --platform ios --dump-sourcemap`) | **4,050,408 B**: +6,168 B on build 50 (4,044,240 B). **5.04 % over** NFR-PERF-002's limit of 3,856,208 B (4.88 % at build 50); E3 revisits |

**What only the phone can show:**
- whether `FeGaussianBlur` blurs on iOS (Jest renders the filter's props, not its pixels);
- whether the Ring now clears the bar;
- how the spread reads.

The build 51 checklist is §6. **Jest's window** is the preset's 750 × 1334 at font scale 2 (an AX size), so most Classic tests render the stacked spread and the Ring's fixed rule. The new tests set a 393 × 852 window at font scale 1 for the facing spread and the slot.

**No build for the fixes alone.** The owner, 2026-10-31, asked whether to build 51: "Not yet we will test the results on the next step with the next steps additions". The fixes ship in the next build, alongside D2's first additions. That build's device check covers §6 "build 51" as well, and the owner retakes the six captures there. The reviewer's verdict pass then scores the eight fixes on them. The documenter runs after that verdict, so DESIGN.md is written from the reviewed build. D1's FINISH stays open until then.

**The welcome: captures waived by the owner,** 2026-10-31: "i confirm it no ned for an extra screen rocording all works well". The welcome gets no finish-review captures, so its verdict is the owner's, from the device checks of builds 49 and 50 (§6). The documenter still carries its exception into DESIGN.md (§1).

### 3.21 The verdict pass: fix, for the Ring's height

**The owner, 2026-11-01:** "This looks nice. Here you go", with eight captures from build 55, then the same eight again ("All photos you asked"; identical by SHA-1). Four are D1's.

**The evidence:** twelve iPhone captures, kept untracked in `.impeccable/review/d1/` (excluded locally, as round 1's six are).
- **Build 55, light:**
  - Facing Pages idle on a short break, which is also the shadows in light. It was sent twice; the two copies differ only in the tab-bar band.
  - The Modes sheet over Classic, and over Fly.
- **Build 53, dark,** with the current shadow (D2 record §3.17):
  - the Ring with a break running;
  - the Ring idle, with the presets;
  - Facing Pages idle on a break;
  - Fly running in landscape.
- **Build 52, dark:**
  - Facing Pages paused. Its shadow is the superseded blur, so it's used only for the paused state.
  - The Modes sheet over the Ring.

The build 55 captures show a break at 01:00, not the paused session round 1 asked for. They still serve the spread, the shadows, the labels and the sheet.

**How it ran:** the same reviewer, resumed with rounds 1 and 2, scored the eight fixes. It was told what had changed since:
- the shadow's three stroke layers (build 53);
- Fly's ink timer and its 120 pt peek (build 53);
- Classic in landscape and the status-bar band (build 54).

| Fix | Verdict | Evidence |
|---|---|---|
| 1. The frame covered the stickers | **Resolved** | The light (build 55) and dark (build 53) spreads: "You" over Pomo and "Doro" over Doro at the top of the pages, the frame below both |
| 2. The open diary | **Resolved** | Round outer corners, tight spine corners, the pages leaning from the spine, the frame seated in a page-coloured band. It reads as one diary |
| 3. The sticker lift | **Resolved** | Light: a soft shadow, down and to the right, under Pomo, Doro and today's stickers, and the white edge reads off the paper. Dark: no square |
| 4. The partner slot | **Resolved** | The pages are labelled; the pair's line is on the right page's foot; nothing sits under the spread |
| 5. The Ring's paper strip | **Resolved** | One paper field, radius 22, in both Ring captures |
| 6. Today's row | **Resolved** | "Today", dashed cells up to the goal, stickers replacing them in order. With the 1-minute Custom preset the cells fill both rows, which is correct by the rule |
| 7. Clearance above the tab bar | **Partial** | Facing Pages: Skip about 18 pt clear of the bar, nothing scrolls, the dead band gone. **The Ring: unresolved, and worse than build 50** (below) |
| 8a. The frame's stroke | **Resolved** | `edge`, not `edgeStrong` |
| 8b. The Modes title | **Resolved** | Set in the system face |
| 8c. Fly's tile when selected | **Resolved** | The paper tile shows on the selected row |

**The Ring doesn't fit an 852 pt iPhone at the default text size.** Checked here against the captures and the code:
- **Running** (build 53, a break): Pause ends about 18 pt above the bar, and the top of the Skip pill shows behind the bar. Skip is off the screen.
- **Idle** (build 53): the page sits scrolled by about 55 pt, so the phase line and the Modes button are under the clock and the battery. Build 54's band hides the collision, not the overflow.
- **Paused** (build 52): the same overflow.
- **The ring never shrinks.** It's 297 pt (696 px at 2.35 px/pt) in every Ring capture, which is `ringCap`: 0.86 × the 345 pt column.

**Why the ring never shrinks:**
- The slot (`flexGrow: 1`, `flexBasis: 0`, `minHeight` 200) sits in `centre`, `column` and the page, all `flexGrow: 1` inside the ScrollView.
- Flex can hand the slot only spare height.
- The first layout draws the ring at min(`ringCap`, 0.36 × height), 297 pt on an 852 pt phone. At that size the page is already taller than the screen, so there's no spare height.
- The slot therefore takes the ring's own height and reports it back, and the ring stays at 297. It's a fixed point, not a fit.

**Why it went unseen:**
- **The tests passed** because `classic.test.tsx` fires the slot's `onLayout` by hand with a chosen height. That tests the arithmetic, not Yoga's layout inside a ScrollView.
- **It's worse than build 50** because fixes 5 and 6 made the strip and today's row taller, counting on the ring to give the height back.
- **Builds 54 and 55 are the same.** Since build 53, portrait Classic changed only by the band (`git diff v1.4.0-tf.53 HEAD`: `topRow` became a const with the same markup; the rest is landscape).

**The proposed fix** (waits for the owner's OK):
1. **Measure what the page lacks.** The ScrollView reports its visible height (`onLayout`) and its content's height (`onContentSizeChange`).
2. **The room:** the slot's height − max(0, content − visible).
   - When the page fits, the slot already holds the spare height and nothing is lacking.
   - When it overflows, the ring gives up exactly the overflow.
3. **The ring:** clamp(room, `MIN_RING` 200, `ringCap`). Below 200 the page scrolls, as it does at AX sizes.
4. **The goal moment** still holds the ring's size for its 1.4 s.
5. **The visible height** must end at the tab bar, as the device shows: Facing Pages clears the bar by exactly the page's 16 pt bottom padding. The build checks it before relying on it.
6. **Tests:** fire the ScrollView's two events with an overflowing content height, and assert that the ring shrinks by the overflow.
7. **The device check:** the Ring idle, running and paused, dark, at the default text size. Skip clears the bar by about 16 pt, and the phase line sits at its normal height.

The reviewer suggested measuring each sibling instead. That comes to the same number with more measurements.

**Keep, confirmed and amended, for the documenter:**
- **The timer:** Baloo 2 SemiBold with tabular figures is the only large type. Everything else, sheet titles included, is in the system face.
- **Paused:** a quiet "Paused" stamp, an outline in `primaryInk` rotated −3°.
- **The grounds:** exactly `page`, #FFF6F1 light and #221726 dark.
- **One moving part:** during focus, only the ring or the spine's progress bar moves.
- **Facing Pages:**
  - outer corners 22, tight spine corners, the pages leaning from the spine;
  - the frame seated in a page-coloured band, covering no sticker;
  - "You" and the partner's page labelled, with the pair's line on the right page's foot.
- **The Ring:** one paper partner strip (radius 22, `edge`, no shadow).
- **Today's row:** "Today", dashed cells up to the goal, and stickers replacing them in order, wrapping in whole cells to two rows and then "+n".
- **Stickers are the only things that lift:** a white die-cut edge and a soft shadow in `stickerShadow`, drawn as a three-layer silhouette inside the SVG. Never an SVG blur filter on iOS.
- **Icons and tint:** custom filled icons, and the selected tab in `primaryInk`.
- **The Modes button:** the same paper button in Classic and at Fly's top right.
- **The motion table:**
  - The sticker placement keeps the one bounce.
  - It gains a "Welcome (once)" row, the owner's exception (build 49, F5): squash and stretch, its own bounce, and one burst of at most 12 sparkles. Under Reduce Motion it falls back to opacity only.

**Disposition: fix,** with one open item, the Ring's height.
- Two rounds was the budget, and this pass is the third look.
- iPad's regular width stays unreviewed by capture (the owner: "No iPad").

### 3.22 The Ring's height, rebuilt

**The owner, 2026-11-01:** "Do the both fixes and we will also move to the next step".

| File | Change |
|---|---|
| `TimerScreen.tsx` | **The ring sizes from its neighbours, not its slot.** Five elements report their heights on layout into a ref: the ScrollView (`classic-page`), the phase line's row, the partner strip, today's row and the controls. Once all five are in, on the Ring, the room is computed (§4.4) and kept in state. The slot keeps `flexGrow: 1` only to centre the ring once it reaches its cap; its `flexBasis: 0`, `minHeight` and `onLayout` are gone. Before the first measurements, an estimate from build 53's captures stands in |
| `TodayStickers.tsx`, `ClassicControls.tsx` | An `onLayout` prop on the root, and the test IDs `today-row` and `classic-controls` |
| `classic.test.tsx` | Three tests replace the slot test: (1) the room from the neighbours, in any order of arrival (232 pt, then 266 when today's row drops to one row); (2) the floor (200) and the cap; (3) the goal moment holding the ring, which then gives up the row that wrapped (232) |

**Built: the reviewer's variant, not §3.21's proposal.**
- The proposal took the slot's height less the overflow. Those two numbers arrive as separate layout events, so one new and one stale gives a wrong room. A new slot height with the old overflow would halve the ring for a frame.
- The four rows around the ring don't depend on its size: their widths are the column's. So their sum settles in one pass, whatever order the events arrive in.
- Measuring the ring's own slot was the circular part (§3.21).

**What stays as it was:**
- **No jump on Start or Pause.** The controls already keep one height across idle, running and paused: the presets and the cycle row share a reserved row, and Skip and End sit side by side.
- **The partner strip's 72 pt minimum** holds both its one-line and two-line text at the default text size.
- **The goal moment (1.4 s):** today's row isn't re-measured, so the ring holds and the page scrolls for that moment, as before.
- **AX sizes and landscape** keep their own rules.

**One new behaviour:** when today's row first wraps onto its second row (the eighth cell on a 393 pt phone), the ring gives up that row's 34 pt at the completion that wraps it. The comment in `TodayStickers.tsx` now says so.

**Measurements and renders:**
- The rows are measured in every Classic layout, so switching from Facing Pages to the Ring finds them already measured.
- The ring's state changes only on the Ring, and only when the room changes by a whole point.
- The handlers are inline `onLayout` arrows. A curried `measure(row)` called during render tripped `react-hooks/refs`: the compiler took its ref access for render-time access.

**Guards:**

| Guard | Result |
|---|---|
| Jest | 56 suites, 410 tests, all passing (+5: Classic +2 net, Stats +3) |
| Lint | 0 errors, 29 warnings (unchanged) |
| tsc | Clean |
| React Compiler | 81 compiled, 5 skipped (unchanged) |
| The emoji check | Clean |
| Reassure | Unchanged: Timer 13, Stats 1, Settings 1, Notes 1, leaf 12, settings-only 1. Jest fires no layout events, so the measurements add no render there |

**What only the phone can show:**
- **Whether the ScrollView's layout height ends at the tab bar.** The device says it does: Facing Pages clears the bar by exactly the page's 16 pt bottom padding, and the screen pads its foot by `insets.bottom`, which includes the bar.
- **The first frame at launch,** where the estimate stands in for the measured room.

The device check is §6 "The Ring's height".

### 3.23 The verdict on build 56: ship

**The evidence:** the owner's build 56 captures, 2026-11-01. Three Ring captures in English (idle, running, paused) and two in Turkish (running, paused), with Turkish Facing Pages, all at 1179 × 2556 (3 px/pt).

**The same reviewer, resumed, re-scored fix 7: resolved.** Measured from the pixels:
- **The ring:** 825 px, or 275.0 pt, in every state and both languages, and a true circle (x 177–1001 at y 794; y 382–1206 at x 590). That's below the 297 pt cap, at 70 % of the 393 pt width.
- **Nothing scrolls:** the phase line's glyphs sit at y 260–282 and the ring's top at y 382, as on build 50's unscrolled page.
- **Skip clears the bar by 16.0 pt:** its bottom is at y 2258 and the bar's outline starts at y 2307. My 18 pt reading had counted the bar's faint outer band.
- **Every control shows in every state:** the presets, Start focus and Skip; the cycle dots, Pause and Skip; Resume, Skip and End session.
- **Turkish:** "Duraklatıldı" fits inside the ring; Facing Pages' line wraps to three lines with no sticker covered; "Atla" clears the bar by the same 16 pt.
- **Not seen:** today's row on two lines. The arithmetic (§4.4) leaves the ring at about 241 pt there, above the 200 pt floor.

**Fixes 1–6 and 8** still hold. **Regressions:** none. The band between today's row and the cycle dots while running is the presets' reserved height, by design.

**Disposition: ship,** for the eight scored fixes.
- Still unseen by capture: iPad's regular width (accepted by the owner), the two-line today row, the accessibility sizes and Classic in landscape. Those were judged from code and the owner's device checks.

**The keep list, amended for the documenter:** §3.21's list, plus the Ring's sizing rule. The Ring sizes from the height its neighbours leave, clamped between 200 pt and `ringCap` (275 pt on a 393 × 852 pt iPhone). Below the AX sizes the page never scrolls, and Skip sits about 16 pt above the tab bar.

**Next:** the documenter writes DESIGN.md, from both verdicts (D1's and D2's), with the "Welcome (once)" row.

### 3.24 DESIGN.md, written from the shipped D1 and D2

`impeccable-documenter` rewrote `DESIGN.md` from the code and both keep lists, and wrote its sidecar `.impeccable/design.json` (Midnight Plum's values and the colour metadata).

**Kept:** the PINNED DIRECTION block, the North Star "The Sticker Diary", the Overview, every named rule and every Do and Don't.

**Resolved from code:** every "[to be resolved during implementation]" marker.
- Spacing: 4 / 8 / 12 / 16 / 24 / 32.
- The edge: 1.5 pt.
- Icons: 2 pt rounded strokes, built to filled shapes.
- The timer: 25 % of the ring, or 56 pt on Facing Pages.
- Titles 34/42, the welcome line 28/36, today's postcard 22/28; system text 18 / 17 / 16 / 15 / 13.
- The frontmatter carries Strawberry Milk's 25 roles, keyed by `palette.json`.

**Added:**
- **From the keep lists:** the One Large Number rule (Classic), the Paused stamp, the Exact Ground rule, one moving part, the Ring's sizing rule, Facing Pages' geometry, today's row, the Modes button, the postcard stack (±0.6° tilt) and Settings' grouped list.
- **The Locale Casing rule:** no style upper-cases text (`a21939b`).
- **The motion table:** the sticker placement stays the one bounce (450 ms, damping ratio 0.75, 12 particles of a cap of 24). It gains the **"Welcome (once)"** row, the owner's exception: 4.2 s, squash and stretch, its own rebound, 10 sparkles of a cap of 12, opacity only under Reduce Motion. A "Tutorial (first run)" row follows with D5.
- **Spot-checked against code:** the welcome's `PARTICLE_COUNT` is 10, and the sticker burst draws 12.

**Deviations it states rather than hides:**
- **The tab bar** is NativeTabs' system bar, Liquid Glass on iOS 26: the platform's own chrome, beside the No Glass Rule.
- **Sheets** use the system's form-sheet motion, not the seed's custom spring.
- **The Modes button** is a bare glyph in a 44 pt target on Classic, and a paper disc over Fly's map. The keep list's "same paper button" holds only for the place.
- **"The only large type"** holds on Classic. The D2 screens' titles are Baloo 2 at 34 pt.

**Drift it found and left, for later:**
- `src/theme/tokens.ts` still holds v1's greys, purple gradients and `ValentineSpec`.
- Fly's map buttons carry a black view shadow and Android `elevation`.
- The Baloo2-Medium font ships unused.

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

### 4.3 Today's goal cells (finish review fix #6)

Today's row shows a dashed cell for each focus session still needed to reach today's goal, and filled stickers for the sessions done.

Notation:
- G is today's goal in minutes: the day's snapshot `days[today].goalMinutes`, or `goalMinutes` when the day has none.
- M is today's focus minutes, `days[today].focusMinutes`.
- F is the current focus length in minutes, `settings.durations.focus`.
- n is today's focus sessions.
- C is the row's capacity, two rows of cells, `perRow × 2`.
- s is the cells taken: n, or C once n > C (C − 1 stickers and the "+n" cell).

The empty cells are

  e = 0 when the goal is reached, or G ≤ 0, or F ≤ 0;
  otherwise e = min(⌈(G − M) / F⌉, C − s), floored at 0.

Using minutes left, not ⌈G / F⌉ − n, keeps the count right when today's sessions had other lengths: after a 50-minute session against a 50-minute goal, no cell is left whatever F is now. The cap keeps the row inside its two rows, so a 1-minute focus against a 50-minute goal fills the row with dashed cells and never overflows it.

Examples, with C = 16:
- G = 50, F = 25, M = 0: e = 2.
- G = 50, F = 25, M = 25, n = 1: e = 1.
- G = 50, F = 1, M = 1, n = 1: e = min(49, 15) = 15.
- The goal reached: e = 0, and the goal mark follows the stickers.

### 4.4 The Ring's height (§3.21, §3.22)

Portrait, below the AX sizes, the Ring's diameter is the height its neighbours leave.

Notation:
- V: the ScrollView's visible height, its layout height. The screen pads its foot by `insets.bottom`, which includes the tab bar.
- t: the status-bar inset, `insets.top`.
- P: the page's fixed spacing, 88 pt: 8 under the status bar, 16 at the foot, and four 16 pt gaps (two in the column, two in the centre).
- h_top, h_partner, h_today, h_controls: the four rows' measured heights.
- R_cap: 0.86 × the column's width, at most 340 pt; 297 pt on a 393 pt phone.
- R_min: 200 pt.

The room and the diameter:

  r = ⌊V − t − P − h_top − h_partner − h_today − h_controls⌋
  D = max(R_min, min(R_cap, r))

When r ≥ R_min, the page's height t + P + (the rows) + D is at most V, so nothing scrolls, and Skip ends 16 pt above the bar. When r < R_min, the page scrolls by R_min − r (an iPhone SE).

**Before the rows are measured,** r is estimated as H − t − b − P − 346, where H is the window's height and b is `insets.bottom`.
- 346 pt is the rows' sum at the default text size with the default goal (one row of cells).
- **It comes from build 53's captures:** the Ring there was 297 pt and overflowed by 54 pt (Skip's 44 pt, the 12 pt gap and the 16 pt padding, less Pause's 18 pt clearance), so its room was 243 pt.
- With V = 770 and t = 59, the rows summed to 770 − 59 − 88 − 243 = 380 pt with two rows of cells, which is 346 pt with one.

**Example,** build 53's iPhone (393 × 852, t = 59, V = 770):
- one row of cells: r = 770 − 59 − 88 − 346 = 277, so D = 277;
- two rows (the owner's 1-minute Custom): r = 243, so D = 243.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| The love-note sheet stays until it is dismissed | Keep v1's 8 s auto-close | A sheet that closes itself takes the text away from someone reading at a large size (WCAG 2.2.1, Timing Adjustable). The interstitial already waits for the sheet to close, so the ad policy is unchanged. |
| Run stage-d's Impeccable launcher, not stage-c's | Use the base directory the Skill tool reports | The copies are identical; stage-d's own launcher keeps every read and write inside this worktree. |
| Build 49, F4: Custom stores its own durations beside the active ones | (a) Custom as the absence of a match, which build 48 had. (b) A Custom segment that opens Settings | (a) loses the typed durations the moment a preset is chosen: the owner's "useless". (b) makes one segment an action among selections. Storing `customDurations` keeps them, and the engine still reads only `durations`. |
| Build 49, F3: Fly's Modes button at the top leading corner (**superseded by F6**, below) | Move Fly's compass; keep the old pill | The compass belongs to the map and has its own landscape placement (FlySheet). The pill was a second way to switch modes, with emoji. |
| After build 49, F6: the Modes button heads Fly's map-control column, top right, with the compass under it | (a) Keep it in `TimerScreen`, outside `Suspense`, at the top right. (b) Swap: the compass to the top left. (c) The compass on top, Modes under it | (a) can't follow the column's landscape slide, so it would sit on the sheet's strip and panel. (b) moves a map control away from the map's other controls and its landscape placement. (c) isn't "where the compass is". Being inside the boundary costs only the moment while Fly's module evaluates (§3.18). |
| Build 49, F5: a keyframed timeline on one shared value | Springs per element; Lottie | One driver keeps every layer, the arcs and the haptic's frame in step and testable. Lottie would mean new art outside VectorCraft. Springs can't be audited beat by beat, nor sampled for the owner's preview. |
| Build 49, F5: the cover turns with `rotateY` in perspective | Keep build 48's `scaleX` | A flat scale reads as a squash, which was the device check's open question. A turn about the spine is how a book opens, and React Native's matrices match the preview's CSS. |
| Build 49, F5: About replays the welcome now | Wait for D2 | The owner's phone has already seen build 48's welcome, so without a replay the rebuilt one couldn't be checked on build 49. |

## 6. Verification

- [x] The Classic and welcome contracts each have all six blocks and their seed references.
- [x] DESIGN-WORKFLOW §2 steps 1–6 for both surfaces (§0, §3.1–3.13).
- [x] The guards in the [Stage D plan §3.6](2026-10-30-phase1-stage-d.md#36-guards-green-at-every-commit), green at every commit.
- [x] **The owner's review of the Turkish copy:** every string in `src/i18n/tr.json`, which build 48 carries. Done 2026-10-31 on the copy proof page, together with D2's: D1's strings all confirmed (D2 record §3.15).
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
- [x] **The device check, build 49** (`v1.4.0-tf.49`), for the build 48 findings (§3.16). The owner, 2026-10-31: "All well", except F3's position, now F6 (§3.18):
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
- [x] **The device check, build 50** (`v1.4.0-tf.50`), for F6 (§3.18). The owner, 2026-10-31: "all cheks are passed all well":
  1. In Fly, portrait: the Modes button is at the top right, and the compass is under it, 8 pt apart. During a flight, the camera button comes third.
  2. In Fly, landscape: the column sits just left of the sheet's strip, and it slides left with the sheet as the sheet opens. The Modes button never covers the sheet.
  3. The button opens the Modes sheet, Classic returns from it, and VoiceOver reads "Modes" (Turkish: "Modlar").
  4. Light and dark: the paper chip above the compass reads as intended (the compass keeps v1's look until D2).
  5. During a flight at the largest text size: the timer pill never covers the Modes button.
- [x] **The device check, build 51** (`v1.4.0-tf.51`, built from `d96eb7c` and submitted to TestFlight on 2026-10-31, with D2's build; D2 record §3.10), for the finish review's fixes (§3.20). The owner retakes the six captures, which go to the reviewer for its verdict. **Scored on 2026-11-01, on captures from builds 52–55 (§3.21):** items 2–6 pass. Item 1 fails: the Ring overflows, and Skip is behind the bar while a session runs.
  1. **The Ring, paused, dark** (`phone-ring-dark-paused`): Skip clears the tab bar by about 16 pt, and the page doesn't scroll. The ring is a little smaller than build 50's. Pomo & Doro and their line sit on one paper strip.
  2. **Facing Pages, paused, dark and light** (`phone-spread-dark-paused`, `phone-spread-light-paused`): "You" over Pomo and "Doro" over Doro at the top of the pages. The timer's frame sits below them and covers neither. The pair's line is on the right page's foot. The pages lean in from the spine, with round outer corners and tight spine corners, and the frame is seated in a band of the page colour. Nothing scrolls, and Skip clears the bar.
  3. **The shadow,** both themes: every Pomo, Doro and today's sticker casts a soft shadow, down and to the right. It must be blurred, not a hard copy of the shape (the blur filter's first time on the device). In light, the white edge reads off the paper.
  4. **Today's row:** "Today", then the stickers, then dashed cells up to the goal, filling as sessions finish. The ring keeps its size when a session completes and through "Goal reached".
  5. **The Modes sheet over Classic and over Fly** (`phone-modes-sheet-over-spread-dark`, `phone-modes-sheet-over-fly-dark`): the title is set in the system face. With Fly selected, Fly's icon keeps a paper tile.
  6. **Fly running** (`phone-fly-dark-running`): unchanged; the Modes button stays at the top right.
  7. Not captured, worth a glance: The Ring while focus runs ("Break at …" inside the ring), and both layouts in landscape (Facing Pages may scroll there now; record it if it does).
- [x] **The Ring's height** (§3.21; rebuilt in §3.22; **passed**, §3.23), on build 56 (`v1.4.0-tf.56`, D3 record §3.5): the Ring idle with the presets, running and paused, dark, at the default text size. Skip clears the bar by about 16 pt, the phase line sits at its normal height, and nothing scrolls.

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

**Added for the finish review (§3.20):**

| Key | English | Turkish (draft) |
|---|---|---|
| `today.label` | Today | Bugün |
| `today.left` | {{count}} more for today's goal | Bugünün hedefi için {{count}} oturum daha |
| `spread.you` | You | Sen |
| `spread.doro` | Doro | Doro |

## Backlinks
<!-- backlinks:start -->
- [Load Fly Mode lazily](../architecture/adr/0031-lazy-fly-mode.md)
- [An in-house translator over i18next, for English and Turkish](../architecture/adr/0048-in-house-translator.md)
- ["Phase 1 D2: Stats, Settings and Notes rebuilt in the Sticker Diary design, the gift screen retired"](2026-10-31-phase1-d2-screens.md)
- ["Phase 1 D3: every string in English and Turkish, a raw-text check, and the in-app language choice"](2026-11-01-phase1-d3-en-tr.md)
- ["Phase 1 D5: the general tutorial, Pomo & Doro show you around"](2026-11-01-phase1-d5-tutorial.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
