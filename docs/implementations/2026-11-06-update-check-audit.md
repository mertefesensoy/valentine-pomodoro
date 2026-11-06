# 2026-11-06 — Update check audit: why the app said "latest version 1.4.0"

**Status:** Done (read-only audit; no app code, `update.json`, tag, build or App Store Connect change). The fix follows in [1.4.2](2026-11-06-v142-update-check-fix.md).
**Branch:** `fix/1.4.2-update-check`, carried with the fix

All times are UTC unless marked TR (Turkey, UTC+3). The live probes ran on 2026-11-05 between 21:05 and 21:17 UTC, which is 00:05 to 00:17 TR on 2026-11-06.

---

## 1. Problem / Motivation

The owner's report: "my girlfriend said the update didn't landed on her application and when she pressed check for updates it said latest version 1.4.0 for some reason." They asked for an extensive audit of why the application doesn't get update notifications when a new version launches.

### The answer

**The app asks Apple a question, and Apple's content delivery network (CDN) answers with a copy of the response saved up to 24 hours earlier.** At the time of these probes, the exact address the app calls still returned 1.4.0, more than two hours after 1.4.1 went live, while the same request with a meaningless extra parameter returned 1.4.1. Her phone has 1.4.0 installed, the app compared 1.4.0 with 1.4.0, and it said she was up to date. Running the hook exactly as committed at tag `v1.4.0` against the live network produces the message she described (§6.5). This assumes she pressed the button after the release, and nothing here observed her phone directly (§6.6).

### Root causes, ranked

| # | Cause | Status | Evidence |
|---|-------|--------|----------|
| 1 | **Apple's CDN serves the app's exact lookup URL from a copy up to 24 h old.** The app adds nothing to defeat it. Every iOS build from 1.3.1 on has this. | **Confirmed**, reproduced live | [`useUpdateCheck.ts:47`](../../src/hooks/useUpdateCheck.ts); §6.2, §6.3, §6.5 |
| 2 | **The phone's own HTTP cache can keep that same answer.** Expo's `fetch` uses the default session and cache policy, and the response says `max-age`. | **Plausible.** The code path is confirmed; the behaviour can only be seen on a phone | `ExpoFetchModule.swift:131`, `ExpoURLSessionTask.swift:24`; §3.4 |
| 3 | **The automatic check runs once per cold launch and never again.** No check on returning to the app, no retry after a failure, and failures are silent. | **Confirmed in the code.** Whether it affected her is plausible | [`useUpdateCheck.ts:76-77,91,125`](../../src/hooks/useUpdateCheck.ts) |
| 4 | **No notification exists outside the app.** The only "notification" is an alert shown while the app is open. There is no push and no local notification about updates. | **Confirmed**, by design | §3.1 |
| 5 | **The App Store's own automatic update hadn't reached her yet.** Roughly two hours after release is normal. A phased release, if chosen for 1.4.1, would make it slower. | **Plausible.** Only the owner and her phone can tell | §6.7 |
| 6 | **She may be on a TestFlight build of 1.4.0.** Every tagged TestFlight build from 42 to 60 declares version 1.4.0, and the message can't tell them from the App Store build. | **Plausible, needs ruling out** | §3.3, §6.7 |

Causes 1 and 3 together explain most of the owner's general complaint: a new version stays invisible to the check for up to a day, and the check then runs only on the next cold launch. Meanwhile the App Store often installs the update by itself, so the prompt never has a reason to appear.

### Ruled out

| Suspect | Finding |
|---------|---------|
| The version comparison | Numeric and correct: `1.4.1` > `1.4.0`, `1.10.0` > `1.9.0`, `1.4` = `1.4.0` (§4.2, §6.5). |
| iOS reading `update.json` | iOS 1.3.1 and later never fetch it ([`useUpdateCheck.ts:81-83`](../../src/hooks/useUpdateCheck.ts)). Its 1.3.1 plays no part here. |
| A check dropped or broken in the rewrite | The launch check and the button both exist at every tag from 1.3.1 on, reading the same URL. `v1.4.0` and `v1.4.1` are byte-identical in these files (§3.5). |
| The Turkish or US storefront lagging | **This is a misdiagnosis in the project memory.** The difference follows the exact URL and CDN path, not the storefront (§6.2). |
| "1.4.0" being the store's number | The message prints the installed version (§3.3). |
| Removal from sale or a wrong listing | A fresh lookup in `us` and `tr` shows 1.4.1, released 2026-11-05T19:04:08Z, and both public store pages contain "1.4.1" (§6.2, §6.4). |

---

## 2. What Changed

| File | Change |
|------|--------|
| `docs/implementations/2026-11-06-update-check-audit.md` | This report. Nothing else in the repository changed. |

The project memory's note on the lookup was corrected, because it records the misdiagnosis above. Raw probe output is in the shared notes folder for this group of sessions (§7).

---

## 3. Implementation Approach: how the update check works today

### 3.1 Every piece of code that decides whether an update exists

A search of `src/` and `app/` for `update`, `lookup`, `itunes`, `update.json`, `nativeApplicationVersion`, `Linking`, `apps.apple.com`, `expo-updates`, push-token calls and `AppState` finds one decision point: `useUpdateCheck`. It is mounted twice, and the module-level flag stops the second mount from checking again.

| Where | When it runs |
|-------|--------------|
| [`src/App.tsx:49`](../../src/App.tsx) | Automatically, once per cold launch, after the first frame |
| [`src/screens/SettingsScreen.tsx:83`](../../src/screens/SettingsScreen.tsx) and `:428` | The same hook, plus the **Check for updates** row, which calls `checkForUpdates({ force: true })` |

**Does an automatic notification exist?** Only as an in-app alert during a cold launch. `expo-notifications` serves timer and reminder notifications only. No code asks for a push token, `expo-updates` isn't installed, and the hook doesn't listen to `AppState`.

### 3.2 Contracts

| Function | Inputs | Output | Side effects and invariants |
|----------|--------|--------|-----------------------------|
| `useUpdateCheck(updateJsonUrl)` ([`:70`](../../src/hooks/useUpdateCheck.ts)) | The `update.json` URL, used only off iOS | `{ checkForUpdates }` | Registers the launch check through `runAfterFirstFrame` |
| `check({ force? })` ([`:72`](../../src/hooks/useUpdateCheck.ts)) | `force`, default false | `Promise<void>` | Without `force`, returns if `sessionChecked`. Sets `sessionChecked = true` **before** the request, so a failed launch check isn't retried until the next cold launch. Shows alerts. Stores nothing |
| `fetchLatestIos()` ([`:46`](../../src/hooks/useUpdateCheck.ts)) | None | `{ version, storeUrl }`, or `null` on a non-OK status or empty result | Sends `GET https://itunes.apple.com/lookup?bundleId=com.bengisu.valentinepomodoro`. No `country`, no cache control. Throws on a network failure or abort |
| `fetchLatestAndroid(url)` ([`:62`](../../src/hooks/useUpdateCheck.ts)) | `update.json` URL | `{ version, storeUrl }` or `null` | Reads `latestVersion` and `androidUrl`. Off iOS only |
| `fetchWithTimeout(url, ms)` ([`:33`](../../src/hooks/useUpdateCheck.ts)) | URL, 5000 ms | `Response` | Aborts on the timeout. Passes only `signal` |
| `getCurrentVersion()` ([`:29`](../../src/hooks/useUpdateCheck.ts)) | None | Installed version string | `Application.nativeApplicationVersion`, which is `CFBundleShortVersionString` (`expo-application/ios/ApplicationModule.swift:20-21`) |
| `compareSemver(a, b)` ([`semver.ts:6`](../../src/utils/semver.ts)) | Two version strings | `1`, `0` or `-1` | Pure. Compares dot-separated integers, treating missing parts as 0 |
| `runAfterFirstFrame(name, run)` ([`deferredStartup.ts:121`](../../src/startup/deferredStartup.ts)) | Label and task | Cancel function | Queues until `markFirstFrame()` ([`App.tsx:95`](../../src/App.tsx)), then one idle callback; a 2 s fallback if the signal never arrives |

**Throttling and caching, layer by layer:**

| Layer | Behaviour | Evidence |
|-------|-----------|----------|
| JavaScript | `sessionChecked`, in memory: once per process | [`useUpdateCheck.ts:23,76-77`](../../src/hooks/useUpdateCheck.ts) |
| On-device storage | None since 1.3.1. iOS 1.0.3 to 1.3.0 had a 24 h throttle and a once-per-version record in storage | `git show v1.2.5:src/hooks/useUpdateCheck.ts` |
| Phone's HTTP cache | Default policy, so a fresh `max-age` response can be reused (§3.4) | Native code |
| Apple's CDN (Akamai) | **`max-age=86400`, keyed by the exact URL, counting down** | §6.2 |
| GitHub Pages (`update.json`) | `max-age=600` | §6.4 |

### 3.3 Where "latest version 1.4.0" comes from

The string is `updates.upToDateMessage`, filled at [`useUpdateCheck.ts:100`](../../src/hooks/useUpdateCheck.ts) with `current`, the **installed** version. The store's number isn't shown on this path at all.

So her message proves two things: the app binary on her phone reports 1.4.0, and the lookup's answer was not newer than 1.4.0. It doesn't tell us which number the store returned. The live data does: the CDN copy says 1.4.0.

Her phone really is on a 1.4.0 binary, not something older, because a 1.3.1 phone would print `1.3.1` (in English only; 1.3.1 had no Turkish). That binary is either App Store build 59 or a TestFlight build of 1.4.0. Only her phone can separate those.

What the user sees for each outcome, as of `v1.4.0` and `v1.4.1`:

| Outcome | Launch check | Button, English | Button, Turkish |
|---------|--------------|-----------------|-----------------|
| Lookup failed, offline, timed out or empty | Silent | "Couldn't check for updates" / "Check your connection and try again." | "Güncellemeler denetlenemedi" / "Bağlantını kontrol edip yeniden dene." |
| Lookup not newer than installed | Silent | "You're up to date" / "You have the latest version (X)." | "Güncelsin" / "En son sürüm sende (X)." |
| Lookup newer | Alert | "Update available" / "Version Y is available on the App Store with the latest improvements and fixes." | "Güncelleme var" / "Y sürümü, en son iyileştirmeler ve düzeltmelerle App Store'da." |

X is the installed version and Y is the store's. The alert's buttons are "Not now" and "Update" ("Şimdi değil", "Güncelle"), and "Update" opens `trackViewUrl`. Strings: [`en.json:254-263`](../../src/i18n/en.json), [`tr.json:254-263`](../../src/i18n/tr.json). The English and Turkish wording both state as fact that this is the latest version, which is more than the code can know.

### 3.4 The phone's own cache (cause 2)

Since `EXPO_PUBLIC_USE_RN_FETCH` isn't set anywhere in the repository, `fetch` in the app is Expo's (`node_modules/expo/src/winter/runtime.native.ts:35-47`, Expo 58.0.21 at `v1.4.0`). The paths below are under `node_modules/expo`:

- `ios/Expo/Fetch/ExpoFetchModule.swift:131` uses `URLSessionConfiguration.default`, which means the shared URL cache.
- `ios/Expo/Fetch/ExpoURLSessionTask.swift:24` builds the request without setting a cache policy, so it uses the default protocol policy.
- `src/winter/fetch/fetch.ts` reads `signal`, `redirect` and `credentials`, and never `cache`. **So `fetch(url, { cache: 'no-store' })` would do nothing here.**

The 1.3.1 build (Expo 54, React Native 0.81) wasn't inspected at this level.

The response carries `cache-control: max-age=N` and no `no-store`, and it's about 9 KB. Under standard HTTP caching, a phone can reuse it without asking the network until it expires. Because the CDN counts `max-age` down, this can't outlive the CDN copy it came from, but it does mean that once her phone has the old answer, changing networks may not help. Apple's documentation pages for this behaviour couldn't be read here (they render with JavaScript), so this rests on the code and on general HTTP semantics. It's marked plausible for that reason.

### 3.5 What the shipped builds contain

From `git show <tag>:src/hooks/useUpdateCheck.ts` and `git log -- src/hooks/useUpdateCheck.ts`:

| Installed iOS version | Source of "latest" | Throttle | Button | Notes |
|-----------------------|--------------------|----------|--------|-------|
| 1.0.2 | None | | No | No update check at all |
| 1.0.3 to 1.3.0 | `update.json` (now 1.3.1) | 24 h, and one prompt per version, in storage | Yes | The only iOS builds that read the file |
| 1.3.1 | Bare lookup URL | Once per cold launch | Yes | Forced check is silent on failure; English only |
| 1.4.0 (build 59) and 1.4.1 (build 61) | Bare lookup URL | Once per cold launch, after the first frame | Yes | Forced check reports failure; Turkish and English |

- `e12c84a` (2026-04-17) introduced the lookup, first shipped in 1.3.1. The bare URL has been there ever since, and so has the comment saying it "always reflects the live App Store listing" ([`useUpdateCheck.ts:5,45`](../../src/hooks/useUpdateCheck.ts)). That comment is false.
- `8c6bf3d` (B7) deferred the launch check, `07ae4a7` added the failure alert, `5849286` removed an emoji, and `3748d70` moved the text to the string files. None of them changed the source or the decision.
- `git diff v1.4.0 v1.4.1` is empty for the hook, `semver.ts`, `App.tsx`, `SettingsScreen.tsx` and both string files, and `git diff v1.4.1 master` is empty for the hook. The 1.5.0 branch `feat/phase2-d1-pairing` doesn't touch the hook, `semver.ts` or the hook's test either.

The existing test [`useUpdateCheck.test.tsx`](../../src/hooks/__tests__/useUpdateCheck.test.tsx) mocks `fetch` and returns 99.0.0 for any URL. So it can't catch this, and no test covers `compareSemver` directly. The tests were not run for this audit: this worktree has no `node_modules`, and no code changed.

### 3.6 Platform branching and storefront

- **Branching:** `Platform.OS === 'ios'` picks the lookup; everything else reads `update.json` ([`useUpdateCheck.ts:81-83`](../../src/hooks/useUpdateCheck.ts)). The iOS path reads nothing meant for Android.
- **Country:** the code passes none. A request without `country` is answered by the US storefront: `trackViewUrl` comes back as `apps.apple.com/us/...` even from this machine in Turkey. Apple's page documents "The default is US" under its Search API section. So her phone asks the US store whatever her Apple account's country is. That isn't the bug: US and Turkey hold the same version. Adding `country=tr` wouldn't fix it either, since `id&country=tr` was itself stale (§6.2).
- **Link:** on a Turkish phone the "Update" button opens a `/us/` link. Whether the App Store handles that cleanly needs a phone to confirm.

### 3.7 Proposed fix (needs a new app release)

**A. Make the URL different whenever freshness matters.** This is the core fix, and it covers the CDN and the phone's cache together:

```ts
const HOUR_MS = 3_600_000;

// Apple's CDN and the phone's cache both key on the exact URL and hold it for up
// to 24 h, so `cb` is what makes the answer fresh; Apple ignores the parameter.
// `cache: 'no-store'` wouldn't work: Expo's fetch ignores it, and the CDN ignored
// a client's Cache-Control: no-cache when tested (2026-11-06 audit).
function iosLookupUrl(now: number, force: boolean): string {
    const bucket = force ? now : Math.floor(now / HOUR_MS);
    return `https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}&cb=${bucket}`;
}
```

- **Contract:** pure function of the clock and `force`. A launch check is at most an hour stale, and a pressed button is never stale. Users share one cached copy per hour, which respects Apple's request to cache lookups and its limit of about 20 calls a minute.
- **Risk:** this relies on Apple ignoring an unknown parameter. It did in every test. If that ever changes, `res.ok` is false or the result is empty, so the launch check stays silent and the button says it couldn't check, which is visible and safe.

**B. Check again on return to the app.** Add an `AppState` listener: on `active`, if the last completed check is more than 6 hours old, check again. Replace `sessionChecked` with `lastCheckAt`, and set it only after a successful answer, so a failed check retries. This needs an owner decision on whether a prompt may interrupt a running timer session (§5). I'd suppress the re-check during a session.

**C. Tidy-up, in the same change:**
- Correct the comments at [`useUpdateCheck.ts:4-5,45`](../../src/hooks/useUpdateCheck.ts).
- Reconcile [FR-UPD-001](../srs/SRS.md#fr-upd-001), which says "at most once per version" while the code prompts on every cold launch, as the owner asked for on 2026-04-17.
- Refresh the stale line numbers at [ARCHITECTURE.md:117](../architecture/ARCHITECTURE.md).
- Add to [RELEASE.md](../process/RELEASE.md): the lookup can trail a release by up to 24 h, so verify with a cache-busted URL.

**Which fixes need a release:**

| Fix | Needs a new app release? |
|-----|--------------------------|
| A, B and C's comment | **Yes.** The URL is compiled in, and there's no over-the-air channel (`expo-updates` isn't installed) |
| Purging Apple's CDN | Not possible from outside Apple |
| `update.json` | Server side, but **no help**: iOS 1.3.1 and later never read it, and bumping it would tell Android 1.3.1 users about a version that doesn't exist for them (RELEASE.md step 12). Leave it |

Phones on 1.4.0 and 1.4.1 keep today's check until they update, so the fix first helps with the release *after* the one that carries it. Today's stale copies clear by themselves within 24 hours of the release (§4.1).

**Test plan:**

| # | Test | Type |
|---|------|------|
| 1 | Regression: a URL-keyed `fetch` mock returns 1.4.0 for the bare URL and 1.4.1 when `cb=` is present; with 1.4.0 installed, the button shows "Update available". Mutation-check it by removing the parameter | Jest |
| 2 | Two button presses at different times use different URLs | Jest, mocked clock |
| 3 | The launch URL is stable within an hour and changes at the next hour | Jest, mocked clock |
| 4 | `active` after 6 h or more checks again; under 6 h doesn't; a failed check retries on the next `active`; the existing 5 tests still pass | Jest |
| 5 | A new `semver.test.ts` with the §6.5 table, including `1.10.0` against `1.9.0` | Jest |
| 6 | Live: run §6.1's commands, then the fixed URL form, and confirm it returns the current version | Network |
| 7 | **Phone needed:** with the fix on a phone and automatic updates off, open the app within an hour of the next release: the prompt appears and "Update" opens the listing correctly from a Turkish account | Physical device |
| 8 | **Phone needed:** leave the app suspended past the 6 h mark, return: one check, no prompt during a running session | Physical device |

---

## 4. Mathematical / Statistical Details

### 4.1 How long the lookup stays stale

The CDN stores a response for 86,400 s and reports the time left as a decreasing `max-age`. Let `D` be the response's `Date` and `M` its `max-age`:

- When the copy was fetched from Apple: `T_o = D − (86400 − M)`
- When the copy expires: `T_e = D + M`

For a release at time `T_r`, a copy with `T_o < T_r` holds the old version until `T_e`. So the visible lag on that path is:

`lag = T_o + 86400 s − T_r`, where `0 < lag ≤ 24 h`

If no copy from before the release exists on that path, there is no lag at all, which is why the result looks random from outside.

**Worked example, the app's exact URL:** at `D` = 21:05:01 `M` was 78045, so `T_o` = 18:45:46 and `T_e` = 2026-11-06 18:45:46 (21:45 TR). With `T_r` = 19:04:08, the lag on that path is 23 h 41 m 38 s.

**Test of the model:** from `T_o` alone, it predicted the returned version correctly on **10 of 10** URLs (§6.2). `M` also fell in step with the clock across later requests, and `T_o` stayed 18:45:46 throughout. Repeated requests returned the same Apple request ID, `85454ec7`, so they were one stored object.

**Prediction anyone can check:** after 2026-11-06 18:45:46 UTC (21:45 TR), the app's URL on those paths should return 1.4.1.

**1.4.1 came 28 h 18 m after 1.4.0** (2026-11-04 14:45:37). So at worst, a path holding a pre-1.4.0 copy showed 1.4.0 for only about 4 hours before 1.4.1 became the current version.

### 4.2 Version comparison

Split on `.`, convert each part with `parseInt(_, 10)`, treat a missing part as 0, and compare left to right. It returns 1 at the first larger part, -1 at the first smaller, and 0 if none differs. The prompt shows only when the result is exactly 1 ([`useUpdateCheck.ts:96`](../../src/hooks/useUpdateCheck.ts)). It's numeric rather than string comparison, so `1.10.0` > `1.9.0`.

---

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Hourly cache-busting value for the launch check, unique for the button | `cache: 'no-store'` | Expo's fetch ignores it, and it can't reach the CDN |
| | `Cache-Control: no-cache` request header | Tested: the CDN returned 1.4.0 anyway (§6.3) |
| | A new value on every launch | Works, but gives up all CDN caching, which Apple asks large clients to use. The hourly value costs at most an hour of lag |
| Keep the iTunes lookup | App Store Connect API | Needs a private key in the app or a server |
| | The project's own server or Supabase holding the version | A manual step on each release, and it can drift. Worth reconsidering only if the lookup fails again |
| | `update.json` for iOS | Manual, and the file must stay at 1.3.1 for Android |
| Don't add `country` in this fix | `country=<device region>` | It doesn't address the cause (§6.2). Device region isn't the same as the App Store account's country, and a mismatch can return no result, so it would need a fallback. Separate question, low value today |
| Re-check on return, at most every 6 h | Launch only (today) | iOS can keep an app suspended for days, so a launch-only check can miss a release for a long time |
| | Every return | Too many requests and prompts |
| Don't change `update.json` | Bump it to 1.4.1 | No effect on iOS 1.3.1 and later, and it would mislead Android users |

**Owner decisions this leaves open:**

1. Ship the fix as a 1.4.2 patch or inside 1.5.0? I recommended 1.5.0, because the fix only helps from the release after the one carrying it. **The owner chose to ship 1.4.2 first** (2026-11-06).
2. May an update prompt appear while a timer session is running? I'd say no, and 1.4.2 is built that way. The owner can overrule it.
3. How often should the re-check prompt repeat for someone who keeps tapping "Not now"? The owner's 2026-04-17 rule was every time the app is opened. 1.4.2 prompts at each check, so at most every 6 hours on returning to the app, and on every cold launch.

**Not in scope, noted for later:** iOS 1.0.3 to 1.3.0 prompts only once per version, and the file is stuck at 1.3.1, so someone on those builds who dismissed that prompt won't be asked again unless they press the button.

---

## 6. Verification

No Simulator or device was available. Everything below ran from a Windows machine in Turkey, so it shows what the network serves, not what her phone did.

### 6.1 Commands anyone can run

The app's exact URL:

```bash
curl -s "https://itunes.apple.com/lookup?bundleId=com.bengisu.valentinepomodoro" | grep -o '"version":"[^"]*"'
```

The same request with a cache-busting parameter:

```bash
curl -s "https://itunes.apple.com/lookup?bundleId=com.bengisu.valentinepomodoro&cb=$(date +%s)" | grep -o '"version":"[^"]*"'
```

Time left on the cached copy:

```bash
curl -s -D - -o /dev/null "https://itunes.apple.com/lookup?bundleId=com.bengisu.valentinepomodoro" | grep -iE "^(cache-control|date|x-cache):"
```

- [x] Run on 2026-11-05 at 21:17: the first returned `"version":"1.4.0"`, the second `"version":"1.4.1"`, and the third `Cache-Control: max-age=77288`, `Date: 21:17:38 GMT` and `X-Cache: TCP_MEM_HIT`. That `max-age` gives the same expiry as §4.1.

### 6.2 Same moment, different URLs (21:09:44)

Storefront is taken from each response's `trackViewUrl`. The CDN fetch time and expiry are derived as in §4.1.

| URL | Storefront | Version | `max-age` | CDN fetched copy | Expires (11-06) |
|-----|-----------|---------|-----------|------------------|-----------------|
| **`?bundleId=…` (what the app calls)** | us | **1.4.0** | 77762 | 18:45:46 | 18:45:46 |
| `?id=…` | us | **1.4.0** | 78709 | 19:01:33 | 19:01:33 |
| `?id=…&country=tr` | tr | **1.4.0** | 44828 | 09:36:52 | 09:36:52 |
| `?bundleId=…&country=us` | us | 1.4.1 | 86118 | 21:05:02 | 21:05:02 |
| `?bundleId=…&country=tr` | tr | 1.4.1 | 86118 | 21:05:02 | 21:05:02 |
| `?id=…&country=us` | us | 1.4.1 | 86118 | 21:05:02 | 21:05:02 |
| `?id=…&country=TR` (only the letter case differs) | tr | 1.4.1 | 86400 | 21:09:45 | 21:09:45 |
| `/tr/lookup?id=…` | tr | 1.4.1 | 84154 | 20:32:19 | 20:32:19 |
| `/us/lookup?id=…` | us | 1.4.1 | 86400 | 21:09:45 | 21:09:45 |
| `/tr/lookup?bundleId=…` | tr | 1.4.1 | 86400 | 21:09:46 | 21:09:46 |

1.4.1's release time is 19:04:08. **Every copy fetched before it says 1.4.0, and every copy fetched after it says 1.4.1, regardless of storefront.** US appears on both sides and so does Turkey, and changing only the letter case of `TR` changes the answer. That rules out storefront lag and shows the cache key is the literal URL.

The three rows at 21:05:02 are copies my own first probe created, so they read fresh only because nobody had asked for them before the release. The project memory's observation that `/tr/lookup?id=` was ahead of the US lookup has this same explanation.

### 6.3 Repeats, cache-busting and other CDN paths

| Test (time) | Result |
|-------------|--------|
| App's URL, 6 repeats on new connections (21:05) | 1.4.0 every time |
| App's URL, Apple request ID at 21:05:01, 21:05:09, 21:11 and 21:13:11 | `85454ec7` each time, on this machine's usual CDN path |
| `?id=…` and `?id=…&country=tr`, 6 repeats each | 1.4.0 every time |
| App's URL with `&_cb=<time>` | **1.4.1**, `max-age=86400`, `TCP_MISS` |
| `?id=…` and `?id=…&country=tr` with `&_cb=<time>` | **1.4.1** |
| App's URL with `Cache-Control: no-cache` and `Pragma: no-cache` request headers | 1.4.0: **the CDN ignores them** |
| App's URL with an iPhone-style user agent and `Accept-Language: tr-TR` | 1.4.0, `TCP_MEM_HIT` |

The app's URL through four CDN addresses, found with this machine's DNS and public DNS services (21:11):

| Edge address | Version | Apple request ID | CDN result |
|--------------|---------|------------------|------------|
| 2.17.232.23 | 1.4.0 | `85454ec7` | `TCP_MEM_HIT` |
| 92.122.16.24 | 1.4.0 | `85454ec7` | `TCP_HIT` |
| 184.26.128.28 | 1.4.0 | `85454ec7` | `TCP_MISS` (edge miss, filled from a parent holding the same copy) |
| 2.17.140.27 | **1.4.1** | `04e14bfd` | `TCP_MISS`, `max-age=86400` |

**The same URL gets different answers on different CDN paths**, so two phones, or one phone on Wi-Fi and then on cellular, can disagree. Three of the four sampled paths were stale. This isn't a sample of Turkish mobile networks: hinting a subnet to Google's DNS returned a single address for every network tried, so I can't say which path her phone uses.

### 6.4 The other sources

| Source | Result |
|--------|--------|
| `https://mertefesensoy.github.io/valentine-pomodoro/update.json` (the URL in [`App.tsx:24`](../../src/App.tsx)) | `latestVersion` 1.3.1, `cache-control: max-age=600`, last modified 2026-10-29 21:21:42 GMT. As intended, and unused on iOS 1.3.1+ |
| `apps.apple.com/tr/app/…/id6757491918` and the `/us/` page (21:13) | 200, `max-age=900`; both contain "1.4.1". They also list older versions, so this shows only that 1.4.1 is published |
| Fresh lookup, any URL | `version` 1.4.1, `currentVersionReleaseDate` 2026-11-05T19:04:08Z |
| Stale lookup, any URL | `version` 1.4.0, `currentVersionReleaseDate` 2026-11-04T14:45:37Z |

### 6.5 Replay of the shipped code against the live network (21:10)

A scratch script takes `useUpdateCheck.ts`, `semver.ts` and the string files from `git show <tag>:…`, strips the types, stubs only the React Native surface, and uses real network requests. It can't show the phone's URL cache or a real alert.

| Scenario | Code | Installed | URL | Result |
|----------|------|-----------|-----|--------|
| **A: her report** | `v1.4.0` | 1.4.0 | bare, button | **"Güncelsin" / "En son sürüm sende (1.4.0)."** |
| A, in English | `v1.4.0` | 1.4.0 | bare, button | "You're up to date" / "You have the latest version (1.4.0)." |
| B: launch | `v1.4.0` | 1.4.0 | bare, launch | Silent, no prompt |
| C: already updated | `v1.4.1` | 1.4.1 | bare, button | "Güncelsin" / "En son sürüm sende (1.4.1)." |
| D: older build | `v1.3.1` | 1.3.1 | bare, launch | "✨ Update available" / "Version 1.4.0 is available…" (its link would open the App Store, which has 1.4.1) |
| **E: with the fix** | `v1.4.0` + `&cb=` | 1.4.0 | button | **"Güncelleme var" / "1.4.1 sürümü, en son iyileştirmeler ve düzeltmelerle App Store'da."** |
| E: launch | `v1.4.0` + `&cb=` | 1.4.0 | launch | The same prompt |
| E: already updated | `v1.4.1` + `&cb=` | 1.4.1 | button | "Güncelsin" / "En son sürüm sende (1.4.1)." |

`compareSemver` as committed at `v1.4.1`:

| a | b | Result |
|---|---|--------|
| 1.4.1 | 1.4.0 | 1 |
| 1.4.0 | 1.4.1 | -1 |
| 1.4.0 | 1.4.0 | 0 |
| 1.10.0 | 1.9.0 | 1 |
| 1.9.0 | 1.10.0 | -1 |
| 1.10 | 1.9.9 | 1 |
| 2.0.0 | 1.99.99 | 1 |
| 1.4 | 1.4.0 | 0 |
| 1.4.0 | 1.4 | 0 |
| 1.5.0 | 1.4.1 | 1 |

### 6.6 What this audit can't show

- **When she pressed the button.** If it was before 22:04 TR on 2026-11-05, the message was simply correct at the time. The report's timing suggests later, but I don't have it.
- **Which CDN path her phone uses**, and whether her phone holds its own cached copy.
- **Whether a real alert appears over the welcome, tour or ad screens** at launch. Nothing here runs React Native.
- **Whether the launch check prompted her at some earlier point.** The check keeps no record.
- **App Store Connect state**, and any of the phone settings below.

### 6.7 What to do

**Tell her today** (no app change needed):

- [ ] **The app's "up to date" message was wrong. 1.4.1 is out.** On her iPhone, open <https://apps.apple.com/tr/app/valentine-pomodoro/id6757491918> and tap **Güncelle**. Or: App Store, her profile picture, pull down to refresh, then find the app in the list.
- [ ] **She shouldn't delete the app to force the update.** Her diary is stored on the phone, so deleting the app would delete it.
- [ ] **Confirm afterwards** in Settings › General › iPhone Storage › Valentine Pomodoro, which should say 1.4.1. *Her phone.*

**If the App Store shows "Aç" (Open) rather than "Güncelle":**

- [ ] Check the version as above. If it's 1.4.1, she's done.
- [ ] If it's 1.4.0, check for an orange dot beside the app's name on her home screen, and whether the TestFlight app lists Valentine Pomodoro. TestFlight builds normally update through TestFlight rather than through the App Store's automatic updates (general iOS behaviour, not tested here). If that's what she has, tell me before she changes anything, so we can plan how to move her to the App Store build without risking her diary. *Her phone.*

**Only she can see:**

- [ ] Settings › Apps › App Store › App Updates (on older iOS, Settings › App Store): on or off? If off, the phone won't install updates by itself.

**Only the owner can see, in App Store Connect:**

- [ ] Open the 1.4.1 version page. **Was phased release turned on?** The [Stage E plan](2026-11-01-phase1-stage-e.md) recommended it for 1.4.0 (line 202), and nothing in the repository records the choice for 1.4.1. From outside, the lookup looks the same either way. If it's on, automatic updates reach 1% of users on day 1, then 2%, 5%, 10%, 20%, 50%, and 100% on day 7, though anyone can update by hand at any time. Apple documents this in [Release a version update in phases](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases).
- [ ] Confirm that 1.4.1 reads "Ready for Distribution".

**To check the diagnosis:**

- [ ] After 21:45 TR on 2026-11-06, run §6.1's first command: it should return 1.4.1.
- [ ] If she hasn't updated yet by then, the button should offer the update. If the phone still says "up to date" well after 22:04 TR that evening, this diagnosis is incomplete, and I'd want to know.

---

## 7. Related Docs

- [FR-UPD-001](../srs/SRS.md#fr-upd-001): the requirement, to be reconciled (§3.7 C)
- [2026-04-17 App Store update check](2026-04-17-app-store-update-check.md): the design this audits; its "authoritative" claim is what this report corrects
- [2026-10-30 Phase 1 B7](2026-10-30-phase1-b7-deferred-startup.md): why the launch check waits for the first frame
- [2026-11-01 Stage E](2026-11-01-phase1-stage-e.md): why `update.json` stays at 1.3.1 (R5)
- [RELEASE.md](../process/RELEASE.md): step 12 on `update.json`
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md): line 117 describes this integration
- [Apple's Search API](https://performance-partners.apple.com/search-api): `country` default, caching request and rate limit
- [1.4.2](2026-11-06-v142-update-check-fix.md): the fix this audit led to
- Raw probe output and the scripts: `C:\Users\senso\AppData\Roaming\Claude\side-session-notes\local_e072765a-5b16-42a1-bd85-7d23e8c59877\update-audit\`
