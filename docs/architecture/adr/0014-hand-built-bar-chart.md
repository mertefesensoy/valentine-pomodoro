---
id: ADR-0014
title: Hand-built 7-day bar chart, no chart library
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0009, ADR-0010]
---

# ADR-0014: Hand-built 7-day bar chart, no chart library

## Context

The Stats screen shows the last 7 days as bars, styled in the app's own theme. Seven bars is a small layout (DECISIONS §15).

## Decision

Build the chart from React Native `View`s, with no Victory, Recharts or other charting library (DECISIONS §15).

Open question Q3 (sessions or minutes on the axis) was settled by a toggle (rehaul plan §2.2).

As built (`StatsScreen.tsx`):
- The bars are `View`s.
- The daily-goal line is a single SVG `Line`, using the `react-native-svg` the ring already needs ([ADR-0009](0009-svg-progress-ring.md)).
- `Metric = 'sessions' | 'minutes'` is the Q3 toggle. It defaults to minutes, and the goal line shows only in minutes.

## Consequences

**Positive**
- No chart dependency. DECISIONS.md estimates Victory Native at about 200 KB.
- Full control over the styling.

**Negative**
- Every chart is hand-built. Plus promises monthly and yearly charts (rehaul plan §3.4), and they would be hand-built too unless a later decision changes this. The rehaul plan lists "no chart library" among the v1 decisions but revisits only fonts (§2.1).
- Hand-rolled layout carries its own layout bugs. On Android 15, where edge-to-edge is enforced, a white band above the tab bar hides the 7-day bars. That fix waits with the rest of Android (SDK 58 upgrade §6.3; Phase 1 §3b, AN4).

## Alternatives considered

- **Victory Native.** About 200 KB, overkill for 7 bars (DECISIONS §15).
- **Q3, either axis alone.** DECISIONS.md recommended session count. The shipped toggle offers both.

## Links

- [`DECISIONS.md` §15](../../../DECISIONS.md#15-chart-style-simple-bars-no-library) · [Q3](../../../DECISIONS.md#q3-chart-granularity)
- [Rehaul plan §2.1](../../implementations/2026-10-29-couples-rehaul-plan.md#21-planmd-2026-01-07-v1-build-plan) · [§2.2](../../implementations/2026-10-29-couples-rehaul-plan.md#22-decisionsmd) · [§3.4](../../implementations/2026-10-29-couples-rehaul-plan.md#34-free-vs-plus)
- [SDK 58 upgrade §6.3](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#63-device-checks-yours)
- [Phase 1 plan §3b](../../implementations/2026-10-29-phase1-plan.md#3b-deferred-android-after-v14)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
