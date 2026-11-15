import React, { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_MAC } from '../platform/isMac';
import { space } from '../theme/layout';
import { useTheme } from '../theme/useTheme';
import { BANNER_ID, MAC_BANNER_RESIZE_SETTLE_MS } from './AdConfig';
import { AdManager } from './AdManager';
import { noteMacBannerFailed, noteMacBannerLoaded, noteMacBannerRequested } from './bannerStatus';

/**
 * `value`, once it has kept the same value for `ms`. The first value is
 * returned at once; a later one only after `ms` with no further change, so a
 * value that changes every frame and comes back within `ms` is never passed on.
 */
export function useSettledValue<T>(value: T, ms: number): T {
    const [settled, setSettled] = useState(value);
    useEffect(() => {
        if (Object.is(value, settled)) return;
        const timer = setTimeout(() => setSettled(value), ms);
        return () => clearTimeout(timer);
    }, [value, settled, ms]);
    return settled;
}

/**
 * The Mac's always-on banner (1.5.2, FR-ADS-003): one banner at the bottom of
 * the window, under every tab. On a Mac it replaces the Stats banner; the
 * interstitial still follows FR-ADS-001, as on an iPhone (the owner,
 * 2026-11-15: "Both").
 *
 * - **Output:** nothing unless IS_MAC. On a Mac, a slot that takes no height
 *   until an ad fills it.
 * - **Side effects:** one ad request once AdManager.init() has settled (after
 *   the first frame and the SDK's start), and one more each time the window's
 *   width has settled on a new value (MAC_BANNER_RESIZE_SETTLE_MS).
 * - **Invariant:** mounted once, by the root layout (app/_layout.tsx).
 *
 * Record: docs/implementations/2026-11-15-v152-mac.md.
 */
export function MacBanner(): React.JSX.Element | null {
    if (!IS_MAC) return null;
    return <MacBannerSlot />;
}

function MacBannerSlot(): React.JSX.Element {
    const { tokens } = useTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    // The SDK sizes an anchored adaptive banner from the screen unless given a
    // width (RNGoogleMobileAdsCommon.mm), and a Mac window is narrower than its
    // screen. A new width requests a new ad, so it waits for the resize to end.
    const adWidth = useSettledValue(Math.floor(width), MAC_BANNER_RESIZE_SETTLE_MS);

    const [ready, setReady] = useState(false);
    useEffect(() => {
        let live = true;
        AdManager.init().then(() => {
            if (live) setReady(true);
        });
        return () => {
            live = false;
        };
    }, []);

    // Each request, with its width, for B7's hidden panel (bannerStatus): on a Mac an empty edge
    // is otherwise the same for no fill, an error, and a Mac not detected.
    useEffect(() => {
        if (ready) noteMacBannerRequested(adWidth);
    }, [ready, adWidth]);

    // Empty (before the first answer, or with no fill) the slot draws nothing and takes no height.
    const [filled, setFilled] = useState(false);

    return (
        <View
            testID="mac-banner"
            style={[
                styles.slot,
                filled && {
                    backgroundColor: tokens.paper,
                    borderTopColor: tokens.edge,
                    borderTopWidth: 1,
                    paddingTop: space.s,
                    paddingBottom: insets.bottom + space.s,
                },
            ]}
        >
            {ready && (
                <BannerAd
                    unitId={BANNER_ID}
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    width={adWidth}
                    requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                    onAdLoaded={(size) => {
                        setFilled(true);
                        noteMacBannerLoaded(size);
                    }}
                    onAdFailedToLoad={(error) => {
                        setFilled(false);
                        noteMacBannerFailed(error);
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    slot: { alignItems: 'center' },
});
