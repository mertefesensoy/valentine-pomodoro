import { render, screen } from '@testing-library/react-native';
import StatsScreen from '../StatsScreen';

// Regression test for a Rules-of-Hooks violation: StatsScreen returned early
// while stats were loading, before five useMemo calls. When isReady flipped to
// true on a mounted screen, React saw more hooks than on the previous render
// and threw. The Stats tab stays mounted, so this can happen in normal use.

let mockStats: Record<string, unknown>;

jest.mock('../../context/AppContext', () => ({
    useApp: () => ({ stats: mockStats, settings: { settings: { themeMode: 'light' } } }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
    useBottomTabBarHeight: () => 0,
}));

function statsState(isReady: boolean) {
    const day = { focusSessions: 2, focusMinutes: 50 };
    return {
        isReady,
        today: day,
        totals: { focusSessions: 10, focusMinutes: 250 },
        last7Days: Array.from({ length: 7 }, (_, i) => [`2026-10-2${i}`, day]),
        goalMinutes: 50,
        streak: { current: 3, best: 5 },
    };
}

describe('StatsScreen', () => {
    it('survives stats finishing loading while the screen is mounted', async () => {
        mockStats = statsState(false);
        const view = await render(<StatsScreen />);
        expect(screen.getByText('Loading stats…')).toBeOnTheScreen();

        mockStats = statsState(true);
        await view.rerender(<StatsScreen />);
        expect(screen.getByText('Stats')).toBeOnTheScreen();
    });
});
