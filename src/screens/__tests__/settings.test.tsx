import type { ReactNode } from 'react';
import { AccessibilityInfo, Alert, Dimensions, LayoutAnimation, Linking, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { useSettingsFocus } from '../../stores/settingsFocusStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { space } from '../../theme/layout';
import { useStatsStore } from '../../stores/statsStore';
import { readLanguageChoice, saveLanguageChoice } from '../../i18n/languageChoice';
import SettingsScreen from '../SettingsScreen';

jest.mock('../../hooks/useUpdateCheck', () => ({
    useUpdateCheck: () => ({ checkForUpdates: jest.fn() }),
}));
// iOS's notification permission, per test: the reminder's notice tells a refusal from a failure.
jest.mock('expo-notifications', () => ({
    ...jest.requireActual<object>('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
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
        for (const mode of ['Light', 'Dark']) expect(screen.queryByText(mode)).toBeNull();
        // The one "System" is the Language row's (D3), not a theme choice.
        expect(screen.getAllByText('System')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'System' })).toBeOnTheScreen();
        expect(screen.getByText('Light or dark follows your iPhone.')).toBeOnTheScreen();
        expect(screen.getByLabelText('Facing pages')).toBeOnTheScreen();
    });
});

// covers: FR-STA-004
// Step 6 (D2 record §3.14): Stats' "Turn on a daily goal" opens Settings at the goal group (the
// Stats contract), which matters at large text sizes, where the group is below the fold.
describe('Settings opened at a group', () => {
    it('scrolls the goal group into view once it has laid out, then forgets the request', async () => {
        const scrollTo = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: () => void }, 'scrollTo');
        scrollTo.mockClear();
        useSettingsFocus.getState().request('goal');
        await renderSettings();
        const goalGroup = screen.getByText('Daily goal').parent!.parent!;
        await act(async () => fireEvent(goalGroup.parent!, 'layout', { nativeEvent: { layout: { x: 0, y: 64, width: 343, height: 2000 } } }));
        expect(scrollTo).not.toHaveBeenCalled();
        await act(async () => fireEvent(goalGroup, 'layout', { nativeEvent: { layout: { x: 0, y: 420, width: 343, height: 200 } } }));
        expect(scrollTo).toHaveBeenCalledWith({ y: 64 + 420 - space.s, animated: true });
        expect(useSettingsFocus.getState().section).toBeNull();
        scrollTo.mockRestore();
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

    // Build 52 device check (D2 record §3.17): five segments left "Custom" about a point too
    // narrow, so it wrapped and rode up out of its pill. In one row a label keeps one line.
    it('keeps each goal preset to one line in a row, shrinking "Custom" if it must', async () => {
        const jestWindow = Dimensions.get('window');
        const phone = { width: 393, height: 852, scale: 3, fontScale: 1 };
        try {
            await act(async () => Dimensions.set({ window: phone, screen: phone }));
            await renderSettings();
            const custom = screen.getByText('Custom');
            expect(custom.props.numberOfLines).toBe(1);
            expect(custom.props.adjustsFontSizeToFit).toBe(true);
        } finally {
            await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
        }
    });

    it('lets the presets wrap at AX sizes, where the control wraps into rows', async () => {
        // Jest's window is at font scale 2, an accessibility size.
        await renderSettings();
        expect(screen.getByText('Custom').props.numberOfLines).toBeUndefined();
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
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({ granted: false } as never);
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

    // Step 6 (D2 record §3.14): the store's false meant either; "Notifications are off" for a
    // failed schedule sent people to iOS Settings for nothing.
    it('says the reminder could not be set when iOS allows notifications but scheduling fails', async () => {
        const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({ granted: true } as never);
        await renderSettings();
        await act(async () => useSettingsStore.setState({ enableDailyReminder: async () => false } as never));
        await act(async () => fireEvent(screen.getByLabelText('Daily reminder'), 'valueChange', true));
        const failed = "The reminder couldn't be set. Try again in a moment.";
        expect(screen.getByText(failed)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(failed);
        expect(screen.queryByRole('button', { name: 'Open iOS Settings' })).toBeNull();
        announce.mockRestore();
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

// covers: FR-SET-005
// D3 (D3 record §3.4; the owner, 2026-11-01: "At the next launch is fine"): Settings › Language
// stores System, English or Türkçe, and the translator reads it at the next launch.
describe("Settings' language", () => {
    const selected = (name: string) => screen.getByRole('button', { name }).props.accessibilityState?.selected;

    it('starts on System, and stores a choice for the next launch without changing this one', async () => {
        await renderSettings();
        expect(screen.getByText('Language')).toBeOnTheScreen();
        expect(screen.getByText('A change takes effect after you close and reopen the app.')).toBeOnTheScreen();
        expect(selected('System')).toBe(true);
        await press(screen.getByRole('button', { name: 'Türkçe' }));
        expect(readLanguageChoice()).toBe('tr');
        expect(selected('Türkçe')).toBe(true);
        // The running language is this process's: still English until the app opens again.
        expect(screen.getByText('Language')).toBeOnTheScreen();
        await press(screen.getByRole('button', { name: 'System' }));
        expect(readLanguageChoice()).toBe('system');
    });

    it('shows the stored choice when Settings opens, and Reset leaves it alone', async () => {
        saveLanguageChoice('en');
        await renderSettings();
        expect(selected('English')).toBe(true);
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        await press(screen.getByRole('button', { name: 'Reset settings' }));
        const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
        await act(async () => buttons.find((b) => b.text === 'Reset')!.onPress!());
        expect(readLanguageChoice()).toBe('en');
        alert.mockRestore();
    });
});
