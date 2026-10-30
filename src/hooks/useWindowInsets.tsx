import { createContext, use, type ReactNode } from 'react';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

/**
 * The window's safe-area insets, wherever they are read (Phase 1 B6).
 *
 * Each native tab wraps its screen in a SafeAreaProvider of its own, whose
 * bottom inset includes the tab bar (about 83 pt on a Face ID iPhone in
 * portrait, where the window's is 34). That is what a screen pads by to stay
 * clear of the bar. Something already laid out above the bar that wants the
 * window's inset (the Fly sheet's padding) reads it here instead.
 *
 * - WindowInsetsProvider: mount once, below the root SafeAreaProvider and
 *   above the navigator. It re-renders this context's readers only when the
 *   window's insets change (rotation).
 * - useWindowInsets(): the root provider's insets; outside a
 *   WindowInsetsProvider (tests), the nearest provider's.
 */
const WindowInsetsContext = createContext<EdgeInsets | null>(null);

export function WindowInsetsProvider({ children }: { children: ReactNode }) {
    const insets = useSafeAreaInsets();
    return <WindowInsetsContext value={insets}>{children}</WindowInsetsContext>;
}

export function useWindowInsets(): EdgeInsets {
    const nearest = useSafeAreaInsets();
    return use(WindowInsetsContext) ?? nearest;
}
