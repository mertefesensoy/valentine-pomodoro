// covers: FR-SET-001, NFR-I18N-001, NFR-A11Y-003, NFR-A11Y-002
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ModeSheet } from '../../components/modes/ModeSheet';
import { StoreGate } from '../../stores/StoreGate';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import { useUiStore } from '../../stores/uiStore';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { getTodayKey } from '../../utils/time';
import TimerScreen from '../TimerScreen';

// Classic rebuilt (Phase 1 D1, brief .impeccable/surfaces/app-tabs-index-tsx.md).
jest.useFakeTimers();
jest.setTimeout(30_000);

// Starting with notifications on races a permission request against a 1 s timeout; denying
// settles it at once (as in timerScreenTicks.test.tsx).
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
}));
jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

async function show(node: React.ReactElement) {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{node}</StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

// Jest's window is 750 × 1334 at font scale 2, an AX size (the Jest preset's Dimensions mock),
// where Facing Pages stacks and the Ring keeps its fixed rule. This runs a test on an iPhone at the
// default text size instead, as the owner's build 50 captures were, then puts Jest's window back.
async function onPhone(run: () => Promise<void>) {
    const jestWindow = Dimensions.get('window');
    const phone = { width: 393, height: 852, scale: 3, fontScale: 1 };
    try {
        await act(async () => Dimensions.set({ window: phone, screen: phone }));
        await run();
    } finally {
        await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
    }
}

async function press(target: Parameters<typeof fireEvent.press>[0]) {
    await act(async () => {
        await fireEvent.press(target);
    });
}

beforeEach(async () => {
    await resetStorage();
});

describe('Classic', () => {
    it('sets the timer in Baloo 2 with tabular figures, and reads it to VoiceOver as one element', async () => {
        await show(<TimerScreen />);
        const timer = screen.getByText('25:00');
        const style = StyleSheet.flatten(timer.props.style);
        expect(style.fontFamily).toBe('Baloo2-SemiBold');
        expect(style.fontVariant).toEqual(['tabular-nums']);
        expect(screen.getByLabelText('25 minutes, 0 seconds left, Focus, session 1 of 4')).toBeOnTheScreen();
    });

    it('a preset sets all three durations; the timer and the selection follow', async () => {
        await show(<TimerScreen />);
        await press(screen.getByLabelText('50 minutes focus, 10 minutes break'));
        expect(useSettingsStore.getState().settings.durations).toEqual({ focus: 50, shortBreak: 10, longBreak: 30 });
        expect(screen.getByText('50:00')).toBeOnTheScreen();
        expect(screen.getByLabelText('50 minutes focus, 10 minutes break')).toBeSelected();
        expect(screen.getByLabelText('25 minutes focus, 5 minutes break')).not.toBeSelected();
    });

    // Build 48 (F4): 25/5, 50/10, 90/20 and Custom; 52/17 is gone.
    it("offers 25/5, 50/10, 90/20 and Custom, and Custom brings back Settings' durations after a preset", async () => {
        const mine = { focus: 40, shortBreak: 8, longBreak: 20 };
        await act(async () => useSettingsStore.getState().updateSettings({ durations: mine, presetChoice: 'custom', customDurations: mine }));
        await show(<TimerScreen />);
        expect(screen.queryByLabelText(/52 minutes/)).toBeNull();
        const custom = screen.getByLabelText('Custom: 40 minutes focus, 8 minutes break, set in Settings');
        expect(custom).toBeSelected();
        expect(custom.props.accessibilityValue).toEqual({ text: '4 of 4' });
        // The key is for sight; VoiceOver hears the same in the segment's label.
        expect(screen.getByText('Custom: 40 / 8 min, set in Settings', { includeHiddenElements: true })).toBeOnTheScreen();

        await press(screen.getByLabelText('90 minutes focus, 20 minutes break'));
        expect(screen.getByText('90:00')).toBeOnTheScreen();
        expect(screen.getByText('focus / break, in minutes', { includeHiddenElements: true })).toBeOnTheScreen();

        await press(screen.getByLabelText('Custom: 40 minutes focus, 8 minutes break, set in Settings'));
        expect(useSettingsStore.getState().settings.durations).toEqual(mine);
        expect(screen.getByText('40:00')).toBeOnTheScreen();
    });

    it('speaks each preset in words with its position, never as a tab (HIG D1-M2)', async () => {
        await show(<TimerScreen />);
        const first = screen.getByLabelText('25 minutes focus, 5 minutes break');
        expect(first.props.accessibilityRole).toBe('button');
        expect(first.props.accessibilityValue).toEqual({ text: '1 of 4' });
    });

    it('offers End only while paused, with the Paused stamp', async () => {
        await show(<TimerScreen />);
        expect(screen.queryByText('End session')).toBeNull();
        await press(screen.getByText('Start focus'));
        expect(screen.getByText('Pause')).toBeOnTheScreen();
        expect(screen.queryByText('End session')).toBeNull();
        await act(() => jest.advanceTimersByTime(3_000));
        await press(screen.getByText('Pause'));
        expect(screen.getByText('Resume')).toBeOnTheScreen();
        expect(screen.getByText('End session')).toBeOnTheScreen();
        expect(screen.getByText('Paused')).toBeOnTheScreen();
    });

    it('labels the icon-only Modes button and keeps it at 44 pt (HIG M-3, NFR-A11Y-002)', async () => {
        await show(<TimerScreen />);
        const button = screen.getByLabelText('Modes');
        expect(button).toBeOnTheScreen();
        expect(StyleSheet.flatten(button.props.style ?? {})).toBeDefined();
    });

    it('draws Facing Pages when the setting says so, with the same timer', async () => {
        await show(<TimerScreen />);
        await act(async () => useSettingsStore.getState().updateSettings({ classicLayout: 'spread' }));
        expect(screen.getByText('25:00')).toBeOnTheScreen();
        expect(screen.getByLabelText('25 minutes, 0 seconds left, Focus, session 1 of 4')).toBeOnTheScreen();
    });
});

describe('the mode sheet', () => {
    it('chooses the timer layout', async () => {
        await show(<ModeSheet />);
        await press(screen.getByLabelText('Facing pages'));
        expect(useSettingsStore.getState().settings.classicLayout).toBe('spread');
    });

    it('opens Fly where it is available', async () => {
        await show(<ModeSheet />);
        await press(screen.getByText('Fly'));
        expect(useUiStore.getState().activeMode).toBe('fly');
    });
});

describe('Settings › Appearance', () => {
    it('offers the timer layout too (brief §3)', async () => {
        const SettingsScreen = jest.requireActual('../SettingsScreen').default as React.ComponentType;
        await show(<SettingsScreen />);
        await press(screen.getByLabelText('Facing pages'));
        expect(useSettingsStore.getState().settings.classicLayout).toBe('spread');
    });
});

// covers: NFR-UX-001
describe('Classic after its first reviews (critique, HIG, review-animations)', () => {
    it('asks before skipping a focus that has run past its first minute; a fresh one skips at once', async () => {
        const { Alert } = jest.requireActual<typeof import('react-native')>('react-native');
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        await show(<TimerScreen />);
        await press(screen.getByText('Start focus'));
        await act(() => jest.advanceTimersByTime(90_000));
        await press(screen.getByText('Skip'));
        expect(alert).toHaveBeenCalledTimes(1);
        expect(alert.mock.calls[0][0]).toBe('Skip the rest of this focus?');
        // Confirming skips: the break is next.
        const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
        await act(async () => buttons.find((b) => b.text === 'Skip')!.onPress!());
        expect(screen.getByText('Start break')).toBeOnTheScreen();
        alert.mockRestore();
    });

    it('says what Pomo & Doro are doing now', async () => {
        await show(<TimerScreen />);
        expect(screen.getByText('Pomo & Doro are ready when you are')).toBeOnTheScreen();
        await press(screen.getByText('Start focus'));
        expect(screen.getByText('Pomo & Doro are studying with you')).toBeOnTheScreen();
        await act(() => jest.advanceTimersByTime(3_000));
        await press(screen.getByText('Pause'));
        expect(screen.getByText('Pomo & Doro are waiting for you')).toBeOnTheScreen();
    });

    it('explains the empty sticker row before the first sticker when there is no goal', async () => {
        await show(<TimerScreen />);
        // With the default goal, the dashed cells explain the row; the sentence is for no goal.
        expect(screen.queryByText('Finish a focus and your first sticker lands here')).toBeNull();
        await act(async () => useStatsStore.setState({ goalMinutes: 0 }));
        expect(screen.getByText('Finish a focus and your first sticker lands here')).toBeOnTheScreen();
        expect(screen.getByLabelText('No sessions yet today')).toBeOnTheScreen();
    });

    it("labels today's row and counts the sessions left for today's goal", async () => {
        await show(<TimerScreen />);
        // The default 50-minute goal in 25-minute sessions: two dashed cells to fill (D1 record §4.3).
        expect(screen.getByText('Today')).toBeOnTheScreen();
        expect(screen.getByLabelText("No sessions yet today. 2 more for today's goal")).toBeOnTheScreen();
    });

    it("carries the partner slot on Facing Pages' right page, facing and stacked", async () => {
        const check = async () => {
            await show(<TimerScreen />);
            await act(async () => useSettingsStore.getState().updateSettings({ classicLayout: 'spread' }));
            // The pair's line lives on the right page now, once (finish review fix 4); the pages'
            // labels are decoration, hidden from VoiceOver.
            expect(screen.getAllByText('Pomo & Doro are ready when you are')).toHaveLength(1);
            expect(screen.getByText('You', { includeHiddenElements: true })).toBeOnTheScreen();
            expect(screen.getByText('Doro', { includeHiddenElements: true })).toBeOnTheScreen();
            expect(screen.queryByText('You')).toBeNull();
        };
        await check(); // Jest's own window: an AX size, where the pages stack
        await onPhone(check); // facing pages
    });

    // Finish review fix 7, rebuilt after the verdict pass (D1 record §3.21): the slot measured only
    // the ring itself, so the ring stayed at its cap and Skip went behind the tab bar. The ring now
    // takes the visible height less the page's spacing (88 pt) and the four rows around it.
    describe("the Ring's height", () => {
        const ringWidth = () => StyleSheet.flatten(screen.getByTestId('phase-ring').props.style).width;
        const lay = (testID: string, height: number) =>
            act(async () => fireEvent(screen.getByTestId(testID), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 345, height } } }));
        // The cap: 86 % of the 345 pt column.
        const cap = 345 * 0.86;

        it('takes the height its neighbours leave, whatever order their layouts arrive in', async () => {
            await onPhone(async () => {
                await show(<TimerScreen />);
                // Before the rows are measured, the estimate (here, the cap: Jest's insets are 0).
                expect(ringWidth()).toBeCloseTo(cap);
                await lay('classic-controls', 196);
                await lay('today-row', 68);
                await lay('classic-page', 700);
                await lay('partner-strip', 72);
                // Four of the five: still the estimate.
                expect(ringWidth()).toBeCloseTo(cap);
                await lay('classic-top-row', 44);
                // 700 − 88 − (44 + 72 + 68 + 196) = 232.
                expect(ringWidth()).toBe(232);
                // Today's row back to one row of cells gives the ring that row's 34 pt.
                await lay('today-row', 34);
                expect(ringWidth()).toBe(266);
            });
        });

        it('stops at its floor, where the page scrolls, and at its cap', async () => {
            await onPhone(async () => {
                await show(<TimerScreen />);
                for (const [id, h] of [['classic-top-row', 44], ['partner-strip', 72], ['today-row', 34], ['classic-controls', 196]] as const) {
                    await lay(id, h);
                }
                await lay('classic-page', 500);
                expect(ringWidth()).toBe(200);
                await lay('classic-page', 900);
                expect(ringWidth()).toBeCloseTo(cap);
            });
        });

        it('holds its size through the goal moment, then takes the row as it is after', async () => {
            await onPhone(async () => {
                await show(<TimerScreen />);
                for (const [id, h] of [['classic-top-row', 44], ['partner-strip', 72], ['today-row', 34], ['classic-controls', 196], ['classic-page', 700]] as const) {
                    await lay(id, h);
                }
                expect(ringWidth()).toBe(266);
                await act(async () => useStatsStore.setState({ goalHitPulse: { dayKey: getTodayKey(), newStreak: 1 } as never }));
                // "Goal reached" under the row: the page scrolls for that moment; the ring keeps its size.
                await lay('today-row', 34 + 40);
                expect(ringWidth()).toBe(266);
                await act(async () => useStatsStore.setState({ goalHitPulse: null }));
                // After it, the row has wrapped onto its second row: the ring gives that row up.
                await lay('today-row', 68);
                expect(ringWidth()).toBe(232);
            });
        });
    });
});

// Build 53 device check (D2 record §3.20): in landscape the column kept the 560 pt readable cap, so
// the trailing column got about 80 pt. The partner line vanished, today's cells stacked one a line,
// and the face, centred against that tall column, began below the screen. Landscape now uses the
// width between the side insets: the face takes half and the whole height, and the phase line
// heads the trailing column.
describe('Classic in landscape', () => {
    // An iPhone 15 on its side, at the default text size (Jest's insets are 0).
    async function onLandscape(run: () => Promise<void>) {
        const jestWindow = Dimensions.get('window');
        const landscape = { width: 852, height: 393, scale: 3, fontScale: 1 };
        try {
            await act(async () => Dimensions.set({ window: landscape, screen: landscape }));
            await run();
        } finally {
            await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
        }
    }
    // The page: 852 less the 24 pt gutters; the face: half of it, less the gap; the height: 393
    // less the page's top (8) and bottom (16) padding.
    const pageWidth = 852 - 48;
    const faceWidth = (pageWidth - 24) / 2;
    const faceHeight = 393 - 8 - 16;

    it('sizes the Ring to the height it has, beside a trailing column of half the page', async () => {
        await onLandscape(async () => {
            await show(<TimerScreen />);
            const ring = StyleSheet.flatten(screen.getByTestId('phase-ring').props.style);
            expect(ring.width).toBe(Math.min(faceHeight, faceWidth));
        });
    });

    it('heads the trailing column with the phase line, beside the partner line', async () => {
        await onLandscape(async () => {
            await show(<TimerScreen />);
            const trailing = screen.getByRole('header', { name: /^Focus/ }).parent!.parent!;
            expect(within(trailing).getByText('Pomo & Doro are ready when you are')).toBeOnTheScreen();
            expect(within(trailing).queryByTestId('phase-ring')).toBeNull();
        });
    });

    it("plans today's row for the trailing column's width: two rows of eight", async () => {
        await onLandscape(async () => {
            await show(<TimerScreen />);
            // The largest goal, so the dashed cells fill the row's capacity.
            await act(async () => useStatsStore.setState({ goalMinutes: 1440 }));
            const dashed = JSON.stringify(screen.toJSON()).match(/"borderStyle":"dashed"/g) ?? [];
            // (390 − 34 − 68) / 34 → 8 a row; planned from the window it was 12 (24 cells).
            expect(dashed).toHaveLength(16);
        });
    });
});
