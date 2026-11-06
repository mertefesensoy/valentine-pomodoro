---
id: IMPL-2026-11-06-phase2-e2-privacy-policy
title: "Phase 2 E2: the privacy policy, in English and Turkish"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-06-phase2-d4-account, IMPL-2026-11-05-phase2-b4-startup-reports, ADR-0051, SRS]
---

# 2026-11-06 — Phase 2 E2: the privacy policy, in English and Turkish

**Status:** The owner has read the draft. It's pushed so that the app's row can reach the first build, and the task stays open until §0.2's legal read.
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
| `src/screens/__tests__/settingsPrivacy.test.tsx` | New. The row opens the policy, and the switch it names turns the report off. |
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

### What the owner decided, 2026-11-06

- **The draft:** "Reads right, push it (Recommended)".
- **The legal read:** "I'll arrange it, ask later (Recommended)". It holds up the submission and nothing before it. The draft is a private page the owner can share, at https://claude.ai/artifact/762buDBFbsGjW3EPiBe8Ke.
- **The website:** "Policy and both home lines (Recommended)".
- **The text's three commitments** (when notes may be read, under 13, the contact address): "All three are right (Recommended)". The question misspelt the address, and the text has the one the old policy had.

### Questions for the reader

§0.2 asks someone qualified to read the policy before 1.5.0 ships. These are the things a developer can't settle:

1. **Transfers abroad.** Data about people in Turkey goes to Frankfurt, held by Supabase on Amazon Web Services. What does KVKK Article 9 need here (a standard contract and its notification, or something else), and is Supabase's data processing agreement enough?
2. **Are the start-up reports anonymous?** A report has no identifier, and holds a time, a random group, the iPhone model, the iOS version, the build and the date. The IP address passes through Supabase, and may sit in its request logs for a short time. It's on by default with an off switch and no prompt. Does that hold under KVKK and the GDPR?
3. **The developer's duties.** One person runs this. What must the text add: the data controller and an address, legal bases, the rights in KVKK Article 11 and the GDPR, how to complain? Is VERBİS registration needed? Does a GDPR Article 27 representative apply?
4. **Ads.** The app asks AdMob for non-personalised ads and shows no consent prompt. Is that enough for people in the EU, where Google's own consent policy may still apply?
5. **Keeping data.** An account is kept until it's deleted, and deleted data can stay in backups for up to 7 days. Is that acceptable, or is a retention period needed?
6. **A partner's words.** Your export contains notes your partner wrote, and your partner's name. Is that right?
7. **Reading notes.** The text says notes aren't end-to-end encrypted, and that the operator looks at them only to fix a problem or if the law requires it. Is that wording sound?
8. **Age.** The text says the app isn't meant for children under 13. Is that the right age in Turkey and the EU?

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Say the operator could read a note | Saying nothing | Notes aren't end-to-end encrypted. A person writing to their partner should know |
| "sen" in Turkish | "siz", as the website's old text has | The app says "sen" everywhere, and the policy is the app talking |
| The link goes in the Privacy group | About, beside the website | It sits with the switch it explains |

## 6. Verification

- [x] Every row of §3's inventory has a sentence, and every sentence a row.
- [x] The row opens the policy (`settingsPrivacy.test.tsx`), with the guards green.
- [x] The bytecode: 4,587,872 B, which is 380 B for E2 and leaves 52,128 B of NFR-PERF-002.
- [x] The owner has read the draft.
- [ ] **Before the submission:** someone qualified reads it, the text changes as they advise, and the owner approves it.
- [ ] The website's pull request is merged and live.
- [ ] **After the first real sign-in, at F2:** the owner looks at Authentication › Users, and the sentence about email is firmed up.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), E2 and §0.2
- [ADR-0051](../architecture/adr/0051-anonymous-start-up-reports.md)
- [D4's record](2026-11-06-phase2-d4-account.md)
