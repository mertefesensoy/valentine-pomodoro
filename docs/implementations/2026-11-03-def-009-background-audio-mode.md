---
id: IMPL-2026-11-03-def-009-background-audio-mode
title: "URGENT: remove the unused audio background mode before the next submission (DEF-009)"
status: in-progress
date: 2026-11-03
owner: Mert Efe Şensoy
related: [SRS, IMPL-2026-11-01-phase1-stage-e, RELEASE, BRANCHING]
---

# 2026-11-03 — URGENT: remove the unused audio background mode (DEF-009)

**Status:** In progress. **Priority: urgent, first in line.** The owner, 2026-11-03: "document this as an urgent fix so any other new seassion does not start on a new job before fixing this issue". Until §6's checklist is ticked, a session starts no other job: it does this one, or tells the owner and asks first. `CLAUDE.md` and the project memory carry the same notice.

The owner, 2026-11-04, while Apple hadn't yet answered the reply: "Yes, start build 60". That go-ahead covers the fix, the checks, the push, EAS build 60 with its TestFlight upload, and the tag `v1.4.0-tf.60`. Attaching the build and submitting stay with the owner.

**2026-11-05: 1.4.0 is live, on build 59.** The owner: "wait but 1.4.0 is already live". The public App Store lookup confirms it: version 1.4.0, released 2026-11-04T14:45:37Z. So Apple accepted the reply, §3 step 8 took its first branch, and build 60 is retired. The fix ships as 1.4.1.

**Branch:** `phase1/stage-d`, then fast-forwarded into `rehaul/v2` and `master`. All three sit at the same commit, `0d5e4ba`, and `rehaul/v2` stays the integration branch until 1.4.0 ships ([BRANCHING.md](../process/BRANCHING.md)).

---

## 1. Problem / Motivation

**App Review's finding.** Apple reviewed 1.4.0 (59) on 2026-11-03, submission `af77109e-129d-4d43-b550-afb0860fc3a7`, on an iPad Air 11-inch (M3). It cited Guideline 2.5.4 (Performance, Software Requirements): the app declares `audio` in `UIBackgroundModes`, and Apple was "unable to locate any features that require persistent audio". Apple offered two ways out:
- approve 1.4.0 now, since it includes bug fixes, and resolve the issue "on your next update";
- or remove the key now and resubmit.

**The owner's choice:** "Ask Apple to approve". Build 59 is the build the owner checked on device, and 1.4.0 does fix 1.3.1 bugs: the Stats crash, DEF-004's lost completions and DEF-008's number pad (CHANGELOG `[1.4.0]` › Fixed). The reply is in the [Stage E record](2026-11-01-phase1-stage-e.md). **So the next version submitted must not declare the key**, whichever build that turns out to be.

**The cause:**
- `app.json` lists `"expo-audio"` as a plugin with no options. The SDK 56 upgrade added it (`c7135f3`); `v1.3.1`'s `app.json` has no such entry, so the key is new in 1.4.0.
- `expo-audio` 58.0.10's config plugin defaults `enableBackgroundPlayback` to `true` (`node_modules/expo-audio/plugin/build/withAudio.js:22`), and then pushes `audio` into `UIBackgroundModes` (`:28–35`).
- Reproduced on `0d5e4ba`: `npx expo config --type introspect --json` gives `ios.infoPlist.UIBackgroundModes` as `["audio"]`.

**The app has no persistent audio.** expo-audio's `shouldPlayInBackground` defaults to `false` (`node_modules/expo-audio/build/Audio.types.d.ts:606–608`), and no `setAudioModeAsync` call sets it:
- the UI sounds (`src/audio/uiSounds.ts:61`);
- Fly mode's cabin hum (`src/hooks/useFlyModeAudio.ts:69`);
- the tour's babble, which plays through the same session (`src/screens/tutorial/babble.ts`).

The native module pauses every player when the app enters the background and resumes them when it returns, whenever that flag is off (`node_modules/expo-audio/ios/AudioModule.swift:109–125`). It never reads the Info.plist key. So every sound already stops in the background, and removing the key changes nothing a user can hear. The timer never needed it either: the clock runs on timestamps, and a phase's end reaches the user as a local notification.

## 2. What Changed

| File | Change |
|------|--------|
| `app.json` | `"expo-audio"` becomes `["expo-audio", { "enableBackgroundPlayback": false }]` (`5c2fe1c`, in build 60 at version 1.4.0). The version becomes 1.4.1, since a live version can't take more uploads (RELEASE.md §1) |
| `package.json` and `package-lock.json` | The version becomes 1.4.1 |
| `src/constants/__tests__/appConfig.test.ts` (new) | Pins the plugin option, so a later upgrade can't quietly bring the key back |
| `docs/srs/SRS.md` | DEF-009 marked fixed in code, with the commit; closed when a submission carries it |
| `CHANGELOG.md` | `[1.4.0-tf.60]` and `[1.4.1]`, and `[1.4.1-tf.<n>]` once that build exists |
| `docs/implementations/2026-11-01-phase1-stage-e.md` | The fallback build and its table; a correction to its statement about usage descriptions (§5) |
| `CLAUDE.md` and the project memory | The notice says what is left, so no session repeats the fix. Removed once a submission carries it |
| This record | Status Done, at the end |

## 3. Implementation Approach

1. **The change:** one plugin option in `app.json`. With `enableBackgroundPlayback: false`, the plugin skips the `UIBackgroundModes` push. No app code changes.
2. **Check the generated Info.plist without a build:** run `npx expo config --type introspect --json` and read `ios.infoPlist.UIBackgroundModes`. Before the change it holds `audio`; after it, `audio` is gone (the key may disappear entirely). This is the same plugin run EAS performs, so it reproduces Apple's finding and then shows it gone.
3. **The test:** SRS §3.4 asks for a test with each deviation's fix. Importing `app.json` is the project's way (`src/components/__tests__/reactCompiler.test.tsx`).
4. **The Android side effect, for the owner to know:** the same option drops the plugin's Android media-playback foreground service and its two `FOREGROUND_SERVICE` permissions (`withAudio.js:46–72`). Android stays on 1.3.1 and isn't built in Phase 1. Nothing in the app uses lock-screen controls or background playback there either, so this is right for Android too.
5. **The full guards**, then the push to `rehaul/v2`, `master` and `phase1/stage-d` by commit ID. NFR-REL-003 wants CI green on the commit a store build is made from, so the build waits for it.
6. **Build:** an EAS production build with TestFlight submission, tagged `v1.4.0-tf.<n>` on that commit, with the number read from EAS rather than assumed.
7. **The device check** (the owner):
   - the three UI sounds, with the silent switch and the Sound switch;
   - the tour's babble;
   - Fly's cabin hum;
   - leaving the app stops the hum, and returning brings it back, as on build 59.
8. **Then it depends on Apple** (the owner's step, §5):
   - **Apple has approved build 59:** release it. The fix then ships as 1.4.1: bump the version in `app.json` and `package.json`, build again, check and submit. A build numbered 1.4.0 can't go on a 1.4.1 version.
   - **No answer yet:** on the rejected 1.4.0 version, remove build 59, add build 60, add the note below and submit again. The text, screenshots and videos stay.

   The App Review note gains one line: "The "audio" UIBackgroundModes entry flagged in the previous review (Guideline 2.5.4) is removed."

   **Outcome:** the first branch. Build 60 was never attached. Its fix is already on `master`, so 1.4.1 needs only the version bump, a build, its tag `v1.4.1-tf.<n>`, the device check and the submission. The owner went ahead on 2026-11-05 ("Yes, go ahead"): the bump goes through a pull request into `master`, and the build is made from the merge.

   **What's New for 1.4.1,** for the owner to edit:
   - English: "A small behind-the-scenes fix. Everything works as before."
   - Türkçe: "Perde arkasında küçük bir düzeltme. Her şey eskisi gibi çalışıyor."

## 4. Mathematical / Statistical Details

None: a build-configuration change.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Turn off the plugin's background playback | A custom config plugin that strips `audio` from iOS only | One documented plugin option and no new code. Android has no use for the playback service either |
| Ask Apple to approve 1.4.0 as is | Rebuild as build 60 and resubmit at once | **The owner's choice,** 2026-11-03. Build 59 is device-checked, Apple offered approval because 1.4.0 has bug fixes, and the key changes nothing a user sees |
| Build 60 as a ready fallback, while the reply is pending | Only keep waiting; resubmit without waiting for a check | **The owner's go-ahead,** 2026-11-04. Uploading a build doesn't touch the submission until it is attached. Apple's message gives no time for answering a reply, and the fix is owed anyway |
| Build 60 stays version 1.4.0 | Bump to 1.4.1 now | It must fit the rejected 1.4.0 version. If Apple approves build 59 first, the cost is one small bump and one more build |
| Keep `NSMicrophoneUsageDescription` | Set `microphonePermission: false` in the same line | The plugin declares this string by default too, and the app never asks for the microphone. But expo-audio's native code links `AVAudioRecorder` (`node_modules/expo-audio/ios/AudioRecorder.swift`), so removing the string risks App Store Connect's missing-purpose-string check on upload. Apple didn't flag it, and no prompt ever shows. One well-understood change at a time |
| Keep every sound foreground-only | Let Fly's hum play in the background and defend the key with a screen recording | Nobody asked for background sound. The timer runs on timestamps and notifications |
| Make this the first job of every new session | Leave it on the release list (R4–R6) | **The owner's instruction.** Missing it costs a rejection of the next version |

## 6. Verification

- [x] `npx expo config --type introspect --json`: no `audio` in `ios.infoPlist.UIBackgroundModes` (before the fix: `["audio"]`; after `5c2fe1c`: the key is gone, and Android's two `FOREGROUND_SERVICE` permissions with it).
- [x] `npx jest src/constants/__tests__/appConfig.test.ts` passes.
- [x] The guards on the fix's commit, with two exceptions that don't come from it:
  - **Green:** `tsc`; lint, 0 errors and 29 warnings, as before; the compiler report, 100 compiled and 5 skipped; raw text; contrast, 60 pairs; the icons, 120 drawings; budgets, 133 assets; Jest, 496 tests; `check-docs`, 142 docs.
  - **Not passing:** `scripts/art/build.mjs --check` (198 files differ from a clean rebuild) and `scripts/sound/build.mjs --check` (only `art/sound/report.json` differs).
  - **Why they don't block build 60:** VectorCraft 0.21.0 and SoundCraft 0.17.0 were installed on 2026-11-03 at about 19:30, after both checks last passed on these same files (`a03135c`, that day). No art or sound file has changed since. Neither tool runs in CI or in the EAS build, which packages the committed assets. What exactly differs in the art rebuild hasn't been looked at; re-baselining the checks or pinning the tools is a separate job, after this one.
- [x] CI green on the build's commit (`c184337`: runs 41819215848 and 41819216342).
- [x] The fix's build on TestFlight, tagged: build 60, `v1.4.0-tf.60` ([Stage E §3.10](2026-11-01-phase1-stage-e.md)).
- [x] The device check on that build (§3 step 7): passed on build 60, 2026-11-04. Asked "Did build 60 pass the sound check?", the owner answered "Passed".
- [ ] Version 1.4.1 built with the fix, on TestFlight, tagged.
- [ ] The device check on the 1.4.1 build (§3 step 7).
- [ ] 1.4.1 submitted with the fix, and App Review raises no 2.5.4 finding.
- [ ] The urgent notice removed from `CLAUDE.md` and the project memory, and DEF-009 closed in the SRS.

## 7. Related Docs

- [Phase 1 Stage E: verify and ship v1.4.0](2026-11-01-phase1-stage-e.md): R3, the review and the reply
- [SRS §3.4](../srs/SRS.md#34-known-deviations-as-built-found-2026-10-30): DEF-009
- [RELEASE.md](../process/RELEASE.md) and [BRANCHING.md](../process/BRANCHING.md): tags and the build's commit
