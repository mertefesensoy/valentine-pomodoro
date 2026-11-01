---
version: 1
slug: "app-tutorial-tsx"
primary_target: "app/tutorial.tsx"
related_targets: []
---

# The general tutorial: Pomo & Doro show you around (first run, `/tutorial`)

Surface brief from `/impeccable shape`, Phase 1 D5 (Stage D plan §3.9), 2026-11-01. **Mode: Operate.** It's a teaching layer over the live tabs, and the visitor succeeds by knowing where things are and starting a focus. Build path: code-led.

**The owner's discovery answers, 2026-11-01:**
- **Placement:** right after the welcome.
- **Format:** over the real screens.
- **Length:** about six steps.
- **Moving on:** you tap the real control, with Next as a backup.
- **The end:** it invites your first focus.
- **Standing rule:** one general tutorial for first-timers, and a version tutorial for each later feature release. v1.4 shows only the general one, to new installs and to v1.3.1 updaters alike.

## 1. Job and audience

- **Who arrives:** two groups, both straight from the one-time welcome's Start.
  - a new install, on its first launch;
  - someone updating from v1.3.1, on their first launch of v1.4. They know a timer and love notes, and none of v1.4's presets, layouts, Modes, stickers, postcard Stats, language choice or sounds.
- **Their state of mind:** curious. They've just seen the diary open and the pair become the mark.
- **What they need:** where things are, and how a day works: pick a length, focus, a sticker lands, today's goal fills. Then they start.

## 2. Outcome and proof

- **Primary action:** starting the first focus, on the last step. "Not now" ends the tour instead.
- **Success:**
  - about a minute, in about six steps;
  - the person's own finger has pressed the real Stats tab, Notes tab and Modes button once;
  - Skip works at any moment.
- **What only this app has:**
  - The guides are the app's own two characters, the colon of its timer. They take turns, each in their own made-up babble (never a human voice).
  - They point with their own new gestures, as stickers on the diary's pages.

## 3. Selected direction: they show you, you press

- **Hand-over:** the welcome's Start still dissolves its page into the Timer tab. There, Pomo & Doro step out onto the page. Their entrance is the tour's one delight.
- **Over the live tabs:**
  - **The pair** stand in a dock, clear of whatever they're talking about.
  - **The speaker's bubble,** a paper field, rises from them.
  - **The rest of the screen dims** to a soft wash, with a rounded opening around the one control in question.
  - **Only that opening answers a tap.** Pressing it does exactly what the real control does.
- **Turn-taking:**
  - Pomo and Doro alternate lines.
  - The speaker talks: mouth moving, babble playing, the line writing on.
  - The listener reacts, nodding or watching the spotlit control.
- **You press:**
  - At the steps that move on (the Stats tab, the Notes tab, back to Timer), the bubble asks you to tap the spotlit control.
  - **Next** in the bubble always works, and does the same thing for you.
- **The ending:** the real Start focus button is spotlit. "Shall we start your first one together?"
  - Starting the focus ends the tour, and the session runs as usual.
  - "Not now" in the bubble ends the tour without starting anything.

**The steps,** one idea each:

| # | Where | What they show |
|---|---|---|
| 1 | Timer | Hello: who they are, and that they'll show you around. The first line differs: updaters hear that the diary has lots that's new |
| 2 | Timer, the presets | Pick how long: 25/5, 50/10, 90/20 or your own Custom |
| 3 | Timer, today's row | Every focus you finish presses a sticker onto today's page and fills toward today's goal |
| 4 | Timer, the Modes button | Ring or Facing pages, and Fly over the map (open: §7) |
| 5 | Stats, after you tap its tab | Your week as a stack of postcards; the goal and the love streak |
| 6 | Notes, after you tap its tab | Love notes after a focus; you can write your own |
| 7 | Timer, after you tap its tab, Start focus spotlit | The invitation to your first focus |

## 4. Scope and boundaries

- **Target:** `app/tutorial.tsx`, a root-stack route over the tabs, as the welcome is. The build lives in `src/screens/tutorial/`.
- **Shown:**
  - once, right after the welcome, so it inherits the welcome's calm-entry gate (HIG W-H1);
  - never over a running or paused session, never in Fly, never when opened from a notification or a link.
- **Replay:** Settings › About gets "Watch the tutorial again" beside "Watch the welcome again". The welcome's replay doesn't chain into the tour.
- **Remembered:** under its own additive key, holding the version of the last tutorial seen. Finishing or skipping writes it. A tour killed half-way shows again at the next calm launch, from the start.
- **Unchanged:**
  - the welcome's choreography and copy, and the splash;
  - the cold-start path: the tutorial's art and sounds load only when it starts;
  - the B2 migration and every existing key;
  - the session engine and Fly.
- **Anti-goals:**
  - no carousel of marketing pages, and no "what's new" list;
  - no permission prompt or sign-in inside the tour;
  - no human voice;
  - no toddler-app bubbles: no oversized bubbly type, no primary-colour cartoon;
  - no blur or glass for the dim (the No Glass Rule), no emoji, no tomato, clock or heart;
  - never more than one delight;
  - never during a session.

## 5. States and ranges

- **New install or updater:** the same steps; only the first line differs.
- **Layout:** the Ring or Facing pages, whichever is set. Every opening follows the control's measured position, never a fixed spot.
- **Light and dark:** both first-class. The dim is a wash of the theme's own ink.
- **Reduce Motion:**
  - no hops, bounce or squash;
  - gestures become pose changes;
  - the bubble fades in;
  - the opening crossfades between controls instead of travelling.
- **Dynamic Type:** the bubble grows with the text and wraps Turkish's longer lines. At AX sizes the dock moves so the spotlit control stays in view, and the bubble may take most of the width.
- **VoiceOver:**
  - Each step moves focus to the bubble, read with the speaker's name, then Next and Skip.
  - The spotlit control keeps its own label.
  - The babble is silent while VoiceOver speaks.
- **Sound:**
  - The babble follows Settings › Sound and the silent switch, in D4's ambient session.
  - It's quieter than the UI sounds.
  - Pomo's voice is higher and bouncier, Doro's lower and rounder.
- **Skip:** always on screen. It ends the tour and remembers it.
- **Interrupted:** backgrounded mid-tour, it resumes at the same step on return.

## 6. Interaction and layout

- **Hierarchy at each step:** first the spotlit control, then the speaker and their bubble, then Next and Skip.
- **The pair:**
  - drawn as stickers (die-cut edge, the soft sticker shadow), larger than in the partner strip;
  - the speaker in front, the listener a little behind.
  - **New poses (VectorCraft, for each character):** wave, point, talk, listen or nod, and cheer.
- **The bubble:**
  - a paper field (radius 22, the crisp edge, no shadow: only stickers lift) with a tail towards the speaker;
  - its text in the system face at body size.
  - **Write-on:** the line writes on at a reading pace with the speaker's babble. A tap on the bubble finishes the line at once.
  - **Next** is the bubble's action.
- **The opening:**
  - a rounded cutout following the control's own radius, with a little breathing room;
  - it glides between controls on the sheet curve, or crossfades with Reduce Motion.
- **Tab changes:** as the tab bar's own, with no animation.
- **Feedback:** presses scale 0.97 with their haptic, as everywhere else. No haptic per line.

## 7. Constraints and open decisions

- **Platform:**
  - iOS 16.4+, Expo Router with NativeTabs and native form sheets.
  - The native tab bar and sheets sit above React Native views, so the layer can't just let a tap fall through to the real tab.
  - The contract decides, after a spike, how the opening's tap acts as the control: for example, forwarding it to the same navigation.
- **Open: the Modes step.** A native sheet would cover the layer. Either the pair explain at the button and the step moves on, or the Modes sheet hosts its own bubble.
- **Open: motion.** The pair's talking and gestures are character animation, like the welcome's, so DESIGN.md's motion table needs a "Tutorial (first run)" row: an owner-approved exception, as "Welcome (once)" is. The sticker placement keeps its own bounce.
- **Open: the dock.** Above the tab bar or at the top, and where the bubble goes on each step.
- **Assets** (D5's step 4, each approved by the owner, and possibly made in a parallel session as D4's were):
  - the pair's new poses, on a pose sheet;
  - their babble, a small set of syllables each, on a listening page.
  - Budgets: NFR-PERF-005 (an illustration ≤ 30 KB, a UI sound ≤ 25 KB).
- **Every line** is a key in English and Turkish and goes through the copy review. The babble carries no language.
- **The per-version rule:** the store and the layer serve a list of tutorials keyed by version, so a later version tutorial needs content only, not a new engine.
