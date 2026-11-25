// Exact alarms on Android, so a focus or a break ends on time with the phone locked (the Android closed-test plan,
// Stage 1; the owner chose USE_EXACT_ALARM on 2026-11-25).
//
// expo-notifications schedules an exact alarm only when AlarmManager.canScheduleExactAlarms() is true, and an
// inexact one otherwise, which Android may deliver up to 75 % of the wait late (45 s late for a 1-minute timer on
// the emulator, so up to about 19 minutes for a 25-minute focus). This declares Google's pattern for a timer app:
//   - USE_EXACT_ALARM, granted at install on Android 13 (API 33) and later. Google Play allows it for apps whose
//     core function is an alarm or a timer, and asks for a declaration in Play Console;
//   - SCHEDULE_EXACT_ALARM up to Android 12L (API 32) only, where it's granted at install. From Android 14 it starts
//     denied, and USE_EXACT_ALARM covers those versions.
// Below Android 12 any app may schedule exact alarms. Expo's `android.permissions` can't set maxSdkVersion, hence
// this plugin. Contract: adds both entries once (an existing entry is updated, never duplicated); touches nothing
// else; does nothing on iOS.
const { withAndroidManifest } = require('@expo/config-plugins');

const USE_EXACT_ALARM = 'android.permission.USE_EXACT_ALARM';
const SCHEDULE_EXACT_ALARM = 'android.permission.SCHEDULE_EXACT_ALARM';

/** Sets the two exact-alarm permissions on a parsed AndroidManifest.xml (xml2js shape). Pure apart from `manifest`. */
function addExactAlarmPermissions(manifest) {
    const root = manifest.manifest;
    const list = (root['uses-permission'] = root['uses-permission'] ?? []);
    const upsert = (name, attrs) => {
        const existing = list.find((p) => p.$?.['android:name'] === name);
        if (existing) Object.assign(existing.$, attrs);
        else list.push({ $: { 'android:name': name, ...attrs } });
    };
    upsert(USE_EXACT_ALARM, {});
    upsert(SCHEDULE_EXACT_ALARM, { 'android:maxSdkVersion': '32' });
    return manifest;
}

const withExactAlarms = (config) =>
    withAndroidManifest(config, (c) => {
        c.modResults = addExactAlarmPermissions(c.modResults);
        return c;
    });

module.exports = withExactAlarms;
module.exports.addExactAlarmPermissions = addExactAlarmPermissions;
