---
id: IMPL-2026-11-05-phase2-d1-pairing
title: "Phase 2 D1: Sign in with Apple and pairing by code"
status: in-progress
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-a3-design, IMPL-2026-11-05-phase2-c1-client, ADR-0049, DESIGN-WORKFLOW, SRS]
---

# 2026-11-05 — Phase 2 D1: Sign in with Apple and pairing by code

**Status:** In progress. Written before the code.
**Branch:** `feat/phase2-d1-pairing`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, D1](2026-11-05-phase2-plan.md#stage-d-the-screens-behind-the-flag). Its brief and direction contract: `.impeccable/surfaces/app-pair-tsx.md`, approved by the owner on 2026-11-05 ("Approve it").

---

## 1. Problem / Motivation

This is the moment 1.5.0 exists for. Two people who have only ever used the app alone sign in, exchange a code and become a couple, without either of them having to work out who invites whom. It has to be hard to pair with the wrong person, and it must never touch a solo user.

Requirements: [FR-ACC-002](../srs/SRS.md#fr-acc-002), [FR-PAR-001](../srs/SRS.md#fr-par-001), [FR-PAR-002](../srs/SRS.md#fr-par-002).

## 2. What Changed

| File | Change |
|------|--------|
| `app/pair.tsx`, `app/paired.tsx` | New routes. Each loads its screen with `React.lazy`, so a solo launch evaluates neither. |
| `app/_layout.tsx` | Registers them: a form sheet, and a full-screen fade. |
| `src/navigation/sheetOptions.ts` | The pairing sheet's options. |
| `src/screens/pair/PairScreen.tsx` | New: the sheet and its steps. |
| `src/screens/pair/Spread.tsx`, `src/screens/pair/CodeCells.tsx` | New: the two pages and the fixed cells. |
| `src/screens/pair/pairing.ts` | New: what the screen does, on the server's functions, with its statuses. |
| `src/screens/pair/PairedScreen.tsx` | New: the first pairing's morph, from the open spread. |
| `src/screens/welcome/WelcomeScreen.tsx`, `src/screens/welcome/MorphStage.tsx` | The welcome's stage is pulled out, so that both can use it. The welcome doesn't change. |
| `src/screens/TimerScreen.tsx`, `src/screens/classic/SpreadPages.tsx` | The idle strip's "Pair with your partner" line, the flag's first reader. |
| `src/server/account.ts` | A small store, so that the strip re-renders at sign-in. |
| `src/i18n/en.json`, `src/i18n/tr.json` | The words, drafts for the copy proof (D6). |
| `eslint.config.js` | The rule also covers the lazy screens, so a route can't import them statically. |
| `src/screens/pair/__tests__/*`, `src/server/__tests__/soloLaunch.test.tsx` | The flow's states, and a solo launch through the router. |

## 3. Implementation Approach

To be filled in as it's built.

## 5. Design Decisions

To be filled in as it's built.

## 6. Verification

- [ ] The flow's tests, the solo launch through the router, and the guards.
- [ ] **Needs a device, at Stage F's first build:** the finish review, at the largest text size, with Reduce Motion and with VoiceOver.

## 7. Related Docs

- [A3's record](2026-11-05-phase2-a3-design.md), [C1's record](2026-11-05-phase2-c1-client.md), [Phase 2 plan](2026-11-05-phase2-plan.md), D1
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md)
