import { useEffect, useRef, type ComponentRef, type ReactNode, type Ref } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '../../components/icons/Icon';
import { sound } from '../../components/icons/art/sound';
import { soundOff } from '../../components/icons/art/soundOff';
import { PressableScale } from '../../components/ui/PressableScale';
import { t } from '../../i18n';
import type { ThemeTokens } from '../../theme/palette';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';

type Props = {
    tokens: ThemeTokens;
    name: string;
    /** Who's speaking: the name takes their colour, strawberry for Pomo, leaf for Doro (the owner, F-3). */
    speaker: 'pomo' | 'doro';
    reduced: boolean;
    /** The line as characters, and how many show (the write-on). */
    chars: readonly string[];
    shown: number;
    /** A tap on the line finishes it at once (brief §6). */
    onTapLine: () => void;
    /** Next (or Done, on a replay's last beat); absent on the invitation, which ends on Start focus. */
    next: { label: string; onPress: () => void } | null;
    /** Skip tour, or Not now on the invitation (T-3). */
    exit: { label: string; onPress: () => void };
    muted: boolean;
    onMute: () => void;
    /** The tail's x, under the speaker; null for the AX panel, which has none. */
    tailX: number | null;
    /** The AX panel (T-2): the badge beside the name, the line scrolling, the actions pinned. */
    panel: { maxLineHeight: number; badge: ReactNode } | null;
    lineRef?: Ref<ComponentRef<typeof View>>;
    onLayout?: (e: LayoutChangeEvent) => void;
};

/**
 * The speaker's bubble (the direction contract's OWN-WORLD): a `paper` field, radius 22, the crisp
 * `edge` stroke and no shadow (only stickers lift), the line in the system face at body size, and
 * a tail to whoever is speaking.
 *
 * - The line writes on: the rest of it is laid out but clear, so the bubble never grows as it
 *   writes, and Turkish's longer lines wrap from the first frame.
 * - VoiceOver (T-1): the line is one element, "Pomo: …", then Next, then Skip tour, then the mute.
 *   The tree runs in that order; the row draws them mute, Skip tour, then Next on the right.
 * - The text is never capped (T-2): at AX sizes the layer gives it the bottom panel instead.
 */
export function Bubble({ tokens, name, speaker, reduced, chars, shown, onTapLine, next, exit, muted, onMute, tailX, panel, lineRef, onLayout }: Props) {
    const line = chars.join('');
    const text = (
        <Text style={[styles.line, { color: tokens.ink }]}>
            {chars.slice(0, shown).join('')}
            <Text style={styles.clear}>{chars.slice(shown).join('')}</Text>
        </Text>
    );
    return (
        <View style={[styles.bubble, panel && styles.panel, { backgroundColor: tokens.paper, borderColor: tokens.edge }]} onLayout={onLayout}>
            <Pressable
                ref={lineRef}
                onPress={onTapLine}
                accessible
                accessibilityRole="text"
                accessibilityLabel={t('tour.says', { name, line })}
                style={styles.lineBlock}
            >
                <View style={styles.nameRow}>
                    {panel?.badge}
                    <Text style={[styles.name, { color: speaker === 'doro' ? tokens.successInk : tokens.primaryInk }]}>{name}</Text>
                </View>
                {panel ? (
                    <ScrollView style={{ maxHeight: panel.maxLineHeight }} showsVerticalScrollIndicator>
                        {text}
                    </ScrollView>
                ) : (
                    text
                )}
            </Pressable>
            <View style={styles.actions}>
                {next && (
                    <PressableScale onPress={next.onPress} style={[styles.next, { backgroundColor: tokens.primarySoft }]} testID="tour-next">
                        <Text style={[styles.nextLabel, { color: tokens.primaryInk }]}>{next.label}</Text>
                    </PressableScale>
                )}
                <View style={styles.spacer} />
                <View style={styles.quiet}>
                    <PressableScale onPress={exit.onPress} style={styles.exit} testID="tour-exit">
                        <Text style={[styles.exitLabel, { color: tokens.ink }]}>{exit.label}</Text>
                    </PressableScale>
                    <PressableScale
                        onPress={onMute}
                        accessibilityLabel={t(muted ? 'tour.unmute' : 'tour.mute')}
                        style={styles.mute}
                        testID="tour-mute"
                    >
                        <Icon glyph={muted ? soundOff : sound} size={22} color={tokens.inkSoft} />
                    </PressableScale>
                </View>
            </View>
            {tailX !== null && <Tail x={tailX} reduced={reduced} tokens={tokens} />}
        </View>
    );
}

const TAIL = 16;
const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);

/** The tail, under the speaker: it glides with the dock on the sheet curve when the turn passes (review M-10). */
function Tail({ x, reduced, tokens }: { x: number; reduced: boolean; tokens: ThemeTokens }) {
    const tx = useSharedValue(x);
    const first = useRef(true);
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        tx.set(reduced ? x : withTiming(x, { duration: 420, easing: EASE_SHEET }));
        // Reduce Motion is read when the speaker changes; turning it on mid-glide changes nothing.
    }, [x, tx]); // eslint-disable-line react-hooks/exhaustive-deps
    const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.get() - TAIL / 2 }, { rotate: '45deg' }] }));
    return <Animated.View pointerEvents="none" style={[styles.tail, { backgroundColor: tokens.paper, borderColor: tokens.edge }, style]} />;
}

const styles = StyleSheet.create({
    bubble: {
        borderRadius: radius.l,
        borderWidth: edgeWidth,
        paddingHorizontal: space.l,
        paddingTop: space.m,
        paddingBottom: space.s,
        gap: space.xs,
    },
    panel: { paddingTop: space.l },
    lineBlock: { gap: space.xs },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
    name: { fontSize: 13, fontWeight: '600' },
    line: { fontSize: 17, lineHeight: 23 },
    clear: { color: 'transparent' },
    // The tree runs Next, Skip tour, mute (VoiceOver's order); row-reverse draws them the other way round.
    actions: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', minHeight: minTarget },
    spacer: { flex: 1 },
    // 16 pt between Skip tour and the mute: their 8 pt slops meet, never overlap (review H-5).
    quiet: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.l },
    next: {
        minHeight: minTarget,
        borderRadius: radius.pill,
        paddingHorizontal: space.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextLabel: { fontSize: 16, fontWeight: '600' },
    exit: { minHeight: minTarget, justifyContent: 'center', paddingHorizontal: space.s },
    exitLabel: { fontSize: 15, fontWeight: '600' },
    mute: { width: minTarget, height: minTarget, alignItems: 'center', justifyContent: 'center' },
    // A paper square turned 45°, its two outer sides edged: it covers the bubble's edge where it joins.
    tail: {
        position: 'absolute',
        left: 0,
        bottom: -TAIL / 2 - 1,
        width: TAIL,
        height: TAIL,
        borderRightWidth: edgeWidth,
        borderBottomWidth: edgeWidth,
    },
});
