---
id: DESIGN-WORKFLOW
title: Design workflow — Impeccable, Apple HIG and Emil Kowalski skills
status: approved
date: 2026-10-30
owner: Mert Efe Şensoy
related: [ADR-0042, DOCS, SRS, ROADMAP]
---

# Design workflow

How every screen in the rehaul is designed, reviewed and polished. The goal (your words, 2026-10-30) is "real product level genius design work instead of a design that we would see in a school project". Three skill packs, installed at project scope in `.claude/skills/`, each own one layer; this page says which one runs when, and who wins when they disagree. The decision record is [ADR-0042](../architecture/adr/0042-design-skill-stack.md).

## 1. Who owns what

| Layer | Skill | Owns | Invoke |
|-------|-------|------|--------|
| **Product and visual identity** | **Impeccable** 4.8.0 (`impeccable`) | `PRODUCT.md`, `DESIGN.md` ("The Sticker Diary"), surface briefs, scored critique and technical audit, polish, harden, onboarding and copy passes | `/impeccable shape <screen>`, `critique`, `audit`, `polish`, `harden`, `onboard`, `clarify`, `document` |
| **Platform fit (iOS)** | **Apple Design Skill** (`apple-design`, [dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill)) | Review against Apple's Human Interface Guidelines (123 pages), with React Native translations and a "design-craft lens" against generic, template-looking work. It covers navigation, tab bars, sheets, Dynamic Type, accessibility, dark mode, Liquid Glass, app icons, widgets and Live Activities, in-app purchase and paywall rules, and App Review design rejections. | `/apple-design`, or "review this screen against Apple's HIG" |
| **Motion and interaction** | **Emil Kowalski** (`animate-expo`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `remove-animations`, `animation-performance`, `animation-vocabulary`) | Whether something animates, on which thread, which curve or spring, gesture hand-off, reduced motion, and frame budget | `animate-expo` to build; `review-animations` to check |
| **Robustness of the UI** | Emil `break-ui` | Worst-case data: long names, Turkish text, huge counts, empty states, emoji in user text | "break this screen" |
| **Web (Phase 6)** | Emil `animate`, `emil-design-eng`, `emil-apple-design` (Emil's web translation of Apple's motion principles; renamed from `apple-design` to avoid a clash), `mobile-native`, `ask-sonner` | The web app and the marketing site | As named |
| **Native extensions (Phase 7)** | Emil `write-swift` | Widgets and Live Activity targets in Swift | As named |
| **Exploration** | Emil `prototype`, `pick-ui-library` | Several real versions of a component behind a picker; library choice. These two run only when asked by name. | `/prototype`, `/pick-ui-library` |

## 2. The pipeline for every screen

Each primary screen goes through these steps in order. A step's output is recorded in the screen's implementation record.

1. **Shape:** `/impeccable shape <screen>`, which writes a surface brief under the pinned Sticker Diary direction. You confirm the brief before any code (plan task C4 for Classic).
2. **Platform check of the brief:** `/apple-design` on the brief and any mockup. It catches navigation, sheet, tab and accessibility choices that would fight iOS *before* they are built.
3. **Build** the screen, with motion through `animate-expo`. No animation goes in without an answer to Emil's first question: should this animate at all?
4. **Review, three ways:**
   - `/impeccable critique` and `/impeccable audit`, which must score **≥ 16/20** ([NFR-UX-003](../srs/SRS.md#nfr-ux-003))
   - `/apple-design` on the built code, with **no Critical findings**
   - Emil `review-animations`, clean
5. **Break it:** Emil `break-ui` with worst-case data, including Turkish at the largest Dynamic Type size ([NFR-A11Y-003](../srs/SRS.md#nfr-a11y-003), [NFR-I18N-001](../srs/SRS.md#nfr-i18n-001)).
6. **Polish and harden:** `/impeccable polish`, `harden`, `clarify` (copy).
7. **Device check** on a physical iPhone through TestFlight ([test strategy §5](../testing/TEST-STRATEGY.md#5-device-check-protocol)). How motion feels is judged only in a release build on a real device, never in a simulator.

A screen is design-done when steps 4–7 pass. Record the scores, the HIG findings and their dispositions, and the device result.

## 3. When the skills disagree

They will. Impeccable bans things the HIG recommends, the HIG prefers system defaults that make apps look alike, and Emil's motion rules are stricter than both. **Precedence, highest first:**

1. **What App Review and accessibility require.**
   - HIG rules that are effectively mandatory: 44 pt targets, Dynamic Type, safe areas, the in-app purchase and paywall presentation rules, Sign in with Apple placement, and Apple Pay marks.
   - The SRS accessibility NFRs.
   - Nothing below can override these.
2. **The pinned brief.** `DESIGN.md`'s Sticker Diary direction, the kawaii tone, and "never punish" ([NFR-UX-001](../srs/SRS.md#nfr-ux-001)). Impeccable's "the brief wins" applies to the HIG's *stylistic* preferences too: a recommendation to use SF Symbols or a stock look doesn't overrule the custom icon set or the rounded display face.
3. **Motion: Emil's rules,** checked against the HIG's motion page for platform conventions (for example, no animation on tab switches, which both agree on).
4. **Everything else:** the stricter rule wins, and the choice is written down.

**Tensions already known, and where they are decided:**

| Tension | Resolution | Decided in |
|---------|-----------|------------|
| HIG: system font, SF Symbols. Brief: a rounded display face and custom VectorCraft icons. | The display face for headings and the timer; the system font for body text (Dynamic Type stays native). Custom icons are allowed as long as they form one consistent, weight-matched set, which the HIG's cross-platform guidance accepts. | Plan §5.2; Phase 1 C2, C3 |
| **Liquid Glass** (an iOS 26 system material) vs. Impeccable's ban on decorative glass and `DESIGN.md`'s "no blur tab bar" | Use glass **only where the system provides it** (the native tab bar and sheets in their default iOS 26 appearance). Never hand-roll a glass effect. Confirm against `apple-design`'s Liquid Glass checklist when the tab bar moves to Expo Router. | Phase 1 B6 / C4 |
| HIG sheets and modals vs. the plan's "no stacked modals" | Bottom sheets and inline moments, presented the native way (`formSheet` / page sheet) | Phase 1 D1 |
| Paywall look (brief) vs. Apple's in-app purchase rules | Apple's rules win on content and placement (price, terms, restore); the brief wins on styling | Phase 5 |

A new tension gets a row here, or an ADR if it is structural.

## 4. Installing and updating the skills

| Skill pack | Version | In git? | Reinstall |
|------------|---------|---------|-----------|
| Impeccable | 4.8.0 | Yes (Apache-2.0; LICENSE and NOTICE included; the engine binary is git-ignored) | `npx impeccable install --providers=claude --scope=project --no-hooks -y` |
| Emil Kowalski, all 16 skills | `emilkowalski/skills@a81dbca` | Yes (MIT; a LICENSE in each skill folder) | Copy `skills/<name>/` from the repo into `.claude/skills/`. Emil's `apple-design` goes in as `emil-apple-design`, with its `name:` changed to match. |
| Apple Design Skill | `dickwu/apple-design-skill@ff4ebdd` | **No.** It bundles Apple's HIG text, which is Apple's copyright, and this repo is public. It is listed in `.gitignore`. | `git clone https://github.com/dickwu/apple-design-skill.git .claude/skills/apple-design && git -C .claude/skills/apple-design checkout ff4ebdd`, or `npx skills add dickwu/apple-design-skill -a claude-code` |

- **Every machine or cloud session that does design work must reinstall the Apple skill** (it isn't in the repo).
- **Skills are discovered when a session starts.** A session running when a skill is installed won't see it until a new session begins.
- **Updates:** pull, read the diff of every `SKILL.md`, then record the new commit in this table.
- **The Apple skill's `scripts/pull-hig.mjs`** refreshes its HIG pages from apple.com. Don't run it as part of reviews.

## Backlinks
<!-- backlinks:start -->
- [Changelog](../../CHANGELOG.md)
- [Documentation map](../README.md)
- [Design work runs on Impeccable, the Apple HIG skill and Emil Kowalski's skills, in a fixed precedence](../architecture/adr/0042-design-skill-stack.md)
- [Native tabs, frozen by a route wrapper, laid out by safe-area insets](../architecture/adr/0043-native-tabs-frozen-by-a-wrapper.md)
- [Design skills — Apple HIG skill and the full Emil Kowalski pack](../implementations/2026-10-30-design-skills.md)
- ["Phase 1 B6: Expo Router with native tabs"](../implementations/2026-10-30-phase1-b6-expo-router.md)
- ["Phase 1 Stage C (C1–C4): the Sticker Diary design system, display face, Classic brief and art"](../implementations/2026-10-30-phase1-stage-c-design.md)
- ["Settings: the number pad can be dismissed (DEF-008)"](../implementations/2026-10-30-settings-keyboard-dismiss.md)
- [Requirements traceability (generated)](../testing/TRACEABILITY.md)
<!-- backlinks:end -->
