import { MIN_SCENE_HEIGHT, planeScale } from '../PlaneScene';

describe('planeScale', () => {
    it('fits the artboard in its space, keeping its shape', () => {
        expect(planeScale(361, 280)).toBe(1);
        expect(planeScale(361, 140)).toBe(0.5);
        expect(planeScale(180.5, 280)).toBe(0.5);
    });

    it('stops growing on an iPad\'s sheet', () => {
        expect(planeScale(800, 900)).toBe(1.3);
    });

    it('can still draw the smallest space it accepts, at a size that reads', () => {
        expect(planeScale(361, MIN_SCENE_HEIGHT)).toBeGreaterThan(0.4);
    });
});
