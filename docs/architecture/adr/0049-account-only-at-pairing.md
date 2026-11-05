---
id: ADR-0049
title: An account only at pairing, with Sign in with Apple only, and pairing by code only
status: accepted
date: 2026-11-05
owner: Mert Efe Şensoy
related: [ADR-0021, ADR-0029, IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-a2-pairing-flag, SRS]
---

# ADR-0049: An account only at pairing, with Sign in with Apple only, and pairing by code only

> **Status note:** accepted by the owner on 2026-11-05, when approving the [Phase 2 plan](../../implementations/2026-11-05-phase2-plan.md) ("Approve and hand over"). It replaces the auth paragraph of [ADR-0021](0021-supabase-backend.md) and the invite links in the rehaul plan for 1.5.0. Being built in Phase 2, behind `PAIRING_ENABLED`.

## Context

The rehaul plan (§4.1) gave every install an anonymous Supabase account at first launch, linked later to Sign in with Apple, Google or an email magic link, and invited a partner with a link on a new domain. Three things argued against that when Phase 2 was planned:

- **Solo users must lose nothing** ([FR-ACC-001](../../srs/SRS.md#fr-acc-001)). An anonymous account means a server row and a network call for every install, including people who will never pair. It has no automatic cleanup, Supabase strongly recommends a CAPTCHA with it, and Apple's deletion rule covers guest accounts too.
- **Email links need a paid sending service.** Supabase's built-in one is limited to 2 emails an hour and team addresses.
- **Links need a domain and a website**, with their own `/invite` page and `.well-known` files, which is Phase 6's work.

## Decision

1. **An account exists only once someone chooses to pair** ("Only when they pair"). No anonymous sign-in. A solo user has no account, and the app never contacts Supabase for them.
2. **Sign in with Apple is the only sign-in** ("Sign in with Apple only"). Email and Google wait for Android or web.
3. **Pairing uses a code only** ("Codes only for now"). One person shares a 6-character code as text, and their partner types it in. A code lasts 24 hours, and creating a new one cancels the old one. No links, domain or `/invite` page in 1.5.0.
4. **TanStack Query and the Supabase client load only for someone who is pairing or already paired** ([ADR-0029](0029-zustand-and-tanstack-query.md), plan tasks C1 and C2).
5. **`PAIRING_ENABLED`** in `src/constants/features.ts` hides the whole feature until the release build is ready (plan task F1).

## Consequences

**Positive**
- A solo user's privacy position doesn't change, beyond crash reports (plan task E1). That can be proved with a test, not just stated.
- No email service to run, no domain to hold, and no secret rotation for a web sign-in flow.
- The app stays within Guideline 4.8, because no other third-party login exists.

**Negative**
- Android and web can't pair until they get their own sign-in. Both are deferred anyway.
- Pairing takes one more step for the partner than a link would. The same code flow stays as the fallback once links arrive.
- Revoking the Apple token at deletion needs a `.p8` key in Supabase secrets, even though sign-in is native-only (plan §5).
- A person's stats history and own notes stay on the phone until 1.6.0 (FR-MIG-003).

## Alternatives considered

- **Anonymous sign-in at first launch** (rehaul plan §4.1). See Context. It would make the later shared room slightly simpler, at the cost of a server row for every install.
- **Add an email link or Google.** A paid sending service, or a second sign-in to support, for no one who has asked for it.
- **Links on `vercel.app`, or a new domain.** More website work now, and a `vercel.app` link can't be moved later without breaking old invites.

## Links

- [Phase 2 plan §0.1](../../implementations/2026-11-05-phase2-plan.md#01-the-owners-answers-2026-11-05) · [§4](../../implementations/2026-11-05-phase2-plan.md#4-mathematical--statistical-details) (how hard a code is to guess) · [§5](../../implementations/2026-11-05-phase2-plan.md#5-design-decisions)
- [Rehaul plan §4.1](../../implementations/2026-10-29-couples-rehaul-plan.md#41-stack-changes), which this replaces for auth and invites
- [A2's record](../../implementations/2026-11-05-phase2-a2-pairing-flag.md)
