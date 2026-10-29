import { act, render, screen } from '@testing-library/react-native';
import StatsScreen from '../StatsScreen';
import { useStatsStore } from '../../stores/statsStore';

// Regression test for a Rules-of-Hooks violation: StatsScreen returned early
// while stats were loading, before five useMemo calls. When isReady flipped to
// true on a mounted screen, React saw more hooks than on the previous render
// and threw. The Stats tab stays mounted, so this could happen in normal use.
//
// Since Phase 1 B3 the stats store hydrates before any screen renders, so the
// app never shows the loading state; the test sets the store's isReady
// directly to keep the screen's loading branch honest.

jest.mock('@react-navigation/bottom-tabs', () => ({
    useBottomTabBarHeight: () => 0,
}));

function setStats(isReady: boolean) {
    const day = { focusSessions: 2, focusMinutes: 50 };
    const days = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`2026-10-2${i}`, day]));
    useStatsStore.setState({
        isReady,
        days,
        goalMinutes: 50,
        streak: { current: 3, best: 5, lastHitDayKey: '2026-10-26' },
    });
}

// covers: FR-STA-006
describe('StatsScreen', () => {
    it('survives stats finishing loading while the screen is mounted', async () => {
        setStats(false);
        await render(<StatsScreen />);
        expect(screen.getByText('Loading stats…')).toBeOnTheScreen();

        await act(() => setStats(true));
        expect(screen.getByText('Stats')).toBeOnTheScreen();
    });
});
