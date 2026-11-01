// The figure: ten induction scenes in a row, one per page. Bar magnets and loops, two coils and
// an iron core, a loop leaving a wire, a bar and a loop moving through a field, a bar on rails, a
// solenoid, an RL circuit and an LC circuit. Grey: magnetic field B (⊙ out of the page, ⊗ into it); dashed grey:
// the induced field. Black arrows along a wire: current I. Blue: electric field. Red: net force.
// Every position, arrow and number comes from model.js.
import * as THREE from 'three';
import { part, box, lines, arrow, setArrow, shadeMat, xAxis, V } from '../engine/parts.js';
import * as M from './model.js';

export const STATIONS = { flux: 0, lenz: 16, mutual: 33, wire: 48, bar: 63, crossing: 78, rails: 93, solenoid: 108, rl: 123, lc: 138 };
// drawing scales: scene units (one grid square) per real metre, and arrow lengths
export const DRAW = { flux: 10, lenz: 8, mutual: 10, core: 10, wire: 15, bar: 4, crossing: 4, rails: 3, solenoid: 12 };
export const K = {
  fluxI: 0.2 / 1e-3, fluxB: 40,                 // units per ampere, per tesla
  lenzI: 0.1 / 1e-3, lenzB: 100, lenzV: 7,
  coilI1: 0.25, coilI2: 2 / 1e-3, coilB: 1 / 1e-3,
  coreI1: 1, coreI2: 0.2 / 1e-3, coreB: 4,
  wireI: 2.5 / 1e-3, wireV: 8,
  barV: 1.6, barE: 4,
  crossI: 5, crossV: 1.6,
  railI: 0.5, railV: 1, railF: 4,
  solB: 0.2 / 1e-3, solI: 0.3,
  rlI: 0.25,
  lcI: 10, lcE: 1 / 1e4, lcB: 1 / 2e-3,     // units per ampere, per V/m, per tesla
};
const RED = '#e5484d', BLUE = '#3d63a8', GREY = '#86868c';
const f3 = x => x.toFixed(2);
const grey = h => `<span style="color:#76767c">${h}</span>`;
const X_ = V(1, 0, 0), Y_ = V(0, 1, 0), Z_ = V(0, 0, 1);

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at, text) => labels.push({ cls, html, at, text });
  const opened = g => Math.max(g.userData.explode, 0);
  const when = (g, p) => () => opened(g) > 0.5 ? p() : null;

  // faint graph-paper ground
  const grid = [];
  for (let x = -6; x <= 147; x++) grid.push(x, 0.001, -3, x, 0.001, 3);
  for (let z = -3; z <= 3; z++) grid.push(-6, 0.001, z, 147, 0.001, z);
  lines(root, grid, '#e6e6e2');

  // ---------- kit ----------
  const onTop = a => { a.userData.arrow.shaft.material.transparent = true; return a; };
  const bArrow = (g, r = 0.02, name = 'Magnetic field') => onTop(arrow(g, 'dark', { r, head: 0.11, headR: 0.055, name, tone: 'hi' }));
  const iArrow = (g, name = 'Induced current') => onTop(arrow(g, 'ink', { r: 0.02, head: 0.11, headR: 0.055, name }));
  const flatMat = (pal, opacity) => { const m = shadeMat(pal, { opacity }); m.side = THREE.DoubleSide; return m; };
  const tipOf = (a, k = 0.16) => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + k, 0)) : null;
  const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
  const rod = (g, a, b, r = 0.022, pal = 'ink', name = 'Wires') => {
    const m = part(g, rodGeo, { tone: 'hi', pal, name });
    m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(r, Math.max(a.distanceTo(b), 1e-4), r);
    m.quaternion.setFromUnitVectors(Y_, b.clone().sub(a).normalize()); m.userData.home.copy(m.position);
    return m;
  };
  const path = (g, pts, r, pal, name) => { for (let i = 0; i + 1 < pts.length; i++) rod(g, pts[i], pts[i + 1], r, pal, name); };
  // a circular loop of wire in the plane facing ±x, centred at c
  const ring = (g, c, a, tube = 0.022, name = 'Loop', pal = 'ink') => { const geo = new THREE.TorusGeometry(a, tube, 12, 72); geo.rotateY(Math.PI / 2); return part(g, geo, { tone: 'hi', pal, pos: c.toArray(), name }); };
  // a helix of n turns along x (or y) from p0 to p1, radius R
  const helix = (g, p0, p1, R, n, tube, name, pal = 'ink') => {
    const ax = p1.clone().sub(p0), L = ax.length(), u = ax.clone().normalize();
    const e1 = Math.abs(u.y) > 0.9 ? X_.clone() : Y_.clone(), e2 = u.clone().cross(e1).normalize(); e1.copy(e2.clone().cross(u)).normalize();
    const pts = []; const m = n * 40;
    for (let i = 0; i <= m; i++) { const s = i / m, t = 2 * Math.PI * n * s; pts.push(p0.clone().addScaledVector(u, L * s).addScaledVector(e1, R * Math.cos(t)).addScaledVector(e2, R * Math.sin(t))); }
    return part(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), m, tube, 8, false), { tone: 'hi', pal, name });
  };
  // a field line as a thin tube with an arrowhead part-way along (noEdge: it would outline a cage)
  const headGeo = new THREE.ConeGeometry(0.05, 0.14, 14);
  function fieldLine(g, pts, { r = 0.011, mat, at = [0.5], name = 'Field lines', headScale = 1 } = {}) {
    if (pts.length < 3) return null;
    const curve = new THREE.CatmullRomCurve3(pts);
    const t = part(g, new THREE.TubeGeometry(curve, Math.min(200, pts.length * 2), r, 6), { tone: 'lo', name, mat });
    t.userData.noEdge = true;
    const heads = at.map(u => {
      const h = part(g, headGeo, { tone: 'mid', name, mat });
      h.position.copy(curve.getPointAt(u)); h.quaternion.setFromUnitVectors(Y_, curve.getTangentAt(u)); h.scale.setScalar(headScale); h.userData.home.copy(h.position); h.userData.noEdge = true;
      return h;
    });
    return { t, heads, curve };
  }
  // dashes: a field line or an arrow drawn as short rods, for the induced field
  const dashGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
  function dashedCurve(g, pts, { r = 0.012, dash = 0.09, gap = 0.07, name = 'Induced field', at = [0.5] } = {}) {
    const curve = new THREE.CatmullRomCurve3(pts), L = curve.getLength(), out = [];
    for (let s = 0; s + dash < L; s += dash + gap) {
      const a = curve.getPointAt(s / L), b = curve.getPointAt((s + dash) / L);
      const m = part(g, dashGeo, { tone: 'mid', pal: 'dark', name });
      m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(r, a.distanceTo(b), r); m.quaternion.setFromUnitVectors(Y_, b.clone().sub(a).normalize()); m.userData.noEdge = true;
      out.push(m);
    }
    const heads = at.map(u => { const h = part(g, headGeo, { tone: 'mid', pal: 'dark', name }); h.position.copy(curve.getPointAt(u)); h.userData.q = [curve.getTangentAt(u), curve.getTangentAt(u).negate()].map(t => new THREE.Quaternion().setFromUnitVectors(Y_, t)); h.quaternion.copy(h.userData.q[0]); h.userData.noEdge = true; return h; });
    return { dashes: out, heads, setSign(sg) { for (const h of heads) h.quaternion.copy(h.userData.q[sg >= 0 ? 0 : 1]); } };
  }
  function dashArrow(g, name = 'Induced field', n = 7) {
    const grp = new THREE.Group(); g.add(grp);
    const mat = shadeMat('dark').clone(); mat.depthTest = false;
    const ds = Array.from({ length: n }, () => { const m = part(grp, dashGeo, { tone: 'mid', pal: 'dark', name, mat }); m.renderOrder = 10; return m; });
    const head = part(grp, headGeo, { tone: 'mid', pal: 'dark', name, mat }); head.renderOrder = 10;
    return { grp, head, set(from, vec, vis = 1) {
      const L = vec.length(); grp.visible = vis > 0.01 && L > 0.05; if (!grp.visible) return;
      const u = vec.clone().normalize(), body = L - 0.13, seg = body / (n - 0.4);
      ds.forEach((m, i) => { const a = from.clone().addScaledVector(u, i * seg), b = a.clone().addScaledVector(u, seg * 0.6); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(0.016, seg * 0.6, 0.016); m.quaternion.setFromUnitVectors(Y_, u); });
      head.position.copy(from).addScaledVector(u, L - 0.07); head.quaternion.setFromUnitVectors(Y_, u);
    }, tip: (dy = 0.16) => grp.visible ? head.getWorldPosition(V()).add(V(0, dy, 0)) : null };
  }
  // B markers in a plane facing +z: ⊗ into the page, ⊙ out of it
  function bMarkers(g, list, color = '#8a8a90') {
    const seg = [];
    for (const { p, r, out } of list) {
      for (let i = 0; i < 24; i++) { const a = 2 * Math.PI * i / 24, b = 2 * Math.PI * (i + 1) / 24; seg.push(p.x + r * Math.cos(a), p.y + r * Math.sin(a), p.z, p.x + r * Math.cos(b), p.y + r * Math.sin(b), p.z); }
      if (!out) { const k = r * 0.62; seg.push(p.x - k, p.y - k, p.z, p.x + k, p.y + k, p.z, p.x - k, p.y + k, p.z, p.x + k, p.y - k, p.z); }
    }
    const l = lines(g, seg, color);
    const outs = list.filter(m => m.out);
    if (outs.length) {
      const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color }), outs.length);
      dots.userData.noEdge = true; const M4 = new THREE.Matrix4();
      outs.forEach((m, i) => { M4.makeScale(m.r * 0.3, m.r * 0.3, 1).setPosition(m.p); dots.setMatrixAt(i, M4); });
      g.add(dots);
    }
    return l;
  }
  // charge marks: tiny flat + and − bars lying on a surface (u, v span it)
  function marks(parent, color, max) {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color }), max * 2);
    m.userData.noEdge = true; m.count = 0; m.frustumCulled = false; parent.add(m);
    const M4 = new THREE.Matrix4();
    const put = (k, p, a, b, len, w) => { M4.makeBasis(a.clone().multiplyScalar(len), b.clone().multiplyScalar(w), a.clone().cross(b).normalize().multiplyScalar(w * 0.5)).setPosition(p); m.setMatrixAt(k, M4); };
    return items => {
      let k = 0;
      for (const { p, s = 0.09 } of items) { if (k + 2 > max * 2) break; put(k++, p, X_, Y_, s, s * 0.3); if (color === RED) put(k++, p, Y_, X_.clone().negate(), s, s * 0.3); }
      m.count = k; m.instanceMatrix.needsUpdate = true;
    };
  }
  // current arrows on a circular loop (top and bottom), circulating right-handed about n
  function ringArrows(g) {
    const a = [iArrow(g), iArrow(g)];
    return { a, set(c, R, n, I, k) {
      const t = n.clone().cross(Y_).normalize(), len = I * k, on = Math.abs(len) > 0.03 ? 1 : 0;
      const v = t.multiplyScalar(len);
      setArrow(a[0], c.clone().add(V(0, R + 0.09, 0)).addScaledVector(v, -0.5), v, on);
      setArrow(a[1], c.clone().add(V(0, -R - 0.09, 0)).addScaledVector(v, 0.5), v.clone().negate(), on);
    } };
  }
  // current arrows on a rectangle in a plane facing +z, circulating right-handed about n
  function rectArrows(g) {
    const sides = [Y_, Y_.clone().negate(), X_, X_.clone().negate()].map(o => ({ o, A: iArrow(g) }));
    return { sides, set(c, w, h, n, I, k) {
      const len = I * k, on = Math.abs(len) > 0.03 ? 1 : 0;
      for (const { o, A } of sides) {
        const half = Math.abs(o.x) ? w / 2 : h / 2, t = n.clone().cross(o).normalize().multiplyScalar(len);
        setArrow(A, c.clone().addScaledVector(o, half + 0.1).addScaledVector(t, -0.5), t, on);
      }
    } };
  }
  // a bar magnet along x: the near pole at local x = 0, the far one at len (in metres × D)
  const polesOf = nearIsN => nearIsN ? [0, M.MAG.len] : [M.MAG.len, 0];
  function magnet(g, D, nearIsN, name = 'Bar magnet') {
    const mg = new THREE.Group(); g.add(mg);
    const L = M.MAG.len * D, w = M.MAG.w * D;
    part(mg, box(L / 2, w, w, 0.01), { tone: 'hi', pal: nearIsN ? 'dark' : 'paper', pos: [L / 4, 0, 0], name });
    part(mg, box(L / 2, w, w, 0.01), { tone: 'hi', pal: nearIsN ? 'paper' : 'dark', pos: [3 * L / 4, 0, 0], name });
    const pl = n => `<span style="font:500 15px var(--sans);color:${n === 'N' ? '#fff' : '#2c2c30'}">${n}</span>`;
    label('vec', pl(nearIsN ? 'N' : 'S'), () => mg.localToWorld(V(L / 4, 0, w / 2 + 0.01)));
    label('vec', pl(nearIsN ? 'S' : 'N'), () => mg.localToWorld(V(3 * L / 4, 0, w / 2 + 0.01)));
    return mg;
  }
  // the magnet's field lines, traced from its N pole in the model, in local scene units
  function magnetLines(mg, D, nearIsN, { thetas, phis, box: Rb = 0.3, mat, r = 0.011 }) {
    const [xN, xS] = polesOf(nearIsN), away = nearIsN ? -1 : 1, c = M.MAG.len / 2;
    const Bf = p => M.magnetB(p, xN, xS);
    for (const ph of phis) for (const th of thetas) {
      const t = th * Math.PI / 180, f = ph * Math.PI / 180;
      const d = [away * Math.cos(t), Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f)];
      const pts = M.traceLine(Bf, [xN + 0.005 * d[0], 0.005 * d[1], 0.005 * d[2]], { step: 0.003, max: 700, stop: q => Math.hypot(q[0] - xS, q[1], q[2]) < 0.006 || Math.hypot(q[0] - c, q[1], q[2]) > Rb });
      fieldLine(mg, pts.filter((_, i) => i % 3 === 0).map(p => V(...p).multiplyScalar(D)), { r, mat, at: [th < 60 ? 0.3 : 0.5] });
    }
  }
  // the field lines of one circular turn (radius a, in the plane x = 0, current right-handed about
  // +x), traced in the model, in metres; each closes back through the loop or leaves the box
  function ringLines(a, starts, Rb) {
    return starts.map(y0 => {
      const pts = M.traceLine(p => M.ringB(p, a, 0, 1, 90), [0, y0, 0], { step: a / 40, max: 600, stop: q => Math.hypot(...q) > Rb });
      // stop once it has come round to the disc again
      let end = pts.length;
      for (let i = 20; i < pts.length; i++) if (pts[i - 1][0] < 0 && pts[i][0] >= 0 && Math.abs(pts[i][1]) < a) { end = i + 1; break; }
      return pts.slice(0, end);
    });
  }

  // ======================================================================================
  // 0 · a bar magnet slides toward a loop and back: flux and Faraday's law
  const X0 = STATIONS.flux, D0 = DRAW.flux, CY0 = 1.7, c0 = V(X0, CY0, 0), A0 = M.FLUX.a * D0;
  const g0 = asm('flux', root, { title: 'Flux through the loop', sub: 'Φ = ∫B·dA, summed over little patches dA' });
  ring(g0, c0, A0, 0.024, 'Wire loop');
  const mag0 = magnet(g0, D0, true);
  const lineMat0 = shadeMat('dark', { opacity: 0.6 });
  magnetLines(mag0, D0, true, { thetas: [18, 40, 70, 110], phis: [0, 90, 180, 270], box: 0.2, mat: lineMat0 });
  g0.userData.focus = () => ({ target: [X0 + 0.6, CY0, 0], radius: 1.3 });
  const area0 = arrow(g0, 'ink', { r: 0.014, head: 0.09, headR: 0.042, name: 'Area vector' });
  setArrow(area0, c0, V(-0.75, 0, 0));
  label('vec', '<i>A</i>', () => c0.clone().add(V(-0.95, 0.02, 0)));
  const I0arr = ringArrows(g0);
  label('vec', '<i>I</i>', () => tipOf(I0arr.a[0], 0.14));
  const bind0 = dashArrow(g0);
  label('vec', grey('<i>B</i><sub>ind</sub>'), () => bind0.tip(-0.2));
  // breakdown: B·dA at patches across the loop's disc, the disc itself
  const disc0 = part(g0, (() => { const d = new THREE.CircleGeometry(A0, 48); d.rotateY(-Math.PI / 2); return d; })(), { tone: 'lo', name: 'Flat surface across the loop', mat: flatMat('board', 0.55), pos: c0.toArray() });
  disc0.userData.noEdge = true;
  const patches0 = [[0, 0]];
  for (const [rr, n] of [[0.45, 6], [0.85, 12]]) for (let i = 0; i < n; i++) { const t = 2 * Math.PI * (i + 0.5 * (n === 12)) / n; patches0.push([rr * A0 * Math.cos(t), rr * A0 * Math.sin(t)]); }
  const dA0 = patches0.map(([y, z]) => ({ y, z, a: bArrow(g0, 0.012, 'B·dA at each patch') }));
  label('tick', '<i>B</i>·<i>dA</i>', when(g0, () => tipOf(dA0[0].a)));
  label('tick', 'Φ = ∫<i>B</i>·<i>dA</i>', when(g0, () => c0.clone().add(V(0.05, -A0 - 0.3, 0))));

  // ======================================================================================
  // 1 · Lenz's law: four cases in a 2 × 2 grid
  const X1 = STATIONS.lenz, D1 = DRAW.lenz, A1 = M.LENZ.a * D1;
  const LZ = M.CASES.map((c, i) => {
    const o = V(X1 + (i % 2 ? 0.9 : -3.3), i < 2 ? 3.15 : 1.05, 0);
    const g = asm(c.key, root, { title: c.name, sub: c.move === 'in' ? 'more flux: the loop’s field pushes back' : 'less flux: the loop’s field tries to keep it' });
    ring(g, o, A1, 0.022, 'Wire loop');
    const mg = magnet(g, D1, c.pole === 'N');
    magnetLines(mg, D1, c.pole === 'N', { thetas: [22, 48, 80, 118], phis: [0, 180], box: 0.16, mat: shadeMat('dark', { opacity: 0.8 }), r: 0.01 });
    const B = bArrow(g, 0.018, 'Magnet’s field at the loop'), ind = dashArrow(g), cur = ringArrows(g);
    const v = arrow(g, 'ink', { r: 0.014, head: 0.09, headR: 0.042, name: 'Velocity' });
    label('board', c.name, () => o.clone().add(V(-0.75, 0.82, 0)));
    label('vec', grey('<i>B</i>'), () => tipOf(B, 0.14));
    label('vec', grey('<i>B</i><sub>ind</sub>'), () => ind.tip(-0.22));
    g.userData.focus = () => ({ target: [o.x + 1.0, o.y, 0], radius: 1.7 });
    label('vec', '<i>I</i>', () => tipOf(cur.a[0], 0.14));
    label('vec', '<i>v</i>', () => tipOf(v, 0.12));
    // breakdown: the induced field's lines around the loop, dashed
    const rl = new THREE.Group(); rl.position.copy(o); g.add(rl);
    const dl = ringLines(M.LENZ.a, [0.3, 0.6, 0.82].flatMap(k => [k, -k]).map(k => k * M.LENZ.a), 0.11)
      .map(pts => dashedCurve(rl, pts.filter((_, j) => j % 2 === 0).map(p => V(...p).multiplyScalar(D1)), { r: 0.009, dash: 0.07, gap: 0.05, at: [0.25] }));
    return { c, o, g, mg, B, ind, cur, v, rl, dl };
  });

  // ======================================================================================
  // 2a · two coils on one axis: a changing current in one induces a current in the other
  const X2 = STATIONS.mutual, D2 = DRAW.mutual, A2 = M.COILS.a * D2, y2 = 2.95;
  const c21 = V(X2 - M.COILS.sep * D2 / 2, y2, 0), c22 = V(X2 + M.COILS.sep * D2 / 2, y2, 0);
  const gC = asm('mutual', root, { title: 'Two coils', sub: 'coil 1’s changing field threads coil 2' });
  ring(gC, c21, A2, 0.06, 'Coil 1 (100 turns, driven)');
  ring(gC, c22, A2, 0.06, 'Coil 2 (100 turns)');
  const lineMatC = shadeMat('dark', { opacity: 0.8 });
  const linesC = new THREE.Group(); linesC.position.copy(c21); gC.add(linesC);
  for (const pts of ringLines(M.COILS.a, [0.25, 0.55, 0.8].flatMap(k => [k, -k]).map(k => k * M.COILS.a), 0.13))
    fieldLine(linesC, pts.filter((_, j) => j % 2 === 0).map(p => V(...p).multiplyScalar(D2)), { r: 0.01, mat: lineMatC, at: [0.12] });
  const I1C = ringArrows(gC), I2C = ringArrows(gC), B1C = bArrow(gC, 0.02, 'Coil 1’s field at coil 2'), indC = dashArrow(gC);
  label('vec', '<i>I</i><sub>1</sub>(<i>t</i>)', () => tipOf(I1C.a[0], 0.14)?.add(V(-0.25, 0.05, 0)));
  label('vec', '<i>I</i><sub>2</sub>', () => tipOf(I2C.a[0], 0.14));
  label('vec', grey('<i>B</i><sub>1</sub>'), () => tipOf(B1C, 0.14));
  label('vec', grey('<i>B</i><sub>ind</sub>'), () => indC.tip(-0.22));
  gC.userData.focus = () => ({ target: [X2, y2, 0], radius: 1.25 });
  label('tick', 'coil 1', () => c21.clone().add(V(-0.1, -A2 - 0.32, 0)));
  label('tick', 'coil 2', () => c22.clone().add(V(0.5, -A2 - 0.32, 0)));
  const discC = part(gC, (() => { const d = new THREE.CircleGeometry(A2 - 0.05, 48); d.rotateY(Math.PI / 2); return d; })(), { tone: 'lo', name: 'Coil 2’s area', mat: flatMat('board', 0.55), pos: c22.toArray() });
  discC.userData.noEdge = true;
  label('tick', 'Φ<sub>2</sub> = <i>MI</i><sub>1</sub>/<i>N</i><sub>2</sub>', when(gC, () => c22.clone().add(V(0.9, A2 + 0.3, 0))));

  // 2b · two windings on an iron rod
  const DC = DRAW.core, yC = 0.95, RC = M.CORE.r * DC, LC = M.CORE.len * DC;
  const gK = asm('core', root, { title: 'An iron core', sub: 'the iron carries the flux from one winding to the other' });
  part(gK, xAxis(new THREE.CylinderGeometry(RC, RC, LC, 40)), { tone: 'hi', pal: 'dark', pos: [X2, yC, 0], name: 'Iron core', mat: shadeMat('dark', { opacity: 0.55 }) });
  const prim = new THREE.Group(); gK.add(prim);
  helix(prim, V(X2 + 0.3, yC, 0), V(X2 + 1.3, yC, 0), RC + 0.04, 10, 0.022, 'Primary (200 turns)');
  path(prim, [V(X2 + 0.3, yC + RC + 0.04, 0), V(X2 + 0.3, yC + 0.45, 0)]); path(prim, [V(X2 + 1.3, yC + RC + 0.04, 0), V(X2 + 1.3, yC + 0.45, 0)]);
  const sec = new THREE.Group(); sec.userData = { home: V(), ex: V(0, 0.75, 0) }; gK.add(sec);
  helix(sec, V(X2 - 1.3, yC, 0), V(X2 - 0.6, yC, 0), RC + 0.04, 5, 0.022, 'Secondary (100 turns)');
  path(sec, [V(X2 - 1.3, yC + RC + 0.04, 0), V(X2 - 1.3, yC + 0.45, 0)]); path(sec, [V(X2 - 0.6, yC + RC + 0.04, 0), V(X2 - 0.6, yC + 0.45, 0)]);
  const BK = bArrow(gK, 0.024, 'Field in the iron'), indK = dashArrow(gK), I1K = iArrow(gK, 'Primary current'), I2K = iArrow(gK);
  label('vec', grey('<i>B</i>(<i>t</i>)'), () => tipOf(BK, 0)?.add(V(0, -0.33, 0)));
  label('vec', grey('<i>B</i><sub>ind</sub>'), () => indK.tip(-0.32));
  gK.userData.focus = () => ({ target: [X2, yC + 0.25, 0], radius: 1.45 });
  label('vec', '<i>I</i>(<i>t</i>)', () => tipOf(I1K, 0.14));
  label('vec', '<i>I</i><sub>ind</sub>', () => tipOf(I2K, 0.14));
  label('tick', 'iron', () => V(X2 - 0.05, yC - RC - 0.25, 0.2));
  label('tick', 'Φ = <i>BA</i> through every turn', when(gK, () => V(X2 - 0.2, yC + RC + 0.45, 0)));

  // ======================================================================================
  // 3 · a rectangular loop moving away from a long straight wire
  const X3 = STATIONS.wire, D3 = DRAW.wire, yW = 3.7, b3 = M.WIRE.b * D3, a3 = M.WIRE.a * D3;
  const g3 = asm('wire', root, { title: 'A loop leaving a wire', sub: 'Φ = ∫B b dr, with B falling as 1/r' });
  rod(g3, V(X3 - 3.1, yW, 0), V(X3 + 2.4, yW, 0), 0.035, 'ink', 'Long straight wire (50 A)');
  const Iw = iArrow(g3, 'Long straight wire (50 A)'); setArrow(Iw, V(X3 - 3.05, yW + 0.15, 0), V(0.6, 0, 0));
  label('vec', '<i>I</i> = 50 A', () => V(X3 - 2.75, yW + 0.45, 0));
  const rows3 = [[0.015, 1], [0.03, 1], [0.055, 1], [0.015, -1], [0.035, -1], [0.07, -1], [0.11, -1], [0.16, -1], [0.22, -1]];
  const mk3 = [];
  for (const [r, s] of rows3) for (let i = 0; i < 8; i++) mk3.push({ p: V(X3 - 2.1 + i * 0.6, yW + s * r * D3, -0.03), r: 3.6 * Math.sqrt(M.wireB(r)), out: s > 0 });
  bMarkers(g3, mk3);
  label('vec', grey('<i>B</i>'), () => V(X3 - 2.5, yW - 0.8, 0));
  const loop3 = new THREE.Group(); g3.add(loop3);
  path(loop3, [V(-b3 / 2, 0, 0), V(b3 / 2, 0, 0), V(b3 / 2, -a3, 0), V(-b3 / 2, -a3, 0), V(-b3 / 2, 0, 0)], 0.026, 'ink', 'Moving loop');
  for (const p of [V(-b3 / 2, 0, 0), V(b3 / 2, 0, 0), V(b3 / 2, -a3, 0), V(-b3 / 2, -a3, 0)]) part(loop3, new THREE.SphereGeometry(0.026, 12, 8), { tone: 'hi', pal: 'ink', pos: p.toArray(), name: 'Moving loop' });
  const I3 = rectArrows(g3), v3 = arrow(g3, 'ink', { r: 0.014, head: 0.09, headR: 0.042, name: 'Velocity' });
  label('vec', '<i>I</i>', () => tipOf(I3.sides[3].A, 0.14));
  label('vec', '<i>v</i>', () => tipOf(v3, 0.12));
  const bind3 = new THREE.Group(); g3.add(bind3);
  { const seg = []; const r = 0.13; for (let i = 0; i < 24; i += 2) { const a = 2 * Math.PI * i / 24, b = 2 * Math.PI * (i + 1) / 24; seg.push(r * Math.cos(a), r * Math.sin(a), 0, r * Math.cos(b), r * Math.sin(b), 0); }
    const k = r * 0.6; seg.push(-k, -k, 0, k, k, 0, -k, k, 0, k, -k, 0); lines(bind3, seg, '#55555b'); }
  label('vec', grey('<i>B</i><sub>ind</sub>'), () => bind3.visible ? bind3.position.clone().add(V(0.38, 0, 0)) : null);
  // breakdown: strips b·dr across the loop, shaded by the field in each
  const strips3 = Array.from({ length: 8 }, () => { const m = part(g3, new THREE.PlaneGeometry(1, 1), { tone: 'lo', name: 'Strips b·dr', mat: flatMat('dark', 0.3) }); m.userData.noEdge = true; return m; });
  label('tick', '<i>dA</i> = <i>b dr</i>', when(g3, () => loop3.position.clone().add(V(-b3 / 2 - 0.1, -a3 / 16, 0.05))));
  label('tick', '<i>r</i>', () => loop3.position.clone().add(V(b3 / 2 + 0.35, 0.5 * (yW - loop3.position.y), 0)));
  g3.userData.focus = () => ({ target: [X3, loop3.position.y - a3 / 2 + 0.3, 0], radius: 1.5 });
  const dim3 = lines(g3, new Array(18).fill(0), '#6e6e74');

  // ======================================================================================
  // 4 · a metal bar moving through a field: the charges separate
  const X4 = STATIONS.bar, D4 = DRAW.bar, yB = 1.75, L4 = M.BAR.L * D4;
  const g4 = asm('bar', root, { title: 'A moving metal bar', sub: 'qv×B pushes charge until qE balances it' });
  { const mk = []; for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) mk.push({ p: V(X4 - 1.75 + i * 0.5, 0.5 + j * 0.5, -0.1), r: 0.08 }); bMarkers(g4, mk); }
  label('vec', grey('<i>B</i>'), () => V(X4 - 2.2, 3.05, 0));
  const bar4 = new THREE.Group(); g4.add(bar4);
  part(bar4, box(0.13, L4, 0.13, 0.02), { tone: 'hi', name: 'Metal bar' });
  const plus4 = marks(bar4, RED, 8), minus4 = marks(bar4, BLUE, 8);
  const E4 = onTop(arrow(bar4, 'blue', { r: 0.02, head: 0.1, headR: 0.05, name: 'Electric field in the bar' }));
  const v4 = arrow(g4, 'ink', { r: 0.016, head: 0.1, headR: 0.048, name: 'Velocity' });
  label('vec blue', '<i>E</i>', () => tipOf(E4, 0.1)?.add(V(0.22, 0.12, 0)));
  label('vec', '<i>v</i>', () => tipOf(v4, 0.12));
  label('tick', '<i>L</i>', () => bar4.localToWorld(V(-0.18, -L4 / 4, 0)));
  g4.userData.focus = () => ({ target: [bar4.position.x + 0.4, yB, 0], radius: 1.5 });
  // breakdown: one + charge in the bar with its two forces
  const q4 = part(bar4, new THREE.SphereGeometry(0.06, 16, 12), { tone: 'hi', pal: 'red', pos: [0, 0.35, 0.07], name: 'A charge in the bar' });
  const fm4 = onTop(arrow(bar4, 'ink', { r: 0.016, head: 0.09, headR: 0.045, name: 'Magnetic force qv×B' })), fe4 = onTop(arrow(bar4, 'ink', { r: 0.016, head: 0.09, headR: 0.045, name: 'Electric force qE' }));
  label('tick', '<i>q</i><i>v</i>×<i>B</i>', when(g4, () => tipOf(fm4, 0.05)?.add(V(-0.12, 0, 0))));
  label('tick', '<i>q</i><i>E</i>', when(g4, () => tipOf(fe4, 0.05)?.add(V(-0.12, -0.05, 0))));

  // ======================================================================================
  // 5 · a loop crossing a field region
  const X5 = STATIONS.crossing, D5 = DRAW.crossing, xR0 = X5 - M.CROSS.W * D5 / 2, w5 = M.CROSS.w * D5, h5 = M.CROSS.h * D5, y5 = 1.75;
  const g5 = asm('crossing', root, { title: 'A loop crossing a field', sub: 'each side in the field carries BLv' });
  { const mk = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) mk.push({ p: V(xR0 + 0.2 + i * 0.5, y5 - 0.75 + j * 0.5, -0.06), r: 0.08 }); bMarkers(g5, mk);
    const x1 = xR0 + M.CROSS.W * D5, yb = y5 - 0.95, yt = y5 + 0.95; lines(g5, [xR0, yb, -0.06, x1, yb, -0.06, x1, yb, -0.06, x1, yt, -0.06, x1, yt, -0.06, xR0, yt, -0.06, xR0, yt, -0.06, xR0, yb, -0.06], '#a6a6ac'); }
  label('vec', grey('<i>B</i>'), () => V(xR0 + 0.05, y5 + 1.18, 0));
  const loop5 = new THREE.Group(); g5.add(loop5);
  path(loop5, [V(-w5, h5 / 2, 0), V(0, h5 / 2, 0), V(0, -h5 / 2, 0), V(-w5, -h5 / 2, 0), V(-w5, h5 / 2, 0)], 0.026, 'ink', 'Moving loop');
  for (const p of [V(-w5, h5 / 2, 0), V(0, h5 / 2, 0), V(0, -h5 / 2, 0), V(-w5, -h5 / 2, 0)]) part(loop5, new THREE.SphereGeometry(0.026, 12, 8), { tone: 'hi', pal: 'ink', pos: p.toArray(), name: 'Moving loop' });
  const I5 = rectArrows(g5), v5 = arrow(g5, 'ink', { r: 0.014, head: 0.09, headR: 0.042, name: 'Velocity' });
  label('vec', '<i>I</i>', () => tipOf(I5.sides[0].A, 0.14));
  label('vec', '<i>v</i>', () => tipOf(v5, 0.12));
  // breakdown: the push along each side that is in the field, with its charges
  const side5 = [0, 1].map(() => ({ A: onTop(arrow(g5, 'ink', { r: 0.014, head: 0.09, headR: 0.042, name: 'Push on charges: v×B' })), p: marks(g5, RED, 2), m: marks(g5, BLUE, 2) }));
  g5.userData.focus = () => ({ target: [X5, y5, 0], radius: 2.4 });
  side5.forEach(s => label('tick', '<i>BLv</i>', when(g5, () => tipOf(s.A, 0.02)?.add(V(-0.1, 0, 0)))));

  // ======================================================================================
  // 6 · a bar sliding on rails, closed by a resistor
  const X6 = STATIONS.rails, D6 = DRAW.rails, xL6 = X6 - 2.2, yb6 = 1.15, yt6 = yb6 + M.RAIL.L * D6, xEnd6 = xL6 + M.RAIL.len * D6;
  const g6 = asm('rails', root, { title: 'A bar on rails', sub: 'the current through the bar brakes it' });
  { const mk = []; for (let i = 0; i < 9; i++) for (const y of [0.75, 1.55, 2.0, 2.75]) mk.push({ p: V(X6 - 1.95 + i * 0.5, y + (y === 1.55 || y === 2.0 ? 0.0 : 0), -0.08), r: 0.08 }); bMarkers(g6, mk); }
  label('vec', grey('<i>B</i>'), () => V(X6 - 2.6, 2.95, 0));
  rod(g6, V(xL6, yb6, 0), V(xEnd6, yb6, 0), 0.03, 'dark', 'Rails'); rod(g6, V(xL6, yt6, 0), V(xEnd6, yt6, 0), 0.03, 'dark', 'Rails');
  // the resistor: a zigzag across the left end
  { const zp = [V(xL6, yb6, 0), V(xL6, yb6 + 0.25, 0)]; const n = 8, z0 = yb6 + 0.25, z1 = yt6 - 0.25;
    for (let i = 0; i < n; i++) zp.push(V(xL6 + (i % 2 ? -0.11 : 0.11), z0 + (z1 - z0) * (i + 0.5) / n, 0)); zp.push(V(xL6, z1, 0), V(xL6, yt6, 0));
    path(g6, zp, 0.022, 'ink', 'Resistor (0.2 Ω)'); }
  label('tick', '<i>R</i>', () => V(xL6 - 0.2, (yb6 + yt6) / 2, 0));
  const bar6 = new THREE.Group(); g6.add(bar6);
  part(bar6, box(0.11, yt6 - yb6 + 0.34, 0.11, 0.02), { tone: 'hi', name: 'Sliding bar (0.2 kg)' });
  const v6 = arrow(g6, 'ink', { r: 0.016, head: 0.1, headR: 0.048, name: 'Velocity' });
  const F6 = onTop(arrow(g6, 'red', { r: 0.022, head: 0.12, headR: 0.06, name: 'Magnetic force on the bar' }));
  label('vec', '<i>v</i>', () => tipOf(v6, 0.12));
  label('vec red', '<i>F</i><sub>B</sub>', () => tipOf(F6, 0.16));
  const I6 = [0, 1, 2, 3].map(() => iArrow(g6));
  label('vec', '<i>I</i>', () => tipOf(I6[0], 0.14));
  label('tick', '<i>L</i>', () => bar6.position.clone().add(V(0.2, 0.25, 0)));
  const area6 = part(g6, new THREE.PlaneGeometry(1, 1), { tone: 'lo', name: 'Area Lx', mat: flatMat('dark', 0.22) }); area6.userData.noEdge = true;
  label('tick', 'Φ = <i>BLx</i>', when(g6, () => V(xL6 + 0.75, (yb6 + yt6) / 2 + 0.05, 0.05)));

  // ======================================================================================
  // 7 · a solenoid: inductance and back emf
  const X7 = STATIONS.solenoid, D7 = DRAW.solenoid, y7 = 1.75, R7 = M.SOL.r * D7, L7 = M.SOL.len * D7;
  const g7 = asm('solenoid', root, { title: 'Flux through each turn', sub: 'NΦ = LI' });
  helix(g7, V(X7 - L7 / 2, y7, 0), V(X7 + L7 / 2, y7, 0), R7, 25, 0.018, 'Solenoid (400 turns)');
  const hi7 = y7 + R7 + 0.45;
  path(g7, [V(X7 - L7 / 2, y7 + R7, 0), V(X7 - L7 / 2, hi7, 0), V(X7 - L7 / 2 - 0.8, hi7, 0)], 0.022, 'ink', 'Leads');
  path(g7, [V(X7 + L7 / 2, y7 + R7, 0), V(X7 + L7 / 2, hi7, 0), V(X7 + L7 / 2 + 0.8, hi7, 0)], 0.022, 'ink', 'Leads');
  const I7 = iArrow(g7, 'Current I(t)');
  label('vec', '<i>I</i>(<i>t</i>)', () => tipOf(I7, 0.14)?.add(V(0, 0.08, 0)));
  const B7 = [];  // inside the coil, drawn over the turns
  for (const x of [-0.85, 0, 0.85]) for (const y of [0, 0.17, -0.17]) B7.push({ x, y, a: bArrow(g7, 0.016) });
  label('vec', grey('<i>B</i>'), () => tipOf(B7[3].a, 0.12));
  label('vec red', '', () => V(X7 - L7 / 2 + 0.2, hi7 + 0.05, 0), () => (S.sol && S.sol.dI !== 0 ? (S.sol.dI > 0 ? '+' : '−') : ''));
  label('vec blue', '', () => V(X7 + L7 / 2 - 0.2, hi7 + 0.05, 0), () => (S.sol && S.sol.dI !== 0 ? (S.sol.dI > 0 ? '−' : '+') : ''));
  label('tick', '', () => V(X7 + 0.6, hi7 + 0.05, 0), () => S.sol ? `ε<sub>L</sub> = ${fmt(S.sol.emfL * 1e3, 2)} mV` : '');
  // breakdown: the cross-section of one turn with B·dA patches
  const disc7 = part(g7, (() => { const d = new THREE.CircleGeometry(R7 - 0.03, 40); d.rotateY(Math.PI / 2); return d; })(), { tone: 'lo', name: 'One turn’s area', mat: flatMat('board', 0.7), pos: [X7 + 0.42, y7, 0] });
  disc7.userData.noEdge = true;
  const dA7 = [[0, 0], ...[0, 1, 2, 3, 4, 5].map(i => [0.2 * Math.cos(i * Math.PI / 3), 0.2 * Math.sin(i * Math.PI / 3)])].map(([y, z]) => ({ y, z, a: bArrow(g7, 0.013, 'B·dA through one turn') }));
  g7.userData.focus = () => ({ target: [X7, y7 + 0.2, 0], radius: 1.7 });
  label('tick', 'Φ = <i>BA</i> per turn', when(g7, () => V(X7 + 0.95, y7 - R7 - 0.35, 0)));

  // ======================================================================================
  // 8 · an RL circuit: growth and decay
  const X8 = STATIONS.rl, yb8 = 0.5, yt8 = 2.7, xR8 = X8 + 1.5, xB8 = X8 - 1.9, xS8 = X8 - 1.45, P8 = V(X8 - 0.85, yt8, 0), cA = V(xS8, yt8 + 0.38, 0), cB = V(xS8, yt8 - 0.38, 0);
  const g8 = asm('rl', root, { title: 'Around the RL loop', sub: 'ε − IR − L dI/dt = 0' });
  // bottom, right (with the inductor), top (with the resistor)
  path(g8, [V(xB8, yb8, 0), V(xR8, yb8, 0), V(xR8, 1.05, 0), V(xR8 + 0.19, 1.05, 0)]);
  helix(g8, V(xR8, 1.05, 0), V(xR8, 2.15, 0), 0.19, 9, 0.024, 'Inductor (2 H)');
  path(g8, [V(xR8 + 0.19, 2.15, 0), V(xR8, 2.15, 0), V(xR8, yt8, 0), V(X8 + 0.75, yt8, 0)]);
  { const zp = [V(X8 + 0.75, yt8, 0)]; const n = 8, x0 = X8 + 0.75, x1 = X8 - 0.15; for (let i = 0; i < n; i++) zp.push(V(x0 + (x1 - x0) * (i + 0.5) / n, yt8 + (i % 2 ? -0.12 : 0.12), 0)); zp.push(V(x1, yt8, 0)); path(g8, zp, 0.022, 'ink', 'Resistor (4 Ω)'); }
  path(g8, [V(X8 - 0.15, yt8, 0), P8]);
  // the switch: battery branch to contact A, plain wire to contact B
  path(g8, [cA, V(xB8, cA.y, 0), V(xB8, 1.95, 0)]); path(g8, [V(xB8, 1.05, 0), V(xB8, yb8, 0)]);
  part(g8, new THREE.CylinderGeometry(0.16, 0.16, 0.8, 32), { tone: 'hi', pos: [xB8, 1.5, 0], name: 'Battery (12 V)' });
  part(g8, new THREE.CylinderGeometry(0.065, 0.065, 0.07, 20), { tone: 'mid', pal: 'dark', pos: [xB8, 1.94, 0], name: 'Battery (12 V)' });
  part(g8, new THREE.CylinderGeometry(0.163, 0.163, 0.1, 32), { tone: 'mid', pal: 'dark', pos: [xB8, 1.16, 0], name: 'Battery (12 V)' });
  path(g8, [cB, V(xS8, yb8, 0)]);
  for (const p of [cA, cB, P8]) part(g8, new THREE.SphereGeometry(0.05, 14, 10), { tone: 'hi', pal: 'ink', pos: p.toArray(), name: 'Switch' });
  const lever8 = part(g8, rodGeo, { tone: 'hi', pal: 'ink', name: 'Switch' });
  const I8 = [0, 1, 2, 3].map(() => iArrow(g8, 'Current'));
  label('vec', '<i>I</i>', () => tipOf(I8[0], 0.14));
  label('vec red', '+', () => V(xB8 - 0.3, 1.9, 0));
  label('board', 'ε = 12 V', () => V(xB8 - 0.95, 1.5, 0));
  label('board', '<i>R</i> = 4 Ω', () => V(X8 + 0.0, yt8 + 0.4, 0));
  label('board', '<i>L</i> = 2 H', () => V(xR8 + 0.32, 1.6, 0));
  label('board', '', () => V(X8 - 1.2, yt8 + 0.75, 0), () => S.rl ? (S.rl.growing ? 'switch to the battery: growth' : 'battery out of the loop: decay') : '');
  // breakdown: each ΔV around the loop, live
  label('tick', '', when(g8, () => V(xB8 - 0.25, 1.2, 0)), () => S.rl ? `+${fmt(S.rl.emfBat, 1)} V` : '');
  label('tick', '', when(g8, () => V(X8 + 0.65, yt8 - 0.35, 0)), () => S.rl ? `−<i>IR</i> = −${fmt(S.rl.VR, 1)} V` : '');
  label('board', '', when(g8, () => V(xR8 + 0.32, 1.25, 0)), () => S.rl ? `−<i>L dI</i>/<i>dt</i> = ${fmt(-S.rl.VL, 1)} V` : '');
  label('board', '', when(g8, () => V(X8 - 1.2, yb8 - 0.3, 0)), () => S.rl ? `sum: ${fmt(S.rl.emfBat, 1)} − ${fmt(S.rl.VR, 1)} − (${fmt(S.rl.VL, 1)}) = 0` : '');

  // ======================================================================================
  // 9 · an LC circuit: the charge sloshes between the plates through the coil
  const X9 = STATIONS.lc, yb9 = 0.5, yt9 = 2.7, xC9 = X9 - 1.15, xR9 = X9 + 1.15, yc9 = 1.6, gap9 = 0.56, pw9 = 1.1, pd9 = 0.9, pt9 = 0.06, R9 = 0.3, c0y9 = 0.9, c1y9 = 2.3;
  const yTop9 = yc9 + gap9 / 2, yBot9 = yc9 - gap9 / 2;       // inner faces of the plates
  const wires9 = new THREE.Group(); root.add(wires9);
  path(wires9, [V(xC9, yTop9 + pt9, 0), V(xC9, yt9, 0), V(xR9, yt9, 0), V(xR9, c1y9, 0), V(xR9 + R9, c1y9, 0)]);
  path(wires9, [V(xC9, yBot9 - pt9, 0), V(xC9, yb9, 0), V(xR9, yb9, 0), V(xR9, c0y9, 0), V(xR9 + R9, c0y9, 0)]);
  const I9 = [0, 1, 2].map(() => iArrow(wires9, 'Current'));
  label('vec', '<i>I</i>', () => tipOf(I9[0], 0.14));
  // the capacitor: two plates, the top one holding q
  const g9 = asm('lcCap', root, { title: 'The capacitor', sub: 'U_E = q²/2C, in the field between the plates' });
  part(g9, box(pw9, pt9, pd9, 0.01), { tone: 'hi', pos: [xC9, yTop9 + pt9 / 2, 0], name: 'Plates (25 µF)' });
  part(g9, box(pw9, pt9, pd9, 0.01), { tone: 'hi', pos: [xC9, yBot9 - pt9 / 2, 0], name: 'Plates (25 µF)' });
  const plus9 = marks(g9, RED, 8), minus9 = marks(g9, BLUE, 8);
  const E9 = [-0.39, -0.13, 0.13, 0.39].map(x => ({ x, a: onTop(arrow(g9, 'blue', { r: 0.018, head: 0.1, headR: 0.05, name: 'Electric field E' })) }));
  label('vec blue', '<i>E</i>', () => tipOf(E9[3].a, 0) ? E9[3].a.localToWorld(V(0, E9[3].a.userData.arrow.shaft.scale.y / 2, 0)).add(V(0.22, 0, 0)) : null);
  label('board', '<i>C</i> = 25 µF', () => V(xC9 + 1.05, yTop9 + 0.35, 0));
  label('tick', '', () => V(xC9 + 1.05, yBot9 - 0.3, 0), () => S.lc ? `<i>q</i> = ${fmt(S.lc.q * 1e6, 0)} µC` : '');
  const slab9 = part(g9, box(pw9 - 0.04, gap9 - 0.02, pd9 - 0.04, 0.005), { tone: 'lo', name: 'Energy in the field', mat: flatMat('blue', 0.3), pos: [xC9, yc9, 0] });
  slab9.userData.noEdge = true;
  g9.userData.focus = () => ({ target: [xC9, yc9, 0], radius: 1.7 });
  label('tick', '', when(g9, () => V(xC9 - 1.2, yc9 + 0.2, 0)), () => S.lc ? `Δ<i>V</i> = <i>q</i>/<i>C</i> = ${fmt(S.lc.V, 2)} V` : '');
  label('tick', '', when(g9, () => V(xC9 - 1.2, yc9 - 0.12, 0)), () => S.lc ? `<i>U<sub>E</sub></i> = ${fmt(S.lc.UE * 1e3, 3)} mJ` : '');
  // the coil: 1600 turns, 12 drawn
  const gC9 = asm('lcCoil', root, { title: 'The coil', sub: 'U_B = ½LI², in the field inside the coil' });
  helix(gC9, V(xR9, c0y9, 0), V(xR9, c1y9, 0), R9, 9, 0.022, 'Inductor (40 mH)');
  const B9 = [-0.1, 0.1].map(x => ({ x, a: bArrow(gC9, 0.016) }));
  label('vec', grey('<i>B</i>'), () => B9[1].a.visible ? V(xR9 - R9 - 0.2, yc9, 0) : null);
  label('board', '<i>L</i> = 40 mH', () => V(xR9 + 0.8, yc9 + 0.12, 0));
  label('tick', '', () => V(xR9 + 0.8, yc9 - 0.2, 0), () => S.lc ? `<i>I</i> = ${fmt(S.lc.I * 1e3, 0)} mA` : '');
  const core9 = part(gC9, new THREE.CylinderGeometry(R9 - 0.04, R9 - 0.04, c1y9 - c0y9 - 0.06, 32), { tone: 'lo', name: 'Energy in the field', mat: flatMat('dark', 0.3), pos: [xR9, yc9, 0] });
  core9.userData.noEdge = true;
  gC9.userData.focus = () => ({ target: [xR9, yc9, 0], radius: 1.7 });
  label('tick', '', when(gC9, () => V(xR9 - 1.05, yc9 + 0.2, 0)), () => S.lc ? `<i>L dI</i>/<i>dt</i> = ${fmt(S.lc.dI * M.LC.L, 2)} V` : '');
  label('tick', '', when(gC9, () => V(xR9 - 1.05, yc9 - 0.12, 0)), () => S.lc ? `<i>U<sub>B</sub></i> = ${fmt(S.lc.UB * 1e3, 3)} mJ` : '');
  label('board', `slowed ${Math.round(M.LC.slow / 10) * 10}×: one ${f3(M.LC.T * 1e3)} ms swing takes ${M.LC.show} s`, () => V(X9, yt9 + 0.5, 0));

  // ---------- per-frame ----------
  const S = {};
  const fmt = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
  function update(s) {
    // 0 · the magnet comes and goes
    { const r = M.fluxScene(s.flux.t), n = V(-1, 0, 0);
      mag0.position.set(X0 + r.xN * D0, CY0, 0);
      I0arr.set(c0, A0, n, r.I, K.fluxI);
      bind0.set(c0.clone().add(V(Math.sign(r.emf) * 0.35, -0.24, 0)), n.clone().multiplyScalar(Math.sign(r.emf) * 0.7), Math.abs(r.I) * K.fluxI > 0.03 ? 1 : 0);
      const ex = opened(g0); disc0.visible = ex > 0.05;
      for (const { y, z, a } of dA0) { const p = V(0, y / D0, z / D0), b = M.magnetB(p, r.xN, r.xS); setArrow(a, c0.clone().add(V(0, y, z)), V(b[0] * K.fluxB, 0, 0), ex); } }

    // 1 · Lenz: four magnets
    for (const L of LZ) {
      const r = M.lenzCase(L.c, s.lenz.t), n = V(-1, 0, 0), on = Math.abs(r.emf) > 1e-8;
      L.mg.position.set(L.o.x + (L.c.pole === 'N' ? r.xN : r.xS) * D1, L.o.y, 0);
      setArrow(L.B, L.o.clone().add(V(-r.Bx * K.lenzB / 2, 0.14, 0)), V(r.Bx * K.lenzB, 0, 0));
      L.ind.set(L.o.clone().add(V(Math.sign(r.emf) * 0.35, -0.14, 0)), n.clone().multiplyScalar(Math.sign(r.emf) * 0.7), on ? 1 : 0);
      L.cur.set(L.o, A1, n, on ? Math.sign(r.I) : 0, 0.45);   // direction only: the current is µA–mA
      setArrow(L.v, L.mg.position.clone().add(V(0.4, 0.3, 0)), V(r.v * K.lenzV, 0, 0), r.v ? 1 : 0);
      L.rl.visible = opened(L.g) > 0.05 && on;
      for (const d of L.dl) d.setSign(-r.emf);   // traced for a current about +x; ε > 0 here circulates about −x
    }

    // 2a · coils
    { const r = M.coilsScene(s.coil.t), n = V(1, 0, 0);
      lineMatC.uniforms.uOpacity.value = 0.85 * r.I1 / M.COILS.I0;
      I1C.set(c21, A2 + 0.03, n, r.I1, K.coilI1);
      I2C.set(c22, A2 + 0.03, n, r.I2, K.coilI2);
      setArrow(B1C, c22.clone().add(V(0, 0.15, 0)), V(r.B1 * K.coilB, 0, 0));
      indC.set(c22.clone().add(V(Math.sign(r.emf) * -0.35, -0.15, 0)), n.clone().multiplyScalar(Math.sign(r.emf) * 0.7), Math.abs(r.I2) * K.coilI2 > 0.03 ? 1 : 0);
      discC.visible = opened(gC) > 0.05; }
    // 2b · iron core: B along −x for positive I₁
    { const r = M.coreScene(s.coil.t), n = V(-1, 0, 0);
      setArrow(BK, V(X2 + 1.35, yC + 0.0, 0), V(-r.B * K.coreB, 0, 0));
      const sg = Math.sign(r.emf2), on = Math.abs(r.I2) * K.coreI2 > 0.03;
      indK.set(V(X2 - 0.95 - sg * -0.35, yC, 0), n.clone().multiplyScalar(sg * 0.7), on ? 1 : 0);
      const up = n.clone().cross(Z_).normalize();         // the current's direction on the front of a winding
      setArrow(I1K, V(X2 + 0.8, yC, RC + 0.12).addScaledVector(up, -r.I1 * K.coreI1 / 2), up.clone().multiplyScalar(r.I1 * K.coreI1), r.I1 * K.coreI1 > 0.03 ? 1 : 0);
      const sp = sec.position.y;
      setArrow(I2K, V(X2 - 0.95, yC + sp, RC + 0.12).addScaledVector(up, -r.I2 * K.coreI2 / 2), up.clone().multiplyScalar(r.I2 * K.coreI2), on ? 1 : 0); }

    // 3 · loop leaving the wire; area vector into the page
    { const r = M.wireScene(s.wire.t), n = V(0, 0, -1), top = yW - r.r * D3;
      loop3.position.set(X3, top, 0);
      const c = V(X3, top - a3 / 2, 0);
      I3.set(c, b3, a3, n, r.I, K.wireI);
      setArrow(v3, V(X3 - b3 / 2 - 0.35, top - a3 / 2 + 0.2, 0), V(0, s.wire.resting ? 0 : -M.WIRE.v * K.wireV, 0));
      bind3.position.copy(c); bind3.visible = Math.abs(r.I) * K.wireI > 0.03;
      const ex = opened(g3);
      strips3.forEach((m, i) => { const rr = r.r + (i + 0.5) * M.WIRE.a / 8; m.visible = ex > 0.05; m.scale.set(b3 - 0.06, a3 / 8 - 0.02, 1); m.position.set(X3, top - (i + 0.5) * a3 / 8, 0.01); m.material.uniforms.uOpacity.value = 0.6 * M.wireB(rr) / M.wireB(M.WIRE.r0); });
      const x = X3 + b3 / 2 + 0.2, a = yW, b = top;
      dim3.geometry.attributes.position.array.set([x, a, 0, x, b, 0, x - 0.06, a, 0, x + 0.06, a, 0, x - 0.06, b, 0, x + 0.06, b, 0]); dim3.geometry.attributes.position.needsUpdate = true; }

    // 4 · bar through the field
    { const r = M.barScene(s.bar.t, s.bar.resting), x = X4 - M.BAR.span * D4 / 2 + r.x * D4;
      bar4.position.set(x, yB, 0);
      const n = Math.round(6 * r.emf / M.BAR.emf);
      plus4(Array.from({ length: n }, (_, i) => ({ p: V((i % 2 ? 0.03 : -0.03), L4 / 2 - 0.1 - i * 0.075, 0.068) })));
      minus4(Array.from({ length: n }, (_, i) => ({ p: V((i % 2 ? 0.03 : -0.03), -L4 / 2 + 0.1 + i * 0.075, 0.068) })));
      setArrow(E4, V(0, r.E * K.barE / 2 - 0.15, 0.12), V(0, -r.E * K.barE, 0));
      setArrow(v4, V(x + 0.12, yB - 0.2, 0), V(r.v * K.barV, 0, 0));
      const ex = opened(g4); q4.visible = ex > 0.05;
      setArrow(fm4, V(0, 0.42, 0.13), V(0, 0.5 * Math.min(1, r.v / M.BAR.v), 0), ex);
      setArrow(fe4, V(0, 0.28, 0.13), V(0, -0.5 * Math.min(1, r.E / M.BAR.E), 0), ex); }

    // 5 · loop through a field region
    { const r = M.crossScene(s.cross.t), xl = xR0 + r.lead * D5, n = V(0, 0, -1);
      loop5.position.set(xl, y5, 0);
      I5.set(V(xl - w5 / 2, y5, 0), w5, h5, n, r.I, K.crossI);
      setArrow(v5, V(xl - w5 / 2 - 0.35, y5 + h5 / 2 + 0.5, 0), V(s.cross.resting ? 0 : M.CROSS.v * K.crossV, 0, 0));
      const ex = opened(g5);
      [[r.inLead, xl], [r.inTrail, xl - w5]].forEach(([inside, x], i) => {
        const S5 = side5[i], on = inside && !s.cross.resting ? ex : 0;
        setArrow(S5.A, V(x + 0.12, y5 - 0.3, 0.05), V(0, 0.6, 0), on);
        S5.p(on > 0.05 ? [{ p: V(x, y5 + h5 / 2 - 0.12, 0.04) }] : []); S5.m(on > 0.05 ? [{ p: V(x, y5 - h5 / 2 + 0.12, 0.04) }] : []);
      }); }

    // 6 · bar on rails
    { const r = M.railScene(s.rail.t), x = xL6 + r.x * D6, ym = (yb6 + yt6) / 2, n = V(0, 0, 1);
      bar6.position.set(x, ym, 0);
      setArrow(v6, V(x + 0.1, ym - 0.3, 0), V(r.v * K.railV, 0, 0));
      setArrow(F6, V(x - 0.1, ym + 0.05, 0.05), V(-r.F * K.railF, 0, 0));
      // counterclockwise seen from the front: up the bar, left along the top, down the resistor, right along the bottom
      const li = r.I * K.railI, on = li > 0.03 ? 1 : 0, xm = (xL6 + x) / 2;
      setArrow(I6[0], V(x + 0.17, ym + 0.15 - li / 2, 0), V(0, li, 0), on);
      setArrow(I6[1], V(xm + li / 2, yt6 + 0.13, 0), V(-li, 0, 0), on);
      setArrow(I6[2], V(xL6 - 0.3, ym + li / 2, 0), V(0, -li, 0), on);
      setArrow(I6[3], V(xm - li / 2, yb6 - 0.13, 0), V(li, 0, 0), on);
      area6.visible = opened(g6) > 0.05; area6.scale.set(x - xL6, yt6 - yb6, 1); area6.position.set((x + xL6) / 2, ym, 0.01); }

    // 7 · solenoid
    { const r = M.solScene(s.sol.t); S.sol = r;
      for (const { x, y, a } of B7) setArrow(a, V(X7 + x - r.B * K.solB / 2, y7 + y, 0), V(r.B * K.solB, 0, 0));
      setArrow(I7, V(X7 - L7 / 2 - 0.75, hi7 + 0.15, 0), V(r.I * K.solI, 0, 0), r.I * K.solI > 0.03 ? 1 : 0);
      const ex = opened(g7); disc7.visible = ex > 0.05;
      for (const { y, z, a } of dA7) setArrow(a, V(X7 + 0.42, y7 + y, z), V(r.B * K.solB, 0, 0), ex); }

    // 8 · RL circuit
    { const r = M.rlScene(s.rl.t); S.rl = r;
      const to = r.growing ? cA : cB; lever8.position.copy(P8).add(to).multiplyScalar(0.5); lever8.scale.set(0.024, P8.distanceTo(to), 0.024); lever8.quaternion.setFromUnitVectors(Y_, to.clone().sub(P8).normalize());
      const li = r.I * K.rlI, on = li > 0.03 ? 1 : 0;
      setArrow(I8[0], V(X8 - 0.6 + 0 - li / 2 + 0.25, yt8 + 0.15, 0), V(li, 0, 0), on);
      setArrow(I8[1], V(xR8 + 0.15, 0.85 + li / 2, 0), V(0, -li, 0), on);
      setArrow(I8[2], V(X8 + li / 2, yb8 - 0.14, 0), V(-li, 0, 0), on);
      setArrow(I8[3], V((r.growing ? xB8 : xS8) + 0.15, (r.growing ? 2.25 : 1.4) - li / 2, 0), V(0, li, 0), on); }
    // 9 · LC circuit; q on the top plate, I = dq/dt arriving at it (counterclockwise seen from the front)
    { const r = M.lcScene(s.lc.t); S.lc = r;
      const n = Math.round(8 * Math.abs(r.q) / M.LC.Q), row = (y, k) => Array.from({ length: k }, (_, i) => ({ p: V(xC9 - pw9 / 2 + pw9 * (i + 0.5) / 8, y, pd9 / 2 + 0.01), s: 0.08 }));
      const top = row(yTop9 - 0.07, n), bot = row(yBot9 + 0.07, n);
      plus9(r.q >= 0 ? top : bot); minus9(r.q >= 0 ? bot : top);
      const e = -r.E * K.lcE;                          // q > 0: E points down, from the top plate
      for (const { x, a } of E9) setArrow(a, V(xC9 + x, yc9 - e / 2, pd9 / 2 - 0.12), V(0, e, 0), Math.abs(e) > 0.1 ? 1 : 0);
      const b = r.B * K.lcB;                           // I > 0 runs up through the coil: B up
      for (const { x, a } of B9) setArrow(a, V(xR9 + x, yc9 - b / 2, 0), V(0, b, 0), Math.abs(b) > 0.1 ? 1 : 0);
      const li = r.I * K.lcI, on = Math.abs(li) > 0.03 ? 1 : 0;
      setArrow(I9[0], V(X9 + li / 2, yt9 + 0.15, 0), V(-li, 0, 0), on);
      setArrow(I9[1], V(X9 - li / 2, yb9 - 0.15, 0), V(li, 0, 0), on);
      setArrow(I9[2], V(xC9 - 0.15, (yt9 + yTop9) / 2 + 0.06 + li * 0.25, 0), V(0, -li * 0.5, 0), on);
      slab9.visible = opened(g9) > 0.05; slab9.material.uniforms.uOpacity.value = 0.05 + 0.45 * r.UE / M.LC.U;
      core9.visible = opened(gC9) > 0.05; core9.material.uniforms.uOpacity.value = 0.05 + 0.45 * r.UB / M.LC.U; }
  }
  return { update, labels };
}
