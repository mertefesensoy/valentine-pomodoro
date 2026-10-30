/**
 * The two native form sheets' screen options (Phase 1 D1, Classic brief §6), built from the theme.
 *
 * Contract: pure; `sheetOptions(tokens)` returns the options for the `love-note` and `modes` routes.
 *   - A native form sheet sized to its content (UISheetPresentationController), with no grabber:
 *     neither is resizable (HIG sheets.md). A long note at AX sizes reaches full height and scrolls.
 *   - `contentStyle.backgroundColor` is each sheet's own surface: paper under the love note, the
 *     page under Modes. `react-native-screens` moves it onto the Screen, which spans the whole sheet,
 *     including the bottom safe area that `fitToContents` adds under the content. Without it, that
 *     strip showed the theme's page colour or the system material (build 48, F2).
 *   - Each sheet's root is a ScrollView: the library sizes a sheet's root scroll view to the whole
 *     sheet, so the sheet's own paint reaches its bottom edge as well.
 */
import type { ThemeTokens } from '../theme/palette';

const SHEET = {
    presentation: 'formSheet',
    sheetAllowedDetents: 'fitToContents',
    sheetGrabberVisible: false,
    headerShown: false,
} as const;

export function sheetOptions(tokens: ThemeTokens) {
    return {
        loveNote: { ...SHEET, contentStyle: { backgroundColor: tokens.paper } },
        modes: { ...SHEET, contentStyle: { backgroundColor: tokens.page } },
    } as const;
}
