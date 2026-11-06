// covers: FR-PAR-003, NFR-I18N-001, NFR-A11Y-003
// break-ui's worst case for your partner's day (Phase 2 D2), kept as a test. Layout itself waits for the TestFlight
// device check at AX5; this pins that the worst case renders, in Turkish, with the right strings and counts.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { LoveNoteSheet } from '../../../components/loveNote/LoveNoteSheet';
import { language } from '../../../i18n';
import { useLoveNoteSheet } from '../../../stores/loveNoteSheetStore';
import { usePartnerGlance, type PartnerGlance } from '../../../server/partnerGlance';
import { useTheme } from '../../../theme/useTheme';
import { PartnerStrip } from '../../classic/PartnerStrip';
import PartnerScreen from '../PartnerScreen';

jest.setTimeout(30_000);

// jest.mock calls are hoisted above these imports, so the Turkish locale is in place before i18n loads.
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }] }));
jest.mock('expo-router', () => ({
    ...jest.requireActual('expo-router'),
    router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
    usePreventRemove: jest.fn(),
}));
jest.mock('../../../server/client', () => ({ Offline: class extends Error {}, rpc: jest.fn() }));
jest.mock('../../../server/home', () => ({ refreshHome: jest.fn(async () => {}) }));

const AX5_SE = { width: 320, height: 568, scale: 2, fontScale: 3.1 };
const LONG_NAME = 'Şule Çağla İğdemiroğlu Öztürkmenoğulları 🍅🌱 Güneşsöğüşçü Ğ';
const today = { day_key: '2026-11-06', focus_ms: 26 * 3_600_000, sessions: 42, goal_hit: true, goal_minutes: 480 };
const glance = (over: Partial<PartnerGlance> = {}): PartnerGlance => ({
    coupleId: 'c',
    name: LONG_NAME,
    today,
    updatedAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    fetchedAt: Date.now(),
    ...over,
});

function Strip({ value }: { value: PartnerGlance }) {
    const { tokens } = useTheme();
    return <PartnerStrip glance={value} notice={null} onPress={() => {}} tokens={tokens} />;
}

let jestWindow: ReturnType<typeof Dimensions.get>;
beforeEach(async () => {
    jestWindow = Dimensions.get('window');
    await act(async () => Dimensions.set({ window: AX5_SE, screen: AX5_SE }));
});
afterEach(async () => {
    await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
});

describe('your partner\'s day, in Turkish at AX5 on an iPhone SE', () => {
    it('follows a Turkish device', () => {
        expect(language).toBe('tr');
    });

    it('the strip: a 60-character name, and more sessions than fit', async () => {
        await render(<Strip value={glance()} />);
        expect(screen.getByText(LONG_NAME)).toBeOnTheScreen();
        expect(screen.getByText('+39', { includeHiddenElements: true })).toBeOnTheScreen();
        expect(screen.getByText(/bugün 1\.?560 dk/)).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: new RegExp(`^${LONG_NAME}, 42 oturum`) })).toBeOnTheScreen();
    });

    it('the strip: nothing yet', async () => {
        await render(<Strip value={glance({ today: null })} />);
        expect(screen.getByText('Bugün henüz bir şey yok')).toBeOnTheScreen();
    });

    it('the sheet: the longest day, on one row of whole cells, with the name never in the sentence', async () => {
        await act(async () => usePartnerGlance.setState({ glance: glance(), gone: null }));
        await render(<PartnerScreen />);
        await act(async () => {});
        expect(screen.getByRole('header', { name: LONG_NAME })).toBeOnTheScreen();
        expect(screen.getByText(/42 oturum · 1\.?560 dk · hedef 480 dk/)).toBeOnTheScreen();
        expect(screen.getByText('3 saat önce güncellendi')).toBeOnTheScreen();
    });

    it('the editor: 280 characters of Turkish and emoji, and no more', async () => {
        const longest = 'Çağrı, sınavın için çok heyecanlıyım 🍅🌱 '.repeat(10);
        await act(async () => usePartnerGlance.setState({ glance: glance(), gone: null }));
        await render(<PartnerScreen />);
        await act(async () => {});
        await fireEvent.press(screen.getByRole('button', { name: /için not yaz$/ }));
        await fireEvent.changeText(screen.getByLabelText(/için notun$/), longest);
        const value: string = screen.getByLabelText(/için notun$/).props.value;
        expect(value.length).toBeLessThanOrEqual(280);
        expect(value.length).toBeGreaterThan(270);
        // It's cut on a whole character, so the end can't be half an emoji.
        expect(value.charCodeAt(value.length - 1) & 0xfc00).not.toBe(0xd800);
    });

    it('the note itself: the longest one, from the longest name', async () => {
        const longest = 'Çağrı, sınavın için çok heyecanlıyım 🍅🌱 '.repeat(7);
        await act(async () => useLoveNoteSheet.getState().open(longest, LONG_NAME));
        await render(<LoveNoteSheet />);
        expect(screen.getByRole('header', { name: `${LONG_NAME} sana yazdı` })).toBeOnTheScreen();
        expect(screen.getByText(longest)).toBeOnTheScreen();
        await act(async () => useLoveNoteSheet.getState().close());
    });

    it('the sheet: a person with no name yet', async () => {
        await act(async () => usePartnerGlance.setState({ glance: glance({ name: null, today: null, updatedAt: null }), gone: null }));
        await render(<PartnerScreen />);
        await act(async () => {});
        expect(screen.getByRole('header', { name: 'Partnerin' })).toBeOnTheScreen();
    });
});
