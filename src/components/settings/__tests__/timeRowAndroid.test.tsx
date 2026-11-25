import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { TimeRow } from '../SettingsList';

// TimeRow on Android (the Android closed-test plan, build 1). The picker component opens Android's time dialog the
// moment it mounts, so the inline picker iOS uses popped a dialog per row as soon as the daily reminder was turned
// on, and left the rows empty. On Android the row shows the time and opens the dialog only when it's tapped.
jest.mock('@react-native-community/datetimepicker', () => {
    const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
    return {
        __esModule: true,
        default: () => <MockText>inline picker</MockText>,
        DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() },
    };
});

const open = DateTimePickerAndroid.open as jest.Mock;
const originalOS = Platform.OS;
const setOS = (os: typeof Platform.OS) => Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });

afterEach(() => {
    setOS(originalOS);
    open.mockReset();
});

describe('TimeRow on Android', () => {
    beforeEach(() => setOS('android'));

    it('shows the time and mounts no picker until it is tapped', async () => {
        await render(<TimeRow label="Reminder time" hhmm="19:00" onChange={jest.fn()} />);
        expect(screen.getByText('7:00 PM')).toBeTruthy();
        expect(screen.queryByText('inline picker')).toBeNull();
        expect(open).not.toHaveBeenCalled();
    });

    it("opens Android's time dialog on a tap, and takes the time only when it's set", async () => {
        const onChange = jest.fn();
        await render(<TimeRow label="Reminder time" hhmm="19:00" onChange={onChange} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Reminder time' }));
        expect(open).toHaveBeenCalledTimes(1);
        const options = open.mock.calls[0][0];
        expect(options).toMatchObject({ mode: 'time', is24Hour: false });
        expect(options.value.getHours()).toBe(19);

        options.onChange({ type: 'dismissed' }, undefined);
        expect(onChange).not.toHaveBeenCalled();
        const picked = new Date();
        picked.setHours(20, 30, 0, 0);
        options.onChange({ type: 'set' }, picked);
        expect(onChange).toHaveBeenCalledWith('20:30');
    });
});

describe('TimeRow on iOS', () => {
    it('keeps the inline compact picker', async () => {
        setOS('ios');
        await render(<TimeRow label="Reminder time" hhmm="19:00" onChange={jest.fn()} />);
        expect(screen.getByText('inline picker')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Reminder time' })).toBeNull();
    });
});
