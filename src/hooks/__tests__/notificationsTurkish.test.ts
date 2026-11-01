// covers: NFR-I18N-001, FR-NTF-001
// D3 (D3 record §3.3): the session-end and landing notifications are written in the app's language
// when they're scheduled. On a Turkish phone they read in Turkish, with their emoji kept in code
// (the emoji check allows only the notification files to hold emoji).

import { flightLandedContent, getNotificationContent } from '../useNotifications';

// jest.mock calls are hoisted above these imports, so the Turkish locale is in place before i18n loads.
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }] }));

describe('the notifications on a Turkish phone', () => {
    it('end a focus and a break in Turkish', () => {
        expect(getNotificationContent('focus')).toEqual({ title: 'Odak tamam 💗', body: 'Tatlı bir mola zamanı' });
        expect(getNotificationContent('shortBreak')).toEqual({ title: 'Mola bitti 💘', body: 'Hedeflerine dönme zamanı' });
        expect(getNotificationContent('longBreak').body).toBe('Hedeflerine dönme zamanı');
    });

    it("announce Fly's landing in Turkish", () => {
        expect(flightLandedContent).toEqual({ title: '✈️ İniş yaptık!', body: 'Uçuş odak oturumun tamamlandı 💗' });
    });
});
