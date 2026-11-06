// covers: FR-PAR-002, FR-ACC-003
// Where Settings puts your partner and your account (Phase 2 D4; the brief's Phase 2 addition).
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { useAccountStore } from '../../server/account';
import { usePartnerGlance } from '../../server/partnerGlance';
import { StoreGate } from '../../stores/StoreGate';
import SettingsScreenExport from '../SettingsScreen';

jest.setTimeout(30_000);

jest.mock('../../constants/features', () => ({
    ...jest.requireActual('../../constants/features'),
    PAIRING_ENABLED: true,
    STARTUP_REPORTS_ENABLED: false,
}));
jest.mock('../../hooks/useUpdateCheck', () => ({
    useUpdateCheck: () => ({ checkForUpdates: jest.fn() }),
}));
jest.mock('expo-notifications', () => ({
    ...jest.requireActual<object>('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
}));
jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
const mockEvaluated: string[] = [];
jest.mock('../../server/client', () => {
    mockEvaluated.push('client');
    return {};
});
jest.mock('../../server/home', () => {
    mockEvaluated.push('home');
    return {};
});
jest.mock('@tanstack/react-query', () => {
    mockEvaluated.push('query');
    return {};
});
jest.mock('expo-secure-store', () => {
    mockEvaluated.push('keychain');
    return {};
});
jest.mock('../account/AccountGroups', () => {
    mockEvaluated.push('groups');
    const { Text: MockText } = jest.requireActual('react-native');
    return {
        PartnerGroup: () => <MockText>PARTNER GROUP</MockText>,
        AccountGroup: () => <MockText>ACCOUNT GROUP</MockText>,
    };
});

const GLANCE = { coupleId: 'c', name: 'Deniz', today: null, updatedAt: null, fetchedAt: 0 };

async function show({ present = false, paired = false, notice = null }: { present?: boolean; paired?: boolean; notice?: 'deleted' | 'unpaired' | null }) {
    await act(async () => {
        useAccountStore.setState({ present, sessionEnded: false, notice });
        usePartnerGlance.setState({ glance: paired ? GLANCE : null, gone: null, notes: [], shown: [] });
    });
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate><SettingsScreenExport /></StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

/** Where each text falls in the rendered screen, for checking the order. */
function position(text: string): number {
    return JSON.stringify(screen.toJSON()).indexOf(`"${text}"`);
}

beforeEach(async () => {
    await resetStorage();
    (router.push as jest.Mock).mockClear();
});

afterEach(async () => {
    await act(async () => {
        useAccountStore.setState({ present: false, sessionEnded: false, notice: null });
        usePartnerGlance.setState({ glance: null, gone: null, notes: [], shown: [] });
    });
});

describe('solo', () => {
    // First in the file, so nothing has loaded these yet. Evaluating any of them would break the solo promise (ADR-0049).
    it('with pairing on and no account, Settings evaluates no server code at all', async () => {
        await show({});
        expect(mockEvaluated).toEqual([]);
    });

    it('offers to pair, after Love notes, and loads nothing about accounts', async () => {
        await show({});
        await fireEvent.press(screen.getByRole('button', { name: 'Pair with your partner' }));
        expect(router.push).toHaveBeenCalledWith('/pair');
        expect(position('Your partner')).toBeGreaterThan(position('Love notes'));
        expect(screen.queryByText('ACCOUNT GROUP')).toBeNull();
    });

    it('says the account is gone at the top of the list, right after deleting it', async () => {
        await show({ notice: 'deleted' });
        expect(screen.getByText(/Your account is deleted/)).toBeOnTheScreen();
        expect(position('Your account is deleted. Your timer, stats and notes are still on this phone.')).toBeLessThan(position('Timer'));
    });

    it('says you\'ve unpaired, the same way', async () => {
        await show({ present: true, notice: 'unpaired' });
        expect(screen.getByText(/You've unpaired/)).toBeOnTheScreen();
    });
});

describe('with an account and no partner', () => {
    it('keeps the account after unpairing, following the row to pair again', async () => {
        await show({ present: true });
        expect(await screen.findByText('ACCOUNT GROUP')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Pair with your partner' })).toBeOnTheScreen();
        expect(position('ACCOUNT GROUP')).toBeGreaterThan(position('Your partner'));
    });
});

describe('paired', () => {
    it('puts your partner first, your account next, and no row to pair', async () => {
        await show({ present: true, paired: true });
        expect(await screen.findByText('PARTNER GROUP')).toBeOnTheScreen();
        expect(position('PARTNER GROUP')).toBeLessThan(position('ACCOUNT GROUP'));
        expect(position('ACCOUNT GROUP')).toBeLessThan(position('Timer'));
        expect(screen.queryByRole('button', { name: 'Pair with your partner' })).toBeNull();
    });
});
