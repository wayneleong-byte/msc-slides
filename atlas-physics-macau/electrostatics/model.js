// Electrostatics model: point charges, charged rods, rings, discs and plates. Pure functions,
// SI units (C, m, N, N/C). Every arrow, field line and number on the page comes from here.

export const K = 8.99e9;            // N·m²/C²
export const EPS0 = 8.85e-12;       // C²/N·m²
export const QE = 1.60e-19;         // C, one elementary charge
export const MP = 1.67e-27;         // kg, proton
export const ME = 9.11e-31;         // kg, electron
export const nC = 1e-9, uC = 1e-6;

// each scene loops: motion, then a short rest, then it starts again
export const SLOW = 1;
export const REST = 0.8;
export const loop = (clock, run) => { const c = (clock * SLOW) % (run + REST); return { t: Math.min(c, run), resting: c > run }; };
// a smooth back-and-forth between a and b over period T
export const sweep = (t, a, b, T) => a + (b - a) * (0.5 - 0.5 * Math.cos(2 * Math.PI * t / T));

// ---------- vectors ----------
export const add = (a, b) => a.map((v, i) => v + b[i]);
export const sub = (a, b) => a.map((v, i) => v - b[i]);
export const mul = (a, k) => a.map(v => v * k);
export const norm = a => Math.hypot(...a);

// field of a point charge q at src, at p:  E = kq/r² r̂  (r̂ points from the charge to p)
export function pointE(q, src, p) {
  const d = sub(p, src), r = norm(d);
  return mul(d, K * q / r ** 3);
}
// superposition: the field of many charges is the vector sum of their fields
export const sumE = (charges, p) => charges.reduce((E, c) => add(E, pointE(c.q, c.at, p)), [0, 0, 0]);
// Coulomb's law, the force on q2 from q1 (q1 at a, q2 at b)
export const force = (q1, a, q2, b) => mul(pointE(q1, a, b), q2);
export const coulomb = (q1, q2, r) => K * Math.abs(q1 * q2) / (r * r);

// ---------- 0 · charge: three carbon atoms (6 protons each) ----------
export const ATOMS = [
  { name: 'neutral atom', p: 6, e: 6 },
  { name: 'negative ion', p: 6, e: 7 },
  { name: 'positive ion', p: 6, e: 5 },
];
export const netCharge = a => (a.p - a.e) * QE;
export const ORBIT_T = 6;           // s per lap of the cartoon electrons

// ---------- 1 · charging: a negative rod brought to a neutral metal sphere ----------
// The rod is 12 point charges along the line of centres. A conducting sphere's surface charge
// near a point charge q at distance d (method of images): the grounded part, which totals −qR/d,
// plus whatever net charge is left, spread evenly.
export const SPHERE = { R: 0.10 };
export const ROD = { L: 0.25, Q: -8 * nC, n: 12, far: 0.38, near: 0.17 };
export const rodCharges = dTip => Array.from({ length: ROD.n }, (_, i) => ({ q: ROD.Q / ROD.n, d: dTip + (i + 0.5) * ROD.L / ROD.n }));
// σ at the surface point in direction u (unit vector; the rod lies along −x)
export function sigma(u, charges, Qnet, R = SPHERE.R) {
  const cosT = -u[0];
  let s = 0, induced = 0;
  for (const { q, d } of charges) {
    s += -q * (d * d - R * R) / (4 * Math.PI * R * (R * R + d * d - 2 * R * d * cosT) ** 1.5);
    induced += -q * R / d;
  }
  return s + (Qnet - induced) / (4 * Math.PI * R * R);
}
export const groundedCharge = charges => charges.reduce((s, c) => s - c.q * SPHERE.R / c.d, 0);
// the induction cycle: bring the rod near, ground the sphere, cut the ground, take the rod away
export const INDUCE = { approach: 2.2, hold: 1.6, ground: 2.0, cut: 1.2, leave: 2.2, after: 1.8 };
INDUCE.run = Object.values(INDUCE).reduce((a, b) => a + b, 0);
export const QG = groundedCharge(rodCharges(ROD.near));     // charge left behind by grounding
export function induce(t) {
  const P = INDUCE, ease = u => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(Math.max(u, 0), 1));
  let t0 = 0, stageT = 0;
  const seg = len => { const u = (t - t0) / len; if (u >= 0 && u < 1) stageT = t - t0; t0 += len; return u; };
  const uA = seg(P.approach), uH = seg(P.hold), uG = seg(P.ground), uC = seg(P.cut), uL = seg(P.leave);
  let dTip = ROD.far, stage = 'neutral', grounded = false, Qnet = 0, rod = true;
  if (uA < 1) { dTip = ROD.far + (ROD.near - ROD.far) * ease(uA); stage = 'rod brought near'; }
  else if (uH < 1) { dTip = ROD.near; stage = 'charges separate'; }
  else if (uG < 1) { dTip = ROD.near; stage = 'grounded'; grounded = true; Qnet = QG; }
  else if (uC < 1) { dTip = ROD.near; stage = 'ground cut'; Qnet = QG; }
  else if (uL < 1) { dTip = ROD.near + (ROD.far + 0.6 - ROD.near) * ease(uL); stage = 'rod taken away'; Qnet = QG; }
  else { dTip = 99; stage = 'charged by induction'; Qnet = QG; rod = false; stageT = t - t0; }
  return { dTip, stage, stageT, grounded, Qnet, rod, charges: rod ? rodCharges(dTip) : [] };
}

// a charged balloon near a wall: each molecule of the wall is stretched into a small dipole
// along the balloon's field (polarization). The balloon is treated as a point charge.
export const BALLOON = { q: 3 * nC, r: 0.12, gapNear: 0.03, gapFar: 0.16, T: 6 };
export const balloonGap = t => sweep(t, BALLOON.gapFar, BALLOON.gapNear, BALLOON.T);

// ---------- 2 · Coulomb's law ----------
export const PAIR = { q1: 4 * uC, q2: -2 * uC, like: 2 * uC, rMin: 0.20, rMax: 0.45, T: 7 };
export const pairR = t => sweep(t, PAIR.rMax, PAIR.rMin, PAIR.T);
// two people at arm's length (1 m), each with 1% more protons than electrons
export const PEOPLE = { m: 82, protonShare: 0.5, extra: 0.01, r: 1, earth: 5.98e24 };
PEOPLE.q = PEOPLE.m * PEOPLE.protonShare / MP * QE * PEOPLE.extra;
PEOPLE.F = coulomb(PEOPLE.q, PEOPLE.q, PEOPLE.r);
PEOPLE.a = PEOPLE.F / PEOPLE.earth;

// ---------- 3 · net force and the equilibrium point ----------
export const LINE = { qA: 4 * uC, qB: 1 * uC, D: 0.45, q0: 0.1 * uC, x0: 0.12, x1: 0.38, T: 8 };
LINE.xEq = LINE.D * Math.sqrt(LINE.qA) / (Math.sqrt(LINE.qA) + Math.sqrt(LINE.qB));
// unlike charges (+qA, −qB): the balance point is outside, beyond the smaller charge
LINE.xEqUnlike = LINE.D * Math.sqrt(LINE.qA) / (Math.sqrt(LINE.qA) - Math.sqrt(LINE.qB));
export const lineCharges = (sB = 1) => [{ q: LINE.qA, at: [0, 0, 0] }, { q: sB * LINE.qB, at: [LINE.D, 0, 0] }];
export const lineX = t => sweep(t, LINE.x0, LINE.x1, LINE.T);
export function lineForces(x, sB = 1) {
  const p = [x, 0, 0], [A, B] = lineCharges(sB);
  const FA = force(A.q, A.at, LINE.q0, p), FB = force(B.q, B.at, LINE.q0, p);
  return { FA, FB, net: add(FA, FB) };
}

// ---------- 4 · the field of a point charge ----------
export const POINT = { Q: 1 * nC, q0: 0.1 * nC, rings: [0.1, 0.2, 0.3], dirs: 8, r0: 0.11, r1: 0.33, ang: 22.5 * Math.PI / 180, T: 7 };
export const pointMag = (Q, r) => K * Math.abs(Q) / (r * r);
export const testR = t => sweep(t, POINT.r0, POINT.r1, POINT.T);

// ---------- 5 · the electric dipole ----------
export const DIPOLE = { q: 2 * nC, a: 0.10, x0: 0.20, x1: 0.30, y0: 0.10, y1: 0.25, T: 8 };
export const dipoleCharges = () => [{ q: DIPOLE.q, at: [DIPOLE.a, 0, 0] }, { q: -DIPOLE.q, at: [-DIPOLE.a, 0, 0] }];
// on the axis, at x > a:   E = 4kqax / (x² − a²)²  (+x)
export const dipoleAxis = (x, q = DIPOLE.q, a = DIPOLE.a) => 4 * K * q * a * x / (x * x - a * a) ** 2;
// on the bisector, at height y:   E = 2kqa / (a² + y²)^{3/2}  (−x, from + toward −)
export const dipoleBisector = (y, q = DIPOLE.q, a = DIPOLE.a) => 2 * K * q * a / (a * a + y * y) ** 1.5;
export const dipoleX = t => sweep(t, DIPOLE.x1, DIPOLE.x0, DIPOLE.T);
export const dipoleY = t => sweep(t, DIPOLE.y1, DIPOLE.y0, DIPOLE.T);

// field lines, traced by stepping along E (RK2), in the plane z = 0
export function traceLine(charges, start, { step = 0.004, maxLen = 1.6, box = 0.6, stopR = 0.012, dir = 1 } = {}) {
  const pts = [start.slice()];
  let p = start.slice(), len = 0;
  const unit = q => { const E = sumE(charges, q), m = norm(E); return m > 0 ? mul(E, dir / m) : [0, 0, 0]; };
  while (len < maxLen) {
    const k1 = unit(p), mid = add(p, mul(k1, step / 2)), k2 = unit(mid);
    p = add(p, mul(k2, step)); len += step; pts.push(p);
    if (Math.abs(p[0]) > box || Math.abs(p[1]) > box) break;
    if (charges.some(c => norm(sub(p, c.at)) < stopR && Math.sign(c.q) === -dir)) break;
  }
  return pts;
}
export function dipoleLines(n = 16) {
  const ch = dipoleCharges(), [P] = ch, out = [];
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) / n * 2 * Math.PI;
    out.push(traceLine(ch, [P.at[0] + 0.012 * Math.cos(th), 0.012 * Math.sin(th), 0], { maxLen: 1.4, box: 0.55 }));
  }
  return out;
}

// ---------- 6 · a uniformly charged rod ----------
export const RODE = { L: 0.40, Q: 4 * nC, a0: 0.05, a1: 0.30, b0: 0.10, b1: 0.35, T: 8, slices: 6 };
RODE.lambda = RODE.Q / RODE.L;
// P on the axis, a distance a past the end:   E = kQ / (a(a + L))
export const rodAxis = (a, Q = RODE.Q, L = RODE.L) => K * Q / (a * (a + L));
// P on the perpendicular bisector, a distance a from the middle:   E = kQ / (a √(L²/4 + a²))
export const rodBisector = (a, Q = RODE.Q, L = RODE.L) => K * Q / (a * Math.sqrt(L * L / 4 + a * a));
// the rod cut into n equal slices dq = λ dx, each a point charge at its centre
export const rodSlices = (n, Q = RODE.Q, L = RODE.L) => Array.from({ length: n }, (_, i) => ({ q: Q / n, at: [-L / 2 + (i + 0.5) * L / n, 0, 0] }));
export const rodA = t => sweep(t, RODE.a1, RODE.a0, RODE.T);
export const rodB = t => sweep(t, RODE.b1, RODE.b0, RODE.T);

// ---------- 7 · a ring of charge, and a disc ----------
// the ring lies in the yz plane, centred on the origin; P moves out along its axis (x)
export const RING = { R: 0.20, Q: 15 * nC, z0: 0.0, z1: 0.45, T: 9, beads: 12 };
export const ringAxis = (z, Q = RING.Q, R = RING.R) => K * Q * z / (z * z + R * R) ** 1.5;
export const RING_ZMAX = RING.R / Math.SQRT2;             // dE/dz = 0 there
export const ringBeads = (n, Q = RING.Q, R = RING.R) => Array.from({ length: n }, (_, i) => { const th = (i + 0.5) / n * 2 * Math.PI; return { q: Q / n, at: [0, R * Math.cos(th), R * Math.sin(th)] }; });
export const ringZ = t => sweep(t, RING.z0, RING.z1, RING.T);
// a disc of radius R, charge density σ: a stack of rings 0 < r < R
export const DISC = { R: 0.20, sigma: 15 * nC / (Math.PI * 0.2 * 0.2) };
export const discAxis = (z, sigma = DISC.sigma, R = DISC.R) => sigma / (2 * EPS0) * (1 - z / Math.sqrt(z * z + R * R));

// ---------- 8 · a charge in a uniform field: an electron between two charged plates ----------
export const PLATES = { E: 5000, gap: 0.02, L: 0.08, v0: 2.0e7, show: 3.2 };   // the 4 ns crossing is shown in 3.2 s
PLATES.a = QE * PLATES.E / ME;                    // up, toward the + plate
PLATES.tCross = PLATES.L / PLATES.v0;
PLATES.yExit = 0.5 * PLATES.a * PLATES.tCross ** 2;
PLATES.vyExit = PLATES.a * PLATES.tCross;
PLATES.angle = Math.atan2(PLATES.vyExit, PLATES.v0) * 180 / Math.PI;
PLATES.yProton = 0.5 * (QE * PLATES.E / MP) * PLATES.tCross ** 2;
PLATES.run = 1.45 * PLATES.tCross;               // past the plates it coasts in a straight line
export function electron(tReal) {
  const t = Math.min(tReal, PLATES.tCross), s = Math.max(tReal - PLATES.tCross, 0), inside = tReal <= PLATES.tCross;
  return { x: PLATES.v0 * (t + s), y: 0.5 * PLATES.a * t * t + PLATES.vyExit * s, vx: PLATES.v0, vy: PLATES.a * t, F: inside ? QE * PLATES.E : 0, inside };
}
