import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { useTheme } from '../theme/useTheme';
import { useResponsive } from '../hooks/useResponsive';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { ThemeMode } from '../types';

const UPDATE_JSON_URL = 'https://mertefesensoy.github.io/valentine-pomodoro/update.json';
const GOAL_PRESETS = [25, 50, 75, 100];

function isValidHHMM(s: string) {
    return /^\d{2}:\d{2}$/.test(s);
}

export default function SettingsScreen() {
    const { settings: settingsContext, stats, reminder } = useApp();
    const { settings, updateSettings } = settingsContext;
    const { checkForUpdates } = useUpdateCheck(UPDATE_JSON_URL);
    const { colors } = useTheme();
    const { isTablet } = useResponsive();
    const tabBarHeight = useBottomTabBarHeight();

    // Local draft state for number inputs
    const [focusDraft, setFocusDraft] = useState(settings.durations.focus.toString());
    const [shortBreakDraft, setShortBreakDraft] = useState(settings.durations.shortBreak.toString());
    const [longBreakDraft, setLongBreakDraft] = useState(settings.durations.longBreak.toString());
    const [longBreakEveryDraft, setLongBreakEveryDraft] = useState(settings.longBreakEvery.toString());
    const [goalDraft, setGoalDraft] = useState(stats.goalMinutes.toString());
    const [statusText, setStatusText] = useState('');

    // Phase 7: Native time picker state
    const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
    const [showQuietStartPicker, setShowQuietStartPicker] = useState(false);
    const [showQuietEndPicker, setShowQuietEndPicker] = useState(false);
    const [reminderBusy, setReminderBusy] = useState(false); // Fix 1: busy flag

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
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    isTablet && styles.scrollContentTablet,
                    { paddingBottom: tabBarHeight },
                ]}
                keyboardShouldPersistTaps="handled"
            >
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
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (settings.notifications ? colors.accent : '#9e9e9e')}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Sound</Text>
                        <Switch
                            value={settings.sound}
                            onValueChange={(val) => updateSettings({ sound: val })}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (settings.sound ? colors.accent : '#9e9e9e')}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Haptics</Text>
                        <Switch
                            value={settings.haptics}
                            onValueChange={(val) => updateSettings({ haptics: val })}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (settings.haptics ? colors.accent : '#9e9e9e')}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Show Love Notes</Text>
                        <Switch
                            value={settings.showLoveNotes}
                            onValueChange={(val) => updateSettings({ showLoveNotes: val })}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (settings.showLoveNotes ? colors.accent : '#9e9e9e')}
                        />
                    </View>
                </View>

                {/* Experience Section - Animations */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience</Text>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>
                            Background Animations
                        </Text>
                        <Switch
                            value={settings.animationsEnabled}
                            onValueChange={(val) => updateSettings({ animationsEnabled: val })}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (settings.animationsEnabled ? colors.accent : '#9e9e9e')}
                        />
                    </View>
                </View>

                {/* Fly Mode Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Fly Mode ✈️</Text>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Ambient Sounds</Text>
                        <Switch
                            value={settings.flyModeSound}
                            onValueChange={(val) => updateSettings({ flyModeSound: val })}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (settings.flyModeSound ? colors.accent : '#9e9e9e')}
                        />
                    </View>
                </View>

                {/* Goals & Streaks Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals & Streaks</Text>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Enable Daily Goal</Text>
                        <Switch
                            value={stats.goalMinutes > 0}
                            onValueChange={(on) => {
                                if (on) {
                                    const n = parseInt(goalDraft, 10);
                                    stats.setGoalMinutes(Number.isFinite(n) && n > 0 ? n : 50);
                                } else {
                                    stats.setGoalMinutes(0);
                                }
                            }}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (stats.goalMinutes > 0 ? colors.accent : '#9e9e9e')}
                        />
                    </View>

                    {stats.goalMinutes > 0 && (
                        <>
                            <View style={styles.presetRow}>
                                {GOAL_PRESETS.map((preset) => (
                                    <Pressable
                                        key={preset}
                                        onPress={() => {
                                            setGoalDraft(preset.toString());
                                            stats.setGoalMinutes(preset);
                                        }}
                                        style={[
                                            styles.presetButton,
                                            {
                                                backgroundColor:
                                                    stats.goalMinutes === preset
                                                        ? colors.accent
                                                        : colors.surfaceTint,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                color: stats.goalMinutes === preset ? '#fff' : colors.text,
                                                fontWeight: '600',
                                            }}
                                        >
                                            {preset}m
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <View style={[styles.row, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Custom Goal (minutes)</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.inputBg,
                                            borderColor: colors.accentPurple,
                                            color: colors.text,
                                        },
                                    ]}
                                    value={goalDraft}
                                    onChangeText={setGoalDraft}
                                    onBlur={() => {
                                        const n = parseInt(goalDraft, 10);
                                        if (Number.isFinite(n) && n >= 0 && n <= 1440) {
                                            stats.setGoalMinutes(n);
                                        } else {
                                            setGoalDraft(stats.goalMinutes.toString());
                                        }
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                />
                            </View>
                        </>
                    )}

                    <Text style={[styles.infoText, { color: colors.textMuted }]}>
                        Current streak: {stats.streak.current} days (best: {stats.streak.best})
                    </Text>
                </View>

                {/* Daily Reminders Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Reminders</Text>

                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Enable Reminders</Text>
                        <Switch
                            value={reminder.reminder.enabled}
                            disabled={!reminder.isReady || reminderBusy}
                            onValueChange={async (on) => {
                                setStatusText('');
                                setReminderBusy(true);
                                try {
                                    if (on) {
                                        const ok = await reminder.enableDailyReminder();
                                        if (!ok) {
                                            setStatusText('Permission denied. Please enable notifications in settings.');
                                        }
                                    } else {
                                        await reminder.disableDailyReminder();
                                    }
                                } finally {
                                    setReminderBusy(false);
                                }
                            }}
                            trackColor={{ false: '#ddd', true: colors.accentLight }}
                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (reminder.reminder.enabled ? colors.accent : '#9e9e9e')}
                        />
                    </View>

                    {reminder.reminder.enabled && (
                        <>
                            <View style={[styles.row, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Time</Text>
                                <Pressable
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.inputBg,
                                            borderColor: colors.accentPurple,
                                            justifyContent: 'center',
                                        },
                                    ]}
                                    onPress={() => setShowReminderTimePicker(true)}
                                >
                                    <Text style={{ color: colors.text, fontSize: 16 }}>
                                        {reminder.reminder.timeHHMM}
                                    </Text>
                                </Pressable>
                            </View>
                            {showReminderTimePicker && (
                                <>
                                    <DateTimePicker
                                        value={(() => {
                                            const [h, m] = reminder.reminder.timeHHMM.split(':').map(Number);
                                            const date = new Date();
                                            date.setHours(h, m, 0, 0);
                                            return date;
                                        })()}
                                        mode="time"
                                        is24Hour={true}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS !== 'ios') {
                                                setShowReminderTimePicker(false);
                                            }
                                            if (event.type === 'set' && selectedDate) {
                                                const hh = selectedDate.getHours().toString().padStart(2, '0');
                                                const mm = selectedDate.getMinutes().toString().padStart(2, '0');
                                                reminder.setReminderTimeHHMM(`${hh}:${mm}`);
                                            }
                                        }}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <Pressable
                                            onPress={() => setShowReminderTimePicker(false)}
                                            style={{ alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 }}
                                        >
                                            <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 16 }}>Done</Text>
                                        </Pressable>
                                    )}
                                </>
                            )}

                            <View style={[styles.row, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Quiet Hours</Text>
                                <Switch
                                    value={reminder.reminder.quietHours.enabled}
                                    onValueChange={(on) =>
                                        reminder.setQuietHours({
                                            ...reminder.reminder.quietHours,
                                            enabled: on,
                                        })
                                    }
                                    trackColor={{ false: '#ddd', true: colors.accentLight }}
                                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (reminder.reminder.quietHours.enabled ? colors.accent : '#9e9e9e')}
                                />
                            </View>

                            {reminder.reminder.quietHours.enabled && (
                                <>
                                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.label, { color: colors.text }]}>Quiet Start</Text>
                                        <Pressable
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: colors.inputBg,
                                                    borderColor: colors.accentPurple,
                                                    justifyContent: 'center',
                                                },
                                            ]}
                                            onPress={() => setShowQuietStartPicker(true)}
                                        >
                                            <Text style={{ color: colors.text, fontSize: 16 }}>
                                                {reminder.reminder.quietHours.startHHMM}
                                            </Text>
                                        </Pressable>
                                    </View>
                                    {showQuietStartPicker && (
                                        <>
                                            <DateTimePicker
                                                value={(() => {
                                                    const [h, m] = reminder.reminder.quietHours.startHHMM.split(':').map(Number);
                                                    const date = new Date();
                                                    date.setHours(h, m, 0, 0);
                                                    return date;
                                                })()}
                                                mode="time"
                                                is24Hour={true}
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event, selectedDate) => {
                                                    if (Platform.OS !== 'ios') {
                                                        setShowQuietStartPicker(false);
                                                    }
                                                    if (event.type === 'set' && selectedDate) {
                                                        const hh = selectedDate.getHours().toString().padStart(2, '0');
                                                        const mm = selectedDate.getMinutes().toString().padStart(2, '0');
                                                        reminder.setQuietHours({
                                                            ...reminder.reminder.quietHours,
                                                            startHHMM: `${hh}:${mm}`,
                                                        });
                                                    }
                                                }}
                                            />
                                            {Platform.OS === 'ios' && (
                                                <Pressable
                                                    onPress={() => setShowQuietStartPicker(false)}
                                                    style={{ alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 }}
                                                >
                                                    <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 16 }}>Done</Text>
                                                </Pressable>
                                            )}
                                        </>
                                    )}

                                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.label, { color: colors.text }]}>Quiet End</Text>
                                        <Pressable
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: colors.inputBg,
                                                    borderColor: colors.accentPurple,
                                                    justifyContent: 'center',
                                                },
                                            ]}
                                            onPress={() => setShowQuietEndPicker(true)}
                                        >
                                            <Text style={{ color: colors.text, fontSize: 16 }}>
                                                {reminder.reminder.quietHours.endHHMM}
                                            </Text>
                                        </Pressable>
                                    </View>
                                    {showQuietEndPicker && (
                                        <>
                                            <DateTimePicker
                                                value={(() => {
                                                    const [h, m] = reminder.reminder.quietHours.endHHMM.split(':').map(Number);
                                                    const date = new Date();
                                                    date.setHours(h, m, 0, 0);
                                                    return date;
                                                })()}
                                                mode="time"
                                                is24Hour={true}
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event, selectedDate) => {
                                                    if (Platform.OS !== 'ios') {
                                                        setShowQuietEndPicker(false);
                                                    }
                                                    if (event.type === 'set' && selectedDate) {
                                                        const hh = selectedDate.getHours().toString().padStart(2, '0');
                                                        const mm = selectedDate.getMinutes().toString().padStart(2, '0');
                                                        reminder.setQuietHours({
                                                            ...reminder.reminder.quietHours,
                                                            endHHMM: `${hh}:${mm}`,
                                                        });
                                                    }
                                                }}
                                            />
                                            {Platform.OS === 'ios' && (
                                                <Pressable
                                                    onPress={() => setShowQuietEndPicker(false)}
                                                    style={{ alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 }}
                                                >
                                                    <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 16 }}>Done</Text>
                                                </Pressable>
                                            )}
                                        </>
                                    )}

                                    <Text style={[styles.infoText, { color: colors.textMuted }]}>
                                        Reminder will be shifted to quiet-end if it falls inside quiet hours.
                                    </Text>
                                </>
                            )}

                            {!!statusText && (
                                <Text style={[styles.infoText, { color: colors.textMuted, marginTop: 8 }]}>
                                    {statusText}
                                </Text>
                            )}
                        </>
                    )}
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                    <Pressable
                        style={[styles.updateButton, { backgroundColor: colors.accentPurple }]}
                        onPress={() => Linking.openURL('https://valentine-pomodoro-developer-websit.vercel.app/')}
                    >
                        <Text style={styles.updateButtonText}>Visit Developer Website</Text>
                    </Pressable>
                    <Text style={[styles.infoText, { color: colors.textMuted }]}>
                        Made with ❤️ by Mert Efe Sensoy
                    </Text>
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
            </KeyboardAvoidingView>
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
    scrollContentTablet: {
        maxWidth: 720,
        alignSelf: 'center',
        width: '100%',
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
    presetRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    presetButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        minWidth: 60,
        alignItems: 'center',
    },
});
