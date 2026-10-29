---
id: ADR-0010
title: Stats stored as a per-day map keyed by YYYY-MM-DD
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0006, ADR-0014, ADR-0015, ADR-0021, ADR-0030]
---

# ADR-0010: Stats stored as a per-day map keyed by `YYYY-MM-DD`

## Context

Stats screens need today's numbers, all-time totals and the last 7 days, and the data must be serialisable to AsyncStorage JSON (DECISIONS §10).

## Decision

Store stats as a map from day key to that day's numbers (DECISIONS §10):

```
{ "2026-01-07": { focusSessions: 3, focusMinutes: 75 }, ... }
```

As built:
- `StatsMap = Record<string, DayStats>` (`src/types/index.ts`).
- Day keys come from `getTodayKey()` (`src/utils/time.ts`), which formats the phone's *local* date.
- Since the 1.2.x line (`d52f707`, February 2026), the `stats_v2` key holds `{ days: StatsMap, goalMinutes, streak, lastAppliedSessionId }`. Each day also snapshots its goal (`goalMinutes`, `goalHit`, `goalHitAt`).
- `useStats` copies the v1 `stats` map into `stats_v2` once and never deletes it (Stage A §3.3).

## Consequences

**Positive**
- Today is a single key lookup. Totals are a sum over the days, and the 7-day chart takes the last 7 keys.
- The map was extended in place for the daily goal and the goal-based streak without changing its shape.

**Negative**
- The whole history is one JSON value under one key, read and written as a unit.
- The local-date key means "today" depends on the phone's time zone. Partners in different zones would disagree, so v2 computes the couple's day in `couples.home_tz` (rehaul plan §8.6, proposed).
- Two generations of the map (`stats`, `stats_v2`) now live on old installs. The MMKV migration copies both as they are ([ADR-0030](0030-mmkv-storage.md)).

## Alternatives considered

- **An array of day objects.** Finding today means iterating, and updates are more complex (DECISIONS §10).
- **v2, server side:** a `daily_stats` rollup keyed by `(owner_kind, owner_id, day_key)` and maintained by a trigger on `session_credits` (rehaul plan §4.3). It keeps the per-day shape on the server.

## Links

- [`DECISIONS.md` §10](../../../DECISIONS.md#10-stats-per-day-storage-yyyy-mm-dd-keys)
- [Phase 1 Stage A §3.3](../../implementations/2026-10-29-phase1-stage-a.md#33-a3-the-v131-storage-fixtures)
- [Rehaul plan §4.3](../../implementations/2026-10-29-couples-rehaul-plan.md#43-database-schema-indexes-and-rls) · [§8.6](../../implementations/2026-10-29-couples-rehaul-plan.md#86-couple-streak)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
