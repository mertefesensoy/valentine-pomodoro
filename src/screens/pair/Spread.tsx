import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { edgeWidth, radius, space } from '../../theme/layout';

/**
 * The two pages (the pairing brief): the same spread as the Timer's Facing Pages, leaning 1° toward the spine,
 * outer corners 22 and spine corners 8. At the largest text sizes they stack, you first.
 */
export function Spread({ left, right, stacked }: { left: ReactNode; right: ReactNode; stacked: boolean }) {
    const { tokens } = useTheme();
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
            <View style={[styles.page, styles.right, paper]}>{right}</View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    },
    pageStacked: {
        borderWidth: edgeWidth,
        borderRadius: radius.l,
        padding: space.l,
        alignItems: 'center',
        gap: space.s,
    },
});
