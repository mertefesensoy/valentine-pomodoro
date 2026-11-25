import { TestIds } from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};

/** An AdMob ad unit id: `ca-app-pub-<publisher>/<unit>`. */
const AD_UNIT_ID_SHAPE = /^ca-app-pub-\d+\/\d+$/;

/**
 * The ad unit id to ask with: the configured one when it has an ad unit id's shape, otherwise Google's test id.
 * A missing id and a placeholder are treated alike, so neither can reach the SDK: until the Android closed test,
 * app.json's Android banner id was the string REPLACE_WITH_ANDROID_BANNER_UNIT_ID, which isn't null, so a `??`
 * fallback let it through and every banner request failed (the Android closed-test plan, finding A2). Pure.
 */
export function adUnitIdOr(configured: unknown, testId: string): string {
    return typeof configured === 'string' && AD_UNIT_ID_SHAPE.test(configured) ? configured : testId;
}

const productionInterstitialId = Platform.select({
    ios: extra.admobInterstitialIdIos,
    android: extra.admobInterstitialIdAndroid,
});

export const INTERSTITIAL_ID = __DEV__
    ? TestIds.INTERSTITIAL
    : adUnitIdOr(productionInterstitialId, TestIds.INTERSTITIAL);

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

export const BANNER_ID = __DEV__
    ? TestIds.BANNER
    : adUnitIdOr(productionBannerId, TestIds.BANNER);

/**
 * How long a Mac window must keep its width before the Mac banner asks for an ad of that width, in ms (1.5.2). A
 * change of the banner's `width` makes the SDK request a new ad, so a drag of the window's edge, which changes the width
 * every frame, would send a request per frame. With this wait it sends one, once the resize has ended.
 */
export const MAC_BANNER_RESIZE_SETTLE_MS = 1000;
