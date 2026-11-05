import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { edgeWidth, radius, space } from '../../theme/layout';
import { CODE_LENGTH } from './pairing';

const CELL_WIDTH = 40;
const CELL_HEIGHT = 48;

/**
 * A code in two rows of three fixed cells, so it never shifts as it's typed. The cells are decoration, hidden
 * from VoiceOver: the page around them carries the code in words, or the real text field.
 *
 *   in : `value`, the characters so far (up to six); `scale`, for the largest text sizes.
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
    rows: { gap: space.xs + 2, alignItems: 'center' },
    row: { flexDirection: 'row', gap: space.xs + 2 },
    cell: { borderWidth: edgeWidth, borderRadius: radius.s, alignItems: 'center', justifyContent: 'center' },
    empty: { borderStyle: 'dashed' },
    char: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
