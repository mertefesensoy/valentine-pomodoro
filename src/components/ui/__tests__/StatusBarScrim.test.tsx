// covers: NFR-A11Y-003
// Build 53 device check (D2 record §3.20): a scrolled tab ran under the status bar, Classic's phase
// line over the clock. The scrim is a band of the page's colour as tall as the top inset.
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StrawberryMilk } from '../../../theme/palette';
import { StatusBarScrim } from '../StatusBarScrim';

const metrics = (top: number) => ({
    frame: { x: 0, y: 0, width: 393, height: 852 },
    insets: { top, left: 0, right: 0, bottom: 34 },
});

describe('the status-bar scrim', () => {
    it('covers the status bar in the page colour, and takes no touches', async () => {
        await render(
            <SafeAreaProvider initialMetrics={metrics(59)}>
                <StatusBarScrim />
            </SafeAreaProvider>,
        );
        const scrim = screen.getByTestId('status-bar-scrim');
        expect(scrim).toHaveStyle({ position: 'absolute', top: 0, height: 59, backgroundColor: StrawberryMilk.tokens.page });
        expect(scrim.props.pointerEvents).toBe('none');
    });

    it('draws nothing where there is no top inset (an iPhone on its side)', async () => {
        await render(
            <SafeAreaProvider initialMetrics={metrics(0)}>
                <StatusBarScrim />
            </SafeAreaProvider>,
        );
        expect(screen.queryByTestId('status-bar-scrim')).toBeNull();
    });
});
