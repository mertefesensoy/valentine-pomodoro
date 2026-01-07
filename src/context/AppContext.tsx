import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useStats } from '../hooks/useStats';
import { useLoveNotes } from '../hooks/useLoveNotes';

type AppContextValue = {
    settings: ReturnType<typeof useSettings>;
    stats: ReturnType<typeof useStats>;
    loveNotes: ReturnType<typeof useLoveNotes>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    // ✅ these run ONCE globally
    const settings = useSettings();
    const stats = useStats();
    const loveNotes = useLoveNotes();

    return (
        <AppContext.Provider value={{ settings, stats, loveNotes }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
