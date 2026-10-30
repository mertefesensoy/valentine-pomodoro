import Svg, { Path } from 'react-native-svg';

/** One drawing from the C3 icon set, generated into `./art/` by scripts/art/build-icon-components.mjs. */
export type Glyph = {
    viewBox: string;
    paths: readonly { d: string; evenOdd?: true }[];
};

type IconProps = {
    glyph: Glyph;
    /** Points; the set is drawn on a 24 pt grid. */
    size?: number;
    color: string;
    /** Spoken by VoiceOver. Without one the icon is decoration and hidden from it. */
    accessibilityLabel?: string;
};

/**
 * An icon from the brand's custom set (DESIGN.md › Shapes; NFR-UX-002): one ink, drawn in
 * `currentColor`, so every icon takes its colour from the caller's token in either theme.
 */
export function Icon({ glyph, size = 24, color, accessibilityLabel }: IconProps) {
    const labelled = !!accessibilityLabel;
    return (
        <Svg
            width={size}
            height={size}
            viewBox={glyph.viewBox}
            color={color}
            accessible={labelled}
            accessibilityRole={labelled ? 'image' : undefined}
            accessibilityLabel={accessibilityLabel}
            accessibilityElementsHidden={!labelled}
            importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
        >
            {glyph.paths.map((p, i) => (
                <Path key={i} d={p.d} fill="currentColor" fillRule={p.evenOdd ? 'evenodd' : 'nonzero'} />
            ))}
        </Svg>
    );
}
