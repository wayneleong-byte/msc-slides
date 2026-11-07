(function () {
  "use strict";

  const IONS = window.IONS_DATA;
  const BINS = window.CHARGE_BINS;
  const LABELS = window.CHARGE_LABELS;
  const SLOW = window.LEVEL_SLOW;
  const MUTE_KEY = "ions-common-muted";

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

  // ASCII charge suffix → pretty unicode for input display
  const CHARGE_ASCII = {
    "1+": "+", "2+": "2+", "3+": "3+",
    "1-": "-", "2-": "2-", "3-": "3-"
  };
  const CHARGE_PRETTY = {
    "1+": "⁺", "2+": "²⁺", "3+": "³⁺",
    "1-": "⁻", "2-": "²⁻", "3-": "³⁻"
  };

  function normalizeFormula(raw) {
    if (!raw) return "";
    let s = String(raw).trim().replace(/\s+/g, "");
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₊₋]/g, (c) => SUP_MAP[c] || c);
    s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => SUB_MAP[c] || c);
    s = s.replace(/[−–—‐]/g, "-");
    return s;
  }

  function formulasEqual(a, b) {
    const na = normalizeFormula(a);
    const nb = normalizeFormula(b);
    return na.toLowerCase() === nb.toLowerCase();
  }

  function normalizeName(raw) {
    if (!raw) return "";
    let s = String(raw).trim().toLowerCase();
    s = s.replace(/\s+/g, " ");
    s = s.replace(/\s*ions?\s*$/i, "").trim();
    s = s
      .replace(/\baluminum\b/g, "aluminium")
      .replace(/\bsulfate\b/g, "sulphate")
      .replace(/\bsulfide\b/g, "sulphide")
      .replace(/\bsulfite\b/g, "sulphite")
      .replace(/\bhydrogen\s+carbonate\b/g, "hydrogencarbonate")
      .replace(/\bhydrogen\s+sulphate\b/g, "hydrogensulphate")
      .replace(/\bhydrogen\s+sulfate\b/g, "hydrogensulphate");
    return s;
  }

  function namesEqual(a, b) {
    return normalizeName(a) === normalizeName(b);
  }

  /** Strip trailing charge from a typed formula (ASCII or unicode). */
  function stripChargeSuffix(raw) {
    let s = String(raw || "");
    // unicode charge forms at end
    s = s.replace(/([²³]?[⁺⁻]|[₊₋])$/u, "");
    // ascii: optional digit then +/-, optionally with spaces
    s = s.replace(/\s*[1-3]?\s*[+\-−–—]\s*$/u, "");
    return s;
  }

  /** Apply charge button to input value — replace existing charge or append. */
  function applyChargeToInput(current, chargeKey) {
    const base = stripChargeSuffix(current).replace(/\s+$/, "");
    const pretty = CHARGE_PRETTY[chargeKey] || CHARGE_ASCII[chargeKey] || chargeKey;
    return base + pretty;
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
    const by = {};
    all.forEach((ion) => {
      (by[ion.charge] = by[ion.charge] || []).push(ion);
    });
    const out = [];
    const order = shuffle(Object.keys(by));
    let i = 0;
    while (out.length < 15) {
      const ch = order[i % order.length];
      if (by[ch] && by[ch].length) out.push(by[ch].shift());
      i++;
      if (i > 200) break;
    }
    return shuffle(out);
  }

  /* ---------- SFX (Web Audio — no asset files) ---------- */
  const sfx = {
    ctx: null,
    muted: false
  };

  function loadMute() {
    try {
      sfx.muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch (_) {
      sfx.muted = false;
    }
  }

  function saveMute() {
    try {
      localStorage.setItem(MUTE_KEY, sfx.muted ? "1" : "0");
    } catch (_) {}
  }

  function ensureAudio() {
    if (sfx.muted) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!sfx.ctx) sfx.ctx = new AC();
    if (sfx.ctx.state === "suspended") sfx.ctx.resume();
    return sfx.ctx;
  }

  function tone(freq, dur, type, gainPeak, when) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t0 = (when != null ? when : 0) + ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gainPeak || 0.12, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function playCorrect() {
    tone(523.25, 0.09, "triangle", 0.1, 0);
    tone(659.25, 0.11, "triangle", 0.09, 0.07);
    tone(783.99, 0.16, "sine", 0.08, 0.14);
  }

  function playWrong() {
    tone(220, 0.12, "square", 0.07, 0);
    tone(165, 0.18, "sawtooth", 0.05, 0.08);
  }

  function playClear() {
    tone(392, 0.1, "triangle", 0.09, 0);
    tone(523.25, 0.1, "triangle", 0.09, 0.1);
    tone(659.25, 0.12, "triangle", 0.09, 0.2);
    tone(783.99, 0.22, "sine", 0.1, 0.32);
  }

  function updateMuteBtn() {
    const btn = $("#btn-mute");
    if (!btn) return;
    btn.textContent = sfx.muted ? "🔇" : "🔊";
    btn.classList.toggle("is-muted", sfx.muted);
    btn.setAttribute("aria-label", sfx.muted ? "Unmute sounds" : "Mute sounds");
    btn.title = sfx.muted ? "Unmute" : "Mute";
  }

  /* ---------- state ---------- */
  const state = {
    mode: "home",
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
    results: [],
    startedAt: 0,
    timerId: null,
    elapsed: 0,
    locked: false,
    selectedCharge: null,
    tipShown: false
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
        ? "Lv 1 · Name → charge"
        : state.level === 2
        ? "Lv 2 · Name → formula"
        : "Lv 3 · Formula → name";
  }

  /* ---------- start level ---------- */
  function startLevel(level, opts) {
    opts = opts || {};
    ensureAudio(); // unlock on user gesture
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
    showScreen("play");
    renderQuestion();
  }

  function renderQuestion() {
    state.locked = false;
    state.selectedCharge = null;
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

  function buildChargeButtons(container, onPick, opts) {
    opts = opts || {};
    BINS.forEach((ch) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "charge-btn " + (ch.endsWith("+") ? "cation" : "anion");
      b.dataset.charge = ch;
      b.textContent = LABELS[ch];
      b.addEventListener("click", () => {
        if (state.locked) return;
        onPick(ch, b);
      });
      container.appendChild(b);
    });
  }

  /* ===== Level 1: Name → tap charge ===== */
  function renderL1(stage, ion) {
    stage.innerHTML = `
      <div class="prompt" id="prompt">
        <div class="ask">Tap the charge</div>
        <div class="name-show">${escapeHtml(ion.name)} <span style="color:var(--muted);font-weight:700">ion</span></div>
        <div class="hint-zh" id="hint-zh"></div>
      </div>
      <p class="section-label">Charge</p>
      <div class="charge-grid" id="charge-grid"></div>
      <p class="feedback" id="feedback"></p>
      <div class="actions">
        <button type="button" class="btn btn-tip" id="btn-tip">Tip 中</button>
      </div>
    `;
    const grid = $("#charge-grid", stage);
    buildChargeButtons(grid, (ch, btn) => {
      const ionNow = currentIon();
      const ok = ch === ionNow.charge;
      btn.classList.add(ok ? "flash-hit" : "flash-miss");
      answerL1(ch);
    });
    $("#btn-tip", stage).addEventListener("click", () => showTip(ion));
  }

  function answerL1(chosen) {
    if (state.locked) return;
    const ion = currentIon();
    const ok = chosen === ion.charge;
    finishItem(ok, {
      shown: ion.name + " ion",
      chosen: LABELS[chosen] || chosen,
      correct: LABELS[ion.charge],
      detail: ion.formulaDisp
    });
  }

  /* ===== Level 2: Name → formula; charge fills input; Submit ===== */
  function renderL2(stage, ion) {
    stage.innerHTML = `
      <div class="prompt" id="prompt">
        <div class="ask">Type the formula</div>
        <div class="name-show">${escapeHtml(ion.name)} <span style="color:var(--muted);font-weight:700">ion</span></div>
        <div class="hint-zh" id="hint-zh"></div>
      </div>
      <div class="input-block">
        <label for="formula-in">Formula</label>
        <div class="input-row">
          <input id="formula-in" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="e.g. Na then tap 1+" inputmode="text" />
        </div>
      </div>
      <div class="input-block">
        <label>Tap charge → fills into formula</label>
        <div class="charge-grid" id="charge-grid"></div>
      </div>
      <p class="feedback" id="feedback"></p>
      <div class="actions">
        <button type="button" class="btn btn-tip" id="btn-tip">Tip 中</button>
        <button type="button" class="btn btn-submit" id="btn-submit">Submit</button>
      </div>
    `;
    const input = $("#formula-in", stage);
    const grid = $("#charge-grid", stage);
    buildChargeButtons(grid, (ch, btn) => {
      state.selectedCharge = ch;
      $$(".charge-btn", grid).forEach((x) => x.classList.toggle("selected", x.dataset.charge === ch));
      input.value = applyChargeToInput(input.value, ch);
      input.focus();
      // move caret to end
      try {
        const len = input.value.length;
        input.setSelectionRange(len, len);
      } catch (_) {}
    });

    function doSubmit() {
      if (state.locked) return;
      const f = input.value;
      if (!f.trim()) {
        $("#feedback").textContent = "Enter a formula (tap charge to add charge)";
        $("#feedback").className = "feedback bad";
        return;
      }
      const ok = formulasEqual(f, ion.formula);
      finishItem(ok, {
        shown: ion.name + " ion",
        chosen: normalizeFormula(f),
        correct: ion.formulaDisp,
        detail: ion.name
      });
    }

    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSubmit();
      }
    });
    $("#btn-submit", stage).addEventListener("click", doSubmit);
    $("#btn-tip", stage).addEventListener("click", () => showTip(ion));
  }

  /* ===== Level 3: Formula → name (unchanged gameplay) ===== */
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
        <button type="button" class="btn btn-submit" id="btn-check">Submit</button>
      </div>
    `;
    const input = $("#name-in", stage);
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        $("#btn-check", stage).click();
      }
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
      playCorrect();
    } else {
      state.wrong++;
      state.streak = 0;
      playWrong();
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
    const prompt = $("#prompt");
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
    }, ok ? 420 : 880);
  }

  function endLevel() {
    stopTimer();
    playClear();
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
    loadMute();
    updateMuteBtn();

    $("#btn-mute").addEventListener("click", () => {
      sfx.muted = !sfx.muted;
      saveMute();
      updateMuteBtn();
      if (!sfx.muted) {
        ensureAudio();
        playCorrect();
      }
    });

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

    window.__IONS_TEST__ = {
      normalizeFormula,
      formulasEqual,
      normalizeName,
      namesEqual,
      stripChargeSuffix,
      applyChargeToInput,
      IONS
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
