---
id: IMPL-2026-11-01-phase1-stage-e
title: "Phase 1 Stage E: verify and ship v1.4.0"
status: in-progress
date: 2026-11-01
owner: Mert Efe Şensoy
related: [IMPL-2026-10-29-phase1-plan, IMPL-2026-10-30-phase1-stage-d, IMPL-2026-11-01-phase1-d5-tutorial, RELEASE, BRANCHING, SRS]
---

# 2026-11-01 — Phase 1 Stage E: verify and ship v1.4.0

**Status:** In progress.
- **S1 done** (2026-11-01): build 58's device check passed, visual and sound ("All visual tests are passed", "Yes, sounds passed").
- **D5's verdict: ship** (2026-11-01). The finish review's captures were waived ("Skip, as in D2"), so the device check stands as the verdict.
- **The owner's answers, 2026-11-02:**
  - the merge: "do it";
  - closing Stage D: "we can close it";
  - E1: "there was no valuable data in any way so this is also check";
  - the release candidate: "go for it";
  - the listing: "yes walk me through that".
- **S2 and S3 done** (2026-11-02): DESIGN.md and `.impeccable/design.json` record D3–D5 (the tour's motion row, its four tokens and its components; the sounds; the language choice), and every Stage D record says Done.
- **M1 done** (2026-11-02): `phase1/stage-d` merged into `rehaul/v2` as `96ce9dd`, with `rehaul/v2` as first parent (§3.6).
- **M2 done** (2026-11-02, `ad86dc3`): the Stage D plan's §9 and the D4 record's §10 applied to the shared docs, each brought to its final state. SRS 1.1 adds FR-ONB-001 and FR-ONB-002 (implemented for v1.4) and marks FR-SET-002, FR-SET-004, FR-SET-005, FR-NTE-002, NFR-UX-003 and NFR-I18N-001 implemented.
- **E3, in part** (2026-11-02): Reassure meets F1's criterion, settings-only 14 → 1 (§4); the bytecode is measured (§4). The cold-start TTI waits for the release candidate, and the bytecode decision is the owner's, with it.
- **E4 done** (2026-11-02):
  - CHANGELOG: `[1.4.0] - 2026-11-02`, opening with a list for users, then the engineering record and entries for TestFlight builds 48–58;
  - DECISIONS.md: Q1–Q3 closed;
  - the Phase 1 exit criteria checked in the [Phase 1 plan](2026-10-29-phase1-plan.md);
  - DESIGN.md current (`0194c8a`);
  - the ROADMAP's stale Stage C row closed;
  - the SRS's release-scope row brought up to date.
  
  `app.json` and `package.json` say 1.4.0, and EAS numbers the build remotely (`appVersionSource: remote`, `autoIncrement`).
- **R1 done** (2026-11-02): build 59, the release candidate (§3.8).
  - It went to TestFlight automatically.
  - Tagged `v1.4.0-tf.59` on `bce65cc`, and the tag is pushed.
  - On it, E2's checklist, the cold-start TTI and the light splash are the owner's to check.
- **`rehaul/v2` pushed** (2026-11-02, the owner: "Yes, push it"): `git push origin 5620d33:refs/heads/rehaul/v2`, a fast-forward from `3aba394` (151 commits). CI run 41393398703 passed: typecheck, lint, unit tests, the contrast check and the docs check.
- **E2 done** (2026-11-02): build 59's device check passed. The owner's answer to "Has build 59's device check passed, so 1.4.0 can be submitted on it?" was "Yes, it passed". That covers E2's checklist (§3.3) and the choice-C light splash (§3.6) on the build that ships. The cold-start TTI from the hidden panel isn't recorded yet, and E3's bytecode decision waits for it: submitting build 59 ships the bytecode at 4,287,144 B unless the owner chooses to trim it first.
- **R2 and R3 done** (2026-11-02): the owner filled App Store Connect from the listing page (§3.5) in English (U.S.) and Turkish, chose build 59 and submitted 1.4.0. App Store Connect then showed "1 Item Submitted" and the version "Waiting for Review"; the owner wrote "perfect it is done! everything is fixed".
  - The first Save was refused (a red "!"). Two gaps in the listing page were fixed in it before the save went through: a new localization starts with empty Support and Marketing URLs, and the large-iPhone screenshot set (6.9", the `1320x2868` files) has no tab on the version page, only in Media Manager. Without that set, English's large iPhones would also have kept 1.3.1's screenshots.
  - Next, on approval: R4 (`master` fast-forwards to `rehaul/v2`, tag `v1.4.0`, the GitHub Release), R5 (`update.json`) and R6 (close-up, with NFR-PERF-002's amendment), each on the owner's word. The cold-start TTI is still to be recorded.
- **R3: App Review's answer** (2026-11-03). Submission `af77109e-129d-4d43-b550-afb0860fc3a7`, 1.4.0 (59), reviewed on an iPad Air 11-inch (M3).
  - The finding: Guideline 2.5.4. `UIBackgroundModes` declares `audio`, and Apple found no feature that needs persistent audio.
  - Apple offered to approve now, since the version includes bug fixes, with the issue resolved in the next update; or a fix and a resubmission.
  - The cause is `expo-audio`'s plugin default, and the app plays nothing in the background ([DEF-009](2026-11-03-def-009-background-audio-mode.md)).
  - The owner chose "Ask Apple to approve", and sends the reply below in App Store Connect. They also asked to "document this as an urgent fix so any other new seassion does not start on a new job before fixing this issue". So DEF-009's record, `CLAUDE.md` and the project memory put it first, and **the next version submitted, 1.4.1, must remove the key**.

  > Hello, and thank you for the review. Version 1.4.0 includes bug fixes, so we'd like it approved at this time, please. The app has no feature that needs persistent background audio. The "audio" entry in UIBackgroundModes was added by default by our audio library's configuration, and the app's sounds stop when it moves to the background. We will remove the "audio" setting from UIBackgroundModes in our next update. Thank you!
- **R3 done: 1.4.0 is live** (found 2026-11-05). The owner: "wait but 1.4.0 is already live". The public App Store lookup confirms it in both the US and Turkish storefronts: version 1.4.0, released 2026-11-04T14:45:37Z. Apple accepted the reply and approved build 59, the only build ever submitted. So build 60 is retired, and the fix ships as 1.4.1 ([DEF-009's record](2026-11-03-def-009-background-audio-mode.md)). R4–R6 are still to do.
- **1.4.1 submitted** (2026-11-05, the owner: "Submitted"), on build 61, with `v1.4.1-submitted` on `4c39732`. It removes the entry behind App Review's finding ([DEF-009's record](2026-11-03-def-009-background-audio-mode.md)).
- **A featuring nomination** went in on 2026-11-04, the day 1.4.0 went live ([record](2026-11-04-featuring-nomination.md)).
- **R4 done** (2026-11-05, the owner: "Yes, go ahead"). `v1.4.0`, annotated, on `bce65cc`, pushed by name. The GitHub Release is https://github.com/mertefesensoy/valentine-pomodoro/releases/tag/v1.4.0, with the CHANGELOG section as its notes and its relative links made absolute. `master` had already moved at M3. The tag rests on build 59 being the only build ever submitted (the owner: "i did not submit yet").
- **The docs for R4–R6 are on `master`** through [pull request #2](https://github.com/mertefesensoy/valentine-pomodoro/pull/2) (`4c39732`), the first pull request under BRANCHING.md's rules, together with 1.4.1's version bump.
- **R6, in part** (2026-11-05): the ROADMAP's milestone and status, the release date in the CHANGELOG, NFR-PERF-002 amended to 4,292,868 B, the READMEs, and RELEASE.md and BRANCHING.md. **`rehaul/v2` is deleted** (2026-11-05, on the owner's word), here and on GitHub. Its last commit, `c184337`, is on `master`, and the main checkout is now on `master`. **Left:** B7's cold-start TTI, which the owner hasn't sent.
- **R5 skipped** (2026-11-05), covered by the owner's "Yes, go ahead": the question said it included skipping this step. Setting `latestVersion` to 1.4.0, as planned, would show Android users on 1.3.1 an update that doesn't exist, because Android reads `update.json` (`src/hooks/useUpdateCheck.ts`) and stays on 1.3.1. iOS doesn't need the change:
  - from 1.3.1 on, iOS asks Apple's lookup, which now answers 1.4.0;
  - iOS 1.0.3–1.3.0 reads `update.json`, is already prompted by its 1.3.1, and its link opens the App Store, which now serves 1.4.0.

  So `update.json` stays at 1.3.1 until Android ships a newer version, and RELEASE.md step 12 now says so.
- **R3's fallback, build 60** (2026-11-04). Apple hadn't answered the reply after about 20 hours, and the owner said "Yes, start build 60": the fix (`5c2fe1c`), built as version 1.4.0 so that it fits the rejected version. Uploading it doesn't touch the submission until the owner attaches it. If Apple approves build 59 first, the fix ships as 1.4.1 instead ([DEF-009's record](2026-11-03-def-009-background-audio-mode.md) §3). The build is in §3.10.
- **M3 and the push** (2026-11-02/03), on the owner's "push and merge everything and tag the latest version as submitted". Asked about `master`, they chose "Now"; asked about the tag, "v1.4.0-submitted (Recommended)". The work is in §3.9.
- **A correction to E3's bytecode figure** (2026-11-05). The 4,287,144 B below was measured at `eaf9e2a`, build 58's code, before the merge. `bce65cc`, the source of the build that shipped, measures **4,292,868 B**, +436,660 B or **11.32 %** over the old ceiling (Android 4,292,376 B), with the same pinned command. The extra 5,724 B came in with the merge, which includes the regenerated choice-C mark. The owner's decision stands, and NFR-PERF-002 is amended to the shipped figure.
- **E3's bytecode decision: accepted** (2026-11-02). The question was "Ship build 59 with the app code 11 % over its size limit, or trim it first?". The owner answered "Ship build 59". So 1.4.0 ships the iOS bytecode at 4,287,144 B, 11.18 % over NFR-PERF-002's 3,856,208 B. That requirement is amended to the shipped size at R6, with the release paperwork, as the owner was told when choosing. The tour's art stays in the bundle; moving it into a data asset is the trim, if it's ever needed. The cold-start TTI is still to be recorded from the hidden panel.
- **R2 grows (2026-11-02):** the owner asked for the App Store's creative assets as well, a Header and a Search Results asset, which show on iOS 27 and iPadOS 27 and later. Their answers:
  - format: "Looping videos" (a 21:9 header loop and a 3:2 search loop cut from one scene; Apple has no video that serves both, and the 16:9 universal asset is still-only);
  - text: "No text", then, after Apple's header examples, the brand kit's wordmark on the header only ("Header only"); the name reads the same in both languages, so one set still serves English and Turkish;
  - search: first "The timer in use", since the asset replaces the screenshots in search results. Then, on Apple's examples: "they are not the screen itself so why should we". So neither asset shows a screen. Search makes the purpose plain through the scene: the Ring as an illustrated object, a sticker pressing on, Pomo & Doro;
  - timing: "Hold 1.4.0 for them", so R3 waits for both videos.

  The screenshot session makes them on `phase1/app-store-shots`, composition round first; the 30 screenshots there are upload-ready at `8b12e2b` (panel 5's Modes rows now at the app's 14-pt corners).
- **E1: accepted by the owner** without a fresh run. 1.3.1's data has already survived the update on a real iPhone twice: A0 on build 42, and B2's MMKV migration on build 43 (the Phase 1 plan, Stage A and B2). The migration code was last changed in B3 (`71d836f`), before builds 44–58, and no install the owner tests holds data worth comparing.

The plan below was written before any of its steps. The owner, 2026-11-01: "wonderful everything is looking just like how i want it. All visual tests are passed. I think it is time to prepare the app for shipping."

**Branch:** `phase1/stage-d` until it merges into `rehaul/v2`; then `rehaul/v2`, which `master` fast-forwards to at release ([BRANCHING.md](../process/BRANCHING.md#the-transition-from-rehaulv2-now)).
**Plan:** the [Phase 1 plan](2026-10-29-phase1-plan.md) Stage E (E1–E4) and its exit criteria, run through the [release process](../process/RELEASE.md) §3.

---

## 1. Problem / Motivation

Stage D's screens are built and seen on the phone: D1–D3 on builds 48–56, D4's sounds wired, and D5's tour on builds 57–58. The owner reports every visual check passed. What stands between that and v1.4.0 in the App Store:
- Stage D's own close: the tour's FINISH step, and the records' statuses.
- The merge into the Phase 1 integration branch, with its shared-doc updates.
- Stage E's checks:
  - the migration from the App Store's 1.3.1 on a real phone;
  - the final checklist;
  - the measurements, the bytecode budget's decision among them;
  - the release paperwork.
- The release candidate, the store listing, the review, and the release steps.

## 2. What Changed

| File | Change |
|------|--------|
| This record (new) | The shipping plan, then what each step found |
| Stage D's records, its plan, DESIGN.md, `.impeccable/design.json` | S1–S3: closed (`faa141d`, `0194c8a`) |
| `.gitattributes`, generated backlinks and TRACEABILITY, `src/components/stickers/art/markColour.ts` | M1: the merge's resolutions and the regenerated mark (`96ce9dd`, `d3f62be`) |
| SRS, ROADMAP, CHANGELOG, ARCHITECTURE, ADR index, ADR-0027, ADR-0048, DECISIONS.md, DESIGN-WORKFLOW, TEST-STRATEGY, docs/README, the rehaul plan | M2: Stage D's shared-doc updates (`ad86dc3`) |
| CHANGELOG, DECISIONS.md, ROADMAP, SRS §2.6, the Phase 1 plan | E4: the release section, Q2 and Q3, the exit criteria |

## 3. Implementation Approach: the ordered steps

Each step names who acts. Every push, merge, EAS build, TestFlight submission, store submission and `update.json` change waits for the owner's explicit word, each time (the standing rule).

### 3.1 Close Stage D

| # | Step | Who | Done when |
|---|------|-----|-----------|
| S1 | **Record the device checks** on build 58: D5's step 9; D3's every screen in Turkish at the largest text size; D1's Ring idle, running and paused; D2's Stats captures. **D4's sounds aren't visual:** the silent switch, the music mix, the Sound switch and the babble's level need the owner's own word | Claude, the owner | Each record's device-check line says passed, in the owner's words |
| S2 | **D5 FINISH:** the finish review against the direction contract, its verdict, and DESIGN.md's "Tutorial (first run)" motion row with the tour's new tokens (`scrim`, `scrimStrong`, `pomoInk`, `doroInk`) | Claude, sub-agents; captures from the owner | The verdict is ship, and DESIGN.md records the tour |
| S3 | **The records' statuses:** D1–D5 and the Stage D plan's checklist (§6) closed | Claude | Every Stage D record says Done |

### 3.2 Merge

| # | Step | Who | Done when |
|---|------|-----|-----------|
| M1 | **`phase1/stage-d` into `rehaul/v2`.** Stage D is 134 commits ahead; `rehaul/v2` has 14 of its own (the licence and the brand docs), so this is a merge commit. `master` stays an ancestor of `rehaul/v2`, so the release can still fast-forward | **The owner's go-ahead**, then Claude | The merge is committed and the guards are green on it |
| M2 | **The shared-doc updates** gathered in the [Stage D plan](2026-10-30-phase1-stage-d.md) §9, applied on `rehaul/v2`: the SRS (`FR-ONB-001` and `FR-ONB-002`, D3's amendments, statuses), ROADMAP, CHANGELOG, ARCHITECTURE, TEST-STRATEGY and the docs index | Claude | The docs check is green; each update is ticked in §9 |

### 3.3 Stage E

| # | Step | Who | Done when |
|---|------|-----|-----------|
| E1 | **Migration on a phone:** the release candidate installed over the App Store's 1.3.1 on an iPhone with real data (sessions on two days, edited notes, the reminder, settings, an ad-policy state). It needs a phone running the store's 1.3.1, not a TestFlight build | The owner | Every value survives, compared with the screens before the update |
| E2 | **The v1.4 checklist** on the release candidate: dark mode, the largest text size, Turkish, Reduce Motion, landscape, iPad if there is one, and the sounds. Most of it passed on builds 56–58; this is the last pass on the build that ships | The owner | Every item passes |
| E3 | **Measurements:** | Claude; the owner reads the TTI from the hidden diagnostics panel | Recorded here and in the Phase 1 record |
| | - Reassure against the 2026-10-29 baseline (`docs/baselines/`). | | |
| | - The bytecode with the pinned export. NFR-PERF-002's ceiling is 3,856,208 B; it was 7.34 % over at build 56, and the tour adds more. **The decision is the owner's:** accept and amend, or trim. | | |
| | - Cold-start TTI on the iPhone. | | |
| E4 | **Release paperwork:** | Claude | Each item done and checked by the docs check |
| | - CHANGELOG's Unreleased becomes `## [1.4.0] - <date>`, written for users. | | |
| | - DECISIONS.md Q1–Q3 closed, and the Phase 1 record written. | | |
| | - DESIGN.md regenerated in scan mode, its tokens and `.impeccable/design.json` current. | | |
| | - The ROADMAP's milestone. | | |
| | - `app.json` and `package.json` already say 1.4.0. | | |

### 3.4 Release candidate and release (RELEASE.md §3)

| # | Step | Who |
|---|------|-----|
| R1 | **The release candidate:** an EAS production build from `rehaul/v2`'s head with TestFlight submission, tagged `v1.4.0-tf.<n>`; E1 and E2 run on it | **The owner's go-ahead**, then Claude; the owner checks |
| R2 | **The store listing:** "What's New" in English and Turkish (drafted from the CHANGELOG by Claude), screenshots of the redesign, the privacy labels (v1.4 adds no data collection, to be confirmed), notes for App Review, and the Header and Search Results videos (added 2026-11-02; R3 waits for them) | Claude drafts; the owner sets them in App Store Connect |
| R3 | **Submit for App Store review,** choosing the release candidate's build | The owner |
| R4 | **On approval:** `master` fast-forwards to `rehaul/v2` (done early, at M3, on the owner's word: §3.9); `v1.4.0` is tagged on the released commit and pushed; a GitHub Release with the CHANGELOG section as notes | **The owner's go-ahead**, then Claude |
| R5 | **The update prompt:** ~~`latestVersion` in `update.json` on `gh-pages` set to 1.4.0~~ **skipped:** Android reads that file and stays on 1.3.1 (status above) | The owner |
| R6 | **Close up:** the ROADMAP milestone closed, the release date in the CHANGELOG, NFR-PERF-002 amended to the shipped bytecode (the owner's "Ship build 59", 2026-11-02), `rehaul/v2` deleted | Claude; the deletion on the owner's word |

### 3.5 R2's drafts: "What's New" for the App Store (for the owner to edit)

Drafted 2026-11-01 from what v1.4 ships, in the app's own names for each feature. It makes no performance claim and adds no feature beyond Stage D's records. App Store Connect takes up to 4,000 characters per language.

**English**

> Valentine Pomodoro 1.4 is a whole new diary.
> • Meet Pomo & Doro, the two little faces of your timer. On your first visit they show you around.
> • Pick a length in one tap: 25/5, 50/10, 90/20, or your own.
> • Two timer layouts: the Ring, or Facing pages.
> • Every focus you finish presses a sticker onto today's page, toward a daily goal.
> • Stats is now a stack of postcards, with your goal and your love streak.
> • Write and edit your own love notes.
> • The whole app in Turkish too, with a language choice in Settings.
> • Soft sounds when a focus or a break starts and when you finish. They respect the silent switch.
> • Fly over the map, as before. Everything you had in 1.3 comes with you.

**Türkçe**

> Valentine Pomodoro 1.4 yepyeni bir günlük.
> • Zamanlayıcının iki küçük yüzü Pomo ile Doro'yla tanış. İlk açılışta sana etrafı gösterirler.
> • Süreni tek dokunuşla seç: 25/5, 50/10, 90/20 ya da kendi süren.
> • İki zamanlayıcı düzeni: Halka ya da Karşılıklı sayfalar.
> • Bitirdiğin her odak bugünün sayfasına bir çıkartma yapıştırır ve günlük hedefine yaklaştırır.
> • İstatistikler artık bir kartpostal destesi; hedefin ve aşk serin de orada.
> • Kendi aşk notlarını yaz ve düzenle.
> • Uygulamanın tamamı artık Türkçe de; dili Ayarlar'dan seçebilirsin.
> • Odak ya da mola başlarken ve bitirdiğinde yumuşak sesler. Sessiz moda uyarlar.
> • Haritada uçuş eskisi gibi. 1.3'teki her şey seninle gelir.

**App Review notes** (drafted 2026-11-02, from the code at `3ea0b4c`):

> No account or sign-in is needed. On the first launch, a short tour with the two characters, Pomo & Doro, opens over the Timer, Stats and Notes tabs. It can be skipped at any step ("Skip tour") and replayed from Settings › About › "Watch the tour again". The Modes button on the Timer opens Fly mode, a flight on Apple Maps that lasts as long as the focus session; it asks for no location permission. Notifications are local only: a session's end and an optional daily reminder. Ads are Google AdMob, non-personalised: a banner on Stats and an interstitial after the second completed session. The app is in English and Turkish (Settings › Language, applied at the next launch).

**The privacy labels:** v1.4 adds no SDK that collects data. Since 1.3.1 the new runtime dependencies are on-device only: MMKV, Zustand, Expo Router, expo-localization, expo-file-system, the picker, and expo-application. Google Mobile Ads (non-personalised, `requestNonPersonalizedAdsOnly`) and the update check of `update.json` were already in 1.3.1. The app shows no tracking prompt. **Corrected 2026-11-04:** it does declare one usage description, `NSMicrophoneUsageDescription`, the `expo-audio` plugin's default, though it never asks for the microphone ([DEF-009's record](2026-11-03-def-009-background-audio-mode.md) §5). That collects nothing, so the labels aren't affected. So the existing labels stand, for the owner to confirm in App Store Connect.

**The listing, as handed to the owner** (2026-11-02). The owner asked: "let's fill it part by part and give me everything for me to put there". The fill-in page is https://claude.ai/artifact/YVBXzsSRe4Rx4VSKQoGtfC: 15 steps in the version page's order, with copy buttons. The texts below are its source. Lengths were counted in characters, and the Turkish keywords also in UTF-8 bytes (95), in case App Store Connect counts bytes.

- **Languages:** English (U.S.) and Turkish. Turkish is added as a localization so Turkish users get a Turkish page, with the Turkish screenshots.
- **Header and Search Results** (per language, the same files in both):
  - `creative-header.mp4` (21:9, 3840 × 1646) and `creative-search.mp4` (3:2, 3456 × 2304), from `C:\vp\stage-shots\art\out\creative\`, on `phase1/app-store-shots` (`35b05f0`).
  - Poster frames: header 1.8 s (frame 54), search 11.2 s (frame 336).
  - "Use header asset in search results" stays off.
- **Screenshots** (per language), from `C:\vp\stage-shots\art\out\store\` (`8b12e2b`):
  - iPhone with Dynamic Island (medium display): `store-iphone-<lang>-01…05-1206x2622.png`;
  - iPad 13": `store-ipad-<lang>-01…05-2064x2752.png`;
  - the 1320 × 2868 set only if a large-iPhone slot is offered;
  - iPhone Duo, Apple Watch and app previews stay empty.
- **Version page:**
  - Copyright `2026 Mert Efe Şensoy`.
  - Build 1.4.0 (59). There is no export-compliance prompt, since `ITSAppUsesNonExemptEncryption` is false.
  - Sign-in not required.
  - Manual release, with phased release for automatic updates (recommended, so R4 and R5 go out with the release).
- **App Accessibility** (optional): only what the device checks have shown:
  - Dark Interface;
  - Larger Text (the largest text size, build 58);
  - Sufficient Contrast (the 60-pair contrast check).
  - VoiceOver, Voice Control, Reduced Motion and Differentiate Without Color wait for the owner to try them on device.
- **What's New** and the **App Review notes:** as drafted above.

**Promotional Text** (159 and 151 of 170 characters)

> Meet Pomo & Doro. Pick a focus length, and every session you finish presses a sticker onto today's page. Reach your daily goal and keep your love streak going.

> Pomo ile Doro'yla tanış. Bir odak süresi seç; bitirdiğin her oturum bugünün sayfasına bir çıkartma yapıştırır. Günlük hedefine ulaş, aşk serini sürdür.

**Description** (1414 and 1416 of 4000; it replaces 1.3.1's)

> Valentine Pomodoro is a focus timer that feels like a little diary. Pick how long you want to focus, start the timer, and every session you finish presses a sticker onto today's page.
>
> MEET POMO & DORO
> The two little faces of your timer show you around on your first visit and keep you company while you work. You can watch their tour again any time from Settings.
>
> FOCUS YOUR WAY
> • Pick a length in one tap: 25/5, 50/10, 90/20, or Custom with your own durations
> • Two timer layouts: the Ring, or Facing pages
> • The timer stays accurate when you leave the app or lock your phone
> • A notification tells you when a focus or a break ends, and an optional daily reminder invites you back
>
> A DIARY THAT FILLS UP
> • A sticker for every focus you finish, toward a daily goal you set
> • Stats as a stack of postcards, one for each day, in sessions or minutes
> • A love streak for every day you reach your goal
>
> LOVE NOTES
> A sweet note appears after each focus session. Write your own, edit them, and keep the built-in ones too.
>
> FLY MODE
> Pick two airports and fly across the map while you focus. The flight lasts as long as your session.
>
> CALM BY DESIGN
> • Strawberry Milk by day and Midnight Plum by night, following your iPhone's appearance
> • Soft sounds when a focus or a break starts and when you finish, which respect the silent switch
> • In English and Turkish
>
> No account and no sign-in. Open the app and start focusing.

> Valentine Pomodoro, küçük bir günlük gibi hissettiren bir odak zamanlayıcısı. Ne kadar odaklanmak istediğini seç, zamanlayıcıyı başlat; bitirdiğin her oturum bugünün sayfasına bir çıkartma yapıştırır.
>
> POMO İLE DORO'YLA TANIŞ
> Zamanlayıcının iki küçük yüzü ilk açılışta sana etrafı gösterir ve çalışırken sana eşlik eder. Turu istediğin zaman Ayarlar'dan yeniden izleyebilirsin.
>
> KENDİ TARZINDA ODAKLAN
> • Süreni tek dokunuşla seç: 25/5, 50/10, 90/20 ya da kendi sürelerinle Özel
> • İki zamanlayıcı düzeni: Halka ya da Karşılıklı sayfalar
> • Uygulamadan çıksan ya da telefonunu kilitlesen de zamanlayıcı doğru saymaya devam eder
> • Odak ya da mola bittiğinde bir bildirim gelir; istersen günlük bir hatırlatıcı da seni geri çağırır
>
> DOLDUKÇA GÜZELLEŞEN BİR GÜNLÜK
> • Bitirdiğin her odak için bir çıkartma, belirlediğin günlük hedefe doğru
> • İstatistikler bir kartpostal destesi: her gün için bir kart, oturum ya da dakika olarak
> • Hedefine ulaştığın her gün aşk serine sayılır
>
> AŞK NOTLARI
> Her odaktan sonra tatlı bir not çıkar. Kendi notlarını yaz ve düzenle; hazır notlar da seninle kalır.
>
> UÇUŞ MODU
> İki havalimanı seç ve odaklanırken haritada uç. Uçuş, odak oturumun kadar sürer.
>
> SAKİN BİR TASARIM
> • Gündüz açık, gece koyu renkler; iPhone'unun görünümüne uyar
> • Odak ya da mola başlarken ve bitirdiğinde yumuşak sesler; sessiz moda uyar
> • Türkçe ve İngilizce
>
> Hesap yok, giriş yok. Uygulamayı aç ve odaklanmaya başla.

**Keywords** (98 and 82 of 100; the app name's words are left out because the name is already searchable)

> focus,timer,study,productivity,love,motivation,habits,stats,fly,sticker,diary,tomato,concentration

> odak,zamanlayıcı,ders,çalışma,verimlilik,aşk,motivasyon,alışkanlık,çıkartma,günlük

**Subtitle** (optional, App Information): "Focus timer & sticker diary" / "Çıkartmalı odak günlüğü".

### 3.6 M1: the merge (2026-11-02)

The owner: "do it". Built in a temporary worktree at `rehaul/v2` (`618fbf5`), so neither checkout switched branches, then fast-forwarded into `phase1/stage-d` for the guards and into `rehaul/v2` in the main checkout once they were green.

- **The merge commit:** `96ce9dd`, parents `618fbf5` (`rehaul/v2`, first) and `faa141d` (`phase1/stage-d`). `master` stays an ancestor of `rehaul/v2`, so the release can still fast-forward.
- **Four conflicts, none in code:**
  - `.gitattributes`: both blocks kept (the brand kit's `-text` paths, and `assets/fonts`).
  - ADR-0047's and the Stage C record's backlink blocks, and `TRACEABILITY.md`: all generated, regenerated by `check-docs --write`.
- **One interaction the guards caught:** `rehaul/v2` had changed the colour mark to the owner's choice C, strawberry pages in a cocoa cover (`4471c22`), source and exports. Stage D's generated `markColour.ts` still held the old drawing, so `build-icon-components --check` (`Icon.test.tsx`) failed. It was regenerated in `d3f62be`. It reaches one screen, the Modes sheet's header mark in the light theme.
- **The same brand change reaches the light splash.** `assets/images/splash-mark-light.png` is `rehaul/v2`'s choice-C mark (24,268 → 30,120 B). It is first seen on the release candidate (E2).
- **The guards on `d3f62be`, all green:**
  - `tsc`; lint, 0 errors and 29 warnings, as before;
  - the compiler report, 100 compiled and 5 skipped;
  - raw text, emoji, contrast (60 pairs);
  - the art, sound and icon checks, budgets (133 assets);
  - Jest, 65 suites and 494 tests;
  - `check-docs`.

### 3.7 Phase 1's exit criteria

From the plan §3, checked at E3 and E4:
- A1's guards green;
- Reassure's F1 drop (14 → ≤ 2);
- the React Compiler's lint rules at `error`;
- E1 and the iPhone checklists (A0, E2);
- `airports.json` out of the bytecode (B1b);
- Classic's audit ≥ 16/20;
- DECISIONS.md Q1 closed;
- DESIGN.md regenerated.

### 3.8 R1: the release candidate, build 59 (2026-11-02)

The owner: "go for it". Built from `rehaul/v2`'s head, `bce65cc` (Stage D merged, M2 and E4 applied).

| | |
|---|---|
| EAS build | `328a9fba-6834-40cd-a25a-b1217b8dc1fa`, iOS build 59, version 1.4.0, created 2026-11-02T04:49:59Z, finished 04:56:04Z |
| Submission | `59c969f6-1cbd-48f3-82d9-5090441749be`; `submit-ios.yaml` succeeded |
| Tag | `v1.4.0-tf.59` on `bce65cc`, pushed (`refs/tags/v1.4.0-tf.59`) |
| IPA | **21,618,068 B**, +2,341 B on build 58 (21,615,727 B): the choice-C mark and the light splash |

**What the owner checks on it:** E2's checklist (§3.3); the cold-start TTI from the hidden panel (a 1.5 s long-press on Settings › About's credit line), for E3's bytecode decision; and the light splash, now the choice-C mark (§3.6).

### 3.9 M3: the store assets, `master` and the submitted tag (2026-11-02/03)

The owner: "push and merge everything and tag the latest version as submitted". Then "Now" for `master`, and "v1.4.0-submitted (Recommended)" for the tag.

- **The merge** was built in a temporary worktree (`C:\vp\merge-v2`), as M1 was:
  - `rehaul/v2` (`ceeef9a`) fast-forwarded to `phase1/stage-d` (`b661f28`: this record's R2, R3, E2 and E3 entries).
  - `phase1/app-store-shots` was merged with `--no-ff` as `a03135c`, parents `b661f28` and `35b05f0`.
  - There were no conflicts. The branch adds the store and creative art, their scripts and their two records, and changes one shared file, `scripts/art/build.mjs` (rect crops and the compact-JSON time pin).
- **One interaction the guards caught:** `check-budgets.mjs` failed on the branch's seven jobs, with "unknown kind" for `store` and `creative`. NFR-PERF-005's budgets cover art shipped in the app. The listing's art is uploaded to App Store Connect and is never bundled (nothing in `src/` or `app/` imports `art/out/store` or `art/out/creative`). So the check now counts those two kinds as skipped, and any other unknown kind still fails.
- **The guards on the merge with that fix, all green:**
  - `tsc`; lint, 0 errors and 29 warnings, as before;
  - the compiler report, 100 compiled and 5 skipped;
  - raw text; contrast, 60 pairs;
  - the art and sound `--check`, and the icons, 120 drawings;
  - budgets, 133 assets, with 7 listing assets skipped;
  - Jest, 65 suites and 494 tests;
  - `check-docs`, 142 docs.
- **On top of the merge:**
  - DEF-009's urgent record;
  - its SRS row;
  - `CLAUDE.md`;
  - this section;
  - RELEASE.md's new tag kind;
  - BRANCHING.md's note on `master`.
- **`master`** fast-forwards from `fda4fef` to the same head as `rehaul/v2`. That is ahead of BRANCHING.md's "when v1.4.0 is approved", on the owner's word, and they were told the trade-off: a rejection's fix lands on `master` after code that never went live. Since `bce65cc`, only documentation and store art have changed, no app code. `rehaul/v2` stays until R6.
- **The tag:** `v1.4.0-submitted`, annotated, on `bce65cc`, the commit build 59 was made from, which is the binary in App Review. It is a new tag kind (RELEASE.md §2). `v1.4.0` waits for R4, since a release tag never moves.
- **Pushed by commit ID:**
  - `rehaul/v2`, `master` and `phase1/stage-d` to the head;
  - the tag by name.
  - `phase1/app-store-shots` isn't pushed as a branch, since its commits are in `rehaul/v2`.

### 3.10 R3's fallback: build 60 (2026-11-04)

The owner: "Yes, start build 60". Built from `c184337`, with `master`, `rehaul/v2` and `phase1/stage-d` all at that commit.

| | |
|---|---|
| EAS build | `b1c037dd-9105-4368-a23e-3a693ba4ee42`, iOS build 60, version 1.4.0, created 2026-11-04T11:15:09Z, finished 11:23:46Z |
| Submission | `c8a9df13-d1b6-4082-9eed-60559cd5c6fe`; `submit-ios.yaml` succeeded, to TestFlight only |
| CI on the commit | Green: runs 41819215848 (`master`) and 41819216342 (`rehaul/v2`) |
| Tag | `v1.4.0-tf.60` on `c184337`, pushed (`refs/tags/v1.4.0-tf.60`) |
| IPA | **21,618,033 B**, −35 B on build 59 (21,618,068 B) |
| App changes since build 59 | `app.json` only: `git diff bce65cc c184337` over `src`, `app`, `assets`, `package.json` and `eas.json` shows the plugin option and its test, nothing else |

**How the fix was checked:** `npx expo config --type introspect --json` runs the plugins as EAS does, and gives `UIBackgroundModes` as `["audio"]` before the fix and no key after it. The built IPA's own Info.plist hasn't been opened.

**The device check passed,** 2026-11-04. Asked "Did build 60 pass the sound check?", the owner answered "Passed" (DEF-009's record §3 step 7).

**Retired.** 1.4.0 had gone live on build 59 at 2026-11-04T14:45:37Z, before this check was reported, so build 60 was never attached. A 1.4.0 build can't go on a later version, so the fix ships as 1.4.1 from a new build.

## 4. Mathematical / Statistical Details

Filled in at E3: the bytecode's size against NFR-PERF-002's ceiling, as (size − 3,856,208) / 3,856,208, and the Reassure counts against the baseline.

**E3, the bytecode, measured first (2026-11-01, at `eaf9e2a`; the code is build 58's):** `npx expo export --platform ios --platform android --dump-sourcemap`.

| | Hermes bytecode | Against the ceiling (3,856,208 B) | Against build 56 (4,139,364 B) |
|---|---|---|---|
| iOS | **4,287,144 B** | +430,936 B, **+11.18 %** | +147,780 B (+3.57 %) |
| Android | 4,286,828 B | | |

- **The growth since build 56 is D5:** the tour's code and its 44 art modules, vector paths held as JavaScript strings. They're evaluated only when a tour starts (`lazy()`), but Hermes still ships them in the one bundle.
- **The owner's decision at E3,** with the cold-start TTI in hand:
  - accept, amending NFR-PERF-002, as B6's overage was accepted on 2026-10-30;
  - or trim. The tour's art can leave the bytecode as a data asset read when the tour starts, as B1b moved `airports.json`.

**E3, Reassure (2026-11-02, on `d3f62be`, the merge):** `npx reassure`, three runs each, the counts identical across runs. The baseline is A2's (Phase 1 plan, A2 GATE; 2026-10-29). No baseline file is kept in `.reassure/`, so the comparison is with the recorded counts.

| Scenario, a 10 s running session | Baseline renders | Now | Change |
|---|---|---|---|
| settings-only consumer (finding F1) | 14 | **1** | −13; the exit criterion is ≤ 2 |
| Stats screen | 14 | 1 | −13 |
| Settings screen | 15 | 1 | −14 |
| Notes screen | 14 | 1 | −13 |
| Timer screen (Classic) | 14 | 13 | −1: the seconds repaint, through the `<TimerText>` leaf only (B4) |
| `TimerText`-sized leaf | 14 | 12 | −2: one render per displayed second |

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Close Stage D before the merge | Merge first, close after | The merge carries Stage D's shared-doc updates (§9); its records should be final when they land |
| One release candidate for E1, E2 and the store | Ship build 58 | The merge and the release paperwork change the commit; the binary in review must be the one checked, from the commit `master` fast-forwards to |
| `master` fast-forwards at approval | Merge `rehaul/v2` into `master` now | BRANCHING.md's transition: `master` stays the releasable trunk until the store approves. **Superseded at M3** (§3.9): the owner moved it at submission ("Now") |
| A `v1.4.0-submitted` tag on `bce65cc` | `v1.4.0` now; the same tag on the merged head | A release tag never moves, and a rejection could mean a new build. The tag marks the binary in review, not the later documentation and store art |
| Ask Apple to approve build 59, fix the background mode in 1.4.1 | Rebuild as build 60 and resubmit | **The owner's choice** (2026-11-03). Build 59 is device-checked, Apple offered it because 1.4.0 has bug fixes, and the key changes nothing a user sees (DEF-009) |

## 6. Verification

- [x] S1–S3: every Stage D record Done; the tour's verdict ship.
- [x] M1–M2: the merge on `rehaul/v2`, guards green, §9 applied.
- [ ] E1–E4: as above, each recorded here. All done but E3's cold-start TTI, which the owner hasn't sent.
- [x] R1–R6: the release candidate checked, submitted, approved, released and tagged. `update.json` stays as it is, by decision (R5). `rehaul/v2` is deleted (R6).

## 7. Related Docs

- [Phase 1 plan](2026-10-29-phase1-plan.md) · [Stage D plan](2026-10-30-phase1-stage-d.md) · [D5 record](2026-11-01-phase1-d5-tutorial.md)
- [Release process](../process/RELEASE.md) · [Branching model](../process/BRANCHING.md) · [Test strategy](../testing/TEST-STRATEGY.md) §5
