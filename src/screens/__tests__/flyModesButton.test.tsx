import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { StoreGate } from '../../stores/StoreGate';
import { useUiStore } from '../../stores/uiStore';
import TimerScreen from '../TimerScreen';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';

// Build 49 device check: Fly's Modes button belongs where Classic has it, at the
// top trailing corner, which Fly's compass held. It heads Fly's map-control
// column, so it slides clear of the landscape sheet with the compass
// (FlyModeScreen's mapControlsAnimatedStyle), and it opens the same /modes sheet
// as Classic's. The real FlyModeScreen renders here (jest.setup mocks
// react-native-maps); flyLazyLoad.test.tsx stubs it to check when it loads.
jest.useFakeTimers();

// See timerScreenTicks.test.tsx: the first full TimerScreen render is slow in
// real time; the assertions don't depend on it.
jest.setTimeout(30_000);

jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

afterEach(async () => {
    await resetStorage();
});

// No SRS row covers the way back between modes; the tag is for the labels it checks.
// covers: NFR-A11Y-003
describe("Fly's Modes button (after build 49)", () => {
    it('heads the map controls, above the compass, and opens the Modes sheet', async () => {
        await render(
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StoreGate>
                    <TimerScreen />
                </StoreGate>
            </GestureHandlerRootView>,
        );
        await act(async () => {});

        // Classic's Modes button opens the /modes sheet, which needs a navigator; its Fly row
        // calls this same store action (classic.test.tsx covers the sheet itself).
        await act(async () => useUiStore.getState().setActiveMode('fly'));
        expect(screen.getByTestId('map-view')).toBeOnTheScreen();

        // One Modes button in Fly, first in the column that holds the compass.
        expect(screen.getAllByLabelText('Modes')).toHaveLength(1);
        const buttons = within(screen.getByTestId('fly-map-controls')).getAllByRole('button');
        expect(buttons[0]).toHaveAccessibleName('Modes');
        expect(buttons[1]).toHaveAccessibleName('Reset map to north');

        await act(async () => {
            await fireEvent.press(buttons[0]);
        });
        expect(router.push).toHaveBeenCalledWith('/modes');
    });
});
