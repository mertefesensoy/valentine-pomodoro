---
id: TEST-STRATEGY
title: Test strategy
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [SRS, ARCHITECTURE, DOCS]
---

# Test strategy

How we know the app works, and which checks must pass before work counts as done. What each test verifies is traced in [TRACEABILITY.md](TRACEABILITY.md); what must be verified is in the [SRS](../srs/SRS.md).

## 1. Principles

1. **A test pins a requirement.** Every test file states which requirements it covers (`// covers: FR-TMR-005`), and every implemented `Must` requirement has a test or a recorded device check (NFR-MAINT-002).
2. **A test isn't trusted until it has been seen to fail.** For every guard test, break the code it protects on purpose, watch the test fail, then restore the code. This is the *mutation check*, and it's recorded in the implementation doc. Phase 0 found a guard (`fireCompletion`'s inner check) that no test could reach this way; that discovery is the point.
3. **Device checks are part of done**, never a backlog. A TDZ crash once shipped through three tasks because device checks were deferred (your memory note). Static review and simulators don't count for native behaviour.
4. **Characterisation before refactor.** Before changing code that has no spec, pin what it does today, even if it's odd (the 9-minute Fly floor, skip not counting toward the long break). Then change it deliberately.
5. **Gates are ordered.** A plan marks tasks **GATE**; nothing after a gate starts until the gate is green (the Phase 1 plan's A0–A3).

## 2. Test levels

| Level | Tool | Runs | Location | What it's for |
|-------|------|------|----------|---------------|
| Unit | Jest (`jest-expo`) | CI, every push | `src/**/__tests__/*.test.ts` | Pure logic: phase machine, geo math, policies, migrations |
| Component / integration | React Native Testing Library 14 | CI | `src/**/__tests__/*.test.tsx` | Hooks and screens rendered under fake timers, the timer guards, storage fixtures |
| Render performance | Reassure | CI on pull requests (compared with base) | `src/**/__tests__/*.perf-test.tsx` | Render counts and times per screen (F1, NFR-PERF-003) |
| Static | `tsc --noEmit`, ESLint (`eslint-config-expo` 58) | CI | — | Types (including the strict RN API), React rules, the five React Compiler rules at `error` (B5); 0 errors required |
| Compiler coverage | `node scripts/react-compiler-report.js` | Per change to components (B5) | — | What the React Compiler compiles and skips, and that it keeps every worklet (exit 1 otherwise) |
| Bundle | `npx expo export --platform ios --platform android --dump-sourcemap` (always with this flag; it changes the `.hbc` size) | Per plan task | — | Bytecode size, startup modules (`scripts/startup-modules.js`) |
| Docs | `node scripts/docs/check-docs.mjs` | CI | — | Broken links, duplicate IDs, stale backlinks and traceability |
| Database (Phase 2) | pgTAP against a local Supabase | CI | `supabase/tests/` | RLS policies, RPC idempotency, constraints |
| End-to-end (Phase 7) | Maestro | Release candidates | `e2e/` | Main user journeys on a device or simulator |
| **Device** | A physical iPhone through TestFlight (no Mac, so no local simulator) | Each plan's GATE and each release | Checklists in plans | Native behaviour, notifications, migration over a real install, feel |
| Web (Phase 6) | Lighthouse CI | CI | — | NFR-PERF-007 |

## 3. Test seams and mocks

Native modules have no Node implementation; [`jest.setup.ts`](../../jest.setup.ts) replaces each with the smallest stub the app needs. The rules:

- Mock at the package boundary, never the app's own modules. The exceptions, each commented where it is: the airport asset reader (B1b), which reads the real file from disk; `FlyModeScreen` in `flyLazyLoad`, to observe when it loads; `useUpdateCheck` in the perf tests; pass-through counting wrappers (`useTimer` in `timerScreenCommits`); `AdPolicy`/`AdManager` in `timerScreenOverlays` (B5), which tests when the screen asks for an ad, not the policy's caps; `appStorage` in `deferredStartup.test.ts`, which gives every simulated launch the same react-native-mmkv mock instance so stored values outlive `jest.resetModules()` (B7); and `react`, pinned with `jest.doMock` in `useUpdateCheck.test.tsx`, so the hook loaded after a module reset renders with RNTL's React (B7).
- **Jest compiles app code with the React Compiler exactly when `app.json` does** (`jest.babelTransformer.js`, B5; [ADR-0041](../architecture/adr/0041-react-compiler-on.md)). Test files, fixtures, mocks and `jest.setup.ts` are not compiled. Reanimated's mock returns a new `useDerivedValue` object each render, so a compiled screen can re-render a child in Jest that it would skip on a phone: counts under Jest are an upper bound.
- **Every mock carries a comment saying why.** Workarounds for upstream bugs (the Reanimated 4.7.1 `setCSSEventHandler` stub) say to remove them on the next upgrade.
- Time is faked with modern fake timers, which also fake `Date.now()`, so clock math and intervals move together. RNTL 14's `render`, `renderHook` and `act` are async and always awaited.
- **The tour (Phase 1 D5):** the tour's model tests run the pose sheet's own `scripts/art/tour-motion.js` in a sandbox and hold the app's write-on to it, line for line. Jest's native views report no frame, so the tour's openings are verified on the device.

## 4. The guards that protect the riskiest code

| Guard | Protects | Must stay green through |
|-------|----------|-------------------------|
| `src/context/__tests__/timerTextTicks.test.tsx` | Timer text ticks through the clock store's notification, read with `useSessionClock()` (FR-TMR-006); B3's `tick` before B4, `AppProvider` before B3 | The Phase 1 re-render refactor (B3/B4/B5: passed, mutation-checked again in B4 and, compiled, in B5) |
| `src/screens/__tests__/timerScreenTicks.test.tsx` | The real `TimerScreen` ticks in Classic and Fly (FR-TMR-006) | B1, B3, B4, B6, D1 |
| `src/hooks/__tests__/useSessionClock.test.ts` | Countdown, pause/resume, exactly-once completion, cold start, two slots (FR-TMR-003/004/005/008) | Phase 3's engine replacement |
| `src/utils/__tests__/geoMath.equivalence.test.ts` | Worklet ≡ JS interpolation (FR-FLY-002) | Any Fly change |
| `src/__fixtures__/storage/__tests__/v131.test.tsx` | v1.3.1 storage shapes (FR-MIG-001) | B2 MMKV, B3 stores |
| `src/context/__tests__/rerenders.perf-test.tsx`, `src/screens/__tests__/screens.perf-test.tsx` | The render-count baseline (NFR-PERF-003) | B4: 14 → ≤ 2 (met: 1); B5's compiler (met: counts unchanged) |
| `src/screens/__tests__/timerScreenCommits.test.tsx` | The Timer screen re-renders only on session changes, and a start is one commit (NFR-PERF-003), in the ordinary suite; since B5 it counts the screen's renders by its `useTimer` calls | B5 (passed), B6, D1 |
| `src/screens/__tests__/timerScreenOverlays.test.tsx` | After a focus on Classic: the celebration, then the love note, then the interstitial once neither shows (FR-ADS-001 rule 3, FR-NTE-001). Written against the effect-driven queue B5 replaced | D1 |
| `src/components/__tests__/reactCompiler.test.tsx` | Jest runs app code compiled exactly when `app.json` turns the React Compiler on (NFR-PERF-003) | Every Expo or Jest upgrade |
| `src/stores/__tests__/clockStore.test.tsx`, `src/utils/__tests__/clockMath.test.ts` | One notification per displayed second, ε after the boundary; none while paused; completion once (FR-TMR-005, FR-TMR-006; plan §4.2 as corrected in B4) | Phase 3's engine replacement |
| `src/hooks/__tests__/useSlotClock.test.tsx` | Slot SharedValues written in the store's `set()`, not an effect; the ring's UI-thread path ≡ the render-time formula (FR-TMR-003) | Any ring or Fly animation change |
| `src/__tests__/router.test.tsx` | Deep links open each tab (FR-NAV-001); tabs render on first focus or at start-up idle and are never hidden, and a hidden Timer holds its celebration, love note and interstitial until focused (NFR-PERF-003, FR-ADS-001, FR-NTE-001; B4 §3.5); the focus hooks follow the router's focus; the Stats banner waits for Stats' first focus; the tab haptic follows the setting (FR-SET-001); a notification tap opens Timer (FR-NTF-003). Mutation-checked in B6 and its fix | Any change to `app/`, the tab navigator, `LazyTab` or the focus hooks; every Expo Router upgrade |
| `src/startup/__tests__/deferredStartup.test.ts` | Deferred start-up work waits for the first frame, falls back after 2 s, and runs at once in the eager arm; the probe's TTI mark comes before the work (NFR-PERF-001; B7, mutation-checked) | Any change to the root layout or the start-up order |
| `src/ads/__tests__/adReadiness.test.ts`, `src/hooks/__tests__/useUpdateCheck.test.tsx` | With start-up work deferred, the interstitial is ready by the 2nd completed session, and the update check runs once per launch and at once when forced (FR-ADS-001, FR-UPD-001; B7, mutation-checked) | Phase 5's ads rewrite; any change to the start-up order |

The first three were mutation-checked when written (Phase 0 doc §3.2, Stage A doc §3.1).

## 5. Device-check protocol

1. **Build:** an EAS production build of the commit under test, after your go-ahead. **Record the build id, version and build number.**
2. **Distribute:** TestFlight internal testing (EAS submit, `ascAppId` set), after your go-ahead.
3. **Install over the current App Store version** whenever the change touches storage, so migration is exercised on real data.
4. **Run the plan's checklist item by item.** Report each item as passed, or as failed with what was seen.
5. **Record** the results in the plan or implementation doc: date, device, iOS version and build. Fix failures and re-check before marking done.

The checklists live with the plans:
- the Phase 1 gates (A0, E1, E2) in the [Phase 1 plan](../implementations/2026-10-29-phase1-plan.md)
- the SDK 58 list in the [upgrade doc §6.3](../implementations/2026-10-29-expo-sdk-58-upgrade.md#63-device-checks-yours)
- the legacy Fly checks in the [device-check backlog](../device-check-backlog.md), which is retired when Phase 4c replaces the real-map code

## 6. Commands

```bash
npm test                          # unit + component (Jest)
npx jest path/to/file.test.tsx    # one file
npx reassure --baseline           # record the render baseline on the base commit
npx reassure                      # compare against it
npm run typecheck
npm run lint                      # 0 errors required; warnings are reported
node scripts/docs/check-docs.mjs  # docs links, IDs, backlinks, traceability
```

## 7. Coverage targets

- Requirements coverage (TRACEABILITY.md §summary): **100 % of implemented `Must` requirements by v1.4.0** (NFR-MAINT-002).
- Line coverage is not a target; requirement coverage is. Line coverage can be reported (`npx jest --coverage`) to find untested branches in code that a requirement covers.

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../CHANGELOG.md)
- [Contributing](../../CONTRIBUTING.md)
- [Valentine Pomodoro](../../README.md)
- [Documentation map](../README.md)
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../architecture/ARCHITECTURE.md)
- ["Phase 1 B5: the React Compiler on, its lint rules back to error"](../implementations/2026-10-30-phase1-b5-react-compiler.md)
- ["Phase 1 B6: Expo Router with native tabs"](../implementations/2026-10-30-phase1-b6-expo-router.md)
- ["Phase 1 B7: deferred start-up work, and an on-device TTI probe"](../implementations/2026-10-30-phase1-b7-deferred-startup.md)
- ["Phase 1 Stage E: verify and ship v1.4.0"](../implementations/2026-11-01-phase1-stage-e.md)
- [Design workflow — Impeccable, Apple HIG and Emil Kowalski skills](../process/DESIGN-WORKFLOW.md)
- [Release process](../process/RELEASE.md)
- [Evaluation — xtool (cross-platform Xcode replacement) vs staying on Expo/EAS](../proposals/xtool-evaluation.md)
- [Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)](../srs/SRS.md)
- [Requirements traceability (generated)](TRACEABILITY.md)
<!-- backlinks:end -->
