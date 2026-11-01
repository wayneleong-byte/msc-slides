// Chapter 6, page by page (after the AP Physics 1 organizer, Unit 7). Text and charts on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, P_SCALE, PAPER, TQ_ARC } from './world.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const deg = r => (r / M.DEG).toFixed(0);

// ---------- small SVG charts for the left page, with live cursors ----------
const W = 420, P = { l: 44, r: 14, t: 16, b: 30 };
export const CURSORS = {};       // key → (x, y) → [cx, cy]
export const LIVE = {};          // key → (t) → path d, for a series that is redrawn every frame
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], cursors = [], label, h = 170, ylabels, xlabels }) {
  const H = h;
  const sx = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy = y => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b);
  for (const c of cursors) CURSORS[c] = (x, y) => [sx(x), sy(y)];
  const toD = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('');
  for (const s of series) if (s.live) { LIVE[s.live] = t => toD(s.fn(t)); s.pts = s.fn(0); }
  const paths = series.map(s => `<path class="${s.cls || 'curve'}"${s.live ? ` data-live="${s.live}"` : ''} d="${toD(s.pts)}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const zero = y0 < 0 && y1 > 0 ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  const [yt, yb] = ylabels || [y1, y0], [xl, xr] = xlabels || [x0, x1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${zero}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${yt}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${yb}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${xl}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${xr}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(c => `<circle class="cursor" r="4.5" cx="-20" cy="-20" data-cursor="${c}"/>`).join('')}
  </svg>`;
}
const sample = (fn, a, b, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });
const T2 = 2 * M.T0;

const at = (k, dx = 0, dy = 0.35) => [STATIONS[k] + dx, dy, 0];

export const PAGES = [
  {
    kicker: 'Chapter 6', title: 'Oscillations', sub: 'back and forth, and back again',
    body: `
      <p class="lede">An <b>oscillation</b> is motion back and forth about an <b>equilibrium</b> position. It is <b>simple harmonic motion</b> (SHM) when a <b>restoring force</b> pulls it back toward equilibrium in proportion to its displacement. Then the period never changes.</p>
      <table class="data">
        <tr><td>amplitude <i>A</i>: farthest from equilibrium</td><td>${f(M.A)} m</td></tr>
        <tr><td>period <i>T</i>: time for one full cycle</td><td>${f(M.T0, 3)} s</td></tr>
        <tr><td>frequency <i>f</i> = 1/<i>T</i>: cycles per second</td><td>${f(M.F0, 3)} Hz</td></tr>
      </table>
      <div class="charts">${chart({ x0: 0, x1: 1, xlabels: ['0', '2T'], y0: -M.A, y1: M.A, ylabels: ['+A', '−A'], xlabel: 'time', ylabel: 'position x', cursors: ['x0'], label: 'Position against time: a cosine', h: 140,
        series: [{ pts: sample(u => M.spring(u * T2).x, 0, 1) }], marks: [[0.5, M.A, 'T', -3, 16]] })}</div>
      <p class="hintline">The outlines are strobe images at equal times: bunched at the ends, where the block is slow. Click the block for v and a.</p>`,
    cam: { target: at('spring', -0.25, 0.3), az: -20, el: 20, dist: 7.6 }, lit: 'spring', scene: 'spring', look: {},
    fig: 'A block on a spring, frictionless floor',
  },
  {
    kicker: '6.1', title: 'Hooke’s law', sub: 'the restoring force',
    body: `
      <p class="lede">Stretch or squash a spring and it pushes back, in proportion to how far its end has moved:</p>
      <div class="eq"><i>F</i><sub>s</sub> = −<i>k</i>Δ<i>x</i></div>
      <p><i>k</i> = ${M.K} N/m is the <b>spring constant</b>, the stiffness. The minus sign: the force always points <b>opposite</b> to the displacement. Weight and normal force cancel, so <i>F</i><sub>s</sub> is the net force and <i>a</i> = −(<i>k</i>/<i>m</i>)<i>x</i> (red).</p>
      <table class="data">
        <tr><th>where</th><th>force, accel.</th><th>speed</th></tr>
        <tr><td><i>x</i> = ±<i>A</i></td><td>${f(M.FMAX, 1)} N, ${f(M.AMAX, 1)} m/s²: max</td><td>0</td></tr>
        <tr><td><i>x</i> = 0</td><td>0</td><td>${f(M.VMAX, 1)} m/s: max</td></tr>
      </table>
      <div class="charts">${chart({ x0: -M.A, x1: M.A, y0: -M.FMAX, y1: M.FMAX, xlabel: 'displacement x (m)', ylabel: 'F (N)', cursors: ['Fx'], label: 'Spring force against displacement: a line of slope −k', h: 130,
        series: [{ pts: [[-M.A, M.FMAX], [M.A, -M.FMAX]], tag: [0.12, -2.4, 'slope −k'] }] })}</div>
      <p class="hintline">Click the block for its free-body diagram.</p>`,
    cam: { target: at('hooke', -0.2, 0.3), az: -16, el: 14, dist: 7.8 }, lit: 'hooke', scene: 'hooke', look: {},
    fig: 'Force always toward x = 0',
  },
  {
    kicker: '6.2', title: 'x, v and a', sub: 'a cosine and its slopes',
    body: `
      <p class="lede">A paper strip slides out from under the block, so the block draws its own position against time: a cosine.</p>
      <table class="data eqs">
        <tr><td><i>x</i> = <i>A</i> cos 2π<i>ft</i></td><td>±<i>A</i> at the ends</td></tr>
        <tr><td><i>v</i> = −2π<i>fA</i> sin 2π<i>ft</i></td><td>max ${f(M.VMAX)} m/s at <i>x</i> = 0</td></tr>
        <tr><td><i>a</i> = −4π²<i>f</i>²<i>A</i> cos 2π<i>ft</i></td><td>max ${f(M.AMAX)} m/s² at ±<i>A</i></td></tr>
      </table>
      <p>Each graph is the slope of the one above: cos → −sin → −cos. And <i>a</i> is <i>x</i> flipped and scaled.</p>
      <div class="charts">
        ${chart({ x0: 0, x1: 1, xlabels: ['', ''], y0: -1, y1: 1, ylabels: ['+A', '−A'], xlabel: '', ylabel: 'x', cursors: ['tx'], label: 'Position: cosine', h: 78, series: [{ pts: sample(u => Math.cos(2 * Math.PI * 2 * u), 0, 1) }] })}
        ${chart({ x0: 0, x1: 1, xlabels: ['', ''], y0: -1, y1: 1, ylabels: ['+max', '−max'], xlabel: '', ylabel: 'v', cursors: ['tv'], label: 'Velocity: negative sine', h: 78, series: [{ pts: sample(u => -Math.sin(2 * Math.PI * 2 * u), 0, 1) }] })}
        ${chart({ x0: 0, x1: 1, xlabels: ['0', '2T'], y0: -1, y1: 1, ylabels: ['+max', '−max'], xlabel: 'time', ylabel: 'a', cursors: ['ta'], label: 'Acceleration: negative cosine', h: 88, series: [{ pts: sample(u => -Math.cos(2 * Math.PI * 2 * u), 0, 1) }] })}
      </div>
      <p class="hintline">Click the trace for its slope at the pen: the velocity.</p>`,
    cam: { target: [STATIONS.trace - 0.1, 0, 1.45], az: -10, el: 52, dist: 11 }, lit: 'trace', scene: 'trace', look: {},
    fig: 'The block draws x against t',
  },
  {
    kicker: '6.3', title: 'Energy', sub: 'traded, never lost',
    body: `
      <p class="lede">With no friction the total stays put. It just moves between the block’s motion and the spring:</p>
      <div class="eq">½<i>kA</i>² = ½<i>mv</i>² + ½<i>kx</i>²</div>
      <p>At ±<i>A</i> it is all in the spring, ½<i>kA</i>² = ${f(M.E)} J. At <i>x</i> = 0 it is all kinetic, so ½<i>mv</i><sub>max</sub>² = ½<i>kA</i>² and <i>v</i><sub>max</sub> = √(<i>k</i>/<i>m</i>)·<i>A</i> = ${f(M.VMAX)} m/s. The shares are equal at <i>x</i> = <i>A</i>√2/2 = ${f(M.X_HALF, 3)} m, not halfway.</p>
      <div class="charts">${chart({ x0: -M.A, x1: M.A, y0: 0, y1: M.E, xlabel: 'position x (m)', ylabel: 'energy (J)', cursors: ['U', 'K'], label: 'Kinetic and spring energy against position', h: 140,
        series: [{ pts: sample(x => 0.5 * M.K * x * x, -M.A, M.A), tag: [0.27, 0.32, 'U'] }, { pts: sample(x => M.E - 0.5 * M.K * x * x, -M.A, M.A), tag: [-0.06, 1.72, 'K'] }],
        marks: [[M.X_HALF, M.E / 2, 'K = U', 8, 4]] })}</div>
      <p>The spring energy is the work done stretching it: the triangle under <i>F</i> = <i>kx</i>, ½(<i>kx</i>)<i>x</i>.</p>
      <p class="hintline">Click to lift the kinetic part off the stack.</p>`,
    cam: { target: at('energy', 0.95, 0.6), az: -10, el: 14, dist: 12 }, lit: 'energy', scene: 'energy', look: {},
    fig: 'Kinetic and spring energy',
  },
  {
    kicker: '6.4', title: 'A hanging spring', sub: 'gravity moves the middle, not the beat',
    body: `
      <p class="lede">Hang the same block from the same spring. It sags until the spring holds its weight, <i>kd</i> = <i>mg</i>:</p>
      <div class="eq"><i>d</i> = <i>mg</i>/<i>k</i> = ${f(M.D, 3)} m</div>
      <p>That is the new equilibrium. Measure <i>y</i> from there and gravity drops out: <i>k</i>(<i>d</i> − <i>y</i>) − <i>mg</i> = −<i>ky</i>. Hooke’s law again, so it bobs with the same period as on the floor, ${f(M.T0, 3)} s.</p>
      <table class="data">
        <tr><th>where</th><th>spring</th><th>weight</th><th>net (red)</th></tr>
        <tr><td>top</td><td>${f(M.K * (M.D - M.HANG.A))} N</td><td>${f(M.WEIGHT)} N</td><td>${f(M.K * M.HANG.A)} N ↓</td></tr>
        <tr><td>equilibrium</td><td>${f(M.WEIGHT)} N</td><td>${f(M.WEIGHT)} N</td><td>0</td></tr>
        <tr><td>bottom</td><td>${f(M.K * (M.D + M.HANG.A))} N</td><td>${f(M.WEIGHT)} N</td><td>${f(M.K * M.HANG.A)} N ↑</td></tr>
      </table>
      <p class="hintline">Click the block for its free-body diagram.</p>`,
    cam: { target: at('hang', 0.1, 1.9), az: -14, el: 6, dist: 9 }, lit: 'hang', scene: 'hang', look: {},
    fig: 'The block on a vertical spring',
  },
  {
    kicker: '6.5', title: 'The pendulum', sub: 'SHM, if the swing is small',
    body: `
      <p class="lede">The string pulls along itself, so only gravity pulls the bob back along its arc:</p>
      <div class="eq"><i>F</i> = −<i>mg</i> sin θ</div>
      <p>Not quite proportional to θ. But below about 10°, sin θ ≈ θ (in radians), so <i>F</i> ≈ −<i>mg</i>θ and it is SHM with</p>
      <div class="eq"><i>T</i> = 2π√(<i>L</i>/<i>g</i>) = ${f(M.P_T, 3)} s</div>
      <p>At ±${deg(M.PEND.th0)}° the true period is just ${f(100 * (M.periodExact(M.PEND.L, M.PEND.th0) / M.P_T - 1), 2)}% longer. At the bottom there is no restoring force and the bob is fastest: ½<i>mv</i>² = <i>mg</i>Δ<i>y</i> gives ${f(M.vmaxPendulum(M.PEND.L, M.PEND.th0), 3)} m/s.</p>
      <div class="charts">${chart({ x0: 0, x1: 60, y0: 0, y1: 1.05, ylabels: ['mg', '0'], xlabel: 'angle θ (°)', ylabel: 'restoring force', cursors: ['th'], label: 'mg sin theta against mg theta', h: 120,
        series: [{ pts: sample(d => Math.sin(d * M.DEG), 0, 60), tag: [46, Math.sin(46 * M.DEG) - 0.24, 'mg sin θ'] }, { cls: 'trend', pts: sample(d => d * M.DEG, 0, 60), tag: [40, 40 * M.DEG + 0.04, 'mgθ'] }, { cls: 'grid', pts: [[10, 0], [10, 1.05]] }],
        marks: [[10, Math.sin(10 * M.DEG), '10°', 6, 16]] })}</div>
      <p class="hintline">Arrows: ${(P_SCALE * 100).toFixed(0)} cm per newton. Click the bob to split its weight.</p>`,
    cam: { target: at('pendulum', 0, 2.05), az: -12, el: 5, dist: 9.5 }, lit: 'pendulum', scene: 'pendulum', look: {},
    fig: `A ${M.PEND.L.toFixed(1)} m pendulum, ±${deg(M.PEND.th0)}°`,
  },
  {
    kicker: '6.6', title: 'Double the period', sub: 'mind the square root',
    body: `
      <p class="lede">The period goes as the <i>square root</i> of <i>m</i>, 1/<i>k</i> or <i>L</i>. To double it, quadruple them.</p>
      <table class="data cols">
        <tr><th>mass on a spring</th><th>pendulum</th></tr>
        <tr><td><i>T</i> = 2π√(<i>m</i>/<i>k</i>)</td><td><i>T</i> = 2π√(<i>L</i>/<i>g</i>)</td></tr>
        <tr><td>2<i>T</i>: 4<i>m</i> or ¼<i>k</i></td><td>2<i>T</i>: 4<i>L</i></td></tr>
        <tr><td>${f(M.periodSpring(M.DOUBLE.m, M.K))} s → ${f(M.periodSpring(M.DOUBLE.m4, M.K))} s</td><td>${f(M.periodPendulum(M.DOUBLE.L))} s → ${f(M.periodPendulum(M.DOUBLE.L4))} s</td></tr>
      </table>
      <p><b>With numbers.</b> 8 kg on 2 N/m: <i>T</i> = 2π√(8/2) = 4π s. For 8π s, 8π = 2π√(<i>m</i>/2) gives <i>m</i> = 32 kg: four times.</p>
      <p><b>With proportions.</b> <i>T</i> ∝ √<i>m</i>, so 2<i>T</i> ∝ √(<u>&nbsp;?&nbsp;</u><i>m</i>): the square root of what is 2? Four. With <i>k</i> below the line, 2 = √(1/<i>x</i>) gives ¼. Scale only what you change; 2π and ½ ride along.</p>
      <div class="charts">${chart({ x0: 0, x1: 4, y0: 0, y1: 3.5, xlabel: 'mass on the 16 N/m spring (kg)', ylabel: 'period (s)', label: 'Period against mass: a square root', h: 120,
        series: [{ pts: sample(m => M.periodSpring(m, M.K), 0, 4) }], marks: [[1, M.periodSpring(1, M.K), 'm: 1.57 s', 6, 14], [4, M.periodSpring(4, M.K), '4m: 3.14 s', -64, 16]] })}</div>
      <p class="hintline">Click either pair to count their cycles.</p>`,
    cam: { target: at('double', -0.45, 1.6), az: -12, el: 10, dist: 16.5 }, lit: 'springs4', scene: 'double', look: {},
    fig: '4× mass, 4× length: 2× period',
  },
  {
    kicker: '6.7', title: 'What it ignores', sub: 'amplitude, and a pendulum’s mass',
    body: `
      <p class="lede">Amplitude does <b>not</b> change the period. It isn’t in either formula.</p>
      <p>The far block starts twice as far out. Twice the force, twice the acceleration, twice the distance in the same time: the two stay in step.</p>
      <p>Nor does a pendulum’s <b>mass</b>: <i>ma</i> = −<i>mg</i> sin θ, and the <i>m</i> cancels, as it does in free fall. The ${f(M.IGNORE.m2, 0)} kg bob keeps time with the ${f(M.IGNORE.m1, 0)} kg one.</p>
      <table class="data">
        <tr><th>change</th><th>period</th></tr>
        <tr><td>mass on a spring <i>m</i></td><td><i>T</i> ∝ √<i>m</i></td></tr>
        <tr><td>spring constant <i>k</i></td><td><i>T</i> ∝ 1/√<i>k</i></td></tr>
        <tr><td>pendulum length <i>L</i></td><td><i>T</i> ∝ √<i>L</i></td></tr>
        <tr><td>pendulum mass</td><td>no change</td></tr>
        <tr><td>amplitude (small, for a pendulum)</td><td>no change</td></tr>
      </table>`,
    cam: { target: at('ignore', -0.6, 1.2), az: -12, el: 11, dist: 13.5 }, lit: 'amp', scene: 'ignore', look: {},
    fig: 'Two amplitudes, two masses, one period each',
  },

  {
    kicker: '6.8 · AP Physics C', title: 'The SHM equation', sub: 'why the answer is a cosine',
    body: `
      <p class="lede">Put Hooke’s law into Σ<i>F</i> = <i>ma</i> and you get an equation for <i>x</i>(<i>t</i>):</p>
      <div class="eq">d²<i>x</i>/d<i>t</i>² = −(<i>k</i>/<i>m</i>) <i>x</i></div>
      <p>Try <i>x</i> = <i>A</i> cos(ω<i>t</i> + φ): twice differentiated, it is −<i>A</i>ω² cos(ω<i>t</i> + φ) = −ω²<i>x</i>. That fits for any <i>A</i> and φ if ω = √(<i>k</i>/<i>m</i>) = ${f(M.W, 1)} rad/s. <i>A</i> and φ come from the start, <i>x</i><sub>0</sub> = <i>A</i> cos φ and <i>v</i><sub>0</sub> = −<i>A</i>ω sin φ:</p>
      <div class="eq"><i>A</i> = √(<i>x</i><sub>0</sub>² + (<i>v</i><sub>0</sub>/ω)²) &nbsp; tan φ = −<i>v</i><sub>0</sub>/ω<i>x</i><sub>0</sub></div>
      <table class="data">
        <tr><th>start</th><th><i>x</i><sub>0</sub>, <i>v</i><sub>0</sub></th><th><i>A</i></th><th>φ</th></tr>
        ${M.STARTS.map((st, i) => `<tr><td>${i ? 'pushed' : 'let go'}</td><td>${f(st.x0)} m, ${f(st.v0, 1)} m/s</td><td>${f(st.A)} m</td><td>${f(st.phi / M.DEG, 1)}°</td></tr>`).join('')}
      </table>
      <div class="charts">${chart({ x0: 0, x1: 1, xlabels: ['0', '2T'], y0: -0.55, y1: 0.55, ylabels: ['0.5 m', '−0.5'], xlabel: 'time', ylabel: 'x', cursors: ['st0', 'st1'], label: 'Position against time for the two starts: same period, different amplitude and phase', h: 112,
        series: [{ cls: 'trend', pts: sample(u => M.start(0, u * T2).x, 0, 1, 160) }, { pts: sample(u => M.start(1, u * T2).x, 0, 1, 160) }] })}</div>
      <p class="hintline">Dashed: let go. Solid: pushed. Click either block.</p>`,
    cam: { target: at('ode', 0.05, 0.45), az: -8, el: 16, dist: 16.5 }, lit: 'starts', scene: 'ode', look: {},
    fig: 'One equation, two starts',
  },
  {
    kicker: '6.9 · AP Physics C', title: 'Physical pendulums', sub: 'a rigid body on a pivot',
    body: `
      <p class="lede">The weight of a rigid body acts at its centre of mass, a distance <i>d</i> below the pivot, and twists it back:</p>
      <div class="eq">τ = −<i>mgd</i> sin θ ≈ −<i>mgd</i> θ</div>
      <p><i>I</i>α = τ gives d²θ/d<i>t</i>² = −(<i>mgd</i>/<i>I</i>)θ: SHM, with ω = √(<i>mgd</i>/<i>I</i>) and</p>
      <div class="eq"><i>T</i> = 2π√(<i>I</i>/<i>mgd</i>)</div>
      <p><i>I</i> is about the pivot: <i>I</i> = <i>I</i><sub>cm</sub> + <i>md</i>² (parallel axes).</p>
      <table class="data">
        <tr><th></th><th><i>I</i></th><th><i>d</i></th><th><i>T</i></th></tr>
        <tr><td>bob, string <i>L</i></td><td><i>mL</i>²</td><td><i>L</i></td><td>2π√(<i>L</i>/<i>g</i>) = ${f(M.periodPendulum(M.ROD.L))} s</td></tr>
        <tr><td>rod <i>L</i>, by its end</td><td>⅓<i>mL</i>²</td><td><i>L</i>/2</td><td>2π√(2<i>L</i>/3<i>g</i>) = ${f(M.ROD.T)} s</td></tr>
        <tr><td>hoop on a nail</td><td>2<i>mR</i>²</td><td><i>R</i></td><td>2π√(2<i>R</i>/<i>g</i>) = ${f(M.HOOP.T)} s</td></tr>
      </table>
      <div class="charts">${chart({ x0: -5, x1: 0, xlabels: ['5 s ago', 'now'], y0: -9, y1: 9, ylabels: ['+8°', '−8°'], xlabel: 'time', ylabel: 'θ', cursors: ['rodNow', 'strNow'], label: 'Angle against time for the rod and a simple pendulum of the same length: the rod has the shorter period', h: 104,
        series: [{ cls: 'trend', live: 'strTh', fn: t => sample(u => M.pendulum(t + u, M.ROD.L, M.ROD.th0).th / M.DEG, -5, 0, 160) }, { live: 'rodTh', fn: t => sample(u => M.physical(M.ROD, t + u).th / M.DEG, -5, 0, 160) }] })}</div>
      <p class="hintline">Solid: the rod. Dashed: the string. Click the rod.</p>`,
    cam: { target: at('physical', 0.1, 2.1), az: -8, el: 6, dist: 11.5 }, lit: 'rod', scene: 'physical', look: {},
    fig: 'A string, a rod and a hoop, each on a pivot',
  },
  {
    kicker: '6.10 · AP Physics C', title: 'The torsion pendulum', sub: 'a twist, and a twist back',
    body: `
      <p class="lede">Hang a disc from a wire and turn it. The wire twists back in proportion to the angle, Hooke’s law for turning:</p>
      <div class="eq">τ = −κθ &nbsp;⇒&nbsp; <i>T</i> = 2π√(<i>I</i>/κ)</div>
      <p>since <i>I</i>α = −κθ is the spring’s equation with <i>m</i> → <i>I</i> and <i>k</i> → κ, the wire’s <b>torsion constant</b>, ${M.TORS.kappa} N·m/rad. The ${f(M.TORS.M, 1)} kg disc of radius ${f(M.TORS.R)} m has <i>I</i> = ½<i>MR</i>² = ${f(M.TORS.I, 3)} kg·m², so <i>T</i> = ${f(M.TORS.T, 2)} s.</p>
      <p>No small-angle step this time: the torque stays proportional to θ however far the wire is twisted (within its limit). At ${(M.TORS.th0 / M.DEG).toFixed(0)}° or at 5°, the period is the same.</p>
      <div class="charts">${chart({ x0: -60, x1: 60, y0: -0.3, y1: 0.3, ylabels: ['0.3 N·m', '−0.3'], xlabels: ['−60°', '60°'], xlabel: 'twist θ', ylabel: 'τ', cursors: ['tq'], label: 'Torque against twist angle: a straight line of slope minus kappa', h: 120,
        series: [{ pts: [[-60, M.TORS.kappa * 60 * M.DEG], [60, -M.TORS.kappa * 60 * M.DEG]], tag: [12, -0.08, 'slope −κ'] }] })}</div>
      <p class="hintline">Click the disc for the wire’s torque on it.</p>`,
    cam: { target: at('torsion', 0.1, 1.9), az: -14, el: 22, dist: 5.9 }, lit: 'disc', scene: 'torsion', look: {},
    fig: 'A disc twisting on a wire',
  },
  {
    kicker: '6.11', title: 'Everyday oscillators', sub: 'a car, a swing',
    body: `
      <p class="lede">Anything with a restoring force that grows with displacement oscillates.</p>
      <p><b>A car on its springs.</b> ${M.CAR.m} kg on four springs, ${(M.CAR.k / 1000).toFixed(0)} kN/m together. It sags ${f(100 * M.CAR.d, 1)} cm under its weight; push it down and it bounces with <i>T</i> = 2π√(<i>m</i>/<i>k</i>) = ${f(M.CAR.T)} s. (Real shock absorbers damp this out in a cycle or two; here they’re off.)</p>
      <p><b>A swing.</b> A child on a ${f(M.SWING.L, 1)} m swing is a pendulum: <i>T</i> = 2π√(<i>L</i>/<i>g</i>) = ${f(M.SWING.T)} s, small pushes or big, light child or heavy. That is why you push in rhythm.</p>
      <table class="data cols">
        <tr><th>mass on a spring</th><th>pendulum</th></tr>
        <tr><td>restoring −<i>kx</i></td><td>restoring −<i>mg</i> sin θ</td></tr>
        <tr><td>always SHM</td><td>SHM for small θ</td></tr>
        <tr><td>½<i>kA</i>² = ½<i>mv</i><sub>max</sub>²</td><td><i>mg</i>Δ<i>y</i> = ½<i>mv</i><sub>max</sub>²</td></tr>
      </table>`,
    cam: { target: at('life', -1.4, 1.4), az: -12, el: 8, dist: 19.5 }, lit: 'car', scene: 'life', look: {},
    fig: 'A car bouncing, a child swinging',
  },
];

// ---------- click a scene: what it breaks into ----------
const phase = t => { const s = M.spring(t); return Math.abs(s.x) > 0.97 * M.A ? 'at an end: stopped, force and acceleration largest' : Math.abs(s.x) < 0.03 * M.A ? 'at equilibrium: fastest, no force' : s.x * s.v < 0 ? 'heading in: speeding up' : 'heading out: slowing down'; };
export const PLATES = {
  spring: { text: `Velocity (black) and acceleration (red) on top of the restoring force. The acceleration always points toward the middle, like the force. The velocity points wherever the block is going. Heading in, they agree and the block speeds up; heading out, they disagree and it slows.`,
    facts: s => { const r = M.spring(s.t); return [['position x', `${f(r.x)} m`], ['velocity v', `${f(r.v)} m/s`], ['acceleration a', `${f(r.a)} m/s²`], ['now', phase(s.t)]]; } },
  hooke: { text: `The block shrinks to a dot: its free-body diagram. Weight and the normal force cancel. The spring force is the only one left, so it is the net force, and it always points back toward x = 0.`,
    facts: s => { const r = M.spring(s.t); return [['displacement x', `${f(r.x)} m`], ['F<sub>s</sub> = −kx', `${f(r.F)} N`], ['a = F<sub>s</sub>/m', `${f(r.a)} m/s²`], ['weight, normal', `${f(M.WEIGHT)} N each, cancelling`]]; } },
  trace: { text: `The red line is the tangent to the trace at the pen. The paper moves ${PAPER} m every second, so how far the pen moves sideways per second, the slope, is the block’s velocity. It is steepest as the pen crosses the middle and flat at the edges.`,
    facts: s => { const r = M.spring(s.t); return [['x', `${f(r.x)} m`], ['slope = v', `${f(r.v)} m/s`], ['a', `${f(r.a)} m/s²`], ['t', `${f(s.t % M.T0)} s of ${f(M.T0, 3)} s`]]; } },
  energy: { text: `The stack splits into its two parts. Their heights change every instant, but together they always reach the dashed line: ½kA².`,
    facts: s => { const r = M.spring(s.t); return [['kinetic ½mv²', `${f(r.KE)} J`], ['spring ½kx²', `${f(r.U)} J`], ['total', `${f(r.KE + r.U)} J`], ['x', `${f(r.x)} m`]]; } },
  hang: { text: `The free-body diagram. The spring always pulls up (it is always stretched here); the weight pulls down. Their difference, the red net force, is −ky: zero at equilibrium, largest at top and bottom.`,
    facts: s => { const r = M.hang(s.t); return [['y from equilibrium', `${f(r.y)} m`], ['spring k(d − y)', `${f(r.Fs)} N up`], ['weight mg', `${f(M.WEIGHT)} N down`], ['net = −ky', `${f(r.net)} N`]]; } },
  pendulum: { text: `The weight is replaced by its two parts (grey): along the string and along the arc. Along the string, mg cos θ is outweighed by the tension, which also bends the path into a circle. Along the arc, mg sin θ is the restoring force: it points back toward the bottom.`,
    facts: s => { const p = M.pendulum(s.t); return [['angle θ', `${f(p.th / M.DEG, 1)}°`], ['mg sin θ (restoring)', `${f(Math.abs(p.restoring), 3)} N`], ['mg cos θ', `${f(p.along, 3)} N`], ['tension T', `${f(p.tension, 3)} N`], ['speed', `${f(Math.abs(p.v), 3)} m/s`]]; } },
  springs4: { text: `The 4.0 kg block has four times the mass on the same 16 N/m spring. Every time it completes one cycle, the 1.0 kg block completes two.`,
    facts: s => [['1.0 kg: T', `${f(M.periodSpring(1, M.K), 3)} s`], ['4.0 kg: T', `${f(M.periodSpring(4, M.K), 3)} s`], ['cycles so far', `${f(s.t / M.periodSpring(1, M.K), 1)} and ${f(s.t / M.periodSpring(4, M.K), 1)}`]] },
  pend4: { text: `The long pendulum is four times the length of the short one. It swings once for every two swings of the short one.`,
    facts: s => [[`${f(M.DOUBLE.L)} m: T`, `${f(M.periodPendulum(M.DOUBLE.L), 3)} s`], [`${f(M.DOUBLE.L4, 1)} m: T`, `${f(M.periodPendulum(M.DOUBLE.L4), 3)} s`], ['swings so far', `${f(s.t / M.periodPendulum(M.DOUBLE.L), 1)} and ${f(s.t / M.periodPendulum(M.DOUBLE.L4), 1)}`]] },
  amp: { text: `Same block, same spring, one pulled out twice as far. At every instant the far one has twice the displacement, twice the force and twice the speed, so they arrive at the ends and the middle together.`,
    facts: s => [['small: x', `${f(M.spring(s.t, M.IGNORE.A1).x)} m`], ['large: x', `${f(M.spring(s.t, M.IGNORE.A2).x)} m`], ['ratio', '2, always'], ['both: T', `${f(M.T0, 3)} s`]] },
  bobs: { text: `Four times the mass means four times the restoring force, and four times the inertia to move. They cancel, and the bobs swing together.`,
    facts: s => [['1 kg: mg sin θ', `${f(Math.abs(M.pendulum(s.t, M.IGNORE.L, M.IGNORE.th0, 1).restoring), 3)} N`], ['4 kg: mg sin θ', `${f(Math.abs(M.pendulum(s.t, M.IGNORE.L, M.IGNORE.th0, 4).restoring), 3)} N`], ['both: T', `${f(M.periodPendulum(M.IGNORE.L), 3)} s`]] },

  starts: { text: `Each block is the shadow of a red point going round a circle of radius A at ω = √(k/m). Both points go round at the same rate; they start at different angles φ on circles of different size. The pushed block’s point starts 53° round, so its block is already heading in.`,
    facts: s => [0, 1].map(i => { const r = M.start(i, s.t), st = M.STARTS[i]; return [i ? 'pushed' : 'let go', `x ${f(r.x)} m, A ${f(st.A)} m, φ ${f(st.phi / M.DEG, 0)}°`]; }).concat([['ω, both', `${f(M.W, 1)} rad/s`], ['T, both', `${f(M.T0, 3)} s`]]) },
  string: { text: `A simple pendulum is a physical pendulum with all its mass at one point: I = mL² and d = L, so 2π√(I/mgd) = 2π√(L/g).`,
    facts: s => { const p = M.pendulum(s.t, M.ROD.L, M.ROD.th0); return [['angle', `${f(p.th / M.DEG, 1)}°`], ['I = mL²', `${f(M.ROD.m * M.ROD.L ** 2, 2)} kg·m²`], ['d', `${f(M.ROD.L, 2)} m`], ['T', `${f(M.periodPendulum(M.ROD.L), 3)} s`]]; } },
  rod: { text: `The weight acts at the centre of mass, d = L/2 below the pivot. Its part across the rod (red) has lever arm d, so τ = −mgd sin θ. The red mark at 2L/3 is the centre of oscillation: a bob on a string that long swings in step with the rod.`,
    facts: s => { const r = M.physical(M.ROD, s.t); return [['angle', `${f(r.th / M.DEG, 1)}°`], ['τ = −mgd sin θ', `${f(r.torque, 3)} N·m`], ['I = ⅓mL²', `${f(M.ROD.I, 3)} kg·m²`], ['α = τ/I', `${f(r.torque / M.ROD.I, 3)} rad/s²`], ['T', `${f(M.ROD.T, 3)} s`]]; } },
  hoop: { text: `All of a hoop’s mass is R from its centre, so I_cm = mR². The nail is R from the centre too, so the parallel-axis theorem adds another mR²: I = 2mR². With d = R, T = 2π√(2R/g), a simple pendulum as long as the hoop is wide.`,
    facts: s => { const h = M.physical(M.HOOP, s.t); return [['angle', `${f(h.th / M.DEG, 1)}°`], ['I = 2mR²', `${f(M.HOOP.I, 3)} kg·m²`], ['d = R', `${f(M.HOOP.d)} m`], ['τ', `${f(h.torque, 3)} N·m`], ['T', `${f(M.HOOP.T, 3)} s`]]; } },
  disc: { text: `The red arrow is the wire’s torque on the disc: always back toward θ = 0, and longer the further it is twisted (${TQ_ARC} rad of arc per N·m). At θ = 0 there is none, and the disc turns fastest.`,
    facts: s => { const r = M.torsion(s.t); return [['twist θ', `${f(r.th / M.DEG, 1)}°`], ['τ = −κθ', `${f(r.torque, 3)} N·m`], ['α = τ/I', `${f(r.alpha, 2)} rad/s²`], ['angular speed', `${f(Math.abs(r.om), 2)} rad/s`], ['T', `${f(M.TORS.T, 3)} s`]]; } },
  car: { text: `The body moves up and down on the four springs as one mass on one spring of their combined stiffness. Its acceleration (red) points back toward the resting height, largest at the top and bottom of each bounce.`,
    facts: s => { const r = M.shm(M.CAR.A, Math.sqrt(M.CAR.k / M.CAR.m), s.t); return [['height from rest', `${f(100 * r.x, 1)} cm`], ['acceleration', `${f(r.a)} m/s²`], ['period', `${f(M.CAR.T, 3)} s`], ['frequency', `${f(1 / M.CAR.T, 2)} Hz`]]; } },
  swing: { text: `A swing is a pendulum whose length runs from the branch to the child’s centre of mass. Its period depends only on that length and g.`,
    facts: s => { const p = M.pendulum(s.t, M.SWING.L, M.SWING.th0, M.SWING.m); return [['angle', `${f(p.th / M.DEG, 1)}°`], ['speed', `${f(Math.abs(p.v))} m/s`], ['period', `${f(M.SWING.T, 2)} s`], ['restoring force', `${f(Math.abs(p.restoring), 1)} N`]]; } },
};
