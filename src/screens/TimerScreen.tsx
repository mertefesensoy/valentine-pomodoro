import { View, Text, Pressable, StyleSheet, Alert, Platform, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useTimer } from "../hooks/useTimer";
import LoveNoteCard from "../components/LoveNoteCard";
import GoalReachedPopup from "../components/GoalReachedPopup";
import { CircularProgress } from "../components/CircularProgress";
import TimerText from "../components/TimerText";
import CalmBackground from "../components/CalmBackground";
import ModeSwitcher from "../components/ModeSwitcher";
import { isFlyModeAvailable } from "../constants/features";
import * as Haptics from "expo-haptics";
import { useSessionState } from "../hooks/useSessionClock";
import { useSlotProgress } from "../hooks/useSlotClock";
import { useNotesStore } from "../stores/notesStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useStatsStore } from "../stores/statsStore";
import { useUiStore } from "../stores/uiStore";
import { useTheme } from "../theme/useTheme";
import { useResponsive } from "../hooks/useResponsive";
import { useScreenFocused } from "../hooks/useScreenFocus";
import { AdManager } from "../ads/AdManager";
import { AdPolicy } from "../ads/AdPolicy";

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

export default function TimerScreen() {
  const { height, isLandscape, isTablet, isShortViewport } = useResponsive();
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore((s) => s.settings);
  const incrementFocus = useStatsStore((s) => s.incrementFocus);
  const goalHitPulse = useStatsStore((s) => s.goalHitPulse);
  const clearGoalHitPulse = useStatsStore((s) => s.clearGoalHitPulse);
  const pickRandomNote = useNotesStore((s) => s.pickRandomNote);
  const activeMode = useUiStore((s) => s.activeMode);
  const setActiveMode = useUiStore((s) => s.setActiveMode);
  // Session state and actions: re-renders on session changes, not each second.
  // The time is <TimerText>'s and the ring's (Phase 1 B4).
  const session = useSessionState();
  // The tab is never hidden or frozen (B6 fix, record §9), so what must happen
  // in front of the user waits until Timer is focused: the celebration, the
  // love note (both start auto-dismiss timers) and the interstitial. Before,
  // the frozen tab held them (B4 record §3.5). Always true outside a navigator.
  const focused = useScreenFocused();
  const { colors, isDark } = useTheme();

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

  // The overlays after a completed focus, in order: the goal celebration, then
  // the love note, then the interstitial (FR-ADS-001, FR-NTE-001). Derived from
  // state, not synchronised by effects (Phase 1 B5, react-hooks/set-state-in-effect).
  // - The celebration is the stats store's pulse itself: set only when a
  //   completion first reaches a day's goal (goalHit is sticky, so never twice
  //   for one day), cleared when the popup closes.
  // - A love note waits while it shows: the overlays below render the note
  //   only when no celebration is up, so the card mounts, and starts its own
  //   8 s timer, after the celebration closes.
  const goalPopup = goalHitPulse;

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

  // Compact spacing flag — reduce margins on small landscape viewports
  const tightSpacing = isLandscape || isShortViewport;

  // Dynamic progress ring size
  const ringSize = useMemo(() => {
    if (isLandscape) {
      return isTablet ? 320 : Math.min(height * 0.7, 280);
    }
    if (isTablet) {
      return 300;
    }
    return 260;
  }, [isLandscape, isTablet, height]);

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

  // Phase label
  const getPhaseLabel = () => {
    switch (phase) {
      case 'focus':
        return 'Focus';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  // Primary button label
  const getPrimaryButtonLabel = () => {
    if (isRunning) return 'Pause';
    if (remainingMs < (phase === 'focus' ? settings.durations.focus * 60 * 1000 : settings.durations.shortBreak * 60 * 1000)) {
      return 'Resume';
    }
    return 'Start';
  };

  // Primary button action
  const handlePrimaryAction = () => {
    // Light haptic on button press
    if (settings.haptics) {
      Haptics.selectionAsync().catch(() => { }); // Catch failures (e.g. web)
    }

    if (isRunning) {
      pause();
    } else if (remainingMs !== null && remainingMs < totalMs) {
      resume();
    } else {
      start();
    }
  };

  // Reset with confirmation
  const handleReset = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to reset the timer?');
      if (confirmed) {
        reset();
      }
    } else {
      Alert.alert(
        'Reset Timer',
        'Are you sure you want to reset the timer?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: () => reset() },
        ]
      );
    }
  };

  // Content components
  const timerContent = (
    <>
      {/* Header */}
      <Text style={[
        styles.header,
        isTablet && styles.headerTablet,
        tightSpacing && styles.headerTight,
        { color: colors.text }
      ]}>
        Valentine Pomodoro 💗
      </Text>

      {/* Status chip */}
      <View style={[
        styles.statusChip,
        tightSpacing && styles.statusChipTight,
        { backgroundColor: colors.surfaceTint }
      ]}>
        <Text style={[styles.statusText, isTablet && styles.statusTextTablet, { color: colors.accent }]}>
          {getPhaseLabel()}
        </Text>
      </View>

      {/* Progress ring + timer display */}
      <View style={[styles.progressContainer, tightSpacing && styles.progressContainerTight]}>
        <CircularProgress
          size={ringSize}
          progress={ringProgress}
          trackColor={colors.surfaceTint}
          progressColor={colors.accent}
        />
        <View style={styles.timerOverlay}>
          {/* The only part of this screen that re-renders each second (Phase 1 B4) */}
          <TimerText
            kind="pomodoro"
            idleMs={totalMs}
            style={[
              styles.timer,
              isTablet && styles.timerTablet,
              isLandscape && styles.timerLandscape,
              { color: colors.text }
            ]}
          />
        </View>
      </View>

      {/* Cycle indicator */}
      <Text style={[
        styles.cycleText,
        isTablet && styles.cycleTextTablet,
        tightSpacing && styles.cycleTextTight,
        { color: colors.textMuted }
      ]}>
        Session {completedFocusCountInCycle + 1} of {settings.longBreakEvery}
      </Text>
    </>
  );

  const controlsContent = (
    <>
      {/* Primary action button */}
      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: colors.accent },
          isTablet && styles.primaryButtonTablet,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
        onPress={handlePrimaryAction}
      >
        <Text style={[styles.primaryButtonText, isTablet && styles.primaryButtonTextTablet]}>
          {getPrimaryButtonLabel()}
        </Text>
      </Pressable>

      {/* Secondary actions */}
      <View style={styles.secondaryActions}>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.accentPurple },
            isTablet && styles.secondaryButtonTablet,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={skip}
        >
          <Text style={[styles.secondaryButtonText, isTablet && styles.secondaryButtonTextTablet, { color: colors.accentPurple }]}>
            Skip
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.accentPurple },
            isTablet && styles.secondaryButtonTablet,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleReset}
        >
          <Text style={[styles.secondaryButtonText, isTablet && styles.secondaryButtonTextTablet, { color: colors.accentPurple }]}>
            Reset
          </Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={[
      styles.container,
      activeMode === 'fly' ? styles.containerFly : { backgroundColor: colors.bg },
      // Inside a native tab the bottom inset includes the tab bar (Phase 1 B6).
      { paddingBottom: insets.bottom },
    ]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {activeMode === 'fly' ? (
        // ── Fly Mode ─────────────────────────────────────────────────────────
        // FlyModeScreen fills all space; ModeSwitcher floats over the map. The
        // switcher sits outside Suspense, so Classic stays reachable while Fly loads.
        <View style={styles.flyContainer}>
          <Suspense fallback={<FlyModePlaceholder />}>
            <FlyModeScreen />
          </Suspense>
          <View style={[styles.flyModeSwitcherBar, { top: insets.top + 8 }]}>
            <ModeSwitcher activeMode={activeMode} onModeChange={setActiveMode} />
          </View>
        </View>
      ) : (
        // ── Default Mode ──────────────────────────────────────────────────────
        // Wrapper holds both the scrollable content and absolute overlays.
        <View style={styles.defaultModeWrapper}>
          <CalmBackground enabled={settings.animationsEnabled} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.contentWrapper,
              isTablet && styles.contentWrapperTablet,
              isLandscape && styles.contentWrapperLandscape,
              { paddingTop: insets.top + 20 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Mode switcher — sits above the header; hidden where Fly can't open */}
            {isFlyModeAvailable() && (
              <ModeSwitcher activeMode={activeMode} onModeChange={setActiveMode} />
            )}

            {isLandscape ? (
              // Landscape: two-column layout
              <>
                <View style={styles.leftPane}>
                  {timerContent}
                </View>
                <View style={styles.rightPane}>
                  {controlsContent}
                </View>
              </>
            ) : (
              // Portrait: stacked layout
              <>
                {timerContent}
                {controlsContent}
              </>
            )}
          </ScrollView>

          {/* Overlays — rendered outside the scroll so they always fill the screen */}
          <GoalReachedPopup
            visible={!!goalPopup && focused}
            newStreak={goalPopup?.newStreak ?? 0}
            animationsEnabled={settings.animationsEnabled}
            autoDismissMs={1400}
            onClose={clearGoalHitPulse}
          />
          {focused && !goalPopup && showLoveNoteCard && lastLoveNote && (
            <LoveNoteCard note={lastLoveNote} onDismiss={dismissLoveNote} />
          )}
        </View>
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
  // Fly mode: map + overlaid mode switcher
  flyContainer: {
    flex: 1,
  },
  flyPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyModeSwitcherBar: {
    position: 'absolute',
    // top is inset-aware and set inline
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  // Default mode: fills available space, hosts scrollable content + absolute overlays
  defaultModeWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentWrapperTablet: {
    maxWidth: 900,
  },
  contentWrapperLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 1200,
    gap: 40,
  },
  leftPane: {
    flex: 1,
    alignItems: 'center',
  },
  rightPane: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  progressContainerTight: {
    marginVertical: 8,
  },
  timerOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    // color removed - now inline
    marginBottom: 32,
  },
  headerTablet: {
    fontSize: 28,
  },
  headerTight: {
    marginBottom: 10,
  },
  statusChip: {
    // backgroundColor removed - now inline
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 24,
  },
  statusChipTight: {
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    // color removed - now inline
  },
  statusTextTablet: {
    fontSize: 18,
  },
  timer: {
    fontSize: 72,
    fontWeight: '700',
    // color removed - now inline
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  timerTablet: {
    fontSize: 84,
  },
  timerLandscape: {
    fontSize: 56,
    marginBottom: 8,
  },
  cycleText: {
    fontSize: 14,
    // color removed - now inline
    marginBottom: 48,
  },
  cycleTextTablet: {
    fontSize: 16,
  },
  cycleTextTight: {
    marginBottom: 16,
  },
  primaryButton: {
    // backgroundColor removed - now inline
    paddingHorizontal: 64,
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonTablet: {
    paddingHorizontal: 80,
    paddingVertical: 20,
    minWidth: 240,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  primaryButtonTextTablet: {
    fontSize: 22,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    borderWidth: 2,
    // borderColor removed - now inline
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryButtonTablet: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    // color removed - now inline
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButtonTextTablet: {
    fontSize: 18,
  },
});
