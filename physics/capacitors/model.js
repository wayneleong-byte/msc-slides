// Capacitors and conductors model: plates, shells, circuits, dielectrics and a conductor in a
// field. Pure functions, SI units. Every arrow, charge mark and number on the page comes from here.

export const EPS0 = 8.85e-12;          // C²/N·m²
export const K = 1 / (4 * Math.PI * EPS0); // 8.99×10⁹ N·m²/C², kept consistent with ε₀
export const SLOW = 1;
export const REST = 0.8;
export const loop = (clock, run) => { const c = (clock * SLOW) % (run + REST); return { t: Math.min(c, run), resting: c > run }; };
const wave = (t, T) => (1 - Math.cos(2 * Math.PI * t / T)) / 2;     // 0 → 1 → 0 over T

// ---------- the parallel-plate capacitor: two 20 cm square plates 5 cm apart ----------
export const PLATE = { side: 0.20, d: 0.05 };
PLATE.A = PLATE.side ** 2;                                   // 0.04 m²
export const cPlate = (A, d, kappa = 1) => kappa * EPS0 * A / d;
export const C0 = cPlate(PLATE.A, PLATE.d);                  // 7.08 pF
export const V0 = 100;                                       // volts, the battery used throughout
export const Q0 = C0 * V0;                                   // 708 pC
export const E0 = V0 / PLATE.d;                              // 2000 V/m

// page 0: a variable battery turned slowly between 20 V and 100 V; Q follows, C stays put
export const CHARGE_T = 8;
export function charging(t) {
  const V = V0 * (0.2 + 0.8 * wave(t, CHARGE_T)), Q = C0 * V;
  return { V, Q, E: V / PLATE.d, sigma: Q / PLATE.A, C: Q > 0 ? Q / V : C0 };
}

// field of one uniformly charged disc of radius R on its axis, by summing rings (numeric) and
// in closed form; R → ∞ gives the infinite sheet σ/2ε₀
export const discAxisE = (sigma, R, z) => sigma / (2 * EPS0) * (1 - z / Math.sqrt(z * z + R * R));
export function discAxisENumeric(sigma, R, z, n = 4000) {
  let E = 0;
  for (let i = 0; i < n; i++) {
    const r = (i + 0.5) * R / n, dq = sigma * 2 * Math.PI * r * R / n;
    E += K * dq * z / (r * r + z * z) ** 1.5;
  }
  return E;
}
export const sheetE = sigma => sigma / (2 * EPS0);

// page 1: an isolated capacitor (Q fixed) whose gap opens and closes between 2 and 8 cm
export const GAP_T = 9;
export const gapOf = t => 0.02 + 0.06 * wave(t, GAP_T);
export function gapScene(t) {
  const d = gapOf(t), C = cPlate(PLATE.A, d), E = Q0 / (EPS0 * PLATE.A);
  return { d, C, E, V: E * d, Q: Q0 };
}
export const PILLBOX = { r: 0.03 };                          // the Gaussian pillbox's end faces, radius 3 cm
PILLBOX.A = Math.PI * PILLBOX.r ** 2;

// ΔV = −∫ E·ds from the − plate to the + plate, numerically, for any E(s) along the path
export function lineIntegral(Efn, s0, s1, n = 2000) {
  let sum = 0; const h = (s1 - s0) / n;
  for (let i = 0; i < n; i++) sum += Efn(s0 + (i + 0.5) * h) * h;
  return sum;
}

// ---------- page 2: spherical capacitor, a = 10 cm inside b = 20 cm ----------
export const SPH = { a: 0.10, b: 0.20 };
SPH.C = 4 * Math.PI * EPS0 * SPH.a * SPH.b / (SPH.b - SPH.a);       // 22.2 pF
SPH.Q = SPH.C * V0;
export const sphE = r => (r < SPH.a || r > SPH.b) ? 0 : K * SPH.Q / (r * r);
export const SWEEP_T = 7;
export const gaussR = (t, a, b) => a + (b - a) * wave(t, SWEEP_T);
// potential of the inner sphere above r (zero at the outer shell): ∫_r^b E dr
export const sphV = r => K * SPH.Q * (1 / Math.max(r, SPH.a) - 1 / SPH.b);
// flux of a point charge through a sphere, summed over a grid of patches
export function fluxSphere(Efn, R, n = 200) {
  let flux = 0;
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * Math.PI / n;
    flux += Efn(R) * 2 * Math.PI * R * Math.sin(th) * R * Math.PI / n;
  }
  return flux;
}

// ---------- page 3: cylindrical capacitor, a 2 cm rod inside an 8 cm tube, 40 cm long ----------
export const CYL = { a: 0.02, b: 0.08, L: 0.40 };
CYL.C = 2 * Math.PI * EPS0 * CYL.L / Math.log(CYL.b / CYL.a);       // 16.0 pF
CYL.Q = CYL.C * V0;
CYL.lambda = CYL.Q / CYL.L;
export const cylE = r => (r < CYL.a || r > CYL.b) ? 0 : CYL.lambda / (2 * Math.PI * EPS0 * r);
export const cylV = r => CYL.lambda / (2 * Math.PI * EPS0) * Math.log(CYL.b / Math.max(r, CYL.a));

// ---------- page 4: energy, the same plates charged to 100 V one bit at a time ----------
export const FILL_T = 6;
export function filling(t) {
  const q = Q0 * t / FILL_T, V = q / C0, E = V / PLATE.d;
  return { q, V, E, U: q * q / (2 * C0), u: 0.5 * EPS0 * E * E };
}
export const U0 = 0.5 * C0 * V0 * V0;                        // 35.4 nJ
export const DQ_T = 0.75;                                    // one little dq crosses the gap

// ---------- page 5: 2 µF and 4 µF on a 9 V battery, in series and in parallel ----------
export const CIRC = { C1: 2e-6, C2: 4e-6, V: 9 };
export const series = (C1, C2, V) => { const C = 1 / (1 / C1 + 1 / C2), Q = C * V; return { C, Q, Q1: Q, Q2: Q, V1: Q / C1, V2: Q / C2, U: 0.5 * C * V * V }; };
export const parallel = (C1, C2, V) => { const C = C1 + C2; return { C, Q: C * V, Q1: C1 * V, Q2: C2 * V, V1: V, V2: V, U: 0.5 * C * V * V }; };
export const SER = series(CIRC.C1, CIRC.C2, CIRC.V);
export const PAR = parallel(CIRC.C1, CIRC.C2, CIRC.V);

// ---------- pages 6–7: a κ = 3 slab slides down into the gap ----------
export const KAPPA = 3;                                      // plastic
export const DIELECTRICS = [['vacuum', 1], ['air', 1.0006], ['Teflon', 2.1], ['plastic', 3], ['paper', 3.5], ['rubber', 7], ['water', 80], ['SrTiO₃', 233]];
export const SLIDE_T = 8;
// fraction of the plate area the slab covers: in, hold, out
export const fillOf = t => { const u = t / SLIDE_T; return u < 0.35 ? smoothstep(u / 0.35) : u < 0.65 ? 1 : 1 - smoothstep((u - 0.65) / 0.35); };
const smoothstep = u => u * u * (3 - 2 * u);
// partly filled: the filled and empty parts are two capacitors side by side (parallel)
export const cPartial = x => C0 * (1 + (KAPPA - 1) * x);
export function slab(x, connected) {
  const C = cPartial(x);
  const Q = connected ? C * V0 : Q0, V = Q / C, E = V / PLATE.d;
  const sigAir = EPS0 * E, sigDie = KAPPA * EPS0 * E, sigBound = (KAPPA - 1) * EPS0 * E;
  return { x, C, Q, V, E, U: 0.5 * Q * V, sigAir, sigDie, sigBound, Eind: sigBound / EPS0, Efree: sigDie / EPS0 };
}
// a polar molecule in the field turns toward it (overdamped): dθ/dt = −sin θ / τ,
// so tan(θ/2) = tan(θ₀/2)·e^(−t/τ). Torque τ = pE sin θ, energy U = −pE cos θ.
export const ALIGN_TAU = 0.5;
export const align = (th0, t) => 2 * Math.atan(Math.tan(th0 / 2) * Math.exp(-Math.max(t, 0) / ALIGN_TAU));
export const dipoleTorque = (p, E, th) => p * E * Math.sin(th);
export const dipoleU = (p, E, th) => -p * E * Math.cos(th);

// ---------- page 8: a neutral conducting sphere (R = 10 cm) in a uniform 1 kV/m field ----------
export const COND = { R: 0.10, E0: 1000 };
// outside: E₀ plus the field of the induced dipole p = 4πε₀R³E₀; inside: zero
export function condE(x, y, z) {
  const r2 = x * x + y * y + z * z, r = Math.sqrt(r2), { R, E0: Ea } = COND;
  if (r < R) return [0, 0, 0];
  const k = R ** 3 / r ** 5;
  return [Ea + Ea * k * (3 * x * x - r2), Ea * k * 3 * x * y, Ea * k * 3 * x * z];
}
// potential, zero on the conductor
export const condV = (x, y, z) => { const r = Math.hypot(x, y, z); return r < COND.R ? 0 : -COND.E0 * x * (1 - COND.R ** 3 / r ** 3); };
export const condSigma = th => 3 * EPS0 * COND.E0 * Math.cos(th);      // θ from the field direction
export const condAxisE = x => Math.abs(x) < COND.R ? 0 : condE(x, 0, 0)[0];
// trace a field line from p along E (RK4, fixed step) until it leaves the box or reaches the sphere
export function traceLine(p, { step = 0.004, box = 0.32, max = 600 } = {}) {
  const dir = q => { const e = condE(...q), n = Math.hypot(...e) || 1; return e.map(c => c / n); };
  const pts = [p.slice()]; let q = p.slice();
  for (let i = 0; i < max; i++) {
    const k1 = dir(q), k2 = dir(q.map((c, j) => c + k1[j] * step / 2)), k3 = dir(q.map((c, j) => c + k2[j] * step / 2)), k4 = dir(q.map((c, j) => c + k3[j] * step));
    q = q.map((c, j) => c + step / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    pts.push(q.slice());
    if (Math.hypot(...q) <= COND.R * 1.003 || Math.abs(q[0]) > box || Math.hypot(q[1], q[2]) > box) break;
  }
  return pts;
}
export const PROBE_T = 8;
export const probeX = t => -0.28 + 0.56 * wave(t, PROBE_T * 2) * 1;   // along the axis and back over 16 s

// a molecule at height h (fraction of the slab, from its leading edge) is in the field once the
// slab covers more than h of the plates; it aligns while inside, and thermal jostling scrambles it
// back toward its starting angle, with the same τ, after it leaves
const invertFill = (h, t0, t1, rising) => { let a = t0, b = t1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; ((fillOf(m) > h) === rising) ? (b = m) : (a = m); } return (a + b) / 2; };
export function moleculeAngle(th0, h, t) {
  const tE = invertFill(h, 0, 0.35 * SLIDE_T, true), tX = invertFill(h, 0.65 * SLIDE_T, SLIDE_T, false);
  if (t < tE) return th0;
  const th = align(th0, Math.min(t, tX) - tE);
  return t <= tX ? th : th0 + (th - th0) * Math.exp(-(t - tX) / ALIGN_TAU);
}
