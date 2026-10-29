---
id: ADR-0025
title: A couple subscription (Plus) plus capped free-tier ads
status: accepted
date: 2026-10-29
owner: Mert Efe Şensoy
related: [ADR-0021, ADR-0026, ADR-0034]
---

# ADR-0025: A couple subscription (Plus) plus capped free-tier ads

## Context

v1 earns only from AdMob interstitials, at most one every 2 sessions and 120 s (`AdPolicy.ts`). On Android it earns nothing, because the app and interstitial ids are Google's public test ids and the banner id is a placeholder (finding F3). The public product must pay for itself (`PRODUCT.md`).

## Decision

The owner's decision on 2026-10-29 (rehaul plan §0): a **couple subscription, "Plus"**, where one purchase covers both partners, **plus capped ads on the free tier**.

| Free | Plus |
|------|------|
| Classic and Shared Garden; pairing, shared room, presence, cheers and partner love notes; 2 themes; 7-day stats; capped ads | Adds Fly Together (illustrated and real map), Study-date Room and Shared Pet; all themes; full history; widgets; no ads |

The plan's mechanism (§4.6; Phase 5; not built):
- **Purchase flow.** RevenueCat, then a webhook, then an Edge Function upserts the *buyer's* `entitlements` row, and a trigger recomputes `couples.plus_until`.
- **Unpairing.** The buyer keeps Plus.

**The ad rule (§8.7).** An interstitial follows a completed session only if all six hold:

$$n_{\text{since}} \ge 2 \wedge (\text{now} - t_{\text{last}}) \ge 120\text{ s} \wedge \neg\text{plus} \wedge \text{native} \wedge \neg\text{sharedSessionRunning} \wedge \text{consentResolved}$$

The first two terms are today's `AdPolicy`.

## Consequences

**Positive**
- "The couple is the customer": one entitlement across the App Store, Play and the web (`PRODUCT.md`).
- Ads stay out of focus. They never appear during a shared session, on the web, or for Plus couples.

**Negative**
- Fly Mode, free on iOS today, becomes a Plus mode.
- Google UMP consent, real Android ad ids and the AdMob 17 migration all land in Phase 5 ([ADR-0034](0034-admob-held-on-16.md)).
- **TBD (owner, Phase 5):** the pricing, after a competitor check, and the store rules on in-app purchase and links out to web purchase, checked then (§4.6).

## Alternatives considered

- None is recorded for the revenue model. It was the owner's choice (§0).

## Links

- [Rehaul plan §0](../../implementations/2026-10-29-couples-rehaul-plan.md#0-decisions-you-made-2026-10-29) · [§1.2, finding F3](../../implementations/2026-10-29-couples-rehaul-plan.md#12-what-is-wrong-with-it) · [§3.4](../../implementations/2026-10-29-couples-rehaul-plan.md#34-free-vs-plus) · [§4.6](../../implementations/2026-10-29-couples-rehaul-plan.md#46-monetization-architecture) · [§8.7](../../implementations/2026-10-29-couples-rehaul-plan.md#87-ad-frequency-rule-free-tier)
- [`PRODUCT.md`, product purpose](../../../PRODUCT.md#product-purpose) · [positioning](../../../PRODUCT.md#positioning)

## Backlinks
<!-- backlinks:start -->
- [An illustrated map for everyone; the real map as a phone-only Plus extra](0026-illustrated-map-real-map-plus.md)
- [Hold react-native-google-mobile-ads on v16 until Phase 5](0034-admob-held-on-16.md)
- [Architecture decision records](README.md)
<!-- backlinks:end -->
