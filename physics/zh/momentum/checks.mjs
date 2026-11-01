// node momentum/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const h = 1e-6;
const integrate = (f, a, b, n = 20000) => { let s = 0; const d = (b - a) / n; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * d) * d; return s; };

// momentum
check('same momentum: 0.5 kg at 4 m/s and 2 kg at 1 m/s', near(M.p(M.BALL.m, M.BALL.v), M.p(M.CART.m, M.CART.v)), `${M.p(M.BALL.m, M.BALL.v)} kg·m/s`);
check('same p, the lighter one carries more KE: K = p²/2m', near(M.keFromP(2, M.BALL.m), M.ke(M.BALL.m, M.BALL.v)) && M.ke(M.BALL.m, M.BALL.v) > M.ke(M.CART.m, M.CART.v));

// impulse on the wall
const W = M.WALL, w0 = W.lead;
check('wall: area under F–t = J = Δp', near(integrate(t => -M.wall(t).F, w0, w0 + W.tau), -(M.wall(W.run).p - M.wall(0).p), 1e-6), `${W.J.toFixed(2)} N·s`);
check('wall: m dv/dt = F during contact', [0.02, 0.05, 0.08].every(s => near(W.m * (M.wall(w0 + s + h).v - M.wall(w0 + s - h).v) / (2 * h), M.wall(w0 + s).F, 1e-5)));
check('wall: dx/dt = v', [0.1, w0 + 0.03, w0 + 0.07, W.run - 0.05].every(t => near((M.wall(t + h).x - M.wall(t - h).x) / (2 * h), M.wall(t).v, 1e-5)));
check('wall: bounces back at the same speed (elastic)', near(M.wall(W.run).v, -W.v));
check('wall: average force = J/τ', near(W.Favg * W.tau, W.J), `${W.Favg.toFixed(1)} N`);

// eggs
const E = M.EGG;
for (const [name, tau] of [['pillow', E.tauSoft], ['floor', E.tauHard]]) {
  check(`egg on the ${name}: net impulse while stopping = m·v0`, near(integrate(t => M.egg(t, tau).Fnet, E.tf, E.tf + tau), E.m * E.v0, 1e-6));
  check(`egg on the ${name}: m dv/dt = net force`, [E.tf / 2, E.tf + tau * 0.3, E.tf + tau * 0.7].every(t => near(E.m * (M.egg(t + h, tau).v - M.egg(t - h, tau).v) / (2 * h), M.egg(t, tau).Fnet, 1e-5)));
  check(`egg on the ${name}: dy/dt = v and ends at rest`, [E.tf / 2, E.tf + tau * 0.5].every(t => near((M.egg(t + h, tau).y - M.egg(t - h, tau).y) / (2 * h), M.egg(t, tau).v, 1e-5)) && M.egg(E.tf + tau + 0.01, tau).v === 0);
}
check('egg arrives at v0 = √(2gh)', near(-M.egg(E.tf, E.tauSoft).v, Math.sqrt(2 * M.G * E.h)) && near(M.egg(E.tf - 1e-9, E.tauSoft).y, 0, 1e-6));
check('same Δp, 6× the time → 1/6 the force', near(E.tauSoft / E.tauHard, 6) && near(M.pulse(E.tauHard / 2, E.J, E.tauHard, E.m).F / M.pulse(E.tauSoft / 2, E.J, E.tauSoft, E.m).F, 6));

// collisions
const S = M.STICK, B = M.BOUNCE, X = M.BURST;
check('stick: momentum conserved', near(S.m1 * S.u1 + S.m2 * S.u2, S.m1 * S.v1 + S.m2 * S.v2), `${S.m1 * S.u1 + S.m2 * S.u2} kg·m/s`);
check('stick: one final velocity', near(S.v1, S.v2), `${S.v1} m/s`);
check('stick: KE lost', M.ke(S.m1, S.v1) + M.ke(S.m2, S.v2) < M.ke(S.m1, S.u1) + M.ke(S.m2, S.u2));
check('stick: carts stay touching after', near(M.track(S, 1.7).x2 - M.track(S, 1.7).x1, (M.cartLen(S.m1) + M.cartLen(S.m2)) / 2));
check('bounce: momentum and KE conserved', near(B.m1 * B.u1 + B.m2 * B.u2, B.m1 * B.v1 + B.m2 * B.v2) && near(M.ke(B.m1, B.u1) + M.ke(B.m2, B.u2), M.ke(B.m1, B.v1) + M.ke(B.m2, B.v2)), `v1′ ${B.v1}, v2′ ${B.v2}`);
check('bounce: relative speed reverses', near(B.v2 - B.v1, B.u1 - B.u2));
check('burst: total momentum stays 0', near(X.m1 * X.v1 + X.m2 * X.v2, 0), `v1′ ${X.v1.toFixed(2)}, v2′ ${X.v2.toFixed(2)}`);
check('burst: KE gained = spring energy', near(M.ke(X.m1, X.v1) + M.ke(X.m2, X.v2), X.Q));
check('burst: equal and opposite impulses', near(X.m1 * X.v1, -X.m2 * X.v2));
for (const [name, c] of [['stick', S], ['bounce', B], ['burst', X]]) {
  const vcm = (M.track(c, 1.9).xcm - M.track(c, 0.1).xcm) / 1.8;
  check(`${name}: centre of mass moves at constant v = P/M straight through`, [0.3, 0.8, 1.2, 1.6].every(t => near((M.track(c, t + h).xcm - M.track(c, t - h).xcm) / (2 * h), vcm, 1e-6)) && near(vcm, (c.m1 * c.u1 + c.m2 * c.u2) / (c.m1 + c.m2), 1e-9));
  check(`${name}: they touch at the collision`, near(M.track(c, c.tc).x2 - M.track(c, c.tc).x1, (M.cartLen(c.m1) + M.cartLen(c.m2)) / 2) && M.track(c, 0).x2 - M.track(c, 0).x1 >= (M.cartLen(c.m1) + M.cartLen(c.m2)) / 2 - 1e-9);
}

// ballistic pendulum
const P = M.PEND;
check('pendulum: Δp = 0 in the collision, m·u = (m + M)v′', near(P.m * P.u, (P.m + P.M) * P.v), `v′ ${P.v.toFixed(3)} m/s`);
check('pendulum: v = ((m+M)/m)·√(2gL(1 − cos θ)) recovers u', near(P.u_back, P.u), `θ ${(P.theta * 180 / Math.PI).toFixed(1)}°`);
check('pendulum: energy conserved through the swing', [0.2, 0.5, 0.9, 1.6].every(s => near(M.pend(P.lead + s).K + M.pend(P.lead + s).U, M.pend(P.lead + 1e-9).K, 1e-6)));
const thMax = Math.max(...Array.from({ length: 2000 }, (_, i) => M.swing(i * P.T / 2000).th));
check('pendulum: rises to θmax and Δy = L(1 − cos θ)', near(thMax, P.theta, 1e-4) && near(P.L * (1 - Math.cos(P.theta)), P.dy));
check('pendulum: swing returns after one exact period', Math.abs(M.swing(P.T).th) < 1e-4 && near(M.swing(P.T).om, P.v / P.L, 1e-4), `T ${P.T.toFixed(3)} s`);
check('pendulum: KE lost in the collision (inelastic)', M.ke(P.m, P.u) > M.ke(P.m + P.M, P.v), `${M.ke(P.m, P.u).toFixed(2)} → ${M.ke(P.m + P.M, P.v).toFixed(2)} J`);

// crash
const C = M.CRASH;
check('crash: px and py each conserved', near(C.m1 * C.v1, (C.m1 + C.m2) * C.vx) && near(C.m2 * C.v2, (C.m1 + C.m2) * C.vy));
check('crash: organizer numbers 20 000 and 64 000 kg·m/s', near(C.px, 20000) && near(C.py, 64000), `P ${C.P.toFixed(0)} kg·m/s, v′ ${C.v.toFixed(2)} m/s at ${C.angle.toFixed(1)}°`);
check('crash: KE lost', C.K1 < C.K0, `${(C.K0 / 1000).toFixed(0)} → ${(C.K1 / 1000).toFixed(0)} kJ`);
check('crash: the wreck moves along the total momentum', near(Math.atan2(M.crash(1.5).car[1], M.crash(1.5).car[0]), Math.atan2(C.py, C.px)));

// shell
const H = M.SHELL;
check('shell: momentum at the burst, m·vx = (m/2)·v2′', near(H.m * H.vx, (H.m / 2) * H.v2));
check('shell: CoM follows the unburst parabola', [0.2, 0.9, 1.3, 1.7].every(t => { const s = M.shell(t); return near((s.a[0] + s.b[0]) / 2, s.cm[0]) && near((s.a[1] + s.b[1]) / 2, s.cm[1]); }));
const land = M.shell(H.run);
check('shell: both halves land together; at R/2 and 3R/2, CoM at R', near(land.a[1], 0, 1e-9) && near(land.b[1], 0, 1e-9) && near(land.a[0], H.R / 2) && near(land.b[0], 1.5 * H.R), `R ${H.R.toFixed(2)} m`);

// impulse as an integral (AP Physics C): J = ∫F dt; for the half-sine, 2·F_pk·τ/π
check('wall: J = ∫F dt = 2F_pk τ/π', near(2 * W.Fpk * W.tau / Math.PI, W.J) && near(integrate(t => M.pulse(t, W.J, W.tau, W.m).F, 0, W.tau), W.J, 1e-6));

// continuous centre of mass (AP Physics C)
const R = M.ROD;
for (const [kind, Mtot, xc, name] of [['U', R.MU, R.xU, 'uniform rod: L/2'], ['N', R.MN, R.xN, 'λ = λ₀x/L rod: 2L/3']]) {
  const m = integrate(x => M.lam(kind, x), 0, R.L), mx = integrate(x => x * M.lam(kind, x), 0, R.L);
  check(`${name}: numeric ∫dm = M and (1/M)∫x dm = closed form`, near(m, Mtot, 1e-6) && near(mx / m, xc, 1e-6), `M ${Mtot} kg, x_cm ${xc.toFixed(4)} m`);
  const sl = M.rodSlices(kind);
  check(`${name}: slices add up to M, and Σx·dm / M = x_cm`, near(sl.reduce((s, q) => s + q.dm, 0), Mtot) && near(sl.reduce((s, q) => s + q.x * q.dm, 0) / Mtot, xc));
  check(`${name}: balanced on x_cm, net torque Σ(x − x_cm)·dm·g = 0`, Math.abs(sl.reduce((s, q) => s + (q.x - xc) * q.dm * M.G, 0)) < 1e-12 && Math.abs(integrate(x => (x - xc) * M.lam(kind, x) * M.G, 0, R.L)) < 1e-6);
  check(`${name}: off the balance point there is a net torque`, Math.abs(sl.reduce((s, q) => s + (q.x - (xc - 0.1)) * q.dm, 0)) > 0.09 * Mtot);
}
check('λ = λ₀x/L rod: the heavy end pulls x_cm past the middle', R.xN > R.xU);
for (const [S, w, H, name, xc] of [[M.TRI, M.triW, M.TRI.h, 'triangle: h/3 above the base', M.TRI.h / 3], [M.SEMI, M.semiW, M.SEMI.R, 'semicircle: 4R/3π above the diameter', 4 * M.SEMI.R / (3 * Math.PI)]]) {
  const m = integrate(u => M.SIGMA * w(u), 0, H), mu = integrate(u => u * M.SIGMA * w(u), 0, H);
  check(`${name}: numeric (1/M)∫u σw(u)du = closed form`, near(m, S.M, 1e-6) && near(mu / m, xc, 1e-6), `${xc.toFixed(4)} m`);
  const st = M.plateStrips(S);
  check(`${name}: exact strips add up to M and balance on u_cm`, near(st.reduce((s, q) => s + q.dm, 0), S.M) && Math.abs(st.reduce((s, q) => s + (q.u - xc) * q.dm, 0)) < 1e-12);
  const est = [1, 2, 4, 8, 16, 64, 256].map(n => Math.abs(M.stripSum(w, H, n) - xc));
  check(`${name}: strip sums converge as strips get thinner`, est.every((e, i) => i === 0 || e < est[i - 1]) && est.at(-1) < 1e-3 * xc, `n = 1: ${M.stripSum(w, H, 1).toFixed(3)}, n = 8: ${M.stripSum(w, H, 8).toFixed(4)}`);
}
// 2-D grid sums over the actual regions
const grid2 = (inside, x0, x1, y0, y1, n = 1200) => { let m = 0, mx = 0, my = 0; const dx = (x1 - x0) / n, dy = (y1 - y0) / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = x0 + (i + 0.5) * dx, y = y0 + (j + 0.5) * dy; if (inside([x, y])) { m += dx * dy; mx += x * dx * dy; my += y * dx * dy; } }
  return { A: m, c: [mx / m, my / m] }; };
const L2 = M.ELL, gL = grid2(M.inEll, 0, 1.2, 0, 1.2);
check('L: by parts (m_A c_A + m_B c_B)/M matches a 2-D grid sum', near(gL.c[0], L2.cm[0], 2e-3) && near(gL.c[1], L2.cm[1], 2e-3) && near(M.SIGMA * gL.A, L2.M, 2e-3), `(${L2.cm[0].toFixed(3)}, ${L2.cm[1].toFixed(3)}) m`);
check('L: its centre of mass lies outside the material', !M.inEll(L2.cm));
check('L: hung from P, the centre of mass is straight below it', Math.abs(M.hang(L2.cm)[0]) < 1e-12 && M.hang(L2.cm)[1] < 0 && near(M.hang(L2.P)[0], 0) && near(M.hang(L2.P)[1], 0));
{ let tq = 0; const n = 480, d = 1.2 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const p = [(i + 0.5) * d, (j + 0.5) * d]; if (M.inEll(p)) tq += M.hang(p)[0] * M.SIGMA * d * d * M.G; }
  check('L: hanging, gravity’s net torque about P is zero', Math.abs(tq) < 1e-9 * L2.M * M.G, `${tq.toExponential(1)} N·m`); }
const Hh = M.HOLE, gH = grid2(M.inHoled, -0.6, 0.6, -0.6, 0.6, 1600);
check('holed plate: full minus plug, (m_full·0 − m_plug·c)/(m_full − m_plug), matches a grid sum', near(gH.c[0], Hh.cm[0], 3e-3) && near(gH.c[1], Hh.cm[1], 3e-3) && near(M.SIGMA * gH.A, Hh.M, 2e-3), `(${Hh.cm[0].toFixed(4)}, ${Hh.cm[1].toFixed(4)}) m`);
check('holed plate: x_cm moves away from the hole, on the line through it', Hh.cm[0] < 0 && near(Hh.cm[0] / Hh.c[0], Hh.cm[1] / Hh.c[1]));

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
  const f2 = x => (x < 0 ? "−" : "") + Math.abs(x).toFixed(2);
  const root = (fn, a, b) => { let fa = fn(a); for (let i = 0; i < 100; i++) { const m = (a + b) / 2, fm = fn(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
  // 0: K ratio from the page's own speeds; |Δp| as the length of p_f − p_i with signed velocities
  keyed(0, 0, M.ke(M.BALL.m, M.BALL.v) / M.ke(M.CART.m, M.CART.v), 'K_ball / K_cart from ½mv²');
  keyed(0, 1, Math.abs(M.p(M.BALL.m, -3.0) - M.p(M.BALL.m, M.BALL.v)), '|Δp| = |m(−3.0) − m(+4.0)|');
  // 1: average force = ∫F dt / τ over the model's pulse; the impulse = ∫F dt (midpoint sum)
  { const tau = M.WALL.tau, J = integrate(t => -M.wall(M.WALL.lead + t).F, 0, tau);
    keyed(1, 0, J / tau, 'average force = ∫F dt / τ (model pulse)');
    keyed(1, 1, integrate(t => M.pulse(t, M.WALL.J, tau, M.WALL.m).F, 0, tau), 'impulse = ∫F dt (numeric)'); }
  // 2: average net force on the floor = ∫F_net dt / τ over the model's contact
  { const E = M.EGG; keyed(2, 0, integrate(t => M.egg(E.tf + t, E.tauHard).Fnet, 0, E.tauHard) / E.tauHard, 'egg on the floor: ∫F_net dt / τ (model)'); }
  // 3: v′ by equal and opposite impulses, m1(v − u1) = −m2(v − u2), solved by bisection; ΔK = ½μ(u1 − u2)²
  { const S = M.STICK, mu = S.m1 * S.m2 / (S.m1 + S.m2);
    keyed(3, 0, root(v => S.m1 * (v - S.u1) + S.m2 * (v - S.u2), -10, 10), 'stick: v′ from equal and opposite impulses');
    keyed(3, 1, 0.5 * mu * (S.u1 - S.u2) ** 2, 'stick: KE lost = ½μ(Δu)²'); }
  // 4: elastic: momentum and reversed relative velocity, solved as a 2×2 system
  { const B = M.BOUNCE, a = B.m1, b = B.m2, P = a * B.u1 + b * B.u2, R = B.u1 - B.u2;   // a v1 + b v2 = P, −v1 + v2 = R
    const v1 = (P - b * R) / (a + b);
    keyed(4, 0, v1, 'elastic: v1′ from Δp = 0 and v2′ − v1′ = u1 − u2');
    check('practice 4.1: that answer also keeps KE', near(M.ke(a, v1) + M.ke(b, v1 + R), M.ke(a, B.u1) + M.ke(b, B.u2))); }
  // 5: explosion: v2 from Q = ½m1v1² + ½m2v2² with v1 = −(m2/m1)v2; K ratio from the model's speeds
  { const X = M.BURST; keyed(5, 0, Math.sqrt(2 * X.Q / (X.m2 + X.m2 ** 2 / X.m1)), 'explosion: v2′ from energy and Δp = 0');
    keyed(5, 1, M.ke(X.m1, X.v1) / M.ke(X.m2, X.v2), 'explosion: K1/K2 from ½mv²'); }
  // 6: rise from the RK4 swing (L(1 − cos θ_max)); fraction lost from the model's energies
  { const Pd = M.PEND, thMax = Math.max(...Array.from({ length: 4001 }, (_, i) => M.swing(i * Pd.T / 4000).th));
    keyed(6, 0, Pd.L * (1 - Math.cos(thMax)) * 100, 'rise from the RK4 swing, cm');
    keyed(6, 1, 100 * (1 - M.pend(Pd.lead + 1e-9).K / M.pend(0).K), 'KE lost in the hit, % (model)'); }
  // 7: speed and direction from the model's after-crash displacement over 1 s
  { const C = M.CRASH, [x, y] = M.crash(C.tc + 1).car;
    keyed(7, 0, Math.hypot(x, y), 'wreck speed from its displacement in 1 s');
    keyed(7, 1, Math.acos(x / Math.hypot(x, y)) * 180 / Math.PI, 'wreck direction, acos(Δx/|Δr|)'); }
  // 8: front half's landing point from the model's motion
  keyed(8, 0, M.shell(M.SHELL.run).b[0], 'front half lands (model motion)');
  // 9: x_cm by a midpoint sum of λ(x)·x; the x² rod's mass and x_cm too
  { const L = M.ROD.L, l1 = x => M.lam('N', x), l2 = x => M.ROD.lam0 * x * x / (L * L);
    keyed(9, 0, integrate(x => x * l1(x), 0, L) / integrate(l1, 0, L), 'linear rod x_cm, ∫xλ dx / ∫λ dx');
    states(9, 1, `${integrate(l2, 0, L).toFixed(2)} kg`, 'x² rod mass, ∫λ dx');
    states(9, 1, `${(integrate(x => x * l2(x), 0, L) / integrate(l2, 0, L)).toFixed(2)} m`, 'x² rod x_cm, ∫xλ dx / ∫λ dx'); }
  // 10: plates by a fine strip sum
  keyed(10, 0, M.stripSum(M.semiW, M.SEMI.R, 20000), 'semicircle u_cm, 20 000 strips');
  keyed(10, 1, M.stripSum(M.triW, M.TRI.h, 20000), 'triangle u_cm, 20 000 strips');
  // 11: the L by a grid of cells over its outline; the holed square by vertical strips (square minus the disc's chord)
  { const n = 600, d = 1.2 / n; let m = 0, mx = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const p = [(i + 0.5) * d, (j + 0.5) * d]; if (M.inEll(p)) { m += 1; mx += p[0]; } }
    keyed(11, 0, mx / m, 'L x_cm, grid of cells');
    const Ho = M.HOLE, w = x => Ho.s - 2 * Math.sqrt(Math.max(Ho.r ** 2 - (x - Ho.c[0]) ** 2, 0));
    states(11, 1, `${f2(100 * integrate(x => x * w(x), -Ho.s / 2, Ho.s / 2, 200000) / integrate(w, -Ho.s / 2, Ho.s / 2, 200000))} cm`, 'holed square x_cm, vertical strips'); }
}

for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
