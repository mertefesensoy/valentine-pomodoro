import { act, render } from '@testing-library/react-native';
import { AppProvider, useApp } from '../../context/AppContext';
import { save, STORAGE_KEYS } from '../../utils/storage';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import type { StatsState } from '../../types';

// Phase 1 B3 fold-ins for the stats store. "Now" is 00:15 on 31 Oct 2026,
// fifteen minutes after midnight, so a session that started on the 30th is
// credited to the 30th (FR-STA-001) while the clock already reads the 31st.
jest.useFakeTimers({ now: new Date(2026, 9, 31, 0, 15) });

let stats: ReturnType<typeof useApp>['stats'] | null = null;

function StatsHandle() {
    stats = useApp().stats;
    return null;
}

/** Stores `stored` as stats_v2, then launches the app's state over it. */
async function launchWith(stored: StatsState) {
    await save(STORAGE_KEYS.STATS_V2, stored);
    await render(<AppProvider><StatsHandle /></AppProvider>);
    await act(async () => {});
}

afterEach(async () => {
    await resetStorage();
});

// covers: FR-STA-002
describe('a completion replayed after a relaunch (DEF-002)', () => {
    it('is not credited twice', async () => {
        await launchWith({
            days: { '2026-10-30': { focusSessions: 1, focusMinutes: 25, goalMinutes: 50, goalHit: false } },
            goalMinutes: 50,
            streak: { current: 0, best: 0 },
            lastAppliedSessionId: 'session-A',
        });

        await act(() => stats!.incrementFocus(25, '2026-10-30', 'session-A'));

        expect(stats!.stats['2026-10-30']).toMatchObject({ focusSessions: 1, focusMinutes: 25 });
    });
});

// covers: FR-STA-005
describe('a goal reached by a session that crossed midnight (DEF-003)', () => {
    // Known defect until the DEF-003 fix: it.failing passes only while the test fails.
    it.failing('continues the streak from the day before the credited day', async () => {
        await launchWith({
            days: {
                '2026-10-29': {
                    focusSessions: 2,
                    focusMinutes: 50,
                    goalMinutes: 50,
                    goalHit: true,
                    goalHitAt: '2026-10-29T15:00:00.000Z',
                },
            },
            goalMinutes: 50,
            streak: { current: 3, best: 3, lastHitDayKey: '2026-10-29' },
        });

        await act(() => stats!.incrementFocus(50, '2026-10-30', 'session-B'));

        expect(stats!.stats['2026-10-30']).toMatchObject({ focusMinutes: 50, goalHit: true });
        expect(stats!.streak).toMatchObject({ current: 4, best: 4, lastHitDayKey: '2026-10-30' });
    });
});
