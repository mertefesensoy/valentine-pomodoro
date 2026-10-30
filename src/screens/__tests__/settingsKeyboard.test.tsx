import type { ReactNode } from 'react';
import { Keyboard, Platform } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import SettingsScreen, { NUMBER_DONE_ID } from '../SettingsScreen';

jest.mock('../../hooks/useUpdateCheck', () => ({
    useUpdateCheck: () => ({ checkForUpdates: jest.fn() }),
}));

function Providers({ children }: { children: ReactNode }) {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreGate>{children}</StoreGate>
        </GestureHandlerRootView>
    );
}

type JsonNode = { type: string; props: Record<string, unknown>; children: (JsonNode | string)[] | null };

function findNode(node: unknown, match: (n: JsonNode) => boolean): JsonNode | undefined {
    if (!node || typeof node !== 'object') return undefined;
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = findNode(child, match);
            if (found) return found;
        }
        return undefined;
    }
    const n = node as JsonNode;
    if (match(n)) return n;
    return findNode(n.children, match);
}

async function renderSettings() {
    await render(<SettingsScreen />, { wrapper: Providers });
    await act(async () => {});
}

// covers: FR-SET-001
// DEF-008: iOS's number pad has no return key, and before this nothing in
// Settings dismissed it, so a duration field couldn't be left once edited.
describe('Settings number fields can be left (DEF-008)', () => {
    beforeEach(() => resetStorage());

    it('runs on iOS, where the number pad has no return key', () => {
        expect(Platform.OS).toBe('ios');
    });

    it('attaches the Done bar to every duration field', async () => {
        await renderSettings();
        // The defaults: Focus 25, Short Break 5, Long Break 15, a long break every 4
        for (const value of ['25', '5', '15', '4']) {
            const input = screen.getByDisplayValue(value);
            expect(input.props.keyboardType).toBe('number-pad');
            expect(input.props.inputAccessoryViewID).toBe(NUMBER_DONE_ID);
        }
    });

    it('dismisses the keyboard from the Done bar', async () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        await renderSettings();

        const bar = findNode(screen.toJSON(), (n) => n.props?.nativeID === NUMBER_DONE_ID);
        expect(bar).toBeDefined();

        await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
        expect(dismiss).toHaveBeenCalledTimes(1);
        dismiss.mockRestore();
    });

    it('dismisses the keyboard when the list is scrolled', async () => {
        await renderSettings();
        const scroll = findNode(screen.toJSON(), (n) => 'keyboardDismissMode' in (n.props ?? {}));
        expect(scroll?.props.keyboardDismissMode).toBe('on-drag');
    });
});
