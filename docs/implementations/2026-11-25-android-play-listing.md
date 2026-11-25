# 2026-11-25 — The Play listing and App content for Android build 1: the owner's fill-in sheet

**Status:** Drafted for the owner. Nothing here is entered anywhere yet: every Play Console field, the testers' invitation and the privacy policy change are the owner's to approve and do. The answers fit Android build 1 as [its record](2026-11-25-android-build1.md) describes it: no accounts, pairing or start-up reports on Android, Google's test ads, and exact alarms. When Sign in with Google arrives (the plan's Stage 3), the Data safety form, the content rating and the policy change with it (§5).
**Branch:** `feat/1.5.2-android`
**Plan:** [the closed-test plan](2026-11-25-android-closed-test-plan.md), Stage 0. This follows F4, [the App Store listing](2026-11-06-phase2-f4-listing.md), for Google Play.

---

## 1. Problem / Motivation

**What Play needs before a closed track can be published:**
- App content's declarations;
- a complete store listing;
- a privacy policy that covers what the app does.

Each day these take is a day before the 14 days start. This sheet drafts every answer from the code as built, so the owner can copy rather than work out.

**Two gaps found while drafting:**
- **The privacy policy** says it covers "your data on iPhone", and mentions Android only as "the older Android version, 1.3.1" (§3.6).
- **Play's phone screenshots** must be no more than twice as long as they are wide. The emulator's 1080×2400 is 2.22:1, so a raw screenshot is refused, and the iPhone set shows Fly and pairing, which Android doesn't have (§3.5).

## 2. What Changed

| File | Change |
|------|--------|
| `docs/implementations/2026-11-25-android-play-listing.md` | This record: the sheet. |
| `scripts/design/play-feature-graphic.mjs` | New. Composes the feature graphic with headless Chrome, and scales the store icon. |
| `art/out/store-play/feature-graphic.jpg`, `art/out/store-play/icon-512.png` | New. Its two outputs. |
| `docs/README.md` | Its index row. |

## 3. The sheet

### 3.1 App content (Policy › App content)

| Section | Answer | Why |
|---------|--------|-----|
| **Privacy policy** | `https://valentine-pomodoro-developer-websit.vercel.app/privacy/`, with its trailing slash | The same page as iOS (F4). It needs the Android paragraph in §3.6 first. |
| **App access** | All functionality is available without special access | Android build 1 has no sign-in. |
| **Ads** | Yes, the app contains ads | Google AdMob: the Stats banner and the occasional interstitial. |
| **Content rating** | IARC questionnaire, category "Utility, Productivity, Communication or Other":<br>• no violence, sexuality, language, controlled substances or gambling;<br>• **users don't interact or exchange content**;<br>• no location sharing;<br>• no digital purchases. | Love notes stay on the phone on Android. Pairing would change the interaction answer, so the questionnaire is taken again then. |
| **Target audience** | 18 and over | The primary user is university-age couples (`PRODUCT.md`), and the policy says the app isn't meant for children under 13. Adding 13–17 is possible, but it brings Play's teen-ads rules, so it's the owner's call. |
| **News app** | No | — |
| **Data safety** | §3.2 | — |
| **Advertising ID** | Yes, it uses the advertising ID: advertising or marketing, analytics, fraud prevention | The ads SDK adds `com.google.android.gms.permission.AD_ID` (seen in `dumpsys package` on the emulator). |
| **Government apps / Financial features / Health** | None | — |
| **Exact alarm** (sensitive permissions) | Core functionality: **timer**. Description below. | `USE_EXACT_ALARM` (DEF-012). [Play's policy](https://support.google.com/googleplay/android-developer/answer/16558241), read on 2026-11-25, lists "The app is an alarm or timer app" as an accepted case and asks for the Play Console declaration. Apps that don't qualify "will be disallowed from publishing on Google Play". One line of the same page's key considerations says "alarm or calendar". If the declaration is refused, the plugin's commit is dropped and alerts go back to inexact alarms (DEF-012 reopens). |

**The exact-alarm description**, ready to paste:

> Valentine Pomodoro is a focus (Pomodoro) timer. When a focus session or a break ends, the app alerts the user at that exact moment with a local notification, also when the phone is locked or the app is in the background. Without exact alarms, Android may deliver this alert up to 75% of the session's length late: up to about 19 minutes late for a 25-minute focus. The optional daily reminder uses the same scheduling.

### 3.2 Data safety

**The answers**, from Google's [data disclosure for the Mobile Ads SDK](https://developers.google.com/admob/android/privacy/play-data-disclosure) (it describes SDK 25.5.0) and from the code:
- **Does the app collect or share any of the required user data types?** Yes. Only through the ads SDK: the app itself sends nothing on Android, because pairing and the start-up reports are off and the Supabase client is never loaded.
- **Is all user data encrypted in transit?** Yes. Google: the SDK's data is "encrypted in transit using the Transport Layer Security (TLS) protocol".
- **Can users request deletion?** No. The developer keeps no data from Android, and the device's own data is deleted with the app. This becomes yes, with an account-deletion link, when Android gets accounts (§5).

| Play's data type | What collects it | Collected | Shared | Optional | Purposes |
|------------------|------------------|-----------|--------|----------|----------|
| Location › Approximate location | The ads SDK, from the IP address | Yes | Yes | No | Advertising or marketing, Analytics, Fraud prevention, security and compliance |
| App activity › App interactions | The ads SDK: "app launch, taps, and video views" | Yes | Yes | No | The same |
| App info and performance › Diagnostics | The ads SDK: "app launch time, hang rate, and energy usage" | Yes | Yes | No | The same |
| Device or other IDs › Device or other IDs | The ads SDK: the advertising ID and the app set ID | Yes | Yes | No | The same |

The mapping of Google's four items to Play's type names is ours: Google's page names the data, not Play's categories. Nothing is processed ephemerally.

**Not collected:**
- the timer, stats, notes and settings, which stay on the phone;
- notifications, which are local;
- the update check, which reads a public file on GitHub Pages and sends no data;
- crash data: the app has no crash reporter.

### 3.3 Store listing (Grow › Store presence › Main store listing), English and Turkish

**App name:** Valentine Pomodoro (18 of 30).

**Short description** (63 and 76 of 80):
> A focus timer that feels like a little diary, with Pomo & Doro.

> Pomo ile Doro'yla, küçük bir günlük gibi hissettiren bir odak zamanlayıcısı.

**Full description** (1270 and 1306 of 4000). This is 1.4's App Store text with three changes:
- no Fly Mode section, since Android has no Fly;
- "your phone's appearance" for "your iPhone's appearance";
- the sounds line without the silent switch, which wasn't checked on Android.

The pairing section that 1.5 added on iOS stays out until Android has pairing.

> Valentine Pomodoro is a focus timer that feels like a little diary. Pick how long you want to focus, start the timer, and every session you finish presses a sticker onto today's page.
>
> MEET POMO & DORO
> The two little faces of your timer show you around on your first visit and keep you company while you work. You can watch their tour again any time from Settings.
>
> FOCUS YOUR WAY
> • Pick a length in one tap: 25/5, 50/10, 90/20, or Custom with your own durations
> • Two timer layouts: the Ring, or Facing pages
> • The timer stays accurate when you leave the app or lock your phone
> • A notification tells you when a focus or a break ends, and an optional daily reminder invites you back
>
> A DIARY THAT FILLS UP
> • A sticker for every focus you finish, toward a daily goal you set
> • Stats as a stack of postcards, one for each day, in sessions or minutes
> • A love streak for every day you reach your goal
>
> LOVE NOTES
> A sweet note appears after each focus session. Write your own, edit them, and keep the built-in ones too.
>
> CALM BY DESIGN
> • Strawberry Milk by day and Midnight Plum by night, following your phone's appearance
> • Soft sounds when a focus or a break starts and when you finish
> • In English and Turkish
>
> No account and no sign-in. Open the app and start focusing.

> Valentine Pomodoro, küçük bir günlük gibi hissettiren bir odak zamanlayıcısı. Ne kadar odaklanmak istediğini seç, zamanlayıcıyı başlat; bitirdiğin her oturum bugünün sayfasına bir çıkartma yapıştırır.
>
> POMO İLE DORO'YLA TANIŞ
> Zamanlayıcının iki küçük yüzü ilk açılışta sana etrafı gösterir ve çalışırken sana eşlik eder. Turu istediğin zaman Ayarlar'dan yeniden izleyebilirsin.
>
> KENDİ TARZINDA ODAKLAN
> • Süreni tek dokunuşla seç: 25/5, 50/10, 90/20 ya da kendi sürelerinle Özel
> • İki zamanlayıcı düzeni: Halka ya da Karşılıklı sayfalar
> • Uygulamadan çıksan ya da telefonunu kilitlesen de zamanlayıcı doğru saymaya devam eder
> • Odak ya da mola bittiğinde bir bildirim gelir; istersen günlük bir hatırlatıcı da seni geri çağırır
>
> DOLDUKÇA GÜZELLEŞEN BİR GÜNLÜK
> • Bitirdiğin her odak için bir çıkartma, belirlediğin günlük hedefe doğru
> • İstatistikler bir kartpostal destesi: her gün için bir kart, oturum ya da dakika olarak
> • Hedefine ulaştığın her gün aşk serine sayılır
>
> AŞK NOTLARI
> Her odaktan sonra tatlı bir not çıkar. Kendi notlarını yaz ve düzenle; hazır notlar da seninle kalır.
>
> SAKİN BİR TASARIM
> • Gündüz açık, gece koyu renkler; telefonunun görünümüne uyar
> • Odak ya da mola başlarken ve bitirdiğinde yumuşak sesler
> • Türkçe ve İngilizce
>
> Hesap yok, giriş yok. Uygulamayı aç ve odaklanmaya başla.

**Store settings:**
- **Category:** Productivity.
- **Tags:** Play's own list; pick focus, productivity and time management where offered.
- **Contact email:** the policy's.
- **Website:** the developer website.

### 3.4 The closed test (Test and release › Testing › Closed testing)

1. **Create a closed track**, or use the default one.
2. **Countries:** every country a tester lives in. A tester elsewhere can't install.
3. **Testers:**
   - A Google Group is easiest to grow, since anyone who joins the group is in. An email list also works.
   - Each tester needs a Google account.
   - Set **the feedback URL or email** that testers see, for example the group's address. Play's production application asks how feedback was collected.
4. **The release:**
   - the AAB from the production build (versionCode 7);
   - release name "1.5.2 (7)";
   - release notes in English and Turkish, for example "The first Android test of 1.5.2. Thank you for testing!" and "1.5.2'nin ilk Android testi. Test ettiğin için teşekkürler!".
5. **Send for review** (Publishing overview). Once it's published, the opt-in link appears, and it can take a few hours to start working.
6. **Send testers the link**, with the message below. Day 0 is the day the twelfth tester is opted in.

**To testers** (a draft):

> Hi! Thanks for helping me test Valentine Pomodoro on Android. Google asks for testers to stay in the test for 14 days in a row, so please don't leave it early.
> 1. Join [the group] with the Google account you use on your Android phone.
> 2. Open [the opt-in link] and tap "Become a tester".
> 3. Install Valentine Pomodoro from Google Play from that page.
> 4. Use it for real: run a few focus sessions with the phone locked, set a daily goal, write a love note, and check that the alerts come on time.
> 5. Tell me anything odd or anything you'd like at [the feedback address]. Screenshots help.

> Merhaba! Valentine Pomodoro'yu Android'de test etmeme yardım ettiğin için teşekkürler. Google, test edenlerin 14 gün boyunca testte kalmasını istiyor; lütfen erken ayrılma.
> 1. Android telefonunda kullandığın Google hesabıyla [gruba] katıl.
> 2. [Katılım bağlantısını] aç ve "Test kullanıcısı ol"a dokun.
> 3. O sayfadan Valentine Pomodoro'yu Google Play'den yükle.
> 4. Gerçekten kullan: telefon kilitliyken birkaç odak oturumu yap, günlük bir hedef koy, bir aşk notu yaz ve uyarıların zamanında geldiğine bak.
> 5. Garip bir şey görürsen ya da bir isteğin olursa [geri bildirim adresine] yaz. Ekran görüntüleri çok işe yarar.

### 3.5 Graphics

| Asset | Play's rule | Source |
|-------|-------------|--------|
| App icon | 512×512 PNG, up to 1 MB | `art/out/store-play/icon-512.png` (26 KB), scaled from `brand/png/valentine-pomodoro-app-icon-light-1024.png` by `scripts/design/play-feature-graphic.mjs` |
| Feature graphic | 1024×500, JPEG or 24-bit PNG (no alpha) | `art/out/store-play/feature-graphic.jpg` (39 KB, a draft for the owner). The same script composes it from the brand kit: the horizontal colour logo, and Pomo & Doro celebrating, on the page colour. It has no words beyond the logo, so it serves both languages. |
| Phone screenshots | 2–8; each side 320–3840 px; the long side at most twice the short | **English, taken 2026-11-25:** `art/out/store-play/phone/en/01-timer.png` … `07-dark.png`. They're seven 1080×1920 opaque PNGs from preview `e44c8a48` on the emulator, with a clean status bar, no test ad, no Fly and no pairing ([build 1's record §6.5](2026-11-25-android-build1.md#65-the-fourth-preview-build-e44c8a48-from-8b79df8)). The owner picks which to use; Stats is the weakest, being empty on a fresh install. **Turkish:** not taken yet. |

### 3.6 The privacy policy's Android paragraph (a draft; the owner approves, in this repository and on the website)

**Two edits to the existing text:**
- "This policy says what the app does with your data on iPhone." becomes "…on iPhone and Android."
- "stored on your iPhone" becomes "stored on your phone".

**The 1.3.1 sentence is replaced by:**

> **On Android (from 1.5.2).** The Android version has no accounts, no pairing and no start-up reports yet, so it sends nothing to our servers, and your timer, stats and notes stay on your phone. It checks GitHub Pages for its newest version number. Ads come from Google AdMob, as on iPhone: the app asks for non-personalised ads only, and Google's software receives information such as your IP address, how you interact with the app and its ads, performance information and your phone's advertising ID, to show and count ads and to prevent fraud. You can reset or delete the advertising ID in your phone's settings.

> **Android'de (1.5.2'den itibaren).** Android sürümünde henüz hesap, eşleşme ve açılış raporu yok; bu yüzden sunucularımıza hiçbir şey göndermez, zamanlayıcın, istatistiklerin ve notların telefonunda kalır. En yeni sürüm numarasını GitHub Pages'ten kontrol eder. Reklamlar, iPhone'da olduğu gibi Google AdMob'dan gelir: uygulama yalnızca kişiselleştirilmemiş reklam ister; Google'ın yazılımı reklamları göstermek, saymak ve dolandırıcılığı önlemek için IP adresin, uygulamayla ve reklamlarla etkileşimin, performans bilgileri ve telefonunun reklam kimliği gibi bilgileri alır. Reklam kimliğini telefonunun ayarlarından sıfırlayabilir ya da silebilirsin.

## 4. Mathematical / Statistical Details

**Character counts** are Unicode code points (`[...text].length`), which is how Play counts:

| Text | Count | Limit |
|------|-------|-------|
| Short description, English | 63 | 80 |
| Short description, Turkish | 76 | 80 |
| Full description, English | 1270 | 4000 |
| Full description, Turkish | 1306 | 4000 |

**The screenshot rule** is max(*w*, *h*) ≤ 2·min(*w*, *h*). For 1080×2400, 2400/1080 ≈ 2.22, so a raw screenshot fails. A 9:16 crop, 1080×1920 (ratio 1.78), passes.

## 5. Design Decisions

| Decision | Alternatives considered | Why this one |
|----------|------------------------|--------------|
| Declare only the ads SDK's data | Also declare the timer's data | Play counts data that leaves the device. On Android, nothing of the app's own does. |
| Deletion: no | Yes, by email | The developer has nothing from Android to delete. It becomes yes, with Play's account-deletion link, when accounts arrive. |
| 18 and over | 13 and over | Fewer rules for ads to teens. The audience is university-age couples. The owner can widen it. |
| The 1.4 description minus Fly | Write a new one | The owner approved 1.4's text in both languages, and only the parts Android lacks come out. |

**When Sign in with Google arrives (Stage 3), these change together:**
- **App access:** pairing needs a sign-in, so Google's reviewers get a test account or instructions.
- **Content rating:** users exchange content (notes between partners).
- **Data safety:** it gains Name, User IDs, Other user-generated content (the notes), App interactions (the days), and Other data (time zone and language). It also gains "Can users request deletion: yes", with the in-app path and Play's required web link.
- **The privacy policy's paragraph** is rewritten.

## 6. Verification

- [x] The text counts are in §4, computed with a script.
- [x] Every data claim is traced to the code or to Google's page:
  - no Supabase on Android: `PAIRING_ENABLED` and `STARTUP_REPORTS_ENABLED` are false there, and the client is lazy (ADR-0049);
  - `AD_ID` from `dumpsys package`;
  - the update check from `useUpdateCheck.ts`.
- [ ] The owner enters it, and Play Console shows App content complete.
- [ ] The policy change is approved and live on the website, checked with a cache-busting parameter.

## 7. Related Docs

- [The closed-test plan](2026-11-25-android-closed-test-plan.md) · [Android build 1](2026-11-25-android-build1.md)
- [F4, the App Store listing](2026-11-06-phase2-f4-listing.md) · [Stage E, 1.4's listing text](2026-11-01-phase1-stage-e.md)
- [E2, the privacy policy](2026-11-06-phase2-e2-privacy-policy.md)
