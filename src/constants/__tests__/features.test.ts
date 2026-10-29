import { isFlyModeAvailable, resolveAppMode } from '../features';

// Fly Mode crashed on Android (no Google Maps API key) and, because the mode is
// persisted, every later launch crashed too. These pin the platform gate and the
// stored-mode fallback that prevent both.
describe('isFlyModeAvailable', () => {
    it('is available only on iOS', () => {
        expect(isFlyModeAvailable('ios')).toBe(true);
        expect(isFlyModeAvailable('android')).toBe(false);
        expect(isFlyModeAvailable('web')).toBe(false);
    });
});

describe('resolveAppMode', () => {
    it('keeps a stored fly mode where Fly is available', () => {
        expect(resolveAppMode('fly', 'ios')).toBe('fly');
    });

    it('falls back to default for a stored fly mode where Fly is unavailable', () => {
        expect(resolveAppMode('fly', 'android')).toBe('default');
        expect(resolveAppMode('fly', 'web')).toBe('default');
    });

    it('leaves the default mode unchanged on every platform', () => {
        expect(resolveAppMode('default', 'ios')).toBe('default');
        expect(resolveAppMode('default', 'android')).toBe('default');
    });
});
