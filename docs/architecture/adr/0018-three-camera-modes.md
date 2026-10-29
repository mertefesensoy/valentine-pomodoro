---
id: ADR-0018
title: Three Fly Mode camera modes and a restored globe toggle
status: accepted
date: 2026-04-20
owner: Mert Efe Şensoy
related: [ADR-0017, ADR-0019, ADR-0026, ADR-0037]
---

# ADR-0018: Three Fly Mode camera modes and a restored globe toggle

## Context

Task 3 (2026-04-19) shipped five camera modes, `global | flat | followPlane | followPath | seeAll`, with a `CameraModeSwitcher`. Device testing found three problems (camera simplification §1):

- **The globe was lost.** The sheet-header toggle between the `satelliteFlyover` 3-D globe and the flat `mutedStandard` map had been folded into camera *modes*, so only the flat map was ever used.
- **Five modes was over-designed.** `flat` and `followPath` were near-copies of `followPlane`, and `global` duplicated the `seeAll` idle fit.
- **Follow-plane broke in landscape.** `mapHeadingSV` was mirrored from React state through a `useEffect`, one render after `setCamera`. The marker worklet read a stale heading for a frame on every turn.

## Decision

On 2026-04-20:

- `CameraMode` became `'followPlane' | 'route' | 'free'`, with one cycle button. `route` renames `seeAll`.
- `free` is entered automatically on a pan or rotate. It replaces a hidden 4-second "user is interacting" timer, and the cycle button is the way out.
- The globe toggle returned through `FlySheet.headerControl`. `isGlobe` is persisted with `cameraMode` in `FLY_PREFS`.
- `mapHeadingSV` is written synchronously, right after `setCamera`. The effect mirror stays as a safety net.
- A stored camera mode is checked against `VALID_MODES`, so an old value falls back to `followPlane`. The ±85° latitude clamp was restored.

## Consequences

**Positive**
- A 232 px switcher became one button. The camera's "following" state is now visible, and the landscape tilt is fixed.
- Old preferences migrate safely, with no crash on a stored `'global'`.
- A general rule: a SharedValue that a worklet reads in the same tick must be written synchronously, not through a `useEffect`.

**Negative**
- The five-mode design doc is superseded and its device checks had to be rewritten (device-check backlog, Task 3).
- `satelliteFlyover` is Apple Maps only. Android camera parity (`useCameraController`, scale-plan item 2) is unbuilt and deferred with Android (Phase 1 §3b, AN3).

## Alternatives considered

- **Keep the five-mode switcher.** Two decision points don't justify five targets (camera simplification §4).
- **Keep the 4-second auto-resume.** The camera silently resumed while the user was still looking around.
- **Keep the name `seeAll`.** `route` describes what the user sees.

## Links

- [Camera simplification §1](../../implementations/2026-04-20-camera-simplification.md#1-problem--motivation) · [three-mode model](../../implementations/2026-04-20-camera-simplification.md#three-mode-model) · [synchronous `mapHeadingSV` write](../../implementations/2026-04-20-camera-simplification.md#synchronous-mapheadingsv-write-landscape-fix) · [§4](../../implementations/2026-04-20-camera-simplification.md#4-design-decisions)
- [Five camera modes (superseded)](../../implementations/2026-04-19-camera-five-modes.md)
- [Device check backlog](../../device-check-backlog.md)
- [Phase 1 plan §3b](../../implementations/2026-10-29-phase1-plan.md#3b-deferred-android-after-v14)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
