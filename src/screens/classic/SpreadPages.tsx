import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { css, cubicBezier, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { t } from '../../i18n';
import type { ThemeTokens } from '../../theme/palette';
import { edgeWidth, radius, space } from '../../theme/layout';
import { PoseSticker, type Pose } from './PoseSticker';

type Props = {
    tokens: ThemeTokens;
    width: number;
    /** AX sizes: the pages stack (you, the timer, your partner) instead of facing (brief §6). */
    stacked: boolean;
    pose: Pose;
    progress: SharedValue<number>;
    isBreak: boolean;
    /** What Pomo & Doro are doing now: the partner slot's line, on the right page's foot. */
    line: string;
    /** The timer and its line, drawn in the spine's frame. */
    children: ReactNode;
};

// The page's corners, as the C4 sketch draws them: round on the outside, tight at the spine.
const SPINE_RADIUS = radius.s;
// Each page leans about 1° toward the spine (brief §3), hinged at its bottom spine-side corner.
const TILT = '1deg';
// The page colour around the spine's frame, which seats it on the spine (the sketch's halo).
const HALO = space.xs;

/** The spine's progress bar: its fill is absolutely positioned and childless, so animating its width re-lays-out nothing. */
function SpineBar({ progress, color, visible }: { progress: SharedValue<number>; color: string; visible: boolean }) {
    const fill = useAnimatedStyle(() => ({ width: `${Math.min(Math.max(progress.get(), 0), 1) * 100}%` }));
    return (
        <Animated.View style={[StyleSheet.absoluteFill, styles.fade, { opacity: visible ? 1 : 0 }]}>
            <Animated.View style={[styles.barFill, { backgroundColor: color }, fill]} />
        </Animated.View>
    );
}

/**
 * Facing Pages (the brief's alternate layout): an open spread of two paper pages, each leaning
 * about 1° toward the spine. Your page carries Pomo; the right page is the partner slot (Doro and
 * the pair's line in v1.4; your partner in Phase 3, with no re-layout). The timer sits on the spine
 * in one frame; during focus only its progress bar moves (one moving part).
 *
 * The layout is the C4 sketch's (finish review fixes 1, 2 and 4). The pages are paper behind three
 * rows: the heads (each page's label and sticker), the spine's frame, then the feet (the partner
 * line on the right page). The frame sits below the stickers in the flow, so it never covers one.
 *
 * VoiceOver: the labels and stickers are decoration. The frame comes first, then the partner line,
 * as brief §6 orders them (the timer, then the partner slot; HIG review M-2).
 */
export function SpreadPages({ tokens, width, stacked, pose, progress, isBreak, line, children }: Props) {
    const pageW = (width - space.s) / 2;
    const sticker = Math.round(Math.min(pageW * 0.34, 64));
    const paper = { backgroundColor: tokens.paper, borderColor: tokens.edge };
    const label = (who: 'you' | 'doro') => (
        <Text style={[styles.who, { color: tokens.inkSoft }]} maxFontSizeMultiplier={1.4} numberOfLines={1}>
            {t(`spread.${who}`)}
        </Text>
    );
    const partnerLine = (
        <Text style={[styles.line, { color: tokens.ink }]}>{line}</Text>
    );

    const frame = (
        <View style={[styles.halo, { backgroundColor: tokens.page, width: stacked ? width : width * 0.66 + HALO * 2 }]}>
            <View style={[styles.frame, { backgroundColor: tokens.page, borderColor: tokens.edge }]}>
                {children}
                <View style={[styles.bar, { backgroundColor: tokens.ringTrack }]}>
                    <SpineBar progress={progress} color={tokens.ringFocus} visible={!isBreak} />
                    <SpineBar progress={progress} color={tokens.ringBreak} visible={isBreak} />
                </View>
            </View>
        </View>
    );

    if (stacked) {
        return (
            <View style={[styles.stack, { width }]}>
                <View style={[styles.pageStacked, paper]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {label('you')}
                    <PoseSticker who="pomo" pose={pose} width={sticker} shadow={tokens.stickerShadow} />
                </View>
                {frame}
                <View style={[styles.pageStacked, paper]}>
                    <View style={styles.head} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                        {label('doro')}
                        <PoseSticker who="doro" pose={pose} width={sticker} shadow={tokens.stickerShadow} />
                    </View>
                    {partnerLine}
                </View>
            </View>
        );
    }

    return (
        <View style={{ width }}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={[styles.page, styles.pageLeft, paper, { width: pageW }]} />
                <View style={[styles.page, styles.pageRight, paper, { width: pageW }]} />
            </View>
            <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <View style={[styles.head, styles.headFacing, { width: pageW }]}>
                    {label('you')}
                    <PoseSticker who="pomo" pose={pose} width={sticker} shadow={tokens.stickerShadow} />
                </View>
                <View style={[styles.head, styles.headFacing, { width: pageW }]}>
                    {label('doro')}
                    <PoseSticker who="doro" pose={pose} width={sticker} shadow={tokens.stickerShadow} />
                </View>
            </View>
            <View style={styles.frameRow}>{frame}</View>
            <View style={styles.row}>
                <View style={{ width: pageW }} />
                <View style={[styles.foot, { width: pageW }]}>{partnerLine}</View>
            </View>
        </View>
    );
}

const styles = css.create({
    page: { position: 'absolute', top: 0, bottom: 0, borderWidth: edgeWidth },
    pageLeft: {
        left: 0,
        borderTopLeftRadius: radius.l,
        borderBottomLeftRadius: radius.l,
        borderTopRightRadius: SPINE_RADIUS,
        borderBottomRightRadius: SPINE_RADIUS,
        transformOrigin: 'right bottom',
        transform: [{ rotate: `-${TILT}` }],
    },
    pageRight: {
        right: 0,
        borderTopLeftRadius: SPINE_RADIUS,
        borderBottomLeftRadius: SPINE_RADIUS,
        borderTopRightRadius: radius.l,
        borderBottomRightRadius: radius.l,
        transformOrigin: 'left bottom',
        transform: [{ rotate: TILT }],
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    head: { alignItems: 'center', gap: space.s },
    headFacing: { paddingTop: space.s, paddingHorizontal: space.s },
    who: { fontSize: 13, fontWeight: '600' },
    frameRow: { alignItems: 'center', paddingTop: space.s },
    foot: { paddingHorizontal: space.m, paddingTop: space.s, paddingBottom: space.l },
    line: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
    pageStacked: {
        alignSelf: 'stretch',
        alignItems: 'center',
        gap: space.s,
        paddingVertical: space.m,
        paddingHorizontal: space.l,
        borderRadius: radius.l,
        borderWidth: edgeWidth,
    },
    stack: { gap: space.m, alignItems: 'center' },
    halo: { padding: HALO, borderRadius: radius.l + HALO },
    frame: {
        borderRadius: radius.l,
        borderWidth: edgeWidth,
        alignItems: 'center',
        paddingHorizontal: space.l,
        paddingTop: space.m,
        paddingBottom: space.l,
        gap: space.xs,
    },
    bar: { alignSelf: 'stretch', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: space.s },
    barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
    fade: {
        transitionProperty: 'opacity',
        transitionDuration: 250,
        transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
    },
});
