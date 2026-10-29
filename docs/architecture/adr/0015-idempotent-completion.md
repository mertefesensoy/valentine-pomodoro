---
id: ADR-0015
title: Session completion is idempotent
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0004, ADR-0006, ADR-0010, ADR-0016, ADR-0022, ADR-0029]
---

# ADR-0015: Session completion is idempotent

## Context

More than one code path can notice that a session has ended:
- the in-app interval
- the `AppState` "active" listener when the app returns to the foreground (added in v1 Phase 4, `1695dda`)
- the cold-start restore

Each detection credits stats and shows a love note, so without a guard one session could be counted twice. The decision is not one of the 15 in `DECISIONS.md`. The rehaul plan lists it with the v1 plan's decisions (§2.1). Git dates it to 2026-01-07, commit `93770a1`, "Add idempotency check to prevent double-completion".

## Decision

A session's completion is handled at most once, guarded at each layer:

1. **Timer (2026-01-07, `93770a1`):** `lastHandledEndAt`, so a completion is handled once per `endAt`. Today the field survives only on the legacy `TimerState` type.
2. **Stats (`d52f707`, 2026-02-17):** `incrementFocus` ignores a session id equal to `lastAppliedSessionId`.
3. **Clock (2026-04-19):** `fireCompletion` clears the slot synchronously, so a second caller returns early (timer unification §3).

## Consequences

**Positive**
- Pinned by a Phase 0 test: completion fires once when the foreground event and the ticker both see the end (Phase 0 §3.2).
- It carries into v2. There it becomes a database constraint, a unique key on `session_credits (session_id, user_id)`, so double-crediting is impossible even when the app is killed mid-flight (rehaul plan §4.2, proposed).

**Negative**
- **A hole:** `useStats` drops `lastAppliedSessionId` on every launch. Its v2 load branch rebuilds `{ days, goalMinutes, streak }`. A completion re-fired across a restart could count twice, though the window is narrow. B3's stats store should keep the field (Stage A §7).
- The `live.endAt !== slot.endAt` guard can't currently be reached. Removing it breaks no test, so it is defence in depth only (Phase 0 §3.2).

## Alternatives considered

- **A single completion path.** Not recorded as considered, and not possible here: the interval doesn't run in the background, so the foreground check has to exist ([ADR-0004](0004-timestamp-based-timer.md)).
- **v2: a client-side guard only.** The plan chooses a database unique key instead (rehaul plan §4.2).

## Links

- [Timer unification: idempotent completion](../../implementations/2026-04-19-timer-unification.md#idempotent-completion)
- [Phase 0 §3.2](../../implementations/2026-10-29-phase0-foundation.md#32-tests-25-tests-5-suites-plus-1-reassure-scenario)
- [Phase 1 Stage A §7, finding 1](../../implementations/2026-10-29-phase1-stage-a.md#7-findings-for-later-sessions)
- [Rehaul plan §2.1](../../implementations/2026-10-29-couples-rehaul-plan.md#21-planmd-2026-01-07-v1-build-plan) · [§4.2, crediting stats](../../implementations/2026-10-29-couples-rehaul-plan.md#42-the-shared-session-engine-the-core-of-v2)

## Backlinks
<!-- backlinks:start -->
- [One unified session clock (useSessionClock) with two slots](0016-unified-session-clock.md)
- [Zustand for app state, TanStack Query for server state](0029-zustand-and-tanstack-query.md)
- [Architecture decision records](README.md)
- ["Phase 1 B3: Zustand stores, hydrated synchronously from MMKV"](../../implementations/2026-10-30-phase1-b3-zustand-stores.md)
<!-- backlinks:end -->
