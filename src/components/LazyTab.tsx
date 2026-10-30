import { useEffect, useState, type ReactNode } from 'react';
import { useHasBeenFocused } from '../hooks/useScreenFocus';
import { runAfterInteractive } from '../startup/deferredStartup';

/**
 * A tab's screen, rendered late and then never hidden (Phase 1 B6 fix, record
 * §9; it replaces FreezeOnBlur, ADR-0043).
 *
 * Expo Router's native tabs mount every tab at launch. This renders nothing
 * until the first of:
 * - the tab's route is focused (at once, for the tab the app opens on);
 * - start-up has gone idle after B7's interactive mark
 *   (`runAfterInteractive`, one tab per idle callback, after the deferred
 *   start-up work), so a tab is usually rendered before it is first opened.
 *
 * From then on it always renders its screen. Nothing hides it again: on native
 * tabs UIKit shows a tab before JavaScript can react, so any hiding (a freeze,
 * `display: none`, `<Activity>`) shows as a blank frame on every switch, which
 * build 46 did. A hidden screen holds back what must happen in front of the
 * user itself (`useScreenFocused`).
 *
 * `name` labels the pre-render in the start-up probe (`tab.<name>`). Outside a
 * navigator (tests) it renders at once.
 */
export function LazyTab({ name, children }: { name: string; children: ReactNode }) {
    const seen = useHasBeenFocused();
    const [idle, setIdle] = useState(false);

    useEffect(() => {
        if (seen || idle) return;
        return runAfterInteractive(`tab.${name}`, () => setIdle(true));
    }, [seen, idle, name]);

    return seen || idle ? children : null;
}
