// Electromagnetic induction model: a bar magnet and a loop, Lenz's four cases, two coils and an
// iron core, a loop leaving a wire, motional emf in a bar, a loop and a bar on rails, a solenoid's
// inductance and an RL circuit. Pure functions, SI units. Every motion, arrow and number on the
// page comes from here.

export const MU0 = 4 * Math.PI * 1e-7;          // T·m/A
export const SLOW = 1;
export const REST = 0.8;
export const loop = (clock, run) => { const c = (clock * SLOW) % (run + REST); return { t: Math.min(c, run), resting: c > run }; };
const wave = (t, T) => (1 - Math.cos(2 * Math.PI * t / T)) / 2;          // 0 → 1 → 0 over T
const dwave = (t, T) => Math.PI / T * Math.sin(2 * Math.PI * t / T);      // its time derivative
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

// ---------- a bar magnet: outside it, the field of two poles ±p a length apart ----------
// A pole of strength q (A·m) makes B = μ₀q r̂ / 4πr², like a point charge's field. The magnet lies on
// the x axis with its N pole at xN and its S pole at xS.
export const MAG = { p: 100, len: 0.10, w: 0.02 };
export function magnetB([x, y, z], xN, xS, p = MAG.p) {
  const out = [0, 0, 0];
  for (const [q, x0] of [[p, xN], [-p, xS]]) {
    const dx = x - x0, r2 = dx * dx + y * y + z * z, k = MU0 * q / (4 * Math.PI * r2 ** 1.5);
    out[0] += k * dx; out[1] += k * y; out[2] += k * z;
  }
  return out;
}
// flux of one pole (strength q at x = xP on the axis) through a disc of radius a at x = 0, with the
// area vector pointing along −x (away from a magnet on the +x side):
//   Φ = ∫ B·dA = (μ₀q/4π) xP ∫₀^a 2πρ dρ / (xP² + ρ²)^{3/2} = (μ₀q/2)(sgn xP − xP/√(xP² + a²))
export const poleFlux = (q, xP, a) => MU0 * q / 2 * (Math.sign(xP) - xP / Math.hypot(xP, a));
const poleFluxD = (q, xP, a) => -MU0 * q / 2 * a * a / (xP * xP + a * a) ** 1.5;   // dΦ/dxP
export const magnetFlux = (xN, xS, a, p = MAG.p) => poleFlux(p, xN, a) + poleFlux(-p, xS, a);
export const magnetFluxRate = (xN, xS, vx, a, p = MAG.p) => (poleFluxD(p, xN, a) + poleFluxD(-p, xS, a)) * vx;
// the same flux by brute force: B·n over a polar grid on the disc, n = −x
export function magnetFluxNumeric(xN, xS, a, n = 400, m = 48) {
  let F = 0;
  for (let i = 0; i < n; i++) {
    const r = (i + 0.5) * a / n, dA = 2 * Math.PI * r * (a / n) / m;
    for (let j = 0; j < m; j++) { const t = 2 * Math.PI * (j + 0.5) / m; F += -magnetB([0, r * Math.cos(t), r * Math.sin(t)], xN, xS)[0] * dA; }
  }
  return F;
}
// trace a field line from p along B (RK4 on the unit direction) until stop(p) or max steps
export function traceLine(Bfn, p, { step = 0.003, max = 900, stop = () => false, dir = 1 } = {}) {
  const u = q => { const b = Bfn(q), n = Math.hypot(...b) || 1; return b.map(c => dir * c / n); };
  const pts = [p.slice()]; let q = p.slice();
  for (let i = 0; i < max; i++) {
    const k1 = u(q), k2 = u(q.map((c, j) => c + k1[j] * step / 2)), k3 = u(q.map((c, j) => c + k2[j] * step / 2)), k4 = u(q.map((c, j) => c + k3[j] * step));
    q = q.map((c, j) => c + step / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    pts.push(q.slice());
    if (stop(q)) break;
  }
  return pts;
}

// ---------- page 0: the magnet slides toward a loop (radius 5 cm) and back, N pole first ----------
export const FLUX = { a: 0.05, dMin: 0.02, dMax: 0.28, T: 6, R: 0.01 };   // R: the copper loop, 10 mΩ
export function fluxScene(t) {
  const { a, dMin, dMax, T } = FLUX;
  const d = dMax - (dMax - dMin) * wave(t, T), v = -(dMax - dMin) * dwave(t, T);
  const xN = d, xS = d + MAG.len;
  const Phi = magnetFlux(xN, xS, a), rate = magnetFluxRate(xN, xS, v, a), emf = -rate;
  return { d, v, xN, xS, Phi, rate, emf, I: emf / FLUX.R, Bc: -magnetB([0, 0, 0], xN, xS)[0] };
}

// ---------- page 1: Lenz's law, four cases. A pole approaches from 25 cm to 3 cm, or leaves ----------
export const LENZ = { a: 0.05, near: 0.03, far: 0.25, run: 2.6, R: 0.01 };
LENZ.v = (LENZ.far - LENZ.near) / LENZ.run;
export const CASES = [
  { key: 'nIn', pole: 'N', move: 'in', name: 'N pole approaching' },
  { key: 'nOut', pole: 'N', move: 'out', name: 'N pole leaving' },
  { key: 'sIn', pole: 'S', move: 'in', name: 'S pole approaching' },
  { key: 'sOut', pole: 'S', move: 'out', name: 'S pole leaving' },
];
// area vector along −x (away from the magnet). Φ > 0 means B points along −x through the loop.
export function lenzCase(c, t) {
  const { a, near, far, run } = LENZ, u = clamp(t / run, 0, 1);
  const d = c.move === 'in' ? far - (far - near) * u : near + (far - near) * u;
  const v = t < run ? (c.move === 'in' ? -LENZ.v : LENZ.v) : 0;
  const [xN, xS] = c.pole === 'N' ? [d, d + MAG.len] : [d + MAG.len, d];
  const Phi = magnetFlux(xN, xS, a), emf = -magnetFluxRate(xN, xS, v, a);
  return { d, v, xN, xS, Phi, emf, I: emf / LENZ.R, Bx: magnetB([0, 0, 0], xN, xS)[0] };
}

// ---------- page 2a: two flat 100-turn coils, radius 5 cm, 5 cm apart, on one axis ----------
// one circular turn of radius a in the plane x = x0, current I circulating right-handed about +x
export function ringB([x, y, z], a, x0, I, n = 360) {
  const out = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const t = 2 * Math.PI * (i + 0.5) / n, dt = 2 * Math.PI / n;
    const s = [x0, a * Math.cos(t), a * Math.sin(t)], dl = [0, -a * Math.sin(t) * dt, a * Math.cos(t) * dt];
    const r = [x - s[0], y - s[1], z - s[2]], r3 = Math.hypot(...r) ** 3;
    out[0] += (dl[1] * r[2] - dl[2] * r[1]) / r3; out[1] += (dl[2] * r[0] - dl[0] * r[2]) / r3; out[2] += (dl[0] * r[1] - dl[1] * r[0]) / r3;
  }
  return out.map(c => MU0 * I / (4 * Math.PI) * c);
}
export const ringAxisB = (a, z, I) => MU0 * I * a * a / (2 * (a * a + z * z) ** 1.5);
export const COILS = { a: 0.05, sep: 0.05, N1: 100, N2: 100, I0: 2, T: 6, R2: 1 };
// mutual inductance of one turn on another, two ways: the flux of turn 1 through turn 2's disc
// (Biot–Savart, then ∫B·dA), and Neumann's double line integral (μ₀/4π)∮∮ dl₁·dl₂ / r
export function mutualFlux(a = COILS.a, sep = COILS.sep, n = 200) {
  let F = 0;
  for (let i = 0; i < n; i++) { const r = (i + 0.5) * a / n; F += ringB([sep, r, 0], a, 0, 1)[0] * 2 * Math.PI * r * a / n; }
  return F;                                      // Wb per ampere = H
}
export function mutualNeumann(a = COILS.a, sep = COILS.sep, n = 400) {
  let s = 0; const d = 2 * Math.PI / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const ti = (i + 0.5) * d, tj = (j + 0.5) * d;
    s += a * a * Math.cos(ti - tj) * d * d / Math.sqrt(sep * sep + 2 * a * a * (1 - Math.cos(ti - tj)));
  }
  return MU0 / (4 * Math.PI) * s;
}
COILS.M1 = mutualNeumann();                     // one turn on one turn
COILS.M = COILS.N1 * COILS.N2 * COILS.M1;       // the coils
export function coilsScene(t) {
  const { I0, T, M, N2, R2 } = COILS;
  const I1 = I0 * wave(t, T), dI1 = I0 * dwave(t, T);
  const Phi2 = M * I1 / N2, emf = -M * dI1;      // flux through one turn of coil 2, its emf
  return { I1, dI1, Phi2, emf, I2: emf / R2, B1: COILS.N1 * ringAxisB(COILS.a, COILS.sep, I1) };
}

// ---------- page 2b: two windings on an iron rod (30 cm long, 1.5 cm radius) ----------
// all the flux stays in the iron: B = μᵣμ₀N₁I₁/ℓ through every turn of both windings
export const CORE = { len: 0.30, r: 0.015, muR: 1000, N1: 200, N2: 100, I0: 0.5, T: 6, R2: 5 };
CORE.A = Math.PI * CORE.r ** 2;
CORE.M = CORE.muR * MU0 * CORE.N1 * CORE.N2 * CORE.A / CORE.len;
CORE.L1 = CORE.muR * MU0 * CORE.N1 ** 2 * CORE.A / CORE.len;
CORE.L2 = CORE.muR * MU0 * CORE.N2 ** 2 * CORE.A / CORE.len;
export function coreScene(t) {
  const { I0, T, muR, N1, N2, len, A } = CORE;
  const I1 = I0 * wave(t, T), dI1 = I0 * dwave(t, T);
  const B = muR * MU0 * N1 * I1 / len, dB = muR * MU0 * N1 * dI1 / len;
  const emf2 = -N2 * A * dB, emf1 = -N1 * A * dB;
  return { I1, dI1, B, Phi: B * A, emf2, emf1, I2: emf2 / CORE.R2, Bair: B / muR };
}

// ---------- page 3: a rectangular loop (10 cm × 6 cm) moving away from a long wire carrying 50 A ----------
export const WIRE = { I: 50, b: 0.10, a: 0.06, r0: 0.02, v: 0.05, run: 3, R: 0.01 };
export const wireB = r => MU0 * WIRE.I / (2 * Math.PI * r);
// Φ = ∫_r^{r+a} B(s) b ds = (μ₀Ib/2π) ln((r + a)/r), area vector into the page (along B)
export const wireFlux = r => MU0 * WIRE.I * WIRE.b / (2 * Math.PI) * Math.log((r + WIRE.a) / r);
export function wireFluxNumeric(r, n = 2000) { let F = 0; const h = WIRE.a / n; for (let i = 0; i < n; i++) F += wireB(r + (i + 0.5) * h) * WIRE.b * h; return F; }
export function wireScene(t) {
  const { v, r0, a, b } = WIRE, r = r0 + v * t, moving = t < WIRE.run;
  // −dΦ/dt: the near side (in the stronger field) minus the far side, each Bbv
  const emf = moving ? b * v * (wireB(r) - wireB(r + a)) : 0;
  return { r, Phi: wireFlux(r), emf, I: emf / WIRE.R, Bnear: wireB(r), Bfar: wireB(r + a) };
}

// ---------- page 4: a 50 cm metal bar moving at 0.5 m/s through 0.4 T, into the page ----------
export const BAR = { B: 0.4, L: 0.5, v: 0.5, x0: 0.1, x1: 0.9, span: 1.0 };
BAR.run = (BAR.x1 - BAR.x0) / BAR.v;
BAR.emf = BAR.B * BAR.L * BAR.v;                  // 0.1 V
BAR.E = BAR.v * BAR.B;                            // the field the separated charges set up, 0.2 V/m
export const E_CHARGE = 1.60e-19;
export function barScene(t, resting) {
  const v = resting ? 0 : BAR.v;
  return { x: BAR.x0 + BAR.v * t, v, emf: BAR.B * BAR.L * v, E: v * BAR.B, Fmag: E_CHARGE * v * BAR.B };
}

// ---------- page 5: a 30 × 25 cm loop crossing a 60 cm wide field region at 0.5 m/s ----------
export const CROSS = { B: 0.4, W: 0.6, w: 0.3, h: 0.25, v: 0.5, start: -0.05, R: 0.5 };
CROSS.run = (CROSS.W + CROSS.w + 0.1) / CROSS.v;
export const overlap = lead => clamp(Math.min(lead, CROSS.W) - Math.max(lead - CROSS.w, 0), 0, CROSS.w);
export function crossScene(t) {
  const { B, h, v, start, w, W } = CROSS, lead = start + v * t, moving = t < CROSS.run;
  const inLead = lead > 0 && lead < W, inTrail = lead - w > 0 && lead - w < W;
  // area vector into the page (along B). Each vertical side inside the field carries BLv;
  // around the loop the leading side's counts against the trailing side's
  const emf = moving ? -B * h * v * ((inLead ? 1 : 0) - (inTrail ? 1 : 0)) : 0;
  return { lead, Phi: B * h * overlap(lead), emf, I: emf / CROSS.R, inLead, inTrail, sideEmf: B * h * v };
}

// ---------- page 6: a 0.2 kg bar on rails 40 cm apart, closed by a 0.2 Ω resistor ----------
// m dv/dt = −ILB = −B²L²v/R, so v = v₀ e^{−t/τ} with τ = mR/B²L²
export const RAIL = { B: 0.5, L: 0.4, R: 0.2, m: 0.2, v0: 1.0, x0: 0.25, run: 5, len: 1.45 };
RAIL.tau = RAIL.m * RAIL.R / (RAIL.B * RAIL.L) ** 2;      // 1.0 s
export function railScene(t) {
  const { B, L, R, m, v0, x0, tau } = RAIL, e = Math.exp(-t / tau);
  const v = v0 * e, x = x0 + v0 * tau * (1 - e), emf = B * L * v, I = emf / R, F = I * L * B;
  return { v, x, emf, I, F, a: -F / m, P: I * I * R, Phi: B * L * x, heat: 0.5 * m * (v0 * v0 - v * v), K: 0.5 * m * v * v };
}

// ---------- page 7: a solenoid, 400 turns on 24 cm, radius 3 cm; the current ramps up, holds, ramps down ----------
export const SOL = { N: 400, len: 0.24, r: 0.03, Imax: 2, ramp: 1, hold: 1 };
SOL.A = Math.PI * SOL.r ** 2;
SOL.n = SOL.N / SOL.len;
SOL.L = MU0 * SOL.N ** 2 * SOL.A / SOL.len;              // 2.37 mH
SOL.T = 2 * (SOL.ramp + SOL.hold);
export function solCurrent(t) {
  const { Imax, ramp, hold, T } = SOL; t = ((t % T) + T) % T;
  if (t < ramp) return { I: Imax * t / ramp, dI: Imax / ramp };
  if (t < ramp + hold) return { I: Imax, dI: 0 };
  if (t < 2 * ramp + hold) return { I: Imax * (1 - (t - ramp - hold) / ramp), dI: -Imax / ramp };
  return { I: 0, dI: 0 };
}
export function solScene(t) {
  const { I, dI } = solCurrent(t), B = MU0 * SOL.n * I;
  return { I, dI, B, Phi: B * SOL.A, NPhi: SOL.N * B * SOL.A, emfL: -SOL.L * dI, U: 0.5 * SOL.L * I * I, u: B * B / (2 * MU0) };
}
// the field at the centre of the finite coil: its N turns summed, each on its axis
export function solCentreB(I = 1) { let B = 0; for (let k = 0; k < SOL.N; k++) B += ringAxisB(SOL.r, -SOL.len / 2 + (k + 0.5) * SOL.len / SOL.N, I); return B; }

// ---------- page 8: an RL circuit, 12 V, 4 Ω, 2 H. The switch connects the battery for 4 s, then
// takes it out of the loop for 4 s, and so on (8 time constants each, so it starts essentially at 0) ----------
export const RL = { E: 12, R: 4, L: 2, phase: 4 };
RL.tau = RL.L / RL.R;                                    // 0.5 s
RL.Imax = RL.E / RL.R;                                   // 3 A
{ // the repeating cycle exactly: growth from Ia to Ib, decay from Ib back to Ia
  const k = Math.exp(-RL.phase / RL.tau);
  RL.Ib = RL.Imax * (1 - k) / (1 - k * k); RL.Ia = RL.Ib * k;
}
export function rlScene(t) {
  const { E, R, L, tau, phase, Imax, Ia, Ib } = RL; t = ((t % (2 * phase)) + 2 * phase) % (2 * phase);
  const growing = t < phase, s = growing ? t : t - phase, e = Math.exp(-s / tau);
  const I = growing ? Imax + (Ia - Imax) * e : Ib * e;
  const emfBat = growing ? E : 0, VR = I * R, VL = emfBat - VR;   // ΔV across the inductor, L dI/dt, from the loop rule
  return { growing, s, I, dI: VL / L, VR, VL, emfBat, U: 0.5 * L * I * I, P: I * I * R };
}
// the textbook forms, starting exactly from rest / from E/R
export const rlGrow = t => RL.Imax * (1 - Math.exp(-t / RL.tau));
export const rlDecay = t => RL.Imax * Math.exp(-t / RL.tau);

// ---------- page 9: an LC circuit, 40 mH and 25 µF, the capacitor charged to 100 µC and connected ----------
// Kirchhoff round the loop: q/C + L dI/dt = 0 with I = dq/dt, so L q'' + q/C = 0 and
//   q = Q cos ωt, I = −ωQ sin ωt, ω = 1/√(LC).
// q is the charge on the top plate, I = dq/dt the current arriving at it. The real period is 6.28 ms;
// on screen one period takes SLOW_LC seconds. The coil (1600 turns, radius 2 cm) holds LI/N per
// turn, so B = LI/NA; the plates are 1 mm apart, so E = V/d = q/Cd.
export const LC = { L: 0.040, C: 25e-6, Q: 100e-6, N: 1600, r: 0.02, d: 1e-3, show: 4 };
LC.w = 1 / Math.sqrt(LC.L * LC.C);                       // 1000 rad/s
LC.T = 2 * Math.PI / LC.w;                               // 6.28 ms
LC.f = 1 / LC.T;                                          // 159 Hz
LC.A = Math.PI * LC.r ** 2;
LC.Imax = LC.w * LC.Q;                                    // 0.1 A
LC.V0 = LC.Q / LC.C;                                      // 4 V
LC.U = LC.Q ** 2 / (2 * LC.C);                            // 0.2 mJ
LC.slow = LC.show / LC.T;                                 // screen seconds per real second
export function lcScene(t) {                              // t in real seconds
  const { L, C, Q, w, N, A, d } = LC, q = Q * Math.cos(w * t), I = -w * Q * Math.sin(w * t);
  return { q, I, V: q / C, E: q / (C * d), B: L * I / (N * A), UE: q * q / (2 * C), UB: 0.5 * L * I * I, dI: -q / (L * C), emfL: q / C };
}
