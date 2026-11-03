(() => {
  "use strict";

  const ECO_LIST = [
    { id: "savanna", name_zh: "熱帶稀樹草原", file: "data/ecosystems/savanna.json" },
    { id: "temperate_forest", name_zh: "溫帶林", file: "data/ecosystems/temperate_forest.json" },
    { id: "mangrove", name_zh: "紅樹林濕地", file: "data/ecosystems/mangrove.json" },
    { id: "freshwater_lake", name_zh: "淡水湖泊", file: "data/ecosystems/freshwater_lake.json" },
    { id: "coral_reef", name_zh: "珊瑚礁", file: "data/ecosystems/coral_reef.json" },
    { id: "tropical_rainforest", name_zh: "熱帶雨林", file: "data/ecosystems/tropical_rainforest.json" },
    { id: "desert", name_zh: "沙漠／乾旱荒漠", file: "data/ecosystems/desert.json" },
  ];

  const DATA = {
    glossary: "data/glossary.json",
    quiz: "data/quiz/bank-v1.json",
  };

  const RELATION = {
    predation: { zh: "捕食", color: "var(--rel-predation)", marker: "url(#arrowPredation)", feed: true },
    herbivory: { zh: "草食", color: "var(--rel-herbivory)", marker: "url(#arrowHerbivory)", feed: true },
    competition: { zh: "競爭", color: "var(--rel-competition)", marker: null, feed: false, dashed: true },
    mutualism: { zh: "互利", color: "var(--rel-mutualism)", marker: "url(#arrowMutualism)", feed: false, sym: "＋／＋" },
    parasitism: { zh: "寄生", color: "var(--rel-parasitism)", marker: "url(#arrowParasitism)", feed: true, sym: "＋／－" },
    commensalism: { zh: "偏利", color: "var(--rel-commensalism)", marker: "url(#arrowCommensalism)", feed: false, sym: "＋／0" },
    detritivory: { zh: "食碎屑", color: "var(--rel-detritivory)", marker: "url(#arrowDetritivory)", feed: true },
  };

  const TROPHIC = {
    producer: { zh: "生產者", color: "var(--troph-producer)" },
    primary_consumer: { zh: "初級消費者", color: "var(--troph-primary)" },
    secondary_consumer: { zh: "次級消費者", color: "var(--troph-secondary)" },
    apex_consumer: { zh: "頂級／近頂級", color: "var(--troph-apex)" },
    decomposer: { zh: "分解者", color: "var(--troph-decomposer)" },
  };

  const IDLE_MS = 60000;
  const NODE_R = 34;
  const QUIZ_N = 9;

  /* R4 — 教學簡化種群模型（自研；非真實預測） */
  const SIM_STEPS = 64;
  const SIM_DT = 0.35;
  const SIM_HALF = 24;
  const SIM_EAT = 0.048;
  const SIM_CONV = 0.78;
  const SIM_MORT = 0.055;
  const SIM_COMP = 0.022;
  const SIM_MUT = 0.012;
  const SIM_COMM = 0.008;
  const SIM_R_PROD = 0.22;
  const SIM_DENS = 0.05;
  const SIM_BASE_GAIN = 0.025;
  const SIM_N_MIN = 0.5;
  const SIM_N_MAX = 100;
  const SIM_FEED = new Set(["predation", "herbivory", "detritivory", "parasitism"]);
  const SIM_INIT = {
    producer: 78,
    primary_consumer: 42,
    secondary_consumer: 24,
    apex_consumer: 15,
    decomposer: 32,
  };
  const SIM_K = {
    producer: 100,
    primary_consumer: 58,
    secondary_consumer: 38,
    apex_consumer: 24,
    decomposer: 48,
  };
  const POP_CHART = { w: 340, h: 168, padL: 36, padR: 10, padT: 10, padB: 22 };

  const state = {
    ecoId: "savanna",
    eco: null,
    glossary: null,
    quizBank: null,
    selectedIds: new Set(),
    positions: new Map(),
    filterRelation: "all",
    selectedNodeId: null,
    selectedEdgeKey: null,
    drag: null,
    labDrag: null,
    idleTimer: null,
    idleOn: false,
    titleOpen: true,
    quiz: null,
    popSeries: null,
    popTerminal: new Map(),
    popAnim: null,
    popHighlight: null,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function showError(msg) {
    const el = $("#loadError");
    el.hidden = false;
    el.textContent = msg;
    $("#mainLayout").hidden = true;
  }

  async function loadJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`無法載入 ${url}（HTTP ${res.status}）`);
    return res.json();
  }

  function ecoMeta(id) {
    return ECO_LIST.find((e) => e.id === id) || ECO_LIST[0];
  }

  function applyEcoChrome(eco) {
    const name = eco.name_zh || ecoMeta(state.ecoId).name_zh;
    const title = `生態網｜${name}`;
    document.title = title;
    const h1 = $(".brand h1");
    if (h1) h1.textContent = title;
    $("#disclaimerBanner").textContent =
      eco.disclaimer_zh || "教學簡化：物種與連線為課堂可見模型，唔等於真實完整生態。";
    const kicker = $(".title-kicker");
    if (kicker) kicker.textContent = `課堂互動 · ${name}`;
    const th = $("#titleLayerHeading");
    if (th) th.textContent = title;
    const blurb = $(".title-blurb");
    if (blurb) {
      blurb.textContent = `${eco.scene_zh || name}：把物種拖入場景，觀察能量與互動如何串成食物網。可篩選關係、查看詳情，並用通識自評檢視理解。`;
    }
    const td = $(".title-disclaimer");
    if (td) {
      td.textContent =
        eco.disclaimer_zh ||
        "教學簡化：物種與連線為課堂可見模型，刻意控層級與數量，唔等於真實完整生態系。";
    }
    const sel = $("#ecoSelect");
    if (sel && sel.value !== state.ecoId) sel.value = state.ecoId;
  }

  function refreshAbiotic() {
    const abiotic = $("#abioticTags");
    if (!abiotic) return;
    abiotic.innerHTML = "";
    for (const a of state.eco.abiotic || []) {
      const span = document.createElement("span");
      span.className = "tag abiotic";
      span.textContent = a;
      abiotic.appendChild(span);
    }
  }

  async function switchEcosystem(id, { resetDemo = true, showTitle = false } = {}) {
    const meta = ecoMeta(id);
    const eco = await loadJson(meta.file);
    state.ecoId = meta.id;
    state.eco = eco;
    state.selectedNodeId = null;
    state.selectedEdgeKey = null;
    state.filterRelation = "all";
    state.popSeries = null;
    state.popTerminal = new Map();
    state.popHighlight = null;
    applyEcoChrome(eco);
    refreshAbiotic();
    // reset relation chips active state
    const filters = $("#relationFilters");
    if (filters) {
      $$(".chip", filters).forEach((c) => c.classList.toggle("active", c.dataset.rel === "all"));
    }
    initSelection(false);
    layoutInitial();
    renderAll();
    if (window.EcoWebEnvBg && typeof window.EcoWebEnvBg.setScene === "function") {
      window.EcoWebEnvBg.setScene(meta.id);
    } else if (window.EcoWebEnvBg && typeof window.EcoWebEnvBg.resize === "function") {
      window.EcoWebEnvBg.resize();
    }
    if (resetDemo) {
      // empty net is default; caller may load demo separately
    }
    if (showTitle) showTitleLayer(true);
    bumpIdle();
  }

  async function boot() {
    try {
      const params = new URLSearchParams(location.search);
      const initialEco = params.get("eco") || "savanna";
      state.ecoId = ecoMeta(initialEco).id;
      const [eco, glossary, quizBank] = await Promise.all([
        loadJson(ecoMeta(state.ecoId).file),
        loadJson(DATA.glossary),
        loadJson(DATA.quiz),
      ]);
      state.eco = eco;
      state.glossary = glossary;
      state.quizBank = quizBank;
      applyEcoChrome(eco);
      $("#glossaryDisclaimer").textContent = glossary.disclaimer_zh || "";
      // R3：預設空網
      initSelection(false);
      layoutInitial();
      buildStaticUi();
      renderAll();
      $("#mainLayout").hidden = false;
      if (window.EcoWebEnvBg && typeof window.EcoWebEnvBg.setScene === "function") {
        window.EcoWebEnvBg.setScene(state.ecoId);
      } else if (window.EcoWebEnvBg && typeof window.EcoWebEnvBg.resize === "function") {
        window.EcoWebEnvBg.resize();
      }
      bindGlobal();
      showTitleLayer(true);
    } catch (err) {
      console.error(err);
      showError(`資料載入失敗：${err.message || err}。請用本機 HTTP 伺服器開啟（見 README）。`);
    }
  }

  function initSelection(full) {
    state.selectedIds = new Set(full ? state.eco.species.map((s) => s.id) : []);
  }

  function speciesById(id) {
    return state.eco.species.find((s) => s.id === id);
  }

  function visibleSpecies() {
    return state.eco.species.filter((s) => state.selectedIds.has(s.id));
  }

  function visibleEdges() {
    const ids = state.selectedIds;
    return state.eco.edges.filter(
      (e) =>
        ids.has(e.from) &&
        ids.has(e.to) &&
        (state.filterRelation === "all" || e.relation === state.filterRelation)
    );
  }

  function allEdgesAmongSelected() {
    const ids = state.selectedIds;
    return state.eco.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  }

  function layoutInitial() {
    const wrap = $("#canvasWrap");
    const w = Math.max(wrap.clientWidth || 900, 640);
    const h = Math.max(wrap.clientHeight || 560, 480);
    const svg = $("#webSvg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    const bands = {
      producer: 0.12,
      primary_consumer: 0.32,
      secondary_consumer: 0.55,
      apex_consumer: 0.78,
      decomposer: 0.92,
    };
    const groups = {};
    for (const s of state.eco.species) {
      (groups[s.trophic] || (groups[s.trophic] = [])).push(s);
    }
    state.positions.clear();
    for (const [trophic, list] of Object.entries(groups)) {
      const y = (bands[trophic] || 0.5) * h;
      list.forEach((s, i) => {
        const x = ((i + 1) / (list.length + 1)) * w;
        const jitter = ((i % 3) - 1) * 18;
        state.positions.set(s.id, { x: x + jitter * 0.2, y: y + jitter });
      });
    }
  }

  function ensurePosition(id, prefer) {
    if (state.positions.has(id) && !prefer) return state.positions.get(id);
    if (prefer) {
      state.positions.set(id, prefer);
      return prefer;
    }
    const svg = $("#webSvg");
    const vb = svg.viewBox.baseVal;
    const w = vb.width || 900;
    const h = vb.height || 560;
    const s = speciesById(id);
    const bands = {
      producer: 0.18,
      primary_consumer: 0.36,
      secondary_consumer: 0.55,
      apex_consumer: 0.74,
      decomposer: 0.88,
    };
    const y = (bands[s?.trophic] || 0.5) * h;
    const existing = [...state.selectedIds].filter((x) => x !== id);
    const x = ((existing.length % 5) + 1) / 6 * w + ((existing.length % 3) - 1) * 12;
    const pos = { x: clamp(x, NODE_R + 8, w - NODE_R - 8), y: clamp(y, NODE_R + 8, h - NODE_R - 8) };
    state.positions.set(id, pos);
    return pos;
  }

  function buildStaticUi() {
    refreshAbiotic();

    const filters = $("#relationFilters");
    filters.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "chip active";
    allBtn.dataset.rel = "all";
    allBtn.textContent = "全部關係";
    filters.appendChild(allBtn);
    for (const [key, meta] of Object.entries(RELATION)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.dataset.rel = key;
      btn.innerHTML = `<span class="dot" style="background:${meta.color}"></span>${meta.zh}`;
      filters.appendChild(btn);
    }
    filters.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".chip");
      if (!btn) return;
      state.filterRelation = btn.dataset.rel;
      $$(".chip", filters).forEach((c) => c.classList.toggle("active", c === btn));
      renderGraph();
      bumpIdle();
    });

    const lr = $("#legendRelations");
    lr.innerHTML = "";
    for (const [key, meta] of Object.entries(RELATION)) {
      const item = document.createElement("div");
      item.className = "legend-item";
      if (meta.dashed) {
        item.innerHTML = `<span class="swatch dashed"></span>${meta.zh}`;
      } else {
        item.innerHTML = `<span class="swatch" style="background:${meta.color}"></span>${meta.zh}${meta.sym ? "（" + meta.sym + "）" : ""}`;
      }
      lr.appendChild(item);
    }
    const lt = $("#legendTrophic");
    lt.innerHTML = "";
    for (const meta of Object.values(TROPHIC)) {
      const item = document.createElement("div");
      item.className = "legend-item";
      item.innerHTML = `<span class="dot-swatch" style="background:${meta.color}"></span>${meta.zh}`;
      lt.appendChild(item);
    }

    renderLab();
  }

  function producerCount() {
    return visibleSpecies().filter((s) => s.trophic === "producer").length;
  }

  function renderLab() {
    const list = $("#labList");
    list.innerHTML = "";
    for (const s of state.eco.species) {
      const row = document.createElement("div");
      row.className = "lab-item" + (state.selectedIds.has(s.id) ? " in-net" : "");
      row.dataset.id = s.id;
      row.setAttribute("draggable", "false");
      const color = TROPHIC[s.trophic]?.color || "#888";
      const inNet = state.selectedIds.has(s.id);
      const thumbSrc = s.avatar || s.image;
      const thumb = thumbSrc
        ? `<img class="lab-thumb" src="${escapeHtml(thumbSrc)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'troph-pip',style:'background:${color}'}))" />`
        : `<span class="troph-pip" style="background:${color}"></span>`;
      row.innerHTML = `
        ${thumb}
        <span class="lab-name">${escapeHtml(s.name_zh)}</span>
        ${inNet ? '<span class="lab-badge">已在網</span>' : '<button type="button" class="lab-alt" data-add="' + s.id + '">或點一下加入</button>'}
      `;
      row.addEventListener("pointerdown", onLabPointerDown);
      list.appendChild(row);
    }
    list.onclick = (ev) => {
      const addBtn = ev.target.closest("[data-add]");
      if (!addBtn) return;
      ev.stopPropagation();
      addSpeciesToNet(addBtn.dataset.add);
    };
    updateLabWarn();
  }

  function updateLabWarn() {
    const warn = $("#labWarn");
    const n = state.selectedIds.size;
    warn.hidden = n === 0 || producerCount() >= 2;
  }

  function edgeKey(e) {
    return `${e.from}|${e.to}|${e.relation}`;
  }

  function renderAll() {
    renderLab();
    refreshPopulationModel();
    renderGraph();
    renderDetail();
    updateStats();
    renderPopulationChart(true);
  }

  function updateStats() {
    const speciesN = state.selectedIds.size;
    const totalEdges = allEdgesAmongSelected().length;
    const prod = producerCount();
    const set = (id, v) => {
      const el = $(id);
      if (el) el.textContent = String(v);
    };
    set("#statSpecies", speciesN);
    set("#statEdgesTotal", totalEdges);
    set("#statProducers", prod);
  }

  /* —— R4 種群模擬與曲線 —— */
  function speciesLineColor(s) {
    const base = cssColor(TROPHIC[s.trophic]?.color || "#888");
    // 穩定微調：同營養級多物種用哈希微偏色相，方便區分
    let h = 0;
    for (let i = 0; i < s.id.length; i++) h = (h * 31 + s.id.charCodeAt(i)) >>> 0;
    const shift = (h % 40) - 20;
    return shiftHex(base, shift);
  }

  function shiftHex(hex, degHint) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    let r = (n >> 16) & 255;
    let g = (n >> 8) & 255;
    let b = n & 255;
    r = clamp(r + (degHint % 17), 30, 220);
    g = clamp(g + ((degHint * 3) % 13) - 6, 30, 220);
    b = clamp(b - (degHint % 11), 20, 200);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function refreshPopulationModel() {
    const ids = [...state.selectedIds];
    if (ids.length === 0) {
      state.popSeries = null;
      state.popTerminal = new Map();
      return;
    }
    const result = simulatePopulations(ids);
    state.popSeries = result.series;
    state.popTerminal = result.terminal;
  }

  /**
   * 離散時間教學模型：依食物網邊推消長。
   * 能量邊 from→to（資源→獲能方）；競爭互相抑制；無食消費者衰減。
   * 含承載力／阻尼，正常網趨向平衡；唔等於真實生態預測。
   */
  function simulatePopulations(ids) {
    const idSet = new Set(ids);
    const N = {};
    const series = {};
    for (const id of ids) {
      const s = speciesById(id);
      const t = s?.trophic || "primary_consumer";
      N[id] = SIM_INIT[t] ?? 30;
      series[id] = [N[id]];
    }

    const feedIn = {}; // resource -> [{consumer, rel}]
    const feedOut = {}; // consumer -> [{prey, rel}]
    const comp = {};
    const mut = {};
    const comm = {};
    for (const id of ids) {
      feedIn[id] = [];
      feedOut[id] = [];
      comp[id] = [];
      mut[id] = [];
      comm[id] = [];
    }
    // 模擬用全關係邊（唔受關係芯片篩選影響）
    for (const e of state.eco.edges) {
      if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
      if (SIM_FEED.has(e.relation)) {
        feedIn[e.from].push({ consumer: e.to, rel: e.relation });
        feedOut[e.to].push({ prey: e.from, rel: e.relation });
      } else if (e.relation === "competition") {
        comp[e.from].push(e.to);
        comp[e.to].push(e.from);
      } else if (e.relation === "mutualism") {
        mut[e.from].push(e.to);
        mut[e.to].push(e.from);
      } else if (e.relation === "commensalism") {
        comm[e.to].push(e.from);
      }
    }

    for (let step = 0; step < SIM_STEPS; step++) {
      const dN = {};
      for (const id of ids) {
        const s = speciesById(id);
        const troph = s?.trophic || "primary_consumer";
        const ni = N[id];
        const ki = SIM_K[troph] ?? 50;
        if (troph === "producer") {
          const growth = SIM_R_PROD * ni * (1 - ni / ki);
          let loss = 0;
          for (const { consumer } of feedIn[id]) {
            loss += (SIM_EAT * N[consumer] * ni) / (SIM_HALF + ni);
          }
          let boost = 0;
          for (const j of mut[id]) {
            boost += SIM_MUT * ni * (N[j] / (SIM_HALF + N[j]));
          }
          dN[id] = growth - loss + boost;
        } else {
          let gain = 0;
          let foodProxy = 0;
          let nFood = 0;
          for (const { prey, rel } of feedOut[id]) {
            nFood += 1;
            const np = N[prey];
            const rate = (SIM_EAT * ni * np) / (SIM_HALF + np);
            let c = SIM_CONV;
            if (rel === "parasitism") c *= 0.75;
            if (rel === "detritivory") c *= 0.9;
            gain += c * rate;
            foodProxy += np / (SIM_HALF + np);
          }
          const foodFrac = nFood === 0 ? 0 : Math.min(1, foodProxy / nFood);
          const mort = SIM_MORT * ni * (1.05 - 0.55 * foodFrac);
          const dens = (SIM_DENS * ni * ni) / ki;
          let closs = 0;
          for (const j of comp[id]) {
            closs += (SIM_COMP * ni * N[j]) / (SIM_HALF + N[j]);
          }
          let boost = 0;
          for (const j of mut[id]) {
            boost += SIM_MUT * ni * (N[j] / (SIM_HALF + N[j]));
          }
          for (const j of comm[id]) {
            boost += SIM_COMM * ni * (N[j] / (SIM_HALF + N[j]));
          }
          const soft = 0.06 * ni * (1 - ni / ki) * foodFrac;
          gain += SIM_BASE_GAIN * ni * foodFrac;
          dN[id] = gain - mort - dens - closs + boost + soft;
        }
      }
      for (const id of ids) {
        N[id] = clamp(N[id] + SIM_DT * dN[id], SIM_N_MIN, SIM_N_MAX);
        series[id].push(N[id]);
      }
    }

    const terminal = new Map();
    for (const id of ids) terminal.set(id, N[id]);
    return { series, terminal };
  }

  function nodeRadiusFor(id) {
    const term = state.popTerminal.get(id);
    if (term == null) return NODE_R;
    // 終末種群微調半徑（可讀範圍）
    const t = (term - SIM_N_MIN) / (SIM_N_MAX - SIM_N_MIN);
    return NODE_R * (0.82 + 0.36 * clamp(t, 0, 1));
  }

  function renderPopulationChart(animate) {
    const empty = $("#popEmpty");
    const body = $("#popChartBody");
    if (!state.popSeries || state.selectedIds.size === 0) {
      if (state.popAnim) {
        cancelAnimationFrame(state.popAnim.raf);
        state.popAnim = null;
      }
      empty.hidden = false;
      body.hidden = true;
      return;
    }
    empty.hidden = true;
    body.hidden = false;

    const ids = [...state.selectedIds];
    const series = state.popSeries;
    let yMax = 1;
    for (const id of ids) {
      for (const v of series[id]) yMax = Math.max(yMax, v);
    }
    yMax = Math.max(20, Math.ceil(yMax / 10) * 10);

    drawPopAxes(yMax);
    renderPopLegend(ids);

    const target = {};
    for (const id of ids) target[id] = series[id];

    if (!animate) {
      drawPopLines(ids, target, 1, yMax);
      return;
    }

    if (state.popAnim) {
      cancelAnimationFrame(state.popAnim.raf);
      state.popAnim = null;
    }
    const t0 = performance.now();
    const dur = 520;
    const tick = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      // ease-out：時間軸快速重播
      const ease = 1 - Math.pow(1 - p, 2.2);
      drawPopLines(ids, target, ease, yMax);
      if (p < 1) {
        state.popAnim = { raf: requestAnimationFrame(tick) };
      } else {
        state.popAnim = null;
      }
    };
    state.popAnim = { raf: requestAnimationFrame(tick) };
  }

  function drawPopAxes(yMax) {
    const g = $("#popAxes");
    g.innerHTML = "";
    const { w, h, padL, padR, padT, padB } = POP_CHART;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const grid = document.createElementNS("http://www.w3.org/2000/svg", "g");
    grid.setAttribute("class", "pop-grid");
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH * i) / 4;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", padL);
      line.setAttribute("x2", padL + plotW);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      grid.appendChild(line);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "pop-axis-text");
      label.setAttribute("x", padL - 4);
      label.setAttribute("y", y + 3);
      label.setAttribute("text-anchor", "end");
      label.textContent = String(Math.round(yMax * (1 - i / 4)));
      g.appendChild(label);
    }
    g.appendChild(grid);

    const x0 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    x0.setAttribute("class", "pop-axis-text");
    x0.setAttribute("x", padL);
    x0.setAttribute("y", h - 6);
    x0.textContent = "0";
    g.appendChild(x0);
    const x1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    x1.setAttribute("class", "pop-axis-text");
    x1.setAttribute("x", padL + plotW);
    x1.setAttribute("y", h - 6);
    x1.setAttribute("text-anchor", "end");
    x1.textContent = String(SIM_STEPS);
    g.appendChild(x1);
  }

  function drawPopLines(ids, seriesMap, progress, yMax) {
    const linesG = $("#popLines");
    linesG.innerHTML = "";
    const { w, h, padL, padR, padT, padB } = POP_CHART;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const stepsVisible = Math.max(1, Math.floor(SIM_STEPS * progress));

    for (const id of ids) {
      const arr = seriesMap[id];
      if (!arr || arr.length < 2) continue;
      const s = speciesById(id);
      const color = speciesLineColor(s);
      const endIdx = Math.min(arr.length - 1, stepsVisible);
      let d = "";
      for (let i = 0; i <= endIdx; i++) {
        const x = padL + (plotW * i) / SIM_STEPS;
        const y = padT + plotH * (1 - arr[i] / yMax);
        d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2);
      }
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "pop-line");
      path.setAttribute("d", d);
      path.setAttribute("stroke", color);
      path.dataset.id = id;
      if (state.popHighlight) {
        path.classList.toggle("hl", state.popHighlight === id);
        path.classList.toggle("dim", state.popHighlight !== id);
      }
      linesG.appendChild(path);
    }
  }

  function renderPopLegend(ids) {
    const box = $("#popLegend");
    box.innerHTML = "";
    for (const id of ids) {
      const s = speciesById(id);
      if (!s) continue;
      const item = document.createElement("span");
      item.className = "pop-legend-item" + (state.popHighlight === id ? " hl" : "");
      item.dataset.id = id;
      item.title = s.name_zh;
      const sw = document.createElement("span");
      sw.className = "pop-legend-swatch";
      sw.style.background = speciesLineColor(s);
      item.appendChild(sw);
      item.appendChild(document.createTextNode(shortName(s.name_zh)));
      item.addEventListener("pointerenter", () => {
        state.popHighlight = id;
        $$("#popLines .pop-line").forEach((p) => {
          p.classList.toggle("hl", p.dataset.id === id);
          p.classList.toggle("dim", p.dataset.id !== id);
        });
        $$("#popLegend .pop-legend-item").forEach((el) =>
          el.classList.toggle("hl", el.dataset.id === id)
        );
      });
      item.addEventListener("pointerleave", () => {
        state.popHighlight = null;
        $$("#popLines .pop-line").forEach((p) => p.classList.remove("hl", "dim"));
        $$("#popLegend .pop-legend-item").forEach((el) => el.classList.remove("hl"));
      });
      box.appendChild(item);
    }
  }

  function renderGraph() {
    const svg = $("#webSvg");
    const wrap = $("#canvasWrap");
    const w = Math.max(wrap.clientWidth || 900, 640);
    const h = Math.max(wrap.clientHeight || 560, 480);
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    const edgesG = $("#edgesLayer");
    const nodesG = $("#nodesLayer");
    edgesG.innerHTML = "";
    nodesG.innerHTML = "";

    // empty hint
    let hint = wrap.querySelector(".empty-net-hint");
    if (state.selectedIds.size === 0) {
      if (!hint) {
        hint = document.createElement("div");
        hint.className = "empty-net-hint";
        hint.innerHTML = "<p>將右側物種拖入草地開始組網</p>";
        wrap.appendChild(hint);
      }
      hint.hidden = false;
    } else if (hint) {
      hint.hidden = true;
    }

    const edges = visibleEdges();
    const species = visibleSpecies();

    for (const e of edges) {
      const a = state.positions.get(e.from);
      const b = state.positions.get(e.to);
      if (!a || !b) continue;
      appendEdge(edgesG, e, a, b);
    }

    for (const s of species) {
      const pos = state.positions.get(s.id) || ensurePosition(s.id);
      const g = buildNodeEl(s, pos);
      nodesG.appendChild(g);
    }

    if (state.selectedNodeId) {
      const neigh = new Set([state.selectedNodeId]);
      for (const e of allEdgesAmongSelected()) {
        if (e.from === state.selectedNodeId || e.to === state.selectedNodeId) {
          neigh.add(e.from);
          neigh.add(e.to);
        }
      }
      $$(".node-g", nodesG).forEach((g) => {
        if (!neigh.has(g.dataset.id)) g.classList.add("dim");
      });
      $$(".edge-path", edgesG).forEach((p) => {
        const [f, t] = p.dataset.key.split("|");
        if (f !== state.selectedNodeId && t !== state.selectedNodeId) p.classList.add("dim");
      });
    }

    updateStats();
  }

  function appendEdge(edgesG, e, a, b) {
    const meta = RELATION[e.relation] || RELATION.predation;
    const { x1, y1, x2, y2 } = shorten(
      a.x, a.y, b.x, b.y,
      nodeRadiusFor(e.from) + 2,
      nodeRadiusFor(e.to) + 2
    );
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * 12;
    const oy = (dx / len) * 12;
    const cx = midX + ox * 0.35;
    const cy = midY + oy * 0.35;
    path.setAttribute("d", `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    path.setAttribute("class", "edge-path");
    path.setAttribute("stroke", cssColor(meta.color));
    path.dataset.key = edgeKey(e);
    path.dataset.from = e.from;
    path.dataset.to = e.to;
    path.dataset.relation = e.relation;
    if (meta.dashed) {
      path.setAttribute("stroke-dasharray", "5 4");
      path.removeAttribute("marker-end");
    } else if (meta.marker) {
      path.setAttribute("marker-end", meta.marker);
    }
    if (state.selectedEdgeKey === edgeKey(e)) path.classList.add("selected");
    path.addEventListener("click", (ev) => {
      ev.stopPropagation();
      state.selectedEdgeKey = edgeKey(e);
      state.selectedNodeId = null;
      renderGraph();
      renderDetail();
      bumpIdle();
    });
    edgesG.appendChild(path);

    if (e.relation === "competition" || meta.sym) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "edge-label");
      label.setAttribute("x", cx);
      label.setAttribute("y", cy - 4);
      label.setAttribute("text-anchor", "middle");
      label.dataset.from = e.from;
      label.dataset.to = e.to;
      label.dataset.relation = e.relation;
      label.textContent = e.relation === "competition" ? "競爭" : meta.sym || meta.zh;
      edgesG.appendChild(label);
    }
  }


  function addNodePlaceholder(parent, s, rNode) {
    const r = rNode || NODE_R;
    const ph = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    ph.setAttribute("class", "node-placeholder");
    ph.setAttribute("x", String(-r * 0.55));
    ph.setAttribute("y", String(-r * 0.55));
    ph.setAttribute("width", String(r * 1.1));
    ph.setAttribute("height", String(r * 0.7));
    ph.setAttribute("rx", "4");
    parent.appendChild(ph);
    const initial = document.createElementNS("http://www.w3.org/2000/svg", "text");
    initial.setAttribute("class", "node-placeholder-text");
    initial.setAttribute("y", String(-r * 0.05));
    initial.textContent = (s.name_zh || "?").slice(0, 2);
    parent.appendChild(initial);
  }

  function buildNodeEl(s, pos) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "node-g" + (state.selectedNodeId === s.id ? " selected" : ""));
    g.dataset.id = s.id;
    g.setAttribute("transform", `translate(${pos.x},${pos.y})`);

    const rNode = nodeRadiusFor(s.id);
    const troph = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    troph.setAttribute("class", "node-troph");
    troph.setAttribute("r", rNode + 4);
    troph.setAttribute("fill", cssColor(TROPHIC[s.trophic]?.color || "#888"));
    troph.setAttribute("opacity", "0.35");
    g.appendChild(troph);

    const body = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    body.setAttribute("class", "node-body");
    body.setAttribute("r", rNode);
    g.appendChild(body);

    const clipId = `node-clip-${s.id}`;
    const defs = $("#webSvg defs");
    let cp = defs && defs.querySelector("#" + clipId);
    if (defs && !cp) {
      cp = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      cp.setAttribute("id", clipId);
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", "0");
      c.setAttribute("cy", "0");
      c.setAttribute("r", String(rNode));
      cp.appendChild(c);
      defs.appendChild(cp);
    } else if (cp) {
      const c = cp.querySelector("circle");
      if (c) c.setAttribute("r", String(rNode));
    }

    const photoWrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
    photoWrap.setAttribute("class", "node-photo-wrap");
    photoWrap.setAttribute("clip-path", `url(#${clipId})`);

    const nodeImg = s.avatar || s.image;
    if (nodeImg) {
      // Prefer HTML <img> in foreignObject — iOS Safari often fails SVG <image href="…webp/png">
      const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
      fo.setAttribute("class", "node-photo-fo");
      fo.setAttribute("x", String(-rNode));
      fo.setAttribute("y", String(-rNode));
      fo.setAttribute("width", String(rNode * 2));
      fo.setAttribute("height", String(rNode * 2));
      const htmlImg = document.createElement("img");
      htmlImg.className = "node-photo-html";
      htmlImg.src = nodeImg;
      htmlImg.alt = "";
      htmlImg.loading = "lazy";
      htmlImg.draggable = false;
      htmlImg.style.cssText = `width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;pointer-events:none;`;
      htmlImg.addEventListener("error", () => {
        fo.remove();
        // Fallback: SVG <image> (some desktop browsers)
        const svgImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
        svgImg.setAttribute("class", "node-photo");
        svgImg.setAttributeNS("http://www.w3.org/1999/xlink", "href", nodeImg);
        svgImg.setAttribute("href", nodeImg);
        svgImg.setAttribute("x", String(-rNode));
        svgImg.setAttribute("y", String(-rNode));
        svgImg.setAttribute("width", String(rNode * 2));
        svgImg.setAttribute("height", String(rNode * 2));
        svgImg.setAttribute("preserveAspectRatio", "xMidYMid slice");
        svgImg.addEventListener("error", () => {
          svgImg.remove();
          addNodePlaceholder(photoWrap, s, rNode);
        });
        photoWrap.appendChild(svgImg);
      });
      fo.appendChild(htmlImg);
      photoWrap.appendChild(fo);
    } else {
      addNodePlaceholder(photoWrap, s, rNode);
    }
    g.appendChild(photoWrap);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "node-label");
    label.setAttribute("y", 22);
    label.textContent = shortName(s.name_zh);
    g.appendChild(label);

    g.addEventListener("pointerdown", onNodeDown);
    g.addEventListener("dblclick", (ev) => {
      ev.stopPropagation();
      removeSpeciesFromNet(s.id);
    });
    g.addEventListener("click", (ev) => {
      if (state.drag && state.drag.moved) return;
      ev.stopPropagation();
      state.selectedNodeId = s.id;
      state.selectedEdgeKey = null;
      renderGraph();
      renderDetail();
      bumpIdle();
    });
    return g;
  }

  /** During drag: update node transform + redraw edges only (no full rebuild). */
  function updateEdgesLive() {
    const edgesG = $("#edgesLayer");
    edgesG.innerHTML = "";
    for (const e of visibleEdges()) {
      const a = state.positions.get(e.from);
      const b = state.positions.get(e.to);
      if (!a || !b) continue;
      appendEdge(edgesG, e, a, b);
    }
    if (state.selectedNodeId) {
      $$(".edge-path", edgesG).forEach((p) => {
        const [f, t] = p.dataset.key.split("|");
        if (f !== state.selectedNodeId && t !== state.selectedNodeId) p.classList.add("dim");
      });
    }
  }

  function shortName(name) {
    if (!name) return "";
    return name.length > 6 ? name.slice(0, 5) + "…" : name;
  }

  function cssColor(v) {
    if (!v) return "#ccc";
    if (v.startsWith("var(")) {
      const name = v.slice(4, -1).trim();
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#ccc";
    }
    return v;
  }

  function shorten(x1, y1, x2, y2, r1, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return {
      x1: x1 + ux * r1,
      y1: y1 + uy * r1,
      x2: x2 - ux * r2,
      y2: y2 - uy * r2,
    };
  }

  function onNodeDown(ev) {
    if (state.titleOpen) return;
    const g = ev.currentTarget;
    const id = g.dataset.id;
    const pos = state.positions.get(id);
    if (!pos) return;
    g.setPointerCapture(ev.pointerId);
    state.drag = {
      id,
      pointerId: ev.pointerId,
      ox: ev.clientX,
      oy: ev.clientY,
      startX: pos.x,
      startY: pos.y,
      moved: false,
      el: g,
    };
    g.classList.add("dragging");
    bumpIdle();
    g.addEventListener("pointermove", onNodeMove);
    g.addEventListener("pointerup", onNodeUp);
    g.addEventListener("pointercancel", onNodeUp);
  }

  function onNodeMove(ev) {
    if (!state.drag || state.drag.pointerId !== ev.pointerId) return;
    const svg = $("#webSvg");
    const pt = clientToSvg(svg, ev.clientX, ev.clientY);
    const start = clientToSvg(svg, state.drag.ox, state.drag.oy);
    const dx = pt.x - start.x;
    const dy = pt.y - start.y;
    if (Math.hypot(dx, dy) > 3) state.drag.moved = true;
    const vb = svg.viewBox.baseVal;
    const x = clamp(state.drag.startX + dx, NODE_R, vb.width - NODE_R);
    const y = clamp(state.drag.startY + dy, NODE_R, vb.height - NODE_R);
    state.positions.set(state.drag.id, { x, y });
    if (state.drag.el) {
      state.drag.el.setAttribute("transform", `translate(${x},${y})`);
    }
    updateEdgesLive();
    bumpIdle();
  }

  function onNodeUp(ev) {
    const g = ev.currentTarget;
    try {
      g.releasePointerCapture(ev.pointerId);
    } catch (_) { /* ignore */ }
    g.classList.remove("dragging");
    g.removeEventListener("pointermove", onNodeMove);
    g.removeEventListener("pointerup", onNodeUp);
    g.removeEventListener("pointercancel", onNodeUp);

    // drag off canvas → remove
    if (state.drag && state.drag.moved) {
      const wrap = $("#canvasWrap").getBoundingClientRect();
      const out =
        ev.clientX < wrap.left - 24 ||
        ev.clientX > wrap.right + 24 ||
        ev.clientY < wrap.top - 24 ||
        ev.clientY > wrap.bottom + 24;
      if (out) {
        const id = state.drag.id;
        setTimeout(() => {
          state.drag = null;
          removeSpeciesFromNet(id);
        }, 0);
        bumpIdle();
        return;
      }
    }

    setTimeout(() => {
      if (state.drag) state.drag = null;
    }, 0);
    bumpIdle();
  }

  function clientToSvg(svg, clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  /* —— Lab drag into canvas —— */
  function onLabPointerDown(ev) {
    if (state.titleOpen) return;
    if (ev.target.closest("[data-add]")) return;
    const row = ev.currentTarget;
    const id = row.dataset.id;
    if (!id) return;
    ev.preventDefault();
    row.setPointerCapture(ev.pointerId);
    state.labDrag = {
      id,
      pointerId: ev.pointerId,
      moved: false,
      startX: ev.clientX,
      startY: ev.clientY,
      row,
    };
    row.classList.add("dragging-src");
    const ghost = $("#dragGhost");
    const s = speciesById(id);
    ghost.textContent = s ? s.name_zh : id;
    ghost.hidden = false;
    ghost.style.left = ev.clientX + "px";
    ghost.style.top = ev.clientY + "px";

    const onMove = (e) => {
      if (!state.labDrag || state.labDrag.pointerId !== e.pointerId) return;
      if (Math.hypot(e.clientX - state.labDrag.startX, e.clientY - state.labDrag.startY) > 4) {
        state.labDrag.moved = true;
      }
      ghost.style.left = e.clientX + "px";
      ghost.style.top = e.clientY + "px";
      const wrap = $("#canvasWrap").getBoundingClientRect();
      const over =
        e.clientX >= wrap.left &&
        e.clientX <= wrap.right &&
        e.clientY >= wrap.top &&
        e.clientY <= wrap.bottom;
      $("#canvasWrap").classList.toggle("drop-hover", over);
    };
    const onUp = (e) => {
      row.releasePointerCapture(e.pointerId);
      row.classList.remove("dragging-src");
      row.removeEventListener("pointermove", onMove);
      row.removeEventListener("pointerup", onUp);
      row.removeEventListener("pointercancel", onUp);
      ghost.hidden = true;
      $("#canvasWrap").classList.remove("drop-hover");
      const wrap = $("#canvasWrap").getBoundingClientRect();
      const over =
        e.clientX >= wrap.left &&
        e.clientX <= wrap.right &&
        e.clientY >= wrap.top &&
        e.clientY <= wrap.bottom;
      const idDrop = state.labDrag?.id;
      const moved = state.labDrag?.moved;
      state.labDrag = null;
      if (over && idDrop) {
        const svg = $("#webSvg");
        const pt = clientToSvg(svg, e.clientX, e.clientY);
        const vb = svg.viewBox.baseVal;
        const pos = {
          x: clamp(pt.x, NODE_R, vb.width - NODE_R),
          y: clamp(pt.y, NODE_R, vb.height - NODE_R),
        };
        addSpeciesToNet(idDrop, pos);
      } else if (!moved && idDrop && !state.selectedIds.has(idDrop)) {
        // treat short click on row (not alt button) as add
        addSpeciesToNet(idDrop);
      }
      bumpIdle();
    };
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerup", onUp);
    row.addEventListener("pointercancel", onUp);
  }

  function addSpeciesToNet(id, preferPos) {
    const wasEmpty = state.selectedIds.size === 0;
    state.selectedIds.add(id);
    ensurePosition(id, preferPos || null);
    if (wasEmpty && !preferPos) {
      // keep band layout for first few if no drop point
      ensurePosition(id);
    }
    state.selectedNodeId = id;
    state.selectedEdgeKey = null;
    renderAll();
    bumpIdle();
  }

  function removeSpeciesFromNet(id) {
    state.selectedIds.delete(id);
    if (state.selectedNodeId === id) state.selectedNodeId = null;
    state.selectedEdgeKey = null;
    renderAll();
    bumpIdle();
  }

  function loadDemoNet() {
    initSelection(true);
    layoutInitial();
    state.selectedNodeId = null;
    state.selectedEdgeKey = null;
    renderAll();
    bumpIdle();
  }

  function resetEmptyNet() {
    state.selectedIds.clear();
    state.selectedNodeId = null;
    state.selectedEdgeKey = null;
    state.filterRelation = "all";
    $$("#relationFilters .chip").forEach((c) =>
      c.classList.toggle("active", c.dataset.rel === "all")
    );
    layoutInitial();
    renderAll();
    bumpIdle();
  }

  function renderDetail() {
    const body = $("#detailBody");
    if (state.selectedNodeId) {
      const s = speciesById(state.selectedNodeId);
      if (!s) {
        body.innerHTML = `<p class="muted">點選畫布上的物種或連線。</p>`;
        return;
      }
      const troph = TROPHIC[s.trophic];
      const imgBlock = s.image
        ? `<img class="detail-species-img" src="${escapeHtml(s.image)}" alt="${escapeHtml(s.name_zh)}" loading="lazy" onerror="this.style.display='none'" />`
        : "";
      body.innerHTML = `
        <h3>${escapeHtml(s.name_zh)}</h3>
        ${imgBlock}
        <div class="detail-meta">
          ${s.name_la ? `<div>學名：${escapeHtml(s.name_la)}</div>` : ""}
          <div>營養級：<button type="button" class="linkish" data-glossary="${s.trophic === "apex_consumer" ? "apex_consumer" : s.trophic}">${escapeHtml(troph?.zh || s.trophic)}</button></div>
          <div class="tiny muted"><a class="linkish" href="assets/ATTRIBUTION.md" target="_blank" rel="noopener">圖像署名</a></div>
        </div>
        <p class="detail-l1"><strong>初階</strong>　${escapeHtml(s.blurb_l1 || "")}</p>
        <button type="button" class="expand-btn" id="btnExpandL2">展開進階說明</button>
        <div class="detail-l2" id="detailL2" hidden>
          <strong>進階</strong>　${escapeHtml(s.blurb_l2 || "")}
        </div>
        <div class="detail-actions">
          <button type="button" class="btn tiny danger-ghost" id="btnRemoveFromNet">移出實驗室網</button>
          <span class="muted tiny">（亦可雙擊節點，或拖出畫布外）</span>
        </div>
      `;
      $("#btnExpandL2").onclick = () => {
        const box = $("#detailL2");
        const open = box.hidden;
        box.hidden = !open;
        $("#btnExpandL2").textContent = open ? "收合進階說明" : "展開進階說明";
        bumpIdle();
      };
      $("#btnRemoveFromNet").onclick = () => removeSpeciesFromNet(s.id);
      body.querySelectorAll("[data-glossary]").forEach((btn) => {
        btn.onclick = () => openGlossary(btn.dataset.glossary);
      });
      return;
    }

    if (state.selectedEdgeKey) {
      const [from, to, relation] = state.selectedEdgeKey.split("|");
      const e = state.eco.edges.find(
        (x) => x.from === from && x.to === to && x.relation === relation
      );
      if (!e) {
        body.innerHTML = `<p class="muted">點選畫布上的物種或連線。</p>`;
        return;
      }
      const a = speciesById(e.from);
      const b = speciesById(e.to);
      const meta = RELATION[e.relation];
      body.innerHTML = `
        <h3>關係：${escapeHtml(meta?.zh || e.relation)}</h3>
        <div class="detail-meta">
          <div>${escapeHtml(a?.name_zh || e.from)} → ${escapeHtml(b?.name_zh || e.to)}</div>
          ${meta?.sym ? `<div>符號：${meta.sym}</div>` : ""}
          ${e.relation === "competition" ? "<div>雙向虛線（無能量箭頭）</div>" : "<div>箭頭指向獲能方</div>"}
        </div>
        <p class="detail-l1">${escapeHtml(e.note_zh || "")}</p>
        <p><button type="button" class="linkish" data-glossary="${e.relation}">查看「${escapeHtml(meta?.zh || e.relation)}」名詞</button></p>
      `;
      body.querySelectorAll("[data-glossary]").forEach((btn) => {
        btn.onclick = () => openGlossary(btn.dataset.glossary);
      });
      return;
    }

    body.innerHTML = `<p class="muted">點選畫布上的物種或連線。將右側物種拖入草地組網。</p>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* —— Title layer —— */
  function showTitleLayer(immediate) {
    hideIdle();
    clearTimeout(state.idleTimer);
    state.titleOpen = true;
    const layer = $("#titleLayer");
    layer.classList.remove("hiding");
    layer.hidden = false;
    if (immediate) layer.style.opacity = "";
  }

  function hideTitleLayer() {
    const layer = $("#titleLayer");
    if (layer.hidden) return;
    layer.classList.add("hiding");
    const done = () => {
      layer.hidden = true;
      layer.classList.remove("hiding");
      state.titleOpen = false;
      bumpIdle();
    };
    layer.addEventListener("animationend", done, { once: true });
    // fallback
    setTimeout(() => {
      if (!layer.hidden && layer.classList.contains("hiding")) done();
    }, 320);
  }

  function bindGlobal() {
    const ecoSelect = $("#ecoSelect");
    if (ecoSelect) {
      ecoSelect.value = state.ecoId;
      ecoSelect.onchange = async () => {
        const next = ecoSelect.value;
        ecoSelect.disabled = true;
        try {
          await switchEcosystem(next, { showTitle: false });
        } catch (err) {
          console.error(err);
          showError(`切換生態系失敗：${err.message || err}`);
          ecoSelect.value = state.ecoId;
        } finally {
          ecoSelect.disabled = false;
        }
      };
    }
    $("#btnSelectAll").onclick = () => {
      initSelection(true);
      layoutInitial();
      renderAll();
      bumpIdle();
    };
    $("#btnClearLab").onclick = () => {
      state.selectedIds.clear();
      state.selectedNodeId = null;
      state.selectedEdgeKey = null;
      renderAll();
      bumpIdle();
    };
    $("#btnResetLab").onclick = () => resetEmptyNet();
    $("#btnLoadDemo").onclick = () => loadDemoNet();

    $("#btnTitle").onclick = () => showTitleLayer();
    $("#btnStartExplore").onclick = (ev) => {
      ev.stopPropagation();
      hideTitleLayer();
    };
    $("#titleLayer").addEventListener("click", (ev) => {
      if (ev.target === $("#titleLayer")) hideTitleLayer();
    });
    // prevent panel clicks from closing unless it's the start button
    $(".title-panel").addEventListener("click", (ev) => ev.stopPropagation());

    $("#btnGlossary").onclick = () => openGlossary();
    $("#btnCloseGlossary").onclick = () => closeGlossary();
    $("#glossarySearch").oninput = () => renderGlossaryList($("#glossarySearch").value);

    $("#btnQuiz").onclick = () => startQuiz();
    $("#btnCloseQuiz").onclick = () => closeQuiz();

    $("#webSvg").addEventListener("click", () => {
      state.selectedNodeId = null;
      state.selectedEdgeKey = null;
      renderGraph();
      renderDetail();
      bumpIdle();
    });

    $("#idleOverlay").onclick = () => {
      hideIdle();
      bumpIdle();
    };

    window.addEventListener("resize", () => {
      renderGraph();
      if (window.EcoWebEnvBg && typeof window.EcoWebEnvBg.resize === "function") {
        window.EcoWebEnvBg.resize();
      }
    });

    ["pointerdown", "keydown", "wheel", "mousemove"].forEach((evt) => {
      document.addEventListener(
        evt,
        () => {
          if (!state.idleOn && !state.titleOpen) bumpIdle();
        },
        { passive: true }
      );
    });
  }

  function bumpIdle() {
    if (state.idleOn || state.titleOpen) return;
    if (!$("#quizModal").hidden || !$("#glossaryModal").hidden) {
      clearTimeout(state.idleTimer);
      state.idleTimer = setTimeout(showIdle, IDLE_MS);
      return;
    }
    clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(showIdle, IDLE_MS);
  }

  function showIdle() {
    if (state.titleOpen) return;
    if ($("#quizModal").hidden === false || $("#glossaryModal").hidden === false) {
      bumpIdle();
      return;
    }
    state.idleOn = true;
    $("#idleOverlay").hidden = false;
  }

  function hideIdle() {
    state.idleOn = false;
    $("#idleOverlay").hidden = true;
  }

  function openGlossary(focusId) {
    hideIdle();
    $("#glossaryModal").hidden = false;
    $("#glossarySearch").value = "";
    renderGlossaryList("", focusId);
    clearTimeout(state.idleTimer);
  }

  function closeGlossary() {
    $("#glossaryModal").hidden = true;
    bumpIdle();
  }

  function renderGlossaryList(query, focusId) {
    const q = (query || "").trim().toLowerCase();
    const list = $("#glossaryList");
    list.innerHTML = "";
    const terms = state.glossary.terms || [];
    let focused = null;
    for (const t of terms) {
      const hay = `${t.term_zh} ${t.blurb_l1 || ""} ${t.blurb_l2 || ""}`.toLowerCase();
      if (q && !hay.includes(q) && !(t.id || "").includes(q)) continue;
      const item = document.createElement("article");
      item.className = "glossary-item";
      item.dataset.id = t.id;
      if (focusId && t.id === focusId) {
        item.classList.add("highlight");
        focused = item;
      }
      item.innerHTML = `
        <h3>${escapeHtml(t.term_zh)}</h3>
        <p class="detail-l1"><strong>初階</strong>　${escapeHtml(t.blurb_l1 || "")}</p>
        <p class="detail-l2" style="margin-top:6px"><strong>進階</strong>　${escapeHtml(t.blurb_l2 || "")}</p>
      `;
      list.appendChild(item);
    }
    if (!list.children.length) {
      list.innerHTML = `<p class="muted">沒有符合的名詞。</p>`;
    }
    if (focused) focused.scrollIntoView({ block: "nearest" });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startQuiz() {
    hideIdle();
    clearTimeout(state.idleTimer);
    const questions = state.quizBank.questions || [];
    const l1 = shuffle(questions.filter((q) => q.level === "L1"));
    const l2 = shuffle(questions.filter((q) => q.level === "L2"));
    const take = Math.min(QUIZ_N, questions.length);
    const half = Math.ceil(take / 2);
    const picked = shuffle([
      ...l1.slice(0, Math.min(half, l1.length)),
      ...l2.slice(0, Math.min(take - Math.min(half, l1.length), l2.length)),
    ]).slice(0, take);
    if (picked.length < take) {
      const rest = shuffle(questions.filter((q) => !picked.includes(q)));
      picked.push(...rest.slice(0, take - picked.length));
    }
    state.quiz = {
      items: picked,
      index: 0,
      score: 0,
      answered: false,
    };
    $("#quizModal").hidden = false;
    renderQuiz();
  }

  function closeQuiz() {
    $("#quizModal").hidden = true;
    state.quiz = null;
    bumpIdle();
  }

  function renderQuiz() {
    const box = $("#quizBody");
    const qz = state.quiz;
    if (!qz) return;
    if (qz.index >= qz.items.length) {
      const pct = Math.round((qz.score / qz.items.length) * 100);
      box.innerHTML = `
        <div class="quiz-score">
          <p>本局完成</p>
          <div class="big">${qz.score}／${qz.items.length}</div>
          <p>正確率 ${pct}%</p>
          <p class="muted tiny">${escapeHtml(state.quizBank.disclaimer_zh || "教學簡化")}</p>
          <div class="quiz-nav">
            <button type="button" class="btn" id="quizAgain">再測一次</button>
            <button type="button" class="btn primary" id="quizDone">回到主畫面</button>
          </div>
        </div>
      `;
      $("#quizAgain").onclick = () => startQuiz();
      $("#quizDone").onclick = () => closeQuiz();
      return;
    }

    const item = qz.items[qz.index];
    box.innerHTML = `
      <div class="quiz-progress">第 ${qz.index + 1}／${qz.items.length} 題
        <span class="level-badge">${item.level === "L2" ? "進階" : "初階"}</span>
      </div>
      <p class="quiz-stem">${escapeHtml(item.stem_zh)}</p>
      <div class="quiz-choices" id="quizChoices"></div>
      <div id="quizFeedback" class="quiz-feedback" hidden></div>
      <div class="quiz-nav">
        <button type="button" class="btn primary" id="quizNext" hidden>下一題</button>
      </div>
    `;
    const choices = $("#quizChoices");
    item.choices_zh.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-choice";
      btn.textContent = text;
      btn.onclick = () => answerQuiz(i);
      choices.appendChild(btn);
    });
    qz.answered = false;
  }

  function answerQuiz(choiceIndex) {
    const qz = state.quiz;
    if (!qz || qz.answered) return;
    qz.answered = true;
    const item = qz.items[qz.index];
    const correct = choiceIndex === item.answer;
    if (correct) qz.score += 1;
    const buttons = $$("#quizChoices .quiz-choice");
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === item.answer) btn.classList.add("correct");
      if (i === choiceIndex && !correct) btn.classList.add("wrong");
    });
    const fb = $("#quizFeedback");
    fb.hidden = false;
    fb.innerHTML = `
      <strong>${correct ? "正確" : "不正確"}</strong>
      <div>${escapeHtml(item.explain_zh || "")}</div>
      ${(item.glossary_ids || [])
        .map((id) => {
          const t = (state.glossary.terms || []).find((x) => x.id === id);
          return t
            ? `<button type="button" class="linkish" data-g="${id}">名詞：${escapeHtml(t.term_zh)}</button> `
            : "";
        })
        .join("")}
    `;
    fb.querySelectorAll("[data-g]").forEach((b) => {
      b.onclick = () => {
        closeQuiz();
        openGlossary(b.dataset.g);
      };
    });
    const next = $("#quizNext");
    next.hidden = false;
    next.textContent = qz.index + 1 >= qz.items.length ? "看成績" : "下一題";
    next.onclick = () => {
      qz.index += 1;
      renderQuiz();
    };
  }

  boot();
})();
