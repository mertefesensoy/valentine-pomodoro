import { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    SafeAreaView,
    Text,
    TextInput,
    View,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/useTheme';

type Mode = { type: 'add' } | { type: 'edit'; index: number; initial: string } | null;

export default function LoveNotesScreen() {
    const { loveNotes } = useApp();
    const { colors, isDark } = useTheme();
    const tabBarHeight = useBottomTabBarHeight();
    const { notes, isReady, addNote, editNote, deleteNote, resetToDefaults, pickRandomNote } =
        loveNotes;

    const [mode, setMode] = useState<Mode>(null);
    const [draft, setDraft] = useState('');
    const [preview, setPreview] = useState<string | null>(null);

    const title = useMemo(() => `Love Notes 💌 (${notes.length})`, [notes.length]);

    const openAdd = () => {
        setDraft('');
        setMode({ type: 'add' });
    };

    const openEdit = (index: number) => {
        setDraft(notes[index] ?? '');
        setMode({ type: 'edit', index, initial: notes[index] ?? '' });
    };

    const closeModal = () => {
        setMode(null);
        setDraft('');
    };

    const onSave = async () => {
        const text = draft;
        if (mode?.type === 'add') await addNote(text);
        if (mode?.type === 'edit') await editNote(mode.index, text);
        closeModal();
    };

    const confirmDelete = (index: number) => {
        Alert.alert('Delete note?', "This can't be undone.", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteNote(index) },
        ]);
    };

    const confirmReset = () => {
        Alert.alert('Reset notes?', 'Restore the default love notes list.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: resetToDefaults },
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Pressable onPress={openAdd} style={[styles.addButton, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>Add</Text>
                </Pressable>
            </View>

            {!isReady ? (
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading…</Text>
            ) : (
                <>
                    <View style={styles.actionRow}>
                        <Pressable onPress={() => setPreview(pickRandomNote(preview))} style={[styles.actionButton, { borderColor: colors.accentPurple }]}>
                            <Text style={[styles.actionButtonText, { color: colors.accentPurple }]}>Randomize preview</Text>
                        </Pressable>

                        <Pressable onPress={confirmReset} style={[styles.actionButton, { borderColor: colors.accentPurple }]}>
                            <Text style={[styles.actionButtonText, { color: colors.accentPurple }]}>Reset defaults</Text>
                        </Pressable>
                    </View>

                    {preview ? (
                        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.surfaceTint }]}>
                            <Text style={[styles.previewText, { color: colors.text }]}>{preview}</Text>
                        </View>
                    ) : null}

                    <FlatList
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: tabBarHeight + 8 }}
                        data={notes}
                        keyExtractor={(_, i) => String(i)}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={({ item, index }) => (
                            <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.noteText, { color: colors.text }]}>{item}</Text>

                                <View style={styles.noteActions}>
                                    <Pressable onPress={() => openEdit(index)} style={styles.noteActionButton}>
                                        <Text style={[styles.noteActionText, { color: colors.accentPurple }]}>Edit</Text>
                                    </Pressable>
                                    <Pressable onPress={() => confirmDelete(index)} style={styles.noteActionButton}>
                                        <Text style={[styles.noteActionDeleteText, { color: colors.accent }]}>Delete</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    />
                </>
            )}

            <Modal visible={mode !== null} animationType="slide" onRequestClose={closeModal}>
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{mode?.type === 'add' ? 'Add note' : 'Edit note'}</Text>

                    <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="Write something sweet…"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    />

                    <View style={styles.modalActions}>
                        <Pressable onPress={closeModal} style={[styles.modalButton, { borderColor: colors.accentPurple }]}>
                            <Text style={[styles.modalButtonText, { color: colors.accentPurple }]}>Cancel</Text>
                        </Pressable>

                        <Pressable onPress={onSave} style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                            <Text style={[styles.modalButtonTextPrimary, { color: '#FFFFFF' }]}>Save</Text>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 0,
        // backgroundColor removed
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        // color removed
    },
    addButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        // backgroundColor removed
        borderRadius: 12,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        // color removed
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        // color removed
    },
    actionRow: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 2,
        // borderColor removed
        borderRadius: 12,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        // color removed
    },
    previewCard: {
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 2,
        // borderColor, backgroundColor removed
    },
    previewText: {
        fontSize: 16,
        // color removed
    },
    list: {
        marginTop: 12,
    },
    separator: {
        height: 10,
    },
    noteCard: {
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        // borderColor, backgroundColor removed
    },
    noteText: {
        fontSize: 16,
        // color removed
    },
    noteActions: {
        marginTop: 10,
        flexDirection: 'row',
        gap: 12,
    },
    noteActionButton: {
        paddingVertical: 4,
    },
    noteActionText: {
        fontSize: 14,
        fontWeight: '500',
        // color removed
    },
    noteActionDeleteText: {
        fontSize: 14,
        fontWeight: '500',
        // color removed
    },
    modalContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
        // backgroundColor removed
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        // color removed
    },
    textInput: {
        marginTop: 20,
        minHeight: 140,
        borderWidth: 1,
        borderRadius: 12,
        // borderColor, backgroundColor removed
        padding: 12,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    modalActions: {
        marginTop: 20,
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 2,
        // borderColor removed
        borderRadius: 12,
    },
    modalButtonPrimary: {
        // backgroundColor, borderColor removed
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '500',
        // color removed
    },
    modalButtonTextPrimary: {
        fontSize: 16,
        fontWeight: '600',
        // color removed
    },
});
