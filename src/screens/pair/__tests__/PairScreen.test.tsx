// covers: FR-PAR-001, FR-ACC-002
// The pairing sheet's steps (Phase 2 D1). The server's side is pinned in pairing.test.ts and pgTAP; these pin
// what a person sees at each step, and that nothing happens until they press Pair.
import { AccessibilityInfo, Alert, Dimensions, Share, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import PairScreen from '../PairScreen';
import { CODE_WIDTH, cellScaleFor } from '../CodeCells';
import { useAccountStore } from '../../../server/account';
import { usePartnerGlance } from '../../../server/partnerGlance';
import { space, edgeWidth } from '../../../theme/layout';

jest.setTimeout(30_000);

jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

let mockReduced = false;
jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    LayoutAnimationConfig: ({ children }: { children: unknown }) => children,
    useReducedMotion: () => mockReduced,
}));

jest.mock('../../../hooks/useWindowInsets', () => ({
    useWindowInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

const mockApple: { press: () => void } = { press: () => {} };
jest.mock('expo-apple-authentication', () => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return {
        AppleAuthenticationButtonType: { CONTINUE: 2 },
        AppleAuthenticationButtonStyle: { BLACK: 2, WHITE: 0 },
        AppleAuthenticationButton: ({ onPress, buttonStyle }: { onPress: () => void; buttonStyle: number }) => {
            mockApple.press = onPress;
            return (
                <Pressable onPress={onPress} accessibilityRole="button" testID={`apple-button-${buttonStyle}`}>
                    <Text>Continue with Apple</Text>
                </Pressable>
            );
        },
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

const ART = 'Pomo and Doro become the two faces of one diary';
const NAME_ASK = 'What should your partner call you?';
const CODE_FIELD = "Your partner's code";
const PAIRED = {
    couple: { id: 'c', paired_at: 'x' },
    partner: { id: 'p', display_name: 'Deniz' },
    me: { id: 'm', display_name: 'Ece' },
};
const NAMELESS = { couple: null, partner: null, me: { id: 'm', display_name: null } };
const NAMED = { couple: null, partner: null, me: { id: 'm', display_name: 'Ece' } };

const flush = () => act(async () => {
    await Promise.resolve();
});

async function open({ signedIn, sessionEnded = false }: { signedIn: boolean; sessionEnded?: boolean }) {
    await act(async () => useAccountStore.setState({ present: signedIn, sessionEnded }));
    await render(<PairScreen />);
    await flush();
}

let announce: jest.SpyInstance;

/** Pair ignores presses for a moment after it appears, in case the keyboard's falling under someone's finger. */
const pastTheGuard = () => {
    const later = Date.now() + 1000;
    jest.spyOn(Date, 'now').mockReturnValue(later);
};

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
    announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});

afterEach(() => {
    announce.mockRestore();
    jest.spyOn(Date, 'now').mockRestore();
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
        expect(announce).not.toHaveBeenCalled();
    });

    it('says so when offline, aloud too, and the button still works', async () => {
        mockSignIn.mockResolvedValue('offline');
        await open({ signedIn: false });
        await fireEvent.press(screen.getByText('Continue with Apple'));
        await flush();
        expect(screen.getByText(/You're offline/)).toBeOnTheScreen();
        expect(screen.getByText('Continue with Apple')).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(/You're offline/));
    });

    it('holds this step until signing in has finished, though the account exists by then', async () => {
        let finish: (value: unknown) => void = () => {};
        mockSignIn.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
        await open({ signedIn: false });
        // fireEvent would wait for the handler, which this test holds open.
        await act(async () => {
            mockApple.press();
        });
        await act(async () => useAccountStore.setState({ present: true }));
        expect(screen.getByText('Continue with Apple')).toBeOnTheScreen();
        expect(mockEnsureCode).not.toHaveBeenCalled();

        await act(async () => finish({ needsName: false }));
        await flush();
        expect(screen.getByText('Send my code')).toBeOnTheScreen();
    });

    it('offers Apple\'s button again when a session has ended, whatever the cache still holds', async () => {
        mockHome = PAIRED;
        await open({ signedIn: true, sessionEnded: true });
        expect(screen.getByText('Continue with Apple')).toBeOnTheScreen();
        expect(screen.queryByText('You and Deniz are on the same page.')).toBeNull();
    });

    it('tells someone whose session ended that they\'re still paired, and closes itself once signed in', async () => {
        const { router } = jest.requireMock<{ router: { back: jest.Mock } }>('expo-router');
        router.back.mockClear();
        mockSignIn.mockImplementation(async () => {
            useAccountStore.setState({ sessionEnded: false });
            return { needsName: false };
        });
        await act(async () => usePartnerGlance.setState({
            glance: { coupleId: 'c', name: 'Deniz', today: null, updatedAt: null, fetchedAt: 0 },
            gone: null,
        }));
        await open({ signedIn: true, sessionEnded: true });
        expect(screen.getByText('Sign in again')).toBeOnTheScreen();
        expect(screen.getByText(/You're still paired/)).toBeOnTheScreen();
        expect(screen.getByText('Deniz')).toBeOnTheScreen();
        expect(screen.queryByText('Pair with your partner')).toBeNull();

        await fireEvent.press(screen.getByText('Continue with Apple'));
        await flush();
        expect(router.back).toHaveBeenCalled();
        await act(async () => usePartnerGlance.setState({ glance: null, gone: null }));
    });
});

describe('your name', () => {
    it('asks when Apple sent none, says it aloud, and continues once saved', async () => {
        mockSignIn.mockImplementation(async () => {
            mockHome = NAMELESS;
            useAccountStore.setState({ present: true });
            return { needsName: true };
        });
        mockSaveName.mockImplementation(async () => {
            mockHome = NAMED;
            return 'ok';
        });
        await open({ signedIn: false });
        await fireEvent.press(screen.getByText('Continue with Apple'));
        await flush();
        expect(screen.getByText(NAME_ASK)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(NAME_ASK);
        expect(mockEnsureCode).not.toHaveBeenCalled();

        await fireEvent.changeText(screen.getByLabelText(NAME_ASK), ' Ece ');
        await fireEvent.press(screen.getByText('Continue'));
        await flush();
        await screen.rerender(<PairScreen />);
        await flush();

        expect(mockSaveName).toHaveBeenCalledWith('Ece');
        expect(screen.getByText('Send my code')).toBeOnTheScreen();
    });

    it('asks again on reopening a sheet that was closed here, since Apple won\'t send it twice', async () => {
        mockHome = NAMELESS;
        await open({ signedIn: true });
        expect(screen.getByText(NAME_ASK)).toBeOnTheScreen();
        expect(mockEnsureCode).not.toHaveBeenCalled();
    });

    it('stays in the scroll, above the keyboard, and the keyboard\'s Done key continues', async () => {
        mockHome = NAMELESS;
        mockSaveName.mockResolvedValue('ok');
        await open({ signedIn: true });
        expect(within(screen.getByTestId('pair-scroll')).getByText('Continue')).toBeOnTheScreen();

        const field = screen.getByLabelText(NAME_ASK);
        await fireEvent(field, 'submitEditing');
        expect(mockSaveName).not.toHaveBeenCalled();

        await fireEvent.changeText(field, 'Ece');
        await fireEvent(field, 'submitEditing');
        await flush();
        expect(mockSaveName).toHaveBeenCalledWith('Ece');
    });

    it('says what went wrong, aloud too', async () => {
        mockHome = NAMELESS;
        mockSaveName.mockResolvedValue('offline');
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText(NAME_ASK), 'Ece');
        await fireEvent.press(screen.getByText('Continue'));
        await flush();
        expect(screen.getByText(/You're offline/)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(/You're offline/));
    });
});

describe('your code and theirs', () => {
    it('reads your name, the code spelled out and how long it lasts, with nothing to choose first', async () => {
        mockHome = NAMED;
        await open({ signedIn: true });
        expect(screen.getByLabelText('Ece. Your code: K, 7, M, P, 2, Q. Lasts 24 hours')).toBeOnTheScreen();
        expect(screen.getByLabelText(CODE_FIELD)).toBeOnTheScreen();
        expect(screen.getByText('Lasts 24 hours')).toBeOnTheScreen();
    });

    it('shows the last known code at once, while it asks the server', async () => {
        mockEnsureCode.mockImplementation(() => new Promise(() => {}));
        mockHome = { ...NAMED, invite: { code: 'K7MP2Q', expires_at: new Date(Date.now() + 60_000).toISOString() } };
        await open({ signedIn: true });
        expect(screen.getByLabelText('Ece. Your code: K, 7, M, P, 2, Q. Lasts 24 hours')).toBeOnTheScreen();
    });

    it('doesn\'t show a last known code that has expired', async () => {
        mockEnsureCode.mockImplementation(() => new Promise(() => {}));
        mockHome = { ...NAMED, invite: { code: 'K7MP2Q', expires_at: new Date(Date.now() - 60_000).toISOString() } };
        await open({ signedIn: true });
        expect(screen.queryByLabelText(/K, 7, M, P, 2, Q/)).toBeNull();
    });

    it('offers Send my code on your page as well, for VoiceOver', async () => {
        const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
        mockHome = NAMED;
        await open({ signedIn: true });
        const page = screen.getByLabelText(/Your code: K, 7, M, P, 2, Q/);
        expect(page.props.accessibilityActions).toEqual([{ name: 'send', label: 'Send my code' }]);
        await act(async () => page.props.onAccessibilityAction({ nativeEvent: { actionName: 'send' } }));
        expect(share).toHaveBeenCalled();
        share.mockRestore();
    });

    it('doesn\'t promise a time on a code that hasn\'t come yet', async () => {
        mockEnsureCode.mockImplementation(() => new Promise(() => {}));
        await open({ signedIn: true });
        expect(screen.queryByText('Lasts 24 hours')).toBeNull();
    });

    it('says when your code couldn\'t be fetched, aloud too, and the link tries again with no question', async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockEnsureCode.mockResolvedValue({ problem: 'offline' });
        mockNewCode.mockResolvedValue({ code: 'H4TW9B' });
        await open({ signedIn: true });
        expect(screen.getByText(/You're offline/)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(/You're offline/));

        await fireEvent.press(screen.getByText('Make a new code'));
        await flush();
        expect(alert).not.toHaveBeenCalled();
        expect(mockNewCode).toHaveBeenCalled();
        alert.mockRestore();
    });

    it('sends your code through the share sheet', async () => {
        const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
        await open({ signedIn: true });
        await fireEvent.press(screen.getByText('Send my code'));
        expect(share.mock.calls[0][0]).toMatchObject({ message: expect.stringContaining('K7MP2Q') });
        share.mockRestore();
    });

    it('asks before a new code cancels the one your partner may hold, and says the new one aloud', async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockNewCode.mockResolvedValue({ code: 'H4TW9B' });
        mockHome = NAMED;
        await open({ signedIn: true });
        await fireEvent.press(screen.getByText('Make a new code'));
        expect(mockNewCode).not.toHaveBeenCalled();

        const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
        await act(async () => buttons[1].onPress?.());
        await flush();
        expect(mockNewCode).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText('Ece. Your code: H, 4, T, W, 9, B. Lasts 24 hours')).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith('Your code: H, 4, T, W, 9, B');
        alert.mockRestore();
    });

    it('shows a failed new code on your page, though the old code is still there', async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockNewCode.mockResolvedValue({ problem: 'offline' });
        mockHome = NAMED;
        await open({ signedIn: true });
        await fireEvent.press(screen.getByText('Make a new code'));
        const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
        await act(async () => buttons[1].onPress?.());
        await flush();
        expect(screen.getByText(/You're offline/)).toBeOnTheScreen();
        expect(screen.getByLabelText(/Your code: K, 7, M, P, 2, Q\. You're offline/)).toBeOnTheScreen();
        expect(screen.queryByText('Lasts 24 hours')).toBeNull();
        alert.mockRestore();
    });

    it('says why a look-alike did nothing', async () => {
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'O');
        await flush();
        expect(screen.getByText('Codes never use I, L or O.')).toBeOnTheScreen();
    });

    it('checks by itself at six characters, and not before', async () => {
        mockPreview.mockResolvedValue({ inviterName: 'Deniz' });
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'H4TW9');
        await flush();
        expect(mockPreview).not.toHaveBeenCalled();
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'h4tw9b');
        await flush();
        expect(mockPreview).toHaveBeenCalledWith('H4TW9B');
    });

    it('doesn\'t check again for a key that changes nothing, since a wrong code counts as a failed try', async () => {
        mockPreview.mockResolvedValue({ problem: 'invalid' });
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'H4TW9B');
        await flush();
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'H4TW9BX');
        await flush();
        expect(mockPreview).toHaveBeenCalledTimes(1);
    });

    it('does check an unchanged code again when the last check never got an answer', async () => {
        mockPreview.mockResolvedValue({ problem: 'offline' });
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'H4TW9B');
        await flush();
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'H4TW9BX');
        await flush();
        expect(mockPreview).toHaveBeenCalledTimes(2);
    });

    it('ignores a late answer for a code that has since changed, and pairs with the one it shows', async () => {
        const answers: Record<string, (value: unknown) => void> = {};
        mockPreview.mockImplementation((code: string) => new Promise((resolve) => { answers[code] = resolve; }));
        mockRedeem.mockResolvedValue('ok');
        await open({ signedIn: true });
        // fireEvent would wait for the handlers, which this test holds open.
        await act(async () => {
            void screen.getByLabelText(CODE_FIELD).props.onChangeText('H4TW9B');
        });
        await act(async () => {
            void screen.getByLabelText(CODE_FIELD).props.onChangeText('H4TW9C');
        });

        await act(async () => answers.H4TW9C({ inviterName: 'Deniz' }));
        await flush();
        await act(async () => answers.H4TW9B({ inviterName: 'Someone Else' }));
        await flush();
        expect(screen.getByText('Pair with Deniz')).toBeOnTheScreen();

        pastTheGuard();
        await fireEvent.press(screen.getByText('Pair with Deniz'));
        await flush();
        expect(mockRedeem).toHaveBeenCalledWith('H4TW9C');
    });

    it.each([
        ['invalid', /doesn't match anyone/],
        ['expired', /has expired/],
        ['used', /already been used/],
        ['own_code', /your own code/],
        ['partner_paired', /already paired/],
        ['rate_limited', /Try again in an hour/],
        ['offline', /Your code is safe/],
    ])('explains %s on the page, aloud too, keeping what was typed', async (problem, text) => {
        mockPreview.mockResolvedValue({ problem });
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'H4TW9B');
        await flush();
        expect(screen.getByText(text)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(text));
        expect(screen.getByText('Send my code')).toBeOnTheScreen();
        expect(screen.getByLabelText(CODE_FIELD).props.value).toBe('H4TW9B');
    });
});

describe('who it is', () => {
    async function toConfirm() {
        mockHome = NAMED;
        mockPreview.mockResolvedValue({ inviterName: 'Deniz' });
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'H4TW9B');
        await flush();
    }

    it('names you both on the two pages, says who aloud, and nothing has happened yet', async () => {
        await toConfirm();
        expect(screen.getByText('Ece')).toBeOnTheScreen();
        expect(screen.getByText('Deniz')).toBeOnTheScreen();
        expect(screen.getByText('Pair with Deniz')).toBeOnTheScreen();
        expect(screen.getByText("That's not them")).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith('Pair with Deniz. Share your day and write notes to each other?');
        expect(mockRedeem).not.toHaveBeenCalled();
    });

    it('stays on the paper pages: the diary\'s drawing belongs to the morph', async () => {
        await toConfirm();
        expect(screen.queryByLabelText(ART)).toBeNull();
    });

    it('goes back with nothing done when it\'s not them', async () => {
        await toConfirm();
        await fireEvent.press(screen.getByText("That's not them"));
        await flush();
        expect(screen.getByText('Send my code')).toBeOnTheScreen();
        expect(mockRedeem).not.toHaveBeenCalled();
        expect(screen.getByLabelText(CODE_FIELD).props.value).toBe('');
    });

    it('pairs only when asked, with the code that was typed', async () => {
        mockRedeem.mockResolvedValue('ok');
        await toConfirm();
        pastTheGuard();
        await fireEvent.press(screen.getByText('Pair with Deniz'));
        await flush();
        expect(mockRedeem).toHaveBeenCalledWith('H4TW9B');
    });

    it('ignores a press in the moment Pair appears, when a finger on the keyboard could land on it', async () => {
        await toConfirm();
        await fireEvent.press(screen.getByText('Pair with Deniz'));
        await flush();
        expect(mockRedeem).not.toHaveBeenCalled();
    });

    it('can\'t be backed out of while Pair is on its way', async () => {
        mockRedeem.mockImplementation(() => new Promise(() => {}));
        await toConfirm();
        pastTheGuard();
        const notThem = screen.getByRole('button', { name: "That's not them" });
        // fireEvent would wait for the handler, which this test holds open.
        await act(async () => {
            void fireEvent.press(screen.getByRole('button', { name: 'Pair with Deniz' }));
        });
        await fireEvent.press(notThem);
        await flush();
        expect(screen.queryByText('Send my code')).toBeNull();
    });

    it('returns to the pages and explains, aloud too, if it failed', async () => {
        mockRedeem.mockResolvedValue({ problem: 'expired' });
        await toConfirm();
        pastTheGuard();
        await fireEvent.press(screen.getByText('Pair with Deniz'));
        await flush();
        expect(screen.getByText(/has expired/)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith(expect.stringMatching(/has expired/));
    });
});

describe('under Reduce Motion', () => {
    it('shows who it is on the pages, and pressing Pair ends on the settled mark and its line', async () => {
        mockReduced = true;
        mockHome = NAMED;
        mockPreview.mockResolvedValue({ inviterName: 'Deniz' });
        mockRedeem.mockResolvedValue('ok');
        await open({ signedIn: true });
        await fireEvent.changeText(screen.getByLabelText(CODE_FIELD), 'H4TW9B');
        await flush();
        expect(screen.getByText('Pair with Deniz')).toBeOnTheScreen();
        expect(screen.queryByLabelText(ART)).toBeNull();

        pastTheGuard();
        await fireEvent.press(screen.getByText('Pair with Deniz'));
        await flush();
        expect(mockRedeem).toHaveBeenCalledWith('H4TW9B');

        // redeemCode refreshes the snapshot, and the query re-renders the sheet with the couple.
        mockHome = PAIRED;
        await screen.rerender(<PairScreen />);
        expect(screen.getByLabelText(ART)).toBeOnTheScreen();
        expect(screen.getByText('You and Deniz are on the same page.')).toBeOnTheScreen();
        expect(screen.getByText('Done')).toBeOnTheScreen();
    });
});

describe('the layouts', () => {
    const PHONE = { width: 393, height: 852, scale: 3, fontScale: 1 };
    const LANDSCAPE = { width: 852, height: 393, scale: 3, fontScale: 1 };
    const jestWindow = Dimensions.get('window');
    afterEach(async () => {
        await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
    });

    it('pins the actions at thumb height on a phone, out of the scroll', async () => {
        await act(async () => Dimensions.set({ window: PHONE, screen: PHONE }));
        await open({ signedIn: false });
        expect(screen.getByText('Continue with Apple')).toBeOnTheScreen();
        expect(within(screen.getByTestId('pair-scroll')).queryByText('Continue with Apple')).toBeNull();
    });

    // The Jest window is font scale 2.
    it('keeps the same room for the actions at every step, so Done lands where Pair was', async () => {
        await act(async () => Dimensions.set({ window: PHONE, screen: PHONE }));
        mockHome = PAIRED;
        await open({ signedIn: true });
        const block = StyleSheet.flatten(screen.getByTestId('pair-actions').props.style);
        expect(block.minHeight).toBe(56 + space.s + 44);
    });

    it('pins them at the largest text sizes as well, so they\'re never below the fold', async () => {
        await open({ signedIn: false });
        expect(screen.getByText('Continue with Apple')).toBeOnTheScreen();
        expect(within(screen.getByTestId('pair-scroll')).queryByText('Continue with Apple')).toBeNull();
    });

    it('puts them on the trailing side of a landscape phone, in the scroll', async () => {
        await act(async () => Dimensions.set({ window: LANDSCAPE, screen: LANDSCAPE }));
        await open({ signedIn: false });
        expect(within(screen.getByTestId('pair-scroll')).getByText('Continue with Apple')).toBeOnTheScreen();
    });

    it('fits three cells on a page, even in a narrow spread', () => {
        const zoomedSmallIphone = 320 - 2 * space.l;
        const smallLandscape = ((568 - 2 * space.l - space.l) * 6) / 11;
        expect(cellScaleFor(393 - 2 * space.l, false)).toBe(1);
        for (const spread of [zoomedSmallIphone, smallLandscape]) {
            const scale = cellScaleFor(spread, false);
            const room = (spread - space.s) / 2 - 2 * space.s - 2 * edgeWidth;
            expect(scale).toBeLessThan(1);
            expect(CODE_WIDTH * scale).toBeLessThanOrEqual(room + 0.001);
        }
        expect(cellScaleFor(zoomedSmallIphone, true)).toBe(1.2);
    });
});

describe('once there is a couple', () => {
    it('goes to the morph, whichever phone got there first, and Done closes the sheet', async () => {
        const { router } = jest.requireMock<{ router: { back: jest.Mock } }>('expo-router');
        router.back.mockClear();
        mockHome = PAIRED;
        await open({ signedIn: true });

        expect(screen.getByText('You and Deniz are on the same page.')).toBeOnTheScreen();
        expect(screen.getByLabelText(ART)).toBeOnTheScreen();
        expect(announce).toHaveBeenCalledWith('You and Deniz are on the same page.');
        expect(mockMarkCelebrated).toHaveBeenCalledTimes(1);
        expect(mockMarkCelebrated).toHaveBeenCalledWith('c');

        await fireEvent.press(screen.getByText('Done'));
        expect(router.back).toHaveBeenCalled();
    });

    it('plays once per person: opened again, the mark is just there', async () => {
        mockCelebrated = true;
        mockHome = PAIRED;
        await open({ signedIn: true });
        expect(screen.getByText('You and Deniz are on the same page.')).toBeOnTheScreen();
        expect(mockMarkCelebrated).not.toHaveBeenCalled();
    });
});
