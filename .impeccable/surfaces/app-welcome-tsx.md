---
version: 1
slug: "app-welcome-tsx"
primary_target: "app/welcome.tsx"
related_targets: ["src/screens/welcome/WelcomeScreen.tsx"]
---

# The v1.4 welcome: the diary opens (one-time, `/welcome`)

Surface brief from `/impeccable shape`, Phase 1 D1, 2026-10-30. Mode: **Experience**. Build path: code-led (no image generation here). Seed `seed:4270e69e80262e87`. The locked sketch is `art/review/d1-welcome-diary-opens.html`, the composition the build matches. The owner's discovery answers: the morph, one line, then Start; one screen with its own line for updaters and fresh installs; replayable from About (D2).

## 1. Job and audience

Everyone sees it once, the first time v1.4 opens: people updating from 1.3.1 or build 47, and fresh installs. It introduces the new identity in one beat (Pomo & Doro become the Same Page mark), then hands over to the timer. It is not a launch screen (HIG H-2), and it is not a tutorial.

## 2. Outcome and proof

- **Primary action:** Start, visible and live from the first frame. It goes to the Timer tab.
- **Success:** about three seconds from the first frame to the settled mark. One warm line is read, and nothing is asked of the user.
- **What only this app has:** the morph, the owner's signature animation (ADR-0047). The pair becomes the two pages of one diary.

## 3. Selected direction: The diary opens

The dealt lead, chosen by the owner on 2026-10-30. Of the seven structures (1 The Colon, 2 Apart then together, 3 Centre stage, 4 Sticker press, 5 The diary opens, 6 Today's page, 7 Washi tape), the roll dealt 5, 1 and 6. The two not chosen are kept in `art/review/d1-welcome-colon-not-chosen.html` and `art/review/d1-welcome-todays-page-not-chosen.html`.

- **First frame:**
  - a closed diary centred on the milk page, in the mark's cocoa, with its die-cut white edge, the soft plum-tinted sticker shadow, and a strawberry ribbon bookmark down the cover
  - Pomo & Doro sitting on its top edge
  - the line's slot beneath, then the Start pill
- **The morph, about 2.4 s:**
  1. The cover opens to one spread on one gutter (never a third panel).
  2. Pomo steps onto the left page and Doro onto the right; each hands over to its page at the same position.
  3. The spread leans in and settles as the Same Page mark, on its identity-sheet clear space, where the diary was.
  4. Then the line lands.
- **Raises,** each named for its donor. All six catalog challengers were declined on both axes:
  - **One cord** (drawcord cape): every part of the morph runs off one progress value, so it reverses, or reduces to a crossfade for Reduce Motion, without a second choreography.
  - **Unbroken custody** (provenance ribbon): nothing appears from nowhere; every shape in the final mark comes from a shape in the first frame.
  - **Colour as event** (moiré gallery): strawberry and matcha are the only colour on the page, and they resolve into the mark's cocoa at one instant.
  - **Registration** (design annual plates): the mark lands on its clear space (X = a quarter of its height), and the line and Start align to that X.
  - **Same object** (HyperCard stack): Start doesn't push a screen; the page dissolves into the Timer tab.
  - **Layered handover** (nixie counter): character and page are stacked at one position and hand over in a single crossfade, never a half-melted shape.

## 4. Scope and boundaries

- **Target:** `app/welcome.tsx`, a root-stack route over the tabs presented full screen with a fade, built in `src/screens/welcome/`.
- **Shown:** once per install, gated by a new additive "welcome seen" flag, plus the About replay in D2.
- **Only on a calm entry (HIG W-H1):** never over a running or paused session, and never when the app was opened from a notification or a deep link. A session can survive the update, because the clock is timestamp-based. Otherwise it waits for the next calm moment: Timer focused and idle, with no completion sheet up. That keeps PRODUCT principle 5 and `launching.md`'s "Restore the previous state".
- **Unchanged:** the splash (the static mark), the cold-start path (the screen appears after the first interactive frame), the B2 migration, and every existing storage key.
- **Anti-goals:**
  - no carousel, second beat, "what's new" list, permission prompt or sign-in
  - no confetti, sparkle or bounce (the bounce belongs to the sticker placement)
  - no tomato, clock or heart
  - no logo repeated after the screen closes

## 5. States and ranges

- **The line:**
  - updaters: "Your diary has a new look."
  - fresh installs: "Meet Pomo & Doro."
  - Both are i18n keys with Turkish drafts. The owner reviews the copy in `clarify`.
- **Light and dark:** in Midnight Plum the mark arrives in its reversed version (strawberry pages, identity sheet C5). The ground is the splash's own colour (`#FFF6F1` light, `#221726` dark), so nothing flashes between the launch screen and this one (`launching.md`).
- **Reduce Motion:** a crossfade from the first frame to the settled mark, with no translate or scale.
- **Dynamic Type:** the line wraps to up to three lines at AX5, and the art scales down so that Start stays on screen.
- **Size classes:**
  - Compact height: the art leading, with the line and Start trailing.
  - Regular width: centred at a readable width.
- **Interrupted:** Start mid-morph dissolves straight to the Timer tab, and the flag is still set.
- **VoiceOver:** one element for the art ("Pomo and Doro become the pages of one diary"), then the line, then Start.

## 6. Interaction and layout

- **Hierarchy:** the art, then the line, then Start.
- **Start** is the same pill as Classic's primary (strawberry with a cocoa label, at least 54 pt), in thumb reach above the home indicator.
- **Motion:** the morph is this screen's one delight. It uses ease-out curves with no overshoot. One light haptic may mark the moment the pages meet, following `settings.haptics`; whether it stays is decided on the device.
- **Exit:** Start fades the screen out over about 250 ms into the Timer tab.

## 7. Constraints and open decisions

- **Platform:** iOS 16.4+. Reanimated on the UI thread. The morph never blocks Start (`motion.md`: "Let people cancel motion").
- **Art:** the existing poses and mark versions (`art/out/`). Any in-between frame is made in VectorCraft through `scripts/art/build.mjs`, within budget.
- **Copy:** EN and TR keys from D1.
- **Open:** the final line copy (owner, `clarify`), and the pages-meet haptic (device check).

## Direction contract

THESIS: The welcome is the diary itself, opened once. It refuses the category default (an onboarding carousel of illustrated feature cards with page dots and a Skip link) and the launch-screen logo moment. One object, one morph, one line, one action.

OWN-WORLD: The milk `page` ground. The diary in the mark's cocoa, with its die-cut white edge, the plum-tinted sticker shadow and a strawberry ribbon down the cover. Pomo's strawberry and Doro's matcha are the only colour until they become cocoa pages. Baloo 2 SemiBold for the one line. The strawberry pill with a cocoa label. In Midnight Plum the mark arrives reversed.

STORY: Updaters see their diary get a new look; fresh installs meet Pomo & Doro. Both understand that the pair is a couple on one page, press Start, and are on the timer.

FIRST VIEWPORT: iPhone portrait.
- The closed diary centred at about 60 % of the width, with Pomo & Doro sitting on its top edge.
- The line's slot under it.
- The Start pill, at least 54 pt tall, in thumb reach above the home indicator, live from the first frame.

The signature interaction: the cover opens to one spread, each character steps onto a page and becomes it, and the spread leans in and settles as the Same Page mark on its clear space. Start then dissolves the page into the Timer tab.

FORM: The diary opens, structure 5 of 7 on the welcome list and the dealt lead, chosen by the owner. seed:4270e69e80262e87

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
