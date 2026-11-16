# 2026-11-15 — The iPad 13" App Store set, redone for iPad and Mac visitors

**Status:** Approved by the owner on 2026-11-16 ("okay i approve this", after the review sheets of §9.6), as drafted (§9.8), and merged as PR #46 (`d793d6f`). The owner then renamed the partner to Mert and changed the Turkish note (§9.9), and approved the rebuilt set with the iPhone one ("Approve both sets", 2026-11-16). The current PNGs come from the iPhone set's branch, `feat/iphone-shots`. Uploading is the owner's step. The review sheets are git-ignored and not committed.
**Branch:** `feat/ipad-shots`, worktree `C:\vp\ipad-shots`, cut from `origin/master` at `ad0832c`. Nothing is committed, pushed or uploaded without the owner's word; no App Store Connect action.
**Parent:** [v1.4 App Store screenshots](2026-11-01-app-store-screenshots.md) (the "Morning to night" set this redoes for iPad).

---

## 0. Steps

| # | Step | State |
|---|------|-------|
| A1 | Orientation: the record, the generator, the app's iPad geometry, Apple's rules | Done (§3.1–3.3) |
| A2 | Diagnosis of the current iPad set at search and product-page size | Done (§3.4) |
| A3 | This plan, written before any drawing | Done |
| A4 | Three directions drawn as rough previews with the real pipeline, in `.impeccable/review/ipad/` | Done (§3.6) |
| A5 | The owner picks: direction, 1.5 features or not, orientation, panel count | **Done, 2026-11-15** (§9.1) |
| B1 | The five-panel plan in this record, before any drawing | Done (§9.2–9.5) |
| B2 | A new iPad-only generator and job; both strips built at 2064 × 2752 with `build.mjs` | Done (§9.6) |
| B3 | Self-check of every panel; one review sheet per language | Done (§9.6) |
| B4 | The owner's review of the drafts (captions, the partner's name, the note) | Waiting (§9.7) |

**Boundaries.** Phase A writes only this record and git-ignored files in `.impeccable/review/ipad/` (the preview script, its work folder and the PNGs). It never runs `scripts/art/store-sources.py` without `--check` (that rewrites all four strip sources and `art/jobs/store.json`), never runs `scripts/art/build.mjs` on `art/jobs/store.json` (that rebuilds the iPhone outputs, whose bytes VectorCraft 0.21+ no longer reproduces), and never uses `C:/vp-art` (the shared default work folder another session may be building in).

## 1. Problem / Motivation

- **Mac visitors see the iPad set.** The app reaches Macs as "Designed for iPad". The live product page fetched with a Mac Safari user agent on 2026-11-15 carries only the `iphone_d73` and `ipadPro_2018` screenshot sets, so the Mac App Store shows the iPad screenshots. The owner asked to "Improve the iPad set" rather than make Mac-sized shots (which need a macOS platform to upload).
- **The iPad set is the weak one.** v1.4's "Morning to night" strip (`art/out/store/store-ipad-{en,tr}-0N-2064x2752.png`) draws the iPad as the app draws it, the phone column centred, and that column renders at about 0.43 of the panel's width. At store size the week rows and today's row are specks (§3.4). The owner accepted that trade on 2026-11-02 ("Keep today's row visible"); beating it is the point of this redo.
- **The set shows 1.4.** 1.5 added pairing, the partner's day on the Timer and in a sheet, notes to your partner, the privacy policy and a "what's new" tour (CHANGELOG `[1.5.0]`). It also changed the solo, idle Timer: the partner strip now reads "Pomo & Doro are ready" with a "Pair with your partner" line under it (`TimerScreen.tsx`, `showPair`; `PAIRING_ENABLED` is true). The 1.4 panels, iPhone and iPad alike, still draw the old one-line strip, so they no longer match the live app exactly (§3.2).

## 2. What Changed

| File | Change |
|------|--------|
| `docs/implementations/2026-11-15-ipad-store-set.md` (new) | This record |
| `.impeccable/review/ipad/*` (git-ignored) | Phase A's tools and outputs, never committed: `diag.py` (the current set at store sizes), `measure.py` (caption widths), `directions.py` (the three directions), `tr_check.py` (B and C in Turkish), `work/` (each direction's SVG, steps, strip PNG and an exact-size panel 1), and the review sheets `preview-{a,b,c}.png` |

Phase B (uncommitted, waiting for the owner):

| File | Change |
|------|--------|
| `scripts/art/store-ipad-sources.py` (new) | The 1.5 iPad generator: loads `store-sources.py` for its helpers, draws the five couple screens from the code, composes the close-ups, runs the self-checks, and writes the two sources and the job; `--check` compares |
| `art/src/store-ipad/store-ipad15-{en,tr}.svg` (new) | One strip per language, five 2064 × 2752 panels with the 92-px gutter |
| `art/jobs/store-ipad.json` (new) | The job: the two strips, each panel cropped at 2064 × 2752, and the strip at a fifth of its width |
| `art/vc/store-ipad15-{en,tr}.vectorcraft`, `art/steps/store-ipad15-{en,tr}.steps.json` (new) | The editable sources (about 9.5 MB each) and the exact command lists |
| `art/out/store-ipad/*` (new) | The strips' SVGs, their 2138-px previews, and the ten panels to upload: `store-ipad15-<lang>-0N-2064x2752.png` |
| `.impeccable/review/ipad/review15.py`, `review15-{en,tr}.png`, `selfcheck_test.py` (git-ignored) | The size check and the review sheets; a script that proves the self-checks fire |

## 3. Implementation Approach

### 3.1 The pipeline (unchanged from the v1.4 record)

- `scripts/art/store-sources.py` writes one SVG strip per device and language; `scripts/art/build.mjs` builds it in VectorCraft and exports every panel as a crop (`document.export` with `rect` and `scale`), which is the only way to get exact sizes. A full-bleed ground gives PNG colour type 2 (no alpha).
- Baloo 2 is outlined from `assets/fonts/` with uharfbuzz 0.57 and fontTools 4.61 (`python -P`); Inter, bundled with VectorCraft in Regular, Medium and SemiBold, stands in for SF Pro as live text.
- **Tool facts found on 2026-11-15:** VectorCraft's CLI is `C:/Program Files/VectorCraft/vectorcraft-cli.exe`, version **0.23.0** (the committed set was built with 0.18). `vc` in npm's global bin is the **Vercel CLI** (63.1.0), not VectorCraft. Python 3.13 with uharfbuzz 0.57.0, fontTools 4.61.0 and Pillow 12.2.0 is reachable. `store-sources.py --check` passes: the committed sources still match the generator and the current strings.

### 3.2 The app's real iPad geometry (code at `ad0832c`)

All of this is from the code; the iPad layout has never been seen on a device (the v1.4 record and the Mac audit say the same).

- **Portrait iPad 13"** is 1032 × 1376 pt; **landscape** is 1376 × 1032 pt.
- **The Timer** (`TimerScreen.tsx:430-438`): the page is `min(W, 560) − 2·24 = 512` pt, centred, unless the height is under 500 pt (`COMPACT_HEIGHT`), which no iPad reaches. So both orientations show the same 512-pt column; landscape only adds side margin. The Ring is `min(0.86·512, 340) = 340` pt (`:506`).
- **Stats and Settings:** the same `min(W, 560)` column (`StatsScreen.tsx:137`, `SettingsScreen.tsx:254`).
- **Tabs:** NativeTabs (`app/(tabs)/_layout.tsx`); with the `.pad` idiom iPadOS draws its floating tab bar at the top.
- **Fly** is the one screen that uses the width: with W > H it shows the map full width and a side sheet `min(0.42·W, 400)` pt wide (`src/components/FlySheet.tsx:90`, `src/screens/FlyModeScreen.tsx:578`). Its map is Apple Maps (`mutedStandard`, or `satelliteFlyover` for the globe), which can't be drawn honestly in VectorCraft: a Fly panel needs a real capture.
- **Form sheets** (the love note, Modes) present centred on iPad, as the v1.4 set draws them.
- **The vertical plan of the Timer, as the generator draws it** (pt from the screen's top):

  | Piece | Portrait (H 1376) | Landscape (H 1032) |
  |---|---|---|
  | Tab bar | 28–68 | 28–68 |
  | Phase line | 104 | 104 |
  | Ring (340) | 395–735 | 223–563 |
  | Partner strip | 1004–1075 | 660–731 |
  | Today's row | 1109 | 765 |
  | Presets to Skip | 1144–1340 | 800–996 |

  In portrait about 540 pt of the column is air (above and below the Ring); in landscape the whole Timer fits with little air. That's why a close-up of the portrait Timer has to drop either the top or the foot, and landscape doesn't.
- **1.5's Timer:** solo and idle, the partner strip reads `partner.readyShort` ("Pomo & Doro are ready" / "Pomo ve Doro hazır") with `partner.pair` ("Pair with your partner" / "Partnerinle eşleş") under it; paired, it's `PartnerStrip` with the partner's day. Phase B draws whichever the owner picks; phase A's previews keep the 1.4 generator's screens and say so.

### 3.3 Apple's rules (read 2026-11-15)

- **Sizes** ([screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)): iPad 13" takes 2064 × 2752 (portrait) or **2752 × 2064 (landscape)**, also 2048 × 2732 / 2732 × 2048; "Required if app runs on iPad". Up to 10 per size, `.png` or `.jpeg`, "Images can't include alpha channels or transparencies."
- **Mixing orientations:** the spec page says nothing about it. App Store Connect validates each image against the size list, and third-party guides say mixed sets upload. But a developer-forum thread ([62814](https://developer.apple.com/forums/thread/62814)) reports landscape shots in a mixed iPad set shown rotated as portrait in the App Store app, from 2016 to 2022, with no answer from Apple. The product page's data carries one `hasPortraitMedia` flag per platform. **So a mixed set is unconfirmed and risky; phase A proposes all-portrait or all-landscape sets only.**
- **Search results** ([Creating your product page](https://developer.apple.com/app-store/product-page/)): "Depending on the orientation of your screenshots, the first one to three images will appear in search results". Portrait shows three; landscape shows one, larger. A landscape set loses the triptych in search.
- **Mac:** Mac sizes (16:10) are "Required for Mac apps"; nothing says they apply to iPad apps on a Mac, and App Store Connect's version page shows no Mac tab for this app. Unchanged from the store-screenshot traps note.
- **Guideline 2.3.3:** screenshots show the app in use. Crops, scale and several devices around the centred column are composition; an iPad layout the app doesn't draw is not allowed.

### 3.4 Diagnosis of the current iPad set

Evidence: `.impeccable/review/ipad/diag-search-{en,tr}.png` (panels 1–3 at 150 px wide, about a search result's size) and `diag-page-{en,tr}.png` (the five at 320 px, about the product page's size), both written by `.impeccable/review/ipad/diag.py` from the committed PNGs.

- **What reads at search size:** the headlines, Pomo & Doro, the timer numerals (25:00, 05:00) and the Stats card as a block. Nothing else: the week rows, today's row and the partner strip are texture, and about 60 % of every device is blank cream screen.
- **What reads at product-page size:** the headlines and sublines, the Stats card (just), the note card and the Modes sheet. Facing pages are two tall empty pages; the Ring floats in empty screen; today's row sits at the hill line about 6 px tall.
- **Why:** the column is 512 pt of a 1032-pt screen, the device fills the panel, so the column is 0.43 of the panel, at 1.72 px per app point. Two minor flaws too: panel 3's milk sun and panel 5's moon peek past the device's right edge as white slivers.

### 3.5 The three directions (the plan for A4)

Each is drawn by `.impeccable/review/ipad/directions.py`, which loads `store-sources.py` as a module (its Screen class, poses, Baloo shaping and sticker lift), writes each direction's strip SVG into `.impeccable/review/ipad/work/`, renders it with `vectorcraft-cli run` (failing on any error or warning, as `build.mjs` does), and composes a review sheet with Pillow: the strip, then the first panels at search size and at product-page size, as `diag.py` showed the current set. The previews are English; the Turkish headlines were measured against each caption box (§4).

**A. Pull-outs (portrait, 5 panels; Morning to night kept).** The approved strip as it is (grounds, hill, cast, captions, the same story as the iPhone set), with the iPad whole and true in every panel, and the panel's one important piece lifted off the screen as a die-cut paper at about 2.6–3.0 px/pt, over the device's empty margin: the Facing pages, today's row with the landing sticker, the week's postcards, the love note, the Modes sheet. Today's row stays visible in the device. Gain: the key piece at 1.5–1.75× today's scale; the rest of the screen stays small.

**B. Tucked in (landscape 2752 × 2064, 5 panels; the day carried by paper pages).** Each panel is a page of the day's tone holding the caption and Pomo & Doro on the left; a landscape iPad is tucked under it and emerges to the right, its column whole from the tab bar to Skip (landscape fits the whole Timer), at 1.8 px/pt. Each iPad runs on under the next panel's page, so the strip stays continuous. Today's row is visible on every Timer panel. Gain in the panel is small (1.8 vs 1.72 px/pt), but a landscape panel is displayed larger: alone in search, and wider on the product page (estimates in §4). It is the natural shape for a Mac's App Store window. A Fly panel (map plus side sheet, the one real iPad-wide layout) fits this direction but needs a real capture.

**C. Close-ups (portrait, 5 panels; no device frame).** The captions and grounds as now, but each panel shows a window of the iPad's screen as a large die-cut page, cropped to what the panel sells, at 2.5–3.3 px/pt (the column at 0.62–0.82 of the panel). Today's row shows where the window includes it (panels 2, 4, 5), not on Facing pages or Stats. The iPad is recognisable only by its top tab bar where a window includes it; the pages could otherwise be any device's.

### 3.6 The previews (2026-11-15) and what they showed

`python -P .impeccable/review/ipad/directions.py` draws all three in English in about 3 s each; `tr_check.py` draws B and C in Turkish. Every render ran with no VectorCraft error or warning.

| Direction | Review sheet | Content scale in the panel | Column's share of the panel width | Today's row visible |
|---|---|---|---|---|
| Current set | `diag-*.png` | 1.72 px/pt | 0.43 | Yes, about 6 px at product-page size |
| A, pull-outs (portrait) | `preview-a.png` | the lifted piece 2.5–2.9 px/pt; the rest 1.72 | the piece 0.68–0.75 | Yes, in the device, and big in panel 2's pull-out |
| B, tucked in (landscape) | `preview-b.png` | 1.8 px/pt | 0.33 (of a wider panel) | Yes, on every Timer panel |
| C, close-ups (portrait) | `preview-c.png` | 2.47–2.93 px/pt | 0.61–0.73 | Panels 2, 4 and 5; not 1 (its row is empty at 8:30) or 3 (Stats) |

What the previews showed:
- **A** keeps everything the owner approved and is the smallest change. At search size it gains little: the pulled pieces read as cards, but the rest stays small. The pull-outs on panels 1, 4 and 5 sit over their own source (covering it whole); panel 2's is a magnifier above the Ring, with the real row still at the hill. It inherits the current set's two white slivers (panel 3's sun, panel 5's moon past the device's edge).
- **B** is the only one where the whole Timer shows, top to Skip, with no air: landscape is how the column looks least empty. In search a single landscape panel is shown, so the hero panel carries the search result alone, and it reads (25:00, the pages, the pair, the presets, the pill). The iPads run on under the next panel's page, so the strip stays continuous. The Turkish headlines fit the 1040-px box at 124 px. In panel 4 the Ring's top arc shows above the note card, because the generator's iPad sheet height (420 pt) is a guess, never measured on a device.
- **C** gives the biggest portrait content and the closest match to the iPhone set's density, but it drops the device: only panel 3's window includes the iPad's top tab bar, and the other pages could be any device's. Panel 2's window is mostly the app's own air between the Ring and the strip (true to the app on a portrait iPad).

**Truth checks raised by the previews** (for phase B, whichever direction):
- The 1.4 screens' idle partner strip is out of date in 1.5 (§3.2).
- The iPad form-sheet size (the note and Modes cards) and the whole iPad layout are drawn from code and guesses, never seen. A real capture from TestFlight build 67 on the owner's M1 (Designed for iPad uses the iPad layout) or from Xcode's iPad 13" simulator, one Timer, one Stats and one sheet, would settle both.

## 4. Mathematical / Statistical Details

**Content scale.** Let s be px per app point in the panel. The current set: device 1851 px, bezel 0.0205 of it, so s = (1851 − 2·37.9) / 1032 ≈ 1.72, and the 512-pt column is 512 s ≈ 881 px, 0.43 of a 2064-px panel.

**Display scale on the store (estimates, to check in App Store Connect's preview or on a device).** A panel of width P px shown D pt wide displays one app point at s · D / P pt. Assumed display widths: an iPad search result fits three portrait panels at about 150 pt each, or one landscape panel at about 480 pt; the iPad product page shows portrait panels about 310 pt wide and landscape about 620 pt wide. These are estimates, not Apple's numbers. With them:

| | In search (pt per app point) | On the product page | Panels in search |
|---|---|---|---|
| Current | 1.72 · 150 / 2064 ≈ 0.125 | 1.72 · 310 / 2064 ≈ 0.26 | 3 |
| A (the lifted piece only) | 0.18–0.21 (1.45–1.7×) | 0.38–0.44 | 3 |
| B (the whole column) | 1.8 · 480 / 2752 ≈ 0.31 (2.5×) | 1.8 · 620 / 2752 ≈ 0.41 (1.6×) | 1 |
| C (the window) | 0.18–0.21 (1.45–1.7×) | 0.37–0.44 | 3 |

How the Mac App Store sizes iPad screenshots is unknown here; the owner's M1 can show it.

**Caption fit.** Widest headline line at 100 px of Baloo 2 SemiBold, shaped by HarfBuzz: English "A love note after" 734 px, Turkish "Her odaktan sonra" 815 px. Directions A and C keep the current 156-px headline in a 1860-px box (Turkish needs 1271 px). Direction B's caption box is about 1040 px, so its headline is 124 px (Turkish needs 1011 px); displayed in landscape it shows larger than today's 156 px portrait headline (124 · 1.6 ≈ 198 px equivalent on the product page, by the estimate above).

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Previews drawn by a separate, git-ignored script that imports the generator | Editing `store-sources.py` now | Phase A shouldn't change shipped sources before the owner picks; importing keeps the screens identical to the generator's |
| No mixed-orientation direction | A portrait set with one landscape Fly panel | Apple is silent on mixing and a display bug was reported for years (§3.3); a set of one orientation avoids it |
| No drawn map for Fly | A stylised map in VectorCraft | It would be an invented rendering of Apple Maps; a real capture is the only honest Fly panel |
| Directions that keep the column true, and scale or crop around it | A wider "iPad layout" | Guideline 2.3.3; the app draws the column |

## 6. Verification

- [x] `python -P scripts/art/store-sources.py --check` → "✔ every store source matches the generator" (read-only).
- [x] VectorCraft 0.23 probe: panel 1 of each direction exported with `rect` and `scale 1` reads, from its IHDR, 2752 × 2064 (B) and 2064 × 2752 (A, C), bit depth 8, colour type 2 (no alpha). English and Turkish.
- [x] Each preview renders with no VectorCraft error or warning (`directions.py` fails on either).
- [x] `git status` in the worktree shows only this record as new (the review folder is ignored by `.git/info/exclude`; `node_modules` is a junction to stage-d's and ignored).

## 7. Related Docs

- [v1.4 App Store screenshots](2026-11-01-app-store-screenshots.md), the set this redoes, and its pipeline.
- [v1.4 creative assets](2026-11-02-app-store-creative-assets.md), the approved illustration style.
- [Mac version audit](2026-11-13-mac-version-audit.md) §3.1 and §4, the layout maths on iPad and Mac.
- [1.5.2 on the Mac](2026-11-15-v152-mac.md).

## 8. The owner's decisions (phase A)

### 8.1 Recommendation

**B, tucked in (landscape), but only if the store really shows landscape panels larger; otherwise C.**

- **For B:** it's the one direction where the iPad's real layout looks full rather than empty, since landscape fits the whole Timer column. It's the shape of a Mac's App Store window. It keeps the same story, captions, cast and day of tones.
- **The condition:** in the panel itself B is only 1.8 px/pt, with the column at 0.33 of the width, below today's 0.43. All of its gain comes from the store showing a landscape panel larger (§4), and those display widths are estimates. "One landscape panel in search" is the common reading of Apple's "first one to three", not Apple's own wording. If the store shows both orientations at the same height, B is only about 1.4× today, and C (1.45–1.7×, three panels in search) wins.
- **First step:** check this in App Store Connect's Preview, or on any live app with landscape iPad screenshots viewed on an iPad and on the M1.
- **The cost of B even if the check passes:** search shows one panel, not three, and the iPad set no longer mirrors the iPhone set's portrait triptych.
- **B's "whole Timer, no air" comes from the generator's rule at 1376 × 1032,** which nobody has seen on a device, so the real capture (question 5) should include landscape.

### 8.2 Questions

1. **Which direction:** A (pull-outs, portrait, the smallest change), B (tucked in, landscape), or C (close-ups, portrait, no device frame)?
2. **1.4 or 1.5 on the screens:** the live app's idle Timer now shows "Pomo & Doro are ready" and "Pair with your partner", so redrawing the 1.4 screens unchanged no longer shows the app as it is (guideline 2.3.3). Should the iPad set:
   - keep the iPhone set's story with 1.5's solo screens (the Pair line) and no pairing panel; or
   - show 1.5's features, for example the partner's day on the Timer and in its sheet, and a note to your partner?

   Either way, the iPhone set has the same out-of-date strip and may want the same refresh later.
3. **Orientation:** all portrait or all landscape. A mixed set is not recommended (§3.3).
4. **Panel count:** five, as now, or six to ten. A sixth landscape panel could show Fly, the one screen that uses the iPad's width, but only from a real capture.
5. **A real capture:** could the owner capture the iPad layout from TestFlight build 67 on the M1, or from the iPad 13" simulator, in portrait and landscape? One Timer, one Stats and one open sheet would check the drawn geometry.

## 9. Phase B: the couple set (direction C)

### 9.1 The owner's answers (2026-11-15, relayed)

- **Direction:** "C close up but pomo and doro should be at the fronth their halfs are behind the screen missing". So C, with every mascot **whole and in front of the die-cut page**: never half hidden, never sliced by the page or a panel edge, and never covering a panel's key content (the timer digits, today's row, the note's text, the partner's information).
- **Story:** "Show partner features". The set shows 1.5's couple features, drawn from the code at `ad0832c` with the app's own strings: pairing, the partner's day (on the Timer's strip and in its sheet), and a note from the partner, titled with their name. One invented partner name, the same in both languages, put to the owner.
- **No iPad capture.** The screens are drawn from the code alone and are unverified against a device, the form sheets especially. Five panels, no Fly panel.
- **Out of scope, noted:** the iPhone set has the same 1.4 mismatch (the idle strip without the Pair line, no couple features) and will need the partner story later. Not built now.

### 9.2 The five panels

The day's five tones stay (morning to night, the strip's sweeping cuts across the seams). Each panel is a caption and one window of the iPad's portrait screen (1032 × 1376 pt) as a die-cut page; the windows are given in screen points as x, y, width, height. Pomo & Doro sit whole on the page's top edge, in front of it.

| # | Hour, theme | Screen drawn | Window (pt) | Today's row |
|---|---|---|---|---|
| 1 | 8:30, Strawberry Milk | The Timer in Facing pages, **paired**: "You" with Pomo on the left page, "Deniz" with Doro (idle) on the right, Deniz's day at its foot (one sticker, "25 min today"); 25:00 in the spine's frame; today's row, four dashed cells | 236, 440, 560, 390 | Yes, empty at 8:30 |
| 2 | 10:45, Strawberry Milk | The pairing sheet, its code step: "Pair with your partner", your page ("Ekin", your code, "Lasts 24 hours"), the partner's page ("Your partner", six dashed cells, "Tap to type their code"), the paper-plane scene, "Send my code" and "Make a new code"; over the solo Timer, dimmed | 236, 372, 560, 631 | No (outside the window, under the sheet) |
| 3 | 13:20, Strawberry Milk | The Ring, **paired**: "Short break · session 3 of 4", 05:00, the third sticker landing on today's row; the partner strip with Doro, "Deniz", two stickers and "50 min today" | 236, 388, 560, 752 | Yes, the landing |
| 4 | 18:05, Strawberry Milk | The partner sheet over the Timer: "Deniz", the close button, Deniz's postcard (Sunday, November 1; three stickers and one dashed cell; "3 sessions · 75 min · goal 100 min"), "Updated 12 minutes ago", the "Write Deniz a note" row and its footer; the Ring's top arc dimmed above the sheet | 236, 440, 560, 430 | No (below the window) |
| 5 | 22:40, Midnight Plum | The love note from the partner over the Timer in Facing pages: "A note from Deniz" ("Deniz sana yazdı"), the note, Close; above it the pages' heads ("You" with Pomo, "Deniz" with Doro), below it today's row (four stickers and the goal flag), dimmed | 236, 440, 560, 390 | Yes, dimmed, goal reached |

**Changed while building (2026-11-15), from the first plan:**
- **Panel 4's window** was 236, 500, 560, 635, reaching down to today's row. Its top edge left two slivers of the Ring's arc in a thin band above the sheet, which read as faults. It now starts 89 pt above the sheet, where the Ring's top arc reads as the Timer behind, and stops below the sheet. The sheet is drawn at 3.4 px/pt instead of 2.3. Today's row isn't in this panel.
- **Panel 5's Timer** was the Ring. With the note sized to its content and centred, the sheet's top met the bottom of the 15:00 digits, so the timer looked cut. In Facing pages the note covers the spine's frame whole, so no timer shows, and the pages' heads and today's row frame it. It's the same window as panel 1, so the set opens and closes on the two pages, morning and night.

**Demo data, synthetic:** you are "Ekin" (seen only on the pairing sheet), your partner is "Deniz". You finish your third focus at about 13:00 and your fourth before 22:40, reaching the 100-minute goal. Deniz has 1 session by 8:30, 2 (50 min) by 13:20, 3 (75 min) by 18:05 and 4 (100 min) by 22:40. The note's words and the code are drafts.

**One order isn't a timeline:** panel 1 is already paired at 8:30, and panel 2 shows the pairing sheet over a solo Timer at 10:45. The panels run "what, then how", and no clock shows in any window, so the day reads only in the grounds' tones. Whether pairing should come first is a question for the owner (§9.7).

**What each panel draws from the code** (all strings by key from `src/i18n/en.json` and `tr.json`):

| # | Components | Strings |
|---|---|---|
| 1 | `SpreadPages.tsx` (paired: `paired.name` labels the right page, `partnerPose` idle, `PartnerDay` centred in `pairedFoot`), `TodayStickers`, `ClassicControls`; the column's vertical plan from `TimerScreen.tsx` (in Facing pages the face isn't in the ring slot, so the spread and today's row are centred together between the phase line and the controls) | `spread.you`, `timer.phaseLine`, `partner.minToday`, `today.label`, `presets.*`, `controls.startFocus`, `controls.skip`, `tabs.*` |
| 2 | `PairScreen.tsx` code step (`head`, `Spread` with `CodeCells`, `PlaneScene` with `planeArt.ts`, the pinned `Pill` and `LinkButton`), `sheetOptions.ts` (`pair`); under it the solo strip with the Pair line (`showPair`) | `pair.title`, `pair.partner`, `pair.lasts`, `pair.tapToType`, `pair.send`, `pair.newCode`, `partner.readyShort`, `partner.pair` |
| 3 | `PartnerStrip.tsx` (`PartnerStrip`, `PartnerDay`), `PhaseRing`, `TodayStickers` (the landing burst) | `timer.phaseLine`, `partner.minToday`, `today.label` |
| 4 | `PartnerScreen.tsx` (head, close button), `PartnerCard.tsx` (date, cells, line), `SettingsList.tsx` (`ListGroup`, `ButtonRow`), `sheetOptions.ts` (`partner`) | `partner.goal`, `stats.sessions`, `stats.minutesShort`, `partner.updatedMinutes`, `partner.write`, `partner.noteFooter` |
| 5 | `LoveNoteSheet.tsx` (`loveNote.from` when the note is the partner's), `sheetOptions.ts` (`loveNote`), under it `SpreadPages.tsx` paired (as panel 1, its foot covered by the sheet) and `TodayStickers` with the goal flag | `loveNote.from`, `loveNote.close`, `spread.you`, `today.label` |

### 9.3 Captions (drafts for the owner)

Headlines in Baloo 2 SemiBold at 156 px with hand-set breaks, sublines in Baloo 2 Medium at 62 px, as the v1.4 iPad set. The Turkish leans on the app's own wording (`pair.title` "Partnerinle eşleş", `pair.art` "tek bir günlüğün iki yüzü", `partner.noteFooter` "Bir sonraki odaklanmasının ardından görünür").

| # | English | Turkish | Widest headline line at 156 px (EN / TR) |
|---|---|---|---|
| 1 | **Two pages, / one diary** · You on one, your partner on the other | **İki sayfa, / tek günlük** · Biri senin, biri partnerinin | 763 / 726 px |
| 2 | **Pair with / your partner** · Send your code, or type theirs | **Partnerinle / eşleş** · Kodunu gönder ya da onunkini yaz | 874 / 778 px |
| 3 | **A sticker for / every focus** · And your partner's day, right beside yours | **Her odağa / bir çıkartma** · Partnerinin günü de hemen yanında | 841 / 833 px |
| 4 | **See your / partner's day** · Then write them a note | **Partnerinin / gününü gör** · Sonra ona bir not yaz | 908 / 794 px |
| 5 | **Notes for / each other** · Theirs appears after your next focus | **Birbirinize / notlar** · Onunki, bir sonraki / odaklanmanın ardından görünür | 741 / 714 px |

Every headline line fits the 1860-px box with room to spare. The widest subline (Turkish panel 5) is broken by hand into two lines.

**The partner's name: "Deniz"** (a draft, put to the owner). It's a common Turkish given name used for any gender, short, and easy to read and say in English; the code's own comment uses it (`PartnerStrip.tsx`, `partnerLabel`). In Turkish it takes the strings' forms without a suffix (`{{name}} sana yazdı`, `{{name}} için not yaz`). **Your own name, "Ekin"**, appears only where the pairing sheet shows your display name (`myName` on your page); it's also a gender-neutral Turkish name. Both are drafts.

**The note from Deniz (draft):** "So proud of you. Dinner's on me." / "Gurur duyuyorum. Akşam yemeği benden." Each is one line at 20 pt in the sheet's 492-pt text width.

### 9.4 Drawing rules (what is true and what is assumed)

- **From the code:** every size, padding, gap, radius, font size and weight above comes from the components named in §9.2 and `src/theme/layout.ts` (`space` 4/8/12/16/24/32, `radius` 8/14/22, edge 1.5). Baloo 2's line height is 1.602 em (hhea 1078 / −524 per 1000). The system face is drawn as Inter, as before.
- **Assumed, unverified against a device:**
  - every iPad form sheet is centred and 540 pt wide (UIKit's default form-sheet width); a sheet sized to its content (`fitToContents`: the partner sheet, the love note) is as tall as its content, and the pairing sheet (a full-height detent) is 620 pt tall, UIKit's default form-sheet height;
  - the sheets' corner radius (38 pt, as the v1.4 set) and the dim behind them (black at 20 %);
  - the content's top under iPadOS's floating tab bar (74 pt, as the v1.4 generator);
  - Inter's widths, estimated per character for centring and wrapping, as before.
- **Corrected from the v1.4 generator:** its iPad Facing pages were 448-pt pages with today's row at the foot. The code makes the spread as tall as its content (about 315 pt) and centres it together with today's row. The new generator draws the code's version; the v1.4 sources are untouched.

### 9.5 The build

- **A new generator, `scripts/art/store-ipad-sources.py`**, loads `store-sources.py` as a module for its helpers (Baloo 2 shaping, Inter text, the art, the sticker lift, the 1.4 Screen pieces) and adds the 1.5 pieces. It writes only `art/src/store-ipad/store-ipad15-{en,tr}.svg` and `art/jobs/store-ipad.json`; `--check` regenerates in memory and compares. It never writes the 1.4 sources.
- **The job** builds the two strips with `scripts/art/build.mjs art/jobs/store-ipad.json` (only that job), in a work folder inside this worktree (`VP_ART_WORK`), into new paths: `art/vc/store-ipad15-*.vectorcraft`, `art/steps/store-ipad15-*.steps.json` and `art/out/store-ipad/`. No iPhone source or output is touched.
- **Self-checks in the generator,** which refuses to write on any failure:
  - every mascot's box lies whole inside its panel (24 px from each side), clear of every caption line and clear of its panel's key content;
  - every text drawn in a screen is wholly inside its window or wholly outside it, so no text is cut by a window's edge.

### 9.6 Results (2026-11-15)

**Commands, in order:**
1. `python -P scripts/art/store-ipad-sources.py`
2. `VP_ART_WORK=C:/vp/ipad-shots/.impeccable/review/ipad/vcwork node scripts/art/build.mjs art/jobs/store-ipad.json`
3. `python -P .impeccable/review/ipad/review15.py`

**Content scale, by panel:**

| Panel | Scale (px/pt) | The column's share of the panel |
|---|---|---|
| 1 and 5 | 3.4 | 0.84 |
| 2 | 2.75 | 0.72 for the sheet |
| 3 | 2.31 | 0.57 |
| 4 | 3.4 | 0.89 for the sheet |
| Today's set, for comparison | 1.72 | 0.43 |

**Review sheets:** `.impeccable/review/ipad/review15-en.png` and `review15-tr.png` show the strip, then the search-size and product-page-size insets next to today's set.

- [x] **The self-checks pass** in both languages: every mascot whole inside its panel, in front of its page, and clear of the captions and key content; no text or row cut by a window. `selfcheck_test.py` proves they fire. A window ending inside today's row, and a 900-px Pomo, gave five failures, each named.
- [x] **Sizes:** all ten panel PNGs are 2064 × 2752, bit depth 8, colour type 2 (IHDR, `review15.py`).
- [x] **Turkish fits:** every headline line is ≤ 833 px in the 1860-px box, and every subline is inside the panel. The in-screen strings checked by eye: "bugün 50 dk", "Partnerin", "Kodu yazmak için dokun", "24 saat geçerli", "Deniz için not yaz", "Bir sonraki odaklanmasının ardından görünür.", "Deniz sana yazdı", "Kapat".
- [x] **Today's row** shows on panels 1, 3 and 5, as planned.
- [x] **Generator checks:** `store-ipad-sources.py --check` passes, and so does `store-sources.py --check` (the v1.4 sources are untouched).
- [x] **Git:** `git status` shows only new, untracked files, and nothing tracked has changed.
- [ ] **`build.mjs --check art/jobs/store-ipad.json` fails** on the two `.vectorcraft` files only; every PNG and SVG rebuilds byte for byte. VectorCraft 0.23 writes them as PDF-like files carrying `/CreationDate` and `/ModDate` build stamps, which `build.mjs`'s `normalise()` doesn't pin. It pins only the JSON `created` and `modified` fields. This is likely the same change that broke `--check` after 0.21. Fixing `normalise()` is a change to the shared pipeline, left for the owner's word.
- [ ] **Unverified against a device** (record §9.4):
  - the sheets' size, radius and dim;
  - the content's top under the tab bar;
  - the whole iPad layout.

### 9.7 Questions for the owner

1. **Captions:** approve or change the drafts in §9.3, English and Turkish.
2. **Names:** "Deniz" for the partner, and "Ekin" for you (seen only on the pairing sheet, where the app shows your own name)?
3. **The note:** "So proud of you. Dinner's on me." / "Gurur duyuyorum. Akşam yemeği benden."?
4. **The pairing code:** K7MP4Q, from the app's alphabet?
5. **The panels:** the set drops 1.4's week (Stats) and Modes panels to fit the couple story in five. Is that the trade wanted, or should one come back in place of another?
6. **The order:** "what, then how" (the paired pages first, pairing second), or pairing first?

### 9.8 The owner's approval (2026-11-16)

The owner saw both review sheets (`review15-en.png`, `review15-tr.png`) and answered "okay i approve this". The question card about the six points above was cut off before it was answered, so this reads the approval as covering the set as drafted:
- the captions of §9.3 in both languages;
- "Deniz" and "Ekin", the note and the code K7MP4Q;
- five panels, with Stats and Modes left out;
- the paired pages first.

**To upload,** in App Store Connect, on the 1.5.2 version, under the iPad 13" display, per language:
1. Replace the 1.4 iPad screenshots.
2. Upload in panel order, 01 to 05.
   - **English:** `store-ipad15-en-0N-2064x2752.png`
   - **Turkish:** `store-ipad15-tr-0N-2064x2752.png`

The `-2138.png` files are previews and not for upload. The iPhone sets stay 1.4's for now (§9.1).

### 9.9 Two changes after approval (2026-11-16)

Reviewing the iPhone set ([its record](2026-11-16-iphone-store-set.md)), the owner wrote: "can we change Deniz to Mert. And the last message should start with "Seninle gurur duyuyorum"". Both stores carry both changes.

**The changes:**
- **The partner is "Mert"** wherever "Deniz" was: the facing page, the partner strip, the partner sheet's title, "Write Mert a note" / "Mert için not yaz", and "A note from Mert" / "Mert sana yazdı".
  - None of the Turkish strings drawn suffix the name: they use `için`, `sana` and `ile`.
  - "Ekin" and the code K7MP4Q stay.
- **The Turkish note is "Seninle gurur duyuyorum. Akşam yemeği benden."** VectorCraft's Inter draws it 468 pt wide, so it stays one line in the iPad sheet's 492 pt. The sheet and its Close button are unchanged in height. The English note is unchanged.

**What changed:**
- `PARTNER` and `NOTE['tr']` in `scripts/art/store-ipad-sources.py`.
- `art/src/store-ipad/store-ipad15-{en,tr}.svg` and `art/vc/store-ipad15-{en,tr}.vectorcraft`.
- `art/out/store-ipad/`:
  - the strips' SVGs and `-2138.png` previews;
  - panels 01, 03, 04 and 05 in both languages. Panel 02, the pairing sheet, shows no partner name and is byte-identical.
- `art/steps/store-ipad15-{en,tr}.steps.json`: only their work-folder paths changed. They were rebuilt in `C:/vp/iphone-shots/.impeccable/review/iphone/vcwork`.

**Checks:**
- The self-checks pass.
- All ten panels are 2064 × 2752, colour type 2.
- The Turkish was checked at full size.
- Review sheets: `.impeccable/review/iphone/review-ipad-{en,tr}.png`.
