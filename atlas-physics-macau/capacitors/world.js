// The figure: nine capacitor scenes in a row, one per page. Plates, shells and a coaxial pair
// drawn to scale (1 m of the real thing = 10 scene units), simple circuits, a dielectric slab and
// a conducting sphere. Blue: electric field. Red + / blue − marks: charge. Black: a force.
// Every position, arrow and mark comes from model.js.
import * as THREE from 'three';
import { part, box, lines, arrow, setArrow, shadeMat, xAxis, V } from '../engine/parts.js';
import * as M from './model.js';

export const DRAW = 10;                     // scene units per real metre
export const ES = 0.2 / 1000;               // field arrows: 2 cm of drawing per kV/m (units per V/m)
export const ES_COAX = 0.1 / 1000;          // coax: 1 cm per kV/m
export const STATIONS = { plates: 0, pillbox: 12, sphere: 25, coax: 40, energy: 54, circuits: 68, slab: 82, compare: 96, conductor: 112 };
const RED = '#e5484d', BLUE = '#3d63a8';
const T = 0.05;                              // plate thickness (drawn)
const SIDE = M.PLATE.side * DRAW;            // 2.0
const D0 = M.PLATE.d * DRAW;                 // 0.5
const CY = 1.6;                              // plate centre height

// a fixed shuffle, so marks and lines appear spread out rather than row by row
const rand = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
const shuffle = n => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at) => labels.push({ cls, html, at });
  const opened = g => Math.max(g.userData.explode, 0);
  const when = (g, p) => () => opened(g) > 0.5 ? p() : null;

  // faint graph-paper ground
  const grid = [];
  for (let x = -4; x <= 122; x++) grid.push(x, 0.001, -3, x, 0.001, 3);
  for (let z = -3; z <= 3; z++) grid.push(-4, 0.001, z, 122, 0.001, z);
  lines(root, grid, '#e6e6e2');

  // ---------- kit ----------
  // vectors draw over everything, translucent plates included (sorted with them, after them)
  const onTop = a => { a.userData.arrow.shaft.material.transparent = true; return a; };
  const field = (g, r = 0.016) => onTop(arrow(g, 'blue', { r, head: 0.09, headR: 0.045, name: 'Field', tone: 'hi' }));
  const comp = g => onTop(arrow(g, 'dark', { r: 0.012, head: 0.07, headR: 0.035, name: 'Parts of the field', tone: 'mid' }));
  const tipOf = a => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + 0.14, 0)) : null;
  const rod = (g, r = 0.02, name = 'Wires') => part(g, new THREE.CylinderGeometry(r, r, 1, 10), { tone: 'hi', pal: 'ink', name });
  const stretch = (m, a, b) => { m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, Math.max(a.distanceTo(b), 1e-4), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); m.userData.home.copy(m.position); };
  const wire = (g, pts, name) => { for (let i = 0; i + 1 < pts.length; i++) stretch(rod(g, 0.02, name), pts[i], pts[i + 1]); };
  const flip = geo => { const ix = geo.index.array; for (let i = 0; i < ix.length; i += 3) [ix[i + 1], ix[i + 2]] = [ix[i + 2], ix[i + 1]]; const n = geo.attributes.normal.array; for (let i = 0; i < n.length; i++) n[i] = -n[i]; return geo; };
  const ring = (c, r, axis = 'x', n = 64, color = '#7d9bd0') => { const p = []; for (let i = 0; i < n; i++) for (const k of [i, i + 1]) { const a = 2 * Math.PI * k / n, u = r * Math.cos(a), v = r * Math.sin(a); p.push(...(axis === 'x' ? [c.x, c.y + u, c.z + v] : axis === 'y' ? [c.x + u, c.y, c.z + v] : [c.x + u, c.y + v, c.z])); } return p; };
  // a group the explode spring can move
  const mover = (parent, ex) => { const g = new THREE.Group(); g.userData = { home: V(), ex: V(...ex) }; parent.add(g); return g; };
  // translucent Gaussian surface: no ink edge (it would hide what is inside), outlined by rings
  const gaussMat = () => shadeMat('blue', { opacity: 0.13 });
  const gauss = (g, geo, name = 'Gaussian surface') => { const m = part(g, geo, { tone: 'lo', name, mat: gaussMat() }); m.userData.noEdge = true; return m; };

  // charge marks: tiny flat + and − bars lying on a surface (u, v span it, n is its normal)
  function marks(parent, color, max) {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color }), max * 2);
    m.userData.noEdge = true; m.count = 0; m.frustumCulled = false; parent.add(m);
    const M4 = new THREE.Matrix4();
    // the third axis is a × b (always right-handed, so the box's faces aren't turned inside out); n only fixes the surface
    const put = (k, p, a, b, n, len, w) => { M4.makeBasis(a.clone().multiplyScalar(len), b.clone().multiplyScalar(w), a.clone().cross(b).normalize().multiplyScalar(w * 0.5)).setPosition(p); m.setMatrixAt(k, M4); };
    return items => {
      let k = 0;
      for (const { p, u, v, n, s = 0.075 } of items) {
        if (k + 2 > max * 2) break;
        put(k++, p, u, v, n, s, s * 0.3);
        if (color === RED) put(k++, p, v, u, n, s, s * 0.3);
      }
      m.count = k; m.instanceMatrix.needsUpdate = true;
    };
  }
  const X_ = V(1, 0, 0), Y_ = V(0, 1, 0), Z_ = V(0, 0, 1);
  const tangents = n => { const u = Math.abs(n.y) < 0.9 ? Y_.clone().cross(n).normalize() : X_.clone().cross(n).normalize(); return [u, n.clone().cross(u).normalize()]; };

  // a parallel-plate capacitor centred at (cx, CY, 0), plates facing ±x; + on the left
  const SITES = [];                           // 5 × 5 places on a plate face for marks and field lines
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) SITES.push([(i - 2) * 0.36, (j - 2) * 0.36]);
  const ORDER = shuffle(25);
  function capacitor(g, cx, { opacity = 0.5, lines: withLines = true } = {}) {
    const mat = shadeMat('paper', { opacity });
    const pos = part(g, box(T, SIDE, SIDE, 0.012), { tone: 'hi', name: 'Plates', mat });
    const neg = part(g, box(T, SIDE, SIDE, 0.012), { tone: 'hi', name: 'Plates', mat });
    const plus = marks(g, RED, 120), minus = marks(g, BLUE, 120);
    const fl = withLines ? SITES.map(() => field(g, 0.011)) : [];
    for (const a of fl) a.userData.arrow.tip.scale.set(0.8, 0.8, 0.8);
    const c = { pos, neg, plus, minus, fl, d: D0,
      place(d) { c.d = d; pos.position.set(cx - d / 2 - T / 2, CY, 0); neg.position.set(cx + d / 2 + T / 2, CY, 0); pos.userData.home.copy(pos.position); neg.userData.home.copy(neg.position); },
      // n of the 25 sites carry a + / − pair and the field line between them (one line per mark)
      charge(n) {
        const on = ORDER.slice(0, Math.round(n)), d = c.d;
        plus(on.map(k => ({ p: V(cx - d / 2 + 0.004, CY + SITES[k][0], SITES[k][1]), u: Y_, v: Z_, n: X_ })));
        minus(on.map(k => ({ p: V(cx + d / 2 - 0.004, CY + SITES[k][0], SITES[k][1]), u: Z_, v: Y_, n: X_ })));
        fl.forEach((a, i) => { const k = ORDER[i]; setArrow(a, V(cx - d / 2, CY + SITES[k][0], SITES[k][1]), V(d, 0, 0), i < on.length ? 1 : 0); });
      } };
    c.place(D0);
    return c;
  }
  // a small battery along x with its + end at −x, centred at c
  function battery(g, c, len = 0.8, r = 0.13, name = 'Battery') {
    part(g, xAxis(new THREE.CylinderGeometry(r, r, len, 28)), { tone: 'hi', pos: c.toArray(), name });
    part(g, xAxis(new THREE.CylinderGeometry(r * 0.4, r * 0.4, 0.06, 20)), { tone: 'hi', pal: 'dark', pos: [c.x - len / 2 - 0.03, c.y, c.z], name });
    part(g, xAxis(new THREE.CylinderGeometry(r * 1.01, r * 1.01, len * 0.12, 28)), { tone: 'mid', pal: 'dark', pos: [c.x + len / 2 - len * 0.06, c.y, c.z], name });
  }
  // wires from the bottoms of the plates down to a battery under the capacitor
  function hookUp(g, cx, d, by = 0.3) {
    const xl = cx - d / 2 - T / 2, xr = cx + d / 2 + T / 2, bot = CY - SIDE / 2;
    battery(g, V(cx, by, 0));
    wire(g, [V(xl, bot, 0), V(xl, bot - 0.15, 0), V(cx - 0.75, bot - 0.15, 0), V(cx - 0.75, by, 0), V(cx - 0.46, by, 0)]);
    wire(g, [V(xr, bot, 0), V(xr, bot - 0.15, 0), V(cx + 0.75, bot - 0.15, 0), V(cx + 0.75, by, 0), V(cx + 0.4, by, 0)]);
  }
  const plateLabels = (cx, d = D0, at = () => true) => {
    label('vec red', '+<i>Q</i>', () => at() ? V(cx - d / 2 - 0.15, CY + SIDE / 2 + 0.22, -SIDE / 2) : null);
    label('vec blue', '−<i>Q</i>', () => at() ? V(cx + d / 2 + 0.15, CY + SIDE / 2 + 0.22, -SIDE / 2) : null);
  };

  // ---------- 0 · a capacitor on a battery turned slowly up and down ----------
  const X0 = STATIONS.plates;
  const g0 = asm('plates', root, { title: 'Two charged plates', sub: 'each plate’s field, then their sum' });
  const c0 = capacitor(g0, X0);
  hookUp(g0, X0, D0);
  plateLabels(X0);
  label('tick', 'Δ<i>V</i>', () => V(X0 + 0.05, 0.02, 0.4));
  label('vec blue', '<i>E</i>', () => opened(g0) > 0.3 ? null : V(X0 + 0.02, CY + SIDE / 2 + 0.2, 0.9));
  // breakdown: each plate's own field σ/2ε₀ at three places, and their sum
  const parts0 = [-1, 0, 1].map(k => ({ k, ep: comp(g0), en: comp(g0), sum: field(g0, 0.02) }));
  label('vec', '<i>E</i><sub>+</sub>', when(g0, () => tipOf(parts0[1].ep))); label('vec', '<i>E</i><sub>−</sub>', when(g0, () => tipOf(parts0[1].en)));
  label('vec blue', 'σ/ε<sub>0</sub>', when(g0, () => tipOf(parts0[1].sum)));
  for (const k of [-1, 1]) label('tick', '<i>E</i> = 0', when(g0, () => V(X0 + k * 1.05 + 0.25, CY + 0.38, 0)));

  // ---------- 1 · Gauss's law: the gap opens and closes, Q fixed ----------
  const X1 = STATIONS.pillbox;
  const g1 = asm('pillbox', root, { title: 'The Gaussian pillbox', sub: 'flux out = charge inside / ε₀' });
  const c1 = capacitor(g1, X1);
  plateLabels(X1, D0, () => true);
  label('vec blue', '<i>E</i>', () => V(X1, CY + SIDE / 2 + 0.2, 0.9));
  const pb = mover(g1, [0, 0, 1.9]);
  const PBR = M.PILLBOX.r * DRAW, PBL = 0.36;
  gauss(pb, xAxis(new THREE.CylinderGeometry(PBR, PBR, PBL, 40)));
  lines(pb, [...ring(V(-PBL / 2, 0, 0), PBR), ...ring(V(PBL / 2, 0, 0), PBR), ...ring(V(0, 0, 0), PBR)], '#6f8fca');
  part(pb, xAxis(new THREE.CylinderGeometry(PBR, PBR, T, 40)), { tone: 'hi', name: 'Plate inside the pillbox', mat: shadeMat('paper', { opacity: 0.8 }) });
  const pbPlus = marks(pb, RED, 6);
  pbPlus([[0, 0], [0.13, 0.08], [-0.12, 0.1], [0.05, -0.15], [-0.1, -0.12]].map(([y, z]) => ({ p: V(T / 2 + 0.004, y, z), u: Y_, v: Z_, n: X_, s: 0.06 })));
  const pbE = field(pb, 0.02); setArrow(pbE, V(PBL / 2, 0, 0), V(M.E0 * ES, 0, 0));
  label('vec blue', '<i>E</i>·<i>A</i>', when(g1, () => tipOf(pbE)));
  label('tick', '<i>q</i><sub>enc</sub> = σ<i>A</i>', when(g1, () => pb.localToWorld(V(0, PBR + 0.18, 0))));
  label('tick', 'flux 0', when(g1, () => pb.localToWorld(V(-PBL / 2 - 0.08, 0, 0))));
  const dimD = lines(g1, new Array(18).fill(0), '#6e6e74');
  label('tick', '<i>d</i>', () => V(X1 + 0.06, CY - SIDE / 2 - 0.2, SIDE / 2));

  // ---------- 2 · spherical capacitor ----------
  const X2 = STATIONS.sphere, C2y = 2.2, A2 = M.SPH.a * DRAW, B2 = M.SPH.b * DRAW, c2 = V(X2, C2y, 0);
  const g2 = asm('sphere', root, { title: 'Spherical capacitor', sub: 'a ball inside a shell' });
  part(g2, new THREE.SphereGeometry(A2, 48, 32), { tone: 'hi', pos: c2.toArray(), name: 'Inner sphere (+Q)' });
  // the outer shell cut in half through the centre, the front half removed: a cross-section.
  // The back half is in two quarters that part when opened.
  const shell2 = [0, 1].map(k => {
    const h = mover(g2, [0, k ? -1.5 : 1.5, 0]); h.position.copy(c2); h.userData.home.copy(c2);
    const t0 = k ? Math.PI / 2 : 0;
    part(h, new THREE.SphereGeometry(B2 + 0.05, 56, 20, Math.PI, Math.PI, t0, Math.PI / 2), { tone: 'hi', name: 'Outer shell (−Q)' });
    part(h, flip(new THREE.SphereGeometry(B2, 56, 20, Math.PI, Math.PI, t0, Math.PI / 2)), { tone: 'mid', name: 'Outer shell (−Q)' });
    return h;
  });
  // charge: + on the ball's surface, − on the shell's inner surface (same number: same Q)
  const fib = (n, f) => { const out = []; for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996; const d = V(r * Math.cos(a), y, r * Math.sin(a)); if (f(d, i)) out.push(d); } return out; };
  marks(g2, RED, 60)(fib(60, () => true).map(n => ({ p: c2.clone().addScaledVector(n, A2 + 0.004), u: tangents(n)[0], v: tangents(n)[1], n, s: 0.1 })));
  shell2.forEach((h, k) => marks(h, BLUE, 60)(fib(60, d => d.z < -0.05 && (k ? d.y < 0 : d.y >= 0)).map(n => ({ p: n.clone().multiplyScalar(B2 - 0.006), u: tangents(n)[0], v: tangents(n)[1], n, s: 0.1 }))));
  // radial field arrows in the cut plane, length ∝ E(r)
  const arr2 = [];
  for (let k = 0; k < 12; k++) { const t = (k + 0.5) * Math.PI / 6, n = V(Math.cos(t), Math.sin(t), 0); for (const r of [1.08, 1.42, 1.76]) arr2.push({ n, r, a: field(g2) }); }
  arr2.forEach(({ n, r, a }) => setArrow(a, c2.clone().addScaledVector(n, r), n.clone().multiplyScalar(M.sphE(r / DRAW) * ES)));
  // the Gaussian sphere, radius r sweeping from a to b
  const gs2 = new THREE.Group(); gs2.position.copy(c2); g2.add(gs2);
  gauss(gs2, new THREE.SphereGeometry(1, 48, 24, Math.PI, Math.PI));
  lines(gs2, ring(V(), 1, 'z', 96), '#5b7fc4');
  const rad2 = lines(g2, new Array(6).fill(0), '#26262a');
  lines(g2, [c2.x, c2.y, 0, c2.x - B2 * Math.cos(0.5), c2.y - B2 * Math.sin(0.5), 0], '#26262a');
  label('tick', '<i>a</i>', () => c2.clone().add(V(-A2 * 0.5 * Math.cos(0.5) - 0.05, -A2 * 0.5 * Math.sin(0.5) + 0.12, 0)));
  label('tick', '<i>b</i>', () => c2.clone().add(V(-B2 * 0.8 * Math.cos(0.5) - 0.05, -B2 * 0.8 * Math.sin(0.5) + 0.14, 0)));
  const r2lab = V(); label('tick', '<i>r</i>', () => r2lab);
  label('vec red', '+<i>Q</i>', () => c2.clone().add(V(0.12, 0.05, A2 + 0.1)));
  label('vec blue', '−<i>Q</i>', () => opened(g2) > 0.5 ? null : c2.clone().add(V(B2 * 0.8, B2 * 0.8, 0)));

  // ---------- 3 · cylindrical (coaxial) capacitor, axis along x ----------
  const X3 = STATIONS.coax, C3y = 1.6, A3 = M.CYL.a * DRAW, B3 = M.CYL.b * DRAW, L3 = M.CYL.L * DRAW, c3 = V(X3, C3y, 0);
  const g3 = asm('coax', root, { title: 'Cylindrical capacitor', sub: 'a rod inside a tube' });
  part(g3, xAxis(new THREE.CylinderGeometry(A3, A3, L3 + 0.6, 40)), { tone: 'hi', pos: c3.toArray(), name: 'Inner rod (+Q)' });
  const tube3 = mover(g3, [L3 + 0.8, 0, 0]); tube3.position.copy(c3); tube3.userData.home.copy(c3);
  // cylinder angle θ: x = r sin θ, z = r cos θ; turned to the x axis, θ ∈ [90°, 270°] is the back half (z ≤ 0)
  part(tube3, xAxis(new THREE.CylinderGeometry(B3 + 0.04, B3 + 0.04, L3, 64, 1, true, Math.PI / 2, Math.PI)), { tone: 'hi', name: 'Outer tube (−Q)' });
  part(tube3, xAxis(flip(new THREE.CylinderGeometry(B3, B3, L3, 64, 1, true, Math.PI / 2, Math.PI))), { tone: 'mid', name: 'Outer tube (−Q)' });
  const cylSites = (r, nx, nth, th0, th1) => { const out = []; for (let i = 0; i < nx; i++) for (let j = 0; j < nth; j++) { const x = -L3 / 2 + (i + 0.5) * L3 / nx, a = th0 + (j + 0.5 + (i % 2) * 0.5) * (th1 - th0) / nth; const n = V(0, Math.cos(a), Math.sin(a)); out.push({ p: V(x, 0, 0).addScaledVector(n, r), n }); } return out; };
  marks(g3, RED, 80)(cylSites(A3 + 0.004, 14, 4, 0, 2 * Math.PI).map(({ p, n }) => ({ p: p.add(c3), u: X_, v: n.clone().cross(X_), n, s: 0.07 })));
  // n = (0, cos a, sin a): the back half is a ∈ (180°, 360°)
  marks(tube3, BLUE, 80)(cylSites(B3 - 0.006, 14, 5, Math.PI, 2 * Math.PI).map(({ p, n }) => ({ p, u: X_, v: n.clone().cross(X_), n, s: 0.07 })));
  const arr3 = [];
  for (const x of [-1.5, -0.5, 0.5, 1.5]) for (const sgn of [1, -1]) for (const r of [0.27, 0.45, 0.63]) arr3.push({ p: V(x, 0, 0), n: V(0, sgn, 0), r, a: field(g3) });
  arr3.forEach(({ p, n, r, a }) => setArrow(a, c3.clone().add(p).addScaledVector(n, r), n.clone().multiplyScalar(M.cylE(r / DRAW) * ES_COAX)));
  const gs3 = new THREE.Group(); gs3.position.copy(c3); g3.add(gs3);
  gauss(gs3, xAxis(new THREE.CylinderGeometry(1, 1, L3 - 0.3, 48, 1, true, Math.PI / 2, Math.PI)));
  lines(gs3, [...ring(V(-(L3 - 0.3) / 2, 0, 0), 1), ...ring(V((L3 - 0.3) / 2, 0, 0), 1)], '#6f8fca');
  label('tick', '<i>L</i>', () => c3.clone().add(V(0, -B3 - 0.3, B3)));
  lines(g3, [X3 - L3 / 2, C3y - B3 - 0.18, B3, X3 + L3 / 2, C3y - B3 - 0.18, B3], '#6e6e74');
  label('vec red', '+<i>Q</i>', () => c3.clone().add(V(L3 / 2 + 0.5, 0, 0)));
  label('vec blue', '−<i>Q</i>', () => opened(g3) > 0.5 ? null : c3.clone().add(V(-L3 / 2 + 0.3, B3 + 0.3, 0)));
  const r3lab = V(); label('tick', '<i>r</i>', () => r3lab);

  // ---------- 4 · energy: charging the plates a bit at a time ----------
  const X4 = STATIONS.energy;
  const g4 = asm('energy', root, { title: 'The energy in the gap', sub: 'u = ½ε₀E², filling the volume Ad' });
  const c4 = capacitor(g4, X4);
  plateLabels(X4);
  const fillMat = shadeMat('blue', { opacity: 0.3 });
  const fill4 = part(g4, new THREE.BoxGeometry(D0 - 0.01, SIDE - 0.01, SIDE - 0.01), { tone: 'lo', name: 'Field energy', mat: fillMat, pos: [X4, CY, 0] });
  fill4.userData.noEdge = true;
  const vol4 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(D0, SIDE, SIDE)), new THREE.LineBasicMaterial({ color: '#3d63a8' }));
  vol4.position.set(X4, CY, 0); vol4.userData = { noEdge: true }; g4.add(vol4);
  label('tick', 'volume <i>Ad</i>', when(g4, () => V(X4 + 0.5, CY - SIDE / 2 - 0.15, SIDE / 2)));
  label('vec blue', '<i>u</i> = ½ε<sub>0</sub><i>E</i><sup>2</sup>', when(g4, () => V(X4 + 0.15, CY + SIDE / 2 + 0.25, SIDE / 2)));
  const dq = part(g4, new THREE.SphereGeometry(0.07, 24, 16), { tone: 'hi', pal: 'red', name: 'A bit of charge dq' });
  const push4 = arrow(g4, 'ink', { r: 0.014, head: 0.08, headR: 0.04, name: 'A bit of charge dq' });
  label('tick', '<i>dq</i>', () => dq.visible ? dq.position.clone().add(V(-0.02, 0.18, 0)) : null);
  const UB = 1.8 / M.U0;                        // bar: 1.8 units at 100 V
  const bar4 = part(g4, new THREE.BoxGeometry(0.3, 1, 0.3), { tone: 'hi', pal: 'blue', name: 'Stored energy' });
  lines(g4, [X4 + 0.95, CY - SIDE / 2, 0, X4 + 1.45, CY - SIDE / 2, 0, X4 + 0.95, CY - SIDE / 2 + 1.8, 0, X4 + 1.45, CY - SIDE / 2 + 1.8, 0], '#9a9aa0');
  label('vec', '<i>U</i>', () => V(X4 + 1.2, CY - SIDE / 2 - 0.2, 0.2));
  label('tick', `${(M.U0 * 1e9).toFixed(1)} nJ`, () => V(X4 + 1.95, CY - SIDE / 2 + 1.8, 0));

  // ---------- 5 · series and parallel: 2 µF and 4 µF on 9 V ----------
  const X5 = STATIONS.circuits, by5 = 0.4, ty5 = 2.8;
  const capSide = C => 0.8 * Math.sqrt(C / M.CIRC.C1);      // plate area ∝ C, same gap
  function smallCap(g, cx, cy, C, Q, name) {
    const s = capSide(C), gap = 0.22, mat = shadeMat('paper', { opacity: 0.5 });
    part(g, box(0.035, s, s, 0.01), { tone: 'hi', name, mat, pos: [cx - gap / 2, cy, 0] });
    part(g, box(0.035, s, s, 0.01), { tone: 'hi', name, mat, pos: [cx + gap / 2, cy, 0] });
    // one mark per 2 µC, on the facing sides
    const n = Math.round(Q / 2e-6), m = Math.ceil(Math.sqrt(n * 1.0)), pts = [];
    for (let i = 0; i < n; i++) { const a = i % m, b = Math.floor(i / m), rows = Math.ceil(n / m); pts.push([(a - (m - 1) / 2) * s / (m + 0.4), (b - (rows - 1) / 2) * s / (m + 0.4)]); }
    marks(g, RED, n)(pts.map(([y, z]) => ({ p: V(cx - gap / 2 + 0.02, cy + y, z), u: Y_, v: Z_, n: X_, s: 0.08 })));
    marks(g, BLUE, n)(pts.map(([y, z]) => ({ p: V(cx + gap / 2 - 0.02, cy + y, z), u: Z_, v: Y_, n: X_, s: 0.08 })));
    return gap;
  }
  // series, on the left
  const xs = X5 - 2.2, gS = asm('series', root, { title: 'In series', sub: 'one charge Q, the voltage shared' });
  battery(gS, V(xs, by5, 0), 0.7, 0.12);
  smallCap(gS, xs - 0.6, ty5, M.CIRC.C1, M.SER.Q1, 'C₁ = 2 µF'); smallCap(gS, xs + 0.6, ty5, M.CIRC.C2, M.SER.Q2, 'C₂ = 4 µF');
  wire(gS, [V(xs - 0.38, by5, 0), V(xs - 1.4, by5, 0), V(xs - 1.4, ty5, 0), V(xs - 0.71, ty5, 0)]);
  wire(gS, [V(xs - 0.49, ty5, 0), V(xs + 0.49, ty5, 0)], 'The island between them');
  wire(gS, [V(xs + 0.71, ty5, 0), V(xs + 1.4, ty5, 0), V(xs + 1.4, by5, 0), V(xs + 0.35, by5, 0)]);
  // parallel, on the right
  const xp = X5 + 2.2, gP = asm('parallel', root, { title: 'In parallel', sub: 'one voltage, the charge shared' });
  const my5 = 1.6;
  battery(gP, V(xp, by5, 0), 0.7, 0.12);
  smallCap(gP, xp, ty5, M.CIRC.C1, M.PAR.Q1, 'C₁ = 2 µF'); smallCap(gP, xp, my5, M.CIRC.C2, M.PAR.Q2, 'C₂ = 4 µF');
  wire(gP, [V(xp - 0.38, by5, 0), V(xp - 1.4, by5, 0), V(xp - 1.4, ty5, 0), V(xp - 0.11, ty5, 0)]);
  wire(gP, [V(xp + 0.11, ty5, 0), V(xp + 1.4, ty5, 0), V(xp + 1.4, by5, 0), V(xp + 0.35, by5, 0)]);
  wire(gP, [V(xp - 1.4, my5, 0), V(xp - 0.11, my5, 0)]); wire(gP, [V(xp + 0.11, my5, 0), V(xp + 1.4, my5, 0)]);
  for (const [x, g] of [[xs, gS], [xp, gP]]) {
    label('tick', '9 V', () => V(x + 0.2, by5 - 0.32, 0));
    label('vec red', '<span style="font-size:17px">+</span>', () => V(x - 0.48, by5 + 0.24, 0)); label('vec blue', '<span style="font-size:17px">−</span>', () => V(x + 0.46, by5 + 0.24, 0));
  }
  const capLab = (g, x, y, C, Q, Vv, below = false) => {
    const ly = below ? y - capSide(C * 1e-6) / 2 - 0.2 : y + capSide(C * 1e-6) / 2 + 0.2;
    label('tick', `${C} µF`, () => opened(g) > 0.5 ? null : V(x + 0.24, ly, 0));
    label('tick', `${C} µF · ${(Q * 1e6).toFixed(0)} µC · ${Vv.toFixed(0)} V`, when(g, () => V(x + 0.75, ly, 0)));
  };
  capLab(gS, xs - 0.6, ty5, 2, M.SER.Q1, M.SER.V1); capLab(gS, xs + 0.6, ty5, 4, M.SER.Q2, M.SER.V2);
  capLab(gP, xp, ty5, 2, M.PAR.Q1, M.PAR.V1); capLab(gP, xp, my5, 4, M.PAR.Q2, M.PAR.V2, true);
  label('board', 'series', () => V(xs - 1.4, ty5 + 0.75, 0)); label('board', 'parallel', () => V(xp - 1.4, ty5 + 0.75, 0));
  label('tick', 'island: −<i>Q</i> + <i>Q</i> = 0', when(gS, () => V(xs + 0.55, ty5 - 0.75, 0)));

  // ---------- 6 · a dielectric slab slides in (plates isolated, Q fixed) ----------
  function slabCap(g, cx, molecules) {
    const c = capacitor(g, cx, { lines: false });
    const sl = new THREE.Group(); g.add(sl);
    const sw = D0 - 0.1;
    part(sl, box(sw, SIDE, SIDE - 0.04, 0.02), { tone: 'mid', name: 'Dielectric slab (κ = 3)', mat: shadeMat('board', { opacity: 0.55 }) });
    const mols = [];
    if (molecules) for (let i = 0; i < 2; i++) for (let j = 0; j < 6; j++) for (let k = 0; k < 5; k++) {
      const m = new THREE.Group(); sl.add(m);
      const p = V((i - 0.5) * 0.17, -SIDE / 2 + (j + 0.5) * SIDE / 6, (k - 2) * 0.38 + (j % 2) * 0.1);
      m.position.copy(p);
      part(m, new THREE.SphereGeometry(0.035, 14, 10), { tone: 'mid', pal: 'red', pos: [0, 0.06, 0], name: 'Polar molecules' });
      part(m, new THREE.SphereGeometry(0.035, 14, 10), { tone: 'mid', pal: 'blue', pos: [0, -0.06, 0], name: 'Polar molecules' });
      part(m, new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), { tone: 'mid', pal: 'ink', name: 'Polar molecules' });
      mols.push({ m, h: 1 - (j + 0.5) / 6, th0: (rand() * 2 - 1) * Math.PI * 0.95, psi: rand() * 2 * Math.PI });
    }
    const boundN = marks(sl, BLUE, 40), boundP = marks(sl, RED, 40);
    const arrows = [];
    for (const y of [-0.65, -0.2, 0.25, 0.7]) for (const z of [-0.6, 0, 0.6]) arrows.push({ y, z, a: field(g) });
    return { c, sl, sw, mols, boundN, boundP, arrows };
  }
  // per 0.4 × 0.4 cell of plate, marks ∝ free charge density; cells the slab covers hold κ times more
  const CELLS = []; for (let j = 0; j < 5; j++) for (let k = 0; k < 5; k++) CELLS.push({ y: (j - 2) * 0.4, z: (k - 2) * 0.4, jit: rand() });
  const SUB = [[0, 0], [0.12, 0.12], [-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12]];
  function updateSlab(S, cx, x, st, t) {
    const { c, sl, sw } = S, yTop = CY + SIDE / 2, yEdge = yTop - SIDE * x;   // slab's leading (lower) edge
    sl.position.set(cx, yEdge + SIDE / 2, 0);
    const sig0 = M.EPS0 * M.E0, plus = [], minus = [];
    for (const cell of CELLS) {
      const covered = CY + cell.y > yEdge, n = Math.floor((covered ? st.sigDie : st.sigAir) / sig0 + cell.jit);
      for (let s = 0; s < Math.min(n, SUB.length); s++) {
        const y = CY + cell.y + SUB[s][0], z = cell.z + SUB[s][1];
        plus.push({ p: V(cx - c.d / 2 + 0.004, y, z), u: Y_, v: Z_, n: X_, s: 0.06 });
        minus.push({ p: V(cx + c.d / 2 - 0.004, y, z), u: Z_, v: Y_, n: X_, s: 0.06 });
      }
    }
    c.plus(plus); c.minus(minus);
    // bound charge on the slab's faces, in the part inside the gap: − facing the + plate
    const bN = [], bP = [];
    for (const cell of CELLS) {
      const yw = CY + cell.y; if (yw < yEdge || yw > yTop) continue;
      const n = Math.floor(st.sigBound / sig0 + cell.jit);
      for (let s = 0; s < Math.min(n, SUB.length); s++) {
        const ly = yw + SUB[s][0] - sl.position.y, z = cell.z + SUB[s][1];
        bN.push({ p: V(-sw / 2 - 0.005, ly, z), u: Z_, v: Y_, n: X_, s: 0.05 });
        bP.push({ p: V(sw / 2 + 0.005, ly, z), u: Y_, v: Z_, n: X_, s: 0.05 });
      }
    }
    S.boundN(bN); S.boundP(bP);
    S.arrows.forEach(({ y, z, a }) => setArrow(a, V(cx - st.E * ES / 2, CY + y, z), V(st.E * ES, 0, 0)));
    for (const mo of S.mols) {
      const th = M.moleculeAngle(mo.th0, mo.h, t);
      const dir = V(Math.cos(th), Math.sin(th) * Math.cos(mo.psi), Math.sin(th) * Math.sin(mo.psi));
      mo.m.quaternion.setFromUnitVectors(Y_, dir);
    }
  }
  const X6 = STATIONS.slab;
  const g6 = asm('slab', root, { title: 'A dielectric slab', sub: 'the molecules turn and cancel part of the field' });
  const S6 = slabCap(g6, X6, true);
  plateLabels(X6);
  label('vec blue', '<i>E</i>', () => V(X6 + 0.05, CY - SIDE / 2 - 0.25, 0.6));
  // breakdown: the free-charge field, the molecules' opposing field, and what is left
  const e6 = { free: comp(g6), ind: comp(g6), net: field(g6, 0.02) };
  label('vec', '<i>E</i><sub>0</sub>', when(g6, () => tipOf(e6.free))); label('vec', '<i>E</i><sub>ind</sub>', when(g6, () => tipOf(e6.ind))); label('vec blue', '<i>E</i>', when(g6, () => tipOf(e6.net)));
  label('tick', 'κ = 3', () => S6.sl.localToWorld(V(0, SIDE / 2 + 0.15, SIDE / 2)));

  // ---------- 7 · the same slab, battery connected vs disconnected ----------
  const X7 = STATIONS.compare, xa = X7 - 1.8, xb = X7 + 1.8;
  const gA = asm('battery', root, { title: 'Battery connected', sub: 'ΔV held at 100 V: more charge flows on' });
  const gB = asm('isolated', root, { title: 'Battery disconnected', sub: 'Q held: the voltage falls' });
  const S7a = slabCap(gA, xa, false), S7b = slabCap(gB, xb, false);
  hookUp(gA, xa, D0);
  label('board', 'connected', () => V(xa - 1.0, CY + SIDE / 2 + 0.85, -1));
  label('board', 'disconnected', () => V(xb - 1.0, CY + SIDE / 2 + 0.85, -1));
  label('tick', '100 V', () => V(xa + 0.1, 0.0, 0.3));

  // ---------- 8 · a conducting sphere in a uniform field ----------
  const X8 = STATIONS.conductor, C8y = 1.8, R8 = M.COND.R * DRAW, c8 = V(X8, C8y, 0);
  const g8 = asm('conductor', root, { title: 'A conductor in a field', sub: 'charges move until E = 0 inside' });
  [0, 1].map(k => {
    const h = mover(g8, [0, k ? -1.2 : 1.2, 0]); h.position.copy(c8); h.userData.home.copy(c8);
    part(h, new THREE.SphereGeometry(R8, 64, 32, 0, 2 * Math.PI, k ? Math.PI / 2 : 0, Math.PI / 2), { tone: 'hi', name: 'Conducting sphere' });
    const cap = new THREE.CircleGeometry(R8, 64); cap.rotateX(k ? Math.PI / 2 : -Math.PI / 2);
    part(h, cap, { tone: 'hi', pal: 'board', name: 'Conducting sphere' });
    // induced surface charge σ = 3ε₀E₀ cos θ: + where the field leaves (+x), − where it arrives
    const sites = fib(900, (d, i) => (k ? d.y < 0 : d.y >= 0) && ((i * 0.618034) % 1) < Math.abs(d.x) * 0.9);
    marks(h, RED, 400)(sites.filter(d => d.x > 0).map(n => ({ p: n.clone().multiplyScalar(R8 + 0.004), u: tangents(n)[0], v: tangents(n)[1], n, s: 0.1 })));
    marks(h, BLUE, 400)(sites.filter(d => d.x < 0).map(n => ({ p: n.clone().multiplyScalar(R8 + 0.004), u: tangents(n)[0], v: tangents(n)[1], n, s: 0.1 })));
    return h;
  });
  // field lines, traced from the model in three planes through the field axis; those that end on
  // the sphere reappear, mirrored, leaving its far side
  const lineMat = shadeMat('blue');
  for (const phi of [0, 60, 120]) for (const rho of [-0.25, -0.17, -0.1, -0.04, 0.04, 0.1, 0.17, 0.25]) {
    const f = phi * Math.PI / 180, s = [-0.3, rho * Math.cos(f), rho * Math.sin(f)];
    const pts = M.traceLine(s), hit = Math.hypot(...pts[pts.length - 1]) < M.COND.R * 1.05;
    const paths = [pts]; if (hit) paths.push(pts.map(([x, y, z]) => [-x, y, z]).reverse());
    for (const P of paths) {
      const curve = new THREE.CatmullRomCurve3(P.filter((_, i) => i % 3 === 0 || i === P.length - 1).map(p => V(...p).multiplyScalar(DRAW).add(c8)));
      const tube = part(g8, new THREE.TubeGeometry(curve, Math.max(8, P.length / 3 | 0), 0.011, 6), { tone: 'lo', name: 'Field lines', mat: lineMat });
      tube.userData.noEdge = true;
      const u = P[0][0] < 0 && !hit ? 0.25 : P === paths[0] ? 0.4 : 0.6, at = curve.getPointAt(u), tg = curve.getTangentAt(u);
      const head = part(g8, new THREE.ConeGeometry(0.045, 0.12, 14), { tone: 'mid', pal: 'blue', name: 'Field lines' });
      head.position.copy(at); head.quaternion.setFromUnitVectors(Y_, tg); head.userData.home.copy(at);
    }
  }
  // the probe: a point moving along the field axis, with the field there
  const probe = part(g8, new THREE.SphereGeometry(0.05, 16, 12), { tone: 'hi', pal: 'ink', name: 'Probe' });
  const probeE = field(g8, 0.022);
  label('vec blue', '<i>E</i>', () => tipOf(probeE));
  label('vec blue', '<i>E</i><sub>0</sub>', () => c8.clone().add(V(-2.9, 2.9, 0)));
  const inner8 = new THREE.Group(); inner8.position.copy(c8); g8.add(inner8);
  gauss(inner8, new THREE.SphereGeometry(R8 * 0.65, 40, 24), 'Gaussian surface inside');
  label('tick', '<i>E</i> = 0 inside', when(g8, () => c8.clone().add(V(0.5, 0, R8))));

  // ---------- per-frame ----------
  function update(s) {
    // 0 · battery turned up and down: Q ∝ ΔV
    { const r = M.charging(s.charge.t), n = 25 * r.Q / M.Q0;
      c0.charge(n);
      // each plate alone: σ/2ε₀, away from + and toward −; they add in the gap and cancel outside
      const ex = opened(g0), half = r.sigma / (2 * M.EPS0) * ES;
      // opened: the field lines give way to this one row through the middle of the plates
      if (ex > 0.3) c0.fl.forEach(a => { a.visible = false; });
      parts0.forEach(({ k, ep, en, sum }) => {
        const p = V(X0 + k * 1.05 - (k === 0 ? half / 2 : 0), CY, 0);
        setArrow(ep, p.clone().add(V(0, 0.13, 0)), V(k === -1 ? -half : half, 0, 0), ex);
        setArrow(en, p.clone().add(V(0, -0.13, 0)), V(k === 1 ? -half : half, 0, 0), ex);
        setArrow(sum, V(X0 - half, CY - 0.4, 0), V(2 * half, 0, 0), k === 0 ? ex : 0);
      }); }

    // 1 · gap opens and closes; E stays, ΔV = Ed grows
    { const r = M.gapScene(s.gap.t), d = r.d * DRAW;
      c1.place(d); c1.charge(25);
      pb.userData.home.set(X1 - d / 2 - T / 2, CY + 0.36, SIDE / 2 - PBR - 0.05);
      const y = CY - SIDE / 2 - 0.1, z = SIDE / 2, a = X1 - d / 2, b = X1 + d / 2;
      dimD.geometry.attributes.position.array.set([a, y, z, b, y, z, a, y - 0.06, z, a, y + 0.06, z, b, y - 0.06, z, b, y + 0.06, z]);
      dimD.geometry.attributes.position.needsUpdate = true; }

    // 2 · Gaussian sphere sweeps from a to b
    { const r = M.gaussR(s.sweep.t, M.SPH.a, M.SPH.b) * DRAW;
      gs2.scale.setScalar(r);
      const n = V(Math.cos(-0.5), Math.sin(-0.5), 0), e = c2.clone().addScaledVector(n, r);
      rad2.geometry.attributes.position.array.set([...c2.toArray(), ...e.toArray()]); rad2.geometry.attributes.position.needsUpdate = true;
      r2lab.copy(c2).addScaledVector(n, r * 0.8).add(V(0.06, 0.16, 0)); }

    // 3 · Gaussian cylinder sweeps from a to b
    { const r = M.gaussR(s.sweep.t, M.CYL.a, M.CYL.b) * DRAW;
      gs3.scale.set(1, r, r);
      r3lab.copy(c3).add(V(-L3 / 2 + 0.05, -r - 0.05, 0)); }

    // 4 · charging a bit at a time
    { const r = M.filling(s.fill.t), n = 25 * r.q / M.Q0;
      c4.charge(n);
      fillMat.uniforms.uOpacity.value = 0.42 * r.u / (0.5 * M.EPS0 * M.E0 * M.E0);
      fill4.visible = r.u > 0;
      vol4.visible = opened(g4) > 0.3;
      const h = Math.max(r.U * UB, 0.002); bar4.scale.y = h; bar4.position.set(X4 + 1.2, CY - SIDE / 2 + h / 2, 0); bar4.userData.home.copy(bar4.position);
      // a bit of charge dq carried from the − plate to the + plate, against the field
      const run = !s.fill.resting, u = (s.clock % M.DQ_T) / M.DQ_T;
      const p = V(X4 + D0 / 2 - 0.08 - (D0 - 0.16) * u, CY + 0.55, SIDE / 2 - 0.25);
      dq.visible = run; dq.position.copy(p); dq.userData.home.copy(p);
      setArrow(push4, p.clone().add(V(0.06, 0.13, 0)), V(-Math.max(r.E * ES, 0.05), 0, 0), run ? 1 : 0); }

    // 6 · slab in, Q fixed
    { const x = M.fillOf(s.slide.t), st = M.slab(x, false);
      updateSlab(S6, X6, x, st, s.slide.t);
      const ex = opened(g6), p = V(X6 - 0.25, CY + SIDE / 2 - 0.15, SIDE / 2 + 0.35), Ef = st.Efree * ES, Ei = st.Eind * ES;
      const covered = x > 0.1;
      setArrow(e6.free, p.clone().add(V(0, 0.14, 0)), V(Ef, 0, 0), ex * (covered ? 1 : 0));
      setArrow(e6.ind, p.clone().add(V(Ef, 0, 0)), V(-Ei, 0, 0), ex * (covered ? 1 : 0));
      setArrow(e6.net, p.clone().add(V(0, -0.16, 0)), V(st.E * ES, 0, 0), ex * (covered ? 1 : 0)); }

    // 7 · the same slab, connected and disconnected
    { const x = M.fillOf(s.slide.t);
      updateSlab(S7a, xa, x, M.slab(x, true), s.slide.t); updateSlab(S7b, xb, x, M.slab(x, false), s.slide.t); }

    // 8 · the probe moves along the axis; inside the conductor E = 0
    { const xm = M.probeX(s.clock), Ex = M.condAxisE(xm), p = c8.clone().add(V(xm * DRAW, 0, 0));
      probe.position.copy(p); probe.userData.home.copy(p);
      setArrow(probeE, p.clone().add(V(0, 0, 0)), V(Ex * ES, 0, 0), Ex > 0 ? 1 : 0);
      inner8.visible = opened(g8) > 0.2; }
  }
  return { update, labels };
}
