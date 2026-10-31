---
id: IMPL-2026-10-31-phase1-d2-screens
title: "Phase 1 D2: Stats, Settings and Notes rebuilt in the Sticker Diary design, the gift screen retired"
status: in-progress
date: 2026-10-31
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-stage-d, IMPL-2026-10-30-phase1-d1-classic, DESIGN-WORKFLOW, ADR-0045, ADR-0047, SRS]
---

# 2026-10-31 — Phase 1 D2: Stats, Settings, Notes and the gift screen

**Status:** In progress. The owner confirmed the four briefs on 2026-10-31 ("Confirm all four") and chose Stats' layout, the postcard stack. The owner approved the three direction contracts and the picker dependency on 2026-10-31 ("Approve, build D2"); the build is under way.
**Branch:** `phase1/stage-d` (worktree `C:\vp\stage-d`).
**Plan:** [Stage D plan](2026-10-30-phase1-stage-d.md) §3.3. This record holds what happened: each step's output, the owner's gates, the scores and the measurements.

---

## 0. Gates and steps

Each screen follows DESIGN-WORKFLOW §2, as Classic did in D1.

| Step | Stats | Settings | Notes | Gift |
|---|---|---|---|---|
| 1. Shape | Brief written (§3.1) | Brief written (§3.1) | Brief written (§3.1) | Brief written: retired (§3.1) |
| Owner: the four briefs | **Confirmed**, 2026-10-31 ("Confirm all four") | **Confirmed** | **Confirmed** | **Confirmed** |
| 2. `/apple-design` on the brief | Good; no Critical; 1 High, 5 Medium, 3 Low (§3.2) | Good; no Critical; 1 High (an owner question), 1 Medium, 2 Low (§3.2) | 1 Critical, 2 High, 2 Medium, 1 Low (§3.2) | Excellent; 1 Medium, 1 Low (§3.2) |
| Composition round | **The postcard stack**, the owner's pick, 2026-10-31 (§3.3) | Not needed: native grouped list | Not needed: native list | Not needed |
| Owner: direction contracts | **Approved**, 2026-10-31 ("Approve, build D2"; §3.4) | **Approved**, with `@react-native-picker/picker` | **Approved** | None: a retirement, carried by Settings' About footer |
| 3. Build (`animate-expo`) | **Built**, `b2db8c1` (§3.8) | **Built**, `23e595c` (§3.6) | **Built**, `de3867c` (§3.7) | **Retired**, `23e595c` (§3.6) |
| 4. Critique, audit (≥ 16/20), HIG (no Critical), `review-animations` | First pass: critique 27/32, audit **15/20**, HIG **1 Critical** (day names), motion clean. After the fixes: critique 27/32 (84 %), audit 16/20, no Critical, motion clean (§3.12) | First pass: critique 34/40, audit 17/20, no Critical, motion not clean. After: critique 36/40, audit 18/20, no Critical, motion clean (§3.12) | First pass: **a P0** (rows unstyled in a release build), motion not clean. After: critique 37/40, audit 17/20, no Critical, motion clean (§3.12) | Retired: none |
| 5. `break-ui` (TR at AX5) | 2 Ugly (the zero-goal summary, the strip at AX5) and the shared number formats: **fixed**; a streak of 0 softened (§3.13) | The number formats: **fixed**; Turkish words wider than a row: accepted (the owner) | 2 Broken (an emoji cut at the cap, the editor header at AX5) and 1 Ugly (line breaks lost): **fixed** | Retired: none |
| 6. `polish`, `harden`, `clarify` | Done: "Turn on a daily goal" opens Settings at the goal row; Turkish "kaldı" (§3.14) | Done: a failed reminder told from a refusal; "Check for updates" offline; link rejections; "Sound and haptics" (§3.14) | Done (§3.13–3.14) | Retired: none |
| 7. Device check (the next build, with D1's finish-review fixes) | — | — | — | — |
| FINISH: the finish review, its verdict, DESIGN.md | — | — | — | — |

**Alongside the screens** (Stage D plan §3.3), D2 also does:
- the emoji check;
- the name-free default notes;
- the About origin line;
- Fly's emoji swapped for icons, and Fly re-tokened;
- `legacyColors` deleted once the last screen is rebuilt.

## 1. Problem / Motivation

D1 rebuilt Classic and added the welcome screen in the Sticker Diary design. The other three tabs still wear v1's look through the transitional `legacyColors` adapter, as the owner's build 50 screenshots show:
- **Stats** is a grid of number tiles with a bar chart.
- **Settings** uses typed number fields and emoji headings ("Settings ⚙️", "Fly Mode ✈️").
- **Notes** has emoji in its title, and inline Edit and Delete links under 44 pt.

Fresh installs see v1's gift screen, then the welcome: two first-run screens in a row (D1 HIG review, Medium). D2 brings these surfaces into the design and closes the D1 items handed to it (§5).

## 2. What Changed

| File | Change |
|---|---|
| `.impeccable/surfaces/app-tabs-stats-tsx.md` | New. Stats' brief: the week's diary page (§3.1). |
| `.impeccable/surfaces/app-tabs-settings-tsx.md` | New. Settings' brief: a native inset grouped list with no typed numbers (§3.1). |
| `.impeccable/surfaces/app-tabs-notes-tsx.md` | New. Notes' brief: native list rows, a sheet editor, the 280 cap, name-free defaults (§3.1). |
| `.impeccable/surfaces/src-components-giftmodemodal-tsx.md` | New. The gift screen's brief: retired, with the origin moved to About (§3.1). |
| `docs/implementations/2026-10-31-phase1-d2-screens.md` | This record. |
| `.impeccable/surfaces/app-tabs-{stats,settings,notes}-tsx.md` | Each gains its direction contract (§3.4), which waits for the owner's approval. |
| `art/review/d2-stats-*.html` | New. The three Stats decision sketches: the postcard stack, which is locked, and the two not chosen (§3.3). |
| `src/screens/SettingsScreen.tsx`, `src/components/settings/SettingsList.tsx` (new), `src/constants/app.ts` (new), `package.json`, `package-lock.json` | Settings rebuilt as a native inset grouped list, with `@react-native-picker/picker` 2.11.4 for its wheels (§3.6). |
| `src/theme/useTheme.ts` | The theme follows the phone; `themeMode` is no longer read (§3.6). |
| `src/screens/LoveNotesScreen.tsx`, `src/screens/notes/NoteEditor.tsx` (new), `app/note-editor.tsx` (new), `app/_layout.tsx`, `src/navigation/sheetOptions.ts` | Notes rebuilt as native list rows, with a full-height sheet editor (§3.7). |
| `src/screens/StatsScreen.tsx`, `src/screens/stats/WeekStack.tsx` (new), `src/screens/__tests__/stats.test.tsx` (new) | Stats rebuilt as the postcard stack, and tested (§3.8). |
| `scripts/design/check-emoji.mjs` (new), `src/__tests__/noEmojiIcons.test.ts` (new) | The emoji check (§3.9). |
| `src/screens/FlyModeScreen.tsx`, `src/components/{FlyTimerPill,LoveNoteCard,AirportPicker}.tsx`, `src/hooks/useNotifications.ts`, `src/hooks/useUpdateCheck.ts`, `src/stores/statsStore.ts`, `src/startup/StartupDiagnostics.tsx`, `src/screens/TimerScreen.tsx`, `app/+not-found.tsx` | Fly's emoji become icons; the last legacy colour names become tokens (§3.9). |
| `src/theme/legacyColors.ts`, `src/theme/__tests__/legacyColors.test.ts` (both removed), `src/theme/useTheme.ts` | The transitional adapter is deleted (§3.9). |
| `src/stores/notesStore.ts`, `src/constants/defaults.ts` | The additive restore, the 280 cap, and 20 name-free defaults per language for fresh installs (§3.7). |
| `src/screens/__tests__/notes.test.tsx` (new), `src/navigation/__tests__/sheetOptions.test.ts`, `src/__tests__/router.test.tsx`, `jest.setup.ts` | Notes and the editor tested; the editor's sheet options; the router tests' Notes marker; the swipeable's Jest stand-in (§3.7). |
| `src/App.tsx`, `src/components/GiftModeModal.tsx` (removed), `src/screens/welcome/useWelcomeGate.ts` | v1's gift screen is retired, and the welcome no longer waits for it (§3.6). |
| `src/screens/__tests__/settings.test.tsx` (new), `settingsKeyboard.test.tsx` (rewritten), `src/screens/welcome/__tests__/welcome.test.tsx`, `src/__tests__/router.test.tsx`, `src/i18n/en.json`, `tr.json` | The new Settings tested; `settingsKeyboard.test.tsx`, which the SRS cites for DEF-008, now proves no number opens a keyboard; the welcome's two audiences; the router tests mark the welcome seen; Settings' strings in English and Turkish (§3.6). |
| `docs/process/DESIGN-WORKFLOW.md` | Two §3 rows: sentence case against Apple's title-style capitalisation; the appearance switch, settled by retiring it. |
| `src/screens/LoveNotesScreen.tsx`, `src/screens/notes/NoteEditor.tsx`, `src/screens/__tests__/notes.test.tsx`, `src/__tests__/router.test.tsx` | The review round (§3.12): the row's style flattened (the P0), the pressed tint, the swipe's tracking, stretch and corners, the restore announcement; the editor asks in an action sheet from Cancel and from a swipe (`usePreventRemove`), dims a disabled Save, edges its field in `edgeStrong`. The test's link renders through Expo Router's real Slot. |
| `src/screens/StatsScreen.tsx`, `src/screens/stats/WeekStack.tsx`, `src/screens/__tests__/stats.test.tsx` | The review round: the day names never truncate, the flag grows with the text, the Minutes track has an outline. |
| `src/screens/SettingsScreen.tsx`, `src/components/settings/SettingsList.tsx`, `src/screens/__tests__/settings.test.tsx` | The review round: the denied footer announced and plain, one VoiceOver stop per switch row, the wheel's motion and its Reduce Motion fade, the wheel list rebuilt only when its range changes. |
| `.impeccable/surfaces/app-tabs-stats-tsx.md`, `.impeccable/critique/2026-10-31T*` | The Stats contract's switch is instant (the owner); the six critique snapshots, before and after the fixes. |
| `src/screens/__tests__/d2WorstCase.test.tsx` (new), `src/screens/notes/NoteEditor.tsx`, `src/stores/notesStore.ts`, `src/screens/StatsScreen.tsx`, `src/screens/stats/WeekStack.tsx`, `src/screens/SettingsScreen.tsx`, `src/i18n/index.ts`, `en.json`, `tr.json`, `notes.test.tsx`, `stats.test.tsx` | `break-ui` (§3.13): the Turkish AX5 worst-case fixture; the cap keeps characters whole; the editor header caps at 1.4×; notes keep line breaks; the zero-goal summary, the stacked strip at AX sizes and the softer streak line; counts of 1,000 or more grouped everywhere through one `formatNumber`. |
| `src/stores/settingsFocusStore.ts` (new), `src/screens/SettingsScreen.tsx`, `src/screens/StatsScreen.tsx`, `src/hooks/useUpdateCheck.ts`, `en.json`, `tr.json`, `settings.test.tsx`, `stats.test.tsx`, `useUpdateCheck.test.tsx`, `d2WorstCase.test.tsx` | Step 6 (§3.14): Settings opens at the goal row from Stats; a failed reminder is told from a refusal; an offline "Check for updates" says so; link rejections caught; "Sound and haptics"; Turkish "hedefe … dk kaldı". |

## 3. Implementation Approach

### 3.1 Shape (DESIGN-WORKFLOW §2 step 1)

`/impeccable shape`, run from this worktree's own launcher, read PRODUCT.md, DESIGN.md and the iOS platform reference. One discovery round asked the owner three questions, the ones that change the briefs most. **The owner, 2026-10-31:**

| Question | Answer |
|---|---|
| Fresh installs see the gift screen, then the welcome. What happens to the gift screen? | **Retire it.** The welcome is the only first-run screen, and the origin moves to one line in Settings › About. |
| What does Stats lead with? | **This week:** a spread of the last seven days filling with stickers, with the goal and the love streak on the page and the all-time totals below. |
| Cap the length of love notes? | **At 280 characters.** Longer existing notes are kept. |

The four briefs, in short:
- **Stats:**
  - the last seven days as the diary page, each day holding its stickers and the goal mark, an empty day a dashed outline, never "missed";
  - the goal and the love streak on the page, the all-time totals below;
  - a Sessions / Minutes choice keeps FR-STA-003;
  - the ad banner keeps its slot.
- **Settings:**
  - an inset grouped list in eight groups;
  - numbers set with a wheel that opens in place, not typed, which retires the deprecated `InputAccessoryView`;
  - times set with the native compact picker;
  - "Background Animations" goes, since it drives nothing since D1; its key stays;
  - no emoji.
- **Notes:**
  - one inset grouped list of paper rows, with tap to edit, swipe and context-menu actions, and a sheet editor with a countdown;
  - the 280 cap;
  - name-free defaults in English and Turkish, which Claude drafts and the owner reviews; Bengisu's install keeps hers;
  - "Preview a note" and "Restore default notes" at the list's foot.
- **Gift:**
  - `GiftModeModal` and its gate go; the `hasSeenGiftMode` key stays;
  - About gets one line: "Valentine Pomodoro began as a gift for Bengisu.", with a Turkish draft for the owner's review.

### 3.2 `/apple-design` on the four briefs (DESIGN-WORKFLOW §2 step 2)

Two reviewers ran the apple-design skill in parallel: one on Stats and Gift, one on Settings and Notes. They loaded the always-load set plus the on-screen pages (charts, onboarding, settings, lists and tables, pickers, steppers, sheets, alerts, context menus, entering data, dark mode). The reviews' claims about the code were checked before they were dispositioned:
- `uiStore.ts:59` derives the welcome's audience from `hasSeenGiftMode`.
- `notesStore.resetToDefaults` overwrites the whole list.

| Brief | Finding | Disposition |
|---|---|---|
| Stats | **High:** the week has no overview for VoiceOver; each day speaks, but the chart has no summary (`charts.md › Enhancing the accessibility of a chart`) | **Accept.** One visible summary line, read before the days ("Last 7 days: 9 sessions, goal reached on 3 days"). Each day is one accessible element. |
| Stats | Medium: stickers can't carry the count past four or five, and Minutes has no scale past the goal, or with the goal off | **Accept.** Each day prints its value in tabular system figures in both views. In Minutes, the goal is the one reference line; a day past it draws full and prints its number; with the goal off, plain minutes. |
| Stats | Medium: an empty day in `edge` is 1.26:1 on `page`; today's emphasis is unspecified | **Accept.** Dashed cells in `edgeStrong` (3.57:1 light, 4.92:1 dark), as D1's today row already does. Today is marked by the word "Today", not by a tint alone. |
| Stats | Medium: the layout is keyed to devices, not size classes; the iPhone SE (375 × 667) leaves about 530 pt | **Accept.** The contract defines compact width, compact height and regular width. The first screen fits the week, the goal and the streak on an SE at the default text size, with the banner. |
| Stats | Medium: at AX5, a date-ordered column puts today off-screen; whether stickers and icons grow is unspecified | **Accept.** In the AX column today comes first. Sticker cells and icons follow `fontScale` up to 1.3×, as Classic's timer does. |
| Stats | Medium: the goal-off and empty states describe instead of act (`writing.md`) | **Accept.** A 44 pt button opens Settings at the goal row; the empty week offers "Start a session". |
| Stats | Low: the numbers' face; the Phase 3 couple week; room between the banner and the tab bar | **Accept** all three. The numbers use the system face with tabular figures, and Baloo 2 is for the title only. The contract names where the couple week will sit. About 12 pt between the banner and the bar. |
| Gift | Medium: deleting every read of `hasSeenGiftMode` would make 1.3.1 updaters see the fresh-install welcome line | **Accept.** Only the gate's condition (`useWelcomeGate.ts:24`) goes; `welcomeAudience` keeps its read. `welcome.test.tsx` flips the gift case and checks both audiences. |
| Gift | Low: a plain line among rows reads as a control; "Valentine Pomodoro" is a working name | **Accept.** The origin is the About group's footer, with the app's display name filled in from one variable. |
| Settings | **High:** an in-app System / Light / Dark switch (`dark-mode.md`: "Avoid offering an app-specific appearance setting") | **The owner's call.** DESIGN.md says appearance follows the system, but v1 shipped the switch, and the owner's own phone is set to Dark in it (build 50 screenshot). Retire it (keep `themeMode`, read it as System), or keep it with a DESIGN-WORKFLOW §3 tension row. **The owner, 2026-10-31: "Follow the phone only".** The switch is retired, `themeMode` stays in storage and is read as System, and DESIGN-WORKFLOW §3 records the settled row. |
| Settings | Medium: the Notifications master switch sits apart from the reminders it dims | **Accept.** One Notifications group: the switch first, the daily reminder and quiet hours under it, and the denied state linking to iOS Settings. |
| Settings | Low: Reset to defaults inside About | **Accept.** Its own last group. The alert names what it keeps (notes and stats), with Cancel and Reset. |
| Settings | Open: the number control | **The wheel** (`@react-native-picker/picker`, the system UIPickerView) for every number row: durations 1–180, the long-break interval 2–10, and a custom goal 1–1,440 in 1-minute steps, beside the four presets, so FR-STA-004's "any custom value" holds. The review had suggested 5-minute steps, which would narrow FR-STA-004, and tests use 1- and 600-minute goals. A stepper would take up to 179 taps, and RN has no native one. A new dependency, pinned to a release at least two weeks old: approved with the contract. The fallback, if refused: datetimepicker's countdown mode for the durations. |
| Settings | Low: drop the Timer layout row, since the Modes sheet has it | **Declined.** The Classic brief, confirmed by the owner at C4, puts the layout choice in both places (§3, "Choosing the layout"). |
| Settings | Platform: `LayoutAnimation` ignores Reduce Motion; an open row's state | **Accept.** Gated with `useReducedMotion`; `accessibilityState={{ expanded }}`. |
| Notes | **Critical:** with the inline links gone, Delete is reachable only by swipe or long press (NFR-A11Y-004; `context-menus.md`: menu items also belong in the main interface) | **Accept.** A "Delete note" button at the editor's foot, confirming as today. |
| Notes | **High:** "Restore default notes" overwrites every note the user wrote, and v1's alert hides it | **Accept, as an additive restore:** it adds back missing defaults and removes nothing. `resetToDefaults` changes; it's not in the handover's don't-touch list. |
| Notes | **High:** swiping the editor away loses a half-written note (`sheets.md`) | **Accept.** With unsaved changes, dismissal asks: Discard changes or Keep editing (react-native-screens' `preventNativeDismiss` on a formSheet, checked in the build). |
| Notes | Medium: D1's sheet options suit reading, not writing | **Accept.** The editor gets its own entry: the large detent only, a header with Cancel and Save, and it follows the keyboard. |
| Notes | Medium: "Preview a note" would sit under 200 rows | **Accept.** It moves above the list; Restore stays at the foot. This settles the brief's open question: Preview stays on this tab. |
| Notes | Low: swipe and menu details; the legacy-note counter; counter announcements | **Accept.** The trailing swipe is Delete alone, since tap already edits. In the context menu Delete is last and destructive (`Link.Menu`, no icons rather than SF Symbols). An over-cap legacy note gets a neutral line. VoiceOver hears the counter at thresholds. The cap is enforced in `onChangeText` as max(280, the note's original length). |
| Both | Sentence case differs from Apple's title-style buttons | **A tension row** for DESIGN-WORKFLOW §3 (an allowed brand choice, owner-confirmed at C4), written with the contracts. |

### 3.3 Stats' composition round (new-work §3: a whole surface inside an established world)

- **The ranked structures,** seven, ordered by resonance before the roll:
  1. the sticker chart: seven columns of stacked stickers with a goal line;
  2. the lined page: one ruled line per day;
  3. the open spread: two facing pages;
  4. the pocket calendar: a strip of day squares, with the day's detail below;
  5. the washi timeline: day cards taped along a line;
  6. the streak chain: the days strung as a garland;
  7. the postcard stack: a postcard per day, with today in front.
- **The roll:** `concept-seed --scope surface --mode operate` dealt **7, 5 and 3**, with 7 leading (`seed:fc916bfd00f1c093`).
  - A first run by mistake (`concept-seed --help`, which the script took as an unscoped roll) dealt a hand that wasn't used.
- **The six catalog challengers were declined** on audience identification and product clarity:
  - a midnight transit map;
  - a Crouwel grid specimen;
  - a jet-age ticket wallet, whose VOID stamps contradict "never punish";
  - a design annual's plates;
  - a timetable slide rack;
  - a variable-font specimen.

  Each lends the lead one discipline: legible days, whole cells, nothing disappears, hairline dividers, state as a mark in a fixed cell, and scale alone.
- **The sketches,** at 390 × 844, use the real tokens, Pomo & Doro's celebrating art, the goal and streak icons, and an embedded Baloo 2. There are three: the postcard stack, the washi timeline and the open spread. They sit in `.impeccable/mocks/decision/stats-*.html` (git-ignored) and move to `art/review/` once the round resolves.
- **The decision page** is served at `127.0.0.1:65331` (key `32ace395`). The owner also has the three screenshots in the conversation.
- **How the choice was made:**
  - The owner asked to see every design in detail, then answer through questions. A private page, [Stats Week Layouts](https://claude.ai/artifact/5SrZm2Ei23nARfyYyrSY1p), shows the three sketches live at 390 × 844, each with what it does well and what to watch.
  - The decision page closed unanswered (`--wait` exited 4) once the pane moved to that page, so the round ended on the structured question, as the skill's fallback allows.
- **The owner, 2026-10-31: "The postcard stack",** the dealt lead (recorded with `concept-seed --kind assigned`).
- **The sketches are kept** in `art/review/`:
  - `d2-stats-postcard-stack.html`, the locked composition;
  - `d2-stats-washi-not-chosen.html`;
  - `d2-stats-spread-not-chosen.html`.

### 3.4 The direction contracts

Each brief now ends with its six-block contract (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH). Each opens with what was resolved since the brief:
- **Stats** (`.impeccable/surfaces/app-tabs-stats-tsx.md`):
  - the postcard stack;
  - one summary line;
  - each day's value printed, and an empty day one dashed cell in `edgeStrong`;
  - today's postcard with its goal cells;
  - the goal and streak strip, with a "Turn on a daily goal" button when it's off;
  - today first at AX sizes;
  - fitting an iPhone SE with the banner;
  - Phase 3's partner stickers inside each postcard.
- **Settings** (`app-tabs-settings-tsx.md`):
  - the system wheel for every number, a new dependency (`@react-native-picker/picker`);
  - one Notifications group;
  - the appearance switch retired;
  - About's footer carrying the origin line;
  - Reset in its own last group.
- **Notes** (`app-tabs-notes-tsx.md`):
  - Preview above the list;
  - Delete by swipe, menu (`Link.Menu`) and the editor's button;
  - an additive restore;
  - the editor as its own large sheet with an unsaved-changes guard;
  - 20 new name-free defaults, for the owner's copy review.
- **Gift** has no contract: a retirement, carried by Settings' About footer and the build list.

**Checked before the approval ask:**
- **The iPhone SE fit,** which the Stats contract promises: the postcard stack rendered at 375 × 667, with a 20 pt status bar, a 49 pt tab bar, the banner 12 pt above it, and the summary line. With a 30 pt pitch and a 138 pt card for today, everything fits above the banner: the week, today, the goal and streak, and the all-time line. The render is kept as `art/review/d2-stats-postcard-stack-se.html`.
- **The requirements:**
  - FR-SET-002 asks only that both themes exist, so following the phone meets it; `app.json` already sets `userInterfaceStyle: "automatic"`.
  - FR-STA-004 allows any custom goal, so the goal wheel steps by 1 minute.
  - FR-STA-003 says "a 7-day chart". The postcard stack shows the seven days without being a chart by that wording, so the Stage D plan's §9 gets the amended statement.

### 3.5 What follows the briefs

1. **The owner confirms the four briefs,** or corrects them once.
2. **`/apple-design` on each brief.**
3. **A composition round for Stats:** two or three HTML sketches of the week, as for Classic at C4 and the welcome in D1. The week's layout is the one materially open choice.
4. **The direction contracts,** which the owner approves.
5. **The build**, in this order:
   - Settings first, since its number wheel decides a dependency;
   - then Notes, with the default notes for the owner's review;
   - then Stats;
   - then the gift screen's retirement and the About line;
   - then Fly's icons and tokens;
   - last, the emoji check and `legacyColors`' deletion.
6. **The reviews, `break-ui`, polish,** and the device check on the next build, which also carries D1's finish-review fixes.

### 3.6 Built: Settings, the theme, and the gift screen's retirement (`23e595c`)

**The dependency:** `@react-native-picker/picker` 2.11.4, Expo SDK 58's pinned version (`bundledNativeModules.json`), released 2025-10-15. Installed with `npx expo install`; the lockfile adds only that package. It's native, so it ships with the next EAS build.

**Settings,** as its contract describes:
- **The pieces:** `SettingsList.tsx` holds them: `ListGroup` (a header, a paper field with hairline separators, a footer), `SwitchRow`, `ValueRow` (a value that opens its control under the row, reporting `expanded`), `TimeRow` (the compact `DateTimePicker`), `ButtonRow` and `NumberWheel`.
- **The wheel** lists the range, plus a stored value outside it, so it always opens on what's stored.
- **Opening:** one wheel is open at a time. A row opens with `LayoutAnimation` over 200 ms, opacity only; with Reduce Motion, in place.
- **Durations:** a wheel change goes through `editCustomPatch`, read from the store at the moment of the change, so it selects Custom (build 48, F4).
- **The goal:** the four presets and Custom on D1's segmented control, with Custom's wheel running from 1 to 1,440 minutes. The switch turns it off and restores the last goal.
- **Notifications:**
  - Session alerts (`settings.notifications`, the end-of-session notification), the daily reminder and quiet hours sit in one group.
  - **They stay independent switches,** each named for what it governs. "Master switch" would have changed behaviour: the reminder never depended on session alerts.
  - A denied permission shows the reason in the group's footer, with an "Open iOS Settings" row (`Linking.openSettings()`).
- **About** keeps the welcome replay, the update check and the developer's website. Its footer is the origin line, with the name from `APP_NAME` (`expo-constants`, `app.json`), and the credit, which holds B7's 1.5 s long-press to the start-up probe. The credit's emoji is gone.
- **Removed:**
  - the typed fields and every `InputAccessoryView`;
  - the System / Light / Dark switch, Background Animations, and the streak line, which Stats shows;
  - the emoji headings.
- **The React Compiler** now compiles the screen (72 compiled, 5 skipped). v1's `try` / `finally` in the reminder toggle had made it skip; it's a promise chain now.

**The theme:** `useTheme` reads `useColorScheme()` only. `settings.themeMode` stays in storage, and the v1.3.1 fixtures' `'dark'` value is kept and ignored. `app.json` already sets `userInterfaceStyle: "automatic"`, so native controls follow the same appearance.

**The gift screen:**
- `GiftModeModal` and its gate in `App.tsx` are removed.
- `useWelcomeGate` no longer requires `hasSeenGiftMode`.
- `uiStore` still reads that stored flag to pick the welcome's line (`welcomeAudience`): `fresh` on a new install, `updated` for 1.3.1 updaters.
- `welcome.test.tsx` now checks that a fresh install gets the welcome with the fresh line.
- The router tests, which are about tabs and links, mark the welcome seen in their setup.

**DEF-008's test:** the SRS's FR-SET-001 cites `settingsKeyboard.test.tsx` for DEF-008, the number pad that couldn't be left. Deleting the file broke `check-docs`. The file stays and now proves the cause is gone: no number row opens a keyboard, and none has an accessory. The SRS's wording for that evidence is in the Stage D plan's §9. This was fixed in the commit after `23e595c`; the record commit before it had gone in over the failing check.

**Guards** at this commit:

| Guard | Result |
|---|---|
| Jest | 49 suites, 365 tests, all passing (after the DEF-008 test's rewrite) |
| Lint | 0 errors, 30 warnings (31 before) |
| tsc | Clean |
| React Compiler | 72 compiled, 5 skipped |

### 3.7 Built: Notes (`de3867c`)

**Notes,** as its contract describes:
- **The rows:** one inset group of paper rows in a `FlatList`, the first and last carrying the group's corners, with hairlines between.
  - A tap opens the editor through an Expo Router `Link`.
  - A long press opens the native menu: `Link.Menu`, with Edit, then Delete, last and destructive, and no icons.
  - A trailing swipe gives Delete (Gesture Handler's `ReanimatedSwipeable`, on the UI thread).
  - VoiceOver has Edit and Delete as custom actions. Every delete asks first.
- **Above the list:** the title, with the count beneath it, Add, and "Preview a note". Preview opens D1's love-note sheet with a random note. When that sheet closes, the Timer's subscription marks it seen, which is harmless here.
- **At the foot,** "Restore default notes": `restoreDefaults()` adds back the defaults that are missing, at the end, and removes nothing. The line under it says how many came back, or that all of them are already there.
- **Empty:** Pomo & Doro, "Add a note for after your next focus", and Add. An empty stored list still hydrates as the defaults (B3), so the empty state shows only in the session that emptied it.

**The editor** (`/note-editor`, `NoteEditor.tsx`):
- **The sheet:** a formSheet at the large detent (`sheetOptions.noteEditor`), on the page colour, with its own header: Cancel, the title, Save.
- **The field:** multi-line, and it follows the keyboard (`automaticallyAdjustKeyboardInsets`).
- **The cap:** `onChangeText` cuts at max(280, the note's own length). The countdown shows in the last 30 characters, and VoiceOver hears it at 30, 10 and 0. A legacy note over 280 gets a neutral line instead.
- **Unsaved changes:** the sheet can't be swiped away (`gestureEnabled: false` through `Stack.Screen`), and Cancel asks: "Discard changes" or "Keep editing".
- **Delete note** sits at the foot of an existing note.

**The defaults** (`defaults.ts`): 20 name-free notes in each language. `notesStore` seeds a fresh install in the app's language, and the empty-list fallback note follows it. v1.3.1's set stays frozen in `legacyLoveNotes.ts` for existing installs, and B2's tests are unchanged and green. **For the owner's copy review:**

| # | English | Turkish (draft) |
|---|---|---|
| 1 | Tiny focus, big love 💗 | Minik odak, kocaman sevgi 💗 |
| 2 | I'm proud of you, truly. | Seninle gerçekten gurur duyuyorum. |
| 3 | One session closer to your dreams. | Hayallerine bir oturum daha yaklaştın. |
| 4 | Breathe in, breathe out. You've got this. | Derin bir nefes al, ver. Bunu başarabilirsin. |
| 5 | Focus now, hugs later 🫶 | Şimdi odak, sarılmalar sonra 🫶 |
| 6 | Your effort is the cutest thing. | Emeğin dünyanın en tatlı şeyi. |
| 7 | Gentle focus, strong heart. | Sakin odak, güçlü kalp. |
| 8 | Small steps still count. This one did. | Küçük adımlar da sayılır. Bu da saydı. |
| 9 | May your focus be cozy and your breaks sweet. | Odağın sıcacık, molaların tatlı olsun. |
| 10 | Keep going, you're doing great. | Devam et, harika gidiyorsun. |
| 11 | I believe in you, always. | Sana her zaman inanıyorum. |
| 12 | Every session brings you closer. | Her oturum seni biraz daha yaklaştırıyor. |
| 13 | Look at you, getting it done. | Şuna bak, işini bitiriyorsun. |
| 14 | Session by session, you're shining. | Oturum oturum parlıyorsun. |
| 15 | Rest well, you've earned it 💗 | İyi dinlen, bunu hak ettin 💗 |
| 16 | Your dedication is beautiful. | Kararlılığın çok güzel. |
| 17 | Be proud of the work you just did. | Az önce yaptığın işle gurur duy. |
| 18 | You've got this 🌸 | Sen bunu yaparsın 🌸 |
| 19 | Tiny victories, endless love. | Küçük zaferler, sonsuz sevgi. |
| 20 | Break time is self-care time. Enjoy it. | Mola, kendine iyi bakma zamanı. Tadını çıkar. |

**Jest:**
- `ReanimatedSwipeable` is replaced in `jest.setup.ts` by a plain wrapper. Its v3 hooks call a shared value's `removeListener`, which Reanimated's mock lacks, and the timer that calls it crashed the worker.
- `Link.Menu` renders only on iOS inside a link, so `notes.test.tsx` stands it in, and its actions are tested through the VoiceOver actions they mirror.
- The router tests render the real screen inside Expo Router, links included.

**Guards** at this commit:

| Guard | Result |
|---|---|
| Jest | 50 suites, 379 tests, all passing |
| Lint | 0 errors, 30 warnings |
| tsc | Clean |
| React Compiler | 75 compiled, 5 skipped |

### 3.8 Built: Stats, the postcard stack (`b2db8c1`)

As its contract describes (`StatsScreen.tsx`, `stats/WeekStack.tsx`):
- **The summary line:** "Last 7 days: 11 sessions · goal reached on 3 days", or minutes in the Minutes view. It's `accessibilityRole="summary"`, read first.
- **The stack:** six `DayEdge`s, oldest at the top, each a postcard's top edge.
  - Each is tucked under the next (`marginBottom: -8`) and tilted ±0.6°.
  - It carries its short weekday and date, up to four 18 pt stickers with "+n", its count in tabular figures, and the goal flag.
  - An empty day is one dashed cell in `edgeStrong`.
  - In the Minutes view, the stickers become a fill toward the day's goal (`ringFocus`, or `ringBreak` once past it).
  - VoiceOver reads one element per day, for example "Tuesday 28, 3 sessions, 75 minutes, goal reached".
- **`TodayCard`:** the long date, "Today", its stickers at 40 pt with dashed cells to the goal (`goalCellsLeft`, capped at eight cells), and "1 session · 25 min · 25 min to the goal".
- **The strip:** the goal (flag, `successInk`) and the love streak (streak, `primaryInk`). With the goal off, "Turn on a daily goal" navigates to Settings. An empty week offers "Start a session", which goes to the Timer.
- **All time:** sessions and minutes in the locale's digits.
- **Sizes:**
  - A screen under 700 pt tall tightens the pitch to 30 pt and the card's stickers to 34 pt (the SE render, §3.4).
  - At AX sizes, a list with today first.
  - In landscape, today leads and the stack trails.
  - Centred at 560 pt.
  - Stickers and icons grow up to 1.3×.
- **The banner:** its block is unchanged (the first-focus request, `bannerStatus`, the window measurement). It's re-tokened to `paper` and `edge`, with about 12 pt above the tab bar.
- **No motion on entry.** The Sessions / Minutes switch changes the content in place.

**Tests:** `stats.test.tsx` (new) covers the summary, today, the seven day elements (the goal days, no "missed"), the strip, the Minutes view, goal off, the empty week, and all time. The router tests' Stats marker is now the summary line.

**Guards** at this commit:

| Guard | Result |
|---|---|
| Jest | 51 suites, 385 tests, all passing |
| Lint | 0 errors, 30 warnings |
| tsc | Clean |
| React Compiler | 80 compiled, 5 skipped |

### 3.9 Built: no emoji as icons, Fly's icons, and `legacyColors` deleted (`5849286`)

**The emoji check** (`scripts/design/check-emoji.mjs`, run by `src/__tests__/noEmojiIcons.test.ts`, `// covers: NFR-UX-002`):
- **What it flags:** every Extended_Pictographic code point, or the emoji variation selector, in `src/` and `app/`, skipping tests and fixtures.
- **What it allows:** the default notes (`defaults.ts`), v1.3.1's frozen notes (`legacyLoveNotes.ts`), and push copy (`useNotifications.ts`, `notifications.ts`).
- **The first run found 17 hits;** all are resolved.

**Fly's emoji,** swapped for the custom icons. Fly is otherwise not redesigned; that's Phase 4b.
- **Icons:**
  - the camera control is `fly`, `route` or `hand`;
  - the globe toggle is `map` or `globe` beside its word;
  - "Landed!" gets `landed`;
  - "Start flight" gets `fly`;
  - the timer pill gets `fly`;
  - the landing love note's heart is `heart`.
- **Text:** the map hints lose their emoji, and the mode strip's "· 🌍" becomes "· Globe".
- **Push copy:** Fly's landing notification moves into `useNotifications.ts` (`flightLandedContent`).
- **The strays:** the update alert loses its sparkle, and a store comment loses its check mark.

**`legacyColors` deleted.** Its last callers were Fly's screen, its airport picker, its timer pill, its landing note, the Timer's Fly placeholder, the start-up probe and the 404 page. Each `colors.X` is now the token the adapter mapped it to, so no pixel changes: 39 uses in 7 files, swapped by a script that refused any unmapped name. `useTheme` returns `{ theme, tokens, isDark }`. `legacyColors.ts` and its test are removed, and `expo-linear-gradient` had already gone.

**Fly's re-tokening, the rest:**
- The compass chip and the two mismatched chips are still in v1's own styling (`ValentineSpec`), and so is `LoveNoteCard`'s stacking under the controls. They're beyond the adapter, which only mapped the shared names.
- They stay for Fly's own redesign (Phase 4b), and the D1 record's note stands.
- Fly as a sticker in the Modes sheet also waits for new art.

**Guards** at this commit:

| Guard | Result |
|---|---|
| Jest | 51 suites, 356 tests, all passing (`legacyColors.test.ts`'s cases left with it) |
| Lint | 0 errors, 29 warnings |
| tsc | Clean |
| React Compiler | 80 compiled, 5 skipped |
| The emoji check | Clean |
| `check-docs` | 0 errors |
| Reassure (`npx reassure --branch`) | Timer 13, Stats 1, Settings **1** (2 before D2), Notes 1, leaf 12, settings-only 1. The Notes case first failed: Expo Router's `Link` needs the provider its root navigator supplies, and the perf test renders the screen alone. `screens.perf-test.tsx` stands the link in, as `notes.test.tsx` does; the router tests render the real one |
| iOS bytecode (`npx expo export --platform ios --dump-sourcemap`) | **4,112,584 B**: +62,176 B (+1.5 %) on D1 after its finish fixes (4,050,408 B). Now **6.65 % over** NFR-PERF-002's limit of 3,856,208 B (5.04 % before D2). The new code is the picker's JS, the grouped list, the note editor and its swipe, the postcard stack, and the strings. E3 revisits |

### 3.10 Build 51 (the owner, 2026-10-31: "send to build and auto submit for me to test")

The first build with D2's screens. It also carries D1's finish-review fixes, as the owner asked (D1 record §3.20). The owner's message named the build and the submission, not the tag push, so the tag is local.

| Item | Value |
|---|---|
| Commit | `d96eb7c` on `phase1/stage-d` (the branch stays unpushed) |
| Command | `eas build --platform ios --profile production --non-interactive --no-wait --auto-submit --json` |
| Pre-flight | The tree clean; Reassure and the guards green (§3.9). `expo-doctor`: 18 of 20 checks pass. One failure is the long-standing `@expo/config-plugins`. The other is new since build 50's check this morning: Expo has published `expo` 58.0.22 and `@expo/metro-runtime` 58.0.16, and the project has 58.0.21 and 58.0.15. Those are patch releases published today, so the two-week rule keeps them out; E3 or a later build picks them up |
| Version and build | 1.4.0 (51); EAS incremented the remote build number from 50 |
| EAS build | `1c2a4c52-0375-4f59-a7cf-b2b668afbd0e`, queued 2026-10-31 15:08 UTC (18:08 UTC+3) |
| Build result | **Finished** 15:14 UTC (18:14 UTC+3); EAS reports the source as `d96eb7cc` |
| TestFlight submission | `f432937f-3e98-4d10-b06d-a5a106ba8107`, **finished**: EAS's `submit-ios` workflow succeeded at 15:14:23 UTC |
| Tag | `v1.4.0-tf.51`, annotated, on `d96eb7c`, **pushed** after the owner's "Push the tag". The remote tag object is `0a5b3c1` and peels to `d96eb7c`; the branch stays unpushed |
| IPA | **21,698,007 B**, +88,425 B (+0.41 %) on build 50 (21,609,582 B): the picker's native module and D2's code |

The device check is §6 "build 51", together with the D1 record's list of the same name.

### 3.11 The build 51 device check: three findings, fixed (`8ed1b09`)

**The owner, 2026-10-31,** sent 10 screenshots, saying: "Two important things that needs urgent look is the notes page and in the fly mode the button for view mode change that has the hand icon does not change mode or itself when i press it. the button flicks to another symbol but it goes back to the hand emoji. You may also check the other pages as well."

| # | Finding | Cause | Fix |
|---|---|---|---|
| N1 | **Notes:** the rows render as loose lines of text, with no paper and no padding, the red Delete action shows behind every row, and some text runs into it or is clipped | Expo Router's `Link` renders its child inside a `Text` unless it's given `asChild` (`BaseExpoRouterLink`: `asChild ? Slot : Text`). The row's `View` was laid out as inline text, and the swipe's action, drawn behind the row, showed through the transparent line. Jest never saw it: the Notes tests stand the link in, and the real link's native preview view renders nothing under Jest | The note `Link` takes `asChild`, and its trigger is the row as a `Pressable`, which the link hands its press to. **Test:** the Notes tests' link stand-in records its props, so every note link must be `asChild`, and the row must be a paper-backed pressable. The test fails without `asChild` |
| F1 | **Fly:** during a flight, tapping the camera button flicks to the next mode's icon, then snaps back to the hand (free) | The map's `onRegionChange` entered free mode on every camera move. Fly's own moves, following the plane and fitting the route, fire it too, so the button's change was undone at once. v1 had the same handler. Apple Maps can't tell a gesture from an animation (react-native-maps: `isGesture` is Google Maps only) | Only a move while a finger is on the map enters free mode: `onTouchStart` / `onTouchEnd` mark the touch, plus a 600 ms tail for a flick's deceleration. The button's modes now stay. **Test:** `flyCamera.test.tsx` (new) starts a flight and checks that Fly's own camera moves keep "follow" and "route", that a finger's move enters free mode, and that the button brings the camera back. Against the old handler it fails exactly as on the phone: "Camera mode: free" after Fly's own move. The map's Jest mock now passes its touch and region handlers through |
| S1 | **Settings:** the goal's "100 min" segment wraps onto two lines and pushes "Custom" out of line | Five segments with a unit each don't fit about 69 pt | Plain numbers (25 · 50 · 75 · 100 · Custom) under one caption, "Minutes a day" ("Günde dakika"), as the Timer layout row has its caption. VoiceOver still reads "50 minutes a day" |

**The other pages,** checked against the screenshots:
- **Facing Pages:** "You" over Pomo and "Doro" over Doro at the top, the frame below them, the partner line on Doro's page, the pages leaning in from the spine, the stickers lifted. The checklist's items 1 and 2 hold.
- **The Ring:** the paper partner strip; "Today" with its dashed goal cell; Skip clear of the tab bar.
- **Stats:**
  - the summary line, the stack and today's card;
  - the Minutes view's fills (Friday full at 65, today's dot at 1 of 50);
  - the strip, the totals;
  - the banner in its slot above the bar.
- **Settings:** the grouped list, the time chip, the footers, About's origin line, Reset.
- **Fly:** the camera control, the compass chip and the globe toggle have icons; the pill shows the fly icon.

**No build for these fixes alone** (the owner, 2026-10-31): "let's not build 52 yet. We will check the fixes after the next step because our build rights have a limit due to expo." The fixes ride on the next build, together with what D2's reviews change. That build also carries the D1 record's six recaptures.

**Guards** at `8ed1b09`:

| Guard | Result |
|---|---|
| Jest | 52 suites, 358 tests, all passing |
| Lint | 0 errors, 29 warnings |
| tsc | Clean |
| React Compiler | 80 compiled, 5 skipped |
| The emoji check | Clean |
| Reassure | Passing |

### 3.12 The four reviews, and the fix batch (DESIGN-WORKFLOW §2 steps 4 and 6)

**The owner, 2026-10-31:** "Start the reviews".

**How they ran.**
- **The critique and the native audit** ran in this context, as D1's did (D1 record §3.12): on a native platform the critique is Impeccable's design review alone, with no degraded banner. Both are read from source against each screen's direction contract, because there's no Simulator on this machine.
- **`/apple-design` (a code audit) and `review-animations`** each ran in a sub-agent briefed with the code paths, the contracts and the owner's settled decisions, so their reads weren't anchored on the critique's.
- The gate is read as D1 read it: the audit out of 20 (NFR-UX-003, ≥ 16), the critique proportionally (≥ 80 %).
- The skills load from stage-c's copies; `diff -rq` (excluding `apple-design`'s `.git`) finds them identical to this worktree's.

**First pass.** Snapshots: `.impeccable/critique/2026-10-31T17-42-32Z__app-tabs-{stats,settings,notes}-tsx.md`.

| Screen | Critique | Audit (A, P, T, C, Ad) | `/apple-design` | `review-animations` |
|---|---|---|---|---|
| Stats | 27/32 (5, 9 n/a) | **15/20** (2, 3, 4, 3, 3) | **Critical S-1**: the day names truncate. Medium S-2 (the Minutes track at 1.13:1 on paper), S-3 (the flag doesn't grow) | Clean |
| Settings | 34/40 | 17/20 (3, 3, 4, 3, 4) | No Critical. Medium T-1 (two VoiceOver stops per switch row), T-2 (the switch track's contrast), T-3 (values look static), X-1 (the denied footer is silent on iOS); Low T-4 (the footer in `dangerInk`) | Not clean: the wheel's curve, nothing under Reduce Motion, a preset closes the wheel unanimated |
| Notes | **A P0**; 35/40 with it fixed | 16/20 with it fixed (3, 3, 4, 3, 3) | No Critical. High N-1 (Save's state by hue alone); Medium N-2 (an edited sheet bounces silently), N-3 (the field's edge at 1.26:1), X-1 (Restore is silent on iOS); Low N-4 (no pressed state), N-5 (the swipe's Delete at AX sizes) | Not clean: the swipe moves at half the finger's speed and stops dead; no feedback on a tap; Add's haptic |
| All | | | X-2 (titles in the content, not a collapsing large title), X-3 (no Increase Contrast variants) | Outside motion: the swipe's Delete draws a black line on the first and last rows |

**The P0: build 51's fix would have broken the note rows again in build 52.**
- **What happens.** `Link asChild` hands the trigger through Expo Router's `Slot` (`BaseExpoRouterLink.js:120`), and `Link.Trigger` renders the row through the `Slot` again (`elements.js:173`). The Slot is Radix's, and it merges styles as `{ ...slotStyle, ...childStyle }` (`@radix-ui/react-slot/dist/index.js:133`).
- **What it does to the row.** The row's style was an array, so it spread into `{"0": …, "1": …}`. React Native ignores those keys: in a release build the row would have had no paper, padding, border or corners, which is build 51's broken page from a second cause. A development build throws instead: "You are passing an array of styles to a child of <Slot>" (`expo-router/build/ui/Slot.js:99`).
- **Reproduced** before it was reported, with a throwaway test through the real `LinkTrigger`. Outside production it threw that error. With `NODE_ENV=production` the row's style came back as `{"0":{"paddingHorizontal":20,"minHeight":44},"1":{"backgroundColor":"#FFF8F0"},…}`. A flattened style came through intact.
- **Why §3.11's test missed it:** its stand-in rendered the trigger's child directly, skipping the Slot.

**The owner's dispositions, 2026-10-31:**
- "All 17": every fix below.
- The discard question: "Action sheet".
- Stats' switch: "Keep instant". The contract's 150 ms crossfade is amended to an instant swap; the motion review found the instant swap clean, and the device check confirms it doesn't read as a flash.
- The delete reflow (rows below jump up after a delete): "Leave it for polish". It needs keys that don't include the list index; with no storage change, they would come from the note's text and its occurrence.

**The fix batch:**

| Screen | Finding | Fix |
|---|---|---|
| Notes | P0: the rows lose their style | The row's style is one `StyleSheet.flatten`ed object. A function style is dropped by the Slot too, so the pressed tint (`field`, N-4) comes from `onPressIn` and `onPressOut` state. |
| Notes | The swipe lags and stops dead | `friction` back to 1, so the row tracks the finger; `overshootFriction` 8 instead of `overshootRight={false}`. A `danger` underlay beside the action, not under it, keeps the stretch red and lets the pressed action (opacity 0.85) dim against the page. |
| Notes | A black line on the first and last Delete | The action takes the row's corners only, never its border widths, whose uncoloured edge iOS draws black. |
| Notes | N-5: Delete at AX sizes | `maxFontSizeMultiplier` 1.3, one line. |
| Notes | Add's haptic | `haptic={false}`: PressableScale's own rule, off where a press only navigates. |
| Notes | X-1: Restore is silent | `AccessibilityInfo.announceForAccessibility` with the result; `accessibilityLiveRegion` is Android-only. |
| Notes | N-2: an edited sheet bounces silently | `usePreventRemove(dirty && !exiting, …)` replaces `gestureEnabled: !dirty`. It sets the native prevent-dismiss, so a swipe is held and comes back as a blocked removal (`RNSScreen.mm:676-692`). Cancel and the swipe ask the same question in an action sheet ("Discard changes", destructive; "Keep editing"). Leaving on purpose (Save, Delete, a confirmed discard) sets a ref and an `exiting` state together. The ref lets a removal that's still blocked go straight through (`repeat()`, which turns prevention off before re-dispatching), because `dirty` is stale until the next render. The state turns the hook's flag off in the same handler, as the hook asks: a new note stays "dirty" after Save, and a flag left on would warn in development and disagree with the prevention. |
| Notes | N-1: Save's state by hue alone | Disabled is the same `primaryInk` at 40 %, as a system bar button dims. |
| Notes | N-3: the field's edge | `edgeStrong` (palette.json: boundaries that identify a control, 3:1). |
| Stats | S-1 (Critical): the day names truncate | In the stack the day column is 56 pt × the font scale (from 1, uncapped below the list's threshold), with no line limit. In the AX list the name takes a line of its own. |
| Stats | S-3: the flag | 14 pt × `grow` (the stickers' cap, 1.3), its cell too. |
| Stats | S-2: the track | An 8 pt track with a 1 pt `edgeStrong` outline, so the goal's length reads on paper. |
| Settings | X-1, T-4: the denied footer | Announced when `enableDailyReminder` returns false, and a plain footer in `inkSoft`; the "Open iOS Settings" row carries the action. |
| Settings | T-1: two VoiceOver stops | A switch row's label `Text` is `accessible={false}`; the Switch carries the label. The time rows keep their label readable, because the compact picker's own button may not take the wrapper's label (`datetimepicker.ios.js` passes it to the wrapper view). |
| Settings | Wheel motion | `create` and `delete` fade with ease-out, `update` (the rows below) eases in and out, over 200 ms. Under Reduce Motion the same config without `update`: the fade stays, the movement goes (NFR-A11Y-004). One `closeWheels()` animates a wheel closed from a preset, the goal switch and Reset alike. |
| Settings | The wheel list | Rebuilt only when the range changes or a stored value falls outside it, not on every turn (the goal's has 1,440 items). |

**Kept, with reasons:**
- **T-2, X-3:** the switch track's contrast and Increase Contrast variants belong to one palette pass, not a screen fix. The knob's position also shows the switch's state.
- **T-3:** the value colours are the Settings contract's (`inkSoft`, `primaryInk` while open).
- **X-2:** the titles stay in the content on every tab, as D1 kept them.
- **The tab-press haptic:** a recorded decision (DEF-007).
- **The Timer group shows Custom's durations while a preset runs:** decided in build 48 (F4).
- **Stats' full Minutes fill in `ringBreak`:** kept, because the flag also marks the goal.

**Tests.** Notes' were run against the old row. The others assert values the old code didn't have (a fixed 56 pt column, a 14 pt flag, a different animation config) and weren't run against it.
- **`notes.test.tsx`:** the link stand-in renders through Expo Router's real `Slot`, as the device does. Against the old row, six tests fail with the Slot's error.
  - New: the pressed tint; the Delete action's corners, colour and no border; the restore announcement.
  - The editor: the action sheet from Cancel; the same question from a blocked swipe, and only while dirty; Save leaving without asking; Save's dimming and the field's edge.
- **`router.test.tsx`, on the app's real navigator,** because the Notes suite stands `usePreventRemove` in (the same blind spot as the P0's stand-in):
  - Save closes the sheet without asking, and the note is kept.
  - A blocked way out (`router.back()`, what a swipe sends) keeps the editor open and asks; Discard then leaves.
  - **What they prove:** with the guard turned off, the second test fails (it lands on `/notes`). The first passes even with the ref path broken. Under the real navigator, `router.back()` is queued behind the `exiting` state, so prevention is already off when it's processed. It proves the outcome, not which path produced it; the ref covers a dispatch that isn't queued.
  - **How the library holds it** (`expo-router/build/global-state/removalPrevention.js`): the prevented routes are React state, and the blocked-removal event is reported from a layout effect after a render (`useNavigationTreeReportEvents.js:124`). So `repeat()` queues the prevention change, then dispatches, as the hook's own documented example does.
- **`stats.test.tsx`:** at xxLarge (font scale 1.235), the day column is 56 × 1.235 with no line limit, and the flag is 14 × 1.235. At an AX size, the name takes a line of its own.
- **`settings.test.tsx`:** one VoiceOver stop per switch row; the denied announcement; the wheel's motion, the same without `update` under Reduce Motion; the Custom goal wheel closing animated when a preset is chosen.

**After the fixes.** Snapshots: `.impeccable/critique/2026-10-31T18-04-31Z__app-tabs-{stats,settings,notes}-tsx.md`.

| Screen | Critique | Audit (A, P, T, C, Ad) | `/apple-design` | `review-animations` |
|---|---|---|---|---|
| Stats | **27/32** (84 %) | **16/20** (3, 3, 4, 3, 3) | No Critical: S-1, S-2, S-3 fixed | Clean (the instant switch is the contract now) |
| Settings | **36/40** (90 %) | **18/20** (3, 4, 4, 3, 4) | No Critical: T-1, T-4, X-1 fixed; T-2, T-3 kept | Clean |
| Notes | **37/40** (93 %) | **17/20** (4, 3, 4, 3, 3) | No Critical: N-1 to N-5, X-1 fixed | Clean, with the delete reflow left for polish (the owner) |

The scores after the fixes are this context's re-reading against each finding, each now with a test. The sub-agents weren't re-run. The Accessibility and Adaptivity scores stay provisional until the device check, as D1's did.

**Feel checks for the device** (from the motion review):
- Swipe a note slowly, then flick it; interrupt the close and reverse it; drag past Delete, and it should stretch over red.
- Long-press the first, middle and last rows: the menu's preview has the row's shape. A long press dragged sideways goes cleanly to the menu or the swipe.
- Settings' wheels: on close, does the fading wheel show through the rows sliding up over it? If so, the rows get a `paper` background.
- Daily goal › Custom: does the segmented indicator slide twice, since Fabric's layout animation also animates transforms? If so, the wheel opens a frame later.
- Stats' switch: the stickers and fills swap at once while the pill slides; check that it doesn't read as a flash.
- The editor: type, then pull the sheet down. It should hold and ask. Delete back to the original text, and the swipe should dismiss without asking.

**Guards** after the fix batch:

| Guard | Result |
|---|---|
| Jest | 52 suites, 371 tests, all passing |
| Lint | 0 errors, 29 warnings |
| tsc | Clean |
| React Compiler | 80 compiled, 5 skipped |
| The emoji check | Clean |
| Reassure | Passing: Timer 13, Stats 1, Settings 1, Notes 1, leaf 12, settings-only 1 (unchanged) |

### 3.13 `break-ui` (DESIGN-WORKFLOW §2 step 5)

**The owner, 2026-10-31:** "Start the test".

**How it ran.** As D1's did (D1 record §3.13):
- **No in-app toggle.** A worst-case toggle inside a TestFlight build would ship to the App Store, which `break-ui` forbids (rule 4).
- **The worst-case data** is a Jest regression fixture, `d2WorstCase.test.tsx`: Turkish (the device locale mocked to `tr-TR`), AX5 (font scale 3.1) on an iPhone SE-sized window (375 × 667), and the data below. It pins what holds; each break gets its assertion when it's fixed.
- **Logic findings** were verified by rendering: strings, counts, number formats, what the store keeps, what the editor's field holds.
- **Layout findings are inferred** from the styles, with SF Pro's advance widths estimated per glyph. Jest can't measure layout, so the device check confirms them.

**The limits found:**
- focus 1–180 minutes, short break 1–60, long break 1–120, the cycle 2–10 (`DURATION_LIMITS`, Settings);
- the goal 1–1,440 (FR-STA-004);
- a note: 280 code units in the editor (a legacy note keeps its length); the store has no limit, and the number of notes is unbounded;
- sessions in a day: unbounded (16 hours of 25/5 is 32; a 1-minute focus allows hundreds).

**The worst case:**
- **Stats:** today 32 sessions (800 min), a 34-session day, 50-minute sessions, a single session, two empty days, the goal at 1,440 (reached on no day), a streak of 0 with a best of 12.
- **Settings:** 180 / 60 / 120 minutes, every 10 sessions, a custom goal of 1,440.
- **Notes:** 200 notes, a note typed on three lines, a duplicate, an emoji typed at the cap.

**What broke** (first pass, `72315eb`):

| # | Severity | Worst case | What happens | Verified or inferred | Fix |
|---|---|---|---|---|---|
| 1 | Broken | An emoji typed or pasted across the 280 cap (`"a" × 279 + "🍓"`) | `v.slice(0, max)` cuts the surrogate pair: the field and the saved note end in a lone `\uD83C`, which iOS draws as "�" | Verified (the field's last code unit is `d83c`) | Drop a trailing high surrogate (and a trailing zero-width joiner) after the slice (`NoteEditor.tsx:143`) |
| 2 | Broken on a 375 pt iPhone | The editor's header at AX5 in Turkish | "Vazgeç" (about 171 pt) and "Kaydet" (about 167 pt) don't shrink (React Native's default `flexShrink` is 0): 354 pt against 343. Save's label runs past the edge, and the title collapses to nothing on every iPhone. In English the title truncates to "N…" | Inferred | Cap the header's three texts at 1.4×, as the titles are; iOS's own bar buttons stop growing at the accessibility sizes (`NoteEditor.tsx:118-133`) |
| 3 | Ugly | A note typed on three lines | The store's `normalizeNote` folds every whitespace run, newlines included, into one space: it saves as "Birinci satır İkinci satır Üçüncü" | Verified | Decision for the owner (below) (`notesStore.ts:13-16`) |
| 4 | Ugly | A week in which no day reaches the goal | The summary says "Son 7 gün: 103 oturum · 0 gün hedefe ulaşıldı" ("goal reached on 0 days"), which reads as a miss; the contract says nothing does | Verified | Leave the clause out at 0 (`StatsScreen.tsx:126`) |
| 5 | Ugly | The goal and streak strip at AX4–AX5 | Each half has `flex: 1` (basis 0) and `minWidth: 150`, so the strip never wraps; each text column is about 108–117 pt, and "Hedef", "serisi" (and "streak" in English) at 46.5 pt break mid-word | Inferred | In the AX list, stack the halves with a horizontal divider (`StatsScreen.tsx:205-225`, `:281-282`) |
| 6 | Ugly | Numbers of 1,000 or more | One number in two formats on one screen: "Son 7 gün: 2975 dakika" above "Tüm zamanlar: … 2.975 dakika"; "Hedef 1440 dk", "Bugün 640 dk kaldı"; Settings' "1440 dk" | Verified | Pass a formatted `n` (keeping `count` for the plural) in `stats.weekMinutes`, `weekSessions`, `goalTitle`, `leftToday`, `toGoal`, `minutesShort`, `streakValue` and `settings.minutes`, as `sessionsN` and `minutesN` already do |

**Decisions for the owner:**
- **Line breaks in notes (#3):** keep them, collapsing spaces and allowing at most one blank line (recommended: the editor is multi-line and invites them, and the sheet shows them), or make notes single-line, with Return ending the edit.
- **Long notes at AX sizes:** a 280-character note is about 26 lines (about 1,800 pt) at AX5 on an iPhone SE, and a legacy v1 note of 1,200 characters about 7,700 pt. The contract says rows wrap fully; clamping to about 6 lines (the full text in the editor and to VoiceOver) is the alternative. Recommended: keep the contract and judge it at the device check.
- **A streak of 0:** "0 gün · en iyi 12" is factual but reads as a loss beside the best. A softer line at 0, such as "Starts on your next goal day · best 12", is the alternative (PRODUCT principle 2). Recommended: the softer line.
- **Turkish words wider than the screen at AX5:** in Settings, "Güncellemeleri" (about 353 pt) and "Geliştiricinin" (about 321 pt) are wider than a 375 pt iPhone's row (311 pt), and iOS breaks them by character, as it does in its own apps. Recommended: accept, since capping row text would break NFR-A11Y-003.

**What held up:**
- **Stats:**
  - 32 and 34 sessions show 8 and 4 stickers, then "+24" and "+30";
  - empty days are dashed, and VoiceOver hears "oturum yok";
  - the day names have their own lines at AX5 (§3.12);
  - the all-time line is grouped ("2.975");
  - an empty week offers "Bir oturum başlat";
  - at a 1,440 goal, today's dashed cells stop at its two rows, with the minutes left in words (D1 record §4.3);
  - compact height and iPad keep their layouts.
- **Settings:**
  - at AX5 a row's label and value stack, and a switch drops under its label;
  - 180 / 60 / 120, every 10 and 1,440 all show;
  - the goal's five segments wrap 2-2-1 at the 2× cap, and "Karşılıklı sayfalar" (about 113 pt a word) fits its segment;
  - the custom wheel lists all 1,440 minutes.
- **Notes:**
  - 200 notes mount only the first 10 rows (a virtualized list), with "200 not" in the header;
  - a URL with no break opportunities wraps by character on iOS, with no overflow;
  - the swipe's "Sil" is capped;
  - Add wraps under the title.
- **The editor:** whitespace alone can't be saved; a legacy long note keeps its length, with the neutral line.
- **A duplicate note** is dropped on Save (`notesStore.ts:80`). That's harmless: the same text is already in the list.

**The owner, 2026-10-31:** "Fix all", with the recommended answer on each decision.
- Notes keep their line breaks.
- Long notes keep their full text (the contract), judged at the device check.
- A streak of 0 gets the softer line.
- Turkish words wider than a row are accepted.

**The fixes as built:**

| # | Fix |
|---|---|
| 1 | `capText(text, max)` (`NoteEditor.tsx`) cuts at the cap, then drops a trailing high surrogate and a trailing zero-width joiner. A cut can no longer leave half a character, and a join can't dangle. The cap still counts UTF-16 code units, so an emoji costs 2 of the 280, as it always did. |
| 2 | The header's Cancel, title and Save have `maxFontSizeMultiplier` 1.4 (`HEADER_TEXT_CAP`), the cap the screen titles use. At AX5 that is 23.8 pt: about 77 + 75 pt for "Vazgeç" and "Kaydet", which leaves the title about 175 pt on a 375 pt iPhone. |
| 3 | `normalizeNote` (`notesStore.ts`, now exported) keeps line breaks. It turns `\r\n` into `\n`, folds runs of spaces and tabs into one space, drops spaces around a line break, allows at most one blank line, and trims the whole. Every place that shows a note (the list, the love-note sheet, Fly's card) has no line limit, so the breaks show as written. Notes already stored are unchanged: normalizing runs on add and edit only. |
| 4 | The summary leaves out the goal clause when no day reached the goal; with the goal off it was already left out. |
| 5 | In the AX list (font scale ≥ 1.6) the strip is a column: the goal half, a hairline divider inset from the leading edge, the streak half. Side by side the halves keep `flex: 1` and `minWidth: 150`, now on `halfSide` only, because `flex: 1` (basis 0) in a column of no set height would collapse. |
| 6 | `formatNumber` moves to `src/i18n` (from `WeekStack.tsx`) and uses the app's locale map. `stats.weekSessions`, `weekMinutes`, `goalTitle`, `leftToday`, `toGoal`, `minutesShort`, `streakValue` and `settings.minutes` take a formatted `{{n}}` in both languages, with `count` still choosing the plural. "2.975 dakika", "Hedef 1.440 dk" and Settings' "1.440 dk" now match the all-time line. |
| Streak | At 0 the strip says "Starts the day you reach your goal · best 12" ("Hedefine ulaştığın gün başlar · en iyi 12"), or the first part alone when there's no best yet (`stats.streakStart`, `stats.streakStartBest`). The wording is softer than the decision's example; it goes to the owner's copy review with D2's other Turkish strings. |

**Tests:**
- **`notes.test.tsx`:**
  - an emoji typed across the cap is dropped whole, and one that fits is kept;
  - a cut after a zero-width joiner drops the join;
  - the header's three texts cap at 1.4×;
  - a note keeps its line breaks, with spaces folded and at most one blank line, on add and on edit.
- **`stats.test.tsx`:**
  - with no goal day the summary is "Last 7 days: 11 sessions";
  - "Goal 1,440 min";
  - both streak-of-0 lines;
  - "Last 7 days: 1,775 minutes", the edge's "1,500" and the all-time line agree;
  - the strip is a column at an AX size and a row at the default size.
- **`d2WorstCase.test.tsx`,** in Turkish at AX5:
  - "Son 7 gün: 103 oturum";
  - "Hedef 1.440 dk";
  - the softer streak line;
  - the strip as a column;
  - "Son 7 gün: 2.975 dakika";
  - Settings' custom goal "1.440 dk".

**Guards** after the fixes:

| Guard | Result |
|---|---|
| Jest | 53 suites, 382 tests, all passing |
| Lint | 0 errors, 29 warnings |
| tsc | Clean |
| React Compiler | 80 compiled, 5 skipped |
| The emoji check | Clean |
| Reassure | Passing: Timer 13, Stats 1, Settings 1, Notes 1, leaf 12, settings-only 1 (unchanged) |

### 3.14 `polish`, `harden` and `clarify` (DESIGN-WORKFLOW §2 step 6)

**The owner, 2026-10-31:** "Start step 6".

**How it ran.**
- One pass over each screen's whole path: arrival, empty, loading, error, success and permission states, terminology, and the code.
- The critique snapshots of §3.12 are closed by the edits since, so the pass was independent (polish reference §2).
- §3.12–3.13 had already settled the accessibility, motion and worst-case data, so this pass found less.

**Found and fixed:**

| # | Kind | Finding | Fix |
|---|---|---|---|
| 1 | Harden | `enableDailyReminder` returns `false` both when iOS denies notifications and when scheduling fails, so a failed schedule showed "Notifications are off for this app in iOS Settings" and the "Open iOS Settings" row: the wrong place to send people | After a `false`, Settings asks iOS (`getPermissionsAsync`). Granted means a failure: "The reminder couldn't be set. Try again in a moment.", announced, with no iOS Settings row. Denied keeps the denied footer and the row. The store's API is unchanged |
| 2 | Harden | Offline, "Check for updates" did nothing at all: the fetch failed silently, as the launch check must | A check someone asked for (`force`) now says "Couldn't check for updates" / "Check your connection and try again."; the launch check stays silent (`useUpdateCheck.ts`, new `updates` strings in both languages) |
| 3 | Harden | "Developer website" and "Open iOS Settings" left `Linking` rejections unhandled | Each catches its rejection |
| 4 | Polish | The contract says "Turn on a daily goal" opens Settings **at the goal row**; it opened Settings at the top. At the default size the goal group is in view anyway; at AX sizes it's several screens down | A small, unpersisted store (`settingsFocusStore.ts`, after the love-note sheet's) carries the request. Settings scrolls the goal group into view once it has laid out (animated, or not under Reduce Motion), then clears it |
| 5 | Clarify | "Sound and feel" was vague beside its "Haptics" row (iOS says "Sounds & Haptics") | "Sound and haptics"; the Turkish was already "Ses ve titreşim" |
| 6 | Clarify | Turkish "hedefe 25 dk" had no verb | "hedefe 25 dk kaldı" ("25 min left to the goal") |

**Read and kept:**
- The English copy reads in the brand's voice: plain, warm, sentence case.
- Each action names its verb and object ("Delete note", "Restore default notes"). Confirmations name the action on the message and the button ("Delete this note?" / "Delete"). The empty states invite the next step.
- "Session" stays the counted noun on Stats ("Start a session"), matching Classic's "1 session today".
- The quiet-hours footer isn't reworded: rewording it would mean restating what the scheduler does.

**For the owner's copy review** (with every Turkish string, D1's included, and the 20 default notes in both languages):
- The Stats tab is "İstatistik" and its title "İstatistikler" (singular against plural); the Notes tab is "Notlar" and its title "Aşk notları". Should the tab and title match?
- The update prompt's existing alerts are English-only (`useUpdateCheck.ts`). That extraction is D3's (EN/TR), as planned.

**Tests:**
- **`settings.test.tsx`:** a failed schedule says so, is announced, and offers no iOS Settings row; a denial keeps its footer and row (permissions mocked per test). The goal group scrolls into view once laid out, then the request clears.
- **`stats.test.tsx`:** "Turn on a daily goal" requests the goal group.
- **`useUpdateCheck.test.tsx`:** offline, the launch check stays silent and "Check for updates" says it couldn't check.
- **`d2WorstCase.test.tsx`:** "hedefe 640 dk kaldı".

**Guards:**

| Guard | Result |
|---|---|
| Jest | 53 suites, 385 tests, all passing |
| Lint | 0 errors, 29 warnings |
| tsc | Clean |
| React Compiler | 80 compiled, 5 skipped |
| The emoji check | Clean |

## 4. Mathematical / Statistical Details

None yet. The week's sticker capacity and the goal counts will reuse D1's rules (D1 record §4.3) when Stats is built.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|---|---|---|
| The gift screen is retired (the owner) | Keep it name-free before the welcome; fold an origin line into the welcome | One first-run screen, as `onboarding.md` advises. PRODUCT.md already places the origin in About. |
| Stats leads with this week (the owner) | Today, then the week; the streak as the hero | The Timer already shows today's row. The week is what Stats alone can show. |
| A 280-character cap on notes, keeping longer existing notes (the owner) | No cap; 140 | It's long enough for a real note and fits the love-note sheet at large text sizes. Existing notes are never cut. |
| Settings' numbers on the system wheel, `@react-native-picker/picker` (the contract; the owner approves the dependency with it) | A stepper; the keypad with `react-native-keyboard-controller`'s toolbar; datetimepicker's countdown mode | The HIG prefers choices to typing (`entering-data.md`) and pickers for long ranges (`pickers.md`). A stepper would take up to 179 taps, and RN has none natively. Countdown mode can't show 0 or serve the goal. The wheel retires the deprecated `InputAccessoryView`. |
| Stats: the postcard stack (the owner) | The washi timeline; the open spread | The owner's pick from the dealt hand. Today leads at full size; the earlier days stay legible as edges. |
| The app follows the phone's light or dark mode; the in-app switch is retired (the owner) | Keep System / Light / Dark as a deliberate exception | Apple's `dark-mode.md` and DESIGN.md both say appearance follows the system. Anyone who picked Light or Dark returns to the phone's setting. |

**D1 items handed to D2, and where each goes:**
- **The gift screen:** its brief retires it.
- **The love-note length:** Notes' brief caps it at 280.
- **The deprecated `InputAccessoryView`:** Settings' brief replaces it with wheels.
- **The "Watch the welcome again" replay:** it stays in About.
- **Fly:**
  - its emoji become icons;
  - its compass chip is re-tokened, which also settles the two mismatched chips;
  - the `LoveNoteCard`'s stacking under the controls is fixed;
  - Fly as a sticker in the Modes sheet needs new art, so it's an open question for the owner.
- **`legacyColors` and `expo-linear-gradient`:** they go once the last caller is rebuilt.

## 6. Verification

- [x] The owner confirms the four briefs (2026-10-31, "Confirm all four").
- [x] `/apple-design` on each brief (§3.2): one Critical (Notes: Delete reachable only by gesture), accepted with its fix; the rest dispositioned.
- [x] The owner approves the direction contracts, after Stats' composition round (2026-10-31, "Approve, build D2", with the picker dependency).
- [x] Each screen: critique and audit at 16/20 or better, no Critical HIG finding, `review-animations` clean (§3.12, after the fix batch; Accessibility and Adaptivity provisional until the device check).
- [x] Each screen: `break-ui` in Turkish at AX5 (§3.13: 2 Broken and 4 Ugly fixed; the layout findings confirmed at the device check).
- [ ] **The device check, the next build (52).** It carries §3.11's fixes and §3.12's, so it repeats the build 51 list below and adds:
  1. **Notes' rows** are paper blocks with padding, corners and hairlines (the P0), and tint while pressed.
  2. **The swipe** tracks the finger, stretches over red past Delete, and the first and last rows' Delete has no black line.
  3. **The editor:** with unsaved text, Cancel and a swipe down both ask in an action sheet. Save never asks, and after Save the sheet actually closes, for a new note and an edited one. Delete note closes it too. Save dims while there's nothing to save; the field has a visible edge.
  4. **Stats** at xxLarge and at the largest text size: every day's name reads in full, in English and Turkish; the flags grow with the text.
  5. **Settings:** a wheel fades in while the rows below slide; with Reduce Motion, it only fades. With VoiceOver, a switch row is one stop, and a refused reminder is spoken.
  6. The motion review's feel checks (§3.12).
  7. **break-ui (§3.13):**
     - In Turkish at the largest text size on the smallest iPhone you have, the note editor's Cancel, title and Save all fit.
     - Stats' goal and streak strip stacks, with no word broken mid-way.
     - A note written on several lines keeps its lines, in the list and the love-note sheet.
     - An emoji typed at the end of a full note never leaves a "�".
     - Judge how long notes read at the largest size (the owner kept the full text).
- [ ] B2's notes tests stay green: Bengisu's install keeps its notes.
- [ ] The emoji check (`src/__tests__/noEmojiIcons.test.ts`) passes.
- [ ] **The device check, build 51** (needs a physical device). It goes with the D1 record's §6 "build 51" list, for D1's finish fixes and the six recaptures.
  1. **The theme:** the app now follows the phone. Your phone had Dark set inside the app, so switch the phone's own appearance and check that both themes follow it.
  2. **Settings:**
     - Each duration, the long-break interval and a custom goal open a wheel under their row, one at a time, and nothing opens a keyboard.
     - The reminder and quiet hours use the iPhone's time chips.
     - About's footer carries the origin line.
     - Reset's alert says what it keeps.
     - In Turkish at the largest text size, rows wrap rather than clip.
  3. **Notes:**
     - A tap opens the note in a full-height sheet.
     - A swipe gives Delete, and a long press gives the native menu (Edit, then Delete).
     - "Delete note" sits at the editor's foot.
     - The countdown appears near 280.
     - With unsaved text, the sheet won't swipe away, and Cancel asks first.
     - "Preview a note" opens the love-note sheet.
     - "Restore default notes" adds back only what's missing.
  4. **Stats:**
     - The summary line, then the stack of six day edges, then today's postcard in front.
     - The Minutes switch.
     - The goal and streak strip.
     - Empty days as dashed cells, never "missed".
     - The ad slot about 12 pt above the tab bar.
     - At the largest text size, a list with today first.
  5. **Fly:** icons instead of emoji on the camera control, the globe toggle, Start flight, Landed! and the timer pill.
  6. **The gift screen:** gone. Only a fresh install would have shown it, so this is optional, and needs a reinstall.

## 7. Related Docs

- [Stage D plan](2026-10-30-phase1-stage-d.md) §3.3 · [D1 record](2026-10-30-phase1-d1-classic.md) · [Design workflow](../process/DESIGN-WORKFLOW.md)
