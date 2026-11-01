// covers: NFR-I18N-001, NFR-A11Y-003, FR-STA-003, FR-NTE-001
// break-ui's worst case for Stats, Settings and Notes (Phase 1 D2, record §3.13), kept as the
// regression fixture: Turkish, the largest text size on the smallest iPhone, the longest day, the
// longest durations, the largest goal, 200 notes. Jest can't measure layout, so the clip check is
// the TestFlight device check at AX5; this pins that the worst case renders, in Turkish, with the
// right strings, counts and number formats.
import type { ReactNode } from 'react';
import { Dimensions } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { language } from '../../i18n';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { useNotesStore } from '../../stores/notesStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import LoveNotesScreen from '../LoveNotesScreen';
import SettingsScreen from '../SettingsScreen';
import StatsScreen from '../StatsScreen';

// jest.mock calls are hoisted above these imports, so the Turkish locale is in place before i18n loads.
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }] }));
jest.mock('../../hooks/useUpdateCheck', () => ({ useUpdateCheck: () => ({ checkForUpdates: jest.fn() }) }));
// The note rows' link renders through the real Slot, as on the device (notes.test.tsx explains).
jest.mock('expo-router', () => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { Slot } = jest.requireActual<{ Slot: React.ComponentType<Record<string, unknown>> }>('expo-router/build/ui/Slot');
    const Link = function MockLink(props: { children: ReactNode }) {
        const trigger = React.Children.toArray(props.children).find(
            (child) => React.isValidElement(child) && child.type === Link.Trigger,
        );
        return React.createElement(Slot, { onPress: () => {} }, trigger);
    };
    Link.Trigger = function MockLinkTrigger(props: { children: ReactNode }) {
        return React.createElement(Slot, props);
    };
    Link.Menu = function MockLinkMenu() {
        return null;
    };
    Link.MenuAction = function MockLinkMenuAction() {
        return null;
    };
    return {
        ...jest.requireActual('expo-router'),
        Link,
        router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true },
    };
});

// AX5 (iOS reports a font scale of about 3.1) on an iPhone SE, the narrowest iPhone the app runs on.
const AX5_SE = { width: 375, height: 667, scale: 2, fontScale: 3.1 };

/** The local day key `daysAgo` days before today. */
function keyOf(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The longest realistic week: 16 hours of 25/5 today (32 sessions), a 34-session day, 50-minute
// sessions, single sessions and empty days; the largest goal (FR-STA-004: up to 1,440 minutes),
// which no day reaches; a broken streak with a best behind it.
const WORST_WEEK = {
    days: {
        [keyOf(6)]: { focusSessions: 34, focusMinutes: 850 },
        [keyOf(4)]: { focusSessions: 1, focusMinutes: 25 },
        [keyOf(3)]: { focusSessions: 16, focusMinutes: 800 },
        [keyOf(1)]: { focusSessions: 20, focusMinutes: 500 },
        [keyOf(0)]: { focusSessions: 32, focusMinutes: 800 },
    },
    goalMinutes: 1440,
    streak: { current: 0, best: 12, lastHitDayKey: keyOf(30) },
};

async function show(node: React.ReactElement) {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{node}</StoreGate>
        </GestureHandlerRootView>,
    );
    await act(async () => {});
}

let jestWindow: ReturnType<typeof Dimensions.get>;
beforeEach(async () => {
    await resetStorage();
    jestWindow = Dimensions.get('window');
    await act(async () => Dimensions.set({ window: AX5_SE, screen: AX5_SE }));
});
afterEach(async () => {
    await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
});

describe('D2 worst case, in Turkish at AX5 on an iPhone SE', () => {
    it('follows a Turkish device', () => {
        expect(language).toBe('tr');
    });

    it('Stats: the longest week, as a list with today first', async () => {
        await show(<StatsScreen />);
        await act(async () => useStatsStore.setState(WORST_WEEK));
        // Today: one row of whole cells (D2 record §3.25). The SE's 343 pt card holds six of its
        // 44.2 pt stickers (34 pt grown 1.3×) inside its padding: 5 stickers, then "+27".
        expect(screen.getByLabelText(/^Bugün, 32 oturum, 800 dakika$/)).toBeOnTheScreen();
        expect(screen.getByText('+27')).toBeOnTheScreen();
        // A 34-session day: 4 stickers, then "+30"; empty days are "oturum yok", never "missed".
        expect(screen.getByText('+30')).toBeOnTheScreen();
        expect(screen.getAllByLabelText(/oturum yok$/)).toHaveLength(2);
        // Every day name reads in full (review round S-1): its own line, no line limit.
        for (const name of screen.getAllByText(/^(Pzt|Sal|Çar|Per|Cum|Cmt|Paz) \d+$/)) {
            expect(name).toHaveStyle({ flexBasis: '100%' });
            expect(name.props.numberOfLines).toBeUndefined();
        }
        // All time, grouped in Turkish.
        expect(screen.getByText('Tüm zamanlar: 103 oturum · 2.975 dakika')).toBeOnTheScreen();

        // The fixes (record §3.13). No goal day: the summary says nothing of it (#4).
        expect(screen.getByText('Son 7 gün: 103 oturum')).toBeOnTheScreen();
        // The largest goal, grouped as Turkish writes it, as every count of 1,000 or more is (#6).
        expect(screen.getByText('Hedef 1.440 dk')).toBeOnTheScreen();
        expect(screen.getByText('Bugün 640 dk kaldı')).toBeOnTheScreen();
        // Today's line says what's left with a verb, as Turkish needs (step 6, §3.14).
        expect(screen.getByText(/hedefe 640 dk kaldı/)).toBeOnTheScreen();
        // A streak of 0 says how it starts (the owner's decision).
        expect(screen.getByText('Hedefine ulaştığın gün başlar')).toBeOnTheScreen();
        expect(screen.getByText('En iyi 12')).toBeOnTheScreen();
        // The strip's halves stack at AX5, so no word breaks in a narrow column (#5).
        expect(screen.getByText('Aşk serisi').parent!.parent!.parent!).toHaveStyle({ flexDirection: 'column' });
        // The week in minutes: the same number as the all-time line, written the same way.
        await act(async () => fireEvent.press(screen.getByLabelText('Dakikalar')));
        expect(screen.getByText('Son 7 gün: 2.975 dakika')).toBeOnTheScreen();
    });

    it('Settings: the longest durations and the largest goal', async () => {
        await show(<SettingsScreen />);
        await act(async () => {
            useSettingsStore.getState().updateSettings({
                durations: { focus: 180, shortBreak: 60, longBreak: 120 },
                customDurations: { focus: 180, shortBreak: 60, longBreak: 120 },
                presetChoice: 'custom',
                longBreakEvery: 10,
            });
            useStatsStore.getState().setGoalMinutes(1440);
        });
        expect(screen.getByRole('button', { name: 'Odak' })).toHaveAccessibilityValue({ text: '180 dk' });
        expect(screen.getByRole('button', { name: 'Uzun mola sıklığı' })).toHaveAccessibilityValue({ text: '10 oturumda bir' });
        expect(screen.getByLabelText('Özel')).toBeSelected();
        expect(screen.getByRole('button', { name: 'Özel hedef' })).toHaveAccessibilityValue({ text: '1.440 dk' });
        // The goal's wheel lists every minute up to 1,440 (FR-STA-004).
        await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Özel hedef' })));
        const wheel = screen.getAllByLabelText('Özel hedef')[1];
        expect(wheel.props.items).toHaveLength(1440);
    });

    it('Notes: 200 notes render as a virtualized list', async () => {
        await show(<LoveNotesScreen />);
        const many = Array.from({ length: 200 }, (_, i) => `Not ${i + 1}: odaktan sonra kendine küçük bir ödül ver`);
        await act(async () => useNotesStore.setState({ notes: many }));
        expect(screen.getByText('200 not')).toBeOnTheScreen();
        // Only the first screens' rows are mounted, not 200 swipeable rows with native menus.
        expect(screen.getAllByLabelText(/^Not \d+:/).length).toBeLessThan(50);
    });
});
