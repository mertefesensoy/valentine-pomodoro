import type { ReactNode } from 'react';
import { Dimensions } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { useSettingsFocus } from '../../stores/settingsFocusStore';
import { useStatsStore } from '../../stores/statsStore';
import type { DayStats } from '../../types';
import StatsScreen from '../StatsScreen';
import { dateOfKey } from '../stats/WeekStack';

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

    // break-ui (D2 record §3.13): "goal reached on 0 days" read as a miss (#4); a streak of 0 read
    // as a loss beside the best (the owner's decision); a count of 1,000 or more showed two ways (#6).
    it('says nothing of goal days when none was reached, and how a streak of 0 starts', async () => {
        await showWeek();
        // The largest goal, reached on no day this week (each day keeps whether it reached its goal).
        await act(async () =>
            useStatsStore.setState({
                days: Object.fromEntries(WEEK.map(([ago, { goalHit: _hit, ...day }]) => [keyOf(ago), day])),
                goalMinutes: 1440,
                streak: { current: 0, best: 3, lastHitDayKey: keyOf(9) },
            }),
        );
        expect(screen.getByText('Last 7 days: 11 sessions')).toBeOnTheScreen();
        expect(screen.queryByText(/goal reached on 0 days/)).toBeNull();
        expect(screen.getByText('Goal 1,440 min')).toBeOnTheScreen();
        expect(screen.getByText('Starts the day you reach your goal · best 3')).toBeOnTheScreen();
        await act(async () => useStatsStore.setState({ streak: { current: 0, best: 0, lastHitDayKey: undefined } }));
        expect(screen.getByText('Starts the day you reach your goal')).toBeOnTheScreen();
    });

    it('groups a count of 1,000 or more the same way in every line', async () => {
        await showWeek();
        await act(async () => {
            useStatsStore.setState((st) => ({ days: { ...st.days, [keyOf(2)]: { focusSessions: 30, focusMinutes: 1500, goalHit: true } } }));
        });
        await act(async () => {
            await fireEvent.press(screen.getByLabelText('Minutes'));
        });
        expect(screen.getByText('Last 7 days: 1,775 minutes · goal reached on 4 days')).toBeOnTheScreen();
        expect(screen.getByText('1,500')).toBeOnTheScreen();
        expect(screen.getByText('All time: 41 sessions · 1,775 minutes')).toBeOnTheScreen();
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
        // Settings opens at the goal row (step 6, D2 record §3.14).
        expect(useSettingsFocus.getState().section).toBe('goal');
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

/** The window at a given text size, restored after. */
async function atTextSize(fontScale: number, run: () => Promise<void>) {
    const jestWindow = Dimensions.get('window');
    const phone = { width: 393, height: 852, scale: 3, fontScale };
    try {
        await act(async () => Dimensions.set({ window: phone, screen: phone }));
        await run();
    } finally {
        await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
    }
}

/** An edge's visible day name, as DayEdge writes it. */
function edgeName(daysAgo: number): string {
    const date = dateOfKey(keyOf(daysAgo));
    return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${date.getDate()}`;
}

// covers: NFR-A11Y-003
// Review round (D2 record §3.12, HIG S-1): a fixed 56 pt column cut "Wed 29" to "Wed…" from xxLarge,
// and to one letter in the list built for the accessibility sizes.
describe('Stats at larger text sizes', () => {
    it('grows the day column and the goal flag with the text size in the stack (xxLarge)', async () => {
        await atTextSize(1.235, async () => {
            await showWeek();
            const name = screen.getByText(edgeName(1));
            expect(name).toHaveStyle({ width: 56 * 1.235 });
            expect(name.props.numberOfLines).toBeUndefined();
            // The flag on a day that reached the goal: the edge's only icon.
            const edge = screen.getByLabelText(/, 4 sessions, 100 minutes, goal reached$/);
            const svgs: { props: { width?: number } }[] = [];
            const walk = (node: unknown) => {
                if (!node || typeof node !== 'object') return;
                const n = node as { type?: string; props: { width?: number }; children?: unknown[] };
                if (n.type === 'RNSVGSvgView') svgs.push(n);
                n.children?.forEach(walk);
            };
            walk(edge);
            expect(svgs.at(-1)!.props.width).toBeCloseTo(14 * 1.235);
        });
    });

    // break-ui #5: side by side at AX sizes, each half's text column was about 110 pt, and
    // "Hedef" and "serisi" broke mid-word. In the list the halves stack.
    const stripOf = () => screen.getByText('Love streak').parent!.parent!.parent!;

    it('stacks the goal and streak strip in the list (an AX size)', async () => {
        await atTextSize(3.1, async () => {
            await showWeek();
            expect(stripOf()).toHaveStyle({ flexDirection: 'column' });
        });
    });

    it('keeps the strip side by side at the default size', async () => {
        await atTextSize(1, async () => {
            await showWeek();
            expect(stripOf()).toHaveStyle({ flexDirection: 'row' });
        });
    });

    it('gives each day a line of its own in the list (an AX size)', async () => {
        await atTextSize(3.1, async () => {
            await showWeek();
            const name = screen.getByText(edgeName(1));
            expect(name).toHaveStyle({ flexBasis: '100%' });
            expect(name).not.toHaveStyle({ width: 56 });
            expect(name.props.numberOfLines).toBeUndefined();
        });
    });
});
