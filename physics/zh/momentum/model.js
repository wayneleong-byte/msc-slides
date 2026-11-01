// Momentum and impulse model: simple objects that push on each other. Pure functions, SI units.
// Every motion, arrow and number on the page comes from here.

export const G = 9.80;           // m/s²
export const SLOW = 0.5;         // most scenes are shown at 0.5× speed
export const SLOW_HIT = 0.15;    // the two impact scenes at 0.15×, so the contact can be seen
export const REST = 0.8;         // pause before a scene starts over (shown seconds)
// each scene loops: motion, then a short rest, then it starts again
export const loop = (clock, run, slow = SLOW) => { const c = (clock * slow) % (run + REST * slow); return { t: Math.min(c, run), resting: c > run }; };

// ---------- 1 · momentum: same p, different m and v ----------
export const BALL = { m: 0.5, v: 4.0 };
export const CART = { m: 2.0, v: 1.0 };
export const MOM_T = 1.0;                       // seconds shown
export const p = (m, v) => m * v;
export const ke = (m, v) => 0.5 * m * v * v;
export const keFromP = (pp, m) => pp * pp / (2 * m);

// ---------- 2 · impulse: a ball bounces off a wall ----------
// While touching, the wall pushes with a half-sine F(t) = F_pk sin(πt/τ). Its area is J.
export const WALL = { m: 0.5, v: 3.0, tau: 0.10, r: 0.2, lead: 0.2, tail: 0.2 };
WALL.J = 2 * WALL.m * WALL.v;                   // elastic bounce: Δp = m(−v) − m(v)
WALL.Fpk = Math.PI * WALL.J / (2 * WALL.tau);
WALL.Favg = WALL.J / WALL.tau;
WALL.run = WALL.lead + WALL.tau + WALL.tail;
// a pulse that starts at t = 0 and lasts τ: force, change in velocity and displacement so far
export function pulse(t, J, tau, m) {
  if (t <= 0) return { F: 0, dv: 0, dx: 0 };
  const s = Math.min(t, tau), Fpk = Math.PI * J / (2 * tau);
  const F = t < tau ? Fpk * Math.sin(Math.PI * s / tau) : 0;
  const dv = (J / m) * (1 - Math.cos(Math.PI * s / tau)) / 2;
  const dx = (J / (2 * m)) * (s - (tau / Math.PI) * Math.sin(Math.PI * s / tau)) + (t > tau ? (J / m) * (t - tau) : 0);
  return { F, dv, dx };
}
// ball centre x (wall face at x = 0), velocity, the wall's force on the ball (signed)
export function wall(t) {
  const { m, v, r, lead } = WALL, tc = t - lead;
  const q = pulse(tc, WALL.J, WALL.tau, m);
  const x = -r + v * tc - q.dx;
  return { x, v: v - q.dv, F: -q.F, p: m * (v - q.dv), squash: Math.max(0, x + r), touching: tc > 0 && tc < WALL.tau };
}

// ---------- 3 · same Δp, more time: an egg on a pillow and on the floor ----------
export const EGG = { m: 0.06, v0: 2.5, tauSoft: 0.18, tauHard: 0.03 };
EGG.h = EGG.v0 * EGG.v0 / (2 * G);              // drop height for that speed
EGG.tf = EGG.v0 / G;                            // falling time
EGG.J = EGG.m * EGG.v0;                         // Δp to stop it (net impulse)
EGG.run = EGG.tf + EGG.tauSoft + 0.12;
// height of the egg's bottom above the point where it first touches; net force (up +)
export function egg(t, tau) {
  const { m, v0, h, tf } = EGG;
  if (t < tf) return { y: h - 0.5 * G * t * t, v: -G * t, Fnet: -m * G, N: 0 };
  const q = pulse(t - tf, EGG.J, tau, m);
  const stopped = t - tf >= tau;
  return { y: stopped ? -v0 * tau / 2 : -v0 * (t - tf) + q.dx, v: stopped ? 0 : -v0 + q.dv, Fnet: q.F, N: q.F + m * G };
}

// ---------- 4–6 · collisions on a track (instantaneous, no outside forces) ----------
// e = 1 elastic, e = 0 perfectly inelastic (they stick)
export function collide(m1, u1, m2, u2, e) {
  const P = m1 * u1 + m2 * u2, M = m1 + m2;
  return { v1: (P - e * m2 * (u1 - u2)) / M, v2: (P + e * m1 * (u1 - u2)) / M };
}
// explosion from velocity v: a spring gives the pair energy Q; momentum shared so p stays the same
export function burst(m1, m2, v, Q) {
  const mu = m1 * m2 / (m1 + m2), dv = Math.sqrt(2 * Q / mu);
  return { v1: v - dv * m2 / (m1 + m2), v2: v + dv * m1 / (m1 + m2) };
}
export const cartLen = m => 0.55 * Math.cbrt(m);
export const TC = 0.7;                          // collision at t = TC
export const STICK = { m1: 2.0, u1: 3.0, m2: 1.0, u2: -1.5, e: 0, run: 1.4 };
export const BOUNCE = { m1: 1.0, u1: 4.0, m2: 3.0, u2: 0, e: 1, run: 1.4 };
export const BURST = { m1: 1.0, u1: 0, m2: 3.0, u2: 0, Q: 6.0, tc: 0.4, run: 1.4 };
for (const c of [STICK, BOUNCE]) Object.assign(c, collide(c.m1, c.u1, c.m2, c.u2, c.e), { tc: TC });
Object.assign(BURST, burst(BURST.m1, BURST.m2, 0, BURST.Q));
// positions of both carts' centres: they touch at x = 0 when t = tc
export function track(c, t) {
  const L1 = cartLen(c.m1), L2 = cartLen(c.m2), a = Math.min(t, c.tc), b = Math.max(t - c.tc, 0);
  const x1 = -L1 / 2 + c.u1 * (a - c.tc) + c.v1 * b, x2 = L2 / 2 + c.u2 * (a - c.tc) + c.v2 * b;
  const after = t >= c.tc, w1 = after ? c.v1 : c.u1, w2 = after ? c.v2 : c.u2;
  const M = c.m1 + c.m2;
  return { x1, x2, w1, w2, p1: c.m1 * w1, p2: c.m2 * w2, P: c.m1 * w1 + c.m2 * w2, K: ke(c.m1, w1) + ke(c.m2, w2), xcm: (c.m1 * x1 + c.m2 * x2) / M, after };
}

// ---------- 7 · ballistic pendulum: a lump of clay sticks in a hanging block ----------
export const PEND = { m: 0.2, M: 1.0, L: 1.2, u: 10.0, lead: 0.15 };
PEND.v = PEND.m * PEND.u / (PEND.m + PEND.M);                   // step 1–2: Δp = 0
PEND.dy = PEND.v * PEND.v / (2 * G);                           // step 2–3: ΔE = 0
PEND.theta = Math.acos(1 - PEND.dy / PEND.L);
PEND.u_back = ((PEND.m + PEND.M) / PEND.m) * Math.sqrt(2 * G * PEND.L * (1 - Math.cos(PEND.theta)));
// exact period of the swing (complete elliptic integral via the AGM)
const agm = (a, b) => { for (let i = 0; i < 30; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return a; };
PEND.T = 2 * Math.PI * Math.sqrt(PEND.L / G) / agm(1, Math.cos(PEND.theta / 2));
PEND.run = PEND.lead + PEND.T;
// the swing, θ'' = −(g/L) sin θ, integrated once (RK4) and read back by interpolation
const DT = 2e-4, SWING = (() => {
  const w2 = G / PEND.L, out = [[0, PEND.v / PEND.L]];
  let th = 0, om = PEND.v / PEND.L;
  const f = (a) => -w2 * Math.sin(a);
  for (let t = 0; t < PEND.T + 0.05; t += DT) {
    const k1t = om, k1o = f(th), k2t = om + DT / 2 * k1o, k2o = f(th + DT / 2 * k1t);
    const k3t = om + DT / 2 * k2o, k3o = f(th + DT / 2 * k2t), k4t = om + DT * k3o, k4o = f(th + DT * k3t);
    th += DT / 6 * (k1t + 2 * k2t + 2 * k3t + k4t); om += DT / 6 * (k1o + 2 * k2o + 2 * k3o + k4o);
    out.push([th, om]);
  }
  return out;
})();
export function swing(ts) {
  const k = Math.max(0, ts) / DT, i = Math.min(Math.floor(k), SWING.length - 2), u = Math.min(k - i, 1);
  return { th: SWING[i][0] + (SWING[i + 1][0] - SWING[i][0]) * u, om: SWING[i][1] + (SWING[i + 1][1] - SWING[i][1]) * u };
}
export function pend(t) {
  const { m, M, L, u, lead } = PEND, ts = t - lead;
  if (ts < 0) return { clayX: u * ts, th: 0, om: 0, stuck: false, K: ke(m, u), U: 0, P: m * u };
  const s = swing(ts), v = s.om * L, h = L * (1 - Math.cos(s.th));
  return { clayX: 0, th: s.th, om: s.om, stuck: true, K: ke(m + M, v), U: (m + M) * G * h, P: (m + M) * v * Math.cos(s.th) };
}

// ---------- 8 · a crash at a crossroads (2-D, they stick) ----------
// x east, y north. Organizer: car 1000 kg at 20 m/s east, truck 8000 kg at 8 m/s north.
export const CRASH = { m1: 1000, v1: 20, m2: 8000, v2: 8, tc: 1.0, run: 1.8 };
CRASH.px = CRASH.m1 * CRASH.v1; CRASH.py = CRASH.m2 * CRASH.v2;
CRASH.P = Math.hypot(CRASH.px, CRASH.py);
CRASH.v = CRASH.P / (CRASH.m1 + CRASH.m2);
CRASH.vx = CRASH.px / (CRASH.m1 + CRASH.m2); CRASH.vy = CRASH.py / (CRASH.m1 + CRASH.m2);
CRASH.angle = Math.atan2(CRASH.py, CRASH.px) * 180 / Math.PI;    // north of east
CRASH.K0 = ke(CRASH.m1, CRASH.v1) + ke(CRASH.m2, CRASH.v2);
CRASH.K1 = ke(CRASH.m1 + CRASH.m2, CRASH.v);
// displacement of each vehicle from where it is at the moment of impact
export function crash(t) {
  const a = Math.min(t, CRASH.tc) - CRASH.tc, b = Math.max(t - CRASH.tc, 0);
  return { car: [CRASH.v1 * a + CRASH.vx * b, CRASH.vy * b], truck: [CRASH.vx * b, CRASH.v2 * a + CRASH.vy * b], after: t >= CRASH.tc };
}

// ---------- 9 · centre of mass: a shell bursts at the top into two equal halves ----------
// at the apex the rear half is left at rest (v′ = 0) and the front half carries all the momentum
export const SHELL = { m: 1.0, v0: 10.0, deg: 60 };
SHELL.vx = SHELL.v0 * Math.cos(SHELL.deg * Math.PI / 180);
SHELL.vy = SHELL.v0 * Math.sin(SHELL.deg * Math.PI / 180);
SHELL.ta = SHELL.vy / G;
SHELL.H = SHELL.vy * SHELL.vy / (2 * G);
SHELL.R = 2 * SHELL.vx * SHELL.ta;
SHELL.v2 = (SHELL.m / (SHELL.m / 2)) * SHELL.vx;                // ((m1 + m2)/m2)·vx
SHELL.run = 2 * SHELL.ta;
export function shell(t) {
  const { vx, vy, ta } = SHELL;
  const cm = [vx * t, vy * t - 0.5 * G * t * t];
  if (t < ta) return { cm, a: cm, b: cm, burst: false };
  const s = t - ta, y = SHELL.H - 0.5 * G * s * s;
  return { cm, a: [vx * ta, y], b: [vx * ta + SHELL.v2 * s, y], burst: true };
}

// ---------- 10–12 · AP Physics C: the centre of mass of a continuous object ----------
// x_cm = (1/M)∫x dm. Cut the object into pieces dm, weight each by where it is, add up.
export const SWEEP = 3.0;                       // seconds for the dm slice to cross an object (shown)

// 10 · two rods, length L, from x = 0: uniform λ, and λ(x) = λ₀x/L (dense at the far end)
export const ROD = { L: 2.0, lamU: 0.5, lam0: 1.5, n: 10 };
ROD.MU = ROD.lamU * ROD.L;                      // ∫λ dx
ROD.MN = ROD.lam0 * ROD.L / 2;                  // ∫λ₀x/L dx = λ₀L/2
ROD.xU = ROD.L / 2;
ROD.xN = 2 * ROD.L / 3;                         // (λ₀L²/3) / (λ₀L/2)
export const lam = (kind, x) => kind === 'U' ? ROD.lamU : ROD.lam0 * x / ROD.L;
// mass and first moment ∫x dm of the rod between a and b (exact antiderivatives)
export function rodPiece(kind, a, b) {
  if (kind === 'U') return { dm: ROD.lamU * (b - a), mx: ROD.lamU * (b * b - a * a) / 2 };
  return { dm: ROD.lam0 * (b * b - a * a) / (2 * ROD.L), mx: ROD.lam0 * (b ** 3 - a ** 3) / (3 * ROD.L) };
}
// cut [0, L] into n equal slices: each slice's mass and its own centre of mass
export const rodSlices = (kind, n = ROD.n) => Array.from({ length: n }, (_, i) => {
  const a = i * ROD.L / n, b = (i + 1) * ROD.L / n, q = rodPiece(kind, a, b);
  return { a, b, dm: q.dm, x: q.mx / q.dm };
});

// 11 · plates of surface density σ, cut into strips parallel to a straight edge (u measured from it)
export const SIGMA = 2.0;                       // kg/m²
export const TRI = { b: 1.2, h: 1.5, n: 8 };    // triangle: base b on u = 0, apex at u = h
export const SEMI = { R: 0.8, n: 8 };           // semicircle: diameter on u = 0
export const triW = u => TRI.b * (1 - u / TRI.h);
export const semiW = u => 2 * Math.sqrt(Math.max(SEMI.R * SEMI.R - u * u, 0));
TRI.ucm = TRI.h / 3;
SEMI.ucm = 4 * SEMI.R / (3 * Math.PI);
TRI.M = SIGMA * TRI.b * TRI.h / 2;
SEMI.M = SIGMA * Math.PI * SEMI.R ** 2 / 2;
// exact area and ∫u dA of each strip from a to b
const triA = u => TRI.b * (u - u * u / (2 * TRI.h)), triMu = u => TRI.b * (u * u / 2 - u ** 3 / (3 * TRI.h));
const semiA = u => { const R = SEMI.R, c = Math.min(Math.max(u / R, -1), 1); return u * Math.sqrt(Math.max(R * R - u * u, 0)) + R * R * Math.asin(c); };
const semiMu = u => -(2 / 3) * Math.max(SEMI.R ** 2 - u * u, 0) ** 1.5;
export function plateStrips(shape, n = shape.n) {
  const H = shape === TRI ? TRI.h : SEMI.R, A = shape === TRI ? triA : semiA, Mu = shape === TRI ? triMu : semiMu;
  return Array.from({ length: n }, (_, i) => {
    const a = i * H / n, b = (i + 1) * H / n, dA = A(b) - A(a);
    return { a, b, dm: SIGMA * dA, u: (Mu(b) - Mu(a)) / dA };
  });
}
// the strip sum a student writes: n rectangles, each as wide as the plate at its middle
export function stripSum(w, H, n) {
  let m = 0, mu = 0;
  for (let i = 0; i < n; i++) { const u = (i + 0.5) * H / n, dm = w(u) * H / n; m += dm; mu += u * dm; }
  return mu / m;
}

// 12 · by parts and by subtraction
// an L (boomerang) of two rectangles, corner at (0, 0): arm A along a, arm B along b
export const ELL = { A: { a0: 0, a1: 1.2, b0: 0, b1: 0.3 }, B: { a0: 0, a1: 0.3, b0: 0.3, b1: 1.2 } };
const rect = r => ({ m: SIGMA * (r.a1 - r.a0) * (r.b1 - r.b0), c: [(r.a0 + r.a1) / 2, (r.b0 + r.b1) / 2] });
ELL.pA = rect(ELL.A); ELL.pB = rect(ELL.B);
ELL.M = ELL.pA.m + ELL.pB.m;
ELL.cm = [0, 1].map(k => (ELL.pA.m * ELL.pA.c[k] + ELL.pB.m * ELL.pB.c[k]) / ELL.M);
export const inRect = (r, [a, b]) => a >= r.a0 && a <= r.a1 && b >= r.b0 && b <= r.b1;
export const inEll = p => inRect(ELL.A, p) || inRect(ELL.B, p);
// hung by a string tied at P: it turns until the centre of mass is straight below P
ELL.P = [1.1, 0.15];
ELL.phi = -Math.PI / 2 - Math.atan2(ELL.cm[1] - ELL.P[1], ELL.cm[0] - ELL.P[0]);
// a point of the L, in the hanging frame: P at the origin, y up
export const hang = ([a, b]) => { const u = a - ELL.P[0], v = b - ELL.P[1], c = Math.cos(ELL.phi), s = Math.sin(ELL.phi); return [u * c - v * s, u * s + v * c]; };

// a square plate with a round hole: the full square minus the plug
export const HOLE = { s: 1.2, r: 0.3, c: [0.25, 0.25] };     // centred square of side s; hole centre c
HOLE.mFull = SIGMA * HOLE.s ** 2;
HOLE.mPlug = SIGMA * Math.PI * HOLE.r ** 2;
HOLE.M = HOLE.mFull - HOLE.mPlug;
HOLE.cm = HOLE.c.map(k => (HOLE.mFull * 0 - HOLE.mPlug * k) / HOLE.M);
export const inHoled = ([x, y]) => Math.abs(x) <= HOLE.s / 2 && Math.abs(y) <= HOLE.s / 2 && Math.hypot(x - HOLE.c[0], y - HOLE.c[1]) > HOLE.r;
