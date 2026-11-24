// ════════════════════════════════════════════════════════════════
//  UI plumbing: event delegation, sheets & dialogs (closable with the
//  phone's back button), toasts, confirm/prompt dialogs.
// ════════════════════════════════════════════════════════════════
import { $, byId, html, setHTML, placeholderImg } from './util.js';
import { tt } from './i18n.js';
import { isApp } from './native.js';

// ── delegation registries ──
const actions = {}, submits = {}, changes = {};
export const registerActions = (m) => Object.assign(actions, m);
export const registerSubmits = (m) => Object.assign(submits, m);
export const registerChanges = (m) => Object.assign(changes, m);

export function initDelegation() {
  document.addEventListener('click', (e) => {
    // Links inside an open sheet/dialog: close it first, then navigate.
    const link = e.target.closest('a[href^="#/"]');
    if (link && stack.length && link.closest('.modal, .sheet')) {
      e.preventDefault();
      closeAllOverlays(() => { location.hash = link.getAttribute('href'); });
      return;
    }
    const closer = e.target.closest('[data-close]');
    if (closer) {
      const box = closer.closest('.modal, .sheet');
      if (box) { e.preventDefault(); closeOverlay(box.id); }
      return;
    }
    const el = e.target.closest('[data-action]');
    if (el && actions[el.dataset.action]) {
      if (el.tagName === 'A' && !el.getAttribute('href')?.startsWith('http')) e.preventDefault();
      actions[el.dataset.action](el, e);
      return;
    }
    // Tap outside a dialog box closes it.
    const modal = e.target.classList?.contains('modal') ? e.target : null;
    if (modal && !modal.hasAttribute('data-sticky')) closeOverlay(modal.id);
  });
  byId('scrim')?.addEventListener('click', () => { const top = stack[stack.length - 1]; if (top && !byId(top)?.hasAttribute('data-sticky')) closeOverlay(top); });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-submit]');
    if (!form) return;
    e.preventDefault();
    const fn = submits[form.dataset.submit];
    if (fn) fn(form, form.querySelector('[type="submit"]'), e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && changes[el.dataset.change]) changes[el.dataset.change](el, e);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !stack.length) return;
    const top = stack[stack.length - 1];
    if (!byId(top)?.hasAttribute('data-sticky')) closeOverlay(top);
  });
  // Broken product/avatar photos fall back to a soft placeholder.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img?.tagName === 'IMG' && 'fallback' in img.dataset && !img.dataset.failed) {
      img.dataset.failed = '1';
      img.src = placeholderImg(img.dataset.fallback);
    }
  }, true);
  window.addEventListener('popstate', onPop);
}

// ── overlay stack (sheets + dialogs) ──
const stack = [];
const lastFocus = new Map();
const dynamicClose = new Map();
let ignorePops = 0;
let afterPop = null;

export const isOpen = (id) => stack.includes(id);
export const topOverlay = () => stack[stack.length - 1];

export function openOverlay(id) {
  const el = byId(id);
  if (!el || stack.includes(id)) return el;
  lastFocus.set(id, document.activeElement);
  el.hidden = false;
  stack.push(id);
  if (el.classList.contains('sheet')) { const s = byId('scrim'); s.hidden = false; requestAnimationFrame(() => s.classList.add('open')); }
  document.documentElement.classList.add('locked');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
  history.pushState({ nxOverlay: id }, '');
  const box = el.querySelector('.modal-box') || el;
  if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1');
  setTimeout(() => box.focus({ preventScroll: true }), 60);
  return el;
}

export function closeOverlay(id, { viaHistory = false } = {}) {
  const idx = stack.lastIndexOf(id);
  if (idx === -1) return;
  stack.splice(idx, 1);
  const el = byId(id);
  el?.classList.remove('open');
  setTimeout(() => {
    if (stack.includes(id)) return;
    if (dynamicClose.has(id)) { const cb = dynamicClose.get(id); dynamicClose.delete(id); el?.remove(); cb?.(); }
    else if (el) el.hidden = true;
  }, 280);
  if (!stack.some((s) => byId(s)?.classList.contains('sheet'))) {
    const s = byId('scrim'); s.classList.remove('open'); setTimeout(() => { if (!s.classList.contains('open')) s.hidden = true; }, 280);
  }
  if (!stack.length) document.documentElement.classList.remove('locked');
  lastFocus.get(id)?.focus?.({ preventScroll: true });
  if (!viaHistory && history.state?.nxOverlay === id) { ignorePops++; history.back(); }
}

/** Close everything that is open, then run fn once the history has settled. */
export function closeAllOverlays(fn) {
  const tracked = stack.length;
  while (stack.length) closeOverlay(stack[stack.length - 1], { viaHistory: true });
  if (tracked && history.state?.nxOverlay) { ignorePops++; afterPop = fn || null; history.go(-tracked); }
  else fn?.();
}

function onPop() {
  if (ignorePops > 0) {
    ignorePops--;
    if (ignorePops === 0 && afterPop) { const cb = afterPop; afterPop = null; cb(); }
    return;
  }
  const top = stack[stack.length - 1];
  if (!top) return;
  if (byId(top)?.hasAttribute('data-sticky')) { history.pushState({ nxOverlay: top }, ''); return; }
  closeOverlay(top, { viaHistory: true });
}

// ── dynamic dialogs ──
let seq = 0;
export function openDialog(content, { wide = false, sticky = false, label = '', onClose } = {}) {
  const id = 'dlg-' + (++seq);
  const wrap = document.createElement('div');
  wrap.className = 'modal' + (wide ? ' wide' : '');
  wrap.id = id;
  wrap.hidden = true;
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  if (label) wrap.setAttribute('aria-label', label);
  if (sticky) wrap.setAttribute('data-sticky', '');
  setHTML(wrap, html`<div class="modal-box glass-strong" tabindex="-1">
      ${sticky ? '' : html`<button type="button" class="icon-btn close-btn" data-close aria-label="${tt('close')}"><i class="fas fa-xmark"></i></button>`}
      <div class="dialog-body"></div></div>`);
  setHTML(wrap.querySelector('.dialog-body'), content);
  document.body.append(wrap);
  dynamicClose.set(id, onClose);
  openOverlay(id);
  return { id, el: wrap, body: wrap.querySelector('.dialog-body'), close: () => closeOverlay(id) };
}

export function confirmDialog(message, { ok = tt('confirm'), danger = false } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const d = openDialog(html`<p class="confirm-text">${message}</p>
      <div class="btn-row"><button type="button" class="btn btn-glass" data-close>${tt('cancel')}</button>
      <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-dlg-ok>${ok}</button></div>`,
    { onClose: () => { if (!answered) resolve(false); } });
    d.body.querySelector('[data-dlg-ok]').addEventListener('click', () => { answered = true; resolve(true); d.close(); });
  });
}

export function promptDialog(label, { type = 'text', inputmode = '', maxlength = 200, placeholder = '' } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const d = openDialog(html`<form class="form" data-dlg-form>
      <div class="field"><label for="dlg-input">${label}</label>
      <input id="dlg-input" type="${type}" inputmode="${inputmode}" maxlength="${maxlength}" placeholder="${placeholder}" autocomplete="off" required /></div>
      <div class="btn-row"><button type="button" class="btn btn-glass" data-close>${tt('cancel')}</button>
      <button class="btn btn-primary" type="submit">${tt('ok')}</button></div></form>`,
    { onClose: () => { if (!answered) resolve(null); } });
    const form = d.body.querySelector('[data-dlg-form]');
    setTimeout(() => form.querySelector('input').focus(), 120);
    form.addEventListener('submit', (e) => {
      e.preventDefault(); e.stopPropagation();
      answered = true; resolve(form.querySelector('input').value.trim()); d.close();
    });
  });
}

// ── toasts ──
export function toast(msg, type = '') {
  const box = byId('toasts');
  if (!box || !msg) return;
  while (box.children.length >= 3) box.firstElementChild.remove();
  const el = document.createElement('div');
  el.className = 'toast glass-strong ' + type;
  const icon = type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
  setHTML(el, html`<i class="fas ${icon}" aria-hidden="true"></i><span>${msg}</span>`);
  box.append(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, type === 'error' ? 5200 : 3200);
}

/** Turn any Firebase error into a short, translated message. */
export function errorText(e) {
  const code = String(e?.code || e?.message || '');
  if (/wrong-password|user-not-found|invalid-credential|invalid-login|invalid-email/.test(code)) return tt('errWrongLogin');
  if (/email-already-in-use/.test(code)) return tt('errEmailInUse');
  if (/weak-password/.test(code)) return tt('errWeakPw');
  if (/too-many-requests|resource-exhausted/.test(code)) return tt('errTooMany');
  if (/network|unavailable|offline|timeout|deadline/.test(code)) return tt('errNetwork');
  if (/popup-blocked/.test(code)) return tt('errPopup');
  if (/unauthorized-domain/.test(code)) return tt('errDomain');
  if (/requires-recent-login/.test(code)) return tt('errRecentLogin');
  if (/permission-denied|insufficient permissions/i.test(code)) return tt('errPermission');
  if (/too-large/.test(code)) return tt('imageTooLarge');
  if (/not-image/.test(code)) return tt('notImage');
  // In the phone app, add the technical code so problems can be found quickly.
  return isApp && code ? `${tt('errGeneric')} (${code.replace(/^auth\//, '').slice(0, 90)})` : tt('errGeneric');
}

export function fail(e, fallbackKey) {
  console.error(e);
  toast(fallbackKey && !e?.code ? tt(fallbackKey) : errorText(e), 'error');
}

export const skeletons = (n = 4) => html`${Array.from({ length: n }, () => html`<div class="pcard skeleton" aria-hidden="true"><div class="pcard-media"></div><div class="pcard-body"><span></span><span></span></div></div>`)}`;

export function emptyState(icon, text, extra = '') {
  return html`<div class="empty-state"><i class="fas ${icon}" aria-hidden="true"></i><p>${text}</p>${extra}</div>`;
}

export const scrollTopSmooth = () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
export { $ };
