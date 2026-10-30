---
id: IMPL-2026-10-30-phase1-stage-c-design
title: "Phase 1 Stage C (C1–C4): the Sticker Diary design system, display face, Classic brief and art"
status: in-progress
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-29-couples-rehaul-plan, DESIGN-WORKFLOW, ADR-0042, ADR-0027, ADR-0012, ADR-0013, SRS]
---

# 2026-10-30 — Phase 1 Stage C (C1–C4): the Sticker Diary design system

**Status:** Plan, committed before any other file of this stage. The four gates below are the owner's.
**Branch:** `phase1/stage-c-design`, worktree `C:\vp\stage-c`, cut from the local `rehaul/v2` at `659b352`. Commits use `git commit -- <paths>` only. No push, no EAS, no repository settings: the session that started this one does those, with the owner's OK.
**Plan:** [Phase 1 plan](2026-10-29-phase1-plan.md) Stage C (C1–C4), [rehaul plan](2026-10-29-couples-rehaul-plan.md) §5 (design system) and §6.2 (budgets).

---

## 0. Read this first

- **The goal is a magnificent design**, product-level, never a template. The direction is pinned: "The Sticker Diary", kawaii, for couples who study together (`DESIGN.md`). Nothing here re-opens it.
- **Two blockers were found during set-up, and are reported rather than worked around:**
  1. **`/impeccable` and `/apple-design` don't resolve in this session.** Both are installed in the worktree, but this session started in the parent folder `BengisumPomodro`, which isn't the repository, and skills are discovered only when a session starts. The Skill tool answers "Unknown skill" for both. C4 needs a session started inside `C:\vp\stage-c`. That session will also need Impeccable's engine binary, which is git-ignored and so absent from a fresh worktree (`.claude/skills/impeccable/scripts/bin/` exists only in the main checkout): run `npx impeccable install --providers=claude --scope=project --no-hooks -y` there first, or copy `bin/` across.
  2. **VectorCraft is 0.18.0, not the 0.16 named in the brief and ADR-0027** (`vectorcraft-cli --version`, `C:\Program Files\VectorCraft`). Its command catalogue (822 commands) has everything §5.4 needs: `run --commands <file>`, `convert --decimals 2 --outline-text`, `object.path.offsetPath` (the die-cut edge), `object.path.outlineStroke`, the Pathfinder set and global swatches. The version is recorded here and in the shared-doc updates (§9).
- **The owner withdrew the tomato from the whole design (2026-10-30, at the C1 gate).** Their words, verbatim: on the palette, "Approve, option A but why there is a tomato there? It can be simillar to other pomodoros so let's not use any tomato in the design"; on the logo, "no tomato. brainstorm a more unique approach".
  - **The reading taken here:** no tomato anywhere in the design. That covers the logo, the app icon, the mascots, every illustration and every placeholder.
  - **What stays pinned:** "The Sticker Diary", the couple of two, the die-cut sticker form, and never-punish.
  - **Pomo & Doro** remain the *working names* of two characters whose species is now open. They are brainstormed with the logo concepts (C3), before C4, with an originality survey that now covers study and habit apps' mascots (owls, birds, plants, blobs), not only Pomodoro tomatoes and clocks.
  - **This reverses a "binding" line in `PRODUCT.md`** ("A kawaii tomato couple, binding"). `PRODUCT.md` and `DESIGN.md` are edited through `/impeccable` (DOCS §1), so the change is written there once the skill loads; until then the ready-to-paste text is in §9. An ADR (≥ 0045) waits until the owner picks the characters, because "not tomatoes" alone records nothing durable.
  - **The palette is unchanged:** the accent keeps its approved red; only its name loses "tomato" (`palette.json` role text).
- **No app screen changes.** `src/` screens, navigation and stores belong to D1–D4. Stage C adds new files (tokens, the contrast math, art) that D1 wires in. The existing `src/theme/tokens.ts`, which every screen imports, is left exactly as it is.

## 1. Problem / Motivation

v1.4 ships a full redesign (Phase 1 plan §1). Stage D can't rebuild a single screen until four things exist and are approved:

| Task | What is missing today | Requirement |
|------|----------------------|-------------|
| C1 | Hex values. `DESIGN.md` names the roles only; today's `tokens.ts` is the v1 palette with purple aurora gradients and grey text, the opposite of the brief (rehaul plan F10). Nothing proves contrast. | FR-SET-002, NFR-A11Y-001 |
| C2 | The display face. The timer and headings use the system font (ADR-0012). The face must cover Turkish casing (İ/ı) and keep the timer digits steady. | NFR-I18N-001 |
| C4 | The Classic surface brief, with the partner slot reserved, so Phase 3 doesn't re-lay out the focus page. | NFR-UX-001; prepares NFR-UX-003 |
| C3 | The art: an icon set to replace 37 emoji glyphs, Pomo & Doro as stickers, the logo, and the iOS icon and splash built from it. | NFR-PERF-005, NFR-A11Y-002; prepares NFR-UX-002 |

## 2. What Changed

Filled in as each task lands. Planned files:

| File | Change |
|------|--------|
| `docs/implementations/2026-10-30-phase1-stage-c-design.md` | This record. |
| `src/theme/palette.json` | **C1.** The single source of truth: both themes' tokens and the declared contrast pairs. VectorCraft swatches are generated from the same file, so art and UI can't drift. |
| `src/theme/contrast.ts` | **C1.** Pure contrast math (§4.1), with no imports, so Node can run it directly and the app can reuse it later for the "Match my wallpaper" runtime guard. |
| `src/theme/palette.ts` | **C1.** Typed access to `palette.json` for the app. Nothing imports it until D1. |
| `src/theme/__tests__/contrast.test.ts` | **C1.** The math against known values, and every declared pair at or above its floor. `// covers: NFR-A11Y-001, FR-SET-002`. |
| `scripts/design/check-contrast.mjs` | **C1.** `npm run check:contrast`: prints every pair and its ratio and exits 1 on any miss; `--html <file>` writes the swatch sheet from the same data and the same function. |
| `package.json`, `.github/workflows/ci.yml` | **C1.** The `check:contrast` script, and a blocking CI step that runs it. |
| `art/review/*.html` | The gate sheets (swatches, type specimens, logo concepts), generated, for the owner to open on Windows or a phone. |
| `art/src/`, `art/jobs/`, `art/steps/`, `art/vc/` | **C3.** SVG sources, VectorCraft job files, the exact `steps.json` per export, and the editable `.vectorcraft` sources (rehaul plan §5.4). |
| `scripts/art/build.mjs`, `scripts/art/check-budgets.mjs` | **C3.** Rebuild every export from its `steps.json` in `C:/vp-art` and copy it back; fail on any asset over budget. |
| `assets/images/icon.png`, `splash.png` | **C3,** after the owner picks the logo and its colour. The Android adaptive and monochrome icons wait (§3b of the Phase 1 plan). |
| `docs/architecture/adr/0045-…`, `0046-…` | New ADRs once the owner decides: the token set and contrast gate (supersedes ADR-0013), and the display face (supersedes ADR-0012 for headings and the timer). |

### 2.1 C1 result (2026-10-30): approved by the owner, option A

**Gate:** the owner approved the palette on 2026-10-30 with **option A**, the pastel strawberry button with a cocoa label (6.76:1). With it came the no-tomato decision (§0): the swatch sheet's placeholder sticker is now a plain "done" check, and the accent role is "the brand's red". No hex value changed.

**All 52 pairs pass** (26 declared pairs × 2 themes). Output of `npm run check:contrast`:

| Pair | Use | Floor | Strawberry Milk | Midnight Plum |
|------|-----|------:|----------------:|--------------:|
| ink on page | Body text, headings, the timer | 4.5 | 11.70 | 15.84 |
| ink on paper | Body text on a paper field | 4.5 | 12.29 | 14.09 |
| ink on field | Text typed into an input | 4.5 | 10.69 | 12.18 |
| inkSoft on page | Secondary text | 4.5 | 5.69 | 8.91 |
| inkSoft on paper | Secondary text on paper | 4.5 | 5.98 | 7.92 |
| inkSoft on field | Placeholder and hint text | 4.5 | 5.20 | 6.85 |
| onPrimary on primary | The primary button's label | 4.5 | 6.76 | 9.33 |
| primaryInk on page | Links, selected labels, the selected tab | 4.5 | 5.75 | 8.91 |
| primaryInk on paper | Links and selected labels on paper | 4.5 | 6.04 | 7.92 |
| ink on primarySoft | Text on a selected chip | 4.5 | 10.38 | 11.05 |
| primaryInk on primarySoft | A selected chip's strawberry label | 4.5 | 5.10 | 6.22 |
| onAccent on accent | A badge on tomato | 4.5 | 5.10 | 6.73 |
| accentInk on page | Tomato emphasis | 4.5 | 5.09 | 7.59 |
| accentInk on paper | Tomato emphasis on paper | 4.5 | 5.34 | 6.75 |
| onSuccess on success | A label on a leaf fill | 4.5 | 8.96 | 9.84 |
| successInk on page | "Goal reached", leaf icons | 4.5 | 5.42 | 9.84 |
| successInk on paper | Leaf text on paper | 4.5 | 5.70 | 8.75 |
| onDanger on danger | A destructive button's label | 4.5 | 7.09 | 7.55 |
| dangerInk on page | A destructive text action | 4.5 | 6.65 | 8.43 |
| dangerInk on paper | A destructive text action on paper | 4.5 | 6.99 | 7.50 |
| ringFocus on page | The focus ring, focus data marks | 3 | 3.84 | 8.06 |
| ringFocus on ringTrack | The focus ring on its track | 3 | 3.58 | 5.98 |
| ringBreak on page | The break ring, break data marks | 3 | 3.87 | 9.84 |
| ringBreak on ringTrack | The break ring on its track | 3 | 3.61 | 7.30 |
| edgeStrong on paper | An input's boundary on paper | 3 | 3.75 | 4.37 |
| edgeStrong on page | An input's boundary on the page | 3 | 3.57 | 4.92 |

- **The tightest pairs** are the light theme's marks (the ring at 3.58 on its track, input boundaries at 3.57). Each has about 0.6 of headroom, so a later tweak that lightens them shows up in CI at once.
- **The system that fell out of the anchor:** soft fills (strawberry, leaf) carry the cocoa label; strong fills (tomato, danger) carry a light one in the light theme. In Midnight Plum every fill is light enough to carry the plum page colour as its label.
- **The gate fails when it should:** with `inkSoft` lightened to `#A88A84`, the script printed three ✖ rows (2.97, 3.12, 2.71) and exited 1; the file was then restored.
- **Checks run:** `npm run check:contrast` exit 0; `npx jest src/theme` 10/10; `npm run typecheck` clean; ESLint on `src/theme` and `scripts/design` 0 errors (one existing warning in `tokens.ts`, untouched).
- **The swatch sheet** is `art/review/c1-swatches.html`, generated by `npm run check:contrast -- --html art/review/c1-swatches.html`. It shows both themes as a working page (the ring, timer, buttons, chips, an input, a placeholder sticker), every token with its role, and every pair with a live sample. It is laid out for a phone (checked at 390 px) as well as a desktop.
- **Node 22 in CI:** the script imports `contrast.ts` through `--experimental-strip-types` (Node 22.6+), so the contrast math has one implementation.

### 2.2 C2 result (2026-10-30): the owner picked Baloo 2, embedded with D1

**Gate (2026-10-30):** the owner picked **Baloo 2**, the recommended face, and chose to embed it **with D1**, not now. D1 therefore adds it through the `expo-font` config plugin, as a Latin + Turkish subset of two static weights with the `fi`/`fl` ligatures removed, and sets `fontVariant: ['tabular-nums']` on the timer (§8).

At the same gate the owner answered the logo and identity questions:
- **Logo research (rule 1):** "Keep the mark general, main things are romantic, for couples studying and then i will judge your best proposals."
- **Identity placement (§3.6 table): accepted as proposed.** C5, the one-page identity sheet, is added after C3.
- **The order change (§3.1): accepted earlier, at the C1 gate.** C3's black-and-white logo concepts and the icon set run before C4 while the skills don't resolve.

**Fetched** from `github.com/google/fonts` (`main`, 2026-10-30) into `C:\vp\fonts`, outside the repo; nothing in them was executed. SHA-256 recorded in `C:\vp\fonts\SHA256SUMS`.

| File | Bytes | SHA-256 (first 12) |
|------|------:|--------------------|
| `ofl/fredoka/Fredoka[wdth,wght].ttf` | 159,184 | `2ba02e68b152` |
| `ofl/baloo2/Baloo2[wght].ttf` | 683,200 | `d47a68525480` |
| `ofl/mplusrounded1c/MPLUSRounded1c-Medium.ttf` | 3,432,624 | `adfde1b6bae5` |
| `ofl/mplusrounded1c/MPLUSRounded1c-Bold.ttf` | 3,542,592 | `c358630584e8` |
| `ofl/nunito/Nunito[wght].ttf` | 276,932 | `bb55a5ca5c20` |

Plus each folder's `OFL.txt` and `METADATA.pb`. **`ofl/mplusrounded1c/` has no `OFL.txt`**; its licence was confirmed from `METADATA.pb` (`license: "OFL"`) and from the font's own name table (ID 13, the OFL 1.1 notice).

**Audit** (fontTools 4.61, read from the files; `art/type/build-specimen.py`):

| Face | Turkish (Ç Ğ İ Ö Ş Ü ç ğ ı ö ş ü) | Turkish `locl` | Digits 0–9 | Licence | Published size | Subset, Latin + Turkish, per weight |
|------|------------------|:---:|------------|---------|---------------:|---------:|
| Fredoka 2.001 | **Missing İ Ğ ğ Ş ş** | no | **Proportional, 383–577 units, no `tnum`** | OFL 1.1 | 155 KB (variable) | 35 KB |
| Baloo 2 1.700 | All 12 | yes | `tnum` → 583–606 units by weight, equal within each weight (checked at 400–800) | OFL 1.1 | 667 KB (variable) | 58 KB |
| M PLUS Rounded 1c 1.059 | All 12 | no | Fixed-width by design: 630 (Medium), 640 (Bold) | OFL 1.1 | 3.3–3.4 MB per static weight | 65–67 KB |
| Nunito 3.602 (stand-in) | All 12 | yes | Fixed-width by design: 600 at every weight (400–900) | OFL 1.1 | 270 KB (variable) | 44 KB |

- **Fredoka fails two of the three requirements.** It is out whatever the owner prefers, so the specimen adds **Nunito as a stand-in**, marked as added in C2, so there are still three passing faces to choose from.
- **No Reserved Font Names** are declared in any of the four licences, so a subset may keep the family name. Each embedded subset keeps the font's name table, which carries the copyright and the OFL notice (OFL §2).
- **A finding for D1, whatever the pick:** all four faces have an `fi` ligature that merges the dot of `i` into the `f` (rendered and checked, with and without `lang="tr"`). In Turkish that hides the difference between i and ı (*fikir*, *fiyat*). The embedded subset must drop the `fi`/`fl` ligatures (`liga`); the Turkish `locl` of Baloo 2 and Nunito doesn't remove it in Chrome, and React Native on iOS may not pass a language tag at all.
- **The specimen** is `art/review/c2-type-specimen.html` (227 KB, the subsets embedded as WOFF2; the first build embedded TTF data under a WOFF2 label, because fontTools applies the flavour only when it is set on the font, and that was fixed before the owner's phone could choke on it), rebuilt with `python -P art/type/build-specimen.py --fonts C:/vp/fonts --out art/review/c2-type-specimen.html`. Per face: the live timer at its display weight with tabular figures, a four-reading jiggle strip, an upper-case Turkish heading with İ, a sentence with ı ğ ş ö, the casing pairs, the `fi` line, an English heading, two sticker captions, and the audited facts. It follows the C1 tokens: Strawberry Milk, or Midnight Plum in dark mode.
- **Recommendation: Baloo 2, embedded with D1.** Of the owner's three, it is the one that passes and has a voice of its own: its captions and timer read like stickers. M PLUS Rounded 1c is the calm alternative (no prop needed for steady digits, but plainer Latin and a wide colon, 394–418 units, that opens a gap in the timer). Nunito passes but is one of the most-used rounded faces in app and dashboard templates. Baloo 2's steady digits depend on `fontVariant: ['tabular-nums']` reaching Core Text, which D1's device check confirms on the iPhone.

### 2.3 C3, part 1 (2026-10-30): the logo concepts in black and white; the owner chose Same Page, with The Colon's characters

Run before C4, as the owner agreed (§3.1), because the design skills didn't yet resolve in this session.

**Gate (2026-10-30), the owner's words:** "We will use the logo of the Same Page and the mascots of The Colon. We will have many animations with pomo and doro and one of them is that they turn themselves into pages and creates the logo design of the Valentine Pomodoro."
- **The mark: Same Page.** It goes into colour, then the app icon, the splash and the mark in context.
- **Pomo & Doro: The Colon's two round characters.** They are designed in C3 with the five sticker poses, and they must differ in silhouette, not by a gendered cue.
- **One face for both:** the characters and the mark share the same eyes and smile, so the signature animation (the two of them turning into the two pages and forming the mark) reads as one continuous move. Where it plays is a D-stage motion decision, under the rules in [ADR-0047](../architecture/adr/0047-same-page-mark-and-the-colon-characters.md).
- **ADRs written:** [ADR-0045](../architecture/adr/0045-theme-tokens-and-contrast-gate.md) (tokens and the contrast gate, supersedes ADR-0013), [ADR-0046](../architecture/adr/0046-display-face-baloo-2.md) (Baloo 2, partly supersedes ADR-0012) and ADR-0047 (the mark, the characters, no tomato).
- **After the move into the worktree, `/impeccable` and `/apple-design` resolve** (the session's directory changed to `C:\vp\stage-c` at the end of the previous turn), so C4 runs next.

**The pipeline is built and reproducible.** `scripts/art/build.mjs` turns each job in `art/jobs/` into one command list per asset, `art/steps/<id>.steps.json`, and runs it headless with `vectorcraft-cli run` in `C:/vp-art`. The steps select all, expand strokes into fills, save the editable `art/vc/<id>.vectorcraft`, export `art/out/<kind>/<id>.svg` (2 decimals, outlined text, minified) and one PNG per size.
- **The expand step** is included only when `object.expand.info` finds work: VectorCraft refuses an expand that changes nothing.
- **Determinism:** VectorCraft writes the build time into a PNG `tEXt` chunk ("Creation Time") and into the native file's `created`/`modified` fields. The build removes the first and pins the second to 0. Nothing else in either file changes, and the native file still opens (`vectorcraft-cli info`).
- **`node scripts/art/build.mjs --check`** rebuilds in the work folder and compares every file, steps included, byte for byte: **all 44 files match** (4 steps lists, 4 `.vectorcraft`, 4 SVG, 36 PNG). Before the timestamp fix it caught all 40 binary exports as different, so the check works.

**The concepts** (`art/src/logo/`, black and white only, logo rule 2), each on a 1024 pt artboard:

| # | Concept | The idea | SVG master |
|---|---------|----------|-----------:|
| 1 | **Same Page** | Two pages of one open diary, each with a face, leaning in: a couple on the same page | 2.3 KB |
| 2 | **Lean on Me** | Two books that hold each other up in an A on a shelf | 2.1 KB |
| 3 | **The Colon** | Two round faces as the colon in 24:59; lettering sketch "pomo:doro" in Baloo 2 | 1.3 KB |
| 4 | **Red Thread** | Two round faces tied by one thread with a loop (the East Asian red-thread legend); under about 30 px it reads as one smiling face | 2.2 KB |

- **Three first sketches were dropped after the small-size test,** and the gate page says why: two stickers in one die-cut (it read as a chat bubble), clinking cups (beer steins, wrong for students) and a pencil with an eraser (a rocket when small; a pencil means "edit" on iOS).
- **The survey (rule 6)** is on the gate page: Pomodoro timers (tomato, red disc, ring, clock), focus-by-growing apps (tree, sprout), study companions (small animal mascots) and couples apps (hearts, overlapping circles, flames, chat bubbles, pink). It is drawn from App Store listings and recalled store icons, not an exhaustive scan, and says so. None of the four uses a tomato, a clock or ring, a heart, an animal, a plant, overlapping circles or a sparkle (now the sign for AI). **The originality check** of the picked mark is a reverse-image search plus, with the name, a trademark search before launch (the owner's).
- **The gate page** is `art/review/c3-logo-concepts.html` (208 KB, `node scripts/art/review-logo.mjs`). For each concept it shows the mark large, the case for it (why it fits, wit and warmth, what Pomo & Doro become, risks), every iOS size at its real pixels (1024, 180, 120, 87, 80, 60, 40, 29, 20), and a reversed row.
- **Recommendation: Same Page**, the only concept that carries all three of the owner's words at once (romantic, couples, studying) and the strongest at 20 px. Red Thread is the more romantic and unusual alternative.

## 3. Implementation Approach

### 3.1 Order, and one proposed change

The brief's order is **C1 → C2 → C4 → C3**. C4 waits on a session that can run `/impeccable` and `/apple-design` (§0). **Proposal:** if that session doesn't exist when C2's gate closes, start C3's first half, the **black-and-white logo concepts** and the **icon set**, and run C4 as soon as it does. Neither depends on the Classic brief:

- the mark is designed in black and white before any colour or layout (logo rule 2)
- the icon inventory comes from the code: the 37 emoji glyphs in 13 files, plus the tab and control icons

What does depend on C4 waits for it: the sticker sizes for the partner slot, and every in-context mock-up of the Classic page. If the skill session is ready in time, the order stays exactly as written. **The owner decides.**

### 3.2 C1: tokens, the contrast gate, the swatch sheet

1. **Pairs before colours.** `palette.json` declares every foreground/background pair the UI will draw, with a role and a floor: 4.5 for text, 3 for large text, icons and non-text UI (Phase 1 plan §4.1). The script checks what is declared, never a guess. Each text token is paired with every surface it can sit on: page and paper are different tones, so secondary text has to pass on both.
2. **The anchor is the primary button.** A pastel strawberry with white text almost never reaches 4.5:1. Two ways out: a deep strawberry with white text, or a pastel strawberry with cocoa text. The plan takes **the pastel fill with cocoa text**: it reads as stationery, not as a generic pink app, and it frees the deeper strawberry for text, the ring and the selected tab, where it must be dark enough anyway. The swatch sheet shows both, so the owner can overrule.
3. **Token roles** (both themes, the same names): `page`, `paper`, `paperSunk`, `edge` (decorative paper edge), `edgeStrong` (input boundaries, 3:1), `ink`, `inkSoft` (tinted from cocoa, never grey), `primary` / `onPrimary`, `primaryInk`, `primarySoft`, `accent` / `onAccent` (tomato, used sparingly), `success` / `onSuccess` / `successInk` (leaf), `danger` / `dangerInk` (destructive actions only, kept apart from the brand tomato), `ringTrack`, `ringFocus`, `ringBreak`, `stickerEdge`, `stickerShadow` (tinted, never grey).
4. **Midnight Plum** mirrors the roles: a plum-tinted night page (not black, not grey), milk-cream ink, a lighter strawberry with plum text on the button.
5. **One function, three uses.** The CI check, the Jest test and the swatch sheet all call `contrast.ts`, so the ratios the owner approves are the ones CI enforces.
6. **The CI step is blocking** (unlike the docs check), because a failing theme doesn't ship (`DESIGN.md`, the Contrast Gate Rule).

### 3.3 C2: the display face

- Fetch Fredoka, Baloo 2 and M PLUS Rounded 1c from the official `google/fonts` repository, each with its `OFL.txt`, into a short folder outside the repo. Nothing from them is executed.
- **Verify, don't recall.** fontTools (4.61, installed) reads each file's `cmap` for U+0130 İ, U+0131 ı, U+011E/011F Ğ ğ, U+015E/015F Ş ş, U+00C7/00E7 Ç ç, U+00D6/00F6 Ö ö, U+00DC/00FC Ü ü, and checks digits two ways: a `tnum` feature in `GSUB`, and whether 0–9 already share one advance width. React Native on iOS honours `fontVariant: ['tabular-nums']`, so a face with `tnum` works either way; the specimen says which kind each one is.
- **Size matters for the native build.** M PLUS Rounded 1c carries Japanese glyphs. The specimen reports each face's file size, whole and subset to Latin + Turkish, because the face lands in the binary.
- **The specimen sheet** sets, for each face, the running timer (`24:59` → `00:07`, with a digit-width overlay that shows any jiggle), a Turkish heading with real casing (`İSTANBUL'DA ÇALIŞIYORUZ`, `ılık bir öğle arası`), sticker captions, and the OFL notice with its source.
- **The question for the owner:** embed the chosen face now (an `expo-font` config-plugin change, which changes the native build), or with D1. The plan recommends **with D1**: C2 then only picks the face, and the next native build carries the face together with the screens that use it.

### 3.4 C4: the Classic surface brief

- `/impeccable shape classic`, in a skill-enabled session (§0), under the pinned direction. The brief **reserves the partner slot** in the focus page: Pomo & Doro in v1.4, the live partner strip in Phase 3, the same frame and size, so Phase 3 swaps the content and nothing moves.
- Then `/apple-design` on the brief, **including the Liquid Glass checklist against the native tab bar as fixed for build 47** (`63f1db2`: `LazyTab`, tabs never frozen or hidden). Glass is used only where the system provides it (DESIGN-WORKFLOW §3).
- Every finding is recorded with what was done about it (§6.3). Precedence: App Review and accessibility, then the brief, then the motion rules.

### 3.5 C3: the art

- **Pipeline** (rehaul plan §5.4): hand-authored SVG sources in `art/src/`; a VectorCraft job per asset in `art/jobs/`; each export's exact command list in `art/steps/<asset>.steps.json`; the editable `.vectorcraft` file in `art/vc/`. Jobs run in `C:/vp-art` (the 260-character path limit) and results are copied back. `scripts/art/build.mjs` rebuilds everything from the steps files; a clean rebuild that changes no byte is the reproducibility check.
- **Swatches carry token names** from `palette.json`, so a theme pack is a swatch remap, never hand recolouring.
- **Icons, about 40:** a 24 pt grid, 2 pt rounded strokes and caps, one optical weight, a 2 pt safe margin. Drawn as strokes in the source, exported as outlined fills so they render the same everywhere. The set covers the 37 emoji in 13 files plus the tab, control and mode icons. Each is ≤ 2 KB.
- **Pomo & Doro as die-cut stickers**, in five poses: idle, focusing, break, celebrating, sleepy. The die-cut edge is an `offsetPath` of the silhouette in `stickerEdge`; the shadow is the tinted `stickerShadow`. Each is ≤ 30 KB. Both are original: a resemblance check against existing tomato and fruit mascots is recorded per pose (§6.4). No pose sulks or cries (NFR-UX-001).
- **The logo first, then the app icon and splash built from it** (§3.6).

### 3.6 The logo and the brand identity

David Airey's ten rules, applied:

1. **Research first.** `PRODUCT.md` answers why, what, for whom and what sets it apart. Two questions remain for the owner (§7).
2. **Form before colour.** Three to five concepts, **in black and white only**.
3. **Appropriate.** Each concept comes with a two- or three-sentence rationale the owner can judge it by.
4. **Simple and memorable.** One idea per concept.
5. **Scalable.** Every concept is shown at every iOS size: 1024 (App Store), 180, 120, 87, 80, 60, 40 and 29 px, plus 20 px as a notification glyph.
6. **Different.** A short survey of the Pomodoro, study and couples apps on the App Store, listing their habits (tomatoes with clock hands, timers, hearts, two overlapping circles, gradients). **One tension, stated plainly:** `PRODUCT.md` makes the tomato couple binding, so the mark keeps the tomato. The difference has to come from *the couple* and *the sticker*, not from dropping the tomato. The owner confirms that reading (§7).
7. **The bigger picture.** After the owner picks a concept and it is coloured: the home screen, the App Store page, the splash, a widget and a social card. The identity must hold where the mark isn't shown (palette, type, sticker edge, voice).
8. **It needn't show what the app does.** No clock hands, no timer ring in the mark.
9. **Consider a wordmark.** It depends on the public name, which is undecided (`PRODUCT.md`). See the proposal below.
10. **Wit and warmth.** Each concept names its touch of humour.

**Where the rest of the identity goes: a proposal; the owner decides.**

| Piece | Proposed home | Why |
|-------|---------------|-----|
| The mark (symbol) | **C3**, as the source of the app icon and the splash | The icon needs it in v1.4. |
| Colour | **C1** tokens; the mark's colour version after the pick | Colour is the last and easiest layer (rule 2). |
| Type | **C2** display face, which is also the base of the lettering | One rounded voice for headings, the timer and the lettering. |
| Illustration system (stroke, sticker edge, shadow, the poses' rules) | **C3**, written as rules in this record, then into `DESIGN.md` by `/impeccable document` at **E4** | `DESIGN.md` is Impeccable's to edit (DOCS §1). |
| Wordmark | **Lettering style now** (C2's face, adjusted: joined o's, a lifted letter as the small-size mark); **the final wordmark when the public name is chosen**, before Phase 7 | Lettering a working name that may change is wasted work; the style can be settled now so headlines can use it. |
| App Store art, social card, the weekly recap card | **Phase 7** (launch), from the system above | They need the final name and real screens. |
| A one-page identity sheet (clear space, minimum sizes, mono and colour versions, misuse) | **A new task, C5**, after C3, in this record | Stops later sessions from redrawing the mark by eye. |

## 4. Mathematical / Statistical Details

### 4.1 Contrast (C1)

The Phase 1 plan §4.1, implemented as written. For 8-bit sRGB channels $C_8 \in \{R_8, G_8, B_8\}$:

$$c = \frac{C_8}{255}, \qquad c_{\text{lin}} = \begin{cases} c / 12.92 & c \le 0.04045 \\ \left(\dfrac{c + 0.055}{1.055}\right)^{2.4} & c > 0.04045 \end{cases}$$

$$L = 0.2126\,R_{\text{lin}} + 0.7152\,G_{\text{lin}} + 0.0722\,B_{\text{lin}}, \qquad \text{CR} = \frac{L_{\max} + 0.05}{L_{\min} + 0.05} \in [1, 21].$$

- A pair passes when $\text{CR} \ge 4.5$ (text) or $\text{CR} \ge 3$ (large text: ≥ 18 pt regular or ≥ 14 pt bold; icons; non-text UI such as the ring and input boundaries).
- A colour with alpha $\alpha$ is composited over its background first, per channel in sRGB: $c = \alpha\,c_{fg} + (1 - \alpha)\,c_{bg}$, then rounded to 8 bits, as the platforms draw it.
- Ratios are compared unrounded; the sheet shows two decimals. A pair at 4.499 fails even though it prints as 4.50.
- **Test anchors** (known values): black on white is exactly 21; `#767676` on white is about 4.54, the lightest grey that passes 4.5 on white; a colour on itself is 1.

### 4.2 Tabular figures (C2)

A face keeps the timer steady when every digit 0–9 has the same advance width $w$, either natively or through `tnum`. The check: $\max_d w_d - \min_d w_d = 0$ font units, read from `hmtx` for the digit glyphs (after the `tnum` substitution when the face has one).

### 4.3 Asset budgets (C3)

An asset passes when its shipped byte size $s$ satisfies $s \le 2048$ B (icon) or $s \le 30\,720$ B (illustration), reading KB as 1024 B. The SVG export uses two decimals: on a 24 pt grid that keeps positions to 0.01 pt, far below a pixel at 3× (0.33 pt).

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Tokens in JSON, read by the app, the script and VectorCraft | Tokens in TypeScript only | One source for UI and art; the swatch names *are* the token names (§5.4). |
| Contrast math in one TS file with no imports, run by Node's type stripping | A second copy in the script | Duplicated math drifts (the worklet lesson in this repo's memory). |
| New palette files; `tokens.ts` untouched | Rewrite `tokens.ts` now | Every screen imports it; screens are D1–D4's. D1 switches `useTheme` over. |
| Primary button: pastel strawberry, cocoa label | Deep strawberry, white label | Reads as stationery, keeps 4.5:1 with room; both are shown to the owner. |
| Destructive actions get their own `danger` token | Reuse the tomato accent | The brand colour must never mean "you're about to lose something" (NFR-UX-001). |
| Recommend embedding the face with D1 | Embed now | One native build carries the face with the screens that use it; the owner decides. |
| Mark first, wordmark at the naming decision | Letter "Valentine Pomodoro" now | The public name is open; the lettering style is settled now. |
| Icons drawn as strokes, exported as outlined fills | Ship strokes | Outlined paths render identically in `react-native-svg` at every scale. |

## 6. Verification

### 6.1 C1

```bash
npm run check:contrast        # every declared pair, its ratio and its floor; exit 1 on any miss
npx jest src/theme            # the math anchors and every pair
npm run typecheck && npm run lint
```

- [ ] CI runs `check:contrast` as a blocking step.
- [ ] The owner approves the palette from the swatch sheet.

### 6.2 C2

- [ ] Each face: Turkish glyphs present, digits tabular (natively or with `tnum`), OFL confirmed, sizes reported.
- [ ] The owner picks one, and says whether it lands now or with D1.

### 6.3 C4

- [ ] `/impeccable shape classic` brief written, partner slot reserved.
- [ ] `/apple-design` on the brief, including the Liquid Glass checklist against `63f1db2`; every finding and its disposition recorded.
- [ ] The owner confirms the brief.

### 6.4 C3

```bash
node scripts/art/build.mjs           # rebuild every export from art/steps/*.steps.json
git status --short art assets        # no change after a clean rebuild = reproducible
node scripts/art/check-budgets.mjs   # icon ≤ 2 KB, illustration ≤ 30 KB
```

- [ ] Logo: concepts in black and white at every size; the owner's pick; colour; the mark in context.
- [ ] About 40 icons on the 24 pt grid; five sticker poses; the iOS icon and splash.
- [ ] Originality check recorded for the mascots and the mark.

### 6.5 Docs

```bash
node scripts/docs/check-docs.mjs --write && node scripts/docs/check-docs.mjs
```

## 7. Questions for the owner

1. **Order:** may C3's black-and-white logo concepts and the icon set run before C4 if the skill session isn't ready (§3.1)?
2. **Logo, rule 6:** is "keep the tomato, differ through the couple and the sticker" the right reading of the binding tomato-couple commitment?
3. **Logo, research:** is there anything about the two of you, or the app's origin, that the mark may carry beyond the About line? (For example, a private detail only you two would notice.) "No" is a fine answer.
4. **Identity placement** (§3.6 table): accept, or move pieces.
5. **The face:** asked at the C2 gate.

## 8. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md), Stage C and §4.1 · [Rehaul plan](2026-10-29-couples-rehaul-plan.md) §3.1, §5, §6.2
- [`PRODUCT.md`](../../PRODUCT.md) · [`DESIGN.md`](../../DESIGN.md)
- [Design workflow](../process/DESIGN-WORKFLOW.md) · [ADR-0042](../architecture/adr/0042-design-skill-stack.md) · [ADR-0027](../architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md) · [ADR-0012](../architecture/adr/0012-system-fonts.md) · [ADR-0013](../architecture/adr/0013-valentine-colour-palette.md)
- [B6 record](2026-10-30-phase1-b6-expo-router.md) §9 (the tab bar as fixed for build 47)
- [SRS](../srs/SRS.md): FR-SET-002, NFR-A11Y-001, NFR-A11Y-002, NFR-I18N-001, NFR-PERF-005, NFR-UX-001, NFR-UX-002, NFR-UX-003

## 9. Shared-doc updates to apply at merge

Ready-to-paste text, applied by the merging session. Filled in as each task lands.

**`docs/README.md`**, implementation records table, at the top:

```markdown
| 2026-10-30 | [Phase 1 Stage C: the Sticker Diary design system, display face, Classic brief and art](implementations/2026-10-30-phase1-stage-c-design.md) |
```

**ADR-0027**, a status note: "VectorCraft is 0.18.0 as of 2026-10-30 (the Stage C record §0); the pipeline is unchanged."

**ADR index (`docs/architecture/adr/README.md`)**, three rows after ADR-0043 (ADR-0044 is left to the session that reserved it):

```markdown
| [ADR-0045](0045-theme-tokens-and-contrast-gate.md) | Theme tokens in one JSON file, proved by a blocking contrast gate | accepted | 2026-10-30 |
| [ADR-0046](0046-display-face-baloo-2.md) | Baloo 2 for the timer, headings and sticker captions; the system face for everything else | accepted | 2026-10-30 |
| [ADR-0047](0047-same-page-mark-and-the-colon-characters.md) | The Same Page mark, Pomo & Doro as The Colon's two round characters, and no tomato anywhere | accepted | 2026-10-30 |
```

**ADR-0013**, front-matter `status: superseded`, `superseded_by: [ADR-0045]`, and the status note: "Superseded by ADR-0045: the Strawberry Milk and Midnight Plum token sets, approved by the owner on 2026-10-30 (option A), checked by `npm run check:contrast` in CI."

**ADR-0012**, the status note: "Superseded for the timer, headings and sticker captions by ADR-0046 (Baloo 2, embedded with D1). Body text stays the system face."

**The no-tomato decision (§0) and the characters (§2.3, ADR-0047), 2026-10-30.** These are the lines they change:

| Where | Today | Replace with |
|-------|-------|--------------|
| `PRODUCT.md`, Brand Commitments (through `/impeccable`) | "A kawaii tomato couple, binding. *Pomodoro* is Italian for tomato, so the mascots are two small original tomatoes, **Pomo & Doro**…" | "**A kawaii couple of two, binding; no tomato anywhere** (owner, 2026-10-30, ADR-0047). The mascots are **Pomo & Doro**, two small round characters who are, together, the colon in the timer. The mark is **Same Page**: two pages of one open diary, each with a face, leaning in. The characters and the mark share one face, and the two of them can turn into the two pages and form the mark. No tomato, clock or heart in the mark or the art: those are the category's habits." |
| `PRODUCT.md`, Undecided; SRS §6 open-decisions row; ADR-0020 TBD | Candidates "Pomo Pair, Tomatwo, Pomo & Doro, Two Tomatoes" | Add: "Tomatwo and Two Tomatoes conflict with the no-tomato direction (2026-10-30)." |
| `DESIGN.md` description, line 4 (through `/impeccable`) | "Pomo & Doro, two little tomatoes, keep a sticker diary…" | "Pomo & Doro, two little round characters, keep a sticker diary…" |
| `DESIGN.md` pinned-direction note, line 9 | "The kawaii tomato-couple direction" | "The kawaii couple direction (no tomato, owner 2026-10-30)" |
| `DESIGN.md` North Star, line 15 | "Pomo & Doro, two small original tomatoes, are drawn as stickers… ripe garden tomato…" | "Pomo & Doro, two small round characters (together they make the timer's colon), are drawn as stickers… a ripe garden harvest…" |
| `DESIGN.md` Colors, Secondary | "**Tomato Red:** the accent of the brand and the mascots" | "**Accent Red:** the brand's accent" (the hex values are in `src/theme/palette.json`) |
| Rehaul plan §3.1, §3.3 (Shared Garden "grows plants and tomatoes"), §5.2 ("tomato-red accent") | Tomato wording | Point at this record's §0; the garden grows plants without tomatoes. |
| Phase 1 plan, C3 row | (no tomato wording; "Pomo & Doro as stickers") | Add: "Characters chosen with the logo; no tomato (owner, 2026-10-30)." |

## Backlinks
<!-- backlinks:start -->
- [Theme tokens in one JSON file, proved by a blocking contrast gate](../architecture/adr/0045-theme-tokens-and-contrast-gate.md)
- [Baloo 2 for the timer, headings and sticker captions; the system face for everything else](../architecture/adr/0046-display-face-baloo-2.md)
- [The Same Page mark, Pomo & Doro as The Colon's two round characters, and no tomato anywhere](../architecture/adr/0047-same-page-mark-and-the-colon-characters.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
