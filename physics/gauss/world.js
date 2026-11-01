// The figure: a row of charged objects along x, one per page, each with its Gaussian surface drawn
// translucent with dashed rims. Drawn 1 grid square = 10 cm (model.D world units per metre).
// Blue arrows are the electric field, one fixed scale per scene; red dots are positive charge.
import * as THREE from 'three';
import { part, box, lines, arrow, setArrow, shadeMat, xAxis, V } from '../engine/parts.js';
import * as M from './model.js';

const D = M.D, Y = 2.0;                 // drawn units per metre; height of the scenes' centres
export const STATIONS = { flux: 0, gauss: 16, line: 36, sheet: 54, plate: 60, csphere: 78, isphere: 92, crod: 105, irod: 110, nsphere: 126, cage: 142 };
// field arrows: drawn units per kN/C, per scene
export const SC = { flux: 0.6, point: 1.0, line: 1.5, sheet: 2.5, sphere: 0.5, rod: 1.2, cage: 0.4 };
const k = n => n / 1000;                 // N/C → kN/C
export const Y0 = Y;
const deg = Math.PI / 180;

// a small seeded random source, so the scattered charge marks are the same every load
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// evenly spread directions on a sphere
const fib = n => Array.from({ length: n }, (_, i) => { const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5)); return V(r * Math.cos(a), y, r * Math.sin(a)); });

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at) => labels.push({ cls, html, at });
  const ex = g => Math.max(g.userData.explode, 0);

  // faint graph-paper ground, 10 cm squares
  const grid = [];
  for (let x = -6; x <= 150; x++) grid.push(x, 0.001, -4, x, 0.001, 4);
  for (let z = -4; z <= 4; z++) grid.push(-6, 0.001, z, 150, 0.001, z);
  lines(root, grid, '#e6e6e2');

  // ---------- kit ----------
  const gaussMat = () => { const m = shadeMat('blue', { opacity: 0.11 }); m.side = THREE.DoubleSide; return m; };
  const gpart = (parent, geo, name, opts = {}) => { const m = part(parent, geo, { tone: 'lo', name, mat: gaussMat(), ...opts }); m.userData.noEdge = true; return m; };
  const dashMat = new THREE.LineDashedMaterial({ color: '#5a5a62', dashSize: 0.07, gapSize: 0.05 });
  function loop(parent, pts) {
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const l = new THREE.LineLoop(g, dashMat); l.computeLineDistances(); l.userData = { noEdge: true }; parent.add(l); return l;
  }
  // a dashed circle of radius r, in the plane normal to axis 'x' | 'y' | 'z'
  const ring = (parent, r, axis = 'y', at = [0, 0, 0]) => loop(parent, Array.from({ length: 72 }, (_, i) => {
    const a = i / 72 * 2 * Math.PI, c = r * Math.cos(a), s = r * Math.sin(a);
    return axis === 'y' ? V(at[0] + c, at[1], at[2] + s) : axis === 'x' ? V(at[0], at[1] + c, at[2] + s) : V(at[0] + c, at[1] + s, at[2]);
  }));
  const fieldArrow = (parent, name = 'Field') => arrow(parent, 'blue', { r: 0.024, head: 0.13, headR: 0.06, name });
  const inkArrow = (parent, name) => arrow(parent, 'ink', { r: 0.02, head: 0.12, headR: 0.055, name });
  const greyArrow = (parent, name) => arrow(parent, 'dark', { r: 0.016, head: 0.1, headR: 0.045, name, tone: 'mid' });
  const tip = a => a.visible ? a.localToWorld(V(0, a.userData.arrow.shaft.scale.y + 0.2, 0)) : null;
  const charge = (parent, pos, sign = 1, name = 'Charge') => {
    const m = part(parent, new THREE.SphereGeometry(0.15, 32, 20), { tone: 'hi', name, pos: pos.toArray() });
    label(sign > 0 ? 'vec red' : 'vec blue', sign > 0 ? '+' : '−', () => m.getWorldPosition(V()));
    return m;
  };
  // tiny red dots: positive charge on or in a solid
  function dots(parent, pts, name = 'Charge', r = 0.035, pal = 'red') {
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 10, 8), shadeMat(pal), pts.length);
    const m4 = new THREE.Matrix4();
    pts.forEach((p, i) => im.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z)));
    im.userData = { tone: 0.2, baseTone: 0.2, part: name, home: V(), ex: V() };
    parent.add(im); return im;
  }
  const fieldLineMat = new THREE.LineBasicMaterial({ color: '#7d9fe0' });
  // a field line from the model (SI points), drawn at centre c
  function polyline(parent, pts, c, mat = fieldLineMat) {
    const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => V(c.x + p[0] * D, c.y + p[1] * D, c.z + p[2] * D)));
    const l = new THREE.Line(g, mat); l.userData = { noEdge: true }; parent.add(l); return l;
  }
  // a solid's material that can fade when opened, so what it encloses shows
  // a flat face seen from both sides: the edge pass draws front faces only, so add a flipped twin
  const twoSided = (parent, geo, opts, flip = g => g.clone().rotateX(Math.PI)) => [part(parent, geo, opts), part(parent, flip(geo), opts)];
  const fadeMat = pal => { const m = shadeMat(pal, { opacity: 0.99 }); m.depthWrite = true; m.side = THREE.DoubleSide; return m; };
  const setFade = (mats, e) => mats.forEach(m => { m.uniforms.uOpacity.value = 1 - 0.72 * e; m.depthWrite = e < 0.05; });

  // ======================================================================
  // 1 · flux through a flat square in a uniform field
  // ======================================================================
  const XF = STATIONS.flux, cF = V(XF, Y, 0);
  const gF = asm('flux', root, { title: 'A square in a uniform field', sub: 'Φ = EA cos θ' });
  {
    const pts = [], vals = [-1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75];
    for (const y of vals) for (const z of vals) pts.push(XF - 2.6, Y + y, z, XF + 3.0, Y + y, z);
    lines(root, pts, '#a9bfeb');
  }
  const fE = [0, 1, 2].map(() => fieldArrow(gF, 'Field'));
  label('vec blue', '<b>E</b>', () => tip(fE[2]));
  const plateF = new THREE.Group(); plateF.position.copy(cF); gF.add(plateF);
  part(plateF, box(0.03, 2, 2, 0.01), { tone: 'hi', name: 'Surface', mat: shadeMat('paper', { opacity: 0.6 }) });
  const fA = inkArrow(gF, 'Area vector');
  label('vec', '<b>A</b>', () => tip(fA));
  const pierce = Array.from({ length: 16 }, () => part(gF, new THREE.SphereGeometry(0.05, 12, 8), { tone: 'faint', pal: 'blue', name: 'Field lines through it' }));
  const fPerp = greyArrow(gF, 'E components'), fPar = greyArrow(gF, 'E components'), fEc = fieldArrow(gF, 'Field');
  label('vec', 'E cos θ', () => ex(gF) > 0.3 && Math.abs(Math.cos(plateF.rotation.y)) > 0.25 ? tip(fPerp) : null);
  label('vec', 'E sin θ', () => ex(gF) > 0.3 && Math.sin(plateF.rotation.y) > 0.25 ? tip(fPar) : null);
  const shadow = loop(root, [V(0, -1, -1), V(0, 1, -1), V(0, 1, 1), V(0, -1, 1)]);
  label('tick', 'A cos θ', () => ex(gF) > 0.3 ? V(XF + 2.6, Y + 1.3, 0) : null);

  // ======================================================================
  // 2 · Gauss's law: a point charge in a sphere; a box beside a charge
  // ======================================================================
  const cG = V(STATIONS.gauss - 1.5, Y, 0);
  const gG = asm('gauss', root, { title: 'A point charge in a Gaussian sphere', sub: 'the flux is q/ε₀ at any radius' });
  charge(gG, cG, 1);
  const sphG = new THREE.Group(); sphG.position.copy(cG); gG.add(sphG);
  gpart(sphG, new THREE.SphereGeometry(1, 48, 32), 'Gaussian sphere');
  ring(sphG, 1, 'y'); ring(sphG, 1, 'z');
  { const pf = M.pointField(M.POINT.q, [0, 0, 0]);
    for (const d of fib(30)) polyline(root, M.fieldLine(pf, [d.x * 0.02, d.y * 0.02, d.z * 0.02], { step: 0.005, max: 56 }), cG); }
  const dirsG = fib(14);
  const eG = dirsG.map(() => fieldArrow(gG));
  const dAG = dirsG.map(() => inkArrow(gG, 'Area elements dA'));
  const tileG = dirsG.map(() => part(gG, box(0.36, 0.02, 0.36, 0.005), { tone: 'mid', pal: 'base', name: 'Area elements dA' }));
  const rG = greyArrow(gG, 'Radius');
  label('vec', 'r', () => tip(rG));
  label('vec blue', '<b>E</b>', () => tip(eG[9]));
  label('vec', 'd<b>A</b>', () => ex(gG) > 0.3 ? tip(dAG[9]) : null);

  // the box, with a charge just outside it
  const cB = V(STATIONS.gauss + 4.6, Y, 0);
  const gB = asm('box', root, { title: 'A closed box, the charge outside', sub: 'what goes in comes out' });
  const qB = cB.clone().add(V(...M.BOX.at).multiplyScalar(D));
  charge(gB, qB, 1);
  { const pf = M.pointField(M.BOX.q, M.BOX.at);
    for (const d of fib(26)) polyline(root, M.fieldLine(pf, M.BOX.at.map((v, i) => v + [d.x, d.y, d.z][i] * 0.02), { step: 0.005, max: 52 }), cB); }
  const h = M.BOX.h * D, faces = M.boxFaces();
  const faceDirs = [V(1, 0, 0), V(-1, 0, 0), V(0, 1, 0), V(0, -1, 0), V(0, 0, 1), V(0, 0, -1)];
  faceDirs.forEach((n, i) => {
    const geo = new THREE.PlaneGeometry(2 * h, 2 * h);
    const m = gpart(gB, geo, 'Faces of the box', { pos: cB.clone().addScaledVector(n, h).toArray(), ex: n.clone().multiplyScalar(0.9).toArray() });
    m.quaternion.setFromUnitVectors(V(0, 0, 1), n);
    const rim = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#6c6c72' })); rim.userData = { noEdge: true }; m.add(rim);
    const v = faces[i];
    label('tick', `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(1)}`, () => ex(gB) > 0.4 ? m.getWorldPosition(V()).addScaledVector(n, 0.35).add(V(0.25, 0.18, 0)) : null);
  });

  // ======================================================================
  // 3 · an infinite line of charge
  // ======================================================================
  const cL = V(STATIONS.line, Y, 0);
  const gL = asm('line', root, { title: 'A line of charge in a Gaussian cylinder', sub: 'only the curved side carries flux' });
  part(root, xAxis(new THREE.CylinderGeometry(0.06, 0.06, 11, 20)), { tone: 'hi', name: 'Line of charge', pos: cL.toArray() });
  dots(root, Array.from({ length: 44 }, (_, i) => V(cL.x - 5.375 + i * 0.25, Y, 0.06)), 'Line of charge', 0.035);
  label('axis', '−∞', () => V(cL.x - 5.9, Y, 0)); label('axis', '+∞', () => V(cL.x + 6.3, Y, 0));
  label('tick', `λ = ${(M.LINE.lam * 1e9).toFixed(1)} nC/m`, () => V(cL.x + 5.2, Y + 0.3, 0));
  const cylL = new THREE.Group(); cylL.position.copy(cL); gL.add(cylL);
  const LL = M.LINE.L * D;
  gpart(cylL, xAxis(new THREE.CylinderGeometry(1, 1, LL, 48, 1, true)), 'Curved side');
  const capsL = [1, -1].map(s => {
    const cap = gpart(cylL, new THREE.CircleGeometry(1, 48).rotateY(Math.PI / 2), 'Caps', { pos: [s * LL / 2, 0, 0] });
    ring(cap, 1, 'x');
    return cap;
  });
  const eL = [], angL = [0, 60, 120, 180, 240, 300].map(a => a * deg);
  for (const x of [-1, 0, 1]) for (const a of angL) eL.push({ x, a, ar: fieldArrow(gL) });
  const capE = [];      // E on a cap lies in the cap: grey, tangent to it
  for (const s of [1, -1]) for (const a of [30, 150, 270]) capE.push({ s, a: a * deg, ar: greyArrow(gL, 'Caps') });
  const rL = greyArrow(gL, 'Radius');
  label('vec', 'r', () => tip(rL));
  label('vec blue', '<b>E</b>', () => tip(eL[7].ar));
  label('tick', 'cap: Φ = 0', () => ex(gL) > 0.3 ? capsL[0].getWorldPosition(V()).add(V(0.4, 1.0, 0)) : null);
  label('tick', 'cap: Φ = 0', () => ex(gL) > 0.3 ? capsL[1].getWorldPosition(V()).add(V(0.0, 1.0, 0)) : null);
  label('tick', 'side: Φ = λL/ε₀', () => ex(gL) > 0.3 ? cL.clone().add(V(0.9, -2.0, 0)) : null);

  // ======================================================================
  // 4 · a non-conducting sheet, and a conducting plate
  // ======================================================================
  const pillbox = (g, c, rr, y0, y1, gap) => {
    const grp = new THREE.Group(); grp.position.copy(c); g.add(grp);
    const H = y1 - y0;
    gpart(grp, new THREE.CylinderGeometry(rr, rr, H, 40, 1, true), 'Pillbox side', { pos: [0, (y0 + y1) / 2, 0] });
    const top = gpart(grp, new THREE.CircleGeometry(rr, 40).rotateX(-Math.PI / 2), 'Pillbox caps', { pos: [0, y1, 0], ex: [0, gap, 0] });
    const bot = gpart(grp, new THREE.CircleGeometry(rr, 40).rotateX(Math.PI / 2), 'Pillbox caps', { pos: [0, y0, 0], ex: [0, -gap, 0] });
    ring(top, rr, 'y'); ring(bot, rr, 'y');
    return { top, bot };
  };
  const scatter = (seed, n, x0, x1, z0, z1, y) => { const r = rng(seed); return Array.from({ length: n }, () => V(x0 + (x1 - x0) * r(), y, z0 + (z1 - z0) * r())); };
  const grid3 = [-1.5, 1.5];
  // the sheet
  const cS = V(STATIONS.sheet, Y, 0), W2 = 2.2;
  const gS = asm('sheet', root, { title: 'A charged sheet and a pillbox', sub: 'flux out of both caps' });
  part(gS, box(2 * W2, 0.05, 2 * W2, 0.01), { tone: 'hi', name: 'Sheet', pos: cS.toArray() });
  dots(gS, scatter(7, 90, cS.x - W2 + 0.1, cS.x + W2 - 0.1, -W2 + 0.1, W2 - 0.1, Y + 0.03), 'Sheet');
  const pbS = pillbox(gS, cS, M.SHEET.pr * D, -0.8, 0.8, 0.8);
  const eS = []; for (const x of grid3) for (const z of grid3) for (const s of [1, -1]) eS.push({ x, z, s, ar: fieldArrow(gS) });
  label('vec blue', '<b>E</b>', () => tip(eS[0].ar)); label('vec blue', '<b>E</b>', () => tip(eS[1].ar));
  label('tick', 'σ', () => V(cS.x - W2 - 0.1, Y + 0.12, W2));
  label('tick', 'top: EA', () => ex(gS) > 0.3 ? pbS.top.getWorldPosition(V()).add(V(-0.2, 0.25, 0)) : null);
  label('tick', 'bottom: EA', () => ex(gS) > 0.3 ? pbS.bot.getWorldPosition(V()).add(V(-0.2, -0.3, 0)) : null);
  label('tick', 'side: 0', () => ex(gS) > 0.3 ? cS.clone().add(V(-0.55, 0.45, 0)) : null);
  // the plate
  const cP = V(STATIONS.plate, Y, 0), TP = M.PLATE.t * D;
  const gP = asm('plate', root, { title: 'A charged metal plate', sub: 'flux out of one cap only' });
  part(gP, box(2 * W2, TP, 2 * W2, 0.02), { tone: 'hi', name: 'Metal plate', pal: 'base', pos: cP.toArray() });
  dots(gP, [...scatter(11, 90, cP.x - W2 + 0.1, cP.x + W2 - 0.1, -W2 + 0.1, W2 - 0.1, Y + TP / 2 + 0.02), ...scatter(12, 90, cP.x - W2 + 0.1, cP.x + W2 - 0.1, -W2 + 0.1, W2 - 0.1, Y - TP / 2 - 0.02)], 'Surface charge');
  const pbP = pillbox(gP, cP, M.SHEET.pr * D, 0, TP / 2 + 0.8, 0.8);
  const eP = []; for (const x of grid3) for (const z of grid3) for (const s of [1, -1]) eP.push({ x, z, s, ar: fieldArrow(gP) });
  label('vec blue', '<b>E</b>', () => tip(eP[0].ar)); label('vec blue', '<b>E</b>', () => tip(eP[1].ar));
  label('tick', 'top: EA', () => ex(gP) > 0.3 ? pbP.top.getWorldPosition(V()).add(V(-0.2, 0.25, 0)) : null);
  label('tick', 'in the metal: E = 0', () => ex(gP) > 0.3 ? pbP.bot.getWorldPosition(V()).add(V(-0.2, -0.3, 0)) : null);

  // ======================================================================
  // spheres: conducting, insulating, ρ = br — a cutaway with a wedge removed
  // ======================================================================
  const WEDGE = [20 * deg, 110 * deg];                // removed φ range (three.js sphere φ), facing the camera
  const R1 = M.SPH.R * D;
  const inWedge = d => { let ph = Math.atan2(d.z, -d.x); if (ph < 0) ph += 2 * Math.PI; return ph > WEDGE[0] && ph < WEDGE[1]; };
  function sphereScene(key, X, kind, meta) {
    const c = V(X, Y, 0), g = asm(key, root, meta);
    const mats = [fadeMat(kind === 'c' ? 'base' : 'paper'), fadeMat(kind === 'c' ? 'dark' : 'base')];
    part(g, new THREE.SphereGeometry(R1, 64, 40, WEDGE[1], 2 * Math.PI - (WEDGE[1] - WEDGE[0])), { tone: 'hi', name: kind === 'c' ? 'Metal sphere' : 'Insulating sphere', mat: mats[0], pos: c.toArray() });
    for (const ph of WEDGE) {
      for (const f of twoSided(g, new THREE.CircleGeometry(R1, 40, -Math.PI / 2, Math.PI), { tone: 'hi', name: 'Cut face', mat: mats[1], pos: c.toArray() })) f.rotation.y = Math.PI + ph;
    }
    // charge marks: on the surface of the metal; through the volume (seen on the cut faces) otherwise
    let pts = [];
    if (kind === 'c') pts = fib(160).filter(d => !inWedge(d)).map(d => c.clone().addScaledVector(d, R1 + 0.02));
    else {
      const r = rng(kind === 'n' ? 5 : 3);
      for (const ph of WEDGE) {
        const u = V(-Math.cos(ph), 0, Math.sin(ph)), side = V(0, 0, 0).crossVectors(u, V(0, 1, 0)).normalize().multiplyScalar(0.03);
        for (let i = 0; i < 34; i++) {
          // uniform ρ: uniform over the face; ρ = br: the face density goes as r, so r = R u^(1/3)
          const rr = R1 * (kind === 'n' ? Math.cbrt(r()) : Math.sqrt(r())) * 0.97, a = (r() - 0.5) * Math.PI;
          pts.push(c.clone().addScaledVector(u, rr * Math.cos(a)).add(V(0, rr * Math.sin(a), 0)).add(side.clone().multiplyScalar(ph === WEDGE[0] ? -1 : 1)));
        }
      }
    }
    dots(g, pts, kind === 'c' ? 'Surface charge' : 'Charge in the volume', 0.024);
    const gs = new THREE.Group(); gs.position.copy(c); g.add(gs);
    gpart(gs, new THREE.SphereGeometry(1, 48, 32), 'Gaussian sphere');
    ring(gs, 1, 'y'); ring(gs, 1, 'z');
    // what the Gaussian sphere encloses (shown when opened)
    const enc = gpart(g, new THREE.SphereGeometry(1, 40, 28), 'Enclosed charge', { pos: c.toArray(), mat: shadeMat('red', { opacity: 0.32 }) });
    const dirs = fib(18), arrows = dirs.map(() => fieldArrow(g));
    const rad = greyArrow(g, 'Radius');
    label('vec', 'r', () => tip(rad));
    label('tick', 'R', () => c.clone().add(V(-R1 * 0.72 - 0.1, R1 * 0.72 + 0.1, 0)));
    label('vec blue', '<b>E</b>', () => { for (const i of [12, 4, 9, 15, 2]) if (arrows[i].visible) return tip(arrows[i]); return null; });
    return { c, g, gs, enc, dirs, arrows, rad, mats };
  }
  const SC_ = sphereScene('csphere', STATIONS.csphere, 'c', { title: 'A charged metal sphere', sub: 'all its charge on the surface' });
  const SI_ = sphereScene('isphere', STATIONS.isphere, 'i', { title: 'A uniformly charged insulating sphere', sub: 'charge all through it' });
  const SN_ = sphereScene('nsphere', STATIONS.nsphere, 'n', { title: 'A sphere with ρ = br', sub: 'denser towards the edge' });
  label('tick', 'q<sub>enc</sub> = 0', () => ex(SC_.g) > 0.3 && SC_.gs.scale.x < R1 ? SC_.c.clone().add(V(0.15, -0.35, 0.6)) : null);

  // ======================================================================
  // rods: conducting and insulating, vertical, cut away
  // ======================================================================
  const RR = M.ROD.R * D, RL = 3.2, RY = Y + 0.3, TH = [-70 * deg, 20 * deg];   // removed θ range
  function rodScene(key, X, kind, meta) {
    const c = V(X, RY, 0), g = asm(key, root, meta);
    const mats = [fadeMat(kind === 'c' ? 'base' : 'paper'), fadeMat(kind === 'c' ? 'dark' : 'base')];
    part(g, new THREE.CylinderGeometry(RR, RR, RL, 48, 1, true, TH[1], 2 * Math.PI - (TH[1] - TH[0])), { tone: 'hi', name: kind === 'c' ? 'Metal rod' : 'Insulating rod', mat: mats[0], pos: c.toArray() });
    for (const th of TH) {
      for (const f of twoSided(g, new THREE.PlaneGeometry(RR, RL).translate(RR / 2, 0, 0), { tone: 'hi', name: 'Cut face', mat: mats[1], pos: c.toArray() })) f.rotation.y = th - Math.PI / 2;
    }
    const arc = 2 * Math.PI - (TH[1] - TH[0]);
    part(g, new THREE.CircleGeometry(RR, 36, TH[1] - Math.PI / 2, arc).rotateX(-Math.PI / 2), { tone: 'hi', name: 'Ends', mat: mats[1], pos: [c.x, c.y + RL / 2, c.z] });
    part(g, new THREE.CircleGeometry(RR, 36, Math.PI / 2 - TH[0], arc).rotateX(Math.PI / 2), { tone: 'hi', name: 'Ends', mat: mats[1], pos: [c.x, c.y - RL / 2, c.z] });
    const pts = [], r = rng(kind === 'c' ? 21 : 22);
    if (kind === 'c') { for (let i = 0; i < 150; i++) { const th = TH[1] + r() * (2 * Math.PI - (TH[1] - TH[0])); pts.push(V(c.x + (RR + 0.02) * Math.sin(th), c.y + (r() - 0.5) * RL * 0.96, c.z + (RR + 0.02) * Math.cos(th))); } }
    else for (const th of TH) { const u = V(Math.sin(th), 0, Math.cos(th)), n = V(Math.cos(th), 0, -Math.sin(th)).multiplyScalar(th === TH[0] ? 0.03 : -0.03);
      for (let i = 0; i < 60; i++) pts.push(c.clone().addScaledVector(u, RR * (0.05 + 0.9 * r())).add(V(0, (r() - 0.5) * RL * 0.96, 0)).add(n)); }
    dots(g, pts, kind === 'c' ? 'Surface charge' : 'Charge in the volume', 0.028);
    const gs = new THREE.Group(); gs.position.copy(c); g.add(gs);
    const LG = M.ROD.L * D;
    gpart(gs, new THREE.CylinderGeometry(1, 1, LG, 48, 1, true), 'Gaussian cylinder');
    for (const s of [1, -1]) { gpart(gs, new THREE.CircleGeometry(1, 48).rotateX(-s * Math.PI / 2), 'Gaussian cylinder', { pos: [0, s * LG / 2, 0] }); ring(gs, 1, 'y', [0, s * LG / 2, 0]); }
    const enc = gpart(g, new THREE.CylinderGeometry(1, 1, LG, 40), 'Enclosed charge', { pos: c.toArray(), mat: shadeMat('red', { opacity: 0.32 }) });
    const arrows = []; for (const y of [-0.45, 0.45]) for (const a of [0, 72, 144, 216, 288]) arrows.push({ y, a: (a - 25) * deg, ar: fieldArrow(g) });
    const rad = greyArrow(g, 'Radius');
    label('vec', 'r', () => tip(rad));
    label('vec blue', '<b>E</b>', () => tip(arrows[7].ar));
    label('tick', kind === 'c' ? 'metal' : 'insulator', () => c.clone().add(V(0.2, RL / 2 + 0.35, 0)));
    return { c, g, gs, enc, arrows, rad, mats, LG };
  }
  const RC_ = rodScene('crod', STATIONS.crod, 'c', { title: 'A charged metal rod', sub: 'charge on the surface' });
  const RI_ = rodScene('irod', STATIONS.irod, 'i', { title: 'A uniformly charged insulating rod', sub: 'charge all through it' });

  // ======================================================================
  // 10 · a conductor in equilibrium: a metal shell in a uniform field
  // ======================================================================
  const cC = V(STATIONS.cage, Y, 0), RC = M.CAGE.R * D, RCi = RC - 0.12;
  const gC = asm('cage', root, { title: 'A hollow metal shell in a field', sub: 'a Faraday cage' });
  const cmats = [fadeMat('base'), fadeMat('dark'), fadeMat('base')];
  const wedgeLen = 2 * Math.PI - (WEDGE[1] - WEDGE[0]);
  part(gC, new THREE.SphereGeometry(RC, 64, 40, WEDGE[1], wedgeLen), { tone: 'hi', name: 'Metal shell', mat: cmats[0], pos: cC.toArray() });
  part(gC, new THREE.SphereGeometry(RCi, 64, 40, WEDGE[1], wedgeLen), { tone: 'mid', name: 'Metal shell', mat: cmats[2], pos: cC.toArray() });
  for (const ph of WEDGE) for (const f of twoSided(gC, new THREE.RingGeometry(RCi, RC, 40, 1, -Math.PI / 2, Math.PI), { tone: 'hi', name: 'Metal shell', mat: cmats[1], pos: cC.toArray() })) f.rotation.y = Math.PI + ph;
  { // field lines from the model: from upstream until they end on the shell, and back from downstream
    const R = M.CAGE.R, hit = p => M.len(p) < R, out = p => Math.abs(p[0]) > 0.44 || Math.abs(p[1]) > 0.3 || Math.abs(p[2]) > 0.3;
    for (const [a, b] of [[1, 0], [0, 1]]) for (let i = -5; i <= 5; i++) {
      const s = i * 0.042, start = [-0.44, s * a, s * b];
      const fw = M.fieldLine(M.cageField, start, { step: 0.004, max: 260, stop: p => hit(p) || out(p) });
      polyline(root, fw, cC);
      if (hit(fw[fw.length - 1])) {
        const bw = M.fieldLine(M.cageField, [0.44, s * a, s * b], { step: 0.004, max: 260, dir: -1, stop: p => hit(p) || out(p) });
        polyline(root, bw, cC);
      }
    }
  }
  const surf = [0, 40, 75, 140, 180, 220, 285, 320].map(a => a * deg);
  const eC = surf.map(() => fieldArrow(gC));
  for (const a of [0, 30, -30, 60, -60]) {
    const p = d => cC.clone().add(V(d * Math.cos(a * deg) * (RC + 0.28), Math.sin(a * deg) * (RC + 0.28), 0.1));
    label('vec red', '+', () => p(1)); label('vec blue', '−', () => p(-1));
  }
  label('tick', 'E = 0', () => cC.clone().add(V(0.25, -0.15, 0.5)));
  label('vec blue', '<b>E</b><sub>0</sub>', () => cC.clone().add(V(-4.3, 1.55, 0)));
  const gsC = new THREE.Group(); gsC.position.copy(cC); gC.add(gsC);
  gpart(gsC, new THREE.SphereGeometry(RC - 0.06, 48, 32), 'Gaussian sphere in the metal');
  ring(gsC, RC - 0.06, 'y'); ring(gsC, RC - 0.06, 'z');

  // ---------- per-frame ----------
  const _p = V(), _v = V();
  function update(s) {
    const e = (g) => ex(g);

    // 1 · flux
    { const th = M.fluxAngle(s.clock) * deg, n = V(Math.cos(th), 0, -Math.sin(th)), t = V(Math.sin(th), 0, Math.cos(th));
      plateF.rotation.y = th;
      const L = k(M.FLUX.E) * SC.flux;
      fE.forEach((a, i) => setArrow(a, V(XF - 3.0, Y - 1.25 + i * 1.25, 1.75), V(L, 0, 0)));
      setArrow(fA, cF.clone().add(V(0, 0.55, 0)), n.clone().multiplyScalar(1.3));   // drawn above the centre, clear of E's parts
      // where the drawn field lines pierce the square
      let m = 0; const vals = [-0.75, -0.25, 0.25, 0.75, -1.25, 1.25, -1.75, 1.75];
      for (const y of vals) for (const z of vals) {
        if (Math.abs(n.x) < 1e-3 || Math.abs(y) > 1) continue;
        const x = z * Math.sin(th) / Math.cos(th);        // (p − c)·n = 0 → x cos θ − z sin θ = 0
        const u = x * t.x + z * t.z;
        if (Math.abs(u) <= 1 && m < pierce.length) { pierce[m].visible = true; pierce[m++].position.set(XF + x, Y + y, z); }
      }
      for (; m < pierce.length; m++) pierce[m].visible = false;
      const x0 = e(gF), En = L * Math.cos(th);
      setArrow(fEc, cF.clone().add(V(0, 0, 0)), V(L, 0, 0), x0);
      setArrow(fPerp, cF, n.clone().multiplyScalar(En), x0);
      setArrow(fPar, cF.clone().addScaledVector(n, En), t.clone().multiplyScalar(L * t.x), x0);   // E = (E·n̂)n̂ + (E·t̂)t̂
      shadow.visible = x0 > 0.05;
      shadow.position.set(XF + 2.6, Y, 0); shadow.scale.set(1, 1, Math.max(Math.abs(Math.cos(th)), 0.001)); }

    // 2 · point charge and Gaussian sphere
    { const r = M.breathe(s.clock, M.POINT.rMin, M.POINT.rMax, M.POINT.T), rd = r * D, L = k(M.pointE(r)) * SC.point, x0 = e(gG);
      sphG.scale.setScalar(rd);
      dirsG.forEach((d, i) => {
        const p = cG.clone().addScaledVector(d, rd);
        setArrow(eG[i], p, d.clone().multiplyScalar(L));
        const side = V().crossVectors(d, Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize();
        setArrow(dAG[i], p.clone().addScaledVector(side, 0.14), d.clone().multiplyScalar(0.55), x0);
        tileG[i].visible = x0 > 0.02; tileG[i].position.copy(p); tileG[i].quaternion.setFromUnitVectors(V(0, 1, 0), d);
      });
      setArrow(rG, cG, V(-0.55, 0.35, 0.76).normalize().multiplyScalar(rd)); }

    // 3 · line of charge
    { const r = M.breathe(s.clock, M.LINE.rMin, M.LINE.rMax, M.LINE.T), rd = r * D, L = k(M.lineE(r)) * SC.line;
      cylL.scale.set(1, rd, rd);
      for (const { x, a, ar } of eL) { const d = V(0, Math.cos(a), Math.sin(a)); setArrow(ar, cL.clone().add(V(x, 0, 0)).addScaledVector(d, rd), d.clone().multiplyScalar(L)); }
      const x0 = e(gL);
      for (const { s: sg, a, ar } of capE) { const d = V(0, Math.cos(a), Math.sin(a)); const cp = capsL[sg > 0 ? 0 : 1].getWorldPosition(V()); setArrow(ar, cp.clone().addScaledVector(d, rd * 0.35), d.clone().multiplyScalar(Math.min(L, rd * 0.6)), x0); }
      setArrow(rL, cL.clone().add(V(-0.6, 0, 0)), V(0, 0.45, 0.89).multiplyScalar(rd)); }

    // 4 · sheet and plate
    { const Ls = k(M.SHEET.E) * SC.sheet, Lp = k(M.PLATE.E) * SC.sheet;
      for (const { x, z, s: sg, ar } of eS) setArrow(ar, cS.clone().add(V(x, sg * 0.03, z)), V(0, sg * Ls, 0));
      for (const { x, z, s: sg, ar } of eP) setArrow(ar, cP.clone().add(V(x, sg * TP / 2, z)), V(0, sg * Lp, 0)); }

    // spheres
    for (const [S, model] of [[SC_, M.cSphere], [SI_, M.iSphere], [SN_, M.nSphere]]) {
      const r = M.breathe(s.clock, M.SPH.rMin, M.SPH.rMax, M.SPH.T), rd = r * D, L = k(model.E(r)) * SC.sphere, x0 = e(S.g);
      S.gs.scale.setScalar(rd);
      S.dirs.forEach((d, i) => setArrow(S.arrows[i], S.c.clone().addScaledVector(d, rd), d.clone().multiplyScalar(L), rd < R1 && !inWedge(d) && x0 < 0.3 ? 0 : 1));
      setFade(S.mats, x0);
      const encR = model === M.cSphere ? (r >= M.SPH.R ? R1 + 0.03 : 0) : Math.min(rd, R1) - 0.01;
      S.enc.visible = x0 > 0.02 && encR > 0.01; S.enc.scale.setScalar(Math.max(encR, 0.01));
      setArrow(S.rad, S.c, V(-0.62, 0.3, 0.72).normalize().multiplyScalar(rd));
    }
    // rods
    for (const [S, model] of [[RC_, M.cRod], [RI_, M.iRod]]) {
      const r = M.breathe(s.clock, M.ROD.rMin, M.ROD.rMax, M.ROD.T), rd = r * D, L = k(model.E(r)) * SC.rod, x0 = e(S.g);
      S.gs.scale.set(rd, 1, rd);
      for (const { y, a, ar } of S.arrows) { const d = V(Math.sin(a), 0, Math.cos(a)); setArrow(ar, S.c.clone().add(V(0, y, 0)).addScaledVector(d, rd), d.clone().multiplyScalar(L)); }
      setFade(S.mats, x0);
      const encR = model === M.cRod ? (r >= M.ROD.R ? RR + 0.03 : 0) : Math.min(rd, RR) - 0.005;
      S.enc.visible = x0 > 0.02 && encR > 0.01; S.enc.scale.set(Math.max(encR, 0.01), 1, Math.max(encR, 0.01));
      setArrow(S.rad, S.c.clone().add(V(0, S.LG / 2 + 0.02, 0)), V(Math.sin(-25 * deg), 0, Math.cos(-25 * deg)).multiplyScalar(rd));
    }
    // cage: E at the surface is normal to it, σ/ε₀ = 3E₀ cos θ, out where σ > 0 and in where σ < 0
    { const x0 = e(gC);
      surf.forEach((a, i) => {
        const n = V(Math.cos(a), Math.sin(a), 0.0), En = M.dot(M.cageField([n.x * M.CAGE.R * 1.0001, n.y * M.CAGE.R * 1.0001, 0]), [n.x, n.y, 0]), L = k(En) * SC.cage;
        const p = cC.clone().addScaledVector(n, RC);
        if (L >= 0) setArrow(eC[i], p, n.clone().multiplyScalar(L)); else setArrow(eC[i], p.clone().addScaledVector(n, -L), n.clone().multiplyScalar(L));
      });
      setFade(cmats, x0);
      gsC.visible = x0 > 0.02; }
  }
  return { update, labels };
}
