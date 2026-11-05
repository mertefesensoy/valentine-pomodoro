# Valentine Pomodoro: read this first

## App Review's answer on 1.4.1 comes first: DEF-009

1.4.1 (build 61) went in for review on 2026-11-05. It removes the unused `audio` background mode that App Review flagged on 1.4.0 under Guideline 2.5.4. **The fix is in the code (`5c2fe1c`), so don't redo it.**

New work can start while Apple reviews it (the owner, 2026-11-05). **If Apple answers about 1.4.1, that comes first:** tell the owner, and follow [the plan](docs/implementations/2026-11-03-def-009-background-audio-mode.md). No later version may declare `audio` in `UIBackgroundModes` either; `src/constants/__tests__/appConfig.test.ts` pins that.

Remove this section once App Review passes 1.4.1 (the plan's §6, last item).
