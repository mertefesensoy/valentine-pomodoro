---
id: IMPL-2026-11-06-phase2-f2-testflight
title: "Phase 2 F2: the first TestFlight build, and the check on two phones"
status: in-progress
date: 2026-11-06
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-06-phase2-f1-flag-on, IMPL-2026-11-06-phase2-e3-review-partners, RELEASE]
---

# 2026-11-06 — Phase 2 F2: the first TestFlight build, and the check on two phones

**Status:** The build is running. The check on the phones is the owner's, next.
**Branch:** `feat/phase2-f2-testflight`, one pull request into `master`.
**Plan task:** [Phase 2 plan §3, F2](2026-11-05-phase2-plan.md#stage-f-verify-and-ship): TestFlight, tagged `v1.5.0-tf.<n>`, after the owner's go-ahead, then the device check on two phones, installed over the App Store's 1.4.x.

---

## 1. Problem / Motivation

1.5.0 has never run on a phone. Sign in with Apple, pairing, deleting an account and every sheet's real size can only be shown there, and the plan's §6 exit criteria need two real phones with two Apple IDs.

## 2. What Changed

| File | Change |
|------|--------|
| This record | The build, its tag, and what the phones showed. |

## 3. Implementation Approach

**The build.** From `master` at `3b7a2e1`, with the owner's "Build, submit and tag (Recommended)": EAS build `488a7c91-fbe7-4a32-ac7e-77f1195757c9`, number 63.

**Signing needed the owner at their computer.** Sign in with Apple is a new capability, and the profile EAS held was made before it, so the build was run interactively. EAS logged in to the owner's Apple account, synced the capability and renewed the profile. The owner typed their own credentials in the Terminal, and they were on Remote Control at first, so the build waited a few hours. **The next new capability will need the same:** run it interactively, and ask while the owner is at the computer.

**The check.** A private page holds every check the plan and D1 to E3's records set aside, in the order that works, with a mark, a note and screenshots for each: https://claude.ai/artifact/JJUti4bomJLsZ9JPBWDBoA. Its marks are in the `checks` collection, and they're read back from there. The owner has three iPhones and an iPad: Phones A and B need different Apple IDs, since each makes its own account, and the third is the clean install for App Review's path. The screenshots are for the finish reviews on captures, which D1 to D5 held for this build.

**After the release.** The 1.4.2 session handed over two checks that need a version newer than 1.4.2, on a phone still on it. They're the page's last section.

## 4. Mathematical / Statistical Details

None.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Build interactively. The owner: "Wait, I'll sign in at my computer (Recommended)" | Trying without the sign-in | It would very likely have failed at signing after 10 minutes or more, and cost a build |
| A page with marks and screenshots | A list in chat | 40-odd checks over two phones, done over time, and reviews that need the screenshots |

## 6. Verification

- [ ] The build finishes, and reaches TestFlight.
- [ ] The tag `v1.5.0-tf.<n>` is pushed.
- [ ] The owner's marks are read back, and whatever they find is fixed.
- [ ] The finish reviews for D1 to D5 run on the owner's screenshots.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md), F2 and §6
- [F1's record](2026-11-06-phase2-f1-flag-on.md), [E3's record](2026-11-06-phase2-e3-review-partners.md)
- [RELEASE.md](../process/RELEASE.md)
