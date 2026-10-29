<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Valentine Pomodoro (working name)
description: A kawaii couples study timer. Pomo & Doro, two little tomatoes, keep a sticker diary of the focus you share.
---

# Design System: Valentine Pomodoro (working name)

> **PINNED DIRECTION — the brief wins.** The kawaii tomato-couple direction (rehaul plan §5.2–5.3, approved 2026-10-29) and the North Star "The Sticker Diary" (chosen 2026-10-29) are pinned by the owner. Refinement passes (`critique`, `audit`, `polish`, `quieter`, `distill`, `harden`) tune execution *inside* this direction. They must not flatten it into a generic minimal look, and they must not swap the North Star for a calmer one. Changing the direction needs the owner's explicit words.

## Overview

**Creative North Star: "The Sticker Diary"**

The app is the diary a student couple keeps together, the kind of kawaii stationery people carry to the library. Its pages are the screens: soft paper fields with crisp edges, set in calm, quiet chrome. Its stickers are the rewards. Pomo & Doro, two small original tomatoes, are drawn as stickers, and every completed session, landed flight, ripe garden tomato and couple milestone is a sticker placed onto the diary. The paper stays calm; the stickers carry the emotion.

It is an Operate product first. A student opens it to start a focus session in seconds and to see that their partner is there. The world lends four things only: **type, palette, density, and one signature move**. Navigation, layout model and controls stay native: a tab bar, sheets, switches and pickers that a fluent iPhone or Android user already trusts. Long-distance is the lead situation, so **both partners are always in the frame**: the partner's presence, intention and local time are part of the page, not a detail behind a tap.

The tone is soft, not sugary. It is cute enough to be loved and grown-up enough that a university student is happy to open it in a lecture hall. There is one delightful moment per screen, never ten. Nothing in the visual language ever scolds.

**Signature move: the sticker placement.** When a session completes, its sticker is pressed onto today's page: a playful spring, a few paper or heart particles, and a success haptic. It is the only bouncy motion in the product. Stats, streaks and the weekly recap read as diary pages filling with stickers. Mode rewards (passport stamps, garden produce, room decor, pet tricks) arrive the same way.

**Motion grammar** (from plan §5.3, the Emil Kowalski `animate-expo` rules):

| Interaction | Motion |
|-------------|--------|
| Start / Pause / Skip press | Press-in to scale 0.97 over 100–150 ms, ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, haptic on the same frame. Nothing else. |
| Tab switch | No animation. |
| Bottom sheet | Spring, 300 ms, damping ratio 0.8, drawer curve `(0.32, 0.72, 0, 1)`. The exit is faster than the entrance. |
| Phase change (focus ↔ break) | Ring colour and mascot pose crossfade over 200–300 ms. A pose change, not a bounce. |
| Sticker placement (completion and rewards) | The one delight: a spring with bounce about 0.2–0.3, at most 24 particles (transform and opacity only), success haptic. |
| Partner presence change | The avatar fades in and scales from 0.95, never from 0. |
| List entrance | Stagger 30–60 ms, never on virtualized rows. |

With Reduce Motion on, opacity and colour stay; translate, scale, particles and overshoot drop, and screen transitions become fades.

**Key Characteristics:**

- Paper pages, sticker rewards, calm chrome.
- Pomo & Doro carry the emotion; the interface does not perform.
- Both partners visible on every primary screen.
- Native navigation and controls; the brand lives in type, palette, density, icons and the sticker move.
- One delight per screen; nothing ever punishes.

## Colors

Warm pastel fields, never gradients. Each theme is a complete token set plus one VectorCraft illustration pack, and the stationery world (washi tape, highlighters, sticker sheets) is where new theme colours come from.

**Hex values are `[to be resolved during implementation]`**, in Phase 1, by the token file plus its contrast-check script. Only the roles below are established.

### Primary

- **Strawberry Pink:** primary actions, the active ring and selection in Strawberry Milk (light default, Free).

### Secondary

- **Tomato Red:** the accent of the brand and the mascots, used sparingly for emphasis and the sticker moment, never for large fields of chrome.

### Tertiary

- **Leaf Green:** success, goal reached, garden growth.

### Neutral

- **Milk Cream:** the page ground in Strawberry Milk, the colour of the milk, not of parchment.
- **Cocoa:** body text and icons on light grounds. Secondary text is tinted from cocoa, never grey.

### Themes

| Theme | Tier | Role |
|-------|------|------|
| **Strawberry Milk** | Free | Light default |
| **Midnight Plum** | Free | Dark default: a plum-tinted night page, not black or grey, so the diary at night stays warm. Its roles mirror Strawberry Milk. |
| Matcha Latte, Peach Soda | Plus | Full token sets |
| Sakura, Cozy Autumn, Snow Globe, Valentine | Plus, seasonal | Full token sets |

Light and dark follow the system appearance, because the use scene covers both: a bright library by day and bed at night. Both are first-class.

### Named Rules

**The Contrast Gate Rule.** Every text and background pair in every theme meets 4.5:1 for body text, and 3:1 for large text and icons. A script over the token file proves it. A theme that fails does not ship.

**The Paper Not Gradient Rule.** Fields are flat paper colours. No purple-to-blue aurora, no gradient text, no gradient buttons.

**The Theme Is The Product Rule.** Themes are part of what Plus sells, so the palette never yields to Android Dynamic Color (Material You) wallpaper colours.

## Typography

**Display Font:** a rounded display face, `[to be resolved during implementation]`. Candidates to test: Fredoka, Baloo 2, M PLUS Rounded 1c.
**Body Font:** the system face (SF Pro on iOS, Roboto on Android, the platform UI stack on the web).

**Character:** a soft, round display voice for headings, the timer and sticker captions, paired with the platform's own body face, so reading and controls stay native and accessible.

**Requirements the display face must pass before it is chosen:** full Turkish coverage (ğ ı İ ş ç ö ü, including dotted and dotless i casing) and **tabular figures**, so the timer digits never jiggle as they count. It also needs a licence that allows app embedding.

### Hierarchy

- **Timer** (display face, tabular figures): the largest text on its screen.
- **Display / Headline** (display face): screen titles and sticker captions.
- **Body, Label** (system face): everything else. It follows Dynamic Type on iOS (body 17 pt, floor 11 pt) and `sp` on Android.

Exact sizes and weights are `[to be resolved during implementation]`, mapped to the iOS text styles and the Material type roles rather than hand-picked per screen.

### Named Rules

**The Steady Digits Rule.** Timer numerals use tabular figures in every theme and locale. A digit that changes width is a bug.

## Layout

- **Native shells:** a tab bar on iPhone; a navigation bar on compact Android, and a rail at expanded widths. Edge-swipe back and system Back always work. Content lays out inside the safe-area and window insets.
- **The focus screen is a page, not a dashboard.** The timer leads, the partner strip sits with it, and actions sit within thumb reach. Nothing else competes during a running session.
- **No nested cards.** A page holds paper fields and lists; it never stacks cards inside cards.
- **Overlays become sheets and inline moments.** Today's stacked modals (love note card, goal popup, ad queue) become bottom sheets or moments on the page. A modal is reserved for a decision that must interrupt.
- **Touch targets:** at least 44×44 pt on iOS and 48×48 dp on Android, using `hitSlop` when the drawn control is smaller.
- **Turkish strings** run 20–30 % longer than English. Every layout is checked with real TR copy.
- The spacing scale is `[to be resolved during implementation]`.

## Elevation & Depth

Depth comes from **paper layering**: pages and fields sit flat, separated by tone and a crisp edge, not by shadow. **Stickers are the only things that lift.** A sticker casts a small, soft, offset shadow tinted from the theme's own colours, never grey and never a hard zero-blur block. Bottom sheets use the platform's own sheet elevation.

### Named Rules

**The Only Stickers Lift Rule.** Chrome is flat at rest. If a control or card needs a shadow to be found, its tone or edge is wrong.

**The No Glass Rule.** No decorative blur or glassmorphism, including the tab bar. Blur intensity and Android `elevation` are never animated.

## Shapes

- **Radius scale:** 8 / 14 / 22 / pill. 8 is for small controls and chips, 14 for fields and list groups, 22 for sheets and large paper fields, and pill for primary actions and presence badges.
- **Paper edge:** fields and cards are paper, with a crisp edge in a tone tinted from the theme. The stroke weight is `[to be resolved during implementation]`.
- **Sticker edge:** stickers (mascots, rewards, stamps, badges) carry a die-cut light border around their silhouette, which makes a sticker read as a sticker. The sticker edge belongs to stickers only, never to buttons or chrome.
- **Icons:** a custom VectorCraft set of about 40 icons on a 24 pt grid, with 2 pt rounded strokes and one consistent weight. It is the brand's set (pinned), so it replaces SF Symbols and Material Symbols in the UI. It still follows platform sizing and aligns to the text baseline.
- **Mascots and illustration:** original VectorCraft vector art; each illustration ≤ 30 KB, mode scene ≤ 120 KB, icon ≤ 2 KB.

## Do's and Don'ts

### Do:

- **Do** keep both partners visible on every primary screen: presence, intention and local time.
- **Do** spend each screen's single delight on the sticker placement, and keep everything else calm.
- **Do** use the platform's own controls (switches, pickers, segmented controls, sheets, alerts) and theme them through tint, type and shape.
- **Do** prove the 4.5:1 and 3:1 contrast with the token script for every theme, light and dark.
- **Do** draw every icon from the VectorCraft set at one stroke weight.
- **Do** give every gesture-only moment a non-gesture fallback (press-and-hold "Board" for the boarding-pass tear).

### Don't:

- **Don't** go babyish: no primary-colour cartoon, no oversized bubbly toddler-app UI. A university student must be happy to open this in a library.
- **Don't** let a mascot sulk, cry, wilt or nag, and never shame a missed day or a broken streak. Plants only look sleepy.
- **Don't** fall back to generic grey productivity: a grey-and-white screen with one accent colour is not restraint here, it is a different product.
- **Don't** overload with candy: no neon pinks, glitter or sparkles everywhere, and never more than one delight moment per screen.
- **Don't** use purple-to-blue aurora gradients, gradient text or a decorative blur tab bar.
- **Don't** use emoji or Unicode glyphs as icons. Emoji belong only in push-notification copy and in text users write.
- **Don't** nest cards, or use a modal where a sheet or an inline moment would do.
- **Don't** use hard offset (zero-blur) shadows or grey drop shadows.
