// Chapter 16 · Optics — English MVP (Macao Science Center).
import * as M from './model.js';
import { STATIONS } from './world.js';

const f = (x, n = 1) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const at = (k, dx = 0, dy = 0.8, dz = 0) => [STATIONS[k] + dx, dy, dz];
const sn = M.snell();
const L = M.thinLens();

export const PAGES = [
  {
    levels: ['junior', 'senior'],
    kicker: 'Chapter 16', title: 'Optics', sub: 'How light travels',
    body: `
      <p class="lede">In a uniform medium, light travels in approximately <b>straight lines</b>. When rays from a lamp are blocked by an opaque object, a <b>shadow</b> appears on the screen behind.</p>
      <p>The size and shape of the shadow depend on where the lamp, the object and the screen sit: closer to the lamp, the shadow is usually larger.</p>
      <p class="hintline">Click the scene to break apart the lamp, block and shadow.</p>`,
    cam: { target: at('shadow', 0.3, 0.9), az: -18, el: 14, dist: 7.5 }, lit: 'shadow', scene: 'shadow', look: {},
    fig: 'Point lamp, block and shadow',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.1', title: 'Law of reflection', sub: 'i equals r',
    body: `
      <p class="lede">Light that meets a smooth surface (a plane mirror) is <b>reflected</b>. Draw the normal at the point of incidence (perpendicular to the mirror):</p>
      <div class="eq"><i>i</i> = <i>r</i></div>
      <p>The <b>angle of incidence equals the angle of reflection</b>; the incident ray, the normal and the reflected ray lie in one plane. Here <i>i</i> = ${M.REFL.iDeg}°.</p>
      <p class="hintline">Click to separate the incident ray, reflected ray and normal.</p>`,
    cam: { target: at('reflect', 0, 0.9), az: -22, el: 12, dist: 6.8 }, lit: 'reflect', scene: 'reflect', look: {},
    fig: 'Reflection at a plane mirror',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.2', title: 'Plane-mirror image', sub: 'Upright virtual image',
    body: `
      <p class="lede">A plane mirror forms a <b>virtual image</b>: rays do not really meet behind the mirror, but the eye traces the reflected rays backward and locates an image there.</p>
      <p>Object and image are <b>symmetric</b> in the mirror: equal distances, equal height, left–right reversed. Here |<i>u</i>| = ${f(Math.abs(M.MIRROR.objX), 1)}.</p>
      <p class="hintline">Click to separate object, virtual image and eye.</p>`,
    cam: { target: at('mirror', 0, 0.9), az: -16, el: 12, dist: 7.2 }, lit: 'mirror', scene: 'mirror', look: {},
    fig: 'Object and virtual image',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.3', title: 'Refraction', sub: 'Snell’s law (intro)',
    body: `
      <p class="lede">When light passes from one transparent medium into another, its direction usually changes — <b>refraction</b>. Air has <i>n</i><sub>1</sub> ≈ ${M.REFR.n1}; glass ≈ <i>n</i><sub>2</sub> = ${M.REFR.n2}.</p>
      <div class="eq"><i>n</i><sub>1</sub> sin <i>i</i> = <i>n</i><sub>2</sub> sin <i>r</i></div>
      <p>Here <i>i</i> = ${f(sn.iDeg, 0)}° and <i>r</i> ≈ ${f(sn.rDeg, 0)}°. Going into a denser medium (larger <i>n</i>), the refracted ray bends toward the normal.</p>`,
    cam: { target: at('refract', 0.2, 0.8), az: -20, el: 10, dist: 7.0 }, lit: 'refract', scene: 'refract', look: {},
    fig: 'Air into glass',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.4', title: 'Dispersion and colour', sub: 'White light and a prism',
    body: `
      <p class="lede">Sunlight or white light is a mixture of colours. Through a transparent <b>prism</b>, different colours have slightly different refractive indices, so they bend by different amounts and spread into a spectrum — <b>dispersion</b>.</p>
      <p>Red usually bends least; blue–violet bends more. The colours we see on objects come from which wavelengths they reflect or transmit.</p>
      <p class="hintline">Click the prism to separate white light and the coloured exit rays.</p>`,
    cam: { target: at('prism', 0.2, 0.85), az: -14, el: 12, dist: 7.5 }, lit: 'prism', scene: 'prism', look: {},
    fig: 'Prism dispersion (schematic)',
  },
  {
    levels: ['senior'],
    kicker: '16.5', title: 'Convex-lens image', sub: 'Qualitative (extension)',
    body: `
      <p class="lede">A convex lens brings parallel rays together near a focal point. The thin-lens equation (Cartesian sign convention):</p>
      <div class="eq">1/<i>v</i> − 1/<i>u</i> = 1/<i>f</i></div>
      <p>With <i>f</i> = ${f(M.LENS.f, 1)}, <i>u</i> = ${f(L.u, 1)}, we get <i>v</i> ≈ ${f(L.v, 1)} and <i>m</i> ≈ ${f(L.m, 2)}. Beyond 2<i>f</i>, the image is often real, inverted and diminished — senior extension, not a junior must-know.</p>`,
    cam: { target: at('lens', 0, 0.9), az: -12, el: 10, dist: 9.5 }, lit: 'lens', scene: 'lens', look: {},
    fig: 'Real image through a convex lens',
  },
];

export const PLATES = {
  shadow: {
    title: 'Straight rays and shadow', sub: 'light meets an obstacle',
    text: `The lamp acts like a point source. Where the block cuts the rays, the screen is darker — that is the shadow. Because light travels in straight lines, the shadow’s edge follows the line from the lamp past the block’s edge.`,
    facts: () => [['model', 'point source + opaque block'], ['idea', 'straight rays → shadow'], ['level', 'junior light']],
  },
  reflect: {
    title: 'Law of reflection', sub: 'i equals r',
    text: `Red: incident ray. Blue: reflected ray. Dark: normal. Angles are measured from the normal: here i = r = ${M.REFL.iDeg}°. A smooth plane mirror is close to ideal reflection.`,
    facts: () => [['i', `${M.REFL.iDeg}°`], ['r', `${M.REFL.iDeg}°`], ['rule', 'i = r']],
  },
  mirror: {
    title: 'Plane-mirror image', sub: 'virtual and symmetric',
    text: `The object stands in front of the mirror; the virtual image sits equally far behind it. Rays never meet at the image — the eye extends the reflected rays backward. Equal height; left–right reversed.`,
    facts: () => [['|u|', f(Math.abs(M.MIRROR.objX), 1)], ['|v|', f(Math.abs(M.mirrorImageX()), 1)], ['image', 'upright, virtual']],
  },
  refract: {
    title: 'Refraction', sub: 'Snell’s law',
    text: `From air into glass (n from ${M.REFR.n1} to ${M.REFR.n2}) the refracted ray bends toward the normal. Quantitatively: n₁ sin i = n₂ sin r.`,
    facts: () => [['n₁', `${M.REFR.n1}`], ['n₂', `${M.REFR.n2}`], ['i', `${f(sn.iDeg, 0)}°`], ['r', `${f(sn.rDeg, 0)}°`]],
  },
  prism: {
    title: 'Dispersion and colour', sub: 'white light spreads',
    text: `White light holds many colours. A prism’s refractive index varies slightly with colour, so each colour bends differently and they separate. Red usually bends least; blue bends more.`,
    facts: () => [['A', `${M.PRISM.A}°`], ['trend', 'n_blue > n_red'], ['effect', 'dispersion']],
  },
  lens: {
    title: 'Convex-lens image', sub: 'senior extension',
    text: `Near-axis rays parallel to the principal axis pass near the focal point after a convex lens. Here the object is outside the focal length, forming a real image. 1/v − 1/u = 1/f estimates v.`,
    facts: () => [['f', f(M.LENS.f, 1)], ['u', f(L.u, 1)], ['v', f(L.v, 1)], ['m', f(L.m, 2)]],
  },
};
