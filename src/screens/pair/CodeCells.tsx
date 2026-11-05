import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { edgeWidth, radius, space } from '../../theme/layout';
import { CODE_LENGTH } from './pairing';

const CELL_WIDTH = 40;
const CELL_HEIGHT = 48;
const CELL_GAP = space.xs + 2;

/** How wide a row of three cells is at scale 1, so a page can tell whether they fit. */
export const CODE_WIDTH = 3 * CELL_WIDTH + 2 * CELL_GAP;

/**
 * How large the cells can be in a spread this wide: a zoomed small iPhone leaves 272 pt, and a small one in
 * landscape less, where three at full size wouldn't fit on one of two pages. Stacked pages have the whole width,
 * so there they grow with the text.
 *   in : `spreadWidth`, what the spread actually gets; `stacked`, whether the pages stack.
 *   out: the scale for `CodeCells`; no side effects. `space.s` is the gap between pages and each page's padding.
 */
export function cellScaleFor(spreadWidth: number, stacked: boolean): number {
    if (stacked) return 1.2;
    const room = (spreadWidth - space.s) / 2 - 2 * space.s - 2 * edgeWidth;
    return Math.min(1, room / CODE_WIDTH);
}

/** One empty cell, the facing page's promise before sign-in. Decoration, hidden from VoiceOver. */
export function DashedCell() {
    const { tokens } = useTheme();
    return (
        <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.cell, styles.empty, { width: CELL_WIDTH, height: CELL_HEIGHT, borderColor: tokens.edgeStrong }]}
        />
    );
}

/**
 * A code in two rows of three fixed cells, so it never shifts as it's typed. The cells are decoration, hidden
 * from VoiceOver: the page around them carries the code in words, or the real text field.
 *
 *   in : `value`, the characters so far (up to six); `scale`, for the largest text sizes and the narrowest pages.
 *   out: empty cells have a dashed border, the language of Today's owed sessions.
 */
export function CodeCells({ value, scale = 1 }: { value: string; scale?: number }) {
    const { tokens } = useTheme();
    const cells = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? '');
    const cell = (ch: string, i: number) => (
        <View
            key={i}
            style={[
                styles.cell,
                { width: CELL_WIDTH * scale, height: CELL_HEIGHT * scale, borderColor: ch ? tokens.edge : tokens.edgeStrong, backgroundColor: ch ? tokens.page : 'transparent' },
                !ch && styles.empty,
            ]}
        >
            <Text style={[styles.char, { color: tokens.ink, fontSize: 22 * scale }]} allowFontScaling={false}>
                {ch}
            </Text>
        </View>
    );
    return (
        <View style={styles.rows} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={styles.row}>{cells.slice(0, 3).map(cell)}</View>
            <View style={styles.row}>{cells.slice(3).map((ch, i) => cell(ch, i + 3))}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    rows: { gap: CELL_GAP, alignItems: 'center' },
    row: { flexDirection: 'row', gap: CELL_GAP },
    cell: { borderWidth: edgeWidth, borderRadius: radius.s, alignItems: 'center', justifyContent: 'center' },
    empty: { borderStyle: 'dashed' },
    char: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
