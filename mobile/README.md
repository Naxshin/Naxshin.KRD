# Naxshin — phone app (Android now, iOS later)

The app is built from **the same code as the website** (the files in the repo root) and talks to
**the same Firebase project** (`naxshin-e5e25`). Products, orders, accounts, ads and ratings are the
same everywhere: a change on the website shows in the app straight away, and the other way round.

When you change the website, push to `main` → GitHub builds a new APK automatically.

```
mobile/
  capacitor.config.json   app name, id (krd.naxshin.app), splash, Google sign-in settings
  scripts/copy-web.mjs    copies the website into the app (and saves Firebase inside it)
  scripts/setup-android.mjs  makes the Android project (mobile/android) with Naxshin's settings
  scripts/make-icons.mjs  makes the app icon and launch screen from the site's logo
assets/js/native.js       (in the site) the app-only features; does nothing on the website
.github/workflows/android.yml   builds the APK on GitHub
```

## What the app adds on top of the website

- Google sign-in with the phone's own Google account picker (Google blocks its web sign-in page inside apps)
- Android back button: closes sheets/dialogs, goes back a page, and leaves the app from Home
- WhatsApp, phone and e-mail links open the right app; other links open in an in-app browser tab
- Launch screen and icon in the Naxshin colours, light and dark mode, status bar that follows the theme
- Bottom tab bar hides while the keyboard is open
- Slower phones (≤4 GB memory or ≤4 cores) get solid panels instead of live blur, so scrolling stays smooth
- Firebase is stored inside the app, so it opens fast and the shop can be browsed offline
- Sign-in data is not copied to Google backups or to another phone

## One-time setup

### 1. Register the Android app in Firebase
Firebase Console → ⚙ Project settings → **Your apps** → **Add app** → Android

- Package name: `krd.naxshin.app`
- App nickname: `Naxshin Android`
- Debug signing certificate SHA-1: `1B:CA:5F:0C:E8:B2:DC:92:69:B8:7E:59:96:6A:66:A2:9B:AB:30:88`

Press **Register app**, then **Download google-services.json**. After that, on the same page, under the
Android app → **Add fingerprint** → add the SHA-256 too:
`14:8A:50:D5:08:52:FC:E3:95:F0:A8:3A:39:77:01:EE:13:A6:8C:AC:19:B4:E5:A0:65:EE:9D:4E:3C:14:F4:90`

(These fingerprints belong to the app's signing key. They are not secret.)

### 2. Add three secrets on GitHub
GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the whole text inside `keystore.b64` (from the private zip) |
| `ANDROID_KEYSTORE_PASSWORD` | the password inside `keystore-password.txt` |
| `GOOGLE_SERVICES_JSON` | the whole text of the `google-services.json` you downloaded |

Keep `naxshin-release.jks` and its password somewhere safe (not in the repo). Every future update of
the app — and the Play Store later — must be signed with this same key.

### 3. Get the APK
GitHub → **Actions** → **Build Android app** → open the newest run → **Artifacts** → download →
unzip → copy the `.apk` to the phone → open it → allow "Install unknown apps" when Android asks.

To build again without changing anything: Actions → Build Android app → **Run workflow**.

## Testing checklist

- [ ] Sign in with e-mail, and with Google
- [ ] Add a product on the website → it appears in the app (and the other way round)
- [ ] Place an order → WhatsApp opens with the message
- [ ] Back button: close a sheet, go back a page, leave the app from Home
- [ ] Dark mode on the phone → the app follows
- [ ] Upload a photo (profile / product) from the phone's gallery or camera
- [ ] Turn on airplane mode → the shop still opens

## Building on your own computer (optional)

Needs Node 22, Java 21 and Android Studio.

```bash
cd mobile
npm install
npm run prepare-android   # makes mobile/android from the site
```
Then put `google-services.json` in `mobile/android/app/` and run `npx cap open android`.
The `android/` folder is made by the build each time, so it is not stored in the repo.

## iPhone (iOS)

`.github/workflows/ios.yml` builds the iPhone app on a Mac at GitHub (you don't need a Mac).

- **Without Apple secrets** it makes a Simulator test build. That proves everything compiles,
  but it cannot be installed on a real iPhone.
- **With Apple secrets** it signs the app and sends it to **TestFlight**. Testers install it with
  Apple's TestFlight app, and from there you can submit it to the App Store.

### One-time setup
1. **Apple Developer Program** ($99/year): https://developer.apple.com/programs/
2. **App Store Connect → Apps → +  New App**: platform iOS, name `Naxshin`, bundle ID `krd.naxshin.app`
   (if the bundle ID isn't in the list yet, create it under Certificates, Identifiers & Profiles → Identifiers).
3. **App Store Connect → Users and Access → Integrations → App Store Connect API → +**:
   role **App Manager** (or Admin). Download the `.p8` file (only once!), and note the **Key ID** and **Issuer ID**.
4. **Firebase → Project settings → Add app → iOS**: bundle ID `krd.naxshin.app` → download `GoogleService-Info.plist`.
5. **GitHub → Settings → Secrets and variables → Actions** → add:

| Name | Value |
|---|---|
| `APPLE_TEAM_ID` | your 10-character Team ID (developer.apple.com → Account → Membership) |
| `ASC_KEY_ID` | the API key's Key ID |
| `ASC_ISSUER_ID` | the Issuer ID shown above the keys list |
| `ASC_KEY_P8` | the whole text of the `.p8` file |
| `GOOGLE_SERVICE_INFO_PLIST` | the whole text of `GoogleService-Info.plist` |

Then Actions → **Build iPhone app** → Run workflow. When it finishes, the build appears in
App Store Connect → TestFlight after Apple processes it (10–30 minutes).

### Before the App Store
Apple asks apps that offer Google sign-in to also offer **Sign in with Apple** (App Review Guideline 4.8).
That is the next step before submitting to the App Store; TestFlight testing works without it.
