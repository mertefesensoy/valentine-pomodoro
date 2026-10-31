import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreGate } from '../../stores/StoreGate';
import { useUiStore } from '../../stores/uiStore';
import TimerScreen from '../TimerScreen';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';

// Build 51 device check: during a flight, tapping Fly's camera button flicked to the next mode's
// icon and snapped back to the hand. Fly's own camera moves (following the plane, fitting the
// route) fire the map's onRegionChange, which entered free mode on every move. Now only a move
// while a finger is on the map does.
jest.useFakeTimers({ now: new Date(2026, 9, 31, 12, 0) });
jest.setTimeout(30_000);

// Deny notification permission so the session start isn't held by the 1 s race.
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
}));

async function press(element: Parameters<typeof fireEvent.press>[0]) {
    await act(async () => {
        await fireEvent.press(element);
    });
}

async function pickAirport(label: 'From' | 'To', city: string, iata: string) {
    await press(screen.getByLabelText(`Select ${label} airport`));
    await act(async () => {
        await fireEvent.changeText(screen.getByPlaceholderText('Search airports…'), city);
    });
    await press(screen.getByText(iata));
}

const REGION = { latitude: 45, longitude: 25, latitudeDelta: 10, longitudeDelta: 10 };
const camera = () => screen.getByLabelText(/^Camera mode:/).props.accessibilityLabel as string;
async function mapEvent(name: string, ...args: unknown[]) {
    await act(async () => {
        await fireEvent(screen.getByTestId('map-view'), name, ...args);
    });
}

afterEach(async () => {
    await resetStorage();
});

// covers: FR-FLY-003
describe("Fly's camera mode during a flight (build 51 device check)", () => {
    it("changes with the camera button and with a finger on the map, not with Fly's own camera moves", async () => {
        await render(
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StoreGate>
                    <TimerScreen />
                </StoreGate>
            </GestureHandlerRootView>,
        );
        await act(async () => {});
        await act(async () => useUiStore.getState().setActiveMode('fly'));
        await pickAirport('From', 'istanbul', 'IST');
        await pickAirport('To', 'lublin', 'LUZ');
        await press(screen.getByText('Start flight'));
        await act(() => jest.advanceTimersByTime(3_000));

        expect(camera()).toMatch(/followPlane/);
        // Fly following the plane moves the camera itself: the mode stays.
        await mapEvent('regionChange', REGION);
        expect(camera()).toMatch(/followPlane/);

        // The button cycles to the whole route, and Fly fitting the route keeps it.
        await press(screen.getByLabelText(/^Camera mode:/));
        expect(camera()).toMatch(/route/);
        await mapEvent('regionChange', REGION);
        expect(camera()).toMatch(/route/);

        // The user's own pan enters free mode.
        await mapEvent('touchStart');
        await mapEvent('regionChange', REGION);
        expect(camera()).toMatch(/free/);
        await mapEvent('touchEnd');

        // After the flick settles, the button brings the camera back, and it stays.
        await act(() => jest.advanceTimersByTime(1_000));
        await press(screen.getByLabelText(/^Camera mode:/));
        expect(camera()).toMatch(/followPlane/);
        await mapEvent('regionChange', REGION);
        expect(camera()).toMatch(/followPlane/);
    });
});
