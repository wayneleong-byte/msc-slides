// The figure: a row of simple scenes on the floor, one per page. Balls, carts, an egg, a hanging
// block, a car and a truck, a bursting shell; their momenta as solid arrows. Metres, y up.
// Black arrows are momenta of single objects, blue is the total momentum of the system, red is
// the net force on an object. The quartered disc marks the system's centre of mass.
import * as THREE from 'three';
import { part, box, cyl, xAxis, zAxis, lines, arrow, setArrow, shadeMat, PALETTE, V } from '../engine/parts.js';
import * as M from './model.js';

PALETTE.blue = ['#8fb6e8', '#3d7fcf', '#2a5f9e'];   // total momentum of a system

export const P_SCALE = 0.3;        // arrow metres per kg·m/s, every scene but the crash
export const V_SCALE = 0.25;       // arrow metres per m/s (breakdown of page 1)
export const F_WALL = 0.02;        // arrow metres per newton: the wall's push
export const F_EGG = 0.05;         // arrow metres per newton: the eggs
export const J_EGG = 1.0;          // arrow metres per N·s: the eggs' impulse
export const EGG_ZOOM = 3;         // the egg scene is drawn 3× life size
export const CRASH_SCALE = 0.06;   // crash: arrow metres per 1000 kg·m/s
export const STATIONS = { mom: 0, wall: 9, eggs: 16, stick: 26, bounce: 38, burst: 51, pend: 61, crash: 88, shell: 120, rods: 142, plates: 152, parts: 162 };
export const W_SCALE = 0.12;       // rods: arrow metres per newton of weight dm·g
export const W_PLATE = 0.06;       // plates: arrow metres per newton
const SH0 = STATIONS.shell - M.SHELL.R * 0.75;   // launch point of the shell

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at) => labels.push({ cls, html, at });

  // faint graph-paper ground under the small scenes
  const grid = [];
  for (let x = -4; x <= 66; x++) grid.push(x, 0.001, -3, x, 0.001, 3);
  for (let z = -3; z <= 3; z++) grid.push(-4, 0.001, z, 66, 0.001, z);
  for (let x = Math.floor(SH0) - 2; x <= SH0 + 16; x++) grid.push(x, 0.001, -2, x, 0.001, 2);
  for (let z = -2; z <= 2; z++) grid.push(Math.floor(SH0) - 2, 0.001, z, SH0 + 16, 0.001, z);
  for (let x = 138; x <= 166; x++) grid.push(x, 0.001, -2, x, 0.001, 2);
  for (let z = -2; z <= 2; z++) grid.push(138, 0.001, z, 166, 0.001, z);
  lines(root, grid, '#e6e6e2');

  const strip = (x0, x1, z0 = -0.7, z1 = 0.7, parent = root) => part(parent, box(x1 - x0, 0.02, z1 - z0, 0.005), { tone: 'lo', pal: 'board', pos: [(x0 + x1) / 2, 0.01, (z0 + z1) / 2], name: 'Surface' });
  const pArrow = (g, s = 1) => arrow(g, 'ink', { r: 0.022 * s, head: 0.12 * s, headR: 0.06 * s, name: 'Momentum' });
  const totArrow = (g, s = 1) => arrow(g, 'blue', { r: 0.026 * s, head: 0.14 * s, headR: 0.07 * s, name: 'Total momentum' });
  const fArrow = (g, s = 1) => arrow(g, 'red', { r: 0.022 * s, head: 0.12 * s, headR: 0.06 * s, name: 'Force' });
  const gArrow = (g, s = 1, name = 'Velocity') => arrow(g, 'dark', { r: 0.018 * s, head: 0.1 * s, headR: 0.05 * s, name, tone: 'mid' });
  const tip = (a, pad = 0.16) => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + a.userData.arrow.tip.scale.y * a.userData.arrow.head + pad / a.scale.y, 0)) : null;
  const mid = (a, off) => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y / 2, 0)).add(off) : null;
  const ex = g => Math.max(g.userData.explode, 0);
  const setA = (a, from, vec, op = 1) => { a.position.copy(from); setArrow(a, from, vec, op); };
  const xr = V(1, 0, 0);

  // a cart: a block on four small wheels, its size growing with its mass
  const WR = 0.06;
  function cart(parent, m, name) {
    const g = new THREE.Group(); parent.add(g);
    const L = M.cartLen(m), H = 0.5 * L, D = 0.62 * L;
    part(g, box(L, H, D, 0.03), { tone: 'hi', pos: [0, 2 * WR - 0.02 + H / 2, 0], name });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(g, zAxis(cyl(WR, 0.04, 20)), { tone: 'mid', pal: 'dark', pos: [sx * (L / 2 - 0.09), WR, sz * (D / 2 - 0.01)], name });
    g.userData.cy = 2 * WR - 0.02 + H / 2; g.userData.top = 2 * WR - 0.02 + H; g.userData.L = L;
    return g;
  }
  // centre of mass: the quartered disc, drawn over solids so it can be seen inside them
  function cmMark(parent, r = 0.075) {
    const g = new THREE.Group(); parent.add(g);
    for (let k = 0; k < 4; k++) {
      const geo = new THREE.CylinderGeometry(r, r, 0.01, 12, 1, false, k * Math.PI / 2, Math.PI / 2); geo.rotateX(Math.PI / 2);
      const mat = shadeMat(k % 2 ? 'paper' : 'ink').clone(); mat.depthTest = false;
      part(g, geo, { tone: 'hi', name: 'Centre of mass', mat }).renderOrder = 11;
    }
    return g;
  }
  const ghostCircle = r => { const pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * 2 * Math.PI, b = (i + 1) / 40 * 2 * Math.PI; pts.push(r * Math.cos(a), r * Math.sin(a), 0, r * Math.cos(b), r * Math.sin(b), 0); } return lines(root, pts, '#bdbdc2'); };
  const ghostBox = (w, h, d) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: '#bdbdc2' })); l.userData = { noEdge: true }; root.add(l); return l; };
  const dashed = (pts, color = '#a8a8ae') => { const c = []; for (let i = 0; i + 1 < pts.length; i += 2) c.push(...pts[i], ...pts[i + 1]); return lines(root, c, color); };

  // ---------- 1 · momentum: a fast light ball and a slow heavy cart ----------
  const X0 = STATIONS.mom, START = -2.0, RB = 0.11;
  const gM = asm('mom', root, { title: 'Same momentum', sub: 'light and fast, heavy and slow' });
  strip(X0 - 2.6, X0 + 2.6, -1.0, 1.0, gM);
  const ball0 = part(gM, new THREE.SphereGeometry(RB, 32, 20), { tone: 'hi', name: 'Ball · 0.5 kg' });
  const cart0 = cart(gM, M.CART.m, 'Cart · 2.0 kg');
  const pB0 = pArrow(gM), pC0 = pArrow(gM), vB0 = gArrow(gM), vC0 = gArrow(gM);
  label('vec', '<i>p</i>', () => tip(pB0)); label('vec', '<i>p</i>', () => tip(pC0));
  label('vec', '<i>v</i>', () => ex(gM) > 0.3 ? tip(vB0) : null); label('vec', '<i>v</i>', () => ex(gM) > 0.3 ? tip(vC0) : null);
  label('tick', '0.5 kg', () => V(ball0.position.x - 0.1, 0.42, 0.55)); label('tick', '2.0 kg', () => V(cart0.position.x - cart0.userData.L / 2, cart0.userData.top + 0.4, -0.55));
  const ghB = Array.from({ length: 5 }, () => ghostCircle(RB)), ghC = Array.from({ length: 5 }, () => ghostBox(cart0.userData.L, cart0.userData.top - 0.1, 0.62 * cart0.userData.L));

  // ---------- 2 · impulse: a ball bounces off a wall ----------
  const X1 = STATIONS.wall, W = M.WALL;
  part(root, box(0.16, 1.3, 1.5, 0.02), { tone: 'mid', pal: 'board', pos: [X1 + 0.08, 0.67, 0], name: 'Wall' });
  const gW = asm('wall', root, { title: 'Ball hitting a wall', sub: 'impulse = change in momentum' });
  strip(X1 - 1.6, X1 + 0.3, -0.8, 0.8, gW);
  const ballW = part(gW, new THREE.SphereGeometry(W.r, 36, 24), { tone: 'hi', name: 'Ball · 0.5 kg' });
  const pW = pArrow(gW), fW = fArrow(gW);
  const dpI = pArrow(gW), dpF = pArrow(gW), dpD = gArrow(gW, 1.1, 'Δp');
  label('vec', '<i>p</i>', () => tip(pW)); label('vec red', '<i>F</i>', () => tip(fW));
  label('vec', '<i>p</i><sub>before</sub>', () => tip(dpI)); label('vec', '<i>p</i><sub>after</sub>', () => tip(dpF)); label('vec', 'Δ<i>p</i> = <i>J</i>', () => tip(dpD));

  // ---------- 3 · an egg on a pillow, an egg on the floor ----------
  // drawn EGG_ZOOM× life size (positions, sizes and arrows all scaled together), so it can be seen
  const ER = 0.03, EK = 1.3, PH = 0.3, EGX = [-0.2, 0.2];
  const eggRoot = new THREE.Group(); eggRoot.position.x = STATIONS.eggs; eggRoot.scale.setScalar(EGG_ZOOM); root.add(eggRoot);
  const gE = asm('eggs', eggRoot, { title: 'Two eggs dropped', sub: 'same Δp, different stopping time' });
  part(gE, box(1.0, 0.02, 0.7, 0.005), { tone: 'lo', pal: 'board', pos: [0, 0.01, 0], name: 'Surface' });
  const pillow = part(gE, box(0.26, PH, 0.24, 0.06), { tone: 'mid', pal: 'board', pos: [EGX[0], 0.02 + PH / 2, 0], name: 'Pillow' });
  const eggGeo = new THREE.SphereGeometry(ER, 28, 20);
  const eggs = EGX.map((x, i) => part(gE, eggGeo, { tone: 'hi', name: i ? 'Egg on the floor' : 'Egg on the pillow' }));
  const fE = eggs.map(() => fArrow(gE, 0.15)), jE = eggs.map(() => gArrow(gE, 0.17, 'Impulse'));
  fE.forEach(a => label('vec red', '<i>F</i><sub>net</sub>', () => tip(a, 0.03)));
  jE.forEach(a => label('vec', '<i>J</i>', () => ex(gE) > 0.3 ? tip(a, 0.03) : null));
  label('tick', 'pillow', () => eggRoot.localToWorld(V(EGX[0] + 0.06, 0.02, 0.24))); label('tick', 'floor', () => eggRoot.localToWorld(V(EGX[1] + 0.06, 0.02, 0.24)));

  // ---------- 4–6 · carts on a track ----------
  function collision(key, c, X, meta) {
    const g = asm(key, root, meta);
    strip(X - 3.6, X + 2.2, -0.6, 0.6, g);
    const c1 = cart(g, c.m1, `Cart 1 · ${c.m1.toFixed(1)} kg`), c2 = cart(g, c.m2, `Cart 2 · ${c.m2.toFixed(1)} kg`);
    const cm = cmMark(g), p1 = pArrow(g), p2 = pArrow(g), tot = totArrow(g);
    label('vec', '<i>p</i><sub>1</sub>', () => mid(p1, V(0, 0.17, 0))); label('vec', '<i>p</i><sub>2</sub>', () => mid(p2, V(0, 0.17, 0)));
    label('vec blue', '<i>P</i>', () => tip(tot));
    label('tick', `${c.m1.toFixed(1)} kg`, () => V(c1.position.x + 0.12, c1.userData.cy, 0.5)); label('tick', `${c.m2.toFixed(1)} kg`, () => V(c2.position.x + 0.15, c2.userData.cy, 0.5));
    // the breakdown: momenta before and after, laid tip to tail
    const rows = ['before', 'after'].map((name, i) => ({ y: 2.15 - i * 0.6, a: pArrow(g), b: pArrow(g), t: totArrow(g) }));
    rows.forEach((r, i) => {
      label('tick', i ? 'after' : 'before', () => ex(g) > 0.3 ? V(X - 2.9, r.y + 0.02, 0) : null);
      label('vec', i ? '<i>p</i><sub>1</sub>′' : '<i>p</i><sub>1</sub>', () => ex(g) > 0.3 ? mid(r.a, V(0, -0.15, 0)) : null);
      label('vec', i ? '<i>p</i><sub>2</sub>′' : '<i>p</i><sub>2</sub>', () => ex(g) > 0.3 ? mid(r.b, V(0, 0.16, 0)) : null);
    });
    const plunger = c.Q ? part(g, xAxis(new THREE.CylinderGeometry(0.018, 0.018, 1, 10)), { tone: 'hi', pal: 'ink', name: 'Spring plunger' }) : null;
    return { g, c, X, c1, c2, cm, p1, p2, tot, rows, plunger };
  }
  const cols = [
    collision('stick', M.STICK, STATIONS.stick, { title: 'Carts that stick', sub: 'perfectly inelastic' }),
    collision('bounce', M.BOUNCE, STATIONS.bounce, { title: 'Carts that bounce', sub: 'elastic' }),
    collision('burst', M.BURST, STATIONS.burst, { title: 'Carts pushed apart', sub: 'an explosion' }),
  ];

  // ---------- 7 · ballistic pendulum ----------
  const X6 = STATIONS.pend, Pd = M.PEND, PIV = V(X6 + 0.4, 2.1, 0), BW = 0.3, BH = 0.22, CR = 0.035;
  part(root, box(1.4, 0.08, 0.5, 0.02), { tone: 'mid', pal: 'board', pos: [PIV.x, PIV.y + 0.04, 0], name: 'Ceiling' });
  const gP = asm('pend', root, { title: 'Ballistic pendulum', sub: 'momentum, then energy' });
  const swingG = new THREE.Group(); swingG.position.copy(PIV); gP.add(swingG);
  part(swingG, new THREE.CylinderGeometry(0.008, 0.008, Pd.L - BH / 2, 8).translate(0, -(Pd.L - BH / 2) / 2, 0), { tone: 'hi', pal: 'ink', name: 'String' });
  part(swingG, box(BW, BH, 0.22, 0.02), { tone: 'hi', pos: [0, -Pd.L, 0], name: 'Block · 1.0 kg' });
  const clay = part(gP, new THREE.SphereGeometry(CR, 24, 16), { tone: 'hi', pal: 'dark', name: 'Clay · 0.2 kg' });
  const pP = pArrow(gP), pC = pArrow(gP);
  label('vec', '<i>p</i>', () => tip(pP)); label('vec', '<i>p</i>', () => tip(pC));
  label('tick', '0.2 kg', () => clay.visible && clay.position.x < PIV.x - 0.3 ? clay.position.clone().add(V(0.05, 0.12, 0)) : null);
  label('tick', '1.0 kg', () => V(PIV.x - 0.18, PIV.y - Pd.L + BH / 2 + 0.12, 0.12));
  // breakdown: the swing's top, its height Δy and angle θ
  const bottomY = PIV.y - Pd.L, topY = bottomY + Pd.dy, topX = PIV.x + Pd.L * Math.sin(Pd.theta);
  const pendGuides = new THREE.Group(); gP.add(pendGuides);
  { const c = [];
    for (let x = PIV.x - 0.35; x < topX + 0.45; x += 0.08) c.push(x, bottomY, 0.13, x + 0.045, bottomY, 0.13, x, topY, 0.13, x + 0.045, topY, 0.13);
    for (let y = PIV.y; y > bottomY; y -= 0.08) c.push(PIV.x, y, 0, PIV.x, y - 0.045, 0);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Pd.theta, b = (i + 1) / 16 * Pd.theta; c.push(PIV.x + 0.35 * Math.sin(a), PIV.y - 0.35 * Math.cos(a), 0, PIV.x + 0.35 * Math.sin(b), PIV.y - 0.35 * Math.cos(b), 0); }
    c.push(PIV.x, PIV.y, 0, topX, PIV.y - Pd.L * Math.cos(Pd.theta), 0);
    lines(pendGuides, c, '#8a8a8f'); }
  const dyA = gArrow(gP, 0.6, 'Δy');
  label('vec', 'Δ<i>y</i>', () => ex(gP) > 0.3 ? V(topX + 0.62, (bottomY + topY) / 2, 0.13) : null);
  label('vec', 'θ', () => ex(gP) > 0.3 ? V(PIV.x + 0.12, PIV.y - 0.5, 0) : null);
  label('vec', '<i>L</i>', () => ex(gP) > 0.3 ? V(PIV.x - 0.12, PIV.y - 0.55, 0) : null);

  // ---------- 8 · crash at a crossroads ----------
  const X7 = STATIONS.crash, C = M.CRASH, RW = 7, RL = 46;
  part(root, box(RL, 0.03, RW, 0.01), { tone: 'lo', pal: 'board', pos: [X7, 0.015, 0], name: 'Road' });
  part(root, box(RW, 0.031, RL, 0.01), { tone: 'lo', pal: 'board', pos: [X7, 0.016, 0], name: 'Road' });
  { const d = []; for (let x = -RL / 2; x < RL / 2; x += 2.4) if (Math.abs(x + 0.7) > RW / 2 + 0.4) d.push(X7 + x, 0.04, 0, X7 + x + 1.4, 0.04, 0);
    for (let z = -RL / 2; z < RL / 2; z += 2.4) if (Math.abs(z + 0.7) > RW / 2 + 0.4) d.push(X7, 0.04, z, X7, 0.04, z + 1.4);
    lines(root, d, '#9a9aa0'); }
  const gX = asm('crash', root, { title: 'Crash at a crossroads', sub: 'momentum adds as a vector' });
  const car = new THREE.Group(), truck = new THREE.Group(); gX.add(car, truck);
  part(car, box(4.2, 0.7, 1.8, 0.18), { tone: 'hi', pos: [0, 0.75, 0], name: 'Car · 1000 kg' });
  part(car, box(2.2, 0.6, 1.6, 0.2), { tone: 'hi', pos: [-0.3, 1.38, 0], name: 'Car · 1000 kg' });
  for (const [x, z] of [[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]]) part(car, zAxis(cyl(0.36, 0.26, 24)), { tone: 'mid', pal: 'dark', pos: [x, 0.36, z], name: 'Car · 1000 kg' });
  // the truck faces north (−z): cab in front, box behind
  part(truck, box(2.5, 3.0, 5.6, 0.12), { tone: 'hi', pos: [0, 2.0, 0.9], name: 'Truck · 8000 kg' });
  part(truck, box(2.4, 2.2, 1.9, 0.2), { tone: 'hi', pos: [0, 1.6, -2.85], name: 'Truck · 8000 kg' });
  for (const [x, z] of [[1.15, -2.7], [-1.15, -2.7], [1.15, 1.2], [-1.15, 1.2], [1.15, 2.6], [-1.15, 2.6]]) part(truck, xAxis(cyl(0.48, 0.32, 24)), { tone: 'mid', pal: 'dark', pos: [x, 0.48, z], name: 'Truck · 8000 kg' });
  // where each is at the moment of impact: car (eastbound lane) nose against the truck's side
  const TRUCK_C = V(0, 0, 0.35), LANE = 1.7;                     // the truck's centre of mass, in its frame
  const TRUCK0 = V(X7 + LANE, 0, LANE).sub(TRUCK_C), CAR0 = V(X7 + LANE - 1.25 - 2.12, 0, LANE);
  const cmX = cmMark(gX, 0.5), pCar = pArrow(gX, 3), pTruck = pArrow(gX, 3), totX = totArrow(gX, 3);
  label('vec', '<i>p</i><sub>car</sub>', () => tip(pCar, 0.6)); label('vec', '<i>p</i><sub>truck</sub>', () => tip(pTruck, 0.6)); label('vec blue', '<i>P</i>', () => tip(totX, 0.6));
  const kc = n => n / 1000 * CRASH_SCALE;
  const addA = pArrow(gX, 3), addB = pArrow(gX, 3), addT = totArrow(gX, 3);
  label('vec', '<i>p</i><sub>car</sub>', () => ex(gX) > 0.3 ? mid(addA, V(0, 0, 1.2)) : null);
  label('vec', '<i>p</i><sub>truck</sub>', () => ex(gX) > 0.3 ? mid(addB, V(1.6, 0, 0)) : null);
  label('vec blue', '<i>P</i><sub>total</sub>', () => ex(gX) > 0.3 ? mid(addT, V(-1.8, 0, 0)) : null);
  label('tick', '1000 kg', () => car.position.clone().add(V(-1, 2.6, 0))); label('tick', '8000 kg', () => truck.position.clone().add(V(-1.4, 4.1, 0)));

  // ---------- 9 · a shell that bursts at the top ----------
  const S = M.SHELL, SR = 0.16;
  const gS = asm('shell', root, { title: 'A shell bursts in flight', sub: 'the centre of mass flies on' });
  strip(SH0 - 0.8, SH0 + 1.5 * S.R + 1.0, -0.7, 0.7, gS);
  const halfGeo = front => new THREE.SphereGeometry(SR, 28, 18, front ? Math.PI / 2 : -Math.PI / 2, Math.PI);
  const halfMat = shadeMat('paper').clone(); halfMat.side = THREE.DoubleSide;
  const halves = [0, 1].map(i => part(gS, halfGeo(i), { tone: 'hi', name: i ? 'Front half · 0.5 kg' : 'Rear half · 0.5 kg', mat: halfMat }));
  const cmS = cmMark(gS, 0.11), pA = pArrow(gS, 1.3), pB = pArrow(gS, 1.3), totS = totArrow(gS, 1.3);
  label('vec', '<i>p</i><sub>1</sub>', () => tip(pA, 0.25)); label('vec', '<i>p</i><sub>2</sub>', () => tip(pB, 0.25)); label('vec blue', '<i>P</i>', () => tip(totS, 0.25));
  { const path = [], a = [], b = [];
    for (let i = 0; i < 60; i += 1) { const t0 = i / 60 * S.run, t1 = (i + 0.55) / 60 * S.run, c0 = M.shell(t0).cm, c1 = M.shell(t1).cm; path.push([SH0 + c0[0], c0[1], 0], [SH0 + c1[0], c1[1], 0]); }
    for (let i = 0; i < 30; i++) { const t0 = S.ta + i / 30 * S.ta, t1 = S.ta + (i + 0.55) / 30 * S.ta, s0 = M.shell(t0), s1 = M.shell(t1);
      a.push([SH0 + s0.a[0], s0.a[1], 0], [SH0 + s1.a[0], s1.a[1], 0]); b.push([SH0 + s0.b[0], s0.b[1], 0], [SH0 + s1.b[0], s1.b[1], 0]); }
    dashed(path, '#8a8a8f'); dashed(a, '#c4c4c8'); dashed(b, '#c4c4c8');
    const tk = []; for (const x of [0, S.R / 2, S.R, 1.5 * S.R]) tk.push(SH0 + x, 0.03, -0.25, SH0 + x, 0.03, 0.25); lines(root, tk, '#6e6e74'); }
  label('tick', '<i>R</i>/2', () => V(SH0 + S.R / 2 + 0.15, 0.1, 0.6)); label('tick', '<i>R</i>', () => V(SH0 + S.R + 0.12, 0.1, 0.6)); label('tick', '3<i>R</i>/2', () => V(SH0 + 1.5 * S.R + 0.25, 0.1, 0.6));
  label('tick', 'launch', () => V(SH0 + 0.35, 0.1, 0.6));


  // ---------- 10–12 · continuous bodies (AP Physics C) ----------
  // shade of grey = density: paper for λ = 0, the dark palette for λ = 1.5 kg/m
  const greyPal = t => { const k = `grey${Math.round(t * 100)}`; if (!PALETTE[k]) PALETTE[k] = PALETTE.paper.map((c, i) => '#' + new THREE.Color(c).lerp(new THREE.Color(PALETTE.dark[i]), t).getHexString()); return k; };
  const wedge = (w, h, d) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2); };
  const flat = (pts, holes = [], T = 0.04) => { const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))); holes.forEach(h => sh.holes.push(h)); return new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 48 }).rotateX(-Math.PI / 2); };

  // 10 · two rods on knife edges
  const XR = STATIONS.rods, R = M.ROD, RS = 0.12, YR = 0.5, X0R = XR - R.L / 2, rodZ = { U: 0.55, N: -0.55 };
  const gR = asm('rods', root, { title: 'Two rods, sliced', sub: 'x<sub>cm</sub> = (1/<i>M</i>)∫<i>x</i> d<i>m</i>' });
  strip(XR - 1.6, XR + 1.6, -1.1, 1.1, gR);
  gR.userData.focus = () => ({ target: [XR - 0.1, 0.55, 0], radius: 1.9 });
  const rods = ['U', 'N'].map(kind => {
    const z = rodZ[kind], sl = M.rodSlices(kind), xc = kind === 'U' ? R.xU : R.xN;
    const bands = sl.map((q, i) => part(gR, new THREE.BoxGeometry(q.b - q.a, RS, RS), { tone: 'hi', pal: greyPal((q.dm / (q.b - q.a)) / R.lam0), pos: [X0R + (q.a + q.b) / 2, YR, z], ex: [(i - (R.n - 1) / 2) * 0.07, 0, 0], name: kind === 'U' ? 'Uniform rod · 1.0 kg' : 'Rod, λ = λ₀x/L · 1.5 kg' }));
    part(gR, wedge(0.22, YR - RS / 2 - 0.02, 0.26), { tone: 'mid', pal: 'board', pos: [X0R + xc, 0.02, z], name: 'Knife edge' });
    const mk = cmMark(gR, 0.05); mk.position.set(X0R + xc, YR, z + RS / 2 + 0.01);
    const slab = part(gR, new THREE.BoxGeometry(0.035, RS + 0.03, RS + 0.03), { tone: 'hi', pal: 'ink', name: 'dm' });
    const wts = sl.map(() => gArrow(gR, 0.7, 'Weight dm·g'));
    return { kind, z, sl, xc, bands, slab, wts };
  });
  label('tick', 'uniform', () => V(X0R - 0.12 - 0.35 * ex(gR), YR, rodZ.U)); label('tick', 'λ = λ₀x/L', () => V(X0R - 0.12 - 0.35 * ex(gR), YR, rodZ.N));
  label('tick', 'x_cm = L/2', () => V(X0R + R.xU - 0.2, 0.08, rodZ.U + 0.2)); label('tick', 'x_cm = 2L/3', () => V(X0R + R.xN - 0.16, 0.3, rodZ.N));
  label('tick', 'x = 0', () => V(X0R + 0.12, YR - 0.2, rodZ.U + 0.1));
  label('vec', 'd<i>m</i>', () => ex(gR) < 0.3 ? rods[1].slab.position.clone().add(V(0, 0.22, 0)) : null);

  // 11 · a triangle and a semicircle, cut into strips, each on a pin
  const XP = STATIONS.plates, YP = 0.45, PT = 0.04, plates = [];
  const gPl = asm('plates', root, { title: 'Plates, strip by strip', sub: 'triangle and semicircle' });
  strip(XP - 2.0, XP + 1.6, -1.1, 1.1, gPl);
  gPl.userData.focus = () => ({ target: [XP - 0.2, 0.5, 0], radius: 2.1 });
  for (const [S, w, x0, name] of [[M.TRI, M.triW, XP - 1.65, 'Triangle · 1.8 kg'], [M.SEMI, M.semiW, XP + 0.35, 'Semicircle · 2.0 kg']]) {
    const st = M.plateStrips(S), H = S === M.TRI ? M.TRI.h : M.SEMI.R;
    const pieces = st.map((q, i) => { const pts = [], k = 8;
      for (let j = 0; j <= k; j++) { const u = q.a + (q.b - q.a) * j / k; pts.push([u, -w(u) / 2]); }
      for (let j = k; j >= 0; j--) { const u = q.a + (q.b - q.a) * j / k; pts.push([u, w(u) / 2]); }
      return part(gPl, flat(pts, [], PT), { tone: 'hi', pos: [x0, YP, 0], ex: [(i - (st.length - 1) / 2) * 0.08, 0, 0], name }); });
    part(gPl, new THREE.ConeGeometry(0.045, YP - 0.02, 20), { tone: 'mid', pal: 'board', pos: [x0 + S.ucm, 0.02 + (YP - 0.02) / 2, 0], name: 'Pin' });
    const mk = cmMark(gPl, 0.05); mk.position.set(x0 + S.ucm, YP + PT / 2, 0);
    const slab = part(gPl, new THREE.BoxGeometry(0.03, PT + 0.03, 1), { tone: 'hi', pal: 'ink', name: 'dm' });
    plates.push({ S, w, x0, H, st, slab, wts: st.map(() => gArrow(gPl, 0.7, 'Weight dm·g')), pieces });
  }
  label('tick', 'h/3', () => V(plates[0].x0 + M.TRI.ucm - 0.08, 0.03, 0.3)); label('tick', '4R/3π', () => V(plates[1].x0 + M.SEMI.ucm - 0.08, 0.03, 0.3));
  label('tick', 'base', () => V(plates[0].x0 - 0.06 - 0.3 * ex(gPl), YP, -0.62)); label('tick', 'diameter', () => V(plates[1].x0 - 0.06 - 0.3 * ex(gPl), YP, -0.82));
  label('vec', 'd<i>m</i>', () => ex(gPl) < 0.3 ? plates[1].slab.position.clone().add(V(0, 0.12, -0.15 - plates[1].slab.scale.z / 2)) : null);

  // 12 · by parts and by subtraction: a plate with a hole on a pin, an L hung by a string
  const XC = STATIONS.parts, Hh = M.HOLE, HX = XC - 0.95, L2 = M.ELL;
  const gC = asm('parts', root, { title: 'By parts, by subtraction', sub: 'add the pieces; take the hole away' });
  strip(XC - 1.8, XC + 1.7, -0.85, 0.85, gC);
  gC.userData.focus = () => ({ target: [XC + 0.05, 1.25, 0], radius: 1.95 });
  const hs = Hh.s / 2, holePath = new THREE.Path(); holePath.absarc(Hh.c[0], Hh.c[1], Hh.r, 0, Math.PI * 2, true);
  part(gC, flat([[-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs]], [holePath], PT), { tone: 'hi', pos: [HX, YP, 0], name: 'Plate with a hole · 2.3 kg' });
  const w2 = ([x, y], h = YP + PT / 2) => V(HX + x, h, -y);          // plate coordinates → world (flat)
  part(gC, new THREE.ConeGeometry(0.045, YP - 0.02, 20), { tone: 'mid', pal: 'board', pos: w2(Hh.cm, 0.02 + (YP - 0.02) / 2).toArray(), name: 'Pin' });
  const mkH = cmMark(gC, 0.05); mkH.position.copy(w2(Hh.cm));
  const plug = part(gC, new THREE.CylinderGeometry(Hh.r, Hh.r, PT, 48), { tone: 'mid', name: 'The missing plug', mat: shadeMat('dark', { opacity: 0.45 }) });
  const mkFull = cmMark(gC, 0.035), mkPlug = cmMark(gC, 0.035);
  const holeLine = new THREE.Group(); gC.add(holeLine);
  { const d = [], A = [Hh.cm[0] - 0.12, Hh.cm[1] - 0.12], B = [Hh.c[0] + 0.12, Hh.c[1] + 0.12], n = 14;
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 0.55) / n; d.push(...w2([A[0] + (B[0] - A[0]) * t0, A[1] + (B[1] - A[1]) * t0], YP + PT + 0.005).toArray(), ...w2([A[0] + (B[0] - A[0]) * t1, A[1] + (B[1] - A[1]) * t1], YP + PT + 0.005).toArray()); }
    lines(holeLine, d, '#6e6e74'); }
  label('vec', '−<i>m</i><sub>plug</sub>', () => ex(gC) > 0.3 ? plug.position.clone().add(V(0.42, 0.08, 0)) : null);
  // the L: in the xy plane, hanging from a string tied at P
  const Q = V(XC + 0.75, 2.05, 0), CEIL = 2.4;
  part(root, box(0.9, 0.08, 0.5, 0.02), { tone: 'mid', pal: 'board', pos: [Q.x, CEIL + 0.04, 0], name: 'Ceiling' });
  part(gC, new THREE.CylinderGeometry(0.008, 0.008, CEIL - Q.y, 8), { tone: 'hi', pal: 'ink', pos: [Q.x, (CEIL + Q.y) / 2, 0], name: 'String' });
  const ellG = new THREE.Group(); ellG.position.copy(Q); ellG.rotation.z = L2.phi; gC.add(ellG);
  const arms = ['A', 'B'].map(k => { const r = L2[k], g = new THREE.Group(); ellG.add(g);
    part(g, new THREE.BoxGeometry(r.a1 - r.a0, r.b1 - r.b0, PT), { tone: 'hi', pos: [(r.a0 + r.a1) / 2 - L2.P[0], (r.b0 + r.b1) / 2 - L2.P[1], 0], name: `L-shaped plate · ${L2.M.toFixed(2)} kg` });
    const mk = cmMark(g, 0.035); mk.position.set(L2['p' + k].c[0] - L2.P[0], L2['p' + k].c[1] - L2.P[1], PT / 2 + 0.01);
    return { g, mk }; });
  const hw = p => { const [x, y] = M.hang(p); return V(Q.x + x, Q.y + y, 0); };
  const mkL = cmMark(gC, 0.04); mkL.position.copy(hw(L2.cm)).add(V(0, 0, PT / 2 + 0.01));
  { const d = [], top = Q.y, bot = 0.3; for (let y = top - 0.02; y > bot; y -= 0.09) d.push(Q.x, y, 0.03, Q.x, Math.max(y - 0.05, bot), 0.03); lines(gC, d, '#8a8a8f'); }
  const armLine = lines(gC, new Array(6 * 12).fill(0), '#6e6e74');
  label('vec', '<i>m</i><sub>A</sub>', () => ex(gC) > 0.3 ? arms[0].mk.getWorldPosition(V()).add(V(0.16, 0.06, 0)) : null);
  label('vec', '<i>m</i><sub>B</sub>', () => ex(gC) > 0.3 ? arms[1].mk.getWorldPosition(V()).add(V(0.02, 0.17, 0)) : null);
  label('tick', 'string tied here', () => Q.clone().add(V(-0.2, 0.08, 0)));
  label('tick', 'centre of mass: in the gap', () => hw(L2.cm).add(V(-0.12, -0.02, 0)));
  label('tick', 'pin', () => w2(Hh.cm, 0.12).add(V(-0.08, 0, 0.1)));

  // ---------- per-frame ----------
  const P = n => n * P_SCALE;
  function update(s) {
    // 1 · same momentum
    { const t = s.mom.t, e = ex(gM);
      const xb = X0 + START + M.BALL.v * t, xc = X0 + START + M.CART.v * t;
      ball0.position.set(xb, RB + 0.02, 0.5); cart0.position.set(xc, 0.02, -0.5);
      const cb = ball0.position, cc = V(xc, 0.02 + cart0.userData.cy, -0.5);
      setA(pB0, cb.clone().add(V(0, RB + 0.18, 0)), xr.clone().multiplyScalar(P(M.p(M.BALL.m, M.BALL.v))));
      setA(pC0, cc.clone().add(V(0, cart0.userData.top - cart0.userData.cy + 0.18, 0)), xr.clone().multiplyScalar(P(M.p(M.CART.m, M.CART.v))));
      setA(vB0, cb.clone().add(V(0, 0, 0.25)), xr.clone().multiplyScalar(M.BALL.v * V_SCALE), e);
      setA(vC0, cc.clone().add(V(0, -0.02, 0.4)), xr.clone().multiplyScalar(M.CART.v * V_SCALE), e);
      ghB.forEach((g, k) => { const tk = k * 0.25; g.visible = tk <= t; g.position.set(X0 + START + M.BALL.v * tk, RB + 0.02, 0.5); });
      ghC.forEach((g, k) => { const tk = k * 0.25; g.visible = tk <= t; g.position.set(X0 + START + M.CART.v * tk, 0.02 + cart0.userData.top / 2 + 0.05, -0.5); }); }

    // 2 · the wall
    { const w = M.wall(s.wall.t), e = ex(gW), d = w.squash;
      // squashed against the wall: the left side stays put, the right side flattens on the wall
      const k = (2 * W.r - d) / (2 * W.r);
      ballW.scale.set(k, 1 / Math.sqrt(k), 1 / Math.sqrt(k)); ballW.position.set(X1 + (d > 0 ? (w.x - W.r) / 2 : w.x), W.r + 0.02, 0);
      const c = V(X1 + w.x, W.r + 0.02, 0);
      setA(pW, c.clone().add(V(0, W.r + 0.2, 0)), xr.clone().multiplyScalar(P(w.p)));
      setA(fW, V(X1, W.r + 0.02, 0.0), xr.clone().multiplyScalar(F_WALL * w.F), w.touching ? 1 : 0);
      const y0 = 1.65, x0 = X1 - 0.5;
      setA(dpI, V(x0 - P(W.m * W.v), y0, 0), xr.clone().multiplyScalar(P(W.m * W.v)), e);
      setA(dpF, V(x0, y0 - 0.35, 0), xr.clone().multiplyScalar(-P(W.m * W.v)), e);
      setA(dpD, V(x0 + P(W.m * W.v) / 2, y0 - 0.7, 0), xr.clone().multiplyScalar(-P(W.J)), e); }

    // 3 · eggs
    { const e = ex(gE);
      [M.EGG.tauSoft, M.EGG.tauHard].forEach((tau, i) => {
        const q = M.egg(s.eggs.t, tau), base = i ? 0.02 : 0.02 + PH;
        if (!i) { const top = PH + Math.min(q.y, 0); pillow.scale.y = top / PH; pillow.position.y = 0.02 + top / 2; }
        // the floor doesn't give: the egg itself flattens by the stopping distance
        const sq = i ? Math.max(0, -q.y) : 0, hgt = 2 * ER * EK - sq, ky = hgt / (2 * ER);
        eggs[i].scale.set(1 + sq * 6, ky, 1 + sq * 6);
        const bottom = i ? base + Math.max(q.y, 0) : base + q.y;
        eggs[i].position.set(EGX[i], bottom + hgt / 2, 0);
        const c = eggs[i].position;
        // drawn from the egg's top (pushed up) or bottom (pulled down), so it isn't hidden in the egg
        setA(fE[i], c.clone().add(V(0, Math.sign(q.Fnet) * hgt / 2, 0)), V(0, F_EGG * q.Fnet, 0), Math.abs(q.Fnet) > 0.01 ? 1 : 0);
        setA(jE[i], V(EGX[i] + 0.09, c.y, 0), V(0, J_EGG * M.EGG.J, 0), e);
      }); }

    // 4–6 · carts
    for (const K of cols) {
      const { c, X, c1, c2, cm, p1, p2, tot, rows, g, plunger } = K, e = ex(g);
      const r = M.track(c, s[g.userData.asm].t);
      c1.position.set(X + r.x1, 0.02, 0); c2.position.set(X + r.x2, 0.02, 0);
      const ycm = 0.02 + (c.m1 * c1.userData.cy + c.m2 * c2.userData.cy) / (c.m1 + c.m2);
      cm.position.set(X + r.xcm, ycm, 0.4);
      const h1 = 0.02 + c1.userData.top + 0.16, h2 = 0.02 + c2.userData.top + 0.16;
      setA(p1, V(X + r.x1, h1, 0), xr.clone().multiplyScalar(P(r.p1)));
      setA(p2, V(X + r.x2, h2, 0), xr.clone().multiplyScalar(P(r.p2)));
      setA(tot, V(X + r.xcm, Math.max(h1, h2) + 0.42, 0), xr.clone().multiplyScalar(P(r.P)), 1);
      if (plunger) { const gap = r.x2 - c2.userData.L / 2 - (r.x1 + c1.userData.L / 2), len = Math.min(Math.max(gap, 0.001), 0.14);
        plunger.position.set(X + r.x2 - c2.userData.L / 2 - len / 2, 0.02 + c2.userData.cy, 0); plunger.scale.set(len, 1, 1); plunger.visible = gap > 0.002; }
      const x0 = X - 1.6;
      [[c.u1, c.u2], [c.v1, c.v2]].forEach(([w1, w2], i) => {
        const R = rows[i], a = P(c.m1 * w1), b = P(c.m2 * w2);
        setA(R.a, V(x0, R.y, 0), xr.clone().multiplyScalar(a), e);
        setA(R.b, V(x0 + a, R.y + 0.12, 0), xr.clone().multiplyScalar(b), e);
        setA(R.t, V(x0, R.y - 0.14, 0), xr.clone().multiplyScalar(a + b), e);
      });
    }

    // 7 · ballistic pendulum
    { const q = M.pend(s.pend.t), e = ex(gP);
      swingG.rotation.z = q.th;
      const bc = V(PIV.x + Pd.L * Math.sin(q.th), PIV.y - Pd.L * Math.cos(q.th), 0);
      if (!q.stuck) clay.position.set(PIV.x - BW / 2 - CR + q.clayX, bottomY, 0.0);
      else clay.position.copy(V(-BW / 2 - CR * 0.4, 0, 0).applyAxisAngle(V(0, 0, 1), q.th).add(bc));
      setA(pC, clay.position.clone().add(V(0, 0.12, 0)), xr.clone().multiplyScalar(P(Pd.m * Pd.u)), q.stuck ? 0 : 1);
      const tng = V(Math.cos(q.th), Math.sin(q.th), 0), pv = (Pd.m + Pd.M) * q.om * Pd.L;
      setA(pP, bc.clone().add(V(0, BH / 2 + 0.14, 0)), tng.multiplyScalar(P(pv)), q.stuck ? 1 : 0);
      pendGuides.visible = e > 0.02;
      setA(dyA, V(topX + 0.5, bottomY, 0.13), V(0, Pd.dy, 0), e); }

    // 8 · crash
    { const q = M.crash(s.crash.t), e = ex(gX);
      car.position.copy(CAR0).add(V(q.car[0], 0, -q.car[1])); truck.position.copy(TRUCK0).add(V(q.truck[0], 0, -q.truck[1]));
      const cc = car.position.clone(), tc = truck.position.clone().add(TRUCK_C);
      const cmP = cc.clone().multiplyScalar(C.m1).add(tc.clone().multiplyScalar(C.m2)).multiplyScalar(1 / (C.m1 + C.m2));
      cmX.position.set(cmP.x, 2.2, cmP.z); cmX.rotation.x = -Math.PI / 2;
      const vCar = q.after ? V(C.vx, 0, -C.vy) : V(C.v1, 0, 0), vTr = q.after ? V(C.vx, 0, -C.vy) : V(0, 0, -C.v2);
      setA(pCar, cc.clone().add(V(0, 2.4, 0)), vCar.multiplyScalar(kc(C.m1)), q.after ? 0 : 1);
      setA(pTruck, tc.clone().add(V(0, 3.9, 0)), vTr.multiplyScalar(kc(C.m2)), q.after ? 0 : 1);
      setA(totX, cmP.clone().setY(q.after ? 4.4 : 5.4), V(C.px, 0, -C.py).multiplyScalar(kc(1)), 1);
      const o = V(X7 - 5.0, 6.5, 4.5);
      setA(addA, o, V(kc(C.px), 0, 0), e); setA(addB, o.clone().add(V(kc(C.px), 0, 0)), V(0, 0, -kc(C.py)), e);
      setA(addT, o, V(kc(C.px), 0, -kc(C.py)), e); }

    // 9 · shell
    { const q = M.shell(s.shell.t), e = ex(gS);
      const at = ([x, y]) => V(SH0 + x, SR + y, 0);
      halves[0].position.copy(at(q.a)); halves[1].position.copy(at(q.b));
      cmS.position.copy(at(q.cm)).add(V(0, 0, 0.3));
      const t = s.shell.t, vy = S.vy - M.G * t;
      if (!q.burst) { setA(pA, at(q.a), V(0, 0, 0), 0); setA(pB, at(q.a), V(0, 0, 0), 0); }
      else { setA(pA, at(q.a), V(0, vy, 0).multiplyScalar(P(S.m / 2)), Math.abs(vy) > 0.05 ? 1 : 0); setA(pB, at(q.b), V(S.v2, vy, 0).multiplyScalar(P(S.m / 2))); }
      setA(totS, at(q.cm).add(V(0, 0, 0.3)), V(S.vx, vy, 0).multiplyScalar(P(S.m)), 1); }

    // 10 · rods: a slice dm sweeps along; broken down, the slices part and show their weights
    { const e = ex(gR), x = R.L * Math.min(s.sweep.t / M.SWEEP, 1);
      for (const r of rods) {
        r.slab.position.set(X0R + Math.min(Math.max(x, 0.02), R.L - 0.02), YR, r.z); r.slab.visible = e < 0.5;
        r.sl.forEach((q, i) => { const xs = X0R + q.x + (i - (R.n - 1) / 2) * 0.07 * e, len = q.dm * M.G * W_SCALE;
          setA(r.wts[i], V(xs, YR + RS / 2 + 0.02 + len, r.z), V(0, -len, 0), e); });
      } }

    // 11 · plates
    { const e = ex(gPl), f = Math.min(s.sweep.t / M.SWEEP, 1);
      for (const p of plates) {
        const u = Math.min(Math.max(f * p.H, 0.015), p.H - 0.015);
        p.slab.position.set(p.x0 + u, YP + PT / 2, 0); p.slab.scale.z = Math.max(p.w(u), 0.01); p.slab.visible = e < 0.5;
        p.st.forEach((q, i) => { const xs = p.x0 + q.u + (i - (p.st.length - 1) / 2) * 0.08 * e, len = q.dm * M.G * W_PLATE;
          setA(p.wts[i], V(xs, YP + PT + 0.02 + len, 0), V(0, -len, 0), e); });
      } }

    // 12 · parts: the plug lifts out of the hole; the L's two arms part, keeping the centre of mass
    { const e = ex(gC);
      plug.visible = mkPlug.visible = mkFull.visible = holeLine.visible = e > 0.02;
      plug.position.copy(w2(Hh.c, YP + PT / 2 + 0.55 * e));
      mkPlug.position.copy(plug.position).add(V(0, 0, Hh.r + 0.01)); mkFull.position.copy(w2([0, 0]));
      const dir = [-Math.SQRT1_2, Math.SQRT1_2], k = 0.22 * e;
      arms[0].g.position.set(-dir[0] * k * L2.pB.m / L2.M, -dir[1] * k * L2.pB.m / L2.M, 0);
      arms[1].g.position.set(dir[0] * k * L2.pA.m / L2.M, dir[1] * k * L2.pA.m / L2.M, 0);
      arms.forEach(a => { a.mk.visible = e > 0.02; });
      armLine.visible = e > 0.02;
      const A = arms[0].mk.getWorldPosition(V()), B = arms[1].mk.getWorldPosition(V()), pos = armLine.geometry.attributes.position;
      for (let i = 0; i < 12; i++) { const t0 = -0.1 + 1.2 * i / 12, t1 = -0.1 + 1.2 * (i + 0.55) / 12;
        pos.setXYZ(2 * i, A.x + (B.x - A.x) * t0, A.y + (B.y - A.y) * t0, A.z + 0.01); pos.setXYZ(2 * i + 1, A.x + (B.x - A.x) * t1, A.y + (B.y - A.y) * t1, A.z + 0.01); }
      pos.needsUpdate = true; armLine.geometry.computeBoundingSphere(); }
  }
  return { update, labels };
}
