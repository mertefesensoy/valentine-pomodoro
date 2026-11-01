import { act, renderRouter, screen } from 'expo-router/testing-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { resetStorage } from '../__fixtures__/storage/resetStorage';
import { ensureMigrated } from '../utils/storageMigration';
// App.tsx's module scope runs here, as it does when the root layout first
// loads, before anything renders.
import '../App';

// The splash under Expo Router (Phase 1 B6). The router hides it when its
// navigator first mounts unless the app has called preventAutoHideAsync, and
// its navigator now sits above StoreGate. So the app keeps the splash up
// itself, and hides it from ThemedApp, which renders only once the stores are
// hydrated: on the launch right after the update, that is after the one-time
// AsyncStorage → MMKV copy.
jest.setTimeout(60_000);

jest.mock('expo-notifications', () => ({
    ...jest.requireActual('expo-notifications'),
    // Fails on jest-expo's event-emitter mock; not under test (router.test.tsx).
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: () => {} })),
}));
jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: jest.fn(async () => true),
    hideAsync: jest.fn(async () => {}),
}));
jest.mock('../hooks/useUpdateCheck', () => ({
    useUpdateCheck: () => ({ checkForUpdates: jest.fn() }),
}));
jest.mock('../ads/AdManager', () => ({
    AdManager: { init: jest.fn(async () => {}), preload: jest.fn(), showIfReady: jest.fn(() => false) },
}));

beforeEach(async () => {
    await resetStorage();
    jest.mocked(SplashScreen.hideAsync).mockClear();
});

// covers: FR-MIG-001
describe('the splash', () => {
    it('is held from import, before anything renders', () => {
        expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
    });

    it('stays up while the one-time migration runs, and hides once the app has rendered', async () => {
        // The migration's first read of AsyncStorage, held open.
        let finishRead!: (keys: string[]) => void;
        jest.spyOn(AsyncStorage, 'getAllKeys').mockImplementationOnce(
            () => new Promise<readonly string[]>((resolve) => (finishRead = resolve)) as never,
        );

        await renderRouter('./app', { initialUrl: '/' });
        await act(async () => {});
        expect(screen.queryByText('Start focus')).toBeNull();
        expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

        await act(async () => finishRead([]));
        expect(screen.getByText('Start focus')).toBeOnTheScreen();
        expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    });

    it('hides on the first render on every later launch', async () => {
        await ensureMigrated();

        await renderRouter('./app', { initialUrl: '/' });
        expect(screen.getByText('Start focus')).toBeOnTheScreen();
        expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    });
});
