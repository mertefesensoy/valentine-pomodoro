// covers: FR-NTE-001, FR-FLY-003
import { MidnightPlum, StrawberryMilk } from '../../theme/palette';
import { sheetOptions } from '../sheetOptions';

// Build 48 (F2): the strip that `fitToContents` adds under a sheet's content showed through,
// because the sheets painted only their own views. Each sheet now gives the Screen its surface.
describe('the form sheets paint their whole surface', () => {
    it.each([StrawberryMilk, MidnightPlum])('in $id, each sheet takes its own surface colour', ({ tokens }) => {
        const sheets = sheetOptions(tokens);
        expect(sheets.loveNote.contentStyle.backgroundColor).toBe(tokens.paper);
        expect(sheets.modes.contentStyle.backgroundColor).toBe(tokens.page);
    });

    it('keeps both reading sheets sized to their content, without a grabber', () => {
        const { loveNote, modes } = sheetOptions(StrawberryMilk.tokens);
        for (const options of [loveNote, modes]) {
            expect(options).toMatchObject({
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: false,
                headerShown: false,
            });
        }
    });

    // D2 Notes contract: the editor is for writing, so it takes the full height (`sheets.md`),
    // draws its own Cancel and Save header, and sits on the page colour.
    it.each([StrawberryMilk, MidnightPlum])('in $id, the note editor is a full-height sheet on the page', ({ tokens }) => {
        expect(sheetOptions(tokens).noteEditor).toMatchObject({
            presentation: 'formSheet',
            sheetAllowedDetents: [1],
            sheetGrabberVisible: false,
            headerShown: false,
            contentStyle: { backgroundColor: tokens.page },
        });
    });
});
