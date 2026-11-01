// Work, energy and power model: simple objects in twelve situations. Pure functions, SI units.
// Every motion, arrow, energy bar and number on the page comes from here.

export const G = 9.80;          // m/s²
export const SLOW = 0.6;        // shown at 0.6× speed
export const REST = 0.8;        // each scene pauses this long on its last frame, then starts over
export const loop = (clock, run) => { const c = (clock * SLOW) % (run + REST); return { t: Math.min(c, run), resting: c > run }; };
const D2R = Math.PI / 180;

// ---------- work: a 4.0 kg box pulled from rest by a rope at 30°, frictionless floor ----------
export const PULL = { m: 4.0, F: 20.0, deg: 30, run: 1.2 };
PULL.th = PULL.deg * D2R;
PULL.Fx = PULL.F * Math.cos(PULL.th);          // 17.32 N along the motion: does the work
PULL.Fy = PULL.F * Math.sin(PULL.th);          // 10.00 N up: perpendicular, no work
PULL.W = PULL.m * G;
PULL.FN = PULL.W - PULL.Fy;                    // floor pushes up less, the rope carries some
PULL.a = PULL.Fx / PULL.m;
export function pull(t) {
  const x = 0.5 * PULL.a * t * t, v = PULL.a * t;
  return { x, v, W: PULL.F * x * Math.cos(PULL.th), K: 0.5 * PULL.m * v * v };
}
export const work = (F, dx, deg) => F * dx * Math.cos(deg * D2R);

// ---------- the sign of work: a 0.50 kg ball thrown straight up at 6.0 m/s ----------
export const TOSS = { m: 0.5, v0: 6.0 };
TOSS.run = 2 * TOSS.v0 / G;                    // back to the hand
TOSS.h = TOSS.v0 ** 2 / (2 * G);
export function toss(t) {
  const y = TOSS.v0 * t - 0.5 * G * t * t, v = TOSS.v0 - G * t;
  // work done by gravity so far: F·Δy with F = −mg
  return { y, v, Wg: -TOSS.m * G * y, K: 0.5 * TOSS.m * v * v };
}

// ---------- no work: a 0.50 kg ball whirled on a 1.0 m string over a smooth table ----------
export const WHIRL = { m: 0.5, r: 1.0, v: 3.0 };
WHIRL.T = WHIRL.m * WHIRL.v ** 2 / WHIRL.r;     // 4.5 N, always toward the centre
WHIRL.period = 2 * Math.PI * WHIRL.r / WHIRL.v;
WHIRL.K = 0.5 * WHIRL.m * WHIRL.v ** 2;
export const whirl = t => { const a = WHIRL.v / WHIRL.r * t; return { a, x: WHIRL.r * Math.cos(a), z: -WHIRL.r * Math.sin(a) }; };

// ---------- work–energy theorem: a 1200 kg car, 3.0 kN forward from the road, drag ignored ----------
export const CAR = { m: 1200, F: 3000, run: 2.4 };
CAR.a = CAR.F / CAR.m;
CAR.W = CAR.m * G;
export function car(t) {
  const x = 0.5 * CAR.a * t * t, v = CAR.a * t;
  return { x, v, Wnet: CAR.F * x, K: 0.5 * CAR.m * v * v };
}

// ---------- gravitational PE: a 0.50 kg ball dropped from 3.0 m; U_g = 0 at the ground ----------
export const DROP = { m: 0.5, h: 3.0, ref2: 1.0 };   // ref2: a second choice of zero, a tabletop
DROP.run = Math.sqrt(2 * DROP.h / G);
DROP.E = DROP.m * G * DROP.h;
export function drop(t) {
  const y = DROP.h - 0.5 * G * t * t, v = -G * t;
  return { y, v, U: DROP.m * G * y, K: 0.5 * DROP.m * v * v };
}

// ---------- spring PE: a 2.0 kg block slides at 2.0 m/s into a 50 N/m spring, frictionless ----------
export const SPRING = { m: 2.0, k: 50, v0: 2.0, gap: 1.5 };
SPRING.w = Math.sqrt(SPRING.k / SPRING.m);
SPRING.xmax = SPRING.v0 / SPRING.w;                 // 0.40 m
SPRING.tIn = SPRING.gap / SPRING.v0;                // until it touches
SPRING.tC = Math.PI / SPRING.w;                     // in contact: half an oscillation
SPRING.run = 2 * SPRING.tIn + SPRING.tC;
SPRING.E = 0.5 * SPRING.m * SPRING.v0 ** 2;
// s: position of the block's front face, 0 where the spring's free end sits; x: compression
export function spring(t) {
  const { tIn, tC, v0, w, k, m, gap } = SPRING;
  let s, v;
  if (t < tIn) { s = -gap + v0 * t; v = v0; }
  else if (t < tIn + tC) { const u = t - tIn; s = (v0 / w) * Math.sin(w * u); v = v0 * Math.cos(w * u); }
  else { s = -v0 * (t - tIn - tC); v = -v0; }
  const x = Math.max(s, 0);
  return { s, v, x, F: -k * x, U: 0.5 * k * x * x, K: 0.5 * m * v * v };
}

// ---------- conservation: a 1.0 kg pendulum on a 2.0 m string from 40°; U_g = 0 at the bottom ----------
export const PEND = { m: 1.0, L: 2.0, deg0: 40 };
PEND.th0 = PEND.deg0 * D2R;
PEND.E = PEND.m * G * PEND.L * (1 - Math.cos(PEND.th0));
// exact period: T = 4√(L/g)·K(sin(θ0/2)), with K from the arithmetic–geometric mean
const agm = (a, b) => { for (let i = 0; i < 30; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return a; };
PEND.period = 4 * Math.sqrt(PEND.L / G) * (Math.PI / (2 * agm(1, Math.cos(PEND.th0 / 2))));
PEND.run = PEND.period;
// one period, integrated with RK4 from release (θ0, at rest); θ'' = −(g/L) sin θ
const PSTEP = 1e-3;
const ptab = (() => {
  const f = (th, om) => [om, -(G / PEND.L) * Math.sin(th)];
  const n = Math.ceil(PEND.period / PSTEP) + 2, out = new Float64Array(2 * n);
  let th = PEND.th0, om = 0;
  for (let i = 0; i < n; i++) {
    out[2 * i] = th; out[2 * i + 1] = om;
    const h = PSTEP, k1 = f(th, om), k2 = f(th + h / 2 * k1[0], om + h / 2 * k1[1]), k3 = f(th + h / 2 * k2[0], om + h / 2 * k2[1]), k4 = f(th + h * k3[0], om + h * k3[1]);
    th += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); om += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  }
  return out;
})();
export function pendulum(t) {
  const tt = ((t % PEND.period) + PEND.period) % PEND.period, i = Math.floor(tt / PSTEP), u = tt / PSTEP - i;
  // cubic Hermite between samples, using θ' = ω and ω' = −(g/L) sin θ, so energy holds between them too
  const herm = (p0, m0, p1, m1) => { const u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * PSTEP * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * PSTEP * m1; };
  const a = th => -(G / PEND.L) * Math.sin(th), t0 = ptab[2 * i], t1 = ptab[2 * i + 2], w0 = ptab[2 * i + 1], w1 = ptab[2 * i + 3];
  const th = herm(t0, w0, t1, w1), om = herm(w0, a(t0), w1, a(t1));
  const { m, L } = PEND, v = om * L;
  const U = m * G * L * (1 - Math.cos(th)), K = 0.5 * m * v * v;
  return { th, om, v, U, K, T: m * G * Math.cos(th) + m * v * v / L, Ftan: m * G * Math.sin(th) };
}

// ---------- non-conservative work: a 2.0 kg block slides at 4.0 m/s onto a rough floor, μk 0.40 ----------
export const SLIDE = { m: 2.0, v0: 4.0, mu: 0.40 };
SLIDE.f = SLIDE.mu * SLIDE.m * G;                     // 7.84 N
SLIDE.a = SLIDE.f / SLIDE.m;
SLIDE.run = SLIDE.v0 / SLIDE.a;
SLIDE.d = SLIDE.v0 ** 2 / (2 * SLIDE.a);
SLIDE.E = 0.5 * SLIDE.m * SLIDE.v0 ** 2;
SLIDE.W = SLIDE.m * G;
export function slide(t) {
  const tt = Math.min(t, SLIDE.run), x = SLIDE.v0 * tt - 0.5 * SLIDE.a * tt * tt, v = SLIDE.v0 - SLIDE.a * tt;
  return { x, v, K: 0.5 * SLIDE.m * v * v, Eth: SLIDE.f * x, Wf: -SLIDE.f * x };
}

// ---------- power: the same 10 kg crate lifted 2.0 m at steady speed, quickly and slowly ----------
export const LIFT = { m: 10, h: 2.0, vFast: 1.0, vSlow: 0.5 };
LIFT.W = LIFT.m * G;                                  // rope tension at steady speed = weight
LIFT.work = LIFT.W * LIFT.h;                          // 196 J either way
LIFT.tFast = LIFT.h / LIFT.vFast;
LIFT.tSlow = LIFT.h / LIFT.vSlow;
LIFT.Pfast = LIFT.work / LIFT.tFast;
LIFT.Pslow = LIFT.work / LIFT.tSlow;
LIFT.run = LIFT.tSlow;
export const HP = 746;                                // watts per horsepower
export function lift(t, v) {
  const y = Math.min(v * t, LIFT.h), moving = v * t < LIFT.h;
  return { y, v: moving ? v : 0, W: LIFT.W * y, P: moving ? LIFT.W * v : 0 };
}

// ---------- shared: one-dimensional motion x'' = a(x), tabulated with RK4 ----------
// n steps of T/n from (x0, v0); sample(t) interpolates with cubic Hermite (x' = v, v' = a(x)).
function rk4Table(acc, x0, v0, T, n) {
  const h = T / n, out = new Float64Array(2 * (n + 1));
  let x = x0, v = v0;
  for (let i = 0; i <= n; i++) {
    out[2 * i] = x; out[2 * i + 1] = v;
    const k1x = v, k1v = acc(x), k2x = v + h / 2 * k1v, k2v = acc(x + h / 2 * k1x), k3x = v + h / 2 * k2v, k3v = acc(x + h / 2 * k2x), k4x = v + h * k3v, k4v = acc(x + h * k3x);
    x += h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
  }
  const sample = t => {
    const s = Math.min(Math.max(t / h, 0), n - 1e-9), i = Math.floor(s), u = s - i, u2 = u * u, u3 = u2 * u;
    const herm = (p0, m0, p1, m1) => (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * m1;
    const xa = out[2 * i], va = out[2 * i + 1], xb = out[2 * i + 2], vb = out[2 * i + 3];
    return { x: herm(xa, va, xb, vb), v: herm(va, acc(xa), vb, acc(xb)) };
  };
  return { out, sample, end: { x: out[2 * n], v: out[2 * n + 1] } };
}
// time for a motion from rest-or-not to first meet a condition, by small RK4 steps and a linear
// interpolation of the last one (accurate to ~1e-9 s here)
function timeUntil(acc, x0, v0, hit, h = 1e-4, tmax = 100) {
  let x = x0, v = v0, t = 0, f0 = hit(x, v, t);
  while (t < tmax) {
    const k1x = v, k1v = acc(x), k2x = v + h / 2 * k1v, k2v = acc(x + h / 2 * k1x), k3x = v + h / 2 * k2v, k3v = acc(x + h / 2 * k2x), k4x = v + h * k3v, k4v = acc(x + h * k3x);
    const xn = x + h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x), vn = v + h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v), f1 = hit(xn, vn, t + h);
    if (f0 < 0 && f1 >= 0) return t + h * (-f0) / (f1 - f0);
    x = xn; v = vn; t += h; f0 = f1;
  }
  return NaN;
}
const bisect = (fn, a, b, it = 80) => { let fa = fn(a); for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = fn(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };

// ---------- work by a changing force (Physics C): a 5.0 kg crate pushed along a smooth floor ----------
// The push F(x) = F0 (1 − x/L)(1 + 2x/L) starts at F0, peaks at x = L/4 and fades to 0 at x = L;
// after that the crate coasts. W = ∫F dx = F0 L (u + u²/2 − 2u³/3), u = x/L.
export const PUSH = { m: 5.0, F0: 16, L: 3.0, coast: 0.6 };
export const pushF = x => (x < 0 || x > PUSH.L ? 0 : PUSH.F0 * (1 - x / PUSH.L) * (1 + 2 * x / PUSH.L));
export const pushW = x => { const u = Math.min(Math.max(x, 0), PUSH.L) / PUSH.L; return PUSH.F0 * PUSH.L * (u + u * u / 2 - 2 * u ** 3 / 3); };
export const pushStrips = n => { const dx = PUSH.L / n; let s = 0; for (let i = 0; i < n; i++) s += pushF((i + 0.5) * dx) * dx; return s; };   // midpoint sum of n strips
PUSH.W = pushW(PUSH.L);                                          // 40 J
PUSH.Fmax = pushF(PUSH.L / 4);
PUSH.tL = timeUntil(x => pushF(x) / PUSH.m, 0, 0, x => x - PUSH.L);
const pushTab = rk4Table(x => pushF(x) / PUSH.m, 0, 0, PUSH.tL, 4000);
PUSH.vf = pushTab.end.v;
PUSH.run = PUSH.tL + PUSH.coast / PUSH.vf;
export function push(t) {
  let x, v;
  if (t < PUSH.tL) ({ x, v } = pushTab.sample(t));
  else { v = PUSH.vf; x = pushTab.end.x + v * (t - PUSH.tL); }
  return { x, v, F: pushF(x), W: pushW(x), K: 0.5 * PUSH.m * v * v };
}

// ---------- force from potential energy (Physics C): a 0.20 kg bead on a smooth wavy wire ----------
// x is measured ALONG the wire, so the motion is one-dimensional: U(x) = mg h(x), and the force
// along the wire is F = −dU/dx = −mg h'(x) (the wire's push is across it and does no work).
export const BEAD = { m: 0.20, x0: 0.8, len: 6.0, valley: [1.8, 0.9, 0.9], hump: [3.8, 0.5, 0.55], h0: 1.2 };
const gauss = (x, [c, a, w]) => a * Math.exp(-(((x - c) / w) ** 2));
const gauss1 = (x, [c, a, w]) => -2 * (x - c) / (w * w) * gauss(x, [c, a, w]);
const gauss2 = (x, [c, a, w]) => (4 * (x - c) ** 2 / w ** 4 - 2 / (w * w)) * gauss(x, [c, a, w]);
export const beadH = x => BEAD.h0 - gauss(x, BEAD.valley) + gauss(x, BEAD.hump);       // height of the wire (m)
export const beadH1 = x => -gauss1(x, BEAD.valley) + gauss1(x, BEAD.hump);              // dh/dx along the wire = sin(tilt)
export const beadH2 = x => -gauss2(x, BEAD.valley) + gauss2(x, BEAD.hump);
export const beadU = x => BEAD.m * G * beadH(x);
export const beadF = x => -BEAD.m * G * beadH1(x);
// the wire's shape in the plane: horizontal run X(x) = ∫ √(1 − h'²) dx, height h(x)
const WIRE_N = 3000, wireX = (() => { const a = new Float64Array(WIRE_N + 1), d = BEAD.len / WIRE_N; for (let i = 1; i <= WIRE_N; i++) { const s = (i - 0.5) * d; a[i] = a[i - 1] + Math.sqrt(1 - beadH1(s) ** 2) * d; } return a; })();
export function wirePoint(x) { const u = Math.min(Math.max(x / BEAD.len, 0), 1) * WIRE_N, i = Math.min(Math.floor(u), WIRE_N - 1), f = u - i; return [wireX[i] + (wireX[i + 1] - wireX[i]) * f, beadH(x)]; }
BEAD.span = wireX[WIRE_N];                                                          // horizontal span of the wire
BEAD.E = beadU(BEAD.x0);
BEAD.stable = bisect(beadH1, 1.2, 2.6);                                                // h' = 0 at the valley floor
BEAD.unstable = bisect(beadH1, 3.3, 4.4);                                              // and at the hump top
BEAD.neutral = 5.5;                                                                   // the flat stretch on the right
BEAD.x1 = bisect(x => beadU(x) - BEAD.E, BEAD.stable, BEAD.unstable);                    // right turning point
BEAD.period = 2 * timeUntil(x => -G * beadH1(x), BEAD.x0, 0, (x, v) => -v, 1e-4);      // there and back: twice the time to the far turn
const beadTab = rk4Table(x => -G * beadH1(x), BEAD.x0, 0, BEAD.period, 6000);
export function bead(t) {
  const { x, v } = beadTab.sample(((t % BEAD.period) + BEAD.period) % BEAD.period);
  return { x, v, U: beadU(x), K: 0.5 * BEAD.m * v * v, F: beadF(x), slope: BEAD.m * G * beadH1(x) };
}

// ---------- energy curves and equilibrium (Physics C): two atoms held by a bond ----------
// A light atom (1 u) bound to a much heavier one, which stays put. Lennard-Jones model:
// U(r) = ε[(r0/r)¹² − 2(r0/r)⁶], minimum −ε at r0. Classical motion, real SI units.
export const EV = 1.602e-19, AMU = 1.661e-27;
export const BOND = { eps: 1.0 * EV, r0: 0.15e-9, m: 1.0 * AMU, Efrac: -0.6, show: 2.4 };   // show: seconds per vibration on screen
BOND.E = BOND.Efrac * BOND.eps;
export const bondU = r => { const a6 = (BOND.r0 / r) ** 6; return BOND.eps * (a6 * a6 - 2 * a6); };
export const bondF = r => { const a = BOND.r0 / r, a6 = a ** 6; return 12 * BOND.eps / BOND.r0 * (a6 * a6 * a - a6 * a); };
BOND.k = 72 * BOND.eps / BOND.r0 ** 2;                                              // U''(r0), the bond's spring constant
BOND.w = Math.sqrt(BOND.k / BOND.m);
// turning points in closed form: U = E ⇒ (r0/r)⁶ = 1 ± √(1 + E/ε)
export const bondTurns = E => { const q = Math.sqrt(1 + E / BOND.eps); return [BOND.r0 / (1 + q) ** (1 / 6), BOND.r0 / (1 - q) ** (1 / 6)]; };
[BOND.r1, BOND.r2] = bondTurns(BOND.E);
export const bondPeriod = E => { const [r1] = bondTurns(E), tScale = 2 * Math.PI / BOND.w; return 2 * timeUntil(r => bondF(r) / BOND.m, r1, 0, (r, v) => -v, tScale / 4000, tScale * 10); };
BOND.period = bondPeriod(BOND.E);
BOND.tscale = BOND.period / BOND.show;                                             // real seconds per second on screen
const bondTab = rk4Table(r => bondF(r) / BOND.m, BOND.r1, 0, BOND.period, 6000);
export function bond(t) {
  const { x: r, v } = bondTab.sample(((t % BOND.period) + BOND.period) % BOND.period);
  return { r, v, U: bondU(r), K: 0.5 * BOND.m * v * v, F: bondF(r) };
}
