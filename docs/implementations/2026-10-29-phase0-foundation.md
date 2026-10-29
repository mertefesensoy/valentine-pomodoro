# 2026-10-29 — Phase 0: Foundation and safety net

**Status:** In progress. Items 1–8 below are done; the SDK upgrade and the device checks are open (§6.3).
**Branch:** `rehaul/v2` (local only, nothing pushed)
**Plan:** [2026-10-29-couples-rehaul-plan.md](2026-10-29-couples-rehaul-plan.md), §7 Phase 0

---

## 1. Problem / Motivation

The rehaul plan cannot start until four things are true:

- the code has a real trunk
- dependencies install reproducibly
- there are measured baselines to improve against
- there are tests that catch the regressions the plan worries about most

Before this phase none of these held:

- `master` was 53 commits behind the release branch.
- `npm ci` refused the lockfile.
- No sizes or scores had been recorded.
- There was not a single test.

## 2. What Changed

| Commit | Files | Change |
|--------|-------|--------|
| `fda4fef` (on `master`) | — | Fast-forwarded `master` to `release/ios-1.3.0`, then merged `origin/master`'s privacy-policy commit `79c5675`. `master` now contains every commit from both; nothing is behind it. |
| `61054cd` | `docs/implementations/_TEMPLATE.md`, `…couples-rehaul-plan.md` | The plan and the doc template. |
| `730568c` | `package-lock.json` | Added the optional platform bindings the lockfile was missing, so `npm ci` works. Additions only; no locked version changed. |
| `abc77ef` | `jest.setup.ts`, `package.json`, `src/utils/geoMathWorklet.ts`, `src/screens/FlyModeScreen.tsx`, `src/hooks/useTimer.ts`, four test files | Jest + RNTL + Reassure harness. `interpolateAlongPathWorklet` moved unchanged into its own module so it can be tested. The phase functions were exported for tests. |
| `70cfd8d` | `src/screens/StatsScreen.tsx`, `src/screens/__tests__/StatsScreen.hooks.test.tsx` | **Behaviour fix.** The loading early-return now comes after every hook (§3.3). |
| `9db67e2` | `GiftModeModal.tsx`, `PremiumCalmBackground.tsx` | The last two lint errors: an unescaped apostrophe and a missing `displayName`. Visible copy is unchanged. |
| `9a24a62` | `.github/workflows/ci.yml` | CI: typecheck, lint, unit tests; Reassure comparison on pull requests. |
| `993a51e` | `docs/baselines/2026-10-29/*` | The lint, expo-doctor and Lighthouse baselines. |
| `b79085a` | 26 files | Removed dead template code, unused images and the font, four unused packages, and archived `PHASE4_TEST.md`. Declared `expo-application`. |
| `f4c25db` | `package.json`, `package-lock.json` | Version aligned with `app.json`: 1.2.5 → 1.3.1. |
| `ece7280` | `.claude/skills/*`, `.claude/agents/*`, `.gitignore` | Impeccable 4.8.0 and ten Emil Kowalski skills, at project scope, with their licenses. |
| `1c73500` | `package.json`, `package-lock.json`, `app.json` | Expo SDK 54 patch updates from `npx expo install --fix`. Expo also registered the `expo-font` config plugin. |

## 3. Implementation Approach

### 3.1 Trunk

`master` was an ancestor of `release/ios-1.3.0` plus one local commit (`d4c321f`) that the release branch already contained. So `master` was fast-forwarded to the release branch, and `origin/master`'s single extra commit was merged with `--no-ff`. Neither branch was rewritten, and nothing was pushed.

### 3.2 Tests (25 tests, 5 suites, plus 1 Reassure scenario)

| Test file | What it pins | Why |
|-----------|--------------|-----|
| `hooks/__tests__/timerPhases.test.ts` | `nextAfterComplete` and `nextAfterSkip`: the 4-cycle long break, and skip never counting toward it. | The v2 session engine (plan §4.2) must reproduce this cycle exactly. |
| `hooks/__tests__/useSessionClock.test.ts` | 1 Hz countdown; pause freeze and resume; completion fired once when the foreground event and the ticker both see the end; cold-start completion; two-slot preservation. | These are the device-backlog Task 1 and Regression Gate behaviours, now automated. |
| `context/__tests__/timerTextTicks.test.tsx` | Timer text changes every second when read through `AppProvider` → `useApp()`. | **The guard for plan §4.5.** It must keep passing when Phase 1 replaces the re-render chain. |
| `utils/__tests__/geoMath.equivalence.test.ts` | The worklet ≡ the JS interpolation on 5 routes × 210 progress values; antimeridian continuity; bearing range; the pinned `flightDurationToSeconds` formula and its monotonicity. | Scale-plan item 1, and your memory note on worklet duplication. |
| `screens/__tests__/StatsScreen.hooks.test.tsx` | The Stats screen survives `isReady` flipping on a mounted screen. | Regression test for the bug fixed in `70cfd8d`. |
| `context/__tests__/rerenders.perf-test.tsx` (Reassure) | Render count of a component that reads only settings, during 10 s of a running session. | The F1 baseline (§4). |

**Mutation check.** A test that passes proves nothing until you've seen it fail. Three deliberate breakages were tried, and the files were restored after each:

| Breakage | Expected to be caught by | Result |
|----------|--------------------------|--------|
| Remove `setDisplayTick` | `timerTextTicks` | **Caught** (1 failed) |
| Remove the `lonDiff < -180` wrap in the worklet | equivalence test | **Caught** (3 failed) |
| Remove the `live.endAt !== slot.endAt` guard in `fireCompletion` | "fires completion exactly once" | **Not caught**: see below |

The last one is not a test gap. The guard can't currently be reached. The first caller clears the slot synchronously through `clockStateRef`, so any second caller returns earlier, at `if (!activeKind) return`. "Exactly once" holds end to end, and the guard is defence in depth. The v2 engine makes it moot, because idempotency moves into a database unique key (plan §4.2).

**Test configuration:**

- `jest-expo` preset.
- Package mocks for AsyncStorage, Reanimated and safe-area, plus a minimal AdMob stub limited to the exports the app imports (`jest.setup.ts`).
- Unit tests match `__tests__/**/*.test.*`; Reassure files are named `*.perf-test.*`, so the two runners never pick up each other's files.
- RNTL 14's `render`, `renderHook` and `act` are async, so every call is awaited.

### 3.3 The Stats screen fix

`StatsScreen` returned `Loading stats…` before five `useMemo` calls. On the first render (not ready) React recorded 2 hooks; when stats finished loading on a mounted screen it saw 7 and threw "Rendered more hooks than during the previous render." The bottom tab keeps the screen mounted, so this could happen in normal use whenever the Stats tab was opened before stats loaded.

The test reproduced the throw before the fix. The fix moves the return below the last hook. The memos are cheap and run on the default state while loading.

### 3.4 Cleanup

The import graph was traced, not grepped:

- `Home.tsx` and `Explore.tsx` are not registered in `navigation/index.tsx`.
- Ten modules were reachable only from those two screens; `WaveLines` was reachable from nothing.
- `src/assets/images/*` is referenced by nothing (`app.json` uses the root `assets/images/`).
- SpaceMono was used only by `Explore`, and `App` blocked first render on loading it, so that gate was removed.

depcheck confirmed `geolib` and `expo-status-bar` as unused. `expo-image` and `expo-web-browser` became unused once the dead files were gone.

Kept on purpose:

- `expo-build-properties` and `expo-asset` (config plugins)
- `react-native-screens` (navigation peer)
- `expo-linking` (Expo Router needs it in Phase 1)
- `expo-font` (peer of `@expo/vector-icons`; the Phase 1 display font loads through it)
- `react-native-web` and `react-dom` (the web app is in scope)

`expo-image` comes back with `npx expo install` when Phase 1 first uses it.

**Undeclared dependency found:** `useUpdateCheck.ts` imports `expo-application`, which only resolved because another package pulled it in. It is now declared (`~7.0.8`).

### 3.5 Skills

**Impeccable 4.8.0:**

- Installed with `npx impeccable install --providers=claude --scope=project --no-hooks -y`. Its launcher runs (`impeccable.cmd context` reports `NO_PRODUCT_MD`, as expected).
- The 20 MB engine binary is git-ignored; the launcher downloads it and checks it against `engine-checksums.txt` on first run.
- `LICENSE` and `NOTICE.md` were copied in to meet Apache-2.0.

**Emil Kowalski** (`emilkowalski/skills@a81dbca`, MIT, `LICENSE` copied into each skill):

- **React Native:** `animate-expo`, `review-animations`, `improve-animations`, `animation-performance`, `find-animation-opportunities`, `remove-animations`, `animation-vocabulary`, `break-ui`
- **Web, for Phase 6:** `animate`, `emil-design-eng`

Skipped as irrelevant: `write-swift`, `ask-sonner`, `pick-ui-library`, `prototype`, `apple-design`, `mobile-native`.

All SKILL.md files were read before installation; the Emil skills are plain Markdown with no scripts.

**The skills load from the next session.** Skills are discovered when a session starts.

## 4. Measurements (the baselines)

**Bundle (production, Hermes).** Always measure with:

```bash
npx expo export --platform ios --platform android --dump-sourcemap
```

The `--dump-sourcemap` flag changes the output: the same Android build is 3.32 MB with it and 5.05 MB without. Only exports made with the same flags can be compared.

| | Before Phase 0 | After cleanup | After SDK 54 patches (now) |
|--|----------------|---------------|----------------------------|
| iOS bytecode | 3,248,460 B (1,714 modules) | 3,240,028 B (1,704 modules) | 3,243,628 B |
| Android bytecode | 3,315,428 B (1,728 modules) | 3,315,284 B | 3,318,740 B |
| Bundled assets | 1,709,080 B | 1,615,828 B (−93 KB: SpaceMono) | — |

The cleanup barely moves the bytecode, because Metro only bundles reachable modules and the deleted files were unreachable. The real bundle savings are the plan's lazy-loading of Fly Mode and `airports.json` (Phase 1).

**Largest packages by source size** (from the source map; this measures source, not bytecode):

| Package | Share |
|---------|-------|
| react-native | 38 % |
| Reanimated | 13 % |
| app source | 5 % |
| Gesture Handler | 4 % |
| react-native-svg | 4 % |
| AdMob plus its consent library (`@iabtcf/core`) | 4.4 % |

**Web.** `npx expo export --platform web` **fails today**: `react-native-google-mobile-ads` imports a native component that cannot bundle for web. Phase 6 needs platform-split ad modules (`AdManager.native.ts` / `AdManager.web.ts`).

**Re-renders (F1), Reassure.** A component that reads only `settings` renders **14 times** in a scenario of mount, start, 10 one-second ticks and stop, consistently across runs. The Phase 1 target is the mount and load renders only (about 2).

**Website Lighthouse** (mobile, Lighthouse 12.8.2). The report is at `docs/baselines/2026-10-29/lighthouse-website-mobile.html`.

| Category | Score |
|----------|-------|
| Performance | 92 |
| Accessibility | 90 |
| Best Practices | 100 |
| SEO | 100 |

- **Metrics:** First Contentful Paint 1.0 s, **Largest Contentful Paint 3.0 s**, Total Blocking Time 40 ms, Cumulative Layout Shift 0, Speed Index 4.2 s, 269 KiB transferred.
- **Accessibility failures:** `button-name`, `color-contrast`, `label-content-name-mismatch`.
- **Performance opportunities:** WebP/AVIF images (−28 KiB), responsive images (−38 KiB), unused JS (−25 KiB), legacy JS (−13 KiB).
- **Caveat:** this ran against the site's existing production build (`out/`) served locally, so the cache-policy and server-timing audits don't represent the real host. The live URL could not be measured (next finding).

**Lint:** 49 problems with 7 errors → **40 warnings, 0 errors**. **Typecheck:** clean. **expo-doctor:** 16/18 → 17/18 (the remaining failure is §6.3 item 2).

## 5. New findings (not in the plan)

1. **The live website is unreachable from this network.** `https://valentine-pomodoro-developer-websit.vercel.app` resets the TLS connection, while `vercel.com` loads fine, so `*.vercel.app` is being blocked on this connection. If that is ISP-level, visitors in Turkey cannot open the site, which is also where the store listing points. **A custom domain is now required, not optional.** This moves the "domain" item in plan §11 to the top.
2. **The tracked `android/` folder is stale.** It was generated once (`f588882`) and never regenerated, while `app.json` changed many times since. EAS does not sync `app.json` into an existing native folder, so Android builds have been ignoring later `app.json` changes. `AndroidManifest.xml:15` hard-codes the **test** AdMob app id with `tools:replace`, so fixing `app.json` alone would not fix Android ads.
3. **The Stats screen could crash** on load (fixed, §3.3).
4. **`expo-application` was undeclared** (fixed, §3.4).
5. **`flightDurationToSeconds`'s doc comment is stale.** It says "10:1 scale, minimum 5, maximum 90 min"; the code uses ÷5 with a [5, 180] min clamp, and the real floor is 9 min, because 45 min of short-haul overhead ÷ 5 = 9. The 5-minute clamp is unreachable. The test pins the code's behaviour; the comment gets fixed when Fly Mode is reworked in Phase 4.
6. **`npm audit` reported 40 advisories:** 1 critical (`shell-quote`), 12 high, 9 moderate and 18 low, all transitive. Each one was checked against the iOS and Android source maps, and **only `nanoid` actually ships in the app bundle**. It is used by React Navigation for route keys of fixed size, so its advisories (negative, zero or overflowing sizes) can't be triggered here.
   - It was bumped anyway, within range, from 3.3.11 to 3.3.20 (commit below). The total is now 39.
   - The rest (`shell-quote`, `@xmldom/xmldom`, `image-size`, `ws`, `postcss`, `minimatch` and so on) are Expo CLI, Metro and config-plugin tooling that runs on the developer machine and in EAS, not on phones.
   - They will be re-checked after the SDK upgrade, which replaces most of that tree.
7. **The upgrade gap is larger than planned.** The latest Expo is **SDK 58** (58.0.21); the app is on 54. react-native-maps is 1.29.11 upstream (the app has 1.20.1 plus a local AIRMap patch); AdMob is 17.4.0 (the app has 16.x).
8. `scheduleOnRN` exists in the installed `react-native-worklets`, which settles that open item from plan §5.3.

## 6. Verification

### 6.1 Reproducible here

```bash
npm ci
npm run typecheck
npm run lint
npx jest
npx reassure --baseline
npx expo export --platform ios --platform android --dump-sourcemap
npx expo-doctor
```

`npm run lint` exits 0 with warnings; `npx jest` reports 25 passed; `npx expo-doctor` reports 17/18 until §6.3 item 2 is done.

### 6.2 Not verifiable here

There is no Android SDK or iOS toolchain on this machine, so no native build was run. The app's native code is unchanged in this phase: no `android/` edits, and the only `app.json` change is the `expo-font` plugin entry that Expo added.

### 6.3 Still open in Phase 0

1. **Expo SDK 54 → 58.** Blocked on a decision: the path, and permission to run EAS builds to verify it (asked separately).
2. **`android/` → generated native projects (CNG).** Delete the folder and git-ignore `/android` and `/ios`, so `app.json` becomes the single source of truth. Pending your yes.
3. **Device checks on the current v1.3.1 build** (yours, on a physical phone). From `docs/device-check-backlog.md`:
   - [ ] Regression Gates: a full focus → short break → focus cycle (love note and stats fire); Stats attribution across both modes.
   - [ ] Task 1: Pomodoro and Fly timers match within ±0.5 s; a 10 s pause doesn't change elapsed time; 30 s in the background shows real elapsed time on return; warm-return completion fires once; two-slot preservation; the pill matches the dashboard in portrait and landscape.
   - [ ] AIRMap crash regressions: tier-1 airports as origin and destination, a full session, then reset and re-pick.
   - [ ] **New:** open the Stats tab right after a cold launch, before stats load. It must not crash.
4. **`/impeccable init`.** It writes `PRODUCT.md` through questions to you, and becomes the first task of Phase 1, in a new session so the skill is loaded.

## 7. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Fast-forward `master`, then a `--no-ff` merge of `origin/master` | Rebase the release branch onto `origin/master`; reset `master` | No history is rewritten, and the remote stays a plain fast-forward away when you push. |
| Repair the lockfile with `npm install` | Delete it and regenerate | Keeps every locked version (verified: additions only), so the baseline is the real shipped tree. |
| Extract the worklet into its own module | Export it from `FlyModeScreen`; mock react-native-maps in tests | The test imports no screen code; the function body is byte-identical; still module scope for the worklets plugin. |
| Characterization tests (pin current behaviour, including skip-doesn't-count and the 9-minute floor) | Test the intended behaviour | Phase 0 is a safety net for refactors; behaviour changes belong to the phase that decides them. |
| Fix the Stats crash now | Leave it for Phase 1's rewrite | It is a crash in the build that ships to users first (v1.4); the fix is 2 lines plus a test. |
| Impeccable without its edit hook | Accept the installer's hook | A hook that runs on every file edit is a standing configuration change for you to opt into. One flag (`npx impeccable install --force`, without `--no-hooks`) adds it later. |
| Don't jump to SDK 58 in this session | Upgrade now | It can't be verified here (no native toolchain); the maps patch is pinned to 1.20.1; AdMob and Reanimated pairings change per SDK; and `android/` needs regenerating first. Expo recommends one SDK at a time. |

## 8. Related Docs

- [Rehaul plan](2026-10-29-couples-rehaul-plan.md): §1.2 F1–F11, §4.5, §6.1, §7 Phase 0
- [Device check backlog](../device-check-backlog.md)
- [Scale plan](../scale-plan.md): item 1 (test harness)
- [Archived Phase 4 test guide](../archive/PHASE4_TEST.md)
