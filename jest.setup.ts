/**
 * Jest setup (runs before every test file).
 *
 * Native modules have no implementation under Node, so each one the app touches
 * at import time is replaced with the mock its package ships. Keep this list
 * minimal: a mock here hides real behaviour from every test.
 */

// Gesture Handler ships its own mocks for the native module and host detector
// (FlySheet's pan and double-tap gestures).
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Reanimated 4.2+ initialises react-native-worklets at import, so both need mocks.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// Reanimated 4.7.1 bug: under Jest it swaps in JSReanimated, but initializers.native
// still calls setCSSEventHandler, which JSReanimated throws on. Stub only that call;
// remove once upstream fixes it (check on each Reanimated upgrade).
jest.mock('react-native-reanimated/src/css/native/proxy', () => ({
    ...jest.requireActual('react-native-reanimated/src/css/native/proxy'),
    setCSSEventHandler: () => {},
}));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// react-native-maps resolves its TurboModule at import time, and TimerScreen
// imports FlyModeScreen statically. The map becomes plain Views; the camera
// methods FlyModeScreen calls through its ref are no-ops.
jest.mock('react-native-maps', () => {
    const React = require('react');
    const { View } = require('react-native');
    const MapView = React.forwardRef(function MockMapView(props: { children?: unknown }, ref: unknown) {
        React.useImperativeHandle(ref, () => ({
            animateCamera: jest.fn(),
            animateToRegion: jest.fn(),
            fitToCoordinates: jest.fn(),
            setCamera: jest.fn(),
            getCamera: jest.fn(async () => ({ center: { latitude: 0, longitude: 0 }, heading: 0, pitch: 0, zoom: 1, altitude: 0 })),
        }));
        return React.createElement(View, { testID: 'map-view' }, props.children);
    });
    const Plain = (props: { children?: unknown }) => React.createElement(View, null, props.children);
    return { __esModule: true, default: MapView, Marker: Plain, Polyline: Plain };
});

// expo-audio builds a class on its native module at import (also via FlyModeScreen).
// Only what useFlyModeAudio touches is stubbed.
jest.mock('expo-audio', () => ({
    useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), remove: jest.fn(), loop: false, volume: 1 }),
    setAudioModeAsync: jest.fn(async () => {}),
}));

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
