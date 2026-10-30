import { useEffect } from 'react';

import { LoveNoteSheet } from '../src/components/loveNote/LoveNoteSheet';
import { useLoveNoteSheet } from '../src/stores/loveNoteSheetStore';

// `/love-note`: the love note as a native form sheet (Phase 1 D1), presented by the Timer screen
// over the tabs. However it closes (a swipe or Close), unmounting reports it, so the Timer screen
// marks the note seen and the interstitial can follow (FR-ADS-001).
export default function LoveNoteRoute() {
  useEffect(() => () => useLoveNoteSheet.getState().close(), []);
  return <LoveNoteSheet />;
}
