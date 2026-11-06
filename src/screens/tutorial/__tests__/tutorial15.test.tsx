// covers: FR-ONB-002, FR-ONB-001
// The 1.5 tutorial, and pairing in the general one (Phase 2 D5).
import { Dimensions } from 'react-native';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { resetStorage } from '../../../__fixtures__/storage/resetStorage';
import { useAccountStore } from '../../../server/account';
import { usePartnerGlance } from '../../../server/partnerGlance';
import { StoreGate } from '../../../stores/StoreGate';
import en from '../../../i18n/en.json';
import tr from '../../../i18n/tr.json';
import { loadSync, save, STORAGE_KEYS } from '../../../utils/storage';
import { useSettingsStore } from '../../../stores/settingsStore';
import TimerScreen from '../../TimerScreen';
import { currentBeat, currentStep, isLastBeat, useTourStore } from '../tourStore';
import { useTourMoveOnClose } from '../useTour';
import { GENERAL, TUTORIALS, VERSION_1_5, dueTutorial, latestTutorialVersion, withPairStep, type LineContext } from '../tutorials';

jest.useFakeTimers();
jest.setTimeout(30_000);

jest.mock('../../../constants/features', () => ({
    ...jest.requireActual('../../../constants/features'),
    PAIRING_ENABLED: true,
    STARTUP_REPORTS_ENABLED: false,
}));
jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    getPermissionsAsync: jest.fn(async () => ({ granted: false })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
    scheduleNotificationAsync: jest.fn(async () => 'test-notification'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    setNotificationChannelAsync: jest.fn(async () => null),
}));
jest.mock('expo-router', () => {
    const Link = Object.assign(({ children }: { children: React.ReactNode }) => children, {
        Trigger: ({ children }: { children: React.ReactNode }) => children,
        Menu: () => null,
        MenuAction: () => null,
    });
    return {
        ...jest.requireActual('expo-router'),
        Link,
        router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true },
    };
});
jest.mock('../../../startup/deferredStartup', () => ({
    ...jest.requireActual('../../../startup/deferredStartup'),
    runAfterInteractive: (_name: string, run: () => unknown) => {
        run();
        return () => {};
    },
}));

const PHONE = { width: 393, height: 852, scale: 3, fontScale: 1 };
const jestWindow = Dimensions.get('window');
const CONTEXT: LineContext = { audience: 'fresh', replay: false, goalOn: false, flyAvailable: true, weekEmpty: false, breakNext: false, paired: false };

async function settle(ms = 800) {
    await act(async () => {
        jest.advanceTimersByTime(ms);
    });
    await act(async () => {});
    await act(async () => {
        jest.advanceTimersByTime(ms);
    });
}

async function show() {
    await render(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate><TimerScreen /></StoreGate>
        </GestureHandlerRootView>,
    );
    await settle();
}

beforeEach(async () => {
    await resetStorage();
    await save(STORAGE_KEYS.WELCOME, { seen: true });
    useTourStore.setState({ run: null, muted: false });
    await act(async () => {
        useAccountStore.setState({ present: false, sessionEnded: false, notice: null });
        usePartnerGlance.setState({ glance: null, gone: null, notes: [], shown: [] });
        Dimensions.set({ window: PHONE, screen: PHONE });
    });
});

afterEach(async () => {
    await act(async () => Dimensions.set({ window: jestWindow, screen: jestWindow }));
});

describe('which tutorial is due', () => {
    it('gives someone updating from 1.4 the 1.5 tour', () => {
        expect(dueTutorial('1.4')?.id).toBe('v1.5');
    });

    it('gives a new install, or someone from 1.3.1, the general one', () => {
        expect(dueTutorial(null)?.id).toBe('general');
    });

    it('asks nothing more once either is finished', () => {
        expect(latestTutorialVersion(TUTORIALS)).toBe('1.5');
        expect(dueTutorial(latestTutorialVersion(TUTORIALS))).toBeNull();
    });
});

describe('the steps', () => {
    it('keeps the pair taking turns, with the new step before the last', () => {
        expect(GENERAL.steps.map((s) => s.id)).toEqual(['presets', 'today', 'modes', 'stats', 'notes', 'pair', 'invite']);
        expect(GENERAL.steps.map((s) => s.speaker)).toEqual(['pomo', 'doro', 'pomo', 'doro', 'pomo', 'doro', 'pomo']);
    });

    it('brings its own lead back to the Timer, so the last step needs none', () => {
        const invite = { ...GENERAL.steps[6], speaker: 'doro' as const, lead: GENERAL.steps[5].lead };
        const steps = withPairStep(GENERAL.steps.slice(0, 5).concat(invite));
        expect(steps[5].lead?.screen).toBe('notes');
        expect(steps[5].here.screen).toBe('timer');
        expect(steps[6].lead).toBeUndefined();
        expect(steps[6].speaker).toBe('pomo');
    });

    it('has two steps in the 1.5 tour, taking turns, both at the strip', () => {
        expect(VERSION_1_5.steps.map((s) => s.speaker)).toEqual(['pomo', 'doro']);
        for (const step of VERSION_1_5.steps) {
            expect(step.here.target).toEqual({ opening: 'partner' });
            expect(step.lead).toBeUndefined();
        }
    });

    it('says every line in both languages, inside the tour\'s budget', () => {
        const lookup = (tree: object, key: string): unknown =>
            key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], tree);
        const lines = new Map<string, Record<string, string>>();
        for (const paired of [false, true]) {
            for (const step of [...VERSION_1_5.steps, GENERAL.steps[5]]) {
                for (const beat of [step.lead, step.here]) {
                    if (!beat) continue;
                    const line = beat.line({ ...CONTEXT, paired });
                    lines.set(line.key, line.names ?? {});
                }
            }
        }
        expect(lines.size).toBe(6);
        for (const [tree, budget] of [[en, 90], [tr, 110]] as const) {
            for (const [key, names] of lines) {
                const text = lookup(tree, key);
                expect(typeof text).toBe('string');
                const filled = (text as string).replace(/\{\{(\w+)\}\}/g, (_, n: string) => String(lookup(tree, names[n])));
                expect(filled).not.toMatch(/\{\{|undefined/);
                expect(Array.from(filled).length).toBeLessThanOrEqual(budget);
            }
        }
    });
});

describe('on the Timer, updating from 1.4', () => {
    beforeEach(async () => {
        await save(STORAGE_KEYS.TUTORIAL, { seen: '1.4' });
    });

    it('shows the two steps at the strip, and asks nothing again once done', async () => {
        await show();
        expect(currentStep(useTourStore.getState().run!)?.id).toBe('pair');
        expect(screen.getByLabelText("Pomo: New! Pair with your partner here, and see each other's day.")).toBeOnTheScreen();

        await act(async () => {
            await fireEvent.press(screen.getByText('Next'));
        });
        await settle();
        expect(currentStep(useTourStore.getState().run!)?.id).toBe('pairNotes');
        expect(screen.getByLabelText('Doro: Then you can leave each other notes. They appear after a focus.')).toBeOnTheScreen();

        await act(async () => {
            await fireEvent.press(screen.getByText('Done'));
        });
        expect(useTourStore.getState().run).toBeNull();
        expect(useTourStore.getState().seen).toBe('1.5');
    });
});

const stored = () => loadSync<Record<string, unknown> | null>(STORAGE_KEYS.TUTORIAL, null);

describe('walking the general tour', () => {
    it('goes from Notes back to the Timer for the new step, then to the invitation', async () => {
        await save(STORAGE_KEYS.TUTORIAL, {});
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        const walk = () => {
            const run = useTourStore.getState().run!;
            return `${currentStep(run)?.id}:${run.beat}:${currentBeat(run)?.screen}`;
        };
        const seen = [walk()];
        for (let i = 0; i < 20 && !isLastBeat(useTourStore.getState().run!); i++) {
            useTourStore.getState().next();
            seen.push(walk());
        }
        expect(seen.slice(-5)).toEqual(['notes:lead:stats', 'notes:here:notes', 'pair:lead:notes', 'pair:here:timer', 'invite:here:timer']);
        useTourStore.setState({ run: null });
    });
});

describe('a kill part-way through', () => {
    const kill = () => useTourStore.setState({ run: null });

    it('keeps what was seen, so someone updating isn\'t made a first-timer, and resumes once', async () => {
        await save(STORAGE_KEYS.TUTORIAL, { seen: '1.4' });
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        expect(stored()).toEqual({ seen: '1.4', resumeAt: 0 });
        useTourStore.getState().next();
        expect(stored()).toEqual({ seen: '1.4', resumeAt: 1 });

        kill();
        useTourStore.getState().hydrate();
        expect(useTourStore.getState().seen).toBe('1.4');
        useTourStore.getState().start({ replay: false });
        expect(currentStep(useTourStore.getState().run!)?.id).toBe('pairNotes');

        // Killed again: that was its one resume, so it counts as seen and never nags.
        kill();
        useTourStore.getState().hydrate();
        expect(useTourStore.getState().seen).toBe('1.5');
        useTourStore.getState().start({ replay: false });
        expect(useTourStore.getState().run).toBeNull();
    });

    it('resumes someone mid-way through the shipped six-step tour on a step, adding one and skipping none', async () => {
        await save(STORAGE_KEYS.TUTORIAL, { resumeAt: 5 });
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        const run = useTourStore.getState().run!;
        expect(currentStep(run)?.id).toBe('pair');
        // On the Timer, its tab was never pressed, so its lead would show nothing there.
        expect(run.beat).toBe('here');
        kill();
    });
});

describe('closing a sheet the strip opened', () => {
    it('moves on from the step that suggested it, so it isn\'t said again', async () => {
        await save(STORAGE_KEYS.TUTORIAL, { seen: '1.4' });
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        const { unmount } = await renderHook(() => useTourMoveOnClose());
        await unmount();
        expect(currentStep(useTourStore.getState().run!)?.id).toBe('pairNotes');
        useTourStore.setState({ run: null });
    });

    it('leaves the last step alone, where moving on would end the tour', async () => {
        await save(STORAGE_KEYS.TUTORIAL, { seen: '1.4' });
        useTourStore.getState().hydrate();
        useTourStore.getState().start({ replay: false });
        useTourStore.getState().next();
        const { unmount } = await renderHook(() => useTourMoveOnClose());
        await unmount();
        expect(currentStep(useTourStore.getState().run!)?.id).toBe('pairNotes');
        useTourStore.setState({ run: null });
    });
});

describe('someone already paired', () => {
    const glance = { coupleId: 'c', name: 'Deniz', today: null, updatedAt: null, fetchedAt: Date.now() };

    it.each(['ring', 'spread'] as const)('says the strip is them, then doesn\'t repeat itself, on %s', async (classicLayout) => {
        await save(STORAGE_KEYS.TUTORIAL, { seen: '1.4' });
        await act(async () => {
            useAccountStore.setState({ present: true });
            usePartnerGlance.setState({ glance });
        });
        await show();
        await act(async () => useSettingsStore.getState().updateSettings({ classicLayout }));
        await settle();
        expect(screen.getByLabelText(/Pomo: This is your partner's day/)).toBeOnTheScreen();
        await act(async () => {
            await fireEvent.press(screen.getByText('Next'));
        });
        await settle();
        expect(screen.getByLabelText('Doro: Your notes to each other appear after a focus.')).toBeOnTheScreen();
        await act(async () => useSettingsStore.getState().updateSettings({ classicLayout: 'ring' }));
        useTourStore.setState({ run: null });
    });
});

describe('a replay during a session', () => {
    it('skips pairing, as it skips the presets and the invitation', () => {
        useTourStore.getState().start({ replay: true, sessionActive: true });
        const run = useTourStore.getState().run!;
        expect(run.steps.map((i) => GENERAL.steps[i].id)).toEqual(['today', 'modes', 'stats', 'notes']);
        useTourStore.setState({ run: null });
    });
});
