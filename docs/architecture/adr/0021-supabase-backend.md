---
id: ADR-0021
title: Supabase as the backend
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0022, ADR-0023, ADR-0025, ADR-0029, IMPL-2026-10-29-couples-rehaul-plan]
---

# ADR-0021: Supabase as the backend

## Context

v1 is entirely local, with no server and no accounts (rehaul plan §1.1). Pairing, a shared room, presence, cheers and server-side credits all need a backend.

## Decision

**Supabase**, the owner's decision on 2026-10-29 (rehaul plan §0): Postgres, Auth, Realtime, Edge Functions, Storage and `pg_cron`. Scaling is left to the managed service: no load balancer or Redis of our own (rehaul plan §6.1, §9).

The plan's design on top of it (Phase 2; not built):
- **Auth.** Anonymous sign-in for solo use, then a linked Sign in with Apple, Google or an email magic link to pair (§4.1).
- **Row-level security** on every table. Membership is checked by the `is_couple_member(couple_id)` function, `auth.uid()` is wrapped as `(select auth.uid())`, and the policies are tested with pgTAP (§4.3).
- **Account deletion in the app** (App Store Guideline 5.1.1(v)) and a JSON data export (GDPR, KVKK) (§4.3).

## Consequences

**Positive**
- Real Postgres, so indexes, rollups and N+1 work are real (§9). Realtime carries presence and session rows, and `pg_cron` runs the completion worker ([ADR-0023](0023-server-push-for-shared-sessions.md)).
- No servers to run. The gateway and the Supavisor pooler already balance and pool connections (§6.1).

**Negative**
- The app now depends on a vendor and needs a network for anything shared.
- **TBD (owner, Phase 2):** creating the Supabase project, with its organisation and region. An EU region is closest for users in Turkey (§11).
- The 10-second completion schedule needs `pg_cron` 1.5 or later. Check the project's version in Phase 2 (§4.2).
- Privacy obligations. The README's "no server connections" claim was already false (finding F9), and a new policy (EN/TR) is due in Phase 2.

## Alternatives considered

- **Self-hosted Node, a load balancer and Redis.** At couples-app scale, every self-run service is more risk and cost (§9).
- **Redis for caching.** Postgres rollups and a CDN cover it, and Redis would be one more service to run (§6.1).

## Links

- [Rehaul plan §0](../../implementations/2026-10-29-couples-rehaul-plan.md#0-decisions-you-made-2026-10-29) · [§4.1](../../implementations/2026-10-29-couples-rehaul-plan.md#41-stack-changes) · [§4.3](../../implementations/2026-10-29-couples-rehaul-plan.md#43-database-schema-indexes-and-rls) · [§6.1](../../implementations/2026-10-29-couples-rehaul-plan.md#61-every-item-you-asked-for) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions) · [§11](../../implementations/2026-10-29-couples-rehaul-plan.md#11-what-i-need-from-you)
- [Rehaul plan §1.2, finding F9](../../implementations/2026-10-29-couples-rehaul-plan.md#12-what-is-wrong-with-it)

## Backlinks
<!-- backlinks:start -->
- [Architecture decision records](README.md)
<!-- backlinks:end -->
