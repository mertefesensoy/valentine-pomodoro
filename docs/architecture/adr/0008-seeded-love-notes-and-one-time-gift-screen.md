---
id: ADR-0008
title: Seeded love notes and a one-time gift screen
status: accepted
date: 2026-01-07
owner: Mert Efe Şensoy
related: [ADR-0020, ADR-0030]
---

# ADR-0008: Seeded love notes and a one-time gift screen

This record merges DECISIONS §8 (20 default notes) and §14 (gift mode on first launch only), plus open question Q2. Both shape what the app stores on first run.

> **Status note:** still in force. Phase 1 changes the content, not the mechanism. It was decided by the owner (Phase 1 plan §0) and is not yet built: new, name-free default notes for fresh installs only (D2), and the gift screen loses "for Bengisu". The B2 migrator writes the v1.3.1 defaults explicitly for existing installs. Phase 5 turns the gift idea into "Gift Plus to your partner" (rehaul plan §3.1).

## Context

The app began as a gift for Bengisu. The first launch should feel like a reveal, and the love-note card that follows each focus session should never be empty.

## Decision

- **Love notes:** 20 cute, supportive default notes, with Bengisu named in only 2. The user can add, edit and delete them (DECISIONS §8).
- **Gift screen:** a "made with love" screen shown once on first launch, then never again, unless reset from a hidden dev option. A flag in AsyncStorage records it (DECISIONS §14).
- **Q2 (the hearts animation)** was settled by the shipped `GiftModeModal` (rehaul plan §2.2).

As built (Stage A §3.3):
- The gift flag lives under the `gift_mode` key.
- `love_notes` is written only once the user edits a note, as a bare `string[]`. Until then the app shows the 20 defaults from code.

## Consequences

**Positive**
- There is no blank slate on first launch, and the reveal happens once.

**Negative**
- Unedited notes are not stored. So "which notes does this user have?" depends on the code version, and changing `DEFAULT_LOVE_NOTES` would silently replace an unedited user's notes. Hence the B2 rule, and a frozen `V131_DEFAULT_LOVE_NOTES` fixture extracted from the release branch (Phase 1 plan §5).
- Every install says "for Bengisu" on its first run (SDK 58 upgrade §6.3, Android finding 5). This is planned to change in D2.

## Alternatives considered

- **A blank slate, or a reveal on every launch.** Each is implied by the rationale in DECISIONS §8 and §14 ("avoids blank slate", "doesn't become annoying").
- **Q2: a particle system of dozens of hearts.** Not chosen; DECISIONS.md recommended 2–3 floating hearts.

## Links

- [`DECISIONS.md` §8](../../../DECISIONS.md#8-love-notes-20-default-seeds) · [§14](../../../DECISIONS.md#14-gift-mode-first-launch-only) · [Q2](../../../DECISIONS.md#q2-gift-mode-animation)
- [Phase 1 plan §0](../../implementations/2026-10-29-phase1-plan.md#0-decisions-you-made-2026-10-29) · [Stage B (B2)](../../implementations/2026-10-29-phase1-plan.md#stage-b--local-re-architecture-behind-the-gates) · [§5](../../implementations/2026-10-29-phase1-plan.md#5-design-decisions-and-findings)
- [Phase 1 Stage A §3.3](../../implementations/2026-10-29-phase1-stage-a.md#33-a3-the-v131-storage-fixtures)
- [Rehaul plan §2.2](../../implementations/2026-10-29-couples-rehaul-plan.md#22-decisionsmd) · [§3.1](../../implementations/2026-10-29-couples-rehaul-plan.md#31-name-and-brand-decision-needed-before-phase-7-working-name-until-then)
- [SDK 58 upgrade §6.3](../../implementations/2026-10-29-expo-sdk-58-upgrade.md#63-device-checks-yours)
- [`PRODUCT.md`, brand commitments](../../../PRODUCT.md#brand-commitments)

## Backlinks
<!-- backlinks:start -->
- [MMKV for local storage, with a one-time migration from AsyncStorage](0030-mmkv-storage.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
