// Chapter 12, page by page (after the AP Physics C E&M organizer, Unit 4). Text and a chart on
// the left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS as ST } from './world.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const pF = c => f(c * 1e12, 1);
const BLUE = '#3d63a8', GREY = '#86868c';

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], cursors = [], label, under = '' }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}"${s.color ? ` style="stroke:${s.color}"` : ''} d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}"${s.color ? ` style="fill:${s.color}"` : ''}>${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    ${under}<rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(([key, color]) => `<circle class="cursor" r="4.5" data-cursor="${key}"${color ? ` style="fill:${color}"` : ''}/>`).join('')}
  </svg>`;
}
const samples = (n, a, b, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });
const area = (R, pts) => `<path d="M${CH.sx(pts[0][0], R.x0, R.x1)},${CH.sy(0, R.y0, R.y1)}${pts.map(([x, y]) => `L${CH.sx(x, R.x0, R.x1).toFixed(1)},${CH.sy(y, R.y0, R.y1).toFixed(1)}`).join('')}L${CH.sx(pts[pts.length - 1][0], R.x0, R.x1)},${CH.sy(0, R.y0, R.y1)}Z" style="fill:#dfe7f6;stroke:none"/>`;

// chart ranges, shared with the live cursors in main.js
export const R = {
  charge: { x0: 0, x1: 100, y0: 0, y1: 800 },
  gap: { x0: 0, x1: 10, y0: 0, y1: 20 },
  sph: { x0: 0, x1: 25, y0: 0, y1: 2500 },
  cyl: { x0: 0, x1: 10, y0: 0, y1: 5000 },
  fill: { x0: 0, x1: 800, y0: 0, y1: 120 },
  slab: { x0: 0, x1: 1, y0: 0, y1: 2500 },
  energy: { x0: 0, x1: 1, y0: 0, y1: 3.5 },
  probe: { x0: -28, x1: 28, y0: 0, y1: 3500 },
};
const RS = R.sph, RC = R.cyl;
const sphCurve = samples(120, 0, 25, r => M.sphE(r / 100)), cylCurve = samples(200, 0, 10, r => M.cylE(r / 100));
const S = M.SER, PA = M.PAR, u = x => (x * 1e6).toFixed(0);

// a bar chart of the charge on each capacitor, series against parallel
const qBars = (() => {
  const bars = [['C₁', S.Q1, 0], ['C₂', S.Q2, 1], ['C₁', PA.Q1, 3], ['C₂', PA.Q2, 4]], base = 140, top = 24, max = 40e-6, bw = 46, x0 = 70;
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 10}" role="img" aria-label="Charge on each capacitor, series and parallel">
    <line class="zero" x1="${x0 - 20}" x2="${x0 + 5.6 * (bw + 16)}" y1="${base}" y2="${base}"/>
    ${bars.map(([n, q, i]) => { const h = (base - top) * q / max, x = x0 + i * (bw + 16); return `<rect class="bar" x="${x}" y="${base - h}" width="${bw}" height="${h}"/><text class="ax" x="${x + bw / 2}" y="${base - h - 6}" text-anchor="middle">${u(q)} µC</text><text class="lab" x="${x + bw / 2}" y="${base + 16}" text-anchor="middle">${n}</text>`; }).join('')}
    <text class="ax" x="${x0 + (bw + 16) - 8}" y="${base + 32}" text-anchor="middle">series: same Q</text>
    <text class="ax" x="${x0 + 3.5 * (bw + 16) + bw / 2}" y="${base + 32}" text-anchor="middle">parallel: Q adds</text>
  </svg>`;
})();

const dielTable = `<table class="data">${[0, 2, 4, 6].map(i => `<tr><td>${M.DIELECTRICS[i][0]}</td><td>${M.DIELECTRICS[i][1]}</td><td>${M.DIELECTRICS[i + 1][0]}</td><td>${M.DIELECTRICS[i + 1][1]}</td></tr>`).join('')}</table>`;
const full = { iso: M.slab(1, false), con: M.slab(1, true) };

const steps = rows => `<table class="data eqs">${rows.map(([e, n]) => `<tr><td>${e}</td><td>${n}</td></tr>`).join('')}</table>`;

export const PAGES = [
  {
    kicker: 'Chapter 12', title: 'Capacitors', sub: 'charge held apart',
    body: `
      <p class="lede">A <b>capacitor</b> is two conductors held apart. A battery moves charge from one to the other, leaving +<i>Q</i> and −<i>Q</i> with a field between them.</p>
      <p>Double the voltage and the charge doubles. Their ratio, the <b>capacitance</b>, stays put:</p>
      <div class="eq"><i>C</i> = <i>Q</i> / Δ<i>V</i></div>
      <p>In farads (1 F = 1 C/V), never negative. It depends only on the <b>geometry</b> and the material in the gap. These plates are 20 cm square, 5 cm apart: <i>C</i> = ${pF(M.C0)} pF.</p>
      <div class="charts">${chart({ ...R.charge, xlabel: 'ΔV (V)', ylabel: 'Q (pC)', cursors: [['charge']], label: 'Charge against voltage: a straight line of slope C',
        series: [{ pts: [[0, 0], [100, M.Q0 * 1e12]], tag: [58, M.C0 * 58e12 - 190, `slope = C = ${pF(M.C0)} pF`] }] })}</div>
      <p class="hintline">One field line per ± pair. Click the plates. Drawn to scale.</p>`,
    cam: { target: [ST.plates, 1.4, 0], az: 24, el: 16, dist: 10.5 }, lit: 'plates', scene: 'plates', look: {},
    fig: 'A battery turned up and down',
  },
  {
    kicker: '12.1', title: 'Parallel plates', sub: 'Gauss’s law, then ΔV, then C',
    body: `
      <p class="lede">Three steps, every time: <i>E</i> by Gauss’s law, Δ<i>V</i> by integrating, <i>C</i> = <i>Q</i>/Δ<i>V</i>.</p>
      ${steps([
        ['<i>EA</i> = σ<i>A</i>/ε<sub>0</sub>', 'pillbox'],
        ['<i>E</i> = σ/ε<sub>0</sub> = <i>Q</i>/ε<sub>0</sub><i>A</i>', 'uniform'],
        ['Δ<i>V</i> = −∫<sub><i>d</i></sub><sup>0</sup> <i>E ds</i> = <i>Ed</i>', 'E constant'],
        ['<i>C</i> = <i>Q</i>/Δ<i>V</i> = <b>ε<sub>0</sub><i>A</i>/<i>d</i></b>', 'Q cancels'],
      ])}
      <p><i>Q</i> is fixed while the gap changes: <i>E</i> stays ${f(M.E0, 0)} V/m, Δ<i>V</i> = <i>Ed</i> grows, <i>C</i> falls as 1/<i>d</i>.</p>
      <div class="charts">${chart({ ...R.gap, xlabel: 'gap d (cm)', ylabel: 'C (pF)', cursors: [['gap']], label: 'Capacitance against gap',
        series: [{ pts: samples(80, 1.8, 10, d => M.cPlate(M.PLATE.A, d / 100) * 1e12) }] })}</div>
      <p class="hintline">Click the pillbox to pull it out.</p>`,
    cam: { target: [ST.pillbox, 1.45, 0], az: 24, el: 15, dist: 11 }, lit: 'pillbox', scene: 'gap', look: {},
    fig: 'Same charge, the gap changing',
  },
  {
    kicker: '12.2', title: 'Two spheres', sub: 'a ball inside a shell',
    body: `
      <p class="lede">A ball (<i>a</i> = ${M.SPH.a * 100} cm, +<i>Q</i>) inside a shell (<i>b</i> = ${M.SPH.b * 100} cm, −<i>Q</i>), cut in half.</p>
      ${steps([
        ['<i>E</i>·4π<i>r</i><sup>2</sup> = <i>Q</i>/ε<sub>0</sub>', 'Gauss, a < r < b'],
        ['Δ<i>V</i> = −∫<sub><i>b</i></sub><sup><i>a</i></sup> <i>Q dr</i>/4πε<sub>0</sub><i>r</i><sup>2</sup>', 'E·ds = E dr'],
        ['&nbsp;&nbsp;&nbsp;&nbsp;= <i>Q</i>(<i>b</i> − <i>a</i>)/4πε<sub>0</sub><i>ab</i>', ''],
        ['<i>C</i> = <b>4πε<sub>0</sub><i>ab</i>/(<i>b</i> − <i>a</i>)</b>', `${pF(M.SPH.C)} pF`],
      ])}
      <p>As <i>b</i> → ∞, <i>C</i> → 4πε<sub>0</sub><i>a</i>, a lone sphere. Shaded: Δ<i>V</i> = ${M.V0} V.</p>
      <div class="charts">${chart({ ...RS, xlabel: 'r (cm)', ylabel: 'E (V/m)', cursors: [['sph']], label: 'Field against radius, zero outside the gap', under: area(RS, sphCurve.filter(([r]) => r >= 10 && r <= 20)), series: [{ pts: sphCurve }] })}</div>
      <p class="hintline">Click to open the shell. Arrows 2 cm per kV/m.</p>`,
    cam: { target: [ST.sphere, 2.2, 0], az: 14, el: 12, dist: 17 }, lit: 'sphere', scene: 'sphere', look: {},
    fig: 'E ∝ 1/r² between the shells',
  },
  {
    kicker: '12.3', title: 'Two cylinders', sub: 'a rod inside a tube',
    body: `
      <p class="lede">A rod (<i>a</i> = ${M.CYL.a * 100} cm) inside a tube (<i>b</i> = ${M.CYL.b * 100} cm), <i>L</i> = ${M.CYL.L * 100} cm long: a short coaxial cable.</p>
      ${steps([
        ['<i>E</i>·2π<i>rL</i> = <i>Q</i>/ε<sub>0</sub>', 'Gauss, side only'],
        ['Δ<i>V</i> = −∫<sub><i>b</i></sub><sup><i>a</i></sup> <i>Q dr</i>/2πε<sub>0</sub><i>rL</i>', 'E·ds = E dr'],
        ['&nbsp;&nbsp;&nbsp;&nbsp;= (<i>Q</i>/2πε<sub>0</sub><i>L</i>) ln(<i>b</i>/<i>a</i>)', '∫dr/r = ln r'],
        ['<i>C</i> = <b>2πε<sub>0</sub><i>L</i>/ln(<i>b</i>/<i>a</i>)</b>', `${pF(M.CYL.C)} pF`],
      ])}
      <p><i>E</i> ∝ 1/<i>r</i>, gentler than 1/<i>r</i><sup>2</sup>, hence the logarithm. <i>C</i> ∝ length: ${f(M.CYL.C / M.CYL.L * 1e12, 0)} pF per metre.</p>
      <div class="charts">${chart({ ...RC, xlabel: 'r (cm)', ylabel: 'E (V/m)', cursors: [['cyl']], label: 'Field against radius for the coaxial pair', under: area(RC, cylCurve.filter(([r]) => r >= 2 && r <= 8)), series: [{ pts: cylCurve }] })}</div>
      <p class="hintline">Click to slide the tube off. Arrows 1 cm per kV/m.</p>`,
    cam: { target: [ST.coax, 1.5, 0], az: 16, el: 14, dist: 14 }, lit: 'coax', scene: 'coax', look: {},
    fig: 'E ∝ 1/r inside a tube',
  },
  {
    kicker: '12.4', title: 'Stored energy', sub: 'the work of charging',
    body: `
      <p class="lede">Each bit <i>dq</i> is carried from − to + against the field already there, through Δ<i>V</i> = <i>q</i>/<i>C</i>. The first bits are free; the last cost the full ${M.V0} V.</p>
      <div class="eq"><i>U</i> = ∫<sub>0</sub><sup><i>Q</i></sup> <i>q</i>/<i>C</i> <i>dq</i> = <i>Q</i><sup>2</sup>/2<i>C</i></div>
      <p>= ½<i>Q</i>Δ<i>V</i> = ½<i>C</i>Δ<i>V</i><sup>2</sup>: the triangle under the line, ${f(M.U0 * 1e9, 1)} nJ here. The energy lives in the field, at an <b>energy density</b> (J/m³)</p>
      <div class="eq"><i>u</i> = ½ε<sub>0</sub><i>E</i><sup>2</sup></div>
      <div class="charts">${chart({ ...R.fill, xlabel: 'charge moved q (pC)', ylabel: 'ΔV (V)', cursors: [['fill']], label: 'Voltage against charge moved; the area under it is the stored energy',
        under: `<path data-area="fill" style="fill:#dfe7f6"/>`, series: [{ pts: [[0, 0], [800, 800e-12 / M.C0]] }] })}</div>
      <p class="live" id="filllive"></p>
      <p class="hintline">Blue in the gap darkens with u. Click the plates.</p>`,
    cam: { target: [ST.energy + 0.4, 1.45, 0], az: 24, el: 14, dist: 12 }, lit: 'energy', scene: 'energy', look: {},
    fig: 'Charging, a bit at a time',
  },
  {
    kicker: '12.5', title: 'Series and parallel', sub: 'same Q, or same ΔV',
    body: `
      <p class="lede">${M.CIRC.C1 * 1e6} µF and ${M.CIRC.C2 * 1e6} µF on ${M.CIRC.V} V. Plate area is drawn ∝ <i>C</i>; one mark is 2 µC.</p>
      <table class="data cols">
        <tr><th>series</th><th>parallel</th></tr>
        <tr><td>same <i>Q</i> on each</td><td>same Δ<i>V</i> on each</td></tr>
        <tr><td>Δ<i>V</i> = Δ<i>V</i><sub>1</sub> + Δ<i>V</i><sub>2</sub></td><td><i>Q</i> = <i>Q</i><sub>1</sub> + <i>Q</i><sub>2</sub></td></tr>
        <tr><td>1/<i>C</i><sub>eq</sub> = 1/<i>C</i><sub>1</sub> + 1/<i>C</i><sub>2</sub></td><td><i>C</i><sub>eq</sub> = <i>C</i><sub>1</sub> + <i>C</i><sub>2</sub></td></tr>
        <tr><td>${f(S.C * 1e6)} µF: ${f(S.V1, 0)} V + ${f(S.V2, 0)} V</td><td>${f(PA.C * 1e6, 0)} µF: ${u(PA.Q1)} + ${u(PA.Q2)} µC</td></tr>
      </table>
      <p>In series the wire between them is a neutral island: +<i>Q</i> on one end means −<i>Q</i> on the other. The smaller capacitor takes more of the voltage; in parallel the bigger one takes more charge.</p>
      <div class="charts">${qBars}</div>
      <p class="hintline">Click a circuit for its charges and voltages.</p>`,
    cam: { target: [ST.circuits, 1.6, 0], az: 16, el: 9, dist: 19 }, lit: 'series', scene: 'circuits', look: {},
    fig: '2 µF and 4 µF on 9 V',
  },
  {
    kicker: '12.6', title: 'Dielectrics', sub: 'an insulator in the gap',
    body: `
      <p class="lede">An insulator in the gap <b>polarizes</b>: each molecular dipole feels τ = <i>p</i>×<i>E</i> = <i>pE</i> sin θ and turns toward <i>U</i> = −<i>p</i>·<i>E</i>, its lowest energy.</p>
      <p>The lined-up ends leave <b>bound charge</b> on the faces; its field <i>E</i><sub>ind</sub> opposes the plates’:</p>
      <div class="eq"><i>E</i> = <i>E</i><sub>0</sub> − <i>E</i><sub>ind</sub> = <i>E</i><sub>0</sub>/κ</div>
      <p>With <i>Q</i> fixed, Δ<i>V</i> falls by κ and <i>C</i> = κε<sub>0</sub><i>A</i>/<i>d</i> rises by κ ≥ 1.</p>
      ${dielTable}
      <div class="charts">${chart({ ...R.slab, xlabel: 'fraction of the gap filled', ylabel: 'E (V/m)', cursors: [['slab']], label: 'Field against how far the slab is in',
        series: [{ pts: samples(60, 0, 1, x => M.slab(x, false).E) }], marks: [[1, full.iso.E, `E₀/κ`, -46, -8]] })}</div>`,
    cam: { target: [ST.slab, 1.85, 0], az: 26, el: 13, dist: 11.5 }, lit: 'slab', scene: 'slab', look: {},
    fig: 'A κ = 3 slab, plates isolated',
  },
  {
    kicker: '12.7', title: 'Connected or not', sub: 'what the battery holds fixed',
    body: `
      <p class="lede">Partly in, the slab and the air beside it are two capacitors in parallel: <i>C</i> = <i>C</i><sub>0</sub>(1 + (κ − 1)<i>x</i>); half in, <i>C</i><sub>0</sub>/2 · (1 + κ).</p>
      <table class="data">
        <tr><th>slab fully in</th><th>connected</th><th>disconnected</th></tr>
        <tr><td>held fixed</td><td>Δ<i>V</i> = ${M.V0} V</td><td><i>Q</i> = ${f(M.Q0 * 1e12, 0)} pC</td></tr>
        <tr><td><i>Q</i></td><td>κ<i>Q</i><sub>0</sub> = ${f(full.con.Q * 1e12, 0)} pC</td><td><i>Q</i><sub>0</sub></td></tr>
        <tr><td>Δ<i>V</i>, <i>E</i></td><td>unchanged</td><td>÷ κ (${f(full.iso.V, 1)} V)</td></tr>
        <tr><td><i>U</i></td><td>× κ (${f(full.con.U * 1e9, 1)} nJ)</td><td>÷ κ (${f(full.iso.U * 1e9, 1)} nJ)</td></tr>
      </table>
      <p>Connected, charge flows on where the slab is; the battery does work Δ<i>V</i>·Δ<i>Q</i>, twice the rise in stored energy. Either way the plates pull the slab in.</p>
      <div class="charts">${chart({ ...R.energy, xlabel: 'fraction of the gap filled', ylabel: 'U / U₀', cursors: [['enA'], ['enB', GREY]], label: 'Stored energy against fraction filled, connected and disconnected',
        series: [{ pts: samples(60, 0, 1, x => M.slab(x, true).U / M.U0), tag: [0.3, 1.75, 'connected'] }, { pts: samples(60, 0, 1, x => M.slab(x, false).U / M.U0), color: GREY, tag: [0.6, 0.55, 'disconnected'] }] })}</div>
      <p class="hintline">Click either capacitor.</p>`,
    cam: { target: [ST.compare, 1.75, 0], az: 24, el: 11, dist: 16.5 }, lit: 'battery', scene: 'compare', look: {},
    fig: 'Battery on (left), off (right)',
  },
  {
    kicker: '12.8', title: 'Conductors', sub: 'in electrostatic equilibrium',
    body: `
      <p class="lede">A neutral metal sphere in a ${M.COND.E0} V/m field. Its free electrons drift until their own field cancels the outside one within. Then:</p>
      <ul class="rules">
        <li><i>E</i> = 0 everywhere inside the metal;</li>
        <li>any charge sits on the surface;</li>
        <li>just outside, <i>E</i> ⊥ surface and <i>E</i> = σ/ε<sub>0</sub>;</li>
        <li>the whole conductor is one potential.</li>
      </ul>
      <p>Here σ = 3ε<sub>0</sub><i>E</i><sub>0</sub> cos θ, summing to zero; at the poles <i>E</i> = 3<i>E</i><sub>0</sub>. A metal slab of thickness <i>t</i> in a capacitor leaves two gaps in series: <i>C</i> = ε<sub>0</sub><i>A</i>/(<i>d</i> − <i>t</i>).</p>
      <div class="charts">${chart({ ...R.probe, xlabel: 'along the axis (cm)', ylabel: 'E (V/m)', cursors: [['probe']], label: 'Field along the axis through the sphere',
        series: [{ pts: samples(160, -28, -10.0001, x => M.condAxisE(x / 100)) }, { pts: [[-10, 0], [10, 0]] }, { pts: samples(160, 10.0001, 28, x => M.condAxisE(x / 100)) }] })}</div>
      <p class="hintline">Click the sphere to cut it. Field lines traced from the model.</p>`,
    cam: { target: [ST.conductor, 1.8, 0], az: 40, el: 10, dist: 19 }, lit: 'conductor', scene: 'conductor', look: {},
    fig: 'A neutral metal sphere in a field',
  },
];

// ---------- click a scene: what it breaks into ----------
const sph = r => [['Gaussian radius r', `${f(r * 100, 1)} cm`], ['E(r) = Q/4πε₀r²', `${f(M.sphE(r), 0)} V/m`], ['flux E·4πr²', `${f(M.sphE(r) * 4 * Math.PI * r * r, 1)} V·m`], ['Q/ε₀', `${f(M.SPH.Q / M.EPS0, 1)} V·m`]];
export const PLATES = {
  plates: { text: `Each plate alone makes a field σ/2ε₀ pointing away from + and toward − (grey). Between the plates the two point the same way and add to σ/ε₀. Outside they point opposite ways and cancel. That is why the field is all in the gap.`,
    facts: s => { const r = M.charging(s.charge.t); return [['ΔV', `${f(r.V, 1)} V`], ['Q = CΔV', `${f(r.Q * 1e12, 0)} pC`], ['each plate σ/2ε₀', `${f(r.E / 2, 0)} V/m`], ['between: sum', `${f(r.E, 0)} V/m`], ['outside: difference', '0 V/m']]; } },
  pillbox: { text: `The pillbox straddles the + plate. Its outer face is in zero field and its side runs along the field, so the only flux is through the face in the gap: E·A. Inside it is the charge σA. Gauss: EA = σA/ε₀.`,
    facts: s => { const r = M.gapScene(s.gap.t), A = M.PILLBOX.A; return [['face area A', `${f(A * 1e4, 1)} cm²`], ['flux E·A', `${f(r.E * A, 3)} V·m`], ['q_enc/ε₀', `${f(M.Q0 / M.PLATE.A * A / M.EPS0, 3)} V·m`], ['gap d', `${f(r.d * 100, 1)} cm`], ['ΔV = Ed', `${f(r.V, 0)} V`], ['C = ε₀A/d', `${pF(r.C)} pF`]]; } },
  sphere: { text: `Opened, the shell shows the ball and the Gaussian sphere between them. Whatever its radius, the flux through it is the same Q/ε₀, so E falls as 1/r².`,
    facts: s => sph(M.gaussR(s.sweep.t, M.SPH.a, M.SPH.b)) },
  coax: { text: `With the tube aside, the rod and the Gaussian cylinder. Flux leaves only through the curved side, area 2πrL, so E = Q/2πε₀rL falls as 1/r.`,
    facts: s => { const r = M.gaussR(s.sweep.t, M.CYL.a, M.CYL.b); return [['Gaussian radius r', `${f(r * 100, 1)} cm`], ['E(r)', `${f(M.cylE(r), 0)} V/m`], ['flux E·2πrL', `${f(M.cylE(r) * 2 * Math.PI * r * M.CYL.L, 1)} V·m`], ['Q/ε₀', `${f(M.CYL.Q / M.EPS0, 1)} V·m`], ['C', `${pF(M.CYL.C)} pF`]]; } },
  energy: { text: `The energy is spread through the gap’s volume, A × d, at density u = ½ε₀E². Multiply them and you get ½CΔV² back.`,
    facts: s => { const r = M.filling(s.fill.t), vol = M.PLATE.A * M.PLATE.d; return [['E', `${f(r.E, 0)} V/m`], ['u = ½ε₀E²', `${f(r.u * 1e6, 2)} µJ/m³`], ['volume Ad', `${f(vol * 1e6, 0)} cm³`], ['u·Ad', `${f(r.u * vol * 1e9, 2)} nJ`], ['Q²/2C', `${f(r.U * 1e9, 2)} nJ`]]; } },
  series: { text: `The battery moves ${u(S.Q)} µC around the loop. The two inner plates and the wire between them are one neutral island: −${u(S.Q)} µC on one side, +${u(S.Q)} µC on the other. Each capacitor’s voltage is Q/C, and they add to ${M.CIRC.V} V.`,
    facts: () => [['C_eq', `${f(S.C * 1e6)} µF`], ['Q on each', `${u(S.Q)} µC`], ['ΔV₁ = Q/C₁', `${f(S.V1, 1)} V`], ['ΔV₂ = Q/C₂', `${f(S.V2, 1)} V`], ['energy ½C_eqV²', `${f(S.U * 1e6, 0)} µJ`]] },
  parallel: { text: `Both capacitors connect straight across the battery, so each has the full ${M.CIRC.V} V. Each takes Q = CΔV, and the battery supplies the sum.`,
    facts: () => [['C_eq', `${f(PA.C * 1e6, 0)} µF`], ['ΔV on each', `${M.CIRC.V} V`], ['Q₁ = C₁ΔV', `${u(PA.Q1)} µC`], ['Q₂ = C₂ΔV', `${u(PA.Q2)} µC`], ['energy ½C_eqV²', `${f(PA.U * 1e6, 0)} µJ`]] },
  slab: { text: `In the slab: the free charge on the plates alone would make E₀ (grey, right). The bound charge on the slab’s faces makes E_ind (grey, left). What is left is E (blue), the same in the slab and in the air beside it, since both span the same ΔV.`,
    facts: s => { const x = M.fillOf(s.slide.t), r = M.slab(x, false); return [['slab in', `${f(x * 100, 0)} %`], ['E₀ = σ_free/ε₀ (slab part)', `${f(r.Efree, 0)} V/m`], ['E_ind = σ_bound/ε₀', `${f(r.Eind, 0)} V/m`], ['E = E₀ − E_ind', `${f(r.E, 0)} V/m`], ['ΔV', `${f(r.V, 1)} V`], ['C', `${pF(r.C)} pF`]]; } },
  battery: { text: `The battery holds ΔV at ${M.V0} V, so E = ΔV/d can’t change. As the slab comes in, charge flows on to the plates facing it until there is κ times as much there.`,
    facts: s => { const r = M.slab(M.fillOf(s.slide.t), true); return [['C', `${pF(r.C)} pF`], ['Q', `${f(r.Q * 1e12, 0)} pC`], ['ΔV', `${f(r.V, 1)} V`], ['E', `${f(r.E, 0)} V/m`], ['U', `${f(r.U * 1e9, 1)} nJ`]]; } },
  isolated: { text: `Nothing can flow on or off, so Q stays. The charge shifts toward the slab, the field falls everywhere in the gap, and so does ΔV.`,
    facts: s => { const r = M.slab(M.fillOf(s.slide.t), false); return [['C', `${pF(r.C)} pF`], ['Q', `${f(r.Q * 1e12, 0)} pC`], ['ΔV', `${f(r.V, 1)} V`], ['E', `${f(r.E, 0)} V/m`], ['U', `${f(r.U * 1e9, 1)} nJ`]]; } },
  conductor: { text: `Cut open: no charge and no field inside, only on the surface. A Gaussian surface anywhere in the metal has E = 0 on it, so it encloses no charge. The same holds for a hollow shell, which is why a metal box shields what is inside.`,
    facts: s => { const x = M.probeX(s.clock); return [['probe at', `${f(x * 100, 1)} cm`], ['E there', `${f(M.condAxisE(x), 0)} V/m`], ['E inside', '0 V/m'], ['σ at the poles', `±${f(M.condSigma(0) * 1e9, 1)} nC/m²`], ['E at the poles = σ/ε₀', `${f(M.condSigma(0) / M.EPS0, 0)} V/m`]]; } },
};
