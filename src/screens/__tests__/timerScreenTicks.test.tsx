import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreGate } from '../../stores/StoreGate';
import TimerScreen from '../TimerScreen';
import { flightDurationToSeconds, haversineDistance } from '../../utils/geoMath';
import { parseAirports } from '../../utils/airportData';
import { readAirportsAsset } from '../../utils/airportAsset';

// Guards for plan §4.5 on the real screens (Phase 1 task A1). The probe test in
// context/__tests__/timerTextTicks.test.tsx proves the tick reaches the clock's readers;
// these prove the text the user sees on each screen changes every second. Both
// drive the screens only through the UI, so they keep working when Phase 1
// replaces storage (B2), the stores (B3) and the re-render chain (B4).
jest.useFakeTimers();

// The first test in the file pays for the first full render of TimerScreen and
// the modules it pulls in: 2.6–3.5 s of real time on the dev PC when idle, over
// Jest's 5 s default when the machine is busy. What the guards assert runs on
// fake timers, so a longer real-time limit doesn't weaken them.
jest.setTimeout(30_000);

// Starting a session first asks for notification permission, raced against a
// 1 s setTimeout. Under fake timers that timeout never fires on its own, so a
// permission stub that never settles would hold the session start forever.
// Denying permission settles the race on the first microtask, with no schedule.
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
}));

// The airport table for the precondition only. B1b made it a runtime asset;
// jest.setup.ts's readAirportsAsset reads the same file from disk.
// parseAirports doesn't touch the app's cache, so Fly still loads the table
// itself on first open, the way it does on a phone.
async function airportsByIata() {
    const list = parseAirports(await readAirportsAsset());
    return Object.fromEntries(list.map((a) => [a.iata, a]));
}

// The providers App.tsx puts above the tabs, plus the tab bar height the tab
// navigator would supply.
async function renderTimerScreen() {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>
                <BottomTabBarHeightContext.Provider value={0}>
                    <TimerScreen />
                </BottomTabBarHeightContext.Provider>
            </StoreGate>
        </GestureHandlerRootView>,
    );
    // Let every store finish loading from (empty) storage.
    await act(async () => {});
}

async function press(element: Parameters<typeof fireEvent.press>[0]) {
    await act(async () => {
        await fireEvent.press(element);
    });
}

// Pick an airport the way a user does: open the picker, search, tap the row.
// Searching by city keeps the airport inside the list's first rendered batch.
async function pickAirport(label: 'From' | 'To', city: string, iata: string) {
    await press(screen.getByLabelText(`Select ${label} airport`));
    await act(async () => {
        await fireEvent.changeText(screen.getByPlaceholderText('Search airports…'), city);
    });
    await press(screen.getByText(iata));
}

async function tick(ms: number) {
    await act(() => jest.advanceTimersByTime(ms));
}

describe('timer text on the real TimerScreen', () => {
    it('counts down every second in Classic mode', async () => {
        await renderTimerScreen();

        await press(screen.getByText('Start'));
        expect(screen.getByText('25:00')).toBeOnTheScreen();

        await tick(1_000);
        expect(screen.getByText('24:59')).toBeOnTheScreen();

        await tick(59_000);
        expect(screen.getByText('24:00')).toBeOnTheScreen();
    });

    it('counts down every second in Fly mode', async () => {
        // Precondition: Istanbul → Lublin is a 25-minute focus flight. If the
        // airport data or the duration formula changes, fix this pair, not the guard.
        const airports = await airportsByIata();
        const distanceKm = haversineDistance(
            airports.IST.coordinates.latitude, airports.IST.coordinates.longitude,
            airports.LUZ.coordinates.latitude, airports.LUZ.coordinates.longitude,
        );
        expect(flightDurationToSeconds(distanceKm)).toBe(25 * 60);

        await renderTimerScreen();
        await press(screen.getByLabelText('Switch to fly mode'));
        expect(screen.getByTestId('map-view')).toBeOnTheScreen();
        await pickAirport('From', 'istanbul', 'IST');
        await pickAirport('To', 'lublin', 'LUZ');

        await press(screen.getByText('✈️  Start Flight'));
        // The pill and the sheet both show the remaining time.
        expect(screen.getAllByText('25:00').length).toBeGreaterThan(0);

        await tick(1_000);
        expect(screen.getAllByText('24:59').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('25:00')).toHaveLength(0);

        await tick(59_000);
        expect(screen.getAllByText('24:00').length).toBeGreaterThan(0);
    });
});
