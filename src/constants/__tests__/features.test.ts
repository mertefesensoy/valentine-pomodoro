/* eslint-disable @typescript-eslint/no-require-imports -- an Android launch loads the flags fresh, with its Platform set first */
import { isFlyModeAvailable, isPairingAvailable, PAIRING_ENABLED, resolveAppMode, STARTUP_REPORTS_ENABLED } from '../features';

// jest.setup.ts pins the reports off for the other suites, so this one reads the real file.
jest.unmock('../features');

// This fails if pairing or the reports are switched off on iOS by accident (Phase 2 F1). Jest runs as iOS.
describe('what 1.5 ships on iOS', () => {
    it('has pairing on', () => {
        expect(PAIRING_ENABLED).toBe(true);
    });

    it('has the start-up reports on, with it', () => {
        expect(STARTUP_REPORTS_ENABLED).toBe(true);
    });
});

// Sign in with Apple is the only way in, and it doesn't exist on Android: the pairing sheet would open
// with no button (the Android closed-test plan, finding A1).
describe('isPairingAvailable', () => {
    it('is available only on iOS', () => {
        expect(isPairingAvailable('ios')).toBe(true);
        expect(isPairingAvailable('android')).toBe(false);
        expect(isPairingAvailable('web')).toBe(false);
    });
});

/** The flags and tutorials as an Android launch reads them: a fresh registry, with its Platform set first. */
function loadOnAndroid() {
    let loaded!: { features: typeof import('../features'); tutorials: typeof import('../../screens/tutorial/tutorials') };
    jest.isolateModules(() => {
        const { Platform } = require('react-native') as typeof import('react-native');
        Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });
        loaded = { features: require('../features'), tutorials: require('../../screens/tutorial/tutorials') };
    });
    return loaded;
}

describe('what build 1 of the closed test ships on Android', () => {
    it('has pairing off, and the start-up reports with it', () => {
        const { features } = loadOnAndroid();
        expect(features.PAIRING_ENABLED).toBe(false);
        expect(features.STARTUP_REPORTS_ENABLED).toBe(false);
    });

    it('shows the general tutorial without its pair step, and no 1.5 tutorial', () => {
        const { tutorials } = loadOnAndroid();
        expect(tutorials.TUTORIALS.map((t) => t.id)).toEqual(['general']);
        expect(tutorials.GENERAL.steps.map((s) => s.id)).not.toContain('pair');
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
