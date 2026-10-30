import { use, useState } from 'react';
// The focus state Expo Router's navigator provides to each route (its
// NavigationProvider), the value its own useIsFocused() reads. Imported from
// the package's build path because the router doesn't re-export the context,
// and its useIsFocused() throws outside a navigator. If a router upgrade moves
// it, this import fails at build time, not silently.
import { IsFocusedContext } from 'expo-router/build/react-navigation/core/useIsFocused';

/**
 * Whether the screen's route is focused right now (Phase 1 B6 fix, record §9).
 *
 * Tabs are never frozen or hidden any more, so a hidden tab still renders and
 * runs its effects. A screen uses this to hold back what must only happen in
 * front of the user: an overlay, an auto-dismiss timer, an interstitial.
 *
 * - Re-renders the caller when its route's focus changes (the navigator
 *   updates the context), and is correct during render, unlike
 *   `navigation.isFocused()`, which the router warns can be stale there.
 * - Outside a navigator (tests, Reassure) it is always true, so a screen
 *   rendered on its own behaves as a focused one.
 */
export function useScreenFocused(): boolean {
    return use(IsFocusedContext) ?? true;
}

/**
 * Whether the screen's route has been focused at least once (Phase 1 B6 fix,
 * record §9). Latches: once true, it stays true for the screen's life. Always
 * true outside a navigator.
 */
export function useHasBeenFocused(): boolean {
    const focused = useScreenFocused();
    const [seen, setSeen] = useState(focused);
    // React's pattern for remembering a past value: adjust the state during
    // render, once, when the route is first seen focused.
    if (focused && !seen) setSeen(true);
    return seen || focused;
}
