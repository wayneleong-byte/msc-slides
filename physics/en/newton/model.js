// Newton's laws model: one 2.0 kg block in six simple situations. Pure functions, SI units.
// Every motion, force arrow and number on the page comes from here.

export const G = 9.80;          // m/s²
export const M1 = 2.0;          // the block, kg
export const M2 = 4.0;          // a second, heavier block, kg
export const SLOW = 0.6;        // shown at 0.6× speed
export const W1 = M1 * G;       // 19.6 N
export const W2 = M2 * G;       // 39.2 N

// first law: gliding on a frictionless surface, no net force
export const V_GLIDE = 1.5;     // m/s
export const GLIDE = { len: 3.6 };
export const glide = t => ({ x: -GLIDE.len / 2 + V_GLIDE * t, v: V_GLIDE, a: 0 });
export const GLIDE_T = GLIDE.len / V_GLIDE;            // 2.4 s across

// second law: the same 6.0 N push on 2 kg and 4 kg, frictionless
export const PUSH = 6.0;
export const A1 = PUSH / M1;    // 3.0 m/s²
export const A2 = PUSH / M2;    // 1.5 m/s²
export const PUSH_T = 1.2;      // seconds of pushing shown
export const pushed = (a, t) => ({ x: 0.5 * a * t * t, v: a * t, a });

// friction: a push that grows at RAMP N/s on the 2.0 kg block on a rough floor
export const MU_S = 0.50, MU_K = 0.30;
export const FN = W1;                       // flat floor: normal force = weight
export const F_SMAX = MU_S * FN;            // 9.80 N
export const F_K = MU_K * FN;               // 5.88 N
export const RAMP = 4.0;                    // N/s
export const T_SLIP = F_SMAX / RAMP;        // 2.45 s
export const FRIC_T = 3.0;
export function friction(t) {
  const F = RAMP * t;
  if (t < T_SLIP) return { F, f: F, kind: 'static', x: 0, v: 0, a: 0 };
  // sliding: m a = F − f_k, with F = RAMP·t; integrate from T_SLIP
  const s = t - T_SLIP;
  const a = (F - F_K) / M1;
  const v = (RAMP / (2 * M1)) * (t * t - T_SLIP * T_SLIP) - (F_K / M1) * s;
  const x = (RAMP / (6 * M1)) * (t ** 3 - T_SLIP ** 3) - (RAMP / (2 * M1)) * T_SLIP * T_SLIP * s - (F_K / (2 * M1)) * s * s;
  return { F, f: F_K, kind: 'kinetic', x, v, a };
}

// third law: the 6.0 N push on A (2 kg) against B (4 kg), frictionless
export const A_PAIR = PUSH / (M1 + M2);     // 1.0 m/s²
export const CONTACT = M2 * A_PAIR;         // 4.0 N: A pushes B, B pushes A back
export const PAIR_T = 1.6;
export const pair = t => ({ x: 0.5 * A_PAIR * t * t, v: A_PAIR * t, a: A_PAIR });

// inclined plane: 30°, frictionless
export const THETA_DEG = 30;
export const THETA = THETA_DEG * Math.PI / 180;
export const W_PAR = W1 * Math.sin(THETA);  // 9.80 N down the slope
export const W_PERP = W1 * Math.cos(THETA); // 16.97 N into the slope
export const FN_INC = W_PERP;
export const A_INC = G * Math.sin(THETA);   // 4.90 m/s²
export const INC_LEN = 3.0;                 // slide length, m
export const INC_T = Math.sqrt(2 * INC_LEN / A_INC);
export const incline = t => ({ s: 0.5 * A_INC * t * t, v: A_INC * t, a: A_INC });
// with friction, the block just slides at constant speed when tan θ = μk
export const critical = mu => Math.atan(mu) * 180 / Math.PI;

// each scene loops: motion, then a short rest, then it starts again
export const REST = 0.8;
export const loop = (clock, run) => { const c = (clock * SLOW) % (run + REST); return { t: Math.min(c, run), resting: c > run }; };

// tension: the 2.0 kg block hanging from one string, and from two strings at angle θ above
// the horizontal. Vertical balance: 2T sin θ = mg, so T = mg / (2 sin θ).
export const STRING_L = 1.6;                          // each string, m
export const tension2 = thetaDeg => W1 / (2 * Math.sin(thetaDeg * Math.PI / 180));
export const HANG_PERIOD = 10;                        // θ sweeps 20°–70° and back
export const hangAngle = t => 45 - 25 * Math.cos(2 * Math.PI * t / HANG_PERIOD);

// a light plane in level flight at constant velocity: every force balanced
export const PLANE = { m: 1200, v: 55 };
PLANE.W = PLANE.m * G;          // 11 760 N
PLANE.L = PLANE.W;              // lift = weight
PLANE.D = 1800;                 // drag at 55 m/s, N
PLANE.T = PLANE.D;              // thrust = drag

// a car speeding up from rest: the road's static friction on the drive wheels pushes it
// forward, air drag ½ρC_dA·v² pushes back. m dv/dt = F − k v²  →  v = v_t tanh(t F / (m v_t))
export const CAR = { m: 1200, F: 3600, rho: 1.2, CdA: 0.65, run: 3.2 };
CAR.k = 0.5 * CAR.rho * CAR.CdA;                    // 0.39 kg/m
CAR.vt = Math.sqrt(CAR.F / CAR.k);                  // top speed if F stayed constant
CAR.W = CAR.m * G;
export function car(t) {
  const u = t * CAR.F / (CAR.m * CAR.vt);
  const v = CAR.vt * Math.tanh(u);
  const x = (CAR.m / CAR.k) * Math.log(Math.cosh(u));
  const D = CAR.k * v * v;
  return { x, v, D, a: (CAR.F - D) / CAR.m };
}

// ---------- systems and the centre of mass ----------
export const xcm = (ms, xs) => ms.reduce((s, m, i) => s + m * xs[i], 0) / ms.reduce((s, m) => s + m, 0);

// tug of war on ice: two skaters haul in a light rope hand over hand, each feeling the same
// tension. The tension pair is internal to the skaters + rope system, so x_cm never moves.
// xA, xB are the skaters' centres; the scene stops with the hands 1.2 m apart (centres d1 apart).
export const TUG = { mA: 50, mB: 75, T: 60, d0: 4.9, d1: 2.1 };   // kg, kg, N, m, m
TUG.M = TUG.mA + TUG.mB;
TUG.aA = TUG.T / TUG.mA;                                     // 1.2 m/s² toward B
TUG.aB = TUG.T / TUG.mB;                                     // 0.8 m/s² toward A
TUG.run = Math.sqrt(2 * (TUG.d0 - TUG.d1) / (TUG.aA + TUG.aB));   // 1.67 s of hauling
TUG.xA0 = -TUG.d0 * TUG.mB / TUG.M;                          // placed so x_cm = 0
TUG.xB0 = TUG.d0 * TUG.mA / TUG.M;
export const tug = t => { const s = Math.min(t, TUG.run);
  return { xA: TUG.xA0 + 0.5 * TUG.aA * s * s, xB: TUG.xB0 - 0.5 * TUG.aB * s * s, vA: TUG.aA * s, vB: -TUG.aB * s }; };

// a block on a board on ice, the board pulled by a steady external force F. Kinetic friction
// between them is internal to the block + board system: ΣF_ext = F = M a_cm.
export const BOARD = { m: M1, Mb: M2, F: 18, mu_s: 0.20, mu_k: 0.15, len: 2.4, x0: 0.7 };
BOARD.M = BOARD.m + BOARD.Mb;
BOARD.f = BOARD.mu_k * BOARD.m * G;                          // 2.94 N
BOARD.aBlock = BOARD.f / BOARD.m;                            // friction drags the block forward
BOARD.aBoard = (BOARD.F - BOARD.f) / BOARD.Mb;               // the board pulls ahead
BOARD.aCm = BOARD.F / BOARD.M;                               // 3.0 m/s²
BOARD.Fslip = BOARD.mu_s * G * BOARD.M;                      // pull above this and the block must slip
BOARD.run = Math.sqrt(2 * 1.3 / (BOARD.aBoard - BOARD.aBlock));   // until the block has slid 1.3 m back
export const board = t => ({ xBlock: 0.5 * BOARD.aBlock * t * t, xBoard: 0.5 * BOARD.aBoard * t * t,
  vBlock: BOARD.aBlock * t, vBoard: BOARD.aBoard * t });

// ---------- AP Physics C: drag proportional to speed, F = −bv ----------
// a ball falling from rest: m dv/dt = mg − bv  →  v = v_t (1 − e^(−t/τ)), v_t = mg/b, τ = m/b,
// x = v_t (t − τ (1 − e^(−t/τ))), measured downward from the release point
export const DRAG = { m: 0.50, b: 1.25, run: 1.6, y0: 5.4 };
DRAG.vt = DRAG.m * G / DRAG.b;                               // 3.92 m/s
DRAG.tau = DRAG.m / DRAG.b;                                  // 0.40 s
DRAG.W = DRAG.m * G;
export function linDrag(t) {
  const e = Math.exp(-t / DRAG.tau), v = DRAG.vt * (1 - e);
  return { v, x: DRAG.vt * (t - DRAG.tau * (1 - e)), D: DRAG.b * v, a: G * e };
}
// the same ball with quadratic drag kv², k chosen for the same terminal speed: v = v_t tanh(g t / v_t)
DRAG.k = DRAG.m * G / DRAG.vt ** 2;
export const quadV = t => DRAG.vt * Math.tanh(G * t / DRAG.vt);

// a steel ball sinking in honey: Stokes drag b = 6πηr, and buoyancy B = ρ_f V g, so the
// constant pull is mg − B. Real numbers; drawn 10× life size.
export const HONEY = { r: 0.005, rho: 7800, rhoF: 1420, eta: 10, run: 3.0, jarH: 0.12 };
HONEY.V = 4 / 3 * Math.PI * HONEY.r ** 3;
HONEY.m = HONEY.rho * HONEY.V;                               // 4.1 g
HONEY.W = HONEY.m * G;
HONEY.B = HONEY.rhoF * HONEY.V * G;
HONEY.b = 6 * Math.PI * HONEY.eta * HONEY.r;
HONEY.vt = (HONEY.W - HONEY.B) / HONEY.b;                    // 3.5 cm/s
HONEY.tau = HONEY.m / HONEY.b;                               // 4 ms
HONEY.Re = HONEY.rhoF * HONEY.vt * 2 * HONEY.r / HONEY.eta;  // ≪ 1, so linear (Stokes) drag holds
export const honey = t => { const e = Math.exp(-t / HONEY.tau); return { v: HONEY.vt * (1 - e), x: HONEY.vt * (t - HONEY.tau * (1 - e)) }; };

// drops of water falling in air (η 1.8×10⁻⁵ Pa·s, ρ 1.2 kg/m³): Stokes' prediction, and the quadratic one
export const AIR = { eta: 1.8e-5, rho: 1.2, Cd: 0.5 };
export function drop(r) {
  const m = 1000 * 4 / 3 * Math.PI * r ** 3, b = 6 * Math.PI * AIR.eta * r;
  const vLin = m * G / b, vQuad = Math.sqrt(m * G / (0.5 * AIR.rho * AIR.Cd * Math.PI * r * r));
  return { m, vLin, vQuad, tau: m / b, Re: AIR.rho * vLin * 2 * r / AIR.eta };
}
