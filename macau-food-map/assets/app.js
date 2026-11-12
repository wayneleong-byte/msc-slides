/* 澳門美食地圖 · 前端邏輯
   純靜態：本機 Leaflet + 免金鑰公開底圖；無需任何 API key 或建構步驟。
   官方高德／Google 底圖屬選用：由站方自行申請金鑰，於 config.local.js 設定。 */
(() => {
  'use strict';

  const MACAU_CENTER = [22.175, 113.55];
  const MQ = window.matchMedia('(max-width: 999px)');
  const VERSION = '20261112d';
  const el = {};
  [
    'panel', 'list', 'search', 'btnClear', 'suggestions', 'resultCount', 'resultHint',
    'groupFilters', 'catFilters', 'areaFilters', 'btnToggleCats', 'catCount', 'btnReset',
    'detail', 'detailBody', 'btnCloseDetail', 'btnModeMap', 'btnModeList',
    'navMap', 'navList', 'map', 'soloBanner', 'soloText', 'btnClearSolo',
    'btnLocate', 'btnFit', 'btnShare', 'mapLegend', 'toast',
  ].forEach((id) => { el[id] = document.getElementById(id); });
  el.workspace = document.querySelector('.workspace');

  const state = {
    data: null,
    all: [],
    groups: new Set(),
    cats: new Set(),
    areas: new Set(),
    q: '',
    markers: {},
    activeId: null,
    soloId: null,
    view: 'map',
    userPos: null,
    sortByNear: false,
    suggestions: [],
    suggestIndex: -1,
    hashReady: false,
  };

  /* ------------------------------------------------------------ 工具 */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const isMobile = () => MQ.matches;

  function showToast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.toast.classList.add('hidden'), 2300);
  }

  function haversine(a, b, c, d) {
    const R = 6371;
    const rad = (x) => x * Math.PI / 180;
    const dLat = rad(c - a), dLng = rad(d - b);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function distanceText(r) {
    if (!state.userPos || r.lat == null || r.lng == null) return '';
    const km = haversine(state.userPos.lat, state.userPos.lng, r.lat, r.lng);
    return km < 1 ? `約 ${Math.round(km * 1000)} 米` : `約 ${km.toFixed(1)} 公里`;
  }

  const AWARD_DISHES = (r) => (r.awards || []).filter((a) => a.dish).map((a) => a.dish);

  function formatHours(h) {
    if (!h) return '';
    const days = {
      monday: '週一', tuesday: '週二', wednesday: '週三', thursday: '週四',
      friday: '週五', saturday: '週六', sunday: '週日',
    };
    let s = String(h);
    s = s.replace(/Monday\s+to\s+Sunday/gi, '每日');
    s = s.replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+to\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
      (m, a, b) => (days[a.toLowerCase()] || a) + '至' + (days[b.toLowerCase()] || b));
    s = s.replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
      (m) => days[m.toLowerCase()] || m);
    s = s.replace(/24\s*hours?/gi, '全日營業');
    s = s.replace(/(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/g, '$1–$2');
    s = s.replace(/\s*\/\s*/g, '；');
    s = s.split(/\n+/).map((x) => x.trim()).filter(Boolean).join('；');
    return s;
  }

  function photoUrl(r) { return r && r.photo ? r.photo : 'assets/photos/placeholder.jpg'; }
  function isPlaceholderPhoto(r) {
    return !!(r && (r.photo_is_placeholder || !r.photo || String(r.photo).includes('placeholder')));
  }
  function isUnofficialPhoto(r) {
    const n = (r && r.photo_note) || '';
    return n.includes('非官方') || n.includes('非官網') || n.includes('示意圖') || isPlaceholderPhoto(r);
  }

  function locationLabel(r) {
    switch (r.coord_accuracy) {
      case 'official': return '位置已核實';
      case 'approx': return '約略位置';
      case 'unverified': return '位置待核實';
      default: return '位置待補';
    }
  }

  function statusTags(r) {
    const out = [];
    const acc = r.coord_accuracy;
    if (acc === 'official') out.push('<span class="tag blue">位置已核實</span>');
    else if (acc === 'approx') out.push('<span class="tag warn">約略位置</span>');
    else if (acc === 'unverified') out.push('<span class="tag warn">位置待核實</span>');
    else out.push('<span class="tag warn">位置待補</span>');
    if (!r.address) out.push('<span class="tag warn">地址待補</span>');
    if (r.is_branch) out.push('<span class="tag">品牌分店</span>');
    return out.join('');
  }

  /* ------------------------------------------------------------ 地圖 */
  const map = L.map(el.map, {
    zoomControl: false, attributionControl: true, preferCanvas: false,
  }).setView(MACAU_CENTER, 12);
  L.control.zoom({ position: 'topright' }).addTo(map);
  /* 底圖：內建圖層全部免金鑰、可公開使用，並保留正確署名。
     官方高德／Google 底圖需要站方自行申請的金鑰，且不得使用來路不明的瓦片網址；
     若有合法來源，可透過 config.local.js 的 extraTileLayers 加入圖層選單。 */
  const MAP_CFG = window.__MACAU_FOOD_MAP_CONFIG__ || {};
  const NAV_CREDIT = ' · 導航：高德地圖／Google 地圖深連結';
  const baseLayers = {
    'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap 貢獻者' + NAV_CREDIT,
      updateWhenIdle: true,
    }),
    '簡約街道（CARTO）': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap 貢獻者 &copy; CARTO' + NAV_CREDIT,
      updateWhenIdle: true,
    }),
    '街道圖（CARTO Voyager）': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap 貢獻者 &copy; CARTO' + NAV_CREDIT,
      updateWhenIdle: true,
    }),
  };
  const initialLayerName = MAP_CFG.defaultBaseLayer && baseLayers[MAP_CFG.defaultBaseLayer]
    ? MAP_CFG.defaultBaseLayer : 'OpenStreetMap';
  baseLayers[initialLayerName].addTo(map);

  const layersControl = L.control.layers(baseLayers, null, {
    position: 'topright', collapsed: true,
  }).addTo(map);

  // 本機設定掛鉤：只接受站方自行取得、合法授權的官方瓦片來源。
  // 不內建、不推測任何高德／Google 爬取瓦片 URL，也不把金鑰寫進應用程式碼。
  (Array.isArray(MAP_CFG.extraTileLayers) ? MAP_CFG.extraTileLayers : []).forEach((cfg) => {
    if (!cfg || typeof cfg.name !== 'string' || typeof cfg.url !== 'string') return;
    if (!/\{z\}/.test(cfg.url) || !/\{x\}/.test(cfg.url) || !/\{y\}/.test(cfg.url)) return;
    layersControl.addBaseLayer(L.tileLayer(cfg.url, {
      maxZoom: Number(cfg.maxZoom) || 19,
      subdomains: cfg.subdomains || 'abc',
      attribution: (cfg.attribution || '地圖資料由站方提供') + NAV_CREDIT,
      updateWhenIdle: true,
    }), cfg.name);
  });

  const clusterLayer = L.layerGroup().addTo(map);
  const pinLayer = L.layerGroup().addTo(map);
  const userLayer = L.layerGroup().addTo(map);

  function resizeMap() {
    const pane = document.querySelector('.map-pane');
    if (!pane || !el.map) return false;
    const w = pane.clientWidth, h = pane.clientHeight;
    if (w < 2 || h < 2) return false;
    el.map.style.width = w + 'px';
    el.map.style.height = h + 'px';
    map.invalidateSize({ animate: false, pan: false });
    return true;
  }

  function pinIconFor(r, active) {
    const acc = r.coord_accuracy || 'approx';
    const cls = ['pin-wrap', acc === 'official' ? '' : acc, active ? 'active' : ''].filter(Boolean).join(' ');
    return L.divIcon({
      className: '',
      html: `<div class="${cls}"><div class="pin-shape"></div></div>`,
      iconSize: [30, 38], iconAnchor: [15, 36], tooltipAnchor: [0, -30],
    });
  }

  function addPin(r, active) {
    const m = L.marker([r.lat, r.lng], {
      icon: pinIconFor(r, active), title: r.name,
      zIndexOffset: active ? 1000 : 0,
      riseOnHover: true,
    });
    m.on('click', () => selectRestaurant(r.id, false));
    m.bindTooltip(esc(r.name), { direction: 'top', offset: [0, -30], className: 'rest-tip', opacity: 1 });
    m.addTo(pinLayer);
    state.markers[r.id] = m;
  }

  function addCluster(items) {
    const lat = items.reduce((s, r) => s + r.lat, 0) / items.length;
    const lng = items.reduce((s, r) => s + r.lng, 0) / items.length;
    const n = items.length;
    const size = n > 9 ? 42 : 36;
    const cls = ['cluster-wrap', n < 10 ? 'small' : '', items.some((r) => r.coord_accuracy !== 'official') ? 'mixed' : ''].filter(Boolean).join(' ');
    const icon = L.divIcon({
      className: '',
      html: `<div class="${cls}">${n}</div>`,
      iconSize: [size, size], iconAnchor: [size / 2, size / 2],
    });
    const m = L.marker([lat, lng], { icon });
    const names = items.slice(0, 3).map((r) => r.name).join('、') + (n > 3 ? ` 等 ${n} 間` : '');
    m.bindTooltip(`<strong>${n} 間餐廳</strong><br>${esc(names)}`, {
      direction: 'top', offset: [0, -size / 2], className: 'rest-tip', opacity: 1,
    });
    m.on('click', () => {
      const b = L.latLngBounds(items.map((r) => [r.lat, r.lng]));
      map.fitBounds(b, { padding: [58, 58], maxZoom: 17, animate: true });
    });
    m.addTo(clusterLayer);
  }

  /* 依螢幕像素網格聚合；縮放／移動後重算，擁擠時保持可讀。 */
  function renderMarkers(rows) {
    clusterLayer.clearLayers();
    pinLayer.clearLayers();
    state.markers = {};
    const pts = rows.filter((r) => r.lat != null && r.lng != null);
    const size = map.getSize();
    if (size.x < 2 || size.y < 2) return;

    const cell = isMobile() ? 54 : 60;
    const grid = new Map();
    pts.forEach((r) => {
      if (r.id === state.activeId) return;
      const p = map.latLngToContainerPoint([r.lat, r.lng]);
      const key = Math.floor(p.x / cell) + ':' + Math.floor(p.y / cell);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(r);
    });
    grid.forEach((items) => {
      if (items.length === 1) addPin(items[0], false);
      else addCluster(items);
    });
    const active = state.activeId && rows.find((r) => r.id === state.activeId);
    if (active && active.lat != null) addPin(active, true);
  }

  function fitRows(rows, opts = {}) {
    const b = [];
    rows.forEach((r) => { if (r.lat != null && r.lng != null) b.push([r.lat, r.lng]); });
    if (state.userPos && opts.includeUser) b.push([state.userPos.lat, state.userPos.lng]);
    if (!b.length) return;
    if (b.length === 1) map.setView(b[0], 16, { animate: true });
    else {
      try { map.fitBounds(b, { padding: [48, 48], maxZoom: opts.maxZoom || 15, animate: true }); }
      catch (_) { map.setView(MACAU_CENTER, 12); }
    }
  }

  function addUserMarker() {
    userLayer.clearLayers();
    if (!state.userPos) return;
    const icon = L.divIcon({
      className: '', html: '<div class="user-dot"></div>',
      iconSize: [18, 18], iconAnchor: [9, 9],
    });
    L.marker([state.userPos.lat, state.userPos.lng], { icon, interactive: false })
      .bindTooltip('你的位置', { direction: 'top', offset: [0, -10], className: 'rest-tip' })
      .addTo(userLayer);
  }

  /* ------------------------------------------------------------ 篩選 */
  function searchBlob(r) {
    return [
      r.name, ...(r.aliases || []), ...(r.categories || []),
      r.address || '', r.area || '', r.intro || '',
      ...AWARD_DISHES(r),
      ...(r.awards || []).map((a) => `${a.category || ''} ${a.dish || ''} ${a.person || ''}`),
      ...(r.award_groups || []).map((g) => g.label),
    ].join(' ').toLowerCase();
  }

  function matches(r) {
    if (state.soloId && r.id !== state.soloId) return false;
    if (state.groups.size) {
      const ids = (r.award_groups || []).map((g) => g.id);
      if (![...state.groups].some((g) => ids.includes(g))) return false;
    }
    if (state.cats.size && ![...state.cats].some((c) => (r.categories || []).includes(c))) return false;
    if (state.areas.size && !state.areas.has(r.area)) return false;
    if (state.q) {
      const terms = state.q.split(/\s+/).filter(Boolean);
      const blob = searchBlob(r);
      if (!terms.every((t) => blob.includes(t))) return false;
    }
    return true;
  }

  function filtered() {
    let rows = state.all.filter(matches);
    if (state.sortByNear && state.userPos) {
      rows = rows.slice().sort((a, b) => {
        const da = a.lat == null ? Infinity : haversine(state.userPos.lat, state.userPos.lng, a.lat, a.lng);
        const db = b.lat == null ? Infinity : haversine(state.userPos.lat, state.userPos.lng, b.lat, b.lng);
        return da - db;
      });
    }
    return rows;
  }

  function renderChips() {
    const groups = state.data.filter_groups || [];
    el.groupFilters.innerHTML = groups.map((g) =>
      `<button type="button" class="chip group${state.groups.has(g.id) ? ' on' : ''}" data-group="${esc(g.id)}" aria-pressed="${state.groups.has(g.id)}">${esc(g.label)}</button>`
    ).join('');
    const areas = state.data.filter_areas || [];
    el.areaFilters.innerHTML = areas.map((a) =>
      `<button type="button" class="chip area${state.areas.has(a) ? ' on' : ''}" data-area="${esc(a)}" aria-pressed="${state.areas.has(a)}">${esc(a)}</button>`
    ).join('');
    const cats = state.data.filter_categories || [];
    el.catFilters.innerHTML = cats.map((c) =>
      `<button type="button" class="chip cat${state.cats.has(c) ? ' on' : ''}" data-cat="${esc(c)}" aria-pressed="${state.cats.has(c)}">${esc(c.replace(/^我最愛/, ''))}</button>`
    ).join('');
    if (el.catCount) el.catCount.textContent = `${cats.length} 類`;
  }

  function renderList(rows) {
    if (!rows.length) {
      el.list.innerHTML = '<li class="empty"><strong>沒有符合的餐廳</strong>試試減少篩選條件，或清除搜尋字詞。</li>';
      return;
    }
    el.list.innerHTML = rows.map((r) => {
      const tags = (r.award_groups || []).slice(0, 2).map((g) =>
        `<span class="tag gold">${esc(g.label)}</span>`).join('');
      const cats = (r.categories || []).slice(0, 1).map((c) =>
        `<span class="tag">${esc(c.replace(/^我最愛/, ''))}</span>`).join('');
      const dist = distanceText(r);
      const meta = [r.area, r.address ? String(r.address).slice(0, 32) : '地址待補', dist]
        .filter(Boolean).map(esc).join(' · ');
      const pSrc = photoUrl(r);
      const caption = r.photo_note ? `${r.name} · ${r.photo_note}` : r.name;
      const ph = isPlaceholderPhoto(r) ? ' ph' : '';
      return `<li data-id="${esc(r.id)}" class="card${state.activeId === r.id ? ' active' : ''}" tabindex="0" role="button" aria-label="查看 ${esc(r.name)}">
        <img class="thumb${ph}" src="${esc(pSrc)}" alt="${esc(r.name)}" loading="lazy" width="84" height="84"
             data-full="${esc(pSrc)}" data-caption="${esc(caption)}" role="button" tabindex="0" />
        <div class="card-body">
          <div class="name">${esc(r.name)}</div>
          <div class="meta">${meta}</div>
          <div class="tags">${tags}${cats}${statusTags(r)}</div>
          <div class="card-actions">
            <button type="button" class="mini-btn primary" data-act="show" data-id="${esc(r.id)}">在地圖顯示</button>
            <button type="button" class="mini-btn" data-act="solo" data-id="${esc(r.id)}">只看這間</button>
          </div>
        </div>
      </li>`;
    }).join('');
  }

  /* ------------------------------------------------------------ 詳情 */
  function awardHtml(r) {
    return (r.awards || []).map((a) => {
      let t = a.category || '';
      if (a.dish) t += `｜${a.dish}`;
      if (a.person) t += `｜${a.person}`;
      if (a.note) t += `｜${a.note}`;
      return `<span class="tag gold">${esc(t)}</span>`;
    }).join('');
  }

  function showDetail(r) {
    const dishes = AWARD_DISHES(r);
    const notes = [];
    if (r.quality_note) notes.push(`<p class="note-line">${esc(r.quality_note)}</p>`);
    if (r.link_note) notes.push(`<p class="note-line link-note">${esc(r.link_note)}</p>`);
    if (r.area_note) notes.push(`<p class="note-line">${esc(r.area_note)}</p>`);
    if (r.coord_note) notes.push(`<p class="note-line">${esc(r.coord_note)}</p>`);

    const row = (k, v, cls) => `<dt>${esc(k)}</dt><dd${cls ? ` class="${cls}"` : ''}>${v}</dd>`;
    const info = [];
    info.push(row('地區', esc(r.area || '待補')));
    info.push(row('地址', r.address
      ? `${esc(r.address)}${r.address_note ? `<br><span class="pending">${esc(r.address_note)}</span>` : ''}`
      : '<span class="pending">待補（可用下方導航以店名搜尋）</span>'));
    info.push(row('電話', r.phone
      ? `<a href="tel:${esc(String(r.phone).replace(/[^+\d]/g, ''))}">${esc(r.phone)}</a>`
      : '<span class="pending">待補</span>'));
    info.push(row('營業時間', r.hours ? esc(formatHours(r.hours)) : '<span class="pending">待補</span>'));
    info.push(row('價位', r.price_range ? esc(r.price_range) : '<span class="pending">待補</span>'));
    if (dishes.length) info.push(row('獲獎菜式', esc(dishes.join('、'))));
    else info.push(row('招牌菜', '<span class="pending">待補</span>'));
    const coordHint = r.coord_accuracy === 'approx'
      ? '<br><span class="pending">標記只代表建築／地區範圍，非店舖精確位置</span>'
      : (r.coord_accuracy === 'unverified'
        ? '<br><span class="pending">同名多店／分店待核實，請用導航按鈕以店名搜尋</span>' : '');
    info.push(row('位置狀態', `${statusTags(r)}${coordHint}`));

    const actions = [];
    if (r.links && r.links.amap) {
      actions.push(`<a class="btn primary" target="_blank" rel="noopener noreferrer" href="${esc(r.links.amap)}">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
        在高德地圖導航</a>`);
    }
    if (r.links && r.links.maps_fallback) {
      actions.push(`<a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(r.links.maps_fallback)}">Google 地圖</a>`);
    }
    if (r.address) {
      actions.push(`<button type="button" class="btn" data-act="copyaddr" data-id="${esc(r.id)}">複製地址</button>`);
    }
    if (r.links && r.links.official) {
      actions.push(`<a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(r.links.official)}">餐廳官方頁</a>`);
    }
    if (r.links && r.links.mgto) {
      actions.push(`<a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(r.links.mgto)}">旅遊局資料</a>`);
    }
    actions.push(`<button type="button" class="btn" data-act="solo" data-id="${esc(r.id)}">${state.soloId === r.id ? '取消只看這間' : '只看這間'}</button>`);
    actions.push(`<button type="button" class="btn" data-act="share" data-id="${esc(r.id)}">分享此店</button>`);

    const pSrc = photoUrl(r);
    const pCap = r.photo_note ? `${r.name} · ${r.photo_note}` : r.name;
    const ph = isPlaceholderPhoto(r) ? ' ph' : '';
    const photoNote = isUnofficialPhoto(r)
      ? `<div class="photo-note">示意圖片，非官方相片${r.photo_note && !/非官/.test(r.photo_note) ? ' · ' + esc(r.photo_note) : ''}</div>` : '';
    const aliasLine = (r.aliases || []).length
      ? `<div class="sub-name">亦稱：${esc(r.aliases.join('、'))}</div>` : '';
    const sources = (r.sources || []).length
      ? `<p class="source-line">資料來源：${esc(r.sources.join('；'))}</p>` : '';

    el.detailBody.innerHTML = `
      <img class="hero${ph}" src="${esc(pSrc)}" alt="${esc(r.name)}" loading="lazy"
           data-full="${esc(pSrc)}" data-caption="${esc(pCap)}" role="button" tabindex="0" />
      ${photoNote}
      <h2>${esc(r.name)}</h2>
      ${aliasLine}
      <div class="awards">${awardHtml(r)}</div>
      <div class="sec-title">餐廳資料</div>
      <dl class="info-grid">${info.join('')}</dl>
      ${notes.join('')}
      ${sources}
      <div class="actions">${actions.join('')}</div>
    `;
    el.detail.classList.remove('hidden');
    el.detail.classList.remove('expanded');
    el.detail.scrollTop = 0;
    document.body.classList.add('detail-open');
    const hero = el.detailBody.querySelector('img.hero[data-full]');
    if (hero) {
      const open = (e) => { e.stopPropagation(); openLightbox(hero.dataset.full, hero.dataset.caption || ''); };
      hero.addEventListener('click', open);
      hero.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
      });
    }
  }

  function closeDetail() {
    el.detail.classList.add('hidden');
    el.detail.classList.remove('expanded');
    el.detail.scrollTop = 0;
    document.body.classList.remove('detail-open');
    state.activeId = null;
    renderMarkers(filtered());
    [...el.list.querySelectorAll('li.card')].forEach((li) => li.classList.remove('active'));
    writeHash();
  }

  /* ------------------------------------------------------------ 選取與檢視 */
  function setView(mode, opts = {}) {
    state.view = mode === 'list' ? 'list' : 'map';
    document.body.classList.toggle('view-map', state.view === 'map');
    document.body.classList.toggle('view-list', state.view === 'list');
    const onMap = state.view === 'map';
    el.btnModeMap.classList.toggle('on', onMap);
    el.btnModeMap.setAttribute('aria-selected', String(onMap));
    el.btnModeList.classList.toggle('on', !onMap);
    el.btnModeList.setAttribute('aria-selected', String(!onMap));
    el.navMap.classList.toggle('on', onMap);
    el.navList.classList.toggle('on', !onMap);
    if (onMap) el.navMap.setAttribute('aria-current', 'page'); else el.navMap.removeAttribute('aria-current');
    if (!onMap) el.navList.setAttribute('aria-current', 'page'); else el.navList.removeAttribute('aria-current');
    if (onMap) {
      requestAnimationFrame(() => {
        resizeMap();
        renderMarkers(filtered());
        [60, 220, 550].forEach((d) => setTimeout(resizeMap, d));
      });
    }
    if (!opts.silent) writeHash();
  }

  function scrollListTo(id) {
    const li = el.list.querySelector(`li[data-id="${id}"]`);
    if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function selectRestaurant(id, pan = true, opts = {}) {
    const r = state.all.find((x) => x.id === id);
    if (!r) return;
    state.activeId = id;
    [...el.list.querySelectorAll('li.card')].forEach((li) => li.classList.toggle('active', li.dataset.id === id));
    showDetail(r);
    scrollListTo(id);
    if (isMobile() && !opts.keepView) setView('map', { silent: true });
    if (r.lat != null && r.lng != null) {
      requestAnimationFrame(() => {
        resizeMap();
        if (pan) map.setView([r.lat, r.lng], Math.max(map.getZoom(), 15), { animate: true });
        renderMarkers(filtered());
        setTimeout(() => {
          try { const mm = state.markers[id]; if (mm) mm.openTooltip(); } catch (_) {}
        }, 300);
      });
    } else {
      showToast('此店位置待補，請用導航按鈕以店名搜尋');
      renderMarkers(filtered());
    }
    writeHash();
  }

  function updateSoloBanner() {
    if (!state.soloId) { el.soloBanner.classList.add('hidden'); return; }
    const r = state.all.find((x) => x.id === state.soloId);
    el.soloText.textContent = r ? `只顯示：${r.name}` : '只顯示一間餐廳';
    el.soloBanner.classList.remove('hidden');
  }

  function soloRestaurant(id) {
    const r = state.all.find((x) => x.id === id);
    if (!r) return;
    state.soloId = id;
    state.activeId = id;
    refresh({ fit: true });
    showDetail(r);
    if (r.lat != null && r.lng != null) {
      setView('map', { silent: true });
      requestAnimationFrame(() => { resizeMap(); map.setView([r.lat, r.lng], 16, { animate: true }); });
    } else {
      setView('list', { silent: true });
    }
    writeHash();
  }

  function clearSolo() {
    state.soloId = null;
    refresh({ fit: true });
    const r = state.activeId && state.all.find((x) => x.id === state.activeId);
    if (r) showDetail(r);
    writeHash();
  }

  function resetAll() {
    state.groups.clear(); state.cats.clear(); state.areas.clear();
    state.q = ''; el.search.value = ''; state.soloId = null;
    el.btnClear.classList.add('hidden');
    hideSuggestions();
    state.activeId = null;
    el.detail.classList.add('hidden');
    document.body.classList.remove('detail-open');
    renderChips();
    refresh({ fit: true });
    writeHash();
  }

  /* ------------------------------------------------------------ 刷新 */
  function refresh(opts = {}) {
    if (!state.data) return;
    const rows = filtered();
    const pinned = rows.filter((r) => r.lat != null && r.lng != null).length;
    el.resultCount.innerHTML = state.soloId
      ? `單店模式 · <b>1</b> 間`
      : `顯示 <b>${rows.length}</b> / ${state.all.length} 間`;
    el.resultHint.textContent = `有定位 ${pinned} 間${state.sortByNear ? ' · 依距離排序' : ''}`;
    renderList(rows);
    renderMarkers(rows);
    updateSoloBanner();
    if (opts.fit) fitRows(rows, { includeUser: state.sortByNear });
    writeHash();
  }

  /* ------------------------------------------------------------ 深連結 */
  function writeHash() {
    if (!state.hashReady) return;
    const p = new URLSearchParams();
    if (state.activeId) p.set('r', state.activeId);
    if (state.groups.size) p.set('g', [...state.groups].join(','));
    if (state.cats.size) p.set('c', [...state.cats].join(','));
    if (state.areas.size) p.set('a', [...state.areas].join(','));
    if (state.q) p.set('q', state.q);
    if (state.soloId) p.set('s', state.soloId);
    p.set('v', state.view);
    const s = p.toString();
    try { history.replaceState(null, '', location.pathname + location.search + (s ? '#' + s : '')); }
    catch (_) { /* file:// 下 replaceState 可能受限，安靜略過 */ }
  }

  function readHash() {
    const s = location.hash.replace(/^#/, '');
    if (!s) return null;
    const p = new URLSearchParams(s);
    return {
      r: p.get('r'), s: p.get('s'), q: p.get('q') || '', v: p.get('v'),
      g: (p.get('g') || '').split(',').filter(Boolean),
      c: (p.get('c') || '').split(',').filter(Boolean),
      a: (p.get('a') || '').split(',').filter(Boolean),
    };
  }

  function applyHash(h, opts = {}) {
    if (!h || !state.data) return;
    state.groups = new Set(h.g.filter((x) => (state.data.filter_groups || []).some((g) => g.id === x)));
    state.cats = new Set(h.c.filter((x) => (state.data.filter_categories || []).includes(x)));
    state.areas = new Set(h.a.filter((x) => (state.data.filter_areas || []).includes(x)));
    state.q = h.q;
    el.search.value = h.q;
    el.btnClear.classList.toggle('hidden', !h.q);
    state.soloId = h.s && state.all.some((r) => r.id === h.s) ? h.s : null;
    renderChips();
    setView(h.v === 'list' ? 'list' : 'map', { silent: true });
    refresh({ fit: !h.r && !h.s });
    const target = h.r || h.s;
    if (target && state.all.some((r) => r.id === target)) {
      state.activeId = target;
      const r = state.all.find((x) => x.id === target);
      showDetail(r);
      renderList(filtered());
      if (r.lat != null && r.lng != null) {
        setTimeout(() => { resizeMap(); map.setView([r.lat, r.lng], 16, { animate: false }); renderMarkers(filtered()); }, 120);
      }
    }
    if (!opts.silent) writeHash();
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (_) { /* 降級 */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) { return false; }
  }

  function shareCurrent(onlyId) {
    const p = new URLSearchParams();
    if (onlyId) p.set('r', onlyId);
    else {
      if (state.activeId) p.set('r', state.activeId);
      if (state.groups.size) p.set('g', [...state.groups].join(','));
      if (state.cats.size) p.set('c', [...state.cats].join(','));
      if (state.areas.size) p.set('a', [...state.areas].join(','));
      if (state.q) p.set('q', state.q);
      if (state.soloId) p.set('s', state.soloId);
      p.set('v', state.view);
    }
    const url = location.href.split('#')[0] + '#' + p.toString();
    copyText(url).then((ok) => showToast(ok ? '分享連結已複製' : '複製失敗，請手動複製網址列連結'));
  }

  /* ------------------------------------------------------------ 搜尋建議 */
  function hideSuggestions() {
    el.suggestions.classList.add('hidden');
    state.suggestions = [];
    state.suggestIndex = -1;
  }

  function updateSuggestions() {
    const q = state.q.trim().toLowerCase();
    if (!q) { hideSuggestions(); return; }
    const hits = state.all.filter((r) => {
      const name = r.name.toLowerCase();
      const alias = (r.aliases || []).join(' ').toLowerCase();
      return name.includes(q) || alias.includes(q);
    }).slice(0, 7);
    state.suggestions = hits;
    state.suggestIndex = -1;
    if (!hits.length) {
      el.suggestions.innerHTML = '<div class="suggest-empty">沒有相符的店名，可改用關鍵字搜尋。</div>';
    } else {
      el.suggestions.innerHTML = hits.map((r, i) =>
        `<button type="button" class="suggest-item" data-idx="${i}" data-id="${esc(r.id)}" role="option">
           <span>${esc(r.name)}</span><span class="sg-sub">${esc(r.area || '')}</span>
         </button>`).join('');
    }
    el.suggestions.classList.remove('hidden');
  }

  function highlightSuggestion() {
    [...el.suggestions.querySelectorAll('.suggest-item')].forEach((b, i) =>
      b.classList.toggle('kb-active', i === state.suggestIndex));
  }

  /* 選取建議 = 直接跳到該店；清空搜尋字，讓列表維持完整可繼續瀏覽。 */
  function chooseSuggestion(r) {
    if (!r) return;
    el.search.value = '';
    state.q = '';
    el.btnClear.classList.add('hidden');
    hideSuggestions();
    refresh({ fit: false });
    selectRestaurant(r.id, true);
  }

  /* ------------------------------------------------------------ 燈箱 */
  function openLightbox(src, caption) {
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const cap = document.getElementById('lightboxCaption');
    if (!box || !img) return;
    img.src = src; img.alt = caption || '餐廳圖片';
    if (cap) cap.textContent = caption || '';
    box.classList.remove('hidden');
    document.body.classList.add('lightbox-open');
  }
  function closeLightbox() {
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    if (!box) return;
    box.classList.add('hidden');
    document.body.classList.remove('lightbox-open');
    if (img) img.removeAttribute('src');
  }

  /* ------------------------------------------------------------ 事件綁定 */
  el.btnModeMap.addEventListener('click', () => setView('map'));
  el.btnModeList.addEventListener('click', () => setView('list'));
  el.navMap.addEventListener('click', () => setView('map'));
  el.navList.addEventListener('click', () => setView('list'));
  el.btnReset.addEventListener('click', resetAll);
  el.btnShare.addEventListener('click', () => shareCurrent(null));
  el.btnFit.addEventListener('click', () => { resizeMap(); fitRows(filtered(), { includeUser: state.sortByNear, maxZoom: 14 }); });
  el.btnCloseDetail.addEventListener('click', closeDetail);
  el.btnClearSolo.addEventListener('click', clearSolo);

  el.btnToggleCats.addEventListener('click', () => {
    const open = el.catFilters.classList.toggle('hidden') === false;
    el.btnToggleCats.setAttribute('aria-expanded', String(open));
  });

  el.search.addEventListener('input', () => {
    state.q = el.search.value.trim().toLowerCase();
    el.btnClear.classList.toggle('hidden', !el.search.value);
    updateSuggestions();
    refresh();
  });
  el.search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && state.suggestions.length) {
      e.preventDefault();
      state.suggestIndex = (state.suggestIndex + 1) % state.suggestions.length;
      highlightSuggestion();
    } else if (e.key === 'ArrowUp' && state.suggestions.length) {
      e.preventDefault();
      state.suggestIndex = (state.suggestIndex - 1 + state.suggestions.length) % state.suggestions.length;
      highlightSuggestion();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.suggestIndex >= 0 && state.suggestions[state.suggestIndex]) {
        chooseSuggestion(state.suggestions[state.suggestIndex]);
      } else {
        hideSuggestions();
        refresh({ fit: true });
      }
      el.search.blur();
    } else if (e.key === 'Escape') {
      if (!el.suggestions.classList.contains('hidden')) hideSuggestions();
      else { el.search.value = ''; state.q = ''; el.btnClear.classList.add('hidden'); refresh({ fit: true }); }
    }
  });
  el.search.addEventListener('blur', () => setTimeout(hideSuggestions, 140));
  el.btnClear.addEventListener('click', () => {
    el.search.value = ''; state.q = '';
    el.btnClear.classList.add('hidden');
    hideSuggestions(); refresh({ fit: true }); el.search.focus();
  });
  el.suggestions.addEventListener('mousedown', (e) => {
    const b = e.target.closest('.suggest-item');
    if (!b) return;
    e.preventDefault();
    const r = state.all.find((x) => x.id === b.dataset.id);
    if (r) chooseSuggestion(r);
  });

  function toggleChip(set, value, btn, cls) {
    if (set.has(value)) set.delete(value); else set.add(value);
    btn.classList.toggle('on');
    btn.setAttribute('aria-pressed', String(set.has(value)));
    refresh({ fit: true });
  }
  el.groupFilters.addEventListener('click', (e) => {
    const b = e.target.closest('.chip.group'); if (b) toggleChip(state.groups, b.dataset.group, b);
  });
  el.areaFilters.addEventListener('click', (e) => {
    const b = e.target.closest('.chip.area'); if (b) toggleChip(state.areas, b.dataset.area, b);
  });
  el.catFilters.addEventListener('click', (e) => {
    const b = e.target.closest('.chip.cat'); if (b) toggleChip(state.cats, b.dataset.cat, b);
  });

  el.list.addEventListener('click', (e) => {
    const thumb = e.target.closest('img.thumb[data-full]');
    if (thumb) { e.stopPropagation(); openLightbox(thumb.dataset.full, thumb.dataset.caption || ''); return; }
    const act = e.target.closest('[data-act]');
    if (act) {
      e.stopPropagation();
      if (act.dataset.act === 'solo') {
        if (state.soloId === act.dataset.id) clearSolo(); else soloRestaurant(act.dataset.id);
      } else if (act.dataset.act === 'show') {
        const r = state.all.find((x) => x.id === act.dataset.id);
        if (!r) return;
        selectRestaurant(r.id, true);
        if (r.lat == null) showToast('此店位置待補，請用導航按鈕以店名搜尋');
      }
      return;
    }
    const li = e.target.closest('li[data-id]');
    if (li) selectRestaurant(li.dataset.id, true);
  });
  el.list.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const li = e.target.closest('li[data-id]');
    if (!li || e.target !== li) return;
    e.preventDefault(); selectRestaurant(li.dataset.id, true);
  });
  el.list.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('img.thumb[data-full]')) {
      e.preventDefault(); openLightbox(e.target.dataset.full, e.target.dataset.caption || '');
    }
  });

  el.detailBody.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const id = act.dataset.id;
    if (act.dataset.act === 'solo') {
      if (state.soloId === id) clearSolo(); else soloRestaurant(id);
    } else if (act.dataset.act === 'share') {
      shareCurrent(id);
    } else if (act.dataset.act === 'copyaddr') {
      const r = state.all.find((x) => x.id === id);
      if (r && r.address) copyText(r.address).then((ok) => showToast(ok ? '地址已複製' : '複製失敗'));
    }
  });

  /* 我附近：需要瀏覽器權限；失敗時安靜降級，不中斷操作。 */
  el.btnLocate.addEventListener('click', () => {
    if (state.userPos) {
      state.userPos = null; state.sortByNear = false;
      userLayer.clearLayers();
      el.btnLocate.classList.remove('busy');
      el.btnLocate.querySelector('span').textContent = '我附近';
      refresh();
      showToast('已關閉附近排序');
      return;
    }
    if (!navigator.geolocation) { showToast('此瀏覽器不支援定位，維持原有排序'); return; }
    el.btnLocate.classList.add('busy');
    el.btnLocate.querySelector('span').textContent = '定位中';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.sortByNear = true;
        el.btnLocate.classList.remove('busy');
        el.btnLocate.querySelector('span').textContent = '關閉附近';
        addUserMarker();
        setView('map', { silent: true });
        refresh();
        setTimeout(() => {
          resizeMap();
          map.setView([state.userPos.lat, state.userPos.lng], 14, { animate: true });
        }, 80);
        showToast('已依距離排序（僅計有定位的餐廳）');
      },
      () => {
        el.btnLocate.classList.remove('busy');
        el.btnLocate.querySelector('span').textContent = '我附近';
        showToast('未能取得位置，維持原有排序');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });

  /* 手機詳情面板：上滑展開、下拉關閉、輕點切換兩段高度 */
  let dragStartY = null, dragDelta = 0, lastTouch = 0;
  const handle = el.detail.querySelector('.sheet-handle');
  if (handle) {
    handle.addEventListener('touchstart', (e) => {
      dragStartY = e.touches[0].clientY; dragDelta = 0;
      el.detail.classList.add('dragging');
    }, { passive: true });
    handle.addEventListener('touchmove', (e) => {
      if (dragStartY == null) return;
      dragDelta = e.touches[0].clientY - dragStartY;
      if (el.detail.classList.contains('expanded') && dragDelta < 0) dragDelta = 0;
      el.detail.style.transform = `translateY(${Math.max(-40, dragDelta)}px)`;
    }, { passive: true });
    const endDrag = () => {
      if (dragStartY == null) return;
      lastTouch = Date.now();
      el.detail.classList.remove('dragging');
      el.detail.style.transform = '';
      if (dragDelta > 90) closeDetail();
      else if (dragDelta < -34) el.detail.classList.add('expanded');
      else if (Math.abs(dragDelta) < 8) el.detail.classList.toggle('expanded');
      dragStartY = null; dragDelta = 0;
    };
    handle.addEventListener('touchend', endDrag);
    handle.addEventListener('touchcancel', endDrag);
    handle.addEventListener('click', () => {
      if (Date.now() - lastTouch < 500) return;
      el.detail.classList.toggle('expanded');
    });
  }

  /* 燈箱 */
  const lightbox = document.getElementById('lightbox');
  const lightboxClose = document.getElementById('lightboxClose');
  lightboxClose.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.id === 'lightboxCaption') closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      if (isMobile() && state.view === 'map') setView('list');
      el.search.focus();
    }
  });

  /* 地圖視角改變時重新聚合 */
  let markerTimer = null;
  map.on('zoomend moveend', () => {
    if (!state.data) return;
    clearTimeout(markerTimer);
    markerTimer = setTimeout(() => renderMarkers(filtered()), 30);
  });

  MQ.addEventListener('change', () => { setTimeout(() => { resizeMap(); renderMarkers(filtered()); }, 120); });
  window.addEventListener('resize', () => { resizeMap(); renderMarkers(filtered()); });
  window.addEventListener('orientationchange', () => { setTimeout(() => { resizeMap(); renderMarkers(filtered()); }, 320); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeMap);
  window.addEventListener('hashchange', () => { const h = readHash(); if (h) applyHash(h); });

  /* ------------------------------------------------------------ 啟動
     優先 fetch JSON（http／GitHub Pages）；file:// 直接開檔時瀏覽器會擋 fetch，
     故直接改用同源的 data/restaurants.js（與 restaurants.json 同步產出），
     避免無謂的 CORS 錯誤。 */
  function loadViaScript() {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `data/restaurants.js?v=${VERSION}`;
      s.onload = () => window.__MACAU_FOOD_DATA__
        ? resolve(window.__MACAU_FOOD_DATA__)
        : reject(new Error('資料檔格式不正確'));
      s.onerror = () => reject(new Error('無法載入餐廳資料'));
      document.head.appendChild(s);
    });
  }
  function loadData() {
    if (window.__MACAU_FOOD_DATA__) return Promise.resolve(window.__MACAU_FOOD_DATA__);
    if (location.protocol === 'file:') return loadViaScript();
    return fetch(`data/restaurants.json?v=${VERSION}`)
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(loadViaScript);
  }

  loadData()
    .then((data) => {
      state.data = data;
      state.all = data.restaurants || [];
      renderChips();
      const h = readHash();
      state.hashReady = true;
      if (h) applyHash(h);
      else { setView('map', { silent: true }); refresh({ fit: true }); }
      [80, 260, 650, 1200].forEach((d) => setTimeout(() => { resizeMap(); renderMarkers(filtered()); }, d));
    })
    .catch((err) => {
      el.resultCount.textContent = '資料載入失敗';
      el.resultHint.textContent = '請確認 data/ 資料夾與本頁在同一目錄';
      console.error('載入餐廳資料失敗：', err);
    });
})();
