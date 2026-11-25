import { Children, Fragment, useMemo, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import { language } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { edgeWidth, minTarget, radius, space } from '../../theme/layout';

/**
 * Settings as an inset grouped list (D2 Settings contract): each group is a paper field with a
 * crisp edge, its rows split by hairlines inset from the leading edge, a small sentence-case
 * header above and an explaining footer below. Native controls only: the system switch, the
 * system wheel (`@react-native-picker/picker`) and the compact time picker.
 *
 * At accessibility sizes a row wraps, so its value or control drops under its label instead of
 * truncating (HIG review; Turkish at AX5).
 */
export function ListGroup({ header, footer, children }: { header?: string; footer?: ReactNode; children: ReactNode }) {
    const { tokens } = useTheme();
    const rows = Children.toArray(children);
    return (
        <View style={styles.group}>
            {header ? (
                <Text style={[styles.header, { color: tokens.inkSoft }]} accessibilityRole="header">
                    {header}
                </Text>
            ) : null}
            <View style={[styles.field, { backgroundColor: tokens.paper, borderColor: tokens.edge }]}>
                {rows.map((row, i) => (
                    <Fragment key={i}>
                        {i > 0 && <View style={[styles.separator, { backgroundColor: tokens.edge }]} />}
                        {row}
                    </Fragment>
                ))}
            </View>
            {typeof footer === 'string' ? <Text style={[styles.footer, { color: tokens.inkSoft }]}>{footer}</Text> : footer}
        </View>
    );
}

/**
 * A label and the system switch, one VoiceOver stop: the switch carries the label, so the label's
 * text is hidden from VoiceOver rather than read twice (HIG T-1).
 */
export function SwitchRow({ label, value, onValueChange, disabled }: {
    label: string;
    value: boolean;
    onValueChange: (on: boolean) => void;
    disabled?: boolean;
}) {
    const { tokens } = useTheme();
    return (
        <View style={styles.row}>
            <Text style={[styles.label, { color: tokens.ink }]} accessible={false} importantForAccessibility="no">
                {label}
            </Text>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={ANDROID ? { true: tokens.primary, false: tokens.edgeStrong } : { true: tokens.primary }}
                // Android draws Material's teal knob otherwise (the closed-test plan, Stage 1). Cocoa on the pink
                // track when on and paper on edgeStrong when off, each over 3:1 in both themes; iOS keeps its own.
                thumbColor={ANDROID ? (value ? tokens.onPrimary : tokens.paper) : undefined}
                accessibilityLabel={label}
            />
        </View>
    );
}

const ANDROID = Platform.OS === 'android';

/**
 * A label and its value; tapping opens the control in `children` (a wheel) under the row. The
 * value turns `primaryInk` while it's open, and the row reports its expanded state. Opening and
 * closing are the caller's, so one row is open at a time.
 */
export function ValueRow({ label, value, expanded, onPress, children }: {
    label: string;
    value: string;
    expanded: boolean;
    onPress: () => void;
    children?: ReactNode;
}) {
    const { tokens } = useTheme();
    return (
        <View>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: tokens.field }]}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityValue={{ text: value }}
                accessibilityState={{ expanded }}
            >
                <Text style={[styles.label, { color: tokens.ink }]}>{label}</Text>
                <Text style={[styles.value, { color: expanded ? tokens.primaryInk : tokens.inkSoft }]}>{value}</Text>
            </Pressable>
            {expanded ? children : null}
        </View>
    );
}

/**
 * A label and its value, for what doesn't open anything under it. With `onPress` it's a button that does something
 * else, such as the system's prompt.
 */
export function InfoRow({ label, value, onPress, hint, disabled }: {
    label: string;
    value: string;
    onPress?: () => void;
    hint?: string;
    disabled?: boolean;
}) {
    const { tokens } = useTheme();
    const content = (
        <>
            <Text style={[styles.label, { color: tokens.ink }]}>{label}</Text>
            <Text style={[styles.value, { color: tokens.inkSoft }]}>{value}</Text>
        </>
    );
    if (!onPress) {
        return (
            <View style={styles.row} accessible accessibilityLabel={label} accessibilityValue={{ text: value }}>
                {content}
            </View>
        );
    }
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: tokens.field }]}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={hint}
            accessibilityValue={{ text: value }}
            accessibilityState={{ disabled: Boolean(disabled) }}
        >
            {content}
        </Pressable>
    );
}

/** "HH:MM" to a Date today, and back. */
function dateOf(hhmm: string): Date {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
}
function hhmmOf(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** A label and the native compact time picker: the system's time chip, which opens its own popover. */
export function TimeRow({ label, hhmm, onChange }: { label: string; hhmm: string; onChange: (hhmm: string) => void }) {
    const { tokens, isDark } = useTheme();
    if (Platform.OS === 'android') return <AndroidTimeRow label={label} hhmm={hhmm} onChange={onChange} />;
    return (
        <View style={styles.row}>
            <Text style={[styles.label, { color: tokens.ink }]}>{label}</Text>
            <DateTimePicker
                value={dateOf(hhmm)}
                mode="time"
                display="compact"
                accentColor={tokens.primaryInk}
                themeVariant={isDark ? 'dark' : 'light'}
                accessibilityLabel={label}
                onChange={(event, date) => {
                    if (event.type === 'set' && date) onChange(hhmmOf(date));
                }}
            />
        </View>
    );
}

/**
 * TimeRow on Android (the Android closed-test plan, build 1). There the picker component has no compact chip: it
 * opens Android's time dialog the moment it mounts and draws nothing in the row. So turning on the daily reminder,
 * which shows the reminder's time and the quiet hours' start and end, popped three dialogs at once, and the rows
 * were left with no time in them and nothing to tap. Here the row shows its time, as the Timer writes a clock time
 * in the app's language, and a tap opens the dialog through the library's imperative API: 24-hour in Turkish, as
 * the row shows it. Only a "set" changes the value; a dismissed dialog leaves it.
 */
function AndroidTimeRow({ label, hhmm, onChange }: { label: string; hhmm: string; onChange: (hhmm: string) => void }) {
    const { tokens } = useTheme();
    const turkish = language === 'tr';
    const shown = dateOf(hhmm).toLocaleTimeString(turkish ? 'tr-TR' : 'en-US', { hour: 'numeric', minute: '2-digit' });
    const open = () =>
        DateTimePickerAndroid.open({
            value: dateOf(hhmm),
            mode: 'time',
            is24Hour: turkish,
            onChange: (event, date) => {
                if (event.type === 'set' && date) onChange(hhmmOf(date));
            },
        });
    return (
        <Pressable
            onPress={open}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: tokens.field }]}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityValue={{ text: shown }}
        >
            <Text style={[styles.label, { color: tokens.ink }]}>{label}</Text>
            <Text style={[styles.value, { color: tokens.inkSoft }]}>{shown}</Text>
        </Pressable>
    );
}

/** A row that acts: in `primaryInk`, or `dangerInk` for a destructive action. */
export function ButtonRow({ label, onPress, destructive, disabled }: { label: string; onPress: () => void; destructive?: boolean; disabled?: boolean }) {
    const { tokens } = useTheme();
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: tokens.field }, disabled && { opacity: 0.5 }]}
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(disabled) }}
        >
            <Text style={[styles.label, { color: destructive ? tokens.dangerInk : tokens.primaryInk }]}>{label}</Text>
        </Pressable>
    );
}

/**
 * The system wheel for a bounded number (`pickers.md`: choices over typing, a wheel for a long
 * range). The range runs `min` to `max`; a current value outside it, or off the step, is listed
 * too, so the wheel always opens on what is stored.
 */
export function NumberWheel({ value, min, max, format, onChange, label }: {
    value: number;
    min: number;
    max: number;
    format: (n: number) => string;
    onChange: (n: number) => void;
    label: string;
}) {
    const { tokens } = useTheme();
    // Rebuilt only when the range changes or a value outside it must be listed, not on every
    // turn of the wheel (the goal's runs to 1,440 items).
    const outside = value < min || value > max ? value : null;
    const values = useMemo(() => {
        const out: number[] = [];
        for (let n = min; n <= max; n++) out.push(n);
        if (outside !== null) {
            out.push(outside);
            out.sort((a, b) => a - b);
        }
        return out;
    }, [min, max, outside]);
    return (
        <Picker
            selectedValue={value}
            onValueChange={(v) => onChange(Number(v))}
            itemStyle={[styles.wheelItem, { color: tokens.ink }]}
            accessibilityLabel={label}
        >
            {values.map((n) => (
                <Picker.Item key={n} label={format(n)} value={n} />
            ))}
        </Picker>
    );
}

const styles = StyleSheet.create({
    group: { gap: space.s },
    header: { fontSize: 13, fontWeight: '600', paddingHorizontal: space.l },
    field: { borderRadius: radius.m, borderWidth: edgeWidth, overflow: 'hidden' },
    separator: { height: StyleSheet.hairlineWidth, marginLeft: space.l },
    footer: { fontSize: 13, lineHeight: 18, paddingHorizontal: space.l },
    row: {
        minHeight: minTarget,
        paddingHorizontal: space.l,
        paddingVertical: space.s,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: space.m,
        rowGap: space.xs,
    },
    label: { fontSize: 17, flexShrink: 1, flexGrow: 1 },
    value: { fontSize: 17, fontVariant: ['tabular-nums'] },
    wheelItem: { fontSize: 20 },
});
