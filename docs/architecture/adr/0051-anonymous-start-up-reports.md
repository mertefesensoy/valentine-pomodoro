---
id: ADR-0051
title: Anonymous start-up reports from every install, with two random groups
status: accepted
date: 2026-11-05
owner: Mert Efe Şensoy
related: [ADR-0049, ADR-0050, ADR-0021, IMPL-2026-11-05-phase2-plan, IMPL-2026-11-05-phase2-a0-a1-baselines-budget, SRS]
---

# ADR-0051: Anonymous start-up reports from every install, with two random groups

> **Status note:** accepted by the owner on 2026-11-05. It changes [ADR-0049](0049-account-only-at-pairing.md)'s first decision for one narrow case, and replaces the rule that a solo user never contacts Supabase.

## Context

[NFR-PERF-001](../../srs/SRS.md#nfr-perf-001) (cold start within 1.0 s) has never had a baseline. The plan asked the owner to time 12 launches by hand from a hidden panel. The owner's answer:

> "We should start collecting that data properly from the users and create user groups that will have different versions for this experiment to produce real valuable information. Manually testing this on a single device is a waste of time and a burden"

The owner was then asked, with each option's cost stated, and chose:

- **"Build it for everyone in 1.5.0"**, over App Store Connect's launch metrics with collection planned for 1.6.0, and over paired users only.
- **"On by default, off switch (Recommended)"**, over opt-in, with this wording: the rule becomes that a solo user has no account and makes exactly one request, this anonymous report, with a test proving that.
- **"Half and half (Recommended)"**, comparing the two start-up orders Phase 1 built and never recorded.

## Decision

1. **After each clean cold start, an install sends one report** to Supabase: its group, its time to interactive bucketed to 10 ms, the iPhone model, the iOS version and the app build. **Nothing else.** No identifier of any kind, no account, no timestamp finer than the day, nothing a person wrote.
2. **A Settings switch turns it off,** on by default. With it off, the app sends nothing at all.
3. **Two groups, half and half, assigned at random once per install:** `deferred` (start-up work waits for the first frame, as 1.4 ships) and `eager` (the order before B7). The hidden panel's choice still overrides this on the owner's own phone.
4. **The report goes through one database function** the unauthenticated role may call, `report_startup`, which checks its inputs. Nobody can read the table with the publishable key. Rows are deleted after 90 days ([NFR-PRIV-001](../../srs/SRS.md#nfr-priv-001)).
5. **A solo user still has no account.** The rule, as the owner approved it: a solo user has no account and makes exactly one request, this anonymous report, with a test proving that. The test lists the request and asserts the auth client is never created.

## Consequences

**Positive**
- Real launch times by version and iPhone, with no hand-timing and no extra SDK beyond `expo-device` for the model.
- A real comparison of the two start-up orders, on real phones.
- 1.5.0's own TestFlight builds give NFR-PERF-001 its first numbers.

**Negative**
- **The app's privacy position changes.** Until now a solo user sent nothing. App Privacy gains Diagnostics › Performance Data, not linked to you, and the policy must name it. Supabase sees the phone's IP address in transit.
- **The legal read widens.** §0.2's qualified reader is asked about this too, including whether KVKK treats it as anonymous.
- **Half of installs use the older start-up order** for all of 1.5.0, probably a slightly slower launch for them. There's no remote switch, so ending the test takes a new version.
- **Anyone holding the publishable key can write junk rows.** There's no identity to rate-limit on, by design, so input checks and retention limit the damage, and results have to be read knowing this.
- **It can't measure 1.4.1,** which shipped without it, so there's still no before-1.5.0 baseline.
- **Reports aren't independent:** with no identifier, a phone that launches often counts often, and that can't be corrected for. See the plan's §4.

## Alternatives considered

- **App Store Connect's launch metrics, and our own collection in 1.6.0.** No app change and no privacy change. Declined by the owner. Apple's metrics stay available as a cross-check.
- **Paired users only.** Keeps the old rule, but there'd be no data until people pair, and then little about the solo majority.
- **Opt-in.** Few people say yes, so the sample might say nothing, which is what the owner rejected hand-timing for.
- **A per-install random ID,** to correct for frequent launchers. It would make the data pseudonymous, and undo the argument that no consent prompt is needed.

## Links

- [Phase 2 plan §0.3](../../implementations/2026-11-05-phase2-plan.md#03-changed-while-building-2026-11-05), tasks B4 and C4
- [A1's record §3.3](../../implementations/2026-11-05-phase2-a0-a1-baselines-budget.md)
- [B7's record](../../implementations/2026-10-30-phase1-b7-deferred-startup.md): the two orders, and the statistics
