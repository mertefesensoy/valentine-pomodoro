import type { ReactNode } from 'react';
import { AccessibilityInfo, Alert, LayoutAnimation, Linking } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import SettingsScreen from '../SettingsScreen';

jest.mock('../../hooks/useUpdateCheck', () => ({
    useUpdateCheck: () => ({ checkForUpdates: jest.fn() }),
}));
// Reduce Motion, per test (Reanimated runs on its Jest mock).
let mockReduceMotion = false;
jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual<object>('react-native-reanimated/mock'),
    useReducedMotion: () => mockReduceMotion,
}));
jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

function Providers({ children }: { children: ReactNode }) {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{children}</StoreGate>
        </GestureHandlerRootView>
    );
}

async function renderSettings() {
    await render(<SettingsScreen />, { wrapper: Providers });
    await act(async () => {});
}

async function press(target: Parameters<typeof fireEvent.press>[0]) {
    await act(async () => {
        await fireEvent.press(target);
    });
}

// A row's wheel carries the row's label; the row itself is the first match, the wheel the second.
const wheelFor = (label: string) => screen.getAllByLabelText(label)[1];
async function spin(label: string, value: number) {
    await act(async () => {
        await fireEvent(wheelFor(label), 'valueChange', value, 0);
    });
}

beforeEach(() => {
    mockReduceMotion = false;
    return resetStorage();
});

// covers: FR-SET-001, NFR-A11Y-003
// D2 Settings contract: an inset grouped list of native controls, no bounded number typed.
describe('Settings as a native grouped list', () => {
    it("shows each duration as a value, Custom's, and opens its wheel under the row", async () => {
        await renderSettings();
        const focus = screen.getByRole('button', { name: 'Focus' });
        expect(focus).toHaveAccessibilityValue({ text: '25 min' });
        expect(screen.getAllByLabelText('Focus')).toHaveLength(1);
        await press(focus);
        expect(screen.getByRole('button', { name: 'Focus' })).toBeExpanded();
        expect(screen.getAllByLabelText('Focus')).toHaveLength(2);
        // One wheel open at a time.
        await press(screen.getByRole('button', { name: 'Short break' }));
        expect(screen.getAllByLabelText('Focus')).toHaveLength(1);
        expect(screen.getAllByLabelText('Short break')).toHaveLength(2);
    });

    it('a new focus length from the wheel selects Custom and is the one in use (build 48, F4)', async () => {
        await renderSettings();
        await press(screen.getByRole('button', { name: 'Focus' }));
        await spin('Focus', 40);
        const { settings } = useSettingsStore.getState();
        expect(settings.presetChoice).toBe('custom');
        expect(settings.durations).toEqual({ focus: 40, shortBreak: 5, longBreak: 15 });
        expect(settings.customDurations).toEqual({ focus: 40, shortBreak: 5, longBreak: 15 });
        expect(screen.getByRole('button', { name: 'Focus' })).toHaveAccessibilityValue({ text: '40 min' });
    });

    it('the long-break interval reads in sessions and sets from its wheel', async () => {
        await renderSettings();
        const row = screen.getByRole('button', { name: 'Long break every' });
        expect(row).toHaveAccessibilityValue({ text: '4 sessions' });
        await press(row);
        await spin('Long break every', 6);
        expect(useSettingsStore.getState().settings.longBreakEvery).toBe(6);
    });

    // Review round (D2 record §3.12, HIG T-1): the switch carries the label, so the label's text
    // isn't a second VoiceOver stop.
    it('makes a switch row one VoiceOver stop', async () => {
        await renderSettings();
        expect(screen.getByText('Sound').props.accessible).toBe(false);
        expect(screen.getByLabelText('Sound')).toHaveProp('value', true);
    });

    it('has no appearance switch: light or dark follows the iPhone (the owner, D2)', async () => {
        await renderSettings();
        for (const mode of ['System', 'Light', 'Dark']) expect(screen.queryByText(mode)).toBeNull();
        expect(screen.getByText('Light or dark follows your iPhone.')).toBeOnTheScreen();
        expect(screen.getByLabelText('Facing pages')).toBeOnTheScreen();
    });
});

// covers: NFR-A11Y-004
// Review round (D2 record §3.12, motion review): a wheel fades in and out with ease-out while the
// rows below move with ease-in-out; Reduce Motion keeps the fade and drops the movement; every
// way a wheel closes animates alike.
describe("Settings' wheel motion", () => {
    const fade = { type: 'easeOut', property: 'opacity' };

    it('fades a wheel in and moves the rows below', async () => {
        const next = jest.spyOn(LayoutAnimation, 'configureNext').mockImplementation(() => {});
        await renderSettings();
        await press(screen.getByRole('button', { name: 'Focus' }));
        expect(next).toHaveBeenLastCalledWith({ duration: 200, create: fade, update: { type: 'easeInEaseOut' }, delete: fade });
        next.mockRestore();
    });

    it('only fades it with Reduce Motion: the rows below settle at once', async () => {
        mockReduceMotion = true;
        const next = jest.spyOn(LayoutAnimation, 'configureNext').mockImplementation(() => {});
        await renderSettings();
        await press(screen.getByRole('button', { name: 'Focus' }));
        expect(next).toHaveBeenLastCalledWith({ duration: 200, create: fade, delete: fade });
        next.mockRestore();
    });

    it('closes the Custom goal wheel with the same motion when a preset is chosen', async () => {
        const next = jest.spyOn(LayoutAnimation, 'configureNext').mockImplementation(() => {});
        await renderSettings();
        await press(screen.getByLabelText('Custom'));
        expect(screen.getByRole('button', { name: 'Custom goal' })).toBeExpanded();
        const opened = next.mock.calls.length;
        await press(screen.getByLabelText('75 minutes a day'));
        expect(next.mock.calls.length).toBe(opened + 1);
        expect(screen.queryByRole('button', { name: 'Custom goal' })).toBeNull();
        next.mockRestore();
    });
});

// covers: FR-STA-004
// The goal: the four presets, or any custom value from 1 to 1,440 on a wheel; off is the switch.
describe("Settings' daily goal", () => {
    it('selects a preset, then a custom value, and keeps it through off and on', async () => {
        await renderSettings();
        // Plain numbers under one caption, so "100" never wraps (build 51 device check).
        expect(screen.getByText('Minutes a day')).toBeOnTheScreen();
        expect(screen.getByText('100')).toBeOnTheScreen();
        expect(screen.getByLabelText('50 minutes a day')).toBeSelected();
        await press(screen.getByLabelText('75 minutes a day'));
        expect(useStatsStore.getState().goalMinutes).toBe(75);

        await press(screen.getByLabelText('Custom'));
        expect(screen.getByLabelText('Custom')).toBeSelected();
        expect(screen.getByRole('button', { name: 'Custom goal' })).toBeExpanded();
        await spin('Custom goal', 33);
        expect(useStatsStore.getState().goalMinutes).toBe(33);

        const toggle = screen.getByLabelText('Set a daily goal');
        await act(async () => fireEvent(toggle, 'valueChange', false));
        expect(useStatsStore.getState().goalMinutes).toBe(0);
        expect(screen.queryByLabelText('50 minutes a day')).toBeNull();
        await act(async () => fireEvent(screen.getByLabelText('Set a daily goal'), 'valueChange', true));
        expect(useStatsStore.getState().goalMinutes).toBe(33);
    });

    it('opens a stored off-preset goal on Custom, with its value', async () => {
        await act(async () => useStatsStore.getState().setGoalMinutes(600));
        await renderSettings();
        expect(screen.getByRole('button', { name: 'Custom goal' })).toHaveAccessibilityValue({ text: '600 min' });
    });
});

// covers: FR-SET-001
describe("Settings' notifications, About and reset", () => {
    it('says why the reminder is off when iOS denies notifications, with a way to iOS Settings', async () => {
        const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
        const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
        await renderSettings();
        await act(async () => useSettingsStore.setState({ enableDailyReminder: async () => false } as never));
        await act(async () => fireEvent(screen.getByLabelText('Daily reminder'), 'valueChange', true));
        const denied = "Notifications are off for this app in iOS Settings, so the reminder can't be set.";
        expect(screen.getByText(denied)).toBeOnTheScreen();
        // iOS has no live regions: VoiceOver hears it from an announcement (review round, X-1).
        expect(announce).toHaveBeenCalledWith(denied);
        announce.mockRestore();
        await press(screen.getByRole('button', { name: 'Open iOS Settings' }));
        expect(openSettings).toHaveBeenCalled();
        openSettings.mockRestore();
    });

    it("carries the app's origin in About, where v1's gift screen used to, and replays the welcome", async () => {
        await renderSettings();
        expect(screen.getByText('Valentine Pomodoro began as a gift for Bengisu.')).toBeOnTheScreen();
        await press(screen.getByRole('button', { name: 'Watch the welcome again' }));
        expect(router.push).toHaveBeenCalledWith('/welcome');
    });

    it('resets after a confirmation that says what it keeps', async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        await act(async () => useSettingsStore.getState().updateSettings({ longBreakEvery: 7, sound: false }));
        await renderSettings();
        await press(screen.getByRole('button', { name: 'Reset settings' }));
        const [title, message, buttons] = alert.mock.calls[0] as [string, string, { text: string; onPress?: () => void }[]];
        expect(title).toBe('Reset settings?');
        expect(message).toMatch(/notes, stats, goal and reminders stay/);
        await act(async () => buttons.find((b) => b.text === 'Reset')!.onPress!());
        expect(useSettingsStore.getState().settings).toMatchObject({ longBreakEvery: 4, sound: true });
        alert.mockRestore();
    });
});
