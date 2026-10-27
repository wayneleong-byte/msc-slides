(() => {
  const MACAU_CENTER = [22.175, 113.55];
  const MQ = window.matchMedia('(max-width: 899px)');
  const state = {
    data: null,
    groups: new Set(),
    areas: new Set(),
    cats: new Set(),
    q: '',
    markers: {},
    activeId: null,
    view: 'map',
  };

  const el = {
    panel: document.getElementById('panel'),
    list: document.getElementById('list'),
    search: document.getElementById('search'),
    resultCount: document.getElementById('resultCount'),
    pinHint: document.getElementById('pinHint'),
    groupFilters: document.getElementById('groupFilters'),
    catFilters: document.getElementById('catFilters'),
    areaFilters: document.getElementById('areaFilters'),
    detail: document.getElementById('detail'),
    detailBody: document.getElementById('detailBody'),
    btnModeMap: document.getElementById('btnModeMap'),
    btnModeList: document.getElementById('btnModeList'),
    navMap: document.getElementById('navMap'),
    navList: document.getElementById('navList'),
    mapDiv: document.getElementById('map'),
    workspace: document.querySelector('.workspace'),
  };

  function isMobile() {
    return MQ.matches;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Create map only after first layout paint
  const map = L.map(el.mapDiv, {
    zoomControl: false,
    attributionControl: true,
    preferCanvas: false,
  }).setView(MACAU_CENTER, 12);

  L.control.zoom({ position: 'topright' }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap · 導航：高德深連結',
    updateWhenIdle: true,
    detectRetina: false,
  }).addTo(map);
  const layer = L.layerGroup().addTo(map);

  const pinIcon = L.divIcon({
    className: '',
    html: '<div class="pin-icon"><span>食</span></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -24],
  });

  function resizeMap() {
    const pane = document.querySelector('.map-pane');
    if (!pane || !el.mapDiv) return;
    const w = pane.clientWidth;
    const h = pane.clientHeight;
    if (w < 2 || h < 2) return;
    el.mapDiv.style.width = w + 'px';
    el.mapDiv.style.height = h + 'px';
    map.invalidateSize({ animate: false, pan: false });
  }

  function setView(mode) {
    state.view = mode === 'list' ? 'list' : 'map';
    document.body.classList.toggle('view-map', state.view === 'map');
    document.body.classList.toggle('view-list', state.view === 'list');
    if (el.btnModeMap) {
      el.btnModeMap.classList.toggle('on', state.view === 'map');
      el.btnModeMap.setAttribute('aria-selected', state.view === 'map' ? 'true' : 'false');
    }
    if (el.btnModeList) {
      el.btnModeList.classList.toggle('on', state.view === 'list');
      el.btnModeList.setAttribute('aria-selected', state.view === 'list' ? 'true' : 'false');
    }
    if (el.navMap) {
      el.navMap.classList.toggle('on', state.view === 'map');
      if (state.view === 'map') el.navMap.setAttribute('aria-current', 'page');
      else el.navMap.removeAttribute('aria-current');
    }
    if (el.navList) {
      el.navList.classList.toggle('on', state.view === 'list');
      if (state.view === 'list') el.navList.setAttribute('aria-current', 'page');
      else el.navList.removeAttribute('aria-current');
    }
    if (state.view === 'map') {
      requestAnimationFrame(() => {
        resizeMap();
        setTimeout(resizeMap, 50);
        setTimeout(resizeMap, 250);
        setTimeout(resizeMap, 600);
      });
    }
  }

  function matches(r) {
    if (state.groups.size) {
      const ids = (r.award_groups || []).map((g) => g.id);
      if (![...state.groups].some((g) => ids.includes(g))) return false;
    }
    if (state.areas.size) {
      const a = r.area || '';
      const ok = [...state.areas].some((sel) => {
        if (sel === '氹仔') return a === '氹仔' || (r.address || '').includes('路氹');
        return a === sel;
      });
      if (!ok) return false;
    }
    if (state.cats.size) {
      if (![...state.cats].some((c) => (r.categories || []).includes(c))) return false;
    }
    if (state.q) {
      const blob = [
        r.name, ...(r.aliases || []), ...(r.categories || []),
        r.address || '', r.area || '', r.signature || '',
        ...(r.awards || []).map((a) => `${a.category || ''} ${a.dish || ''} ${a.person || ''}`),
        ...(r.award_groups || []).map((g) => g.label),
      ].join(' ').toLowerCase();
      if (!blob.includes(state.q)) return false;
    }
    return true;
  }

  function filtered() {
    return (state.data.restaurants || []).filter(matches);
  }

  function renderChips() {
    const groups = state.data.filter_groups || [];
    el.groupFilters.innerHTML = groups.map((g) =>
      `<button type="button" class="chip group${state.groups.has(g.id) ? ' on' : ''}" data-group="${esc(g.id)}">${esc(g.label)}</button>`
    ).join('');
    const cats = state.data.filter_categories || [];
    el.catFilters.innerHTML = cats.map((c) =>
      `<button type="button" class="chip cat${state.cats.has(c) ? ' on' : ''}" data-cat="${esc(c)}">${esc(c.replace(/^我最愛/, ''))}</button>`
    ).join('');
  }

  function renderList(rows) {
    el.list.innerHTML = rows.map((r) => {
      const tags = (r.award_groups || []).slice(0, 3).map((g) =>
        `<span class="tag gold">${esc(g.label)}</span>`).join('');
      const more = (r.categories || []).slice(0, 2).map((c) =>
        `<span class="tag">${esc(c.replace(/^我最愛/, ''))}</span>`).join('');
      const loc = r.area || (r.lat ? '地圖有標記' : '位置待高德搜尋');
      return `<li data-id="${esc(r.id)}" class="${state.activeId === r.id ? 'active' : ''}">
        <div class="name">${esc(r.name)}</div>
        <div class="meta">${esc(loc)}${r.address ? ' · ' + esc(r.address.slice(0, 36)) : ''}</div>
        <div class="tags">${tags}${more}</div>
      </li>`;
    }).join('') || '<li class="muted" style="padding:16px">沒有符合的餐廳，請調整篩選。</li>';
  }

  function renderMap(rows) {
    layer.clearLayers();
    state.markers = {};
    const withPin = rows.filter((r) => r.lat != null && r.lng != null);
    const bounds = [];
    withPin.forEach((r) => {
      const m = L.marker([r.lat, r.lng], { icon: pinIcon, title: r.name });
      m.on('click', () => selectRestaurant(r.id, false));
      m.bindTooltip(r.name, { direction: 'top', offset: [0, -20] });
      m.addTo(layer);
      state.markers[r.id] = m;
      bounds.push([r.lat, r.lng]);
    });
    el.pinHint.textContent = `地圖標記 ${withPin.length}／目前 ${rows.length} 間`;
    resizeMap();
    if (bounds.length >= 2) {
      try { map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 }); } catch (_) {}
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }

  function refresh() {
    const rows = filtered();
    el.resultCount.textContent = `顯示 ${rows.length} 間`;
    renderList(rows);
    renderMap(rows);
  }

  function selectRestaurant(id, pan = true) {
    const r = state.data.restaurants.find((x) => x.id === id);
    if (!r) return;
    state.activeId = id;
    [...el.list.querySelectorAll('li')].forEach((li) => {
      li.classList.toggle('active', li.dataset.id === id);
    });
    showDetail(r);
    if (isMobile()) setView('map');
    if (r.lat != null && r.lng != null) {
      requestAnimationFrame(() => {
        resizeMap();
        if (pan) map.setView([r.lat, r.lng], Math.max(map.getZoom(), 15), { animate: true });
        const m = state.markers[id];
        if (m) m.openTooltip();
      });
    }
  }

  function showDetail(r) {
    const awards = (r.awards || []).map((a) => {
      let t = a.category || '';
      if (a.dish) t += `｜${a.dish}`;
      if (a.person) t += `｜${a.person}`;
      if (a.note) t += `｜${a.note}`;
      return `<span class="tag gold">${esc(t)}</span>`;
    }).join('');
    const rows = [];
    if (r.area) rows.push(`<div class="row"><span class="label">地區</span>${esc(r.area)}</div>`);
    if (r.address) rows.push(`<div class="row"><span class="label">地址</span>${esc(r.address)}</div>`);
    else rows.push(`<div class="row"><span class="label">地址</span>待補（可用高德搜尋）</div>`);
    if (r.phone) rows.push(`<div class="row"><span class="label">電話</span><a href="tel:${esc(r.phone)}" style="color:inherit">${esc(r.phone)}</a></div>`);
    if (r.hours) rows.push(`<div class="row"><span class="label">營業時間</span>${esc(r.hours).replace(/\n/g, '<br>')}</div>`);
    if (r.signature) rows.push(`<div class="row"><span class="label">食客提示</span>${esc(r.signature)}</div>`);
    if (r.coord_note) rows.push(`<div class="row muted">${esc(r.coord_note)}</div>`);

    const actions = [];
    if (r.links && r.links.amap) {
      actions.push(`<a class="btn primary" target="_blank" rel="noopener" href="${esc(r.links.amap)}">在高德地圖打開</a>`);
    }
    if (r.links && r.links.official) {
      actions.push(`<a class="btn" target="_blank" rel="noopener" href="${esc(r.links.official)}">官方連結</a>`);
    }
    if (r.links && r.links.mgto) {
      actions.push(`<a class="btn" target="_blank" rel="noopener" href="${esc(r.links.mgto)}">澳門旅遊局</a>`);
    }
    if (r.links && r.links.maps_fallback) {
      actions.push(`<a class="btn ghost" target="_blank" rel="noopener" href="${esc(r.links.maps_fallback)}">Google 地圖</a>`);
    }

    el.detailBody.innerHTML = `
      <h2>${esc(r.name)}</h2>
      <div class="awards">${awards}</div>
      ${rows.join('')}
      <div class="actions">${actions.join('')}</div>
      <p class="muted" style="margin-top:12px">${esc(r.source || '')}</p>
    `;
    el.detail.classList.remove('hidden');
  }

  document.getElementById('btnTogglePanel').addEventListener('click', () => {
    setView(state.view === 'list' ? 'map' : 'list');
  });
  document.getElementById('btnCloseDetail').addEventListener('click', () => {
    el.detail.classList.add('hidden');
    state.activeId = null;
  });
  document.getElementById('btnClear').addEventListener('click', () => {
    state.groups.clear(); state.areas.clear(); state.cats.clear();
    state.q = ''; el.search.value = '';
    renderChips(); refresh();
  });
  document.getElementById('btnToggleCats').addEventListener('click', () => {
    el.catFilters.classList.toggle('hidden');
  });
  el.btnModeMap.addEventListener('click', () => setView('map'));
  el.btnModeList.addEventListener('click', () => setView('list'));
  el.navMap.addEventListener('click', () => setView('map'));
  el.navList.addEventListener('click', () => setView('list'));

  el.search.addEventListener('input', () => {
    state.q = el.search.value.trim().toLowerCase();
    refresh();
  });
  el.groupFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip.group');
    if (!btn) return;
    const id = btn.dataset.group;
    if (state.groups.has(id)) state.groups.delete(id); else state.groups.add(id);
    btn.classList.toggle('on');
    refresh();
  });
  el.catFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip.cat');
    if (!btn) return;
    const id = btn.dataset.cat;
    if (state.cats.has(id)) state.cats.delete(id); else state.cats.add(id);
    btn.classList.toggle('on');
    refresh();
  });
  el.areaFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip.area');
    if (!btn) return;
    const id = btn.dataset.area;
    if (state.areas.has(id)) state.areas.delete(id); else state.areas.add(id);
    btn.classList.toggle('on');
    refresh();
  });
  el.list.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    selectRestaurant(li.dataset.id, true);
  });

  MQ.addEventListener('change', () => {
    setTimeout(resizeMap, 100);
  });
  window.addEventListener('resize', () => resizeMap());
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeMap, 300);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => resizeMap());
  }

  fetch('data/restaurants.json')
    .then((r) => r.json())
    .then((data) => {
      state.data = data;
      renderChips();
      setView('map');
      refresh();
      resizeMap();
      setTimeout(resizeMap, 100);
      setTimeout(resizeMap, 400);
      setTimeout(resizeMap, 1000);
    })
    .catch((err) => {
      el.resultCount.textContent = '資料載入失敗';
      console.error(err);
    });
})();
