// Chapter 14, page by page (after the AP Physics C E&M organizer, Unit 7). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, SC } from './world.js';

const f = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sci = (x, n = 2) => { const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${f(m, n)}×10${String(e).split('').map(c => SUP[c]).join('')}`; };
const uT = x => f(x * 1e6, 1);

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], vlines = [], zero = false, cursor, label }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(Math.min(Math.max(y, y0), y1)).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const vl = vlines.map(([x, t]) => `<line class="grid" x1="${sx(x)}" x2="${sx(x)}" y1="${P.t}" y2="${H - P.b}"/><text class="ax" x="${sx(x) + 4}" y="${H - P.b - 6}">${t}</text>`).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const z = zero ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${z}${vl}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2 + 40}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursor ? `<circle class="cursor" r="4.5" cx="-20" cy="-20" data-cursor="${cursor}"/>` : ''}
  </svg>`;
}
const curve = (fn, a, b, n = 80) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });
// chart ranges, shared with main.js for the live cursors
export const R = {
  magnet: { x0: -40, x1: 40, y0: 0, y1: 300 },
  rhr: { x0: 0, x1: 180, y0: 0, y1: 2 },
  cyclo: { x0: 0, x1: 2.5, y0: 0, y1: 3 },
  selector: { x0: 0, x1: 2, y0: -2, y1: 2 },
  loop: { x0: 0, x1: 180, y0: -0.08, y1: 0.08 },
  ampere: { x0: 0, x1: 15, y0: 0, y1: 400 },
  ring: { x0: 0, x1: 36, y0: 0, y1: 45 },
  wires: { x0: 0, x1: 40, y0: 0, y1: 2 },
  solenoid: { x0: -40, x1: 40, y0: 0, y1: 300 },
};

// the closed surface round the magnet's N end, summed once
export const MAGFLUX = M.boxFlux(M.magnetB, M.MAG_BOX.c, M.MAG_BOX.h, 60);
const BC = M.magnetB([0, 0, 0])[0], SOLC = M.solB([0, 0, 0])[0];
const slow = c => sci(c, 1);

export const PAGES = [
  {
    kicker: 'Chapter 14', title: 'Magnetic fields', sub: 'made by moving charge',
    body: `
      <p class="lede">A <b>magnetic field</b> <b>B</b> is made by moving charge: a current, or the spinning electrons inside a magnet. It is measured in tesla (1 T = 10<sup>4</sup> gauss).</p>
      <p>Outside a magnet the lines run from N to S; inside, from S back to N, so every line closes on itself. There are no magnetic monopoles (cut one and you get two magnets), so through any closed surface</p>
      <div class="eq">∮ <b>B</b> · d<b>A</b> = 0</div>
      <p>This ${f(M.MAG.L * 100, 0)} cm magnet is drawn as Ampère pictured it, a sheet of current round its sides. Every line is traced from that current’s Biot–Savart sum.</p>
      <div class="charts">${chart({ ...R.magnet, xlabel: 'x along the axis (cm)', ylabel: 'B (mT)', label: 'Field along the magnet axis', vlines: [[-10, 'S'], [10, 'N']],
        series: [{ pts: curve(x => M.magnetB([x / 100, 0, 0])[0] * 1000, -40, 40, 120) }] })}</div>
      <p class="hintline">Click the magnet for a closed box round its N end. One grid square is 10 cm.</p>`,
    cam: { target: [STATIONS.magnet, 2.0, 0], az: -18, el: 20, dist: 20 }, lit: 'magnet', scene: 'magnet', look: {},
    fig: 'Lines leave N and come back into S',
  },
  {
    kicker: '14.1', title: 'The magnetic force', sub: 'F = qv × B',
    body: `
      <p class="lede">A magnetic field pushes only on a <b>moving</b> charge, and sideways: at right angles to both <b>v</b> and <b>B</b>.</p>
      <div class="eq"><b>F</b> = <i>q</i> <b>v</b> × <b>B</b>, &nbsp; <i>F</i> = <i>qvB</i> sin θ</div>
      <p><b>Right-hand rule:</b> thumb along <b>v</b>, index finger along <b>B</b>; the middle finger gives <b>F</b> on a + charge, reversed for a − charge. Moving along <b>B</b>, there is no force.</p>
      <p><b>F</b> ⊥ <b>v</b> always, so <b>B</b> does <b>no work</b>: it turns a charge but never speeds it up. With <b>E</b> too, <b>F</b> = <i>q</i><b>E</b> + <i>q</i><b>v</b> × <b>B</b> (the Lorentz force).</p>
      <div class="charts">${chart({ ...R.rhr, xlabel: 'θ between v and B (°)', ylabel: 'F (10⁻¹⁴ N)', cursor: 'rhr', label: 'Force against angle', series: [{ pts: curve(d => M.RHR.Fmax * Math.sin(d * Math.PI / 180) / 1e-14, 0, 180) }] })}</div>
      <p class="hintline">Click to split <b>v</b> along and across <b>B</b>. <i>v</i> = ${sci(M.RHR.v, 1)} m/s, <i>B</i> = ${f(M.RHR.B)} T; <b>F</b> is 1.5 squares at ${sci(M.RHR.Fmax, 1)} N.</p>`,
    cam: { target: [STATIONS.rhr, 1.9, 0], az: -36, el: 22, dist: 17 }, lit: 'rhr', scene: 'rhr', look: {},
    fig: 'A proton and an electron, same velocity',
  },
  {
    kicker: '14.2', title: 'Circling in a field', sub: 'r = mv/qB',
    body: `
      <p class="lede">Across a uniform <b>B</b> the force stays at right angles to the velocity. It is a centripetal force: the charge circles at constant speed.</p>
      <div class="eq"><i>qvB</i> = <i>mv</i>²/<i>r</i> → <i>r</i> = <i>mv</i>/<i>qB</i>, &nbsp;ω = <i>qB</i>/<i>m</i></div>
      <p>Two protons start from rest through 50 V and 200 V (50 eV and 200 eV, with <i>q</i>Δ<i>V</i> = ½<i>mv</i>²). Four times the energy, twice the speed, twice the radius: ${f(M.CYC.r[0] * 100)} and ${f(M.CYC.r[1] * 100)} cm.</p>
      <p>Yet <i>T</i> = 2π<i>m</i>/<i>qB</i> = ${f(M.CYC.T * 1e6, 3)} μs for both, so they meet at the start every turn. A <b>cyclotron</b> uses this, kicking them across a gap at ${f(M.CYC.f / 1e6)} MHz.</p>
      <div class="charts">${chart({ ...R.cyclo, xlabel: 'v (10⁵ m/s)', ylabel: 'r (cm)', label: 'Radius against speed', series: [{ pts: curve(v => M.MP * v * 1e5 / (M.QE * M.CYC.B) * 100, 0, 2.5) }],
        marks: M.CYC.v.map((v, i) => [v / 1e5, M.CYC.r[i] * 100, `${M.CYC.dV[i]} V`]) })}</div>
      <p class="hintline">Click for the forces and radii. <i>B</i> = ${f(M.CYC.B)} T, down. One grid square is 1 cm; time runs ${slow(M.CYC.show / M.CYC.T)}× slower.</p>`,
    cam: { target: [STATIONS.cyclo, 0.8, 0], az: -14, el: 40, dist: 17 }, lit: 'cyclo', scene: 'cyclo', look: {},
    fig: 'Twice the speed, twice the radius, same period',
  },
  {
    kicker: '14.3', title: 'Crossed E and B', sub: 'the velocity selector',
    body: `
      <p class="lede"><b>E</b> between the plates pushes a proton toward the − plate with <i>qE</i>. <b>B</b> into the page pushes it back with <i>qvB</i>. They cancel at one speed:</p>
      <div class="eq"><i>qE</i> = <i>qvB</i> &nbsp;→&nbsp; <i>v</i> = <i>E</i>/<i>B</i></div>
      <p>Here <i>E</i> = ${f(M.SEL.E, 0)} V/m and <i>B</i> = ${f(M.SEL.B, 3)} T, so ${sci(M.SEL.v0, 1)} m/s goes straight. Slower, <i>qE</i> wins and it bends down; faster, <i>qvB</i> wins and it bends up.</p>
      <p>The <b>Hall effect</b> is the same balance in a wire: charge piles up on one edge until <i>qE</i> = <i>qv</i><sub>d</sub><i>B</i>, leaving Δ<i>V</i><sub>H</sub> = <i>v</i><sub>d</sub><i>Bd</i> = <i>IBd</i>/<i>nqA</i>.</p>
      <div class="charts">${chart({ ...R.selector, zero: true, xlabel: 'v (10⁵ m/s)', ylabel: 'qvB − qE, up (10⁻¹⁶ N)', label: 'Net force against speed',
        series: [{ pts: curve(v => M.QE * (v * 1e5 * M.SEL.B - M.SEL.E) / 1e-16, 0, 2) }], marks: M.SEL.k.map((k, i) => [k, M.QE * M.SEL.E * (k - 1) / 1e-16, ['0.8', 'E/B', '1.25'][i], i === 1 ? -26 : 6, i === 1 ? -8 : 14]) })}</div>
      <p class="hintline">Click for <i>q</i><b>E</b> and <i>q</i><b>v</b> × <b>B</b> on each proton. One grid square is 1 cm.</p>`,
    cam: { target: [STATIONS.selector + 0.4, 2.5, 0], az: -22, el: 13, dist: 31 }, lit: 'selector', scene: 'selector', look: {},
    fig: 'Only v = E/B gets through straight',
  },
  {
    kicker: '14.4', title: 'Force on a current', sub: 'and the torque on a loop',
    body: `
      <p class="lede">A current is many moving charges. With <i>I</i> = <i>nqAv</i><sub>d</sub>, the force on the charge <i>nqAL</i> in a wire becomes</p>
      <div class="eq"><b>F</b> = <i>I</i> <b>L</b> × <b>B</b></div>
      <p>On a loop in a uniform field the side forces add to zero, but the two vertical sides push opposite ways along different lines. They twist it:</p>
      <div class="eq"><b>τ</b> = <b>μ</b> × <b>B</b>, &nbsp; <b>μ</b> = <i>I</i><b>A</b></div>
      <p>As <i>U</i> = −<b>p</b> · <b>E</b> for a charge dipole, <i>U</i> = −<b>μ</b> · <b>B</b>: lowest along <b>B</b> (stable), highest against it (unstable). Here μ = ${f(M.LOOP.mu, 2)} A·m².</p>
      <div class="charts">${chart({ ...R.loop, zero: true, xlabel: 'θ between μ and B (°)', ylabel: 'τ (N·m), U (J)', cursor: 'loop', label: 'Torque and energy against angle',
        series: [{ pts: curve(d => M.LOOP.tmax * Math.sin(d * Math.PI / 180), 0, 180), tag: [80, M.LOOP.tmax, 'τ'] }, { cls: 'trend', pts: curve(M.loopU, 0, 180), tag: [150, M.loopU(150), 'U'] }] })}</div>
      <p class="hintline">The loop is turned slowly through every angle. Click it for the force on each side (4 squares per N).</p>`,
    cam: { target: [STATIONS.loop, 2.3, 0], az: -32, el: 16, dist: 20 }, lit: 'loop', scene: 'loop', look: {},
    fig: `${f(M.LOOP.a * 100, 0)} × ${f(M.LOOP.b * 100, 0)} cm, ${f(M.LOOP.I, 1)} A, B = ${f(M.LOOP.B)} T`,
  },
  {
    kicker: '14.5', title: 'Ampère’s law', sub: 'B round a long wire',
    body: `
      <p class="lede">Round a long wire the lines are circles: thumb along <i>I</i>, fingers curl with <b>B</b>.</p>
      <div class="eq">∮ <b>B</b> · d<b>s</b> = μ<sub>0</sub><i>I</i><sub>enc</sub></div>
      <p>On a circle <b>B</b> ∥ d<b>s</b>, <i>B</i> constant: <i>B</i>(2π<i>r</i>) = μ<sub>0</sub><i>I</i>, so <i>B</i> = μ<sub>0</sub><i>I</i>/2π<i>r</i>. Inside a thick wire, <i>B</i> = μ<sub>0</sub><i>Ir</i>/2π<i>a</i>².</p>
      <p>Through the rectangle, add strips: ∫<sub><i>a</i></sub><sup><i>a</i>+<i>c</i></sup> (μ<sub>0</sub><i>I</i>/2π<i>r</i>) <i>b</i> d<i>r</i>, or</p>
      <div class="eq">Φ = (μ<sub>0</sub><i>Ib</i>/2π) ln((<i>a</i> + <i>c</i>)/<i>a</i>)</div>
      <div class="charts">${chart({ ...R.ampere, xlabel: 'r (cm)', ylabel: 'B (μT)', cursor: 'ampere', label: 'Field against distance from a thick wire', vlines: [[1, 'a']],
        series: [{ pts: curve(r => M.ampereB(r / 100) * 1e6, 0, 15, 150) }] })}</div>
      <p class="hintline">Click the wire for d<b>s</b>, the rectangle for its strips. <b>B</b>: 0.8 squares per 100 μT.</p>`,
    cam: { target: [STATIONS.ampere + 0.7, 3.3, 0], az: 34, el: 21, dist: 24 }, lit: 'ampere', scene: 'ampere', look: {},
    fig: `${f(M.AMP.I, 0)} A up a long wire`,
  },
  {
    kicker: '14.6', title: 'Biot–Savart', sub: 'adding up every piece',
    body: `
      <p class="lede">Without symmetry, add up the field of every piece d<b>l</b> of wire, as Coulomb’s law adds up pieces of charge. <b>r̂</b> points from d<b>l</b> to P:</p>
      <div class="eq">d<b>B</b> = (μ<sub>0</sub><i>I</i>/4π) d<b>l</b> × <b>r̂</b> / <i>r</i>²</div>
      <p>On a loop’s axis every d<b>l</b> ⊥ <b>r</b>. The sideways parts of d<b>B</b> cancel round the loop; the parts along the axis (cos θ = <i>R</i>/<i>r</i>) add:</p>
      <div class="eq"><i>B</i> = μ<sub>0</sub><i>IR</i>² / 2(<i>R</i>² + <i>z</i>²)<sup>3/2</sup></div>
      <p>At the centre, μ<sub>0</sub><i>I</i>/2<i>R</i> = ${uT(M.RING.Bc)} μT. Far away, μ<sub>0</sub><i>IR</i>²/2<i>z</i>³: a dipole’s 1/<i>z</i>³.</p>
      <div class="charts">${chart({ ...R.ring, xlabel: 'z along the axis (cm)', ylabel: 'B (μT)', cursor: 'ring', label: 'Field along the axis of a loop',
        series: [{ cls: 'trend', pts: curve(z => M.ringFar(z / 100) * 1e6, 12, 36), tag: [24, 13, 'μ₀IR²/2z³'] }, { pts: curve(z => M.ringAxis(z / 100) * 1e6, 0, 36) }] })}</div>
      <p class="hintline">Click the loop for ${M.RING.pieces} pieces d<b>l</b> and their d<b>B</b> (drawn 5× longer). <b>B</b>: 1 square per 20 μT.</p>`,
    cam: { target: [STATIONS.ring + 1.0, 2.5, 0], az: -38, el: 14, dist: 22 }, lit: 'ring', scene: 'ring', look: {},
    fig: `R = ${f(M.RING.R * 100, 0)} cm, I = ${f(M.RING.I, 0)} A`,
  },
  {
    kicker: '14.7', title: 'Parallel wires', sub: 'like currents attract',
    body: `
      <p class="lede">Each wire sits in the other’s field, so each feels <b>F</b> = <i>I</i> <b>L</b> × <b>B</b>.</p>
      <div class="eq"><i>B</i><sub>1</sub> = μ<sub>0</sub><i>I</i><sub>1</sub>/2π<i>d</i> &nbsp;→&nbsp; <i>F</i>/<i>L</i> = μ<sub>0</sub><i>I</i><sub>1</sub><i>I</i><sub>2</sub>/2π<i>d</i></div>
      <p>With ${f(M.WIRES.I, 0)} A in each, ${f(M.WIRES.d * 100, 0)} cm apart, that is ${f(M.WIRES.FL * 1000)} mN per metre. Currents the <b>same</b> way attract; <b>opposite</b> ways repel, the reverse of charges.</p>
      <p>The field lines show it. Like currents cancel between the wires (<i>B</i> = 0 midway) and the outer lines wrap round both. Opposite currents crowd the field between them.</p>
      <div class="charts">${chart({ ...R.wires, xlabel: 'd (cm)', ylabel: 'F/L (mN/m)', label: 'Force per length against separation',
        series: [{ pts: curve(d => M.MU0 * M.WIRES.I ** 2 / (2 * Math.PI * d / 100) * 1000, 2, 40) }], marks: [[M.WIRES.d * 100, M.WIRES.FL * 1000, `${f(M.WIRES.FL * 1000)} mN/m`]] })}</div>
      <p class="hintline">Click a pair for the field each wire feels from the other. Forces: 2 squares per mN/m.</p>`,
    cam: { target: [(STATIONS.same + STATIONS.opposite) / 2, 2.0, 0], az: -10, el: 30, dist: 34 }, lit: 'same', scene: 'wires', look: {},
    fig: 'Same way, then opposite ways',
  },
  {
    kicker: '14.8', title: 'Solenoids', sub: 'and toroids: a uniform field',
    body: `
      <p class="lede">Stack many loops: their fields add inside and nearly cancel outside. That is a <b>solenoid</b>.</p>
      <p>Take a rectangle half inside. Only its inside side counts (<b>B</b> ⊥ d<b>s</b> on the ends, <i>B</i> ≈ 0 outside), so <i>BL</i> = μ<sub>0</sub><i>NI</i>. With <i>n</i> = <i>N</i>/<i>L</i> turns per metre:</p>
      <div class="eq"><i>B</i> = μ<sub>0</sub><i>nI</i> &nbsp;&nbsp; toroid: <i>B</i> = μ<sub>0</sub><i>NI</i>/2π<i>r</i></div>
      <p>Here μ<sub>0</sub><i>nI</i> = ${uT(M.SOL.B)} μT; the Biot–Savart sum gives ${uT(SOLC)} μT, as this coil is only ${f(M.SOL.L / M.SOL.R, 1)} radii long. Bent into a ring it is a <b>toroid</b>: <i>B</i>(2π<i>r</i>) = μ<sub>0</sub><i>NI</i> inside, and 0 in the hole and outside.</p>
      <div class="charts">${chart({ ...R.solenoid, xlabel: 'x along the axis (cm)', ylabel: 'B (μT)', label: 'Field along the solenoid axis', vlines: [[-20, 'end'], [20, 'end']],
        series: [{ cls: 'trend', pts: [[-20, M.SOL.B * 1e6], [20, M.SOL.B * 1e6]], tag: [-6, M.SOL.B * 1e6 + 6, 'μ₀nI'] }, { pts: curve(x => M.solB([x / 100, 0, 0])[0] * 1e6, -40, 40, 100) }] })}</div>
      <p class="hintline">Click the solenoid for its Amperian rectangle, the toroid to see inside. <b>B</b>: 1 square per 100 μT.</p>`,
    cam: { target: [(STATIONS.solenoid + STATIONS.toroid) / 2 - 0.4, 1.8, 0], az: -10, el: 30, dist: 31 }, lit: 'solenoid', scene: 'solenoid', look: {},
    fig: `${M.SOL.N} turns and ${M.TOR.N} turns, ${f(M.SOL.I, 1)} A`,
  },
];

// ---------- click a scene: what it breaks into ----------
const deg = Math.PI / 180;
export const PLATES = {
  magnet: { text: `The magnet fades so the lines inside show, and a closed box is put round its N end. Lines leave through the box’s outer faces, and the same lines come back in through the face that cuts the magnet. Out and in cancel: no pole on its own.`,
    facts: () => [['flux out', `${sci(MAGFLUX.out)} Wb`], ['flux in', `${sci(MAGFLUX.in)} Wb`], ['total ∮B·dA', `${f(Math.abs(MAGFLUX.total / MAGFLUX.out) * 100, 3)}% of the flux out: 0`], ['B at the centre', `${f(BC * 1000, 0)} mT`]] },
  rhr: { text: `<b>v</b> splits into a part along <b>B</b> and a part across it (grey). Only the part across feels a force: <i>F</i> = <i>qv</i><sub>⊥</sub><i>B</i> = <i>qvB</i> sin θ. <b>F</b> is ⊥ to both <b>v</b> and <b>B</b>. The electron, with negative charge, is pushed the other way.`,
    facts: s => { const d = M.rhrAngle(s.clock), v = M.RHR.v; return [['θ', `${f(d, 0)}°`], ['v along B', `${sci(Math.max(Math.abs(v * Math.cos(d * deg)), 1), 2)} m/s`], ['v across B', `${sci(Math.max(v * Math.sin(d * deg), 1), 2)} m/s`], ['F = qv⊥B', `${sci(Math.max(M.RHR.Fmax * Math.sin(d * deg), 1e-30), 2)} N`], ['work done by F', '0']]; } },
  cyclo: { text: `The force (red) points at the centre of each circle, ⊥ to <b>v</b>, so the speed never changes. The faster proton needs a bigger circle, but it covers it in the same time.`,
    facts: s => { const t = M.cycTime(s.clock) % M.CYC.T; return [['t in this turn', `${f(t * 1e6, 3)} μs of ${f(M.CYC.T * 1e6, 3)} μs`], ['F on the 50 V proton', `${sci(M.QE * M.CYC.v[0] * M.CYC.B)} N`], ['F on the 200 V proton', `${sci(M.QE * M.CYC.v[1] * M.CYC.B)} N`], ['ω = qB/m', `${sci(M.CYC.omega)} rad/s`]]; } },
  selector: { text: `On each proton between the plates: <i>q</i><b>E</b> down, the same for all, and <i>q</i><b>v</b> × <b>B</b> up, growing with speed. Their sum (red) is zero only for <i>v</i> = <i>E</i>/<i>B</i>. Only <b>E</b> does work, so the slow proton speeds up as it falls toward the − plate.`,
    facts: () => [['qE (all three)', `${sci(M.QE * M.SEL.E)} N`], ['qvB at 0.8 E/B', `${sci(0.8 * M.QE * M.SEL.E)} N`], ['qvB at E/B', `${sci(M.QE * M.SEL.E)} N`], ['qvB at 1.25 E/B', `${sci(1.25 * M.QE * M.SEL.E)} N`]] },
  loop: { text: `<b>F</b> = <i>I</i> <b>L</b> × <b>B</b> on each side. <b>F</b><sub>1</sub> and <b>F</b><sub>3</sub> on the vertical sides are always <i>IbB</i>, but they act on different lines, so they twist. <b>F</b><sub>2</sub> and <b>F</b><sub>4</sub>, top and bottom, are equal and opposite on the same line: they only stretch or squeeze the loop. A bent wire is no different: a half circle of radius <i>R</i> feels ∫<i>I</i> d<b>s</b> × <b>B</b> = 2<i>IRB</i>, the same as its straight chord.`,
    facts: s => { const d = M.loopAngle(s.clock), S = M.loopSides(d); return [['θ', `${f(d, 0)}°`], ['F₁, F₃ (vertical sides)', `${f(M.len(S[0].F), 3)} N each`], ['F₂, F₄ (top, bottom)', `${f(M.len(S[1].F), 3)} N each`], ['ΣF', '0 N'], ['τ = μB sin θ', `${f(M.len(M.loopTorque(d)), 4)} N·m`]]; } },
  ampere: { text: `The Amperian circle is cut into pieces d<b>s</b>. On every piece <b>B</b> runs the same way as d<b>s</b> and has the same size, so ∮<b>B</b> · d<b>s</b> is just <i>B</i> × 2π<i>r</i>. As the circle grows, <i>B</i> shrinks to match: the total stays μ<sub>0</sub><i>I</i>.`,
    facts: s => { const r = M.ampR(s.clock), B = M.ampereB(r); return [['r', `${f(r * 100, 1)} cm`], ['B', `${uT(B)} μT`], ['2πr', `${f(2 * Math.PI * r * 100, 1)} cm`], ['B · 2πr', `${sci(B * 2 * Math.PI * r)} T·m`], ['μ₀I', `${sci(M.MU0 * M.AMP.I)} T·m`]]; } },
  flux: { text: `The rectangle is cut into ${M.FLUX.strips} strips of width d<i>r</i>. <i>B</i> is nearly constant across each strip, so each one’s flux is <i>B</i>(<i>r</i>) <i>b</i> d<i>r</i>. The near strips carry the most. Adding them up is the integral.`,
    facts: () => { const s = M.fluxStrips(); return [...s.map((x, i) => [`strip ${i + 1} (r ${f((M.FLUX.a + (i + 0.5) * M.FLUX.c / M.FLUX.strips) * 100, 1)} cm)`, `${f(x * 1e9, 0)} nWb`]), ['sum', `${f(s.reduce((a, b) => a + b, 0) * 1e9, 0)} nWb`], ['(μ₀Ib/2π) ln((a+c)/a)', `${f(M.FLUX.phi * 1e9, 0)} nWb`]]; } },
  ring: { text: `Twelve pieces d<b>l</b> of the loop, each with its d<b>B</b> at P (grey). Each d<b>B</b> is ⊥ to both d<b>l</b> and <b>r</b>, so together they make a cone. Round the loop the sideways parts cancel in pairs, and the parts along the axis add up to <b>B</b>.`,
    facts: s => { const z = M.ringZ(s.clock), p = M.ringPieces(z), one = M.len(p[0].dB); return [['z', `${f(z * 100, 1)} cm`], ['each |dB|', `${f(one * 1e6, 2)} μT`], ['each along the axis', `${f(p[0].dB[0] * 1e6, 2)} μT`], [`sum of ${p.length}`, `${uT(p.reduce((a, q) => a + q.dB[0], 0))} μT`], ['μ₀IR²/2(R²+z²)^{3/2}', `${uT(M.ringAxis(z))} μT`]]; } },
  same: { text: `At wire 2, wire 1’s field <b>B</b><sub>1</sub> runs ⊥ to the wire. <i>I</i><sub>2</sub><b>L</b> × <b>B</b><sub>1</sub> points toward wire 1. The same holds the other way round, an equal and opposite pair.`,
    facts: () => [['B₁ at wire 2', `${uT(M.ampereB(M.WIRES.d))} μT`], ['F/L on each', `${f(M.WIRES.FL * 1000)} mN/m`], ['B midway', '0'], ['direction', 'toward each other']] },
  opposite: { text: `Reverse <i>I</i><sub>2</sub> and <i>I</i><sub>2</sub><b>L</b> × <b>B</b><sub>1</sub> reverses too: the wires push apart. Between them the two fields now add.`,
    facts: () => [['B₁ at wire 2', `${uT(M.ampereB(M.WIRES.d))} μT`], ['F/L on each', `${f(M.WIRES.FL * 1000)} mN/m`], ['B midway', `${uT(2 * M.ampereB(M.WIRES.d / 2))} μT`], ['direction', 'apart']] },
  solenoid: { text: `The turns fade to show the field inside: nearly uniform, nearly parallel. The dashed Amperian rectangle encloses ${M.rectTurns()} turns. Only its side along the axis adds to ∮<b>B</b> · d<b>s</b>.`,
    facts: () => { const L = 2 * M.SOL_RECT.h, N = M.rectTurns(); return [['turns enclosed N', `${N}`], ['side inside, L', `${f(L * 100, 0)} cm`], ['μ₀NI / L', `${uT(M.MU0 * N * M.SOL.I / L)} μT`], ['∮B·ds, summed from the model', `${sci(M.lineIntegral(M.solB, M.rectPath(M.SOL_RECT.h, M.SOL_RECT.Y, 200)))} T·m`], ['μ₀NI', `${sci(M.MU0 * N * M.SOL.I)} T·m`]]; } },
  toroid: { text: `The turns fade. The dashed circle breathes from the hole, through the core, to outside. Its <b>B</b> arrows appear only while it is inside the winding, where it encloses all ${M.TOR.N} turns once.`,
    facts: s => { const r = M.torR(s.clock); return [['r', `${f(r * 100, 1)} cm`], ['current enclosed', r > M.TOR.R0 - M.TOR.a && r < M.TOR.R0 + M.TOR.a ? `NI = ${f(M.TOR.N * M.TOR.I, 0)} A` : '0'], ['μ₀NI/2πr', `${uT(M.torIdeal(r))} μT`], ['from the model', `${uT(M.len(M.torB([r, 0, 0])))} μT`]]; } },
};
