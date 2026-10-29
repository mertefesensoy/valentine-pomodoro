---
id: ADR-0026
title: An illustrated map for everyone; the real map as a phone-only Plus extra
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0017, ADR-0018, ADR-0019, ADR-0024, ADR-0025, ADR-0031, ADR-0036, ADR-0037]
---

# ADR-0026: An illustrated map for everyone; the real map as a phone-only Plus extra

## Context

Fly Mode flies a plane over a real map using `react-native-maps`.
- **Crash-prone.** The AIRMap crash class needed a JS rule and native patches ([ADR-0017](0017-no-null-in-mapview-child-map.md)).
- **No web.** It has no web implementation.
- **A key on Android.** It needs a Google Maps key there, and opening it on Android without one crashed.
- **Heavy.** It carries a 648 KB `airports.json`.

## Decision

The owner's decision on 2026-10-29 (rehaul plan §0; "Your decision" in §9):
- **An illustrated kawaii map for everyone** in Fly Together.
- **The real map stays as a phone-only Plus extra,** loaded lazily, behind a feature flag, and built last in Phase 4 (4c).

The plan's design for the illustrated map (§4.8; Phase 4b; not built):
- **The art.** One VectorCraft world artboard exported as SVG, plus landmark doodles.
- **Projection.** Equirectangular, $x = \tfrac{\lambda + 180}{360} W$ and $y = \tfrac{90 - \varphi}{180} H$. The great-circle maths in `geoMath.ts` is reused unchanged, and the polyline is split at ±180° (§8.8).
- **Cities.** A curated list of about 150–250 cities (an estimated 15–25 KB) replaces `airports.json` on the default path.
- **Pan and zoom.** A Reanimated transform on one SVG group, with no native map view.

## Consequences

**Positive**
- The AIRMap crash class can't occur on the default path, and the map works on the web and on Android without a key.
- The heavy dataset and the map stack leave the default path.

**Negative**
- Two map stacks to maintain, a risk the plan tracks (§10). The real map inherits device-backlog Tasks 2–4, the `useCameraController` Android parity work and the worklet/JS equivalence test.
- Fly Mode, free on iOS today, becomes part of Plus ([ADR-0025](0025-couple-subscription-and-capped-ads.md)).
- If 4b lands before Android returns, the Maps key and Android camera tasks (AN2, AN3) may be needed only for the real-map option (Phase 1 §3b).

## Alternatives considered

- **The real map only.** It keeps the crash class and the web blocker on the default path (§9).
- **The illustrated map only.** It drops the real map that fans like (§9).

## Links

- [Rehaul plan §0](../../implementations/2026-10-29-couples-rehaul-plan.md#0-decisions-you-made-2026-10-29) · [§4.8](../../implementations/2026-10-29-couples-rehaul-plan.md#48-fly-together-illustrated-map-plus-the-real-map-as-a-plus-extra) · [§8.8](../../implementations/2026-10-29-couples-rehaul-plan.md#88-illustrated-map-projection) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions) · [§10](../../implementations/2026-10-29-couples-rehaul-plan.md#10-risks)
- [Phase 1 plan §3b](../../implementations/2026-10-29-phase1-plan.md#3b-deferred-android-after-v14)
- [Hide Fly Mode where it can't open §1](../../implementations/2026-10-29-android-hide-fly-mode.md#1-problem--motivation)

## Backlinks
<!-- backlinks:start -->
- [Move airports.json out of the JS bundle](0036-airports-json-out-of-bundle.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
