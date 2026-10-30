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
- **No `react-i18next`:** `t()` is i18next's own, bound once and initialised synchronously with both resources bundled. Calling it in render is pure, so it adds nothing to the Reassure counts and no bytecode for a binding library.
- **Turkish casing** goes through `upper()`, with `toLocaleUpperCase('tr-TR')`.
- **Versions:** `i18next` 26.4.6 (15 October) and `expo-localization` 58.0.4 (9 October) are pinned exactly. Newer releases exist, the newest published today, but each pin is at least two weeks old.
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
