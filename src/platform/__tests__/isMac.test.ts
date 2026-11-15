import * as Device from 'expo-device';

// The Mac detection (1.5.2), on its own: jest.setup.ts mocks the module as an
// iPhone for every other test.
const { detectMac } = jest.requireActual<typeof import('../isMac')>('../isMac');

// covers: FR-ADS-003
describe('detectMac', () => {
    it('is true only for the iOS app that runs on a Mac', () => {
        expect(detectMac('ios', Device.DeviceType.DESKTOP)).toBe(true);
    });

    it('is false on an iPhone, an iPad, and when the type is unknown', () => {
        expect(detectMac('ios', Device.DeviceType.PHONE)).toBe(false);
        expect(detectMac('ios', Device.DeviceType.TABLET)).toBe(false);
        expect(detectMac('ios', Device.DeviceType.UNKNOWN)).toBe(false);
        expect(detectMac('ios', null)).toBe(false);
    });

    it('is false off iOS, even where a desktop is reported', () => {
        expect(detectMac('android', Device.DeviceType.DESKTOP)).toBe(false);
        expect(detectMac('web', Device.DeviceType.DESKTOP)).toBe(false);
    });
});
