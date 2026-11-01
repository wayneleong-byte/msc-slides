// Chapter 13, page by page (after the AP Physics C E&M organizer, Units 5 and 6). Text and a chart
// on the left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, HS, MAG, SPEEDUP, LEN_SCALE, K_DOT } from './world.js';

const f = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const sci = (x, n = 2) => { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(n)} × 10<sup>${e < 0 ? '−' : ''}${Math.abs(e)}</sup>`; };
const heightNote = `Height: one grid square per ${f(1 / HS, 0)} V.`;

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], vlines = [], cursors = [], label }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(Math.min(Math.max(y, y0), y1)).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const vl = vlines.map(([x, t]) => `<line class="grid" x1="${sx(x)}" x2="${sx(x)}" y1="${P.t}" y2="${H - P.b}"/><text class="ax" x="${sx(x)}" y="${H - 9}" text-anchor="middle">${t}</text>`).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const cs = cursors.map(c => `<circle class="cursor" r="4.5" cx="-20" cy="-20" data-cursor="${c}"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${vl}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2 + 40}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cs}
  </svg>`;
}
const curve = (fn, a, b, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });
// chart ranges, shared with main.js for the live cursors
export const R = {
  drude: { x0: 0, x1: 4, y0: 0, y1: 2.4 },
  res: { x0: 0, x1: 2, y0: 0, y1: 12 },
  energy: { x0: 0, x1: M.BULB.run, y0: 0, y1: 60 },
  term: { x0: 0, x1: 6, y0: 0, y1: 12 },
  pload: { x0: 0, x1: 8, y0: 0, y1: 20 },
  rc: { x0: 0, x1: M.RC.cycle, y0: -100, y1: 100 },
};

const { CU, RC } = M;
const ohmI = M.OHM.E / M.OHM.R, bulbI = M.BULB.E / M.BULB.R, bulbP = bulbI * M.BULB.E;
const kr = M.solve(M.KIRCH.edges, 'bl'), kI = n => M.edgeI(M.KIRCH, kr, n), kd = M.solve(M.kirchEdges(false), 'bl');

export const PAGES = [
  {
    levels: ['junior', 'senior'],
    kicker: 'Chapter 13', title: 'Current', sub: 'charge on the move',
    body: `
      <p class="lede">A battery holds two terminals at a fixed potential difference. Join them with a wire and a field inside the metal pushes its free charges along: a <b>current</b>.</p>
      <div class="eq"><i>I</i> = d<i>q</i>/d<i>t</i> = <i>nqAv</i><sub>d</sub>,  <i>J</i> = <i>I</i>/<i>A</i> = <i>nqv</i><sub>d</sub> = σ<i>E</i></div>
      <p>1 A = 1 C/s, counted as if <i>positive</i> charge moved; electrons drift the other way. A slab Δ<i>x</i> = <i>v</i><sub>d</sub>Δ<i>t</i> long holds <i>nqA</i>Δ<i>x</i>, all of which crosses <i>A</i> in Δ<i>t</i>. In general <i>I</i> = ∫<b>J</b>·d<b>A</b>.</p>
      <table class="data">
        <tr><td>1 A in 1 mm² of copper: <i>n</i></td><td>${sci(CU.n, 1)} m⁻³</td></tr>
        <tr><td>drift speed <i>v</i><sub>d</sub></td><td>${f(CU.vd * 1e3, 3)} mm/s</td></tr>
      </table>
      <p>Each electron speeds up, hits an ion, stops, starts again (the Drude model), averaging <i>v</i><sub>d</sub>: ${f(CU.hours, 1)} h per metre. A lamp still lights at once, because the field races down the wire.</p>
      <div class="charts">${chart({ ...R.drude, xlabel: 'time (collisions)', ylabel: 'one electron’s speed / v_d', cursors: ['drude'], label: 'Sawtooth speed of one electron, averaging the drift speed',
        series: [{ pts: curve(t => M.drudeV(t, 1, 1), 0, 3.999, 400) }, { cls: 'trend', pts: [[0, 1], [4, 1]], tag: [3.25, 1, 'v_d'] }] })}</div>
      <p class="hintline">Click the wire for the slab that crosses <i>A</i>. Drawn ${MAG}× life size; drift ${SPEEDUP}× faster than life.</p>`,
    cam: { target: [STATIONS.wire, 0.95, 0], az: -16, el: 14, dist: 21 }, lit: 'wire', scene: 'wire', look: {},
    fig: 'Electrons drift against the current',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '13.1', title: 'Resistance', sub: 'long and thin resists more',
    body: `
      <p class="lede"><b>Resistance</b> <i>R</i> = Δ<i>V</i>/<i>I</i>, in ohms (V/A), is how hard it is to push a current through something.</p>
      <div class="eq"><i>R</i> = ρ<i>L</i>/<i>A</i> = <i>L</i>/σ<i>A</i></div>
      <p>The material sets the <b>resistivity</b> ρ = 1/σ (copper ${sci(M.RHO.copper, 2)}, nichrome ${sci(M.RHO.nichrome, 2)} Ω·m); the shape sets <i>L</i>/<i>A</i>. Twice as long: two pieces in series, twice <i>R</i>. Twice the diameter: four strands side by side, a quarter of <i>R</i>.</p>
      <p>Nichrome wires ${f(M.RES.dThin * 1e3, 1)} and ${f(M.RES.dThick * 1e3, 1)} mm across, 1.5 V on each. Carriers drift equally fast in both (same <i>E</i> = Δ<i>V</i>/<i>L</i>); the thick one has four times as many.</p>
      <div class="charts">${chart({ ...R.res, xlabel: 'length L (m)', ylabel: 'R (Ω)', cursors: ['thin', 'thick'], label: 'Resistance against length for two diameters',
        series: [{ pts: curve(M.rThin, 0, 2, 4), tag: [1.15, M.rThin(1.15), 'd'] }, { pts: curve(M.rThick, 0, 2, 4), tag: [1.5, M.rThick(1.5), '2d'] }] })}</div>
      <p class="hintline">Click to split the thick wire into four. Lengths ${LEN_SCALE * 100} cm per metre; thickness enlarged.</p>`,
    cam: { target: [STATIONS.resist - 0.5, 0.35, 0], az: -14, el: 30, dist: 15 }, lit: 'wires', scene: 'wires', look: {},
    fig: 'Same 1.5 V, different shapes',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '13.2', title: 'Ohm’s law', sub: 'V = IR',
    body: `
      <p class="lede">For an ohmic conductor the current is proportional to the voltage across it; the ratio is its resistance.</p>
      <p>Start from Ohm’s law in the metal, <i>J</i> = σ<i>E</i>, with <i>E</i> = Δ<i>V</i>/<i>L</i> along a wire:</p>
      <div class="eq"><i>I</i> = <i>JA</i> = σ<i>A</i>Δ<i>V</i>/<i>L</i>  ⟹  Δ<i>V</i> = <i>IR</i></div>
      <p>${M.OHM.E} V across ${M.OHM.R} Ω drives ${f(ohmI, 1)} A. Each point is drawn at the height of its potential: the battery lifts charge ${M.OHM.E} V, ideal wires stay level, and the resistor is a ramp down. Following the current through a resistor, you <i>lose</i> potential.</p>
      <div class="charts">${chart({ x0: 0, x1: 9, y0: 0, y1: 3, xlabel: 'ΔV (V)', ylabel: 'I (A)', label: 'Current against voltage for a 3 ohm resistor: a straight line',
        series: [{ pts: [[0, 0], [9, 3]], tag: [6.6, 2.15, 'slope 1/R'] }], marks: [[M.OHM.E, ohmI, `${M.OHM.E} V, ${f(ohmI, 1)} A`, 8, 14]] })}</div>
      <p class="hintline">Click for the field in the resistor. ${heightNote}</p>`,
    cam: { target: [STATIONS.ohm, 0.8, 0.1], az: -34, el: 16, dist: 14 }, lit: 'ohm', scene: 'ohm', look: { ohm: 1 },
    fig: 'Up through the battery, down the resistor',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '13.3', title: 'Power', sub: 'P = IΔV',
    body: `
      <p class="lede">Each coulomb gains Δ<i>V</i> joules in the battery and gives them up in the resistor as heat and, in a bulb, light.</p>
      <div class="eq"><i>P</i> = d<i>U</i>/d<i>t</i> = <i>I</i>Δ<i>V</i> = <i>I</i>²<i>R</i> = Δ<i>V</i>²/<i>R</i></div>
      <p>The last two use Δ<i>V</i> = <i>IR</i>: <i>I</i>²<i>R</i> when you know the current (series), Δ<i>V</i>²/<i>R</i> when you know the voltage (parallel). Unit: the watt, J/s.</p>
      <table class="data">
        <tr><td><i>I</i>Δ<i>V</i></td><td>${f(bulbI, 2)} A × ${M.BULB.E} V = ${f(bulbP, 1)} W</td></tr>
        <tr><td><i>I</i>²<i>R</i></td><td>(${f(bulbI, 2)} A)² × ${M.BULB.R} Ω = ${f(bulbI ** 2 * M.BULB.R, 1)} W</td></tr>
        <tr><td>Δ<i>V</i>²/<i>R</i></td><td>(${M.BULB.E} V)² / ${M.BULB.R} Ω = ${f(M.BULB.E ** 2 / M.BULB.R, 1)} W</td></tr>
      </table>
      <p>Energy <i>E</i> = <i>Pt</i>: ${f(bulbP * M.BULB.run, 0)} J every ${M.BULB.run} s.</p>
      <div class="charts">${chart({ ...R.energy, xlabel: 'time (s)', ylabel: 'energy (J)', cursors: ['energy'], label: 'Energy delivered against time: a straight line of slope P', series: [{ pts: [[0, 0], [M.BULB.run, bulbP * M.BULB.run]], tag: [5.2, 25, 'slope P = 6 W'] }] })}</div>
      <p class="hintline">Click the bulb to lift off the glass.</p>`,
    cam: { target: [STATIONS.power, 0.25, 0.05], az: -14, el: 42, dist: 12.5 }, lit: 'bulb', scene: 'bulb', look: {},
    fig: 'Six watts of heat and light',
  },
  {
    levels: ['senior'],
    kicker: '13.4', title: 'Emf', sub: 'a real battery',
    body: `
      <p class="lede">The <b>emf</b> ℰ is the energy a battery’s chemistry gives each coulomb. Not a force, despite the name.</p>
      <p>A real battery has an <b>internal resistance</b> <i>r</i>, and the current loses <i>Ir</i> inside it:</p>
      <div class="eq">Δ<i>V</i><sub>terminal</sub> = ℰ − <i>Ir</i>,  <i>I</i> = ℰ/(<i>R</i> + <i>r</i>)</div>
      <p>Here ℰ = ${M.CELL.E} V, <i>r</i> = ${M.CELL.r} Ω, and the bulb’s <i>R</i> sweeps ${M.CELL.Rmin}–${M.CELL.Rmax} Ω. More current, lower terminal voltage, and <i>I</i>²<i>r</i> heats the battery. The bulb gets ℰ²<i>R</i>/(<i>R</i> + <i>r</i>)²; d<i>P</i>/d<i>R</i> = 0 at <i>R</i> = <i>r</i>, where it is brightest: ℰ²/4<i>r</i> = ${f(M.CELL.E ** 2 / (4 * M.CELL.r), 0)} W.</p>
      <div class="charts">${chart({ ...R.pload, xlabel: 'load R (Ω)', ylabel: 'power to the bulb (W)', cursors: ['pload'], vlines: [[M.CELL.r, 'r']], label: 'Load power against load resistance, peaking at R = r',
        series: [{ pts: curve(M.loadP, 0, 8) }] })}</div>
      <p class="hintline">Click the battery to open it. ${heightNote}</p>`,
    cam: { target: [STATIONS.cell, 0.2, 0.05], az: -14, el: 42, dist: 14 }, lit: 'cell', scene: 'cell', look: {},
    fig: 'Emf 12 V, internal resistance 2 Ω',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '13.5', title: 'Series and parallel', sub: 'one path, or side by side',
    body: `
      <p class="lede">In <b>series</b> the current has one path, so it is the same through each resistor and the voltages add. In <b>parallel</b> every branch spans the same two points, so the voltage is the same and the currents add.</p>
      <div class="eq"><i>R</i><sub>s</sub> = <i>R</i><sub>1</sub> + <i>R</i><sub>2</sub>,  1/<i>R</i><sub>p</sub> = 1/<i>R</i><sub>1</sub> + 1/<i>R</i><sub>2</sub> + …</div>
      <table class="data cols">
        <tr><th>series, 9 V</th><th>parallel, 9 V</th></tr>
        <tr><td><i>R</i><sub>eq</sub> = 2 + 4 = 6 Ω</td><td><i>R</i><sub>eq</sub> = ${f(M.parallelR([2, 4, 6]), 3)} Ω</td></tr>
        <tr><td><i>I</i> = 9/6 = 1.5 A</td><td><i>I</i><sub>1</sub> = 9/2 = 4.5 A</td></tr>
        <tr><td>Δ<i>V</i><sub>1</sub> = 1.5 × 2 = 3 V</td><td><i>I</i><sub>2</sub> = 9/4 = 2.25 A</td></tr>
        <tr><td>Δ<i>V</i><sub>2</sub> = 1.5 × 4 = 6 V</td><td><i>I</i><sub>3</sub> = 9/6 = 1.5 A</td></tr>
        <tr><td>3 + 6 = 9 V ✓</td><td><i>I</i> = 8.25 A ✓</td></tr>
      </table>
      <p>More in series raises <i>R</i><sub>eq</sub>; more in parallel lowers it, below the smallest branch. In parallel the dots speed up along the rails, where the branch currents gather.</p>
      <p class="hintline">Click either circuit to raise it. Dot speed ∝ current (${f(K_DOT.parallel / K_DOT.series, 1)}× as fast per amp in parallel).</p>`,
    cam: { target: [STATIONS.sp + 0.07, 0.1, 0.1], az: -5, el: 50, dist: 20.5 }, lit: null, scene: 'sp', look: {},
    fig: '2 Ω and 4 Ω; 2, 4 and 6 Ω',
  },
  {
    levels: ['senior'],
    kicker: '13.6', title: 'Combinations', sub: 'reduce, then work back',
    body: `
      <p class="lede">A circuit of series and parallel pieces reduces, step by step, to one equivalent resistor. Then work backwards for each voltage and current.</p>
      <ol class="rules">
        <li>R<sub>2</sub>, R<sub>4</sub>, R<sub>5</sub> carry one current: in series, 4 + 2 + 2 = ${M.COMBO.R245} Ω.</li>
        <li>R<sub>3</sub> and that ${M.COMBO.R245} Ω span the same two points: in parallel, 1/(½ + ⅛) = ${f(M.COMBO.R2345, 1)} Ω.</li>
        <li>R<sub>1</sub> in series with it: <i>R</i><sub>eq</sub> = 2 + ${f(M.COMBO.R2345, 1)} = ${f(M.COMBO.Req, 1)} Ω, so <i>I</i> = 9/${f(M.COMBO.Req, 1)} = ${f(9 / M.COMBO.Req, 1)} A.</li>
      </ol>
      <table class="data">
        <tr><th>back out</th><th>Δ<i>V</i></th><th><i>I</i></th></tr>
        <tr><td>R<sub>1</sub></td><td>2.5 × 2 = 5 V</td><td>2.5 A</td></tr>
        <tr><td>R<sub>3</sub> (parallel part)</td><td>9 − 5 = 4 V</td><td>4/2 = 2.0 A</td></tr>
        <tr><td>R<sub>2</sub>, R<sub>4</sub>, R<sub>5</sub></td><td>2, 1, 1 V</td><td>4/8 = 0.5 A</td></tr>
      </table>
      <p>Every stage draws the same 2.5 A: that is what “equivalent” means. (The organizer writes R<sub>245</sub> = 10 Ω and 3.667 Ω; as labelled, 4 + 2 + 2 = 8 Ω.)</p>
      <p class="hintline">Click the full circuit (1) to raise it.</p>`,
    cam: { target: [STATIONS.combo, 0.1, 0.15], az: -4, el: 56, dist: 27 }, lit: 'combo', scene: 'combo', look: {},
    fig: 'Five resistors to one',
  },
  {
    levels: ['senior'],
    kicker: '13.7', title: 'Kirchhoff’s rules', sub: 'charge and energy, kept',
    body: `
      <p class="lede">Two batteries in different branches don’t reduce to one resistor. Kirchhoff’s two rules always work.</p>
      <ul class="rules"><li><b>Junction rule</b> (charge is conserved): in = out. At A, <i>I</i><sub>1</sub> = <i>I</i><sub>2</sub> + <i>I</i><sub>3</sub>.</li>
        <li><b>Loop rule</b> (energy is conserved): ΣΔ<i>V</i> = 0 round any loop. With the current through a resistor, −<i>IR</i>; through a battery − to +, +ℰ.</li></ul>
      <div class="eq">1:  −10<i>I</i><sub>1</sub> − 5<i>I</i><sub>2</sub> − 10<i>I</i><sub>1</sub> + 12 = 0</div>
      <div class="eq">2:  −20<i>I</i><sub>3</sub> + 6 − 20<i>I</i><sub>3</sub> + 5<i>I</i><sub>2</sub> = 0</div>
      <p>So <i>I</i><sub>1</sub> = ${f(kI('R1'), 2)} A, <i>I</i><sub>2</sub> = ${f(kI('R5'), 2)} A, <i>I</i><sub>3</sub> = ${f(kI('R3'), 2)} A, the organizer’s answers. They need the 6 V battery’s + end at the bottom, as drawn here. Its sheet draws + on top: then loop 2 has −6 and <i>I</i><sub>3</sub> = ${f(kd.I[2], 3)} A, current the other way.</p>
      <p class="hintline">Click to raise it and walk each loop. ${heightNote}</p>`,
    cam: { target: [STATIONS.kirch, 0.3, 0.1], az: -8, el: 46, dist: 16 }, lit: 'kirch', scene: 'kirch', look: {},
    fig: 'I₁ = I₂ + I₃; ΣΔV = 0 round each loop',
  },
  {
    levels: ['senior'],
    kicker: '13.8', title: 'RC circuits', sub: 'charging and discharging',
    body: `
      <p class="lede">At <b>a</b> the battery charges the capacitor through <i>R</i>; at <b>b</b> the capacitor pushes the current back through <i>R</i> until it is empty.</p>
      <div class="eq">ℰ − <i>IR</i> − <i>q</i>/<i>C</i> = 0, <i>I</i> = d<i>q</i>/d<i>t</i></div><div class="eq"><i>q</i> = ℰ<i>C</i>(1 − e<sup>−<i>t</i>/<i>RC</i></sup>)</div>
      <p>(Separate: ∫d<i>q</i>/(ℰ<i>C</i> − <i>q</i>) = ∫d<i>t</i>/<i>RC</i>.) <i>I</i> = (ℰ/<i>R</i>)e<sup>−<i>t</i>/<i>RC</i></sup>. τ = <i>RC</i> = ${f(RC.tau, 1)} s: after one τ, <i>q</i> is 63.2% of ℰ<i>C</i> = ${f(RC.Qmax * 1e3, 1)} mC and <i>I</i> 36.8% of ℰ/<i>R</i> = ${f(RC.Imax * 1e3, 1)} mA. Discharging, <i>q</i> = <i>Q</i><sub>max</sub>e<sup>−<i>t</i>/<i>RC</i></sup>.</p>
      <p>Empty, a capacitor acts as a wire; full, as a break. Of the battery’s <i>Q</i>ℰ = ${f(RC.Qmax * RC.E * 1e3, 1)} mJ, half is stored, half is heat.</p>
      <div class="charts">${chart({ ...R.rc, xlabel: 'time (s)', ylabel: '% of max', cursors: ['rcq', 'rci'], vlines: [[RC.tau, 'τ'], [RC.Tch, 'b'], [RC.Tch + RC.tau, 'τ']],
        label: 'Charge and current against time while charging and discharging',
        series: [{ cls: 'zero', pts: [[0, 0], [RC.cycle, 0]] }, { pts: curve(t => 100 * M.rc(t).Q / RC.Qmax, 0, RC.cycle - 1e-6, 400), tag: [3.5, 92, 'q'] },
          { cls: 'curve total', pts: curve(t => 100 * M.rc(t).I / RC.Imax, 0, RC.cycle - 1e-6, 400), tag: [3.4, 14, 'I'] }],
        marks: [[RC.tau, 63.2, '63.2%'], [RC.tau, 36.8, '36.8%', 6, -6]] })}</div>
      <p class="hintline">Click to raise it: Δ<i>V</i><sub>R</sub> shrinks as Δ<i>V</i><sub>C</sub> grows.</p>`,
    cam: { target: [STATIONS.rc, 0.25, 0.1], az: -10, el: 44, dist: 15 }, lit: 'rc', scene: 'rc', look: {},
    fig: '20 kΩ, 100 µF: τ = 2.0 s',
  },
];

// ---------- click a scene: what it breaks into ----------
const vC = n => n.toFixed(2);
export const PLATES = {
  wire: { text: `The blue slab is the wire between <i>A</i> and a distance Δ<i>x</i> = <i>v</i><sub>d</sub>Δ<i>t</i> upstream. Every electron in it crosses <i>A</i> within Δ<i>t</i>, so the charge through <i>A</i> is <i>nqA</i>Δ<i>x</i> and the current is <i>nqAv</i><sub>d</sub>.`,
    facts: () => { const dx = 1.5 / MAG, dt = dx / CU.vd, Q = CU.n * M.E_CH * CU.A * dx; return [['slab length Δx', `${f(dx * 1e3, 2)} mm (drawn 1.5 units)`], ['time to cross Δt = Δx/v_d', `${f(dt, 1)} s`], ['charge in it nqAΔx', `${f(Q, 1)} C`], ['I = Q/Δt', `${f(Q / dt, 2)} A`], ['time between collisions', `${f(CU.tauC * 1e15, 0)} fs`]]; } },
  wires: { text: `The thick wire comes apart into four thin strands, each just like the thin wire. Four equal paths side by side carry four times the current at the same voltage: a quarter of the resistance.`,
    facts: s => { const L = M.resLength(s.clock); return [['length L', `${f(L)} m`], ['thin: R = ρL/A', `${f(M.rThin(L))} Ω, I ${f(1.5 / M.rThin(L))} A`], ['thick: R/4', `${f(M.rThick(L))} Ω, I ${f(1.5 / M.rThick(L))} A`], ['ρ (nichrome)', `${sci(M.RES.rho, 2)} Ω·m`]]; } },
  ohm: { text: `Blue arrows: the field in the resistor, pointing down the slope. In the ideal wires there is no slope, so no field is needed: zero resistance, zero voltage. The whole ${M.OHM.E} V is spent across the resistor.`,
    facts: () => [['battery rise', `+${M.OHM.E} V`], ['wires', '0 V'], ['resistor drop IR', `−${f(ohmI * M.OHM.R, 1)} V`], ['current', `${f(ohmI, 1)} A`], ['round the loop', '0 V']] },
  bulb: { text: `Under the glass is a coil of thin tungsten wire: a resistor that gets hot enough to glow. The bulb is nothing more than ${M.BULB.R} Ω in the circuit.`,
    facts: s => { const t = s.clock % M.BULB.run; return [['P = IΔV', `${f(bulbP, 1)} W`], ['P = I²R', `${f(bulbI ** 2 * M.BULB.R, 1)} W`], ['P = ΔV²/R', `${f(M.BULB.E ** 2 / M.BULB.R, 1)} W`], ['energy so far E = Pt', `${f(bulbP * t, 1)} J`]]; } },
  cell: { text: `Inside: an ideal ${M.CELL.E} V emf and a ${M.CELL.r} Ω resistor in series. Raised, the battery lifts the charge ${M.CELL.E} V and the internal resistor takes <i>Ir</i> back before the terminal.`,
    facts: s => { const R = M.cellLoad(s.clock), I = M.cellI(R); return [['load R', `${f(R)} Ω`], ['current I = ℰ/(R + r)', `${f(I)} A`], ['lost inside Ir', `${f(I * M.CELL.r)} V`], ['terminal ΔV = ℰ − Ir', `${f(M.terminalV(I))} V`], ['bulb power', `${f(M.loadP(R))} W`], ['wasted inside I²r', `${f(I * I * M.CELL.r)} W`]]; } },
  series: { text: `Raised, the battery lifts 9 V and the current walks down two ramps in turn: 3 V down the 2 Ω, 6 V down the 4 Ω. Bigger resistor, bigger share of the voltage.`,
    facts: () => [['R_eq', '6 Ω'], ['I (everywhere)', '1.5 A'], ['ΔV₁', '3.0 V'], ['ΔV₂', '6.0 V'], ['sum', '9.0 V']] },
  parallel: { text: `Raised, the left rail sits at 9 V and the right at 0 V, so every branch drops the full 9 V. Each takes its own current, ΔV/R; the rails carry the sum.`,
    facts: () => [['ΔV on each branch', '9.0 V'], ['I₁ (2 Ω)', '4.50 A'], ['I₂ (4 Ω)', '2.25 A'], ['I₃ (6 Ω)', '1.50 A'], ['battery', '8.25 A'], ['R_eq', `${f(M.parallelR([2, 4, 6]), 3)} Ω`]] },
  combo: { text: `Raised: 5 V down R<sub>1</sub>, then the remaining 4 V two ways at once: all at once down R<sub>3</sub>, or in three steps of 2, 1 and 1 V down R<sub>2</sub>, R<sub>4</sub>, R<sub>5</sub>.`,
    facts: () => [['R_eq', `${f(M.COMBO.Req, 1)} Ω`], ['battery current', '2.5 A'], ['across R₁', '5.0 V'], ['across R₃', '4.0 V, 2.0 A'], ['R₂, R₄, R₅', '2.0, 1.0, 1.0 V at 0.5 A']] },
  kirch: { text: `Raised, each point at its potential. The blue ball walks loop 1, then loop 2, adding up every rise and drop. It always comes back to where it started: ΣΔV = 0.`,
    facts: s => [['V at A', `${f(kr.V.a)} V`], ['V at B', `${f(kr.V.b)} V`], ['I₁ = I₂ + I₃', `${f(kI('R1'), 3)} = ${f(kI('R5'), 3)} + ${f(kI('R3'), 3)} A`], ['walking loop', `${s.walk.loop}`], ['ΣΔV so far', `${f(s.walk.sum)} V`]] },
  rc: { text: `Raised: the battery lifts 12 V; the resistor’s ramp is <i>IR</i>, the capacitor’s step is <i>q</i>/<i>C</i>. Charging, the resistor’s share shrinks as the capacitor’s grows; they always add to 12 V. Discharging, the battery is cut out and the capacitor’s step drives the current back.`,
    facts: s => { const r = s.rc; return [['switch', r.charging ? 'a: charging' : 'b: discharging'], ['t since switching', `${f(r.s, 1)} s = ${f(r.s / RC.tau, 2)} τ`], ['q', `${vC(r.Q * 1e3)} mC (${f(100 * r.Q / RC.Qmax, 1)}%)`], ['I', `${f(r.I * 1e3, 3)} mA`], ['ΔV_R', `${f(Math.abs(r.VR))} V`], ['ΔV_C', `${f(r.Vc)} V`], ['stored q²/2C', `${f(r.Q ** 2 / (2 * RC.C) * 1e3)} mJ`]]; } },
};
