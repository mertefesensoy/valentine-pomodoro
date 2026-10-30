import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

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
    /** The timer and its line, drawn in the spine's frame. */
    children: ReactNode;
};

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
 * Facing Pages (the brief's alternate layout): an open spread of two paper pages, each tilted
 * about 1° toward the spine. Your page carries Pomo, the right page is the partner slot (Doro in
 * v1.4; your partner in Phase 3, with no re-layout). The timer sits on the spine in one paper
 * frame; during focus only its progress bar moves (one moving part).
 *
 * VoiceOver: the frame comes first in the tree, drawn above the pages by its stacking, so it is
 * read before them (HIG review M-2). The stickers are decoration; the line under the spread speaks.
 */
export function SpreadPages({ tokens, width, stacked, pose, progress, isBreak, children }: Props) {
    const pageW = (width - space.s) / 2;
    const pageH = Math.round(pageW * 1.45);
    const sticker = Math.round(pageW * 0.42);
    const page = { backgroundColor: tokens.paper, borderColor: tokens.edge };

    const frame = (
        <View style={[styles.frame, { backgroundColor: tokens.paper, borderColor: tokens.edgeStrong, width: stacked ? width : width * 0.66 }]}>
            {children}
            <View style={[styles.bar, { backgroundColor: tokens.ringTrack }]}>
                <SpineBar progress={progress} color={tokens.ringFocus} visible={!isBreak} />
                <SpineBar progress={progress} color={tokens.ringBreak} visible={isBreak} />
            </View>
        </View>
    );

    if (stacked) {
        return (
            <View style={[styles.stack, { width }]}>
                <View style={[styles.page, styles.pageStacked, page]}>
                    <PoseSticker who="pomo" pose={pose} width={sticker} />
                </View>
                {frame}
                <View style={[styles.page, styles.pageStacked, page]}>
                    <PoseSticker who="doro" pose={pose} width={sticker} />
                </View>
            </View>
        );
    }

    return (
        <View style={{ width, height: pageH + space.s }}>
            <View style={styles.frameSlot} pointerEvents="box-none">
                {frame}
            </View>
            <View style={styles.spread} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <View style={[styles.page, page, { width: pageW, height: pageH, transform: [{ rotate: '-1deg' }] }]}>
                    <PoseSticker who="pomo" pose={pose} width={sticker} />
                </View>
                <View style={[styles.page, page, { width: pageW, height: pageH, transform: [{ rotate: '1deg' }] }]}>
                    <PoseSticker who="doro" pose={pose} width={sticker} />
                </View>
            </View>
        </View>
    );
}

const styles = css.create({
    spread: { flexDirection: 'row', justifyContent: 'space-between' },
    page: {
        borderRadius: radius.l,
        borderWidth: edgeWidth,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: space.l,
    },
    pageStacked: { alignSelf: 'stretch', paddingVertical: space.m },
    stack: { gap: space.m, alignItems: 'center' },
    frameSlot: { position: 'absolute', top: space.l, left: 0, right: 0, alignItems: 'center', zIndex: 2 },
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
