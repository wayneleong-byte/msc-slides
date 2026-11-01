// node kinematics/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const h = 1e-6;

check('lands after T = 2v0/g', near(M.y(M.T), 0), `T = ${M.T.toFixed(2)} s`);
check('apex: vy = 0 at T/2, y = v0²/2g', near(M.vy(M.T / 2), 0) && near(M.y(M.T / 2), M.H), `${M.H.toFixed(2)} m`);
check('dy/dt = vy', [0.3, 1.0, 1.7].every(t => near((M.y(t + h) - M.y(t - h)) / (2 * h), M.vy(t), 1e-6)));
check('dvy/dt = ay', [0.3, 1.0, 1.7].every(t => near((M.vy(t + h) - M.vy(t - h)) / (2 * h), M.ay(), 1e-6)));
check('vf² = v0² + 2aΔy', [0.4, 1.3].every(t => near(M.vy(t) ** 2, M.VY0 ** 2 + 2 * M.ay() * M.y(t))));
check('Δy = ½(v0 + vf)t', [0.4, 1.3].every(t => near(M.y(t), 0.5 * (M.VY0 + M.vy(t)) * t)));
check('Δy = vf·t − ½at²', [0.4, 1.3].every(t => near(M.y(t), M.vy(t) * t - 0.5 * M.ay() * t * t)));
check('round trip: displacement 0, distance 2H', near(M.y(M.T), 0) && near(M.distance(M.T), 2 * M.H), `${(2 * M.H).toFixed(1)} m`);
check('area under v–t = displacement', [0.5, 1.5, 2.0].every(t => near(M.areaUnderV(t), M.y(t))));
// numeric area check by summation
const n = 20000; let area = 0; for (let i = 0; i < n; i++) area += M.vy((i + 0.5) * (1.5 / n)) * (1.5 / n);
check('Σ v·dt over 0–1.5 s = y(1.5)', near(area, M.y(1.5), 1e-6), `${area.toFixed(4)} m`);
check('projectile: same height as the straight-up ball at every t', [0.2, 1.1, 1.9].every(t => near(M.y(t), M.VY0 * t - 0.5 * M.G * t * t)));
check('projectile range = vx·T', near(M.RANGE, M.VX * M.T), `${M.RANGE.toFixed(1)} m`);
check('average speed ≠ average velocity on the round trip', near(M.distance(M.T) / M.T, M.H) && near(M.y(M.T) / M.T, 0), `${(M.distance(M.T) / M.T).toFixed(2)} m/s vs 0`);

// ---------- relative motion ----------
const vnear = (a, b, tol = 1e-9) => near(a[0], b[0], tol) && near(a[1], b[1], tol);
check('rain: v_RC = v_RG + v_GC', vnear(M.V_RC, [-M.RAIN.vc, -M.RAIN.vr]), `|v_RC| = ${M.vlen(M.V_RC).toFixed(2)} m/s`);
check('rain: v_RG = v_RC + v_CG (frames chain back)', vnear(M.vadd(M.V_RC, M.V_CG), M.V_RG));
check('rain: slant tanθ = v_car / v_rain', near(Math.tan(M.RAIN_ANGLE * Math.PI / 180), M.RAIN.vc / M.RAIN.vr), `${M.RAIN_ANGLE.toFixed(1)}° from vertical`);
// a drop and the car, stepped in the ground frame: the drop's position relative to the car moves along v_RC
{ const dt = 1e-3; let drop = [3, 6], car = [0, 0]; const rel0 = [drop[0] - car[0], drop[1] - car[1]];
  for (let i = 0; i < 500; i++) { drop = M.vadd(drop, M.V_RG.map(c => c * dt)); car = M.vadd(car, M.V_CG.map(c => c * dt)); }
  const d = [drop[0] - car[0] - rel0[0], drop[1] - car[1] - rel0[1]];
  check('rain: stepped drop seen from the car moves at v_RC', vnear(d.map(c => c / 0.5), M.V_RC, 1e-9)); }
check('river: v_BS = v_BW + v_WS, straight aim', vnear(M.vBS(0), [M.RIVER.vw, M.RIVER.vb]), `${M.vlen(M.vBS(0)).toFixed(2)} m/s`);
check('river: straight aim crosses in w/v_b and drifts v_w·t', near(M.crossTime(0), M.RIVER.w / M.RIVER.vb) && near(M.drift(0), M.RIVER.vw * M.RIVER.w / M.RIVER.vb), `${M.crossTime(0).toFixed(1)} s, ${M.drift(0).toFixed(1)} m`);
check('river: aim upstream at asin(v_w/v_b) → no drift', near(M.drift(M.AIM_UP), 0) && near(M.vlen(M.vBS(M.AIM_UP)), Math.sqrt(M.RIVER.vb ** 2 - M.RIVER.vw ** 2)), `${(M.AIM_UP * 180 / Math.PI).toFixed(1)}°, ${M.crossTime(M.AIM_UP).toFixed(1)} s`);
check('river: straight aim is the fastest crossing', [0.1, 0.3, M.AIM_UP, 0.9].every(p => M.crossTime(p) > M.crossTime(0)));
// step a boat across with the two velocities added each step, until it reaches the far bank
for (const [name, phi] of [['straight', 0], ['upstream', M.AIM_UP]]) {
  const dt = 1e-4; let p = [0, 0], t = 0;
  while (p[1] < M.RIVER.w) { p = M.vadd(p, M.vadd(M.vBW(phi), M.V_WS).map(c => c * dt)); t += dt; }
  check(`river: stepped ${name} boat lands at t = ${M.crossTime(phi).toFixed(1)} s, drift ${M.drift(phi).toFixed(1)} m`, Math.abs(t - M.crossTime(phi)) < 2 * dt && Math.abs(p[0] - M.drift(phi)) < 1e-3);
}

// ---------- calculus kinematics: a(t) not constant ----------
const integ = (fn, a, b, n = 20000) => { let s = 0; const d = (b - a) / n; for (let i = 0; i < n; i++) s += fn(a + (i + 0.5) * d) * d; return s; };
const deriv = (fn, t) => (fn(t + h) - fn(t - h)) / (2 * h);
check('pull: a = a0 − kt reaches 0 at t1 = a0/k', near(M.pa(M.T1 - 1e-12), 0, 1e-9) && near(M.T1, 4), `t1 = ${M.T1.toFixed(2)} s`);
check('pull: v = ∫a dt (numeric) at 1, 2.5, 4, 5 s', [1, 2.5, 4, 5].every(t => near(integ(M.pa, 0, t), M.pv(t), 1e-7)), `v(t1) = ${M.V1.toFixed(1)} m/s`);
check('pull: x = ∫v dt (numeric) at 1, 2.5, 4, 5 s', [1, 2.5, 4, 5].every(t => near(integ(M.pv, 0, t), M.px(t), 1e-7)), `x(t1) = ${M.X1.toFixed(1)} m, x(5) = ${M.px(5).toFixed(1)} m`);
check('pull: v = dx/dt and a = dv/dt', [0.5, 2, 3.5, 4.6].every(t => near(deriv(M.px, t), M.pv(t), 1e-6) && near(deriv(M.pv, t), M.pa(t), 1e-6)));
check('pull: v1 = a0²/2k, x1 = a0³/3k²', near(M.V1, M.PULL.a0 ** 2 / (2 * M.PULL.k)) && near(M.X1, M.PULL.a0 ** 3 / (3 * M.PULL.k ** 2)));
// ODE: step dv = a dt, dx = v dt from rest (semi-implicit Euler, fine step)
{ const dt = 1e-5; let v = 0, x = 0; for (let t = 0; t < 5 - dt / 2; t += dt) { const a = M.pa(t + dt / 2); x += (v + 0.5 * a * dt) * dt; v += a * dt; }
  check('pull: stepped from rest matches v(5), x(5)', near(v, M.pv(5), 1e-6) && near(x, M.px(5), 1e-6), `${v.toFixed(3)} m/s, ${x.toFixed(3)} m`); }
check('cubic: v = dx/dt, a = dv/dt', [0.3, 1, 1.7].every(t => near(deriv(M.cx, t), M.cv(t), 1e-6) && near(deriv(M.cv, t), M.ca(t), 1e-6)));
check('cubic: from a = 6At with v(0) = −B, x(0) = 0, integrating gives x(t)', [0.5, 1.2, 2].every(t => near(-M.CUBE.B + integ(M.ca, 0, t), M.cv(t), 1e-7) && near(0 + integ(M.cv, 0, t), M.cx(t), 1e-7)));
check('cubic: turns at t = √(B/3A), x = −2 m', near(M.cv(M.T_TURN), 0) && near(M.cx(M.T_TURN), -2), `t = ${M.T_TURN.toFixed(2)} s`);
check('cubic: distance = ∫|v| dt, displacement = ∫v dt over 0–2 s', near(integ(t => Math.abs(M.cv(t)), 0, 2, 200000), M.cdist(2), 1e-6) && near(integ(M.cv, 0, 2), M.cx(2), 1e-7), `${M.cdist(2).toFixed(1)} m vs ${M.cx(2).toFixed(1)} m`);

// ---------- practice (practice.js) ----------
const { PRACTICE } = await import('./practice.js');
const NPAGES = 11;   // pages.js imports world.js (three.js, browser-only), so the page count is hardcoded
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
const pnum = c => { const s = c.replace(/×\s*10<sup>([−-]?\d+)<\/sup>/g, 'e$1').replace(/<[^>]+>/g, ' ').replace(/−/g, '-'); return Number(s.match(/-?\d+(\.\d+)?(e-?\d+)?/)[0]); };
// keyed choice equals the independent value (to its printed precision), every distractor is > 2 % away
const keyed = (p, n, want, name) => {
  const it = PRACTICE[p][n], v = it.choices.map(pnum), k = v[it.answer], scale = Math.abs(want) || 1;
  const ok = Math.abs(k - want) <= 0.005 * scale && v.every((d, i) => i === it.answer || Math.abs(d - want) > 0.02 * scale);
  check(`practice ${p}.${n + 1}: ${name}`, ok, `keyed ${k}, recomputed ${+want.toPrecision(5)}`);
};
const bisect = (fn, a, b) => { for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (fn(a) * fn(m) <= 0) b = m; else a = m; } return (a + b) / 2; };
{ // 0.1 step a ball thrown at 2v0 until it stops rising
  const dt = 1e-6; let y = 0, v = 2 * M.VY0; while (v > 0) { v -= M.G * dt; y += v * dt; }
  keyed(0, 0, y, 'stepped peak height at twice the launch speed'); }
{ // 1.1 caught 1.50 m below: ∫|v| dt to the moment y = −1.50
  const tc = bisect(t => M.y(t) + 1.5, M.T, 3 * M.T);
  keyed(1, 0, integ(t => Math.abs(M.vy(t)), 0, tc, 200000), 'distance = ∫|v| dt to the catch'); }
keyed(2, 0, integ(t => Math.abs(M.vy(t)), 0, 1.5, 200000) / 1.5, 'average speed = ∫|v| dt / t');
keyed(3, 1, -((M.y(2 * M.STROBE) - M.y(M.STROBE)) - (M.y(M.STROBE) - M.y(0))), 'gap shrink from three strobe positions');
keyed(4, 0, integ(M.vy, 0, 1.5), 'signed area under v–t, summed');
keyed(5, 0, Math.abs(M.vy(bisect(t => M.y(t) - 3, 0, M.T / 2))), 'speed at y = 3 m via the time it gets there');
{ // 6.x step the projectile: slowest speed on the path; landing point at twice vx
  const dt = 1e-5; let vy = M.VY0, y = 0, vmin = Infinity; while (y >= 0) { vmin = Math.min(vmin, Math.hypot(M.VX, vy)); vy -= M.G * dt; y += vy * dt; }
  keyed(6, 0, vmin, 'stepped: slowest speed on the path');
  let t = 0; vy = M.VY0; y = 0; while (y >= 0) { vy -= M.G * dt; y += vy * dt; t += dt; }
  keyed(6, 1, 2 * M.VX * t, 'stepped flight time × doubled vx'); }
{ // 7.1 v_RC as a vector, angle to straight down by the dot product
  const v = M.vadd(M.V_RG, [-20, 0]);
  keyed(7, 0, Math.acos(-v[1] / M.vlen(v)) * 180 / Math.PI, 'angle between v_RC and straight down'); }
{ // 8.1 step the straight-aimed boat in a 2.0 m/s current
  const dt = 1e-4; let p = [0, 0], t = 0; while (p[1] < M.RIVER.w) { p = M.vadd(p, M.vadd(M.vBW(0), [2.0, 0]).map(c => c * dt)); t += dt; }
  keyed(8, 0, t, 'stepped crossing time in a 2.0 m/s current'); }
keyed(8, 1, bisect(phi => M.vBS(phi)[0], 0, Math.PI / 2) * 180 / Math.PI, 'aim with zero downstream v_BS, by bisection');
keyed(9, 0, integ(M.pa, 0, 2), 'v(2) = ∫a dt, numeric');
check('practice 9.2: x(5) = a0³/3k² + v1(5 − t1) matches ∫v dt', near(integ(M.pv, 0, 5), M.PULL.a0 ** 3 / (3 * M.PULL.k ** 2) + M.V1 * (5 - M.T1), 1e-7), `${integ(M.pv, 0, 5).toFixed(2)} m`);
{ const tt = bisect(t => deriv(M.cx, t), 0.1, 2);
  keyed(10, 0, (M.cx(tt + 1e-4) - 2 * M.cx(tt) + M.cx(tt - 1e-4)) / 1e-8, 'second difference of x at the turn'); }
{ const tr = bisect(M.cx, 1, 2);
  check('practice 10.2: back at x = 0 at √3 s, v = 6 m/s', near(tr, Math.sqrt(3), 1e-9) && near(deriv(M.cx, tr), 6, 1e-6), `t = ${tr.toFixed(4)} s`); }
for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
