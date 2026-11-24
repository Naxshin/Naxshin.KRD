// Creates the Android project (mobile/android) and applies Naxshin's settings:
// Google sign-in, signing key, version number, colours, launch screen, icon,
// and "don't copy sign-in data to backups". Safe to run again and again.
// Run from mobile/:  npm run prepare-android
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobile = join(dirname(fileURLToPath(import.meta.url)), '..');
const android = join(mobile, 'android');
const run = (cmd) => execSync(cmd, { cwd: mobile, stdio: 'inherit' });
const res = (p) => join(android, 'app', 'src', 'main', 'res', p);

async function patch(file, edits) {
  let s = await readFile(file, 'utf8');
  for (const [marker, find, replace] of edits) {
    if (s.includes(marker)) continue; // already done
    if (!s.includes(find)) throw new Error(`setup-android: can't find "${find.slice(0, 60)}" in ${file}`);
    s = s.replace(find, replace);
  }
  await writeFile(file, s);
}
async function put(file, text) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text);
}

// 1. The Android project itself
if (!existsSync(join(android, 'app', 'build.gradle'))) run('npx cap add android');

// 2. Google sign-in libraries
await patch(join(android, 'variables.gradle'), [[
  'rgcfaIncludeGoogle',
  /\n}\s*$/.exec(await readFile(join(android, 'variables.gradle'), 'utf8'))[0],
  '\n    // Google sign-in inside the app (@capacitor-firebase/authentication)\n    rgcfaIncludeGoogle = true\n}\n',
]]);

// 3. Version number + signing key (from GitHub secrets)
await patch(join(android, 'app', 'build.gradle'), [
  ['VERSION_CODE', /versionCode 1\n\s*versionName "1.0"/.exec(await readFile(join(android, 'app', 'build.gradle'), 'utf8'))?.[0] ?? 'versionCode 1',
    `// GitHub Actions passes the build number so every new APK installs over the old one.
        versionCode((System.getenv("VERSION_CODE") ?: "1") as int)
        versionName System.getenv("VERSION_NAME") ?: "1.0"`],
  ['hasReleaseKey', '    buildTypes {\n        release {\n',
    `    // Release signing key comes from GitHub secrets (see mobile/README.md).
    // Without it, the release APK is signed with the debug key so it can still be tested.
    def keystorePath = System.getenv("NAXSHIN_KEYSTORE_FILE")
    def hasReleaseKey = keystorePath && file(keystorePath).exists()
    signingConfigs {
        if (hasReleaseKey) {
            release {
                storeFile file(keystorePath)
                storePassword System.getenv("NAXSHIN_KEYSTORE_PASSWORD")
                keyAlias System.getenv("NAXSHIN_KEY_ALIAS") ?: "naxshin"
                keyPassword System.getenv("NAXSHIN_KEY_PASSWORD") ?: System.getenv("NAXSHIN_KEYSTORE_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            signingConfig hasReleaseKey ? signingConfigs.release : signingConfigs.debug
`],
]);

// 4. Sign-in data is not copied to Google backups or to a new phone
await patch(join(android, 'app', 'src', 'main', 'AndroidManifest.xml'), [[
  'data_extraction_rules', 'android:allowBackup="true"',
  'android:allowBackup="false"\n        android:fullBackupContent="false"\n        android:dataExtractionRules="@xml/data_extraction_rules"',
]]);
await put(res('xml/data_extraction_rules.xml'), `<?xml version="1.0" encoding="utf-8"?>
<!-- Sign-in data stays on this phone: it is not copied to Google backups or to a new phone. -->
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="root" /><exclude domain="database" /><exclude domain="sharedpref" /><exclude domain="file" />
    </cloud-backup>
    <device-transfer>
        <exclude domain="root" /><exclude domain="database" /><exclude domain="sharedpref" /><exclude domain="file" />
    </device-transfer>
</data-extraction-rules>
`);

// 5. Colours (light + dark) and launch screen theme
const colors = (primary, dark, bg) => `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${primary}</color>
    <color name="colorPrimaryDark">${dark}</color>
    <color name="colorAccent">#C9A96E</color>
    <!-- Same as the site's background, so there is no white flash while the app opens. -->
    <color name="naxshin_bg">${bg}</color>
</resources>
`;
await put(res('values/colors.xml'), colors('#2D4A3E', '#2D4A3E', '#F3ECE0'));
await put(res('values-night/colors.xml'), colors('#8CC4A9', '#110C0B', '#110C0B'));
await put(res('values/styles.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>

    <style name="AppTheme" parent="Theme.AppCompat.DayNight.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
        <item name="android:windowBackground">@color/naxshin_bg</item>
    </style>

    <!-- Launch screen: brand colour + logo while the app starts (Android 12+ shows the app icon). -->
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
        <item name="windowSplashScreenBackground">@color/naxshin_bg</item>
        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
</resources>
`);

// 6. App icon + launch screen pictures, made from the website's logo
run('node scripts/make-icons.mjs');
run("npx @capacitor/assets generate --android --iconBackgroundColor '#F6F0E4' --iconBackgroundColorDark '#110C0B' --splashBackgroundColor '#F3ECE0' --splashBackgroundColorDark '#110C0B'");
const bgFile = res('values/ic_launcher_background.xml');
if (existsSync(bgFile)) await writeFile(bgFile, (await readFile(bgFile, 'utf8')).replace(/#FFFFFF/i, '#F6F0E4'));

console.log('✓ Android project ready');
