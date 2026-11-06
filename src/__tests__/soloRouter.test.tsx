// covers: FR-ACC-001
// The solo promise through the real router (Phase 2 D1, ADR-0049): with /pair among the routes, a launch into
// the tabs evaluates neither the pairing screen nor any server code. app/pair.tsx loads its screen lazily, and
// this pins that the router doesn't undo it.
import { act, renderRouter, screen } from 'expo-router/testing-library';

import { resetStorage } from '../__fixtures__/storage/resetStorage';

jest.setTimeout(60_000);

jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: () => {} })),
}));
jest.mock('react-native-google-mobile-ads', () => {
    const { View } = jest.requireActual('react-native');
    return {
        BannerAd: () => <View />,
        BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
        TestIds: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
    };
});
jest.mock('../ads/AdManager', () => ({ AdManager: { init: jest.fn(), isReady: () => false, show: jest.fn() } }));

const mockEvaluated: string[] = [];
jest.mock('../screens/pair/PairScreen', () => {
    mockEvaluated.push('PairScreen');
    return { __esModule: true, default: () => null };
});
jest.mock('../server/client', () => {
    mockEvaluated.push('client');
    return {};
});
jest.mock('../server/home', () => {
    mockEvaluated.push('home');
    return {};
});
jest.mock('@tanstack/react-query', () => {
    mockEvaluated.push('query');
    return {};
});
jest.mock('expo-secure-store', () => {
    mockEvaluated.push('keychain');
    return {};
});
jest.mock('expo-apple-authentication', () => {
    mockEvaluated.push('apple');
    return {};
});

describe('a solo launch through the router', () => {
    it('reaches the Timer with /pair among its routes, and evaluates none of it', async () => {
        await renderRouter('app', { initialUrl: '/' });
        await act(async () => {});

        expect(screen.getByText('Start focus')).toBeOnTheScreen();
        expect(mockEvaluated).toEqual([]);
        await resetStorage();
    });
});
