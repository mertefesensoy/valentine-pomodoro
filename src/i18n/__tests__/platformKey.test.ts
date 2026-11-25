import { fixedT } from '../index';
import { platformKey } from '../platformKey';

// The lines that name the iPhone, iOS or the App Store, and the Android wording each has (the Android closed-test
// plan, Stage 1). iOS must keep its exact words; Android must never see a missing key.
const VARIANTS = [
    'settings.notifications.denied',
    'settings.notifications.openSettings',
    'settings.appearance.footer',
    'updates.availableMessage',
] as const;

describe('platformKey', () => {
    it('leaves every key alone on iOS and the web', () => {
        for (const key of VARIANTS) {
            expect(platformKey(key, 'ios')).toBe(key);
            expect(platformKey(key, 'web')).toBe(key);
        }
    });

    it('picks the Android sibling on Android', () => {
        for (const key of VARIANTS) expect(platformKey(key, 'android')).toBe(`${key}Android`);
    });

    it('keeps a key that has no Android sibling, so nothing shows as a missing key', () => {
        expect(platformKey('settings.notifications.failed', 'android')).toBe('settings.notifications.failed');
    });

    it("gives Android words free of the iPhone, iOS and the App Store, in both languages", () => {
        for (const lng of ['en', 'tr'] as const) {
            const t = fixedT(lng);
            for (const key of VARIANTS) {
                const text = t(platformKey(key, 'android'), { version: '1.5.3' });
                expect(text).not.toMatch(/iPhone|iOS|App Store/);
                expect(text).not.toBe(`${key}Android`);
            }
        }
    });
});
