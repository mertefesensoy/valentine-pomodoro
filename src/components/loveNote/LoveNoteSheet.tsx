import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { css } from 'react-native-reanimated';

import { PressableScale } from '../ui/PressableScale';
import { Sticker } from '../stickers/Sticker';
import { pomoCelebrating } from '../stickers/art/pomoCelebrating';
import { t } from '../../i18n';
import { useLoveNoteSheet } from '../../stores/loveNoteSheetStore';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/type';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';

/**
 * The love note after a completed focus, as a native sheet (Classic brief §6; FR-NTE-001).
 *
 * It stays until it is dismissed, by a swipe down or "Close" (a sheet that closed itself would take
 * the text away from someone reading at a large size; WCAG 2.2.1, HIG `accessibility.md`). The sheet
 * fits its content, and a long note at AX5 reaches full height and scrolls (HIG D1-M3). A short title
 * names the moment (`modality.md`).
 */
export function LoveNoteSheet() {
    const note = useLoveNoteSheet((s) => s.note);
    const { tokens } = useTheme();

    const close = () => {
        if (router.canGoBack()) router.back();
        else useLoveNoteSheet.getState().close();
    };

    return (
        <ScrollView
            style={{ backgroundColor: tokens.paper }}
            contentContainerStyle={styles.content}
            bounces={false}
        >
            <View style={styles.head}>
                <Sticker art={pomoCelebrating} width={44} />
                <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header">
                    {t('loveNote.title')}
                </Text>
            </View>
            <Text style={[styles.note, { color: tokens.ink }]}>{note}</Text>
            <PressableScale
                onPress={close}
                haptic={false}
                style={[styles.close, { backgroundColor: tokens.page, borderColor: tokens.edge }]}
            >
                <Text style={[styles.closeLabel, { color: tokens.ink }]}>{t('loveNote.close')}</Text>
            </PressableScale>
        </ScrollView>
    );
}

const styles = css.create({
    content: { padding: space.xl, gap: space.l },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.m },
    title: { fontFamily: fonts.semiBold, fontSize: 22, flexShrink: 1 },
    note: { fontSize: 20, lineHeight: 28 },
    close: {
        minHeight: minTarget,
        borderRadius: radius.pill,
        borderWidth: edgeWidth,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: space.xl,
        alignSelf: 'center',
        minWidth: 160,
    },
    closeLabel: { fontSize: 17, fontWeight: '600' },
});
