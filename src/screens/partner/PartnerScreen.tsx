import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '../../components/icons/Icon';
import { close as closeGlyph } from '../../components/icons/art/close';
import { PressableScale } from '../../components/ui/PressableScale';
import { t } from '../../i18n';
import { usePartnerGlance } from '../../server/partnerGlance';
import { useTheme } from '../../theme/useTheme';
import { minTarget, space } from '../../theme/layout';
import { partnerName, updatedText } from '../classic/PartnerStrip';
import { PartnerCard } from './PartnerCard';

/**
 * Your partner's day (Phase 2 D2; the brief and contract are `.impeccable/surfaces/app-partner-tsx.md`). A form sheet
 * sized to its content: their name, today's postcard, and when it was last updated. It reads the same small summary
 * as the strip, so it opens at once with the last known values, whatever the network is doing: no spinner, and no
 * fetch of its own, since refreshes stay on the first frame and on returning to the app. Reached by `React.lazy` only.
 */
export default function PartnerScreen() {
    const { tokens } = useTheme();
    const { width } = useWindowDimensions();
    const glance = usePartnerGlance((s) => s.glance);

    const leave = () => {
        if (router.canGoBack()) router.back();
    };

    // A refresh can find they've gone while this is open. There's nothing left to show, and the strip says why.
    useEffect(() => {
        if (!glance && router.canGoBack()) router.back();
    }, [glance]);

    if (!glance) return null;
    const updated = updatedText(glance.updatedAt);

    return (
        // The library sizes a sheet's root scroll view to the whole sheet, so the sheet's paint reaches its bottom edge.
        <ScrollView style={{ backgroundColor: tokens.page }} contentContainerStyle={styles.content} bounces={false}>
            <View style={styles.head}>
                <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header" numberOfLines={2} maxFontSizeMultiplier={1.6}>
                    {partnerName(glance)}
                </Text>
                {/* PressableScale styles its inner view, so the corner is held out here, or its target would be empty. */}
                <View style={styles.closeCorner}>
                    <PressableScale
                        onPress={leave}
                        haptic={false}
                        accessibilityRole="button"
                        accessibilityLabel={t('pair.close')}
                        style={[styles.closeBtn, { backgroundColor: tokens.field }]}
                    >
                        <Icon glyph={closeGlyph} size={20} color={tokens.inkSoft} />
                    </PressableScale>
                </View>
            </View>
            <PartnerCard glance={glance} width={width - 2 * space.l} tokens={tokens} />
            {updated && <Text style={[styles.updated, { color: tokens.inkSoft }]}>{updated}</Text>}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: space.l, paddingTop: space.m, paddingBottom: space.l, gap: space.m },
    head: { minHeight: minTarget, alignItems: 'center', justifyContent: 'center', paddingHorizontal: minTarget },
    title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
    closeCorner: { position: 'absolute', right: 0, top: 4 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    updated: { fontSize: 13, lineHeight: 18 },
});
