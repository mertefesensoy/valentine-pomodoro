/**
 * InterstitialAdManager — preload, frequency-cap, and show interstitial ads.
 *
 * Frequency caps (all must pass for canShow() to return true):
 *   - Min 60 minutes since last shown
 *   - At least N focus sessions since last shown (default N=3)
 *   - Max 3 interstitials per day
 *   - Ad must be loaded
 *
 * Usage:
 *   InterstitialAdManager.preload()   — call during focus phase
 *   InterstitialAdManager.canShow()   — check before enqueuing
 *   InterstitialAdManager.show(cb)    — show; cb called on close/error
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    InterstitialAd,
    AdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';
import { getDayKeyFromDate } from '../utils/time';

// --- Config ---
const MIN_INTERVAL_MS = 60 * 60 * 1000;   // 60 minutes
const MIN_SESSIONS = 3;                     // sessions between ads
const MAX_PER_DAY = 3;                      // daily cap
const STORAGE_KEY = 'ads_caps_v1';

// Use test ID in dev, real ID in prod (set via app.json extra.admobInterstitialId)
const UNIT_ID = __DEV__
    ? TestIds.INTERSTITIAL
    : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? TestIds.INTERSTITIAL);

// --- Cap state (persisted) ---
type AdCaps = {
    lastShownAt: number;
    shownTodayCount: number;
    sessionsSinceLastAd: number;
    lastShownDayKey: string;
};

const DEFAULT_CAPS: AdCaps = {
    lastShownAt: 0,
    shownTodayCount: 0,
    sessionsSinceLastAd: 0,
    lastShownDayKey: '',
};

let _caps: AdCaps = { ...DEFAULT_CAPS };
let _capsLoaded = false;

async function loadCaps(): Promise<void> {
    if (_capsLoaded) return;
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<AdCaps>;
            _caps = { ...DEFAULT_CAPS, ...parsed };
        }
    } catch {
        _caps = { ...DEFAULT_CAPS };
    }
    _capsLoaded = true;
}

async function saveCaps(): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_caps));
    } catch {
        // ignore
    }
}

// --- Ad instance ---
let _ad: ReturnType<typeof InterstitialAd.createForAdRequest> | null = null;
let _loaded = false;
let _loading = false;

function createAd(): ReturnType<typeof InterstitialAd.createForAdRequest> {
    return InterstitialAd.createForAdRequest(UNIT_ID, {
        requestNonPersonalizedAdsOnly: false, // updated by consent manager
    });
}

// --- Public API ---
export const InterstitialAdManager = {
    /** Call during focus phase to preload the next ad. */
    preload(): void {
        if (_loaded || _loading) return;
        _loading = true;

        _ad = createAd();

        const unsubLoaded = _ad.addAdEventListener(AdEventType.LOADED, () => {
            _loaded = true;
            _loading = false;
            if (__DEV__) console.log('[AdManager] Interstitial loaded');
            unsubLoaded();
        });

        const unsubError = _ad.addAdEventListener(AdEventType.ERROR, (err) => {
            _loaded = false;
            _loading = false;
            _ad = null;
            if (__DEV__) console.warn('[AdManager] Interstitial load error:', err);
            unsubError();
        });

        _ad.load();
    },

    /** Returns true if all frequency caps pass and ad is loaded. */
    canShow(): boolean {
        if (!_loaded || !_ad) return false;

        const now = Date.now();
        const todayKey = getDayKeyFromDate(Date.now());

        // Reset daily count if new day
        const caps = _caps;
        const effectiveCount =
            caps.lastShownDayKey === todayKey ? caps.shownTodayCount : 0;

        return (
            now - caps.lastShownAt >= MIN_INTERVAL_MS &&
            caps.sessionsSinceLastAd >= MIN_SESSIONS &&
            effectiveCount < MAX_PER_DAY
        );
    },

    /**
     * Show the interstitial. Calls onClose when dismissed or on error.
     * Returns false if not loaded (caller should skip silently).
     */
    show(onClose: () => void): boolean {
        if (!_loaded || !_ad) return false;

        const ad = _ad;

        const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
            _loaded = false;
            _ad = null;
            unsubClosed();
            onClose();
            // Preload next ad in background
            setTimeout(() => InterstitialAdManager.preload(), 2000);
        });

        const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
            _loaded = false;
            _ad = null;
            unsubError();
            onClose();
        });

        try {
            ad.show();
            return true;
        } catch (e) {
            if (__DEV__) console.warn('[AdManager] show() failed:', e);
            _loaded = false;
            _ad = null;
            onClose();
            return false;
        }
    },

    /** Call after a successful show to persist frequency caps. */
    async recordShown(): Promise<void> {
        await loadCaps();
        const todayKey = getDayKeyFromDate(Date.now());
        const effectiveCount =
            _caps.lastShownDayKey === todayKey ? _caps.shownTodayCount : 0;

        _caps = {
            lastShownAt: Date.now(),
            shownTodayCount: effectiveCount + 1,
            sessionsSinceLastAd: 0,
            lastShownDayKey: todayKey,
        };
        await saveCaps();
    },

    /** Call after each focus session completes (increments session counter). */
    async recordSession(): Promise<void> {
        await loadCaps();
        _caps = { ..._caps, sessionsSinceLastAd: _caps.sessionsSinceLastAd + 1 };
        await saveCaps();
    },

    /** Load caps from storage (call once at app start). */
    async init(): Promise<void> {
        await loadCaps();
    },
};
