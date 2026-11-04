import appJson from '../../../app.json';

// App Review rejected 1.4.0 (59) under Guideline 2.5.4 because the app declared `audio` in
// UIBackgroundModes without playing anything in the background (DEF-009). The key came from
// expo-audio's config plugin, whose `enableBackgroundPlayback` defaults to true, so a bare
// "expo-audio" entry brings it back. These pin the option, and that nothing declares the key directly.
describe('app.json background audio (DEF-009)', () => {
    const plugins: unknown[] = appJson.expo.plugins;

    it('turns off expo-audio background playback', () => {
        const entry = plugins.find((p) => (Array.isArray(p) ? p[0] : p) === 'expo-audio');
        expect(entry).toEqual(['expo-audio', { enableBackgroundPlayback: false }]);
    });

    it('declares no background modes in infoPlist', () => {
        expect(appJson.expo.ios.infoPlist).not.toHaveProperty('UIBackgroundModes');
    });
});
