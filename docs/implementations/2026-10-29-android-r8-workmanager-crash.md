# 2026-10-29 — Android release build crashes on launch: R8 removed WorkManager's database constructor

**Status:** Fix committed; **not yet verified on a new build** (needs an EAS build, which needs your go-ahead)
**Branch:** `rehaul/v2`
**Found by:** the device check gate (upgrade doc §6.3; Phase 1 plan task A0)

---

## 1. Problem / Motivation

The SDK 58 Android preview APK (EAS build `3450a78b…`, versionName 1.3.1, R8 on) **crashes about 3 seconds after every launch**, before the first screen. Reproduced 3 times on an Android 15 emulator, the last time on a clean cold boot:

```
FATAL EXCEPTION: main
java.lang.RuntimeException: Unable to get provider androidx.startup.InitializationProvider:
  ... Failed to create an instance of class androidx.work.impl.WorkDatabase.canonicalName
    at androidx.work.WorkManagerInitializer.b(r8-map-id-02a656e3…)
```

**No user was affected.** This SDK 58 Android build was never released; the Play Store still has 1.0.1. But v1.4 would have shipped this crash to every Android user. It is the release-only R8 risk the upgrade doc named when it kept R8 on (upgrade doc §4), and it is exactly what the device-check gate exists to catch.

## 2. What Changed

| File | Change |
|------|--------|
| `app.json` | `expo-build-properties` → `android.extraProguardRules`: two R8 keep rules (§3). |
| `docs/implementations/2026-10-29-expo-sdk-58-upgrade.md` | §6.3 records the device-check result. |

## 3. Implementation Approach

**How the crash happens.**

1. WorkManager starts at process launch through AndroidX Startup's `InitializationProvider`. Here WorkManager is a transitive dependency: `work-runtime` 2.9.1, most likely through the Google Mobile Ads SDK.
2. WorkManager opens its Room database. Room 2.5.0 finds the generated class `WorkDatabase_Impl` by name and creates it **by reflection**: `Class.forName(...).newInstance()`.
3. No code calls that constructor directly, so R8 sees it as unused.
4. AGP 8+ runs R8 in **full mode** by default. In full mode a `-keep class X` rule keeps the class *name* but **not** its default constructor. Room 2.5.0's consumer rule is only `-keep class * extends androidx.room.RoomDatabase`, with no members.
5. So R8 removed the constructor. Reflection then fails, and Room reports it as "Failed to create an instance of …". The `.canonicalName` suffix is a string-template bug in Room's message, not part of the class name.

**Evidence from the APK itself.** A small dex parser (it reads `class_defs` and `class_data` from `classes*.dex`) shows:

| Class | Flags | Superclass | Direct methods |
|-------|-------|------------|----------------|
| `androidx/work/impl/WorkDatabase_Impl` | public final | `WorkDatabase` | **none, so no `<init>`** |
| `androidx/work/impl/WorkDatabase` | public abstract | `java/lang/Object` | `i` |

`RoomDatabase` itself was merged into `WorkDatabase` by R8's class merging, which is why `WorkDatabase`'s superclass is now `Object`. The bundled library versions come from the APK's `META-INF/*.version` files: `room-runtime` 2.5.0 and `work-runtime` 2.9.1.

**The fix.** Two keep rules, written into `android/app/proguard-rules.pro` by `expo-build-properties` at prebuild time (CNG):

```
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class * extends androidx.work.InputMerger { <init>(); }
```

- **The first rule fixes this crash.** It keeps the no-argument constructor of every Room database: WorkManager's, and any a future library adds.
- **The second rule closes the next crash in the same family.** WorkManager also creates `InputMerger` subclasses by reflection, by class name, when a worker with inputs runs. Its consumer rule has the same name-only shape.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Targeted keep rules | Turn R8 off (`android.enableMinifyInReleaseBuilds: false`) | Your instruction for a release-only crash was keep rules. R8 also shrinks the 108 MB universal APK. Turning it off stays available as a one-line fallback if more R8 crashes appear. |
| Rules match by supertype (`* extends …`) | Name only `WorkDatabase_Impl` | It covers every Room database and input merger, including ones a dependency upgrade adds later, and it survives renames. |
| Pre-empt the `InputMerger` case | Wait for it to crash | Same mechanism, same library, and no cost: the rule only keeps constructors that already exist. |
| Rules in `app.json` | Edit `android/app/proguard-rules.pro` | `android/` is generated and git-ignored (CNG). Only the config plugin's output survives a rebuild. |
| Leave Room and WorkManager at the versions the ads SDK pulls | Force newer Room/WorkManager in Gradle | Forcing versions under the AdMob SDK is riskier than a keep rule, and Phase 5 replaces AdMob 16 anyway. |

## 6. Verification

Done here:

- [x] The crash reproduces 3 out of 3 times on the emulator (Android 15, x86_64, AVD `vp_api35`). The crash log is in `C:\Android\devicecheck\logcat-crash.txt`.
- [x] Dex inspection confirms the missing constructor (table above).
- [x] A throwaway `npx expo prebuild --platform android --no-install` writes both rules into `android/app/proguard-rules.pro` inside the `expo-build-properties` block. R8 is on (`android.enableMinifyInReleaseBuilds=true`). The generated `android/` folder was deleted afterwards.

Needs a new build (EAS `preview` profile, **your go-ahead**):

- [ ] The new APK launches to the timer on the emulator; the crash buffer is empty.
- [ ] The dex parser shows `WorkDatabase_Impl` with an `<init>`.
- [ ] Then the rest of the upgrade doc's §6.3 list, which this crash blocked.

## 7. Related Docs

- [Expo SDK 58 upgrade](2026-10-29-expo-sdk-58-upgrade.md): §4 (why R8 stayed on), §6.3 (device checks)
- [Phase 1 plan](2026-10-29-phase1-plan.md): task A0
- Memory note: device checks run per task, not deferred to a backlog
