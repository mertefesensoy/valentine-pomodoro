---
id: IMPL-2026-11-07-phase2-pair-plane
title: "Phase 2: a paper plane between you, in the pairing sheet"
status: in-progress
date: 2026-11-07
owner: Mert Efe Şensoy
related: [IMPL-2026-11-07-phase2-pair-sheet-blank, IMPL-2026-11-05-phase2-d1-pairing, IMPL-2026-11-06-phase2-f2-testflight, ADR-0027, DESIGN-WORKFLOW]
---

# 2026-11-07 — Phase 2: a paper plane between you, in the pairing sheet

**Status:** Plan. Written before the art and the code.
**Branch:** `feat/phase2-pair-plane`, one pull request into `master`.

---

## 1. Problem / Motivation

The pairing sheet takes the full height, because it holds a flow and a keyboard. With the blank-sheet bug fixed, its content still ends about halfway down, with a large empty stretch above the buttons. The owner, on seeing it on build 63: "It had the apple's button but it was under the giant empty place just like here which makes it less alive".

They asked for "a design improvement with VectorCraft". Of three sketched directions, they chose "2. A paper plane between you". They'll rerun the whole checklist on the next build: "since we can't get paired we will do the check once again from the begining once the build is up".

## 2. What Changed

| File | Change |
|------|--------|
| `.impeccable/surfaces/app-pair-tsx.md` | The direction, and the states it changes. |
| `art/src/pair/`, `art/jobs/pair.json`, `art/vc/`, `art/out/` | The drawing, through VectorCraft. |
| `src/screens/pair/PlaneScene.tsx` | The scene, drawn in the theme's tokens. |
| `src/screens/pair/PairScreen.tsx`, `src/screens/pair/Spread.tsx` | Where it goes, and the shorter pages before sign-in. |
| `src/screens/pair/__tests__/` | When it shows. |
| `DESIGN.md` | The scene, in the design system. |

## 3. Implementation Approach

Filled in as it's built, after the owner approves the brief.

## 4. Mathematical / Statistical Details

Filled in with the route, if it's sampled.

## 5. Design Decisions

Filled in as they're made.

## 6. Verification

- [ ] Guards, and the bytecode under 4,640,000 B.
- [ ] The finish reviewer, from code.
- [ ] **On a device, build 64:** how it looks on every phone size, in both themes.

## 7. Related Docs

- [The blank sheet's record](2026-11-07-phase2-pair-sheet-blank.md)
- [D1's record](2026-11-05-phase2-d1-pairing.md)
- [ADR-0027](../architecture/adr/0027-vectorcraft-art-soundcraft-sounds.md)
