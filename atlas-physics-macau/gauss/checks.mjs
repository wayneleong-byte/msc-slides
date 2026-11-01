// node gauss/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const rel = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);
const f = (x, n = 2) => x.toFixed(n);

check('k = 1/(4πε₀) ≈ 8.99×10⁹', rel(M.K, 8.99e9, 1e-3), `${(M.K / 1e9).toFixed(3)}×10⁹`);

// flux through a flat surface
check('flux: Φ = EA at θ = 0, 0 at 90°, −EA at 180°', near(M.flux(0), M.FLUX.max) && near(M.flux(90), 0) && near(M.flux(180), -M.FLUX.max), `${M.FLUX.max} N·m²/C`);
check('flux: tile sum E·n̂ dA = EA cos θ', [0, 35, 90, 140].every(d => near(M.fluxTiles(d), M.flux(d), 1e-9)));
check('uniform field through a closed cube: Φ = 0', near(M.cubeFaces(() => [M.FLUX.E, 0, 0], [0, 0, 0], 0.1, 20).reduce((a, b) => a + b), 0, 1e-12));

// Gauss's law for a point charge: any surface, any size, any position of the charge inside
const pf = M.pointField(M.POINT.q, [0, 0, 0]);
check('point charge: sphere flux = q/ε₀ for r = 8, 15, 25 cm', [0.08, 0.15, 0.25].every(r => rel(M.sphereFlux(pf, [0, 0, 0], r), M.POINT.flux, 1e-3)), `${f(M.POINT.flux, 1)} N·m²/C`);
check('point charge: off-centre sphere flux = q/ε₀', rel(M.sphereFlux(pf, [0.03, -0.02, 0.01], 0.1, 160), M.POINT.flux, 2e-3));
check('point charge: cube flux = q/ε₀', rel(M.cubeFaces(pf, [0.02, 0.01, 0], 0.1, 120).reduce((a, b) => a + b), M.POINT.flux, 2e-3));
check('point charge: E·4πr² = q/ε₀ → E = kq/r²', [0.08, 0.2].every(r => near(M.pointE(r) * 4 * Math.PI * r * r, M.POINT.flux, 1e-12)));
const bf = M.boxFaces(), bsum = bf.reduce((a, b) => a + b);
check('charge outside the box: net flux 0', Math.abs(bsum) < 2e-3 * Math.max(...bf.map(Math.abs)), `faces ${bf.map(x => f(x, 1)).join(', ')}`);
check('charge outside the box: flux in through the near face', bf[1] < 0 && bf[0] > 0);

// line of charge
check('line: E = 2kλ/r matches a long finite line summed', [0.05, 0.15].every(r => rel(M.lineNumeric(r), M.lineE(r), 1e-4)), `${f(M.lineE(0.1), 1)} N/C at 10 cm`);
const lf = M.axialField(M.lineE), lc = M.cylinderFlux(lf, [0, 0, 0], 0.1, M.LINE.L);
check('line: body flux = λL/ε₀, caps 0', rel(lc[0], M.LINE.lam * M.LINE.L / M.EPS0, 1e-3) && Math.abs(lc[1]) < 1e-9 && Math.abs(lc[2]) < 1e-9, `${f(lc[0], 2)} N·m²/C`);

// sheet and plate
check('sheet: wide disc on its axis → σ/2ε₀', rel(M.discNumeric(M.SHEET.sigma, 1000, 0.1), M.SHEET.E, 1e-3), `${f(M.SHEET.E, 1)} N/C`);
check('sheet: pillbox, 2EA = σA/ε₀', near(2 * M.SHEET.E * M.SHEET.Abox, M.SHEET.sigma * M.SHEET.Abox / M.EPS0, 1e-12));
check('plate: two faces of σ give σ/ε₀ outside, 0 in the metal', near(M.plateField(0.1), M.PLATE.E, 1e-12) && near(M.plateField(-0.1), -M.PLATE.E, 1e-12) && near(M.plateField(0), 0), `${f(M.PLATE.E, 1)} N/C`);
check('plate field is twice the sheet field for the same σ', near(M.PLATE.E, 2 * M.SHEET.E, 1e-12));

// conducting sphere: shell theorem by brute force
check('conducting sphere: surface charge gives E = 0 inside (summed)', [0.02, 0.05, 0.08].every(d => Math.abs(M.shellNumeric(M.SPH.Q, M.SPH.R, d)) < 1e-3 * M.outsideE(M.SPH.R)));
check('conducting sphere: E = kQ/r² outside (summed)', [0.15, 0.25].every(d => rel(M.shellNumeric(M.SPH.Q, M.SPH.R, d), M.cSphere.E(d), 1e-4)), `${f(M.cSphere.E(M.SPH.R), 0)} N/C at R`);

// insulating sphere
check('insulating sphere: ρ·(4/3)πR³ = Q', rel(M.SPH.rho * 4 / 3 * Math.PI * M.SPH.R ** 3, M.SPH.Q, 1e-12));
check('insulating sphere: shell sum of q_enc = ρ·(4/3)πr³', [0.03, 0.07].every(r => rel(M.shellSum(() => M.SPH.rho, r), M.iSphere.qenc(r), 1e-6)));
check('insulating sphere: E continuous at R', rel(M.iSphere.E(M.SPH.R * (1 - 1e-9)), M.iSphere.E(M.SPH.R * (1 + 1e-9)), 1e-6));
check('insulating sphere: E ∝ r inside', near(M.iSphere.E(0.06) / M.iSphere.E(0.03), 2, 1e-9));
const isf = M.radialField(M.iSphere.E);
check('insulating sphere: ∮E·dA = q_enc/ε₀ inside and outside', [0.05, 0.2].every(r => rel(M.sphereFlux(isf, [0, 0, 0], r), M.iSphere.qenc(r) / M.EPS0, 1e-3)));

// ρ = br sphere
check('ρ = br: shell sum gives q_enc = πbr⁴', [0.04, 0.1].every(r => rel(M.shellSum(M.nSphere.rho, r), M.nSphere.qenc(r), 1e-6)));
check('ρ = br: total charge Q', rel(M.nSphere.qenc(M.SPH.R), M.SPH.Q, 1e-12));
check('ρ = br: E ∝ r² inside, continuous at R', near(M.nSphere.E(0.06) / M.nSphere.E(0.03), 4, 1e-9) && rel(M.nSphere.E(M.SPH.R), M.outsideE(M.SPH.R), 1e-9));
check('all three spheres agree outside (same Q)', [0.12, 0.2].every(r => rel(M.cSphere.E(r), M.iSphere.E(r), 1e-12) && rel(M.nSphere.E(r), M.iSphere.E(r), 1e-12)));

// rods
check('rods: λ = σ·2πR = ρ·πR²', rel(M.ROD.sigma * 2 * Math.PI * M.ROD.R, M.ROD.lam, 1e-12) && rel(M.ROD.rho * Math.PI * M.ROD.R ** 2, M.ROD.lam, 1e-12));
check('rods: both match the line 2kλ/r outside', [0.08, 0.16].every(r => rel(M.cRod.E(r), 2 * M.K * M.ROD.lam / r, 1e-9) && rel(M.iRod.E(r), 2 * M.K * M.ROD.lam / r, 1e-9)));
check('insulating rod: E ∝ r inside, continuous at R', near(M.iRod.E(0.04) / M.iRod.E(0.02), 2, 1e-9) && rel(M.iRod.E(M.ROD.R * (1 - 1e-9)), M.iRod.E(M.ROD.R * (1 + 1e-9)), 1e-6));
const irf = M.axialField(M.iRod.E), ic = M.cylinderFlux(irf, [0, 0, 0], 0.03, M.ROD.L);
check('insulating rod: cylinder flux = q_enc/ε₀ inside', rel(ic[0] + ic[1] + ic[2], M.iRod.qenc(0.03) / M.EPS0, 1e-3));

// conductor in a uniform field
const h = 1e-6;
const grad = (p) => [0, 1, 2].map(i => { const a = p.slice(), b = p.slice(); a[i] += h; b[i] -= h; return -(M.cageV(a) - M.cageV(b)) / (2 * h); });
check('cage: E = −∇V outside', [[0.2, 0.05, 0.03], [-0.1, 0.18, -0.05], [0.05, -0.1, 0.2]].every(p => { const g = grad(p), e = M.cageField(p); return [0, 1, 2].every(i => near(g[i], e[i], 1e-5)); }));
check('cage: E = 0 inside the metal', M.len(M.cageField([0.05, 0.03, -0.04])) === 0);
const tang = [0.3, 1.1, 2.4].map(th => { const n = [Math.cos(th), Math.sin(th), 0], p = M.mul(n, M.CAGE.R * (1 + 1e-9)), e = M.cageField(p); return M.len(M.sub(e, M.mul(n, M.dot(e, n)))); });
check('cage: E ⊥ surface (no tangential part)', tang.every(t => t < 1e-4 * M.CAGE.E0));
check('cage: σ = ε₀E⊥ = 3ε₀E₀ cos θ', [0.2, 1.0, 2.6].every(th => { const n = [Math.cos(th), Math.sin(th), 0], e = M.cageField(M.mul(n, M.CAGE.R * (1 + 1e-9))); return near(M.EPS0 * M.dot(e, n), M.cageSigma(Math.cos(th)), 1e-5); }));
check('cage: net induced charge 0 (flux through a surrounding sphere 0)', Math.abs(M.sphereFlux(M.cageField, [0, 0, 0], 0.2)) < 1e-6 * M.CAGE.E0);
check('cage: far away the field is E₀', near(M.cageField([3, 0, 0])[0], M.CAGE.E0, 1e-3));
const line = M.fieldLine(M.cageField, [-0.4, 0.06, 0], { step: 0.004, max: 300, stop: p => M.len(p) < M.CAGE.R });
check('cage: a field line starting upstream ends on the shell', Math.abs(M.len(line[line.length - 1]) - M.CAGE.R) < 0.006, `${line.length} steps`);

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
keyed(0, 0, M.fluxTiles(60), 'flux summed tile by tile over the tilted square');
{ const b = 3.0e4, s = 0.2, n = 400; let F = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) F += b * (i + 0.5) * s / n * (s / n) ** 2;
  keyed(0, 1, F, 'Φ = Σ E·n̂ dA over a 400×400 grid'); }
keyed(1, 0, M.cubeFaces(M.pointField(M.POINT.q, [0, 0, 0]), [0, 0, 0], 0.1, 200)[0], 'flux through the +x face, integrated numerically');
keyed(1, 1, M.EPS0 * M.sphereFlux(p => M.mul(p, 5.0e4), [0, 0, 0], 0.1) * 1e9, 'q = ε₀ ∮E·dA on the sphere (numeric)');
keyed(2, 0, M.lineNumeric(0.05), 'line field by superposing a long finite line');
keyed(2, 1, integ(M.lineNumeric, 0.05, 0.2, 200), 'ΔV = ∫E dr of the superposed field (numeric)');
{ const sg = M.SHEET.sigma, d = 0.05, sheet = (s, z0, z) => Math.sign(z - z0) * s / (2 * M.EPS0), E = z => sheet(sg, -d, z) + sheet(-sg, d, z);
  keyed(3, 0, E(0.01), 'field between ±σ as the sum of two sheets');
  check('practice 3.1: outside the pair the two sheets cancel', E(0.2) === 0 && E(-0.2) === 0); }
{ const r0 = 4e-7, d = 0.05, x = 0.02; keyed(3, 1, integ(s => r0 * Math.abs(s) / d, -x, x) / (2 * M.EPS0), 'E = (∫ρ dx over the pillbox)/(2ε₀), numeric'); }
keyed(4, 1, integ(u => { const r = 1 / u, E = M.cSphere.E(r); return M.EPS0 / 2 * E * E * 4 * Math.PI * r * r / (u * u); }, 1e-9, 1 / M.SPH.R, 200000) * 1e6, 'field energy ∫ε₀E²/2 dV, numeric in u = 1/r');
keyed(5, 0, M.shellSum(r => M.SPH.rho, 0.05) / (4 * Math.PI * M.EPS0 * 0.05 ** 2), 'q_enc by summing shells, then Gauss');
{ const r = M.ROD.R / 2, n = 4000; let q = 0; for (let i = 0; i < n; i++) { const s = (i + 0.5) * r / n; q += M.ROD.rho * 2 * Math.PI * s * (r / n); }   // per metre
  keyed(6, 0, q / (M.EPS0 * 2 * Math.PI * r), 'q_enc per metre by summing rings, then Gauss'); }
{ const r0 = 1, R = 1, it = PRACTICE[6][1], E = r => integ(s => r0 * s / R * 2 * Math.PI * s, 0, r, 4000) / (M.EPS0 * 2 * Math.PI * r);
  const cands = [r => r0 * r / (2 * M.EPS0), r => r0 * r * r / (3 * M.EPS0 * R), r => r0 * r * r / (2 * M.EPS0 * R), r => r0 * r ** 3 / (3 * M.EPS0 * R * R)];
  check('practice 6.2: only the keyed formula matches the numerically integrated field (r = 0.3, 0.7)', cands.every((c, k) => (k === it.answer) === [0.3, 0.7].every(r => Math.abs(c(r) - E(r)) <= 1e-6 * E(r)))); }
keyed(7, 0, M.shellSum(M.nSphere.rho, 0.05) / (4 * Math.PI * M.EPS0 * 0.05 ** 2), 'q_enc by summing shells of ρ = br, then Gauss');
keyed(7, 1, M.shellSum(r => r * r, 0.5) / M.shellSum(r => r * r, 1), 'fraction inside R/2 by summing shells of ρ = br²');
{ const R = M.CAGE.R, n = 20000; let q = 0; for (let i = 0; i < n; i++) { const th = (i + 0.5) * Math.PI / 2 / n; q += M.cageSigma(Math.cos(th)) * 2 * Math.PI * R * R * Math.sin(th) * Math.PI / 2 / n; }
  keyed(8, 1, q * 1e9, 'induced charge = ∫σ dA over the half (numeric)'); }

for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
