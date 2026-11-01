// Kinematics model: a ball thrown straight up, and a second ball thrown at an angle with
// the same upward speed. Pure functions, SI units, y up. Air resistance is ignored (free fall).
// Every motion, arrow, graph and number on the page comes from here.

export const G = 9.80;                 // m/s², downward
export const VY0 = 9.80;               // launch speed straight up, m/s
export const VX = 6.00;                // the projectile's horizontal speed, m/s
export const T = 2 * VY0 / G;          // time in the air: 2.00 s
export const H = VY0 * VY0 / (2 * G);  // highest point: 4.90 m
export const RANGE = VX * T;           // projectile lands 12.0 m away
export const V0P = Math.hypot(VX, VY0);                  // projectile launch speed
export const ANGLE = Math.atan2(VY0, VX) * 180 / Math.PI; // launch angle above horizontal
export const REST = 0.8;               // the ball rests on the pad between throws, s
export const CYCLE = T + REST;
export const SLOW = 0.5;               // shown at half speed
export const STROBE = 0.2;             // strobe interval, s

// vertical motion (both balls)
export const y = t => VY0 * t - 0.5 * G * t * t;
export const vy = t => VY0 - G * t;
export const ay = () => -G;
// horizontal motion (projectile only): no horizontal force, so uniform motion
export const x = t => VX * t;

// distance travelled along the path so far (straight-up ball)
export const distance = t => t <= T / 2 ? y(t) : 2 * H - y(t);
// displacement area under v–t from 0 to t equals y(t)
export const areaUnderV = t => VY0 * t - 0.5 * G * t * t;

// flight time from the looping clock (seconds of real time → physics time)
export function flight(clock) {
  const c = (clock * SLOW) % CYCLE;
  return { t: Math.min(c, T), resting: c > T };
}

// a repeating run: `run` seconds of motion, then `rest` seconds holding the end state
export function loop(time, run, rest = 0.8) {
  const c = time % (run + rest);
  return { t: Math.min(c, run), resting: c > run };
}

// ---------- 1.7 reference frames: rain seen from a moving car ----------
// 2D vectors [forward, up]. Subscripts read "of R relative to G": R rain, C car, G ground.
export const vadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const vneg = a => [-a[0], -a[1]];
export const vlen = a => Math.hypot(a[0], a[1]);
export const RAIN = { vr: 7.0, vc: 10.0, slow: 0.25 };   // rain falls 7.0 m/s straight down; the car drives at 10.0 m/s
export const V_RG = [0, -RAIN.vr];                        // rain relative to the ground
export const V_CG = [RAIN.vc, 0];                         // car relative to the ground
export const V_GC = vneg(V_CG);                           // ground relative to the car
export const V_RC = vadd(V_RG, V_GC);                     // v_RC = v_RG + v_GC
export const RAIN_ANGLE = Math.atan2(RAIN.vc, RAIN.vr) * 180 / Math.PI;   // slant from vertical, seen from the car
export const rainAngleAt = vc => Math.atan2(vc, RAIN.vr) * 180 / Math.PI;

// ---------- 1.8 crossing a river ----------
// x downstream along the river, y across it (0 at the near bank, w at the far bank).
// phi: how far the bow is turned upstream from straight across.
export const RIVER = { w: 24, vw: 1.5, vb: 2.5, rate: 3 };   // 24 m wide; current 1.5 m/s; boat 2.5 m/s through the water; shown at 3× speed
export const AIM_UP = Math.asin(RIVER.vw / RIVER.vb);          // aim that cancels the drift
export const vBW = phi => [-RIVER.vb * Math.sin(phi), RIVER.vb * Math.cos(phi)];   // boat relative to water
export const V_WS = [RIVER.vw, 0];                                                // water relative to shore
export const vBS = phi => vadd(vBW(phi), V_WS);                                   // v_BS = v_BW + v_WS
export const crossTime = phi => RIVER.w / vBS(phi)[1];
export const drift = phi => vBS(phi)[0] * crossTime(phi);
export function boatPos(phi, t) { const tt = Math.min(t, crossTime(phi)), v = vBS(phi); return [v[0] * tt, v[1] * tt]; }
export const RIVER_RUN = crossTime(AIM_UP);   // the slower boat's crossing

// ---------- 1.9 a car pulling away, with acceleration that fades (Physics C) ----------
// a(t) = a0 − k·t until it reaches zero at t1 = a0/k, then 0. Starts from rest at x = 0.
export const PULL = { a0: 6.0, k: 1.5, run: 5.0, slow: 0.5 };
export const T1 = PULL.a0 / PULL.k;                                          // 4.00 s
export const V1 = PULL.a0 * T1 - 0.5 * PULL.k * T1 * T1;                     // 12.0 m/s
export const X1 = 0.5 * PULL.a0 * T1 * T1 - PULL.k * T1 ** 3 / 6;            // 32.0 m
export const pa = t => t < T1 ? PULL.a0 - PULL.k * t : 0;
export const pv = t => t < T1 ? PULL.a0 * t - 0.5 * PULL.k * t * t : V1;
export const px = t => t < T1 ? 0.5 * PULL.a0 * t * t - PULL.k * t ** 3 / 6 : X1 + V1 * (t - T1);

// ---------- 1.10 motion given as x(t) = A t³ − B t (Physics C) ----------
export const CUBE = { A: 1.0, B: 3.0, run: 2.0, slow: 0.5 };
export const cx = t => CUBE.A * t ** 3 - CUBE.B * t;
export const cv = t => 3 * CUBE.A * t * t - CUBE.B;
export const ca = t => 6 * CUBE.A * t;
export const T_TURN = Math.sqrt(CUBE.B / (3 * CUBE.A));    // v = 0: 1.00 s, at x = −2.00 m
export const cdist = t => t <= T_TURN ? -cx(t) : -2 * cx(T_TURN) + cx(t);   // path length so far
