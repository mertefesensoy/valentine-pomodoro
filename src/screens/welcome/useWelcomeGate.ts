import { useEffect, useRef } from 'react';
import { router } from 'expo-router';

import { runAfterInteractive } from '../../startup/deferredStartup';
import { useUiStore } from '../../stores/uiStore';

/**
 * Shows the one-time v1.4 welcome on a calm entry only (welcome brief §4; HIG review W-H1).
 *
 * Contract
 *   in : `calm`, the caller's view of the moment: the Timer tab focused and idle, in Classic,
 *        with no goal moment or love note pending (a session can survive the update, because the
 *        clock is timestamp-based, so a first v1.4 launch may land in a running one).
 *   also: the store's own conditions. Hydrated; the welcome not seen; not opened from a
 *        notification this launch (`welcomeDeferred`). v1's gift screen no longer gates it: D2
 *        retired that screen, so the welcome is the only first-run screen (HIG `onboarding.md`).
 *        The store still reads the gift's stored flag to pick the welcome's line for 1.3.1
 *        updaters (`welcomeAudience`).
 *   out: pushes `/welcome` once per process when all hold. The route marks it seen when Start is
 *        pressed, so a launch that never gets a calm moment shows it on a later one.
 *   when: through B7's `runAfterInteractive`, so it waits for the first frame and the first idle
 *        moment: the Timer always paints before the welcome fades in, and a launch never opens on
 *        a branding screen (HIG review H-2), nor moves the cold-start probe's TTI.
 */
export function useWelcomeGate(calm: boolean): void {
    const due = useUiStore((s) => s.isReady && !s.hasSeenWelcome && !s.welcomeDeferred);
    const shown = useRef(false);
    useEffect(() => {
        if (!calm || !due || shown.current) return;
        return runAfterInteractive('welcome', () => {
            if (shown.current) return;
            shown.current = true;
            router.push('/welcome');
        });
    }, [calm, due]);
}
