import type { Speaker } from './tutorials';

/**
 * Where the pair, the bubble and the ribbon go for a beat (Phase 1 D5; the direction contract's
 * FIRST VIEWPORT, D5 record §3.7). Pure: the layer measures, this decides, the tests audit it.
 *
 * The dock is the bubble over the pair. It takes whichever side of the opening fits it best:
 * above or below on a phone in portrait, also left or right in landscape and on iPad ("the pair
 * and the bubble take the side away from the control"). It never covers the opening; when room is
 * short the pair shrink, never under half size. On a tab step the whole page dims, the ribbon
 * drapes to just above the tab, and the dock stands on the side of the tab with more room.
 *
 * From the AX switch (font scale 1.6) the bubble is a bottom panel instead (T-2): the pair become
 * a badge inside it and the ribbon a short tab over the opening.
 *
 * Coordinates are points in the layer, which fills the tab screen; y grows downwards.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Insets = { top: number; bottom: number; left: number; right: number };
export type Point = { x: number; y: number };

/** The ribbon's curve: it hangs from A, beyond the top edge, as a cubic through C1 and C2 to its tip P. */
export type RibbonCurve = { ax: number; ay: number; c1x: number; c1y: number; c2x: number; c2y: number; px: number; py: number };

export type Placement = {
    side: 'above' | 'below' | 'left' | 'right' | 'tab' | 'panel';
    /** The pair's scale: the speaker's box is 190 × scale points. */
    scale: number;
    /** The bubble's top-left and width (its height is the measured one). */
    bubble: { x: number; y: number; w: number };
    /** Each character's feet, the transform origin. */
    feet: Record<Speaker, Point>;
    /** The tail's x inside the bubble, under the speaker. */
    tailX: number;
    ribbon: RibbonCurve | null;
    /**
     * The dock can't fit even at half size (a small phone, a long line): the layer switches to the
     * bottom panel (review H-1).
     */
    overflow: boolean;
};

export const SPEAK = 190;
export const LISTEN = 140;
/** The two boxes overlap by this much: their art leaves about 12 % of the box clear on each side. */
const OVERLAP = 36;
/** The visible character above its feet, as a share of its box (Pomo's curl reaches y 35 of 512). */
export const HEAD = 0.87;
const GAP = 10;
const MARGIN = 16;
export const BUBBLE_MAX = 360;
const MIN_SCALE = 0.5;
/** The ribbon hangs from beyond the top edge, this far in from the right. */
const RIBBON_INSET = 30;
const RIBBON_TOP = -12;
/** Openings this close to the top get a ribbon hanging straight onto them. */
const TOP_BAND = 70;
/** A tab step's dock keeps this far from the tab's centre, clear of the ribbon's tip. */
const TAB_CLEAR = 22;
const PANEL_MARGIN = 12;

export type PlaceInput = {
    W: number;
    H: number;
    insets: Insets;
    /** The lit opening (already padded), or null on a tab step. */
    opening: Rect | null;
    /** On a tab step: the tab's centre x and whether the bar is at the bottom. */
    tab: { x: number; atBottom: boolean } | null;
    speaker: Speaker;
    /** The bubble's measured height (an estimate until it lays out). */
    bubbleH: number;
    /** Landscape or iPad: the sides are candidates too. */
    wide: boolean;
    /** The AX bottom panel, with its measured height. */
    panel: { h: number } | null;
};

/** A compact height (an iPhone in landscape, as Classic's): there the AX panel takes a side, not the bottom. */
export const COMPACT_HEIGHT = 500;

/** The AX panel's own room: the bottom in portrait; in a compact height, the half away from the opening. */
export function panelFrame(W: number, H: number, insets: Insets, opening: Rect | null): { x: number; w: number; maxHeight: number; side: boolean } {
    const room = H - insets.top - insets.bottom - 2 * PANEL_MARGIN;
    if (H >= COMPACT_HEIGHT) {
        return { x: insets.left + PANEL_MARGIN, w: W - insets.left - insets.right - 2 * PANEL_MARGIN, maxHeight: room, side: false };
    }
    const half = (W - insets.left - insets.right) / 2 - PANEL_MARGIN * 1.5;
    const onLeft = opening ? opening.x + opening.w / 2 > W / 2 : true;
    return { x: onLeft ? insets.left + PANEL_MARGIN : W / 2 + PANEL_MARGIN / 2, w: half, maxHeight: room, side: true };
}

const clamp = (v: number, lo: number, hi: number) => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

/** The pair's width at a scale: the speaker's 190 box and the listener's 140 box, overlapping. */
export function pairWidth(scale: number): number {
    return (SPEAK + LISTEN - OVERLAP) * scale;
}

/** The feet of both, with the pair's left edge at `left`: Doro on the left, Pomo on the right. */
function feetFor(left: number, feetY: number, scale: number, speaker: Speaker): Record<Speaker, Point> {
    const wD = (speaker === 'doro' ? SPEAK : LISTEN) * scale;
    const wP = (speaker === 'pomo' ? SPEAK : LISTEN) * scale;
    return {
        doro: { x: left + wD / 2, y: feetY },
        pomo: { x: left + wD - OVERLAP * scale + wP / 2, y: feetY },
    };
}

function tail(bubbleX: number, bubbleW: number, feet: Record<Speaker, Point>, speaker: Speaker): number {
    return clamp(feet[speaker].x - bubbleX, 28, bubbleW - 28);
}

/** The ribbon onto an in-screen opening: a drape from the top-right edge, or a short drop onto one near the top. */
export function ribbonToOpening(W: number, insets: Insets, r: Rect): RibbonCurve {
    if (r.y - insets.top < TOP_BAND) {
        const px = r.x + r.w / 2;
        const py = r.y - 4;
        return { ax: px, ay: RIBBON_TOP, c1x: px, c1y: RIBBON_TOP + (py - RIBBON_TOP) / 3, c2x: px, c2y: RIBBON_TOP + (2 * (py - RIBBON_TOP)) / 3, px, py };
    }
    const ax = W - insets.right - RIBBON_INSET;
    const px = clamp(r.x + r.w - 28, r.x + 16, Math.min(r.x + r.w - 16, W - insets.right - 20));
    const py = r.y - 6;
    const dy = py - RIBBON_TOP;
    return { ax, ay: RIBBON_TOP, c1x: ax, c1y: RIBBON_TOP + 0.45 * dy, c2x: px, c2y: py - 0.4 * dy, px, py };
}

/** The ribbon onto a tab: around the clock to just above a bottom bar, or a short tab under a top one. */
export function ribbonToTab(W: number, H: number, insets: Insets, tab: { x: number; atBottom: boolean }): RibbonCurve {
    if (!tab.atBottom) {
        const ay = insets.top - 6;
        const py = insets.top + 30;
        return { ax: tab.x, ay, c1x: tab.x, c1y: ay + (py - ay) / 3, c2x: tab.x, c2y: ay + (2 * (py - ay)) / 3, px: tab.x, py };
    }
    const ax = W - insets.right - RIBBON_INSET;
    const py = H - insets.bottom - 4;
    const dy = py - RIBBON_TOP;
    return { ax, ay: RIBBON_TOP, c1x: ax + 8, c1y: RIBBON_TOP + 0.5 * dy, c2x: tab.x, c2y: py - 0.3 * dy, px: tab.x, py };
}

/** A tab's centre: an even share of the bar (the bar's own layout; checked on device, D5 record §3.7). */
export function tabCentre(W: number, insets: Insets, index: number, count: number, atBottom: boolean): number {
    if (atBottom) {
        // iOS 26's floating bar keeps about 20 pt clear of each edge.
        const left = insets.left + 20;
        const width = W - insets.left - insets.right - 40;
        return left + (width * (index + 0.5)) / count;
    }
    // iPadOS's top bar is a compact, centred row of about 96 pt per tab.
    const item = 96;
    return W / 2 + (index - (count - 1) / 2) * item;
}

export function place(p: PlaceInput): Placement {
    const { W, H, insets, opening, tab, speaker, bubbleH, wide, panel } = p;
    const innerW = W - insets.left - insets.right - 2 * MARGIN;
    const head = HEAD * SPEAK;

    if (panel) {
        // At the bottom in portrait; beside the opening in landscape, never taller than the screen (break-ui #3).
        const frame = panelFrame(W, H, insets, opening);
        const w = frame.w;
        const x = frame.x;
        const y = Math.max(insets.top + PANEL_MARGIN, H - insets.bottom - PANEL_MARGIN - Math.min(panel.h, frame.maxHeight));
        let ribbon: RibbonCurve | null = null;
        if (opening) {
            const px = clamp(opening.x + opening.w - 28, opening.x + 16, opening.x + opening.w - 16);
            const py = opening.y - 6;
            const ay = Math.max(insets.top - 12, py - 56);
            ribbon = { ax: px, ay, c1x: px, c1y: ay + (py - ay) / 3, c2x: px, c2y: ay + (2 * (py - ay)) / 3, px, py };
        }
        const none = { x: 0, y: 0 };
        return { side: 'panel', scale: 0, bubble: { x, y, w }, feet: { pomo: none, doro: none }, tailX: 0, ribbon, overflow: false };
    }

    if (!opening && tab) {
        const leftRoom = tab.x - insets.left - MARGIN - TAB_CLEAR;
        const rightRoom = W - insets.right - MARGIN - TAB_CLEAR - tab.x;
        const onRight = rightRoom >= leftRoom;
        const room = onRight ? rightRoom : leftRoom;
        const vertical = H - insets.top - insets.bottom - 2 * MARGIN - GAP - bubbleH - (tab.atBottom ? 0 : 40);
        const fit = Math.min(room / pairWidth(1), vertical / head);
        const scale = clamp(Math.min(1, fit), MIN_SCALE, 1);
        const pw = pairWidth(scale);
        const left = onRight ? tab.x + TAB_CLEAR : tab.x - TAB_CLEAR - pw;
        const bubbleW = Math.min(BUBBLE_MAX, innerW);
        let feetY: number;
        let bubbleY: number;
        if (tab.atBottom) {
            feetY = H - insets.bottom - GAP;
            bubbleY = Math.max(insets.top + 8, feetY - head * scale - GAP - bubbleH);
        } else {
            bubbleY = insets.top + 40;
            feetY = bubbleY + bubbleH + GAP + head * scale;
        }
        const bubbleX = clamp(left + pw / 2 - bubbleW / 2, insets.left + MARGIN, W - insets.right - MARGIN - bubbleW);
        const feet = feetFor(left, feetY, scale, speaker);
        return {
            side: 'tab',
            scale,
            bubble: { x: bubbleX, y: bubbleY, w: bubbleW },
            feet,
            tailX: tail(bubbleX, bubbleW, feet, speaker),
            ribbon: ribbonToTab(W, H, insets, tab),
            overflow: fit < MIN_SCALE,
        };
    }

    const r = opening ?? { x: W / 2, y: H / 2, w: 0, h: 0 };
    type Option = { side: Placement['side']; fit: number; bubbleW: number };
    const portraitW = Math.min(BUBBLE_MAX, innerW);
    const options: Option[] = [
        { side: 'above', bubbleW: portraitW, fit: Math.min((r.y - 2 * GAP - bubbleH - insets.top - 8) / head, innerW / pairWidth(1)) },
        { side: 'below', bubbleW: portraitW, fit: Math.min((H - insets.bottom - 8 - r.y - r.h - 2 * GAP - bubbleH) / head, innerW / pairWidth(1)) },
    ];
    if (wide) {
        const vertical = (H - insets.top - insets.bottom - 16 - GAP - bubbleH) / head;
        const rightW = W - insets.right - MARGIN - GAP - (r.x + r.w);
        const leftW = r.x - insets.left - MARGIN - GAP;
        options.push({ side: 'right', bubbleW: Math.min(BUBBLE_MAX, rightW), fit: Math.min(rightW / pairWidth(1), vertical) });
        options.push({ side: 'left', bubbleW: Math.min(BUBBLE_MAX, leftW), fit: Math.min(leftW / pairWidth(1), vertical) });
    }
    // The best fit wins; a full-size fit on either side is a tie, settled by the order above.
    const best = options.reduce((a, b) => (Math.min(1, b.fit) > Math.min(1, a.fit) + 1e-6 ? b : a));
    const scale = clamp(best.fit, MIN_SCALE, 1);
    const pw = pairWidth(scale);
    const bubbleW = Math.max(160, best.bubbleW);
    const dockW = Math.max(bubbleW, pw);

    let dockX: number;
    let bubbleY: number;
    let feetY: number;
    if (best.side === 'above' || best.side === 'below') {
        dockX = clamp(r.x + r.w / 2 - dockW / 2, insets.left + MARGIN, W - insets.right - MARGIN - dockW);
        if (best.side === 'above') {
            feetY = r.y - GAP;
            // Never above the safe area; past half size the panel takes over (`overflow`).
            bubbleY = Math.max(insets.top + 8, feetY - head * scale - GAP - bubbleH);
        } else {
            bubbleY = r.y + r.h + GAP;
            feetY = bubbleY + bubbleH + GAP + head * scale;
        }
    } else {
        dockX = best.side === 'right' ? r.x + r.w + GAP : r.x - GAP - dockW;
        const blockH = bubbleH + GAP + head * scale;
        bubbleY = clamp(r.y + r.h / 2 - blockH / 2, insets.top + 8, H - insets.bottom - 8 - blockH);
        feetY = bubbleY + bubbleH + GAP + head * scale;
    }
    const bubbleX = dockX + (dockW - bubbleW) / 2;
    const feet = feetFor(dockX + (dockW - pw) / 2, feetY, scale, speaker);
    return {
        side: best.side,
        scale,
        bubble: { x: bubbleX, y: bubbleY, w: bubbleW },
        feet,
        tailX: tail(bubbleX, bubbleW, feet, speaker),
        ribbon: opening ? ribbonToOpening(W, insets, r) : null,
        overflow: best.fit < MIN_SCALE,
    };
}
