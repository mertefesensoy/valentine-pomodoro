import type { ReactNode } from 'react';
import { Linking } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { StoreGate } from '../../stores/StoreGate';
import { useSettingsStore } from '../../stores/settingsStore';
import SettingsScreen from '../SettingsScreen';

// Settings' Privacy group, as 1.5.0 turns it on (Phase 2 E2, NFR-PRIV-002).
jest.mock('../../constants/features', () => ({
    ...jest.requireActual('../../constants/features'),
    STARTUP_REPORTS_ENABLED: true,
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

describe('the Privacy group', () => {
    it('opens the policy, as Guideline 5.1.1(i) asks of an app', async () => {
        const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
        await render(<SettingsScreen />, { wrapper: Providers });
        await act(async () => {});
        await act(async () => {
            await fireEvent.press(screen.getByRole('button', { name: 'Privacy policy' }));
        });
        expect(open).toHaveBeenCalledWith('https://valentine-pomodoro-developer-websit.vercel.app/privacy/');
        open.mockRestore();
    });

    it('turns the start-up report off from the switch the policy names', async () => {
        await render(<SettingsScreen />, { wrapper: Providers });
        await act(async () => {});
        expect(useSettingsStore.getState().settings.shareStartupTimings).toBe(true);
        await act(async () => {
            await fireEvent(screen.getByRole('switch', { name: 'Share start-up timings' }), 'valueChange', false);
        });
        expect(useSettingsStore.getState().settings.shareStartupTimings).toBe(false);
    });
});
