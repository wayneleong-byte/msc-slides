// Rotation model: a wheel, a merry-go-round, three doors, a plank, a ladder, three shapes,
// a race down a ramp, a well bucket and a skater. Pure functions, SI units, angles in radians
// (counter-clockwise positive). Every motion, arrow and number on the page comes from here.

export const G = 9.80;          // m/s²
export const SLOW = 0.6;        // everything shown at 0.6× speed
export const REST = 0.8;        // pause between repeats, s
export const loop = (clock, run) => { const c = (clock * SLOW) % (run + REST); return { t: Math.min(c, run), resting: c > run }; };
const deg = d => d * Math.PI / 180;

// ---------- constant α: speed up from rest for tUp, then brake at the same rate back to rest ----------
// the angular twin of a car pulling away and stopping: ω = ω0 + αt, Δθ = ω0 t + ½αt²
export function spin(t, { alpha, tUp }) {
  const wm = alpha * tUp;
  if (t <= 0) return { th: 0, w: 0, a: 0 };
  if (t < tUp) return { th: 0.5 * alpha * t * t, w: alpha * t, a: alpha };
  const s = Math.min(t - tUp, tUp);
  if (t >= 2 * tUp) return { th: alpha * tUp * tUp, w: 0, a: 0 };
  return { th: 0.5 * alpha * tUp * tUp + wm * s - 0.5 * alpha * s * s, w: wm - alpha * s, a: -alpha };
}

// 1 · a bicycle wheel
export const WHEEL = { R: 0.6, alpha: 1.5, tUp: 2.4 };
WHEEL.run = 2 * WHEEL.tUp;
WHEEL.wMax = WHEEL.alpha * WHEEL.tUp;                  // 3.6 rad/s
WHEEL.thTot = WHEEL.alpha * WHEEL.tUp ** 2;            // 8.64 rad
export const wheel = t => spin(t, WHEEL);

// 2 · a merry-go-round with a child near the middle and one at the edge
export const DISC = { R: 1.5, r1: 0.6, r2: 1.2, alpha: 0.8, tUp: 2.5 };
DISC.run = 2 * DISC.tUp;
DISC.wMax = DISC.alpha * DISC.tUp;                     // 2.0 rad/s
export const disc = t => spin(t, DISC);
// a point at radius r: v = rω, a_t = rα, a_c = rω²
export const pointAt = (r, s) => ({ v: r * s.w, at: r * s.a, ac: r * s.w * s.w, a: Math.hypot(r * s.a, r * s.w * s.w) });

// 3 · torque: three identical doors, the same push in three ways. τ = rF sin φ, α = τ / I
export const DOOR = { M: 12, W: 0.9, F: 10 };
DOOR.I = DOOR.M * DOOR.W ** 2 / 3;                     // thin slab about its hinge: ⅓MW²
DOOR.cases = [
  { r: 0.85, phi: 90, name: 'at the handle, square on' },
  { r: 0.425, phi: 90, name: 'halfway, square on' },
  { r: 0.85, phi: 30, name: 'at the handle, at 30°' },
].map(c => ({ ...c, tau: c.r * DOOR.F * Math.sin(deg(c.phi)), arm: c.r * Math.sin(deg(c.phi)) }));
DOOR.cases.forEach(c => { c.alpha = c.tau / DOOR.I; c.tOpen = Math.sqrt(2 * (Math.PI / 2) / c.alpha); });
DOOR.run = Math.max(...DOOR.cases.map(c => c.tOpen));
export const torque = (r, F, phiDeg) => r * F * Math.sin(deg(phiDeg));
// each door turns from closed with constant α until it is wide open (90°), then waits
export const door = (c, t) => { const th = Math.min(0.5 * c.alpha * t * t, Math.PI / 2); return { th, w: th < Math.PI / 2 ? c.alpha * t : 0, open: th >= Math.PI / 2 }; };

// 4 · static equilibrium: a plank bridge on two supports, A at x = 0 and B at x = L, a crate on it
export const PLANK = { L: 4.0, M: 20, m: 30 };         // plank, crate (kg)
PLANK.Wp = PLANK.M * G; PLANK.Wc = PLANK.m * G;
// Στ about A = 0:  L·F_B − (L/2)·Mg − x·mg = 0 ;  ΣF = 0:  F_A + F_B = (M + m) g
export function plank(x) {
  const FB = (PLANK.L / 2 * PLANK.Wp + x * PLANK.Wc) / PLANK.L;
  return { x, FA: PLANK.Wp + PLANK.Wc - FB, FB };
}
export const PLANK_PERIOD = 10;                         // the crate slides slowly end to end and back
export const crateX = t => PLANK.L / 2 - 1.6 * Math.cos(2 * Math.PI * t / PLANK_PERIOD);

// 5 · a ladder against a smooth wall (μ = 0 there), rough floor μs. Pivot at the foot O:
// Στ_O = 0:  (L sin θ)·F_w − (L/2 cos θ)·mg = 0  →  F_w = mg / (2 tan θ) ;  f = F_w, F_N = mg
export const LADDER = { L: 3.0, m: 20, muS: 0.40 };
LADDER.W = LADDER.m * G;
LADDER.thMin = Math.atan(1 / (2 * LADDER.muS));       // 51.3°
export const ladder = th => { const Fw = LADDER.W / (2 * Math.tan(th)); return { th, Fw, f: Fw, FN: LADDER.W, fMax: LADDER.muS * LADDER.W }; };
export const LADDER_PERIOD = 12;                        // θ sweeps 80° down to 54° and back
export const ladderAngle = t => deg(67 + 13 * Math.cos(2 * Math.PI * t / LADDER_PERIOD));

// 6 · τ = Iα: a ring, a disc and a solid sphere, same mass and radius, the same pull on a string
export const SHAPES = { M: 2.0, R: 0.4, F: 1.0, run: 2.4 };
SHAPES.tau = SHAPES.F * SHAPES.R;                       // 0.40 N·m
SHAPES.list = [{ key: 'ring', f: 1, frac: '1' }, { key: 'disc', f: 0.5, frac: '½' }, { key: 'sphere', f: 0.4, frac: '⅖' }]
  .map(s => ({ ...s, I: s.f * SHAPES.M * SHAPES.R ** 2 }));
SHAPES.list.forEach(s => { s.alpha = SHAPES.tau / s.I; });
export const shapeSpin = (s, t) => ({ th: 0.5 * s.alpha * t * t, w: s.alpha * t, a: s.alpha });
// I = Σ m r²: a disc cut into n thin rings of equal width
export const discAsRings = n => Array.from({ length: n }, (_, k) => {
  const r0 = SHAPES.R * k / n, r1 = SHAPES.R * (k + 1) / n, m = SHAPES.M * (r1 * r1 - r0 * r0) / SHAPES.R ** 2;
  return { r0, r1, m, I: 0.5 * m * (r0 * r0 + r1 * r1) };
});

// 7 · the race: from rest down a 25° ramp, rolling without slipping. Energy: mgh = ½mv² + ½Iω²,
// ω = v/R, I = fMR²  →  v² = 2gh/(1+f) and a = g sin θ / (1+f). The box slides on ice (f = 0).
export const RACE = { theta: deg(25), len: 3.0, R: 0.2, m: 1.0 };
RACE.h = RACE.len * Math.sin(RACE.theta);
RACE.list = [{ key: 'box', f: 0, name: 'sliding box' }, { key: 'sphere', f: 0.4, name: 'solid sphere' }, { key: 'disc', f: 0.5, name: 'disc' }, { key: 'ring', f: 1, name: 'ring' }]
  .map(o => ({ ...o, a: G * Math.sin(RACE.theta) / (1 + o.f) }));
RACE.list.forEach(o => { o.T = Math.sqrt(2 * RACE.len / o.a); o.vEnd = o.a * o.T; });
RACE.run = Math.max(...RACE.list.map(o => o.T));
export const race = (o, t) => { const tt = Math.min(t, o.T); const s = 0.5 * o.a * tt * tt, v = o.a * tt; return { s, v, w: o.f ? v / RACE.R : 0, th: o.f ? s / RACE.R : 0, done: t >= o.T }; };
export const energy = (o, v) => ({ Kt: 0.5 * RACE.m * v * v, Kr: 0.5 * o.f * RACE.m * RACE.R ** 2 * (v / RACE.R) ** 2 });

// 8 · a bucket lowered from a well's winding drum (a solid cylinder, I = ½MR²), rope unwinding.
// Bucket: mg − T = ma.  Drum: rT = Iα = ½MR²(a/r)  →  T = ½Ma,  a = mg / (m + ½M)
export const WELL = { M: 8.0, R: 0.25, m: 2.0, h: 2.0 };
WELL.a = WELL.m * G / (WELL.m + WELL.M / 2);           // 3.27 m/s²
WELL.T = 0.5 * WELL.M * WELL.a;                         // 13.07 N
WELL.alpha = WELL.a / WELL.R;
WELL.run = Math.sqrt(2 * WELL.h / WELL.a);
export const well = t => { const tt = Math.min(t, WELL.run); return { y: 0.5 * WELL.a * tt * tt, v: WELL.a * tt, th: 0.5 * WELL.a * tt * tt / WELL.R, w: WELL.alpha * tt }; };

// 9 · a skater pulls in two 2.0 kg hand weights. No outside torque, so L = Iω stays the same.
// I = I_body + 2 m r². The arms swing from out sideways (r = 0.80 m) to straight up (r = 0.18 m).
export const SKATE = { Ib: 1.0, m: 2.0, shoulder: 0.18, arm: 0.62, w0: 1.5 };
SKATE.rOut = SKATE.shoulder + SKATE.arm;               // 0.80 m
SKATE.rIn = SKATE.shoulder;                             // hands overhead, on the shoulder line
export const inertia = r => SKATE.Ib + 2 * SKATE.m * r * r;
SKATE.L = inertia(SKATE.rOut) * SKATE.w0;
// arm angle above horizontal, φ: out, then up, then out again
const SK = { out: 1.4, move: 1.2, up: 2.4 };
SKATE.run = 2 * SK.out + 2 * SK.move + SK.up;
const ss = u => (u = Math.min(Math.max(u, 0), 1), u * u * (3 - 2 * u));
export function armAngle(t) {
  const t1 = SK.out, t2 = t1 + SK.move, t3 = t2 + SK.up, t4 = t3 + SK.move;
  const up = t < t1 ? 0 : t < t2 ? ss((t - t1) / SK.move) : t < t3 ? 1 : t < t4 ? 1 - ss((t - t3) / SK.move) : 0;
  return up * Math.PI / 2;
}
export const handR = t => SKATE.shoulder + SKATE.arm * Math.cos(armAngle(t));
export const skaterW = t => SKATE.L / inertia(handR(t));
// θ(t) = ∫ω dt, tabulated once (Simpson's rule) and read back by interpolation
const NT = 2000, dT = SKATE.run / NT, TH = new Float64Array(NT + 1);
for (let i = 0; i < NT; i++) { const a = i * dT; TH[i + 1] = TH[i] + dT / 6 * (skaterW(a) + 4 * skaterW(a + dT / 2) + skaterW(a + dT)); }
export function skater(t) {
  const u = Math.min(Math.max(t / dT, 0), NT), i = Math.min(Math.floor(u), NT - 1), f = u - i;
  const r = handR(t), I = inertia(r), w = SKATE.L / I;
  return { th: TH[i] + (TH[i + 1] - TH[i]) * f, w, r, I, L: I * w, K: 0.5 * I * w * w, phi: armAngle(t) };
}

// ================= additions: work and power, I by integration, parallel axes, rolling with slipping,
// angular impulse, L of a particle =================

// 6b · I = ∫ r² dm for a uniform rod (mass M, length L, λ = M/L) and a disc built from rings
export const ROD = { M: 1.5, L: 1.2, N: 10 };
ROD.lam = ROD.M / ROD.L;
ROD.Icm = ROD.M * ROD.L ** 2 / 12;                      // ∫_{−L/2}^{L/2} λx² dx
ROD.Iend = ROD.M * ROD.L ** 2 / 3;                      // ∫_0^L λx² dx
// I of the rod about a perpendicular axis through x = a (a measured from the rod's centre), exact
export const rodI = a => ROD.lam * (((ROD.L / 2 - a) ** 3) - ((-ROD.L / 2 - a) ** 3)) / 3;
// Σ r² Δm with n slices, each slice's mass at its middle: the integral as a sum
export const rodSum = (n, a) => Array.from({ length: n }, (_, k) => { const x = -ROD.L / 2 + ROD.L * (k + 0.5) / n; return ROD.M / n * (x - a) ** 2; }).reduce((s, v) => s + v, 0);
// the highlighted slice dm walks along the rod, one slice each SLICE_T seconds
ROD.sliceT = 0.5;
export const sliceAt = t => Math.floor(t / ROD.sliceT) % ROD.N;

// 6c · parallel axes: two equal rods, the same push F square to each at 0.6 m from its pin.
// One pinned at its centre, one at its end: I_end = I_cm + M(L/2)² = 4 I_cm, so α is four times smaller.
export const PAX = { F: 0.5, r: 0.6, run: 2.4 };
PAX.tau = PAX.F * PAX.r;                                 // 0.30 N·m
PAX.list = [{ key: 'centre', d: 0, I: ROD.Icm }, { key: 'end', d: ROD.L / 2, I: ROD.Icm + ROD.M * (ROD.L / 2) ** 2 }];
PAX.list.forEach(p => { p.alpha = PAX.tau / p.I; });
export const paxSpin = (p, t) => ({ th: 0.5 * p.alpha * t * t, w: p.alpha * t });

// 6d · work and power: a wheel wrench on a nut, a steady push square to the handle.
// The thread's friction holds ω steady, so each stroke W = τΔθ goes to heat; P = τω.
export const WRENCH = { r: 0.40, F: 50, w: 1.5, stroke: 2 * Math.PI / 3 };
WRENCH.tau = WRENCH.r * WRENCH.F;                        // 20 N·m
WRENCH.tStroke = WRENCH.stroke / WRENCH.w;               // 1.40 s
WRENCH.run = WRENCH.tStroke + 0.4;
WRENCH.P = WRENCH.tau * WRENCH.w;                        // 30 W
export const wrench = t => { const tt = Math.min(Math.max(t, 0), WRENCH.tStroke), th = WRENCH.w * tt, on = t < WRENCH.tStroke;
  return { th, w: on ? WRENCH.w : 0, s: WRENCH.r * th, W: WRENCH.tau * th, P: on ? WRENCH.P : 0, on }; };

// 7b · a bowling ball launched sliding (v0, ω = 0). Kinetic friction μk·mg acts backward at the contact:
// a = −μk g,  α = fR/I = 5μk g / (2R). It rolls once v = Rω: t* = 2v0/(7μk g), then v = 5v0/7 and f = 0.
export const BOWL = { m: 7.0, R: 0.11, v0: 2.4, muK: 0.2, run: 1.1 };
BOWL.I = 0.4 * BOWL.m * BOWL.R ** 2;
BOWL.f = BOWL.muK * BOWL.m * G;
BOWL.a = BOWL.muK * G;
BOWL.alpha = BOWL.f * BOWL.R / BOWL.I;
BOWL.tStar = 2 * BOWL.v0 / (7 * BOWL.muK * G);
BOWL.vf = BOWL.v0 - BOWL.a * BOWL.tStar;                 // = 5v0/7
BOWL.xStar = BOWL.v0 * BOWL.tStar - 0.5 * BOWL.a * BOWL.tStar ** 2;
export function bowl(t) {
  const ts = Math.min(Math.max(t, 0), BOWL.tStar);
  const v0 = BOWL.v0 - BOWL.a * ts, w0 = BOWL.alpha * ts, x0 = BOWL.v0 * ts - 0.5 * BOWL.a * ts * ts, th0 = 0.5 * BOWL.alpha * ts * ts;
  const r = Math.max(t - BOWL.tStar, 0);
  const x = x0 + v0 * r, th = th0 + w0 * r, slip = t < BOWL.tStar;
  return { x, th, v: v0, w: w0, slip, f: slip ? BOWL.f : 0, vSlip: v0 - BOWL.R * w0, K: 0.5 * BOWL.m * v0 * v0 + 0.5 * BOWL.I * w0 * w0 };
}

// 8b · angular impulse: two equal merry-go-rounds, a hard short push and a gentle long one, same τΔt.
export const IMP = { M: 150, R: 1.2, run: 3.0 };
IMP.I = 0.5 * IMP.M * IMP.R ** 2;                        // 108 kg·m²
IMP.list = [{ key: 'A', F: 200, dt: 0.6 }, { key: 'B', F: 80, dt: 1.5 }].map(p => ({ ...p, tau: p.F * IMP.R }));
IMP.list.forEach(p => { p.J = p.tau * p.dt; p.wf = p.J / IMP.I; });
export const imp = (p, t) => { const tt = Math.min(Math.max(t, 0), p.dt), al = p.tau / IMP.I, r = Math.max(t - p.dt, 0);
  const w = al * tt; return { th: 0.5 * al * tt * tt + w * r, w, L: IMP.I * w, tau: t < p.dt ? p.tau : 0, pushing: t < p.dt }; };

// 9b · L = r × p for a point particle: a ball slides in a straight line past a pin O, then hits a rod
// pinned at O (elastic). About O, L of the ball is m v r⊥ with r⊥ = d the whole way in.
// L: m v0 d = m v1 d + Iω ;  K: ½mv0² = ½mv1² + ½Iω²
export const HIT = { m: 0.3, v0: 3.0, d: 1.0, M: 1.0, L: 1.2, z0: 1.4, rb: 0.08, rodW: 0.03 };
HIT.I = HIT.M * HIT.L ** 2 / 3;
HIT.mEff = HIT.I / HIT.d ** 2;
HIT.v1 = (HIT.m - HIT.mEff) / (HIT.m + HIT.mEff) * HIT.v0;   // negative: it bounces back
HIT.w = 2 * HIT.m * HIT.v0 * HIT.d / (HIT.I + HIT.m * HIT.d ** 2);
HIT.zc = HIT.rb + HIT.rodW;                              // ball centre's z when it touches the rod
HIT.tHit = (HIT.z0 - HIT.zc) / HIT.v0;
HIT.run = HIT.tHit + 1.6;
// ball moves along −z at x = d (relative to O); vz < 0 before. L_y = z p_x − x p_z = −d·m·vz
export function hit(t) {
  const before = t < HIT.tHit, vz = before ? -HIT.v0 : -HIT.v1;
  const z = before ? HIT.z0 - HIT.v0 * t : HIT.zc + vz * (t - HIT.tHit);
  const th = before ? 0 : HIT.w * (t - HIT.tHit);
  const Lb = -HIT.d * HIT.m * vz, Lr = before ? 0 : HIT.I * HIT.w;
  return { x: HIT.d, z, vz, th, w: before ? 0 : HIT.w, Lb, Lr, L: Lb + Lr, r: Math.hypot(HIT.d, z), before };
}
