# Crash fix — AIRMap `insertReactSubview:atIndex:` (iOS, New Arch)

**Date:** 2026-05-05
**Branch:** `release/ios-1.3.0`

---

## 1. Problem / Motivation

Two distinct TestFlight crashes on `react-native-maps@1.20.1` traced to
`AIRMap.m:138` in Fly Mode:

| Variant | Symptom | Root cause |
|---|---|---|
| Crash A | `*** -[__NSArrayM insertObject:atIndex:]: object cannot be nil` | Fabric/legacy interop hands a nil subview to `insertReactSubview:atIndex:` mid-reconciliation |
| Crash B | `*** -[__NSArrayM insertObject:atIndex:]: index 97 beyond bounds [0 .. 94]` | `atIndex` exceeds `_reactSubviews.count` during the burst that mounts up to 120 airport-dot markers on first render |

Context that made these latent:

- `app.json` has `"newArchEnabled": true`. Under the New Arch, MapView
  mutations route through `RCTLegacyViewManagerInteropComponentView`,
  which exhibits both nil-subview and out-of-range-index races during
  rapid marker churn. The legacy bridge tolerated both more gracefully.
- Fly Mode renders **up to 120 airport dots immediately on mount** with
  no `onMapReady` gate — the primary trigger for Crash B.
- The previous fix (2026-04-20-mapview-nil-child-fix) stopped JS from
  rendering literal `null` MapView children, but did not address the
  native races introduced by the New Arch interop layer.

### Why this is on top of the earlier fix

`2026-04-20-mapview-nil-child-fix.md` removed JS-side `null` children
returned from a `.map()` callback. That eliminated *one* path that
yielded a nil subview at the React/JS layer. The crashes in this
document originate one layer down — the legacy interop component view
itself injects nils and stale indices during Fabric reconciliation —
so a JS-only fix cannot reach them. The native guard is the only
durable mitigation while we remain on `react-native-maps@1.20.1` with
the New Arch enabled.

---

## 2. What Changed

| File | Change |
|---|---|
| `package.json` | Added `"postinstall": "patch-package"`; added `patch-package@^8.0.1` to `devDependencies`. |
| `package-lock.json` | Updated by `npm install` to record `patch-package` and its transitive deps; required so `eas build` / `npm ci` install it before `postinstall`. |
| `patches/react-native-maps+1.20.1.patch` | New file — captures the native guards in `AIRMap.m` so the change re-applies on every `npm install`. |
| `node_modules/react-native-maps/ios/AirMaps/AIRMap.m` | Two guard blocks added (nil + bounds in `insertReactSubview:atIndex:`, nil in `removeReactSubview:`). Re-applied by `patch-package` on every install — no manual edit survives a clean install. |
| `src/screens/FlyModeScreen.tsx` | Added `mapReady` state (default `false`); set to `true` from `<MapView onMapReady>`; gated the airport-dot render with `mapReady && …`. |

No other MapView children were modified.

---

## 3. Implementation Approach

The fix has **two independent layers** that work in concert:

### Layer 1 — Native guards in `AIRMap.m`

`patch-package` is a standard Node-ecosystem tool that records edits
inside `node_modules/<pkg>` as a `.patch` file under `patches/` and
re-applies them via a `postinstall` script. This is the canonical way
to ship a native fix when the upstream library has not yet released a
patched version. The patch survives `npm install`, `npm ci`, and EAS
managed builds without forking the package.

The two guards in `AIRMap.m`:

```objc
// insertReactSubview:atIndex:
if (subview != nil) {
    NSUInteger safeIndex = MIN((NSUInteger)atIndex, _reactSubviews.count);
    [_reactSubviews insertObject:(UIView *)subview atIndex:safeIndex];
}

// removeReactSubview:
if (subview != nil) {
    [_reactSubviews removeObject:(UIView *)subview];
}
```

Why both guards are necessary:

- The nil check defends Crash A directly — `[NSMutableArray
  insertObject:nil atIndex:]` and `removeObject:nil` both raise
  `NSInvalidArgumentException` in current Foundation runtimes.
- The bounds clamp (`MIN(atIndex, count)`) defends Crash B —
  `insertObject:atIndex:` raises `NSRangeException` when
  `atIndex > count`. Clamping to `count` appends the subview at
  the end, which preserves the relative ordering Fabric ultimately
  reconciles toward (Fabric is order-eventually-consistent during
  the legacy-interop handoff, so a slightly-late append at index N
  vs. N+1 is corrected on the next reconciliation pass).
- The `removeReactSubview:` nil guard is included because the
  symmetric path can also receive nil; not guarding it would simply
  shift the crash from insert to remove.

### Layer 2 — `mapReady` gate in JS

The native guard alone *prevents the crash* but does not *prevent the
race*. Letting Fabric send 120 mutations into AIRMap before its
`_reactSubviews` is fully wired up is wasteful and stresses MapKit
(which has its own annotation-coalescing path). Gating the dot render
on `onMapReady` defers the entire dot burst until AIRMap signals it
has finished initial setup — eliminating the burst itself, not just
the crash from the burst.

Specifically:

```tsx
const [mapReady, setMapReady] = useState(false);
…
<MapView … onMapReady={() => setMapReady(true)}>
  {flightData && <Polyline … />}
  {origin && <Marker … />}
  {destination && <Marker … />}
  {markerCoord && <Marker … />}
  {mapReady && visibleAirportMarkers
    .filter(a => a.iata !== origin?.iata && a.iata !== destination?.iata)
    .map(airport => <Marker … />)}
</MapView>
```

The other four child groups (`Polyline`, origin `Marker`, destination
`Marker`, airplane `Marker`) are intentionally **not** gated on
`mapReady`. Reasoning:

- Each is gated individually with `{value && <Component>}`, so they
  mount one at a time as their underlying state populates.
- Session restore can set `origin`/`destination` from AsyncStorage
  before `onMapReady` fires; gating those would visibly flash the
  origin and destination pins on warm restart.
- One-at-a-time mounts are exactly the churn pattern the native guard
  was designed to tolerate. The dot burst (up to 120 in one frame) is
  the qualitatively different load that needs JS-level deferral.

This is a deliberate tradeoff: a stricter "no MapView mutation before
onMapReady" rule would simplify the mental model, but at the cost of
restart UX. The native guard is the backstop that makes this tradeoff
safe.

---

## 4. Mathematical / Statistical Details

Not applicable — this is a structural change with no numeric algorithms.

The only quantitative reasoning is the index-clamp:

```
safeIndex = min(atIndex, _reactSubviews.count)
```

`NSMutableArray insertObject:atIndex:` accepts `atIndex ∈ [0, count]`
inclusive on the upper bound (`count` means append). Clamping to
`count` is the canonical idempotent recovery for an out-of-range
insertion: it preserves the array invariant (`atIndex ≤ count`) while
losing as little ordering information as possible.

---

## 5. Design Decisions

### Alternative 1 — Pin to a different `react-native-maps` version

Rejected. There is no upstream release with this fix as of 2026-05-05;
later versions in the 1.x line do not include the native guard, and
moving to a 2.x line would be a much larger migration with no signal
that it would resolve the New Arch interop race.

### Alternative 2 — Disable the New Arch (`newArchEnabled: false`)

Rejected. Disabling the New Arch would mask the crash but reverts a
deliberate platform decision, breaks Reanimated/Worklets fast-path
integrations the rest of the screen depends on, and would force a
re-test of a much larger surface area.

### Alternative 3 — Gate **all** MapView children on `mapReady`

Considered. This is stricter and gives a clean "no pre-ready
mutations" guarantee. Rejected for v1 because:
- Origin/destination pins flashing in on warm restart is a visible
  UX regression.
- Their mount churn is one-at-a-time — covered by the native guard.

If we ever observe a residual crash that traces back to one of those
markers, gating them too is a one-line change.

### Alternative 4 — Skip `patch-package`, hand-edit `node_modules`

Rejected. The edit would not survive `npm ci` on EAS, defeating the
purpose entirely. `patch-package` is the standard answer here.

### Alternative 5 — Fork `react-native-maps`

Rejected as overkill for a two-method, six-line patch. Forking
introduces a long-term maintenance burden (rebasing onto upstream,
publishing under a new name, version reconciliation) that is grossly
disproportionate to the change. Revisit only if the native fix list
grows beyond ~3 unrelated patches.

---

## 6. Verification

### Static checks (run in this environment)

```bash
npx tsc --noEmit
# Result: no output, exit 0 — no type errors
```

```bash
npx eslint src/screens/FlyModeScreen.tsx
# Result: 0 errors, 2 pre-existing warnings on lines 267 / 277
# (unused eslint-disable directives — unrelated to this change;
# both lines are well outside the diff range)
```

### Postinstall round-trip (run in this environment)

```bash
rm -rf node_modules/react-native-maps
npm install
# Output excerpt:
#   > patch-package
#   patch-package 8.0.1
#   Applying patches...
#   react-native-maps@1.20.1 ✔
```

The `✔` confirms the patch applies against a freshly-downloaded copy
of `react-native-maps@1.20.1` with no fuzz, no hunks rejected. This
must remain green — if it breaks, the native crash returns silently
on the next EAS build.

### Patch content verification

```bash
cat patches/react-native-maps+1.20.1.patch
```

The diff contains exactly two hunks, both inside `AIRMap.m`:
- `insertReactSubview:atIndex:` — replaces the bare `insertObject:`
  call with the nil + bounds guard.
- `removeReactSubview:` — replaces the bare `removeObject:` call
  with the nil guard.

Nothing else.

### Manual repro (Mac/Xcode — outside this environment)

These steps must be run on a Mac with Xcode + a paired iOS device.
Cannot be exercised from this Windows environment.

1. `eas build --platform ios --profile preview` (or equivalent local
   prebuild + Xcode run).
2. Install on a physical device (iPhone 17 Pro / iOS 26.3 reproduces
   most reliably).
3. Open Fly Mode — airport dots should fade in *after* the map's
   initial tile render (visible delay of ~200–500 ms is expected and
   is the desired behavior).
4. Mount/unmount the Fly tab 10+ times in rapid succession.
5. Pan, zoom, rotate, and pitch the map aggressively.
6. Start a flight, pause, resume, reset; repeat 5×.
7. Background the app for 5 s, return.
8. Watch the Xcode console for `NSInvalidArgumentException` /
   `NSRangeException` originating in `AIRMap`. Expect zero.

If any such exception appears, capture the full stack trace and
re-open this document — the most likely culprit is one of the
non-gated child groups exhibiting unexpected churn.

---

## 7. Acceptance check (from the plan)

- [x] `git diff --name-only` shows: `package.json`, `package-lock.json`,
      `patches/react-native-maps+1.20.1.patch` (untracked), and
      `src/screens/FlyModeScreen.tsx`. (`docs/device-check-backlog.md`
      was already modified prior to this session.)
- [x] `patches/react-native-maps+1.20.1.patch` contains only the two
      guard blocks — verified by `Read`.
- [x] `package.json` has `"postinstall": "patch-package"` and
      `patch-package` in `devDependencies`.
- [x] `mapReady` state gates the `visibleAirportMarkers` render in
      `FlyModeScreen.tsx`.
- [x] Clean `npm install` log shows `react-native-maps@1.20.1 ✔`.
- [x] `npx tsc --noEmit` passes with no new errors.
- [ ] Manual repro on Mac/Xcode produces no `NSInvalidArgumentException`
      / `NSRangeException`. **Pending** — must be exercised in the
      next TestFlight build before closing 1.3.0.

---

## 8. Related Docs

- `docs/implementations/2026-04-20-mapview-nil-child-fix.md` — the
  earlier JS-side fix (`.filter().map()` instead of returning `null`).
  This document supersedes that one's coverage of the New-Arch native
  races; the JS fix in that doc remains in place and is still correct.
- `docs/implementations/2026-04-19-camera-five-modes.md` — the change
  that made the latent race reliably reachable in the field.
- `docs/device-check-backlog.md` — manual-test checklist that should
  pick up the new repro steps in §6.
