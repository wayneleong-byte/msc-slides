// The figure: nine scenes along x, one per page. Point charges are small paper spheres with a
// + or − label; E is blue; forces are black; equipotentials are thin grey lines and pale sheets;
// potential is drawn as height. Every length, height and contour comes from model.js.
// World units: 1 unit = 10 cm (S = 10 per metre), except the last scene, 1 unit = 1 cm.
import * as THREE from 'three';
import { part, box, cyl, lines, arrow, setArrow, shadeMat, xAxis, V } from '../engine/parts.js';
import * as M from './model.js';

export const S = 10;                       // world units per metre: one grid square is 10 cm
export const STATIONS = { pair: 0, square: 16, uniform: 32, hill: 48, dipole: 66, rod: 84, ring: 102, spheres: 124, accel: 142 };
export const SC = {
  F: 0.08,          // pair: units per μN
  Euni: 1 / 25,     // uniform field: units per N/C (one square per 25 N/C)
  Ehill: 1.0,       // hill: units per kN/C
  Esph: 0.4,        // spheres: units per kN/C
  Vh: 1 / 60,       // potential surfaces: units of height per volt (one square per 60 V)
  Vsph: 1 / 150,    // sphere profiles: units per volt
  Eacc: 1 / 50,     // accelerating gap: units (cm) per V/m
  Sacc: 100,        // accelerating gap: world units per metre (1 unit = 1 cm)
};
// height for a potential: linear up to VC, then rolled off so the peaks near a charge stay finite
const VC = 150, VW = 90;
export const hgt = (v, s = SC.Vh) => { const a = Math.abs(v), h = a < VC ? a : VC + VW * Math.tanh((a - VC) / VW); return Math.sign(v) * h * s; };

const BLUE = '#5b86d6', GREY = '#9a9aa0', INK = '#4a4a50';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at) => labels.push({ cls, html, at });
  const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const wp = o => o.getWorldPosition(V());
  const tip = (a, extra = 0.16) => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + extra, 0)) : null;
  const exOf = g => Math.max(Math.min(g.userData.explode, 1), 0);

  // faint graph-paper ground, one patch per scene
  const ground = (x0, x1, z0, z1, step = 1) => {
    const g = [];
    for (let x = x0; x <= x1 + 1e-6; x += step) g.push(x, 0.001, z0, x, 0.001, z1);
    for (let z = z0; z <= z1 + 1e-6; z += step) g.push(x0, 0.001, z, x1, 0.001, z);
    lines(root, g, '#e6e6e2');
  };
  // a point charge: paper sphere plus a + or − label at its centre
  const charge = (parent, sign, r = 0.17, name = 'Charge', tone = 'hi') => {
    const m = part(parent, new THREE.SphereGeometry(r, 32, 20), { tone, name });
    label(sign > 0 ? 'vec red' : 'vec blue', sign > 0 ? '+' : '−', () => shown(m) ? wp(m) : null);
    return m;
  };
  const dot = (parent, r = 0.06, name = 'Point', pal = 'ink') => part(parent, new THREE.SphereGeometry(r, 20, 12), { tone: 'hi', pal, name });
  const field = (parent, opts = {}) => arrow(parent, 'blue', { r: 0.022, head: 0.13, headR: 0.06, name: 'Field', ...opts });
  const force = (parent, opts = {}) => arrow(parent, 'ink', { r: 0.022, head: 0.13, headR: 0.06, name: 'Force', ...opts });
  // a line set whose coordinates change every frame
  const liveLines = (parent, max, color = GREY, opacity = 1) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(max * 6), 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity })); l.userData = { noEdge: true }; l.frustumCulled = false; parent.add(l);
    return { l, set(c, op = opacity) { const p = g.attributes.position; p.array.fill(0); p.array.set(c.slice(0, max * 6)); p.needsUpdate = true; g.setDrawRange(0, c.length / 3); l.material.opacity = op; l.visible = op > 0.01 && c.length > 0; } };
  };
  const circle = (cx, cy, cz, r, plane = 'xz', n = 96, dash = false) => {
    const c = [];
    for (let i = 0; i < n; i++) {
      if (dash && i % 2) continue;
      const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n;
      for (const a of [a0, a1]) plane === 'xz' ? c.push(cx + r * Math.cos(a), cy, cz + r * Math.sin(a)) : c.push(cx, cy + r * Math.cos(a), cz + r * Math.sin(a));
    }
    return c;
  };
  const stretch = (m, a, b) => { m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, Math.max(a.distanceTo(b), 1e-4), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); };
  const translucent = (pal, opacity) => { const m = shadeMat(pal, { opacity }); m.side = THREE.DoubleSide; m.depthWrite = false; return m; };

  // ================= 1 · a pair of charges =================
  const X0 = STATIONS.pair, Y0 = 0.4, ZL = -1.2, ZU = 1.2, x1 = X0 - 2;
  ground(X0 - 4, X0 + 4, -3, 3);
  const gPair = asm('pair', root, { title: 'Bringing in a charge', sub: 'work in = energy stored' });
  const q1L = charge(gPair, 1, 0.22, '+4 nC'), q1U = charge(gPair, 1, 0.22, '+4 nC');
  q1L.position.set(x1, Y0, ZL); q1U.position.set(x1, Y0, ZU);
  const q2L = charge(gPair, 1, 0.17, '+2 nC'), q2U = charge(gPair, -1, 0.17, '−2 nC');
  const fL = force(gPair), fU = force(gPair);
  label('vec', '<i>F</i>', () => tip(fL)); label('vec', '<i>F</i>', () => tip(fU));
  label('tick', '+4 nC', () => V(x1 - 0.3, Y0 + 0.32, ZL)); label('tick', '+4 nC', () => V(x1 - 0.3, Y0 + 0.32, ZU));
  label('board', 'like charges: <i>U</i> &gt; 0', () => V(X0 + 0.6, 0.02, ZL + 0.6)); label('board', 'unlike charges: <i>U</i> &lt; 0', () => V(X0 + 0.6, 0.02, ZU + 0.8));
  lines(root, [x1, 0.02, ZL, X0 + 2.2, 0.02, ZL, x1, 0.02, ZU, X0 + 2.2, 0.02, ZU], '#c4c4c8');
  // breakdown: the path in steps, the force at each
  const stepsP = [0.40, 0.35, 0.30, 0.25, 0.20, 0.15, 0.10];
  const ghostMat = shadeMat('paper', { opacity: 0.4 });
  const pairGhosts = stepsP.map(r => [ZL, ZU].map((z, k) => {
    const s = part(gPair, new THREE.SphereGeometry(0.17, 24, 14), { tone: 'lo', name: 'Steps', mat: ghostMat }); s.position.set(x1 + r * S, Y0, z);
    const a = force(gPair, { r: 0.014, head: 0.09, headR: 0.04, tone: 'mid', name: 'Steps' }); return { s, a, r, sign: k ? -1 : 1, z };
  })).flat();

  // ================= 2 · four charges on a square =================
  const X1 = STATIONS.square, Y1 = 0.4;
  ground(X1 - 4, X1 + 4, -3, 3);
  const gSq = asm('square', root, { title: 'Assembling four charges', sub: 'one at a time, from far away' });
  const sq = [0, 1, 2, 3].map(i => charge(gSq, 1, 0.17, `q${i + 1}`));
  sq.forEach((m, i) => label('tick', `<i>q</i><sub>${i + 1}</sub>`, () => m.visible ? wp(m).add(V(-0.2, 0.35, 0)) : null));
  { const c = M.SQ.corners.map(p => [X1 + p[0] * S, 0.02, p[2] * S]), seg = [];
    for (const [i, j] of [[0, 2], [2, 3], [3, 1], [1, 0]]) seg.push(...c[i], ...c[j]);
    lines(root, seg, '#d4d4d6');
    // the diagonal q2–q3, dashed as in the organizer
    const d = [], A = V(...c[1]), B = V(...c[2]);
    for (let k = 0; k < 16; k += 2) d.push(...A.clone().lerp(B, k / 16).toArray(), ...A.clone().lerp(B, (k + 1) / 16).toArray());
    lines(root, d, '#d4d4d6'); }
  label('tick', '<i>a</i> = 20 cm', () => V(X1 + 0.35, 0.02, 1.35));
  // breakdown: the six pair links
  const links = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const m = part(gSq, cyl(0.025, 1, 10), { tone: 'mid', pal: 'dark', name: 'Pairs' });
    const a = M.SQ.corners[i], b = M.SQ.corners[j], diag = Math.abs(a[0] - b[0]) > 1e-9 && Math.abs(a[2] - b[2]) > 1e-9;
    stretch(m, V(X1 + a[0] * S, Y1, a[2] * S), V(X1 + b[0] * S, Y1, b[2] * S));
    m.userData.i = i; m.userData.j = j; m.userData.dy = diag ? (i === 0 ? 0.06 : -0.06) : 0; links.push(m);   // the two diagonals cross; lift one
    const off = diag ? V(i === 0 ? 0.55 : -0.55, 0.12, -0.55) : V(0, 0.18, 0);
    label('tick', diag ? '<i>kq</i>²/√2<i>a</i>' : '<i>kq</i>²/<i>a</i>', () => m.visible ? wp(m).add(off) : null);
  }

  // ================= 3 · a uniform field: A → C =================
  const X2 = STATIONS.uniform, ux = x => X2 - 1 + x * S, uz = z => 2 + z * S;
  ground(X2 - 4, X2 + 4, -3, 3);
  const gUni = asm('uniform', root, { title: 'A charge crossing a uniform field', sub: 'ΔV = −∫ E · ds' });
  // equipotential sheets every 5 cm, at right angles to E
  for (let k = 0; k <= 4; k++) {
    const x = ux(k * 0.05);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.2), translucent('paper', 0.35)); sh.rotation.y = Math.PI / 2; sh.position.set(x, 0.6, 0); sh.userData = { noEdge: true }; root.add(sh);
    lines(root, [x, 0, -2.8, x, 1.2, -2.8, x, 1.2, -2.8, x, 1.2, 2.8, x, 1.2, 2.8, x, 0, 2.8], '#b4b4b8');
    label('tick', `${M.Vuni([k * 0.05, 0, 0]) ? '−' + Math.abs(M.Vuni([k * 0.05, 0, 0])).toFixed(1) : '0'} V`, () => V(x + 0.32, 1.45, -2.8));
  }
  // E: uniform 50 N/C along +x
  const eUni = [-2.5, 0, 2.5].map(z => { const a = field(root, { name: 'E' }); setArrow(a, V(X2 - 1.9, 0.9, z), V(M.UNI.E * SC.Euni, 0, 0)); return a; });
  label('vec blue', '<b><i>E</i></b>', () => tip(eUni[0]));
  const pA = V(ux(0), 0.03, uz(-0.4)), pB = V(ux(0), 0.03, uz(0)), pC = V(ux(0.2), 0.03, uz(0));
  lines(root, [...pA.toArray(), ...pC.toArray()], INK);
  { const d = []; for (let k = 0; k < 20; k += 2) { const u0 = k / 20, u1 = (k + 1) / 20; d.push(...pA.clone().lerp(pB, u0).toArray(), ...pA.clone().lerp(pB, u1).toArray()); } for (let k = 0; k < 10; k += 2) d.push(...pB.clone().lerp(pC, k / 10).toArray(), ...pB.clone().lerp(pC, (k + 1) / 10).toArray()); lines(root, d, GREY); }
  [['A', pA, -0.25], ['B', pB, -0.25], ['C', pC, 0.45]].forEach(([n, p, dx]) => { const d = dot(root, 0.06); d.position.copy(p); label('board', n, () => p.clone().add(V(dx, 0.05, 0.28))); });
  const qUni = charge(gUni, 1, 0.15, 'Test charge +1 nC');
  // breakdown: four ds steps, each with its part along E
  const dsA = [0, 1, 2, 3].map(() => force(gUni, { r: 0.016, head: 0.11, headR: 0.045, tone: 'mid', name: 'Steps ds' }));
  const dxA = [0, 1, 2, 3].map(() => arrow(gUni, 'dark', { r: 0.014, head: 0.09, headR: 0.04, tone: 'mid', name: 'Steps ds' }));
  dsA.forEach((a, k) => label('tick', 'd<b><i>s</i></b>', () => a.visible ? pA.clone().lerp(pC, (k + 0.5) / 4).add(V(-0.12, 0.25, -0.1)) : null));
  dxA.forEach((a, k) => label('tick', 'd<i>x</i>', () => a.visible ? pA.clone().lerp(pC, k / 4).add(V(0.33, 0.2, 0.12)) : null));

  // ================= 4 · the potential hill =================
  const X3 = STATIONS.hill, RH = M.HILL.R * S;
  ground(X3 - 5, X3 + 5, -5, 5);
  const gHill = asm('hill', root, { title: 'The potential of a point charge', sub: 'V drawn as height' });
  gHill.userData.minDist = 14;
  const qHill = charge(gHill, 1, 0.16, '+1 nC'); qHill.position.set(X3, 0.16, 0);
  label('tick', '+1 nC', () => V(X3 - 0.25, 0.5, 0));
  // floor map: equipotential circles and E
  for (const v of M.HILL.levels) lines(root, circle(X3, 0.012, 0, M.K * M.HILL.Q / v * S), GREY);
  const hillE = [];
  for (let k = 0; k < 8; k++) for (const r of [0.10, 0.15, 0.22]) {
    const a = field(root, { r: 0.018, head: 0.11, headR: 0.05 }), th = (k + 0.5) * Math.PI / 4;
    setArrow(a, V(X3 + r * S * Math.cos(th), 0.03, r * S * Math.sin(th)), V(Math.cos(th), 0, Math.sin(th)).multiplyScalar(M.Epoint(M.HILL.Q, r) / 1000 * SC.Ehill)); hillE.push(a);
  }
  // the surface (lifts when opened)
  const lift = new THREE.Group(); gHill.add(lift); lift.userData.home = V(); lift.userData.ex = V(0, 2.0, 0);
  { const NR = 60, NS = 120, pos = [], idx = [];
    for (let i = 0; i <= NR; i++) { const r = RH * (i / NR) ** 1.4; for (let j = 0; j <= NS; j++) { const a = 2 * Math.PI * j / NS; pos.push(X3 + r * Math.cos(a), hgt(M.Vpoint(M.HILL.Q, r / S)), r * Math.sin(a)); } }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const surf = part(lift, g, { tone: 'lo', name: 'Potential surface', mat: translucent('paper', 0.62) }); surf.userData.noEdge = true; }
  for (const v of M.HILL.levels) {
    const r = M.K * M.HILL.Q / v * S;
    lines(lift, circle(X3, hgt(v) + 0.012, 0, r), '#6c6c72');
    label('tick', `${v} V`, () => V(X3 - r - 0.08, hgt(v) + lift.position.y + 0.1, 0));
  }
  const PH = Math.PI * 0.2;    // the probe runs out along this direction
  const probeH = dot(lift, 0.08, 'Probe', 'ink');
  const probeE = field(gHill, { name: "Probe" });
  label('vec blue', '<b><i>E</i></b>', () => tip(probeE));
  const dropH = liveLines(root, 40, '#8a8a8f');

  // ================= 5 · a dipole =================
  const X4 = STATIONS.dipole, DX = M.DIP.X * S, DZ = M.DIP.Z * S;
  ground(X4 - 4, X4 + 4, -3, 3);
  const gDip = asm('dipole', root, { title: 'A dipole', sub: 'a hill beside a well' });
  gDip.userData.minDist = 14;
  const dPlus = charge(gDip, 1, 0.15, '+1 nC'), dMinus = charge(gDip, -1, 0.15, '−1 nC');
  dPlus.position.set(X4 - M.DIP.a * S, 0.0, 0); dMinus.position.set(X4 + M.DIP.a * S, 0.0, 0);
  // field lines on the floor, traced from the + charge
  const dipE = [];
  for (let k = 0; k < 14; k++) {
    const th = (k + 0.5) * 2 * Math.PI / 14, st = [-M.DIP.a + 0.012 * Math.cos(th), 0, 0.012 * Math.sin(th)];
    const pts = M.fieldLine(M.DIP.charges, st), c = [];
    for (let i = 1; i < pts.length; i++) c.push(X4 + pts[i - 1][0] * S, 0.02, pts[i - 1][2] * S, X4 + pts[i][0] * S, 0.02, pts[i][2] * S);
    lines(root, c, BLUE);
    const m = pts[Math.floor(pts.length * 0.45)], n = pts[Math.floor(pts.length * 0.45) + 1];
    const a = field(root, { r: 0.012, head: 0.13, headR: 0.045 }); setArrow(a, V(X4 + m[0] * S, 0.02, m[2] * S), V(n[0] - m[0], 0, n[2] - m[2]).normalize().multiplyScalar(0.32)); dipE.push(a);
  }
  // equipotentials on the floor (marching squares) and the same contours on the surface
  const dipSurf = new THREE.Group(); gDip.add(dipSurf);
  for (const v of M.DIP.levels) for (const sg of [1, -1]) {
    const segs = M.contours(M.Vdip, sg * v, -M.DIP.X, M.DIP.X, -M.DIP.Z, M.DIP.Z, 180), fl = [], up = [], y = hgt(sg * v) + 0.012;
    for (const [x, z] of segs) { fl.push(X4 + x * S, 0.012, z * S); up.push(X4 + x * S, y, z * S); }
    lines(root, fl, GREY);
  }
  lines(root, [X4, 0.015, -DZ, X4, 0.015, DZ], INK);
  label('board', '<i>V</i> = 0', () => V(X4 + 0.1, 0.05, DZ - 0.2));
  { const nx = 144, nz = 104, g = new THREE.PlaneGeometry(2 * DX, 2 * DZ, nx, nz).rotateX(-Math.PI / 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, hgt(M.Vdip([p.getX(i) / S, 0, p.getZ(i) / S])));
    g.translate(X4, 0, 0); g.computeVertexNormals();
    const surf = part(dipSurf, g, { tone: 'lo', name: 'Potential surface', mat: translucent('paper', 0.6) }); surf.userData.noEdge = true; dipSurf.userData.surf = surf; }
  // breakdown: at two points, each charge's potential as a stick, and their sum
  const sticks = [];
  for (const [P, nm] of [[[M.DIP.axisX, 0, 0], 'P'], [[0, 0, M.DIP.bisZ], 'P′']]) {
    const base = V(X4 + P[0] * S, 0, P[2] * S), d = dot(gDip, 0.06, 'Probes'); d.position.copy(base);
    label('board', nm, () => d.visible && exOf(gDip) > 0.3 ? base.clone().add(V(0.18, 0.1, 0.25)) : null);
    const vp = M.Vpoint(M.DIP.q, Math.hypot(P[0] + M.DIP.a, P[2])), vm = M.Vpoint(-M.DIP.q, Math.hypot(P[0] - M.DIP.a, P[2]));
    [[vp, 'red', -0.22], [vm, 'blue', 0], [vp + vm, 'ink', 0.22]].forEach(([v, pal, dx]) => {
      const m = part(gDip, cyl(0.035, 1, 14), { tone: 'hi', pal, name: 'Probes' });
      const at = base.clone().add(V(dx, 0, 0));
      sticks.push({ m, at, h: hgt(v) });
      const txt = `${v > 0.05 ? '+' : v < -0.05 ? '−' : ''}${Math.abs(v).toFixed(0)} V`;
      label(pal === 'ink' ? 'tick' : 'tick', pal === 'ink' ? `Σ ${txt}` : txt, () => m.visible ? at.clone().add(V(pal === 'red' ? -0.08 : pal === 'ink' ? 0.95 : 0.6, hgt(v) + (v >= 0 ? 0.14 : -0.14), 0)) : null);
    });
  }

  // ================= 6 · a charged rod =================
  const X5 = STATIONS.rod, YR = 1.0, L = M.ROD.L * S, xr0 = X5 - L / 2 + 1;
  ground(X5 - 4, X5 + 4, -3, 3);
  const gRod = asm('rod', root, { title: 'A charged rod', sub: 'λ = Q/L, dq = λ dx' });
  const NSL = 12, slices = [];
  for (let i = 0; i < NSL; i++) { const m = part(gRod, xAxis(cyl(0.09, L / NSL, 24)), { tone: 'hi', name: 'Rod' }); m.position.set(xr0 + (i + 0.5) * L / NSL, YR, 0); slices.push(m); }
  for (let i = 0; i < 5; i++) label('vec red', '+', () => V(xr0 + (i + 0.5) * L / 5, YR + 0.27, 0));
  label('tick', '+3 nC, 30 cm', () => V(xr0 + L + 1.25, YR - 0.32, 0));
  const pAx = dot(gRod, 0.07, 'P'), pBis = dot(gRod, 0.07, 'P′');
  pBis.position.set(xr0 + L / 2, YR + M.ROD.bisA * S, 0);
  label('board', 'P', () => wp(pAx).add(V(-0.15, 0.3, 0))); label('board', 'P′', () => wp(pBis).add(V(0.12, 0.25, 0)));
  lines(root, [xr0 + L / 2, YR + 0.09, 0, xr0 + L / 2, YR + M.ROD.bisA * S, 0], GREY);
  const rodAxisLine = liveLines(root, 1, GREY), rodLines = liveLines(root, 2 * NSL, '#8a8a8f');

  // ================= 7 · ring, arc and disc =================
  const X6 = STATIONS.ring, YC = 1.9, xRing = X6 - 5.5, xArc = X6 - 0.5, xDisc = X6 + 2, RR = M.RING.R * S;
  ground(X6 - 8, X6 + 8, -3, 3);
  const gRing = asm('ring', root, { title: 'A ring of charge', sub: 'every dq the same distance from P' });
  const NRG = 16, ringSeg = [];
  for (let i = 0; i < NRG; i++) {
    const g = new THREE.TorusGeometry(RR, 0.06, 10, 10, 2 * Math.PI / NRG).rotateZ(2 * Math.PI * i / NRG).rotateY(Math.PI / 2);
    const a = 2 * Math.PI * (i + 0.5) / NRG, dir = V(0, Math.sin(a), -Math.cos(a));
    ringSeg.push(part(gRing, g, { tone: 'hi', name: 'Ring', pos: [xRing, YC, 0], ex: dir.multiplyScalar(0.14).toArray() }));
  }
  label('tick', '+2 nC', () => V(xRing - 0.15, YC + RR + 0.3, 0));
  const pRing = dot(gRing, 0.07, 'P'); label('board', 'P', () => wp(pRing).add(V(0.05, 0.3, 0)));
  lines(root, [xRing - 0.3, YC, 0, xRing + 2.7, YC, 0], GREY);
  const ringLines = liveLines(root, NRG, '#8a8a8f');

  const gArc = asm('arc', root, { title: 'An arc of charge', sub: 'V at its centre is kQ/R' });
  const NA = 8;
  for (let i = 0; i < NA; i++) {
    const g = new THREE.TorusGeometry(RR, 0.06, 10, 10, Math.PI / NA).rotateZ(Math.PI / 2 + Math.PI * i / NA);
    const a = Math.PI / 2 + Math.PI * (i + 0.5) / NA;
    part(gArc, g, { tone: 'hi', name: 'Arc', pos: [xArc, YC, 0], ex: [0.14 * Math.cos(a), 0.14 * Math.sin(a), 0] });
  }
  const cArc = dot(gArc, 0.07, 'Centre'); cArc.position.set(xArc, YC, 0);
  label('board', 'C', () => V(xArc + 0.15, YC + 0.25, 0)); label('tick', '+2 nC', () => V(xArc - RR - 0.15, YC + 0.35, 0));
  const arcLines = liveLines(root, NA, '#8a8a8f');

  const gDisc = asm('disc', root, { title: 'A disc of charge', sub: 'rings of dq = σ·2πr dr' });
  const NDR = 5, discRings = [];
  for (let i = 0; i < NDR; i++) {
    const r0 = RR * i / NDR + (i ? 0.012 : 0), r1 = RR * (i + 1) / NDR - 0.012;
    const g = new THREE.LatheGeometry([V(r0, -0.04, 0), V(r1, -0.04, 0), V(r1, 0.04, 0), V(r0, 0.04, 0), V(r0, -0.04, 0)].map(p => new THREE.Vector2(Math.max(p.x, 0.001), p.y)), 64).rotateZ(Math.PI / 2);
    discRings.push(part(gDisc, g, { tone: 'hi', name: 'Disc', pos: [xDisc, YC, 0], ex: [-0.1 * i, 0, 0] }));
  }
  label('tick', '+2 nC', () => V(xDisc - 0.15, YC + RR + 0.3, 0));
  const pDisc = dot(gDisc, 0.07, 'P'); label('board', 'P', () => wp(pDisc).add(V(0.05, 0.3, 0)));
  lines(root, [xDisc - 0.3, YC, 0, xDisc + 2.7, YC, 0], GREY);
  const discLines = liveLines(root, 2 * NDR, '#8a8a8f');

  // ================= 8 · conducting and insulating spheres =================
  const X7 = STATIONS.spheres, YS = 1.3, RS = M.SPH.R * S, xc = X7 - 2.2, xi = X7 + 2.2;
  ground(X7 - 7, X7 + 7, -3, 3);
  const sph = [];
  for (const [key, x, dirx, title, sub, Vf, Ef] of [['conductor', xc, -1, 'A charged conducting sphere', 'charge on the surface, E = 0 inside', M.Vcond, M.Econd], ['insulator', xi, 1, 'A charged insulating sphere', 'charge spread through the volume', M.Vins, M.Eins]]) {
    const g = asm(key, root, { title, sub });
    part(g, new THREE.SphereGeometry(RS, 48, 32), { tone: 'mid', name: 'Sphere', pos: [x, YS, 0], mat: translucent('paper', 0.42) });
    // tiny + marks: on the surface for the conductor, through the volume for the insulator
    let seed = key === 'conductor' ? 3 : 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const n = key === 'conductor' ? 26 : 40;
    for (let i = 0; i < n; i++) {
      const u = 2 * rnd() - 1, ph = 2 * Math.PI * rnd(), s = Math.sqrt(1 - u * u), rr = key === 'conductor' ? RS * 0.97 : RS * 0.9 * Math.cbrt(rnd());
      part(g, new THREE.SphereGeometry(0.035, 10, 8), { tone: 'mid', pal: 'red', name: 'Charge', pos: [x + rr * s * Math.cos(ph), YS + rr * u, rr * s * Math.sin(ph)] });
    }
    label('tick', '+2 nC', () => V(x + 0.35, YS + RS + 0.3, 0));
    // the path in from 40 cm, its r axis, and V(r) drawn above it as a profile
    const end = x + dirx * M.SPH.r0 * S;
    lines(root, [x, YS, 0, end, YS, 0], GREY);
    const prof = [];
    for (let i = 0; i < 160; i++) { const r0 = M.SPH.r0 * i / 160, r1 = M.SPH.r0 * (i + 1) / 160; prof.push(x + dirx * r0 * S, YS + Vf(r0) * SC.Vsph, 0, x + dirx * r1 * S, YS + Vf(r1) * SC.Vsph, 0); }
    lines(g, prof, INK);
    label('tick', '<i>V</i>(<i>r</i>)', () => V(end + dirx * 0.15 + (dirx > 0 ? 0.45 : 0), YS + Vf(M.SPH.r0) * SC.Vsph + 0.1, 0));
    label('tick', '<i>R</i>', () => V(x + dirx * RS + 0.08, YS - 0.2, 0));
    const probe = dot(g, 0.07, 'Probe'), stick = part(g, cyl(0.02, 1, 10), { tone: 'mid', pal: 'dark', name: 'Probe' });
    const eArr = [0.025, 0.075, 0.125, 0.175, 0.225, 0.275, 0.325, 0.375].map(r => ({ r, a: field(g, { r: 0.018, head: 0.11, headR: 0.05 }) }));
    label('board', '∞ → <i>R</i>', () => exOf(g) > 0.3 ? V(x + dirx * 2.6 - 0.4, YS - 0.55, 0) : null);
    label('board', '<i>R</i> → 0', () => exOf(g) > 0.3 ? V(x + dirx * 0.5 - 0.35, YS - 0.55, 0) : null);
    sph.push({ g, x, dirx, Vf, Ef, probe, stick, eArr });
  }

  // ================= 9 · across 6 V: a proton and an electron =================
  const X8 = STATIONS.accel, YA = 2.2, D = M.ACC.d * SC.Sacc, xa0 = X8 - D / 2;
  ground(X8 - 5, X8 + 5, -3, 3);
  const gAcc = asm('accel', root, { title: 'Proton and electron across 6 V', sub: 'each gains 6 eV' });
  for (const [x, v, s] of [[xa0, M.ACC.Vhi, 1], [xa0 + D, M.ACC.Vlo, -1]]) {
    part(root, box(0.14, 4.2, 3.0, 0.03), { tone: 'mid', pal: 'board', pos: [x - s * 0.07, YA, 0], name: 'Plate' });
    label('tick', `${v} V`, () => V(x + 0.35, YA + 2.45, -1.5));
    for (let k = 0; k < 4; k++) label(s > 0 ? 'vec red' : 'vec blue', s > 0 ? '+' : '−', () => V(x - s * 0.35, YA - 1.5 + k, -1.5));
  }
  for (const v of [5, 3]) {
    const x = xa0 + (M.ACC.Vhi - v) / M.ACC.E * SC.Sacc;
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.2), translucent('paper', 0.3)); sh.rotation.y = Math.PI / 2; sh.position.set(x, YA, 0); sh.userData = { noEdge: true }; root.add(sh);
    lines(root, [x, YA - 2.1, -1.5, x, YA + 2.1, -1.5, x, YA + 2.1, -1.5, x, YA + 2.1, 1.5, x, YA + 2.1, 1.5, x, YA - 2.1, 1.5, x, YA - 2.1, 1.5, x, YA - 2.1, -1.5], '#b4b4b8');
    label('tick', `${v} V`, () => V(x + 0.35, YA + 2.45, -1.5));
  }
  const eAcc = [YA + 1.75, YA - 1.75].map(y => { const a = field(root); setArrow(a, V(X8 - M.ACC.E * SC.Eacc / 2, y, 0.9), V(M.ACC.E * SC.Eacc, 0, 0)); return a; });
  label('vec blue', '<b><i>E</i></b>', () => tip(eAcc[0]));
  const prot = charge(gAcc, 1, 0.24, 'Proton'), elec = charge(gAcc, -1, 0.17, 'Electron');
  label('tick', 'proton', () => wp(prot).add(V(0.1, -0.45, 0))); label('tick', 'electron', () => wp(elec).add(V(0.25, -0.38, 0)));
  const fP = force(gAcc), fE = force(gAcc);
  label('vec', '<i>eE</i>', () => tip(fP)); label('vec', '<i>eE</i>', () => tip(fE));
  const accGhosts = [1, 2, 3, 4, 5].flatMap(k => ['p', 'e'].map(w => { const m = part(gAcc, new THREE.SphereGeometry(w === 'p' ? 0.24 : 0.17, 24, 14), { tone: 'lo', name: 'Strobe', mat: ghostMat }); return { m, u: k / 6, w }; }));

  // ================= per frame =================
  function update(s) {
    // 1 · pair
    { const ex = exOf(gPair), { t } = s.pair;
      for (const [m, sign, z, fa] of [[q2L, 1, ZL, fL], [q2U, -1, ZU, fU]]) {
        const p = M.pair(t, sign), c = V(x1 + p.r * S, Y0, z);
        m.position.copy(c);
        setArrow(fa, c, V(Math.sign(p.F) * Math.abs(p.F) * 1e6 * SC.F, 0, 0));
      }
      for (const g of pairGhosts) {
        g.s.visible = ex > 0.05; g.s.scale.setScalar(Math.max(ex, 0.01));
        const F = M.K * M.PAIR.q1 * g.sign * M.PAIR.q2 / g.r ** 2;
        setArrow(g.a, V(x1 + g.r * S, Y0 + 0.42, g.z), V(F * 1e6 * SC.F, 0, 0), ex);
      } }

    // 2 · square
    { const st = M.square(s.square.t), ex = exOf(gSq);
      sq.forEach((m, i) => { const p = st.pos[i]; m.visible = !!p; if (p) m.position.set(X1 + p[0] * S, Y1, p[2] * S); });
      // opened: a link for every pair already present, at its current separation
      links.forEach(l => { const a = st.pos[l.userData.i], b = st.pos[l.userData.j]; l.visible = ex > 0.02 && !!a && !!b;
        if (l.visible) { stretch(l, V(X1 + a[0] * S, Y1 + l.userData.dy, a[2] * S), V(X1 + b[0] * S, Y1 + l.userData.dy, b[2] * S)); l.scale.x = l.scale.z = Math.max(ex, 0.01); } }); }

    // 3 · uniform field
    { const r = M.uniPath(s.uniform.t), ex = exOf(gUni);
      qUni.position.set(ux(r.p[0]), 0.2, uz(r.p[2]));
      const d = pC.clone().sub(pA).multiplyScalar(1 / 4);
      dsA.forEach((a, k) => setArrow(a, pA.clone().addScaledVector(d, k).add(V(0, 0.04, 0)), d, ex));
      dxA.forEach((a, k) => setArrow(a, pA.clone().addScaledVector(d, k).add(V(0, 0.04, 0)), V(d.x, 0, 0), ex)); }

    // 4 · hill: the probe slides out and back over the surface; its E is drawn on the floor below
    { const r = M.hillProbe(s.clock), ex = exOf(gHill), c = Math.cos(PH), sn = Math.sin(PH);
      const fx = X3 + r * S * c, fz = r * S * sn, hy = hgt(M.Vpoint(M.HILL.Q, r));
      probeH.position.set(fx, hy + 0.05, fz);
      setArrow(probeE, V(fx, 0.04, fz), V(c, 0, sn).multiplyScalar(M.Epoint(M.HILL.Q, r) / 1000 * SC.Ehill));
      const L = lift.position.y, seg = [fx, 0, fz, fx, hy + L, fz];
      // opened: drop lines tie each surface ring to its floor circle
      if (ex > 0.02) for (const v of M.HILL.levels) { const rr = M.K * M.HILL.Q / v * S; for (const a of [0.9, 2.2, 3.6, 5.0]) seg.push(X3 + rr * Math.cos(a), 0.01, rr * Math.sin(a), X3 + rr * Math.cos(a), hgt(v) + L, rr * Math.sin(a)); }
      dropH.set(seg); }

    // 5 · dipole: opened, the surface fades and each charge's share stands as a stick
    { const ex = exOf(gDip);
      dipSurf.userData.surf.material.opacity = 0.6 * Math.max(1 - 1.6 * ex, 0); dipSurf.visible = ex < 0.6;
      dipSurf.children.forEach(o => { if (o.isLineSegments) o.visible = ex < 0.5; });
      for (const st of sticks) { st.m.visible = ex > 0.02 && Math.abs(st.h) > 0.01; stretch(st.m, st.at, st.at.clone().add(V(0, st.h * ex || 1e-4, 0))); }
      gDip.children.forEach(o => { if (o.userData.part === 'Probes' && o.geometry.type === 'SphereGeometry') o.visible = ex > 0.02; }); }

    // 6 · rod: P slides along the axis; opened, the rod splits into dq slices
    { const a = M.rodProbe(s.clock), ex = exOf(gRod), P = V(xr0 - a * S, YR, 0);
      pAx.position.copy(P);
      rodAxisLine.set([xr0 - 3.2, YR, 0, xr0, YR, 0]);
      slices.forEach(m => m.scale.set(1 - 0.35 * ex, 1, 1));
      const c = []; if (ex > 0.02) slices.forEach(m => c.push(...m.position.toArray(), ...P.toArray(), ...m.position.toArray(), ...pBis.position.toArray()));
      rodLines.set(c, 0.8 * ex); }

    // 7 · ring, arc, disc: P slides out along the axis
    { const z = M.axisProbe(s.clock);
      pRing.position.set(xRing + z * S, YC, 0); pDisc.position.set(xDisc + z * S, YC, 0);
      const er = exOf(gRing), ea = exOf(gArc), ed = exOf(gDisc);
      ringLines.set(er > 0.02 ? ringSeg.flatMap((m, i) => { const a = 2 * Math.PI * (i + 0.5) / NRG; return [xRing, YC + RR * Math.sin(a), -RR * Math.cos(a), ...pRing.position.toArray()]; }) : [], 0.8 * er);
      arcLines.set(ea > 0.02 ? Array.from({ length: NA }, (_, i) => { const a = Math.PI / 2 + Math.PI * (i + 0.5) / NA; return [xArc + RR * Math.cos(a), YC + RR * Math.sin(a), 0, xArc, YC, 0]; }).flat() : [], 0.8 * ea);
      discLines.set(ed > 0.02 ? discRings.flatMap((m, i) => { const r = RR * (i + 0.5) / NDR; return [m.position.x, YC + r, 0, ...pDisc.position.toArray(), m.position.x, YC - r, 0, ...pDisc.position.toArray()]; }) : [], 0.8 * ed); }

    // 8 · spheres: a probe walks in from 40 cm; a stick reaches up to V(r)
    { const r = M.sphProbe(s.spheres.t);
      for (const o of sph) {
        const ex = exOf(o.g), px = o.x + o.dirx * r * S, v = o.Vf(r);
        o.probe.position.set(px, YS, 0);
        stretch(o.stick, V(px, YS, 0), V(px, YS + v * SC.Vsph, 0));
        for (const { r: rr, a } of o.eArr) setArrow(a, V(o.x + o.dirx * rr * S, YS - 0.3, 0), V(o.dirx * o.Ef(rr) / 1000 * SC.Esph, 0, 0), ex);
      } }

    // 9 · accelerating: both start from rest; each is slowed to cross in the same 3 s
    { const u = s.accel.t / M.ACC.run, ex = exOf(gAcc), p = M.accel(u, 'p'), e = M.accel(u, 'e');
      const cp = V(xa0 + p.x * SC.Sacc, YA + 0.7, 0), ce = V(xa0 + e.x * SC.Sacc, YA - 0.7, 0);
      prot.position.copy(cp); elec.position.copy(ce);
      setArrow(fP, cp.clone().add(V(0, 0.45, 0)), V(1.2, 0, 0), ex); setArrow(fE, ce.clone().add(V(0, 0.4, 0)), V(-1.2, 0, 0), ex);
      for (const g of accGhosts) { const r = M.accel(g.u, g.w); g.m.position.set(xa0 + r.x * SC.Sacc, YA + (g.w === 'p' ? 0.7 : -0.7), 0); g.m.visible = ex > 0.05 && g.u <= u + 1e-6; } }
  }
  return { update, labels };
}
