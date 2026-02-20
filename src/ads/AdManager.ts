import { InterstitialAd, AdEventType, TestIds, MobileAds } from 'react-native-google-mobile-ads';
import { AdPolicy } from './AdPolicy';
import { INTERSTITIAL_ID } from './AdConfig';

let _interstitial: InterstitialAd | null = null;
let _isLoaded = false;
let _isLoading = false;

export const AdManager = {
    /**
     * Initialize SDK and Policy. Call once at app launch.
     */
    async init(): Promise<void> {
        try {
            await MobileAds().initialize();
            await AdPolicy.init();

            // Preload the first ad
            this.preload();

            if (__DEV__) console.log('[AdManager] Initialized');
        } catch (e) {
            console.warn('[AdManager] Init failed', e);
        }
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
