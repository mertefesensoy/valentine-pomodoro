import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { runAfterInteractive } from '../../startup/deferredStartup';
import { useUiStore } from '../../stores/uiStore';
import { currentBeat, useTourStore } from './tourStore';
import { dueTutorial, type TourScreen } from './tutorials';

/**
 * The hosts' side of the tour (Phase 1 D5; D5 record §3.7). Timer, Stats and Notes each mount the
 * layer when `useTourHere` says the active beat is theirs; Timer also runs the gate.
 */

/** The welcome's fade back into the Timer, so the tour arrives after it has gone. */
const AFTER_WELCOME_MS = 450;

/**
 * Starts the first run on a calm entry, right after the welcome (brief §4).
 *
 * Contract
 *   in : `calm`, the caller's view of the moment, the welcome's own: the Timer tab focused and
 *        idle, in Classic, with no goal moment or love note pending.
 *   also: both stores hydrated; the welcome seen (this launch or an earlier one); not opened from
 *        a notification this launch (`welcomeDeferred`); a tutorial due (`dueTutorial`).
 *   out: starts the run once per process. A launch that never gets a calm moment starts it on a
 *        later one; a run killed half-way resumes at its step, once (tourStore).
 *   when: through B7's `runAfterInteractive` and after the welcome's fade, so the Timer has
 *        painted and the welcome has gone before the ribbon drops.
 */
export function useTourGate(calm: boolean): void {
    const welcomeDone = useUiStore((s) => s.isReady && s.hasSeenWelcome && !s.welcomeDeferred);
    const due = useTourStore((s) => s.isReady && !s.run && dueTutorial(s.seen) !== null);
    const started = useRef(false);
    useEffect(() => {
        if (!calm || !welcomeDone || !due || started.current) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const cancel = runAfterInteractive('tour', () => {
            timer = setTimeout(() => {
                if (started.current) return;
                started.current = true;
                useTourStore.getState().start({ replay: false });
            }, AFTER_WELCOME_MS);
        });
        return () => {
            cancel?.();
            if (timer) clearTimeout(timer);
        };
    }, [calm, welcomeDone, due]);
}

/** Whether the active beat belongs to this screen. The host adds its own conditions (focused, Classic). */
export function useTourBeatHere(screen: TourScreen): boolean {
    return useTourStore((s) => {
        if (!s.run) return false;
        return currentBeat(s.run)?.screen === screen;
    });
}

/** A tab came to the front: a lead pointing at it moves on to its step (the tab press is the real one). */
export function useTourReach(screen: TourScreen, focused: boolean): void {
    useEffect(() => {
        if (focused) useTourStore.getState().reachScreen(screen);
    }, [focused, screen]);
}

/** Whether VoiceOver is running, following it as it turns on or off (T-1); null until the first answer. */
export function useScreenReader(): boolean | null {
    const [on, setOn] = useState<boolean | null>(null);
    useEffect(() => {
        let live = true;
        AccessibilityInfo.isScreenReaderEnabled()
            .then((v) => live && setOn(v))
            .catch(() => {});
        const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setOn);
        return () => {
            live = false;
            sub.remove();
        };
    }, []);
    return on;
}

/** Reduce Transparency or Increase Contrast is on: the scrim is raised (T-5). */
export function useRaisedScrim(): boolean {
    const [state, setState] = useState({ transparency: false, contrast: false });
    useEffect(() => {
        let live = true;
        AccessibilityInfo.isReduceTransparencyEnabled()
            .then((v) => live && setState((s) => ({ ...s, transparency: v })))
            .catch(() => {});
        AccessibilityInfo.isDarkerSystemColorsEnabled?.()
            .then((v) => live && setState((s) => ({ ...s, contrast: v })))
            .catch(() => {});
        const a = AccessibilityInfo.addEventListener('reduceTransparencyChanged', (v) => setState((s) => ({ ...s, transparency: v })));
        const b = AccessibilityInfo.addEventListener('darkerSystemColorsChanged', (v) => setState((s) => ({ ...s, contrast: v })));
        return () => {
            live = false;
            a.remove();
            b.remove();
        };
    }, []);
    return state.transparency || state.contrast;
}
