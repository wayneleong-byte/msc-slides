// node magnetism/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const near = (a, b, tol = 1e-9) => rel(a, b) <= tol;
const vnear = (a, b, tol) => M.len(M.sub(a, b)) <= tol * Math.max(M.len(b), 1e-300);
const e = (x, n = 3) => x.toExponential(n);
const uT = x => `${(x * 1e6).toFixed(2)} μT`;

// ---------- Biot–Savart itself ----------
{ const A = [-0.3, 0.1, 0.05], B = [0.4, -0.2, 0.1], P = [0.05, 0.12, -0.08];
  check('straight piece: exact Biot–Savart = sum of 4000 small dl', vnear(M.segB(A, B, 3, P), M.bsNumeric([A, B], 3, P, 4000, false), 1e-6)); }
check('straight piece, very long: B → μ₀I/2πr', near(M.len(M.segB([0, -1e4, 0], [0, 1e4, 0], 5, [0.07, 0, 0])), M.MU0 * 5 / (2 * Math.PI * 0.07), 1e-7));
check('right-hand rule: current +x, point at +y → B along +z', M.segB([-1, 0, 0], [1, 0, 0], 1, [0, 0.1, 0])[2] > 0);

// ---------- 1 · bar magnet ----------
{ const Bc = M.magnetB([0, 0, 0]), Bout = M.magnetB([0.2, 0, 0]);
  check('magnet: inside, B points S → N (+x)', Bc[0] > 0 && Math.abs(Bc[1]) < 1e-9 * Bc[0], `${(Bc[0] * 1000).toFixed(0)} mT at the centre`);
  check('magnet: outside on the axis, B still leaves N (+x)', Bout[0] > 0);
  check('magnet: beside the middle, B runs N → S (−x)', M.magnetB([0, 0.06, 0])[0] < 0);
  const s = M.boxFlux(M.magnetB, M.MAG_BOX.c, M.MAG_BOX.h, 60);
  check('Gauss for magnetism: ∮B·dA = 0 through a box round the N end', Math.abs(s.total) < 0.001 * s.out, `out ${e(s.out)} Wb, in ${e(s.in)} Wb`);
  const s2 = M.sphereFlux(M.magnetB, [0, 0, 0], 0.2, 80);
  check('Gauss for magnetism: ∮B·dA = 0 round the whole magnet', Math.abs(s2.total) < 0.01 * s2.out); }

// ---------- 2 · F = qv × B ----------
{ const F = M.rhrForce(M.QE, 90);
  check('F = qvB sin θ at 90°', near(M.len(F), M.RHR.Fmax), `${e(M.RHR.Fmax, 2)} N`);
  check('F = qvB sin θ at every angle', [0, 30, 60, 120, 150, 180].every(d => near(M.len(M.rhrForce(M.QE, d)), M.RHR.Fmax * Math.sin(d * Math.PI / 180), 1e-9) || M.len(M.rhrForce(M.QE, d)) < 1e-25));
  check('F ⊥ v and F ⊥ B, so B does no work (F·v = 0)', [20, 70, 130].every(d => Math.abs(M.dot(M.rhrForce(M.QE, d), M.rhrV(d))) < 1e-30 && Math.abs(M.rhrForce(M.QE, d)[0]) < 1e-30));
  check('proton pushed up (+y), electron down', M.rhrForce(M.QE, 90)[1] > 0 && M.rhrForce(-M.QE, 90)[1] < 0); }

// ---------- 3 · circling ----------
check('speed from qΔV = ½mv²', M.CYC.dV.every((V, i) => near(0.5 * M.MP * M.CYC.v[i] ** 2, M.QE * V)), `${M.CYC.v.map(v => e(v, 2)).join(', ')} m/s`);
check('four times the voltage, twice the speed and twice the radius', near(M.CYC.v[1] / M.CYC.v[0], 2) && near(M.CYC.r[1] / M.CYC.r[0], 2));
check('r = mv/qB from qvB = mv²/r', M.CYC.r.every((r, i) => near(M.QE * M.CYC.v[i] * M.CYC.B, M.MP * M.CYC.v[i] ** 2 / r)), `${M.CYC.r.map(r => (r * 100).toFixed(2)).join(', ')} cm`);
check('closed-form orbit obeys m dv/dt = qv × B', [0, 1].every(i => [0.1, 0.37].every(f => { const t = f * M.CYC.T, h = M.CYC.T * 1e-6;
  const a = M.mul(M.sub(M.orbit(i, t + h).v, M.orbit(i, t - h).v), 1 / (2 * h)); return vnear(M.mul(a, M.MP), M.orbit(i, t).F, 1e-6); })));
check('stepping the force by RK4 reproduces the orbit', [0, 1].every(i => { const o = M.orbit(i, 0), n = 4000, r = M.pushCharge(M.QE, M.MP, o.p, o.v, [0, 0, 0], [0, -M.CYC.B, 0], 0.3 * M.CYC.T / n, n);
  return M.len(M.sub(r.p, M.orbit(i, 0.3 * M.CYC.T).p)) < 1e-9 * 100 * M.CYC.r[i]; }));
check('both return to the start together: T = 2πm/qB, not depending on v', [0, 1].every(i => M.len(M.sub(M.orbit(i, M.CYC.T).p, M.orbit(i, 0).p)) < 1e-12), `T ${e(M.CYC.T, 3)} s, f ${(M.CYC.f / 1e6).toFixed(3)} MHz`);
check('no work: the speed stays constant', [0, 1].every(i => [0.2, 0.55, 0.9].every(f => near(M.len(M.orbit(i, f * M.CYC.T).v), M.CYC.v[i], 1e-12))));

// ---------- 4 · velocity selector ----------
{ const mid = M.SEL.paths[1], last = mid[mid.length - 1];
  check('v = E/B goes straight through', last.p[0] >= M.SEL.L && Math.abs(last.p[1]) < 1e-12 * M.SEL.L, `${e(M.SEL.v0, 2)} m/s`);
  check('at v = E/B, qE and qvB cancel', M.len(M.add(M.selForces(mid[0]).FE, M.selForces(mid[0]).FB)) < 1e-30);
  const slow = M.SEL.paths[0], fast = M.SEL.paths[2];
  check('slower: qE wins, bends toward the − plate', slow[slow.length - 1].p[1] < -1e-4);
  check('faster: qvB wins, bends toward the + plate', fast[fast.length - 1].p[1] > 1e-4);
  check('both deflected ones still leave the plates', [slow, fast].every(P => P[P.length - 1].p[0] >= M.SEL.L), `${(slow[slow.length - 1].p[1] * 100).toFixed(2)} cm, +${(fast[fast.length - 1].p[1] * 100).toFixed(2)} cm`);
  // only E does work: ΔKE = qE·Δy
  check('energy: ΔKE = −q E Δy (B does none of it)', [slow, fast].every(P => { const a = P[0], b = P[P.length - 1];
    return near(0.5 * M.MP * (M.dot(b.v, b.v) - M.dot(a.v, a.v)), -M.QE * M.SEL.E * (b.p[1] - a.p[1]), 1e-5); })); }
check('Hall effect: ΔV_H = IBd/(nqA) = v_d B d', near(M.HALL.V, M.HALL.I * M.HALL.B * M.HALL.d / (M.HALL.n * M.QE * M.HALL.A)), `${(M.HALL.V * 1e6).toFixed(2)} μV`);

// ---------- 5 · loop in a field ----------
check('loop: ΣF = 0 at every angle', [0, 35, 90, 140].every(d => M.len(M.loopSides(d).reduce((s, x) => M.add(s, x.F), [0, 0, 0])) < 1e-12));
check('loop: Σ r × F = μ × B', [10, 60, 90, 150].every(d => vnear(M.loopTorque(d), M.cross(M.loopMu(d), [M.LOOP.B, 0, 0]), 1e-12)));
check('loop: τ = μB sin θ, μ = IA', near(M.len(M.loopTorque(90)), M.LOOP.mu * M.LOOP.B) && near(M.len(M.loopTorque(30)), M.LOOP.tmax * 0.5, 1e-9), `μ ${M.LOOP.mu.toFixed(3)} A·m², τmax ${M.LOOP.tmax.toFixed(3)} N·m`);
check('loop: the vertical sides each feel IbB', [0, 70].every(d => near(M.len(M.loopSides(d)[0].F), M.LOOP.I * M.LOOP.b * M.LOOP.B)));
check('loop: τ = −dU/dθ with U = −μ·B', [20, 80, 130].every(d => { const h = 1e-4, dU = (M.loopU(d + h) - M.loopU(d - h)) / (2 * h * Math.PI / 180);
  return near(-dU, -M.LOOP.tmax * Math.sin(d * Math.PI / 180), 1e-6); }));
check('loop: the torque turns μ toward B', [30, 120].every(d => M.loopTorque(d)[1] > 0));
check('loop: stable at θ = 0 (U min), unstable at 180° (U max)', near(M.loopU(0), -M.LOOP.tmax) && near(M.loopU(180), M.LOOP.tmax));
{ const F = M.semicircleForce(3, 0.1, 0.4);
  check('semicircle: ∫ I ds × B = 2IRB, as for its straight chord', near(F[1], 2 * 3 * 0.1 * 0.4, 1e-6) && Math.abs(F[0]) < 1e-12, `${F[1].toFixed(4)} N`); }

// ---------- 6 · Ampère ----------
check('wire: Biot–Savart (100 m) = μ₀I/2πr', [0.03, 0.08, 0.12].every(r => near(M.len(M.wireB([r, 0, 0])), M.ampereB(r), 1e-5)), uT(M.ampereB(0.05)) + ' at 5 cm');
check('wire: B circles the wire by the right-hand rule (counterclockwise from above)', M.wireB([0.05, 0, 0])[2] < 0 && M.wireB([0, 0, 0.05])[0] > 0);
check('Ampère: ∮B·ds = μ₀I round the wire, any radius', [0.03, 0.07, 0.12].every(r => near(M.lineIntegral(M.wireB, M.circlePts([0, 0, 0], r, 'y', 720)), M.MU0 * M.AMP.I, 1e-4)));
check('Ampère: ∮B·ds = μ₀I for an off-centre loop too', near(M.lineIntegral(M.wireB, M.circlePts([0.02, 0, -0.01], 0.05, 'y', 2000)), M.MU0 * M.AMP.I, 1e-4));
check('Ampère: ∮B·ds = 0 for a loop not around the wire', Math.abs(M.lineIntegral(M.wireB, M.circlePts([0.1, 0, 0], 0.04, 'y', 720))) < 1e-4 * M.MU0 * M.AMP.I);
check('thick wire: B = μ₀Ir/2πa² inside meets μ₀I/2πr at the surface', near(M.ampereB(M.AMP.a * (1 - 1e-12)), M.ampereB(M.AMP.a)) && near(M.ampereB(M.AMP.a / 2), M.ampereB(M.AMP.a) / 2));
{ const s = M.fluxStrips(M.FLUX.strips, 400).reduce((a, b) => a + b, 0);
  check('flux beside the wire: Σ B b dr = μ₀Ib/2π · ln((a+c)/a)', near(s, M.FLUX.phi, 1e-5), `${e(M.FLUX.phi)} Wb`); }

// ---------- 7 · circular loop ----------
check('loop centre: Biot–Savart sum = μ₀I/2R', near(M.len(M.ringB([0, 0, 0])), M.RING.Bc, 1e-3), uT(M.RING.Bc));
check('loop axis: Biot–Savart sum = μ₀IR²/2(R²+z²)^{3/2}', [0.05, 0.15, 0.3].every(z => near(M.ringB([z, 0, 0])[0], M.ringAxis(z), 1e-3)));
check('loop axis: the dB of the pieces add to the same, sideways parts cancel', [0, 0.1, 0.25].every(z => { const s = M.ringPieces(z).reduce((a, p) => M.add(a, p.dB), [0, 0, 0]);
  return near(s[0], M.ringAxis(z), 1e-9) && Math.hypot(s[1], s[2]) < 1e-12 * s[0]; }));
check('loop far away: B → μ₀IR²/2z³ (a dipole)', near(M.ringAxis(3), M.ringFar(3), 0.004));
check('loop: B through the middle along +x (right-hand rule)', M.ringB([0, 0, 0])[0] > 0);

// ---------- 8 · parallel wires ----------
{ const s = M.pairForce(1), o = M.pairForce(-1);
  check('wires: F/L = μ₀I₁I₂/2πd', near(M.len(s.F), M.WIRES.FL, 1e-5), `${(M.WIRES.FL * 1000).toFixed(2)} mN/m`);
  check('same direction attract: force on wire 2 toward wire 1', s.F[0] < 0);
  check('opposite directions repel', o.F[0] > 0);
  check('same direction: B = 0 midway between them', M.len(M.pairB(1)([0, 0, 0])) < 1e-12);
  check('opposite: B midway is double one wire\'s', near(M.len(M.pairB(-1)([0, 0, 0])), 2 * M.ampereB(M.WIRES.d / 2), 1e-5)); }

// ---------- 9 · solenoid and toroid ----------
{ const Bc = M.solB([0, 0, 0])[0];
  check('solenoid: stacked-loop sum matches the smooth sheet on the axis', [0, 0.1, 0.2, 0.3].every(x => near(M.solB([x, 0, 0])[0], M.solAxis(x), 0.01)), `${uT(Bc)} at the centre`);
  check('solenoid: centre B is within 5% of μ₀nI (it is only 6.7 radii long)', rel(Bc, M.SOL.B) < 0.05, uT(M.SOL.B));
  check('solenoid: uniform across the inside (within 2%)', [0.02, 0.04].every(y => rel(M.solB([0, y, 0])[0], Bc) < 0.02));
  check('solenoid: at the end, half the middle', rel(M.solAxis(M.SOL.L / 2), M.solAxis(0) / 2) < 0.05);
  check('solenoid: outside is weak (< 3% of inside)', Math.abs(M.solB([0, 0.14, 0])[0]) < 0.03 * Bc, uT(Math.abs(M.solB([0, 0.14, 0])[0])) + ' at 14 cm');
  const amp = M.lineIntegral(M.solB, M.rectPath());
  check('solenoid: ∮B·ds round the Amperian rectangle = μ₀ N_enc I', near(amp, M.MU0 * M.rectTurns() * M.SOL.I, 2e-3), `${M.rectTurns()} turns inside`); }
{ const B = M.torB([M.TOR.R0, 0, 0]);
  check('toroid: inside, B = μ₀NI/2πr (within 2%)', [0.115, 0.13, 0.14].every(r => rel(M.len(M.torB([r, 0, 0])), M.torIdeal(r)) < 0.02), uT(M.torIdeal(M.TOR.R0)) + ' at r = 13 cm');
  check('toroid: B runs round the ring', Math.abs(B[2]) > 100 * Math.hypot(B[0], B[1]));
  check('toroid: B ≈ 0 in the hole and outside', M.len(M.torB([0.05, 0, 0])) < 0.03 * M.len(B) && M.len(M.torB([0.21, 0, 0])) < 0.03 * M.len(B));
  check('toroid: ∮B·ds = μ₀NI on a circle inside the ring', near(M.lineIntegral(M.torB, M.circlePts([0, 0, 0], M.TOR.R0, 'y', 720)), -M.MU0 * M.TOR.N * M.TOR.I, 3e-3) || near(M.lineIntegral(M.torB, M.circlePts([0, 0, 0], M.TOR.R0, 'y', 720)), M.MU0 * M.TOR.N * M.TOR.I, 3e-3)); }

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
const integ = (fn, a, b, n = 20000) => { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += fn(a + (i + 0.5) * h); return s * h; };
{ const B = 0.40, R = 0.05, n = 400; let F = 0; for (let i = 0; i < n; i++) { const th = (i + 0.5) * (Math.PI / 2) / n; for (let j = 0; j < n; j++) { const ph = (j + 0.5) * 2 * Math.PI / n, nh = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
    F += M.dot([0, 0, B], nh) * R * R * Math.sin(th) * (Math.PI / 2 / n) * (2 * Math.PI / n); } }
  keyed(0, 1, F * 1e3, 'flux through the dome, patch by patch (numeric)'); }
keyed(1, 1, integ(d => M.len(M.rhrForce(M.QE, d)), 0, 180, 4000) / 180 / 1e-14, 'average of |q v × B| over the sweep, from the model’s vectors');
{ const m = 2 * M.MP, v = Math.sqrt(2 * M.QE * M.CYC.dV[1] / m), T = 2 * Math.PI * m / (M.QE * M.CYC.B), steps = 4000;
  const half = M.pushCharge(M.QE, m, [0, 0, 0], [v, 0, 0], [0, 0, 0], [0, -M.CYC.B, 0], T / 2 / steps, steps);
  keyed(2, 0, M.len(half.p) / 2 * 100, 'RK4 half-orbit: diameter ÷ 2'); }
{ const T = PRACTICE[2][1].val, steps = 4000, v = M.CYC.v[0], s = M.pushCharge(M.QE, M.MP, [0, 0, 0], [v, 0, 0], [0, 0, 0], [0, -M.CYC.B, 0], T / steps, steps),
    q = M.pushCharge(M.QE, M.MP, [0, 0, 0], [v, 0, 0], [0, 0, 0], [0, -M.CYC.B, 0], T / 2 / steps, steps);
  check('practice 2.2: after T = 2πm/qB the RK4 proton is back at the start (and halfway at T/2)', M.len(s.p) < 1e-6 * M.CYC.r[0] && M.len(q.p) > 1.99 * M.CYC.r[0], `${(T * 1e6).toFixed(3)} μs`); }
{ const v = [1.25 * M.SEL.v0, 0, 0]; keyed(3, 0, M.len(M.lorentz(M.QE, v, [0, 0, -M.SEL.B], [0, -M.SEL.E, 0])) / 1e-17, '|q(E + v × B)| from the model’s vectors'); }
{ const P = M.SEL.paths[0], s = P[P.length - 1]; keyed(3, 1, M.len(s.v) / 1e4, 'exit speed of the model’s RK4 path for the 0.8 E/B proton'); }
keyed(4, 0, integ(d => M.len(M.loopTorque(d)), 0, 180, 4000) * Math.PI / 180, '∫|τ| dθ, τ summed from the four sides’ forces');
keyed(4, 1, M.len(M.semicircleForce(2.0, 0.10, 0.50)), 'Σ I ds × B over 2000 pieces of the arc');
{ const r = 0.005, a = M.AMP.a, Ienc = integ(s => M.AMP.I / (Math.PI * a * a) * 2 * Math.PI * s, 0, r); keyed(5, 0, M.MU0 * Ienc / (2 * Math.PI * r) * 1e6, 'Ampère with I_enc = ∫J 2πr dr (numeric)'); }
{ const { a, c, b } = M.FLUX, n = 4000; let F = 0; for (let i = 0; i < n; i++) F += -M.wireB([a + (i + 0.5) * c / n, 0, 0])[2] * b * c / n;
  keyed(5, 1, F * 1e6, 'Σ B·dA over strips, B from the model’s Biot–Savart wire'); }
{ const R = M.RING.R, n = 4000, pts = M.circlePts([0, 0, 0], R, 'x', n); keyed(6, 0, M.polyB(pts, M.RING.I, [R, 0, 0])[0] * 1e6, 'Biot–Savart of a 4000-gon at z = R'); }
{ const R = M.RING.R, n = 4000, arc = Array.from({ length: n + 1 }, (_, i) => [R * Math.cos(Math.PI * (1 - i / n)), R * Math.sin(Math.PI * (1 - i / n)), 0]);
  const pts = [[-50, 0, 0], ...arc, [50, 0, 0]], Bv = M.bsNumeric(pts, M.RING.I, [0, 0, 0], 50, false);
  keyed(6, 1, M.len(Bv) * 1e6, 'Biot–Savart piece by piece over leads + arc (numeric)'); }
{ const { r1, r2, I1, I2 } = { r1: 0.05, r2: 0.25, I1: M.WIRES.I, I2: M.WIRES.I }, n = 4000; let F = [0, 0, 0];
  for (let i = 0; i < n; i++) { const x = r1 + (i + 0.5) * (r2 - r1) / n, B = M.segB([0, -50, 0], [0, 50, 0], I1, [x, 0, 0]); F = M.add(F, M.mul(M.cross([(r2 - r1) / n, 0, 0], B), I2)); }
  keyed(7, 1, M.len(F) * 1e3, 'Σ I dl × B along the rod, B from a 100 m Biot–Savart wire'); }
{ const r = 0.12; keyed(8, 0, Math.abs(M.lineIntegral(M.torB, M.circlePts([0, 0, 0], r, 'y', 1440))) / (2 * Math.PI * r) * 1e6, 'average B round the circle, ∮B·ds of the 36 Biot–Savart turns ÷ 2πr'); }
{ const { n, I, R, L } = M.SOL; keyed(8, 1, integ(x => M.MU0 * n * I * R * R / (2 * (R * R + x * x) ** 1.5), 0, L) * 1e6, 'rings summed along the coil from one end (numeric)'); }

for (const r of rows) console.log(r.filter(Boolean).join('  '));
console.log(`${rows.filter(r => r[0] === 'PASS').length}/${rows.length} pass`);
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
