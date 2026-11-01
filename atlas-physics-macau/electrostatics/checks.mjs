// node electrostatics/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1e-30, Math.abs(b));
const e3 = x => x.toExponential(3);

// constants
check('k = 1/(4π ε₀)', near(M.K, 1 / (4 * Math.PI * M.EPS0), 2e-3), `${e3(1 / (4 * Math.PI * M.EPS0))}`);
// charge comes in whole electrons
check('atoms: net charge = (protons − electrons)·e', near(M.netCharge(M.ATOMS[1]), -M.QE) && near(M.netCharge(M.ATOMS[2]), M.QE) && M.netCharge(M.ATOMS[0]) === 0);

// Coulomb: equal and opposite, inverse square
{ const a = [0, 0, 0], b = [0.2, 0.1, 0];
  const F12 = M.force(M.PAIR.q1, a, M.PAIR.q2, b), F21 = M.force(M.PAIR.q2, b, M.PAIR.q1, a);
  check('Coulomb: F on 2 = −F on 1 (third law)', F12.every((v, i) => near(v, -F21[i], 1e-12)));
  check('Coulomb: |F| = k|q1 q2|/r²', near(M.norm(F12), M.coulomb(M.PAIR.q1, M.PAIR.q2, M.norm(b)), 1e-12));
  check('Coulomb: unlike charges attract', M.sub(a, b).every((v, i) => Math.sign(v) === Math.sign(F12[i]) || v === 0));
  check('Coulomb: double r, quarter F', near(M.coulomb(1, 1, 0.4) / M.coulomb(1, 1, 0.2), 0.25)); }
check('two people 1% charged: about enough to lift the Earth', M.PEOPLE.a > 1 && M.PEOPLE.a < 4, `q ${e3(M.PEOPLE.q)} C, F ${e3(M.PEOPLE.F)} N, a ${M.PEOPLE.a.toFixed(2)} m/s²`);

// equilibrium point
{ const r = M.lineForces(M.LINE.xEq);
  check('equilibrium: net force zero at x_eq', Math.abs(r.net[0]) < 1e-12 * M.norm(r.FA), `x_eq ${M.LINE.xEq.toFixed(3)} m`);
  check('equilibrium: closer to the smaller charge', M.LINE.D - M.LINE.xEq < M.LINE.xEq);
  check('equilibrium: pushed back toward x_eq from either side', M.lineForces(M.LINE.xEq - 0.02).net[0] > 0 && M.lineForces(M.LINE.xEq + 0.02).net[0] < 0);
  const u = M.lineForces(M.LINE.xEqUnlike, -1);
  check('unlike charges: balance point beyond the smaller charge', M.LINE.xEqUnlike > M.LINE.D && Math.abs(u.net[0]) < 1e-12 * M.norm(u.FA), `${M.LINE.xEqUnlike.toFixed(3)} m`); }

// field of a point charge: E = F/q0, radial
{ const p = [0.12, 0.09, 0], E = M.pointE(M.POINT.Q, [0, 0, 0], p), F = M.force(M.POINT.Q, [0, 0, 0], M.POINT.q0, p);
  check('E = F/q0', E.every((v, i) => near(v, F[i] / M.POINT.q0, 1e-12)));
  check('E points away from +Q, toward −Q', near(E[0] / E[1], p[0] / p[1]) && E[0] > 0 && M.pointE(-M.POINT.Q, [0, 0, 0], p)[0] < 0);
  check('|E| = kQ/r²', near(M.norm(E), M.pointMag(M.POINT.Q, 0.15), 1e-12)); }

// dipole: closed forms against the superposition sum
{ const ch = M.dipoleCharges();
  check('dipole axis: 4kqax/(x²−a²)² = E₊ + E₋', [0.18, 0.25, 0.4].every(x => near(M.sumE(ch, [x, 0, 0])[0], M.dipoleAxis(x), 1e-10)));
  check('dipole bisector: 2kqa/(a²+y²)^3/2, pointing −x', [0.08, 0.2, 0.3].every(y => near(-M.sumE(ch, [0, y, 0])[0], M.dipoleBisector(y), 1e-10)));
  check('dipole bisector: y components cancel', [0.08, 0.2].every(y => Math.abs(M.sumE(ch, [0, y, 0])[1]) < 1e-9 * M.dipoleBisector(y)));
  check('dipole far field: axis → 4kqa/x³', near(M.dipoleAxis(100 * M.DIPOLE.a), 4 * M.K * M.DIPOLE.q * M.DIPOLE.a / (100 * M.DIPOLE.a) ** 3, 1e-3));
  check('dipole far field: bisector → 2kqa/y³', near(M.dipoleBisector(100 * M.DIPOLE.a), 2 * M.K * M.DIPOLE.q * M.DIPOLE.a / (100 * M.DIPOLE.a) ** 3, 2e-4));
  check('dipole far field falls as 1/r³ (double r → ⅛)', near(M.dipoleAxis(40) / M.dipoleAxis(20), 1 / 8, 1e-4));
  const lines = M.dipoleLines();
  let worst = 0;
  for (const L of lines) for (let i = 1; i < L.length - 1; i += 7) {
    const d = M.sub(L[i + 1], L[i - 1]), E = M.sumE(ch, L[i]);
    worst = Math.max(worst, 1 - Math.abs(d[0] * E[0] + d[1] * E[1]) / (M.norm(d) * M.norm(E)));
  }
  check('dipole field lines run along E', worst < 1e-3, `max 1 − cos = ${e3(worst)}`);
  check('dipole field lines leave + and end on −', lines.filter(L => M.norm(M.sub(L[L.length - 1], ch[1].at)) < 0.02).length >= 8, `${lines.length} lines`); }

// rod: closed forms against a sum of 4000 slices
{ const S = M.rodSlices(4000);
  check('rod axis: kQ/(a(a+L)) = ∫ kλdx/x²', [0.05, 0.15, 0.3].every(a => near(M.sumE(S, [M.RODE.L / 2 + a, 0, 0])[0], M.rodAxis(a), 1e-5)));
  check('rod bisector: kQ/(a√(L²/4+a²)) = ∫ kλa dx/(x²+a²)^3/2', [0.1, 0.2, 0.35].every(a => near(M.sumE(S, [0, a, 0])[1], M.rodBisector(a), 1e-5)));
  check('rod bisector: x components cancel', Math.abs(M.sumE(S, [0, 0.2, 0])[0]) < 1e-9 * M.rodBisector(0.2));
  check('rod far away → point charge kQ/a²', near(M.rodAxis(400), M.K * M.RODE.Q / 400 ** 2, 2e-3) && near(M.rodBisector(400), M.K * M.RODE.Q / 400 ** 2, 1e-6));
  check('rod very close (bisector) → 2kλ/a', near(M.rodBisector(1e-4), 2 * M.K * M.RODE.lambda / 1e-4, 1e-6));
  const S6 = M.rodSlices(M.RODE.slices);
  check('rod: 6 slices already within 3% at the drawn distances', [M.RODE.b0, M.RODE.b1].every(a => near(M.sumE(S6, [0, a, 0])[1], M.rodBisector(a), 0.03))); }

// ring and disc
{ const B = M.ringBeads(3000);
  check('ring axis: kQz/(z²+R²)^3/2 = ∫ k dq cos φ / r²', [0.05, 0.14, 0.5].every(z => near(M.sumE(B, [z, 0, 0])[0], M.ringAxis(z), 1e-8)));
  check('ring: transverse components cancel', [0.1, 0.3].every(z => Math.hypot(...M.sumE(B, [z, 0, 0]).slice(1)) < 1e-9 * M.ringAxis(z)));
  check('ring: E = 0 at the centre', M.ringAxis(0) === 0 && M.norm(M.sumE(B, [0, 0, 0])) < 1e-6 * M.ringAxis(0.1));
  const h = 1e-7;
  check('ring: strongest at z = R/√2', Math.abs(M.ringAxis(M.RING_ZMAX + h) - M.ringAxis(M.RING_ZMAX - h)) / (2 * h) < 1e-6 * M.ringAxis(M.RING_ZMAX) / M.RING.R, `${(M.RING_ZMAX * 100).toFixed(1)} cm`);
  check('ring far away → kQ/z²', near(M.ringAxis(200), M.K * M.RING.Q / 200 ** 2, 1e-5));
  // disc as a stack of 4000 rings, each dq = σ 2πr dr
  const disc = z => { let s = 0; const n = 4000, dr = M.DISC.R / n; for (let i = 0; i < n; i++) { const r = (i + 0.5) * dr; s += M.ringAxis(z, M.DISC.sigma * 2 * Math.PI * r * dr, r); } return s; };
  check('disc axis: (σ/2ε₀)(1 − z/√(z²+R²)) = ∫ rings', [0.02, 0.1, 0.4].every(z => near(disc(z), M.discAxis(z), 2e-3)));
  check('disc: same as 2πkσz(√(z²+R²) − z)/(z√(z²+R²))', [0.05, 0.2].every(z => near(M.discAxis(z), 2 * Math.PI * M.K * M.DISC.sigma * z * (Math.sqrt(z * z + M.DISC.R ** 2) - z) / (z * Math.sqrt(z * z + M.DISC.R ** 2)), 3e-3)));
  check('disc just above the centre → σ/2ε₀ (not 0)', near(M.discAxis(1e-9), M.DISC.sigma / (2 * M.EPS0), 1e-6));
  check('disc far away → kQ/z²', near(M.discAxis(50), M.K * M.DISC.sigma * Math.PI * M.DISC.R ** 2 / 2500, 2e-3)); }

// induction: the conducting sphere's surface charge
{ const R = M.SPHERE.R, total = (ch, Q) => { let s = 0; const n = 400; for (let i = 0; i < n; i++) { const th = (i + 0.5) / n * Math.PI; s += M.sigma([-Math.cos(th), Math.sin(th), 0], ch, Q) * 2 * Math.PI * R * R * Math.sin(th) * Math.PI / n; } return s; };
  const ch = M.rodCharges(M.ROD.near);
  check('induction: neutral sphere stays neutral (∮σ dA = 0)', Math.abs(total(ch, 0)) < 1e-4 * Math.abs(M.ROD.Q));
  check('induction: near side +, far side − (negative rod)', M.sigma([-1, 0, 0], ch, 0) > 0 && M.sigma([1, 0, 0], ch, 0) < 0);
  check('grounding leaves charge −Σ qR/d: ∮σ dA = Q_g', near(total(ch, M.QG), M.QG, 1e-3), `${(M.QG / M.nC).toFixed(2)} nC`);
  check('grounded sphere is at zero potential', Math.abs(M.K * M.QG / R + ch.reduce((s, c) => s + M.K * c.q / c.d, 0)) < 1e-9 * Math.abs(M.K * M.QG / R));
  check('induction gives the opposite sign to the rod', Math.sign(M.QG) === -Math.sign(M.ROD.Q));
  check('rod gone: the charge spreads evenly', near(M.sigma([1, 0, 0], [], M.QG), M.sigma([-1, 0, 0], [], M.QG)) && near(M.sigma([0, 1, 0], [], M.QG), M.QG / (4 * Math.PI * R * R))); }

// electron between plates: kinematics against a step-by-step integration of F = qE
{ const P = M.PLATES; let x = 0, y = 0, vx = P.v0, vy = 0; const n = 20000, dt = P.tCross / n;
  for (let i = 0; i < n; i++) { const ay = M.QE * P.E / M.ME; vy += ay * dt / 2; x += vx * dt; y += vy * dt; vy += ay * dt / 2; }
  check('electron: y = ½(eE/m)t², vx constant', near(y, P.yExit, 1e-6) && near(x, P.L, 1e-9), `${(P.yExit * 1000).toFixed(2)} mm`);
  check('electron clears the plates', P.yExit < P.gap / 2);
  { const a = M.electron(P.tCross * 1.2), b = M.electron(P.tCross * 1.4); check('past the plates it moves in a straight line at the exit velocity', near((b.y - a.y) / (b.x - a.x), P.vyExit / P.v0, 1e-9) && a.F === 0); }
  check('proton deflects m_e/m_p as much', near(P.yProton / P.yExit, M.ME / M.MP, 1e-12)); }

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
{ let a = 6, b = -2; while (Math.abs(a - b) > 1e-12) { const dq = (a - b) / 4; a -= dq; b += dq; }   // let charge flow until the spheres match
  keyed(0, 0, a, 'touching spheres: charge flows until equal (iterated)'); }
keyed(0, 1, integ(x => 40e-9 * x, 0, 0.5) / M.QE, 'electrons = ∫λ dx / e (numeric)');
keyed(1, 1, integ(t => 2.4e-3 * Math.exp(-t / 1.5e-6), 0, 60 * 1.5e-6, 200000) / M.QE, 'electrons = ∫I dt / e (numeric, to 60τ)');
keyed(2, 0, M.norm(M.force(M.PAIR.q1, [0, 0, 0], M.PAIR.q2, [0.12, 0.16, 0])), 'Coulomb force from the model’s vector form at r = 20 cm');
keyed(2, 1, integ(r => M.norm(M.force(M.PAIR.q1, [0, 0, 0], M.PAIR.like, [r, 0, 0])), 0.2, 0.4), 'work = ∫F dr (numeric)');
{ let a = 0.01, b = M.LINE.D - 0.01; for (let i = 0; i < 100; i++) { const m = (a + b) / 2; if (M.lineForces(m).net[0] > 0) a = m; else b = m; }
  keyed(3, 0, (a + b) / 2 * 100, 'balance point by bisection on the net force'); }
{ const x = M.LINE.xEq, h = 1e-5;   // κ = −dF/dx, numeric
  keyed(3, 1, -(M.lineForces(x + h).net[0] - M.lineForces(x - h).net[0]) / (2 * h), 'κ = −dF/dx (numeric slope of the model’s net force)'); }
keyed(4, 0, M.norm(M.pointE(-M.POINT.Q, [0, 0, 0], [0.2, 0, 0])), '|E| from the vector field of −1 nC');
check('practice 4.1: the field 20 cm east of −Q points west', M.pointE(-M.POINT.Q, [0, 0, 0], [0.2, 0, 0])[0] < 0);
{ const v = 0.05, r0 = 0.2, dt = 1e-4, E = t => M.pointMag(M.POINT.Q, r0 + v * t);
  keyed(4, 1, -(E(dt) - E(-dt)) / (2 * dt), 'dE/dt along the moving charge (numeric)'); }
keyed(5, 0, M.norm(M.sumE(M.dipoleCharges(), [0, 0.1, 0])), 'bisector field as the vector sum of E₊ and E₋');
keyed(6, 0, M.sumE(M.rodSlices(20000), [M.RODE.L / 2 + 0.1, 0, 0])[0], 'axis field as a sum of 20 000 slices');
{ const a = 0.1, L = M.RODE.L, lam = M.RODE.lambda, n = 20000, I = fn => integ(fn, -L / 2, L / 2, n);
  const cands = [I(x => M.K * lam / (x * x + a * a)), I(x => M.K * lam * x / (x * x + a * a) ** 1.5), I(x => M.K * lam / Math.sqrt(x * x + a * a)), I(x => M.K * lam * a / (x * x + a * a) ** 1.5)];
  const sum = M.sumE(M.rodSlices(n), [0, a, 0])[1], it = PRACTICE[6][1];
  check('practice 6.2: only the keyed integral equals the slice-summed bisector field', cands.every((c, k) => (k === it.answer) === (Math.abs(c - sum) <= 1e-4 * sum)), `${sum.toFixed(1)} N/C`); }
keyed(7, 0, M.sumE(M.ringBeads(4000), [0.15, 0, 0])[0], 'ring field as a sum of 4000 beads');
{ let best = 0, zb = 0; for (let i = 1; i <= 6000; i++) { const z = i * 0.6 / 6000, E = M.sumE(M.ringBeads(400), [z, 0, 0])[0]; if (E > best) { best = E; zb = z; } }
  keyed(7, 1, zb * 100, 'peak of the bead-summed axis field (scan)'); }
{ const P = M.PLATES, n = 20000, dt = P.tCross / n; let y = 0, vy = 0, vy2 = 0;
  for (let i = 0; i < n; i++) { const t = (i + 0.5) * dt; vy += M.QE * P.E / M.ME * dt; y += (vy - M.QE * P.E / M.ME * dt / 2) * dt; vy2 += M.QE * P.E * (P.v0 * t / P.L) / M.ME * dt; }
  keyed(8, 0, y * 1000, 'deflection by stepping F = eE');
  keyed(8, 1, vy2 / 1e6, 'v_y by stepping a = eE₀x/(mL) with x = v₀t'); }

for (const r of rows) console.log(r.filter(Boolean).join('  '));
console.log(`${rows.filter(r => r[0] === 'PASS').length}/${rows.length} pass`);
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
