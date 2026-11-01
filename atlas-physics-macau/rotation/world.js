// The figure: fifteen simple scenes in a row, one per page. A wheel, a merry-go-round, three doors,
// a plank bridge, a ladder, three spinning shapes, rods cut into slices, two pinned rods, a wrench,
// a race down a ramp, a bowling ball, a well bucket, two pushed merry-go-rounds, a skater and a ball
// hitting a rod.
// Metres, y up. Black arrows are individual vectors; red is the net force or the acceleration
// (curved red arrows: angular acceleration α). Curved black arrows show ω, the sense of turning.
import * as THREE from 'three';
import { part, box, cyl, xAxis, zAxis, lines, arrow, setArrow as setArrow0, shadeMat, V } from '../engine/parts.js';
import * as M from './model.js';

export const STATIONS = { wheel: 0, disc: 10, doors: 20, plank: 32, ladder: 44, inertia: 56, integ: 68, parallel: 80, wrench: 91, race: 102, slip: 116, well: 128, impulse: 140, skater: 152, particle: 164 };
export const V_SCALE = 0.25;      // wheel and merry-go-round: arrow metres per m/s
export const A_SCALE = 0.15;      // merry-go-round: arrow metres per m/s²
export const F_LIGHT = 0.05;      // doors and well: arrow metres per newton
export const F_HEAVY = 0.005;     // plank and ladder: arrow metres per newton
export const F_SHAPES = 0.5;      // the 1 N pull on the spinning shapes
export const RACE_V = 0.15;       // race: arrow metres per m/s
export const W_ARC = 0.4;         // curved ω arrows: radians of arc per rad/s
export const L_SCALE = 0.15;      // skater: metres per kg·m²/s
export const F_PAX = 0.8;         // parallel axes: the 0.5 N pushes
export const F_WRENCH = 0.006;    // wrench: arrow metres per newton
export const F_SLIP = 0.02;       // bowling ball: friction, metres per newton
export const P_SCALE = 0.8;       // ball on a rod: metres per kg·m/s
export const LP_SCALE = 0.7;      // ball on a rod: L arrows, metres per kg·m²/s

const Z = V(0, 0, 1);
// keep hidden arrows where they belong, so a breakdown's zoom frames only its own scene
const setArrow = (a, from, vec, op = 1) => { a.position.copy(from); setArrow0(a, from, vec, op); };
// a curved arrow's ring, bent in place to its arc each frame (three's TorusGeometry vertices, re-placed): rings cut to
// whole degrees made a slowly turning ω arrow step
const ARC_SEGS = 48;
function bendArc(geo, R, tube, arc) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  for (let j = 0, k = 0; j <= 8; j++) for (let i = 0; i <= ARC_SEGS; i++, k++) {
    const u = i / ARC_SEGS * arc, v = j / 8 * Math.PI * 2, c = Math.cos(v);
    p.setXYZ(k, (R + tube * c) * Math.cos(u), (R + tube * c) * Math.sin(u), tube * Math.sin(v));
    n.setXYZ(k, c * Math.cos(u), c * Math.sin(u), Math.sin(v));
  }
  p.needsUpdate = n.needsUpdate = true;
}

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at, text) => labels.push({ cls, html, at, text });

  // faint graph-paper ground
  const grid = [];
  for (let x = -4; x <= 170; x++) grid.push(x, 0.001, -3, x, 0.001, 3);
  for (let z = -3; z <= 3; z++) grid.push(-4, 0.001, z, 170, 0.001, z);
  lines(root, grid, '#e6e6e2');

  // ---------- helpers ----------
  const force = (parent, red = false, name = 'Vectors') => arrow(parent, red ? 'red' : 'ink', { r: 0.022, head: 0.12, headR: 0.06, name });
  const comp = (parent, name = 'Components') => arrow(parent, 'dark', { r: 0.016, head: 0.09, headR: 0.045, name, tone: 'mid' });
  const tip = a => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + 0.16, 0)) : null;
  // a curved arrow: an arc of a torus with a cone at its end, drawn over solids like the straight ones
  function curve(parent, pal, { R, tube = 0.018, head = 0.12, headR = 0.05, name = 'Vectors', tone = 'hi', noHead = false }) {
    const g = new THREE.Group();
    const mat = shadeMat(pal).clone(); mat.depthTest = false;
    const ring = part(g, new THREE.TorusGeometry(R, tube, 8, ARC_SEGS, 1), { pal, tone, name, mat });
    ring.frustumCulled = false;   // its bounds change as it bends
    const cone = part(g, new THREE.ConeGeometry(headR, head, 20), { pal, tone, name, mat });
    ring.renderOrder = cone.renderOrder = 10; cone.visible = !noHead;
    g.userData.curve = { ring, cone, R, tube, head: noHead ? 0 : head };
    parent.add(g); return g;
  }
  // centre, axis normal, start angle and signed arc (counter-clockwise about the normal is +)
  function setCurve(a, center, normal, start, arc, opacity = 1) {
    const { ring, cone, R, tube, head } = a.userData.curve;
    const len = Math.abs(arc) * R;
    a.position.copy(center);
    a.visible = opacity > 0.01 && len > 0.04;
    if (!a.visible) return;
    a.position.copy(center); a.quaternion.setFromUnitVectors(Z, normal.clone().normalize());
    const sg = Math.sign(arc), hl = Math.min(head, len * 0.5), b = Math.abs(arc) - hl / R;
    bendArc(ring.geometry, R, tube, b);
    ring.rotation.set(0, 0, sg > 0 ? start : start - b);
    const ca = start + sg * (b + hl / (2 * R));
    cone.position.set(R * Math.cos(ca), R * Math.sin(ca), 0);
    cone.quaternion.setFromUnitVectors(V(0, 1, 0), V(-Math.sin(ca) * sg, Math.cos(ca) * sg, 0));
    cone.scale.set(1, Math.max(hl, 0.001) / (head || 1), 1);
    a.userData.end = start + sg * (Math.abs(arc));
  }
  const curveEnd = (a, out = 0.12) => { if (!a.visible) return null; const { R } = a.userData.curve, e = a.userData.end; return a.localToWorld(V((R + out) * Math.cos(e), (R + out) * Math.sin(e), 0)); };
  // thin solid rod between two points (strings, ropes, lever arms)
  const rod = (parent, r, pal, name, tone = 'hi', over = false) => {
    const mat = over ? Object.assign(shadeMat(pal).clone(), { depthTest: false }) : undefined;
    const m = part(parent, new THREE.CylinderGeometry(r, r, 1, 10), { tone, pal, name, mat }); if (over) m.renderOrder = 10; return m; };
  const stretch = (m, a, b) => { const d = b.clone().sub(a), l = d.length(); m.visible = l > 1e-4; if (!m.visible) return; m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, l, 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };
  // lines that change every frame (dashed lines of action)
  function dyn(parent, color = '#8a8a8f', max = 400) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(max * 6), 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, depthTest: false })); l.userData = { noEdge: true }; l.frustumCulled = false; l.renderOrder = 9;
    parent.add(l);
    return { l, set(coords, opacity = 1) { const p = g.attributes.position; p.array.fill(0); p.array.set(coords.slice(0, max * 6)); p.needsUpdate = true; g.setDrawRange(0, coords.length / 3); l.material.opacity = opacity; l.visible = opacity > 0.01; } };
  }
  const dashes = (a, b, on = 0.07, off = 0.05) => { const out = [], d = b.clone().sub(a), L = d.length(); d.normalize(); for (let s = 0; s < L; s += on + off) { const e = Math.min(s + on, L); out.push(...a.clone().addScaledVector(d, s).toArray(), ...a.clone().addScaledVector(d, e).toArray()); } return out; };
  const ghostOf = geo => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: '#b4b4b8' })); l.userData = { noEdge: true }; root.add(l); return l; };
  const ex = g => Math.max(g.userData.explode, 0);
  const f2 = x => x.toFixed(2);

  // ================= 1 · a bicycle wheel =================
  const XW = STATIONS.wheel, CW = V(XW, 1.1, 0);
  const gW = asm('wheel', root, { title: 'A spinning wheel', sub: 'θ, ω and α' });
  const wheel = new THREE.Group(); wheel.position.copy(CW); gW.add(wheel);
  part(wheel, new THREE.TorusGeometry(M.WHEEL.R, 0.045, 14, 72), { tone: 'hi', pal: 'dark', name: 'Tyre' });
  part(wheel, new THREE.TorusGeometry(M.WHEEL.R - 0.05, 0.014, 8, 72), { tone: 'mid', name: 'Rim' });
  part(wheel, zAxis(cyl(0.06, 0.14, 24)), { tone: 'hi', name: 'Hub' });
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const s = part(wheel, cyl(0.005, M.WHEEL.R - 0.06, 6), { tone: 'lo', name: 'Spokes' }); s.position.set(Math.cos(a) * (M.WHEEL.R - 0.06) / 2, Math.sin(a) * (M.WHEEL.R - 0.06) / 2, 0); s.rotation.z = a - Math.PI / 2; }
  // one marked spoke and a valve: the point we follow
  const mk = part(wheel, cyl(0.014, M.WHEEL.R - 0.06, 8), { tone: 'hi', pal: 'ink', name: 'Marked spoke' }); mk.position.set((M.WHEEL.R - 0.06) / 2, 0, 0.02); mk.rotation.z = -Math.PI / 2;
  part(wheel, new THREE.SphereGeometry(0.05, 16, 12), { tone: 'hi', pal: 'ink', pos: [M.WHEEL.R - 0.05, 0, 0.03], name: 'Marked point' });
  part(gW, zAxis(cyl(0.025, 0.5, 12)), { tone: 'mid', pal: 'dark', pos: CW.toArray(), name: 'Axle' });
  const wOm = curve(gW, 'ink', { R: 0.86 }), wAl = curve(gW, 'red', { R: 1.0 });
  const wV = force(gW);
  const wTh = curve(gW, 'dark', { R: 0.26, tube: 0.012, head: 0.08, headR: 0.035, name: 'Angle', tone: 'mid' });
  const wRef = dyn(gW);
  label('vec', 'ω', () => curveEnd(wOm)); label('vec red', 'α', () => curveEnd(wAl)); label('vec', 'v', () => tip(wV));
  label('vec', 'θ', () => wTh.visible ? CW.clone().add(V(0.42 * Math.cos(wTh.userData.end / 2), 0.42 * Math.sin(wTh.userData.end / 2), 0.05)) : null);
  label('vec', 'r', () => { const a = wheel.rotation.z; return CW.clone().add(V(0.3 * Math.cos(a) - 0.09 * Math.sin(a), 0.3 * Math.sin(a) + 0.09 * Math.cos(a), 0.05)); });

  // ================= 2 · a merry-go-round =================
  const XD = STATIONS.disc, DY = 0.45;
  part(root, cyl(0.08, DY, 16), { tone: 'mid', pal: 'dark', pos: [XD, DY / 2, 0], name: 'Post' });
  const gD = asm('disc', root, { title: 'A merry-go-round', sub: 'same ω, different v' });
  const mgr = new THREE.Group(); mgr.position.set(XD, DY, 0); gD.add(mgr);
  part(mgr, cyl(M.DISC.R, 0.08, 72), { tone: 'hi', pos: [0, 0.04, 0], name: 'Platform' });
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; const s = part(mgr, box(2 * M.DISC.R - 0.1, 0.012, 0.025, 0.004), { tone: 'lo', pal: 'base', name: 'Platform', pos: [0, 0.085, 0] }); s.rotation.y = a; }
  const kid = (r, s) => { const g = new THREE.Group(); g.position.set(r, 0.08, 0); mgr.add(g);
    part(g, cyl(0.09 * s, 0.42 * s, 20, 0.07 * s), { tone: 'hi', pal: 'dark', pos: [0, 0.21 * s, 0], name: 'Riders' });
    part(g, new THREE.SphereGeometry(0.08 * s, 20, 14), { tone: 'hi', pal: 'dark', pos: [0, 0.5 * s, 0], name: 'Riders' }); };
  kid(M.DISC.r1, 1.3); kid(M.DISC.r2, 1.3);
  const dV1 = force(gD), dV2 = force(gD), dAt = comp(gD), dAc = comp(gD), dA = force(gD, true), dAt1 = comp(gD), dAc1 = comp(gD), dA1 = force(gD, true);
  const dOm = curve(gD, 'ink', { R: 0.6 });
  label('vec', 'v<sub>1</sub>', () => tip(dV1)); label('vec', 'v<sub>2</sub>', () => tip(dV2)); label('vec', 'ω', () => curveEnd(dOm));
  label('vec', 'a<sub>t</sub>', () => tip(dAt)); label('vec', 'a<sub>c</sub>', () => tip(dAc)); label('vec red', 'a', () => tip(dA));
  label('tick', `r = ${M.DISC.r1} m`, () => { const a = mgr.rotation.y; return V(XD + (M.DISC.r1 + 0.3) * Math.cos(a), DY + 0.1, -(M.DISC.r1 + 0.3) * Math.sin(a)); });
  label('tick', `r = ${M.DISC.r2} m`, () => { const a = mgr.rotation.y; return V(XD + (M.DISC.r2 + 0.3) * Math.cos(a), DY + 0.1, -(M.DISC.r2 + 0.3) * Math.sin(a)); });

  // ================= 3 · three doors =================
  const XO = STATIONS.doors, DH = 2.0, PH = 1.0, hinges = [-2.0, -0.3, 1.4].map(x => V(XO + x, 0, 0));
  const gO = asm('doors', root, { title: 'Three pushes on three doors', sub: 'τ = rF sin φ' });
  const doors = hinges.map((H, i) => {
    part(root, box(0.1, DH + 0.1, 0.1, 0.01), { tone: 'mid', pal: 'board', pos: [H.x - 0.07, (DH + 0.1) / 2, 0], name: 'Frame' });
    part(root, cyl(0.016, DH, 10), { tone: 'mid', pal: 'ink', pos: [H.x, DH / 2, 0], name: 'Hinge' });
    const g = new THREE.Group(); g.position.copy(H); gO.add(g);
    part(g, box(M.DOOR.W, DH, 0.04, 0.01), { tone: 'hi', pos: [M.DOOR.W / 2 + 0.01, DH / 2, 0], name: 'Door' });
    part(g, box(0.1, 0.035, 0.05, 0.012), { tone: 'hi', pal: 'dark', pos: [0.85, PH, 0.05], name: 'Handle' });
    const c = M.DOOR.cases[i];
    return { g, H, c, F: force(gO), al: curve(gO, 'red', { R: 0.42 }), perp: comp(gO), par: comp(gO), act: dyn(gO), arm: rod(gO, 0.014, 'ink', 'Lever arm', 'hi', true), ghost: ghostOf(new THREE.BoxGeometry(M.DOOR.W, DH, 0.04).translate(M.DOOR.W / 2 + 0.01, DH / 2, 0)) };
  });
  doors.forEach(d => { d.ghost.position.copy(d.H); });
  doors.forEach((d, i) => {
    label('vec', 'F', () => tip(d.F));
    label('tick', `τ = ${d.c.tau.toFixed(2)} N·m`, () => V(d.H.x + 0.95, 0, 0.45));
    label('vec', 'r<sub>⊥</sub>', () => d.arm.visible ? d.arm.position.clone().add(V(0, 0.13, 0)) : null);
  });
  label('vec', 'F<sub>⊥</sub>', () => tip(doors[2].perp)); label('vec', 'F<sub>∥</sub>', () => tip(doors[2].par));
  label('tick', 'φ = 30°', () => { const d = doors[2]; return d.F.visible ? d.g.localToWorld(V(0.62, PH - 0.12, 0.3)) : null; });

  // ================= 4 · a plank bridge =================
  const XP = STATIONS.plank, PL = M.PLANK.L, PY = 1.0, PT = 0.12, A0 = XP - PL / 2;
  for (const x of [A0, A0 + PL]) part(root, box(0.34, PY - PT / 2, 0.8, 0.02), { tone: 'mid', pal: 'board', pos: [x, (PY - PT / 2) / 2, 0], name: 'Support' });
  const gP = asm('plank', root, { title: 'A plank bridge', sub: 'ΣF = 0 and Στ = 0' });
  part(gP, box(PL + 0.2, PT, 0.7, 0.02), { tone: 'hi', pos: [XP, PY, 0], name: 'Plank' });
  const CR = 0.5, crate = part(gP, box(CR, CR, CR, 0.03), { tone: 'hi', name: 'Crate' });
  const pFA = force(gP), pFB = force(gP), pWp = force(gP), pWc = force(gP);
  const pRx = comp(gP, 'Lever arms'), pRm = comp(gP, 'Lever arms'), pRL = comp(gP, 'Lever arms');
  const pPiv = part(gP, new THREE.TorusGeometry(0.1, 0.018, 8, 32), { tone: 'hi', pal: 'ink', pos: [A0, PY, 0.42], name: 'Pivot' });
  const pTq = [curve(gP, 'ink', { R: 0.22, tube: 0.012, head: 0.08, headR: 0.035, name: 'Torques' }), curve(gP, 'ink', { R: 0.22, tube: 0.012, head: 0.08, headR: 0.035, name: 'Torques' }), curve(gP, 'ink', { R: 0.22, tube: 0.012, head: 0.08, headR: 0.035, name: 'Torques' })];
  label('vec', 'F<sub>A</sub>', () => tip(pFA)); label('vec', 'F<sub>B</sub>', () => tip(pFB)); label('vec', 'Mg', () => tip(pWp)); label('vec', 'mg', () => tip(pWc));
  label('tick', 'A', () => V(A0 - 0.12, PY + 0.25, 0.4)); label('tick', 'B', () => V(A0 + PL + 0.28, PY + 0.25, 0.4));
  label('vec', 'x', () => tip(pRx)); label('vec', 'L/2', () => tip(pRm)); label('vec', 'L', () => tip(pRL));

  // ================= 5 · a ladder against a wall =================
  const XL = STATIONS.ladder, WALLX = XL + 1.0, LL = M.LADDER.L;
  part(root, box(0.16, 3.4, 1.8, 0.01), { tone: 'mid', pal: 'board', pos: [WALLX + 0.08, 1.7, 0], name: 'Wall' });
  const gL = asm('ladder', root, { title: 'A ladder against a wall', sub: 'the steepest it can lean' });
  const lad = new THREE.Group(); gL.add(lad);
  for (const z of [-0.22, 0.22]) part(lad, box(LL, 0.07, 0.05, 0.015), { tone: 'hi', pos: [LL / 2, 0.035, z], name: 'Ladder' });
  for (let s = 0.3; s < LL - 0.1; s += 0.3) part(lad, zAxis(cyl(0.018, 0.44, 10)), { tone: 'mid', pos: [s, 0.035, 0], name: 'Ladder' });
  const lW = force(gL), lN = force(gL), lF = force(gL), lFw = force(gL);
  const lAng = curve(gL, 'dark', { R: 0.45, tube: 0.01, noHead: true, name: 'Angle', tone: 'mid' });
  const lArmW = rod(gL, 0.014, 'ink', 'Lever arms', 'hi', true), lArmG = rod(gL, 0.014, 'ink', 'Lever arms', 'hi', true), lAct = dyn(gL);
  const lPiv = part(gL, new THREE.TorusGeometry(0.1, 0.018, 8, 32), { tone: 'hi', pal: 'ink', name: 'Pivot' });
  label('vec', 'mg', () => tip(lW)); label('vec', 'F<sub>N</sub>', () => tip(lN)); label('vec', 'f<sub>s</sub>', () => tip(lF)); label('vec', 'F<sub>w</sub>', () => tip(lFw));
  label('tick', 'O', () => lPiv.position.clone().add(V(-0.12, 0.05, 0.3)));
  let lTh = 1;
  label('vec', 'θ', () => lad.position.clone().add(V(0.62 * Math.cos(lTh / 2), 0.62 * Math.sin(lTh / 2), 0.3)));
  label('vec', 'L sin θ', () => lArmW.visible ? lArmW.position.clone().add(V(-0.45, 0, 0.3)) : null);
  label('vec', '½L cos θ', () => lArmG.visible ? lArmG.position.clone().add(V(0, -0.2, 0.3)) : null);

  // ================= 6 · ring, disc, sphere =================
  const XI = STATIONS.inertia, IY = 1.0, SR = M.SHAPES.R, IX = [-1.3, 0, 1.3].map(x => XI + x);
  const gI = asm('inertia', root, { title: 'Ring, disc and sphere', sub: 'same mass, same radius, same torque' });
  const shapes = M.SHAPES.list.map((s, i) => { const g = new THREE.Group(); g.position.set(IX[i], IY, 0); gI.add(g); return g; });
  part(shapes[0], new THREE.TorusGeometry(SR, 0.04, 14, 72).rotateX(Math.PI / 2), { tone: 'hi', name: 'Ring' });
  part(shapes[0], new THREE.SphereGeometry(0.055, 14, 10), { tone: 'hi', pal: 'ink', pos: [SR, 0, 0], name: 'Ring' });
  // the disc, cut into four thin rings so it can be pulled apart
  M.discAsRings(4).forEach((r, k) => {
    const sh = new THREE.Shape(); sh.absarc(0, 0, r.r1, 0, Math.PI * 2);
    if (r.r0 > 0) { const hole = new THREE.Path(); hole.absarc(0, 0, r.r0, 0, Math.PI * 2, true); sh.holes.push(hole); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: false, curveSegments: 48 }).rotateX(-Math.PI / 2).translate(0, -0.035, 0);
    part(shapes[1], geo, { tone: 'hi', name: 'Disc', ex: [0, 0.2 * k, 0] });
    part(shapes[1], box(r.r1 - r.r0 - 0.02, 0.012, 0.04, 0.004), { tone: 'hi', pal: 'ink', pos: [(r.r0 + r.r1) / 2, 0.04, 0], name: 'Disc', ex: [0, 0.2 * k, 0] });
  });
  part(shapes[2], new THREE.SphereGeometry(SR, 40, 28), { tone: 'hi', name: 'Sphere' });
  part(shapes[2], new THREE.TorusGeometry(SR + 0.004, 0.012, 8, 64), { tone: 'hi', pal: 'ink', name: 'Sphere' });
  const axisLines = []; IX.forEach(x => axisLines.push(...dashes(V(x, IY - 0.75, 0), V(x, IY + 0.75, 0))));
  lines(root, axisLines, '#9a9aa0');
  const iF = shapes.map(() => force(gI)), iW = shapes.map(() => curve(gI, 'ink', { R: 0.45 }));
  iF.forEach(a => label('vec', 'F', () => tip(a))); iW.forEach(a => label('vec', 'ω', () => curveEnd(a)));
  M.SHAPES.list.forEach((s, i) => label('tick', `${s.key} · I = ${s.frac === '1' ? '' : s.frac}MR²`, () => V(IX[i] + 0.45, IY - 0.62, 0)));

  // ================= 7 · the race =================
  const XR = STATIONS.race, RL = M.RACE.len + 0.6, rth = M.RACE.theta, RR = M.RACE.R;
  const topX = XR - RL * Math.cos(rth) / 2, topY = RL * Math.sin(rth);
  const tri = new THREE.Shape(); tri.moveTo(topX, 0); tri.lineTo(topX + RL * Math.cos(rth), 0); tri.lineTo(topX, topY); tri.closePath();
  const rampGeo = new THREE.ExtrudeGeometry(tri, { depth: 2.6, bevelEnabled: false }); rampGeo.translate(0, 0, -1.3);
  part(root, rampGeo, { tone: 'mid', name: 'Ramp', mat: shadeMat('board', { opacity: 0.55 }) });
  const rd = V(Math.cos(rth), -Math.sin(rth), 0), rn = V(Math.sin(rth), Math.cos(rth), 0), LANES = [0.95, 0.32, -0.32, -0.95];
  const S0 = 0.3;   // start a little way down the slope
  { const ice = []; for (let s = 0; s < RL; s += 0.12) { const p = V(topX, topY, LANES[0]).addScaledVector(rd, s).addScaledVector(rn, 0.005); ice.push(...p.clone().add(V(0, 0, -0.25)).toArray(), ...p.clone().add(V(0.06, 0, 0.25)).toArray()); } lines(root, ice, '#c4c4c8');
    const fin = V(topX, topY, 0).addScaledVector(rd, S0 + M.RACE.len + RR).addScaledVector(rn, 0.005); lines(root, [...fin.clone().add(V(0, 0, -1.3)).toArray(), ...fin.clone().add(V(0, 0, 1.3)).toArray()], '#2c2c30'); }
  const gR = asm('race', root, { title: 'The race', sub: 'rolling shares the energy' });
  const racers = M.RACE.list.map((o, i) => { const g = new THREE.Group(); gR.add(g); return g; });
  part(racers[0], box(0.36, 0.36, 0.36, 0.03), { tone: 'hi', name: 'Box' });
  part(racers[1], new THREE.SphereGeometry(RR, 32, 22), { tone: 'hi', name: 'Sphere' });
  part(racers[1], new THREE.TorusGeometry(RR + 0.003, 0.01, 8, 48).rotateX(Math.PI / 2), { tone: 'hi', pal: 'ink', name: 'Sphere' });
  part(racers[2], zAxis(cyl(RR, 0.14, 40)), { tone: 'hi', name: 'Disc' });
  part(racers[2], box(RR * 1.7, 0.02, 0.15, 0.005), { tone: 'hi', pal: 'ink', name: 'Disc' });
  part(racers[3], new THREE.TorusGeometry(RR - 0.02, 0.025, 12, 48), { tone: 'hi', name: 'Ring' });
  part(racers[3], new THREE.SphereGeometry(0.035, 12, 8), { tone: 'hi', pal: 'ink', pos: [0, RR - 0.02, 0], name: 'Ring' });
  const rV = racers.map(() => force(gR)), rTop = force(gR), rMid = force(gR);
  const rDot = part(gR, new THREE.SphereGeometry(0.035, 12, 8), { tone: 'hi', pal: 'red', name: 'Contact point' });
  M.RACE.list.forEach((o, i) => label('tick', o.name, () => V(topX, topY, LANES[i]).addScaledVector(rd, 0.25).addScaledVector(rn, 0.02)));
  label('vec', 'v', () => tip(rMid)); label('vec', '2v', () => tip(rTop)); label('tick', 'v = 0', () => rDot.visible ? rDot.position.clone().add(V(-0.08, -0.12, 0.2)) : null);

  // ================= 8 · a well bucket =================
  const XWl = STATIONS.well, DRY = 3.8, DR = M.WELL.R, ROPEX = XWl + DR, BY0 = 3.05;
  for (const z of [-0.55, 0.55]) part(root, box(0.14, DRY + 0.25, 0.14, 0.02), { tone: 'mid', pal: 'board', pos: [XWl, (DRY + 0.25) / 2, z], name: 'Posts' });
  part(root, new THREE.CylinderGeometry(0.62, 0.62, 0.85, 48, 1, true), { tone: 'mid', pos: [ROPEX, 0.425, 0], name: 'Well', mat: shadeMat('board', { opacity: 0.6 }) });
  const gWl = asm('well', root, { title: 'A bucket down a well', sub: 'τ = Iα on the drum' });
  const drum = new THREE.Group(); drum.position.set(XWl, DRY, 0); gWl.add(drum);
  part(drum, zAxis(cyl(DR, 0.8, 40)), { tone: 'hi', name: 'Drum' });
  part(drum, zAxis(cyl(0.03, 1.25, 12)), { tone: 'mid', pal: 'dark', name: 'Axle' });
  for (const z of [-0.401, 0.401]) part(drum, box(DR * 1.8, 0.035, 0.01, 0.004), { tone: 'hi', pal: 'ink', pos: [0, 0, z], name: 'Drum' });
  const bucket = new THREE.Group(); gWl.add(bucket);
  part(bucket, cyl(0.19, 0.4, 32, 0.25), { tone: 'hi', pal: 'dark', name: 'Bucket' });
  const rope = rod(gWl, 0.01, 'ink', 'Rope');
  const bT = force(gWl), bW = force(gWl), bNet = force(gWl, true), dT = force(gWl), dAl = curve(gWl, 'red', { R: 0.42 }), dOmg = curve(gWl, 'ink', { R: 0.55 });
  const dR = comp(gWl, 'Radius');
  const freeG = ghostOf(new THREE.CylinderGeometry(0.25, 0.19, 0.4, 6));
  label('vec', 'T', () => tip(bT)); label('vec', 'mg', () => tip(bW)); label('vec red', 'ma', () => tip(bNet)); label('vec', 'T', () => tip(dT));
  label('vec red', 'α', () => curveEnd(dAl)); label('vec', 'ω', () => curveEnd(dOmg)); label('vec', 'r', () => dR.visible ? V(XWl + DR / 2, DRY + 0.12, 0.5) : null);
  label('tick', 'free fall', () => freeG.visible ? freeG.position.clone().add(V(0.6, 0, 0)) : null);

  // ================= 9 · a skater =================
  const XS = STATIONS.skater, SH = 1.45;
  part(root, cyl(1.6, 0.02, 64), { tone: 'lo', pal: 'board', pos: [XS, 0.01, 0], name: 'Ice' });
  const gS = asm('skater', root, { title: 'A spinning skater', sub: 'L = Iω stays the same' });
  const sk = new THREE.Group(); sk.position.set(XS, 0, 0); gS.add(sk);
  part(sk, cyl(0.06, 0.8, 16, 0.05), { tone: 'hi', pos: [0, 0.42, 0], name: 'Skater' });
  part(sk, cyl(0.17, 0.62, 28, 0.13), { tone: 'hi', pos: [0, 1.15, 0], name: 'Skater' });
  part(sk, new THREE.SphereGeometry(0.12, 24, 16), { tone: 'hi', pos: [0, 1.62, 0], name: 'Skater' });
  part(sk, box(0.32, 0.03, 0.1, 0.01), { tone: 'mid', pal: 'dark', pos: [0.06, 0.02, 0], name: 'Skate' });
  const arms = [-1, 1].map(sg => ({ sg, arm: rod(sk, 0.035, 'paper', 'Skater'), hand: part(sk, new THREE.SphereGeometry(0.075, 18, 12), { tone: 'hi', pal: 'dark', name: 'Hand weights' }), r: rod(gS, 0.012, 'ink', 'Radius', 'hi', true) }));
  const sL = force(gS), sW = curve(gS, 'ink', { R: 0.7 });
  const skGhost = [-1, 1].map(() => ghostOf(new THREE.SphereGeometry(0.075, 10, 6)));
  label('vec', 'L', () => tip(sL)); label('vec', 'ω', () => curveEnd(sW));
  label('vec', 'r', () => arms[1].r.visible ? arms[1].r.position.clone().add(V(0, 0.14, 0)) : null);

  // ================= 6b · I = ∫ r² dm: two rods cut into slices, a disc built from rings =================
  const XN = STATIONS.integ, NY = 1.0, RL2 = M.ROD.L, RN = M.ROD.N, sl = RL2 / RN;
  const gN = asm('integ', root, { title: 'Rods in slices, a disc in rings', sub: 'I = ∫ r² dm' });
  const NX = [XN - 2.0, XN - 0.9, XN + 1.5];
  gN.userData.focus = () => ({ target: [XN - 0.25, NY + 0.3, 0], radius: 2.4 });
  // a rod as N slices; x0 is where the axis sits along it (centre: −L/2, end: 0)
  const slicedRod = (cx, x0) => { const g = new THREE.Group(); g.position.set(cx, NY, 0); gN.add(g);
    for (let k = 0; k < RN; k++) { const xc = x0 + sl * (k + 0.5); part(g, box(sl - 0.014, 0.07, 0.07, 0.008), { tone: 'hi', pos: [xc, 0, 0], name: 'Slices', ex: [xc * 0.35, 0, 0] }); }
    const dm = part(g, box(sl - 0.004, 0.085, 0.085, 0.01), { tone: 'hi', pal: 'ink', name: 'dm' });
    const r = comp(g, 'r');
    return { g, x0, dm, r }; };
  const nRods = [slicedRod(NX[0], -RL2 / 2), slicedRod(NX[1], 0)];
  part(gN, cyl(0.035, 0.06, 16), { tone: 'mid', pal: 'dark', pos: [NX[1], NY, 0], name: 'Axis' });
  const nDisc = new THREE.Group(); nDisc.position.set(NX[2], NY, 0); gN.add(nDisc);
  const NR = 6, DRd = M.SHAPES.R * 1.5;
  for (let k = 0; k < NR; k++) {
    const r0 = DRd * k / NR, r1 = DRd * (k + 1) / NR, sh = new THREE.Shape(); sh.absarc(0, 0, r1, 0, Math.PI * 2);
    if (r0 > 0) { const hole = new THREE.Path(); hole.absarc(0, 0, r0, 0, Math.PI * 2, true); sh.holes.push(hole); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false, curveSegments: 48 }).rotateX(-Math.PI / 2).translate(0, -0.025, 0);
    part(nDisc, geo, { tone: 'hi', pal: k === 3 ? 'dark' : 'paper', name: 'Rings', ex: [0, 0.09 * k, 0] });
  }
  part(nDisc, box(DRd - 0.02, 0.012, 0.03, 0.004), { tone: 'hi', pal: 'ink', pos: [DRd / 2, 0.035, 0], name: 'Rings' });
  { const ax = []; NX.forEach(x => ax.push(...dashes(V(x, NY - 0.7, 0), V(x, NY + 0.9, 0)))); lines(root, ax, '#9a9aa0'); }
  const nTurn = NX.map(() => curve(gN, 'ink', { R: 0.2, tube: 0.012, head: 0.08, headR: 0.035, name: 'Axis' }));
  nRods.forEach(R => { label('vec', 'dm', () => R.dm.localToWorld(V(0, 0.16, 0))); label('vec grey', 'r', () => R.r.visible ? R.r.localToWorld(V(0, R.r.userData.arrow.shaft.scale.y / 2, 0)).add(V(0, -0.14, 0)) : null); });
  label('tick', 'axis through the centre · ML²/12', () => V(NX[0] + 0.3, NY - 0.85, 0.3));
  label('tick', 'axis through the end · ML²/3', () => V(NX[1] + 0.6, NY - 0.85, 0.3));
  label('tick', 'rings · ½MR²', () => V(NX[2], NY - 0.85, 0.3));
  label('vec', 'dr', () => nDisc.localToWorld(V(DRd * 3.5 / 6, 0.12, 0)));

  // ================= 6c · parallel axes: one rod pinned at its centre, one at its end =================
  const XA = STATIONS.parallel, AY = 0.9, AX = [XA - 1.6, XA + 0.1];
  const gA = asm('parallel', root, { title: 'Two pinned rods', sub: 'I = I<sub>cm</sub> + Md²' });
  gA.userData.focus = () => ({ target: [XA - 0.45, AY, 0], radius: 2.0 });
  const pRods = M.PAX.list.map((p, i) => { const g = new THREE.Group(); g.position.set(AX[i], AY, 0); gA.add(g);
    const x0 = i ? 0 : -RL2 / 2;
    part(g, box(RL2, 0.07, 0.07, 0.015), { tone: 'hi', pos: [x0 + RL2 / 2, 0, 0], name: 'Rod' });
    part(g, new THREE.SphereGeometry(0.045, 14, 10), { tone: 'hi', pal: 'ink', pos: [x0 + RL2 / 2, 0, 0.0], name: 'Centre of mass' });
    part(gA, cyl(0.03, 0.3, 14), { tone: 'mid', pal: 'dark', pos: [AX[i], AY, 0], name: 'Pin' });
    return { g, p, F: force(g), w: curve(gA, 'ink', { R: 0.36 }) }; });
  const aD = comp(pRods[1].g, 'd'), aCm = dyn(gA);
  pRods.forEach(R => { label('vec', 'F', () => tip(R.F)); label('vec', 'ω', () => curveEnd(R.w)); });
  label('tick', `pinned at the centre · I = ${f2(M.ROD.Icm)} kg·m²`, () => V(AX[0] + 0.45, AY, 1.0));
  label('tick', `pinned at the end · I = ${f2(M.PAX.list[1].I)} kg·m²`, () => V(AX[1] + 0.2, AY, 1.5));
  label('vec grey', 'd', () => aD.visible ? aD.localToWorld(V(0, aD.userData.arrow.shaft.scale.y / 2, 0)).add(V(0, 0.15, 0)) : null);
  label('tick', 'axis through the cm', () => ex(gA) > 0.3 ? pRods[1].g.localToWorld(V(RL2 / 2, 0.75, 0)) : null);

  // ================= 6d · work and power: a wrench on a nut =================
  const XK = STATIONS.wrench, KY = 0.16, KR = M.WRENCH.r;
  part(root, box(1.25, 0.08, 1.15, 0.02), { tone: 'mid', pal: 'board', pos: [XK + 0.05, 0.04, 0.1], name: 'Plate' });
  const gK = asm('wrench', root, { title: 'A wrench on a nut', sub: 'W = τΔθ, P = τω' });
  gK.userData.focus = () => ({ target: [XK + 0.1, KY, 0.15], radius: 0.6 });
  part(gK, cyl(0.022, 0.16, 16), { tone: 'mid', pal: 'dark', pos: [XK, 0.12, 0], name: 'Bolt' });
  const nut = new THREE.Group(); nut.position.set(XK, KY, 0); gK.add(nut);
  part(nut, cyl(0.055, 0.05, 6), { tone: 'hi', pal: 'dark', name: 'Nut' });
  const wr = new THREE.Group(); wr.position.set(XK, KY, 0); gK.add(wr);
  part(wr, new THREE.TorusGeometry(0.075, 0.02, 10, 32).rotateX(Math.PI / 2), { tone: 'hi', name: 'Wrench' });
  part(wr, box(KR + 0.06, 0.035, 0.05, 0.012), { tone: 'hi', pos: [(KR + 0.06) / 2 + 0.07, 0, 0], name: 'Wrench' });
  const kGhost = ghostOf(new THREE.BoxGeometry(KR + 0.06, 0.035, 0.05).translate((KR + 0.06) / 2 + 0.07, 0, 0)); kGhost.position.set(XK, KY, 0);
  const kF = arrow(gK, 'ink', { r: 0.011, head: 0.06, headR: 0.028, name: 'Vectors' }), kArc = dyn(gK, '#6c6c72'), kR = arrow(gK, 'dark', { r: 0.008, head: 0.045, headR: 0.02, name: 'Radius', tone: 'mid' });
  label('vec', 'F', () => tip(kF));
  label('vec grey', 's = rΔθ', () => { const q = M.wrench(kNow), a = -q.th / 2; return q.th > 0.3 ? V(XK + (KR - 0.1) * Math.cos(a), KY, -(KR - 0.1) * Math.sin(a)) : null; });
  label('vec grey', 'r', () => kR.visible ? V(XK + KR / 2, KY + 0.1, 0) : null);
  label('tick', '', () => V(XK + 0.05, KY, 0.62), () => { const q = M.wrench(kNow); return `W = τΔθ = ${q.W.toFixed(1)} J`; });
  let kNow = 0;

  // ================= 7b · a bowling ball launched sliding =================
  const XB = STATIONS.slip, LANE = 2.5, LX0 = XB - LANE / 2, BX0 = LX0 + 0.2, BR = M.BOWL.R, LT = 0.04;
  part(root, box(LANE, LT, 0.62, 0.01), { tone: 'mid', pal: 'board', pos: [XB, LT / 2, 0], name: 'Lane' });
  lines(root, [BX0 + M.BOWL.xStar, LT + 0.002, -0.31, BX0 + M.BOWL.xStar, LT + 0.002, 0.31], '#2c2c30');
  const gB = asm('slip', root, { title: 'A bowling ball', sub: 'sliding, then rolling' });
  gB.userData.focus = () => ({ target: [ball.position.x, 0.15, 0], radius: 0.8 });
  const ball = new THREE.Group(); gB.add(ball);
  part(ball, new THREE.SphereGeometry(BR, 32, 22), { tone: 'hi', pal: 'dark', name: 'Ball' });
  part(ball, new THREE.TorusGeometry(BR + 0.002, 0.007, 8, 48).rotateY(Math.PI / 2), { tone: 'hi', pal: 'ink', name: 'Ball' });
  [[0, 0.02], [0.35, -0.03], [0.35, 0.07]].forEach(([a, z]) => part(ball, new THREE.SphereGeometry(0.017, 10, 8), { tone: 'hi', pal: 'ink', pos: [BR * Math.sin(a) * 0.93, BR * Math.cos(a) * 0.93, z], name: 'Finger holes' }));
  const bV = force(gB), bF = force(gB, true), bOm = curve(gB, 'ink', { R: 0.2 }), bSlip = comp(gB, 'Slip velocity'), bTop = comp(gB, 'Rω');
  const bDot = part(gB, new THREE.SphereGeometry(0.018, 10, 8), { tone: 'hi', pal: 'red', name: 'Contact point' });
  label('vec', 'v', () => tip(bV)); label('vec red', 'f<sub>k</sub>', () => tip(bF)); label('vec', 'ω', () => curveEnd(bOm, 0.08));
  label('vec grey', 'v − Rω', () => tip(bSlip)); label('vec grey', 'Rω', () => tip(bTop));
  label('tick', 'v = Rω from here', () => V(BX0 + M.BOWL.xStar, LT, 0.5));
  label('tick', '', () => ball.position.clone().add(V(0, 0.32, 0)), () => M.bowl(bNow).slip ? 'sliding' : 'rolling');
  let bNow = 0;

  // ================= 8b · angular impulse: two merry-go-rounds, two pushes =================
  const XM = STATIONS.impulse, MY = 0.45, MX = [XM - 1.5, XM + 1.5], IR = M.IMP.R;
  const gM = asm('impulse', root, { title: 'Two pushes', sub: 'τΔt = ΔL' });
  gM.userData.focus = () => ({ target: [XM, MY, 0], radius: 3.0 });
  const mgrs = M.IMP.list.map((p, i) => {
    part(root, cyl(0.08, MY, 16), { tone: 'mid', pal: 'dark', pos: [MX[i], MY / 2, 0], name: 'Post' });
    const g = new THREE.Group(); g.position.set(MX[i], MY, 0); gM.add(g);
    part(g, cyl(IR, 0.08, 72), { tone: 'hi', pos: [0, 0.04, 0], name: 'Platform' });
    for (let k = 0; k < 4; k++) { const s = part(g, box(2 * IR - 0.1, 0.012, 0.025, 0.004), { tone: 'lo', pal: 'base', name: 'Platform', pos: [0, 0.085, 0] }); s.rotation.y = k / 4 * Math.PI; }
    part(g, box(0.16, 0.12, 0.16, 0.02), { tone: 'hi', pal: 'dark', pos: [IR - 0.15, 0.14, 0], name: 'Seat' });
    return { g, p, F: force(gM), w: curve(gM, 'ink', { R: 0.5 }), r: comp(gM, 'Lever arm') };
  });
  mgrs.forEach((m, i) => {
    label('vec', 'F', () => tip(m.F));
    label('vec', 'ω', () => curveEnd(m.w));
    label('tick', `${m.p.key}: ${m.p.F} N for ${m.p.dt} s`, () => V(MX[i], MY, -IR - 0.35));
    label('tick', '', () => V(MX[i], MY - 0.25, IR + 0.45), () => `L = ${M.imp(m.p, mNow).L.toFixed(0)} kg·m²/s`);
    label('vec grey', 'r', () => m.r.visible ? V(MX[i] + 0.15, MY + 0.2, IR / 2) : null);
  });
  let mNow = 0;

  // ================= 9b · a ball sliding past a pin, then hitting a rod pinned there =================
  const XQ = STATIONS.particle, QY = 0.12, O = V(XQ - 0.4, QY, -0.2), H = M.HIT;
  part(root, box(2.9, 0.04, 3.0, 0.01), { tone: 'lo', pal: 'board', pos: [XQ - 0.35, 0.02, 0.1], name: 'Table' });
  const gQ = asm('particle', root, { title: 'A ball and a pinned rod', sub: 'L = r × p' });
  gQ.userData.focus = () => ({ target: [O.x + 0.05, 0.3, O.z + 0.35], radius: 1.6 });
  part(gQ, cyl(0.03, 0.2, 14), { tone: 'mid', pal: 'dark', pos: [O.x, QY, O.z], name: 'Pin' });
  const qRod = new THREE.Group(); qRod.position.copy(O); gQ.add(qRod);
  part(qRod, box(H.L, 0.05, 2 * H.rodW, 0.01), { tone: 'hi', pos: [H.L / 2, 0, 0], name: 'Rod' });
  const qBall = part(gQ, new THREE.SphereGeometry(H.rb, 24, 16), { tone: 'hi', pal: 'dark', name: 'Ball' });
  lines(root, dashes(V(O.x + H.d, 0.045, O.z + H.z0 + 0.1), V(O.x + H.d, 0.045, O.z - 0.3), 0.08, 0.06), '#8a8a8f');
  const qP = force(gQ), qR = comp(gQ, 'r'), qPerp = rod(gQ, 0.012, 'ink', 'r⊥', 'hi', true), qW = curve(gQ, 'ink', { R: 0.3 });
  const qLb = force(gQ), qLr = force(gQ), qL = arrow(gQ, 'blue', { r: 0.026, head: 0.13, headR: 0.065, name: 'Total L' });
  label('vec', 'p = mv', () => tip(qP)); label('vec grey', 'r', () => qR.visible ? qR.localToWorld(V(0, qR.userData.arrow.shaft.scale.y * 0.55, 0)).add(V(-0.12, 0.05, 0)) : null);
  label('vec', 'r<sub>⊥</sub> = d', () => O.clone().add(V(H.d * 0.45, 0.14, -0.12)));
  label('tick', 'O', () => O.clone().add(V(-0.12, 0.05, 0.12))); label('vec', 'ω', () => curveEnd(qW));
  label('tick', '', () => qBall.position.clone().add(V(0.7, 0.2, 0)), () => `L = ${M.hit(qNow).Lb.toFixed(2)} kg·m²/s`);
  label('vec', 'L<sub>ball</sub>', () => tip(qLb)); label('vec', 'L<sub>rod</sub>', () => tip(qLr)); label('vec blue', 'L', () => tip(qL));
  let qNow = 0;

  // ================= per frame =================
  function update(st) {
    // 1 · wheel
    { const s = M.wheel(st.wheel.t), th = s.th, e = ex(gW);
      wheel.rotation.z = th;
      setCurve(wOm, CW, Z, Math.PI * 0.1, s.w * W_ARC);
      setCurve(wAl, CW, Z, Math.PI * 1.1, s.a * 0.55);
      const p = CW.clone().add(V(M.WHEEL.R * Math.cos(th), M.WHEEL.R * Math.sin(th), 0.05));
      setArrow(wV, p, V(-Math.sin(th), Math.cos(th), 0).multiplyScalar(s.w * M.WHEEL.R * V_SCALE));
      const thm = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      setCurve(wTh, CW.clone().add(V(0, 0, 0.06)), Z, 0, thm, e);
      wRef.set(dashes(CW.clone().add(V(0, 0, 0.06)), CW.clone().add(V(M.WHEEL.R + 0.25, 0, 0.06))), e); }

    // 2 · merry-go-round
    { const s = M.disc(st.disc.t), th = s.th, e = ex(gD);
      mgr.rotation.y = th;
      const at = r => V(XD + r * Math.cos(th), DY + 0.45, -r * Math.sin(th)), tan = V(-Math.sin(th), 0, -Math.cos(th)), inw = V(-Math.cos(th), 0, Math.sin(th));
      const show = (r, aV, aT, aC, aA, on) => { const p = at(r), q = M.pointAt(r, s);
        setArrow(aV, p, tan.clone().multiplyScalar(q.v * V_SCALE));
        const p2 = p.clone().add(V(0, -0.2, 0));
        setArrow(aT, p2, tan.clone().multiplyScalar(q.at * A_SCALE), on); setArrow(aC, p2, inw.clone().multiplyScalar(q.ac * A_SCALE), on);
        setArrow(aA, p2, tan.clone().multiplyScalar(q.at * A_SCALE).addScaledVector(inw, q.ac * A_SCALE), on); };
      show(M.DISC.r1, dV1, dAt1, dAc1, dA1, e); show(M.DISC.r2, dV2, dAt, dAc, dA, e);
      setCurve(dOm, V(XD, DY + 1.5, 0), V(0, 1, 0), -Math.PI * 0.4, s.w * 1.2); }

    // 3 · doors
    { const { t } = st.doors, e = ex(gO);
      doors.forEach((d, i) => {
        const s = M.door(d.c, t), th = s.th;
        d.g.rotation.y = th; d.ghost.visible = e > 0.05; d.ghost.material.opacity = e;
        const u = V(Math.cos(th), 0, -Math.sin(th)), p = V(-Math.sin(th), 0, -Math.cos(th));
        const phi = d.c.phi * Math.PI / 180;
        const Fd = p.clone().multiplyScalar(Math.sin(phi)).addScaledVector(u, -Math.cos(phi));    // pushes the door open, tilted toward the hinge
        const P = d.H.clone().add(V(0, PH, 0)).addScaledVector(u, d.c.r).addScaledVector(p, -0.03);
        const on = s.open ? 0 : 1, F = Fd.clone().multiplyScalar(M.DOOR.F * F_LIGHT);
        setArrow(d.F, P.clone().sub(F), F, Math.max(on, e));
        setCurve(d.al, d.H.clone().add(V(0, DH + 0.08, 0)), V(0, 1, 0), th + 0.2, d.c.alpha * 0.8, on);
        // breakdown: the line of action, extended, and the lever arm square to it from the hinge
        const Hp = d.H.clone().add(V(0, PH, 0)), foot = P.clone().addScaledVector(Fd, Hp.clone().sub(P).dot(Fd));
        d.act.set(dashes(P.clone().addScaledVector(Fd, -1.0), P.clone().addScaledVector(Fd, 0.9)), e);
        stretch(d.arm, Hp, foot); d.arm.visible = d.arm.visible && e > 0.05;
        if (i === 2) { setArrow(d.perp, P, p.clone().multiplyScalar(M.DOOR.F * Math.sin(phi) * F_LIGHT), e); setArrow(d.par, P, u.clone().multiplyScalar(-M.DOOR.F * Math.cos(phi) * F_LIGHT), e); }
        else { setArrow(d.perp, P, V(), 0); setArrow(d.par, P, V(), 0); }
      }); }

    // 4 · plank
    { const x = M.crateX(st.clock * M.SLOW), s = M.plank(x), e = ex(gP), F = n => n * F_HEAVY, zf = 0.38;
      crate.position.set(A0 + x, PY + PT / 2 + CR / 2, 0);
      setArrow(pFA, V(A0, PY + PT / 2, zf), V(0, F(s.FA), 0)); setArrow(pFB, V(A0 + PL, PY + PT / 2, zf), V(0, F(s.FB), 0));
      setArrow(pWp, V(XP, PY, zf), V(0, -F(M.PLANK.Wp), 0)); setArrow(pWc, V(A0 + x, PY + PT / 2 + CR / 2, zf), V(0, -F(M.PLANK.Wc), 0));
      setArrow(pRx, V(A0, PY - 0.25, 0.5), V(x, 0, 0), e); setArrow(pRm, V(A0, PY - 0.45, 0.5), V(PL / 2, 0, 0), e); setArrow(pRL, V(A0, PY - 0.65, 0.5), V(PL, 0, 0), e);
      pPiv.visible = e > 0.05;
      setCurve(pTq[0], V(A0 + x, PY + PT / 2 + CR + 0.1, zf), Z, Math.PI * 0.6, -1.6, e);
      setCurve(pTq[1], V(XP, PY - 0.1, zf), Z, Math.PI * 1.6, -1.6, e);
      setCurve(pTq[2], V(A0 + PL, PY + 0.75, zf), Z, -Math.PI * 0.1, 1.6, e); }

    // 5 · ladder
    { const th = M.ladderAngle(st.clock * M.SLOW), s = M.ladder(th), e = ex(gL), F = n => n * F_HEAVY, zf = 0;
      lTh = th;
      const O = V(WALLX - LL * Math.cos(th), 0, 0), top = V(WALLX, LL * Math.sin(th), 0), mid = O.clone().lerp(top, 0.5);
      lad.position.copy(O); lad.rotation.z = th;
      setArrow(lW, mid.clone().add(V(0, 0.04, zf)), V(0, -F(s.FN), 0)); setArrow(lN, O.clone().add(V(0, 0.02, zf)), V(0, F(s.FN), 0));
      setArrow(lF, O.clone().add(V(0, 0.02, zf)), V(F(s.f), 0, 0)); setArrow(lFw, top.clone().add(V(-0.02, 0, zf)), V(-F(s.Fw), 0, 0));
      setCurve(lAng, O.clone().add(V(0, 0.02, 0.25)), Z, 0, th);
      lPiv.position.copy(O).add(V(0, 0.02, 0.25)); lPiv.visible = e > 0.05;
      // breakdown: lever arms about the foot O
      lAct.set([...dashes(top, V(O.x - 0.2, top.y, 0)), ...dashes(mid, V(mid.x, 0, 0))], e);
      stretch(lArmW, O.clone().add(V(0, 0, 0.25)), V(O.x, top.y, 0.25)); lArmW.visible = lArmW.visible && e > 0.05;
      stretch(lArmG, O.clone().add(V(0, 0.02, 0.25)), V(mid.x, 0.02, 0.25)); lArmG.visible = lArmG.visible && e > 0.05; }

    // 6 · ring, disc, sphere: the same pull on a string wound round each
    { const { t } = st.inertia;
      M.SHAPES.list.forEach((s, i) => { const q = M.shapeSpin(s, t);
        shapes[i].rotation.y = q.th;
        const P = V(IX[i], IY, SR + 0.01);
        setArrow(iF[i], P, V(M.SHAPES.F * F_SHAPES, 0, 0));
        setCurve(iW[i], V(IX[i], IY + 0.55, 0), V(0, 1, 0), -Math.PI * 0.4, q.w * 0.35); }); }

    // 7 · race
    { const { t } = st.race, e = ex(gR);
      M.RACE.list.forEach((o, i) => { const q = M.race(o, t), h = o.key === 'box' ? 0.18 : RR;
        const c = V(topX, topY, LANES[i]).addScaledVector(rd, S0 + q.s).addScaledVector(rn, h + 0.005);
        racers[i].position.copy(c); racers[i].rotation.z = o.key === 'box' ? -rth : -q.th;
        setArrow(rV[i], c.clone().add(V(0, 0, 0)), rd.clone().multiplyScalar(q.v * RACE_V), e > 0.05 && i === 2 ? 0 : 1);
        if (i === 2) { setArrow(rMid, c.clone().add(V(0, 0, 0.1)), rd.clone().multiplyScalar(q.v * RACE_V), e);
          setArrow(rTop, c.clone().addScaledVector(rn, RR).add(V(0, 0, 0.1)), rd.clone().multiplyScalar(2 * q.v * RACE_V), e);
          rDot.position.copy(c).addScaledVector(rn, -RR).add(V(0, 0, 0.1)); rDot.visible = e > 0.05; } }); }

    // 8 · well
    { const { t } = st.well, q = M.well(t), e = ex(gWl), F = n => n * F_LIGHT;
      drum.rotation.z = -q.th;
      const by = BY0 - q.y; bucket.position.set(ROPEX, by, 0);
      stretch(rope, V(ROPEX, DRY, 0), V(ROPEX, by + 0.2, 0));
      setArrow(bT, V(ROPEX + 0.03, by + 0.2, 0.3), V(0, F(M.WELL.T), 0)); setArrow(bW, V(ROPEX, by, 0.3), V(0, -F(M.WELL.m * M.G), 0));
      setArrow(bNet, V(ROPEX + 0.4, by, 0.3), V(0, -F(M.WELL.m * M.WELL.a), 0));
      setArrow(dT, V(ROPEX, DRY, 0.45), V(0, -F(M.WELL.T), 0));
      setCurve(dAl, V(XWl, DRY, 0.45), Z, Math.PI * 0.95, -M.WELL.alpha * 0.12);
      setCurve(dOmg, V(XWl, DRY, 0.45), Z, Math.PI * 0.25, -q.w * W_ARC * 0.12);
      setArrow(dR, V(XWl, DRY, 0.45), V(DR, 0, 0), e);
      const ff = Math.min(0.5 * M.G * t * t, M.WELL.h); freeG.position.set(ROPEX + 0.75, BY0 - ff, 0); freeG.visible = e > 0.05; }

    // 9 · skater
    { const q = M.skater(st.skater.t), e = ex(gS);
      sk.rotation.y = q.th;
      arms.forEach(a => { const sh = V(a.sg * M.SKATE.shoulder, SH, 0), hd = V(a.sg * (M.SKATE.shoulder + M.SKATE.arm * Math.cos(q.phi)), SH + M.SKATE.arm * Math.sin(q.phi), 0);
        stretch(a.arm, sh, hd); a.hand.position.copy(hd);
        const w = sk.localToWorld(hd.clone()); stretch(a.r, V(XS, w.y, 0), w); a.r.visible = a.r.visible && e > 0.05; });
      skGhost.forEach((g, k) => { const sg = k ? 1 : -1; g.visible = e > 0.05; g.position.copy(sk.localToWorld(V(sg * M.SKATE.rOut, SH, 0))); });
      setArrow(sL, V(XS, 1.8, 0), V(0, M.SKATE.L * L_SCALE, 0));
      setCurve(sW, V(XS, 0.6, 0), V(0, 1, 0), -Math.PI * 0.4, q.w * 0.6); }

    // 6b · rods in slices and the disc of rings turn slowly about their axes; one slice dm walks along
    { const t = st.integ.t, k = M.sliceAt(t), e = ex(gN);
      nTurn.forEach((c, i) => setCurve(c, V(NX[i], NY + 0.6, 0), V(0, 1, 0), -Math.PI * 0.3, 4.2));
      nRods.forEach(R => {
        const xc = R.x0 + sl * (k + 0.5); R.dm.position.set(xc * (1 + 0.35 * e), 0, 0);
        setArrow(R.r, V(0, 0.09, 0.0), V(xc * (1 + 0.35 * e), 0, 0)); });
    }

    // 6c · the same push on two rods
    { const t = st.parallel.t, e = ex(gA);
      pRods.forEach((R, i) => { const q = M.paxSpin(R.p, t);
        R.g.rotation.y = q.th;
        const L = M.PAX.F * F_PAX; setArrow(R.F, V(M.PAX.r, 0, L + 0.04), V(0, 0, -L));
        setCurve(R.w, V(AX[i], AY + 0.45, 0), V(0, 1, 0), -Math.PI * 0.4, q.w * 0.5);
      });
      setArrow(aD, V(0, 0.1, 0), V(RL2 / 2, 0, 0), e);
      const c = pRods[1].g.localToWorld(V(RL2 / 2, 0, 0)); aCm.set(dashes(c.clone().add(V(0, -0.5, 0)), c.clone().add(V(0, 0.65, 0))), e); }

    // 6d · wrench: a clockwise (tightening) stroke at steady ω, then reset for the next stroke
    { const t = st.wrench.t, q = M.wrench(t), e = ex(gK); kNow = t;
      nut.rotation.y = -q.th; wr.rotation.y = -q.th;
      const a = -q.th, u = V(Math.cos(a), 0, -Math.sin(a)), dir = V(Math.sin(a), 0, Math.cos(a));   // clockwise from above: the handle end moves along dir
      const P = V(XK, KY, 0).addScaledVector(u, KR), L = M.WRENCH.F * F_WRENCH;
      setArrow(kF, P.clone().addScaledVector(dir, -L - 0.03), dir.clone().multiplyScalar(L), q.on ? 1 : Math.max(e, 0.0));
      const arc = []; const n = Math.max(2, Math.ceil(q.th / 0.05));
      for (let i = 0; i < n; i++) { const a0 = -q.th * i / n, a1 = -q.th * (i + 1) / n; arc.push(XK + KR * Math.cos(a0), KY + 0.03, -KR * Math.sin(a0), XK + KR * Math.cos(a1), KY + 0.03, -KR * Math.sin(a1)); }
      kArc.set(arc, q.th > 0.02 ? 1 : 0);
      kGhost.visible = e > 0.05; setArrow(kR, V(XK, KY + 0.05, 0), V(KR, 0, 0), e); }

    // 7b · bowling ball
    { const t = st.slip.t, q = M.bowl(t), e = ex(gB); bNow = t;
      const c = V(BX0 + q.x, LT + BR, 0); ball.position.copy(c); ball.rotation.z = -q.th;
      setArrow(bV, c.clone().add(V(0, 0, 0.0)), V(q.v * RACE_V, 0, 0));
      setArrow(bF, V(c.x, LT + 0.004, 0.0), V(-q.f * F_SLIP, 0, 0));
      setCurve(bOm, c, Z, Math.PI * 0.75, -q.w * 0.06);
      const bot = V(c.x, LT + 0.004, 0.12); bDot.position.copy(bot); bDot.visible = e > 0.05;
      setArrow(bSlip, bot, V(q.vSlip * RACE_V, 0, 0), e);
      setArrow(bTop, V(c.x, LT + 2 * BR, 0.12), V(BR * q.w * RACE_V, 0, 0), e); }

    // 8b · angular impulse
    { const t = st.impulse.t, e = ex(gM); mNow = t;
      mgrs.forEach((m, i) => { const q = M.imp(m.p, t);
        m.g.rotation.y = q.th;
        const P = V(MX[i], MY + 0.12, IR + 0.02), L = m.p.F * F_HEAVY;
        setArrow(m.F, P.clone().add(V(-L, 0, 0)), V(L, 0, 0), q.pushing ? 1 : 0);
        setCurve(m.w, V(MX[i], MY + 0.6, 0), V(0, 1, 0), -Math.PI * 0.4, q.w * 1.2);
        setArrow(m.r, V(MX[i], MY + 0.12, 0), V(0, 0, IR), e); }); }

    // 9b · ball and rod
    { const t = st.particle.t, q = M.hit(t), e = ex(gQ); qNow = t;
      qRod.rotation.y = q.th;
      const b = O.clone().add(V(q.x, 0, q.z)); qBall.position.copy(b);
      setArrow(qP, b, V(0, 0, H.m * q.vz * P_SCALE));
      setArrow(qR, O.clone().add(V(0, 0.09, 0)), b.clone().sub(O).setY(0));
      stretch(qPerp, O.clone().add(V(0, 0.07, 0)), O.clone().add(V(H.d, 0.07, 0)));
      setCurve(qW, O.clone().add(V(0, 0.08, 0)), V(0, 1, 0), q.th + 0.3, q.w * 0.5);
      // breakdown: L about O as vertical arrows (up = counter-clockwise from above); the blue total never changes
      const base = O.clone().add(V(-0.5, 0, 0));
      setArrow(qLb, base.clone().add(V(-0.25, 0.06, 0)), V(0, q.Lb * LP_SCALE, 0), e);
      setArrow(qLr, base.clone().add(V(0, 0.06, 0)), V(0, q.Lr * LP_SCALE, 0), e);
      setArrow(qL, base.clone().add(V(0.25, 0.06, 0)), V(0, q.L * LP_SCALE, 0), e); }
  }
  return { update, labels };
}
