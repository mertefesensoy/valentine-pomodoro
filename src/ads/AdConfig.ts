import { TestIds } from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};

const productionInterstitialId = Platform.select({
    ios: extra.admobInterstitialIdIos,
    android: extra.admobInterstitialIdAndroid,
});

// Fallback to TestIds.INTERSTITIAL if production ID is missing
export const INTERSTITIAL_ID = __DEV__
    ? TestIds.INTERSTITIAL
    : (productionInterstitialId ?? TestIds.INTERSTITIAL);

/**
 * How long the Timer, or Fly, must be calm (in front, idle, no note or goal moment due) before it asks for the
 * interstitial, in ms (DEF-011, 1.5.2). A sheet over the screen leaves the navigator's state the moment it's closed, but
 * iOS is still animating it away, and an ad presented then is expected to fail, because the view controller under it
 * is still presenting. Nothing in the router reports the end of that animation, so the screen waits this long, longer
 * than a form sheet's expected dismissal (about 0.3–0.5 s, not measured on a device).
 */
export const INTERSTITIAL_SETTLE_MS = 800;

const productionBannerId = Platform.select({
    ios: extra.admobBannerIdIos,
    android: extra.admobBannerIdAndroid,
});

// Fallback to TestIds.BANNER if production ID is missing
export const BANNER_ID = __DEV__
    ? TestIds.BANNER
    : (productionBannerId ?? TestIds.BANNER);
