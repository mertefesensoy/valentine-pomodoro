import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { StoreGate } from '../../../stores/StoreGate';
import { useStatsViews } from '../../../stores/statsStore';
import { load, STORAGE_KEYS } from '../../../utils/storage';
import { resetStorage } from '../resetStorage';
import type { SessionClockState } from '../../../types';
import {
    CORRUPT_SESSION_CLOCK_ENTRIES,
    FRESH_INSTALL_ENTRIES,
    NOTES_NEVER_EDITED_ENTRIES,
    STATS_V1_USER,
    STATS_V1_USER_ENTRIES,
    V131_DEFAULT_LOVE_NOTES,
    V131_FULL,
    V131_FULL_ENTRIES,
    V131_KEYS,
} from '../v131';

// Phase 1 task A3. The fixtures are what B2's migration is tested against, so
// these tests check that each one is what it claims to be, using the v1.3.1
// readers that still ship today. Since B2 those readers go through the
// one-time AsyncStorage → MMKV migration, so seeding AsyncStorage and reading
// with load() also exercises the migrated path.

// AdPolicy.ts keeps its key private.
const AD_POLICY_KEY = 'ad_policy_v1';

// Keys the app starts writing after v1.3.1 go here (B2's migration flag, for
// one). A v1.3.1 install can't hold them, so the fixture must not grow them.
// Keys v1.4 added; a v1.3.1 install has none of them.
const NEW_SINCE_V131: string[] = ['welcome_v14', 'tutorial'];

const MISSING = Symbol('missing');

afterEach(async () => {
    await resetStorage();
});

describe('v1.3.1 storage fixtures', () => {
    it('the full install holds every key the app reads today', () => {
        expect(Object.keys(V131_FULL).sort()).toEqual([...V131_KEYS].sort());

        const readToday = [...Object.values(STORAGE_KEYS), AD_POLICY_KEY].filter((k) => !NEW_SINCE_V131.includes(k));
        for (const key of readToday) {
            expect(V131_KEYS).toContain(key);
        }
    });

    it('holds only plain JSON values', () => {
        // toStrictEqual sees an `undefined` field that JSON would silently drop.
        expect(JSON.parse(JSON.stringify(V131_FULL))).toStrictEqual(V131_FULL);
        expect(JSON.parse(JSON.stringify(STATS_V1_USER))).toStrictEqual(STATS_V1_USER);
    });

    it('full install: load() reads every key back unchanged', async () => {
        await AsyncStorage.multiSet(V131_FULL_ENTRIES);
        for (const key of V131_KEYS) {
            expect(await load<unknown>(key, MISSING)).toStrictEqual(V131_FULL[key]);
        }
    });

    it('fresh install: no keys at all', async () => {
        expect(FRESH_INSTALL_ENTRIES).toHaveLength(0);
        await AsyncStorage.multiSet(FRESH_INSTALL_ENTRIES);
        expect(await AsyncStorage.getAllKeys()).toHaveLength(0);
    });

    it('notes never edited: every key but love_notes, so the reader shows the v1.3.1 defaults', async () => {
        await AsyncStorage.multiSet(NOTES_NEVER_EDITED_ENTRIES);

        expect(await AsyncStorage.getItem(STORAGE_KEYS.LOVE_NOTES)).toBeNull();
        expect([...(await AsyncStorage.getAllKeys())].sort()).toEqual(
            V131_KEYS.filter((k) => k !== STORAGE_KEYS.LOVE_NOTES).sort(),
        );
        // Since B2 the migration writes these notes explicitly for an existing
        // install, so load() returns a stored copy rather than the default it is given.
        expect(await load(STORAGE_KEYS.LOVE_NOTES, [] as string[])).toEqual(V131_DEFAULT_LOVE_NOTES);
        expect(V131_DEFAULT_LOVE_NOTES).toHaveLength(20);
    });

    it('corrupt session_clock: load() falls back to the default, every other key still reads', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        await AsyncStorage.multiSet(CORRUPT_SESSION_CLOCK_ENTRIES);

        const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_CLOCK);
        expect(raw).not.toBeNull();
        expect(() => JSON.parse(raw!)).toThrow();

        const idle: SessionClockState = { activeKind: null, pomodoro: null, fly: null };
        expect(await load(STORAGE_KEYS.SESSION_CLOCK, idle)).toBe(idle);
        expect(consoleError).toHaveBeenCalledTimes(1);

        for (const key of V131_KEYS.filter((k) => k !== STORAGE_KEYS.SESSION_CLOCK)) {
            expect(await load<unknown>(key, MISSING)).toStrictEqual(V131_FULL[key]);
        }
        consoleError.mockRestore();
    });

    it('stats v1 user: no stats_v2, and the stats store migrates the v1 map with the same totals', async () => {
        await AsyncStorage.multiSet(STATS_V1_USER_ENTRIES);
        expect(await AsyncStorage.getItem(STORAGE_KEYS.STATS_V2)).toBeNull();

        function TotalsProbe() {
            const { totals } = useStatsViews();
            return <Text testID="totals">{`${totals.focusSessions}/${totals.focusMinutes}`}</Text>;
        }
        await render(<StoreGate><TotalsProbe /></StoreGate>);
        await act(async () => {});

        const days = Object.values(STATS_V1_USER.stats);
        const sessions = days.reduce((n, d) => n + d.focusSessions, 0);
        const minutes = days.reduce((n, d) => n + d.focusMinutes, 0);
        expect(screen.getByTestId('totals')).toHaveTextContent(`${sessions}/${minutes}`);

        // The stats store writes stats_v2 through the app's storage (MMKV since B2).
        const v2 = await load<{ days: Record<string, unknown> } | null>(STORAGE_KEYS.STATS_V2, null);
        expect(Object.keys(v2!.days).sort()).toEqual(Object.keys(STATS_V1_USER.stats).sort());
        expect(await AsyncStorage.getItem(STORAGE_KEYS.STATS_V2)).toBeNull();
    });
});
