import { View, Text, StyleSheet, Alert, Platform, ScrollView, StatusBar, ActivityIndicator, useWindowDimensions, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTimer } from "../hooks/useTimer";
import { applyUiAudioMode, loadUiSounds, playUiSound } from "../audio/uiSounds";
import { runAfterFirstFrame } from "../startup/deferredStartup";
import TimerText from "../components/TimerText";
import { Icon } from "../components/icons/Icon";
import { modes as modesGlyph } from "../components/icons/art/modes";
import { PressableScale } from "../components/ui/PressableScale";
import { StatusBarScrim } from "../components/ui/StatusBarScrim";
import { useSessionState } from "../hooks/useSessionClock";
import { useSlotProgress } from "../hooks/useSlotClock";
import { useNotesStore } from "../stores/notesStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useStatsStore } from "../stores/statsStore";
import { useUiStore } from "../stores/uiStore";
import { useLoveNoteSheet } from "../stores/loveNoteSheetStore";
import { useTheme } from "../theme/useTheme";
import { type } from "../theme/type";
import { edgeWidth, minTarget, radius, space } from "../theme/layout";
import { useScreenFocused } from "../hooks/useScreenFocus";
import { AdManager } from "../ads/AdManager";
import { AdPolicy } from "../ads/AdPolicy";
import { PRESETS, choosePresetPatch, classicLayoutOf, customDurationsOf, presetChoiceOf, type PresetChoice } from "../constants/presets";
import { language, t } from "../i18n";
import { getTodayKey } from "../utils/time";
import { PhaseRing } from "./classic/PhaseRing";
import { PoseSticker, poseFor } from "./classic/PoseSticker";
import { SpreadPages } from "./classic/SpreadPages";
import { TodayStickers, goalCellsLeft } from "./classic/TodayStickers";
import { ClassicControls } from "./classic/ClassicControls";
import { useWelcomeGate } from "./welcome/useWelcomeGate";
import { currentStep, useTourStore } from "./tutorial/tourStore";
import { useTourBeatHere, useTourGate, useTourReach } from "./tutorial/useTour";
import type { TourTargetSpec } from "./tutorial/TourLayer";

// Fly Mode is split out (Phase 1 task B1): FlyModeScreen and everything only it
// imports (react-native-maps, FlySheet, Fly's audio) are evaluated the first time
// Fly opens, not on a cold start into Classic. Hermes still ships them in the one
// bundle, so this defers evaluation only. Fly can only open where
// isFlyModeAvailable() (iOS), so elsewhere the module is never loaded at all.
const FlyModeScreen = lazy(() => import("./FlyModeScreen"));

// The tour's layer (Phase 1 D5) is split out the same way: its art, its voices and its motion are
// evaluated when a tour first reaches this screen, never on a cold start (tutorial brief §4).
const TourLayer = lazy(() => import("./tutorial/TourLayer"));

// Shown while FlyModeScreen loads on the first switch: a plain page in the
// theme's background colour, so the switch doesn't flash an empty grey map.
function FlyModePlaceholder() {
  const { tokens } = useTheme();
  return (
    <View
      style={[styles.flyPlaceholder, { backgroundColor: tokens.page }]}
      accessibilityLabel={t('fly.loading')}
    >
      <ActivityIndicator color={tokens.primaryInk} />
    </View>
  );
}

// AX1 and up (iOS reports a font scale of about 1.65 there): Facing Pages stacks its pages.
const STACK_FONT_SCALE = 1.6;
// Compact height (an iPhone in landscape): the timer leads and a column trails (brief §6, HIG M-1).
const COMPACT_HEIGHT = 500;
// Regular width (iPad, wide windows): both layouts centre at a readable width.
const READABLE_WIDTH = 560;
// The Ring's floor when it sizes to the height left (finish review fix 7): below it the page
// scrolls rather than shrink the timer further (an iPhone SE at default text size).
const MIN_RING = 200;
// The Ring page's fixed spacing around its rows: the page's padding under the status bar (8) and
// at its foot (16), the column's two gaps and the centre's two (16 each).
const RING_PAGE_CHROME = space.s + space.l + space.l * 4;
// Before the rows are first measured: their heights at the default text size with the default
// goal (the phase line, the partner strip, one row of today's cells, the controls), from build
// 53's captures, so the first frame lands within a few points of the measured one.
const RING_ROWS_ESTIMATE = 346;

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
  // Today's goal and minutes, for the dashed cells still to fill (D1 record §4.3).
  const goalToday = useStatsStore((s) => s.days[getTodayKey()]?.goalMinutes ?? s.goalMinutes);
  const minutesToday = useStatsStore((s) => s.days[getTodayKey()]?.focusMinutes ?? 0);
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
      // Choosing Fly mid-tour ends the tour: it never shows over Fly, and Settings can replay it (D5).
      useTourStore.getState().finish();
    } else if (prev === 'fly' && activeMode !== 'fly') {
      session.switchTo('pomodoro');
      // Fly's ambience set an audio mode that plays through the silent switch; the UI sounds
      // respect it (D4).
      applyUiAudioMode();
    }
  }, [activeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // The UI sounds (D4, FR-SET-004): loaded after the first frame, never on the cold-start path
  // (NFR-PERF-001), with the audio session they need. A launch straight into Fly leaves Fly's own
  // mode in place; coming back sets this one (above).
  useEffect(
    () =>
      runAfterFirstFrame('sounds.load', () => {
        if (useUiStore.getState().activeMode !== 'fly') applyUiAudioMode();
        loadUiSounds();
      }),
    [],
  );

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

  // The sticker placement's success haptic and its completion sound, on the frame its sticker
  // lands: a completion while Timer is in front (HIG D1-L1: once per completion; each follows its
  // Settings switch). The sound opens with its pop, the sticker pressed on, so it starts with the
  // placement spring, not after it (D4 record §8).
  const prevCountRef = useRef(todayCount);
  useEffect(() => {
    const grew = todayCount > prevCountRef.current;
    prevCountRef.current = todayCount;
    if (!grew || !focused) return;
    playUiSound('complete');
    if (useSettingsStore.getState().settings.haptics) {
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
  // The tour (D5): it follows the welcome on the same calm entry, and shows here while its beat is
  // the Timer's, this tab is in front and Classic is up (never over Fly). A tab tour step moves on
  // when its tab comes to the front.
  useTourGate(focused && idle && activeMode !== 'fly' && !goalPopup && !showLoveNoteCard);
  useTourReach('timer', focused);
  const tourHere = useTourBeatHere('timer') && focused && activeMode !== 'fly';
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

  // The haptic is the pill's own, on press-in (PressableScale). Starting a phase plays its sound
  // (D4): focus start rises, break start steps back down. Pause and Resume play none.
  const handlePrimaryAction = () => {
    if (isRunning) {
      pause();
    } else if (remainingMs !== null && remainingMs < totalMs) {
      resume();
    } else {
      // The tour's layer closes before a session starts, so the first Start's notification prompt
      // lands on the Timer (T-3).
      useTourStore.getState().finish();
      playUiSound(phase === 'focus' ? 'focusStart' : 'breakStart');
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
    // At the tour's first step, pressing a preset is the step's own way on: a beat later, so the
    // choice is seen first.
    const run = useTourStore.getState().run;
    if (run && currentStep(run)?.id === 'presets') {
      setTimeout(() => {
        const now = useTourStore.getState().run;
        if (now && currentStep(now)?.id === 'presets') useTourStore.getState().next();
      }, 600);
    }
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
  // Landscape (compact height) uses the width between the side insets; the readable cap is for a
  // portrait column. Capped, the face took most of 512 pt and the trailing column got about 80 pt:
  // the partner line vanished, today's cells stacked one a line, and the column grew so tall the
  // face, centred against it, began below the screen (build 53 device check, D2 record §3.20).
  const pageWidth = compactHeight
    ? width - insets.left - insets.right - space.xl * 2
    : Math.min(width, READABLE_WIDTH) - space.xl * 2;
  // Landscape: the face takes half the page and the whole height between the insets and the page's
  // padding; the phase line moves into the trailing column, so nothing sits above the face.
  const compactFace = {
    width: (pageWidth - space.xl) / 2,
    height: height - insets.top - insets.bottom - space.s - space.l,
  };
  const trailingWidth = pageWidth - compactFace.width - space.xl;
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

  // Portrait, below the AX sizes, the Ring takes the height its neighbours leave: the ScrollView's
  // visible height, less the page's spacing and the four rows around the ring (finish review fix
  // 7). Those rows never depend on the ring, so the sum settles in one pass whatever order their
  // layouts arrive in. Build 51's slot measured its own height instead: inside the ScrollView flex
  // could hand it only spare height, there was none, and it reported the ring back to itself, so
  // the ring stayed at its cap and pushed Skip behind the tab bar (D1 record §3.21). The rows are
  // measured in every layout, so switching to the Ring finds them; only the Ring uses them. At AX
  // sizes (where the page scrolls by design) and in landscape, the fixed rules.
  const ringFits = layout === 'ring' && !compactHeight && fontScale < STACK_FONT_SCALE;
  // The goal moment shows for 1.4 s under today's row, during the sticker placement. The ring
  // holds its size through it: today's row isn't re-measured, and the page scrolls for that moment
  // rather than the timer shrinking and growing back.
  const goalMomentShowing = !!goalPopup && focused;

  // The tour's openings and how the page scrolls one clear of the AX panel (D5, T-2).
  const presetsRef = useRef<ComponentRef<typeof View>>(null);
  const todayRef = useRef<ComponentRef<typeof View>>(null);
  const modesRef = useRef<ComponentRef<typeof View>>(null);
  const startRef = useRef<ComponentRef<typeof View>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(0);
  const trackScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };
  const scrollBy = (dy: number) => {
    scrollY.current = Math.max(0, scrollY.current + dy);
    scrollRef.current?.scrollTo({ y: scrollY.current, animated: true });
  };
  const rows = useRef({ visible: 0, top: 0, partner: 0, today: 0, controls: 0 });
  const [ringRoom, setRingRoom] = useState<number | null>(null);
  // Called from the rows' onLayout only, never during render.
  const measured = (row: keyof typeof rows.current, e: LayoutChangeEvent) => {
    if (row === 'today' && goalMomentShowing) return;
    rows.current[row] = e.nativeEvent.layout.height;
    const { visible, top, partner, today, controls } = rows.current;
    if (ringFits && visible && top && partner && today && controls) {
      setRingRoom(Math.floor(visible - insets.top - RING_PAGE_CHROME - top - partner - today - controls));
    }
  };
  const ringCap = Math.min(pageWidth * (fontScale >= STACK_FONT_SCALE ? 0.66 : 0.86), 340);
  const ringSize = compactHeight
    ? Math.min(compactFace.height, compactFace.width)
    : ringFits
      ? Math.max(
          MIN_RING,
          Math.min(ringCap, ringRoom ?? height - insets.top - insets.bottom - RING_PAGE_CHROME - RING_ROWS_ESTIMATE),
        )
      : Math.min(ringCap, height * 0.36);

  const face =
    layout === 'spread' ? (
      <SpreadPages
        tokens={tokens}
        width={compactHeight ? compactFace.width : pageWidth}
        stacked={fontScale >= STACK_FONT_SCALE}
        pose={pose}
        progress={ringProgress}
        isBreak={isBreak}
        line={t(partnerLine)}
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

  // The partner slot: on the Ring, one paper field with the pair and their line, as the C4
  // sketch draws it (finish review fix 5); Facing Pages carries it on its right page (fix 4).
  const partner = layout === 'ring' ? (
    <View
      style={[styles.partner, { backgroundColor: tokens.paper, borderColor: tokens.edge }]}
      onLayout={(e) => measured('partner', e)}
      testID="partner-strip"
    >
      <View style={styles.pair} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <PoseSticker who="pomo" pose={pose} width={40} shadow={tokens.stickerShadow} />
        <View style={styles.pairOverlap}>
          <PoseSticker who="doro" pose={pose} width={40} shadow={tokens.stickerShadow} />
        </View>
      </View>
      <Text style={[styles.partnerLine, { color: tokens.ink }]}>{t(partnerLine)}</Text>
    </View>
  ) : null;

  const today = (
    <TodayStickers
      tokens={tokens}
      count={todayCount}
      goalHit={goalHitToday}
      sessionsToGoal={goalCellsLeft({
        goalMinutes: goalToday,
        minutesToday,
        focusMinutes: settings.durations.focus,
        goalHit: goalHitToday,
      })}
      goalStreak={goalPopup && focused ? goalPopup.newStreak : null}
      onGoalMomentDone={clearGoalHitPulse}
      animate={focused}
      rowWidth={compactHeight ? trailingWidth : undefined}
      onLayout={(e) => measured('today', e)}
      rowRef={todayRef}
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
      onLayout={(e) => measured('controls', e)}
      presetsRef={presetsRef}
      primaryRef={startRef}
    />
  );

  // The tour's four openings here, each acting as its control for VoiceOver (T-1).
  const presetIndex = presetSegments.findIndex((s) => s.value === preset);
  const stepPreset = (by: number) => {
    const next = presetSegments[presetIndex + by];
    if (next) choosePreset(next.value);
  };
  const tourTargets: Partial<Record<'presets' | 'today' | 'modes' | 'start', TourTargetSpec>> = {
    presets: {
      ref: presetsRef,
      radius: radius.m,
      a11y: {
        label: t('tour.presetsLabel'),
        role: 'adjustable',
        value: presetSegments[presetIndex]?.accessibilityLabel,
        onIncrement: () => stepPreset(1),
        onDecrement: () => stepPreset(-1),
      },
    },
    today: { ref: todayRef, radius: radius.m },
    modes: { ref: modesRef, radius: minTarget / 2, a11y: { label: t('modes.button'), role: 'button', onActivate: () => router.push('/modes') } },
    start: { ref: startRef, radius: 28, a11y: { label: primaryLabel, role: 'button', onActivate: handlePrimaryAction } },
  };

  const topRow = (
    <View style={styles.topRow} onLayout={(e) => measured('top', e)} testID="classic-top-row">
      <Text style={styles.phaseLine} maxFontSizeMultiplier={1.6} accessibilityRole="header">
        <Text style={{ color: tokens.ink }}>{phaseLabel}</Text>
        <Text style={{ color: tokens.inkSoft }}>
          {' · '}
          {t('timer.session', { n: sessionN, total: cycleTotal })}
        </Text>
      </Text>
      <View ref={modesRef} collapsable={false}>
        <PressableScale
          onPress={() => router.push('/modes')}
          haptic={false}
          accessibilityLabel={t('modes.button')}
          style={styles.modeButton}
        >
          <Icon glyph={modesGlyph} size={24} color={tokens.ink} />
        </PressableScale>
      </View>
    </View>
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
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.page, { paddingTop: insets.top + space.s }]}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => measured('visible', e)}
          // While the tour is here: where the page is, and room to scroll an opening above the AX panel.
          onScroll={tourHere ? trackScroll : undefined}
          scrollEventThrottle={tourHere ? 32 : undefined}
          contentInset={tourHere && fontScale >= STACK_FONT_SCALE ? { bottom: height * 0.5 } : undefined}
          testID="classic-page"
        >
          <View style={[styles.column, { width: pageWidth }]}>
            {/* Landscape: the face leads at the full height, centred in it, and the phase line
                heads the trailing column (so VoiceOver reads the timer first there). */}
            {compactHeight ? (
              <View style={styles.compact}>
                <View style={[styles.compactFace, { width: compactFace.width, minHeight: compactFace.height }]}>{face}</View>
                <View style={styles.trailing}>
                  {topRow}
                  {partner}
                  {today}
                  {controls}
                </View>
              </View>
            ) : (
              <>
                {topRow}
                <View style={styles.centre}>
                  {ringFits ? (
                    <View style={styles.ringSlot} testID="ring-slot">
                      {face}
                    </View>
                  ) : face}
                  {partner}
                  {today}
                </View>
                {controls}
              </>
            )}
          </View>
        </ScrollView>
      )}
      {activeMode !== 'fly' && <StatusBarScrim />}
      {tourHere && (
        <Suspense fallback={null}>
          <TourLayer screen="timer" targets={tourTargets} scrollBy={scrollBy} />
        </Suspense>
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
    alignItems: 'flex-start',
    gap: space.xl,
  },
  // Landscape's face column: half the page, at least the visible height, the face centred in it.
  compactFace: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailing: {
    flex: 1,
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
  // The Ring's slot centres the ring in any height left once the ring has reached its cap. It is
  // never measured: its height is the ring's own whenever the page is full (D1 record §3.21).
  ringSlot: {
    flexGrow: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partner: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    minHeight: 72,
    paddingVertical: space.m,
    paddingHorizontal: space.l,
    borderRadius: radius.l,
    borderWidth: edgeWidth,
  },
  pair: {
    flexDirection: 'row',
  },
  // Doro tucks in behind Pomo by 8 pt, as the sketch overlaps them.
  pairOverlap: {
    marginLeft: -space.s,
  },
  partnerLine: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
