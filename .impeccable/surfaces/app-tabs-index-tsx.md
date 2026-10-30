---
version: 1
slug: "app-tabs-index-tsx"
primary_target: "app/(tabs)/index.tsx"
related_targets: ["src/screens/TimerScreen.tsx"]
---

# Classic: the focus page (Timer tab, `/`)

Surface brief from `/impeccable shape classic`, Phase 1 C4, 2026-10-30. Mode: **Operate**. Build path: code-led. Seed `seed:d8d47ae43e992025`. D1 builds it; D1 writes the direction contract before code.

## 1. Job and audience

A university student, often in a long-distance couple, opens the Timer tab many times a day to start, pause or skip a focus session in seconds. Then the phone lies face-up on a library desk or gets locked. The page must read at arm's length and work one-handed. In v1.4 everyone is solo (pairing arrives in Phase 2); in Phase 3 the same page carries the partner live, with no re-layout.

## 2. Outcome and proof

- **Primary action:** Start, then Pause or Resume, always in thumb reach. Skip is secondary. Ending a session early is reachable only while paused, behind a confirmation.
- **Success:** the remaining time reads from a metre away; focus versus break is obvious from three cues at once (the ring's colour, the phase line, Pomo & Doro's pose); today's progress is visible without a tap; nothing competes during focus (PRODUCT principle 5).
- **What only this app has:** the partner slot (both partners always in the frame), Pomo & Doro, and the sticker placement when a session completes.

## 3. Selected direction: two layouts, one component set

The owner chose two of the three dealt structures on 2026-10-30: "both of them should be a classic page mode that should be available and the ring, done properly as default".

- **Ring (default).** Top: the phase line ("Focus · session 2 of 4") and the mode button. Centre: the ring (`ringFocus` on `ringTrack`) with the Baloo 2 timer inside, the only large thing on the page. Under it: the partner strip. Then today's sticker row. The controls sit in thumb reach above the native tab bar.
- **Facing Pages (alternate).** The same top line. An open spread of two paper pages, each tilted about 1° toward the spine: the left page is you (Pomo in v1.4, with your intention once Phase 3 adds it); **the right page is the partner slot** (Doro in v1.4; in Phase 3, your partner's name, status, local time and intention). The timer sits on the spine in a single paper frame. Then the same sticker row and controls.
- **Shared rules, raised from the declined challengers:**
  - hierarchy by scale alone: the timer is the only large type
  - one moving part: during focus only the ring (or the spine's progress bar) moves
  - today's stickers pack in whole cells and wrap; they never shrink
  - nothing disappears: a paused session keeps its time, with a quiet "Paused" stamp
  - no chrome around the timer: the ring, or the spine frame, is its only frame; no card inside a card
  - context kept while focused: presets and the mode button fold away; the today row stays
- **The signature move: the sticker placement** (DESIGN.md). When a session completes, its sticker is pressed onto today's row: a spring with about 0.2–0.3 bounce, at most 24 particles, a success haptic. It is the one delight on this page.
- **Choosing the layout:** in the mode sheet, under Classic, as a two-option choice, and in Settings → Appearance ("Timer layout"). It is an additive setting, `classicLayout: 'ring' | 'spread'`, default `'ring'`, so existing installs keep the Ring.

## 4. Scope and boundaries

- **Target:** `app/(tabs)/index.tsx` → the Classic part of `src/screens/TimerScreen.tsx`. Fly Mode's screen is untouched (Phase 4b).
- **Unchanged:** the session engine and clock store (B4), the ad policy and AdMob 16, `LazyTab` and the native tab bar as fixed in `63f1db2`, notifications.
- **Anti-goals:** no card inside a card; no gradient or aurora; no hand-made glass or blur; no emoji as icons; no mascot that sulks or nags; nothing during a running session (no ad, prompt or paywall); no third layout.

## 5. States and ranges

- **States:** idle (the configured length shown; presets visible; Start primary) · focus running · paused (time frozen, "Paused" stamp, Resume primary, End available) · break running, short or long (the ring in `ringBreak`, Pomo & Doro's break pose) · completion (the sticker placement, then the love-note sheet if notes are on, then "goal reached" as an inline moment on the today row) · Fly chosen (the mode sheet hands over to the Fly screen).
- **Ranges:**
  - durations 1–180 minutes: the timer must fit "180:00" in both layouts
  - sessions today from 0 to 20 and more: the sticker row wraps in whole cells, up to two rows, then "+n"
  - the cycle position runs 1–4
  - Turkish strings run 20–30 % longer
  - Dynamic Type runs from xSmall to AX5
- **The partner slot in v1.4:** "Pomo & Doro are studying with you" and their pose, nothing else. It never promises pairing before pairing ships.
- **One secondary line under the timer:** the absolute time of the next change ("Break at 10:25"), not a second duration; the phase line already says what is running (HIG review C-1).

## 6. Interaction and layout

- **Hierarchy:** the timer, then the primary action, the phase line, the partner slot, the today row, and the secondary actions.
- **Controls:**
  - **Primary pill:** strawberry with a cocoa label, at least 54 pt tall.
  - **Skip:** a quiet pill.
  - **End:** shown only while paused; it confirms in a native alert with a destructive button.
  - **Feedback:** every press scales to 0.97 over 100–150 ms with a haptic on the same frame.
- **Presets** (25/5, 50/10, 52/17, 90/20): a native segmented control under the timer, **idle only**. On Start it crossfades into the cycle row (session 1–4) in the same reserved height, so nothing jumps.
- **The mode button:** top right, 44 × 44 pt, the custom "modes" icon. It opens a native page sheet (medium detent) listing the modes as stickers: Classic, with its layout choice, and Fly; Garden, Room and Pet join in Phase 4.
- **The timer is not a hidden control:** there is no tap or long-press on it. VoiceOver reads one element ("18 minutes 42 seconds left, focus, session 2 of 4") with the updates-frequently trait, not a spoken tick every second.
- **VoiceOver order, both layouts:** the phase line, the timer, the partner slot (and in Facing Pages, your page before your partner's), today's row, then the controls. Facing Pages sets this order explicitly, because its spine card is drawn over both pages (HIG review M-2).
- **Labels for icon-only and numeric controls:** the mode button reads "Modes"; each preset reads in words, "25 minutes focus, 5 minutes break" (HIG review M-3).
- **Overlays:** the love note becomes a native sheet (small detent); "goal reached" becomes an inline moment; the interstitial keeps its policy and shows only after the completion sheet closes.
- **Motion:**
  - tab switches: none
  - phase change: the ring colour and Pomo & Doro's pose crossfade over 200–300 ms
  - the sticker placement: the one bounce
  - with Reduce Motion on: opacity and colour only
- **Responsive, keyed to size classes, not to device or orientation** (HIG review M-1):
  - **Compact width, regular height** (iPhone portrait) is primary.
  - **Compact height** (iPhone landscape): Ring puts the timer leading and a trailing column for the partner slot, today and the controls; Facing Pages sits naturally side by side.
  - **Regular width** (iPad, wide windows): both layouts centred at a readable width; Facing Pages suits it best. On iPad the tab bar sits at the top, so nothing is pinned under it.
  - **Accessibility text sizes (AX1 and up):** Facing Pages stacks the pages vertically (you, the timer, your partner).
  - **The timer:** it scales with Dynamic Type up to a cap (about 1.3×), so "180:00" never clips.

## 7. Constraints and open decisions

- **Platform:** iOS 16.4+, the native tab bar; Liquid Glass only where the system draws it (the tab bar, sheets).
- **The tab bar, from the HIG review:** D1 sets `NativeTabs`' tint to `primaryInk` (5.75:1 light, 8.91:1 dark on the page), so the selected tab is strawberry, not system blue (H-1); the four tab icons ship as filled variants of the C3 set, as `tab-bars.md` prefers (M-4); the controls sit above the floating bar by its measured height plus the bottom safe area, because every tab sets `disableAutomaticContentInsets` (M-5); nothing is painted under the bar, so the system's scroll edge effect stays, including when Facing Pages scrolls at accessibility text sizes (checked on the device in D1).
- **Design system:** the C1 tokens (`src/theme/palette.json`); Baloo 2 for the timer only, with tabular figures and the ligatures removed (ADR-0046); the system face for everything else; the C3 icons and Pomo & Doro's five sticker poses (ADR-0047).
- **Assumptions from the discovery round,** which the owner answered with other priorities, so these are the recommended options, to confirm:
  1. during focus the page shows today's progress too, nothing more
  2. the presets live on the page when idle
  3. a mode button opens a sheet
- **Open:**
  - Does the segmented control use the native module (`@react-native-segmented-control/segmented-control`), which adds native code in D1, or a built control with the same look?
  - Phase 3's partner-slot field order: name, status, intention, local time.
