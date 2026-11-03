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

  function isMarketItem(it) {
    if (!it) return false;
    if (it.kind === 'market') return true;
    return String(it.id || '').indexOf('market:') === 0;
  }

  /** Line price used for cart totals: preferred first, then best, then null. */
  function preferredLinePrice(it) {
    if (!it) return null;
    if (isMarketItem(it)) {
      const n = it.preferredPriceCatty;
      if (n != null && n !== '' && !Number.isNaN(Number(n))) return Number(n);
      return null;
    }
    if (it.preferredPrice != null && it.preferredPrice !== '' && !Number.isNaN(Number(it.preferredPrice))) {
      return Number(it.preferredPrice);
    }
    if (it.bestPrice != null && it.bestPrice !== '' && !Number.isNaN(Number(it.bestPrice))) {
      return Number(it.bestPrice);
    }
    return null;
  }

  function bestPriceOfItem(it) {
    if (!it) return null;
    if (isMarketItem(it)) {
      const period = it.period === 'week' ? 'week' : 'today';
      let min = null;
      (it.markets || []).forEach((m) => {
        const block = m[period] || {};
        const c = block.priceCatty;
        if (c === '' || c == null || Number.isNaN(Number(c))) return;
        const n = Number(c);
        if (min == null || n < min) min = n;
      });
      return min;
    }
    if (it.bestPrice != null && !Number.isNaN(Number(it.bestPrice))) return Number(it.bestPrice);
    const stores = (it.stores || []).filter((s) => s.price != null && !Number.isNaN(s.price));
    if (!stores.length) return null;
    return Math.min.apply(null, stores.map((s) => Number(s.price)));
  }

  /** One-store checkout: supermarket items only (market skipped). */
  function bestSingleStore(cartItems) {
    const all = cartItems || [];
    const marketSkipped = all.filter(isMarketItem);
    const supermarket = all.filter((c) => !isMarketItem(c));
    const priced = supermarket.filter((c) => Array.isArray(c.stores) && c.stores.some((s) => s.price != null));
    const skipped = supermarket.filter((c) => !priced.includes(c)).concat(marketSkipped);
    if (!priced.length) {
      return { storeName: null, total: null, lines: [], skipped, missingCoverage: [], marketSkipped };
    }

    const storeMap = new Map();
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
      marketSkipped,
      missingCoverage: full.length ? [] : priced.filter((p) => !best || !best.lines.some((l) => String(l.id) === String(p.id))),
      partial: !full.length && !!best
    };
  }

  async function loadMeta() {
    try {
      return await loadJSON('data/meta.json');
    } catch (_) {
      return { mirroredAt: '（未知）', sourceNote: '澳門特別行政區政府／消費者委員會「澳門物價情報站」公開資料（Open Data／公開 API 鏡像）；本站非官方；資料僅供參考。' };
    }
  }

  /* fillFooter defined after escapeHtml + date helpers */

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

  function parseLooseDate(s) {
    if (s == null || s === '') return null;
    const str = String(s).trim();
    if (!str || str === '—' || str === '-' || str === '（未知）') return null;
    const m = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (m) {
      const y = Number(m[1]), mo = Number(m[2]) - 1, day = Number(m[3]);
      const d = new Date(y, mo, day);
      if (!Number.isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === mo && d.getDate() === day) {
        return d;
      }
    }
    const iso = Date.parse(str);
    if (!Number.isNaN(iso)) return new Date(iso);
    return null;
  }

  function isStaleUpdate(dateStr, days) {
    const limit = days == null ? 7 : days;
    const d = parseLooseDate(dateStr);
    if (!d) return false;
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = (startToday - startD) / 86400000;
    return diff > limit;
  }

  /** Safe HTML for a labelled update date; adds .stale-update when >7 calendar days old. */
  function wrapUpdateHtml(label, dateStr) {
    const safeLabel = escapeHtml(label == null ? '' : label);
    const raw = (dateStr == null || dateStr === '') ? '' : String(dateStr);
    const display = raw || '—';
    const safeDate = escapeHtml(display);
    const stale = raw ? isStaleUpdate(raw) : false;
    const prefix = safeLabel ? safeLabel + '：' : '';
    if (stale) {
      return prefix + '<span class="stale-update" title="超過一星期未更新">' + safeDate +
        '</span> <span class="badge stale-update">過期</span>';
    }
    return prefix + safeDate;
  }

  function fillFooter(meta, extraDates) {
    const el = $('#site-footer');
    if (!el) return;
    const bits = [];
    const note = (meta && meta.sourceNote) ||
      '澳門特別行政區政府／消費者委員會「澳門物價情報站」公開資料（Open Data／公開 API 鏡像）；本站非官方；資料僅供參考。';
    bits.push('<strong>資料來源</strong>：' + note);
    if (meta && meta.mirroredAt) {
      bits.push(wrapUpdateHtml('鏡像時間', meta.mirroredAt) + '（Asia/Macau）');
    }
    (extraDates || []).forEach((d) => {
      if (d) bits.push(d);
    });
    bits.push('非商業用途；數字以官方更新為準，僅供參考。');
    el.innerHTML = bits.map((b) => '<div>' + b + '</div>').join('');
  }


  const LEAFLET_SCODE = {
    royal: '0101',
    taifung: '0104',
    sanmiu: '0102',
    sunsco: '0103',
    namkwong: '0121'
  };

  /** Resolve promo scode from string, leaflet store object, or alias id. */
  function resolvePromoScode(ref) {
    if (ref == null || ref === '') return null;
    if (typeof ref === 'string' || typeof ref === 'number') {
      const s = String(ref).trim();
      if (/^\d{4}$/.test(s)) return s;
      if (LEAFLET_SCODE[s]) return LEAFLET_SCODE[s];
      return null;
    }
    if (typeof ref === 'object') {
      if (ref.scode != null && String(ref.scode).trim() !== '') return String(ref.scode).trim();
      if (ref.id && LEAFLET_SCODE[ref.id]) return LEAFLET_SCODE[ref.id];
      if (ref.leafletStoreId && LEAFLET_SCODE[ref.leafletStoreId]) return LEAFLET_SCODE[ref.leafletStoreId];
    }
    return null;
  }

  /** Look up store-branches entry by scode, leaflet id, or alias (t546 array schema + legacy dict). */
  function storeBranchEntry(storeBranches, scodeOrAlias) {
    if (!storeBranches || scodeOrAlias == null || scodeOrAlias === '') return null;
    const key = String(scodeOrAlias);
    const raw = storeBranches.stores;
    if (Array.isArray(raw)) {
      let hit = raw.find((s) => s && (s.id === key || String(s.scode) === key || String(s.groupId) === key));
      if (hit) return hit;
      const mapped = (LEAFLET_SCODE[key] || (storeBranches.aliases && storeBranches.aliases[key]));
      if (mapped) {
        hit = raw.find((s) => s && (String(s.scode) === String(mapped) || String(s.groupId) === String(mapped) || s.id === key));
        if (hit) return hit;
      }
      const resolved = resolvePromoScode(key);
      if (resolved) {
        hit = raw.find((s) => s && (String(s.scode) === resolved || String(s.groupId) === resolved));
        if (hit) return hit;
      }
      return null;
    }
    const stores = raw || {};
    if (stores[key]) return stores[key];
    const aliases = storeBranches.aliases || LEAFLET_SCODE;
    const mapped = aliases[key];
    if (mapped && stores[mapped]) return stores[mapped];
    const resolved = resolvePromoScode(key);
    if (resolved && stores[resolved]) return stores[resolved];
    return null;
  }

  function pickDefaultBranch(entry) {
    const branches = (entry && entry.branches) || [];
    return branches.length ? branches[0] : null;
  }

  /** Attach preferredBranch / branchId / branches onto a cart entry. */
  function withPromoBranch(entry, branchEntry, selected) {
    const out = Object.assign({}, entry || {});
    const branches = ((branchEntry && branchEntry.branches) || []).map((b) => ({
      id: String(b.id),
      name: String(b.name || '')
    }));
    out.branches = branches;
    if (branchEntry && branchEntry.scode) out.scode = String(branchEntry.scode);
    let sel = selected || null;
    if (!sel && branches.length) sel = branches[0];
    if (sel) {
      out.branchId = String(sel.id != null ? sel.id : '');
      out.preferredBranch = String(sel.name || '');
      if (sel.name) {
        out.preferredStore = String(sel.name);
        out.bestStore = String(sel.name);
      }
    } else {
      out.branchId = out.branchId || null;
      out.preferredBranch = out.preferredBranch || '';
    }
    return out;
  }

  global.MPS = {
    IMG, CART_KEY, $, $all, loadJSON, money, getCart, saveCart, addToCart, removeFromCart,
    clearCart, updateCartBadge, flattenStores, cheapestStore, bestSingleStore, loadMeta,
    fillFooter, markActiveNav, escapeHtml, isMarketItem, preferredLinePrice, bestPriceOfItem,
    parseLooseDate, isStaleUpdate, wrapUpdateHtml,
    LEAFLET_SCODE, resolvePromoScode, storeBranchEntry, pickDefaultBranch, withPromoBranch
  };

  document.addEventListener('DOMContentLoaded', () => {
    markActiveNav();
    updateCartBadge();
  });
})(window);
