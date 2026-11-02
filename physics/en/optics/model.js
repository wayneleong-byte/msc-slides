// Optics MVP: straight rays, reflection, plane mirror, refraction, dispersion, thin lens.
// Mutable angles for interactive demos (setIncidentDeg).
export const DEG = Math.PI / 180;
export const G = 9.8; // unused; kept for atlas habit

export const SHADOW = {
  lamp: [-1.2, 1.4, 0],
  blockW: 0.5, blockH: 0.7, blockD: 0.2,
  blockX: 0.3,
  screenX: 1.8,
  screenH: 2.2,
  screenW: 0.04,
};

/** Reflection: angle of incidence from the normal (degrees). Mutable. */
export const REFL = { iDeg: 35 };
export const reflAngles = (i = REFL.iDeg) => ({ i, r: i });

export const MIRROR = { objX: -1.1, h: 0.55 };
export const mirrorImageX = (objX = MIRROR.objX) => -objX;

/** Refraction air → glass. Mutable iDeg. */
export const REFR = { n1: 1.0, n2: 1.50, iDeg: 40 };
export function snell(iDeg = REFR.iDeg, n1 = REFR.n1, n2 = REFR.n2) {
  const i = iDeg * DEG;
  const s = n1 * Math.sin(i) / n2;
  if (s >= 1) return { iDeg, rDeg: 90, critical: true };
  return { iDeg, rDeg: Math.asin(s) / DEG, critical: false };
}

export const PRISM = {
  A: 60,
  nR: 1.51, nG: 1.52, nB: 1.53,
};
export function prismExit(n, A = PRISM.A, i1 = 45) {
  const r1 = Math.asin(Math.sin(i1 * DEG) / n) / DEG;
  const r2 = A - r1;
  const s = n * Math.sin(r2 * DEG);
  if (Math.abs(s) >= 1) return { r1, r2, i2: 90, ok: false };
  return { r1, r2, i2: Math.asin(s) / DEG, ok: true };
}

export const LENS = { f: 1.2, objX: -2.4, h: 0.7 };
export function thinLens(u = LENS.objX, f = LENS.f) {
  const inv = 1 / f + 1 / u;
  const v = 1 / inv;
  const m = v / u;
  return { u, v, m, hImage: LENS.h * m };
}

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

/** Set incident angle (deg) for reflection or refraction scenes. */
export function setIncidentDeg(scene, deg) {
  const d = clamp(Number(deg) || 0, 5, 80);
  if (scene === 'reflect') REFL.iDeg = d;
  else if (scene === 'refract') REFR.iDeg = d;
  return d;
}

export function getIncidentDeg(scene) {
  if (scene === 'reflect') return REFL.iDeg;
  if (scene === 'refract') return REFR.iDeg;
  return null;
}
