import { Children, Fragment, useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

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

/** A label and the system switch. */
export function SwitchRow({ label, value, onValueChange, disabled }: {
    label: string;
    value: boolean;
    onValueChange: (on: boolean) => void;
    disabled?: boolean;
}) {
    const { tokens } = useTheme();
    return (
        <View style={styles.row}>
            <Text style={[styles.label, { color: tokens.ink }]}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ true: tokens.primary }}
                accessibilityLabel={label}
            />
        </View>
    );
}

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

/** A row that acts: in `primaryInk`, or `dangerInk` for a destructive action. */
export function ButtonRow({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) {
    const { tokens } = useTheme();
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: tokens.field }]}
            accessibilityRole="button"
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
    const values = useMemo(() => {
        const out: number[] = [];
        for (let n = min; n <= max; n++) out.push(n);
        if (value < min || value > max) {
            out.push(value);
            out.sort((a, b) => a - b);
        }
        return out;
    }, [min, max, value]);
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
