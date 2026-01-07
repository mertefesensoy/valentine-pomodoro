import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { save, load, STORAGE_KEYS } from '../utils/storage';

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    // Load persisted settings on mount
    useEffect(() => {
        load<Settings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS).then((loaded) => {
            setSettings(loaded);
        });
    }, []);

    // Update settings and persist
    const updateSettings = useCallback((newSettings: Partial<Settings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            save(STORAGE_KEYS.SETTINGS, updated);
            return updated;
        });
    }, []);

    return {
        settings,
        updateSettings,
    };
}
