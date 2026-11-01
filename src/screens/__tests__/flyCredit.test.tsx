import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreGate } from '../../stores/StoreGate';
import { useUiStore } from '../../stores/uiStore';
import TimerScreen from '../TimerScreen';
import { load, STORAGE_KEYS } from '../../utils/storage';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import type { StatsState } from '../../types';

// DEF-001: a Fly session credits its minutes to the day it started, with its
// session id, the same way a Pomodoro does. The flight is Istanbul → Lublin,
// the A1 guard's 25-minute pair (timerScreenTicks.test.tsx checks the duration),
// taking off at 23:50 on 30 Oct 2026, so it lands at 00:15 on the 31st.
jest.useFakeTimers({ now: new Date(2026, 9, 30, 23, 50) });

// See timerScreenTicks.test.tsx: the first full TimerScreen render is slow in
// real time; the assertions run on fake timers.
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

// The same steps as the A1 Fly guard: open the picker, search, tap the row.
async function pickAirport(label: 'From' | 'To', city: string, iata: string) {
    // Each picker is named in full for VoiceOver (D3 record §3.3).
    await press(screen.getByLabelText(label === 'From' ? 'Departure airport' : 'Arrival airport'));
    await act(async () => {
        await fireEvent.changeText(screen.getByPlaceholderText('Search airports…'), city);
    });
    await press(screen.getByText(iata));
}

afterEach(async () => {
    await resetStorage();
});

// covers: FR-STA-001, FR-STA-002
describe('a Fly session that lands after midnight (DEF-001)', () => {
    it('is credited to the day it took off, with its session id', async () => {
        await render(
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StoreGate>
                    <TimerScreen />
                </StoreGate>
            </GestureHandlerRootView>,
        );
        await act(async () => {});

        // Classic's Modes button opens the /modes sheet (Phase 1 D1); its Fly row calls this store action.
        await act(async () => useUiStore.getState().setActiveMode('fly'));
        await pickAirport('From', 'istanbul', 'IST');
        await pickAirport('To', 'lublin', 'LUZ');
        await press(screen.getByText('Start flight'));

        await act(() => jest.advanceTimersByTime(25 * 60_000 + 1_000));
        await act(async () => {});

        const stats = await load<StatsState | null>(STORAGE_KEYS.STATS_V2, null);
        expect(Object.keys(stats!.days)).toEqual(['2026-10-30']);
        expect(stats!.days['2026-10-30']).toMatchObject({ focusSessions: 1, focusMinutes: 25 });
        expect(stats!.lastAppliedSessionId).toEqual(expect.any(String));
    });
});
