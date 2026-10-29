import { useEffect, useState, type ReactNode } from 'react';
import { ensureMigrated, isStorageMigrated } from '../utils/storageMigration';
import { hydrateStores } from './hydrateStores';
import { useReminderScheduler } from './reminderScheduler';
import { useSessionClockEngine } from './sessionStore';

/**
 * The root of the app's state (Phase 1 B3). Renders its children only once the
 * stores hold the stored values, so no screen ever needs a loading state.
 *
 * - Every launch after the first: the B2 migration flag is already in MMKV, so
 *   the first render hydrates the stores synchronously and renders the
 *   children in that same render.
 * - The one launch right after the update: renders nothing while the one-time
 *   AsyncStorage → MMKV copy runs, then hydrates and renders. The splash screen
 *   is still up then (it hides on Navigation's onReady, a child of this gate).
 *
 * It also mounts, once, the side effects AppProvider used to host: the session
 * clock engine and the daily reminder's scheduler.
 *
 * Holds no app state itself and provides no context; components read the
 * stores directly. Mount exactly one, at the root.
 *
 * INVARIANT (the synchronous path): when migrated, hydrateStores() calls the
 * stores' set() inside the useState initializer, i.e. during this component's
 * first render. That is safe only because no other component subscribes yet:
 * every store reader is rendered below this gate, after it. Rendering a store
 * reader outside the gate (a second tree, a sibling) would make React warn
 * about updating one component while rendering another. (On the migrating
 * path, hydrateStores() runs in a promise callback, outside any render, where
 * the gate's own reminder-scheduler selectors are already subscribed; that
 * is an ordinary store update.)
 */
export function StoreGate({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(() => {
        if (!isStorageMigrated()) return false;
        hydrateStores();
        return true;
    });

    useEffect(() => {
        if (ready) return;
        let cancelled = false;
        // ensureMigrated() never rejects; on failure it logs, and loads fall back to defaults.
        ensureMigrated().then(() => {
            if (cancelled) return;
            hydrateStores();
            setReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, [ready]);

    useSessionClockEngine(ready);
    useReminderScheduler(ready);

    return ready ? children : null;
}
