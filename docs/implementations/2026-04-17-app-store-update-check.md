# App Store Update Checker — iTunes Lookup API + Per-Session Prompt

**Date:** 2026-04-17  
**Author:** Claude Code (claude-sonnet-4-6)

---

## 1. Problem / Motivation

The previous `useUpdateCheck` hook throttled checks to once every 24 hours via AsyncStorage and also suppressed repeat prompts for the same version string. A user stuck on an old build could dismiss the prompt once and not see it again for a full day — or at all, if they opened the app twice before noon and the version didn't change in that window.

The user's requirement was explicit: **prompt every time the app is opened** when behind the latest release, and use a **real store API** (not just the self-hosted JSON that was originally wired for Android only).

A secondary gap: the iOS build had no way to check the live App Store version at all — the hook only fetched from the GitHub Pages JSON, which is maintained manually and can lag behind the actual published build.

---

## 2. What Changed

| File | Change |
|---|---|
| `src/hooks/useUpdateCheck.ts` | Full rewrite. Replaced AsyncStorage throttle + per-version-guard with a module-level `sessionChecked` flag. Added `fetchLatestIos()` using the iTunes Lookup API. Platform-branched: iOS → iTunes Lookup, Android → existing self-hosted JSON. Added `fetchWithTimeout` helper (AbortController, 5 s). |
| `docs/update.json` | Bumped `latestVersion` from `1.0.2` → `1.3.0` to match `app.json`. |
| `src/App.tsx` | Fixed stale inline comment (line 45): was *"max once per 24h, offline-safe"*, now reflects the per-cold-launch semantics. |

`src/utils/semver.ts` and `app.json` are **unchanged** — the comparator and version string were already correct.

---

## 3. Implementation Approach

### iOS path — iTunes Lookup API

```
https://itunes.apple.com/lookup?bundleId=com.bengisu.valentinepomodoro
```

This endpoint is public and unauthenticated. It returns the live App Store listing including `results[0].version` (the published version string) and `results[0].trackViewUrl` (the canonical App Store deep link). No App Store Connect JWT is needed, no server proxy, no API key.

```ts
async function fetchLatestIos(): Promise<VersionInfo | null> {
    const url = `https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}`;
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) return null;
    const json = await res.json() as { resultCount: number; results: Array<...> };
    if (!json.resultCount || !json.results[0]?.version) return null;
    return {
        version: json.results[0].version,
        storeUrl: json.results[0].trackViewUrl ?? IOS_FALLBACK_STORE_URL,
    };
}
```

### Android path — self-hosted JSON (unchanged)

Google does not publish a public lookup API for Play Store versions. The pre-existing mechanism — a `docs/update.json` file served from GitHub Pages, manually updated at each release — is the simplest approach that keeps parity without service-account auth. The `androidUrl` field inside the JSON is passed directly to `Linking.openURL`.

### "Every cold launch" semantics

A module-level variable `let sessionChecked = false` is the entire throttle:

```ts
let sessionChecked = false;

export function useUpdateCheck(updateJsonUrl: string) {
    const check = useCallback(async (opts?: { force?: boolean }) => {
        const force = opts?.force ?? false;
        if (!force && sessionChecked) return;
        sessionChecked = true;
        ...
    }, [updateJsonUrl]);
    ...
}
```

Plain JS module variables live in the JS bundle's memory. They:
- Reset to `false` on every cold launch (process restart re-evaluates the module).
- Persist through hot reloads and component remounts within a single session.

This gives exactly one prompt per app open — the exact user requirement — with no AsyncStorage reads or writes on the hot path. The `force: true` override lets a future "Check for updates" Settings button bypass the guard and also shows a *"You're up to date"* confirmation when the user is current.

### Current version resolution

```ts
function getCurrentVersion(): string {
    return Application.nativeApplicationVersion
        ?? Constants.expoConfig?.version
        ?? '0.0.0';
}
```

`Application.nativeApplicationVersion` (from `expo-application`) reads the installed binary's `CFBundleShortVersionString` (iOS) / `versionName` (Android) — always correct in a real build. The fallback to `expoConfig.version` handles Expo Go / dev client where the native metadata is absent.

### Fetch timeout

```ts
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}
```

5-second budget (FETCH_TIMEOUT_MS). AbortController cleanly cancels the underlying request on timeout. The outer try/catch in `check()` swallows both network errors and AbortErrors — the user is never shown an error related to the update check; it just silently skips.

### Alert

```ts
Alert.alert(
    '✨ Update available',
    `Version ${latest.version} is available on the App Store with the latest improvements and fixes.`,
    [
        { text: 'Not now', style: 'cancel' },
        { text: 'Update', onPress: () => void Linking.openURL(latest!.storeUrl) },
    ],
    { cancelable: true }
);
```

Soft prompt — the user can always dismiss. `cancelable: true` allows tapping outside the dialog on Android. The store URL comes directly from the API response (`trackViewUrl` for iOS) rather than a hardcoded constant, so it stays correct if the App Store deep link format changes.

---

## 4. Mathematical / Statistical Details

No new formula. Version comparison delegates entirely to `src/utils/semver.ts::compareSemver(a, b)`:
- Returns `1` if `a > b` (latest is newer than current) → show prompt.
- Returns `0` if equal → no prompt.
- Returns `-1` if `a < b` (installed is somehow newer) → no prompt.

The function parses each version as three dot-separated integers and compares major → minor → patch in order. No pre-release or build-metadata handling — App Store versions are always `MAJOR.MINOR.PATCH` integers.

---

## 5. Design Decisions

| Alternative | Why rejected |
|---|---|
| **App Store Connect API** (JWT-signed, `api.appstoreconnect.apple.com`) | Requires a private key distributed with the app or an authenticated proxy server. Overkill for a public version number. iTunes Lookup is unauthenticated and authoritative for released builds. |
| **Keep AsyncStorage 24h throttle** | Directly contradicts the user's requirement ("every time they open the app"). A user who opens the app daily would still see the prompt daily, but a user who skips a day resets the clock — inconsistent and hard to reason about. |
| **Google Play Developer API** for Android | Requires a Google service account, OAuth2 flow, and a server or stored credentials. Not a practical client-side option. Self-hosted JSON is the accepted community pattern for React Native apps targeting Play Store. |
| **expo-updates / EAS Update** | Delivers JS-bundle over-the-air updates silently. Separate concern from native binary version gating. Would require EAS infrastructure and wouldn't prompt the user to visit the store. |
| **Silent force-update (block launch)** | User asked for a soft notification, not a gate. Blocking launch on an old version would cause bad reviews and user frustration. |
| **0pt activeOffset on the session guard** | Not a concern here — no gesture involved. Session-guard topic belongs in the FlySheet bug-fix doc. |

---

## 6. Verification

### iOS (iPhone 17 physical device)

1. **No prompt when current:** ensure `app.json` version matches the live App Store build (`1.3.0`). Launch app → no alert.
2. **Prompt when behind:** temporarily set `app.json` version to `1.2.0`. Run `npx expo run:ios --device`. Launch → alert appears with the live store version number. Tap **Update** → App Store listing opens.
3. **Persistence check:** tap **Not now**. Kill the app completely. Relaunch → prompt appears again. (Confirms the guard is not saved to disk.)
4. **Offline tolerance:** enable Airplane Mode before launch. Launch → no alert, no error, app loads normally.

### Android (device or emulator)

1. **No prompt when current:** `docs/update.json` has `"latestVersion": "1.3.0"`, `app.json` version is `1.3.0` → no prompt.
2. **Prompt when behind:** edit `docs/update.json` locally to `"latestVersion": "1.4.0"`, point `UPDATE_JSON_URL` to a local server or push to `gh-pages`. Launch → alert shows `1.4.0`. Tap **Update** → Play Store URL opens.
3. Same persistence and offline checks as iOS.

### Force path (both platforms)

Call `checkForUpdates({ force: true })` from a dev menu or a temporary button. When up to date → *"You're up to date — You have the latest version (1.3.0)."* When behind → prompt appears even if `sessionChecked` is already `true`.

---

## 7. Related Docs

- `docs/implementations/2026-04-17-landscape-and-fly-sheet.md` — prior session (FlySheet + landscape layout)
- `docs/implementations/2026-04-17-fly-mode-ios-bugs.md` — companion doc (FlySheet gesture fix + Resume state bug)
- `~/.claude/CLAUDE.md` — Documentation-First workflow
- iTunes Lookup API: https://performance-partners.apple.com/search-api
