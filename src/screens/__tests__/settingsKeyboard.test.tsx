import type { ReactNode } from 'react';
import { Keyboard, Platform } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import { useStatsStore } from '../../stores/statsStore';
import SettingsScreen, { numberDoneId } from '../SettingsScreen';

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

    // Build 48 (F1): an InputAccessoryView binds to the first input carrying its
    // nativeID and to no other, so one shared bar reached Focus only. Each field
    // needs its own: a distinct ID, and an accessory in the tree with that ID.
    it('gives every number field its own Done bar', async () => {
        // The daily goal's custom field mounts only while a goal is on (50 by default).
        expect(useStatsStore.getState().goalMinutes).toBeGreaterThan(0);
        await renderSettings();
        const tree = screen.toJSON();
        // The defaults: Focus 25, Short Break 5, Long Break 15, a long break every 4, the goal 50
        const fields = ['25', '5', '15', '4', '50'].map((value) => screen.getByDisplayValue(value));
        const ids = fields.map((input) => input.props.inputAccessoryViewID as string);
        expect(new Set(ids).size).toBe(fields.length);
        for (const [i, input] of fields.entries()) {
            expect(input.props.keyboardType).toBe('number-pad');
            expect(ids[i]).toMatch(/^settings-number-done-/);
            expect(findNode(tree, (n) => n.props?.nativeID === ids[i])).toBeDefined();
        }
        expect(ids).toEqual(['focus', 'shortBreak', 'longBreak', 'longBreakEvery', 'goal'].map(numberDoneId));
    });

    it("dismisses the keyboard from any field's Done bar", async () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        await renderSettings();

        const bars = screen.getAllByRole('button', { name: 'Done' });
        expect(bars).toHaveLength(5);
        for (const bar of bars) await fireEvent.press(bar);
        expect(dismiss).toHaveBeenCalledTimes(5);
        dismiss.mockRestore();
    });

    it('dismisses the keyboard when the list is scrolled', async () => {
        await renderSettings();
        const scroll = findNode(screen.toJSON(), (n) => 'keyboardDismissMode' in (n.props ?? {}));
        expect(scroll?.props.keyboardDismissMode).toBe('on-drag');
    });
});
