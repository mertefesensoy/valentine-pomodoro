---
id: IMPL-2026-11-05-phase2-c1-client
title: "Phase 2 C1: the small Supabase client, and Sign in with Apple"
status: done
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-b3-functions, ADR-0049, ADR-0050, SRS]
---

# 2026-11-05 — Phase 2 C1: the small Supabase client, and Sign in with Apple

**Status:** Done, apart from the sign-in check on a real iPhone at D1. The record was written before the code.
**Branch:** `feat/phase2-c1-client`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, C1](2026-11-05-phase2-plan.md#stage-c-the-clients-data-layer-needs-b). [ADR-0050](../architecture/adr/0050-small-client-and-no-sentry.md) replaces `supabase-js` with this.

---

## 1. Problem / Motivation

Pairing needs a signed-in person and calls to the database functions. `supabase-js` would cost 524,572 B, so the owner chose a small client written here. Its cost is that token refresh, which `supabase-js` would have carried, is now this repo's to get right. A mistake there either signs people out or, worse, loses their session silently.

Requirements: [FR-ACC-001](../srs/SRS.md#fr-acc-001), [FR-ACC-002](../srs/SRS.md#fr-acc-002), [NFR-SEC-002](../srs/SRS.md#nfr-sec-002), [NFR-PRIV-001](../srs/SRS.md#nfr-priv-001).

## 2. What Changed

| File | Change |
|------|--------|
| `src/server/account.ts` | New: one light flag saying this install has an account. It imports no SDK. |
| `src/server/client.ts` | New: the session, sign-in, refresh, `rpc` and `invoke`. |
| `src/server/appleSignIn.ts` | New: asks Apple, with a nonce, for sign-in or for a code to confirm a deletion. |
| `src/server/__tests__/client.test.ts` | New: the refresh rules, the Keychain, and failures. |
| `src/server/__tests__/appleSignIn.test.ts` | New: the nonce, the name, and a cancel. |
| `app.json` | The `expo-secure-store` plugin, with no Face ID purpose string, since nothing uses it. |
| `package.json` | `expo-apple-authentication`, `expo-secure-store` and `expo-crypto`, at the SDK's versions. |

## 3. Implementation Approach

**A solo launch can't reach it.** `src/server/account.ts` reads one plain flag, `account_v1`. Nothing imports `client.ts` statically: the pairing screens and the paired provider reach it through `import()`, so for a solo user the module is never evaluated and the Keychain is never read. C2 adds the test over a real launch.

**The session** is kept in the iOS Keychain, in four separate items: the access token, the refresh token, the expiry and the user id, with `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`. Separate items because `expo-secure-store` warns over 2,048 bytes and an access token can come close by itself. Device-only because a restored backup on a new phone shouldn't bring a session with it.

**Reinstalling.** The Keychain outlives an app's deletion and MMKV doesn't, so after a reinstall the flag is gone and the app is solo. Pairing again signs in with Apple, replaces whatever is in the Keychain, and `home_snapshot` shows the couple is still there.

**`signInWithIdToken({ identityToken, rawNonce })`** posts to `/auth/v1/token?grant_type=id_token`, saves the session and sets the flag.

**`rpc<T>(name, args)` and `invoke<T>(fn, body)`** send the publishable key on `apikey` and the user's token on `Authorization`. An empty body (a `void` function) resolves to `null`.

**The rules for a token,** which ADR-0050 says this repo now owns:

| Situation | What happens |
|---|---|
| Under 60 s of life left, or already expired | Refresh first |
| Several calls need a refresh at once | One refresh; all of them wait for it. Supabase rotates refresh tokens and treats a reused one as theft outside a short window |
| A refresh succeeds | The new tokens are saved to the Keychain before anyone receives them |
| A call gets a 401 | One forced refresh (unless another call has already replaced that token), one retry, then `SessionEnded` |
| A refresh is refused (400, 401 or 403) | The session is cleared, and `SessionEnded` is thrown: the person signs in again |
| The network fails, or the server answers 5xx or 429 | `Offline` or `ServerError`. **The session stays,** so a bad connection can't sign anyone out |

`SessionEnded` leaves `account_v1` set, since the account still exists, so the UI (D2) can offer signing in again instead of pretending to be solo.

**A crash between the server's rotation and the Keychain's save** would leave the old refresh token, which works only inside Supabase's reuse window. Past it, the result is `SessionEnded`: one tap on Apple's button, and nothing is lost on the server.

**`appleSignIn.ts`:**

- `requestSignIn()` draws a random nonce (`expo-crypto`), gives Apple its SHA-256, and returns the identity token, the raw nonce and the first name. Supabase hashes the raw nonce and compares it. It asks for `FULL_NAME` only, and not the email (NFR-PRIV-001). **If Supabase refuses a sign-in with no email, the owner hears before this changes.**
- `requestDeletionCode()` asks Apple again with no scopes, which is the confirmation plan B3 calls for, and returns the fresh authorization code.
- A cancel comes back as `null`, never as an error.
- The first name, not the full name, is what's saved: it's what a partner would call you, and it fits the strip. Apple sends it only on the first sign-in, so D1 saves it straight away through `set_profile`.

## 4. Mathematical / Statistical Details

**When a token counts as expired:** now ≥ expires_at − 60 s, with `expires_at` in seconds since the epoch, as Supabase returns it. The margin covers the call's own time and a phone's clock being slightly off.

**The nonce:** 128 random bits as a UUID. Apple receives SHA-256(raw); Supabase receives raw, and checks SHA-256(raw) against the token's claim, so a token captured elsewhere can't be replayed here.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Four Keychain items | One JSON blob; an encryption key in the Keychain and the blob in MMKV | A blob can pass the 2,048-byte warning, and a second layer of crypto adds nothing here. A partial write is harmless: a missing item reads as no session |
| Stay signed in through network failures | Clear on any refresh failure | People are often offline in a library. Only a real refusal ends a session |
| No sign-out function | Offer one | The owner: "No sign out in 1.5.0". `clearSession` exists for after a deletion |
| The first name only | The full name | Data minimisation, and it's what a partner calls you. The person can change it in Settings |
| No Face ID string from the plugin | The plugin's default | Nothing uses Face ID, and DEF-009 showed that App Review reads what the app declares |

## 6. Verification

- [x] `npx jest src/server` passes: 35 tests.
- [x] `npx tsc --noEmit`, ESLint on `src/server` and `node scripts/docs/check-docs.mjs` pass. CI runs the full suite on the pull request.
- [ ] **On the real project, with a real iPhone, at D1:** a sign-in with no email scope works, and the header shape holds.

## 7. Related Docs

- [ADR-0050](../architecture/adr/0050-small-client-and-no-sentry.md), [ADR-0049](../architecture/adr/0049-account-only-at-pairing.md)
- [Phase 2 plan](2026-11-05-phase2-plan.md), C1
- [B3's record](2026-11-05-phase2-b3-functions.md)
