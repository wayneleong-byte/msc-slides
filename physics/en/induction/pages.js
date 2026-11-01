// Chapter 15, page by page (after the AP Physics C E&M organizer, Unit 8). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS as ST } from './world.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const GREY = '#86868c';

// ---------- small SVG charts for the left page: two quantities, one axis each side ----------
const W = 420, HH = 160, P = { l: 44, r: 44, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (HH - P.t - P.b) };
function chart({ L, Rt, series, xlabel, ylabel, rlabel, marks = [], cursors = [], label, under = '' }) {
  const { x0, x1 } = L, sx = x => CH.sx(x, x0, x1), sy = (y, a = L) => CH.sy(y, a.y0, a.y1);
  const paths = series.map(s => { const a = s.r ? Rt : L, c = s.r ? GREY : null;
    return `<path class="curve"${c ? ` style="stroke:${c}"` : ''} d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y, a).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1], a) - 6}"${c ? ` style="fill:${c}"` : ''}>${s.tag[2]}</text>` : ''); }).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const zero = L.y0 < 0 ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${HH}" role="img" aria-label="${label}">
    ${under}<rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${HH - P.t - P.b}"/>${zero}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(L.y1) + 4}" text-anchor="end">${L.y1}</text><text class="ax" x="${P.l - 6}" y="${sy(L.y0) + 4}" text-anchor="end">${L.y0}</text>
    <text class="ax" x="${W - P.r + 6}" y="${sy(Rt.y1, Rt) + 4}" style="fill:${GREY}">${Rt.y1}</text><text class="ax" x="${W - P.r + 6}" y="${sy(Rt.y0, Rt) + 4}" style="fill:${GREY}">${Rt.y0}</text>
    <text class="ax" x="${P.l}" y="${HH - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${HH - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="lab" x="${W - P.r - 6}" y="${P.t + 13}" text-anchor="end" style="fill:${GREY}">${rlabel}</text>
    <text class="ax" x="${(P.l + W - P.r) / 2}" y="${HH - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(([key, r]) => `<circle class="cursor" r="4.5" data-cursor="${key}"${r ? ` style="fill:${GREY}"` : ''}/>`).join('')}
  </svg>`;
}
const samples = (n, a, b, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });

// chart ranges (left and right axes), shared with the live cursors in main.js
export const R = {
  phi0: { x0: 0, x1: 6, y0: -40, y1: 40 }, emf0: { x0: 0, x1: 6, y0: -45, y1: 45 },
  i1: { x0: 0, x1: 6, y0: -2, y1: 2 }, emf2: { x0: 0, x1: 6, y0: -0.3, y1: 0.3 },
  phiW: { x0: 0, x1: 3, y0: 0, y1: 1.5 }, emfW: { x0: 0, x1: 3, y0: 0, y1: 2 },
  phiX: { x0: 0, x1: 2, y0: -40, y1: 40 }, emfX: { x0: 0, x1: 2, y0: -60, y1: 60 },
  v: { x0: 0, x1: 5, y0: 0, y1: 1 }, pw: { x0: 0, x1: 5, y0: 0, y1: 0.2 },
  iS: { x0: 0, x1: 4, y0: -2, y1: 2 }, eS: { x0: 0, x1: 4, y0: -6, y1: 6 },
  iRL: { x0: 0, x1: 8, y0: -3, y1: 3 }, vRL: { x0: 0, x1: 8, y0: -12, y1: 12 },
  qLC: { x0: 0, x1: +(2 * M.LC.T * 1e3).toFixed(2), y0: -100, y1: 100 }, iLC: { x0: 0, x1: +(2 * M.LC.T * 1e3).toFixed(2), y0: -100, y1: 100 },
};
// live energy bars (the LC circuit): heights set in main.js, full height = the total Q²/2C
export const BARS = { x: 90, w: 56, gap: 50, base: 112, top: 16 };
const barChart = (key, items, top) => `<svg class="chart" viewBox="0 0 ${W} ${BARS.base + 26}" role="img" aria-label="Energy bar chart, live">
  <line class="zero" x1="${BARS.x - 20}" x2="${BARS.x + items.length * (BARS.w + BARS.gap) - BARS.gap + 20}" y1="${BARS.base}" y2="${BARS.base}"/>
  <line class="grid" x1="${BARS.x - 20}" x2="${BARS.x + items.length * (BARS.w + BARS.gap) - BARS.gap + 20}" y1="${BARS.top}" y2="${BARS.top}" style="stroke:#d4d4d0;stroke-dasharray:3 3"/>
  <text class="ax" x="${BARS.x - 26}" y="${BARS.top + 4}" text-anchor="end">${top}</text><text class="ax" x="${BARS.x - 26}" y="${BARS.base + 4}" text-anchor="end">0</text>
  ${items.map(([k, name, color], i) => `<rect data-bar="${key}-${k}" x="${BARS.x + i * (BARS.w + BARS.gap)}" width="${BARS.w}" y="${BARS.base}" height="0" style="fill:${color};stroke:#6c6c72;stroke-width:.8"/>
    <text class="lab" x="${BARS.x + i * (BARS.w + BARS.gap) + BARS.w / 2}" y="${BARS.base + 18}" text-anchor="middle">${name}</text>
    <text class="ax" data-val="${key}-${k}" x="${BARS.x + i * (BARS.w + BARS.gap) + BARS.w / 2}" y="${BARS.base - 6}" text-anchor="middle"></text>`).join('')}
</svg>`;
const sq = k => `one grid square = ${k}`;
const two = (l, r, o) => `<div class="charts">${chart({ L: R[l], Rt: R[r], cursors: [[l], [r, 1]], ...o })}</div>`;

// Lenz's four cases, from the model at mid-run
const lenzRows = M.CASES.map(c => {
  const r = M.lenzCase(c, M.LENZ.run * 0.6), Bdir = r.Bx < 0 ? '←' : '→', grows = c.move === 'in';
  return `<tr><td>${c.name}</td><td>${Bdir} ${grows ? 'growing' : 'shrinking'}</td><td>${f(r.emf * 1e6, 1)} µV</td><td>${r.emf > 0 ? '←' : '→'}</td></tr>`;
}).join('');
const steps = rows => `<table class="data eqs">${rows.map(([e, n]) => `<tr><td>${e}</td><td>${n}</td></tr>`).join('')}</table>`;

export const PAGES = [
  {
    levels: ['senior'],
    kicker: 'Chapter 15', title: 'Induction', sub: 'changing flux makes an emf',
    body: `
      <p class="lede">Currents make magnetic fields. Faraday found the reverse: a <b>changing</b> magnetic flux through a loop drives a current around it.</p>
      <div class="eq">Φ<sub><i>B</i></sub> = ∫<i>B</i>·<i>dA</i> &nbsp;&nbsp; ε = −<i>d</i>Φ<sub><i>B</i></sub>/<i>dt</i></div>
      <p>Flux is the field summed over a surface spanning the loop, in webers (T·m²); <i>N</i> turns give ε = −<i>N d</i>Φ/<i>dt</i>. The emf is ∮<i>E</i>·<i>ds</i> of an <b>induced electric field</b> that has no start or end: it is not conservative. Here a magnet comes to a loop and leaves; ε is the negative slope of Φ.</p>
      ${two('phi0', 'emf0', { xlabel: 't (s)', ylabel: 'Φ (µWb)', rlabel: 'ε (µV)', label: 'Flux through the loop and the emf, against time',
        series: [{ pts: samples(160, 0, 6, t => M.fluxScene(t).Phi * 1e6) }, { r: 1, pts: samples(160, 0, 6, t => M.fluxScene(t).emf * 1e6) }] })}
      <p class="hintline">Click the loop for B·dA patch by patch. 1 m = 10 squares; ${sq('5 mA')}.</p>`,
    cam: { target: [ST.flux + 1.0, 1.7, 0], az: 30, el: 12, dist: 13 }, lit: 'flux', scene: 'flux', look: {},
    fig: 'A magnet in and out of a loop',
  },
  {
    levels: ['senior'],
    kicker: '15.1', title: 'Lenz’s law', sub: 'the current opposes the change',
    body: `
      <p class="lede">The minus sign: the induced current makes a field <i>B</i><sub>ind</sub> that <b>opposes the change</b> in flux, not the flux itself.</p>
      <table class="data"><tr><th>case</th><th>B at the loop</th><th>ε</th><th>B<sub>ind</sub></th></tr>${lenzRows}</table>
      <ul class="rules">
        <li>flux growing: <i>B</i><sub>ind</sub> points against <i>B</i>;</li>
        <li>flux shrinking: <i>B</i><sub>ind</sub> points with <i>B</i>;</li>
        <li>the right-hand rule turns <i>B</i><sub>ind</sub> into <i>I</i>.</li>
      </ul>
      <p>It is energy conservation: the loop repels an approaching pole and pulls back a leaving one, so making the current takes work. In solid metal the same braking makes <b>eddy currents</b>, which heat it. Area vector to the left: Φ > 0 when <i>B</i> points left.</p>
      <p class="hintline">Click a loop for its own field, dashed. <i>I</i> and dashed arrows show direction only; ${sq('10 mT')}.</p>`,
    cam: { target: [ST.lenz - 0.35, 2.1, 0], az: 26, el: 8, dist: 21 }, lit: 'nIn', scene: 'lenz', look: {},
    fig: 'N or S, approaching or leaving',
  },
  {
    levels: ['senior'],
    kicker: '15.2', title: 'Mutual induction', sub: 'one current, another’s emf',
    body: `
      <p class="lede">A changing current in coil 1 changes its field through coil 2. That flux is proportional to <i>I</i><sub>1</sub>, so</p>
      <div class="eq">ε<sub>2</sub> = −<i>N</i><sub>2</sub><i>d</i>Φ<sub>2</sub>/<i>dt</i> = −<i>M dI</i><sub>1</sub>/<i>dt</i></div>
      <p>The <b>mutual inductance</b> <i>M</i> is geometry: ${f(M.COILS.M * 1e6, 0)} µH for these 100-turn coils. On an <b>iron core</b> the iron carries the flux through both windings, μ<sub>r</sub> ≈ ${M.CORE.muR} times stronger: <i>M</i> = ${f(M.CORE.M * 1e3, 0)} mH. As <i>I</i>(<i>t</i>) rises, <i>B</i>(<i>t</i>) grows left and <i>B</i><sub>ind</sub> points right.</p>
      ${two('i1', 'emf2', { xlabel: 't (s)', ylabel: 'I₁ (A)', rlabel: 'ε₂ (mV)', label: 'Current in coil 1 and emf in coil 2 against time',
        series: [{ pts: samples(120, 0, 6, t => M.coilsScene(t).I1) }, { r: 1, pts: samples(120, 0, 6, t => M.coilsScene(t).emf * 1e3) }] })}
      <p class="hintline">Click either. ${sq('4 A')} in coil 1, 0.5 mA in coil 2, 0.25 T in the iron.</p>`,
    cam: { target: [ST.mutual, 1.95, 0], az: 26, el: 10, dist: 13.5 }, lit: 'mutual', scene: 'mutual', look: {},
    fig: 'Two coils; an iron core',
  },
  {
    levels: ['senior'],
    kicker: '15.3', title: 'Leaving a wire', sub: 'into weaker field',
    body: `
      <p class="lede">A ${M.WIRE.b * 100} × ${M.WIRE.a * 100} cm loop moves away from a wire carrying ${M.WIRE.I} A at ${M.WIRE.v * 100} cm/s. <i>B</i> = μ<sub>0</sub><i>I</i>/2π<i>r</i> varies, so sum it in strips:</p>
      ${steps([
        ['Φ = ∫<sub><i>r</i></sub><sup><i>r</i>+<i>a</i></sup> (μ<sub>0</sub><i>I</i>/2π<i>s</i>) <i>b ds</i>', 'strips'],
        ['&nbsp;&nbsp;&nbsp;= (μ<sub>0</sub><i>Ib</i>/2π) ln((<i>r</i> + <i>a</i>)/<i>r</i>)', ''],
        ['ε = μ<sub>0</sub><i>Iabv</i> / 2π<i>r</i>(<i>r</i> + <i>a</i>)', '−<i>d</i>Φ/<i>dt</i>'],
      ])}
      <p>Below the wire <i>B</i> points into the page and shrinks, so the current runs clockwise, adding field into the page.</p>
      ${two('phiW', 'emfW', { xlabel: 't (s)', ylabel: 'Φ (µWb)', rlabel: 'ε (µV)', label: 'Flux and emf against time',
        series: [{ pts: samples(90, 0, 3, t => M.wireScene(t).Phi * 1e6) }, { r: 1, pts: samples(90, 0, 2.999, t => M.wireScene(t).emf * 1e6) }] })}
      <p class="hintline">Click the loop for its strips. ⊗ area ∝ <i>B</i>. ${sq('0.4 mA')}.</p>`,
    cam: { target: [ST.wire - 0.3, 2.2, 0], az: 6, el: 6, dist: 17 }, lit: 'wire', scene: 'wire', look: {},
    fig: 'Long wire, loop moving away',
  },
  {
    levels: ['senior'],
    kicker: '15.4', title: 'Motional emf', sub: 'a bar moving through a field',
    body: `
      <p class="lede">A metal bar moves at <i>v</i> through <i>B</i>. Each charge in it moves too, and feels <i>F</i> = <i>qv</i>×<i>B</i> along the bar.</p>
      <p>Free charge slides until + piles at one end and − at the other. Their field <i>E</i> pushes back; charge stops moving when</p>
      <div class="eq"><i>qE</i> = <i>qvB</i> &nbsp;→&nbsp; ε = <i>EL</i> = <i>BLv</i></div>
      <table class="data">
        <tr><td><i>B</i>, <i>L</i>, <i>v</i></td><td>${M.BAR.B} T, ${M.BAR.L * 100} cm, ${M.BAR.v} m/s</td></tr>
        <tr><td><i>E</i> = <i>vB</i></td><td>${f(M.BAR.E, 2)} V/m</td></tr>
        <tr><td>ε = <i>BLv</i></td><td>${f(M.BAR.emf, 2)} V</td></tr>
      </table>
      <p>Nothing closes the circuit, so once the charges have separated <b>no current flows</b>. Stop the bar and they spread out again.</p>
      <p class="hintline">Click the bar for one charge’s two forces. 1 m = 4 squares; ${sq('0.25 V/m')}.</p>`,
    cam: { target: [ST.bar, 1.75, 0], az: 8, el: 6, dist: 15 }, lit: 'bar', scene: 'bar', look: {},
    fig: 'A bar at 0.5 m/s through 0.4 T',
  },
  {
    levels: ['senior'],
    kicker: '15.5', title: 'Through a field', sub: 'only the edges count',
    body: `
      <p class="lede">A ${M.CROSS.w * 100} × ${M.CROSS.h * 100} cm loop crosses a ${M.CROSS.W * 100} cm region of ${M.CROSS.B} T at ${M.CROSS.v} m/s.</p>
      <table class="data">
        <tr><th>stage</th><th>Φ</th><th>ε</th></tr>
        <tr><td>entering</td><td>grows</td><td>−<i>Bhv</i> = −${f(M.CROSS.B * M.CROSS.h * M.CROSS.v * 1e3, 0)} mV</td></tr>
        <tr><td>all inside</td><td>constant <i>Bhw</i></td><td>0</td></tr>
        <tr><td>leaving</td><td>shrinks</td><td>+${f(M.CROSS.B * M.CROSS.h * M.CROSS.v * 1e3, 0)} mV</td></tr>
      </table>
      <p>In a uniform field both upright sides carry <i>BLv</i>, pushing the same way; around the loop they cancel. Current flows only while one side is in and the other out: ${f(M.CROSS.B * M.CROSS.h * M.CROSS.v / M.CROSS.R * 1e3, 0)} mA through ${M.CROSS.R} Ω.</p>
      ${two('phiX', 'emfX', { xlabel: 't (s)', ylabel: 'Φ (mWb)', rlabel: 'ε (mV)', label: 'Flux and emf against time',
        series: [{ pts: samples(200, 0, 2, t => M.crossScene(t).Phi * 1e3) }, { r: 1, pts: samples(400, 0, 1.999, t => M.crossScene(t).emf * 1e3) }] })}
      <p class="hintline">Click the loop for each side’s push. ${sq('0.2 A')}.</p>`,
    cam: { target: [ST.crossing, 1.75, 0], az: 6, el: 6, dist: 15 }, lit: 'crossing', scene: 'crossing', look: {},
    fig: 'In, through, out',
  },
  {
    levels: ['senior'],
    kicker: '15.6', title: 'A bar on rails', sub: 'motional emf with a circuit',
    body: `
      <p class="lede">Rails joined by a resistor close the circuit. The bar is given ${M.RAIL.v0} m/s and let go.</p>
      ${steps([
        ['Φ = <i>BLx</i>, &nbsp;ε = <i>BLv</i>, &nbsp;<i>I</i> = <i>BLv</i>/<i>R</i>', 'counterclockwise'],
        ['<i>F</i> = <i>ILB</i> = <i>B</i><sup>2</sup><i>L</i><sup>2</sup><i>v</i>/<i>R</i>', 'backward'],
        ['<i>v</i> = <i>v</i><sub>0</sub><i>e</i><sup>−<i>t</i>/τ</sup>, &nbsp;τ = <i>mR</i>/<i>B</i><sup>2</sup><i>L</i><sup>2</sup>', `${f(M.RAIL.tau, 1)} s`],
      ])}
      <p>The brake grows with speed, so the bar slows exponentially and coasts ${f(M.RAIL.v0 * M.RAIL.tau * 100, 0)} cm. The power it takes, <i>Fv</i>, is exactly <i>I</i><sup>2</sup><i>R</i>: all ${f(0.5 * M.RAIL.m * M.RAIL.v0 ** 2 * 1e3, 0)} mJ of kinetic energy ends as heat.</p>
      ${two('v', 'pw', { xlabel: 't (s)', ylabel: 'v (m/s)', rlabel: 'P = I²R (W)', label: 'Speed of the bar and power dissipated against time; the shaded area is the heat',
        under: `<path data-area="pw" style="fill:#e4e4e8"/>`, series: [{ pts: samples(100, 0, 5, t => M.railScene(t).v) }, { r: 1, pts: samples(100, 0, 5, t => M.railScene(t).P) }], marks: [[M.RAIL.tau, M.RAIL.v0 / Math.E, 'v₀/e at τ']] })}
      <p class="live" id="raillive"></p>
      <p class="hintline">Click the circuit. ${sq('2 A')}, or 0.25 N.</p>`,
    cam: { target: [ST.rails, 1.7, 0], az: 6, el: 7, dist: 15.5 }, lit: 'rails', scene: 'rails', look: {},
    fig: 'Braked by its own current',
  },
  {
    levels: ['senior'],
    kicker: '15.7', title: 'Inductance', sub: 'a coil fights its own change',
    body: `
      <p class="lede">A coil’s current makes flux through its own turns. Change the current and the flux changes, inducing a <b>back emf</b> that opposes the change.</p>
      ${steps([
        ['<i>L</i> = <i>N</i>Φ/<i>I</i>, &nbsp;ε<sub><i>L</i></sub> = −<i>L dI</i>/<i>dt</i>', 'henries, H'],
        ['<i>B</i> = μ<sub>0</sub><i>nI</i> → <i>L</i> = μ<sub>0</sub><i>N</i><sup>2</sup><i>A</i>/ℓ', `${f(M.SOL.L * 1e3, 2)} mH`],
        ['<i>U</i> = ½<i>LI</i><sup>2</sup>, &nbsp;<i>u</i> = <i>B</i><sup>2</sup>/2μ<sub>0</sub>', 'stored'],
      ])}
      <p>${M.SOL.N} turns on ${M.SOL.len * 100} cm, radius ${M.SOL.r * 100} cm (μ<sub>0</sub><i>nI</i> is ${f((1 - M.solCentreB(1) / (M.MU0 * M.SOL.n)) * 100, 0)} % high for a coil this short). Ramping 0 → ${M.SOL.Imax} A in ${M.SOL.ramp} s gives ε<sub><i>L</i></sub> = ${f(-M.SOL.L * M.SOL.Imax / M.SOL.ramp * 1e3, 2)} mV; a steady current, none. Inductors smooth out sudden jumps.</p>
      ${two('iS', 'eS', { xlabel: 't (s)', ylabel: 'I (A)', rlabel: 'ε_L (mV)', label: 'Current and back emf against time',
        series: [{ pts: samples(200, 0, 4, t => M.solCurrent(t).I) }, { r: 1, pts: samples(400, 0, 3.999, t => M.solScene(t).emfL * 1e3) }] })}
      <p class="hintline">25 of 400 turns drawn. Click for one turn’s flux. ${sq('5 mT')}.</p>`,
    cam: { target: [ST.solenoid, 1.85, 0], az: 22, el: 12, dist: 11.5 }, lit: 'solenoid', scene: 'solenoid', look: {},
    fig: 'A solenoid, current ramped',
  },
  {
    levels: ['senior'],
    kicker: '15.8', title: 'RL circuits', sub: 'growth and decay, τ = L/R',
    body: `
      <p class="lede">${M.RL.E} V, ${M.RL.R} Ω, ${M.RL.L} H. Around the loop ε − <i>IR</i> − <i>L dI</i>/<i>dt</i> = 0, so</p>
      <div class="eq"><i>I</i> = (ε/<i>R</i>)(1 − <i>e</i><sup>−<i>t</i>/τ</sup>), &nbsp;τ = <i>L</i>/<i>R</i></div>
      <p>At first the inductor is an <b>open switch</b>: <i>I</i> = 0, all ${M.RL.E} V across it. Later it is <b>a plain wire</b>: <i>I</i> = ε/<i>R</i> = ${f(M.RL.Imax, 0)} A. Take the battery out and it keeps the current going, <i>I</i><sub>0</sub><i>e</i><sup>−<i>t</i>/τ</sup>, while ½<i>LI</i><sup>2</sup> = ${f(0.5 * M.RL.L * M.RL.Imax ** 2, 0)} J becomes heat. τ = ${f(M.RL.tau, 1)} s.</p>
      ${two('iRL', 'vRL', { xlabel: 't (s)', ylabel: 'I (A)', rlabel: 'ΔV (V)', label: 'Current and inductor voltage against time, growth then decay',
        series: [{ pts: samples(320, 0, 7.999, t => M.rlScene(t).I) }, { r: 1, pts: samples(320, 0, 7.999, t => M.rlScene(t).VL), tag: [4.6, -8.5, 'L dI/dt'] }],
        marks: [[M.RL.tau, M.rlScene(M.RL.tau).I, '63 %'], [M.RL.phase + M.RL.tau, M.rlScene(M.RL.phase + M.RL.tau).I, '37 %']] })}
      <p class="hintline">Black: <i>I</i>, and <i>IR</i> on the right scale. Click the circuit for each ΔV. ${sq('4 A')}.</p>`,
    cam: { target: [ST.rl - 0.15, 1.75, 0], az: 8, el: 8, dist: 14 }, lit: 'rl', scene: 'rl', look: {},
    fig: '12 V, 4 Ω, 2 H',
  },
  {
    levels: ['senior'],
    kicker: '15.9', title: 'LC oscillations', sub: 'charge sloshing through a coil',
    body: `
      <p class="lede">Charge a ${f(M.LC.C * 1e6, 0)} µF capacitor to ${f(M.LC.Q * 1e6, 0)} µC and connect it to a ${f(M.LC.L * 1e3, 0)} mH coil. The charge flows off through the coil, overshoots, charges the plates the other way, and flows back.</p>
      ${steps([
        ['<i>q</i>/<i>C</i> + <i>L dI</i>/<i>dt</i> = 0', 'loop rule'],
        ['<i>L d</i><sup>2</sup><i>q</i>/<i>dt</i><sup>2</sup> + <i>q</i>/<i>C</i> = 0', '<i>I</i> = <i>dq</i>/<i>dt</i>'],
        ['<i>q</i> = <i>Q</i> cos ω<i>t</i>, &nbsp;<i>I</i> = −ω<i>Q</i> sin ω<i>t</i>', `ω = 1/√(<i>LC</i>) = ${f(M.LC.w, 0)} rad/s`],
      ])}
      <p>The period is <i>T</i> = 2π√(<i>LC</i>) = ${f(M.LC.T * 1e3, 2)} ms (${f(M.LC.f, 0)} Hz); the figure runs ${Math.round(M.LC.slow / 10) * 10}× slower. The current peaks, ω<i>Q</i> = ${f(M.LC.Imax * 1e3, 0)} mA, as <i>q</i> passes 0, and is zero when the plates are full: a quarter period apart. The coil’s back emf is what carries the current past <i>q</i> = 0.</p>
      ${two('qLC', 'iLC', { xlabel: 't (ms)', ylabel: 'q (µC)', rlabel: 'I (mA)', label: 'Charge on the top plate and current against time',
        series: [{ pts: samples(200, 0, 2 * M.LC.T * 1e3, t => M.lcScene(t * 1e-3).q * 1e6) }, { r: 1, pts: samples(200, 0, 2 * M.LC.T * 1e3, t => M.lcScene(t * 1e-3).I * 1e3) }],
        marks: [[M.LC.T * 1e3, 100, 'T', 6, 14]] })}
      <div class="eq"><i>q</i><sup>2</sup>/2<i>C</i> + ½<i>LI</i><sup>2</sup> = <i>Q</i><sup>2</sup>/2<i>C</i> = ${f(M.LC.U * 1e3, 2)} mJ</div>
      <div class="charts">${barChart('lc', [['UE', 'U_E = q²/2C', '#8fb0f0'], ['UB', 'U_B = ½LI²', '#c4c4c8'], ['U', 'total', '#f7f7f4']], `${f(M.LC.U * 1e3, 2)} mJ`)}</div>
      <table class="data"><tr><th>mass on a spring</th><th>LC circuit</th></tr>
        <tr><td><i>x</i>, &nbsp;<i>v</i></td><td><i>q</i>, &nbsp;<i>I</i></td></tr>
        <tr><td><i>m</i>, &nbsp;<i>k</i></td><td><i>L</i>, &nbsp;1/<i>C</i></td></tr>
        <tr><td>½<i>kx</i><sup>2</sup>, &nbsp;½<i>mv</i><sup>2</sup></td><td><i>q</i><sup>2</sup>/2<i>C</i>, &nbsp;½<i>LI</i><sup>2</sup></td></tr></table>
      <p class="hintline">Click the plates or the coil for the energy each holds. ${sq('10 kV/m (E), 2 mT (B), 100 mA (I)')}.</p>`,
    cam: { target: [ST.lc + 0.3, 1.8, 0], az: 8, el: 8, dist: 12.5 }, lit: 'lcCap', scene: 'lc', look: {},
    fig: '25 µF, 40 mH, 100 µC',
  },
];

// ---------- click a scene: what it breaks into ----------
const lenzPlate = c => ({
  text: c.move === 'in'
    ? `The ${c.pole} pole comes closer, so more of its field threads the loop. The loop answers with a current whose own field (dashed) points the other way through it, and its near face becomes a ${c.pole} pole too: like poles, so the magnet is pushed back.`
    : `The ${c.pole} pole moves away, so less of its field threads the loop. The current now makes a field (dashed) pointing the same way through the loop, to make up the loss; its near face becomes an ${c.pole === 'N' ? 'S' : 'N'} pole and pulls the magnet back.`,
  facts: s => { const r = M.lenzCase(c, s.lenz.t); return [['distance', `${f(r.d * 100, 1)} cm`], ['B at the centre', `${f(Math.abs(r.Bx) * 1e3, 2)} mT ${r.Bx < 0 ? '←' : '→'}`], ['Φ (area vector ←)', `${f(r.Phi * 1e6, 2)} µWb`], ['ε = −dΦ/dt', `${f(r.emf * 1e6, 2)} µV`], ['I = ε/R (R = 10 mΩ)', `${f(r.I * 1e3, 2)} mA`]]; },
});
export const PLATES = {
  flux: { text: `Spread a flat surface across the loop and split it into little patches dA. Over each, B·dA is the field poking straight through times the patch’s area (grey arrows: the component along the loop’s axis). Add them all up and you have Φ. Near the magnet the arrows are long; as it leaves they shrink to almost nothing.`,
    facts: s => { const r = M.fluxScene(s.flux.t); return [['magnet distance', `${f(r.d * 100, 1)} cm`], ['B at the centre', `${f(r.Bc * 1e3, 2)} mT`], ['Φ = ∫B·dA', `${f(r.Phi * 1e6, 2)} µWb`], ['ε = −dΦ/dt', `${f(r.emf * 1e6, 1)} µV`], ['I = ε/R (R = 10 mΩ)', `${f(r.I * 1e3, 2)} mA`]]; } },
  ...Object.fromEntries(M.CASES.map(c => [c.key, lenzPlate(c)])),
  mutual: { text: `Coil 1’s field lines (they fade with its current) thread coil 2. The flux through each of coil 2’s turns is MI₁/N₂. While I₁ rises, coil 2’s current makes a field against it (dashed); while I₁ falls, with it.`,
    facts: s => { const r = M.coilsScene(s.coil.t); return [['I₁', `${f(r.I1, 2)} A`], ['dI₁/dt', `${f(r.dI1, 2)} A/s`], ['M', `${f(M.COILS.M * 1e6, 0)} µH`], ['ε₂ = −M dI₁/dt', `${f(r.emf * 1e3, 3)} mV`], ['I₂ (R = 1 Ω)', `${f(r.I2 * 1e3, 3)} mA`]]; } },
  core: { text: `With the secondary lifted off: the iron guides the flux, so the same Φ = BA runs through every turn of both windings. The secondary’s emf is N₂ times one turn’s, and ε₂/ε₁ = N₂/N₁, which is how a transformer steps voltage.`,
    facts: s => { const r = M.coreScene(s.coil.t); return [['I₁', `${f(r.I1, 3)} A`], ['B = μᵣμ₀N₁I₁/ℓ', `${f(r.B, 3)} T`], ['without iron', `${f(r.Bair * 1e3, 3)} mT`], ['Φ per turn', `${f(r.Phi * 1e6, 1)} µWb`], ['ε₂ = −N₂ dΦ/dt', `${f(r.emf2 * 1e3, 2)} mV`], ['ε₂/ε₁', `${f(r.emf2 / (r.emf1 || 1e-30), 2)}`]]; } },
  wire: { text: `B changes across the loop but not along the wire, so cut the loop into strips parallel to the wire, each b wide and dr tall (shaded by its field). Each holds B(r)·b dr of flux; the integral gives the logarithm. Equivalently, the near side cuts field at B_near bv, the far side at B_far bv, and the difference is ε.`,
    facts: s => { const r = M.wireScene(s.wire.t); return [['r (near side)', `${f(r.r * 100, 1)} cm`], ['B near', `${f(r.Bnear * 1e6, 0)} µT`], ['B far', `${f(r.Bfar * 1e6, 0)} µT`], ['Φ', `${f(r.Phi * 1e6, 3)} µWb`], ['ε = (B_near − B_far)bv', `${f(r.emf * 1e6, 3)} µV`], ['I (R = 10 mΩ)', `${f(r.I * 1e3, 3)} mA`]]; } },
  bar: { text: `One + charge in the bar. The magnetic force qv×B pushes it up the bar; the field E of the charges already piled at the ends pushes it down with qE. Balanced, it moves only with the bar. The work per charge along the bar is vB·L = ε.`,
    facts: s => { const r = M.barScene(s.bar.t, s.bar.resting); return [['v', `${f(r.v, 2)} m/s`], ['qvB (one proton’s charge)', `${(r.Fmag).toExponential(2)} N`], ['qE', `${(M.E_CHARGE * r.E).toExponential(2)} N`], ['E = vB', `${f(r.E, 2)} V/m`], ['ε = BLv', `${f(r.emf, 3)} V`], ['current', '0']]; } },
  crossing: { text: `On each upright side that is in the field, v×B pushes charge up the side with an emf BLv. When only one side is in, that push drives the current around. With both in, the pushes meet head-on around the loop and cancel: ε = 0, even though the loop is moving through a field.`,
    facts: s => { const r = M.crossScene(s.cross.t); return [['leading side', r.inLead ? 'in the field' : 'outside'], ['trailing side', r.inTrail ? 'in the field' : 'outside'], ['each side BLv', `${f(r.sideEmf * 1e3, 0)} mV`], ['Φ', `${f(r.Phi * 1e3, 1)} mWb`], ['ε around', `${f(r.emf * 1e3, 0)} mV`], ['I = ε/R', `${f(r.I * 1e3, 0)} mA`]]; } },
  rails: { text: `The shaded area Lx is the loop the flux goes through, growing as the bar moves. The current it induces runs up the bar, and ILB on that current points backward (red: the only horizontal force, the net force). The braking power Fv is what heats the resistor.`,
    facts: s => { const r = M.railScene(s.rail.t); return [['v', `${f(r.v, 3)} m/s`], ['ε = BLv', `${f(r.emf, 3)} V`], ['I = ε/R', `${f(r.I, 3)} A`], ['F = ILB', `${f(r.F, 3)} N`], ['Fv', `${f(r.F * r.v, 4)} W`], ['I²R', `${f(r.P, 4)} W`], ['heat so far', `${f(r.heat * 1e3, 1)} mJ`]]; } },
  solenoid: { text: `Inside a long coil B = μ₀nI is uniform, so each turn holds Φ = BA (the shaded turn). All N turns together hold NΦ, and NΦ/I is the inductance. When I changes, NΦ changes, and the back emf −L dI/dt points to resist it: + where the current enters while it rises.`,
    facts: s => { const r = M.solScene(s.sol.t); return [['I', `${f(r.I, 2)} A`], ['B = μ₀nI', `${f(r.B * 1e3, 2)} mT`], ['Φ per turn = BA', `${f(r.Phi * 1e6, 2)} µWb`], ['NΦ = LI', `${f(r.NPhi * 1e3, 3)} mWb`], ['ε_L = −L dI/dt', `${f(r.emfL * 1e3, 2)} mV`], ['U = ½LI²', `${f(r.U * 1e3, 2)} mJ`]]; } },
  rl: { text: `Walk round the loop with the current: up through the battery (+ε, while it is in), down through the resistor (−IR), down through the inductor (−L dI/dt). They always sum to zero. Growing, the inductor takes what the resistor doesn’t; decaying, it becomes the source.`,
    facts: s => { const r = M.rlScene(s.rl.t); return [[r.growing ? 'growing, t' : 'decaying, t', `${f(r.s, 2)} s`], ['I', `${f(r.I, 3)} A`], ['ε (battery)', `${f(r.emfBat, 1)} V`], ['IR', `${f(r.VR, 2)} V`], ['L dI/dt', `${f(r.VL, 2)} V`], ['U = ½LI²', `${f(r.U, 2)} J`], ['heat rate I²R', `${f(r.P, 2)} W`]]; } },
  lcCap: { text: `The energy is in the field between the plates (shaded: darker with more of it). ΔV = q/C, and U_E = q²/2C = ½CΔV². As the plates empty through the coil the shading fades; it comes back with the plates charged the other way, E reversed.`,
    facts: s => { const r = M.lcScene(s.lc.t); return [['t (real)', `${f(s.lc.t * 1e3, 2)} ms`], ['q (top plate)', `${f(r.q * 1e6, 1)} µC`], ['ΔV = q/C', `${f(r.V, 2)} V`], ['E = ΔV/d (d = 1 mm)', `${f(r.E / 1e3, 2)} kV/m`], ['U_E = q²/2C', `${f(r.UE * 1e3, 3)} mJ`], ['U_E + U_B', `${f((r.UE + r.UB) * 1e3, 3)} mJ`]]; } },
  lcCoil: { text: `The energy is in the coil’s magnetic field (shaded). U_B = ½LI² is greatest as q passes 0. The coil’s back emf equals the capacitor’s ΔV at every instant, so L dI/dt = −q/C: it slows the current while the plates fill, and keeps it going while they empty.`,
    facts: s => { const r = M.lcScene(s.lc.t); return [['I = dq/dt', `${f(r.I * 1e3, 1)} mA`], ['dI/dt = −q/LC', `${f(r.dI, 0)} A/s`], ['L dI/dt', `${f(M.LC.L * r.dI, 2)} V`], ['B = LI/NA (1600 turns)', `${f(r.B * 1e3, 3)} mT`], ['U_B = ½LI²', `${f(r.UB * 1e3, 3)} mJ`], ['U_E + U_B', `${f((r.UE + r.UB) * 1e3, 3)} mJ`]]; } },
};
