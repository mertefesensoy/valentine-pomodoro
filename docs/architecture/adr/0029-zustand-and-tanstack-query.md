---
id: ADR-0029
title: Zustand for app state, TanStack Query for server state
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0015, ADR-0016, ADR-0021, ADR-0028, ADR-0030]
---

# ADR-0029: Zustand for app state, TanStack Query for server state

> **Status note:** accepted on 2026-10-29 as part of the approved rehaul plan and Phase 1 plan. "Accepted" records the decision; build status is tracked in the [roadmap](../../roadmap/ROADMAP.md).
> - **Zustand: built in Phase 1 B3** (2026-10-30, `71d836f`…`e04cc8c`, [B3 record](../../implementations/2026-10-30-phase1-b3-zustand-stores.md)). Five stores, hydrated synchronously from MMKV by `StoreGate`. `AppContext` was a shim for one commit, then deleted. The stats store keeps `lastAppliedSessionId`. With selectors, the settings-only Reassure scenario dropped from 14 renders to 1.
> - **TanStack Query** arrives with the backend (Phases 2–3) and appears only in the rehaul plan. Not built.

## Context

One `AppContext` holds everything. Every second of a running session changes its value, so every `useApp()` consumer re-renders, hidden tabs included (finding F1, [ADR-0016](0016-unified-session-clock.md)). Measured: a component that reads only settings renders 14 times in a 10 s session, and so do the Timer, Stats and Notes screens. Settings renders 15 times (Stage A §3.2).

## Decision

- **App state: Zustand stores read through selectors.** The stores are settings, notes, stats, session/clock and UI. They hydrate synchronously from MMKV ([ADR-0030](0030-mmkv-storage.md)), so the first frame needs no loading state. During the move `AppContext` becomes a thin shim, then it is deleted. All six `useApp()` consumers move to selectors (B3).
- **Server state: TanStack Query.**
  - Its cache is persisted to MMKV.
  - Realtime rows are applied with `setQueryData`, so no refetch storms happen.
  - History and notes use `useInfiniteQuery` with keyset cursors.
  - Stale times run from `Infinity` for a live session to 24 h for static catalogues (rehaul plan §4.4).

## Consequences

**Positive**
- Selectors fix F1 structurally. After B4, the settings-only scenario's target is ≤ 2 renders, down from 14 (Phase 1 plan §4.3).
- TanStack Query brings caching, deduplication, retries, offline replay and pagination (§9).

**Negative**
- The stats store must keep `lastAppliedSessionId`, which today's loader drops (Stage A §7, [ADR-0015](0015-idempotent-completion.md)).
- The render chain that moves the timer text is replaced on purpose, so the B4 order matters. The A1 guards and the Reassure baseline must exist first, and they do.

## Alternatives considered

- **Keep Context.** It is the cause of F1 (§9).
- **Redux Toolkit.** Heavier than this app needs (§9).
- **Jotai.** Listed in §9 without a reason recorded beyond the choice above.

## Links

- [Rehaul plan §4.1](../../implementations/2026-10-29-couples-rehaul-plan.md#41-stack-changes) · [§4.4](../../implementations/2026-10-29-couples-rehaul-plan.md#44-client-data-layer) · [§4.5](../../implementations/2026-10-29-couples-rehaul-plan.md#45-re-render-strategy-f1-with-the-documented-trap-guarded) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions)
- [Phase 1 plan, Stage B (B3, B4)](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates) · [§4.3](../../implementations/2026-10-29-phase1-plan.md#43-render-count-target-b4-reassure)
- [Phase 1 Stage A §3.2](../../implementations/2026-10-29-phase1-stage-a.md#32-a2-the-wider-reassure-baseline) · [§7](../../implementations/2026-10-29-phase1-stage-a.md#7-findings-for-later-sessions)

## Backlinks
<!-- backlinks:start -->
- [Progress ring drawn with react-native-svg stroke-dashoffset](0009-svg-progress-ring.md)
- [Architecture decision records](README.md)
- ["Phase 1 B3: Zustand stores, hydrated synchronously from MMKV"](../../implementations/2026-10-30-phase1-b3-zustand-stores.md)
<!-- backlinks:end -->
