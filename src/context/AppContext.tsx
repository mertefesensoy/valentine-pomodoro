import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useStats } from '../hooks/useStats';
import { useLoveNotes } from '../hooks/useLoveNotes';
import { useReminder } from '../hooks/useReminder';

type AppContextValue = {
    settings: ReturnType<typeof useSettings>;
    stats: ReturnType<typeof useStats>;
    loveNotes: ReturnType<typeof useLoveNotes>;
    reminder: ReturnType<typeof useReminder>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    // ✅ these run ONCE globally
    const settings = useSettings();
    const stats = useStats();
    const loveNotes = useLoveNotes();
    const reminder = useReminder();

    // ✅ memoize to prevent re-render storm
    const value = useMemo(
        () => ({ settings, stats, loveNotes, reminder }),
        [settings, stats, loveNotes, reminder]
    );

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
