import Svg, { Path } from 'react-native-svg';

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
};

/**
 * Pomo & Doro's poses and the Same Page mark (ADR-0047), in their own colours. Stickers keep
 * their fills in both themes: the die-cut white edge is what makes a sticker read on any page.
 */
export function Sticker({ art, width, accessibilityLabel }: StickerProps) {
    const [, , w, h] = art.viewBox.split(/\s+/).map(Number);
    const labelled = !!accessibilityLabel;
    return (
        <Svg
            width={width}
            height={(width * h) / w}
            viewBox={art.viewBox}
            accessible={labelled}
            accessibilityRole={labelled ? 'image' : undefined}
            accessibilityLabel={accessibilityLabel}
            accessibilityElementsHidden={!labelled}
            importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
        >
            {art.paths.map((p, i) => (
                <Path
                    key={i}
                    d={p.d}
                    fill={p.fill}
                    fillRule={p.evenOdd ? 'evenodd' : 'nonzero'}
                    opacity={p.opacity}
                />
            ))}
        </Svg>
    );
}
