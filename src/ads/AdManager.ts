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
        const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
            requestNonPersonalizedAdsOnly: true,
        });
        _interstitial = ad;

        // The load's own pair: both go once it has loaded or failed, so an error after show() is the show's alone.
        const offLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
            offLoaded();
            offError();
            _isLoaded = true;
            _isLoading = false;
            markStartup('ads.loaded'); // the first one only: the B7 probe's readiness mark
            if (__DEV__) console.log('[AdManager] Interstitial loaded');
        });

        const offError = ad.addAdEventListener(AdEventType.ERROR, (error: unknown) => {
            offLoaded();
            offError();
            _isLoaded = false;
            _isLoading = false;
            if (_interstitial === ad) _interstitial = null;
            if (__DEV__) console.warn('[AdManager] Load error', error);
        });

        ad.load();
    },

    /**
     * Shows the loaded interstitial when the policy allows it.
     *
     *   in : `onClose`, run once when this is over, whatever happened: skipped, closed, or refused.
     *   out: true when show() was called, false when skipped (no ad due or none loaded; `onClose` has already run).
     *   side effects: an ad is shown once at most, so it is spent as show() is called. Closed, it counts as seen
     *        (`AdPolicy.recordAdShown`) and the next loads a second later. Refused, which iOS does while a sheet is
     *        still leaving (DEF-011), whether as an error event or a rejected show(), it isn't counted and the next
     *        loads at once, so the next completion has one ready.
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

        // 3. Show. The ad is spent from here: the next show needs the next load.
        const ad = _interstitial;
        _interstitial = null;
        _isLoaded = false;

        let over = false;
        const finish = (seen: boolean, error?: unknown) => {
            if (over) return;
            over = true;
            offClosed();
            offError();
            if (seen) AdPolicy.recordAdShown().catch(() => { });
            else if (__DEV__) console.warn('[AdManager] Show failed', error);
            onClose();
            if (seen) setTimeout(() => AdManager.preload(), 1000);
            else AdManager.preload();
        };
        const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
        const offError = ad.addAdEventListener(AdEventType.ERROR, (error: unknown) => finish(false, error));

        try {
            // A promise from the native module: it rejects when there's no view controller to present from.
            Promise.resolve(ad.show()).catch((e: unknown) => finish(false, e));
            return true;
        } catch (e) {
            finish(false, e);
            return false;
        }
    }
};
