// Chapter 16 · Optics — English MVP (Macao Science Center).
import * as M from './model.js';
import { STATIONS } from './world.js';

const f = (x, n = 1) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const at = (k, dx = 0, dy = 0.8, dz = 0) => [STATIONS[k] + dx, dy, dz];

export const PAGES = [
  {
    levels: ['junior', 'senior'],
    kicker: 'Chapter 16', title: 'Optics', sub: 'How light travels',
    body: `
      <p class="lede">In a uniform medium, light travels roughly in a <b>straight line</b>. When an opaque object blocks rays from a lamp, a <b>shadow</b> appears on the screen behind it.</p>
      <p>The size and shape of the shadow depend on the relative positions of the source, the object and the screen. Everyday shadows (sundials, hand silhouettes) rest on this idea.</p>
      <p class="hintline">Click the scene for a short explanation; red rods show ray paths.</p>`,
    cam: { target: at('shadow', 0.3, 0.9), az: -18, el: 14, dist: 7.5 }, lit: 'shadow', scene: 'shadow', look: {},
    fig: 'Point source, block and shadow',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.1', title: 'Law of reflection', sub: 'i = r',
    body: `
      <p class="lede">When light hits a smooth surface (a plane mirror), it <b>reflects</b>. Draw the normal at the point of incidence:</p>
      <div class="eq"><i>i</i> = <i>r</i></div>
      <p>The angle of incidence equals the angle of reflection; the incident ray, normal and reflected ray lie in one plane. Red = incident, blue = reflected, dark = normal.</p>
      <p class="hintline">Use the slider to change the incident angle; the reflected ray follows. Click for live readouts.</p>`,
    cam: { target: at('reflect', 0, 0.9), az: -22, el: 12, dist: 6.8 }, lit: 'reflect', scene: 'reflect', look: {},
    fig: 'Reflection at a plane mirror',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.2', title: 'Plane-mirror image', sub: 'Upright virtual image',
    body: `
      <p class="lede">A plane mirror forms a <b>virtual image</b>: rays never meet behind the mirror, but the eye traces reflected rays backward and “sees” the image there.</p>
      <p>Object and image are <b>symmetric</b> across the mirror: equal distances, equal heights, left–right reversed. Here |<i>u</i>| = ${f(Math.abs(M.MIRROR.objX), 1)}.</p>
      <p class="hintline">The figure shows the object, virtual image and a sample ray toward the eye.</p>`,
    cam: { target: at('mirror', 0, 0.9), az: -16, el: 12, dist: 7.2 }, lit: 'mirror', scene: 'mirror', look: {},
    fig: 'Object and virtual image',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.3', title: 'Refraction', sub: "Snell's law (intro)",
    body: `
      <p class="lede">When light crosses from one transparent medium into another, its direction usually changes — <b>refraction</b>. Air ≈ <i>n</i><sub>1</sub> = ${M.REFR.n1}, glass ≈ <i>n</i><sub>2</sub> = ${M.REFR.n2}.</p>
      <div class="eq"><i>n</i><sub>1</sub> sin <i>i</i> = <i>n</i><sub>2</sub> sin <i>r</i></div>
      <p>Entering a denser medium (larger <i>n</i>), the refracted ray bends toward the normal. Move the slider and watch <i>r</i> change.</p>
      <p class="hintline">Junior focus: the phenomenon; the formula bridges to senior work.</p>`,
    cam: { target: at('refract', 0.2, 0.8), az: -20, el: 10, dist: 7.0 }, lit: 'refract', scene: 'refract', look: {},
    fig: 'Air into glass',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.4', title: 'Dispersion & colour', sub: 'White light and a prism',
    body: `
      <p class="lede">Sunlight (white light) mixes many colours. Through a transparent <b>prism</b>, different colours refract by slightly different amounts and fan into a spectrum — <b>dispersion</b>.</p>
      <p>Red usually bends least; blue–violet bends more. Object colour depends on which wavelengths are reflected or transmitted.</p>
      <p class="hintline">Sketch: white in; red, green and blue out at different angles.</p>`,
    cam: { target: at('prism', 0.2, 0.85), az: -14, el: 12, dist: 7.5 }, lit: 'prism', scene: 'prism', look: {},
    fig: 'Prism dispersion (sketch)',
  },
  {
    levels: ['senior'],
    kicker: '16.5', title: 'Convex lens', sub: 'Qualitative (extension)',
    body: `
      <p class="lede">A convex lens brings parallel rays to a focus. Three construction rays: parallel → through the far focus; through the optical centre undeviated; through the near focus → parallel after the lens.</p>
      <div class="eq">1/<i>v</i> − 1/<i>u</i> = 1/<i>f</i></div>
      <p>Here <i>f</i> = ${f(M.LENS.f, 1)}, <i>u</i> = ${f(M.LENS.objX, 1)}. Beyond 2<i>f</i>, the image is often real, inverted and diminished — senior extension, not required at junior level.</p>
      <p class="hintline">Coloured rods sketch the three principal rays.</p>`,
    cam: { target: at('lens', 0, 0.9), az: -12, el: 10, dist: 9.5 }, lit: 'lens', scene: 'lens', look: {},
    fig: 'Real image by a convex lens',
  },
];

export const PLATES = {
  shadow: {
    title: 'Straight-line rays & shadow', sub: 'Blocked light',
    text: `Treat the lamp as a point source. Where the block cuts rays, the screen is darker — a shadow. Edge rays from lamp through the block’s rim sketch the umbra boundary.`,
    facts: () => [['Model', 'Point source + opaque block'], ['Idea', 'Straight rays → shadow'], ['Level', 'Junior light']],
  },
  reflect: {
    title: 'Law of reflection', sub: 'i = r',
    text: `Red = incident, blue = reflected, dark = normal. Angles are measured from the normal. Move the slider: reflected angle tracks so i = r always.`,
    facts: () => [['i', `${M.REFL.iDeg.toFixed(0)}°`], ['r', `${M.REFL.iDeg.toFixed(0)}°`], ['Rule', 'i = r']],
  },
  mirror: {
    title: 'Plane-mirror image', sub: 'Virtual & symmetric',
    text: `The virtual image sits behind the mirror, symmetric to the object. Rays never reach that point; the eye extrapolates reflected rays backward.`,
    facts: () => [['|u|', f(Math.abs(M.MIRROR.objX), 1)], ['|v|', f(Math.abs(M.mirrorImageX()), 1)], ['Image', 'Upright, virtual']],
  },
  refract: {
    title: 'Refraction', sub: "Snell's law",
    text: `Air → glass (n from ${M.REFR.n1} to ${M.REFR.n2}): the refracted ray bends toward the normal. n₁ sin i = n₂ sin r. Use the slider to vary i.`,
    facts: () => {
      const sn = M.snell();
      return [['n₁', `${M.REFR.n1}`], ['n₂', `${M.REFR.n2}`], ['i', `${sn.iDeg.toFixed(0)}°`], ['r', `${sn.rDeg.toFixed(0)}°`]];
    },
  },
  prism: {
    title: 'Dispersion', sub: 'White light splits',
    text: `Different colours have slightly different n in glass, so they leave the prism at different angles. Red usually bends least; blue more.`,
    facts: () => [['Apex A', `${M.PRISM.A}°`], ['Trend', 'n_blue > n_red'], ['Effect', 'Dispersion']],
  },
  lens: {
    title: 'Convex lens', sub: 'Senior extension',
    text: `Three principal rays locate the real image. With |u| > f, the image is real and inverted. Thin-lens formula estimates v.`,
    facts: () => {
      const L = M.thinLens();
      return [['f', f(M.LENS.f, 1)], ['u', f(L.u, 1)], ['v', f(L.v, 1)], ['m', f(L.m, 2)]];
    },
  },
};
