---
id: IMPL-2026-11-07-phase2-pair-plane
title: "Phase 2: a paper plane between you, in the pairing sheet"
status: in-progress
date: 2026-11-07
owner: Mert Efe Şensoy
related: [IMPL-2026-11-07-phase2-pair-sheet-blank, IMPL-2026-11-05-phase2-d1-pairing, IMPL-2026-11-06-phase2-f2-testflight, ADR-0027, DESIGN-WORKFLOW]
---

# 2026-11-07 — Phase 2: a paper plane between you, in the pairing sheet

**Status:** Built, and passing its tests. How it looks and feels on a phone is for build 64.
**Branch:** `feat/phase2-pair-plane`, one pull request into `master`.

---

## 1. Problem / Motivation

The pairing sheet takes the full height, because it holds a flow and a keyboard. With the blank-sheet bug fixed, its content still ends about halfway down, with a large empty stretch above the buttons. The owner, on seeing it on build 63: "It had the apple's button but it was under the giant empty place just like here which makes it less alive".

They asked for "a design improvement with VectorCraft". Of three sketched directions (https://claude.ai/artifact/6QvYtJ5kdriaDTikUNPkmm), they chose "2. A paper plane between you". Shown the amended brief, they answered "Yes, build it (Recommended)", and on the flight, "Still plane now, flight after (Recommended)". They'll rerun the whole checklist on the next build: "since we can't get paired we will do the check once again from the begining once the build is up".

## 2. What Changed

| File | Change |
|------|--------|
| `.impeccable/surfaces/app-pair-tsx.md` | The direction, and the states it changes. |
| `scripts/art/pair-plane.mjs` | New. Writes the drawing's sources, and the data module from their exports. |
| `art/src/pair/`, `art/jobs/pair.json`, `art/steps/`, `art/vc/`, `art/out/illustration/` | The drawing, through VectorCraft. |
| `src/screens/pair/planeArt.ts` | Generated: the exported paths. |
| `src/screens/pair/PlaneScene.tsx` | The scene, drawn in the theme's tokens. |
| `src/screens/pair/PairScreen.tsx` | Where it goes, and the shorter pages before sign-in. |
| `src/screens/pair/__tests__/PairScreen.test.tsx`, `planeScene.test.ts` | When it shows, and how it scales. |
| `DESIGN.md` | The scene, in the design system. |

## 3. Implementation Approach

**The drawing.** `scripts/art/pair-plane.mjs sources` writes one SVG per colour on a 361 × 280 artboard: the route, the plane's two wings and two hearts. `node scripts/art/build.mjs art/jobs/pair.json` exports them through VectorCraft, into the committed `.vectorcraft` sources and SVGs, and `pair-plane.mjs module` writes their paths into `planeArt.ts`. **Only that job runs:** a bare `build.mjs` would re-export every approved asset with VectorCraft 0.21, whose bytes differ, which is the failure another session owns.

**The scene.** `PlaneScene` is a flex slot at the end of the scroll view's content, whose `contentContainerStyle` now has `flexGrow: 1`. The slot takes whatever height the step leaves, measures itself, and scales the artboard to fit, sitting at the bottom. Nothing inside it has a size of its own, so it can't push the content into scrolling. That avoids the trap of a flex slot whose child sets its height.

**Who's drawn where.** Pomo and Doro use the existing `pomoIdle` and `doroIdle` stickers, so they lift and add no art. The sign-in step's pages drop to 120 pt with one dashed cell each. **One exception:** someone whose session has ended with a partner on this phone keeps the pair on the pages, as before, and no scene, since it's rare and the pages there say who's who.

**When it's left out:** font scale 1.6 and up, a landscape iPhone, under 120 pt, the who-it-is step, which already draws the pair, the name step, which has the keyboard, and the morph.

## 4. Mathematical / Statistical Details

The route is four cubic Béziers, $B(t) = (1-t)^3P_0 + 3(1-t)^2tP_1 + 3(1-t)t^2P_2 + t^3P_3$. Sampling $t$ evenly would bunch the dots on tight curves, so each segment is sampled 200 times into a polyline, and a dot is placed every 15 units of walked length.

The scene's scale is $s = \min(W/361,\ H/280,\ 1.3)$, for a slot of $W \times H$ points. At 120 pt, the smallest it draws, $s \approx 0.43$, and the mascots are about 38 pt.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A paper plane. The owner: "2. A paper plane between you" | The diary filling the sheet; the pair holding it up | The owner's choice from the sketches |
| Still for now. The owner: "Still plane now, flight after (Recommended)" | Flying when the code is sent | Build 64 carries a fix nobody has seen yet, and a flight can only be judged on a phone |
| One source per colour, drawn at run time in tokens | A sticker with fixed fills, through `build-icon-components.mjs` | That pipeline fixes fills or takes one ink, and this has four tokens and two themes. **A deviation from ADR-0027's "themes remap global swatches":** the provenance stays in VectorCraft, and the theming is at render, as `Spread` already is |
| 11 KB of bytecode for the route's dots as exported | Storing the dots' centres and building the path at run time | About 6 KB less, but it would break the line from the export to the module, and 40 KB is left |

## 6. Verification

- [x] `npx tsc --noEmit`, lint with 0 errors, contrast, and `npx jest --ci`: 91 suites and 937 tests.
- [x] `node scripts/art/check-budgets.mjs`: 138 assets, none over.
- [x] Bytecode: 4,599,608 B, which is 10,896 B for this, and leaves 40,392 B of NFR-PERF-002.
- [x] A true-size mockup from the real exports, on three phones and in both themes: on a 393 pt iPhone the scene has about 315 pt, on a Pro Max about 395, and on an iPhone SE about 130.
- [ ] The finish reviewer, from code.
- [ ] **On a device, build 64:** how it looks on every phone size, in both themes; the jump in its size from the sign-in step to the code step; and nothing about it getting in the way of typing a code.

## 7. Related Docs

- [The blank sheet's record](2026-11-07-phase2-pair-sheet-blank.md)
- [D1's record](2026-11-05-phase2-d1-pairing.md)
- [ADR-0027](../architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md)
