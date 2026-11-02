import * as M from './model.js';
const f = (x, n = 0) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const sn = M.snell();
const eq = s => `<div class="eq">${s}</div>`;

export const PRACTICE = {
  0: [
    { q: 'In uniform air, a flashlight beam is best described as travelling:',
      choices: ['along a curve', 'in a straight line', 'only upward', 'around every obstacle'], answer: 1,
      why: '<p>In a uniform medium, light travels approximately in straight lines; opaque objects cast shadows.</p>' },
  ],
  1: [
    { q: `If the angle of incidence is ${M.REFL.iDeg}°, the angle of reflection is:`,
      choices: [`${M.REFL.iDeg / 2}°`, `${90 - M.REFL.iDeg}°`, `${M.REFL.iDeg}°`, `${2 * M.REFL.iDeg}°`], answer: 2,
      why: `<p>Law of reflection: i = r.</p>${eq('i = r')}` },
  ],
  2: [
    { q: 'The image in a plane mirror is usually:',
      choices: ['real and inverted', 'virtual and upright', 'virtual and inverted', 'real and upright behind the mirror'], answer: 1,
      why: '<p>A plane mirror forms an upright virtual image, symmetric to the object.</p>' },
  ],
  3: [
    { q: `Light goes from air (n≈1) into glass (n≈1.5) at i = ${f(sn.iDeg)}°. Compared with i, the refraction angle r is:`,
      choices: ['larger', 'smaller', 'always equal', 'impossible to tell'], answer: 1,
      why: `<p>Into a denser medium, the ray bends toward the normal, so r &lt; i. Here r ≈ ${f(sn.rDeg)}°.</p>${eq('n₁ sin i = n₂ sin r')}` },
  ],
  4: [
    { q: 'White light spreads into colours through a prism mainly because:',
      choices: ['the prism emits light', 'different colours have different refractive indices', 'reflection fails', 'the shadow is magnified'], answer: 1,
      why: '<p>Dispersion: refractive index depends slightly on colour, so bend angles differ.</p>' },
  ],
  5: [
    { q: 'Which statement about a convex lens is most reasonable (extension)?',
      choices: ['It can only form virtual images', 'It can bring parallel rays together near a focal point', 'Magnification is largest when u = 0 for a real image', 'Colour never matters inside glass'], answer: 1,
      why: '<p>A convex lens converges near-axis parallel rays near its focal point; image type depends on object distance.</p>' },
  ],
};
