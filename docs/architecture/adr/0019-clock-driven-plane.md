---
id: ADR-0019
title: The plane's position is a pure function of the clock
status: accepted
date: 2026-04-20
owner: Mert Efe Şensoy
related: [ADR-0004, ADR-0016, ADR-0018, ADR-0026]
---

# ADR-0019: The plane's position is a pure function of the clock

## Context

The unified clock ([ADR-0016](0016-unified-session-clock.md)) removed Fly Mode's own ticker, and with it the `withTiming` that moved `progressSV`. After that the plane stayed at its origin.

There was a second problem. `session.isRunningSV` and `session.endAtSV` follow the *active* slot. With Fly paused and a Pomodoro running, reading them would fly the plane on Pomodoro's clock (plane doc §1).

## Decision

On 2026-04-20, a `useFrameCallback` worklet computes progress from the clock on every frame:

$$R = \max(0,\ \text{flyEndAt} - \text{Date.now()}),\qquad p = \operatorname{clamp}\!\left(\tfrac{D - R}{D},\ 0,\ 1\right)$$

Here $D$ is the fly session's duration.

- **Fly's own clock.** Fly-slot SharedValues (`flyEndAtSV`, `flyDurationSV`, `flyIsRunningSV`) are written from `session.state.fly`. They never reflect Pomodoro.
- **Rotation every frame.** `bearingSV` is written at 60 fps.
- **Marker updates.** The marker coordinate goes to JS through `runOnJS` at `MARKER_HZ = 15`. The rate is set by a delta-time accumulator that *subtracts* the 66.67 ms threshold, so drift stays within one frame.
- **Position along the route.** `interpolateAlongPathWorklet` mirrors `geoMath.ts:interpolateAlongPath` on the UI thread.

## Consequences

**Positive**
- The plane is in the right place after a pause or the background, with no catch-up animation.
- It reaches the destination within about one frame of `onComplete`, because both read `Date.now()`.
- The update cadence doesn't depend on the frame rate.

**Negative**
- The interpolation maths now exists twice, and "keep in sync" was the only guard. Phase 0 moved the worklet into `src/utils/geoMathWorklet.ts` and added an equivalence test: 5 routes × 210 progress values, plus antimeridian continuity (Phase 0 §3.2).
- Static review here found a TDZ crash that had shipped latent since Task 3 (plane doc §5). That is the evidence behind running device checks per task ([ADR-0011](0011-real-device-testing.md)).

## Alternatives considered

- **Read `session.endAtSV`.** It is the wrong clock whenever Pomodoro is the active slot.
- **`info.timestamp` or `performance.now()`.** A different time origin from `flyEndAtSV` and the notifications.
- **A frame-count modulo (`% 6`).** It assumes 60 fps. **A higher `MARKER_HZ`.** Each marker update costs a native map draw.

## Links

- [Clock-driven plane §1](../../implementations/2026-04-20-plane-clock-driven.md#1-problem--motivation) · [fly-slot isolation](../../implementations/2026-04-20-plane-clock-driven.md#fly-slot-isolation) · [accumulator](../../implementations/2026-04-20-plane-clock-driven.md#delta-time-accumulator-15-hz-runonjs-throttle) · [§4](../../implementations/2026-04-20-plane-clock-driven.md#4-mathematical-details) · [§5](../../implementations/2026-04-20-plane-clock-driven.md#5-design-decisions)
- [Phase 0 §3.2](../../implementations/2026-10-29-phase0-foundation.md#32-tests-25-tests-5-suites-plus-1-reassure-scenario)
- [Rehaul plan §4.8](../../implementations/2026-10-29-couples-rehaul-plan.md#48-fly-together-illustrated-map-plus-the-real-map-as-a-plus-extra): the illustrated map reuses `geoMath.ts` unchanged

## Backlinks
<!-- backlinks:start -->
- [Timestamp-based timer](0004-timestamp-based-timer.md)
- [One unified session clock (useSessionClock) with two slots](0016-unified-session-clock.md)
- [One session engine; modes are skins](0024-one-session-engine-modes-as-skins.md)
- [Architecture decision records](README.md)
- ["Phase 1 B4: the re-render refactor (clock store, UI-thread ring, frozen tabs)"](../../implementations/2026-10-30-phase1-b4-rerender-refactor.md)
<!-- backlinks:end -->
