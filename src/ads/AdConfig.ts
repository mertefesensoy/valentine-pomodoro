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

const productionBannerId = Platform.select({
    ios: extra.admobBannerIdIos,
    android: extra.admobBannerIdAndroid,
});

// Fallback to TestIds.BANNER if production ID is missing
export const BANNER_ID = __DEV__
    ? TestIds.BANNER
    : (productionBannerId ?? TestIds.BANNER);
