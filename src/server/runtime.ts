import { AppState } from 'react-native';
import { homeRestored, refreshHome } from './home';

/**
 * What runs for someone with an account (Phase 2 C2). A refresh after the first frame, then one each time
 * the app returns to the foreground. It holds no connection, so nothing stays open while a person focuses
 * (plan §5). Starts once per launch. Reached only through import() from startPaired.ts.
 */
let started = false;

export function startPairedRuntime(): void {
    if (started) return;
    started = true;
    // After the cache is restored, so a refresh can't race the last known values.
    void homeRestored.then(() => refreshHome()).catch(() => {});
    AppState.addEventListener('change', (state) => {
        if (state === 'active') void refreshHome().catch(() => {});
    });
}
