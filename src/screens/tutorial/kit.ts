import type { StickerArt } from '../../components/stickers/Sticker';
import { doroTourBodyCut } from '../../components/stickers/art/doroTourBodyCut';
import { doroTourBodyFill } from '../../components/stickers/art/doroTourBodyFill';
import { doroTourEyesBlink } from '../../components/stickers/art/doroTourEyesBlink';
import { doroTourEyesLookLeft } from '../../components/stickers/art/doroTourEyesLookLeft';
import { doroTourEyesLookRight } from '../../components/stickers/art/doroTourEyesLookRight';
import { doroTourEyesOpen } from '../../components/stickers/art/doroTourEyesOpen';
import { doroTourEyesProud } from '../../components/stickers/art/doroTourEyesProud';
import { doroTourEyesSmile } from '../../components/stickers/art/doroTourEyesSmile';
import { doroTourEyesSparkle } from '../../components/stickers/art/doroTourEyesSparkle';
import { doroTourEyesWide } from '../../components/stickers/art/doroTourEyesWide';
import { doroTourEyesWink } from '../../components/stickers/art/doroTourEyesWink';
import { doroTourHandPointLeft } from '../../components/stickers/art/doroTourHandPointLeft';
import { doroTourHandPointRight } from '../../components/stickers/art/doroTourHandPointRight';
import { doroTourHandWaveLeft } from '../../components/stickers/art/doroTourHandWaveLeft';
import { doroTourHandWaveRight } from '../../components/stickers/art/doroTourHandWaveRight';
import { doroTourMouthGrin } from '../../components/stickers/art/doroTourMouthGrin';
import { doroTourMouthProud } from '../../components/stickers/art/doroTourMouthProud';
import { doroTourMouthSmile } from '../../components/stickers/art/doroTourMouthSmile';
import { doroTourMouthTalkRound } from '../../components/stickers/art/doroTourMouthTalkRound';
import { doroTourMouthTalkSmall } from '../../components/stickers/art/doroTourMouthTalkSmall';
import { doroTourMouthTalkWide } from '../../components/stickers/art/doroTourMouthTalkWide';
import { doroTourMouthWow } from '../../components/stickers/art/doroTourMouthWow';
import { pomoTourBodyCut } from '../../components/stickers/art/pomoTourBodyCut';
import { pomoTourBodyFill } from '../../components/stickers/art/pomoTourBodyFill';
import { pomoTourEyesBlink } from '../../components/stickers/art/pomoTourEyesBlink';
import { pomoTourEyesLookLeft } from '../../components/stickers/art/pomoTourEyesLookLeft';
import { pomoTourEyesLookRight } from '../../components/stickers/art/pomoTourEyesLookRight';
import { pomoTourEyesOpen } from '../../components/stickers/art/pomoTourEyesOpen';
import { pomoTourEyesProud } from '../../components/stickers/art/pomoTourEyesProud';
import { pomoTourEyesSmile } from '../../components/stickers/art/pomoTourEyesSmile';
import { pomoTourEyesSparkle } from '../../components/stickers/art/pomoTourEyesSparkle';
import { pomoTourEyesWide } from '../../components/stickers/art/pomoTourEyesWide';
import { pomoTourEyesWink } from '../../components/stickers/art/pomoTourEyesWink';
import { pomoTourHandPointLeft } from '../../components/stickers/art/pomoTourHandPointLeft';
import { pomoTourHandPointRight } from '../../components/stickers/art/pomoTourHandPointRight';
import { pomoTourHandWaveLeft } from '../../components/stickers/art/pomoTourHandWaveLeft';
import { pomoTourHandWaveRight } from '../../components/stickers/art/pomoTourHandWaveRight';
import { pomoTourMouthGrin } from '../../components/stickers/art/pomoTourMouthGrin';
import { pomoTourMouthProud } from '../../components/stickers/art/pomoTourMouthProud';
import { pomoTourMouthSmile } from '../../components/stickers/art/pomoTourMouthSmile';
import { pomoTourMouthTalkRound } from '../../components/stickers/art/pomoTourMouthTalkRound';
import { pomoTourMouthTalkSmall } from '../../components/stickers/art/pomoTourMouthTalkSmall';
import { pomoTourMouthTalkWide } from '../../components/stickers/art/pomoTourMouthTalkWide';
import { pomoTourMouthWow } from '../../components/stickers/art/pomoTourMouthWow';
import type { Face, Speaker } from './tutorials';

/**
 * The tour kit (Phase 1 D5; assets record §3.2): each character as layers on the shipped 512
 * artboard, stacked body-cut (it carries the lift), hand, body-fill, eyes, mouth. The recipes are
 * `art/src/tour/expressions.json`'s, checked against it by the tests.
 */

export type Eyes = 'open' | 'blink' | 'smile' | 'sparkle' | 'wide' | 'wink' | 'proud' | 'look-left' | 'look-right';
export type Mouth = 'smile' | 'talk-small' | 'talk-wide' | 'talk-round' | 'grin' | 'wow' | 'proud';
export type Hand = 'wave-left' | 'wave-right' | 'point-left' | 'point-right';
/** A beat's face, or the listener's one still pose: watching the opening. */
export type Pose = Face | 'listen';
export type Side = 'left' | 'right';

type Kit = { bodyCut: StickerArt; bodyFill: StickerArt; eyes: Record<Eyes, StickerArt>; mouth: Record<Mouth, StickerArt>; hand: Record<Hand, StickerArt> };

export const KIT: Record<Speaker, Kit> = {
    pomo: {
        bodyCut: pomoTourBodyCut,
        bodyFill: pomoTourBodyFill,
        eyes: {
            open: pomoTourEyesOpen, blink: pomoTourEyesBlink, smile: pomoTourEyesSmile, sparkle: pomoTourEyesSparkle, wide: pomoTourEyesWide,
            wink: pomoTourEyesWink, proud: pomoTourEyesProud, 'look-left': pomoTourEyesLookLeft, 'look-right': pomoTourEyesLookRight,
        },
        mouth: {
            smile: pomoTourMouthSmile, 'talk-small': pomoTourMouthTalkSmall, 'talk-wide': pomoTourMouthTalkWide, 'talk-round': pomoTourMouthTalkRound,
            grin: pomoTourMouthGrin, wow: pomoTourMouthWow, proud: pomoTourMouthProud,
        },
        hand: { 'wave-left': pomoTourHandWaveLeft, 'wave-right': pomoTourHandWaveRight, 'point-left': pomoTourHandPointLeft, 'point-right': pomoTourHandPointRight },
    },
    doro: {
        bodyCut: doroTourBodyCut,
        bodyFill: doroTourBodyFill,
        eyes: {
            open: doroTourEyesOpen, blink: doroTourEyesBlink, smile: doroTourEyesSmile, sparkle: doroTourEyesSparkle, wide: doroTourEyesWide,
            wink: doroTourEyesWink, proud: doroTourEyesProud, 'look-left': doroTourEyesLookLeft, 'look-right': doroTourEyesLookRight,
        },
        mouth: {
            smile: doroTourMouthSmile, 'talk-small': doroTourMouthTalkSmall, 'talk-wide': doroTourMouthTalkWide, 'talk-round': doroTourMouthTalkRound,
            grin: doroTourMouthGrin, wow: doroTourMouthWow, proud: doroTourMouthProud,
        },
        hand: { 'wave-left': doroTourHandWaveLeft, 'wave-right': doroTourHandWaveRight, 'point-left': doroTourHandPointLeft, 'point-right': doroTourHandPointRight },
    },
};

/** The talking mouths, in the order a syllable's index picks them (1, 2, 3; 0 is the face's own). */
export const TALK: readonly Mouth[] = ['talk-small', 'talk-wide', 'talk-round'];

export type Recipe = {
    eyes: Eyes;
    mouth: Mouth;
    /** Only open-eyed faces blink. */
    blinks: boolean;
    hand?: Hand;
    /** A held tilt (degrees) and stretch (height scale). */
    rotate: number;
    sy: number;
};

/**
 * A pose's layers. `look` is the side the character faces: where its listening eyes and pointing
 * hand go. `outer` is its side of the pair, where the wave goes (Doro stands left, Pomo right).
 */
export function recipe(pose: Pose, look: Side, outer: Side): Recipe {
    const plain = { rotate: 0, sy: 1 };
    switch (pose) {
        case 'listen':
            return { eyes: look === 'left' ? 'look-left' : 'look-right', mouth: 'smile', blinks: true, ...plain };
        case 'happy':
            return { eyes: 'smile', mouth: 'grin', blinks: false, ...plain };
        case 'excited':
            return { eyes: 'sparkle', mouth: 'grin', blinks: true, rotate: 0, sy: 1.02 };
        case 'curious':
            return { eyes: 'open', mouth: 'talk-round', blinks: true, rotate: -9, sy: 1 };
        case 'proud':
            return { eyes: 'proud', mouth: 'proud', blinks: false, rotate: 3, sy: 1.03 };
        case 'wink':
            return { eyes: 'wink', mouth: 'grin', blinks: false, ...plain };
        case 'wave':
            return { eyes: 'smile', mouth: 'grin', blinks: false, hand: outer === 'left' ? 'wave-left' : 'wave-right', ...plain };
        case 'point':
            return { eyes: look === 'left' ? 'look-left' : 'look-right', mouth: 'smile', blinks: true, hand: look === 'left' ? 'point-left' : 'point-right', ...plain };
    }
}

/** Each hand's pivot (its root, hidden under the body's fill) and unit axis, in artboard units. */
export const HANDS: Record<Speaker, Record<Hand, { pivot: readonly [number, number]; axis: readonly [number, number] }>> = {
    pomo: {
        'wave-left': { pivot: [152, 222], axis: [-0.5127, -0.8585] },
        'wave-right': { pivot: [360, 222], axis: [0.5127, -0.8585] },
        'point-left': { pivot: [137, 299], axis: [-0.9513, 0.3082] },
        'point-right': { pivot: [375, 299], axis: [0.9513, 0.3082] },
    },
    doro: {
        'wave-left': { pivot: [160, 248], axis: [-0.6905, -0.7234] },
        'wave-right': { pivot: [352, 248], axis: [0.6905, -0.7234] },
        'point-left': { pivot: [140, 300], axis: [-0.9806, 0.1961] },
        'point-right': { pivot: [372, 300], axis: [0.9806, 0.1961] },
    },
};
