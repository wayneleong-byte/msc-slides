// Optics: paper scenes along +x. Rays / normal / angles update live — NO explode (ex = 0).
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

  const grid = [];
  for (let x = -4; x <= 62; x++) grid.push(x, 0.001, -3, x, 0.001, 3);
  for (let z = -3; z <= 3; z++) grid.push(-4, 0.001, z, 62, 0.001, z);
  lines(root, grid, '#e6e6e2');

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
  const g0 = asm('shadow', root, { title: 'Straight-line rays & shadow', sub: 'Blocked light makes a shadow' });
  g0.userData.focus = () => ({ target: [X0 + 0.4, 0.9, 0], radius: 1.6 });
  part(g0, cyl(0.12, 0.16, 16), { tone: 'hi', pal: 'ink', pos: [X0 + M.SHADOW.lamp[0], M.SHADOW.lamp[1], 0], name: 'Lamp' });
  part(g0, box(0.08, 0.08, 0.08, 0.01), { tone: 'lit', pal: 'red', pos: [X0 + M.SHADOW.lamp[0], M.SHADOW.lamp[1] - 0.12, 0], name: 'Bulb' });
  part(g0, box(M.SHADOW.blockW, M.SHADOW.blockH, M.SHADOW.blockD, 0.02), {
    tone: 'mid', pal: 'dark',
    pos: [X0 + M.SHADOW.blockX, M.SHADOW.blockH / 2, 0],
    name: 'Block',
  });
  part(g0, box(M.SHADOW.screenW, M.SHADOW.screenH, 1.6, 0.01), {
    tone: 'lo', pal: 'paper',
    pos: [X0 + M.SHADOW.screenX, M.SHADOW.screenH / 2, 0],
    name: 'Screen',
  });
  part(g0, box(0.02, 0.95, 0.55, 0.005), {
    tone: 'hi', pal: 'ink',
    pos: [X0 + M.SHADOW.screenX - 0.03, 0.55, 0],
    name: 'Shadow',
  });
  const r01 = part(g0, cyl(0.012, 1, 8), { tone: 'hi', pal: 'red', name: 'Ray' });
  const r02 = part(g0, cyl(0.012, 1, 8), { tone: 'hi', pal: 'red', name: 'Ray' });
  const r03 = part(g0, cyl(0.010, 1, 8), { tone: 'mid', pal: 'red', name: 'Ray' });
  const r04 = part(g0, cyl(0.010, 1, 8), { tone: 'mid', pal: 'red', name: 'Ray' });
  const lampPt = [X0 + M.SHADOW.lamp[0], M.SHADOW.lamp[1] - 0.12, 0];
  placeRay(r01, lampPt, [X0 + M.SHADOW.blockX, M.SHADOW.blockH, 0]);
  placeRay(r02, lampPt, [X0 + M.SHADOW.blockX, 0.05, 0]);
  // rays that graze block top/bottom and continue to screen (shadow edges)
  placeRay(r03, [X0 + M.SHADOW.blockX, M.SHADOW.blockH, 0], [X0 + M.SHADOW.screenX, 1.05, 0]);
  placeRay(r04, [X0 + M.SHADOW.blockX, 0.05, 0], [X0 + M.SHADOW.screenX, 0.12, 0]);
  label('mark', 'Lamp', () => V(X0 + M.SHADOW.lamp[0], M.SHADOW.lamp[1] + 0.28, 0));
  label('mark', 'Block', () => V(X0 + M.SHADOW.blockX, M.SHADOW.blockH + 0.25, 0));
  label('mark', 'Shadow', () => V(X0 + M.SHADOW.screenX + 0.25, 0.7, 0));

  // =====================================================================================
  // 1 · reflection (interactive angle)
  const X1 = STATIONS.reflect;
  part(root, box(3.2, 0.02, 2.0, 0.005), { tone: 'lo', pal: 'board', pos: [X1, 0.01, 0], name: 'Table' });
  const g1 = asm('reflect', root, { title: 'Law of reflection', sub: 'Angle of incidence = angle of reflection' });
  g1.userData.focus = () => ({ target: [X1, 0.7, 0], radius: 1.4 });
  part(g1, box(0.04, 1.6, 1.4, 0.01), { tone: 'hi', pal: 'paper', pos: [X1, 0.9, 0], name: 'Mirror' });
  const normal = part(g1, cyl(0.01, 1.1, 8), { tone: 'lo', pal: 'dark', name: 'Normal' });
  const hit = [X1 - 0.02, 0.9, 0];
  placeRay(normal, hit, [hit[0] - 1.12, hit[1], 0]);
  const ri = part(g1, cyl(0.014, 1, 8), { tone: 'hi', pal: 'red', name: 'Incident' });
  const rr = part(g1, cyl(0.014, 1, 8), { tone: 'hi', pal: 'blue', name: 'Reflected' });
  const placeReflect = () => {
    const i = M.REFL.iDeg * DEG;
    const incFrom = [hit[0] - Math.cos(i) * 1.3, hit[1] + Math.sin(i) * 1.3, 0];
    const refTo = [hit[0] - Math.cos(i) * 1.3, hit[1] - Math.sin(i) * 1.3, 0];
    placeRay(ri, incFrom, hit);
    placeRay(rr, hit, refTo);
    return { incFrom, refTo };
  };
  placeReflect();
  label('mark', 'Normal', () => V(X1 - 0.7, 1.15, 0));
  label('mark', '', () => {
    const i = M.REFL.iDeg * DEG;
    return V(hit[0] - Math.cos(i) * 0.7, hit[1] + Math.sin(i) * 0.7 + 0.12, 0);
  }, () => `i = ${M.REFL.iDeg.toFixed(0)}°`);
  label('mark', '', () => {
    const i = M.REFL.iDeg * DEG;
    return V(hit[0] - Math.cos(i) * 0.7, hit[1] - Math.sin(i) * 0.7 - 0.12, 0);
  }, () => `r = ${M.REFL.iDeg.toFixed(0)}°`);

  // =====================================================================================
  // 2 · plane mirror imaging
  const X2 = STATIONS.mirror;
  part(root, box(3.6, 0.02, 2.0, 0.005), { tone: 'lo', pal: 'board', pos: [X2, 0.01, 0], name: 'Table' });
  const g2 = asm('mirror', root, { title: 'Plane-mirror image', sub: 'Virtual image, symmetric' });
  g2.userData.focus = () => ({ target: [X2, 0.7, 0], radius: 1.6 });
  part(g2, box(0.04, 1.8, 1.5, 0.01), { tone: 'hi', pal: 'paper', pos: [X2, 1.0, 0], name: 'Mirror' });
  part(g2, box(0.12, M.MIRROR.h, 0.12, 0.02), {
    tone: 'hi', pal: 'red',
    pos: [X2 + M.MIRROR.objX, M.MIRROR.h / 2 + 0.02, 0],
    name: 'Object',
  });
  const imgX = M.mirrorImageX();
  const img = part(g2, box(0.12, M.MIRROR.h, 0.12, 0.02), {
    tone: 'mid', pal: 'blue',
    pos: [X2 + imgX, M.MIRROR.h / 2 + 0.02, 0],
    name: 'Image',
  });
  img.material = shadeMat('blue', { opacity: 0.45 });
  // symmetry helpers + sample rays to eye
  const eye = [X2 + M.MIRROR.objX - 0.55, 0.55, 0.55];
  part(g2, cyl(0.1, 0.08, 12), { tone: 'hi', pal: 'ink', pos: eye, name: 'Eye' });
  const mRay1 = part(g2, cyl(0.010, 1, 8), { tone: 'hi', pal: 'red', name: 'Ray' });
  const mRay2 = part(g2, cyl(0.010, 1, 8), { tone: 'hi', pal: 'blue', name: 'Ray' });
  const mVirt = part(g2, cyl(0.008, 1, 8), { tone: 'lo', pal: 'blue', name: 'Virtual' });
  mVirt.material = shadeMat('blue', { opacity: 0.35 });
  const objTop = [X2 + M.MIRROR.objX, M.MIRROR.h, 0];
  const imgTop = [X2 + imgX, M.MIRROR.h, 0];
  const hitM = [X2 - 0.02, 0.85, 0.15];
  placeRay(mRay1, objTop, hitM);
  placeRay(mRay2, hitM, eye);
  placeRay(mVirt, hitM, imgTop);
  // dashed feel via thinner virtual ray already
  label('mark', 'Object', () => V(X2 + M.MIRROR.objX, M.MIRROR.h + 0.2, 0));
  label('mark', 'Virtual image', () => V(X2 + imgX, M.MIRROR.h + 0.2, 0));
  label('mark', 'Eye', () => V(eye[0], eye[1] + 0.22, eye[2]));

  // =====================================================================================
  // 3 · refraction (interactive)
  const X3 = STATIONS.refract;
  part(root, box(3.4, 0.02, 2.0, 0.005), { tone: 'lo', pal: 'board', pos: [X3, 0.01, 0], name: 'Table' });
  const g3 = asm('refract', root, { title: 'Refraction', sub: 'Snell's law' });
  g3.userData.focus = () => ({ target: [X3, 0.7, 0], radius: 1.5 });
  const glass = part(g3, box(1.4, 1.2, 1.0, 0.02), {
    tone: 'mid', pal: 'blue',
    pos: [X3 + 0.5, 0.7, 0],
    name: 'Glass',
  });
  glass.material = shadeMat('blue', { opacity: 0.28 });
  const iface = [X3 - 0.2, 0.7, 0];
  const nline = part(g3, cyl(0.01, 1, 8), { tone: 'lo', pal: 'dark', name: 'Normal' });
  placeRay(nline, [iface[0], iface[1] + 0.7, 0], [iface[0], iface[1] - 0.7, 0]);
  const ri3 = part(g3, cyl(0.014, 1, 8), { tone: 'hi', pal: 'red', name: 'Incident' });
  const rr3 = part(g3, cyl(0.014, 1, 8), { tone: 'hi', pal: 'blue', name: 'Refracted' });
  const placeRefract = () => {
    const sn = M.snell();
    const i3 = sn.iDeg * DEG, r3 = sn.rDeg * DEG;
    const inc3 = [iface[0] - Math.cos(i3) * 1.2, iface[1] + Math.sin(i3) * 1.2, 0];
    const refrTo = [iface[0] + Math.cos(r3) * 1.3, iface[1] - Math.sin(r3) * 1.3, 0];
    placeRay(ri3, inc3, iface);
    placeRay(rr3, iface, refrTo);
    return sn;
  };
  placeRefract();
  label('mark', 'Air', () => V(X3 - 1.0, 1.5, 0));
  label('mark', 'Glass', () => V(X3 + 0.5, 1.5, 0));
  label('mark', '', () => {
    const sn = M.snell(); const i3 = sn.iDeg * DEG;
    return V(iface[0] - Math.cos(i3) * 0.65, iface[1] + Math.sin(i3) * 0.65 + 0.12, 0);
  }, () => `i=${M.REFR.iDeg.toFixed(0)}°`);
  label('mark', '', () => {
    const sn = M.snell(); const r3 = sn.rDeg * DEG;
    return V(iface[0] + Math.cos(r3) * 0.7, iface[1] - Math.sin(r3) * 0.7 - 0.12, 0);
  }, () => `r=${M.snell().rDeg.toFixed(0)}°`);

  // =====================================================================================
  // 4 · dispersion / prism
  const X4 = STATIONS.prism;
  part(root, box(3.6, 0.02, 2.2, 0.005), { tone: 'lo', pal: 'board', pos: [X4, 0.01, 0], name: 'Table' });
  const g4 = asm('prism', root, { title: 'Dispersion & colour', sub: 'White light through a prism' });
  g4.userData.focus = () => ({ target: [X4 + 0.3, 0.8, 0], radius: 1.6 });
  const prism = part(g4, box(1.2, 1.0, 0.7, 0.02), {
    tone: 'mid', pal: 'paper',
    pos: [X4, 0.7, 0],
    rot: [0, 0, 0.35],
    name: 'Prism',
  });
  prism.material = shadeMat('paper', { opacity: 0.55 });
  const white = part(g4, cyl(0.016, 1, 8), { tone: 'hi', pal: 'paper', name: 'White' });
  placeRay(white, [X4 - 1.6, 0.95, 0], [X4 - 0.45, 0.75, 0]);
  const red = part(g4, cyl(0.012, 1, 8), { tone: 'hi', pal: 'red', name: 'Red' });
  const grn = part(g4, cyl(0.012, 1, 8), { tone: 'hi', pal: 'base', name: 'Green' });
  const blu = part(g4, cyl(0.012, 1, 8), { tone: 'hi', pal: 'blue', name: 'Blue' });
  placeRay(red, [X4 + 0.35, 0.7, 0], [X4 + 1.7, 1.15, 0]);
  placeRay(grn, [X4 + 0.35, 0.65, 0], [X4 + 1.7, 0.7, 0]);
  placeRay(blu, [X4 + 0.35, 0.6, 0], [X4 + 1.7, 0.25, 0]);
  label('mark', 'White', () => V(X4 - 1.5, 1.2, 0));
  label('mark', 'R', () => V(X4 + 1.85, 1.2, 0));
  label('mark', 'G', () => V(X4 + 1.85, 0.75, 0));
  label('mark', 'B', () => V(X4 + 1.85, 0.25, 0));

  // =====================================================================================
  // 5 · thin lens (senior) — three principal rays
  const X5 = STATIONS.lens;
  part(root, box(4.2, 0.02, 2.2, 0.005), { tone: 'lo', pal: 'board', pos: [X5, 0.01, 0], name: 'Table' });
  const g5 = asm('lens', root, { title: 'Convex lens', sub: 'Qualitative: real inverted image' });
  g5.userData.focus = () => ({ target: [X5, 0.8, 0], radius: 2.0 });
  const lens = part(g5, cyl(0.85, 0.08, 32), {
    tone: 'mid', pal: 'blue',
    pos: [X5, 0.95, 0],
    rot: [0, 0, Math.PI / 2],
    name: 'Lens',
  });
  lens.material = shadeMat('blue', { opacity: 0.35 });
  const L = M.thinLens();
  const objH = M.LENS.h;
  part(g5, box(0.12, objH, 0.12, 0.02), {
    tone: 'hi', pal: 'red',
    pos: [X5 + L.u, objH / 2 + 0.05, 0],
    name: 'Object',
  });
  const himg = Math.abs(L.hImage);
  const img5 = part(g5, box(0.12, himg, 0.12, 0.02), {
    tone: 'mid', pal: 'blue',
    pos: [X5 + L.v, himg / 2 + 0.05, 0],
    name: 'Image',
  });
  // inverted: flip visually by placing from axis
  img5.position.set(X5 + L.v, -himg / 2 - 0.05, 0); // real image below axis when m < 0
  part(g5, box(0.06, 0.06, 0.06, 0.01), { tone: 'hi', pal: 'ink', pos: [X5 - M.LENS.f, 0.08, 0], name: 'Focus' });
  part(g5, box(0.06, 0.06, 0.06, 0.01), { tone: 'hi', pal: 'ink', pos: [X5 + M.LENS.f, 0.08, 0], name: 'Focus' });
  // optic axis
  lines(g5, [X5 + L.u - 0.4, 0.02, 0, X5 + L.v + 0.5, 0.02, 0], '#b0b0aa');
  // 1) parallel → through far focus
  const rayA1 = part(g5, cyl(0.01, 1, 8), { tone: 'hi', pal: 'red', name: 'Ray' });
  const rayA2 = part(g5, cyl(0.01, 1, 8), { tone: 'hi', pal: 'red', name: 'Ray' });
  placeRay(rayA1, [X5 + L.u, objH, 0], [X5, objH, 0]);
  placeRay(rayA2, [X5, objH, 0], [X5 + L.v, -himg, 0]);
  // 2) through optical centre (undeviated)
  const rayB = part(g5, cyl(0.01, 1, 8), { tone: 'hi', pal: 'blue', name: 'Ray' });
  placeRay(rayB, [X5 + L.u, objH, 0], [X5 + L.v, -himg, 0]);
  // 3) through near focus → emerges parallel
  const rayC1 = part(g5, cyl(0.01, 1, 8), { tone: 'mid', pal: 'base', name: 'Ray' });
  const rayC2 = part(g5, cyl(0.01, 1, 8), { tone: 'mid', pal: 'base', name: 'Ray' });
  placeRay(rayC1, [X5 + L.u, objH, 0], [X5 - M.LENS.f, 0.05, 0]);
  // after lens: parallel at height intersecting at image — approximate via image tip
  placeRay(rayC2, [X5, -himg, 0], [X5 + L.v, -himg, 0]);
  label('mark', 'Object', () => V(X5 + L.u, objH + 0.25, 0));
  label('mark', 'Image', () => V(X5 + L.v, -himg - 0.2, 0));
  label('mark', 'F', () => V(X5 + M.LENS.f, 0.25, 0));
  label('mark', 'F', () => V(X5 - M.LENS.f, 0.25, 0));

  function update(clock) {
    void clock;
    placeReflect();
    placeRefract();
  }

  function setIncidentDeg(scene, deg) {
    const d = M.setIncidentDeg(scene, deg);
    placeReflect();
    placeRefract();
    return d;
  }

  return { update, labels, setIncidentDeg, getIncidentDeg: M.getIncidentDeg };
}
