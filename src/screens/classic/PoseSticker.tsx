import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Sticker, type StickerArt } from '../../components/stickers/Sticker';
import { doroBreak } from '../../components/stickers/art/doroBreak';
import { doroFocusing } from '../../components/stickers/art/doroFocusing';
import { doroIdle } from '../../components/stickers/art/doroIdle';
import { pomoBreak } from '../../components/stickers/art/pomoBreak';
import { pomoFocusing } from '../../components/stickers/art/pomoFocusing';
import { pomoIdle } from '../../components/stickers/art/pomoIdle';

export type Pose = 'idle' | 'focusing' | 'break';

const ART: Record<'pomo' | 'doro', Record<Pose, StickerArt>> = {
    pomo: { idle: pomoIdle, focusing: pomoFocusing, break: pomoBreak },
    doro: { idle: doroIdle, focusing: doroFocusing, break: doroBreak },
};

// The phase change is a pose change, not a bounce (DESIGN.md): the new pose fades in over the
// old one in 250 ms on the UI thread. Built once, outside render (the Reanimated docs' advice).
const POSE_IN = FadeIn.duration(250);
const POSE_OUT = FadeOut.duration(250);

/**
 * Pomo or Doro in the pose for the moment (ADR-0047). A pose change keys a new sticker, so
 * the old one fades out under the new one with no React render per frame. Opacity only, so it
 * stays the same under Reduce Motion. Decoration: the line beside it carries the meaning.
 */
export function PoseSticker({ who, pose, width }: { who: 'pomo' | 'doro'; pose: Pose; width: number }) {
    return (
        <View style={{ width, height: width }}>
            <Animated.View key={pose} entering={POSE_IN} exiting={POSE_OUT} style={StyleSheet.absoluteFill}>
                <Sticker art={ART[who][pose]} width={width} />
            </Animated.View>
        </View>
    );
}

/** The pose for the session's state: focusing or on a break while one runs, idle otherwise. */
export function poseFor(phase: 'focus' | 'shortBreak' | 'longBreak', isRunning: boolean): Pose {
    if (!isRunning) return 'idle';
    return phase === 'focus' ? 'focusing' : 'break';
}
