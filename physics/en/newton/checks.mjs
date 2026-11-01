// node newton/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const h = 1e-6;

check('weight = mg', near(M.W1, 19.6), `${M.W1.toFixed(1)} N`);
check('first law: ΣF = 0 → constant velocity', [0.2, 1.1, 2.3].every(t => near((M.glide(t + h).x - M.glide(t - h).x) / (2 * h), M.V_GLIDE, 1e-6)));
check('second law: a = F/m, double the mass halves a', near(M.A1, 3) && near(M.A2, 1.5) && near(M.A1 / M.A2, M.M2 / M.M1));
check('friction: static matches the push below F_smax', [0.5, 1.5, 2.4].every(t => near(M.friction(t).f, M.friction(t).F)));
check('friction: slips when F = μs·FN', near(M.T_SLIP * M.RAMP, M.MU_S * M.FN), `${M.F_SMAX.toFixed(2)} N at ${M.T_SLIP.toFixed(2)} s`);
check('friction: μs > μk, so it jumps from static max to kinetic', M.F_SMAX > M.F_K, `${M.F_SMAX.toFixed(2)} → ${M.F_K.toFixed(2)} N`);
// sliding: dv/dt = (F − fk)/m and dx/dt = v, checked numerically
check('sliding: m·dv/dt = F − f_k', [2.6, 2.9].every(t => near(M.M1 * (M.friction(t + h).v - M.friction(t - h).v) / (2 * h), M.RAMP * t - M.F_K, 1e-5)));
check('sliding: dx/dt = v', [2.6, 2.9].every(t => near((M.friction(t + h).x - M.friction(t - h).x) / (2 * h), M.friction(t).v, 1e-5)));
check('sliding starts from rest', near(M.friction(M.T_SLIP).v, 0) && near(M.friction(M.T_SLIP).x, 0));
check('third law: contact pair is equal and opposite', near(M.CONTACT, M.M2 * M.A_PAIR) && near(M.PUSH - M.CONTACT, M.M1 * M.A_PAIR), `${M.CONTACT.toFixed(1)} N`);
check('incline: components add back to the weight', near(Math.hypot(M.W_PAR, M.W_PERP), M.W1));
check('incline: a = g sin θ = W∥/m', near(M.A_INC, M.W_PAR / M.M1), `${M.A_INC.toFixed(2)} m/s²`);
check('incline: FN = mg cos θ (no acceleration into the slope)', near(M.FN_INC, M.W1 * Math.cos(M.THETA)), `${M.FN_INC.toFixed(2)} N`);
check('critical angle: tan θ = μ', near(Math.tan(M.critical(0.3) * Math.PI / 180), 0.3), `${M.critical(M.MU_K).toFixed(1)}° for μk = ${M.MU_K}`);

// tension
check('two strings: 2T sin θ = mg', [25, 45, 70].every(d => near(2 * M.tension2(d) * Math.sin(d * Math.PI / 180), M.W1)), `T(30°) = ${M.tension2(30).toFixed(2)} N`);
check('flatter strings, more tension', M.tension2(20) > M.tension2(45) && M.tension2(45) > M.tension2(70));
check('vertical strings share the weight: T(90°) = mg/2', near(M.tension2(90), M.W1 / 2));
// plane
check('level flight: lift = weight, thrust = drag', near(M.PLANE.L, M.PLANE.W) && near(M.PLANE.T, M.PLANE.D));
// car: closed form against the equation of motion
check('car: m dv/dt = F − kv²', [0.5, 1.5, 3.0].every(t => near(M.CAR.m * (M.car(t + h).v - M.car(t - h).v) / (2 * h), M.CAR.F - M.CAR.k * M.car(t).v ** 2, 1e-5)));
check('car: dx/dt = v', [0.5, 1.5, 3.0].every(t => near((M.car(t + h).x - M.car(t - h).x) / (2 * h), M.car(t).v, 1e-5)));
check('car: starts from rest', near(M.car(0).v, 0) && near(M.car(0).x, 0));
check('car: static friction needed is within μs·N on dry road (μs 0.7)', M.CAR.F < 0.7 * M.CAR.W, `${M.CAR.F} N < ${(0.7 * M.CAR.W).toFixed(0)} N`);

// systems: internal forces cancel, so only external forces move the centre of mass
const tugCm = t => { const r = M.tug(t); return M.xcm([M.TUG.mA, M.TUG.mB], [r.xA, r.xB]); };
check('x_cm = Σmx/Σm', near(M.xcm([1, 3], [0, 4]), 3) && near(M.xcm([2, 2, 4], [1, 3, 0]), 1));
check('tug of war: x_cm stays put under internal tension', [0, 0.4, 1.1, 1.7, M.TUG.run].every(t => near(tugCm(t), 0, 1e-12)), `x_cm = ${tugCm(1.3).toFixed(3)} m`);
check('tug of war: the tension pair adds to zero, mA·aA − mB·aB = 0', near(M.TUG.mA * M.TUG.aA, M.TUG.mB * M.TUG.aB));
check('tug of war: the skaters close in around the unmoved centre of mass', near(M.tug(M.TUG.run).xB - M.tug(M.TUG.run).xA, M.TUG.d1) && near(tugCm(M.TUG.run), 0, 1e-12), `after ${M.TUG.run.toFixed(2)} s`);
const brdCm = t => { const r = M.board(t); return M.xcm([M.BOARD.m, M.BOARD.Mb], [r.xBlock, r.xBoard]); };
check('block on board: ΣF_ext = M·a_cm (numeric second derivative of x_cm)', [0.2, 0.6, 1.0].every(t => near(M.BOARD.M * (brdCm(t + 1e-3) - 2 * brdCm(t) + brdCm(t - 1e-3)) / 1e-6, M.BOARD.F, 1e-5)), `a_cm = ${M.BOARD.aCm.toFixed(2)} m/s²`);
check('block on board: the friction pair cancels, m·a_block + M·a_board = F', near(M.BOARD.m * M.BOARD.aBlock + M.BOARD.Mb * M.BOARD.aBoard, M.BOARD.F));
check('block on board: the pull is past μs·(m+M)g, so the block must slip', M.BOARD.F > M.BOARD.Fslip && M.BOARD.aBoard > M.BOARD.aBlock, `${M.BOARD.F} N > ${M.BOARD.Fslip.toFixed(2)} N`);
check('block on board: the block stays on the board', M.BOARD.x0 - 1.3 - 0.25 > -M.BOARD.len / 2);

// linear drag: the closed form against a fourth-order Runge–Kutta integration of m dv/dt = mg − bv
{ const D = M.DRAG, fv = v => M.G - D.b * v / D.m, dt = 1e-3;
  let v = 0, x = 0, worst = 0;
  for (let i = 0; i < 2500; i++) {
    const k1 = fv(v), k2 = fv(v + dt / 2 * k1), k3 = fv(v + dt / 2 * k2), k4 = fv(v + dt * k3);
    const l1 = v, l2 = v + dt / 2 * k1, l3 = v + dt / 2 * k2, l4 = v + dt * k3;
    v += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); x += dt / 6 * (l1 + 2 * l2 + 2 * l3 + l4);
    const c = M.linDrag((i + 1) * dt); worst = Math.max(worst, Math.abs(c.v - v), Math.abs(c.x - x));
  }
  check('linear drag: v(t), x(t) match RK4 of m dv/dt = mg − bv', worst < 1e-9, `max error ${worst.toExponential(1)}`); }
check('linear drag: m dv/dt = mg − bv (closed form)', [0.1, 0.4, 1.5].every(t => near(M.DRAG.m * (M.linDrag(t + h).v - M.linDrag(t - h).v) / (2 * h), M.DRAG.W - M.DRAG.b * M.linDrag(t).v, 1e-5)));
check('linear drag: dx/dt = v', [0.1, 0.4, 1.5].every(t => near((M.linDrag(t + h).x - M.linDrag(t - h).x) / (2 * h), M.linDrag(t).v, 1e-5)));
check('linear drag: terminal limit v → mg/b, drag → weight', near(M.linDrag(20 * M.DRAG.tau).v, M.DRAG.vt, 1e-8) && near(M.linDrag(20 * M.DRAG.tau).D, M.DRAG.W, 1e-8), `v_t = ${M.DRAG.vt.toFixed(2)} m/s`);
check('linear drag: v(τ) = 63.2% of v_t', near(M.linDrag(M.DRAG.tau).v / M.DRAG.vt, 1 - Math.exp(-1)), `${(100 * M.linDrag(M.DRAG.tau).v / M.DRAG.vt).toFixed(1)}%`);
check('linear drag: starts from rest with a = g', near(M.linDrag(0).v, 0) && near(M.linDrag(0).a, M.G));
check('linear drag: the ball stays above the ground', M.DRAG.y0 - M.linDrag(M.DRAG.run).x > 0.3);
// quadratic drag, the same terminal speed, against RK4 of m dv/dt = mg − kv²
{ const fv = v => M.G - M.DRAG.k * v * v / M.DRAG.m, dt = 1e-3; let v = 0, worst = 0;
  for (let i = 0; i < 2000; i++) { const k1 = fv(v), k2 = fv(v + dt / 2 * k1), k3 = fv(v + dt / 2 * k2), k4 = fv(v + dt * k3); v += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); worst = Math.max(worst, Math.abs(M.quadV((i + 1) * dt) - v)); }
  check('quadratic drag: v_t tanh(gt/v_t) matches RK4 of m dv/dt = mg − kv²', worst < 1e-9, `max error ${worst.toExponential(1)}`); }
check('quadratic drag is weaker below v_t, so it gets closer sooner', M.quadV(M.DRAG.tau) > M.linDrag(M.DRAG.tau).v);
// honey and drops
check('honey: Stokes regime, Re ≪ 1', M.HONEY.Re < 0.1, `Re = ${M.HONEY.Re.toFixed(3)}`);
check('honey: terminal in milliseconds, v(10τ) = v_t to 0.01%', M.HONEY.tau < 0.01 && near(M.honey(10 * M.HONEY.tau).v, M.HONEY.vt, 1e-4), `τ = ${(M.HONEY.tau * 1000).toFixed(1)} ms`);
check('honey: at v_t, drag + buoyancy = weight', near(M.HONEY.b * M.HONEY.vt + M.HONEY.B, M.HONEY.W));
check('honey: the ball sinks less than the jar in one loop', M.honey(M.HONEY.run).x < M.HONEY.jarH - 2 * M.HONEY.r);
check('fog droplet (10 µm): Stokes valid (Re < 1)', M.drop(1e-5).Re < 1, `v_t = ${(M.drop(1e-5).vLin * 100).toFixed(1)} cm/s`);
check('raindrop (1 mm): Stokes fails (Re ≫ 1); quadratic gives ~6.6 m/s', M.drop(1e-3).Re > 1000 && Math.abs(M.drop(1e-3).vQuad - 6.6) < 0.2);

// ---------- practice (practice.js) ----------
{
const { PRACTICE } = await import('./practice.js');
const NPAGES = 13;   // pages.js imports world.js (three.js, browser-only), so the page count is hardcoded
{ const bad = [];
  for (let i = 0; i < NPAGES; i++) {
    const qs = PRACTICE[i];
    if (!Array.isArray(qs) || qs.length < 1 || qs.length > 2) { bad.push(`page ${i}: ${qs ? qs.length : 0} items`); continue; }
    qs.forEach((it, n) => {
      const mcq = Array.isArray(it.choices) && it.choices.length === 4 && new Set(it.choices).size === 4 && Number.isInteger(it.answer) && it.answer >= 0 && it.answer < 4 && typeof it.why === 'string' && it.why.trim();
      const frq = !it.choices && typeof it.solution === 'string' && it.solution.trim();
      if (!(typeof it.q === 'string' && it.q.trim() && (mcq || frq))) bad.push(`${i}.${n + 1}`);
    });
  }
  const extra = Object.keys(PRACTICE).filter(k => !(+k >= 0 && +k < NPAGES));
  check('practice: every page has 1–2 well-formed items', !bad.length && !extra.length, bad.concat(extra).join(', ') || `${Object.values(PRACTICE).flat().length} items`); }
// the first number in a choice's text (HTML stripped, − read as minus, a × 10ⁿ read as aEn)
const pnum = c => { const s = c.replace(/\s*×\s*10<sup>([−-]?\d+)<\/sup>/g, 'e$1').replace(/<[^>]+>/g, ' ').replace(/−/g, '-'); return Number(s.match(/-?\d+(\.\d+)?(e-?\d+)?/)[0]); };
// keyed choice equals the independent value (to its printed precision), every distractor is > 2 % away
const keyed = (p, n, want, name) => {
  const it = PRACTICE[p][n], v = it.choices.map(pnum), k = v[it.answer], scale = Math.abs(want) || 1;
  const ok = Math.abs(k - want) <= 0.005 * scale && v.every((d, i) => i === it.answer || Math.abs(d - want) > 0.02 * scale);
  check(`practice ${p}.${n + 1}: ${name}`, ok, `keyed ${k}, recomputed ${+want.toPrecision(5)}`);
};
const bisect = (fn, a, b) => { for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (fn(a) * fn(m) <= 0) b = m; else a = m; } return (a + b) / 2; };
const pint = (fn, a, b, n = 100000) => { let s = 0; const d = (b - a) / n; for (let i = 0; i < n; i++) s += fn(a + (i + 0.5) * d) * d; return s; };
const pder = (fn, t, e = 1e-6) => (fn(t + e) - fn(t - e)) / (2 * e);
const G = M.G, rad = d => d * Math.PI / 180, TG = M.TUG, BD = M.BOARD, DR = M.DRAG;
{ const forces = [[0, -M.W1], [0, -5.0]]; const N = -forces.reduce((s, F) => s + F[1], 0);   // Σ of the other vertical forces, balanced
  keyed(0, 0, N, 'normal force balances weight + press'); }
keyed(1, 0, M.tension2(25), 'model tension2(25°)');
{ const v = t => 3.0, a = pder(v, 1); keyed(2, 0, M.M1 * (G + a), 'T = m(g + a) with a = dv/dt of constant velocity'); }
{ const dt = 1e-3; const v1 = M.PLANE.v + (2400 - M.PLANE.D) / M.PLANE.m * dt; keyed(3, 0, (M.PLANE.m * v1 - M.PLANE.m * M.PLANE.v) / (M.PLANE.m * dt), 'impulse over a short dt ÷ m dt'); }
keyed(4, 0, M.pushed(M.A1, M.PUSH_T).x, 'model pushed(a1, t).x');
{ const t30 = bisect(t => M.car(t).v - 30, 0, 200); keyed(5, 1, pder(u => M.car(u).v, t30), 'slope of the model’s v(t) at v = 30 m/s'); }
keyed(6, 0, M.friction(8.0 / M.RAMP).f, 'model friction at an 8.0 N push');
keyed(6, 1, pder(u => M.friction(u).v, 12.0 / M.RAMP), 'slope of the model’s sliding v(t) at a 12.0 N push');
keyed(7, 0, M.PUSH - M.M2 * M.PUSH / (M.M1 + M.M2), 'push minus what B needs: F − m_B a');
{ const dt = 1e-5; let xA = 0, xB = TG.d0, vA = 0, vB = 0; while (xA < xB) { vA += TG.T / TG.mA * dt; vB -= TG.T / TG.mB * dt; xA += vA * dt; xB += vB * dt; }
  keyed(8, 0, xA, 'stepped skaters: where they meet'); }
{ const aCm = 24 / BD.M, aBoard = (24 - BD.f) / BD.Mb;
  keyed(9, 0, (BD.M * aCm - BD.Mb * aBoard) / BD.m, 'block from M a_cm − M_board a_board');
  keyed(9, 1, (BD.m * BD.aBlock + BD.Mb * aBoard) / BD.M, 'mass-weighted mean of block and board'); }
keyed(10, 0, Math.sqrt(2 * G * M.INC_LEN * Math.sin(M.THETA)), 'energy: √(2g·L sin θ)');
{ const th = M.THETA, W = [0, -M.M1 * G], n = [Math.sin(th), Math.cos(th)], d = [Math.cos(th), -Math.sin(th)];
  const N = -(W[0] * n[0] + W[1] * n[1]), fr = -M.MU_K * N;
  keyed(10, 1, ((W[0] + N * n[0] + fr * d[0]) * d[0] + (W[1] + N * n[1] + fr * d[1]) * d[1]) / M.M1, 'force vectors in level axes, projected on the slope'); }
{ const dt = 1e-6; let v = 0, t = 0; while (v < DR.vt / 2) { v += (G - DR.b * v / DR.m) * dt; t += dt; }
  keyed(11, 0, t, 'stepped m dv/dt = mg − bv to v_t/2'); }
{ const t4 = DR.tau * Math.log(4), a = pder(u => M.linDrag(u).v, t4);
  check('practice 11.2: at t = τ ln 4, dv/dt = g/4 and bv = ¾mg', near(a, G / 4, 1e-6) && near(DR.b * M.linDrag(t4).v, 0.75 * DR.W, 1e-9), `${(DR.b * M.linDrag(t4).v).toFixed(3)} N at ${t4.toFixed(3)} s`); }
keyed(12, 0, pint(u => M.linDrag(u).v, 0, 1), '∫v dt over 1 s, summed');
}

for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
