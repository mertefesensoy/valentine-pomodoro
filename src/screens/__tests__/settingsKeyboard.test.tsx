import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreGate } from '../../stores/StoreGate';
import { resetStorage } from '../../__fixtures__/storage/resetStorage';
import SettingsScreen from '../SettingsScreen';

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

beforeEach(() => resetStorage());

// covers: FR-SET-001
// DEF-008: iOS's number pad has no return key, so a typed duration field couldn't be left once
// edited; builds 47 and 48 answered it with a Done bar per field (F1). D2 removes the cause:
// Settings sets every bounded number on the system wheel, so no number opens a keyboard at all,
// and the deprecated InputAccessoryView is gone with it.
describe('Settings opens no keyboard for a number (DEF-008, resolved by the wheel)', () => {
    it('has no text field and no keyboard accessory', async () => {
        await render(<SettingsScreen />, { wrapper: Providers });
        await act(async () => {});
        expect(JSON.stringify(screen.toJSON())).not.toMatch(/"type":"(TextInput|RCTInputAccessoryView)"/);
        expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
    });

    it('opens a wheel, not a keypad, from every number row', async () => {
        await render(<SettingsScreen />, { wrapper: Providers });
        await act(async () => {});
        for (const label of ['Focus', 'Short break', 'Long break', 'Long break every']) {
            await act(async () => {
                await fireEvent.press(screen.getByRole('button', { name: label }));
            });
            expect(screen.getByRole('button', { name: label })).toBeExpanded();
            // The row and its wheel carry the label; nothing typed appears.
            expect(screen.getAllByLabelText(label)).toHaveLength(2);
            expect(JSON.stringify(screen.toJSON())).not.toMatch(/"type":"TextInput"/);
        }
    });
});
