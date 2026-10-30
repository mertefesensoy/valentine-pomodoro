---
id: IMPL-2026-10-30-phase1-stage-d
title: "Phase 1 Stage D (D1–D4): the screens in the Sticker Diary design, plan"
status: in-progress
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-30-phase1-stage-c-design, DESIGN-WORKFLOW, ADR-0042, ADR-0045, ADR-0046, ADR-0047, ADR-0027, SRS]
---

# 2026-10-30 — Phase 1 Stage D (D1–D4): the screens in the Sticker Diary design

**Status:** Plan, committed before any other file on the branch. Each task gets its own record when it starts (§3.8). This document holds the stage plan, the order, the gates, the guards and the shared-doc text.
**Branch:** `phase1/stage-d`, worktree `C:\vp\stage-d`, cut from `rehaul/v2` at `ed8ab00` (pushed; Stage C is merged into it, `2a7be02` is an ancestor). Commits use `git commit -- <paths>`; new files get a `git add` first. Merging into `rehaul/v2`, pushing (by explicit commit ID), EAS builds and TestFlight submissions each need the owner's explicit OK, every time.
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md) Stage D (D1–D4) and Stage E; [Stage C record](2026-10-30-phase1-stage-c-design.md) §2.4–2.6 and §10.

---

## 0. Read this first

- **The goal is a magnificent design.** The app must read as a product, never a school project or a template. The direction is pinned and approved: "The Sticker Diary", kawaii, for couples who study together, with no tomato anywhere ([`DESIGN.md`](../../DESIGN.md), [ADR-0047](../architecture/adr/0047-same-page-mark-and-the-colon-characters.md)). Nothing here re-opens it.
- **Set-up, 2026-10-30:**
  - The worktree was cut from `ed8ab00`, and `npm ci` exited 0.
  - The Apple HIG skill is cloned at `dickwu/apple-design-skill@ff4ebdd` into `.claude/skills/apple-design/`. It is git-ignored (`.gitignore:53`) and never committed.
  - Impeccable's engine binary was copied from the main checkout. Its SHA-256, `8f61e96b…5d9f`, matches `engine-checksums.txt` (0.1.18, `impeccable-windows-x64.exe`).
- **Where this session runs, said plainly.** The handover asked for a session started inside `C:\vp\stage-d`. This one started in `C:\vp\stage-c` and was moved into `C:\vp\stage-d` by the app's change-directory tool during its first turn.
  - The skills it lists (`impeccable`, `apple-design`, `animate-expo`, `review-animations`, `break-ui`) were discovered at start-up from stage-c's copies. Those carry the same pins: Impeccable 4.8.0 and Emil's pack are committed, and the HIG skill is `ff4ebdd`.
  - The first `/impeccable` call in D1 confirms that it reads and writes stage-d's `.impeccable/`. If `/impeccable`, `/apple-design` or `/animate-expo` fails to resolve, work stops and the failure is reported, never worked around.
- **What does not change in Stage D:**
  - the session engine, the clock store (B4) and the storage migration (B2)
  - Android, which is deferred
  - the ad policy, with AdMob staying on 16
  - ADR numbering: new ADRs start at **ADR-0048**
  - the shared docs (§9)
  - and no tomato, clock or heart in the mark, and no mascot that sulks, cries or nags.
- **Two lines of the handover pull against each other,** and this is how they are read. "A ROADMAP row in the same commit as the work" meets "don't edit shared docs while you are on a branch". As in the Stage C record §9, the ROADMAP row and every other shared-doc change are written as ready-to-paste text in §9 **in the same commit as the work**, then applied at the merge with the owner's OK. The owner may object to this reading.
- **Known traps on this machine:**
  - `core.autocrlf` is true, so Python's text-mode writes produce CRLF. Scripts write bytes or `newline='\n'`.
  - Heredocs with quotes or backticks break the Bash tool, so scripts go in files.
  - The browser pane can generate `.claude/launch.json` and rewrite `tsconfig.json`. This project is never `preview_start`ed, and any `tsconfig.json` change is reverted.
  - The OneDrive checkout breaks Metro, so everything builds from `C:\vp`.
  - Device checks run on TestFlight only, because there is no Mac.

## 1. Problem / Motivation

Stage C produced an approved design system that no screen uses yet: the tokens, Baloo 2, the Classic brief, the mark, Pomo & Doro and 50 icons. Every screen still draws the v1 look: purple aurora gradients, grey text, system blue for the selected tab, emoji as icons, and stacked modals.

| Task | What is missing today | Requirements |
|------|----------------------|--------------|
| **D1, Classic** | `useTheme` still returns the v1 `tokens.ts`. The timer is the system font. The tab bar is system blue with SF Symbols. There are no presets beyond the settings fields and no second layout. The goal popup and the love note are stacked overlays. `expo-blur` is unused. The new app icon and splash have never shipped in a build. | FR-SET-002, NFR-UX-003, NFR-PERF-004, NFR-A11Y-002, NFR-A11Y-004, NFR-I18N-001 (the face), NFR-PERF-003 (held) |
| **D2, Stats, Settings, Notes, Gift** | The v1 styling. 51 emoji glyphs in 16 files, some of them as icons. Default notes that name Bengisu. A gift screen "for Bengisu". | NFR-UX-002, FR-NTE-002, NFR-UX-003 |
| **D3, EN/TR** | Every string is an English literal. There is no Turkish and no `tr-TR` casing. | FR-SET-005, NFR-I18N-001, NFR-A11Y-003 |
| **D4, sounds** | Settings has a sound toggle (FR-SET-001) but no sounds (DEF-007's sound half). `fly-ambient.m4a` is 1.2 MB. | FR-SET-004, NFR-PERF-005 |

## 2. What Changed

**Planned files.** This table is filled in as each task lands, and each task's record has its own.

| File | Task | Change |
|------|------|--------|
| `docs/implementations/2026-10-30-phase1-stage-d.md` | — | This plan. |
| `.impeccable/surfaces/app-tabs-index-tsx.md` | D1 | The direction contract, appended before any code. |
| `src/theme/useTheme.ts`, `src/theme/legacyColors.ts` | D1 | The switch to `palette.ts`, plus a transitional adapter for the screens D2 has not rebuilt yet (§3.2.2). |
| `art/type/build-fonts.py`, `assets/fonts/Baloo2-{Medium,SemiBold}.ttf`, `assets/fonts/OFL.txt` | D1 | The committed font build, with its output and the licence. |
| `app.json` | D1 | The `expo-font` plugin with the two fonts. |
| `src/theme/type.ts` | D1 | The font-family names and the type roles. |
| `app/(tabs)/_layout.tsx`, `assets/images/tabs/*` | D1 | The tab colours and the four filled tab icons as template images. |
| `src/screens/TimerScreen.tsx`, `src/screens/classic/*` | D1 | The Ring and Facing Pages on one component set. |
| `src/components/ui/SegmentedControl.tsx` | D1 | The preset control (§5). |
| `scripts/art/build-icon-components.mjs`, `src/components/icons/*`, `src/components/stickers/*` | D1, D2 | SVG components generated from `art/out/`, filled with `currentColor`. |
| `src/constants/defaults.ts`, `src/stores/settingsStore.ts` | D1 | The additive `classicLayout` setting. |
| `app/love-note.tsx`, `src/components/GoalReachedPopup.tsx`, `src/components/LoveNoteCard.tsx` | D1 | The love note becomes a native sheet, and "goal reached" becomes an inline moment. |
| `package.json` | D1 | `expo-blur` removed. |
| `src/screens/{Stats,Settings,LoveNotes}Screen.tsx`, `src/components/GiftModeModal.tsx` | D2 | Restyled, each to its own brief. |
| `.impeccable/surfaces/*.md` | D2 | One brief per D2 screen. |
| `scripts/design/check-emoji.mjs`, `src/__tests__/noEmojiIcons.test.ts` | D2 | The NFR-UX-002 grep check. |
| `src/i18n/*` | D1 (plumbing), D3 | i18next setup, the `en` and `tr` resources, and the `tr-TR` casing helper. The owner moved the plumbing into D1 (Q1). |
| `app/welcome.tsx`, `src/screens/welcome/*`, `.impeccable/surfaces/app-welcome-tsx.md` | D1 | The one-time v1.4 welcome screen with the pages-to-logo morph (Q3, §3.2.11). |
| `art/sound/*`, `scripts/sound/build.mjs`, `src/assets/sounds/*`, `src/audio/uiSounds.ts` | D4 | The SoundCraft sources, the build and check, the shipped `.m4a` files and the player. |

## 3. Implementation Approach

### 3.1 Order, gates and one change

**The order is D1 → D2 → D3, as given.** **D4's assets are made in a parallel session in its own worktree** (the owner, Q2), then wired in by this session after D1 lands.

**Changed by the owner (Q1): D3's plumbing moves to the start of D1.** That plumbing is `expo-localization`, `i18next`, the `tr-TR` casing helper and the `en`/`tr` resource files. D1 and D2 write each new string once, as a key with its English and draft Turkish text.
- **Why.** Otherwise D3 re-edits every screen D1 and D2 have just rebuilt, to swap English literals for keys. And D1's `break-ui` step needs real Turkish at the largest Dynamic Type size, which the app can only show once that plumbing exists.
- **What D3 keeps:** the strings outside the rebuilt screens (Fly, notifications, alerts, the update prompt), the owner's Turkish copy review, the raw-text check, and the full TR × largest-size sweep on the device.
- **The cost:** the i18next bytecode lands in D1 instead of D3. `expo-localization` adds native code, but D1 needs a native build for the fonts anyway.

**Gates.** Each task closes on the owner's gates, recorded verbatim in its record:
- D1: the direction contracts for Classic and the welcome screen (seen before code), then the review scores, then the device check on build 48
- D2: the four briefs, the notes copy (EN and TR), then the device check
- D3: the Turkish copy, then the device check
- D4: the sounds (a listening page), then the device check

### 3.2 D1, Classic

Every step of [DESIGN-WORKFLOW §2](../process/DESIGN-WORKFLOW.md#2-the-pipeline-for-every-screen) runs in order, and its output goes in the D1 record.

#### 3.2.1 Shape and the HIG check (§2 steps 1–2)

- **Shape:** reload the confirmed brief (`.impeccable/surfaces/app-tabs-index-tsx.md`) with `/impeccable shape`. Write its **direction contract** (Impeccable's code-led build path carries the brief's ambition through that contract), and show it to the owner before code.
- **The HIG check:** `/apple-design` on the brief plus the contract. Any new finding is dispositioned the way the C4 table was (Stage C record §2.4).

#### 3.2.2 Theme: `useTheme` switches to `palette.ts` (FR-SET-002)

**Contract:** `useTheme(): { theme: Theme; tokens: ThemeTokens; isDark: boolean; colors: LegacyColors }`.
- **Inputs:** `themeMode` from the settings store and `useColorScheme()`.
- **Output:** `StrawberryMilk` or `MidnightPlum` from `palette.ts`. No side effects, and the hook stays compiled by the React Compiler.
- **`colors` is a transitional adapter,** `legacyColors.ts`. It maps the v1 names to palette roles so that Stats, Settings and Notes stop showing purple at once, without being rebuilt twice:
  - `bg` → `page`, `card` → `paper`, `text` → `ink`, `textMuted` → `inkSoft`
  - `accent` → `primaryInk`, `accentLight` and `surfaceTint` → `primarySoft`, `accentPurple` → `primaryInk`
  - `border` → `edge`, `inputBg` → `field`
  - every gradient → three copies of `page`, so it is flat ("The Paper Not Gradient Rule")
- **A test lists every legacy pair** that the un-rebuilt screens draw, the hard-coded `#FFFFFF` labels on `accent` included, and checks each one with `contrast.ts`. A pair that fails is fixed in its screen with the nearest declared pair.
- **The adapter is deleted at D2's end.** Fly keeps `ValentineSpec` until Phase 4b.
- **FR-SET-002 becomes `implemented`** with this change (§9).

#### 3.2.3 Baloo 2 (ADR-0046, NFR-I18N-001)

**`art/type/build-fonts.py`**, run with `python -P`, is committed and modelled on `art/type/build-specimen.py`.
- **Input:** `C:\vp\fonts\ofl\baloo2\Baloo2[wght].ttf` and its `OFL.txt`. The source's SHA-256 is checked against `C:\vp\fonts\SHA256SUMS` (`d47a6852…25c2`) before anything is read. A mismatch exits 1.
- **Output:** `assets/fonts/Baloo2-Medium.ttf` (wght 500) and `assets/fonts/Baloo2-SemiBold.ttf` (wght 600), the specimen's two roles, plus `assets/fonts/OFL.txt`.
- **How:**
  - `instancer.instantiateVariableFont(…, updateFontNames=True)`, so each static instance has its own PostScript name (name ID 6). iOS resolves `fontFamily` by that name.
  - It subsets to the specimen's code points: Basic Latin, Latin-1, Latin Extended-A, general punctuation, ₺ and ™.
  - It keeps every layout feature **except `liga`**, so `tnum`, `locl` and `kern` stay and the `fi`/`fl` ligatures go.
  - It keeps every name ID, so the copyright and the OFL notice stay inside each file (OFL §2).
- **Determinism:** fontTools rewrites `head.modified` on save, so the script pins it (and `head.created`) to a fixed value. `--check` rebuilds in a temporary folder and compares byte for byte.
- **Self-checks, each one exiting 1 on failure:**
  - All twelve Turkish letters map to glyphs.
  - No `GSUB` ligature substitutes an `f`+`i` or `f`+`l` sequence.
  - Under `tnum`, the ten digits share one advance width (§4.2).
  - The two PostScript names differ.
  - Each file is about 58 KB (ADR-0046's estimate), and the measured size is reported.
- **Wiring:**
  - `app.json` lists both files in the `expo-font` plugin's `fonts`.
  - `src/theme/type.ts` names the families and the roles. On Classic, the timer is the only Baloo 2 text (brief §7). Elsewhere, screen titles and sticker captions use it as well (ADR-0046).
  - `<TimerText>`'s style carries `fontFamily` and `fontVariant: ['tabular-nums']`. A test asserts both on the rendered element.
  - **Bold Text (HIG D1-M4):** with iOS Bold Text on (`AccessibilityInfo.isBoldTextEnabled()` and its change event), the Baloo 2 roles step up from 500 to 600. The timer is already 600, the heaviest instance shipped. If the device check shows it reads light under Bold Text, `build-fonts.py` adds a 700 instance (about 58 KB).

#### 3.2.4 The tab bar (HIG H-1, M-4, M-5)

- **Colour:**
  - In the installed `expo-router` 58.0.28 types, `NativeTabs`' `tintColor` is documented `@platform android`.
  - The iOS path is `iconColor={{ selected: primaryInk }}` plus `labelStyle={{ selected: { color: primaryInk } }}`, read from `useTheme()`, so the tab bar follows the theme.
  - **The unselected colour is left to the system (HIG D1-M1).** On Liquid Glass, tab symbols and labels are monochrome and adapt to what is underneath (`color.md › Liquid Glass color`). A fixed `inkSoft` would break that.
  - `primaryInk` on the page is 5.75:1 (light) and 8.91:1 (dark), already in the gate.
- **Icons:**
  - `<NativeTabs.Trigger.Icon src={…} renderingMode="template" />` with the filled `timer`, `stats`, `settings` and `notes` icons.
  - React Native picks an image's scale from an `@2x`/`@3x` filename suffix, not from `-50`/`-75`. So the art job's `ship` field copies `icon-*-fill-50.png` to `assets/images/tabs/icon-*-fill@2x.png` and `-75` to `@3x.png`. That keeps them under `node scripts/art/build.mjs --check`.
  - The tab bar draws alpha only, and the C3 PNGs have real holes.
- **Clearing the floating bar:** B6 found that inside `NativeTabs`, `useSafeAreaInsets().bottom` already includes the bar (`TimerScreen.tsx:345`). D1 keeps that single source and confirms it on the device, rather than adding the bar's height a second time.

#### 3.2.5 `classicLayout` and the presets

- **`classicLayout: 'ring' | 'spread'`,** default `'ring'`, is an additive field in `DEFAULT_SETTINGS`. The settings store's merge fills it for existing installs (FR-SET-001: new fields merge without loss), and the `v131` fixture tests stay green. It is chosen in the mode sheet under Classic, and in Settings → Appearance ("Timer layout").
- **Presets** 25/5, 50/10, 52/17 and 90/20. **A preset sets all three durations** (the owner, Q4). It writes the existing duration fields, and adds no new storage key:

  | Preset | Focus | Short break | Long break | Why the long break |
  |--------|------:|------------:|-----------:|--------------------|
  | 25/5 | 25 | 5 | 15 | Today's default |
  | 50/10 | 50 | 10 | 30 | A long break three times the short one |
  | 52/17 | 52 | 17 | 17 | The method has no separate long break, so it equals the short one |
  | 90/20 | 90 | 20 | 20 | The same |

  `longBreakEvery` stays as set (default 4), and the session engine is unchanged. The selected segment is derived from all three durations, and any other combination selects none ("Custom").
- **The control is built, not the native module** (§5).
  - It is a row of equal-width segments that keeps the native control's sizing, placement and behaviour (`branding.md › Express your brand with familiar components`).
  - **No tab role (HIG D1-M2):** tabs navigate, and a preset sets a value. Each segment is a button with `accessibilityState.selected`, its label in words ("25 minutes focus, 5 minutes break", M-3) and its position ("1 of 4").
  - Each segment is at least 44 pt tall and wraps to two rows at accessibility sizes.
  - On Start it crossfades into the cycle row in the same reserved height (brief §6).

#### 3.2.6 The page: one component set, two layouts

`src/screens/classic/` holds:
- `ClassicPage` (chooses the layout)
- `RingLayout`, `SpreadLayout`
- `PhaseLine`, `TimerFace` (the ring and `<TimerText>`), `NextChangeLine` ("Break at 10:25", §4.6)
- `PartnerSlot` (Pomo & Doro in v1.4)
- `TodayStickers`, `ClassicControls`, `ModeButton` and `ModeSheet`

The responsive rules are keyed to size classes (brief §6, HIG M-1). VoiceOver order is set explicitly in Facing Pages (M-2).

**Render budget.** The Timer screen's Reassure count is **13 and may not rise.** Each new piece subscribes narrowly, and none of them reads the clock:

| Component | Reads | Changes when |
|-----------|-------|--------------|
| `PhaseLine`, `PartnerSlot` (pose) | `useSessionState()`, which the screen already holds, and the cycle count | a session event (start, pause, phase change) |
| `NextChangeLine` | `endAt` from the session state at start or resume | a session event, never each second |
| `TodayStickers` | a stats selector for today's completed focus sessions | a completion |
| `TimerFace` | `<TimerText>` (unchanged), and the ring's progress through `useSlotProgress` on the UI thread | the leaf each second; the ring every frame with no render |
| `ClassicPage` | `classicLayout` | a settings change |

**Removed from Classic:**
- The app-name header with its 💗. The brief has no header.
- `CalmBackground`, whose aurora gradients `DESIGN.md` bans. The `animationsEnabled` settings key stays (FR-SET-001, and the rule that keeps every key), and D2's Settings brief decides what its toggle means.

#### 3.2.7 Motion (`animate-expo`; DESIGN.md motion grammar)

- **Start, Pause, Skip:** press-in to scale 0.97 over 100–150 ms with ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, and the haptic on the same frame.
- **Phase change:** the ring's colour (`interpolateColor` on the UI thread) and Pomo & Doro's pose (an opacity crossfade between two pose layers) over 200–300 ms. It is a pose change, not a bounce.
- **The sticker placement, the one delight:**
  - a spring with a bounce of about 0.2–0.3 (§4.4)
  - at most 24 particles, animated on transform and opacity only
  - the success haptic (`notificationAsync(Success)`)
  - It plays on the today row when a focus session completes.
- **"Paused" stamp:** a fade.
- **Tab switches:** none.
- **Reduce Motion** (`useReducedMotion`): opacity and colour stay; translate, scale, particles and overshoot drop (NFR-A11Y-004).
- **Frame budget (NFR-PERF-004):** the hidden diagnostics panel from B7 gains a completion-frame readout (a `useFrameCallback` over the placement: the median fps and the longest frame). The device check reads it in a release build.

#### 3.2.8 Overlays (brief §6)

- **The love note becomes a native sheet:** an Expo Router `formSheet` route (`app/love-note.tsx`, the system's own sheet). The Timer screen opens it when the note is due and Timer is focused, and closing it calls `dismissLoveNote`.
  - **It stays until it is dismissed** (the direction contract; `accessibility.md › Minimize use of time-boxed interface elements`). It closes on a swipe down or its "Close" button.
  - **It fits at every text size (HIG D1-M3):** the sheet is sized to its content (`fitToContents`), and a long note at AX5 reaches full height and scrolls. It isn't resizable, so it has no grabber (`sheets.md`). A short title names the moment (`modality.md › Make it easy to identify a modal view's task`). (Built this way in place of the first disposition, a fitted plus a large detent; D1 record §3.9.)
- **"Goal reached" becomes an inline moment** on the today row. It is not a modal.
- **The ad policy is unchanged:** the interstitial waits until the sheet has closed (FR-ADS-001). `timerScreenOverlays.test.tsx` keeps its three orderings, asserted on the new surfaces.

#### 3.2.9 Clean-up

- **`expo-blur`** is removed (HIG L-4); nothing imports it.
- **Recorded, not removed silently:**
  - `expo-linear-gradient` becomes unused once `PremiumCalmBackground` has no caller.
  - `IconSymbol`, `expo-symbols` and `@expo/vector-icons` become unused once the tab bar stops using SF Symbols.
  - Each is removed in the commit where its last import goes, and the D1 or D2 record says so.

#### 3.2.10 Reviews, break, polish, device (§2 steps 4–7)

- **Reviews:**
  - `/impeccable critique` and `/impeccable audit`, each **≥ 16/20** (NFR-UX-003)
  - `/apple-design` on the built code, with **no Critical findings**
  - Emil's `review-animations`, clean
- **Break:** `break-ui` with worst-case data, including the real Turkish strings at AX5 (the plumbing is in D1, Q1).
- **Polish:** `polish`, `harden`, `clarify`.
- **Device check, build 48** (`v1.4.0-tf.48`), on a physical iPhone through TestFlight, after the owner's OK for the EAS build and the submission:
  1. The new app icon in **default, dark and tinted**, and the splash in **light and dark**. They ship for the first time in this build.
  2. Baloo 2 renders, and the **timer digits hold still** as they count (tabular figures reach Core Text).
  3. The selected tab is strawberry (`primaryInk`) in both themes, and the four template icons tint correctly.
  4. The Ring and Facing Pages in both themes. The presets. The controls clear the floating bar.
  5. The sticker placement: its feel, its haptic and its frame readout (≥ 58 fps median, no frame over 32 ms). The phase crossfade.
  6. Reduce Motion: opacity only.
  7. The love-note sheet, then the interstitial, in that order.
  8. Compact height (landscape), the largest Dynamic Type size, the VoiceOver order and labels, and an iPad if one is available.
  9. The scroll edge effect under the bar when Facing Pages scrolls at accessibility sizes (brief §7).
  10. The welcome screen (§3.2.11): it shows once over an update from build 47, once on a fresh install, and never again. The morph's feel, and its Reduce Motion crossfade.
  11. Turkish (the plumbing is in D1): the rebuilt Classic and the welcome screen in TR at the largest size.

#### 3.2.11 The v1.4 welcome screen and the pages-to-logo morph (the owner, Q3)

The owner chose **both** placements: "First pairing and 1.4 welcome screen". The first pairing is Phase 2's (§9 records it for Phase 2). The welcome screen is D1's.

- **What it is:** a one-time screen. Pomo & Doro turn themselves into the two pages and form the Same Page mark (ADR-0047). One line of copy follows, then a single "Start" button.
- **Who sees it:** every install once, after the update to v1.4 from 1.3.1 or build 47, or on a fresh install. It never shows again.
- **It is not a launch screen** (HIG H-2). The splash stays the static mark. The welcome screen is a route shown after the first frame is interactive. It is Apple's "welcome or onboarding screen" in place of a launch-time branding moment, and it never delays a cold start's TTI (NFR-PERF-001). The B7 probe's clean cold starts all come after it.
- **Skippable at once:** the button reads "Start" from the first frame, and the morph never blocks it.
- **Reduce Motion:** the morph becomes a crossfade from the characters to the mark (NFR-A11Y-004).
- **Storage:** one new additive key, a "welcome seen" flag written when the screen closes. No existing key changes, and the B2 migration is untouched.
- **The morph** is a choreographed transform and crossfade between two different designs (ADR-0047 §4), not a path interpolation:
  - The characters move to the page positions, lean and flatten, and hand over to the mark's pages at the crossover.
  - If the art needs in-between poses, they are made in VectorCraft through `scripts/art/build.mjs` and stay within budget.
- **It runs the same pipeline as Classic:** `/impeccable shape` (its own brief, `.impeccable/surfaces/app-welcome-tsx.md`), `/apple-design` (onboarding), `animate-expo`, the three reviews, `break-ui` in TR at AX5, polish, and the device check (item 10 above).
- **Its delight is the morph,** the one delight on its screen, which keeps "one delight per screen" whole.

### 3.3 D2, Stats, Settings, Notes and Gift

- **Shape each screen first.** One `/impeccable shape` brief each, then `/apple-design` on each. The owner confirms the four briefs before any of them is built.
  - Stats reads as diary pages filling with stickers.
  - Settings uses native grouped lists and native controls.
  - Notes and Gift each get their own brief.
- **Icons, not emoji (NFR-UX-002):**
  - `scripts/art/build-icon-components.mjs` (committed) turns each `art/out/icon/*.svg`, and Pomo & Doro's poses, into a `react-native-svg` component. Each component is filled with `currentColor` and takes `size` and `color`. It is hidden from accessibility unless it is given a label.
  - The generator lands in D1 if D1 needs it first (the "modes" icon, the stickers).
  - The 51 glyphs in 16 files (Stage C record §2.5) become those icons or disappear. Fly's emoji are swapped for icons; the Fly screen is not otherwise redesigned (Phase 4b).
  - **The check:** `scripts/design/check-emoji.mjs`, run by `src/__tests__/noEmojiIcons.test.ts` (`// covers: NFR-UX-002`), fails on any emoji code point under `src/` and `app/`. Its allowlist is the push-notification copy and the default notes (user text).
- **Bengisu (FR-NTE-002):**
  - New name-free default notes in EN and TR, for fresh installs only. The owner reviews the copy.
  - Her install keeps its notes. B2's tests pin the v1.3.1 set through `src/constants/legacyLoveNotes.ts` and the `v131` fixtures, not through `defaults.ts`, so new defaults cannot change what an existing install receives. Those tests must stay green.
  - The gift screen drops "for Bengisu". About gets a one-line origin.
- **The transitional `colors` adapter is deleted** once the last screen is rebuilt.
- **The same reviews, break, polish and device check as D1,** on build 49.

### 3.4 D3, EN/TR (FR-SET-005, NFR-I18N-001, NFR-A11Y-003)

- **Plumbing, moved into D1 by the owner (Q1):** `expo-localization` with `i18next` and `react-i18next`. D3 finishes what D1 started.
  - The language follows the device.
  - `ios.infoPlist.CFBundleLocalizations: ["en", "tr"]`, so iOS offers the per-app language setting.
  - Turkish casing goes through one helper using `toLocaleUpperCase('tr-TR')` (İ/ı), never a bare `toUpperCase()`.
  - Plurals use i18next's `Intl.PluralRules` support.
- **Every user-visible string is extracted:** screens, alerts, accessibility labels, notification copy (written in the device language when it is scheduled) and the update prompt.
- **A check fails on raw JSX text** outside the resources (an AST scan in a Jest test).
- **The owner reviews the Turkish copy.**
- **The device check, build 50:** every screen in TR at the largest Dynamic Type size; nothing may clip.

### 3.5 D4, sounds (FR-SET-004, NFR-PERF-005; closes `DECISIONS.md` Q1)

- **Made in a parallel session in its own worktree** (the owner, Q2). That session owns `art/sound/`, `scripts/sound/`, `src/assets/sounds/`, `art/review/d4-*` and its own record (`…-phase1-d4-sounds.md`), and touches nothing else. This session wires the sounds in after D1 lands (`src/audio/uiSounds.ts` and the settings toggle), then merges that session's branch with the owner's OK.
- **SoundCraft:** the version is read from `soundcraft-cli --version` first. The plan names 0.14, and VectorCraft had drifted to 0.18.
- **Three sounds,** made with SoundCraft's built-in synths only (`subtractive_synth`, `drum_synth`): focus start, break start and completion (the sticker placement).
- **Sources:** each sound has a committed `.scraft` session and a `soundcraft-cli script` under `art/sound/`.
- **`scripts/sound/build.mjs`:**
  - bounces each sound with `file.bounce_mix`
  - scales it to a −1 dBFS sample peak (§4.5)
  - encodes mono AAC `.m4a` with ffmpeg, with bit-exact flags and no metadata, so the bytes repeat
  - checks that each file is ≤ 1.5 s, ≤ 25 KB and has a decoded peak < 0 dBFS
  - `--check` rebuilds and compares the bytes.
- **`fly-ambient.m4a`** is re-encoded the same way (mono AAC, about 64–96 kbps, a loop) and still loads lazily with Fly.
- **Playing them:** `src/audio/uiSounds.ts` plays through `expo-audio`.
  - It loads after start-up idle (B7's deferred queue), never on the cold-start path (NFR-PERF-001).
  - It respects the silent switch (`playsInSilentMode: false`, checked against Fly's own audio mode) and the Settings sound toggle (FR-SET-001; it closes DEF-007's sound half).
- **The owner hears the sounds on a listening page** before they are wired in.

### 3.6 Guards: green at every commit

| Guard | Command | Must be |
|-------|---------|---------|
| Timer ticks | `npx jest src/context/__tests__/timerTextTicks.test.tsx src/screens/__tests__/timerScreenTicks.test.tsx` | green: the store guard, plus the two real-screen guards (Classic and Fly) |
| Reassure | `npx reassure --branch` | settings-only **1**, Timer **13**, Stats **1**, Settings **2**, Notes **1**, leaf **12**; none may go up |
| React Compiler | `npm run lint`, `node scripts/react-compiler-report.js` (after component changes) | the rules at `error`, `exhaustive-deps` never disabled, no worklet-count change, no new skipped component (baseline: 47 compiled, 7 skipped) |
| Contrast | `npm run check:contrast` | every pair passes |
| Art (any new art) | `node scripts/art/build.mjs --check`, `node scripts/art/check-budgets.mjs` | byte-identical rebuild, within budget (VectorCraft 0.18 in `C:/vp-art`) |
| Tests and lint | `npx jest --ci`, `npm run lint`, `npm run typecheck` | 0 failures, 0 lint errors, clean types |
| Docs | `node scripts/docs/check-docs.mjs --write`, then `node scripts/docs/check-docs.mjs` | before every docs commit |

From D1 on, `python -P art/type/build-fonts.py --check` (fonts) joins the table, and from D4, `node scripts/sound/build.mjs --check` (sounds).

### 3.7 Builds and device checks

| Build | Tag | Carries | Owner's OK needed for |
|------:|-----|---------|----------------------|
| 48 | `v1.4.0-tf.48` | D1 | the EAS build, the TestFlight submission, the tag push |
| 49 | `v1.4.0-tf.49` | D2 (and D4 if wired) | the same |
| 50 | `v1.4.0-tf.50` | D3 | the same |

The device checks run one task at a time, never batched. The bytecode is measured with the pinned export after D1 and after D3 (§4.7).

### 3.8 Docs per task

- **One record per task:** `docs/implementations/YYYY-MM-DD-phase1-d1-classic.md`, `…-d2-screens.md`, `…-d3-i18n.md` and `…-d4-sounds.md`, each from `_TEMPLATE.md` with front-matter, created when its task starts.
- **Each record cites requirement IDs.** Tests carry `// covers:` comments.
- **The shared-doc text** for the task (the ROADMAP row, SRS statuses, the docs map row) goes into §9 of this plan **in the same commit as the work**.
- **New ADRs, if a decision is structural,** start at ADR-0048. Likely candidate: the i18n stack.
- **At the end:** the project memory is updated.

## 4. Mathematical / Statistical Details

### 4.1 Contrast

The C1 formula is unchanged (Phase 1 plan §4.1; Stage C record §4.1). For sRGB channels, $c_{\text{lin}}$ is linearised, $L = 0.2126R + 0.7152G + 0.0722B$, and $\text{CR} = (L_{\max} + 0.05)/(L_{\min} + 0.05)$.
- Text passes at $\text{CR} \ge 4.5$; large text, icons and marks at $\text{CR} \ge 3$.
- D1 adds no tokens. The adapter's legacy pairs (§3.2.2) are checked with the same `contrast.ts`.

### 4.2 Tabular digits (the font build's check)

The timer is steady when every digit glyph $d \in \{0, \dots, 9\}$ has the same advance width after the `tnum` substitution:

$$\max_d w_d - \min_d w_d = 0 \text{ font units},$$

read from `hmtx`. ADR-0046 measured 583–606 units *across* Baloo 2's weights, and equal widths *within* each weight. `build-fonts.py` checks each shipped instance.

### 4.3 Font size and determinism

Each instance is about 58 KB (ADR-0046). Two of them add about 117 KB to the binary and nothing to the bytecode. The rebuild is byte-identical once `head.created` and `head.modified` are pinned, because the subsetter's output is otherwise a pure function of the input file, the code points and the options.

### 4.4 The sticker spring

Apple's spring "bounce" $b$ and the damping ratio $\zeta$ are related by $\zeta = 1 - b$ for $0 \le b < 1$. So DESIGN.md's bounce of 0.2–0.3 is $\zeta = 0.7$–$0.8$. For an underdamped spring released from rest, the fractional overshoot past its target is

$$\text{OS} = \exp\!\left(\frac{-\zeta\pi}{\sqrt{1 - \zeta^2}}\right).$$

That gives 4.6 % at $\zeta = 0.7$, 2.8 % at $\zeta = 0.75$ and 1.5 % at $\zeta = 0.8$. The placement uses Reanimated's `withSpring` with `dampingRatio` in that range, and a duration set in D1 (about 400–500 ms, tuned on the device). With Reduce Motion it becomes an opacity fade with no overshoot.

### 4.5 Sound level and size

- **Level:** −1 dBFS is a gain of $g = 10^{-1/20} \approx 0.891$. A bounce with sample peak $p$ (linear, $0 < p \le 1$) is scaled by $g/p$ before it is encoded, which leaves about 1 dB for AAC's inter-sample overshoot (Phase 1 plan §4.4). The check decodes the `.m4a` and requires `max_volume` < 0 dB.
- **Size:** at bitrate $R$, a sound of duration $T$ carries about $R \cdot T / 8$ bytes plus container overhead. At 96 kbit/s, 1.5 s is $96000 \times 1.5 / 8 = 18\,000$ B, about 17.6 KB, under the 25 KB budget with room for the `.m4a` header.

### 4.6 "Break at 10:25"

The line shows the wall-clock minute in which the next phase begins. With the session's `endAt` in ms since the epoch, it shows `endAt` in local time with its seconds truncated: the change happens during that minute. It is computed when the session starts or resumes (a session event), so it never re-renders the screen each second. A pause hides it, because a paused session has no end.

### 4.7 Bytecode and binary size

- **Bytecode (NFR-PERF-002):** the iOS baseline is 3,856,208 B. After B7 it is 3,912,916 B, which is +1.47 %, accepted by the owner and revisited at E3. Measured with `npx expo export --platform ios --platform android --dump-sourcemap` after D1 and after D3, each with its delta: $\Delta = s_{\text{after}} - s_{\text{before}}$, and its percentage against the baseline.
- **Binary:** **no binary-size budget exists in the docs.** The IPA sizes of builds 47 and 48 onward, from EAS, are recorded as measurements only, for E3.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| **The preset control is built** | `@react-native-segmented-control/segmented-control` 2.5.7; `@expo/ui`'s segmented picker | <ul><li>The module's last release was December 2024, and it declares no `codegenConfig`, so on RN 0.88 it relies on the interop layer.</li><li>A `UISegmentedControl` can't give each segment its own spoken label. M-3 needs "25 minutes focus, 5 minutes break", not "25 slash 5".</li><li>It can't wrap four Turkish labels at AX5, and it can't crossfade into the cycle row in the same reserved height (brief §6).</li><li>A built control themes through the tokens and adds no native code.</li><li>The owner may still choose the native one.</li></ul> |
| A transitional `colors` adapter in D1 | Re-point every screen's colours in D1 | Stats, Settings and Notes are rebuilt in D2 anyway. The adapter shows the new palette at once without editing those screens twice, and it is deleted at D2's end. |
| Two static font instances | Ship the variable font | iOS resolves a custom font by its PostScript name. With named static instances, `fontFamily` alone selects the weight, with no reliance on `fontWeight` mapping into a variable font's axis. |
| Tab icons as `@2x`/`@3x` template PNGs copied by the art job | An asset catalog (`xcasset`); a React element as `src` | An asset catalog needs a config plugin and Xcode to check. Rendering an element costs a render and a snapshot at start-up. Template PNGs are what C3 exported, and `build.mjs --check` covers them. |
| The love note as an Expo Router `formSheet` route | `Modal` with `presentationStyle="pageSheet"`; a hand-made sheet | The system sheet with a small detent, as the brief asks. A `Modal` page sheet has no detents. A hand-made sheet is what the plan replaces. |
| Icon components generated by a committed script | Parse SVG at runtime (`SvgXml`); a Metro SVG transformer | No parse cost on the device. No Metro config change. Every component is reproducible from `art/out/`. |
| One record per task, plus this plan | One stage record | The handover asks for a record per task. This plan holds the order, the guards and the shared-doc text, so the per-task records stay short. |

## 6. Verification

Run from `C:\vp\stage-d`:

```bash
npx jest --ci
npx reassure --branch
npm run lint
npm run typecheck
npm run check:contrast
node scripts/react-compiler-report.js
node scripts/art/build.mjs --check
node scripts/art/check-budgets.mjs
node scripts/docs/check-docs.mjs
```

From D1: `python -P art/type/build-fonts.py --check`. From D4: `node scripts/sound/build.mjs --check`.

- [x] This plan is committed before any other file on the branch.
- [ ] D1: every step of DESIGN-WORKFLOW §2. Critique and audit ≥ 16/20, no Critical HIG finding, `review-animations` clean. Guards green. The device check on build 48 (needs a physical device).
- [ ] D2: the four briefs confirmed. The emoji check green. B2's notes tests green. The device check on build 49 (needs a physical device).
- [ ] D3: every string extracted, and the raw-text check green. The device check in TR at the largest size on build 50 (needs a physical device).
- [ ] D4: three sounds, each ≤ 1.5 s and ≤ 25 KB, rebuilt byte for byte. The silent switch and the toggle respected on the device (needs a physical device).

## 7. Questions for the owner, answered 2026-10-30

1. **Q1, order:** pull D3's i18n plumbing to the start of D1? **"Plumbing in D1"** (§3.1).
2. **Q2, D4:** make the sounds now in a parallel session, in its own worktree, and wire them in after D1 lands? **"Parallel session now"** (§3.5).
3. **Q3, the pages-to-logo animation:** where does it play, given it never plays at launch (HIG H-2)? **"First pairing and 1.4 welcome screen"**: the welcome screen is D1's (§3.2.11), and the first pairing is Phase 2's (§9).
4. **Q4, presets:** does a preset set the long break too? **"All three durations"**: 25/5/15, 50/10/30, 52/17/17, 90/20/20 (§3.2.5).

**Decided here, which the owner may overrule:** the built segmented control (§5).

## 8. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md), Stage D and Stage E · [Stage C record](2026-10-30-phase1-stage-c-design.md) §2.4–2.6, §10
- [`PRODUCT.md`](../../PRODUCT.md) · [`DESIGN.md`](../../DESIGN.md) · [Design workflow](../process/DESIGN-WORKFLOW.md) · [Documentation conventions](../process/DOCS.md)
- [ADR-0042](../architecture/adr/0042-design-skill-stack.md) · [ADR-0045](../architecture/adr/0045-theme-tokens-and-contrast-gate.md) · [ADR-0046](../architecture/adr/0046-display-face-baloo-2.md) · [ADR-0047](../architecture/adr/0047-same-page-mark-and-the-colon-characters.md) · [ADR-0027](../architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md)
- [SRS](../srs/SRS.md): FR-SET-002, FR-SET-004, FR-SET-005, FR-NTE-002, NFR-UX-002, NFR-UX-003, NFR-PERF-004, NFR-PERF-005, NFR-A11Y-002, NFR-A11Y-003, NFR-A11Y-004, NFR-I18N-001
- The Classic brief: `.impeccable/surfaces/app-tabs-index-tsx.md`

## 9. Shared-doc updates to apply at merge

Kept current in the same commit as each piece of work, and applied at the merge into `rehaul/v2` with the owner's OK.

**`docs/README.md`**, the plans table, after the Phase 1 plan row:

```markdown
| [Phase 1 Stage D plan](implementations/2026-10-30-phase1-stage-d.md) | In progress: D1–D4, the screens in the Sticker Diary design |
```

**`docs/README.md`**, the implementation records table, at the top (one row per task record):

```markdown
| 2026-10-30 | [Phase 1 D1: Classic rebuilt in the Sticker Diary design, with the v1.4 welcome screen](implementations/2026-10-30-phase1-d1-classic.md) |
```

**`docs/roadmap/ROADMAP.md`**, the status board: Phase 1 Stage D → in progress (2026-10-30). Per-task rows:
- **D1:** in progress (2026-10-30). Built, reviewed and hardened: the theme switch, EN/TR plumbing, Baloo 2, the tab bar, the icon and sticker components, Classic (The Ring and Facing Pages, presets, the sticker placement, the love-note and mode sheets) and the v1.4 welcome screen. Critique 35/40, audit 16/20, HIG no Critical, motion clean. Waiting: the owner's OK for build 48, the device check, and the finish review.

**SRS** status changes, added as each task lands:
- **FR-SET-002** → `implemented` (Verify: T, `src/theme/__tests__/legacyColors.test.ts` and `src/__tests__/router.test.tsx`; D, the D1 device check). `useTheme` returns Strawberry Milk or Midnight Plum from `palette.ts` (D1, `46a5b00`).
- **NFR-UX-003:** add to the status note: "Classic's native audit 16/20 and critique 35/40 at D1 (`ce388d0`), from source; the D1 device check confirms." It stays `planned` until every primary screen is audited (D2).
- **NFR-I18N-001:** add to the status note: "D1: Baloo 2 embedded (Latin + Turkish, `fi`/`fl` off, `art/type/build-fonts.py`), every timer tabular, the i18n plumbing with `tr-TR` casing; the remaining strings are extracted in D3."
- **NFR-A11Y-004:** add to the status note: "D1: Reduce Motion handled for every new motion (press dimming, the sticker fade, no indicator slide, the welcome's fade); the device check confirms."

**`CHANGELOG.md`**, under the unreleased v1.4.0:

```markdown
- Classic rebuilt in the Sticker Diary design (Phase 1 D1): the Strawberry Milk and Midnight Plum themes, Baloo 2 with steady timer digits, The Ring and Facing Pages layouts, presets (25/5, 50/10, 52/17, 90/20), today's stickers with the sticker placement, the love note as a sheet, a mode sheet, the custom tab icons, a one-time welcome where Pomo & Doro become the Same Page mark, and English and Turkish groundwork.
```

**`docs/process/DESIGN-WORKFLOW.md` §3**, two rows for the tensions D1 decided:

```markdown
| HIG: prefer the platform's segmented control. Brief: presets spoken in words, Turkish wrapping at AX5, an in-place crossfade | A built control with native sizing, placement and behaviour; each segment a button with a selected state, its words and its position (never a "tab") | Phase 1 D1 |
| Brand colour on the tab bar vs Liquid Glass's adaptive monochrome | Only the selected tab carries `primaryInk`; the unselected items stay the system's | Phase 1 D1 |
```

**Phase 2 inherits (the owner, Q3, 2026-10-30):** the pages-to-logo morph also plays at the first pairing. It reuses D1's welcome-screen choreography (§3.2.11). For the rehaul plan's Phase 2 section and the ROADMAP's Phase 2 row:

```markdown
- The pages-to-logo morph (Pomo & Doro become the Same Page mark) plays at the first pairing, reusing the v1.4 welcome screen's choreography (Phase 1 Stage D plan §3.2.11; owner, 2026-10-30).
```

## Backlinks
<!-- backlinks:start -->
- ["Phase 1 D1: Classic rebuilt in the Sticker Diary design, with the v1.4 welcome screen"](2026-10-30-phase1-d1-classic.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
