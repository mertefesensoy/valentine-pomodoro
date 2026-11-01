import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/useTheme';

/**
 * A band of the page's colour under the status bar, laid over a tab's scrolling content (Phase 1
 * D2). The tabs draw their titles in the content, with no navigation bar (HIG X-2, kept), so a
 * scrolled page ran under the clock: Classic's phase line over the time, Settings' and Notes' rows
 * behind the battery (build 53 device check, D2 record §3.20). Place it last in the screen's root
 * view, above the scroll view. It takes no touches, and draws nothing where the top inset is 0
 * (landscape on iPhone).
 */
export function StatusBarScrim() {
    const insets = useSafeAreaInsets();
    const { tokens } = useTheme();
    if (insets.top <= 0) return null;
    return (
        <View
            pointerEvents="none"
            testID="status-bar-scrim"
            style={[styles.scrim, { height: insets.top, backgroundColor: tokens.page }]}
        />
    );
}

const styles = StyleSheet.create({
    scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
});
