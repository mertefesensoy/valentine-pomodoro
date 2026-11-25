import type { ReactNode } from 'react';
import { Linking } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { StoreGate } from '../../stores/StoreGate';
import SettingsScreen from '../SettingsScreen';

// Settings as Android build 1 has it (the Android closed-test plan, Stage 1): no pairing and no start-up reports,
// which the flags say, and no Fly, which isFlyModeAvailable says. Google Play still wants the privacy policy inside
// the app, so its link stays without the switch it used to sit with.
jest.mock('../../constants/features', () => ({
    ...jest.requireActual('../../constants/features'),
    PAIRING_ENABLED: false,
    STARTUP_REPORTS_ENABLED: false,
    isFlyModeAvailable: () => false,
}));
jest.mock('../../hooks/useUpdateCheck', () => ({
    useUpdateCheck: () => ({ checkForUpdates: jest.fn() }),
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

beforeEach(async () => {
    await resetStorage();
});

describe('Settings without pairing, start-up reports or Fly', () => {
    it('keeps the privacy policy link, without the timings switch or its footer', async () => {
        const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
        await render(<SettingsScreen />, { wrapper: Providers });
        await act(async () => {});
        expect(screen.queryByRole('switch', { name: 'Share start-up timings' })).toBeNull();
        expect(screen.queryByText(/Sends how long the app took to open/)).toBeNull();
        await act(async () => {
            await fireEvent.press(screen.getByRole('button', { name: 'Privacy policy' }));
        });
        expect(open).toHaveBeenCalledWith('https://valentine-pomodoro-developer-websit.vercel.app/privacy/');
        open.mockRestore();
    });

    it('shows no Fly group and no way to pair', async () => {
        await render(<SettingsScreen />, { wrapper: Providers });
        await act(async () => {});
        expect(screen.queryByRole('switch', { name: 'Ambient sounds' })).toBeNull();
        expect(screen.queryByText('Pair with your partner')).toBeNull();
    });
});
