import { useCallback, useEffect, useState } from 'react';
import { save, load, STORAGE_KEYS } from '../utils/storage';
import type { GiftMode } from '../types';

export function useGiftMode() {
    const [hasSeenGiftMode, setHasSeenGiftMode] = useState(true); // Default true to prevent flash
    const [isReady, setIsReady] = useState(false);

    // Load persisted gift mode state on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const loaded = await load<GiftMode>(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: false });
                if (cancelled) return;
                setHasSeenGiftMode(loaded.hasSeenGiftMode);
            } finally {
                if (!cancelled) setIsReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Dismiss gift mode and persist
    const dismiss = useCallback(async () => {
        setHasSeenGiftMode(true);
        await save(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
    }, []);

    return {
        hasSeenGiftMode,
        isReady,
        dismiss,
    };
}
