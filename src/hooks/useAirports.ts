import { useEffect, useState } from 'react';
import type { Airport } from '../components/AirportPicker';
import { getLoadedAirports, loadAirports } from '../utils/airportData';

const NO_AIRPORTS: Airport[] = [];

/**
 * Every airport, for Fly Mode. Empty until the airport asset has been read the
 * first time (a few milliseconds after Fly first opens); after that, every
 * caller gets the cached list on its first render. A failed read is logged and
 * leaves the list empty; reopening Fly mounts the hook again and retries.
 */
export function useAirports(): Airport[] {
    const [airports, setAirports] = useState<Airport[]>(() => getLoadedAirports() ?? NO_AIRPORTS);

    // Always asks, even when the first render already had the list: another
    // caller may finish the load between this render and the effect. Once loaded
    // this resolves from memory with the same array, and React skips the render.
    useEffect(() => {
        let cancelled = false;
        loadAirports().then(
            (list) => {
                if (!cancelled) setAirports(list);
            },
            (error) => {
                console.error('[useAirports] Failed to load the airport table:', error);
            },
        );
        return () => {
            cancelled = true;
        };
    }, []);

    return airports;
}
