---
id: ADR-0016
title: One unified session clock (useSessionClock) with two slots
status: accepted
date: 2026-04-19
owner: Mert Efe Şensoy
related: [ADR-0004, ADR-0015, ADR-0019, ADR-0024, ADR-0029]
---

# ADR-0016: One unified session clock (`useSessionClock`) with two slots

> **Status note:** in force. Two planned changes will replace parts of it.
> - **Phase 1 B4** (an approved plan task, not built) replaces the `setDisplayTick` re-render chain with a clock store that only a leaf `<TimerText>` subscribes to.
> - **"One session engine, modes as skins"** ([ADR-0024](0024-one-session-engine-modes-as-skins.md), proposed) would remove the two slots. That record supersedes this one once it is built.

## Context

There were two unconnected timers. `useTimer` had its own `setInterval`, `targetEndTime` and `AppState` listener, and `FlyModeScreen` had a second set. Each saved its own storage key, switching modes didn't sync them, and the plane lagged the clock by up to 950 ms through a `withTiming` (timer unification §1).

## Decision

On 2026-04-19, one wall-clock hook, `useSessionClock`, was instantiated once in `AppContext` and exposed as `session`:

- **Two slots,** `pomodoro` and `fly`, plus an `activeKind` pointer. Only the active slot drives `displayMs` and the SharedValues. The other keeps its paused state, so switching modes never overwrites a paused session.
- **One basis:** `Date.now()` for every timestamp ([ADR-0004](0004-timestamp-based-timer.md)).
- **Idempotent `fireCompletion`** ([ADR-0015](0015-idempotent-completion.md)).
- **A 1 Hz `setDisplayTick`** while a session runs, so consumers re-render and recompute `displayMs`.
- **Storage:** the new `session_clock` key, falling back to an idle state. `FLY_SESSION` is deprecated and no longer written.

## Consequences

**Positive**
- `setInterval` and `AppState.addEventListener` appear only in `useSessionClock.ts`.
- A paused Pomodoro survives a trip to Fly Mode.
- Phase 0 tests pin the behaviour: the 1 Hz countdown, the pause freeze, completion exactly once, cold-start completion and two-slot preservation.

**Negative**
- **Finding F1:** the whole app re-renders once a second. The hook returns a new object every render, and `AppContext`'s `useMemo` lists it. A settings-only component renders 14 times in a 10 s session (Phase 0 §4).
- **The same chain updates the timer text.** A careless `React.memo` would freeze the timer. `timerTextTicks` and the A1 real-screen guards exist to catch that, and each was seen to fail when `setDisplayTick` was removed.
- `session.endAtSV` follows the *active* slot, so Fly Mode needs its own fly-slot SharedValues ([ADR-0019](0019-clock-driven-plane.md)).
- `session_clock` is the most-written key, so a torn write is most likely there. A3 has a fixture for it.

## Alternatives considered

- **One slot.** Switching to Fly would lose the paused Pomodoro (timer unification §4).
- **`performance.now()`.** It can't be compared with notification fire times (timer unification §3).

## Links

- [Timer unification §1](../../implementations/2026-04-19-timer-unification.md#1-problem--motivation) · [two-slot architecture](../../implementations/2026-04-19-timer-unification.md#two-slot-architecture) · [1 Hz re-render](../../implementations/2026-04-19-timer-unification.md#1-hz-re-render-for-displayms) · [§4](../../implementations/2026-04-19-timer-unification.md#4-design-decisions)
- [Rehaul plan §1.2, finding F1](../../implementations/2026-10-29-couples-rehaul-plan.md#12-what-is-wrong-with-it) · [§4.5](../../implementations/2026-10-29-couples-rehaul-plan.md#45-re-render-strategy-f1-with-the-documented-trap-guarded)
- [Phase 0 §3.2](../../implementations/2026-10-29-phase0-foundation.md#32-tests-25-tests-5-suites-plus-1-reassure-scenario) · [§4](../../implementations/2026-10-29-phase0-foundation.md#4-measurements-the-baselines)
- [Phase 1 Stage A §3.1](../../implementations/2026-10-29-phase1-stage-a.md#31-a1-guards-on-the-real-screens) · [§3.3](../../implementations/2026-10-29-phase1-stage-a.md#33-a3-the-v131-storage-fixtures)
- [Phase 1 plan, Stage B (B4)](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates)

## Backlinks
<!-- backlinks:start -->
- [Timestamp-based timer](0004-timestamp-based-timer.md)
- [Progress ring drawn with react-native-svg stroke-dashoffset](0009-svg-progress-ring.md)
- [The plane's position is a pure function of the clock](0019-clock-driven-plane.md)
- [One session engine; modes are skins](0024-one-session-engine-modes-as-skins.md)
- [Zustand for app state, TanStack Query for server state](0029-zustand-and-tanstack-query.md)
- [Architecture decision records](README.md)
- ["Phase 1 B3: Zustand stores, hydrated synchronously from MMKV"](../../implementations/2026-10-30-phase1-b3-zustand-stores.md)
<!-- backlinks:end -->
