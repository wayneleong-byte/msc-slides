// Optics figure: six paper scenes along +x. Rays are thin cylinders / lines; clickable assemblies explode.
import * as THREE from 'three';
import { part, box, cyl, lines, shadeMat, V } from '../../engine/parts.js';
import * as M from './model.js';

export const STATIONS = { shadow: 0, reflect: 10, mirror: 20, refract: 30, prism: 42, lens: 54 };

const DEG = Math.PI / 180;

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at, text) => labels.push({ cls, html, at, text });

  // faint ground grid spanning stations
  const grid = [];
  for (let x = -4; x <= 62; x++) grid.push(x, 0.001, -3, x, 0.001, 3);
  for (let z = -3; z <= 3; z++) grid.push(-4, 0.001, z, 62, 0.001, z);
  lines(root, grid, '#e6e6e2');

  const rayMat = shadeMat('red');
  const ray = (parent, len, pos, rot, name = 'Ray', pal = 'red') => {
    const m = part(parent, cyl(0.018, len, 10), { tone: 'hi', pal, pos, rot, name, ex: [0, 0.15, 0] });
    return m;
  };
  // cylinder default along +y; aim with quaternion from +y to direction
  const aimY = (mesh, dir) => {
    const d = dir.clone().normalize();
    mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d);
  };
  const placeRay = (mesh, from, to) => {
    const a = V(...from), b = V(...to);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const len = Math.max(a.distanceTo(b), 1e-3);
    mesh.position.copy(mid);
    mesh.scale.set(1, len, 1);
    aimY(mesh, b.clone().sub(a));
  };

  // =====================================================================================
  // 0 · straight line / shadow
  const X0 = STATIONS.shadow;
  part(root, box(3.6, 0.02, 2.2, 0.005), { tone: 'lo', pal: 'board', pos: [X0, 0.01, 0], name: 'Table' });
  const g0 = asm('shadow', root, { title: '直線傳播與影子', sub: '光線遇障礙物' });
  g0.userData.focus = () => ({ target: [X0 + 0.4, 0.9, 0], radius: 1.6 });
  // lamp
  part(g0, cyl(0.12, 0.16, 16), { tone: 'hi', pal: 'ink', pos: [X0 + M.SHADOW.lamp[0], M.SHADOW.lamp[1], 0], name: 'Lamp', ex: [0, 0.25, 0] });
  part(g0, box(0.08, 0.08, 0.08, 0.01), { tone: 'lit', pal: 'red', pos: [X0 + M.SHADOW.lamp[0], M.SHADOW.lamp[1] - 0.12, 0], name: 'Bulb' });
  // block
  part(g0, box(M.SHADOW.blockW, M.SHADOW.blockH, M.SHADOW.blockD, 0.02), {
    tone: 'mid', pal: 'dark',
    pos: [X0 + M.SHADOW.blockX, M.SHADOW.blockH / 2, 0],
    name: 'Block', ex: [0, 0.35, 0],
  });
  // screen
  part(g0, box(M.SHADOW.screenW, M.SHADOW.screenH, 1.6, 0.01), {
    tone: 'lo', pal: 'paper',
    pos: [X0 + M.SHADOW.screenX, M.SHADOW.screenH / 2, 0],
    name: 'Screen', ex: [0.35, 0, 0],
  });
  // shadow patch on screen (darker card)
  part(g0, box(0.02, 0.95, 0.55, 0.005), {
    tone: 'hi', pal: 'ink',
    pos: [X0 + M.SHADOW.screenX - 0.03, 0.55, 0],
    name: 'Shadow', ex: [0.2, 0, 0],
  });
  // guiding rays (lamp to block corners → screen)
  const r01 = part(g0, cyl(0.012, 1, 8), { tone: 'hi', pal: 'red', name: 'Ray', ex: [0, 0.2, 0] });
  const r02 = part(g0, cyl(0.012, 1, 8), { tone: 'hi', pal: 'red', name: 'Ray', ex: [0, 0.2, 0] });
  placeRay(r01, [X0 + M.SHADOW.lamp[0], M.SHADOW.lamp[1] - 0.12, 0], [X0 + M.SHADOW.blockX, M.SHADOW.blockH, 0]);
  placeRay(r02, [X0 + M.SHADOW.lamp[0], M.SHADOW.lamp[1] - 0.12, 0], [X0 + M.SHADOW.blockX, 0.05, 0]);
  label('mark', '燈', () => V(X0 + M.SHADOW.lamp[0], M.SHADOW.lamp[1] + 0.28, 0));
  label('mark', '影子', () => V(X0 + M.SHADOW.screenX + 0.25, 0.7, 0));

  // =====================================================================================
  // 1 · reflection
  const X1 = STATIONS.reflect;
  part(root, box(3.2, 0.02, 2.0, 0.005), { tone: 'lo', pal: 'board', pos: [X1, 0.01, 0], name: 'Table' });
  const g1 = asm('reflect', root, { title: '反射定律', sub: '入射角等於反射角' });
  g1.userData.focus = () => ({ target: [X1, 0.7, 0], radius: 1.4 });
  // mirror standing in xz, reflecting in xy plane (mirror face toward -x? use face in yz at x=X1)
  part(g1, box(0.04, 1.6, 1.4, 0.01), { tone: 'hi', pal: 'paper', pos: [X1, 0.9, 0], name: 'Mirror', ex: [0.3, 0, 0] });
  // normal
  const normal = part(g1, cyl(0.01, 1.1, 8), { tone: 'lo', pal: 'dark', name: 'Normal', ex: [0, 0.2, 0] });
  placeRay(normal, [X1 - 0.02, 0.9, 0], [X1 - 1.12, 0.9, 0]);
  const i = M.REFL.iDeg * DEG;
  // incident from left-up, hit at (X1, 0.9, 0), reflected left-down symmetrically about -x normal
  // Normal is -x. Incident direction toward hit: angle i from normal in xy plane.
  const hit = [X1 - 0.02, 0.9, 0];
  const incFrom = [hit[0] - Math.cos(i) * 1.3, hit[1] + Math.sin(i) * 1.3, 0];
  const refTo = [hit[0] - Math.cos(i) * 1.3, hit[1] - Math.sin(i) * 1.3, 0];
  const ri = part(g1, cyl(0.014, 1, 8), { tone: 'hi', pal: 'red', name: 'Incident', ex: [0, 0.25, 0] });
  const rr = part(g1, cyl(0.014, 1, 8), { tone: 'hi', pal: 'blue', name: 'Reflected', ex: [0, 0.25, 0] });
  placeRay(ri, incFrom, hit);
  placeRay(rr, hit, refTo);
  label('mark', '法線', () => V(X1 - 0.7, 1.15, 0));
  label('mark', `i = ${M.REFL.iDeg}°`, () => V(incFrom[0] + 0.15, incFrom[1], 0));
  label('mark', `r = ${M.REFL.iDeg}°`, () => V(refTo[0] + 0.15, refTo[1], 0));

  // =====================================================================================
  // 2 · plane mirror imaging
  const X2 = STATIONS.mirror;
  part(root, box(3.6, 0.02, 2.0, 0.005), { tone: 'lo', pal: 'board', pos: [X2, 0.01, 0], name: 'Table' });
  const g2 = asm('mirror', root, { title: '平面鏡成像', sub: '虛像與物對稱' });
  g2.userData.focus = () => ({ target: [X2, 0.7, 0], radius: 1.6 });
  part(g2, box(0.04, 1.8, 1.5, 0.01), { tone: 'hi', pal: 'paper', pos: [X2, 1.0, 0], name: 'Mirror', ex: [0.25, 0, 0] });
  // object arrow
  part(g2, box(0.12, M.MIRROR.h, 0.12, 0.02), {
    tone: 'hi', pal: 'red',
    pos: [X2 + M.MIRROR.objX, M.MIRROR.h / 2 + 0.02, 0],
    name: 'Object', ex: [-0.25, 0.2, 0],
  });
  // virtual image (ghost)
  const imgX = M.mirrorImageX();
  const img = part(g2, box(0.12, M.MIRROR.h, 0.12, 0.02), {
    tone: 'mid', pal: 'blue',
    pos: [X2 + imgX, M.MIRROR.h / 2 + 0.02, 0],
    name: 'Image', ex: [0.25, 0.2, 0],
  });
  img.material = shadeMat('blue', { opacity: 0.45 });
  // eye
  part(g2, cyl(0.1, 0.08, 12), { tone: 'hi', pal: 'ink', pos: [X2 + M.MIRROR.objX - 0.55, 0.55, 0.55], name: 'Eye', ex: [0, 0.2, 0.2] });
  label('mark', '物', () => V(X2 + M.MIRROR.objX, M.MIRROR.h + 0.2, 0));
  label('mark', '虛像', () => V(X2 + imgX, M.MIRROR.h + 0.2, 0));

  // =====================================================================================
  // 3 · refraction
  const X3 = STATIONS.refract;
  part(root, box(3.4, 0.02, 2.0, 0.005), { tone: 'lo', pal: 'board', pos: [X3, 0.01, 0], name: 'Table' });
  const g3 = asm('refract', root, { title: '折射', sub: '斯涅爾定律' });
  g3.userData.focus = () => ({ target: [X3, 0.7, 0], radius: 1.5 });
  // glass block
  const glass = part(g3, box(1.4, 1.2, 1.0, 0.02), {
    tone: 'mid', pal: 'blue',
    pos: [X3 + 0.5, 0.7, 0],
    name: 'Glass', ex: [0, 0.35, 0],
  });
  glass.material = shadeMat('blue', { opacity: 0.28 });
  const sn = M.snell();
  const i3 = sn.iDeg * DEG, r3 = sn.rDeg * DEG;
  const iface = [X3 - 0.2, 0.7, 0];
  const inc3 = [iface[0] - Math.cos(i3) * 1.2, iface[1] + Math.sin(i3) * 1.2, 0];
  const refrTo = [iface[0] + Math.cos(r3) * 1.3, iface[1] - Math.sin(r3) * 1.3, 0];
  const nline = part(g3, cyl(0.01, 1, 8), { tone: 'lo', pal: 'dark', name: 'Normal' });
  placeRay(nline, [iface[0], iface[1] + 0.7, 0], [iface[0], iface[1] - 0.7, 0]);
  const ri3 = part(g3, cyl(0.014, 1, 8), { tone: 'hi', pal: 'red', name: 'Incident', ex: [0, 0.2, 0] });
  const rr3 = part(g3, cyl(0.014, 1, 8), { tone: 'hi', pal: 'blue', name: 'Refracted', ex: [0, 0.2, 0] });
  placeRay(ri3, inc3, iface);
  placeRay(rr3, iface, refrTo);
  label('mark', '空氣', () => V(X3 - 1.0, 1.5, 0));
  label('mark', '玻璃', () => V(X3 + 0.5, 1.5, 0));
  label('mark', `i=${sn.iDeg}°`, () => V(inc3[0], inc3[1] + 0.15, 0));
  label('mark', `r=${sn.rDeg.toFixed(0)}°`, () => V(refrTo[0], refrTo[1] - 0.15, 0));

  // =====================================================================================
  // 4 · dispersion / prism
  const X4 = STATIONS.prism;
  part(root, box(3.6, 0.02, 2.2, 0.005), { tone: 'lo', pal: 'board', pos: [X4, 0.01, 0], name: 'Table' });
  const g4 = asm('prism', root, { title: '色散與顏色', sub: '白光經稜鏡分開' });
  g4.userData.focus = () => ({ target: [X4 + 0.3, 0.8, 0], radius: 1.6 });
  // triangular prism as three thin boxes approx — use a wedge via rotated box
  const prism = part(g4, box(1.2, 1.0, 0.7, 0.02), {
    tone: 'mid', pal: 'paper',
    pos: [X4, 0.7, 0],
    rot: [0, 0, 0.35],
    name: 'Prism', ex: [0, 0.4, 0],
  });
  prism.material = shadeMat('paper', { opacity: 0.55 });
  // white incident
  const white = part(g4, cyl(0.016, 1, 8), { tone: 'hi', pal: 'paper', name: 'White', ex: [0, 0.2, 0] });
  placeRay(white, [X4 - 1.6, 0.95, 0], [X4 - 0.45, 0.75, 0]);
  // R G B exit fans
  const red = part(g4, cyl(0.012, 1, 8), { tone: 'hi', pal: 'red', name: 'Red', ex: [0.1, 0.15, 0] });
  const grn = part(g4, cyl(0.012, 1, 8), { tone: 'hi', pal: 'base', name: 'Green', ex: [0.1, 0.2, 0] });
  const blu = part(g4, cyl(0.012, 1, 8), { tone: 'hi', pal: 'blue', name: 'Blue', ex: [0.1, 0.25, 0] });
  placeRay(red, [X4 + 0.35, 0.7, 0], [X4 + 1.7, 1.15, 0]);
  placeRay(grn, [X4 + 0.35, 0.65, 0], [X4 + 1.7, 0.7, 0]);
  placeRay(blu, [X4 + 0.35, 0.6, 0], [X4 + 1.7, 0.25, 0]);
  label('mark', '白光', () => V(X4 - 1.5, 1.2, 0));
  label('mark', '紅', () => V(X4 + 1.85, 1.2, 0));
  label('mark', '藍', () => V(X4 + 1.85, 0.25, 0));

  // =====================================================================================
  // 5 · thin lens (senior)
  const X5 = STATIONS.lens;
  part(root, box(4.2, 0.02, 2.2, 0.005), { tone: 'lo', pal: 'board', pos: [X5, 0.01, 0], name: 'Table' });
  const g5 = asm('lens', root, { title: '凸透鏡成像', sub: '定性：實像倒立' });
  g5.userData.focus = () => ({ target: [X5, 0.8, 0], radius: 2.0 });
  // lens as thin disk (cylinder along z)
  const lens = part(g5, cyl(0.85, 0.08, 32), {
    tone: 'mid', pal: 'blue',
    pos: [X5, 0.95, 0],
    rot: [0, 0, Math.PI / 2],
    name: 'Lens', ex: [0, 0.35, 0],
  });
  lens.material = shadeMat('blue', { opacity: 0.35 });
  const L = M.thinLens();
  part(g5, box(0.12, M.LENS.h, 0.12, 0.02), {
    tone: 'hi', pal: 'red',
    pos: [X5 + L.u, M.LENS.h / 2 + 0.05, 0],
    name: 'Object', ex: [-0.2, 0.2, 0],
  });
  const himg = Math.abs(L.hImage);
  const img5 = part(g5, box(0.12, himg, 0.12, 0.02), {
    tone: 'mid', pal: 'blue',
    pos: [X5 + L.v, himg / 2 + 0.05, 0],
    name: 'Image', ex: [0.2, 0.2, 0],
  });
  // focal marks
  part(g5, box(0.06, 0.06, 0.06, 0.01), { tone: 'hi', pal: 'ink', pos: [X5 - M.LENS.f, 0.08, 0], name: 'Focus' });
  part(g5, box(0.06, 0.06, 0.06, 0.01), { tone: 'hi', pal: 'ink', pos: [X5 + M.LENS.f, 0.08, 0], name: 'Focus' });
  // chief rays (approx)
  const rayA = part(g5, cyl(0.01, 1, 8), { tone: 'hi', pal: 'red', name: 'Ray' });
  const rayB = part(g5, cyl(0.01, 1, 8), { tone: 'hi', pal: 'red', name: 'Ray' });
  placeRay(rayA, [X5 + L.u, M.LENS.h, 0], [X5, M.LENS.h, 0]);
  placeRay(rayB, [X5, M.LENS.h, 0], [X5 + L.v, 0.08, 0]);
  label('mark', '物', () => V(X5 + L.u, M.LENS.h + 0.25, 0));
  label('mark', '像', () => V(X5 + L.v, himg + 0.25, 0));
  label('mark', 'F', () => V(X5 + M.LENS.f, 0.25, 0));

  function update(clock) {
    // gentle pulse on lamp / prism colors — keep static MVP; clock reserved
    void clock;
  }

  return { update, labels };
}
