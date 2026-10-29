---
id: ADR-0005
title: Track and cancel only the session's own notification
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0004, ADR-0016, ADR-0023]
---

# ADR-0005: Track and cancel only the session's own notification

## Context

The "session done" alert is a local notification scheduled for `endAt` ([ADR-0004](0004-timestamp-based-timer.md)). Pause, reset, skip or a mode switch must cancel it. The app was expected to schedule other notifications too, such as reminders and nudges (DECISIONS §4).

## Decision

Store the `scheduledNotificationId` returned when the alert is scheduled, and cancel only that notification (DECISIONS §4).

As built: `useTimer` keeps the id on the Pomodoro slot of the session clock (`session.setSlotExtras('pomodoro', { scheduledNotificationId })`). Each path that stops the session cancels it. When Pomodoro goes dormant on a mode switch, its notification is cancelled the same way as on pause. Fly Mode keeps its own id in `flyNotifIdRef` and cancels it on unmount (timer unification §3).

## Consequences

**Positive**
- Other notifications can coexist. The daily reminder with quiet hours, a later feature, shipped next to the timer alert (rehaul plan §1.1).
- It carries into v2 (rehaul plan §2.1). Solo sessions keep this local-notification path, which also works offline (rehaul plan §4.2).

**Negative**
- Every code path that ends or hides a session must remember to cancel its own id: pause, reset, skip, mode switch and Fly unmount.
- A local notification on a partner's sleeping phone can't be cancelled when the other partner pauses. Shared sessions therefore need a server push instead ([ADR-0023](0023-server-push-for-shared-sessions.md), proposed).

## Alternatives considered

- **Cancel all scheduled notifications.** It would break future reminders, a daily summary and streak reminders, and it gets less predictable as the code grows (DECISIONS §4).

## Links

- [`DECISIONS.md` §4](../../../DECISIONS.md#4-notification-id-tracking)
- [Timer unification: notification cancel on mode switch](../../implementations/2026-04-19-timer-unification.md#notification-cancel-on-mode-switch)
- [Rehaul plan §2.1](../../implementations/2026-10-29-couples-rehaul-plan.md#21-planmd-2026-01-07-v1-build-plan) · [§4.2, completion and notifications](../../implementations/2026-10-29-couples-rehaul-plan.md#42-the-shared-session-engine-the-core-of-v2)

## Backlinks
<!-- backlinks:start -->
- [Server push for shared-session completion and partner actions](0023-server-push-for-shared-sessions.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
