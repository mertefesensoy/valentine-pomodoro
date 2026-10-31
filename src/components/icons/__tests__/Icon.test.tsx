// covers: NFR-UX-002, NFR-PERF-005
import { render, screen } from '@testing-library/react-native';

import { Icon } from '../Icon';
import { modes } from '../art/modes';
import { Sticker } from '../../stickers/Sticker';
import { pomoIdle } from '../../stickers/art/pomoIdle';
import { markColour } from '../../stickers/art/markColour';

describe('Icon', () => {
    it('draws every path in currentColor, coloured by its caller', async () => {
        await render(<Icon glyph={modes} size={24} color="#B03158" accessibilityLabel="Modes" />);
        expect(screen.getByLabelText('Modes')).toBeOnTheScreen();
        const tree = JSON.stringify(screen.toJSON());
        // react-native-svg resolves currentColor against the Svg's color when it draws.
        expect(tree).toContain('#B03158');
        expect(tree.match(/"d":/g)).toHaveLength(modes.paths.length);
        expect(tree).not.toMatch(/"fill":"#[0-9a-fA-F]{6}"/);
    });

    it('is hidden from VoiceOver without a label', async () => {
        await render(<Icon glyph={modes} color="#4A2C29" />);
        expect(screen.queryByRole('image')).toBeNull();
    });
});

describe('Sticker', () => {
    it("keeps the art's proportions", async () => {
        await render(<Sticker art={markColour} width={392} accessibilityLabel="Same Page" />);
        // mark-colour is drawn on a 784 × 576 artboard (C5).
        const svg = screen.getByLabelText('Same Page');
        expect(svg.props.width ?? svg.props.style?.width).toBeDefined();
    });

    it("lifts on the theme's shadow, drawn inside the Svg, and keeps its layout box", async () => {
        // DESIGN.md "Only Stickers Lift" (finish review fix 3): the silhouette in the token's colour,
        // its alpha on the group, offset and blurred, under the art.
        await render(<Sticker art={pomoIdle} width={50} shadow="#4A2C2929" accessibilityLabel="Pomo" />);
        const svg = screen.getByLabelText('Pomo');
        const room = 50 * 0.12;
        expect(svg.props.width ?? svg.props.style?.width).toBeCloseTo(50 + room * 2);
        expect(JSON.stringify(svg.props.style)).toContain(`${-room}`);
        const tree = JSON.stringify(screen.toJSON());
        // react-native-svg hands colours to native as ARGB integers: #4A2C29, opaque.
        expect(tree).toContain(`"payload":${0xff4a2c29}`);
        expect(tree).toContain(`"opacity":${0x29 / 255}`);
        expect(tree).toContain('"filter":"lift"');
        expect(tree).toContain('stdDeviation');
        expect(tree.match(/"d":/g)).toHaveLength(pomoIdle.paths.length * 2);
    });

    it('lies flat without one', async () => {
        await render(<Sticker art={pomoIdle} width={50} accessibilityLabel="Pomo" />);
        const tree = JSON.stringify(screen.toJSON());
        expect(tree).not.toContain('stdDeviation');
        expect(tree.match(/"d":/g)).toHaveLength(pomoIdle.paths.length);
    });

    it('carries its own fills, die-cut edge included', () => {
        expect(pomoIdle.paths.some((p) => p.fill.toLowerCase() === '#ffffff')).toBe(true);
        expect(pomoIdle.paths.some((p) => p.fill.toLowerCase() === '#f7a9be')).toBe(true);
    });
});

describe('the generated drawings', () => {
    it('match their VectorCraft sources in art/out/ (build-icon-components --check)', () => {
        // Jest runs in Node from the repo root; the project has no @types/node, so the two
        // Node APIs this needs are typed here.
        const { execFileSync } = jest.requireActual<{
            execFileSync: (file: string, args: string[], options: { encoding: 'utf8' }) => string;
        }>('child_process');
        const node = (process as unknown as { execPath: string }).execPath;
        const out = execFileSync(node, ['scripts/art/build-icon-components.mjs', '--check'], { encoding: 'utf8' });
        expect(out).toMatch(/drawings match their sources/);
    });
});
