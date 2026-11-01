// The figure: a row of simple magnetic scenes along x, one per page. Grey lines and arrows are B
// (traced from the model's Biot–Savart sums), black arrows are currents, velocities and forces,
// red is the net force. Wires and coils are drawn 1 grid square = 10 cm; the charged particles'
// scenes 1 grid square = 1 cm.
import * as THREE from 'three';
import { part, box, cyl, lines, arrow, setArrow, shadeMat, V } from '../engine/parts.js';
import * as M from './model.js';

export const STATIONS = { magnet: 0, rhr: 16, cyclo: 32, selector: 50, loop: 68, ampere: 86, ring: 104, same: 121, opposite: 129, solenoid: 142, toroid: 149 };
// arrow scales, drawn units per unit named
export const SC = {
  rhrF: 1.5 / M.RHR.Fmax,         // the largest force is 1.5 squares
  v: 0.5 / 1e5,                   // half a square per 10⁵ m/s
  cycF: 0.6 / 1e-15,              // 0.6 squares per 10⁻¹⁵ N
  selF: 1.0 / (M.QE * M.SEL.E),   // qE is 1 square
  loopF: 4.0,                     // 4 squares per N
  mu: 12,                         // 12 squares per A·m²
  tau: 25,                        // 25 squares per N·m
  uT: 0.008,                      // the long wire's field: 0.8 squares per 100 μT
  ringUT: 0.05,                   // 1 square per 20 μT
  wireF: 2000,                    // 2 squares per mN/m
  pairUT: 0.03,                   // 3 squares per 100 μT
  torUT: 0.01,                    // 1 square per 100 μT
};
const D = 10, DP = 100;           // drawn units per metre: coils and wires, particles

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at, text) => labels.push({ cls, html, at, text });
  const ex = g => Math.max(g.userData.explode, 0);

  // faint graph-paper ground
  const grid = [];
  for (let x = -6; x <= 156; x++) grid.push(x, 0.001, -5, x, 0.001, 5);
  for (let z = -5; z <= 5; z++) grid.push(-6, 0.001, z, 156, 0.001, z);
  lines(root, grid, '#e6e6e2');

  // ---------- kit ----------
  const lineMat = new THREE.LineBasicMaterial({ color: '#86868d' });
  const lineMat2 = new THREE.LineBasicMaterial({ color: '#c4c4c9' });
  const trailMat = new THREE.LineBasicMaterial({ color: '#a2a2a8' });
  const toW = (c, s) => p => V(c.x + p[0] * s, c.y + p[1] * s, c.z + p[2] * s);
  function curve(parent, ptsW, mat = lineMat) {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsW), mat); l.userData = { noEdge: true }; parent.add(l); return l;
  }
  const headGeo = new THREE.ConeGeometry(0.05, 0.16, 14);
  // little arrowheads along a line, at evenly spaced fractions of its length, so B's sense reads
  function heads(parent, ptsW, n = 2, { skip = () => false, scale = 1 } = {}) {
    const acc = [0]; for (let i = 1; i < ptsW.length; i++) acc.push(acc[i - 1] + ptsW[i].distanceTo(ptsW[i - 1]));
    const L = acc[acc.length - 1], out = [];
    for (let k = 0; k < n; k++) {
      const s = L * (k + 0.5) / n; let i = acc.findIndex(a => a >= s); if (i < 1) i = 1;
      const p = ptsW[i - 1].clone().lerp(ptsW[i], (s - acc[i - 1]) / Math.max(acc[i] - acc[i - 1], 1e-9));
      if (skip(p)) continue;
      const m = new THREE.Mesh(headGeo, shadeMat('dark')); m.userData = { noEdge: true };
      m.position.copy(p); m.scale.setScalar(scale);
      m.quaternion.setFromUnitVectors(V(0, 1, 0), ptsW[i].clone().sub(ptsW[i - 1]).normalize());
      parent.add(m); out.push(m);
    }
    return out;
  }
  // a field line from the model (SI points around centre c, s units per metre), with heads
  const fieldCurve = (parent, ptsSI, c, s, n = 2, mat = lineMat, opts) => { const w = ptsSI.map(toW(c, s)); const l = curve(parent, w, mat); heads(parent, w, n, opts); return l; };
  // straight grey field lines from a to b, with heads
  const bLine = (parent, a, b, n = 2) => { curve(parent, [a, b]); heads(parent, [a, b], n); };
  const bArrow = (parent, name = 'Field B') => arrow(parent, 'dark', { r: 0.026, head: 0.15, headR: 0.07, name, tone: 'mid' });
  const thinGrey = (parent, name) => arrow(parent, 'dark', { r: 0.014, head: 0.1, headR: 0.045, name, tone: 'mid' });
  const inkArrow = (parent, name, r = 0.022) => arrow(parent, 'ink', { r, head: 0.13, headR: 0.06, name });
  const redArrow = (parent, name) => arrow(parent, 'red', { r: 0.026, head: 0.15, headR: 0.07, name });
  const tip = (a, d = 0.22) => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + d, 0)) : null;
  const charge = (parent, sign = 1, r = 0.15, name = 'Charge') => {
    const m = part(parent, new THREE.SphereGeometry(r, 32, 20), { tone: 'hi', name });
    label(sign > 0 ? 'vec red' : 'vec blue', sign > 0 ? '+' : '−', () => m.visible ? m.getWorldPosition(V()) : null);
    return m;
  };
  // a round wire between two points
  const rodGeo = cyl(1, 1, 16);
  function rod(parent, a, b, r, opts = {}) {
    const m = part(parent, rodGeo, { tone: 'hi', ...opts });
    placeRod(m, a, b, r); return m;
  }
  function placeRod(m, a, b, r) {
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.scale.set(r, a.distanceTo(b), r);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  }
  const cone = (parent, at, dir, name = 'Current', s = 1) => {
    const m = part(parent, new THREE.ConeGeometry(0.075 * s, 0.22 * s, 16), { tone: 'hi', pal: 'ink', name });
    m.position.copy(at); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); return m;
  };
  const dashMat = new THREE.LineDashedMaterial({ color: '#5a5a62', dashSize: 0.08, gapSize: 0.06 });
  function dashed(parent, ptsW, closed = true) {
    const g = new THREE.BufferGeometry().setFromPoints(ptsW);
    const l = closed ? new THREE.LineLoop(g, dashMat) : new THREE.Line(g, dashMat); l.computeLineDistances(); l.userData = { noEdge: true }; parent.add(l); return l;
  }
  const fadeMat = pal => { const m = shadeMat(pal, { opacity: 0.99 }); m.depthWrite = true; return m; };
  const setFade = (mats, e, lo = 0.75) => mats.forEach(m => { m.uniforms.uOpacity.value = 1 - lo * e; m.depthWrite = e < 0.05; });
  const glassMat = () => { const m = shadeMat('dark', { opacity: 0.12 }); m.side = THREE.DoubleSide; return m; };
  const fromSI = a => V(a[0], a[1], a[2]);
  const inBox = (X, Y, Z = Y) => p => Math.abs(p[0]) < X && Math.abs(p[1]) < Y && Math.abs(p[2]) < Z;
  const rotX = p => [p[0], p[2], p[1]];         // a line in the z = 0 plane turned into the y = 0 plane (about x)
  const BOT = 'Field B';

  // ======================================================================
  // 1 · a bar magnet
  // ======================================================================
  const cM = V(STATIONS.magnet, 2.2, 0);
  const gM = asm('magnet', root, { title: 'A bar magnet', sub: 'every line closes on itself' });
  const magMats = [fadeMat('red'), fadeMat('base')];
  const hl = M.MAG.L / 2 * D, hw = M.MAG.w / 2 * D;
  part(gM, box(hl * 2 / 2, hw * 2, hw * 2, 0.03), { tone: 'hi', name: 'North half', mat: magMats[0], pos: [cM.x + hl / 2, cM.y, 0] });
  part(gM, box(hl * 2 / 2, hw * 2, hw * 2, 0.03), { tone: 'hi', name: 'South half', mat: magMats[1], pos: [cM.x - hl / 2, cM.y, 0] });
  label('vec', 'N', () => V(cM.x + hl * 0.55, cM.y + hw + 0.22, hw));
  label('vec', 'S', () => V(cM.x - hl * 0.55, cM.y + hw + 0.22, hw));
  {
    const seeds = [0.004, 0.009, 0.014, 0.019, 0.023].flatMap(y => [y, -y]);
    const inMag = p => Math.abs(p.x - cM.x) < hl && Math.abs(p.y - cM.y) < hw && Math.abs(p.z) < hw;
    for (const y of seeds) {
      const pts = M.fieldLine(M.magnetB, [0, y, 0], { step: 0.003, max: 900, inside: inBox(0.45, 0.35) });
      fieldCurve(root, pts, cM, D, 3, lineMat, { skip: inMag });
      fieldCurve(root, pts.map(rotX), cM, D, 0, lineMat2);
    }
  }
  const sphM = new THREE.Group(); sphM.position.copy(toW(cM, D)(M.MAG_BOX.c)); gM.add(sphM);
  { const s = 2 * M.MAG_BOX.h * D, g = new THREE.BoxGeometry(s, s, s);
    part(sphM, g, { tone: 'lo', name: 'Closed box', mat: glassMat() }).userData.noEdge = true;
    const rim = new THREE.LineSegments(new THREE.EdgesGeometry(g), dashMat); rim.computeLineDistances(); rim.userData = { noEdge: true }; sphM.add(rim); }
  label('tick', '∮ <b>B</b> · d<b>A</b> = 0', () => ex(gM) > 0.4 ? sphM.position.clone().add(V(0.4, M.MAG_BOX.h * D + 0.35, 0)) : null);

  // ======================================================================
  // 2 · F = qv × B: a proton and an electron in a field along +x
  // ======================================================================
  const cR = V(STATIONS.rhr, 2.0, 0);
  for (const [y, z] of [[0.7, -1.3], [0.7, 1.3], [3.3, -1.3], [3.3, 1.3], [2.0, -1.9], [2.0, 1.9], [3.3, 0], [0.7, 0]])
    bLine(root, V(cR.x - 3.4, y, z), V(cR.x + 3.4, y, z), 1);
  label('vec grey', '<b>B</b>', () => V(cR.x + 3.6, 3.3, 0));
  const gR = asm('rhr', root, { title: 'Charges moving through B', sub: 'F = qv × B' });
  const rq = [{ q: M.QE, at: V(cR.x - 1.5, cR.y, 0) }, { q: -M.QE, at: V(cR.x + 1.5, cR.y, 0) }].map(o => {
    const m = charge(gR, o.q > 0 ? 1 : -1); m.position.copy(o.at);
    return { ...o, v: inkArrow(gR, 'Velocity v'), F: redArrow(gR, 'Force F'), B: bArrow(gR), par: thinGrey(gR, 'Parts of v'), perp: thinGrey(gR, 'Parts of v') };
  });
  rq.forEach(o => {
    label('vec', '<b>v</b>', () => tip(o.v)); label('vec red', '<b>F</b>', () => tip(o.F));
    label('vec grey', '<b>B</b>', () => ex(gR) > 0.3 ? tip(o.B) : null);
    label('vec grey', 'v<sub>∥</sub>', () => ex(gR) > 0.3 ? tip(o.par, 0.12).add(V(0, -0.18, 0)) : null);
    label('vec grey', 'v<sub>⊥</sub>', () => ex(gR) > 0.3 ? tip(o.perp, 0.12).add(V(0, -0.18, 0)) : null);
  });
  let rhrDeg = 0;
  label('tick', '', () => rq[0].at.clone().add(V(-0.25, -0.55, 0.3)), () => `θ ${rhrDeg.toFixed(0)}°`);

  // ======================================================================
  // 3 · protons circling in a uniform B (down)
  // ======================================================================
  const cC = V(STATIONS.cyclo, 1.0, 0), r2 = M.CYC.r[1] * DP, startC = V(cC.x, cC.y, cC.z + r2);
  for (const i of [-2.4, -0.8, 0.8, 2.4]) for (const k of [-2.4, -0.8, 0.8, 2.4]) {
    const x = cC.x + i, z = cC.z + k;
    bLine(root, V(x, 2.1, z), V(x, 0.2, z), 1);
  }
  label('vec grey', '<b>B</b>', () => V(cC.x + 2.4, 2.3, cC.z + 2.4));
  const gC = asm('cyclo', root, { title: 'Protons circling', sub: 'same period at any speed' });
  const cyc = M.CYC.r.map((r, i) => {
    const ring = Array.from({ length: 97 }, (_, k) => { const a = k / 96 * 2 * Math.PI; return V(cC.x + r * DP * Math.sin(a), cC.y, startC.z - r * DP + r * DP * Math.cos(a)); });
    curve(root, ring, trailMat);
    const m = charge(gC, 1, 0.13);
    return { m, v: inkArrow(gC, 'Velocity v'), F: redArrow(gC, 'Force F'), rad: thinGrey(gC, 'Radius r'), centre: V(cC.x, cC.y, startC.z - r * DP) };
  });
  cyc.forEach((o, i) => { label('vec', '<b>v</b>', () => tip(o.v)); label('vec red', '<b>F</b>', () => ex(gC) > 0.3 ? tip(o.F) : null);
    label('vec grey', `r<sub>${i + 1}</sub>`, () => ex(gC) > 0.3 ? o.centre.clone().lerp(o.m.position, 0.5).add(V(0, 0.25, 0)) : null); });
  label('tick', '50 V', () => cyc[0].m.position.clone().add(V(-0.25, 0.42, 0)));
  label('tick', '200 V', () => cyc[1].m.position.clone().add(V(-0.25, 0.42, 0)));

  // ======================================================================
  // 4 · the velocity selector
  // ======================================================================
  const cS = V(STATIONS.selector, 2.6, 0), gapW = M.SEL.gap * DP, LW = M.SEL.L * DP, x0S = cS.x - LW / 2;
  const gS = asm('selector', root, { title: 'Crossed E and B', sub: 'only v = E/B goes straight' });
  part(gS, box(LW, 0.16, 3, 0.03), { tone: 'mid', pal: 'base', name: 'Plates', pos: [cS.x, cS.y + gapW / 2 + 0.08, 0] });
  part(gS, box(LW, 0.16, 3, 0.03), { tone: 'mid', pal: 'base', name: 'Plates', pos: [cS.x, cS.y - gapW / 2 - 0.08, 0] });
  for (let i = 0; i < 6; i++) {
    const x = x0S + 0.9 + i * (LW - 1.8) / 5;
    label('vec red', '+', () => V(x, cS.y + gapW / 2 + 0.38, 1.5));
    label('vec blue', '−', () => V(x, cS.y - gapW / 2 - 0.4, 1.5));
  }
  const eS = [-3.6, -1.2, 1.2, 3.6].map(dx => { const a = arrow(gS, 'blue', { r: 0.024, head: 0.15, headR: 0.065, name: 'Field E', tone: 'mid' }); setArrow(a, V(cS.x + dx, cS.y + gapW / 2 - 0.1, -1.3), V(0, -gapW + 0.2, 0)); return a; });
  label('vec blue', '<b>E</b>', () => V(cS.x + 3.6 + 0.35, cS.y - gapW / 2 + 0.6, -1.3));
  for (const dx of [-4, -2, 0, 2, 4]) for (const dy of [-1.3, 1.3]) {
    bLine(root, V(cS.x + dx, cS.y + dy, 1.2), V(cS.x + dx, cS.y + dy, -1.2), 1);
    label('mark', '⊗', () => V(cS.x + dx, cS.y + dy, 1.2));
  }
  label('vec grey', '<b>B</b> (into the page)', () => V(cS.x + 4.4, cS.y + 1.65, 1.2));
  const PRE = 0.018;                                           // metres of straight run before and after the plates
  const selPaths = M.SEL.paths.map(P => { const last = P[P.length - 1]; return { P, last, v0: P[0].v[0] }; });
  selPaths.forEach(s => {
    const w = [V(x0S - PRE * DP, cS.y, 0), ...s.P.filter((_, j) => j % 6 === 0).map(q => V(x0S + q.p[0] * DP, cS.y + q.p[1] * DP, 0)), V(x0S + s.last.p[0] * DP, cS.y + s.last.p[1] * DP, 0)];
    w.push(w[w.length - 1].clone().add(V(s.last.v[0], s.last.v[1], 0).normalize().multiplyScalar(PRE * DP)));
    curve(root, w, trailMat);
    s.end = w[w.length - 1];
  });
  const selQ = selPaths.map(() => ({ m: charge(gS, 1, 0.13), FE: inkArrow(gS, 'Electric force qE'), FB: inkArrow(gS, 'Magnetic force qv × B'), net: redArrow(gS, 'Net force') }));
  ['0.8 <i>E/B</i>', '<i>E/B</i>', '1.25 <i>E/B</i>'].forEach((t, i) => label('tick', t, () => selPaths[i].end.clone().add(V(1.15, 0, 0))));
  label('vec', 'q<b>E</b>', () => ex(gS) > 0.3 ? tip(selQ[0].FE) : null);
  label('vec', 'q<b>v</b>×<b>B</b>', () => ex(gS) > 0.3 ? tip(selQ[0].FB) : null);
  // real time for each proton to run the whole line, and the page time for the slowest
  const selEnd = selPaths.map(s => PRE / s.v0 + s.last.t + PRE / Math.hypot(s.last.v[0], s.last.v[1]));
  const SEL_LOOP = Math.max(...selEnd) / M.SEL.cross * M.SEL.show + M.SEL.rest;
  function selState(i, t) {
    const s = selPaths[i], t0 = PRE / s.v0;
    if (t < t0) return { p: [-PRE + s.v0 * t, 0, 0], v: [s.v0, 0, 0], inField: false };
    if (t - t0 <= s.last.t) { const q = M.selAt(i, t - t0); return { p: q.p, v: q.v, inField: true }; }
    return { p: M.add(s.last.p, M.mul(s.last.v, t - t0 - s.last.t)), v: s.last.v, inField: false };
  }

  // ======================================================================
  // 5 · a current loop in a uniform field
  // ======================================================================
  const cL = V(STATIONS.loop, 2.4, 0);
  for (const [y, z] of [[0.5, -1.5], [0.5, 0], [0.5, 1.5], [4.3, -1.5], [4.3, 0], [4.3, 1.5], [1.7, -1.7], [3.1, -1.7], [1.7, 1.7], [3.1, 1.7]])
    bLine(root, V(cL.x - 3.6, y, z), V(cL.x + 3.6, y, z), 2);
  label('vec grey', '<b>B</b>', () => V(cL.x + 3.85, 4.3, 0));
  const gL = asm('loop', root, { title: 'A current loop in B', sub: 'no net force, but a torque' });
  const loopG = new THREE.Group(); loopG.position.copy(cL); gL.add(loopG);
  const la = M.LOOP.a / 2 * D, lb = M.LOOP.b / 2 * D;
  const LP = [V(0, -lb, -la), V(0, lb, -la), V(0, lb, la), V(0, -lb, la)];
  LP.forEach((p, i) => {
    const q = LP[(i + 1) % 4];
    rod(loopG, p.clone().add(q.clone().sub(p).normalize().multiplyScalar(-0.05)), q.clone().add(q.clone().sub(p).normalize().multiplyScalar(0.05)), 0.05, { name: 'Wire loop' });
    cone(loopG, p.clone().lerp(q, 0.5), q.clone().sub(p), 'Current I', 1.2);
  });
  label('vec', '<i>I</i>', () => loopG.localToWorld(V(0, 0.2, -la - 0.3)));
  const muL = inkArrow(gL, 'Magnetic moment μ', 0.03), tauL = inkArrow(gL, 'Torque τ', 0.03);
  label('vec', '<b>μ</b>', () => tip(muL)); label('vec', '<b>τ</b>', () => tip(tauL));
  const FL = [0, 1, 2, 3].map(() => inkArrow(gL, 'Forces I L × B'));
  FL.forEach((a, i) => label('vec', `<b>F</b><sub>${i + 1}</sub>`, () => ex(gL) > 0.3 ? tip(a) : null));
  let loopDeg = 0;
  label('tick', '', () => cL.clone().add(V(-0.4, -lb - 0.55, 0)), () => `θ ${loopDeg.toFixed(0)}°`);

  // ======================================================================
  // 6 · a long straight wire: Ampère's law, and the flux through a rectangle beside it
  // ======================================================================
  const cA = V(STATIONS.ampere, 0, 0), yAmp = 1.4, yLines = 6.0;
  const gA = asm('ampere', root, { title: 'A long straight wire', sub: '∮ B · ds = μ₀I' });
  rod(gA, V(cA.x, 0, 0), V(cA.x, 2.6, 0), M.AMP.a * D, { name: 'Wire' });
  rod(root, V(cA.x, 2.6, 0), V(cA.x, 6.8, 0), M.AMP.a * D, { name: 'Wire' });   // the top half is not part of the breakdown, so opening it frames the circle
  // kept out of the breakdown so opening the wire frames the circle
  const curA = inkArrow(root, 'Current I', 0.03); setArrow(curA, V(cA.x - 0.38, 4.9, 0), V(0, 1.3, 0));
  label('vec', '<i>I</i>', () => V(cA.x - 0.62, 5.9, 0));
  for (let k = 0; k < 5; k++) {
    const r = 0.025 * 1.5 ** k;
    fieldCurve(root, M.fieldLine(M.wireB, [r, 0, 0], { step: 0.004, max: 600 }), V(cA.x, yLines, 0), D, 3);
  }
  const ampLoop = dashed(gA, Array.from({ length: 96 }, (_, i) => { const a = i / 96 * 2 * Math.PI; return V(Math.cos(a), 0, Math.sin(a)); }));
  ampLoop.position.set(cA.x, yAmp, 0);
  const NA = 8, bA = Array.from({ length: NA }, () => bArrow(gA)), dsA = Array.from({ length: 16 }, () => inkArrow(gA, 'Path pieces ds', 0.016));
  const rA = thinGrey(gA, 'Radius r');
  label('vec grey', '<b>B</b>', () => tip(bA[1])); label('vec grey', 'r', () => tip(rA, 0.05).add(V(0, 0.2, 0)));
  label('vec', 'd<b>s</b>', () => ex(gA) > 0.3 ? tip(dsA[12]) : null);

  const gF = asm('flux', root, { title: 'A rectangle beside the wire', sub: 'Φ = ∫ B b dr' });
  const fy0 = 2.5, fy1 = fy0 + M.FLUX.b * D, nS = M.FLUX.strips, drW = M.FLUX.c * D / nS;
  const panelMat = shadeMat('paper', { opacity: 0.55 }); panelMat.side = THREE.DoubleSide;
  const strips = Array.from({ length: nS }, (_, i) => {
    const x = cA.x + M.FLUX.a * D + (i + 0.5) * drW;
    const m = part(gF, box(drW - 0.02, fy1 - fy0, 0.02, 0.005), { tone: 'mid', name: 'Strips b dr', mat: panelMat, pos: [x, (fy0 + fy1) / 2, 0], ex: [(i - (nS - 1) / 2) * 0.12, 0, 0] });
    return m;
  });
  // ⊗ marks sized by B, as the organizer draws them; opened, each strip shows its B as an arrow through it
  const fB = strips.map((s, i) => { const r = M.FLUX.a + (i + 0.5) * M.FLUX.c / nS, B = M.ampereB(r) * 1e6 * SC.uT;
    return [0.25, 0.5, 0.75].map(f => {
      const o = { a: thinGrey(gF, 'Field through it'), s, y: fy0 + f * (fy1 - fy0), B };
      label('mark', `<span style="font-size:${(9 + 30 * B).toFixed(0)}px">⊗</span>`, () => ex(gF) < 0.3 ? V(s.position.x, o.y, 0.02) : null);
      return o; }); }).flat();
  label('tick', '<i>a</i>', () => V(cA.x + M.FLUX.a * D / 2 + 0.1, fy0 - 0.25, 0));
  label('tick', '<i>c</i>', () => V(cA.x + (M.FLUX.a + M.FLUX.c / 2) * D + 0.1, fy0 - 0.25, 0));
  label('tick', '<i>b</i>', () => V(cA.x + (M.FLUX.a + M.FLUX.c) * D + 0.45, (fy0 + fy1) / 2, 0));
  label('vec grey', '<b>B</b>', () => V(cA.x + (M.FLUX.a + 0.5 * M.FLUX.c / nS) * D, fy1 + 0.3, 0.6));
  { const t = []; const xa = cA.x, xb = cA.x + M.FLUX.a * D; t.push(xa, fy0 - 0.1, 0, xb, fy0 - 0.1, 0); lines(root, t, '#8a8a8f'); }

  // ======================================================================
  // 7 · a circular loop: Biot–Savart, and the field along its axis
  // ======================================================================
  const cG = V(STATIONS.ring, 2.6, 0), RW = M.RING.R * D;
  const gG = asm('ring', root, { title: 'A circular current loop', sub: 'each dl adds a dB' });
  const ringTor = new THREE.TorusGeometry(RW, 0.05, 12, 128); ringTor.rotateY(Math.PI / 2);
  part(gG, ringTor, { tone: 'hi', name: 'Wire loop', pos: cG.toArray() });
  for (let k = 0; k < 6; k++) { const a = 2 * Math.PI * (k + 0.25) / 6; cone(gG, V(cG.x, cG.y + RW * Math.cos(a), RW * Math.sin(a)), V(0, -Math.sin(a), Math.cos(a)), 'Current I'); }
  label('vec', '<i>I</i>', () => V(cG.x, cG.y + RW + 0.35, 0.3));
  {
    const seeds = [0, 0.02, 0.05, 0.08, 0.11, 0.13].flatMap(y => y ? [y, -y] : [0]);
    for (const y of seeds) {
      const pts = M.fieldLine(M.ringB, [0, y, 0], { step: 0.004, max: 900, inside: inBox(0.6, 0.42) });
      fieldCurve(root, pts, cG, D, 2);
    }
  }
  const PG = part(gG, new THREE.SphereGeometry(0.07, 16, 12), { tone: 'hi', pal: 'ink', name: 'Point P' });
  const BG = bArrow(gG);
  label('tick', 'P', () => PG.position.clone().add(V(0.05, -0.3, 0)));
  label('vec grey', '<b>B</b>', () => tip(BG));
  const pieces = Array.from({ length: M.RING.pieces }, () => ({ dl: inkArrow(gG, 'Pieces dl', 0.018), dB: thinGrey(gG, 'Their dB at P') }));
  const rLineG = dashed(gG, [V(), V()], false);
  label('vec', 'd<b>l</b>', () => ex(gG) > 0.3 ? tip(pieces[0].dl, 0.12) : null);
  label('vec grey', 'd<b>B</b>', () => ex(gG) > 0.3 ? tip(pieces[0].dB, 0.1) : null);
  label('tick', 'r', () => ex(gG) > 0.3 ? rLineG.userData.mid : null);

  // ======================================================================
  // 8 · two parallel wires, same and opposite currents
  // ======================================================================
  const pairs = [['same', 1, 'Currents the same way', 'they attract'], ['opposite', -1, 'Currents opposite ways', 'they repel']].map(([key, sign, title, sub]) => {
    const c = V(STATIONS[key], 0, 0), yF = 2.3, hd = M.WIRES.d / 2 * D;
    const g = asm(key, root, { title, sub });
    const w1 = rod(g, V(c.x - hd, 0, 0), V(c.x - hd, 4.6, 0), 0.07, { name: 'Wire 1' }), w2 = rod(g, V(c.x + hd, 0, 0), V(c.x + hd, 4.6, 0), 0.07, { name: 'Wire 2' });
    const i1 = inkArrow(g, 'Current I₁', 0.028), i2 = inkArrow(g, 'Current I₂', 0.028);
    setArrow(i1, V(c.x - hd - 0.32, 3.2, 0), V(0, 1.2, 0));
    if (sign > 0) setArrow(i2, V(c.x + hd + 0.32, 3.2, 0), V(0, 1.2, 0)); else setArrow(i2, V(c.x + hd + 0.32, 4.4, 0), V(0, -1.2, 0));
    label('vec', '<i>I</i><sub>1</sub>', () => V(c.x - hd - 0.62, 3.8, 0)); label('vec', '<i>I</i><sub>2</sub>', () => V(c.x + hd + 0.62, 3.8, 0));
    const seeds = sign > 0 ? [0.115, 0.13, 0.155, 0.19, 0.235, 0.29] : [0.115, 0.13, 0.155, 0.19, 0.24];
    const F = M.pairB(sign);
    const toY0 = p => [p[0], 0, p[2]];
    for (const x of seeds) {
      const pts = M.fieldLine(q => { const b = F(q); return [b[0], 0, b[2]]; }, [x, 0, 0], { step: 0.004, max: 900, inside: inBox(0.45, 1, 0.45) }).map(toY0);
      fieldCurve(root, pts, V(c.x, yF, 0), D, x > 0.21 ? 4 : 2);
      if (sign < 0 || x < 0.21) fieldCurve(root, pts.map(p => [-p[0], 0, -p[2] * sign]), V(c.x, yF, 0), D, 2);
    }
    if (sign < 0) bLine(root, V(c.x, yF, 4.4), V(c.x, yF, -4.4), 3);
    const pf = M.pairForce(sign);
    const f1 = inkArrow(g, 'Forces'), f2 = inkArrow(g, 'Forces'), b1 = bArrow(g, 'Field of the other wire'), b2 = bArrow(g, 'Field of the other wire');
    const fl = pf.F[0] * SC.wireF;                        // force on wire 2 per metre, drawn
    setArrow(f2, V(c.x + hd + (fl < 0 ? -0.08 : 0.08), yF, 0), V(fl, 0, 0)); setArrow(f1, V(c.x - hd + (fl < 0 ? 0.08 : -0.08), yF, 0), V(-fl, 0, 0));
    const bl = pf.B1[2] * 1e6 * SC.pairUT;
    const mid = a => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y * 0.5, 0)).add(V(0, 0.32, 0)) : null;
    label('vec', '<b>F</b>', () => mid(f1)); label('vec', '<b>F</b>', () => mid(f2));
    label('vec grey', '<b>B</b><sub>1</sub>', () => ex(g) > 0.3 ? tip(b2) : null); label('vec grey', '<b>B</b><sub>2</sub>', () => ex(g) > 0.3 ? tip(b1) : null);
    return { g, sign, c, hd, yF, b1, b2, bl };
  });

  // ======================================================================
  // 9 · a solenoid and a toroid
  // ======================================================================
  const cN = V(STATIONS.solenoid, 2.4, 0), RS = M.SOL.R * D;
  const gN = asm('solenoid', root, { title: 'A solenoid', sub: 'B = μ₀nI inside, uniform' });
  const solMat = fadeMat('paper');
  const turnGeo = new THREE.TorusGeometry(RS, 0.035, 8, 48); turnGeo.rotateY(Math.PI / 2);
  for (const l of M.SOL.loops) part(gN, turnGeo, { tone: 'hi', name: 'Turns', mat: solMat, pos: [cN.x + l[0][0] * D, cN.y, 0] });
  for (const k of [3, 12, 21, 30]) { const x = cN.x + M.SOL.loops[k][0][0] * D + 0.05; cone(gN, V(x, cN.y, RS + 0.02), V(0, -1, 0), 'Current I', 0.8); }
  label('vec', '<i>I</i>', () => V(cN.x - 1.55, cN.y - 0.15, RS + 0.35));
  {
    const seeds = [0, 0.012, 0.024, 0.036, 0.048].flatMap(y => y ? [y, -y] : [0]);
    for (const y of seeds) fieldCurve(root, M.fieldLine(M.solB, [0, y, 0], { step: 0.005, max: 900, inside: inBox(0.6, 0.4) }), cN, D, 4);
  }
  const rectN = dashed(gN, M.rectPath(M.SOL_RECT.h, M.SOL_RECT.Y, 1).map(toW(cN, D)));
  const bN = bArrow(gN);
  label('vec grey', '<b>B</b>', () => tip(bN));
  label('tick', '∮ <b>B</b>·d<b>s</b> = <i>BL</i>', () => ex(gN) > 0.3 ? toW(cN, D)([0, M.SOL_RECT.Y, 0]).add(V(0.6, 0.25, 0)) : null);

  const cT = V(STATIONS.toroid, 1.3, 0), R0 = M.TOR.R0 * D, aT = M.TOR.a * D;
  const gT = asm('toroid', root, { title: 'A toroid', sub: 'B = μ₀NI/2πr, only inside' });
  const torMat = fadeMat('paper');
  const coreMat = shadeMat('base', { opacity: 0.35 });
  const core = part(gT, new THREE.TorusGeometry(R0, aT * 0.9, 24, 96).rotateX(Math.PI / 2), { tone: 'faint', name: 'Core', mat: coreMat, pos: cT.toArray() }); core.userData.noEdge = true;
  const torTurn = new THREE.TorusGeometry(aT, 0.028, 8, 32);
  for (let k = 0; k < M.TOR.N; k++) {
    const ph = 2 * Math.PI * (k + 0.5) / M.TOR.N;
    const m = part(gT, torTurn, { tone: 'hi', name: 'Turns', mat: torMat, pos: [cT.x + R0 * Math.cos(ph), cT.y, R0 * Math.sin(ph)] });
    m.rotation.y = -ph;
  }
  for (const r of [0.115, 0.13, 0.145]) fieldCurve(root, M.fieldLine(M.torB, [r, 0, 0], { step: 0.004, max: 600 }), cT, D, 5);
  const ampT = dashed(gT, Array.from({ length: 96 }, (_, i) => { const a = i / 96 * 2 * Math.PI; return V(Math.cos(a), 0, Math.sin(a)); }));
  ampT.position.copy(cT);
  const bT = Array.from({ length: 8 }, () => bArrow(gT));
  label('vec grey', '<b>B</b>', () => tip(bT[1]));
  label('tick', '', () => ampT.position.clone().add(V(ampT.scale.x * 0.71 + 0.15, 0.25, ampT.scale.x * 0.71)), () => `r ${(torRNow * 100).toFixed(1)} cm`);
  let torRNow = M.TOR.R0;

  // ---------- per-frame ----------
  const v3 = a => V(a[0], a[1], a[2]);
  function update(s) {
    const c = s.clock;
    // 1 · magnet: opened, it fades and the closed surface around N appears
    { const e = ex(gM); setFade(magMats, e, 0.72); sphM.visible = e > 0.02; sphM.scale.setScalar(Math.max(e, 0.02)); }

    // 2 · F = qv × B
    { const d = M.rhrAngle(c), e = ex(gR); rhrDeg = d;
      const vd = v3(M.rhrV(d)).normalize(), th = d * Math.PI / 180;
      for (const o of rq) {
        const F = v3(M.rhrForce(o.q, d)).multiplyScalar(SC.rhrF);
        setArrow(o.v, o.at, vd.clone().multiplyScalar(1.3));
        setArrow(o.F, o.at, F);
        setArrow(o.B, o.at, V(1.0, 0, 0), e);
        setArrow(o.par, o.at, V(1.3 * Math.cos(th), 0, 0), e * (Math.abs(Math.cos(th)) > 0.08 ? 1 : 0));
        setArrow(o.perp, o.at.clone().add(V(1.3 * Math.cos(th), 0, 0)), V(0, 0, 1.3 * Math.sin(th)), e * (Math.sin(th) > 0.08 ? 1 : 0));
      } }

    // 3 · circling protons
    { const t = M.cycTime(c), e = ex(gC);
      cyc.forEach((o, i) => {
        const r = M.orbit(i, t), p = startC.clone().add(v3(r.p).multiplyScalar(DP));
        o.m.position.copy(p);
        setArrow(o.v, p, v3(r.v).multiplyScalar(SC.v));
        setArrow(o.F, p, v3(r.F).multiplyScalar(SC.cycF), e);
        setArrow(o.rad, o.centre, p.clone().sub(o.centre).multiplyScalar(0.94), e);
      }); }

    // 4 · velocity selector
    { const t = M.selTime(c % SEL_LOOP), e = ex(gS);
      selQ.forEach((o, i) => {
        const st = selState(i, t), p = V(x0S + st.p[0] * DP, cS.y + st.p[1] * DP, 0);
        o.m.position.copy(p); o.m.visible = t <= selEnd[i];          // gone once it has run the whole line
        const on = st.inField ? e : 0, f = M.selForces(st);
        setArrow(o.FE, p, v3(f.FE).multiplyScalar(SC.selF), on);
        setArrow(o.FB, p, v3(f.FB).multiplyScalar(SC.selF), on);
        setArrow(o.net, p.clone().add(V(0.3, 0, 0)), v3(M.add(f.FE, f.FB)).multiplyScalar(SC.selF), on);
      }); }

    // 5 · the loop turns slowly through every angle
    { const d = M.loopAngle(c), th = d * Math.PI / 180, e = ex(gL); loopDeg = d;
      loopG.rotation.y = -th;
      const sides = M.loopSides(d), mu = v3(M.loopMu(d)), tau = v3(M.loopTorque(d));
      setArrow(muL, cL, mu.multiplyScalar(SC.mu));
      setArrow(tauL, cL.clone().add(V(0, lb + 0.15, 0)), tau.multiplyScalar(SC.tau), tau.length() > 0.003 ? 1 : 0);
      sides.forEach((sd, i) => {
        const at = cL.clone().add(v3(sd.mid).multiplyScalar(D)), F = v3(sd.F).multiplyScalar(SC.loopF);
        const off = F.clone().normalize().multiplyScalar(0.07);
        setArrow(FL[i], at.add(off), F, e);
      }); }

    // 6 · Ampère loop breathes; the flux rectangle's strips each carry their own B
    { const r = M.ampR(c), rw = r * D, B = M.ampereB(r) * 1e6 * SC.uT, e = ex(gA);
      ampLoop.scale.set(rw, 1, rw);
      bA.forEach((a, k) => { const ang = 2 * Math.PI * (k + 0.5) / NA, p = V(cA.x + rw * Math.cos(ang), yAmp, rw * Math.sin(ang));
        // I up (+y): B = ŷ × r̂ direction, counterclockwise seen from above
        setArrow(a, p, V(Math.sin(ang), 0, -Math.cos(ang)).multiplyScalar(B)); });
      dsA.forEach((a, k) => { const ang = 2 * Math.PI * k / 16, p = V(cA.x + rw * Math.cos(ang), yAmp + 0.04, rw * Math.sin(ang));
        setArrow(a, p, V(Math.sin(ang), 0, -Math.cos(ang)).multiplyScalar(Math.min(0.32, 2 * Math.PI * rw / 16 * 0.8)), e); });
      setArrow(rA, V(cA.x, yAmp, 0), V(-Math.SQRT1_2, 0, Math.SQRT1_2).multiplyScalar(rw - 0.02));
      for (const f of fB) setArrow(f.a, V(f.s.position.x, f.y, f.B / 2), V(0, 0, -f.B), ex(gF)); }

    // 7 · circular loop: P slides along the axis
    { const z = M.ringZ(c), e = ex(gG), P = V(cG.x + z * D, cG.y, 0);
      PG.position.copy(P);
      setArrow(BG, P, V(M.ringAxis(z) * 1e6 * SC.ringUT, 0, 0));
      const pcs = M.ringPieces(z);
      pcs.forEach((pc, i) => {
        const at = toW(cG, D)(pc.at), dl = v3(pc.dl).normalize().multiplyScalar(0.55);
        setArrow(pieces[i].dl, at.clone().sub(dl.clone().multiplyScalar(0.5)), dl, e);
        setArrow(pieces[i].dB, P, v3(pc.dB).multiplyScalar(1e6 * SC.ringUT * 5), e);
      });
      const a0 = toW(cG, D)(pcs[0].at);
      rLineG.geometry.setFromPoints([a0, P]); rLineG.computeLineDistances(); rLineG.visible = e > 0.05;
      rLineG.userData.mid = a0.clone().lerp(P, 0.5).add(V(0, 0.2, 0)); }

    // 8 · parallel wires: opened, the field each wire feels from the other
    for (const p of pairs) { const e = ex(p.g);
      setArrow(p.b2, V(p.c.x + p.hd, p.yF + 0.6, 0), V(0, 0, p.bl), e);
      setArrow(p.b1, V(p.c.x - p.hd, p.yF + 0.6, 0), V(0, 0, p.bl * p.sign), e); }

    // 9 · solenoid: opened, the turns fade and the Amperian rectangle shows; toroid: the circle breathes
    { const e = ex(gN); setFade([solMat], e, 0.8); rectN.visible = e > 0.05;
      const B = M.solB([0, 0, 0])[0] * 1e6 * SC.torUT;
      setArrow(bN, V(cN.x - B / 2, cN.y, 0), V(B, 0, 0)); }
    { const e = ex(gT), r = M.torR(c), rw = r * D; torRNow = r; setFade([torMat], e, 0.75);
      ampT.scale.set(rw, 1, rw);
      bT.forEach((a, k) => { const ang = 2 * Math.PI * (k + 0.25) / 8, pS = [r * Math.cos(ang), 0, r * Math.sin(ang)];
        const B = v3(M.torB(pS)).multiplyScalar(1e6 * SC.torUT);
        setArrow(a, toW(cT, D)(pS), B, B.length() > 0.05 ? 1 : 0); }); }
  }
  return { update, labels };
}
