# 2026-11-15 — Crash reports audit: how to get a stack trace without a Mac

**Status:** Done. This is a read-only audit: no app code, dependency, migration, `app.json`, `eas.json`, App Store Connect setting, tag or build changed. Nothing is built until the owner answers [§8](#8-the-owners-decisions).
**Branch:** none. Written on a detached `HEAD` at `ad0832c` (`master`, the source of 1.5.2's build 67), and left uncommitted.

All times are UTC unless marked TR (Turkey, UTC+3).

---

## 1. Problem / Motivation

The owner asked how the project can get crash reports at all.

**Why there are none:**
- 1.5.0 had **14 opt-in crashes on 2026-11-10**, all on iPhone with iOS 16.7, and none on any other day or version in 90 days. No log of them exists.
- Apple keeps App Store crash logs only in Xcode's Organizer. **The owner's only Mac is an old Intel one** (2026-11-15), which can't run current Xcode, so the project has never seen a stack trace.
- [ADR-0050](../architecture/adr/0050-small-client-and-no-sentry.md) dropped Sentry for its bytecode, and reads [NFR-REL-001](../srs/SRS.md#nfr-rel-001) from App Store Connect's counts.
- The app has no error hook of any kind ([§6.1](#61-runnable-checks-no-mac-needed)).
- 1.5.2 (build 67) is about to be submitted. It brings the iPad app's Mac support, untested on a Mac, so Mac crashes matter too.

### The answer

**Nothing here recovers the 14 crashes of 2026-11-10,** except Xcode's Organizer on a Mac that can run it, or an `.ips` file from the phone that crashed. Every other route starts collecting from the build that adds it.

**For crashes from now on, the app can collect its own, with no third party and a few kilobytes of bytecode.** Apple's MetricKit hands the app a crash diagnostic on a later launch, on every iOS the app supports. A small local module, like `modules/mac-display-awake`, would save it, and the app would send it to the Supabase project the way it sends the start-up report. A JavaScript error record beside it is needed for JS crashes on iOS 16, which MetricKit may not report at all there.

**One thing comes first: the builds don't keep their symbols.** EAS deletes each build's dSYM with its build machine, so **no 1.5.x build can be symbolicated by the project today**, whatever the route. One line in `eas.json` fixes it from the next build on.

**New since ADR-0050:** Expo now offers its own reporter, Expo Observe. It is the ready-made version of the same idea, MetricKit included, but it's in preview, adds a per-install identifier the project has refused before, and its JavaScript is probably the size of the whole headroom.

### Routes, ranked

| Rank | Route | Effort | Bytecode (headroom 27,708 B) | Native risk | What it gives | Verdict |
|------|-------|--------|------------------------------|-------------|---------------|---------|
| 1 | **Keep each build's dSYM**: `buildArtifactPaths` in `eas.json` | One line | 0 B | None | The precondition for every native stack below | **Do first,** in the next build (Q1) |
| 2 | **What exists today**: TestFlight crash logs, an `.ips` from a known phone, an iOS 16.7 phone to reproduce on, App Store Connect's counts | No code | 0 B | None | Logs from testers and people you know. A repro could settle the 1.5.0 crash. The app's own frames stay unnamed in any log from build 67 or earlier, since their dSYMs are gone; system and React Native frames can still be named | **Use now** (Q2, Q3) |
| 3 | **3a: MetricKit in a local module, sent to Supabase** (§3.3, §3.4), **plus 3b: a JS error record** (§3.5) | Medium: one Swift file, a migration, a sender, copy in two languages, a new ADR, a build | **About 2,000–5,000 B,** estimated | Low to medium: runs at every launch on every iPhone; no signal handlers; first compiled on EAS | 3a: signal and Mach-exception crashes on iOS 16.4+, uncaught exceptions from iOS 17. 3b: the JS error and how far start-up got, on every iOS. Both on a later launch; no third party | **Recommended** for the update after 1.5.2 (Q4) |
| 4 | **Expo Observe** (`expo-observe`), §3.6 | Small in code; a new vendor for data | **About 15,000–35,000 B,** estimated | Medium: Expo's native code, in preview | A dashboard of JS errors and native crashes, through MetricKit; native frames not symbolicated yet; the dashboard needs the $19-a-month Starter plan | **Not now.** Revisit when it leaves preview and its size is measured (Q6) |
| 5 | **Organizer on a Mac that runs Xcode:** a borrowed Apple silicon one, or maybe the Intel one with Xcode 26 | Hours, with a trusted person's Mac | 0 B | None | **The only way to the 14 logs Apple holds** | Whenever one turns up (Q3) |
| 6 | **The App Store Connect API's diagnostics** | A small Node script and an API key | 0 B | None | Hang, launch and disk-write logs; no crashes | **Not now** (§3.2) |
| 7 | **Sentry, native start only** (`useNativeInit`, experimental) | Medium | Near 0 B, untested | Medium: a third-party crash handler at every launch | Symbolicated native stacks in a web dashboard, dSYMs uploaded by the EAS build | Only if route 3's symbolication on Windows fails (V1) |
| — | Sentry's JavaScript SDK, or Firebase Crashlytics | — | +1,658,512 B for Sentry (ADR-0050) | Crashlytics needs the whole app on dynamic frameworks | — | **No:** 60 times the headroom for Sentry, and a linkage change for Crashlytics |

### Ruled out

| Suspect | Finding |
|---------|---------|
| "A version with MetricKit can collect the 1.5.0 crashes" | No. `pastDiagnosticPayloads` "doesn't include diagnostics from previous app instances". Confirmed (Apple). That nothing older is delivered to a new subscriber is plausible. |
| "EAS keeps the dSYM, it's just not shown" | No. Build 67's log shows the dSYMs being made and zipped, but builds 64–67 list no build-artifacts archive, and Expo's build process uploads one only if `buildArtifactPaths` is set. Confirmed (`eas build:list`, the build log, Expo's docs). |
| "MetricKit shows the JS error's message" | Not on iOS 16.7: `exceptionReason` exists only from iOS 17 (confirmed, Apple). On iOS 16 even the crash may not arrive, since uncaught exceptions are covered from iOS 17 (Expo's page; NF otherwise). That the message lands there on iOS 17 is plausible, from React Native's code. |
| "The start-up reports would show a crash" | They're sent only after a clean start-up goes idle ([F3's record](2026-11-07-phase2-f3-measures.md)). On 2026-11-15 the owner's query found 86 reports, from iOS 18, 26 and 27 only, none from iOS 16 or 17. That's a hint of a crash at or near launch, not a measurement: the base is tiny. |

---

## 2. What Changed

| File | Change |
|------|--------|
| `docs/implementations/2026-11-15-crash-reports-audit.md` | This report. |
| `docs/README.md` | Adds this report's row to the implementation records index. |
| `docs/srs/SRS.md`, `docs/process/RELEASE.md`, `docs/testing/TEST-STRATEGY.md` | Only their generated backlinks blocks changed: `check-docs --write` added a link to this report. |
| `docs/testing/TRACEABILITY.md` | Regenerated by `check-docs --write`: CON-004, NFR-PERF-001, NFR-PERF-002, NFR-REL-001 and NFR-PRIV-001 now list this report. |

No app code, dependency, migration, `app.json`, `eas.json`, tag, build or App Store Connect setting changed.

**Evidence and sources:**
- Two research notes, with every URL and quote, are in the shared notes folder: `C:\Users\senso\AppData\Roaming\Claude\side-session-notes\local_b5d96447-318d-4c30-be48-eb104d9d8128\` (`research-metrickit-symbolication.md`, `research-reporters-apple-apis.md`).
- This session read Apple's MetricKit documentation data, Expo's build, Observe and pricing pages, and React Native 0.88.1's installed source itself. It also read the owner's EAS build list and build 67's log through `eas-cli`. The decoded log was deleted from the scratchpad afterwards.
- **C** means confirmed: read on the cited official page, in the installed source or in the repository, on 2026-11-15, by this session or its two research agents. The agents read some vendor pages (Sentry, Firebase, Supabase, App Store Connect Help) through a page-extraction tool, so those quotes are the tool's verbatim fragments. **P** means plausible: forums, blogs or inference. **NF** means searched for and not found.

---

## 3. Implementation Approach: what each route gives

### 3.1 Symbols first: what every native route needs

A native stack is a list of binaries and offsets. Turning offsets into function names needs each binary's dSYM, from the very build that crashed ([§4.1](#41-turning-a-metrickit-frame-into-a-source-line)).

**The app's builds keep no dSYM.** `eas build:list --platform ios --json`, run on 2026-11-15, shows the artifacts of builds 64, 65, 66 and 67 as `buildUrl`, `xcodeBuildLogsUrl` and `applicationArchiveUrl` only. None has a `buildArtifactsUrl`. **C.**
- Expo's iOS build process says each build gets "its own fresh macOS VM", runs `fastlane gym` with `output_directory("./build")`, uploads the `.ipa`, and uploads a second archive only "if `buildArtifactPaths` is specified in the build profile". **C** ([iOS build process](https://docs.expo.dev/build-reference/ios-builds.md)).
- `eas.json`'s production profile sets no `buildArtifactPaths` (`eas.json:14-16`). **C.**
- **The dSYMs are made, then thrown away.** Build 67's fastlane log (fetched with `eas build:view --json`, [§6.1](#61-runnable-checks-no-mac-needed)) shows `Generating debug ValentinePomodoro » ValentinePomodoro.app.dSYM`, then `Compressing 6 dSYM(s)` into `/Users/expo/workingdir/build/ios/build/ValentinePomodoro.app.dSYM.zip`, next to the `.ipa`. The six are the app's and five prebuilt Expo frameworks' (`ExpoModulesCore`, `ExpoModulesJSI`, `ExpoModulesWorklets`, `ExpoFileSystem`, `ExpoFont`). **C.** The zip is deleted with the VM.
- So **the dSYMs of every 1.5.x build so far are gone.** Apple probably holds symbols for them, uploaded with the `.ipa` (P), but only Organizer uses those.

**The fix is one line in `eas.json`**, `"buildArtifactPaths": ["ios/build/*.dSYM.zip"]` in the production profile. Then each build page offers the zip for download. It costs no bytecode and no native code, but it's a build-configuration change, so it waits for the owner (Q1). The file is at that path (C, above); that the glob uploads it is P until the first build shows it.

**Which symbols each frame needs.** The app links its pods statically (`useFrameworks: "static"`, `app.json`), so one binary holds most of the code.

| Frames in | Symbols come from | Kept today? | Label |
|-----------|-------------------|-------------|-------|
| The app, `modules/mac-display-awake`, and pods built from source (MMKV, Nitro, Reanimated, maps…) | `ValentinePomodoro.app.dSYM`, in gym's zip | **No** (above) | The dSYM: C. That it covers the static pods: P |
| The five prebuilt Expo frameworks | Their own dSYMs, in the same zip. `expo-build-properties` turns prebuilt modules on unless `usePrecompiledModules` is false (`build/ios.js:73-74`) | **No** | C |
| React Native core | React Native links a prebuilt `React.xcframework` by default (`expo-modules-autolinking/scripts/ios/precompiled_modules.rb:1258`). Its dSYMs are downloaded only when `RCT_SYMBOLICATE_PREBUILT_FRAMEWORKS` is `"1"` (`react-native/scripts/cocoapods/rncore.rb:48`), from React Native's Maven release for 0.88.1. They're not in gym's zip | No, but they can be fetched later for a known version | C in code. Fetching later: P |
| Hermes | Not in gym's zip. Where a Hermes iOS dSYM is published: **NF** | No | NF |
| Google Mobile Ads and other binary SDKs | The vendor's binary, usually without symbols | No | P |
| iOS itself (UIKit, libsystem…) | The phone's OS build. Whether an `.ips` from a phone already names them is unsettled: one iOS 17.1 sample did, through a translated report (P). MetricKit names nothing ([§3.3](#33-metrickit-in-a-local-expo-module-route-3a)) | — | P |

**Symbolicating on Windows.** All P and untested: LLVM isn't installed here (§6.1), so nothing below has been run.
- **`llvm-symbolizer`** takes `--obj`, `--default-arch` (needed for a universal binary) and `--adjust-vma`. **C** ([its manual](https://llvm.org/docs/CommandGuide/llvm-symbolizer.html)). LLVM's object readers don't depend on the host system, so it should read the arm64 Mach-O DWARF file inside `ValentinePomodoro.app.dSYM/Contents/Resources/DWARF/` on Windows (P). A `.dSYM` is a plain folder once unzipped.
- **The tools:** LLVM's Windows installer ships `llvm-symbolizer` and `llvm-objdump`, but **not** `llvm-dwarfdump`. The `clang+llvm-…-x86_64-pc-windows-msvc.tar.xz` archive ships all of them (C from LLVM's release script; contents not inspected). `llvm-objdump --macho --private-headers` prints both `LC_UUID` and the `__TEXT` address, so the installer is enough.
- **`atos`** is macOS-only (P), and so are scripts built on it.
- **`ipsw`** (blacktop) has a Windows build and symbolicates `.ips` crash logs, the JSON format included, given the dyld shared cache of the exact iOS build. It can extract that cache from Apple's IPSW for a device and version, such as iOS 16.7. **C** for the features ([ipsw docs](https://blacktop.github.io/ipsw/docs/cli/ipsw/symbolicate/)); on Windows, for iOS 16.7, P. That covers system frames. Whether it takes our dSYM for the app's frames is P.
- **Others:** Sentry's `symbolic` (no Windows wheels, so it must be built from source), and `atosl`, a Rust reimplementation of `atos` (Windows not stated).

### 3.2 What's possible today, with no new code

**App Store Connect's crash counts (web).** Analytics shows opt-in crash counts by version, platform version and device class: that's how the 14 crashes were found (2026-11-15). There are no logs on the web:
- Apple's metrics help counts opt-in users only, with at least 5 active devices, and says "Get detailed crash logs and crash reports in Xcode". **C** ([App metrics](https://developer.apple.com/help/app-store-connect/reference/app-metrics)).
- The Analytics Reports API's "App Crashes" report gives the same counts by version, device and OS, with no stacks. **C.**
- No release of the App Store Connect API, 4.0 to 4.6, adds App Store crash logs. Only TestFlight's are there (below). **C** for the notes read; that nothing else exists is **NF**.
- "Download dSYM" in App Store Connect works only for old bitcode builds, "no longer available for submissions from Xcode 14 or later". **C.** So Apple gives no dSYM back.

These counts stay [NFR-REL-001](../srs/SRS.md#nfr-rel-001)'s source either way.

**TestFlight → Crashes.**
- "TestFlight testers automatically share crash logs". Each crash downloads from TestFlight → Feedback → Crashes as a `.zip` with the report and the tester's comment, kept for 120 days. **C** ([tester feedback](https://developer.apple.com/help/app-store-connect/test-a-beta-version/view-tester-feedback)).
- The API returns the same log as text: `GET /v1/betaFeedbackCrashSubmissions/{id}/crashLog` gives a `BetaCrashLog` whose one attribute is `logText`, since API 4.0. Admin, App Manager and Developer keys may read it. **C.**
- Whether the log comes symbolicated: **NF.** Probably raw from the device, with the app's frames unresolved (P), which is where §3.1's dSYM comes in.

It covers testers only. For the 1.5.0 crash it shows nothing: TestFlight's crash feedback was empty on 2026-11-15, and no tester has an iOS 16 phone that anyone knows of.

**The App Store Connect API's diagnostics.**
- `diagnosticSignatures`' `diagnosticType` is exactly `DISK_WRITES`, `HANGS` and `LAUNCHES`, with no crash type, though Apple's own summary says "a recurring crash, hang, or disk-write exception". **C** (checked again; the earlier session found the same).
- Each signature's logs are "anonymized backtrace logs": a `callStackTree` with metadata. Frames can come symbolicated, "if you include symbol information when submitting a build". **C.** Whether EAS's upload includes it: **P.**
- `perfPowerMetrics` has a `TERMINATION` category, "terminations that people don't initiate", but as an average per day, not a log. **C.**
- Apple fills these only after "significant usage of your app", with no number. **C.** An app with a few hundred users is probably below it (P).
- **The key:** only an Admin can generate a team key, and its private key downloads "a single time". **C** ([creating API keys](https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api)). Which role the diagnostics need isn't stated (**NF**); one forum post says Admin (P). Signing the token (ES256) needs nothing beyond Node's own `crypto`.

**Worth fetching from Windows? Not now.** The logs hold no crashes. They're probably empty for an app this size. A team key is a standing credential that has to be kept safe. They'd matter for hangs or slow launches ([NFR-PERF-001](../srs/SRS.md#nfr-perf-001)), and a single probe would show whether anything is there.

**An `.ips` file from a phone.**
- **Where it is:** Settings → Privacy & Security → Analytics & Improvements → Analytics Data, named after the app's binary and the time (`ValentinePomodoro-…`). The share button sends it by Mail. Apple adds that customers can also transfer reports to a Mac or a Windows computer. **C** ([acquiring crash reports](https://developer.apple.com/documentation/xcode/acquiring-crash-reports-and-diagnostic-logs)).
- **The format,** from iOS 15: two JSON objects, a metadata line and then the report. Frames give `imageOffset` into an image listed in `usedImages` with its `uuid` and `base`. `lastExceptionBacktrace` holds an uncaught exception's stack, which is where `RCTFatal` would show. **C** ([the JSON format](https://developer.apple.com/documentation/xcode/interpreting-the-json-format-of-a-crash-report)).
- On Windows, the app's frames take the dSYM ([§3.1](#31-symbols-first-what-every-native-route-needs)), and the system's take `ipsw` with that iOS build's cache.

It needs the person whose phone crashed. The 1.5.0 crashes came from someone the project doesn't know, so this works only for testers, friends and anyone who writes in.

**A repro on an iOS 16.7 phone.** iOS 16.7 is the newest an iPhone 8, 8 Plus or X can run, and those phones are cheap second-hand. Installing the App Store or TestFlight build on one, and opening it, shows at once whether the crash is at launch. A TestFlight crash then prompts the tester to share it, so the log lands in TestFlight → Crashes, with no Mac. **P.** The app's floor is iOS 16.4 (SDK 58), and no record shows a test on iOS 16.

**Organizer on a Mac.** The only route to the 14 logs Apple already holds.
- Xcode 27 installs and runs only on Apple silicon Macs, and needs macOS Tahoe 26.6. **C** ([Xcode 27 release notes](https://developer.apple.com/documentation/xcode-release-notes/xcode-27-release-notes), [system requirements](https://developer.apple.com/xcode/system-requirements/)).
- Xcode 26 needs macOS Sequoia 15.6 (P) and still runs on Intel (P). Whether an older Xcode's Organizer still downloads the logs is **NF**. So the Intel Mac's macOS version decides whether it's worth a try (Q3).
- **Rentals:** AWS's Mac hosts have a "24-hour minimum allocation period" (C), at about $16 for that day (P). MacinCloud is about $1 an hour, bought in 30-hour blocks (P).

Signing in to the developer account on someone else's or a rented Mac puts the Apple ID's session on that machine, so a trusted person's Mac beats a rental.

### 3.3 MetricKit in a local Expo module (route 3a)

**What it is.** MetricKit is Apple's framework for diagnostics the system collects about an app. The app registers a subscriber, and the system hands it `MXDiagnosticPayload`s. Each can hold crash, hang, CPU-exception, disk-write and launch diagnostics. **C** (Apple's documentation data).

**Availability.** `MXDiagnosticPayload`, `MXCrashDiagnostic` and `MXCallStackTree` are iOS 14.0+, iPadOS 14.0+, Mac Catalyst 14.0+ and macOS 12.0+. The app's floor is iOS 16.4, so **every supported phone, iOS 16.7 included, has them.** **C.**

**When it arrives.**
- Apple: "The system delivers a diagnostic report as soon as it's available", from iOS 15 and macOS 12. **C.** But the `didReceive(_:)` page for diagnostics still says at most once a day, so Apple's pages disagree (C).
- In an Apple engineer's forum test, a crash's diagnostic arrived when the app was opened again (P, [thread 784399](https://developer.apple.com/forums/thread/784399)). "The next launch" is P, not documented.
- Reports accumulate only from the first call to `MXMetricManager.shared`, and registering during launch is safe. **C** (Apple's `MXMetricManager` overview). So a crash on an install's first launch with the module, before it registers, is never reported (P).

**No backlog.** `pastDiagnosticPayloads` "only reflects diagnostic reports from the current session and lifetime of the [manager] instance. It doesn't include diagnostics from previous app instances." So **a version with MetricKit can't fetch older crashes**, and it never sees the 14 of 2026-11-10. **C.**

**What a crash diagnostic holds** (C, Apple's documentation data):
- `exceptionType` ("the Mach exception type"), `exceptionCode`, `signal`, `terminationReason` ("a human-readable string"), `virtualMemoryRegionInfo` (for a bad access) and `callStackTree`.
- **`exceptionReason`, only from iOS 17.0.** It's an `MXCrashDiagnosticObjectiveCExceptionReason`, with `className`, `composedMessage`, `exceptionName`, `exceptionType`, `formatString` and `arguments`, for "an uncaught ObjC exception". **iOS 16.7 phones don't send it.**
- The payload's metadata (`MXMetaData`): `applicationBuildVersion`, `osVersion`, `deviceType` ("the hardware identifier"), `platformArchitecture` and `regionFormat` from iOS 13; `isTestFlightApp`, `lowPowerModeEnabled` and `pid` from iOS 17; `bundleIdentifier` from iOS 26. In the JSON the keys differ, for example `appBuildVersion` (P, one sample).
- **The call-stack tree's JSON:** `callStacks[]`, each with `threadAttributed` and `callStackRootFrames[]`. Each frame has `binaryName`, `binaryUUID`, `address`, `offsetIntoBinaryTextSegment`, `sampleCount` and nested `subFrames[]`. **C** (Apple's `jsonRepresentation()` page). **There are no symbol names**: Apple's engineers advise symbolicating off the device from the UUIDs and addresses (P, forum).
- **One trap in the offset:** in an iOS 26.6 sample, `address − offsetIntoBinaryTextSegment` was the same page-aligned value across four frames of one binary, so the field was a true offset. A 2021 sample put the binary's load address there instead (P, two forum samples). The parser must handle both ([§4.1](#41-turning-a-metrickit-frame-into-a-source-line)).

**Deprecated, but the only choice.** Apple deprecated `MXMetricManager`, `MXDiagnosticPayload`, `MXCrashDiagnostic` and the rest at iOS 27.3 (Mac Catalyst 27.0). Apple's notes say "Use MetricManager instead.", "Use DiagnosticReport instead." and, on `MXCrashDiagnostic`, "Use DiagnosticResult instead.". The new Swift types, such as `CrashDiagnostic`, start at iOS 27.0. **C** (Apple's documentation data). A module for iOS 16.4 and later has to use the `MX` classes, and it compiles with deprecation warnings on the iOS 27 SDK (P). A later version could add the new API for iOS 27 devices.

**What a fatal JavaScript error looks like there.** In a release build, React Native turns a fatal JS error into `RCTFatal` with the description `"Unhandled JS Exception: " + message` (`RCTExceptionsManager.mm:79`). `RCTFatal` throws an `NSException` named `RCTFatalException: <description>`, whose reason carries the JS stack, cut to 175 characters (`RCTAssert.m:133-147`). **C in code.** The bridgeless runtime reaches the same path when no host delegate handles the error (`RCTInstance.mm:674-686`). A fatal JS error is therefore an **uncaught Objective-C exception**, and that's the class of crash MetricKit covers only from iOS 17:
- **On iOS 17+**, `exceptionReason` should name the JS error: its full message is in `exceptionName`, and a 175-character cut with the JS stack in `composedMessage` (P, from the code above).
- **On iOS 16, whether it arrives at all is NF.** Expo's Observe page says MetricKit's reports "On iOS 17 and later … also cover uncaught Objective-C and Swift exceptions" (C), and a third-party README says the same (P). Such a crash ends in `SIGABRT`, so it might still arrive as a signal crash with a stack through `RCTFatal`, but nothing found says so.
- So **on iOS 16, MetricKit is reliable only for signals and Mach exceptions** (bad access, traps). A JS fatal there needs 3b ([§3.5](#35-the-javascript-error-and-launch-stage-record-route-3b-the-idea-set-aside-for-152)), which is why 3b is part of the recommendation and not an extra.

**The module.** It would copy `modules/mac-display-awake`'s layout: a podspec, one Swift file and an `index.ts`.
- **Start at launch, before JavaScript,** as an app-delegate subscriber. Expo autolinks those from `expo-module.config.json`'s `appDelegateSubscribers`, as `expo-notifications` does (`node_modules/expo-notifications/expo-module.config.json`). **C in code.** Registering there, in `application(_:didFinishLaunchingWithOptions:)`, gives MetricKit the earliest place to deliver.
- **In the callback, only write.** Each payload's `jsonRepresentation()` goes to a file in the app's caches folder, with no parsing in Swift. Parsing in native code is where this module could itself crash.
- **Keep a few.** At most 5 files and 30 days on the phone, oldest dropped first, so a phone offline for weeks doesn't fill up.
- **JavaScript reads them** with `takePending()`, a function returning the files' text and deleting them once sent.

**Native risk.** It's smaller than a crash reporter's and larger than `mac-display-awake`'s:
- **It runs on every iPhone, at every launch.** `mac-display-awake` does nothing unless `isiOSAppOnMac` is true.
- **It installs no signal or exception handler.** MetricKit is the system's own collection: the app only receives reports, so it can't disturb how the app crashes or how other SDKs catch it (P, from Apple's model of delivery).
- **No local compile** ([CON-004](../srs/SRS.md#con-004)). EAS's build is its first compile, as it was for `mac-display-awake` in build 67, which shows the path works.
- **The failure to fear** is a bug in the callback that crashes whenever a payload arrives. Writing bytes and nothing else, and a TestFlight check with a deliberate crash, guard against it ([§6.2](#62-checks-a-go-ahead-would-add)).

**Known limits.**
- **Consent:** Apple documents no link to the "Share With App Developers" setting (**NF**). In an Apple engineer's test on iOS 18.3, crash diagnostics arrived with both analytics settings off (P). One third-party blog says the opposite (P). So the app's own switch has to be the consent, which ADR-0051's switch already is.
- **Watchdog kills** arrive as crash diagnostics. On iOS 26 some came as `EXC_CRASH`/`SIGKILL` with no `terminationReason` (P, forum).
- **Out-of-memory kills** have no diagnostic before iOS 27, only daily counts such as `cumulativeMemoryResourceLimitExitCount` in the metric payloads. **C.** iOS 27 adds a memory-exception diagnostic (C).
- **Reliability:** forum reports of iOS 17.2–17.5 not delivering on the next launch, and of attributed threads with empty stacks (P). The deliberate-crash check (V2) is the only way to know on this app.
- **A JS bundle that fails to load** calls `RCTFatal` directly (P, from React Native's source), so it shows up as the same native exception.

**On a Mac.** The classes exist on Mac Catalyst 14.0+ and macOS 12.0+. iOS apps on a Mac use the same frameworks as Mac Catalyst apps (C, Apple's running-in-macOS page). Whether MetricKit *delivers* to an iPad app on a Mac: **NF** (four searches, Apple's MetricKit overview, and its Mac article). On macOS, MetricKit's delivery timing is best effort (P, an Apple engineer). The project can't check it: its only Mac is an Intel one, and Designed for iPad needs Apple silicon. The Mac audit's [§9.7](2026-11-13-mac-version-audit.md#97-the-owners-answers-2026-11-15) recorded "Yes, M1 or later"; that was corrected on 2026-11-15.

### 3.4 Sending it to the Supabase project

This would follow `report_startup` ([B4](2026-11-05-phase2-b4-startup-reports.md), [C4](2026-11-05-phase2-c4-startup-report.md)), with these differences.

**The table, `crash_reports`.** A design, not a migration:

| Column | Holds | Check |
|--------|-------|-------|
| `day` | The day the server received it, as in `startup_reports` | `default current_date` |
| `build` | `applicationBuildVersion` | `^[0-9]{1,8}$`, as `startup_reports` |
| `os` | The OS version only, from `osVersion` (`"iPhone OS 16.7 (20H19)"` becomes `16.7`) | `startup_reports`' pattern |
| `device` | `deviceType`: `iPhone10,6`, an iPad, or whatever a Mac reports | **Not** `startup_reports`' `^(iPhone\|iPad\|iPod)…` check, which drops Macs silently (line 13). Allow `^[A-Za-z]{2,16}[0-9]{1,3},[0-9]{1,3}$`, `arm64` and `unknown` |
| `kind` | `native`, or `js` for 3b's record | `in ('native', 'js')` |
| `exception_type`, `exception_code`, `signal` | MetricKit's numbers | Integers |
| `termination` | `terminationReason` | `length <= 300` |
| `stack` | The crashed thread's frames only | `jsonb`, `octet_length(stack::text) <= 32768` |
| `js_error` | The JS error's name and message, 3b only | `length <= 300` |

**Kept off the server:**
- `pid`, `regionFormat` (the region setting, such as `TR`) and `lowPowerModeEnabled`, which identify more than they explain.
- **The whole of `exceptionReason`.** For a JS fatal, `exceptionName` carries the full JS message and `composedMessage` a cut of it with the stack. The JS message comes instead from 3b, from one place, capped at 300 characters, and only if the owner agrees (Q5).
- The other threads' stacks and `virtualMemoryRegionInfo`, unless the owner wants them (they'd raise the cap).

**The function, `report_crash`.** `security definer`, callable by `anon`. It checks its inputs, drops a bad report and says nothing back, as `report_startup` does. It also refuses a report when the table already holds 3,000 rows ([§4.2](#42-the-size-cap-and-the-storage-ceiling)). The migration grants `execute` on the function and nothing on the table, explicitly, as the project's migrations do.

**Size.** One real iOS 26.6 crash payload, posted on Apple's forums, was 136,777 bytes pretty-printed, with at least 17 call stacks (C for the byte count). That's why only the crashed thread is sent, which is a few kilobytes (P). Supabase documents no request-body limit for its REST API (**NF**: searched its docs and GitHub). 32 KiB stays well under any likely gateway limit (P).

**Retention.** 90 days, by the `pg_cron` pattern that already deletes old start-up reports ([NFR-PRIV-001](../srs/SRS.md#nfr-priv-001)). pg_cron already runs on this project (the start-up migration). Supabase states no plan restriction on it (C for its limits, NF for a plan statement).

**The Free plan.** **C** ([pricing](https://supabase.com/pricing), [database size](https://supabase.com/docs/guides/platform/database-size), [pausing](https://supabase.com/docs/guides/platform/free-project-pausing)):
- 500 MB of database per project. It's a billing quota on a fixed 2 GB disk.
- "Free projects are paused after 1 week of inactivity". API calls from the app count as activity, and "a few user requests to the database each day" is typically enough.
- A paused project can be restored within a year.

If the project is paused, the request fails, and the phone keeps the file for the next launch, up to the 5-file, 30-day limit.

**Who sends.**
- **JavaScript (recommended first).** After start-up goes idle, the start-up report's sender (`src/startup/startupReport.ts`) also posts pending files to `report_crash`, under the same switch, never throwing and never retrying. Jest can prove the switch and the one-request rule, as it does now. It never runs if start-up itself crashes every time.
- **Native, later if needed.** Swift could post the file with a background `URLSession`, which the system completes even if the app dies (P). But the switch lives in MMKV, written by JavaScript. Native code would need a copy in `UserDefaults`, and an install upgraded from 1.5.x has no copy until JavaScript has run once. So native sending can't promise "off means nothing is sent" for a crash loop on its first run. Not recommended unless a launch loop is suspected.

**The switch.**
- **Reuse `shareStartupTimings`, renamed** (recommended): one switch for "Share diagnostics", on by default, as ADR-0051's owner chose. Anyone who has turned off the timings sends no crash reports either. The key name can stay, so no storage migration is needed.
- **Or a new switch**, `shareCrashReports`. Two promises to explain, and a new default to decide.
- Either way, the Settings label and footer change in both languages. Today the footer says: "Sends how long the app took to open, your iPhone model, your iOS version and the app's build. Nothing that identifies you." (`src/i18n/en.json`, `settings.privacy.footer`).

**App Privacy.** Diagnostics › Crash Data ("Such as crash logs"), not linked to you, for App Functionality, whose definition includes "minimize app crashes". **C** ([App privacy details](https://developer.apple.com/app-store/app-privacy-details/)). [F4's labels](2026-11-06-phase2-f4-listing.md#app-privacy-labels) say the app collects no crash data, so this is a change in App Store Connect, with the release.

**The privacy policy.** A new section in both languages, drafted here for the copy review, for the recommended route: 3a and 3b, with the JS message (Q5 yes). It names no version, since none is chosen.

> **Crash reports.** If the app closes unexpectedly, your iPhone keeps a technical report and gives it to the app the next time it opens. The app also notes how far it had got in opening. It then sends both to us. They hold where in the app's code the problem happened, the kind of error and its technical message, the app's build number, your iOS version and your device model. They have no name, no account and no device identifier. They aren't meant to hold anything you wrote, but an error's message can include a few words that were on the screen, so it is cut to 300 characters. The server adds the date. Reports are deleted after 90 days. **Share diagnostics** in Settings, under Privacy, turns them off along with the start-up timings.

> **Çökme raporları.** Uygulama beklenmedik şekilde kapanırsa iPhone'un bununla ilgili teknik bir rapor tutar ve uygulama bir sonraki açılışında bu raporu alır. Uygulama ayrıca açılırken nereye kadar geldiğini not eder. Ardından ikisini de bize gönderir. Bunlarda sorunun uygulamanın kodunda nerede oluştuğu, hatanın türü ve teknik mesajı, uygulamanın yapı numarası, iOS sürümün ve cihazının modeli bulunur. Ad, hesap ya da cihaz kimliği yoktur. Senin yazdığın bir şeyi içermeleri amaçlanmaz; ancak bir hata mesajı ekranda olan birkaç kelimeyi içerebilir, bu yüzden 300 karaktere kısaltılır. Tarihi sunucu ekler. Raporlar 90 gün sonra silinir. Ayarlar'da, Gizlilik altındaki **Tanılama verilerini paylaş** anahtarı, açılış süreleriyle birlikte bunları da kapatır.

If Q5 is no, the third and fourth sentences become "They hold where in the app's code the problem happened, the kind of error, …" and "They have no name, no account, no device identifier and nothing you wrote." (*"Bunlarda … hatanın türü, …"* and *"Ad, hesap, cihaz kimliği ya da senin yazdığın bir şey yoktur."*).

The short version would gain a line, and "Start-up timings" would point to the renamed switch. The policy says "iPhone" throughout, which the Mac audit's Q7 already asks about.

**What it costs.**
- **Bytecode:** an estimate, not measured, of **1,000 to 3,000 B** for `index.ts` and the sender. That's anchored on two measurements: ADR-0050's whole `fetch` client probe was 4,844 B, and 1.5.2's Mac work was 5,448 B. The headroom is 27,708 B ([1.5.2's record](2026-11-15-v152-mac.md)).
- **Native:** one Swift file, one Apple framework, no third-party code.
- **Server:** one migration, through the existing GitHub deploy.
- **Copy:** the Settings strings and the policy, in both languages.
- **Records:** a new ADR (it amends ADR-0050's "NFR-REL-001 is read from App Store Connect" and ADR-0051's "exactly one request"), and SRS changes: NFR-REL-001's Verify field, NFR-PRIV-001's list, and a new requirement for the report. None is written here.

### 3.5 The JavaScript error and launch-stage record (route 3b, the idea set aside for 1.5.2)

The idea: the app records how far start-up got and any fatal JS error, and sends it on the next launch. The owner set it aside on 2026-11-15. The session that discussed it noted that it works for JS errors and the stage reached, and is blind before the app's code runs.

**Where it hooks in.** React Native 0.88 still installs its global handler through `ErrorUtils.setGlobalHandler` (`Libraries/Core/setUpErrorHandling.js:13,35`), since the flag that would bypass it defaults to false (`ReactNativeFeatureFlagsDefaults.h:336-337`). **C in code.** A wrapper reads the current handler, records the error, then calls it, so the crash itself is unchanged. MMKV writes synchronously, so the record survives the abort that follows (P).

**What it adds to MetricKit:**
- **The JS message and stack on every iOS version,** including iOS 16, where MetricKit may not report a JS fatal at all ([§3.3](#33-metrickit-in-a-local-expo-module-route-3a)).
- **How far start-up got.** The start-up probe already marks the stages in memory (`src/startup/startupProbe.ts`). Writing the last mark reached tells "never opened" from "crashed after a minute".
- **JS stacks are Hermes bytecode offsets.** Mapping them back needs the build's source map. `npx expo export --platform ios --dump-sourcemap` reproduced 1.5.0's bytecode size exactly from its commit ([1.5.1's record](2026-11-12-v151-screen-sleep-fix.md)), so regenerating a map from the tagged commit is plausible. Byte-identical output isn't proven (P). EAS can also keep the map: `uploadSourceMaps: true` uploads it to Expo for Expo Observe ([eas.json reference](https://docs.expo.dev/eas/json.md)), **C**, but that serves Observe's dashboard only.

**What it can't see:** a native crash, a crash before the bundle runs, and a hang. It's one layer, and MetricKit is the other ([§3.7](#37-which-route-sees-which-crash)).

**Cost:** an estimate of **1,000 to 2,000 B** of bytecode, no native code. It shares 3a's table (`kind = 'js'`), switch, copy and records.

### 3.6 Hosted reporters, and ADR-0050 again

**What ADR-0050 decided** (2026-11-05): no Sentry, because `@sentry/react-native` measured **+1,658,512 B** of bytecode (38.6 %) and `@sentry/core` alone +744,256 B. NFR-REL-001 would be read from App Store Connect.

**What has changed since:**
- **Organizer is closed.** ADR-0050 read crash data from App Store Connect, assuming someone could open the logs in Xcode. The owner has no Mac that runs it (2026-11-15).
- **The project has crashes to explain:** the 14 of 2026-11-10.
- **Native code is now proven on EAS.** `modules/mac-display-awake` compiled in build 67, so a native-only route no longer means a first.
- **The headroom shrank** from 39,616 B (1.5.0) to 27,708 B (1.5.2). Sentry's JavaScript SDK would be 60 times it.
- **Expo now has its own reporter.** Expo Observe is new since ADR-0050 was written, and ADR-0050 didn't consider it.

**Expo Observe** (`expo-observe`). **C** unless marked, from [its error-reporting page](https://docs.expo.dev/eas/observe/errors.md) (modified 2026-11-02) and [introduction](https://docs.expo.dev/eas/observe/introduction.md):
- "Error reporting in Expo Observe is in preview and requires SDK 57 or later." `expo-observe` 58.0.19 (2026-11-11) is the SDK 58 line (npm).
- It records unhandled JS errors through a global handler it installs when imported, and native crashes, persisted on the device and sent on the next launch. "On iOS, Expo Observe uses MetricKit". On iOS 17 and later, they also cover uncaught Objective-C exceptions.
- "Application Not Responding (ANR) events and out-of-memory terminations are not recorded".
- JS stacks are symbolicated from source maps uploaded by the build (`uploadSourceMaps`). **Native stacks aren't:** "frames are resolved to symbol names on the device", and dSYM upload "is not supported yet". The app binary is stripped, so its own frames would show as `ValentinePomodoro + offset` (P).
- **An identifier:** "Users are identified by an anonymous ID that is unique per app installation." ADR-0051 rejected exactly that for the start-up report, because "it would make the data pseudonymous".
- It also collects start-up and navigation metrics, sessions and their "countries", and sends OpenTelemetry (OTLP) JSON to Expo, or to a custom endpoint baked in at build time. Supabase doesn't speak OTLP, so a custom endpoint would need a collector.
- Native crash reporting arrived on 2026-10-07, in 57.0.21 ([Expo changelog](https://expo.dev/changelog/native-crash-reporting-in-eas-observe)).
- **The Errors dashboard isn't on the Free plan.** Expo's pricing table marks it "—" for Free and ✓ for Starter, at "$19/month plus additional usage cost". **C** ([pricing](https://expo.dev/pricing)). The Free plan includes 100,000 events a month, and data is deleted after 90 days.
- A switch exists: `configure({ dispatchingEnabled: false })`.
- **Bytecode: not measured, and probably about the whole headroom.** Its built JavaScript, without web files and integrations, is 15,738 B for `expo-observe` and 16,686 B for `expo-app-metrics`, before minifying. Bytecode is of the same order, so **roughly 15,000–35,000 B against 27,708 B.** An estimate from the npm tarballs' listings, not a build.

**Sentry.** **C** unless marked, from npm, its changelog and its docs:
- `@sentry/react-native` 8.35.0 (2026-11-12) supports Expo SDK 50 and later, and its changelog names "Support Expo Router 58" and React Native 0.88. That it works on this stack is P.
- **ADR-0050 measured 8.28.0.** Since then, 8.30.0 marked the package "side-effect free so bundlers can tree-shake", and 8.33.0 compiled to ES2018, "reducing bundle size". A new measurement would differ by an unknown amount, but a JavaScript `Sentry.init` is very unlikely to get anywhere near 27,708 B (P).
- **A native-only start exists, marked experimental.** With `useNativeInit: true`, the Expo plugin inserts `RNSentrySDK.start()` into the AppDelegate, which reads `sentry.options.json` and starts the Cocoa SDK without JavaScript (C, in the 8.35.0 tarball). If no JavaScript imports the package, Metro shouldn't bundle it, so close to 0 B (P, untested).
- **Symbols without a Mac:** the plugin adds an Xcode build phase, "Upload Debug Symbols to Sentry", which uploads the dSYM with `sentry-cli` during the EAS build. It uses `SENTRY_AUTH_TOKEN` as an EAS environment variable.
- **Free plan:** 1 user, 5,000 errors a month, 30 days. An EU region (`de.sentry.io`) is available on all plans, chosen when the organisation is created.
- **Against it:** a third-party crash handler starts at every launch for everyone, which is what ADR-0050 avoided. Sentry becomes a processor in the policy and in App Privacy. Sentry's Apple SDK has left CocoaPods, so a hand-made module around it alone is harder than the package's own native start.
- **Its use here:** the fallback if route 3's Windows symbolication fails (V1), since Sentry symbolicates for us.

**Firebase Crashlytics.** **No.**
- `@react-native-firebase` 27 requires dynamic frameworks: "Expo projects must select dynamic linkage", and static linkage collides "at link time as duplicate-symbol errors". **C** ([RNFB SPM](https://rnfirebase.io/ios-spm)).
- The app is built with `useFrameworks: "static"` (`app.json`). Switching the whole app's linkage for a crash reporter is a large native change, with nothing to test it on but EAS.
- Otherwise it's free, uploads dSYMs in the cloud build, and keeps data 90 days, with Google as processor. **C.**

**Others** (one line each; C for versions and plans, P for the rest):

| Reporter | Native iOS crashes, symbolicated without a Mac | Free tier | Fit |
|----------|-------------------------------------------------|-----------|-----|
| bitdrift | Free crash reporting "on 100% of your devices"; iOS symbolication not stated | Yes | A JS SDK of tens of KB (P) |
| PostHog | Native crashes with `@posthog/react-native-plugin`, debug symbols uploaded at build time | 100,000 exceptions a month (P) | Its JS is hundreds of KB raw |
| BugSnag (Insight Hub) | Its Expo guide covers JS errors only | 7,500 events a month, 7 days | JS only |
| Embrace, Datadog, Luciq (Instabug) | Not checked | Embrace yes; Datadog's RUM and Luciq paid (P) | No |
| KSCrash 2.6.1, PLCrashReporter 1.12.2 | They write reports in-process, which a local module could post to Supabase. They'd also capture an exception's reason on iOS 16 | Open source | They install crash handlers, more native risk than MetricKit. Only if MetricKit proves unreliable |
| EAS Insights | Usage only, no crash data | — | No |

### 3.7 Which route sees which crash

C, P and NF as in §2. "—" means the route doesn't cover it. "Count" means App Store Connect counts it but shows no stack.

| Crash | ASC counts | TestFlight log or `.ips` | Organizer (Mac) | 3a. MetricKit module | 3b. JS record | Expo Observe |
|-------|-----------|--------------------------|-----------------|---------------------|--------------|--------------|
| **A fatal JS error** | Count | Native stack through `RCTFatal`; the message in the log's exception text (P) | Same | iOS 17+: stack and message (P). iOS 16: may not arrive at all (NF) | **Message and JS stack, every iOS** (P; the hook is C in code) | JS stack, symbolicated (C) |
| **A native crash after JS starts** (a signal or Mach exception) | Count | Stack (C) | Stack, symbolicated by Apple (P) | **Stack** (C), on a later launch (P) | How far start-up got | Stack, app frames unsymbolicated (C) |
| **A native crash before JS starts** | Count | Stack | Stack | On a later launch that gets far enough to send (P) | — | Same as MetricKit (P) |
| **A crash before the app's code runs** (the system can't load it) | Count (P) | Stack and reason (P) | Same | — (P): the module never runs to register | — | — |
| **The same crash at every launch** | Count | Stack | Stack | Only if a launch lives long enough to send: never, for a JavaScript sender | — | Same (P) |
| **A hang, or a watchdog kill** | Hang rate and terminations per day, through the API (C); logs only past Apple's threshold | Watchdog log (P) | Hangs and logs | Hang diagnostics exist (C). A watchdog kill arrives as a crash, sometimes with no reason (P) | — | "ANR events … are not recorded" (C) |
| **Out of memory** | — (P) | — (P) | Terminations metrics (P) | A daily count only, before iOS 27 (C) | — | "not recorded" (C) |
| **On a Mac** | Counted by platform (P) | TestFlight for Mac, on Apple silicon only | Yes (P) | NF | Yes, the same JavaScript runs (P) | NF |
| **The 14 crashes of 2026-11-10** | **Counted** | Only the `.ips` from that phone | **Yes: the only route** | — (no backlog, C) | — | — |

**So 3a and 3b aren't alternatives.** MetricKit sees the native layer and anything that kills the process; the JS record covers the JS fatals MetricKit can't be relied on for before iOS 17. Neither sees a crash before the app's code runs, and nothing new reaches the crashes already recorded.

---

## 4. Mathematical / Statistical Details

### 4.1 Turning a MetricKit frame into a source line

A MetricKit frame gives a binary's UUID $u$ and name, its run-time `address` $A$, and `offsetIntoBinaryTextSegment` $f$. ASLR moves $A$ on every launch, so it can't be looked up directly; the offset $o$ into the binary can.

- **Match the binary:** pick the dSYM whose UUID equals $u$ (`LC_UUID` in `llvm-objdump --macho --private-headers`, or `llvm-dwarfdump --uuid`). A dSYM from another build of the same commit has another UUID and gives wrong answers, so the match is a hard check, not a hint.
- **Read the field before trusting it** (§3.3's trap). If $f$ is page-aligned ($f \bmod 16384 = 0$) and $f \ge \texttt{0x100000000}$, it is the load address, and the offset is $o = A - f$. Otherwise $o = f$. Within one binary in one report, $A - o$ must come out the same for every frame, which checks the choice.
- **The address to look up** is the binary's `__TEXT` segment address in the dSYM plus the offset:

  $$a = v_{\text{TEXT}} + o$$

  For an arm64 iOS app's main executable, $v_{\text{TEXT}}$ is normally `0x100000000`, read from the dSYM (`llvm-objdump --macho --private-headers`) rather than assumed. For a framework it's usually 0.
- **Return addresses:** every frame except the crashing one is a return address, one instruction past the call. Looking up $a - 1$ for those frames lands inside the call, which is what Apple's tools do too (P).

### 4.2 The size cap and the storage ceiling

Let $b$ be the cap on one stored report, in bytes, and $n$ the cap on rows the server keeps. The worst case, when someone holding the publishable key writes junk as fast as the database takes it, is

$$S_{\max} = n \cdot b$$

before compression. With $b = 32{,}768$ (32 KiB) and $n = 3{,}000$, $S_{\max} \approx 98$ MB, a fifth of the Free plan's 500 MB database. Postgres compresses large values (TOAST), and call-stack JSON repeats its keys, so real use sits well under that (P).

The cap $n$ is enforced in `report_crash` itself: if `count(*)` already reaches $n$, the function drops the report, as `report_startup` drops a bad one, and says nothing back. Retention deletes rows older than 90 days ([NFR-PRIV-001](../srs/SRS.md#nfr-priv-001)), so for honest traffic the table holds the last 90 days' crashes. With the app's base (86 start-up reports in all, 2026-11-15) that's a handful of rows, far under $n$.

**The ceiling's own cost:** junk that fills $n$ silences real reports until retention clears it, up to 90 days. A per-day cap $d$ as well (say $d = 100$, so $n$ is reached only after 30 days of junk at full rate) limits a flood to that day. The build record chooses $d$ and $n$.

### 4.3 What a count of zero means

As with the start-up reports, a report arrives only if the app gets far enough to send it. If $r$ is the share of installs that have the switch on and reach a launch that sends, the server sees about $r \cdot k$ of $k$ crashes. A launch-loop crash has $r \approx 0$ for a JavaScript sender, so **no rows from iOS 16 would not mean no crashes on iOS 16.** App Store Connect's crash count stays the denominator, read beside the table.

---

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Recommend the app's own MetricKit route (3) | Expo Observe, Sentry, Crashlytics | It keeps the bytecode ceiling, adds no identifier and no new company, uses an Apple framework, and reuses the start-up report's server, switch and tests. Its cost is symbolicating on Windows ourselves |
| Keep the dSYMs before building anything | Build the module first | Without the build's dSYM, a stack is a list of offsets, whichever route collected it |
| 3a and 3b together | MetricKit alone, or the JS record alone | They see different layers ([§3.7](#37-which-route-sees-which-crash)). On iOS 16, MetricKit may not report a JS fatal at all, and the JS record can't see a native crash |
| Send from JavaScript first | A native background upload | The switch lives in JavaScript's storage, so only a JavaScript sender can keep "off means nothing is sent" on the first launch after an update. Jest can prove it. A native sender is the follow-up if a launch loop is suspected |
| Send only the crashed thread, cap it at 32 KiB, and stop at 3,000 rows | The whole payload | The function is open to anyone with the publishable key, so its size and row count are the damage limit on a 500 MB database |
| Reuse the start-up switch, renamed | A second switch | One promise to explain. Anyone who turned the timings off is already out |
| A device-model check that accepts Macs | Copy `startup_reports`' check | That check drops a Mac's reports with no error, and Macs are a reason for this work |
| Not Expo Observe, for now | Adopt it | It's in preview, it adds a per-install identifier ADR-0051 refused, its JavaScript is about the headroom, and its native frames aren't symbolicated yet |
| Don't fetch the App Store Connect API's diagnostics now | Write the script | They hold no crashes, and a team API key is a standing credential to look after |
| A read-only audit | Build now | The owner decides first. 1.5.2 is about to be submitted, and nothing built now helps the crashes already recorded |

---

## 6. Verification

### 6.1 Runnable checks (no Mac needed)

Run from the repository root, in Git Bash. Each command block was re-run verbatim from a script on 2026-11-15, and gave the result shown. The build-log check needs a short decoding script, so it's described in prose.

- [x] **The app has no crash or error hook today.** Expect no output, exit code 1:
  ```bash
  git grep -n -E "ErrorUtils|setGlobalHandler|ErrorBoundary|MetricKit|componentDidCatch" -- src app modules
  ```
- [x] **A fatal JS error becomes a native exception in a release build.** Expect line 79, `[@"Unhandled JS Exception: " stringByAppendingString:message]`, and lines 15 and 133 of `RCTAssert.m`, where `RCTFatal` throws an `NSException` named `RCTFatalException: <description>`:
  ```bash
  grep -n "Unhandled JS Exception" node_modules/react-native/React/CoreModules/RCTExceptionsManager.mm
  grep -n "RCTFatalExceptionName" node_modules/react-native/React/Base/RCTAssert.m
  ```
- [x] **JavaScript's global handler is still `ErrorUtils`.** The flag that would bypass it defaults to false, so `setUpErrorHandling.js` installs `ErrorUtils.setGlobalHandler` (its lines 13 and 35). Expect `return false;`:
  ```bash
  grep -n -A1 "useAlwaysAvailableJSErrorHandling() override" node_modules/react-native/ReactCommon/react/featureflags/ReactNativeFeatureFlagsDefaults.h
  ```
- [x] **A local module can start at launch, before JavaScript.** Expect `"appDelegateSubscribers": ["NotificationsAppDelegateSubscriber"]`:
  ```bash
  grep -n appDelegateSubscribers node_modules/expo-notifications/expo-module.config.json
  ```
- [x] **React Native is linked prebuilt, and its dSYMs aren't fetched unless asked.** Expect line 1258, `ENV['RCT_USE_PREBUILT_RNCORE'] != '0'`, then line 48, `@@download_dsyms = ENV["RCT_SYMBOLICATE_PREBUILT_FRAMEWORKS"] == "1"`:
  ```bash
  grep -n "RCT_USE_PREBUILT_RNCORE'] != '0'" node_modules/expo-modules-autolinking/scripts/ios/precompiled_modules.rb
  grep -n 'RCT_SYMBOLICATE_PREBUILT_FRAMEWORKS"\]' node_modules/react-native/scripts/cocoapods/rncore.rb
  ```
- [x] **The start-up table rejects any model but an iPhone, iPad or iPod one.** Expect line 13's check, and line 26's `p_model text,`:
  ```bash
  grep -n "model text" supabase/migrations/20261105150000_phase2_startup_reports.sql
  ```
- [x] **EAS kept no build artifacts beyond the `.ipa` and the logs.** Needs `eas login` as the owner. Expect builds 67, 66, 65 and 64, each with `buildUrl`, `xcodeBuildLogsUrl` and `applicationArchiveUrl` under `artifacts`, and no `buildArtifactsUrl`:
  ```bash
  eas build:list --platform ios --limit 4 --json --non-interactive
  ```
- [x] **Build 67 made its dSYMs.** `eas build:view a8404c1a-61ac-433d-86f8-7d0cae611df4 --json` lists two `logFiles` URLs. The second is Brotli-compressed JSON lines, which Node's `zlib.brotliDecompressSync` opens. In its fastlane phase, expect `Compressing 6 dSYM(s)`, the `zip -r '/Users/expo/workingdir/build/ios/build/ValentinePomodoro.app.dSYM.zip' *.dSYM` line, the six `adding: …dSYM/` lines, and `Successfully exported and compressed dSYM file`.
- [x] **MetricKit's exception reason starts at iOS 17, and the `MX` API is deprecated at 27.3.** Expect `"deprecatedAt":"27.3","introducedAt":"17.0","name":"iOS"` (twice), then `"deprecatedAt":"27.3","introducedAt":"14.0","message":"Use DiagnosticResult instead.","name":"iOS"`:
  ```bash
  curl -s https://developer.apple.com/tutorials/data/documentation/metrickit/mxcrashdiagnostic/exceptionreason.json | grep -o '"deprecatedAt":"[^"]*","introducedAt":"[^"]*","name":"iOS"'
  curl -s https://developer.apple.com/tutorials/data/documentation/metrickit/mxcrashdiagnostic.json | grep -o '"deprecatedAt":"[^"]*","introducedAt":"[^"]*","message":"[^"]*","name":"iOS"'
  ```
- [x] **No LLVM tools on this PC.** Expect "Could not find files" (PowerShell or Git Bash on Windows):
  ```bash
  where llvm-symbolizer
  ```
- [x] **The docs check:** `node scripts/docs/check-docs.mjs --write`, then `node scripts/docs/check-docs.mjs`. Expect 0 errors.

### 6.2 Checks a go-ahead would add

None has been run. They need a build, and the first two also need a Windows PC with LLVM's tools installed.

- [ ] **V1, symbols, before any module is built.** On the first build with `buildArtifactPaths`:
  1. Download the dSYM zip from the build page.
  2. Check that `llvm-objdump --macho --private-headers` prints the same `LC_UUID` for its DWARF file as for the `.ipa`'s binary.
  3. Resolve one known address with `llvm-symbolizer` ([§4.1](#41-turning-a-metrickit-frame-into-a-source-line)) and get a function from the app's own code.
  
  If this fails, Windows can't symbolicate, route 3 loses most of its value, and the decision goes back to the owner (route 7).
- [ ] **V2, a deliberate crash, on TestFlight.** The hidden start-up panel gets two buttons, "Crash (native)" and "Crash (JS)", shown only in a TestFlight build. On an iPhone:
  1. Press one, reopen the app, and wait.
  2. Note how long until a row appears in `crash_reports`, and on which launch.
  3. Symbolicate its top frames on Windows, and find the button's function.
- [ ] **V3, the switch.** With it off, Jest shows no request at all, as for the start-up report. On the phone, no row arrives for V2's crash.
- [ ] **V4, the usual device check** of the build ([device-check protocol](../testing/TEST-STRATEGY.md#5-device-check-protocol)), since the module runs at every launch.
- [ ] **V5, iOS 16,** if a phone can be found (Q2): the app opens. Then press both of V2's buttons. "Crash (native)" must give a `native` row. "Crash (JS)" is an uncaught `NSException`, so it must give a `js` row from 3b; note whether a `native` row arrives too, which settles §3.3's open question.
- [ ] **V6, a Mac,** can't be run: the project's Mac is an Intel one.

---

## 7. Related Docs

- [ADR-0050](../architecture/adr/0050-small-client-and-no-sentry.md): no Sentry, and NFR-REL-001 read from App Store Connect.
- [ADR-0051](../architecture/adr/0051-anonymous-start-up-reports.md): the anonymous start-up report, its switch and its "one request" rule.
- [B4's record](2026-11-05-phase2-b4-startup-reports.md) and [C4's record](2026-11-05-phase2-c4-startup-report.md): the table, the function and the sender a crash report would copy.
- [F3's record](2026-11-07-phase2-f3-measures.md): the start-up reports read so far.
- [F4's record](2026-11-06-phase2-f4-listing.md#app-privacy-labels): the App Privacy labels, which say the app collects no crash data.
- [E2's record](2026-11-06-phase2-e2-privacy-policy.md) and the [privacy policy](../../privacy-policy.md).
- [Mac version audit](2026-11-13-mac-version-audit.md): this report's format, and the Mac's start-up reports being dropped.
- [1.5.2 on the Mac](2026-11-15-v152-mac.md): `modules/mac-display-awake`, the local module this one would copy, and 1.5.2's bytecode.
- [SRS](../srs/SRS.md): [NFR-REL-001](../srs/SRS.md#nfr-rel-001), [NFR-PERF-002](../srs/SRS.md#nfr-perf-002), [NFR-PRIV-001](../srs/SRS.md#nfr-priv-001), [CON-004](../srs/SRS.md#con-004).
- [Release process](../process/RELEASE.md): where keeping a build's symbols would go.

---

## 8. The owner's decisions

### 8.1 Questions

Each recommendation is a default. Nothing is built until the owner answers.

| # | Question | Recommendation | Why |
|---|----------|----------------|-----|
| Q1 | **Keep each build's dSYM** by adding `"buildArtifactPaths": ["ios/build/*.dSYM.zip"]` to `eas.json`'s production profile? From the next build, or rebuild 1.5.2 now so build 67's replacement has one? | **Yes, from the next build.** Don't rebuild 1.5.2 for it, unless you'd rather have its symbols | **The only time-sensitive question.** Without the line, no route can name the app's frames in a 1.5.2 crash: a TestFlight log, an `.ips`, anything. 1.5.2 is also the first release with the repository's own Swift (`mac-display-awake`) and the Mac support, both untested where they run. A rebuild from the same commit costs one EAS build and a repeat of the iPhone check. Against it: 1.5.2 has no crash reporting, so its symbols would only serve logs that someone sends |
| Q2 | Can you borrow or buy a phone on **iOS 16.7** (an iPhone 8, 8 Plus or X) to open the App Store build on? | **Yes, if it's easy** | It's the cheapest way to see the 1.5.0 crash. If the app crashes there under TestFlight, the log reaches TestFlight → Crashes with no Mac |
| Q3 | Is there someone you trust with an **Apple silicon Mac** you could sign in to Xcode on for an hour? And which macOS does your Intel Mac run? | Ask around; don't rent one | Organizer is the only route to the 14 logs. Xcode 27 needs Apple silicon, but Xcode 26 runs on macOS 15.6 and later, on Intel too (P). Whether its Organizer still shows the logs is NF, and the Intel Mac's macOS version decides whether it's worth a try |
| Q4 | **Build route 3** (MetricKit, the JS error record, `crash_reports`) for the update after 1.5.2? | **Yes** | Native crashes from every supported iOS, JS crashes on every iOS through 3b, no third party, about 2,000–5,000 B |
| Q5 | Should a JS crash report carry the **error's message**, capped at 300 characters? | **Yes, capped,** and the policy says so | Without it, crashes from JavaScript can't be told apart on any iOS. A message is the app's own text but can include values from the screen, so §3.4's draft says that instead of "nothing you wrote" |
| Q6 | **Expo Observe** instead of route 3, or later? | **Not now.** Look again when it leaves preview | Its size has to be measured, and its per-install ID reverses ADR-0051's choice |
| Q7 | **One switch,** "Share start-up timings" renamed to "Share diagnostics", or a new one? | **One switch** | One promise, and people who opted out stay out |
| Q8 | Create an **App Store Connect API key** to fetch hang and launch logs? | **No, not now** | No crashes there, and a key is a credential to keep safe |

### 8.2 Who does what

| Step | Owner | Code (a session) |
|------|-------|------------------|
| The `eas.json` line (Q1) | Go-ahead | ✔ |
| An iOS 16.7 phone (Q2), a trusted Mac (Q3) | ✔ | Writes the checklist |
| Route 3: module, migration, sender, record, ADR, SRS changes | Go-ahead, then a build | ✔ |
| The Settings strings and the policy (§3.4) | Copy review, in both languages | ✔ drafts them |
| App Privacy: add Diagnostics › Crash Data | ✔ in App Store Connect, with the release | Writes what to tick |
| V1–V5 | The TestFlight build and the phone | ✔ symbolicates on Windows |

### 8.3 Noted, out of scope

- **The SRS is out of date on the Mac.** [CON-004](../srs/SRS.md#con-004) says that since 2026-11-15 "the owner has an Apple silicon Mac for TestFlight checks of the Mac app". The same day, the Mac turned out to be an Intel one. The Mac audit's §9.7 records the earlier answer.
- **The release process doesn't keep symbols.** If Q1 is yes, [RELEASE.md](../process/RELEASE.md) should say to download each release's dSYM zip, or to check that the build page has one.
