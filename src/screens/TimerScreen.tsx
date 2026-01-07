import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useTimer } from "../hooks/useTimer";
import { useSettings } from "../hooks/useSettings";
import { formatTime } from "../utils/time";

export default function TimerScreen() {
  const { settings } = useSettings();
  const {
    phase,
    isRunning,
    remainingMs,
    completedFocusCountInCycle,
    start,
    pause,
    resume,
    skip,
    reset,
  } = useTimer(settings);

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

      {/* Timer display */}
      <Text style={styles.timer}>{formatTime(remainingMs)}</Text>

      {/* Cycle indicator */}
      <Text style={styles.cycleText}>
        Session {completedFocusCountInCycle + 1} of {settings.longBreakEvery}
      </Text>

      {/* Primary action button */}
      <TouchableOpacity style={styles.primaryButton} onPress={handlePrimaryAction}>
        <Text style={styles.primaryButtonText}>{getPrimaryButtonLabel()}</Text>
      </TouchableOpacity>

      {/* Secondary actions */}
      <View style={styles.secondaryActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={skip}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F0', // warm cream
    padding: 20,
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
