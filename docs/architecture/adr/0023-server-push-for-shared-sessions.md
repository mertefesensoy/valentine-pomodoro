---
id: ADR-0023
title: Server push for shared-session completion and partner actions
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0005, ADR-0021, ADR-0022]
---

# ADR-0023: Server push for shared-session completion and partner actions

> **Status note:** accepted on 2026-10-29 as part of the approved rehaul plan. **Not built yet** (Phase 3). "Accepted" records the decision; build status is tracked in the [roadmap](../../roadmap/ROADMAP.md).

## Context

v1 fires its "session done" alert as a local notification scheduled for `endAt`, and cancels it by id ([ADR-0005](0005-notification-id-tracking.md)). In a shared session, the partner can pause while your phone is asleep. A local notification on your phone can't be cancelled then, so it would fire at the wrong time (§4.2).

## Decision

| Case | Who fires the alert |
|------|---------------------|
| Solo session | A local notification at `ends_at`, as today. It works offline. |
| Shared session ends | A **server push.** `pg_cron` runs every 10 s: `UPDATE … SET status='completed' WHERE status='running' AND ends_at <= now() RETURNING …`, then an Edge Function sends an Expo push to both partners. |
| Partner pauses, resumes or skips | A server push ("Doro paused the session"). |
| App in the foreground | The client completes optimistically at the corrected `ends_at`, and the server confirms. |

Push tokens are therefore stored on the server, in a `push_tokens` table under row-level security. This reverses the scale plan's "push token not stored server-side" (§2.3).

## Consequences

**Positive**
- No stale alert on a sleeping phone: the server knows the truth.
- No visible lag in the foreground, thanks to optimistic completion.

**Negative**
- **Latency.** In the worst case about 10 s plus delivery. The 10-second schedule needs `pg_cron` 1.5 or later; the fallback is a 1-minute job, with the background push up to about 60 s late (§4.2).
- **iOS limits background push delivery.** Mitigated with visible alert pushes, not silent ones, plus a reconcile on every foreground (§10).
- Push tokens become personal data held on the server, which the privacy policy must disclose.

## Alternatives considered

- **Local notifications on both phones.** Rejected: an alert can't be cancelled on a sleeping phone when the partner pauses (§9).

## Links

- [Rehaul plan §4.2, completion and notifications](../../implementations/2026-10-29-couples-rehaul-plan.md#42-the-shared-session-engine-the-core-of-v2) · [§2.3](../../implementations/2026-10-29-couples-rehaul-plan.md#23-scale-planmd-2026-04-20) · [§4.3](../../implementations/2026-10-29-couples-rehaul-plan.md#43-database-schema-indexes-and-rls) · [§9](../../implementations/2026-10-29-couples-rehaul-plan.md#9-design-decisions) · [§10](../../implementations/2026-10-29-couples-rehaul-plan.md#10-risks)

## Backlinks
<!-- backlinks:start -->
- [Track and cancel only the session's own notification](0005-notification-id-tracking.md)
- [Supabase as the backend](0021-supabase-backend.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
