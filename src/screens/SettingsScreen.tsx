import { useState } from 'react';
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import type { Settings } from '../types';

export default function SettingsScreen() {
    const { settings: settingsContext } = useApp();
    const { settings, updateSettings } = settingsContext;

    // Local draft state for number inputs
    const [focusDraft, setFocusDraft] = useState(settings.durations.focus.toString());
    const [shortBreakDraft, setShortBreakDraft] = useState(settings.durations.shortBreak.toString());
    const [longBreakDraft, setLongBreakDraft] = useState(settings.durations.longBreak.toString());
    const [longBreakEveryDraft, setLongBreakEveryDraft] = useState(settings.longBreakEvery.toString());

    const handleFocusBlur = () => {
        const val = parseInt(focusDraft, 10);
        if (!isNaN(val) && val > 0 && val <= 180) {
            updateSettings({ durations: { ...settings.durations, focus: val } });
        } else {
            setFocusDraft(settings.durations.focus.toString());
        }
    };

    const handleShortBreakBlur = () => {
        const val = parseInt(shortBreakDraft, 10);
        if (!isNaN(val) && val > 0 && val <= 60) {
            updateSettings({ durations: { ...settings.durations, shortBreak: val } });
        } else {
            setShortBreakDraft(settings.durations.shortBreak.toString());
        }
    };

    const handleLongBreakBlur = () => {
        const val = parseInt(longBreakDraft, 10);
        if (!isNaN(val) && val > 0 && val <= 120) {
            updateSettings({ durations: { ...settings.durations, longBreak: val } });
        } else {
            setLongBreakDraft(settings.durations.longBreak.toString());
        }
    };

    const handleLongBreakEveryBlur = () => {
        const val = parseInt(longBreakEveryDraft, 10);
        if (!isNaN(val) && val >= 2 && val <= 10) {
            updateSettings({ longBreakEvery: val });
        } else {
            setLongBreakEveryDraft(settings.longBreakEvery.toString());
        }
    };

    const confirmReset = () => {
        Alert.alert(
            'Reset Settings?',
            'This will restore all settings to their default values.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                        updateSettings({
                            durations: { focus: 25, shortBreak: 5, longBreak: 15 },
                            longBreakEvery: 4,
                            notifications: true,
                            sound: true,
                            haptics: true,
                            showLoveNotes: true,
                        });
                        setFocusDraft('25');
                        setShortBreakDraft('5');
                        setLongBreakDraft('15');
                        setLongBreakEveryDraft('4');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.header}>Settings ⚙️</Text>

                {/* Durations Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Timer Durations (minutes)</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Focus</Text>
                        <TextInput
                            style={styles.input}
                            value={focusDraft}
                            onChangeText={setFocusDraft}
                            onBlur={handleFocusBlur}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Short Break</Text>
                        <TextInput
                            style={styles.input}
                            value={shortBreakDraft}
                            onChangeText={setShortBreakDraft}
                            onBlur={handleShortBreakBlur}
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Long Break</Text>
                        <TextInput
                            style={styles.input}
                            value={longBreakDraft}
                            onChangeText={setLongBreakDraft}
                            onBlur={handleLongBreakBlur}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Long break every N sessions</Text>
                        <TextInput
                            style={styles.input}
                            value={longBreakEveryDraft}
                            onChangeText={setLongBreakEveryDraft}
                            onBlur={handleLongBreakEveryBlur}
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                    </View>
                </View>

                {/* Toggles Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Notifications</Text>
                        <Switch
                            value={settings.notifications}
                            onValueChange={(val) => updateSettings({ notifications: val })}
                            trackColor={{ false: '#ddd', true: '#FFB3BA' }}
                            thumbColor={settings.notifications ? '#E63946' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Sound</Text>
                        <Switch
                            value={settings.sound}
                            onValueChange={(val) => updateSettings({ sound: val })}
                            trackColor={{ false: '#ddd', true: '#FFB3BA' }}
                            thumbColor={settings.sound ? '#E63946' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Haptics</Text>
                        <Switch
                            value={settings.haptics}
                            onValueChange={(val) => updateSettings({ haptics: val })}
                            trackColor={{ false: '#ddd', true: '#FFB3BA' }}
                            thumbColor={settings.haptics ? '#E63946' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Show Love Notes</Text>
                        <Switch
                            value={settings.showLoveNotes}
                            onValueChange={(val) => updateSettings({ showLoveNotes: val })}
                            trackColor={{ false: '#ddd', true: '#FFB3BA' }}
                            thumbColor={settings.showLoveNotes ? '#E63946' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Reset Button */}
                <Pressable style={styles.resetButton} onPress={confirmReset}>
                    <Text style={styles.resetButtonText}>Reset to Defaults</Text>
                </Pressable>

                {/* Info Note */}
                <Text style={styles.infoText}>
                    Settings changes apply to your next session. Currently running sessions are not affected.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F0',
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    label: {
        fontSize: 16,
        color: '#2D2D2D',
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D4A5D9',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        width: 70,
        textAlign: 'center',
        backgroundColor: '#FFF',
    },
    resetButton: {
        backgroundColor: '#E63946',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 14,
        color: '#6B6B6B',
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 20,
    },
});
