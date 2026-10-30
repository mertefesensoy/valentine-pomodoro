// covers: FR-SET-001, NFR-I18N-001, NFR-A11Y-003, NFR-A11Y-002
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ModeSheet } from '../../components/modes/ModeSheet';
import { StoreGate } from '../../stores/StoreGate';
import { useSettingsStore } from '../../stores/settingsStore';
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
