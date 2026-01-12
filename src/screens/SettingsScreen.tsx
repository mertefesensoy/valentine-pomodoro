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
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { useTheme } from '../theme/useTheme';
import type { ThemeMode } from '../types';

const UPDATE_JSON_URL = 'https://mertefesensoy.github.io/valentine-pomodoro/update.json';

export default function SettingsScreen() {
    const { settings: settingsContext } = useApp();
    const { settings, updateSettings } = settingsContext;
    const { checkForUpdates } = useUpdateCheck(UPDATE_JSON_URL);
    const { colors } = useTheme();

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
                            themeMode: 'system',
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.header, { color: colors.text }]}>Settings ⚙️</Text>

                {/* Durations Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Timer Durations (minutes)
                    </Text>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Focus</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.accentPurple,
                                    color: colors.text,
                                },
                            ]}
                            value={focusDraft}
                            onChangeText={setFocusDraft}
                            onBlur={handleFocusBlur}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Short Break</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.accentPurple,
                                    color: colors.text,
                                },
                            ]}
                            value={shortBreakDraft}
                            onChangeText={setShortBreakDraft}
                            onBlur={handleShortBreakBlur}
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Long Break</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.accentPurple,
                                    color: colors.text,
                                },
                            ]}
                            value={longBreakDraft}
                            onChangeText={setLongBreakDraft}
                            onBlur={handleLongBreakBlur}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>
                            Long break every N sessions
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.accentPurple,
                                    color: colors.text,
                                },
                            ]}
                            value={longBreakEveryDraft}
                            onChangeText={setLongBreakEveryDraft}
                            onBlur={handleLongBreakEveryBlur}
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                    </View>
                </View>

                {/* Appearance Section - Theme Selector */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

                    <View style={styles.themeSelector}>
                        {(['system', 'light', 'dark'] as const).map((mode) => {
                            const active = settings.themeMode === mode;

                            return (
                                <Pressable
                                    key={mode}
                                    onPress={() => updateSettings({ themeMode: mode as ThemeMode })}
                                    style={[
                                        styles.themeOption,
                                        {
                                            borderColor: colors.border,
                                            backgroundColor: active ? colors.accent : 'transparent',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.themeOptionText,
                                            { color: active ? '#FFFFFF' : colors.text },
                                        ]}
                                    >
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Notifications</Text>
                        <Switch
                            value={settings.notifications}
                            onValueChange={(val) => updateSettings({ notifications: val })}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={settings.notifications ? colors.accent : '#f4f3f4'}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Sound</Text>
                        <Switch
                            value={settings.sound}
                            onValueChange={(val) => updateSettings({ sound: val })}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={settings.sound ? colors.accent : '#f4f3f4'}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Haptics</Text>
                        <Switch
                            value={settings.haptics}
                            onValueChange={(val) => updateSettings({ haptics: val })}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={settings.haptics ? colors.accent : '#f4f3f4'}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Show Love Notes</Text>
                        <Switch
                            value={settings.showLoveNotes}
                            onValueChange={(val) => updateSettings({ showLoveNotes: val })}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={settings.showLoveNotes ? colors.accent : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Check for Updates Button */}
                <Pressable
                    style={[styles.updateButton, { backgroundColor: colors.accentPurple }]}
                    onPress={() => checkForUpdates({ force: true })}
                >
                    <Text style={styles.updateButtonText}>Check for Updates</Text>
                </Pressable>

                {/* Reset Button */}
                <Pressable
                    style={[styles.resetButton, { backgroundColor: colors.accent }]}
                    onPress={confirmReset}
                >
                    <Text style={styles.resetButtonText}>Reset to Defaults</Text>
                </Pressable>

                {/* Info Note */}
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                    Settings changes apply to your next session. Currently running sessions are not
                    affected.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor removed - now inline
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: '600',
        // color removed - now inline
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        // color removed - now inline
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        // borderBottomColor removed - now inline
    },
    label: {
        fontSize: 16,
        // color removed - now inline
        flex: 1,
    },
    input: {
        borderWidth: 1,
        // borderColor, backgroundColor, color removed - now inline
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        width: 70,
        textAlign: 'center',
    },
    themeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    themeOption: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        // borderColor, backgroundColor removed - now inline per button
    },
    themeOptionText: {
        fontSize: 14,
        fontWeight: '600',
        // color removed - now inline
    },
    resetButton: {
        // backgroundColor removed - now inline
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
    updateButton: {
        // backgroundColor removed - now inline
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 14,
        // color removed - now inline
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 20,
    },
});
