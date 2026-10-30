---
id: ADR-0009
title: Progress ring drawn with react-native-svg stroke-dashoffset
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0014, ADR-0016, ADR-0029]
---

# ADR-0009: Progress ring drawn with react-native-svg `stroke-dashoffset`

> **Status note:** still in force. Phase 1 B4 (built locally, 2026-10-30; [record](../../implementations/2026-10-30-phase1-b4-rerender-refactor.md)) changed how the ring is *driven*: `strokeDashoffset` is a Reanimated animated prop, computed on the UI thread every frame from the slot's `endAt`, instead of a prop set by a React render each second. The SVG drawing is unchanged.

## Context

The timer needs a circular progress ring in the Valentine colours, on iOS, Android and the web, without a heavy dependency (DECISIONS §9).

## Decision

Draw the ring with `react-native-svg`, animating the circle's `stroke-dashoffset`. No Canvas, and no ring library. DECISIONS §9 adds that v1 animates it with React Native's built-in Animated API, and could move to Reanimated if performance demanded.

As built, which differs from that note:
- `src/components/CircularProgress.tsx` draws two SVG `Circle`s.
- It computes $\text{dashOffset} = 2\pi r\,(1 - p)$ in a `useMemo`, for progress $p \in [0, 1]$. There is no Animated wrapper.
- So the ring moves when `TimerScreen` re-renders, which the 1 Hz session tick drives. The Timer screen commits once per tick (Stage A §3.2).

## Consequences

**Positive**
- No ring or chart dependency. `react-native-svg` also draws the Stats goal line and Fly Mode's icons.
- Full control over styling, and it works on the web.

**Negative**
- The ring is only as smooth as the React render cadence, one step a second, and it depends on the same re-render chain as finding F1 ([ADR-0016](0016-unified-session-clock.md)).
- The plan's fix (rehaul plan §4.5; Phase 1 B4) drives the ring and every mode animation from SharedValues computed from `endAt`, with zero React renders per frame. That depends on the store split in [ADR-0029](0029-zustand-and-tanstack-query.md).

## Alternatives considered

- **`react-native-circular-progress`.** An unnecessary dependency (DECISIONS §9).
- **Canvas.** Not chosen; no reason is recorded beyond "lightweight".

## Links

- [`DECISIONS.md` §9](../../../DECISIONS.md#9-progress-ring-svg-stroke-animation)
- [Rehaul plan §4.5](../../implementations/2026-10-29-couples-rehaul-plan.md#45-re-render-strategy-f1-with-the-documented-trap-guarded)
- [Phase 1 plan, Stage B (B4)](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates)
- [Phase 1 Stage A §3.2, render counts](../../implementations/2026-10-29-phase1-stage-a.md#32-a2-the-wider-reassure-baseline)

## Backlinks
<!-- backlinks:start -->
- [Hand-built 7-day bar chart, no chart library](0014-hand-built-bar-chart.md)
- [Architecture decision records](README.md)
- ["Phase 1 B4: the re-render refactor (clock store, UI-thread ring, frozen tabs)"](../../implementations/2026-10-30-phase1-b4-rerender-refactor.md)
<!-- backlinks:end -->
