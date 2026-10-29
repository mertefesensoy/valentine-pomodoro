# 2026-10-29 — v2 Couples Rehaul: Plan

**Status:** Plan, awaiting your review. No code has been changed.
**Base:** `release/ios-1.3.0` @ `c527044` (app v1.3.1, build 6)
**Target branch:** `rehaul/v2`, cut from `master` after `master` becomes trunk again (Phase 0)

This document is the input to every v2 task. Each phase ends with its own implementation doc in `docs/implementations/`, written from `_TEMPLATE.md`.

---

## 0. Decisions you made (2026-10-29)

| Topic | Decision |
|-------|----------|
| Identity | A **public couples product**. It gets a new name and brand but **keeps the bundle id** `com.bengisu.valentinepomodoro`, so existing installs (including Bengisu's stats) update in place. |
| Backend | **Supabase**: Postgres, Auth, Realtime, Edge Functions, Storage and pg_cron. |
| Studying together | A **shared room plus presence**. One partner starts a session and both phones run it; either partner can pause or skip it. A partner studying solo still shows live status, and can receive cheers. |
| Revenue | A **couple subscription** ("Plus", one purchase covers both partners) **plus capped ads on the free tier**. |
| Free vs Plus | **Free:** Classic timer, shared room, presence, cheers, Shared Garden, 2 themes, 7-day stats, capped ads. **Plus:** Fly Together, Study-date Room, Shared Pet, all themes, full history, widgets, no ads. |
| Modes | Classic, **Fly Together**, **Shared Garden**, **Study-date Room**, **Shared Pet**, plus an audit of new themes and ideas (§3.5). |
| Fly map | An **illustrated kawaii map for everyone**. The real map (react-native-maps) stays as a **phone-only Plus extra**. |
| Art | **All vector art is made with the open-source VectorCraft** (v0.16, installed here at `C:\Program Files\VectorCraft`). |
| Platforms | **iOS, Android and the full web app.** The marketing site at `CVWebpage/Valentine Pomodoro Website` (Next.js 16, EN/TR) stays the public site. |
| Branch | First make **`master` trunk** (merge `release/ios-1.3.0` and the privacy-policy commit from `origin/master`), then branch `rehaul/v2`. |

Your list had "remove unnecessary re-renders" and "add loading skeletons" twice. Each is planned once.

---

## 1. Problem / Motivation

### 1.1 What the app is today (verified against code, not docs)

- **Stack:** Expo SDK 54, React Native 0.81.5, React 19.1, Reanimated 4.1 (New Architecture on), React Navigation 7 static API, AsyncStorage.
- **Data:** everything is local. There is no backend and no accounts.
- **Size:** about 8,900 lines of TypeScript.
- **Modes:** Classic Pomodoro, and Fly Mode, which flies a plane over a real map (react-native-maps; `FlyModeScreen.tsx` alone is 1,246 lines).
- **Already built:** daily goal and goal-based streak (`useStats`, `StreakState`), configurable durations, love notes CRUD, daily reminder with quiet hours, gift screen, update prompt, dark mode, landscape and iPad layouts.
- **Ads:** AdMob interstitials, at most one every 2 sessions and 120 s (`AdPolicy.ts`).

### 1.2 What is wrong with it

| # | Finding | Evidence | Why it matters |
|---|---------|----------|----------------|
| F1 | The whole app re-renders once a second while a timer runs. | `useSessionClock` returns a new object every render. `AppContext`'s `useMemo` lists `session`, so it recomputes on every tick, and every `useApp()` consumer re-renders, including tabs that are mounted but hidden. | Wasted CPU and battery today, and new modes would multiply it. **This chain is also what updates the timer text** (documented in `useSessionClock.ts` and `scale-plan.md`), so a careless `React.memo` would silently freeze the timer. |
| F2 | The 648 KB `airports.json` and the whole map stack are in the startup bundle. | `TimerScreen` imports `FlyModeScreen` statically, and `FlyModeScreen.tsx:45` imports the JSON. | Slower cold start for every user, including those who never open Fly Mode. |
| F3 | Android ads earn nothing. | `app.json`: the Android app id and interstitial id are Google's public **test** ids (`ca-app-pub-3940256099942544…`), and the Android banner id is `REPLACE_WITH_ANDROID_BANNER_UNIT_ID`. | Lost revenue, and a policy risk if test ids reach production. |
| F4 | `master` is not trunk. | `master` is 53 commits behind `release/ios-1.3.0`, and `origin/master` has one commit (`79c5675`, privacy policy) that the release branch lacks. | New work would branch from stale code. |
| F5 | Version drift. | `package.json` says 1.2.5; `app.json` says 1.3.1. | Confusing builds and update prompts. |
| F6 | No tests, no CI, no lint gate. | No test files or workflow files exist. | Sync, payments and five modes cannot be made robust without them. |
| F7 | No device check has been done. | All of about 60 items in `docs/device-check-backlog.md` are unchecked. | Your own memory note records that a TDZ crash shipped through three tasks because device checks were deferred. |
| F8 | Template leftovers and unused packages. | Unused: `HelloWave`, `ParallaxScrollView`, `Collapsible`, `ExternalLink`, `navigation/screens/Explore.tsx` and `Home.tsx`, `react-logo*.png`, `partial-react-logo.png`, `scripts/reset-project.js`. `geolib` has 0 imports. `WaveLines` is referenced nowhere. | Bundle weight and noise. |
| F9 | The README's privacy claim is already false. | It says "No server connections", but the app calls the iTunes Lookup API, GitHub Pages (`update.json`) and AdMob. | It would be legally wrong once accounts exist. |
| F10 | The visual language fights the new direction. | There are 37 emoji glyphs used as icons across 13 files. The aurora backgrounds are lilac→violet→periwinkle gradients. The iOS tab bar is a blur. | Impeccable bans emoji-as-icons, purple-to-blue gradients and decorative glass. A consistent kawaii brand needs its own icon and illustration set. |
| F11 | Doc convention gap. | `docs/implementations/_TEMPLATE.md` did not exist. | **Fixed in this change** (created). |

### 1.3 Goal

A couples study app that is cute, fast, robust and profitable. Two people pair once, then study together in a shared, perfectly synced timer, wrapped in one of five kawaii modes. It must run on iOS, Android and the web, keep every existing user's data, and earn money from a couple subscription and capped free-tier ads.

---

## 2. Audit of previous plans

### 2.1 `../../PLAN.md` (2026-01-07, v1 build plan)

**Status: executed, superseded.** All 10 phases shipped. Still valid and carried into v2:

- the timestamp-based timer (`remaining = endAt − now`)
- notification-id tracking
- duration captured at session start
- idempotent completion

Stale items:

- "System fonts only" and "no chart library" were v1 decisions; v2 revisits fonts (§5.2).
- Its testing checklist was never automated.

### 2.2 `../../DECISIONS.md`

The "Future Enhancements" list is out of date. Its items stand as follows:

- **Done:** streaks, daily goal, custom lengths, pause, dark mode, daily reminder nudges.
- **Not done:** CSV export and saved presets.

Open questions Q1–Q3 were never closed:

- **Q1 (sound):** the README still says completion sound is stubbed.
- **Q2 (hearts):** settled by the shipped `GiftModeModal`.
- **Q3 (chart axis):** settled by the sessions/minutes toggle.

**Action:** close all three in the Phase 1 doc. Sound returns as a designed sound set in Phase 1.

### 2.3 `../scale-plan.md` (2026-04-20)

| Scale-plan item | Status in code | v2 verdict |
|-----------------|----------------|------------|
| 1. Unit test harness, starting with `interpolateAlongPathWorklet` ≡ `interpolateAlongPath` | Not done | **Keep, Phase 0.** It is still required while the real map exists (Plus). |
| 2. Android / Google Maps camera parity (`useCameraController`) | Not done | **Moved to Phase 4c.** It only blocks the real map, which is now a phone-only Plus extra. |
| 3. Configurable session shapes | Half done. The plan wrongly says the durations are hardcoded, but `useTimer.getCurrentDuration()` already reads settings. The 52/17 and 90/20 presets do not exist. | **Keep the presets** (Phase 1, small). |
| 4. Curated route library | Not done | **Becomes the illustrated map's city and route list** (Phase 4b). |
| 5. Local streaks | **Done**, goal-based | Extend to a **couple streak** (§8.6). |
| Couple mode: "the session lands only if both complete" | Not done | **Replaced** by your shared-room model: one shared clock, and each partner is credited for the time they were present (§8.3). |
| Couple mode: "push token not stored server-side" | — | **Reversed.** Shared sessions need server pushes (§4.3), so tokens are stored, protected by row-level security (RLS). |
| Nudges capped at 1 per 5 min | Not done | **Keep** as "cheers". |
| Telemetry: anonymous, bucketed, 30-day local queue | Not done | **Keep the principle**, implemented with Sentry for errors plus a minimal event table (Phase 2). |
| The `setDisplayTick` constraint | Load-bearing today | **Replaced on purpose in Phase 1**, guarded by a test written first (§4.5). |

### 2.4 `../device-check-backlog.md`

None of its items are checked. Most concern Fly Mode internals (sheet snaps, five camera modes, plane-on-real-map) that the illustrated map replaces.

- **Run now, in Phase 0, on the current v1.3.1 build:** the Regression Gates, Task 1 (unified clock) and the AIRMap crash regressions. That build is what users have, and Phase 1 ships to them.
- **Carry to Phase 4c:** Tasks 2–4, because the real map inherits them.
- **Retire:** everything else, closed in the Phase 4c doc.

### 2.5 `../proposals/ticket-cutting-feature.md`

Its open questions are unanswered: what an interrupted tear does, and the accessibility fallback. Its risk note about cold-start restore is still correct.

**v2 proposal:** make it the **Fly Together boarding moment**. Each partner tears their own ticket, and the flight departs when both have torn or after a 10 s grace.

- An interrupted tear springs back.
- The accessibility fallback is a "Board" button (press and hold for 600 ms).
- It is on by default with a Settings toggle, as you decided earlier.
- It routes through the same `session.start` command as a tap.

### 2.6 `../../PHASE4_TEST.md`

Superseded by the device backlog and by the automated tests in Phase 0. It is archived in Phase 0.

### 2.7 `../implementations/2026-04-*` and `2026-05-05-*`

These remain the record for the real-map code.

Your memory notes are encoded below as Phase 4c rules:

- never return `null` inside a MapView child `.map()`
- `fullH` geometry is coupled to `FlyModeScreen`
- a SharedValue synced through `useEffect` lags one frame

---

## 3. Product definition

### 3.1 Name and brand (decision needed before Phase 7; working name until then)

The concept is a kawaii **tomato couple**. *Pomodoro* is Italian for tomato, so the mascots are two small tomatoes, **Pomo & Doro**. They star in every mode and in the app icon.

Name candidates:

- **Pomo Pair**
- **Tomatwo**
- **Pomo & Doro**
- **Two Tomatoes**

You need to check App Store, Play Store and trademark availability yourself. The App Store name can change on the same bundle id, so the listing, its reviews and its users all carry over.

The heritage stays as a feature: gift mode becomes **"Gift Plus to your partner"**, a custom reveal screen like today's `GiftModeModal` (§3.5, idea 12).

### 3.2 Core loop

1. **Pair once.** Send an invite link or a 6-character code.
2. **Start together.** Either partner taps Start. Both phones run the same clock, and the partner gets a push: "Bengisu started a 25-min focus 🍅". (Push copy may use emoji; the UI does not.)
3. **Focus.** Each of you sees the other's presence and session intention ("Chapter 4 notes").
4. **Break.** Send a cheer, and read the love note your partner wrote for you.
5. **Reward.** The active mode reacts: the garden grows, the plane lands, the pet levels up, the room gets a new decoration.
6. **Weekly recap.** A shareable couple recap card, which is also the growth loop.

Solo use without an account keeps working exactly as it does today. An account is needed only to pair. This protects existing users and makes App Store review easier.

### 3.3 Modes: one engine, five skins

Every mode is a **skin over the same session engine** (§4.2). A mode adds visuals and a reward model, never its own clock. This removes today's two-slot clock, which existed only because Fly and Pomodoro were separate timers.

| Mode | Tier | What happens | Reward model |
|------|------|--------------|--------------|
| **Classic** | Free | The redesigned timer and ring, with Pomo & Doro reacting to phases. | Stats and streak. |
| **Shared Garden** | Free | A small garden plot you share. Focus grows plants and tomatoes; breaks water them. | Growth points (§8.5). **No decay and no death.** Missed days only make the plants look sleepy. |
| **Fly Together** | Plus | Both partners' planes fly the same route over an **illustrated world map** with landmark doodles. They land together, after the boarding-pass tear. | Stamps in a shared passport. |
| **Study-date Room** | Plus | A cozy room scene with your two avatars studying side by side. | Focus minutes unlock furniture and decor. |
| **Shared Pet** | Plus | A small original creature you raise together (not a recreation of any existing game). | Happiness, size and tricks, all from joint focus. No neglect penalties. |
| Fly Together, real map | Plus, phones only | Today's react-native-maps experience, kept as an option inside Fly Together. | Same as Fly Together. |

### 3.4 Free vs Plus

| Free | Plus (one purchase covers the couple) |
|------|---------------------------------------|
| Classic, Shared Garden | + Fly Together (illustrated and real map), Study-date Room, Shared Pet |
| Pairing, shared room, presence, cheers, partner love notes | Same |
| 2 themes (Strawberry Milk, Midnight Plum) | All themes, including seasonal ones |
| 7-day stats, current streak | Full history, monthly and yearly charts, CSV export |
| Capped interstitial ads on native (never during a running shared session) | No ads |
| — | Home-screen widgets, and an iOS Live Activity showing both timers (Phase 7 or later) |

### 3.5 Ideas and themes audit (you asked for new ideas)

| # | Idea | Verdict | Why |
|---|------|---------|-----|
| 1 | **Partner love notes.** The notes you write show up on *your partner's* phone after their focus session. | **v2 core, Free** | This turns the best existing feature into a couple feature, at almost no cost. |
| 2 | Cheers and nudges (1 per 5 min, from the scale-plan) | v2, Free | Presence needs a lightweight way to interact. |
| 3 | Couple streak with 1 automatic "freeze" per week | v2, Free | Builds on the existing streak without punishing either partner (§8.6). |
| 4 | Couple daily goal (combined minutes) | v2, Free | The existing `goalMinutes` extended to two people. |
| 5 | Session intention ("what I'm working on"), shown to the partner | v2, Free | Cheap, and it makes presence meaningful. |
| 6 | Long-distance aware: the partner's local time, plus "study date" scheduling with a reminder to both | v2, Free (scheduling is Plus) | Long-distance couples are a core audience. |
| 7 | Weekly couple recap card, shareable to Stories | v2 | Organic growth loop. |
| 8 | Session presets: Classic 25/5, 50/10, 52/17, 90/20 | v2, Free | From the scale-plan. Small. |
| 9 | Boarding-pass tear (§2.5) | v2, Fly Together | A delight moment, with an accessibility fallback. |
| 10 | Milestones (first 10 hours together, 100 sessions, a flight to every continent) | v2 | The scale-plan concept, now for couples. |
| 11 | Synced ambient sound mixer (rain, café, fireplace) | Later, Plus | Needs an audio asset budget and a sync design. |
| 12 | Gift Plus to your partner, with a custom reveal | v2, Phase 5 | Revenue, and it keeps the app's origin story. |
| 13 | Widgets and iOS Live Activity | Phase 7 or later, Plus | Needs native targets. High retention value. |
| 14 | Break-time co-op doodle | Later | Scope risk. Revisit after launch. |
| 15 | Groups of more than 2, Apple Watch, AI study buddy | Skip for v2 | Dilutes the couples positioning, or is high cost. |

**Themes:**

- **Strawberry Milk** (light default, Free)
- **Midnight Plum** (dark default, Free)
- **Matcha Latte** (Plus)
- **Peach Soda** (Plus)
- Seasonal, Plus: **Sakura** (spring), **Cozy Autumn**, **Snow Globe** (winter), **Valentine** (February)

Each theme is a full token set (§5.2) plus one VectorCraft illustration pack. Every pair is checked for contrast.

---

## 4. Architecture

### 4.1 Stack changes

| Concern | Today | v2 | Why |
|---------|-------|----|-----|
| Expo SDK | 54 | Latest stable at Phase 0 (`npx expo install --check`) | Security fixes and current Reanimated/Router. Upgraded *before* the refactor so the two are not mixed. |
| Navigation | React Navigation 7, static API | **Expo Router** (file-based, built on React Navigation) | Web URLs, universal-link invites (`/invite/[code]`), and per-route bundle splitting on web. |
| App state | One `AppContext` holding everything | **Zustand** stores with selectors (settings, notes, session, UI) | A component re-renders only when the slice it selects changes. This fixes F1 structurally. |
| Server state | — | **TanStack Query**, with its cache persisted to MMKV | Caching, deduplication, retries, offline replay and pagination built in. |
| Storage | AsyncStorage JSON blobs | **react-native-mmkv** (falls back to localStorage on web) | Synchronous reads, so the first frame needs no loading flash; about 10–30× faster than AsyncStorage (vendor benchmark, to be re-measured in Phase 1). |
| Backend | none | **Supabase**: Postgres, Auth, Realtime, Edge Functions, Storage, pg_cron | Your decision. Postgres makes indexing and N+1 work real. |
| Auth | none | Anonymous sign-in (solo), then link **Sign in with Apple**, Google or an email magic link to pair | Solo use stays account-free. Apple requires Sign in with Apple when Google sign-in is offered. |
| Payments | none | **RevenueCat**: App Store, Play, and Web Billing (Stripe) | One entitlement across all three platforms; a webhook feeds the couple entitlement (§4.6). |
| Ads | AdMob (Android ids are test ids) | AdMob on native, free tier only, real ids, Google UMP consent | F3, plus GDPR/KVKK consent. |
| Fly map | react-native-maps | **Illustrated SVG map** (react-native-svg + Reanimated); react-native-maps kept for phone Plus only, loaded lazily | Works on every platform, removes the crash class from the default path, and replaces the 648 KB dataset with a curated list (§4.8). |
| Art | PNG and emoji | **VectorCraft-built SVG** components and exported rasters | Your decision (§5.4). |
| i18n | English only | English and Turkish (`expo-localization` + `i18next`) | The website is already EN/TR. |
| Errors and analytics | none | **Sentry** (crashes, with source maps from EAS) plus a minimal `events` table | Robustness. Privacy-light, disclosed in the new policy. |
| Tests | none | Jest + React Native Testing Library, **Reassure** (render-count and time regression tests), **Maestro** (end-to-end on device and simulator), **pgTAP** (database and RLS tests) | Robustness (F6). |
| CI | none | GitHub Actions running typecheck, lint, unit tests, pgTAP against a local Supabase, Lighthouse CI on web, and EAS preview builds on PRs | Robustness. |
| OTA updates | Custom update prompt (iTunes Lookup and `update.json`) | **EAS Update** for JS fixes (served from a CDN), with the store prompt kept for native releases | Fixes reach users in minutes. |

### 4.2 The shared session engine (the core of v2)

**The rule:** the server owns time. Clients never send timestamps; every command runs in SQL using Postgres `now()`. Clients only *display* time, after correcting for their clock offset (§8.1). This is the same idea as v1's "`endAt` is the source of truth", moved to the server.

**Session row** (`sessions`):

- `id`, `couple_id` (null for a solo session), `owner_id`, `mode`, `phase` (`focus | shortBreak | longBreak`)
- `status` (`running | paused | completed | stopped`)
- `duration_ms`, `started_at`, `paused_at`, `paused_total_ms`, `ends_at`
- `version`, `cycle_index`, `intention`

**Commands** are Postgres RPCs, each wrapped in an Edge Function only where a push is needed:

- `session_start(couple_id, mode, phase, duration_ms)`
- `session_pause(id, expected_version)`
- `session_resume(id, expected_version)`
- `session_skip(id, expected_version)`
- `session_stop(id, expected_version)`

Each command is **idempotent**: pausing a paused session succeeds as a no-op. Each uses **optimistic concurrency** (§8.2). If both partners tap Pause in the same instant, one wins and the other gets the already-paused state back. No error is shown.

**Realtime:**

- The channel `couple:{id}` carries `postgres_changes` on `sessions` (filtered by `couple_id`) and **Presence**: `{ user_id, status: focusing|break|idle|away, intention, session_id }`.
- Clients apply incoming rows directly to the TanStack Query cache with `setQueryData`, so no refetch storms happen.
- **Timer ticks are never sent over the network.** Only state changes are: about 6 messages per session instead of one per second.

**Completion and notifications:**

| Case | Who fires the "session done" alert | Why |
|------|------------------------------------|-----|
| Solo session | A **local notification** scheduled for `ends_at` (today's code path). | Works offline. Only the owner can change the session, and their phone is running the app when they do, so it can cancel and reschedule. |
| Shared session | A **server push** from a completion worker: `pg_cron` every 10 s → `UPDATE … SET status='completed' WHERE status='running' AND ends_at <= now() RETURNING …` → an Edge Function sends an Expo push to both partners. | If your partner pauses while your phone is asleep, a local notification on your phone could not be cancelled and would fire at the wrong time. The server knows the truth. Worst-case latency is about 10 s plus delivery. **The 10 s schedule needs pg_cron ≥ 1.5 (seconds schedules); verify the Supabase project's version in Phase 2.** The fallback is a 1-minute job, with foreground clients still completing on time (next row) and only the background push arriving up to about 60 s late. |
| Partner pauses, resumes or skips | A server push ("Doro paused the session"). | Same reason. |
| Foreground | The client completes optimistically at the corrected `ends_at`, and the server confirms. | No visible lag. |

**Crediting stats** is server-side and idempotent:

- A `session_credits(session_id, user_id, focus_ms)` row is inserted by the completion worker, with a unique key on `(session_id, user_id)`.
- The rule from v1 (`lastAppliedSessionId`) becomes a database constraint, so double-crediting is impossible even when the app is killed mid-flight.
- **Solo sessions are credited on the device**, through today's `incrementFocus` path, so solo stats never depend on the server or on an account. Once the user has an account, each solo credit is also uploaded as a `session_credits` row keyed by the client-generated `session_id`. The same unique constraint makes that upload idempotent, so retries and replays cannot double-count.

**Offline:**

- Solo sessions run fully offline and sync upward later (a queued TanStack mutation).
- Shared sessions keep counting locally from the last known `ends_at`.
- Commands made while offline are queued. On reconnect they are replayed with `expected_version`; if the session moved on, the server state wins and the UI explains it ("Bengisu skipped the break while you were offline").

### 4.3 Database schema, indexes and RLS

| Table | Key columns | Indexes (beyond the PK) |
|-------|-------------|-------------------------|
| `profiles` | `id` (= `auth.users.id`), `display_name`, `avatar` (VectorCraft avatar recipe as JSON), `tz`, `locale` | — |
| `couples` | `id`, `home_tz`, `created_at`, `plus_until`, `goal_minutes` | — |
| `couple_members` | `couple_id`, `user_id`, `role`, `joined_at` | **unique (`user_id`)**: one couple per user in v2. PK (`couple_id`, `user_id`) |
| `invites` | `code` (6 chars, no look-alike characters), `couple_id`, `created_by`, `expires_at`, `used_at` | unique (`code`); partial on (`expires_at`) where `used_at is null` |
| `sessions` | see §4.2 | (`couple_id`, `started_at desc`, `id desc`); (`owner_id`, `started_at desc`, `id desc`); **partial (`ends_at`) where `status = 'running'`** for the completion worker |
| `session_participants` | `session_id`, `user_id`, `joined_at`, `left_at` | PK (`session_id`, `user_id`) |
| `session_credits` | `session_id`, `user_id`, `focus_ms`, `day_key` | unique (`session_id`, `user_id`); (`user_id`, `day_key`) |
| `daily_stats` | `owner_kind` (user or couple), `owner_id`, `day_key`, `focus_ms`, `sessions`, `goal_hit` | PK (`owner_kind`, `owner_id`, `day_key`). **A rollup kept by a trigger on `session_credits`**, so stats screens never aggregate raw sessions. |
| `love_notes` | `id`, `couple_id`, `author_id`, `recipient_id`, `body`, `created_at`, `shown_at` | (`recipient_id`, `shown_at` nulls first, `created_at`) |
| `cheers` | `id`, `couple_id`, `from_id`, `kind`, `created_at` | (`couple_id`, `created_at desc`); the rate limit is checked in the RPC |
| `mode_progress` | `couple_id`, `mode`, `state` (JSON: garden plots, pet stats, room items, passport stamps), `version` | PK (`couple_id`, `mode`) |
| `entitlements` | `buyer_user_id` (the RevenueCat app-user id), `source`, `product`, `expires_at`, `updated_at`. The buyer owns the row; the couple is derived through `couple_members`. | PK (`buyer_user_id`, `product`). `couples.plus_until` is recomputed by a trigger as the latest `expires_at` across the couple's members. |
| `push_tokens` | `user_id`, `token`, `platform`, `updated_at` | unique (`token`); (`user_id`) |
| `events` | `user_id`, `name`, `props` (bucketed), `at` | (`at`); 90-day retention job |

**RLS** is on every table. Membership is checked by a `stable security definer` function, `is_couple_member(couple_id)`, which reads `couple_members` through its `user_id` index.

Supabase's RLS performance guidance is followed: `auth.uid()` is wrapped as `(select auth.uid())` so it is evaluated once per query instead of once per row. Policies are tested with pgTAP (for example: partner A can read the couple's sessions; a stranger cannot; a user cannot update another couple's row).

**N+1 prevention:**

- Screens load in one request, using PostgREST resource embedding (`couples?select=*,couple_members(profiles(*)),entitlements(*)`) or an RPC such as `home_snapshot()` that returns couple, partner, active session, today's stats and mode progress together.
- `pg_stat_statements` is reviewed in every phase from Phase 2 on; any query called more than once per screen load is a bug.

**Apple and privacy requirements** built into the schema:

- **In-app account deletion** (App Store Guideline 5.1.1(v)): an RPC plus Edge Function that cascades through the user's data and dissolves the couple. The partner keeps their own history.
- **Data export:** a JSON download (GDPR and KVKK).

### 4.4 Client data layer

- **Query keys:** `['home']`, `['couple']`, `['session', id]`, `['stats', ownerKind, range]`, `['history', cursor]`, `['notes', 'inbox']`, `['mode', mode]`.
- **Stale times:**
  - Static catalogs (themes, the city list, the Plus offer): 24 h, also bundled.
  - Couple, profile, entitlement: 5 min.
  - Live session: `Infinity`, updated only by Realtime.
  - Stats: 1 min.
- **Persisted cache:** TanStack's persister writes to MMKV, so cold start renders the last known state immediately, then refreshes in the background (stale-while-revalidate).
- **Pagination:** history and notes use `useInfiniteQuery` with **keyset cursors** (§8.4), rendered with **FlashList**.
- **Debounce:** search (cities, airports) at 200 ms. Settings sliders and steppers write to the store immediately but persist and sync after 400 ms of quiet. The love-note editor autosaves after 800 ms of quiet.

### 4.5 Re-render strategy (F1), with the documented trap guarded

**Write the test first (Phase 1, task 1).**

- A Jest + RNTL test advances fake timers and asserts that the timer text changes every second, on both the Classic screen and the Fly overlay.
- A Reassure baseline records how many times each screen renders during 10 s of a running session.
- Only after both exist does the old `setDisplayTick` chain get removed.

**The replacement:**

1. **The time display subscribes to time itself.** A tiny `clockStore` (based on `useSyncExternalStore`) emits once a second. Only the leaf `<TimerText>` subscribes. Nothing above it re-renders.
2. **The progress ring and all mode animations run on the UI thread.** They are driven by SharedValues computed from `ends_at` and the clock offset, so there are zero React renders per frame (today's `progressSV` idea, applied everywhere).
3. **Split stores.** Each Zustand store is read with selectors. The settings screen no longer re-renders because a timer is running.
4. **Turn on React Compiler**, if the SDK chosen in Phase 0 supports it; SDK 54 has it behind `experiments.reactCompiler`. It auto-memoizes. Measure with Reassure and keep it only if it is neutral or better.
5. **Lazy tabs and modes.** Hidden tabs are frozen (`freezeOnBlur`), so a backgrounded Stats tab does no work.

**Target:** while a session runs on the Classic screen, React commits drop from "every mounted `useApp()` consumer at 1 Hz" to "one `<TimerText>` at 1 Hz".

### 4.6 Monetization architecture

**Entitlement flow:**

1. A partner buys (App Store, Play or the web via Stripe).
2. RevenueCat sends a webhook to an Edge Function, which verifies the signature and upserts the buyer's `entitlements` row (keyed by `buyer_user_id`, not by couple).
3. A trigger recomputes `couples.plus_until` for the buyer's current couple.
4. Both clients see Plus through Realtime.

The client also checks RevenueCat locally, so the buyer is unlocked instantly even before the webhook arrives.

**Edge cases:**

- **Unpairing:** the buyer keeps Plus, because the row is theirs. The other partner loses it when `plus_until` is recomputed for the dissolved couple.
- **Re-pairing** carries the buyer's entitlement to the new couple automatically, through the same trigger.
- **Refunds and expiry** arrive through the same webhook.

**Ads (free tier):**

- Native only. Real ad unit ids from your AdMob account, which fixes F3.
- **Google UMP** consent before any ad request in the EEA, UK and Switzerland; non-personalized ads where consent is declined. ATT is not needed while ads stay non-personalized, matching the removal of `NSUserTrackingUsageDescription` in `3993eb0`.
- Never shown during a running shared session, and never on the web.
- The frequency rule is in §8.7.

**Paywall:**

- Shown on tapping a Plus mode or theme, and from Settings.
- Never shown before the user has completed at least one session, and never on top of a running session.
- Pricing is set in Phase 5 after a competitor check; RevenueCat Experiments can A/B test it.

**Store rules to verify at Phase 5:**

- Digital goods inside the iOS app must use in-app purchase.
- Whether the app may link out to web purchase depends on the store rules in force at the time. Check them then; don't assume.

### 4.7 Web

- **The app on the web:** an Expo Router web build (`react-native-web`), statically exported and hosted on a CDN at `app.<your-domain>`. Platform differences:
  - no AdMob, so web users see no ads
  - haptics do nothing
  - notifications are in-tab, plus Web Push through a service worker (Phase 6)
  - the real-map option is hidden
  - MMKV falls back to localStorage
- **The marketing site** stays Next.js at the root domain and gains:
  - `/invite/[code]` pages that open the app if installed, else offer the stores or the web app
  - `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`, which make universal links and app links work
  - the new privacy policy and terms, in EN and TR
- **Hosting:** today the site is a static export (`output: "export"`, `images.unoptimized`). Recommendation: move both sites to **Cloudflare Pages** (free, global CDN, custom headers for caching and the `.well-known` content types, Brotli compression). GitHub Pages cannot set custom headers. Vercel is the alternative.

### 4.8 Fly Together: illustrated map, plus the real map as a Plus extra

**The illustrated map:**

- One VectorCraft world artboard, exported as optimized SVG with decimals capped (§5.4), plus landmark doodle sprites.
- **Projection:** equirectangular, so map coordinates are a linear function of longitude and latitude (§8.8). The existing great-circle math in `geoMath.ts` is reused unchanged; only the final projection changes.
- **Data:** a curated list of about 150–250 cities with IATA codes and coordinates (an estimated 15–25 KB JSON). It replaces the 648 KB `airports.json` on the default path. The full airport file stays only inside the lazily loaded real-map chunk.
- **Camera:** pan and zoom are a Reanimated transform on one SVG group. No native map view is involved, so the AIRMap crash class cannot happen on the default path.

**The real map (Plus, iOS and Android):**

- Today's `FlyModeScreen` code, moved behind a lazy `require` so neither react-native-maps nor `airports.json` loads until a Plus user turns it on.
- It inherits device-backlog Tasks 2–4, the scale-plan's `useCameraController` work (Android parity), and the worklet/JS equivalence test.
- It ships behind a feature flag and goes last in Phase 4.

---

## 5. Design system: Impeccable + Emil Kowalski + VectorCraft

### 5.1 How Impeccable is used

- **Install:** `npx impeccable install` at project scope (Apache-2.0). Then `/impeccable init`, which writes `PRODUCT.md`, and `/impeccable document`, which writes `DESIGN.md`.
- **Platform:** `adaptive` (iOS + Android); `web` for the web build and the site. React Native is covered by its `ios.md`, `android.md` and `audit.native.md` references. Its automatic slop detector does not run on native, so native screens are reviewed with `/impeccable critique` and `/impeccable audit`.
- **Pin the brief.** Impeccable's rule is "the brief wins": the kawaii direction (§5.2) is pinned in `DESIGN.md`, so anti-slop passes don't flatten it into a generic minimal look.
- **Per-screen workflow:**
  1. `shape` before code
  2. build
  3. `critique` (scored)
  4. `audit` (technical)
  5. `polish`, `harden` (errors, long names, i18n overflow), `clarify` (copy), `onboard` (first run and empty states)
- **Target:** native audit score ≥ 16/20 on every primary screen before Phase 7 closes.

### 5.2 Kawaii direction (draft for `DESIGN.md`)

**Principles:**

1. Soft, not sugary.
2. Characters carry the emotion; the chrome stays calm.
3. One delightful moment per screen, not ten.
4. Never punish: no dying pets, no lost gardens, no guilt copy.
5. Both partners are always visible.

**Colour:**

- Warm pastel fields, not gradients. **Strawberry Milk** has a cream base, strawberry-pink primary, tomato-red accent, leaf-green success and cocoa text.
- Every text and background pair meets **4.5:1** for body text and **3:1** for large text and icons, checked by a script over the token file.
- The purple aurora gradients, the decorative blur tab bar and gradient text are dropped (F10).

**Type:**

- A **rounded display face** for headings and the timer, chosen in Phase 1. It needs full Turkish coverage (ğ ı İ ş ç ö ü) and **tabular figures**, so the timer digits never jiggle. Candidates to test: Fredoka, Baloo 2, M PLUS Rounded 1c.
- The system font for body text, so Dynamic Type and accessibility work (iOS body 17 pt, minimum 11 pt; Android in sp).

**Shape:** a radius scale of 8 / 14 / 22 / pill. Soft, colour-tinted shadows, not grey. No nested cards.

**Icons:**

- A custom VectorCraft icon set (about 40 icons) on a 24 pt grid with 2 pt rounded strokes. It **replaces all 37 emoji glyphs** in the UI.
- Emoji stay allowed only in push-notification copy and in user-written text.

**Touch targets:** 44×44 pt on iOS and 48×48 dp on Android (use `hitSlop` when the visual is smaller).

**Overlays:** today's stacked modals (love note card, goal popup, ad queue) become **bottom sheets and inline moments**, following Impeccable's "needless modals" rule.

### 5.3 Motion (Emil Kowalski `animate-expo`, MIT)

Install with `npx skills@latest add emilkowalski/skills`, or copy `animate-expo`, `review-animations` and `animation-performance` into `.claude/skills/`. The other Emil skills (`emil-design-eng`, `apple-design`, `mobile-native`) are web or CSS oriented; they are used only for the web build.

| Interaction | How often | Motion |
|-------------|-----------|--------|
| Start / Pause / Skip press | Dozens per day | Press-in scale to **0.97** over **100–150 ms** ease-out (`Easing.bezier(0.23, 1, 0.32, 1)`). A haptic on the same frame. No other flourish. |
| Tab switch | Constant | **No animation** (`animation: 'none'`). |
| Bottom sheet | Occasional | Spring with duration 300 ms and `dampingRatio` 0.8, using the drawer curve `(0.32, 0.72, 0, 1)`; exits faster than entrances. |
| Phase change (focus to break) | Several per day | The ring's colour and the mascot's pose crossfade over 200–300 ms; a pose change, not a bounce. |
| Session complete, garden growth, pet level-up, landing | Few per day | **The one delight moment**: a playful spring (bounce about 0.2–0.3, allowed for playful UI), confetti-like leaf or heart particles (≤ 24, transform and opacity only), and a success haptic. |
| Partner presence change | Occasional | Avatar fades and scales from 0.95, never from 0. |
| List entrance | On load | Stagger 30–60 ms, never on virtualized FlashList rows. |

**Rules:**

- Animate transform and opacity only.
- With **Reduce Motion** on, keep opacity and colour, drop translate, scale, particles and overshoot, and turn screen transitions into fades (`useReducedMotion`).
- Never animate BlurView intensity or `elevation`.
- No `setState` inside gesture handlers.
- Judge feel **in a release build on the slowest test device**, never in Expo Go.
- Enable 120 Hz on ProMotion iPhones (`CADisableMinimumFrameDurationOnPhone`).
- Verify in Phase 0 that `scheduleOnRN` exists in the installed `react-native-worklets`; if not, keep `runOnJS`.

### 5.4 VectorCraft art pipeline

```
art/src/*.svg            hand-authored or edited vector sources (mascots, icons, scenes, map, themes)
  └─ vectorcraft-cli run --in <src> --commands art/jobs/<job>.json
        (pathfinder cleanup, global swatches named after theme tokens, artboards per asset)
  ├─ art/vc/*.vectorcraft         editable native source of truth (committed)
  ├─ src/art/*.svg → SVG React components    (vectorcraft-cli convert --decimals 2 --outline-text)
  ├─ assets/icons/*  app icon, adaptive icon, splash   PNG @1x/@2x/@3x via --scale
  ├─ web/public/*    WebP/AVIF rasters for the site and store screenshots
  └─ art/steps/*.steps.json       exact command list per export (reproducible, as in Bengisum-Vector)
```

- **Theming:** shapes are painted with global swatches whose names match token names. A theme pack is one VectorCraft job that remaps swatches and exports again. No hand recolouring.
- **Compression:** `--decimals 2` on SVG export, text outlined, and one optimization pass. The budgets are in §6.2.
- **Interactive editing:** `vectorcraft-cli mcp` can expose VectorCraft to Claude as an MCP server, with read and write roots confined to `art/`.
- **Known gotcha** (from Bengisum-Vector memory): export paths must stay under 260 characters, so jobs run in a short working directory such as `C:/vp-art` and copy results back.
- **Originality:** all characters (Pomo & Doro, the pet, the avatars) are original designs, not recreations of existing mascots.

---

## 6. Performance and robustness: your checklist, mapped

### 6.1 Every item you asked for

"Native" means the iOS and Android apps, "Web" means the Expo web build and the marketing site, and "Server" means Supabase.

| Your item | Applies to | What we'll do | How it's measured | Phase |
|-----------|-----------|----------------|-------------------|-------|
| Cache API responses | Native, Web | TanStack Query with a persisted MMKV cache and stale-while-revalidate; Realtime pushes into the cache instead of polling. | Network log: a repeat app open makes ≤ 1 request before first paint. | 2–3 |
| Add a load balancer | Server | **Not built by us.** Supabase's gateway and Supavisor connection pooler already balance and pool connections, and the CDN host does it for web. A hand-run balancer would only make sense with self-hosted servers, which you ruled out. Revisit only if we self-host. | Supabase dashboard: pooler saturation stays < 50 % in the load test (Phase 7). | 2, 7 |
| Index the database | Server | The indexes in §4.3, including the partial index for the completion worker; checked with `EXPLAIN ANALYZE` and Supabase's index advisor. | Every hot query uses an index scan; p95 under 20 ms at 100k seeded sessions. | 2 |
| Compress images | Native, Web | VectorCraft SVG at `--decimals 2`; rasters as PNG for the stores, WebP/AVIF for the web; `expo-image` with a disk cache; the 1.2 MB `fly-ambient.m4a` re-encoded (mono AAC, about 64–96 kbps loop) and loaded lazily. Template images deleted. | The asset budget in §6.2. | 1 |
| Loading skeletons | Native, Web | Only where data is remote and uncached: partner card, history, garden and pet on first pair. Shown after a **150 ms delay** to avoid a flash. Local data needs no skeleton (MMKV is synchronous). | Visual check; no skeleton flash on a warm start. | 2–3 |
| Cache expensive queries | Server | The `daily_stats` rollup kept by a trigger (stats never scan sessions); the `home_snapshot()` RPC; static catalogs with long cache lifetimes. | Stats screen takes 1 request and p95 under 30 ms. | 2 |
| Lazy loading | Native, Web | Modes and the real map are loaded on demand (`React.lazy` and dynamic `import()`, or lazy `require` on native); Metro `inlineRequires`; `airports.json` and react-native-maps only inside the real-map chunk (F2). | Cold-start time-to-interactive (TTI) and startup bundle size versus the Phase 0 baseline. | 1, 4 |
| Split code into chunks | Web | Expo Router async routes produce per-route chunks on web. On native, Hermes runs one precompiled bytecode bundle; there are no chunks, and the native equivalent is the inline requires above. | Web: route chunks under 150 KB gzipped each. | 6 |
| Add a CDN | Web, Server | Cloudflare Pages for both sites; EAS Update is served from Expo's CDN; Supabase Storage CDN for avatars and shared images. | Lighthouse "efficient cache policy" passes; TTFB under 200 ms. | 6 |
| Minify JS and CSS | Native, Web | Native: Metro's production minifier plus Hermes bytecode (already on, verified in Phase 0). Web: Metro minify for the app; Next.js plus Tailwind production build for the site (already minified). | Bundle sizes in the CI artifact. | 0, 6 |
| Remove unnecessary re-renders | Native, Web | §4.5: clock store, UI-thread animation, Zustand selectors, frozen tabs, React Compiler, all **after** the "timer still ticks" test exists. | Reassure render-count baseline, as a CI gate. | 1 |
| Paginate large lists | Native, Web | Keyset cursors (§8.4) and FlashList for history, notes inbox and cheers; the city picker is virtualized. | 10k-row seed scrolls at 60 fps on the slowest Android test device. | 2–3 |
| Remove unused dependencies | Native | Remove `geolib` and the template files (F8). Check with `knip` and `depcheck` plus `npx expo-doctor`. `react-native-web` and `react-dom` **stay** because the web app is in scope. `expo-linking` and `expo-asset` are peer or plugin dependencies, so they are checked by tooling, not grep. | `knip` is clean; expo-doctor passes. | 0 |
| Defer non-critical scripts | Native, Web | Native: `AdManager.init`, the update check, Sentry replay, and audio preload run after the first frame (`InteractionManager` / `requestIdleCallback`). Web: analytics and Stripe.js load on idle (`next/script` with `lazyOnload`). | TTI improves versus baseline; Lighthouse Total Blocking Time is under 150 ms. | 1, 6 |
| Compress API payloads | Server | Gzip/Brotli at the Supabase gateway (verified with response headers); `select=` only the columns needed; Realtime sends state changes, never ticks (§4.2). | Home snapshot under 4 KB compressed. | 2 |
| Debounce input handlers | Native, Web | §4.4: search 200 ms, settings persistence 400 ms, note autosave 800 ms. | Unit tests with fake timers. | 1–3 |
| Fix N+1 queries | Server | Resource embedding and screen RPCs (§4.3); a `pg_stat_statements` review gate every phase. | No query runs more than once per screen load. | 2+ |
| Server-side caching | Server | Postgres rollups (above); Edge Function responses for static catalogs and app config with `Cache-Control: public, max-age=86400`. **No Redis**: at this scale Postgres rollups and the CDN cover it, and Redis would be one more service to run. | Catalog requests are served from the CDN (cache-hit header). | 2 |
| Lighthouse audit | Web | **Baseline on the current site in Phase 0**, then Lighthouse CI on every PR for both web targets. Native has no Lighthouse; the native equivalent is the device benchmarks in §6.2. | See §6.2. | 0, 6, 7 |

### 6.2 Budgets (initial targets; revised after the Phase 0 baseline)

| Metric | Target |
|--------|--------|
| Native cold-start TTI, mid-range Android | ≤ 1.5 s |
| Native cold-start TTI, iPhone 12-class | ≤ 1.0 s |
| Startup JS bundle (Hermes) | ≥ 25 % smaller than the Phase 0 baseline |
| Frame rate during a running session (any mode, slowest device) | ≥ 58 fps median; no frames over 32 ms during the completion animation |
| Shared-session sync skew between two phones | ≤ 250 ms (§8.1) |
| Partner state change visible on the other phone (both online) | p95 ≤ 1 s |
| Single SVG illustration | ≤ 30 KB; mode scene ≤ 120 KB; icon ≤ 2 KB |
| Lighthouse, marketing site (mobile) | Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 |
| Lighthouse, web app (mobile) | Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95. A react-native-web bundle is heavier than a content site; 85 is an honest first target. |
| API p95 (hot RPCs) | ≤ 50 ms at the server |
| Crash-free sessions (Sentry) | ≥ 99.8 % |

---

## 7. Roadmap

Sizes: **S** is about a day, **M** a few days, **L** about a week or more. These are working-session estimates, not calendar promises. Each phase ends with a device check on a physical phone, as your memory note requires, and its own implementation doc.

### Phase 0: Foundation and safety net (M)

1. **Git.** Merge `release/ios-1.3.0` and `origin/master`'s privacy commit into `master`, then cut `rehaul/v2`. Align `package.json` with `app.json` (F4, F5).
2. `npm ci`, `npx expo-doctor`, typecheck and lint. Record the current errors as the baseline.
3. **Baselines:**
   - startup bundle size (`npx expo export` + source-map-explorer)
   - cold-start TTI on one iOS and one Android device
   - **Lighthouse on the current marketing site**
4. **Test harness:** Jest + RNTL + Reassure. The first tests are:
   - the phase state machines (`nextAfterComplete`, `nextAfterSkip`)
   - session clock idempotency
   - the **worklet/JS `interpolateAlongPath` equivalence** (scale-plan item 1)
   - "timer text decrements"
5. **CI:** GitHub Actions running typecheck, lint, tests and Reassure.
6. **Upgrade Expo** to the latest stable SDK (in its own commit) and re-run the baselines.
7. **Cleanup:** remove the dead files and `geolib` (F8); archive `PHASE4_TEST.md`.
8. **Install the skills:** Impeccable (`npx impeccable install`, then `init`) and Emil `animate-expo`. Read each SKILL.md before first use.
9. **Device:** run the Regression Gates, Task 1 and the AIRMap checks on v1.3.1.

**Exit:** green CI, baselines recorded, `master` is trunk.

### Phase 1: Design system and local re-architecture, shipped to today's users (L)

1. Write `PRODUCT.md` and `DESIGN.md` (Impeccable); write and contrast-check the theme tokens; pick the font.
2. **VectorCraft pipeline** (§5.4): first the icon set, Pomo & Doro, app icon and splash.
3. Expo Router migration (Classic, Stats, Settings, Notes). Zustand stores. MMKV with a **one-time migration from AsyncStorage** that keeps every key (stats v2, notes, settings, reminders, ad policy).
4. Re-render fix (§4.5), behind the tests from Phase 0.
5. Rebuild Classic in the new design; add presets; add EN/TR; add the sound set.
6. Fly Mode stays functional but is lazy-loaded (F2).

**Ship as v1.4** to existing users: same features, new look, faster. This de-risks the redesign before the backend exists.

**Open question (yours):** this is a lot to change at once in the first release existing users see. The alternative is to split it:
- **v1.4:** design refresh, lazy Fly Mode, cleanup (steps 1, 2, 5, 6).
- **v1.5:** Expo Router, stores, MMKV migration and the re-render refactor (steps 3, 4).

The split costs a second release cycle but halves the risk of each one.

**Exit:** Impeccable audit ≥ 16/20 on Classic; Reassure shows the render-count drop; device check done; migration tested on a copy of real v1.3.1 storage.

### Phase 2: Backend, accounts and pairing (L)

1. **You** create the Supabase project (I can't create accounts for you). Write migrations, the RLS policies and pgTAP tests, the seed script with 100k sessions, and the index review.
2. Auth: anonymous sign-in, then linking with Apple, Google or email. Account deletion and data export.
3. **Local-to-cloud migration:** on first sign-in, upload local stats and notes once, guarded by an idempotency key.
4. Invites: code plus link. The website gets `/invite/[code]` and the `.well-known` files.
5. Sentry and the `events` table. Write the new privacy policy (EN/TR), replacing the README claim (F9).

**Exit:** two test accounts pair through a link on two devices; RLS tests are green; the N+1 review is clean.

### Phase 3: Shared room and presence (L)

1. The session engine (§4.2): RPCs, optimistic concurrency, the completion worker, server pushes, credits.
2. Clock-offset sync (§8.1); Realtime cache patching; offline queue and replay.
3. Presence, intentions, cheers (rate-limited), partner love notes, couple streak and goal.

**Exit, on two physical devices:**
- skew ≤ 250 ms
- partner pause while one phone is locked → the push arrives and no stale alert fires
- airplane mode mid-session → reconciles correctly
- killing the app mid-session → credits land exactly once

### Phase 4: Modes (L each)

- **4a. Shared Garden (Free).** The growth model (§8.5) and VectorCraft garden pack.
- **4b. Fly Together, illustrated (Plus).** The map and city list (§4.8), both planes, passport stamps, the boarding-pass tear (§2.5).
- **4c. Real map (Plus, phones).** Lazy chunk, `useCameraController` for Android parity, device-backlog Tasks 2–4, behind a feature flag.
- **4d. Study-date Room (Plus).**
- **4e. Shared Pet (Plus).**

Each mode follows `shape`, then build, then `critique`/`audit`, then an Emil `review-animations` pass, then a device check.

### Phase 5: Monetization (M)

**You** create the RevenueCat, App Store Connect and Play products. Then:

1. The webhook Edge Function and the couple entitlement (§4.6).
2. The paywall (designed with Impeccable), and "Gift Plus to your partner".
3. AdMob: real Android ids, UMP consent, the free-tier gating rule (§8.7).
4. Store-rule check.

**Exit:** a sandbox purchase on iOS and Android unlocks both partners; refund and expiry revoke; ads never appear for Plus users or during a shared session.

### Phase 6: Web app and website (M)

1. Expo web build, Web Push and the web paywall (RevenueCat Web Billing).
2. Website redesign to the new brand (Impeccable plus Emil web skills).
3. Cloudflare Pages, Lighthouse CI on both sites.

**Exit:** Lighthouse budgets met (§6.2); an invite link opens the app on iOS, Android and the web.

### Phase 7: Hardening and launch (M)

1. Impeccable `polish`, `harden` and `onboard` on every screen; an Emil `improve-animations` audit.
2. Realtime load test: 500 simulated couples.
3. The full Maestro E2E suite.
4. Rebrand the store listing (name, screenshots exported by VectorCraft).
5. Staged rollout (TestFlight, then a phased release; a Play staged rollout).
6. Widgets and Live Activity, if time allows.

---

## 8. Mathematical / statistical details

### 8.1 Clock-offset estimation (NTP-style)

The client records its clock $t_0$, calls the RPC `server_now()`, which returns server time $s$, and records $t_1$ on receipt.

- Round-trip time: $\delta = t_1 - t_0$.
- Offset estimate: $\hat\theta = s - \frac{t_0 + t_1}{2}$.
- If $s$ was taken at any point inside the round trip, the error is bounded by $|\hat\theta - \theta| \le \delta/2$.

Take $N = 5$ samples, about 100 ms apart, and keep the one with the **smallest** $\delta$ (its error bound is the tightest). Re-sync on every foreground and every 10 min. Estimated server time is $\text{now}_s = \text{Date.now()} + \hat\theta$.

The skew between two phones is at most $\delta_A/2 + \delta_B/2$. With typical mobile round trips of ≤ 300 ms the bound is ≤ 300 ms; best-of-5 sampling usually lands well below it. The target is 250 ms (§6.2).

### 8.2 Shared remaining time, and concurrency

Let $D$ be `duration_ms`, $S$ be `started_at`, $P$ be `paused_total_ms`, and $p$ be `paused_at`. The server maintains:

- **pause:** $p \leftarrow \text{now}()$
- **resume:** $P \leftarrow P + (\text{now}() - p)$, then $p \leftarrow \text{null}$
- **ends_at** $= S + D + P$, recomputed on resume

The client displays:

$$\text{remaining} = \begin{cases} \max(0,\ \text{ends\_at} - \text{now}_s) & \text{running} \\ \text{ends\_at} - p & \text{paused} \end{cases}$$

**Optimistic concurrency:** every command runs

```sql
UPDATE sessions SET …, version = version + 1
WHERE id = $id AND version = $expected
RETURNING *;
```

If 0 rows come back, there was a conflict: the client re-reads the row. If the row is already in the requested state, the command counts as a success (idempotent).

### 8.3 Per-partner credit in a shared session

Let $F$ be the set of time intervals during which the session was in a running focus phase. Let $J_u = [\text{joined}_u, \text{left}_u]$ be the time partner $u$ was in the room (an open end means they stayed to the end). Then:

$$\text{credit}_u = \Big\lfloor \tfrac{1}{60000} \sum_{I \in F} |I \cap J_u| \Big\rfloor \text{ minutes},\quad \text{counted only if } \ge 1.$$

This is written once per `(session_id, user_id)` (unique key). Partners who stay to the end get identical credit. Someone who leaves early keeps the minutes they actually studied.

### 8.4 Keyset pagination

To get the next page after the last item seen, $(t^*, id^*)$:

```sql
WHERE couple_id = $c AND (started_at, id) < ($t*, $id*)
ORDER BY started_at DESC, id DESC
LIMIT 20
```

This uses the index (`couple_id`, `started_at desc`, `id desc`). The cost is $O(\log n + k)$ per page, against $O(n)$ for `OFFSET n`. It is also stable when new sessions are inserted while the user scrolls.

### 8.5 Garden growth (proposed; tuned in Phase 4a)

Growth points:

$$g = \sum_{\text{credited sessions}} m \cdot \text{minutes}, \qquad m = 1.5 \text{ if both partners were present, else } 1.0.$$

The multiplier is a bonus for studying together, never a penalty for studying solo. Plant stage $k$ (with $k = 1$ meaning "sprout") is reached when cumulative $g \ge T_k$, where

$$T_k = 60 \cdot \frac{1.5^{k} - 1}{0.5}.$$

This is a geometric series: stage $k$ needs $60 \cdot 1.5^{k-1}$ more points than stage $k - 1$. The first sprout comes after about 60 minutes, which is about two sessions, and later stages slow down gently. There is **no decay term**. A gap of 3 or more days only switches the plants to a "sleepy" pose until the next session.

### 8.6 Couple streak

The couple day is computed in `couples.home_tz`, chosen at pairing, so long-distance couples agree on what "today" is. Let $M(d)$ be the combined credited minutes on day $d$ and $G$ the couple goal (default 50, the same as today's `DEFAULT_GOAL_MINUTES`):

- day $d$ is a **hit** if $M(d) \ge G$
- the streak grows by 1 on each hit day
- one missed day per ISO week is covered automatically by a **freeze**
- a second missed day in the same week resets the streak to 0
- the best streak is kept

This mirrors today's `normalizeStreakForToday` (reset when 2 or more days have passed since the last hit) and adds the freeze. Solo streaks are unchanged.

### 8.7 Ad frequency rule (free tier)

An interstitial is shown after a completed session if and only if all of these hold:

$$n_{\text{since}} \ge 2 \ \wedge\ (\text{now} - t_{\text{last}}) \ge 120\text{ s} \ \wedge\ \neg\text{plus} \ \wedge\ \text{native} \ \wedge\ \neg\text{sharedSessionRunning} \ \wedge\ \text{consentResolved}$$

The first two terms are today's `AdPolicy` rule, unchanged. The other four are new gates.

### 8.8 Illustrated map projection

Equirectangular projection onto an artboard of width $W$ and height $H$:

$$x = \frac{\lambda + 180}{360} W, \qquad y = \frac{90 - \varphi}{180} H$$

where $\lambda$ is longitude and $\varphi$ is latitude, both in degrees.

The great-circle waypoints from `generateGreatCircleWaypoints` are projected point by point. At a ±180° crossing the polyline is split, using the same longitude normalisation as `interpolateAlongPath`, so a Pacific route does not draw a line across the whole map.

---

## 9. Design decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Server owns time; RPC commands | Clients broadcast their own timestamps; peer-to-peer sync | Phone clocks drift and can be changed by users. A single authority makes "both phones agree" provable (§8.1–8.2). |
| Server push for shared-session completion | Local notifications on both phones | A local alert can't be cancelled on a sleeping phone when the partner pauses, so it would fire at the wrong time. |
| One session engine; modes as skins | Keep today's per-mode clocks (two slots) | Five modes on separate clocks means five sets of sync bugs. The two-slot design existed only because Fly and Pomodoro were separate. |
| Expo Router | Stay on React Navigation's static API | Web URLs, invite deep links and web bundle splitting come with it. It is built on React Navigation, so screen code ports. |
| Zustand + TanStack Query | Keep Context; Redux Toolkit; Jotai | Selectors fix F1 structurally. TanStack covers caching, pagination and offline. Redux is heavier than this app needs. |
| MMKV | Keep AsyncStorage; SQLite | Synchronous reads remove startup flashes. The data is key-value-shaped, so SQLite is not needed on the client. |
| Supabase-managed scaling; no custom load balancer or Redis | Self-hosted Node + LB + Redis | You chose Supabase. At couples-app scale, Postgres rollups and a CDN cover caching, and every self-run service is more risk and cost. |
| Illustrated map default; real map as phone-only Plus | Real map only; illustrated only | Your decision. It removes the crash class and the web blocker from the default path while keeping the real map for fans. |
| Ship the redesign (v1.4) before the backend | One big-bang v2 release | Validates the new look and the storage migration with real users while the backend is still being built. |
| Anonymous auth first, account to pair | Account required at first launch | Existing users must not hit a login wall on update; it also helps App Store review. |
| VectorCraft SVG as source, rasters exported | Hand-drawn PNGs; Lottie; Rive | Your decision. Tiny, themeable by swatch remap, reproducible from `steps.json`. |

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Scope: this is months of work | Ship in phases; v1.4 ships first; every phase is shippable on its own. |
| Losing existing users' data in the migrations | A one-time, idempotent migration, tested on a copy of real v1.3.1 storage. AsyncStorage keys are kept for one release as a fallback. |
| iOS limits on background push delivery | Visible alert pushes (not silent pushes) for shared events; the client reconciles on every foreground. |
| Two map stacks (your Plus real-map choice) | Lazy chunk, feature flag, scheduled last; device-backlog Tasks 2–4 must pass before it ships. |
| App Store review: accounts, subscriptions, the couple-shared entitlement | In-app account deletion; Sign in with Apple; restore purchases; clear paywall terms; review notes explaining that one purchase covers the pair. |
| Privacy law (GDPR, KVKK) | New policy, consent before ads, data export and deletion, minimal and bucketed analytics, RLS everywhere. |
| The re-render refactor freezes the timer | The test exists before the change (§4.5). |
| The web build looks or behaves differently | Lighthouse CI plus a Maestro web run and a manual pass per phase. |

---

## 11. What I need from you

I can't create accounts or enter credentials for you, so these are yours:

| Needed by | Item |
|-----------|------|
| Plan approval | Approve or amend §0, and decide whether Phase 1 ships as one release (v1.4) or two (§7, Phase 1). |
| Phase 0 | The **live URL of the current marketing site**, for the Lighthouse baseline. |
| Phase 2 | A **Supabase** project (org and region; an EU region is the closest one for users in Turkey). |
| Phase 2 | A **domain** for the site and `app.<domain>`, which the universal-link invites need. |
| Phase 5 | **RevenueCat**, App Store Connect subscription products, Play Console products. |
| Phase 5 | **AdMob**: real Android app id and ad unit ids (today they are Google's test ids), and the UMP consent message set up in the AdMob console. |
| Phase 6 | A Cloudflare Pages (or Vercel) account. |
| Before Phase 7 | The **app name** (§3.1), after your own store and trademark check. |

## 12. What changed in this commit (documentation only)

| File | Change |
|------|--------|
| `docs/implementations/_TEMPLATE.md` | New. The template your global CLAUDE.md requires (it was missing). |
| `docs/implementations/2026-10-29-couples-rehaul-plan.md` | New. This plan. |

No source, config or dependency files were touched. Nothing was committed.

---

## 13. Verification of this plan

- [ ] Every finding in §1.2 can be reproduced from the cited file or command, for example `git rev-list --count master..release/ios-1.3.0` returns 53.
- [ ] Every item from your request appears in §6.1 or §3.
- [ ] You have approved or amended the decisions in §0, and chosen a name (§3.1) before Phase 7.
- [ ] Phase 0 exit criteria are met before any Phase 1 code is written.

## 14. Related docs

- [../../PLAN.md](../../PLAN.md): the v1 plan
- [../../DECISIONS.md](../../DECISIONS.md): v1 decisions
- [../scale-plan.md](../scale-plan.md): the April 2026 scale plan
- [../device-check-backlog.md](../device-check-backlog.md): outstanding device checks
- [../proposals/ticket-cutting-feature.md](../proposals/ticket-cutting-feature.md): boarding-pass proposal
- `2026-04-19-timer-unification.md`, `2026-04-20-plane-clock-driven.md`, `2026-05-05-airmap-insert-subview-crash-fix.md`: the real-map history
- Impeccable: <https://github.com/pbakaus/impeccable> (Apache-2.0) · Emil Kowalski skills: <https://github.com/emilkowalski/skills> (MIT)
