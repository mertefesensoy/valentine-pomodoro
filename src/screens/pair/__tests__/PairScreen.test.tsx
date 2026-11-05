// covers: FR-PAR-001, FR-ACC-002
// The pairing sheet's steps (Phase 2 D1). The server's side is pinned in pairing.test.ts and pgTAP; these pin
// what a person sees at each step, and that nothing happens until they press Pair.
import { Dimensions, Share } from 'react-native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import PairScreen from '../PairScreen';
import { CODE_WIDTH, cellScaleFor } from '../CodeCells';
import { space, edgeWidth } from '../../../theme/layout';
import { useAccountStore } from '../../../server/account';

jest.setTimeout(30_000);

jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

let mockReduced = false;
jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    useReducedMotion: () => mockReduced,
}));

jest.mock('expo-apple-authentication', () => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return {
        AppleAuthenticationButtonType: { CONTINUE: 2 },
        AppleAuthenticationButtonStyle: { BLACK: 2, WHITE: 0 },
        AppleAuthenticationButton: ({ onPress, buttonStyle }: { onPress: () => void; buttonStyle: number }) => (
            <Pressable onPress={onPress} accessibilityRole="button" testID={`apple-button-${buttonStyle}`}>
                <Text>Continue with Apple</Text>
            </Pressable>
        ),
    };
});

let mockCelebrated = false;
const mockMarkCelebrated = jest.fn();
const mockSignIn = jest.fn();
const mockSaveName = jest.fn();
const mockEnsureCode = jest.fn();
const mockNewCode = jest.fn();
const mockPreview = jest.fn();
const mockRedeem = jest.fn();
jest.mock('../pairing', () => ({
    ...jest.requireActual('../pairing'),
    signIn: () => mockSignIn(),
    saveName: (name: string) => mockSaveName(name),
    ensureCode: () => mockEnsureCode(),
    newCode: () => mockNewCode(),
    previewCode: (code: string) => mockPreview(code),
    redeemCode: (code: string) => mockRedeem(code),
    markCelebrated: (id: string) => mockMarkCelebrated(id),
    wasCelebrated: () => mockCelebrated,
}));

let mockHome: unknown = null;
jest.mock('@tanstack/react-query', () => ({
    useQuery: () => ({ data: mockHome }),
}));
jest.mock('../../../server/home', () => ({ HOME_KEY: ['home'], fetchHome: jest.fn(), homeClient: {} }));

const flush = () => act(async () => {
    await Promise.resolve();
});

async function open({ signedIn }: { signedIn: boolean }) {
    await act(async () => useAccountStore.setState({ present: signedIn }));
    await render(<PairScreen />);
    await flush();
}

beforeEach(() => {
    mockHome = null;
    mockReduced = false;
    mockCelebrated = false;
    mockMarkCelebrated.mockReset();
    mockSignIn.mockReset();
    mockSaveName.mockReset();
    mockEnsureCode.mockReset();
    mockEnsureCode.mockResolvedValue({ code: 'K7MP2Q' });
    mockNewCode.mockReset();
    mockPreview.mockReset();
    mockRedeem.mockReset();
});

describe('before sign-in', () => {
    it('says why, and offers Apple\'s own button and a way out', async () => {
        await open({ signedIn: false });
        expect(screen.getByText(/To pair, you each need an account/)).toBeOnTheScreen();
        expect(screen.getByText('Continue with Apple')).toBeOnTheScreen();
        expect(screen.getByText('Not now')).toBeOnTheScreen();
    });

    it('stays put, with no message, when the person cancels Apple\'s sheet', async () => {
        mockSignIn.mockResolvedValue('cancelled');
        await open({ signedIn: false });
        await fireEvent.press(screen.getByText('Continue with Apple'));
        await flush();
        expect(screen.getByText('Continue with Apple')).toBeOnTheScreen();
        expect(screen.queryByText(/Try again/)).toBeNull();
    });

    it('says so when offline, and the button still works', async () => {
        mockSignIn.mockResolvedValue('offline');
        await open({ signedIn: false });
        await fireEvent.press(screen.getByText('Continue with Apple'));
        await flush();
        expect(screen.getByText(/You're offline/)).toBeOnTheScreen();
        expect(screen.getByText('Continue with Apple')).toBeOnTheScreen();
    });

    it('asks for a name when Apple sent none, and only then', async () => {
        mockSignIn.mockResolvedValue({ needsName: true });
        mockSaveName.mockResolvedValue('ok');
        await open({ signedIn: false });
        await fireEvent.press(screen.getByText('Continue with Apple'));
        await flush();
        expect(screen.getByText('What should your partner call you?')).toBeOnTheScreen();

        await fireEvent.changeText(screen.getByLabelText('What should your partner call you?'), ' Ece ');
        await fireEvent.press(screen.getByText('Continue'));
        await flush();

        expect(mockSaveName).toHaveBeenCalledWith('Ece');
        expect(screen.getByText('Send my code')).toBeOnTheScreen();
    });
});

describe('your name', () => {
    it('stays in the scroll, above the keyboard, and the keyboard\'s Done key continues', async () => {
        mockSignIn.mockResolvedValue({ needsName: true });
        mockSaveName.mockResolvedValue('ok');
        await open({ signedIn: false });
        await fireEvent.press(screen.getByText('Continue with Apple'));
        await flush();
        expect(within(screen.getByTestId('pair-scroll')).getByText('Continue')).toBeOnTheScreen();

        const field = screen.getByLabelText('What should your partner call you?');
        await fireEvent(field, 'submitEditing');
        expect(mockSaveName).not.toHaveBeenCalled();

        await fireEvent.changeText(field, 'Ece');
        await fireEvent(field, 'submitEditing');
        await flush();
        expect(mockSaveName).toHaveBeenCalledWith('Ece');
    });
});

describe('your code and theirs', () => {
    it('shows your code on your page, spelled out for VoiceOver, with nothing to choose first', async () => {
        await open({ signedIn: true });
        expect(screen.getByLabelText('Your code: K, 7, M, P, 2, Q')).toBeOnTheScreen();
        expect(screen.getByLabelText("Your partner's code")).toBeOnTheScreen();
        expect(screen.getByText('Lasts 24 hours')).toBeOnTheScreen();
    });

    it('sends your code through the share sheet', async () => {
        const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
        await open({ signedIn: true });
        await fireEvent.press(screen.getByText('Send my code'));
        expect(share.mock.calls[0][0]).toMatchObject({ message: expect.stringContaining('K7MP2Q') });
        share.mockRestore();
    });

    it('can make a new code', async () => {
        mockNewCode.mockResolvedValue({ code: 'H4TW9B' });
        await open({ signedIn: true });
        await fireEvent.press(screen.getByText('Make a new code'));
        await flush();
        expect(screen.getByLabelText('Your code: H, 4, T, W, 9, B')).toBeOnTheScreen();
    });

    it('says why a look-alike did nothing', async () => {
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText("Your partner's code"), 'O');
        await flush();
        expect(screen.getByText('Codes never use I, L or O.')).toBeOnTheScreen();
    });

    it('checks by itself at six characters, and not before', async () => {
        mockPreview.mockResolvedValue({ inviterName: 'Deniz' });
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText("Your partner's code"), 'H4TW9');
        await flush();
        expect(mockPreview).not.toHaveBeenCalled();
        await fireEvent.changeText(screen.getByLabelText("Your partner's code"), 'h4tw9b');
        await flush();
        expect(mockPreview).toHaveBeenCalledWith('H4TW9B');
    });

    it.each([
        ['invalid', /doesn't match anyone/],
        ['expired', /has expired/],
        ['used', /already been used/],
        ['own_code', /your own code/],
        ['partner_paired', /already paired/],
        ['rate_limited', /Try again in an hour/],
        ['offline', /You're offline/],
    ])('explains %s on the page, keeping what was typed', async (problem, text) => {
        mockPreview.mockResolvedValue({ problem });
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText("Your partner's code"), 'H4TW9B');
        await flush();
        expect(screen.getByText(text)).toBeOnTheScreen();
        expect(screen.getByText('Send my code')).toBeOnTheScreen();
        expect(screen.getByLabelText("Your partner's code").props.value).toBe('H4TW9B');
    });
});

describe('who it is', () => {
    async function toConfirm() {
        mockPreview.mockResolvedValue({ inviterName: 'Deniz' });
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText("Your partner's code"), 'H4TW9B');
        await flush();
    }

    it('names them, and nothing has happened yet', async () => {
        await toConfirm();
        expect(screen.getByText('Pair with Deniz')).toBeOnTheScreen();
        expect(screen.getByText("That's not them")).toBeOnTheScreen();
        expect(mockRedeem).not.toHaveBeenCalled();
    });

    it('goes back with nothing done when it\'s not them', async () => {
        await toConfirm();
        await fireEvent.press(screen.getByText("That's not them"));
        await flush();
        expect(screen.getByText('Send my code')).toBeOnTheScreen();
        expect(mockRedeem).not.toHaveBeenCalled();
        expect(screen.getByLabelText("Your partner's code").props.value).toBe('');
    });

    it('pairs only when asked, with the code that was typed', async () => {
        mockRedeem.mockResolvedValue('ok');
        await toConfirm();
        await fireEvent.press(screen.getByText('Pair with Deniz'));
        await flush();
        expect(mockRedeem).toHaveBeenCalledWith('H4TW9B');
    });

    it('returns to the pages and explains, if it failed', async () => {
        mockRedeem.mockResolvedValue({ problem: 'expired' });
        await toConfirm();
        await fireEvent.press(screen.getByText('Pair with Deniz'));
        await flush();
        expect(screen.getByText(/has expired/)).toBeOnTheScreen();
    });
});

describe('under Reduce Motion', () => {
    it('still shows who it is, and pressing Pair ends on the settled mark and its line', async () => {
        mockReduced = true;
        mockPreview.mockResolvedValue({ inviterName: 'Deniz' });
        mockRedeem.mockResolvedValue('ok');
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText("Your partner's code"), 'H4TW9B');
        await flush();
        expect(screen.getByText('Pair with Deniz')).toBeOnTheScreen();
        expect(screen.getByLabelText('Pomo and Doro become the two faces of one diary')).toBeOnTheScreen();

        await fireEvent.press(screen.getByText('Pair with Deniz'));
        await flush();
        expect(mockRedeem).toHaveBeenCalledWith('H4TW9B');

        // redeemCode refreshes the snapshot, and the query re-renders the sheet with the couple.
        mockHome = {
            couple: { id: 'c', paired_at: 'x' },
            partner: { id: 'p', display_name: 'Deniz' },
            me: { id: 'm', display_name: 'Ece' },
        };
        await screen.rerender(<PairScreen />);
        expect(screen.getByText('You and Deniz are on the same page.')).toBeOnTheScreen();
        expect(screen.getByText('Done')).toBeOnTheScreen();
    });
});

describe('at the largest text sizes', () => {
    // The Jest window is font scale 2, so these tests run stacked: the actions sit outside the scroll.
    it('keeps Apple\'s button and Send my code out of the scroll, so they\'re never below the fold', async () => {
        await open({ signedIn: false });
        expect(within(screen.getByTestId('pair-scroll')).queryByText('Continue with Apple')).toBeNull();
        expect(screen.getByText('Continue with Apple')).toBeOnTheScreen();
    });
});

describe('in the usual layouts', () => {
    const PHONE = { width: 393, height: 852, scale: 3, fontScale: 1 };
    const LANDSCAPE = { width: 852, height: 393, scale: 3, fontScale: 1 };
    const jestWindow = Dimensions.get('window');
    afterEach(async () => {
        await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
    });

    it.each([
        ['a phone', PHONE],
        ['a landscape phone', LANDSCAPE],
    ])('keeps the actions in the scroll on %s', async (_name, size) => {
        await act(async () => Dimensions.set({ window: size, screen: size }));
        await open({ signedIn: false });
        expect(within(screen.getByTestId('pair-scroll')).getByText('Continue with Apple')).toBeOnTheScreen();
    });

    it('fits three cells on a page, even on a zoomed small iPhone', () => {
        expect(cellScaleFor(393, false)).toBe(1);
        const narrow = cellScaleFor(320, false);
        expect(narrow).toBeLessThan(1);
        const room = (320 - 2 * space.l - space.s) / 2 - 2 * space.s - 2 * edgeWidth;
        expect(CODE_WIDTH * narrow).toBeLessThanOrEqual(room + 0.001);
        expect(cellScaleFor(320, true)).toBe(1.2);
    });
});

describe('once there is a couple', () => {
    it('goes to the morph, whichever phone got there first, and Done closes the sheet', async () => {
        const { router } = jest.requireMock<{ router: { back: jest.Mock } }>('expo-router');
        router.back.mockClear();
        mockHome = {
            couple: { id: 'c', paired_at: 'x' },
            partner: { id: 'p', display_name: 'Deniz' },
            me: { id: 'm', display_name: 'Ece' },
        };
        await open({ signedIn: true });

        expect(screen.getByText('You and Deniz are on the same page.')).toBeOnTheScreen();
        expect(screen.getByLabelText('Pomo and Doro become the two faces of one diary')).toBeOnTheScreen();
        expect(mockMarkCelebrated).toHaveBeenCalledTimes(1);
        expect(mockMarkCelebrated).toHaveBeenCalledWith('c');

        await fireEvent.press(screen.getByText('Done'));
        expect(router.back).toHaveBeenCalled();
    });

    it('plays once per person: opened again, the mark is just there', async () => {
        mockCelebrated = true;
        mockHome = {
            couple: { id: 'c', paired_at: 'x' },
            partner: { id: 'p', display_name: 'Deniz' },
            me: { id: 'm', display_name: 'Ece' },
        };
        await open({ signedIn: true });
        expect(screen.getByText('You and Deniz are on the same page.')).toBeOnTheScreen();
        expect(mockMarkCelebrated).not.toHaveBeenCalled();
    });
});
