// Circular motion and gravitation: thirteen simple situations. Pure functions, SI units.
// Every motion, arrow length and number on the page comes from here.

export const G = 9.80;                 // m/s², near Earth's surface
export const TAU = 2 * Math.PI;

// ---------- uniform circular motion, in a horizontal plane ----------
// Seen from above, counter-clockwise: position r(cos φ, −sin φ) in (x, z), φ = ωt.
export function uniform(r, v, t, phi0 = 0) {
  const w = v / r, phi = phi0 + w * t, c = Math.cos(phi), s = Math.sin(phi), a = v * v / r;
  return { phi, x: r * c, z: -r * s, vx: -v * s, vz: -v * c, ax: -a * c, az: a * s, a };
}
export const ac = (v, r) => v * v / r;                  // centripetal acceleration
export const period = (v, r) => TAU * r / v;            // T = 2πr / v
// Δv between two velocities Δφ apart on the circle, and the average acceleration Δv/Δt
export const deltaV = (v, dphi) => 2 * v * Math.sin(dphi / 2);
export const avgAccel = (v, r, dphi) => deltaV(v, dphi) / (dphi * r / v);

// 1 · a ball whirled on a string over a smooth (frictionless) table
export const BALL = { m: 0.20, r: 0.80 };
export const V1 = 2.0, V2 = 4.0;                        // m/s: the second ball twice as fast
export const tension = (v, r = BALL.r, m = BALL.m) => m * v * v / r;
export const DPHI = 50 * Math.PI / 180;                 // the Δv construction: 50° apart

// 2 · a car on a flat curve: static friction is the centripetal force
export const CAR = { m: 1200, r: 10, v: 7.0, mu: 0.80 };
CAR.W = CAR.m * G;
CAR.f = CAR.m * CAR.v ** 2 / CAR.r;                      // friction needed
CAR.fmax = CAR.mu * CAR.W;                               // the most the road can give
CAR.vmax = Math.sqrt(CAR.mu * G * CAR.r);                // v = √(μs g r)

// 3 · a ball on a string swept round in a cone (θ from the vertical)
export const CONE = { m: 0.20, L: 1.0, thetaDeg: 30 };
CONE.th = CONE.thetaDeg * Math.PI / 180;
CONE.r = CONE.L * Math.sin(CONE.th);
CONE.v = Math.sqrt(CONE.r * G * Math.tan(CONE.th));      // g tan θ = v²/r
CONE.T = CONE.m * G / Math.cos(CONE.th);                 // T cos θ = mg
CONE.Tx = CONE.T * Math.sin(CONE.th);                    // = m v²/r
CONE.Ty = CONE.T * Math.cos(CONE.th);                    // = mg

// 4 · a coaster cart in a vertical loop, frictionless. φ from the bottom, counter-clockwise.
// Energy: v² = v_top² + 2gr(1 + cos φ). Toward the centre: F_N − mg cos φ = mv²/r.
export const LOOP = { m: 500, r: 6.0, vTop: 10.0 };
LOOP.W = LOOP.m * G;
LOOP.vmin = Math.sqrt(G * LOOP.r);                       // F_N = 0 at the top
export const loopV = phi => Math.sqrt(LOOP.vTop ** 2 + 2 * G * LOOP.r * (1 + Math.cos(phi)));
export const loopN = phi => LOOP.m * loopV(phi) ** 2 / LOOP.r + LOOP.W * Math.cos(phi);
// time to reach φ: t = ∫ r / v dφ, tabulated once (Simpson), then inverted
const NT = 2048, tTab = new Float64Array(NT + 1);
{ const h = TAU / NT, f = p => LOOP.r / loopV(p);
  for (let i = 1; i <= NT; i++) { const a = (i - 1) * h; tTab[i] = tTab[i - 1] + h / 6 * (f(a) + 4 * f(a + h / 2) + f(a + h)); } }
LOOP.T = tTab[NT];
export function loopPhi(t) {
  t = ((t % LOOP.T) + LOOP.T) % LOOP.T;
  let lo = 0, hi = NT;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tTab[m] <= t) lo = m; else hi = m; }
  // one Newton step from the bracketing table entry: dφ/dt = v/r
  const p0 = lo / NT * TAU;
  let p = p0 + (t - tTab[lo]) * loopV(p0) / LOOP.r;
  const pm = (p0 + p) / 2; p = p0 + (t - tTab[lo]) * loopV(pm) / LOOP.r;
  return p;
}
// the forces as vectors in the loop's plane (x right, y up): unit inward n = (−sin φ, cos φ)
export function loopState(t) {
  const phi = loopPhi(t), v = loopV(phi), N = loopN(phi);
  const n = [-Math.sin(phi), Math.cos(phi)], tan = [Math.cos(phi), Math.sin(phi)];
  const net = [N * n[0], N * n[1] - LOOP.W];
  return { phi, v, N, n, tan, net, ac: v * v / LOOP.r, at: -G * Math.sin(phi) };
}

// 5 · a car on a banked curve, no friction (θ from the horizontal road = from the vertical normal)
export const BANK = { m: 1200, r: 10, thetaDeg: 20 };
BANK.th = BANK.thetaDeg * Math.PI / 180;
BANK.v = Math.sqrt(BANK.r * G * Math.tan(BANK.th));      // tan θ = v²/(rg)
BANK.W = BANK.m * G;
BANK.N = BANK.W / Math.cos(BANK.th);                     // F_N cos θ = mg
BANK.Nx = BANK.N * Math.sin(BANK.th);                    // = m v²/r
BANK.Ny = BANK.N * Math.cos(BANK.th);
export const bankSpeed = (thDeg, r = BANK.r) => Math.sqrt(r * G * Math.tan(thDeg * Math.PI / 180));

// 6 · a spinning disc: one ω, every point; v = rω
export const DISC = { R: 1.0, r1: 0.40, r2: 0.80, w: 2.5 };
DISC.v1 = DISC.r1 * DISC.w; DISC.v2 = DISC.r2 * DISC.w;
DISC.T = TAU / DISC.w;
export const rpmToRad = rpm => rpm * TAU / 60;
export const radToRpm = w => w * 60 / TAU;

// 7 · universal gravitation between two iron spheres
export const GRAV_G = 6.67e-11;                          // N·m²/kg²
export const gravF = (m1, m2, r) => GRAV_G * m1 * m2 / (r * r);
export const SPHERES = { m1: 1000, m2: 2000, rho: 7870, rMin: 1.0, rMax: 3.0, period: 8 };
export const radiusOf = m => Math.cbrt(3 * m / (4 * Math.PI * SPHERES.rho));
// the separation swings slowly between rMin and rMax
export const sep = t => { const S = SPHERES; return (S.rMin + S.rMax) / 2 - (S.rMax - S.rMin) / 2 * Math.cos(TAU * t / S.period); };
export const EARTH = { M: 5.98e24, R: 6.38e6 };
EARTH.g = GRAV_G * EARTH.M / EARTH.R ** 2;               // 9.80 m/s²
export const PERSON = 80;                                // kg
// proportional reasoning: multiply the coefficients
export const ratio = (k1, k2, kr) => k1 * k2 / (kr * kr);

// 8 · satellites in circular orbits round the Earth: gravity is the centripetal force
export const GM = GRAV_G * EARTH.M;
export const orbitV = r => Math.sqrt(GM / r);
export const orbitT = r => TAU * Math.sqrt(r ** 3 / GM);
export const orbitA = r => GM / (r * r);
export const SAT = { r1: 2 * EARTH.R, r2: 4 * EARTH.R };
export const ORBIT_TIME = 3600;                          // one second on the page is an hour in orbit

// ---------- 10–13 · beyond circles: ellipses, energy, escape (Physics 1 Unit 6; Physics C) ----------
// Newton's gravity integrated numerically (RK4) in the orbit plane (x, y), Earth at the origin.
// A state is [x, y, vx, vy]; every launch starts at (r0, 0) moving along +y (counter-clockwise).
export const SAT_M = 1000;                               // kg: one satellite, for the energies
const deriv = ([x, y, vx, vy]) => { const r = Math.hypot(x, y), k = -GM / (r * r * r); return [vx, vy, k * x, k * y]; };
const step = (s, d, h) => s.map((v, i) => v + d[i] * h);
export function rk4(s, h) {
  const k1 = deriv(s), k2 = deriv(step(s, k1, h / 2)), k3 = deriv(step(s, k2, h / 2)), k4 = deriv(step(s, k3, h));
  return s.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
// integrate for tEnd (a closed orbit: one period) or until r reaches rStop (an escape)
export function track(r0, v0, { tEnd = Infinity, rStop = Infinity, dt = 5 }) {
  const n = Number.isFinite(tEnd) ? Math.ceil(tEnd / dt) : Infinity, h = Number.isFinite(tEnd) ? tEnd / n : dt;
  const S = [[r0, 0, 0, v0]];
  for (let s = S[0]; S.length <= n && Math.hypot(s[0], s[1]) < rStop;) S.push(s = rk4(s, h));
  const T = (S.length - 1) * h;
  // the state at time t (repeating every T): cubic Hermite in position, linear in velocity
  const at = t => {
    t = ((t % T) + T) % T;
    const i = Math.min(Math.floor(t / h), S.length - 2), u = t / h - i, a = S[i], b = S[i + 1];
    const h00 = 2 * u ** 3 - 3 * u * u + 1, h10 = u ** 3 - 2 * u * u + u, h01 = -2 * u ** 3 + 3 * u * u, h11 = u ** 3 - u * u;
    const x = h00 * a[0] + h10 * h * a[2] + h01 * b[0] + h11 * h * b[2], y = h00 * a[1] + h10 * h * a[3] + h01 * b[1] + h11 * h * b[3];
    const vx = a[2] + (b[2] - a[2]) * u, vy = a[3] + (b[3] - a[3]) * u;
    return { x, y, vx, vy, r: Math.hypot(x, y), v: Math.hypot(vx, vy), th: (Math.atan2(y, x) + TAU) % TAU };
  };
  return { S, dt: h, T, at, r0, v0 };
}
// per kilogram: energy and angular momentum of a state; they must not change along a track
export const energyPerKg = ([x, y, vx, vy]) => 0.5 * (vx * vx + vy * vy) - GM / Math.hypot(x, y);
export const angMomPerKg = ([x, y, vx, vy]) => x * vy - y * vx;

// closed forms
export const Ugrav = (r, m = SAT_M) => -GM * m / r;      // U = −GMm/r, zero at infinity
export const visViva = (r, a) => Math.sqrt(GM * (2 / r - 1 / a));
export const vEsc = r => Math.sqrt(2 * GM / r);
export const circK = (r, m = SAT_M) => GM * m / (2 * r); // circular orbit: K = −U/2
export const circE = (r, m = SAT_M) => -GM * m / (2 * r);//                  E = U/2 = −GMm/2r

// 10–11 · one elliptical orbit: perigee 2 R_E, apogee 6 R_E (a = 4 R_E, the outer circle's radius)
export const ELL = { rp: 2 * EARTH.R, ra: 6 * EARTH.R };
ELL.a = (ELL.rp + ELL.ra) / 2;
ELL.e = (ELL.ra - ELL.rp) / (ELL.ra + ELL.rp);
ELL.b = ELL.a * Math.sqrt(1 - ELL.e ** 2);
ELL.vp = visViva(ELL.rp, ELL.a);
ELL.va = visViva(ELL.ra, ELL.a);
ELL.T = TAU * Math.sqrt(ELL.a ** 3 / GM);                // Kepler 3, with a for r
ELL.E = -GM * SAT_M / (2 * ELL.a);
ELL.track = track(ELL.rp, ELL.vp, { tEnd: ELL.T, dt: 4 });
// r and speed at angle θ from perigee (the closed-form ellipse, for the charts)
export const ellR = th => ELL.a * (1 - ELL.e ** 2) / (1 + ELL.e * Math.cos(th));
export const ellV = th => visViva(ellR(th), ELL.a);
export const SWEEP = 3600;                               // equal times: one hour of orbit
// area swept by the radius between times t0 and t1 (shoelace over the integrated path)
export function swept(t0, t1, n = 400) {
  let A = 0, p = ELL.track.at(t0);
  for (let i = 1; i <= n; i++) { const q = ELL.track.at(t0 + (t1 - t0) * i / n); A += 0.5 * (p.x * q.y - q.x * p.y); p = q; }
  return A;
}

// 12 · U(r): a satellite carried slowly out from just above the ground (1.1 R_E) to 5 R_E and back
export const WELL = { r0: 1.1 * EARTH.R, r1: 5 * EARTH.R, period: 12 };
export const wellR = t => WELL.r0 + (WELL.r1 - WELL.r0) * (1 - Math.cos(TAU * t / WELL.period)) / 2;

// 13 · launches sideways from 2 R_E: circular, below, at and above escape speed
export const LAUNCH = { r0: 2 * EARTH.R, rStop: 6 * EARTH.R };
LAUNCH.vc = orbitV(LAUNCH.r0);
LAUNCH.vesc = vEsc(LAUNCH.r0);
LAUNCH.list = [
  { name: 'circle', k: LAUNCH.vc / LAUNCH.vesc },
  { name: 'ellipse', k: 0.8 },
  { name: 'parabola', k: 1.0 },
  { name: 'hyperbola', k: 1.2 },
].map(o => {
  const v0 = o.k * LAUNCH.vesc, E = 0.5 * v0 * v0 - GM / LAUNCH.r0;
  const a = E < 0 ? -GM / (2 * E) : Infinity;
  const tEnd = E < -1e-6 ? TAU * Math.sqrt(a ** 3 / GM) : Infinity;
  return { ...o, v0, E, a, track: track(LAUNCH.r0, v0, { tEnd, rStop: LAUNCH.rStop, dt: 4 }) };
});
export const ESC_TIME = 1800;                            // launches: one second on the page is half an hour
// the farthest point of a bound sideways launch: from energy and angular momentum
export const apogeeOf = (r0, v0) => r0 / (2 * GM / (r0 * v0 * v0) - 1);

// reduced motion: a fixed instant
export const STILL = 0.9;
