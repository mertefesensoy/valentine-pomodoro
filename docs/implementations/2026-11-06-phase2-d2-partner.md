---
id: IMPL-2026-11-06-phase2-d2-partner
title: "Phase 2 D2: your partner's day"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-a3-design, IMPL-2026-11-05-phase2-c2-home, IMPL-2026-11-05-phase2-d1-pairing, ADR-0049, DESIGN-WORKFLOW, SRS]
---

# 2026-11-06 — Phase 2 D2: your partner's day

**Status:** Built and tested. Under review from code; the device checks wait for Stage F's first build.
**Branch:** `feat/phase2-d2-partner`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, D2](2026-11-05-phase2-plan.md#stage-d-the-screens-behind-the-flag). Its brief and direction contract: `.impeccable/surfaces/app-partner-tsx.md`, approved by the owner on 2026-11-05 ("Approve it").

---

## 1. Problem / Motivation

Pairing has to do something the moment it happens, or people sign in and see nothing until 1.6.0. D2 makes the Timer's strip become your partner, with their name and today's stickers and minutes, and opens a sheet with their whole day and when it was last updated. It must show the last known values whatever the network is doing, and it must not bring any server code into a solo launch.

Requirement: [FR-PAR-003](../srs/SRS.md#fr-par-003).

## 2. What Changed

| File | Change |
|------|--------|
| `src/server/partnerGlance.ts` | New: a small persisted summary of the partner's day that the strip reads. It imports no SDK. |
| `src/server/home.ts` | `fetchHome` updates the summary on every snapshot. |
| `src/screens/classic/PartnerStrip.tsx` | New: the strip as your partner, static, reading only the summary. |
| `src/screens/TimerScreen.tsx`, `src/screens/classic/SpreadPages.tsx` | Show it when paired; the quiet notices; open the morph on the phone that wasn't holding the sheet. |
| `app/partner.tsx`, `src/screens/partner/PartnerScreen.tsx`, `src/screens/partner/PartnerCard.tsx` | New: the sheet and its postcard, loaded with `React.lazy`. |
| `app/_layout.tsx`, `src/navigation/sheetOptions.ts` | Register the sheet, sized to its content. |
| `src/screens/stats/WeekStack.tsx` | Export `Stickers`, so the postcard uses the same cells. |
| `src/screens/pair/pairing.ts` | The celebration's helpers move to the summary's module, so the Timer can read them with no server code. |
| `src/screens/classic/PartnerStrip.tsx` | Also holds `PartnerDay`, `PartnerNotice`, `partnerLabel` and `updatedText`, which Facing Pages and the sheet share. |
| `src/i18n/en.json`, `src/i18n/tr.json` | The words, drafts for the copy proof (D6). |
| `.impeccable/surfaces/app-partner-tsx.md` | §5 gains the ended-session state, which the brief didn't cover. |
| `src/server/__tests__/partnerGlance.test.ts`, `src/screens/__tests__/partnerStrip.test.tsx`, `src/screens/partner/__tests__/` | The summary, the strip's states on both layouts, the sheet, and break-ui's worst case. |

## 3. Implementation Approach

**The strip reads a summary, not the query.** The strip is on screen from the first frame, but TanStack Query and the client must stay out of a solo launch, and even a paired launch refreshes only after the first frame. A lazy strip would mean a Suspense fallback, then the persister's restore, and so a flash of the solo strip on every paired launch, and the Ring sizes itself from this row's height. So the strip is a plain static component reading one small persisted store:

- **`partnerGlance.ts`** holds `{ glance, gone }` in Zustand and MMKV (`partner_glance_v1`). It imports no SDK, as `account.ts` doesn't. With no pairing it reads one empty key.
- **`syncGlance(snapshot)`**, called from `fetchHome`, is the only writer: every snapshot from any caller passes through it. No side effects beyond the store and its key.
- **Solo and paired strips have the same minimum height,** so nothing moves when you pair.

**A couple ending or a session ending are notices, not alerts.** When a snapshot has no couple but the summary had one, the name moves into `gone`, and the strip returns to solo with one quiet line until tapped. That's how "You and Deniz aren't paired any more" knows the name, with no server change.

**An ended session.** `account_v1` stays set when a session ends, since the account still exists ([C1's record](2026-11-05-phase2-c1-client.md)). D1 added `sessionEnded` beside it in `useAccountStore`, set by `client.ts` and cleared at sign-in. With it on, the strip keeps the last known values and adds one quiet line offering to sign in again. While idle it opens `/pair`, which says "You're still paired, and nothing is lost" beside Apple's button, then closes itself once signed in, with the couple found on the server. While a session runs it opens their last known day instead. The brief doesn't list this state, so §5 gains it, and the owner hears that with D1's question.

**The other phone's morph.** The person who wasn't holding the sheet finds out at the next refresh. `TimerScreen` opens `/pair` once, when it's idle and focused, and nothing has been celebrated. Any sheet over the Timer unfocuses it, because a route's focus includes its parent's (`useIsRouteFocused` in Expo Router's build), so the phone that pressed Pair can't open a second sheet.

**The sheet** is a form sheet sized to its content, as Modes is, with a ScrollView root and `contentStyle` for the bottom safe area ([stage D's trap](2026-10-30-phase1-stage-d.md)). `PartnerCard` draws the postcard from the summary alone: the date, a row of whole cells with dashed cells for what's owed, one line, then "Updated 12 minutes ago". There's no spinner and no fetch on opening, because refreshes stay where C2 put them. D3 adds the note action to this sheet.

**No motion:** the brief's frequency gate says the strip's values just change when a refresh lands.

## 4. Mathematical / Statistical Details

**Stale across midnight.** `partner_today` is "their today" at the moment of the refresh. After midnight with no refresh, the strip would say "75 min today" about yesterday. So with `fetchedAt` the time of the last snapshot, the strip shows values only when `localDayKey(fetchedAt) = localDayKey(now)`; otherwise it shows the "Updated" line instead. The strip reads the clock only when it renders and an idle Timer doesn't re-render by itself, so returning to the app publishes the same values as a new object (`touchGlance`), even if the refresh then fails. The sheet's postcard always shows its own date, so it stays honest, and it owes nothing on a day that's over.

**Dashed cells owed to their goal.** The partner's session length isn't in the snapshot, so with m = focus minutes, s = sessions, G = goal minutes:

```
average = (s > 0 and m > 0) ? m / s : 25
owed    = G > m ? ceil((G − m) / average) : 0
```

No goal means no dashed cells. It's a picture of how far there is to go, and the line beneath it carries the real numbers.

**Relative time.** The app has no helper, and Hermes' `Intl.RelativeTimeFormat` isn't assumed. `updatedText(iso, now)` picks one string from whole units, with d = now − updatedAt: under 1 minute "just now"; under 60 minutes, ⌊d/60 000⌋ minutes; under 24 hours, ⌊d/3 600 000⌋ hours; otherwise ⌊d/86 400 000⌋ days, each with i18n's plural forms. A negative d, from a phone's clock running behind, counts as "just now".

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| A static strip reading a small store | A lazy strip on the query | The lazy strip would flash solo on every paired launch and could move the Ring. This costs a few fields duplicated from the snapshot, with one writer |
| `fetchHome` as the only writer | Subscribing to the query cache in `runtime.ts` | One call on the one path every snapshot takes, including the pairing sheet's polling, which runs whether or not the runtime has started |
| The former partner's name kept on the phone | A server field | No migration, and the phone that needs the name is the one that already knew it |
| "Updated" uses `partner_updated_at` | The time of my last refresh | "When they were updated" is about their day. It stays true whether I'm online or not |

Under Reduce Motion, D1's first-pairing morph keeps its one soft haptic: it's the one piece of physical feedback in that moment, and it isn't motion. The welcome has none under Reduce Motion because nothing happened there that the person caused.

## 6. Verification

- [x] The strip's states: paired, nothing yet, stale past midnight, gone, ended session; its VoiceOver line; both layouts.
- [x] A solo launch evaluates no server code, with the strip in place (`soloLaunch.test.tsx`, `soloRouter.test.tsx`), and reads nothing past the account flag (`partnerGlance.test.ts`).
- [x] `syncGlance`: a couple arriving, a couple gone, a day not carried over.
- [x] The other phone's morph opens once, and not once it has played or from an ended session. Not opening over a running session or another sheet follows from `idle` and `focused`, and needs the device.
- [x] Break-ui's worst case (`partnerWorstCase.test.tsx`): a 60-character name with Turkish and emoji, 42 sessions, no name, nothing yet, Turkish at AX5 on an iPhone SE. Whether it lays out well waits for the device.
- [x] The guards, and the bytecode: 4,545,832 B, which is 19,172 B for D2 and leaves 94,168 B of NFR-PERF-002 for D3 to D6.
- [ ] **Needs a device, at Stage F's first build:** the finish review, at the largest text size, with Reduce Motion and with VoiceOver.

### The finish review, 2026-11-06

**From code and a layout model only,** so nothing visual is marked passed. Critique 27/40 (13.5/20) and native audit 15/20 as built, which misses NFR-UX-003's 16. The reviewer's estimate after its fixes is about 34/40 and 18/20, which doesn't count until the device check.

**Its blocker came from D1, already on `master`, and is fixed here:** D1 had moved the strip's stretch inside a new wrapper, and `styles.centre` centres its children, so in portrait the strip shrank to its sticker with the text at width 0, with the flag on or off. Its `yoga-layout` model gave 345 pt on 1.4, 119 pt solo and 91 pt paired, and 345 pt with the fix. Jest doesn't lay out, and no test could see it. No build has it: 1.4.2 comes from the `v1.4.1` tag. A test now pins the wrapper's style. The lesson is to model a layout change like this one, or read its parents.

**The other fixes, all applied:** a warm resume past midnight with no network; the partner's page no longer following your session's pose; the "gone" line tappable on Facing Pages; the postcard planning from its measured width, for iPad; no pairing sheet opening over a running session; a returning person told they're still paired; the solo strip at its frame's 14/19, so the Ring doesn't move at Start; Facing Pages' foot centred with a 44 pt target; no sessions "owed" on a day that's over; the sheet's title never truncated; `inkSoft` and the frame's spacing for the minutes; one sticker order; full words for VoiceOver; the postcard's cells growing with the text; and landscape gutters.

**Its report on FORM:** the brief says `seed: none (no roll)`, since the owner approved this as an extension with no structure round. Reported, not a fix.

**Needs a device,** beyond the list above: the first open of `/partner`, where `fitToContents` meets `Suspense` and may rise low then resize, in which case preload it once paired; a refresh landing while the sheet is open; the solo strip's real height in both languages; Facing Pages' foot; the bottom safe area and iPad width; AX5 Turkish on an SE; VoiceOver in both languages; and a warm resume past midnight, online and offline.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), D2
- [A3's record](2026-11-05-phase2-a3-design.md), [C2's record](2026-11-05-phase2-c2-home.md), [D1's record](2026-11-05-phase2-d1-pairing.md)
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md)
