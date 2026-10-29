import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { readAirportsAsset } from '../airportAsset';

// Phase 1 task B1b: the real reader of the bundled airport table. jest.setup.ts
// replaces it for every other test (expo-asset and expo-file-system have no
// native side under Node); this file unmocks it and checks the native calls.
// babel-jest hoists the jest.unmock/jest.mock calls above the imports.

jest.unmock('../airportAsset');

const mockDownloadAsync = jest.fn();
jest.mock('expo-asset', () => ({
    Asset: { fromModule: jest.fn(() => ({ downloadAsync: mockDownloadAsync })) },
}));

const mockText = jest.fn();
jest.mock('expo-file-system', () => ({
    File: jest.fn(() => ({ text: mockText })),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

// covers: FR-FLY-004
it('resolves the bundled asset, then reads its local file as text', async () => {
    mockDownloadAsync.mockResolvedValue({ localUri: 'file:///app/assets/src/assets/data/airports.jsonasset' });
    mockText.mockResolvedValue('{"IST":{}}');

    await expect(readAirportsAsset()).resolves.toBe('{"IST":{}}');

    // The argument is whatever the asset's require() returns: Metro's asset id
    // in the app, a stub under Jest.
    expect(Asset.fromModule).toHaveBeenCalledTimes(1);
    expect(Asset.fromModule).toHaveBeenCalledWith(expect.anything());
    expect(File).toHaveBeenCalledWith('file:///app/assets/src/assets/data/airports.jsonasset');
});

it('rejects when the asset has no local file after download', async () => {
    mockDownloadAsync.mockResolvedValue({ localUri: null });

    await expect(readAirportsAsset()).rejects.toThrow(/no local file/);
    expect(File).not.toHaveBeenCalled();
});
