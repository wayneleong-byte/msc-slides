// The figure: a row of simple scenes on the floor, one per page. A block on a spring, the same
// block hanging from one, pendulums, a car on its springs and a swing. Metres, y up.
// Black arrows are forces (and velocity); the red arrow is the net force / acceleration.
import * as THREE from 'three';
import { part, box, cyl, lines, arrow, setArrow, shadeMat, xAxis, zAxis, V, liveTube } from '../engine/parts.js';
import * as M from './model.js';

export const F_SCALE = 0.06;      // arrow metres per newton (spring scenes)
export const A_SCALE = 0.06;      // arrow metres per m/s²
export const V_SCALE = 0.25;      // arrow metres per m/s
export const P_SCALE = 0.10;      // pendulum: arrow metres per newton, so mg sin θ can be seen
export const TQ_ARC = 6;         // torsion: radians of curved arrow per N·m
export const BAR = 0.6;           // energy bars: metres per joule
export const PAPER = 0.9;         // trace: paper speed, m per second of physics time
export const STATIONS = { spring: 0, hooke: 12, trace: 24, energy: 36, hang: 48, pendulum: 60, double: 74, ignore: 90, ode: 108, physical: 124, torsion: 140, life: 158 };
const S = 0.4;                    // the 1.0 kg block
const S4 = S * Math.cbrt(4);      // a 4.0 kg block of the same material
const UP = V(0, 1, 0);

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at) => labels.push({ cls, html, at });

  // faint graph-paper ground
  const grid = [];
  for (let x = -4; x <= 166; x++) grid.push(x, 0.001, -3, x, 0.001, 4);
  for (let z = -3; z <= 4; z++) grid.push(-4, 0.001, z, 166, 0.001, z);
  lines(root, grid, '#e6e6e2');

  const force = (parent, pal = 'ink') => arrow(parent, pal, { r: 0.022, head: 0.12, headR: 0.06, name: pal === 'red' ? 'Net force' : 'Forces' });
  const thinArrow = (parent, name) => arrow(parent, 'dark', { r: 0.016, head: 0.09, headR: 0.045, name, tone: 'mid' });
  const tip = (a, d = 0.16) => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + d, 0)) : null;
  const ghostMat = new THREE.LineBasicMaterial({ color: '#bdbdc2' });
  const ghostBox = (parent, s) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s, s, s)), ghostMat); l.userData = { noEdge: true }; parent.add(l); return l; };
  const ghostBall = (parent, r) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r, 1)), ghostMat); l.userData = { noEdge: true }; parent.add(l); return l; };
  const block = (parent, s, name = 'Block') => part(parent, box(s, s, s, 0.03), { tone: 'hi', name });

  // a coil spring, reshaped in place whenever its length changes
  function coil(parent, { coils = 14, R = 0.06, wire = 0.01, name = 'Spring' } = {}) {
    const n = coils * 16, geo = liveTube(n + 4, wire);
    const m = part(parent, geo, { tone: 'hi', pal: 'dark', name });
    let last = -1;
    return (a, b) => {
      const len = a.distanceTo(b);
      if (Math.abs(len - last) > 1e-4) {
        last = len;
        // straight leads at both ends, the helix between them
        const lead = Math.min(0.05, len * 0.1), body = len - 2 * lead, pts = [V(0, 0, 0), V(0, lead / 2, 0)];
        for (let i = 0; i <= n; i++) { const u = i / n, ang = u * coils * Math.PI * 2; pts.push(V(R * Math.sin(ang), lead + u * body, R * Math.cos(ang))); }
        pts.push(V(0, len - lead / 2, 0), V(0, len, 0));
        geo.update(pts);
      }
      m.position.copy(a);
      m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    };
  }
  const floorStrip = (x0, x1, z0, z1) => part(root, box(x1 - x0, 0.02, z1 - z0, 0.005), { tone: 'lo', pal: 'board', pos: [(x0 + x1) / 2, 0.01, (z0 + z1) / 2], name: 'Surface' });
  const wall = (x, z, d = 0.7) => part(root, box(0.08, 0.75, d, 0.01), { tone: 'mid', pal: 'board', pos: [x, 0.375 + 0.02, z], name: 'Wall' });

  // a block on a horizontal spring; x0 is the equilibrium position of the block's centre
  function oscillator(g, x0, z, { s = S, wallX = x0 - 1.35, floor = true } = {}) {
    if (floor) floorStrip(wallX, x0 + 1.25, z - 0.45, z + 0.45);
    wall(wallX - 0.04, z, 0.6);
    const b = block(g, s), setCoil = coil(g);
    const y = 0.02 + s / 2;
    return { b, y, c: x => V(x0 + x, y, z), set(x) { b.position.set(x0 + x, y, z); setCoil(V(wallX, y, z), V(x0 + x - s / 2, y, z)); } };
  }
  // equilibrium and ±A marks on the floor
  function marks(x0, z0, z1, A, withLabels = true) {
    const c = []; for (const x of [-A, 0, A]) c.push(x0 + x, 0.024, z0, x0 + x, 0.024, z1);
    lines(root, c, '#6e6e74');
    if (withLabels) {
      label('axis', '<i>x</i> = −<i>A</i>', () => V(x0 - A + 0.04, 0.03, z1 + 0.16));
      label('axis', '<i>x</i> = 0', () => V(x0 + 0.04, 0.03, z1 + 0.16));
      label('axis', '<i>x</i> = +<i>A</i>', () => V(x0 + A + 0.04, 0.03, z1 + 0.16));
    }
  }
  // a pendulum: a group at the pivot that turns by θ; the bob hangs L below
  function pend(g, pivot, L, r, name = 'Bob') {
    const arm = new THREE.Group(); arm.position.copy(pivot); g.add(arm);
    part(arm, cyl(0.007, L, 8).translate(0, -L / 2, 0), { tone: 'hi', pal: 'ink', name: 'String' });
    const bob = part(arm, new THREE.SphereGeometry(r, 40, 28), { tone: 'hi', name, pos: [0, -L, 0] });
    return { arm, bob, at: th => pivot.clone().add(V(L * Math.sin(th), -L * Math.cos(th), 0)), set(th) { arm.rotation.z = th; } };
  }
  function swingGhosts(pivot, L, th0, r) {
    const c = [], n = 40;
    for (const s of [-1, 1]) c.push(pivot.x, pivot.y, pivot.z, pivot.x + L * Math.sin(s * th0), pivot.y - L * Math.cos(s * th0), pivot.z);
    for (let i = 0; i < n; i++) { const a = -th0 + 2 * th0 * i / n, b = -th0 + 2 * th0 * (i + 1) / n; c.push(pivot.x + L * Math.sin(a), pivot.y - L * Math.cos(a), pivot.z, pivot.x + L * Math.sin(b), pivot.y - L * Math.cos(b), pivot.z); }
    for (let y = 0; y < L + 0.05; y += 0.1) c.push(pivot.x, pivot.y - y, pivot.z, pivot.x, pivot.y - Math.min(y + 0.05, L + 0.05), pivot.z);
    lines(root, c, '#bdbdc2');
    for (const s of [-1, 1]) { const gb = ghostBall(root, r); gb.position.set(pivot.x + L * Math.sin(s * th0), pivot.y - L * Math.cos(s * th0), pivot.z); }
  }
  const ceiling = (x, y, w, d = 0.5) => part(root, box(w, 0.08, d, 0.02), { tone: 'mid', pal: 'board', pos: [x, y + 0.04, 0], name: 'Ceiling' });

  // ---------- 1 · what SHM is: a block on a spring, strobed ----------
  const X0 = STATIONS.spring;
  const g0 = asm('spring', root, { title: 'Block on a spring', sub: 'back and forth about equilibrium' });
  const o0 = oscillator(g0, X0, 0);
  marks(X0, -0.45, 0.45, M.A);
  // strobe outlines at equal time steps through half a cycle: bunched at the ends
  for (let k = 0; k <= 8; k++) { const gb = ghostBox(root, S); gb.position.set(X0 + M.A * Math.cos(Math.PI * k / 8), 0.02 + S / 2, 0); }
  const f0 = force(g0), v0 = force(g0), a0 = force(g0, 'red');
  label('vec', '<i>F</i>', () => tip(f0)); label('vec', '<i>v</i>', () => tip(v0)); label('vec red', '<i>a</i>', () => tip(a0));
  label('tick', '1.0 kg', () => V(o0.b.position.x + S / 2, S + 0.16, S / 2));

  // ---------- 2 · Hooke's law ----------
  const X1 = STATIONS.hooke;
  const g1 = asm('hooke', root, { title: 'Restoring force', sub: 'F = −kx, always toward x = 0' });
  const o1 = oscillator(g1, X1, 0);
  marks(X1, -0.45, 0.45, M.A, false);
  const fs1 = force(g1), fg1 = force(g1), fn1 = force(g1), a1 = force(g1, 'red'), dx1 = thinArrow(g1, 'Displacement');
  label('vec', '<i>F</i><sub>s</sub>', () => tip(fs1)); label('vec', '<i>F</i><sub>g</sub>', () => tip(fg1)); label('vec', '<i>F</i><sub>N</sub>', () => tip(fn1));
  label('vec red', '<i>a</i>', () => tip(a1)); label('vec', '<i>x</i>', () => tip(dx1, 0.12));
  label('axis', '0', () => V(X1 + 0.03, 0.03, 0.62));

  // ---------- 3 · x, v, a: the block draws its own graph on a moving paper strip ----------
  const X2 = STATIONS.trace, PZ = 0.42, PLEN = 2.9;
  const g2 = asm('trace', root, { title: 'Its graph', sub: 'position drawn against time' });
  const o2 = oscillator(g2, X2, 0, { floor: false });
  floorStrip(X2 - 1.39, X2 + 1.25, -0.4, 0.4);
  part(root, box(1.5, 0.012, PLEN, 0.004), { tone: 'lo', pal: 'base', pos: [X2, 0.008, PZ + PLEN / 2], name: 'Paper' });
  { const c = []; for (const x of [-M.A, M.A]) c.push(X2 + x, 0.016, PZ, X2 + x, 0.016, PZ + PLEN);
    lines(root, c, '#d0d0cc'); lines(root, [X2, 0.016, PZ, X2, 0.016, PZ + PLEN], '#6e6e74'); }
  const trace = part(g2, liveTube(180, 0.014), { tone: 'hi', pal: 'ink', name: 'Trace' });
  const pen = part(g2, new THREE.SphereGeometry(0.035, 20, 14), { tone: 'hi', pal: 'ink', name: 'Trace' });
  const slope2 = part(g2, box(1, 0.016, 0.016, 0.006), { tone: 'hi', pal: 'red', name: 'Slope' });
  const periodTicks = lines(root, new Array(6 * 6).fill(0), '#8a8a8f');
  periodTicks.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  const v2 = force(g2), a2 = force(g2, 'red');
  label('vec', '<i>v</i>', () => tip(v2)); label('vec red', '<i>a</i>', () => tip(a2));
  label('axis', 'time ↓', () => V(X2 - 0.8, 0.02, PZ + PLEN - 0.2));
  label('axis', '−<i>A</i>', () => V(X2 - M.A - 0.03, 0.02, PZ + PLEN + 0.12)); label('axis', '+<i>A</i>', () => V(X2 + M.A + 0.18, 0.02, PZ + PLEN + 0.12));

  // ---------- 4 · energy: kinetic and spring potential, as bars ----------
  const X3 = STATIONS.energy, BZ = 0;
  const g3 = asm('energy', root, { title: 'Energy in the spring', sub: 'K + U = ½kA², always' });
  const o3 = oscillator(g3, X3, 0);
  marks(X3, -0.45, 0.45, M.A, false);
  const barGeo = box(0.3, 1, 0.3, 0.008).translate(0, 0.5, 0);
  const bar = (x, pal, name, ex = [0, 0, 0]) => part(g3, barGeo, { tone: 'hi', pal, name, pos: [x, 0.02, BZ], ex });
  const BX = X3 + 1.75;   // the bars stand beside the floor, beyond x = +A
  const bK = bar(BX, 'paper', 'Kinetic energy'), bU = bar(BX + 0.45, 'dark', 'Potential energy');
  const sU = bar(BX + 1.0, 'dark', 'Total'), sK = bar(BX + 1.0, 'paper', 'Total');
  { const c = []; for (let x = BX - 0.25; x < BX + 1.2; x += 0.1) c.push(x, 0.02 + M.E * BAR, BZ, x + 0.05, 0.02 + M.E * BAR, BZ); lines(root, c, '#8a8a8f'); }
  label('vec', '<i>K</i>', () => V(BX, 0.02 + M.E * BAR + 0.14, BZ)); label('vec', '<i>U</i>', () => V(BX + 0.45, 0.02 + M.E * BAR + 0.14, BZ));
  label('vec', '<i>K</i> + <i>U</i>', () => V(BX + 1.0, 0.02 + M.E * BAR + 0.14, BZ));
  label('tick', `½<i>kA</i>² = ${M.E.toFixed(1)} J`, () => V(BX - 0.3, 0.02 + M.E * BAR, BZ));
  const v3 = force(g3);
  label('vec', '<i>v</i>', () => tip(v3));

  // ---------- 5 · the same block hanging from a spring ----------
  const X4 = STATIONS.hang, CY = 3.0, TOPY = CY - M.HANG.L0;     // spring's free end, unstretched
  ceiling(X4, CY, 1.6);
  const g4 = asm('hang', root, { title: 'Hanging block', sub: 'a new equilibrium, the same period' });
  const b4 = block(g4, S), coil4 = coil(g4);
  const fs4 = force(g4), fg4 = force(g4), net4 = force(g4, 'red'), d4 = thinArrow(root, 'Stretch');
  const eqEnd = TOPY - M.D;
  { const c = [];
    for (let x = X4 - 0.6; x < X4 + 0.75; x += 0.08) c.push(x, TOPY, 0, x + 0.04, TOPY, 0, x, eqEnd, 0, x + 0.04, eqEnd, 0);
    lines(root, c, '#8a8a8f'); }
  setArrow(d4, V(X4 + 0.6, TOPY, 0), V(0, -M.D, 0));
  label('tick', 'unstretched', () => V(X4 - 0.65, TOPY, 0)); label('tick', 'equilibrium', () => V(X4 - 0.65, eqEnd, 0));
  label('board', '<i>d</i> = <i>mg</i>/<i>k</i>', () => V(X4 + 0.68, TOPY - M.D / 2, 0));
  label('vec', '<i>F</i><sub>s</sub>', () => { const p = tip(fs4); return p && p.add(V(-0.16, -0.1, 0)); }); label('vec', '<i>F</i><sub>g</sub>', () => tip(fg4)); label('vec red', 'Σ<i>F</i>', () => tip(net4));

  // ---------- 6 · the pendulum ----------
  const X5 = STATIONS.pendulum, PIV = V(X5, 3.2, 0);
  ceiling(X5, PIV.y, 1.2);
  const g5 = asm('pendulum', root, { title: 'The pendulum', sub: 'gravity along the arc pulls it back' });
  const p5 = pend(g5, PIV, M.PEND.L, 0.11);
  swingGhosts(PIV, M.PEND.L, M.PEND.th0, 0.11);
  const pf = (pal = 'ink') => arrow(g5, pal, { r: 0.016, head: 0.08, headR: 0.042, name: pal === 'red' ? 'Restoring force' : 'Forces' });
  const t5 = pf(), w5 = pf(), r5 = pf('red');
  const sin5 = arrow(g5, 'dark', { r: 0.012, head: 0.07, headR: 0.034, name: 'Components', tone: 'mid' }), cos5 = arrow(g5, 'dark', { r: 0.012, head: 0.07, headR: 0.034, name: 'Components', tone: 'mid' });
  label('vec', '<i>T</i>', () => t5.visible ? t5.localToWorld(V(-0.12, t5.userData.arrow.shaft.scale.y * 0.6, 0)) : null); label('vec', '<i>mg</i>', () => tip(w5)); label('vec red', '−<i>mg</i> sin θ', () => tip(r5, 0.3));
  label('vec', '<i>mg</i> sin θ', () => tip(sin5, 0.32)); label('vec', '<i>mg</i> cos θ', () => { const p = tip(cos5, 0.14); return p && p.add(V(0.12, 0, 0)); });
  label('axis', 'θ', () => PIV.clone().add(V(0.16, -0.55, 0)));
  label('tick', `<i>L</i> = ${M.PEND.L.toFixed(1)} m`, () => PIV.clone().add(V(-0.08, -0.75, 0)));

  // ---------- 7 · double the period: 4× the mass, 4× the length ----------
  const X6 = STATIONS.double, D = M.DOUBLE, PY6 = 3.4;
  const g6s = asm('springs4', root, { title: 'Mass and period', sub: 'four times the mass, twice the period' });
  const o6a = oscillator(g6s, X6 - 1.9, 0.6), o6b = oscillator(g6s, X6 - 1.9, -0.6, { s: S4 });
  label('tick', '<i>m</i>', () => V(o6a.b.position.x + S / 2, S + 0.14, 0.6 + S / 2)); label('tick', '4<i>m</i>', () => V(o6b.b.position.x + S4 / 2, S4 + 0.14, -0.6 + S4 / 2));
  ceiling(X6 + 1.1, PY6, 1.8);
  const g6p = asm('pend4', root, { title: 'Length and period', sub: 'four times the length, twice the period' });
  const pv6a = V(X6 + 0.6, PY6, 0), pv6b = V(X6 + 1.6, PY6, 0);
  const p6a = pend(g6p, pv6a, D.L, 0.1), p6b = pend(g6p, pv6b, D.L4, 0.1);
  swingGhosts(pv6a, D.L, D.th0, 0.1); swingGhosts(pv6b, D.L4, D.th0, 0.1);
  label('tick', '<i>L</i>', () => pv6a.clone().add(V(-0.08, -D.L / 2, 0))); label('tick', '4<i>L</i>', () => pv6b.clone().add(V(-0.1, -D.L4 / 2, 0)));

  // ---------- 8 · what the period ignores: amplitude, and the pendulum's mass ----------
  const X7 = STATIONS.ignore, I = M.IGNORE, PY7 = 2.7;
  const g7a = asm('amp', root, { title: 'Two amplitudes', sub: 'same spring, same mass, same period' });
  const o7a = oscillator(g7a, X7 - 1.6, 0.6), o7b = oscillator(g7a, X7 - 1.6, -0.6);
  label('tick', `<i>A</i> = ${I.A1.toFixed(2)} m`, () => V(X7 - 1.6 + 1.2, 0.05, 0.6 + 0.45)); label('tick', `<i>A</i> = ${I.A2.toFixed(2)} m`, () => V(X7 - 1.6 + 1.2, 0.05, -0.6 + 0.45));
  ceiling(X7 + 0.95, PY7, 1.6);
  const g7p = asm('bobs', root, { title: 'Two masses', sub: 'same length, same period' });
  const pv7a = V(X7 + 0.5, PY7, 0), pv7b = V(X7 + 1.4, PY7, 0), r7b = 0.1 * Math.cbrt(I.m2 / I.m1);
  const p7a = pend(g7p, pv7a, I.L, 0.1, '1.0 kg bob'), p7b = pend(g7p, pv7b, I.L, r7b, '4.0 kg bob');
  swingGhosts(pv7a, I.L, I.th0, 0.1); swingGhosts(pv7b, I.L, I.th0, r7b);
  label('tick', '1 kg', () => p7a.at(0).add(V(-0.14, -0.22, 0))); label('tick', '4 kg', () => p7b.at(0).add(V(-0.18, -0.28, 0)));


  // ---------- 9 · the SHM equation: two blocks, same spring, started differently ----------
  const X9 = STATIONS.ode, YC9 = 1.45;
  const g9 = asm('starts', root, { title: 'Two starts', sub: 'same ω, different A and φ' });
  g9.userData.focus = () => ({ target: [X9 + 0.05, 0.95, 0], radius: 2.6 });
  const ref9 = new THREE.Group(); g9.add(ref9);
  const o9 = M.STARTS.map((st, i) => {
    const x0 = X9 + (i ? 1.65 : -1.35), o = oscillator(g9, x0, 0);
    marks(x0, -0.45, 0.45, st.A, false);
    const gb = ghostBox(root, S); gb.position.set(x0 + st.x0, 0.02 + S / 2, 0);            // where it starts
    const dx = thinArrow(root, 'Start'); setArrow(dx, V(x0, 0.03, 0.62), V(st.x0, 0, 0));
    label('axis', '<i>x</i><sub>0</sub>', () => V(x0 + st.x0 / 2 + 0.06, 0.03, 0.8));
    label('tick', `<i>A</i> = ${st.A.toFixed(2)} m`, () => V(x0 - st.A - 0.06, 0.03, 0.62));
    if (st.v0) { const va = thinArrow(root, 'Start'); setArrow(va, V(x0 + st.x0 + 0.1, S + 0.42, 0), V(st.v0 * V_SCALE, 0, 0));
      label('vec grey', '<i>v</i><sub>0</sub>', () => V(x0 + st.x0 + 0.1 + st.v0 * V_SCALE - 0.14, S + 0.42, 0)); }
    else label('tick', '<i>v</i><sub>0</sub> = 0', () => V(x0 + st.x0 + 0.3, S + 0.42, 0));
    const v = force(g9); label('vec', '<i>v</i>', () => tip(v));
    // the reference circle (opened): x is the shadow of a point going round at ω, starting at angle φ
    const c = [], n = 64, cx = x0, cy = YC9 + st.A;
    for (let k = 0; k < n; k++) { const a = 2 * Math.PI * k / n, b = 2 * Math.PI * (k + 1) / n; c.push(cx + st.A * Math.cos(a), cy + st.A * Math.sin(a), 0, cx + st.A * Math.cos(b), cy + st.A * Math.sin(b), 0); }
    c.push(cx - st.A - 0.1, cy, 0, cx + st.A + 0.1, cy, 0);                            // the 0 of the angle
    c.push(cx, cy, 0, cx + st.A * Math.cos(st.phi), cy + st.A * Math.sin(st.phi), 0);    // the start radius, at φ
    lines(ref9, c, '#8a8a8f');
    const dot = part(ref9, new THREE.SphereGeometry(0.04, 20, 14), { tone: 'hi', pal: 'red', name: 'Reference circle' });
    const rad = lines(ref9, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], '#c23b2a');
    rad.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    label('board', `φ = ${(st.phi / M.DEG).toFixed(0)}°`, () => ref9.visible ? V(cx + st.A + 0.1, cy + 0.14, 0) : null);
    return { o, x0, v, dot, rad, cx, cy };
  });

  // ---------- 10 · the physical pendulum: a rod, a hoop, and a string of the same length ----------
  const X10 = STATIONS.physical, PY10 = 3.2, RD = M.ROD, HP = M.HOOP;
  ceiling(X10 - 0.1, PY10, 3.0);
  const pin = (g, at) => part(g, zAxis(cyl(0.025, 0.2, 16)), { tone: 'mid', pal: 'dark', pos: at.toArray(), name: 'Pivot' });
  const gs10 = asm('string', root, { title: 'A simple pendulum', sub: 'all its mass at one distance' });
  const pv10s = V(X10 - 1.1, PY10, 0), p10s = pend(gs10, pv10s, RD.L, 0.1);
  gs10.userData.focus = () => ({ target: [pv10s.x, PY10 - 0.85, 0], radius: 1.1 });
  swingGhosts(pv10s, RD.L, RD.th0, 0.1);
  label('tick', `string, <i>L</i> = ${RD.L.toFixed(1)} m`, () => pv10s.clone().add(V(-0.12, -0.9, 0)));
  const g10 = asm('rod', root, { title: 'A swinging rod', sub: 'a physical pendulum: I about the pivot' });
  g10.userData.focus = () => ({ target: [X10 - 0.05, PY10 - 0.85, 0], radius: 1.2 });
  const pv10 = V(X10 - 0.05, PY10, 0), rodArm = new THREE.Group(); rodArm.position.copy(pv10); g10.add(rodArm);
  part(rodArm, box(0.07, RD.L, 0.07, 0.02).translate(0, -RD.L / 2, 0), { tone: 'hi', name: 'Rod' });
  pin(g10, pv10.clone().add(V(0, -0.04, 0)));
  swingGhosts(pv10, RD.L, RD.th0, 0.001);
  const cm10 = part(rodArm, new THREE.SphereGeometry(0.03, 16, 12), { tone: 'hi', pal: 'ink', pos: [0, -RD.d, 0.05], name: 'Centre of mass' });
  const eq10 = part(rodArm, box(0.2, 0.025, 0.09, 0.008), { tone: 'hi', pal: 'red', pos: [0, -RD.Leq, 0], name: 'Keeps time with a 2L/3 string' });
  const w10 = pf => arrow(g10, pf, { r: 0.016, head: 0.08, headR: 0.042, name: pf === 'red' ? 'Restoring' : 'Weight', tone: pf === 'dark' ? 'mid' : 'hi' });
  const mg10 = w10('ink'), sin10 = w10('red');
  label('vec', '<i>mg</i>', () => tip(mg10)); label('vec red', '<i>mg</i> sin θ', () => tip(sin10, 0.32));
  label('tick', 'cm', () => rodArm.localToWorld(V(-0.07, -RD.d, 0)));
  label('tick', `rod, <i>L</i> = ${RD.L.toFixed(1)} m`, () => pv10.clone().add(V(0.62, -1.55, 0)));
  label('axis', '2<i>L</i>/3', () => ex(g10) > 0.3 ? rodArm.localToWorld(V(-0.14, -RD.Leq, 0)) : null);
  label('axis', '<i>d</i> = <i>L</i>/2', () => ex(g10) > 0.3 ? rodArm.localToWorld(V(-0.08, -RD.d / 2, 0)) : null);
  const g10h = asm('hoop', root, { title: 'A hoop on a nail', sub: 'I = mR² + mR² by the parallel axes' });
  g10h.userData.focus = () => ({ target: [X10 + 1.25, PY10 - 0.5, 0], radius: 0.85 });
  const pv10h = V(X10 + 1.25, PY10 - 0.04, 0), hoopArm = new THREE.Group(); hoopArm.position.copy(pv10h); g10h.add(hoopArm);
  part(hoopArm, new THREE.TorusGeometry(HP.R, 0.022, 14, 96).translate(0, -HP.R - 0.022, 0), { tone: 'hi', name: 'Hoop' });
  pin(g10h, pv10h.clone().add(V(0, -0.012, 0)));
  part(root, cyl(0.012, 0.04, 8), { tone: 'mid', pal: 'dark', pos: [pv10h.x, PY10 - 0.02, 0], name: 'Nail' });
  { const c = []; for (let y = 0; y < 2 * HP.R + 0.05; y += 0.1) c.push(pv10h.x, pv10h.y - y, 0, pv10h.x, pv10h.y - Math.min(y + 0.05, 2 * HP.R + 0.05), 0); lines(root, c, '#bdbdc2'); }
  const cmh = part(hoopArm, new THREE.SphereGeometry(0.03, 16, 12), { tone: 'hi', pal: 'ink', pos: [0, -HP.R - 0.022, 0], name: 'Centre of mass' });
  const dh = lines(hoopArm, [0, 0, 0, 0, -HP.R - 0.022, 0], '#6e6e74');
  const mgh = arrow(g10h, 'ink', { r: 0.014, head: 0.07, headR: 0.036, name: 'Weight' });
  label('vec', '<i>mg</i>', () => tip(mgh));
  label('tick', `hoop, <i>R</i> = ${HP.R.toFixed(2)} m`, () => pv10h.clone().add(V(-HP.R - 0.1, -HP.R, 0)));
  label('axis', '<i>d</i> = <i>R</i>', () => ex(g10h) > 0.3 ? hoopArm.localToWorld(V(-0.04, -HP.R / 2, 0)) : null);

  // ---------- 11 · the torsion pendulum: a disc twisting on a wire ----------
  const X11 = STATIONS.torsion, TS = M.TORS, PY11 = 2.75, DY = 1.55, DH = 0.05;
  ceiling(X11, PY11, 1.0);
  const g11 = asm('disc', root, { title: 'A disc on a wire', sub: 'twist it and it twists back: τ = −κθ' });
  g11.userData.focus = () => ({ target: [X11, DY + 0.15, 0], radius: 0.7 });
  part(g11, cyl(0.006, PY11 - DY - DH / 2, 8), { tone: 'hi', pal: 'ink', pos: [X11, (PY11 + DY + DH / 2) / 2, 0], name: 'Wire' });
  const disc = new THREE.Group(); disc.position.set(X11, DY, 0); g11.add(disc);
  part(disc, cyl(TS.R, DH, 64), { tone: 'hi', name: 'Disc' });
  part(disc, box(TS.R - 0.03, 0.012, 0.035, 0.004), { tone: 'hi', pal: 'dark', pos: [(TS.R - 0.03) / 2 + 0.015, DH / 2 + 0.004, 0], name: 'Mark' });
  { const c = [], y = DY + DH / 2 + 0.012, r = TS.R + 0.16, n = 40;   // the rest line, the two turning lines and the arc between them
    for (const a of [-TS.th0, 0, TS.th0]) c.push(X11, y, 0, X11 + r * Math.cos(a), y, -r * Math.sin(a));
    for (let k = 0; k < n; k++) { const a = -TS.th0 + 2 * TS.th0 * k / n, b = -TS.th0 + 2 * TS.th0 * (k + 1) / n; c.push(X11 + r * Math.cos(a), y, -r * Math.sin(a), X11 + r * Math.cos(b), y, -r * Math.sin(b)); }
    lines(root, c, '#9a9aa0'); }
  label('axis', 'θ = 0', () => V(X11 + TS.R + 0.42, DY + 0.1, 0));
  label('axis', `±${(TS.th0 / M.DEG).toFixed(0)}°`, () => V(X11 + (TS.R + 0.2) * Math.cos(TS.th0) + 0.14, DY + 0.04, -(TS.R + 0.2) * Math.sin(TS.th0)));
  label('tick', `κ = ${TS.kappa} N·m/rad`, () => V(X11 - 0.06, DY + 0.6, 0));
  label('tick', `${TS.M.toFixed(1)} kg disc, <i>R</i> = ${TS.R.toFixed(2)} m`, () => V(X11 - TS.R - 0.08, DY - 0.12, 0));
  // the restoring torque (opened): a red curved arrow round the rim, back toward θ = 0
  const tq = new THREE.Group(); g11.add(tq);
  const tqArc = part(tq, liveTube(24, 0.014), { tone: 'hi', pal: 'red', name: 'Restoring torque' });
  const tqTip = part(tq, new THREE.ConeGeometry(0.03, 0.08, 20), { tone: 'hi', pal: 'red', name: 'Restoring torque' });
  const TQR = TS.R + 0.07, TQY = DY + DH / 2 + 0.03;
  let tqMid = 0;
  label('vec red', 'τ', () => tq.visible ? V(X11 + (TQR + 0.12) * Math.cos(tqMid), TQY + 0.08, -(TQR + 0.12) * Math.sin(tqMid)) : null);

  // ---------- 12 · everyday: a car bouncing on its springs, a child on a swing ----------
  const X8 = STATIONS.life, C = M.CAR, BODY0 = 0.85;    // body's underside at equilibrium
  part(root, box(7, 0.03, 3.0, 0.01), { tone: 'lo', pal: 'board', pos: [X8 - 1.5, 0.015, 0], name: 'Road' });
  const g8c = asm('car', root, { title: 'A car on its springs', sub: `${C.m} kg on four springs, no shock absorbers` });
  const carBody = new THREE.Group(); g8c.add(carBody);
  part(carBody, box(4.2, 0.7, 1.7, 0.18), { tone: 'hi', pos: [0, 0.35, 0], name: 'Body' });
  part(carBody, box(2.2, 0.6, 1.5, 0.2), { tone: 'hi', pos: [-0.3, 0.98, 0], name: 'Cabin' });
  const carSprings = [], CXc = X8 - 2.2;
  for (const [x, z] of [[1.35, 1.0], [1.35, -1.0], [-1.35, 1.0], [-1.35, -1.0]]) {
    part(g8c, zAxis(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 28)), { tone: 'mid', pal: 'dark', pos: [CXc + x, 0.36, z], name: 'Wheels' });
    part(g8c, zAxis(new THREE.CylinderGeometry(0.15, 0.15, 0.26, 20)), { tone: 'mid', pos: [CXc + x, 0.36, z], name: 'Wheels' });
    carSprings.push([coil(g8c, { coils: 6, R: 0.08, wire: 0.014, name: 'Springs' }), V(CXc + x, 0.36, z * 0.72)]);
  }
  const a8 = force(g8c, 'red');
  label('vec red', '<i>a</i>', () => tip(a8));
  const SW = M.SWING, PV8 = V(X8 + 1.0, 3.0, 0);
  part(root, box(0.12, 0.12, 1.2, 0.03), { tone: 'mid', pal: 'board', pos: [PV8.x, PV8.y + 0.06, 0], name: 'Branch' });
  const g8s = asm('swing', root, { title: 'A swing', sub: `a pendulum ${SW.L.toFixed(1)} m long` });
  const swingArm = new THREE.Group(); swingArm.position.copy(PV8); g8s.add(swingArm);
  for (const z of [-0.28, 0.28]) part(swingArm, cyl(0.01, SW.L, 8).translate(0, -SW.L / 2, z), { tone: 'hi', pal: 'ink', name: 'Ropes' });
  part(swingArm, box(0.45, 0.05, 0.7, 0.02), { tone: 'hi', pal: 'dark', pos: [0, -SW.L, 0], name: 'Seat' });
  part(swingArm, box(0.32, 0.5, 0.36, 0.06), { tone: 'hi', pos: [0, -SW.L + 0.27, 0], name: 'Child' });
  swingGhosts(PV8, SW.L, SW.th0, 0.001);
  label('tick', `${SW.m} kg`, () => swingArm.localToWorld(V(-0.2, -SW.L + 0.62, 0.2)));
  label('tick', `${C.m} kg`, () => carBody.localToWorld(V(1.3, 0.35, 0.9)));

  // ---------- per-frame ----------
  const shrink = (mesh, g) => mesh.scale.setScalar(1 - 0.85 * Math.max(g.userData.explode, 0));
  const ex = g => Math.max(g.userData.explode, 0);
  function update(t) {
    // 1 · spring
    { const s = M.spring(t), c = o0.c(s.x); o0.set(s.x);
      setArrow(f0, c, V(s.F * F_SCALE, 0, 0));
      const e = ex(g0);
      setArrow(v0, c.clone().add(V(0, S / 2 + 0.12, 0)), V(s.v * V_SCALE, 0, 0), e);
      setArrow(a0, c.clone().add(V(0, S / 2 + 0.3, 0)), V(s.a * A_SCALE, 0, 0), e); }

    // 2 · Hooke
    { const s = M.spring(t), c = o1.c(s.x); o1.set(s.x); shrink(o1.b, g1);
      setArrow(fs1, c, V(s.F * F_SCALE, 0, 0)); setArrow(fg1, c, V(0, -M.WEIGHT * F_SCALE, 0)); setArrow(fn1, c, V(0, M.WEIGHT * F_SCALE, 0));
      setArrow(a1, c.clone().add(V(0, S / 2 + 0.16, 0)), V(s.a * A_SCALE, 0, 0));
      setArrow(dx1, V(X1, 0.03, 0.62), V(s.x, 0, 0)); }

    // 3 · trace
    { const s = M.spring(t), c = o2.c(s.x); o2.set(s.x);
      setArrow(v2, c.clone().add(V(0, S / 2 + 0.12, 0)), V(s.v * V_SCALE, 0, 0));
      setArrow(a2, c.clone().add(V(0, S / 2 + 0.32, 0)), V(s.a * A_SCALE, 0, 0));
      const pts = [], n = 180, win = PLEN / PAPER;
      for (let i = 0; i <= n; i++) { const u = i / n * win; pts.push(V(X2 + M.spring(t - u).x, 0.02, PZ + u * PAPER)); }
      trace.geometry.update(pts);
      pen.position.set(X2 + s.x, 0.03, PZ);
      // the slope of the trace at the pen is the velocity: dx per dz = v / paper speed
      const e = ex(g2), dir = V(s.v, 0, -PAPER).normalize();
      slope2.visible = e > 0.02; slope2.position.set(X2 + s.x, 0.04, PZ + 0.0); slope2.scale.x = 1.0 * e;
      slope2.quaternion.setFromUnitVectors(V(1, 0, 0), dir);
      // a tick across the paper at every full period
      const a = periodTicks.geometry.attributes.position, k0 = Math.floor(t / M.T0);
      for (let k = 0; k < 6; k++) { const z = PZ + (t - (k0 - k) * M.T0) * PAPER, on = z <= PZ + PLEN;
        a.setXYZ(2 * k, X2 + 0.62, on ? 0.017 : -1, on ? z : PZ); a.setXYZ(2 * k + 1, X2 + 0.75, on ? 0.017 : -1, on ? z : PZ); }
      a.needsUpdate = true; periodTicks.geometry.computeBoundingSphere(); }

    // 4 · energy
    { const s = M.spring(t), c = o3.c(s.x); o3.set(s.x);
      setArrow(v3, c.clone().add(V(0, S / 2 + 0.12, 0)), V(s.v * V_SCALE, 0, 0));
      const hk = s.KE * BAR, hu = s.U * BAR, e = ex(g3);
      bK.scale.y = Math.max(hk, 1e-4); bU.scale.y = Math.max(hu, 1e-4); bK.visible = hk > 0.004; bU.visible = hu > 0.004;
      sU.scale.y = Math.max(hu, 1e-4); sU.visible = hu > 0.004;
      sK.scale.y = Math.max(hk, 1e-4); sK.visible = hk > 0.004; sK.position.set(BX + 1.0, 0.02 + hu + 0.12 * e, BZ); }

    // 5 · hanging
    { const s = M.hang(t), end = TOPY - s.stretch, c = V(X4, end - S / 2, 0);
      b4.position.copy(c); coil4(V(X4, CY, 0), V(X4, end, 0)); shrink(b4, g4);
      setArrow(fs4, c, V(0, s.Fs * F_SCALE, 0)); setArrow(fg4, c, V(0, -M.WEIGHT * F_SCALE, 0));
      setArrow(net4, c.clone().add(V(S / 2 + 0.2, 0, 0)), V(0, s.net * F_SCALE, 0)); }

    // 6 · pendulum
    { const p = M.pendulum(t), th = p.th, c = p5.at(th); p5.set(th); shrink(p5.bob, g5);
      const out = V(Math.sin(th), -Math.cos(th), 0), tan = V(Math.cos(th), Math.sin(th), 0);   // away from the pivot; along the arc (+θ)
      const e = ex(g5);
      setArrow(t5, c, out.clone().multiplyScalar(-p.tension * P_SCALE));
      setArrow(w5, c, V(0, -M.PEND.m * M.G * P_SCALE, 0), 1 - e);   // opened: the weight is replaced by its two parts
      setArrow(r5, c.clone().addScaledVector(out, 0.18), tan.clone().multiplyScalar(p.restoring * P_SCALE), 1 - e);
      setArrow(sin5, c, tan.clone().multiplyScalar(p.restoring * P_SCALE), e);
      setArrow(cos5, c, out.clone().multiplyScalar(p.along * P_SCALE), e); }

    // 7 · double
    { o6a.set(M.spring(t, M.A, D.m).x); o6b.set(M.spring(t, M.A, D.m4).x);
      p6a.set(M.pendulum(t, D.L, D.th0).th); p6b.set(M.pendulum(t, D.L4, D.th0).th); }

    // 8 · ignore
    { o7a.set(M.spring(t, I.A1).x); o7b.set(M.spring(t, I.A2).x);
      p7a.set(M.pendulum(t, I.L, I.th0, I.m1).th); p7b.set(M.pendulum(t, I.L, I.th0, I.m2).th); }

    // 9 · two starts
    { const e = ex(g9); ref9.visible = e > 0.3;
      o9.forEach((q, i) => { const s = M.start(i, t), c = q.o.c(s.x); q.o.set(s.x);
        setArrow(q.v, c.clone().add(V(0, S / 2 + 0.12, 0)), V(s.v * V_SCALE, 0, 0));
        const st = M.STARTS[i], psi = M.W * t + st.phi, px = q.cx + st.A * Math.cos(psi), py = q.cy + st.A * Math.sin(psi);
        q.dot.position.set(px, py, 0);
        const a = q.rad.geometry.attributes.position;
        a.setXYZ(0, q.cx, q.cy, 0); a.setXYZ(1, px, py, 0); a.setXYZ(2, px, py, 0); a.setXYZ(3, px, S + 0.02, 0);   // radius, and the drop to the block
        a.needsUpdate = true; q.rad.geometry.computeBoundingSphere(); }); }

    // 10 · physical pendulums
    { p10s.set(M.pendulum(t, RD.L, RD.th0).th);
      const r = M.physical(RD, t), e = ex(g10); rodArm.rotation.z = r.th;
      const c = rodArm.localToWorld(V(0, -RD.d, 0.05)), tan = V(Math.cos(r.th), Math.sin(r.th), 0);
      setArrow(mg10, c, V(0, -RD.m * M.G * P_SCALE, 0));
      setArrow(sin10, c, tan.multiplyScalar(-RD.m * M.G * Math.sin(r.th) * P_SCALE), e);
      eq10.visible = e > 0.3;
      const h = M.physical(HP, t), eh = ex(g10h); hoopArm.rotation.z = h.th;
      cmh.visible = dh.visible = eh > 0.3;
      setArrow(mgh, hoopArm.localToWorld(V(0, -HP.R - 0.022, 0)), V(0, -HP.m * M.G * P_SCALE, 0), eh); }

    // 11 · torsion
    { const r = M.torsion(t), e = ex(g11); disc.rotation.y = r.th;
      tq.visible = e > 0.05 && Math.abs(r.torque) > 0.01;
      if (tq.visible) {
        const span = Math.abs(r.torque) * TQ_ARC * e, sgn = Math.sign(r.torque), a0 = r.th, pts = [];
        for (let k = 0; k <= 24; k++) { const a = a0 + sgn * span * k / 24; pts.push(V(X11 + TQR * Math.cos(a), TQY, -TQR * Math.sin(a))); }
        tqArc.geometry.update(pts);
        const a1 = a0 + sgn * span, dir = V(-Math.sin(a1), 0, -Math.cos(a1)).multiplyScalar(sgn);   // tangent, in the direction of turning
        tqTip.position.set(X11 + TQR * Math.cos(a1), TQY, -TQR * Math.sin(a1)).addScaledVector(dir, 0.04);
        tqTip.quaternion.setFromUnitVectors(UP, dir); tqMid = a0 + sgn * span / 2; } }

    // 12 · car and swing
    { const s = M.shm(C.A, Math.sqrt(C.k / C.m), t), yb = BODY0 + s.x;
      carBody.position.set(CXc, yb, 0);
      for (const [set, base] of carSprings) set(base, V(base.x, yb, base.z));
      setArrow(a8, V(CXc + 0.4, yb + 1.45, 0), V(0, s.a * A_SCALE, 0));
      swingArm.rotation.z = M.pendulum(t, SW.L, SW.th0, SW.m).th; }
  }
  return { update, labels };
}
