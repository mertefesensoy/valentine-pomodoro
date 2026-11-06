import { lazy, Suspense } from 'react';

// `/pair`: the pairing sheet (Phase 2 D1). Only ever a lazy import: its screen pulls in the client and
// TanStack Query, which a solo launch must never evaluate (ADR-0049), and a lint rule holds this to that.
const PairScreen = lazy(() => import('../src/screens/pair/PairScreen'));

export default function PairRoute() {
  return (
    <Suspense fallback={null}>
      <PairScreen />
    </Suspense>
  );
}
