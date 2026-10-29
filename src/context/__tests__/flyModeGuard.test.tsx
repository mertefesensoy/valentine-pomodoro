import { Platform, Pressable, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppProvider, useApp } from '../AppContext';
import { STORAGE_KEYS } from '../../utils/storage';

// The Android crash loop: a persisted app_mode of 'fly' relaunched straight into
// Fly Mode, which cannot open on Android. AppProvider must resolve it to 'default'.
function ModeProbe() {
    const app = useApp();
    return (
        <>
            <Text testID="mode">{app.activeMode}</Text>
            <Pressable testID="to-fly" onPress={() => app.setActiveMode('fly')} />
        </>
    );
}

function setPlatform(os: typeof Platform.OS) {
    Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
}

describe('stored Fly Mode guard', () => {
    const originalOS = Platform.OS;

    afterEach(async () => {
        setPlatform(originalOS);
        await AsyncStorage.clear();
    });

    it('opens in default mode on Android when fly was stored', async () => {
        setPlatform('android');
        await AsyncStorage.setItem(STORAGE_KEYS.APP_MODE, JSON.stringify('fly'));

        await render(<AppProvider><ModeProbe /></AppProvider>);
        await act(async () => {});

        expect(screen.getByTestId('mode')).toHaveTextContent('default');
    });

    it('ignores a request to switch to fly on Android', async () => {
        setPlatform('android');
        await render(<AppProvider><ModeProbe /></AppProvider>);
        await act(async () => {});

        await act(async () => {
            await fireEvent.press(screen.getByTestId('to-fly'));
        });

        expect(screen.getByTestId('mode')).toHaveTextContent('default');
        expect(await AsyncStorage.getItem(STORAGE_KEYS.APP_MODE)).not.toBe(JSON.stringify('fly'));
    });

    it('still restores fly on iOS', async () => {
        setPlatform('ios');
        await AsyncStorage.setItem(STORAGE_KEYS.APP_MODE, JSON.stringify('fly'));

        await render(<AppProvider><ModeProbe /></AppProvider>);
        await act(async () => {});

        expect(screen.getByTestId('mode')).toHaveTextContent('fly');
    });
});
