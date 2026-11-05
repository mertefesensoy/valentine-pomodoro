/**
 * Soft Update Prompt Hook
 *
 * iOS     — fetches the store's version from the iTunes Lookup API (free, no
 *           auth). Apple's CDN and the phone's URL cache each keep an exact
 *           lookup URL for up to 24 h, so the URL changes: see iosLookupUrl.
 * Android — fetches from the self-hosted update.json on GitHub Pages.
 *
 * Checks after the first frame of a cold launch, and again on returning to the
 * app once the last answer is RECHECK_AFTER_MS old. Each check shows a dismissible
 * Alert when the installed build is behind the store's, so users are never quietly
 * stuck on an old build, but an automatic one waits for an idle timer (FR-UPD-001).
 */

import { useEffect, useCallback } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { compareSemver } from '../utils/semver';
import { runAfterFirstFrame } from '../startup/deferredStartup';
import { useSessionStore } from '../stores/sessionStore';
import { t } from '../i18n';

const HOUR_MS = 60 * 60 * 1000;
/** How old the last answer must be before returning to the app checks again. */
const RECHECK_AFTER_MS = 6 * HOUR_MS;

// When the last check started. Null until one has, and after one that got no answer
// or couldn't show its prompt, so the next return to the app tries again. Module
// state: a cold launch resets it, and the two mounts (the root and Settings) share
// it, so they share a check.
let lastCheckAt: number | null = null;

const IOS_BUNDLE_ID = 'com.bengisu.valentinepomodoro';
const IOS_FALLBACK_STORE_URL = 'https://apps.apple.com/app/id6757491918';
const FETCH_TIMEOUT_MS = 5000;

/**
 * The lookup URL for a check at `now` (ms since the epoch). Pure.
 *
 * Apple's CDN and the phone's URL cache both key on the exact URL and keep it
 * for up to 24 h, so a bare URL hid 1.4.1 for hours after its release (2026-11-06
 * audit). `cb` is what makes the answer fresh, and Apple ignores it. Neither a
 * `cache: 'no-store'` option nor a no-cache header helps: Expo's fetch drops the
 * option, and the CDN ignored the header when tested.
 *
 * An automatic check uses the current hour, so everyone shares one cached copy
 * an hour, as Apple asks of busy clients, and the answer is at most an hour old.
 * A check someone asked for uses the exact time, so it's always fresh.
 */
function iosLookupUrl(now: number, force: boolean): string {
    const freshness = force ? now : Math.floor(now / HOUR_MS);
    return `https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}&cb=${freshness}`;
}

/** Whether a timer is counting down: a focus, a break or a Fly session, not a paused one. Only reads. */
function isSessionRunning(): boolean {
    const { pomodoro, fly } = useSessionStore.getState().clock;
    return !!pomodoro?.isRunning || !!fly?.isRunning;
}

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

// iTunes Lookup API — free and unauthenticated. No `country`: it answers from the US storefront.
async function fetchLatestIos(now: number, force: boolean): Promise<VersionInfo | null> {
    const res = await fetchWithTimeout(iosLookupUrl(now, force), FETCH_TIMEOUT_MS);
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
            const now = Date.now();

            // One automatic check per RECHECK_AFTER_MS, whichever mount or event asks.
            if (!force && lastCheckAt !== null && now - lastCheckAt < RECHECK_AFTER_MS) return;
            lastCheckAt = now;

            let latest: VersionInfo | null = null;
            try {
                latest = Platform.OS === 'ios'
                    ? await fetchLatestIos(now, force)
                    : await fetchLatestAndroid(updateJsonUrl);
            } catch {
                // Offline or timed out: never block the user. Only a check someone asked for
                // ("Check for updates") says so, instead of doing nothing (D2 record §3.14).
                latest = null;
            }

            if (!latest) {
                // No answer, so the next return to the app tries again, unless a newer check began.
                if (lastCheckAt === now) lastCheckAt = null;
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

            // An automatic prompt never lands on a running timer (the owner: "wait until
            // it's idle"). It isn't counted, so the next return to the app asks again.
            if (!force && isSessionRunning()) {
                if (lastCheckAt === now) lastCheckAt = null;
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
    // A second mount's run, or one after a forced check, returns at lastCheckAt.
    //
    // The return-to-app check starts listening only then, so a launch's own
    // `active` event can't run ahead of the first frame.
    useEffect(() => {
        let subscription: { remove: () => void } | null = null;
        const cancel = runAfterFirstFrame('update.check', () => {
            subscription = AppState.addEventListener('change', (state) => {
                if (state === 'active') void check();
            });
            return check();
        });
        return () => {
            cancel();
            subscription?.remove();
        };
    }, [check]);

    return { checkForUpdates: check };
}
