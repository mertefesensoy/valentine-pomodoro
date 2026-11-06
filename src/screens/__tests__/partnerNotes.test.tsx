// covers: FR-NTE-003, FR-NTE-001
// A note from your partner arriving (Phase 2 D3): at the Timer's and Fly's own moments, once, with the session engine
// knowing nothing of it.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { LoveNoteSheet } from '../../components/loveNote/LoveNoteSheet';
import { useAccountStore } from '../../server/account';
import { usePartnerGlance } from '../../server/partnerGlance';
import { StoreGate } from '../../stores/StoreGate';
import { useLoveNoteSheet } from '../../stores/loveNoteSheetStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import { useUiStore } from '../../stores/uiStore';
import { appStorage } from '../../utils/appStorage';
import TimerScreen from '../TimerScreen';

jest.useFakeTimers();
jest.setTimeout(60_000);

jest.mock('../../constants/features', () => ({
    ...jest.requireActual('../../constants/features'),
    PAIRING_ENABLED: true,
}));
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
}));
jest.mock('../../ads/AdPolicy', () => ({
    AdPolicy: { recordSessionCompletion: jest.fn(async () => {}), shouldShowAd: jest.fn(() => false) },
}));
jest.mock('../../ads/AdManager', () => ({ AdManager: { showIfReady: jest.fn(() => false) } }));
jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: {
        push: jest.fn(),
        canGoBack: () => true,
        back: jest.fn(() => jest.requireActual('../../stores/loveNoteSheetStore').useLoveNoteSheet.getState().close()),
    },
}));
const mockFlushShown = jest.fn(async () => {});
jest.mock('../../server/noteDelivery', () => ({ flushShown: () => mockFlushShown() }));

const PARTNER_NOTE = 'Good luck with your exam today';
const NOTE_ID = 'n1';
const push = router.push as jest.Mock;

function SheetHost() {
    const note = useLoveNoteSheet((s) => s.note);
    return note === null ? null : <LoveNoteSheet />;
}

async function show() {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>
                <TimerScreen />
                <SheetHost />
            </StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

async function press(text: string) {
    await act(async () => {
        await fireEvent.press(screen.getByText(text));
    });
}

async function tick(ms: number) {
    await act(() => jest.advanceTimersByTime(ms));
    await act(async () => {});
}

async function setUp({ showLoveNotes, notes = [{ id: NOTE_ID, body: PARTNER_NOTE }] }: {
    showLoveNotes: boolean;
    notes?: { id: string; body: string }[];
}) {
    await show();
    await act(async () => {
        appStorage.set('pair_celebrated_v1', 'c');
        useAccountStore.setState({ present: true, sessionEnded: false });
        usePartnerGlance.setState({
            glance: { coupleId: 'c', name: 'Deniz', today: null, updatedAt: null, fetchedAt: Date.now() },
            gone: null,
            notes,
            shown: [],
        });
        useSettingsStore.getState().updateSettings({
            durations: { ...useSettingsStore.getState().settings.durations, focus: 1 },
            showLoveNotes,
        });
        useStatsStore.getState().setGoalMinutes(0);
    });
}

async function completeFocus() {
    await press('Start focus');
    await tick(61_000);
}

beforeEach(async () => {
    await resetStorage();
    push.mockClear();
    mockFlushShown.mockClear();
    useLoveNoteSheet.getState().close();
});

afterEach(async () => {
    await act(async () => {
        usePartnerGlance.setState({ glance: null, gone: null, notes: [], shown: [] });
        useAccountStore.setState({ present: false, sessionEnded: false });
    });
});

describe('after your next focus', () => {
    it('shows your partner\'s note in place of your own, titled with who wrote it', async () => {
        await setUp({ showLoveNotes: true });
        await completeFocus();
        expect(screen.getByText(PARTNER_NOTE)).toBeOnTheScreen();
        expect(screen.getByRole('header', { name: 'A note from Deniz' })).toBeOnTheScreen();
        expect(push).toHaveBeenCalledWith('/love-note');
    });

    it('tells the server on showing, not on closing, and it can\'t come back', async () => {
        await setUp({ showLoveNotes: true });
        await completeFocus();
        expect(usePartnerGlance.getState().notes).toEqual([]);
        expect(usePartnerGlance.getState().shown).toEqual([NOTE_ID]);
        expect(mockFlushShown).toHaveBeenCalledTimes(1);
    });

    it('shows it once: the next focus is one of your own', async () => {
        await setUp({ showLoveNotes: true });
        await completeFocus();
        await press('Close');
        expect(screen.queryByText(PARTNER_NOTE)).toBeNull();

        await press('Start break');
        await tick(5 * 60_000 + 1_000);
        await press('Start focus');
        await tick(61_000);
        expect(screen.queryByText(PARTNER_NOTE)).toBeNull();
        expect(screen.getByRole('header', { name: 'A note for you' })).toBeOnTheScreen();
    });

    it('shows them oldest first, one a focus', async () => {
        await setUp({ showLoveNotes: true, notes: [{ id: 'a', body: 'First' }, { id: 'b', body: 'Second' }] });
        await completeFocus();
        expect(screen.getByText('First')).toBeOnTheScreen();
        expect(usePartnerGlance.getState().notes).toEqual([{ id: 'b', body: 'Second' }]);
    });

    it('shows your own when there\'s none from them', async () => {
        await setUp({ showLoveNotes: true, notes: [] });
        await completeFocus();
        expect(screen.getByRole('header', { name: 'A note for you' })).toBeOnTheScreen();
        expect(mockFlushShown).not.toHaveBeenCalled();
    });

    it('keeps your partner\'s words out of what the session engine saves', async () => {
        await setUp({ showLoveNotes: true });
        await completeFocus();
        for (const key of appStorage.getAllKeys()) {
            if (key === 'partner_glance_v1') continue;
            expect(appStorage.getString(key) ?? '').not.toContain(PARTNER_NOTE);
        }
    });
});

describe('with Show love notes off', () => {
    it('shows no sheet after a focus, and it waits on their strip', async () => {
        await setUp({ showLoveNotes: false });
        expect(screen.getByText('A note from Deniz is waiting')).toBeOnTheScreen();
        await completeFocus();
        expect(screen.queryByText(PARTNER_NOTE)).toBeNull();
        expect(usePartnerGlance.getState().notes).toHaveLength(1);
    });

    it('opens the same sheet from the strip, once, and then the strip opens their day', async () => {
        await setUp({ showLoveNotes: false });
        const strip = screen.getByRole('button', { name: /A note from Deniz is waiting/ });
        expect(strip.props.accessibilityHint).toBe('Opens the note');
        await act(async () => {
            await fireEvent.press(strip);
        });
        expect(screen.getByText(PARTNER_NOTE)).toBeOnTheScreen();
        expect(push).toHaveBeenCalledWith('/love-note');
        expect(usePartnerGlance.getState().notes).toEqual([]);

        await press('Close');
        push.mockClear();
        expect(screen.queryByText('A note from Deniz is waiting')).toBeNull();
        await act(async () => {
            await fireEvent.press(screen.getByRole('button', { name: /^Deniz/ }));
        });
        expect(push).toHaveBeenCalledWith('/partner');
    });

    it('keeps the line through a session, so the Ring doesn\'t move, and opens their day then instead', async () => {
        await setUp({ showLoveNotes: false });
        await press('Start focus');
        expect(screen.getByText('A note from Deniz is waiting')).toBeOnTheScreen();
        await act(async () => {
            await fireEvent.press(screen.getByRole('button', { name: /A note from Deniz is waiting/ }));
        });
        expect(push).toHaveBeenCalledWith('/partner');
        expect(usePartnerGlance.getState().notes).toHaveLength(1);
    });

    it('says nothing on the strip with notes on: the note is for after a focus', async () => {
        await setUp({ showLoveNotes: true });
        expect(screen.queryByText('A note from Deniz is waiting')).toBeNull();
    });
});

describe('on landing a flight', () => {
    async function pick(label: string, city: string, iata: string) {
        await act(async () => {
            await fireEvent.press(screen.getByLabelText(label));
        });
        await act(async () => {
            await fireEvent.changeText(screen.getByPlaceholderText('Search airports…'), city);
        });
        await press(iata);
    }

    async function fly() {
        await act(async () => useUiStore.getState().setActiveMode('fly'));
        await pick('Departure airport', 'istanbul', 'IST');
        await pick('Arrival airport', 'lublin', 'LUZ');
        await press('Start flight');
        await tick(25 * 60_000 + 1_000);
    }

    afterEach(async () => {
        await act(async () => useUiStore.getState().setActiveMode('default'));
    });

    it('shows your partner\'s note on the landing card, who it\'s from, and it waits to be closed', async () => {
        await setUp({ showLoveNotes: true });
        await fly();
        expect(screen.getByText(PARTNER_NOTE)).toBeOnTheScreen();
        expect(screen.getByText('A note from Deniz')).toBeOnTheScreen();
        expect(usePartnerGlance.getState().notes).toEqual([]);

        // Your own landing note leaves by itself after 8 s. This one only comes once.
        await tick(9_000);
        expect(screen.getByText(PARTNER_NOTE)).toBeOnTheScreen();
    });

    it('still lands on one of your own when there\'s none from them', async () => {
        await setUp({ showLoveNotes: true, notes: [] });
        await fly();
        expect(screen.queryByText('A note from Deniz')).toBeNull();
        expect(screen.getByText('Close')).toBeOnTheScreen();
    });
});
