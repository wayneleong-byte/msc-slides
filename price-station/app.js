/* Macau Price Station — shared helpers (static mirror only; no live API fetch) */
(function (global) {
  const CART_KEY = 'macau-price-station-cart-v1';
  const IMG = 'https://consumer-api03.dsedt.gov.mo/app/nextmacauprice/images/';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  async function loadJSON(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + path);
    return res.json();
  }

  function money(n) {
    if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
    return 'MOP ' + Number(n).toFixed(1);
  }

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge();
  }

  function addToCart(entry) {
    const cart = getCart();
    const id = String(entry.id);
    const idx = cart.findIndex((x) => String(x.id) === id);
    if (idx >= 0) {
      cart[idx] = Object.assign({}, cart[idx], entry);
    } else {
      cart.push(entry);
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(id) {
    saveCart(getCart().filter((x) => String(x.id) !== String(id)));
  }

  function clearCart() {
    saveCart([]);
  }

  function updateCartBadge() {
    const n = getCart().length;
    $all('[data-cart-count]').forEach((el) => {
      el.textContent = String(n);
      el.hidden = n === 0;
    });
  }

  function flattenStores(groups) {
    const out = [];
    (groups || []).forEach((g) => {
      (g.supermarkets || []).forEach((s) => {
        out.push({
          groupId: g.group_id,
          groupName: g.group_name_cn || g.group_name || '',
          storeId: s.supermarket_id,
          storeName: s.supermarket_name,
          price: s.price == null || s.price === '' ? null : Number(s.price),
          flag: s.flag || ''
        });
      });
    });
    return out;
  }

  function cheapestStore(groups) {
    const stores = flattenStores(groups).filter((s) => s.price != null && !Number.isNaN(s.price));
    if (!stores.length) return null;
    stores.sort((a, b) => a.price - b.price || a.storeName.localeCompare(b.storeName, 'zh-Hant'));
    return stores[0];
  }

  /** One-store checkout: among stores that have price for every priced item, pick lowest sum.
   *  Items without mirror prices are skipped and listed in skipped. */
  function bestSingleStore(cartItems) {
    const priced = (cartItems || []).filter((c) => Array.isArray(c.stores) && c.stores.some((s) => s.price != null));
    const skipped = (cartItems || []).filter((c) => !priced.includes(c));
    if (!priced.length) return { storeName: null, total: null, lines: [], skipped, missingCoverage: [] };

    const storeMap = new Map(); // storeName -> { total, lines, count }
    priced.forEach((item) => {
      const seen = new Set();
      (item.stores || []).forEach((s) => {
        if (s.price == null || Number.isNaN(s.price)) return;
        const key = s.storeName;
        if (seen.has(key)) return;
        seen.add(key);
        if (!storeMap.has(key)) storeMap.set(key, { storeName: key, total: 0, lines: [], count: 0 });
        const row = storeMap.get(key);
        row.total += Number(s.price);
        row.count += 1;
        row.lines.push({ id: item.id, name: item.name, price: Number(s.price) });
      });
    });

    const need = priced.length;
    const full = Array.from(storeMap.values()).filter((r) => r.count === need);
    const pool = full.length ? full : Array.from(storeMap.values());
    pool.sort((a, b) => a.total - b.total || a.storeName.localeCompare(b.storeName, 'zh-Hant'));
    const best = pool[0] || null;
    return {
      storeName: best ? best.storeName : null,
      total: best ? best.total : null,
      lines: best ? best.lines : [],
      skipped,
      missingCoverage: full.length ? [] : priced.filter((p) => !best || !best.lines.some((l) => String(l.id) === String(p.id))),
      partial: !full.length && !!best
    };
  }

  async function loadMeta() {
    try {
      return await loadJSON('data/meta.json');
    } catch (_) {
      return { mirroredAt: '（未知）', sourceNote: '資料來源：消費者委員會' };
    }
  }

  function fillFooter(meta, extraDates) {
    const el = $('#site-footer');
    if (!el) return;
    const bits = [];
    bits.push('<strong>資料來源：消費者委員會</strong>（澳門物價情報站公開資料鏡像；本站非官方網站）');
    if (meta && meta.mirroredAt) bits.push('鏡像時間：' + meta.mirroredAt + '（Asia/Macau）');
    (extraDates || []).forEach((d) => {
      if (d) bits.push(d);
    });
    bits.push('非商業用途；數字以官方更新為準。');
    el.innerHTML = bits.map((b) => '<div>' + b + '</div>').join('');
  }

  function markActiveNav() {
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $all('.nav-bar a').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.MPS = {
    IMG, CART_KEY, $, $all, loadJSON, money, getCart, saveCart, addToCart, removeFromCart,
    clearCart, updateCartBadge, flattenStores, cheapestStore, bestSingleStore, loadMeta,
    fillFooter, markActiveNav, escapeHtml
  };

  document.addEventListener('DOMContentLoaded', () => {
    markActiveNav();
    updateCartBadge();
  });
})(window);
