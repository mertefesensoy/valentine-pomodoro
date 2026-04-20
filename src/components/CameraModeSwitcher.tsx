import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ValentineSpec } from '../theme/tokens';
import type { CameraMode } from '../types';

const MODES: { mode: CameraMode; icon: string; label: string }[] = [
    { mode: 'global',      icon: '🌐', label: 'Global'  },
    { mode: 'flat',        icon: '🗺',  label: 'Flat'    },
    { mode: 'followPlane', icon: '✈️',  label: 'Chase'   },
    { mode: 'followPath',  icon: '🛣',  label: 'Path'    },
    { mode: 'seeAll',      icon: '🔭', label: 'See all' },
];

interface CameraModeSwitcherProps {
    cameraMode: CameraMode;
    onSelect: (mode: CameraMode) => void;
    isDark: boolean;
    hapticsEnabled?: boolean;
}

export default function CameraModeSwitcher({
    cameraMode,
    onSelect,
    isDark,
    hapticsEnabled,
}: CameraModeSwitcherProps) {
    const bgBase = isDark ? 'rgba(45,45,45,0.95)' : 'rgba(247,243,240,0.95)';

    return (
        <View style={styles.container}>
            {MODES.map(({ mode, icon }) => {
                const active = cameraMode === mode;
                return (
                    <Pressable
                        key={mode}
                        style={[
                            styles.btn,
                            { backgroundColor: bgBase, borderColor: `${ValentineSpec.accentPrimary}30` },
                            active && styles.btnActive,
                        ]}
                        onPress={() => {
                            if (hapticsEnabled) Haptics.selectionAsync().catch(() => {});
                            onSelect(mode);
                        }}
                        accessibilityLabel={`Camera: ${mode}`}
                        accessibilityRole="button"
                    >
                        <Text style={styles.icon}>{icon}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    btn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnActive: {
        borderColor: ValentineSpec.accentPrimary,
        borderWidth: 2,
        backgroundColor: `${ValentineSpec.accentPrimary}18`,
    },
    icon: {
        fontSize: 18,
    },
});
