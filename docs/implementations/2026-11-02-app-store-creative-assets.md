---
id: IMPL-2026-11-02-app-store-creative-assets
title: "v1.4 App Store creative assets: a looping Header and Search Results video, drawn in VectorCraft"
status: done
date: 2026-11-02
owner: Mert Efe Şensoy
related: [IMPL-2026-11-01-app-store-screenshots, IMPL-2026-11-01-phase1-stage-e]
---

# 2026-11-02 — v1.4 App Store creative assets: a looping Header and Search Results video

**Status:** Done. The owner approved the header ("Header is good and approved") and, after the decoder fix (§3.7), search ("Clean, approve search"), 2026-11-02. The plan (§0–§1) was committed before any frame (`b9f9f26`). Uploading in App Store Connect, setting the poster frames and checking its Preview are the owner's steps.
**Branch:** `phase1/app-store-shots`, worktree `C:\vp\stage-shots`, after the screenshots (`8b12e2b`). Commits use `git commit -- <paths>`. No push, no merge, no App Store Connect action without the owner's word; uploading is the owner's step.
**Parent:** the [screenshots record](2026-11-01-app-store-screenshots.md) ("Morning to night"), whose scene and kit this reuses. It's on the release's critical path: the owner holds 1.4.0's submission for these ("Hold 1.4.0 for them").

---

## 0. Steps

| # | Step | State |
|---|------|-------|
| 1 | Orientation: render and encode probes (§3.2) | Done |
| 2 | The words decision (§1) | **The owner, 2026-11-02: "Wordless, no phone screen"** |
| 3 | This plan, committed before any frame | This commit |
| 4 | Composition round: stills of the scene in both framings; the owner picks; ask about sound | Round 1, 2026-11-02: header "Keep the day pan (Recommended)", sound "Silent (Recommended)"; for search the owner asked "Show me all three concepts then i will choose which to build", so the three search concepts are shown as low-resolution loops, with the header's lockup and iPhone framing (the correction above) |
| 5 | The motion: the generator, the frames, the encode, the universal still | Done (§3.4–3.6). Round 2 answers the owner's header note: bigger mascots on one body each, and the flick hunt |
| 6 | The check script; the finish review; the preview page; the owner's approval | Done. The finish review returned "ship after fixes", all applied (§3.5). The owner approved both loops and the stills (§3.7). The private preview is https://claude.ai/artifact/VudA33Lcot17AB8XY1c9AG |
| 7 | Commit; this record and memory brought up to date | This commit |

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

**The correction (relayed by the main session, 2026-11-02, on the owner's word):**
- **No screens in either asset.** The owner looked at Apple's own header examples, which are illustrations with the app's name, and wrote: "look at the examples they are not the screen itself so why should we".
  - Both assets are illustrations in the Sticker Diary world.
  - The search asset makes its purpose obvious through content: the Ring as an illustrated object, a sticker pressing onto the page, Pomo & Doro.
- **A wordmark on the header only.** The owner chose "Header only (Recommended)": the Valentine Pomodoro lockup from the brand kit, centred over the scene.
  - The search asset stays wordless. The name reads the same in English and Turkish, so one set still serves both.
  - The lockup is the brand kit's current choice-C drawing (`rehaul/v2` `brand/svg`, `4471c22`), copied unchanged to `art/src/creative/brand-horizontal-{colour,reversed}.svg` (SHA-256 `a5668744…`, `63583d7b…`); `rehaul/v2` isn't merged.
- **The iPhone portrait layout,** the main session's estimate from Apple's examples, to be checked in App Store Connect's Preview:
  - The header runs under the status bar.
  - The back and share buttons cover about the top 40 % at its corners.
  - The visible slice is about 1.5 : 1, the centre ~65 % of the 21:9 width; the outer ~18 % on each side shows only on iPad and in landscape.
  - The icon, name and Get button sit below the header.
  - So the lockup and the pair stay inside the centre ~60 %, below the buttons.

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

| File | Change |
|------|--------|
| `scripts/art/creative-sources.py` (new) | The generator. It draws the scene at any time t for each composition (`frame_svg`), and writes the stills' sources and job. Inside it: the day script, the characters on the tour kit's layers, the wordless Ring and today's row, the cut-paper ground and the lockup. It imports the screenshots' kit (`store-sources.py`) rather than copying it |
| `scripts/art/creative-build.py` (new) | Renders frames 0 … N−1 with VectorCraft in batches of 60 in the work folder, then encodes a loop with ffmpeg (§3.3) |
| `scripts/art/creative-check.py` (new) | The check (§6): the loops' format, their motion decoded (flicks and the seam), no words, the stills' sizes and no alpha, and with `--rebuild` a byte-for-byte rebuild |
| `scripts/art/review-creative.mjs` (new) | Writes the preview page from the shipped files and the generator's poster times |
| `art/src/creative/brand-horizontal-{colour,reversed}.svg` (new) | The brand kit's horizontal lockup, copied unchanged from `rehaul/v2` (§1) |
| `art/src/creative/creative-{header,search,universal}.svg`, `art/jobs/creative.json`, `art/vc/creative-*.vectorcraft`, `art/steps/creative-*.steps.json` (new) | The three stills' sources, job, documents and steps, built by `build.mjs` and byte-checked like all art |
| `art/out/creative/` (new) | `creative-header.mp4` (21:9, 3840 × 1646) and `creative-search.mp4` (3:2, 3456 × 2304), the loops; `creative-header-3840x1646.png`, `creative-search-3840x2560.png` and `creative-universal-5244x2950.png`, the stills; and their SVG exports |
| `art/review/creative-preview.html` (new) | The preview page: the header full width and as an iPhone slice, the search loop in a result card, the stills with their poster times, and the App Store Connect steps |
| `.impeccable/surfaces/scripts-art-creative-sources-py.md` (new) | The surface brief and its direction contract |
| This record | The plan, then the record of the build |

## 3. Implementation Approach

### 3.1 One scene, two compositions

"Cut from one scene" can't mean one master cropped twice. The 21:9 and 3:2 crops of a 16:9 master share its centre (84 % of the width by 76 % of the height), so whatever leads the search crop would lead the header too. So the generator draws **one scene, twice, at the same instant**:
- the same day;
- the same cut-paper ground, hill and sky;
- the same Pomo & Doro on the same clock;
- each framing composed for its placement.

The universal still is a third framing of the same scene at one instant.

- **Header (21:9):** one clear idea, Pomo & Doro's study day, under the name. The pair at the centre live through one day as the cut-paper ground turns from Strawberry Milk morning to Midnight Plum night and back to morning. No interface.
  - The horizontal lockup sits at 47.7 % of the height (its top at 42 %), below the iPhone's buttons, where Apple's examples set their titles.
  - It is drawn inside each band of the day, colour by day and reversed at night, so the cut that brings the night recolours it as it passes.
  - Its clear space (a quarter of the mark's height) stays free; the pair stand under it, inside the centre 60 %.
- **Search (3:2):** the timer in use, wordless. A large paper Ring in the app's geometry, its focus arc sweeping and its Baloo 2 digits counting down. Under it, today's row of cells, where each finished focus presses a sticker on with the app's placement move. Pomo & Doro beside them, focusing, then celebrating.

### 3.2 The loop and its seam

- **One day is one loop.** Sessions finish and their stickers press onto today's row. At night today's page turns, and the next morning's row is empty again, as the app's day resets.
- **That makes frame N equal frame 0 by construction:** the scene is a pure function of t mod T. The frames rendered are 0 … N−1 (N = T · 30), so the loop has no repeated frame at its seam; `creative-check.py` renders frame N and checks it equals frame 0.
- **Pace** (Apple: no quick cuts or fast motion):
  - no cuts at all, one continuous shot per placement;
  - each ring sweep and each sticker landing slow enough to read. The plan is about 12–16 s per loop at 30 fps, set at the composition round.
- **Motion comes from the app's own numbers:**
  - the sticker's placement: drop from 16 pt, scale 1.35, −10°, a 450 ms spring at damping 0.75, and 12 paper bits over 600 ms (`TodayStickers.tsx`);
  - the tour kit's blink, breath, squash and wave (`art/src/tour/expressions.json` `motion`, as `tour-motion.js` plays them), sampled per frame. Two adjustments for the loop: the breath periods are rounded to divide T (§4), and the change plays over 450 ms for 30 fps (§3.5);
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
- **Decoder limits** (found at the owner's review, §3.7):
  - At 3840 × 2560, an H.264 frame is 38,400 macroblocks, past level 5.2's 36,864, so x264 labels it level 6.0.
  - The GPU decoders that browsers and phones use stop at level 5.2 and 4096 × 2304. They garble such a stream.
  - So the search loop is drawn at 3456 × 2304 (`LOOP_SCALE`, level 5.1). That is the largest 3:2 frame they all take, inside Apple's 1920 × 1280 to 3840 × 2560.
  - The header, 3840 × 1646, is level 5.1 as it is.
  - The stills stay at full size; images have no such limit.
  - `creative-check.py` fails any loop above level 5.2 or 4096 × 2304.
- **What gets committed:** the generator, the scripts, the two .mp4 loops, the universal 5244 × 2950 PNG still and the poster stills (through `build.mjs`), and this record. The frames stay in the work folder.

### 3.4 The composition round

**Round 1** showed the header's day pan and three search concepts as low-resolution loops, with the header's lockup and its iPhone slice drawn on (the correction in §1):
- A, a diary spread;
- B, die-cut stickers;
- C, one page.

The owner chose "Keep the day pan (Recommended)", "Silent (Recommended)" and, for search, "B: die-cut stickers (Recommended)". Their header note was "Make the mascots bigger and make sure they don't flick so you need to make the animations more fun and smoother".

**The loop as built** (T = 20 s, 600 frames at 30 fps; the times are seconds into the loop):

| Time | Search | Header (the same clock) |
|---|---|---|
| 0.6–3.4, 4.2–7.0, 7.8–10.6, 11.4–14.2 | A 25-minute focus sweeps the Ring (eased), its readout stepping 25:00, 20:00 … 00:00. Each step crossfades only the digits that change. Its sticker presses onto today's row with the app's spring and 12 bits. The Ring holds 00:00 for 0.65 s, then fades as 25:00 comes back | The pair study (a pencil, eyes toward the middle, a gentle sway), then hop and celebrate as each sticker lands. Doro hops lower than Pomo |
| 14.6 | The goal: a round die-cut goal sticker slaps over the row's end, with the placement move and its bits | The goal's hop: longer and higher, with a hand up (the cheer) |
| 15.6–18.8 | | They sleep: eyes shut, a deeper breath, Zz drifting up |
| 17.6–18.6 | Today's page turns; the next morning's row is empty | |
| 18.8–19.95 | | They wake: a stretch, then a wave hello (the kit's 2.5 swings) |
| Throughout | The ground pans one band every 4 s, edges crossing the middle at 3.8 + 4j: morning, noon, afternoon, dusk, night, then morning again | The same; the lockup is drawn inside each band, colour by day and reversed at dusk and night |

Doro answers 0.12 s after Pomo throughout.

### 3.5 The characters: one body, no flicks

The owner's note set the bar. In round 1's header, Pomo & Doro changed looks by crossfading whole poses, and they flicked:
- the shipped focusing body and the tour's excited body differ;
- mid-fade, two lifts overlapped.

Rebuilt for round 2:
- **Bigger:** 640 px on the header (the pair at the middle ± 370, inside the centre 60 %), 820 px in search.
- **One body each.** Every look is built from the same tour-kit layers (body cut, hand, body fill, eyes, mouth). A change only crosses the face over, in the kit's face-out and face-in windows. Accessories fade:
  - the focusing pose's pencil, cut from its paths;
  - the sleepy pose's Zz;
  - the wave hand, grown from its root.
  - So the body and its lift never swap.
- **More fun, still smooth:**
  - a celebration hop on every landing: anticipation, stretch, air, landing squash, rebound (`HOP_KEYS`), eased between keys;
  - the kit's change squash is skipped while hopping, so two squashes never stack;
  - a 1.6° sway while studying;
  - a deeper breath asleep;
  - a waking stretch before the wave.

**The flick hunt.** A motion scan of the decoded loops (§6) found jumps no still could show, each now fixed:

| Flick | Cause | Fix |
|---|---|---|
| The breath twitched about once a second | The kit's number format keeps two decimals, so a ±1.2 % breath had only three sizes: 1 % steps, about 6 px on a 640-px character | Moving scales and angles are written to four places (`f4`) |
| The landing sticker's settle stepped | The kit's `sticker()` rounds its scale to two places, which is 2.5 % of a sticker this size | The placement is one outer transform at four places. It moves the lift too, as the app's `Animated.View` does |
| The Zz popped in mid-sleep | Each 1.6-s drift restarted at full opacity | Each drift fades in as well as out |
| The pair's edge and lift switched at 15.4 s and 18.9 s | The night tokens were on or off | The tokens blend over 0.5 s (`mix`, `night_at`) |
| The wave hand jumped 2° at its start and end | The swing runs about −2°, but out of range the angle was 0° | The hand rests at the swing's middle |
| The hand popped in and out | It grew from 40 % of its size | It grows from nothing |
| At the seam, Doro's raised hand vanished | Doro's lag carries the wave past T, but its timing didn't wrap | The wave's clock wraps (`dawn`) |
| At the seam, every cut changed its lean | A day on, the world has moved five bands. The tone (j mod 5) matched, but the lean alternated by j mod 2, and five is odd | Each hour has its own cut (`LEANS[j mod 5]`); the night comes in on a straight slash |
| Each look change jolted | The kit's change squashes 8 % in 70 ms. That is smooth at the app's 120 Hz, but two frames at 30 fps | In the video the change (squash and face crossover) takes 450 ms, the app's placement-spring length (`CHANGE`) |
| The wake jolted | The change squash and the waking stretch started together | One squash at a time: the change into the wave skips its squash, so the stretch carries the wake |
| The hop's landing snapped | A 6 % landing squash in 60 ms | Gentler keys: a 4 % squash over 90 ms and a softer rebound. The hop still lasts 0.75 s, ending as the next focus begins, so one squash hands to the next |

**The finish review** (`impeccable-finish-reviewer`) returned "ship after fixes", and all of these were applied:
- **Material:**
  - The Ring's digits changed every frame, a flicker the check had exempted. Now they step in fives, with crossfades, and the check covers them (§4).
  - The search poster carried fading bits that read as dust, and a sun cut by the frame's edge. The finish now holds 0.65 s, so the bits clear before the poster frame, and search's sky keeps to a high band.
  - The goal was flat. It now has its own sticker and a cheering hop, and Doro hops lower than Pomo, so the pair never mirror.
- **Minor:**
  - The dusk sun was the same pink as Pomo and sat beside them on the hill. It is now the night's coral `accent`.
  - Sky discs touched the Ring in search; they now keep to a band above it.
  - The header pair's lift ran off the frame's foot. The hill rises 20 px, the pair are 630 px, and the lockup sits at y 785, so the lift ends 16 px above the foot. The pair's highest point, at the goal's hop, stays 28 px under the lockup's clear space.
  - The brief's numbers now match the build.
- **Set aside:**
  - A far-hill parallax, which would make the pan read more as a pan. The pan was approved as it is.
  - "Lead with value" on the header: the header's composition is the owner's.

### 3.6 The stills and the poster frames

- **The poster frames** are frame numbers (`POSTER_FRAME`), so each still is exactly a frame of its loop:
  - **Header,** frame 54 (1.8 s): the pair studying under the lockup in the morning.
  - **Search,** frame 336 (11.2 s): both celebrating the third sticker, sparkle-eyed, with the Ring still at 00:00 and dusk at the edge.
  - The bits of the sticker's placement have just cleared at that frame.
  - Earlier choices:
    - 10.72 s caught the sticker pressing on before the pair had reacted.
    - 11.07 s still showed the bits fading, which read as dust (the finish review).
  - The Ring holds 00:00 for 0.65 s after each landing, which is what lets a clean celebration and a finished focus share a frame.
- **The stills:** the header and search stills are those frames, built through `build.mjs` (`art/jobs/creative.json`), so `--check` covers them like all art.
- **The universal still** (16:9, 5244 × 2950) is the search scene at frame 336:
  - its ground runs out to the wider frame;
  - its timer moment is scaled into the middle, inside the centre 84.4 % × 76.2 % that both crops keep;
  - it carries no lockup, so it is wordless and safe in both placements.
- **No alpha:** a partly transparent hairline showed where two bands' clip regions met. Each band now overlaps the next by 6 px, and every still and frame is colour type 2.

### 3.7 The owner's review of round 2

- **Header:** "Header is good and approved" (2026-11-02).
- **Search:** "Something wrong with the search results can you check the rendered version", with screenshots of the preview page.
  - The screenshots showed vertical streaks smeared along the moving cuts.
  - Frames decoded in software (ffmpeg) were clean, so the drawing was sound and the playback was not.
  - The file was H.264 level 6.0, which the browser's GPU decoder garbles.
  - The fix: the search loop is now rendered at 3456 × 2304, level 5.1 (§3.3), and the check guards the limit.

## 4. Mathematical / Statistical Details

**Derived safe area** (until Apple's templates are downloaded with the owner's OK):
- A 16:9 frame of width W cropped to 21:9 keeps its full width. The crop is W · 9/21 tall against the frame's W · 9/16, so it keeps the centre 16/21 ≈ 76.2 % of the height.
- Cropped to 3:2, it keeps its full height and (3/2) / (16/9) = 27/32 ≈ 84.4 % of its width.
- The universal still keeps its focal point inside both: the centre 84.4 % × 76.2 %.

**Frames.** N = T · f with f = 30 fps. Frame k shows the scene at t_k = k / f; frame N would show t = T ≡ 0.

**The placement spring.** The app's spring has a duration of 450 ms and a damping ratio of ζ = 0.75. It is sampled as an underdamped oscillator: x(t) = 1 − e^(−ζω t) (cos ω_d t + (ζω/ω_d) sin ω_d t), with ω_d = ω √(1 − ζ²) and ω chosen so the motion settles in 450 ms. The overshoot, e^(−πζ/√(1−ζ²)) ≈ 2.8 %, matches DESIGN.md.

**Periodic motion that loops exactly.** The scene repeats only if every periodic motion has a whole number of cycles in T:
- **Breath:** the kit's 3.4 s and 4.1 s become T/6 = 3.33 s (Pomo) and T/5 = 4 s (Doro).
- **Sway:** T/5.
- **Zz drift:** 1.6 s, but only while asleep, inside the loop.
- **Ground:** pans 5 bands in T, one band (1.25 W) every T/5. Its offset is s(t) = B(1 + (t − 3.8)/(T/5)) − W/2, with B = 1.25 W.

**Why each cut's lean follows j mod 5.** At the seam, s jumps by −5B, so band j at t → T⁻ is band j − 5 at t = 0. The band's tone (j mod 5) and sky agree. A property that alternates by j mod 2 doesn't, because 5 is odd: (j − 5) mod 2 ≠ j mod 2. Anything drawn per band must be a function of j mod 5.

**The number format.** A breath of amplitude a = 1.2 % written to two decimals takes only the values 0.99, 1.00 and 1.01. Each step is 0.01 × 640 px ≈ 6.4 px of height in one frame, against about 0.25 px per frame of true breathing. Four decimals make the step 0.064 px, below a pixel.

**The night blend.** n(t) eases from 0 to 1 over [15.4, 15.9] s and back over [18.4, 18.9] s (smoothstep). The pair's lift is mix(L.stickerShadow, D.stickerShadow, n), each channel and the alpha linearly; their die-cut edge is mix(#FFFFFF, D.stickerEdge, n). So a 16 % warm lift becomes a 40 % plum-black one gradually.

**The Ring's readout.**
- **The sweep:** the arc is eased, e(t) = smooth((t − start) / (land − start)), with smooth(x) = 3x² − 2x³.
- **The steps:** the readout drops 5 minutes each time e passes a fifth. The k-th step comes when smooth(x) = k/5, that is x = ½ − sin(arcsin(1 − 2k/5) / 3), the inverse of smoothstep on [0, 1] (`unsmooth`).
- **The crossfade:** 0.15 s (4.5 frames), centred on the step, in the slot of each digit that changes. A digit that stays is drawn once, so it never dims. Two half-opaque copies over each other would show 1 − ½·½ = 75 %.
- **The reset:** 00:00 to 25:00 crossfades over the arc's 0.15-s fade, from land + 0.65 s, ending as the next focus starts at land + 0.8 s.

**The motion check.** For a loop decoded at 960 px wide, cut into ≈ 120-px tiles:
- **The change:** d_k(tile) is the mean absolute RGB difference (0–255) between frame k and frame k − 1, with frame −1 the last frame, so the seam is judged too.
- **A flick:** d_k > 1.0 and d_k > 4 · max(d_{k−1}, d_{k+1}), outside ±1 frame of a blink shutting or opening (`instants()`).
  - Smooth motion, and the start of a motion, always has a neighbouring frame changing nearly as much.
  - A pop has quiet frames on both sides.
  - The floor sits above the encoder's own frame-to-frame noise: x264's steady error is about 1.7 code values, and the keyframe 'pulse' is below 1.0 at quarter scale.
  - A first rule, against the median of three frames either side, flagged every motion onset, so it was replaced.

Smooth motion changes by similar amounts on neighbouring frames, so it never trips the ratio. A pop changes one frame alone, so it does.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Wordless search, the interface's pieces drawn as paper | A search video per language; one English video | **The owner's choice** (§1) |
| One scene drawn twice, at the same instant | One 16:9 master cropped to 21:9 and 3:2 | A crop would put the search's focal point in the header too; two compositions on one clock keep "one scene" true and each placement clear |
| A day as the loop | A single session (a sticker can't un-land); a sliding row of cells | The app's day really resets, so the seam is true to the app |
| VectorCraft frames, ffmpeg x264, bitexact | A browser capture of an animated SVG | Only the VectorCraft pipeline makes the vectors (ADR-0027); the probes show it's fast enough and reproducible |
| Silent | A soft SoundCraft loop on the header | **The owner's choice:** "Silent (Recommended)". Search videos are always muted, and the header plays muted until unmuted |
| Search concept B, die-cut stickers | A, a diary spread; C, one page | **The owner's choice** after seeing all three as loops |
| The lockup on the header only | Wordless everywhere; the lockup on both | **The owner's choice** ("Header only (Recommended)"). Search stays wordless, so one set serves every storefront |
| One tour-kit body per character; only faces cross over, and accessories fade | Crossfading whole shipped poses | Whole-pose crossfades swapped bodies and doubled the lift mid-fade: the flicks the owner saw (§3.5) |
| Moving scales and angles to four decimals, in the creative generator only | Changing the kit's two-decimal `f` | `f` is shared with the screenshots, whose bytes are approved and checked. Four decimals are needed only where a value moves frame to frame |
| The change at 450 ms | The kit's 280 ms | Two frames of squash at 30 fps reads as a jolt. 450 ms is the app's own placement-spring length |
| The readout steps 25:00, 20:00 … 00:00, each step a 0.15-s crossfade of only the digits that change; the reset crossfades with the arc's fade | A time-lapse countdown, a new reading every frame (round 2's first build) | The finish review: a reading a frame is a flicker on the one element search viewers read, against the owner's "don't flick" and Apple's "no fast motion". Steps keep the timer readable. Crossfading only the slots that change keeps the shared digits, and ':00', from dimming |
| The goal as a die-cut sticker over the row's end, with a cheering hop | The app's 18-pt flag at the row's end | At card size the flag was a speck, and the pair didn't react: the day's payoff was flat (the finish review) |
| The search loop at 3456 × 2304, H.264 level 5.1 | 3840 × 2560 (level 6.0); HEVC at 3840 × 2560 | 3840 × 2560 needs level 6 in either codec, past the GPU decoders that browsers and phones use: it played as streaks in the owner's browser. Apple takes any size from 1920 × 1280 to 3840 × 2560. 3456 × 2304 is the largest 3:2 frame within 4096 × 2304, drawn at that size from the vector scene, not scaled |
| No exemption for the digits in the motion check | Exempting the digits' box | The exemption hid the asset's worst flicker from the check that was meant to catch it |
| A decoded motion check | Trusting the generator's maths; eyeballing frames | The breath steps and both seam pops passed every source-level check and showed in no still. Only the decoded frames show what a viewer sees |
| The universal still wordless (the search scene, no lockup) | The header's lockup on the universal | Apple may show a universal asset in either placement. Wordless, it can never put the name in search |

## 6. Verification

- [x] `python -P scripts/art/creative-check.py` passes (2026-11-02):
  - each .mp4's codec, exact size, 30 fps, length within 5–30 s, yuv420p, BT.709 tags, no audio, and H.264 level 5.2 or below, within 4096 × 2304;
  - the motion, decoded: no flick anywhere, the Ring's digits and the last frame into the first (the seam) included, except at the blinks (§4);
  - no alpha in any still;
  - the sources carry no text: no `<text>`, and no glyph outlines but the timer's digits. With no words, none of Apple's don'ts (prices, URLs, ©, awards, other platforms) can appear.
- [x] `--rebuild` re-renders and re-encodes, and compares the .mp4s byte for byte: both match (2026-11-02).
- [x] `node scripts/art/build.mjs --check` passes for every job, the creative stills included; `python -P scripts/art/creative-sources.py --check` too.
- [x] `node scripts/docs/check-docs.mjs` reports 0 errors.
- [x] The owner approves the loops and stills (2026-11-02).
- [ ] The owner checks App Store Connect's Preview on iPhone and iPad before submitting (their action).

## 7. Related Docs

- [Screenshots record](2026-11-01-app-store-screenshots.md): the scene, the kit, the pipeline.
- [Stage E record](2026-11-01-phase1-stage-e.md): the release steps these hold.
- `docs/architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md`, `0047-same-page-mark-and-the-colon-characters.md`, named without links so their generated backlink blocks stay untouched.
