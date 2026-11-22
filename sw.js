// Naxshin service worker — network first, cached copy only when offline.
// Bump VERSION whenever you want old caches cleared.
const VERSION = 'naxshin-v4';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'assets/app.css',
  'assets/js/main.js', 'assets/js/util.js', 'assets/js/i18n.js', 'assets/js/state.js', 'assets/js/ui.js',
  'assets/js/shop.js', 'assets/js/account.js', 'assets/js/dashboard.js', 'assets/js/totp.js', 'assets/js/fb.js',
  'assets/img/mark.png', 'assets/img/favicon.png', 'assets/img/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Only this site's own files. Firebase, fonts and icons are handled by the browser as usual.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
  );
});
