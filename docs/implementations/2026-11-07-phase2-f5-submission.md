---
id: IMPL-2026-11-07-phase2-f5-submission
title: "Phase 2 F5: shipping 1.5.0 on Supabase's Free plan, the submission and the release"
status: done
date: 2026-11-07
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-06-phase2-e2-privacy-policy, IMPL-2026-11-06-phase2-f4-listing, IMPL-2026-11-06-phase2-f2-testflight, RELEASE, ADR-0021]
---

# 2026-11-07 — Phase 2 F5: shipping 1.5.0 on Supabase's Free plan, the submission and the release

**Status:** Released. App Review approved build 64, and 1.5.0 has been live on the App Store since 2026-11-10 at 13:22 UTC, in the US and Turkish stores alike.
**Branch:** `docs/phase2-f5-free-plan`, then a pull request for each later step.
**Plan task:** [Phase 2 plan §3, F5](2026-11-05-phase2-plan.md#stage-f-verify-and-ship), changed by [§0.4](2026-11-05-phase2-plan.md#04-changed-before-shipping-2026-11-07).

---

## 1. Problem / Motivation

The plan asked for Supabase Pro before 1.5.0 ships, from $25 a month, because Free projects can pause and have no backups. The owner declined: "it is too much to pay and i can't do it no way". So 1.5.0 ships on Free. What that costs had to be stated, and whatever said otherwise had to change: the privacy policy said backups hold deleted data for up to 7 days.

## 2. What Changed

| File | Change |
|------|--------|
| [Plan](2026-11-05-phase2-plan.md) | §0.2's row struck, §0.4 added with the owner's words and the costs, F5's first step changed |
| `privacy-policy.md`, and the website's `src/locales/` in its own repo | The sentence about backups removed, in both languages |
| [E2's record](2026-11-06-phase2-e2-privacy-policy.md) | Notes the removal |
| This record | The decision, and the submission's steps as they happen |

## 3. Implementation Approach

**What Free means, from Supabase's docs (read 2026-11-07):**

- **Backups:** "We automatically back up all Pro, Team, and Enterprise Plan projects on a daily basis", and Free projects are told to export their data with the CLI ([Backups](https://supabase.com/docs/guides/platform/backups)).
- **Pausing:** a project is paused for lacking sufficient user database activity over the past week, and a few user requests a day is typically enough. A warning comes roughly a week before, and a project can be restored for up to a year, with its data ([Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)).

**The plan's reason has changed since it was written.** When Pro went into the plan, a solo user made no requests at all. Since §0.3, every 1.5.0 launch with the switch on sends `report_startup`, so anyone using the app keeps the project active. The docs don't promise that's enough.

**The stretch that matters is between submitting and release.** 1.4.x never reaches Supabase, so the owner's phones are the only activity then, and a pause would stop the reviewer signing in. So the owner opens the app or the dashboard every couple of days until release. It's in step 1 of [the App Store Connect page](https://claude.ai/artifact/CUgvJiKC6sCadB3krQwfu2).

**If it pauses, from the code:**

| Who | What they see |
|-----|---------------|
| Solo | Nothing. The start-up report never throws, and it doesn't retry (`startupReport.ts`) |
| Paired, looking | The last known day: a failed refresh leaves the cached data (`home.ts`) |
| Paired, acting | An error on signing in, sending a note or unpairing, and deleting an account fails until the owner restores the project |

**Not known:** what a paused project answers on the wire isn't in the docs, so whether the app says "offline" or "something went wrong" hasn't been seen.

**No keep-alive script.** Real launches already count, and the docs neither allow nor forbid a scripted one. If nobody's using the app, a pause harms nobody.

**No backup job either.** A nightly dump in CI would put people's names and notes in a second place that the policy doesn't describe, and nobody asked for it. What's left is each person's Download my data, and the owner's own export if they want one.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Ship on Free. The owner: "Ship on Free (Recommended)" | Hold 1.5.0 until Pro is affordable, with no end date | The owner's call, with both costs stated in the question |
| Remove the sentence about backups, and add nothing. The owner: "Remove, push, merge (Recommended)" | A sentence saying there are no backups | A promise that there are none would become false if the owner ever exports their data, and it isn't something a reader needs in order to act on |

## 6. Verification

- [x] The sentence is gone from `privacy-policy.md` in both languages.
- [x] The website says the same, read back with a cache-busting parameter once its #4 was merged: no sentence about backups, and "Last updated: 7 November 2026".
- [x] The qualified read, decided by the owner: **waived for 1.5.0**, "Submitted without it", then for the release, "Waive it for 1.5.0". They were told that any legal risk from the policy's wording is theirs, and that a read can still change the page later with no new build.
- [x] The live version looked up while the owner was in App Store Connect, 2026-11-08: 1.4.2, so nothing was in review.
- [x] App Review's path tried once on a phone, when the codes were seeded. The owner: "Yes, it worked". The server's count wasn't read again afterwards.
- [x] The owner submitted: "I've submitted it", build "1.5.0 (64)". The tag `v1.5.0-submitted` is on `16aaed7`, as `v1.5.0-tf.64` is, with the owner's "Tag and push it (Recommended)".
- [x] The release, looked up with a cache-busting parameter: 1.5.0, released 2026-11-10T13:22:08Z. The owner: "1.5.0 is out and launched. Everything works as intended and i got the update prompt :)". The tag `v1.5.0` is on `16aaed7`, with the owner's "Tag and push it (Recommended)", and the GitHub Release follows this record's merge ("Publish it (Recommended)"). `remove_review_partners()`: the owner, "It's done".
- [x] Section 9 of the checklist, on a device kept on 1.4.2. The owner: "I'll set one up (Recommended)", then "i got the update prompt", which is `z-prompt`. `z-return`, the prompt on coming back after 6 hours, wasn't reported on its own; its tests pinned it in 1.4.2.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), §0.4 and F5
- [F4's record](2026-11-06-phase2-f4-listing.md), [F2's record](2026-11-06-phase2-f2-testflight.md)
- [RELEASE.md](../process/RELEASE.md)
