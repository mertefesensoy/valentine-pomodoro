import { Share, Text } from 'react-native';
import * as Application from 'expo-application';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { appStorage } from '../../utils/appStorage';
import { MIGRATION_DONE, MIGRATION_FLAG_KEY } from '../../utils/storageMigration';
import { HiddenStartupDiagnostics } from '../StartupDiagnostics';
import { STARTUP_PROBE_KEY } from '../startupProbe';
import { STARTUP_VARIANT_KEY, readStartupMode } from '../startupVariant';

// Phase 1 B7: the hidden panel behind a long-press on Settings → About's
// credit line (record §3.5). The line must look and read as before; only the
// long-press opens the panel, and opening it is what turns storage on.

const LINE = 'Made with ❤️ by Mert Efe Sensoy';

function renderLine() {
    return render(
        <HiddenStartupDiagnostics>
            <Text>{LINE}</Text>
        </HiddenStartupDiagnostics>,
    );
}

beforeEach(() => {
    appStorage.clearAll();
    appStorage.set(MIGRATION_FLAG_KEY, MIGRATION_DONE);
});

// covers: NFR-PERF-001
describe('the hidden start-up panel', () => {
    it('shows only the line until it is long-pressed, and writes nothing', async () => {
        await renderLine();
        expect(screen.getByText(LINE)).toBeOnTheScreen();
        expect(screen.queryByText(/Start-up probe/)).toBeNull();
        expect(appStorage.getString(STARTUP_VARIANT_KEY)).toBeUndefined();

        await fireEvent.press(screen.getByText(LINE)); // an ordinary tap does nothing
        expect(screen.queryByText(/Start-up probe/)).toBeNull();
    });

    it('a long-press opens it, turns the probe\'s storage on, and a second one closes it', async () => {
        await renderLine();
        await fireEvent(screen.getByText(LINE), 'longPress');

        expect(screen.getByText(/Start-up probe/)).toBeOnTheScreen();
        expect(screen.getByText(/This launch:/)).toBeOnTheScreen();
        expect(readStartupMode()).toBe('deferred');
        expect(appStorage.getString(STARTUP_VARIANT_KEY)).toBeDefined();

        await fireEvent(screen.getByText(LINE), 'longPress');
        expect(screen.queryByText(/Start-up probe/)).toBeNull();
    });

    it('compares the arms from the probe start even when no row passed the clock check', async () => {
        const build = Application.nativeBuildVersion ?? null;
        const row = (id: number, arm: 'deferred' | 'eager', interactive: number) => ({
            v: 1, id, arm, trigger: arm === 'eager' ? 'eager' : 'idle', version: '1.4.0', build,
            migrated: true, appState: 'inactive', clockOk: false,
            marks: { probeInit: 0, firstLayout: interactive - 20, interactive },
        });
        appStorage.set(STARTUP_PROBE_KEY, JSON.stringify([
            row(1, 'deferred', 300), row(2, 'eager', 340), row(3, 'deferred', 310), row(4, 'eager', 360),
        ]));
        await renderLine();
        await fireEvent(screen.getByText(LINE), 'longPress');

        expect(screen.getByText(/^Deferred: n 2 · median 305/)).toBeOnTheScreen();
        expect(screen.getByText(/^Eager: n 2 · median 350/)).toBeOnTheScreen();
        expect(screen.getByText(/^Eager − deferred: Δ median 45 ms/)).toBeOnTheScreen();
        expect(screen.getByText(/no row passed the clock check/)).toBeOnTheScreen();
    });

    it('sets the arm for the next launches, clears the runs and shares them', async () => {
        const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
        appStorage.set(STARTUP_PROBE_KEY, JSON.stringify([{ v: 1, id: 1, arm: 'eager', marks: {} }]));
        await renderLine();
        await fireEvent(screen.getByText(LINE), 'longPress');
        expect(screen.getByText(/Rows stored: 1/)).toBeOnTheScreen();

        await fireEvent.press(screen.getByText('Alternate'));
        expect(readStartupMode()).toBe('alternate');

        await fireEvent.press(screen.getByText('Share data'));
        expect(share).toHaveBeenCalledTimes(1);
        expect(JSON.parse(share.mock.calls[0][0].message as string).rows).toHaveLength(1);

        await fireEvent.press(screen.getByText('Clear runs'));
        expect(screen.getByText(/Rows stored: 0/)).toBeOnTheScreen();
        expect(JSON.parse(appStorage.getString(STARTUP_PROBE_KEY) as string)).toEqual([]);
    });
});
