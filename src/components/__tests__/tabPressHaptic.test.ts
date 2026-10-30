import * as Haptics from 'expo-haptics';
import { tabPressHaptic } from '../tabPressHaptic';
import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_SETTINGS } from '../../constants/defaults';

// DEF-007: the tab bar's press haptic ignored the Haptics setting. It reads the
// setting from the settings store (Phase 1 B3). Since B6 it is the native tab
// bar's tabPress listener instead of a custom tab button (the router test
// presses a real tab). The haptic is iOS-only.
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

function pressTab(haptics: boolean) {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, haptics } });
    (Haptics.impactAsync as jest.Mock).mockClear();
    tabPressHaptic();
}

// covers: FR-SET-001
describe('tabPressHaptic', () => {
    it('gives a light haptic on press when Haptics is on', () => {
        pressTab(true);
        expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
        expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    });

    it('gives none when Haptics is off', () => {
        pressTab(false);
        expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('reads the setting at the moment of the press', () => {
        pressTab(false);
        useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, haptics: true } });
        tabPressHaptic();
        expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    });
});
