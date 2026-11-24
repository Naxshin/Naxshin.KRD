// Creates the iPhone project (mobile/ios) and applies Naxshin's settings:
// Google sign-in, photo/camera permission texts, icon and launch screen.
// Safe to run again and again. Run from mobile/:  npm run prepare-ios
//
// For Google sign-in, put GoogleService-Info.plist (from the Firebase console,
// iOS app "krd.naxshin.app") in mobile/ios/App/App/ before running this.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import plistLib from 'plist';

const mobile = join(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = join(mobile, 'ios', 'App', 'App');
const pbxFile = join(mobile, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
const plistFile = join(appDir, 'Info.plist');
const googlePlist = join(appDir, 'GoogleService-Info.plist');
const run = (cmd) => execSync(cmd, { cwd: mobile, stdio: 'inherit' });

// 1. The iPhone project itself (Swift Package Manager, no CocoaPods)
if (!existsSync(pbxFile)) run('npx cap add ios --packagemanager SPM');

// 2. Info.plist: permission texts, encryption answer, Google sign-in URL scheme
const info = plistLib.parse(await readFile(plistFile, 'utf8'));
Object.assign(info, {
  CFBundleDisplayName: 'Naxshin',
  NSCameraUsageDescription: 'Naxshin uses the camera so you can take a profile photo or a product photo. / نەخشین کامێرا بەکاردەهێنێت بۆ گرتنی وێنەی پڕۆفایل یان بەرهەم.',
  NSPhotoLibraryUsageDescription: 'Naxshin opens your photos so you can choose a profile photo or a product photo. / نەخشین وێنەکانت دەکاتەوە بۆ هەڵبژاردنی وێنەی پڕۆفایل یان بەرهەم.',
  NSMicrophoneUsageDescription: 'Only used if you record a video to upload. / تەنها بۆ تۆمارکردنی ڤیدیۆ بۆ ناردن.',
  ITSAppUsesNonExemptEncryption: false,
  LSApplicationQueriesSchemes: ['whatsapp'],
});
if (existsSync(googlePlist)) {
  const g = plistLib.parse(await readFile(googlePlist, 'utf8'));
  if (!g.REVERSED_CLIENT_ID) throw new Error('GoogleService-Info.plist has no REVERSED_CLIENT_ID — enable Google sign-in in Firebase and download it again');
  info.CFBundleURLTypes = [{ CFBundleURLSchemes: [g.REVERSED_CLIENT_ID] }];
  console.log('✓ Google sign-in URL scheme added');
} else {
  console.warn('! GoogleService-Info.plist not found — the app builds, but Google sign-in will not work on iPhone');
}
await writeFile(plistFile, plistLib.build(info));

// 3. Put GoogleService-Info.plist inside the app (add it to the Xcode project)
let pbx = await readFile(pbxFile, 'utf8');
if (existsSync(googlePlist) && !pbx.includes('GoogleService-Info.plist')) {
  const FILE = 'A1B2C3D4E5F6A7B8C9D0E1F2', BUILD = 'A1B2C3D4E5F6A7B8C9D0E1F3';
  const edits = [
    [/(\t\t2FAD9763203C412B000D30F8 \/\* config\.xml in Resources \*\/ = [^\n]+\n)/,
      `$1\t\t${BUILD} /* GoogleService-Info.plist in Resources */ = {isa = PBXBuildFile; fileRef = ${FILE} /* GoogleService-Info.plist */; };\n`],
    [/(\t\t2FAD9762203C412B000D30F8 \/\* config\.xml \*\/ = [^\n]+\n)/,
      `$1\t\t${FILE} /* GoogleService-Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = "GoogleService-Info.plist"; sourceTree = "<group>"; };\n`],
    [/(\t\t\t\t2FAD9762203C412B000D30F8 \/\* config\.xml \*\/,\n)/,
      `$1\t\t\t\t${FILE} /* GoogleService-Info.plist */,\n`],
    [/(\t\t\t\t2FAD9763203C412B000D30F8 \/\* config\.xml in Resources \*\/,\n)/,
      `$1\t\t\t\t${BUILD} /* GoogleService-Info.plist in Resources */,\n`],
  ];
  for (const [re, rep] of edits) {
    if (!re.test(pbx)) throw new Error('setup-ios: Xcode project layout changed; cannot add GoogleService-Info.plist');
    pbx = pbx.replace(re, rep);
  }
  await writeFile(pbxFile, pbx);
  console.log('✓ GoogleService-Info.plist linked in the Xcode project');
}

// 4. App icon + launch screen, made from the website's logo
run('node scripts/make-icons.mjs');
run("npx @capacitor/assets generate --ios --iconBackgroundColor '#F6F0E4' --iconBackgroundColorDark '#110C0B' --splashBackgroundColor '#F3ECE0' --splashBackgroundColorDark '#110C0B'");

console.log('✓ iPhone project ready');
