---
id: IMPL-2026-11-06-phase2-e2-privacy-policy
title: "Phase 2 E2: the privacy policy, in English and Turkish"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-06-phase2-d4-account, IMPL-2026-11-05-phase2-b4-startup-reports, ADR-0051, SRS]
---

# 2026-11-06 — Phase 2 E2: the privacy policy, in English and Turkish

**Status:** Plan. Written before the text.
**Branch:** `feat/phase2-e2-privacy-policy`, one pull request into `master`. The website is a separate repository, with its own pull request.
**Plan task:** [Phase 2 plan §3, E2](2026-11-05-phase2-plan.md#stage-e-reliability-and-policy), [NFR-PRIV-002](../srs/SRS.md#nfr-priv-002). Done when the owner approves the text, after §0.2's legal read.

---

## 1. Problem / Motivation

What the app says about privacy stopped being true, in three places, and two of them were already wrong before 1.5:

- `privacy-policy.md` says no third-party SDKs are used, though Google AdMob has been in the app since v1.
- The website's policy says ads "may be personalized", though the app asks for non-personalised ads only. It also says the only third party is AdMob.
- The README and the website's home page say no servers and no accounts, or "collects zero data". 1.5.0 has an anonymous start-up report from every install, and accounts for people who pair.

Apple also asks for a link to the policy inside the app (Guideline 5.1.1(i)). The app has none: only a link to the website's home page.

## 2. What Changed

| File | Change |
|------|--------|
| `privacy-policy.md` | The policy, rewritten from what the code does, in English and Turkish. |
| `README.md`, `docs/README.md` | Their privacy lines point at it. |
| `src/screens/SettingsScreen.tsx`, `src/i18n/en.json`, `src/i18n/tr.json` | A Privacy policy row in Settings' Privacy group. |
| `src/screens/__tests__/settings.test.tsx` | The row opens the policy. |
| `Valentine-Pomodoro-Developer-Website`: `src/locales/en.json`, `src/locales/tr.json` | The same text, and the home page's two claims. A separate pull request. |

## 3. Implementation Approach

**Every sentence comes from something read in the code,** not from an older policy. The inventory:

| Fact | Where it comes from |
|------|---------------------|
| The report's fields, its 10 ms rounding, the day, 90 days | `supabase/migrations/20261105150000_phase2_startup_reports.sql`, ADR-0051 |
| An account's fields | `supabase/migrations/20261105120000_phase2_tables.sql` |
| Only today's and yesterday's totals are reported, and only while paired | `src/server/dayReports.ts` |
| Apple is asked for the name only | `src/server/appleSignIn.ts` |
| A note is kept after it's shown, until unpairing or deletion | The migrations: `mark_note_shown` only sets `shown_at`, and `couple_id` cascades |
| What deletion does, and that Apple's token is revoked | `supabase/functions/delete-account/handler.ts`, the triggers |
| What the export holds | `export_my_data` |
| Ads are non-personalised | `src/ads/AdManager.ts`, `src/screens/StatsScreen.tsx` |
| An iPhone checks Apple for updates, and Android checks GitHub Pages | `src/hooks/useUpdateCheck.ts` |
| No location, and no tracking prompt | `app.json`, and no `expo-location` |
| Backups last 7 days on Supabase Pro | [Supabase's backups page](https://supabase.com/docs/guides/platform/backups), read 2026-11-06 |

**One page that's true for every version.** 1.4.2 is in review, and 1.5.0 follows it, so the text says what starts with 1.5.0. That makes it safe to publish before 1.5.0 is out.

**Facts only.** Legal bases and what KVKK or the GDPR require are for §0.2's reader, so the text states what happens and how to act on it. The Turkish follows the English, so the reader reviews one set of facts.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Say the operator could read a note | Saying nothing | Notes aren't end-to-end encrypted. A person writing to their partner should know |
| "sen" in Turkish | "siz", as the website's old text has | The app says "sen" everywhere, and the policy is the app talking |
| The link goes in the Privacy group | About, beside the website | It sits with the switch it explains |

## 6. Verification

- [ ] Every row of §3's inventory has a sentence, and every sentence a row.
- [ ] The row opens the policy (`settings.test.tsx`), with the guards green.
- [ ] The owner approves the text, after the legal read.
- [ ] **After the first real sign-in, at F2:** the owner looks at Authentication › Users, and the sentence about email is firmed up.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), E2 and §0.2
- [ADR-0051](../architecture/adr/0051-anonymous-start-up-reports.md)
- [D4's record](2026-11-06-phase2-d4-account.md)
