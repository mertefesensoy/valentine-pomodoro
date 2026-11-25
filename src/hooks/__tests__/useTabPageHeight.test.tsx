import { Platform } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTabPageHeight } from '../useTabPageHeight';

// The page height the Timer and Stats lay out in (the Android closed-test plan, build 1): the window's on iOS, where the
// native tab bar is in the safe area, and on Android the frame LazyTab's provider measures, which ends at the bar.
const frame = useSafeAreaFrame as jest.Mock;
const originalOS = Platform.OS;
const setOS = (os: typeof Platform.OS) => Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });

afterEach(() => {
    setOS(originalOS);
});

it("is the window's height on iOS, whatever the frame says", async () => {
    setOS('ios');
    frame.mockReturnValueOnce({ x: 0, y: 0, width: 390, height: 500 });
    const { result } = await renderHook(() => useTabPageHeight());
    expect(result.current).not.toBe(500);
});

it("is the tab frame's height on Android", async () => {
    setOS('android');
    frame.mockReturnValueOnce({ x: 0, y: 0, width: 411, height: 803 });
    const { result } = await renderHook(() => useTabPageHeight());
    expect(result.current).toBe(803);
});
