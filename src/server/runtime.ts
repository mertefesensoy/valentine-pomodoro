import { AppState } from 'react-native';
import { flushDayReports, reportToday, startDayReports } from './dayReports';
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
    await reportToday();
    await flushDayReports();
}

export function startPairedRuntime(): void {
    if (started) return;
    started = true;
    startDayReports();
    // After the cache is restored, so a refresh can't race the last known values.
    void homeRestored.then(refreshAll).catch(() => {});
    AppState.addEventListener('change', (state) => {
        if (state === 'active') void refreshAll().catch(() => {});
    });
}
