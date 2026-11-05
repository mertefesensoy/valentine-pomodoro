# Valentine Pomodoro: read this first

## Urgent, before any new job: DEF-009

Apple's review of 1.4.0 (build 59, 2026-11-03) flagged Guideline 2.5.4. The app declared `audio` in `UIBackgroundModes`, but nothing in it plays in the background. The key came from the `expo-audio` plugin's default, `enableBackgroundPlayback: true`. The owner asked Apple to approve 1.4.0 as it is, so **the next version submitted must not declare it**, or it will be rejected.

**The fix is in the code (`5c2fe1c`), so don't redo it.** Apple approved build 59, and 1.4.0 went live on 2026-11-04, so build 60 (also numbered 1.4.0) is retired and can't be used. Build 61 (version 1.4.1, `v1.4.1-tf.61`) carries the fix and is on TestFlight. It passed the owner's device check, and the owner submitted 1.4.1 on 2026-11-05. What's left is App Review's answer (see the plan's §6).

The owner's instruction (2026-11-03): no session starts on a new job before this is fixed. So, in every session, until the plan's checklist is ticked:
1. Read the plan: [docs/implementations/2026-11-03-def-009-background-audio-mode.md](docs/implementations/2026-11-03-def-009-background-audio-mode.md).
2. If its §6 isn't fully ticked, tell the owner that this comes first, and do the next unticked item, or ask them before starting anything else.

Remove this section once a version is submitted with the fix and App Review raises no 2.5.4 finding (the plan's §6, last item).
