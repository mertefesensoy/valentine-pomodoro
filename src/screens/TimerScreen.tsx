import { View, Text, StyleSheet, Alert, Platform, ScrollView, StatusBar, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTimer } from "../hooks/useTimer";
import TimerText from "../components/TimerText";
import { Icon } from "../components/icons/Icon";
import { modes as modesGlyph } from "../components/icons/art/modes";
import { PressableScale } from "../components/ui/PressableScale";
import { useSessionState } from "../hooks/useSessionClock";
import { useSlotProgress } from "../hooks/useSlotClock";
import { useNotesStore } from "../stores/notesStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useStatsStore } from "../stores/statsStore";
import { useUiStore } from "../stores/uiStore";
import { useLoveNoteSheet } from "../stores/loveNoteSheetStore";
import { useTheme } from "../theme/useTheme";
import { type } from "../theme/type";
import { minTarget, space } from "../theme/layout";
import { useScreenFocused } from "../hooks/useScreenFocus";
import { AdManager } from "../ads/AdManager";
import { AdPolicy } from "../ads/AdPolicy";
import { PRESETS, choosePresetPatch, classicLayoutOf, customDurationsOf, presetChoiceOf, type PresetChoice } from "../constants/presets";
import { language, t } from "../i18n";
import { getTodayKey } from "../utils/time";
import { PhaseRing } from "./classic/PhaseRing";
import { PoseSticker, poseFor } from "./classic/PoseSticker";
import { SpreadPages } from "./classic/SpreadPages";
import { TodayStickers } from "./classic/TodayStickers";
import { ClassicControls } from "./classic/ClassicControls";
import { useWelcomeGate } from "./welcome/useWelcomeGate";

// Fly Mode is split out (Phase 1 task B1): FlyModeScreen and everything only it
// imports (react-native-maps, FlySheet, Fly's audio) are evaluated the first time
// Fly opens, not on a cold start into Classic. Hermes still ships them in the one
// bundle, so this defers evaluation only. Fly can only open where
// isFlyModeAvailable() (iOS), so elsewhere the module is never loaded at all.
const FlyModeScreen = lazy(() => import("./FlyModeScreen"));

// Shown while FlyModeScreen loads on the first switch: a plain page in the
// theme's background colour, so the switch doesn't flash an empty grey map.
function FlyModePlaceholder() {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.flyPlaceholder, { backgroundColor: colors.bg }]}
      accessibilityLabel="Loading Fly Mode"
    >
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

// AX1 and up (iOS reports a font scale of about 1.65 there): Facing Pages stacks its pages.
const STACK_FONT_SCALE = 1.6;
// Compact height (an iPhone in landscape): the timer leads and a column trails (brief §6, HIG M-1).
const COMPACT_HEIGHT = 500;
// Regular width (iPad, wide windows): both layouts centre at a readable width.
const READABLE_WIDTH = 560;

/** The wall-clock minute a running phase ends in, seconds dropped (Stage D plan §4.6). */
function clockMinute(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString(language === "tr" ? "tr-TR" : "en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * Classic, the focus page (Phase 1 D1; brief `.impeccable/surfaces/app-tabs-index-tsx.md`).
 * Two layouts on one component set: The Ring (default) and Facing Pages, chosen by the
 * additive `classicLayout` setting. The timer is the only large type; Pomo & Doro sit in the
 * partner slot; completions press stickers onto today's row (the one delight). Fly is its own
 * screen (Phase 4b) and keeps its switcher.
 *
 * Render budget (Reassure, NFR-PERF-003): this screen renders on session events only. The time
 * is <TimerText>'s, the ring's and the spine bar's progress run on the UI thread, and every new
 * piece reads a value that changes on an event (a phase change, a completion, a setting).
 */
export default function TimerScreen() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const incrementFocus = useStatsStore((s) => s.incrementFocus);
  const goalHitPulse = useStatsStore((s) => s.goalHitPulse);
  const clearGoalHitPulse = useStatsStore((s) => s.clearGoalHitPulse);
  // Today's stickers and goal: both change only when a focus completes.
  const todayCount = useStatsStore((s) => s.days[getTodayKey()]?.focusSessions ?? 0);
  const goalHitToday = useStatsStore((s) => Boolean(s.days[getTodayKey()]?.goalHit));
  const pickRandomNote = useNotesStore((s) => s.pickRandomNote);
  const activeMode = useUiStore((s) => s.activeMode);
  // Session state and actions: re-renders on session changes, not each second.
  // The time is <TimerText>'s and the ring's (Phase 1 B4).
  const session = useSessionState();
  // The tab is never hidden or frozen (B6 fix, record §9), so what must happen
  // in front of the user waits until Timer is focused: the goal moment, the
  // love note and the interstitial. Always true outside a navigator.
  const focused = useScreenFocused();
  const { tokens, isDark } = useTheme();

  // Interstitials the ad policy has allowed, one per completion it said yes
  // to. The effect further down shows one when none is showing yet and no
  // overlay is up (FR-ADS-001).
  const [adRequests, setAdRequests] = useState(0);

  // Helper: check ad policy when session ends
  const handleTimerComplete = async () => {
    await AdPolicy.recordSessionCompletion();
    if (AdPolicy.shouldShowAd()) {
      setAdRequests((n) => n + 1);
    }
  };

  const {
    phase,
    isRunning,
    remainingMs,
    completedFocusCountInCycle,
    showLoveNoteCard,
    lastLoveNote,
    start,
    pause,
    resume,
    skip,
    reset,
    dismissLoveNote,
  } = useTimer(
    settings,
    pickRandomNote,
    // Wrapper to hook into completion for Ads
    (minutes, dayKey, sessionId) => {
      incrementFocus(minutes, dayKey, sessionId);
      handleTimerComplete();
    },
    session,
  );

  // ── Mode switching — delegate to session clock ──────────────────────────
  // session.switchTo auto-pauses the running slot and saves its remainingMs.
  // useTimer's internal effect cancels the scheduled notification when
  // session.state.activeKind changes away from 'pomodoro'.
  // Only user switches count: the stored mode is already hydrated on the first
  // render (Phase 1 B3), as it already was on a phone after B2, where the
  // navigator mounts this screen only after the mode has loaded.
  const prevActiveModeRef = useRef(activeMode);
  useEffect(() => {
    const prev = prevActiveModeRef.current;
    prevActiveModeRef.current = activeMode;
    if (prev !== 'fly' && activeMode === 'fly') {
      session.switchTo('fly');
    } else if (prev === 'fly' && activeMode !== 'fly') {
      session.switchTo('pomodoro');
    }
  }, [activeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // The moments after a completed focus, in order: the goal moment (inline on
  // today's row), then the love note (a native sheet), then the interstitial
  // (FR-ADS-001, FR-NTE-001). Derived from state, not synchronised by effects
  // (Phase 1 B5, react-hooks/set-state-in-effect).
  // - The goal moment is the stats store's pulse itself: set only when a
  //   completion first reaches a day's goal (goalHit is sticky, so never twice
  //   for one day), cleared when the moment has played (1.4 s).
  // - The love note waits for the goal moment, then goes to the /love-note
  //   sheet; the sheet reports back when it closes, however it closes.
  const goalPopup = goalHitPulse;

  const loveNoteDue = focused && !goalPopup && showLoveNoteCard && !!lastLoveNote;
  useEffect(() => {
    if (!loveNoteDue || useLoveNoteSheet.getState().note !== null) return;
    useLoveNoteSheet.getState().open(lastLoveNote!);
    router.push("/love-note");
  }, [loveNoteDue, lastLoveNote]);
  useEffect(
    () =>
      useLoveNoteSheet.subscribe((s, prev) => {
        if (prev.note !== null && s.note === null) dismissLoveNote();
      }),
    [dismissLoveNote],
  );

  // The interstitial: shown once no overlay is up, for requests not yet
  // served. Marking the requests served before showing means a re-run of the
  // effect can't show a second ad for them.
  const adsServedRef = useRef(0);
  useEffect(() => {
    if (adRequests === adsServedRef.current) return;
    if (!focused) return;
    if (goalPopup || showLoveNoteCard) return;

    adsServedRef.current = adRequests;
    AdManager.showIfReady(() => {
      // Callback after ad is closed (or if it failed/skipped)
      // We could resume music or do other cleanup here if needed
    });
  }, [adRequests, goalPopup, showLoveNoteCard, focused]);

  // The sticker placement's success haptic, on the frame its sticker lands: a
  // completion while Timer is in front (HIG D1-L1: once per completion, and it
  // follows Settings › Haptics).
  const prevCountRef = useRef(todayCount);
  useEffect(() => {
    const grew = todayCount > prevCountRef.current;
    prevCountRef.current = todayCount;
    if (grew && focused && useSettingsStore.getState().settings.haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [todayCount, focused]);

  // Calculate progress for current phase
  const totalMs = useMemo(() => {
    const mins =
      phase === 'focus'
        ? settings.durations.focus
        : phase === 'shortBreak'
          ? settings.durations.shortBreak
          : settings.durations.longBreak;
    return mins * 60 * 1000;
  }, [phase, settings.durations]);

  // The ring's progress, derived on the UI thread from the slot's endAt
  // (Phase 1 B4): it moves every frame with no render of this screen.
  const ringProgress = useSlotProgress('pomodoro', totalMs);

  const paused = !isRunning && remainingMs !== null && remainingMs < totalMs;
  const idle = !isRunning && !paused;

  // The one-time v1.4 welcome, on a calm entry only: Timer in front, idle, in Classic, with
  // nothing pending after a completion (welcome brief §4; HIG W-H1).
  useWelcomeGate(focused && idle && activeMode !== 'fly' && !goalPopup && !showLoveNoteCard);
  const isBreak = phase !== 'focus';
  const phaseLabel = t(`timer.phase.${phase}`);
  const sessionN = completedFocusCountInCycle + 1;
  const cycleTotal = settings.longBreakEvery;

  const primaryLabel = isRunning
    ? t('controls.pause')
    : paused
      ? t('controls.resume')
      : phase === 'focus'
        ? t('controls.startFocus')
        : t('controls.startBreak');

  // The haptic is the pill's own, on press-in (PressableScale).
  const handlePrimaryAction = () => {
    if (isRunning) {
      pause();
    } else if (remainingMs !== null && remainingMs < totalMs) {
      resume();
    } else {
      start();
    }
  };

  // Skip: a break skips at once; a focus running past its first minute asks
  // first, because the rest of it is lost (critique P1, HIG B-M1; PRODUCT
  // principle 2, never punish). The elapsed time is read from the slot's endAt
  // at press time, since this screen doesn't re-render each second.
  const handleSkip = () => {
    const running = session.state.pomodoro;
    const elapsedMs = running?.isRunning && running.endAt ? totalMs - (running.endAt - Date.now()) : 0;
    if (phase !== 'focus' || !isRunning || elapsedMs < 60_000) {
      skip();
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm(t('controls.skipConfirm.title'))) skip();
      return;
    }
    Alert.alert(t('controls.skipConfirm.title'), t('controls.skipConfirm.message'), [
      { text: t('controls.skipConfirm.cancel'), style: 'cancel' },
      { text: t('controls.skipConfirm.skip'), style: 'destructive', onPress: () => skip() },
    ]);
  };

  // Ending a session early: only while paused, behind a native alert with a
  // destructive button (brief §2).
  const handleEnd = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('controls.endConfirm.title'))) reset();
      return;
    }
    Alert.alert(t('controls.endConfirm.title'), t('controls.endConfirm.message'), [
      { text: t('controls.endConfirm.cancel'), style: 'cancel' },
      { text: t('controls.endConfirm.end'), style: 'destructive', onPress: () => reset() },
    ]);
  };

  // 25/5, 50/10, 90/20 and Custom, the durations typed in Settings (build 48, F4).
  const preset = presetChoiceOf(settings);
  const custom = customDurationsOf(settings);
  const presetSegments = useMemo(
    () => [
      ...PRESETS.map((p) => ({
        value: p.id as PresetChoice,
        label: `${p.focus}/${p.shortBreak}`,
        accessibilityLabel: t('presets.label', { focus: p.focus, rest: p.shortBreak }),
      })),
      {
        value: 'custom' as const,
        label: t('presets.custom'),
        accessibilityLabel: t('presets.customLabel', { focus: custom.focus, rest: custom.shortBreak }),
      },
    ],
    [custom.focus, custom.shortBreak],
  );
  const presetKey = preset === 'custom'
    ? t('presets.customKey', { focus: custom.focus, rest: custom.shortBreak })
    : t('presets.key');
  const choosePreset = (choice: PresetChoice) => {
    updateSettings(choosePresetPatch(useSettingsStore.getState().settings, choice));
  };

  // "Break at 10:25": the minute the running phase ends, from its endAt, so it
  // changes on a session event, never each second. Paused, a quiet stamp instead.
  const endAt = session.state.pomodoro?.endAt ?? null;
  const nextLine = isRunning && endAt
    ? t(phase === 'focus' ? 'timer.nextChange.break' : 'timer.nextChange.focus', { time: clockMinute(endAt) })
    : null;

  const timerLabel = (seconds: number | null) => {
    const s = seconds ?? Math.round(totalMs / 1000);
    return t('timer.a11y.remaining', {
      minutes: t('timer.a11y.minutes', { count: Math.floor(s / 60) }),
      seconds: t('timer.a11y.seconds', { count: s % 60 }),
      phase: phaseLabel,
      n: sessionN,
      total: cycleTotal,
    });
  };

  const layout = classicLayoutOf(settings);
  const compactHeight = height < COMPACT_HEIGHT;
  const pageWidth = Math.min(width, READABLE_WIDTH) - space.xl * 2;
  const pose = poseFor(phase, isRunning);
  // The partner line says what the pair is doing now (critique P3, HIG B-L1).
  const partnerLine = isRunning ? (isBreak ? 'partner.break' : 'partner.studying') : paused ? 'partner.paused' : 'partner.ready';

  const subLine = paused ? (
    <View style={[styles.stamp, { borderColor: tokens.primaryInk }]}>
      <Text style={[styles.stampText, { color: tokens.primaryInk }]} maxFontSizeMultiplier={1.4}>
        {t('timer.paused')}
      </Text>
    </View>
  ) : nextLine ? (
    <Text style={[styles.nextLine, { color: tokens.inkSoft }]} maxFontSizeMultiplier={1.4}>
      {nextLine}
    </Text>
  ) : null;

  const timer = (fontSize: number) => (
    // The only part of this screen that re-renders each second (Phase 1 B4)
    <TimerText
      kind="pomodoro"
      idleMs={totalMs}
      fitWidth
      accessibilityLabelFor={timerLabel}
      style={[type.timer, styles.timer, { fontSize, color: tokens.ink }]}
    />
  );

  const ringSize = compactHeight
    ? Math.min(height - insets.top - insets.bottom - space.xl, width * 0.42)
    : Math.min(pageWidth * (fontScale >= STACK_FONT_SCALE ? 0.66 : 0.86), height * 0.36, 340);

  const face =
    layout === 'spread' ? (
      <SpreadPages
        tokens={tokens}
        width={compactHeight ? Math.min(pageWidth, width * 0.5) : pageWidth}
        stacked={fontScale >= STACK_FONT_SCALE}
        pose={pose}
        progress={ringProgress}
        isBreak={isBreak}
      >
        {timer(56)}
        {subLine}
      </SpreadPages>
    ) : (
      <PhaseRing
        size={ringSize}
        progress={ringProgress}
        isBreak={isBreak}
        trackColor={tokens.ringTrack}
        focusColor={tokens.ringFocus}
        breakColor={tokens.ringBreak}
      >
        {timer(Math.round(ringSize * 0.25))}
        {subLine}
      </PhaseRing>
    );

  const partner = (
    <View style={styles.partner}>
      {layout === 'ring' && (
        <View style={styles.pair} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <PoseSticker who="pomo" pose={pose} width={44} />
          <PoseSticker who="doro" pose={pose} width={44} />
        </View>
      )}
      <Text style={[styles.partnerLine, { color: tokens.inkSoft }]}>{t(partnerLine)}</Text>
    </View>
  );

  const today = (
    <TodayStickers
      tokens={tokens}
      count={todayCount}
      goalHit={goalHitToday}
      goalStreak={goalPopup && focused ? goalPopup.newStreak : null}
      onGoalMomentDone={clearGoalHitPulse}
      animate={focused}
    />
  );

  const controls = (
    <ClassicControls
      tokens={tokens}
      idle={idle}
      paused={paused}
      primaryLabel={primaryLabel}
      onPrimary={handlePrimaryAction}
      onSkip={handleSkip}
      onEnd={handleEnd}
      presets={presetSegments}
      preset={preset}
      presetKey={presetKey}
      onPreset={choosePreset}
      cycleDone={completedFocusCountInCycle}
      cycleLength={cycleTotal}
    />
  );

  return (
    <View style={[
      styles.container,
      activeMode === 'fly' ? styles.containerFly : { backgroundColor: tokens.page },
      // Inside a native tab the bottom inset includes the tab bar (Phase 1 B6),
      // so the controls clear the floating bar with nothing added (HIG M-5).
      { paddingBottom: insets.bottom },
    ]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {activeMode === 'fly' ? (
        // ── Fly Mode ─────────────────────────────────────────────────────────
        // FlyModeScreen fills all space. Its map controls start with Classic's
        // Modes button, at the top trailing corner where Classic has it, so the
        // way in is the way back (build 48 F3, moved there after build 49). It
        // lives in Fly's control column, which slides clear of the landscape
        // sheet, so it is inside Suspense: the split second while Fly's module
        // evaluates has no button (ADR-0031).
        <View style={styles.flyContainer}>
          <Suspense fallback={<FlyModePlaceholder />}>
            <FlyModeScreen />
          </Suspense>
        </View>
      ) : (
        // ── Classic ──────────────────────────────────────────────────────────
        // VoiceOver order, both layouts (brief §6): the phase line, the timer,
        // the partner slot, today's row, then the controls.
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.page, { paddingTop: insets.top + space.s }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.column, { width: pageWidth }]}>
            <View style={styles.topRow}>
              <Text style={styles.phaseLine} maxFontSizeMultiplier={1.6} accessibilityRole="header">
                <Text style={{ color: tokens.ink }}>{phaseLabel}</Text>
                <Text style={{ color: tokens.inkSoft }}>
                  {' · '}
                  {t('timer.session', { n: sessionN, total: cycleTotal })}
                </Text>
              </Text>
              <PressableScale
                onPress={() => router.push('/modes')}
                haptic={false}
                accessibilityLabel={t('modes.button')}
                style={styles.modeButton}
              >
                <Icon glyph={modesGlyph} size={24} color={tokens.ink} />
              </PressableScale>
            </View>

            {compactHeight ? (
              <View style={styles.compact}>
                <View style={styles.centre}>{face}</View>
                <View style={styles.trailing}>
                  {partner}
                  {today}
                  {controls}
                </View>
              </View>
            ) : (
              <>
                <View style={styles.centre}>
                  {face}
                  {partner}
                  {today}
                </View>
                {controls}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Fly mode overrides: no padding/centering so the map fills the space
  containerFly: {
    padding: 0,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  // Fly mode: the map, its controls (Modes among them) its own
  flyContainer: {
    flex: 1,
  },
  flyPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  page: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: space.l,
  },
  column: {
    flexGrow: 1,
    gap: space.l,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: minTarget,
  },
  phaseLine: {
    fontSize: 17,
    fontWeight: '600',
    flexShrink: 1,
  },
  modeButton: {
    width: minTarget,
    height: minTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.l,
  },
  compact: {
    flexGrow: 1,
    flexDirection: 'row',
    gap: space.xl,
  },
  trailing: {
    flex: 1,
    justifyContent: 'center',
    gap: space.l,
  },
  timer: {
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  nextLine: {
    fontSize: 15,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  stamp: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: space.s,
    paddingVertical: 2,
    transform: [{ rotate: '-3deg' }],
  },
  stampText: {
    fontSize: 14,
    fontWeight: '700',
  },
  partner: {
    alignItems: 'center',
    gap: space.xs,
  },
  pair: {
    flexDirection: 'row',
    gap: space.xs,
  },
  partnerLine: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
