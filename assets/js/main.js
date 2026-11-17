// ════════════════════════════════════════════════════════════════
//  Naxshin — app entry: routing, navigation, start-up.
// ════════════════════════════════════════════════════════════════
import { $, $$, byId, html, setHTML } from './util.js';
import { applyI18n, setLang, getLang, tt, roleLabel } from './i18n.js';
import { state, setFb, on, emit, loadCart, loadWishlist } from './state.js';
import { initDelegation, registerActions, closeAllOverlays, openOverlay, toast, scrollTopSmooth } from './ui.js';
import {
  initShop, startCatalogue, renderHome, renderShop, renderDesigners, renderDesignerProfile, renderCart, cartCount, searchShopFor,
} from './shop.js';
import { initAccount, initAuth, renderProfile, avatarInner, prefillContact } from './account.js';
import { initDashboard, renderDashboard } from './dashboard.js';

// ═══════════ routing (#/page/param) ═══════════
const PAGES = {
  home: () => renderHome(),
  shop: () => renderShop(),
  designers: () => renderDesigners(),
  designer: ([id]) => renderDesignerProfile(id || ''),
  about: () => renderAbout(),
  contact: () => prefillContact(),
  profile: ([tab]) => renderProfile(tab || 'info'),
  dashboard: ([section]) => renderDashboard(section || 'overview'),
};

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [page, ...params] = raw.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } });
  return { page: PAGES[page] ? page : 'home', params };
}

function route({ scroll = true } = {}) {
  const prev = state.route;
  const r = parseRoute();
  state.route = r;
  $$('.page').forEach((p) => { p.hidden = p.dataset.page !== r.page; });
  byId('site-footer').hidden = r.page === 'dashboard';
  document.body.dataset.page = r.page;
  const navKey = r.page === 'profile' && r.params[0] === 'wishlist' ? 'wishlist' : r.page === 'designer' ? 'designers' : r.page;
  $$('[data-nav]').forEach((a) => { const on = a.dataset.nav === navKey; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  PAGES[r.page](r.params);
  if (scroll && (prev.page !== r.page || prev.params.join('/') !== r.params.join('/'))) scrollTopSmooth();
}
const rerender = () => route({ scroll: false });

function renderAbout() {
  const set = (k, v) => { const el = $(`[data-live-count="${k}"]`); if (el) el.textContent = v; };
  set('products', state.productsStatus === 'ready' ? state.products.length : '—');
  set('designers', state.designers ? state.designers.length : '—');
  if (!state.designers) renderDesignersQuietly();
}
async function renderDesignersQuietly() {
  try { const { loadDesigners } = await import('./shop.js'); await loadDesigners(); if (state.route.page === 'about') renderAbout(); } catch { /* ignore */ }
}

// ═══════════ navigation chrome ═══════════
function updateChrome() {
  const u = state.user;
  $$('[data-guest-only]').forEach((el) => { el.hidden = !!u; });
  $$('[data-user-only]').forEach((el) => { el.hidden = !u; });
  $$('[data-avatar]').forEach((el) => setHTML(el, u ? avatarInner(u) : ''));
  $$('[data-user-name]').forEach((el) => { el.textContent = u?.name || ''; });
  $$('[data-user-role]').forEach((el) => { el.textContent = u ? roleLabel(state.role) : ''; });
}
function updateCartBadges() {
  const n = cartCount();
  $$('[data-cart-count]').forEach((b) => { b.textContent = n > 99 ? '99+' : n; b.hidden = n === 0; });
}

// ═══════════ install (PWA) ═══════════
let installPrompt = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function updateInstallButtons() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const canOffer = !standalone() && (installPrompt || ios);
  $$('[data-install]').forEach((b) => { b.hidden = !canOffer; });
  $$('[data-install-row]').forEach((b) => { b.hidden = standalone(); });
}
async function install() {
  if (installPrompt) {
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice.catch(() => ({}));
    if (outcome === 'accepted') toast(tt('installing'), 'success');
    installPrompt = null;
    updateInstallButtons();
  } else openOverlay('m-install');
}

// ═══════════ connection status ═══════════
function setBanner(text) {
  const b = byId('net-banner');
  if (!b) return;
  b.textContent = text || '';
  b.hidden = !text;
}
function watchConnection() {
  addEventListener('offline', () => setBanner(tt('offline')));
  addEventListener('online', () => { setBanner(''); toast(tt('backOnline'), 'success'); });
  if (!navigator.onLine) setBanner(tt('offline'));
}

function hideSplash() {
  const s = byId('splash');
  if (!s || s.classList.contains('gone')) return;
  s.classList.add('gone');
  setTimeout(() => s.remove(), 500);
}

// ═══════════ start-up ═══════════
async function boot() {
  applyI18n();
  loadCart();
  loadWishlist();
  initDelegation();
  initShop();
  initAccount();
  initDashboard();

  registerActions({
    'toggle-lang': () => { setLang(getLang() === 'ku' ? 'en' : 'ku'); emit('lang'); },
    'open-drawer': () => openOverlay('drawer'),
    install: () => install(),
    'retry-route': () => rerender(),
    'see-designer-work': (el) => { searchShopFor(el.dataset.name || ''); location.hash = '#/shop'; },
  });
  $$('#profile-tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
    const tab = b.dataset.tab;
    history.replaceState(history.state, '', tab === 'info' ? '#/profile' : `#/profile/${tab}`);
    route({ scroll: false });
  }));

  on('lang', () => { updateChrome(); rerender(); renderCart(); });
  on('user', () => {
    updateChrome();
    if (['profile', 'dashboard', 'designer', 'contact'].includes(state.route.page)) rerender();
  });
  on('products', () => {
    hideSplash();
    if (['home', 'shop', 'designer', 'about'].includes(state.route.page)) rerender();
    if (state.route.page === 'profile' && state.route.params[0] === 'wishlist') rerender();
    updateCartBadges();
  });
  on('designers', () => { if (state.route.page === 'designers') renderDesigners(); });
  on('cart', updateCartBadges);
  on('rerender', rerender);

  addEventListener('hashchange', () => { closeAllOverlays(); route(); });
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; updateInstallButtons(); });
  addEventListener('appinstalled', () => { installPrompt = null; updateInstallButtons(); });

  updateChrome();
  updateCartBadges();
  updateInstallButtons();
  watchConnection();
  route({ scroll: false });
  setTimeout(hideSplash, 2500);

  // Firebase loads separately: if Google's servers are unreachable, the page still opens.
  try {
    const mod = await import('./fb.js');
    setFb(mod);
    startCatalogue();
    initAuth();
  } catch (e) {
    console.error('Firebase failed to load', e);
    setBanner(tt('firebaseDown'));
    state.authReady = true;
    state.productsStatus = 'error';
    emit('products');
    emit('user');
  }

  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
  }
}

boot();
