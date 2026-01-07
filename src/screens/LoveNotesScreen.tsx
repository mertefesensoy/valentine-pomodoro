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
} from 'react-native';
import { useApp } from '../context/AppContext';

type Mode = { type: 'add' } | { type: 'edit'; index: number; initial: string } | null;

export default function LoveNotesScreen() {
    const { loveNotes } = useApp();
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={openAdd} style={styles.addButton}>
                    <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
            </View>

            {!isReady ? (
                <Text style={styles.loadingText}>Loading…</Text>
            ) : (
                <>
                    <View style={styles.actionRow}>
                        <Pressable onPress={() => setPreview(pickRandomNote(preview))} style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Randomize preview</Text>
                        </Pressable>

                        <Pressable onPress={confirmReset} style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Reset defaults</Text>
                        </Pressable>
                    </View>

                    {preview ? (
                        <View style={styles.previewCard}>
                            <Text style={styles.previewText}>{preview}</Text>
                        </View>
                    ) : null}

                    <FlatList
                        style={styles.list}
                        data={notes}
                        keyExtractor={(_, i) => String(i)}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={({ item, index }) => (
                            <View style={styles.noteCard}>
                                <Text style={styles.noteText}>{item}</Text>

                                <View style={styles.noteActions}>
                                    <Pressable onPress={() => openEdit(index)} style={styles.noteActionButton}>
                                        <Text style={styles.noteActionText}>Edit</Text>
                                    </Pressable>
                                    <Pressable onPress={() => confirmDelete(index)} style={styles.noteActionButton}>
                                        <Text style={styles.noteActionDeleteText}>Delete</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    />
                </>
            )}

            <Modal visible={mode !== null} animationType="slide" onRequestClose={closeModal}>
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{mode?.type === 'add' ? 'Add note' : 'Edit note'}</Text>

                    <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="Write something sweet…"
                        multiline
                        style={styles.textInput}
                    />

                    <View style={styles.modalActions}>
                        <Pressable onPress={closeModal} style={styles.modalButton}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable onPress={onSave} style={[styles.modalButton, styles.modalButtonPrimary]}>
                            <Text style={styles.modalButtonTextPrimary}>Save</Text>
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
        padding: 16,
        backgroundColor: '#FFF8F0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2D2D2D',
    },
    addButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#E63946',
        borderRadius: 12,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B6B6B',
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
        borderColor: '#D4A5D9',
        borderRadius: 12,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#D4A5D9',
    },
    previewCard: {
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#FFE8EC',
        backgroundColor: '#FFF',
    },
    previewText: {
        fontSize: 16,
        color: '#2D2D2D',
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
        borderColor: '#E0E0E0',
        backgroundColor: '#FFF',
    },
    noteText: {
        fontSize: 16,
        color: '#2D2D2D',
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
        color: '#D4A5D9',
    },
    noteActionDeleteText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#E63946',
    },
    modalContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: '#FFF8F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D2D2D',
    },
    textInput: {
        marginTop: 12,
        minHeight: 140,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: '#E0E0E0',
        padding: 12,
        textAlignVertical: 'top',
        fontSize: 16,
        backgroundColor: '#FFF',
    },
    modalActions: {
        marginTop: 16,
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 2,
        borderColor: '#D4A5D9',
        borderRadius: 12,
    },
    modalButtonPrimary: {
        backgroundColor: '#E63946',
        borderColor: '#E63946',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#D4A5D9',
    },
    modalButtonTextPrimary: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
