---
id: IMPL-2026-11-05-phase2-a0-a1-baselines-budget
title: "Phase 2 A0 and A1: the baselines on 1.4.1, and the size budget for 1.5.0"
status: in-progress
date: 2026-11-05
owner: Mert Efe Şensoy
related: [IMPL-2026-11-05-phase2-plan, IMPL-2026-11-01-phase1-stage-e, ADR-0021, ADR-0029, ADR-0049, SRS]
---

# 2026-11-05 — Phase 2 A0 and A1: the baselines on 1.4.1, and the size budget for 1.5.0

**Status:** In progress. The measurements are done. The decisions in §3.3 and §3.4 are the owner's, and are recorded here when made.
**Branch:** `docs/phase2-a0-a1-baselines-budget`, one pull request into `master`. A1's measuring happened in a throwaway worktree, `C:\vp\v150-a1`, which is never merged.
**Plan tasks:** [Phase 2 plan §3, A0 and A1](2026-11-05-phase2-plan.md#stage-a-baselines-budget-and-design-no-backend). They share a record because A0's bytecode is A1's base row.

---

## 1. Problem / Motivation

Phase 2 adds three or four SDKs to an app with a size limit. [NFR-PERF-002](../srs/SRS.md#nfr-perf-002)'s ceiling is what 1.4.0 shipped, 4,292,868 B, and Hermes ships one bytecode bundle, so a lazy import doesn't shrink it (Phase 1 plan, Finding 1). The plan meets that head-on: measure each SDK alone, bring the numbers and one recommendation to the owner, and let the owner set the new ceiling before any SDK merges.

A0 records what the app measures today, so later growth can be read against it.

## 2. What Changed

| File | Change |
|------|--------|
| `docs/implementations/2026-11-05-phase2-a0-a1-baselines-budget.md` | This record: the measurements and the owner's decisions. |
| `docs/srs/SRS.md` | NFR-PERF-001's baseline and NFR-PERF-002's new ceiling, once the owner decides. |

No app code changes. Nothing in `package.json` changes in this task.

## 3. Implementation Approach

### 3.1 A0: the baselines on `master` (the code of 1.4.1)

**Bytecode,** with `npx expo export --platform ios --dump-sourcemap`, source `8cc8472`: **iOS 4,292,796 B,** exactly the figure the SRS records for 1.4.1. The ceiling is 72 B above it. The pinned command also names `--platform android`; that doesn't change the iOS file, and Android isn't in this phase.

**Reassure,** with `npx reassure`, three runs, the counts identical across runs. It ran in the throwaway worktree, whose `src/` is `master`'s; the extra packages installed there aren't imported, so they can't change a render count.

| Scenario, a 10 s running session | Renders | At E3 (2026-11-02) |
|---|---|---|
| settings-only consumer | 1 | 1 |
| Stats screen | 1 | 1 |
| Settings screen | 1 | 1 |
| Notes screen | 1 | 1 |
| Timer screen (Classic) | 13 | 13 |
| `TimerText`-sized leaf | 12 | 12 |

**Cold start:** not measured. See §3.3.

### 3.2 A1: what each SDK costs

**The method.** A probe module, imported from `index.tsx`, imports each SDK and references the API the app would really use, so Metro bundles it and the minifier can't drop it. An SDK that is only installed costs 0 B and proves nothing. Every figure comes from one worktree, with the same command, against the same base. Versions: `@supabase/supabase-js` 2.119.0, `@tanstack/react-query` 5.106.1, `@sentry/react-native` 8.28.0, `expo-apple-authentication` 58.0.2, `expo-secure-store` 58.0.2.

**Each alone,** against the base of 4,292,796 B:

| What | Bytecode | Cost | % of base |
|---|---|---:|---:|
| `expo-apple-authentication` | 4,300,168 B | +7,372 B | 0.17 % |
| `expo-secure-store` | 4,298,220 B | +5,424 B | 0.13 % |
| `@tanstack/react-query` | 4,401,112 B | +108,316 B | 2.52 % |
| `@tanstack/react-query` with its persister | 4,419,536 B | +126,740 B | 2.95 % |
| `@supabase/supabase-js` | 4,817,368 B | +524,572 B | 12.22 % |
| `@supabase/supabase-js` with `react-native-url-polyfill` | 4,848,396 B | +555,600 B | 12.94 % |
| its part `@supabase/auth-js` | 4,574,612 B | +281,816 B | 6.56 % |
| its part `@supabase/postgrest-js` | 4,319,456 B | +26,660 B | 0.62 % |
| `react-native-url-polyfill` alone | 4,324,028 B | +31,232 B | 0.73 % |
| A small client written here, on `fetch` (a probe of about 40 lines) | 4,297,640 B | +4,844 B | 0.11 % |
| `@sentry/react-native` | 5,951,308 B | **+1,658,512 B** | **38.63 %** |
| its core alone, `@sentry/core` | 5,037,052 B | +744,256 B | 17.34 % |

**Together:**

| Stack | Bytecode | Cost | % of base |
|---|---|---:|---:|
| The plan's whole list: `supabase-js` and the polyfill, Query and persister, Sentry, Apple, Keychain | 6,646,280 B | +2,353,484 B | 54.82 % |
| The same without Sentry | 4,986,708 B | +693,912 B | 16.16 % |
| The same without Sentry or the polyfill | 4,955,956 B | +663,160 B | 15.45 % |
| **Lean:** a small client, Query and persister, Apple, Keychain | 4,436,428 B | +143,632 B | 3.35 % |
| **Leanest:** a small client, Apple, Keychain | 4,309,928 B | +17,132 B | 0.40 % |

**The trim is not worth doing.** Stage E named moving the tour's art into a data asset as the trim. Emptying all 44 modules on the throwaway worktree measures 4,270,372 B, **−22,424 B or 0.52 %**, and that's before a loader's own bytes. It fits: the 44 modules hold 25,248 B of path text in 114 paths. The 147,780 B the tour added at D5 was mostly its code, not its art.

**What the numbers say:**

- **Sentry is by far the largest cost,** and there's no lighter Sentry to fall back on: its core alone is 744 KB. It is also the one SDK that runs for a solo user, starting at launch and sending to a server, while the plan makes every solo promise "beyond crash reports".
- **Most of `supabase-js` is auth.** The app's whole server surface in this phase is a few auth calls and POSTs to RPCs and one Edge Function (plan B3). PostgREST's own client is small, and `realtime-js` and `storage-js` are unused until Phase 3.
- **The URL polyfill looks unnecessary.** Expo's runtime installs `URL` and `URLSearchParams` (`expo/src/winter/runtime.native.ts`), and Supabase's guide predates that. A real sign-in on a device has to prove it, because a successful export doesn't.
- **TanStack Query earns its 127 KB,** because C3's offline queue and the persisted cache would otherwise be written here, and Phase 3 needs it anyway (ADR-0029).
- **Apple and the Keychain are nearly free.**

**What a stack costs a solo user.** Bytecode is memory-mapped, and a module isn't evaluated until it's first required. So an SDK behind a lazy `require`, which a solo user never reaches, costs them download size and little at launch. Sentry is different: it has to start at launch to catch anything. This is reasoning from how Hermes works, not a measurement, and §3.3 explains why there's no cold-start number to check it against yet.

### 3.3 The cold-start baseline: what the owner said

The plan asked for 12 or more cold starts by hand from the hidden panel. The owner, 2026-11-05:

> "We should start collecting that data properly from the users and create user groups that will have different versions for this experiment to produce real valuable information. Manually testing this on a single device is a waste of time and a burden"

That collides with §0.1 of the plan ("A solo user never touches the server"), its §6 exit criterion ("A solo install never contacts Supabase") and the default that there is no `events` table yet, so it needs the owner's decision rather than a guess. What's checked so far:

- **No collection in the app can measure 1.4.1,** which has already shipped without it, so none of these options produces a baseline before A1's decision.
- **App Store Connect already holds launch times from real users,** by version and device, through its [Power and Performance metrics](https://developer.apple.com/documentation/appstoreconnectapi/power-and-performance-metrics-and-logs). It needs no SDK and no network call from the app. Apple doesn't publish the usage threshold; below it, the data reads "insufficient usage". Whether this app clears it isn't known yet.
- **The App Store can't run code groups.** Phased release and Product Page Optimization don't split a version's code. Groups need a choice made inside the app and a place to report to.

**The owner's decision:** to be recorded here.

### 3.4 The ceiling: the recommendation and the decision

The plan's formula is 4,292,868 B + the kept costs − any trim. That leaves out 1.5.0's own screens, which aren't SDKs, so each option below adds **an allowance of 200,000 B** for them, from precedent: D2's three screens added about 62 KB, and D5's tour about 148 KB.

| Option | Ceiling | Over today's | What it costs |
|---|---|---:|---|
| **Lean (recommended)** | **4,640,000 B** | **+8.1 %** | About 150 lines of client written here, with token refresh to get right and test. `realtime-js` is added alone in 1.6.0. No crash reports with JavaScript stacks |
| `supabase-js`, no Sentry | 5,160,000 B | +20.2 % | Less auth code of our own; 12 % more bytecode. No crash reports with JavaScript stacks |
| The plan's whole list | 6,850,000 B | +59.6 % | Everything as planned, and crash reports with JavaScript stacks; a solo user's phone contacts Sentry |

**The recommendation is Lean.** Without Sentry, crash data comes from App Store Connect, and NFR-REL-001 (a crash-free rate) can be read from there if usage is high enough. What's lost is the JavaScript stack on a JS error. A solo user would then send nothing to anyone, which is a stronger position than the plan's.

**The owner's decision:** to be recorded here.

## 4. Mathematical / Statistical Details

**Cost.** For a stack S, cost(S) = bytes(base + S) − bytes(base), with both measured in one worktree by one command. Percentages are cost / 4,292,796.

**Costs don't quite add.** SDKs share dependencies, so the bundle holds each module once. The plan's whole list costs 2,353,484 B against a sum of parts of 2,353,648 B, 164 B less.

**The ceiling** = 4,292,868 + cost(kept) − trim + 200,000, rounded up to the next 10,000 B:

- Lean: 4,292,868 + 143,632 + 200,000 = 4,636,500, so 4,640,000 B.
- `supabase-js`, no Sentry: 4,292,868 + 663,160 + 200,000 = 5,156,028, so 5,160,000 B.
- The whole list: 4,292,868 + 2,353,484 + 200,000 = 6,846,352, so 6,850,000 B.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Measure in a throwaway worktree | A branch with the SDKs installed | Nothing here may ever merge, and the plan says no SDK merges before the owner decides |
| Probe modules that reference real APIs | Installing and exporting | Metro bundles what's reachable, so an unimported SDK measures 0 B |
| Add an allowance for 1.5.0's own code | The plan's formula alone | A ceiling that ignores the feature it's for would be broken by the first screen |
| Report the trim as not worth doing | Carry it forward as an option | At 0.52 %, moving the art would add a loader and a failure path for almost nothing |

## 6. Verification

- [x] The base measures 4,292,796 B, the figure the SRS already records for 1.4.1.
- [x] Reassure's counts are identical across 3 runs, and to E3's.
- [ ] The owner's decisions in §3.3 and §3.4 are quoted here, and the SRS is updated to match.
- [ ] `node scripts/docs/check-docs.mjs`: 0 errors.

## 7. Related Docs

- [Phase 2 plan](2026-11-05-phase2-plan.md): §0.2, A0, A1, §4 "The size budget"
- [Stage E §4](2026-11-01-phase1-stage-e.md): the earlier bytecode decision and the trim it named
- [ADR-0029](../architecture/adr/0029-zustand-and-tanstack-query.md), [ADR-0049](../architecture/adr/0049-account-only-at-pairing.md)
- [SRS](../srs/SRS.md): NFR-PERF-001, NFR-PERF-002, NFR-REL-001
