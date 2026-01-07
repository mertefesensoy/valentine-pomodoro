// Timer phase types
export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

// Timer state (persisted to AsyncStorage)
export interface TimerState {
    phase: TimerPhase;
    isRunning: boolean;
    endAt: number | null; // epoch ms when running
    remainingMs: number | null; // cached when paused
    completedFocusCountInCycle: number; // 0..N for long break logic
    scheduledNotificationId: string | null; // ID of scheduled notification
    sessionPlannedMinutes: number | null; // Actual duration for this session (stats accuracy)
    lastHandledEndAt: number | null; // Idempotency: prevent double-completion

    // Phase 5: Love notes
    lastLoveNote: string | null; // Last shown note (for anti-repeat logic)
    lastTransitionId: number; // Increment on each transition (for uniqueness)
    showLoveNoteCard: boolean; // If true, show love note card overlay
}

// Settings (persisted to AsyncStorage)
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
}

// Stats per day (keyed by YYYY-MM-DD)
export interface DayStats {
    focusSessions: number;
    focusMinutes: number;
}

export type StatsMap = Record<string, DayStats>; // { "2026-01-07": { focusSessions: 3, focusMinutes: 75 }, ... }

// Gift mode (persisted to AsyncStorage)
export interface GiftMode {
    hasSeenGiftMode: boolean;
}

// Love notes (persisted to AsyncStorage)
export interface LoveNotes {
    notes: string[];
}
