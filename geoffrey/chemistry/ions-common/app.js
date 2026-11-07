(function () {
  "use strict";

  const IONS = window.IONS_DATA;
  const BINS = window.CHARGE_BINS;
  const LABELS = window.CHARGE_LABELS;
  const SLOW = window.LEVEL_SLOW;

  /* ---------- normalize helpers ---------- */
  const SUP_MAP = {
    "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
    "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
    "⁺": "+", "⁻": "-", "₊": "+", "₋": "-"
  };
  const SUB_MAP = {
    "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
    "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9"
  };

  function normalizeFormula(raw) {
    if (!raw) return "";
    let s = String(raw).trim().replace(/\s+/g, "");
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₊₋]/g, (c) => SUP_MAP[c] || c);
    s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => SUB_MAP[c] || c);
    // unicode minus / en-dash / em-dash → -
    s = s.replace(/[−–—‐]/g, "-");
    // strip trailing "ion" if someone typed it into formula (unlikely)
    return s;
  }

  function formulasEqual(a, b) {
    // case-insensitive element letters; digits and signs stay
    const na = normalizeFormula(a);
    const nb = normalizeFormula(b);
    return na.toLowerCase() === nb.toLowerCase();
  }

  function normalizeName(raw) {
    if (!raw) return "";
    let s = String(raw).trim().toLowerCase();
    s = s.replace(/\s+/g, " ");
    // strip trailing " ion" / "ion"
    s = s.replace(/\s*ions?\s*$/i, "").trim();
    // soft US → British / spaced variants
    s = s
      .replace(/\baluminum\b/g, "aluminium")
      .replace(/\bsulfate\b/g, "sulphate")
      .replace(/\bsulfide\b/g, "sulphide")
      .replace(/\bsulfite\b/g, "sulphite")
      .replace(/\bhydrogen\s+carbonate\b/g, "hydrogencarbonate")
      .replace(/\bhydrogen\s+sulphate\b/g, "hydrogensulphate")
      .replace(/\bhydrogen\s+sulfate\b/g, "hydrogensulphate");
    // roman numerals case-normalize: copper(ii) → copper(ii) already lower
    return s;
  }

  function namesEqual(a, b) {
    return normalizeName(a) === normalizeName(b);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickDeck(quick15) {
    const all = shuffle(IONS);
    if (!quick15) return all;
    // stratified-ish: take mix of charges
    const by = {};
    all.forEach((ion) => {
      (by[ion.charge] = by[ion.charge] || []).push(ion);
    });
    const out = [];
    const order = shuffle(Object.keys(by));
    let i = 0;
    while (out.length < 15) {
      const ch = order[i % order.length];
      if (by[ch].length) out.push(by[ch].shift());
      i++;
      if (i > 200) break;
    }
    return shuffle(out);
  }

  /* ---------- state ---------- */
  const state = {
    mode: "home", // home | play | summary | final
    level: 1,
    playAll: false,
    quick15: false,
    deck: [],
    idx: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    mistakes: [],
    slowItems: [],
    results: [], // per-level summaries when playAll
    startedAt: 0,
    timerId: null,
    elapsed: 0,
    locked: false,
    selectedCharge: null,
    tipShown: false,
    // L1 drag
    selectedCard: false,
    dragging: false
  };

  /* ---------- DOM ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const screens = {
    home: $("#screen-home"),
    play: $("#screen-play"),
    summary: $("#screen-summary"),
    final: $("#screen-final")
  };

  function showScreen(name) {
    Object.keys(screens).forEach((k) => {
      screens[k].classList.toggle("active", k === name);
    });
    state.mode = name;
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    state.startedAt = performance.now();
    state.elapsed = 0;
    updateTimerChip();
    state.timerId = setInterval(() => {
      state.elapsed = (performance.now() - state.startedAt) / 1000;
      updateTimerChip();
    }, 100);
  }

  function updateTimerChip() {
    const el = $("#timer-chip");
    if (!el) return;
    const lim = SLOW[state.level];
    const t = state.elapsed;
    el.textContent = t.toFixed(1) + "s";
    el.classList.toggle("slow", t > lim);
  }

  function currentIon() {
    return state.deck[state.idx];
  }

  function updateHud() {
    const total = state.deck.length;
    const done = state.idx;
    const pct = total ? Math.round((done / total) * 100) : 0;
    $("#progress-bar").style.width = pct + "%";
    $("#stat-progress").innerHTML = "<b>" + (done + 1) + "</b>/" + total;
    $("#stat-ok").textContent = state.correct;
    $("#stat-no").textContent = state.wrong;
    $("#stat-streak").textContent = state.streak;
    const badge = $("#level-badge");
    badge.className = "badge" + (state.level === 2 ? " l2" : state.level === 3 ? " l3" : "");
    badge.textContent =
      state.level === 1
        ? "Lv 1 · Formula → charge"
        : state.level === 2
        ? "Lv 2 · Name → formula"
        : "Lv 3 · Formula → name";
  }

  /* ---------- start level ---------- */
  function startLevel(level, opts) {
    opts = opts || {};
    state.level = level;
    if (!opts.keepPlayAll) state.playAll = !!opts.playAll;
    state.quick15 = $("#opt-quick").checked;
    state.deck = pickDeck(state.quick15);
    state.idx = 0;
    state.correct = 0;
    state.wrong = 0;
    state.streak = 0;
    state.mistakes = [];
    state.slowItems = [];
    state.locked = false;
    state.selectedCharge = null;
    state.selectedCard = false;
    showScreen("play");
    renderQuestion();
  }

  function renderQuestion() {
    state.locked = false;
    state.selectedCharge = null;
    state.selectedCard = false;
    state.tipShown = false;
    const ion = currentIon();
    if (!ion) {
      endLevel();
      return;
    }
    updateHud();
    const stage = $("#play-stage");
    stage.innerHTML = "";

    if (state.level === 1) renderL1(stage, ion);
    else if (state.level === 2) renderL2(stage, ion);
    else renderL3(stage, ion);

    startTimer();
  }

  /* ===== Level 1 ===== */
  function renderL1(stage, ion) {
    stage.innerHTML = `
      <p class="ask" style="text-align:center;color:var(--muted);font-size:.8rem;margin:0 0 8px;letter-spacing:.05em;text-transform:uppercase;">Drag or tap → charge bin</p>
      <div class="drag-card" id="drag-card" draggable="true" role="button" tabindex="0" aria-label="Ion card ${ion.formulaDisp}">
        <div class="formula">${ion.formulaDisp}</div>
        <div class="tap-hint">Drag onto a bin · or tap card then tap bin</div>
      </div>
      <div class="bins" id="bins"></div>
      <p class="feedback" id="feedback"></p>
      <div class="actions">
        <button type="button" class="btn btn-tip" id="btn-tip">Tip 中</button>
      </div>
    `;
    const bins = $("#bins", stage);
    BINS.forEach((ch) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bin " + (ch.endsWith("+") ? "cation" : "anion");
      b.dataset.charge = ch;
      b.innerHTML = '<span class="sign">' + LABELS[ch] + "</span>";
      bins.appendChild(b);
    });

    const card = $("#drag-card", stage);
    wireDrag(card, bins);
    bins.addEventListener("click", (e) => {
      const bin = e.target.closest(".bin");
      if (!bin || state.locked) return;
      if (state.selectedCard || true) {
        // always allow tap-bin as fallback once card shown
        answerL1(bin.dataset.charge);
      }
    });
    card.addEventListener("click", () => {
      if (state.locked) return;
      state.selectedCard = !state.selectedCard;
      card.classList.toggle("selected", state.selectedCard);
    });
    $("#btn-tip", stage).addEventListener("click", () => showTip(ion));
  }

  function wireDrag(card, binsEl) {
    let pointerId = null;
    let startX = 0, startY = 0, ox = 0, oy = 0;
    let ghost = null;

    function onDown(e) {
      if (state.locked) return;
      if (e.button != null && e.button !== 0) return;
      pointerId = e.pointerId;
      card.setPointerCapture(pointerId);
      state.dragging = true;
      card.classList.add("dragging");
      const r = card.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      // ghost clone for visual
      ghost = card.cloneNode(true);
      ghost.id = "";
      ghost.style.position = "fixed";
      ghost.style.left = r.left + "px";
      ghost.style.top = r.top + "px";
      ghost.style.width = r.width + "px";
      ghost.style.margin = "0";
      ghost.style.zIndex = "1000";
      ghost.style.pointerEvents = "none";
      ghost.style.opacity = "0.95";
      document.body.appendChild(ghost);
      card.style.opacity = "0.35";
      e.preventDefault();
    }
    function onMove(e) {
      if (!state.dragging || e.pointerId !== pointerId) return;
      const x = e.clientX - ox;
      const y = e.clientY - oy;
      if (ghost) {
        ghost.style.left = x + "px";
        ghost.style.top = y + "px";
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      $$(".bin").forEach((b) => b.classList.remove("over"));
      const bin = el && el.closest && el.closest(".bin");
      if (bin) bin.classList.add("over");
    }
    function onUp(e) {
      if (!state.dragging || e.pointerId !== pointerId) return;
      state.dragging = false;
      card.classList.remove("dragging");
      card.style.opacity = "";
      $$(".bin").forEach((b) => b.classList.remove("over"));
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const bin = el && el.closest && el.closest(".bin");
      if (ghost) {
        ghost.remove();
        ghost = null;
      }
      try { card.releasePointerCapture(pointerId); } catch (_) {}
      pointerId = null;
      // distinguish tap vs drag
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (bin && (dx > 8 || dy > 8)) {
        answerL1(bin.dataset.charge);
      }
      // else leave selection to click handler
    }
    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onUp);

    // HTML5 drag fallback (desktop)
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", "ion");
      e.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    $$(".bin", binsEl).forEach((bin) => {
      bin.addEventListener("dragover", (e) => {
        e.preventDefault();
        bin.classList.add("over");
      });
      bin.addEventListener("dragleave", () => bin.classList.remove("over"));
      bin.addEventListener("drop", (e) => {
        e.preventDefault();
        bin.classList.remove("over");
        answerL1(bin.dataset.charge);
      });
    });
  }

  function answerL1(chosen) {
    if (state.locked) return;
    const ion = currentIon();
    const ok = chosen === ion.charge;
    finishItem(ok, {
      shown: ion.formulaDisp,
      chosen: LABELS[chosen] || chosen,
      correct: LABELS[ion.charge],
      detail: ion.name
    });
  }

  /* ===== Level 2 ===== */
  function renderL2(stage, ion) {
    stage.innerHTML = `
      <div class="prompt" id="prompt">
        <div class="ask">Type the formula · pick charge</div>
        <div class="name-show">${escapeHtml(ion.name)} <span style="color:var(--muted);font-weight:600">ion</span></div>
        <div class="hint-zh" id="hint-zh"></div>
      </div>
      <div class="input-block">
        <label for="formula-in">Formula</label>
        <div class="input-row">
          <input id="formula-in" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="e.g. Cu2+ or SO4 2-" inputmode="text" />
        </div>
      </div>
      <div class="input-block">
        <label>Charge</label>
        <div class="charge-grid" id="charge-grid"></div>
      </div>
      <p class="feedback" id="feedback"></p>
      <div class="actions">
        <button type="button" class="btn btn-tip" id="btn-tip">Tip 中</button>
        <button type="button" class="btn btn-primary" id="btn-check">Check</button>
      </div>
    `;
    const grid = $("#charge-grid", stage);
    BINS.forEach((ch) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "charge-btn";
      b.dataset.charge = ch;
      b.textContent = LABELS[ch];
      b.addEventListener("click", () => {
        if (state.locked) return;
        state.selectedCharge = ch;
        $$(".charge-btn", grid).forEach((x) => x.classList.toggle("selected", x.dataset.charge === ch));
      });
      grid.appendChild(b);
    });
    const input = $("#formula-in", stage);
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("#btn-check", stage).click();
    });
    $("#btn-check", stage).addEventListener("click", () => {
      if (state.locked) return;
      const f = input.value;
      const ch = state.selectedCharge;
      if (!f.trim()) {
        $("#feedback").textContent = "Enter a formula";
        $("#feedback").className = "feedback bad";
        return;
      }
      if (!ch) {
        $("#feedback").textContent = "Pick a charge";
        $("#feedback").className = "feedback bad";
        return;
      }
      const ok = formulasEqual(f, ion.formula) && ch === ion.charge;
      finishItem(ok, {
        shown: ion.name,
        chosen: normalizeFormula(f) + " · " + (LABELS[ch] || ch),
        correct: ion.formulaDisp + " · " + LABELS[ion.charge],
        detail: ion.name
      });
    });
    $("#btn-tip", stage).addEventListener("click", () => showTip(ion));
  }

  /* ===== Level 3 ===== */
  function renderL3(stage, ion) {
    stage.innerHTML = `
      <div class="prompt" id="prompt">
        <div class="ask">Type the name (no “ion”)</div>
        <div class="formula">${ion.formulaDisp}</div>
        <div class="hint-zh" id="hint-zh"></div>
      </div>
      <div class="input-block">
        <label for="name-in">Name</label>
        <div class="input-row">
          <input id="name-in" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="e.g. copper(II)" inputmode="text" />
          <span class="suffix">ion</span>
        </div>
      </div>
      <p class="feedback" id="feedback"></p>
      <div class="actions">
        <button type="button" class="btn btn-tip" id="btn-tip">Tip 中</button>
        <button type="button" class="btn btn-primary" id="btn-check">Check</button>
      </div>
    `;
    const input = $("#name-in", stage);
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("#btn-check", stage).click();
    });
    $("#btn-check", stage).addEventListener("click", () => {
      if (state.locked) return;
      const n = input.value;
      if (!n.trim()) {
        $("#feedback").textContent = "Enter a name";
        $("#feedback").className = "feedback bad";
        return;
      }
      const ok = namesEqual(n, ion.name);
      finishItem(ok, {
        shown: ion.formulaDisp,
        chosen: n.trim(),
        correct: ion.name,
        detail: ion.formulaDisp
      });
    });
    $("#btn-tip", stage).addEventListener("click", () => showTip(ion));
  }

  function showTip(ion) {
    const el = $("#hint-zh");
    if (el) el.textContent = ion.zh || "";
    else {
      const fb = $("#feedback");
      if (fb) {
        fb.textContent = ion.zh || "";
        fb.className = "feedback";
      }
    }
    state.tipShown = true;
  }

  function finishItem(ok, info) {
    state.locked = true;
    stopTimer();
    const secs = state.elapsed;
    const lim = SLOW[state.level];
    const ion = currentIon();

    if (ok) {
      state.correct++;
      state.streak++;
    } else {
      state.wrong++;
      state.streak = 0;
      state.mistakes.push({
        shown: info.shown,
        chosen: info.chosen,
        correct: info.correct,
        name: ion.name,
        formula: ion.formulaDisp,
        secs: secs
      });
    }
    if (secs > lim) {
      state.slowItems.push({
        label: ion.formulaDisp + " · " + ion.name,
        secs: secs,
        ok: ok
      });
    }

    const fb = $("#feedback");
    const prompt = $("#prompt") || $("#drag-card");
    if (ok) {
      if (fb) {
        fb.textContent = "Correct ✓";
        fb.className = "feedback ok";
      }
      if (prompt) prompt.classList.add("flash-ok");
    } else {
      if (fb) {
        fb.textContent = "✗ " + info.correct;
        fb.className = "feedback bad";
      }
      if (prompt) prompt.classList.add("flash-bad");
    }
    updateHud();

    setTimeout(() => {
      state.idx++;
      if (state.idx >= state.deck.length) endLevel();
      else renderQuestion();
    }, ok ? 450 : 900);
  }

  function endLevel() {
    stopTimer();
    const total = state.correct + state.wrong;
    const pct = total ? Math.round((state.correct / total) * 100) : 0;
    const summary = {
      level: state.level,
      correct: state.correct,
      wrong: state.wrong,
      total: total,
      pct: pct,
      mistakes: state.mistakes.slice(),
      slowItems: state.slowItems.slice()
    };
    if (state.playAll) state.results.push(summary);
    renderSummary(summary);
    showScreen("summary");
  }

  function renderSummary(summary) {
    const root = $("#summary-body");
    const lim = SLOW[summary.level];
    let html = `
      <div class="summary-score">
        <div class="pct">${summary.pct}%</div>
        <div class="line">Level ${summary.level} · ${summary.correct}/${summary.total} correct</div>
      </div>
      <div class="card">
        <h2>Mistakes <span class="zh">錯題</span></h2>
    `;
    if (!summary.mistakes.length) {
      html += '<p class="empty-note">None — perfect run 🎉</p>';
    } else {
      html += `<div class="table-wrap"><table class="mistakes"><thead><tr>
        <th>Shown</th><th>Your answer</th><th>Correct</th></tr></thead><tbody>`;
      summary.mistakes.forEach((m) => {
        html += `<tr><td>${escapeHtml(m.shown)}</td><td>${escapeHtml(m.chosen)}</td><td>${escapeHtml(m.correct)}</td></tr>`;
      });
      html += "</tbody></table></div>";
    }
    html += `</div><div class="card"><h2>Slow (&gt;${lim}s) <span class="zh">逾時</span></h2>`;
    if (!summary.slowItems.length) {
      html += '<p class="empty-note">None — speedy!</p>';
    } else {
      html += '<ul class="slow-list">';
      summary.slowItems.forEach((s) => {
        html += `<li>${escapeHtml(s.label)} · <b>${s.secs.toFixed(1)}s</b>${s.ok ? "" : " · wrong"}</li>`;
      });
      html += "</ul>";
    }
    html += "</div>";

    const actions = $("#summary-actions");
    if (state.playAll && summary.level < 3) {
      actions.innerHTML = `
        <button type="button" class="btn btn-primary" id="btn-continue">Continue to Level ${summary.level + 1}</button>
        <button type="button" class="btn btn-ghost" id="btn-home">Home</button>
      `;
      setTimeout(() => {
        $("#btn-continue").onclick = () => startLevel(summary.level + 1, { keepPlayAll: true });
        $("#btn-home").onclick = () => showScreen("home");
      }, 0);
    } else if (state.playAll && summary.level === 3) {
      actions.innerHTML = `
        <button type="button" class="btn btn-primary" id="btn-final">See final results</button>
        <button type="button" class="btn btn-ghost" id="btn-home">Home</button>
      `;
      setTimeout(() => {
        $("#btn-final").onclick = () => renderFinal();
        $("#btn-home").onclick = () => showScreen("home");
      }, 0);
    } else {
      actions.innerHTML = `
        <button type="button" class="btn btn-primary" id="btn-retry">Retry this level</button>
        <button type="button" class="btn btn-ghost" id="btn-home">Home</button>
      `;
      setTimeout(() => {
        $("#btn-retry").onclick = () => startLevel(summary.level);
        $("#btn-home").onclick = () => showScreen("home");
      }, 0);
    }
    root.innerHTML = html;
  }

  function renderFinal() {
    const root = $("#final-body");
    let html = `<div class="card"><h2>All 3 levels <span class="zh">三關總結</span></h2>`;
    state.results.forEach((r) => {
      html += `<p style="margin:8px 0;font-size:.95rem"><b>Level ${r.level}</b> — ${r.pct}% (${r.correct}/${r.total}) · mistakes ${r.mistakes.length} · slow ${r.slowItems.length}</p>`;
    });
    const avg =
      state.results.length
        ? Math.round(state.results.reduce((s, r) => s + r.pct, 0) / state.results.length)
        : 0;
    html += `<p style="margin-top:14px;font-size:1.2rem;font-weight:800;color:var(--accent)">Average ${avg}%</p></div>`;
    root.innerHTML = html;
    showScreen("final");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- wire home ---------- */
  function init() {
    $("#btn-play-all").addEventListener("click", () => {
      state.results = [];
      state.playAll = true;
      startLevel(1, { playAll: true });
    });
    $$("[data-start-level]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.results = [];
        state.playAll = false;
        startLevel(Number(btn.dataset.startLevel));
      });
    });
    $("#btn-final-home").addEventListener("click", () => showScreen("home"));
    showScreen("home");

    // expose for self-test
    window.__IONS_TEST__ = {
      normalizeFormula,
      formulasEqual,
      normalizeName,
      namesEqual,
      IONS
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
