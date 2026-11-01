// The figure: a ball thrown straight up beside a position axis, its velocity and acceleration
// as solid arrows, three sheets of graph paper that draw y, v and a as it flies, and a second
// ball thrown at an angle with the same upward speed. No apparatus: only what a textbook
// diagram would draw. Metres, y up, x to the right.
import * as THREE from 'three';
import { part, box, cyl, xAxis, zAxis, lines, arrow, setArrow, shadeMat, V } from '../engine/parts.js';
import * as M from './model.js';

export const Y0 = 0.15;            // ball centre at launch: resting on the ground (position zero)
export const R = 0.15;             // ball radius
export const V_SCALE = 0.12;       // arrow metres per m/s
export const A_SCALE = 0.08;       // arrow metres per m/s²
const PZ = 1.3;                    // the projectile's pad sits in front of the first
export const BOARD = { z: -1.0, w: 4.6, h: 5.75, pad: 0.35, tScale: 2.0, mid: Y0 + 2.6, vScale: 0.25 };
export const BOARDS = [
  { key: 'boardX', x0: -5.8, title: 'position', unit: 'm' },
  { key: 'boardV', x0: -10.8, title: 'velocity', unit: 'm/s' },
  { key: 'boardA', x0: -15.8, title: 'acceleration', unit: 'm/s²' },
];
const tToX = (b, t) => b.x0 + BOARD.pad + t * BOARD.tScale;
export const plotY = { boardX: q => Y0 + q, boardV: q => BOARD.mid + q * BOARD.vScale, boardA: q => BOARD.mid + q * BOARD.vScale };
const fn = { boardX: M.y, boardV: M.vy, boardA: M.ay };
// pages 1.7–1.10: each scene in its own stretch further along +x
export const ST = { rain: 26, river: 62, pull: 79, cube: 100 };
export const RAIN_V = 0.2;                  // rain scene (drawn 1:1): arrow metres per m/s
export const RIV = { s: 0.25, v: 0.8 };     // river drawn 1 m = 25 cm; arrows 0.8 m per m/s
export const PULLS = { s: 0.2, v: 0.1, a: 0.15 };   // pull drawn 1 m = 20 cm; arrows per m/s and per m/s²
export const CUBES = { v: 0.15, a: 0.1 };   // number line drawn 1:1

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);

  // ---------- the ground: faint graph paper ----------
  const floorGrid = [];
  for (let x = -17; x <= 15; x++) floorGrid.push(x, 0.001, -2.2, x, 0.001, 5);
  for (let z = -2; z <= 5; z++) floorGrid.push(-17, 0.001, z, 15, 0.001, z);
  lines(root, floorGrid, '#e2e2de');

  // ---------- launch points: an origin mark on the ground ----------
  const origin = (z) => {
    const g = new THREE.Group(); g.position.z = z; root.add(g);
    const ring = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, b = (i + 1) / 48 * Math.PI * 2; ring.push(Math.cos(a) * 0.24, 0.003, Math.sin(a) * 0.24, Math.cos(b) * 0.24, 0.003, Math.sin(b) * 0.24); }
    lines(g, [...ring, -0.36, 0.003, 0, 0.36, 0.003, 0, 0, 0.003, -0.36, 0, 0.003, 0.36], '#6e6e74');
    return g;
  };
  origin(0);
  const pad2 = origin(PZ);

  // ---------- measuring staff: the position axis ----------
  const staff = asm('staff', root, { title: 'Position axis', sub: 'where the ball is, measured from the launch point' });
  const SX = -0.72;
  part(staff, cyl(0.014, 5.6, 12), { tone: 'hi', pal: 'ink', pos: [SX, 2.8, 0], name: 'Axis' });
  part(staff, new THREE.ConeGeometry(0.05, 0.16, 20), { tone: 'hi', pal: 'ink', pos: [SX, 5.68, 0], name: 'Axis' });
  const ticks = [];
  for (let i = 0; i <= 52; i++) {
    const yy = Y0 + i * 0.1, l = i % 10 === 0 ? 0.13 : i % 5 === 0 ? 0.08 : 0.045;
    ticks.push(SX, yy, 0, SX + l, yy, 0);
  }
  lines(staff, ticks, '#6e6e74');
  // a short mark that rides at the ball's height
  const collar = part(staff, box(0.26, 0.022, 0.022, 0.006), { tone: 'hi', pal: 'ink', pos: [SX, Y0, 0], name: 'Height marker' });
  // displacement arrow beside the staff (from zero to the ball's height)
  const dispArrow = arrow(staff, 'ink', { r: 0.018, head: 0.1, headR: 0.05, name: 'Displacement', tone: 'hi' });

  // ---------- the ball (straight up) ----------
  const ball = asm('ball', root, { title: 'The ball', sub: 'thrown straight up at ' + M.VY0.toFixed(1) + ' m/s' });
  const ballMesh = part(ball, new THREE.SphereGeometry(R, 48, 32), { tone: 'hi', name: 'Ball' });
  const vArrowG = asm('vArrow', root, { title: 'Velocity', sub: 'how fast, and which way' });
  const vArrow = arrow(vArrowG, 'ink', { name: 'Velocity' });
  const aArrowG = asm('aArrow', root, { title: 'Acceleration', sub: 'how the velocity changes' });
  const aArrow = arrow(aArrowG, 'red', { name: 'Acceleration' });

  // strobe images every 0.2 s
  const ghostMat = shadeMat('paper', { opacity: 0.5 });
  const ghosts = [];
  for (let k = 0; k * M.STROBE <= M.T + 1e-9; k++) {
    const g = new THREE.Mesh(new THREE.SphereGeometry(R * 0.98, 32, 20), ghostMat);
    g.userData = { tone: 0.2, ghost: true, t: k * M.STROBE }; g.visible = false; root.add(g); ghosts.push(g);
  }

  // ---------- projectile ----------
  const proj = asm('proj', root, { title: 'The thrown-across ball', sub: `launched at ${M.V0P.toFixed(1)} m/s, ${M.ANGLE.toFixed(1)}° up` });
  part(proj, new THREE.SphereGeometry(R, 48, 32), { tone: 'hi', name: 'Ball' });
  const projVG = asm('projV', root, { title: 'Its velocity', sub: 'one arrow, two independent parts' });
  const projV = arrow(projVG, 'ink', { name: 'Velocity' });
  const vxA = arrow(projVG, 'dark', { r: 0.026, head: 0.13, headR: 0.07, name: 'Horizontal part vₓ', tone: 'mid' });
  const vyA = arrow(projVG, 'dark', { r: 0.026, head: 0.13, headR: 0.07, name: 'Vertical part v_y', tone: 'mid' });
  const projA = arrow(proj, 'red', { name: 'Acceleration' });
  const shadow = asm('shadow', root, { title: 'Its floor shadow', sub: 'the horizontal motion alone' });
  const shadowMesh = part(shadow, new THREE.CylinderGeometry(R, R, 0.008, 40), { tone: 'mid', pal: 'dark', name: 'Shadow' });
  const pGhosts = [], sGhosts = [];
  for (let k = 0; k * M.STROBE <= M.T + 1e-9; k++) {
    const g = new THREE.Mesh(new THREE.SphereGeometry(R * 0.98, 32, 20), ghostMat); g.userData = { tone: 0.2, ghost: true }; g.visible = false; root.add(g); pGhosts.push(g);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.7, R * 0.7, 0.006, 32), shadeMat('dark', { opacity: 0.35 })); s.userData = { tone: 0.2, ghost: true }; s.visible = false; root.add(s); sGhosts.push(s);
  }
  // the arc, revealed as it is flown
  const arcPts = []; for (let i = 0; i <= 200; i++) { const t = i / 200 * M.T; arcPts.push(V(M.x(t), Y0 + M.y(t), PZ)); }
  const arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 200, 0.012, 8), shadeMat('dark'));
  arc.userData = { noEdge: true }; root.add(arc);
  // guide lines: projectile ↔ straight-up ball at the same height, and down to its shadow
  const guide = lines(root, [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0], '#8a8a8f');
  guide.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);

  // ---------- graph boards ----------
  const boards = BOARDS.map(b => {
    const g = asm(b.key, root, { title: `${b.title[0].toUpperCase() + b.title.slice(1)} – time graph`, sub: b.key === 'boardX' ? 'its slope is the velocity' : b.key === 'boardV' ? 'its slope is the acceleration; its area is the displacement' : 'its area is the change in velocity' });
    const cx = b.x0 + BOARD.w / 2;
    part(g, box(BOARD.w, BOARD.h, 0.012, 0.004), { tone: 'faint', pal: 'board', pos: [cx, BOARD.h / 2 + 0.1, BOARD.z], name: 'Graph' });
    const zf = BOARD.z + 0.008;
    const t0 = tToX(b, 0), t1 = tToX(b, M.T + 0.05);
    const zeroY = b.key === 'boardX' ? Y0 : BOARD.mid;
    // grid every 0.5 s and every 1 m (or 2 m/s)
    const grid = [];
    for (let t = 0.5; t <= M.T + 1e-9; t += 0.5) grid.push(tToX(b, t), 0.35, zf, tToX(b, t), BOARD.h - 0.2, zf);
    if (b.key === 'boardX') for (let q = 1; q <= 5; q++) grid.push(t0, Y0 + q, zf, t1, Y0 + q, zf);
    else for (let q = -10; q <= 10; q += 2) if (q) grid.push(t0, plotY[b.key](q), zf, t1, plotY[b.key](q), zf);
    lines(g, grid, '#e4e4e0');
    // axes
    part(g, box(t1 - t0 + 0.1, 0.022, 0.02, 0.005), { tone: 'hi', pal: 'ink', pos: [(t0 + t1) / 2, zeroY, zf], name: 'Time axis' });
    part(g, box(0.022, BOARD.h - 0.5, 0.02, 0.005), { tone: 'hi', pal: 'ink', pos: [t0, 0.35 + (BOARD.h - 0.55) / 2, zf], name: 'Value axis' });
    // the curve, drawn as the ball flies
    const pts = []; for (let i = 0; i <= 240; i++) { const t = i / 240 * M.T; pts.push(V(tToX(b, t), plotY[b.key](fn[b.key](t)), zf + 0.01)); }
    const curve = part(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 240, 0.03, 8), { tone: 'hi', pal: 'ink', name: 'Curve' });
    const cursor = part(g, new THREE.SphereGeometry(0.075, 24, 16), { tone: 'hi', pal: 'ink', name: 'Now' });
    // slope (tangent) and area, shown when the board is opened
    const tangent = part(g, box(1.8, 0.03, 0.02, 0.01), { tone: 'hi', pal: 'red', name: 'Slope' });
    const area = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: '#e5484d', transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
    area.userData = { noEdge: true }; g.add(area);
    return { ...b, g, curve, cursor, tangent, area, zf, zeroY };
  });
  // a level line from the ball across to the position graph
  const level = lines(root, [0, 0, 0, 1, 0, 0], '#b4b4b8');
  level.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);

  // ---------- per-frame update ----------
  const setLine = (l, pts) => { const a = l.geometry.attributes.position; pts.forEach((p, i) => a.setXYZ(i, p.x, p.y, p.z)); a.needsUpdate = true; l.geometry.computeBoundingSphere(); };
  function update(t, look, resting = false) {
    // resting on the pad after landing: no velocity, and the pad cancels gravity
    const fly = resting ? 0 : 1;
    const yy = Y0 + M.y(t), v = M.vy(t);
    ball.position.set(0, yy, 0);
    ball.children.forEach(m => m.position.set(0, 0, 0));
    collar.position.y = yy;
    setArrow(dispArrow, V(SX + 0.24, Y0, 0), V(0, yy - Y0, 0), look.disp);
    // arrows start at the ball's surface
    const vv = V(0, v * V_SCALE, 0);
    setArrow(vArrow, V(0, yy + Math.sign(v) * R, 0), vv, fly);
    setArrow(aArrow, V(0.26, yy, 0), V(0, -M.G * A_SCALE, 0), fly);
    ghosts.forEach(g => { g.visible = look.strobe > 0.01 && g.userData.t <= t + 1e-6; g.position.set(0, Y0 + M.y(g.userData.t), 0); });
    ghostMat.uniforms.uOpacity.value = 0.5 * Math.max(look.strobe, look.proj);

    // projectile
    const showP = look.proj > 0.01;
    for (const o of [proj, projVG, shadow, arc, guide, pad2]) o.visible = showP;
    const px = M.x(t);
    proj.position.set(px, yy, PZ);
    shadow.position.set(px, 0.004, PZ);
    const pv = V(M.VX, v, 0).multiplyScalar(V_SCALE), pc = V(px, yy, PZ);
    setArrow(projV, pc.clone().addScaledVector(pv.clone().normalize(), R), pv, fly);
    const ex = Math.max(projVG.userData.explode, look.comp || 0) * fly;
    setArrow(vxA, pc.clone().add(V(R, 0, 0)), V(M.VX * V_SCALE, 0, 0), ex);
    setArrow(vyA, pc.clone().add(V(0, Math.sign(v) * R, 0)), V(0, v * V_SCALE, 0), ex);
    setArrow(projA, V(0.26, 0, 0), V(0, -M.G * A_SCALE, 0), fly);
    arc.geometry.setDrawRange(0, Math.round(t / M.T * 200) * 8 * 6);
    pGhosts.forEach((g, k) => { const tk = k * M.STROBE; g.visible = showP && tk <= t + 1e-6; g.position.set(M.x(tk), Y0 + M.y(tk), PZ); });
    sGhosts.forEach((g, k) => { const tk = k * M.STROBE; g.visible = showP && tk <= t + 1e-6; g.position.set(M.x(tk), 0.003, PZ); });
    setLine(guide, [V(0, yy, 0), V(px, yy, PZ), V(px, yy, PZ), V(px, 0, PZ)]);

    // graphs
    for (const b of boards) {
      const q = fn[b.key](t);
      b.curve.geometry.setDrawRange(0, Math.round(t / M.T * 240) * 8 * 6);
      b.cursor.position.set(tToX(b, t), plotY[b.key](q), b.zf + 0.02);
      const open = Math.max(b.g.userData.explode, 0);
      // slope at t, in board units (time is stretched by tScale)
      const dq = b.key === 'boardX' ? M.vy(t) : b.key === 'boardV' ? M.ay() : 0;
      const k = b.key === 'boardX' ? 1 : BOARD.vScale;
      b.tangent.visible = open > 0.02 && b.key !== 'boardA';
      b.tangent.position.copy(b.cursor.position).setZ(b.zf + 0.03);
      b.tangent.rotation.z = Math.atan2(dq * k, BOARD.tScale);
      b.tangent.scale.x = open;
      // area between the curve and zero, from 0 to t
      b.area.visible = open > 0.02 && b.key !== 'boardX';
      if (b.area.visible) {
        const pos = [], n = 60;
        for (let i = 0; i < n; i++) {
          const ta = i / n * t, tb = (i + 1) / n * t;
          const xa = tToX(b, ta), xb = tToX(b, tb), ya = plotY[b.key](fn[b.key](ta)), yb = plotY[b.key](fn[b.key](tb)), z0 = b.zeroY;
          pos.push(xa, z0, b.zf + 0.005, xb, z0, b.zf + 0.005, xb, yb, b.zf + 0.005, xa, z0, b.zf + 0.005, xb, yb, b.zf + 0.005, xa, ya, b.zf + 0.005);
        }
        b.area.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        b.area.material.opacity = 0.2 * open;
      }
    }
    const bx = boards[0];
    setLine(level, [V(-0.05, yy, 0), V(bx.cursor.position.x, yy, bx.zf)]);
    level.visible = look.level > 0.01;
  }

  // where labels go (world points) for the page
  const anchors = {
    v: () => vArrow.visible ? vArrow.localToWorld(V(0, vArrow.userData.arrow.shaft.scale.y + 0.18, 0)) : null,
    a: () => !aArrow.visible ? null : aArrow.localToWorld(V(0, aArrow.userData.arrow.shaft.scale.y + 0.2, 0)),
    vx: () => vxA.visible ? vxA.localToWorld(V(0, vxA.userData.arrow.shaft.scale.y + 0.2, 0)) : null,
    vy: () => vyA.visible ? vyA.localToWorld(V(0, vyA.userData.arrow.shaft.scale.y + 0.2, 0)) : null,
    staff: q => V(SX - 0.12, Y0 + q, 0.04),
    board: (b, where) => {
      const B = boards.find(x => x.key === b);
      return where === 'title' ? V(B.x0 + 0.4, BOARD.h - 0.05, B.zf) : V(tToX(B, M.T) + 0.05, B.zeroY - 0.28, B.zf);
    },
  };
  const more = buildMore(root, asm);
  return { update, anchors, boards, ballMesh, shadowMesh, ...more };
}

// ---------- pages 1.7–1.10 ----------
const tipOf = (a, d = 0.2) => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + d, 0)) : null;
const midOf = (a, side) => a.visible ? a.localToWorld(V(side, a.userData.arrow.shaft.scale.y * 0.5, 0)) : null;
const setLine2 = (l, pts) => { const a = l.geometry.attributes.position; pts.forEach((p, i) => a.setXYZ(i, p.x, p.y, p.z)); a.needsUpdate = true; l.geometry.computeBoundingSphere(); };
const dynLines = (parent, n, color) => { const l = lines(parent, new Array(n * 6).fill(0), color); l.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage); return l; };
const mod = (a, n) => ((a % n) + n) % n;
// a pseudo-random but fixed scatter
const rnd = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// the textbook car of chapter 2, as a group facing +x
function carModel(parent, name = 'Car') {
  const g = new THREE.Group(); parent.add(g);
  part(g, box(4.2, 0.7, 1.8, 0.18), { tone: 'hi', pos: [0, 0.75, 0], name });
  part(g, box(2.2, 0.6, 1.6, 0.2), { tone: 'hi', pos: [-0.3, 1.38, 0], name });
  for (const x of [-1.35, 1.35]) for (const z of [-0.8, 0.8]) {
    part(g, zAxis(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 28)), { tone: 'mid', pal: 'dark', pos: [x, 0.36, z], name: 'Wheels' });
    part(g, zAxis(new THREE.CylinderGeometry(0.17, 0.17, 0.28, 20)), { tone: 'mid', pos: [x, 0.36, z], name: 'Wheels' });
  }
  return g;
}

function buildMore(root, asm) {
  const labels = [];
  const label = (cls, html, at, text) => labels.push({ cls, html, at, text });
  const road = (x0, x1, z0, z1, y = 0.01) => part(root, box(x1 - x0, 0.02, z1 - z0, 0.005), { tone: 'lo', pal: 'board', pos: [(x0 + x1) / 2, y, (z0 + z1) / 2], name: 'Road' });
  const grid = [];
  for (let x = 22; x <= 108; x++) grid.push(x, 0.001, -4.5, x, 0.001, 4.5);
  for (let z = -4; z <= 4; z++) grid.push(22, 0.001, z, 108, 0.001, z);
  lines(root, grid, '#e2e2de');

  // ---------- 1.7 rain, seen from the road and from the car ----------
  const RA = ST.rain, RW = 10, CB = RA + RW + 2, CW = 7, HTOP = 4.2, TF = HTOP / M.RAIN.vr, EXPO = 0.05;
  road(RA, RA + RW, -2, 2); road(CB, CB + CW, -2, 2);
  const dashRoad = []; for (let x = RA + 0.5; x < RA + RW; x += 2) dashRoad.push(x, 0.025, 0, x + 1, 0.025, 0);
  lines(root, dashRoad, '#9a9aa0');
  const dashCar = dynLines(root, 5, '#9a9aa0');
  const gR = asm('rainRoad', root, { title: 'Seen from the road', sub: 'the rain falls straight down; the car drives through it' });
  const carR = carModel(gR);
  const vCG = arrow(gR, 'ink', { name: 'Car velocity' });
  const vRGa = arrow(gR, 'ink', { name: 'Rain velocity' });
  const gC = asm('rainCar', root, { title: 'Seen from the car', sub: 'the car is at rest; road and rain stream past' });
  const carC = carModel(gC); carC.position.set(CB + CW / 2, 0, 0);
  const vRCa = arrow(gC, 'blue', { name: 'Rain velocity, from the car' });
  const vGCa = arrow(gC, 'dark', { r: 0.026, head: 0.13, headR: 0.07, name: 'Road velocity, from the car', tone: 'mid' });
  label('vec', 'v<sub>CG</sub>', () => tipOf(vCG, 0.3)); label('vec', 'v<sub>RG</sub>', () => tipOf(vRGa, 0.3));
  label('vec blue', 'v<sub>RC</sub>', () => tipOf(vRCa, 0.3)); label('vec grey', 'v<sub>GC</sub>', () => tipOf(vGCa, 0.3));
  label('board', 'seen from the road', () => V(RA + 0.2, HTOP + 0.9, 0));
  label('board', 'seen from the car', () => V(CB + 0.2, HTOP + 0.9, 0));
  // drops: short streaks, each as long as the distance it moves in a 0.05 s exposure
  const dropMat = shadeMat('dark');
  const mkDrop = () => { const m = new THREE.Mesh(cyl(0.03, 1, 8), dropMat); m.userData = { tone: 0.4 }; root.add(m); return m; };
  const N_DROP = 70;
  const dropsR = Array.from({ length: N_DROP }, (_, k) => ({ m: mkDrop(), u: rnd(k), z: -1.9 + 3.8 * rnd(k + 500), ph: rnd(k + 900) }));
  const dropsC = Array.from({ length: 50 }, (_, k) => ({ m: mkDrop(), u: rnd(k + 2000), z: -1.9 + 3.8 * rnd(k + 2500), ph: rnd(k + 2900) }));
  const inCar = (dx, y, z) => Math.abs(dx) < 2.15 && y < 1.75 && Math.abs(z) < 0.95;
  // the vector sum, tip to tail
  const gS = asm('rainSum', root, { title: 'Adding the velocities', sub: 'v_RC = v_RG + v_GC, tip to tail' });
  const TRI = V(CB + CW + 2.9, HTOP - 0.2, 0);
  const sRG = arrow(gS, 'ink', { name: 'v_RG' }), sGC = arrow(gS, 'ink', { name: 'v_GC' }), sRC = arrow(gS, 'blue', { name: 'v_RC' });
  const vRG = V(0, M.V_RG[1] * RAIN_V, 0), vGC = V(M.V_GC[0] * RAIN_V, 0, 0);
  setArrow(sRG, TRI, vRG); setArrow(sGC, TRI.clone().add(vRG), vGC); setArrow(sRC, TRI, vRG.clone().add(vGC));
  // right-angle mark and the slant angle from vertical, shown when opened
  const corner = TRI.clone().add(vRG);
  const angMark = lines(gS, [corner.x - 0.25, corner.y, 0, corner.x - 0.25, corner.y + 0.25, 0, corner.x - 0.25, corner.y + 0.25, 0, corner.x, corner.y + 0.25, 0], '#6e6e74');
  const arcPts = []; const th = M.RAIN_ANGLE * Math.PI / 180;
  for (let i = 0; i < 16; i++) { const a = i / 16 * th, b = (i + 1) / 16 * th; arcPts.push(TRI.x - 0.7 * Math.sin(a), TRI.y - 0.7 * Math.cos(a), 0, TRI.x - 0.7 * Math.sin(b), TRI.y - 0.7 * Math.cos(b), 0); }
  const angArc = lines(gS, arcPts, '#6e6e74');
  label('vec', 'v<sub>RG</sub>', () => midOf(sRG, 0).add(V(0.45, 0, 0)));
  label('vec', 'v<sub>GC</sub>', () => midOf(sGC, 0).add(V(0, -0.35, 0)));
  label('vec blue', 'v<sub>RC</sub>', () => midOf(sRC, 0).add(V(-0.45, 0.3, 0)));
  label('mark', 'θ', () => gS.userData.explode > 0.3 ? V(TRI.x - 0.42, TRI.y - 1.05, 0) : null);

  // ---------- 1.8 a river, two boats ----------
  const RX = ST.river, RHW = M.RIVER.w * RIV.s / 2;     // the water spans z = ±RHW
  const XL = RX - 7, XR = RX + 5.5;
  const gW = asm('river', root, { title: 'The river', sub: 'the water moves; everything on it is carried along' });
  part(gW, box(XR - XL, 0.04, 2 * RHW, 0.01), { tone: 'lo', pal: 'base', pos: [RX, 0.02, 0], name: 'Water' });
  for (const sgn of [1, -1]) part(root, box(XR - XL, 0.12, 1.2, 0.02), { tone: 'mid', pal: 'paper', pos: [RX, 0.06, sgn * (RHW + 0.6)], name: 'Bank' });
  const floats = Array.from({ length: 30 }, (_, k) => {
    const m = part(gW, new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16), { tone: 'mid', pal: 'dark', name: 'Floating leaves' });
    return { m, u: rnd(k + 4000), z: (-0.92 + 1.84 * rnd(k + 4400)) * RHW };
  });
  const boatModel = (parent) => {
    const g = new THREE.Group(); parent.add(g);
    part(g, box(0.62, 0.16, 0.3, 0.05), { tone: 'hi', pos: [-0.06, 0.12, 0], name: 'Boat' });
    const bow = part(g, new THREE.CylinderGeometry(0.15, 0.15, 0.16, 3, 1, false), { tone: 'hi', pos: [0.33, 0.12, 0], name: 'Boat' });
    bow.scale.set(1, 1, 1.4); bow.rotation.y = Math.PI / 2;   // one corner of the prism points forward
    return g;
  };
  const boats = [['boatA', 0, RX - 1.4, 'Aimed straight across', 'fastest crossing, but carried downstream'], ['boatB', M.AIM_UP, RX - 5.2, `Aimed ${(M.AIM_UP * 180 / Math.PI).toFixed(1)}° upstream`, 'slower, but lands straight across']].map(([key, phi, x0, title, sub]) => {
    const g = asm(key, root, { title, sub });
    const hull = boatModel(g);
    const bw = arrow(g, 'ink', { r: 0.028, head: 0.14, headR: 0.075, name: 'v_BW: boat relative to water' });
    const ws = arrow(g, 'dark', { r: 0.022, head: 0.12, headR: 0.06, name: 'v_WS: water relative to shore', tone: 'mid' });
    const bs = arrow(g, 'blue', { r: 0.028, head: 0.14, headR: 0.075, name: 'v_BS: boat relative to shore' });
    const path = dynLines(root, 1, '#8a8a8f');
    const start = V(x0, 0.1, RHW);
    lines(root, [x0, 0.05, RHW, x0, 0.05, -RHW], '#c9c9cc');   // straight across, for reference
    // labels beside the triangle: v_BW on the upstream side of its tip, v_WS beyond its middle, v_BS on the downstream side of its tip
    label('vec', 'v<sub>BW</sub>', () => tipOf(bw, 0) && tipOf(bw, 0).add(V(-0.42, 0, 0)));
    label('vec grey', 'v<sub>WS</sub>', () => ws.visible ? ws.localToWorld(V(0, ws.userData.arrow.shaft.scale.y * 0.5, 0)).add(V(0, 0, -0.32)) : null);
    label('vec blue', 'v<sub>BS</sub>', () => tipOf(bs, 0) && tipOf(bs, 0).add(V(0.42, 0, 0.1)));
    // the breakdown frames the whole crossing, so the path and the landing show even after it arrives
    g.userData.focus = () => ({ target: [x0 + M.drift(phi) * RIV.s / 2, 0.2, 0], radius: 3.4 });
    return { key, phi, g, hull, bw, ws, bs, path, start };
  });
  label('tick', 'straight across ↑', () => V(boats[0].start.x - 0.12, 0.05, RHW + 0.75));
  label('tick', `aimed ${(M.AIM_UP * 180 / Math.PI).toFixed(0)}° upstream ↑`, () => V(boats[1].start.x - 0.12, 0.05, RHW + 0.75));
  label('tick', `current ${M.RIVER.vw.toFixed(1)} m/s →`, () => V(XR - 0.3, 0.05, RHW - 0.35));

  // ---------- 1.9 a car pulling away: a = a0 − kt ----------
  const PX = ST.pull, S = PULLS.s;
  road(PX - 0.8, PX + 46 * S, -0.45, 0.45);
  const marks = [];
  for (let d = 0; d <= 45; d += 5) marks.push(PX + d * S, 0.025, -0.45, PX + d * S, 0.025, d % 10 ? -0.25 : 0.45);
  lines(root, marks, '#8a8a8f');
  for (let d = 0; d <= 40; d += 10) label('tick', d ? `${d} m` : '0', () => V(PX + d * S + 0.06, 0.03, 0.75));
  const gP = asm('pull', root, { title: 'A car pulling away', sub: 'its acceleration fades: a = a₀ − kt' });
  const carP = carModel(gP, 'Car'); carP.scale.setScalar(S);
  const pV = arrow(gP, 'ink', { r: 0.02, head: 0.1, headR: 0.05, name: 'Velocity' });
  const gPA = asm('pullA', root, { title: 'Its acceleration', sub: 'shrinking by k = 1.5 m/s² every second' });
  const pA = arrow(gPA, 'red', { r: 0.02, head: 0.1, headR: 0.05, name: 'Acceleration' });
  const ghostBox = (w, h, d) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: '#bdbdc2' })); l.userData = { noEdge: true }; root.add(l); return l; };
  const pGhosts = Array.from({ length: Math.round(M.PULL.run / 0.5) + 1 }, () => ghostBox(4.2 * S, 1.7 * S, 1.8 * S));
  label('vec', 'v', () => tipOf(pV, 0.12)); label('vec red', 'a', () => tipOf(pA, 0.12));

  // ---------- 1.10 x(t) = At³ − Bt on a number line ----------
  const CX = ST.cube;
  const gL = asm('cubeLine', root, { title: 'The number line', sub: 'position x, displacement and distance' });
  part(gL, xAxis(cyl(0.014, 6.8, 12)), { tone: 'hi', pal: 'ink', pos: [CX, 0.02, 0], name: 'Axis' });
  part(gL, xAxis(new THREE.ConeGeometry(0.05, 0.16, 20)), { tone: 'hi', pal: 'ink', pos: [CX + 3.48, 0.02, 0], name: 'Axis' });
  const lt = []; for (let q = -6; q <= 6; q++) lt.push(CX + q * 0.5, 0.02, 0, CX + q * 0.5, 0.02, q % 2 ? 0.08 : 0.16);
  lines(gL, lt, '#6e6e74');
  for (let q = -3; q <= 3; q++) label('tick', q ? `${q < 0 ? '−' : ''}${Math.abs(q)} m` : '0', () => V(CX + q + 0.1, 0.02, 0.42));
  label('axis', '<i>x</i>', () => V(CX + 3.75, 0.05, 0.12));
  const gB = asm('bead', root, { title: 'The particle', sub: 'x(t) = t³ − 3t' });
  part(gB, new THREE.SphereGeometry(0.15, 40, 28), { tone: 'hi', name: 'Particle' });
  const cV = arrow(root, 'ink', { r: 0.024, head: 0.12, headR: 0.06, name: 'Velocity' });
  const cA = arrow(root, 'red', { r: 0.024, head: 0.12, headR: 0.06, name: 'Acceleration' });
  const cGhosts = Array.from({ length: Math.round(M.CUBE.run / 0.2) + 1 }, () => { const g = new THREE.Mesh(new THREE.SphereGeometry(0.147, 28, 18), shadeMat('paper', { opacity: 0.5 })); g.userData = { tone: 0.2, ghost: true }; root.add(g); return g; });
  const dispL = arrow(gL, 'ink', { r: 0.016, head: 0.1, headR: 0.045, name: 'Displacement', tone: 'hi' });
  label('vec', 'v', () => tipOf(cV, 0.14)); label('vec red', 'a', () => tipOf(cA, 0.14));
  label('mark', `turns at t = ${M.T_TURN.toFixed(2)} s`, () => V(CX + M.cx(M.T_TURN), 0.62, -0.4));

  // ---------- per-frame ----------
  function update2(s) {
    // rain: the car loops along the road window; the rain field is the same in both views
    const tr = s.rain, xc = RA + 2.1 + mod(M.RAIN.vc * tr, RW - 4.2);
    carR.position.set(xc, 0, 0);
    setArrow(vCG, V(xc + 2.2, 0.75, 0), V(M.V_CG[0] * RAIN_V, 0, 0));
    setArrow(vRGa, V(RA + 0.6, HTOP - 0.2, -2.2), vRG);
    const yOf = d => HTOP - M.RAIN.vr * mod(tr + d.ph * TF, TF);
    const place = (m, x, y, z, dir, len) => { m.position.set(x, y, z); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir); m.scale.set(1, len, 1); };
    const up = V(0, 1, 0), slant = V(-M.V_RC[0], -M.V_RC[1], 0).normalize();
    for (const d of dropsR) {
      const x = RA + d.u * RW, y = yOf(d);
      d.m.visible = !inCar(x - xc, y, d.z);
      place(d.m, x, y + M.RAIN.vr * EXPO / 2, d.z, up, M.RAIN.vr * EXPO);
    }
    // from the car, each drop's position is (its ground x − the car's x): it slides back as it falls
    const carX = CB + CW / 2;
    for (const d of dropsC) {
      const x = CB + mod(d.u * CW - M.RAIN.vc * (tr + d.ph * TF), CW), y = yOf(d);
      const L = M.vlen(M.V_RC) * EXPO;
      d.m.visible = !inCar(x - carX, y, d.z) && x + slant.x * L > CB;
      place(d.m, x + slant.x * L / 2, y + slant.y * L / 2, d.z, slant, L);
    }
    setArrow(vRCa, V(CB + CW - 0.3, HTOP - 0.4, -2.2), V(M.V_RC[0] * RAIN_V, M.V_RC[1] * RAIN_V, 0));
    setArrow(vGCa, V(CB + CW - 0.6, 0.06, 2.4), V(M.V_GC[0] * RAIN_V, 0, 0));
    const dc = []; for (let k = 0; k < 5; k++) { const a0 = CB - 1 + mod(k * 2 + 0.5 - M.RAIN.vc * tr, 10), b = Math.min(a0 + 1, CB + CW), a = Math.min(Math.max(a0, CB), b); dc.push(V(a, 0.025, 0), V(Math.max(a, b), 0.025, 0)); }
    setLine2(dashCar, dc);
    const ex = gS.userData.explode;
    angMark.visible = angArc.visible = ex > 0.05;

    // river
    const { t: tw, resting: rw } = s.river;
    for (const f of floats) f.m.position.set(XL + mod(f.u * (XR - XL) + M.RIVER.vw * RIV.s * tw, XR - XL), 0.05, f.z);
    for (const b of boats) {
      const [dx, dy] = M.boatPos(b.phi, tw), moving = !rw && tw < M.crossTime(b.phi);
      const p = b.start.clone().add(V(dx * RIV.s, 0, -dy * RIV.s));
      b.hull.position.copy(p); b.hull.rotation.y = Math.PI / 2 + b.phi;
      const pa = p.clone().setY(0.4), bw = M.vBW(b.phi), vbw = V(bw[0] * RIV.v, 0, -bw[1] * RIV.v), vws = V(M.V_WS[0] * RIV.v, 0, 0);
      setArrow(b.bw, pa, vbw, moving ? 1 : 0); setArrow(b.ws, pa.clone().add(vbw), vws, moving ? 1 : 0); setArrow(b.bs, pa, vbw.clone().add(vws), moving ? 1 : 0);
      setLine2(b.path, [b.start.clone().setY(0.06), p.clone().setY(0.06)]);
    }

    // pull
    const tp = s.pull.t, xp = PX + M.px(tp) * S;
    carP.position.set(xp, 0.02, 0);
    setArrow(pV, V(xp + 2.15 * S, 0.75 * S + 0.02, 0), V(M.pv(tp) * PULLS.v, 0, 0));
    setArrow(pA, V(xp - 0.2, 1.75 * S + 0.22, 0), V(M.pa(tp) * PULLS.a, 0, 0));
    pGhosts.forEach((g, k) => { const tk = k * 0.5; g.visible = tk <= tp + 1e-6 && tk > 0; g.position.set(PX + M.px(tk) * S, 0.02 + 0.85 * S, 0); });

    // cubic
    const tc = s.cube.t, xq = CX + M.cx(tc);
    gB.position.set(xq, 0.17, 0); gB.children.forEach(m => m.position.set(0, 0, 0));
    setArrow(cV, V(xq + Math.sign(M.cv(tc)) * 0.15, 0.17, 0), V(M.cv(tc) * CUBES.v, 0, 0));
    setArrow(cA, V(xq, 0.62, 0), V(M.ca(tc) * CUBES.a, 0, 0));
    cGhosts.forEach((g, k) => { const tk = k * 0.2; g.visible = tk <= tc + 1e-6; g.position.set(CX + M.cx(tk), 0.17, tk < M.T_TURN - 1e-9 ? -0.42 : tk > M.T_TURN + 1e-9 ? 0.42 : 0); });
    setArrow(dispL, V(CX, 0.04, 0.85), V(M.cx(tc), 0, 0), gL.userData.explode);
  }
  return { update2, labels2: labels };
}
