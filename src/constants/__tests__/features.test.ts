import { isFlyModeAvailable, PAIRING_ENABLED, resolveAppMode } from '../features';

// Phase 2 merges into master task by task, and master must stay releasable. This
// fails if pairing is switched on by accident before Stage F (plan task F1), which
// changes the expected value here on purpose.
describe('PAIRING_ENABLED', () => {
    it('stays off until the 1.5.0 release build', () => {
        expect(PAIRING_ENABLED).toBe(false);
    });
});

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
