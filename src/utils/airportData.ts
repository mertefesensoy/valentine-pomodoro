import type { Airport } from '../components/AirportPicker';
import { readAirportsAsset } from './airportAsset';

// The airport table, loaded the first time Fly Mode needs it and then kept in
// memory for the rest of the app's life (Phase 1 task B1b). It used to be a JSON
// import, which Hermes compiled into the bytecode and evaluated on every launch.

/** One airport as stored in the asset, keyed by its IATA code. */
type AirportRecord = {
    name: string;
    city: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
    /** 1 = large, 2 = medium — used for zoom-based marker visibility */
    tier?: number;
};

/**
 * Turns the asset's text into the list the picker and the map use.
 * Throws if the text isn't a JSON object of IATA code → airport record.
 */
export function parseAirports(text: string): Airport[] {
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('[airports] The airport asset is not an object keyed by IATA code');
    }
    return Object.entries(data as Record<string, AirportRecord>).map(([iata, record]) => ({ iata, ...record }));
}

let loaded: Airport[] | null = null;
let inFlight: Promise<Airport[]> | null = null;

/**
 * Resolves with every airport.
 *
 * - The first call reads and parses the asset.
 * - Calls made while that read is in flight share it.
 * - Later calls resolve with the same array, from memory.
 * - A failed read rejects and is not cached, so the next call reads again.
 */
export function loadAirports(): Promise<Airport[]> {
    if (loaded) return Promise.resolve(loaded);
    if (!inFlight) {
        inFlight = readAirportsAsset()
            .then(parseAirports)
            .then((airports) => {
                loaded = airports;
                return airports;
            })
            .finally(() => {
                inFlight = null;
            });
    }
    return inFlight;
}

/** The airports if a load has finished, otherwise null. Never starts a read. */
export function getLoadedAirports(): Airport[] | null {
    return loaded;
}
