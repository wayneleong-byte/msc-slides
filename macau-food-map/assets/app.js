(() => {
  const MACAU_CENTER = [22.175, 113.55];
  const MQ = window.matchMedia('(max-width: 899px)');
  const state = {
    data: null,
    groups: new Set(),
    cats: new Set(),
    q: '',
    markers: {},
    activeId: null,
    soloId: null,
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
    detail: document.getElementById('detail'),
    detailBody: document.getElementById('detailBody'),
    btnModeMap: document.getElementById('btnModeMap'),
    btnModeList: document.getElementById('btnModeList'),
    navMap: document.getElementById('navMap'),
    navList: document.getElementById('navList'),
    mapDiv: document.getElementById('map'),
    workspace: document.querySelector('.workspace'),
    soloBanner: document.getElementById('soloBanner'),
    soloText: document.getElementById('soloText'),
    btnClearSolo: document.getElementById('btnClearSolo'),
  };

  function isMobile() {
    return MQ.matches;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatSignature(sig) {
    if (sig == null || sig === '') return '';
    if (Array.isArray(sig)) return sig.filter(Boolean).join('、');
    return String(sig);
  }

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
    if (state.soloId && r.id !== state.soloId) return false;
    if (state.groups.size) {
      const ids = (r.award_groups || []).map((g) => g.id);
      if (![...state.groups].some((g) => ids.includes(g))) return false;
    }
    if (state.cats.size) {
      if (![...state.cats].some((c) => (r.categories || []).includes(c))) return false;
    }
    if (state.q) {
      const blob = [
        r.name, ...(r.aliases || []), ...(r.categories || []),
        r.address || '', r.area || '', formatSignature(r.signature),
        r.intro || '',
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

  function updateSoloBanner() {
    if (!el.soloBanner) return;
    if (!state.soloId) {
      el.soloBanner.classList.add('hidden');
      return;
    }
    const r = (state.data.restaurants || []).find((x) => x.id === state.soloId);
    el.soloText.textContent = r ? `只顯示：${r.name}` : '只顯示一間餐廳';
    el.soloBanner.classList.remove('hidden');
  }

  function clearSolo() {
    state.soloId = null;
    updateSoloBanner();
    refresh();
    if (state.activeId) {
      const r = (state.data.restaurants || []).find((x) => x.id === state.activeId);
      if (r) showDetail(r);
    }
  }

  function focusSoloOnMap(r) {
    setView('map');
    requestAnimationFrame(() => {
      resizeMap();
      setTimeout(resizeMap, 80);
      setTimeout(resizeMap, 300);
      if (r.lat != null && r.lng != null) {
        map.setView([r.lat, r.lng], 16, { animate: true });
        const m = state.markers[r.id];
        if (m) m.openTooltip();
      } else {
        el.pinHint.textContent = '此店暫無地圖座標，請用高德搜尋';
      }
    });
  }

  function soloRestaurant(id) {
    const r = (state.data.restaurants || []).find((x) => x.id === id);
    if (!r) return;
    state.soloId = id;
    state.activeId = id;
    updateSoloBanner();
    refresh();
    showDetail(r);
    focusSoloOnMap(r);
  }

  function toggleSolo(id, on) {
    if (on) soloRestaurant(id);
    else clearSolo();
  }

  function photoUrl(r) {
    return (r && r.photo) ? r.photo : 'assets/photos/placeholder.jpg';
  }

  function isPlaceholderPhoto(r) {
    return !!(r && (r.photo_is_placeholder || !(r.photo) || String(r.photo).includes('placeholder')));
  }

  function isUnofficialPhoto(r) {
    const note = (r && r.photo_note) || '';
    return note.includes('非官方') || note.includes('非官網') || note.includes('示意圖') || isPlaceholderPhoto(r);
  }

  function openLightbox(src, caption) {
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const cap = document.getElementById('lightboxCaption');
    if (!box || !img) return;
    img.src = src;
    img.alt = caption || '餐廳圖片';
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

  function soloToggleHtml(id) {
    const on = state.soloId === id;
    return `<label class="solo-toggle" data-solo-wrap="${esc(id)}">
      <input type="checkbox" data-solo-toggle="${esc(id)}" ${on ? 'checked' : ''} />
      <span class="sw" aria-hidden="true"></span>
      <span class="solo-label">只看這個定位${on ? '（開）' : '（關）'}</span>
    </label>`;
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
      const sig = formatSignature(r.signature);
      const intro = r.intro ? `<div class="intro">${esc(r.intro)}</div>` : '';
      const sigHtml = sig ? `<div class="sig">招牌：${esc(sig)}</div>` : '';
      const note = (r.address_note || (r.coord_note && String(r.coord_note).includes('非官網') ? '非官網來源' : ''))
        ? `<div class="note-warn">${esc(r.address_note || '非官網來源')}</div>` : '';
      const ph = isPlaceholderPhoto(r) ? ' ph' : '';
      const photoNote = isUnofficialPhoto(r)
        ? `<div class="note-warn">${esc(r.photo_note || '圖片非官方')}</div>` : '';
      const pSrc = photoUrl(r);
      return `<li data-id="${esc(r.id)}" class="card ${state.activeId === r.id ? 'active' : ''}">
        <img class="thumb${ph}" src="${esc(pSrc)}" alt="${esc(r.name)}" loading="lazy" width="88" height="88" data-full="${esc(pSrc)}" data-caption="${esc((r.photo_note ? r.name + ' · ' + r.photo_note : r.name))}" role="button" tabindex="0" />
        <div class="card-body">
          <div class="name">${esc(r.name)}</div>
          <div class="meta">${esc(loc)}${r.address ? ' · ' + esc(String(r.address).slice(0, 48)) : ''}</div>
          ${intro}${sigHtml}${note}${photoNote}
          <div class="tags">${tags}${more}</div>
          ${soloToggleHtml(r.id)}
        </div>
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
    const soloNote = state.soloId ? '（單店模式）' : '';
    el.pinHint.textContent = `地圖標記 ${withPin.length}／目前 ${rows.length} 間${soloNote}`;
    resizeMap();
    if (state.soloId && bounds.length === 1) {
      map.setView(bounds[0], 16);
    } else if (bounds.length >= 2) {
      try { map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 }); } catch (_) {}
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }

  function refresh() {
    const rows = filtered();
    el.resultCount.textContent = state.soloId
      ? `單店模式 · ${rows.length} 間`
      : `顯示 ${rows.length} 間`;
    renderList(rows);
    renderMap(rows);
    updateSoloBanner();
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
    const sig = formatSignature(r.signature);
    const rows = [];
    if (r.intro) rows.push(`<p class="intro">${esc(r.intro)}</p>`);
    if (sig) rows.push(`<div class="sig-line"><span class="label">招牌食物</span>${esc(sig)}</div>`);
    if (r.area) rows.push(`<div class="row"><span class="label">地區</span>${esc(r.area)}</div>`);
    if (r.address) rows.push(`<div class="row"><span class="label">地址</span>${esc(r.address)}</div>`);
    else rows.push(`<div class="row"><span class="label">地址</span>待補（可用高德搜尋）</div>`);
    if (r.address_note) rows.push(`<div class="row" style="color:#f0a070">${esc(r.address_note)}</div>`);
    else if (r.coord_note && String(r.coord_note).includes('非官網')) {
      rows.push(`<div class="row" style="color:#f0a070">非官網來源</div>`);
    }
    if (r.phone) rows.push(`<div class="row"><span class="label">電話</span><a href="tel:${esc(r.phone)}" style="color:inherit">${esc(r.phone)}</a></div>`);
    if (r.hours) rows.push(`<div class="row"><span class="label">營業時間</span>${esc(r.hours).replace(/\n/g, '<br>')}</div>`);
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

    const ph = isPlaceholderPhoto(r) ? ' ph' : '';
    const photoNote = r.photo_note
      ? `<div class="photo-note">${esc(r.photo_note)}</div>` : '';
    const pSrc = photoUrl(r);
    const pCap = r.photo_note ? `${r.name} · ${r.photo_note}` : r.name;

    el.detailBody.innerHTML = `
      <img class="hero${ph}" src="${esc(pSrc)}" alt="${esc(r.name)}" loading="lazy" data-full="${esc(pSrc)}" data-caption="${esc(pCap)}" role="button" tabindex="0" />
      ${photoNote}
      <h2>${esc(r.name)}</h2>
      <div class="awards">${awards}</div>
      ${soloToggleHtml(r.id)}
      ${rows.join('')}
      <div class="actions">${actions.join('')}</div>
      <p class="muted" style="margin-top:12px">${esc(r.source || '')}</p>
    `;
    el.detail.classList.remove('hidden');
    document.body.classList.add('detail-open');
    const tog = el.detailBody.querySelector('[data-solo-toggle]');
    if (tog) tog.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleSolo(r.id, tog.checked);
    });
    const hero = el.detailBody.querySelector('img.hero[data-full]');
    if (hero) {
      const open = (e) => {
        e.stopPropagation();
        openLightbox(hero.dataset.full, hero.dataset.caption || '');
      };
      hero.addEventListener('click', open);
      hero.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
      });
    }
  }

  document.getElementById('btnTogglePanel').addEventListener('click', () => {
    setView(state.view === 'list' ? 'map' : 'list');
  });
  document.getElementById('btnCloseDetail').addEventListener('click', () => {
    el.detail.classList.add('hidden');
    document.body.classList.remove('detail-open');
    state.activeId = null;
  });
  document.getElementById('btnClear').addEventListener('click', () => {
    state.groups.clear(); state.cats.clear();
    state.q = ''; el.search.value = '';
    state.soloId = null;
    updateSoloBanner();
    renderChips(); refresh();
  });
  document.getElementById('btnToggleCats').addEventListener('click', () => {
    el.catFilters.classList.toggle('hidden');
  });
  if (el.btnClearSolo) {
    el.btnClearSolo.addEventListener('click', () => clearSolo());
  }
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
  el.list.addEventListener('click', (e) => {
    const wrap = e.target.closest('[data-solo-wrap]');
    if (wrap) {
      e.stopPropagation();
      return;
    }
    const thumb = e.target.closest('img.thumb[data-full]');
    if (thumb) {
      e.stopPropagation();
      openLightbox(thumb.dataset.full, thumb.dataset.caption || '');
      return;
    }
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    selectRestaurant(li.dataset.id, true);
  });
  el.list.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const thumb = e.target.closest('img.thumb[data-full]');
    if (!thumb) return;
    e.preventDefault();
    openLightbox(thumb.dataset.full, thumb.dataset.caption || '');
  });
  el.list.addEventListener('change', (e) => {
    const tog = e.target.closest('[data-solo-toggle]');
    if (!tog) return;
    e.stopPropagation();
    toggleSolo(tog.dataset.soloToggle, tog.checked);
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


  const lightbox = document.getElementById('lightbox');
  const lightboxClose = document.getElementById('lightboxClose');
  if (lightboxClose) lightboxClose.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.id === 'lightboxCaption') closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  fetch('data/restaurants.json?v=6')
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
