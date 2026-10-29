import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

// The airport table ships as a raw asset, not a JS module (Phase 1 task B1b).
// metro.config.js registers `.jsonasset` as an asset extension, so this require
// gives Metro's asset id and the 648 KB file stays out of the bytecode.
const AIRPORTS_ASSET: number = require('../assets/data/airports.jsonasset');

/**
 * Reads the bundled airport table as text.
 *
 * - Release builds: the asset is embedded in the app. `downloadAsync()` returns
 *   its file:// URL inside the app bundle unchanged, and the app may read there.
 * - Dev builds: Metro serves the asset over HTTP, and `downloadAsync()` first
 *   copies it into the caches directory.
 *
 * Rejects if the asset can't be resolved or read. Callers cache the result
 * (airportData.ts); this function reads from disk every time it is called.
 */
export async function readAirportsAsset(): Promise<string> {
    const asset = await Asset.fromModule(AIRPORTS_ASSET).downloadAsync();
    if (!asset.localUri) {
        throw new Error('[airports] The airport asset has no local file after download');
    }
    return new File(asset.localUri).text();
}
