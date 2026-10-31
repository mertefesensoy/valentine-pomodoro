// covers: NFR-UX-002
// DESIGN.md: "Don't use emoji or Unicode glyphs as icons. Emoji belong only in push-notification
// copy and in text users write." The check (Stage D plan §3.3, D2) scans `src/` and `app/` for any
// emoji code point outside its allowlist (the default notes, v1.3.1's frozen notes, push copy).
// The project has no @types/node, so the one function used is typed here.
const { execFileSync } = jest.requireActual<{
    execFileSync: (file: string, args: string[], options: { encoding: 'utf8'; stdio: 'pipe' }) => string;
}>('child_process');

describe('no emoji in the app source (NFR-UX-002)', () => {
    it('passes scripts/design/check-emoji.mjs', () => {
        let output = '';
        let failed = false;
        try {
            output = execFileSync(process.execPath, ['scripts/design/check-emoji.mjs'], { encoding: 'utf8', stdio: 'pipe' });
        } catch (error) {
            failed = true;
            output = String((error as { stderr?: string }).stderr ?? error);
        }
        expect(failed ? output : '').toBe('');
        expect(output).toMatch(/no emoji in app source/);
    });
});
