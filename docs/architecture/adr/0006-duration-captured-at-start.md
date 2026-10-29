---
id: ADR-0006
title: Capture the planned duration when a session starts
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0010, ADR-0015, ADR-0022]
---

# ADR-0006: Capture the planned duration when a session starts

## Context

Focus duration is a setting the user can change at any time, including in the middle of the day or the middle of a session. Stats must record the duration that was actually used. DECISIONS §5 gives the failing case: three 25-minute sessions (75 min), then the setting changes to 30, and stats read from the current setting would show 90 min.

## Decision

Store `sessionPlannedMinutes` when a session starts, and credit stats from it, never from the current settings value (DECISIONS §5).

As built:
- `useTimer.start` writes `sessionPlannedMinutes: durationMinutes` onto the Pomodoro slot.
- The completion handler credits a completed focus session with `incrementFocus(slot.sessionPlannedMinutes, dayKey, slot.sessionId)`.

## Consequences

**Positive**
- Changing a setting never rewrites history.
- It carries into v2 (rehaul plan §2.1). The server-side session row stores `duration_ms` for the same reason (rehaul plan §4.2).

**Negative**
- The credit is the planned length of a completed focus session, not the time actually spent. v2's shared sessions credit each partner with the minutes they were present instead ($\text{credit}_u = \lfloor \tfrac{1}{60000}\sum_{I \in F} |I \cap J_u| \rfloor$, rehaul plan §8.3, proposed with [ADR-0022](0022-server-owns-session-time.md)).
- One more field per slot has to survive persistence and migration. The A3 fixtures carry it inside `session_clock` (Stage A §3.3).

## Alternatives considered

- **Read the current setting at completion time.** Stats would change retroactively whenever the setting changed (DECISIONS §5).

## Links

- [`DECISIONS.md` §5](../../../DECISIONS.md#5-session-duration-capture)
- [Rehaul plan §2.1](../../implementations/2026-10-29-couples-rehaul-plan.md#21-planmd-2026-01-07-v1-build-plan) · [§4.2](../../implementations/2026-10-29-couples-rehaul-plan.md#42-the-shared-session-engine-the-core-of-v2) · [§8.3](../../implementations/2026-10-29-couples-rehaul-plan.md#83-per-partner-credit-in-a-shared-session)
- [Phase 1 Stage A §3.3, the storage fixtures](../../implementations/2026-10-29-phase1-stage-a.md#33-a3-the-v131-storage-fixtures)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
