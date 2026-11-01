// node energy/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const h = 1e-6;
const d = (fn, t, key) => (fn(t + h)[key] - fn(t - h)[key]) / (2 * h);

// work
const P = M.PULL;
check('work: W = F Δx cos θ, and cos 90° gives 0', near(M.work(10, 2, 0), 20) && near(M.work(10, 2, 90), 0, 1e-12) && near(M.work(10, 2, 180), -20));
check('pull: components rebuild the rope force', near(Math.hypot(P.Fx, P.Fy), P.F), `${P.Fx.toFixed(2)} N along, ${P.Fy.toFixed(2)} N up`);
check('pull: dx/dt = v and m dv/dt = F cos θ', [0.3, 0.9].every(t => near(d(M.pull, t, 'x'), M.pull(t).v, 1e-6) && near(P.m * d(M.pull, t, 'v'), P.Fx, 1e-6)));
check('pull: work by the rope = ΔK (only force doing work)', [0.4, 1.2].every(t => near(M.pull(t).W, M.pull(t).K)), `${M.pull(P.run).W.toFixed(2)} J`);
check('pull: floor still pushes up (box stays down)', P.FN > 0, `F_N ${P.FN.toFixed(2)} N`);

// toss
check('toss: dy/dt = v, dv/dt = −g', [0.2, 0.9].every(t => near(d(M.toss, t, 'y'), M.toss(t).v, 1e-6) && near(d(M.toss, t, 'v'), -M.G, 1e-6)));
check('toss: W_g = ΔK all the way', [0.1, 0.4, 0.8, 1.1].every(t => near(M.toss(t).Wg, M.toss(t).K - M.toss(0).K, 1e-9)));
check('toss: W_g < 0 rising, back to 0 on landing', M.toss(0.3).Wg < 0 && near(M.toss(M.TOSS.run).Wg, 0, 1e-9), `min ${M.toss(M.TOSS.run / 2).Wg.toFixed(2)} J`);

// whirl
check('whirl: tension ⟂ velocity, so power T·v = 0', [0.1, 0.7, 1.5].every(t => {
  const p = M.whirl(t), q = M.whirl(t + h), r = M.whirl(t - h), vx = (q.x - r.x) / (2 * h), vz = (q.z - r.z) / (2 * h);
  return near(Math.hypot(vx, vz), M.WHIRL.v, 1e-6) && Math.abs(-p.x * vx - p.z * vz) < 1e-6;
}), `T ${M.WHIRL.T.toFixed(2)} N`);

// car
const C = M.CAR;
check('car: W_net = F Δx = ΔK', [0.5, 1.5, 3].every(t => near(M.car(t).Wnet, M.car(t).K)), `${(M.car(C.run).K / 1000).toFixed(2)} kJ`);
check('car: dx/dt = v', [0.7, 2.2].every(t => near(d(M.car, t, 'x'), M.car(t).v, 1e-6)));
check('car: road friction within μs·N (μs 0.7)', C.F < 0.7 * C.W);

// drop
check('drop: U + K constant', [0, 0.2, 0.5, M.DROP.run].every(t => near(M.drop(t).U + M.drop(t).K, M.DROP.E)), `${M.DROP.E.toFixed(2)} J`);
check('drop: lands with U_g,top = K_bottom', near(M.drop(M.DROP.run).y, 0, 1e-12) && near(M.drop(M.DROP.run).K, M.DROP.E));
check('drop: ΔU independent of the zero level', (() => { const y0 = M.DROP.h, y1 = 1.5, m = M.DROP.m, r = M.DROP.ref2; return near(m * M.G * (y1 - y0), m * M.G * ((y1 - r) - (y0 - r))); })());

// spring
const S = M.SPRING;
check('spring: x_max = v0 √(m/k)', near(S.xmax, S.v0 * Math.sqrt(S.m / S.k)), `${S.xmax.toFixed(3)} m`);
check('spring: K + U_s constant', Array.from({ length: 40 }, (_, i) => i * S.run / 39).every(t => near(M.spring(t).K + M.spring(t).U, S.E, 1e-9)), `${S.E.toFixed(2)} J`);
check('spring: F = −kx and m dv/dt = F in contact', [S.tIn + 0.1, S.tIn + 0.4].every(t => near(S.m * d(M.spring, t, 'v'), M.spring(t).F, 1e-5)));
check('spring: ds/dt = v throughout', [0.3, S.tIn + 0.2, S.tIn + S.tC + 0.3].every(t => near(d(M.spring, t, 's'), M.spring(t).v, 1e-5)));
check('spring: U_s = area under kx (numeric)', (() => { let A = 0; const n = 2000; for (let i = 0; i < n; i++) { const x = (i + 0.5) / n * S.xmax; A += S.k * x * S.xmax / n; } return near(A, 0.5 * S.k * S.xmax ** 2, 1e-6); })());
check('spring: leaves at the speed it came in', near(M.spring(S.run).v, -S.v0) && near(M.spring(S.run).s, -S.gap, 1e-9));

// pendulum
const Pd = M.PEND;
const Es = Array.from({ length: 200 }, (_, i) => { const p = M.pendulum(i * Pd.period / 199); return p.K + p.U; });
check('pendulum: K + U_g constant (RK4, 1 ms)', Es.every(E => near(E, Pd.E, 1e-6)), `${Pd.E.toFixed(3)} J`);
check('pendulum: returns to θ0 after the exact period', near(M.pendulum(Pd.period - 1e-9).th, Pd.th0, 1e-6), `T ${Pd.period.toFixed(4)} s`);
check('pendulum: period a little longer than 2π√(L/g)', Pd.period > 2 * Math.PI * Math.sqrt(Pd.L / M.G) && Pd.period < 1.04 * 2 * Math.PI * Math.sqrt(Pd.L / M.G));
check('pendulum: bottom speed √(2gL(1−cos θ0))', near(Math.abs(M.pendulum(Pd.period / 4).v), Math.sqrt(2 * M.G * Pd.L * (1 - Math.cos(Pd.th0))), 1e-5));
check('pendulum: dθ/dt = ω', [0.3, 1.1].every(t => near(d(M.pendulum, t, 'th'), M.pendulum(t).om, 1e-3)));
check('pendulum: power of gravity = m g·v = dK/dt', [0.3, 0.9].every(t => { const p = M.pendulum(t); return near(-p.Ftan * p.v, d(M.pendulum, t, 'K'), 1e-3); }));

// slide
const L = M.SLIDE;
check('slide: K + E_th constant (energy goes to heat)', [0, 0.3, 0.7, L.run].every(t => near(M.slide(t).K + M.slide(t).Eth, L.E)), `${L.E.toFixed(2)} J`);
check('slide: stops after d = v0²/(2μg)', near(M.slide(L.run).v, 0, 1e-12) && near(M.slide(L.run).x, L.d), `${L.d.toFixed(3)} m`);
check('slide: W_f = −f d = ΔK', near(M.slide(L.run).Wf, -L.E));
check('slide: dx/dt = v', [0.2, 0.8].every(t => near(d(M.slide, t, 'x'), M.slide(t).v, 1e-6)));

// power
const Li = M.LIFT;
check('lift: same work either way, mgh', near(M.lift(Li.tFast, Li.vFast).W, Li.work) && near(M.lift(Li.tSlow, Li.vSlow).W, Li.work), `${Li.work.toFixed(0)} J`);
check('lift: P = W/t = Fv', near(Li.Pfast, Li.W * Li.vFast) && near(Li.Pslow, Li.W * Li.vSlow), `${Li.Pfast.toFixed(0)} W vs ${Li.Pslow.toFixed(0)} W`);
check('lift: P = dW/dt', [0.5, 1.5].every(t => near((M.lift(t + h, Li.vFast).W - M.lift(t - h, Li.vFast).W) / (2 * h), Li.Pfast, 1e-6)));
check('lift: twice the speed, half the time, twice the power', near(Li.tSlow / Li.tFast, 2) && near(Li.Pfast / Li.Pslow, 2));

// work by a changing force (Physics C)
const Pu = M.PUSH;
const simpson = (fn, a, b, n = 2000) => { const hh = (b - a) / n; let s = fn(a) + fn(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * fn(a + i * hh); return s * hh / 3; };
check('push: ∫F dx (numeric) = closed form, 5/6 F0 L', [0.7, 1.9, Pu.L].every(x => near(simpson(M.pushF, 0, x), M.pushW(x), 1e-10)) && near(Pu.W, 5 / 6 * Pu.F0 * Pu.L), `${Pu.W.toFixed(2)} J`);
check('push: strip sums close in on the integral', Math.abs(M.pushStrips(6) - Pu.W) > Math.abs(M.pushStrips(64) - Pu.W) && near(M.pushStrips(2000), Pu.W, 1e-6), `6 strips ${M.pushStrips(6).toFixed(2)} J, 64 strips ${M.pushStrips(64).toFixed(3)} J`);
check('push: W = ΔK along the way (RK4)', [0.3, 0.8, Pu.tL - 1e-6, Pu.run].every(t => near(M.push(t).W, M.push(t).K, 1e-7)), `v_f ${Pu.vf.toFixed(3)} m/s`);
check('push: m dv/dt = F(x), dx/dt = v', [0.25, 0.9].every(t => near(Pu.m * d(M.push, t, 'v'), M.push(t).F, 1e-4) && near(d(M.push, t, 'x'), M.push(t).v, 1e-6)));
check('push: reaches x = L with v = √(2W/m), then coasts', near(M.push(Pu.tL).x, Pu.L, 1e-8) && near(Pu.vf, Math.sqrt(2 * Pu.W / Pu.m), 1e-8) && near(M.push(Pu.run).x, Pu.L + Pu.coast, 1e-8));

// force from potential energy (Physics C)
const B = M.BEAD;
check('bead: F = −dU/dx (numeric derivative)', [0.5, 1.3, 2.4, 3.6, 4.5].every(x => near(-(M.beadU(x + h) - M.beadU(x - h)) / (2 * h), M.beadF(x), 1e-6)));
check('bead: wire never steeper than vertical (|h′| < 1)', Array.from({ length: 601 }, (_, i) => Math.abs(M.beadH1(i * B.len / 600))).every(v => v < 1));
check('bead: F = 0 at the valley (U″ > 0) and the hump (U″ < 0)', Math.abs(M.beadF(B.stable)) < 1e-9 && Math.abs(M.beadF(B.unstable)) < 1e-9 && M.beadH2(B.stable) > 0 && M.beadH2(B.unstable) < 0, `x ${B.stable.toFixed(3)} m, ${B.unstable.toFixed(3)} m`);
check('bead: F ≈ 0 on the flat stretch (neutral)', Math.abs(M.beadF(B.neutral)) < 0.01 * B.m * M.G && Math.abs(M.beadH2(B.neutral)) < 0.02);
check('bead: K + U constant (RK4)', Array.from({ length: 50 }, (_, i) => M.bead(i * B.period / 49)).every(r => near(r.K + r.U, B.E, 1e-8)), `${B.E.toFixed(3)} J`);
check('bead: turning points where U = E, v = 0 there', near(M.beadU(B.x1), B.E, 1e-10) && Math.abs(M.bead(B.period / 2).x - B.x1) < 1e-6 && Math.abs(M.bead(B.period / 2).v) < 1e-5, `${B.x0.toFixed(2)} m and ${B.x1.toFixed(3)} m`);
check('bead: m dv/dt = −dU/dx', [0.3, 1.2].every(t => near(B.m * d(M.bead, t, 'v'), M.bead(t).F, 1e-4)));

// energy curves and equilibrium (Physics C)
const N = M.BOND;
check('bond: F = −dU/dr (numeric derivative)', [0.13, 0.15, 0.2, 0.3].every(r => { const R = r * 1e-9, hr = 1e-15; return near(-(M.bondU(R + hr) - M.bondU(R - hr)) / (2 * hr), M.bondF(R), 1e-6); }));
check('bond: minimum −ε at r0, where F = 0', near(M.bondU(N.r0), -N.eps) && Math.abs(M.bondF(N.r0)) < 1e-20);
check('bond: U″(r0) = 72ε/r0² (numeric)', (() => { const hr = 1e-14; return near((M.bondU(N.r0 + hr) - 2 * M.bondU(N.r0) + M.bondU(N.r0 - hr)) / hr ** 2, N.k, 1e-5); })(), `${N.k.toFixed(0)} N/m`);
check('bond: turning points (closed form) where U = E', near(M.bondU(N.r1), N.E, 1e-9) && near(M.bondU(N.r2), N.E, 1e-9) && near(M.bondU(M.bondTurns(N.E)[0]), N.E, 1e-9), `${(N.r1 * 1e9).toFixed(4)} and ${(N.r2 * 1e9).toFixed(4)} nm`);
check('bond: K + U constant, and v = 0 at both turns', Array.from({ length: 50 }, (_, i) => M.bond(i * N.period / 49)).every(r => near(r.K + r.U, N.E, 1e-7)) && near(M.bond(N.period / 2).r, N.r2, 1e-6));
check('bond: small oscillations: T → 2π/ω, ω² = U″(r0)/m', near(M.bondPeriod(-0.999 * N.eps), 2 * Math.PI / N.w, 2e-3), `${(2 * Math.PI / N.w * 1e15).toFixed(2)} fs`);
check('bond: this bigger swing is slower (not harmonic)', N.period > 1.2 * 2 * Math.PI / N.w, `${(N.period * 1e15).toFixed(2)} fs`);

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
  const g = M.G;
  // 0: the rope's work over 3.0 m = K gained (kinematics of the pull)
  keyed(0, 0, M.pull(Math.sqrt(2 * 3.0 / M.PULL.a)).K, 'rope’s work = K after 3.0 m (work–energy)');
  // 1: gravity's work to the top = −mg·h, h from the model's motion at the top
  keyed(1, 0, -M.TOSS.m * g * M.toss(M.TOSS.run / 2).y, 'W_g to the top = −mg·y_top');
  // 2: tension's work over half a lap, summed step by step: Σ T·Δs
  { const n = 20000, tH = Math.PI * M.WHIRL.r / M.WHIRL.v; let W = 0;
    for (let i = 0; i < n; i++) { const a = M.whirl(i * tH / n), b = M.whirl((i + 1) * tH / n), mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, r = Math.hypot(mx, mz);
      W += M.WHIRL.T * (-mx / r * (b.x - a.x) - mz / r * (b.z - a.z)); }
    keyed(2, 0, W, 'tension’s work over half a lap, Σ T·Δs'); }
  // 3: speed after 12 m from the model's motion (x = ½at², v = at)
  { const t = Math.sqrt(2 * 12 / M.CAR.a); keyed(3, 0, M.car(t).v, 'car speed after 12 m (kinematics)'); }
  // 4: U_g with the tabletop zero = U(ground zero) − mg·ref; speed at 1.0 m from the model's fall
  keyed(4, 0, M.drop(0).U - M.DROP.m * g * M.DROP.ref2, 'U_g above the tabletop zero');
  keyed(4, 1, Math.abs(M.drop(root(t => M.drop(t).y - 1.0, 0, M.DROP.run)).v), 'speed 1.0 m above the ground (model fall)');
  // 5: compression at 1.0 m/s from the model's contact motion
  { const S = M.SPRING, u = Math.acos(1.0 / S.v0) / S.w; keyed(5, 0, M.spring(S.tIn + u).x, 'compression at 1.0 m/s (model, in contact)'); }
  // 6: speed at x = L from the RK4 motion; work over the first half by Simpson
  keyed(6, 0, M.PUSH.vf, 'speed at x = L (RK4 of m dv/dt = F(x))');
  states(6, 1, `${simpson(M.pushF, 0, M.PUSH.L / 2).toFixed(1)} J`, 'work over the first half (Simpson)');
  // 7: speed at 20° and tension at the bottom, from the RK4 pendulum
  { const Pd = M.PEND, t20 = root(t => M.pendulum(t).th - 20 * Math.PI / 180, 0, Pd.period / 4);
    keyed(7, 0, Math.abs(M.pendulum(t20).v), 'speed at 20° (RK4 pendulum)');
    keyed(7, 1, M.pendulum(Pd.period / 4).T, 'tension at the bottom (RK4 pendulum)'); }
  // 8: force = −dU/dx by a numeric derivative
  { const U = x => 3 * x * x - 2 * x ** 3; keyed(8, 0, -(U(2 + h) - U(2 - h)) / (2 * h), 'F = −dU/dx at 2.0 m (numeric)'); }
  // 9: k = U″(r0) by a numeric second derivative, and the period from it
  { const N = M.BOND, hr = 1e-14, k = (M.bondU(N.r0 + hr) - 2 * M.bondU(N.r0) + M.bondU(N.r0 - hr)) / hr ** 2;
    states(9, 0, `${k.toFixed(0)} N/m`, 'bond k = U″(r0) (numeric)');
    states(9, 0, `${(2 * Math.PI * Math.sqrt(N.m / k) * 1e15).toFixed(1)} fs`, 'small-vibration period from the numeric k'); }
  // 10: distance from 8.0 m/s by work–energy with the model's friction; heat after 1.0 m from the model's slide
  keyed(10, 0, 0.5 * M.SLIDE.m * 8 ** 2 / M.SLIDE.f, 'distance from 8.0 m/s, ½mv² = f d');
  keyed(10, 1, M.slide(root(t => M.slide(t).x - 1.0, 0, M.SLIDE.run)).Eth, 'heat after 1.0 m (model slide)');
  // 11: P = F v, F = mg at steady speed
  keyed(11, 0, 70 * g * (3.0 / 4.2), 'stair power, P = Fv');
}

for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
