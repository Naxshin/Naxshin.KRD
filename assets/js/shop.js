// ════════════════════════════════════════════════════════════════
//  Catalogue, product view, cart, checkout, designers, ratings, ads.
// ════════════════════════════════════════════════════════════════
import {
  html, setHTML, $, $$, byId, safeImg, safeLink, safeHex, placeholderImg, formatIQD, formatIQDAmount, lineIQD, debounce, randomId,
  withBusy, withTimeout, clampStr, normalizePhone, millis, trusted, adMediaOf,
} from './util.js';
import { t, tt, getLang } from './i18n.js';
import { state, fb, emit, on, saveCart, saveWishlist, productById, lineKey } from './state.js';
import {
  registerActions, registerSubmits, registerChanges, openOverlay, closeOverlay, openDialog, toast, fail,
  skeletons, emptyState, isOpen,
} from './ui.js';

export const WHATSAPP_NUMBER = '9647725294559';
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BASE_CATS = ['all', 'tshirt', 'hoodie', 'dress', 'jacket'];
const CAT_KEY = { all: 'catAll', tshirt: 'catTshirt', hoodie: 'catHoodie', dress: 'catDress', jacket: 'catJacket', pants: 'catPants', accessory: 'catAccessory', collab: 'catCollab' };
const filters = { home: { q: '', cat: 'all' }, shop: { q: '', cat: 'all', sort: 'new' } };

const price = (usd) => formatIQD(usd, getLang());
const iqd = (n) => formatIQDAmount(n, getLang());
const imgOf = (p) => safeImg(p?.img || p?.imageURL);
const designerNameOf = (p) => p.designerName || p.designer || 'Naxshin';

// ═══════════ live data ═══════════
let unsubProducts = null, unsubAds = null;
export function startCatalogue() {
  if (!fb) { state.productsStatus = 'error'; emit('products'); return; }
  unsubProducts?.();
  state.productsStatus = state.products.length ? 'ready' : 'loading';
  unsubProducts = fb.onSnapshot(
    fb.query(fb.collection(fb.db, 'products'), fb.where('status', '==', 'active')),
    (snap) => {
      state.products = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
      state.productsStatus = 'ready';
      emit('products');
    },
    (err) => { console.error('products', err); state.productsStatus = 'error'; emit('products'); },
  );
  unsubAds?.();
  unsubAds = fb.onSnapshot(
    fb.query(fb.collection(fb.db, 'ads'), fb.where('active', '==', true)),
    (snap) => {
      state.ads = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => adMediaOf(a))
        .sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
      renderAds();
    },
    (err) => { console.warn('ads', err); state.ads = []; renderAds(); },
  );
}

// ═══════════ product cards ═══════════
function badgeOf(p) {
  if (p.badge === 'new') return { cls: 'new', label: tt('badgeNew') };
  if (p.badge === 'collab') return { cls: 'collab', label: tt('badgeCollab') };
  if (p.badge === 'trending' || p.badge === 'hot') return { cls: 'hot', label: tt('badgeHot') };
  return null;
}
export function productCard(p) {
  const fav = state.wishlist.includes(p.id);
  const badge = badgeOf(p);
  return html`<article class="pcard">
    <button type="button" class="pcard-media" data-action="open-product" data-id="${p.id}" aria-label="${p.name}">
      <img src="${imgOf(p) || placeholderImg(p.name)}" data-fallback="${p.name}" alt="" loading="lazy" decoding="async" />
      ${badge ? html`<span class="pbadge ${badge.cls}">${badge.label}</span>` : ''}
    </button>
    <button type="button" class="pcard-fav${fav ? ' on' : ''}" data-action="toggle-wish" data-id="${p.id}" aria-pressed="${fav}" aria-label="${tt(fav ? 'removeWish' : 'addToWish')}"><i class="${fav ? 'fas' : 'far'} fa-heart"></i></button>
    <div class="pcard-body">
      <div class="pcard-designer">${designerNameOf(p)}</div>
      <h3 class="pcard-name">${p.name}</h3>
      <div class="pcard-foot">
        <span class="price">${price(p.price)}</span>
        <button type="button" class="add-btn" data-action="quick-add" data-id="${p.id}" aria-label="${tt('addToCart')}"><i class="fas fa-plus"></i></button>
      </div>
    </div>
  </article>`;
}

function gridContent(list, { emptyText = tt('noResults'), emptyExtra = '' } = {}) {
  if (state.productsStatus === 'loading' && !state.products.length) return skeletons(4);
  if (state.productsStatus === 'error' && !state.products.length) {
    return emptyState('fa-wifi', tt('loadingFailed'), html`<button type="button" class="btn btn-glass btn-sm" data-action="retry-catalogue">${tt('retry')}</button>`);
  }
  if (!state.products.length) {
    return emptyState('fa-shirt', tt('noProducts'), state.user ? '' : html`<button type="button" class="link-btn" data-action="open-login">${tt('noProductsDesigner')}</button>`);
  }
  if (!list.length) return emptyState('fa-magnifying-glass', emptyText, emptyExtra);
  return html`${list.map(productCard)}`;
}

function matches(p, f) {
  const q = f.q.trim().toLowerCase();
  const catOk = f.cat === 'all' || p.category === f.cat || (f.cat === 'collab' && p.badge === 'collab');
  if (!catOk) return false;
  if (!q) return true;
  return [p.name, designerNameOf(p), p.description].some((v) => String(v || '').toLowerCase().includes(q));
}
function sorted(list, sort) {
  const out = [...list];
  if (sort === 'low') out.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sort === 'high') out.sort((a, b) => (b.price || 0) - (a.price || 0));
  return out;
}

function renderChips(scope) {
  const group = $(`[data-chip-group="${scope}"]`);
  if (!group) return;
  const present = new Set(state.products.map((p) => p.category));
  const cats = [...BASE_CATS, ...['pants', 'accessory'].filter((c) => present.has(c)), 'collab'];
  setHTML(group, html`${cats.map((c) => html`<button type="button" class="chip-btn${filters[scope].cat === c ? ' on' : ''}" data-action="set-cat" data-scope="${scope}" data-cat="${c}" aria-pressed="${filters[scope].cat === c}">${tt(CAT_KEY[c])}</button>`)}`);
}

export function renderHome() {
  const P = state.products;
  const trending = P.filter((p) => p.badge === 'trending' || p.badge === 'hot').slice(0, 4);
  const fresh = P.filter((p) => p.badge === 'new').slice(0, 4);
  setHTML(byId('grid-trending'), gridContent(trending.length ? trending : P.slice(0, 4)));
  setHTML(byId('grid-new'), gridContent(fresh.length ? fresh : P.slice(4, 8).length ? P.slice(4, 8) : P.slice(0, 4)));
  renderChips('home');
  setHTML(byId('grid-home-all'), gridContent(P.filter((p) => matches(p, filters.home))));
  renderAds();
}
export function renderShop() {
  renderChips('shop');
  setHTML(byId('grid-shop'), gridContent(sorted(state.products.filter((p) => matches(p, filters.shop)), filters.shop.sort)));
}
export function renderWishlistGrid(target) {
  const list = state.products.filter((p) => state.wishlist.includes(p.id));
  if (!state.wishlist.length || (state.productsStatus === 'ready' && !list.length)) {
    setHTML(target, emptyState('fa-heart', tt('emptyWish'), html`<a class="btn btn-glass btn-sm" href="#/shop">${tt('startShopping')}</a>`));
  } else setHTML(target, gridContent(list));
}

const onSearch = debounce((scope, value) => {
  filters[scope].q = value;
  if (scope === 'home') setHTML(byId('grid-home-all'), gridContent(state.products.filter((p) => matches(p, filters.home))));
  else renderShop();
}, 150);

export function initFilterInputs() {
  $$('[data-filter-input]').forEach((input) => input.addEventListener('input', () => onSearch(input.dataset.filterInput, input.value)));
  $('[data-sort]')?.addEventListener('change', (e) => { filters.shop.sort = e.target.value; renderShop(); });
  byId('designer-search')?.addEventListener('input', debounce(() => renderDesignerGrid(), 150));
}
/** Used by "see this designer's work" links. */
export function searchShopFor(text) {
  filters.shop.q = text;
  const input = $('[data-filter-input="shop"]');
  if (input) input.value = text;
}

// ═══════════ product detail ═══════════
let viewing = null;
function openProduct(id) {
  const p = productById(id);
  if (!p) { toast(tt('unavailable'), 'error'); return; }
  viewing = { id, size: '', color: 0 };
  const colors = (Array.isArray(p.colors) ? p.colors : []).filter((c) => c && c.name);
  const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes.filter((s) => SIZES.includes(s)) : SIZES;
  const fav = state.wishlist.includes(p.id);
  const main = imgOf(p) || placeholderImg(p.name);
  const stock = Number(p.stock) || 0;
  setHTML(byId('product-detail'), html`<div class="pd">
    <div class="pd-media">
      <div class="segmented small pd-views" role="tablist">
        <button type="button" class="on" data-action="pd-view" data-view="2d" aria-pressed="true">${tt('view2d')}</button>
        <button type="button" data-action="pd-view" data-view="3d" aria-pressed="false">${tt('view3d')}</button>
      </div>
      <div class="pd-stage" id="pd-stage"><img id="pd-img" src="${main}" data-fallback="${p.name}" alt="${p.name}" draggable="false" /></div>
      <p class="pd-hint muted" id="pd-hint" hidden><i class="fas fa-arrows-left-right"></i> ${tt('dragRotate')}</p>
    </div>
    <div class="pd-info">
      <div class="pd-designer">${p.designerId
        ? html`<a href="#/designer/${encodeURIComponent(p.designerId)}">${tt('by', { name: designerNameOf(p) })}</a>`
        : tt('by', { name: designerNameOf(p) })}</div>
      <h2 class="pd-name">${p.name}</h2>
      <div class="pd-price">${price(p.price)}</div>
      <p class="pd-desc muted">${p.description || tt('premiumQuality')}</p>
      ${colors.length ? html`<div class="opt-label">${tt('color')} · <span id="pd-color-name">${colors[0].name}</span></div>
        <div class="swatches">${colors.map((c, i) => html`<button type="button" class="swatch${i === 0 ? ' on' : ''}" style="--sw:${safeHex(c.hex)}" data-action="pd-color" data-index="${i}" aria-label="${c.name}" aria-pressed="${i === 0}"></button>`)}</div>` : ''}
      <div class="opt-label">${tt('size')}</div>
      <div class="sizes" id="pd-sizes">${sizes.map((s) => html`<button type="button" class="size" data-action="pd-size" data-size="${s}" aria-pressed="false">${s}</button>`)}</div>
      ${stock > 0 && stock <= 5 ? html`<p class="stock-note">${tt('onlyLeft', { n: stock })}</p>` : ''}
      <button type="button" class="btn btn-primary btn-block" data-action="pd-add"><i class="fas fa-bag-shopping"></i> ${tt('addToCart')}</button>
      <button type="button" class="btn btn-glass btn-block" data-action="toggle-wish" data-id="${p.id}" aria-pressed="${fav}"><i class="${fav ? 'fas' : 'far'} fa-heart"></i> ${tt(fav ? 'removeWish' : 'addToWish')}</button>
    </div>
  </div>`);
  openOverlay('m-product');
  init3D();
}

function init3D() {
  const stage = byId('pd-stage'), img = byId('pd-img');
  if (!stage || !img) return;
  let dragging = false, startX = 0;
  const set = (deg) => { img.style.transform = `perspective(900px) rotateY(${deg}deg) scale(1.02)`; };
  stage.addEventListener('pointerdown', (e) => {
    if (!stage.classList.contains('is-3d')) return;
    dragging = true; startX = e.clientX; stage.setPointerCapture(e.pointerId); stage.classList.add('grabbing');
  });
  stage.addEventListener('pointermove', (e) => { if (dragging) set(Math.max(-38, Math.min(38, (e.clientX - startX) / 3))); });
  const end = () => { if (!dragging) return; dragging = false; stage.classList.remove('grabbing'); set(0); };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
}

// ═══════════ cart ═══════════
function addToCart(p, size, color) {
  const line = { id: p.id, qty: 1, size: size || '', color: color || '' };
  line.key = lineKey(line);
  const existing = state.cart.find((c) => c.key === line.key);
  const stock = Number(p.stock) || 0;
  if (existing) existing.qty = stock > 0 ? Math.min(stock, existing.qty + 1) : existing.qty + 1;
  else state.cart.push(line);
  saveCart();
  const opts = [size, color].filter(Boolean).join(' / ');
  toast(tt('addedToCart', { name: p.name + (opts ? ` (${opts})` : '') }), 'success');
}

export function cartLines() {
  return state.cart.map((line) => ({ line, p: productById(line.id) }));
}
export function cartCount() { return state.cart.reduce((a, c) => a + (Number(c.qty) || 0), 0); }

export function renderCart() {
  const lines = cartLines();
  const box = byId('cart-lines');
  if (!box) return;
  if (!lines.length) {
    setHTML(box, emptyState('fa-bag-shopping', tt('cartEmpty'), html`<a class="btn btn-glass btn-sm" href="#/shop">${tt('browseShop')}</a>`));
  } else {
    const loading = state.productsStatus !== 'ready';
    setHTML(box, html`${lines.map(({ line, p }) => {
      const opts = [line.size, line.color].filter(Boolean).join(' / ');
      if (!p) {
        return html`<div class="cart-line muted-line">
          <div class="cart-thumb"></div>
          <div class="cart-info"><div class="cart-name">${loading ? tt('loading') : tt('unavailable')}</div><div class="muted small">${opts}</div></div>
          <button type="button" class="icon-btn small" data-action="cart-remove" data-key="${line.key}" aria-label="${tt('remove')}"><i class="fas fa-trash"></i></button>
        </div>`;
      }
      const color = (p.colors || []).find((c) => c?.name === line.color);
      const photo = safeImg(color?.img) || imgOf(p) || placeholderImg(p.name);
      return html`<div class="cart-line">
        <img class="cart-thumb" src="${photo}" data-fallback="${p.name}" alt="" loading="lazy" />
        <div class="cart-info">
          <div class="cart-name">${p.name}</div>
          <div class="muted small">${opts ? opts + ' · ' : ''}${tt('each', { price: price(p.price) })}</div>
          <div class="stepper">
            <button type="button" data-action="cart-dec" data-key="${line.key}" aria-label="−"><i class="fas fa-minus"></i></button>
            <span aria-live="polite">${line.qty}</span>
            <button type="button" data-action="cart-inc" data-key="${line.key}" aria-label="+"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <div class="cart-end">
          <strong>${iqd(lineIQD(p.price, line.qty))}</strong>
          <button type="button" class="icon-btn small" data-action="cart-remove" data-key="${line.key}" aria-label="${tt('remove')}"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    })}`);
  }
  const total = lines.reduce((a, { line, p }) => a + (p ? lineIQD(p.price, line.qty) : 0), 0);
  byId('cart-total').textContent = iqd(total);
}

// ═══════════ checkout ═══════════
let pendingOrderId = '';
function startCheckout() {
  if (!state.user) {
    closeOverlay('cart');
    emit('need-login', 'signInToOrder');
    return;
  }
  if (state.productsStatus === 'ready') {
    const before = state.cart.length;
    state.cart = state.cart.filter((c) => productById(c.id));
    if (state.cart.length !== before) { saveCart(); toast(tt('cartRemovedItems')); }
  }
  const lines = cartLines().filter((l) => l.p);
  if (!lines.length) { toast(tt('cartIsEmpty'), 'error'); return; }
  pendingOrderId = randomId('NX-', 8);
  byId('co-order-id').textContent = pendingOrderId;
  const form = $('form[data-submit="checkout"]');
  if (!form.name.value) form.name.value = state.user.name || '';
  if (!form.phone.value) form.phone.value = state.user.phone || '';
  setHTML(byId('co-summary'), html`${lines.map(({ line, p }) => {
    const opts = [line.size, line.color].filter(Boolean).join(' / ');
    return html`<div class="sum-line"><span>${p.name}${opts ? ` (${opts})` : ''} × ${line.qty}</span><span>${iqd(lineIQD(p.price, line.qty))}</span></div>`;
  })}`);
  byId('co-total').textContent = iqd(lines.reduce((a, { line, p }) => a + lineIQD(p.price, line.qty), 0));
  closeOverlay('cart');
  setTimeout(() => openOverlay('m-checkout'), 120);
}

async function placeOrder(form, btn) {
  const name = clampStr(form.name.value, 100);
  const phone = clampStr(form.phone.value, 30);
  const location = clampStr(form.location.value, 300);
  const note = clampStr(form.note.value, 500);
  const paymentMethod = form.payment.value || 'Cash';
  if (!name || !location) { toast(tt('fillRequired'), 'error'); return; }
  const digits = normalizePhone(phone).replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) { toast(tt('badPhone'), 'error'); form.phone.focus(); return; }
  const lines = cartLines().filter((l) => l.p);
  if (!lines.length) { toast(tt('cartIsEmpty'), 'error'); return; }
  if (!fb || !state.user) { toast(tt('errNetwork'), 'error'); return; }

  const items = lines.map(({ line, p }) => ({
    id: p.id, name: String(p.name).slice(0, 120), price: Number(p.price) || 0, qty: line.qty,
    size: line.size || '', color: line.color || '', designerId: p.designerId || '',
  }));
  const designerIds = [...new Set(items.map((i) => i.designerId).filter(Boolean))].slice(0, 50);
  const total = Math.round(items.reduce((a, i) => a + i.price * i.qty, 0) * 100) / 100;
  const totalIQD = items.reduce((a, i) => a + lineIQD(i.price, i.qty), 0);
  const order = {
    orderId: pendingOrderId || randomId('NX-', 8), userId: state.user.uid, customerName: name, phone, location,
    paymentMethod, items, designerIds, total, totalIQD, status: 'pending', createdAt: fb.serverTimestamp(),
  };
  if (note) order.note = note;

  await withBusy(btn, async () => {
    let queued = false;
    try {
      const ref = fb.doc(fb.collection(fb.db, 'orders'));
      // A write waits for the server; if we're offline it stays queued on the device and syncs later.
      await withTimeout(fb.setDoc(ref, order), 12000).catch((e) => {
        if (e?.code === 'timeout') { queued = true; return; }
        throw e;
      });
    } catch (e) { fail(e, 'orderFailed'); return; }

    if (!state.user.phone && phone) fb.updateDoc(fb.doc(fb.db, 'users', state.user.uid), { phone }).then(() => { state.user.phone = phone; }).catch(() => {});
    const ordered = new Set(lines.map((l) => l.line.key));
    state.cart = state.cart.filter((c) => !ordered.has(c.key));
    saveCart();
    form.reset();
    byId('done-order-id').textContent = order.orderId;
    byId('order-done-sub').textContent = queued ? tt('orderQueued') : tt('orderPlacedSub');
    byId('done-whatsapp').href = whatsappUrl(orderMessage({ ...order, items }));
    closeOverlay('m-checkout');
    setTimeout(() => openOverlay('m-order-done'), 150);
  });
}

function orderMessage(o) {
  const lines = [
    '🛍️ *New Naxshin Order*', `Order ID: ${o.orderId}`, `Name: ${o.customerName}`, `Phone: ${o.phone}`,
    `Location: ${o.location}`, `Payment: ${o.paymentMethod}`, '', 'Items:',
    ...o.items.map((i) => `• ${i.name}${[i.size, i.color].filter(Boolean).length ? ` (${[i.size, i.color].filter(Boolean).join(' / ')})` : ''} ×${i.qty} — ${formatIQDAmount(lineIQD(i.price, i.qty))}`),
    '', `Total: ${formatIQDAmount(o.totalIQD)}`,
  ];
  if (o.note) lines.push('', `Note: ${o.note}`);
  return lines.join('\n');
}
export const whatsappUrl = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// ═══════════ designers ═══════════
let designersLoadedAt = 0;
export async function loadDesigners(force = false) {
  if (!fb) throw Object.assign(new Error('offline'), { code: 'unavailable' });
  if (!force && state.designers && Date.now() - designersLoadedAt < 60000) return state.designers;
  const [dSnap, rSnap] = await Promise.all([
    fb.getDocs(fb.collection(fb.db, 'designers')),
    fb.getDocs(fb.collection(fb.db, 'ratings')).catch(() => null),
  ]);
  state.designers = dSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  state.ratings = aggregateRatings(rSnap ? rSnap.docs.map((d) => ({ id: d.id, ...d.data() })) : []);
  designersLoadedAt = Date.now();
  emit('designers');
  return state.designers;
}
function aggregateRatings(list) {
  // one rating per person per designer (older versions could store duplicates)
  const latest = new Map();
  for (const r of list) {
    if (!r.designerId || !r.raterId || !(r.stars >= 1 && r.stars <= 5)) continue;
    const k = r.designerId + '_' + r.raterId;
    const prev = latest.get(k);
    if (!prev || millis(r.updatedAt || r.createdAt) >= millis(prev.updatedAt || prev.createdAt)) latest.set(k, r);
  }
  const out = {};
  for (const r of latest.values()) {
    const a = (out[r.designerId] ||= { sum: 0, count: 0, mine: 0 });
    a.sum += r.stars; a.count += 1;
    if (state.user && r.raterId === state.user.uid) a.mine = r.stars;
  }
  return out;
}
const ratingOf = (id) => { const r = state.ratings?.[id]; return r ? { avg: r.sum / r.count, count: r.count, mine: r.mine } : { avg: 0, count: 0, mine: 0 }; };

function stars(avg, count) {
  const full = Math.round(avg * 2) / 2;
  return html`<span class="stars" aria-label="${avg ? avg.toFixed(1) : tt('ratingNew')}">${[1, 2, 3, 4, 5].map((i) => html`<i class="${i <= full ? 'fas fa-star' : i - 0.5 === full ? 'fas fa-star-half-stroke' : 'far fa-star'}"></i>`)}<span class="stars-val">${avg ? avg.toFixed(1) : tt('ratingNew')}${count ? ` (${count})` : ''}</span></span>`;
}
const activeCount = (designerId) => state.products.filter((p) => p.designerId === designerId).length;
const avatarOf = (d, cls = 'avatar') => {
  const src = safeImg(d?.photoURL);
  return src ? html`<span class="${cls}"><img src="${src}" alt="" loading="lazy" /></span>` : html`<span class="${cls}">${String(d?.name || 'N').charAt(0).toUpperCase()}</span>`;
};

export async function renderDesigners() {
  const grid = byId('grid-designers');
  if (!state.designers) setHTML(grid, html`<div class="loading-row"><i class="fas fa-spinner fa-spin"></i> ${tt('loading')}</div>`);
  try { await loadDesigners(); renderDesignerGrid(); }
  catch (e) {
    console.error(e);
    setHTML(grid, emptyState('fa-wifi', tt('loadingFailed'), html`<button type="button" class="btn btn-glass btn-sm" data-action="retry-designers">${tt('retry')}</button>`));
  }
}
function renderDesignerGrid() {
  const grid = byId('grid-designers');
  if (!grid || !state.designers) return;
  const q = (byId('designer-search')?.value || '').trim().toLowerCase();
  const list = state.designers.filter((d) => !q || String(d.name).toLowerCase().includes(q));
  if (!state.designers.length) { setHTML(grid, emptyState('fa-palette', tt('noDesigners'))); return; }
  if (!list.length) { setHTML(grid, emptyState('fa-magnifying-glass', tt('noResults'))); return; }
  setHTML(grid, html`${list.map((d) => {
    const r = ratingOf(d.id), n = activeCount(d.id);
    return html`<a class="dcard glass-card" href="#/designer/${encodeURIComponent(d.id)}">
      ${avatarOf(d, 'avatar avatar-lg')}
      <div class="dcard-body">
        <div class="dcard-name">${d.name}</div>
        ${stars(r.avg, r.count)}
        <div class="muted small">${n === 1 ? tt('oneDesign') : tt('activeDesigns', { n })}</div>
        <p class="dcard-bio muted">${String(d.bio || '').slice(0, 90) || tt('tapProfile')}</p>
      </div>
      <i class="fas fa-chevron-right flip-rtl dcard-go" aria-hidden="true"></i>
    </a>`;
  })}`);
}

export async function renderDesignerProfile(id) {
  const box = byId('designer-profile');
  setHTML(box, html`<div class="loading-row"><i class="fas fa-spinner fa-spin"></i> ${tt('loading')}</div>`);
  try {
    await loadDesigners();
    let d = state.designers.find((x) => x.id === id);
    if (!d && fb) { const snap = await fb.getDoc(fb.doc(fb.db, 'designers', id)); if (snap.exists()) d = { id, ...snap.data() }; }
    if (!d) { setHTML(box, emptyState('fa-user-slash', tt('designerNotFound'))); return; }
    const r = ratingOf(id);
    const products = state.products.filter((p) => p.designerId === id);
    const canRate = state.user && state.user.uid !== id;
    setHTML(box, html`<div class="designer-hero">
        ${avatarOf(d, 'avatar avatar-xl')}
        <div><h1 class="designer-name">${d.name}</h1>
          <span class="chip chip-on-dark">${tt('designerBadge')}</span>
          <div id="designer-rating">${stars(r.avg, r.count)}</div>
          <p class="designer-bio">${d.bio || tt('noBio')}</p></div>
      </div>
      ${canRate ? html`<div class="glass-card pad rate-card"><h2 class="card-title">${tt('rateDesigner')}</h2>
        <div class="rate-picker" role="radiogroup" aria-label="${tt('rateDesigner')}">${[1, 2, 3, 4, 5].map((i) => html`<button type="button" data-action="rate" data-id="${id}" data-stars="${i}" aria-label="${i}" aria-pressed="${i <= r.mine}"><i class="${i <= r.mine ? 'fas' : 'far'} fa-star"></i></button>`)}</div></div>`
        : !state.user ? html`<div class="glass-card pad rate-card"><button type="button" class="link-btn" data-action="open-login">${tt('rateSignIn')}</button></div>` : ''}
      <div class="section-head"><h2 class="section-title">${trusted(t('designsCount', { n: products.length }))}</h2></div>
      <div class="product-grid">${products.length ? products.map(productCard) : emptyState('fa-shirt', tt('noActiveDesigns'))}</div>`);
  } catch (e) {
    console.error(e);
    setHTML(box, emptyState('fa-wifi', tt('loadingFailed'), html`<button type="button" class="btn btn-glass btn-sm" data-action="retry-route">${tt('retry')}</button>`));
  }
}

async function rate(designerId, starsN) {
  if (!state.user) { emit('need-login', 'rateSignIn'); return; }
  if (state.user.uid === designerId) { toast(tt('rateOwn'), 'error'); return; }
  try {
    const myId = `${designerId}_${state.user.uid}`;
    await fb.setDoc(fb.doc(fb.db, 'ratings', myId), {
      designerId, raterId: state.user.uid, raterName: String(state.user.name || '').slice(0, 100), stars: starsN, updatedAt: fb.serverTimestamp(),
    });
    // tidy up duplicates saved by the old version of the site
    const old = await fb.getDocs(fb.query(fb.collection(fb.db, 'ratings'), fb.where('designerId', '==', designerId), fb.where('raterId', '==', state.user.uid)));
    await Promise.all(old.docs.filter((d) => d.id !== myId).map((d) => fb.deleteDoc(d.ref).catch(() => {})));
    toast(tt('ratingSaved'), 'success');
    await loadDesigners(true);
    if (state.route.page === 'designer') renderDesignerProfile(designerId);
  } catch (e) { fail(e); }
}

// ═══════════ ads carousel ═══════════
const carousel = { index: 0, timer: null };
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/** The picture/video of one ad. `inSlide` = small muted background version for the carousel. */
function adMediaHTML(a, inSlide) {
  const m = adMediaOf(a);
  if (!m) return html`<img src="${placeholderImg(a.advertiser)}" alt="" />`;
  if (m.kind === 'youtube') {
    return inSlide
      ? html`<img class="ad-poster" src="${m.poster}" alt="" loading="lazy" /><iframe class="ad-yt" data-src="${m.src}" title="${a.advertiser || tt('ad')}" tabindex="-1" aria-hidden="true" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
      : html`<iframe src="${m.full}" title="${a.advertiser || tt('ad')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }
  if (m.kind === 'stored') {
    return inSlide
      ? html`${m.poster ? html`<img class="ad-poster" src="${m.poster}" alt="" loading="lazy" />` : ''}<video class="ad-stored" data-ad-id="${a.id}" muted playsinline preload="none" aria-hidden="true"></video>`
      : html`<video class="ad-stored" data-ad-id="${a.id}" ${m.poster ? html`poster="${m.poster}"` : ''} autoplay muted loop playsinline controls></video>`;
  }
  if (m.kind === 'video') {
    return inSlide
      ? html`<video src="${m.src}" muted playsinline preload="metadata" aria-hidden="true"></video>`
      : html`<video src="${m.src}" autoplay muted loop playsinline controls></video>`;
  }
  // Old ads saved without a type may be a video link without a file ending: try it as a video if the photo fails.
  return html`<img src="${m.src}" alt="" loading="lazy" ${m.guessed && m.src.startsWith('https://') ? trusted('data-maybe-video') : ''} />`;
}
/** Uploaded videos are kept in pieces; join them once per visit (the device keeps a copy). */
const storedVideos = new Map();
export function storedVideoURL(a) {
  const m = adMediaOf(a);
  if (m?.kind !== 'stored') return Promise.reject(new Error('not a stored video'));
  const key = `${a.id}:${m.ver}`;
  if (!storedVideos.has(key)) {
    storedVideos.set(key, (async () => {
      const q = fb.query(fb.collection(fb.db, 'ads', a.id, 'parts'), fb.where('v', '==', m.ver));
      let snap = null;
      try { snap = await fb.getDocsFromCache(q); } catch { /* not on this device yet */ }
      if (!snap || snap.size !== m.parts) snap = await fb.getDocs(q);
      if (snap.size !== m.parts) throw new Error('video pieces missing');
      const pieces = snap.docs.map((d) => d.data()).sort((x, y) => x.i - y.i).map((d) => d.b.toUint8Array());
      return URL.createObjectURL(new Blob(pieces, { type: m.mime }));
    })().catch((e) => { storedVideos.delete(key); throw e; }));
  }
  return storedVideos.get(key);
}
function fillStoredVideo(v, a, play) {
  if (!v || v.getAttribute('src') || v.dataset.loading) return;
  v.dataset.loading = '1';
  storedVideoURL(a).then((url) => {
    delete v.dataset.loading;
    v.src = url;
    if (play()) v.play().catch(() => {});
  }).catch((e) => { delete v.dataset.loading; console.warn('ad video', e); v.dispatchEvent(new Event('error')); });
}
/** Broken ad media: photo → try as video → soft placeholder. */
function wireAdMediaFallback(root) {
  root.addEventListener('error', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement) || el.dataset.failed) return;
    const name = el.closest('[data-name]')?.dataset.name || '';
    el.dataset.failed = '1';
    if (el.tagName === 'IMG' && 'maybeVideo' in el.dataset) {
      const v = document.createElement('video');
      Object.assign(v, { muted: true, playsInline: true, preload: 'metadata', src: el.src });
      v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      el.replaceWith(v);
      if (el.closest('.ad-slide.on')) playVisibleVideo();
    } else if (el.tagName === 'VIDEO' || (el.tagName === 'IMG' && !el.classList.contains('ad-poster'))) {
      const img = document.createElement('img');
      img.alt = ''; img.dataset.failed = '1'; img.src = placeholderImg(name);
      el.replaceWith(img);
    }
  }, true);
}
export function renderAds() {
  const block = byId('ads-block'), stage = byId('ad-stage');
  if (!block || !stage) return;
  block.hidden = false;
  clearTimeout(carousel.timer);
  const ads = state.ads;
  if (!ads.length) {
    setHTML(stage, html`<div class="ad-empty"><i class="fas fa-bullhorn"></i><p>${tt('advertiseHere')}</p></div>`);
    stage.dataset.action = 'open-partner';
    return;
  }
  delete stage.dataset.action;
  carousel.index = Math.min(carousel.index, ads.length - 1);
  setHTML(stage, html`<div class="ad-track" id="ad-track">${ads.map((a, i) => html`<div class="ad-slide${i === carousel.index ? ' on' : ''}" data-name="${a.advertiser || ''}">
      <div class="ad-media">${adMediaHTML(a, true)}</div>
      <button type="button" class="ad-hit" data-action="open-ad" data-index="${i}" aria-label="${a.advertiser || tt('ad')}" ${i === carousel.index ? '' : trusted('tabindex="-1"')}>
        <span class="ad-caption"><strong>${a.advertiser || ''}</strong>${a.text ? html`<span>${String(a.text).slice(0, 80)}</span>` : ''}</span>
      </button>
    </div>`)}</div>
    ${ads.length > 1 ? html`<button type="button" class="ad-arrow prev" data-action="ad-step" data-step="-1" aria-label="‹"><i class="fas fa-chevron-left flip-rtl"></i></button>
      <button type="button" class="ad-arrow next" data-action="ad-step" data-step="1" aria-label="›"><i class="fas fa-chevron-right flip-rtl"></i></button>
      <div class="ad-dots">${ads.map((_, i) => html`<button type="button" class="dot${i === carousel.index ? ' on' : ''}" data-action="ad-go" data-index="${i}" aria-label="${i + 1}"></button>`)}</div>` : ''}`);
  playVisibleVideo();
  armCarousel();
}
/** Only the visible slide plays; YouTube frames load only while shown. */
function playVisibleVideo() {
  const many = state.ads.length > 1;
  $$('#ad-track .ad-slide').forEach((s, i) => {
    const on = i === carousel.index;
    const v = s.querySelector('video');
    if (v?.classList.contains('ad-stored') && on) {
      const a = state.ads.find((x) => x.id === v.dataset.adId);
      if (a) fillStoredVideo(v, a, () => s.classList.contains('on'));
    }
    if (v) {
      v.loop = !many;
      v.onended = on && many ? () => goAd(carousel.index + 1) : null;
      if (on) { if (v.getAttribute('src')) { v.currentTime = 0; v.play().catch(() => {}); } } else v.pause();
    }
    const f = s.querySelector('iframe.ad-yt');
    if (f) {
      if (on && !reducedMotion()) { if (!f.getAttribute('src')) f.src = f.dataset.src; }
      else if (f.getAttribute('src')) f.removeAttribute('src');
    }
  });
}
function goAd(i) {
  const n = state.ads.length;
  if (!n) return;
  carousel.index = ((i % n) + n) % n;
  $$('#ad-track .ad-slide').forEach((s, k) => {
    s.classList.toggle('on', k === carousel.index);
    const hit = s.querySelector('.ad-hit'); if (hit) hit.tabIndex = k === carousel.index ? 0 : -1;
  });
  $$('#ad-stage .dot').forEach((d, k) => d.classList.toggle('on', k === carousel.index));
  playVisibleVideo();
  armCarousel();
}
/** Photos stay 6 s; videos play to the end (up to 1 min); YouTube gets 20 s. */
function armCarousel() {
  clearTimeout(carousel.timer);
  if (state.ads.length < 2 || reducedMotion()) return;
  const kind = adMediaOf(state.ads[carousel.index])?.kind;
  const ms = kind === 'video' || kind === 'stored' ? 60000 : kind === 'youtube' ? 20000 : 6000;
  carousel.timer = setTimeout(() => {
    if (document.hidden || state.route.page !== 'home') armCarousel();
    else goAd(carousel.index + 1);
  }, ms);
}
function initAdSwipe() {
  const stage = byId('ad-stage');
  if (!stage) return;
  let x0 = null;
  stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  stage.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { const rtl = document.dir === 'rtl'; goAd(carousel.index + ((dx < 0) !== rtl ? 1 : -1)); e.preventDefault(); stage.dataset.swiped = '1'; setTimeout(() => delete stage.dataset.swiped, 50); }
  });
}
function openAd(i) {
  if (byId('ad-stage')?.dataset.swiped) return;
  const a = state.ads[i];
  if (!a) return;
  const link = safeLink(a.link);
  const dlg = openDialog(html`<div class="ad-detail">
    <div class="ad-detail-media">${adMediaHTML(a, false)}</div>
    <h2 class="modal-title">${a.advertiser || tt('ad')}</h2>
    <p class="muted">${a.text || tt('adNoDesc')}</p>
    ${link ? html`<a class="btn btn-primary btn-block" href="${link}" target="_blank" rel="noopener noreferrer sponsored"><i class="fas fa-arrow-up-right-from-square"></i> ${tt('visit')}</a>` : ''}
  </div>`, { label: a.advertiser || tt('ad') });
  const v = dlg?.body?.querySelector('video.ad-stored');
  if (v) fillStoredVideo(v, a, () => v.isConnected);
}

// ═══════════ wiring ═══════════
export function initShop() {
  initFilterInputs();
  initAdSwipe();
  const adStage = byId('ad-stage'); if (adStage) wireAdMediaFallback(adStage);
  on('products', () => { if (isOpen('cart')) renderCart(); });
  on('cart', renderCart);
  on('wishlist', () => {
    $$('.pcard-fav').forEach((b) => {
      const fav = state.wishlist.includes(b.dataset.id);
      b.classList.toggle('on', fav); b.setAttribute('aria-pressed', fav);
      b.setAttribute('aria-label', tt(fav ? 'removeWish' : 'addToWish'));
      setHTML(b, html`<i class="${fav ? 'fas' : 'far'} fa-heart"></i>`);
    });
  });

  registerActions({
    'open-product': (el) => openProduct(el.dataset.id),
    'quick-add': (el) => {
      const p = productById(el.dataset.id);
      if (!p) return;
      const needsChoice = (Array.isArray(p.sizes) ? p.sizes.length : SIZES.length) > 1 || (p.colors || []).length > 1;
      if (needsChoice) openProduct(p.id); else addToCart(p, (p.sizes || [])[0] || '', (p.colors || [])[0]?.name || '');
    },
    'toggle-wish': (el) => {
      const id = el.dataset.id;
      const had = state.wishlist.includes(id);
      state.wishlist = had ? state.wishlist.filter((w) => w !== id) : [...state.wishlist, id];
      saveWishlist();
      toast(tt(had ? 'removedWish' : 'addedWish'), had ? '' : 'success');
      if (el.closest('.pd-info')) {
        el.setAttribute('aria-pressed', !had);
        setHTML(el, html`<i class="${had ? 'far' : 'fas'} fa-heart"></i> ${tt(had ? 'addToWish' : 'removeWish')}`);
      }
      if (state.route.page === 'profile') emit('rerender');
    },
    'set-cat': (el) => {
      const scope = el.dataset.scope;
      filters[scope].cat = el.dataset.cat;
      if (scope === 'home') { renderChips('home'); setHTML(byId('grid-home-all'), gridContent(state.products.filter((p) => matches(p, filters.home)))); }
      else renderShop();
    },
    'retry-catalogue': () => { startCatalogue(); emit('products'); },
    'retry-designers': () => renderDesigners(),
    'pd-view': (el) => {
      const is3d = el.dataset.view === '3d';
      $$('.pd-views button').forEach((b) => { const on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      byId('pd-stage')?.classList.toggle('is-3d', is3d);
      const hint = byId('pd-hint'); if (hint) hint.hidden = !is3d;
    },
    'pd-color': (el) => {
      const p = productById(viewing?.id); if (!p) return;
      const c = (p.colors || [])[Number(el.dataset.index)]; if (!c) return;
      viewing.color = Number(el.dataset.index);
      $$('.swatches .swatch').forEach((s) => { const on = s === el; s.classList.toggle('on', on); s.setAttribute('aria-pressed', on); });
      byId('pd-color-name').textContent = c.name;
      const img = byId('pd-img'); if (img) img.src = safeImg(c.img) || imgOf(p) || placeholderImg(p.name);
    },
    'pd-size': (el) => {
      viewing.size = el.dataset.size;
      $$('#pd-sizes .size').forEach((s) => { const on = s === el; s.classList.toggle('on', on); s.setAttribute('aria-pressed', on); });
      byId('pd-sizes').classList.remove('need');
    },
    'pd-add': () => {
      const p = productById(viewing?.id); if (!p) return;
      if (!viewing.size) { byId('pd-sizes').classList.add('need'); toast(tt('chooseSize'), 'error'); return; }
      const color = (p.colors || [])[viewing.color]?.name || '';
      addToCart(p, viewing.size, color);
      closeOverlay('m-product');
    },
    'open-cart': () => { renderCart(); openOverlay('cart'); },
    'cart-inc': (el) => { const c = state.cart.find((x) => x.key === el.dataset.key); const p = productById(c?.id); if (!c) return; const stock = Number(p?.stock) || 0; c.qty = stock > 0 ? Math.min(stock, c.qty + 1) : c.qty + 1; saveCart(); },
    'cart-dec': (el) => { const c = state.cart.find((x) => x.key === el.dataset.key); if (!c) return; c.qty -= 1; if (c.qty <= 0) state.cart = state.cart.filter((x) => x !== c); saveCart(); },
    'cart-remove': (el) => { state.cart = state.cart.filter((x) => x.key !== el.dataset.key); saveCart(); },
    checkout: () => startCheckout(),
    rate: (el) => rate(el.dataset.id, Number(el.dataset.stars)),
    'open-ad': (el) => openAd(Number(el.dataset.index)),
    'ad-step': (el) => goAd(carousel.index + Number(el.dataset.step)),
    'ad-go': (el) => goAd(Number(el.dataset.index)),
  });
  registerSubmits({ checkout: placeOrder });
  registerChanges({});
}
