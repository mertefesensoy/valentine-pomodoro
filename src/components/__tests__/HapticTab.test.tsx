import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { HapticTab } from '../HapticTab';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_SETTINGS } from '../../constants/defaults';

// DEF-007: the tab bar's press haptic ignored the Haptics setting. It now reads
// the setting from the settings store (Phase 1 B3). The haptic is iOS-only.
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(async () => {}),
    ImpactFeedbackStyle: { Light: 'light' },
}));

const originalOS = process.env.EXPO_OS;
beforeAll(() => {
    process.env.EXPO_OS = 'ios';
});
afterAll(() => {
    process.env.EXPO_OS = originalOS;
});

async function pressTab(haptics: boolean) {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, haptics } });
    (Haptics.impactAsync as jest.Mock).mockClear();
    // PlatformPressable reads the navigation theme, as it does in the tab bar.
    await render(
        <NavigationContainer>
            <HapticTab>
                <Text>Timer</Text>
            </HapticTab>
        </NavigationContainer>,
    );
    await act(async () => {
        await fireEvent(screen.getByText('Timer'), 'pressIn');
    });
}

// covers: FR-SET-001
describe('HapticTab', () => {
    it('gives a light haptic on press when Haptics is on', async () => {
        await pressTab(true);
        expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });

    it('gives none when Haptics is off', async () => {
        await pressTab(false);
        expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
});
