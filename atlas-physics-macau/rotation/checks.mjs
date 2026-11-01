// node rotation/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const h = 1e-6;
const d = (fn, t) => (fn(t + h) - fn(t - h)) / (2 * h);
const deg = r => r * 180 / Math.PI;

// constant-α kinematics, speeding up then braking
const ts = [0.3, 1.7, 2.9, 4.1];
check('wheel: dθ/dt = ω', ts.every(t => near(d(t => M.wheel(t).th, t), M.wheel(t).w, 1e-6)));
check('wheel: dω/dt = α', ts.every(t => near(d(t => M.wheel(t).w, t), M.wheel(t).a, 1e-6)));
check('wheel: ω² = ω0² + 2αΔθ while speeding up', [0.5, 2.0].every(t => near(M.wheel(t).w ** 2, 2 * M.WHEEL.alpha * M.wheel(t).th)));
check('wheel: braking, ω and α have opposite signs', M.wheel(3).w > 0 && M.wheel(3).a < 0);
check('wheel: θ continuous where braking starts', near(M.wheel(M.WHEEL.tUp - 1e-9).th, M.wheel(M.WHEEL.tUp + 1e-9).th, 1e-6));
check('wheel: comes back to rest', near(M.wheel(M.WHEEL.run).w, 0) && near(M.wheel(M.WHEEL.run).th, M.WHEEL.thTot), `${M.WHEEL.thTot.toFixed(2)} rad = ${(M.WHEEL.thTot / 2 / Math.PI).toFixed(2)} turns`);

// v = rω, a_t = rα, a_c = rω², and the edge point compared with the inner one
const sd = M.disc(1.6);
const p1 = M.pointAt(M.DISC.r1, sd), p2 = M.pointAt(M.DISC.r2, sd);
check('disc: v = rω, twice the radius → twice the speed', near(p2.v, 2 * p1.v) && near(p2.v, M.DISC.r2 * sd.w));
check('disc: arc length s = rθ is the path walked (ds/dt = v)', near(d(t => M.DISC.r2 * M.disc(t).th, 1.6), p2.v, 1e-6));
check('disc: a_total = r √(ω⁴ + α²)', near(p2.a, M.DISC.r2 * Math.sqrt(sd.w ** 4 + sd.a ** 2)));

// torque
check('door: τ = rF sin φ = F × lever arm', M.DOOR.cases.every(c => near(c.tau, M.DOOR.F * c.arm)));
check('door: half the distance, half the torque', near(M.DOOR.cases[1].tau, M.DOOR.cases[0].tau / 2));
check('door: sin 30° = ½, so the angled push equals the halfway push', near(M.DOOR.cases[2].tau, M.DOOR.cases[1].tau), `${M.DOOR.cases[2].tau.toFixed(2)} N·m`);
check('door: a push along the door makes no torque', near(M.torque(0.85, 10, 0), 0) && near(M.torque(0.85, 10, 180), 0, 1e-12));
check('door: α = τ / I and it swings open with θ = ½αt²', M.DOOR.cases.every(c => near(M.door(c, c.tOpen).th, Math.PI / 2) && near(d(t => M.door(c, t).th, c.tOpen * 0.5), M.door(c, c.tOpen * 0.5).w, 1e-6)));

// static equilibrium: both conditions, about A and about any other point
const pl = [0.4, 1.3, 2.0, 3.6].map(M.plank);
check('plank: ΣF = 0', pl.every(p => near(p.FA + p.FB, M.PLANK.Wp + M.PLANK.Wc)));
check('plank: Στ = 0 about A', pl.every(p => near(M.PLANK.L * p.FB - M.PLANK.L / 2 * M.PLANK.Wp - p.x * M.PLANK.Wc, 0, 1e-9)));
check('plank: Στ = 0 about B too (any pivot works)', pl.every(p => near(-M.PLANK.L * p.FA + M.PLANK.L / 2 * M.PLANK.Wp + (M.PLANK.L - p.x) * M.PLANK.Wc, 0, 1e-9)));
check('plank: crate in the middle → supports share equally', near(M.plank(2).FA, M.plank(2).FB));

// ladder
const lad = [55, 65, 78].map(a => M.ladder(a * Math.PI / 180));
check('ladder: ΣFx = 0, ΣFy = 0', lad.every(l => near(l.Fw, l.f) && near(l.FN, M.LADDER.W)));
check('ladder: Στ about the foot = 0', lad.every(l => near(M.LADDER.L * Math.sin(l.th) * l.Fw - M.LADDER.L / 2 * Math.cos(l.th) * M.LADDER.W, 0, 1e-9)));
check('ladder: at θmin friction needed = μs F_N', near(M.ladder(M.LADDER.thMin).f, M.LADDER.muS * M.LADDER.W), `θmin = ${deg(M.LADDER.thMin).toFixed(1)}°`);
check('ladder: θmin = atan(1/(2μs)), the sweep stays above it', near(Math.tan(M.LADDER.thMin), 1 / (2 * M.LADDER.muS)) && [0, 3, 6, 9].every(t => M.ladderAngle(t) > M.LADDER.thMin));
check('ladder: lower angle needs more friction', M.ladder(0.95).f > M.ladder(1.3).f);

// moment of inertia
const [ring, discS, sphere] = M.SHAPES.list;
check('I = fMR²: ring > disc > sphere, so α ring < disc < sphere', ring.I > discS.I && discS.I > sphere.I && ring.alpha < discS.alpha && discS.alpha < sphere.alpha);
const rings = M.discAsRings(4);
check('disc as rings: Σm = M and Σ I = ½MR²', near(rings.reduce((s, r) => s + r.m, 0), M.SHAPES.M) && near(rings.reduce((s, r) => s + r.I, 0), 0.5 * M.SHAPES.M * M.SHAPES.R ** 2));
check('disc as rings: Σ m r² of thin rings → ½MR² as they get thinner', (() => { const n = 400, s = M.discAsRings(n).reduce((a, r) => a + r.m * ((r.r0 + r.r1) / 2) ** 2, 0); return near(s, 0.5 * M.SHAPES.M * M.SHAPES.R ** 2, 1e-4); })());
check('shapes: dω/dt = τ / I', M.SHAPES.list.every(s => near(d(t => M.shapeSpin(s, t).w, 1), M.SHAPES.tau / s.I, 1e-6)));
check('work–energy: τΔθ = ½Iω²', M.SHAPES.list.every(s => { const q = M.shapeSpin(s, 2); return near(M.SHAPES.tau * q.th, 0.5 * s.I * q.w ** 2); }));

// rolling race
check('race: energy conserved at the bottom, mgh = K + K_r', M.RACE.list.every(o => { const e = M.energy(o, o.vEnd); return near(e.Kt + e.Kr, M.RACE.m * M.G * M.RACE.h, 1e-9); }));
check('race: box, then sphere, then disc, then ring', M.RACE.list.every((o, i, a) => !i || a[i - 1].T < o.T), M.RACE.list.map(o => `${o.key} ${o.T.toFixed(2)} s`).join(', '));
check('race: rolling without slipping, ds/dt = v and v = Rω', M.RACE.list.slice(1).every(o => near(d(t => M.race(o, t).s, 0.8), M.race(o, 0.8).v, 1e-6) && near(M.race(o, 0.8).v, M.RACE.R * M.race(o, 0.8).w)));
check('race: speed at the bottom does not depend on R or m', near(M.RACE.list[2].vEnd, Math.sqrt(2 * M.G * M.RACE.h / 1.5)));

// well: Newton's second law for the bucket and for the drum
check('well: bucket mg − T = ma', near(M.WELL.m * M.G - M.WELL.T, M.WELL.m * M.WELL.a));
check('well: drum rT = Iα with I = ½MR²', near(M.WELL.R * M.WELL.T, 0.5 * M.WELL.M * M.WELL.R ** 2 * M.WELL.alpha));
check('well: rope does not slip, a = Rα', near(d(t => M.well(t).v, 0.5), M.WELL.R * M.WELL.alpha, 1e-6) && near(d(t => M.well(t).th, 0.5), M.well(0.5).w, 1e-6));
check('well: energy, mgy = ½mv² + ½Iω²', [0.4, 1.0].every(t => { const q = M.well(t); return near(M.WELL.m * M.G * q.y, 0.5 * M.WELL.m * q.v ** 2 + 0.25 * M.WELL.M * M.WELL.R ** 2 * q.w ** 2); }));

// skater
const sk = [0.5, 2.0, 3.0, 4.5, 6.0, 7.3].map(M.skater);
check('skater: L = Iω constant', sk.every(q => near(q.L, M.SKATE.L)), `${M.SKATE.L.toFixed(3)} kg·m²/s`);
check('skater: dθ/dt = ω (integrated table)', [0.5, 2.0, 3.0, 4.5, 6.6].every(t => near((M.skater(t + 0.01).th - M.skater(t - 0.01).th) / 0.02, M.skater(t).w, 2e-3)));
check('skater: arms in → I down, ω up, KE up', M.skater(3.5).I < M.skater(0.5).I && M.skater(3.5).w > M.skater(0.5).w && M.skater(3.5).K > M.skater(0.5).K,
  `ω ${M.skater(0.5).w.toFixed(2)} → ${M.skater(3.5).w.toFixed(2)} rad/s`);
check('skater: KE ratio = I ratio (K = L²/2I)', near(M.skater(3.5).K / M.skater(0.5).K, M.skater(0.5).I / M.skater(3.5).I));

// ---------- additions ----------
// I = ∫ r² dm, closed forms against a fine Riemann sum (Simpson's rule for the disc)
check('rod: ∫λx² dx about the centre = ML²/12', near(M.rodSum(4000, 0), M.ROD.Icm, 1e-6) && near(M.rodI(0), M.ROD.Icm));
check('rod: ∫λx² dx about the end = ML²/3', near(M.rodSum(4000, -M.ROD.L / 2), M.ROD.Iend, 1e-6) && near(M.rodI(-M.ROD.L / 2), M.ROD.Iend));
check('rod: 10 slices already close, error shrinks as 1/n²', (() => { const e10 = Math.abs(M.rodSum(10, 0) - M.ROD.Icm), e20 = Math.abs(M.rodSum(20, 0) - M.ROD.Icm); return e10 / M.ROD.Icm < 0.01 && near(e10 / e20, 4, 1e-6); })(), `10 slices: ${M.rodSum(10, 0).toFixed(4)} vs ${M.ROD.Icm.toFixed(4)}`);
check('disc: ∫ r²·σ2πr dr = ½MR² (Simpson)', (() => { const R = M.SHAPES.R, sig = M.SHAPES.M / (Math.PI * R * R), n = 200, h = R / n; let s = 0; for (let k = 0; k <= n; k++) { const r = k * h, w = k === 0 || k === n ? 1 : k % 2 ? 4 : 2; s += w * r * r * sig * 2 * Math.PI * r; } return near(s * h / 3, 0.5 * M.SHAPES.M * R * R, 1e-9); })());
// parallel axes
check('parallel axis: I(d) = I_cm + Md² for axes along the rod', [0.1, 0.3, 0.6, 0.9].every(a => near(M.rodI(a), M.ROD.Icm + M.ROD.M * a * a, 1e-9) && near(M.rodSum(4000, a), M.ROD.Icm + M.ROD.M * a * a, 1e-6)));
check('parallel axis: disc about its rim, ½MR² + MR² = 3/2 MR² (numeric)', (() => { const R = M.SHAPES.R, n = 400; let s = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = -R + 2 * R * (i + 0.5) / n, y = -R + 2 * R * (j + 0.5) / n; if (x * x + y * y < R * R) s += ((x - R) ** 2 + y * y); } s *= M.SHAPES.M / (Math.PI * R * R) * (2 * R / n) ** 2; return near(s, 1.5 * M.SHAPES.M * R * R, 2e-3); })());
check('parallel axis: end rod = 4 × centre rod, so α is ¼', near(M.PAX.list[1].I, 4 * M.PAX.list[0].I) && near(M.PAX.list[0].alpha, 4 * M.PAX.list[1].alpha));
check('parallel axis: dω/dt = τ/I for both rods', M.PAX.list.every(p => near(d(t => M.paxSpin(p, t).w, 1), M.PAX.tau / p.I, 1e-6)));
// work and power
check('wrench: W = F·s = F·rΔθ = τΔθ', [0.3, 0.9, 1.3].every(t => { const q = M.wrench(t); return near(M.WRENCH.F * q.s, q.W) && near(q.W, M.WRENCH.tau * q.th); }), `${M.wrench(2).W.toFixed(1)} J per stroke`);
check('wrench: P = dW/dt = τω', near(d(t => M.wrench(t).W, 0.7), M.WRENCH.tau * M.WRENCH.w, 1e-6) && near(M.WRENCH.P, M.WRENCH.tau * M.WRENCH.w));
check('wrench: a stroke of 120° matches the hex nut (60° symmetry)', near(M.WRENCH.stroke % (Math.PI / 3), 0, 1e-12) || near(M.WRENCH.stroke % (Math.PI / 3), Math.PI / 3, 1e-12));
// rolling with slipping: closed form against the ODE, L about the contact line, energy to friction
{ const B = M.BOWL; let v = B.v0, w = 0, x = 0, th = 0, t = 0, slipW = 0; const h2 = 1e-5;
  while (t < 1.0) { const slip = v - B.R * w > 1e-9; const a = slip ? -B.a : 0, al = slip ? B.alpha : 0; if (slip) slipW += B.f * (v - B.R * w) * h2; x += v * h2 + 0.5 * a * h2 * h2; th += w * h2 + 0.5 * al * h2 * h2; v += a * h2; w += al * h2; t += h2; }
  const q = M.bowl(1.0);
  check('bowling ball: closed form matches the ODE (v, ω, x)', near(q.v, v, 1e-3) && near(q.w, w, 1e-3) && near(q.x, x, 1e-3), `t* = ${B.tStar.toFixed(3)} s`);
  check('bowling ball: friction loss = μk mg × sliding distance = ΔK', near(B.m * B.v0 ** 2 / 2 - q.K, slipW, 1e-3), `${slipW.toFixed(2)} J`); }
check('bowling ball: v = Rω at t*, then v = 5v0/7', near(M.bowl(M.BOWL.tStar).v, M.BOWL.R * M.bowl(M.BOWL.tStar).w) && near(M.BOWL.vf, 5 * M.BOWL.v0 / 7));
check('bowling ball: L about the contact line, mvR + Iω, stays the same', [0, 0.2, 0.4, 0.8].every(t => { const q = M.bowl(t); return near(M.BOWL.m * q.v * M.BOWL.R + M.BOWL.I * q.w, M.BOWL.m * M.BOWL.v0 * M.BOWL.R); }));
check('bowling ball: t* does not depend on R', (() => { const R2 = 0.3, al2 = M.BOWL.f * R2 / (0.4 * M.BOWL.m * R2 * R2); return near((M.BOWL.v0) / (M.BOWL.a + R2 * al2), M.BOWL.tStar); })());
check('bowling ball: dx/dt = v, dθ/dt = ω', [0.2, 0.9].every(t => near(d(t => M.bowl(t).x, t), M.bowl(t).v, 1e-6) && near(d(t => M.bowl(t).th, t), M.bowl(t).w, 1e-6)));
// angular impulse
check('impulse: τΔt = ΔL for both pushes, same area → same ω', M.IMP.list.every(p => near(p.tau * p.dt, M.imp(p, 3).L)) && near(M.IMP.list[0].wf, M.IMP.list[1].wf), `ΔL = ${M.IMP.list[0].J} kg·m²/s`);
check('impulse: dL/dt = τ (numeric)', M.IMP.list.every(p => near(d(t => M.imp(p, t).L, p.dt / 2), p.tau, 1e-6) && near(d(t => M.imp(p, t).L, p.dt + 0.5), 0, 1e-6)));
check('impulse: dθ/dt = ω', M.IMP.list.every(p => [0.3, 1.0, 2.0].every(t => near(d(t => M.imp(p, t).th, t), M.imp(p, t).w, 1e-6))));
// L of a particle and the ball hitting the rod
check('particle: L = (r × p)_y equals m v r⊥ before the hit', [0.1, 0.5, 0.95].map(k => k * M.HIT.tHit).every(t => { const q = M.hit(t); return near(-q.x * M.HIT.m * q.vz, M.HIT.m * M.HIT.v0 * M.HIT.d); }));
check('particle: L = m v r sin φ, the same from every point on the line', [0.05, 0.5, 0.9].map(k => k * M.HIT.tHit).every(t => { const q = M.hit(t), sinp = M.HIT.d / q.r; return near(M.HIT.m * M.HIT.v0 * q.r * sinp, q.Lb); }));
check('ball on rod: L about O conserved, d(p0 + pf) = L_rod', [0.2, 1.0, 2.0].every(t => near(M.hit(t).L, M.HIT.m * M.HIT.v0 * M.HIT.d)) && near(M.HIT.d * (M.HIT.m * M.HIT.v0 + M.HIT.m * -M.HIT.v1), M.HIT.I * M.HIT.w));
check('ball on rod: elastic, K conserved; the ball bounces back', near(0.5 * M.HIT.m * M.HIT.v0 ** 2, 0.5 * M.HIT.m * M.HIT.v1 ** 2 + 0.5 * M.HIT.I * M.HIT.w ** 2) && M.HIT.v1 < 0, `v1 = ${M.HIT.v1.toFixed(3)} m/s, ω = ${M.HIT.w.toFixed(3)} rad/s`);
check('ball on rod: the rod swings clear of the ball', [0.3, 0.8, 1.2, 1.6].every(r => { const q = M.hit(M.HIT.tHit + r), c = Math.cos(q.th), s = -Math.sin(q.th); const along = q.x * c + q.z * s, off = Math.abs(-q.x * s + q.z * c); return along < 0 || along > M.HIT.L || off > M.HIT.rb; }));

// ---------- practice (practice.js) ----------
const { PRACTICE } = await import('./practice.js');
const NPAGES = 15;   // pages.js imports world.js (three.js, browser-only), so the page count is hardcoded
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
// the first number in a choice's text (HTML stripped, − read as minus)
const pnum = c => { const s = c.replace(/<[^>]+>/g, ' ').replace(/−/g, '-'); return Number(s.match(/-?\d+(\.\d+)?/)[0]); };
// keyed choice equals the independent value (to its printed precision), every distractor is > 2 % away
const keyed = (p, n, want, name) => {
  const it = PRACTICE[p][n], v = it.choices.map(pnum), k = v[it.answer], scale = Math.abs(want) || 1;
  const ok = Math.abs(k - want) <= 0.005 * scale && v.every((x, i) => i === it.answer || Math.abs(x - want) > 0.02 * scale);
  check(`practice ${p}.${n + 1}: ${name}`, ok, `keyed ${k}, recomputed ${+want.toPrecision(5)}`);
};
const integ = (fn, a, b, n = 20000) => { let s = 0; const dx = (b - a) / n; for (let i = 0; i < n; i++) s += fn(a + (i + 0.5) * dx) * dx; return s; };
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
{ // 0.1 step ω from rest at α for tUp, add up θ, count turns
  const dt = 1e-5; let w = 0, th = 0; for (let t = 0; t < M.WHEEL.tUp - dt / 2; t += dt) { th += (w + 0.5 * M.WHEEL.alpha * dt) * dt; w += M.WHEEL.alpha * dt; }
  keyed(0, 0, th / (2 * Math.PI), 'stepped turns while speeding up'); }
{ // 1.2 second derivative of the rider's position vector at t = 1.6 s
  const r = M.DISC.r2, pos = t => { const th = M.disc(t).th; return [r * Math.cos(th), r * Math.sin(th)]; }, e = 1e-4;
  const a = [0, 1].map(k => (pos(1.6 + e)[k] - 2 * pos(1.6)[k] + pos(1.6 - e)[k]) / (e * e));
  keyed(1, 1, Math.hypot(...a), '|d²r/dt²| of the edge rider at 1.6 s'); }
keyed(2, 0, cross([0.85, 0], [M.DOOR.F * Math.cos(Math.PI / 6), M.DOOR.F * Math.sin(Math.PI / 6)]), 'τ = (r × F)_z with vectors');
keyed(2, 1, M.DOOR.cases[0].tau / integ(x => M.DOOR.M / M.DOOR.W * x * x, 0, M.DOOR.W), 'α with I = ∫x² dm of the door');
{ // 3.1 torques about B, then ΣF
  const FA = (M.PLANK.L / 2 * M.PLANK.Wp + (M.PLANK.L - 1.0) * M.PLANK.Wc) / M.PLANK.L;
  keyed(3, 0, M.PLANK.Wp + M.PLANK.Wc - FA, 'F_B from torques about B, then ΣF = 0'); }
{ // 4.1 torques about the top of the ladder (a different pivot), with 2D cross products
  const th = Math.PI / 3, L = M.LADDER.L, W = M.LADDER.W, top = [L * Math.cos(th), L * Math.sin(th)], mid = [top[0] / 2, top[1] / 2];
  const rel = p => [p[0] - top[0], p[1] - top[1]];
  // Στ_top = foot × (f, FN) + mid × (0, −W) = 0, linear in f: solve
  const tau = fr => cross(rel([0, 0]), [fr, W]) + cross(rel(mid), [0, -W]);
  keyed(4, 0, -tau(0) / (tau(1) - tau(0)), 'friction from torques about the top of the ladder'); }
{ // 5.2 I of the disc from 400 thin rings, then ω = (τ/I)t
  const I = M.discAsRings(400).reduce((s, r) => s + r.I, 0);
  keyed(5, 1, M.SHAPES.tau / I * 2.0, 'ω from I summed over rings'); }
{ // 6.1 numeric: C from ∫λ dx = M, then ∫x²λ dx
  const C = M.ROD.M / integ(x => x, 0, M.ROD.L);
  keyed(6, 0, integ(x => x * x * C * x, 0, M.ROD.L), 'numeric ∫x²·Cx dx with C from the mass'); }
{ const R = M.SHAPES.R, sig = M.SHAPES.M / (Math.PI * (R * R - R * R / 4));
  const I = integ(r => r * r * sig * 2 * Math.PI * r, R / 2, R);
  check('practice 6.2: annulus ∫r²σ2πr dr = ⅝MR²', near(I, 5 / 8 * M.SHAPES.M * R * R, 1e-7), `${I.toFixed(4)} kg·m²`); }
keyed(7, 0, M.rodSum(4000, M.ROD.L / 2 - 0.30), 'Σ r²Δm with the axis 0.30 m from the end');
{ // 7.2 step θ'' = τ(θ)/I from horizontal to the bottom, I from the rod's sum
  const I = M.rodSum(4000, -M.ROD.L / 2), dt = 1e-5; let th = 0, w = 0;
  while (th < Math.PI / 2) { const a = M.ROD.M * M.G * M.ROD.L / 2 * Math.cos(th) / I; w += a * dt; th += w * dt; }
  check('practice 7.2: stepped swing to the bottom, ω = √(3g/L)', near(w, Math.sqrt(3 * M.G / M.ROD.L), 1e-3), `ω = ${w.toFixed(3)} rad/s`); }
{ // 8.1 F times the arc the hand walks, summed as chords
  const n = 10000; let s = 0; for (let k = 0; k < n; k++) { const a0 = M.WRENCH.stroke * k / n, a1 = M.WRENCH.stroke * (k + 1) / n; s += 2 * M.WRENCH.r * Math.sin((a1 - a0) / 2); }
  keyed(8, 0, M.WRENCH.F * s, 'W = F × arc length (summed chords)'); }
{ // 9.1 forces: mg sin θ − f = ma, fR = ½mR²(a/R) → a; then v² = 2a·len
  const a = M.G * Math.sin(M.RACE.theta) / 1.5;
  keyed(9, 0, Math.sqrt(2 * a * M.RACE.len), 'v from Newton’s laws for the disc, v² = 2as'); }
{ // 10.x step the skidding ball until v = Rω
  const B = M.BOWL, dt = 1e-6; let v = B.v0, w = 0, x = 0;
  while (v - B.R * w > 0) { x += v * dt; v -= B.muK * M.G * dt; w += B.muK * B.m * M.G * B.R / B.I * dt; }
  keyed(10, 0, v, 'stepped ODE: speed when slipping stops');
  check('practice 10.2: stepped skid distance = 12v0²/49μk g', near(x, 12 * B.v0 ** 2 / (49 * B.muK * M.G), 1e-4), `${x.toFixed(4)} m`); }
{ // 11.1 energy: mgh = ½mv² + ½(½MR²)(v/R)²
  const W = M.WELL; keyed(11, 0, Math.sqrt(W.m * M.G * W.h / (0.5 * W.m + 0.25 * W.M)), 'energy with the drum’s spin'); }
{ // 12.1 step dω/dt = τ/I through the push
  const dt = 1e-5; let w = 0; for (let t = 0; t < 0.9 - dt / 2; t += dt) w += 100 * M.IMP.R / M.IMP.I * dt;
  keyed(12, 0, w, 'stepped dω/dt = τ/I'); }
keyed(12, 1, integ(t => t < 0.6 ? 200 * t / 0.6 : 200 * (1.2 - t) / 0.6, 0, 1.2), 'numeric area under the triangle');
keyed(13, 0, M.skater(3.5).w, 'model skater with arms up');
{ // 14.1 L about O as (r × p) of the ball, before; after, rod and ball turn together
  const L0 = -cross([M.HIT.d, 0], [0, -M.HIT.m * M.HIT.v0]);   // any point on the line gives the same
  const L0b = -cross([M.HIT.d, 0.7], [0, -M.HIT.m * M.HIT.v0]);
  check('practice 14.1: r × p the same from two points on the line', near(L0, L0b));
  keyed(14, 0, L0 / (M.rodI(-M.HIT.L / 2) * M.HIT.M / M.ROD.M * (M.HIT.L / M.ROD.L) ** 2 + M.HIT.m * M.HIT.d ** 2), 'ω from L about O, rod I from the rod sum, scaled'); }
{ // 14.2 numeric dL/dt for the dropped ball, L = x p_y − y p_x
  const m = M.HIT.m, d = M.HIT.d, Lf = t => cross([d, -0.5 * M.G * t * t], [0, -m * M.G * t]);
  keyed(14, 1, Math.abs((Lf(0.8 + 1e-5) - Lf(0.8 - 1e-5)) / 2e-5), 'numeric dL/dt of the dropped ball'); }

for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
