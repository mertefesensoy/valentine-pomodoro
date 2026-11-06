import { lazy, Suspense } from 'react';

// `/partner`: your partner's day (Phase 2 D2). Only ever a lazy import, as `/pair` is, and a lint rule holds this to
// that: a solo launch evaluates none of it (ADR-0049).
const PartnerScreen = lazy(() => import('../src/screens/partner/PartnerScreen'));

export default function PartnerRoute() {
  return (
    <Suspense fallback={null}>
      <PartnerScreen />
    </Suspense>
  );
}
