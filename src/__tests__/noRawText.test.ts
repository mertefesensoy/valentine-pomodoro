// covers: NFR-I18N-001, FR-SET-005
// Every string a person reads or hears comes from the string files, so it has its Turkish (Stage
// D plan §3.4, D3). The check (`scripts/i18n/check-raw-text.mjs`) parses `src/` and `app/` and
// fails on JSX text, readable props, alerts and notification content written as literals.
// The project has no @types/node, so the one function used is typed here.
const { execFileSync } = jest.requireActual<{
    execFileSync: (file: string, args: string[], options: { encoding: 'utf8'; stdio: 'pipe' }) => string;
}>('child_process');

describe('no raw text in the app source (NFR-I18N-001)', () => {
    it('passes scripts/i18n/check-raw-text.mjs', () => {
        let output = '';
        let failed = false;
        try {
            output = execFileSync(process.execPath, ['scripts/i18n/check-raw-text.mjs'], { encoding: 'utf8', stdio: 'pipe' });
        } catch (error) {
            failed = true;
            output = String((error as { stderr?: string }).stderr ?? error);
        }
        expect(failed ? output : '').toBe('');
        expect(output).toMatch(/no raw text in app source/);
    });
});
