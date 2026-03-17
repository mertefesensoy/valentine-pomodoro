import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ad_policy_v1';
const MIN_SESSIONS_BETWEEN_ADS = 2;
const MIN_INTERVAL_SECONDS = 120; // 2 minutes

type AdState = {
    sessionsSinceLastAd: number;
    lastShownAt: number; // timestamp in ms
};

const DEFAULT_STATE: AdState = {
    sessionsSinceLastAd: 0,
    lastShownAt: 0,
};

let _state: AdState = { ...DEFAULT_STATE };
let _isLoaded = false;

/*
 * AdPolicy:
 * - Persists ad counters to AsyncStorage
 * - strict frequency capping logic
 */
export const AdPolicy = {
    async init(): Promise<void> {
        if (_isLoaded) return;
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                _state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
            }
        } catch (e) {
            console.warn('[AdPolicy] Failed to load state', e);
        } finally {
            _isLoaded = true;
        }
    },

    /**
     * Call when a focus session completes successfully.
     * Increments the "sessions since last ad" counter.
     */
    async recordSessionCompletion(): Promise<void> {
        if (!_isLoaded) await this.init();

        _state.sessionsSinceLastAd += 1;
        await this._persist();

        if (__DEV__) {
            console.log(`[AdPolicy] Session recorded. Count: ${_state.sessionsSinceLastAd}`);
        }
    },

    /**
     * Checks if we are allowed to show an interstitial right now.
     * Rules:
     * - At least MIN_SESSIONS_BETWEEN_ADS completed since last ad
     * - At least MIN_INTERVAL_SECONDS elapsed since last ad shown
     */
    shouldShowAd(): boolean {
        if (!_isLoaded) return false;

        const now = Date.now();
        const timeSinceLastAd = now - _state.lastShownAt;
        const intervalPass = (timeSinceLastAd >= MIN_INTERVAL_SECONDS * 1000);
        const sessionsPass = _state.sessionsSinceLastAd >= MIN_SESSIONS_BETWEEN_ADS;

        if (__DEV__) {
            console.log(`[AdPolicy] Check: sessions=${_state.sessionsSinceLastAd}/${MIN_SESSIONS_BETWEEN_ADS}, time=${(timeSinceLastAd / 1000).toFixed(1)}s/${MIN_INTERVAL_SECONDS}s`);
        }

        return sessionsPass && intervalPass;
    },

    /**
     * Call immediately after an ad is displayed.
     * Resets counters and updates timestamp.
     */
    async recordAdShown(): Promise<void> {
        _state.sessionsSinceLastAd = 0;
        _state.lastShownAt = Date.now();
        await this._persist();
        if (__DEV__) console.log('[AdPolicy] Ad shown recorded. Counters reset.');
    },

    async _persist(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
        } catch (e) {
            console.warn('[AdPolicy] Failed to save state', e);
        }
    }
};
