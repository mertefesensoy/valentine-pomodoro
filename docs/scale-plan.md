# Scale Plan: BengisumPomodro

**Date:** 2026-04-20
**Scope:** Design-only. No code changes. Forward-looking architecture, engagement, and feature recommendations with a prioritised top-5 and risk summary.

---

## 1. Technical architecture & performance

The current app has three well-separated tiers of session state: `useSessionClock` as the shared wall-clock primitive, `useTimer` as the Pomodoro concern layer on top of it, and `FlyModeScreen` as the Fly concern layer reading a fly-slot snapshot from the clock. This layering is the right pattern and should be the template for any new session type added in the future. A new session type requires a hook that reads a named slot from `useSessionClock`, reacts to `onComplete` for that slot's kind, and delegates all clock arithmetic to the primitive rather than managing its own `setInterval` or `endAt` reference.

Several render-hot paths need attention as the feature set grows. The `setDisplayTick` counter in `useSessionClock` fires once per second and is the sole mechanism that drives timer text updates across the application. It works by incrementing a counter inside the `AppContext.Provider` value, which changes the value's identity and triggers every `useContext(AppContext)` consumer to re-render. This mechanism is load-bearing: wrapping `AppProvider`, `FlySheet`, `FlyTimerPill`, or any component between `AppContext.Provider` and those leaf components in `React.memo` with a dependency that does not include `displayMs` will silently sever the re-render chain and freeze timer text without throwing an error. This constraint must survive any future performance optimisation pass. The `useFrameCallback` runs on the UI thread at 60 fps and drives `bearingSV` rotation and the delta-time accumulator for the 15 Hz `runOnJS(setMarkerCoord)` call. The 15 Hz cadence is a tunable constant (`MARKER_HZ`) at the top of `FlyModeScreen.tsx` and should be adjusted before any other marker-related change if jitter surfaces on low-end Android devices. The `fitToCoordinates` call for `seeAll` mode is throttled to 4 Hz; if queued-animation build-up appears under CPU stress, the guard should be lowered rather than removed. The visible-airport-markers memo re-computes on every `mapRegion` change and can trigger up to 120 native Marker renders at once; a region-change debounce or a tighter cap is the right fix if panning feels sluggish at world zoom.

The camera API is currently tuned entirely for MapKit on iOS. The `pitch: 50` and `altitude: 500_000` values used in `followPlane` and `followPath` modes have no guaranteed equivalents on Android's Google Maps SDK, which uses zoom level rather than altitude and handles pitch differently. The right abstraction is a `useCameraController` hook that accepts a geometric intent (centre here, heading X, altitude Y, tilt Z) and maps it to the correct platform API, hiding the MapKit / Google Maps split from the five camera-mode effects. This is not a future risk if the app targets Android: it is a current gap that blocks an Android release.

On battery and frame rate, the `useFrameCallback` runs at 60 fps whenever `FlyModeScreen` is mounted, including when the sheet is at `peek` and the plane is obscured. A `sheetProgress`-gated `isVisibleSV` SharedValue that downshifts the callback to 30 fps when the sheet is expanded would be a measurable battery saving on long sessions. When the app is backgrounded, `flyIsRunningSV` is set to false and the frame callback short-circuits; when the display is locked, Reanimated does not run at all and progress is recomputed from the wall clock on foreground restore. Both cases are already handled correctly.

For telemetry, the event set should cover session starts, completions, and abandonments bucketed by kind and duration, along with route distance buckets and camera mode selections. No IATA codes, no user-identifiable timing, and no personal data should leave the device. Events are stored locally for 30 days and batch-uploaded on session start so that a session ending offline does not result in missing data.

---

## 2. Engagement & social hooks

**Streaks with forgiveness windows.** A daily streak counts any calendar day on which the user completes at least one focus session in either Pomodoro or Fly mode. If a day is missed, a grace-period notification fires the following morning before the streak resets, giving the user one day to recover without penalty. The persistent state is three fields: current streak count, longest streak count, and the ISO 8601 date of the last completed session, all normalised to UTC midnight to avoid timezone-rollover bugs. Retroactive backfill for existing users is excluded: streaks start from the first session after the upgrade, not from install history.

**Couple mode.** Two users commit to the same origin, destination, and session duration; the session only lands for either user if both complete it. Each sees the other's plane on their own map. The minimum data is a shared session identifier, a device push token (not stored server-side), the shared route, and a status field per participant. When a partner is offline at landing, the partner-landed state is surfaced on the next foreground restore; status is always visible in the UI and never communicated solely through notifications.

**Shared destinations.** A user can name and save a route to a local favourites list and share it with a partner via a deep link or the system share sheet. The data model is a name, an origin IATA code, a destination IATA code, and a save date. IATA codes are validated on restore, not on save, so a future airport-data update that renames or removes a code is handled gracefully at load time rather than silently accumulating bad state.

**Reactions and nudges.** During an active Couple Mode session, either partner can send a thinking-of-you nudge as an ephemeral push notification with no persistent state required. Each user is capped at one nudge per five minutes to prevent spam, and the feature is gated on Couple Mode being active with no new persistence layer needed.

**Milestones.** Badge-style achievements unlock on session completion: first long-haul, a session covering every continent, 100 flights with a partner. Unlocked milestone IDs are stored in the user's stats object and computed eagerly on each completion so the unlock animation fires immediately. For users upgrading from a version without milestones, retroactive calculation runs once on first post-upgrade launch; sessions before the upgrade do not count.

---

## 3. New features

**Route library.** A curated set of 10 to 15 named iconic routes (ICN to JFK, SYD to LHR, LHR to JFK, GRU to LIS, and similar) is delivered as a JSON file bundled with the app, with a thumbnail and a one-line description for each route. The picker screen is a simple list with a "Use this route" button; no new infrastructure is required. This has the highest effort-to-value ratio of anything in this list, because it immediately makes the app feel like a polished product and provides data on whether users prefer pre-built routes before any investment in the custom route builder.

**Configurable session shapes.** The current Pomodoro shape (25 minutes focus, 5 minutes short break, 15 minutes long break) is hardcoded in constants inside `useTimer`, and extracting those three values to user settings is a small code change with a large engagement upside. The 52/17 shape from the Draugiem Group study and the 90/20 shape from ultradian rhythm research can be offered as presets alongside the classic Pomodoro, and users who prefer a custom interval can set their own. The `getCurrentDuration()` function in `useTimer` is the single call site that needs to read from settings rather than from hardcoded constants.

**Non-plane vehicles.** The clock contract in `useSessionClock` is vehicle-agnostic, and `flightDurationToSeconds` is the only function that maps a route to a duration. Trains (IST to Sofia), ferries (Dover to Calais), and walks (a Central Park lap) each require a bespoke speed model for that mapping, a bespoke SVG icon, and optionally a different map style. The `useFrameCallback` math, the `interpolateAlongPath` interpolation, and the great-circle waypoint generation are all unchanged, and the estimated effort is three to five days per vehicle once the parameterisation is clean.

**Custom route builder.** Rather than picking from the airport database or a curated library, the user taps waypoints directly on the map to define a route. Each segment is processed by `generateGreatCircleWaypoints`, so multi-leg routes with curves are supported natively. This feature is significantly more complex than the route library and should be deferred until the library has validated that users want to create custom routes rather than consume pre-built ones.

**Offline mode with cached tiles.** MapKit supports native tile caching through `MKMapSnapshotter`, which can pre-render a route at a specified zoom level before a session starts. This capability is outside JavaScript control and requires either a native module or an upgrade to `expo-maps` that exposes the caching API. It is low priority until the rest of the feature set has stabilised and user feedback confirms that tile availability on low-connectivity flights is a meaningful pain point.

---

## 4. Top-5 prioritised list

1. **Unit test harness.** No tests exist in this repo, and the worklet / JS math divergence between `interpolateAlongPathWorklet` and `geoMath.ts:interpolateAlongPath` is an unmitigated silent-failure risk that only a test can close; the first two tests to write are the equivalence assertion for those two functions and a sanity check on `flightDurationToSeconds` for known city pairs against expected duration ranges.

2. **Android / Google Maps camera parity.** The five camera modes are tuned for MapKit and have no verified equivalent on Android; building and device-testing a `useCameraController` abstraction before adding any new camera mode prevents the regression surface from growing further with each new mode.

3. **Configurable session shapes.** Parameterising three constants and adding a settings section is a small code change with a large user-value multiplier, and the 52/17 shape alone would differentiate the app from every standard Pomodoro timer in the App Store.

4. **Route library.** A curated JSON of 10 to 15 iconic routes with thumbnails has zero infrastructure cost and immediately makes the app feel like a polished product while providing data on whether users prefer pre-built routes before the custom route builder is invested in.

5. **Streak tracking (local version first).** The data model is simple, the motivational effect is well-established, and shipping the local-only version delivers value immediately without requiring the Couple Mode sync layer that a partner-streak variant would need.

---

## 5. Risk summary

The most volatile external dependency is `react-native-maps`. The `setCamera` and `fitToCoordinates` signatures have changed across minor versions, and MapKit-specific properties such as `altitude` and `pitch` are underdocumented with no stable equivalents on Android's Google Maps SDK. The remaining dependencies (`expo-haptics`, `expo-notifications`, `expo-audio`) are more stable but should be pinned in `package.json` and audited on every React Native upgrade before any camera or animation code is touched.

The most dangerous internal risk is the `setDisplayTick` re-render chain in `useSessionClock`. The chain works because `AppContext.Provider`'s value changes identity on every tick, which propagates a re-render to every consumer. Any performance optimisation that wraps `AppProvider` or its immediate descendants in `React.memo` with a stable dependency will silently sever this chain, freezing timer text without throwing an error. This constraint is documented in `src/hooks/useSessionClock.ts` and must be the first thing any new contributor reads before touching context or memo boundaries.

The second internal risk is the mathematical duplication between `interpolateAlongPathWorklet` in `FlyModeScreen.tsx` and `interpolateAlongPath` in `src/utils/geoMath.ts`. Both contain identical sub-waypoint interpolation logic with Pacific-crossing longitude normalisation. If one is edited and the other is not, the JS-side restore logic and the UI-thread animation will disagree silently, producing a position error that only surfaces on specific routes or progress values with no error message. The comment "keep in sync" is not sufficient enforcement; the correct mitigation is a unit test that calls both with the same inputs and asserts equal outputs to floating-point tolerance.

The TDZ crash found during Task 4 review is concrete evidence that static analysis has a real ceiling: a `const` referenced before its declaration in a `useEffect` dep array passed every prior task's review and would have crashed on first render. All device checks from Tasks 1 through 4 are outstanding and tracked in `docs/device-check-backlog.md`. Nothing in this document is actionable until that backlog is cleared on a physical device.
