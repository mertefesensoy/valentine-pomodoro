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

// Node gives every module a __dirname under Jest; the app's React Native
// typings don't declare Node globals, so this file declares the one it uses.
declare const __dirname: string;

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

// Gesture Handler's ReanimatedSwipeable (the Notes rows' swipe, D2) runs on its v3 hooks, which
// call a shared value's removeListener; Reanimated's mock has none, and the timer that calls it
// crashes the Jest worker after the test. A swipe can't be exercised here anyway: the row renders
// as itself, and its Delete is tested through the VoiceOver action it mirrors.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
    const React = require('react');
    const MockSwipeable = React.forwardRef(function MockSwipeable(props: { children?: unknown }, ref: unknown) {
        React.useImperativeHandle(ref, () => ({ close: jest.fn(), openLeft: jest.fn(), openRight: jest.fn(), reset: jest.fn() }));
        return props.children;
    });
    return { __esModule: true, default: MockSwipeable };
});

// react-native-maps resolves its TurboModule at import time. TimerScreen loads
// FlyModeScreen lazily (Phase 1 B1), but every test that opens Fly (the A1 guard)
// still evaluates it, so keep this mock. The map becomes plain Views; the camera
// methods FlyModeScreen calls through its ref are no-ops.
jest.mock('react-native-maps', () => {
    const React = require('react');
    const { View } = require('react-native');
    const MapView = React.forwardRef(function MockMapView(props: Record<string, unknown> & { children?: unknown }, ref: unknown) {
        React.useImperativeHandle(ref, () => ({
            animateCamera: jest.fn(),
            animateToRegion: jest.fn(),
            fitToCoordinates: jest.fn(),
            setCamera: jest.fn(),
            getCamera: jest.fn(async () => ({ center: { latitude: 0, longitude: 0 }, heading: 0, pitch: 0, zoom: 1, altitude: 0 })),
        }));
        // The touch and region handlers ride on the View, so a test can drive them: Fly enters free
        // mode only while a finger moves the map (flyCamera.test.tsx).
        const { onTouchStart, onTouchEnd, onTouchCancel, onRegionChange } = props;
        return React.createElement(View, { testID: 'map-view', onTouchStart, onTouchEnd, onTouchCancel, onRegionChange }, props.children);
    });
    const Plain = (props: { children?: unknown }) => React.createElement(View, null, props.children);
    return { __esModule: true, default: MapView, Marker: Plain, Polyline: Plain };
});

// expo-audio builds a class on its native module at import (via FlyModeScreen,
// whenever a test opens Fly).
// Only what useFlyModeAudio and the UI sounds (src/audio/uiSounds.ts, D4) touch is stubbed.
jest.mock('expo-audio', () => ({
    useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), remove: jest.fn(), loop: false, volume: 1 }),
    createAudioPlayer: jest.fn(() => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(async () => {}), remove: jest.fn(), volume: 1 })),
    setAudioModeAsync: jest.fn(async () => {}),
}));

// The airport table is a raw asset read through expo-asset and expo-file-system
// (Phase 1 B1b), which have no native side under Node. Tests read the same file
// from disk instead, so Fly's real parse, cache and picker paths still run.
// src/utils/__tests__/airportAsset.test.ts unmocks this and checks the native calls.
// (The `mock` prefix is what lets the hoisted factory read this module variable.)
const mockAirportAssetPath: string = require('path').join(__dirname, 'src/assets/data/airports.jsonasset');
jest.mock('./src/utils/airportAsset', () => ({
    readAirportsAsset: async () => require('fs').readFileSync(mockAirportAssetPath, 'utf8'),
}));

// react-native-mmkv (Phase 1 B2) imports react-native-nitro-modules, which looks
// up its TurboModule at import time. Under Jest, createMMKV() returns MMKV's own
// in-memory store and never calls Nitro, so the import only has to succeed; a
// real Nitro call would mean a test is off the mock path, and throws.
jest.mock('react-native-nitro-modules', () => ({
    NitroModules: {
        createHybridObject: (name: string) => {
            throw new Error(`NitroModules.createHybridObject('${name}') called under Jest`);
        },
    },
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
