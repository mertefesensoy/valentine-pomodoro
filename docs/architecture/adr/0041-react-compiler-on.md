---
id: ADR-0041
title: The React Compiler is on, and Jest compiles app code the way Metro does
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0035, ADR-0029, ADR-0031, IMPL-2026-10-30-phase1-b5-react-compiler, IMPL-2026-10-29-phase1-plan]
supersedes: [ADR-0035]
---

# ADR-0041: The React Compiler is on, and Jest compiles app code the way Metro does

> **Status note:** accepted and built (2026-10-30): `6395aee` turns the compiler on; `10811ce` makes Jest compile app code exactly when app.json does. The Reassure gate is in the [B5 record §4.3](../../implementations/2026-10-30-phase1-b5-react-compiler.md#43-render-counts-measured). It still needs a device check on a TestFlight build (B5 record §6.4).

## Context

The rehaul plan (§4.5, item 4) turns on the React Compiler once the "timer still ticks" guards exist, and keeps it only if Reassure is neutral or better. Phase 1 task B5 does that. It fixes the compiler-rule findings that [ADR-0035](0035-react-compiler-lint-warnings.md) had held at `warn`, and sets those rules back to `error`.

Two facts found in B5 shaped how:
- **Jest wouldn't test compiled code.** `babel-preset-expo` 58 adds `babel-plugin-react-compiler` only when its Babel caller reports `supportsReactCompiler`. Metro sets that from `app.json`'s `experiments.reactCompiler`, but jest-expo's caller (`{ name: 'metro', bundler: 'jest', platform: 'ios' }`) never does. With only the app.json switch, every guard would have run against uncompiled components while the app shipped compiled ones.
- **Some code was compiled, some silently skipped.** The compiler skips any function with a compile error or a lint-rule finding. It also skips any function that contains a next-line or block suppression of `react-hooks/exhaustive-deps` or `react-hooks/rules-of-hooks`; in FlyModeScreen one unused suppression did that to the whole screen. The lint doesn't report most of these skips.

## Decision

1. **The compiler is on:** `app.json` `expo.experiments.reactCompiler: true`. babel-preset-expo adds it with its defaults: target React 19, and `panicThreshold: 'none'` in release builds, so a function the compiler can't handle is left as written rather than failing the build.
2. **Jest compiles app code exactly when app.json does.** `jest.babelTransformer.js` is jest-expo's babel-jest setup (`resolveBabelOptions`), plus `supportsReactCompiler` in the caller for every file Metro would bundle from the project. Tests, `__fixtures__`, `__mocks__` and `jest.setup.ts` stay uncompiled: the app never contains them, and their probes (render counters, captured values) must measure what they were written to measure. `src/components/__tests__/reactCompiler.test.tsx` pins it, by watching the compiler's memo-cache function.
3. **The five rules are at `error`:** `react-hooks/refs`, `immutability`, `set-state-in-effect`, `purity`, `globals`. A suppression of one needs a comment that says why; B5 left two, both `set-state-in-effect` in FlyModeScreen (Phase 4b replaces that screen).
4. **What gets compiled is checked, not assumed.** `node scripts/react-compiler-report.js` lists, per file, what the compiler compiled and skipped (with the reason), and exits 1 if the compiler changes any file's number of worklets. It runs babel-preset-expo with Metro's iOS release caller, with and without the compiler.

## Consequences

**Positive**
- The guards, the mutation check and Reassure run against the code the phone runs.
- Components that only re-rendered because a parent did (the ring, the overlays, Fly's sheet and buttons) now skip that work unless their props change. The ring and Fly cases can't be measured in Jest (below).
- Turning the compiler off is one line in app.json, and Jest follows it.

**Negative**
- **Jest can't see every saving.** Reanimated's Jest mock returns a new `useDerivedValue` object on every render, so in Jest the compiled Timer screen still re-renders the ring; on a phone it wouldn't. Counts under Jest are an upper bound for compiled screens.
- **A private jest-expo path.** `jest.babelTransformer.js` requires `jest-expo/src/resolveBabelOptions`. An Expo upgrade that moves it fails every test run at once, loudly; then copy the ten-line function.
- **Skips stay silent at build time.** Of the 45 components and hooks the compiler looks at, it skips 7. The reasons are compiler limitations (for example, `try` without `catch`), code it won't touch (FlySheet's SharedValue writes), and one exhaustive-deps suppression (`useFlyModeAudio`). The report lists them; nothing fails the build.
- **It needs a phone.** Jest's Reanimated mock runs worklets on the JS thread, so a worklet broken by the compiler would only fail on a device. The report's worklet count is the check before the device check.

## Alternatives considered

- **Only the app.json switch.** Jest would have tested uncompiled code (Context).
- **Add `babel-plugin-react-compiler` to `babel.config.js` under `env.test`.** It would duplicate the preset's options by hand, and would also compile test files and `jest.mock()` factories. Babel's Jest hoisting then rejects the factories, because they would reference the compiler's import.
- **Compile the tests too.** The test harnesses' render counters would then measure the compiler as well as the app.
- **Opt Fly out explicitly (`'use no memo'`).** It compiles with no skips and keeps all 5 of its worklets (report), so the device check is the remaining gate, as for every B5 change.

## Links

- [B5 record](../../implementations/2026-10-30-phase1-b5-react-compiler.md)
- [ADR-0035](0035-react-compiler-lint-warnings.md), which this supersedes
- [Phase 1 plan, B5](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates)
- [Rehaul plan §4.5, item 4](../../implementations/2026-10-29-couples-rehaul-plan.md#45-re-render-strategy-f1-with-the-documented-trap-guarded)

## Backlinks
<!-- backlinks:start -->
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../ARCHITECTURE.md)
- [React Compiler lint rules as warnings until Phase 1 B5](0035-react-compiler-lint-warnings.md)
- [Architecture decision records](README.md)
- [2026-10-29 — Phase 1 (v1.4): design system and local re-architecture, plan](../../implementations/2026-10-29-phase1-plan.md)
- ["Phase 1 B5: the React Compiler on, its lint rules back to error"](../../implementations/2026-10-30-phase1-b5-react-compiler.md)
- [Roadmap — Valentine Pomodoro v2](../../roadmap/ROADMAP.md)
- [Test strategy](../../testing/TEST-STRATEGY.md)
<!-- backlinks:end -->
