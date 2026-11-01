import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useReducedMotion,
    useSharedValue,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PressableScale } from '../../components/ui/PressableScale';
import { Sticker, type StickerArt } from '../../components/stickers/Sticker';
import { pomoIdle } from '../../components/stickers/art/pomoIdle';
import { pomoCelebrating } from '../../components/stickers/art/pomoCelebrating';
import { doroIdle } from '../../components/stickers/art/doroIdle';
import { doroCelebrating } from '../../components/stickers/art/doroCelebrating';
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
import {
    ASPECT,
    CHARACTER_ORIGIN,
    CHARACTER_SIZE,
    DIARY_ORIGIN,
    DURATION,
    FEET,
    LAND_MS,
    PARTICLE_COUNT,
    SPREAD_ORIGIN,
    characterPose,
    diaryPose,
    headroom,
    linePose,
    particlePose,
    type Who,
} from './choreography';

// The art box is the mark's own artboard (784 × 576), so the layers stack into it exactly;
// the spine sits at its horizontal centre, which is the default transform origin.
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

const POSES = { pomo: { idle: pomoIdle, joy: pomoCelebrating }, doro: { idle: doroIdle, joy: doroCelebrating } } as const;

type Box = { w: number; h: number };

const SPARKLE = 8;

function Layer({ art, width, style }: { art: StickerArt; width: number; style?: object }) {
    return (
        <Animated.View style={[StyleSheet.absoluteFill, styles.flat, style]}>
            <Sticker art={art} width={width} />
        </Animated.View>
    );
}

/**
 * The diary (choreography.ts): it squashes about its foot and slides to centre (the outer view),
 * the cover turns on the spine in perspective and hands over to the left page at edge-on, the right
 * page shows once the cover lifts, and the spread bumps as it takes in the faces (the inner view).
 */
function Diary({ p, box, layers }: { p: SharedValue<number>; box: Box; layers: (typeof LAYERS)['colour'] }) {
    const perspective = box.w * 3;
    // The pose once a frame; the five layers' styles read it.
    const pose = useDerivedValue(() => diaryPose(p.get()));
    const outer = useAnimatedStyle(() => {
        const d = pose.get();
        return { transform: [{ translateX: d.shiftX * box.w }, { scaleX: d.sx }, { scaleY: d.sy }] };
    });
    const inner = useAnimatedStyle(() => {
        const d = pose.get();
        return { transform: [{ translateY: d.dip * box.h }, { scale: d.bump }] };
    });
    const right = useAnimatedStyle(() => ({ opacity: pose.get().rightOpacity }));
    const left = useAnimatedStyle(() => {
        const d = pose.get();
        return { opacity: d.leftOpacity, transform: [{ perspective }, { rotateY: `${d.leftAngle}deg` }] };
    });
    const cover = useAnimatedStyle(() => {
        const d = pose.get();
        return { opacity: d.coverOpacity, transform: [{ perspective }, { rotateY: `${d.coverAngle}deg` }] };
    });
    return (
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: DIARY_ORIGIN }, outer]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: SPREAD_ORIGIN }, inner]}>
                <Layer art={layers.edgeLeft} width={box.w} style={left} />
                <Layer art={layers.edgeRight} width={box.w} style={right} />
                <Layer art={layers.pageLeft} width={box.w} style={left} />
                <Layer art={layers.pageRight} width={box.w} style={right} />
                <Layer art={layers.cover} width={box.w} style={cover} />
            </Animated.View>
        </Animated.View>
    );
}

/** Pomo or Doro, placed by the feet and squashed and stretched about them, crossfading into joy on landing. */
function Character({ who, p, box, room }: { who: Who; p: SharedValue<number>; box: Box; room: number }) {
    const size = box.w * CHARACTER_SIZE;
    const pose = useDerivedValue(() => characterPose(who, p.get(), room));
    const body = useAnimatedStyle(() => {
        const c = pose.get();
        return {
            opacity: c.opacity,
            transform: [
                { translateX: c.x * box.w - size / 2 },
                { translateY: c.y * box.h - FEET * size },
                { rotate: `${c.rot}deg` },
                { scaleX: c.sx },
                { scaleY: c.sy },
            ],
        };
    });
    const joy = useAnimatedStyle(() => ({ opacity: pose.get().celebrate }));
    return (
        <Animated.View style={[styles.character, { width: size, height: size, transformOrigin: CHARACTER_ORIGIN }, body]}>
            <Sticker art={POSES[who].idle} width={size} />
            <Animated.View style={[StyleSheet.absoluteFill, joy]}>
                <Sticker art={POSES[who].joy} width={size} />
            </Animated.View>
        </Animated.View>
    );
}

/** One sparkle from a face as the spread takes Pomo & Doro in. */
function Sparkle({ i, p, box, colour }: { i: number; p: SharedValue<number>; box: Box; colour: string }) {
    const style = useAnimatedStyle(() => {
        const s = particlePose(i, p.get());
        return {
            opacity: s.opacity,
            transform: [
                { translateX: s.x * box.w - SPARKLE / 2 },
                { translateY: s.y * box.h - SPARKLE / 2 },
                { rotate: `${s.rot}deg` },
                { scale: s.scale },
            ],
        };
    });
    return <Animated.View style={[styles.sparkle, { backgroundColor: colour }, style]} />;
}

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
    const { tokens, isDark } = useTheme();
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
    const layers = LAYERS[isDark ? 'reversed' : 'colour'];
    // Pomo's sparkles are strawberry over the cocoa pages; over the dark theme's strawberry pages
    // they would vanish, so there they are milk-white glints. Doro's matcha shows on both.
    const pomoSparkle = isDark ? tokens.stickerEdge : tokens.primary;
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
    const tapHaptic = () => {
        if (useSettingsStore.getState().settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    };
    useAnimatedReaction(
        () => p.get() >= LAND_MS,
        (met, was) => {
            if (met && was === false) scheduleOnRN(tapHaptic);
        },
    );

    const line = useAnimatedStyle(() => {
        const l = linePose(p.get());
        return { opacity: l.opacity, transform: [{ translateY: l.dy }] };
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
            <Diary p={p} box={box} layers={layers} />
            {!reduced && <Character who="pomo" p={p} box={box} room={room} />}
            {!reduced && <Character who="doro" p={p} box={box} room={room} />}
            {!reduced &&
                Array.from({ length: PARTICLE_COUNT }, (_, i) => (
                    <Sparkle key={i} i={i} p={p} box={box} colour={i < PARTICLE_COUNT / 2 ? pomoSparkle : tokens.success} />
                ))}
        </Animated.View>
    );

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
    character: { position: 'absolute', left: 0, top: 0 },
    // Each turning face hides its back natively; the opacity switch at edge-on keeps it exact.
    flat: { backfaceVisibility: 'hidden' },
    sparkle: { position: 'absolute', left: 0, top: 0, width: SPARKLE, height: SPARKLE, borderRadius: 2 },
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
