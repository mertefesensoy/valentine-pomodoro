import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActionSheetIOS, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';

import { ButtonRow, ListGroup } from '../../components/settings/SettingsList';
import { t } from '../../i18n';
import { NOTE_MAX_LENGTH, useNotesStore } from '../../stores/notesStore';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';
import { useTheme } from '../../theme/useTheme';

// The countdown shows in the note's last 30 characters; VoiceOver hears it at these marks only,
// never on every keystroke (HIG review).
const COUNTDOWN_FROM = 30;
const ANNOUNCE_AT = [30, 10, 0];

/**
 * The note editor (D2 Notes contract), the `/note-editor` form sheet at the large detent: a header
 * with Cancel and Save, one multi-line field that follows the keyboard, the countdown near the
 * 280-character cap, and, for a note being edited, "Delete note" at the foot, so deleting never
 * needs a swipe or a long press (NFR-A11Y-004).
 *
 * Contract
 *   in : the `index` route param, a note's place in the list; absent for a new note.
 *   out: Save adds or edits the note and closes; Delete confirms, deletes and closes; Cancel closes.
 *   also: with unsaved changes, every way out but Save and Delete asks first, in an action sheet
 *        ("Discard changes" or "Keep editing", `sheets.md`): Cancel, and a swipe on the sheet.
 *        `usePreventRemove` sets the native sheet's prevent-dismiss, so the swipe is held and
 *        comes back as a blocked removal; `gestureEnabled` alone only held it, saying nothing
 *        (D2 record §3.12). The cap is max(280, the note's own length): a longer note already
 *        kept can be saved as it is, but never grows.
 */
export function NoteEditor() {
    const { index } = useLocalSearchParams<{ index?: string }>();
    const notes = useNotesStore((s) => s.notes);
    const addNote = useNotesStore((s) => s.addNote);
    const editNote = useNotesStore((s) => s.editNote);
    const deleteNote = useNotesStore((s) => s.deleteNote);
    const { tokens } = useTheme();

    const at = index === undefined ? -1 : Number(index);
    const editing = Number.isInteger(at) && at >= 0 && at < notes.length;
    const original = editing ? notes[at] : '';
    const [text, setText] = useState(original);
    const max = Math.max(NOTE_MAX_LENGTH, original.length);
    const dirty = text.trim() !== original.trim();
    const canSave = dirty && text.trim().length > 0;
    const left = NOTE_MAX_LENGTH - text.length;

    // Announce the countdown as it crosses each mark, once.
    const announced = useRef<number | null>(null);
    useEffect(() => {
        const mark = ANNOUNCE_AT.find((m) => left <= m && (announced.current === null || m < announced.current));
        if (mark === undefined || original.length > NOTE_MAX_LENGTH) return;
        announced.current = mark;
        AccessibilityInfo.announceForAccessibility(t('notesScreen.editor.left', { count: Math.max(left, 0) }));
    }, [left, original.length]);

    // Save and Delete leave on purpose: the blocked removal they cause goes straight through.
    const leaving = useRef(false);
    const close = () => {
        leaving.current = true;
        router.back();
    };
    const askDiscard = (discard: () => void) => {
        const options = [t('notesScreen.editor.discard'), t('notesScreen.editor.keep')];
        ActionSheetIOS.showActionSheetWithOptions(
            { title: t('notesScreen.editor.discardTitle'), options, destructiveButtonIndex: 0, cancelButtonIndex: 1 },
            (choice) => {
                if (choice === 0) discard();
            },
        );
    };
    usePreventRemove(dirty, ({ repeat }) => {
        if (leaving.current) repeat();
        else askDiscard(repeat);
    });
    const cancel = () => (dirty ? askDiscard(close) : close());
    const save = () => {
        if (!canSave) return;
        if (editing) editNote(at, text);
        else addNote(text);
        close();
    };
    const remove = () => {
        Alert.alert(t('notesScreen.deleteTitle'), t('notesScreen.deleteMessage'), [
            { text: t('notesScreen.cancel'), style: 'cancel' },
            {
                text: t('notesScreen.delete'),
                style: 'destructive',
                onPress: () => {
                    deleteNote(at);
                    close();
                },
            },
        ]);
    };

    return (
        <ScrollView
            style={{ backgroundColor: tokens.page }}
            contentContainerStyle={styles.sheet}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
        >
            <View style={styles.header}>
                <Pressable onPress={cancel} style={styles.headerButton} accessibilityRole="button" hitSlop={8}>
                    <Text style={[styles.headerText, { color: tokens.primaryInk }]}>{t('notesScreen.editor.cancel')}</Text>
                </Pressable>
                <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header" numberOfLines={1}>
                    {t(editing ? 'notesScreen.editor.edit' : 'notesScreen.editor.new')}
                </Text>
                <Pressable
                    onPress={save}
                    disabled={!canSave}
                    style={[styles.headerButton, styles.headerTrailing]}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSave }}
                    hitSlop={8}
                >
                    {/* Disabled is the same ink, dimmed, as a system bar button: not a second hue (HIG N-1). */}
                    <Text style={[styles.headerText, styles.save, { color: tokens.primaryInk }, !canSave && styles.saveDisabled]}>
                        {t('notesScreen.editor.save')}
                    </Text>
                </Pressable>
            </View>

            {/* A text input's boundary identifies a control: `edgeStrong`, 3:1 (palette.json). */}
            <View style={[styles.field, { backgroundColor: tokens.paper, borderColor: tokens.edgeStrong }]}>
                <TextInput
                    value={text}
                    onChangeText={(v) => setText(v.length > max ? v.slice(0, max) : v)}
                    placeholder={t('notesScreen.editor.placeholder')}
                    placeholderTextColor={tokens.inkSoft}
                    multiline
                    autoFocus={!editing}
                    style={[styles.input, { color: tokens.ink }]}
                    selectionColor={tokens.primaryInk}
                    accessibilityLabel={t(editing ? 'notesScreen.editor.edit' : 'notesScreen.editor.new')}
                />
            </View>
            {original.length > NOTE_MAX_LENGTH ? (
                <Text style={[styles.counter, { color: tokens.inkSoft }]}>{t('notesScreen.editor.long')}</Text>
            ) : left <= COUNTDOWN_FROM ? (
                <Text style={[styles.counter, styles.counterEnd, { color: left <= 0 ? tokens.primaryInk : tokens.inkSoft }]}>
                    {t('notesScreen.editor.left', { count: Math.max(left, 0) })}
                </Text>
            ) : null}

            {editing && (
                <ListGroup>
                    <ButtonRow label={t('notesScreen.editor.delete')} onPress={remove} destructive />
                </ListGroup>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    sheet: { padding: space.l, gap: space.m },
    header: { flexDirection: 'row', alignItems: 'center', minHeight: minTarget, gap: space.s },
    headerButton: { minHeight: minTarget, minWidth: minTarget, justifyContent: 'center' },
    headerTrailing: { alignItems: 'flex-end' },
    headerText: { fontSize: 17 },
    save: { fontWeight: '600' },
    saveDisabled: { opacity: 0.4 },
    title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
    field: { borderRadius: radius.m, borderWidth: edgeWidth, padding: space.m },
    input: { fontSize: 17, lineHeight: 24, minHeight: 160, textAlignVertical: 'top' },
    counter: { fontSize: 13, paddingHorizontal: space.xs },
    counterEnd: { textAlign: 'right', fontVariant: ['tabular-nums'] },
});
