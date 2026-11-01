// node induction/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-300);
const h = 1e-6;
const ddt = (fn, t) => (fn(t + h) - fn(t - h)) / (2 * h);

// ---- flux of a magnet through a loop ----
const a0 = M.FLUX.a;
check('pole flux: closed form = ∫B·dA over the disc', [[0.03, 0.13], [0.12, 0.22], [0.25, 0.35]].every(([xN, xS]) => near(M.magnetFluxNumeric(xN, xS, a0), M.magnetFlux(xN, xS, a0), 2e-4)),
  `${(M.magnetFlux(0.03, 0.13, a0) * 1e6).toFixed(2)} µWb at 3 cm`);
check('a pole at the loop sends half its flux through it: μ₀p/2', near(M.poleFlux(M.MAG.p, 1e-12, a0), M.MU0 * M.MAG.p / 2, 1e-9));
check('magnet: ∮B·dA = 0 (no monopoles): flux in through a sphere = flux out', (() => {
  let F = 0; const R = 0.2, n = 300, m = 60;     // sphere centred on the magnet, enclosing both poles
  for (let i = 0; i < n; i++) { const th = (i + 0.5) * Math.PI / n; for (let j = 0; j < m; j++) { const ph = 2 * Math.PI * (j + 0.5) / m, nr = [Math.cos(th), Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph)];
    const b = M.magnetB([0.05 + R * nr[0], R * nr[1], R * nr[2]], 0, 0.1); F += (b[0] * nr[0] + b[1] * nr[1] + b[2] * nr[2]) * R * R * Math.sin(th) * (Math.PI / n) * (2 * Math.PI / m); } }
  return Math.abs(F) < 1e-4 * M.MU0 * M.MAG.p; })());
check('Faraday: ε = −dΦ/dt (numeric)', [0.4, 1.7, 3.1, 4.6].every(t => near(M.fluxScene(t).emf, -ddt(s => M.fluxScene(s).Phi, t), 1e-5)), `peak ${(Math.max(...Array.from({ length: 600 }, (_, i) => Math.abs(M.fluxScene(i * 0.01).emf))) * 1e6).toFixed(1)} µV`);
check('page 0: the magnet comes back, Φ periodic', near(M.fluxScene(0).Phi, M.fluxScene(M.FLUX.T).Phi));
// ---- Lenz ----
for (const c of M.CASES) {
  const r = M.lenzCase(c, 1.2);
  // Lenz: the induced field at the loop's centre, along the area vector (−x), is sign(ε)·; it must oppose dΦ/dt
  const dPhi = -r.emf;
  const ok = Math.sign(r.emf) === -Math.sign(dPhi) && near(r.emf, -(M.lenzCase(c, 1.2 + h).Phi - M.lenzCase(c, 1.2 - h).Phi) / (2 * h), 1e-5);
  const grows = Math.abs(M.lenzCase(c, 2.0).Phi) > Math.abs(M.lenzCase(c, 0.5).Phi);
  check(`Lenz ${c.name}: |Φ| ${grows ? 'grows' : 'shrinks'}, ε = −dΦ/dt`, ok && grows === (c.move === 'in'), `Φ ${(r.Phi * 1e6).toFixed(2)} µWb, ε ${(r.emf * 1e6).toFixed(2)} µV`);
}
check('Lenz: N and S cases mirror (Φ and ε flip sign)', near(M.lenzCase(M.CASES[0], 1).Phi, -M.lenzCase(M.CASES[2], 1).Phi) && near(M.lenzCase(M.CASES[1], 1).emf, -M.lenzCase(M.CASES[3], 1).emf));
// ---- two coils ----
check('ring: Biot–Savart on the axis = μ₀Ia²/2(a² + z²)^{3/2}', [0, 0.03, 0.08].every(z => near(M.ringB([z, 0, 0], 0.05, 0, 2)[0], M.ringAxisB(0.05, z, 2), 1e-6)));
check('mutual inductance: ∫B·dA = Neumann ∮∮dl·dl/r', near(M.mutualFlux(), M.COILS.M1, 2e-3), `${(M.COILS.M1 * 1e9).toFixed(2)} nH per turn pair`);
check('mutual: far apart → small-loop limit μ₀πa⁴/2z³', near(M.mutualNeumann(0.01, 1.0, 200), M.MU0 * Math.PI * 1e-8 / 2, 1e-3));
check('coils: ε₂ = −M dI₁/dt = −N₂ dΦ₂/dt', [0.8, 2.2, 4.1].every(t => near(M.coilsScene(t).emf, -M.COILS.N2 * ddt(s => M.coilsScene(s).Phi2, t), 1e-5)), `M = ${(M.COILS.M * 1e6).toFixed(1)} µH`);
// ---- iron core ----
const cs = M.coreScene(1.1);
check('core: ε₂/ε₁ = N₂/N₁', near(cs.emf2 / cs.emf1, M.CORE.N2 / M.CORE.N1));
check('core: all flux shared → M² = L₁L₂', near(M.CORE.M ** 2, M.CORE.L1 * M.CORE.L2));
check('core: ε₂ = −M dI₁/dt', [0.7, 2.5, 4.4].every(t => near(M.coreScene(t).emf2, -M.CORE.M * M.coreScene(t).dI1, 1e-9)), `M = ${(M.CORE.M * 1e3).toFixed(1)} mH`);
check('core: iron multiplies B by μᵣ', near(cs.B / cs.Bair, M.CORE.muR));
// ---- wire ----
check('wire: Φ = (μ₀Ib/2π) ln((r + a)/r) = ∫B b dr', [0.02, 0.08, 0.17].every(r => near(M.wireFluxNumeric(r), M.wireFlux(r), 1e-6)));
check('wire: −dΦ/dt = (B_near − B_far)·b·v (motional)', [0.3, 1.5, 2.8].every(t => near(M.wireScene(t).emf, -ddt(s => M.wireFlux(M.WIRE.r0 + M.WIRE.v * s), t), 1e-5)), `${(M.wireScene(0).emf * 1e6).toFixed(2)} µV at the start`);
check('wire: B = μ₀I/2πr obeys Ampère ∮B·ds = μ₀I', near(M.wireB(0.07) * 2 * Math.PI * 0.07, M.MU0 * M.WIRE.I));
// ---- moving bar ----
const bs = M.barScene(0.5, false);
check('bar: charges stop moving when qE = qvB', near(M.E_CHARGE * bs.E, bs.Fmag));
check('bar: ε = ∫E·ds along it = BLv', near(bs.E * M.BAR.L, M.BAR.emf), `${M.BAR.emf.toFixed(2)} V`);
check('bar: at rest, no emf', M.barScene(0, true).emf === 0);
// ---- loop crossing a field ----
check('crossing: ε = −dΦ/dt everywhere away from the corners', [0.2, 0.5, 0.9, 1.15, 1.7].every(t => near(M.crossScene(t).emf, -ddt(s => M.crossScene(s).Phi, t), 1e-6)));
check('crossing: fully inside, both sides cancel, ε = 0', (() => { const t = (0.45 - M.CROSS.start) / M.CROSS.v, r = M.crossScene(t); return r.inLead && r.inTrail && r.emf === 0 && near(r.Phi, M.CROSS.B * M.CROSS.w * M.CROSS.h); })());
check('crossing: entering ε = −Bhv, leaving +Bhv', near(M.crossScene(0.3).emf, -M.CROSS.B * M.CROSS.h * M.CROSS.v) && near(M.crossScene(1.7).emf, M.CROSS.B * M.CROSS.h * M.CROSS.v));
// ---- rails ----
{ // integrate m dv/dt = −B²L²v/R with RK4 and compare
  const { B, L, R, m, v0 } = M.RAIL, f = v => -((B * L) ** 2) * v / (R * m); let v = v0, x = M.RAIL.x0, heat = 0; const dt = 1e-3;
  for (let i = 0; i < 3000; i++) { const k1 = f(v), k2 = f(v + k1 * dt / 2), k3 = f(v + k2 * dt / 2), k4 = f(v + k3 * dt); heat += (B * L * v) ** 2 / R * dt; x += v * dt; v += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); }
  const r = M.railScene(3);
  check('rails: v = v₀e^{−t/τ} solves m dv/dt = −B²L²v/R (RK4)', near(v, r.v, 1e-6), `τ = ${M.RAIL.tau.toFixed(2)} s`);
  check('rails: x(t) integrates v', near(x, r.x, 2e-3));
  check('rails: heat ∫I²R dt = kinetic energy lost', near(heat, r.heat, 2e-3), `${(r.heat * 1e3).toFixed(1)} mJ by 3 s`);
}
check('rails: F·v = I²R (mechanical power in = heat out)', [0, 0.7, 2.2].every(t => { const r = M.railScene(t); return near(r.F * r.v, r.P); }));
check('rails: ε = dΦ/dt = d(BLx)/dt = BLv', [0.4, 1.9].every(t => near(ddt(s => M.railScene(s).Phi, t), M.railScene(t).emf, 1e-5)));
check('rails: stops after travelling v₀τ', near(M.railScene(60).x - M.RAIL.x0, M.RAIL.v0 * M.RAIL.tau, 1e-9) && M.RAIL.x0 + M.RAIL.v0 * M.RAIL.tau < M.RAIL.len);
// ---- solenoid ----
const ss = M.solScene(0.5);
check('solenoid: L = NΦ/I = μ₀N²A/ℓ', near(ss.NPhi / ss.I, M.SOL.L), `${(M.SOL.L * 1e3).toFixed(2)} mH`);
check('solenoid: N turns summed = μ₀nI·ℓ/√(ℓ² + 4r²), within 3.5 % of the long-coil μ₀nI', near(M.solCentreB(1), M.MU0 * M.SOL.n * M.SOL.len / Math.hypot(M.SOL.len, 2 * M.SOL.r), 1e-5) && near(M.solCentreB(1), M.MU0 * M.SOL.n, 0.035), `${(M.solCentreB(1) / (M.MU0 * M.SOL.n) * 100).toFixed(1)} % of μ₀nI`);
check('solenoid: ε_L = −L dI/dt on the ramps (numeric)', [0.3, 2.6].every(t => near(M.solScene(t).emfL, -M.SOL.L * ddt(s => M.solCurrent(s).I, t), 1e-6)), `${(M.solScene(0.3).emfL * 1e3).toFixed(2)} mV`);
check('solenoid: ½LI² = (B²/2μ₀)·Aℓ', near(M.solScene(1.5).U, M.solScene(1.5).u * M.SOL.A * M.SOL.len));
check('solenoid: work ∫ε_L·I dt on the ramp = ½LI²', (() => { let W = 0; const n = 4000; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n * M.SOL.ramp, r = M.solScene(t); W += -r.emfL * r.I * M.SOL.ramp / n; } return near(W, 0.5 * M.SOL.L * M.SOL.Imax ** 2, 1e-6); })());
// ---- RL ----
check('RL growth: L dI/dt = ε − IR (numeric)', [0.2, 0.9, 2.5].every(t => near(M.RL.L * ddt(s => M.rlScene(s).I, t), M.RL.E - M.rlScene(t).I * M.RL.R, 1e-5)));
check('RL decay: L dI/dt = −IR', [4.2, 5.0, 7.1].every(t => near(M.RL.L * ddt(s => M.rlScene(s).I, t), -M.rlScene(t).I * M.RL.R, 1e-5)));
check('RL: loop rule ε − IR − L dI/dt = 0', [0.3, 1.1, 4.4, 6.0].every(t => { const r = M.rlScene(t); return Math.abs(r.emfBat - r.VR - r.VL) < 1e-12 && near(r.VL, M.RL.L * ddt(s => M.rlScene(s).I, t), 1e-5); }));
check('RL: current continuous at the switch (an inductor forbids a jump)', Math.abs(M.rlScene(M.RL.phase - 1e-9).I - M.rlScene(M.RL.phase + 1e-9).I) < 1e-6 && Math.abs(M.rlScene(2 * M.RL.phase - 1e-9).I - M.rlScene(1e-9).I) < 1e-6);
check('RL: the cycle ≈ textbook I = (ε/R)(1 − e^{−t/τ})', [0.25, 0.5, 1.5].every(t => Math.abs(M.rlScene(t).I - M.rlGrow(t)) < 1e-3 * M.RL.Imax), `I(τ) = ${M.rlScene(M.RL.tau).I.toFixed(3)} A ≈ 0.632·ε/R`);
check('RL: at t = 0 the inductor takes all of ε; later none', near(M.rlScene(0).VL, M.RL.E, 1e-3) && Math.abs(M.rlScene(M.RL.phase - 1e-6).VL) < 1e-3 * M.RL.E);
check('RL: decay heat ∫I²R dt = ½LI₀²', (() => { let Q = 0; const n = 20000; for (let i = 0; i < n; i++) Q += M.rlScene(M.RL.phase + (i + 0.5) * M.RL.phase / n).P * M.RL.phase / n; return near(Q, 0.5 * M.RL.L * (M.RL.Ib ** 2 - M.RL.Ia ** 2), 1e-6); })(), `${(0.5 * M.RL.L * M.RL.Imax ** 2).toFixed(1)} J stored at 3 A`);

// ---- LC oscillations ----
{ // step L q'' = −q/C with RK4 from q = Q, I = 0 over three periods; compare with the closed form, and watch the energy
  const { L, C, Q, T, w } = M.LC, n = 30000, dt = 3 * T / n; let q = Q, I = 0, worstQ = 0, worstI = 0, worstU = 0;
  const f = (q, I) => [I, -q / (L * C)];
  for (let i = 1; i <= n; i++) {
    const k1 = f(q, I), k2 = f(q + k1[0] * dt / 2, I + k1[1] * dt / 2), k3 = f(q + k2[0] * dt / 2, I + k2[1] * dt / 2), k4 = f(q + k3[0] * dt, I + k3[1] * dt);
    q += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); I += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    const r = M.lcScene(i * dt);
    worstQ = Math.max(worstQ, Math.abs(q - r.q) / Q); worstI = Math.max(worstI, Math.abs(I - r.I) / M.LC.Imax);
    worstU = Math.max(worstU, Math.abs(r.UE + r.UB - M.LC.U) / M.LC.U, Math.abs(q * q / (2 * C) + L * I * I / 2 - M.LC.U) / M.LC.U);
  }
  check('LC: q = Q cos ωt solves L q″ + q/C = 0 (RK4, three periods)', worstQ < 1e-8 && worstI < 1e-8, `worst ${(worstQ * 100).toExponential(1)} % of Q`);
  check('LC: q²/2C + ½LI² stays Q²/2C along the run', worstU < 1e-8, `${(M.LC.U * 1e3).toFixed(2)} mJ`);
  check('LC: ω = 1/√(LC), period 2π√(LC)', near(w, 1000, 1e-12) && near(T, 2 * Math.PI * Math.sqrt(L * C), 1e-12) && near(M.lcScene(T).q, Q, 1e-12) && near(M.lcScene(T / 2).q, -Q, 1e-12), `T = ${(T * 1e3).toFixed(3)} ms, f = ${M.LC.f.toFixed(1)} Hz`);
  { // the period from the stepped run: successive upward zero crossings of q
    let qq = Q, II = 0, prev = qq, cross = []; const h2 = T / 20000;
    for (let i = 1; i <= 50000; i++) { const k1 = f(qq, II), k2 = f(qq + k1[0] * h2 / 2, II + k1[1] * h2 / 2), k3 = f(qq + k2[0] * h2 / 2, II + k2[1] * h2 / 2), k4 = f(qq + k3[0] * h2, II + k3[1] * h2);
      qq += h2 / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); II += h2 / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (prev < 0 && qq >= 0) cross.push((i - 1 + prev / (prev - qq)) * h2); prev = qq; }
    check('LC: the stepped run repeats every 2π√(LC)', cross.length >= 2 && near(cross[1] - cross[0], T, 1e-6));
  }
}
check('LC: I = dq/dt (numeric)', [0.3e-3, 1.7e-3, 4.1e-3].every(t => near(M.lcScene(t).I, (M.lcScene(t + 1e-9).q - M.lcScene(t - 1e-9).q) / 2e-9, 1e-5)));
check('LC: loop rule q/C + L dI/dt = 0 (numeric dI/dt)', [0.5e-3, 2.2e-3, 5.0e-3].every(t => { const r = M.lcScene(t), dI = (M.lcScene(t + 1e-9).I - M.lcScene(t - 1e-9).I) / 2e-9; return Math.abs(r.V + M.LC.L * dI) < 1e-5 * M.LC.V0 && near(r.dI, dI, 1e-5); }));
check('LC: |I| is greatest (ωQ) when q = 0, and zero when |q| = Q', (() => {
  let best = 0, tb = 0; for (let i = 0; i <= 20000; i++) { const t = i * M.LC.T / 20000, I = Math.abs(M.lcScene(t).I); if (I > best) { best = I; tb = t; } }
  return near(best, M.LC.Imax, 1e-6) && Math.abs(M.lcScene(tb).q) < 1e-3 * M.LC.Q && Math.abs(M.lcScene(0).I) < 1e-12 && Math.abs(M.lcScene(M.LC.T / 2).I) < 1e-12; })(), `I_max = ωQ = ${(M.LC.Imax * 1e3).toFixed(0)} mA at t = T/4`);
check('LC: the coil holds NΦ = LI and E·d = q/C', [0.9e-3, 3.3e-3].every(t => { const r = M.lcScene(t); return near(M.LC.N * r.B * M.LC.A, M.LC.L * r.I, 1e-12) && near(r.E * M.LC.d, r.V, 1e-12); }));
check('LC: at T/8 the energy is shared half and half; at T/4 it is all in the coil', near(M.lcScene(M.LC.T / 8).UE, M.LC.U / 2, 1e-9) && near(M.lcScene(M.LC.T / 8).UB, M.LC.U / 2, 1e-9) && near(M.lcScene(M.LC.T / 4).UB, M.LC.U, 1e-12));

// ---- practice ----
{ // structure. pages.js imports world.js (three.js, browser-only), so the page count is written here: 10 pages, 0–9
  const NPAGES = 10, bad = [];
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
{ const N = 200, A = 0.005, B = t => 0.10 + (0.50 - 0.10) * t / 0.20;      // the field ramps linearly
  keyed(0, 0, N * ddt(t => A * B(t), 0.07), 'coil emf = N dΦ/dt (numeric slope)'); }
{ const Phi = t => 4.0 * t ** 3 - 6.0 * t, e = t => -ddt(Phi, t); let a = 0.1, b = 1.0;
  for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (Math.sign(e(m)) === Math.sign(e(a))) a = m; else b = m; }
  keyed(0, 1, (a + b) / 2, 'emf = 0 where dΦ/dt = 0 (bisection on the numeric slope)'); }
{ const c = M.CASES[0], n = 20000; let Q = 0; for (let i = 0; i < n; i++) Q += Math.abs(M.lenzCase(c, (i + 0.5) * M.LENZ.run / n).I) * M.LENZ.run / n;
  keyed(1, 1, Q * 1e3, 'charge = ∫I dt over the approach (numeric)'); }
{ const { muR, N1, N2, len, A } = M.CORE, I = t => 2.0 * t * t, Phi = t => muR * M.MU0 * N1 * I(t) / len * A;
  keyed(2, 1, N2 * ddt(Phi, 0.5) * 1e3, 'ε₂ = N₂ dΦ/dt from B = μᵣμ₀N₁I₁/ℓ (numeric)'); }
{ const { r0, v } = M.WIRE, dt = 1e-3; keyed(3, 1, -(M.wireFluxNumeric(r0 + v * dt) - M.wireFluxNumeric(r0 - v * dt)) / (2 * dt) * 1e6, 'ε = −dΦ/dt of the strip-summed flux'); }
{ const n = 10000, l = 0.5, w = 20, B = 0.4; let e = 0; for (let i = 0; i < n; i++) e += B * w * (i + 0.5) * l / n * l / n;
  keyed(4, 1, e, 'rod emf = Σ B(ωr)dr (numeric)'); }
{ const t = 0.3, emf = -ddt(s => M.crossScene(s).Phi, t); keyed(5, 0, emf * emf / (M.CROSS.R * M.CROSS.v) * 1e3, 'F = (ε²/R)/v: pulling power = heat (numeric ε)'); }
{ const { B, L, R, m, v0, tau } = M.RAIL, f = v => -((B * L) ** 2) * v / (R * m), dt = 1e-3; let v = v0, x = 0;
  for (let i = 0; i < 40 * tau / dt; i++) { const k1 = f(v), k2 = f(v + k1 * dt / 2), k3 = f(v + k2 * dt / 2), k4 = f(v + k3 * dt); x += dt / 6 * (v + 2 * (v + k1 * dt / 2) + 2 * (v + k2 * dt / 2) + (v + k3 * dt)); v += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); }
  keyed(6, 0, x, 'coasting distance by RK4 to 40τ'); }
{ const N = 500, l = 0.25, r = 0.01, I = 1, Bf = M.MU0 * N * I / l, U = Bf * Bf / (2 * M.MU0) * Math.PI * r * r * l;
  keyed(7, 0, 2 * U / (I * I) * 1e3, 'L = 2U/I² from the field energy B²/2μ₀ × volume'); }
{ let best = 0; for (let i = 0; i <= 20000; i++) { const t = i * (2 * Math.PI / 50) / 20000; best = Math.max(best, Math.abs(M.SOL.L * ddt(s => 2.0 * Math.sin(50 * s), t))); }
  keyed(7, 1, best * 1e3, 'largest |L dI/dt| over a period (numeric)'); }
{ const { E, R, L } = M.RL, dt = 1e-5, f = I => (E - I * R) / L; let I = 0, t = 0;
  while (I < 2.0) { const k1 = f(I), k2 = f(I + k1 * dt / 2), k3 = f(I + k2 * dt / 2), k4 = f(I + k3 * dt), In = I + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); if (In >= 2.0) { t += dt * (2.0 - I) / (In - I); I = In; break; } I = In; t += dt; }
  keyed(8, 0, t, 'time to 2.0 A by RK4 of L dI/dt = ε − IR'); }
{ // LC: step the loop equation and find the first maximum of |I|
  const { L, C, Q } = M.LC, f = (q, I) => [I, -q / (L * C)], dt = M.LC.T / 200000; let q = Q, I = 0, best = 0, tb = 0;
  for (let i = 1; i <= 100000; i++) { const k1 = f(q, I), k2 = f(q + k1[0] * dt / 2, I + k1[1] * dt / 2), k3 = f(q + k2[0] * dt / 2, I + k2[1] * dt / 2), k4 = f(q + k3[0] * dt, I + k3[1] * dt);
    q += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); I += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); if (Math.abs(I) > best) { best = Math.abs(I); tb = i * dt; } }
  const it = PRACTICE[9][0], ok = (x, y) => Math.abs(x - y) <= 5e-3 * Math.abs(y), far = (x, y) => Math.abs(x - y) > 0.02 * Math.abs(y);
  check('practice 9.1: first |I| maximum (RK4): time and size match the key; each distractor misses one', ok(it.nums[it.answer], tb * 1e3) && ok(it.nums2[it.answer], best * 1e3)
    && it.nums.every((x, k) => k === it.answer || far(x, tb * 1e3) || far(it.nums2[k], best * 1e3)), `${(tb * 1e3).toFixed(3)} ms, ${(best * 1e3).toFixed(1)} mA`); }
check('practice 9.2: at q = Q/2, energy gives |I| = (√3/2)ωQ (checked on the closed form)', (() => { const t = Math.acos(0.5) / M.LC.w; return near(Math.abs(M.lcScene(t).I), Math.sqrt(3) / 2 * M.LC.Imax, 1e-9); })());

for (const r of rows) console.log(r.filter(Boolean).join('  '));
console.log(`${rows.filter(r => r[0] === 'PASS').length}/${rows.length} pass`);
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
