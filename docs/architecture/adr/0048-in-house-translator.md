---
id: ADR-0048
title: An in-house translator over i18next, for English and Turkish
status: accepted
date: 2026-10-30
owner: Mert Efe Şensoy
related: [IMPL-2026-10-30-phase1-d1-classic, IMPL-2026-10-30-phase1-stage-d, SRS]
---

# ADR-0048: An in-house translator over i18next, for English and Turkish

> **Status note:** accepted by the owner on 2026-10-30 ("Replace i18next"), before TestFlight build 48. Built in Phase 1 D1 ([D1 record §3.5 and §4.1](../../implementations/2026-10-30-phase1-d1-classic.md)).

## Context

FR-SET-005 and NFR-I18N-001 need the app in English and Turkish, with every string externalised, plurals and `tr-TR` casing. The Phase 1 plan named `expo-localization` with `i18next`, and D1 built on it. D1 then measured the iOS bytecode at 4,079,756 B: +160,940 B over its base, 5.80 % over NFR-PERF-002's limit. `i18next` was the largest single source of that growth (83,852 of 236,805 source characters, 35 %). The app uses a small fraction of it: dotted keys, `{{name}}` interpolation, and one/other plurals with a zero form, in two bundled languages. The language is fixed per process, because iOS relaunches an app when its language changes.

## Decision

1. **A translator of our own** (`src/i18n/index.ts`, about 100 lines) with i18next's contract for what the app uses:
   - `t(key, options)` resolves a dotted key in the device language, then in English, and returns the key itself if both lack it.
   - It picks a plural suffix with `Intl.PluralRules` (`_zero` first when the count is 0), falling back to English's rule if `Intl` is missing.
   - It interpolates `{{name}}`.
2. **The resources and the keys are unchanged** (`en.json`, `tr.json`), and so is every call site.
3. **`expo-localization` stays** for the device language. `upper()` keeps `toLocaleUpperCase('tr-TR')`.

## Consequences

**Positive**
- The bytecode falls by 53,348 B (4,079,756 → 4,026,408). D1 is still 4.41 % over NFR-PERF-002's limit, which E3 revisits.
- No dependency to keep current, and nothing in the translator subscribes or renders: calling `t` in render stays pure.

**Negative**
- Features beyond the contract (nesting, context, namespaces, formatting) aren't there; each would be added deliberately.
- One more module to test: `src/i18n/__tests__/i18n.test.ts` pins parity, placeholders, plurals (with and without `Intl`), missing keys and casing.

## Alternatives considered

- **Keep `i18next`.** Rejected by the owner for its weight against the bytecode limit.
- **Ship the art as PNG assets as well** (about 70 K more out of the bytecode). Not chosen now: the welcome's scaled layers would lose their vector crispness. E3 may revisit it.

## Links

- [D1 record](../../implementations/2026-10-30-phase1-d1-classic.md) §3.5, §4.1 · [Stage D plan](../../implementations/2026-10-30-phase1-stage-d.md) §3.4

## Backlinks
<!-- backlinks:start -->
- ["Phase 1 D1: Classic rebuilt in the Sticker Diary design, with the v1.4 welcome screen"](../../implementations/2026-10-30-phase1-d1-classic.md)
- ["Phase 1 Stage D (D1–D4): the screens in the Sticker Diary design, plan"](../../implementations/2026-10-30-phase1-stage-d.md)
- ["Phase 1 D3: every string in English and Turkish, a raw-text check, and the in-app language choice"](../../implementations/2026-11-01-phase1-d3-en-tr.md)
- [Requirements traceability (generated)](../../testing/TRACEABILITY.md)
<!-- backlinks:end -->
