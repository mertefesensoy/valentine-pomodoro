---
version: 1
slug: "scripts-art-creative-sources-py"
primary_target: "scripts/art/creative-sources.py"
related_targets: ["scripts/art/creative-build.py","art/out/creative"]
---

# The v1.4 App Store creative assets: "Pomo & Doro's day"

Surface brief, 2026-11-02. **Mode: Persuade.** Two looping videos for iOS 27's App Store (the product page header, 21:9; search results, 3:2) and their stills, cut from one scene. They are a whole surface inside the established Sticker Diary world, carrying over the screenshots' "Morning to night" scene. Build path: code-led (VectorCraft frames, ffmpeg). Record: `docs/implementations/2026-11-02-app-store-creative-assets.md`.

**The owner's answers (2026-11-02):**
- Format: "Looping videos (Recommended)"; text: "No text (Recommended)"; search: "The timer in use (Recommended)"; timing: "Hold 1.4.0 for them".
- Search words: "Wordless, no phone screen".
- The correction: no screens in either asset ("look at the examples they are not the screen itself so why should we"); the brand lockup on the header only ("Header only (Recommended)").
- Header: "Keep the day pan (Recommended)"; sound: "Silent (Recommended)".
- Search: "B: die-cut stickers (Recommended)".
- After the first previews: "Make the mascots bigger and make sure they don't flick so you need to make the animations more fun and smoother".

## Job and audience

- **Who:** someone on iOS 27 searching the App Store for a study or focus timer, and someone who reaches the product page.
- **Search must make the purpose obvious at a glance** (Apple: show the interface, content or gameplay): a timer finishing, a sticker pressing onto today's page, two characters.
- **The header gives one clear idea:** Pomo & Doro's study day, under the name.

## Direction contract

**THESIS.** One study day, looping: the cut-paper ground pans from milk morning to plum night and back to morning, while Pomo & Doro study, celebrate each sticker, sleep and wake. It refuses the category's habits: a phone mock-up on a gradient, and a static logo on a colour field.

**OWN-WORLD.** The Sticker Diary's tokens only:
- five flat cut-paper bands (`page`, `primarySoft`, `primary`, plum `primarySoft`, plum `page`) entering on sweeping cuts, each with its own paper sky (suns, a moon, stars);
- a far hill in `field` and a near hill in `paper`, each with a crisp `edge`;
- Pomo & Doro as tour-kit die-cut stickers with the three-layer lift;
- the Ring and today's row as large die-cut stickers in the app's own geometry;
- Baloo 2 digits only;
- the brand lockup on the header, colour by day and reversed at night.

**STORY.**
- **In search,** the visitor sees a timer sweep to 00:00, a sticker press onto a row of cells with paper bits flying, and two characters hop; they understand "a timer that turns focus into stickers".
- **On the product page,** the header shows the name over the pair's day.

**FIRST VIEWPORT** (the poster frames):
- **Search at 11.2 s (frame 336):** the Ring finished at 00:00, the third sticker just pressed on (its bits cleared), Pomo & Doro (820 px) celebrating on the hill either side, afternoon ground with dusk entering.
- **Header at 1.8 s (frame 54):** the lockup at 47.7 % of the height (its top at 42 %), below the iPhone's buttons, the pair (630 px) studying under it, all inside the centre 60 %.

**FORM.** The screenshots' composition, "Morning to night", carried over as one scene; the search composition is the owner's pick among three, B, die-cut stickers. seed:c914bb69c48d1a45

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Build pins

- **The loop:** T = 20 s at 30 fps, 600 frames. The scene is a pure function of t mod T, so frame 600 is frame 0; frames 0 … 599 are encoded.
- **Motion from the app:**
  - the placement spring (450 ms, damping 0.75) and its 12 paper bits;
  - the kit's change squash, breath, blink and wave.
  - The breath periods are rounded to divide T (Pomo T/6, Doro T/5), and the change plays over 450 ms for 30 fps.
- **No flicker:** every look is built on one tour-kit body. Only the face crosses over, accessories (pencil, Zz, the cheering hand) fade or grow, and only one squash acts at a time.
- **The Ring's readout** steps 25:00, 20:00 … 00:00 along an eased sweep. Each step crossfades only the digits that change; it never shows a new reading every frame.
- **The goal** is a round die-cut sticker slapped over the row's end. The pair answer it with a higher, cheering hop.
- **Checked by decoding:** `creative-check.py` scans every decoded frame, the seam included, for flicks. Only the blinks are exempt.
- **Words:** none, except the lockup on the header. The search is wordless, and its only glyphs are the timer's digits.
- **Encoding:** H.264 yuv420p, BT.709 on the frames, faststart, silent, bitexact.
- **Provenance:** the pipeline itself (generator → frames → VectorCraft → ffmpeg; the stills through `build.mjs`). Nothing is embedded in the files.

## Scope and boundaries

- **Target:** `scripts/art/creative-sources.py`, rendered by `creative-build.py` and checked by `creative-check.py`.
- **Untouched:** app code, shared docs, the screenshots, and the brand kit (the lockup is copied unchanged).
- **Open for the owner:**
  - App Store Connect's Preview on iPhone and iPad, to confirm the header's safe area;
  - setting the poster frames;
  - the upload.
