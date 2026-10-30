import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
    Easing,
    FadeIn,
    interpolate,
    useAnimatedReaction,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PressableScale } from '../../components/ui/PressableScale';
import { Sticker, type StickerArt } from '../../components/stickers/Sticker';
import { pomoIdle } from '../../components/stickers/art/pomoIdle';
import { doroIdle } from '../../components/stickers/art/doroIdle';
import { welcomeCoverColour } from '../../components/stickers/art/welcomeCoverColour';
import { welcomeCoverReversed } from '../../components/stickers/art/welcomeCoverReversed';
import { welcomeEdgeLeftColour } from '../../components/stickers/art/welcomeEdgeLeftColour';
import { welcomeEdgeLeftReversed } from '../../components/stickers/art/welcomeEdgeLeftReversed';
import { welcomeEdgeRightColour } from '../../components/stickers/art/welcomeEdgeRightColour';
import { welcomeEdgeRightReversed } from '../../components/stickers/art/welcomeEdgeRightReversed';
import { welcomePageLeftColour } from '../../components/stickers/art/welcomePageLeftColour';
import { welcomePageLeftReversed } from '../../components/stickers/art/welcomePageLeftReversed';
import { welcomePageRightColour } from '../../components/stickers/art/welcomePageRightColour';
import { welcomePageRightReversed } from '../../components/stickers/art/welcomePageRightReversed';
import { t } from '../../i18n';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/type';
import { radius, space } from '../../theme/layout';
import { cubicBezier } from '../../utils/easing';

// The art box is the mark's own artboard (784 × 576), so the layers stack into it exactly;
// the spine sits at its horizontal centre, which is the default transform origin.
const ASPECT = 576 / 784;
const LAYERS = {
    colour: {
        edgeLeft: welcomeEdgeLeftColour, edgeRight: welcomeEdgeRightColour,
        pageLeft: welcomePageLeftColour, pageRight: welcomePageRightColour, cover: welcomeCoverColour,
    },
    reversed: {
        edgeLeft: welcomeEdgeLeftReversed, edgeRight: welcomeEdgeRightReversed,
        pageLeft: welcomePageLeftReversed, pageRight: welcomePageRightReversed, cover: welcomeCoverReversed,
    },
} satisfies Record<string, Record<string, StickerArt>>;

// The morph (welcome brief §3), one progress value from 0 to 1 over 2.4 s ("one cord"):
//   0.15–0.55  the cover swings shut onto the spine while both pages unfold out of it,
//              and the closed diary's offset (it sat centred) eases back so the spread is centred
//   0.25–0.60  Pomo & Doro walk from the cover's top edge to the two faces
//   0.55–0.75  they hand over to the faces in a crossfade ("layered handover")
//   0.60–1.00  the mark settles; the line lands from 0.75
// Ease-out for what enters or settles, ease-in-out for what crosses the page; no overshoot (the
// bounce belongs to the sticker placement).
const DURATION = 2400;
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = cubicBezier(0.77, 0, 0.175, 1);
// Where the closed cover's centre sits right of the spine, as a share of the box (cover x 512–842 of 120–904).
const CLOSED_SHIFT = 0.21;
// The faces' centroids on the mark, as shares of the box (each face group rotated ±5° about the spine foot).
const FACE = { left: { x: 0.373, y: 0.49 }, right: { x: 0.627, y: 0.49 } };

function stage(p: number, from: number, to: number, ease: (t: number) => number) {
    'worklet';
    const t = Math.min(Math.max((p - from) / (to - from), 0), 1);
    return ease(t);
}

function Layer({ art, width, style }: { art: StickerArt; width: number; style: object }) {
    return (
        <Animated.View style={[StyleSheet.absoluteFill, style]}>
            <Sticker art={art} width={width} />
        </Animated.View>
    );
}

function Character({ who, p, box }: { who: 'pomo' | 'doro'; p: SharedValue<number>; box: { w: number; h: number } }) {
    const size = box.w * 0.22;
    const start = { x: who === 'pomo' ? 0.42 : 0.58, y: 0.0 }; // sitting on the closed cover's top edge
    const end = FACE[who === 'pomo' ? 'left' : 'right'];
    const style = useAnimatedStyle(() => {
        const walk = stage(p.get(), 0.25, 0.6, EASE_IN_OUT);
        const fade = stage(p.get(), 0.55, 0.75, EASE_OUT);
        const x = (start.x + (end.x - start.x) * walk) * box.w - size / 2;
        const y = (start.y + (end.y - start.y) * walk) * box.h - size / 2;
        return {
            opacity: 1 - fade,
            transform: [{ translateX: x }, { translateY: y }, { scale: 1 - 0.25 * walk }],
        };
    });
    return (
        <Animated.View style={[styles.character, { width: size, height: size }, style]}>
            <Sticker art={who === 'pomo' ? pomoIdle : doroIdle} width={size} />
        </Animated.View>
    );
}

/**
 * The one-time v1.4 welcome (Phase 1 D1; welcome brief `.impeccable/surfaces/app-welcome-tsx.md`):
 * the diary itself, opened once. Pomo & Doro sit on a closed diary; it opens, each steps onto a page
 * and becomes it, and the spread settles into the Same Page mark (ADR-0047). One line, then Start.
 *
 * - Start is live from the first frame; the morph never blocks it (`motion.md`).
 * - Reduce Motion: the settled mark fades in, with no movement or scale.
 * - Runs on the UI thread from one shared value, with no React render per frame. The light haptic
 *   when the pages meet follows Settings › Haptics.
 * - VoiceOver: the art is one element, then the line, then Start.
 */
export function WelcomeScreen() {
    const { tokens, isDark } = useTheme();
    const { width, height, fontScale } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const reduced = useReducedMotion();
    const audience = useUiStore((s) => s.welcomeAudience);
    const markWelcomeSeen = useUiStore((s) => s.markWelcomeSeen);

    const compactHeight = height < 500;
    // At AX sizes the line needs the room: the art gives it up (break-ui #2).
    const artScale = fontScale >= 1.6 ? 0.6 : 1;
    const boxW = Math.round(artScale * (compactHeight ? Math.min(width * 0.42, (height - insets.top - insets.bottom) / ASPECT * 0.8) : Math.min(width * 0.78, 420)));
    const box = { w: boxW, h: Math.round(boxW * ASPECT) };
    const layers = LAYERS[isDark ? 'reversed' : 'colour'];

    const p = useSharedValue(reduced ? 1 : 0);
    useEffect(() => {
        if (reduced) return;
        p.set(withTiming(1, { duration: DURATION, easing: Easing.linear }));
    }, [p, reduced]);

    // One light tap as the pages meet (the brief leaves its keeping to the device check).
    const tapHaptic = () => {
        if (useSettingsStore.getState().settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    };
    useAnimatedReaction(
        () => p.get() >= 0.6,
        (met, was) => {
            if (met && was === false) scheduleOnRN(tapHaptic);
        },
    );

    const group = useAnimatedStyle(() => {
        const open = stage(p.get(), 0.15, 0.55, EASE_OUT);
        const settle = stage(p.get(), 0.6, 1, EASE_OUT);
        return { transform: [{ translateX: -CLOSED_SHIFT * box.w * (1 - open) }, { scale: 0.96 + 0.04 * settle }] };
    });
    const unfold = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(stage(p.get(), 0.15, 0.55, EASE_OUT), 0.001) }] }));
    const cover = useAnimatedStyle(() => {
        const open = stage(p.get(), 0.15, 0.55, EASE_OUT);
        return { opacity: open >= 0.999 ? 0 : 1, transform: [{ scaleX: Math.max(1 - open, 0.001) }] };
    });
    const line = useAnimatedStyle(() => {
        const land = stage(p.get(), 0.75, 1, EASE_OUT);
        return { opacity: land, transform: [{ translateY: 8 * (1 - land) }] };
    });

    const start = () => {
        markWelcomeSeen();
        if (router.canGoBack()) router.back();
    };

    const art = (
        <Animated.View
            entering={reduced ? FadeIn.duration(300) : undefined}
            style={{ width: box.w, height: box.h }}
            accessible
            accessibilityRole="image"
            accessibilityLabel={t('welcome.art')}
        >
            <Animated.View style={[StyleSheet.absoluteFill, group]}>
                <Layer art={layers.edgeLeft} width={box.w} style={unfold} />
                <Layer art={layers.edgeRight} width={box.w} style={unfold} />
                <Layer art={layers.pageLeft} width={box.w} style={unfold} />
                <Layer art={layers.pageRight} width={box.w} style={unfold} />
                <Layer art={layers.cover} width={box.w} style={cover} />
            </Animated.View>
            {!reduced && <Character who="pomo" p={p} box={box} />}
            {!reduced && <Character who="doro" p={p} box={box} />}
        </Animated.View>
    );

    return (
        <View style={[styles.screen, { backgroundColor: tokens.page, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.l }]}>
            <ScrollView contentContainerStyle={[styles.body, compactHeight && styles.bodyCompact]} bounces={false} showsVerticalScrollIndicator={false}>
                <View style={styles.artSlot}>{art}</View>
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
    artSlot: { alignItems: 'center', justifyContent: 'center', paddingTop: space.xxl },
    side: { alignItems: 'center', gap: space.xl },
    sideCompact: { flex: 1 },
    character: { position: 'absolute', left: 0, top: 0 },
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
