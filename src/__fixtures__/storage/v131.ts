/**
 * v1.3.1 storage fixtures (Phase 1 task A3).
 *
 * What an existing install holds in AsyncStorage when v1.4 first launches, key
 * by key, in the exact shape v1.3.1 (release/ios-1.3.0, c527044) writes. B2's
 * MMKV migration is tested against these.
 *
 * The values are typed against the types the app reads them with (src/types,
 * plus AdState), so `tsc` fails here when one of those shapes
 * drifts. That is the signal to handle the old shape in the migration, not to
 * edit the fixture: the fixture is what is already on users' phones.
 *
 * The fixtures are TypeScript, not .json: a JSON import widens "dark" to
 * `string`, so it could not be checked against unions like ThemeMode without
 * casts. AsyncStorage holds JSON text per key; the *_ENTRIES arrays are exactly
 * that text, ready for AsyncStorage.multiSet.
 */

import type {
    AppMode,
    CameraMode,
    DayStats,
    GiftMode,
    LoveNotes,
    PomodoroState,
    ReminderSettings,
    SessionClockState,
    Settings,
    StatsMap,
    StatsState,
    TimerPhase,
} from '../../types';
import type { AdState } from '../../ads/AdPolicy';

// ─── Shapes with no type in src/types ────────────────────────────────────────

/**
 * timer_state as 1.0.x–1.2.x wrote it: the whole timer, clock fields included.
 * 1.3.0 moved the clock to session_clock and narrowed this key to
 * PomodoroState; the session store reads only `phase`,
 * `completedFocusCountInCycle` and `lastLoveNote` from either shape. Frozen
 * here in Phase 1 B3, when the type left src/types (Stage A finding 2).
 */
export interface LegacyTimerState {
    phase: TimerPhase;
    isRunning: boolean;
    endAt: number | null;
    remainingMs: number | null;
    completedFocusCountInCycle: number;
    scheduledNotificationId: string | null;
    sessionPlannedMinutes: number | null;
    lastHandledEndAt: number | null;
    sessionStartedAt: number | null;
    sessionId: string | null;
    lastLoveNote: string | null;
    lastTransitionId: number;
    showLoveNoteCard: boolean;
}

/**
 * update_meta: the soft-update prompt's state, written by 1.0.2 through 1.3.0
 * (d17141c). 1.3.1 neither reads nor writes it, so an upgraded install still
 * holds the last value. Frozen here because no code defines it any more.
 */
export type LegacyUpdateMeta = {
    lastCheckAt: number;
    lastPromptedVersion: string | null;
};

/**
 * fly_session: 1.3.0's paused-flight snapshot (b82dbed). Cleared with `null` on
 * reset; replaced by session_clock's fly slot. 1.3.1 neither reads nor writes
 * it, so the key is orphaned on installs that used Fly in 1.3.0.
 */
export type LegacyFlySession = {
    originIata: string;
    destinationIata: string;
    remainingMs: number;
} | null;

/** fly_prefs: FlyModeScreen writes `{ cameraMode, isGlobe }` with an inline type. */
export type FlyPrefs = {
    cameraMode: CameraMode;
    isGlobe: boolean;
};

// ─── v1.3.1 ──────────────────────────────────────────────────────────────────

/** Every key a v1.3.1 install can hold, with the type it is read as. */
export interface V131Storage {
    timer_state: PomodoroState;
    /** v1.3.1 never wrote `classicLayout`; Phase 1 D1 added it, and the settings merge fills it in. */
    settings: Omit<Settings, 'classicLayout'>;
    /** The 1.0.x map. useStats copies it into stats_v2 once and never deletes it. */
    stats: StatsMap;
    stats_v2: StatsState;
    gift_mode: GiftMode;
    /** A bare array of strings (src/types `LoveNotes` since Phase 1 B3). */
    love_notes: LoveNotes;
    update_meta: LegacyUpdateMeta;
    reminder_v1: ReminderSettings;
    app_mode: AppMode;
    fly_session: LegacyFlySession;
    session_clock: SessionClockState;
    fly_prefs: FlyPrefs;
    ad_policy_v1: AdState;
}

export const V131_KEYS: readonly (keyof V131Storage)[] = [
    'timer_state',
    'settings',
    'stats',
    'stats_v2',
    'gift_mode',
    'love_notes',
    'update_meta',
    'reminder_v1',
    'app_mode',
    'fly_session',
    'session_clock',
    'fly_prefs',
    'ad_policy_v1',
];

/**
 * The 20 default notes v1.3.1 shows when love_notes is absent, copied from
 * release/ios-1.3.0:src/constants/defaults.ts. Frozen here because D2 replaces
 * DEFAULT_LOVE_NOTES with name-free notes, and B2 must write *these* for an
 * existing install that never edited its notes.
 */
export const V131_DEFAULT_LOVE_NOTES: string[] = [
    "Bengisu, tiny focus — big love 💗",
    "I'm proud of you — truly.",
    "One pomodoro closer to your dreams",
    "Breathe in… breathe out… you've got this",
    "Focus now, hugs later 🫶",
    "Your effort is the cutest thing",
    "Gentle focus, strong heart 💗",
    "Small steps, big heart 💘",
    "May your focus be cozy and your breaks sweet",
    "Keep going, you're unstoppable",
    "I believe in you, always",
    "Every session brings you closer",
    "You make hard work look easy",
    "Pomodoro by pomodoro, you're shining",
    "Rest well, you've earned it 💗",
    "Your dedication is beautiful",
    "You're amazing, Bengisu",
    "You've got this 🌸",
    "Tiny victories, infinite love",
    "Break time = self-care time 💕",
];

/**
 * An iOS install that started on 1.0.x and is now on 1.3.1, with every key
 * present: a paused Pomodoro and a paused flight in the two clock slots, edited
 * notes (Turkish İ/ı and emoji included, to catch encoding loss), a reminder,
 * non-default settings, and stats from both eras.
 */
export const V131_FULL: V131Storage = {
    timer_state: {
        phase: 'focus',
        completedFocusCountInCycle: 2,
        lastLoveNote: 'İyi ki varsın 🌸',
    },
    settings: {
        durations: { focus: 50, shortBreak: 10, longBreak: 20 },
        longBreakEvery: 3,
        notifications: true,
        sound: false,
        haptics: true,
        showLoveNotes: true,
        themeMode: 'dark',
        animationsEnabled: false,
        flyModeSound: true,
    },
    stats: {
        '2026-01-08': { focusSessions: 2, focusMinutes: 50 },
        '2026-01-09': { focusSessions: 4, focusMinutes: 100 },
    },
    stats_v2: {
        days: {
            // Days copied from the v1 map: no goal snapshot, goalHit false.
            '2026-01-08': { focusSessions: 2, focusMinutes: 50, goalHit: false },
            '2026-01-09': { focusSessions: 4, focusMinutes: 100, goalHit: false },
            // Days recorded by incrementFocus.
            '2026-10-27': { focusSessions: 1, focusMinutes: 50, goalMinutes: 100, goalHit: false },
            '2026-10-28': {
                focusSessions: 2,
                focusMinutes: 100,
                goalMinutes: 100,
                goalHit: true,
                goalHitAt: '2026-10-28T14:52:10.000Z',
            },
        },
        goalMinutes: 100,
        streak: { current: 1, best: 3, lastHitDayKey: '2026-10-28' },
        lastAppliedSessionId: '1761660000000-q8w2e4r6t',
    },
    gift_mode: { hasSeenGiftMode: true },
    love_notes: [
        "I'm proud of you — truly.",
        'One pomodoro closer to your dreams',
        'Study date at the library? 📚',
        'İyi ki varsın 🌸',
    ],
    update_meta: { lastCheckAt: 1771200000000, lastPromptedVersion: '1.2.2' },
    reminder_v1: {
        enabled: true,
        timeHHMM: '20:30',
        quietHours: { enabled: true, startHHMM: '23:00', endHHMM: '08:00' },
        notificationId: '6f1c2a9e-reminder',
    },
    app_mode: 'default',
    fly_session: { originIata: 'IST', destinationIata: 'LUZ', remainingMs: 912000 },
    session_clock: {
        activeKind: 'pomodoro',
        pomodoro: {
            isRunning: false,
            endAt: null,
            pausedRemainingMs: 1754000,
            durationMs: 3000000,
            sessionStartedAt: 1761746400000,
            sessionId: '1761746400000-m3k9x2p1q',
            phase: 'focus',
            completedFocusCountInCycle: 2,
            sessionPlannedMinutes: 50,
            scheduledNotificationId: null,
        },
        fly: {
            isRunning: false,
            endAt: null,
            pausedRemainingMs: 900000,
            durationMs: 1500000,
            sessionStartedAt: 1761740000000,
            sessionId: '1761740000000-z7y6x5w4v',
            originIata: 'IST',
            destinationIata: 'LUZ',
            scheduledNotificationId: null,
        },
    },
    fly_prefs: { cameraMode: 'route', isGlobe: true },
    ad_policy_v1: { sessionsSinceLastAd: 1, lastShownAt: 1761700000000 },
};

// ─── Stats v1 user (a 1.0.0 install never opened since) ──────────────────────

/**
 * What 1.0.0 wrote. stats_v2 first shipped in 1.2.x (February 2026), so an
 * install last opened on 1.0.0–1.0.3 still has only the v1 stats map, and
 * older shapes everywhere else. 1.0.0 is the oldest of these and lacks the most
 * fields. love_notes is absent because it was never edited: B2 must still see
 * this as an existing install and write the v1.3.1 default notes.
 */
export interface V100Storage {
    timer_state: Omit<LegacyTimerState, 'sessionStartedAt' | 'sessionId'>;
    settings: Omit<Settings, 'themeMode' | 'animationsEnabled' | 'flyModeSound' | 'classicLayout'>;
    stats: Record<string, Pick<DayStats, 'focusSessions' | 'focusMinutes'>>;
    gift_mode: GiftMode;
}

export const STATS_V1_USER: V100Storage = {
    timer_state: {
        phase: 'shortBreak',
        isRunning: false,
        endAt: null,
        remainingMs: null,
        completedFocusCountInCycle: 1,
        scheduledNotificationId: null,
        sessionPlannedMinutes: 25,
        lastHandledEndAt: 1767880000000,
        lastLoveNote: 'Gentle focus, strong heart 💗',
        lastTransitionId: 3,
        showLoveNoteCard: false,
    },
    settings: {
        durations: { focus: 25, shortBreak: 5, longBreak: 15 },
        longBreakEvery: 4,
        notifications: true,
        sound: true,
        haptics: false,
        showLoveNotes: true,
    },
    stats: {
        '2026-01-07': { focusSessions: 1, focusMinutes: 25 },
        '2026-01-08': { focusSessions: 3, focusMinutes: 75 },
    },
    gift_mode: { hasSeenGiftMode: true },
};

// ─── Raw AsyncStorage entries ────────────────────────────────────────────────

export type RawEntries = [key: string, value: string][];

/** Each value as AsyncStorage holds it: the JSON text `save()` writes. */
export function toRawEntries(values: object): RawEntries {
    return Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]);
}

export const V131_FULL_ENTRIES: RawEntries = toRawEntries(V131_FULL);

export const FRESH_INSTALL_ENTRIES: RawEntries = [];

export const NOTES_NEVER_EDITED_ENTRIES: RawEntries = V131_FULL_ENTRIES.filter(([key]) => key !== 'love_notes');

/**
 * session_clock is the most-written key (every start, pause, resume, stop and
 * mode switch), so it is the one most exposed to a write torn by a crash or a
 * full disk. The rest of the install is intact.
 */
export const TORN_SESSION_CLOCK = '{"activeKind":"pomodoro","pomodoro":{"isRunning":fal';

export const CORRUPT_SESSION_CLOCK_ENTRIES: RawEntries = V131_FULL_ENTRIES.map(([key, value]) =>
    key === 'session_clock' ? [key, TORN_SESSION_CLOCK] : [key, value],
);

export const STATS_V1_USER_ENTRIES: RawEntries = toRawEntries(STATS_V1_USER);
