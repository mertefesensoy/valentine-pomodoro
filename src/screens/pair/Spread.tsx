import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { css, cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '../../theme/useTheme';
import { edgeWidth, radius, space } from '../../theme/layout';

/**
 * The two pages (the pairing brief): the same spread as the Timer's Facing Pages, leaning 1° toward the spine,
 * outer corners 22 and spine corners 8. At the largest text sizes they stack, you first.
 *
 *   in : `left` and `right`, each page's contents; `stacked`; `rightFlat`, the right page lifts to flat while
 *        typing, a CSS transition on the UI thread, instant under Reduce Motion.
 */
export function Spread({ left, right, stacked, rightFlat = false }: { left: ReactNode; right: ReactNode; stacked: boolean; rightFlat?: boolean }) {
    const { tokens } = useTheme();
    const reduced = useReducedMotion();
    const paper = { backgroundColor: tokens.paper, borderColor: tokens.edge };
    if (stacked) {
        return (
            <View style={styles.stack}>
                <View style={[styles.pageStacked, paper]}>{left}</View>
                <View style={[styles.pageStacked, paper]}>{right}</View>
            </View>
        );
    }
    return (
        <View style={styles.row}>
            <View style={[styles.page, styles.left, paper]}>{left}</View>
            <Animated.View style={[styles.page, styles.right, paper, rightFlat && styles.flat, reduced && styles.instant]}>{right}</Animated.View>
        </View>
    );
}

/** One page by itself, for a step that belongs to just you. */
export function Page({ children }: { children: ReactNode }) {
    const { tokens } = useTheme();
    return <View style={[styles.pageStacked, { backgroundColor: tokens.paper, borderColor: tokens.edge }]}>{children}</View>;
}

// css.create types Reanimated's CSS transition properties, which StyleSheet.create doesn't know.
const styles = css.create({
    row: { flexDirection: 'row', gap: space.s },
    stack: { gap: space.m },
    page: {
        flex: 1,
        minHeight: 230,
        borderWidth: edgeWidth,
        paddingHorizontal: space.s,
        paddingVertical: space.m,
        alignItems: 'center',
        gap: space.s,
    },
    left: {
        borderTopLeftRadius: radius.l,
        borderBottomLeftRadius: radius.l,
        borderTopRightRadius: radius.s,
        borderBottomRightRadius: radius.s,
        transform: [{ rotate: '-1deg' }],
        transformOrigin: 'bottom right',
    },
    right: {
        borderTopRightRadius: radius.l,
        borderBottomRightRadius: radius.l,
        borderTopLeftRadius: radius.s,
        borderBottomLeftRadius: radius.s,
        transform: [{ rotate: '1deg' }],
        transformOrigin: 'bottom left',
        transitionProperty: ['transform'],
        transitionDuration: 180,
        transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
    },
    flat: { transform: [{ rotate: '0deg' }] },
    instant: { transitionDuration: 0 },
    pageStacked: {
        borderWidth: edgeWidth,
        borderRadius: radius.l,
        padding: space.l,
        alignItems: 'center',
        gap: space.s,
    },
});
