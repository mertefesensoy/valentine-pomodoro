import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useSessionStore } from '../stores/sessionStore';
import type { SessionClockState } from '../types';

// DEF-010 (1.5.1): before this, nothing in the app kept the screen on, so iOS's
// Auto-Lock (30 s to 5 min with no touch) locked the phone in every session.
// Development builds never showed it: Expo's dev wrapper keeps the screen
// awake for as long as the app is open (expo/src/launch/withDevTools.ios.tsx),
// and release builds don't have that wrapper. Check this on TestFlight, never
// in a dev build. The audit: docs/implementations/2026-11-12-screen-sleep-audit.md.

/**
 * The app's own keep-awake tag. Never Expo's default tag: in a dev build, the
 * dev wrapper holds the default one, and releasing it would end the wrapper's
 * hold too.
 */
export const KEEP_AWAKE_TAG = 'valentine-pomodoro-session';

/**
 * True while the active slot runs and its end is still ahead: a running
 * session of either kind, in any phase (focus or a break; the owner,
 * 2026-11-12). False when idle, when paused, and once the end has passed. An
 * ended session that waits for its handler (DEF-004) doesn't keep the screen
 * on.
 */
export function isSessionRunning(clock: SessionClockState, now: number): boolean {
    const kind = clock.activeKind;
    if (!kind) return false;
    const slot = clock[kind];
    return slot?.isRunning === true && slot.endAt !== null && slot.endAt > now;
}

// The native calls run one after another, in the order they were made. On iOS
// and Android the module would keep that order anyway; on the web, activating
// waits for the browser's wake lock, and a release sent before it arrived
// would find nothing to release. Errors are dropped: on a browser with no wake
// lock API both calls reject, and a screen that may lock is the only cost.
let pending: Promise<unknown> = Promise.resolve();
function enqueue(call: () => Promise<unknown>): void {
    pending = pending.then(call).catch(() => {});
}

/**
 * Keeps the screen from dimming and locking by itself while a session runs
 * (FR-TMR-011). The person can still lock the phone with the side button.
 *
 * - **Inputs:** `active`, false until the stores have hydrated.
 * - **Side effects:** holds KEEP_AWAKE_TAG while isSessionRunning() is true,
 *   and releases it when it turns false, when `active` turns false, or on
 *   unmount. It subscribes to the session store outside React, so StoreGate
 *   never re-renders because of it.
 * - **Invariants:** mounted exactly once, by StoreGate. It is app-wide: the
 *   screen stays on whichever tab is shown (the owner, 2026-11-12). It works
 *   only in the foreground; iOS ignores the setting in the background, and
 *   expo-keep-awake drops it there and restores it on return. Nothing here
 *   needs a background mode (DEF-009).
 */
export function useKeepScreenAwake(active: boolean): void {
    useEffect(() => {
        if (!active) return;

        let held = false;
        const sync = () => {
            const wanted = isSessionRunning(useSessionStore.getState().clock, Date.now());
            if (wanted === held) return;
            held = wanted;
            enqueue(wanted ? () => activateKeepAwakeAsync(KEEP_AWAKE_TAG) : () => deactivateKeepAwake(KEEP_AWAKE_TAG));
        };

        sync();
        const unsubscribe = useSessionStore.subscribe(sync);
        return () => {
            unsubscribe();
            if (held) {
                held = false;
                enqueue(() => deactivateKeepAwake(KEEP_AWAKE_TAG));
            }
        };
    }, [active]);
}
