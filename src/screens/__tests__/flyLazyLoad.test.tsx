import { Platform } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { StoreGate } from '../../stores/StoreGate';
import { useUiStore } from '../../stores/uiStore';
import { save, STORAGE_KEYS } from '../../utils/storage';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';

// Phase 1 task B1: TimerScreen loads Fly Mode with React.lazy, so FlyModeScreen
// and everything only it imports (react-native-maps, the airport data, Fly's
// audio) is evaluated the first time Fly opens, never on a cold start into
// Classic. The real FlyModeScreen is replaced here by a stub whose module factory
// records when it runs; the A1 guard (timerScreenTicks.test.tsx) covers the real one.
//
// Jest evaluates a module once per test file, so these tests run in order: the
// two that expect no evaluation come before the one that opens Fly.

// The first test pays for the first require('../TimerScreen'), which transforms
// and evaluates the whole screen graph: well under 5 s alone, over Jest's 5 s
// default during a full parallel run (B6 merge run, Stage C merge run). What the
// tests assert doesn't depend on time, so a longer limit doesn't weaken them.
// Same remedy as timerScreenTicks.test.tsx.
jest.setTimeout(30_000);

jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

const mockFlyModuleEvaluated = jest.fn();
jest.mock('../FlyModeScreen', () => {
    mockFlyModuleEvaluated();
    const React = require('react');
    const { Text } = require('react-native');
    return { __esModule: true, default: () => React.createElement(Text, null, 'Fly Mode stub') };
});

function setPlatform(os: typeof Platform.OS) {
    Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
}

// Required inside each test, not imported at the top: a static import of
// FlyModeScreen would run the factory above while mockFlyModuleEvaluated is
// still in its temporal dead zone, failing for the wrong reason.
async function renderTimerScreen() {
    const TimerScreen = require('../TimerScreen').default;
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>
                <TimerScreen />
            </StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

// covers: FR-FLY-004, FR-FLY-003
describe('Fly Mode is loaded lazily (B1)', () => {
    const originalOS = Platform.OS;

    afterEach(async () => {
        setPlatform(originalOS);
        await resetStorage();
    });

    it('a cold start into Classic does not evaluate FlyModeScreen', async () => {
        setPlatform('ios');
        await renderTimerScreen();

        expect(screen.getByText('Start focus')).toBeOnTheScreen();
        expect(mockFlyModuleEvaluated).not.toHaveBeenCalled();
    });

    it('on Android a stored fly mode never evaluates FlyModeScreen', async () => {
        setPlatform('android');
        await save(STORAGE_KEYS.APP_MODE, 'fly');
        await renderTimerScreen();

        expect(screen.getByText('Start focus')).toBeOnTheScreen();
        expect(screen.queryByLabelText('Switch to fly mode')).toBeNull();
        expect(mockFlyModuleEvaluated).not.toHaveBeenCalled();
    });

    it('switching to Fly evaluates FlyModeScreen once and shows it', async () => {
        setPlatform('ios');
        await renderTimerScreen();

        // Classic's Modes button opens the /modes sheet (Phase 1 D1); its Fly row calls this store action.
        await act(async () => useUiStore.getState().setActiveMode('fly'));

        expect(await screen.findByText('Fly Mode stub')).toBeOnTheScreen();
        expect(mockFlyModuleEvaluated).toHaveBeenCalledTimes(1);
        // The way back is the way in (build 48, F3): the Modes button, outside the Suspense
        // boundary so Classic stays reachable while Fly loads, opens the same /modes sheet.
        await fireEvent.press(screen.getByLabelText('Modes'));
        expect(router.push).toHaveBeenCalledWith('/modes');
        expect(screen.queryByText(/Default/)).toBeNull();
    });
});
