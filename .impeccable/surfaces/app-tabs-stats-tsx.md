---
version: 1
slug: "app-tabs-stats-tsx"
primary_target: "app/(tabs)/stats.tsx"
related_targets: ["src/screens/StatsScreen.tsx"]
---

# Stats: the week's diary page (Stats tab, `/stats`)

Surface brief from `/impeccable shape`, Phase 1 D2, 2026-10-31. Mode: **Operate**, leaning Read: the visitor checks how the week is going. Build path: code-led. The direction contract waits for the composition round (§7).

## 1. Job and audience

A student opens Stats a few times a week, after a session or at the end of a day, to see how the week is going and whether the love streak holds. They come to be reassured, not judged. Everyone is solo in v1.4. From Phase 3 the same page carries the couple's week (the couple goal and the couple streak), with no re-layout.

## 2. Outcome and proof

- **Primary:** this week at a glance. How many sessions each day, which days reached the goal, and where the love streak stands.
- **Success:**
  - the week reads as a diary spread filling with stickers;
  - today is found instantly;
  - the goal and the streak are on the page without a tap;
  - all-time totals sit below, quietly;
  - nothing reads as a score or a failure (PRODUCT principle 2).
- **FR-STA-003** requires today, all-time, and a 7-day chart that switches between sessions and minutes. The week is that chart. A Sessions / Minutes choice switches what each day shows: its stickers, or its minutes against the goal. Dropping the minutes view would need an SRS change, so the builder doesn't decide it.
- **What only this app has:** the stickers on each day are the ones Classic presses onto today's row (Pomo & Doro celebrating). Stats is the diary those stickers fill.

## 3. Selected direction

The owner, 2026-10-31: **lead with this week.**

- **The week (the page's lead):**
  - the last seven days, ending today, which is what FR-STA-003's "7-day" means; today gets the emphasis;
  - each day holds its stickers, packed in whole cells with "+n" past capacity, and the goal mark when it reached the goal;
  - a day with nothing shows a dashed outline: never a cross, never "missed", never red.
- **On the page with it:** the daily goal ("50 min a day · 49 left today") and the love streak ("1 day · best 2"), each with its custom icon (`goal`, `streak`).
- **Below:** all-time sessions and minutes, quiet.
- **The ad banner** keeps its slot under the page, above the tab bar. It's outside the diary.
- **The composition is open** (the week as one strip, a two-page spread, or a column of days). A concept round with two or three sketches, as for Classic and the welcome, settles it before the contract.

## 4. Scope and boundaries

- **Target:** `app/(tabs)/stats.tsx` → `src/screens/StatsScreen.tsx`.
- **Unchanged:**
  - the stats store, the streak rules and FR-STA-001's day attribution;
  - the ad policy, the banner, its slot and `bannerStatus`;
  - seven days of history (Plus history is Phase 5).
- **Anti-goals:**
  - no grid of number tiles;
  - no gradients;
  - no axes or gridlines unless they earn their place;
  - no card inside a card;
  - no emoji;
  - no "missed" or red days.

## 5. States and ranges

- **A fresh install:** the empty week shows dashed days and one line inviting the first session. It never says "No stats yet".
- **Ranges:**
  - sessions per day from 0 to 32 or more (16 hours of 25/5);
  - minutes per day from 0 to 1,440;
  - all-time sessions past 10,000 and minutes past 100,000, in the locale's digits ("3.124" in Turkish);
  - the goal from 0 (off) to 1,440 minutes;
  - the streak from 0 to 365 and beyond.
- **The goal off:** no goal marks and no "left today". The streak hides, since it counts goal days. The page says where to turn the goal on.
- **Turkish** runs 20–30 % longer. **Dynamic Type** runs from xSmall to AX5; at AX sizes the week becomes a column of days.

## 6. Interaction and layout

- **Hierarchy:** the week, with today emphasised; then the goal and the streak; then the all-time totals.
- **The Sessions / Minutes choice:** D1's built segmented control, two segments, each a button with a selected state.
- **The days aren't buttons in v1.4.** There's no day detail. VoiceOver reads each day as one element, for example "Tuesday, 3 sessions, 75 minutes, goal reached".
- **Motion:**
  - none on entry: Stats is opened often (Emil's frequency gate);
  - stickers never replay their placement here;
  - the Sessions / Minutes switch crossfades in about 150 ms, or switches instantly with Reduce Motion.
- **Responsive:**
  - iPhone portrait is primary;
  - in landscape the week spans the width;
  - on iPad the page is centred at a readable width (560 pt).

## 7. Constraints and open decisions

- **Design system:** the C1 tokens; the custom icons and stickers (ADR-0047); the system face for text, with tabular figures in every number column. Whether the week's large numbers use Baloo 2 is the contract's call: DESIGN.md gives the display face to titles and sticker captions.
- **Copy:** every string is an i18n key, in English and Turkish, in sentence case.
- **Open:**
  - the week's composition (the concept round);
  - where the Phase 3 couple week sits on the page.
