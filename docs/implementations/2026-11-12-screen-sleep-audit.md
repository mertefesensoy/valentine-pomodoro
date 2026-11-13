# 2026-11-12 — Screen sleep audit: why the phone locks itself during a session (DEF-010)

**Status:** Done (a read-only audit; no app code, dependency, version, build or App Store Connect change). The owner approved the recommended answers to [§8](#8-the-proposed-fix-for-151-awaits-the-owner) the same day, and the fix is in [1.5.1's record](2026-11-12-v151-screen-sleep-fix.md). The fix differs from §8.2 in two places, both explained in the record's §5:
- The dependency is pinned at 58.0.3, not the newer 58.0.4 that `npx expo install` chose.
- The hook subscribes to the store outside React, not through a selector, so StoreGate never re-renders because of it.
**Branch:** `fix/1.5.1-screen-sleep`, cut from `master` at `ef915de` (that's `v1.5.0` plus docs; no file under `src/` or `app/` differs from the tag)

---

## 1. Problem / Motivation

The owner's report: while using Valentine Pomodoro, they and their girlfriend found that after a while, on the Ring layout, the facing-pages layout and in Fly mode, "the device closed itself like it was idle". That isn't wanted during a focus session.

This audit reads "closed itself like it was idle" as **the screen dimming and then locking at the Auto-Lock interval**, not the app crashing. If the app disappeared to the Home Screen while the screen stayed lit, that would be a crash, a different defect. Device check D4 ([§6.2](#62-device-checks-the-owner-on-the-app-store-build-or-testflight-never-a-dev-build)) tells the two apart.

### The answer

**Valentine Pomodoro never asks iOS to keep the screen on.** iOS dims and locks the screen once nobody has touched it for the Auto-Lock interval: 30 seconds to 5 minutes, set in Settings → Display & Brightness → Auto-Lock. Low Power Mode fixes it at 30 seconds. A focus session is meant to be watched, not touched, so in every mode the phone locks a few minutes in at most.

**Nobody could see this in development.** In a development build, Expo wraps the whole app in a hook that keeps the screen awake for as long as the app is open. That wrapper is stripped from release builds. So the bug shows only in TestFlight and App Store builds, and has been in every version since v1.

### Root causes, ranked

| # | Cause | Status | Evidence |
|---|-------|--------|----------|
| 1 | **No code in the app disables the screen's idle timer.** No version has ever had one. | **Confirmed in code** | `git grep` for `keep-awake`, `KeepAwake` and `idleTimer` at `v1.5.0` finds nothing outside `package-lock.json`. `git log --all -S KeepAwake` is empty ([§6.1](#61-runnable-checks-of-the-audits-claims)) |
| 2 | **Development builds hide it.** `registerRootComponent` wraps the root in `withDevTools` only when `NODE_ENV !== 'production'`. `withDevTools` calls `useKeepAwake(ExpoKeepAwakeTag)` for the app's whole lifetime. | **Confirmed in code** | `node_modules/expo/src/launch/registerRootComponent.tsx:42-45`; `node_modules/expo/src/launch/withDevTools.ios.tsx:15-27` |
| 3 | **No requirement or test covers it.** The SRS has no requirement about the screen staying on. Jest can't observe the iOS idle timer. Device checks are touch-driven and use release builds, so a check rarely leaves the phone untouched for the whole Auto-Lock interval. | **Confirmed** for the SRS and Jest. **Plausible** for why the device checks missed it | `docs/srs/SRS.md` §3.2 (no matching statement); [§3.5](#35-why-nothing-caught-it) |

Cause 1 is the defect. Causes 2 and 3 explain why it reached the App Store.

### Why it happens in every mode: Ring, pages and Fly

- **Ring and pages are one screen.** They are the two layouts of Classic (`classicLayout: 'ring' | 'spread'`, `src/types/index.ts:48`). Fly runs on the same session store, in its own slot (`src/stores/sessionStore.ts`).
- **None of the three touches the idle timer.**
- **Only touch resets it.** iOS's idle timer counts time since the last touch. It ignores animation, the ring's progress, the turning pages, the plane, the map and Fly's hum. So "even in Fly mode" is expected: Fly's motion and sound don't count as activity.

### What a lock keeps and what it loses

The session itself survives a lock. What the person loses is everything they were watching or hearing.

| Survives the lock | Lost while locked |
|-------------------|-------------------|
| **The session and its time.** The remaining time is `endAt − now` (FR-TMR-003), so on unlock the display shows the right remainder. | **The screen itself:** the ring, the pages, the plane and the timer text. |
| **The end notification.** Notifications are scheduled when the session starts and play the system sound (`src/hooks/useNotifications.ts:53-56`), so a locked phone still alerts, if notifications are on. | **Fly's cabin hum.** The app has no background audio mode, so iOS stops the hum soon after the lock. DEF-009 removed that mode, and it must stay removed (`src/constants/__tests__/appConfig.test.ts`). |
| **The credit for the session.** It completes when the app returns to the foreground, or on a cold start (FR-TMR-005). | **The in-app finish sound, the love-note card and the next phase.** These need the app in the foreground, so they wait until unlock. With notifications off, nothing says the session ended until then. |

### Ruled out

| Suspect | Finding |
|---------|---------|
| DEF-009's removal of the `audio` background mode (1.4.1) | Not the cause. A background mode never keeps the screen on; it only lets sound continue after the lock. No version, including 1.4.0 which declared `audio`, has ever disabled the idle timer. |
| A missing native module | `expo-keep-awake` 58.0.3 is already linked into the iOS build, as a dependency of `expo`. `expo-modules-autolinking resolve -p ios` lists it. So the fix needs no new entitlement, no `Info.plist` key and no background mode. |
| A crash | Nothing points to one, and the report says "like it was idle". Device check D4 confirms it. |
| Low Power Mode | Not a cause. It brings the lock sooner, at 30 seconds, and Auto-Lock's "Never" can't be chosen while it's on. |

---

## 2. What Changed

| File | Change |
|------|--------|
| `docs/implementations/2026-11-12-screen-sleep-audit.md` | This report. |
| `docs/README.md` | Adds this report's row to the implementation records index. |
| `docs/srs/SRS.md` | Only its generated backlinks block changed: `check-docs --write` added a link to this report. |
| `docs/testing/TRACEABILITY.md` | Regenerated by `check-docs --write`: FR-TMR-003 and FR-TMR-005 now list this report. |
| `docs/process/RELEASE.md`, `docs/implementations/2026-10-30-phase1-b6-expo-router.md` | Only their generated backlinks blocks changed. |

No app code, dependency or `app.json` changed. No SRS requirement or defect row changed either. The fix adds the SRS row and the requirement ([§8.3](#83-files-the-fix-will-touch)).

---

## 3. Implementation Approach: how screen sleep works today

### 3.1 The iOS idle timer

`UIApplication.shared.isIdleTimerDisabled` is `false` by default. While it's `false`, iOS dims the screen and then locks the phone once no touch has arrived for the Auto-Lock interval. Setting it to `true` stops the automatic dim and lock while the app is in the foreground. It has these limits:

- **The side button still locks the phone.** Disabling the idle timer never takes manual locking away.
- **It applies only in the foreground.** iOS honours the setting only for the frontmost app.

### 3.2 What the app does: nothing

1.5.0 never sets the idle timer, directly or through a library. The search covered `src/`, `app/`, the config and the whole git history ([§6.1](#61-runnable-checks-of-the-audits-claims)). The only mentions of `expo-keep-awake` in the repository are `package-lock.json` entries, where it is a dependency of `expo` (`package-lock.json:9212`).

### 3.3 What Expo does in development

The app's entry (`index.tsx`) imports `expo-router/entry`. From there, the app reaches Expo's `registerRootComponent` in three steps:

1. `expo-router/entry.js` imports `entry-classic.js`.
2. `entry-classic.js:9` calls `renderRootComponent(App)`.
3. `renderRootComponent` calls Expo's `registerRootComponent` (`node_modules/expo-router/build/renderRootComponent.js:121`).

That function wraps the root component only in a development bundle (`node_modules/expo/src/launch/registerRootComponent.tsx:42-45`):

```ts
if (process.env.NODE_ENV !== 'production') {
  const { withDevTools } = require('./withDevTools');
  qualifiedComponent = withDevTools(component);
}
```

`withDevTools` (`withDevTools.ios.tsx:15-27`) loads `expo-keep-awake` if it is installed, and calls `useKeepAwake(ExpoKeepAwakeTag, { suppressDeactivateWarnings: true })` in the wrapper on every render. The wrapper never unmounts, so in a dev build the idle timer stays disabled for as long as the app is open, on every screen. A release bundle replaces `NODE_ENV` with `'production'`, and the wrapper is never applied.

**What follows:** a dev build stays awake with or without a fix. Only a TestFlight or App Store build can reproduce the bug or prove a fix ([§6.2](#62-device-checks-the-owner-on-the-app-store-build-or-testflight-never-a-dev-build)).

### 3.4 The native module the fix will use

`node_modules/expo-keep-awake/ios/KeepAwakeModule.swift` keeps a set of active tags:

- **`activate(tag)`** adds the tag. When it is the first tag, the module sets `isIdleTimerDisabled = true` on the main queue (`:51-54`).
- **`deactivate(tag)`** removes the tag. When no tags are left, the module sets `isIdleTimerDisabled = false`.
- **`OnAppEntersBackground`** (`:43`) sets the flag to `false` while tags are held. **`OnAppEntersForeground`** (`:37`) sets it back to `true`. So the app needs no `AppState` handling of its own.

On Android, the module sets and clears `FLAG_KEEP_SCREEN_ON` on the activity's window (`ExpoKeepAwakeManager.kt:23,33`). On the web it uses the Wake Lock API where the browser supports it, and otherwise rejects. The fix catches that rejection.

### 3.5 Why nothing caught it

- **Jest** runs without a native idle timer, so no unit test could see a lock.
- **Development builds** keep the screen awake ([§3.3](#33-what-expo-does-in-development)).
- **TestFlight device checks** use release builds, so the bug was there. But each check is a sequence of taps: start, pause, switch, skip. A check rarely leaves the phone untouched for the whole Auto-Lock interval. This last point is **plausible**: no check record says it was never left alone that long.
- **No requirement asked for it,** so no test plan included it.

---

## 4. Mathematical / Statistical Details

**When the lock happens.** Let $t_0$ be the last touch, $A$ the Auto-Lock interval, and $F$ the session's length. The phone locks at

$$t_{\text{lock}} = t_0 + A, \qquad A \in \{30\ \text{s}, 1, 2, 3, 4, 5\ \text{min}, \infty\}$$

$A = 30$ s whenever Low Power Mode is on, and $A = \infty$ means "Never". iOS dims the screen a few seconds before $t_{\text{lock}}$.

A session started with a tap at $t_0$ locks before it ends whenever $A < F$, unless the person touches the screen again. The shortest preset focus is 25 minutes, and the largest finite $A$ is 5 minutes, so $A < F$ always holds. Every focus session and every Fly flight longer than 5 minutes locks unless Auto-Lock is set to "Never". A 1-minute custom session can finish before a 2-minute Auto-Lock.

**What the fix changes.** While a session runs in the foreground, the condition becomes "never", whatever $A$ is. Once nothing holds the tag, iOS's normal idle timer applies again. Apple doesn't document whether the interval then counts from the last touch $t_0$ or from the moment the flag clears. In the first case, an untouched phone locks right after its session ends, and hides the love note and the finish screen at once. In the second, it locks $A$ after the end. Device check D6 ([§8.4](#84-verification-the-fix-must-pass)) records which happens, and the owner decides whether the first is acceptable.

---

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A read-only audit first, the fix after the owner's answers | Fixing in the same pass | The owner asked for an audit. The fix has four product choices ([§8.1](#81-the-owners-decisions)) that are theirs to make. |
| Keep the screen awake **from one place, driven by the session store** | A `useKeepAwake()` in each of Classic and Fly | The tabs never unmount: NativeTabs keeps every `LazyTab` mounted once it has rendered (`src/components/LazyTab.tsx:6`, `app/(tabs)/_layout.tsx:20`). A hook tied to a screen's mount would hold the screen awake for the app's whole life, like the dev wrapper. Battery is the cost. One hook that reads "is a session running" covers Ring, pages and Fly at once, with no code in any screen. |
| An app-specific tag (`valentine-pomodoro-session`) | Expo's default tag | In a dev build the dev wrapper holds the default tag. Deactivating the default tag would release the wrapper's hold, and with a tag of its own the app can't disturb the wrapper. |
| **Foreground only, with no background mode** | Background audio to keep the hum going after a lock | DEF-009: no version may declare `audio` in `UIBackgroundModes`, and `appConfig.test.ts` pins it. Keeping the screen on makes a lock rare in the first place, which keeps the hum going in practice. |
| `expo-keep-awake` as a direct dependency | Importing the copy that is already there through `expo` | The app's code would import it, and a package the code imports belongs in `package.json`. `npx expo install` pins the SDK's version, the 58.0.3 already resolved. The binary's native modules don't change. |

---

## 6. Verification

### 6.1 Runnable checks of the audit's claims

Run these from the repository root; each one's expected result is listed after it.

- [x] **No idle-timer code at `v1.5.0`.** Expect no output:
  ```bash
  git grep -n -i -E "keep-?awake|KeepAwake|idleTimer" v1.5.0 -- ':!package-lock.json'
  ```
- [x] **None in any commit, ever.** Expect no output:
  ```bash
  git log --all --oneline -S KeepAwake
  ```
- [x] **The native module is linked for iOS.** After `npm ci` on this commit, expect 24 modules, among them `expo-keep-awake` and 1.5.0's `expo-apple-authentication`:
  ```bash
  npx expo-modules-autolinking resolve -p ios --json
  ```
- [x] **The dev wrapper is dev-only.** Read `node_modules/expo/src/launch/registerRootComponent.tsx:42-45` and `withDevTools.ios.tsx:15-27`. These are the installed `expo` 58.0.21 and `expo-router` 58.0.28, the versions in this commit's `package-lock.json`.
- [x] **The app code is what shipped.** `git diff --stat v1.5.0 HEAD -- src app` is empty.

### 6.2 Device checks (the owner, on the App Store build or TestFlight, never a dev build)

A dev build stays awake whatever the code does, so it can't show the bug or the fix ([§3.3](#33-what-expo-does-in-development)). These checks confirm the diagnosis on the App Store's 1.5.0 (build 64). None has been run yet.

- [ ] **D1, Ring.** Set Auto-Lock to 30 seconds, start a focus on the Ring layout, and don't touch the phone. Expected with 1.5.0: it dims and locks after about 30 seconds. On unlock, the timer shows the right remainder and the session is still running.
- [ ] **D2, pages and Fly.** Repeat D1 on the facing-pages layout and with a Fly flight. Expected: the same.
- [ ] **D3, Low Power Mode.** Turn on Low Power Mode and repeat D1. Expected: it locks after about 30 seconds whatever Auto-Lock was set to.
- [ ] **D4, crash or lock.** During D1 or D2, note whether the screen went dark (a lock) or the app vanished to a lit Home Screen (a crash). If it was a crash, report it, as a separate defect.
- [ ] **D5, Fly's hum.** During D2's Fly flight with the hum on, note whether it stops at the lock, and whether it comes back after unlock. This sets the baseline for the fix's check.

---

## 7. Related Docs

- [SRS](../srs/SRS.md): FR-TMR-003 (the `endAt` clock), FR-TMR-005 (completion), and §3.4, where DEF-010 goes.
- [DEF-009: the background audio mode](2026-11-03-def-009-background-audio-mode.md): why the fix stays foreground-only.
- [Phase 1 B6: Expo Router](2026-10-30-phase1-b6-expo-router.md): why the tabs never unmount.
- [Release process](../process/RELEASE.md): a PATCH release, and its checklist.
- [Update check audit](2026-11-06-update-check-audit.md): the previous read-only audit, whose format this one follows.

---

## 8. The proposed fix for 1.5.1 (awaits the owner)

### 8.1 The owner's decisions

Each recommendation below is a default. None is built until the owner approves.

| # | Question | Recommendation | Why |
|---|----------|----------------|-----|
| Q1 | During **breaks**, should the screen stay on, or only during focus? | **Breaks too:** the whole running session. | The ring and the pages count down the break too. "Running" means the same in every mode, and Fly has no breaks. |
| Q2 | While **paused**, should the screen stay on? | **No:** a paused session releases it. | A paused phone left on a desk shouldn't burn its battery. Resume holds it again. |
| Q3 | On the **other tabs** (Stats, Notes, Settings) while a session runs? | **Yes:** app-wide while a session runs. | It's simpler and has fewer edge cases: the tabs stay mounted, and the session is still running. Limiting it to the Timer tab would need focus tracking (`useScreenFocus`), a second condition to test. |
| Q4 | **A Settings switch** ("Keep screen on during sessions")? | **Not in 1.5.1.** Revisit for 1.6.0. | A patch with no new strings needs no English and Turkish copy review. The side button still locks the phone whenever the person wants. |

### 8.2 How it works

- **Install:** `npx expo install expo-keep-awake`, which adds it as a direct dependency at the SDK's version.
- **The hook:** a new `src/hooks/useKeepScreenAwake.ts`.
  - **Contract:** `useKeepScreenAwake(active: boolean): void`.
  - **While `active` is `true`:** it calls `activateKeepAwakeAsync(TAG)`.
  - **When `active` turns `false`, or the hook unmounts:** it calls `deactivateKeepAwake(TAG)`.
  - **Errors:** both calls' rejections are caught and dropped. They happen only on an unsupported web browser.
  - **Invariant:** the hook is mounted exactly once.
- **Where it's mounted:** in `StoreGate`, beside `useSessionClockEngine(ready)` (`src/stores/StoreGate.tsx:55`). StoreGate is already the single home of the clock's side effects.
- **The condition** (with the recommended Q1 to Q3):
  ```ts
  ready && activeKind !== null && clock[activeKind]?.isRunning === true
  ```
  It is read from `useSessionStore` with a selector that returns a boolean, so the gate re-renders only when that boolean changes, not every second.
- **Every transition follows from the store** (`src/stores/sessionStore.ts`):
  - `start` and `resume` hold the tag.
  - `pause`, `stop` (skip and reset) and completion release it. Completion clears the slot (`fireCompletion`).
  - `switchTo` auto-pauses the other kind, so only the active kind's running state counts.
  - Going to the background and coming back is the native module's job ([§3.4](#34-the-native-module-the-fix-will-use)).
- **Nothing changes in** Classic, Fly, `app.json`'s plugins or `UIBackgroundModes`.

### 8.3 Files the fix will touch

| File | Change |
|------|--------|
| `package.json`, `package-lock.json` | `expo-keep-awake` as a direct dependency; the version goes to 1.5.1. |
| `app.json` | `expo.version` goes to 1.5.1. |
| `src/hooks/useKeepScreenAwake.ts` | New: the hook ([§8.2](#82-how-it-works)). |
| `src/stores/StoreGate.tsx` | Mounts the hook with the running condition. |
| `src/hooks/__tests__/useKeepScreenAwake.test.tsx` | New: with `expo-keep-awake` mocked, these are held: start, pause, resume, skip, reset, completion, a Fly flight, and switching kinds. A mutation check proves the tests fail when the mount is removed. |
| `docs/srs/SRS.md` | A new FR-TMR requirement ("While a session runs and the app is in the foreground, the screen shall not dim or lock by itself"), and DEF-010 in §3.4. §3.4 already has two rows called DEF-009 (the background mode, and the Stats banner on build 46), so this one is DEF-010. |
| `CHANGELOG.md` | The 1.5.1 entry, written for users. |
| `docs/implementations/2026-11-12-v151-screen-sleep-fix.md` | The fix's own record. |

The App Store's "What's New" text for 1.5.1 needs English and Turkish wording, and those strings go through the owner's copy review.

### 8.4 Verification the fix must pass

- [ ] **The usual checks:** `npm run typecheck`, `npm run lint` and `npm test` pass, and the hook's mutation check fails as it should.
- [ ] **The pin stays:** `appConfig.test.ts` still passes, so there's still no `audio` background mode.
- [ ] **On a TestFlight build of 1.5.1**, with Auto-Lock at 30 seconds:
  - **Running:** Ring, pages and a Fly flight each stay lit for at least 2 minutes with no touch.
  - **Paused:** the screen locks about 30 seconds after the pause.
  - **D6, after the end:** when a session finishes untouched, the screen is allowed to lock again. Record how soon it does.
  - **Side button:** it still locks the phone mid-session, and on unlock the session is still running with the right time.
  - **Fly:** the hum plays for the whole flight with no lock.
- [ ] **D3 again with the fix:** Low Power Mode doesn't override it.
- [ ] **The checks on the docs, last:** `node scripts/docs/check-docs.mjs --write`, then `node scripts/docs/check-docs.mjs`.
