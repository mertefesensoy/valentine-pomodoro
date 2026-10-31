---
id: IMPL-2026-10-31-phase1-d2-screens
title: "Phase 1 D2: Stats, Settings and Notes rebuilt in the Sticker Diary design, the gift screen retired"
status: in-progress
date: 2026-10-31
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-stage-d, IMPL-2026-10-30-phase1-d1-classic, DESIGN-WORKFLOW, ADR-0045, ADR-0047, SRS]
---

# 2026-10-31 — Phase 1 D2: Stats, Settings, Notes and the gift screen

**Status:** In progress. The owner confirmed the four briefs on 2026-10-31 ("Confirm all four"). Next: `/apple-design` on each, Stats' composition round, then the direction contracts.
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
| Composition round | In progress: three sketches on the decision page (§3.3) | Not needed: native grouped list | Not needed: native list | Not needed |
| Owner: direction contracts | — | — | — | — |
| 3. Build (`animate-expo`) | — | — | — | — |
| 4. Critique, audit (≥ 16/20), HIG (no Critical), `review-animations` | — | — | — | — |
| 5. `break-ui` (TR at AX5) | — | — | — | — |
| 6. `polish`, `harden`, `clarify` | — | — | — | — |
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
| Settings | **High:** an in-app System / Light / Dark switch (`dark-mode.md`: "Avoid offering an app-specific appearance setting") | **The owner's call.** DESIGN.md says appearance follows the system, but v1 shipped the switch, and the owner's own phone is set to Dark in it (build 50 screenshot). Retire it (keep `themeMode`, read it as System), or keep it with a DESIGN-WORKFLOW §3 tension row. Asked with the contracts. |
| Settings | Medium: the Notifications master switch sits apart from the reminders it dims | **Accept.** One Notifications group: the switch first, the daily reminder and quiet hours under it, and the denied state linking to iOS Settings. |
| Settings | Low: Reset to defaults inside About | **Accept.** Its own last group. The alert names what it keeps (notes and stats), with Cancel and Reset. |
| Settings | Open: the number control | **The wheel** (`@react-native-picker/picker`, the system UIPickerView) for every number row: durations 1–180, the long-break interval 2–10, the goal 0–1,440 in 5-minute steps. A stepper would take up to 179 taps, and RN has no native one. A new dependency, pinned to a release at least two weeks old: approved with the contract. The fallback, if refused: datetimepicker's countdown mode for the durations. |
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
- **Waiting for the owner's pick.**

### 3.4 What follows the briefs

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

## 4. Mathematical / Statistical Details

None yet. The week's sticker capacity and the goal counts will reuse D1's rules (D1 record §4.3) when Stats is built.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|---|---|---|
| The gift screen is retired (the owner) | Keep it name-free before the welcome; fold an origin line into the welcome | One first-run screen, as `onboarding.md` advises. PRODUCT.md already places the origin in About. |
| Stats leads with this week (the owner) | Today, then the week; the streak as the hero | The Timer already shows today's row. The week is what Stats alone can show. |
| A 280-character cap on notes, keeping longer existing notes (the owner) | No cap; 140 | It's long enough for a real note and fits the love-note sheet at large text sizes. Existing notes are never cut. |
| Settings' numbers on a wheel that opens in place (proposed) | A stepper; the keypad with `react-native-keyboard-controller`'s toolbar | The HIG prefers choices to typing (`entering-data.md`), and the wheel retires the deprecated `InputAccessoryView`. The contract settles the dependency. |

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
- [ ] The owner approves the direction contracts, after Stats' composition round.
- [ ] Each screen: critique and audit at 16/20 or better, no Critical HIG finding, `review-animations` clean, `break-ui` in Turkish at AX5.
- [ ] B2's notes tests stay green: Bengisu's install keeps its notes.
- [ ] The emoji check (`src/__tests__/noEmojiIcons.test.ts`) passes.
- [ ] The device check on the next build (needs a physical device), with the D1 record's §6 "build 51" list.

## 7. Related Docs

- [Stage D plan](2026-10-30-phase1-stage-d.md) §3.3 · [D1 record](2026-10-30-phase1-d1-classic.md) · [Design workflow](../process/DESIGN-WORKFLOW.md)
