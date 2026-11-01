/**
 * Baloo 2, the display face (ADR-0046), and its roles (Phase 1 D1).
 *
 * The two embedded instances are built by `art/type/build-fonts.py` and registered by the
 * `expo-font` config plugin (`app.json`). iOS resolves `fontFamily` by PostScript name, so each
 * weight is its own family name and `fontWeight` is never set alongside it (that would ask the
 * system to synthesise a weight the file doesn't have).
 *
 * Bold Text (HIG review D1-M4): system fonts get heavier when it is on, so the display roles step
 * up one instance with it: Medium → SemiBold. SemiBold is the heaviest instance shipped.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';

export const fonts = {
    medium: 'Baloo2-Medium',
    semiBold: 'Baloo2-SemiBold',
} as const;

/** The timer's face. `<TimerText>` adds the tabular figures itself, whatever its caller passes. */
export const type = StyleSheet.create({
    timer: { fontFamily: fonts.semiBold },
});

/** The display family for a role, one step heavier while iOS Bold Text is on. */
export function displayFamily(weight: 'medium' | 'semiBold', boldText: boolean): string {
    return boldText ? fonts.semiBold : fonts[weight];
}

/** Whether iOS Bold Text is on, following changes while the app runs. */
export function useBoldText(): boolean {
    const [bold, setBold] = useState(false);
    useEffect(() => {
        let live = true;
        AccessibilityInfo.isBoldTextEnabled().then((on) => live && setBold(on), () => {});
        const sub = AccessibilityInfo.addEventListener('boldTextChanged', setBold);
        return () => {
            live = false;
            sub.remove();
        };
    }, []);
    return bold;
}
