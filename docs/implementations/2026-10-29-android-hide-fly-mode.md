# 2026-10-29 — Hide Fly Mode where it can't open, and stop the saved-mode crash loop

**Status:** Done in code and unit-tested; **device check pending** (it needs an EAS preview build, which needs your go-ahead)
**Branch:** `rehaul/v2`
**Decision:** yours, 2026-10-29: option (b) in the [Phase 1 plan](2026-10-29-phase1-plan.md) §6 item 7

---

## 1. Problem / Motivation

The Android device check (upgrade doc §6.3, run 2) found two linked failures:

1. **Opening Fly Mode crashes on Android:** `API key not found … com.google.android.geo.API_KEY`. On Android, react-native-maps renders Google Maps, which refuses to start without an API key, and the app has never had one.
2. **A crash loop follows.** `AppContext` persists the chosen mode (`app_mode`), so after one tap on Fly, every later launch went straight back into Fly Mode and crashed within about 3 s, until the app's data was cleared.

No user has hit this: Android has not shipped since 1.0.1, which predates Fly Mode. v1.4 would have shipped it to every Android user.

You chose to hide Fly on Android until the illustrated map (rehaul plan §4.8, Phase 4b), which needs no key. Android camera parity for the real map is also unbuilt (scale-plan item 2, Phase 4c).

## 2. What Changed

| File | Change |
|------|--------|
| `src/constants/features.ts` | New. `isFlyModeAvailable(os)` and `resolveAppMode(mode, os)`. |
| `src/context/AppContext.tsx` | The stored mode and every requested mode pass through `resolveAppMode`. |
| `src/screens/TimerScreen.tsx` | The Default/Fly switcher renders only where Fly is available. |
| `src/constants/__tests__/features.test.ts` | New. Pins the platform gate and the fallback. |
| `src/context/__tests__/flyModeGuard.test.tsx` | New. Covers the crash-loop scenario end to end through `AppProvider` and AsyncStorage. |
| `docs/implementations/2026-10-29-phase1-plan.md` | §6 item 7 marked decided. |

## 3. Implementation Approach

**`isFlyModeAvailable(os = Platform.OS): boolean`**
- **Contract:** true only for `ios`.
- iOS is the one platform whose map provider (Apple Maps) works without configuration.
- **Android** needs a Google Maps key.
- **Web** has no react-native-maps implementation at all, so Fly would crash there too. The gate therefore says "where Fly can open", not just "not Android".

**`resolveAppMode(mode, os = Platform.OS): AppMode`**
- **Contract:** returns `'default'` when `mode` is `'fly'` and Fly is unavailable on `os`; otherwise returns `mode` unchanged.
- It is pure, with no side effects.
- `AppContext` applies it in two places:
  - **On load:** a stored `'fly'` resolves to `'default'`, which breaks the crash loop for any install that already saved `'fly'`.
  - **On every `setActiveMode`:** a request for `'fly'` where Fly can't open is ignored, and `'default'` is what gets persisted. Defence in depth: a hidden switcher can't be tapped, but no future code path can reach Fly on Android either.
- The stored value is **not** rewritten on load. Reads stay side-effect free, and the Phase 1 migration fixture (task A3) sees storage exactly as v1.3.1 left it.

**The switcher.** With only one mode, a Default/Fly switcher is noise, so the Classic screen omits it where `isFlyModeAvailable()` is false. The switcher inside Fly Mode is unreachable there, since Fly never renders.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Hide Fly where it can't open | A Google Maps key (option a) | Your choice. No key to create, restrict or keep out of a public repo, and the untested Android camera code stays off the default path until Phase 4c. |
| Gate on "iOS only" | Gate only Android | Web would crash the same way, and the Phase 6 web build would otherwise inherit the bug. |
| Resolve on read and on write | Rewrite the stored value once | The same result without a storage write. It also covers a restore from a backup that carries `'fly'`. |
| Hide the whole switcher | Show it with Fly disabled | A disabled option the user can never enable is a dead end. Fly returns on Android as Fly Together in Phase 4b. |

## 6. Verification

Done here:

- [x] **Tests first.** Both new suites failed before the fix: the module was missing, and on Android the probe read `fly` instead of `default`. The iOS case passed, which shows the platform override in the test works.
- [x] After the fix: `npx jest --ci` gives **32/32** (25 existing, including the `timerTextTicks` guard, plus 7 new). `npm run typecheck` is clean. `npm run lint` gives 0 errors and 145 warnings, the same count as before.

Needs a device (EAS preview build, your go-ahead):

- [ ] Android emulator, over the current install, which still has `app_mode` stored from earlier taps: the app opens in Classic, with no switcher and no crash.
- [ ] iOS (TestFlight, later): the switcher is still there and Fly opens.

## 7. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md): §6 item 7, task B1 (lazy Fly, still relevant on iOS)
- [Expo SDK 58 upgrade](2026-10-29-expo-sdk-58-upgrade.md): §6.3, run 2
- [R8 launch-crash fix](2026-10-29-android-r8-workmanager-crash.md)
