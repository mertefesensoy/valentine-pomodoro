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

## Backlinks
<!-- backlinks:start -->
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
