---
id: ADR-0035
title: React Compiler lint rules as warnings until Phase 1 B5
status: superseded
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0029, ADR-0033]
superseded_by: [ADR-0041]
---

# ADR-0035: React Compiler lint rules as warnings until Phase 1 B5

> **Status note:** superseded by [ADR-0041](0041-react-compiler-on.md) on 2026-10-30. Phase 1 B5 fixed the findings (94 by then, not 105: B3 and B4 had rewritten the rest), set the five rules back to `error` (`7a849b3`) and turned the compiler on (`6395aee`). See the [B5 record](../../implementations/2026-10-30-phase1-b5-react-compiler.md).

## Context

At the SDK 56 step, `eslint-config-expo` 56 turned on the React Compiler rules as errors: 105 findings. They flag exactly the v1 code that Phase 1's re-render refactor rewrites, such as Animated refs, `.value` writes and `Date.now()` in render (SDK 58 upgrade §3.2, §4).

## Decision

Set the five rules to `warn` in `eslint.config.js`, with the counts recorded there (upgrade §4):
- `react-hooks/refs`
- `react-hooks/immutability`
- `react-hooks/set-state-in-effect`
- `react-hooks/purity`
- `react-hooks/globals`

**Phase 1 B5 closes it.** It turns on `experiments.reactCompiler`, fixes the findings in code that B3 and B4 didn't already rewrite, and sets all five back to `error`. If the compiler makes Reassure worse, the compiler goes off again and the rules stay at `error` (Phase 1 plan, B5).

As built: lines 18–22 of `eslint.config.js` set the five rules to `'warn'`.

## Consequences

**Positive**
- Lint stays at 0 errors, so CI can gate on it through the upgrade.
- No code is fixed twice, once for the lint rules and again in the refactor.

**Negative**
- **Warnings pile up.** There were 146 at the end of Stage A and 149 after B1 (Stage A §6; B1 doc §6). Real compiler problems in code that B3 and B4 don't touch stay hidden until B5.
- **A hard exit criterion.** Phase 1 cannot exit without the rules back at `error`.

## Alternatives considered

- **Fix all 105 findings during the upgrade.** That would mean fixing code that Phase 1 rewrites anyway (upgrade §4).

## Links

- [SDK 58 upgrade §3.2 (SDK 56 row)](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#32-one-sdk-per-step) · [§4](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#4-design-decisions)
- [Phase 1 plan, Stage B (B5) and the Phase 1 exit](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates)
- [Phase 1 Stage A §6](../../implementations/2026-10-29-phase1-stage-a.md#6-verification) · [Lazy Fly Mode §6](../../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md#6-verification)
- [Rehaul plan §4.5, item 4](../../implementations/2026-10-29-couples-rehaul-plan.md#45-re-render-strategy-f1-with-the-documented-trap-guarded)

## Backlinks
<!-- backlinks:start -->
- [Upgrade Expo one SDK at a time, before the refactor](0033-one-sdk-at-a-time.md)
- [The React Compiler is on, and Jest compiles app code the way Metro does](0041-react-compiler-on.md)
- [Architecture decision records](README.md)
- ["Phase 1 B5: the React Compiler on, its lint rules back to error"](../../implementations/2026-10-30-phase1-b5-react-compiler.md)
<!-- backlinks:end -->
