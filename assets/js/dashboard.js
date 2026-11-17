// ════════════════════════════════════════════════════════════════
//  Dashboards for each role. Every section reads fresh data when opened.
//  The security rules decide what each role can really read or change;
//  this file only shows the right tools.
// ════════════════════════════════════════════════════════════════
import {
  html, setHTML, $, $$, byId, safeImg, safeLink, safeHex, placeholderImg, formatIQD, formatIQDAmount, lineIQD, orderIQD, fmtDate, millis, compressImage,
  withBusy, clampStr,
} from './util.js';
import { t, tt, getLang, roleLabel, statusLabel } from './i18n.js';
import { state, fb, effectiveRole, productById, emit } from './state.js';
import { registerActions, registerSubmits, registerChanges, openDialog, confirmDialog, toast, fail, emptyState } from './ui.js';
import { renderMyOrders, statusPill } from './account.js';
import { renderWishlistGrid, cartCount } from './shop.js';

const money = (usd) => formatIQD(usd, getLang());
const iqd = (n) => formatIQDAmount(n, getLang());
const ORDER_STATUSES = ['pending', 'confirmed', 'delivering', 'completed', 'cancelled'];
const ROLES = ['customer', 'designer', 'printer', 'advertiser', 'technician', 'admin'];
const CATEGORIES = ['tshirt', 'hoodie', 'dress', 'jacket', 'pants', 'accessory', 'collab'];
const CAT_KEY = { tshirt: 'catTshirt', hoodie: 'catHoodie', dress: 'catDress', jacket: 'catJacket', pants: 'catPants', accessory: 'catAccessory', collab: 'catCollab' };
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PALETTE = [
  { name: 'Black', hex: '#1A1A1A' }, { name: 'White', hex: '#F5F5F0' }, { name: 'Forest Green', hex: '#2D4A3E' },
  { name: 'Rust', hex: '#8B2E0F' }, { name: 'Gold', hex: '#C9A96E' }, { name: 'Burgundy', hex: '#5C1A2B' },
  { name: 'Navy', hex: '#1B2A4A' }, { name: 'Sand', hex: '#D8C4A0' }, { name: 'Charcoal Gray', hex: '#4A4A4A' },
];

const NAV = {
  customer: [['overview', 'fa-gauge', 'dashOverview'], ['my-orders', 'fa-bag-shopping', 'tabOrders'], ['wishlist', 'fa-heart', 'favourites']],
  designer: [['overview', 'fa-gauge', 'dashOverview'], ['designs', 'fa-palette', 'dashMyDesigns'], ['upload', 'fa-cloud-arrow-up', 'dashUploadDesign'], ['sales', 'fa-chart-column', 'dashSales']],
  printer: [['overview', 'fa-print', 'dashQueue'], ['orders', 'fa-truck', 'dashOrders']],
  technician: [['overview', 'fa-bug', 'dashBugs'], ['rules', 'fa-shield-halved', 'dashRules']],
  admin: [
    ['overview', 'fa-crown', 'dashOverview'], ['orders', 'fa-clipboard-list', 'dashOrders'], ['products', 'fa-shirt', 'dashProducts'],
    ['upload', 'fa-cloud-arrow-up', 'dashUpload'], ['designs', 'fa-palette', 'dashMyDesigns'], ['users', 'fa-users', 'dashUsers'],
    ['requests', 'fa-user-check', 'dashRequests'], ['inbox', 'fa-inbox', 'dashInbox'], ['analytics', 'fa-chart-line', 'dashAnalytics'],
    ['ads', 'fa-bullhorn', 'dashAds'], ['bugs', 'fa-bug', 'dashBugs'], ['rules', 'fa-shield-halved', 'dashRules'],
  ],
};
NAV.advertiser = NAV.customer;
const navFor = (role) => NAV[role] || NAV.customer;

let currentSection = 'overview';
export function renderDashboard(section) {
  const main = byId('dash-main');
  if (!state.user) {
    setHTML(main, html`<div class="glass-card pad center"><p>${tt('signInFirst')}</p><button type="button" class="btn btn-primary" data-action="open-login">${tt('login')}</button></div>`);
    setHTML(byId('dash-nav'), '');
    return;
  }
  const items = navFor(state.role);
  if (!items.some(([s]) => s === section)) section = 'overview';
  currentSection = section;
  byId('dash-role').textContent = roleLabel(state.role);
  setHTML(byId('dash-nav'), html`${items.map(([s, icon, label]) => html`<a href="#/dashboard/${s}" class="${s === section ? 'on' : ''}" aria-current="${s === section ? 'page' : 'false'}"><i class="fas ${icon}"></i><span>${tt(label)}</span></a>`)}
    <a href="#/shop" class="dash-back"><i class="fas fa-arrow-left flip-rtl"></i><span>${tt('dashBackToShop')}</span></a>`);
  const render = SECTIONS[state.role]?.[section] || SECTIONS.customer[section] || SECTIONS.customer.overview;
  setHTML(main, loadingBlock());
  Promise.resolve(render(main)).catch((e) => { console.error(e); setHTML(main, errorBlock(e)); });
}
const refresh = () => renderDashboard(currentSection);

const head = (title, sub = '', extra = '') => html`<div class="dash-head"><div><h1>${title}</h1>${sub ? html`<p class="muted">${sub}</p>` : ''}</div>${extra}</div>`;
const loadingBlock = () => html`<div class="loading-row"><i class="fas fa-spinner fa-spin"></i> ${tt('loading')}</div>`;
const errorBlock = (e) => html`<div class="glass-card pad">${emptyState('fa-triangle-exclamation', /permission/i.test(e?.code || e?.message || '') ? tt('errPermission') : tt('loadingFailed'),
  html`<button type="button" class="btn btn-glass btn-sm" data-action="dash-refresh">${tt('retry')}</button>`)}</div>`;
const stat = (tint, icon, value, label) => html`<div class="stat glass-card"><span class="stat-icon ${tint}"><i class="fas ${icon}"></i></span><span class="stat-val">${value}</span><span class="stat-label">${label}</span></div>`;
const getAll = async (name, ...constraints) => {
  const ref = constraints.length ? fb.query(fb.collection(fb.db, name), ...constraints) : fb.collection(fb.db, name);
  const snap = await fb.getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
const newestFirst = (list) => list.sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
const itemsText = (o, filter) => (o.items || []).filter(filter || (() => true))
  .map((i) => `${i.name}${[i.size, i.color || i.colorName].filter(Boolean).length ? ` (${[i.size, i.color || i.colorName].filter(Boolean).join('/')})` : ''} ×${i.qty}`).join(', ');
const orderRevenue = (orders) => orders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + orderIQD(o), 0);
const thumb = (src, alt = '') => html`<img class="thumb" src="${safeImg(src) || placeholderImg(alt)}" data-fallback="${alt}" alt="" loading="lazy" />`;

// ═══════════ customer ═══════════
async function custOverview(m) {
  let orders = 0;
  try { orders = (await getAll('orders', fb.where('userId', '==', state.user.uid))).length; } catch { /* offline */ }
  setHTML(m, html`${head(tt('dashWelcome', { name: String(state.user.name || '').split(' ')[0] || 'User' }), tt('dashCustomerSub'))}
    <div class="stat-grid">
      ${stat('tint-green', 'fa-bag-shopping', cartCount(), tt('cartItems'))}
      ${stat('tint-gold', 'fa-heart', state.wishlist.length, tt('favourites'))}
      ${stat('tint-rust', 'fa-box', orders, tt('dashOrders'))}
    </div>
    <div class="glass-card pad"><h2 class="card-title">${tt('quickActions')}</h2>
      <div class="btn-row start"><a class="btn btn-primary" href="#/shop">${tt('browseShop')}</a>
      <button type="button" class="btn btn-glass" data-action="open-cart">${tt('viewCart')}</button>
      <a class="btn btn-glass" href="#/dashboard/my-orders">${tt('tabOrders')}</a></div></div>`);
}
async function custOrders(m) { setHTML(m, html`${head(tt('tabOrders'))}<div id="dash-orders"></div>`); await renderMyOrders(byId('dash-orders')); }
function custWishlist(m) { setHTML(m, html`${head(tt('favourites'))}<div class="product-grid" id="dash-wish"></div>`); renderWishlistGrid(byId('dash-wish')); }

// ═══════════ orders (admin + printer) ═══════════
let orderFilter = '';
function priceFlag(o) {
  const off = (o.items || []).some((i) => { const p = productById(i.id); return p && Math.abs((Number(p.price) || 0) - (Number(i.price) || 0)) > 0.009; });
  return off ? html`<span class="flag" title="${tt('priceCheck')}" aria-label="${tt('priceCheck')}"><i class="fas fa-triangle-exclamation"></i></span>` : '';
}
function orderActions(o) {
  if (state.role === 'admin') {
    return html`<select class="mini-select" data-change="order-status" data-id="${o.id}" aria-label="${tt('changeStatus')}">
        <option value="">${tt('changeStatus')}</option>${ORDER_STATUSES.filter((s) => s !== o.status).map((s) => html`<option value="${s}">${statusLabel(s)}</option>`)}
      </select>
      <button type="button" class="icon-btn small danger-text" data-action="order-delete" data-id="${o.id}" aria-label="${tt('delete')}"><i class="fas fa-trash"></i></button>`;
  }
  if (o.status === 'confirmed') return html`<button type="button" class="btn btn-primary btn-xs" data-action="order-set" data-id="${o.id}" data-status="delivering">${tt('markPrinted')}</button>`;
  if (o.status === 'delivering') return html`<button type="button" class="btn btn-primary btn-xs" data-action="order-set" data-id="${o.id}" data-status="completed">${tt('markDelivered')}</button>`;
  return '';
}
function orderCards(orders) {
  if (!orders.length) return emptyState('fa-clipboard-list', tt('noOrders'));
  return html`<div class="order-list">${orders.map((o) => html`<article class="order-card glass-card" data-status="${o.status || 'pending'}">
    <div class="order-top"><strong class="order-id">${o.orderId || '#' + o.id.slice(-6).toUpperCase()}</strong>${statusPill(o.status)}</div>
    <div class="order-grid">
      <div><span class="muted small">${tt('customer')}</span><div>${o.customerName || '—'}</div></div>
      <div><span class="muted small">${tt('phone')}</span><div>${o.phone ? html`<a href="tel:${String(o.phone).replace(/[^\d+]/g, '')}" dir="ltr">${o.phone}</a>` : '—'}</div></div>
      <div><span class="muted small">${tt('city')}</span><div>${o.location || o.city || '—'}</div></div>
      <div><span class="muted small">${tt('date')}</span><div>${fmtDate(o.createdAt, getLang())}</div></div>
      <div><span class="muted small">${tt('payment')}</span><div>${o.paymentMethod || '—'}</div></div>
      <div><span class="muted small">${tt('total')}</span><div><strong>${iqd(orderIQD(o))}</strong> ${priceFlag(o)}</div></div>
    </div>
    <div class="order-items-line">${itemsText(o)}</div>
    ${o.note ? html`<div class="order-note"><i class="fas fa-note-sticky"></i> ${o.note}</div>` : ''}
    <div class="order-actions">${orderActions(o)}</div>
  </article>`)}</div>`;
}
async function ordersSection(m) {
  const orders = newestFirst(await getAll('orders'));
  const shown = orderFilter ? orders.filter((o) => (o.status || 'pending') === orderFilter) : orders;
  setHTML(m, html`${head(`${tt('dashOrders')} (${orders.length})`)}
    <div class="chips wrap"><button type="button" class="chip-btn${orderFilter ? '' : ' on'}" data-action="order-filter" data-status="">${tt('catAll')}</button>
    ${ORDER_STATUSES.map((s) => html`<button type="button" class="chip-btn${orderFilter === s ? ' on' : ''}" data-action="order-filter" data-status="${s}">${statusLabel(s)} · ${orders.filter((o) => (o.status || 'pending') === s).length}</button>`)}</div>
    ${orderCards(shown)}`);
}
async function printerQueue(m) {
  const orders = newestFirst(await getAll('orders')).filter((o) => o.status === 'confirmed' || o.status === 'delivering');
  setHTML(m, html`${head(tt('dashQueue'))}
    <div class="stat-grid">${stat('tint-green', 'fa-print', orders.filter((o) => o.status === 'confirmed').length, tt('inQueue'))}
    ${stat('tint-gold', 'fa-truck', orders.filter((o) => o.status === 'delivering').length, statusLabel('delivering'))}</div>
    ${orderCards(orders)}`);
}
async function setOrderStatus(id, status) {
  try { await fb.updateDoc(fb.doc(fb.db, 'orders', id), { status, updatedAt: fb.serverTimestamp() }); toast(tt('statusUpdated'), 'success'); refresh(); }
  catch (e) { fail(e); }
}

// ═══════════ admin: overview / analytics ═══════════
async function adminOverview(m) {
  const [users, orders, products] = await Promise.all([getAll('users'), getAll('orders'), getAll('products')]);
  newestFirst(orders);
  setHTML(m, html`${head(tt('dashOverview') + ' 👑', tt('liveData', { time: new Date().toLocaleTimeString() }), html`<button type="button" class="icon-btn" data-action="dash-refresh" aria-label="${tt('retry')}"><i class="fas fa-rotate"></i></button>`)}
    <div class="stat-grid">
      ${stat('tint-green', 'fa-users', users.length, tt('users'))}
      ${stat('tint-gold', 'fa-shirt', products.length, tt('dashProducts'))}
      ${stat('tint-rust', 'fa-bag-shopping', orders.length, tt('dashOrders'))}
      ${stat('tint-blue', 'fa-sack-dollar', iqd(orderRevenue(orders)), tt('revenue'))}
      ${stat('tint-plum', 'fa-palette', users.filter((u) => effectiveRole(u) === 'designer').length, tt('designers'))}
      ${stat('tint-amber', 'fa-print', users.filter((u) => effectiveRole(u) === 'printer').length, tt('printers'))}
      ${stat('tint-rust', 'fa-clock', orders.filter((o) => (o.status || 'pending') === 'pending').length, tt('pendingOrders'))}
      ${stat('tint-gold', 'fa-user-clock', users.filter((u) => u.status === 'pending').length, tt('dashRequests'))}
    </div>
    <h2 class="card-title">${tt('recentOrders')}</h2>
    ${orderCards(orders.slice(0, 6))}`);
  syncDirectory(users).catch((e) => console.warn('directory sync', e));
}
async function adminAnalytics(m) {
  const [orders, users] = await Promise.all([getAll('orders'), getAll('users')]);
  const live = orders.filter((o) => o.status !== 'cancelled');
  const byCustomer = {}, byProduct = {};
  live.forEach((o) => {
    byCustomer[o.customerName || '—'] = (byCustomer[o.customerName || '—'] || 0) + orderIQD(o);
    (o.items || []).forEach((i) => { byProduct[i.name] = (byProduct[i.name] || 0) + (Number(i.qty) || 0); });
  });
  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const table = (rows, colA, colB, fmt = (v) => v) => rows.length
    ? html`<div class="table-wrap"><table><thead><tr><th>${colA}</th><th>${colB}</th></tr></thead><tbody>${rows.map(([a, b]) => html`<tr><td>${a}</td><td>${fmt(b)}</td></tr>`)}</tbody></table></div>`
    : html`<p class="muted">${tt('noData')}</p>`;
  setHTML(m, html`${head(tt('dashAnalytics'))}
    <div class="stat-grid">
      ${stat('tint-green', 'fa-sack-dollar', iqd(orderRevenue(orders)), tt('revenue'))}
      ${stat('tint-gold', 'fa-bag-shopping', orders.length, tt('dashOrders'))}
      ${stat('tint-blue', 'fa-circle-check', orders.filter((o) => o.status === 'completed').length, statusLabel('completed'))}
      ${stat('tint-rust', 'fa-clock', orders.filter((o) => (o.status || 'pending') === 'pending').length, statusLabel('pending'))}
      ${stat('tint-plum', 'fa-users', users.length, tt('users'))}
    </div>
    <div class="two-col">
      <div class="glass-card pad"><h2 class="card-title">${tt('topCustomers')}</h2>${table(top(byCustomer), tt('customer'), tt('revenue'), iqd)}</div>
      <div class="glass-card pad"><h2 class="card-title">${tt('topProducts')}</h2>${table(top(byProduct), tt('productName'), tt('qtySold'))}</div>
    </div>`);
}

// ═══════════ admin: users & requests ═══════════
async function adminUsers(m) {
  const users = (await getAll('users')).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  setHTML(m, html`${head(`${tt('dashUsers')} (${users.length})`)}
    <div class="glass-card table-card"><div class="table-wrap"><table>
      <thead><tr><th>${tt('fullName')}</th><th>${tt('email')}</th><th>${tt('role')}</th><th>${tt('status')}</th><th>${tt('setRole')}</th></tr></thead>
      <tbody>${users.map((u) => html`<tr>
        <td><div class="cell-user">${thumb(u.photoURL, u.name)}<span>${u.name || '—'}</span></div></td>
        <td class="small" dir="ltr">${u.email || '—'}</td>
        <td><span class="pill role-${u.role || 'customer'}">${roleLabel(u.role)}</span></td>
        <td>${statusPill(u.status || 'active')}</td>
        <td><select class="mini-select" data-change="set-role" data-uid="${u.id}" data-current="${u.role || 'customer'}" aria-label="${tt('setRole')}">
          ${ROLES.map((r) => html`<option value="${r}" ${r === (u.role || 'customer') ? html`selected` : ''}>${roleLabel(r)}</option>`)}</select></td>
      </tr>`)}</tbody></table></div></div>`);
  syncDirectory(users).catch((e) => console.warn('directory sync', e));
}
async function setRole(sel) {
  const uid = sel.dataset.uid, role = sel.value, prev = sel.dataset.current;
  if (role === prev) return;
  if ((role === 'admin' || prev === 'admin' || uid === state.user.uid) && !(await confirmDialog(`${roleLabel(prev)} → ${roleLabel(role)}?`, { danger: prev === 'admin' }))) {
    sel.value = prev; return;
  }
  try {
    await fb.updateDoc(fb.doc(fb.db, 'users', uid), { role, status: 'active' });
    sel.dataset.current = role;
    await syncDirectoryFor(uid);
    toast(tt('roleUpdated'), 'success');
    refresh();
  } catch (e) { sel.value = prev; fail(e); }
}
async function adminRequests(m) {
  const pending = newestFirst(await getAll('users', fb.where('status', '==', 'pending')));
  setHTML(m, html`${head(tt('dashRequests'))}
    ${pending.length ? html`<div class="order-list">${pending.map((u) => html`<article class="order-card glass-card">
      <div class="order-top"><div class="cell-user">${thumb(u.photoURL, u.name)}<strong>${u.name || '—'}</strong></div><span class="pill role-${u.requestedRole || u.role}">${roleLabel(u.requestedRole || u.role)}</span></div>
      <div class="muted small" dir="ltr">${u.email || ''}</div><div class="muted small">${fmtDate(u.createdAt, getLang())}</div>
      <div class="order-actions"><button type="button" class="btn btn-primary btn-xs" data-action="req-approve" data-uid="${u.id}" data-role="${u.requestedRole || u.role}">${tt('approve')}</button>
      <button type="button" class="btn btn-glass btn-xs danger-text" data-action="req-reject" data-uid="${u.id}">${tt('reject')}</button></div>
    </article>`)}</div>` : emptyState('fa-user-check', tt('noPending'))}`);
}
async function approveUser(uid, role) {
  const safeRole = ['designer', 'printer', 'advertiser', 'technician', 'customer'].includes(role) ? role : 'customer';
  try { await fb.updateDoc(fb.doc(fb.db, 'users', uid), { role: safeRole, status: 'active' }); await syncDirectoryFor(uid); toast(tt('userApproved'), 'success'); refresh(); }
  catch (e) { fail(e); }
}
async function rejectUser(uid) {
  try { await fb.updateDoc(fb.doc(fb.db, 'users', uid), { role: 'customer', status: 'rejected' }); toast(tt('userRejected')); refresh(); }
  catch (e) { fail(e); }
}

/** Keep the public designers/ directory matching approved designers. */
async function syncDirectory(users) {
  const dir = new Map((await getAll('designers')).map((d) => [d.id, d]));
  const designers = users.filter((u) => effectiveRole(u) === 'designer');
  const ops = [];
  for (const u of designers) {
    const want = { name: clampStr(u.name, 100) || 'Designer', bio: clampStr(u.bio, 600), photoURL: safeImg(u.photoURL) ? u.photoURL : '' };
    const cur = dir.get(u.id);
    if (!cur || cur.name !== want.name || (cur.bio || '') !== want.bio || (cur.photoURL || '') !== want.photoURL) ops.push(['set', u.id, want]);
  }
  for (const id of dir.keys()) if (!designers.some((u) => u.id === id)) ops.push(['delete', id]);
  for (let i = 0; i < ops.length; i += 40) {
    const batch = fb.writeBatch(fb.db);
    ops.slice(i, i + 40).forEach(([op, id, data]) => {
      const ref = fb.doc(fb.db, 'designers', id);
      if (op === 'set') batch.set(ref, { ...data, updatedAt: fb.serverTimestamp() }); else batch.delete(ref);
    });
    await batch.commit();
  }
  if (ops.length) { state.designers = null; emit('designers'); }
}
async function syncDirectoryFor(uid) {
  const snap = await fb.getDoc(fb.doc(fb.db, 'users', uid));
  if (!snap.exists()) return;
  const u = { id: uid, ...snap.data() };
  const ref = fb.doc(fb.db, 'designers', uid);
  if (effectiveRole(u) === 'designer') await fb.setDoc(ref, { name: clampStr(u.name, 100) || 'Designer', bio: clampStr(u.bio, 600), photoURL: safeImg(u.photoURL) ? u.photoURL : '', updatedAt: fb.serverTimestamp() });
  else await fb.deleteDoc(ref).catch(() => {});
  state.designers = null;
}

// ═══════════ products (admin all / designer own) ═══════════
function productTiles(products, { admin }) {
  if (!products.length) return emptyState('fa-shirt', tt('noDesignsYet'), html`<a class="btn btn-glass btn-sm" href="#/dashboard/upload">${tt('addFirstDesign')}</a>`);
  return html`<div class="product-grid">${products.map((p) => html`<article class="pcard manage">
    <div class="pcard-media static"><img src="${safeImg(p.img || p.imageURL) || placeholderImg(p.name)}" data-fallback="${p.name}" alt="" loading="lazy" decoding="async" />
      <span class="pbadge status">${statusPill(p.status)}</span></div>
    <div class="pcard-body">
      <div class="pcard-designer">${p.designerName || '—'}</div>
      <h3 class="pcard-name">${p.name}</h3>
      <div class="pcard-foot"><span class="price">${money(p.price)}</span>
        <div class="tile-actions">
          ${admin && p.status !== 'active' ? html`<button type="button" class="icon-btn small ok-text" data-action="product-approve" data-id="${p.id}" aria-label="${tt('approve')}"><i class="fas fa-check"></i></button>` : ''}
          <button type="button" class="icon-btn small" data-action="product-edit" data-id="${p.id}" aria-label="${tt('edit')}"><i class="fas fa-pen"></i></button>
          <button type="button" class="icon-btn small danger-text" data-action="product-delete" data-id="${p.id}" aria-label="${tt('delete')}"><i class="fas fa-trash"></i></button>
        </div></div>
    </div></article>`)}</div>`;
}
let productCache = new Map();
async function adminProducts(m) {
  const products = newestFirst(await getAll('products'));
  products.sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0));
  productCache = new Map(products.map((p) => [p.id, p]));
  setHTML(m, html`${head(`${tt('dashProducts')} (${products.length})`, '', html`<a class="btn btn-primary btn-sm" href="#/dashboard/upload"><i class="fas fa-plus"></i> ${tt('dashUpload')}</a>`)}${productTiles(products, { admin: true })}`);
}
async function myDesigns(m) {
  const products = newestFirst(await getAll('products', fb.where('designerId', '==', state.user.uid)));
  productCache = new Map(products.map((p) => [p.id, p]));
  setHTML(m, html`${head(tt('dashMyDesigns'), '', html`<a class="btn btn-primary btn-sm" href="#/dashboard/upload"><i class="fas fa-plus"></i> ${tt('dashUploadDesign')}</a>`)}${productTiles(products, { admin: state.role === 'admin' })}`);
}
async function designerOverview(m) {
  const [products, orders] = await Promise.all([
    getAll('products', fb.where('designerId', '==', state.user.uid)),
    getAll('orders', fb.where('designerIds', 'array-contains', state.user.uid)).catch(() => []),
  ]);
  const mine = (i) => i.designerId === state.user.uid;
  const live = orders.filter((o) => o.status !== 'cancelled');
  const revenue = live.reduce((a, o) => a + (o.items || []).filter(mine).reduce((s, i) => s + lineIQD(i.price, i.qty), 0), 0);
  const units = live.reduce((a, o) => a + (o.items || []).filter(mine).reduce((s, i) => s + i.qty, 0), 0);
  setHTML(m, html`${head(tt('dashWelcome', { name: String(state.user.name || '').split(' ')[0] }))}
    <div class="stat-grid">
      ${stat('tint-green', 'fa-palette', products.length, tt('dashMyDesigns'))}
      ${stat('tint-blue', 'fa-circle-check', products.filter((p) => p.status === 'active').length, statusLabel('active'))}
      ${stat('tint-gold', 'fa-sack-dollar', iqd(revenue), tt('revenue'))}
      ${stat('tint-rust', 'fa-shirt', units, tt('unitsSold'))}
    </div>
    <div class="glass-card pad"><div class="btn-row start"><a class="btn btn-primary" href="#/dashboard/upload"><i class="fas fa-cloud-arrow-up"></i> ${tt('dashUploadDesign')}</a><a class="btn btn-glass" href="#/dashboard/sales">${tt('dashSales')}</a></div></div>`);
}
async function designerSales(m) {
  const orders = newestFirst(await getAll('orders', fb.where('designerIds', 'array-contains', state.user.uid)));
  const mine = (i) => i.designerId === state.user.uid;
  const live = orders.filter((o) => o.status !== 'cancelled');
  setHTML(m, html`${head(tt('dashSales'))}
    <div class="stat-grid">
      ${stat('tint-green', 'fa-sack-dollar', iqd(live.reduce((a, o) => a + (o.items || []).filter(mine).reduce((s, i) => s + lineIQD(i.price, i.qty), 0), 0)), tt('revenue'))}
      ${stat('tint-gold', 'fa-shirt', live.reduce((a, o) => a + (o.items || []).filter(mine).reduce((s, i) => s + i.qty, 0), 0), tt('unitsSold'))}
      ${stat('tint-rust', 'fa-clipboard-list', orders.length, tt('dashOrders'))}
    </div>
    ${orders.length ? html`<div class="glass-card table-card"><div class="table-wrap"><table>
      <thead><tr><th>${tt('orderId')}</th><th>${tt('date')}</th><th>${tt('items')}</th><th>${tt('revenue')}</th><th>${tt('status')}</th></tr></thead>
      <tbody>${orders.map((o) => html`<tr><td><strong>${o.orderId || '—'}</strong></td><td>${fmtDate(o.createdAt, getLang())}</td>
        <td class="small">${itemsText(o, mine)}</td><td>${iqd((o.items || []).filter(mine).reduce((s, i) => s + lineIQD(i.price, i.qty), 0))}</td><td>${statusPill(o.status)}</td></tr>`)}</tbody>
    </table></div></div>` : emptyState('fa-chart-column', tt('noData'))}`);
}

// ── product form (create + edit) ──
const formMedia = new WeakMap();
function productForm(p = null) {
  const admin = state.role === 'admin';
  const colors = new Map((Array.isArray(p?.colors) ? p.colors : []).map((c) => [c.name, c]));
  const sizes = Array.isArray(p?.sizes) && p.sizes.length ? p.sizes : SIZES;
  const garments = Array.isArray(p?.garmentTypes) && p.garmentTypes.length ? p.garmentTypes : ['tshirt'];
  const visible = !p || p.status !== 'inactive';
  const mainImg = safeImg(p?.img || p?.imageURL);
  return html`<form class="form product-form" data-submit="product-save" data-pid="${p?.id || ''}" novalidate>
    <div class="field"><label for="pf-n">${tt('productName')} *</label><input id="pf-n" name="name" maxlength="120" value="${p?.name || ''}" required /></div>
    <div class="field"><label for="pf-d">${tt('description')}</label><textarea id="pf-d" name="description" rows="3" maxlength="2000">${p?.description || ''}</textarea></div>
    <div class="field-row">
      <div class="field"><label for="pf-c">${tt('category')}</label><select id="pf-c" name="category">${CATEGORIES.map((c) => html`<option value="${c}" ${p?.category === c ? html`selected` : ''}>${tt(CAT_KEY[c])}</option>`)}</select></div>
      <div class="field"><label for="pf-p">${tt('priceUsd')} *</label><input id="pf-p" name="price" type="number" min="0.5" max="10000" step="0.5" inputmode="decimal" value="${p?.price ?? ''}" required />
        <small class="muted" data-iqd-preview>${p?.price ? '≈ ' + money(p.price) : ''}</small></div>
    </div>
    <fieldset class="field"><legend>${tt('garmentTypes')}</legend><div class="check-row">
      ${['tshirt', 'hoodie'].map((g) => html`<label class="check"><input type="checkbox" name="garment" value="${g}" ${garments.includes(g) ? html`checked` : ''} /> ${tt(CAT_KEY[g])}</label>`)}</div></fieldset>
    <div class="field-row">
      <div class="field"><label for="pf-s">${tt('stock')} <small class="muted">${tt('stockHint')}</small></label><input id="pf-s" name="stock" type="number" min="0" step="1" value="${p?.stock || 0}" /></div>
      <fieldset class="field"><legend>${tt('sizes')}</legend><div class="check-row">${SIZES.map((s) => html`<label class="check"><input type="checkbox" name="size" value="${s}" ${sizes.includes(s) ? html`checked` : ''} /> ${s}</label>`)}</div></fieldset>
    </div>
    <fieldset class="field"><legend>${tt('colors')} <small class="muted">${tt('colorsHint')}</small></legend>
      <div class="color-pick">${PALETTE.map((c) => html`<label class="color-opt" title="${c.name}"><input type="checkbox" name="color" value="${c.name}" data-hex="${c.hex}" ${colors.has(c.name) ? html`checked` : ''} /><span class="dot" style="--sw:${safeHex(c.hex)}"></span><span class="small">${c.name}</span></label>`)}</div>
      <div class="color-photos" data-color-photos>${PALETTE.filter((c) => colors.has(c.name)).map((c) => colorPhotoRow(c.name, colors.get(c.name)?.img))}</div>
    </fieldset>
    <div class="field"><span class="label">${tt('productImage')} *</span>
      <label class="upload-zone"><input type="file" accept="image/*" data-main-image hidden />
        <span class="upload-preview" data-main-preview>${mainImg ? html`<img src="${mainImg}" alt="" />` : html`<i class="fas fa-cloud-arrow-up"></i>`}</span>
        <span class="muted small">${tt('uploadImage')}</span></label>
      <input name="imageUrl" type="url" inputmode="url" placeholder="${tt('orPasteUrl')}" value="${mainImg.startsWith('https://') ? mainImg : ''}" />
    </div>
    ${admin ? html`<div class="field-row">
        <div class="field"><label for="pf-st">${tt('publishStatus')}</label><select id="pf-st" name="status">${['active', 'pending', 'inactive'].map((s) => html`<option value="${s}" ${(p?.status || 'active') === s ? html`selected` : ''}>${statusLabel(s)}</option>`)}</select></div>
        <div class="field"><label for="pf-b">${tt('badge')}</label><select id="pf-b" name="badge">${[['', tt('none')], ['new', tt('badgeNew')], ['trending', tt('badgeHot')], ['collab', tt('badgeCollab')]].map(([v, l]) => html`<option value="${v}" ${(p?.badge ?? (p ? '' : 'new')) === v ? html`selected` : ''}>${l}</option>`)}</select></div>
      </div>`
      : p ? html`<label class="check"><input type="checkbox" name="visible" ${visible ? html`checked` : ''} /> ${statusLabel('active')}</label>` : ''}
    <button class="btn btn-primary btn-block" type="submit">${p ? tt('saveProduct') : tt('submitDesign')}</button>
  </form>`;
}
const colorPhotoRow = (name, img) => html`<div class="color-photo" data-color-row="${name}">
  <span>${name}</span><label class="link-btn small"><input type="file" accept="image/*" data-color-file="${name}" hidden />${tt('uploadColorPhoto')}</label>
  ${safeImg(img) ? html`<img src="${safeImg(img)}" alt="" />` : html`<img alt="" hidden />`}</div>`;

function wireProductForm(form, p) {
  const media = { main: safeImg(p?.img || p?.imageURL) || '', colors: {} };
  (p?.colors || []).forEach((c) => { if (safeImg(c.img)) media.colors[c.name] = c.img; });
  formMedia.set(form, media);
  form.price.addEventListener('input', () => { const v = Number(form.price.value); $('[data-iqd-preview]', form).textContent = v > 0 ? '≈ ' + money(v) : ''; });
  form.addEventListener('change', async (e) => {
    const el = e.target;
    if (el.name === 'color') {
      const box = $('[data-color-photos]', form);
      if (el.checked) box.insertAdjacentHTML('beforeend', colorPhotoRow(el.value).s);
      else { $(`[data-color-row="${CSS.escape(el.value)}"]`, box)?.remove(); delete media.colors[el.value]; }
    }
    if (el.matches('[data-main-image]') && el.files[0]) {
      try {
        media.main = await compressImage(el.files[0], { maxDim: 900, quality: 0.8, maxChars: 320000 });
        setHTML($('[data-main-preview]', form), html`<img src="${media.main}" alt="" />`);
        form.imageUrl.value = '';
      } catch (err) { fail(err); }
    }
    if (el.matches('[data-color-file]') && el.files[0]) {
      try {
        const name = el.dataset.colorFile;
        media.colors[name] = await compressImage(el.files[0], { maxDim: 600, quality: 0.75, maxChars: 90000 });
        const img = $(`[data-color-row="${CSS.escape(name)}"] img`, form); img.src = media.colors[name]; img.hidden = false;
      } catch (err) { fail(err); }
    }
  });
}

async function saveProduct(form, btn) {
  const pid = form.dataset.pid;
  const prev = pid ? productCache.get(pid) || productById(pid) : null;
  const admin = state.role === 'admin';
  const media = formMedia.get(form) || { main: '', colors: {} };
  const name = clampStr(form.name.value, 120);
  const priceUsd = Math.round(Number(form.price.value) * 100) / 100;
  if (!name || !(priceUsd > 0)) { toast(tt('needNamePrice'), 'error'); return; }
  const pasted = safeLink(form.imageUrl.value).startsWith('https://') ? form.imageUrl.value.trim() : '';
  const img = pasted || media.main;
  if (!safeImg(img)) { toast(tt('needImage'), 'error'); return; }
  const colors = $$('input[name="color"]:checked', form).map((c) => ({ name: c.value, hex: c.dataset.hex, img: media.colors[c.value] || '' }));
  const data = {
    name, description: clampStr(form.description.value, 2000), category: CATEGORIES.includes(form.category.value) ? form.category.value : 'tshirt',
    price: priceUsd, stock: Math.max(0, parseInt(form.stock.value, 10) || 0),
    sizes: $$('input[name="size"]:checked', form).map((s) => s.value), garmentTypes: $$('input[name="garment"]:checked', form).map((g) => g.value),
    colors, img,
  };
  if (!data.sizes.length) data.sizes = SIZES;
  if (!data.garmentTypes.length) data.garmentTypes = ['tshirt'];
  const imageChanged = !prev || img !== (prev.img || prev.imageURL || '') || JSON.stringify(colors) !== JSON.stringify(prev.colors || []);
  if (prev && img !== (prev.img || '')) data.imageURL = '';

  if (admin) { data.status = form.status.value; data.badge = form.badge.value; }
  else if (!prev) { data.status = 'pending'; data.badge = ''; }
  else {
    const wantVisible = form.visible?.checked !== false;
    data.status = !wantVisible ? 'inactive' : prev.status === 'active' && !imageChanged ? 'active' : 'pending';
  }
  if (JSON.stringify(data).length > 950000) { toast(tt('productTooLarge'), 'error'); return; }

  await withBusy(btn, async () => {
    try {
      if (prev) {
        await fb.updateDoc(fb.doc(fb.db, 'products', pid), { ...data, updatedAt: fb.serverTimestamp() });
        if (!admin && prev.status === 'active' && data.status === 'pending') toast(tt('productBackToReview'));
        toast(tt('productSaved'), 'success');
        form.closest('.modal') && $('[data-close]', form.closest('.modal'))?.click();
      } else {
        await fb.addDoc(fb.collection(fb.db, 'products'), {
          ...data, designerId: state.user.uid, designerName: clampStr(state.user.name, 100) || 'Naxshin', createdAt: fb.serverTimestamp(),
        });
        toast(admin && data.status === 'active' ? tt('productSaved') : tt('productSubmitted'), 'success');
        location.hash = admin ? '#/dashboard/products' : '#/dashboard/designs';
        return;
      }
      refresh();
    } catch (e) { fail(e); }
  });
}
function uploadSection(m) {
  setHTML(m, html`${head(state.role === 'admin' ? tt('dashUpload') : tt('dashUploadDesign'))}<div class="glass-card pad">${productForm(null)}</div>`);
  wireProductForm($('form[data-submit="product-save"]', m), null);
}
async function editProduct(id) {
  let p = productCache.get(id) || productById(id);
  if (!p) { const snap = await fb.getDoc(fb.doc(fb.db, 'products', id)); if (snap.exists()) p = { id, ...snap.data() }; }
  if (!p) return;
  productCache.set(id, p);
  const d = openDialog(html`<h2 class="modal-title">${tt('editProduct')}</h2>${productForm(p)}`, { label: tt('editProduct') });
  wireProductForm($('form', d.body), p);
}
async function deleteProduct(id) {
  if (!(await confirmDialog(tt('confirmDelete'), { ok: tt('delete'), danger: true }))) return;
  try { await fb.deleteDoc(fb.doc(fb.db, 'products', id)); toast(tt('deleted')); refresh(); } catch (e) { fail(e); }
}
async function approveProduct(id) {
  const p = productCache.get(id);
  try { await fb.updateDoc(fb.doc(fb.db, 'products', id), { status: 'active', badge: p?.badge || 'new', updatedAt: fb.serverTimestamp() }); toast(tt('productApproved'), 'success'); refresh(); }
  catch (e) { fail(e); }
}

// ═══════════ admin: ads ═══════════
let adMedia = { url: '', video: false };
async function adminAds(m) {
  const ads = newestFirst(await getAll('ads'));
  adMedia = { url: '', video: false };
  setHTML(m, html`${head(tt('dashAds'), tt('adsHint'))}
    <div class="glass-card pad"><h2 class="card-title">${tt('activeAds')} (${ads.filter((a) => a.active).length})</h2>
      ${ads.length ? html`<div class="ad-admin-list">${ads.map((a) => html`<div class="ad-admin-row">
        ${safeImg(a.mediaURL) ? thumb(a.mediaURL, a.advertiser) : html`<span class="thumb video-thumb"><i class="fas fa-film"></i></span>`}
        <div class="grow"><strong>${a.advertiser || '—'}</strong><div class="muted small">${String(a.text || '').slice(0, 100)}</div></div>
        ${statusPill(a.active ? 'active' : 'inactive')}
        <button type="button" class="icon-btn small danger-text" data-action="ad-delete" data-id="${a.id}" aria-label="${tt('delete')}"><i class="fas fa-trash"></i></button>
      </div>`)}</div>` : html`<p class="muted">${tt('noAds')}</p>`}
    </div>
    <form class="glass-card pad form" data-submit="ad-save" novalidate>
      <h2 class="card-title">${tt('publishAd')}</h2>
      <div class="field"><label for="ad-adv">${tt('advertiser')} *</label><input id="ad-adv" name="advertiser" maxlength="80" required /></div>
      <div class="field"><label for="ad-txt">${tt('adText')}</label><textarea id="ad-txt" name="text" rows="3" maxlength="600"></textarea></div>
      <div class="field"><label for="ad-link">${tt('adLink')}</label><input id="ad-link" name="link" type="url" inputmode="url" placeholder="https://" /></div>
      <div class="field"><span class="label">${tt('adMedia')} *</span>
        <label class="upload-zone"><input type="file" accept="image/*,video/*" data-ad-file hidden /><span class="upload-preview" data-ad-preview><i class="fas fa-photo-film"></i></span><span class="muted small">${tt('uploadImage')}</span></label>
        <input name="mediaUrl" type="url" inputmode="url" placeholder="${tt('adMediaUrl')}" /></div>
      <button class="btn btn-primary btn-block" type="submit">${tt('publishAd')}</button>
    </form>`);
  $('[data-ad-file]', m)?.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const prev = $('[data-ad-preview]', m);
    if (file.type.startsWith('video/')) { adMedia = { url: '', video: true }; setHTML(prev, html`<span class="small danger-text">${tt('videoNeedsUrl')}</span>`); return; }
    try { adMedia = { url: await compressImage(file, { maxDim: 1400, quality: 0.8, maxChars: 600000 }), video: false }; setHTML(prev, html`<img src="${adMedia.url}" alt="" />`); }
    catch (err) { fail(err); }
  });
}
async function saveAd(form, btn) {
  const advertiser = clampStr(form.advertiser.value, 80);
  const url = adMedia.url || (safeLink(form.mediaUrl.value).startsWith('https://') ? form.mediaUrl.value.trim() : '');
  if (!advertiser || !url) { toast(tt('fillRequired'), 'error'); return; }
  const isVideo = !adMedia.url && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  await withBusy(btn, async () => {
    try {
      await fb.addDoc(fb.collection(fb.db, 'ads'), {
        advertiser, text: clampStr(form.text.value, 600), link: safeLink(form.link.value), mediaURL: url, isVideo, active: true, createdAt: fb.serverTimestamp(),
      });
      toast(tt('adPublished'), 'success'); refresh();
    } catch (e) { fail(e); }
  });
}

// ═══════════ bugs & inbox ═══════════
async function bugsSection(m) {
  const bugs = newestFirst(await getAll('bug-reports'));
  const open = bugs.filter((b) => !b.resolved).length;
  setHTML(m, html`${head(tt('dashBugs'), '', html`<div class="chips"><span class="pill st-pending">${tt('bugsOpen', { n: open })}</span><span class="pill st-completed">${tt('bugsResolved', { n: bugs.length - open })}</span></div>`)}
    ${bugs.length ? html`<div class="order-list">${bugs.map((b) => html`<article class="order-card glass-card">
      <div class="order-top"><span class="muted small">${fmtDate(b.createdAt, getLang())} · <span dir="ltr">${b.userEmail || b.userId || '—'}</span>${b.page ? ` · ${b.page}` : ''}</span>${statusPill(b.resolved ? 'resolved' : 'open')}</div>
      <p class="pre-wrap">${b.description || '—'}</p>
      ${safeImg(b.image) ? html`<button type="button" class="shot" data-action="view-image" data-src-from="bug" data-id="${b.id}"><img src="${safeImg(b.image)}" alt="" loading="lazy" /></button>` : ''}
      <div class="order-actions">${b.resolved ? '' : html`<button type="button" class="btn btn-primary btn-xs" data-action="bug-resolve" data-id="${b.id}">${tt('resolve')}</button>`}
        <button type="button" class="icon-btn small danger-text" data-action="doc-delete" data-col="bug-reports" data-id="${b.id}" aria-label="${tt('delete')}"><i class="fas fa-trash"></i></button></div>
    </article>`)}</div>` : emptyState('fa-bug', tt('noData'))}`);
}
async function inboxSection(m) {
  const [msgs, partners] = await Promise.all([getAll('contact-messages'), getAll('partner-requests')]);
  const all = newestFirst([...msgs.map((x) => ({ ...x, col: 'contact-messages' })), ...partners.map((x) => ({ ...x, col: 'partner-requests' }))]);
  setHTML(m, html`${head(`${tt('dashInbox')} (${all.filter((x) => !x.handled).length})`)}
    ${all.length ? html`<div class="order-list">${all.map((x) => html`<article class="order-card glass-card${x.handled ? ' dim' : ''}">
      <div class="order-top"><strong>${x.name || '—'}</strong><span class="pill">${x.col === 'partner-requests' ? `${tt('collaborate')} · ${x.type || ''}` : x.subject || tt('message')}</span></div>
      <div class="muted small">${fmtDate(x.createdAt, getLang())} · <a href="mailto:${x.email || ''}" dir="ltr">${x.email || ''}</a></div>
      <p class="pre-wrap">${x.message || '—'}</p>
      ${safeImg(x.image) ? html`<a class="shot" href="${safeImg(x.image)}" target="_blank" rel="noopener"><img src="${safeImg(x.image)}" alt="" loading="lazy" /></a>` : ''}
      <div class="order-actions">${x.handled ? html`<span class="pill st-completed">${tt('handled')}</span>` : html`<button type="button" class="btn btn-primary btn-xs" data-action="inbox-done" data-col="${x.col}" data-id="${x.id}">${tt('markHandled')}</button>`}
        <button type="button" class="icon-btn small danger-text" data-action="doc-delete" data-col="${x.col}" data-id="${x.id}" aria-label="${tt('delete')}"><i class="fas fa-trash"></i></button></div>
    </article>`)}</div>` : emptyState('fa-inbox', tt('inboxEmpty'))}`);
}

// ═══════════ security rules viewer ═══════════
async function rulesSection(m) {
  let text = '';
  try { text = await (await fetch('firestore.rules', { cache: 'no-cache' })).text(); } catch { text = '(could not load firestore.rules)'; }
  setHTML(m, html`${head(tt('dashRules'), tt('rulesIntro'))}
    <div class="btn-row start">
      <a class="btn btn-primary btn-sm" href="https://console.firebase.google.com/project/naxshin-e5e25/firestore/databases/-default-/rules" target="_blank" rel="noopener noreferrer"><i class="fas fa-arrow-up-right-from-square"></i> ${tt('openConsole')}</a>
      <a class="btn btn-glass btn-sm" href="https://console.firebase.google.com/project/naxshin-e5e25/authentication/users" target="_blank" rel="noopener noreferrer"><i class="fas fa-users"></i> ${tt('authUsers')}</a>
      <button type="button" class="btn btn-glass btn-sm" data-action="copy-rules"><i class="fas fa-copy"></i> ${tt('copy')}</button>
    </div>
    <pre class="code-block" id="rules-text" dir="ltr">${text}</pre>`);
}

// ═══════════ section map ═══════════
const SECTIONS = {
  customer: { overview: custOverview, 'my-orders': custOrders, wishlist: custWishlist },
  designer: { overview: designerOverview, designs: myDesigns, upload: uploadSection, sales: designerSales },
  printer: { overview: printerQueue, orders: ordersSection },
  technician: { overview: bugsSection, rules: rulesSection },
  admin: {
    overview: adminOverview, orders: ordersSection, products: adminProducts, upload: uploadSection, designs: myDesigns,
    users: adminUsers, requests: adminRequests, inbox: inboxSection, analytics: adminAnalytics, ads: adminAds, bugs: bugsSection, rules: rulesSection,
  },
};
SECTIONS.advertiser = SECTIONS.customer;

export function initDashboard() {
  registerActions({
    'dash-refresh': () => refresh(),
    'order-filter': (el) => { orderFilter = el.dataset.status; refresh(); },
    'order-set': (el) => setOrderStatus(el.dataset.id, el.dataset.status),
    'order-delete': async (el) => {
      if (!(await confirmDialog(tt('confirmDelete'), { ok: tt('delete'), danger: true }))) return;
      try { await fb.deleteDoc(fb.doc(fb.db, 'orders', el.dataset.id)); toast(tt('deleted')); refresh(); } catch (e) { fail(e); }
    },
    'req-approve': (el) => approveUser(el.dataset.uid, el.dataset.role),
    'req-reject': (el) => rejectUser(el.dataset.uid),
    'product-edit': (el) => editProduct(el.dataset.id),
    'product-delete': (el) => deleteProduct(el.dataset.id),
    'product-approve': (el) => approveProduct(el.dataset.id),
    'ad-delete': async (el) => {
      if (!(await confirmDialog(tt('confirmDelete'), { ok: tt('delete'), danger: true }))) return;
      try { await fb.deleteDoc(fb.doc(fb.db, 'ads', el.dataset.id)); toast(tt('adRemoved')); refresh(); } catch (e) { fail(e); }
    },
    'bug-resolve': async (el) => {
      try { await fb.updateDoc(fb.doc(fb.db, 'bug-reports', el.dataset.id), { resolved: true, resolvedAt: fb.serverTimestamp() }); toast(tt('resolved'), 'success'); refresh(); } catch (e) { fail(e); }
    },
    'inbox-done': async (el) => {
      try { await fb.updateDoc(fb.doc(fb.db, el.dataset.col, el.dataset.id), { handled: true }); refresh(); } catch (e) { fail(e); }
    },
    'doc-delete': async (el) => {
      if (!['bug-reports', 'contact-messages', 'partner-requests'].includes(el.dataset.col)) return;
      if (!(await confirmDialog(tt('confirmDelete'), { ok: tt('delete'), danger: true }))) return;
      try { await fb.deleteDoc(fb.doc(fb.db, el.dataset.col, el.dataset.id)); toast(tt('deleted')); refresh(); } catch (e) { fail(e); }
    },
    'view-image': (el) => { const src = el.querySelector('img')?.src; if (src) openDialog(html`<img class="full-img" src="${safeImg(src)}" alt="" />`, { wide: true }); },
    'copy-rules': async () => {
      const text = byId('rules-text')?.textContent || '';
      try { await navigator.clipboard.writeText(text); toast(tt('copied'), 'success'); }
      catch { const r = document.createRange(); r.selectNodeContents(byId('rules-text')); getSelection().removeAllRanges(); getSelection().addRange(r); }
    },
  });
  registerSubmits({ 'product-save': saveProduct, 'ad-save': saveAd });
  registerChanges({
    'set-role': (el) => setRole(el),
    'order-status': (el) => { if (el.value) setOrderStatus(el.dataset.id, el.value); },
  });
}
