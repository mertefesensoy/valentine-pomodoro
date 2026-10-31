---
id: IMPL-2026-10-31-phase1-d2-screens
title: "Phase 1 D2: Stats, Settings and Notes rebuilt in the Sticker Diary design, the gift screen retired"
status: in-progress
date: 2026-10-31
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-stage-d, IMPL-2026-10-30-phase1-d1-classic, DESIGN-WORKFLOW, ADR-0045, ADR-0047, SRS]
---

# 2026-10-31 — Phase 1 D2: Stats, Settings, Notes and the gift screen

**Status:** In progress. Shaping: the four briefs are written and wait for the owner's confirmation.
**Branch:** `phase1/stage-d` (worktree `C:\vp\stage-d`).
**Plan:** [Stage D plan](2026-10-30-phase1-stage-d.md) §3.3. This record holds what happened: each step's output, the owner's gates, the scores and the measurements.

---

## 0. Gates and steps

Each screen follows DESIGN-WORKFLOW §2, as Classic did in D1.

| Step | Stats | Settings | Notes | Gift |
|---|---|---|---|---|
| 1. Shape | Brief written (§3.1) | Brief written (§3.1) | Brief written (§3.1) | Brief written: retired (§3.1) |
| Owner: the four briefs | **Waiting** | **Waiting** | **Waiting** | **Waiting** |
| 2. `/apple-design` on the brief | — | — | — | — |
| Composition round | Planned: the week is open (§3.2) | Not needed: native grouped list | Not needed: native list | Not needed |
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

### 3.2 What follows the briefs

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

- [ ] The owner confirms the four briefs.
- [ ] `/apple-design` on each brief: no Critical finding.
- [ ] The owner approves the direction contracts, after Stats' composition round.
- [ ] Each screen: critique and audit at 16/20 or better, no Critical HIG finding, `review-animations` clean, `break-ui` in Turkish at AX5.
- [ ] B2's notes tests stay green: Bengisu's install keeps its notes.
- [ ] The emoji check (`src/__tests__/noEmojiIcons.test.ts`) passes.
- [ ] The device check on the next build (needs a physical device), with the D1 record's §6 "build 51" list.

## 7. Related Docs

- [Stage D plan](2026-10-30-phase1-stage-d.md) §3.3 · [D1 record](2026-10-30-phase1-d1-classic.md) · [Design workflow](../process/DESIGN-WORKFLOW.md)
