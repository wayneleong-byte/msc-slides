// node potential/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1e-30, Math.abs(b));
const h = 1e-6;
const f = (x, n = 2) => x.toFixed(n);

// constants
check('k = 1/(4π ε₀)', near(M.K, 1 / (4 * Math.PI * M.EPS0), 2e-3), `${(1 / (4 * Math.PI * M.EPS0)).toExponential(3)}`);

// 1 · pair energy
{ const a = M.pair(M.PAIR.run, 1), b = M.pair(M.PAIR.run, -1);
  check('pair: like charges store positive U, unlike negative', a.U > 0 && b.U < 0 && near(a.U, -b.U), `${f(a.U * 1e6, 3)} μJ at ${M.PAIR.r1 * 100} cm`);
  // work by an outside agent = −∫ F_elec dr from r0 to r, numerically, equals ΔU
  const n = 20000, r0 = M.PAIR.r0, r1 = M.PAIR.r1, dr = (r1 - r0) / n;
  let W = 0; for (let i = 0; i < n; i++) { const r = r0 + (i + 0.5) * dr; W -= M.K * M.PAIR.q1 * M.PAIR.q2 / (r * r) * dr; }
  check('pair: agent work −∫F·dr = ΔU', near(W, a.W, 1e-6), `${f(W * 1e6, 4)} μJ`);
  check('pair: F = −dU/dr', [0.1, 0.2, 0.3].every(r => near(-(M.Upair(M.PAIR.q1, M.PAIR.q2, r + h) - M.Upair(M.PAIR.q1, M.PAIR.q2, r - h)) / (2 * h), M.K * M.PAIR.q1 * M.PAIR.q2 / r ** 2, 1e-5))); }

// 2 · square assembly
{ const steps = [0, 1, 2, 3].map(M.sqStep), tot = steps.reduce((s, x) => s + x, 0);
  check('square: ΔU₁ = 0 (nothing there yet)', steps[0] === 0);
  check('square: Σ steps = (4 + √2) kq²/a', near(tot, M.SQ.U, 1e-12), `${f(M.SQ.U * 1e6, 4)} μJ`);
  check('square: assembled state matches the closed form', near(M.square(M.SQ.run).U, M.SQ.U, 1e-12) && M.square(M.SQ.run).n === 4);
  check('square: order of assembly doesn\'t matter', near(M.Uassembly([3, 1, 0, 2].map(i => ({ q: M.SQ.q, p: M.SQ.corners[i] }))), M.SQ.U, 1e-12)); }

// 3 · uniform field line integral
{ const Ef = () => [M.UNI.E, 0, 0];
  const direct = M.lineIntegral(Ef, Array.from({ length: 41 }, (_, i) => [0.2 * i / 40, 0, -0.4 + 0.4 * i / 40]));
  const viaB = M.lineIntegral(Ef, [M.UNI.A, M.UNI.B, M.UNI.C]);
  const wiggle = M.lineIntegral(Ef, Array.from({ length: 2001 }, (_, i) => { const s = i / 2000; return [0.2 * s + 0.05 * Math.sin(6 * Math.PI * s), 0, -0.4 + 0.4 * s]; }));
  check('uniform: ΔV(A→C) = −10 V straight', near(direct, -10, 1e-9), `${f(direct)} V`);
  check('uniform: via B gives the same (A→B adds 0)', near(viaB, -10, 1e-9) && near(M.lineIntegral(Ef, [M.UNI.A, M.UNI.B]), 0));
  check('uniform: a wiggly path gives the same', near(wiggle, -10, 1e-6));
  check('uniform: V model agrees', near(M.Vuni(M.UNI.C) - M.Vuni(M.UNI.A), -10)); }
{ const n = 4000; let dV = 0; for (let i = 0; i < n; i++) dV -= M.VARY.E((i + 0.5) * M.VARY.x1 / n) * M.VARY.x1 / n;
  check('varying E = 4x: ΔV = −32 V', near(dV, M.VARY.dV, 1e-6), `${f(dV)} V`); }

// 4 · point-charge potential
{ const Q = M.HILL.Q, rA = 0.3, rB = 0.1;
  const n = 20000; let dV = 0; for (let i = 0; i < n; i++) { const r = rA + (rB - rA) * (i + 0.5) / n; dV -= M.Epoint(Q, r) * (rB - rA) / n; }
  check('point: −∫E dr = kq(1/r_B − 1/r_A)', near(dV, M.K * Q * (1 / rB - 1 / rA), 1e-7), `${f(dV)} V`);
  check('point: E = −dV/dr', [0.07, 0.15, 0.3].every(r => near(-(M.Vpoint(Q, r + h) - M.Vpoint(Q, r - h)) / (2 * h), M.Epoint(Q, r), 1e-5)));
  check('point: equipotential radii r = kQ/V', M.HILL.levels.every(v => near(M.Vpoint(Q, M.K * Q / v), v)), M.HILL.levels.map(v => f(M.K * Q / v * 100, 1)).join(', ') + ' cm'); }

// 5 · dipole
{ const xs = [0.15, 0.2, 0.3];
  check('dipole: V on the axis = −2akq/(x² − a²)', xs.every(x => near(M.Vdip([x, 0, 0]), M.VdipAxis(x), 1e-12)), `V(${M.DIP.axisX * 100} cm) = ${f(M.VdipAxis(M.DIP.axisX))} V`);
  check('dipole: V = 0 everywhere on the bisector', [0.01, 0.1, 0.25].every(z => Math.abs(M.Vdip([0, 0, z])) < 1e-9));
  const pts = [[0.05, 0, 0.1], [-0.2, 0, 0.15], [0.25, 0, -0.05]];
  check('dipole: E = −∇V', pts.every(p => { const e = M.Edip(p); return [0, 2].every(k => { const a = p.slice(), b = p.slice(); a[k] += h; b[k] -= h; return near(-(M.Vdip(a) - M.Vdip(b)) / (2 * h), e[k], 1e-5); }); }));
  const line = M.fieldLine(M.DIP.charges, [-M.DIP.a + 0.012 * Math.cos(0.6), 0, 0.012 * Math.sin(0.6)]);
  const Vs = line.map(M.Vdip);
  check('dipole: V falls all along a field line (E points downhill)', Vs.every((v, i) => !i || v < Vs[i - 1]), `${line.length} steps, ${f(Vs[0])} → ${f(Vs.at(-1))} V`);
  check('dipole: far away, V → kp cos θ / r²', near(M.Vdip([-10, 0, 0]), M.K * M.DIP.q * 2 * M.DIP.a / 100, 1e-3)); }

// 6 · rod
{ const a = 0.1, Va = M.VrodAxis(a), num = M.rodSum(20000, [-a, 0, 0]);
  check('rod: axis kλ ln((a+L)/a) vs Σ k dq/r', near(num, Va, 1e-6), `${f(Va)} V`);
  const Vb = M.VrodBis(M.ROD.bisA), numB = M.rodSum(20000, [M.ROD.L / 2, 0, -M.ROD.bisA]);
  check('rod: bisector closed form vs Σ k dq/r', near(numB, Vb, 1e-6), `${f(Vb)} V`);
  check('rod: far away it looks like a point charge', near(M.VrodAxis(100), M.K * M.ROD.Q / (100 + M.ROD.L / 2), 1e-5)); }

// 7 · ring, arc, disc
{ check('ring: kQ/√(R² + z²) vs Σ k dq/r', [0, 0.1, 0.3].every(z => near(M.ringSum(2000, z), M.Vring(z), 1e-9)), `centre ${f(M.Vring(0))} V`);
  check('arc: centre kQ/R, whatever the span', near(M.arcSum(500), M.Varc0, 1e-12), `${f(M.Varc0)} V`);
  check('disc: 2πkσ(√(R² + z²) − z) vs Σ rings', [0, 0.05, 0.3].every(z => near(M.discSum(20000, z), M.Vdisc(z), 1e-6)));
  check('disc: centre 2kQ/R, twice the ring', near(M.Vdisc(0), 2 * M.K * M.DISC.Q / M.DISC.R, 1e-12) && near(M.Vdisc(0), 2 * M.Vring(0), 1e-12), `${f(M.Vdisc(0))} V`);
  check('ring and disc → kQ/z far away', near(M.Vring(50), M.K * M.RING.Q / 50, 1e-5) && near(M.Vdisc(50), M.K * M.DISC.Q / 50, 1e-5)); }

// 8 · spheres
{ const R = M.SPH.R;
  check('insulating sphere: V(0) = 3kQ/2R', near(M.Vins(0), 1.5 * M.K * M.SPH.Q / R), `${f(M.Vins(0))} V`);
  check('insulating sphere: V(r) = −∫∞ E dr', [0, 0.05, 0.1, 0.25].every(r => near(M.Vfrom(M.Eins, Math.max(r, 1e-6)), M.Vins(r), 1e-5)));
  check('conducting sphere: V(r) = −∫∞ E dr, flat inside', [0.02, 0.07, 0.25].every(r => near(M.Vfrom(M.Econd, r), M.Vcond(r), 1e-5)), `${f(M.Vcond(0))} V inside`);
  check('both continuous at the surface', near(M.Vins(R - 1e-12), M.Vins(R + 1e-12), 1e-9) && near(M.Vcond(R - 1e-12), M.Vcond(R + 1e-12), 1e-9));
  check('both: E = −dV/dr', [0.05, 0.2].every(r => near(-(M.Vins(r + h) - M.Vins(r - h)) / (2 * h), M.Eins(r), 1e-5) && Math.abs(-(M.Vcond(r + h) - M.Vcond(r - h)) / (2 * h) - M.Econd(r)) < 1e-3 * M.Econd(R))); }

// 9 · accelerating through 6 V
{ const A = M.ACC;
  check('both gain qΔV = 6 eV', near(M.eV(M.accel(1, 'p').K), 6, 1e-9) && near(M.eV(M.accel(1, 'e').K), 6, 1e-9));
  check('energy conserved along the way: K + U constant', [0, 0.3, 0.7, 1].every(u => near(M.accel(u, 'p').K + M.accel(u, 'p').U, M.accel(0, 'p').U, 1e-9) && near(M.accel(u, 'e').K + M.accel(u, 'e').U, M.accel(0, 'e').U, 1e-9)));
  check('kinematics: v² = 2ad with a = qE/m', near(A.vp ** 2, 2 * M.E_CH * A.E / M.M_P * A.d, 1e-9) && near(A.ve ** 2, 2 * M.E_CH * A.E / M.M_E * A.d, 1e-9), `proton ${f(A.vp / 1000, 1)} km/s, electron ${f(A.ve / 1e6, 2)} Mm/s`);
  check('proton moves with E (toward lower V), electron against it', M.accel(1, 'p').V < M.accel(0, 'p').V && M.accel(1, 'e').V > M.accel(0, 'e').V);
  check('electron through 100 V: 5.93 × 10⁶ m/s', near(M.speed(M.E_CH, 100, M.M_E), 5.93e6, 1e-3)); }

// ---- practice ----
{ // structure. pages.js imports world.js (three.js, browser-only), so the page count is written here: 9 pages, 0–8
  const NPAGES = 9, bad = [];
  for (let i = 0; i < NPAGES; i++) { const qs = PRACTICE[i]; if (!Array.isArray(qs) || qs.length < 1 || qs.length > 2) bad.push(`page ${i}: ${qs ? qs.length : 0} items`); }
  for (const k of Object.keys(PRACTICE)) if (!(+k >= 0 && +k < NPAGES)) bad.push(`stray key ${k}`);
  for (const [k, qs] of Object.entries(PRACTICE)) qs.forEach((q, n) => {
    const tag = `${k}.${n}`;
    if (!q.q) bad.push(`${tag}: no q`);
    if (q.choices) { if (q.choices.length !== 4 || new Set(q.choices).size !== 4 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3 || !q.why) bad.push(`${tag}: bad MCQ`); }
    else if (!q.solution) bad.push(`${tag}: no solution`);
  });
  check('practice: every page 1–2 items; 4 distinct choices + keyed answer + why, or a solution', bad.length === 0, bad.join('; ') || `${Object.values(PRACTICE).flat().length} items`);
}
// each quantitative item: an independent route to the answer equals the keyed number, and every distractor is > 2 % off
const keyed = (page, n, value, name) => {
  const q = PRACTICE[page][n], got = q.nums[q.answer];
  const off = q.nums.filter((x, k) => k !== q.answer && Number.isFinite(x)).every(x => Math.abs(x - value) > 0.02 * Math.abs(value));
  check(`practice ${page}.${n + 1}: ${name}`, Math.abs(got - value) <= 5e-3 * Math.abs(value) && off, `${value.toPrecision(4)} (keyed ${got.toPrecision(4)})`);
};
const integ = (fn, a, b, n = 20000) => { let s = 0; const d = (b - a) / n; for (let i = 0; i < n; i++) s += fn(a + (i + 0.5) * d) * d; return s; };
keyed(0, 0, -integ(r => M.K * M.PAIR.q1 * M.PAIR.q2 / (r * r), M.PAIR.r0, M.PAIR.r1) * 1e6, 'work = −∫F dr against the repulsion (numeric)');
{ const A = 1.3, B = 0.7, U = r => A / r ** 2 - B / r; let best = Infinity, rb = 0; for (let i = 1; i <= 200000; i++) { const r = i * 1e-4; if (U(r) < best) { best = U(r); rb = r; } }
  check('practice 0.2: the minimum of U = A/r² − B/r (scan) is at 2A/B, not at A/B, √(A/B), B/2A', Math.abs(rb - 2 * A / B) < 1e-3 && [A / B, Math.sqrt(A / B), B / (2 * A)].every(x => Math.abs(x - rb) > 0.02 * rb), `r = ${rb.toFixed(4)}`); }
keyed(1, 0, [1, 2, 3].reduce((s, n) => s + M.sqStep(n), 0) * 1e6, 'U = sum of the work to bring in each charge');
keyed(1, 1, integ(q => M.K * q / 0.15, 0, 2e-9) * 1e6, 'W = ∫V dq while charging (numeric)');
{ const n = 4000, pts = Array.from({ length: n + 1 }, (_, i) => M.UNI.A.map((a, k) => a + (M.UNI.C[k] - a) * i / n));
  keyed(2, 0, M.UNI.q * M.lineIntegral(() => [M.UNI.E, 0, 0], pts) * -1e9, 'W = −qΔV with ΔV = −∫E·ds along the straight path'); }
{ const n = 4000, pts = Array.from({ length: n + 1 }, (_, i) => [2 * i / n, 0, 0]);
  keyed(2, 1, M.lineIntegral(p => [3 * p[0] ** 2, 0, 0], pts), 'ΔV = −∫E·ds stepped along x'); }
{ const r = M.K * M.HILL.Q / 90, h = 1e-7; keyed(3, 0, -(M.Vpoint(M.HILL.Q, r + h) - M.Vpoint(M.HILL.Q, r - h)) / (2 * h), '−dV/dr at V = 90 V (numeric)'); }
{ const V = (x, y) => 3 * x * x * y - y ** 3, h = 1e-6; keyed(3, 1, Math.hypot((V(1 + h, 2) - V(1 - h, 2)) / (2 * h), (V(1, 2 + h) - V(1, 2 - h)) / (2 * h)), '|∇V| at (1, 2) (numeric)'); }
keyed(4, 0, M.Vdip([M.DIP.axisX, 0, 0]), 'V at P as the sum of the two kq/r');
{ const x = 3, h = 1e-5, Ex = -(M.Vdip([x + h, 0, 0]) - M.Vdip([x - h, 0, 0])) / (2 * h);
  check('practice 4.2: far out past −q, −dV/dx ≈ −4akq/x³ (toward the dipole)', Ex < 0 && Math.abs(Ex + 4 * M.DIP.a * M.K * M.DIP.q / x ** 3) < 0.01 * Math.abs(Ex), `${Ex.toExponential(3)} V/m`); }
keyed(5, 0, M.rodSum(20000, [M.ROD.L + 0.1, 0, 0]), 'V as a sum of 20 000 slices k dq/r');
{ const h = 1e-4, V = a => M.rodSum(20000, [M.ROD.L + a, 0, 0]); keyed(5, 1, -(V(0.1 + h) - V(0.1 - h)) / (2 * h), 'E = −dV/da of the slice sum (numeric)'); }
keyed(6, 0, M.ringSum(4000, 0.2), 'ring V as a sum of 4000 pieces');
{ const n = 20000; let Ex = 0, Ey = 0; for (let i = 0; i < n; i++) { const a = M.ARC.span * ((i + 0.5) / n - 0.5), dq = M.ARC.Q / n, d = M.K * dq / M.ARC.R ** 2; Ex -= d * Math.cos(a); Ey -= d * Math.sin(a); }
  keyed(6, 1, Math.hypot(Ex, Ey), 'half-ring field at the centre as a vector sum of 20 000 pieces'); }
keyed(7, 0, M.Vfrom(M.Eins, 0.05), 'V = −∫E dr from far away, numeric');
{ const R2 = 1, R1 = 3, Q2 = 1, Q1 = Q2 * R1 / R2;   // same potential: kQ₁/R₁ = kQ₂/R₂
  keyed(7, 1, (Q1 / (4 * Math.PI * R1 ** 2)) / (Q2 / (4 * Math.PI * R2 ** 2)), 'σ₁/σ₂ from equal potentials'); }
keyed(8, 0, Math.sqrt(2 * (M.E_CH * M.ACC.E / M.M_P) * M.ACC.d) / 1e3, 'v² = 2ad with a = eE/m');
{ const k = M.K * 1e-9 * M.E_CH / M.M_E, f = (r, v) => [v, -k / (r * r)]; let r = 0.1, v = 0; const dt = 1e-12;   // RK4 of the radial fall
  while (r > 0.05) { const k1 = f(r, v), k2 = f(r + k1[0] * dt / 2, v + k1[1] * dt / 2), k3 = f(r + k2[0] * dt / 2, v + k2[1] * dt / 2), k4 = f(r + k3[0] * dt, v + k3[1] * dt);
    const rn = r + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), vn = v + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    if (rn <= 0.05) { v += (vn - v) * (r - 0.05) / (r - rn); r = rn; break; } r = rn; v = vn; }
  keyed(8, 1, Math.abs(v) / 1e6, 'electron speed by RK4 of m dv/dt = −ke·Q/r²'); }

for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
