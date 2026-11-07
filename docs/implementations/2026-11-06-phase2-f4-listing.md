---
id: IMPL-2026-11-06-phase2-f4-listing
title: "Phase 2 F4: the App Store listing for 1.5.0"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-01-phase1-stage-e, IMPL-2026-11-06-phase2-e2-privacy-policy, IMPL-2026-11-06-phase2-e3-review-partners, ADR-0051, RELEASE]
---

# 2026-11-06 — Phase 2 F4: the App Store listing for 1.5.0

**Status:** Drafted. The owner sets it in App Store Connect, after the two-phone check.
**Branch:** `feat/phase2-f4-listing`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, F4](2026-11-05-phase2-plan.md#stage-f-verify-and-ship). Claude drafts, and the owner sets it.

---

## 1. Problem / Motivation

The listing and the review notes for 1.4 say things that stop being true with 1.5.0: "No account or sign-in is needed" and "No account and no sign-in". The privacy labels have to name what's new, and App Review needs a way through pairing.

## 2. What Changed

| File | Change |
|------|--------|
| This record | The texts below, which the owner puts in App Store Connect. No code changes. |

## 3. Implementation Approach

### What's New

> Pomo & Doro can now bring your partner along.
>
> • Pair with your partner using a 6-character code. You see who it is before you pair.
> • See your partner's day: their stickers, minutes and goal, right on the Timer.
> • Write your partner a note. It appears after their next focus.
> • You still don't need an account. One exists only if you pair, and you can delete it in the app any time.
> • A short tour from Pomo & Doro shows you where it all is.
> • The app now sends an anonymous report of how quickly it opened. You can turn it off in Settings.

> Pomo ile Doro artık partnerini de yanına alabiliyor.
>
> • 6 karakterlik bir kodla partnerinle eşleş. Eşleşmeden önce kim olduğunu görürsün.
> • Partnerinin gününü gör: çıkartmaları, dakikaları ve hedefi Zamanlayıcı'da.
> • Partnerine not yaz. Bir sonraki odaklanmasının ardından görünür.
> • Hesap açman yine gerekmez. Hesap yalnızca eşleşirsen açılır ve uygulamadan istediğin zaman silebilirsin.
> • Pomo ile Doro kısa bir turla her şeyin yerini gösterir.
> • Uygulama artık ne kadar hızlı açıldığına dair anonim bir rapor gönderir. Bunu Ayarlar'dan kapatabilirsin.

### The description

Two changes to 1.4's text. A new section goes after LOVE NOTES:

> TOGETHER, IF YOU LIKE
> • Pair with your partner using a 6-character code
> • See their day: stickers, minutes and goal, right on your Timer
> • Write them a note that appears after their next focus

> İSTERSEN BİRLİKTE
> • 6 karakterlik bir kodla partnerinle eşleş
> • Onun gününü gör: çıkartmalar, dakikalar ve hedef, Zamanlayıcı'nda
> • Ona bir sonraki odaklanmasının ardından görünecek bir not yaz

And the last line, "No account and no sign-in. Open the app and start focusing.", becomes:

> You don't need an account to focus. Open the app and start. Pairing uses Sign in with Apple, and you can delete your account in the app.

> Odaklanmak için hesap gerekmez. Uygulamayı aç ve başla. Eşleşmek için Apple ile Giriş Yap kullanılır; hesabını uygulamadan silebilirsin.

The Promotional Text stays.

### App Review notes

The codes come from the owner's run of `seed_review_partners()` near the submission, and they never go in this repository.

> You don't need an account for the timer, stats and notes. An account is needed only to pair with a partner, using Sign in with Apple.
>
> To test pairing, we've set up demo partners, since pairing takes two people:
> 1. On the Timer, tap "Pair with your partner", and sign in with Apple. If it asks for a name, enter any name.
> 2. Tap the right-hand page and type this code: <CODE-1>. Each code works once, so use <CODE-2> or <CODE-3> if you need another.
> 3. You see "Review Partner". Tap Pair.
> 4. The Timer now shows Review Partner's day. Tap it to see their day and to write them a note.
> 5. Finish a focus. To make that quick, set Focus to 1 minute in Settings › Timer, and choose Custom on the Timer. A sample note from Review Partner appears afterwards. Nobody reads or answers the notes you send to it.
>
> Account deletion (Guideline 5.1.1(v)): Settings › Account › Delete account. It asks you to confirm, then Apple asks, then the account is deleted at once and its Apple token is revoked. Download my data and Unpair are in the same place.
>
> Notes (Guideline 1.2): a note goes only between two people who chose to pair by exchanging a code. Nobody can find or contact a stranger, and nothing is public. Unpairing stops contact at once and deletes the notes between them. Our contact address is in the privacy policy, linked from Settings › Privacy.
>
> On the first launch, a short tour with Pomo & Doro opens over the Timer, Stats and Notes tabs. It can be skipped at any step and replayed from Settings › About. The Modes button on the Timer opens Fly mode, a flight on Apple Maps that lasts as long as the focus session; it asks for no location permission. Notifications are local only. Ads are Google AdMob, non-personalised, and there's no tracking prompt. The app sends an anonymous start-up report, which a switch in Settings › Privacy turns off. The app is in English and Turkish.

"Sign-in required" in App Review Information stays off, since the app works without one, and the codes are in the notes.

### App Privacy labels

"Tracking" stays at no. Everything below is new for 1.5.0, and what's already there for AdMob stands. Each row is what the code does, from E2's inventory.

| Apple's data type | What it is here | Linked to you | Purpose |
|-------------------|-----------------|---------------|---------|
| Contact Info › Name | Your first name, from Apple or as you type it | Yes | App Functionality |
| Identifiers › User ID | The Apple identifier and account id | Yes | App Functionality |
| User Content › Other User Content | Notes to your partner | Yes | App Functionality |
| Usage Data › Product Interaction | Each day's focus time, sessions and goal, while paired | Yes | App Functionality |
| Other Data › Other Data Types | Your time zone and language, while you have an account | Yes | App Functionality |
| Diagnostics › Performance Data | The start-up report | No | Analytics |

The plan's list named crash data, because of Sentry, which was dropped, so the app itself collects none.

### Guideline 1.2

It asks an app with user-generated content for a way to filter objectionable material, to report it, to block abusive users, and for published contact information. The plan's position is that these notes aren't public: they go only between two people who chose to pair, and unpairing is the block. The notes above say so. There's no report button or filter, so **App Review could still ask.** If it does, that's a question for the owner, and a small addition.

### Also on the version page

- **Age rating:** Apple's questionnaire asks about messaging and user-generated content. Notes to a partner may count, which could change the rating. The owner answers it, and it should agree with the policy's "not meant for children under 13".
- **Accessibility claims:** as the checks on the phones show.
- **Screenshots:** the 1.4 set still shows the app truly, with no pairing in it. New ones are the owner's choice.
- **Privacy Policy URL:** `https://valentine-pomodoro-developer-websit.vercel.app/privacy/`, with its trailing slash, as `/privacy` redirects.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Three codes in the notes, with an account each | One code | E3's reason: each account pairs once, and a retry or a second reviewer needs another |
| Notes to a partner as Other User Content | Emails or Text Messages | Apple's text-message type describes email and messages with subject lines and senders. It's the owner's call, and the conservative choice would also be honest |
| Say in What's New that the report exists | Leave it to the policy | Someone updating should hear about a new thing the app sends |

## 6. Verification

- [ ] The owner reads these, and says they're right.
- [ ] The owner sets them in App Store Connect.
- [x] The labels and the policy still agree with what the two-phone check found about email: "Empty, no addresses", so no email row.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), F4
- [Stage E of Phase 1](2026-11-01-phase1-stage-e.md): the 1.4 listing these change
- [E2's record](2026-11-06-phase2-e2-privacy-policy.md), [E3's record](2026-11-06-phase2-e3-review-partners.md)
