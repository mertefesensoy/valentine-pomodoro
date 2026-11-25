import appJson from '../../../app.json';

// App Review rejected 1.4.0 (59) under Guideline 2.5.4 because the app declared `audio` in
// UIBackgroundModes without playing anything in the background (DEF-009). The key came from
// expo-audio's config plugin, whose `enableBackgroundPlayback` defaults to true, so a bare
// "expo-audio" entry brings it back. These pin the option, and that nothing declares the key directly.
describe('app.json background audio (DEF-009)', () => {
    const plugins: unknown[] = appJson.expo.plugins;

    it('turns off expo-audio background playback', () => {
        const entry = plugins.find((p) => (Array.isArray(p) ? p[0] : p) === 'expo-audio');
        // recordAudioAndroid: the Android closed test's permissions, below.
        expect(entry).toEqual(['expo-audio', { enableBackgroundPlayback: false, recordAudioAndroid: false }]);
    });

    it('declares no background modes in infoPlist', () => {
        expect(appJson.expo.ios.infoPlist).not.toHaveProperty('UIBackgroundModes');
    });
});

// The app records nothing and draws over nothing, so Android asks for none of these (the Android closed-test plan,
// finding A3). expo-audio's plugin adds RECORD_AUDIO unless told not to, and Expo's template adds the rest; a
// blocked permission is removed from the merged manifest too, whichever library declares it. Each would otherwise
// show on the Play listing, and the microphone would need a Data safety answer.
describe('app.json Android permissions', () => {
    it('blocks the microphone, drawing over other apps and storage', () => {
        expect(appJson.expo.android.blockedPermissions).toEqual(
            expect.arrayContaining([
                'android.permission.RECORD_AUDIO',
                'android.permission.SYSTEM_ALERT_WINDOW',
                'android.permission.READ_EXTERNAL_STORAGE',
                'android.permission.WRITE_EXTERNAL_STORAGE',
            ]),
        );
    });
});
