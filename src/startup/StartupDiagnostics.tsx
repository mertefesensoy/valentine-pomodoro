import { useState, type ReactNode } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Application from 'expo-application';
import { useTheme } from '../theme/useTheme';
import { hodgesLehmann, summarize, type Summary } from './probeStats';
import {
    clearProbeRows,
    currentProbeRow,
    enableProbePersistence,
    isCleanRun,
    readProbeRows,
    ttiOf,
    ttiPlusOf,
    type ProbeRow,
} from './startupProbe';
import {
    hasStartupSetting,
    readStartupMode,
    writeStartupMode,
    type StartupArm,
    type StartupMode,
} from './startupVariant';

/**
 * The start-up probe's hidden panel (Phase 1 B7, record §3.5), for measuring
 * cold-start TTI on an iPhone without a Mac.
 *
 * Wraps one line of Settings → About. A 1.5 s long-press on it opens the panel
 * under it; another closes it. The wrapper has no style, no press feedback and
 * no accessibility role, so the line looks and reads exactly as before.
 *
 * Opening it the first time turns the probe's storage on for this install
 * (until then nothing is written; startupProbe.ts).
 */

const LONG_PRESS_MS = 1500;
const MODES: readonly StartupMode[] = ['deferred', 'alternate', 'eager'];
const MODE_LABEL: Record<StartupMode, string> = { deferred: 'Deferred', alternate: 'Alternate', eager: 'Eager' };

export function HiddenStartupDiagnostics({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);

    const toggle = () => {
        if (!open) {
            if (!hasStartupSetting()) writeStartupMode('deferred', currentProbeRow().arm ?? 'deferred');
            enableProbePersistence();
        }
        setOpen(!open);
    };

    return (
        <>
            <Pressable accessible={false} delayLongPress={LONG_PRESS_MS} onLongPress={toggle}>
                {children}
            </Pressable>
            {open && <StartupDiagnosticsPanel />}
        </>
    );
}

type Snapshot = { row: ProbeRow; rows: ProbeRow[]; mode: StartupMode };

function snapshot(): Snapshot {
    return { row: currentProbeRow(), rows: readProbeRows(), mode: readStartupMode() };
}

const ms = (v: number | null | undefined) => (v === null || v === undefined ? '–' : `${Math.round(v)}`);

function values(rows: ProbeRow[], metric: (row: ProbeRow) => number | null): number[] {
    return rows.map(metric).filter((v): v is number => v !== null);
}

function armLine(label: string, tti: Summary | null, ttiPlus: Summary | null): string {
    if (!tti) return `${label}: no clean runs yet`;
    return (
        `${label}: n ${tti.n} · median ${ms(tti.median)} · IQR ${ms(tti.q1)}–${ms(tti.q3)}` +
        ` · range ${ms(tti.min)}–${ms(tti.max)} · TTI⁺ median ${ms(ttiPlus?.median)}`
    );
}

function StartupDiagnosticsPanel() {
    const { colors } = useTheme();
    const [snap, setSnap] = useState(snapshot);

    const build = Application.nativeBuildVersion ?? null;
    const clean = snap.rows.filter((r) => isCleanRun(r, build));
    const ofArm = (arm: StartupArm) => clean.filter((r) => r.arm === arm);
    const deferredTti = values(ofArm('deferred'), ttiOf);
    const eagerTti = values(ofArm('eager'), ttiOf);
    const deferred = summarize(deferredTti);
    const eager = summarize(eagerTti);
    const shift = hodgesLehmann(deferredTti, eagerTti);

    const { row } = snap;
    const thisLaunch =
        `This launch: ${row.arm ?? '–'} (${row.trigger ?? 'waiting'}) · layout ${ms(row.marks.firstLayout)}` +
        ` · TTI ${ms(row.marks.interactive)} ms${row.clockOk ? '' : ' · clock check failed'}`;
    const shiftLine =
        deferred && eager && shift
            ? `Eager − deferred: Δ median ${ms(eager.median - deferred.median)} ms · HL ${ms(shift.estimate)} ms` +
              (shift.ci ? ` (95 % CI ${ms(shift.ci[0])} to ${ms(shift.ci[1])})` : ' (CI needs more runs)')
            : 'Eager − deferred: needs clean runs of both arms';

    const chooseMode = (mode: StartupMode) => {
        writeStartupMode(mode, row.arm ?? 'deferred');
        setSnap(snapshot());
    };
    const clear = () => {
        clearProbeRows();
        setSnap(snapshot());
    };
    const share = () => {
        const data = {
            version: Application.nativeApplicationVersion ?? null,
            build,
            os: `${Platform.OS} ${String(Platform.Version)}`,
            rows: snap.rows,
        };
        void Share.share({ message: JSON.stringify(data) });
    };

    const textStyle = [styles.line, { color: colors.textMuted }];
    return (
        <View style={[styles.panel, { borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Start-up probe (ms from JS bundle start)</Text>
            <Text style={textStyle}>{thisLaunch}</Text>

            <Text style={textStyle}>Next launches:</Text>
            <View style={styles.modes}>
                {MODES.map((mode) => {
                    const active = snap.mode === mode;
                    return (
                        <Pressable
                            key={mode}
                            onPress={() => chooseMode(mode)}
                            style={[
                                styles.chip,
                                { borderColor: colors.accentPurple },
                                active && { backgroundColor: colors.accentPurple },
                            ]}
                        >
                            <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                                {MODE_LABEL[mode]}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <Text style={textStyle}>{armLine('Deferred', deferred, summarize(values(ofArm('deferred'), ttiPlusOf)))}</Text>
            <Text style={textStyle}>{armLine('Eager', eager, summarize(values(ofArm('eager'), ttiPlusOf)))}</Text>
            <Text style={textStyle}>{shiftLine}</Text>
            <Text style={textStyle}>
                Rows stored: {snap.rows.length}, clean for build {build ?? '–'}: {clean.length}
            </Text>

            <View style={styles.modes}>
                <Pressable onPress={share} style={[styles.chip, { borderColor: colors.accentPurple }]}>
                    <Text style={[styles.chipText, { color: colors.text }]}>Share data</Text>
                </Pressable>
                <Pressable onPress={clear} style={[styles.chip, { borderColor: colors.accentPurple }]}>
                    <Text style={[styles.chipText, { color: colors.text }]}>Clear runs</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        marginTop: 12,
        padding: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
    },
    line: {
        fontSize: 12,
        lineHeight: 17,
        marginTop: 6,
        fontVariant: ['tabular-nums'],
    },
    modes: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6,
    },
    chip: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    chipText: {
        fontSize: 12,
    },
});
