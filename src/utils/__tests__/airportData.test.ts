// Phase 1 task B1b: the airport table is a raw asset read at runtime, parsed
// once, and kept in memory. jest.setup.ts replaces the native read
// (airportAsset.ts) with a read of the same file from disk; these tests spy on
// that stub. airportAsset.test.ts covers the real reader.

type AirportDataModule = typeof import('../airportData');
type AirportAssetModule = typeof import('../airportAsset');

// A fresh pair of modules per test, so the in-memory cache starts empty each
// time. The spy is set on the copy of the asset reader that this airportData
// imports.
function freshModules() {
    let data!: AirportDataModule;
    let asset!: AirportAssetModule;
    jest.isolateModules(() => {
        asset = require('../airportAsset');
        data = require('../airportData');
    });
    const read = jest.spyOn(asset, 'readAirportsAsset');
    return { ...data, read, readText: () => asset.readAirportsAsset() };
}

describe('parseAirports', () => {
    it('turns every IATA key into one airport, fields unchanged', async () => {
        const { parseAirports, readText } = freshModules();
        const text = await readText();
        const raw = JSON.parse(text) as Record<string, object>;
        const airports = parseAirports(text);

        expect(airports).toHaveLength(Object.keys(raw).length);
        expect(airports.length).toBeGreaterThan(1000);
        expect(airports.find((a) => a.iata === 'IST')).toEqual({ iata: 'IST', ...raw.IST });
    });

    it('rejects text that is not the airport table', () => {
        const { parseAirports } = freshModules();
        expect(() => parseAirports('{"IST":')).toThrow();
        expect(() => parseAirports('[]')).toThrow();
    });
});

describe('loadAirports', () => {
    it('reads the asset once and serves later calls from memory', async () => {
        const { loadAirports, getLoadedAirports, read } = freshModules();
        expect(getLoadedAirports()).toBeNull();

        const first = await loadAirports();
        const second = await loadAirports();

        expect(read).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
        expect(getLoadedAirports()).toBe(first);
    });

    it('shares one read between calls made while it is in flight', async () => {
        const { loadAirports, read } = freshModules();
        const [a, b] = await Promise.all([loadAirports(), loadAirports()]);

        expect(read).toHaveBeenCalledTimes(1);
        expect(a).toBe(b);
    });

    it('rejects when the read fails, and the next call reads again', async () => {
        const { loadAirports, getLoadedAirports, read } = freshModules();
        read.mockRejectedValueOnce(new Error('disk error'));

        await expect(loadAirports()).rejects.toThrow('disk error');
        expect(getLoadedAirports()).toBeNull();

        const airports = await loadAirports();
        expect(read).toHaveBeenCalledTimes(2);
        expect(airports.length).toBeGreaterThan(1000);
    });
});
