// Chapter 4, page by page (after the AP Physics 1 organizer, Unit 5). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, SC, BAR_COLORS } from './world.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const ST = STATIONS;
const INK = '#2c2c30', BLUE = '#4f7cbd', AMBER = '#bf9030', GREY = '#86868c';

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1, h = H) => P.t + (1 - (y - y0) / (y1 - y0)) * (h - P.t - P.b) };   // h: a chart may be shorter
function chart({ x0, x1, y0, y1, h: H = 170, series, xlabel, ylabel, marks = [], cursors = [], label, under = '', zero = false }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1, H);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}"${s.color ? ` style="stroke:${s.color}"` : ''} d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}"${s.color ? ` style="fill:${s.color}"` : ''}>${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    ${under}<rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>
    ${zero ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/><text class="ax" x="${P.l - 6}" y="${sy(0) + 4}" text-anchor="end">0</text>` : ''}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(([key, color]) => `<circle class="cursor" r="4.5" data-cursor="${key}"${color ? ` style="fill:${color}"` : ''}/>`).join('')}
  </svg>`;
}
const samples = (n, a, b, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });

// live energy bars on the left page (the pendulum): heights set in main.js
export const BARS = { x: 70, w: 64, gap: 46, base: 150, top: 20 };
const barChart = (key, items, Emax) => `<svg class="chart" viewBox="0 0 ${W} ${H + 10}" role="img" aria-label="Energy bar chart, live">
  <line class="zero" x1="${BARS.x - 20}" x2="${BARS.x + items.length * (BARS.w + BARS.gap)}" y1="${BARS.base}" y2="${BARS.base}"/>
  <line class="grid" x1="${BARS.x - 20}" x2="${BARS.x + items.length * (BARS.w + BARS.gap)}" y1="${BARS.top}" y2="${BARS.top}"/>
  <text class="ax" x="${BARS.x - 26}" y="${BARS.top + 4}" text-anchor="end">${f(Emax)} J</text><text class="ax" x="${BARS.x - 26}" y="${BARS.base + 4}" text-anchor="end">0</text>
  ${items.map(([k, name, color], i) => `<rect data-bar="${key}-${k}" x="${BARS.x + i * (BARS.w + BARS.gap)}" width="${BARS.w}" y="${BARS.base}" height="0" style="fill:${color};stroke:#6c6c72;stroke-width:.8"/>
    <text class="lab" x="${BARS.x + i * (BARS.w + BARS.gap) + BARS.w / 2}" y="${BARS.base + 18}" text-anchor="middle">${name}</text>
    <text class="ax" data-val="${key}-${k}" x="${BARS.x + i * (BARS.w + BARS.gap) + BARS.w / 2}" y="${BARS.base - 6}" text-anchor="middle"></text>`).join('')}
</svg>`;

// chart ranges, shared with the live cursors in main.js
export const R = {
  pull: { x0: 0, x1: 3.2, y0: 0, y1: 70 },
  toss: { x0: 0, x1: 1.25, y0: -10, y1: 10 },
  car: { x0: 0, x1: 8, y0: 0, y1: 25 },
  drop: { x0: 0, x1: 3, y0: 0, y1: 16 },
  spring: { x0: 0, x1: 0.5, y0: 0, y1: 25 },
  slide: { x0: 0, x1: 2.2, y0: 0, y1: 18 },
  lift: { x0: 0, x1: 4.2, y0: 0, y1: 250 },
  push: { x0: 0, x1: 4, y0: 0, y1: 20, h: 140 },
  beadU: { x0: 0, x1: 6, y0: 0, y1: 4, h: 125 },
  beadF: { x0: 0, x1: 6, y0: -2, y1: 2, h: 110 },
  bondU: { x0: 0.13, x1: 0.34, y0: -1.2, y1: 0.4, h: 135 },
};
const P0 = M.pull(M.PULL.run), XS = M.SPRING.xmax;

export const PAGES = [
  {
    levels: ['junior', 'senior'],
    kicker: 'Chapter 4', title: 'Work', sub: 'a force over a distance',
    body: `
      <p class="lede"><b>Work</b> is energy moved into or out of an object by a force. A force does work only if the object moves while the force acts.</p>
      <div class="eq"><i>W</i> = |<i>F</i>| |Δ<i>x</i>| cos θ</div>
      <p>θ is the angle between the force and the displacement. Work is in joules: 1 J is 1 N acting through 1 m.</p>
      <p>A rope pulls this ${f(M.PULL.m, 1)} kg box with ${f(M.PULL.F, 0)} N at ${M.PULL.deg}° across a frictionless floor. Only <i>F</i> cos θ = ${f(M.PULL.Fx, 1)} N points along the motion. <i>F</i> sin θ = ${f(M.PULL.Fy, 1)} N pulls across it and does no work. Over ${f(P0.x)} m the rope does ${f(P0.W, 1)} J, less than the ${f(M.PULL.F * P0.x, 1)} J a level pull would.</p>
      <div class="charts">${chart({ ...R.pull, xlabel: 'displacement Δx (m)', ylabel: 'work by the rope (J)', cursors: [['pull']], label: 'Work against displacement',
        series: [{ cls: 'trend', pts: [[0, 0], [3.2, M.PULL.F * 3.2]], tag: [1.7, M.PULL.F * 1.7 + 3, 'θ = 0°'] }, { pts: [[0, 0], [3.2, M.PULL.Fx * 3.2]], tag: [2.45, M.PULL.Fx * 2.45 - 13, 'θ = 30°'] }] })}</div>
      <p class="hintline">Click the box to split the pull. Arrows: ${SC.pull.F * 100} cm per newton.</p>`,
    cam: { target: [ST.pull + 0.75, 0.6, 0], az: -20, el: 12, dist: 17 }, lit: 'pull', scene: 'pull', look: {},
    fig: 'A pull at 30°',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.1', title: 'Positive and negative work', sub: 'with the motion or against it',
    body: `
      <p class="lede">A force along the motion (θ &lt; 90°) does <b>positive</b> work: the object gains kinetic energy. A force against it (θ &gt; 90°) does <b>negative</b> work: the object loses kinetic energy.</p>
      <p>A ${f(M.TOSS.m)} kg ball thrown up at ${f(M.TOSS.v0, 1)} m/s: rising, gravity is opposite the motion (θ = 180°) and does ${f(-M.TOSS.m * M.G * M.TOSS.h, 1)} J of work by the top, where the ball stops. Falling (θ = 0°), gravity gives the ${f(M.TOSS.m * M.G * M.TOSS.h, 1)} J back. The bars add up: <i>K</i><sub>0</sub> + <i>W</i><sub>g</sub> = <i>K</i>.</p>
      <div class="charts">${chart({ ...R.toss, zero: true, xlabel: 'time (s)', ylabel: 'energy (J)', cursors: [['tossK', BLUE], ['tossW']], label: 'Kinetic energy and work by gravity against time',
        series: [{ color: BLUE, pts: samples(40, 0, M.TOSS.run, t => M.toss(t).K), tag: [0.02, 7.2, 'K'] }, { pts: samples(40, 0, M.TOSS.run, t => M.toss(t).Wg), tag: [0.5, -9.6, 'work by gravity'] }] })}</div>
      <p class="hintline">Arrows: <b>v</b> ${SC.toss.v * 100} cm per m/s, <i>F</i><sub>g</sub> ${SC.toss.F * 100} cm/N. Bars: ${SC.toss.E * 100} cm/J.</p>`,
    cam: { target: [ST.toss + 0.8, 1.25, 0], az: -16, el: 7, dist: 12 }, lit: 'toss', scene: 'toss', look: {},
    fig: 'Up against gravity, down with it',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.2', title: 'Forces that do no work', sub: 'at right angles to the motion',
    body: `
      <p class="lede">A force at 90° to the displacement does no work, because cos 90° = 0. It can change the direction of motion, but never the speed.</p>
      <p>A ${f(M.WHIRL.m)} kg ball on a ${f(M.WHIRL.r, 1)} m string circles a smooth table at ${f(M.WHIRL.v, 1)} m/s. The string pulls it toward the centre with <i>T</i> = ${f(M.WHIRL.T, 1)} N, always across its velocity. Its kinetic energy stays ${f(M.WHIRL.K)} J.</p>
      <p>A satellite in a circular orbit is the same: gravity points at the planet, across the velocity, so gravity does no work on it. So does the normal force on a level floor.</p>
      <div class="charts">${chart({ x0: 0, x1: 180, y0: -10, y1: 10, zero: true, xlabel: 'angle θ (°)', ylabel: 'work by 10 N over 1 m (J)', label: 'Work against angle',
        series: [{ pts: samples(60, 0, 180, d => M.work(10, 1, d)) }, { cls: 'trend', pts: [], tag: [20, 2.5, 'positive'] }, { cls: 'trend', pts: [], tag: [120, -8, 'negative'] }], marks: [[90, 0, 'zero at 90°', 8, -8]] })}</div>
      <p class="hintline">Click the ball for earlier moments. <b>v</b>: ${SC.whirl.v * 100} cm per m/s; <i>T</i>: ${SC.whirl.F * 100} cm/N.</p>`,
    cam: { target: [ST.whirl, 0.1, 0], az: -14, el: 36, dist: 8.8 }, lit: 'whirl', scene: 'whirl', look: {},
    fig: 'Tension across the velocity',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.3', title: 'Kinetic energy', sub: 'the work–energy theorem',
    body: `
      <p class="lede"><b>Kinetic energy</b> is energy of motion, <i>K</i> = ½<i>mv</i>². It is a scalar, in joules, and never negative.</p>
      <p>The <b>work–energy theorem</b>: net work equals the change in kinetic energy.</p>
      <div class="eq"><i>W</i><sub>net</sub> = Δ<i>K</i> = ½<i>mv</i><sub>f</sub>² − ½<i>mv</i><sub>0</sub>²</div>
      <p>The road pushes this ${M.CAR.m} kg car forward with ${f(M.CAR.F / 1000, 1)} kN (drag ignored). After ${f(M.car(M.CAR.run).x)} m it has done ${f(M.car(M.CAR.run).Wnet / 1000)} kJ of work, and the car moves at ${f(M.car(M.CAR.run).v, 1)} m/s: ½ × ${M.CAR.m} × ${f(M.car(M.CAR.run).v, 1)}² = ${f(M.car(M.CAR.run).K / 1000)} kJ. The two bars grow together.</p>
      <div class="charts">${chart({ ...R.car, xlabel: 'distance (m)', ylabel: 'K = W_net (kJ)', cursors: [['car', BLUE]], label: 'Kinetic energy against distance',
        series: [{ color: BLUE, pts: [[0, 0], [8, M.CAR.F * 8 / 1000]], tag: [3.2, M.CAR.F * 3.2 / 1000 + 3, 'slope = F = 3.0 kN'] }] })}</div>
      <p class="hintline">Click the car: weight and normal force do no work. Arrows: 25 cm per kN. Bars: 7.5 cm per kJ.</p>`,
    cam: { target: [ST.car + 4.6, 1.0, 0], az: -16, el: 12, dist: 36 }, lit: 'car', scene: 'car', look: {},
    fig: 'Net work in, kinetic energy out',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.4', title: 'Gravitational potential energy', sub: 'energy of height',
    body: `
      <p class="lede"><b>Potential energy</b> is stored energy that depends on position. Near Earth’s surface</p>
      <div class="eq"><i>U</i><sub>g</sub> = <i>mg</i>Δ<i>y</i></div>
      <p>with Δ<i>y</i> measured from wherever you choose <i>U</i><sub>g</sub> = 0. It equals the least work needed to lift the object there against gravity.</p>
      <p>This ${f(M.DROP.m)} kg ball is dropped from ${f(M.DROP.h, 1)} m: <i>U</i><sub>g</sub> = ${f(M.DROP.E, 1)} J, <i>K</i> = 0. As it falls <i>U</i><sub>g</sub> turns into <i>K</i>; just before landing <i>K</i> = ${f(M.DROP.E, 1)} J, so <i>v</i> = ${f(Math.sqrt(2 * M.G * M.DROP.h))} m/s. Dropped from a height, <i>U</i><sub>g0</sub> = <i>K</i><sub>f</sub>.</p>
      <div class="charts">${chart({ ...R.drop, xlabel: 'height above the ground (m)', ylabel: 'energy (J)', cursors: [['dropU', AMBER], ['dropK', BLUE]], label: 'Potential and kinetic energy against height',
        series: [{ cls: 'trend', pts: [[0, M.DROP.E], [3, M.DROP.E]], tag: [1.25, M.DROP.E - 1, 'E'] }, { color: AMBER, pts: [[0, 0], [3, M.DROP.E]], tag: [2.2, 8.5, 'U<tspan dy="3" font-size="8">g</tspan>'] }, { color: BLUE, pts: [[0, M.DROP.E], [3, 0]], tag: [0.35, 10.0, 'K'] }] })}</div>
      <p class="hintline">Click the ball to move the zero. Bars: ${SC.drop.E * 100} cm per joule.</p>`,
    cam: { target: [ST.drop + 0.7, 1.5, 0], az: -14, el: 6, dist: 14 }, lit: 'drop', scene: 'drop', look: {},
    fig: 'Height becomes speed',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.5', title: 'Spring potential energy', sub: 'Hooke’s law',
    body: `
      <p class="lede">A spring pushes back toward its natural length, harder the further it is squashed or stretched.</p>
      <table class="data eqs"><tr><td><i>F</i><sub>s</sub> = −<i>k</i>Δ<i>x</i></td><td>opposite Δx; <i>k</i> in N/m</td></tr><tr><td><i>U</i><sub>s</sub> = ½<i>k</i>Δ<i>x</i>²</td><td>energy stored</td></tr></table>
      <p>With <i>k</i> = ${M.SPRING.k} N/m, the ${f(M.SPRING.m, 1)} kg block (<i>K</i> = ${f(M.SPRING.E, 1)} J) stops at Δ<i>x</i> = ${f(XS)} m: all ${f(M.SPRING.E, 1)} J is stored, then given back. Work is the <b>area under a force–displacement graph</b>; under <i>kx</i> it is a triangle, ½ · Δ<i>x</i> · <i>k</i>Δ<i>x</i>.</p>
      <div class="charts">${chart({ ...R.spring, xlabel: 'compression Δx (m)', ylabel: 'spring force (N)', cursors: [['spring']], label: 'Spring force against compression, with the shaded area equal to the stored energy',
        under: `<path data-area="spring" style="fill:${BAR_COLORS.U};opacity:.45" d=""/>`, series: [{ pts: [[0, 0], [0.5, M.SPRING.k * 0.5]] }] })}</div>
      <p class="live" id="springlive"></p>
      <p class="hintline">Frictionless. Arrows: ${SC.spring.F * 100} cm/N. Bars: ${SC.spring.E * 100} cm/J.</p>`,
    cam: { target: [ST.spring - 0.05, 0.6, 0], az: -14, el: 20, dist: 14 }, lit: 'spring', scene: 'spring', look: {},
    fig: 'Squeezing a spring',
  },
  {
    levels: ['senior'],
    kicker: '4.6 · AP Physics C', title: 'Work by a changing force', sub: 'the area under F(x)',
    body: `
      <p class="lede">When the force changes along the way, cut the path into thin strips, add <i>F</i>Δ<i>x</i> for each, and let the strips shrink. The sum becomes the <b>area under the F(x) graph</b>:</p>
      <div class="eq"><i>W</i> = lim Σ <i>F</i>(<i>x</i><sub>i</sub>)Δ<i>x</i> = ∫ <i>F</i>(<i>x</i>) d<i>x</i></div>
      <p>A ${f(M.PUSH.m, 1)} kg crate on a smooth floor gets <i>F</i> = <i>F</i><sub>0</sub>(1 − <i>x</i>/<i>L</i>)(1 + 2<i>x</i>/<i>L</i>), ${M.PUSH.F0} N fading to 0 at <i>L</i> = ${f(M.PUSH.L, 1)} m. Integrating, <i>W</i> = ⅚<i>F</i><sub>0</sub><i>L</i> = ${f(M.PUSH.W, 1)} J, all of it kinetic energy.</p>
      <div class="charts">${chart({ ...R.push, xlabel: 'position x (m)', ylabel: 'push F(x) (N)', cursors: [['push']], label: 'Push against position, with the area up to the crate shaded and six strips outlined',
        under: `<path data-area="push" style="fill:#86868c;opacity:.35" d=""/>` + Array.from({ length: 6 }, (_, i) => { const dx = M.PUSH.L / 6, x = i * dx, F = M.pushF(x + dx / 2), X = v => CH.sx(v, R.push.x0, R.push.x1), Y = v => CH.sy(v, R.push.y0, R.push.y1, R.push.h); return `<rect class="trend" x="${X(x)}" y="${Y(F)}" width="${X(dx) - X(0)}" height="${Y(0) - Y(F)}"/>`; }).join(''),
        series: [{ pts: [...samples(60, 0, M.PUSH.L, M.pushF), [R.push.x1, 0]] }] })}</div>
      <p class="hintline">6 strips (dashed) ${f(M.pushStrips(6))} J; 64 strips ${f(M.pushStrips(64), 3)} J. ${SC.push.F * 100} cm/N.</p>`,
    cam: { target: [ST.push + 0.1, 0.8, 0], az: -12, el: 9, dist: 14.5 }, lit: 'push', scene: 'push', look: {},
    fig: 'Work is the area under F(x)',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.7', title: 'Conservation of energy', sub: 'mechanical energy stays constant',
    body: `
      <p class="lede">Mechanical energy, <i>E</i> = <i>K</i> + <i>U</i><sub>g</sub> + <i>U</i><sub>s</sub>, stays the same when there is no friction or drag.</p>
      <div class="eq"><i>U</i><sub>g0</sub> + <i>U</i><sub>s0</sub> + <i>K</i><sub>0</sub> = <i>U</i><sub>gf</sub> + <i>U</i><sub>sf</sub> + <i>K</i><sub>f</sub></div>
      <p>A ${f(M.PEND.m, 1)} kg bob on a ${f(M.PEND.L, 1)} m string, let go at ${M.PEND.deg0}°. At the ends it is all <i>U</i><sub>g</sub>, ${f(M.PEND.E)} J. At the bottom it is all <i>K</i>, at ${f(Math.sqrt(2 * M.PEND.E / M.PEND.m))} m/s. The string pulls across the motion and does no work. Tip: find the zero terms first (<i>v</i> = 0 at the ends, Δ<i>y</i> = 0 at the bottom).</p>
            <div class="charts">${barChart('pend', [['K', 'K', BAR_COLORS.K], ['U', 'U<tspan dy="3" font-size="8">g</tspan>', BAR_COLORS.U], ['E', 'E', BAR_COLORS.E]], M.PEND.E)}</div>
      <p class="hintline">Click the bob to split its weight. Arrows: ${SC.pendulum.F * 100} cm/N. Bars: ${SC.pendulum.E * 100} cm/J.</p>`,
    cam: { target: [ST.pendulum + 0.7, 1.8, 0], az: -10, el: 6, dist: 14 }, lit: 'pendulum', scene: 'pendulum', look: {},
    fig: 'K and U trade places',
  },
  {
    levels: ['senior'],
    kicker: '4.8 · AP Physics C', title: 'Force from potential energy', sub: 'minus the slope of U',
    body: `
      <p class="lede">Since d<i>W</i> = <i>F</i> d<i>x</i> = −d<i>U</i>, a conservative force is <b>minus the slope</b> of <i>U</i>(<i>x</i>): it points downhill, and is zero where <i>U</i> is flat.</p>
      <div class="eq"><i>F</i><sub>x</sub> = −d<i>U</i>/d<i>x</i></div>
      <p>A ${f(M.BEAD.m)} kg bead on a smooth wire, <i>x</i> measured along it: <i>U</i> = <i>mgh</i>(<i>x</i>).</p>
      <div class="charts">${chart({ ...R.beadU, xlabel: 'x along the wire (m)', ylabel: 'U (J) and its tangent', cursors: [['beadU']], label: 'Potential energy along the wire, with the tangent at the bead',
        under: `<line data-tangent="bead" class="curve" style="stroke:#e5484d;stroke-width:1.3"/>`,
        series: [{ cls: 'trend', pts: [[0, M.BEAD.E], [R.beadU.x1, M.BEAD.E]], tag: [5.3, M.BEAD.E - 0.55, 'E'] }, { pts: samples(120, 0, M.BEAD.len, M.beadU) }] })}
        ${chart({ ...R.beadF, zero: true, xlabel: 'x along the wire (m)', ylabel: 'F = −dU/dx (N)', cursors: [['beadF']], label: 'Force along the wire',
        series: [{ pts: samples(120, 0, M.BEAD.len, M.beadF) }], marks: [[M.BEAD.stable, 0, 'stable', -16, 14], [M.BEAD.unstable, 0, 'unstable', 6, -6]] })}</div>
      <p class="hintline">Click the bead for the tangent. ${SC.bead.F * 100} cm/N.</p>`,
    cam: { target: [ST.bead - 0.1, 0.85, 0], az: -10, el: 8, dist: 14.5 }, lit: 'bead', scene: 'bead', look: {},
    fig: 'Downhill on the U graph',
  },
  {
    levels: ['senior'],
    kicker: '4.9 · AP Physics C', title: 'Energy diagrams', sub: 'turning points and equilibrium',
    body: `
      <p class="lede">Draw a line at the total energy <i>E</i>: the gap above <i>U</i>(<i>x</i>) is <i>K</i>. The particle turns back at the <b>turning points</b>, where <i>U</i> = <i>E</i>.</p>
      <table class="data eqs"><tr><td>stable</td><td>U minimum, U″ &gt; 0: F pushes back</td></tr><tr><td>unstable</td><td>U maximum, U″ &lt; 0: F pushes away (hump)</td></tr><tr><td>neutral</td><td>U flat: no force (wire’s right end)</td></tr></table>
      <p>A light atom bound to a heavy one, at <i>E</i> = ${f(M.BOND.E / M.EV, 1)} eV. Near the bottom a well acts as a spring, <i>k</i> = <i>U</i>″:</p>
      <div class="eq">ω² = <i>U</i>″(<i>x</i><sub>0</sub>)/<i>m</i> → <i>T</i> = ${f(2 * Math.PI / M.BOND.w * 1e15, 1)} fs</div>
      <div class="charts">${chart({ ...R.bondU, xlabel: 'separation r (nm)', ylabel: 'U (eV)', cursors: [['bondU']], zero: true, label: 'Bond potential energy with the total-energy line and turning points',
        series: [{ cls: 'trend', pts: [[R.bondU.x0, M.BOND.E / M.EV], [R.bondU.x1, M.BOND.E / M.EV]], tag: [0.315, M.BOND.E / M.EV + 0.06, 'E'] }, { pts: samples(120, 0.1355, R.bondU.x1, r => M.bondU(r * 1e-9) / M.EV) }],
        marks: [[M.BOND.r1 * 1e9, M.BOND.E / M.EV, 'turn', -32, 4], [M.BOND.r2 * 1e9, M.BOND.E / M.EV, 'turn', 6, 14]] })}</div>
      <p class="hintline">Drawn 0.1 nm = 1 m, <i>F</i> ${SC.bond.F * 100} cm/nN, ${(() => { const [a, e] = (1 / (M.SLOW * M.BOND.tscale)).toExponential(1).split('e+'); return `${a}×10<sup>${e}</sup>`; })()}× slower.</p>`,
    cam: { target: [ST.bond - 0.45, 1.25, 0], az: -10, el: 6, dist: 12.5 }, lit: 'bond', scene: 'bond', look: {},
    fig: 'A particle in a well',
  },
  {
    levels: ['senior'],
    kicker: '4.10', title: 'When it isn’t conserved', sub: 'friction turns energy into heat',
    body: `
      <p class="lede">Friction and drag are <b>resistive</b> forces. They point against the motion, so their work is always negative. The mechanical energy they remove becomes thermal energy.</p>
      <div class="eq"><i>E</i><sub>mech,i</sub> = <i>E</i><sub>mech,f</sub> + |<i>W</i><sub>resistive</sub>|</div>
      <p>The ${f(M.SLIDE.m, 1)} kg block slides onto a rough floor at ${f(M.SLIDE.v0, 1)} m/s. With μ<sub>k</sub> = ${f(M.SLIDE.mu)}, friction is <i>f</i> = μ<sub>k</sub><i>mg</i> = ${f(M.SLIDE.f)} N. It stops after ${f(M.SLIDE.d)} m: |<i>W</i><sub>f</sub>| = <i>f</i>·<i>d</i> = ${f(M.SLIDE.E, 1)} J, all of its <i>K</i>. <i>E</i><sub>mech</sub> falls to zero; the total, heat included, never changes.</p>
      <div class="charts">${chart({ ...R.slide, xlabel: 'distance slid (m)', ylabel: 'energy (J)', cursors: [['slideK', BLUE], ['slideT', GREY]], label: 'Kinetic and thermal energy against distance',
        series: [{ cls: 'trend', pts: [[0, M.SLIDE.E], [M.SLIDE.d, M.SLIDE.E]], tag: [0.85, M.SLIDE.E - 0.2, 'total'] }, { color: BLUE, pts: [[0, M.SLIDE.E], [M.SLIDE.d, 0]], tag: [0.2, 11.5, 'K'] }, { color: GREY, pts: [[0, 0], [M.SLIDE.d, M.SLIDE.E]], tag: [1.45, 8.0, 'thermal'] }] })}</div>
      <p class="hintline">Click the block. Arrows: ${SC.slide.F * 100} cm/N. Bars: ${SC.slide.E * 100} cm/J.</p>`,
    cam: { target: [ST.slide + 0.3, 0.55, 0], az: -16, el: 12, dist: 14 }, lit: 'slide', scene: 'slide', look: {},
    fig: 'Kinetic energy becomes heat',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.11', title: 'Power', sub: 'how fast work is done',
    body: `
      <p class="lede"><b>Power</b> is the rate of doing work, or of turning energy from one form into another. It is measured in watts: 1 W = 1 J/s, and 1 horsepower = ${M.HP} W.</p>
      <div class="eq"><i>P</i> = <i>W</i>/<i>t</i> = <i>F</i>Δ<i>x</i>/<i>t</i> = <i>Fv</i></div>
      <p>Both ${M.LIFT.m} kg crates rise ${f(M.LIFT.h, 1)} m at steady speed, so each rope pulls with <i>T</i> = <i>mg</i> = ${f(M.LIFT.W, 0)} N and does ${f(M.LIFT.work, 0)} J. The fast one takes ${f(M.LIFT.tFast, 1)} s: ${f(M.LIFT.Pfast, 0)} W. The slow one takes ${f(M.LIFT.tSlow, 1)} s: ${f(M.LIFT.Pslow, 0)} W. Same work, twice the power. Given speeds and times, <i>P</i> = Δ<i>E</i>/<i>t</i> is often quickest.</p>
            <div class="charts">${chart({ ...R.lift, xlabel: 'time (s)', ylabel: 'work done (J)', cursors: [['liftF'], ['liftS']], label: 'Work against time, fast and slow',
        series: [{ pts: [[0, 0], [M.LIFT.tFast, M.LIFT.work], [4.2, M.LIFT.work]], tag: [0.25, 160, 'fast: slope 98 W'] }, { cls: 'trend', pts: [[0, 0], [M.LIFT.tSlow, M.LIFT.work]], tag: [2.45, 95, 'slow: 49 W'] }] })}</div>
      <p class="hintline">Brief start and stop ignored. Arrows: ${SC.lift.F * 100} cm per newton.</p>`,
    cam: { target: [ST.lift, 1.7, 0], az: -12, el: 6, dist: 14 }, lit: 'lift', scene: 'lift', look: {},
    fig: 'Same work, half the time',
  },
];

// ---------- click a scene: what it breaks into ----------
export const PLATES = {
  pull: { text: `The pull splits into two parts (grey). <i>F</i> cos θ lies along the displacement and does all the work. <i>F</i> sin θ points straight up, at 90° to the motion, and does none: it only makes the floor push up less. The rope’s work equals the box’s kinetic energy, because nothing else does work.`,
    facts: s => { const r = M.pull(s.pull.t); return [['F cos θ (along Δx)', `${f(M.PULL.Fx)} N`], ['F sin θ (across)', `${f(M.PULL.Fy)} N, no work`], ['Δx', `${f(r.x)} m`], ['W = F Δx cos θ', `${f(r.W)} J`], ['K = ½mv²', `${f(r.K)} J`]]; } },
  toss: { text: `Watch the angle between the weight and the velocity. Going up they are opposite (180°): gravity’s work is negative and the K bar shrinks. Coming down they agree (0°): the work is positive and K grows back. At every instant K = K<sub>0</sub> + W<sub>g</sub>.`,
    facts: s => { const r = M.toss(s.toss.t); return [['height', `${f(r.y)} m`], ['velocity', `${f(r.v)} m/s`], ['W by gravity so far', `${f(r.Wg)} J`], ['K = K₀ + W_g', `${f(M.toss(0).K)} + (${f(r.Wg)}) = ${f(r.K)} J`]]; } },
  whirl: { text: `Earlier moments, a quarter lap apart: at each one the tension (toward the peg) and the velocity (along the circle) meet at 90°. Over any small step the displacement is along <b>v</b>, so T·Δx·cos 90° = 0. The weight and the table’s push are vertical and do no work either.`,
    facts: () => [['tension T', `${f(M.WHIRL.T)} N`], ['angle between T and v', '90°'], ['work by T', '0 J'], ['speed', `${f(M.WHIRL.v)} m/s, constant`], ['K', `${f(M.WHIRL.K)} J, constant`]] },
  car: { text: `Weight and the normal force are vertical, at 90° to the motion, so they do no work and are set aside. The only force along Δx is the road’s push, and it is also the net force (red). Its work, F·Δx, is the whole change in kinetic energy.`,
    facts: s => { const r = M.car(s.car.t); return [['F (road, forward)', `${f(M.CAR.F / 1000)} kN`], ['Δx', `${f(r.x)} m`], ['W_net = F Δx', `${f(r.Wnet / 1000)} kJ`], ['v', `${f(r.v)} m/s`], ['K = ½mv²', `${f(r.K / 1000)} kJ`]]; } },
  drop: { text: `Move the zero up to ${f(M.DROP.ref2, 1)} m and every value of U<sub>g</sub> drops by mg × ${f(M.DROP.ref2, 1)} = ${f(M.DROP.m * M.G * M.DROP.ref2)} J. Below the new zero, U<sub>g</sub> is negative. But the <i>change</i> in U<sub>g</sub> during the fall is the same, so the speed you predict is the same. Choose whichever zero makes the arithmetic easiest.`,
    facts: s => { const r = M.drop(s.drop.t), m = M.DROP.m * M.G; return [['height', `${f(r.y)} m`], ['U_g, zero at ground', `${f(r.U)} J`], [`U_g, zero at ${f(M.DROP.ref2, 1)} m`, `${f(m * (r.y - M.DROP.ref2))} J`], ['ΔU_g since release', `${f(r.U - M.DROP.E)} J either way`], ['K', `${f(r.K)} J`]]; } },
  spring: { text: `The grey arrow is the compression Δx, measured from the spring’s natural length. The spring force F<sub>s</sub> = −kΔx points the other way. As the block slows, its K bar empties into the U<sub>s</sub> bar; at full compression it is all U<sub>s</sub>. The total never changes.`,
    facts: s => { const r = M.spring(s.spring.t); return [['compression Δx', `${f(r.x, 3)} m`], ['F_s = −kΔx', `${f(r.F)} N`], ['U_s = ½kΔx²', `${f(r.U)} J`], ['K = ½mv²', `${f(r.K)} J`], ['K + U_s', `${f(r.K + r.U)} J`]]; } },
  push: { text: `The area under F(x) comes apart into ${6} strips. Each is F(x<sub>i</sub>)·Δx, the work over one short step where the push hardly changes. Their sum, ${f(M.pushStrips(6))} J, is already close to the integral, ${f(M.PUSH.W)} J; thinner strips close the gap. The floor is level and smooth, so weight and the normal force do no work and the area is all kinetic energy.`,
    facts: s => { const r = M.push(s.push.t); return [['x', `${f(r.x)} m`], ['F(x)', `${f(r.F)} N`], ['W = ∫F dx so far', `${f(r.W)} J`], ['K = ½mv²', `${f(r.K)} J`], ['6-strip sum, whole push', `${f(M.pushStrips(6))} J`], ['∫₀ᴸ F dx', `${f(M.PUSH.W)} J`]]; } },
  bead: { text: `The dashed line is the tangent to the wire. Gravity splits into a part along the wire, mg sin θ, and a part across it, which the wire’s push takes up. Since U = mgh and dh/dx = sin θ along the wire, the part along it is exactly −dU/dx. At the valley floor and the hump top the tangent is level: no force, equilibrium.`,
    facts: s => { const r = M.bead(s.bead.t); return [['x along the wire', `${f(r.x)} m`], ['U = mgh', `${f(r.U)} J`], ['dU/dx (slope)', `${f(r.slope)} J/m`], ['F = −dU/dx', `${f(r.F)} N`], ['K + U', `${f(r.K + r.U, 3)} J`]]; } },
  bond: { text: `The bond is a Lennard-Jones model, U = ε[(r<sub>0</sub>/r)¹² − 2(r<sub>0</sub>/r)⁶], r<sub>0</sub> = ${f(M.BOND.r0 * 1e9)} nm; the heavy atom barely moves. Ghosts mark the turning points, where U = E and the atom stops. The blue dashed parabola is ½k(r − r<sub>0</sub>)² with k = U″(r<sub>0</sub>) = ${f(M.BOND.k, 0)} N/m: it fits the bottom of the well, which is why small vibrations are simple harmonic with ω² = U″/m. Higher up the real well is lopsided, steep inside and soft outside, so this swing is slower and spends longer stretched.`,
    facts: s => { const r = M.bond(s.bond.t); return [['r', `${f(r.r * 1e9, 4)} nm`], ['U', `${f(r.U / M.EV, 3)} eV`], ['K = E − U', `${f(r.K / M.EV, 3)} eV`], ['F = −dU/dr', `${f(r.F * 1e9)} nN`], ['k = U″(r₀)', `${f(M.BOND.k, 0)} N/m`], ['T small / this swing', `${f(2 * Math.PI / M.BOND.w * 1e15)} / ${f(M.BOND.period * 1e15)} fs`]]; } },
  pendulum: { text: `The weight splits into mg sin θ, along the path, and mg cos θ, along the string. Only mg sin θ does work: it slows the bob on the way up and speeds it on the way down. The tension and mg cos θ are across the motion and do none, which is why K + U<sub>g</sub> stays fixed.`,
    facts: s => { const r = M.pendulum(s.pendulum.t); return [['angle θ', `${f(r.th * 180 / Math.PI, 1)}°`], ['mg sin θ (along path)', `${f(r.Ftan)} N`], ['tension T', `${f(r.T)} N, no work`], ['K', `${f(r.K)} J`], ['U_g', `${f(r.U)} J`], ['K + U_g', `${f(r.K + r.U)} J`]]; } },
  slide: { text: `Weight and the normal force do no work and are set aside. Friction is the only force along the motion, and it points backwards: θ = 180°, so its work is −f·Δx. That negative work is exactly the kinetic energy lost, and it reappears as heat in the block and the floor.`,
    facts: s => { const r = M.slide(s.slide.t); return [['friction f = μk mg', `${f(M.SLIDE.f)} N`], ['Δx', `${f(r.x)} m`], ['W_f = −f Δx', `${f(r.Wf)} J`], ['K', `${f(r.K)} J`], ['thermal energy', `${f(r.Eth)} J`], ['K + thermal', `${f(r.K + r.Eth)} J`]]; } },
  lift: { text: `The grey arrows are each crate’s rise Δy. At steady speed the rope’s pull equals the weight, so each rope does W = mgΔy. Equal heights mean equal work; the faster crate gets there in half the time, so its rope delivers twice the power.`,
    facts: s => { const a = M.lift(s.lift.t, M.LIFT.vFast), b = M.lift(s.lift.t, M.LIFT.vSlow); return [['T = mg', `${f(M.LIFT.W, 1)} N`], ['fast: work so far', `${f(a.W, 0)} J, P ${f(a.P, 0)} W`], ['slow: work so far', `${f(b.W, 0)} J, P ${f(b.P, 0)} W`], ['P = Fv (fast)', `${f(M.LIFT.W, 0)} × ${f(M.LIFT.vFast, 1)} = ${f(M.LIFT.Pfast, 0)} W`]]; } },
};
