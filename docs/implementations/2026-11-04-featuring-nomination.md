---
id: IMPL-2026-11-04-featuring-nomination
title: "App Store featuring nomination: Meet Pomo & Doro"
status: done
date: 2026-11-04
owner: Mert Efe Şensoy
related: [IMPL-2026-11-01-phase1-stage-e, IMPL-2026-11-03-def-009-background-audio-mode, RELEASE]
---

# 2026-11-04 — App Store featuring nomination: Meet Pomo & Doro

**Status:** Done. The owner submitted it in App Store Connect on 2026-11-04 ("done! submitted it"). Apple's answer, if any, is open.
**Branch:** none. No app code changes. This record is the only thing added to the repo.

---

## 1. Problem / Motivation

The owner asked to nominate the app through App Store Connect's Featuring Nominations, on the day 1.4.0 went live. Editors can only consider what they are told about, and a nomination is free. This record keeps what was sent, so a later nomination can build on it instead of starting over.

**Timing, stated plainly.** 1.4.0 went live on 2026-11-04 at 14:45 UTC, before the nomination was submitted. Apple asks for notice in advance, so this nomination missed the chance of a feature timed to the release. Apple's two pages differ on how much: its [help page](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/) says at least 3 weeks, and [Getting Featured](https://developer.apple.com/app-store/getting-featured/) says at least 2 weeks, and up to 3 months for wider consideration.

## 2. What Changed

| File or place | Change |
|---------------|--------|
| App Store Connect › Featuring Nominations | The nomination below, submitted by the owner |
| `docs/implementations/2026-11-04-featuring-nomination.md` | This record |
| `docs/README.md` | A row for this record |

## 3. Implementation Approach

The owner filled in the form screen by screen, from text drafted in the session. **This is the text as handed over.** The session saw the form up to the Additional Information page. It didn't see the final review or the publish date as entered, and the owner may have edited something.

**Form limits seen:** the name takes 60 characters and Helpful Details 500. The owner reported 1,000 for the description. Apple's help page doesn't list these.

**Name**

> Meet Pomo & Doro

**Type:** App Enhancements

**Description** (933 characters)

> Meet Pomo & Doro: Pomo, a round strawberry with one curl, and Doro, a wide matcha dome. They are the heart of Valentine Pomodoro 1.4, the app's biggest update since its January 2026 launch and my top priority for featuring. It went live on November 4, 2026.
>
> • On first launch, they turn into the pages of one diary, then show you around in their own babble.
> • They study when you study, rest on your breaks and wait when you pause.
> • Each finished focus presses a sticker onto today's page, toward a daily goal, with a love note waiting.
> • Also new: Strawberry Milk and Midnight Plum themes, Stats as a stack of postcards, one-tap session lengths, two timer layouts, original sounds, and the whole app in Turkish.
> • Still here: Fly Mode, a flight across a real map that lasts as long as your focus.
>
> The goal: make focusing feel warm rather than stressful, so people come back because they want to. No guilt, no account, no sign-in.

**Publish date, as recommended:** a Range from 2026-11-04 to 2027-01-31. The form asks for "a date or time frame when you expect to publish on the App Store".

**Additional Information, as recommended**

| Field | Value |
|-------|-------|
| Related Apps | Valentine Pomodoro |
| Platforms | iOS (iPhone), iOS (iPad) |
| Relevant Countries or Regions | All selected |
| Localization | 2 languages selected, pre-filled |
| New in-app event | Not ticked |
| Supplemental Materials | `https://apps.apple.com/us/app/valentine-pomodoro/id6757491918` |

**Helpful Details** (484 characters)

> Valentine Pomodoro began as a gift for one person and grew into a public app, made by an independent developer. Pomo & Doro are drawn and voiced just for this app, and all of its sounds are original. It supports Dark Interface and Larger Text, with contrast checked by script against WCAG in both themes. Every screen, notification and alert is in English and Turkish, with a Turkish product page. It also has its own iPad layouts and looping product page videos starring Pomo & Doro.

**After submitting** (Apple's help page): the text stays editable, but the type and the related apps don't. If Apple is considering the app, it may email the Admin, App Manager or Marketing roles for promotional artwork.

## 4. Mathematical / Statistical Details

None: no formula or numeric algorithm is involved. The character counts above were measured with line endings as LF.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| App Enhancements | App Launch; New Content | The app first launched on 2026-01-09, and 1.4 is a significant update to it |
| The name "Meet Pomo & Doro" | "Version 1.4: Sticker Diary redesign" | **The owner's choice:** "it sounds more interesting". The text was then rewritten to lead with the characters |
| A range starting on the true release date | A single day; a range starting 3 weeks out | The start is true, and the end gives editors room through the December and January exam seasons. The description says 1.4 is already live, so the range doesn't mislead |
| Describe only what 1.4.0 ships | Mention pairing and the couples plans | Those are planned, with no dates (ROADMAP), and nothing unbuilt should be promised to editors |
| Claim only Dark Interface, Larger Text and the contrast check | Add VoiceOver, Voice Control and Reduce Motion | The Stage E record lists these three as checked. The others wait for the owner to try them on a device |
| No ratings, downloads or press | Cite the Turkish rating | PRODUCT.md forbids inventing such evidence, and the storefronts showed too little to cite: 0 ratings in the US and 2 in Turkey on 2026-11-04 |
| The origin line without a name | Name the person the app was made for | PRODUCT.md keeps that name to one line in About. The owner can add it if they choose |
| Submit now | Wait and nominate only the couples release | Nothing suggests a nomination uses anything up, so this doesn't hold back a later one |

## 6. Verification

- [x] The owner reported the submission, 2026-11-04. The session didn't see the Submitted list itself.
- [x] Every claim in the text was checked against the repo: the CHANGELOG, Stage E's listing, and the code for what Pomo & Doro do (`src/i18n/en.json`, `src/screens/classic/PoseSticker.tsx`, `src/screens/tutorial/babble.ts`).
- [ ] The product page really shows the looping videos. The repo says they went in with 1.4.0, but this wasn't checked on the live page.

**For later:**
- Nominate pairing separately once it has a firm date, up to 3 months ahead.
- Valentine's Day 2027 is a natural moment for this app, if there is something new to show. Apple's 3-month window for it opens around 2026-11-14.
- Trying VoiceOver and Reduce Motion on a device would allow a stronger accessibility claim next time.

## 7. Related Docs

- [Phase 1 Stage E: verify and ship v1.4.0](2026-11-01-phase1-stage-e.md): the listing this text draws on
- [DEF-009's record](2026-11-03-def-009-background-audio-mode.md): what has to ship next
- [RELEASE.md](../process/RELEASE.md)
