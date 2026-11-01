// Gauss's law model: flux, and the field of each symmetric charge in the organizer's list.
// Pure functions, SI units (metres, coulombs, N/C). Every arrow, surface and number on the page
// comes from here. Vectors are [x, y, z] arrays.

export const EPS0 = 8.85e-12;                   // C²/N·m²
export const K = 1 / (4 * Math.PI * EPS0);      // 8.99×10⁹ N·m²/C²
export const D = 10;                            // drawn: 10 cm of the real thing = 1 grid square
export const SLOW = 1;

// ---------- small vector helpers ----------
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len = a => Math.hypot(a[0], a[1], a[2]);

// a radius (or angle) that breathes slowly between lo and hi, period T seconds
export const breathe = (t, lo, hi, T) => lo + (hi - lo) * (1 - Math.cos(2 * Math.PI * t / T)) / 2;

// ---------- numeric surface integrals: ∮ E · dA ----------
// a sphere, midpoint rule in θ and φ; dA = R² sin θ dθ dφ, pointing outward
export function sphereFlux(E, c, R, n = 90) {
  let s = 0; const dth = Math.PI / n, dph = 2 * Math.PI / (2 * n);
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * dth, st = Math.sin(th), ct = Math.cos(th);
    for (let j = 0; j < 2 * n; j++) {
      const ph = (j + 0.5) * dph, nh = [st * Math.cos(ph), ct, st * Math.sin(ph)];
      s += dot(E(add(c, mul(nh, R))), nh) * R * R * st * dth * dph;
    }
  }
  return s;
}
// a cube of half-side h: the flux through each face, in the order +x −x +y −y +z −z
export function cubeFaces(E, c, h, n = 60) {
  const out = [];
  for (let axis = 0; axis < 3; axis++) for (const sgn of [1, -1]) {
    const u = (axis + 1) % 3, v = (axis + 2) % 3, dA = (2 * h / n) ** 2;
    let s = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const p = c.slice(); p[axis] += sgn * h; p[u] += -h + (i + 0.5) * 2 * h / n; p[v] += -h + (j + 0.5) * 2 * h / n;
      s += sgn * E(p)[axis] * dA;
    }
    out.push(s);
  }
  return out;
}
// a coaxial cylinder along y (radius r, length L, centred at c): [body, top cap, bottom cap]
export function cylinderFlux(E, c, r, L, n = 80) {
  let body = 0, top = 0, bot = 0; const dph = 2 * Math.PI / n, dy = L / n, dr = r / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const ph = (j + 0.5) * dph, nh = [Math.cos(ph), 0, Math.sin(ph)];
    body += dot(E(add(c, [r * nh[0], -L / 2 + (i + 0.5) * dy, r * nh[2]])), nh) * r * dph * dy;
    const rr = (i + 0.5) * dr, q = [rr * Math.cos(ph), 0, rr * Math.sin(ph)];
    top += E(add(c, add(q, [0, L / 2, 0])))[1] * rr * dr * dph;
    bot -= E(add(c, add(q, [0, -L / 2, 0])))[1] * rr * dr * dph;
  }
  return [body, top, bot];
}

// field lines: follow E with fixed steps (RK4 on the unit direction) until stop(p) says so
export function fieldLine(E, start, { step = 0.004, max = 400, dir = 1, stop = () => false } = {}) {
  const pts = [start]; let p = start;
  const u = q => { const e = E(q), m = len(e); return m < 1e-12 ? [0, 0, 0] : mul(e, dir / m); };
  for (let k = 0; k < max; k++) {
    const k1 = u(p), k2 = u(add(p, mul(k1, step / 2))), k3 = u(add(p, mul(k2, step / 2))), k4 = u(add(p, mul(k3, step)));
    const np = add(p, mul(add(add(k1, mul(k2, 2)), add(mul(k3, 2), k4)), step / 6));
    if (len(sub(np, p)) < step * 0.5) break;
    if (stop(np)) { pts.push(np); break; }
    pts.push(np); p = np;
  }
  return pts;
}

// a point charge's field
export const pointField = (q, at) => p => { const d = sub(p, at), r = len(d); return mul(d, K * q / r ** 3); };

// ---------- 1 · flux through a flat surface in a uniform field ----------
export const FLUX = { E: 2000, side: 0.2, T: 16 };
FLUX.A = FLUX.side ** 2;                                      // 0.040 m²
FLUX.max = FLUX.E * FLUX.A;                                   // 80 N·m²/C
export const fluxAngle = t => breathe(t, 0, 180, FLUX.T);     // θ between E and A, degrees
export const flux = deg => FLUX.E * FLUX.A * Math.cos(deg * Math.PI / 180);
// the same flux summed tile by tile: E·n̂ dA over an n×n grid of the tilted square
export function fluxTiles(deg, n = 20) {
  const th = deg * Math.PI / 180, nh = [Math.cos(th), 0, Math.sin(th)], dA = FLUX.A / (n * n);
  let s = 0; for (let i = 0; i < n * n; i++) s += dot([FLUX.E, 0, 0], nh) * dA;
  return s;
}

// ---------- 2 · Gauss's law: a point charge, and a box with a charge outside it ----------
export const POINT = { q: 1.0e-9, rMin: 0.08, rMax: 0.25, T: 10 };
POINT.flux = POINT.q / EPS0;                                  // 113 N·m²/C, any closed surface around it
export const pointE = r => K * POINT.q / (r * r);
export const BOX = { h: 0.11, c: [0, 0, 0], q: 1.0e-9, at: [-0.2, 0.04, 0.02] };   // the charge sits 9 cm left of the box
export const boxFaces = () => cubeFaces(pointField(BOX.q, BOX.at), BOX.c, BOX.h, 80);

// ---------- 3 · an infinite line of charge ----------
export const LINE = { lam: 2.0e-9, L: 0.3, rMin: 0.04, rMax: 0.2, T: 10 };
export const lineE = r => 2 * K * LINE.lam / r;               // = λ / (2π ε₀ r)
// the same field by brute superposition of a long finite line (length 2·half), at distance r
export function lineNumeric(r, half = 400, n = 400000) {
  let s = 0; const dx = 2 * half / n;
  for (let i = 0; i < n; i++) { const x = -half + (i + 0.5) * dx; s += K * LINE.lam * dx * r / (x * x + r * r) ** 1.5; }
  return s;
}

// ---------- 4 · a non-conducting sheet, and a conducting plate ----------
export const SHEET = { sigma: 4.0e-9, pr: 0.05, ph: 0.16 };   // pillbox radius and height
SHEET.E = SHEET.sigma / (2 * EPS0);                           // 226 N/C, both sides
SHEET.Abox = Math.PI * SHEET.pr ** 2;
export const PLATE = { sigma: 4.0e-9, t: 0.06 };              // σ on each face, plate 6 cm thick
PLATE.E = PLATE.sigma / EPS0;                                 // 452 N/C outside, 0 in the metal
// on the axis of a uniformly charged disc of radius a: E = σ/2ε₀ · (1 − z/√(z² + a²)), summed ring by ring
// (rings spaced by the angle φ they subtend, r = z tan φ, so the near rings are sampled finely)
export function discNumeric(sigma, a, z, n = 20000) {
  let s = 0; const dphi = Math.atan(a / z) / n;
  for (let i = 0; i < n; i++) {
    const phi = (i + 0.5) * dphi, r = z * Math.tan(phi), dr = z / Math.cos(phi) ** 2 * dphi;
    s += K * sigma * 2 * Math.PI * r * dr * z / (z * z + r * r) ** 1.5;
  }
  return s;
}
// the plate as two sheets of σ, one on each face: field at height z from the mid-plane
export const plateField = z => {
  const sheet = zz => Math.sign(zz) * PLATE.sigma / (2 * EPS0);
  return sheet(z - PLATE.t / 2) + sheet(z + PLATE.t / 2);
};
export const sheetField = z => Math.sign(z) * SHEET.E;

// ---------- 5–7, 9 · spheres of charge Q and radius R ----------
export const SPH = { Q: 2.0e-9, R: 0.1, rMin: 0.02, rMax: 0.26, T: 12 };
export const outsideE = r => K * SPH.Q / (r * r);
// conducting: all the charge on the surface
export const cSphere = {
  qenc: r => (r < SPH.R ? 0 : SPH.Q),
  E: r => (r < SPH.R ? 0 : outsideE(r)),
};
// insulating, uniform ρ
SPH.rho = SPH.Q / (4 / 3 * Math.PI * SPH.R ** 3);              // 4.77×10⁻⁷ C/m³
export const iSphere = {
  qenc: r => SPH.rho * 4 / 3 * Math.PI * Math.min(r, SPH.R) ** 3,
  E: r => (r < SPH.R ? SPH.rho * r / (3 * EPS0) : outsideE(r)),
};
// insulating, ρ(r) = b r: q_enc = ∫₀ʳ b r′ · 4π r′² dr′ = π b r⁴
SPH.b = SPH.Q / (Math.PI * SPH.R ** 4);                        // 6.37×10⁻⁶ C/m⁴
export const nSphere = {
  rho: r => (r < SPH.R ? SPH.b * r : 0),
  qenc: r => Math.PI * SPH.b * Math.min(r, SPH.R) ** 4,
  E: r => (r < SPH.R ? SPH.b * r * r / (4 * EPS0) : SPH.b * SPH.R ** 4 / (4 * EPS0 * r * r)),
};
// q_enc by summing thin shells: ∫ ρ(r) 4π r² dr
export function shellSum(rho, r, n = 4000) { let s = 0; const dr = r / n; for (let i = 0; i < n; i++) { const x = (i + 0.5) * dr; s += rho(x) * 4 * Math.PI * x * x * dr; } return s; }
// a field with spherical symmetry, as a vector field (for numeric flux checks)
export const radialField = Er => p => { const r = len(p); return mul(p, Er(r) / r); };
// a charged shell's field at distance d from its centre, by summing rings of surface charge
export function shellNumeric(Q, R, d, n = 20000) {
  let s = 0; const sig = Q / (4 * Math.PI * R * R), dth = Math.PI / n;
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * dth, dq = sig * 2 * Math.PI * R * Math.sin(th) * R * dth;
    const z = d - R * Math.cos(th), rho = R * Math.sin(th);
    s += K * dq * z / (z * z + rho * rho) ** 1.5;
  }
  return s;
}

// ---------- 6, 8 · infinite rods of radius R, charge λ per metre ----------
export const ROD = { lam: 2.0e-9, R: 0.05, L: 0.16, rMin: 0.012, rMax: 0.17, T: 12 };
ROD.sigma = ROD.lam / (2 * Math.PI * ROD.R);                 // conducting: on the surface
ROD.rho = ROD.lam / (Math.PI * ROD.R ** 2);                   // insulating: through the volume
export const cRod = {
  qenc: (r, L = ROD.L) => (r < ROD.R ? 0 : ROD.sigma * 2 * Math.PI * ROD.R * L),
  E: r => (r < ROD.R ? 0 : ROD.sigma * ROD.R / (EPS0 * r)),
};
export const iRod = {
  qenc: (r, L = ROD.L) => ROD.rho * Math.PI * Math.min(r, ROD.R) ** 2 * L,
  E: r => (r < ROD.R ? ROD.rho * r / (2 * EPS0) : ROD.rho * ROD.R ** 2 / (2 * EPS0 * r)),
};
// cylindrical symmetry about the y axis, as a vector field
export const axialField = Er => p => { const r = Math.hypot(p[0], p[2]); return [p[0] * Er(r) / r, 0, p[2] * Er(r) / r]; };

// ---------- 10 · a conductor in equilibrium: a metal shell in a uniform field ----------
// Outside, the uniform field plus the field of the induced charges (a dipole); inside, zero.
// V = −E₀ x (1 − R³/r³) outside, 0 on and inside the metal.
export const CAGE = { E0: 1000, R: 0.14 };
export const cageV = p => { const r = len(p); return r <= CAGE.R ? 0 : -CAGE.E0 * p[0] * (1 - CAGE.R ** 3 / r ** 3); };
export function cageField(p) {
  const r = len(p), R3 = CAGE.R ** 3;
  if (r < CAGE.R) return [0, 0, 0];
  // E = −∇V: E₀ x̂ (1 − R³/r³) + E₀ x · 3R³ p / r⁵
  const a = CAGE.E0 * (1 - R3 / r ** 3), b = CAGE.E0 * p[0] * 3 * R3 / r ** 5;
  return [a + b * p[0], b * p[1], b * p[2]];
}
// induced surface charge, σ = ε₀ E⊥ = 3 ε₀ E₀ cos θ (θ from the field direction)
export const cageSigma = cosTh => 3 * EPS0 * CAGE.E0 * cosTh;
