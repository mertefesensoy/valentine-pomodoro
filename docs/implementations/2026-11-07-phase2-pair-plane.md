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

**The scene.** `PlaneScene` is a flex slot at the end of the scroll view's content, whose `contentContainerStyle` has `flexGrow: 1` only while the scene shows. The slot takes whatever height the step leaves, measures itself, and scales the artboard to fit, sitting at the bottom. **The art is positioned absolutely, and the slot clips it,** so the art can't hold the slot open when the content above grows. That's the trap of a flex slot whose child sets its height, D1's Ring in builds 51 to 55, and the first version of this scene fell into it. The scene crossfades in and out and holds its place from the sign-in step to the code step. The sheet doesn't scroll while a code is being typed, because filling the sheet leaves a scroll range once the keyboard adds its inset.

**Who's drawn where.** Pomo and Doro use the existing `pomoIdle` and `doroIdle` stickers, so they lift and add no art. The sign-in step's pages drop to 120 pt with one dashed cell each. **Where there's no scene,** at the largest text sizes and on a landscape iPhone, Pomo stays on your page at the normal height, as before. Someone whose session has ended with a partner on this phone keeps the pair on the pages, and no scene, since it's rare and the pages there say who's who.

**When it's left out:** font scale 1.6 and up, a landscape iPhone, under 120 pt, the who-it-is step, which already draws the pair, the name step, which has the keyboard, and the morph.

**A case left for the device.** At larger text on a small iPhone, the space can drop under 120 pt while the pages still sit side by side. The pages can't see the slot's height, so that sign-in step shows two dashed cells and no pair. It's rare, and a report back from the scene would be a layout loop to guard against, so it's decided with the 120 pt limit on build 64.

## 4. Mathematical / Statistical Details

The route is four cubic Béziers, $B(t) = (1-t)^3P_0 + 3(1-t)^2tP_1 + 3(1-t)t^2P_2 + t^3P_3$. Sampling $t$ evenly would bunch the dots on tight curves, so each segment is sampled 200 times into a polyline, and a dot is placed every 15 units of walked length.

The scene's scale is $s = \min(W/361,\ H/280,\ 1.3)$, for a slot of $W \times H$ points. At 120 pt, the smallest it draws, $s \approx 0.43$, and the mascots are about 38 pt.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A paper plane. The owner: "2. A paper plane between you" | The diary filling the sheet; the pair holding it up | The owner's choice from the sketches |
| Still for now. The owner: "Still plane now, flight after (Recommended)" | Flying when the code is sent | Build 64 carries a fix nobody has seen yet, and a flight can only be judged on a phone |
| One source per colour, drawn at run time in tokens | A sticker with fixed fills, through `build-icon-components.mjs` | That pipeline fixes fills or takes one ink, and this has four tokens and two themes. **A deviation from ADR-0027's "themes remap global swatches":** the provenance stays in VectorCraft, and the theming is at render, as `Spread` already is |
| The art out of the flow | The slot sized by the art, as first built | Real Yoga, in the finish review: overflow on an iPhone SE at every sign-in, with the mascots clipped at the buttons, and the 120 pt rule never firing once the art had drawn |
| Pomo stays on the page with no scene | Leaving the pages empty there | The first version left two dashed cells and no character at the largest text sizes, an unforced regression from build 63 |
| 11 KB of bytecode for the route's dots as exported | Storing the dots' centres and building the path at run time | About 6 KB less, but it would break the line from the export to the module, and about 40 KB is left |

## 6. Verification

- [x] `npx tsc --noEmit`, lint with 0 errors, contrast, and `npx jest --ci`: 91 suites and 952 tests, all passing. That run printed one "Cannot log after tests are done" from outside the pairing suites, which don't print it on their own.
- [x] `node scripts/art/check-budgets.mjs`: 138 assets, none over.
- [x] Bytecode: 4,600,384 B, which is 11,672 B for this, and leaves 39,616 B of NFR-PERF-002.
- [x] A true-size mockup from the real exports, on three phones and in both themes. From the styles, a 393 pt iPhone has about 343 pt of room at sign-in and 314 at the code step. An iPhone SE, with its 16 pt bottom margin, has about 176 and 147, with mascots of about 55 and 46 pt, depending on its real sheet height, so whether 120 pt is the right limit is for the device.
- [x] The finish reviewer, from code, at `9de1363`: critique 29/40 (its report said 30, and its rows add to 29) and native audit 15/20, under NFR-UX-003's 16/20, disposition fix. It ran the layout in real Yoga with RN's errata on. Its fixes, all applied:
  - The art held its slot open, so the content overflowed on small iPhones.
  - The scene cut while everything else crossfaded.
  - The largest text sizes and a landscape iPhone lost the pair altogether.
  - `flexGrow` opened a scroll range under the keyboard, on every step.
  - The tests claimed more than they proved: now every state where the scene is absent has one, and so do the structure and `pointerEvents`.
  - The docs still described the old pages, and the plane's edge scaled with the art.
  - The route stopped well above Doro.
- [x] The reviewer's second pass, at `a49bd1a`: critique 32/40 and native audit 17/20, which clears NFR-UX-003's 16/20, disposition fix, for a small batch. It reran Yoga on the new structure: an iPhone SE has 176 pt at sign-in and 147 at the code step with no overflow, the 120 pt rule fires, and a 393 pt iPhone has 343 and 314. It also withdrew one overflow it had reported, since the spinner and an error never show together. Its batch, all applied after it, and not scored again:
  - Nothing tested the two links that give the slot a height, or the fade. Removing any of them would have left every test passing and no scene on a phone.
  - The spinner shrank the art on a small iPhone when Apple's button was pressed. It's out of the flow now.
  - `typing` could outlive the code step, if a session ended with the field focused.
  - The docs said the scene crossfades with every step, and only the surface had the rule about Pomo.
- [ ] **On a device, build 64:** whether the blank-sheet fix works at all; how the scene looks on every phone size, in both themes; real sheet heights on a small iPhone and the iPad; the jump in its size from the sign-in step to the code step on a small iPhone; the fade against the falling keyboard, and the keyboard covering the scene; the empty stretch above the art at sign-in on a Pro Max, given the owner's complaint about an empty middle; the 1.5 pt edge on the small plane; where the spinner lands while signing in, which on a small iPhone is over the art's top edge by about 12 pt; a VoiceOver sweep; nothing about it getting in the way of typing a code; and whether 120 pt is the right limit.

## 7. Related Docs

- [The blank sheet's record](2026-11-07-phase2-pair-sheet-blank.md)
- [D1's record](2026-11-05-phase2-d1-pairing.md)
- [ADR-0027](../architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md)
