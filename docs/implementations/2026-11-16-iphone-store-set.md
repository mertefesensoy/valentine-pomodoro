# 2026-11-16 — The iPhone App Store set for 1.5: the iPad set's five close-ups, on iPhone

**Status:** Approved by the owner on 2026-11-16 ("Approve both sets"), after the two changes in §3.7: the partner is Mert, and the Turkish note starts "Seninle gurur duyuyorum". The 20 PNGs in `art/out/store-iphone/` are ready to upload, along with the iPad set rebuilt here (`art/out/store-ipad/`). Uploading is the owner's step. Committed on `feat/iphone-shots` on the owner's "commit open PR wait for CI to green then merge" (2026-11-16), and the pull request is open.
**Branch:** `feat/iphone-shots`, worktree `C:\vp\iphone-shots`, cut from `origin/master` at `d793d6f` (the merge of the approved iPad set, PR #46).
**Parent:** [the iPad 13" set](2026-11-15-ipad-store-set.md) §9, approved on 2026-11-16. This set tells the same story on iPhone.

---

## 0. Steps

| # | Step | State |
|---|------|-------|
| 1 | This plan, written before any drawing | Done |
| 2 | The iPad generator made device-aware; the iPhone generator, job and both strips at both sizes | Done (§3.5, §3.6) |
| 3 | Prove the iPad outputs unchanged: regenerate and rebuild them, then compare bytes | Done (§3.6) |
| 4 | Self-checks; one review sheet per language in `.impeccable/review/iphone/` | Done (§3.6) |
| 5 | The owner's review | Waiting |

**Boundaries:**
- **New files only:** `art/src/store-iphone/`, `art/jobs/store-iphone.json`, and `art/out/store-iphone/` with the prefix `store-iphone15-`, plus their `art/vc` and `art/steps` files.
- **Changes to `scripts/art/store-ipad-sources.py`:** it becomes device-aware, and its own outputs must stay byte-identical (step 3).
- **Never touched:** the 1.4 iPhone set (`art/out/store/store-iphone-*`) and the 1.5 iPad set.

## 1. Problem / Motivation

The owner, 2026-11-16, before submitting 1.5.2: "before i submit i want to update the iphone previews as well".

The live iPhone set is v1.4's "Morning to night". It no longer matches the app:
- 1.5 changed the idle Timer's strip to "Pomo & Doro are ready" with a "Pair with your partner" line;
- the set shows none of 1.5's couple features.

The iPad set now tells 1.5's couple story (the iPad record §9.1). Both stores should tell the same story.

## 2. What Changed

| File | Change |
|------|--------|
| `docs/implementations/2026-11-16-iphone-store-set.md` (new) | This record |
| `docs/README.md` | The index row for this record |
| `scripts/art/store-ipad-sources.py` | Made device-aware with no change to its output:<br>• the composition moves into a `Layout` (`IPAD` holds the old constants);<br>• the screen class gains hooks for another device's sheets (`sheet_frame`, `sheet_width`, `BOTTOM_INSET`, `finish`, `note_lines`);<br>• PartnerDay wraps its row when the page is too narrow, as its `flexWrap` does;<br>• the window check judges only what shows, and a window may be a `{lang: window}`. |
| `scripts/art/store-iphone-sources.py` (new) | The iPhone generator: the `Phone` screen (the iPhone's sheets and home indicator), the `IPHONE` layout, the job and `--check` |
| `art/src/store-iphone/store-iphone15-{en,tr}.svg` (new) | One strip per language: five 1320 × 2868 panels with the 60-px gutter |
| `art/jobs/store-iphone.json` (new) | The job: each panel at 1320 × 2868 and 1206 × 2622 by `rect` + `scale`, and the strip at a fifth of its width |
| `art/vc/store-iphone15-{en,tr}.vectorcraft`, `art/steps/store-iphone15-{en,tr}.steps.json` (new) | The editable sources and the exact command lists |
| `art/out/store-iphone/*` (new) | The strips' SVGs and 1368-px previews, and the 20 panels to upload: `store-iphone15-<lang>-0N-<W>x<H>.png` |
| `.impeccable/review/iphone/*` (git-ignored) | `review_iphone.py` (sizes, colour type, the 6.3" edges, the review sheets), `measure_inter.py` (Inter's ink widths), the review sheets |

## 3. Implementation Approach

### 3.1 Defaults from the approved iPad set

Taken unchanged:
- direction C: frameless close-ups of the screen as die-cut pages, with Pomo & Doro whole and in front of each page, clear of its key content;
- the same five panels in the same order;
- the same captions in English and Turkish;
- the names Deniz and Ekin, the note, and the code K7MP4Q;
- the day's five tones across the seams.

The panel and caption sizes are the 1.4 iPhone set's:
- 1320 × 2868 panels with a 60-px gutter;
- headlines in Baloo 2 SemiBold at 136 px and sublines in Baloo 2 Medium at 54 px, in a 1180-px box;
- the 1206 × 2622 size cut from the same strip by a `rect` 2869.851 pt tall at scale 1206/1320, as v1.4 did (its record §4).

### 3.2 The iPhone's real geometry (code at `d793d6f`, and the owner's device captures)

**The device and the column:**
- 393 × 852 pt, the tab bar at the bottom.
- The page is `min(393, 560) − 2·24 = 345` pt wide.
- The 1.4 generator's vertical plan for the Ring holds:
  - the content's top at 59;
  - the foot 16 pt above the tab bar;
  - the Ring 275 pt.

**Facing pages:**
- The spread is as tall as its rows, centred together with today's row (iPad record §9.4). On iPhone each page is 168.5 pt wide and the stickers are 57 pt.
- This matches the owner's capture `C:/vp/stage-d/.impeccable/review/d1/phone-spread-light-break-b55.png`: the pages at about 143–443 pt, and the presets right below today's row.

**Sheets sized to their content** (the partner sheet, the love note):
- On iOS 26 they float 8.5 pt in from each side and 9 pt above the bottom, with 38-pt corners.
- They are as tall as their content plus the 34-pt bottom safe area (the store-screenshot generator's iPhone convention, from the captures; `phone-modes-sheet-over-spread-light-b55.png` shows the Modes sheet so).
- The dim behind them is black at about 20 %: the capture's page goes from #FFF6F1 to about #CBC4C0.

**The pairing sheet** (`sheetOptions.pair`, a full-height detent):
- It's drawn edge to edge, its top 10 pt under the 59-pt status-bar inset, with 38-pt top corners.
- No capture exists, so this is an assumption.
- In it, the plane scene gets 299 pt and draws at scale 1, and the pinned actions keep the 34-pt bottom inset.

### 3.3 The five panels

Windows are in the screen's points (x, y, width, height). Each panel's scale is the largest that fits the page box, which is at most 1192 px wide and 1852 px tall below the captions (from 960 px down to 56 px above the panel's foot).

| # | Screen drawn (as the iPad set, on iPhone) | Window (pt) | Today's row |
|---|---|---|---|
| 1 | Facing pages, paired: You and Deniz, 25:00, Deniz's day at the right page's foot | 12, 140, 369, 390 | Yes |
| 2 | The pairing sheet's code step over the solo Timer | 0, 63, 393, 761 | No (under the sheet) |
| 3 | The Ring, paired: the third sticker landing, Deniz's strip | 12, 112, 369, 436 | Yes |
| 4 | The partner sheet, with Deniz's strip dimmed just above it (the strip it opens from) | 2, 404, 389, 446 | No (under the sheet) |
| 5 | The note from Deniz, the sheet alone, cut at its own 38-pt corners (§3.4) | English 8.5, 613, 376, 230; Turkish 8.5, 585, 376, 258 | No |

### 3.4 Where the iPhone differs from the iPad defaults

- **Panel 4** shows the partner strip above the sheet, not the Ring's arc. On iPhone the bottom sheet's top meets the strip, so the strip it opens from reads directly.
- **Panel 5 is the note's sheet alone.** The plan showed the spread above it, as the iPad does, but the iPhone's bottom sheet stops below the spread. Its top crosses the presets' row, so the labels "25/5 … Custom" showed cut in half above the sheet (in Turkish, where the note takes two lines). The window is now exactly the sheet, with its own corners, so nothing shows half covered. The cost: this panel doesn't show the Timer behind the note.
- **The note's wrap is measured, not estimated.** At 20 pt the floating sheet gives the note 328 pt. The generator's estimate (0.53 em a character) put the English note at 339 pt and broke "me." onto a second line. VectorCraft draws it in Inter at 308 pt (`measure_inter.py`), so it's one line, as it most likely is on a device. The Turkish note measures 396 pt and takes two lines.
- **PartnerDay wraps on the iPhone's facing page.** The right page leaves 144.5 pt. Four sessions (three stickers, "+1", "100 min today") don't fit, so the row wraps as its `flexWrap` does and the page's foot grows. That happens only in panel 5's screen, outside its window now; panel 1's one session fits. On iPad nothing wraps, and nothing there changed.

### 3.5 The build

**The generators:**
- `scripts/art/store-ipad-sources.py` becomes device-aware:
  - the composition's numbers move into one settings object per set;
  - the screen class takes the device and its sheet geometry.
- Its iPad settings are exactly the old constants, so its outputs don't change.
- `scripts/art/store-iphone-sources.py` (new) holds the iPhone settings, the job, and `--check`.

**The build itself:** `build.mjs art/jobs/store-iphone.json`, in a work folder in this worktree.

**The proof that the iPad outputs are unchanged:**
1. `store-ipad-sources.py --check`;
2. a rebuild of `art/jobs/store-ipad.json` in the work folder;
3. a byte comparison of every PNG and SVG with the committed ones.

### 3.6 Results (2026-11-16)

**Commands:**
1. `python -P scripts/art/store-iphone-sources.py`
2. `VP_ART_WORK=C:/vp/iphone-shots/.impeccable/review/iphone/vcwork node scripts/art/build.mjs art/jobs/store-iphone.json`
3. `python -P .impeccable/review/iphone/review_iphone.py`

**Review sheets:** `.impeccable/review/iphone/review-iphone-en.png` and `review-iphone-tr.png`. Each shows the strip, then panels 1–3 at search size (115 pt each) and 1–4 at product-page size (230 pt each), next to the v1.4 iPhone set. The display sizes are the v1.4 record's estimates.

**Content scale**, against v1.4's 2.12 px/pt, where the 345-pt column took 0.55 of the panel:

| Panel | Scale | What it gives |
|---|---|---|
| 1 and 3 | 3.23 px/pt | The column is 0.84 of the panel |
| 2 (the pairing sheet) | 2.43 px/pt | Its content is 0.66 of the panel; the gain over v1.4 is smallest here, since the full-height sheet is tall |
| 4 (the strip and the partner sheet) | 3.06 px/pt | |
| 5 (the note's sheet) | 3.17 px/pt | |

**The iPad set is unchanged:**
- `store-ipad-sources.py --check` passes after every step of the refactor.
- `build.mjs --check art/jobs/store-ipad.json`, run in a fresh work folder, reports no PNG or SVG different, so all ten panels, both strips' previews and both SVGs rebuild byte for byte.
- It does report the two `.vectorcraft` files and the two `steps.json` files:
  - the `.vectorcraft` files carry VectorCraft 0.23's `/CreationDate` and `/ModDate`, as the iPad record found;
  - the committed `steps.json` files name the work folder they were built in (`C:/vp/ipad-shots/.impeccable/review/ipad/vcwork`), so a rebuild anywhere else differs by that path.
- Neither is a change of output.
- `git status` shows nothing modified under `art/out/store-ipad`, `art/src/store-ipad`, `art/vc` or `art/steps` for the iPad, nor under `art/out/store` (v1.4).

**Self-checks:**
- The generator's checks pass in both languages: every mascot whole inside its panel, in front of its page, and clear of the captions and key content, and nothing cut by a window.
- The checks now judge only what shows: the part of a box inside the window, unless a sheet drawn later hides it. A sheet's own box is a container, not content.
- They still fire after that change. `.impeccable/review/iphone/selfcheck_test.py` gave a panel-3 window ending inside today's row and a 1300-px Pomo on panel 1, and got 5 named failures: the row "cut by the window", and Pomo touching all three caption lines and covering a block. An 800-px Pomo passes; it fits clear of the captions.
- The iPad rebuild compare was run again at the final state, with the same result.
- `review_iphone.py` passes:
  - 20 PNGs, 10 at 1320 × 2868 and 10 at 1206 × 2622, bit depth 8, colour type 2;
  - every 6.3" crop's top and bottom rows are ground.
- `store-iphone-sources.py --check` passes.
- `build.mjs --check art/jobs/store-iphone.json` differs only on the two `.vectorcraft` files' date stamps.
- **Turkish fits:**
  - every headline line is ≤ 726 px at 136 px in the 1180-px box;
  - the sublines are inside the panel;
  - in-screen strings checked at full size: "bugün 25 dk", "Partnerin", "Kodu yazmak için dokun", "Deniz için not yaz", "Bir sonraki odaklanmasının ardından görünür." (274 pt of 312, one line), "Deniz sana yazdı", the two-line note and "Kapat".

**Not drawn truthfully from the code, or assumed:**
- **The pairing sheet's full-height presentation on iPhone:** edge to edge, its top 10 pt under the status bar's inset. No capture shows it.
- **The floating sheets' 8.5 / 9-pt insets, 38-pt corners and 20 % dim:** these come from the owner's iOS 26 captures of the Modes sheet, and are assumed to hold for the partner sheet and the love note.
- **SF Pro is drawn as Inter,** as before. The note's wrap follows Inter's measured width.
- **Today's row** isn't in panels 2, 4 or 5. In 2 and 4 it's under the sheet; in 5 the window is the sheet alone.

### 3.7 The owner's review: two changes (2026-11-16)

The owner, on this set's review sheets: "can we change Deniz to Mert. And the last message should start with "Seninle gurur duyuyorum"". Both changes are made in this set and in the iPad set ([its record](2026-11-15-ipad-store-set.md) §9.9), so the two stores match.

**The changes:**
- **The partner is "Mert"** wherever "Deniz" was, in both languages:
  - the facing page, the partner strip and the partner sheet's title;
  - "Write Mert a note" / "Mert için not yaz";
  - "A note from Mert" / "Mert sana yazdı".

  None of the Turkish strings drawn adds a suffix to the name. "Ekin" and the code stay.
- **The Turkish note is "Seninle gurur duyuyorum. Akşam yemeği benden."** The English note is unchanged.

**How the Turkish note wraps on iPhone:**
- `measure_inter.py` now measures every word-by-word prefix of both notes in VectorCraft's Inter.
- `Phone.note_lines` breaks the note greedily by those widths, as iOS breaks text.
- In the sheet's 328 pt, "Seninle gurur duyuyorum. Akşam" measures 311.0 pt, so the note breaks after "Akşam": "Seninle gurur duyuyorum. Akşam / yemeği benden."
- That break splits "Akşam yemeği". It's what the app would draw if SF Pro's widths are close to Inter's, which is unverified.
- The note is still two lines, so the sheet (224 + 34 pt) and the panel-5 window are unchanged, and Close fits.

**What changed:**
- `scripts/art/store-iphone-sources.py`: `NOTE_INK` became a table of measured lines, and `note_lines` became a greedy wrap.
- The shared `PARTNER` and `NOTE` in `store-ipad-sources.py`.
- Both iPhone strips and all 20 PNGs, rebuilt.
- The iPad outputs listed in its §9.9.

**Checks:**
- The self-checks pass in both sets.
- The break test still gives its 5 named failures.
- 20 iPhone PNGs (1320 × 2868 and 1206 × 2622) and 10 iPad PNGs (2064 × 2752), all colour type 2. The 6.3" edges are ground.
- Both generators' `--check` pass.

**Review sheets** (`.impeccable/review/iphone/`):
- `review-iphone-en.png` and `review-iphone-tr.png`;
- `review-ipad-en.png` and `review-ipad-tr.png`, written by `review_ipad.py`.

## 4. Mathematical / Statistical Details

**The two sizes from one strip** (v1.4's rule, its record §4):
- A panel is W × H = 1320 × 2868. At 6.9" it exports at scale 1.
- For 6.3", s = 1206 / 1320, and the rectangle is h = 2622 / s ≈ 2869.851 pt tall, centred: y = −(h − 2868) / 2 ≈ −0.925.
- The ground runs past the artboard, so the extra 0.93 pt at each edge is ground.

**Content scale:**
- The page box is 1192 × 1852 px (2868 − 960 − 56 tall). A window w × h pt is drawn at s = min(1192 / w, 1852 / h) px per point, and a page shorter than the box is centred in it.
- v1.4's iPhone device drew the screen at about 2.12 px/pt, so the 345-pt column was 0.55 of the panel's width.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Close-ups on iPhone too | The whole phone in a frame, as v1.4 | The same story and look as the approved iPad set, and the column draws about 1.1–1.5× larger than v1.4's 2.12 px/pt; the panels where it gains least are named in §3.6 |
| One generator for both devices | A copy for iPhone | One drawing of each 1.5 screen; the iPad outputs prove it unchanged |
| The iPhone sheets as the device captures show (floating, 8.5 / 9 pt) | Edge to edge | The device captures show iOS 26's floating sheet; the pairing sheet's full-height detent is drawn edge to edge, which no capture shows |

## 6. Verification

- [x] The iPad outputs are byte-identical after the refactor (§3.6): every PNG and SVG. The `.vectorcraft` date stamps and the `steps.json` work-folder paths differ, as explained there.
- [x] The self-checks pass in both languages: every mascot whole and in front, clear of the captions and key content; nothing cut by a window.
- [x] 20 PNGs: 10 at 1320 × 2868 and 10 at 1206 × 2622, colour type 2; the 6.3" edges are ground.
- [x] Turkish fits, checked at full size.
- [x] `check-docs --write` (0 backlink blocks rewritten), then `check-docs`: 190 docs, 0 errors.
- [ ] The owner's review of the set.

## 7. Related Docs

- [The iPad 13" set](2026-11-15-ipad-store-set.md), whose story and drafts this set repeats.
- [v1.4 App Store screenshots](2026-11-01-app-store-screenshots.md), the iPhone set this replaces, and its pipeline.
