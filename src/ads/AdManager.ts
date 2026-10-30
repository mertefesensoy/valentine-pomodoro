import { InterstitialAd, AdEventType, TestIds, MobileAds } from 'react-native-google-mobile-ads';
import { AdPolicy } from './AdPolicy';
import { INTERSTITIAL_ID } from './AdConfig';
import { runAfterFirstFrame } from '../startup/deferredStartup';
import { markStartup } from '../startup/startupProbe';

let _interstitial: InterstitialAd | null = null;
let _isLoaded = false;
let _isLoading = false;
let _initDone: Promise<void> | null = null;

// Start the SDK, load the policy, preload the first interstitial. Never rejects.
async function initNow(): Promise<void> {
    try {
        await MobileAds().initialize();
        await AdPolicy.init();

        // Preload the first ad
        AdManager.preload();

        if (__DEV__) console.log('[AdManager] Initialized');
    } catch (e) {
        console.warn('[AdManager] Init failed', e);
    }
}

export const AdManager = {
    /**
     * Initialize SDK and Policy. Call once at app launch.
     *
     * Phase 1 B7: the work waits for the first frame (src/startup/deferredStartup.ts),
     * so the call site stays where it is. The returned promise resolves once
     * it has run. A second call returns the same promise: one start per launch.
     * The interstitial is still loaded long before the 2nd completed session
     * (FR-ADS-001): the deferral is at most ~11 s (B7 record §3.2).
     */
    init(): Promise<void> {
        if (!_initDone) {
            _initDone = new Promise<void>((resolve) => {
                runAfterFirstFrame('ads.init', () => initNow().then(resolve));
            });
        }
        return _initDone;
    },

    /**
     * Preload an interstitial safely.
     * Can be called repeatedly; acts as a no-op if already loaded/loading.
     */
    preload(): void {
        if (_isLoaded || _isLoading) return;

        _isLoading = true;
        _interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
            requestNonPersonalizedAdsOnly: true,
        });

        const unsubscribeLoaded = _interstitial.addAdEventListener(AdEventType.LOADED, () => {
            _isLoaded = true;
            _isLoading = false;
            unsubscribeLoaded();
            markStartup('ads.loaded'); // the first one only: the B7 probe's readiness mark
            if (__DEV__) console.log('[AdManager] Interstitial loaded');
        });

        const unsubscribeError = _interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
            _isLoaded = false;
            _isLoading = false;
            _interstitial = null;
            unsubscribeError();
            if (__DEV__) console.warn('[AdManager] Load error', error);
        });

        _interstitial.load();
    },

    /**
     * Checks checks policy caps AND if ad is loaded.
     * If yes, shows it and returns true.
     * If no, returns false (caller should proceed silently).
     * @param onClose Callback when ad is closed OR if show fails/skips
     */
    showIfReady(onClose: () => void): boolean {
        // 1. Check Policy
        if (!AdPolicy.shouldShowAd()) {
            if (__DEV__) console.log('[AdManager] Skipped: Policy caps not met');
            onClose();
            return false;
        }

        // 2. Check Loaded
        if (!_isLoaded || !_interstitial) {
            if (__DEV__) console.log('[AdManager] Skipped: Not loaded');
            // Try to load for next time
            this.preload();
            onClose();
            return false;
        }

        // 3. Show
        const ad = _interstitial;

        const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
            _isLoaded = false;
            _interstitial = null;
            unsubscribeClosed();

            // Record success to Update Policy
            AdPolicy.recordAdShown().catch(() => { });

            onClose();

            // Preload next one
            setTimeout(() => this.preload(), 1000);
        });

        try {
            ad.show();
            return true;
        } catch (e) {
            if (__DEV__) console.warn('[AdManager] Show exception', e);
            onClose();
            return false;
        }
    }
};
