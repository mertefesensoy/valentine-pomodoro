import appJson from '../../../app.json';
import { adUnitIdOr } from '../AdConfig';

// Until the Android closed test, app.json's Android banner id was a placeholder string, which isn't null, so the
// old `??` fallback sent it to the SDK and every Android banner failed (the Android closed-test plan, finding A2).
describe('adUnitIdOr', () => {
    const TEST_ID = 'ca-app-pub-3940256099942544/6300978111';

    it('keeps a configured id that has an ad unit id\'s shape', () => {
        expect(adUnitIdOr('ca-app-pub-9990246025309322/9961240442', TEST_ID)).toBe('ca-app-pub-9990246025309322/9961240442');
    });

    it('falls back to the test id for a placeholder', () => {
        expect(adUnitIdOr('REPLACE_WITH_ANDROID_BANNER_UNIT_ID', TEST_ID)).toBe(TEST_ID);
    });

    it('falls back to the test id when nothing is configured', () => {
        expect(adUnitIdOr(undefined, TEST_ID)).toBe(TEST_ID);
        expect(adUnitIdOr(null, TEST_ID)).toBe(TEST_ID);
        expect(adUnitIdOr('', TEST_ID)).toBe(TEST_ID);
    });

    // A shape that missed a real id would serve test ads in an iOS production build, silently.
    it("keeps app.json's real iOS ids, and the Android test ids, as they are", () => {
        const extra = appJson.expo.extra;
        for (const id of [extra.admobInterstitialIdIos, extra.admobBannerIdIos, extra.admobInterstitialIdAndroid, extra.admobBannerIdAndroid]) {
            expect(adUnitIdOr(id, TEST_ID)).toBe(id);
        }
    });

    it('falls back for an app id, which has a ~ where a unit id has a /', () => {
        expect(adUnitIdOr('ca-app-pub-3940256099942544~3347511713', TEST_ID)).toBe(TEST_ID);
    });
});
