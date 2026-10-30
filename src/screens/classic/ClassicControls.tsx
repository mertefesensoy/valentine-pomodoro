import { Text, View } from 'react-native';
import Animated, { css, cubicBezier } from 'react-native-reanimated';

import { PressableScale } from '../../components/ui/PressableScale';
import { SegmentedControl, type Segment } from '../../components/ui/SegmentedControl';
import type { PresetId } from '../../constants/presets';
import type { ThemeTokens } from '../../theme/palette';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';
import { t } from '../../i18n';

type Props = {
    tokens: ThemeTokens;
    /** No session started or paused: the presets show; otherwise the cycle row does. */
    idle: boolean;
    paused: boolean;
    primaryLabel: string;
    onPrimary: () => void;
    onSkip: () => void;
    onEnd: () => void;
    presets: readonly Segment<PresetId>[];
    preset: PresetId | null;
    onPreset: (id: PresetId) => void;
    /** Focus sessions done in this cycle, and the cycle's length. */
    cycleDone: number;
    cycleLength: number;
};

/** The cycle's sessions as dots (brief §6): done ones filled, the current one outlined. Visual only. */
function CycleRow({ tokens, done, length }: { tokens: ThemeTokens; done: number; length: number }) {
    return (
        <View style={styles.cycle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {Array.from({ length }, (_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        i < done
                            ? { backgroundColor: tokens.primary, borderColor: tokens.primary }
                            : i === done
                              ? { borderColor: tokens.primaryInk }
                              : { borderColor: tokens.edgeStrong },
                    ]}
                />
            ))}
        </View>
    );
}

/**
 * Classic's controls (brief §6), in thumb reach above the tab bar:
 * - one reserved row: the presets while idle, which crossfade into the cycle row on Start in the
 *   same height (nothing jumps), on a 200 ms opacity transition; the hidden one is out of reach
 *   and out of VoiceOver;
 * - the primary pill, strawberry with a cocoa label, at least 54 pt tall;
 * - Skip as a quiet pill; End only while paused, in the destructive ink (its confirmation is the
 *   screen's native alert).
 * Every press: 0.97 over 120 ms with its haptic (PressableScale).
 */
export function ClassicControls(p: Props) {
    const { tokens } = p;
    return (
        <View style={styles.wrap}>
            <View style={styles.reserved}>
                <Animated.View
                    style={[styles.layer, styles.fade, { opacity: p.idle ? 1 : 0 }]}
                    pointerEvents={p.idle ? 'auto' : 'none'}
                    accessibilityElementsHidden={!p.idle}
                    importantForAccessibility={p.idle ? 'auto' : 'no-hide-descendants'}
                >
                    <SegmentedControl segments={p.presets} value={p.preset} onChange={p.onPreset} />
                    {/* The key "25/5" needs to be read without recall (critique P2); VoiceOver hears each segment in words. */}
                    <Text
                        style={[styles.key, { color: tokens.inkSoft }]}
                        maxFontSizeMultiplier={1.6}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        {t('presets.key')}
                    </Text>
                </Animated.View>
                <Animated.View style={[styles.layer, styles.fade, styles.centre, { opacity: p.idle ? 0 : 1 }]} pointerEvents="none">
                    <CycleRow tokens={tokens} done={p.cycleDone} length={p.cycleLength} />
                </Animated.View>
            </View>

            <PressableScale onPress={p.onPrimary} style={[styles.primary, { backgroundColor: tokens.primary }]}>
                <Text style={[styles.primaryLabel, { color: tokens.onPrimary }]} maxFontSizeMultiplier={1.6}>
                    {p.primaryLabel}
                </Text>
            </PressableScale>

            <View style={styles.secondary}>
                <PressableScale onPress={p.onSkip} style={[styles.quiet, { backgroundColor: tokens.paper, borderColor: tokens.edge }]}>
                    <Text style={[styles.quietLabel, { color: tokens.ink }]} maxFontSizeMultiplier={1.6}>
                        {t('controls.skip')}
                    </Text>
                </PressableScale>
                {p.paused && (
                    <PressableScale onPress={p.onEnd} style={[styles.quiet, { backgroundColor: tokens.paper, borderColor: tokens.edge }]}>
                        <Text style={[styles.quietLabel, { color: tokens.dangerInk }]} maxFontSizeMultiplier={1.6}>
                            {t('controls.endSession')}
                        </Text>
                    </PressableScale>
                )}
            </View>
        </View>
    );
}

const styles = css.create({
    wrap: { alignSelf: 'stretch', gap: space.m },
    // The presets and their key, or the cycle row, in one reserved height so nothing jumps on Start.
    reserved: { minHeight: minTarget + 8 + 22, justifyContent: 'center' },
    key: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: space.xs },
    layer: { position: 'absolute', left: 0, right: 0 },
    centre: { alignItems: 'center' },
    fade: {
        transitionProperty: 'opacity',
        transitionDuration: 200,
        transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
    },
    cycle: { flexDirection: 'row', gap: space.s, height: minTarget, alignItems: 'center' },
    dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
    primary: {
        minHeight: 56,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: space.xl,
        paddingVertical: space.m,
    },
    primaryLabel: { fontSize: 18, fontWeight: '600' },
    secondary: { flexDirection: 'row', justifyContent: 'center', gap: space.m, flexWrap: 'wrap' },
    quiet: {
        minHeight: minTarget,
        minWidth: 112,
        borderRadius: radius.pill,
        borderWidth: edgeWidth,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: space.xl,
        paddingVertical: space.s,
    },
    quietLabel: { fontSize: 16, fontWeight: '600' },
});
