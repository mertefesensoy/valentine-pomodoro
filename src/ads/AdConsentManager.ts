/**
 * AdConsentManager — UMP (User Messaging Platform) + ATT consent flow.
 *
 * Call initConsent() once at app startup (before MobileAds().initialize()).
 * On iOS: requests ATT permission after UMP consent is resolved.
 * On EEA/UK: shows consent form if required.
 * On other regions: resolves immediately.
 */

import { Platform } from 'react-native';
import {
    AdsConsent,
    AdsConsentStatus,
    type AdsConsentInfo,
} from 'react-native-google-mobile-ads';
import MobileAds from 'react-native-google-mobile-ads';

let _consentReady = false;
let _personalized = true;

export function isConsentReady(): boolean {
    return _consentReady;
}

export function isPersonalizedAdsEnabled(): boolean {
    return _personalized;
}

/**
 * Call once at app start. Resolves when consent is determined and
 * MobileAds SDK is initialized.
 */
export async function initConsent(personalizedAds: boolean = true): Promise<void> {
    _personalized = personalizedAds;

    try {
        // 1. Request UMP consent info update
        const info: AdsConsentInfo = await AdsConsent.requestInfoUpdate();

        // 2. Show consent form if required (EEA/UK)
        if (
            info.isConsentFormAvailable &&
            info.status === AdsConsentStatus.REQUIRED
        ) {
            await AdsConsent.loadAndShowConsentFormIfRequired();
        }

        // 3. iOS: request ATT (App Tracking Transparency)
        if (Platform.OS === 'ios') {
            try {
                // expo-tracking-transparency is optional — skip gracefully if not installed
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency') as {
                    requestTrackingPermissionsAsync: () => Promise<unknown>;
                };
                await requestTrackingPermissionsAsync();
            } catch {
                // expo-tracking-transparency not installed — non-personalized ads only
                if (__DEV__) {
                    console.log('[AdConsent] expo-tracking-transparency not available, skipping ATT');
                }
            }
        }

    } catch (e) {
        // Consent flow failed (offline, etc.) — proceed without consent
        if (__DEV__) {
            console.warn('[AdConsent] Consent flow failed:', e);
        }
    }

    // 4. Initialize MobileAds SDK
    try {
        await MobileAds().initialize();
    } catch (e) {
        if (__DEV__) {
            console.warn('[AdConsent] MobileAds init failed:', e);
        }
    }

    _consentReady = true;
}

/**
 * Opens the UMP privacy options form (for Settings "Privacy" button).
 * Only available after initConsent() has been called.
 */
export async function showPrivacyOptionsForm(): Promise<void> {
    try {
        await AdsConsent.showPrivacyOptionsForm();
    } catch (e) {
        if (__DEV__) {
            console.warn('[AdConsent] showPrivacyOptionsForm failed:', e);
        }
    }
}
