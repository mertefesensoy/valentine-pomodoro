---
id: ADR-0036
title: Move airports.json out of the JS bundle
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0026, ADR-0031, ADR-0037]
---

# ADR-0036: Move `airports.json` out of the JS bundle

> **Status note:** accepted as the owner's decision. It is not built yet: it is Phase 1 task B1b. The B1 doc links a B1b record, `2026-10-29-phase1-b1b-airports-asset.md`, which doesn't exist yet.

## Context

**Finding 1 of the Phase 1 plan:** lazy loading does not shrink the native bundle. On iOS and Android, Hermes ships one precompiled bytecode bundle, and `React.lazy` defers only *when* a module is evaluated ([ADR-0031](0031-lazy-fly-mode.md)).

That leaves two gaps:
- **The upgrade's growth stays.** B1 alone can't recover the about 19 % of bytecode the SDK 58 upgrade added.
- **The budget is out of reach.** B1 also can't meet the rehaul plan's "≥ 25 % smaller startup bundle", a target that assumed chunking, which exists only on the web (rehaul plan §6.2).

The largest single module is the 648 KB `airports.json`.

## Decision

The owner's decision on 2026-10-29 (Phase 1 plan §0 and §5: "your call"): **task B1b**.
- **Where the data goes.** The 648 KB file becomes a bundled asset loaded through `expo-asset`, and Metro stops compiling it into the Hermes bytecode on every platform.
- **When it is read.** The first time Fly opens, it is read and parsed, then kept in memory.
- **The real map is unchanged** until Phase 4b replaces the dataset with the curated city list ([ADR-0026](0026-illustrated-map-real-map-plus.md)).
- **The budget is redrawn.** The bundle budget is re-baselined against the measured result.

## Consequences

**Positive**
- The bytecode gets smaller, measured with the pinned export command before and after (`npx expo export --platform ios --platform android --dump-sourcemap`).
- The parse stays off the cold-start path.

**Negative**
- The first open of Fly does a file read and a JSON parse that used to be a module evaluation. Airport search must work exactly as before.
- **A guard against data changes.** The A1 Fly guard asserts its IST → LUZ precondition (exactly 25 minutes) with the app's own formula, so a change to the airport data fails with a clear message (Stage A §3.1).
- About a day of work, added to a release that already carries a lot of change.

## Alternatives considered

- **Rely on lazy evaluation alone (B1).** It removes the JSON from the cold-start path, but not from the bytecode (Phase 1 plan §5).
- **Wait for the Phase 4b city list.** That replaces the dataset only on the illustrated map's default path, phases later (rehaul plan §4.8).

## Links

- [Phase 1 plan §0](../../implementations/2026-10-29-phase1-plan.md#0-decisions-you-made-2026-10-29) · [Stage B (B1b)](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates) · [§5, finding 1](../../implementations/2026-10-29-phase1-plan.md#5-design-decisions-and-findings)
- [Lazy Fly Mode §1](../../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md#1-problem--motivation) · [§4](../../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md#4-mathematical--statistical-details)
- [SDK 58 upgrade §5, finding 3](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#5-findings)
- [Rehaul plan §4.8](../../implementations/2026-10-29-couples-rehaul-plan.md#48-fly-together-illustrated-map-plus-the-real-map-as-a-plus-extra) · [§6.2](../../implementations/2026-10-29-couples-rehaul-plan.md#62-budgets-initial-targets-revised-after-the-phase-0-baseline)
- [Phase 1 Stage A §3.1](../../implementations/2026-10-29-phase1-stage-a.md#31-a1-guards-on-the-real-screens)

## Backlinks
<!-- backlinks:start -->
- [Load Fly Mode lazily](0031-lazy-fly-mode.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
