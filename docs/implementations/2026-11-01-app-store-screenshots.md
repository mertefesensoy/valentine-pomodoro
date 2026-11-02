---
id: IMPL-2026-11-01-app-store-screenshots
title: "v1.4 App Store screenshots: a Pomo & Doro triptych, drawn in VectorCraft"
status: done
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-11-01-phase1-stage-e, IMPL-2026-11-01-phase1-d5-tutorial, IMPL-2026-11-01-phase1-d5-assets]
---

# 2026-11-01 — v1.4 App Store screenshots: a Pomo & Doro triptych, drawn in VectorCraft

**Status:** **Done, 2026-11-02.** The owner approved the final set: "Approve the set". On the iPad trade they chose "Keep today's row visible" (§3.8). The 30 panel PNGs and their VectorCraft sources are committed on this branch, ready to upload; uploading is the owner's step in App Store Connect.
**Preview:** [Morning to Night Triptych](https://claude.ai/artifact/U4Mz7rArU5GzDPMzgJM9Ay), private (`art/review/store-preview.html`, written by `scripts/art/review-store.mjs`).
**Branch:** `phase1/app-store-shots`, worktree `C:\vp\stage-shots`, cut from `phase1/stage-d` at `aabc4e1`. Commits use `git commit -- <paths>`. No push, no merge, no EAS build and no App Store Connect action without the owner's explicit word.
**Parent:** the Stage E record's step R2, "screenshots of the redesign" ([Stage E](2026-11-01-phase1-stage-e.md) §3.4).

---

## 0. Steps

| # | Step | State |
|---|------|-------|
| 1 | Orientation: the pipeline probe (§3.2) | Done |
| 2 | Shape the brief: panels, captions, devices, how screens are made | **Confirmed by the owner, 2026-11-01** ("Confirm the brief") |
| 3 | This plan, committed before any art | Done, `54d5e8c` |
| 4 | Composition round: `concept-seed --scope surface --mode persuade`, a decision page of strip sketches, the owner's pick | **"Morning to night"**, the owner's pick, 2026-11-01 (§3.3) |
| 5 | The direction contract in the surface brief, approved by the owner | **Approved, 2026-11-01** ("Approve the contract"; "Turkish is right") |
| 6 | The build: the generator, the strip sources, `build.mjs` crops, the PNGs | Done (§3.5–3.7); every `--check` passes |
| 7 | The preview page (the carousel as the store shows it), the finish review, the owner's approval of the final set | Done: finish review **fix**, then two verdict passes (§3.8); **approved by the owner, 2026-11-02** ("Approve the set") |
| 8 | Commit the sources and PNGs; this record and memory brought up to date | Done (this commit) |

**Boundaries.** This session changes only `art/` (new `art/src/store/`, `art/jobs/store.json`, the store's `art/vc`, `art/steps` and `art/out/store` files), `scripts/art/` (a new generator and a backward-compatible `crops` option in `build.mjs`), `art/review/store-*`, the surface brief for this surface, and this record. No app code, no shared doc (SRS, ROADMAP, ARCHITECTURE, CHANGELOG, TEST-STRATEGY, `docs/README.md`, the ADR index), and no `check-docs --write`: this record links only documents that carry no generated backlink block, so the docs check stays green without touching shared files. The owner's own screenshots stay in `.impeccable/review/` (git-ignored), never committed.

## 1. Problem / Motivation

v1.4 rebuilds every screen in the Sticker Diary design (Pomo & Doro, the Same Page mark, Baloo 2, Strawberry Milk and Midnight Plum). The App Store listing still shows v1.3.1's screens, so the first thing a new visitor sees would contradict the app they install. The release plan's R2 asks for "screenshots of the redesign".

The owner's words: "i need new app store photos to use for my app and i really want us to use our new VectorCraft skills on hand. With Pomo and Doro and our applications look i want to design a multiaple photo app store design that will be magnfiicent Triptych design".

What the set must do:
- **Persuade** a visitor in search results, where the first three portrait screenshots show side by side, and on the product page, where they scroll as a carousel.
- **Run its artwork continuously** across the panels' seams: a triptych, not five separate posters.
- **Claim only what 1.4 ships.** v1.4 is solo: pairing, presence and shared sessions arrive in Phase 3, so no panel shows or implies them. No counts, ratings, reviews or prices (PRODUCT.md's "never to be invented" list).
- **Keep the brand rules:** no tomato, clock or heart in the mark or the art; no emoji or SF Symbols where custom art exists; nothing babyish (DESIGN.md).

## 2. What Changed

| File | Change |
|------|--------|
| `scripts/art/store-sources.py` (new) | The generator: writes the four strip sources and the job from its constants, the shipped tokens, strings, fonts and art; `--check` regenerates in memory and compares |
| `art/src/store/store-{iphone,ipad}-{en,tr}.svg` (new) | One source per strip: five panels side by side with the store's gutter |
| `art/jobs/store.json` (new) | The job: each strip, its crops at every App Store size (30 panels in all), and a fifth-size export of the whole strip |
| `scripts/art/build.mjs` | Two changes. A `crops` option exports named rectangles of the artboard as PNGs at a given width; jobs without it produce identical steps. And the build-time pin in `.vectorcraft` files now also matches VectorCraft's compact JSON (`"created":123`), which it writes for large documents; pretty files keep their bytes |
| `art/vc/store-*.vectorcraft`, `art/steps/store-*.steps.json` (new) | The editable sources and the exact command lists |
| `art/out/store/*` (new) | The strips' SVGs, their fifth-size PNGs, and the 30 panel PNGs to upload: `store-<device>-<lang>-<01..05>-<W>x<H>.png` |
| `scripts/art/review-store.mjs`, `art/review/store-preview.html` (new) | The preview page: the set as search results and the product page show it, in both languages and on both devices |
| `.impeccable/surfaces/scripts-art-store-sources-py.md` (new) | The surface brief: the brief, the direction contract and its build pins |
| `docs/implementations/2026-11-01-app-store-screenshots.md` (new) | This record |

## 3. Implementation Approach

### 3.1 The brief (confirmed by the owner, 2026-11-01)

The owner's answers to the shape round: **5 panels, triptych + 2** (panels 1–3 are the triptych search shows; 4 and 5 continue the strip on the product page); **the story "Pair, stickers, week"**; **iPhone 6.9" and 6.3", plus iPad 13"**; **screens drawn in VectorCraft**. Then "Confirm the brief" on the panel plan and captions below.

| # | Sells | Screen drawn | Caption, English | Caption, Turkish |
|---|-------|--------------|------------------|------------------|
| 1 | Pomo & Doro | Facing pages, Strawberry Milk | **Meet Pomo & Doro** · The two little faces of your timer | **Pomo ile Doro'yla tanış** · Zamanlayıcının iki küçük yüzü |
| 2 | Stickers and the daily goal | The Ring, today's row filling | **A sticker for every focus** · Each one lands on today's page, toward your goal | **Her odağa bir çıkartma** · Bugünün sayfasına yapışır, hedefini doldurur |
| 3 | The week | Stats' postcard stack | **Your week, as postcards** · With your daily goal and love streak | **Haftan kartpostallarda** · Günlük hedefin ve aşk serinle |
| 4 | Love notes | "A note for you" over the timer | **A love note after each focus** · Write your own, too | **Her odaktan sonra bir aşk notu** · Kendi notlarını da yaz |
| 5 | Your way | Midnight Plum, the Ring and the Modes sheet | **Focus your way** · Ring or Facing pages, day or night, or fly over the map | **Kendi düzeninde odaklan** · Halka ya da Karşılıklı sayfalar, gündüz ya da gece; istersen haritada uç |

- **Copy sources.** Feature names and in-screen strings come from `src/i18n/en.json` and `tr.json` (Halka, Karşılıklı sayfalar, aşk serisi, "Pomo ve Doro seninle çalışıyor"); the captions follow the What's New drafts (Stage E §3.5). The Turkish captions go to the owner for a proof pass at the contract.
- **Demo data** is authored, realistic and labelled synthetic in this record (§3.6): today's stickers, a 100-minute goal, a week of postcards, a default love note (`src/constants/defaults.ts`).
- **The app's public name stays off the art,** because it is undecided (PRODUCT.md). The store prints the name beside the screenshots anyway.

### 3.2 The pipeline, proved first (2026-11-01, `vectorcraft-cli 0.18.0`)

A throwaway probe (deleted, never committed) settled what the build can rely on:

- **Exact sizes, no alpha.** A 1320 × 2868 artboard with a full-bleed ground exports a 1320 × 2868 PNG of colour type 2 (RGB). App Store Connect refuses images with an alpha channel.
- **Byte-identical rebuilds.** `build.mjs --check` passed on the probe's second run.
- **One strip, cropped per panel.** `document.export` with `rect: [x, y, w, h]` and `scale` exports any rectangle of the artboard. At scale 1, a 1320-wide rect gives 1320 × 2868; at scale 1206 / 1320 with a rect 2869.85 pt tall, it gives exactly 1206 × 2622. So each strip is **one** VectorCraft source, the art is continuous by construction, and every panel at every size is a crop of it.
- **Text.** Baloo 2 isn't installed in VectorCraft, so the generator outlines it with HarfBuzz (`uharfbuzz 0.57.0`, `fontTools 4.61.0`) from the committed `assets/fonts/Baloo2-SemiBold.ttf` and `Baloo2-Medium.ttf`: kerning and Turkish letters shaped properly, paths written into the source. The app's system face (SF Pro) isn't on this machine; **Inter**, which VectorCraft bundles in Regular, Medium and SemiBold (SF Pro's three weights in the app), stands in for it as live text that VectorCraft sets. The owner chose drawn screens with this substitution stated.
- **Sizes** (Apple's "Screenshot specifications" page, read 2026-11-01): "iPhone with Dynamic Island (large display)" takes 1320 × 2868; the page names "Dynamic Island (medium display)" (1206 × 2622) as the required iPhone set; iPad 13" (2064 × 2752) is required because the app supports iPad (`supportsTablet: true`). PNG or JPEG, no alpha, up to 10 per size. The owner confirms in App Store Connect's upload page.

### 3.3 The composition round and the pick (2026-11-01)

A whole surface inside an established world (Impeccable new-work §3): the Sticker Diary is fixed, so the round chose a structure, not a world.

- **Seven structures, by resonance:** 1 the bookmark ribbon, 2 the concertina diary, 3 the giant colon, 4 the sticker sheet, 5 morning to night, 6 the desk from above, 7 the washi timeline.
- **The roll** (`concept-seed --scope surface --mode persuade`, `seed:c914bb69c48d1a45`) dealt 5, 4 and 2, with 5 leading. My own first choice, the ribbon, wasn't dealt; that is the roll's purpose.
- **The decision page** showed the three as sketches of the whole strip in its real coordinates (five 1320 × 2868 panels, the store's gaps), drawn with the shipped poses and Baloo 2 and rendered by VectorCraft. The page's thumbnails stayed blank in the browser pane; its expand button opened each sketch full size, and the owner also had the three side by side as an image.
- **The owner, 2026-11-01: "Morning to night"**, the dealt lead. Recorded on the page and reported to the roll (`--kind assigned`, "choice already recorded"). Build path: code-led.

**Morning to night.** The strip is one study day: the ground steps through five flat cut-paper tones from Strawberry Milk morning to Midnight Plum night, each change entering on a sweeping cut that crosses a seam; a paper hill runs the length of the strip; Pomo & Doro live the day in their own poses (waving, celebrating, on a break, asleep). The screens follow the hour: Strawberry Milk by day, Midnight Plum at night. The full contract and its build pins are in the surface brief.

### 3.4 The direction contract (approved by the owner, 2026-11-01)

The contract and its build pins are in `.impeccable/surfaces/scripts-art-store-sources-py.md`. The owner: "Approve the contract", and "Turkish is right" for the five Turkish captions. In short:

- **Thesis:** the five panels are one study day, the category's "caption over a centred phone on five pastel cards" refused.
- **Pins:**
  - a 60-px gutter, with nothing that matters within 70 px of a panel corner;
  - the hero pair from the tour kit, waving, astride seam 1|2;
  - celebrating at seam 2|3, on a break at 3|4, asleep in panel 5;
  - panels 1–4 in Strawberry Milk and panel 5 in Midnight Plum;
  - the sticker mid-landing in panel 2;
  - consistent demo data from the app's own strings;
  - headlines at 136 px for search results, sublines at 54 px for the product page.

### 3.5 The build: the generator and the strips

**The generator** (`scripts/art/store-sources.py`, Python because HarfBuzz is there) is a pure function of:
- its constants;
- the tokens (`src/theme/palette.json`) and the strings (`src/i18n/en.json`, `tr.json`);
- the committed Baloo 2 subset;
- the shipped art: `art/out/illustration/*.svg`, the poses and the tour kit's layers, and `art/out/icon/*.svg`, the 24-pt icons, inlined as flat paths, plus the Same Page mark.

Every id is a counter and every number is rounded to 2 decimals, so `--check` is byte-exact. It reads the strings at generation time, so a change to an in-screen string makes `--check` fail until the sources are regenerated, which is how the screenshots stay true to the app.

**A strip** is one artboard: five panels side by side with the gutter between them (iPhone 6 840 × 2 868; iPad 10 688 × 2 752). It's drawn back to front:
1. **The day's grounds:** the first tone over everything, then each next tone as a path entering on a sweeping cubic cut that crosses its seam. Flat fills, never a gradient.
2. **The sky's paper:**
   - a strawberry sun at panel 1;
   - a milk sun in panel 3's margin;
   - a strawberry sun setting into the hill at dusk;
   - a crescent moon at panel 5, drawn as a milk disc with a plum-page disc over it, since the ground there is flat plum;
   - four stars.
   Each disc carries a cut paper edge (white by day, plum `edgeStrong` round the moon).
3. **A far hill** in the well tone (`field`, plum `field` from dusk), behind the devices, so the ground shows two layers of paper between them.
4. **The devices,** each with its panel's screen clipped into it: a cocoa body with a lighter edge (so it holds against the night), a glass bezel, and the Dynamic Island and side buttons on iPhone. Each panel's device has its own x (`CAST`), set so the stickers in front of it meet its tab bar cleanly (§3.8).
5. **The near hill:** one smooth path the length of the strip, paper with a crisp `edge` line by day and plum paper with a plum `edge` from dusk; the change happens at seam 3|4's middle, inside the gutter.
6. **Pomo & Doro** stand on the near hill, placed by `CAST`. Each sticker's feet are measured from its art's lowest point and sunk 3 % of its size into the paper.
   - The hero pair are the tour kit's wave (smile, grin, the outer hand held raised).
   - Panel 3's pair are its "excited" (sparkle eyes, grin).
   - Panel 4's pair are the break pose, with a white die-cut plate under the mug.
   - Panel 5's pair are the sleepy pose, its Zz in plum `inkSoft`.
7. **Panel 2's callout** (§3.6).
8. **The captions,** centred: Baloo 2 SemiBold headlines with hand-set line breaks (a name pair never splits), and Baloo 2 Medium sublines.

**The crops** (`art/jobs/store.json`): each panel at 1320 × 2868 and 1206 × 2622 (iPhone) or 2064 × 2752 (iPad), and the whole strip at a fifth of its width for the preview. `build.mjs` exports them with `document.export`'s `rect` (§4).

### 3.6 The build: the screens and the stickers

**The screens** are drawn in the app's points, 393 × 852 for iPhone and 1032 × 1376 for iPad, and scaled into each device. The geometry follows the code's layout rules (`TimerScreen.tsx`, the classic and stats components, DESIGN.md), checked against the owner's device captures (`.impeccable/review/d1–d3` in the main worktree, references only, never pixels):
- **On the Timer:** the foot is anchored 16 pt above the tab bar, and the ring is centred in the height left above the partner strip (275 pt on iPhone, capped at 340 on iPad).
- **On iPad:** the tab bar is at the top, and the page is the phone column centred (Classic 512 pt, Stats 528). v1.4 has no iPad layout, and no iPad capture exists to check against; the owner is told.

| Panel | Screen | State drawn |
|---|---|---|
| 1 | Facing pages, Strawberry Milk, 8:30 | Ready for the day's first focus: "Focus · session 1 of 4", 25:00, four dashed cells owed to the goal, 25/5 selected, Start focus |
| 2 | The Ring, 10:45 | The third focus just finished: "Short break · session 3 of 4", 05:00, the third sticker (Pomo's) mid-drop (scale 1.18, −7°, 8 pt above its cell) inside its 12 paper bits (TodayStickers.tsx's angles, distances and four colours, frozen part-way), one dashed cell left |
| 3 | Stats, 13:20 | Sessions; the week Mon 26 – Sat 31 (2, 0, 3, 4, 4, 5) and today's three; the goal and the love streak |
| 4 | The Ring at dusk, 18:05, and the love-note sheet | "Long break · session 4 of 4", 15:00, four stickers and the goal flag; "A note for you" with Pomo celebrating, the note "Tiny victories, endless love." (`DEFAULT_LOVE_NOTES[18]`), Close |
| 5 | The Ring in Midnight Plum, 22:40, and the Modes sheet | "Focus · session 1 of 4"; Modes: Classic selected with the Same Page glyph and the check, Timer layout Ring, and Fly |

**The demo data is synthetic.** All of these are authored to agree with one another:
- the times;
- the week's counts (21 sessions, the goal reached on Thursday, Friday and Saturday);
- today (3 sessions, 75 min, "25 min to the goal");
- the love streak (3 days, best 5);
- the dates (`toLocaleDateString` for 26 October – 1 November 2026, in en-US and tr-TR).

Every "Break at" time is the status time plus the timer; no panel shows a running timer, so none appears. The ad banner the free tier shows on Stats is left out, as store screenshots conventionally do.

**Type in the screens:**
- Baloo 2 for the timer (tabular figures), the Stats title, "Today" and the note's title.
- Inter for the system text, in the app's weights (400, 500, 600) and sizes.
- Inter's widths aren't measurable on this machine, so the few centred rows (today's row, the partner line's wrap, the iPad tab bar) estimate them at 0.53, 0.55 and 0.57 em per character for the three weights, and Turkish strings were checked by eye.

**Stickers lift as the app's do** (`Sticker.tsx`): the art's paths again in the theme's sticker shadow, offset 1 point right and 2 down, in three layers a point wider each, each layer at 1 − (1 − α)^⅓.
- **Inside a screen,** the point is the screen's own, and the lift uses the die-cut silhouette alone (the white paths enclose the rest; the same shadow with a third of the paths).
- **In the scene,** a "point" is a 48th of the sticker's size. The night stickers take Midnight Plum's milk edge and plum shadow.

**Panel 2's callout:** the real-size landing inside the phone is true but about 3 px at search size. So today's landing sticker, Pomo celebrating, is drawn again at about four times its cell (300 px on iPhone), breaking out over the screen's right edge beside today's row: mid-drop, tilted −8°, with the paper bits that fly out of the screen (the same rule's rightward bits). It covers no text. Its first version, a mid-drop Pomo standing at seam 2|3, read as confetti at the hill; the finish review replaced it (§3.8).

### 3.7 Fixes found by looking, before the finish review

**Composition and layout**
- **Caption breaks:** "Meet Pomo &" broke before "Doro", so every headline and two sublines have hand-set breaks.
- **Panel 3's sun** straddled the dusk cut, so it moved into the pink margin.
- **Panel 5's moon:** its two-arc path had zero area (both arcs on one chord), so it's now a disc and a cut, and it moved out from behind the phone.
- **The sleepers** in panel 5 ran past the strip's last edge, where no seam continues them; they now stay 70 px inside it.
- **The iPad device** was too small for its centred column to read, so it grew from 1300 to 1500 px. The iPad hill dropped so it no longer covers Skip.

**Text inside the screens**
- **Panel 1's Turkish partner line** runs to three lines; it's set at 14/17 pt so it clears the timer's frame.
- **The love-note sheet** half-covered the presets' hint; it's 14 pt taller so it covers the hint fully.

**The pipeline**
- **`build.mjs`'s time pin** missed VectorCraft's compact JSON, so the four strips' `.vectorcraft` files carried their build time and failed `--check`. Fixed in `normalise()`; the existing files' bytes are unchanged (the full check passes).

### 3.8 The finish review and its fix batch (2026-11-02)

A fresh `impeccable-finish-reviewer` read the panels, the composites at search and product-page scale, the 1:1 edges of the 6.3" crop, the contract and the device captures. No detector ran (native). Its disposition was **fix**.

It kept two things and asked they not be traded away: the five exact-token grounds sweeping across the seams, and the screens drawn faithfully to the shipped app. It confirmed the grounds' sampled pixels are the tokens and the seed reference is known.

The eight material fixes, all applied in one batch:

| # | Finding | Fix |
|---|---|---|
| 1 | The seam 3|4 pair was sliced by the panel edges (Pomo had 0 outline pixels in panel 3's last column), and the mug read as a clipped box | Every scene sticker stays whole inside its panel (≥ 24 px from a side, 70 px from the strip's end). The break pair now stands wholly in panel 4. A white die-cut plate goes under the mug and steam, so the sticker is one cut |
| 2 | The plum hill entered panel 3 as a 30 px vertical bar | The hill turns plum at seam 3|4's middle, inside the gutter |
| 3 | Panel 1: Pomo half-covered the Notes tab, leaving "No" | Pomo (480 px) covers the whole Notes item and clears Settings |
| 4 | Panel 2's landing was about 3 px at search size | The callout (§3.6); panel 2 is now session 3 of 4, so the landing sticker is Pomo's and the day's clock still holds |
| 5 | iPad: the column was unreadable at store scale | The device fills the panel's width (1851 px) and runs off its foot, so the column renders about 0.43 of the panel (up from 0.36). iPad form sheets now present centred, as iPadOS does. The reviewer asked for about 0.53; larger would drop today's row (1109 pt) below the hill, and panel 2's in-screen proof with it |
| 6 | The wave hands read as ears | The tour kit's wave hand is held turned 24° away from the head about its pivot (`expressions.json`) and pushed 14 units along its axis |
| 7 | Panel 5: the sleepers covered the Fly row; the Zz were invisible | The hill eases down under panel 5 and the sleepers (270 px) lie below the Fly row. The Zz are recoloured to plum `inkSoft` |
| 8 | Panel 2: Doro hid the selected Timer tab | The phone sits further right (x 330) and Doro (460 px) stays left of the Timer pill |

**The tab-bar rule** came out of fixes 3 and 8: wherever a sticker stands in front of a phone, it covers a tab item completely or not at all, and never the selected tab.
- `CAST` holds each panel's device x and each sticker's x and size, set from the tab items' boxes (an item's icon and label, at the label widths of both languages).
- `.impeccable/review/store/tabbars-iphone.png` shows every iPhone tab bar at 1:1, English then Turkish, as the check.

Panel 3 now has its own pair, excited, flanking the Stats phone: Doro clear of the Timer item, Pomo covering Notes. The ceiling notes were also answered: the far hill, the paper edges on the suns and the moon, and the sparkle-eyed pair.

**The verdict pass** (the same reviewer, over the recaptures) scored seven fixes resolved: 1, 2, 3, 4, 6, 7 and 8. It scored fix 5 partial: at 0.43 of the panel, the iPad's week rows and its in-screen landing are still specks; the trade is put to the owner. It found two regressions of the batch, both on iPad, and both are fixed:
- **R1:** the centred note card cut the 15:00 in half. The iPad card is now 420 pt tall, covering the numerals whole, with its content centred and a lighter dim (12 %).
- **R2:** the hill sliced the presets' labels. Across each iPad device the hill is now level at one line (2650 px), between today's row (it ends at about 2616) and the presets (they begin at about 2656), so the row always shows and the presets never show half.

The evidence is `.impeccable/review/store/ipad-foot.png` and `ipad-04-sheet.png`.

**The owner's decision on fix 5, 2026-11-02:** asked to choose between keeping today's row visible (the column at 0.43 of the panel) and growing the iPad column (about 0.5, with today's row below the hill), the owner chose **"Keep today's row visible"**. This closes fix 5 as an accepted trade, not a defect.
- **Reach of the final verdict:** the reviewer scored the eight fixes and R1, R2 resolved, with fix 5 closed by the owner's words. That covers the scored fixes, not a fresh pass over the whole surface.
- **What reads on iPad:** the iPad screens follow the app's phone column as v1.4 draws it on iPad, and are unverified against a device. At search size their week rows are small.

**Provenance.** These rasters' provenance is the pipeline itself (ADR-0027):
- the generator writes the source;
- `art/steps/store-*.steps.json` is the exact command list;
- VectorCraft exports the PNGs;
- `build.mjs --check` proves they rebuild byte for byte.

No generation prompt exists, and nothing is embedded in the PNGs: a metadata chunk would break the byte-for-byte check.

### 3.9 Design system check (2026-11-02)

The documenter compared the finished set against the incumbent DESIGN.md and `palette.json`. It found the set **consistent**: an ordinary extension of the Sticker Diary world.
- **Tokens:** every colour comes from `palette.json`.
- **Type:** the captions are Baloo 2. The system face is drawn as Inter.
- **Shapes and depth:** the screens keep the 1.5 pt edge and the 8, 14, 22 and pill radii. Stickers keep the three-layer lift.
- **Craft floor:** no banned element.

DESIGN.md and `.impeccable/design.json` are unchanged. Another session regenerates them at its release step.

The surface brief's "Design system check" section carries the evidence and two proposals for that step:
- a marketing caption role (Baloo 2 SemiBold headline, Baloo 2 Medium subline);
- the cut-paper scene as the Persuade-surface idiom.

It also lists what is not canonized:
- the device frame;
- the black sheet dims;
- the Modes rows' 20 pt radius, where the app uses 14.

The Modes rows' radius is now fixed. On the owner's word ("Yes, fix it", 2026-11-02), panel 5's Modes sheet is drawn as `ModeSheet.tsx` draws it:
- rows at `radius.m` (14 pt) with the 1.5 pt edge (`primaryInk` on the selected row);
- 12 pt of padding around a 44 pt head;
- the Fly badge at 44 × 44 pt with 14 pt corners;
- a 22 pt check.

Only panel 5 changed, in all four sets. The Fly row still clears the sleepers.

And it lists two pre-existing gaps in DESIGN.md:
- the love note title's display type;
- the four D5 palette roles.

## 4. Mathematical / Statistical Details

**Panel crops.** A strip has N = 5 panels of width W = 1320 and height H = 2868 (iPhone), separated by a gutter g (fixed by the contract). Panel i (0-based) is the rectangle x_i = i · (W + g), y = 0, width W, height H, exported at scale 1.

**The 6.3" set from the same strip.** Its target is 1206 × 2622. Scaling by s = 1206 / 1320 ≈ 0.913636 gives a width of exactly 1206 px but a height of 2868 · s ≈ 2620.31 px. So the crop's rectangle is taller than the artboard: height h = 2622 / s ≈ 2869.851 pt, centred on the panel, y = −(h − 2868) / 2 ≈ −0.925 pt. The ground runs past the artboard's top and bottom, so the extra 0.93 pt at each edge is ground, and nothing visible moves by more than one pixel.

**Caption legibility at thumbnail size.**
- In search results, three panels share roughly the width of an iPhone screen (about 390 pt), so a 1320-px panel shows about 115–120 pt wide, a factor of f ≈ 0.09.
- A headline of size S px shows there at S · f pt. At S = 136 px that is about 12 pt, a readable headline, so the headline is sized for search.
- The sublines (54 px, about 5 pt there) are for the product page, where a panel shows about 230 pt wide (f ≈ 0.17, about 9 pt).
- The search-size composites (`.impeccable/review/store/search-*.png`) are the check.

**Caption contrast** (WCAG relative luminance, (L₁ + 0.05) / (L₂ + 0.05)):

| Panel | Text on ground | Ratio |
|---|---|---|
| 1 | `ink` / `page` · `inkSoft` / `page` | 11.70 · 5.69 |
| 2 | `ink` / `primarySoft` · `inkSoft` / `primarySoft` | 10.38 · 5.05 |
| 3 | `ink` / `primary` (headline and subline) | 6.76 |
| 4 | plum `ink` / plum `primarySoft` · plum `inkSoft` / plum `primarySoft` | 11.05 · 6.22 |
| 5 | plum `ink` / plum `page` · plum `inkSoft` / plum `page` | 15.84 · 8.91 |

Panel 3's subline is in `ink` because `inkSoft` on `primary` is only 3.28 : 1. Every pair clears 4.5 : 1. Each subline stays on its panel's own tone (the cuts cross the tops of panels 2 and 4 outside the text).

**The sticker lift.** With the token's alpha α (16 % cocoa by day, 40 % plum at night), each of the three layers has opacity 1 − (1 − α)^⅓. Where all three overlap, 1 − (1 − layer)³ = α, so the shadow's core reaches the token and falls off a point at a time. In the scene, a point is size / 48 (≈ 11.7 px at 560 px). Inside a screen, a point is the screen's scale (2.12 px on iPhone).

**The scene's paper bits** keep `TodayStickers.tsx`'s rule:
- angle_i = 2πi/12, plus 0.2 for odd i and −0.1 for even;
- distance 26 + 8 · (i mod 3) pt;
- colours primary, success, ink, accent in turn.

They are scaled to the sticker. The distance becomes (0.62 + 0.1 · (i mod 3)) · size, and each bit is 0.05 × 0.075 of the size, about the in-app bit's share of a sticker but sized for legibility.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| One VectorCraft source per strip, panels exported as crops | A source per panel per size (offset viewBoxes; 30 sources) | The art is continuous by construction, a seam can never drift, the 6.3" set comes from the same drawing, and there are 4 sources instead of 30 (each `.vectorcraft` is large: outlined glyphs) |
| Baloo 2 outlined by HarfBuzz from the committed subset | Install Baloo 2 into VectorCraft's fonts folder | Reproducible on a clean checkout with no machine setup; the shipped subset is exactly the app's glyph set |
| Inter for the system face, set by VectorCraft | SF Pro (not on this PC; would need a download); Baloo 2 everywhere | Closest open face to SF Pro, bundled with VectorCraft in the three weights the app uses; the owner chose this, stated |
| Screens drawn, not captured | The owner's TestFlight captures | Both languages and both themes on demand, no TestFlight label or ad banner, crisp at 1320 px; the owner chose this |
| A `crops` option in `build.mjs` | A separate export script | `--check` then covers every PNG the store receives, as `ship` does for the app icon |
| A 60-px gutter (0.045 of a panel) | No gutter; the search results' wider gap | It matches the product page's gap, where the strip is seen whole; search shows a slightly wider gap, which the art survives since nothing load-bearing sits in it |
| The real-size landing in the phone, echoed at the scene's scale | Enlarging the in-app burst; a zoomed callout bubble | The phone stays true to the app; the echo uses the same rule (angles, colours) and the world's own sticker, so it reads as the app's moment, not a marketing device |
| The iPad screens as the app draws them (the phone column centred) | An invented iPad layout | Screenshots must show the app as it is; v1.4 has no iPad layout. Flagged to the owner as unverified against a device |
| Stars and a moon in panel 5, suns by day | No sky; a clock or sun-dial motif | The day must read without a clock (the brand forbids one in the art); paper discs in the tokens are enough |

## 6. Verification

- [x] `python -P scripts/art/store-sources.py --check` → "✔ every store source matches the generator".
- [x] `node scripts/art/build.mjs --check` (every job, 137 assets) → "✔ every export matches a clean rebuild from its steps.json", exit 0, after both `build.mjs` changes. It was also run once after the `crops` change alone, before any store art existed.
- [x] Every panel PNG has App Store Connect's exact size and colour type 2 (no alpha): 20 at 1320 × 2868 and 1206 × 2622 (iPhone), 10 at 2064 × 2752 (iPad), English and Turkish (read from each file's IHDR).
- [x] The 6.3" crop's top and bottom rows are ground at 1:1 (`.impeccable/review/store/edge-1206-*.png`; corner pixels page `#FFF6F1` and paper `#FFFDFB`).
- [x] The preview page renders each set as search results, as the product page's carousel and as the whole strip (checked from a local server; the published copy loads the same files).
- [x] The finish review: **fix**, eight material fixes, all applied. The first verdict pass found seven resolved, fix 5 partial, and two regressions (R1, R2). The second pass found R1 and R2 resolved, with no new regressions. Fix 5 is closed by the owner's choice: "Keep today's row visible" (§3.8).
- [x] `node scripts/art/build.mjs --check` after the last change (every job, 137 assets): "✔ every export matches a clean rebuild from its steps.json", exit 0.
- [x] `node scripts/docs/check-docs.mjs` reports 0 errors.
- [x] The owner approves the final set: "Approve the set", 2026-11-02.
- [ ] The owner uploads it in App Store Connect (their action). Upload in panel order, 01 to 05, per language. iPhone 6.9" takes `*-1320x2868.png`, iPhone 6.3" takes `*-1206x2622.png`, and iPad 13" takes `*-2064x2752.png`. Confirm on the upload page which iPhone sizes it asks for (§3.2).

## 7. Related Docs

- [Stage E record](2026-11-01-phase1-stage-e.md): R2, the store listing, and the What's New drafts the captions follow.
- [D5 tutorial record](2026-11-01-phase1-d5-tutorial.md): the bookmark ribbon and the bubble.
- [D5 assets record](2026-11-01-phase1-d5-assets.md): the tour kit's layers and stacking order.
- `docs/architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md`, `0046-display-face-baloo-2.md`, `0047-same-page-mark-and-the-colon-characters.md`, named here without links so their generated backlink blocks stay untouched on this branch.
- `PRODUCT.md`, `DESIGN.md`.
