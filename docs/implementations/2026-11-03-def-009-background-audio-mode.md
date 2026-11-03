---
id: IMPL-2026-11-03-def-009-background-audio-mode
title: "URGENT: remove the unused audio background mode before the next submission (DEF-009)"
status: planned
date: 2026-11-03
owner: Mert Efe Şensoy
related: [SRS, IMPL-2026-11-01-phase1-stage-e, RELEASE, BRANCHING]
---

# 2026-11-03 — URGENT: remove the unused audio background mode (DEF-009)

**Status:** Plan, written before any code. **Priority: urgent, first in line.** The owner, 2026-11-03: "document this as an urgent fix so any other new seassion does not start on a new job before fixing this issue". Until §6's checklist is ticked, a session starts no other job: it does this one, or tells the owner and asks first. `CLAUDE.md` and the project memory carry the same notice.
**Branch:** `fix/1.4.1-background-audio`, cut from `master` (from 2026-11-02 `master` holds 1.4.0's code; [BRANCHING.md](../process/BRANCHING.md)).

---

## 1. Problem / Motivation

**App Review's finding.** Apple reviewed 1.4.0 (59) on 2026-11-03, submission `af77109e-129d-4d43-b550-afb0860fc3a7`, on an iPad Air 11-inch (M3). It cited Guideline 2.5.4 (Performance, Software Requirements): the app declares `audio` in `UIBackgroundModes`, and Apple was "unable to locate any features that require persistent audio". Apple offered two ways out:
- approve 1.4.0 now, since it includes bug fixes, and resolve the issue "on your next update";
- or remove the key now and resubmit.

**The owner's choice:** "Ask Apple to approve". Build 59 is the build the owner checked on device, and 1.4.0 does fix 1.3.1 bugs: the Stats crash, DEF-004's lost completions and DEF-008's number pad (CHANGELOG `[1.4.0]` › Fixed). The reply is in the [Stage E record](2026-11-01-phase1-stage-e.md). **So the next version submitted, 1.4.1 or whatever comes first, must not declare the key.** Otherwise it is rejected outright, with no bug-fix allowance a second time.

**The cause:**
- `app.json` lists `"expo-audio"` as a plugin with no options. The SDK 56 upgrade added it (`c7135f3`); `v1.3.1`'s `app.json` has no such entry, so the key is new in 1.4.0.
- `expo-audio` 58.0.10's config plugin defaults `enableBackgroundPlayback` to `true` (`node_modules/expo-audio/plugin/build/withAudio.js:22`), and then pushes `audio` into `UIBackgroundModes` (`:28–35`).

**The app has no persistent audio.** expo-audio's `shouldPlayInBackground` defaults to `false` (`node_modules/expo-audio/build/Audio.types.d.ts:606–608`), and no `setAudioModeAsync` call sets it:
- the UI sounds (`src/audio/uiSounds.ts:61`);
- Fly mode's cabin hum (`src/hooks/useFlyModeAudio.ts:69`);
- the tour's babble, which plays through the same session (`src/screens/tutorial/babble.ts`).

So every sound stops when the app leaves the foreground, and the key buys nothing. The timer itself never needed it: the clock runs on timestamps, and a phase's end reaches the user as a local notification.

## 2. What Changed

Planned; each row is ticked off in §6.

| File | Change |
|------|--------|
| `app.json` | `"expo-audio"` becomes `["expo-audio", { "enableBackgroundPlayback": false }]`; the version becomes 1.4.1 |
| `package.json` | The version becomes 1.4.1 |
| `docs/srs/SRS.md` | DEF-009 marked fixed, with the commit |
| `CHANGELOG.md` | `[1.4.1]`, with the fix under Fixed |
| `CLAUDE.md` | The urgent notice removed, once 1.4.1 is submitted with the fix |
| This record | Status Done |

## 3. Implementation Approach

1. **Branch:** `fix/1.4.1-background-audio` from `master`.
2. **The change:** one plugin option in `app.json`. With `enableBackgroundPlayback: false`, the plugin skips the `UIBackgroundModes` push. No app code changes.
3. **Check the generated Info.plist without a build:** run `npx expo config --type introspect --json` and read `ios.infoPlist.UIBackgroundModes`. Before the change it holds `audio`; after it, `audio` is gone (the key may disappear entirely).
4. **The Android side effect, for the owner to know:** the same option drops the plugin's Android media-playback foreground service and its permissions (`withAudio.js:46–72`). Android stays on 1.3.1 and isn't built in Phase 1. The app plays nothing in the background there either, so this is right for Android too (Google Play polices foreground-service types in the same way).
5. **Guards and versions:** the full guards, then the version 1.4.1 in `app.json` and `package.json`, and a CHANGELOG `[1.4.1]` entry.
6. **Build, with the owner's go-ahead:** an EAS production build with TestFlight submission, tagged `v1.4.1-tf.<n>`.
7. **The device check:**
   - the three UI sounds, with the silent switch and the Sound switch;
   - the tour's babble;
   - Fly's cabin hum;
   - leaving the app stops the hum, as on 1.4.0.
8. **Submit 1.4.1** (the owner's step), once 1.4.0 is released: App Store Connect takes one version in review at a time. The App Review note gains one line: "The "audio" UIBackgroundModes entry flagged in 1.4.0's review (Guideline 2.5.4) is removed."

## 4. Mathematical / Statistical Details

None: a build-configuration change.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Turn off the plugin's background playback | A custom config plugin that strips `audio` from iOS only | One documented plugin option and no new code. Android has no use for the playback service either |
| Ask Apple to approve 1.4.0 as is, and fix in 1.4.1 | Rebuild as build 60 and resubmit now | **The owner's choice.** Build 59 is device-checked, Apple offered approval because 1.4.0 has bug fixes, and the key changes nothing a user sees |
| Keep every sound foreground-only | Let Fly's hum play in the background and defend the key with a screen recording | Nobody asked for background sound. The timer runs on timestamps and notifications |
| Make this the first job of every new session | Leave it on the release list (R4–R6) | **The owner's instruction.** Missing it costs a rejection of the next version |

## 6. Verification

- [ ] `npx expo config --type introspect --json`: no `audio` in `ios.infoPlist.UIBackgroundModes`.
- [ ] The guards green on the fix's commit.
- [ ] The device check on the 1.4.1 TestFlight build (§3 step 7).
- [ ] 1.4.1 submitted with the fix, and App Review raises no 2.5.4 finding.
- [ ] The urgent notice removed from `CLAUDE.md` and the project memory, and DEF-009 marked fixed in the SRS.

## 7. Related Docs

- [Phase 1 Stage E: verify and ship v1.4.0](2026-11-01-phase1-stage-e.md): R3, the review and the reply
- [SRS §3.4](../srs/SRS.md#34-known-deviations-as-built-found-2026-10-30): DEF-009
- [RELEASE.md](../process/RELEASE.md) and [BRANCHING.md](../process/BRANCHING.md): the hotfix path
