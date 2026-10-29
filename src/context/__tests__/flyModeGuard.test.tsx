import { Platform, Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StoreGate } from '../../stores/StoreGate';
import { useUiStore } from '../../stores/uiStore';
import { load, save, STORAGE_KEYS } from '../../utils/storage';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';

// The Android crash loop: a persisted app_mode of 'fly' relaunched straight into
// Fly Mode, which cannot open on Android. The UI store must resolve it to 'default'
// (it lived in AppProvider before Phase 1 B3).
// Stored state is written and read through the app's storage helpers (MMKV
// since Phase 1 B2), not AsyncStorage, which the app no longer writes.
function ModeProbe() {
    const activeMode = useUiStore((s) => s.activeMode);
    const setActiveMode = useUiStore((s) => s.setActiveMode);
    return (
        <>
            <Text testID="mode">{activeMode}</Text>
            <Pressable testID="to-fly" onPress={() => setActiveMode('fly')} />
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
        await resetStorage();
    });

    it('opens in default mode on Android when fly was stored', async () => {
        setPlatform('android');
        await save(STORAGE_KEYS.APP_MODE, 'fly');

        await render(<StoreGate><ModeProbe /></StoreGate>);
        await act(async () => {});

        expect(screen.getByTestId('mode')).toHaveTextContent('default');
    });

    it('ignores a request to switch to fly on Android', async () => {
        setPlatform('android');
        await render(<StoreGate><ModeProbe /></StoreGate>);
        await act(async () => {});

        await act(async () => {
            await fireEvent.press(screen.getByTestId('to-fly'));
        });

        expect(screen.getByTestId('mode')).toHaveTextContent('default');
        expect(await load(STORAGE_KEYS.APP_MODE, 'nothing stored')).not.toBe('fly');
    });

    it('still restores fly on iOS', async () => {
        setPlatform('ios');
        await save(STORAGE_KEYS.APP_MODE, 'fly');

        await render(<StoreGate><ModeProbe /></StoreGate>);
        await act(async () => {});

        expect(screen.getByTestId('mode')).toHaveTextContent('fly');
    });
});
