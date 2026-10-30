import { act, render } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StatsScreen from '../StatsScreen';
import { StoreGate } from '../../stores/StoreGate';
import { bannerStatus, bannerStatusLine, noteBannerLayout } from '../../ads/bannerStatus';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';

// The Stats banner's result, kept for B7's hidden panel (Phase 1 B6 fix,
// record §9). Build 46 showed no banner and nothing in the code proved why, so
// a device build reports whether it loaded, why not, and where it sat.
// jest.setup.ts renders the banner as nothing; this file keeps its props, so a
// test can play the SDK's load and failure events through them.
let mockBannerProps: { onAdLoaded?: (size: { width: number; height: number }) => void; onAdFailedToLoad?: (error: Error) => void } | null = null;
jest.mock('react-native-google-mobile-ads', () => ({
    BannerAd: (props: typeof mockBannerProps) => {
        mockBannerProps = props;
        return null;
    },
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
    TestIds: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
}));

async function renderStats() {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>
                <StatsScreen />
            </StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

beforeAll(async () => {
    await resetStorage();
});

// One launch per file: the status is in-memory module state, so the tests run in launch order.
// The banner is tracked under FR-ADS-001 as DEF-006 (SRS §3.4).
// covers: FR-ADS-001
describe('the Stats banner status', () => {
    it('starts at "not requested"', () => {
        expect(bannerStatusLine()).toBe('Stats banner (this launch): not requested (Stats not opened yet)');
    });

    it('is "requested" once Stats renders its banner (outside a navigator Stats counts as focused)', async () => {
        await renderStats();
        expect(mockBannerProps).not.toBeNull();
        expect(bannerStatus().state).toBe('requested');
        expect(bannerStatusLine()).toBe('Stats banner (this launch): requested, no result yet');
    });

    it("keeps the SDK's failure, code and message", async () => {
        const error = Object.assign(new Error('[googleMobileAds/no-fill] No ad to show.'), {
            code: 'googleMobileAds/no-fill',
        });
        await act(async () => mockBannerProps!.onAdFailedToLoad!(error));
        expect(bannerStatus()).toMatchObject({ state: 'failed', error: { code: 'googleMobileAds/no-fill' } });
        expect(bannerStatusLine()).toMatch(/^Stats banner \(this launch\): failed: googleMobileAds\/no-fill \(/);
    });

    it('keeps the loaded size, and drops the earlier error', async () => {
        await act(async () => mockBannerProps!.onAdLoaded!({ width: 390, height: 61 }));
        expect(bannerStatus()).toMatchObject({ state: 'loaded', size: { width: 390, height: 61 }, error: undefined });
        expect(bannerStatusLine()).toBe('Stats banner (this launch): loaded 390×61');
    });

    it('says whether the container ends above the tab bar', () => {
        noteBannerLayout(760, 761);
        expect(bannerStatusLine()).toBe('Stats banner (this launch): loaded 390×61 · bottom 760 / bar top 761 pt (above the tab bar)');
        noteBannerLayout(812, 729);
        expect(bannerStatusLine()).toMatch(/bottom 812 \/ bar top 729 pt \(reaches under the tab bar\)$/);
    });
});
