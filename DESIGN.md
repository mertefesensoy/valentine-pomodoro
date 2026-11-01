---
name: Valentine Pomodoro (working name)
description: A kawaii couples study timer. Pomo & Doro, two little round characters, keep a sticker diary of the focus you share.
colors:
  # Strawberry Milk, the light default. Keys are src/theme/palette.json's own role names; that file is
  # the single source, and Midnight Plum mirrors every key (the sidecar's colorMeta carries its values).
  page: "#FFF6F1"
  paper: "#FFFDFB"
  field: "#FBEAE4"
  edge: "#F0DAD3"
  edgeStrong: "#A07A72"
  ink: "#4A2C29"
  inkSoft: "#7D5A54"
  primary: "#F7A9BE"
  onPrimary: "#4A2C29"
  primaryInk: "#B03158"
  primarySoft: "#FDE4EB"
  accent: "#C93A24"
  onAccent: "#FFFFFF"
  accentInk: "#C03A24"
  success: "#BFE5B5"
  onSuccess: "#4A2C29"
  successInk: "#2F7339"
  danger: "#A82431"
  onDanger: "#FFFFFF"
  dangerInk: "#A82431"
  ringTrack: "#FBEDE8"
  ringFocus: "#D64B76"
  ringBreak: "#428C4E"
  stickerEdge: "#FFFFFF"
  stickerShadow: "#4A2C2929"
  scrim: "#4A2C2973"
  scrimStrong: "#4A2C2999"
  pomoInk: "#B03158"
  doroInk: "#2F7339"
typography:
  timer:
    # The Ring sets it at 25 % of the ring's size; Facing Pages at 56 pt. Fit to one line, down to 0.5.
    fontFamily: "Baloo2-SemiBold"
    fontSize: "56pt"
    fontFeature: "tnum"
  title:
    fontFamily: "Baloo2-SemiBold"
    fontSize: "34pt"
    lineHeight: "42pt"
  headline:
    fontFamily: "Baloo2-SemiBold"
    fontSize: "28pt"
    lineHeight: "36pt"
  headline-small:
    fontFamily: "Baloo2-SemiBold"
    fontSize: "22pt"
    lineHeight: "28pt"
  body:
    fontFamily: "SF Pro (system)"
    fontSize: "17pt"
    fontWeight: 400
    lineHeight: "23pt"
  body-strong:
    fontFamily: "SF Pro (system)"
    fontSize: "17pt"
    fontWeight: 600
  button:
    fontFamily: "SF Pro (system)"
    fontSize: "18pt"
    fontWeight: 600
  label:
    fontFamily: "SF Pro (system)"
    fontSize: "15pt"
    fontWeight: 500
  caption:
    fontFamily: "SF Pro (system)"
    fontSize: "13pt"
    fontWeight: 600
  footnote:
    fontFamily: "SF Pro (system)"
    fontSize: "13pt"
    fontWeight: 400
    lineHeight: "18pt"
rounded:
  s: "8pt"
  m: "14pt"
  l: "22pt"
  pill: "999pt"
spacing:
  xs: "4pt"
  s: "8pt"
  m: "12pt"
  l: "16pt"
  xl: "24pt"
  xxl: "32pt"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.onPrimary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12pt 24pt"
    height: "56pt"
  button-quiet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8pt 24pt"
    height: "44pt"
    width: "112pt"
  button-quiet-destructive:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.dangerInk}"
    rounded: "{rounded.pill}"
    padding: "8pt 24pt"
    height: "44pt"
  paper-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.l}"
    padding: "12pt 16pt"
  list-group:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
  list-row:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "8pt 16pt"
    height: "44pt"
  list-row-pressed:
    backgroundColor: "{colors.field}"
  list-row-action:
    textColor: "{colors.primaryInk}"
  list-row-destructive:
    textColor: "{colors.dangerInk}"
  segmented-track:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.pill}"
    padding: "3pt"
  segmented-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44pt"
  segmented-unselected:
    textColor: "{colors.inkSoft}"
  paused-stamp:
    textColor: "{colors.primaryInk}"
    rounded: "{rounded.s}"
    padding: "2pt 8pt"
  postcard-today:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.l}"
    padding: "12pt 16pt"
  postcard-edge:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.inkSoft}"
    rounded: "{rounded.m}"
    padding: "8pt 12pt 0pt"
  more-chip:
    backgroundColor: "{colors.primarySoft}"
    textColor: "{colors.primaryInk}"
    rounded: "{rounded.s}"
    padding: "1pt 4pt"
  goal-moment:
    backgroundColor: "{colors.success}"
    textColor: "{colors.onSuccess}"
    rounded: "{rounded.pill}"
    padding: "8pt 16pt"
  modes-button:
    textColor: "{colors.ink}"
    size: "44pt"
  tour-bubble:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.l}"
    padding: "12pt 16pt 8pt"
    width: "360pt"
  tour-next:
    backgroundColor: "{colors.primarySoft}"
    textColor: "{colors.primaryInk}"
    rounded: "{rounded.pill}"
    padding: "0pt 24pt"
    height: "44pt"
  tour-scrim:
    backgroundColor: "{colors.scrim}"
---

# Design System: Valentine Pomodoro (working name)

> **PINNED DIRECTION — the brief wins.** The kawaii couple direction (rehaul plan §5.2–5.3, approved 2026-10-29; no tomato anywhere, owner 2026-10-30, ADR-0047) and the North Star "The Sticker Diary" (chosen 2026-10-29) are pinned by the owner. Refinement passes (`critique`, `audit`, `polish`, `quieter`, `distill`, `harden`) tune execution *inside* this direction. They must not flatten it into a generic minimal look, and they must not swap the North Star for a calmer one. Changing the direction needs the owner's explicit words.

> **Recorded from the build (2026-11-01; brought up to date 2026-11-02).** This file was the pre-implementation seed. It now records what shipped in Phase 1 D1 (Classic: the Ring, Facing Pages, the Modes sheet, today's row, the sticker placement; the one-time v1.4 welcome) and D2 (Stats, Settings, Notes), both given **ship** by the finish reviews on 2026-11-01 (D1 record §3.21–3.23, D2 record §3.23–3.25), first recorded at `phase1/stage-d` a21939b. At `phase1/stage-d` aabc4e1 it adds the rest of Stage D: D3 (English and Turkish: Settings › Language and the raw-text check), D4 (the three UI sounds) and D5 (the first-run tour, given **ship** on the owner's device check of TestFlight build 58, D5 record §3.13). Every value below is read from the code: `src/theme/palette.json`, `layout.ts`, `type.ts`, the sticker, icon and UI components, the screens, `src/screens/tutorial/` and `src/audio/uiSounds.ts`. Where the build differs from the seed's wording, the build wins and the difference is said.

## Overview

**Creative North Star: "The Sticker Diary"**

The app is the diary a student couple keeps together, the kind of kawaii stationery people carry to the library. Its pages are the screens: soft paper fields with crisp edges, set in calm, quiet chrome. Its stickers are the rewards. Pomo & Doro, two small round characters (a strawberry with one curl and a matcha dome; together they make the timer's colon), are drawn as stickers, and every completed session, landed flight, garden harvest and couple milestone is a sticker placed onto the diary. The mark, **Same Page**, is two pages of one open diary, leaning in. The paper stays calm; the stickers carry the emotion.

It is an Operate product first. A student opens it to start a focus session in seconds and to see that their partner is there. The world lends four things only: **type, palette, density, and one signature move**. Navigation, layout model and controls stay native: a tab bar, sheets, switches and pickers that a fluent iPhone or Android user already trusts. Long-distance is the lead situation, so **both partners are always in the frame**: the partner's presence, intention and local time are part of the page, not a detail behind a tap.

The tone is soft, not sugary. It is cute enough to be loved and grown-up enough that a university student is happy to open it in a lecture hall. There is one delightful moment per screen, never ten. Nothing in the visual language ever scolds.

**Signature move: the sticker placement.** When a session completes, its sticker is pressed onto today's page: a playful spring, a few paper particles, and a success haptic. It is the only bouncy motion in the everyday product (the one-time welcome and the first-run tour are the owner's two exceptions, below; each plays once and is replayed only by choice). Stats, streaks and the weekly recap read as diary pages filling with stickers. Mode rewards (passport stamps, garden produce, room decor, pet tricks) arrive the same way.

**Motion grammar** (from plan §5.3, the Emil Kowalski `animate-expo` rules; values as built):

| Interaction | Motion |
|-------------|--------|
| Start / Pause / Skip press (every pill and button) | Press-in to scale 0.97 over 100 ms, release back over 180 ms, ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, selection haptic on the press-in frame. A CSS transition: no per-frame work. Nothing else. |
| Tab switch | No animation (UIKit's own switch). |
| Sheet (Modes, love note, note editor) | The system's own form-sheet presentation (`formSheet`, sized to content, no grabber; the note editor full height). The seed's custom spring was not built: the platform's sheet is the motion. |
| Phase change (focus ↔ break) | The ring's (or spine bar's) colour and the mascot pose crossfade over 250 ms, ease-out. A pose change, not a bounce. |
| Presets ↔ cycle row (on Start) | 200 ms opacity crossfade in one reserved height, so nothing jumps. |
| Segmented control selection | The indicator slides 200 ms, `cubic-bezier(0.77, 0, 0.175, 1)` (it moves across, it doesn't enter). |
| Sticker placement (completion and rewards) | **The one bounce.** The sticker drops from 16 pt up, scale 1.35 and −10°, to rest on a spring (450 ms, damping ratio 0.75, about 2.8 % overshoot), opacity in over 120 ms; a burst of 12 paper bits (the cap is 24), 600 ms ease-out, transform and opacity only; success haptic and the completion sound, which opens with the spring (below). Stickers already on the page never replay. |
| Goal reached (inline moment) | A leaf pill fades in over 250 ms under today's row, holds 1.4 s, then leaves the goal mark in the row. |
| **Welcome (once)** | **The owner-approved exception** (build 49, F5). The v1.4 welcome plays once, 4.2 s, on the UI thread from one shared value: staging, anticipation (crouch, the diary squashes), a parabolic leap as the cover swings open, an exaggerated squash on landing with its own rebound, a hop, the dive into the Same Page mark's faces, and one burst of sparkles (10 shipped; at most 12). One soft haptic on the landing frame. Start is live from the first frame. Under Reduce Motion, the settled mark fades in over 300 ms: opacity only. |
| **Tutorial (first run)** | **The owner-approved exception** (D5, the direction contract's FINISH; build 58). **The entrance, once a run:** the layer fades in over 200 ms; the run's first opening grows from its own centre over 300 ms, ease-out; the ribbon drops from the top of the page over 520 ms, ease-out; the pair drop 28 pt and fade in over 360 ms, ease-out (the speaker at 160 ms, the listener at 260 ms), then land with a pose change's squash; the bubble arrives last, a 220 ms fade rising 6 pt, 420 ms in. A later layer (the next tab, a sheet closed) only fades in: the ribbon already hanging (300 ms), the opening already open, the pair over 150 ms. **Between beats** everything glides 420 ms on the sheet curve `cubic-bezier(0.32, 0.72, 0, 1)`: the opening, the ribbon's drape (the signature interaction), the pair's feet, the speaker's and listener's sizes, the bubble and its tail. **The pair** (`motion.ts`, the approved pose sheet's numbers, on the UI thread): a change of pose is 280 ms of squash and stretch about the feet (height 0.92 at 70 ms, 1.04 at 168 ms, home at 280 ms, the width its reciprocal), the old face fading out over 0–98 ms as the new one fades in over 56–154 ms (they cross at 77 ms), and a held tilt or stretch easing in over 220 ms. The speaker breathes ±1.2 % (3.4 s for Pomo, 4.1 s for Doro, half while talking); open eyes blink for 110 ms every 2.8–5.2 s, one blink in five a double 140 ms later; a wave swings 2.5 times at 420 ms (−16° to +12°) and goes home over 160 ms; a point nudges 10 artboard units along the nub over 320 ms. The listener holds one pose and only blinks. **The line** writes on one character every 45 ms, pausing 150 ms after a comma and 300 ms after a stop, the mouth open for the first 60 % of each syllable; a tap finishes it. No haptic per line or beat. |
| Partner presence change | The avatar fades in and scales from 0.95, never from 0. *(Not yet built: the partner arrives in Phase 3.)* |
| List entrance | Stagger 30–60 ms, never on virtualized rows. *(Not used in v1.4: Stats, Settings and Notes open with no entrance animation, by the frequency gate.)* |

With Reduce Motion on, opacity and colour stay; translate, scale, particles and overshoot drop, and screen transitions become fades. As built: the press dims to 0.85 opacity instead of scaling, the sticker placement becomes a 200 ms fade, the segmented indicator moves without sliding, and the welcome fades. The tour keeps opacity only: the opening crossfades (a cover closes the old one over 150 ms and opens the new one over 150 ms), the ribbon fades out and back in at its new place, the pair and the bubble dip out and back in on the same 150 + 150 ms when they really move (under 24 pt they jump), faces swap with no squash, breath, blink, talking mouth or gesture, the pair arrive as a 200 ms fade, and the line still writes on.

**Sound** (D4, `src/audio/uiSounds.ts`): Classic plays three UI sounds, level with one another: focus start or break start as Start is pressed, and completion as a sticker is pressed on. They follow Settings › Sound, respect the silent switch and mix with other apps' audio (iOS's ambient session); Fly keeps its own ambience and plays none. The tour's babble sits under them, one syllable every 3 letters for Pomo and every 4 for Doro, each a random ±10 cents and ±1.5 dB; Settings › Sound, the silent switch and the tour's mute silence it, and with VoiceOver on the whole line shows at once with no babble.

**Key Characteristics:**

- Paper pages, sticker rewards, calm chrome.
- Pomo & Doro carry the emotion; the interface does not perform.
- Both partners visible on every primary screen.
- Native navigation and controls; the brand lives in type, palette, density, icons and the sticker move.
- One delight per screen; nothing ever punishes.

## Colors

Warm pastel fields, never gradients. Each theme is a complete token set plus one VectorCraft illustration pack, and the stationery world (washi tape, highlighters, sticker sheets) is where new theme colours come from.

**The tokens are normative in the frontmatter (Strawberry Milk) and in `src/theme/palette.json` (both themes).** `npm run check:contrast` proves every declared pair in each theme in CI (ADR-0045), and the `dims` list beside them: how far a translucent token sets a lit colour back, a separation rather than a text floor (`scrim` over `primary` at least 2:1, `scrimStrong` at least 2.5:1). Both themes carry the same 29 role names; the roles below name them.

### Primary

- **Strawberry Pink** (`primary`): the primary action's fill, a soft fill carrying a cocoa label (`onPrimary`). The same strawberry in both themes. Also the Settings switch's track, the done cycle dots and the tour's ribbon band.
- **Strawberry Ink** (`primaryInk`): strawberry as text or an icon: the selected tab, links, action rows, the current cycle dot, the Paused stamp, an open value row's value.
- **Strawberry Blush** (`primarySoft`): a selected chip or row, the "+n" overflow chip, and the tour's quieter Next and Continue.
- **Pomo's Ink** (`pomoInk`): Pomo's name when Pomo speaks in the tour's bubble. The same value as `primaryInk`, a role of its own.

### Secondary

- **Accent Red** (`accent`, `accentInk`): the brand's accent, used sparingly for emphasis and the sticker moment (one of the placement burst's four colours), never for large fields of chrome. Destructive actions have their own `danger` red, so the brand colour never means loss.

### Tertiary

- **Leaf Green** (`success`, `successInk`, `ringBreak`): success, goal reached, the break ring, garden growth. The goal flag is `successInk`; the goal moment is a `success` pill with a cocoa label.
- **Doro's Ink** (`doroInk`): Doro's name when Doro speaks: Doro's matcha as text. The same value as `successInk`, a role of its own.

### Neutral

- **Milk Cream** (`page`): the ground of every screen in Strawberry Milk, the colour of the milk, not of parchment.
- **Paper** (`paper`): fields, list groups, postcards and the quiet pill, set on the page by tone and a crisp `edge`.
- **Well** (`field`): segmented-control tracks, input wells, and a pressed list row.
- **Paper Edge** (`edge`) and **Control Edge** (`edgeStrong`): `edge` is decoration and never the only cue for a control; `edgeStrong` (3:1) marks a boundary that identifies one (the segmented indicator, dashed cells, the cycle row's future dots, the Minutes track's outline).
- **Cocoa** (`ink`) and **Soft Cocoa** (`inkSoft`): body text, headings, the timer and icons; secondary text is `inkSoft`, tinted from cocoa, never grey.
- **Ring Track** (`ringTrack`), **Ring Focus** (`ringFocus`): the timer ring's track and focus arc, also the Minutes track and focus data marks. `ringFocus` also edges the tour's ribbon and outlines its opening.
- **Sticker Edge** (`stickerEdge`) and **Sticker Shadow** (`stickerShadow`): stickers only, never chrome. The edge is white in Strawberry Milk and milk in Midnight Plum.
- **Scrim** (`scrim`) and **Raised Scrim** (`scrimStrong`): the tour's dim around its opening, the theme's darkest ink (cocoa in Strawberry Milk, deep plum in Midnight Plum) at 45 %, raised to 60 % under Reduce Transparency or Increase Contrast. Flat, never a blur. In Midnight Plum the empty page hardly darkens (1.08:1), so the opening's `ringFocus` outline marks the lit control.

### Themes

| Theme | Tier | Role |
|-------|------|------|
| **Strawberry Milk** | Free | Light default (shipped) |
| **Midnight Plum** | Free | Dark default (shipped): a plum-tinted night page, not black or grey, so the diary at night stays warm. Its roles mirror Strawberry Milk. |
| Matcha Latte, Peach Soda | Plus | Full token sets |
| Sakura, Cozy Autumn, Snow Globe, Valentine | Plus, seasonal | Full token sets |

Light and dark follow the system appearance, because the use scene covers both: a bright library by day and bed at night. Both are first-class.

### Named Rules

**The Contrast Gate Rule.** Every text and background pair in every theme meets 4.5:1 for body text, and 3:1 for large text and icons. A script over the token file proves it. A theme that fails does not ship.

**The Paper Not Gradient Rule.** Fields are flat paper colours. No purple-to-blue aurora, no gradient text, no gradient buttons.

**The Exact Ground Rule.** Every screen's ground is exactly `page`: #FFF6F1 in Strawberry Milk and #221726 in Midnight Plum. The status-bar band, the Modes sheet and the note editor take the same `page`; only the love-note sheet is `paper`.

**The Theme Is The Product Rule** *(confirmed by the owner, 2026-10-29)*. Themes are part of what Plus sells, so the palette never yields to Android Dynamic Color (Material You) wallpaper colours. The one exception is opt-in: a "Match my wallpaper" theme (Android 12+), planned with the Plus themes after v1.4. Because wallpaper colours can't be checked at build time, that theme needs a runtime contrast guard that falls back to the brand roles.

## Typography

**Display Font:** **Baloo 2** (Phase 1 C2, the owner's pick, 2026-10-30; ADR-0046), embedded as a Latin + Turkish subset with the `fi`/`fl` ligatures removed, so a Turkish i keeps its dot. The SemiBold instance (`Baloo2-SemiBold`) carries every display role. Each instance is its own PostScript family on iOS, so a display style never sets `fontWeight` (that would ask iOS to synthesise a weight the file doesn't have). Fredoka failed the requirements below.
**Body Font:** the system face (SF Pro on iOS, Roboto on Android, the platform UI stack on the web).

**Character:** a soft, round display voice for the timer and the few titles, paired with the platform's own body face, so reading and controls stay native and accessible.

**Requirements the display face must pass before it is chosen:** full Turkish coverage (ğ ı İ ş ç ö ü, including dotted and dotless i casing) and **tabular figures**, so the timer digits never jiggle as they count. It also needs a licence that allows app embedding.

### Hierarchy

- **Timer** (Baloo 2 SemiBold, tabular figures; on the Ring 25 % of the ring's size, so 69 pt in a 275 pt ring; 56 pt on Facing Pages; fit to one line, shrinking to half at most): the largest text on its screen.
- **Title** (Baloo 2 SemiBold, 34 / 42 pt): the tab titles drawn in the content on Stats, Settings and Notes, in place of a navigation bar's large title. Capped at 1.4× text size.
- **Headline** (Baloo 2 SemiBold, 28 / 36 pt): the welcome's one line. **Headline small** (22 / 28 pt): today's postcard title in Stats.
- **Body** (system, 17 pt regular, 23–24 pt line): list rows, notes, values, the note editor, the tour's line. **Body strong** (17 pt semibold): Classic's phase line, the Add pill, the editor's title.
- **Button** (system, 18 pt semibold) on the primary pill; 16 pt semibold on the quiet pill and the tour's Next and Continue.
- **Label** (system, 15 pt, 500 or 600): the partner line, the next-change line, segment labels, the summary line, the strip's titles, the tour's Skip tour.
- **Caption** (system, 13 pt semibold): list-group headers, page labels ("You"), today's "Today", postcard day names and counts, the speaker's name in the tour's bubble. **Footnote** (13 / 18 pt regular): list-group footers.
- Every figure that counts or compares uses tabular figures (`tnum`): the timer, segment labels, counts, minutes, the summary.
- System text follows Dynamic Type; small labels in tight places cap their growth (1.3–1.6×) rather than truncating, and layouts switch to their accessibility forms at a font scale of 1.6 (AX1).

### Named Rules

**The Steady Digits Rule.** Timer numerals use tabular figures in every theme and locale. A digit that changes width is a bug.

**The One Large Number Rule.** On Classic the timer is the only display-scale type: the phase line, the partner line and every control are in the system face, and no title competes. Sheet titles (Modes) and the tour's bubbles are in the system face. Baloo 2 appears only as the timer, a tab's title, the welcome line and today's postcard title.

**The Locale Casing Rule.** Text is never cased by a style (`textTransform`); casing goes through the locale's own `toLocaleUpperCase`, so a Turkish i becomes İ, not I. `scripts/i18n/check-raw-text.mjs` fails on either style, and on any text a person reads written into the source instead of `en.json` and `tr.json`.

## Layout

- **Native shells:** a tab bar on iPhone (NativeTabs: Timer, Stats, Settings, Notes); a navigation bar on compact Android, and a rail at expanded widths. Edge-swipe back and system Back always work. Content lays out inside the safe-area and window insets. Each tab draws its own title in the content with no navigation bar, and a **status-bar band** in `page` sits over the scroll view so scrolled content never runs under the clock.
- **The spacing scale** (4 pt base): 4 / 8 / 12 / 16 / 24 / 32 (`xs` to `xxl`). A page's column gap is 16; its content starts 8 below the top inset and ends 16 above the bottom inset (which includes the tab bar).
- **One readable column.** Classic's column is min(width, 560) less 24 a side; Stats, Settings and Notes share min(width, 560) less 16 a side (528 pt on an iPad), so the page's edges hold still across those tabs. In compact height (under 500 pt, an iPhone in landscape) the column spans the width between the side insets instead, and the page splits in two (Classic: the face leads, the rest trails; Stats: today's postcard leads, the stack trails).
- **The focus screen is a page, not a dashboard.** The timer leads, the partner strip sits with it, and actions sit within thumb reach. Nothing else competes during a running session. VoiceOver order: the phase line, the timer, the partner slot, today's row, the controls.
- **One moving part during focus.** While a session runs, only the ring's arc or the spine's progress bar moves (on the UI thread, with no React render); the timer text is the only thing that re-renders each second.
- **The Ring's sizing rule.** The Ring takes the height its neighbours leave: the scroll view's visible height, less the page's spacing and the four rows around it (the phase line, the partner strip, today's row, the controls), clamped between 200 pt and its cap, min(0.86 × column, 340 pt) (0.66 × column at AX sizes). On a 393 × 852 pt iPhone that is 275 pt. Below the AX sizes the page never scrolls, and Skip sits about 16 pt above the tab bar. The ring holds its size through the 1.4 s goal moment. The ring's stroke is 5.5 % of its size, with round caps; the timer sits inside with the stroke plus 12 pt of padding.
- **Facing Pages' geometry.** An open spread of two paper pages, each (width − 8) / 2 wide, leaning 1° toward the spine, hinged at its bottom spine-side corner. Outer corners 22, spine corners 8. Each page's head carries its label ("You", the partner's name) and its sticker, min(0.34 × page, 64 pt). The timer's frame sits on the spine, below the stickers (it covers none), 66 % of the spread wide, seated in a 4 pt band of `page` colour; under the timer, a 6 pt progress bar on `ringTrack`. The pair's line sits on the right page's foot. At AX sizes the pages stack: you, the timer, your partner.
- **Today's row.** "Today", then one sticker per completed focus in 34 pt cells (28 pt stickers), with dashed cells standing for the sessions still owed to today's goal; each finished session replaces the next dashed cell. It wraps in whole cells to two rows, then "+n". With no goal and no sticker, one dashed cell and a sentence explain it.
- **The Modes button** is at the same place in Classic and in Fly: the top trailing corner, the same glyph, the same 44 pt target, so the way in is the way back.
- **No nested cards.** A page holds paper fields and lists; it never stacks cards inside cards.
- **Overlays become sheets and inline moments.** Today's stacked modals (love note card, goal popup, ad queue) become bottom sheets or moments on the page. A modal is reserved for a decision that must interrupt (a destructive confirmation is the native alert).
- **The tour's layer** lives inside the Timer, Stats and Notes, last in the screen's root view; the native tab bar stays above it, lit and tappable. The dock (the bubble over the pair) takes the side of the opening that fits it best: above or below in portrait, the side away from the control in landscape and on iPad. The bubble is at most 360 pt wide; the speaker stands in a 190 pt box and the listener at 140 pt, and the pair shrink to fit, never under half size. At AX sizes (font scale 1.6), or when even half size doesn't fit, the bubble becomes a bottom panel, the pair a 36 pt badge in it and the ribbon a short tab; in compact height the panel stands at the side away from the opening. The page holds still while the tour is on it, scrolls only to bring the opening clear of the panel, and scrolls back when the tour leaves. Stats' ad banner is the layer's bottom reserve: nothing is placed under it.
- **Touch targets:** at least 44 × 44 pt on iOS (`minTarget`) and 48 × 48 dp on Android, using `hitSlop` (8 pt on pressables) when the drawn control is smaller.
- **Turkish strings** run 20–30 % longer than English. Every layout is checked with real TR copy, including Turkish at AX5 on an iPhone SE.

## Elevation & Depth

Depth comes from **paper layering**: pages and fields sit flat, separated by tone and a crisp edge, not by shadow. **Stickers are the only things that lift.** A sticker casts a small, soft, offset shadow in `stickerShadow`, tinted from the theme's own colours, never grey and never a hard zero-blur block. Sheets use the platform's own sheet presentation. The tour's dim is a flat `scrim`, and its bubbles and ribbon lie flat.

### Shadow Vocabulary

- **Sticker lift** (`stickerShadow`, offset 1 pt right and 2 pt down, about 2 pt of soft edge): the art's own silhouette drawn three times inside the sticker's SVG, at 0, 1 and 2 pt of outward stroke, each layer at a third of the token's alpha compounded (1 − (1 − α)^⅓), so where all three overlap the shadow reaches the token's alpha (about 16 % cocoa in Strawberry Milk, 40 % deep plum in Midnight Plum) and it falls off in one-point steps. It is never an SVG blur filter (on iOS that painted a dark square behind every sticker) and never a view shadow (rendered offscreen, per sticker, while the ring repaints). The welcome's layered art lies flat; the tour's pair lift through their body-cut layer, stickers like any other.

### Named Rules

**The Only Stickers Lift Rule.** Chrome is flat at rest. If a control or card needs a shadow to be found, its tone or edge is wrong. Stickers lift wherever they appear: the pose stickers, today's row, the postcards, the tour's pair.

**The No Glass Rule.** No decorative blur or glassmorphism, including the tab bar. Blur intensity and Android `elevation` are never animated. *Known deviation, stated honestly:* the iOS tab bar is NativeTabs' system bar, which iOS 26 draws as Liquid Glass. It is the platform's own chrome, not a surface the app draws; the app tints only the selected item (`primaryInk`) and leaves the unselected items in the system's adaptive monochrome. Every surface the app draws itself stays glass-free.

## Shapes

- **Radius scale:** 8 / 14 / 22 / pill. 8 is for small controls and chips (the "+n" chip, the Paused stamp, the spine corners, wrapped segments), 14 for fields and list groups (Settings' groups, Notes' list, the Stats strip, postcard edges), 22 for sheets and large paper fields (the partner strip, Facing Pages' outer corners, the timer's frame, today's postcard, the tour's bubbles), and pill for primary actions, quiet actions, the segmented track and the goal moment.
- **Paper edge:** fields and cards are paper, with a crisp edge in `edge`, **1.5 pt** everywhere (`edgeWidth`). Rows inside a group are split by hairlines inset 16 pt from the leading edge. Dashed cells and the Paused stamp's outline use the same 1.5 pt.
- **The tour's shapes:** the dim's opening takes the control's own radius plus 6 pt of room and a 2 pt `ringFocus` outline (the owner's answer to Midnight Plum's faint dim). The bookmark ribbon is an 11 pt `primary` band inside a 1.5 pt `ringFocus` edge, ending in a 16 pt swallowtail with a 6 pt notch whose points reach the control. The bubble's tail is a 16 pt paper square turned 45°, edged on its two outer sides.
- **Sticker edge:** stickers (mascots, rewards, stamps, badges) carry a die-cut light border (`stickerEdge`) around their silhouette, which makes a sticker read as a sticker. Stickers keep their own fills in both themes. The sticker edge belongs to stickers only, never to buttons or chrome.
- **Icons:** a custom VectorCraft set (50 glyphs in v1.4) on a 24 pt grid, drawn with 2 pt rounded strokes that are outlined into filled paths at build time, so every icon is one ink in `currentColor` and takes its colour from the caller's token. It is the brand's set (pinned), so it replaces SF Symbols and Material Symbols in the UI. The four tab icons ship as filled variants, 25 pt template images tinted by the system. Icons follow platform sizing (24 pt in controls, 20–22 pt inline) and align to the text baseline.
- **Mascots and illustration:** original VectorCraft vector art; each illustration ≤ 30 KB, mode scene ≤ 120 KB, icon ≤ 2 KB. The tour's pair are built from the tour kit: 44 VectorCraft layers (body, nubs, eyes, mouths), stacked per character.

## Components

### Buttons

Tactile, soft and few: one strawberry pill per screen, everything else quiet.

- **Primary pill:** `primary` with a cocoa `onPrimary` label, 18 pt semibold, pill, at least 56 pt tall, 24 pt side padding, full column width (Start focus, the welcome's Start). Notes' Add is the same fill at 44 pt with a 17 pt label.
- **Quiet pill:** `paper` with a 1.5 pt `edge`, `ink` label at 16 pt semibold, pill, at least 44 pt tall and 112 pt wide (Skip). **End session** is the same pill with a `dangerInk` label, shown only while paused, and its confirmation is the native alert.
- **Press:** every pill scales to 0.97 (motion table) with the selection haptic, following Settings › Haptics.
- **The Modes button:** the `modes` glyph, 24 pt in `ink`, in a 44 pt target at the top trailing corner. On Classic's page it is the bare glyph; over Fly's map it sits on a 44 pt `paper` disc with a 1.5 pt `edge` and no shadow, because a map is not paper. Either way it opens the same Modes sheet.
- **The tour's buttons:** Next (Done on a replay's last beat; Continue in the Modes sheet's bubble) is quieter than the strawberry pill: `primarySoft` with a `primaryInk` label, 16 pt semibold, pill, 44 pt tall, 24 pt side padding. Skip tour (Not now on the invitation) is bare text, 15 pt semibold `ink`; the mute is the `sound` or `soundOff` glyph, 22 pt `inkSoft`, in a 44 pt target, 16 pt from Skip tour so their slops never overlap. Their labels stop growing at 1.6×, as every button's does, and wrap.

### Segmented control

Built, not the native module, so four Turkish labels can wrap at AX sizes while keeping the native control's sizing and behaviour.

- **Track:** `field` with a 1.5 pt `edge`, pill, 3 pt inner padding. **Selection:** a `paper` indicator with an `edgeStrong` edge that slides (motion table); selected label `ink`, others `inkSoft`, 15 pt semibold tabular figures, segments at least 44 pt tall.
- At AX sizes it wraps into two rows of 8 pt-radius segments, and the selected one fills in place. Each segment is a button with a selected state and its position, never a tab.

### Paper fields

- **The partner strip (the Ring):** one paper field, radius 22, 1.5 pt `edge`, no shadow, at least 72 pt tall, 12 / 16 pt padding: Pomo and Doro as 40 pt lifted stickers (Doro tucked 8 pt behind Pomo) and the pair's line at 15 pt. Facing Pages carries the same content on its right page instead.
- **The Stats strip:** the goal and the love streak share one paper field, radius 14, split by a 1.5 pt `edge` rule (a hairline when stacked at AX sizes), each half an icon (22 pt, `successInk` or `primaryInk`) and two lines.

### The Paused stamp

When a session is paused, the next-change line under the timer gives way to a quiet stamp: "Paused" in `primaryInk`, 14 pt bold, inside a 1.5 pt `primaryInk` outline, radius 8, 2 / 8 pt padding, rotated −3°. It is ink on paper, not a filled badge, and it fits inside the ring in Turkish ("Duraklatıldı").

### The cycle row

The cycle's sessions as 12 pt dots, 8 pt apart, with a 2 pt border: done ones filled `primary`, the current one outlined in `primaryInk`, the rest outlined in `edgeStrong`. It shares one reserved height with the presets, so Start makes nothing jump.

### Today's cells

- **Sticker cell:** 34 pt, holding a 28 pt Pomo or Doro celebrating sticker, alternating, lifted.
- **Dashed cell:** a 26 pt circle with a 1.5 pt dashed `edgeStrong` border (3:1 on paper): a session still owed, or an empty day. Never "missed".
- **"+n" chip:** `primarySoft` with `primaryInk` text, 13 pt bold tabular, radius 8.
- **The goal moment:** a `success` pill with the goal icon and "Goal reached" (16 pt bold) and the streak, `onSuccess`, 8 / 16 pt padding; a polite live region.

### The postcard stack (Stats)

The week as a stack of day postcards, today in front.

- **The six earlier days** are postcard edges, oldest at the top: `paper` with a 1.5 pt `edge`, top corners 14, no bottom border, each tucked 8 pt under the next, and **tilted alternately ±0.6°** (the reviewers' keep). An edge is 34 pt tall plus 8 (30 on a short screen), grown with the text size; it carries the day's short name (13 pt semibold, `inkSoft`, a 56 pt column that never truncates), up to four 18 pt lifted stickers then "+n" (or, in Minutes, a fill track on `ringTrack` with an `edgeStrong` outline, `ringFocus` filling toward the goal and `ringBreak` once it's reached), the count in a fixed 36 pt tabular column so every track ends at the same x, and the goal flag. An empty day is one dashed cell.
- **Today's postcard** sits in front: `paper`, radius 22, 1.5 pt `edge`, 12 / 16 pt padding. The full date in 13 pt semibold `inkSoft` above "Today" in Baloo 2 22 / 28, then one row of whole cells (40 pt stickers, 34 pt on a short screen, planned at the sticker's size so any mix fits): the stickers, "+n" in the last cell once they pass the row, then dashed cells for what's still owed. Then one line: sessions · minutes · how far the goal is.
- In landscape the last edge, with nothing in front of it, closes itself (a bottom border and 14 pt bottom corners). At AX sizes the stack becomes a flat list, today first: each edge a whole slip at radius 14, untilted.
- Nothing animates on entry: Stats is opened often.

### Settings: the native grouped list

iOS Settings, drawn in the diary's stationery.

- **Groups:** inset paper fields, radius 14, 1.5 pt `edge`, rows split by hairlines inset 16 pt; a 13 pt semibold `inkSoft` header above (sentence case) and a 13 / 18 pt `inkSoft` footer below that explains.
- **Rows:** at least 44 pt, 8 / 16 pt padding, label 17 pt `ink`. Native controls only: the system switch (`primary` track), the system wheel under a value row (one open at a time; the value turns `primaryInk` while open), the compact time picker tinted `primaryInk`. An action row is `primaryInk`, a destructive one `dangerInk`; a pressed row takes `field`. No bounded number is ever typed.
- At AX sizes a row wraps, its value or control dropping under its label rather than truncating.
- Stats and Notes reuse the same group and action row for their few actions (Start a session, Turn on the goal, Preview, Restore).
- **Language** (D3) is a group holding the segmented control (System, English, Türkçe), stored at once and applied at the next launch. About carries "Watch the welcome again" and "Watch the tour again".

### Notes

The title (Baloo 2 34 / 42) with its count, the strawberry Add pill, and the notes as one grouped list (radius 14, hairline-split rows, 17 / 23 pt text) with swipe-to-delete. Empty, Pomo and Doro sit idle as 64 pt stickers above one line and the Add pill. The editor is a full-height sheet on `page`.

### Navigation

- **Tab bar:** the native iOS tab bar (NativeTabs). The selected item is `primaryInk` (icon and label); unselected items keep the system's monochrome. Tabs switch with no animation; a tab press carries a haptic.
- **Sheets:** native form sheets sized to their content, no grabber. The Modes sheet is `page`, the love note `paper`.

### The welcome (once)

The diary itself, opened once at v1.4: Pomo & Doro on a closed diary leap as it opens and become the two faces of the Same Page mark (choreography in the motion table). One line in Baloo 2 28 / 36, then the primary pill. The art gives up 40 % of its size at AX sizes so the line keeps its room. It is one VoiceOver element, then the line, then Start.

### The tour (first run)

Pomo & Doro show you around in six steps over the real Timer, Stats and Notes, marking your place with the diary's strawberry ribbon (choreography in the motion table).

- **The dim:** `scrim` over everything but one opening, which stays lit and live: four touch-blocking panels and four corner masks, with nothing over the hole, so a tap there is the real control's. On a tab step the whole page dims.
- **The bookmark ribbon:** hangs from beyond the top edge and drapes to the control, its swallowtail pointing at it; on a tab step, to just above the tab. Decoration: no touches, hidden from VoiceOver.
- **The pair:** the speaker at 190 pt and the listener at 140 pt beside the ribbon's tip, never over the opening; stickers with the die-cut edge and the lift.
- **The bubble:** `paper`, radius 22, the 1.5 pt `edge`, no shadow, 12 / 16 / 8 pt padding, with a tail to the speaker. The speaker's name (13 pt semibold, `pomoInk` or `doroInk`), the line (17 / 23 pt, never capped, laid out whole in a clear colour so the bubble never grows as it writes), then Next at the trailing side and Skip tour and the mute at the leading side. VoiceOver reads one element, "Pomo: …", then Next, Skip tour and the mute.
- **The AX panel:** at font scale 1.6 the bubble becomes a bottom panel (a side panel in landscape), the pair a 36 pt badge beside the name, the line scrolling inside it, the buttons pinned.
- **The Modes sheet's bubble:** the sheet covers the layer, so it carries its own: the same paper, radius 22 and edge, 16 pt padding, a 32 pt Pomo sticker beside Pomo's name, the whole line at once (no write-on, no babble), and Continue to close the sheet.

## Do's and Don'ts

### Do:

- **Do** keep both partners visible on every primary screen: presence, intention and local time.
- **Do** spend each screen's single delight on the sticker placement, and keep everything else calm.
- **Do** use the platform's own controls (switches, pickers, segmented controls, sheets, alerts) and theme them through tint, type and shape.
- **Do** prove the 4.5:1 and 3:1 contrast with the token script for every theme, light and dark.
- **Do** draw every icon from the VectorCraft set at one stroke weight.
- **Do** give every gesture-only moment a non-gesture fallback (press-and-hold "Board" for the boarding-pass tear).
- **Do** take every size from the scales: spacing 4 / 8 / 12 / 16 / 24 / 32, radius 8 / 14 / 22 / pill, the 1.5 pt edge, 44 pt targets.
- **Do** keep one moving part during focus: the ring's arc or the spine's bar, nothing else.
- **Do** keep the Modes button at the top trailing corner in every mode, so the way in is the way back.
- **Do** keep the postcard stack's alternating tilt and Facing Pages' 1° lean; they are the only tilted chrome.

### Don't:

- **Don't** go babyish: no primary-colour cartoon, no oversized bubbly toddler-app UI. A university student must be happy to open this in a library.
- **Don't** let a mascot sulk, cry, wilt or nag, and never shame a missed day or a broken streak. Plants only look sleepy.
- **Don't** draw a tomato anywhere, or a clock, timer ring or heart in the mark: those are the category's habits (ADR-0047).
- **Don't** fall back to generic grey productivity: a grey-and-white screen with one accent colour is not restraint here, it is a different product.
- **Don't** overload with candy: no neon pinks, glitter or sparkles everywhere, and never more than one delight moment per screen.
- **Don't** use purple-to-blue aurora gradients, gradient text or a decorative blur tab bar.
- **Don't** use emoji or Unicode glyphs as icons. Emoji belong only in push-notification copy and in text users write.
- **Don't** nest cards, or use a modal where a sheet or an inline moment would do.
- **Don't** use hard offset (zero-blur) shadows or grey drop shadows.
- **Don't** draw a sticker's shadow with an SVG blur filter or a view shadow; use the three-layer silhouette.
- **Don't** set display type anywhere but the timer, a tab's title, the welcome line and today's postcard title.
