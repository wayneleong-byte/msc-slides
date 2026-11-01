// Magnetic fields model: moving charges and currents in B, and the B that currents make.
// Pure functions, SI units (metres, amperes, tesla). Every field line, arrow and number on the
// page comes from here. Fields of currents are Biot–Savart sums over straight pieces of wire.
// Vectors are [x, y, z] arrays.

export const MU0 = 4 * Math.PI * 1e-7;          // T·m/A
export const QE = 1.60e-19;                     // C
export const MP = 1.67e-27;                     // proton mass, kg
export const SLOW = 1;

// ---------- small vector helpers ----------
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = a => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);   // not Math.hypot: field lines call this ~10⁶ times at load
export const breathe = (t, lo, hi, T) => lo + (hi - lo) * (1 - Math.cos(2 * Math.PI * t / T)) / 2;
const D2R = Math.PI / 180;

// ---------- the Lorentz force ----------
export const lorentz = (q, v, B, E = [0, 0, 0]) => mul(add(E, cross(v, B)), q);

// ---------- Biot–Savart ----------
// a straight piece of wire from A to B carrying I, at P: the integral of μ₀I/4π · dl × r̂ / r² done exactly
export function segB(A, B, I, P) { return polyB([A, B], I, P, false); }
// a wire through the points pts (closed: back to the first). Written out in scalars, since tracing
// field lines calls it hundreds of thousands of times while the page loads.
export function polyB(pts, I, P, closed = true) {
  let sx = 0, sy = 0, sz = 0;
  const n = pts.length, m = closed ? n : n - 1, k0 = MU0 * I / (4 * Math.PI), px = P[0], py = P[1], pz = P[2];
  for (let i = 0; i < m; i++) {
    const A = pts[i], B = pts[(i + 1) % n];
    const ax = A[0] - px, ay = A[1] - py, az = A[2] - pz, bx = B[0] - px, by = B[1] - py, bz = B[2] - pz;
    const la = Math.sqrt(ax * ax + ay * ay + az * az), lb = Math.sqrt(bx * bx + by * by + bz * bz);
    const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx, cc = cx * cx + cy * cy + cz * cz, ab = ax * bx + ay * by + az * bz;
    if (cc < 1e-40 * la * la * lb * lb) continue;            // on the wire's line
    // la·lb + a·b, written so it keeps its digits when a and b point nearly opposite (long pieces)
    const s = ab >= 0 ? la * lb + ab : cc / (la * lb - ab), f = k0 * (la + lb) / (la * lb * s);
    sx += cx * f; sy += cy * f; sz += cz * f;
  }
  return [sx, sy, sz];
}
// the same sum done the slow way: every piece cut into n bits dl, each adding μ₀I/4π · dl × r / r³
export function bsNumeric(pts, I, P, n = 400, closed = true) {
  let s = [0, 0, 0];
  const N = pts.length, m = closed ? N : N - 1;
  for (let i = 0; i < m; i++) {
    const A = pts[i], d = mul(sub(pts[(i + 1) % N], A), 1 / n);
    for (let j = 0; j < n; j++) {
      const r = sub(P, add(A, mul(d, j + 0.5))), rl = len(r);
      s = add(s, mul(cross(d, r), MU0 * I / (4 * Math.PI * rl ** 3)));
    }
  }
  return s;
}
// a circle of n points, radius R about centre c, normal to axis 'x' | 'y' | 'z'; current runs so
// the right-hand rule gives +axis
export function circlePts(c, R, axis, n = 64) {
  return Array.from({ length: n }, (_, i) => {
    const a = 2 * Math.PI * i / n, u = R * Math.cos(a), v = R * Math.sin(a);
    return axis === 'x' ? [c[0], c[1] + u, c[2] + v] : axis === 'y' ? [c[0] + v, c[1], c[2] + u] : [c[0] + u, c[1] + v, c[2]];
  });
}
// a line integral ∮ B · ds around a closed path of points
export function lineIntegral(F, pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += dot(F(mul(add(a, b), 0.5)), sub(b, a)); }
  return s;
}
// flux of F through a sphere, split into the part going out and the part coming in
export function sphereFlux(F, c, R, n = 60) {
  let out = 0, inn = 0; const dth = Math.PI / n, dph = Math.PI / n;
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * dth, st = Math.sin(th), ct = Math.cos(th);
    for (let j = 0; j < 2 * n; j++) {
      const ph = (j + 0.5) * dph, nh = [ct, st * Math.cos(ph), st * Math.sin(ph)];
      const d = dot(F(add(c, mul(nh, R))), nh) * R * R * st * dth * dph;
      if (d > 0) out += d; else inn += d;
    }
  }
  return { out, in: inn, total: out + inn };
}

// ---------- field lines: follow B with fixed steps (RK4 on the unit direction) ----------
function trace(F, start, step, max, dir, inside) {
  const pts = [start]; let p = start;
  const u = q => { const e = F(q), m = len(e); return m < 1e-15 ? [0, 0, 0] : mul(e, dir / m); };
  for (let k = 0; k < max; k++) {
    const k1 = u(p), k2 = u(add(p, mul(k1, step / 2))), k3 = u(add(p, mul(k2, step / 2))), k4 = u(add(p, mul(k3, step)));
    const np = add(p, mul(add(add(k1, mul(k2, 2)), add(mul(k3, 2), k4)), step / 6));
    if (len(sub(np, p)) < step * 0.5) break;
    pts.push(np); p = np;
    if (k > 20 && len(sub(np, start)) < step * 1.1) { pts.push(start); return { pts, closed: true }; }
    if (!inside(np)) break;
  }
  return { pts, closed: false };
}
// a whole line through start: closed if it comes back, else traced both ways to the edge of the box
export function fieldLine(F, start, { step = 0.003, max = 1500, inside = () => true } = {}) {
  const f = trace(F, start, step, max, 1, inside);
  if (f.closed) return f.pts;
  const b = trace(F, start, step, max, -1, inside);
  return [...b.pts.reverse(), ...f.pts.slice(1)];
}

// ======================================================================
// 1 · a bar magnet: a magnetized bar is a sheet of current around its sides (Ampère's model),
//     here 40 square loops stacked along x; N is at +x
// ======================================================================
export const MAG = { L: 0.20, w: 0.05, K: 2.4e5, n: 40 };   // K: surface current, A per metre of length
MAG.loops = Array.from({ length: MAG.n }, (_, i) => {
  const x = -MAG.L / 2 + (i + 0.5) * MAG.L / MAG.n, h = MAG.w / 2;
  return [[x, -h, -h], [x, h, -h], [x, h, h], [x, -h, h]];       // circulates so μ points +x
});
MAG.I = MAG.K * MAG.L / MAG.n;                                   // 1200 A·turns per loop
export const magnetB = P => MAG.loops.reduce((s, l) => add(s, polyB(l, MAG.I, P)), [0, 0, 0]);
// a closed box round the N end; its inner face sits halfway between two of the loops
export const MAG_BOX = { c: [MAG.L / 2, 0, 0], h: 0.045 };        // inner face at x = 5.5 cm; the loops sit at 5.25 and 5.75
// flux of F out through each face of a cube of half-side h at c (+x −x +y −y +z −z), split into out and in
export function boxFlux(F, c, h, n = 60) {
  let out = 0, inn = 0;
  for (let axis = 0; axis < 3; axis++) for (const sgn of [1, -1]) {
    const u = (axis + 1) % 3, v = (axis + 2) % 3, dA = (2 * h / n) ** 2;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const p = c.slice(); p[axis] += sgn * h; p[u] += -h + (i + 0.5) * 2 * h / n; p[v] += -h + (j + 0.5) * 2 * h / n;
      const d = sgn * F(p)[axis] * dA;
      if (d > 0) out += d; else inn += d;
    }
  }
  return { out, in: inn, total: out + inn };
}

// ======================================================================
// 2 · the force on a moving charge: a proton and an electron, v sweeping round from along B to against it
// ======================================================================
export const RHR = { v: 2.0e5, B: 0.50, T: 16 };
RHR.Fmax = QE * RHR.v * RHR.B;                                   // 1.6×10⁻¹⁴ N
export const rhrAngle = t => breathe(t, 0, 180, RHR.T);           // θ between v and B, degrees
export const rhrV = deg => mul([Math.cos(deg * D2R), 0, Math.sin(deg * D2R)], RHR.v);   // B is along +x
export const rhrForce = (q, deg) => lorentz(q, rhrV(deg), [RHR.B, 0, 0]);

// ======================================================================
// 3 · protons circling in a uniform field (B down, −y), launched along +x from the same point
// ======================================================================
export const CYC = { B: 0.10, dV: [50, 200], show: 7 };          // show: seconds of page time per orbit
CYC.v = CYC.dV.map(V => Math.sqrt(2 * QE * V / MP));             // from qΔV = ½mv²
CYC.r = CYC.v.map(v => MP * v / (QE * CYC.B));
CYC.omega = QE * CYC.B / MP;
CYC.T = 2 * Math.PI / CYC.omega;
CYC.f = 1 / CYC.T;
// closed form: the centre is r to the −z side of the start point
export function orbit(i, t) {
  const r = CYC.r[i], w = CYC.omega, c = [0, 0, -r];
  const p = add(c, [r * Math.sin(w * t), 0, r * Math.cos(w * t)]);
  const v = [r * w * Math.cos(w * t), 0, -r * w * Math.sin(w * t)];
  return { p, v, F: lorentz(QE, v, [0, -CYC.B, 0]) };
}
export const cycTime = clock => (clock / CYC.show) * CYC.T;      // page seconds → real seconds
// the same motion by stepping m dv/dt = q v × B forward (RK4), for the checks
export function pushCharge(q, m, p0, v0, E, B, dt, steps) {
  let p = p0, v = v0;
  const acc = vv => mul(lorentz(q, vv, B, E), 1 / m);
  for (let k = 0; k < steps; k++) {
    const a1 = acc(v), v1 = v;
    const a2 = acc(add(v, mul(a1, dt / 2))), v2 = add(v, mul(a1, dt / 2));
    const a3 = acc(add(v, mul(a2, dt / 2))), v3 = add(v, mul(a2, dt / 2));
    const a4 = acc(add(v, mul(a3, dt))), v4 = add(v, mul(a3, dt));
    p = add(p, mul(add(add(v1, mul(v2, 2)), add(mul(v3, 2), v4)), dt / 6));
    v = add(v, mul(add(add(a1, mul(a2, 2)), add(mul(a3, 2), a4)), dt / 6));
  }
  return { p, v };
}

// ======================================================================
// 4 · the velocity selector: E down (−y) between two plates, B into the page (−z)
// ======================================================================
export const SEL = { E: 1000, B: 0.010, L: 0.10, gap: 0.04, k: [0.8, 1, 1.25], show: 3.2, rest: 1.2 };
SEL.v0 = SEL.E / SEL.B;                                          // 1.0×10⁵ m/s goes straight
SEL.dV = SEL.E * SEL.gap;                                        // 40 V across the plates
SEL.cross = SEL.L / SEL.v0;                                      // 1.0 μs to cross at v0
// each proton's path, stepped from the left edge at mid-gap until it leaves the plates
SEL.paths = SEL.k.map(k => {
  const dt = SEL.cross / 600, pts = [{ t: 0, p: [0, 0, 0], v: [k * SEL.v0, 0, 0] }];
  let s = pts[0];
  while (s.p[0] < SEL.L && Math.abs(s.p[1]) < SEL.gap / 2 && pts.length < 5000) {
    const n = pushCharge(QE, MP, s.p, s.v, [0, -SEL.E, 0], [0, 0, -SEL.B], dt, 1);
    s = { t: s.t + dt, p: n.p, v: n.v }; pts.push(s);
  }
  return pts;
});
export const selTime = clock => clock / SEL.show * SEL.cross;    // page seconds → real seconds
export function selAt(i, t) {
  const P = SEL.paths[i], dt = P[1].t, j = Math.min(Math.floor(t / dt), P.length - 1);
  return P[j];
}
export const selForces = s => ({ FE: [0, -QE * SEL.E, 0], FB: lorentz(QE, s.v, [0, 0, -SEL.B]) });
// Hall effect, the same balance inside a strip of copper: qE = q v_d B, ΔV_H = v_d B d = IBd / (nqA)
export const HALL = { I: 5.0, B: 1.0, d: 0.02, t: 0.001, n: 8.5e28 };
HALL.A = HALL.d * HALL.t;
HALL.vd = HALL.I / (HALL.n * QE * HALL.A);
HALL.V = HALL.vd * HALL.B * HALL.d;

// ======================================================================
// 5 · a rectangular loop in a uniform field (B along +x), turning about the vertical axis
// ======================================================================
export const LOOP = { I: 2.0, a: 0.20, b: 0.30, B: 0.50, T: 18 };
LOOP.A = LOOP.a * LOOP.b;
LOOP.mu = LOOP.I * LOOP.A;                                       // 0.12 A·m²
LOOP.tmax = LOOP.mu * LOOP.B;                                    // 0.060 N·m
export const loopAngle = t => breathe(t, 0, 180, LOOP.T);         // θ between μ and B, degrees
// the four sides at angle θ (centre at the origin): ends, current, I L × B, and the moment arm
export function loopSides(deg) {
  const th = deg * D2R, t = [-Math.sin(th), 0, Math.cos(th)], y = [0, 1, 0];
  const c = (s, u) => add(mul(t, s * LOOP.a / 2), mul(y, u * LOOP.b / 2));
  const P = [c(-1, -1), c(-1, 1), c(1, 1), c(1, -1)];             // up, across, down, back: μ = IA n̂, n̂ = ŷ × t̂
  const B = [LOOP.B, 0, 0];
  return P.map((A, i) => {
    const Bend = P[(i + 1) % 4], L = sub(Bend, A);
    return { A, B: Bend, mid: mul(add(A, Bend), 0.5), L, F: mul(cross(L, B), LOOP.I) };
  });
}
export const loopMu = deg => mul([Math.cos(deg * D2R), 0, Math.sin(deg * D2R)], LOOP.mu);
export const loopTorque = deg => loopSides(deg).reduce((s, d) => add(s, cross(d.mid, d.F)), [0, 0, 0]);
export const loopU = deg => -dot(loopMu(deg), [LOOP.B, 0, 0]);
// a semicircular wire of radius R across B (⊥ to its plane): ∫ I ds × B, summed in n pieces
export function semicircleForce(I, R, B, n = 2000) {
  let s = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (1 - i / n), a1 = Math.PI * (1 - (i + 1) / n);   // left end to right end, over the top
    s = add(s, mul(cross(sub([R * Math.cos(a1), R * Math.sin(a1), 0], [R * Math.cos(a0), R * Math.sin(a0), 0]), [0, 0, -B]), I));
  }
  return s;
}

// ======================================================================
// 6 · a long straight wire (up, +y), its Amperian circle, and the flux through a rectangle beside it
// ======================================================================
export const AMP = { I: 20, a: 0.01, rMin: 0.05, rMax: 0.12, T: 12, half: 50 };
export const wireB = P => segB([0, -AMP.half, 0], [0, AMP.half, 0], AMP.I, P);   // 100 m of wire: "infinite"
export const ampereB = r => r < AMP.a ? MU0 * AMP.I * r / (2 * Math.PI * AMP.a ** 2) : MU0 * AMP.I / (2 * Math.PI * r);
export const ampR = t => breathe(t, AMP.rMin, AMP.rMax, AMP.T);
export const FLUX = { a: 0.05, c: 0.15, b: 0.25, strips: 6 };
FLUX.phi = MU0 * AMP.I * FLUX.b / (2 * Math.PI) * Math.log((FLUX.a + FLUX.c) / FLUX.a);
// the rectangle lies in the plane z = 0 on the +x side; its normal is −z (into the page), along B there
export function fluxStrips(n = FLUX.strips, sub_ = 50) {
  const out = []; const dr = FLUX.c / n;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < sub_; j++) {
      const r = FLUX.a + (i + (j + 0.5) / sub_) * dr;
      s += -wireB([r, 0, 0])[2] * FLUX.b * dr / sub_;
    }
    out.push(s);
  }
  return out;
}

// ======================================================================
// 7 · Biot–Savart for a circular loop (in the yz plane, normal +x), and the field along its axis
// ======================================================================
export const RING = { R: 0.15, I: 10, zMax: 0.36, T: 14, pieces: 12 };
RING.pts = circlePts([0, 0, 0], RING.R, 'x', 96);
RING.Bc = MU0 * RING.I / (2 * RING.R);                           // 41.9 μT at the centre
export const ringB = P => polyB(RING.pts, RING.I, P);
export const ringAxis = z => MU0 * RING.I * RING.R ** 2 / (2 * (RING.R ** 2 + z * z) ** 1.5);
export const ringFar = z => MU0 * RING.I * RING.R ** 2 / (2 * Math.abs(z) ** 3);
export const ringZ = t => breathe(t, 0, RING.zMax, RING.T);
// n pieces dl of the loop, each with its dB at the axis point (z, 0, 0)
export function ringPieces(z, n = RING.pieces) {
  return Array.from({ length: n }, (_, i) => {
    const a = 2 * Math.PI * (i + 0.5) / n, at = [0, RING.R * Math.cos(a), RING.R * Math.sin(a)];
    const dl = mul([0, -Math.sin(a), Math.cos(a)], 2 * Math.PI * RING.R / n);
    const r = sub([z, 0, 0], at), rl = len(r);
    return { at, dl, r, dB: mul(cross(dl, r), MU0 * RING.I / (4 * Math.PI * rl ** 3)) };
  });
}

// ======================================================================
// 8 · two long parallel wires along y, d apart: same direction, and opposite
// ======================================================================
export const WIRES = { I: 20, d: 0.20, L: 0.45 };
WIRES.FL = MU0 * WIRES.I * WIRES.I / (2 * Math.PI * WIRES.d);    // force per metre, 4.0×10⁻⁴ N/m
// the field of the pair (wire 1 at x = −d/2 carrying +I, wire 2 at +d/2 carrying sign·I)
export const pairB = sign => P => add(segB([-WIRES.d / 2, -50, 0], [-WIRES.d / 2, 50, 0], WIRES.I, P), segB([WIRES.d / 2, -50, 0], [WIRES.d / 2, 50, 0], sign * WIRES.I, P));
// the force on a length L of wire 2 from wire 1's field there, F = I L × B
export function pairForce(sign, L = 1) {
  const B1 = segB([-WIRES.d / 2, -50, 0], [-WIRES.d / 2, 50, 0], WIRES.I, [WIRES.d / 2, 0, 0]);
  return { B1, F: mul(cross([0, sign * L, 0], B1), WIRES.I) };
}

// ======================================================================
// 9 · a solenoid (40 stacked loops along x) and a toroid (36 turns round a ring, axis y)
// ======================================================================
export const SOL = { N: 40, L: 0.40, R: 0.06, I: 2.0 };
SOL.n = SOL.N / SOL.L;                                           // 100 turns per metre
SOL.B = MU0 * SOL.n * SOL.I;                                     // 251 μT, the long-solenoid value
SOL.loops = Array.from({ length: SOL.N }, (_, i) => circlePts([-SOL.L / 2 + (i + 0.5) * SOL.L / SOL.N, 0, 0], SOL.R, 'x', 36));
export const solB = P => SOL.loops.reduce((s, l) => add(s, polyB(l, SOL.I, P)), [0, 0, 0]);
// on the axis of a smooth sheet of current: μ₀nI/2 · (cos of the angle to each end)
export const solAxis = x => MU0 * SOL.n * SOL.I / 2 * ((x + SOL.L / 2) / Math.hypot(x + SOL.L / 2, SOL.R) - (x - SOL.L / 2) / Math.hypot(x - SOL.L / 2, SOL.R));
// the Amperian rectangle: from x = −h to h, along the axis inside and back at y = Y outside
export const SOL_RECT = { h: 0.10, Y: 0.14 };
export function rectPath(h = SOL_RECT.h, Y = SOL_RECT.Y, n = 400) {
  const pts = [];
  const leg = (a, b) => { for (let i = 0; i < n; i++) pts.push(add(a, mul(sub(b, a), i / n))); };
  leg([-h, 0, 0], [h, 0, 0]); leg([h, 0, 0], [h, Y, 0]); leg([h, Y, 0], [-h, Y, 0]); leg([-h, Y, 0], [-h, 0, 0]);
  return pts;
}
export const rectTurns = (h = SOL_RECT.h) => SOL.loops.filter(l => Math.abs(l[0][0]) < h).length;

export const TOR = { N: 36, R0: 0.13, a: 0.03, I: 2.0, T: 14, rMin: 0.05, rMax: 0.21 };
TOR.turns = Array.from({ length: TOR.N }, (_, k) => {
  const ph = 2 * Math.PI * (k + 0.5) / TOR.N, rh = [Math.cos(ph), 0, Math.sin(ph)], c = mul(rh, TOR.R0);
  return Array.from({ length: 24 }, (_, i) => { const a = 2 * Math.PI * i / 24; return add(c, add(mul(rh, TOR.a * Math.cos(a)), [0, TOR.a * Math.sin(a), 0])); });
});
export const torB = P => TOR.turns.reduce((s, l) => add(s, polyB(l, TOR.I, P)), [0, 0, 0]);
export const torIdeal = r => (r > TOR.R0 - TOR.a && r < TOR.R0 + TOR.a) ? MU0 * TOR.N * TOR.I / (2 * Math.PI * r) : 0;
export const torR = t => breathe(t, TOR.rMin, TOR.rMax, TOR.T);
