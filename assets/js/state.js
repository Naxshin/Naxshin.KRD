// ════════════════════════════════════════════════════════════════
//  Shared state + a tiny event bus.
// ════════════════════════════════════════════════════════════════
import { readJSON, writeJSON } from './util.js';

/** Firebase module, set once it has loaded (null while offline/unavailable). */
export let fb = null;
export const setFb = (m) => { fb = m; };

export const state = {
  user: null,            // users/{uid} document + uid
  role: 'guest',         // effective role (only counts when status is active)
  authReady: false,
  products: [],          // approved products (live)
  productsStatus: 'loading', // loading | ready | error
  designers: null,       // public designer directory (loaded on demand)
  ratings: null,         // { [designerId]: { sum, count, mine } }
  ads: [],
  cart: [],
  wishlist: [],
  route: { page: 'home', params: [] },
};

// ── events ──
const listeners = {};
export const on = (evt, fn) => { (listeners[evt] ||= []).push(fn); };
export const emit = (evt, data) => { (listeners[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(evt, e); } }); };

// ── roles ──
export function effectiveRole(u) {
  if (!u) return 'guest';
  const role = u.role || 'customer';
  return (u.status || 'active') === 'active' ? role : 'customer';
}
export const isRole = (...roles) => roles.includes(state.role);

// ── cart (only ids/options are stored; names, prices and photos come from the live catalogue) ──
const CART_KEY = 'naxshin-cart-v2';
export function loadCart() {
  let cart = readJSON(CART_KEY, null);
  if (!Array.isArray(cart)) {
    // migrate the old cart (it stored whole photos and could fill the browser storage)
    const old = readJSON('naxshin-cart', []);
    cart = (Array.isArray(old) ? old : []).map((c) => ({ id: String(c.id), qty: Math.max(1, Number(c.qty) || 1), size: c.size || '', color: c.colorName || '' }));
    try { localStorage.removeItem('naxshin-cart'); } catch { /* ignore */ }
  }
  state.cart = cart.filter((c) => c && c.id).map((c) => ({ ...c, key: lineKey(c) }));
  writeJSON(CART_KEY, state.cart);
}
export const lineKey = (c) => [c.id, c.size || '', c.color || ''].join('|');
export function saveCart() { writeJSON(CART_KEY, state.cart.map(({ id, qty, size, color }) => ({ id, qty, size, color }))); emit('cart'); }

// ── favourites ──
const WISH_KEY = 'naxshin-wishlist';
export function loadWishlist() { const w = readJSON(WISH_KEY, []); state.wishlist = Array.isArray(w) ? w.map(String) : []; }
export function saveWishlist() { writeJSON(WISH_KEY, state.wishlist); emit('wishlist'); }

export const productById = (id) => state.products.find((p) => p.id === id);
