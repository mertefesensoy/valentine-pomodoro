# Ticket-Cutting Feature: Pre-flight Animation Scoping

**Date:** 2026-04-20
**Status:** Decision capture, not a plan.

---

## Concept

Before a Fly session begins, the user sees a boarding pass on screen. After tapping Start, an overlay appears showing the ticket in full. The user performs a tear gesture, dragging across the ticket to rip it in two, as if physically boarding the flight. Completing the tear is what starts the Fly session clock. This gate is Valentine-themed and intended to make every session feel like a deliberate act of departure, not just a tap on a button. The animation can be turned off in Settings from day one, so users who run dozens of sessions per week can opt out without friction.

---

y

## Decisions

**Gate or gesture.** The ticket-cutting is a gate: the session cannot start without the tear completing. The user chose this because the friction is intentional, matching the emotional weight of boarding a flight rather than incidentally tapping a button.

**Placement in the flow.** The ticket overlay appears after the user taps Start on the current pre-flight screen. Tapping Start moves the user into the boarding step; completing the tear moves them into the active session. The Start button remains the first action; the tear is the second.

**Cut visual.** Tear: a drag gesture physically rips the ticket in two. The user chose this as the most tactile and emotionally resonant of the three options, matching the Valentine theme of the app better than a swipe-to-reveal or a stamp pattern.

**Repeat-use tolerance.** The animation is optional from day one, with a Settings toggle visible immediately. Users who keep it on accept the tear as part of every Fly session; users who disable it get today's tap-to-start behaviour with no gate.

**Clock coupling.** When the animation is enabled, the tear gesture is the trigger for `session.start()`. The clock starts on gesture completion, not on the Start tap. When the animation is disabled in Settings, `session.start()` fires directly on the Start tap, matching today's behaviour. Both paths must route through the same clock call so the session slot state stays consistent; there is no version of session start that bypasses `useSessionClock`.

---

## Open questions

The conditional clock-coupling raises a question not resolved here: both code paths, gesture-completion and direct-tap, must call `session.start()` identically. How that branching is structured is a decision for the planning conversation.

The user did not specify what should happen if the tear is interrupted partway. The finger lifts before the gesture completes: does the ticket spring back to uncut, does it stay partially torn and wait for the user to resume, or does the partial tear abandon and return to the pre-Start state? This is unresolved.

Accessibility fallback for the gate is not defined. A user who cannot perform a drag gesture has no path to start a Fly session when the animation is enabled. This gap must be addressed before the planning conversation begins.

---

## Risk surface

The feature introduces a new state between Start-pressed and session-running where today there is none. The existing pre-flight state machine moves directly from idle to running on a single tap; adding an intermediate state means cold-start restore logic must know whether the gate was completed. If the app is killed after tapping Start but before finishing the tear, the restored state must return to idle, not re-present the gate for a session that was never started. Separately, when `useSessionClock` restores an already-paused session on cold start, the boarding overlay must not appear at all, because that session is already past the boarding step. Both the gesture-completion path and the Settings-disabled direct-tap path must call `useSessionClock.start()` without exception, so the slot snapshot stays consistent.

---

## Not decided yet

This document does not answer: visual design of the ticket (layout, perforation pattern, colour palette, copy), specific animation timing (tear duration, easing curve, haptic pattern during the tear), exact file or component locations, effort estimate, accessibility fallback for the drag gesture, or error-recovery behaviour if the tear gesture is interrupted before completion.

---

## Next step

When the user is ready to scope this as a real task, this document is the input to the planning conversation.
