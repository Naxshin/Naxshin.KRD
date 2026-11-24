// ════════════════════════════════════════════════════════════════
//  Native app layer (Android / iOS app built with Capacitor).
//  On the website this file does nothing: every function checks
//  isApp first. The app and the website share the same code and the
//  same Firebase project, so data is always the same in both.
// ════════════════════════════════════════════════════════════════

const Cap = window.Capacitor;
export const isApp = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
export const platform = isApp ? Cap.getPlatform() : 'web';

// Capacitor's core script (added to the app by mobile/scripts/copy-web.mjs)
// provides registerPlugin; Capacitor.Plugins is the older fallback.
const plugin = (name) => {
  if (!isApp) return null;
  try {
    if (typeof Cap.registerPlugin === 'function') return Cap.registerPlugin(name);
    return Cap.Plugins?.[name] || null;
  } catch { return null; }
};
const App = plugin('App');
const StatusBar = plugin('StatusBar');
const SplashScreen = plugin('SplashScreen');
const Haptics = plugin('Haptics');
const Browser = plugin('Browser');
const Keyboard = plugin('Keyboard');
const NativeAuth = plugin('FirebaseAuthentication');

const safe = (p) => { try { return Promise.resolve(p).catch(() => {}); } catch { return Promise.resolve(); } };

// ── light tap feedback ──
export function tap(style = 'LIGHT') {
  if (Haptics) safe(Haptics.impact({ style }));
}

// ── Google sign-in ──
// Google blocks its sign-in page inside apps, so the app asks Android/iOS
// for the Google account and hands the result to the same Firebase login
// the website uses.
export async function googleSignInNative(fb) {
  if (!NativeAuth) throw Object.assign(new Error('Google sign-in is not available'), { code: 'auth/operation-not-supported-in-this-environment' });
  const res = await NativeAuth.signInWithGoogle({ skipNativeAuth: true });
  const idToken = res?.credential?.idToken;
  if (!idToken) throw Object.assign(new Error('cancelled'), { code: 'auth/popup-closed-by-user' });
  return fb.signInWithCredential(fb.auth, fb.GoogleAuthProvider.credential(idToken, res.credential.accessToken || null));
}
export function nativeSignOut() {
  if (NativeAuth) safe(NativeAuth.signOut());
}

// ── links that must leave the app (WhatsApp, phone, e-mail, other sites) ──
const ownOrigin = location.origin;
function openExternal(url) {
  let u;
  try { u = new URL(url, location.href); } catch { return false; }
  if (u.origin === ownOrigin) return false;
  if (/^(tel|mailto|sms|whatsapp|geo|intent):$/.test(u.protocol) || /(^|\.)wa\.me$|whatsapp\.com$/.test(u.hostname)) {
    // Android/iOS picks the right app (WhatsApp, Phone, Mail…).
    location.href = u.href;
    return true;
  }
  if (u.protocol === 'http:' || u.protocol === 'https:') {
    if (Browser) safe(Browser.open({ url: u.href, presentationStyle: 'popover' }));
    else location.href = u.href;
    return true;
  }
  return false;
}

// Photos saved inside the database (data: links) open in a simple viewer instead.
function openImageViewer(src) {
  const box = document.createElement('div');
  box.className = 'native-viewer';
  box.setAttribute('role', 'dialog');
  box.innerHTML = '<button type="button" aria-label="Close">✕</button>';
  const img = new Image();
  img.src = src;
  img.alt = '';
  box.appendChild(img);
  box.addEventListener('click', () => { box.remove(); viewerOpen = null; });
  document.body.appendChild(box);
  viewerOpen = box;
}
let viewerOpen = null;

// ── Android back button ──
function onBack(hooks) {
  if (viewerOpen) { viewerOpen.remove(); viewerOpen = null; return; }
  // Info pages (privacy, delete account) are separate files: go back to the shop.
  if (!/\/(index\.html)?$/.test(location.pathname)) { if (history.length > 1) history.back(); else location.href = 'index.html'; return; }
  if (hooks.topOverlay?.()) { history.back(); return; } // sheets and dialogs close through history
  const page = (location.hash.replace(/^#\/?/, '').split('/')[0]) || 'home';
  if (page !== 'home') {
    if (history.length > 1) history.back();
    else location.hash = '#/';
    return;
  }
  safe(App.minimizeApp ? App.minimizeApp() : App.exitApp());
}

// ── status bar follows light/dark mode ──
function syncStatusBar() {
  if (!StatusBar) return;
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  safe(StatusBar.setStyle({ style: dark ? 'DARK' : 'LIGHT' }));
}

// ── slower phones: lighter glass effect so scrolling stays smooth ──
function pickPerformanceMode() {
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  if (platform === 'android' && (mem <= 4 || cores <= 4)) document.documentElement.classList.add('lite');
}

/** Called once from main.js after the page is ready. */
export function initNative(hooks) {
  if (!isApp) return;
  const root = document.documentElement;
  root.classList.add('app', `app-${platform}`);
  pickPerformanceMode();
  syncStatusBar();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncStatusBar);

  // External links and window.open → the right app / in-app browser tab.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a || e.defaultPrevented) return;
    const href = a.getAttribute('href') || '';
    if (/^(data|blob):/.test(href)) { e.preventDefault(); openImageViewer(href); return; }
    if (href.startsWith('#') || !/^[a-z][a-z0-9+.-]*:/i.test(href)) return;
    if (openExternal(a.href)) e.preventDefault();
  }, true);
  const nativeOpen = window.open.bind(window);
  window.open = (url, ...rest) => (url && openExternal(String(url)) ? null : nativeOpen(url, ...rest));

  // Small vibration on main buttons.
  document.addEventListener('click', (e) => {
    if (e.target.closest?.('.btn-primary, .btn-whatsapp, [data-action="quick-add"], [data-action="pd-add"], [data-action="toggle-wish"], .tabbar a')) tap();
  }, { passive: true });

  if (App) {
    App.addListener('backButton', () => onBack(hooks));
    // Coming back to the app: refresh connection state.
    App.addListener('resume', () => { hooks.onResume?.(); });
  }
  if (Keyboard) {
    Keyboard.addListener('keyboardWillShow', () => root.classList.add('kb-open'));
    Keyboard.addListener('keyboardWillHide', () => root.classList.remove('kb-open'));
  }
}

/** Hide the native launch screen once the first page is drawn. */
export function hideNativeSplash() {
  if (SplashScreen) safe(SplashScreen.hide({ fadeOutDuration: 250 }));
}
