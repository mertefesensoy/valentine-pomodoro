import { useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';

import { Icon } from '../components/icons/Icon';
import { plus } from '../components/icons/art/plus';
import { ButtonRow, ListGroup } from '../components/settings/SettingsList';
import { PressableScale } from '../components/ui/PressableScale';
import { t } from '../i18n';
import { useLoveNoteSheet } from '../stores/loveNoteSheetStore';
import { useNotesStore } from '../stores/notesStore';
import { fonts } from '../theme/type';
import { edgeWidth, minTarget, radius, space } from '../theme/layout';
import type { ThemeTokens } from '../theme/palette';
import { useTheme } from '../theme/useTheme';
import { PoseSticker } from './classic/PoseSticker';

// Regular width (iPad, wide windows): the list centres at a readable width, as Classic does.
const READABLE_WIDTH = 560;
const DELETE_WIDTH = 88;

const editorHref = (index: number) => ({ pathname: '/note-editor' as const, params: { index: String(index) } });

/**
 * One note: a paper slip in the inset group (D2 Notes contract). A tap opens it in the editor; a
 * trailing swipe gives Delete; a long press gives the native menu, Edit then Delete (`Link.Menu`,
 * no icons rather than SF Symbols); VoiceOver gets both as custom actions. The editor has its own
 * Delete button, so no action needs a gesture (NFR-A11Y-004).
 */
function NoteRow({ note, index, first, last, tokens, onDelete }: {
    note: string;
    index: number;
    first: boolean;
    last: boolean;
    tokens: ThemeTokens;
    onDelete: (index: number) => void;
}) {
    const swipe = useRef<SwipeableMethods>(null);
    const shape = [
        styles.row,
        { backgroundColor: tokens.paper, borderColor: tokens.edge },
        first && styles.rowFirst,
        last && styles.rowLast,
    ];
    return (
        <ReanimatedSwipeable
            ref={swipe}
            friction={2}
            rightThreshold={DELETE_WIDTH / 2}
            overshootRight={false}
            renderRightActions={() => (
                <Pressable
                    onPress={() => {
                        swipe.current?.close();
                        onDelete(index);
                    }}
                    style={[styles.deleteAction, { backgroundColor: tokens.danger }, first && styles.rowFirst, last && styles.rowLast]}
                    accessibilityRole="button"
                >
                    <Text style={[styles.deleteText, { color: tokens.onDanger }]}>{t('notesScreen.delete')}</Text>
                </Pressable>
            )}
        >
            <Link href={editorHref(index)}>
                <Link.Trigger>
                    <View
                        style={shape}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={note}
                        accessibilityHint={t('notesScreen.editHint')}
                        accessibilityActions={[
                            { name: 'edit', label: t('notesScreen.edit') },
                            { name: 'delete', label: t('notesScreen.delete') },
                        ]}
                        onAccessibilityAction={(e) => {
                            if (e.nativeEvent.actionName === 'edit') router.push(editorHref(index));
                            if (e.nativeEvent.actionName === 'delete') onDelete(index);
                        }}
                    >
                        {!first && <View style={[styles.separator, { backgroundColor: tokens.edge }]} />}
                        <Text style={[styles.note, { color: tokens.ink }]}>{note}</Text>
                    </View>
                </Link.Trigger>
                <Link.Menu>
                    <Link.MenuAction title={t('notesScreen.edit')} onPress={() => router.push(editorHref(index))} />
                    <Link.MenuAction title={t('notesScreen.delete')} destructive onPress={() => onDelete(index)} />
                </Link.Menu>
            </Link>
        </ReanimatedSwipeable>
    );
}

/**
 * Love notes (D2 Notes contract): the notes shown after a focus, as the diary's slips of paper.
 * The title with the count and Add; "Preview a note" above the list, which opens the same
 * love-note sheet Classic shows; the list; and "Restore default notes" at its foot, which adds
 * back missing defaults and removes nothing. Notes people write keep their own emoji.
 */
export default function LoveNotesScreen() {
    const notes = useNotesStore((s) => s.notes);
    const deleteNote = useNotesStore((s) => s.deleteNote);
    const restoreDefaults = useNotesStore((s) => s.restoreDefaults);
    const pickRandomNote = useNotesStore((s) => s.pickRandomNote);
    const { tokens } = useTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const [restored, setRestored] = useState<number | null>(null);

    const add = () => router.push('/note-editor');
    const preview = () => {
        useLoveNoteSheet.getState().open(pickRandomNote(null));
        router.push('/love-note');
    };
    const confirmDelete = (index: number) => {
        Alert.alert(t('notesScreen.deleteTitle'), t('notesScreen.deleteMessage'), [
            { text: t('notesScreen.cancel'), style: 'cancel' },
            { text: t('notesScreen.delete'), style: 'destructive', onPress: () => deleteNote(index) },
        ]);
    };
    const confirmRestore = () => {
        Alert.alert(t('notesScreen.restoreTitle'), t('notesScreen.restoreMessage'), [
            { text: t('notesScreen.cancel'), style: 'cancel' },
            { text: t('notesScreen.restoreConfirm'), onPress: () => setRestored(restoreDefaults()) },
        ]);
    };

    const addButton = (
        <PressableScale
            onPress={add}
            accessibilityLabel={t('notesScreen.addA11y')}
            style={[styles.add, { backgroundColor: tokens.primary }]}
        >
            <Icon glyph={plus} size={20} color={tokens.onPrimary} />
            <Text style={[styles.addText, { color: tokens.onPrimary }]}>{t('notesScreen.add')}</Text>
        </PressableScale>
    );

    const header = (
        <View style={styles.headerBlock}>
            <View style={styles.titleRow}>
                <View style={styles.titleText}>
                    <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header" maxFontSizeMultiplier={1.4}>
                        {t('notesScreen.title')}
                    </Text>
                    <Text style={[styles.count, { color: tokens.inkSoft }]}>{t('notesScreen.count', { count: notes.length })}</Text>
                </View>
                {notes.length > 0 && addButton}
            </View>
            {notes.length > 0 && (
                <ListGroup>
                    <ButtonRow label={t('notesScreen.preview')} onPress={preview} />
                </ListGroup>
            )}
        </View>
    );

    const footer = (
        <View style={styles.footerBlock}>
            <ListGroup>
                <ButtonRow label={t('notesScreen.restore')} onPress={confirmRestore} />
            </ListGroup>
            {restored !== null && (
                <Text style={[styles.restored, { color: tokens.inkSoft }]} accessibilityLiveRegion="polite">
                    {restored === 0 ? t('notesScreen.restoredNone') : t('notesScreen.restored', { count: restored })}
                </Text>
            )}
        </View>
    );

    const empty = (
        <View style={styles.empty}>
            <View style={styles.pair} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <PoseSticker who="pomo" pose="idle" width={64} shadow={tokens.stickerShadow} />
                <PoseSticker who="doro" pose="idle" width={64} shadow={tokens.stickerShadow} />
            </View>
            <Text style={[styles.emptyLine, { color: tokens.ink }]}>{t('notesScreen.emptyLine')}</Text>
            {addButton}
        </View>
    );

    return (
        <FlatList
            style={{ backgroundColor: tokens.page }}
            contentContainerStyle={[
                styles.list,
                {
                    paddingTop: insets.top + space.s,
                    paddingBottom: insets.bottom + space.xl,
                    paddingHorizontal: Math.max(space.l, (width - READABLE_WIDTH) / 2),
                },
            ]}
            data={notes}
            keyExtractor={(note, index) => `${index}:${note}`}
            renderItem={({ item, index }) => (
                <NoteRow
                    note={item}
                    index={index}
                    first={index === 0}
                    last={index === notes.length - 1}
                    tokens={tokens}
                    onDelete={confirmDelete}
                />
            )}
            ListHeaderComponent={header}
            ListHeaderComponentStyle={styles.headerSpacing}
            ListFooterComponent={footer}
            ListFooterComponentStyle={styles.footerSpacing}
            ListEmptyComponent={empty}
        />
    );
}

const styles = StyleSheet.create({
    list: { flexGrow: 1 },
    headerSpacing: { marginBottom: space.l },
    footerSpacing: { marginTop: space.xl },
    headerBlock: { gap: space.l },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.m, flexWrap: 'wrap' },
    titleText: { flex: 1, minWidth: 160 },
    title: { fontFamily: fonts.semiBold, fontSize: 34, lineHeight: 42 },
    count: { fontSize: 15, fontVariant: ['tabular-nums'] },
    add: {
        minHeight: minTarget,
        paddingHorizontal: space.l,
        borderRadius: radius.pill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
    },
    addText: { fontSize: 17, fontWeight: '600' },
    row: { borderLeftWidth: edgeWidth, borderRightWidth: edgeWidth, paddingHorizontal: space.l, paddingVertical: space.m, minHeight: minTarget },
    rowFirst: { borderTopWidth: edgeWidth, borderTopLeftRadius: radius.m, borderTopRightRadius: radius.m },
    rowLast: { borderBottomWidth: edgeWidth, borderBottomLeftRadius: radius.m, borderBottomRightRadius: radius.m },
    separator: { position: 'absolute', top: 0, left: space.l, right: 0, height: StyleSheet.hairlineWidth },
    note: { fontSize: 17, lineHeight: 23 },
    deleteAction: { width: DELETE_WIDTH, alignItems: 'center', justifyContent: 'center' },
    deleteText: { fontSize: 15, fontWeight: '600' },
    footerBlock: { gap: space.s },
    restored: { fontSize: 13, paddingHorizontal: space.l },
    empty: { alignItems: 'center', gap: space.l, paddingVertical: space.xxl },
    pair: { flexDirection: 'row', gap: space.s },
    emptyLine: { fontSize: 17, textAlign: 'center' },
});
