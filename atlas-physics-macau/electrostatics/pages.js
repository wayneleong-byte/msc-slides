// Chapter 9, page by page (after the AP Physics C: E&M organizer, Unit 1). Text and a chart on
// the left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, S, E_SCALE, F_SCALE, PL } from './world.js';

const f = (x, n = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);
const sci = (x, n = 2) => { const p = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** p; return `${m.toFixed(n)} × 10<sup>${p < 0 ? '−' + -p : p}</sup>`; };
const cm = x => (x * 100).toFixed(0);
const kNC = x => (x / 1000).toFixed(2);

// ---------- small SVG charts for the left page ----------
const W = 420, H = 150, P = { l: 44, r: 14, t: 16, b: 30 };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], cursor, label }) {
  const sx = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy = y => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const zero = y0 < 0 && y1 > 0 ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${zero}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursor ? `<circle class="cursor" r="4.5" data-cursor="${cursor}"/>` : ''}
  </svg>`;
}
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };
const curve = (x0, x1, fn, n = 80) => Array.from({ length: n + 1 }, (_, i) => { const x = x0 + (x1 - x0) * i / n; return [x, fn(x)]; });
const clip = (y, y1) => Math.min(y, y1);
// chart ranges shared with main.js (live cursors)
export const RANGE = {
  induce: { x0: 0, x1: Math.ceil(M.INDUCE.run), y0: -1, y1: 4 },
  coulomb: { x0: 15, x1: 50, y0: 0, y1: 4 },
  line: { x0: 10, x1: 40, y0: -0.4, y1: 0.3 },
  field: { x0: 5, x1: 35, y0: 0, y1: 4 },
  dipole: { x0: 10, x1: 50, y0: 0, y1: 2 },
  rod: { x0: 0, x1: 40, y0: 0, y1: 4 },
  ring: { x0: 0, x1: 60, y0: 0, y1: 1.5 },
  plates: { x0: 0, x1: 12, y0: 0, y1: 14 },
};
const at = (k, x = 0, y = 0.4) => [STATIONS[k] + x, y, 0];
const R = RANGE;

const pairF = r => M.coulomb(M.PAIR.q1, M.PAIR.q2, r);
const inducedSeries = () => curve(0, M.INDUCE.run, t => M.induce(t).Qnet / M.nC, 200);

export const PAGES = [
  {
    kicker: 'Chapter 9', title: 'Electric charge', sub: 'counted in electrons',
    body: `
      <p class="lede">Atoms are built from charged parts: <b>protons</b> (+) in the nucleus, <b>electrons</b> (−) around it, and neutral neutrons. Like charges repel; opposite charges attract.</p>
      <table class="data">
        <tr><th>particle</th><th>charge</th><th>mass</th></tr>
        <tr><td>proton</td><td>+<i>e</i></td><td>${sci(M.MP)} kg</td></tr>
        <tr><td>electron</td><td>−<i>e</i></td><td>${sci(M.ME)} kg</td></tr>
        <tr><td>neutron</td><td>0</td><td>≈ <i>m</i><sub>p</sub></td></tr>
      </table>
      <div class="eq">1 <i>e</i> = ${sci(M.QE)} C</div>
      <p>Equal numbers: <b>neutral</b>. Extra electrons: <b>negative</b>. Too few: <b>positive</b>. In charging solids only electrons move, and every charge is a whole multiple of <i>e</i>.</p>
      <p><b>Conservation of charge:</b> charge is never made or destroyed, only moved. Rub a rod with fur and one gets +<i>q</i>, the other −<i>q</i>.</p>
      <p class="hintline">Click the atoms to find the extra electron and the missing one.</p>`,
    cam: { target: at('charge', 0, 0.3), az: -14, el: 10, dist: 25 }, lit: 'atoms', scene: 'atoms', look: {},
    fig: 'Neutral, negative, positive',
  },
  {
    kicker: '9.1', title: 'Charging objects', sub: 'four ways to move electrons',
    body: `
      <p class="lede">Charging never makes charge. It moves electrons onto, off, or across an object.</p>
      <table class="data">
        <tr><td><b>friction</b></td><td>rub fur on PVC: electrons cross over</td></tr>
        <tr><td><b>conduction</b></td><td>touch: spreads over a metal, stays put on an insulator</td></tr>
        <tr><td><b>induction</b></td><td>no contact: push a metal’s electrons away, ground it</td></tr>
        <tr><td><b>polarization</b></td><td>an insulator’s molecules stretch into dipoles</td></tr>
      </table>
      <p>The ${f(M.ROD.Q / M.nC, 0)} nC rod comes within ${cm(M.ROD.near)} cm. The sphere’s free electrons crowd to the far side; grounding lets them escape. The sphere keeps <b>+${f(M.QG / M.nC)} nC</b>, opposite to the rod.</p>
      <div class="charts">${chart({ ...R.induce, xlabel: 'time (s)', ylabel: 'net charge on the sphere (nC)', cursor: 'induce', label: 'Net charge on the sphere through the induction cycle',
        series: [{ pts: inducedSeries() }] })}</div>
      <p class="hintline">Bead size is the surface charge σ. Click the sphere or the balloon.</p>`,
    cam: { target: at('charging', -0.3, 0.4), az: -8, el: 8, dist: 32 }, lit: 'induce', scene: 'induce', look: {},
    fig: 'Induction and polarization',
  },
  {
    kicker: '9.2', title: 'Coulomb’s law', sub: 'the inverse square',
    body: `
      <p class="lede">The force between two point charges grows with the product of the charges and falls with the square of the distance.</p>
      <div class="eq"><i>F</i> = <i>k</i>|<i>q</i><sub>1</sub><i>q</i><sub>2</sub>|/<i>r</i>²</div>
      <p><i>k</i> = 1/4πε<sub>0</sub> = ${sci(M.K)} N·m²/C². Use sizes |<i>q</i>|; the signs only say attract or repel. The two forces are a third-law pair: equal, even though one charge is twice the other.</p>
      <div class="charts">${chart({ ...R.coulomb, xlabel: 'separation r (cm)', ylabel: 'force on each (N)', cursor: 'coulomb', label: 'Force against separation, falling as one over r squared',
        series: [{ pts: curve(15, 50, x => clip(pairF(x / 100), 4)) }], marks: [[20, pairF(0.2), `${f(pairF(0.2))} N`], [40, pairF(0.4), `${f(pairF(0.4))} N`, -46, -8]] })}</div>
      <p><b>How strong?</b> Give two ${M.PEOPLE.m} kg people 1 m apart 1% more protons than electrons: ${sci(M.PEOPLE.q)} C each, and <i>F</i> = ${sci(M.PEOPLE.F)} N, enough to accelerate the Earth at ${f(M.PEOPLE.a, 1)} m/s².</p>
      <p class="hintline">${S}× full size; forces ${cm(F_SCALE.coulomb)} cm per N. Click for a like pair.</p>`,
    cam: { target: at('coulomb', 0, 0.1), az: -12, el: 8, dist: 13 }, lit: 'coulomb', scene: 'coulomb', look: {},
    fig: `+${M.PAIR.q1 / M.uC} μC and −${-M.PAIR.q2 / M.uC} μC`,
  },
  {
    kicker: '9.3', title: 'Net force', sub: 'and the equilibrium point',
    body: `
      <p class="lede">With several charges, find each force on your charge, then add them as vectors: <b>superposition</b>.</p>
      <p>A +${f(M.LINE.q0 / M.uC, 1)} μC test charge sits between A (+${M.LINE.qA / M.uC} μC) and B (+${M.LINE.qB / M.uC} μC), ${cm(M.LINE.D)} cm apart. Both push it. The pushes balance where</p>
      <div class="eq sm"><i>kq</i><sub>A</sub>/<i>x</i>² = <i>kq</i><sub>B</sub>/(<i>d</i> − <i>x</i>)²  →  <i>x</i> = ${cm(M.LINE.xEq)} cm</div>
      <p>The balance point is always <b>closer to the smaller charge</b>. It need not lie between them: make B negative and it moves out past B, to ${cm(M.LINE.xEqUnlike)} cm.</p>
      <div class="charts">${chart({ ...R.line, xlabel: 'position x (cm)', ylabel: 'net force on q₀ (N)', cursor: 'line', label: 'Net force on the test charge against position, crossing zero at the equilibrium point',
        series: [{ pts: curve(10, 40, x => Math.max(Math.min(M.lineForces(x / 100).net[0], 0.3), -0.4)) }], marks: [[M.LINE.xEq * 100, 0, `${cm(M.LINE.xEq)} cm`, 6, -8]] })}</div>
      <p class="hintline">Forces ${f(F_SCALE.line, 0)} cm per 0.01 N. Click to park the test charge at the balance point.</p>`,
    cam: { target: at('line', 0, 0.3), az: -10, el: 8, dist: 15.5 }, lit: 'line', scene: 'line', look: {},
    fig: 'A test charge between A and B',
  },
  {
    kicker: '9.4', title: 'The electric field', sub: 'force per unit charge',
    body: `
      <p class="lede">A charge changes the space around it. A small positive <b>test charge</b> <i>q</i><sub>0</sub> placed anywhere feels a force; the field is that force per coulomb.</p>
      <div class="eq"><b>E</b> = <b>F</b>/<i>q</i><sub>0</sub> = (<i>kQ</i>/<i>r</i>²) <b>r̂</b></div>
      <p><b>r̂</b> points away from <i>Q</i>. For +<i>Q</i> the field points out; for −<i>Q</i>, in. Units N/C.</p>
      <table class="data">
        <tr><td><b>field lines</b></td><td>direction, and strength by how closely they crowd; start on +, end on −</td></tr>
        <tr><td><b>field vectors</b></td><td>size too: ${f(M.pointMag(M.POINT.Q, 0.1), 0)}, ${f(M.pointMag(M.POINT.Q, 0.2), 0)}, ${f(M.pointMag(M.POINT.Q, 0.3), 0)} N/C at 10, 20, 30 cm</td></tr>
      </table>
      <div class="charts">${chart({ ...R.field, xlabel: 'distance r (cm)', ylabel: 'E (kN/C)', cursor: 'field', label: 'Field strength against distance, falling as one over r squared',
        series: [{ cls: 'curve total', pts: curve(5, 35, x => clip(M.pointMag(M.POINT.Q, x / 100) / 1000, 4)) }] })}</div>
      <p class="hintline">Each charge drawn alone, ${S}× full size; E ${cm(E_SCALE.field * 100)} cm per 100 N/C. The +${f(M.POINT.q0 / M.nC, 1)} nC test charge’s force is drawn as long as E. Click for r̂.</p>`,
    cam: { target: at('field', 0, 0.4), az: -8, el: 8, dist: 35 }, lit: 'point', scene: 'point', look: {},
    fig: `+${M.POINT.Q / M.nC} nC and −${M.POINT.Q / M.nC} nC`,
  },
  {
    kicker: '9.5', title: 'The electric dipole', sub: 'fields add as vectors',
    body: `
      <p class="lede">Two opposite charges ±<i>q</i>, 2<i>a</i> apart. <b>E</b> at P is the vector sum of each charge’s field.</p>
      <p><b>On the axis</b> both fields lie along the line and the nearer charge wins:</p>
      <div class="eq sm"><i>E</i> = <i>kq</i>/(<i>x</i>−<i>a</i>)² − <i>kq</i>/(<i>x</i>+<i>a</i>)² = 4<i>kqax</i>/(<i>x</i>²−<i>a</i>²)²</div>
      <p><b>On the bisector</b> the <i>y</i> parts cancel and the <i>x</i> parts add:</p>
      <div class="eq sm"><i>E</i> = 2 · <i>kq</i>/(<i>a</i>²+<i>y</i>²) · cos θ = 2<i>kqa</i>/(<i>a</i>²+<i>y</i>²)<sup>3/2</sup></div>
      <p>Far away these become 4<i>kqa</i>/<i>x</i>³ and 2<i>kqa</i>/<i>y</i>³: the two fields nearly cancel, so E falls as <b>1/<i>r</i>³</b>.</p>
      <div class="charts">${chart({ ...R.dipole, xlabel: 'distance from the centre (cm)', ylabel: 'E (kN/C)', cursor: 'dipole', label: 'Dipole field on the axis and on the bisector against distance, with their far-field approximations',
        series: [{ cls: 'curve total', pts: curve(20, 50, x => clip(M.dipoleAxis(x / 100) / 1000, 2)), tag: [27, 1.0, 'axis'] }, { cls: 'curve trend', pts: curve(20, 50, x => clip(4 * M.K * M.DIPOLE.q * M.DIPOLE.a / (x / 100) ** 3 / 1000, 2)) },
          { cls: 'curve total', pts: curve(10, 50, x => clip(M.dipoleBisector(x / 100) / 1000, 2)), tag: [15.5, 0.75, 'bisector'] }, { cls: 'curve trend', pts: curve(14, 50, x => clip(2 * M.K * M.DIPOLE.q * M.DIPOLE.a / (x / 100) ** 3 / 1000, 2)) }] })}</div>
      <p class="hintline">Dashed: 1/r³. ${S}× full size; E ${cm(E_SCALE.dipole * 100)} cm per 100 N/C. Click to split E into E₊ and E₋.</p>`,
    cam: { target: at('dipole', -0.6, 0.2), az: -10, el: 8, dist: 19 }, lit: 'dipole', scene: 'dipole', look: {},
    fig: `±${M.DIPOLE.q / M.nC} nC, ${cm(2 * M.DIPOLE.a)} cm apart`,
  },
  {
    kicker: '9.6', title: 'A charged rod', sub: 'add up the slices',
    body: `
      <p class="lede">Cut the rod into slices d<i>x</i>, each holding d<i>q</i> = λ d<i>x</i> (λ = <i>Q</i>/<i>L</i> = ${f(M.RODE.lambda / M.nC, 0)} nC/m). Each slice is a point charge; integrate.</p>
      <p><b>On the axis</b>, <i>a</i> past the end:</p>
      <div class="eq sm"><i>E</i> = ∫<sub><i>a</i></sub><sup><i>a</i>+<i>L</i></sup> <i>k</i>λ d<i>x</i>/<i>x</i>² = <i>k</i>λ[1/<i>a</i> − 1/(<i>a</i>+<i>L</i>)] = <i>kQ</i>/<i>a</i>(<i>a</i>+<i>L</i>)</div>
      <p><b>On the bisector</b>, <i>a</i> above the middle, the <i>x</i> parts cancel:</p>
      <div class="eq sm"><i>E</i> = ∫ <i>k</i>λ<i>a</i> d<i>x</i>/(<i>x</i>²+<i>a</i>²)<sup>3/2</sup> = <i>kQ</i>/<i>a</i>√(<i>L</i>²/4 + <i>a</i>²)</div>
      <p>Far away (<i>a</i> ≫ <i>L</i>) both become <i>kQ</i>/<i>a</i>², a point charge. Close to the middle (<i>a</i> ≪ <i>L</i>) it is 2<i>k</i>λ/<i>a</i>.</p>
      <div class="charts">${chart({ ...R.rod, xlabel: 'distance a (cm)', ylabel: 'E (kN/C)', cursor: 'rod', label: 'Rod field on the axis and on the bisector against distance, with the point-charge field',
        series: [{ cls: 'curve total', pts: curve(2, 40, x => clip(M.rodAxis(x / 100) / 1000, 4)), tag: [3.5, 1.5, 'axis'] }, { cls: 'curve total', pts: curve(3, 40, x => clip(M.rodBisector(x / 100) / 1000, 4)), tag: [13, 2.0, 'bisector'] },
          { cls: 'curve trend', pts: curve(10, 40, x => clip(M.K * M.RODE.Q / (x / 100) ** 2 / 1000, 4)), tag: [24, 0.75, 'kQ/a²'] }] })}</div>
      <p class="hintline">${S}× full size; E ${cm(E_SCALE.rod * 100)} cm per 100 N/C. Click to cut the rod into ${M.RODE.slices} slices.</p>`,
    cam: { target: at('rod', 0, 1.0), az: -10, el: 8, dist: 21 }, lit: 'rod', scene: 'rod', look: {},
    fig: `+${M.RODE.Q / M.nC} nC on a ${cm(M.RODE.L)} cm rod`,
  },
  {
    kicker: '9.7', title: 'A ring of charge', sub: 'and a disc',
    body: `
      <p class="lede">Every piece of a ring is the same distance from a point P on its axis. The sideways parts cancel; only cos φ = <i>z</i>/√(<i>z</i>²+<i>R</i>²) of each survives.</p>
      <div class="eq sm"><i>E</i> = ∫<sub>0</sub><sup>2π</sup> <i>k</i>λ<i>R</i> d<i>θ</i> · <i>z</i>/(<i>z</i>²+<i>R</i>²)<sup>3/2</sup> = <i>kQz</i>/(<i>z</i>²+<i>R</i>²)<sup>3/2</sup></div>
      <p>Zero at the centre, <i>kQ</i>/<i>z</i>² far away, and a peak between, at <i>z</i> = <i>R</i>/√2 = ${f(M.RING_ZMAX * 100, 1)} cm.</p>
      <div class="charts">${chart({ ...R.ring, xlabel: 'distance along the axis z (cm)', ylabel: 'E (kN/C)', cursor: 'ring', label: 'Ring field along the axis: zero at the centre, a peak, then falling',
        series: [{ cls: 'curve total', pts: curve(0, 60, x => M.ringAxis(x / 100) / 1000) }, { cls: 'curve trend', pts: curve(31, 60, x => clip(M.K * M.RING.Q / (x / 100) ** 2 / 1000, 1.5)), tag: [44, 0.55, 'kQ/z²'] }], marks: [[M.RING_ZMAX * 100, M.ringAxis(M.RING_ZMAX) / 1000, 'R/√2', 6, -6]] })}</div>
      <p><b>A disc</b> is a stack of rings, d<i>q</i> = σ 2π<i>r</i> d<i>r</i>:</p>
      <div class="eq sm"><i>E</i> = (σ/2ε<sub>0</sub>)(1 − <i>z</i>/√(<i>z</i>²+<i>R</i>²))</div>
      <p>Just above its centre it is σ/2ε<sub>0</sub>, not zero: the disc has charge right under P.</p>
      <p class="hintline">${S}× full size; E ${cm(E_SCALE.ring * 100)} cm per 100 N/C, d<i>E</i> ×2. Click for the pieces.</p>`,
    cam: { target: at('ring', -0.4, 0.5), az: -30, el: 12, dist: 20 }, lit: 'ring', scene: 'ring', look: {},
    fig: `+${(M.RING.Q / M.nC).toFixed(0)} nC on a ring, R = ${cm(M.RING.R)} cm`,
  },
  {
    kicker: '9.8', title: 'A uniform field', sub: 'projectile motion, again',
    body: `
      <p class="lede">Between two large, oppositely charged plates the field is the same everywhere, from + to −. A charge there feels a constant force and moves like a thrown ball.</p>
      <div class="eq"><i>F</i> = <i>qE</i> = <i>ma</i></div>
      <p>An electron enters at ${sci(M.PLATES.v0, 1)} m/s; <i>E</i> = ${M.PLATES.E} N/C. Its force points <i>against</i> <b>E</b>, toward the + plate.</p>
      <table class="data">
        <tr><td><i>a</i> = <i>eE</i>/<i>m</i><sub>e</sub></td><td>${sci(M.PLATES.a)} m/s², up</td></tr>
        <tr><td><i>t</i> = <i>L</i>/<i>v</i><sub>0</sub></td><td>${f(M.PLATES.tCross * 1e9, 1)} ns between the ${cm(M.PLATES.L)} cm plates</td></tr>
        <tr><td><i>y</i> = ½<i>at</i>²</td><td>${f(M.PLATES.yExit * 1000, 2)} mm; leaves at ${f(M.PLATES.angle, 1)}°</td></tr>
      </table>
      <p>A proton would bend the other way, ${f(M.MP / M.ME, 0)}× less: ${f(M.PLATES.yProton * 1e6, 1)} μm.</p>
      <div class="charts">${chart({ ...R.plates, xlabel: 'x (cm)', ylabel: 'y (mm)', cursor: 'plates', label: 'The electron path: a parabola between the plates, then a straight line',
        series: [{ pts: curve(0, M.PLATES.run, t => [M.electron(t).x * 100, M.electron(t).y * 1000]).map(p => p[1]) }, { cls: 'curve trend', pts: [[M.PLATES.L * 100, 0], [M.PLATES.L * 100, 14]], tag: [M.PLATES.L * 100 - 3.6, 12, 'plates end'] }] })}</div>
      <p class="hintline">Slowed ~10⁹×; ${PL.S}× full size; E ${f(PL.E * 100 * 1000, 0)} cm per kN/C. Click for v<sub>x</sub>, v<sub>y</sub>.</p>`,
    cam: { target: at('plates', -0.1, 0.5), az: -10, el: 5, dist: 17 }, lit: 'plates', scene: 'plates', look: {},
    fig: 'An electron between charged plates',
  },
];

// ---------- click a scene: what it breaks into ----------
const ind = s => s.induce;
export const PLATES = {
  atoms: { text: `All three have the same nucleus: 6 protons, +6<i>e</i>. The negative ion has picked up one extra electron, pulled out here. The positive ion has lost one; the outline marks its empty place. Net charge is always (protons − electrons) × <i>e</i>. (A cartoon: a real atom is about 10⁻¹⁰ m across, its nucleus 100 000 times smaller, and electrons don’t orbit like planets.)`,
    facts: () => M.ATOMS.map(a => [a.name, `${a.p} − ${a.e} = ${a.p - a.e >= 0 ? (a.p - a.e ? '+' : '') : '−'}${Math.abs(a.p - a.e)} e = ${a.p === a.e ? '0' : (a.p > a.e ? '+' : '−') + sci(M.QE)} C`]) },
  induce: { text: `Bead size is the surface charge density σ on the sphere. With the rod near and nothing connected, σ is + on the near side and − on the far side, but it still adds up to zero: the electrons have only moved. Grounding lets the far-side electrons go. What stays is held by the rod, and spreads evenly once the rod leaves.`,
    facts: s => { const st = ind(s); return [['stage', st.stage], ['rod tip to centre', st.rod ? `${cm(st.dTip)} cm` : 'gone'], ['net charge on sphere', `${f(st.Qnet / M.nC)} nC`], ['after grounding', `−Σ q R/d = +${f(M.QG / M.nC)} nC`]]; } },
  balloon: { text: `The wall is an insulator, so its electrons can’t leave their molecules. Each molecule just stretches, its − end toward the + balloon. The − ends are nearer, so their attraction beats the repulsion of the + ends, and the balloon is pulled in. The stretch here grows with the balloon’s field.`,
    facts: s => { const g = s.balloonGap, r = g + M.BALLOON.r; return [['balloon charge', `+${M.BALLOON.q / M.nC} nC`], ['gap to the wall', `${f(g * 100, 1)} cm`], ['balloon’s field at the wall', `${kNC(M.K * M.BALLOON.q / (r * r))} kN/C`]]; } },
  coulomb: { text: `Underneath, a like pair at the same distance: it repels. The +4 μC charge feels the same size of force as the smaller one in both pairs. The product q₁q₂ sets the size of the force, and the signs set whether it attracts or repels.`,
    facts: s => { const r = s.pairR; return [['r', `${f(r * 100, 1)} cm`], ['F = k|q₁q₂|/r²', `${f(pairF(r))} N`], ['F at 2r', `${f(pairF(2 * r))} N (¼)`], ['unlike pair', 'attract'], ['like pair', 'repel']]; } },
  line: { text: `Parked at x<sub>eq</sub>, the two pushes are equal and opposite and the red net force vanishes. Nudge it either way and the nearer charge pushes it back: along this line the point is stable. The method: (1) decide where it can balance, from which way each force points; (2) set the forces equal and solve for the distance; (3) check that it is nearer the smaller charge.`,
    facts: () => { const r = M.lineForces(M.LINE.xEq); return [['x<sub>eq</sub>', `${cm(M.LINE.xEq)} cm from A`], ['F<sub>A</sub> there', `${f(r.FA[0], 3)} N →`], ['F<sub>B</sub> there', `${f(-r.FB[0], 3)} N ←`], ['net', `${f(Math.abs(r.net[0]), 3)} N`]]; } },
  point: { text: `The test charge stops at 20 cm. r̂ (grey) is a unit vector, length 1, pointing from the charge out through the test charge. The field is <i>kQ</i>/<i>r</i>² times r̂. With −Q the same formula gives −r̂, so the force on a positive test charge points inward.`,
    facts: () => { const r = 0.2, E = M.pointMag(M.POINT.Q, r); return [['r', `${f(r * 100, 1)} cm`], ['E = kQ/r²', `${f(E, 0)} N/C`], ['F = q₀E', `${sci(M.POINT.q0 * E)} N`], ['r̂', `(cos 22.5°, sin 22.5°) = (${f(Math.cos(M.POINT.ang))}, ${f(Math.sin(M.POINT.ang))})`]]; } },
  dipole: { text: `At each P the thin arrows are E₊ (from +q, pointing away) and E₋ (toward −q). On the axis they point opposite ways and the nearer one wins. On the bisector they are equal: the grey y parts cancel and the x parts add. The method for any set of charges: (1) find each charge’s field at P; (2) see which components cancel by symmetry; (3) compute the rest with sin and cos from side lengths; (4) add.`,
    facts: s => { const x = s.dipoleX, y = s.dipoleY, a = M.DIPOLE.a, k = M.K * M.DIPOLE.q; return [['axis: E₊ − E₋', `${f(k / (x - a) ** 2, 0)} − ${f(k / (x + a) ** 2, 0)} = ${f(M.dipoleAxis(x), 0)} N/C`], ['bisector: each', `${f(k / (a * a + y * y), 0)} N/C`], ['bisector: 2 E cos θ', `${f(M.dipoleBisector(y), 0)} N/C`]]; } },
  rod: { text: `Both P move in close. The rod pulled apart into ${M.RODE.slices} slices, each a point charge Q/${M.RODE.slices}. Their dE arrows at the upper P fan out symmetrically, so the sideways parts cancel. Their vector sum is already close to the integral; more, thinner slices make it exact. On the bisector the integrals use ∫x dx/(x²+a²)<sup>3/2</sup> = −1/(x²+a²)<sup>1/2</sup>, which gives E<sub>x</sub> = 0 between symmetric limits, and ∫dx/(x²+a²)<sup>3/2</sup> = x/a²(x²+a²)<sup>1/2</sup> for E<sub>y</sub>.`,
    facts: () => { const b = M.RODE.b0, sum = M.sumE(M.rodSlices(M.RODE.slices), [0, b, 0])[1]; return [['a (bisector)', `${f(b * 100, 1)} cm`], [`sum of ${M.RODE.slices} slices`, `${f(sum, 0)} N/C`], ['integral', `${f(M.rodBisector(b), 0)} N/C`], ['sideways', '0, cancelled']]; } },
  ring: { text: `P stops at the peak, z = R/√2. Each of the ${M.RING.beads} pieces gives a dE along its own line from the ring (dashed). Around the ring the sideways parts point every way and cancel; the parts along the axis all add. Each piece has the same <i>r</i> and the same cos φ, so the integral over θ is just 2π: E = 2π<i>k</i>λ<i>Rz</i>/(<i>z</i>²+<i>R</i>²)<sup>3/2</sup> = <i>kQz</i>/(<i>z</i>²+<i>R</i>²)<sup>3/2</sup>. For a disc, integrate these rings from <i>r</i> = 0 to <i>R</i> with ∫<i>r</i> d<i>r</i>/(<i>z</i>²+<i>r</i>²)<sup>3/2</sup> = −1/(<i>z</i>²+<i>r</i>²)<sup>1/2</sup>.`,
    facts: () => { const z = M.RING_ZMAX, dEm = M.K * M.RING.Q / M.RING.beads / (z * z + M.RING.R ** 2); return [['z', `${f(z * 100, 1)} cm`], ['each dE', `${f(dEm, 0)} N/C`], ['cos φ', f(z / Math.hypot(z, M.RING.R), 3)], ['E = Σ dE cos φ', `${f(M.ringAxis(z), 0)} N/C`]]; } },
  plates: { text: `The two velocity components, grey. v<sub>x</sub> never changes; v<sub>y</sub> grows steadily while the electron is between the plates, then both stay fixed. It is a projectile with the field playing gravity. The strobe outlines are equal times apart.`,
    facts: s => { const e = M.electron(s.plates.t); return [['t', `${f(s.plates.t * 1e9, 2)} ns`], ['v<sub>x</sub>', `${sci(e.vx)} m/s`], ['v<sub>y</sub>', `${sci(Math.max(e.vy, 1))} m/s`], ['y', `${f(e.y * 1000, 2)} mm`]]; } },
};
