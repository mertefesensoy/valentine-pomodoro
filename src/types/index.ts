// Timer phase types
export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

// Theme mode types
export type ThemeMode = 'system' | 'light' | 'dark';

// Pomodoro state, stored under `timer_state` (session store, Phase 1 B3).
// Clock fields live in the session clock; this holds only what's specific to
// the Pomodoro experience. Pre-1.3 installs stored a wider shape under the same
// key (LegacyTimerState in src/__fixtures__/storage/v131.ts); the extra fields
// are ignored on read.
export interface PomodoroState {
    phase: TimerPhase;
    completedFocusCountInCycle: number;
    lastLoveNote: string | null;
}

// Quiet hours for daily reminders
export type QuietHours = {
    enabled: boolean;
    startHHMM: string; // "22:00"
    endHHMM: string;   // "08:00"
};

// Daily reminder settings
export interface ReminderSettings {
    enabled: boolean;
    timeHHMM: string; // "19:00"
    quietHours: QuietHours;
    notificationId?: string | null; // stored to cancel/reschedule
}

// Settings (persisted through src/utils/storage)
export interface Settings {
    durations: {
        focus: number; // minutes
        shortBreak: number;
        longBreak: number;
    };
    longBreakEvery: number; // e.g., 4 (long break after every N focus sessions)
    notifications: boolean;
    sound: boolean;
    haptics: boolean;
    showLoveNotes: boolean;
    themeMode: ThemeMode; // 'system' | 'light' | 'dark'
    animationsEnabled: boolean; // Background animations toggle
    flyModeSound: boolean; // Ambient cabin sound during Fly Mode sessions
}

// Stats per day (keyed by YYYY-MM-DD)
export interface DayStats {
    focusSessions: number;
    focusMinutes: number;
    // V2 additions (optional for migration)
    goalMinutes?: number;     // snapshot of goal for this day
    goalHit?: boolean;        // whether goal was reached
    goalHitAt?: string;       // ISO string timestamp of first goal hit
}

export type StatsMap = Record<string, DayStats>; // { "2026-01-07": { focusSessions: 3, focusMinutes: 75 }, ... }

// Streak state (V2)
export interface StreakState {
    current: number;          // current active streak
    best: number;             // best streak ever
    lastHitDayKey?: string;   // YYYY-MM-DD of last goal hit
}

// Stats state (V2)
export interface StatsState {
    days: StatsMap;           // all daily stats
    goalMinutes: number;      // user's daily goal setting
    streak: StreakState;      // streak tracking
    lastAppliedSessionId?: string; // NEW: idempotency - prevent double-counting
}

// Gift mode (persisted through src/utils/storage)
export interface GiftMode {
    hasSeenGiftMode: boolean;
}

// Love notes, stored under `love_notes` as a bare JSON array of strings, the
// shape every version since 1.0 has written (Stage A finding 2).
export type LoveNotes = string[];

// App mode — which timer experience is active
export type AppMode = 'default' | 'fly';

// Camera mode for Fly Mode map view
export type CameraMode = 'followPlane' | 'route' | 'free';

// ─── Session clock ─────────────────────────────────────────────────────────

export type SessionKind = 'pomodoro' | 'fly';

/** One timer slot in the two-slot session clock. */
export interface SessionSlot {
    isRunning: boolean;
    endAt: number | null;           // epoch ms (Date.now basis) when running
    pausedRemainingMs: number | null; // set when paused, null otherwise
    durationMs: number | null;
    sessionStartedAt: number | null;
    sessionId: string | null;
    // Pomodoro extras
    scheduledNotificationId?: string | null;
    sessionPlannedMinutes?: number | null;
    phase?: TimerPhase;
    completedFocusCountInCycle?: number;
    // Fly extras
    originIata?: string | null;
    destinationIata?: string | null;
}

export interface SessionClockState {
    activeKind: SessionKind | null;
    pomodoro: SessionSlot | null;
    fly: SessionSlot | null;
}
