import type { ReactNode } from 'react';
import { useSessionClock, type UseSessionClockReturn } from '../hooks/useSessionClock';
import { StoreGate } from '../stores/StoreGate';
import { useNotesStore } from '../stores/notesStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useStatsStore, useStatsViews } from '../stores/statsStore';
import { useUiStore } from '../stores/uiStore';

// TRANSITIONAL SHIM (Phase 1 B3, first commit). The state now lives in Zustand
// stores (src/stores); this file rebuilds the old useApp() object from them so
// every existing consumer and test runs unchanged against the stores. It reads
// whole stores and the clock's tick, so it re-renders exactly as the old
// context did. The second B3 commit moves each consumer onto selectors and
// deletes this file.

export function AppProvider({ children }: { children: ReactNode }) {
    return <StoreGate>{children}</StoreGate>;
}

export function useApp() {
    const settingsStore = useSettingsStore();
    const notesStore = useNotesStore();
    const statsStore = useStatsStore();
    const statsViews = useStatsViews();
    const uiStore = useUiStore();
    const session: UseSessionClockReturn = useSessionClock();

    return {
        settings: {
            settings: settingsStore.settings,
            isReady: settingsStore.isReady,
            updateSettings: settingsStore.updateSettings,
        },
        stats: {
            stats: statsStore.days,
            isReady: statsStore.isReady,
            incrementFocus: statsStore.incrementFocus,
            today: statsViews.today,
            totals: statsViews.totals,
            last7Days: statsViews.last7Days,
            goalMinutes: statsStore.goalMinutes,
            setGoalMinutes: statsStore.setGoalMinutes,
            streak: statsViews.streak,
            goalHitPulse: statsStore.goalHitPulse,
            clearGoalHitPulse: statsStore.clearGoalHitPulse,
        },
        loveNotes: {
            notes: notesStore.notes,
            count: notesStore.notes.length,
            isReady: notesStore.isReady,
            addNote: notesStore.addNote,
            editNote: notesStore.editNote,
            deleteNote: notesStore.deleteNote,
            resetToDefaults: notesStore.resetToDefaults,
            pickRandomNote: notesStore.pickRandomNote,
        },
        reminder: {
            isReady: settingsStore.isReady,
            reminder: settingsStore.reminder,
            enableDailyReminder: settingsStore.enableDailyReminder,
            disableDailyReminder: settingsStore.disableDailyReminder,
            setReminderTimeHHMM: settingsStore.setReminderTimeHHMM,
            setQuietHours: settingsStore.setQuietHours,
        },
        activeMode: uiStore.activeMode,
        setActiveMode: uiStore.setActiveMode,
        session,
    };
}
