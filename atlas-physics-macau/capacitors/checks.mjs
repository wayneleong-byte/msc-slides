// node capacitors/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-300);
const pF = c => `${(c * 1e12).toFixed(2)} pF`;

// capacitance depends on geometry only
check('C = ε₀A/d = 7.08 pF', near(M.C0, 7.08e-12, 1e-3), pF(M.C0));
check('C = Q/ΔV is the same at every voltage', [0.7, 2, 3.3].every(t => near(M.charging(t).Q / M.charging(t).V, M.C0)));
// a sheet's field: rings summed numerically against the closed form, and the infinite-sheet limit
const sig = M.Q0 / M.PLATE.A;
check('disc field: ring sum = closed form', [0.005, 0.02, 0.05].every(z => near(M.discAxisENumeric(sig, 0.1, z), M.discAxisE(sig, 0.1, z), 1e-4)));
check('wide disc → sheet: E → σ/2ε₀', near(M.discAxisE(sig, 1e4, 0.02), M.sheetE(sig), 1e-5));
check('between the plates E₊ + E₋ = σ/ε₀ = Q/(ε₀A)', near(2 * M.sheetE(sig), M.E0, 1e-3), `${(2 * M.sheetE(sig)).toFixed(0)} V/m`);
check('outside wide plates E₊ − E₋ → 0', Math.abs(M.discAxisE(sig, 1e4, 0.03) - M.discAxisE(sig, 1e4, 0.03 + M.PLATE.d)) < 1e-5 * M.E0);
// Gauss: the pillbox through the + plate
const qEnc = sig * M.PILLBOX.A, flux = M.E0 * M.PILLBOX.A;
check('pillbox: flux EA = q_enc/ε₀', near(flux, qEnc / M.EPS0, 1e-3), `${(flux * 1e3).toFixed(3)} mV·m`);
// isolated plates: E fixed, ΔV = Ed, C = ε₀A/d
check('isolated plates: E stays put as d changes', near(M.gapScene(1).E, M.gapScene(4).E));
check('ΔV = −∫E·ds = Ed (numeric)', [1, 3, 5].every(t => { const g = M.gapScene(t); return near(M.lineIntegral(() => g.E, 0, g.d), g.V, 1e-9); }));
check('C·ΔV = Q at every gap', [0.5, 2.5, 6].every(t => { const g = M.gapScene(t); return near(g.C * g.V, M.Q0, 1e-9); }));
// spherical capacitor
check('sphere: Gauss flux through r = Q/ε₀', [0.12, 0.15, 0.19].every(r => near(M.fluxSphere(M.sphE, r), M.SPH.Q / M.EPS0, 1e-4)));
check('sphere: ∫_a^b E dr = ΔV = Q/C', near(M.lineIntegral(M.sphE, M.SPH.a, M.SPH.b, 20000), M.V0, 1e-6), pF(M.SPH.C));
check('sphere: E = −dV/dr', [0.12, 0.17].every(r => near(-(M.sphV(r + 1e-6) - M.sphV(r - 1e-6)) / 2e-6, M.sphE(r), 1e-5)));
check('sphere: b → ∞ gives the lone sphere 4πε₀a', near(4 * Math.PI * M.EPS0 * 0.1 * 1e9 / (1e9 - 0.1), 4 * Math.PI * M.EPS0 * 0.1, 1e-8));
check('sphere: thin gap → parallel plates ε₀A/d', near(4 * Math.PI * M.EPS0 * 1 * 1.001 / 0.001, M.cPlate(4 * Math.PI, 0.001), 2e-3));
// cylindrical capacitor
check('cylinder: Gauss E·2πrL = Q/ε₀', [0.03, 0.06].every(r => near(M.cylE(r) * 2 * Math.PI * r * M.CYL.L, M.CYL.Q / M.EPS0, 1e-9)));
check('cylinder: ∫_a^b E dr = ΔV = Q/C', near(M.lineIntegral(M.cylE, M.CYL.a, M.CYL.b, 20000), M.V0, 1e-6), pF(M.CYL.C));
check('cylinder: E = −dV/dr', [0.03, 0.07].every(r => near(-(M.cylV(r + 1e-7) - M.cylV(r - 1e-7)) / 2e-7, M.cylE(r), 1e-5)));
// energy
const fi = M.filling(M.FILL_T);
check('energy: ∫V dq = Q²/2C (numeric)', near(M.lineIntegral(q => q / M.C0, 0, M.Q0), fi.U, 1e-9), `${(fi.U * 1e9).toFixed(2)} nJ`);
check('energy: ½CV² = Q²/2C = ½QV', near(0.5 * M.C0 * M.V0 ** 2, M.Q0 ** 2 / (2 * M.C0)) && near(0.5 * M.Q0 * M.V0, M.U0));
check('energy density: ½ε₀E² × Ad = U', near(fi.u * M.PLATE.A * M.PLATE.d, M.U0, 1e-9));
// series and parallel (Kirchhoff)
const S = M.SER, P = M.PAR;
check('series: same Q on each', near(S.Q1, S.Q2) && near(S.Q1, 12e-6, 1e-6), `${(S.Q * 1e6).toFixed(1)} µC`);
check('series: ΔV₁ + ΔV₂ = battery (loop rule)', near(S.V1 + S.V2, M.CIRC.V), `${S.V1.toFixed(1)} + ${S.V2.toFixed(1)} V`);
check('series: 1/C = 1/C₁ + 1/C₂ = 1.33 µF', near(S.C, 4e-6 / 3));
check('parallel: same ΔV, Q₁ + Q₂ = C_eq·V (junction rule)', near(P.V1, P.V2) && near(P.Q1 + P.Q2, P.C * M.CIRC.V), `${(P.Q1 * 1e6).toFixed(0)} + ${(P.Q2 * 1e6).toFixed(0)} µC`);
check('series C_eq < smallest, parallel C_eq > largest', S.C < M.CIRC.C1 && P.C > M.CIRC.C2);
// dielectrics
const iso1 = M.slab(1, false), con1 = M.slab(1, true);
check('full slab, isolated: E and ΔV fall by 1/κ', near(iso1.E, M.E0 / M.KAPPA) && near(iso1.V, M.V0 / M.KAPPA));
check('full slab: C rises by κ', near(iso1.C, M.KAPPA * M.C0));
check('half slab: C = C/2·(1 + κ) (two in parallel)', near(M.cPartial(0.5), M.C0 / 2 * (1 + M.KAPPA)));
check('isolated: free charge adds back to Q', [0.2, 0.5, 0.9].every(x => { const s = M.slab(x, false); return near(s.sigAir * M.PLATE.A * (1 - x) + s.sigDie * M.PLATE.A * x, M.Q0, 1e-9); }));
check('in the slab: (σ_free − σ_bound)/ε₀ = E', [0.3, 1].every(x => { const s = M.slab(x, true); return near((s.sigDie - s.sigBound) / M.EPS0, s.E, 1e-9); }));
check('connected: E stays V/d, Q rises κ×', near(con1.E, M.E0) && near(con1.Q, M.KAPPA * M.Q0));
check('connected: battery work V·ΔQ = 2ΔU', near(M.V0 * (con1.Q - M.Q0), 2 * (con1.U - M.U0), 1e-9));
check('isolated: U falls to U₀/κ', near(iso1.U, M.U0 / M.KAPPA));
check('molecule: θ(t) solves dθ/dt = −sin θ/τ', [0.3, 0.9].every(t => near((M.align(2, t + 1e-6) - M.align(2, t - 1e-6)) / 2e-6, -Math.sin(M.align(2, t)) / M.ALIGN_TAU, 1e-5)));
check('dipole: τ = −dU/dθ', [0.4, 1.9].every(th => near(M.dipoleTorque(1, 1, th), (M.dipoleU(1, 1, th + 1e-6) - M.dipoleU(1, 1, th - 1e-6)) / 2e-6, 1e-6)));
// conductor in equilibrium
const R = M.COND.R;
check('conductor: E = 0 inside', [[0, 0, 0], [0.05, 0.03, -0.02]].every(p => Math.hypot(...M.condE(...p)) === 0));
check('conductor: surface is one potential', [0.1, 0.9, 1.7, 2.8].every(th => Math.abs(M.condV(R * (1 + 1e-9) * Math.cos(th), R * (1 + 1e-9) * Math.sin(th), 0)) < 1e-6));
check('conductor: E ⊥ surface (no tangential part)', [0.3, 1.2, 2.5].every(th => { const n = [Math.cos(th), Math.sin(th), 0], e = M.condE(...n.map(c => c * R * (1 + 1e-9))); return Math.abs(-e[0] * n[1] + e[1] * n[0]) < 1e-3; }));
check('conductor: E at surface = σ/ε₀', [0.2, 1.0, 2.9].every(th => { const n = [Math.cos(th), Math.sin(th), 0], e = M.condE(...n.map(c => c * R * (1 + 1e-9))); return near(e[0] * n[0] + e[1] * n[1], M.condSigma(th) / M.EPS0, 1e-4); }));
{ let q = 0; const n = 400; for (let i = 0; i < n; i++) { const th = (i + 0.5) * Math.PI / n; q += M.condSigma(th) * 2 * Math.PI * R * R * Math.sin(th) * Math.PI / n; }
  check('conductor: induced charge sums to zero', Math.abs(q) < 1e-6 * 3 * M.EPS0 * M.COND.E0 * R * R, `${q.toExponential(1)} C`); }
check('conductor: E = −∇V (numeric)', [[0.2, 0.1, 0.05], [-0.15, -0.12, 0.02]].every(p => { const e = M.condE(...p), h = 1e-6; return [0, 1, 2].every(j => { const a = p.slice(), b = p.slice(); a[j] += h; b[j] -= h; return near(-(M.condV(...a) - M.condV(...b)) / (2 * h), e[j], 1e-5); }); }));
check('conductor: far away E → E₀', near(M.condE(50, 3, 0)[0], M.COND.E0, 1e-5));
check('conductor: field lines end on the surface', (() => { const l = M.traceLine([-0.3, 0.04, 0]), e = l[l.length - 1]; return Math.abs(Math.hypot(...e) - R) < 0.006; })());

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
const ddx = (fn, x, h = 1e-6 * Math.max(Math.abs(x), 1)) => (fn(x + h) - fn(x - h)) / (2 * h);
{ const Q = t => M.C0 * (20 + (100 - 20) * t / 4.0); keyed(0, 1, ddx(Q, 2.0) * 1e12, 'I = dQ/dt of the ramped charge (numeric)'); }
{ const sig = M.Q0 / M.PLATE.A; keyed(1, 0, M.lineIntegral(() => 2 * M.sheetE(sig), 0, 0.08), 'ΔV = ∫E ds with E from the two sheets, Q fixed'); }
keyed(1, 1, ddx(x => M.Q0 * M.Q0 / (2 * M.cPlate(M.PLATE.A, x)), M.PLATE.d) * 1e6, 'F = dU/dx of Q²/2C(x) (numeric)');
{ const { a, b } = M.SPH, V = r => M.V0 * (1 / r - 1 / b) / (1 / a - 1 / b); keyed(2, 0, -ddx(V, 0.15), 'E = −dV/dr of the potential fixed by its two boundary values'); }
keyed(2, 1, M.lineIntegral(M.sphE, M.SPH.a, 0.15, 20000), 'ΔV = ∫E dr from a to 15 cm (numeric)');
{ const { a, L } = M.CYL, b = 0.16, lam = 1e-9, dV = M.lineIntegral(r => lam / (2 * Math.PI * M.EPS0 * r), a, b, 20000); keyed(3, 0, lam * L / dV * 1e12, 'C = Q/∫E dr for the wider tube (numeric)'); }
{ const u = r => 0.5 * M.EPS0 * M.cylE(r) ** 2 * 2 * Math.PI * r * M.CYL.L, n = 20000;
  keyed(3, 1, 100 * M.lineIntegral(u, M.CYL.a, 2 * M.CYL.a, n) / M.lineIntegral(u, M.CYL.a, M.CYL.b, n), '∫u dV over the inner shell ÷ the whole (numeric)'); }
keyed(4, 0, 100 * M.lineIntegral(q => q / M.C0, M.Q0 / 2, M.Q0) / M.lineIntegral(q => q / M.C0, 0, M.Q0), '∫V dq over the second half ÷ the whole (numeric)');
{ const d2 = M.PLATE.d / 2, E = M.V0 / d2; keyed(4, 1, 0.5 * M.EPS0 * E * E * M.PLATE.A * d2 * 1e9, 'U = ½ε₀E² × volume at the new gap'); }
{ const { C1, C2, V } = M.CIRC; let lo = 0, hi = V * C2; for (let i = 0; i < 100; i++) { const q = (lo + hi) / 2; (q / C1 + q / C2 < V) ? (lo = q) : (hi = q); }
  const Q = (lo + hi) / 2; keyed(5, 0, Q / C1, 'loop rule solved for Q by bisection, then Q/C₁');
  keyed(5, 1, M.lineIntegral(q => q / C1 + q / C2, 0, Q) * 1e6, '∫(q/C₁ + q/C₂) dq to the bisected Q (numeric)'); }
{ const s = M.slab(1, false), sigF = M.Q0 / M.PLATE.A, sigB = sigF * (1 - 1 / M.KAPPA); keyed(6, 0, (sigF - sigB) / M.EPS0 * M.PLATE.d, 'ΔV = (σ_free − σ_bound)d/ε₀');
  check('practice 6 (model): full isolated slab ΔV matches', near(s.V, M.V0 / M.KAPPA)); }
{ const it = PRACTICE[6][1], sig = 1, dV = M.lineIntegral(x => sig / (M.EPS0 * (1 + 2 * x / M.PLATE.d)), 0, M.PLATE.d, 20000);
  check('practice 6.2: graded dielectric C = Q/∫E dx (numeric)', near(sig * M.PLATE.A / dV, it.val, 1e-6) && it.solution.includes((it.val * 1e12).toFixed(2)), `${(it.val * 1e12).toFixed(2)} pF`); }
{ const E = M.V0 / M.PLATE.d; keyed(7, 0, ((M.KAPPA * M.EPS0 * E) * M.PLATE.A - M.Q0) * 1e12, 'ΔQ = κε₀(V/d)A − Q₀ from Gauss in the slab'); }
{ const side = M.PLATE.side; keyed(7, 1, -ddx(x => M.slab(x, false).U, 0.5) / side * 1e9, 'F = −dU/ds of the model’s isolated slab energy (numeric)'); }
{ let q = 0; const n = 4000, R = M.COND.R; for (let i = 0; i < n; i++) { const th = (i + 0.5) * (Math.PI / 2) / n; q += M.condSigma(th) * 2 * Math.PI * R * R * Math.sin(th) * (Math.PI / 2) / n; }
  keyed(8, 1, q * 1e9, '∫σ dA over the downfield hemisphere (numeric)'); }

for (const r of rows) console.log(r.filter(Boolean).join('  '));
console.log(`${rows.filter(r => r[0] === 'PASS').length}/${rows.length} pass`);
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
