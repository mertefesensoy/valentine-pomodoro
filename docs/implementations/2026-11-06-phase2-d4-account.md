---
id: IMPL-2026-11-06-phase2-d4-account
title: "Phase 2 D4: your account: unpair, delete, and download your data"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-a3-design, IMPL-2026-11-05-phase2-b3-functions, IMPL-2026-11-05-phase2-c1-client, ADR-0049, DESIGN-WORKFLOW, SRS]
---

# 2026-11-06 — Phase 2 D4: your account: unpair, delete, and download your data

**Status:** Built and tested. Under review from code; the device checks wait for Stage F's first build.
**Branch:** `feat/phase2-d4-account`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, D4](2026-11-05-phase2-plan.md#stage-d-the-screens-behind-the-flag). Its brief is the "Phase 2 addition" in the Settings surface under `.impeccable/surfaces/`, confirmed by the owner on 2026-11-05 ("Yes, they're right"), with "No sign out in 1.5.0".

---

## 1. Problem / Motivation

Someone who makes an account has to be able to leave it. Guideline 5.1.1(v) requires deleting the account inside the app, and the promise made at pairing is that this is yours: you can unpair, take your data, or delete it all, and the timer, stats and notes on your phone stay as they were.

Requirements: [FR-PAR-002](../srs/SRS.md#fr-par-002), [FR-ACC-003](../srs/SRS.md#fr-acc-003), [FR-ACC-004](../srs/SRS.md#fr-acc-004). "Done when": deletion leaves the partner's own history and removes the notes you wrote, and they see that you've gone.

## 2. What Changed

| File | Change |
|------|--------|
| `src/screens/account/AccountGroups.tsx` | New: the Your partner and Account groups. Loaded with `React.lazy`, only with an account. |
| `src/screens/account/accountActions.ts` | New: unpair, delete and download, with statuses. |
| `src/screens/SettingsScreen.tsx` | Places them; the solo "Pair with your partner" row; the line once an account is deleted. |
| `src/server/account.ts`, `src/server/client.ts` | `justDeleted`, and an ended session only counts for someone with an account. |
| `src/server/partnerGlance.ts`, `src/server/home.ts` | `clearPartner()`, for leaving a couple or an account, and a generation, so a snapshot already on its way can't bring a partner back. |
| `src/screens/TimerScreen.tsx` | The strip's partner needs an account too. |
| `src/components/settings/SettingsList.tsx` | `InfoRow`, a label and value with nothing to open. |
| `src/server/runtime.ts` | Does nothing once there's no account. |
| `eslint.config.js` | The lint rule covers `screens/account`. |
| `src/i18n/en.json`, `src/i18n/tr.json` | The words, drafts for the copy proof (D6). |
| Tests | Below. |

## 3. Implementation Approach

**Reached lazily.** `SettingsScreen` is on a solo launch's path, so it reads only `useAccountStore` and `usePartnerGlance`, which import no SDK. The groups load with `React.lazy` once there's an account, and everything else follows from that.

**Order, from the brief:** Your partner first once paired, and after Love notes while solo; Account follows it; Privacy stays above About. With the flag off, none of this draws.

**Unpair.** A native alert names what happens. `unpairPartner()` calls `unpair` (`not_paired` counts as done, since it's what was asked), then:

1. `clearPartner()` empties the summary, with no "gone" line, because you did this yourself. Notes waiting and marked go too, because the server deletes them.
2. Queries on their way are cancelled, and the cached snapshot keeps `me` and loses the couple, partner, today and notes, so a failed refresh can't show a partner they've just left.
3. A refresh, best effort.

**A snapshot already on its way.** The pairing sheet's poll or a return to the app can have one in flight. Cancelling a query doesn't stop `fetchHome`, whose `syncGlance` would write the old couple back, and a later refresh would then announce a "gone" partner to the person who left, or, after deletion, draw a partner for an account that no longer exists. So `clearPartner()` bumps a generation, and `fetchHome` drops the summary's update from a fetch that started before it. As a second guard, the Timer's strip needs an account as well as a summary.

The account stays, so pairing again needs no sign-in. Your partner finds out at their next refresh, by D2's "gone" line.

**Delete,** in the order C1's record fixes, since Apple's authorization code is single-use and lasts five minutes, with nothing between the last two steps:

1. A native alert saying what goes and what stays on this phone.
2. Apple's own confirmation (`requestDeletionCode`). A cancel is nothing having happened.
3. `invoke('delete-account', { authorization_code })` at once. `authorized()` sends the bearer that the handler reads to find the person (`verify_jwt = false` is why it reads it itself), and it can only retry a 401, which the handler returns at its first step, before it spends the code.
4. On success, `forgetAccount()`, in this order, because the flag is what flips the screens:
   - `clearPartner()`, the summary, notes and `shown`;
   - queries on their way cancelled, then `clearHome()`, the query and its persisted copy;
   - the day reports' queue;
   - `clearSession()`, the Keychain;
   - `justDeleted = true`, and last `setHasAccount(false)`, which clears `sessionEnded` in the same write.

   Each step is independent, and none can stop the next: the account is already gone on the server, so a failure here must still end with the phone solo. `pair_celebrated_v1` stays, since the morph is once per person.

**What `delete-account` answers,** from `handler.ts`:

| The handler says | When | The app says |
|------------------|------|--------------|
| 200 `ok` | Done | Solo, with the line in Settings |
| 401 `not_signed_in` | Step 1 only, before the code is spent, so the client's one retry is safe | After that retry, `session_ended` |
| 400 `no_authorization_code` | Step 2 | `failed`. It can't happen from the app |
| 502 `apple_failed` | Steps 3 and 4 | `failed`, and nothing has changed. Trying again gets a fresh code |
| 500 `delete_failed` | Step 5: Apple's token is revoked and the account remains, B3's known gap | `failed`. Trying again works while the session does, with a fresh code |
| No answer | | `offline`. If the server had finished, the next refresh finds no account |

**If it goes wrong:**

| What happens | What the phone shows, and what's left |
|--------------|---------------------------------------|
| Apple's sheet cancelled | Nothing changes |
| Offline, or the server refuses | A line under the group, and they can try again. Nothing local has changed |
| B3's known gap: Apple's token revoked, then the delete fails | The same line. Their session still works, and trying again gets a fresh code from Apple. Nothing local has changed |
| The session has ended | The group offers signing in again first |
| The app dies between the server's yes and the local clearing | The flag is still set with the account gone. The next refresh ends in `SessionEnded`, the strip offers signing in, and that makes a new account. Local stats and notes are untouched |

**The runtime keeps running after this,** with its `AppState` listener, because it starts once per launch and has no stop. So `refreshAll` returns at once with no account, before `syncTimeZone`, which also calls the server. `setSessionEnded(true)` does nothing with no account, and `setHasAccount(false)` clears it in the same store write, because a call can still fail in the moment between the Keychain emptying and the flag going. Otherwise a deleted account would look like an ended session.

**Download my data.** `export_my_data` goes to a JSON file in the cache, through the share sheet by URL, so it can be saved to Files as a real file, then deleted, which is safe because iOS copies on saving. It uses `expo-file-system`, already a dependency. It includes the notes you've received, your partner's words leaving at your choice, so **E2's privacy policy has to say so.**

**Your name** edits with `Alert.prompt`, the system's own, capped at 60 characters here and validated on the server by `saveName`.

**With an ended session,** every action here would fail, so the groups show their name and one row, "Sign in again", which opens `/pair`. Deleting needs a session, and this is the way to get one.

**The done line.** "Your account is deleted…" can't live in the lazy group, because that unmounts with the flag. `justDeleted` isn't persisted, and `SettingsScreen` shows it under Your partner's solo row until the app next starts.

**Motion:** none. These are the system's own alerts and sheets.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Clear locally only after the server's yes | Clearing first | A failure after clearing would leave a person with an account and no way to reach it from this phone |
| The account flag is cleared last | First | It's what flips the screens, so everything they read has to be gone by then |
| Keep `pair_celebrated_v1` | Clearing it | The brief says once per person, and a person doesn't change by deleting an account |
| No sign-out | A sign-out row | The owner: "No sign out in 1.5.0" |
| `Alert.prompt` for your name | An inline field, or a pushed screen | The frame draws a name row with nothing under it. It's the app's one text entry in Settings, whose thesis is that nothing needs the keyboard, so the system's own prompt is the lightest way. H-6 keeps alerts for what can't be undone, and this is a third kind, but it's a prompt, not an interruption |
| The export is a file | Sharing the JSON as text | FR-ACC-004 says JSON, and a person can then keep it as a file. Text would paste a wall of JSON into whatever they chose |

## 6. Verification

- [x] `accountActions`: every status of unpair, delete and download, and `forgetAccount`'s order, including a step failing.
- [x] The groups: solo, paired and after unpairing; the order in Settings (`settingsAccount.test.tsx`); an ended session.
- [x] A solo launch evaluates no server code with Settings in place, and with the flag off nothing draws (`settings.test.tsx`).
- [x] After deletion, a foreground return makes no request and doesn't look like an ended session (`home.test.ts`, `accountActions.test.ts`), and a snapshot already on its way can't bring a partner back.
- [x] The guards, and the bytecode: 4,577,740 B, which is 17,504 B for D4 and leaves 62,260 B of NFR-PERF-002 for D5 and D6.
- [x] Deletion's server side is B3's pgTAP (`supabase/tests/functions.test.sql`): the partner keeps their history, your notes go, and they see you've gone.
- [ ] **Needs a device, at Stage F's first build:** Apple's confirmation and a real `delete-account` call, whose code can only be spent once; the partner seeing you've gone; the share sheet saving to Files; the finish review on captures, at the largest text size and with VoiceOver.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), D4
- [B3's record](2026-11-05-phase2-b3-functions.md), [C1's record](2026-11-05-phase2-c1-client.md), [D2's record](2026-11-06-phase2-d2-partner.md)
- [DESIGN-WORKFLOW](../process/DESIGN-WORKFLOW.md)
