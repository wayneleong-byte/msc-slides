// Chapter 11, page by page (after the AP Physics C E&M organizer, Unit 3). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS as ST, SC } from './world.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const BLUE = '#3d63a8';
const uJ = J => f(J * 1e6, 3);

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], cursors = [], label, zero = false, extra = '' }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" style="fill:none${s.color ? `;stroke:${s.color}` : ''}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}"${s.color ? ` style="fill:${s.color}"` : ''}>${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>
    ${zero ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/><text class="ax" x="${P.l - 6}" y="${sy(0) + 4}" text-anchor="end">0</text>` : ''}${paths}${mk}${extra}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(([key, color]) => `<circle class="cursor" r="4.5" data-cursor="${key}"${color ? ` style="fill:${color}"` : ''}/>`).join('')}
  </svg>`;
}
const samples = (n, a, b, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });

// chart ranges, shared with the live cursors in main.js
export const R = {
  pair: { x0: 10, x1: 40, y0: -1, y1: 1 },
  square: { x0: 0, x1: 4.8, y0: 0, y1: 1.2 },
  uniform: { x0: 0, x1: 20, y0: -12, y1: 0 },
  hill: { x0: 0, x1: 0.4, y0: 0, y1: 200 },
  rod: { x0: 0, x1: 0.4, y0: 0, y1: 300 },
  ring: { x0: 0, x1: 0.25, y0: 0, y1: 250 },
  sphV: { x0: 0, x1: 0.4, y0: 0, y1: 300 },
  sphE: { x0: 0, x1: 0.4, y0: 0, y1: 2 },
  accel: { x0: 0, x1: 6, y0: 0, y1: 6 },
};

const Ulike = M.pair(M.PAIR.run, 1), Uunl = M.pair(M.PAIR.run, -1);
const steps = [0, 1, 2, 3].map(M.sqStep);
const dipAxis = M.VdipAxis(M.DIP.axisX), rodA = M.VrodAxis(0.1), rodB = M.VrodBis(M.ROD.bisA);
// split a sampled curve into the runs that stay inside ±lim (it blows up at each charge)
const runs = (pts, lim) => pts.reduce((out, p, i) => { if (Math.abs(p[1]) > lim || !isFinite(p[1])) return out; if (i && Math.abs(pts[i - 1][1]) <= lim && out.length) out.at(-1).push(p); else out.push([p]); return out; }, []);

export const PAGES = [
  {
    kicker: 'Chapter 11', title: 'Electric potential energy', sub: 'the work stored in a pair of charges',
    body: `
      <p class="lede">Push a charge toward another of the same sign and you do work against the repulsion. That work is stored as <b>electric potential energy</b>.</p>
      <div class="eq"><i>U</i> = <i>kq</i><sub>1</sub><i>q</i><sub>2</sub> / <i>r</i></div>
      <p><i>U</i> = 0 when the charges are infinitely far apart. Bringing +2 nC in from ${M.PAIR.r0 * 100} cm to ${M.PAIR.r1 * 100} cm of +4 nC takes ${uJ(Ulike.W)} μJ. Unlike charges pull together, so their <i>U</i> is <b>negative</b> and falls as they close. <i>U</i> is a scalar: the signs of the charges carry its sign.</p>
      <div class="charts">${chart({ ...R.pair, zero: true, xlabel: 'separation r (cm)', ylabel: 'U (μJ)', cursors: [['pairL'], ['pairU', BLUE]], label: 'Potential energy against separation for like and unlike pairs',
        series: [{ pts: samples(60, 10, 40, r => M.Upair(M.PAIR.q1, M.PAIR.q2, r / 100) * 1e6), tag: [24, 0.38, 'like: U > 0'] }, { color: BLUE, pts: samples(60, 10, 40, r => M.Upair(M.PAIR.q1, -M.PAIR.q2, r / 100) * 1e6), tag: [24, -0.18, 'unlike: U < 0'] }] })}</div>
      <p class="hintline">Click for the path in steps, each adding <i>F</i>Δ<i>r</i>. 1 square = 10 cm; force ${(SC.F * 10).toFixed(1)} cm per μN.</p>`,
    cam: { target: [ST.pair + 0.2, 0.3, 0], az: -12, el: 32, dist: 16 }, lit: 'pair', scene: 'pair', look: {},
    fig: 'Like and unlike pairs, closing in',
  },
  {
    kicker: '11.1', title: 'Assembling charges', sub: 'add up every pair',
    body: `
      <p class="lede">The energy of a group of charges is the work to bring them in from infinity, one at a time.</p>
      <table class="data">
        <tr><td><i>q</i><sub>1</sub></td><td>nothing there yet</td><td>0</td></tr>
        <tr><td><i>q</i><sub>2</sub></td><td><i>kq</i>²/<i>a</i></td><td>${uJ(steps[1])} μJ</td></tr>
        <tr><td><i>q</i><sub>3</sub></td><td><i>kq</i>²/<i>a</i> + <i>kq</i>²/√2<i>a</i></td><td>${uJ(steps[2])} μJ</td></tr>
        <tr><td><i>q</i><sub>4</sub></td><td>2<i>kq</i>²/<i>a</i> + <i>kq</i>²/√2<i>a</i></td><td>${uJ(steps[3])} μJ</td></tr>
      </table>
      <div class="eq"><i>U</i> = 4<i>kq</i>²/<i>a</i> + 2<i>kq</i>²/√2<i>a</i> = ${uJ(M.SQ.U)} μJ</div>
      <p>Four +2 nC charges, <i>a</i> = ${M.SQ.a * 100} cm. Six pairs, in any order.</p>
      <div class="charts">${chart({ ...R.square, xlabel: 'time (s)', ylabel: 'U of the group (μJ)', cursors: [['square']], label: 'Energy of the group as the charges arrive',
        series: [{ pts: samples(240, 0, M.SQ.run, t => M.square(t).U * 1e6) }] })}</div>
      <p class="hintline">Click the square to see its six pairs.</p>`,
    cam: { target: [ST.square, 0.3, 0], az: -12, el: 40, dist: 15 }, lit: 'square', scene: 'square', look: {},
    fig: 'Four charges, six pairs',
  },
  {
    kicker: '11.2', title: 'Electric potential', sub: 'energy per unit charge',
    body: `
      <p class="lede"><b>Potential</b> <i>V</i> is potential energy per unit charge, in volts (J/C). A charge <i>q</i> placed there has <i>U</i> = <i>qV</i>.</p>
      <div class="eq">Δ<i>V</i> = −∫<sub>A</sub><sup>B</sup> <b><i>E</i></b> · d<b><i>s</i></b></div>
      <p>Only the part of each step d<b><i>s</i></b> along <b><i>E</i></b> counts. With <i>E</i> = ${M.UNI.E} N/C: A → B runs across <b><i>E</i></b> and adds 0; B → C is 0.2 m along it, −${M.UNI.E} × 0.2 = <b>−10 V</b>. A → C straight gives the same. Moving <b>with</b> <b><i>E</i></b>, <i>V</i> falls. The pale sheets are <b>equipotentials</b>, at right angles to <b><i>E</i></b>. For <i>E</i> = 4<i>x</i>: −∫<sub>0</sub><sup>4</sup> 4<i>x</i> d<i>x</i> = ${M.VARY.dV} V.</p>
      <div class="charts">${chart({ ...R.uniform, xlabel: 'distance along E (cm)', ylabel: 'V (volts)', cursors: [['uni']], label: 'Potential against distance along the field', series: [{ pts: [[0, 0], [20, -10]] }] })}</div>
      <p class="hintline">Click to split A → C into steps d<b><i>s</i></b>. <b><i>E</i></b>: one square per 25 N/C.</p>`,
    cam: { target: [ST.uniform, 0.4, 0.2], az: -18, el: 34, dist: 19 }, lit: 'uniform', scene: 'uniform', look: {},
    fig: 'E = 50 N/C; A to C drops 10 V',
  },
  {
    kicker: '11.3', title: 'The potential hill', sub: 'V = kq/r, and E = −∇V',
    body: `
      <p class="lede">Around a point charge only the radial part of each step counts, <b>r̂</b> · d<b><i>s</i></b> = d<i>r</i>:</p>
      <div class="eq">Δ<i>V</i> = −∫ <i>kq</i>/<i>r</i>² d<i>r</i> = <i>kq</i>(1/<i>r</i><sub>B</sub> − 1/<i>r</i><sub>A</sub>)</div>
      <p>From infinity, <i>V</i> = <i>kq</i>/<i>r</i>, drawn as height for +1 nC. The circles are equipotentials every 30 V; they crowd in where the hill is steep. <b><i>E</i></b> points straight downhill, as big as the slope: <b><i>E</i></b> = −∇<i>V</i>, or <i>E</i> = −d<i>V</i>/d<i>r</i>.</p>
      <div class="charts">${chart({ ...R.hill, xlabel: 'distance r (m)', ylabel: 'V (volts)', cursors: [['hill']], label: 'Potential against distance, with the tangent at the probe',
        series: [{ pts: samples(80, 0.045, 0.4, r => M.Vpoint(M.HILL.Q, r)) }], extra: `<path class="trend" style="fill:none" data-tangent="hill" d=""/>` })}</div>
      <p class="live" id="hilllive"></p>
      <p class="hintline">Click to lift the hill off its map. Height: one square per 60 V (rounded above 150 V); <b><i>E</i></b>: one square per kN/C.</p>`,
    cam: { target: [ST.hill, 0.9, 0], az: -18, el: 30, dist: 25 }, lit: 'hill', scene: 'hill', look: {},
    fig: 'Height = potential; arrows run downhill',
  },
  {
    kicker: '11.4', title: 'The dipole', sub: 'potentials add as numbers',
    body: `
      <p class="lede">Potential is a scalar: for several charges, add each <i>kq</i>/<i>r</i> with its sign. No components.</p>
      <div class="eq"><i>V</i><sub>axis</sub> = −2<i>akq</i>/(<i>x</i>² − <i>a</i>²)</div>
      <p>That is <i>kq</i>/(<i>x</i> + <i>a</i>) − <i>kq</i>/(<i>x</i> − <i>a</i>) for ±1 nC, ${2 * M.DIP.a * 100} cm apart: a hill beside a well. At P, ${M.DIP.axisX * 100} cm out, <i>V</i> = ${f(dipAxis, 1)} V. Every point of the perpendicular bisector is equally far from both, so <i>V</i> = <b>0</b> there, though <b><i>E</i></b> is not. For two like charges <i>V</i> on the bisector is not 0: it peaks at the midpoint.</p>
      <div class="charts">${chart({ x0: -0.36, x1: 0.36, y0: -200, y1: 200, zero: true, xlabel: 'position along the axis (m)', ylabel: 'V on the axis (volts)', label: 'Potential along the dipole axis',
        series: runs(samples(720, -0.36, 0.36, x => M.Vdip([x, 0, 0])), 200).map(pts => ({ pts })),
        marks: [[M.DIP.axisX, dipAxis, `P: ${f(dipAxis, 0)} V`, 6, 16]] })}</div>
      <p class="hintline">Click for each charge’s share at P and P′. Height: one square per 60 V. Blue: field lines traced from the model.</p>`,
    cam: { target: [ST.dipole, 0, 0], az: -14, el: 30, dist: 24 }, lit: 'dipole', scene: 'dipole', look: {},
    fig: 'A hill, a well, and V = 0 between',
  },
  {
    kicker: '11.5', title: 'A charged rod', sub: 'add up every dq',
    body: `
      <p class="lede">Cut a spread-out charge into pieces d<i>q</i>, each adding <i>k</i> d<i>q</i>/<i>r</i>, and integrate.</p>
      <table class="data eqs">
        <tr><td>λ = <i>Q</i>/<i>L</i>, d<i>q</i> = λ d<i>x</i></td><td>${f(M.ROD.lam * 1e9, 0)} nC/m</td></tr>
        <tr><td>P, on the axis: <i>k</i>λ ln((<i>a</i> + <i>L</i>)/<i>a</i>)</td><td>${f(rodA, 1)} V</td></tr>
        <tr><td>P′, on the bisector: <i>k</i>λ ln[(<i>L</i> + <i>s</i>)/(−<i>L</i> + <i>s</i>)]</td><td>${f(rodB, 1)} V</td></tr>
      </table>
      <p>+3 nC over ${M.ROD.L * 100} cm, values at <i>a</i> = 10 cm, with <i>s</i> = √(<i>L</i>² + 4<i>a</i>²) from ∫ d<i>x</i>/√(<i>x</i>² + <i>a</i>²) = ln(<i>x</i> + √(<i>x</i>² + <i>a</i>²)). Far away the rod acts like a point charge (dashed).</p>
      <div class="charts">${chart({ ...R.rod, xlabel: 'distance a from the end (m)', ylabel: 'V at P (volts)', cursors: [['rod']], label: 'Potential on the rod axis against distance',
        series: [{ pts: samples(60, 0.04, 0.4, M.VrodAxis), tag: [0.09, 175, 'rod'] }, { cls: 'trend', pts: samples(60, 0.04, 0.4, a => M.K * M.ROD.Q / (a + M.ROD.L / 2)), tag: [0.2, 95, 'kQ/(a + L/2)'] }] })}</div>
      <p class="hintline">Click the rod to cut it into 12 pieces d<i>q</i>.</p>`,
    cam: { target: [ST.rod - 0.5, 1.6, 0], az: -12, el: 14, dist: 15 }, lit: 'rod', scene: 'rod', look: {},
    fig: 'λ = 10 nC/m; P slides along the axis',
  },
  {
    kicker: '11.6', title: 'Ring, arc and disc', sub: 'when every dq is the same distance away',
    body: `
      <p class="lede">At the centre of a ring or arc, every d<i>q</i> is the same distance <i>R</i> away, so <i>V</i><sub>c</sub> = (<i>k</i>/<i>R</i>)∫d<i>q</i> = <i>kQ</i>/<i>R</i>.</p>
      <table class="data eqs">
        <tr><td>ring, on its axis</td><td><i>kQ</i>/√(<i>R</i>² + <i>z</i>²)</td></tr>
        <tr><td>disc, d<i>q</i> = σ·2π<i>r</i> d<i>r</i></td><td>2π<i>k</i>σ(√(<i>R</i>² + <i>z</i>²) − <i>z</i>)</td></tr>
        <tr><td>disc centre, σ = <i>Q</i>/π<i>R</i>²</td><td>2<i>kQ</i>/<i>R</i></td></tr>
      </table>
      <p>Each +2 nC, <i>R</i> = ${M.RING.R * 100} cm. Ring and half-ring centres: ${f(M.Varc0, 1)} V. Disc centre: ${f(M.Vdisc(0), 1)} V, twice as much, since the same charge sits closer.</p>
      <div class="charts">${chart({ ...R.ring, xlabel: 'distance z along the axis (m)', ylabel: 'V (volts)', cursors: [['ring'], ['disc', BLUE]], label: 'Potential on the axis of a ring and a disc',
        series: [{ color: BLUE, pts: samples(60, 0, 0.25, M.Vdisc), tag: [0.1, 160, 'disc'] }, { pts: samples(60, 0, 0.25, M.Vring), tag: [0.1, 70, 'ring'] }, { cls: 'trend', pts: samples(40, 0.075, 0.25, z => M.K * M.RING.Q / z), tag: [0.17, 112, 'kQ/z'] }] })}</div>
      <p class="hintline">Click the ring, arc or disc to break it into pieces d<i>q</i>.</p>`,
    cam: { target: [ST.ring - 1.4, 1.8, 0], az: -32, el: 12, dist: 29 }, lit: 'ring', scene: 'ring', look: {},
    fig: 'kQ/R at the centre; P out on the axis',
  },
  {
    kicker: '11.7', title: 'Charged spheres', sub: 'conductor and insulator',
    body: `
      <p class="lede">Find <b><i>E</i></b> in each region with Gauss’s law, then walk in from infinity: ∞ → <i>R</i> outside, <i>R</i> → <i>r</i> inside.</p>
      <p>Outside, both act like a point charge, <i>V</i> = <i>kQ</i>/<i>r</i>. Inside a <b>conductor</b> <i>E</i> = 0, so <i>V</i> stays <i>kQ</i>/<i>R</i> = ${f(M.Vcond(0), 1)} V. Inside an <b>insulator</b> <i>E</i> = <i>kQr</i>/<i>R</i>³ keeps adding:</p>
      <div class="eq"><i>V</i> = (<i>kQ</i>/<i>R</i>)(3/2 − <i>r</i>²/2<i>R</i>²)</div>
      <p>3<i>kQ</i>/2<i>R</i> = ${f(M.Vins(0), 1)} V at the centre (+2 nC, <i>R</i> = ${M.SPH.R * 100} cm). <i>V</i> never jumps.</p>
      <div class="charts">${chart({ ...R.sphV, xlabel: 'r (m)', ylabel: 'V (volts)', cursors: [['sphVc'], ['sphVi', BLUE]], label: 'Potential against r for the two spheres',
        series: [{ color: BLUE, pts: samples(120, 0, 0.4, M.Vins), tag: [0.11, 215, 'insulator'] }, { pts: samples(120, 0, 0.4, M.Vcond), tag: [0.13, 150, 'conductor'] }] })}</div>
      <p class="hintline">Click a sphere for <b><i>E</i></b> along the path. Sticks: one square per 150 V; <b><i>E</i></b>: one square per 2.5 kN/C.</p>`,
    cam: { target: [ST.spheres, 1.8, 0], az: -8, el: 10, dist: 27 }, lit: 'conductor', scene: 'spheres', look: {},
    fig: 'Walking in from 40 cm',
  },
  {
    kicker: '11.8', title: 'The electron volt', sub: 'energy from a potential difference',
    body: `
      <p class="lede">Let a charge go: potential energy turns into kinetic, and mechanical energy is conserved.</p>
      <div class="eq"><i>qV</i><sub>0</sub> = <i>qV</i><sub>f</sub> + ½<i>mv</i>²  →  <i>v</i> = √(2<i>q</i>Δ<i>V</i>/<i>m</i>)</div>
      <p>A proton rolls “downhill” with <b><i>E</i></b> from 7 V to 1 V; an electron goes the other way. Each gains ${M.ACC.dV} <b>eV</b> (1 eV = ${M.E_CH.toExponential(2).replace('e-', ' × 10⁻')} J, one <i>e</i> through 1 V), but the electron is ${Math.round(M.M_P / M.M_E)} times lighter:</p>
      <table class="data">
        <tr><th></th><th>proton</th><th>electron</th></tr>
        <tr><td>final speed</td><td>${f(M.ACC.vp / 1000, 1)} km/s</td><td>${f(M.ACC.ve / 1e6, 2)} × 10⁶ m/s</td></tr>
        <tr><td>time across 6 cm</td><td>${f(M.ACC.Tp * 1e6, 2)} μs</td><td>${f(M.ACC.Te * 1e9, 0)} ns</td></tr>
      </table>
      <div class="charts">${chart({ ...R.accel, xlabel: 'distance from the 7 V plate (cm)', ylabel: 'K (eV)', cursors: [['accP'], ['accE', BLUE]], label: 'Kinetic energy against position for the proton and the electron',
        series: [{ pts: [[0, 0], [6, 6]], tag: [3.6, 3.0, 'proton →'] }, { color: BLUE, pts: [[6, 0], [0, 6]], tag: [0.5, 3.4, '← electron'] }] })}</div>
      <p class="hintline">Each slowed to cross in ${M.ACC.run} s. Click for forces and strobes. 1 square = 1 cm; <b><i>E</i></b>: one square per 50 V/m.</p>`,
    cam: { target: [ST.accel, 2.3, 0], az: -16, el: 10, dist: 21 }, lit: 'accel', scene: 'accel', look: {},
    fig: 'Down 6 V and up 6 V: 6 eV each',
  },
];

// ---------- click a scene: what it breaks into ----------
const pairFacts = s => { const a = M.pair(s.pair.t, 1), b = M.pair(s.pair.t, -1);
  return [['separation r', `${f(a.r * 100, 1)} cm`], ['like: F on +2 nC', `${f(a.F * 1e6)} μN, away`], ['like: U', `${uJ(a.U)} μJ`], ['like: work done so far', `${uJ(a.W)} μJ`], ['unlike: U', `${uJ(b.U)} μJ`], ['unlike: work done so far', `${uJ(b.W)} μJ`]]; };
export const PLATES = {
  pair: { text: `Ghosts mark the path in 5 cm steps, each with the electric force there. The force grows as 1/<i>r</i>², so each step costs more than the last; the total, −∫<i>F</i> d<i>r</i>, is the change in <i>U</i>. For the like pair you push against the force (positive work); for the unlike pair the force does the pulling and you hold back (negative work).`, facts: pairFacts },
  square: { text: `The six links are the six pairs. Each stores <i>kq</i>²/<i>r</i>: the four sides at <i>r</i> = <i>a</i>, the two diagonals at √2<i>a</i>. Their sum is the energy of the group.`,
    facts: s => { const st = M.square(s.square.t); return [['charges in place', `${st.n} of 4`], ['U now', `${uJ(st.U)} μJ`], ['each side kq²/a', `${uJ(M.K * M.SQ.q ** 2 / M.SQ.a)} μJ`], ['each diagonal kq²/√2a', `${uJ(M.K * M.SQ.q ** 2 / (Math.SQRT2 * M.SQ.a))} μJ`], ['all six', `${uJ(M.SQ.U)} μJ`]]; } },
  uniform: { text: `A → C cut into four steps d<b><i>s</i></b> (black). Only the grey part d<i>x</i>, along <b><i>E</i></b>, counts: <b><i>E</i></b> · d<b><i>s</i></b> = <i>E</i> d<i>x</i>. Four steps of 5 cm each drop the potential by 2.5 V. The sideways part of each step runs along an equipotential and adds nothing, which is why the path doesn’t matter.`,
    facts: s => { const r = M.uniPath(s.uniform.t); return [['each step: −E dx', `−${M.UNI.E} × 0.05 = −2.5 V`], ['A → C, four steps', '−10.00 V'], ['charge at', `x = ${f(r.p[0] * 100, 1)} cm`], ['V there', `${f(r.V)} V`], ['U = qV (q = +1 nC)', `${f(r.U * 1e9)} nJ`]]; } },
  hill: { text: `The surface lifts off the floor map. Each contour ring drops onto its equipotential circle: an equipotential is a level path around the hill. The blue <b><i>E</i></b> arrows cross the circles at right angles, pointing downhill, longest where the circles crowd.`,
    facts: s => { const r = M.hillProbe(s.clock); return [['probe at r', `${f(r * 100, 1)} cm`], ['V = kq/r', `${f(M.Vpoint(M.HILL.Q, r), 1)} V`], ['E = kq/r²', `${f(M.Epoint(M.HILL.Q, r), 0)} N/C`], ['slope −dV/dr', `${f(M.Epoint(M.HILL.Q, r), 0)} V/m`]]; } },
  dipole: { text: `At each point the red stick is +1 nC’s <i>kq</i>/<i>r</i>, the blue stick −1 nC’s, and the black stick their sum. On the axis the near −q wins. On the bisector P′ the two cancel exactly: <i>V</i> = 0, and the black stick vanishes.`,
    facts: () => { const a = M.DIP.axisX, z = M.DIP.bisZ, v1 = M.Vpoint(M.DIP.q, a + M.DIP.a), v2 = M.Vpoint(-M.DIP.q, a - M.DIP.a), w = M.Vpoint(M.DIP.q, Math.hypot(M.DIP.a, z));
      return [['P: from +q', `${f(v1, 1)} V`], ['P: from −q', `${f(v2, 1)} V`], ['P: total', `${f(v1 + v2, 1)} V`], ['P′: ±q each', `±${f(w, 1)} V`], ['P′: total', '0 V']]; } },
  rod: { text: `The rod as ${12} slices of d<i>q</i> = λΔ<i>x</i> = 0.25 nC, each a point charge. Every slice sends <i>k</i> d<i>q</i>/<i>r</i> to P and to P′; the lines are those distances <i>r</i>. Twelve slices already come close to the integral.`,
    facts: s => { const a = M.rodProbe(s.clock); return [['P: distance a', `${f(a * 100, 1)} cm`], ['P: kλ ln((a+L)/a)', `${f(M.VrodAxis(a), 1)} V`], ['P: sum of 12 slices', `${f(M.rodSum(12, [-a, 0, 0]), 1)} V`], ['P′: closed form', `${f(rodB, 1)} V`], ['P′: sum of 12 slices', `${f(M.rodSum(12, [M.ROD.L / 2, 0, -M.ROD.bisA]), 1)} V`]]; } },
  ring: { text: `Sixteen pieces of 0.125 nC, every one the same distance √(<i>R</i>² + <i>z</i>²) from P, so the sum is just <i>kQ</i> over that distance.`,
    facts: s => { const z = M.axisProbe(s.clock); return [['P at z', `${f(z * 100, 1)} cm`], ['each piece is', `${f(Math.hypot(M.RING.R, z) * 100, 1)} cm away`], ['kQ/√(R² + z²)', `${f(M.Vring(z), 1)} V`], ['sum of 16 pieces', `${f(M.ringSum(16, z), 1)} V`]]; } },
  arc: { text: `A half ring, eight pieces of 0.25 nC, all ${M.ARC.R * 100} cm from the centre C. The arc’s span doesn’t matter, only its total charge: <i>V</i><sub>c</sub> = <i>kQ</i>/<i>R</i>. (Its field at C would depend on the shape; its potential doesn’t.)`,
    facts: () => [['each piece', `k(0.25 nC)/0.15 m = ${f(M.Varc0 / 8, 2)} V`], ['eight pieces', `${f(M.arcSum(8), 1)} V`], ['kQ/R', `${f(M.Varc0, 1)} V`]] },
  disc: { text: `Five rings, slid apart. Each is a ring of charge d<i>q</i> = σ · 2π<i>r</i> d<i>r</i> at distance √(<i>r</i>² + <i>z</i>²) from P; the outer rings hold more charge but sit further away. Adding them is the integral over <i>r</i>.`,
    facts: s => { const z = M.axisProbe(s.clock); return [['P at z', `${f(z * 100, 1)} cm`], ['σ', `${f(M.DISC.sigma * 1e9, 1)} nC/m²`], ['2πkσ(√(R² + z²) − z)', `${f(M.Vdisc(z), 1)} V`], ['sum of 5 rings', `${f(M.discSum(5, z), 1)} V`]]; } },
  conductor: { text: `The walk in, in two legs. From ∞ to <i>R</i> the field is <i>kQ</i>/<i>r</i>² (blue) and <i>V</i> climbs to <i>kQ</i>/<i>R</i>. Inside, <i>E</i> = 0: no arrows, nothing to add, so <i>V</i> stays flat. The whole conductor is one equipotential.`,
    facts: s => { const r = M.sphProbe(s.spheres.t); return [['probe at r', `${f(r * 100, 1)} cm`], ['E there', `${f(M.Econd(r), 0)} N/C`], ['V there', `${f(M.Vcond(r), 1)} V`], ['∞ → R adds', `${f(M.Vcond(M.SPH.R), 1)} V`], ['R → 0 adds', '0 V']]; } },
  insulator: { text: `The same walk. Outside, the same <i>kQ</i>/<i>r</i>² field. Inside, the field shrinks toward the centre as <i>kQr</i>/<i>R</i>³ (only the charge inside <i>r</i> counts) but it is not zero, so <i>V</i> keeps rising, by another <i>kQ</i>/2<i>R</i> at the centre.`,
    facts: s => { const r = M.sphProbe(s.spheres.t); return [['probe at r', `${f(r * 100, 1)} cm`], ['E there', `${f(M.Eins(r), 0)} N/C`], ['V there', `${f(M.Vins(r), 1)} V`], ['∞ → R adds', `${f(M.Vins(M.SPH.R), 1)} V`], ['R → 0 adds', `${f(M.Vins(0) - M.Vins(M.SPH.R), 1)} V`]]; } },
  accel: { text: `The same force <i>eE</i> on each, in opposite directions: positive charges are pushed along <b><i>E</i></b>, negative against it. The strobe images, equal times apart, spread out as each speeds up. Equal forces over equal distances: equal work, 6 eV each.`,
    facts: s => { const u = s.accel.t / M.ACC.run, p = M.accel(u, 'p'), e = M.accel(u, 'e');
      return [['force eE on each', `${(M.E_CH * M.ACC.E).toExponential(2)} N`], ['proton: V, K', `${f(p.V)} V, ${f(M.eV(p.K))} eV`], ['proton: v', `${f(p.v / 1000, 1)} km/s`], ['electron: V, K', `${f(e.V)} V, ${f(M.eV(e.K))} eV`], ['electron: v', `${f(e.v / 1e6, 3)} × 10⁶ m/s`]]; } },
};
