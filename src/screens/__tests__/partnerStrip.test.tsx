// covers: FR-PAR-003, FR-PAR-002
// The Timer's strip once pairing is on (Phase 2 D2): your partner, the solo line, a partner gone and a session ended.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { useAccountStore } from '../../server/account';
import { usePartnerGlance, type PartnerGlance } from '../../server/partnerGlance';
import { StoreGate } from '../../stores/StoreGate';
import { useSettingsStore } from '../../stores/settingsStore';
import { partnerLabel, updatedText } from '../classic/PartnerStrip';
import TimerScreen from '../TimerScreen';

jest.setTimeout(30_000);

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
jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

const push = router.push as jest.Mock;
const NOW = new Date('2026-11-06T12:00:00').getTime();
const today = { day_key: '2026-11-06', focus_ms: 75 * 60_000, sessions: 3, goal_hit: false, goal_minutes: 100 };
const glance = (over: Partial<PartnerGlance> = {}): PartnerGlance => ({
    coupleId: 'c',
    name: 'Deniz',
    today,
    updatedAt: new Date(NOW - 12 * 60_000).toISOString(),
    fetchedAt: NOW,
    ...over,
});

let clock: jest.SpyInstance;

async function show({ partner = null, gone = null, sessionEnded = false, celebrated = true }: {
    partner?: PartnerGlance | null;
    gone?: { name: string | null } | null;
    sessionEnded?: boolean;
    celebrated?: boolean;
}) {
    const { appStorage } = jest.requireActual<typeof import('../../utils/appStorage')>('../../utils/appStorage');
    if (celebrated) appStorage.set('pair_celebrated_v1', 'c');
    else appStorage.remove('pair_celebrated_v1');
    await act(async () => {
        usePartnerGlance.setState({ glance: partner, gone });
        useAccountStore.setState({ present: true, sessionEnded });
    });
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate><TimerScreen /></StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

const PHONE = { width: 393, height: 852, scale: 3, fontScale: 1 };
const jestWindow = Dimensions.get('window');

beforeEach(async () => {
    await resetStorage();
    push.mockClear();
    clock = jest.spyOn(Date, 'now').mockReturnValue(NOW);
    await act(async () => Dimensions.set({ window: PHONE, screen: PHONE }));
});

afterEach(async () => {
    clock.mockRestore();
    await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
    await act(async () => {
        usePartnerGlance.setState({ glance: null, gone: null });
        useAccountStore.setState({ present: false, sessionEnded: false });
    });
});

describe('paired', () => {
    it('shows their name, stickers and minutes, with no tap', async () => {
        await show({ partner: glance() });
        expect(screen.getByText('Deniz')).toBeOnTheScreen();
        expect(screen.getByText('75 min today')).toBeOnTheScreen();
    });

    it('reads as one button for VoiceOver, which opens their day', async () => {
        await show({ partner: glance() });
        const strip = screen.getByRole('button', { name: 'Deniz, 3 sessions, 75 minutes today' });
        expect(strip.props.accessibilityHint).toBe('Opens their day');
        await fireEvent.press(strip);
        expect(push).toHaveBeenCalledWith('/partner');
    });

    it('stops at three stickers, then counts the rest', async () => {
        await show({ partner: glance({ today: { ...today, sessions: 7 } }) });
        expect(screen.getByText('+4', { includeHiddenElements: true })).toBeOnTheScreen();
    });

    it('says nothing yet when they have no row for today, never yesterday\'s', async () => {
        await show({ partner: glance({ today: null }) });
        expect(screen.getByText('Nothing yet today')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Deniz, nothing yet today' })).toBeOnTheScreen();
    });

    it('doesn\'t offer to pair', async () => {
        await show({ partner: glance() });
        expect(screen.queryByText('Pair with your partner')).toBeNull();
    });

    it('won\'t call yesterday\'s numbers today, past midnight with no refresh', async () => {
        clock.mockReturnValue(new Date('2026-11-07T00:30:00').getTime());
        await show({ partner: glance() });
        expect(screen.queryByText('75 min today')).toBeNull();
        expect(screen.getByText('Updated 12 hours ago')).toBeOnTheScreen();
    });

    it('carries the same on Facing Pages, the right page labelled with their name', async () => {
        await show({ partner: glance() });
        await act(async () => useSettingsStore.getState().updateSettings({ classicLayout: 'spread' }));
        await act(async () => {});
        expect(screen.getByText('Deniz', { includeHiddenElements: true })).toBeOnTheScreen();
        expect(screen.getByText('75 min today')).toBeOnTheScreen();
        expect(screen.queryByText('Doro', { includeHiddenElements: true })).toBeNull();

        const page = screen.getByRole('button', { name: 'Deniz, 3 sessions, 75 minutes today' });
        expect(page.props.accessibilityHint).toBe('Opens their day');
        await fireEvent.press(page);
        expect(push).toHaveBeenCalledWith('/partner');
    });

    it('says the same thing to VoiceOver whichever layout it is', () => {
        expect(partnerLabel(glance(), NOW)).toBe('Deniz, 3 sessions, 75 minutes today');
    });

    it('falls back to a word when they have no name yet', async () => {
        await show({ partner: glance({ name: null }) });
        expect(screen.getByText('Your partner')).toBeOnTheScreen();
    });
});

describe('solo', () => {
    it('offers to pair while idle, and the whole strip is the button', async () => {
        await show({});
        await fireEvent.press(screen.getByRole('button', { name: /Pair with your partner/ }));
        expect(push).toHaveBeenCalledWith('/pair');
    });
});

describe('when a partner has gone', () => {
    it('says so quietly, with no alert, until it\'s tapped', async () => {
        await show({ gone: { name: 'Deniz' } });
        expect(screen.getByText("You and Deniz aren't paired any more.")).toBeOnTheScreen();
        await fireEvent.press(screen.getByRole('button', { name: /aren't paired any more/ }));
        expect(usePartnerGlance.getState().gone).toBeNull();
    });

    it('has words for someone who never had a name', async () => {
        await show({ gone: { name: null } });
        expect(screen.getByText("You aren't paired any more.")).toBeOnTheScreen();
    });
});

describe('when a session has ended', () => {
    it('keeps the last known values, offers to sign in again, and opens Apple\'s button', async () => {
        await show({ partner: glance(), sessionEnded: true });
        expect(screen.getByText('75 min today')).toBeOnTheScreen();
        expect(screen.getByText("Sign in again to see your partner's day.")).toBeOnTheScreen();
        await fireEvent.press(screen.getByRole('button', { name: /Sign in again/ }));
        expect(push).toHaveBeenCalledWith('/pair');
    });
});

describe('the other phone\'s morph', () => {
    it('opens once a couple arrives, on the Timer, while nothing is running', async () => {
        await show({ partner: glance(), celebrated: false });
        expect(push).toHaveBeenCalledWith('/pair');
        expect(push).toHaveBeenCalledTimes(1);
    });

    it('stays away once it has played', async () => {
        await show({ partner: glance(), celebrated: true });
        expect(push).not.toHaveBeenCalled();
    });

    it('stays away from an ended session', async () => {
        await show({ partner: glance(), celebrated: false, sessionEnded: true });
        expect(push).not.toHaveBeenCalled();
    });
});

describe('updatedText', () => {
    const ago = (ms: number) => new Date(NOW - ms).toISOString();

    it.each([
        [30_000, 'Updated just now'],
        [60_000, 'Updated 1 minute ago'],
        [12 * 60_000, 'Updated 12 minutes ago'],
        [59 * 60_000 + 59_000, 'Updated 59 minutes ago'],
        [60 * 60_000, 'Updated 1 hour ago'],
        [23 * 3_600_000, 'Updated 23 hours ago'],
        [24 * 3_600_000, 'Updated 1 day ago'],
        [72 * 3_600_000, 'Updated 3 days ago'],
    ])('after %i ms says "%s"', (ms, text) => {
        expect(updatedText(ago(ms), NOW)).toBe(text);
    });

    it('reads "just now" when this phone\'s clock runs behind', () => {
        expect(updatedText(ago(-600_000), NOW)).toBe('Updated just now');
    });

    it('has nothing to say with no report yet', () => {
        expect(updatedText(null, NOW)).toBeNull();
    });
});
