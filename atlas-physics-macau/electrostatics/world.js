// The figure: a row of nine textbook diagrams in the vertical xy plane, one per page, each on a
// faint sheet of graph paper. Charges are small paper spheres; E is blue, forces are black, the
// net force is red, components are grey. Lengths are drawn S = 10× full size (a grid square is
// 10 cm) unless a scene says otherwise. Every position and arrow length comes from model.js.
import * as THREE from 'three';
import { part, cyl, lines, arrow, setArrow, shadeMat, xAxis, zAxis, V } from '../engine/parts.js';
import * as M from './model.js';

export const S = 10;                 // world metres per real metre (drawn 10× full size)
export const E_SCALE = { field: 1e-3, dipole: 1.5e-3, rod: 1.5e-3, ring: 2e-3 };   // world metres of arrow per N/C, one per scene
export const F_SCALE = { coulomb: 0.35, line: 4 };   // world metres per newton
export const STATIONS = { charge: 0, charging: 17, coulomb: 36, line: 52, field: 70, dipole: 90, rod: 108, ring: 126, plates: 146 };
export const PL = { S: 50, E: 0.7 / 5000, F: 0.6 };  // plates: drawn 50× (a square is 2 cm); 0.7 m per 5000 N/C; force arrow fixed length
const BLUE_LINE = '#9db5e4', GRID = '#e8e8e4';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at) => labels.push({ cls, html, at });
  const tip = (a, pad = 0.22) => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + pad, 0)) : null;

  // graph paper in the plane of each diagram
  const sheet = (x0, x1, y0, y1, step = 1) => {
    const g = [];
    for (let x = x0; x <= x1 + 1e-6; x += step) g.push(x, y0, -0.02, x, y1, -0.02);
    for (let y = y0; y <= y1 + 1e-6; y += step) g.push(x0, y, -0.02, x1, y, -0.02);
    lines(root, g, GRID);
  };
  const SPH = new THREE.SphereGeometry(1, 32, 20), BEAD = new THREE.SphereGeometry(1, 14, 10);
  const ball = (parent, r, { pal = 'paper', tone = 'hi', name = 'Charge', pos = [0, 0, 0] } = {}) => { const m = part(parent, SPH, { pal, tone, name, pos }); m.scale.setScalar(r); return m; };
  const bead = (parent, r, pal, name = 'Charges') => { const m = part(parent, BEAD, { pal, tone: 'mid', name }); m.scale.setScalar(r); return m; };
  // a point charge: a paper sphere, with its sign written on it and an optional magnitude tag
  const charge = (parent, sign, r, tag, name = 'Charge') => {
    const m = ball(parent, r, { name });
    label(sign > 0 ? 'vec red' : 'vec blue', sign > 0 ? '+' : '−', () => m.visible && m.parent.visible ? m.getWorldPosition(V()).add(V(0, r > 0.15 ? r * 0.5 : 0, r)) : null);   // above centre, clear of a force drawn from it
    if (tag) label('tick', tag, () => m.visible && m.parent.visible ? m.getWorldPosition(V()).add(V(-r - 0.08, r + 0.12, 0)) : null);
    return m;
  };
  const eArrow = (parent, name = 'Field') => arrow(parent, 'blue', { r: 0.028, head: 0.15, headR: 0.075, name });
  const dE = (parent, name = 'dE') => arrow(parent, 'blue', { r: 0.013, head: 0.09, headR: 0.04, name, tone: 'mid' });
  const force = (parent, red = false) => arrow(parent, red ? 'red' : 'ink', { r: 0.026, head: 0.15, headR: 0.07, name: red ? 'Net force' : 'Forces' });
  const comp = (parent, name = 'Components') => arrow(parent, 'dark', { r: 0.014, head: 0.09, headR: 0.04, name, tone: 'mid' });
  const W3 = p => V(p[0], p[1], p[2]);
  const dashed = (parent, n = 40) => {   // a reusable dashed segment, re-aimed each frame
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 6), 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#8a8a8f' })); l.userData = { noEdge: true }; parent.add(l);
    l.aim = (a, b) => { const p = g.attributes.position.array; for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 0.5) / n; for (let k = 0; k < 3; k++) { p[i * 6 + k] = a.getComponent(k) + (b.getComponent(k) - a.getComponent(k)) * u0; p[i * 6 + 3 + k] = a.getComponent(k) + (b.getComponent(k) - a.getComponent(k)) * u1; } } g.attributes.position.needsUpdate = true; g.computeBoundingSphere(); };
    return l;
  };
  const ex = g => Math.max(g.userData.explode, 0);

  // ---------- 0 · charge: three carbon atoms (a cartoon: not to scale) ----------
  const X0 = STATIONS.charge;
  const gA = asm('atoms', root, { title: 'Three carbon atoms', sub: 'same nucleus, different electron counts' });
  const atoms = M.ATOMS.map((a, k) => {
    const c = V(X0 + (k - 1) * 3.4, 0.3, 0), g = new THREE.Group(); g.position.copy(c); gA.add(g);
    // nucleus: 6 protons (red) and 6 neutrons (paper) packed in a small cluster
    const nuc = [[0, 0, 0.12], [0.12, 0.08, 0], [-0.12, 0.06, 0.02], [0.05, -0.12, 0.03], [-0.07, -0.08, -0.08], [0.09, 0.02, -0.11], [-0.02, 0.13, -0.07], [0.14, -0.08, -0.06], [-0.14, -0.04, 0.09], [0.02, -0.02, -0.15], [-0.08, 0.1, 0.1], [0.07, 0.11, 0.09]];
    nuc.forEach((p, i) => { const b = bead(g, 0.085, i % 2 ? 'paper' : 'red', 'Nucleus'); b.position.set(...p); });
    const orbit = (r, tilt) => { const pts = []; for (let i = 0; i < 64; i++) for (const j of [i, i + 1]) { const t = j / 64 * 2 * Math.PI; const p = V(r * Math.cos(t), r * Math.sin(t), 0).applyAxisAngle(V(1, 0, 0), tilt); pts.push(p.x, p.y, p.z); } const l = lines(g, pts, '#c4c4c8'); return l; };
    orbit(0.62, 1.1); orbit(1.15, 0.35);
    const el = Array.from({ length: a.e }, (_, i) => { const b = bead(g, 0.075, 'blue', 'Electrons'); b.userData.shell = i < 2 ? 0 : 1; b.userData.slot = i < 2 ? i / 2 : (i - 2) / Math.max(a.e - 2, 4); return b; });
    // the one electron too many, or the gap where one is missing
    const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.09, 1)), new THREE.LineBasicMaterial({ color: '#8a8a8f' }));
    ghost.userData = { noEdge: true }; ghost.visible = false; g.add(ghost);
    label('tick', `${a.p} p⁺ · ${a.e} e⁻`, () => c.clone().add(V(0.62, -1.55, 0)));
    const net = a.p - a.e;
    label(net === 0 ? 'board' : net > 0 ? 'vec red' : 'vec blue', net === 0 ? 'neutral' : net > 0 ? '+1<i>e</i>' : '−1<i>e</i>', () => c.clone().add(V(net === 0 ? -0.5 : 0, 1.6, 0)));
    return { a, g, el, ghost, c };
  });

  // ---------- 1 · charging by induction: a negative rod and a neutral metal sphere ----------
  const X1 = STATIONS.charging, SC = V(X1 - 1.2, 0.5, 0), R1 = M.SPHERE.R * S;
  sheet(X1 - 7, X1 + 7, -2, 3);
  const gI = asm('induce', root, { title: 'Metal sphere, charged rod', sub: 'induction: no contact needed' });
  ball(gI, R1 * 0.995, { name: 'Metal sphere', tone: 'hi', pos: [SC.x, SC.y, SC.z] });
  const rodL = M.ROD.L * S, rodG = new THREE.Group(); gI.add(rodG);
  part(rodG, xAxis(cyl(0.11, rodL, 28)), { tone: 'hi', pal: 'base', pos: [-rodL / 2, 0, 0], name: 'Charged rod' });
  for (let i = 0; i < M.ROD.n; i++) { const b = bead(rodG, 0.06, 'blue', 'Rod charge'); b.position.set(-(i + 0.5) * rodL / M.ROD.n, 0.02, 0.11); }
  label('tick', `rod ${(M.ROD.Q / M.nC).toFixed(0)} nC`, () => rodG.visible ? rodG.localToWorld(V(-rodL * 0.25, 0.42, 0)) : null);
  // surface charge: beads on a fixed set of surface points, sized by |σ| and coloured by its sign
  const NS = 220, surf = [];
  for (let i = 0; i < NS; i++) {
    const y = 1 - 2 * (i + 0.5) / NS, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    const u = [r * Math.cos(th), y, r * Math.sin(th)];
    if (u[2] < -0.25) continue;                       // the back is never seen
    const b = bead(gI, 1, 'red', 'Surface charge'); b.position.copy(SC).addScaledVector(W3(u), R1 * 1.01); surf.push({ u, b });
  }
  const sigRef = Math.abs(M.sigma([-1, 0, 0], M.rodCharges(M.ROD.near), 0));
  const matRed = shadeMat('red'), matBlue = shadeMat('blue');
  // ground: a wire down to the ground symbol; electrons run down it while it is connected
  const wireTop = SC.y - R1, gy = -1.6;
  const wire = part(gI, cyl(0.022, 1, 10), { tone: 'hi', pal: 'ink', name: 'Ground wire' });
  const gs = []; for (let k = 0; k < 3; k++) gs.push(SC.x - 0.45 + k * 0.15, gy - k * 0.14, 0, SC.x + 0.45 - k * 0.15, gy - k * 0.14, 0);
  lines(gI, gs, '#2c2c30');
  const flow = Array.from({ length: 4 }, () => bead(gI, 0.06, 'blue', 'Electrons'));
  label('tick', 'ground', () => V(SC.x + 0.95, gy - 0.1, 0));

  // polarization: a charged balloon near a wall; the wall's molecules stretch into small dipoles
  const XB = X1 + 3.6, BR = M.BALLOON.r * S, wallX = XB + 1.6;
  const gB = asm('balloon', root, { title: 'Balloon on a wall', sub: 'polarization: an insulator’s molecules stretch' });
  part(gB, new THREE.BoxGeometry(0.25, 4.2, 2.4), { tone: 'mid', pal: 'board', pos: [wallX + 0.125, 0.5, 0], name: 'Wall' });
  const balloonG = new THREE.Group(); gB.add(balloonG);
  const bl = ball(balloonG, 1, { name: 'Balloon', tone: 'hi' }); bl.scale.set(BR, BR * 1.18, BR);
  for (let i = 0; i < 7; i++) { const t = (i / 6 - 0.5) * 1.6; const b = bead(balloonG, 0.05, 'red', 'Balloon charge'); b.position.set(BR * Math.cos(t) * 0.98, BR * 1.18 * Math.sin(t) * 0.98, 0.15); }
  const str = []; for (let i = 0; i < 20; i++) { const y0 = -BR * 1.18 - i * 0.09, y1 = y0 - 0.09; str.push(0.04 * Math.sin(i), y0, 0, 0.04 * Math.sin(i + 1), y1, 0); }
  lines(balloonG, str, '#6c6c72');
  const mols = [];
  for (let j = -3; j <= 3; j++) for (const z of [0.0]) {
    const p = V(wallX - 0.1, 0.5 + j * 0.42, z), pos = bead(gB, 0.045, 'red', 'Molecules'), neg = bead(gB, 0.045, 'blue', 'Molecules');
    const link = part(gB, cyl(0.012, 1, 8), { tone: 'lo', pal: 'dark', name: 'Molecules' });
    mols.push({ p, pos, neg, link });
  }
  label('tick', 'wall', () => V(wallX + 0.55, 2.35, 0));
  label('tick', `balloon +${(M.BALLOON.q / M.nC).toFixed(0)} nC`, () => balloonG.localToWorld(V(-0.2, BR * 1.18 + 0.32, 0)));

  // ---------- 2 · Coulomb's law: two point charges ----------
  const X2 = STATIONS.coulomb, Y2 = 0.6;
  sheet(X2 - 4, X2 + 4, -2, 2.5);
  const gC = asm('coulomb', root, { title: 'Two point charges', sub: 'equal and opposite, inverse square' });
  const c1 = charge(gC, 1, 0.26, `+${M.PAIR.q1 / M.uC} μC`), c2 = charge(gC, -1, 0.21, `−${-M.PAIR.q2 / M.uC} μC`);
  const fC1 = force(gC), fC2 = force(gC), rLine = dashed(gC);
  label('vec', 'F<sub>on 1</sub>', () => tip(fC1, 0.05) && tip(fC1, 0.05).add(V(0, 0.28, 0))); label('vec', 'F<sub>on 2</sub>', () => tip(fC2, 0.05) && tip(fC2, 0.05).add(V(0, 0.28, 0)));
  label('axis', '<i>r</i>', () => V(X2 + 0.08, Y2 - 0.32, 0));
  // breakdown: a like pair at the same distance, which repels
  const likeG = new THREE.Group(); gC.add(likeG);
  const l1 = charge(likeG, 1, 0.26, `+${M.PAIR.q1 / M.uC} μC`), l2 = charge(likeG, 1, 0.21, `+${M.PAIR.like / M.uC} μC`);
  const fL1 = force(likeG), fL2 = force(likeG);
  label('vec', 'F', () => likeG.visible ? tip(fL1) : null); label('vec', 'F', () => likeG.visible ? tip(fL2) : null);

  // ---------- 3 · net force on a test charge between two charges ----------
  const X3 = STATIONS.line, Y3 = 0.3, LX = x => X3 + (x - M.LINE.D / 2) * S;
  sheet(X3 - 4, X3 + 4, -2, 2.5);
  const axisPts = [LX(-0.05), Y3, 0, LX(M.LINE.D + 0.05), Y3, 0];
  for (let x = 0; x <= M.LINE.D + 1e-9; x += 0.05) axisPts.push(LX(x), Y3 - 0.06, 0, LX(x), Y3 + 0.06, 0);
  lines(root, axisPts, '#8a8a8f');
  const gL = asm('line', root, { title: 'Three charges on a line', sub: 'where the forces balance' });
  const qA = charge(gL, 1, 0.24, `+${M.LINE.qA / M.uC} μC`), qB = charge(gL, 1, 0.15, `+${M.LINE.qB / M.uC} μC`);
  qA.position.set(LX(0), Y3, 0); qB.position.set(LX(M.LINE.D), Y3, 0);
  const q0 = charge(gL, 1, 0.1, null, 'Test charge');
  const fA = force(gL), fB = force(gL), fN = force(gL, true);
  label('vec', 'F<sub>A</sub>', () => tip(fA)); label('vec', 'F<sub>B</sub>', () => tip(fB)); label('vec red', 'ΣF', () => tip(fN));
  label('tick', '<i>q</i><sub>0</sub>', () => q0.getWorldPosition(V()).add(V(0.05, -0.3, 0)));
  label('tick', 'A', () => V(LX(0) + 0.05, Y3 - 0.45, 0)); label('tick', 'B', () => V(LX(M.LINE.D) + 0.05, Y3 - 0.45, 0));
  label('tick', `x<sub>eq</sub> = ${(M.LINE.xEq * 100).toFixed(0)} cm`, () => ex(gL) > 0.5 ? V(LX(M.LINE.xEq) + 0.55, Y3 - 0.5, 0) : null);

  // ---------- 4 · the field of a point charge ----------
  const X4 = STATIONS.field, CP = V(X4 - 3.7, 0.4, 0), CN = V(X4 + 3.7, 0.4, 0);
  sheet(X4 - 7.5, X4 + 7.5, -3, 3.8);
  lines(root, [X4, -3, 0, X4, 3.8, 0], '#b4b4b8');
  const gF = asm('point', root, { title: 'Field of a point charge', sub: 'E = kQ/r², away from +, toward −' });
  const fieldOf = (c, sign) => {
    const qm = charge(gF, sign, 0.2, `${sign > 0 ? '+' : '−'}${M.POINT.Q / M.nC} nC`); qm.position.copy(c);
    const ln = [];
    for (let i = 0; i < 16; i++) { const t = i / 16 * 2 * Math.PI; ln.push(c.x + 0.25 * Math.cos(t), c.y + 0.25 * Math.sin(t), 0, c.x + 3.4 * Math.cos(t), c.y + 3.4 * Math.sin(t), 0); }
    lines(gF, ln, BLUE_LINE);
    const vecs = [];
    for (let i = 0; i < M.POINT.dirs; i++) for (const r of M.POINT.rings) {
      const t = i / M.POINT.dirs * 2 * Math.PI, u = V(Math.cos(t), Math.sin(t), 0), at = c.clone().addScaledVector(u, r * S);
      const a = eArrow(gF); const Ev = M.pointE(sign * M.POINT.Q, [0, 0, 0], [u.x * r, u.y * r, 0]);
      setArrow(a, at, V(Ev[0], Ev[1], 0).multiplyScalar(E_SCALE.field)); vecs.push(a);
    }
    return vecs;
  };
  const vP = fieldOf(CP, 1); fieldOf(CN, -1);
  label('vec blue', '<i>E</i>', () => tip(vP[0]));
  const t0 = charge(gF, 1, 0.09, null, 'Test charge'), fT = force(gF), rT = dashed(gF), rhat = comp(gF, 'r̂');
  label('vec', '<i>F</i> = <i>q</i><sub>0</sub><i>E</i>', () => tip(fT, 0.1) && tip(fT, 0.1).add(V(-0.25, 0.42, 0))); label('tick', '<i>q</i><sub>0</sub>', () => t0.getWorldPosition(V()).add(V(-0.05, 0.3, 0)));
  label('vec', 'r̂', () => ex(gF) > 0.3 ? tip(rhat, 0.05).add(V(0.1, -0.25, 0)) : null);
  const t1 = charge(gF, 1, 0.09, null, 'Test charge'), fT1 = force(gF);
  label('vec', '<i>F</i>', () => ex(gF) > 0.3 ? tip(fT1) : null);

  // ---------- 5 · the electric dipole ----------
  const X5 = STATIONS.dipole, D0 = V(X5 - 1.0, -0.6, 0), DW = p => D0.clone().add(V(p[0] * S, p[1] * S, 0));
  sheet(X5 - 6, X5 + 4, -2.6, 3.4);
  const gD = asm('dipole', root, { title: 'An electric dipole', sub: 'two opposite charges, close together' });
  const dch = M.dipoleCharges();
  const dPlus = charge(gD, 1, 0.18, `+${M.DIPOLE.q / M.nC} nC`), dMinus = charge(gD, -1, 0.18, `−${M.DIPOLE.q / M.nC} nC`);
  dPlus.position.copy(DW(dch[0].at)); dMinus.position.copy(DW(dch[1].at));
  { const pts = [];
    for (const L of M.dipoleLines(20)) for (let i = 1; i < L.length; i++) { const a = DW(L[i - 1]), b = DW(L[i]); if (a.y > D0.y + 3.9 || b.y > D0.y + 3.9 || a.y < D0.y - 2 || b.y < D0.y - 2 || a.x < X5 - 6 || b.x > X5 + 4) continue; pts.push(a.x, a.y, 0, b.x, b.y, 0); }
    lines(gD, pts, BLUE_LINE); }
  lines(gD, [DW([-0.42, 0, 0]).x, D0.y, 0, DW([0.5, 0, 0]).x, D0.y, 0, D0.x, D0.y - 1.6, 0, D0.x, D0.y + 3.8, 0], '#b4b4b8');
  const pAx = ball(gD, 0.07, { pal: 'ink', name: 'P on the axis' }), pBi = ball(gD, 0.07, { pal: 'ink', name: 'P on the bisector' });
  label('tick', 'P', () => pAx.getWorldPosition(V()).add(V(-0.05, -0.3, 0))); label('tick', 'P', () => pBi.getWorldPosition(V()).add(V(0.3, 0.12, 0)));
  const eAx = eArrow(gD), eBi = eArrow(gD);
  label('vec blue', '<i>E</i>', () => tip(eAx)); label('vec blue', '<i>E</i>', () => tip(eBi, 0.3));
  const eAp = dE(gD, 'E₊ and E₋'), eAm = dE(gD, 'E₊ and E₋'), eBp = dE(gD, 'E₊ and E₋'), eBm = dE(gD, 'E₊ and E₋');
  const cBpy = comp(gD), cBmy = comp(gD);
  label('vec blue', 'E<sub>+</sub>', () => ex(gD) > 0.3 ? tip(eBp) : null); label('vec blue', 'E<sub>−</sub>', () => ex(gD) > 0.3 ? tip(eBm) : null);
  label('vec blue', 'E<sub>+</sub>', () => ex(gD) > 0.3 ? tip(eAp).add(V(0, 0.2, 0)) : null); label('vec blue', 'E<sub>−</sub>', () => ex(gD) > 0.3 ? tip(eAm).add(V(0, -0.15, 0)) : null);

  // ---------- 6 · a uniformly charged rod ----------
  const X6 = STATIONS.rod, R0 = V(X6 - 1.2, -0.4, 0), RL = M.RODE.L * S;
  sheet(X6 - 5, X6 + 5, -2, 4);
  const gR = asm('rod', root, { title: 'A uniformly charged rod', sub: 'cut it into slices dq = λ dx' });
  const ns = M.RODE.slices, sliceL = RL / ns;
  for (let i = 0; i < ns; i++) {
    const cx = R0.x - RL / 2 + (i + 0.5) * sliceL, off = (i + 0.5 - ns / 2) * 0.18;
    part(gR, xAxis(cyl(0.12, sliceL * 0.995, 28)), { tone: 'hi', pal: i % 2 ? 'paper' : 'base', pos: [cx, R0.y, 0], name: 'Slice dq', ex: [off, 0, 0] });
    for (let k = 0; k < 2; k++) { const b = part(gR, BEAD, { pal: 'red', tone: 'mid', name: 'Slice dq', pos: [cx + (k - 0.5) * sliceL * 0.5, R0.y + 0.03, 0.12], ex: [off, 0, 0] }); b.scale.setScalar(0.05); }
  }
  label('tick', `+${M.RODE.Q / M.nC} nC over ${M.RODE.L * 100} cm`, () => V(R0.x + 0.9, R0.y - 0.45, 0));
  const pRa = ball(gR, 0.07, { pal: 'ink', name: 'P on the axis' }), pRb = ball(gR, 0.07, { pal: 'ink', name: 'P on the bisector' });
  label('tick', 'P', () => pRa.getWorldPosition(V()).add(V(0.02, -0.32, 0))); label('tick', 'P', () => pRb.getWorldPosition(V()).add(V(-0.2, 0.05, 0)));
  const eRa = eArrow(gR), eRb = eArrow(gR);
  label('vec blue', '<i>E</i>', () => tip(eRa)); label('vec blue', '<i>E</i>', () => tip(eRb));
  const dRa = Array.from({ length: ns }, () => dE(gR)), dRb = Array.from({ length: ns }, () => dE(gR));
  const rays = Array.from({ length: ns }, () => dashed(gR, 24));
  label('vec blue', 'd<i>E</i>', () => ex(gR) > 0.3 ? tip(dRb[0], 0.15) : null);

  // ---------- 7 · a ring of charge ----------
  const X7 = STATIONS.ring, C7 = V(X7 - 2.4, 0.4, 0), RR = M.RING.R * S;
  sheet(X7 - 5.5, X7 + 5.5, -2.4, 3.2);
  const gG = asm('ring', root, { title: 'A ring of charge', sub: 'only the axial parts survive' });
  part(gG, new THREE.TorusGeometry(RR, 0.07, 16, 96).rotateY(Math.PI / 2), { tone: 'hi', name: 'Ring', pos: [C7.x, C7.y, C7.z] });
  const beads = M.ringBeads(M.RING.beads).map(b => { const m = bead(gG, 0.075, 'red', 'Charge dq'); m.position.copy(C7).add(V(b.at[0], b.at[1], b.at[2]).multiplyScalar(S)); return m; });
  lines(gG, [C7.x - 0.8, C7.y, 0, C7.x + 7.2, C7.y, 0], '#b4b4b8');
  label('tick', `+${(M.RING.Q / M.nC).toFixed(0)} nC`, () => C7.clone().add(V(0, RR + 0.4, 0)));
  const pG = ball(gG, 0.07, { pal: 'ink', name: 'P on the axis' });
  label('tick', 'P', () => pG.getWorldPosition(V()).add(V(0.02, -0.32, 0)));
  const eG = eArrow(gG); label('vec blue', '<i>E</i>', () => tip(eG));
  const dG = beads.map(() => dE(gG)), rG = beads.map(() => dashed(gG, 30));
  label('vec blue', 'd<i>E</i>', () => ex(gG) > 0.3 ? tip(dG[0], 0.15) : null);

  // ---------- 8 · an electron between two charged plates ----------
  const X8 = STATIONS.plates, P8 = V(X8 - 2.4, 0.4, 0), PLL = M.PLATES.L * PL.S, GAP = M.PLATES.gap * PL.S;
  sheet(X8 - 5, X8 + 5, -1.8, 2.6);
  const gP = asm('plates', root, { title: 'Electron between charged plates', sub: 'constant force: a parabola' });
  const plate = (y, sign) => {
    part(gP, new THREE.BoxGeometry(PLL, 0.08, 1.6), { tone: 'hi', pal: 'base', pos: [P8.x + PLL / 2, y, 0], name: sign > 0 ? '+ plate' : '− plate' });
    for (let i = 0; i < 12; i++) { const b = bead(gP, 0.045, sign > 0 ? 'red' : 'blue', sign > 0 ? '+ plate' : '− plate'); b.position.set(P8.x + (i + 0.5) * PLL / 12, y + (sign > 0 ? -0.06 : 0.06), 0.8); }
  };
  plate(P8.y + GAP / 2 + 0.04, 1); plate(P8.y - GAP / 2 - 0.04, -1);
  label('vec red', '+ + +', () => V(P8.x + PLL + 0.55, P8.y + GAP / 2 + 0.05, 0)); label('vec blue', '− − −', () => V(P8.x + PLL + 0.55, P8.y - GAP / 2 - 0.05, 0));
  for (let i = 0; i < 6; i++) { const a = eArrow(gP, 'Uniform field'); setArrow(a, V(P8.x + (i + 0.5) * PLL / 6, P8.y + GAP / 2 - 0.12, -0.5), V(0, -M.PLATES.E * PL.E, 0)); }
  label('vec blue', '<i>E</i>', () => V(P8.x + PLL / 12 + 0.25, P8.y + 0.05, -0.5));
  const elec = charge(gP, -1, 0.08, null, 'Electron');
  const fE = force(gP), vx = comp(gP, 'Velocity'), vy = comp(gP, 'Velocity');
  label('vec', '<i>F</i> = <i>eE</i>', () => tip(fE, 0.2)); label('vec', 'v<sub>x</sub>', () => ex(gP) > 0.3 ? tip(vx, 0.15) : null); label('vec', 'v<sub>y</sub>', () => ex(gP) > 0.3 ? tip(vy, 0.15) : null);
  { const pts = []; const n = 60; for (let i = 0; i < n; i++) { const a = M.electron(i / n * M.PLATES.run), b = M.electron((i + 1) / n * M.PLATES.run); pts.push(P8.x + a.x * PL.S, P8.y + a.y * PL.S, 0, P8.x + b.x * PL.S, P8.y + b.y * PL.S, 0); }
    lines(gP, pts, '#b4b4b8'); }
  const strobes = Array.from({ length: 8 }, (_, k) => { const m = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.08, 1)), new THREE.LineBasicMaterial({ color: '#a4a4aa' })); m.userData = { noEdge: true }; gP.add(m); const s = M.electron(k / 8 * M.PLATES.tCross); m.position.set(P8.x + s.x * PL.S, P8.y + s.y * PL.S, 0); m.userData.t = k / 8 * M.PLATES.tCross; return m; });

  // ---------- per-frame ----------
  function update(s) {
    // 0 · atoms: electrons circle (a cartoon); opened, the extra one steps out, the missing one is outlined
    { const e = ex(gA);
      for (const A of atoms) {
        const extra = A.a.e > A.a.p, missing = A.a.e < A.a.p;
        A.el.forEach((b, i) => {
          const shell = b.userData.shell, r = shell ? 1.15 : 0.62, tilt = shell ? 0.35 : 1.1;
          const t = s.clock * 2 * Math.PI / M.ORBIT_T * (shell ? 0.7 : 1.3) + b.userData.slot * 2 * Math.PI;
          const p = V(r * Math.cos(t), r * Math.sin(t), 0).applyAxisAngle(V(1, 0, 0), tilt);
          if (extra && i === A.el.length - 1) p.lerp(V(1.55, 0.95, 0.3), e);
          b.position.copy(p);
        });
        A.ghost.visible = missing && e > 0.05;
        if (missing) { const t = s.clock * 2 * Math.PI / M.ORBIT_T * 0.7 + (A.a.e - 2) / 4 * 2 * Math.PI; A.ghost.position.copy(V(1.15 * Math.cos(t), 1.15 * Math.sin(t), 0).applyAxisAngle(V(1, 0, 0), 0.35)); }
      }
    }

    // 1 · induction cycle, and the balloon
    { const st = s.induce;
      rodG.visible = st.rod; rodG.position.set(SC.x - st.dTip * S, SC.y, 0);
      for (const { u, b } of surf) {
        const sg = M.sigma(u, st.charges, st.Qnet), k = Math.min(Math.abs(sg) / sigRef, 1);
        const r = 0.085 * Math.sqrt(k);
        b.visible = r > 0.018; b.scale.setScalar(r); b.material = sg > 0 ? matRed : matBlue;
      }
      const down = st.grounded ? 0 : 0.5, top = wireTop - down;
      wire.position.set(SC.x, (top + gy) / 2, 0); wire.scale.set(1, top - gy, 1);
      const k = st.stageT;
      flow.forEach((b, i) => { const u = ((k * 0.9 + i / 4) % 1); b.visible = st.grounded && k < 1.6; b.position.set(SC.x + 0.07, wireTop - u * (wireTop - gy), 0.05); });
      const gap = s.balloonGap, bc = V(wallX - gap * S - BR, 0.5, 0);
      balloonG.position.copy(bc);
      const Eref = M.K * M.BALLOON.q / (BR / S + M.BALLOON.gapNear) ** 2;
      for (const m of mols) {
        const d = m.p.clone().sub(bc).multiplyScalar(1 / S), r = d.length(), Emag = M.K * M.BALLOON.q / (r * r);
        const u = d.normalize(), half = 0.06 + 0.11 * Math.min(Emag / Eref, 1);
        m.neg.position.copy(m.p).addScaledVector(u, -half); m.pos.position.copy(m.p).addScaledVector(u, half);
        m.link.position.copy(m.p); m.link.scale.set(1, 2 * half, 1); m.link.quaternion.setFromUnitVectors(V(0, 1, 0), u);
      }
    }

    // 2 · Coulomb: the pair breathes in and out; opened, a like pair repels underneath
    { const r = s.pairR, a = V(X2 - r * S / 2, Y2, 0), b = V(X2 + r * S / 2, Y2, 0);
      c1.position.copy(a); c2.position.copy(b);
      const F = M.coulomb(M.PAIR.q1, M.PAIR.q2, r) * F_SCALE.coulomb;
      setArrow(fC1, a, V(F, 0, 0)); setArrow(fC2, b, V(-F, 0, 0));
      rLine.aim(V(a.x, Y2 - 0.42, 0), V(b.x, Y2 - 0.42, 0));
      const e = ex(gC); likeG.visible = e > 0.02;
      const yl = Y2 - 1.6 * e, la = V(a.x, yl, 0), lb = V(b.x, yl, 0); l1.position.copy(la); l2.position.copy(lb);
      const FL = M.coulomb(M.PAIR.q1, M.PAIR.like, r) * F_SCALE.coulomb;
      setArrow(fL1, la, V(-FL, 0, 0), e); setArrow(fL2, lb, V(FL, 0, 0), e); }

    // 3 · line: the test charge slides between A and B; opened, it settles at the balance point
    { const x = s.lineX + (M.LINE.xEq - s.lineX) * ex(gL), r = M.lineForces(x), p = V(LX(x), Y3, 0);
      q0.position.copy(p);
      setArrow(fA, p, V(r.FA[0] * F_SCALE.line, 0, 0)); setArrow(fB, p.clone().add(V(0, -0.02, 0)), V(r.FB[0] * F_SCALE.line, 0, 0));
      setArrow(fN, p.clone().add(V(0, 0.42, 0)), V(r.net[0] * F_SCALE.line, 0, 0)); }

    // 4 · point charge: a test charge moves out along a ray; F = q0 E shrinks as 1/r²
    { const r = s.testR + (0.2 - s.testR) * ex(gF), u = V(Math.cos(M.POINT.ang), Math.sin(M.POINT.ang), 0), p = CP.clone().addScaledVector(u, r * S), perp = V(-u.y, u.x, 0);
      t0.position.copy(p);
      const F = M.POINT.q0 * M.pointMag(M.POINT.Q, r);
      setArrow(fT, p, u.clone().multiplyScalar(F / M.POINT.q0 * E_SCALE.field));      // same length as E at that point (stated on the page)
      const e = ex(gF); rT.visible = e > 0.05; rT.aim(CP, p); setArrow(rhat, p.clone().addScaledVector(perp, -0.22), u.clone().multiplyScalar(0.6), e);
      const p1 = CN.clone().addScaledVector(u, r * S); t1.position.copy(p1); t1.visible = e > 0.05;
      setArrow(fT1, p1, u.clone().multiplyScalar(-F / M.POINT.q0 * E_SCALE.field), e); }

    // 5 · dipole: P slides along the axis and up the bisector
    { const x = s.dipoleX, y = s.dipoleY, A = [x, 0, 0], B = [0, y, 0], e = ex(gD);
      pAx.position.copy(DW(A)); pBi.position.copy(DW(B));
      const EA = M.sumE(dch, A), EB = M.sumE(dch, B);
      setArrow(eAx, DW(A), V(EA[0], EA[1], 0).multiplyScalar(E_SCALE.dipole)); setArrow(eBi, DW(B), V(EB[0], EB[1], 0).multiplyScalar(E_SCALE.dipole));
      const Ep = M.pointE(dch[0].q, dch[0].at, A), Em = M.pointE(dch[1].q, dch[1].at, A), Bp = M.pointE(dch[0].q, dch[0].at, B), Bm = M.pointE(dch[1].q, dch[1].at, B);
      setArrow(eAp, DW(A).add(V(0, 0.1, 0)), V(Ep[0], 0, 0).multiplyScalar(E_SCALE.dipole), e); setArrow(eAm, DW(A).add(V(0, -0.1, 0)), V(Em[0], 0, 0).multiplyScalar(E_SCALE.dipole), e);
      setArrow(eBp, DW(B), V(Bp[0], Bp[1], 0).multiplyScalar(E_SCALE.dipole), e); setArrow(eBm, DW(B), V(Bm[0], Bm[1], 0).multiplyScalar(E_SCALE.dipole), e);
      setArrow(cBpy, DW(B).add(V(0.06, 0, 0)), V(0, Bp[1] * E_SCALE.dipole, 0), e); setArrow(cBmy, DW(B).add(V(-0.06, 0, 0)), V(0, Bm[1] * E_SCALE.dipole, 0), e); }

    // 6 · rod: one P on the axis, one on the bisector; opened, the slices and their dE
    { const e = ex(gR), a = s.rodA + (0.12 - s.rodA) * e, b = s.rodB + (M.RODE.b0 - s.rodB) * e, L = M.RODE.L;   // opened: both P move in close
      const A = V(R0.x + RL / 2 + a * S + (ns - 1) / 2 * 0.18 * e, R0.y, 0), B = V(R0.x, R0.y + b * S, 0);
      pRa.position.copy(A); pRb.position.copy(B);
      setArrow(eRa, A, V(M.rodAxis(a) * E_SCALE.rod, 0, 0)); setArrow(eRb, B, V(0, M.rodBisector(b) * E_SCALE.rod, 0));
      M.rodSlices(ns).forEach((sl, i) => {
        const EA = M.pointE(sl.q, sl.at, [L / 2 + a, 0, 0]), EB = M.pointE(sl.q, sl.at, [0, b, 0]);
        setArrow(dRa[i], A.clone().add(V(0, 0.09 * (i - (ns - 1) / 2), 0)), V(EA[0], EA[1], 0).multiplyScalar(E_SCALE.rod), e);
        setArrow(dRb[i], B, V(EB[0], EB[1], 0).multiplyScalar(E_SCALE.rod), e);
        rays[i].visible = e > 0.05; rays[i].aim(V(R0.x + sl.at[0] * S + (i + 0.5 - ns / 2) * 0.18 * e, R0.y, 0), B);
      }); }

    // 7 · ring: P moves out along the axis; opened, it stops at the peak and shows each bead's dE
    { const e = ex(gG), z = s.ringZ + (M.RING_ZMAX - s.ringZ) * e, P = C7.clone().add(V(z * S, 0, 0));
      pG.position.copy(P); setArrow(eG, P, V(M.ringAxis(z) * E_SCALE.ring, 0, 0));
      M.ringBeads(M.RING.beads).forEach((bd, i) => { const d = M.pointE(bd.q, bd.at, [z, 0, 0]); setArrow(dG[i], P, V(d[0], d[1], d[2]).multiplyScalar(E_SCALE.ring * 2), e); rG[i].visible = e > 0.05; rG[i].aim(beads[i].position, P); }); }

    // 8 · plates: the electron crosses in 4 ns, shown slowed down; the strobe marks equal times
    { const st = M.electron(s.plates.t), p = V(P8.x + st.x * PL.S, P8.y + st.y * PL.S, 0), e = ex(gP);
      elec.position.copy(p);
      setArrow(fE, p, V(0, PL.F, 0), st.inside ? 1 : 0);
      const vs = 0.9 / M.PLATES.v0;   // velocity drawn 0.9 m per v0
      setArrow(vx, p, V(st.vx * vs, 0, 0), e); setArrow(vy, p, V(0, st.vy * vs, 0), e);
      strobes.forEach(m => { m.visible = m.userData.t <= s.plates.t; }); }
  }
  return { update, labels };
}
