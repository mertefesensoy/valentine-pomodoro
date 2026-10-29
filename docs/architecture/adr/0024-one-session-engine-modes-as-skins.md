---
id: ADR-0024
title: One session engine; modes are skins
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0016, ADR-0022, ADR-0026]
---

# ADR-0024: One session engine; modes are skins

> **Status note:** accepted on 2026-10-29 as part of the approved rehaul plan. **Not built yet** (Phases 3–4). "Accepted" records the decision; build status is tracked in the [roadmap](../../roadmap/ROADMAP.md). Once built, it supersedes the two-slot design in [ADR-0016](0016-unified-session-clock.md).

## Context

v2 plans five modes: Classic, Shared Garden, Fly Together, Study-date Room and Shared Pet (rehaul plan §0, §3.3). Today's clock has two slots, `pomodoro` and `fly`, only because Fly and Pomodoro were built as separate timers (§3.3, §9).

## Decision

Every mode is a **skin over the same session engine** (§4.2). A mode adds visuals and a reward model, never its own clock.

| Mode | Reward model |
|------|--------------|
| Classic | Stats and streak |
| Shared Garden | Growth points, with no decay and no death |
| Fly Together | Stamps in a shared passport |
| Study-date Room | Furniture and decor |
| Shared Pet | Happiness, size and tricks, with no neglect penalties |

## Consequences

**Positive**
- One set of sync bugs instead of five (§9). A mode can't drift from the shared clock ([ADR-0022](0022-server-owns-session-time.md)).
- The phase cycle has one implementation. Phase 0's `timerPhases` tests pin it, and the engine must reproduce them: a long break every 4 focus sessions, and a skipped session never counting toward it.

**Negative**
- **TBD (owner, when Phase 3 is planned):** the engine design (§4.2) doesn't say what happens to today's two-slot behaviour, a paused Pomodoro kept while Fly runs. A Phase 0 test pins it, so it must be reproduced or deliberately dropped.
- The real-map Fly code ([ADR-0019](0019-clock-driven-plane.md)) keeps its own fly-slot SharedValues, and would have to be moved onto the engine.

## Alternatives considered

- **Keep per-mode clocks (today's two slots).** Rejected: five modes on separate clocks means five sets of sync bugs (§9).

## Links

- [Rehaul plan §3.3](../../implementations/2026-10-29-couples-rehaul-plan.md#33-modes-one-engine-five-skins) · [§4.2](../../implementations/2026-10-29-couples-rehaul-plan.md#42-the-shared-session-engine-the-core-of-v2) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions)
- [`PRODUCT.md`, product principles](../../../PRODUCT.md#product-principles)
- [Timer unification, two-slot architecture](../../implementations/2026-04-19-timer-unification.md#two-slot-architecture)
- [Phase 0 §3.2](../../implementations/2026-10-29-phase0-foundation.md#32-tests-25-tests-5-suites-plus-1-reassure-scenario)
- Replaces, when built: [ADR-0016](0016-unified-session-clock.md)

## Backlinks
<!-- backlinks:start -->
- [One unified session clock (useSessionClock) with two slots](0016-unified-session-clock.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
