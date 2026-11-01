// The figure: thirteen simple scenes in a row along x, one per page. A ball on a string, a car on a
// curve, a coaster cart in a loop, a spinning disc, two spheres, satellites and launches: only the
// moving thing, its path and its vectors. Metres, y up. Black arrows are forces (and other
// individual vectors), the red arrow is the net force or the acceleration, blue is velocity.
import * as THREE from 'three';
import { part, box, cyl, lines, arrow, setArrow, shadeMat, PALETTE, V } from '../engine/parts.js';
import * as M from './model.js';

// velocity gets its own hue: it is what circular motion is about (always ⟂ to the red arrow)
PALETTE.blue = ['#a9c3e2', '#5b88c0', '#3f6896'];
// potential energy bars need one more (kinetic bars are blue, as in chapter 5)
PALETTE.amber = ['#f3d68e', '#e4b552', '#bf9030'];

export const STATIONS = { whirl: 0, double: 9, flatcar: 22, cone: 36, loop: 46, bank: 60, disc: 76, gravity: 86, orbit: 104, kepler: 128, orbitE: 154, well: 178, escape: 206 };
// real-size scenes (ball, cone, disc)
export const V_SCALE = 0.2;        // arrow metres per m/s
export const A_SCALE = 0.06;       // arrow metres per m/s²
export const F_SCALE = 0.15;       // arrow metres per newton
// cars and the coaster are drawn smaller than life; their arrows have their own scales
export const ROAD = { draw: 0.25, kN: 0.1, v: 0.08 };       // 1:4; per kN; per m/s
export const COASTER = { draw: 0.2, kN: 0.035, v: 0.04 };   // 1:5
export const SPACE = { draw: 1 / 4e6, uN: 0.004, a: 3e6 };  // spheres: per μN; per m/s² (×10⁻⁶ shown)
export const ORBIT = { draw: 1 / 4e6, v: 0.4, a: 0.8, kN: 1.0, GJ: 0.1 };    // orbits: 1 m per 4000 km; per km/s; per m/s²; per kN; bars per GJ
export const WELLS = { GJ: 0.1, kN: 0.2 };                  // the U(r) graph: 10 cm per GJ down; force 20 cm per kN

const f1 = x => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(1);
const SIZE = { s: { r: 0.011, head: 0.07, headR: 0.032 }, m: { r: 0.018, head: 0.1, headR: 0.046 }, l: { r: 0.028, head: 0.16, headR: 0.07 } };

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at, text) => labels.push({ cls, html, at, text });

  // ---------- helpers ----------
  const vec = (g, pal = 'ink', size = 's') => arrow(g, pal, { ...SIZE[size], name: pal === 'blue' ? 'Velocity' : pal === 'dark' ? 'Components' : 'Forces', tone: pal === 'dark' ? 'mid' : 'hi' });
  const tip = (a, pad = 0.06) => {
    if (!a.visible) return null;
    const { tip: t, head } = a.userData.arrow;
    return a.localToWorld(V(0, t.position.y + t.scale.y * head / 2 + pad, 0));
  };
  const dyn = (parent, n, { color = '#8a8a8f', dash = 0 } = {}) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const mat = dash ? new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: dash * 0.8 }) : new THREE.LineBasicMaterial({ color });
    const l = new THREE.Line(g, mat); l.userData = { noEdge: true }; l.frustumCulled = false; parent.add(l);
    l.set = pts => {
      const a = g.attributes.position.array;
      for (let i = 0; i < n; i++) { const p = pts[Math.min(i, pts.length - 1)]; a[3 * i] = p.x; a[3 * i + 1] = p.y; a[3 * i + 2] = p.z; }
      g.attributes.position.needsUpdate = true; if (dash) l.computeLineDistances();
    };
    return l;
  };
  // points on a horizontal circle (counter-clockwise from above: (cos φ, −sin φ))
  const arcPts = (c, r, a0, a1, n = 64) => Array.from({ length: n }, (_, i) => { const p = a0 + (a1 - a0) * i / (n - 1); return V(c.x + r * Math.cos(p), c.y, c.z - r * Math.sin(p)); });
  const circle = (c, r, opt) => { const n = 129, l = dyn(root, n, opt); l.set(arcPts(c, r, 0, 2 * Math.PI, n)); return l; };
  const seg = (parent, opt) => { const l = dyn(parent, 2, opt); return l; };
  const ball = (g, r, name = 'Ball', pal = 'paper') => part(g, new THREE.SphereGeometry(r, 32, 20), { tone: 'hi', name, pal });
  const thin = (g, r = 0.006) => part(g, new THREE.CylinderGeometry(r, r, 1, 8), { tone: 'hi', pal: 'ink', name: 'String' });
  const stringTo = (m, a, b) => { m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, a.distanceTo(b), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); };
  const orient = (obj, f, up) => obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f, up, f.clone().cross(up).normalize()));
  const shrink = (mesh, g, s = 1) => mesh.scale.setScalar(s * (1 - 0.85 * Math.max(g.userData.explode, 0)));
  const ex = g => Math.max(g.userData.explode, 0);
  const ghostMat = shadeMat('paper', { opacity: 0.45 });
  const table = (x, w, d) => part(root, box(w, 0.04, d, 0.01), { tone: 'lo', pal: 'board', pos: [x, 0.02, 0], name: 'Table' });

  // faint graph-paper ground under the earthbound scenes
  const grid = [];
  for (let x = -4; x <= STATIONS.disc + 4; x++) grid.push(x, 0.001, -6, x, 0.001, 6);
  for (let z = -6; z <= 6; z++) grid.push(-4, 0.001, z, STATIONS.disc + 4, 0.001, z);
  lines(root, grid, '#e6e6e2');

  // a car, after the one in chapter 2: 4.2 m long, local +x forward, wheels on y = 0
  const car = parent => {
    const c = new THREE.Group(); parent.add(c);
    part(c, box(4.2, 0.7, 1.8, 0.18), { tone: 'hi', pos: [0, 0.75, 0], name: 'Body' });
    part(c, box(2.2, 0.6, 1.6, 0.2), { tone: 'hi', pos: [-0.3, 1.38, 0], name: 'Cabin' });
    for (const [x, z] of [[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]]) {
      part(c, new THREE.CylinderGeometry(0.36, 0.36, 0.26, 28).rotateX(Math.PI / 2), { tone: 'mid', pal: 'dark', pos: [x, 0.36, z], name: 'Wheels' });
    }
    return c;
  };
  const flatRing = (c, ri, ro, y) => part(root, new THREE.RingGeometry(ri, ro, 128).rotateX(-Math.PI / 2), { tone: 'lo', pal: 'board', pos: [c.x, y, c.z], name: 'Road' });

  // ---------- 1 · a ball whirled on a string over a smooth table ----------
  const X0 = STATIONS.whirl, TY = 0.04, BR = 0.07, BY = TY + BR;
  table(X0, 2.3, 2.3);
  part(root, cyl(0.022, 0.16, 16), { tone: 'hi', pal: 'ink', pos: [X0, TY + 0.08, 0], name: 'Pin' });
  circle(V(X0, TY + 0.003, 0), M.BALL.r, { dash: 0.05, color: '#a0a0a6' });
  const gW = asm('whirl', root, { title: 'A ball on a string', sub: 'speed constant, direction always changing' });
  const bW = ball(gW, BR), sW = thin(gW);
  const vW = vec(gW, 'blue'), aW = vec(gW, 'red');
  const ghostsW = Array.from({ length: 7 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(BR, 24, 14), ghostMat); m.userData = { tone: 0.2 }; root.add(m); return m; });
  // the Δv construction: v₀ (50° earlier) and v_f drawn tail-to-tail at the centre
  const v0W = vec(gW, 'blue'), v0C = vec(gW, 'blue'), vfC = vec(gW, 'blue'), dvC = vec(gW, 'red');
  const ghost0 = new THREE.Mesh(new THREE.SphereGeometry(BR, 24, 14), ghostMat); ghost0.userData = { tone: 0.4 }; gW.add(ghost0);
  label('vec blue', 'v', () => tip(vW)); label('vec red', 'a', () => tip(aW));
  label('vec blue', 'v<sub>0</sub>', () => tip(v0C, 0.05)); label('vec blue', 'v<sub>f</sub>', () => tip(vfC, 0.05)); label('vec red', 'Δv', () => dvC.visible ? dvC.localToWorld(V(0.07, dvC.userData.arrow.shaft.scale.y / 2, 0)) : null);
  label('vec blue', 'v<sub>0</sub>', () => tip(v0W));
  label('axis', 'r', () => { const p = M.uniform(M.BALL.r, M.V1, wClock); return V(X0 + p.x * 0.5, BY + 0.09, p.z * 0.5); });
  let wClock = 0;

  // ---------- 2 · the same string, twice the speed ----------
  const X1 = STATIONS.double, DX = 1.05;
  table(X1, 4.3, 2.1);
  const gD = asm('double', root, { title: 'Twice the speed', sub: 'four times the pull' });
  const D = [M.V1, M.V2].map((v, k) => {
    const c = V(X1 + (k ? DX : -DX), BY, 0);
    part(root, cyl(0.022, 0.16, 16), { tone: 'hi', pal: 'ink', pos: [c.x, TY + 0.08, 0], name: 'Pin' });
    circle(V(c.x, TY + 0.003, 0), M.BALL.r, { dash: 0.05, color: '#a0a0a6' });
    const o = { v, c, b: ball(gD, BR, k ? 'Fast ball' : 'Slow ball'), s: thin(gD), vA: vec(gD, 'blue'), T: vec(gD), N: vec(gD), W: vec(gD), net: vec(gD, 'red') };
    label('vec blue', 'v', () => tip(o.vA)); label('vec', 'T', () => tip(o.T)); label('vec red', 'ΣF', () => tip(o.net));
    label('vec', 'F<sub>N</sub>', () => tip(o.N)); label('vec', '<i>mg</i>', () => tip(o.W));
    label('tick', `${v.toFixed(1)} m/s`, () => V(c.x + 0.28, TY, M.BALL.r + 0.32));
    return o;
  });

  // ---------- 3 · a car on a flat curve ----------
  const X2 = STATIONS.flatcar, RC = M.CAR.r * ROAD.draw, C2 = V(X2, 0, 0);
  flatRing(C2, RC - 0.7, RC + 0.7, 0.012);
  circle(V(X2, 0.03, 0), RC, { dash: 0.18, color: '#9a9aa0' });
  part(root, cyl(0.05, 0.02, 20), { tone: 'hi', pal: 'ink', pos: [X2, 0.01, 0], name: 'Centre' });
  const gC = asm('flatcar', root, { title: 'Car on a flat curve', sub: 'static friction pulls it round' });
  const carC = car(gC), radC = seg(root, { dash: 0.1 }), tanC = seg(gC, { dash: 0.12, color: '#6e6e74' });
  const cW = vec(gC, 'ink', 'm'), cN = vec(gC, 'ink', 'm'), cF = vec(gC, 'ink', 'm'), cNet = vec(gC, 'red', 'm'), cV = vec(gC, 'blue', 'm');
  label('vec', 'F<sub>g</sub>', () => tip(cW)); label('vec', 'F<sub>N</sub>', () => tip(cN)); label('vec', 'f<sub>s</sub>', () => tip(cF)); label('vec red', 'ΣF', () => tip(cNet)); label('vec blue', 'v', () => tip(cV));
  label('axis', 'r', () => radC.visible ? V(X2 + 0.1, 0.12, 0.25) : null);

  // ---------- 4 · a ball on a string swept round a cone ----------
  const X3 = STATIONS.cone, CEIL = 2.0, P3 = V(X3, CEIL - 0.03, 0), YC = P3.y - M.CONE.L * Math.cos(M.CONE.th);
  part(root, box(1.4, 0.06, 0.7, 0.02), { tone: 'mid', pal: 'board', pos: [X3, CEIL, 0], name: 'Ceiling' });
  circle(V(X3, YC, 0), M.CONE.r, { dash: 0.04, color: '#a0a0a6' });
  const axis3 = seg(root, { dash: 0.04 }); axis3.set([P3, V(X3, YC - 0.05, 0)]);
  const gK = asm('cone', root, { title: 'A ball swung in a cone', sub: 'the string’s pull, split in two' });
  const bK = ball(gK, 0.06), sK = thin(gK), radK = seg(gK, { dash: 0.035 });
  const kT = vec(gK), kW = vec(gK), kNet = vec(gK, 'red'), kV = vec(gK, 'blue'), kTx = vec(gK, 'dark'), kTy = vec(gK, 'dark');
  label('vec', 'T', () => tip(kT)); label('vec', '<i>mg</i>', () => tip(kW)); label('vec red', 'ΣF', () => tip(kNet)); label('vec blue', 'v', () => tip(kV));
  label('vec', 'T sin θ', () => tip(kTx, 0.1)); label('vec', 'T cos θ', () => tip(kTy));
  let kAt = V();
  label('axis', 'θ', () => P3.clone().add(kAt.clone().sub(P3).normalize().add(V(0, -1, 0)).normalize().multiplyScalar(0.3)));

  // ---------- 5 · a coaster cart in a vertical loop ----------
  const X4 = STATIONS.loop, RL = M.LOOP.r * COASTER.draw, RAIL = 0.022, C4 = V(X4, 0.05 + RAIL + RL, 0), CH = 0.14;
  for (const z of [-0.09, 0.09]) {
    part(root, new THREE.TorusGeometry(RL + RAIL, RAIL, 10, 160), { tone: 'mid', pal: 'dark', pos: [X4, C4.y, z], name: 'Track' });
    part(root, cyl(RAIL, 5.4, 10).rotateZ(Math.PI / 2), { tone: 'mid', pal: 'dark', pos: [X4, 0.05, z * 1.0 + (z > 0 ? 0.24 : -0.24)], name: 'Track' });
  }
  const gL = asm('loop', root, { title: 'Coaster in a loop', sub: 'the track pushes hardest at the bottom' });
  const cart = part(gL, box(0.36, CH, 0.24, 0.04), { tone: 'hi', name: 'Cart' });
  const lN = vec(gL, 'ink', 'm'), lW = vec(gL, 'ink', 'm'), lNet = vec(gL, 'red', 'm'), lV = vec(gL, 'blue', 'm');
  label('vec', 'F<sub>N</sub>', () => tip(lN)); label('vec', '<i>mg</i>', () => tip(lW)); label('vec red', 'ΣF', () => tip(lNet)); label('vec blue', 'v', () => tip(lV));
  // opened: free-body diagrams at the top and the bottom, beside the loop
  const fbd = [Math.PI, 0].map(phi => {
    const at = V(phi ? X4 + RL + 0.7 : X4 + RL + 1.4, phi ? C4.y + 0.45 : C4.y - 0.75, 0);
    const dot = ball(gL, 0.045, phi ? 'Top' : 'Bottom', 'ink'); dot.position.copy(at);
    const o = { phi, at, dot, N: vec(gL, 'ink', 'm'), W: vec(gL, 'ink', 'm'), net: vec(gL, 'red', 'm') };
    const sh = (a, dx) => () => o.N.visible ? tip(a).add(V(phi ? dx : 0, 0, 0)) : null;
    label('vec', 'F<sub>N</sub>', sh(o.N, -0.1)); label('vec', '<i>mg</i>', sh(o.W, 0.1)); label('vec red', 'ΣF', () => tip(o.net));
    label('board', phi ? 'top' : 'bottom', () => dot.visible ? at.clone().add(phi ? V(-0.1, 0.22, 0) : V(0.25, 0, 0)) : null);
    return o;
  });

  // ---------- 6 · a car on a banked curve, no friction ----------
  const X5 = STATIONS.bank, RB = M.BANK.r * ROAD.draw, TH = M.BANK.th, RI = RB - 0.7, RO = RB + 0.7, H0 = 0.03;
  const yAt = r => H0 + (r - RI) * Math.tan(TH);
  part(root, new THREE.LatheGeometry([new THREE.Vector2(RO, yAt(RO)), new THREE.Vector2(RI, H0)], 160), { tone: 'lo', pal: 'board', pos: [X5, 0, 0], name: 'Road' });
  part(root, new THREE.CylinderGeometry(RO, RO, yAt(RO), 160, 1, true), { tone: 'lo', pal: 'board', pos: [X5, yAt(RO) / 2, 0], name: 'Road' });
  circle(V(X5, yAt(RB) + 0.004, 0), RB, { dash: 0.18, color: '#9a9aa0' });
  part(root, cyl(0.05, 0.02, 20), { tone: 'hi', pal: 'ink', pos: [X5, 0.01, 0], name: 'Centre' });
  const axis5 = seg(root, { dash: 0.1 }); axis5.set([V(X5, 0, 0), V(X5, yAt(RB), 0)]);
  const gB = asm('bank', root, { title: 'Car on a banked curve', sub: 'the road’s push, tilted inward' });
  const carB = car(gB), radB = seg(root, { dash: 0.1 });
  const qW = vec(gB, 'ink', 'm'), qN = vec(gB, 'ink', 'm'), qNet = vec(gB, 'red', 'm'), qV = vec(gB, 'blue', 'm'), qNx = vec(gB, 'dark', 'm'), qNy = vec(gB, 'dark', 'm');
  label('vec', 'F<sub>g</sub>', () => tip(qW)); label('vec', 'F<sub>N</sub>', () => tip(qN)); label('vec red', 'ΣF', () => tip(qNet)); label('vec blue', 'v', () => tip(qV));
  label('vec', 'F<sub>N</sub> sin θ', () => tip(qNx, 0.14)); label('vec', 'F<sub>N</sub> cos θ', () => tip(qNy));

  // ---------- 7 · a spinning disc ----------
  const X6 = STATIONS.disc, DT = 0.06;
  const gS = asm('disc', root, { title: 'A spinning disc', sub: 'one ω, many speeds' });
  const disc = new THREE.Group(); disc.position.set(X6, 0, 0); gS.add(disc);
  part(disc, cyl(M.DISC.R, DT, 96), { tone: 'mid', pal: 'board', pos: [0, DT / 2 + 0.005, 0], name: 'Disc' });
  part(disc, box(M.DISC.R - 0.04, 0.006, 0.025, 0.002), { tone: 'hi', pal: 'ink', pos: [(M.DISC.R - 0.04) / 2, DT + 0.008, 0], name: 'Marked radius' });
  part(disc, cyl(0.035, 0.05, 20), { tone: 'hi', pal: 'ink', pos: [0, DT + 0.025, 0], name: 'Axle' });
  const BS = 0.11;
  const blk = [M.DISC.r1, M.DISC.r2].map(r => part(disc, box(BS, BS, BS, 0.015), { tone: 'hi', pos: [r, DT + BS / 2 + 0.006, 0], name: 'Blocks' }));
  for (const r of [M.DISC.r1, M.DISC.r2]) circle(V(X6, DT + 0.012, 0), r, { dash: 0.04, color: '#a0a0a6' });
  const sV = [vec(gS, 'blue'), vec(gS, 'blue')];
  const arcs = [dyn(gS, 48, { color: '#26262a' }), dyn(gS, 48, { color: '#26262a' })], back = seg(gS, { dash: 0.04, color: '#6e6e74' });
  label('vec blue', 'v<sub>1</sub>', () => tip(sV[0])); label('vec blue', 'v<sub>2</sub>', () => tip(sV[1]));
  let dPhi = 0;
  const arcMid = (r, k) => () => arcs[k].visible ? V(X6 + (r + 0.12) * Math.cos(dPhi - 0.5), DT + 0.02, -(r + 0.12) * Math.sin(dPhi - 0.5)) : null;
  label('vec', 's<sub>1</sub>', arcMid(M.DISC.r1, 0)); label('vec', 's<sub>2</sub>', arcMid(M.DISC.r2, 1));
  label('tick', '1 rad', () => arcs[0].visible ? V(X6 + 0.3 * Math.cos(dPhi - 0.5), DT + 0.02, -0.3 * Math.sin(dPhi - 0.5)) : null);

  // ---------- 8 · two spheres pulling on each other ----------
  const X7 = STATIONS.gravity, GY = 0.9, R1 = M.radiusOf(M.SPHERES.m1), R2 = M.radiusOf(M.SPHERES.m2);
  const gG = asm('gravity', root, { title: 'Two iron spheres', sub: 'every mass pulls on every other' });
  const s1 = ball(gG, R1, 'm₁ · 1000 kg'), s2 = ball(gG, R2, 'm₂ · 2000 kg');
  const F12 = vec(gG, 'ink', 'm'), F21 = vec(gG, 'ink', 'm'), A1 = vec(gG, 'red', 'm'), A2 = vec(gG, 'red', 'm'), rG = seg(root, { dash: 0.06 });
  label('vec', 'F<sub>12</sub>', () => F12.visible ? tip(F12, 0).add(V(-0.16, 0.14, 0)) : null); label('vec', 'F<sub>21</sub>', () => F21.visible ? tip(F21, 0).add(V(0.16, 0.14, 0)) : null);
  label('vec red', 'a<sub>1</sub>', () => tip(A1)); label('vec red', 'a<sub>2</sub>', () => tip(A2));
  label('board', 'm<sub>1</sub>', () => s1.position.clone().add(V(-R1 * 0.2, R1 + 0.16, 0)));
  label('board', 'm<sub>2</sub>', () => s2.position.clone().add(V(-R2 * 0.2, R2 + 0.16, 0)));
  label('axis', 'r', () => s1.position.clone().lerp(s2.position, 0.5).add(V(0.05, -0.12, 0)));

  // ---------- 9 · satellites in circular orbits ----------
  const X8 = STATIONS.orbit, OY = 1.8, RE = M.EARTH.R * ORBIT.draw, C8 = V(X8, OY, 0);
  const gO = asm('orbit', root, { title: 'Two satellites', sub: 'gravity is the centripetal force' });
  const earth = ball(gO, RE, 'Earth'); earth.position.copy(C8); earth.geometry = new THREE.SphereGeometry(RE, 64, 40);
  const eq = []; for (const lat of [-50, -25, 0, 25, 50]) { const y = RE * Math.sin(lat * Math.PI / 180), r = RE * Math.cos(lat * Math.PI / 180) * 1.002; for (let i = 0; i < 96; i++) { const a = i / 96 * 2 * Math.PI, b = (i + 1) / 96 * 2 * Math.PI; eq.push(r * Math.cos(a), y, r * Math.sin(a), r * Math.cos(b), y, r * Math.sin(b)); } }
  const grat = lines(gO, eq, '#c8c8cc'); grat.position.copy(C8);
  const RS = [M.SAT.r1, M.SAT.r2].map(r => r * ORBIT.draw);
  for (const r of RS) circle(C8, r, { dash: 0.12, color: '#a0a0a6' });
  const sat = RS.map((r, k) => {
    const g = new THREE.Group(); gO.add(g);
    part(g, box(0.16, 0.16, 0.16, 0.02), { tone: 'hi', name: 'Satellites' });
    part(g, box(0.06, 0.012, 0.62, 0.004), { tone: 'mid', pal: 'dark', name: 'Satellites' });
    return { g, r, R: [M.SAT.r1, M.SAT.r2][k], v: vec(gO, 'blue', 'l'), a: vec(gO, 'red', 'l'), arc: dyn(gO, 64, { color: '#26262a' }), r0: seg(gO, { dash: 0.1 }), r1: seg(gO, { dash: 0.1 }) };
  });
  sat.forEach((s, k) => { label('vec blue', `v<sub>${k + 1}</sub>`, () => tip(s.v, 0.12)); label('vec red', `a<sub>${k + 1}</sub>`, () => tip(s.a, 0.12)); });
  label('tick', '1 h', () => sat[0].arc.visible ? sat[0].mid : null); label('tick', '1 h', () => sat[1].arc.visible ? sat[1].mid : null);

  // ---------- shared by 10–13: the Earth, a satellite, the orbit plane (model x, y → world x, −z) ----------
  const DO = ORBIT.draw;
  const globe = (g, c) => {
    const e = ball(g, RE, 'Earth'); e.position.copy(c); e.geometry = new THREE.SphereGeometry(RE, 64, 40);
    const q = []; for (const lat of [-50, -25, 0, 25, 50]) { const y = RE * Math.sin(lat * Math.PI / 180), r = RE * Math.cos(lat * Math.PI / 180) * 1.002; for (let i = 0; i < 96; i++) { const a = i / 96 * 2 * Math.PI, b = (i + 1) / 96 * 2 * Math.PI; q.push(r * Math.cos(a), y, r * Math.sin(a), r * Math.cos(b), y, r * Math.sin(b)); } }
    lines(g, q, '#c8c8cc').position.copy(c);
    return e;
  };
  const satBody = (g, s = 1) => {
    const b = new THREE.Group(); g.add(b);
    part(b, box(0.16 * s, 0.16 * s, 0.16 * s, 0.02), { tone: 'hi', name: 'Satellite' });
    part(b, box(0.06 * s, 0.012 * s, 0.62 * s, 0.004), { tone: 'mid', pal: 'dark', name: 'Satellite' });
    return b;
  };
  const W = (c, p) => V(c.x + p.x * DO, c.y, c.z - p.y * DO);              // a model point (x, y) in the plane
  const Wv = p => V(p.vx, 0, -p.vy).normalize();                         // its direction of motion
  const pathOf = (c, tr, n = 400) => Array.from({ length: n }, (_, i) => { const s = tr.S[Math.round(i / (n - 1) * (tr.S.length - 1))]; return W(c, { x: s[0], y: s[1] }); });
  // a flat translucent wedge from the focus over a run of points (the area the radius sweeps)
  const fan = (parent, n, color, opacity) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 9), 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
    m.userData = { noEdge: true }; m.frustumCulled = false; parent.add(m);
    m.set = (c, pts) => {
      const a = g.attributes.position.array;
      for (let i = 0; i < n; i++) { const p = pts[Math.min(i, pts.length - 2)], q = pts[Math.min(i + 1, pts.length - 1)]; a.set([c.x, c.y, c.z, p.x, p.y, p.z, q.x, q.y, q.z], 9 * i); }
      g.attributes.position.needsUpdate = true;
    };
    return m;
  };
  const wedgePts = (c, t0, t1, n) => Array.from({ length: n + 1 }, (_, i) => W(c, M.ELL.track.at(t0 + (t1 - t0) * i / n)));
  const centroid = pts => pts.reduce((s, p) => s.add(p), V()).multiplyScalar(1 / pts.length);

  // ---------- 10 · an elliptical orbit: equal areas in equal times ----------
  const X9 = STATIONS.kepler, OY9 = 1.8, cE = M.ELL.a * M.ELL.e * DO, F9 = V(X9 + cE, OY9, 0);
  const gE = asm('kepler', root, { title: 'An elliptical orbit', sub: 'equal areas in equal times' });
  gE.userData.focus = () => ({ target: [X9, OY9, 0], radius: 6.6 });
  globe(gE, F9);
  dyn(root, 400, { dash: 0.12, color: '#a0a0a6' }).set(pathOf(F9, M.ELL.track));
  seg(root, { dash: 0.1, color: '#b4b4b8' }).set([V(X9 - M.ELL.a * DO, OY9, 0), V(X9 + M.ELL.a * DO, OY9, 0)]);
  const satE = satBody(gE), vE = vec(gE, 'blue', 'l'), rE = seg(gE, { dash: 0.1 });
  const sweepE = fan(gE, 48, '#5b88c0', 0.28);
  const WP = wedgePts(F9, -M.SWEEP / 2, M.SWEEP / 2, 48), WA = wedgePts(F9, M.ELL.T / 2 - M.SWEEP / 2, M.ELL.T / 2 + M.SWEEP / 2, 48);
  fan(root, 48, '#86868c', 0.16).set(F9, WP); fan(root, 48, '#86868c', 0.16).set(F9, WA);
  label('tick', '1 h', () => centroid([F9, ...WP]).add(V(0.25, 0, 0))); label('tick', '1 h', () => centroid([F9, ...WA]).add(V(-0.3, 0, 0.0)));
  label('board', 'perigee', () => V(X9 + M.ELL.a * DO + 0.2, OY9, 1.0)); label('board', 'apogee', () => V(X9 - M.ELL.a * DO - 0.2, OY9, -1.0));
  label('vec blue', 'v', () => tip(vE, 0.15));
  // opened: the satellite at perigee and at apogee, r and v at each
  const kp = [0, M.ELL.T / 2].map((t, k) => {
    const p = M.ELL.track.at(t), at = W(F9, p), o = { at, p, dot: ball(gE, 0.09, k ? 'At apogee' : 'At perigee', 'ink'), v: vec(gE, 'blue', 'l'), r: seg(gE, { color: '#26262a' }) };
    o.dot.position.copy(at); o.r.set([F9, at]);
    label('vec blue', `v<sub>${k ? 'a' : 'p'}</sub>`, () => tip(o.v, 0.15));
    label('vec', `r<sub>${k ? 'a' : 'p'}</sub>`, () => o.dot.visible ? F9.clone().lerp(at, k ? 0.62 : 0.72).add(V(0, 0, 0.35)) : null);
    return o;
  });

  // ---------- 11 · the same orbit: kinetic and potential energy trade ----------
  const X10 = STATIONS.orbitE, OY10 = 2.6, F10 = V(X10 + cE, OY10, 0);
  const gN = asm('orbitE', root, { title: 'Energy round the orbit', sub: 'kinetic and potential trade' });
  // opened: frame the satellite (its split force) together with the bars
  gN.userData.focus = () => { const b = V(X10 - 2.3, OY10 - 0.6, 0), c = satN.position.clone().lerp(b, 0.5); return { target: c.toArray(), radius: Math.max(3, c.distanceTo(b) + 1.6) }; };
  globe(gN, F10);
  dyn(root, 400, { dash: 0.12, color: '#a0a0a6' }).set(pathOf(F10, M.ELL.track));
  const satN = satBody(gN), vN = vec(gN, 'blue', 'l'), fN = vec(gN, 'red', 'l'), fPar = vec(gN, 'dark', 'm'), fPer = vec(gN, 'dark', 'm');
  label('vec blue', 'v', () => tip(vN, 0.15)); label('vec red', 'F<sub>g</sub>', () => tip(fN, 0.15));
  label('vec', 'F<sub>∥</sub>', () => tip(fPar, 0.15)); label('vec', 'F<sub>⊥</sub>', () => tip(fPer, 0.15));
  // energy bars: K up, U and E hang below zero
  const BW = 0.5, BG = 1.1, BX = X10 - 3.4, BZ = 0;   // inside the ellipse, between the Earth and apogee
  lines(root, [BX - BW, OY10, BZ, BX + 2 * BG + BW, OY10, BZ], '#6e6e74');
  const barsN = [['blue', 'K'], ['amber', 'U'], ['paper', 'E']].map(([pal, html], i) => {
    const bx = BX + i * BG, m = part(gN, new THREE.BoxGeometry(BW, 1, BW), { tone: 'hi', pal, name: 'Energy bars' });
    const o = { m, bx, val: 0 };
    label('vec', html, () => V(bx, OY10 + o.val * ORBIT.GJ / 1e9 + (o.val > 0 ? 0.4 : -0.5), BZ), () => `${html} <span style="font-size:14px">${f1(o.val / 1e9)} GJ</span>`);
    return o;
  });
  const setBars = vals => barsN.forEach((o, i) => { o.val = vals[i]; const h = vals[i] / 1e9 * ORBIT.GJ; o.m.scale.y = Math.max(Math.abs(h), 1e-3); o.m.position.set(o.bx, OY10 + h / 2, BZ); });

  // ---------- 12 · U(r) = −GMm/r, drawn as a graph hanging below the r axis ----------
  const X11 = STATIONS.well, OY11 = 3.4, C11 = V(X11, OY11, 0), RMAX = 5.6 * M.EARTH.R;
  const gU = asm('well', root, { title: 'The potential well', sub: 'U = −GMm/r, zero at infinity' });
  gU.userData.focus = () => ({ target: [X11 + 4.4, OY11 - 2.6, 0], radius: 5.2 });
  globe(gU, C11);
  const uy = U => OY11 + U / 1e9 * WELLS.GJ, ux = r => X11 + r * DO;
  lines(root, [X11, OY11, 0, ux(RMAX), OY11, 0, X11, OY11, 0, X11, uy(M.Ugrav(M.EARTH.R)) - 0.5, 0], '#6e6e74');
  const tk = []; for (let k = 1; k <= 5; k++) { tk.push(ux(k * M.EARTH.R), OY11 - 0.08, 0, ux(k * M.EARTH.R), OY11 + 0.08, 0); label('axis', k === 1 ? 'R<sub>E</sub>' : `${k}R<sub>E</sub>`, () => V(ux(k * M.EARTH.R) + (k === 1 ? 0.3 : 0), OY11 + 0.32, 0)); }
  lines(root, tk, '#6e6e74');
  label('axis', 'r →∞', () => V(ux(RMAX) + 0.55, OY11, 0)); label('axis', 'U', () => V(X11 - 0.3, uy(M.Ugrav(M.EARTH.R)) - 0.5, 0));
  const uPts = Array.from({ length: 160 }, (_, i) => { const r = M.EARTH.R * Math.pow(RMAX / M.EARTH.R, i / 159); return V(ux(r), uy(M.Ugrav(r)), 0); });
  part(gU, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(uPts), 300, 0.035, 8), { tone: 'hi', pal: 'ink', name: 'U(r)' });
  label('vec', '<i>U</i> = −<i>GMm</i>/<i>r</i>', () => uPts[110].clone().add(V(0.4, -0.45, 0)));
  const bU = ball(gU, 0.16, 'Satellite'), dotU = ball(gU, 0.07, 'U at r', 'ink'), dropU = seg(gU, { dash: 0.08 }), fU = vec(gU, 'red', 'm');
  label('vec red', 'F<sub>g</sub>', () => tip(fU, 0.12));
  let rU = M.EARTH.R;
  label('tick', '', () => dotU.position.clone().add(V(0.75, -0.25, 0)), () => `U ${f1(M.Ugrav(rU) / 1e9)} GJ`);
  // opened: the tangent at the surface, U(R) + mgh; it only follows the curve close to the ground
  const tanU = part(gU, cyl(0.025, 1, 10), { tone: 'hi', pal: 'red', name: 'mgh line' });
  { const a = V(ux(M.EARTH.R), uy(M.Ugrav(M.EARTH.R)), 0), h = 1.25 * M.EARTH.R, b = V(ux(M.EARTH.R + h), uy(M.Ugrav(M.EARTH.R) + M.SAT_M * M.EARTH.g * h), 0); stringTo(tanU, a, b); tanU.userData.end = b; }
  label('vec red', '<i>U</i>(<i>R</i>) + <i>mgh</i>', () => tanU.visible ? tanU.userData.end.clone().add(V(0.9, -0.1, 0)) : null);

  // ---------- 13 · launches from 2 R_E: circle, below, at and above escape speed ----------
  const X12 = STATIONS.escape, OY12 = 1.8, C12 = V(X12, OY12, 0), L12 = V(X12 + M.LAUNCH.r0 * DO, OY12, 0);
  const gX = asm('escape', root, { title: 'Four launches', sub: 'bound or gone: the sign of E' });
  gX.userData.focus = () => ({ target: [L12.x + 0.9, OY12, -1.9], radius: 2.6 });
  globe(gX, C12);
  part(root, cyl(0.06, 0.02, 16), { tone: 'hi', pal: 'ink', pos: [L12.x, OY12 - 0.02, 0], name: 'Launch point' });
  const NAMES = ['v<sub>c</sub>', '0.8 v<sub>esc</sub>', 'v<sub>esc</sub>', '1.2 v<sub>esc</sub>'], ESIGN = ['E < 0', 'E < 0', 'E = 0', 'E > 0'];
  const LX = M.LAUNCH.list.map((o, k) => {
    const pts = pathOf(C12, o.track, 300);
    dyn(root, 300, { dash: 0.12, color: k === 2 ? '#6e6e74' : '#a0a0a6' }).set(pts);
    const q = { o, b: ball(gX, 0.2, 'Launched balls'), v: vec(gX, 'blue', 'l'), v0: vec(gX, 'blue', 'l') };
    // name each path where it is clear of the others
    const end = [W(C12, { x: 0, y: -M.LAUNCH.r0 }).add(V(0, 0, 0.45)), W(C12, o.track.at(o.track.T / 2)).add(V(-0.9, 0, 0)), pts.at(-1).clone().add(V(-0.9, 0, -0.2)), pts.at(-1).clone().add(V(0.9, 0, -0.2))][k];
    label('vec blue', NAMES[k], () => ex(gX) < 0.3 ? end : null);
    label('vec blue', `${NAMES[k]} <span style="color:#6e6e74">${ESIGN[k]}</span>`, () => q.v0.visible ? tip(q.v0, 0.25) : null);
    return q;
  });

  // ---------- per frame ----------
  const F = n => n * F_SCALE;
  function update(clock) {
    // 1 · whirl: v tangent, a to the centre; ghost images every ⅛ of a lap
    { wClock = clock; const p = M.uniform(M.BALL.r, M.V1, clock), c = V(X0 + p.x, BY, p.z), e = ex(gW), on = 1 - e;
      bW.position.copy(c); stringTo(sW, V(X0, BY, 0), c);
      setArrow(vW, c, V(p.vx, 0, p.vz).multiplyScalar(V_SCALE));
      setArrow(aW, c.clone().add(V(0, 0.1, 0)), V(p.ax, 0, p.az).multiplyScalar(A_SCALE), on);
      const lap = M.period(M.V1, M.BALL.r);
      ghostsW.forEach((m, k) => { const q = M.uniform(M.BALL.r, M.V1, clock - (k + 1) * lap / 8); m.position.set(X0 + q.x, BY, q.z); m.visible = e < 0.5; });
      // opened: v₀ (50° back) and v_f, then both from one point: Δv = v_f − v₀ points to the centre
      const dt = M.DPHI * M.BALL.r / M.V1, q = M.uniform(M.BALL.r, M.V1, clock - dt), c0 = V(X0 + q.x, BY, q.z);
      ghost0.position.copy(c0); ghost0.visible = e > 0.02;
      setArrow(v0W, c0, V(q.vx, 0, q.vz).multiplyScalar(V_SCALE), e);
      const o = V(X0, BY + 0.12, 0), v0 = V(q.vx, 0, q.vz).multiplyScalar(V_SCALE), vf = V(p.vx, 0, p.vz).multiplyScalar(V_SCALE);
      setArrow(v0C, o, v0, e); setArrow(vfC, o, vf, e); setArrow(dvC, o.clone().add(v0), vf.clone().sub(v0), e); }

    // 2 · twice the speed: T = mv²/r, so the fast string pulls 4×
    for (const d of D) {
      const p = M.uniform(M.BALL.r, d.v, clock, -Math.PI / 2), c = d.c.clone().add(V(p.x, 0, p.z)), T = M.tension(d.v);
      d.b.position.copy(c); shrink(d.b, gD); stringTo(d.s, d.c, c);
      const inward = d.c.clone().sub(c).normalize();
      setArrow(d.vA, c, V(p.vx, 0, p.vz).multiplyScalar(V_SCALE));
      setArrow(d.T, c, inward.clone().multiplyScalar(F(T)));
      setArrow(d.N, c, V(0, F(M.BALL.m * M.G), 0)); setArrow(d.W, c, V(0, -F(M.BALL.m * M.G), 0));
      setArrow(d.net, c.clone().add(V(0, 0.2, 0)), inward.clone().multiplyScalar(F(T)));
    }

    // 3 · flat curve
    { const p = M.uniform(M.CAR.r, M.CAR.v, clock, -Math.PI / 2.4), k = ROAD.draw, e = ex(gC);
      const g = V(X2 + p.x * k, 0.012, p.z * k), f = V(p.vx, 0, p.vz).normalize(), inward = V(-p.x, 0, -p.z).normalize();
      carC.position.copy(g); orient(carC, f, V(0, 1, 0)); carC.scale.setScalar(k * (1 - 0.85 * e));
      const c = g.clone().add(V(0, 0.8 * k, 0)), K = n => n / 1000 * ROAD.kN;
      setArrow(cW, c, V(0, -K(M.CAR.W), 0)); setArrow(cN, c, V(0, K(M.CAR.W), 0));
      setArrow(cF, g.clone().add(V(0, 0.02, 0)), inward.clone().multiplyScalar(K(M.CAR.f)));
      setArrow(cNet, c.clone().add(V(0, 0.2, 0)).addScaledVector(f, -0.42), inward.clone().multiplyScalar(K(M.CAR.f)));
      setArrow(cV, c.clone().add(f.clone().multiplyScalar(0.55)), f.clone().multiplyScalar(M.CAR.v * ROAD.v));
      radC.set([V(X2, 0.03, 0), g.clone().add(V(0, 0.02, 0))]);
      tanC.visible = e > 0.02; tanC.set([g.clone().add(V(0, 0.03, 0)), g.clone().add(V(0, 0.03, 0)).addScaledVector(f, 3.2 * e)]); }

    // 4 · cone: T along the string; its horizontal part is the net force
    { const p = M.uniform(M.CONE.r, M.CONE.v, clock), c = V(X3 + p.x, YC, p.z), e = ex(gK); kAt = c;
      bK.position.copy(c); stringTo(sK, P3, c); radK.set([V(X3, YC, 0), c]);
      const up = P3.clone().sub(c).normalize(), inward = V(-p.x, 0, -p.z).normalize();
      setArrow(kT, c, up.clone().multiplyScalar(F(M.CONE.T))); setArrow(kW, c, V(0, -F(M.CONE.m * M.G), 0));
      setArrow(kNet, c.clone().add(V(0, -0.13, 0)), inward.clone().multiplyScalar(F(M.CONE.Tx)));
      setArrow(kV, c, V(p.vx, 0, p.vz).multiplyScalar(V_SCALE));
      setArrow(kTx, c, inward.clone().multiplyScalar(F(M.CONE.Tx)), e); setArrow(kTy, c, V(0, F(M.CONE.Ty), 0), e); }

    // 5 · loop: energy sets the speed; F_N + mg is the net force
    { const s = M.loopState(clock), e = ex(gL), on = 1 - e, n = V(s.n[0], s.n[1], 0), t = V(s.tan[0], s.tan[1], 0);
      const c = C4.clone().addScaledVector(n, -(RL - CH / 2)), K = x => x / 1000 * COASTER.kN;
      cart.position.copy(c); cart.rotation.z = s.phi;
      setArrow(lN, c, n.clone().multiplyScalar(K(s.N)), on); setArrow(lW, c, V(0, -K(M.LOOP.W), 0), on);
      setArrow(lNet, c.clone().addScaledVector(t, -0.1), V(s.net[0], s.net[1], 0).multiplyScalar(K(1)), on);
      setArrow(lV, c, t.clone().multiplyScalar(s.v * COASTER.v), on);
      for (const o of fbd) {
        const N = M.loopN(o.phi), nn = V(-Math.sin(o.phi), Math.cos(o.phi), 0);
        o.dot.visible = e > 0.02;
        setArrow(o.N, o.at.clone().add(V(-0.07, 0, 0)), nn.clone().multiplyScalar(K(N)), e); setArrow(o.W, o.at.clone().add(V(0.07, 0, 0)), V(0, -K(M.LOOP.W), 0), e);
        setArrow(o.net, o.at.clone().add(V(-0.24, 0, 0)), V(0, N * nn.y - M.LOOP.W, 0).multiplyScalar(K(1)), e);
      } }

    // 6 · banked curve: F_N tilts inward; its horizontal part is the net force
    { const p = M.uniform(M.BANK.r, M.BANK.v, clock, -Math.PI / 2.4), k = ROAD.draw, e = ex(gB);
      const out = V(p.x, 0, p.z).normalize(), inward = out.clone().negate(), f = V(p.vx, 0, p.vz).normalize();
      const n = V(0, Math.cos(TH), 0).addScaledVector(inward, Math.sin(TH));
      const g = V(X5, yAt(RB), 0).addScaledVector(out, RB);
      carB.position.copy(g); orient(carB, f, n); carB.scale.setScalar(k * (1 - 0.85 * e));
      const c = g.clone().addScaledVector(n, 0.8 * k), K = x => x / 1000 * ROAD.kN;
      setArrow(qW, c, V(0, -K(M.BANK.W), 0)); setArrow(qN, c, n.clone().multiplyScalar(K(M.BANK.N)));
      setArrow(qNet, c.clone().addScaledVector(n, 0.34), inward.clone().multiplyScalar(K(M.BANK.Nx)));
      setArrow(qV, c.clone().add(f.clone().multiplyScalar(0.55)), f.clone().multiplyScalar(M.BANK.v * ROAD.v));
      setArrow(qNx, c, inward.clone().multiplyScalar(K(M.BANK.Nx)), e); setArrow(qNy, c, V(0, K(M.BANK.Ny), 0), e);
      radB.set([V(X5, g.y, 0), g]); }

    // 7 · disc: one angle for every point; v = rω
    { const phi = M.DISC.w * clock, e = ex(gS); dPhi = phi;
      disc.rotation.y = phi;
      [M.DISC.r1, M.DISC.r2].forEach((r, k) => {
        const p = M.uniform(r, r * M.DISC.w, clock), c = V(X6 + p.x, DT + BS / 2 + 0.006, p.z);
        setArrow(sV[k], c, V(p.vx, 0, p.vz).multiplyScalar(V_SCALE));
        arcs[k].visible = e > 0.02; arcs[k].set(arcPts(V(X6, DT + 0.014, 0), r, phi - 1 * e, phi, 48));
      });
      back.visible = e > 0.02; back.set([V(X6, DT + 0.014, 0), V(X6 + M.DISC.R * Math.cos(phi - e), DT + 0.014, -M.DISC.R * Math.sin(phi - e))]); }

    // 8 · gravitation: equal and opposite pulls, F ∝ 1/r²
    { const r = M.sep(clock), F12v = M.gravF(M.SPHERES.m1, M.SPHERES.m2, r), e = ex(gG);
      const c1 = V(X7 - 1.0, GY, 0), c2 = V(X7 - 1.0 + r, GY, 0);
      s1.position.copy(c1); s2.position.copy(c2); rG.set([c1.clone().add(V(0, -0.02, 0)), c2.clone().add(V(0, -0.02, 0))]);
      const L = F12v * 1e6 * SPACE.uN;
      setArrow(F12, c1, V(L, 0, 0)); setArrow(F21, c2, V(-L, 0, 0));
      setArrow(A1, c1.clone().add(V(0, -R1 - 0.14, 0)), V(F12v / M.SPHERES.m1 * SPACE.a, 0, 0), e);
      setArrow(A2, c2.clone().add(V(0, -R2 - 0.14, 0)), V(-F12v / M.SPHERES.m2 * SPACE.a, 0, 0), e); }

    // 9 · orbits: time runs 3600× (one second here is an hour up there)
    { const t = clock * M.ORBIT_TIME, e = ex(gO);
      sat.forEach((s, k) => {
        const v = M.orbitV(s.R), w = v / s.R, phi = w * t + (k ? 2.2 : 0.4), c = C8.clone().add(V(s.r * Math.cos(phi), 0, -s.r * Math.sin(phi)));
        const f = V(-Math.sin(phi), 0, -Math.cos(phi)), inward = C8.clone().sub(c).normalize();
        s.g.position.copy(c); s.g.rotation.y = phi;
        setArrow(s.v, c, f.clone().multiplyScalar(v / 1000 * ORBIT.v));
        setArrow(s.a, c, inward.clone().multiplyScalar(M.orbitA(s.R) * ORBIT.a));
        const sw = w * 3600 * e;   // the angle swept in one hour
        s.arc.visible = s.r0.visible = s.r1.visible = e > 0.02;
        s.arc.set(arcPts(C8, s.r, phi - sw, phi, 64));
        s.r0.set([C8, c]); s.r1.set([C8, C8.clone().add(V(s.r * Math.cos(phi - sw), 0, -s.r * Math.sin(phi - sw)))]);
        s.mid = C8.clone().add(V((s.r + 0.35) * Math.cos(phi - sw / 2), 0, -(s.r + 0.35) * Math.sin(phi - sw / 2)));
      }); }

    // 10 · the ellipse, integrated: the radius sweeps the same area every hour
    { const t = clock * M.ORBIT_TIME, p = M.ELL.track.at(t), c = W(F9, p), e = ex(gE);
      satE.position.copy(c); satE.rotation.y = Math.atan2(-p.y, p.x);
      setArrow(vE, c, Wv(p).multiplyScalar(p.v / 1000 * ORBIT.v)); rE.set([F9, c]);
      sweepE.set(F9, wedgePts(F9, t - M.SWEEP, t, 48));
      for (const o of kp) { o.dot.visible = o.r.visible = e > 0.02; setArrow(o.v, o.at, Wv(o.p).multiplyScalar(o.p.v / 1000 * ORBIT.v), e); } }

    // 11 · the same ellipse: gravity's part along v does the work, K + U stays put
    { const t = clock * M.ORBIT_TIME, p = M.ELL.track.at(t), c = W(F10, p), e = ex(gN), u = Wv(p);
      satN.position.copy(c); satN.rotation.y = Math.atan2(-p.y, p.x);
      const F = M.GM * M.SAT_M / (p.r * p.r), Fv = F10.clone().sub(c).normalize().multiplyScalar(F / 1000 * ORBIT.kN), par = u.clone().multiplyScalar(Fv.dot(u));
      setArrow(vN, c, u.clone().multiplyScalar(p.v / 1000 * ORBIT.v)); setArrow(fN, c, Fv);
      setArrow(fPar, c, par, e); setArrow(fPer, c, Fv.clone().sub(par), e);
      const K = 0.5 * M.SAT_M * p.v * p.v, U = M.Ugrav(p.r); setBars([K, U, K + U]); }

    // 12 · the well: carry the satellite out; U rises toward zero, the pull falls as 1/r²
    { const r = M.wellR(clock), e = ex(gU); rU = r;
      const c = V(ux(r), OY11, 0), d = V(ux(r), uy(M.Ugrav(r)), 0);
      bU.position.copy(c); dotU.position.copy(d); dropU.set([c, d]);
      setArrow(fU, c.clone().add(V(0, 0.32, 0)), V(-M.GM * M.SAT_M / (r * r) / 1000 * WELLS.kN, 0, 0));
      tanU.visible = e > 0.02; tanU.scale.x = tanU.scale.z = e; }

    // 13 · launches: each ball on its own RK4 track; the escaping two start again from the launch point
    { const t = clock * M.ESC_TIME, e = ex(gX);
      LX.forEach((q, k) => {
        const p = q.o.track.at(t), c = W(C12, p);
        q.b.position.copy(c); setArrow(q.v, c, Wv(p).multiplyScalar(p.v / 1000 * ORBIT.v), 1 - e);
        setArrow(q.v0, L12.clone().add(V(0.35 + 0.55 * k, 0, 0)), V(0, 0, -q.o.v0 / 1000 * ORBIT.v), e);
      }); }
  }
  return { update, labels };
}
