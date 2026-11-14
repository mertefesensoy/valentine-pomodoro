# 2026-11-15 — 1.5.2: one note after each focus, and the ad that follows it (DEF-011)

**Status:** In progress. The code, tests and docs are committed, and the pull request is open. The merge, the TestFlight build, its device check and the submission remain ([§6.3](#63-release-steps-left)).
**Branch:** `fix/1.5.2-note-sheet-once`, cut from `e1fcb1e` (`master`, the merge of 1.5.1's fix)

---

## 1. Problem / Motivation

The owner reported this on 2026-11-15:

- They finished a focus and got a note from their partner. Then the app tried to show an ad, the ad failed, and the app opened the second note their partner had sent.
- When their partner has sent only one note, a second note from the app follows it. That doesn't look right: the partner's note alone is enough.
- "Ads not working is not a nice thing to have in the app."

**One defect causes all three, and it has been in every release since 1.4.0,** when Phase 1 D1 made the love note a native sheet (`635eb0a`). It is now DEF-011.

1. Closing the sheet opened it a second time. The second sheet showed:
   - the partner's next note, when they had sent two;
   - your own note, after a partner's only one;
   - your own note again, when not paired.
2. The interstitial was asked for between the two sheets, with the first sheet's route gone and the second push queued. **This much is observed** in Jest on the real router.
3. **Inferred from the native source, not seen on a device:**
   - On the phone, the first sheet is then still sliding away, and iOS doesn't present a new screen from one whose sheet is being dismissed.
   - The SDK reports that as an error, which matches the failure the owner saw.
   - A refused ad was dropped with nothing loaded in its place, so the next completion skipped the ad too.
4. Fly asked for its ad the same way, the moment a partner's note closed on landing. Fly never opened a second sheet, because it clears its landing flag before opening one.

The ad half had never been checked on a device either:

- Build 48's device check (D1 record, item 7: "the love-note sheet stays until it is closed, then the interstitial") was never ticked.
- The last device report of the interstitial working is from build 46, before the note became a sheet.

So even a single sheet closed with Close may have been taking its ad down with it since 1.4.0.

**What this record claims:** the double sheet is fixed, and tested on the real navigator. The ad is now asked for only once the sheet has had time to leave, which should let it show. Only the device check in [§6.2](#62-on-a-phone-the-owner-on-a-testflight-build-of-152) can confirm that.

**The owner's decisions, 2026-11-15:**

| # | Question | Answer |
|---|----------|--------|
| Q1 | Into 1.5.1's build, or a release after it? | **1.5.2.** 1.5.1 launched on 2026-11-15, so this is the next patch. |
| Q2 | With two partner notes waiting, what does one focus show? | **One per session**, as Phase 2 D3 designed: their first note now, the second after the next focus, and never your own in between. |

---

## 2. What Changed

| File | Change |
|------|--------|
| `src/screens/TimerScreen.tsx` | `sheetOpenedRef` opens the love-note sheet once per note due. The interstitial waits for `INTERSTITIAL_SETTLE_MS` of calm, which needs the Timer idle: neither running nor paused ([§3.3](#33-the-fix-in-the-timer), [§3.4](#34-the-interstitials-wait)). The ad effect moved below `idle`, which it reads. |
| `src/screens/FlyModeScreen.tsx` | Fly's interstitial waits `INTERSTITIAL_SETTLE_MS` too, after its existing conditions ([§3.6](#36-fly)). |
| `src/ads/AdConfig.ts` | New `INTERSTITIAL_SETTLE_MS = 800`, with the reason for it. |
| `src/ads/AdManager.ts` | The ad is spent as `show()` is called, and the show has its own pair of listeners. A refusal, by error event or rejected promise, isn't counted, and the next ad loads at once. The load's listeners go once it has loaded ([§3.5](#35-a-show-that-fails)). |
| `src/__tests__/router.test.tsx` | The existing love-note test now checks that the sheet stays shut after Close and that the ad waits. A new suite, "a partner's note on the real navigator", has two tests. |
| `src/ads/__tests__/adReadiness.test.ts` | New suite, "an interstitial that fails to show": an error after `show()`, a rejected `show()`, and a closed ad. |
| `src/screens/__tests__/timerScreenOverlays.test.tsx` | The ad checks wait for `INTERSTITIAL_SETTLE_MS`. Two new tests: a session started during the wait holds the ad until the next calm moment, and so does a session started, then paused. |
| `src/screens/__tests__/partnerNotes.test.tsx` | New: on landing a flight, the ad is asked for only `INTERSTITIAL_SETTLE_MS` after their note's sheet closes. |
| `package.json`, `package-lock.json`, `app.json` | The version goes to 1.5.2. |
| `CHANGELOG.md` | The fix under "Unreleased", written for users. It moves into `[1.5.2]` before the build (RELEASE.md §3). |
| `docs/srs/SRS.md` | DEF-011 in §3.4. FR-NTE-001 gets the deviation, an acceptance line and its new test. FR-ADS-001 gets the deviation, an acceptance line for the wait, and its tests and device check. |
| `docs/architecture/ARCHITECTURE.md` | The `TimerScreen` row and the `AdManager` paragraph say what 1.5.2 changed. |
| `docs/testing/TEST-STRATEGY.md` | The rows for the router, overlay and ad-readiness suites say what they now cover. |
| `docs/implementations/2026-11-15-v152-note-sheet-once.md` | This record. |
| `docs/README.md`, `docs/testing/TRACEABILITY.md`, backlink blocks | This record's row in the index, and the rest regenerated by `check-docs --write`. |

No native code, dependency, route, string or setting changed. The sheet store, the partner-note store and the session engine are untouched.

---

## 3. Implementation Approach

### 3.1 The cause, commit by commit

The Timer opens the sheet from an effect: when the note is due and the sheet's store holds no note, it hands the store a note and pushes `/love-note`. The route empties the store as it unmounts, and a subscription in the Timer then calls `dismissLoveNote()`. Since 1.4.0 the code has been:

```ts
const loveNoteDue = focused && !goalPopup && showLoveNoteCard && !!lastLoveNote;
useEffect(() => {
  if (!loveNoteDue || useLoveNoteSheet.getState().note !== null) return;
  // takes a partner's note if one waits, else your own; open; router.push('/love-note')
}, [loveNoteDue, lastLoveNote]);
```

The sheet sits over the tabs in the root stack, so while it is up the Timer isn't focused (`useScreenFocused()` is false). This is what happens when Close is pressed:

| Step | What runs | `focused` | `showLoveNoteCard` | The store's `note` |
|------|-----------|-----------|--------------------|--------------------|
| 1. Close | `router.back()` is queued; the router's drainer applies it in an effect | false | true | the first note |
| 2. Commit C1: the route is popped | The tabs are focused again **in the same commit** that unmounts the route (native-stack renders `state.routes` as they are) | **true** | true | the first note |
| 3. C1's passive cleanups | The route's cleanup runs `close()`, and the store's `note` is now null. The subscription calls `dismissLoveNote()`, which only *schedules* `showLoveNoteCard = false` | true | true (this render's value) | **null** |
| 4. C1's passive effects | The Timer's effect re-runs, since `loveNoteDue` went from false to true. The note looks due, and the store looks empty. **It takes the next note and queues a second push** | true | true | the second note |
| 5. Render R2 | `showLoveNoteCard` is false. The push is still queued (expo-router's `RoutingQueueDrainer` applies it in R2's effects), so the Timer is still focused | true | false | the second note |
| 6. R2's effects | The ad effect sees no overlay and the Timer in front, and calls `AdManager.showIfReady`. The drainer then applies the push | true | false | the second note |
| 7. On the phone (inferred from the source, not seen) | `show()` reaches the SDK while the first sheet is still being dismissed. `RNGoogleMobileAdsCommon.currentViewController` skips a controller being dismissed, so the ad is presented from the root, which is still presenting. iOS doesn't allow that, so the SDK should report it as `ERROR`, which matches what the owner saw. Then react-native-screens presents the second sheet | | | |

React runs every passive cleanup in a commit before any passive effect in it, which is what makes step 3 come before step 4. The second note comes from:

- `takePartnerNote()`, which moves your partner's next note into `shown`;
- or, with none left, `lastLoveNote`, which is your own.

The failed ad is then lost:

- Before 1.5.2, the load's `ERROR` listener stayed subscribed after `LOADED`, so the refusal reached it. It cleared the ad and loaded nothing.
- The next completion's `showIfReady` found no ad, skipped, and only then preloaded.
- The policy wasn't reset, because `recordAdShown` runs on `CLOSED` only. So the ad was due again, but none was ready.

**Reproduced before the fix,** in `router.test.tsx` on the real `app/` routes:

- After Close, the pathname was `/love-note` again.
- `showIfReady` was called while the pathname was `/` and the store already held the next note.

### 3.2 Why the tests didn't catch it

- **The overlay suites can't see it.** `timerScreenOverlays.test.tsx` and `partnerNotes.test.tsx` render the Timer outside a navigator, where `useScreenFocused()` is always true. `loveNoteDue` then never changes when the sheet closes, so the effect never re-runs.
- **The router test drove the right flow but checked the wrong thing.** `router.test.tsx` has driven this exact flow since B6. It asserted only that the ad was asked for once, which it was, while a second sheet was opening.

### 3.3 The fix in the Timer

**`sheetOpenedRef`** (`TimerScreen.tsx:217–238`) is a latch. It says whether the sheet has been handed this completion's note.

- **Set:** as the effect hands the store a note and pushes the route.
- **Cleared:** in the same effect, whenever `showLoveNoteCard` is false. That is the note's dismissal, a skip or a reset. `showLoveNoteCard` is now a dependency, so the clearing runs on the render where it turns false.
- **Guard:** `if (!loveNoteDue || sheetOpenedRef.current || store.note !== null) return;`. The store's check stays, so a sheet opened by someone else still holds the Timer's note back. That covers the Notes tab's preview, the partner's sheet and Fly's landing.
- **Invariant:** between one completion's note becoming due and its dismissal, the Timer pushes `/love-note` at most once.

The ref is the only thing that can hold this in commit C1:

- The store is already empty there.
- `showLoveNoteCard` is still true there.
- A ref written in an effect is read by the next effect in the same flush, without waiting for a render.

### 3.4 The interstitial's wait

The ad effect (`TimerScreen.tsx:280–299`) now asks for the ad only after the Timer has been **calm** for `INTERSTITIAL_SETTLE_MS`.

**Calm means:**

- a request is unserved (`adRequests > adsServedRef.current`);
- the Timer is focused;
- the Timer is idle (`idle`: neither running nor paused, the same flag the welcome and the tour wait for);
- no goal moment or note is due.

**What it does:** when calm begins, the effect starts a timer. When the timer fires, it marks the requests served and calls `AdManager.showIfReady`.

**Anything that ends the calm** clears the timer through the effect's cleanup: leaving the tab, a sheet coming up, starting a session. The request is still unserved, so the next calm moment starts the wait again.

**A session started during the wait holds the ad,** and so does pausing it, since a paused session isn't idle. The ad never covers a running or paused session.

**When the held ad shows:** once the Timer is idle again, after the same wait. The policy is checked again inside `showIfReady` at that point.
- **The session runs to its end.** This is usually the break's end.
- **Reset:** with its confirmation, it leaves the phase idle, so the ad follows about a second later.
- **Skip:** it moves to the next phase, idle, so the ad follows the same way.

The first version of this fix guarded on `isRunning`, which let a paused session through. The paused test in the overlay suite fails against that guard and passes against `idle`.

### 3.5 A show that fails

**`AdManager.showIfReady(onClose)`** (`AdManager.ts:91–136`):

- **In:** `onClose`, which runs exactly once, whatever happens.
- **Out:** true when `show()` was called. False when the ad was skipped (the policy said no, or no ad was loaded); `onClose` has run by then, as before.
- **Side effects, which are new:**
  - The ad is spent as `show()` is called: `_interstitial` and `_isLoaded` are cleared first.
  - The show adds its own `CLOSED` and `ERROR` listeners, and a `finish` that runs once and removes both.
  - **Closed:** `AdPolicy.recordAdShown()` runs, then `onClose`, and the next ad loads 1 s later, as before.
  - **Refused** (an `ERROR` event, or a rejected `show()` promise, which the old `try/catch` couldn't catch): the ad isn't counted, `onClose` runs, and the next ad loads at once.

**`preload()`** now removes its `LOADED` and `ERROR` listeners together, once the ad has loaded or failed to. An error after `show()` therefore reaches the show's listener alone. It only clears `_interstitial` if that is still its own ad.

**The cost of a refusal drops from two chances to one.** The policy still says yes at the next completion: sessions ≥ 2 since the last ad seen, and ≥ 120 s since it. By then a new ad has had a whole session to load.

**A limit:** the recovery runs only if the SDK reports the refusal, as an `ERROR` event or a rejected `show()`. Its source does so through `didFailToPresentFullScreenContentWithError`, but that path hasn't been seen on a device. If a refusal were silent, the ad would be spent with nothing loading until the next `showIfReady`, which would skip and then preload, as before 1.5.2. The device check covers this ([§6.2](#62-on-a-phone-the-owner-on-a-testflight-build-of-152)).

### 3.6 Fly

**What Fly does on landing:**
- A partner's note goes to the same `/love-note` sheet. Your own note is a card inside Fly's screen, not a native presentation.
- Fly's ad effect (`FlyModeScreen.tsx:643–661`) already waited for the card, the landing flag and the sheet.
- As the sheet's store emptied, the ad was asked for at once, while the native sheet was still leaving. That is the same timing as the Timer's.

**The fix:** after its existing conditions hold, Fly now waits `INTERSTITIAL_SETTLE_MS` the same way. Any change to them clears the wait, and the request is marked served when the ad is asked for.

**Fly never opened a second sheet:** its landing effect clears `landingDue` before taking the note.

**Every caller is covered:** Fly and the Timer are the only callers of `showIfReady`, by a search of `src/`.

---

## 4. Mathematical / Statistical Details

**The order within one commit.** React runs a commit's passive effects in two passes: every destroy function in the tree first, then every create function. So:

> close() at the route's unmount → effect re-runs with `loveNoteDue` = true

The latch turns that from "open again" into "do nothing".

**The wait.** Let *t₀* be the moment the Timer becomes calm, *S* = `INTERSTITIAL_SETTLE_MS` = 800 ms, and *d* the time iOS takes to animate a form sheet away after its route is popped.

- The ad is asked for at *t₀ + S*, provided the calm holds over [*t₀*, *t₀ + S*).
- If the calm breaks at any point in that interval, the next calm moment *t₁* starts the wait again, and the ask moves to *t₁ + S*.
- The presentation succeeds when *S > d*.

*d* hasn't been measured. UIKit's default sheet dismissal is a spring of roughly 0.3–0.5 s. Its exact length isn't documented and depends on the device and on Reduce Motion. So 800 ms is about 1.6–2.7 times the expected *d*.

Two cases don't need the wait:

- **A swipe-down:** the native dismissal has already finished when the router hears of it, so for a swipe *d* = 0 and the wait is slack.
- **Love notes off:** no sheet was up, so the ad simply comes *S* later than before.

The frequency rules are unchanged. An ad is due when `sessionsSinceLastAd ≥ 2` and `now − lastShownAt ≥ 120 s`. A refused show leaves both values as they were, so the ad is due again at the next completion. Only a closed ad resets them.

---

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A latch ref in the Timer | Clear `showLoveNoteCard` as the sheet opens | The welcome gate, the tour gate and the ad effect all read `showLoveNoteCard` as "a note is pending". Clearing it early would let them run while the sheet is still up or leaving. |
| | An "opened" flag in the sheet store | Four callers share that store: the Timer, Notes' preview, the partner's sheet and Fly. The question "did the Timer open this completion's note" belongs to the Timer. |
| | Keep the route's `close()` until the next frame | That only moves the race, and every sheet closing would depend on frame timing. |
| A fixed wait before the ad | Wait for the sheet's native `transitionEnd` or `onDismissed` | When the route is popped from JS, its scene unmounts in the same commit, so no event reaches JS after the native animation ends. A form sheet's presenter gets no appearance callback either. |
| | Patch the SDK's iOS `show` to wait on the `transitionCoordinator` | That is the most exact fix, but it is native code that can't be built or run here (Windows, no Mac, CON-004), and a patch to carry through every SDK update. If the device check shows the wait is too short, this is the next step. |
| | Show the same ad again after a refusal | The SDK treats an interstitial as one-time use. Whether one that failed to present can present again isn't documented, so the fix loads a new one instead. |
| 800 ms | 400–500 ms, or 1.5 s and longer | It is longer than the expected dismissal with margin ([§4](#4-mathematical--statistical-details)), and still reads as part of the same moment after the note. A short beat between someone's note and an ad is no loss. |
| Calm needs `idle`, not just "not running" | `!isRunning` | A paused session isn't running, so `!isRunning` would let the ad cover a paused session. `idle` is the screen's own flag for "nothing in progress". |
| The same wait in Fly | Leave Fly as it was | Fly's partner note is the same native sheet, so its ad has the same timing. |
| The wait applies after every calm, not only after a note | Wait only when a sheet was shown | Any sheet over the Timer can be leaving when the Timer gets its focus back: the Modes sheet, the partner's sheet, pairing, the editor. One rule covers them all, and there's no state to track. |
| A session started (or paused) during the wait holds the ad | Drop the request | Holding it keeps the meaning of "an ad after a completed session", and the ad still never covers a running or paused session. Dropping it would also be safe, so the choice is open to the owner. |
| One partner note per completion | Every waiting partner note in a row | The owner's decision (Q2), and D3's design: a partner's note takes the place of your own. |
| Ship as 1.5.2 | Rebuild 1.5.1 | The owner's decision (Q1): 1.5.1 launched on 2026-11-15. |

**Found in passing, not changed:** the Timer's subscription dismisses its pending note when *any* sheet empties the store.

- **Example:** a focus ends while you're on the Notes tab, and you preview a note there. Closing the preview dismisses the Timer's note, so it never shows.
- **How bad:** a minor loss, unreported, and older than this defect.
- **What it would take:** the latch is the natural place to fix it, by dismissing only a sheet the Timer opened, but that changes behaviour the owner hasn't asked about.

---

## 6. Verification

### 6.1 Automated (done, 2026-11-15)

- [x] **The reproduction, before the fix.** A probe in the existing router test logged:
  - after Close, the pathname was `/love-note` and Close was on screen;
  - the ad was asked for at `/`, with the next note already in the sheet's store.
  
  The probe was then removed.
- [x] **The new tests fail first.** Before the fix:
  - the three router tests failed on `expect(pathname).toBe('/')` (received `/love-note`);
  - `adReadiness.test.ts` crashed Node with the unhandled `show()` rejection;
  - Fly's new ad test in `partnerNotes.test.tsx` failed: the ad was asked for at once on Close (1 call, expected 0).
- [x] **After the fix:**
  - `npx jest src/__tests__/router.test.tsx src/screens/__tests__/timerScreenOverlays.test.tsx src/screens/__tests__/partnerNotes.test.tsx` passes 42 of 42, with the overlay suite at 5 of 5;
  - `adReadiness.test.ts` passes 8 of 8.
- [x] **Mutation checks.** Each was applied, run and restored, and a search of the file confirmed the restore.

  | Mutation | Result |
  |----------|--------|
  | `sheetOpenedRef.current ||` removed from the guard | the three router tests fail again |
  | The ad's guard and dependencies back to `isRunning` | the overlay suite's paused test fails: the ad was asked for during the pause |
- [x] **The full checks:**
  - `npx tsc --noEmit`: passes.
  - `npx expo lint`: 0 errors and 31 warnings. In the changed files there are two warnings, both older than this change (an unused `useUiStore` import in `router.test.tsx`, and an unused `TestIds` import in `AdManager.ts`).
  - The full `npx jest`: **92 of 92 suites, 972 of 972 tests**, in one run after the last code change (970 of 970 before the paused and Fly tests).
- [x] **The bytecode (NFR-PERF-002),** by 1.5.1's method (`npx expo export --platform ios --dump-sourcemap`), on this tree:

  | Build | iOS `.hbc` |
  |-------|-----------:|
  | 1.5.1, as [its record](2026-11-12-v151-screen-sleep-fix.md#64-the-full-checks) measured it | 4,605,860 B |
  | This branch, before the `idle` guard and Fly's wait | 4,606,668 B |
  | This branch, final | 4,606,844 B |

  - **Cost:** 984 B.
  - **Headroom:** 33,156 B under the 4,640,000 B ceiling.
  - **Caveat:** 1.5.1's figure is that record's, not a fresh measurement on this machine. Its method reproduced 1.5.0's figure exactly.
- [x] `node scripts/docs/check-docs.mjs --write`, then `node scripts/docs/check-docs.mjs`: results in [§6.4](#64-the-docs-check).

### 6.2 On a phone (the owner, on a TestFlight build of 1.5.2)

**Set up first:**

- **Focus:** set it to 1 minute in Settings, and keep Show love notes on.
- **The ad's rules:** the interstitial needs 2 completed focus sessions since the last ad seen, and 2 minutes since it.
- **Don't tap the ad:** TestFlight builds use the real ad units, and AdMob's policies forbid tapping your own ads. Look at it and close it.

None of these has been run yet.

- [ ] **Alone, Close:** finish a focus and close the note with Close. No second sheet opens. Do it a second time: about a second after the note has gone, the ad appears.
- [ ] **Alone, a swipe:** the same, closing the note with a swipe down.
- [ ] **One note from your partner:** your partner sends one note. After your focus it shows, titled with their name. Close it: no note of your own follows.
- [ ] **Two notes from your partner:** after your focus, their first note shows. Close it: nothing else opens. After your next focus, their second note shows.
- [ ] **A session started quickly:** close the note and tap Start break within a second. No ad covers the break. It comes about a second after the break ends, with the Timer in front. The same holds if you pause the break: no ad over a paused session.
- [ ] **Fly, with a note from your partner:** land a flight with their note waiting, with the ad due. Close the note: the ad appears about a second later.
- [ ] **Love notes off:** with the ad due, it appears about a second after the focus ends, or after the goal moment.
- [ ] **If no ad appears** when one is due after a note closed with Close:
  - Finish one more focus. If the ad shows then, the refusal was reported and the next ad was loaded at once, as [§3.5](#35-a-show-that-fails) intends.
  - If it doesn't, the refusal was silent, or no ad loaded at all.
  - Either way, `INTERSTITIAL_SETTLE_MS` is too short for this phone. Report the device and iOS version; the native wait in [§5](#5-design-decisions) is then the next step.

### 6.3 Release steps left

1. [x] **The commit,** on the owner's "Commit and open PR" (2026-11-15). The working tree also holds the Mac version audit's uncommitted edits: `docs/README.md`, `docs/process/RELEASE.md`, `docs/roadmap/ROADMAP.md`, `docs/srs/SRS.md`, `docs/testing/TEST-STRATEGY.md`, `docs/testing/TRACEABILITY.md`, and the untracked audit. Its lines must stay out of this commit.
   - This record's hand-made lines are separate hunks.
   - The generated backlink lists in `RELEASE.md` and the SRS put this record's line right after the audit's.
   - So the commit's tree was built from `e1fcb1e` with this change's files and hunks alone, and `check-docs --write` ran there (§6.4). The audit's edits stay uncommitted in the working tree, on top of this commit.
2. [ ] `CHANGELOG.md`: "Unreleased" becomes `## [1.5.2] - <the build date>`, the planned EAS production build date (RELEASE.md §3).
3. [ ] **The build:** the EAS production build from `master` after the merge, with the owner's go-ahead. Then TestFlight, the device check in §6.2, and the tags `v1.5.2-tf.N`, `v1.5.2-submitted` and `v1.5.2` (RELEASE.md §2).
4. [ ] **The owner:** in App Store Connect, the 1.5.2 version with the "What's New" text and the review notes below, then submit for review.
5. [ ] `update.json` stays at 1.3.1, because Android reads it.

**"What's New" for 1.5.2,** for the owner to edit. Store text for a patch goes here rather than through the copy proof, as it did for 1.4.1, 1.4.2 and 1.5.1. The ad fix is left out of it.

- **English:** After a focus you now see one love note, not two. If your partner has sent you more than one, the next arrives after your next focus.
- **Türkçe:** Odaklanmadan sonra artık iki değil, tek bir not görüyorsun. Partnerin sana birden fazla not gönderdiyse, sıradaki bir sonraki odaklanmandan sonra gelir.

**App Review notes for 1.5.2.** Keep the existing notes (the review partners, sign-in) as they are, and put this at the top:

> Version 1.5.2 fixes two bugs after a focus session. Closing the love note could open a second note at once, and the interstitial ad was requested while that note's sheet was still closing, when it could fail to appear. The ad is now requested a moment after the note has closed. There are no new permissions, no background modes and no new data collection.

### 6.4 The docs check

On 2026-11-15, on this tree (which also holds the Mac audit's uncommitted files):

- **Before `--write`:** 5 errors, all "out of date": `TRACEABILITY.md`, and the backlink blocks of B6, D1, `RELEASE.md` and the SRS, which now link to this record.
- **`--write`:** 5 backlink blocks rewritten.
- **The check after it:** **185 docs, 108 requirements, 0 errors.**

**On the commit's own tree,** built in a temporary worktree from `e1fcb1e` with this change's files and no line that names the Mac audit (§6.3, step 1):

- **Before `--write`:** 3 errors: `TRACEABILITY.md` and the B6 and D1 backlink blocks.
- **`--write`:** 3 blocks rewritten.
- **The check after it:** **184 docs, 108 requirements, 0 errors.**
- **What differs from the working tree:** each shared doc differs from the working tree's copy only by the audit's own lines, one per file, and the CON-004 row in `TRACEABILITY.md`. No committed file names the audit.

---

## 7. Related Docs

- [SRS](../srs/SRS.md): DEF-011 in §3.4, FR-NTE-001, FR-NTE-003 and FR-ADS-001.
- [Phase 1 D1: Classic](2026-10-30-phase1-d1-classic.md): the love note becomes a native sheet, and its unticked device check item 7.
- [Phase 2 D3: notes to your partner](2026-11-06-phase2-d3-notes.md): one partner note in place of your own, after their next focus.
- [Phase 1 B6: Expo Router](2026-10-30-phase1-b6-expo-router.md): the focus hooks and the router test.
- [1.5.1: the screen stays on while a session runs](2026-11-12-v151-screen-sleep-fix.md): the previous patch, and the bytecode figure compared here.
- [Release process](../process/RELEASE.md).
