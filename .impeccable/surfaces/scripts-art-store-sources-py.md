---
version: 1
slug: "scripts-art-store-sources-py"
primary_target: "scripts/art/store-sources.py"
related_targets: ["art/src/store","art/jobs/store.json"]
---

# The v1.4 App Store screenshots: "Morning to night"

Surface brief, 2026-11-01. **Mode: Persuade.** The App Store's screenshot carousel for v1.4, in English and Turkish, iPhone and iPad. A whole surface inside the established Sticker Diary world (DESIGN.md is fixed). Build path: code-led (no image generation; every vector is VectorCraft's, through `scripts/art/build.mjs`). Record: `docs/implementations/2026-11-01-app-store-screenshots.md`.

**Finished, 2026-11-02:** finish review **fix**, eight fixes applied; two verdict passes; the owner approved the final set ("Approve the set") and chose "Keep today's row visible" for the iPad column (record §3.8).

**The owner's answers (2026-11-01):** 5 panels, triptych + 2; "Pair, stickers, week" leads; iPhone 6.9" and 6.3", plus iPad 13"; screens drawn in VectorCraft; "Confirm the brief"; composition: **"Morning to night"**, the dealt lead.

## 1. Job and audience

- **Who arrives:** someone searching the App Store for a study or focus timer, often a university student, often one of a couple; and v1.3.1 users reading the update.
- **Where:** search results show panels 1–3 side by side at about 9 % of their size; the product page scrolls all five at about 17 %.
- **What they must believe in seconds:** this is a gentle, beautifully made study timer with two characters, where every focus becomes a sticker.

## 2. Outcome and proof

- **Action:** Get (the store's own button). The set's job is to earn it.
- **Proof, not claims:** the real screens, drawn from the shipped tokens and strings; the sticker landing on today's page; the week as postcards. No counts, ratings, prices or partner features (v1.4 is solo). The app's name stays off the art.

| # | Caption, English | Caption, Turkish | Screen |
|---|---|---|---|
| 1 | Meet Pomo & Doro · The two little faces of your timer | Pomo ile Doro'yla tanış · Zamanlayıcının iki küçük yüzü | Facing pages, ready |
| 2 | A sticker for every focus · Each one lands on today's page, toward your goal | Her odağa bir çıkartma · Bugünün sayfasına yapışır, hedefini doldurur | The Ring, a sticker landing |
| 3 | Your week, as postcards · With your daily goal and love streak | Haftan kartpostallarda · Günlük hedefin ve aşk serinle | Stats |
| 4 | A love note after each focus · Write your own, too | Her odaktan sonra bir aşk notu · Kendi notlarını da yaz | "A note for you" over the Ring |
| 5 | Focus your way · Ring or Facing pages, day or night, or fly over the map | Kendi düzeninde odaklan · Halka ya da Karşılıklı sayfalar, gündüz ya da gece; istersen haritada uç | Midnight Plum, the Modes sheet |

## Direction contract

**THESIS.** The five panels are one study day, told left to right: milk morning at panel 1 turns to plum night at panel 5, and Pomo & Doro live it in their own poses. It refuses the category's default: a caption over a centred phone on five unrelated pastel cards.

**OWN-WORLD.** Sticker Diary tokens only. Five flat cut-paper grounds, `page → primarySoft → primary → plum primarySoft → plum page`, each new tone entering on a sweeping cut that crosses a seam; never a gradient. A paper hill runs the whole strip (`paper`, then plum `paper` from dusk) with a crisp `edge` line. Pomo & Doro are die-cut stickers with the three-layer lift. Paper sun, setting sun, crescent moon and four stars. Captions in Baloo 2; phones in a cocoa body.

**STORY.** In search, the visitor meets two faces stepping from panel 1 into panel 2, a timer and a sticker landing, then a week of postcards. On the product page the day goes on: a love note at dusk, the Midnight Plum Ring at night. They understand a calm study timer where every focus becomes a sticker, believe it's made with care, and tap Get.

**FIRST VIEWPORT** (search results, panels 1–3). Panel 1: "Meet Pomo & Doro" at the top, 136 px Baloo 2 SemiBold, the sub at 54 px Medium; the Facing pages phone, 900 px wide; the hero pair, 560 px each, waving with the tour kit's hands, standing on the hill astride seam 1|2. Panel 2: the Ring with today's sticker frozen mid-landing. Panel 3: Stats' postcards, the pair celebrating at seam 2|3. Cut edges cross both seams.

**FORM.** Morning to night, my #5 of 7, the dealt lead. seed:c914bb69c48d1a45

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Build pins

- **Strip geometry:** iPhone panels 1320 × 2868 with a 60 px gutter (0.045 of a panel, the product page's gap; search results show a wider one). Nothing that matters within 70 px of a panel corner, which the store rounds. The 6.3" set is the same strip cropped at 1206 × 2622. iPad panels 2064 × 2752 get their own layout of the same story, not a scaled phone strip.
- **Poses:** seam 1|2 the hero pair from the tour kit (body-cut, wave hand, body-fill, eyes, mouth, in `expressions.json`'s order); seam 2|3 celebrating; seam 3|4 on a break with their mugs; panel 5 asleep. Inside the screens, the app's own poses for each state.
  - *Amended by the finish review's fix batch, 2026-11-02 (record §3.8):* every sticker stays whole inside its own panel, and where it stands in front of a phone it covers a tab item completely or not at all, never the selected tab.
  - So the celebrating pair became panel 3's excited pair (the tour kit's sparkle eyes) flanking the Stats phone, and the break pair stands wholly in panel 4.
  - The hero pair still meet across seam 1|2, one on each side.
- **Day or night is a decision:** panels 1–4 show Strawberry Milk screens (panel 4's at dusk), panel 5 Midnight Plum.
- **Panel 2 proves the signature move:** today's sticker mid-drop (about scale 1.2, −8°) with its paper bits, with the cells before it placed and the rest dashed, still owed.
  - *Amended 2026-11-02:* panel 2 is session 3 of 4, so two placed, Pomo's third landing, one owed.
  - The same sticker breaks out over the screen's edge at about four times its cell, so the move reads at search size.
- **Demo data is consistent and real-stringed:** the status-bar time follows the day (8:30, 10:45, 13:20, 18:05, 22:40) and every "Break at" time is that time plus the timer; the week's counts add up to the week line; the goal flags match a 100-minute goal; only strings from `src/i18n/*.json` and the default notes (emoji left out). Synthetic, and said so in the record.
- **Contrast:** captions in `ink` on the day tones and plum `ink` at night; any sub-caption on `primary` is checked (large text, 3:1) or set in `ink`.
- **Type:** Baloo 2 outlined by HarfBuzz from the committed subset; the system face as Inter, set by VectorCraft. Turkish strings hard-wrapped and checked for overflow.

## Scope and boundaries

- **Target:** `scripts/art/store-sources.py` writes `art/src/store/*.svg` and `art/jobs/store.json`; `build.mjs` crops the panels. Reviewed on `art/review/store-preview.html`.
- **Untouched:** app code, shared docs, the shipped art (reused by inlining, never edited).
- **Open for the owner:** the Turkish captions' proof pass (at this contract); the iPad screens can't be checked against a device capture (none exists), so they're flagged at the first look.

## Design system check (2026-11-02)

**Consistent with the incumbent DESIGN.md; DESIGN.md and `.impeccable/design.json` are left unchanged.** This set extends the Sticker Diary world as an ordinary surface. It does not start a new world.
- **Tokens:** every scene and screen colour comes from `src/theme/palette.json` (`LIGHT` and `DARK` in the generator). The grounds are the contract's five tones. The hills are `paper` and `field` with an `edge` line. The sun, moon and stars are token paper discs. The paper bits use `TodayStickers.tsx`'s four colours. There are no gradients, blurs or filters. The record's §6 pixel samples and §4 contrast table are the evidence.
- **Type:** the captions are Baloo 2 SemiBold (headline) and Medium (subline), outlined from the committed subset, with no casing by style. The screens use Inter for SF Pro at the app's 400, 500 and 600 weights, and Baloo 2 only where the app sets it.
- **Shapes and depth:** the screens use the 1.5 pt edge and the 8, 14, 22 and pill radii. Stickers carry the three-layer `stickerShadow` lift with the `stickerEdge` die-cut. The offset sticker shadow is the world's own device, not a hard shadow.
- **Floor:** there is no kicker or eyebrow (a headline and one subline only), no glyph or emoji icon (the VectorCraft set only), and no system display face.

**Proposals for DESIGN.md's owner.** These are not edits: another session regenerates DESIGN.md at its release step.
1. A marketing caption role: Baloo 2 SemiBold headline (136 px on a 1320 px panel), with a Baloo 2 Medium subline (54 px) in `inkSoft`, or `ink` where `inkSoft` fails 4.5:1. This is Baloo2-Medium's first use: `type.ts` embeds it, but no app component sets it.
2. The cut-paper scene as the idiom for Persuade surfaces. It uses flat token grounds that enter on sweeping cuts across seams, a paper hill with a crisp `edge`, and token paper discs for the sky. Scene stickers lift with one point equal to size / 48. It would sit outside the app's Exact Ground Rule, which governs screens.

**Not canonized:**
- The device frame's hexes (`#8A6A64`, `#3B2421`, `#120B0C`, `#0B0708`, `#2A1D22`) are a hardware prop.
- `#000000` at 12 % and 32 % stands in for iOS's own sheet dim. It is not the `scrim` token.
- Inter as SF Pro is a stated substitution.
- Panel 3's subline in `ink` is a legibility exception.
- The tab-bar rule (Build pins) stays local to this surface.
- The drawn Modes sheet's rows used a 20 pt radius, where the app uses `radius.m` (14) in `ModeSheet.tsx`. Repaired on the owner's word, 2026-11-02: the rows, the 44-pt Fly badge and the 22-pt check now follow `ModeSheet.tsx` (record §3.9).

**Pre-existing system drift, reported and not repaired:**
- DESIGN.md's list of where display type may appear (the One Large Number Rule, last Don't) omits the love note sheet's title. `LoveNoteSheet.tsx` sets it in Baloo 2 SemiBold 22.
- DESIGN.md counts 25 roles. `palette.json` has 29: the D5 roles `scrim`, `scrimStrong`, `pomoInk` and `doroInk` are not yet recorded.
