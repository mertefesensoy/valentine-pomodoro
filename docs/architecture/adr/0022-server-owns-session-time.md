---
id: ADR-0022
title: The server owns session time in the shared room
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0004, ADR-0015, ADR-0021, ADR-0023, ADR-0024]
---

# ADR-0022: The server owns session time in the shared room

> **Status note:** accepted on 2026-10-29 as part of the approved rehaul plan. **Not built yet** (Phase 3). "Accepted" records the decision; build status is tracked in the [roadmap](../../roadmap/ROADMAP.md).

## Context

Two phones have to show the same session and agree on every pause, skip and end. Phone clocks drift and can be changed by their users (§9).

## Decision

**The server owns time.** Clients never send timestamps. Every command is a Postgres RPC that uses `now()`, and clients only *display* time, corrected for their clock offset. It is v1's "`endAt` is the source of truth" ([ADR-0004](0004-timestamp-based-timer.md)), moved to the server (§4.2).

- **Commands:** `session_start`, `session_pause`, `session_resume`, `session_skip` and `session_stop`.
- **Idempotent, with optimistic concurrency.** Each runs `UPDATE … SET …, version = version + 1 WHERE id = $id AND version = $expected`. If 0 rows change, the client re-reads; if the row is already in the requested state, the command counts as a success (§8.2).
- **Realtime carries state changes only,** never ticks: about 6 messages per session.

**The maths (§8.1–8.2).**
- **Offset.** The client records $t_0$, gets the server time $s$, and records $t_1$. Then $\hat\theta = s - \tfrac{t_0 + t_1}{2}$, and $|\hat\theta - \theta| \le \delta/2$ for a round trip $\delta = t_1 - t_0$. Keep the best of 5 samples.
- **Skew** between two phones is at most $\delta_A/2 + \delta_B/2$. The target is 250 ms.
- **End time.** With duration $D$, start $S$ and total paused time $P$: $\text{ends\_at} = S + D + P$.
- **What the client shows.** Running: $\max(0, \text{ends\_at} - \text{now}_s)$. Paused: $\text{ends\_at} - p$.

## Consequences

**Positive**
- "Both phones agree" becomes provable, not hoped for.
- A double tap on Pause resolves silently: one wins, and the other gets the paused state back.

**Negative**
- Shared sessions depend on the network. Commands made offline are queued and replayed with `expected_version`, the server state wins, and the UI explains what happened (§4.2).
- Skew depends on round-trip times. With mobile round trips of up to 300 ms, the bound is 300 ms, above the 250 ms target. Best-of-5 sampling "usually lands well below it" (§8.1), which Phase 3's two-device exit check has to confirm.

## Alternatives considered

- **Clients broadcast their own timestamps.** Rejected: clocks drift (§9).
- **Peer-to-peer sync.** Rejected for the same reason (§9).

## Links

- [Rehaul plan §0](../../implementations/2026-10-29-couples-rehaul-plan.md#0-decisions-you-made-2026-10-29) · [§4.2](../../implementations/2026-10-29-couples-rehaul-plan.md#42-the-shared-session-engine-the-core-of-v2) · [§8.1](../../implementations/2026-10-29-couples-rehaul-plan.md#81-clock-offset-estimation-ntp-style) · [§8.2](../../implementations/2026-10-29-couples-rehaul-plan.md#82-shared-remaining-time-and-concurrency) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions)
- [`PRODUCT.md`, positioning](../../../PRODUCT.md#positioning)

## Backlinks
<!-- backlinks:start -->
- [Timestamp-based timer](0004-timestamp-based-timer.md)
- [Capture the planned duration when a session starts](0006-duration-captured-at-start.md)
- [One session engine; modes are skins](0024-one-session-engine-modes-as-skins.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
