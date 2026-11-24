// Copies the website (the repo root) into mobile/www so the app is built
// from exactly the same code. Run from mobile/:  npm run copy-web
//
// It also tries to save a copy of the Firebase library inside the app, so
// the app opens fast and works without internet on first launch. If that
// download fails, the app simply loads Firebase from Google like the site.
import { cp, rm, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..', '..');
const www = join(here, '..', 'www');

await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });
for (const item of ['index.html', 'manifest.webmanifest', 'assets']) {
  if (!existsSync(join(site, item))) throw new Error(`Missing ${item} in the site folder`);
  await cp(join(site, item), join(www, item), { recursive: true });
}

// ── Firebase inside the app ──
const CDN = 'https://www.gstatic.com/firebasejs/';
const fbFile = join(www, 'assets', 'js', 'fb.js');
let fbSrc = await readFile(fbFile, 'utf8');
const version = (fbSrc.match(/firebasejs\/([\d.]+)\//) || [])[1];
const files = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'];
try {
  if (!version) throw new Error('Firebase version not found in fb.js');
  const vendor = join(www, 'assets', 'vendor', 'firebase');
  await mkdir(vendor, { recursive: true });
  for (const f of files) {
    const res = await fetch(`${CDN}${version}/${f}`, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
    let code = await res.text();
    code = code.split(`${CDN}${version}/`).join('./');   // files import each other
    await writeFile(join(vendor, f), code);
  }
  fbSrc = fbSrc.split(`${CDN}${version}/`).join('../vendor/firebase/');
  await writeFile(fbFile, fbSrc);
  let index = await readFile(join(www, 'index.html'), 'utf8');
  index = index.split(`${CDN}${version}/`).join('assets/vendor/firebase/');
  await writeFile(join(www, 'index.html'), index);
  console.log(`✓ Firebase ${version} saved inside the app`);
} catch (e) {
  console.warn(`! Firebase stays online-only (${e.message})`);
}

// The website's offline helper isn't needed inside the app.
const count = (await readdir(join(www, 'assets', 'js'))).length;
console.log(`✓ Website copied into mobile/www (${count} script files)`);
