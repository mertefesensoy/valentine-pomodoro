/**
 * Soft Update Prompt Hook
 * Checks for app updates from a remote JSON file, respects 24h throttle,
 * and shows dismissible prompts only once per version.
 */

import { useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { load, save, STORAGE_KEYS } from '../utils/storage';
import { compareSemver } from '../utils/semver';

type UpdatePayload = {
    latestVersion: string;
    title?: string;
    message?: string;
    iosUrl?: string;
    androidUrl?: string;
};

type UpdateMeta = {
    lastCheckAt: number;
    lastPromptedVersion: string | null;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;

function getCurrentVersion(): string {
    return Application.nativeApplicationVersion || Constants.expoConfig?.version || '0.0.0';
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

export function useUpdateCheck(updateJsonUrl: string) {
    const check = useCallback(
        async (opts?: { force?: boolean }) => {
            const force = opts?.force ?? false;

            const meta = await load<UpdateMeta>(STORAGE_KEYS.UPDATE_META, {
                lastCheckAt: 0,
                lastPromptedVersion: null,
            });

            const now = Date.now();

            // Respect 24h throttle unless forced
            if (!force && meta.lastCheckAt && now - meta.lastCheckAt < ONE_DAY_MS) {
                return;
            }

            // Record check time early to avoid repeated checks if user relaunches quickly
            await save(STORAGE_KEYS.UPDATE_META, { ...meta, lastCheckAt: now });

            let payload: UpdatePayload | null = null;
            try {
                const res = await fetchWithTimeout(updateJsonUrl, FETCH_TIMEOUT_MS);
                if (!res.ok) return;
                payload = (await res.json()) as UpdatePayload;
            } catch {
                // Offline or timeout -> fail silently, no UX impact
                return;
            }

            if (!payload?.latestVersion) return;

            const current = getCurrentVersion();
            const isNewer = compareSemver(payload.latestVersion, current) === 1;

            if (!isNewer) {
                // If forced (manual check), show up-to-date message
                if (force) {
                    Alert.alert('You are up to date', `You have the latest version (${current}).`);
                }
                return;
            }

            // Avoid prompting repeatedly for the same latest version
            if (!force && meta.lastPromptedVersion === payload.latestVersion) {
                return;
            }

            const storeUrl = Platform.OS === 'ios' ? payload.iosUrl : payload.androidUrl;
            if (!storeUrl) return;

            // Save prompted version to prevent repeat prompts
            await save(STORAGE_KEYS.UPDATE_META, {
                lastCheckAt: now,
                lastPromptedVersion: payload.latestVersion,
            });

            Alert.alert(
                payload.title ?? 'Update available',
                payload.message ?? 'A newer version is available.',
                [
                    { text: 'Not now', style: 'cancel' },
                    {
                        text: 'Update',
                        onPress: () => {
                            void Linking.openURL(storeUrl);
                        },
                    },
                ]
            );
        },
        [updateJsonUrl]
    );

    useEffect(() => {
        // Run once on app start
        void check();
    }, [check]);

    return { checkForUpdates: check };
}
