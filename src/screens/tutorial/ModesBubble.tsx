import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Sticker } from '../../components/stickers/Sticker';
import { pomoIdle } from '../../components/stickers/art/pomoIdle';
import { isFlyModeAvailable } from '../../constants/features';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { edgeWidth, radius, space } from '../../theme/layout';
import { currentStep, useTourStore } from './tourStore';
import { MODES_SHEET_LINE } from './tutorials';

/** Whether the tour is at its Modes step: the Modes sheet then hosts its own bubble (T-4). */
export function useTourAtModes(): boolean {
    return useTourStore((s) => !!s.run && s.run.beat === 'here' && currentStep(s.run)?.id === 'modes');
}

/**
 * The Modes sheet's bubble at the Modes step (Phase 1 D5; T-4, accepted in part). The sheet is a
 * native form sheet over everything, the tour's layer included, so it says its own short line:
 * Pomo, still speaking, names the layouts and Fly. One sheet at a time (`sheets.md`): the layer is
 * no sheet, so nothing stacks.
 *
 * Closing the sheet, however it closes (a swipe, or choosing a mode), moves the tour on to Stats.
 * The whole line shows at once: a sheet is no place for a write-on, and the babble stays with the
 * pair on the page. Paper, radius 22, the crisp edge, no shadow, as the page's bubble.
 */
export function ModesBubble() {
    const { tokens } = useTheme();
    useEffect(
        () => () => {
            const s = useTourStore.getState();
            if (s.run && s.run.beat === 'here' && currentStep(s.run)?.id === 'modes') s.next();
        },
        [],
    );
    const line = MODES_SHEET_LINE(isFlyModeAvailable());
    const names = Object.fromEntries(Object.entries(line.names ?? {}).map(([k, key]) => [k, t(key)]));
    const name = t('tour.pomo');
    const text = t(line.key, names);
    return (
        <View
            style={[styles.bubble, { backgroundColor: tokens.paper, borderColor: tokens.edge }]}
            accessible
            accessibilityLabel={t('tour.says', { name, line: text })}
            testID="tour-modes-bubble"
        >
            <View style={styles.nameRow}>
                <Sticker art={pomoIdle} width={32} shadow={tokens.stickerShadow} />
                <Text style={[styles.name, { color: tokens.primaryInk }]}>{name}</Text>
            </View>
            <Text style={[styles.line, { color: tokens.ink }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    bubble: { borderRadius: radius.l, borderWidth: edgeWidth, padding: space.l, gap: space.xs },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
    name: { fontSize: 13, fontWeight: '600' },
    line: { fontSize: 17, lineHeight: 23 },
});
