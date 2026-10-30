---
id: XTOOL-EVAL
title: Evaluation — xtool (cross-platform Xcode replacement) vs staying on Expo/EAS
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0032, ADR-0037, RELEASE, TEST-STRATEGY]
---

# Evaluation: xtool vs staying on Expo/EAS

**Question (yours, 2026-10-30):** is [xtool](https://github.com/xtool-org/xtool) usable for our work, to make development more independent, or should we stick with Expo for now?

**Decision (you, 2026-10-30): continue with Expo.**

**Verdict: stay on Expo/EAS, and don't adopt xtool.**
- It **can't build this app** (§2).
- Its build path **requires breaching Apple's Xcode licence** on a non-Mac (§3).
- The one thing it can do for us, installing an already-built app onto your iPhone without TestFlight, **Expo already does better** through device registration and a development client (§5). That is the independence worth having.

## 1. What xtool is (checked 2026-10-30)

| | |
|--|--|
| Purpose | "Cross-platform Xcode replacement": build **SwiftPM packages** into iOS apps, sign them, and install them on a device, from Linux, WSL or macOS |
| Licence | MIT |
| Maturity | v1.24.0 (2026-10-26), very active, about 14k stars |
| Maintainers | **Effectively one**: 416 of about 424 commits are by its author |
| Windows | **Only through WSL**, with USB passthrough via `usbipd` (or a workaround that relays through iTunes for Windows, for a common `muxError`) |
| Needs | The Swift 6.4 toolchain; an **`Xcode.xip` that xtool extracts into an iOS SDK**; an Apple login (an App Store Connect API key, or an Apple ID password through private APIs) |

## 2. Fit against what this app needs

| What we need | xtool today | Evidence |
|--------------|-------------|----------|
| Build an Expo / React Native app (RN 0.88, **New Architecture only, Hermes v1**, Expo modules, Swift and C++ pods: Nitro/MMKV, Reanimated, maps, AdMob) | **No.** It builds SwiftPM packages only. React Native exists only as an **experimental draft PR** on RN 0.77.3 with JavaScriptCore and the legacy bridge. That PR lists Hermes, the New Architecture, Expo modules, Swift pods and resources as *future work*. | README; issues [#364](https://github.com/xtool-org/xtool/issues/364), [#411](https://github.com/xtool-org/xtool/pull/411) (opened 2026-10-29) |
| Build an Xcode project or workspace (what `expo prebuild` generates, with CocoaPods) | **No.** Open request since 2025-07; the maintainer has an unreleased MVP. | [#144](https://github.com/xtool-org/xtool/issues/144) |
| Compile asset catalogs (app icon, colours) and the splash screen | **No.** Open feature work | [#219](https://github.com/xtool-org/xtool/issues/219), [#325](https://github.com/xtool-org/xtool/issues/325) |
| Upload to App Store Connect / TestFlight | **No.** Open requests | [#327](https://github.com/xtool-org/xtool/issues/327), [#117](https://github.com/xtool-org/xtool/issues/117) |
| Widgets and Live Activities (Phase 7) | Only as SwiftPM extensions of an xtool-built app. **They can't be embedded in our EAS-built app**; in Expo that's done with config plugins inside the generated Xcode project. | `Appex.md` in the xtool docs |
| Install an existing `.ipa` on your iPhone from Windows | **Yes** (`xtool install`), through WSL with USB passthrough. It re-signs with a development profile it creates for the connected device. This path needs **only the Apple login, not the SDK.** | `InstallCommand.swift` reads only the saved auth token |

## 3. Licence: building with xtool on Windows breaches Apple's Xcode agreement

Apple's *Xcode and Apple SDKs Agreement* opens by saying its software is "authorized only for execution on an Apple-branded product running macOS". §2.2.A grants installation only "on Apple-branded computers that are owned or controlled by You". xtool's setup asks you to download `Xcode.xip` (accepting that agreement) and then extracts its iOS SDK on Linux or WSL.

For a hobby experiment that's a personal risk call. **For a paid, store-listed app on your developer account, it puts the account behind the product at risk.** Install-only use (§2, last row) doesn't touch the SDK, so it has no licence issue.

## 4. Other risks

- **Credentials:** the recommended login is an App Store Connect **Team API key with the App Manager role**, a powerful key stored on your machine. The alternative sends your Apple ID password through private APIs, and xtool's own docs suggest a throwaway Apple ID for that.
- **Bus factor of one**, plus a fast release pace (four releases in October 2026): good for features, risky as a dependency of a product.
- **The Windows path is fragile:** WSL, USB passthrough, an AppImage that needs FUSE, and known mux errors with an iTunes-relay workaround.

## 5. The better route to independence: Expo's own

Today every device check is an EAS production build (7–23 min in our runs), then Apple's TestFlight processing, then a TestFlight install. Two things cause that:

- **No iPhone is registered** on team `Q885KHD85V` (`eas device:list`, 2026-10-30), so internal-distribution builds can't install.
- **`expo-dev-client` isn't installed**, although the `development` profile already exists in `eas.json`.

| Route | Who does what | Loop for a JS-only change | Loop for a native change |
|-------|---------------|---------------------------|--------------------------|
| Today | EAS production build, then TestFlight | A full build plus TestFlight processing | Same |
| xtool install | EAS build, then `xtool install` over USB from WSL | A full build plus a local install | Same |
| **EAS internal distribution** | **You**, once: `eas device:create` (open the link on the iPhone; an Apple sign-in). Then `eas build --profile preview` installs by link or QR code. | A full build, **no TestFlight wait** | Same |
| **Expo development client** | Once: add `expo-dev-client`, then one `eas build --profile development`. After that, run `npx expo start` on Windows; the iPhone loads the JS over Wi-Fi with Fast Refresh. | **Seconds**: no build at all | One new dev build |

**Recommended:**
1. **Register your iPhone** (`eas device:create`). It's an interactive Apple step, so it's yours.
2. **Add `expo-dev-client`** and make one development build. Design work (Stages C and D) then iterates on the real device in seconds instead of half an hour per look.
3. **Keep TestFlight for gates and release candidates** ([RELEASE.md](../process/RELEASE.md), [test strategy §5](../testing/TEST-STRATEGY.md#5-device-check-protocol)). That build is the exact artifact the App Store gets, which neither a dev client nor a re-signed install is.

## 6. When to look at xtool again

Revisit only if **both** of these become true:
- xtool can build an Xcode workspace with Hermes, the New Architecture and Expo modules (#144, #411), compile asset catalogs (#219), and upload (#327).
- Building no longer needs Apple's SDK on a non-Mac, or Apple's licence permits it.

The second is outside xtool's control, so for building, the answer is effectively *no* for as long as this is a commercial product.

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../CHANGELOG.md)
- [Documentation map](../README.md)
<!-- backlinks:end -->
