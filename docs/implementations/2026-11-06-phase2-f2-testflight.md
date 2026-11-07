---
id: IMPL-2026-11-06-phase2-f2-testflight
title: "Phase 2 F2: the first TestFlight build, and the check on two phones"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-06-phase2-f1-flag-on, IMPL-2026-11-06-phase2-e3-review-partners, RELEASE]
---

# 2026-11-06 — Phase 2 F2: the first TestFlight build, and the check on two phones

**Status:** Build 64 is in TestFlight and tagged, and the owner has checked it on two phones and approved it for shipping. §3 sets their words beside what the server counted, including the checks it has no record of.
**Branch:** `feat/phase2-f2-testflight`, then `docs/phase2-f3-measures` for build 64's results.
**Plan task:** [Phase 2 plan §3, F2](2026-11-05-phase2-plan.md#stage-f-verify-and-ship): TestFlight, tagged `v1.5.0-tf.<n>`, after the owner's go-ahead, then the device check on two phones, installed over the App Store's 1.4.x.

---

## 1. Problem / Motivation

1.5.0 has never run on a phone. Sign in with Apple, pairing, deleting an account and every sheet's real size can only be shown there, and the plan's §6 exit criteria need two real phones with two Apple IDs.

## 2. What Changed

| File | Change |
|------|--------|
| This record | The build, its tag, and what the phones showed. |

## 3. Implementation Approach

**The build.** From `master` at `3b7a2e1`, with the owner's "Build, submit and tag (Recommended)": EAS build `488a7c91-fbe7-4a32-ac7e-77f1195757c9`, number 63, a 21,966,065 B IPA. Submission `e2108e99-a10e-4daf-a5d6-05f58fb6cf6c` uploaded it to App Store Connect, and the tag is `v1.5.0-tf.63`.

**Signing needed the owner at their computer.** Sign in with Apple is a new capability, and the profile EAS held was made before it, so the build was run interactively. EAS logged in to the owner's Apple account, synced the capability and renewed the profile. The owner typed their own credentials in the Terminal, and they were on Remote Control at first, so the build waited a few hours. **The next new capability will need the same:** run it interactively, and ask while the owner is at the computer.

**The check.** A private page holds every check the plan and D1 to E3's records set aside, in the order that works, with a mark, a note and screenshots for each: https://claude.ai/artifact/JJUti4bomJLsZ9JPBWDBoA. Its marks are in the `checks` collection, and they're read back from there. The owner has three iPhones and an iPad: Phones A and B need different Apple IDs, since each makes its own account, and the third is the clean install for App Review's path. The screenshots are for the finish reviews on captures, which D1 to D5 held for this build.

**Build 63 showed a blank pairing sheet** on the owner's two phones, so the check started again from the top ([its record](2026-11-07-phase2-pair-sheet-blank.md)).

**Build 64.** From `master` at `16aaed7`, with the blank-sheet fix and the [paper plane](2026-11-07-phase2-pair-plane.md), and the owner's "Build, upload and tag (Recommended)". EAS build `8624b088-bde1-489a-aa51-30f5344692f3`, number 64, non-interactive, since the profile was already renewed. Submission `d5456e9f-e7e0-409a-8357-3b821171407c`, and the tag is `v1.5.0-tf.64`.

**What the owner said, in their words:**

- Asked whether the check was "on two physical iPhones with different Apple IDs, both on build 64, where they paired by code, each saw the other's day update after a focus, and a note arrived once": **"Yes, all of that"**.
- On marking 47 checks as working between 16:45 and 16:57 UTC: "I had time to do them. Once i was done i approved all at once so it is legitimate".
- On the Email column: "I do not see the email names", then "Empty, no addresses".
- On deleting an account: "When i deleted my account i recieved a notification from apple that it actually did".
- Offered all of the last section or only its SQL and the Email note, about screenshots: "Only SQL and Email now", and on the screenshots item, "All is good so i approve".
- Asked to do the download and App Review's path: "I only did the download my data and tested the pairing sytem other things are look good for shipping".

**What the server counted.** `extensions.pg_stat_statements` counts every call since the project began, and it can be trusted here: `report_startup` read 13 when the table held 12 rows and one launch had happened since, and `export_my_data` went from nothing to 1 once the owner ran it. Set beside the marks:

| Checks | What they need on the server | Counted, at 18:12 UTC |
|--------|------------------------------|-----------------------|
| `p-wrong`, `p-who`, `p-morph`: a wrong code, who it is, pairing | 3 `preview_invite`, 1 `redeem_invite` | 3 and 1, which is exactly these |
| `d-strip`, `d-sheet`: their day | `report_day`, `home_snapshot` | 5 and 163 |
| `n-arrive`: a note, once | 1 `send_note`, then `mark_note_shown` | 1 and 3 |
| `a-unpair` | 1 `unpair` | 1 |
| `a-download` | 1 `export_my_data` | 0 at 17:08, and 1 after the owner ran it for this question |
| `a-again`: pair again | A second `redeem_invite` | **No record** |
| `r-pair`, `r-note`: App Review's path | Another `redeem_invite` | **No record** |
| `n-killed`, `n-off`: a note with the app killed, and with notes off | 2 more `send_note` | **No record** |

**So the four checks marked "No record" stand as the owner's marks, not as proven.** The two-phone check itself, the download and unpairing are backed by the counts. App Review's path matters most of the four: it's what the review notes hand to Apple, so the plan is for the owner to try one code on a phone when seeding them for the submission (F5). The SQL behind it is proven by pgTAP in CI, and the app's side by the one real pairing. On build 64, only one phone has sent start-up reports (`iPhone17,3`). The other phone in the data, `iPhone14,7`, last reported on build 63. A launch sends a report only if it's clean and the switch is on, so this doesn't show which build it ran.

**No screenshots reached the page,** so the finish reviews on captures that D1 to D5 held for this build didn't run. The owner chose that and approved from the phones, in the words above, so those records' boxes for captures stay open and point here.

**After the release.** The 1.4.2 session handed over two checks that need a version newer than 1.4.2, on a phone still on it. They're the page's last section.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Build interactively. The owner: "Wait, I'll sign in at my computer (Recommended)" | Trying without the sign-in | It would very likely have failed at signing after 10 minutes or more, and cost a build |
| A page with marks and screenshots | A list in chat | 40-odd checks over two phones, done over time, and reviews that need the screenshots |
| Check the marks against the server's counters | Taking the marks alone | The goal asks for the owner's words and for failures to be reported as failures. The counters found the download unrun, which then ran, and the checks in §3 |
| Ship with those four checks as marks, and captures unreviewed. The owner: "other things are look good for shipping" | Holding the submission for them | The owner's call, on the evidence above |

## 6. Verification

- [x] The build finished, and EAS reports the upload to App Store Connect. Apple's processing comes after that, so whether it's installable is for the owner to see.
- [x] The tag `v1.5.0-tf.63` is pushed.
- [x] Build 64 finished, EAS reports the upload, and the tag `v1.5.0-tf.64` is pushed.
- [x] The owner's marks are read back: 52 marks, none a problem, and 2 waiting for the release (the page's section 9).
- [x] The server's counters are set beside them, in §3.
- [ ] The finish reviews for D1 to D5 on screenshots. **Not run: the owner chose to go without them,** in §3's words.
- [ ] App Review's path on a phone, at F5, when the codes are seeded.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), F2 and §6
- [F1's record](2026-11-06-phase2-f1-flag-on.md), [E3's record](2026-11-06-phase2-e3-review-partners.md)
- [RELEASE.md](../process/RELEASE.md)
