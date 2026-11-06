import { StyleSheet } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    ReduceMotion,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';

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
import { useSettingsStore } from '../../stores/settingsStore';
import { useTheme } from '../../theme/useTheme';
import {
    CHARACTER_ORIGIN,
    CHARACTER_SIZE,
    DIARY_ORIGIN,
    FEET,
    PARTICLE_COUNT,
    SPREAD_ORIGIN,
    characterPose,
    diaryPose,
    particlePose,
    type Who,
} from './choreography';

/**
 * The diary, Pomo & Doro and the sparkles on one timeline (Phase 1 D1; shared since Phase 2 D1). The
 * welcome plays all of it; the first pairing joins at the open spread (PairScreen). Runs on the UI thread
 * from one shared value, milliseconds along choreography.ts, with no React render per frame.
 */

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

export type MorphBox = { w: number; h: number };

const SPARKLE = 8;

// Reanimated would otherwise jump this fade to its end under Reduce Motion, and the mark would pop in.
const SETTLED_IN = FadeIn.duration(300).easing(Easing.bezier(0.23, 1, 0.32, 1)).reduceMotion(ReduceMotion.Never);

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
function Diary({ p, box, layers }: { p: SharedValue<number>; box: MorphBox; layers: (typeof LAYERS)['colour'] }) {
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
function Character({ who, p, box, room, hold }: {
    who: Who;
    p: SharedValue<number>;
    box: MorphBox;
    room: number;
    /** Held still on paper rather than passing through: only the joyful pose, with the sticker lift in this colour. */
    hold?: { shadow: string };
}) {
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
            {!hold && <Sticker art={POSES[who].idle} width={size} />}
            <Animated.View style={[StyleSheet.absoluteFill, joy]}>
                <Sticker art={POSES[who].joy} width={size} shadow={hold?.shadow} />
            </Animated.View>
        </Animated.View>
    );
}

/** One sparkle from a face as the spread takes Pomo & Doro in. */
function Sparkle({ i, p, box, colour }: { i: number; p: SharedValue<number>; box: MorphBox; colour: string }) {
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
 * Just Pomo & Doro at this point of the timeline, for a stage that draws its own pages. Pairing's who-it-is holds
 * them still at the frame the morph starts from, so nothing moves when the drawing takes over. The lift doesn't
 * change a sticker's layout box, so they stay registered. No side effects.
 */
export function MorphCharacters({ p, box, room, shadow }: { p: SharedValue<number>; box: MorphBox; room: number; shadow: string }) {
    return (
        <>
            <Character who="pomo" p={p} box={box} room={room} hold={{ shadow }} />
            <Character who="doro" p={p} box={box} room={room} hold={{ shadow }} />
        </>
    );
}

/**
 * The art.
 *   in : `p`, the timeline's shared value; `box`, its size; `room`, how much of the leap's height there is;
 *        `reduced`, Reduce Motion, which shows the settled mark fading in, with no movement or scale;
 *        `label`, the one thing VoiceOver reads.
 *   out: one image element. No side effects.
 */
export function MorphArt({ p, box, room, reduced, label }: {
    p: SharedValue<number>;
    box: MorphBox;
    room: number;
    reduced: boolean;
    label: string;
}) {
    const { tokens, isDark } = useTheme();
    const layers = LAYERS[isDark ? 'reversed' : 'colour'];
    // Pomo's sparkles are strawberry over the cocoa pages; over the dark theme's strawberry pages
    // they would vanish, so there they are milk-white glints. Doro's matcha shows on both.
    const pomoSparkle = isDark ? tokens.stickerEdge : tokens.primary;
    return (
        <Animated.View
            entering={reduced ? SETTLED_IN : undefined}
            style={{ width: box.w, height: box.h }}
            accessible
            accessibilityRole="image"
            accessibilityLabel={label}
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
}

/**
 * One soft tap when the timeline passes `atMs`, following Settings › Haptics. `armed`, when given, has to be
 * true by then, for a timeline that can also jump past that point with nothing having happened.
 */
export function useMorphHaptic(p: SharedValue<number>, atMs: number, armed?: SharedValue<boolean>): void {
    const tap = () => {
        if (useSettingsStore.getState().settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    };
    useAnimatedReaction(
        () => (armed ? armed.get() : true) && p.get() >= atMs,
        (met, was) => {
            if (met && was === false) scheduleOnRN(tap);
        },
    );
}

const styles = StyleSheet.create({
    character: { position: 'absolute', left: 0, top: 0 },
    // Each turning face hides its back natively; the opacity switch at edge-on keeps it exact.
    flat: { backfaceVisibility: 'hidden' },
    sparkle: { position: 'absolute', left: 0, top: 0, width: SPARKLE, height: SPARKLE, borderRadius: 2 },
});

