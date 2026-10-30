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
