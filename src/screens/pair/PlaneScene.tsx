import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Sticker } from '../../components/stickers/Sticker';
import { doroIdle } from '../../components/stickers/art/doroIdle';
import { pomoIdle } from '../../components/stickers/art/pomoIdle';
import type { ThemeTokens } from '../../theme/palette';
import { planeArt, PLANE_ARTBOARD } from './planeArt';

/** Under this, the scene would be too small to read, so the space stays empty. */
export const MIN_SCENE_HEIGHT = 120;
/** So it doesn't grow without limit on an iPad's sheet. */
const MAX_SCALE = 1.3;
/** Pomo and Doro at the artboard's own scale: their width, and their centres in it. */
const MASCOT = { width: 88, pomo: { x: 62, y: 226 }, doro: { x: 299, y: 226 } } as const;
const EDGE = 1.5;

/** How large the artboard can be drawn in a space, keeping its shape. Pure. */
export function planeScale(width: number, height: number): number {
    return Math.min(width / PLANE_ARTBOARD.w, height / PLANE_ARTBOARD.h, MAX_SCALE);
}

/**
 * The pairing sheet's middle: a paper plane on a dotted route from Pomo to Doro (the owner's direction, 2026-11-07).
 * It fills whatever height it's given and sits at the bottom of it, just above the buttons. Decoration, hidden from
 * VoiceOver: the steps' words carry the meaning. Pomo and Doro lift, as stickers do, and the rest lies flat in the
 * theme's tokens.
 *
 *   in : `tokens`. It measures its own space, which only a flex slot in the parent can give it.
 *   out: nothing until it has measured, and nothing under `MIN_SCENE_HEIGHT`.
 */
export function PlaneScene({ tokens }: { tokens: ThemeTokens }) {
    const [space, setSpace] = useState<{ width: number; height: number } | null>(null);
    const onLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setSpace((was) => (was?.width === width && was?.height === height ? was : { width, height }));
    };
    const scale = space ? planeScale(space.width, space.height) : 0;
    const shows = space !== null && space.height >= MIN_SCENE_HEIGHT;
    const mascot = (x: number, y: number) => ({
        left: (x - MASCOT.width / 2) * scale,
        top: (y - MASCOT.width / 2) * scale,
    });
    return (
        <View
            testID="pair-scene"
            style={styles.slot}
            onLayout={onLayout}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
        >
            {shows && (
                <View testID="pair-scene-art" style={{ width: PLANE_ARTBOARD.w * scale, height: PLANE_ARTBOARD.h * scale }}>
                    <Svg width="100%" height="100%" viewBox={`0 0 ${PLANE_ARTBOARD.w} ${PLANE_ARTBOARD.h}`}>
                        <Path d={planeArt.route} fill={tokens.edgeStrong} />
                        <Path d={planeArt.heartBig} fill={tokens.accent} />
                        <Path d={planeArt.heartSmall} fill={tokens.primary} />
                        <Path d={planeArt.planeLow} fill={tokens.primarySoft} stroke={tokens.edgeStrong} strokeWidth={EDGE} strokeLinejoin="round" />
                        <Path d={planeArt.planeTop} fill={tokens.paper} stroke={tokens.edgeStrong} strokeWidth={EDGE} strokeLinejoin="round" />
                    </Svg>
                    <View style={[styles.mascot, mascot(MASCOT.pomo.x, MASCOT.pomo.y)]}>
                        <Sticker art={pomoIdle} width={MASCOT.width * scale} shadow={tokens.stickerShadow} />
                    </View>
                    <View style={[styles.mascot, mascot(MASCOT.doro.x, MASCOT.doro.y)]}>
                        <Sticker art={doroIdle} width={MASCOT.width * scale} shadow={tokens.stickerShadow} />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    slot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    mascot: { position: 'absolute' },
});
