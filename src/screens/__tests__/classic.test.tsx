// covers: FR-SET-001, NFR-I18N-001, NFR-A11Y-003, NFR-A11Y-002
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ModeSheet } from '../../components/modes/ModeSheet';
import { StoreGate } from '../../stores/StoreGate';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import { useUiStore } from '../../stores/uiStore';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
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

    it('sizes the Ring to the height its slot leaves, down to a floor', async () => {
        await onPhone(async () => {
            await show(<TimerScreen />);
            // Finish review fix 7: the slot reports the column's spare height, and the ring fills it.
            const slot = screen.getByTestId('ring-slot');
            const ringWidth = () => StyleSheet.flatten(screen.getByTestId('phase-ring').props.style).width;
            const layout = (height: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width: 345, height } } });
            await act(async () => fireEvent(slot, 'layout', layout(250)));
            expect(ringWidth()).toBe(250);
            await act(async () => fireEvent(slot, 'layout', layout(120)));
            expect(ringWidth()).toBe(200);
            // Never wider than its cap: 86 % of the 345 pt column.
            await act(async () => fireEvent(slot, 'layout', layout(600)));
            expect(ringWidth()).toBeCloseTo(345 * 0.86);
        });
    });
});
