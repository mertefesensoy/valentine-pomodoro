import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { StoreGate } from '../StoreGate';
import { useNotesStore } from '../notesStore';
import { useSessionStore } from '../sessionStore';
import { useSettingsStore } from '../settingsStore';
import { useStatsStore } from '../statsStore';
import { useUiStore } from '../uiStore';
import { DEFAULT_LOVE_NOTES, DEFAULT_SETTINGS } from '../../constants/defaults';
import { save, STORAGE_KEYS } from '../../utils/storage';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { V131_FULL, V131_FULL_ENTRIES } from '../../__fixtures__/storage/v131';

// Phase 1 B3: the stores hydrate synchronously from MMKV, so the first render
// below StoreGate already shows the stored values; no screen needs a loading
// state. Stored values here are written through save(), which runs the B2
// migration first, so MMKV holds the flag the way it does on every launch
// after the update.

// The full fixture has the daily reminder on, so the gate's reminder scheduler
// runs; deny permission so it stops before scheduling anything.
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
}));

type Snapshot = {
    themeMode: string;
    firstNote: string;
    goalMinutes: number;
    lastAppliedSessionId: string | undefined;
    pausedRemainingMs: number | null | undefined;
    phaseCount: number;
    activeMode: string;
};

let renders: Snapshot[] = [];

/** Records what every render sees, so a test can check the very first one. */
function Probe() {
    const snapshot: Snapshot = {
        themeMode: useSettingsStore((s) => s.settings.themeMode),
        firstNote: useNotesStore((s) => s.notes[0]),
        goalMinutes: useStatsStore((s) => s.goalMinutes),
        lastAppliedSessionId: useStatsStore((s) => s.lastAppliedSessionId),
        pausedRemainingMs: useSessionStore((s) => s.clock.pomodoro?.pausedRemainingMs),
        phaseCount: useSessionStore((s) => s.pomodoro.completedFocusCountInCycle),
        activeMode: useUiStore((s) => s.activeMode),
    };
    renders.push(snapshot);
    return <Text testID="probe">{snapshot.themeMode}</Text>;
}

const FULL_INSTALL: Snapshot = {
    themeMode: V131_FULL.settings.themeMode,
    firstNote: V131_FULL.love_notes[0],
    goalMinutes: V131_FULL.stats_v2.goalMinutes,
    lastAppliedSessionId: V131_FULL.stats_v2.lastAppliedSessionId,
    pausedRemainingMs: V131_FULL.session_clock.pomodoro!.pausedRemainingMs,
    phaseCount: V131_FULL.timer_state.completedFocusCountInCycle,
    activeMode: V131_FULL.app_mode,
};

beforeEach(() => {
    renders = [];
});

afterEach(async () => {
    await resetStorage();
});

// covers: FR-SET-001, FR-MIG-001
describe('StoreGate', () => {
    it('renders stored values on the first render after a launch', async () => {
        for (const [key, value] of Object.entries(V131_FULL)) {
            await save(key, value);
        }

        await render(<StoreGate><Probe /></StoreGate>);

        expect(renders[0]).toEqual(FULL_INSTALL);
    });

    it('right after the update, renders nothing until the migration has copied v1.3.1’s data', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);

        await render(<StoreGate><Probe /></StoreGate>);
        await act(async () => {});

        expect(screen.getByTestId('probe')).toHaveTextContent('dark');
        expect(renders[0]).toEqual(FULL_INSTALL);
    });

    it('falls back to the defaults for stored values of the wrong type, without throwing', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        await save(STORAGE_KEYS.SETTINGS, 42);
        await save(STORAGE_KEYS.REMINDER_V1, null);
        // The `{ notes }` shape src/types used to declare, which no version wrote.
        await save(STORAGE_KEYS.LOVE_NOTES, { notes: ['not a list'] });
        await save(STORAGE_KEYS.STATS_V2, 'not stats');
        await save(STORAGE_KEYS.SESSION_CLOCK, [1, 2, 3]);
        await save(STORAGE_KEYS.TIMER_STATE, null);
        await save(STORAGE_KEYS.APP_MODE, 7);
        await save(STORAGE_KEYS.GIFT_MODE, null);

        await render(<StoreGate><Probe /></StoreGate>);

        expect(renders[0]).toEqual({
            themeMode: DEFAULT_SETTINGS.themeMode,
            firstNote: DEFAULT_LOVE_NOTES[0],
            goalMinutes: 50,
            lastAppliedSessionId: undefined,
            pausedRemainingMs: undefined,
            phaseCount: 0,
            activeMode: 'default',
        });
        expect(useSettingsStore.getState().reminder.enabled).toBe(false);
        consoleError.mockRestore();
    });

    it('keeps a stored list of notes, and only a list of strings', async () => {
        await save(STORAGE_KEYS.LOVE_NOTES, ['one', 'two']);
        await render(<StoreGate><Probe /></StoreGate>);
        expect(useNotesStore.getState().notes).toEqual(['one', 'two']);
    });
});
