// Electric potential model: point charges, a charged rod, ring, arc, disc and spheres, and
// charges moving through potential differences. Pure functions, SI units (m, C, V, J).
// Every arrow, height, contour and number on the page comes from here.

export const K = 8.99e9;            // N·m²/C²
export const EPS0 = 8.85e-12;       // C²/N·m²
export const E_CH = 1.60e-19;       // C
export const M_E = 9.11e-31;        // kg
export const M_P = 1.67e-27;        // kg
export const nC = 1e-9;

// each scene loops: motion, then a short rest, then it starts again
export const REST = 0.8;
export const loop = (clock, run) => { const c = clock % (run + REST); return { t: Math.min(c, run), resting: c > run }; };
// a smooth back-and-forth between a and b with period T
export const sweep = (t, a, b, T) => a + (b - a) * (0.5 - 0.5 * Math.cos(2 * Math.PI * t / T));

// ---------- point charges ----------
export const Vpoint = (q, r) => K * q / r;
export const Epoint = (q, r) => K * q / (r * r);
export const Upair = (q1, q2, r) => K * q1 * q2 / r;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
// superposition: charges = [{ q, p: [x, y, z] }]
export const Vsum = (charges, p) => charges.reduce((s, c) => s + K * c.q / dist(p, c.p), 0);
export function Esum(charges, p) {
  const e = [0, 0, 0];
  for (const c of charges) {
    const d = [p[0] - c.p[0], p[1] - c.p[1], p[2] - c.p[2]], r = Math.hypot(...d), k = K * c.q / (r * r * r);
    e[0] += k * d[0]; e[1] += k * d[1]; e[2] += k * d[2];
  }
  return e;
}
// total energy of an assembly: the sum over every pair
export function Uassembly(charges) {
  let U = 0;
  for (let i = 0; i < charges.length; i++) for (let j = i + 1; j < charges.length; j++) U += K * charges[i].q * charges[j].q / dist(charges[i].p, charges[j].p);
  return U;
}

// ---------- 1 · a pair: q2 brought in toward q1 ----------
export const PAIR = { q1: 4 * nC, q2: 2 * nC, r0: 0.40, r1: 0.10, run: 4.0 };
export function pair(t, sign = 1) {
  const r = PAIR.r0 + (PAIR.r1 - PAIR.r0) * t / PAIR.run, q2 = sign * PAIR.q2;
  const U = Upair(PAIR.q1, q2, r), U0 = Upair(PAIR.q1, q2, PAIR.r0);
  return { r, U, W: U - U0, F: K * PAIR.q1 * q2 / (r * r) };     // F > 0: repulsive (pushes q2 away)
}

// ---------- 2 · four equal charges assembled on a square ----------
export const SQ = { q: 2 * nC, a: 0.20, slot: 1.2, far: 0.25 };
SQ.run = 4 * SQ.slot;
// corners in the order the organizer brings them in: q1 top-left, q2 bottom-left, q3 top-right, q4 bottom-right
SQ.corners = [[-1, 1], [-1, -1], [1, 1], [1, -1]].map(([x, z]) => [x * SQ.a / 2, 0, -z * SQ.a / 2]);
SQ.U = (4 + Math.SQRT2) * K * SQ.q * SQ.q / SQ.a;               // 4 sides + 2 diagonals
export function square(t) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const u = Math.min(Math.max((t - i * SQ.slot) / (SQ.slot * 0.8), 0), 1);
    if (t < i * SQ.slot) { out.push(null); continue; }        // still at infinity
    const c = SQ.corners[i], d = Math.hypot(c[0], c[2]), k = 1 + (SQ.far / d) * (1 - u) ** 2;
    out.push([c[0] * k, 0, c[2] * k]);
  }
  const placed = out.map((p, i) => p && { q: SQ.q, p }).filter(Boolean);
  return { pos: out, n: placed.length, U: Uassembly(placed) };
}
// the work to bring in charge n (0-based) once the earlier ones sit on their corners
export const sqStep = n => SQ.corners.slice(0, n).reduce((s, c) => s + K * SQ.q * SQ.q / dist(c, SQ.corners[n]), 0);

// ---------- 3 · a uniform field: the organizer's A → C example ----------
export const UNI = { E: 50, A: [0, 0, -0.4], B: [0, 0, 0], C: [0.2, 0, 0], q: 1 * nC, run: 3.0 };
export const Vuni = p => -UNI.E * p[0];                          // V = 0 on the plane through A and B
export function uniPath(t) {
  const s = t / UNI.run, p = [UNI.A[0] + (UNI.C[0] - UNI.A[0]) * s, 0, UNI.A[2] + (UNI.C[2] - UNI.A[2]) * s];
  return { s, p, V: Vuni(p), U: UNI.q * Vuni(p) };
}
// −∫E·ds along a polyline, one step at a time
export function lineIntegral(Efn, pts) {
  let dV = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], e = Efn(m);
    dV -= e[0] * (b[0] - a[0]) + e[1] * (b[1] - a[1]) + e[2] * (b[2] - a[2]);
  }
  return dV;
}
// the organizer's second example: E = 4x N/C, from x = 0 to 4 m
export const VARY = { E: x => 4 * x, x1: 4, dV: -2 * 16 };

// ---------- 4 · the potential hill of one point charge ----------
export const HILL = { Q: 1 * nC, R: 0.40, levels: [30, 60, 90, 120, 150], T: 9 };
export const hillProbe = t => sweep(t, 0.34, 0.075, HILL.T);

// ---------- 5 · a dipole ----------
export const DIP = { q: 1 * nC, a: 0.10, X: 0.36, Z: 0.26, levels: [10, 20, 40, 80, 160], axisX: 0.20, bisZ: 0.15 };
DIP.charges = [{ q: DIP.q, p: [-DIP.a, 0, 0] }, { q: -DIP.q, p: [DIP.a, 0, 0] }];
export const Vdip = p => Vsum(DIP.charges, p);
export const Edip = p => Esum(DIP.charges, p);
export const VdipAxis = x => -2 * DIP.a * K * DIP.q / (x * x - DIP.a * DIP.a);   // beyond −q, x > a
// a field line: follow E (unit steps) from a start point until it ends on a charge or leaves the box
export function fieldLine(charges, start, { step = 0.002, maxLen = 1.4, box = [DIP.X, DIP.Z], stopR = 0.012 } = {}) {
  const pts = [start.slice()];
  let p = start.slice(), len = 0;
  const dir = q => { const e = Esum(charges, q), m = Math.hypot(...e); return [e[0] / m, e[1] / m, e[2] / m]; };
  while (len < maxLen) {
    const d1 = dir(p), mid = [p[0] + d1[0] * step / 2, p[1] + d1[1] * step / 2, p[2] + d1[2] * step / 2], d2 = dir(mid);
    p = [p[0] + d2[0] * step, p[1] + d2[1] * step, p[2] + d2[2] * step]; len += step;
    pts.push(p);
    if (Math.abs(p[0]) > box[0] || Math.abs(p[2]) > box[1]) break;
    if (charges.some(c => c.q < 0 && dist(p, c.p) < stopR)) break;
  }
  return pts;
}
// equipotential contours on the y = 0 plane: marching squares over a grid
export function contours(Vfn, level, x0, x1, z0, z1, n) {
  const segs = [], dx = (x1 - x0) / n, dz = (z1 - z0) / n, g = [];
  for (let i = 0; i <= n; i++) { g.push([]); for (let j = 0; j <= n; j++) g[i].push(Vfn([x0 + i * dx, 0, z0 + j * dz]) - level); }
  const lerp = (a, b, va, vb) => { const u = va / (va - vb); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], v = c.map(([a, b]) => g[a][b]);
    if (v.some(x => !isFinite(x))) continue;
    const cross = [];
    for (let k = 0; k < 4; k++) { const a = c[k], b = c[(k + 1) % 4], va = v[k], vb = v[(k + 1) % 4]; if ((va > 0) !== (vb > 0)) cross.push(lerp(a, b, va, vb)); }
    for (let k = 0; k + 1 < cross.length; k += 2) segs.push(cross[k].map((u, m) => m ? z0 + u * dz : x0 + u * dx), cross[k + 1].map((u, m) => m ? z0 + u * dz : x0 + u * dx));
  }
  return segs;     // pairs of [x, z]
}

// ---------- 6 · a uniformly charged rod ----------
export const ROD = { Q: 3 * nC, L: 0.30, bisA: 0.10, T: 10 };
ROD.lam = ROD.Q / ROD.L;
export const VrodAxis = a => K * ROD.lam * Math.log((a + ROD.L) / a);                       // a beyond one end
export const VrodBis = a => { const s = Math.sqrt(ROD.L ** 2 + 4 * a * a); return K * ROD.lam * Math.log((ROD.L + s) / (-ROD.L + s)); };
export const rodProbe = t => sweep(t, 0.05, 0.30, ROD.T);
// the rod lies on x from 0 to L; sum k dq / r over N slices
export function rodSum(N, p) {
  let V = 0; const dq = ROD.Q / N;
  for (let i = 0; i < N; i++) { const x = (i + 0.5) * ROD.L / N; V += K * dq / Math.hypot(p[0] - x, p[1], p[2]); }
  return V;
}

// ---------- 7 · ring, arc and disc ----------
export const RING = { Q: 2 * nC, R: 0.15, T: 10 };
export const Vring = z => K * RING.Q / Math.sqrt(RING.R ** 2 + z * z);
export const ARC = { Q: 2 * nC, R: 0.15, span: Math.PI };
export const Varc0 = K * ARC.Q / ARC.R;
export const DISC = { Q: 2 * nC, R: 0.15 };
DISC.sigma = DISC.Q / (Math.PI * DISC.R ** 2);
export const Vdisc = z => 2 * Math.PI * K * DISC.sigma * (Math.sqrt(DISC.R ** 2 + z * z) - z);
export const axisProbe = t => sweep(t, 0, 0.25, RING.T);
// numeric versions: N point pieces
export function ringSum(N, z) { let V = 0; for (let i = 0; i < N; i++) { const a = 2 * Math.PI * (i + 0.5) / N; V += K * (RING.Q / N) / Math.hypot(RING.R * Math.cos(a), RING.R * Math.sin(a), z); } return V; }
export function arcSum(N) { let V = 0; for (let i = 0; i < N; i++) { const a = ARC.span * ((i + 0.5) / N - 0.5); V += K * (ARC.Q / N) / Math.hypot(ARC.R * Math.cos(a), ARC.R * Math.sin(a)); } return V; }
// the disc as N thin rings: dq = σ·2πr dr, each adding k dq / √(r² + z²)
export function discSum(N, z) { let V = 0; const dr = DISC.R / N; for (let i = 0; i < N; i++) { const r = (i + 0.5) * dr; V += K * DISC.sigma * 2 * Math.PI * r * dr / Math.hypot(r, z); } return V; }

// ---------- 8 · conducting and insulating spheres ----------
export const SPH = { Q: 2 * nC, R: 0.10, r0: 0.40, run: 5.0 };
export const Econd = r => r < SPH.R ? 0 : K * SPH.Q / (r * r);
export const Vcond = r => r < SPH.R ? K * SPH.Q / SPH.R : K * SPH.Q / r;
export const Eins = r => r < SPH.R ? K * SPH.Q * r / SPH.R ** 3 : K * SPH.Q / (r * r);
export const Vins = r => r < SPH.R ? (K * SPH.Q / SPH.R) * (1.5 - r * r / (2 * SPH.R ** 2)) : K * SPH.Q / r;
export const sphProbe = t => SPH.r0 * (1 - t / SPH.run);      // in from 40 cm to the centre
// V(r) = −∫ from ∞ to r of E dr, numerically (the tail beyond rMax added exactly as kQ/rMax)
export function Vfrom(Efn, r, rMax = 50, n = 200000) {
  // outside: integrate in u = 1/r so the long stretch is cheap (dr = −du/u²); inside: plain dr
  const rs = Math.max(r, SPH.R);
  let V = K * SPH.Q / rMax; const u0 = 1 / rMax, u1 = 1 / rs, du = (u1 - u0) / n;
  for (let i = 0; i < n; i++) { const u = u0 + (i + 0.5) * du; V += Efn(1 / u) * du / (u * u); }
  const dr = (rs - r) / n;
  for (let i = 0; i < n; i++) V += Efn(r + (i + 0.5) * dr) * dr;
  return V;
}

// ---------- 9 · a proton and an electron across 6 V ----------
export const ACC = { Vhi: 7, Vlo: 1, d: 0.06, run: 3.0 };
ACC.dV = ACC.Vhi - ACC.Vlo;
ACC.E = ACC.dV / ACC.d;                                           // 100 V/m, from 7 V toward 1 V
export const speed = (q, dV, m) => Math.sqrt(2 * Math.abs(q * dV) / m);
ACC.vp = speed(E_CH, ACC.dV, M_P);
ACC.ve = speed(E_CH, ACC.dV, M_E);
ACC.Tp = 2 * ACC.d / ACC.vp;
ACC.Te = 2 * ACC.d / ACC.ve;
// u: fraction of its own crossing time. Constant force, so x = d u², v = v_f u
export function accel(u, who) {
  const v = (who === 'p' ? ACC.vp : ACC.ve) * u, s = ACC.d * u * u;
  const x = who === 'p' ? s : ACC.d - s;                          // proton from the 7 V plate, electron from the 1 V plate
  const V = ACC.Vhi - ACC.E * x, q = who === 'p' ? E_CH : -E_CH;
  return { x, v, V, K: 0.5 * (who === 'p' ? M_P : M_E) * v * v, U: q * V, t: u * (who === 'p' ? ACC.Tp : ACC.Te) };
}
export const eV = J => J / E_CH;
