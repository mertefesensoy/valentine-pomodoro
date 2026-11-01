---
id: IMPL-2026-11-01-app-store-screenshots
title: "v1.4 App Store screenshots: a Pomo & Doro triptych, drawn in VectorCraft"
status: in-progress
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-11-01-phase1-stage-e, IMPL-2026-11-01-phase1-d5-tutorial, IMPL-2026-11-01-phase1-d5-assets]
---

# 2026-11-01 — v1.4 App Store screenshots: a Pomo & Doro triptych, drawn in VectorCraft

**Status:** Plan, written before any art. The brief is confirmed by the owner (§3.1); the composition round is next.
**Branch:** `phase1/app-store-shots`, worktree `C:\vp\stage-shots`, cut from `phase1/stage-d` at `aabc4e1`. Commits use `git commit -- <paths>`. No push, no merge, no EAS build and no App Store Connect action without the owner's explicit word.
**Parent:** the Stage E record's step R2, "screenshots of the redesign" ([Stage E](2026-11-01-phase1-stage-e.md) §3.4).

---

## 0. Steps

| # | Step | State |
|---|------|-------|
| 1 | Orientation: the pipeline probe (§3.2) | Done |
| 2 | Shape the brief: panels, captions, devices, how screens are made | **Confirmed by the owner, 2026-11-01** ("Confirm the brief") |
| 3 | This plan, committed before any art | This commit |
| 4 | Composition round: `concept-seed --scope surface --mode persuade`, a decision page of strip sketches, the owner's pick | Next |
| 5 | The direction contract in the surface brief, approved by the owner | |
| 6 | The build: the generator, the strip sources, `build.mjs` crops, the PNGs | |
| 7 | The preview page (the carousel as the store shows it), the finish review, the owner's approval of the final set | |
| 8 | Commit the sources and PNGs; this record and memory brought up to date | |

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

Planned; the table becomes the record of what changed as the build lands.

| File | Change |
|------|--------|
| `scripts/art/store-sources.py` (new) | The generator: writes every strip source, the job, and the crop table from constants, the shipped tokens and the shipped art; `--check` regenerates in memory and compares |
| `art/src/store/*.svg` (new) | One source per strip: iPhone and iPad, English and Turkish |
| `art/jobs/store.json` (new) | The job: each strip's asset and its panel crops at every App Store size |
| `scripts/art/build.mjs` | A `crops` option: export named rectangles of the artboard as PNGs at a given pixel width. Backward compatible: jobs without it produce identical steps |
| `art/vc/store-*.vectorcraft`, `art/steps/store-*.steps.json`, `art/out/store/*` (new) | The pipeline's outputs: the editable sources, the command lists, the strips' SVGs and the panel PNGs |
| `art/review/store-preview.html` (new) | The preview page: the set as search results and the product page show it, in both languages |
| `.impeccable/surfaces/<store>.md` (new) | The surface brief: the brief, then the direction contract |
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
- **Demo data** is authored, realistic and labelled synthetic in this record: today's stickers, a 50-minute goal, a week of postcards, the default love notes (`src/constants/defaults.ts`, with their emoji left out of the art).
- **The app's public name stays off the art,** because it is undecided (PRODUCT.md). The store prints the name beside the screenshots anyway.

### 3.2 The pipeline, proved first (2026-11-01, `vectorcraft-cli 0.18.0`)

A throwaway probe (deleted, never committed) settled what the build can rely on:

- **Exact sizes, no alpha.** A 1320 × 2868 artboard with a full-bleed ground exports a 1320 × 2868 PNG of colour type 2 (RGB). App Store Connect refuses images with an alpha channel.
- **Byte-identical rebuilds.** `build.mjs --check` passed on the probe's second run.
- **One strip, cropped per panel.** `document.export` with `rect: [x, y, w, h]` and `scale` exports any rectangle of the artboard. At scale 1, a 1320-wide rect gives 1320 × 2868; at scale 1206 / 1320 with a rect 2869.85 pt tall, it gives exactly 1206 × 2622. So each strip is **one** VectorCraft source, the art is continuous by construction, and every panel at every size is a crop of it.
- **Text.** Baloo 2 isn't installed in VectorCraft, so the generator outlines it with HarfBuzz (`uharfbuzz 0.57.0`, `fontTools 4.61.0`) from the committed `assets/fonts/Baloo2-SemiBold.ttf` and `Baloo2-Medium.ttf`: kerning and Turkish letters shaped properly, paths written into the source. The app's system face (SF Pro) isn't on this machine; **Inter**, which VectorCraft bundles in Regular, Medium and SemiBold (SF Pro's three weights in the app), stands in for it as live text that VectorCraft sets. The owner chose drawn screens with this substitution stated.
- **Sizes** (Apple's "Screenshot specifications" page, read 2026-11-01): "iPhone with Dynamic Island (large display)" takes 1320 × 2868; the page names "Dynamic Island (medium display)" (1206 × 2622) as the required iPhone set; iPad 13" (2064 × 2752) is required because the app supports iPad (`supportsTablet: true`). PNG or JPEG, no alpha, up to 10 per size. The owner confirms in App Store Connect's upload page.

### 3.3 The build (to be written at step 6)

- **The generator** (`scripts/art/store-sources.py`, Python because HarfBuzz is there) is a pure function of its constants, the tokens in `src/theme/palette.json`, the fonts and the shipped art files, so `--check` is byte-exact. It reuses the shipped kit by inlining it: Pomo & Doro's poses (`art/src/mascots/`), the tour kit's 44 layers (`art/src/tour/`, stacked in `expressions.json`'s order with the three-layer lift drawn from the body-cut), the Same Page mark, and the bookmark ribbon (rebuilt from `Ribbon.tsx`'s band, edge and swallowtail).
- **The screens** are drawn from the shipped tokens and layouts (DESIGN.md; the owner's device captures in `.impeccable/review/` serve only as references for geometry).
- **The strips:** five panels side by side with a fixed gutter between them, so art that crosses a seam continues behind the store's own gap. The gutter and the composition come from the direction contract.

## 4. Mathematical / Statistical Details

**Panel crops.** A strip has N = 5 panels of width W = 1320 and height H = 2868 (iPhone), separated by a gutter g (fixed by the contract). Panel i (0-based) is the rectangle x_i = i · (W + g), y = 0, width W, height H, exported at scale 1.

**The 6.3" set from the same strip.** Its target is 1206 × 2622. Scaling by s = 1206 / 1320 ≈ 0.913636 gives a width of exactly 1206 px but a height of 2868 · s ≈ 2620.31 px. So the crop's rectangle is taller than the artboard: height h = 2622 / s ≈ 2869.851 pt, centred on the panel, y = −(h − 2868) / 2 ≈ −0.925 pt. The ground runs past the artboard's top and bottom, so the extra 0.93 pt at each edge is ground, and nothing visible moves by more than one pixel.

**Caption legibility at thumbnail size.** In search results, three panels share roughly the width of an iPhone screen (about 390 pt), so a 1320-px panel shows about 120 pt wide, a factor of about 0.09. A caption meant to read there at 11 pt or more needs a cap height of about 11 / 0.09 ≈ 120 px in the panel; the build checks the captions against this.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| One VectorCraft source per strip, panels exported as crops | A source per panel per size (offset viewBoxes; 30 sources) | The art is continuous by construction, a seam can never drift, the 6.3" set comes from the same drawing, and there are 4 sources instead of 30 (each `.vectorcraft` is large: outlined glyphs) |
| Baloo 2 outlined by HarfBuzz from the committed subset | Install Baloo 2 into VectorCraft's fonts folder | Reproducible on a clean checkout with no machine setup; the shipped subset is exactly the app's glyph set |
| Inter for the system face, set by VectorCraft | SF Pro (not on this PC; would need a download); Baloo 2 everywhere | Closest open face to SF Pro, bundled with VectorCraft in the three weights the app uses; the owner chose this, stated |
| Screens drawn, not captured | The owner's TestFlight captures | Both languages and both themes on demand, no TestFlight label or ad banner, crisp at 1320 px; the owner chose this |
| A `crops` option in `build.mjs` | A separate export script | `--check` then covers every PNG the store receives, as `ship` does for the app icon |

## 6. Verification

- [ ] `python -P scripts/art/store-sources.py --check` regenerates every source byte for byte.
- [ ] `node scripts/art/build.mjs --check` passes for **every** job (the `crops` change leaves the other jobs' steps untouched).
- [ ] Every PNG has App Store Connect's exact size and colour type 2 (no alpha): 1320 × 2868 and 1206 × 2622 (iPhone), 2064 × 2752 (iPad), English and Turkish.
- [ ] The preview page shows each set as search results and as the product page's carousel, with the store's gaps.
- [ ] `node scripts/docs/check-docs.mjs` reports 0 errors.
- [ ] The owner approves the final set (step 7) and uploads it (their action).

## 7. Related Docs

- [Stage E record](2026-11-01-phase1-stage-e.md): R2, the store listing, and the What's New drafts the captions follow.
- [D5 tutorial record](2026-11-01-phase1-d5-tutorial.md): the bookmark ribbon and the bubble.
- [D5 assets record](2026-11-01-phase1-d5-assets.md): the tour kit's layers and stacking order.
- `docs/architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md`, `0046-display-face-baloo-2.md`, `0047-same-page-mark-and-the-colon-characters.md`, named here without links so their generated backlink blocks stay untouched on this branch.
- `PRODUCT.md`, `DESIGN.md`.
