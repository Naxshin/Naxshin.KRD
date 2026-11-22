// ════════════════════════════════════════════════════════════════
//  Small helpers shared by every module.
//  Rule of thumb: build HTML ONLY with the html`` tag below. Every
//  value inside ${…} is escaped unless it is itself html`` output.
// ════════════════════════════════════════════════════════════════

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"'`]/g, (c) => ESC[c]);

export class SafeHTML {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
const part = (v) => {
  if (v instanceof SafeHTML) return v.s;
  if (Array.isArray(v)) return v.map(part).join('');
  if (v === null || v === undefined || v === false) return '';
  return esc(v);
};
/** Tagged template: html`<b>${name}</b>` — name is escaped. */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += part(values[i]) + strings[i + 1];
  return new SafeHTML(out);
}
/** Mark a trusted string (our own translations / icons) as HTML. Never pass user data. */
export const trusted = (s) => new SafeHTML(String(s));
export const setHTML = (el, h) => { if (el) el.innerHTML = part(h); };

// ── DOM ──
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const byId = (id) => document.getElementById(id);
export const show = (el, yes = true) => { if (el) el.hidden = !yes; };

// ── URLs & images coming from the database ──
const IMG_RE = /^(data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+|https:\/\/[^\s"'<>]+)$/i;
export function safeImg(url) {
  const u = String(url ?? '').trim();
  return IMG_RE.test(u) ? u : '';
}
export function safeLink(url) {
  try {
    const u = new URL(String(url ?? '').trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch { return ''; }
}

// ── Ad media: photo, video file/link, or YouTube ──
const VIDEO_DATA_RE = /^data:video\/(mp4|webm|ogg|quicktime);base64,[a-z0-9+/=\s]+$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i;
export const AD_VIDEO_MAX_BYTES = 15 * 1024 * 1024; // uploaded videos are split into 900 KB pieces (Firestore's 1 MB record limit)
export const AD_VIDEO_PART_BYTES = 900 * 1024;
export function youTubeId(url) {
  try {
    const u = new URL(String(url ?? '').trim());
    const host = u.hostname.replace(/^(www|m|music)\./, '');
    let id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = u.searchParams.get('v') || (u.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/) || [])[2] || '';
    }
    return /^[\w-]{11}$/.test(id) ? id : '';
  } catch { return ''; }
}
export const isVideoUrl = (url) => VIDEO_DATA_RE.test(String(url ?? '').trim()) || VIDEO_EXT_RE.test(String(url ?? '')) || !!youTubeId(url);
/** What an ad shows: { kind: 'image' | 'video' | 'youtube', src, ... } or null. */
export function adMediaOf(a) {
  const raw = String(a?.mediaURL ?? '').trim();
  // Uploaded video, stored in pieces under ads/{id}/parts
  const stored = raw.match(/^fs:([a-z0-9]{4,16})$/i);
  if (stored) {
    const parts = Number(a?.videoParts) | 0;
    if (parts < 1 || parts > 40 || !a?.id) return null;
    const mime = /^video\/[\w.+-]+$/.test(a.videoMime || '') ? a.videoMime : 'video/mp4';
    return { kind: 'stored', ver: stored[1], parts, mime, poster: safeImg(a.poster) || '' };
  }
  const yt = youTubeId(raw);
  if (yt) {
    const base = `https://www.youtube-nocookie.com/embed/${yt}?playsinline=1&rel=0&modestbranding=1`;
    return {
      kind: 'youtube', id: yt, poster: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
      src: `${base}&autoplay=1&mute=1&controls=0&loop=1&playlist=${yt}&disablekb=1`,
      full: `${base}&autoplay=1&mute=1&controls=1`,
    };
  }
  if (VIDEO_DATA_RE.test(raw)) return { kind: 'video', src: raw };
  const https = /^https:\/\//i.test(raw) ? safeLink(raw) : '';
  const wantsVideo = a?.mediaType === 'video' || (a?.mediaType !== 'image' && (a?.isVideo || VIDEO_EXT_RE.test(raw)));
  if (wantsVideo && https) return { kind: 'video', src: https };
  const img = safeImg(raw);
  return img ? { kind: 'image', src: img, guessed: !a?.mediaType } : null;
}
export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
export const safeHex =(v) => (/^#[0-9a-f]{3,8}$/i.test(String(v)) ? v : '#999999');

/** Soft placeholder artwork (no external service). */
export function placeholderImg(label = '') {
  const letter = esc(String(label).trim().charAt(0).toUpperCase() || 'N');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2D4A3E"/><stop offset="1" stop-color="#6B1A2A"/></linearGradient></defs><rect width="300" height="380" fill="url(#g)"/><g transform="translate(150 170) rotate(45)" opacity=".35"><rect x="-60" y="-60" width="120" height="120" fill="none" stroke="#C9A96E" stroke-width="6"/><rect x="-30" y="-30" width="60" height="60" fill="#C9A96E"/></g><text x="150" y="315" font-family="Georgia,serif" font-size="44" fill="#E8D5B0" text-anchor="middle">${letter}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ── Money & dates ──
export const IQD_RATE = 1310; // prices are stored in USD, shown in IQD
export function toIQD(usd) { return Math.round(((Number(usd) || 0) * IQD_RATE) / 250) * 250; }
export function formatIQDAmount(iqd, lang = 'en') {
  const n = (Math.round(Number(iqd)) || 0).toLocaleString('en-US');
  return lang === 'ku' ? `${n} د.ع` : `${n} IQD`;
}
export const formatIQD = (usd, lang = 'en') => formatIQDAmount(toIQD(usd), lang);
/** IQD for a line = rounded unit price × quantity, so lines always add up to the total shown. */
export const lineIQD = (usd, qty) => toIQD(usd) * (Number(qty) || 0);
/** The IQD total of an order (uses the saved total when the order has one). */
export const orderIQD = (o) => (Number.isInteger(o?.totalIQD) ? o.totalIQD : (o?.items || []).reduce((a, i) => a + lineIQD(i.price, i.qty), 0) || toIQD(o?.total));
export function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  const d = new Date(v);
  return isNaN(d) ? null : d;
}
export function fmtDate(v, lang = 'en') {
  const d = toDate(v);
  if (!d) return '—';
  return d.toLocaleDateString(lang === 'ku' ? 'ckb-IQ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
export const millis = (v) => toDate(v)?.getTime() || 0;

// ── Misc ──
export function debounce(fn, ms = 160) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
export function randomId(prefix = 'NX-', len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint32Array(len); crypto.getRandomValues(buf);
  return prefix + Array.from(buf, (n) => chars[n % chars.length]).join('');
}
export function readJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
export function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export const clampStr = (s, n) => String(s ?? '').trim().slice(0, n);
export const normalizePhone = (p) => String(p ?? '').replace(/[^\d+]/g, '');
export const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e ?? '').trim());

/**
 * Compress an image file in the browser into a JPEG data URL that fits
 * maxChars. Transparent PNGs get a white background (not black).
 */
export async function compressImage(file, { maxDim = 900, quality = 0.8, maxChars = 350000 } = {}) {
  if (!file || !/^image\//.test(file.type)) throw new Error('not-image');
  const src = await new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  let dim = maxDim, q = quality, out = '';
  for (let attempt = 0; attempt < 8; attempt++) {
    const scale = Math.min(1, dim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
    out = c.toDataURL('image/jpeg', q);
    if (out.length <= maxChars) return out;
    if (q > 0.55) q -= 0.1; else dim = Math.round(dim * 0.8);
  }
  if (out.length > maxChars) throw new Error('too-large');
  return out;
}

// ── Busy state for buttons (prevents double submits) ──
export async function withBusy(btn, fn) {
  if (!btn || btn.dataset.busy) return;
  btn.dataset.busy = '1'; btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
  try { return await fn(); }
  finally { delete btn.dataset.busy; btn.removeAttribute('aria-busy'); btn.disabled = false; }
}

/** Resolve after ms, or reject — used to stop waiting forever on a slow network. */
export function withTimeout(promise, ms, label = 'timeout') {
  let t;
  return Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error(label), { code: label })), ms); })])
    .finally(() => clearTimeout(t));
}
