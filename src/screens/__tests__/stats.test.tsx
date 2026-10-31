import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { useStatsStore } from '../../stores/statsStore';
import type { DayStats } from '../../types';
import StatsScreen from '../StatsScreen';

jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true },
}));

function Providers({ children }: { children: ReactNode }) {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{children}</StoreGate>
        </GestureHandlerRootView>
    );
}

/** The local day key `daysAgo` days before today. */
function keyOf(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The sketch's week: 2, 0, 1, 3, 0, 4 sessions of 25 minutes before today, then 1 today; the goal
// (50 min) reached on three days.
const WEEK: [number, DayStats][] = [
    [6, { focusSessions: 2, focusMinutes: 50, goalHit: true }],
    [4, { focusSessions: 1, focusMinutes: 25 }],
    [3, { focusSessions: 3, focusMinutes: 75, goalHit: true }],
    [1, { focusSessions: 4, focusMinutes: 100, goalHit: true }],
    [0, { focusSessions: 1, focusMinutes: 25 }],
];

async function showWeek() {
    await render(<StatsScreen />, { wrapper: Providers });
    await act(async () => {
        useStatsStore.setState({
            days: Object.fromEntries(WEEK.map(([ago, day]) => [keyOf(ago), day])),
            goalMinutes: 50,
            streak: { current: 1, best: 3, lastHitDayKey: keyOf(1) },
        });
    });
}

beforeEach(async () => {
    await resetStorage();
    jest.mocked(router.navigate).mockClear();
});

// covers: FR-STA-003, FR-STA-004, FR-STA-005
describe('Stats: the postcard stack (D2 Stats contract)', () => {
    it('opens with one summary line of the week, then today and the six days before it', async () => {
        await showWeek();
        expect(screen.getByText('Last 7 days: 11 sessions · goal reached on 3 days')).toBeOnTheScreen();
        expect(screen.getByLabelText(/^Today, 1 session, 25 minutes$/)).toBeOnTheScreen();
        // Each earlier day is one element, empty ones included, never "missed".
        expect(screen.getAllByLabelText(/, (\d+ sessions?|no sessions)/)).toHaveLength(7);
        expect(screen.getAllByLabelText(/goal reached$/)).toHaveLength(3);
        expect(screen.getAllByLabelText(/no sessions$/)).toHaveLength(2);
        expect(screen.queryByText(/missed/i)).toBeNull();
    });

    it("shows today's progress toward the goal, the goal and the love streak", async () => {
        await showWeek();
        expect(screen.getByText(/25 min to the goal/)).toBeOnTheScreen();
        expect(screen.getByText('Goal 50 min')).toBeOnTheScreen();
        expect(screen.getByText('25 min left today')).toBeOnTheScreen();
        expect(screen.getByText('Love streak')).toBeOnTheScreen();
        expect(screen.getByText('1 day · best 3')).toBeOnTheScreen();
    });

    it('switches the week to minutes, and the summary names the metric in view', async () => {
        await showWeek();
        await act(async () => {
            await fireEvent.press(screen.getByLabelText('Minutes'));
        });
        expect(screen.getByText('Last 7 days: 275 minutes · goal reached on 3 days')).toBeOnTheScreen();
    });

    it('with the goal off, offers to turn it on in Settings, and drops the goal from the summary', async () => {
        await showWeek();
        await act(async () => useStatsStore.setState({ goalMinutes: 0 }));
        expect(screen.getByText('Last 7 days: 11 sessions')).toBeOnTheScreen();
        expect(screen.queryByText('Love streak')).toBeNull();
        await act(async () => {
            await fireEvent.press(screen.getByRole('button', { name: 'Turn on a daily goal' }));
        });
        expect(router.navigate).toHaveBeenCalledWith('/settings');
    });

    it('invites a first session on an empty week', async () => {
        await render(<StatsScreen />, { wrapper: Providers });
        await act(async () => {});
        expect(screen.getByText(/^Last 7 days: 0 sessions/)).toBeOnTheScreen();
        await act(async () => {
            await fireEvent.press(screen.getByRole('button', { name: 'Start a session' }));
        });
        expect(router.navigate).toHaveBeenCalledWith('/');
    });

    it('totals all time below the week', async () => {
        await showWeek();
        expect(screen.getByText('All time: 11 sessions · 275 minutes')).toBeOnTheScreen();
    });
});
