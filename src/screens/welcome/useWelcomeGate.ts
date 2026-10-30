import { useEffect, useRef } from 'react';
import { router } from 'expo-router';

import { useUiStore } from '../../stores/uiStore';

/**
 * Shows the one-time v1.4 welcome on a calm entry only (welcome brief §4; HIG review W-H1).
 *
 * Contract
 *   in : `calm`, the caller's view of the moment: the Timer tab focused and idle, in Classic,
 *        with no goal moment or love note pending (a session can survive the update, because the
 *        clock is timestamp-based, so a first v1.4 launch may land in a running one).
 *   also: the store's own conditions. Hydrated; the first-launch gift screen already dismissed, so
 *        two first-run screens never stack; the welcome not seen; not opened from a notification
 *        this launch (`welcomeDeferred`).
 *   out: pushes `/welcome` once per process when all hold. The route marks it seen when Start is
 *        pressed, so a launch that never gets a calm moment shows it on a later one.
 */
export function useWelcomeGate(calm: boolean): void {
    const due = useUiStore((s) => s.isReady && s.hasSeenGiftMode && !s.hasSeenWelcome && !s.welcomeDeferred);
    const shown = useRef(false);
    useEffect(() => {
        if (!calm || !due || shown.current) return;
        shown.current = true;
        router.push('/welcome');
    }, [calm, due]);
}
