import { AppState } from 'react-native';
import { reportToday, startDayReports } from './dayReports';
import { homeRestored, refreshHome } from './home';
import { syncTimeZone } from './timeZone';

/**
 * What runs for someone with an account (Phase 2 C2, C3). A refresh after the first frame, then one each
 * time the app returns to the foreground, with the day's report and the time zone beside it. It holds no
 * connection, so nothing stays open while a person focuses (plan §5). Starts once per launch. Reached only
 * through import() from startPaired.ts.
 */
let started = false;

async function refreshAll(): Promise<void> {
    await syncTimeZone();
    await refreshHome().catch(() => {});
    // After the refresh, so a person who has just paired is known to be paired. It also sends what's queued.
    await reportToday();
}

export function startPairedRuntime(): void {
    if (started) return;
    started = true;
    // This can start before the cache is restored, when isPaired() still reads false. A focus credited in
    // that moment is covered by reportToday() in refreshAll.
    startDayReports();
    // After the cache is restored, so a refresh can't race the last known values.
    void homeRestored.then(refreshAll).catch(() => {});
    AppState.addEventListener('change', (state) => {
        if (state === 'active') void refreshAll().catch(() => {});
    });
}
