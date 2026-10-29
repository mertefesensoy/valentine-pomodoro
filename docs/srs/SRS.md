---
id: SRS
title: Software Requirements Specification — Valentine Pomodoro v2 (couples rehaul)
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ARCHITECTURE, ROADMAP, TEST-STRATEGY, IMPL-2026-10-29-couples-rehaul-plan, IMPL-2026-10-29-phase1-plan]
---

# Software Requirements Specification

**Product:** Valentine Pomodoro (working name; the v2 public name is TBD, see §6), bundle id `com.bengisu.valentinepomodoro`.
**Version of this document:** 1.0, 2026-10-30. The change history is in §7.
**Structure:** follows ISO/IEC/IEEE 29148:2018 (software requirements specification), trimmed to what a two-person product needs.

This document says **what** the product must do, testably. It does not say **how**: that is in the [architecture](../architecture/ARCHITECTURE.md) and its [decision records](../architecture/adr/README.md). It also does not say **when**: that is in the [roadmap](../roadmap/ROADMAP.md). Every requirement still carries a target phase, so the two can be cross-checked.

---

## 1. Introduction

### 1.1 Purpose

To define, in one place, everything Valentine Pomodoro must do as it grows from a single-user Pomodoro gift app (v1.3.1, on the App Store) into a public **couples study app**: two people pair once, study together in one shared, synced timer, and see that time turn into something cute they grew together.

It is written for the owner (Mert Efe Şensoy) and for every Claude session working on the code. Each requirement has a stable ID that plans, commits, tests and implementation records cite (see [conventions](../process/DOCS.md#3-ids)).

### 1.2 Scope

**In scope:**

- **As built:** the iOS app as it exists on `rehaul/v2`. This is v1.3.1 behaviour plus the Phase 0 and Phase 1 changes, which are listed with status `implemented`.
- **To be built:** the v2 rehaul, phases 1–7 of the [rehaul plan](../implementations/2026-10-29-couples-rehaul-plan.md#7-roadmap). That covers the redesign, the local re-architecture, accounts and pairing, the shared room and presence, the five modes, the couple subscription with capped free-tier ads, the web app and launch.
- Android, deferred as a whole (§2.6, [CON-003](#con-003)); its requirements are kept with status `deferred`.

**Out of scope:**

- Groups larger than two
- An Apple Watch app
- An AI study buddy

These were rejected in the [rehaul plan §3.5](../implementations/2026-10-29-couples-rehaul-plan.md#35-ideas-and-themes-audit-you-asked-for-new-ideas).

### 1.3 Product perspective

| | Today (v1.3.1, App Store since 2026-05-11) | Target (v2) |
|--|--|--|
| Users | One person (built as a gift for Bengisu) | University-age couples, long-distance first ([PRODUCT.md](../../PRODUCT.md)) |
| Data | On the device only (AsyncStorage) | Local-first; cloud sync for pairs (Supabase) |
| Modes | Classic, Fly Mode (a real map) | Classic, Shared Garden, Fly Together (an illustrated map; the real map stays as a Plus extra), Study-date Room, Shared Pet |
| Money | Capped AdMob interstitials | Couple subscription ("Plus") plus capped free-tier ads |
| Platforms | iOS (an Android 1.0.1 build once shipped) | iOS first, then the full web app; Android when Google Play's closed-test rule can be met |

### 1.4 Definitions

| Term | Meaning |
|------|---------|
| Session | One timed phase (focus, short break or long break) with a start, an end and a state |
| Cycle | Focus sessions counted toward the next long break (`longBreakEvery`) |
| Slot | One of the two independent clock states (Pomodoro, Fly) in the v1 session clock |
| Couple | Exactly two paired users sharing a room, a streak, progress and an entitlement |
| Shared room | A couple's live session space: one clock that both phones display |
| Presence | A partner's live status (focusing, break, idle, away) and intention |
| Plus | The paid tier. One purchase unlocks it for both partners |
| Credit | The focus minutes counted for a user from a session |
| Day key | `YYYY-MM-DD` in the user's local time (v1), or in the couple's `home_tz` (v2 couple stats) |
| CNG | Continuous Native Generation: native projects are generated from `app.json` at build time |

### 1.5 References

| Ref | Document |
|-----|----------|
| PLAN-REHAUL | [v2 rehaul plan](../implementations/2026-10-29-couples-rehaul-plan.md) (approved 2026-10-29) |
| PLAN-PHASE1 | [Phase 1 (v1.4) plan](../implementations/2026-10-29-phase1-plan.md) (approved 2026-10-29) |
| PRODUCT | [PRODUCT.md](../../PRODUCT.md): users, purpose, principles |
| DESIGN | [DESIGN.md](../../DESIGN.md): "The Sticker Diary" design system |
| ARCH | [Architecture](../architecture/ARCHITECTURE.md) and [ADRs](../architecture/adr/README.md) |
| TEST | [Test strategy](../testing/TEST-STRATEGY.md) and [traceability](../testing/TRACEABILITY.md) |
| v1 | [Original v1 plan, 2026-01-07](../history/2026-01-07-v1-plan.md), [DECISIONS.md](../../DECISIONS.md) |

---

## 2. Overall description

### 2.1 Product functions (summary)

1. A drift-free Pomodoro timer with focus, short and long breaks, presets and notifications.
2. Stats, a daily goal and a streak.
3. Love notes. In v2 they are written by your partner.
4. Fly Mode: a timed flight between two airports.
5. Settings, themes, EN/TR, sound and haptics.
6. Accounts (optional for solo use), pairing by invite link or code.
7. A shared room: one timer for both partners, with presence, intentions and cheers.
8. Five modes that turn shared focus into rewards that never punish.
9. Plus: one purchase for the couple; capped ads for free users.
10. A web app plus the marketing site with invite pages.

### 2.2 User classes

| Class | Description | Needs |
|-------|-------------|-------|
| **Existing v1 user** | Installed v1.x; on-device data only; may never create an account | An update that never loses data or forces a sign-in ([FR-MIG-001](#fr-mig-001), [FR-ACC-001](#fr-acc-001)) |
| **Solo user** | Uses the timer alone, with or without an account | The full timer, stats and Classic, all free |
| **Couple member** | One of two paired users; often long-distance, in different time zones | A shared clock, presence, low-friction pairing, a fair streak |
| **Plus buyer** | The partner who pays | Plus unlocked for both, and kept by the buyer on unpairing |
| **Gift giver** | Buys Plus for a partner | A gift reveal (the heritage feature, [FR-MON-006](#fr-mon-006)) |

### 2.3 Operating environment

- **iOS 16.4 or later** (the Expo SDK 58 minimum), iPhone and iPad, portrait and landscape.
- **Web (Phase 6):** current Safari, Chrome, Firefox and Edge.
- **Android (deferred):** the targets in [§3b of the Phase 1 plan](../implementations/2026-10-29-phase1-plan.md#3b-deferred-android-after-v14).

### 2.4 Design and implementation constraints

#### CON-001
**Stack.** Expo SDK 58 (React Native 0.88, React 19.3, the New Architecture, Hermes v1), TypeScript strict mode, with native projects generated by CNG. Source: [SDK 58 upgrade](../implementations/2026-10-29-expo-sdk-58-upgrade.md).

#### CON-002
**Backend.** Supabase (Postgres, Auth, Realtime, Edge Functions, Storage, pg_cron). No self-hosted servers. Source: PLAN-REHAUL §0.

#### CON-003
**iOS first.** v1.4 ships to iOS only. Android waits until Google Play's rule for new personal accounts can be met: at least 12 testers opted in to a closed test for 14 consecutive days. Source: PLAN-PHASE1 §0.

#### CON-004
**No Mac.** Every iOS build and device check goes through EAS Build and TestFlight, each with the owner's go-ahead.

#### CON-005
**Store rules.**
- Digital goods inside the iOS app use in-app purchase (App Store Review Guideline 3.1.1).
- An account-based app offers in-app account deletion (5.1.1(v)).
- Offering Google sign-in requires also offering Sign in with Apple (4.8).

#### CON-006
**Art and sound.**
- All vector art is made with VectorCraft 0.16 and all sounds with SoundCraft. Their sources are committed, so every asset can be rebuilt.
- All characters are original.

#### CON-007
**Bundle id kept.** `com.bengisu.valentinepomodoro` stays, so existing installs update in place.

### 2.5 Assumptions and dependencies

- **Apple Developer account** `Q885KHD85V` and EAS project `a0599a9f-…`. The distribution certificate expires on **7 Jan 2027**.
- **Accounts the owner creates** before the phase that needs them: Supabase (Phase 2), RevenueCat and store products (Phase 5), AdMob production ids (Phase 5), and a custom domain (now: `*.vercel.app` was unreachable from the owner's network).
- **Turkey-based owner**, so the KVKK data-protection law applies alongside the GDPR.

### 2.6 Release scope

| Release | Phase | Content | Status |
|---------|-------|---------|--------|
| v1.3.1 | — | The current App Store version | Released 2026-05-11 |
| **v1.4.0** | 1 | The design system, local re-architecture (MMKV, stores, re-render fix, Expo Router), the Classic redesign, presets, EN/TR, sounds. iOS only | In progress (Stages A and B1 done) |
| v1.5+ | 2–6 | Accounts and pairing, shared room and presence, modes, Plus, web. The version per phase is TBD | Planned |
| v2.0.0 | 7 | Public launch under the new name and brand | Planned |
| Android | 3b | All `deferred` requirements | Deferred |

---

## 3. Specific requirements

**How to read a requirement**

- **Statement:** what the system shall do.
- **Pri:** MoSCoW priority (Must, Should, Could).
- **Target:** the phase that delivers it. "v1" means it already exists in v1.x.
- **Status:** `implemented`, `planned`, `deferred` or `dropped`.
- **Accept:** the acceptance criteria.
- **Verify:** T = automated test, D = device check, I = inspection, A = analysis. Test files are named.
- **Source:** where the requirement came from.

**Completeness rules** (so every requirement is testable without inventing detail early):
- **No Accept field?** Then the Statement is itself the acceptance criterion and must be testable as written. Implemented requirements are written that way.
- **Definition of ready:** before a phase plan is approved, every requirement it targets gets explicit **Accept** criteria and a **Verify** method in this document. Planned requirements for later phases may carry only a statement until then.
- **NFR priority:** non-functional requirements are **Must** unless marked otherwise.

| Area | Code |
|------|------|
| Timer | `TMR` |
| Notifications and reminders | `NTF` |
| Stats, goal, streak | `STA` |
| Love notes | `NTE` |
| Settings and personalisation | `SET` |
| Fly Mode | `FLY` |
| Update prompt | `UPD` |
| Ads | `ADS` |
| Storage and migration | `MIG` |
| Accounts | `ACC` |
| Pairing | `PAR` |
| Shared session and presence | `SYN` |
| Social | `SOC` |
| Modes | `MOD` |
| Monetization | `MON` |
| Web | `WEB` |

NFR categories: `PERF`, `REL`, `SEC`, `PRIV`, `A11Y`, `I18N`, `UX`, `MAINT`, `PORT`.

### 3.1 External interfaces

| Interface | Direction | Purpose | Phase |
|-----------|-----------|---------|-------|
| iOS local notifications (`expo-notifications`) | out | Session end, daily reminder | v1 |
| Haptics (`expo-haptics`) | out | Feedback | v1 |
| Apple Maps (`react-native-maps`) | in/out | Fly Mode's real map | v1 |
| iTunes Lookup API | in | iOS latest-version check | v1 |
| GitHub Pages `update.json` | in | Android/other latest-version check | v1 |
| Google AdMob | in/out | Free-tier interstitials | v1 |
| Supabase (HTTPS + WSS) | in/out | Auth, data, Realtime, push triggers | 2 |
| APNs (through Expo push) | out | Shared-session and partner events | 3 |
| RevenueCat | in/out | Purchases, entitlement webhook | 5 |
| Website `/invite/[code]` + universal links | in | Pairing links | 2/6 |

### 3.2 Functional requirements

#### 3.2.1 Timer (TMR)

#### FR-TMR-001
**Statement:** The timer shall run three phases: focus, then a short break, and after every `longBreakEvery`-th completed focus a long break, then focus again.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Accept:**
- Completing focus number *n* (counting from 1) of a cycle leads to a long break when *n* = `longBreakEvery`, which resets the count to 0; otherwise it leads to a short break and the count becomes *n*.
- Completing either break leads to focus with the count unchanged.
**Verify:** T: `src/hooks/__tests__/timerPhases.test.ts` · **Source:** v1 plan §5.1

#### FR-TMR-002
**Statement:** Skipping a session shall advance the phase without counting a skipped focus toward the long break.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Accept:**
- Skip on focus leads to a short break with the count unchanged.
- Skip on a break leads to focus.
**Verify:** T: `src/hooks/__tests__/timerPhases.test.ts` · **Source:** `useTimer.ts`

#### FR-TMR-003
**Statement:** The remaining time shall always be computed from a stored end timestamp (`remaining = endAt − now`), never by decrementing a counter.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Accept:**
- After backgrounding or locking for any duration, the displayed time equals the wall-clock remainder on return, with no catch-up animation.
**Verify:** T: `src/hooks/__tests__/useSessionClock.test.ts`; D: the device backlog's Task 1 · **Source:** [ADR](../architecture/adr/README.md) (timestamp timer), DECISIONS.md #3

#### FR-TMR-004
**Statement:** The user shall be able to start, pause, resume, skip and reset a session.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Accept:**
- Pause freezes the remaining time.
- Resume continues from the frozen value.
- Reset returns to focus with the cycle count at 0.
**Verify:** T: `src/hooks/__tests__/useSessionClock.test.ts` · **Source:** v1 plan §4.1

#### FR-TMR-005
**Statement:** A session's completion shall be handled exactly once, whether it is detected by the 1 Hz ticker, by the app returning to the foreground, or on a cold start after the app was killed.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Known deviation:** DEF-004 (suspected); see [§3.4](#34-known-deviations-as-built-found-2026-10-30).
**Accept:**
- The completion handlers run once.
- Stats are credited once.
- The slot is cleared.
**Verify:** T: `src/hooks/__tests__/useSessionClock.test.ts` (foreground+ticker race, cold start) · **Source:** v1 README "Idempotency"; [timer unification](../implementations/2026-04-19-timer-unification.md)

#### FR-TMR-006
**Statement:** The visible timer text shall update every second while a session runs, on the Classic screen and on the Fly screen.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Accept:**
- Under fake timers, the text goes 25:00 → 24:59 → 24:00.
- This must keep passing through the Phase 1 re-render refactor.
**Verify:** T: `src/context/__tests__/timerTextTicks.test.tsx`, `src/screens/__tests__/timerScreenTicks.test.tsx` · **Source:** PLAN-REHAUL §4.5

#### FR-TMR-007
**Statement:** The minutes credited for a session shall be the duration captured when the session started, not the setting at completion.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Accept:**
- Changing the focus length mid-session doesn't change the credited minutes.
**Verify:** D: the [Phase 4 test guide, Test F](../archive/PHASE4_TEST.md) · **Source:** DECISIONS.md #5

#### FR-TMR-008
**Statement:** A paused Pomodoro session shall be preserved unchanged while a Fly session runs, and the reverse.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Accept:**
- Pause Pomodoro at 15:00, then run and finish a Fly session: Pomodoro still shows 15:00 paused, and Resume works.
**Verify:** T: `src/hooks/__tests__/useSessionClock.test.ts` (two-slot) · **Source:** timer unification. **Superseded in v2** by [FR-SYN-001](#fr-syn-001): one engine, with modes as skins.

#### FR-TMR-009
**Statement:** Focus, short-break and long-break lengths and `longBreakEvery` shall be configurable within limits.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Accept:**
- Focus: 1–180 min.
- Short break: 1–60 min.
- Long break: 1–120 min.
- `longBreakEvery`: 2–10.
- Out-of-range input is rejected and the old value kept.
**Verify:** I: `SettingsScreen.tsx` validation · **Source:** code

#### FR-TMR-010
**Statement:** The user shall be able to pick a session preset: Classic 25/5, 50/10, 52/17 or 90/20.
**Pri:** Should · **Target:** Phase 1 (D1) · **Status:** planned
**Accept:**
- Choosing a preset sets the focus and short-break lengths.
- Custom values still work.
**Verify:** T (to be written) · **Source:** PLAN-REHAUL §3.5 #8, PLAN-PHASE1 D1

#### 3.2.2 Notifications and reminders (NTF)

#### FR-NTF-001
**Statement:** When notifications are on, starting or resuming a session shall schedule one local notification for its end, and pause, skip, reset or a mode switch shall cancel that one notification only.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Known deviation:** DEF-005; see [§3.4](#34-known-deviations-as-built-found-2026-10-30).
**Accept:**
- A paused session never fires a notification.
- Other scheduled notifications (the daily reminder) survive.
**Verify:** D: [Phase 4 test guide](../archive/PHASE4_TEST.md) Tests A–C · **Source:** DECISIONS.md #4

#### FR-NTF-002
**Statement:** The user shall be able to enable a daily reminder at a chosen time with quiet hours. A reminder time inside the quiet hours moves to the quiet-hours end.
**Pri:** Should · **Target:** v1 · **Status:** implemented
**Accept:**
- The defaults are 19:00 with quiet hours 22:00–08:00.
- Quiet hours that cross midnight are handled.
- Notification permission is asked only when the user enables reminders.
**Verify:** I: `src/utils/notifications.ts`; T (to be written) · **Source:** code

#### FR-NTF-003
**Statement:** Tapping a notification shall open the Timer tab.
**Pri:** Should · **Target:** v1 · **Status:** implemented · **Verify:** D

#### FR-NTF-004
**Statement:** In a shared session, the session-end alert and the partner's pause, resume and skip events shall reach both phones as server pushes, so a sleeping phone never shows a stale local alert.
**Pri:** Must · **Target:** Phase 3 · **Status:** planned
**Accept:**
- A partner pauses while my phone is locked: I get the pause push and no session-end alert at the old time.
**Verify:** D (two physical phones) · **Source:** PLAN-REHAUL §4.2

#### 3.2.3 Stats, goal and streak (STA)

#### FR-STA-001
**Statement:** Completed focus sessions shall be counted per day (sessions and minutes), attributed to the day the session **started**.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Known deviation:** DEF-001; see [§3.4](#34-known-deviations-as-built-found-2026-10-30).
**Accept:**
- A session started at 23:50 and finished at 00:15 counts toward the earlier day.
**Verify:** I: `useTimer.ts` uses `getDayKeyFromDate(sessionStartedAt)` · **Source:** code

#### FR-STA-002
**Statement:** A session's credit shall be applied at most once, even if its completion is replayed.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Known deviation:** DEF-001, DEF-002; see [§3.4](#34-known-deviations-as-built-found-2026-10-30).
**Accept:**
- `lastAppliedSessionId` blocks a second credit for the same `sessionId`.
**Verify:** I: `useStats.ts`; T (to be written) · **Source:** code

#### FR-STA-003
**Statement:** The Stats screen shall show today, all-time and a 7-day chart, switchable between sessions and minutes.
**Pri:** Must · **Target:** v1 · **Status:** implemented · **Verify:** D

#### FR-STA-004
**Statement:** The user shall be able to set a daily focus goal (presets 25, 50, 75 or 100, or custom 0–1440 min, where 0 means off; the default is 50). Reaching it shall show a celebration once per day.
**Pri:** Should · **Target:** v1 · **Status:** implemented · **Verify:** I: `useStats.ts` clamp; D

#### FR-STA-005
**Statement:** The streak shall count consecutive goal-hit days; a gap of 2 or more days since the last hit resets the current streak, and the best streak is kept.
**Pri:** Should · **Target:** v1 · **Status:** implemented · **Verify:** I: `normalizeStreakForToday`; T (to be written)
**Known deviation:** DEF-003; see [§3.4](#34-known-deviations-as-built-found-2026-10-30).

#### FR-STA-006
**Statement:** The Stats screen shall never crash when stats finish loading while it is mounted.
**Pri:** Must · **Target:** Phase 0 · **Status:** implemented
**Verify:** T: `src/screens/__tests__/StatsScreen.hooks.test.tsx` · **Source:** [Phase 0](../implementations/2026-10-29-phase0-foundation.md#33-the-stats-screen-fix)

#### FR-STA-007
**Statement:** The couple streak shall count a day as a hit when the couple's combined credited minutes reach the couple goal, in the couple's `home_tz`. One missed day per ISO week is covered automatically by a freeze.
**Pri:** Should · **Target:** Phase 3 · **Status:** planned · **Verify:** T · **Source:** PLAN-REHAUL §8.6

#### FR-STA-008
**Statement:** Plus users shall see their full history (monthly and yearly) and be able to export it as CSV.
**Pri:** Could · **Target:** Phase 5 · **Status:** planned · **Source:** PLAN-REHAUL §3.4

#### 3.2.4 Love notes (NTE)

#### FR-NTE-001
**Statement:** The user shall be able to add, edit and delete love notes. After a completed focus session (when enabled), a random note shall be shown, never the same note twice in a row when more than one exists.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Accept:**
- With zero notes, a fallback note is shown.
**Verify:** I: `useLoveNotes.ts` `pickRandomNote` · **Source:** v1 plan §4.4

#### FR-NTE-002
**Statement:** Fresh installs shall get name-free default notes. Existing installs keep their notes, including the Bengisu-era defaults when the user never edited them.
**Pri:** Must · **Target:** Phase 1 (B2, D2) · **Status:** planned
**Verify:** T: B2 migration tests over the `v131` fixtures · **Source:** PLAN-PHASE1 §0, B2

#### FR-NTE-003
**Statement:** Notes written by a partner shall be delivered to the other partner and shown after **their** focus sessions.
**Pri:** Must · **Target:** Phase 3 · **Status:** planned · **Source:** PLAN-REHAUL §3.5 #1

#### 3.2.5 Settings and personalisation (SET)

#### FR-SET-001
**Statement:** The settings shall persist across restarts: durations, notifications, sound, haptics, love notes on or off, theme mode (system, light or dark), background animations, and the Fly ambient sound.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Known deviation:** DEF-007; see [§3.4](#34-known-deviations-as-built-found-2026-10-30).
**Accept:**
- The defaults are those in `src/constants/defaults.ts`.
- New fields merge into saved settings without loss.
**Verify:** T: `src/__fixtures__/storage/__tests__/v131.test.tsx` (shapes) · **Source:** code

#### FR-SET-002
**Statement:** The app shall offer the Strawberry Milk (light) and Midnight Plum (dark) themes, generated from tokens whose text and background pairs meet the contrast floor ([NFR-A11Y-001](#nfr-a11y-001)).
**Pri:** Must · **Target:** Phase 1 (C1) · **Status:** planned · **Source:** DESIGN.md, PLAN-PHASE1 C1

#### FR-SET-003
**Statement:** Plus shall unlock further themes: Matcha Latte, Peach Soda and the seasonal themes.
**Pri:** Could · **Target:** Phase 5 · **Status:** planned · **Source:** PLAN-REHAUL §3.5

#### FR-SET-004
**Statement:** Focus start, break start and completion shall play short sounds (each ≤ 1.5 s and ≤ 25 KB), which respect the silent switch and a Settings toggle.
**Pri:** Should · **Target:** Phase 1 (D4) · **Status:** planned · **Source:** PLAN-PHASE1 D4; closes DECISIONS.md Q1

#### FR-SET-005
**Statement:** The app shall be available in English and Turkish, following the device language, with the UI copy reviewed in both.
**Pri:** Must · **Target:** Phase 1 (D3) · **Status:** planned · **Source:** PLAN-PHASE1 D3

#### 3.2.6 Fly Mode (FLY)

#### FR-FLY-001
**Statement:** In Fly Mode the user shall pick an origin and destination airport. The session length shall be derived from the great-circle distance as (distance / 900 km/h + band overhead) / 5, clamped to 5–180 min. In practice the minimum is 9 min.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Verify:** T: `src/utils/__tests__/geoMath.equivalence.test.ts` (`flightDurationToSeconds`) · **Source:** `geoMath.ts`

#### FR-FLY-002
**Statement:** The plane shall move along the great-circle path in step with the clock, including across the ±180° meridian. The UI-thread worklet and the JS interpolation shall agree to 1e-9.
**Pri:** Must · **Target:** v1 · **Status:** implemented
**Verify:** T: `src/utils/__tests__/geoMath.equivalence.test.ts` · **Source:** [plane clock-driven](../implementations/2026-04-20-plane-clock-driven.md)

#### FR-FLY-003
**Statement:** Fly Mode shall be offered only where it works: iOS today. A stored Fly mode on a platform without it shall open Classic.
**Pri:** Must · **Target:** Phase 0 · **Status:** implemented
**Verify:** T: `src/constants/__tests__/features.test.ts`, `src/context/__tests__/flyModeGuard.test.tsx` · **Source:** [android-hide-fly-mode](../implementations/2026-10-29-android-hide-fly-mode.md)

#### FR-FLY-004
**Statement:** Fly Mode code, the map library and the airport data shall load only when Fly is first opened.
**Pri:** Should · **Target:** Phase 1 (B1, B1b) · **Status:** implemented (B1 `5b10a78`, B1b `0d63145`; device check on the next TestFlight build)
**Verify:** T: `src/screens/__tests__/flyLazyLoad.test.tsx`, `src/utils/__tests__/airportAsset.test.ts`, `src/utils/__tests__/airportData.test.ts` · **Source:** [B1 doc](../implementations/2026-10-29-phase1-b1-lazy-fly-mode.md), [B1b doc](../implementations/2026-10-29-phase1-b1b-airports-asset.md)

#### FR-FLY-005
**Statement:** Fly Together shall show both partners' planes on one original illustrated world map, on every platform, with passport stamps on landing.
**Pri:** Must · **Target:** Phase 4b · **Status:** planned · **Source:** PLAN-REHAUL §4.8

#### FR-FLY-006
**Statement:** Before take-off, each partner shall tear a boarding pass, with a press-and-hold accessible alternative. The flight departs when both have torn it or after a 10 s grace. The animation can be turned off.
**Pri:** Could · **Target:** Phase 4b · **Status:** planned · **Source:** [ticket-cutting proposal](../proposals/ticket-cutting-feature.md), PLAN-REHAUL §2.5

#### FR-FLY-007
**Statement:** Plus users on phones shall be able to switch Fly Together to the real map.
**Pri:** Could · **Target:** Phase 4c · **Status:** planned (Android: deferred) · **Source:** PLAN-REHAUL §0

#### 3.2.7 Update prompt (UPD)

#### FR-UPD-001
**Statement:** Once per cold launch, the app shall check for a newer store version: iTunes Lookup on iOS, `update.json` elsewhere. When the store version is newer, it shall show a dismissible prompt, at most once per version.
**Pri:** Should · **Target:** v1 · **Status:** implemented · **Verify:** I: `useUpdateCheck.ts` · **Source:** [update check](../implementations/2026-04-17-app-store-update-check.md)

#### 3.2.8 Ads (ADS)

#### FR-ADS-001
**Statement:** Free users shall see an interstitial after a completed session only when **all** of these hold:
- at least 2 sessions have completed since the last ad
- at least 120 s have passed since it
- no love note or goal celebration is showing
- (v2) the user is not on Plus, is on a native platform, has no running shared session, and has resolved consent

**Pri:** Must · **Target:** v1 (rules 1–3), Phase 5 (rule 4) · **Status:** implemented / planned
**Known deviation:** DEF-006; see [§3.4](#34-known-deviations-as-built-found-2026-10-30).
**Verify:** I: `src/ads/AdPolicy.ts`; T (Phase 5) · **Source:** PLAN-REHAUL §8.7

#### FR-ADS-002
**Statement:** No ad request shall be made before Google UMP consent is resolved in the EEA, the UK and Switzerland. Non-personalised ads shall be served when consent is declined.
**Pri:** Must · **Target:** Phase 5 · **Status:** planned · **Source:** PLAN-REHAUL §4.6. Prior work exists in tag `archive/ios-ads-consent-1.2.3`.

#### 3.2.9 Storage and migration (MIG)

#### FR-MIG-001
**Statement:** Updating from any released version to a later one shall preserve every stored value: stats, notes, settings, reminder, clock and ad-policy state.
**Pri:** Must · **Target:** every release · **Status:** implemented (1.3.1 → 1.4.0 TestFlight passed A0); re-verified each release
**Verify:**
- T: `src/__fixtures__/storage/__tests__/v131.test.tsx`, plus the B2 migration tests
- D: E1 (a TestFlight build over App Store 1.3.1)

**Source:** PLAN-PHASE1 A3, B2, E1

#### FR-MIG-002
**Statement:** The one-time AsyncStorage → MMKV migration shall:
- copy every key
- write its done-flag last
- be safe to re-run after a crash at any point
- copy corrupt values as they are

AsyncStorage stays untouched for one release as a fallback.
**Pri:** Must · **Target:** Phase 1 (B2) · **Status:** implemented (`dd1e894`; device check on the next TestFlight build) · **Verify:** T: `src/utils/__tests__/storageMigration.test.ts`, `src/utils/__tests__/storage.test.ts` over every A3 fixture · **Source:** PLAN-PHASE1 B2, [B2 doc](../implementations/2026-10-29-phase1-b2-mmkv-migration.md)

#### FR-MIG-003
**Statement:** On first sign-in, local stats and notes shall be uploaded once, guarded by an idempotency key.
**Pri:** Must · **Target:** Phase 2 · **Status:** planned · **Source:** PLAN-REHAUL §7 Phase 2

#### 3.2.10 Accounts (ACC)

#### FR-ACC-001
**Statement:** The timer, stats, notes and Classic shall work fully without an account. An account is needed only to pair.
**Pri:** Must · **Target:** Phase 2 · **Status:** planned · **Source:** PLAN-REHAUL §3.2

#### FR-ACC-002
**Statement:** Users shall start with anonymous sign-in and be able to link Sign in with Apple, Google or an email magic link without losing data.
**Pri:** Must · **Target:** Phase 2 · **Status:** planned · **Source:** PLAN-REHAUL §4.1

#### FR-ACC-003
**Statement:** Users shall be able to delete their account inside the app. Deletion cascades through their data and dissolves the couple; the partner keeps their own history.
**Pri:** Must · **Target:** Phase 2 · **Status:** planned · **Source:** CON-005; PLAN-REHAUL §4.3

#### FR-ACC-004
**Statement:** Users shall be able to download all their data as JSON.
**Pri:** Must · **Target:** Phase 2 · **Status:** planned · **Source:** GDPR, KVKK

#### 3.2.11 Pairing (PAR)

#### FR-PAR-001
**Statement:** A user shall be able to invite a partner with a link or a 6-character code (no look-alike characters) that expires and can be used once. Opening the link shall open the app if installed, otherwise the store or the web app.
**Pri:** Must · **Target:** Phase 2 · **Status:** planned · **Source:** PLAN-REHAUL §4.3, §4.7

#### FR-PAR-002
**Statement:** A user shall belong to at most one couple at a time, and either partner shall be able to unpair.
**Pri:** Must · **Target:** Phase 2 · **Status:** planned · **Source:** schema `couple_members unique (user_id)`

#### 3.2.12 Shared session and presence (SYN)

#### FR-SYN-001
**Statement:** All modes shall run on one session engine. A mode adds visuals and a reward model, never its own clock.
**Pri:** Must · **Target:** Phase 3 · **Status:** planned · **Source:** PLAN-REHAUL §3.3

#### FR-SYN-002
**Statement:** Either partner shall be able to start a shared session, and both phones shall show the same clock. Pause, resume and skip by either partner shall apply to both.
**Pri:** Must · **Target:** Phase 3 · **Status:** planned
**Accept:**
- The displayed remaining time on two phones differs by ≤ 250 ms ([NFR-PERF-006](#nfr-perf-006)).
**Verify:** D (two phones) · **Source:** PLAN-REHAUL §0, §4.2

#### FR-SYN-003
**Statement:** The server shall own session time: commands carry no client timestamps, every command is idempotent, and concurrent commands resolve by optimistic concurrency without an error to the user.
**Pri:** Must · **Target:** Phase 3 · **Status:** planned · **Verify:** T (pgTAP + client) · **Source:** PLAN-REHAUL §4.2, §8.2

#### FR-SYN-004
**Statement:** Each partner shall be credited for the focus time they were present, once per session.
**Pri:** Must · **Target:** Phase 3 · **Status:** planned · **Source:** PLAN-REHAUL §8.3

#### FR-SYN-005
**Statement:** Commands made offline shall be queued and replayed on reconnect. If the server state moved on, it wins, and the UI explains what happened.
**Pri:** Must · **Target:** Phase 3 · **Status:** planned · **Source:** PLAN-REHAUL §4.2

#### FR-SYN-006
**Statement:** Each partner shall see the other's presence (focusing, break, idle or away), their intention and their local time.
**Pri:** Must · **Target:** Phase 3 · **Status:** planned · **Source:** PLAN-REHAUL §3.2, §3.5 #5–6

#### 3.2.13 Social (SOC)

#### FR-SOC-001
**Statement:** A partner shall be able to send a cheer, at most 1 per 5 minutes.
**Pri:** Should · **Target:** Phase 3 · **Status:** planned · **Source:** PLAN-REHAUL §3.5 #2

#### FR-SOC-002
**Statement:** The couple shall get a weekly recap card that can be shared to Stories.
**Pri:** Could · **Target:** Phase 4+ · **Status:** planned · **Source:** PLAN-REHAUL §3.5 #7

#### FR-SOC-003
**Statement:** Milestones (for example, the first 10 hours together) shall unlock with a celebration.
**Pri:** Could · **Target:** Phase 4+ · **Status:** planned

#### 3.2.14 Modes (MOD)

#### FR-MOD-001
**Statement:** Classic (free) shall be the redesigned timer, with Pomo & Doro reacting to phases and one sticker-placement moment on completion.
**Pri:** Must · **Target:** Phase 1 (D1) · **Status:** planned · **Source:** PLAN-PHASE1 D1, DESIGN.md

#### FR-MOD-002
**Statement:** Shared Garden (free) shall grow plants from growth points. Its growth formula, with a 1.5× together bonus and geometric stage thresholds, is in PLAN-REHAUL §8.5. There is **no decay**: missed days only show a sleepy pose.
**Pri:** Must · **Target:** Phase 4a · **Status:** planned

#### FR-MOD-003
**Statement:** The Study-date Room (Plus) shall unlock furniture and decor from focus minutes.
**Pri:** Should · **Target:** Phase 4d · **Status:** planned

#### FR-MOD-004
**Statement:** The Shared Pet (Plus) shall grow and gain happiness and tricks from joint focus, with no neglect penalties.
**Pri:** Should · **Target:** Phase 4e · **Status:** planned

#### 3.2.15 Monetization (MON)

#### FR-MON-001
**Statement:** One Plus purchase shall unlock Plus for both partners. The entitlement belongs to the buyer and follows them across unpairing and re-pairing.
**Pri:** Must · **Target:** Phase 5 · **Status:** planned · **Source:** PLAN-REHAUL §4.6

#### FR-MON-002
**Statement:** The Free tier shall include:
- Classic and the Shared Garden
- pairing, the shared room and presence
- cheers and partner notes
- 2 themes and 7-day stats
- capped ads

Plus adds Fly Together, the Study-date Room and the Shared Pet, all themes, full history, widgets and no ads.
**Pri:** Must · **Target:** Phase 5 · **Status:** planned · **Source:** PLAN-REHAUL §3.4

#### FR-MON-003
**Statement:** The paywall shall never appear before the user's first completed session, nor over a running session.
**Pri:** Must · **Target:** Phase 5 · **Status:** planned

#### FR-MON-004
**Statement:** Refunds and expiries shall revoke Plus through the webhook, and purchases shall be restorable.
**Pri:** Must · **Target:** Phase 5 · **Status:** planned

#### FR-MON-005
**Statement:** Purchases shall work on iOS (in-app purchase), on the web (Stripe through RevenueCat Web Billing), and on Android when it returns.
**Pri:** Must · **Target:** Phase 5–6 · **Status:** planned

#### FR-MON-006
**Statement:** A user shall be able to gift Plus to their partner, with a custom reveal screen (the heritage of today's gift screen).
**Pri:** Could · **Target:** Phase 5 · **Status:** planned · **Source:** PLAN-REHAUL §3.5 #12

#### 3.2.16 Web (WEB)

#### FR-WEB-001
**Statement:** The app shall run as a web app at `app.<domain>`, with no ads, in-tab and Web Push notifications, and haptics doing nothing.
**Pri:** Must · **Target:** Phase 6 · **Status:** planned · **Source:** PLAN-REHAUL §4.7

#### FR-WEB-002
**Statement:** The marketing site shall serve:
- `/invite/[code]`
- `/.well-known/apple-app-site-association` and `assetlinks.json`
- the privacy policy and terms in EN and TR

**Pri:** Must · **Target:** Phase 2/6 · **Status:** planned

### 3.3 Non-functional requirements

#### NFR-PERF-001
**Statement:** Cold-start time-to-interactive shall be ≤ 1.0 s on an iPhone 12-class device.
**Target:** Phase 1 E3 · **Status:** planned (baseline TBD) · **Verify:** D, measured on a TestFlight build · **Source:** PLAN-REHAUL §6.2

#### NFR-PERF-002
**Statement:** The startup JavaScript (Hermes bytecode) shall be smaller than the SDK 58 baseline: iOS 3,856,208 B, measured with `npx expo export --platform ios --platform android --dump-sourcemap`.
**Target:** Phase 1 · **Status:** planned · **Verify:** A · **Source:** [SDK 58 upgrade §6.1](../implementations/2026-10-29-expo-sdk-58-upgrade.md#61-local-gates-all-passed-at-every-step)

#### NFR-PERF-003
**Statement:** While a session runs, a component that doesn't display time shall not re-render. In the Reassure settings-only scenario, renders drop from 14 to ≤ 2, and the timer-text leaf renders once per displayed second.
**Target:** Phase 1 B4 · **Status:** planned · **Verify:** T: `src/context/__tests__/rerenders.perf-test.tsx`, `src/screens/__tests__/screens.perf-test.tsx` · **Source:** PLAN-PHASE1 B4

#### NFR-PERF-004
**Statement:** Animations shall hold ≥ 58 fps median on the slowest supported test device, with no frame over 32 ms during the completion moment.
**Target:** Phase 1 D1 · **Status:** planned · **Verify:** D (release build)

#### NFR-PERF-005
**Statement:** Asset budgets: an icon ≤ 2 KB, an illustration ≤ 30 KB, a mode scene ≤ 120 KB, a UI sound ≤ 25 KB.
**Target:** Phase 1 C3, D4 · **Status:** planned · **Verify:** A

#### NFR-PERF-006
**Statement:** Shared-session skew between two phones shall be ≤ 250 ms, and a partner state change shall be visible within 1 s at p95.
**Target:** Phase 3 · **Status:** planned · **Verify:** D · **Source:** PLAN-REHAUL §8.1

#### NFR-PERF-007
**Statement:** The Lighthouse mobile scores shall be at least:

| | Performance | Accessibility | Best Practices | SEO |
|--|-------------|---------------|----------------|-----|
| Marketing site | 95 | 95 | 95 | 95 |
| Web app | 85 | 95 | 95 | — |

**Target:** Phase 6 · **Status:** planned · **Verify:** T (Lighthouse CI) · **Source:** baseline in `docs/baselines/2026-10-29/`

#### NFR-REL-001
**Statement:** Crash-free sessions shall be ≥ 99.8 %.
**Target:** Phase 2 (Sentry) · **Status:** planned · **Verify:** A

#### NFR-REL-002
**Statement:** No update shall lose user data. See [FR-MIG-001](#fr-mig-001).
**Target:** every release · **Status:** implemented · **Verify:** T + D

#### NFR-REL-003
**Statement:** Every CI gate shall be green on the commit a store build is made from: typecheck, lint with 0 errors, and all tests.
**Target:** now · **Status:** implemented · **Verify:** I: [CI workflow](../../.github/workflows/ci.yml)

#### NFR-SEC-001
**Statement:** Row-level security shall be on for every table, tested so that a stranger can't read a couple's rows and a member can't write another couple's.
**Target:** Phase 2 · **Status:** planned · **Verify:** T (pgTAP)

#### NFR-SEC-002
**Statement:** No secret shall ship in the client or the repo, which is **public**. Only publishable keys (the Supabase anon key, AdMob ids) are allowed in `app.json`.
**Target:** now · **Status:** implemented · **Verify:** I

#### NFR-PRIV-001
**Statement:** Data shall be minimised. Analytics events are bucketed, carry no personal data and are kept for 90 days. There is no third-party tracking, so no App Tracking Transparency prompt.
**Target:** Phase 2 · **Status:** planned · **Source:** PLAN-REHAUL §4.3

#### NFR-PRIV-002
**Statement:** A privacy policy (EN/TR) shall describe exactly what is collected, replacing the README's out-of-date "no server connections" claim.
**Target:** Phase 2 · **Status:** planned

#### NFR-A11Y-001
**Statement:** Text and background pairs shall meet a contrast of 4.5:1 for body text and 3:1 for large text and icons.
**Target:** Phase 1 C1 · **Status:** planned · **Verify:** T (`npm run check:contrast`)

#### NFR-A11Y-002
**Statement:** Touch targets shall be at least 44×44 pt on iOS and 48×48 dp on Android.
**Target:** Phase 1 (C3, D1) · **Status:** planned · **Verify:** I + D

#### NFR-A11Y-003
**Statement:** The app shall support Dynamic Type up to the largest size with nothing clipped, and VoiceOver labels on every control.
**Target:** Phase 1 D3, E2 · **Status:** planned · **Verify:** D

#### NFR-A11Y-004
**Statement:** With Reduce Motion on, translate, scale, particles and overshoot shall be dropped, keeping opacity and colour. Every gesture shall have a non-gesture alternative.
**Target:** Phase 1 D1 · **Status:** planned · **Verify:** D

#### NFR-I18N-001
**Statement:** All user-visible strings shall be externalised. Turkish casing shall use `tr-TR` (İ/ı), and the display face shall cover Turkish glyphs with tabular figures.
**Target:** Phase 1 C2, D3 · **Status:** planned · **Verify:** I + D

#### NFR-UX-001
**Statement:** The product shall never punish: no dying pets, no lost gardens, no guilt copy.
**Target:** all phases · **Status:** implemented · **Verify:** I · **Source:** PRODUCT.md principles

#### NFR-UX-002
**Statement:** No emoji shall render as an icon in the UI. Emoji are allowed only in user text and push copy.
**Target:** Phase 1 D2 · **Status:** planned · **Verify:** T (a grep check over `src/`)

#### NFR-UX-003
**Statement:** Primary screens shall score ≥ 16/20 in the Impeccable native audit.
**Target:** Phase 1 D1 · **Status:** planned · **Verify:** I

#### NFR-MAINT-001
**Statement:** Every meaningful change shall come with an implementation record and keep the docs check green ([DOCS.md](../process/DOCS.md)).
**Target:** now · **Status:** implemented · **Verify:** I + T (`scripts/docs/check-docs.mjs`)

#### NFR-MAINT-002
**Statement:** Every implemented `Must` requirement shall have at least one automated test or a recorded device check in [TRACEABILITY.md](../testing/TRACEABILITY.md).
**Target:** v1.4.0 · **Status:** planned · **Verify:** A

#### NFR-PORT-001
**Statement:** The same codebase shall build for iOS, the web and (when it returns) Android. A feature that can't run on a platform is hidden there, never crashes ([FR-FLY-003](#fr-fly-003)).
**Target:** all phases · **Status:** implemented · **Verify:** T + D

### 3.4 Known deviations (as built, found 2026-10-30)

These are places where the code at `5b10a78` doesn't fully meet a requirement marked `implemented`. They were found while the architecture was being documented and checked against the code. Each is fixed in the plan task named, and the fix comes with a test.

| ID | Requirement | Deviation | Evidence | Severity | Fix in |
|----|-------------|-----------|----------|----------|--------|
| DEF-001 | FR-STA-001, FR-STA-002 | Fly Mode credits its minutes without the session's start day or id, so a Fly session that crosses midnight counts toward the wrong day, and a replayed completion isn't de-duplicated. | `FlyModeScreen.tsx:382` calls `stats.incrementFocus(minutes)`; Pomodoro passes both (`useTimer.ts:112`) | Medium | Phase 1 B3 (stats store) |
| DEF-002 | FR-STA-002 | The de-duplication key `lastAppliedSessionId` isn't restored when stats load, so it only protects within one run. Across a restart, only the clock's `endAt` guard prevents a double credit. | `useStats.ts:118–145` rebuilds state without it | Low | Phase 1 B2/B3 |
| DEF-003 | FR-STA-005 | The streak's "yesterday" is computed from the current date, not the credited day. A goal reached by a session that started before midnight and finished after it can reset the streak to 1. | `useStats.ts` (`yesterdayKeyDate = new Date()`), versus the credited `dayKey` | Low | Phase 1 B3 |
| DEF-004 | FR-TMR-005 | **Suspected, not yet reproduced:** a Fly session that ends while the app is killed may not be credited. The clock fires its cold-start completion as soon as its own state loads, but `FlyModeScreen` subscribes only after the mode loads and the lazy import resolves. The cold-start test covers Pomodoro only. | `useSessionClock.ts` mount effect; `AppContext.tsx` mode load; B1 lazy load | Medium | Phase 1 B3/B4: write the failing test first |
| DEF-005 | FR-NTF-001 | When scheduling the session-end notification takes more than 1 s, its id is dropped. That notification can't be cancelled, so a paused or skipped session may still alert. | `useTimer.ts:158–170` (`Promise.race` with a 1 s timeout) | Low–Medium | Phase 1 B3 |
| DEF-006 | FR-ADS-001 | The Stats screen shows an AdMob **banner** outside `AdPolicy`, including during a running session; the requirement covers interstitials only. | `StatsScreen.tsx:297` | Product decision | Phase 1 D2: keep it under the policy, or remove it |
| DEF-007 | FR-SET-001 | The `sound` setting has no effect yet (sounds arrive in D4), and the tab bar's haptic ignores the Haptics setting. | `HapticTab.tsx`; no reader of `settings.sound` | Low | Phase 1 D4 (sound); B3 (haptics) |

---

## 4. Verification

Each requirement names its method (T, D, I or A). The current mapping of requirements to tests, docs and status is generated in [TRACEABILITY.md](../testing/TRACEABILITY.md); how the tests are organised and gated is in the [test strategy](../testing/TEST-STRATEGY.md).

## 5. Data requirements

The v1 on-device keys and their shapes are pinned by the A3 fixtures (`src/__fixtures__/storage/v131.ts`) and listed in the [architecture §8](../architecture/ARCHITECTURE.md). The v2 cloud schema (14 tables, indexes and RLS) is specified in [PLAN-REHAUL §4.3](../implementations/2026-10-29-couples-rehaul-plan.md#43-database-schema-indexes-and-rls) and becomes its own data-model document in Phase 2.

## 6. Open issues (TBD)

| Item | Owner | Needed by |
|------|-------|-----------|
| The public name. Candidates: Pomo Pair, Tomatwo, Pomo & Doro, Two Tomatoes | Owner (store and trademark check) | Phase 7 |
| A custom domain, needed now because `*.vercel.app` was unreachable from the owner's network | Owner | Phase 2 (invites) |
| Plus pricing | Owner, after a competitor check | Phase 5 |
| The Android return date (Play's closed-test rule) | Owner | — |
| The version number for each of Phases 2–6 | Owner + roadmap | Each phase's plan |
| Which v1.x versions actually reached users (only 1.3.1 is recorded) | Owner | [CHANGELOG.md](../../CHANGELOG.md) |

## 7. Change history

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-10-30 | First SRS: as-built v1.3.1 + Phase 0/1 work, and the v2 rehaul requirements from PLAN-REHAUL and PLAN-PHASE1 |

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../CHANGELOG.md)
- [Contributing](../../CONTRIBUTING.md)
- [Valentine Pomodoro](../../README.md)
- [Documentation map](../README.md)
- [Architecture — Valentine Pomodoro (as built, and the v2 target)](../architecture/ARCHITECTURE.md)
- [Original v1 implementation plan (2026-01-07)](../history/2026-01-07-v1-plan.md)
- [Documentation system, release history and branch cleanup](../implementations/2026-10-30-documentation-system.md)
- [Documentation conventions](../process/DOCS.md)
- [Roadmap — Valentine Pomodoro v2](../roadmap/ROADMAP.md)
- [Test strategy](../testing/TEST-STRATEGY.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
