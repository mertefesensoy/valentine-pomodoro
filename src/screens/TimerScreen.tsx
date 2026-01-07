import { View, Text, Pressable, StyleSheet, Alert, Platform, useWindowDimensions } from "react-native";
import { useMemo } from "react";
import { useTimer } from "../hooks/useTimer";
import { formatTime } from "../utils/time";
import LoveNoteCard from "../components/LoveNoteCard";
import { CircularProgress } from "../components/CircularProgress";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";

export default function TimerScreen() {
  const { width, height } = useWindowDimensions();
  const { settings, stats, loveNotes } = useApp();
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
  } = useTimer(settings.settings, loveNotes.pickRandomNote, stats.incrementFocus);

  // Responsive layout detection
  const isLandscape = width > height;
  const isTablet = width >= 768;

  // Dynamic progress ring size
  const ringSize = useMemo(() => {
    if (isLandscape) {
      return Math.min(height * 0.6, 220);
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
        ? settings.settings.durations.focus
        : phase === 'shortBreak'
          ? settings.settings.durations.shortBreak
          : settings.settings.durations.longBreak;
    return mins * 60 * 1000;
  }, [phase, settings.settings.durations]);

  const progress = useMemo(() => {
    if (remainingMs === null) return 0;
    return Math.max(0, Math.min(1, 1 - remainingMs / totalMs));
  }, [remainingMs, totalMs]);

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
    if (remainingMs < (phase === 'focus' ? settings.settings.durations.focus * 60 * 1000 : settings.settings.durations.shortBreak * 60 * 1000)) {
      return 'Resume';
    }
    return 'Start';
  };

  // Primary button action
  const handlePrimaryAction = () => {
    // Light haptic on button press
    if (settings.settings.haptics) {
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
    console.log('handleReset called');
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to reset the timer?');
      if (confirmed) {
        console.log('Reset confirmed (web)');
        reset();
      }
    } else {
      Alert.alert(
        'Reset Timer',
        'Are you sure you want to reset the timer?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => console.log('Reset cancelled') },
          { text: 'Reset', style: 'destructive', onPress: () => { console.log('Reset confirmed'); reset(); } },
        ]
      );
    }
  };

  // Content components
  const timerContent = (
    <>
      {/* Header */}
      <Text style={[styles.header, isTablet && styles.headerTablet]}>Valentine Pomodoro 💗</Text>

      {/* Status chip */}
      <View style={styles.statusChip}>
        <Text style={[styles.statusText, isTablet && styles.statusTextTablet]}>{getPhaseLabel()}</Text>
      </View>

      {/* Progress ring + timer display */}
      <View style={styles.progressContainer}>
        <CircularProgress
          size={ringSize}
          strokeWidth={14}
          progress={progress}
          trackColor="#FFE8EC"
          progressColor="#E63946"
        />
        <View style={styles.timerOverlay}>
          <Text style={[
            styles.timer,
            isTablet && styles.timerTablet,
            isLandscape && styles.timerLandscape
          ]}>{formatTime(remainingMs)}</Text>
        </View>
      </View>

      {/* Cycle indicator */}
      <Text style={[styles.cycleText, isTablet && styles.cycleTextTablet]}>
        Session {completedFocusCountInCycle + 1} of {settings.settings.longBreakEvery}
      </Text>
    </>
  );

  const controlsContent = (
    <>
      {/* Primary action button */}
      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
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
            isTablet && styles.secondaryButtonTablet,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={skip}
        >
          <Text style={[styles.secondaryButtonText, isTablet && styles.secondaryButtonTextTablet]}>Skip</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            isTablet && styles.secondaryButtonTablet,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleReset}
        >
          <Text style={[styles.secondaryButtonText, isTablet && styles.secondaryButtonTextTablet]}>Reset</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={[
        styles.contentWrapper,
        isTablet && styles.contentWrapperTablet,
        isLandscape && styles.contentWrapperLandscape
      ]}>
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

        {/* Love Note Card - appears on focus completion */}
        {showLoveNoteCard && lastLoveNote && (
          <LoveNoteCard note={lastLoveNote} onDismiss={dismissLoveNote} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
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
  timerOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 32,
  },
  headerTablet: {
    fontSize: 28,
  },
  statusChip: {
    backgroundColor: '#FFE8EC',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E63946', // cherry red
  },
  statusTextTablet: {
    fontSize: 18,
  },
  timer: {
    fontSize: 72,
    fontWeight: '700',
    color: '#2D2D2D',
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
    color: '#6B6B6B',
    marginBottom: 48,
  },
  cycleTextTablet: {
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#E63946', // cherry red
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
    borderColor: '#D4A5D9', // lavender
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryButtonTablet: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#D4A5D9',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButtonTextTablet: {
    fontSize: 18,
  },
});
