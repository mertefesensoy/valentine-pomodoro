---
id: ADR-0004
title: Timestamp-based timer
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0015, ADR-0016, ADR-0019, ADR-0022]
---

# ADR-0004: Timestamp-based timer

## Context

A Pomodoro timer has to keep correct time while the phone is locked or the app is in the background. On mobile, `setInterval` pauses in the background, so a decrementing counter drifts and cannot reliably catch up on missed ticks (DECISIONS §3).

## Decision

Store the end of the session as an absolute timestamp, `endAt`, and compute what is left:

$$\text{remainingMs} = \text{endAt} - \text{Date.now()}$$

`endAt` is the single source of truth, and the value is recomputed when the app returns to the foreground.

As built: the unified session clock ([ADR-0016](0016-unified-session-clock.md)) keeps this basis.
- Every timestamp comes from `Date.now()`, and the display is `max(0, endAt − Date.now())`. `performance.now()` was rejected because it can't be compared with notification fire times.
- In `useSessionClock.ts`, pause clears `endAt` and stores `pausedRemainingMs = max(0, endAt − Date.now())`. Resume sets `endAt = Date.now() + pausedRemainingMs`.

## Consequences

**Positive**
- Correct after backgrounding, and immune to missed interval ticks.
- The same basis drives the Fly plane ([ADR-0019](0019-clock-driven-plane.md)) and the notification schedule.
- It carries into v2 unchanged (rehaul plan §2.1). The plan generalises it as "the server owns time" ([ADR-0022](0022-server-owns-session-time.md), proposed).

**Negative**
- The display still needs something to re-render it. Until Phase 1 that was a 1 Hz `setDisplayTick`, which re-rendered the whole app every second (finding F1, [ADR-0016](0016-unified-session-clock.md)); since B4 only the `<TimerText>` leaf re-renders, once per displayed second.
- The free-running interval ticks on a phase unrelated to `endAt`, so the shown second can lag the true one by up to 999 ms. Phase 1 B4 (built 2026-10-30, pushed) replaced it with a clock store that wakes ε = 4 ms after each displayed-second boundary, so the lag is at most ε plus the timer's latency ([Phase 1 plan §4.2](../../implementations/2026-10-29-phase1-plan.md#42-when-the-clock-store-emits-b4), corrected in B4).
- `Date.now()` is the phone's own clock. Phone clocks drift and users can change them, which is why v2 moves shared time to the server (rehaul plan §9).

## Alternatives considered

- **Decrement a counter on each interval tick.** It pauses in the background, accumulates drift, and has no reliable way to catch up (DECISIONS §3).

## Links

- [`DECISIONS.md` §3](../../../DECISIONS.md#3-timer-implementation-timestamp-based)
- [Timer unification: a single `Date.now()` basis](../../implementations/2026-04-19-timer-unification.md#single-datenow-basis)
- [Rehaul plan §2.1](../../implementations/2026-10-29-couples-rehaul-plan.md#21-planmd-2026-01-07-v1-build-plan) · [§4.2](../../implementations/2026-10-29-couples-rehaul-plan.md#42-the-shared-session-engine-the-core-of-v2) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions)
- [Phase 1 plan §4.2, when the clock store emits](../../implementations/2026-10-29-phase1-plan.md#42-when-the-clock-store-emits-b4)

## Backlinks
<!-- backlinks:start -->
- [Track and cancel only the session's own notification](0005-notification-id-tracking.md)
- [Session completion is idempotent](0015-idempotent-completion.md)
- [One unified session clock (useSessionClock) with two slots](0016-unified-session-clock.md)
- [The server owns session time in the shared room](0022-server-owns-session-time.md)
- [Architecture decision records](README.md)
- ["Phase 1 B4: the re-render refactor (clock store, UI-thread ring, frozen tabs)"](../../implementations/2026-10-30-phase1-b4-rerender-refactor.md)
<!-- backlinks:end -->
