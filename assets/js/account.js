// ════════════════════════════════════════════════════════════════
//  Accounts: sign-in / sign-up, profile, two-step sign-in, and the
//  contact / partner / bug / custom-design forms.
// ════════════════════════════════════════════════════════════════
import { html, setHTML, $, $$, byId, safeImg, compressImage, withBusy, clampStr, isEmail, fmtDate, formatIQDAmount, orderIQD } from './util.js';
import { t, tt, getLang, roleLabel, statusLabel } from './i18n.js';
import { state, fb, emit, on, effectiveRole } from './state.js';
import {
  registerActions, registerSubmits, openOverlay, closeOverlay, closeAllOverlays, toast, fail, errorText,
  confirmDialog, promptDialog, emptyState,
} from './ui.js';
import { renderWishlistGrid, whatsappUrl, loadDesigners } from './shop.js';
import { TOTP } from './totp.js';

let pendingRegistration = null;   // { name, role } while createUser… is running
let pending2FA = null;            // profile waiting for its 2FA code
const twofaKey = (uid) => 'nx-2fa-ok-' + uid;

// ═══════════ auth state ═══════════
export function initAuth() {
  fb.onAuthStateChanged(fb.auth, async (user) => {
    if (!user) {
      pending2FA = null;
      setUser(null);
      return;
    }
    let profile;
    try { profile = await loadOrCreateProfile(user); }
    catch (e) {
      console.error('profile', e);
      toast(tt('profileLoadFailed'), 'error');
      profile = { uid: user.uid, email: user.email || '', name: user.displayName || 'User', role: 'customer', status: 'active', photoURL: user.photoURL || '' };
    }
    if (profile.twofa && sessionStorage.getItem(twofaKey(user.uid)) !== '1') {
      pending2FA = profile;
      setUser(null, { keepAuthReady: true });
      const input = $('#m-2fa-verify input[name="code"]');
      if (input) input.value = '';
      openOverlay('m-2fa-verify');
      return;
    }
    setUser(profile);
  });
}

function setUser(profile) {
  state.user = profile;
  state.role = effectiveRole(profile);
  state.authReady = true;
  if (profile && state.ratings) loadDesigners(true).catch(() => {});
  emit('user');
  if (profile) syncOwnDirectoryEntry(profile);
}

async function loadOrCreateProfile(user) {
  const ref = fb.doc(fb.db, 'users', user.uid);
  const snap = await fb.getDoc(ref);
  const isRoot = (user.email || '').toLowerCase() === fb.ROOT_ADMIN_EMAIL && user.emailVerified;
  if (snap.exists()) {
    const data = { uid: user.uid, ...snap.data() };
    const patch = {};
    if (isRoot && (data.role !== 'admin' || data.status !== 'active')) Object.assign(patch, { role: 'admin', status: 'active' });
    if (user.email && data.email !== user.email) patch.email = user.email; // after a verified email change
    if (Object.keys(patch).length) {
      try { await fb.updateDoc(ref, patch); Object.assign(data, patch); } catch (e) { console.warn('profile patch', e.code); }
    }
    return data;
  }
  const reg = pendingRegistration;
  const requestedRole = ['designer', 'printer', 'advertiser'].includes(reg?.role) ? reg.role : 'customer';
  const fresh = {
    name: clampStr(reg?.name || user.displayName || (user.email || 'User').split('@')[0], 100) || 'User',
    email: user.email || '',
    role: isRoot ? 'admin' : 'customer',
    requestedRole: isRoot ? 'customer' : requestedRole,
    status: isRoot || requestedRole === 'customer' ? 'active' : 'pending',
    photoURL: safeImg(user.photoURL) ? user.photoURL : '',
    phone: '',
    bio: '',
    createdAt: fb.serverTimestamp(),
  };
  await fb.setDoc(ref, fresh);
  return { uid: user.uid, ...fresh, createdAt: new Date() };
}

/** Approved designers keep their public directory card in sync with their profile. */
async function syncOwnDirectoryEntry(p) {
  if (effectiveRole(p) !== 'designer') return;
  try {
    const ref = fb.doc(fb.db, 'designers', p.uid);
    const cur = await fb.getDoc(ref);
    const want = { name: clampStr(p.name, 100) || 'Designer', bio: clampStr(p.bio, 600), photoURL: safeImg(p.photoURL) ? p.photoURL : '' };
    const d = cur.exists() ? cur.data() : null;
    if (!d || d.name !== want.name || (d.bio || '') !== want.bio || (d.photoURL || '') !== want.photoURL) {
      await fb.setDoc(ref, { ...want, updatedAt: fb.serverTimestamp() });
    }
  } catch (e) { console.warn('directory sync', e.code || e); }
}

// ═══════════ sign in / up ═══════════
export function openLogin(reasonKey) {
  const sub = $('#m-login [data-login-reason]');
  if (sub) sub.textContent = tt(reasonKey || 'signInSub');
  closeAllOverlays(() => openOverlay('m-login'));
}

async function doLogin(form, btn) {
  const email = form.email.value.trim(), pw = form.password.value;
  if (!email || !pw) { toast(tt('fillRequired'), 'error'); return; }
  if (!fb) { toast(tt('errNetwork'), 'error'); return; }
  await withBusy(btn, async () => {
    try {
      await fb.signInWithEmailAndPassword(fb.auth, email, pw);
      form.reset();
      closeOverlay('m-login');
      toast(tt('welcomeBack'), 'success');
    } catch (e) { toast(errorText(e), 'error'); }
  });
}

async function doRegister(form, btn) {
  const name = clampStr(form.name.value, 100), email = form.email.value.trim(), pw = form.password.value;
  const role = form.role.value || 'customer';
  if (!name || !email || !pw) { toast(tt('fillRequired'), 'error'); return; }
  if (!isEmail(email)) { toast(tt('badEmail'), 'error'); return; }
  if (pw.length < 6) { toast(tt('errWeakPw'), 'error'); return; }
  if (!fb) { toast(tt('errNetwork'), 'error'); return; }
  await withBusy(btn, async () => {
    pendingRegistration = { name, role };
    try {
      const cred = await fb.createUserWithEmailAndPassword(fb.auth, email, pw);
      fb.updateProfile(cred.user, { displayName: name }).catch(() => {});
      form.reset();
      closeOverlay('m-register');
      toast(role === 'customer' ? tt('welcome') : tt('accountPending', { role: roleLabel(role) }), 'success');
    } catch (e) { toast(errorText(e), 'error'); }
    finally { setTimeout(() => { pendingRegistration = null; }, 4000); }
  });
}

async function googleSignIn(btn) {
  if (!fb) { toast(tt('errNetwork'), 'error'); return; }
  await withBusy(btn, async () => {
    try {
      await fb.signInWithPopup(fb.auth, new fb.GoogleAuthProvider());
      closeOverlay('m-login');
      toast(tt('welcomeBack'), 'success');
    } catch (e) {
      if (/popup-closed-by-user|cancelled-popup-request/.test(e.code || '')) return;
      toast(errorText(e), 'error');
    }
  });
}

async function forgotPassword() {
  const email = byId('login-email').value.trim();
  if (!email) { toast(tt('enterEmailFirst'), 'error'); byId('login-email').focus(); return; }
  try { await fb.sendPasswordResetEmail(fb.auth, email); toast(tt('resetSent'), 'success'); }
  catch (e) { toast(errorText(e), 'error'); }
}

async function signOutNow() {
  try {
    if (state.user) sessionStorage.removeItem(twofaKey(state.user.uid));
    await fb?.signOut(fb.auth);
    closeAllOverlays(() => { location.hash = '#/'; });
    toast(tt('signedOut'));
  } catch (e) { fail(e); }
}

// ═══════════ two-step sign-in ═══════════
async function verify2FA(form, btn) {
  const code = form.code.value.replace(/\s/g, '');
  if (!pending2FA) { closeOverlay('m-2fa-verify'); return; }
  await withBusy(btn, async () => {
    if (!(await TOTP.verify(pending2FA.twofa, code))) { toast(tt('wrongCode'), 'error'); form.code.select(); return; }
    sessionStorage.setItem(twofaKey(pending2FA.uid), '1');
    const p = pending2FA; pending2FA = null;
    closeOverlay('m-2fa-verify');
    setUser(p);
    toast(tt('welcomeBack'), 'success');
  });
}
async function cancel2FA() {
  pending2FA = null;
  closeOverlay('m-2fa-verify');
  try { await fb.signOut(fb.auth); } catch { /* ignore */ }
}
async function enable2FA() {
  const secret = TOTP.secret();
  const label = encodeURIComponent('Naxshin:' + (state.user?.email || 'user'));
  const uri = `otpauth://totp/${label}?secret=${secret}&issuer=Naxshin&algorithm=SHA1&digits=6&period=30`;
  try {
    await loadScript('assets/vendor/qrcode.js');
    const qr = window.qrcode(0, 'M'); qr.addData(uri); qr.make();
    byId('twofa-qr').src = qr.createDataURL(5, 2); // made on this device — the secret never leaves it
  } catch { byId('twofa-qr').removeAttribute('src'); }
  byId('twofa-secret').textContent = secret.match(/.{1,4}/g).join(' ');
  const form = $('form[data-submit="twofa-setup"]');
  form.code.value = '';
  form.dataset.secret = secret;
  openOverlay('m-2fa-setup');
}
async function confirm2FA(form, btn) {
  const secret = form.dataset.secret, code = form.code.value.replace(/\s/g, '');
  await withBusy(btn, async () => {
    if (!(await TOTP.verify(secret, code))) { toast(tt('wrongCode'), 'error'); return; }
    try {
      await fb.updateDoc(fb.doc(fb.db, 'users', state.user.uid), { twofa: secret });
      state.user.twofa = secret;
      sessionStorage.setItem(twofaKey(state.user.uid), '1');
      closeOverlay('m-2fa-setup');
      render2FARow();
      toast(tt('twofaEnabled'), 'success');
    } catch (e) { fail(e); }
  });
}
async function disable2FA() {
  const code = await promptDialog(tt('twofaDisablePrompt'), { inputmode: 'numeric', maxlength: 6, placeholder: '000000' });
  if (!code) return;
  if (!(await TOTP.verify(state.user.twofa, code))) { toast(tt('wrongCode'), 'error'); return; }
  try {
    await fb.updateDoc(fb.doc(fb.db, 'users', state.user.uid), { twofa: '' });
    state.user.twofa = '';
    render2FARow();
    toast(tt('twofaDisabled'));
  } catch (e) { fail(e); }
}
function render2FARow() {
  const row = byId('twofa-row');
  if (!row || !state.user) return;
  const on = !!state.user.twofa;
  setHTML(row, html`<div><div class="row-title">${tt('twofa')} ${on ? html`<span class="pill ok">${tt('twofaOn')}</span>` : ''}</div><div class="row-sub muted">${tt('twofaDesc')}</div></div>
    <button type="button" class="pill-btn${on ? ' danger-text' : ''}" data-action="${on ? 'disable-2fa' : 'enable-2fa'}">${tt(on ? 'disable' : 'enable')}</button>`);
}
const scripts = {};
function loadScript(src) {
  return (scripts[src] ||= new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s);
  }));
}

// ═══════════ profile page ═══════════
const PROFILE_TABS = ['info', 'orders', 'wishlist', 'settings', 'report'];
export function renderProfile(tab = 'info') {
  const page = byId('page-profile');
  const signedOutCard = byId('profile-guest');
  if (!state.user) {
    $$('.section > *', page).forEach((el) => { if (el.id !== 'profile-guest') el.hidden = true; });
    if (!signedOutCard) {
      const box = document.createElement('div');
      box.id = 'profile-guest';
      $('.section', page).prepend(box);
    }
    setHTML(byId('profile-guest'), state.authReady || !fb
      ? html`<div class="glass-card pad center guest-card">
          <img src="assets/img/mark.png" alt="" width="56" height="61" />
          <h1 class="card-title">${tt(tab === 'wishlist' ? 'favourites' : 'signInFirst')}</h1>
          ${tab === 'wishlist' ? html`<div class="product-grid" id="grid-wishlist-guest"></div>` : ''}
          <div class="btn-row"><button type="button" class="btn btn-primary" data-action="open-login">${tt('login')}</button>
          <button type="button" class="btn btn-glass" data-action="open-register">${tt('signup')}</button></div></div>`
      : html`<div class="loading-row"><i class="fas fa-spinner fa-spin"></i> ${tt('loading')}</div>`);
    byId('profile-guest').hidden = false;
    if (tab === 'wishlist' && byId('grid-wishlist-guest')) renderWishlistGrid(byId('grid-wishlist-guest'));
    return;
  }
  byId('profile-guest')?.remove();
  $$('.section > *', page).forEach((el) => { el.hidden = false; });
  if (!PROFILE_TABS.includes(tab)) tab = 'info';
  const u = state.user;
  $('[data-profile-name]').textContent = u.name || '—';
  $('[data-profile-email]').textContent = u.email || '';
  setHTML($('[data-profile-role]'), html`<span class="pill role-${state.role}">${roleLabel(state.role)}</span>`);
  setHTML($('[data-avatar-large]'), avatarInner(u, true));
  // pending / rejected partner request note
  const note = byId('pending-role-note');
  if (u.status === 'pending') setHTML(note, html`<div class="notice"><i class="fas fa-clock"></i> ${tt('pendingRole', { role: roleLabel(u.requestedRole || u.role) })}</div>`);
  else if (u.status === 'rejected') setHTML(note, html`<div class="notice warn"><i class="fas fa-circle-info"></i> ${tt('rejectedRole')}</div>`);
  else setHTML(note, '');

  $$('#profile-tabs [data-tab]').forEach((b) => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $$('#page-profile [data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== tab; });

  if (tab === 'info') fillProfileForm();
  if (tab === 'orders') renderMyOrders(byId('profile-orders'));
  if (tab === 'wishlist') renderWishlistGrid(byId('grid-wishlist'));
  if (tab === 'settings') render2FARow();
}
function fillProfileForm() {
  const f = byId('profile-form'), u = state.user;
  if (f.dataset.uid === u.uid && f.dataset.dirty) return;
  f.dataset.uid = u.uid;
  f.name.value = u.name || ''; f.email.value = u.email || ''; f.phone.value = u.phone || ''; f.bio.value = u.bio || ''; f.password.value = '';
  const passwordUser = fb?.auth.currentUser?.providerData?.some((p) => p.providerId === 'password');
  $$('[data-password-only]', f).forEach((el) => { el.hidden = !passwordUser; });
}
export function avatarInner(u) {
  const src = safeImg(u?.photoURL);
  return src ? html`<img src="${src}" alt="" />` : html`${String(u?.name || 'U').charAt(0).toUpperCase()}`;
}

async function saveProfile(form, btn) {
  const name = clampStr(form.name.value, 100);
  if (!name) { toast(tt('fillRequired'), 'error'); return; }
  const patch = { name, phone: clampStr(form.phone.value, 30), bio: clampStr(form.bio.value, 600), updatedAt: fb.serverTimestamp() };
  const pw = form.password.value;
  await withBusy(btn, async () => {
    try {
      if (pw) {
        if (pw.length < 6) { toast(tt('errWeakPw'), 'error'); return; }
        await fb.updatePassword(fb.auth.currentUser, pw);
      }
      await fb.updateDoc(fb.doc(fb.db, 'users', state.user.uid), patch);
      fb.updateProfile(fb.auth.currentUser, { displayName: name }).catch(() => {});
      Object.assign(state.user, patch);
      delete form.dataset.dirty;
      form.password.value = '';
      emit('user');
      syncOwnDirectoryEntry(state.user);
      toast(tt('saved'), 'success');
    } catch (e) { fail(e); }
  });
}

async function changeEmail() {
  const next = await promptDialog(tt('newEmailPrompt'), { type: 'email', maxlength: 200 });
  if (!next) return;
  if (!isEmail(next)) { toast(tt('badEmail'), 'error'); return; }
  try { await fb.verifyBeforeUpdateEmail(fb.auth.currentUser, next); toast(tt('emailVerifySent', { email: next }), 'success'); }
  catch (e) { fail(e); }
}

async function uploadAvatar(file) {
  if (!file || !state.user) return;
  try {
    const photoURL = await compressImage(file, { maxDim: 256, quality: 0.8, maxChars: 120000 });
    await fb.updateDoc(fb.doc(fb.db, 'users', state.user.uid), { photoURL, updatedAt: fb.serverTimestamp() });
    state.user.photoURL = photoURL;
    emit('user');
    syncOwnDirectoryEntry(state.user);
    toast(tt('photoUpdated'), 'success');
  } catch (e) { fail(e); }
}

export async function renderMyOrders(box) {
  if (!box || !state.user) return;
  setHTML(box, html`<div class="loading-row"><i class="fas fa-spinner fa-spin"></i> ${tt('loading')}</div>`);
  try {
    const snap = await fb.getDocs(fb.query(fb.collection(fb.db, 'orders'), fb.where('userId', '==', state.user.uid)));
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    if (!orders.length) { setHTML(box, emptyState('fa-box-open', tt('noOrders'), html`<a class="btn btn-glass btn-sm" href="#/shop">${tt('startShopping')}</a>`)); return; }
    setHTML(box, html`<div class="order-list">${orders.map((o) => html`<article class="order-card glass-card">
      <div class="order-top"><strong class="order-id">${o.orderId || '#' + o.id.slice(-6).toUpperCase()}</strong>${statusPill(o.status)}</div>
      <div class="muted small">${fmtDate(o.createdAt, getLang())} · ${o.location || o.city || ''}</div>
      <ul class="order-items">${(o.items || []).map((i) => html`<li>${i.name}${[i.size, i.color || i.colorName].filter(Boolean).length ? ` (${[i.size, i.color || i.colorName].filter(Boolean).join(' / ')})` : ''} × ${i.qty}</li>`)}</ul>
      <div class="order-total">${tt('total')}: <strong>${formatIQDAmount(orderIQD(o), getLang())}</strong></div>
    </article>`)}</div>`);
  } catch (e) {
    console.error(e);
    setHTML(box, emptyState('fa-wifi', tt('loadingFailed'), html`<button type="button" class="btn btn-glass btn-sm" data-action="retry-route">${tt('retry')}</button>`));
  }
}
export const statusPill = (s) => html`<span class="pill st-${s || 'pending'}">${statusLabel(s)}</span>`;

// ═══════════ forms: contact, partner, bug, custom design, deletion ═══════════
async function optionalImage(input) {
  const file = input?.files?.[0];
  if (!file) return '';
  return compressImage(file, { maxDim: 1100, quality: 0.72, maxChars: 380000 });
}

async function submitContact(form, btn) {
  if (form.website.value) return; // bots fill hidden fields
  const name = clampStr(form.name.value, 100), email = form.email.value.trim(), message = clampStr(form.message.value, 5000);
  if (!name || !email || !message) { toast(tt('fillRequired'), 'error'); return; }
  if (!isEmail(email)) { toast(tt('badEmail'), 'error'); return; }
  if (!fb) { toast(tt('errNetwork'), 'error'); return; }
  await withBusy(btn, async () => {
    try {
      const data = { name, email: email.slice(0, 200), subject: clampStr(form.subject.value, 100), message, createdAt: fb.serverTimestamp() };
      const image = await optionalImage(form.image);
      if (image) data.image = image;
      if (state.user) data.userId = state.user.uid;
      await fb.addDoc(fb.collection(fb.db, 'contact-messages'), data);
      form.reset();
      prefillContact();
      toast(tt('msgSent'), 'success');
    } catch (e) { fail(e); }
  });
}
export function prefillContact() {
  const f = byId('contact-form');
  if (!f || !state.user) return;
  if (!f.name.value) f.name.value = state.user.name || '';
  if (!f.email.value) f.email.value = state.user.email || '';
}

async function submitPartner(form, btn) {
  if (form.website.value) return;
  const type = form.type.value, name = clampStr(form.name.value, 100), email = form.email.value.trim();
  if (!type) { toast(tt('chooseType'), 'error'); return; }
  if (!name || !email) { toast(tt('fillRequired'), 'error'); return; }
  if (!isEmail(email)) { toast(tt('badEmail'), 'error'); return; }
  if (!fb) { toast(tt('errNetwork'), 'error'); return; }
  await withBusy(btn, async () => {
    try {
      await fb.addDoc(fb.collection(fb.db, 'partner-requests'), { name, email: email.slice(0, 200), type, message: clampStr(form.message.value, 3000), createdAt: fb.serverTimestamp() });
      form.reset();
      closeOverlay('m-partner');
      toast(tt('partnerSent'), 'success');
    } catch (e) { fail(e); }
  });
}

async function submitBug(form, btn) {
  const description = clampStr(form.description.value, 5000);
  if (!description) { toast(tt('fillRequired'), 'error'); return; }
  await withBusy(btn, async () => {
    try {
      const data = { userId: state.user.uid, userEmail: String(state.user.email || '').slice(0, 200), description, page: String(location.hash || '#/').slice(0, 100), createdAt: fb.serverTimestamp() };
      const image = await optionalImage(form.image);
      if (image) data.image = image;
      await fb.addDoc(fb.collection(fb.db, 'bug-reports'), data);
      form.reset();
      toast(tt('bugSent'), 'success');
    } catch (e) { fail(e); }
  });
}

async function requestDeletion() {
  if (!(await confirmDialog(tt('deletionConfirm'), { ok: tt('requestDeletion'), danger: true }))) return;
  try {
    await fb.addDoc(fb.collection(fb.db, 'contact-messages'), {
      name: clampStr(state.user.name || 'User', 100), email: String(state.user.email || 'unknown@naxshin').slice(0, 200),
      subject: 'Account deletion', message: `Please delete my account. (uid: ${state.user.uid})`, userId: state.user.uid, createdAt: fb.serverTimestamp(),
    });
    toast(tt('deletionSent'), 'success');
  } catch (e) { fail(e); }
}

async function openCustomDesign() {
  const f = $('form[data-submit="custom"]');
  if (state.user) {
    if (!f.name.value) f.name.value = state.user.name || '';
    if (!f.phone.value) f.phone.value = state.user.phone || '';
  }
  closeAllOverlays(() => openOverlay('m-custom'));
  try {
    const list = await loadDesigners();
    const sel = byId('cd-designer');
    setHTML(sel, html`<option value="">${tt('anyDesigner')}</option>${list.map((d) => html`<option value="${d.name}">${d.name}</option>`)}`);
  } catch { /* the team option still works */ }
}
function submitCustom(form) {
  const idea = clampStr(form.idea.value, 1500), name = clampStr(form.name.value, 100), phone = clampStr(form.phone.value, 30);
  if (!idea || !name || !phone) { toast(tt('fillRequired'), 'error'); return; }
  const who = form.creator.value === 'designer' ? `Designer (${form.designer.value || 'any available'})` : 'Naxshin team';
  const text = [
    '🎨 *Custom Design Request*', `Created by: ${who}`, `Garment: ${form.garment.value} (Size: ${form.size.value})`,
    `Colour: ${clampStr(form.color.value, 60) || 'Standard'}`, `Name: ${name}`, `Phone: ${phone}`, '', '📝 *Idea:*', idea,
  ].join('\n');
  window.open(whatsappUrl(text), '_blank', 'noopener');
  closeOverlay('m-custom');
  toast(tt('customSent'), 'success');
}

// ═══════════ wiring ═══════════
export function initAccount() {
  on('need-login', (reason) => openLogin(reason));
  byId('avatar-file')?.addEventListener('change', (e) => { uploadAvatar(e.target.files[0]); e.target.value = ''; });
  byId('profile-form')?.addEventListener('input', (e) => { e.currentTarget.dataset.dirty = '1'; });
  $('form[data-submit="custom"]')?.addEventListener('change', (e) => {
    if (e.target.name === 'creator') byId('cd-designer').hidden = e.target.value !== 'designer';
  });

  registerActions({
    'open-login': () => openLogin(),
    'open-register': () => closeAllOverlays(() => openOverlay('m-register')),
    'open-partner': () => closeAllOverlays(() => openOverlay('m-partner')),
    'google-sign-in': (el) => googleSignIn(el),
    'forgot-password': () => forgotPassword(),
    'sign-out': () => signOutNow(),
    'cancel-2fa': () => cancel2FA(),
    'enable-2fa': () => enable2FA(),
    'disable-2fa': () => disable2FA(),
    'pick-avatar': () => byId('avatar-file').click(),
    'change-email': () => changeEmail(),
    'request-deletion': () => requestDeletion(),
    'custom-design': () => openCustomDesign(),
  });
  registerSubmits({
    login: doLogin, register: doRegister, profile: saveProfile, contact: submitContact, partner: submitPartner,
    bug: submitBug, custom: submitCustom, 'twofa-setup': confirm2FA, 'twofa-verify': verify2FA,
  });
}
