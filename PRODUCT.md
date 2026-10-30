# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users

**Primary:** university-age couples (roughly 18 and over) studying for courses and exams, **long-distance first**. They are partners in different cities, countries or time zones who want to study "together" while apart: start at the same moment, see that the other one is focusing, and keep each other going.

**Also served:** solo users with no partner and no account, which is everyone on today's v1.3.1, including Bengisu. Solo use must keep working exactly as it does today.

## Product Purpose

A couples study timer. Two people pair once with a link or a 6-character code. After that, either partner can start a focus session that runs on both phones at once. Each sees the other's presence and session intention. Breaks carry cheers and the love notes partners write for each other, and the active mode turns joint focus into a shared reward.

Success means:

- couples study together more consistently, measured by the couple streak and the couple daily goal
- no existing user loses data through any update
- the product pays for itself through a couple subscription ("Plus", one purchase covers both partners) and capped ads on the free tier

## Positioning

**One shared session that both partners are inside, wherever each of them is.**

- **Both phones agree.** The server owns time, so a pause, skip or end is the same event on both phones.
- **Presence carries the distance.** Live status, intention and the partner's local time.
- **The couple is the customer.** One purchase unlocks both partners.

Its origin is true and specific: the app began as a gift for one person. That heritage survives as "Gift Plus to your partner".

## Operating Context

- **Where it's used:** phones on a desk, in a library or in bed during long study blocks. The screen is often locked mid-session, so session ends and partner actions arrive as notifications. A web app serves laptop study.
- **Time zones:** partners often live in different time zones. The couple's "day" is computed in a home time zone chosen when they pair, so streaks agree.
- **Session rhythm:** focus and break cycles. Classic is 25/5 with a long break after every 4 focus sessions; presets add 50/10, 52/17 and 90/20.
- **Languages:** English and Turkish. Turkey is a core market, and the marketing site is already EN/TR.

## Capabilities and Constraints

**Shipped today (v1.3.1, local only):** Classic Pomodoro on a timestamp-based clock, Fly Mode over a real map, daily goal and goal-based streak, configurable durations, love notes, a daily reminder with quiet hours, a gift screen, an update prompt, dark mode, landscape and iPad layouts, and AdMob interstitials (at most one every 2 sessions and 120 s).

**Planned (approved plan, 2026-10-29):**

- Pairing, a shared room and presence.
- Cheers (at most 1 per 5 min), partner love notes, session intentions.
- A couple streak with one automatic freeze per week, and a couple daily goal.
- A weekly shareable recap.
- Modes, each a skin over one session engine:
  - **Free:** Classic and Shared Garden.
  - **Plus:** Fly Together on an illustrated map (the real map is a phone-only extra), Study-date Room and Shared Pet.
- **Free tier:** 2 themes, 7-day stats, capped ads.
- **Plus:** all themes, full history, widgets, no ads.

**Hard constraints:**

- The bundle id `com.bengisu.valentinepomodoro` stays, so existing installs update in place. Every storage migration is idempotent and keeps every existing key.
- No account is needed for solo use. An account is needed only to pair.
- Ads never appear during a running shared session, on the web, or for Plus couples. The paywall never appears before the first completed session or over a running session.
- **Platforms:** **iOS first** (16.4+); v1.4 and the work after it target iOS only, decided 2026-10-29. **Android is deferred** until the owner can run Google Play's required closed test (at least 12 testers for 14 consecutive days). When it returns, this record's platform becomes `adaptive` again. The web (an Expo web build, its own surface with web conventions) comes later. The real map is phone-only.
- **Privacy:** GDPR and KVKK; in-app account deletion; data export; minimal, bucketed analytics.
- All vector art is produced with VectorCraft, and all app sounds with SoundCraft (synthesized, no third-party samples).

**Undecided:**

- **The public app name.** Candidates: Pomo Pair, Tomatwo, Pomo & Doro, Two Tomatoes. Tomatwo and Two Tomatoes conflict with the no-tomato direction (2026-10-30). Store and trademark checks are the owner's, before launch. "Valentine Pomodoro" is the working name.
- Plus pricing (Phase 5).
- The custom domain, which universal-link invites need.

## Brand Commitments

- **A kawaii couple of two, binding; no tomato anywhere** (owner, 2026-10-30, ADR-0047). The mascots are **Pomo & Doro**, two small round characters who are, together, the colon in the timer: Pomo a round strawberry with one curl, Doro a wide matcha dome. The mark is **Same Page**: two pages of one open diary, each with a face, leaning in. In one signature animation the two of them turn into the two pages and form the mark. No tomato, clock or heart in the mark or the art: those are the category's habits. The visual direction is pinned in DESIGN.md.
- **Voice:** warm, gentle and encouraging; never guilt, never pressure. Emoji appear only in push-notification copy and in text users write themselves, never as interface icons.
- **Heritage:** the app was made for Bengisu. In the public product her name appears only as a short origin line in About. Default love notes and interface copy carry no personal names. Her own install keeps the notes it already has.

## Evidence on Hand

- **The shipped app:** v1.3.1 on the iOS App Store. Android builds exist (EAS, January 2026), but the app is not in production on Google Play: the account has not yet passed Play's closed-test requirement.
- **Real copy:** 20 default love notes (`src/constants/defaults.ts`); EN/TR site copy (`../../Valentine Pomodoro Website/src/locales/en.json`, `tr.json`).
- **Real assets:** the iOS app icon in light, dark and tinted, and the splash marks (`assets/images/ios-icon-*.png`, `splash-mark-*.png`); the Same Page mark, Pomo & Doro's poses and 50 icons (`art/out/`, built by `scripts/art/build.mjs`); the v1 adaptive icon (Android, deferred); the Fly Mode ambient loop (`src/assets/sounds/fly-ambient.m4a`).
- **Measurements:** bundle, Lighthouse and render-count baselines (`docs/baselines/2026-10-29/`, `docs/implementations/2026-10-29-phase0-foundation.md` §4).
- **Absent, never to be invented:** testimonials, store reviews or ratings, download or user counts, press, partner logos, and prices.

## Product Principles

1. **Together, even apart.** Both partners are always visible; presence is the product, not a feature.
2. **Never punish.** Progress only grows. Nothing decays, dies or is lost, and no copy guilts a partner who missed a day.
3. **No wall in front of solo.** Solo use needs no account, and an update never costs a user their data.
4. **One engine, many skins.** A mode adds visuals and rewards, never its own clock.
5. **Quiet during focus.** A running session shows no ads, no paywall and no prompts. The celebration waits for the end.

## Accessibility & Inclusion

- Text and icons meet WCAG contrast: 4.5:1 for body text, 3:1 for large text and icons, checked by script for every theme.
- Body text follows Dynamic Type on iOS and `sp` scaling on Android.
- Reduce Motion is honoured: opacity and colour remain; movement, scale and particles drop.
- Touch targets are at least 44×44 pt on iOS and 48×48 dp on Android.
- Full Turkish glyph coverage (ğ ı İ ş ç ö ü). Layouts survive Turkish string lengths.
- Every gesture-only moment has a non-gesture fallback, for example a press-and-hold "Board" button for the boarding-pass tear.
