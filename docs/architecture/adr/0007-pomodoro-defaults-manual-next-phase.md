---
id: ADR-0007
title: Pomodoro defaults (25/5/15, long break every 4) and a manual start for each phase
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0024]
---

# ADR-0007: Pomodoro defaults and a manual start for each phase

This record merges DECISIONS §6 (no auto-start) and §7 (default durations): together they define the session cycle.

## Context

A Pomodoro app needs a default cycle that works with no setup, and a rule for what happens when a phase ends.

## Decision

- **Defaults:** focus 25 min, short break 5 min, long break 15 min, and a long break after every 4 focus sessions. These are the standard Pomodoro Technique values, and the user can change them in Settings (DECISIONS §7).
- **No auto-start.** When a phase ends, the user presses Start to begin the next one, from focus to break and from break to focus (DECISIONS §6).

As built:
- `src/constants/defaults.ts` holds `shortBreak: 5`, `longBreak: 15` and `longBreakEvery: 4`.
- There is no auto-start setting in `src/`. "Manual" is simply the behaviour.
- `useTimer.getCurrentDuration()` reads the settings. The scale plan wrongly said the durations were hard-coded (rehaul plan §2.3).

## Consequences

**Positive**
- Works with no setup, and the user decides when the next phase starts.
- The cycle rule is pinned by Phase 0 tests (`nextAfterComplete`, `nextAfterSkip`): a long break every 4 focus sessions, and a skipped session never counts toward it. The v2 session engine must reproduce this exactly (Phase 0 §3.2).
- Presets of 50/10, 52/17 and 90/20 are planned on top of Classic 25/5 (rehaul plan §3.5, idea 8; Phase 1 D1; `PRODUCT.md`).

**Negative**
- Every phase change needs a tap. The auto-start toggle DECISIONS.md left for "later if requested" has not been built.

## Alternatives considered

- **Auto-start with a 5-second countdown.** Rejected as possibly jarring (DECISIONS §6).

## Links

- [`DECISIONS.md` §6](../../../DECISIONS.md#6-auto-start-next-phase-off-by-default) · [§7](../../../DECISIONS.md#7-default-pomodoro-durations)
- [Phase 0 §3.2, tests](../../implementations/2026-10-29-phase0-foundation.md#32-tests-25-tests-5-suites-plus-1-reassure-scenario)
- [Rehaul plan §2.3](../../implementations/2026-10-29-couples-rehaul-plan.md#23-scale-planmd-2026-04-20) · [§3.5](../../implementations/2026-10-29-couples-rehaul-plan.md#35-ideas-and-themes-audit-you-asked-for-new-ideas)
- [Phase 1 plan, Stage D (D1)](../../implementations/2026-10-29-phase1-plan.md#stage-d--screens-in-the-new-design)
- [`PRODUCT.md`, operating context](../../../PRODUCT.md#operating-context)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
