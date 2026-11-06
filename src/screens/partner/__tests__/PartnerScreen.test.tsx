// covers: FR-PAR-003
// Your partner's day, the sheet (Phase 2 D2). It reads the summary alone, so it has no server to mock.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { usePartnerGlance, type PartnerGlance } from '../../../server/partnerGlance';
import { owedCells } from '../PartnerCard';
import PartnerScreen from '../PartnerScreen';

jest.setTimeout(30_000);

jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

const back = router.back as jest.Mock;
const today = { day_key: '2026-11-06', focus_ms: 75 * 60_000, sessions: 3, goal_hit: false, goal_minutes: 100 };
const glance = (over: Partial<PartnerGlance> = {}): PartnerGlance => ({
    coupleId: 'c',
    name: 'Deniz',
    today,
    updatedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    fetchedAt: Date.now(),
    ...over,
});

async function open(value: PartnerGlance | null) {
    await act(async () => usePartnerGlance.setState({ glance: value, gone: null }));
    await render(<PartnerScreen />);
    await act(async () => {});
}

beforeEach(() => back.mockClear());

describe('their day', () => {
    it('names them, and shows the date, the line and when it was updated', async () => {
        await open(glance());
        expect(screen.getByRole('header', { name: 'Deniz' })).toBeOnTheScreen();
        expect(screen.getByText(/November/)).toBeOnTheScreen();
        expect(screen.getByText('3 sessions · 75 min · goal 100 min')).toBeOnTheScreen();
        expect(screen.getByText('Updated 12 minutes ago')).toBeOnTheScreen();
    });

    it('draws dashed cells for what\'s still owed, and they\'re gone at the goal', async () => {
        await open(glance());
        expect(screen.getByTestId('partner-cells').children).toHaveLength(3 + 1);
        await open(glance({ today: { ...today, focus_ms: 120 * 60_000, goal_hit: true } }));
        expect(screen.getByTestId('partner-cells').children).toHaveLength(3);
    });

    it('owes nothing on a day that\'s over, past midnight with no refresh', async () => {
        await open(glance({ fetchedAt: Date.now() - 2 * 24 * 3_600_000 }));
        expect(screen.getByTestId('partner-cells').children).toHaveLength(3);
    });

    it('speaks in full words, since "min" doesn\'t read well aloud', async () => {
        await open(glance());
        expect(screen.getByLabelText(/, 3 sessions, 75 minutes, goal 100 minutes$/)).toBeOnTheScreen();
    });

    it('plans its row from what it measures, for an iPad\'s narrow sheet', async () => {
        await open(glance({ today: { ...today, sessions: 7, goal_hit: true } }));
        const wide = screen.getByTestId('partner-cells').children.length;
        await act(async () => {
            fireEvent(screen.getByTestId('partner-cells').parent!.parent!, 'layout', { nativeEvent: { layout: { width: 160 } } });
        });
        expect(screen.getByTestId('partner-cells').children.length).toBeLessThanOrEqual(wide);
    });

    it('drops the goal from the line when theirs is off', async () => {
        await open(glance({ today: { ...today, goal_minutes: null } }));
        expect(screen.getByText('3 sessions · 75 min')).toBeOnTheScreen();
    });

    it('says nothing yet with no row for today, never yesterday\'s', async () => {
        await open(glance({ today: null, updatedAt: null }));
        expect(screen.getByText('Nothing yet today')).toBeOnTheScreen();
        expect(screen.queryByText(/Updated/)).toBeNull();
    });

    it('has no way to compare the two of you', async () => {
        await open(glance());
        expect(screen.queryByText(/behind|ahead|streak/i)).toBeNull();
    });
});

describe('leaving', () => {
    it('closes from its button', async () => {
        await open(glance());
        await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
        expect(back).toHaveBeenCalled();
    });

    it('closes itself when a refresh finds they\'ve gone', async () => {
        await open(glance());
        await act(async () => usePartnerGlance.setState({ glance: null, gone: { name: 'Deniz' } }));
        expect(back).toHaveBeenCalled();
    });
});

describe('owedCells', () => {
    it.each([
        [3, 75, 100, 1, 'a session\'s worth left, at their own average'],
        [3, 75, 101, 2, 'rounds up'],
        [0, 0, 100, 4, 'the usual 25 minutes, with none today to average'],
        [3, 75, 75, 0, 'none at the goal'],
        [3, 90, 75, 0, 'none past it'],
        [3, 75, null, 0, 'none with no goal'],
    ])('%i sessions, %i min, goal %s: %i (%s)', (sessions, minutes, goal, owed, _why) => {
        expect(owedCells(sessions, minutes, goal)).toBe(owed);
    });
});
