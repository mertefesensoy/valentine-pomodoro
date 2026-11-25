// Android keeps the app's activity when the font size, the display size or bold text changes (DEF-016, found on the
// emulator 2026-11-25, present in every 1.4 and 1.5 Android build).
//
// Those three settings aren't in the activity's android:configChanges, so Android destroys and recreates the activity
// when one changes while the app is in memory. The JavaScript runtime survives that, but Expo Router's imperative API
// doesn't come back with the new root: the next router.push (the Modes sheet, the note editor, the love note after a
// focus) throws "The imperative router is unavailable before the first render has finished" and the app crashes.
// Reproduced on master's preview a5522c6f and on build 1's previews: change the display density or the font size,
// return, tap Modes.
//
// Declaring them makes Android hand the change to the running activity, as iOS always does: React Native's
// onConfigurationChanged updates the window's metrics and font scale (useWindowDimensions), and nothing is rebuilt.
// Contract: adds fontScale, density and fontWeightAdjustment to the main activity's android:configChanges, once each,
// keeping the values already there; touches nothing else; does nothing on iOS.
const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

const KEPT_THROUGH = ['fontScale', 'density', 'fontWeightAdjustment'];

/** Adds the three changes to the main activity's android:configChanges. Pure apart from `manifest`. */
function addConfigChanges(manifest) {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
    const current = (activity.$['android:configChanges'] ?? '').split('|').filter(Boolean);
    for (const change of KEPT_THROUGH) if (!current.includes(change)) current.push(change);
    activity.$['android:configChanges'] = current.join('|');
    return manifest;
}

const withConfigChanges = (config) =>
    withAndroidManifest(config, (c) => {
        c.modResults = addConfigChanges(c.modResults);
        return c;
    });

module.exports = withConfigChanges;
module.exports.addConfigChanges = addConfigChanges;
