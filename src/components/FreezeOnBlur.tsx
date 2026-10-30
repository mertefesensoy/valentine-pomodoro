import type { ReactNode } from 'react';
import { useIsFocused } from 'expo-router';
import { Freeze } from 'react-freeze';

/**
 * Freezes a tab's screen while its route isn't focused (Phase 1 B6; B4 record
 * §3.5). Expo Router's native tabs have no freeze option of their own.
 *
 * Frozen is react-freeze's `Freeze`, as React Navigation's `freezeOnBlur`
 * used before B6: a Suspense boundary whose child throws a pending promise.
 * - React doesn't render the screen while frozen, and hides what it had
 *   committed. The screen stays mounted: its store subscriptions and
 *   completion handlers keep running, and state it receives renders when it
 *   is shown again.
 * - A screen that is frozen from its first render (a tab not focused at
 *   launch) isn't rendered at all until first shown. The native tabs mount
 *   every tab at launch; this keeps the tabs lazy.
 * - This component sits outside its own Freeze, so its focus state commits.
 *
 * Must be rendered inside a route: useIsFocused throws outside a navigator.
 */
export function FreezeOnBlur({ children }: { children: ReactNode }) {
    const focused = useIsFocused();
    return <Freeze freeze={!focused}>{children}</Freeze>;
}
