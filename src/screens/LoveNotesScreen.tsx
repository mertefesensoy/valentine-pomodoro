import { useRef, useState } from 'react';
import { AccessibilityInfo, Alert, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';

import { Icon } from '../components/icons/Icon';
import { plus } from '../components/icons/art/plus';
import { ButtonRow, ListGroup } from '../components/settings/SettingsList';
import { PressableScale } from '../components/ui/PressableScale';
import { StatusBarScrim } from '../components/ui/StatusBarScrim';
import { t } from '../i18n';
import { useLoveNoteSheet } from '../stores/loveNoteSheetStore';
import { noteInLanguage, useNotesStore } from '../stores/notesStore';
import { fonts } from '../theme/type';
import { edgeWidth, minTarget, radius, space } from '../theme/layout';
import type { ThemeTokens } from '../theme/palette';
import { useTheme } from '../theme/useTheme';
import { PoseSticker } from './classic/PoseSticker';

// Regular width (iPad, wide windows): the list centres at a readable width, as Classic does.
const READABLE_WIDTH = 560;
const DELETE_WIDTH = 88;
// Past the Delete action the row rubber-bands (one point for every eight dragged), over red.
const OVERSHOOT_FRICTION = 8;
const UNDERLAY_REACH = 40;

const editorHref = (index: number) => ({ pathname: '/note-editor' as const, params: { index: String(index) } });

/**
 * One note: a paper slip in the inset group (D2 Notes contract). A tap opens it in the editor; a
 * trailing swipe gives Delete; a long press gives the native menu, Edit then Delete (`Link.Menu`,
 * no icons rather than SF Symbols); VoiceOver gets both as custom actions. The editor has its own
 * Delete button, so no action needs a gesture (NFR-A11Y-004).
 *
 * The row's style is one flat object: `Link.Trigger` hands the row through a Radix `Slot`, which
 * merges styles as `{ ...slot, ...child }`, so an array spreads into numeric keys and a release
 * build drops it (D2 record §3.12, P0); a dev build throws. The same goes for a function style, so
 * the pressed tint comes from press-in and press-out.
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
    const [pressed, setPressed] = useState(false);
    const shape = StyleSheet.flatten([
        styles.row,
        { backgroundColor: pressed ? tokens.field : tokens.paper, borderColor: tokens.edge },
        first && styles.rowFirst,
        last && styles.rowLast,
    ]);
    // The action takes the row's corners, not its borders: a border width with no colour draws black.
    const corners = [first && styles.cornersFirst, last && styles.cornersLast];
    return (
        <ReanimatedSwipeable
            ref={swipe}
            rightThreshold={DELETE_WIDTH / 2}
            overshootFriction={OVERSHOOT_FRICTION}
            renderRightActions={() => (
                <View style={styles.deleteSlot}>
                    <View style={[styles.underlay, { backgroundColor: tokens.danger }]} />
                    <Pressable
                        onPress={() => {
                            swipe.current?.close();
                            onDelete(index);
                        }}
                        style={({ pressed: down }) => [
                            styles.deleteAction,
                            { backgroundColor: tokens.danger },
                            corners,
                            down && styles.deletePressed,
                        ]}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.deleteText, { color: tokens.onDanger }]} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                            {t('notesScreen.delete')}
                        </Text>
                    </Pressable>
                </View>
            )}
        >
            {/* `asChild`: without it the link renders its child inside a Text, which lays the row out
                as inline text, drops its paper and padding, and lets the swipe's Delete show through
                (build 51 device check). With it, the link hands its press to the row's Pressable. */}
            <Link href={editorHref(index)} asChild>
                <Link.Trigger>
                    <Pressable
                        style={shape}
                        onPressIn={() => setPressed(true)}
                        onPressOut={() => setPressed(false)}
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
                    </Pressable>
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
            {
                text: t('notesScreen.restoreConfirm'),
                onPress: () => {
                    const count = restoreDefaults();
                    setRestored(count);
                    // accessibilityLiveRegion is Android-only; iOS hears it from an announcement.
                    AccessibilityInfo.announceForAccessibility(
                        count === 0 ? t('notesScreen.restoredNone') : t('notesScreen.restored', { count }),
                    );
                },
            },
        ]);
    };

    const addButton = (
        <PressableScale
            onPress={add}
            haptic={false}
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
                <Text style={[styles.restored, { color: tokens.inkSoft }]}>
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
        <>
        <FlatList
            style={{ backgroundColor: tokens.page }}
            contentContainerStyle={[
                styles.list,
                {
                    paddingTop: insets.top + space.s,
                    paddingBottom: insets.bottom + space.xl,
                    // The same column as Stats and Settings, 560 less the 16 pt gutters, so the
                    // page's edges hold still across tabs on an iPad (finish review fix 4).
                    paddingHorizontal: Math.max(space.l, (width - READABLE_WIDTH) / 2 + space.l),
                },
            ]}
            data={notes}
            keyExtractor={(note, index) => `${index}:${note}`}
            renderItem={({ item, index }) => (
                <NoteRow
                    note={noteInLanguage(item)}
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
        <StatusBarScrim />
        </>
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
    cornersFirst: { borderTopLeftRadius: radius.m, borderTopRightRadius: radius.m },
    cornersLast: { borderBottomLeftRadius: radius.m, borderBottomRightRadius: radius.m },
    separator: { position: 'absolute', top: 0, left: space.l, right: 0, height: StyleSheet.hairlineWidth },
    note: { fontSize: 17, lineHeight: 23 },
    deleteSlot: { width: DELETE_WIDTH },
    // Beside the action, on its leading side, so the rubber-band stretch stays red; not under it,
    // so the pressed action still dims against the page.
    underlay: { position: 'absolute', top: 0, bottom: 0, right: DELETE_WIDTH, width: UNDERLAY_REACH },
    deleteAction: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs },
    deletePressed: { opacity: 0.85 },
    deleteText: { fontSize: 15, fontWeight: '600' },
    footerBlock: { gap: space.s },
    restored: { fontSize: 13, paddingHorizontal: space.l },
    empty: { alignItems: 'center', gap: space.l, paddingVertical: space.xxl },
    pair: { flexDirection: 'row', gap: space.s },
    emptyLine: { fontSize: 17, textAlign: 'center' },
});
