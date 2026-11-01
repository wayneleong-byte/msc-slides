// The figure: twelve simple scenes in a row on the floor, one per page. The object, the forces
// on it as solid arrows from its centre (black: single forces; red: net force), and live
// energy bars beside it (blue: kinetic, amber: potential, grey: thermal, white: total).
// Metres, y up. Every position, arrow and bar comes from model.js.
import * as THREE from 'three';
import { part, box, cyl, lines, arrow, setArrow, shadeMat, xAxis, zAxis, PALETTE, V } from '../engine/parts.js';
import * as M from './model.js';

// two hues the energy bars need (kinetic and potential), added for this chapter only
PALETTE.blue = ['#9cbde8', '#6f9bd8', '#4f7cbd'];
PALETTE.amber = ['#f3d68e', '#e4b552', '#bf9030'];
export const BAR_COLORS = { K: '#6f9bd8', U: '#e4b552', E: '#ffffff', th: '#86868c', W: '#4a4a50' };

export const STATIONS = { pull: 0, toss: 12, whirl: 24, car: 38, drop: 62, spring: 74, push: 86, pendulum: 100, bead: 112, bond: 126, slide: 140, lift: 152 };
// arrow scales, metres of arrow per newton (or per m/s for velocity), and bar scales, metres per joule
export const SC = {
  pull: { F: 0.04 },
  toss: { F: 0.1, v: 0.15, E: 0.12 },
  whirl: { F: 0.15, v: 0.25 },
  car: { F: 0.25 / 1000, E: 0.075 / 1000 },
  drop: { F: 0.1, v: 0.08, E: 0.1 },
  spring: { F: 0.04, E: 0.3 },
  pendulum: { F: 0.08, v: 0.12, E: 0.3 },
  slide: { F: 0.05, E: 0.08 },
  lift: { F: 0.008 },
  push: { F: 0.05, E: 0.03 },          // the F(x) board behind uses the same 5 cm per newton
  bead: { F: 0.3 },
  bond: { r: 1e10, U: 1.2, F: 0.08 },   // drawn 0.1 nm = 1 m; 1.2 m per eV; 8 cm per nN
};

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at) => labels.push({ cls, html, at });
  const small = (html, px = 17) => `<span style="font-size:${px}px">${html}</span>`;

  // faint graph-paper ground
  const grid = [];
  for (let x = -4; x <= 160; x++) grid.push(x, 0.001, -3, x, 0.001, 3);
  for (let z = -3; z <= 3; z++) grid.push(-4, 0.001, z, 160, 0.001, z);
  lines(root, grid, '#e6e6e2');

  const smooth = (x0, x1, z0 = -0.9, z1 = 0.9) => part(root, box(x1 - x0, 0.02, z1 - z0, 0.005), { tone: 'lo', pal: 'board', pos: [(x0 + x1) / 2, 0.01, (z0 + z1) / 2], name: 'Surface' });
  const rough = (x0, x1, z0 = -0.9, z1 = 0.9) => {
    smooth(x0, x1, z0, z1);
    const h = [];
    for (let x = x0 + 0.05; x < x1; x += 0.09) h.push(x, 0.022, z1, x - 0.12, 0.022, z1 - 0.12);
    lines(root, h, '#9a9aa0');
  };
  const block = (parent, s, name = 'Block') => part(parent, box(s, s, s, 0.03), { tone: 'hi', name });
  const ball = (parent, r, name = 'Ball') => part(parent, new THREE.SphereGeometry(r, 40, 24), { tone: 'hi', name });
  const force = (parent, red = false) => arrow(parent, red ? 'red' : 'ink', { r: 0.022, head: 0.12, headR: 0.06, name: 'Forces' });
  const thinArrow = (parent, name = 'Components') => arrow(parent, 'dark', { r: 0.016, head: 0.1, headR: 0.05, name, tone: 'mid' });
  const tip = a => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + 0.16, 0)) : null;
  const ghostBox = s => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s, s, s)), new THREE.LineBasicMaterial({ color: '#bdbdc2' })); l.userData = { noEdge: true }; root.add(l); return l; };
  const rod = (parent, r = 0.008, pal = 'ink', name = 'String') => part(parent, new THREE.CylinderGeometry(r, r, 1, 8), { tone: 'hi', pal, name });
  const stretch = (m, a, b) => { m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, Math.max(a.distanceTo(b), 1e-4), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); };
  const dashed = (pts, color = '#9a9aa0') => { const c = []; for (let i = 0; i + 1 < pts.length; i += 2) c.push(...pts[i].toArray(), ...pts[i + 1].toArray()); return lines(root, c, color); };
  const dashLine = (a, b, n = 24) => { const p = []; for (let i = 0; i < n; i++) { p.push(a.clone().lerp(b, i / n), a.clone().lerp(b, (i + 0.5) / n)); } return dashed(p); };

  // energy bars: one upright box per quantity, height ∝ energy (negative values hang below the base)
  function bars(parent, x0, z, base, items, scale, labelY = base - 0.2) {
    const w = 0.26, gap = 0.16;
    const ms = items.map(([pal, html], i) => {
      const bx = x0 + i * (w + gap);
      const m = part(parent, new THREE.BoxGeometry(w, 1, w), { tone: 'hi', pal, name: 'Energy bars' });
      label('vec', small(html), () => V(bx, labelY, z + w / 2));
      return { m, bx };
    });
    lines(root, [x0 - w, base + 0.002, z, x0 + (items.length - 1) * (w + gap) + w, base + 0.002, z], '#6e6e74');
    return vals => ms.forEach(({ m, bx }, i) => {
      const h = vals[i] * scale;
      m.visible = Math.abs(h) > 0.004;
      m.scale.y = Math.max(Math.abs(h), 1e-3);
      m.position.set(bx, base + h / 2, z);
    });
  }
  const opened = g => Math.max(g.userData.explode, 0);
  const samplesV = (n, fn, a, b) => Array.from({ length: n + 1 }, (_, i) => fn(a + (b - a) * i / n));
  // a dashed segment whose ends move each frame
  const liveDash = (parent, n, color = '#6e6e74') => {
    const l = lines(parent, new Array(n * 6).fill(0), color), pos = l.geometry.attributes.position;
    return (a, b, on = true) => { l.visible = on; if (!on) return; for (let i = 0; i < n; i++) { const p = a.clone().lerp(b, i / n), q = a.clone().lerp(b, (i + 0.5) / n); pos.setXYZ(2 * i, p.x, p.y, p.z); pos.setXYZ(2 * i + 1, q.x, q.y, q.z); } pos.needsUpdate = true; l.geometry.computeBoundingSphere(); };
  };
  // a flat shaded area under a curve, filled from a up to a moving x: fn(x) → [X, Ybottom, Ytop]
  const areaMesh = (n, fn, a, b, z) => {
    const pos = [], idx = [];
    for (let i = 0; i <= n; i++) { const [X, y0, y1] = fn(a + (b - a) * i / n); pos.push(X, y0, z, X, y1, z); if (i < n) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#86868c', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    m.userData = { noEdge: true }; root.add(m);
    return x => g.setDrawRange(0, 6 * Math.round(Math.min(Math.max((x - a) / (b - a), 0), 1) * n));
  };

  // ---------- 1 · work: a box pulled by a rope at 30° ----------
  const XA = STATIONS.pull, SA = 0.6, xA0 = XA - 1.2;
  smooth(XA - 2.0, XA + 2.8);
  const gA = asm('pull', root, { title: 'Box pulled by a rope', sub: 'only the part of F along Δx does work' });
  const bA = block(gA, SA, '4.0 kg box');
  const ropeA = rod(gA, 0.012, 'ink', 'Rope');
  const FA = force(gA), fgA = force(gA), fnA = force(gA), fxA = thinArrow(gA), fyA = thinArrow(gA), dxA = thinArrow(gA, 'Displacement');
  const ghostA = ghostBox(SA); ghostA.position.set(xA0, 0.02 + SA / 2, 0);
  label('vec', 'F', () => tip(FA)?.add(V(-0.12, 0.16, 0))); label('vec', 'F<sub>g</sub>', () => tip(fgA)); label('vec', 'F<sub>N</sub>', () => tip(fnA));
  label('vec', small('F cos θ', 19), () => fxA.visible ? tip(fxA).add(V(0.25, -0.12, 0)) : null); label('vec', small('F sin θ', 19), () => fyA.visible ? tip(fyA).add(V(0.4, 0.02, 0)) : null);
  label('vec', 'Δ<i>x</i>', () => tip(dxA)); label('tick', 'θ = 30°', () => bA.position.clone().add(V(1.45, 0.3, 0)));

  // ---------- 2 · the sign of work: a ball thrown up ----------
  const XB = STATIONS.toss, RB = 0.15;
  const gB = asm('toss', root, { title: 'Ball thrown up', sub: 'gravity takes energy, then gives it back' });
  const bB = ball(gB, RB, '0.50 kg ball');
  const vB = force(gB), fgB = force(gB), dyB = thinArrow(gB, 'Displacement');
  label('vec', '<b>v</b>', () => tip(vB)); label('vec', 'F<sub>g</sub>', () => tip(fgB)); label('vec', 'Δ<i>y</i>', () => tip(dyB));
  { const ring = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, b = (i + 1) / 48 * Math.PI * 2; ring.push(XB + Math.cos(a) * 0.24, 0.003, Math.sin(a) * 0.24, XB + Math.cos(b) * 0.24, 0.003, Math.sin(b) * 0.24); } lines(root, ring, '#6e6e74'); }
  const barsB = bars(gB, XB + 1.5, 0, 1.45, [['dark', 'K<sub>0</sub>'], ['ink', 'W<sub>g</sub>'], ['blue', 'K']], SC.toss.E, 1.45 - M.toss(0).K * SC.toss.E - 0.2);
  let tossState = M.toss(0);
  label('board', small('gravity: <b>negative</b> work', 16), () => tossState.v > 0.05 ? bB.position.clone().add(V(0.35, 0.05, 0)) : null);
  label('board', small('gravity: <b>positive</b> work', 16), () => tossState.v < -0.05 ? bB.position.clone().add(V(0.35, 0.05, 0)) : null);

  // ---------- 3 · no work: a ball whirled on a string over a smooth table ----------
  const XC = STATIONS.whirl, RC = 0.15, R0 = M.WHIRL.r;
  smooth(XC - 1.45, XC + 1.45, -1.45, 1.45);
  const gC = asm('whirl', root, { title: 'Ball on a string', sub: 'the pull is always sideways to the motion' });
  part(gC, cyl(0.05, 0.22, 20), { tone: 'hi', pal: 'dark', pos: [XC, 0.13, 0], name: 'Peg' });
  const bC = ball(gC, RC, '0.50 kg ball'), strC = rod(gC);
  const vC = force(gC), tC = force(gC);
  const circ = []; for (let i = 0; i < 64; i += 1) { const a = i / 64 * 2 * Math.PI, b = (i + 0.5) / 64 * 2 * Math.PI; circ.push(XC + R0 * Math.cos(a), 0.025, R0 * Math.sin(a), XC + R0 * Math.cos(b), 0.025, R0 * Math.sin(b)); }
  lines(root, circ, '#a8a8ae');
  const corner = lines(gC, new Array(12).fill(0), '#2c2c30');
  const strobeC = Array.from({ length: 3 }, () => [thinArrow(gC, 'Strobe'), thinArrow(gC, 'Strobe'), part(gC, new THREE.SphereGeometry(RC, 28, 16), { tone: 'lo', name: 'Strobe', mat: shadeMat('paper', { opacity: 0.45 }) })]);
  label('vec', '<b>v</b>', () => tip(vC)); label('vec', 'T', () => tip(tC));

  // ---------- 4 · work–energy theorem: a car speeding up ----------
  const XD = STATIONS.car;
  part(root, box(16, 0.03, 3.4, 0.01), { tone: 'lo', pal: 'board', pos: [XD + 5, 0.015, 0], name: 'Road' });
  { const dashes = []; for (let x = XD - 3; x < XD + 13; x += 2) dashes.push(x, 0.035, 0, x + 1, 0.035, 0); lines(root, dashes, '#9a9aa0'); }
  const gD = asm('car', root, { title: 'Car speeding up', sub: 'net work in, kinetic energy out' });
  const carD = new THREE.Group(); gD.add(carD);
  part(carD, box(4.2, 0.7, 1.8, 0.18), { tone: 'hi', pos: [0, 0.75, 0], name: 'Body' });
  part(carD, box(2.2, 0.6, 1.6, 0.2), { tone: 'hi', pos: [-0.3, 1.38, 0], name: 'Cabin' });
  for (const [x, z] of [[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]]) {
    part(carD, zAxis(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 28)), { tone: 'mid', pal: 'dark', pos: [x, 0.36, z], name: 'Wheels' });
    part(carD, zAxis(new THREE.CylinderGeometry(0.17, 0.17, 0.28, 20)), { tone: 'mid', pos: [x, 0.36, z], name: 'Wheels' });
  }
  const fD = force(gD), wD = force(gD), nD = force(gD), netD = force(gD, true), dxD = thinArrow(gD, 'Displacement');
  label('vec', 'F', () => tip(fD)); label('vec', 'F<sub>g</sub>', () => tip(wD)); label('vec', 'F<sub>N</sub>', () => tip(nD)); label('vec red', 'ΣF', () => tip(netD)); label('vec', 'Δ<i>x</i>', () => tip(dxD));
  const barsD = bars(gD, XD + 10.6, -1.2, 0.02, [['ink', 'W<sub>net</sub>'], ['blue', 'K']], SC.car.E);

  // ---------- 5 · gravitational PE: a ball dropped from 3.0 m ----------
  const XE = STATIONS.drop, RE = 0.15;
  const gE = asm('drop', root, { title: 'Dropped ball', sub: 'height turns into speed' });
  const bE = ball(gE, RE, '0.50 kg ball');
  const fgE = force(gE), vE = force(gE);
  label('vec', 'F<sub>g</sub>', () => tip(fgE)); label('vec', '<b>v</b>', () => tip(vE));
  { const ax = XE - 0.65, t = [ax, 0, 0, ax, M.DROP.h + 0.2, 0];
    for (let i = 0; i <= 30; i++) { const l = i % 10 === 0 ? 0.14 : i % 5 === 0 ? 0.09 : 0.05; t.push(ax, i * 0.1, 0, ax + l, i * 0.1, 0); }
    lines(root, t, '#6e6e74');
    for (const q of [0, 1, 2, 3]) label('tick', `${q} m`, () => V(ax - 0.06, q, 0)); }
  dashLine(V(XE - 0.65, 0.006, 0.4), V(XE + 2.1, 0.006, 0.4), 24);
  label('board', small('<i>U</i><sub>g</sub> = 0', 16), () => V(XE + 2.15, 0.006, 0.4));
  const ref2 = new THREE.Group(); root.add(ref2);
  { const p = []; const a = V(XE - 1.2, M.DROP.ref2, 0), b = V(XE + 0.6, M.DROP.ref2, 0); for (let i = 0; i < 18; i++) p.push(...a.clone().lerp(b, i / 18).toArray(), ...a.clone().lerp(b, (i + 0.5) / 18).toArray()); lines(ref2, p, '#2c2c30'); }
  label('board', small('or <i>U</i><sub>g</sub> = 0 here', 16), () => ref2.visible ? V(XE - 0.5, M.DROP.ref2 + 0.13, 0) : null);
  const barsE = bars(gE, XE + 1.0, 0, 0.02, [['amber', 'U<sub>g</sub>'], ['blue', 'K'], ['paper', 'E']], SC.drop.E);

  // ---------- 6 · spring PE: a block slides into a spring ----------
  const XF = STATIONS.spring, SF = 0.5, wallX = XF + 1.4, Lfree = 1.0, endX = wallX - Lfree;
  smooth(XF - 2.4, wallX);
  part(root, box(0.16, 1.0, 1.4, 0.02), { tone: 'mid', pal: 'board', pos: [wallX + 0.08, 0.5, 0], name: 'Wall' });
  const gF = asm('spring', root, { title: 'Block and spring', sub: 'kinetic energy stored, then given back' });
  const bF = block(gF, SF, '2.0 kg block');
  const coil = (() => { const pts = []; const turns = 9, n = 400; for (let i = 0; i <= n; i++) { const u = i / n, a = u * turns * 2 * Math.PI; pts.push(V(u, 0.11 * Math.sin(a), 0.11 * Math.cos(a))); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, 0.016, 8, false); })();
  const springF = part(gF, coil, { tone: 'hi', pal: 'dark', name: 'Spring' });
  const capF = part(gF, xAxis(cyl(0.14, 0.03, 28)), { tone: 'hi', pal: 'dark', name: 'Spring' });
  const fsF = force(gF), dxF = thinArrow(gF, 'Compression');
  label('vec', 'F<sub>s</sub>', () => tip(fsF)); label('vec', 'Δ<i>x</i>', () => tip(dxF));
  dashLine(V(endX, 0.03, -0.75), V(endX, 0.03, 0.75), 10);
  label('tick', small('Δx = 0', 13), () => V(endX - 0.05, 0.05, 0.85));
  const barsF = bars(gF, XF - 0.8, -1.4, 0.02, [['blue', 'K'], ['amber', 'U<sub>s</sub>'], ['paper', 'E']], SC.spring.E);

  // ---------- 6b · work by a changing force: a crate pushed with a force that fades ----------
  // Behind the crate, a board carries the F(x) graph at the arrow's own scale and lined up with
  // the crate's position, so the push arrow always reaches the curve's height; the shaded area
  // up to the crate is the work done so far.
  const XP = STATIONS.push, SP = 0.6, xP0 = XP - 2.2, GB = 0.85, zP = -0.8, Lp = M.PUSH.L, FP = SC.push.F;
  smooth(xP0 - 0.6, xP0 + Lp + M.PUSH.coast + 0.5);
  part(root, box(Lp + 0.75, 1.4, 0.03, 0.01), { tone: 'lo', pal: 'board', pos: [xP0 + Lp / 2 + 0.12, GB + 0.55, zP - 0.03], name: 'Graph board' });
  { const t = [xP0, GB, zP, xP0 + Lp + 0.35, GB, zP, xP0, GB, zP, xP0, GB + 1.08, zP];
    for (let i = 1; i <= 3; i++) t.push(xP0 + i, GB, zP, xP0 + i, GB - 0.06, zP);
    for (const F of [10, 20]) t.push(xP0, GB + F * FP, zP, xP0 - 0.06, GB + F * FP, zP);
    lines(root, t, '#6e6e74');
    for (const i of [0, 1, 2, 3]) label('tick', small(i ? `${i} m` : '0', 13), () => V(xP0 + i + 0.06, GB - 0.12, zP));
    for (const F of [10, 20]) label('tick', small(`${F} N`, 13), () => V(xP0 - 0.08, GB + F * FP, zP)); }
  label('board', small('<i>F</i>(<i>x</i>)', 18), () => V(xP0 + 0.08, GB + 1.08, zP));
  part(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(samplesV(80, x => V(xP0 + x, GB + M.pushF(x) * FP, zP + 0.01), 0, Lp)), 160, 0.014, 8, false), { tone: 'hi', pal: 'ink', name: 'F(x) curve' });
  const fillP = areaMesh(150, x => [xP0 + x, GB, GB + M.pushF(x) * FP], 0, Lp, zP + 0.005);
  const gP = asm('push', root, { title: 'Crate pushed by a changing force', sub: 'the work is the area under F(x)' });
  gP.userData.focus = () => ({ target: [xP0 + Lp / 2 + 0.55, 0.9, 0], radius: 2.7 });
  const bP = block(gP, SP, '5.0 kg crate');
  const fP = force(gP), dotP = part(gP, new THREE.SphereGeometry(0.045, 16, 10), { tone: 'hi', pal: 'ink', name: 'F(x) curve' });
  const dropP = liveDash(gP, 10);
  label('vec', '<i>F</i>(<i>x</i>)', () => fP.visible ? fP.position.clone().add(V(0.25, 0.2, 0)) : null);
  label('board', small('area = <i>W</i>', 17), () => pushState.x > 0.9 ? V(xP0 + 0.3, GB + 0.32, zP) : null);
  const NS = 6, stripsP = Array.from({ length: NS }, (_, i) => { const dx = Lp / NS, xm = (i + 0.5) * dx, hgt = M.pushF(xm) * FP;
    return part(gP, box(dx * 0.92, hgt, 0.04, 0.005), { tone: 'mid', pal: 'dark', pos: [xP0 + xm, GB + hgt / 2, zP + 0.04], ex: [0, 0, 0.55], name: 'Strips' }); });
  label('board', small('<i>F</i>(<i>x</i><sub>i</sub>) Δ<i>x</i>', 16), () => opened(gP) > 0.3 ? stripsP[1].position.clone().add(V(-0.2, M.pushF(1.5 * Lp / NS) * FP / 2 + 0.14, 0)) : null);
  label('board', small(`sum of ${NS} strips ≈ ${M.pushStrips(NS).toFixed(1)} J`, 15), () => opened(gP) > 0.3 ? stripsP[4].position.clone().add(V(-0.3, M.pushF(4.5 * Lp / NS) * FP / 2 + 0.55, 0)) : null);
  const barsP = bars(gP, xP0 + Lp + M.PUSH.coast + 0.8, 0, 0.02, [['ink', 'W'], ['blue', 'K']], SC.push.E);
  let pushState = M.push(0);

  // ---------- 7b · force from potential energy: a bead on a smooth wavy wire ----------
  const XQ = STATIONS.bead, xQ0 = XQ - M.BEAD.span / 2, RQ = 0.085;
  const wp = x => { const [a, b] = M.wirePoint(x); return V(xQ0 + a, b, 0); };
  const tanQ = x => { const s = M.beadH1(x); return V(Math.sqrt(1 - s * s), s, 0); };
  part(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(samplesV(240, wp, 0, M.BEAD.len)), 480, 0.014, 8, false), { tone: 'hi', pal: 'dark', name: 'Wire' });
  for (const x of [0, M.BEAD.len]) { const p = wp(x); part(root, cyl(0.025, p.y, 12), { tone: 'mid', pal: 'dark', pos: [p.x, p.y / 2, 0], name: 'Post' }); }
  dashLine(V(xQ0 - 0.3, 0.006, 0.5), V(xQ0 + M.BEAD.span + 0.3, 0.006, 0.5), 30);
  label('board', small('<i>U</i> = 0 at the floor', 15), () => V(xQ0 + M.BEAD.span + 0.35, 0.006, 0.5));
  for (const [x, txt, dy, dx] of [[M.BEAD.stable, 'stable', -0.22, -0.2], [M.BEAD.unstable, 'unstable', 0.22, -0.35], [M.BEAD.neutral, 'neutral', 0.22, -0.3]]) {
    const p = wp(x); part(root, new THREE.SphereGeometry(0.03, 12, 8), { tone: 'hi', pal: 'ink', pos: p.toArray(), name: 'Equilibrium' });
    label('board', small(txt, 15), () => p.clone().add(V(dx, dy, 0)));
  }
  const gQ = asm('bead', root, { title: 'Bead on a wavy wire', sub: 'the force is minus the slope of U' });
  gQ.userData.focus = () => { const p = wp(beadState.x); return { target: [p.x, p.y - 0.1, 0], radius: 1.1 }; };
  gQ.userData.minDist = 4;
  const bQ = ball(gQ, RQ, '0.20 kg bead');
  const fgQ = force(gQ), alQ = thinArrow(gQ, 'Along the wire'), acQ = thinArrow(gQ, 'Across the wire');
  const tangentQ = liveDash(gQ, 18, '#b8343a');
  label('vec', 'F<sub>g</sub>', () => tip(fgQ));
  label('vec', small('<i>F</i> = −d<i>U</i>/d<i>x</i>', 18), () => { if (!alQ.visible) return null; const t = tanQ(beadState.x); return wp(beadState.x).addScaledVector(t, beadState.F * SC.bead.F / 2).add(V(-t.y, t.x, 0).multiplyScalar(0.24)); });
  label('vec grey', small('across', 15), () => acQ.visible ? tip(acQ).add(V(0, -0.1, 0)) : null);
  label('board', small('tangent: slope of <i>U</i>', 15), () => opened(gQ) > 0.3 ? wp(beadState.x).add(tanQ(beadState.x).multiplyScalar(0.75)).add(V(0.05, 0.08, 0)) : null);
  let beadState = M.bead(0);

  // ---------- 7c · energy curves and equilibrium: two atoms held by a bond ----------
  // The light atom rides along the total-energy line E in front of a board carrying U(r), both
  // drawn 0.1 nm = 1 m; the gap from the curve up to E is its kinetic energy.
  const XN = STATIONS.bond, xN0 = XN - 2.0, DS = SC.bond.r, yZ = 2.05, UY = SC.bond.U, zN = -0.35, BD = M.BOND;
  const rx = r => xN0 + r * DS, uy = U => yZ + U / M.EV * UY, yE = uy(BD.E);
  const rLo = 0.125e-9, rHi = 0.34e-9, rClip = BD.r0 / Math.pow(1 + Math.sqrt(1 + 0.4), 1 / 6), yBot = uy(-1.18 * BD.eps);
  part(root, box(rx(rHi) - rx(rLo) + 0.15, uy(0.45 * BD.eps) - yBot + 0.1, 0.03, 0.01), { tone: 'lo', pal: 'board', pos: [(rx(rLo) + rx(rHi)) / 2 + 0.05, (uy(0.45 * BD.eps) + yBot) / 2, zN - 0.03], name: 'Graph board' });
  part(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(samplesV(160, r => V(rx(r), uy(M.bondU(r)), zN + 0.01), rClip, rHi)), 320, 0.014, 8, false), { tone: 'hi', pal: 'ink', name: 'U(r) curve' });
  { const t = [rx(rLo), yBot, zN, rx(rHi), yBot, zN, rx(rLo), yBot, zN, rx(rLo), uy(0.45 * BD.eps), zN];
    for (const r of [0.15, 0.2, 0.25, 0.3]) t.push(rx(r * 1e-9), yBot, zN, rx(r * 1e-9), yBot - 0.06, zN);
    for (const U of [0, -1]) t.push(rx(rLo), uy(U * BD.eps), zN, rx(rLo) - 0.06, uy(U * BD.eps), zN);
    t.push(rx(BD.r1), yE, zN + 0.01, rx(BD.r2), yE, zN + 0.01);
    lines(root, t, '#6e6e74');
    for (const r of [0.15, 0.2, 0.25, 0.3]) label('tick', small(r.toFixed(2), 13), () => V(rx(r * 1e-9) + 0.13, yBot - 0.13, zN));
    label('tick', small('r (nm)', 13), () => V(rx(rHi) + 0.05, yBot - 0.13, zN));
    for (const U of [0, -1]) label('tick', small(`${U} eV`, 13), () => V(rx(rLo) - 0.08, uy(U * BD.eps), zN)); }
  dashLine(V(rx(rLo), yZ, zN), V(rx(rHi), yZ, zN), 26);
  label('board', small('<i>U</i>(<i>r</i>)', 18), () => V(rx(rLo) + 0.08, uy(0.45 * BD.eps), zN));
  label('board', '<i>E</i>', () => V(rx(rHi) + 0.08, yE, zN));
  // E line beyond the turning points is dashed: the atom can't go there (K would be negative)
  dashLine(V(rx(BD.r2), yE, zN + 0.01), V(rx(rHi), yE, zN + 0.01), 12);
  for (const r of [BD.r1, BD.r2]) {
    part(root, new THREE.SphereGeometry(0.035, 12, 8), { tone: 'hi', pal: 'ink', pos: [rx(r), yE, zN + 0.01], name: 'Turning point' });
    dashLine(V(rx(r), yE, zN), V(rx(r), yBot, zN), 10);
  }
  label('board', small('turning points', 14), () => V(rx(BD.r2) + 0.1, yE + 0.15, zN));
  // the atoms sit below the board, lined up with its r axis: separation r is read straight up
  const yA = 0.32, zA = 0;
  const gN = asm('bond', root, { title: 'Two atoms and their bond', sub: 'a particle in a potential well' });
  gN.userData.focus = () => ({ target: [(rx(rLo) + rx(rHi)) / 2 - 0.5, 1.4, 0], radius: 1.9 });
  part(gN, new THREE.SphereGeometry(0.3, 36, 22), { tone: 'hi', pal: 'dark', pos: [xN0, yA, zA], name: 'Heavy atom (held)' });
  const aN = ball(gN, 0.15, 'Light atom, 1 u');
  const fN = force(gN, true), dotN = part(gN, new THREE.SphereGeometry(0.045, 16, 10), { tone: 'hi', pal: 'ink', name: 'U(r) curve' });
  const eDotN = part(gN, new THREE.SphereGeometry(0.04, 16, 10), { tone: 'hi', pal: 'blue', name: 'Kinetic energy' });
  const kN = rod(gN, 0.016, 'blue', 'Kinetic energy'), guideN = liveDash(gN, 14);
  label('vec red', '<i>F</i>', () => tip(fN)); label('vec blue', small('<i>K</i>', 19), () => kN.visible ? kN.position.clone().add(V(0.13, 0, 0)) : null);
  label('tick', small('heavy atom', 13), () => V(xN0 + 0.35, yA - 0.42, zA));
  label('tick', small('light atom', 13), () => opened(gN) < 0.05 ? aN.position.clone().add(V(0.3, -0.3, 0)) : null);
  // opened: the turns as ghosts, the stable point r0, and the parabola that fits the bottom of the well
  const ghostsN = [BD.r1, BD.r2].map(r => part(gN, new THREE.SphereGeometry(0.15, 28, 16), { tone: 'lo', name: 'Turning point', pos: [rx(r), yA, zA], mat: shadeMat('paper', { opacity: 0.45 }) }));
  ghostsN.forEach((g, i) => label('vec grey', small('<i>v</i> = 0', 16), () => g.visible ? g.position.clone().add(V(i ? 0.1 : -0.1, -0.27, 0)) : null));
  const parabN = new THREE.Group(); gN.add(parabN);
  { const p = []; const half = Math.sqrt(2 * 1.05 * BD.eps / BD.k), n = 40; for (let i = 0; i < n; i++) { const r = BD.r0 - half + 2 * half * i / n, r2 = BD.r0 - half + 2 * half * (i + 0.5) / n; p.push(rx(r), uy(-BD.eps + 0.5 * BD.k * (r - BD.r0) ** 2), zN + 0.02, rx(r2), uy(-BD.eps + 0.5 * BD.k * (r2 - BD.r0) ** 2), zN + 0.02); }
    lines(parabN, p, '#3d63a8');
    const q = []; for (let i = 0; i < 10; i++) q.push(rx(BD.r0), uy(-BD.eps) - i * 0.06, zN + 0.02, rx(BD.r0), uy(-BD.eps) - (i + 0.5) * 0.06, zN + 0.02); lines(parabN, q, '#2c2c30'); }
  label('board', small('stable: <i>F</i> = 0 at <i>r</i><sub>0</sub>', 15), () => parabN.visible ? V(rx(BD.r0) + 0.35, uy(-0.95 * BD.eps), zN) : null);
  label('vec blue', small('½<i>k</i>(<i>r</i> − <i>r</i><sub>0</sub>)²', 15), () => parabN.visible ? V(rx(BD.r0) + 0.3, uy(0.12 * BD.eps), zN) : null);
  let bondState = M.bond(0);

  // ---------- 7 · conservation: a pendulum ----------
  const XG = STATIONS.pendulum, PY = 3.3, RG = 0.15;
  part(root, box(1.0, 0.08, 0.4, 0.02), { tone: 'mid', pal: 'board', pos: [XG, PY + 0.04, 0], name: 'Ceiling' });
  const gG = asm('pendulum', root, { title: 'Pendulum', sub: 'K and U trade; their sum stays put' });
  const bG = ball(gG, RG, '1.0 kg bob'), strG = rod(gG);
  const tG = force(gG), fgG = force(gG), vG = force(gG), tanG = thinArrow(gG), radG = thinArrow(gG);
  label('vec', 'T', () => tip(tG)); label('vec', 'F<sub>g</sub>', () => tip(fgG)?.add(V(-0.14, 0, 0))); label('vec', '<b>v</b>', () => tip(vG));
  label('vec', small('mg sin θ', 18), () => tanG.visible ? tip(tanG).add(V(Math.sign(-pendTh) * 0.35, 0, 0)) : null); label('vec', small('mg cos θ', 18), () => radG.visible ? tip(radG).add(V(Math.sign(pendTh || 1) * 0.42, -0.05, 0)) : null);
  let pendTh = 0;
  { const p = []; for (let i = -40; i < 40; i++) { const a = i / 40 * M.PEND.th0, b = (i + 0.5) / 40 * M.PEND.th0; p.push(XG + M.PEND.L * Math.sin(a), PY - M.PEND.L * Math.cos(a), 0, XG + M.PEND.L * Math.sin(b), PY - M.PEND.L * Math.cos(b), 0); } lines(root, p, '#a8a8ae'); }
  dashLine(V(XG, PY, 0), V(XG, PY - M.PEND.L - 0.35, 0), 16);
  dashLine(V(XG - 1.5, PY - M.PEND.L - RG, 0), V(XG + 1.0, PY - M.PEND.L - RG, 0), 20);
  label('board', small('<i>U</i><sub>g</sub> = 0', 16), () => V(XG + 1.05, PY - M.PEND.L - RG, 0));
  const barsG = bars(gG, XG + 1.95, 0, 0.02, [['blue', 'K'], ['amber', 'U<sub>g</sub>'], ['paper', 'E']], SC.pendulum.E);

  // ---------- 8 · non-conservative work: a block sliding to a stop ----------
  const XH = STATIONS.slide, SH = 0.5, xH0 = XH - 1.2;
  rough(XH - 1.6, XH + 1.3);
  const gH = asm('slide', root, { title: 'Block sliding to a stop', sub: 'friction turns K into heat' });
  const bH = block(gH, SH, '2.0 kg block');
  const fH = force(gH), fgH = force(gH), fnH = force(gH), netH = force(gH, true), dxH = thinArrow(gH, 'Displacement');
  label('vec', 'f', () => tip(fH)); label('vec', 'F<sub>g</sub>', () => tip(fgH)); label('vec', 'F<sub>N</sub>', () => tip(fnH)); label('vec red', 'ΣF', () => tip(netH)); label('vec', 'Δ<i>x</i>', () => tip(dxH));
  const ghostH = ghostBox(SH); ghostH.position.set(xH0, 0.02 + SH / 2, 0);
  const barsH = bars(gH, XH + 1.75, 0, 0.02, [['blue', 'K'], ['dark', 'E<sub>th</sub>'], ['paper', 'E']], SC.slide.E);

  // ---------- 9 · power: the same crate lifted fast and slow ----------
  const XI = STATIONS.lift, SI = 0.55, CEIL = 3.4, xs = [XI - 0.85, XI + 0.85];
  part(root, box(3.0, 0.08, 0.5, 0.02), { tone: 'mid', pal: 'board', pos: [XI, CEIL + 0.04, 0], name: 'Ceiling' });
  const gI = asm('lift', root, { title: 'Lifting a crate', sub: 'same work, different power' });
  const crates = xs.map(x => block(gI, SI, '10 kg crate'));
  const ropesI = xs.map(() => rod(gI, 0.012, 'ink', 'Rope'));
  const tI = xs.map(() => force(gI)), wI = xs.map(() => force(gI)), dyI = xs.map(() => thinArrow(gI, 'Displacement'));
  tI.forEach(a => label('vec', 'T', () => tip(a))); wI.forEach(a => label('vec', 'F<sub>g</sub>', () => tip(a)));
  dyI.forEach(a => label('vec', small('Δ<i>y</i>', 18), () => tip(a)));
  label('tick', small(`fast · ${M.LIFT.vFast.toFixed(1)} m/s`, 13), () => V(xs[0] + 0.45, -0.02, 0.5));
  label('tick', small(`slow · ${M.LIFT.vSlow.toFixed(1)} m/s`, 13), () => V(xs[1] + 0.5, -0.02, 0.5));
  { const t = []; const ax = XI - 1.6; t.push(ax, 0, 0, ax, M.LIFT.h + SI + 0.1, 0); for (let i = 0; i <= 4; i++) t.push(ax, 0.02 + i * 0.5, 0, ax + (i % 2 ? 0.06 : 0.12), 0.02 + i * 0.5, 0); lines(root, t, '#6e6e74');
    dashLine(V(XI - 1.6, M.LIFT.h + 0.02, 0), V(XI + 1.5, M.LIFT.h + 0.02, 0), 24); }
  label('tick', '2.0 m', () => V(XI - 1.65, M.LIFT.h + 0.02, 0)); label('tick', '0', () => V(XI - 1.65, 0.02, 0));

  // ---------- per-frame ----------
  function update(s) {
    // 1 · pull
    { const r = M.pull(s.pull.t), c = V(xA0 + r.x, 0.02 + SA / 2, 0), F = SC.pull.F, ex = opened(gA), th = M.PULL.th;
      const u = V(Math.cos(th), Math.sin(th), 0);
      bA.position.copy(c);
      const attach = c.clone().add(V(SA / 2, SA / 2 * Math.tan(th), 0));
      stretch(ropeA, attach, attach.clone().addScaledVector(u, 1.5));
      setArrow(FA, c, u.clone().multiplyScalar(M.PULL.F * F));
      setArrow(fgA, c, V(0, -M.PULL.W * F, 0)); setArrow(fnA, c.clone().add(V(-0.06, 0, 0)), V(0, M.PULL.FN * F, 0));
      setArrow(fxA, c.clone().add(V(0, 0, 0.04)), V(M.PULL.Fx * F, 0, 0), ex); setArrow(fyA, c.clone().add(V(M.PULL.Fx * F, 0, 0.04)), V(0, M.PULL.Fy * F, 0), ex);
      setArrow(dxA, V(xA0, 0.04, SA / 2 + 0.2), V(r.x, 0, 0), r.x > 0.05 ? 1 : 0); }

    // 2 · toss
    { const r = M.toss(s.toss.t); tossState = s.toss.resting ? { v: 0 } : r;
      const c = V(XB, RB + r.y, 0); bB.position.copy(c);
      setArrow(vB, c.clone().add(V(-0.05, 0, 0)), V(0, r.v * SC.toss.v, 0), s.toss.resting ? 0 : 1);
      setArrow(fgB, c.clone().add(V(0.05, 0, 0)), V(0, -M.TOSS.m * M.G * SC.toss.F, 0));
      setArrow(dyB, V(XB - 0.45, RB, 0), V(0, r.y, 0), r.y > 0.12 ? 1 : 0);
      barsB([M.toss(0).K, r.Wg, r.K]); }

    // 3 · whirl: opened, a strobe of earlier moments shows T ⟂ v all the way round
    { const w = (t) => { const p = M.whirl(t), a = p.a; return { c: V(XC + p.x, RC, p.z), vdir: V(-Math.sin(a), 0, -Math.cos(a)), tdir: V(-Math.cos(a), 0, Math.sin(a)) }; };
      const now = w(s.clock * M.SLOW), ex = opened(gC);
      bC.position.copy(now.c); stretch(strC, V(XC, RC, 0), now.c);
      setArrow(vC, now.c, now.vdir.clone().multiplyScalar(M.WHIRL.v * SC.whirl.v)); setArrow(tC, now.c, now.tdir.clone().multiplyScalar(M.WHIRL.T * SC.whirl.F));
      const k = 0.12, p0 = now.c.clone().addScaledVector(now.vdir, k), p1 = p0.clone().addScaledVector(now.tdir, k), p2 = now.c.clone().addScaledVector(now.tdir, k);
      const pos = corner.geometry.attributes.position; [p0, p1, p1, p2].forEach((p, i) => pos.setXYZ(i, p.x, p.y, p.z)); pos.needsUpdate = true;
      strobeC.forEach(([va, ta, gb], i) => { const q = w(s.clock * M.SLOW - (i + 1) * M.WHIRL.period / 4); gb.visible = ex > 0.05; gb.position.copy(q.c);
        setArrow(va, q.c, q.vdir.clone().multiplyScalar(M.WHIRL.v * SC.whirl.v), ex); setArrow(ta, q.c, q.tdir.clone().multiplyScalar(M.WHIRL.T * SC.whirl.F), ex); }); }

    // 4 · car: opened, the forces that do no work (vertical) step aside
    { const r = M.car(s.car.t), x = XD + r.x, c = V(x, 0.8, 0), K = SC.car.F, ex = opened(gD);
      carD.position.set(x, 0, 0);
      setArrow(fD, V(x + 1.35, 0.02, 1.15), V(M.CAR.F * K, 0, 0));
      setArrow(wD, c, V(0, -M.CAR.W * K, 0), 1 - ex); setArrow(nD, c, V(0, M.CAR.W * K, 0), 1 - ex);
      setArrow(netD, c.clone().add(V(0, 1.4, 0)), V(M.CAR.F * K, 0, 0));
      setArrow(dxD, V(XD, 0.05, 1.5), V(r.x, 0, 0), r.x > 0.1 ? 1 : 0);
      barsD([r.Wnet, r.K]); }

    // 5 · drop: opened, a second choice of zero appears
    { const r = M.drop(s.drop.t), c = V(XE, RE + r.y, 0);
      bE.position.copy(c);
      setArrow(fgE, c.clone().add(V(0.09, 0, 0)), V(0, -M.DROP.m * M.G * SC.drop.F, 0));
      setArrow(vE, c.clone().add(V(-0.09, 0, 0)), V(0, r.v * SC.drop.v, 0));
      ref2.visible = opened(gE) > 0.5;
      barsE([r.U, r.K, r.U + r.K]); }

    // 6 · spring
    { const r = M.spring(s.spring.t), front = endX + r.s, c = V(front - SF / 2, 0.02 + SF / 2, 0), end = endX + r.x;
      bF.position.copy(c);
      springF.position.set(end, 0.02 + SF / 2, 0); springF.scale.set(wallX - end, 1, 1);
      capF.position.set(end, 0.02 + SF / 2, 0);
      setArrow(fsF, c.clone().add(V(0, 0.08, 0)), V(r.F * SC.spring.F, 0, 0), r.x > 0.01 ? 1 : 0);
      setArrow(dxF, V(endX, 0.02 + SF + 0.2, 0), V(r.x, 0, 0), r.x > 0.05 && opened(gF) > 0.1 ? 1 : 0);
      barsF([r.K, r.U, r.K + r.U]); }

    // 6b · push: the arrow reaches up to the F(x) curve; the area fills to the crate
    { const r = M.push(s.push.t), c = V(xP0 + r.x, 0.02 + SP / 2, 0), ex = opened(gP); pushState = r;
      bP.position.copy(c);
      const len = r.F * FP;
      setArrow(fP, c.clone().add(V(-SP / 2 - len - 0.02, 0, 0)), V(len, 0, 0), r.F > 0.05 ? 1 : 0);
      const top = V(xP0 + Math.min(r.x, Lp), GB + r.F * FP, zP + 0.02);
      dotP.visible = r.x <= Lp; dotP.position.copy(top);
      dropP(c.clone().add(V(0, SP / 2, 0)), top, r.x <= Lp);
      fillP(r.x);
      stripsP.forEach(m => { m.visible = ex > 0.02; });
      barsP([r.W, r.K]); }

    // 7b · bead: weight, its part along the wire (= −dU/dx); opened, the part across and the tangent
    { const r = M.bead(s.bead.t), p = wp(r.x), t = tanQ(r.x), ex = opened(gQ), F = SC.bead.F, W = M.BEAD.m * M.G; beadState = r;
      bQ.position.copy(p);
      setArrow(fgQ, p, V(0, -W * F, 0));
      setArrow(alQ, p, t.clone().multiplyScalar(r.F * F), Math.abs(r.F) > 0.02 ? 1 : 0);
      setArrow(acQ, p, V(0, -W * F, 0).sub(t.clone().multiplyScalar(r.F * F)), ex);
      tangentQ(p.clone().addScaledVector(t, -0.9).add(V(0, 0, 0.06)), p.clone().addScaledVector(t, 0.9).add(V(0, 0, 0.06)), ex > 0.05); }

    // 7c · bond: the light atom on the E line, its point on U(r), the K gap and the force
    { const r = M.bond(s.bond.t), x = rx(r.r), ex = opened(gN); bondState = r;
      aN.position.set(x, yA, zA);
      dotN.position.set(x, uy(r.U), zN + 0.02); eDotN.position.set(x, yE, zN + 0.02);
      guideN(V(x, yA + 0.17, zA), V(x, yBot, zN));
      kN.visible = r.K > 0.01 * BD.eps; if (kN.visible) stretch(kN, V(x, uy(r.U), zN + 0.02), V(x, yE, zN + 0.02));
      setArrow(fN, V(x, yA, zA), V(r.F * 1e9 * SC.bond.F, 0, 0));
      ghostsN.forEach(g => { g.visible = ex > 0.05; });
      parabN.visible = ex > 0.3; }

    // 7 · pendulum: opened, the weight splits along the path and along the string
    { const r = M.pendulum(s.pendulum.t), th = r.th, piv = V(XG, PY, 0); pendTh = th;
      const out = V(Math.sin(th), -Math.cos(th), 0), c = piv.clone().addScaledVector(out, M.PEND.L), tang = V(Math.cos(th), Math.sin(th), 0);
      bG.position.copy(c); stretch(strG, piv, c);
      const F = SC.pendulum.F, ex = opened(gG), W = M.PEND.m * M.G;
      setArrow(tG, c, out.clone().multiplyScalar(-r.T * F)); setArrow(fgG, c, V(0, -W * F, 0));
      setArrow(vG, c.clone().addScaledVector(out, 0.0), tang.clone().multiplyScalar(r.v * SC.pendulum.v), Math.abs(r.v) > 0.15 && ex < 0.5 ? 1 : 0);
      setArrow(tanG, c, tang.clone().multiplyScalar(-W * Math.sin(th) * F), ex * (Math.abs(th) > 0.08 ? 1 : 0)); setArrow(radG, c, out.clone().multiplyScalar(W * Math.cos(th) * F), ex);
      barsG([r.K, r.U, r.K + r.U]); }

    // 8 · slide
    { const r = M.slide(s.slide.t), c = V(xH0 + r.x, 0.02 + SH / 2, 0), F = SC.slide.F, ex = opened(gH), moving = r.v > 1e-3;
      bH.position.copy(c);
      setArrow(fH, c, V(-M.SLIDE.f * F, 0, 0), moving ? 1 : 0);
      setArrow(fgH, c, V(0, -M.SLIDE.W * F, 0), 1 - ex); setArrow(fnH, c, V(0, M.SLIDE.W * F, 0), 1 - ex);
      setArrow(netH, c.clone().add(V(0, SH / 2 + 0.14, 0)), V(-M.SLIDE.f * F, 0, 0), moving ? 1 : 0);
      setArrow(dxH, V(xH0, 0.05, SH / 2 + 0.45), V(r.x, 0, 0), r.x > 0.05 ? 1 : 0);
      barsH([r.K, r.Eth, r.K + r.Eth]); }

    // 9 · lift
    { const F = SC.lift.F, ex = opened(gI);
      [M.LIFT.vFast, M.LIFT.vSlow].forEach((v, i) => {
        const r = M.lift(s.lift.t, v), c = V(xs[i], 0.02 + SI / 2 + r.y, 0);
        crates[i].position.copy(c);
        stretch(ropesI[i], c.clone().add(V(0, SI / 2, 0)), V(xs[i], CEIL, 0));
        setArrow(tI[i], c.clone().add(V(0.12, 0, 0)), V(0, M.LIFT.W * F, 0)); setArrow(wI[i], c.clone().add(V(-0.12, 0, 0)), V(0, -M.LIFT.W * F, 0));
        setArrow(dyI[i], V(xs[i] + (i ? 0.45 : -0.45), 0.02 + SI / 2, 0), V(0, r.y, 0), r.y > 0.1 && ex > 0.1 ? 1 : 0);
      }); }
  }
  return { update, labels };
}
