// node oscillations/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const h = 1e-6, ts = [0, 0.13, 0.4, 0.77, 1.2, 2.9];
const d = (fn, t) => (fn(t + h) - fn(t - h)) / (2 * h);

// definitions
check('T = 2π√(m/k)', near(M.T0, 2 * Math.PI * Math.sqrt(M.M1 / M.K)), `${M.T0.toFixed(3)} s`);
check('f = 1/T', near(M.F0 * M.T0, 1), `${M.F0.toFixed(3)} Hz`);
check('x repeats every period', ts.every(t => near(M.spring(t + M.T0).x, M.spring(t).x, 1e-9)));
// kinematics of SHM: v = dx/dt, a = dv/dt, numerically
check('v = dx/dt', ts.every(t => near(d(u => M.spring(u).x, t), M.spring(t).v, 1e-6)));
check('a = dv/dt', ts.every(t => near(d(u => M.spring(u).v, t), M.spring(t).a, 1e-6)));
// dynamics: Hooke's law with Newton's second law
check('Hooke: F = −kx, opposite to x', ts.every(t => near(M.spring(t).F, -M.K * M.spring(t).x) && M.spring(t).F * M.spring(t).x <= 0));
check('ΣF = ma: a = −(k/m)x', ts.every(t => near(M.M1 * M.spring(t).a, M.spring(t).F, 1e-9)));
check('double the stretch, double the force', near(M.K * 0.4, 2 * M.K * 0.2));
// where things peak
check('v max at x = 0 (t = T/4)', near(M.spring(M.T0 / 4).x, 0, 1e-9) && near(Math.abs(M.spring(M.T0 / 4).v), M.VMAX), `${M.VMAX.toFixed(2)} m/s`);
check('a and F max at x = ±A (t = 0), v = 0 there', near(Math.abs(M.spring(0).a), M.AMAX) && near(M.spring(0).v, 0) && near(Math.abs(M.spring(0).F), M.FMAX), `${M.AMAX.toFixed(2)} m/s², ${M.FMAX.toFixed(2)} N`);
check('v_max = 2πfA = √(k/m)·A', near(M.VMAX, 2 * Math.PI * M.F0 * M.A) && near(M.VMAX, Math.sqrt(M.K / M.M1) * M.A));
check('a_max = 4π²f²A = (k/m)·A', near(M.AMAX, 4 * Math.PI ** 2 * M.F0 ** 2 * M.A) && near(M.AMAX, M.K / M.M1 * M.A));
// energy
check('K + U = ½kA² at every instant', Array.from({ length: 50 }, (_, i) => i * 0.037).every(t => near(M.spring(t).KE + M.spring(t).U, M.E, 1e-9)), `${M.E.toFixed(2)} J`);
check('½kA² = ½m·v_max²', near(M.E, 0.5 * M.M1 * M.VMAX ** 2));
{ const t = Math.acos(M.X_HALF / M.A) / M.W, s = M.spring(t); check('K = U at x = A√2/2', near(s.KE, s.U, 1e-9), `x = ${M.X_HALF.toFixed(3)} m`); }
check('work to stretch = triangle area ½·kx·x = U', near(0.5 * (M.K * M.A) * M.A, M.E));
// amplitude does not change the period
check('amplitude: x(t+T) = x(t) at A = 0.25 and 0.50', [M.IGNORE.A1, M.IGNORE.A2].every(a => ts.every(t => near(M.spring(t + M.T0, a).x, M.spring(t, a).x, 1e-9))));
check('amplitude: the two stay in step (x₁/x₂ constant)', ts.every(t => Math.abs(M.spring(t, M.IGNORE.A2).x) < 1e-9 || near(M.spring(t, M.IGNORE.A1).x / M.spring(t, M.IGNORE.A2).x, 0.5, 1e-9)));

// hanging spring
check('hanging: k·d = mg at equilibrium', near(M.K * M.D, M.WEIGHT), `d = ${M.D.toFixed(4)} m`);
check('hanging: net force = −k·y', ts.every(t => near(M.hang(t).net, -M.K * M.hang(t).y, 1e-9)));
check('hanging: ΣF = ma', ts.every(t => near(M.M1 * d(u => M.hang(u).v, t), M.hang(t).net, 1e-5)));
check('hanging: same period as on the floor', ts.every(t => near(M.hang(t + M.T0).y, M.hang(t).y, 1e-9)));
check('hanging: spring always stretched (pulls up)', M.D > M.HANG.A);

// pendulum
const { L, th0 } = M.PEND, wP = Math.sqrt(M.G / L);
check('pendulum: T = 2π√(L/g)', near(M.P_T, 2 * Math.PI / wP), `${M.P_T.toFixed(3)} s`);
check('pendulum: θ\'\' = −(g/L)θ (the SHM it is drawn with)', ts.every(t => near(d(u => M.pendulum(u).om, t), -(M.G / L) * M.pendulum(t).th, 1e-5)));
check('pendulum: restoring = −mg sin θ, zero at the bottom', near(M.pendulum(M.P_T / 4).restoring, 0, 1e-9) && near(M.pendulum(0).restoring, -M.PEND.m * M.G * Math.sin(th0)));
check('pendulum: components rebuild the weight', ts.every(t => { const p = M.pendulum(t); return near(Math.hypot(p.restoring, p.along), M.PEND.m * M.G); }));
check('small angle: sin θ within 0.6% of θ below 10°', (1 - Math.sin(10 * M.DEG) / (10 * M.DEG)) < 0.006, `${(100 * (1 - Math.sin(10 * M.DEG) / (10 * M.DEG))).toFixed(2)}% at 10°`);
check('small angle: …but 9% off at 45°', (1 - Math.sin(45 * M.DEG) / (45 * M.DEG)) > 0.09);
// exact period by integrating θ'' = −(g/L) sin θ (RK4) against the AGM formula
{ const dt = 1e-4; let th = th0, om = 0, t = 0, prev = om;
  const f = th => -(M.G / L) * Math.sin(th);
  while (true) {
    const k1 = [om, f(th)], k2 = [om + k1[1] * dt / 2, f(th + k1[0] * dt / 2)], k3 = [om + k2[1] * dt / 2, f(th + k2[0] * dt / 2)], k4 = [om + k3[1] * dt, f(th + k3[0] * dt)];
    th += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); om += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); t += dt;
    if (t > 0.1 && prev > 0 && om <= 0) break;   // back at +θ0: one full swing
    prev = om;
  }
  const Tx = M.periodExact(L, th0);
  check('exact period (AGM) matches the integrated swing', Math.abs(t - Tx) < 2e-4, `${Tx.toFixed(4)} s`);
  check('at 8° the small-angle period is within 0.2%', Math.abs(Tx / M.P_T - 1) < 0.002, `${(100 * (Tx / M.P_T - 1)).toFixed(3)}% longer`); }
check('pendulum: energy gives v_max = √(2gL(1−cos θ0))', near(M.vmaxPendulum(L, th0), Math.sqrt(2 * M.G * L * (1 - Math.cos(th0)))) && Math.abs(M.vmaxPendulum(L, th0) / Math.abs(M.pendulum(M.P_T / 4).v) - 1) < 0.002);
check('pendulum: mass cancels (same θ for 1 kg and 4 kg)', ts.every(t => near(M.pendulum(t, L, th0, 1).th, M.pendulum(t, L, th0, 4).th)));
check('pendulum: tension = mg cos θ + mv²/L ≥ mg cos θ', ts.every(t => M.pendulum(t).tension >= M.pendulum(t).along - 1e-12));

// proportional reasoning
check('4× mass → 2× period', near(M.periodSpring(M.DOUBLE.m4, M.K) / M.periodSpring(M.DOUBLE.m, M.K), 2));
check('4× length → 2× period', near(M.periodPendulum(M.DOUBLE.L4) / M.periodPendulum(M.DOUBLE.L), 2));
check('¼ k → 2× period', near(M.periodSpring(1, M.K / 4) / M.periodSpring(1, M.K), 2));
check('organizer example: 8 kg on 2 N/m → 4π s', near(M.periodSpring(8, 2), 4 * Math.PI), `${M.periodSpring(8, 2).toFixed(1)} s`);

// everyday
check('car: T = 2π√(m/k)', near(M.CAR.T, 2 * Math.PI * Math.sqrt(M.CAR.m / M.CAR.k)), `${M.CAR.T.toFixed(3)} s, sags ${(100 * M.CAR.d).toFixed(1)} cm`);
check('car: bounce smaller than the sag (springs stay compressed)', M.CAR.A < M.CAR.d);
check('swing: T = 2π√(L/g), within 0.3% of exact at 9°', near(M.SWING.T, M.periodPendulum(M.SWING.L)) && Math.abs(M.periodExact(M.SWING.L, M.SWING.th0) / M.SWING.T - 1) < 0.003, `${M.SWING.T.toFixed(2)} s`);

// ---------- AP Physics C: the SHM equation ----------
const w2 = M.K / M.M1, d2 = (fn, t, hh = 1e-4) => (fn(t + hh) - 2 * fn(t) + fn(t - hh)) / (hh * hh);
for (const i of [0, 1]) {
  const S = M.STARTS[i];
  check(`ODE ${i + 1}: x = A cos(ωt + φ) satisfies x'' = −(k/m)x`, ts.every(t => near(d2(u => M.start(i, u).x, t), -w2 * M.start(i, t).x, 1e-5)));
  check(`ODE ${i + 1}: A and φ give back x0 and v0`, near(M.start(i, 0).x, S.x0) && near(M.start(i, 0).v, S.v0), `A = ${S.A.toFixed(3)} m, φ = ${(S.phi / M.DEG).toFixed(2)}°`);
  { const r = M.integrate(x => -w2 * x, S.x0, S.v0, 1.3);
    check(`ODE ${i + 1}: RK4 from (x0, v0) lands on the closed form`, near(r.q, M.start(i, 1.3).x, 1e-8) && near(r.v, M.start(i, 1.3).v, 1e-8)); }
  { const Tn = M.periodNumeric(x => -w2 * x, S.x0, S.v0);
    check(`ODE ${i + 1}: integrated period = 2π√(m/k)`, Math.abs(Tn - M.T0) < 1e-6, `${Tn.toFixed(5)} s`); }
}
check('ODE: the push gives A = 0.50 m, φ = 53.13° (a 3-4-5 triangle)', near(M.STARTS[1].A, 0.5) && near(Math.tan(M.STARTS[1].phi), 4 / 3));
check('ODE: any ω other than √(k/m) fails', Math.abs(d2(u => M.shmPhase(0.5, 3.9, 0.3, u).x, 0.4) + w2 * M.shmPhase(0.5, 3.9, 0.3, 0.4).x) > 0.1);

// ---------- physical pendulum ----------
const R = M.ROD, H = M.HOOP, N = 20000;
// I about the pivot by summing r² dm, against the parallel-axis results
{ let Irod = 0; for (let i = 0; i < N; i++) { const r = (i + 0.5) / N * R.L; Irod += R.m / N * r * r; }
  check('rod: Σr²dm = ⅓mL² = I_cm + m(L/2)²', near(Irod, R.I, 1e-7) && near(R.I, R.m * R.L ** 2 / 3), `${R.I.toFixed(4)} kg·m²`); }
{ let Ih = 0; for (let i = 0; i < N; i++) { const a = 2 * Math.PI * (i + 0.5) / N; Ih += H.m / N * ((H.R * Math.sin(a)) ** 2 + (H.R * Math.cos(a) - H.R) ** 2); }
  check('hoop on a nail: Σr²dm = 2mR² = mR² + mR²', near(Ih, H.I, 1e-7) && near(H.I, 2 * H.m * H.R ** 2), `${H.I.toFixed(4)} kg·m²`); }
check('rod: T = 2π√(I/mgd) = 2π√(2L/3g)', near(R.T, 2 * Math.PI * Math.sqrt(2 * R.L / (3 * M.G))), `${R.T.toFixed(3)} s`);
check('rod: T/T_simple = √(2/3) (keeps time with a 2L/3 string)', near(R.T / M.periodPendulum(R.L), Math.sqrt(2 / 3)) && near(R.Leq, 2 * R.L / 3), `${(R.T / M.periodPendulum(R.L)).toFixed(4)}`);
check('hoop: T = 2π√(2R/g), the same as a 2R string', near(H.T, M.periodPendulum(2 * H.R)), `${H.T.toFixed(3)} s`);
check('point mass (I = md²) gives back 2π√(L/g)', near(M.periodPhysical(1, R.L, R.L ** 2), M.periodPendulum(R.L)));
for (const [nm, b] of [['rod', R], ['hoop', H]]) {
  const lin = th => -(b.m * M.G * b.d / b.I) * th, full = th => -(b.m * M.G * b.d / b.I) * Math.sin(th);
  const Tl = M.periodNumeric(lin, b.th0), Tf = M.periodNumeric(full, b.th0);
  check(`${nm}: integrated Iθ'' = −mgdθ period = closed form`, Math.abs(Tl - b.T) < 1e-6, `${Tl.toFixed(5)} s`);
  check(`${nm}: with sin θ at 8°, within 0.2%`, Math.abs(Tf / b.T - 1) < 0.002, `${(100 * (Tf / b.T - 1)).toFixed(3)}% longer`);
  check(`${nm}: the swing drawn satisfies θ'' = −(mgd/I)θ`, ts.every(t => near(d2(u => M.physical(b, u).th, t), lin(M.physical(b, t).th), 1e-5)));
  check(`${nm}: Iα ≈ τ (small angle)`, ts.every(t => Math.abs(b.I * M.physical(b, t).alpha - M.physical(b, t).torque) < 0.004 * b.m * M.G * b.d * b.th0));
}

// ---------- torsion pendulum ----------
const TS = M.TORS;
{ let Id = 0; const n = 4000; for (let i = 0; i < n; i++) { const r = (i + 0.5) / n * TS.R; Id += TS.M / (Math.PI * TS.R ** 2) * 2 * Math.PI * r * (TS.R / n) * r * r; }
  check('disc: ∫r²dm = ½MR²', near(Id, TS.I, 1e-6), `${TS.I.toFixed(3)} kg·m²`); }
check('torsion: T = 2π√(I/κ)', near(TS.T, 2 * Math.PI * Math.sqrt(TS.I / TS.kappa)), `${TS.T.toFixed(3)} s`);
{ const acc = th => -TS.kappa / TS.I * th;
  check('torsion: integrated period at 60° = 2π√(I/κ)', Math.abs(M.periodNumeric(acc, TS.th0) - TS.T) < 1e-6);
  check('torsion: …and at 5°: no amplitude dependence', Math.abs(M.periodNumeric(acc, 5 * M.DEG) - TS.T) < 1e-6);
  check('torsion: Iα = −κθ for the twist drawn', ts.every(t => near(TS.I * d2(u => M.torsion(u).th, t), M.torsion(t).torque, 1e-5))); }

// ---------- practice (practice.js): structure, and every numeric answer recomputed another way ----------
import { PRACTICE } from './practice.js';
{
  const NPAGES = 12;   // pages.js imports world.js (three.js, browser-only), so the page count is written here
  const items = Object.entries(PRACTICE);
  check('practice: every page 0..11 has 1–2 questions, and no others', Array.from({ length: NPAGES }, (_, i) => PRACTICE[i]).every(q => Array.isArray(q) && q.length >= 1 && q.length <= 2) && items.every(([k]) => +k >= 0 && +k < NPAGES && Number.isInteger(+k)),
    `${items.reduce((s, [, q]) => s + q.length, 0)} questions`);
  check('practice: each has q and either 4 distinct choices, a valid answer and a why, or a solution', items.every(([, qs]) => qs.every(it => typeof it.q === 'string' && it.q.length > 0 && (it.choices
    ? it.choices.length === 4 && new Set(it.choices).size === 4 && Number.isInteger(it.answer) && it.answer >= 0 && it.answer < 4 && typeof it.why === 'string' && it.why.length > 0
    : typeof it.solution === 'string' && it.solution.length > 0))));
  // the first number in a choice (HTML stripped, − as minus) and how many decimals it shows
  const num = s => { const m = s.replace(/<[^>]*>/g, '').replace(/−/g, '-').match(/[-+]?\d+(?:\.\d+)?/); return { v: parseFloat(m[0]), dp: (m[0].split('.')[1] || '').length }; };
  // keyed choice = want to within its rounding; every other choice > 2% away from want
  const keyed = (pg, i, want, name) => {
    const it = PRACTICE[pg][i], cs = it.choices.map(num), k = cs[it.answer];
    const okKey = Math.abs(k.v - want) <= 0.5 * 10 ** -k.dp * (1 + 1e-9);
    const okOthers = cs.every((c, j) => j === it.answer || Math.abs(c.v - want) > 0.02 * Math.max(Math.abs(want), Math.abs(c.v)));
    check(`practice ${pg}.${i + 1}: ${name}`, okKey && okOthers, `want ${+want.toPrecision(5)}, keyed ${it.choices[it.answer].replace(/<[^>]*>/g, '')}${okOthers ? '' : ', a distractor is within 2%'}`);
  };
  // a free-response solution must state the independently computed value
  const states = (pg, i, text, name) => check(`practice ${pg}.${i + 1}: ${name}`, PRACTICE[pg][i].solution.includes(text), text);
  const root = (fn, a, b) => { let fa = fn(a); for (let i = 0; i < 100; i++) { const m = (a + b) / 2, fm = fn(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
  const sum = (fn, a, b, n = 20000) => { let s = 0; const dd = (b - a) / n; for (let i = 0; i < n; i++) s += fn(a + (i + 0.5) * dd) * dd; return s; };
  const g = M.G, at = x => Math.acos(x / M.A) / M.W;          // first time the block is at x (from the model's cosine)
  const springAcc = (m, k) => x => -(k / m) * x, pendAcc = (gg, L) => q => -(gg / L) * Math.sin(q);
  // 0: path length in one period = ∫|v| dt; frequency from the RK4 period
  keyed(0, 0, sum(t => Math.abs(M.spring(t).v), 0, M.T0), 'distance in a period, ∫|v| dt');
  keyed(0, 1, 1 / M.periodNumeric(springAcc(M.M1, M.K), M.A), 'f = 1/T, T from RK4');
  // 1–3: read the model's motion at the moment it passes the given x
  keyed(1, 0, M.spring(at(-0.20)).F, 'spring force at x = −0.20 m (model)');
  keyed(1, 1, M.spring(at(0.25)).a, 'acceleration at x = +0.25 m (model)');
  keyed(2, 1, Math.abs(M.spring(at(0.30)).v), 'speed at x = 0.30 m (model)');
  keyed(3, 0, M.spring(at(M.A / 2)).KE, 'K at x = A/2 (model)');
  // 4: equilibrium where the net force vanishes; spring force at the bottom of the model's bob
  keyed(4, 0, root(y => M.K * y - 0.5 * g, 0, 5), 'sag of 0.50 kg: k y = mg solved by bisection');
  keyed(4, 1, M.hang(0).Fs, 'spring force at the bottom (model, t = 0)');
  // 5: Moon period by RK4 of θ″ = −(g/L) sin θ at a tiny amplitude; bottom speed by RK4 from 8° until θ = 0
  keyed(5, 0, M.periodNumeric(pendAcc(1.62, M.PEND.L), 1e-3), 'Moon period, RK4');
  { const acc = pendAcc(g, M.PEND.L); let q = M.PEND.th0, v = 0; const dt = 1e-5;
    for (;;) { const [q1, v1] = M.rk4Step(acc, q, v, dt); if (q1 <= 0) { v = v + (v1 - v) * q / (q - q1); break; } q = q1; v = v1; }
    keyed(5, 1, Math.abs(v) * M.PEND.L, 'bottom speed, RK4 of the full pendulum'); }
  // 6: k that doubles the period, and L for 3.0 s, by bisection on the period formulas
  keyed(6, 0, root(k => M.periodSpring(M.DOUBLE.m, k) - 2 * M.periodSpring(M.DOUBLE.m, M.K), 0.1, M.K), 'k for 2T, by bisection');
  keyed(6, 1, root(L => M.periodPendulum(L) - 3.0, 0.1, 20), 'L for 3.0 s, by bisection');
  // 8: amplitude = largest |x| over a period of RK4; first zero crossing by RK4
  { const S = M.STARTS[1], acc = springAcc(M.M1, M.K), dt = 1e-5; let q = S.x0, v = S.v0, A = 0, t = 0, t0 = NaN;
    while (t < M.T0) { const [q1, v1] = M.rk4Step(acc, q, v, dt); if (Number.isNaN(t0) && q > 0 && q1 <= 0) t0 = t + dt * q / (q - q1); A = Math.max(A, Math.abs(q1)); q = q1; v = v1; t += dt; }
    keyed(8, 0, A, 'amplitude, largest |x| over a period (RK4)');
    states(8, 1, `${t0.toFixed(3)} s`, 'first pass through x = 0 (RK4)');
    states(8, 1, `${(Math.acos(S.x0 / A) / M.DEG).toFixed(1)}°`, 'φ = arccos(x0/A), A from RK4'); }
  // 9: I by integrating x² dm (rod) and summing r² over the rim (hoop), then the RK4 period of the swing
  { const R = M.ROD, I = sum(x => x * x * R.m / R.L, 0, R.L);
    keyed(9, 0, M.periodNumeric(q => -(R.m * g * R.d / I) * Math.sin(q), 1e-3), 'rod period: I = ∫x² dm, RK4');
    const H = M.HOOP, n = 20000; let Ih = 0;
    for (let i = 0; i < n; i++) { const a = 2 * Math.PI * (i + 0.5) / n; Ih += (H.m / n) * ((H.R * Math.cos(a)) ** 2 + (H.R * Math.sin(a) + H.R) ** 2); }   // nail at (0, −R) from the centre
    states(9, 1, `${M.periodNumeric(q => -(H.m * g * H.R / Ih) * Math.sin(q), 1e-3).toFixed(2)} s`, 'hoop period: I summed over the rim, RK4'); }
  // 10: the wider disc's I by rings, RK4 period; largest torque and spin over a period of RK4
  { const T = M.TORS, R2 = 2 * T.R, I2 = sum(r => r * r * (T.M / (Math.PI * R2 * R2)) * 2 * Math.PI * r, 0, R2);
    keyed(10, 0, M.periodNumeric(q => -T.kappa * q / I2, T.th0), 'twice the radius: I by rings, RK4 period');
    const acc = q => -T.kappa * q / T.I, dt = 1e-4; let q = T.th0, v = 0, tq = 0, w = 0;
    for (let t = 0; t < T.T; t += dt) { tq = Math.max(tq, Math.abs(T.kappa * q)); w = Math.max(w, Math.abs(v)); [q, v] = M.rk4Step(acc, q, v, dt); }
    states(10, 1, `${tq.toFixed(3)} N·m`, 'largest torque over a period (RK4)');
    states(10, 1, `${w.toFixed(2)} rad/s`, 'largest angular speed over a period (RK4)'); }
  // 11: RK4 periods
  keyed(11, 0, M.periodNumeric(springAcc(M.CAR.m + 300, M.CAR.k), M.CAR.A), 'loaded car period, RK4');
  keyed(11, 1, M.periodNumeric(pendAcc(g, M.SWING.L), 1e-3), 'swing period, RK4');
}

for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
