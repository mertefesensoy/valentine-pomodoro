---
id: ADR-0031
title: Load Fly Mode lazily
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0003, ADR-0026, ADR-0036, ADR-0037, IMPL-2026-10-29-phase1-b1-lazy-fly-mode]
---

# ADR-0031: Load Fly Mode lazily

## Context

`TimerScreen` imported `FlyModeScreen` statically, and `FlyModeScreen.tsx:45` imports the 648 KB `airports.json`. So every cold start, even straight into Classic, evaluated all of this: Fly Mode, its sheet, picker and pill, the geo maths, all of `react-native-maps`, `expo-audio` and the airport JSON as a module (finding F2; B1 doc §1).

The rehaul plan put the fix in Phase 1, step 6 ("Fly Mode stays functional but is lazy-loaded"). The approved Phase 1 plan made it task B1. It is built in `5b10a78`.

## Decision

- **Lazy import.** `FlyModeScreen` is `React.lazy(() => import('./FlyModeScreen'))`, rendered inside a `Suspense` whose fallback is a plain themed `FlyModePlaceholder`.
- **The switcher stays outside.** The ModeSwitcher sits outside the boundary, so the user can switch back while Fly loads.
  - *As built, 2026-10-30 (Phase 1 D1, build 49):* Classic's Modes button replaced `ModeSwitcher` in Fly. It opens the `/modes` sheet and sits outside the same boundary, for the same reason ([D1 record §3.16](../../implementations/2026-10-30-phase1-d1-classic.md)).
  - *As built, 2026-10-31 (Phase 1 D1, after build 49):* The owner moved the button to Fly's top trailing corner, where the compass was and where Classic has its own. It now heads `FlyModeScreen`'s map-control column, so it slides clear of the landscape sheet with the compass. That puts it **inside** the boundary. While Fly's module evaluates on the first switch, there is no way back for that moment. The module already ships in the bundle, so the wait is short, and the owner's placement outranks it ([D1 record §3.18](../../implementations/2026-10-30-phase1-d1-classic.md)).
- **Test-only Babel plugin.** Jest runs `import()` through `@babel/plugin-transform-dynamic-import`, enabled only under `env.test`. Metro builds get Expo's default config unchanged.

**Measured** (iOS, by a static walk of the export's module graph with `scripts/startup-modules.js`):
- Modules evaluated at cold start went from 1,799 to 1,745.
- 56 are deferred to the first Fly switch: 7 app files, 34 `react-native-maps` modules, 9 `expo-audio` modules, and 6 generated ones, including the airport JSON. Expo's async-require helper adds 2.
- So $1{,}799 - 56 + 2 = 1{,}745$ (B1 doc §4).

## Consequences

**Positive**
- Users who never open Fly never evaluate the map stack or the 648 KB JSON.
- On Android and the web, `isFlyModeAvailable()` keeps the module from ever loading.
- The A1 guards and the Reassure counts stayed green with no edit.

**Negative**
- **It doesn't shrink the native bundle.** Hermes ships one bytecode bundle, and `React.lazy` changes *when* a module is evaluated, not *whether* it is in the bundle. Getting the JSON out of the bytecode needs [ADR-0036](0036-airports-json-out-of-bundle.md).
- The first switch to Fly costs one placeholder commit.
- The device check is pending. It rides on the B2 TestFlight build (B1 doc §6).

## Alternatives considered

- **`lazy(async () => require(...))`.** Metro would record a *sync* dependency, which the start-up count can't tell apart from an eager import (B1 doc §5).
- **Jest's `--experimental-vm-modules`.** It would change how every test file loads.
- **Count modules at runtime on a device.** That needs a device build and instrumentation. The static walk is an upper bound, and reproducible.

## Links

- [Lazy Fly Mode §1](../../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md#1-problem--motivation) · [§3.1](../../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md#31-the-lazy-boundary) · [§4](../../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md#4-mathematical--statistical-details) · [§5](../../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md#5-design-decisions) · [§6](../../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md#6-verification)
- [Rehaul plan §1.2, finding F2](../../implementations/2026-10-29-couples-rehaul-plan.md#12-what-is-wrong-with-it) · [Phase 1 roadmap step 6](../../implementations/2026-10-29-couples-rehaul-plan.md#phase-1-design-system-and-local-re-architecture-shipped-to-todays-users-l)
- [Phase 1 plan, Stage B (B1)](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates) · [§5, finding 1](../../implementations/2026-10-29-phase1-plan.md#5-design-decisions-and-findings)

## Backlinks
<!-- backlinks:start -->
- [expo-audio for sound, not expo-av](0003-expo-audio.md)
- [Move airports.json out of the JS bundle](0036-airports-json-out-of-bundle.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
