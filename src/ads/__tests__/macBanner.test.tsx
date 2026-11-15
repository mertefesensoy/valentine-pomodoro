import { act, render, screen } from '@testing-library/react-native';
import { Dimensions, StyleSheet as RNStyleSheet } from 'react-native';
import { MAC_BANNER_RESIZE_SETTLE_MS } from '../AdConfig';
import { MacBanner } from '../MacBanner';
import { macBannerStatus, macBannerStatusLine } from '../bannerStatus';

// The Mac's always-on banner (1.5.2, FR-ADS-003), on its own. Jest can't show
// a Mac: these tests prove when it asks, with which width, and how it draws.
// The router-level test (src/__tests__/macRouter.test.tsx) proves there is one
// on every tab.

// This file runs as the iPad app on a Mac. The iPhone case is every other
// suite (jest.setup.ts mocks IS_MAC false): router.test.tsx finds no banner on
// the Timer until Stats has been opened, which a root banner would break.
jest.mock('../../platform/isMac', () => ({ IS_MAC: true, detectMac: () => true }));

// The banner's props, for each render the SDK view gets.
type BannerProps = {
    unitId: string;
    size: string;
    width?: number;
    requestOptions?: { requestNonPersonalizedAdsOnly?: boolean };
    onAdLoaded?: (size: { width: number; height: number }) => void;
    onAdFailedToLoad?: (error: Error) => void;
};
const mockBannerRenders: BannerProps[] = [];
jest.mock('react-native-google-mobile-ads', () => ({
    BannerAd: (props: BannerProps) => {
        mockBannerRenders.push(props);
        return null;
    },
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
    TestIds: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
}));

// AdManager.init(), settled by the test.
let mockSettleInit: () => void = () => {};
jest.mock('../AdManager', () => ({
    AdManager: {
        init: jest.fn(
            () =>
                new Promise<void>((resolve) => {
                    mockSettleInit = resolve;
                }),
        ),
    },
}));

jest.useFakeTimers();

const lastBanner = () => mockBannerRenders[mockBannerRenders.length - 1];
const widthsAsked = () => [...new Set(mockBannerRenders.map((p) => p.width))];
const slotStyle = () => RNStyleSheet.flatten(screen.getByTestId('mac-banner').props.style);

const initialWindow = Dimensions.get('window');
const initialScreen = Dimensions.get('screen');
async function setWindowWidth(width: number) {
    await act(async () => {
        Dimensions.set({ window: { ...initialWindow, width }, screen: initialScreen });
    });
}

async function mountReady() {
    await render(<MacBanner />);
    await act(async () => mockSettleInit());
}

beforeEach(() => {
    mockBannerRenders.length = 0;
});
afterEach(async () => {
    await act(async () => {
        Dimensions.set({ window: initialWindow, screen: initialScreen });
    });
});

// covers: FR-ADS-003
describe('the Mac banner', () => {
    it("asks for nothing until AdManager.init() has settled, then for one banner of the window's width", async () => {
        await render(<MacBanner />);
        expect(screen.getByTestId('mac-banner')).toBeOnTheScreen();
        expect(mockBannerRenders).toHaveLength(0);

        await act(async () => mockSettleInit());
        expect(lastBanner()).toMatchObject({
            unitId: 'test-banner',
            size: 'ANCHORED_ADAPTIVE_BANNER',
            width: Math.floor(initialWindow.width),
            requestOptions: { requestNonPersonalizedAdsOnly: true },
        });
    });

    it('draws nothing until an ad fills it, and nothing again after a failed load', async () => {
        await mountReady();
        expect(slotStyle()).not.toHaveProperty('backgroundColor');
        expect(slotStyle()).not.toHaveProperty('borderTopWidth');

        await act(async () => lastBanner().onAdLoaded!({ width: 320, height: 50 }));
        expect(slotStyle()).toMatchObject({ borderTopWidth: 1 });
        expect(slotStyle().backgroundColor).toEqual(expect.any(String));

        await act(async () => lastBanner().onAdFailedToLoad!(new Error('[googleMobileAds/no-fill] No ad to show.')));
        expect(slotStyle()).not.toHaveProperty('borderTopWidth');
    });

    it('passes a new width only once the window has kept it for MAC_BANNER_RESIZE_SETTLE_MS', async () => {
        await mountReady();
        const start = Math.floor(initialWindow.width);

        await setWindowWidth(900.6);
        await act(async () => jest.advanceTimersByTime(MAC_BANNER_RESIZE_SETTLE_MS - 1));
        expect(lastBanner().width).toBe(start);

        await act(async () => jest.advanceTimersByTime(1));
        expect(lastBanner().width).toBe(900);
    });

    it('sends one width for a drag of the window edge, the one it ends on', async () => {
        await mountReady();
        for (const width of [800, 820, 840, 860]) {
            await setWindowWidth(width);
            await act(async () => jest.advanceTimersByTime(300));
        }
        await act(async () => jest.advanceTimersByTime(MAC_BANNER_RESIZE_SETTLE_MS));
        expect(widthsAsked()).toEqual([Math.floor(initialWindow.width), 860]);
    });

    it('asks for nothing new when a resize comes back to the width it started at', async () => {
        await mountReady();
        const start = Math.floor(initialWindow.width);
        await setWindowWidth(start + 40);
        await act(async () => jest.advanceTimersByTime(200));
        await setWindowWidth(start);
        await act(async () => jest.advanceTimersByTime(MAC_BANNER_RESIZE_SETTLE_MS * 2));
        expect(widthsAsked()).toEqual([start]);
    });
});

// B7's hidden panel tells an empty Mac edge apart: no fill, an error, or a
// Mac not detected (1.5.2). The status is module state, so these run in order.
// covers: FR-ADS-003
describe("the Mac banner's line in the hidden panel", () => {
    it('says "not a Mac" when IS_MAC is false, whatever the status', () => {
        expect(macBannerStatusLine(false, { state: 'loaded', width: 900, size: { width: 900, height: 90 } })).toBe(
            'Mac banner (this launch): not a Mac',
        );
    });

    it('keeps each request with its width, then the load or the failure', async () => {
        await mountReady();
        const start = Math.floor(initialWindow.width);
        expect(macBannerStatus()).toEqual({ state: 'requested', width: start });
        expect(macBannerStatusLine(true)).toBe(`Mac banner (this launch): requested, no result yet · asked ${start} pt`);

        await act(async () => lastBanner().onAdLoaded!({ width: start, height: 90 }));
        expect(macBannerStatusLine(true)).toBe(`Mac banner (this launch): loaded ${start}×90 · asked ${start} pt`);

        const noFill = Object.assign(new Error('No ad to show.'), { code: 'googleMobileAds/no-fill' });
        await act(async () => lastBanner().onAdFailedToLoad!(noFill));
        expect(macBannerStatusLine(true)).toBe(`Mac banner (this launch): failed: googleMobileAds/no-fill (No ad to show.) · asked ${start} pt`);

        await setWindowWidth(1000);
        await act(async () => jest.advanceTimersByTime(MAC_BANNER_RESIZE_SETTLE_MS));
        expect(macBannerStatus()).toEqual({ state: 'requested', width: 1000 });
    });
});
