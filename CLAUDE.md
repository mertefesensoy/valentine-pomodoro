# Valentine Pomodoro: read this first

Nothing is urgent right now. **1.5.0 (build 64) is live** since 2026-11-10, on Supabase's Free plan by the owner's choice, so the project can pause after a week without activity ([F5's record](docs/implementations/2026-11-07-phase2-f5-submission.md)). Phase 2's plan is [here](docs/implementations/2026-11-05-phase2-plan.md), and the paper plane's flight waits for a later build. No version may declare `audio` in `UIBackgroundModes`; `src/constants/__tests__/appConfig.test.ts` pins that (DEF-009, closed).

**Android is back, for Google Play's closed test (2026-11-25).** The [plan](docs/implementations/2026-11-25-android-closed-test-plan.md), [build 1's record](docs/implementations/2026-11-25-android-build1.md) and the [Play Console sheet](docs/implementations/2026-11-25-android-play-listing.md) cover it. On Android:
- pairing and the start-up reports are off (`isPairingAvailable`, iOS only), until Sign in with Google;
- ads use Google's test ids for the whole closed test;
- session alerts are exact alarms (`plugins/withExactAlarms.js`, DEF-012).

Every Android-only change keeps iOS as it is. Check that with the introspected iOS config, and on the emulator (`C:\Android`, AVD `vp_api35`).
