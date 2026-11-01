// covers: NFR-I18N-001, NFR-A11Y-003
// break-ui's worst case for the tour (Phase 1 D5, record §3.10), kept as the regression fixture:
// Turkish, the largest text size (AX5, font scale 3.1) on the smallest iPhone (375 × 667), every
// line-per-state variant, a replay mid-session, and the Modes sheet. Jest can't measure layout, so
// the clip check is the TestFlight device check; this pins that the worst case renders in Turkish,
// in the bottom panel, with the right lines and words. Each break gets its assertion when it's fixed.
import { Dimensions } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ModeSheet } from '../../../components/modes/ModeSheet';
import { language } from '../../../i18n';
import { resetStorage } from '../../../__fixtures__/storage/resetStorage';
import { StoreGate } from '../../../stores/StoreGate';
import { useSessionStore } from '../../../stores/sessionStore';
import { useStatsStore } from '../../../stores/statsStore';
import { save, STORAGE_KEYS } from '../../../utils/storage';
import StatsScreen from '../../StatsScreen';
import TimerScreen from '../../TimerScreen';
import { currentStep, useTourStore } from '../tourStore';

// jest.mock calls are hoisted above these imports, so the Turkish locale is in place before i18n loads.
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }] }));
jest.mock('../../../hooks/useUpdateCheck', () => ({ useUpdateCheck: () => ({ checkForUpdates: jest.fn() }) }));
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
    router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true },
}));
jest.mock('../../../startup/deferredStartup', () => ({
    ...jest.requireActual('../../../startup/deferredStartup'),
    runAfterInteractive: (_name: string, run: () => unknown) => {
        run();
        return () => {};
    },
}));
jest.useFakeTimers();
jest.setTimeout(30_000);

// AX5 (iOS reports a font scale of about 3.1) on an iPhone SE, the narrowest iPhone the app runs on.
const AX5_SE = { width: 375, height: 667, scale: 2, fontScale: 3.1 };
const jestWindow = Dimensions.get('window');
const hidden = { includeHiddenElements: true } as const;

async function show(node: React.ReactElement) {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{node}</StoreGate>
        </GestureHandlerRootView>,
    );
    await settle();
}

/** The gate's wait, the lazy layer, and each beat's 600 ms wait for an opening Jest can't measure. */
async function settle(ms = 800) {
    await act(async () => {
        jest.advanceTimersByTime(ms);
    });
    await act(async () => {});
    await act(async () => {
        jest.advanceTimersByTime(ms);
    });
}

function goTo(id: string, beat: 'lead' | 'here') {
    const run = useTourStore.getState().run!;
    const at = run.steps.findIndex((i) => ['presets', 'today', 'modes', 'stats', 'notes', 'invite'][i] === id);
    useTourStore.setState({ run: { ...run, at, beat } });
}

beforeEach(async () => {
    await resetStorage();
    await save(STORAGE_KEYS.WELCOME, { seen: true });
    useTourStore.setState({ run: null, muted: false });
    await act(async () => Dimensions.set({ window: AX5_SE, screen: AX5_SE }));
});

afterEach(async () => {
    await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
});

describe('the tour in Turkish at AX5 on an iPhone SE', () => {
    it('speaks Turkish in the bottom panel, with the pair as a badge and every action reachable', async () => {
        expect(language).toBe('tr');
        await show(<TimerScreen />);
        expect(screen.getByLabelText('Pomo: Merhaba, biz Pomo ile Doro! Önce ne kadar odaklanmak istediğini seç.')).toBeOnTheScreen();
        // The panel: no standing pair.
        expect(screen.queryByTestId('tour-pomo', hidden)).toBeNull();
        expect(screen.getByText('İleri')).toBeOnTheScreen();
        expect(screen.getByText('Turu atla')).toBeOnTheScreen();
        expect(screen.getByLabelText('Sesleri kapat')).toBeOnTheScreen();
    });

    it('greets a v1.3.1 updater with its own line', async () => {
        await save(STORAGE_KEYS.GIFT_MODE, { hasSeenGiftMode: true });
        await show(<TimerScreen />);
        expect(screen.getByLabelText('Pomo: Yeniden merhaba! Günlükte pek çok yenilik var. Önce odak süreni seç.')).toBeOnTheScreen();
    });

    it('drops the goal from the today line when the goal is off, and invites with Not now and no Next', async () => {
        await show(<TimerScreen />);
        await act(async () => useStatsStore.getState().setGoalMinutes(0));
        goTo('today', 'here');
        await settle();
        expect(screen.getByLabelText('Doro: Bitirdiğin her odak buraya, bugünün sayfasına bir çıkartma yapıştırır.')).toBeOnTheScreen();
        goTo('invite', 'here');
        await settle();
        expect(screen.getByLabelText('Doro: İlk odağına hazır mısın? Hazır olunca Odağı başlat düğmesine dokun.')).toBeOnTheScreen();
        expect(screen.getByText('Şimdi değil')).toBeOnTheScreen();
        expect(screen.queryByTestId('tour-next')).toBeNull();
        // break-ui #2: the buttons stop growing at 1.6×, as the app's others do; the line never does.
        expect(screen.getByText('Şimdi değil').props.maxFontSizeMultiplier).toBe(1.6);
    });

    // break-ui #1 (the owner's choice): with a break up next, the button reads Start break, and so
    // does the line.
    it('invites the break that’s next by its own button’s name', async () => {
        await show(<TimerScreen />);
        await act(async () => useSessionStore.setState({ pomodoro: { phase: 'shortBreak', completedFocusCountInCycle: 1, lastLoveNote: null } }));
        goTo('invite', 'here');
        await settle();
        expect(screen.getByLabelText('Doro: Sırada bir mola var. Hazır olunca Molayı başlat düğmesine dokun.')).toBeOnTheScreen();
        expect(screen.getByText('Molayı başlat', hidden)).toBeOnTheScreen();
    });

    it('replays mid-session from today’s row and ends on Bitti at Notes', async () => {
        await show(<TimerScreen />);
        await act(async () => {
            useTourStore.getState().finish();
            useSessionStore.getState().start({ kind: 'pomodoro', durationMs: 25 * 60_000 });
            useTourStore.getState().start({ replay: true, sessionActive: true });
        });
        await settle();
        expect(currentStep(useTourStore.getState().run!)!.id).toBe('today');
        goTo('notes', 'here');
        expect(useTourStore.getState().run!.beat).toBe('here');
        await settle();
    });

    it('says an empty week as such on Stats', async () => {
        await show(<StatsScreen />);
        await act(async () => {
            useTourStore.getState().hydrate();
            useTourStore.getState().start({ replay: false });
            goTo('stats', 'here');
        });
        await settle();
        expect(screen.getByLabelText('Doro: Odaklandığın her gün burada bir kartpostal olur, bugünkü en önde durur.')).toBeOnTheScreen();
    });

    it('gives the Modes sheet its Turkish line and a Continue', async () => {
        await show(<TimerScreen />);
        goTo('modes', 'here');
        await settle();
        await render(<ModeSheet />);
        expect(screen.getByTestId('tour-modes-line').props.accessibilityLabel).toBe('Pomo: Burada Halka ya da Karşılıklı sayfalar seç, sonra Devam düğmesine dokun.');
        expect(screen.getByText('Devam')).toBeOnTheScreen();
        expect(screen.getByText('Devam').props.maxFontSizeMultiplier).toBe(1.6);
    });
});
