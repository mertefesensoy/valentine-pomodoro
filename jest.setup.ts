/**
 * Jest setup (runs before every test file).
 *
 * Native modules have no implementation under Node, so each one the app touches
 * at import time is replaced with the mock its package ships. Keep this list
 * minimal: a mock here hides real behaviour from every test.
 */

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Reanimated 4.2+ initialises react-native-worklets at import, so both need mocks.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// AdMob resolves its TurboModule at import time. Only the exports the app uses
// (src/ads/*, StatsScreen) are stubbed; ads never load in tests.
jest.mock('react-native-google-mobile-ads', () => ({
    BannerAd: () => null,
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER', BANNER: 'BANNER' },
    TestIds: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
    AdEventType: { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error', OPENED: 'opened' },
    InterstitialAd: {
        createForAdRequest: () => ({
            load: jest.fn(),
            show: jest.fn(() => Promise.resolve()),
            addAdEventListener: jest.fn(() => jest.fn()),
            loaded: false,
        }),
    },
    MobileAds: () => ({ initialize: jest.fn(() => Promise.resolve([])) }),
}));
