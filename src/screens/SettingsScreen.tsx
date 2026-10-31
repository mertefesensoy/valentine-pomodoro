import { useState } from 'react';
import { Alert, LayoutAnimation, Linking, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { router } from 'expo-router';

import { ButtonRow, ListGroup, NumberWheel, SwitchRow, TimeRow, ValueRow } from '../components/settings/SettingsList';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { APP_NAME } from '../constants/app';
import { DURATION_LIMITS, classicLayoutOf, customDurationsOf, editCustomPatch, type ClassicLayout } from '../constants/presets';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { t } from '../i18n';
import { HiddenStartupDiagnostics } from '../startup/StartupDiagnostics';
import { useSettingsStore } from '../stores/settingsStore';
import { useStatsStore } from '../stores/statsStore';
import { fonts } from '../theme/type';
import { space } from '../theme/layout';
import { useTheme } from '../theme/useTheme';

const UPDATE_JSON_URL = 'https://mertefesensoy.github.io/valentine-pomodoro/update.json';
const DEVELOPER_URL = 'https://valentine-pomodoro-developer-websit.vercel.app/';
// FR-STA-004: the presets, or any custom goal from 1 to 1,440 minutes; 0 is off (the switch).
const GOAL_PRESETS = ['25', '50', '75', '100'] as const;
type GoalSegment = (typeof GOAL_PRESETS)[number] | 'custom';
const GOAL_MAX = 1440;
const LONG_BREAK_EVERY = { min: 2, max: 10 } as const;
// Regular width (iPad, wide windows): the list centres at a readable width, as Classic does.
const READABLE_WIDTH = 560;

type Wheel = 'focus' | 'shortBreak' | 'longBreak' | 'longBreakEvery' | 'goal';

/**
 * Settings (D2 Settings contract): iOS Settings drawn in the diary's stationery. One scroll of
 * inset groups, every row a native control, and no bounded number typed: a value row opens the
 * system wheel under it, one at a time. The keypad, its Done bars and the deprecated
 * `InputAccessoryView` are gone (D1 record F1 and its "Fragile, for D2" note).
 *
 * The groups: Timer (Custom's durations, build 48 F4), Daily goal, Notifications, Sound and
 * feel, Love notes, Appearance, Fly, About (its footer carries the app's origin, where v1's
 * gift screen used to, and the 1.5 s long-press to the start-up probe, Phase 1 B7), and Reset.
 */
export default function SettingsScreen() {
    const settings = useSettingsStore((s) => s.settings);
    const updateSettings = useSettingsStore((s) => s.updateSettings);
    const reminder = useSettingsStore((s) => s.reminder);
    const reminderReady = useSettingsStore((s) => s.isReady);
    const enableDailyReminder = useSettingsStore((s) => s.enableDailyReminder);
    const disableDailyReminder = useSettingsStore((s) => s.disableDailyReminder);
    const setReminderTimeHHMM = useSettingsStore((s) => s.setReminderTimeHHMM);
    const setQuietHours = useSettingsStore((s) => s.setQuietHours);
    const goalMinutes = useStatsStore((s) => s.goalMinutes);
    const setGoalMinutes = useStatsStore((s) => s.setGoalMinutes);
    const { checkForUpdates } = useUpdateCheck(UPDATE_JSON_URL);
    const { tokens } = useTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    // Rows open with the platform's layout animation; with Reduce Motion, in place.
    const reduced = useReducedMotion();

    const [open, setOpen] = useState<Wheel | null>(null);
    const [customGoal, setCustomGoal] = useState(false);
    const [lastGoal, setLastGoal] = useState(goalMinutes > 0 ? goalMinutes : 50);
    const [reminderBusy, setReminderBusy] = useState(false);
    const [denied, setDenied] = useState(false);

    const toggle = (wheel: Wheel) => {
        if (!reduced) LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
        setOpen((current) => (current === wheel ? null : wheel));
    };

    const minutes = (n: number) => t('settings.minutes', { count: n });
    const custom = customDurationsOf(settings);
    // A new duration becomes Custom's and selects it (presets.ts); the store is read at the
    // moment of the change, so a wheel never writes over a newer value.
    const setDuration = (field: keyof typeof DURATION_LIMITS, value: number) => {
        const current = useSettingsStore.getState().settings;
        if (value !== customDurationsOf(current)[field]) updateSettings(editCustomPatch(current, field, value));
    };

    const durationRow = (field: keyof typeof DURATION_LIMITS, label: string) => (
        <ValueRow key={field} label={label} value={minutes(custom[field])} expanded={open === field} onPress={() => toggle(field)}>
            <NumberWheel
                value={custom[field]}
                min={DURATION_LIMITS[field].min}
                max={DURATION_LIMITS[field].max}
                format={minutes}
                label={label}
                onChange={(n) => setDuration(field, n)}
            />
        </ValueRow>
    );

    const goalSegment: GoalSegment =
        customGoal || !(GOAL_PRESETS as readonly string[]).includes(String(goalMinutes))
            ? 'custom'
            : (String(goalMinutes) as GoalSegment);
    const chooseGoal = (segment: GoalSegment) => {
        if (segment === 'custom') {
            setCustomGoal(true);
            if (open !== 'goal') toggle('goal');
            return;
        }
        setCustomGoal(false);
        setOpen(null);
        setGoalMinutes(Number(segment));
        setLastGoal(Number(segment));
    };
    const setGoal = (n: number) => {
        setGoalMinutes(n);
        setLastGoal(n);
    };

    // A promise chain, not try/finally: the React Compiler can't lower a try without a catch,
    // and would skip the whole screen.
    const toggleReminder = (on: boolean) => {
        setReminderBusy(true);
        const change = on
            ? enableDailyReminder().then((ok) => setDenied(!ok))
            : disableDailyReminder().then(() => setDenied(false));
        return change.finally(() => setReminderBusy(false));
    };

    const confirmReset = () => {
        Alert.alert(t('settings.reset.title'), t('settings.reset.message'), [
            { text: t('settings.reset.cancel'), style: 'cancel' },
            {
                text: t('settings.reset.confirm'),
                style: 'destructive',
                onPress: () => {
                    setOpen(null);
                    updateSettings({
                        durations: { focus: 25, shortBreak: 5, longBreak: 15 },
                        presetChoice: '25-5',
                        customDurations: { focus: 25, shortBreak: 5, longBreak: 15 },
                        longBreakEvery: 4,
                        notifications: true,
                        sound: true,
                        haptics: true,
                        showLoveNotes: true,
                        themeMode: 'system',
                    });
                },
            },
        ]);
    };

    return (
        <ScrollView
            style={{ backgroundColor: tokens.page }}
            contentContainerStyle={[
                styles.page,
                { paddingTop: insets.top + space.s, paddingBottom: insets.bottom + space.xl },
            ]}
        >
            <View style={[styles.column, { width: Math.min(width, READABLE_WIDTH) - space.l * 2 }]}>
                <Text style={[styles.title, { color: tokens.ink }]} accessibilityRole="header" maxFontSizeMultiplier={1.4}>
                    {t('settings.title')}
                </Text>

                <ListGroup header={t('settings.timer.header')} footer={t('settings.timer.footer')}>
                    {durationRow('focus', t('settings.timer.focus'))}
                    {durationRow('shortBreak', t('settings.timer.shortBreak'))}
                    {durationRow('longBreak', t('settings.timer.longBreak'))}
                    <ValueRow
                        label={t('settings.timer.longBreakEvery')}
                        value={t('settings.everySessions', { count: settings.longBreakEvery })}
                        expanded={open === 'longBreakEvery'}
                        onPress={() => toggle('longBreakEvery')}
                    >
                        <NumberWheel
                            value={settings.longBreakEvery}
                            min={LONG_BREAK_EVERY.min}
                            max={LONG_BREAK_EVERY.max}
                            format={(n) => t('settings.everySessions', { count: n })}
                            label={t('settings.timer.longBreakEvery')}
                            onChange={(n) => updateSettings({ longBreakEvery: n })}
                        />
                    </ValueRow>
                </ListGroup>

                <ListGroup header={t('settings.goal.header')} footer={goalMinutes > 0 ? t('settings.goal.footer') : undefined}>
                    <SwitchRow
                        label={t('settings.goal.toggle')}
                        value={goalMinutes > 0}
                        onValueChange={(on) => {
                            setOpen(null);
                            setGoalMinutes(on ? lastGoal : 0);
                        }}
                    />
                    {goalMinutes > 0 && (
                        <View style={styles.segmentRow}>
                            <SegmentedControl<GoalSegment>
                                segments={[
                                    ...GOAL_PRESETS.map((p) => ({
                                        value: p,
                                        label: minutes(Number(p)),
                                        accessibilityLabel: t('settings.goal.presetA11y', { count: Number(p) }),
                                    })),
                                    { value: 'custom' as const, label: t('presets.custom'), accessibilityLabel: t('presets.custom') },
                                ]}
                                value={goalSegment}
                                onChange={chooseGoal}
                            />
                        </View>
                    )}
                    {goalMinutes > 0 && goalSegment === 'custom' && (
                        <ValueRow
                            label={t('settings.goal.customRow')}
                            value={minutes(goalMinutes)}
                            expanded={open === 'goal'}
                            onPress={() => toggle('goal')}
                        >
                            <NumberWheel
                                value={goalMinutes}
                                min={1}
                                max={GOAL_MAX}
                                format={minutes}
                                label={t('settings.goal.customRow')}
                                onChange={setGoal}
                            />
                        </ValueRow>
                    )}
                </ListGroup>

                <ListGroup
                    header={t('settings.notifications.header')}
                    footer={
                        denied ? (
                            <Text style={[styles.footer, { color: tokens.dangerInk }]} accessibilityLiveRegion="polite">
                                {t('settings.notifications.denied')}
                            </Text>
                        ) : (
                            t('settings.notifications.footer')
                        )
                    }
                >
                    <SwitchRow
                        label={t('settings.notifications.sessionAlerts')}
                        value={settings.notifications}
                        onValueChange={(on) => updateSettings({ notifications: on })}
                    />
                    <SwitchRow
                        label={t('settings.notifications.reminder')}
                        value={reminder.enabled}
                        disabled={!reminderReady || reminderBusy}
                        onValueChange={toggleReminder}
                    />
                    {reminder.enabled && (
                        <TimeRow label={t('settings.notifications.reminderTime')} hhmm={reminder.timeHHMM} onChange={setReminderTimeHHMM} />
                    )}
                    {reminder.enabled && (
                        <SwitchRow
                            label={t('settings.notifications.quiet')}
                            value={reminder.quietHours.enabled}
                            onValueChange={(on) => setQuietHours({ ...reminder.quietHours, enabled: on })}
                        />
                    )}
                    {reminder.enabled && reminder.quietHours.enabled && (
                        <TimeRow
                            label={t('settings.notifications.quietStart')}
                            hhmm={reminder.quietHours.startHHMM}
                            onChange={(startHHMM) => setQuietHours({ ...reminder.quietHours, startHHMM })}
                        />
                    )}
                    {reminder.enabled && reminder.quietHours.enabled && (
                        <TimeRow
                            label={t('settings.notifications.quietEnd')}
                            hhmm={reminder.quietHours.endHHMM}
                            onChange={(endHHMM) => setQuietHours({ ...reminder.quietHours, endHHMM })}
                        />
                    )}
                    {denied && <ButtonRow label={t('settings.notifications.openSettings')} onPress={() => Linking.openSettings()} />}
                </ListGroup>

                <ListGroup header={t('settings.feel.header')}>
                    <SwitchRow label={t('settings.feel.sound')} value={settings.sound} onValueChange={(on) => updateSettings({ sound: on })} />
                    <SwitchRow label={t('settings.feel.haptics')} value={settings.haptics} onValueChange={(on) => updateSettings({ haptics: on })} />
                </ListGroup>

                <ListGroup header={t('settings.notes.header')}>
                    <SwitchRow
                        label={t('settings.notes.show')}
                        value={settings.showLoveNotes}
                        onValueChange={(on) => updateSettings({ showLoveNotes: on })}
                    />
                </ListGroup>

                {/* Classic's layout (D1 brief §3): the same choice as the Modes sheet's. */}
                <ListGroup header={t('settings.appearance.header')} footer={t('settings.appearance.footer')}>
                    <View style={styles.segmentRow}>
                        <Text style={[styles.caption, { color: tokens.inkSoft }]}>{t('modes.layout')}</Text>
                        <SegmentedControl<ClassicLayout>
                            segments={[
                                { value: 'ring', label: t('modes.ring'), accessibilityLabel: t('modes.ring') },
                                { value: 'spread', label: t('modes.spread'), accessibilityLabel: t('modes.spread') },
                            ]}
                            value={classicLayoutOf(settings)}
                            onChange={(classicLayout) => updateSettings({ classicLayout })}
                        />
                    </View>
                </ListGroup>

                <ListGroup header={t('modes.fly')}>
                    <SwitchRow
                        label={t('settings.fly.ambient')}
                        value={settings.flyModeSound}
                        onValueChange={(on) => updateSettings({ flyModeSound: on })}
                    />
                </ListGroup>

                <ListGroup
                    header={t('settings.about.header')}
                    footer={
                        <View style={styles.footerBlock}>
                            <Text style={[styles.footer, { color: tokens.inkSoft }]}>{t('settings.about.origin', { app: APP_NAME })}</Text>
                            {/* A 1.5 s long-press opens the start-up probe (Phase 1 B7). */}
                            <HiddenStartupDiagnostics>
                                <Text style={[styles.footer, { color: tokens.inkSoft }]}>{t('settings.about.credit')}</Text>
                            </HiddenStartupDiagnostics>
                        </View>
                    }
                >
                    <ButtonRow label={t('welcome.replay')} onPress={() => router.push('/welcome')} />
                    <ButtonRow label={t('settings.about.updates')} onPress={() => checkForUpdates({ force: true })} />
                    <ButtonRow label={t('settings.about.website')} onPress={() => Linking.openURL(DEVELOPER_URL)} />
                </ListGroup>

                <ListGroup>
                    <ButtonRow label={t('settings.reset.button')} onPress={confirmReset} destructive />
                </ListGroup>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: { alignItems: 'center' },
    column: { gap: space.xl },
    title: { fontFamily: fonts.semiBold, fontSize: 34, lineHeight: 42, paddingHorizontal: space.xs },
    segmentRow: { paddingHorizontal: space.l, paddingVertical: space.m, gap: space.s },
    caption: { fontSize: 13, fontWeight: '600' },
    footer: { fontSize: 13, lineHeight: 18, paddingHorizontal: space.l },
    footerBlock: { gap: space.xs },
});
