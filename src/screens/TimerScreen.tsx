import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useMemo } from "react";
import { useTimer } from "../hooks/useTimer";
import { useSettings } from "../hooks/useSettings";
import { useLoveNotes } from "../hooks/useLoveNotes";
import { useStats } from "../hooks/useStats";
import { formatTime } from "../utils/time";
import LoveNoteCard from "../components/LoveNoteCard";
import { CircularProgress } from "../components/CircularProgress";
import * as Haptics from "expo-haptics";

export default function TimerScreen() {
  const { settings } = useSettings();
  const { pickRandomNote } = useLoveNotes();
  const { incrementFocus } = useStats();
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
  } = useTimer(settings, pickRandomNote, incrementFocus);

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
    if (remainingMs < (phase === 'focus' ? settings.durations.focus * 60 * 1000 : settings.durations.shortBreak * 60 * 1000)) {
      return 'Resume';
    }
    return 'Start';
  };

  // Primary button action
  const handlePrimaryAction = () => {
    // Light haptic on button press
    if (settings.haptics) {
      Haptics.selectionAsync();
    }

    if (isRunning) {
      pause();
    } else if (remainingMs < (phase === 'focus' ? settings.durations.focus * 60 * 1000 : settings.durations.shortBreak * 60 * 1000)) {
      resume();
    } else {
      start();
    }
  };

  // Reset with confirmation
  const handleReset = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: reset },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Valentine Pomodoro 💗</Text>

      {/* Status chip */}
      <View style={styles.statusChip}>
        <Text style={styles.statusText}>{getPhaseLabel()}</Text>
      </View>

      {/* Progress ring + timer display */}
      <View style={styles.progressContainer}>
        <CircularProgress
          size={260}
          strokeWidth={14}
          progress={progress}
          trackColor="#FFE8EC"
          progressColor="#E63946"
        />
        <View style={styles.timerOverlay}>
          <Text style={styles.timer}>{formatTime(remainingMs)}</Text>
        </View>
      </View>

      {/* Cycle indicator */}
      <Text style={styles.cycleText}>
        Session {completedFocusCountInCycle + 1} of {settings.longBreakEvery}
      </Text>

      {/* Primary action button */}
      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
        onPress={handlePrimaryAction}
      >
        <Text style={styles.primaryButtonText}>{getPrimaryButtonLabel()}</Text>
      </Pressable>

      {/* Secondary actions */}
      <View style={styles.secondaryActions}>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={skip}
        >
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleReset}
        >
          <Text style={styles.secondaryButtonText}>Reset</Text>
        </Pressable>
      </View>

      {/* Love Note Card - appears on focus completion */}
      {showLoveNoteCard && lastLoveNote && (
        <LoveNoteCard note={lastLoveNote} onDismiss={dismissLoveNote} />
      )}
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
  timer: {
    fontSize: 72,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  cycleText: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 48,
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
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
  secondaryButtonText: {
    color: '#D4A5D9',
    fontSize: 16,
    fontWeight: '500',
  },
});
