import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '../../components/ui/PressableScale';
import { t } from '../../i18n';
import { useUiStore } from '../../stores/uiStore';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/type';
import { radius, space } from '../../theme/layout';
import { ASPECT, DURATION, LAND_MS, headroom, linePose } from './choreography';
import { MorphArt, useMorphHaptic } from './MorphStage';

/**
 * The one-time v1.4 welcome (Phase 1 D1; welcome brief `.impeccable/surfaces/app-welcome-tsx.md`):
 * the diary itself, opened once. Pomo & Doro sit on a closed diary; they crouch, leap as it swings
 * open, land with a squash on its pages, hop towards each other, and dive into the two faces of the
 * Same Page mark (ADR-0047). One line, then Start. The timeline is `choreography.ts`.
 *
 * - Start is live from the first frame; the morph never blocks it (`motion.md`).
 * - Reduce Motion: the settled mark fades in, with no movement or scale.
 * - Runs on the UI thread from one shared value, with no React render per frame. One soft haptic
 *   on the frame Pomo lands, following Settings › Haptics.
 * - VoiceOver: the art is one element, then the line, then Start.
 */
export function WelcomeScreen() {
    const { tokens } = useTheme();
    const { width, height, fontScale } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const reduced = useReducedMotion();
    const audience = useUiStore((s) => s.welcomeAudience);
    const markWelcomeSeen = useUiStore((s) => s.markWelcomeSeen);

    const compactHeight = height < 500;
    // At AX sizes the line needs the room: the art gives it up (break-ui #2).
    const artScale = fontScale >= 1.6 ? 0.6 : 1;
    const boxW = Math.round(artScale * (compactHeight ? Math.min(width * 0.42, (height - insets.top - insets.bottom) / ASPECT * 0.6) : Math.min(width * 0.78, 420)));
    const box = { w: boxW, h: Math.round(boxW * ASPECT) };
    // Seated on the closed cover, Pomo & Doro stand up to 0.28 of the art's height above it, and Pomo's
    // leap peaks 0.14 higher (`headroom`). The art keeps that much headroom, so the ScrollView never clips them
    // (the largest text sizes push the art to the top); a compact height also flattens the arcs.
    const room = compactHeight ? 0.5 : 1;
    const artHeadroom = reduced ? space.xxl : Math.max(space.xxl, Math.ceil(box.h * headroom(room)));

    // Milliseconds since the morph began, on the UI thread; the last frame is the static mark.
    const p = useSharedValue(reduced ? DURATION : 0);
    useEffect(() => {
        if (reduced) return;
        p.set(withTiming(DURATION, { duration: DURATION, easing: Easing.linear }));
    }, [p, reduced]);

    // One soft tap on the frame Pomo's feet reach the page.
    useMorphHaptic(p, LAND_MS);

    const line = useAnimatedStyle(() => {
        const l = linePose(p.get());
        return { opacity: l.opacity, transform: [{ translateY: l.dy }] };
    });

    const start = () => {
        markWelcomeSeen();
        if (router.canGoBack()) router.back();
    };

    const art = <MorphArt p={p} box={box} room={room} reduced={reduced} label={t('welcome.art')} />;

    return (
        <View style={[styles.screen, { backgroundColor: tokens.page, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.l }]}>
            <ScrollView contentContainerStyle={[styles.body, compactHeight && styles.bodyCompact]} bounces={false} showsVerticalScrollIndicator={false}>
                <View style={[styles.artSlot, { paddingTop: artHeadroom }]}>{art}</View>
                <View style={[styles.side, compactHeight && styles.sideCompact]}>
                    <Animated.Text style={[styles.line, { color: tokens.ink }, reduced ? null : line]} maxFontSizeMultiplier={1.6}>
                        {t(audience === 'updated' ? 'welcome.updated' : 'welcome.fresh')}
                    </Animated.Text>
                    {compactHeight && <StartPill tokens={tokens} onPress={start} />}
                </View>
            </ScrollView>
            {!compactHeight && <StartPill tokens={tokens} onPress={start} />}
        </View>
    );
}

function StartPill({ tokens, onPress }: { tokens: ReturnType<typeof useTheme>['tokens']; onPress: () => void }) {
    return (
        <PressableScale onPress={onPress} style={[styles.start, { backgroundColor: tokens.primary }]}>
            <Text style={[styles.startLabel, { color: tokens.onPrimary }]} maxFontSizeMultiplier={1.6}>
                {t('welcome.start')}
            </Text>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, paddingHorizontal: space.xl },
    body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: space.xxl },
    bodyCompact: { flexDirection: 'row' },
    artSlot: { alignItems: 'center', justifyContent: 'center' },
    side: { alignItems: 'center', gap: space.xl },
    sideCompact: { flex: 1 },
    line: { fontFamily: fonts.semiBold, fontSize: 28, lineHeight: 36, textAlign: 'center' },
    start: {
        minHeight: 56,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: space.xl,
        alignSelf: 'stretch',
    },
    startLabel: { fontSize: 18, fontWeight: '600' },
});
