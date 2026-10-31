import Svg, { Defs, FeGaussianBlur, Filter, G, Path } from 'react-native-svg';

/** A sticker or a version of the mark, generated into `./art/` by scripts/art/build-icon-components.mjs. */
export type StickerArt = {
    viewBox: string;
    paths: readonly { d: string; fill: string; evenOdd?: true; opacity?: number }[];
};

type StickerProps = {
    art: StickerArt;
    /** The drawn width in points; the height follows the art's own proportions. */
    width: number;
    /** Spoken by VoiceOver. Without one the sticker is decoration and hidden from it. */
    accessibilityLabel?: string;
    /**
     * The theme's `stickerShadow` (`#RRGGBBAA`), to lift the sticker off the page (DESIGN.md, "Only
     * Stickers Lift"). Without one the sticker lies flat, as the welcome's layered art does.
     */
    shadow?: string;
};

// The lift, in points: 1 right, 2 down, and a 3 pt blur, the C4 sketches' `1px 2px 3px` (finish
// review fix 3). The blur is the Gaussian's standard deviation, half of CSS's blur radius.
const LIFT = { dx: 1, dy: 2, deviation: 1.5 } as const;
// Room around the art for the shadow, as a share of the width on each side. The Svg grows by it
// and gives it back in negative margins, so the sticker's layout box doesn't change.
const LIFT_ROOM = 0.12;

/** `#RRGGBBAA` as an opaque colour and an opacity; any other colour is opaque. */
function splitAlpha(colour: string): { colour: string; opacity: number } {
    const m = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(colour);
    return m ? { colour: `#${m[1]}`, opacity: parseInt(m[2], 16) / 255 } : { colour, opacity: 1 };
}

/**
 * Pomo & Doro's poses and the Same Page mark (ADR-0047), in their own colours. Stickers keep
 * their fills in both themes: the die-cut white edge is what makes a sticker read on any page.
 *
 * The shadow is drawn inside the Svg (the art's silhouette, offset and blurred), not as a view
 * shadow: iOS renders a shadow on a view with no background offscreen, for every sticker, while
 * the ring repaints each frame during focus. The silhouette's paths are opaque inside a group that
 * carries the token's alpha, so overlapping paths don't darken where they cross.
 */
export function Sticker({ art, width, accessibilityLabel, shadow }: StickerProps) {
    const [x, y, w, h] = art.viewBox.split(/\s+/).map(Number);
    const height = (width * h) / w;
    const labelled = !!accessibilityLabel;
    const a11y = {
        accessible: labelled,
        accessibilityRole: labelled ? ('image' as const) : undefined,
        accessibilityLabel,
        accessibilityElementsHidden: !labelled,
        importantForAccessibility: labelled ? ('yes' as const) : ('no-hide-descendants' as const),
    };
    const paths = art.paths.map((p, i) => (
        <Path key={i} d={p.d} fill={p.fill} fillRule={p.evenOdd ? 'evenodd' : 'nonzero'} opacity={p.opacity} />
    ));

    if (!shadow) {
        return (
            <Svg width={width} height={height} viewBox={art.viewBox} {...a11y}>
                {paths}
            </Svg>
        );
    }

    const unit = w / width; // viewBox units per point
    const room = width * LIFT_ROOM;
    const lift = splitAlpha(shadow);
    return (
        <Svg
            width={width + room * 2}
            height={height + room * 2}
            viewBox={`${x - room * unit} ${y - room * unit} ${w + room * 2 * unit} ${h + room * 2 * unit}`}
            style={{ margin: -room }}
            {...a11y}
        >
            <Defs>
                <Filter id="lift" x="-20%" y="-20%" width="140%" height="140%">
                    <FeGaussianBlur stdDeviation={LIFT.deviation * unit} />
                </Filter>
            </Defs>
            <G opacity={lift.opacity} filter="url(#lift)" transform={`translate(${LIFT.dx * unit} ${LIFT.dy * unit})`}>
                {art.paths.map((p, i) => (
                    <Path key={i} d={p.d} fill={lift.colour} fillRule={p.evenOdd ? 'evenodd' : 'nonzero'} />
                ))}
            </G>
            {paths}
        </Svg>
    );
}
