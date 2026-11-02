---
id: IMPL-2026-11-02-app-store-creative-assets
title: "v1.4 App Store creative assets: a looping Header and Search Results video, drawn in VectorCraft"
status: in-progress
date: 2026-11-02
owner: Mert Efe Şensoy
related: [IMPL-2026-11-01-app-store-screenshots, IMPL-2026-11-01-phase1-stage-e]
---

# 2026-11-02 — v1.4 App Store creative assets: a looping Header and Search Results video

**Status:** Plan, written before any frame. The owner's answers are in §1; the composition round is next.
**Branch:** `phase1/app-store-shots`, worktree `C:\vp\stage-shots`, after the screenshots (`8b12e2b`). Commits use `git commit -- <paths>`. No push, no merge, no App Store Connect action without the owner's word; uploading is the owner's step.
**Parent:** the [screenshots record](2026-11-01-app-store-screenshots.md) ("Morning to night"), whose scene and kit this reuses. It's on the release's critical path: the owner holds 1.4.0's submission for these ("Hold 1.4.0 for them").

---

## 0. Steps

| # | Step | State |
|---|------|-------|
| 1 | Orientation: render and encode probes (§3.2) | Done |
| 2 | The words decision (§1) | **The owner, 2026-11-02: "Wordless, no phone screen"** |
| 3 | This plan, committed before any frame | This commit |
| 4 | Composition round: stills of the scene in both framings; the owner picks; ask about sound | Next |
| 5 | The motion: the generator, the frames, the encode, the universal still | |
| 6 | The check script; the preview page; the owner's approval | |
| 7 | Commit; this record and memory brought up to date | |

**Boundaries.** As for the screenshots:
- **Changes only:** `art/` (new `art/src/creative/`, the creative job and its outputs), `scripts/art/` (a new generator and check), `art/review/creative-*`, and this record.
- **No:** app code, shared docs, or `check-docs --write`.
- **Rendered frames** live in the work folder and are never committed.

## 1. Problem / Motivation

iOS 27 adds two optional creative assets to the App Store:
- **The product page header,** a banner at the top of the product page.
- **The search results asset,** which, when set, replaces the screenshots in search results.

Both may be videos, which loop forever: search videos always muted, header videos muted until unmuted. Both show only on iOS 27 and iPadOS 27 and later. The owner asked for "special Header and Search Result designs" and wrote "If we make it as a video it would be even better".

**The owner's answers (2026-11-02, relayed by the main session, verbatim):**
- **Format:** "Looping videos (Recommended)". Two short silent loops cut from one scene, with a still of the same scene as the backup.
- **Text:** "No text (Recommended)". No words on any asset, so one set serves EN and TR.
- **Search:** "The timer in use (Recommended)". The search asset alone has to show the app working: the Ring, a sticker pressing onto today's page, Pomo & Doro.
- **Timing:** "Hold 1.4.0 for them". The assets go on the 1.4.0 version page (Product Page Information > Header and Search Results).

**The words decision (asked in this session, 2026-11-02).**
- **The conflict:** the app's running screen always carries words: the phase line, "Break at …" inside the Ring or the Facing pages frame, "Today", the buttons, the tabs. So a search video can't show the real interface and have no words.
- **Offered:** a search video per language, one English video for all, or the interface's pieces drawn wordless with no phone screen.
- **The owner: "Wordless, no phone screen".** The Ring, today's stickers and Pomo & Doro are drawn as large paper pieces in the app's own geometry, with no screen and no words, one set for every storefront.
- **The cost, stated in the option they picked:**
  - it is not the literal interface;
  - it sits close to the brand rule against a timer ring in the art (PRODUCT.md, ADR-0047). That rule is about the category's clock and ring clichés in the mark and illustration; here the Ring is the app's own UI component, drawn to its code.
  - The owner's choice settles it for these assets.
- **Localization:** whether App Store Connect takes creative assets per language isn't in Apple's documentation (read 2026-11-02). With no words, it doesn't matter.

**Apple's specifications** ("Creative assets specifications" and "Manage your App Store assets", read 2026-11-02):

| Asset | Size | Frame rate, length | Files |
|---|---|---|---|
| Header video | 21:9, 3840 × 1646 | 30 or 60 fps, 5–30 s | .mov, .m4v, .mp4 |
| Search results video | 3:2, 1920 × 1280 to 3840 × 2560 | 30 or 60 fps, 5–30 s | .mov, .m4v, .mp4 |
| Header image | 21:9, 3840 × 1646 | | .jpeg, .jpg, .png |
| Search results image | 3:2, 1920 × 1280 to 3840 × 2560 | | .jpeg, .jpg, .png |
| Universal image (both placements) | 16:9, 5244 × 2950 | | .png |

- Images take no alpha.
- A universal asset can serve both placements ("Use header asset in search results"); there is no universal video.
- Each video asset has one poster frame, set in Asset Library and used everywhere the asset is.

**Apple's guidance** (App Store asset best practices):
- The header carries one clear idea for a first-time visitor.
- Search makes the purpose obvious at a glance.
- For video: a poster frame that works alone, lead with the value, no quick cuts or fast motion, a seamless loop, assume no sound.
- Don'ts: no prices, URLs, © symbols, awards, other platforms, marketplaces or Apple recognitions; 4+ content; focal points centred and legible.
- The safe areas are "defined in each template". The templates are downloads that need the owner's OK, so until then the safe areas are derived (§4).
- Whether the product page draws the icon, name or Get button over the header is undocumented. App Store Connect's Preview (iPhone and iPad, both orientations, both languages) is the only real iOS 27 render, so the owner checks there before submitting.

## 2. What Changed

Planned; this becomes the record of what changed.

| File | Change |
|------|--------|
| `scripts/art/creative-sources.py` (new) | The generator. It writes the scene at any time t (a frame) for each composition, the universal still's source and the stills' job. It reuses the screenshots' kit (`store-sources.py`), imported, not copied |
| `scripts/art/creative-build.py` (new) | Renders every frame with VectorCraft in batches in the work folder and encodes the loops with ffmpeg |
| `scripts/art/creative-check.py` (new) | The check, described in §6 |
| `art/src/creative/*.svg`, `art/jobs/creative.json`, `art/vc`, `art/steps`, `art/out/creative/*` (new) | The universal still and the poster stills through `build.mjs` (byte-checked like all art); the two .mp4 loops |
| `art/review/creative-preview.html` (new) | The preview page: each loop in its placement's frame, the stills, the poster frames |
| `.impeccable/surfaces/scripts-art-creative-sources-py.md` (new) | The surface brief and its direction contract |

## 3. Implementation Approach

### 3.1 One scene, two compositions

"Cut from one scene" can't mean one master cropped twice. The 21:9 and 3:2 crops of a 16:9 master share its centre (84 % of the width by 76 % of the height), so whatever leads the search crop would lead the header too. So the generator draws **one scene, twice, at the same instant**:
- the same day;
- the same cut-paper ground, hill and sky;
- the same Pomo & Doro on the same clock;
- each framing composed for its placement.

The universal still is a third framing of the same scene at one instant.

- **Header (21:9):** one clear idea, Pomo & Doro's study day. The pair at the centre live through one day as the cut-paper ground turns from Strawberry Milk morning to Midnight Plum night and back to morning. No interface.
- **Search (3:2):** the timer in use, wordless. A large paper Ring in the app's geometry, its focus arc sweeping and its Baloo 2 digits counting down. Under it, today's row of cells, where each finished focus presses a sticker on with the app's placement move. Pomo & Doro beside them, focusing, then celebrating.

### 3.2 The loop and its seam

- **One day is one loop.** Sessions finish and their stickers press onto today's row. At night today's page turns, and the next morning's row is empty again, as the app's day resets.
- **That makes frame N equal frame 0 by construction:** the scene is a pure function of t mod T. The frames rendered are 0 … N−1 (N = T · 30), so the loop has no repeated frame at its seam; `creative-check.py` renders frame N and checks it equals frame 0.
- **Pace** (Apple: no quick cuts or fast motion):
  - no cuts at all, one continuous shot per placement;
  - each ring sweep and each sticker landing slow enough to read. The plan is about 12–16 s per loop at 30 fps, set at the composition round.
- **Motion comes from the app's own numbers:**
  - the sticker's placement: drop from 16 pt, scale 1.35, −10°, a 450 ms spring at damping 0.75, and 12 paper bits over 600 ms (`TodayStickers.tsx`);
  - the tour kit's blink, breath, squash and wave (`art/src/tour/expressions.json` `motion`, as `tour-motion.js` plays them), sampled per frame;
  - the Ring's arc, stroke and caps from `PhaseRing.tsx` and the screenshots' geometry.

### 3.3 The pipeline

Probed 2026-11-02 with `vectorcraft-cli 0.18.0` and `ffmpeg 8.1.1-full_build`:
- **No animation mode exists** in VectorCraft or `build.mjs`. So a frame is an SVG written by the generator and rendered by VectorCraft.
- **Batching:** one CLI run opens, exports and closes many documents (`file.open`, `document.export`, `file.close`). A 3840 × 1646 frame of the screenshots' weight renders in about 0.4 s, colour type 2 (RGB, no alpha). About 800 frames for both loops is about 6 minutes.
- **Encoding:**
  - `libx264`, `-pix_fmt yuv420p -r 30`;
  - BT.709 tagged on the frames themselves (`-vf scale=out_color_matrix=bt709:out_range=tv,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709`): ffmpeg's default RGB→YUV matrix is BT.601, and the PNGs' sRGB chunk would otherwise set the transfer;
  - `-movflags +faststart`.
- **Reproducibility:** `-threads 1 -fflags +bitexact -flags:v +bitexact -map_metadata -1` makes the encode reproducible byte for byte (two encodes compared identical).
- **What gets committed:** the generator, the scripts, the two .mp4 loops, the universal 5244 × 2950 PNG still and the poster stills (through `build.mjs`), and this record. The frames stay in the work folder.

## 4. Mathematical / Statistical Details

**Derived safe area** (until Apple's templates are downloaded with the owner's OK):
- A 16:9 frame of width W cropped to 21:9 keeps its full width. The crop is W · 9/21 tall against the frame's W · 9/16, so it keeps the centre 16/21 ≈ 76.2 % of the height.
- Cropped to 3:2, it keeps its full height and (3/2) / (16/9) = 27/32 ≈ 84.4 % of its width.
- The universal still keeps its focal point inside both: the centre 84.4 % × 76.2 %.

**Frames.** N = T · f with f = 30 fps. Frame k shows the scene at t_k = k / f; frame N would show t = T ≡ 0.

**The placement spring.** The app's spring has a duration of 450 ms and a damping ratio of ζ = 0.75. It is sampled as an underdamped oscillator: x(t) = 1 − e^(−ζω t) (cos ω_d t + (ζω/ω_d) sin ω_d t), with ω_d = ω √(1 − ζ²) and ω chosen so the motion settles in 450 ms. The overshoot, e^(−πζ/√(1−ζ²)) ≈ 2.8 %, matches DESIGN.md.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Wordless search, the interface's pieces drawn as paper | A search video per language; one English video | **The owner's choice** (§1) |
| One scene drawn twice, at the same instant | One 16:9 master cropped to 21:9 and 3:2 | A crop would put the search's focal point in the header too; two compositions on one clock keep "one scene" true and each placement clear |
| A day as the loop | A single session (a sticker can't un-land); a sliding row of cells | The app's day really resets, so the seam is true to the app |
| VectorCraft frames, ffmpeg x264, bitexact | A browser capture of an animated SVG | Only the VectorCraft pipeline makes the vectors (ADR-0027); the probes show it's fast enough and reproducible |
| Silent by default | A soft loop | Search videos are always muted; whether the header gets a SoundCraft loop is the owner's call at the composition round |

## 6. Verification

- [ ] `python -P scripts/art/creative-check.py` passes:
  - each .mp4's codec, exact size, 30 fps, length within 5–30 s, yuv420p, BT.709 tags;
  - the seam (frame N's source equals frame 0's, and the decoded last frame continues into the first);
  - no alpha in any still;
  - the sources carry no text (no `<text>`, and no glyph outlines but the timer's digits);
  - none of Apple's don'ts.
- [ ] `--rebuild` re-renders and re-encodes, and compares the .mp4s byte for byte.
- [ ] `node scripts/art/build.mjs --check` passes for every job, the creative stills included.
- [ ] `node scripts/docs/check-docs.mjs` reports 0 errors.
- [ ] The owner approves the loops and stills.
- [ ] The owner checks App Store Connect's Preview on iPhone and iPad before submitting (their action).

## 7. Related Docs

- [Screenshots record](2026-11-01-app-store-screenshots.md): the scene, the kit, the pipeline.
- [Stage E record](2026-11-01-phase1-stage-e.md): the release steps these hold.
- `docs/architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md`, `0047-same-page-mark-and-the-colon-characters.md`, named without links so their generated backlink blocks stay untouched.
