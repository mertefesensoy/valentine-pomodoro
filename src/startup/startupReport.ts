import { Platform } from 'react-native';
import { STARTUP_REPORTS_ENABLED } from '../constants/features';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../server/config';
import { useSettingsStore } from '../stores/settingsStore';
import { runAfterInteractive } from './deferredStartup';
import { currentProbeRow, isCleanRun, ttiOf, type ProbeRow } from './startupProbe';
import type { StartupArm } from './startupVariant';

/**
 * The anonymous start-up report (Phase 2 C4, ADR-0051, NFR-PERF-008): the one request a solo phone ever
 * makes. It holds the install's group, this launch's time to interactive, the iPhone model, the iOS
 * version and the app build, and nothing else exists here to send. No identifier, no account.
 */
export type StartupReport = {
    p_arm: StartupArm;
    p_tti_ms: number;
    p_model: string;
    p_os: string;
    p_build: string;
};

/**
 * The report for this launch, or null when it isn't one worth sending: only a clean run (B7 record
 * §4.3) with a usable bundle-start time counts, the same reading as NFR-PERF-001's.
 */
export function buildStartupReport(row: ProbeRow, build: string | null, model: string | null, os: string): StartupReport | null {
    if (!build || !isCleanRun(row, build) || !row.arm) return null;
    const tti = ttiOf(row, 'jsStart');
    if (tti === null) return null;
    return {
        p_arm: row.arm,
        p_tti_ms: Math.round(tti),
        p_model: model ?? 'unknown',
        p_os: os,
        p_build: build,
    };
}

/** Sends this launch's report, if the person allows it and it's worth sending. Never throws, never retries. */
export async function sendStartupReport(): Promise<void> {
    try {
        if (!useSettingsStore.getState().settings.shareStartupTimings) return;
        const row = currentProbeRow();
        const Device = await import('expo-device');
        const report = buildStartupReport(row, row.build, Device.modelId ?? null, String(Platform.Version));
        if (!report) return;
        await fetch(`${SUPABASE_URL}/rest/v1/rpc/report_startup`, {
            method: 'POST',
            headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' },
            body: JSON.stringify(report),
        });
    } catch {
        // Offline, or the server's away: nobody is waiting for this, and the next launch sends its own.
    }
}

/**
 * Sends it once start-up has gone idle after the interactive mark, in both groups, so the time it
 * reports is already measured and the request can't move it. Returns a cancel function.
 */
export function scheduleStartupReport(): () => void {
    if (!STARTUP_REPORTS_ENABLED) return () => {};
    return runAfterInteractive('startup.report', sendStartupReport);
}
