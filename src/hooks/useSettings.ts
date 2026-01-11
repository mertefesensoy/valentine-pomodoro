import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import { save, load, STORAGE_KEYS } from '../utils/storage';

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isReady, setIsReady] = useState(false);

    // Load persisted settings on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const loaded = await load<Settings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
                if (cancelled) return;
                // Deep merge to handle nested objects (durations) and prevent losing new defaults
                const merged: Settings = {
                    ...DEFAULT_SETTINGS,
                    ...loaded,
                    durations: {
                        ...DEFAULT_SETTINGS.durations,
                        ...(loaded?.durations ?? {}),
                    },
                };
                setSettings(merged);
            } finally {
                if (!cancelled) setIsReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Update settings and persist (with deep merge for durations)
    const updateSettings = useCallback((newSettings: Partial<Settings>) => {
        setSettings((prev) => {
            const updated: Settings = {
                ...prev,
                ...newSettings,
                durations: {
                    ...prev.durations,
                    ...(newSettings.durations ?? {}),
                },
            };

            void save(STORAGE_KEYS.SETTINGS, updated).catch((error) => {
                console.error('[useSettings] Failed to save settings:', error);
            });

            return updated;
        });
    }, []);

    return {
        settings,
        isReady,
        updateSettings,
    };
}
