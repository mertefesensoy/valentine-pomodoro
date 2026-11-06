import { isFlyModeAvailable, PAIRING_ENABLED, resolveAppMode, STARTUP_REPORTS_ENABLED } from '../features';

// jest.setup.ts pins the reports off for the other suites, so this one reads the real file.
jest.unmock('../features');

// This fails if pairing or the reports are switched off by accident (Phase 2 F1).
describe('what 1.5.0 ships', () => {
    it('has pairing on', () => {
        expect(PAIRING_ENABLED).toBe(true);
    });

    it('has the start-up reports on, with it', () => {
        expect(STARTUP_REPORTS_ENABLED).toBe(true);
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
