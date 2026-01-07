# Phase 4 Testing Guide - iPhone Required

**Objective**: Verify timer + notifications work correctly on real iPhone (iOS notifications don't work in simulator)

---

## Pre-Test Setup

1. Open `src/types/index.ts`
2. Temporarily change DEFAULT_SETTINGS:
   ```typescript
   export const DEFAULT_SETTINGS: Settings = {
     durations: {
       focus: 0.1,        // 6 seconds (was 25)
       shortBreak: 0.1,   // 6 seconds (was 5)  
       longBreak: 0.1,    // 6 seconds (was 15)
     },
     longBreakEvery: 4,
     notifications: true,
     sound: true,
     haptics: true,
     showLoveNotes: true,
   };
   ```
3. Save file (hot reload will update)
4. **Reset app data**: In Settings screen, tap Reset (or force-close+reopen to clear AsyncStorage)

---

## Test A: Foreground Completion ✅

**Steps**:
1. Open Timer tab
2. Tap **Start**
3. Keep app in foreground
4. Wait 6-7 seconds

**Expected** ✅:
- Notification alert appears (foreground handler)
- Phase advances to "Short Break"
- Timer shows "00:06" and is **not running**
- Stats increments by 1 focus session
- No double-increment (idempotency check working)

**Fail if**:
- Stats increments twice
- Timer auto-starts next phase
- No notification

---

## Test B: Background Completion ✅

**Steps**:
1. Tap **Start** on Timer
2. **Immediately** background the app (swipe up)
3. Wait 6-7 seconds
4. Return to app

**Expected** ✅:
- Notification appeared while backgrounded
- On return, phase = "Short Break"
- Timer shows "00:06" and is **not running**
- Stats increments once (only once, not double)
- `remainingMs` correctly recomputed on resume

**Fail if**:
- Phase didn't advance
- Stats incremented twice
- Timer still shows "Focus" phase

---

## Test C: Pause Cancels Notification ✅

**Steps**:
1. Tap **Start**
2. Wait 1-2 seconds
3. Tap **Pause**
4. Background app
5. Wait 10 seconds (notification should NOT fire)
6. Return to app

**Expected** ✅:
- **NO** notification fired
- Timer still paused at ~4-5 seconds remaining
- Phase still "Focus"

**Fail if**:
- Notification fired even though paused

---

## Test D: Kill App + Reopen (Critical Edge Case) ✅

**Steps**:
1. Tap **Start** on Timer
2. **Immediately force-close** the app (swipe up, swipe app away)
3. Wait 10 seconds
4. Reopen app

**Expected** ✅:
- On cold start, timer detects `endAt < now`
- Phase advances to "Short Break" **exactly once**
- Stats increments once (if focus completed)
- Timer shows "00:06" and is **not running**

**Fail if**:
- Phase didn't advance (still shows "Focus")
- Stats didn't increment
- Timer is stuck in weird state

---

## Test E: AppState Resume with Remaining Time ✅

**Steps**:
1. Tap **Start**
2. Wait 2 seconds
3. Background app (but don't wait for session to complete)
4. Wait 2 more seconds (total 4s, still 2s remaining)
5. Return to foreground

**Expected** ✅:
- Timer shows ~2 seconds remaining
- Still in "Focus" phase
- `remainingMs` correctly recomputed
- Session has NOT completed yet

**Fail if**:
- Timer shows wrong remaining time
- Phase advanced prematurely

---

## After Testing

1. **Restore default durations** in `src/types/index.ts`:
   ```typescript
   durations: {
     focus: 25,
     shortBreak: 5,
     longBreak: 15,
   },
   ```
2. Save file
3. Commit if all tests pass:
   ```bash
   git add -A
   git commit -m "Phase 4 verified: notifications + backgrounding work correctly"
   ```

---

## Common Bugs to Watch For

- **Double completion**: Stats increments twice (tick + AppState both trigger)
  - ✅ Fixed with `lastHandledEndAt` idempotency check
- **Missed completion**: Kill app, phase doesn't advance on reopen
  - Check AppState listener detects `remainingMs <= 0`
- **Stale notification**: Pause, notification still fires later
  - Check `cancelScheduled()` is awaited properly

---

## If Any Test Fails

**Stop and report**:
- Which test failed (A, B, C, D, or E)?
- What was the actual behavior vs expected?
- Check console logs for errors

**Don't proceed to Phase 5** until all tests pass.
