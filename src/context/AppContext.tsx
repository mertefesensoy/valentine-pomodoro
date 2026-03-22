import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useStats } from '../hooks/useStats';
import { useLoveNotes } from '../hooks/useLoveNotes';
import { useReminder } from '../hooks/useReminder';
import { AppMode } from '../types';
import { save, load, STORAGE_KEYS } from '../utils/storage';

type AppContextValue = {
    settings: ReturnType<typeof useSettings>;
    stats: ReturnType<typeof useStats>;
    loveNotes: ReturnType<typeof useLoveNotes>;
    reminder: ReturnType<typeof useReminder>;
    activeMode: AppMode;
    setActiveMode: (mode: AppMode) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    // ✅ these run ONCE globally
    const settings = useSettings();
    const stats = useStats();
    const loveNotes = useLoveNotes();
    const reminder = useReminder();

    // Mode state — persisted so the user's last choice survives restarts
    const [activeMode, setActiveModeState] = useState<AppMode>('default');

    useEffect(() => {
        load<AppMode>(STORAGE_KEYS.APP_MODE, 'default').then(setActiveModeState);
    }, []);

    const setActiveMode = (mode: AppMode) => {
        setActiveModeState(mode);
        save(STORAGE_KEYS.APP_MODE, mode);
    };

    // ✅ memoize to prevent re-render storm
    const value = useMemo(
        () => ({ settings, stats, loveNotes, reminder, activeMode, setActiveMode }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [settings, stats, loveNotes, reminder, activeMode]
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
