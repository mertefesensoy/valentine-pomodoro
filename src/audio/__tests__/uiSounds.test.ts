// covers: FR-SET-004
// D4's three sounds, as Classic plays them (D4 wiring record): loaded once, played from the top,
// silent when Settings › Sound is off, and in an audio session that respects the silent switch and
// mixes with other apps' audio.
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { useSettingsStore } from '../../stores/settingsStore';
import { applyUiAudioMode, loadUiSounds, playUiSound, resetUiSounds } from '../uiSounds';

type FakePlayer = { play: jest.Mock; seekTo: jest.Mock };
const created = () => jest.mocked(createAudioPlayer).mock.results.map((r) => r.value as FakePlayer);

beforeEach(() => {
    resetUiSounds();
    jest.mocked(createAudioPlayer).mockClear();
    jest.mocked(setAudioModeAsync).mockClear();
    useSettingsStore.setState((s) => ({ settings: { ...s.settings, sound: true } }));
});

describe('the UI sounds', () => {
    it('load their three players once', () => {
        loadUiSounds();
        loadUiSounds();
        expect(createAudioPlayer).toHaveBeenCalledTimes(3);
    });

    it('play the one asked for, from its start, loading the players if nothing has yet', () => {
        playUiSound('breakStart');
        const [focusStart, breakStart, complete] = created();
        expect(breakStart.seekTo).toHaveBeenCalledWith(0);
        expect(breakStart.play).toHaveBeenCalledTimes(1);
        expect(focusStart.play).not.toHaveBeenCalled();
        expect(complete.play).not.toHaveBeenCalled();
        playUiSound('breakStart');
        expect(breakStart.play).toHaveBeenCalledTimes(2);
    });

    it('stay silent while Settings › Sound is off', () => {
        useSettingsStore.setState((s) => ({ settings: { ...s.settings, sound: false } }));
        playUiSound('complete');
        expect(created().every((p) => p.play.mock.calls.length === 0)).toBe(true);
    });

    it('never throw when a player cannot be made', () => {
        jest.mocked(createAudioPlayer).mockImplementationOnce(() => {
            throw new Error('no audio');
        });
        expect(() => playUiSound('focusStart')).not.toThrow();
    });

    it('respect the silent switch and mix with other audio', () => {
        applyUiAudioMode();
        expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
    });
});
