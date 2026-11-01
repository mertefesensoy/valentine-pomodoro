// covers: NFR-I18N-001, FR-SET-005, NFR-A11Y-003
// break-ui's worst case for Classic and the welcome (Phase 1 D1, record §3.13), kept as the regression
// fixture: Turkish, the longest durations and cycle, many stickers, a long streak and a long note. Jest
// can't measure layout, so the clip check itself is the TestFlight device check at AX5; this pins
// that the worst case renders, in Turkish, with the right strings and the overflow rules.
import { act, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreGate } from '../../stores/StoreGate';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import { useLoveNoteSheet } from '../../stores/loveNoteSheetStore';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { getTodayKey } from '../../utils/time';
import { language } from '../../i18n';
import { LoveNoteSheet } from '../../components/loveNote/LoveNoteSheet';
import TimerScreen from '../TimerScreen';
import { WelcomeScreen } from '../welcome/WelcomeScreen';

// jest.mock calls are hoisted above these imports, so the Turkish locale is in place before i18n loads.

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }] }));
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

jest.useFakeTimers();
jest.setTimeout(30_000);

// The longest realistic values (limits: focus 1–180 min, long break up to 180, cycle 2–10; notes unbounded).
const WORST = {
    durations: { focus: 180, shortBreak: 30, longBreak: 180 },
    longBreakEvery: 10,
    stickersToday: 32, // 16 hours of 25/5: the realistic most in a day
    streak: 30,
    note: 'Bugün de harikaydın; yarınki sınavdan önce şu notlara bir göz at: https://example.com/ders-notlari/istatistik-final-tekrar-2026-guz-donemi-tum-uniteler, sonra biraz uyu.',
};

async function show(node: React.ReactElement) {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{node}</StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

beforeEach(async () => {
    await resetStorage();
});

describe('Classic, worst case, in Turkish', () => {
    it('follows a Turkish device', () => {
        expect(language).toBe('tr');
    });

    it('fits the longest timer, the longest cycle and a full day of stickers', async () => {
        await show(<TimerScreen />);
        await act(async () => {
            useSettingsStore.getState().updateSettings({ durations: WORST.durations, longBreakEvery: WORST.longBreakEvery });
            useStatsStore.setState((s) => ({
                days: { ...s.days, [getTodayKey()]: { focusSessions: WORST.stickersToday, focusMinutes: 600, goalHit: true } },
            }));
        });
        // The timer at its longest, shrunk to fit one line with steady digits.
        const timer = screen.getByText('180:00');
        expect(timer.props.adjustsFontSizeToFit).toBe(true);
        expect(timer.props.numberOfLines).toBe(1);
        // The phase line in Turkish, with the longest cycle.
        expect(screen.getByText(/10 oturumdan 1./)).toBeOnTheScreen();
        expect(screen.getByText('Odak')).toBeOnTheScreen();
        // A full day of stickers: two rows, then "+n"; the day's count in Turkish for VoiceOver.
        expect(screen.getByLabelText('Bugün 32 oturum')).toBeOnTheScreen();
        expect(screen.getByText(/^\+\d+$/)).toBeOnTheScreen();
        // Turkish controls.
        expect(screen.getByText('Odağı başlat')).toBeOnTheScreen();
        expect(screen.getByText('Atla')).toBeOnTheScreen();
        expect(screen.getByText('Pomo ve Doro hazır, sen ne zaman istersen')).toBeOnTheScreen();
        // No preset matches these durations, so Custom holds them, selected, with its key (build 48, F4).
        expect(screen.getByLabelText('25 dakika odak, 5 dakika mola')).not.toBeSelected();
        expect(screen.getByLabelText("Özel: 180 dakika odak, 30 dakika mola; Ayarlar'da belirlenir")).toBeSelected();
        expect(screen.getByText("Özel: 180 / 30 dk, Ayarlar'da belirlenir", { includeHiddenElements: true })).toBeOnTheScreen();
    });

    it('shows a 30-day streak in the goal moment, wrapping within the row', async () => {
        await show(<TimerScreen />);
        await act(async () => {
            useStatsStore.setState({ goalHitPulse: { dayKey: getTodayKey(), newStreak: WORST.streak } as never });
        });
        expect(screen.getByText('Hedefe ulaştın')).toBeOnTheScreen();
        expect(screen.getByText('30 günlük seri')).toBeOnTheScreen();
    });
});

describe('the welcome and the love note, worst case, in Turkish', () => {
    it('caps the welcome line for the largest text sizes', async () => {
        await show(<WelcomeScreen />);
        const line = screen.getByText('Pomo ve Doro ile tanış.');
        expect(line.props.maxFontSizeMultiplier).toBe(1.6);
        expect(screen.getByText('Başla')).toBeOnTheScreen();
    });

    it('shows a long note with an unbroken URL, in a sheet that scrolls', async () => {
        useLoveNoteSheet.getState().open(WORST.note);
        await show(<LoveNoteSheet />);
        expect(screen.getByText(WORST.note)).toBeOnTheScreen();
        expect(screen.getByText('Sana bir not')).toBeOnTheScreen();
        expect(screen.getByText('Kapat')).toBeOnTheScreen();
        useLoveNoteSheet.getState().close();
    });
});
