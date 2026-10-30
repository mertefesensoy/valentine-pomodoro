import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreGate } from '../../stores/StoreGate';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { AdManager } from '../../ads/AdManager';
import TimerScreen from '../TimerScreen';

// What Classic shows after a completed focus, and in what order (Phase 1 B5):
// the goal celebration first, then the love note, and the interstitial only
// once neither is showing (FR-ADS-001 rule 3). Written against the screen
// before B5 replaced its effect-driven queue, and kept as the check that the
// order didn't change.
jest.useFakeTimers();
jest.setTimeout(30_000);

// Starting with notifications on races a permission request against a 1 s
// timeout; denying settles it at once (as in timerScreenTicks.test.tsx).
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
}));

// The policy says yes to every completion, so what's tested is only when the
// screen asks for the ad, not the frequency caps (AdPolicy's own rules).
jest.mock('../../ads/AdPolicy', () => ({
    AdPolicy: {
        recordSessionCompletion: jest.fn(async () => {}),
        shouldShowAd: jest.fn(() => true),
    },
}));
jest.mock('../../ads/AdManager', () => ({
    AdManager: { showIfReady: jest.fn(() => false) },
}));

const showAd = jest.mocked(AdManager.showIfReady);

const CELEBRATION = 'daily goal reached';
const LOVE_NOTE_CLOSE = 'Close';

async function renderTimerScreen() {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>
                <BottomTabBarHeightContext.Provider value={0}>
                    <TimerScreen />
                </BottomTabBarHeightContext.Provider>
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
    // AdPolicy.recordSessionCompletion() resolves on a microtask.
    await act(async () => {});
}

/** A 1-minute focus, started and run to its end; `goalMinutes` decides whether it reaches the goal. */
async function completeOneMinuteFocus({ goalMinutes, showLoveNotes }: { goalMinutes: number; showLoveNotes: boolean }) {
    await renderTimerScreen();
    await act(() => {
        useSettingsStore.getState().updateSettings({
            durations: { ...useSettingsStore.getState().settings.durations, focus: 1 },
            showLoveNotes,
            // GoalReachedPopup then closes without its exit animation.
            animationsEnabled: false,
        });
        useStatsStore.getState().setGoalMinutes(goalMinutes);
    });
    await press('Start');
    await tick(61_000);
}

beforeEach(async () => {
    await resetStorage();
    showAd.mockClear();
});

// covers: FR-ADS-001, FR-NTE-001
describe('after a completed focus on Classic', () => {
    it('reaching the goal shows the celebration, then the love note, then the ad', async () => {
        await completeOneMinuteFocus({ goalMinutes: 1, showLoveNotes: true });

        expect(screen.getByText(CELEBRATION)).toBeOnTheScreen();
        expect(screen.queryByText(LOVE_NOTE_CLOSE)).toBeNull();
        expect(showAd).not.toHaveBeenCalled();

        // The celebration dismisses itself after 1.4 s; the love note follows.
        await tick(1_400);
        expect(screen.queryByText(CELEBRATION)).toBeNull();
        expect(screen.getByText(LOVE_NOTE_CLOSE)).toBeOnTheScreen();
        expect(showAd).not.toHaveBeenCalled();

        await press(LOVE_NOTE_CLOSE);
        expect(screen.queryByText(LOVE_NOTE_CLOSE)).toBeNull();
        expect(showAd).toHaveBeenCalledTimes(1);

        // Nothing more, however long the screen stays up.
        await tick(30_000);
        expect(showAd).toHaveBeenCalledTimes(1);
    });

    it('below the goal shows the love note, then the ad once it closes by itself', async () => {
        await completeOneMinuteFocus({ goalMinutes: 600, showLoveNotes: true });

        expect(screen.queryByText(CELEBRATION)).toBeNull();
        expect(screen.getByText(LOVE_NOTE_CLOSE)).toBeOnTheScreen();
        expect(showAd).not.toHaveBeenCalled();

        // LoveNoteCard dismisses itself after 8 s.
        await tick(8_000);
        expect(screen.queryByText(LOVE_NOTE_CLOSE)).toBeNull();
        expect(showAd).toHaveBeenCalledTimes(1);
    });

    it('with love notes off, reaching the goal shows the celebration, then the ad', async () => {
        await completeOneMinuteFocus({ goalMinutes: 1, showLoveNotes: false });

        expect(screen.getByText(CELEBRATION)).toBeOnTheScreen();
        expect(showAd).not.toHaveBeenCalled();

        await press('continue');
        expect(screen.queryByText(CELEBRATION)).toBeNull();
        expect(screen.queryByText(LOVE_NOTE_CLOSE)).toBeNull();
        expect(showAd).toHaveBeenCalledTimes(1);
    });
});
