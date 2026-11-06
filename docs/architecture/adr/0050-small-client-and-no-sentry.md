---
id: ADR-0050
title: A small Supabase client of our own, and no Sentry, in 1.5.0
status: accepted
date: 2026-11-05
owner: Mert Efe Şensoy
related: [ADR-0021, ADR-0029, ADR-0049, IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-a0-a1-baselines-budget, SRS]
---

# ADR-0050: A small Supabase client of our own, and no Sentry, in 1.5.0

> **Status note:** accepted by the owner on 2026-11-05 ("Lean: 4,640,000 B, +8.1 % (Recommended)"), from [A1's measurements](../../implementations/2026-11-05-phase2-a0-a1-baselines-budget.md). It changes the stack in [rehaul plan §4.1](../../implementations/2026-10-29-couples-rehaul-plan.md#41-stack-changes) for 1.5.0. Supabase stays the backend ([ADR-0021](0021-supabase-backend.md)), and TanStack Query stays the client's data layer ([ADR-0029](0029-zustand-and-tanstack-query.md)).

## Context

Hermes ships one bytecode bundle, so a lazy import doesn't shrink it, and 1.4.0's bytecode was already 11 % over its old limit. A1 measured each SDK alone against a base of 4,292,796 B:

| What | Cost |
|---|---:|
| `@sentry/react-native` | +1,658,512 B (38.6 %) |
| `@sentry/core` alone | +744,256 B (17.3 %) |
| `@supabase/supabase-js` | +524,572 B (12.2 %) |
| its part `@supabase/auth-js` | +281,816 B (6.6 %) |
| `@tanstack/react-query` with its persister | +126,740 B (3.0 %) |
| A small client on `fetch`, as a probe | +4,844 B (0.1 %) |

In 1.5.0 the app's whole server surface is a few auth calls and POSTs to database functions and one Edge Function. Nothing in it needs Realtime or Storage.

## Decision

1. **A small client of our own, on `fetch`,** replaces `@supabase/supabase-js` in 1.5.0. It calls Supabase's documented HTTP endpoints: `/auth/v1/token` for the ID-token and refresh-token grants, `/rest/v1/rpc/<name>` and `/functions/v1/<name>`.
2. **No Sentry.** Plan task E1 is dropped. [NFR-REL-001](../../srs/SRS.md#nfr-rel-001) is read from App Store Connect's crash data.
3. **Kept:** `expo-apple-authentication`, `expo-secure-store`, and `@tanstack/react-query` with its persister.
4. **The ceiling:** [NFR-PERF-002](../../srs/SRS.md#nfr-perf-002) is 4,640,000 B for 1.5.0.
5. **Realtime in 1.6.0** arrives as `@supabase/realtime-js` on its own, measured when it does, or the owner reconsiders `supabase-js` as a whole with that phase's numbers in hand.

## Consequences

**Positive**
- SDKs cost 143,632 B, against 2,353,484 B for the plan's whole list.
- Nothing runs at launch for a solo user except the app itself. Sentry would have started at launch for everyone.

**Negative: what this repo now owns**
- **Token refresh.** Only one refresh may be in flight, because Supabase rotates refresh tokens and treats a reused one as theft outside a short reuse window. So two concurrent refreshes, or a crash between the server's rotation and the local save, can end a session. The client must make that a clean "sign in again", never a broken state.
- **A 401 ends in sign-in again,** not in a retry loop.
- **Restoring the session from the Keychain** on launch, and a token that expired while the app was in the background.
- **A departure from Supabase's Expo guide,** so its examples can't be copied, and an upgrade of the auth API is ours to notice.
- **Tests for all of the above,** which `supabase-js` would have carried.
- **No JavaScript stack on a crash.** App Store Connect shows the native crash, and a JS error reads as a generic fatal. Debugging a field crash gets harder, and its fix may need a build rather than a stack trace.

## Alternatives considered

- **`supabase-js`, no Sentry** (5,160,000 B, +20.2 %). Less auth code of our own, and 12 % more bytecode for one library, most of it unused in 1.5.0.
- **The plan's whole list** (6,850,000 B, +59.6 %). Crash reports with JavaScript stacks, at 39 % of today's app for Sentry alone.
- **`@supabase/auth-js` alone.** The documented sign-in path for +282 KB: most of the cost, for the two calls that matter.
- **No TanStack Query as well** (about 4,530,000 B). The offline queue and the persisted cache would be ours to write, and Phase 3 needs Query anyway.

## Links

- [A1's record](../../implementations/2026-11-05-phase2-a0-a1-baselines-budget.md), §3.2 and §3.4
- [Phase 2 plan §0.3](../../implementations/2026-11-05-phase2-plan.md#03-changed-while-building-2026-11-05)
