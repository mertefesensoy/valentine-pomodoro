/**
 * Soft Update Prompt Hook
 *
 * iOS     — fetches the latest published version from the iTunes Lookup API
 *           (free, no auth, always reflects the live App Store listing).
 * Android — fetches from the self-hosted update.json on GitHub Pages.
 *
 * Shows a dismissible Alert once per cold-start when the installed build is
 * behind the latest release. Every launch where the app is out-of-date gets
 * a prompt, so users are never quietly stuck on an old build.
 */

import { useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { compareSemver } from '../utils/semver';
import { runAfterFirstFrame } from '../startup/deferredStartup';
import { t } from '../i18n';

// Module-level session guard: resets on process restart (cold launch),
// so the check fires exactly once per app open — never twice in one session.
let sessionChecked = false;

const IOS_BUNDLE_ID = 'com.bengisu.valentinepomodoro';
const IOS_FALLBACK_STORE_URL = 'https://apps.apple.com/app/id6757491918';
const FETCH_TIMEOUT_MS = 5000;

function getCurrentVersion(): string {
    return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '0.0.0';
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

type VersionInfo = { version: string; storeUrl: string };

// iTunes Lookup API — free, unauthenticated, always returns the live App Store version.
async function fetchLatestIos(): Promise<VersionInfo | null> {
    const url = `https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}`;
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) return null;
    const json = await res.json() as {
        resultCount: number;
        results: Array<{ version?: string; trackViewUrl?: string }>;
    };
    if (!json.resultCount || !json.results[0]?.version) return null;
    return {
        version: json.results[0].version,
        storeUrl: json.results[0].trackViewUrl ?? IOS_FALLBACK_STORE_URL,
    };
}

// Android: self-hosted JSON keeps parity with the Play Store listing.
async function fetchLatestAndroid(updateJsonUrl: string): Promise<VersionInfo | null> {
    const res = await fetchWithTimeout(updateJsonUrl, FETCH_TIMEOUT_MS);
    if (!res.ok) return null;
    const json = await res.json() as { latestVersion?: string; androidUrl?: string };
    if (!json.latestVersion || !json.androidUrl) return null;
    return { version: json.latestVersion, storeUrl: json.androidUrl };
}

export function useUpdateCheck(updateJsonUrl: string) {
    const check = useCallback(
        async (opts?: { force?: boolean }) => {
            const force = opts?.force ?? false;

            // Prevent double-fire within a single session; reset happens on cold launch.
            if (!force && sessionChecked) return;
            sessionChecked = true;

            let latest: VersionInfo | null = null;
            try {
                latest = Platform.OS === 'ios'
                    ? await fetchLatestIos()
                    : await fetchLatestAndroid(updateJsonUrl);
            } catch {
                // Offline or timed out: never block the user. Only a check someone asked for
                // ("Check for updates") says so, instead of doing nothing (D2 record §3.14).
                latest = null;
            }

            if (!latest) {
                if (force) Alert.alert(t('updates.failedTitle'), t('updates.failedMessage'));
                return;
            }

            const current = getCurrentVersion();
            const isNewer = compareSemver(latest.version, current) === 1;

            if (!isNewer) {
                if (force) {
                    Alert.alert(t('updates.upToDateTitle'), t('updates.upToDateMessage', { version: current }));
                }
                return;
            }

            Alert.alert(
                t('updates.availableTitle'),
                t('updates.availableMessage', { version: latest.version }),
                [
                    { text: t('updates.notNow'), style: 'cancel' },
                    {
                        text: t('updates.update'),
                        onPress: () => void Linking.openURL(latest!.storeUrl),
                    },
                ],
                { cancelable: true }
            );
        },
        [updateJsonUrl]
    );

    // The launch check waits for the first frame (Phase 1 B7,
    // src/startup/deferredStartup.ts); the forced check from Settings doesn't.
    // Still once per cold launch (FR-UPD-001): a second mount's run, or one
    // after a forced check, returns at the session guard.
    useEffect(() => runAfterFirstFrame('update.check', () => check()), [check]);

    return { checkForUpdates: check };
}
