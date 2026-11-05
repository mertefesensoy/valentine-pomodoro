import { compareSemver } from '../semver';

// The update prompt shows only when the store's version compares as exactly 1
// against the installed one (src/hooks/useUpdateCheck.ts).
// covers: FR-UPD-001
describe('compareSemver', () => {
    it.each([
        ['1.4.1', '1.4.0', 1],
        ['1.4.0', '1.4.1', -1],
        ['1.4.0', '1.4.0', 0],
        ['1.5.0', '1.4.2', 1],
        ['2.0.0', '1.99.99', 1],
    ])('compares %s with %s as %i', (a, b, expected) => {
        expect(compareSemver(a, b)).toBe(expected);
    });

    it.each([
        ['1.10.0', '1.9.0', 1],
        ['1.9.0', '1.10.0', -1],
        ['1.4.10', '1.4.9', 1],
    ])('compares numbers, not text: %s with %s as %i', (a, b, expected) => {
        expect(compareSemver(a, b)).toBe(expected);
    });

    it.each([
        ['1.4', '1.4.0', 0],
        ['1.4.0', '1.4', 0],
        ['1.10', '1.9.9', 1],
    ])('treats a missing part as 0: %s with %s as %i', (a, b, expected) => {
        expect(compareSemver(a, b)).toBe(expected);
    });
});
