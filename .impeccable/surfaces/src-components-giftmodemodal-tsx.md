---
version: 1
slug: "src-components-giftmodemodal-tsx"
primary_target: "src/components/GiftModeModal.tsx"
related_targets: ["src/App.tsx"]
---

# The gift screen, retired (first launch)

Surface brief from `/impeccable shape`, Phase 1 D2, 2026-10-31. Stage D plan §3.3 gives the Gift screen its own brief; the owner's answer makes it a retirement.

## Decision

**The owner, 2026-10-31: retire v1's first-launch gift screen.**
- **What goes:** `GiftModeModal`: "made with love", "for Bengisu", "from someone who believes in you", "Let's start".
- **The first run:** on a fresh install, D1's welcome becomes the only first-run screen. The Timer paints, then the welcome fades in. This settles the D1 HIG review's Medium finding: two first-run screens in a row, against `onboarding.md`'s "a brief, enjoyable experience".
- **Where the origin goes:** one plain line in Settings › About, with no emoji. Draft: "Valentine Pomodoro began as a gift for Bengisu." In Turkish: "Valentine Pomodoro, Bengisu'ya bir hediye olarak başladı." The owner reviews both. This is the only place her name appears in the public product (PRODUCT.md, Brand commitments).

## Consequences for the builder

- **Removed:** `GiftModeModal` and its gate in `App.tsx`.
- **Kept:**
  - the `hasSeenGiftMode` key stays in storage, since every key is kept;
  - it's no longer read for the first run;
  - B2's migration tests stay green.
- **The welcome's gate** (`useWelcomeGate`) no longer waits for the gift. It still never shows at launch, never over a running session, and only once.
- **Bengisu's install:** she is long past her first launch, and nothing she sees changes. The welcome already showed her once, over the update.
- **Anti-goals:**
  - no personal name anywhere else, including default notes and interface copy;
  - no replacement first-run screen.

## Later

PRODUCT.md's heritage line, "Gift Plus to your partner", belongs to Phase 5's paywall, not here.
