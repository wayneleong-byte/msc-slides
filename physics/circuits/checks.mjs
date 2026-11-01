// node circuits/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const integ = (fn, a, b, n = 20000) => { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += fn(a + (i + 0.5) * h); return s * h; };
const h = 1e-6;

// ---------- current ----------
const { CU } = M;
check('I = nqAv_d', near(CU.n * M.E_CH * CU.A * CU.vd, CU.I), `v_d ${(CU.vd * 1e3).toFixed(4)} mm/s`);
check('J = I/A = nqv_d', near(CU.J, CU.n * M.E_CH * CU.vd));
check('J = σE', near(CU.sigma * CU.E, CU.J), `E ${CU.E.toFixed(4)} V/m`);
check('I = ∫J·dA over the cross-section (rings)', near(integ(r => CU.J * 2 * Math.PI * r, 0, CU.r), CU.I, 1e-6));
check('Drude sawtooth averages to v_d', near(integ(t => M.drudeV(t, 1.3, CU.vd), 0, 13) / 13, CU.vd, 1e-6));
check('Drude: dx/dt = v between collisions', [0.2, 0.9, 2.1].every(t => near((M.drudeX(t + h, 1, 2) - M.drudeX(t - h, 1, 2)) / (2 * h), M.drudeV(t, 1, 2), 1e-6)));
check('Drude: v_d = eEτ/2m … i.e. σ = ne²τ/m', near(CU.n * M.E_CH ** 2 * CU.tauC / CU.m, CU.sigma), `τ ${(CU.tauC * 1e15).toFixed(0)} fs`);

// ---------- resistance ----------
check('R = ρL/A: double the length, double R', near(M.rThin(2), 2 * M.rThin(1)));
check('double the diameter: a quarter of R', near(M.rThick(1.3), M.rThin(1.3) / 4));
check('a thick wire is 4 thin strands in parallel', near(M.parallelR([1, 2, 3, 4].map(() => M.rThin(1.1))), M.rThick(1.1)));
check('J = σE in a wire gives V = IR with R = L/σA', (() => { const L = 1.7, A = M.area(M.RES.dThin), sig = 1 / M.RES.rho, V = 1.5, E = V / L, I = sig * E * A; return near(V, I * M.resistance(M.RES.rho, L, A)); })());
check('length sweeps 0.5–2.0 m', near(M.resLength(0), M.RES.Lmin) && near(M.resLength(M.RES.T / 2), M.RES.Lmax));

// ---------- circuits: KCL at every point, KVL round every loop, power balance ----------
function kcl(edges, sol) {
  const sum = {}; edges.forEach((e, i) => { sum[e.a] = (sum[e.a] || 0) - sol.I[i]; sum[e.b] = (sum[e.b] || 0) + sol.I[i]; });
  return Object.values(sum).every(s => Math.abs(s) < 1e-9);
}
function power(edges, sol) {   // batteries deliver what resistors dissipate
  let gen = 0, use = 0; edges.forEach((e, i) => { if (e.E !== undefined) gen += e.E * sol.I[i]; if (e.R !== undefined) use += sol.I[i] ** 2 * e.R; });
  return near(gen, use, 1e-9);
}
const ohm = M.solve(M.OHM.edges, 'bl');
check('Ohm: I = V/R', near(M.edgeI(M.OHM, ohm, 'R'), 2), '2.00 A');
const bulb = M.solve(M.BULB.edges, 'bl'), Ib = M.edgeI(M.BULB, bulb, 'bulb'), Vb = bulb.V.tl - bulb.V.tr;
check('power: IV = I²R = V²/R', near(Ib * Vb, Ib ** 2 * M.BULB.R) && near(Ib * Vb, Vb ** 2 / M.BULB.R), `${(Ib * Vb).toFixed(2)} W`);
const ser = M.solve(M.SERIES.edges, 'br');
check('series: 2 + 4 = 6 Ω, I = 1.5 A', near(M.seriesR([2, 4]), 6) && near(M.edgeI(M.SERIES, ser, 'R1'), 1.5) && near(M.edgeI(M.SERIES, ser, 'R2'), 1.5));
check('series: ΔV₁ 3 V + ΔV₂ 6 V = 9 V', near(ser.V.tl - ser.V.tm, 3) && near(ser.V.tm - ser.V.tr, 6));
const par = M.solve(M.PARALLEL.edges, 'r3'), pI = ['R1', 'R2', 'R3', 'bat'].map(n => M.edgeI(M.PARALLEL, par, n));
check('parallel: R_eq = 1.091 Ω', near(M.parallelR([2, 4, 6]), 12 / 11), `${M.parallelR([2, 4, 6]).toFixed(3)} Ω`);
check('parallel: 4.5 + 2.25 + 1.5 = 8.25 A', near(pI[0], 4.5) && near(pI[1], 2.25) && near(pI[2], 1.5) && near(pI[3], 8.25));
check('combo: R2 + R4 + R5 = 8 Ω (the organizer wrote 10)', near(M.COMBO.R245, 8));
check('combo: R_eq = 2 + (2 ∥ 8) = 3.6 Ω', near(M.COMBO.Req, 3.6));
const stages = M.COMBO_STAGES.map(ed => M.solve(ed, 'b'));
check('combo: every stage draws the same 2.5 A', stages.every((s, k) => near(s.I[M.COMBO_STAGES[k].findIndex(e => e.n === 'bat')], 2.5)));
const c0 = stages[0], cI = n => c0.I[M.COMBO_STAGES[0].findIndex(e => e.n === n)];
check('combo: 2.0 A through R3, 0.5 A through R2, R4, R5', near(cI('R3'), 2) && near(cI('R2'), 0.5) && near(cI('R4'), 0.5) && near(cI('R5'), 0.5));
const kr = M.solve(M.KIRCH.edges, 'bl'), kI = n => M.edgeI(M.KIRCH, kr, n);
check('Kirchhoff: I₁ 0.52, I₂ 0.33, I₃ 0.19 A', [[kI('R1'), 0.52], [kI('R5'), 0.33], [kI('R3'), 0.19]].every(([a, b]) => Math.abs(a - b) < 0.005), `${kI('R1').toFixed(3)}, ${kI('R5').toFixed(3)}, ${kI('R3').toFixed(3)} A`);
check('Kirchhoff: junction rule at A: I₁ = I₂ + I₃', near(kI('R1'), kI('R5') + kI('R3')));
check('Kirchhoff: loop 1: −20I₁ − 5I₂ + 12 = 0', near(-20 * kI('R1') - 5 * kI('R5') + 12, 0));
check('Kirchhoff: loop 2 (6 V + at the bottom): −40I₃ + 5I₂ + 6 = 0', near(-40 * kI('R3') + 5 * kI('R5') + 6, 0));
const kd = M.solve(M.kirchEdges(false), 'bl');
check('Kirchhoff with 6 V drawn + at the top: I₃ < 0', kd.I[2] < 0, `I₃ ${kd.I[2].toFixed(3)} A`);
check('Kirchhoff: ΣΔV round each loop = 0', M.KIRCH.loops.every(L => near(L.slice(1).reduce((s, p, i) => s + kr.V[p] - kr.V[L[i]], 0), 0)));
for (const [name, ed, gnd] of [['Ohm', M.OHM.edges, 'bl'], ['bulb', M.BULB.edges, 'bl'], ['series', M.SERIES.edges, 'br'], ['parallel', M.PARALLEL.edges, 'r3'], ['Kirchhoff', M.KIRCH.edges, 'bl'], ['real battery', M.cellEdges(3), 'n0'], ...M.COMBO_STAGES.map((e, k) => [`combo ${k}`, e, 'b'])]) {
  const s = M.solve(ed, gnd);
  check(`${name}: KCL at every point, batteries supply Σ I²R`, kcl(ed, s) && power(ed, s));
}

// ---------- a real battery ----------
const cs = M.solve(M.cellEdges(3), 'n0');
check('real battery: terminal ΔV = emf − Ir', near(cs.V.p - cs.V.n0, M.terminalV(M.cellI(3))), `${(cs.V.p - cs.V.n0).toFixed(2)} V at 3 Ω`);
const scan = Array.from({ length: 4001 }, (_, i) => 0.25 + i * 0.002), best = scan.reduce((b, R) => (M.loadP(R) > M.loadP(b) ? R : b));
check('most power to the load when R = r', Math.abs(best - M.CELL.r) < 0.003, `${best.toFixed(3)} Ω, ${M.loadP(best).toFixed(2)} W = E²/4r`);
check('load sweeps 0.5–8 Ω', near(M.cellLoad(0), M.CELL.Rmin) && near(M.cellLoad(M.CELL.T / 2), M.CELL.Rmax));

// ---------- RC ----------
const { RC } = M;
check('τ = RC = 2.0 s', near(RC.tau, 2));
check('charging: R dq/dt = E − q/C', [0.3, 1.9, 6].every(t => near(RC.R * (M.qCharge(t + h) - M.qCharge(t - h)) / (2 * h), RC.E - M.qCharge(t) / RC.C, 1e-6)));
// integrate the ODE independently (RK4) and compare
{ let q = 0, t = 0; const dt = 1e-3, f = q => (RC.E - q / RC.C) / RC.R; while (t < 4 - 1e-12) { const k1 = f(q), k2 = f(q + dt * k1 / 2), k3 = f(q + dt * k2 / 2), k4 = f(q + dt * k3); q += dt * (k1 + 2 * k2 + 2 * k3 + k4) / 6; t += dt; }
  check('RK4 of the ODE matches EC(1 − e^−t/RC)', near(q, M.qCharge(4), 1e-8)); }
check('Q(τ) = 63.2% of Q_max', near(M.qCharge(RC.tau) / RC.Qmax, 0.632, 1e-3));
check('I(τ) = 36.8% of I_max', near(M.iCharge(RC.tau) / RC.Imax, 0.368, 1e-3));
check('I = dQ/dt (charging and discharging)', [0.5, 3].every(t => near((M.qCharge(t + h) - M.qCharge(t - h)) / (2 * h), M.iCharge(t), 1e-6) && near((M.qDischarge(t + h) - M.qDischarge(t - h)) / (2 * h), M.iDischarge(t), 1e-6)));
check('KVL in the RC loop at every moment', [0.4, 3, 7, 11, 15].every(t => { const s = M.rc(t); return s.charging ? near(RC.E - s.VR - s.Vc, 0) : near(s.Vc + s.VR, 0); }));
check('discharging: ΔV_R = ΔV_C in size', [11, 14].every(t => { const s = M.rc(t); return near(Math.abs(s.VR), s.Vc); }));
const Ecap = RC.Qmax ** 2 / (2 * RC.C), Eheat = integ(t => M.iCharge(t) ** 2 * RC.R, 0, 40 * RC.tau, 200000), Ebat = RC.Qmax * RC.E;
check('charging: battery QE splits half stored, half heat', near(Eheat, Ecap, 1e-5) && near(Ebat, Ecap + Eheat, 1e-5), `${(Ecap * 1e3).toFixed(2)} + ${(Eheat * 1e3).toFixed(2)} mJ`);
check('discharging: heat = stored Q²/2C', near(integ(t => M.iDischarge(t) ** 2 * RC.R, 0, 40 * RC.tau, 200000), M.Q0 ** 2 / (2 * RC.C), 1e-5));
check('RC: KCL at every point at every moment', [0.5, 4, 12, 17].every(t => { const s = M.rc(t), sum = {};
  const ed = [...M.RC_EDGES, s.charging ? { a: 'sa', b: 'pv' } : { a: 'pv', b: 'sb' }], I = [...s.I_e, s.charging ? s.I : -s.I];   // + the switch blade
  ed.forEach((e, i) => { sum[e.a] = (sum[e.a] || 0) - I[i]; sum[e.b] = (sum[e.b] || 0) + I[i]; });
  return Object.values(sum).every(x => Math.abs(x) < 1e-12); }));

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
{ const r = 1.0e-3, A = integ(s => 2 * Math.PI * s, 0, r), N = M.CU.n * A * 1.0, t = N * M.E_CH / 3.0;   // electrons in 1 m, and how long they take to pass
  keyed(0, 0, 1.0 / t * 1e3, 'v = 1 m ÷ time for 1 m of carriers (nA·1 m·e) to pass, A = ∫2πr dr'); }
keyed(0, 1, integ(t => 4.0 * t - t * t, 0, 4.0), 'q = ∫I dt (numeric)');
{ const n = 4000; let R = 0; for (let i = 0; i < n; i++) R += M.RES.rho * (2.0 / n) / integ(s => 2 * Math.PI * s, 0, M.RES.dThin / 2, 200); keyed(1, 0, R, 'R = Σ ρ dx / A over 4000 slices, A = ∫2πr dr'); }
{ const L = 2.0, a = M.RES.dThin / 2, b = M.RES.dThick / 2; keyed(1, 1, integ(x => M.RES.rho / (Math.PI * (a + (b - a) * x / L) ** 2), 0, L), 'tapered rod: ∫ρ dx/πr(x)² (numeric)'); }
{ const rho = 3.5e-5, a = 0.01, b = 0.02, L = 0.05; keyed(2, 1, integ(r => rho / (2 * Math.PI * r * L), a, b) * 1e5, 'radial: ∫ρ dr/2πrL (numeric)'); }
{ const s = M.solve([{ n: 'bat', a: 'g', b: 'p', E: 12 }, { n: 'b1', a: 'p', b: 'm', R: 24 }, { n: 'b2', a: 'm', b: 'g', R: 24 }], 'g');
  keyed(3, 0, s.I[1] ** 2 * 24 + s.I[2] ** 2 * 24, 'Σ I²R from the nodal solve of two bulbs in series'); }
keyed(3, 1, integ(t => (12 * t / 10) ** 2 / 24, 0, 10), 'E = ∫V²/R dt (numeric)');
{ const s = M.solve(M.cellEdges(4), 'n0'); keyed(4, 0, s.V.tr - s.V.br, 'terminal voltage from the nodal solve of the cell on 4 Ω'); }
{ const P = r => 12 ** 2 * 4 / (4 + r) ** 2; let best = 0; for (let i = 0; i <= 1000; i++) if (P(i * 0.01) > P(best)) best = i * 0.01;
  check('practice 4.2: P(r) on a 4 Ω load is largest at r = 0 (scan 0–10 Ω), the keyed choice', best === 0 && PRACTICE[4][1].choices[PRACTICE[4][1].answer] === '<i>r</i> = 0'); }
{ const n = 10000; let G = 0; for (let i = 0; i < n; i++) G += (1 + 2 * (i + 0.5) / n) / n / 12; keyed(5, 1, 1 / G, 'strips in parallel: 1/R = Σ conductances (numeric)'); }
{ const e = M.COMBO_STAGES[0].filter(x => x.n !== 'R3'), s = M.solve(e, M.COMBO.ground); keyed(6, 0, M.edgeI({ edges: e }, s, 'R1'), 'nodal solve with R₃ removed'); }
{ const Px = x => { const e = M.COMBO_STAGES[0].map(r => r.n === 'R3' ? { ...r, R: x } : r), s = M.solve(e, M.COMBO.ground); return M.edgeI({ edges: e }, s, 'R3') ** 2 * x; };
  let lo = 0.1, hi = 10; for (let i = 0; i < 200; i++) { const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3; Px(a) < Px(b) ? (lo = a) : (hi = b); }
  keyed(6, 1, (lo + hi) / 2, 'power in R₃ = x maximised by ternary search over nodal solves'); }
{ const e = M.KIRCH.edges.map(x => x.n === 'E2' ? { a: x.a, b: x.b } : x), s = M.solve(e, 'bl'); keyed(7, 0, M.edgeI({ edges: e }, s, 'R1') * 1e3, 'nodal solve with the 6 V battery a wire'); }
{ const I3 = E2 => { const e = M.KIRCH.edges.map(x => x.n === 'E2' ? { ...x, E: E2 } : x); return M.edgeI({ edges: e }, M.solve(e, 'bl'), 'R3'); }, v = PRACTICE[7][1].val;
  let lo = -10, hi = 10; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; Math.sign(I3(m)) === Math.sign(I3(lo)) ? (lo = m) : (hi = m); }
  check('practice 7.2: dI₃/dℰ₂ (finite difference) and the root of I₃(ℰ₂) (bisection) match the solution', near((I3(6.5) - I3(5.5)), v.dI, 1e-9) && near((lo + hi) / 2, v.E2zero, 1e-9), `${(v.dI * 1e3).toFixed(2)} mA/V, ${v.E2zero} V`); }
{ let q = 0, t = 0; const dt = 1e-4, f = q => (RC.E - q / RC.C) / RC.R;
  while (q / RC.C < 9.0) { const k1 = f(q), k2 = f(q + dt * k1 / 2), k3 = f(q + dt * k2 / 2), k4 = f(q + dt * k3), qn = q + dt * (k1 + 2 * k2 + 2 * k3 + k4) / 6; if (qn / RC.C >= 9.0) { t += dt * (9.0 * RC.C - q) / (qn - q); break; } q = qn; t += dt; }
  keyed(8, 0, t, 'time to 9 V by RK4 of R dq/dt = ℰ − q/C'); }
keyed(8, 1, 100 * integ(t => M.iDischarge(t) ** 2 * RC.R, 0, RC.tau) / (M.Q0 ** 2 / (2 * RC.C)), '∫I²R dt over one τ ÷ Q²/2C (numeric)');

for (const r of rows) console.log(r.filter(Boolean).join('  '));
console.log(`${rows.filter(r => r[0] === 'PASS').length}/${rows.length} pass`);
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
