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

// The font size, the display size and bold text don't recreate the activity (DEF-016): when they did, Expo Router's
// imperative API didn't come back with the new root, and the next router.push crashed the app.
describe('Android config changes', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- the plugin is CommonJS, as Expo loads it
    const { addConfigChanges } = require('../../../plugins/withConfigChanges');
    const manifest = (configChanges?: string) => ({
        manifest: {
            application: [
                {
                    $: { 'android:name': '.MainApplication' },
                    activity: [
                        {
                            $: { 'android:name': '.MainActivity', ...(configChanges ? { 'android:configChanges': configChanges } : {}) },
                            'intent-filter': [{ action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }], category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }] }],
                        },
                    ],
                },
            ],
        },
    });
    const changesOf = (m: ReturnType<typeof manifest>) => m.manifest.application[0].activity[0].$['android:configChanges'];

    it('is in app.json', () => {
        expect(appJson.expo.plugins).toContain('./plugins/withConfigChanges');
    });

    it('adds the font scale, the density and bold text to what the activity already keeps', () => {
        expect(changesOf(addConfigChanges(manifest('keyboard|orientation|uiMode')))).toBe(
            'keyboard|orientation|uiMode|fontScale|density|fontWeightAdjustment',
        );
    });

    it('adds each once, even when run twice or when one is there already', () => {
        const once = addConfigChanges(manifest('orientation|density'));
        expect(changesOf(addConfigChanges(once))).toBe('orientation|density|fontScale|fontWeightAdjustment');
    });
});

// Exact alarms, so a focus or a break ends on time with the phone locked (DEF-012; the owner, 2026-11-25:
// USE_EXACT_ALARM). Its own commit, so it can be dropped if Google Play refuses the exact-alarm declaration.
describe('exact alarms on Android', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- the plugin is CommonJS, as Expo loads it
    const { addExactAlarmPermissions } = require('../../../plugins/withExactAlarms');
    const names = (m: { manifest: { 'uses-permission': { $: Record<string, string> }[] } }) =>
        m.manifest['uses-permission'].map((p) => p.$);

    it('is in app.json', () => {
        expect(appJson.expo.plugins).toContain('./plugins/withExactAlarms');
    });

    it('declares USE_EXACT_ALARM, and SCHEDULE_EXACT_ALARM only up to Android 12L', () => {
        const manifest = addExactAlarmPermissions({ manifest: { 'uses-permission': [{ $: { 'android:name': 'android.permission.INTERNET' } }] } });
        expect(names(manifest)).toEqual([
            { 'android:name': 'android.permission.INTERNET' },
            { 'android:name': 'android.permission.USE_EXACT_ALARM' },
            { 'android:name': 'android.permission.SCHEDULE_EXACT_ALARM', 'android:maxSdkVersion': '32' },
        ]);
    });

    it('updates an existing entry instead of adding a second one', () => {
        const manifest = addExactAlarmPermissions({
            manifest: { 'uses-permission': [{ $: { 'android:name': 'android.permission.SCHEDULE_EXACT_ALARM' } }] },
        });
        expect(names(manifest)).toEqual([
            { 'android:name': 'android.permission.SCHEDULE_EXACT_ALARM', 'android:maxSdkVersion': '32' },
            { 'android:name': 'android.permission.USE_EXACT_ALARM' },
        ]);
    });
});
