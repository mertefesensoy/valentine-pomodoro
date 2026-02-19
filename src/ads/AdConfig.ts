import { TestIds } from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};

const productionId = Platform.select({
    ios: extra.admobInterstitialIdIos,
    android: extra.admobInterstitialIdAndroid,
});

// Fallback to TestIds.INTERSTITIAL if production ID is missing
export const INTERSTITIAL_ID = __DEV__
    ? TestIds.INTERSTITIAL
    : (productionId ?? TestIds.INTERSTITIAL);
