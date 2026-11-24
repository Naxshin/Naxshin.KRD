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

## iOS (later)
After the Android version is approved: `npm i @capacitor/ios && npx cap add ios`, add the iOS app in
Firebase, and build on a Mac (or a macOS GitHub runner). `native.js` already supports iOS.
