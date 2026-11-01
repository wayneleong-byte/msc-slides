// The chapter, page by page: text on the left, and for the figure on the right the camera,
// the one lit thing and what is shown. Every number comes from model.js.
import * as M from './model.js';
import { ST, RAIN_V, RIV, PULLS } from './world.js';

const f = (x, n = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);
const tau = M.STROBE;
const deg = r => (r * 180 / Math.PI).toFixed(1);

// ---------- small SVG charts for pages 1.7–1.10 (live parts are updated in main.js) ----------
const CW = 420, CH = 86, CP = { l: 40, r: 12, t: 9, b: 19 };
export const KR = {
  rain: { x0: 0, x1: 30, y0: 0, y1: 90 },
  map: { x0: -2, x1: 16, y0: 0, y1: 24 },
  pa: { x0: 0, x1: 5, y0: 0, y1: 6 }, pv: { x0: 0, x1: 5, y0: 0, y1: 12 }, px: { x0: 0, x1: 5, y0: 0, y1: 45 },
  cx: { x0: 0, x1: 2, y0: -3, y1: 3 }, cv: { x0: 0, x1: 2, y0: -3, y1: 9 }, ca: { x0: 0, x1: 2, y0: 0, y1: 12 },
};
export const KC = {
  sx: (x, R) => CP.l + (x - R.x0) / (R.x1 - R.x0) * (CW - CP.l - CP.r),
  sy: (y, R) => CP.t + (1 - (y - R.y0) / (R.y1 - R.y0)) * (CH - CP.t - CP.b),
};
const samples = (n, a, b, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });
function kchart(R, { series, xlabel, ylabel, label, live = '', marks = [] }) {
  const sx = x => KC.sx(x, R), sy = y => KC.sy(y, R);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const zero = R.y0 < 0 ? `<line class="zero" x1="${CP.l}" x2="${CW - CP.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  const fmt = v => (v < 0 ? '−' : '') + Math.abs(v);
  return `<svg class="chart" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="${label}">
    <rect class="frame" x="${CP.l}" y="${CP.t}" width="${CW - CP.l - CP.r}" height="${CH - CP.t - CP.b}"/>${zero}${live}${paths}${mk}
    <text class="ax" x="${CP.l - 6}" y="${sy(R.y1) + 4}" text-anchor="end">${fmt(R.y1)}</text><text class="ax" x="${CP.l - 6}" y="${sy(R.y0) + 4}" text-anchor="end">${fmt(R.y0)}</text>
    <text class="ax" x="${CP.l}" y="${CH - 7}">${R.x0}</text><text class="ax" x="${CW - CP.r}" y="${CH - 7}" text-anchor="end">${R.x1}</text>
    <text class="lab" x="${CP.l + 6}" y="${CP.t + 13}">${ylabel}</text><text class="ax" x="${(CP.l + CW - CP.r) / 2}" y="${CH - 7}" text-anchor="middle">${xlabel}</text>
  </svg>`;
}
// live pieces: a shaded area (filled by main.js), a red tangent, a cursor
const AREA = k => `<path data-area="${k}" style="fill:rgba(229,72,77,.18);stroke:none"/>`;
const TAN = k => `<line data-tan="${k}" style="stroke:#e5484d;stroke-width:1.4"/>`;
const CUR = k => `<circle class="cursor" r="4.5" data-cursor="${k}"/>`;

export const PAGES = [
  {
    kicker: 'Chapter 1', title: 'Kinematics', sub: 'the description of motion',
    body: `
      <p class="lede">Kinematics describes motion with three quantities: where something is, how fast it is moving, and how that is changing. It doesn’t ask why.</p>
      <p>Everything in this chapter comes from one ball, thrown straight up at ${f(M.VY0)} m/s. Once it leaves the hand, the only thing acting on it is gravity, so it is in <b>free fall</b>. That is true going up as well as coming down.</p>
      <p>It rises for ${f(M.T / 2)} s, stops ${f(M.H)} m up, and lands ${f(M.T)} s after launch. The figure runs at half speed.</p>`,
    cam: { target: [-1.0, 2.7, 0], az: 22, el: 7, dist: 21 }, lit: 'ball', look: { strobe: 1, level: 1 },
    fig: 'A ball thrown straight up',
  },
  {
    kicker: '1.1', title: 'Position', sub: 'displacement and distance',
    body: `
      <p class="lede"><b>Position</b> <i>y</i> is where the ball is, measured from an origin. Here the origin is the launch point, and up is positive.</p>
      <p><b>Displacement</b> Δ<i>y</i> = <i>y</i><sub>f</sub> − <i>y</i><sub>0</sub> is the net change in position. It is a vector: it has a size and a direction (the black arrow beside the axis).</p>
      <p><b>Distance</b> is the total length of the path. It is a scalar and never negative.</p>
      <table class="data">
        <tr><th></th><th>displacement</th><th>distance</th></tr>
        <tr><td>launch → top</td><td>+${f(M.H)} m</td><td>${f(M.H)} m</td></tr>
        <tr><td>launch → landing</td><td>0.00 m</td><td>${f(2 * M.H)} m</td></tr>
      </table>`,
    cam: { target: [-0.3, 2.9, 0], az: -16, el: 6, dist: 15 }, lit: 'staff', look: { disp: 1 },
    fig: 'The position axis',
  },
  {
    kicker: '1.2', title: 'Velocity', sub: 'and speed, which is not the same',
    body: `
      <p class="lede"><b>Velocity</b> <i>v</i> = Δ<i>y</i>/Δ<i>t</i> is how fast position changes, with a direction. <b>Speed</b> is its size, with no direction.</p>
      <p>The arrow is the velocity. It starts at +${f(M.VY0)} m/s, shrinks to zero at the top, then grows pointing down until −${f(M.VY0)} m/s at landing. The speeds at launch and landing are the same; the velocities are not.</p>
      <p>The same split applies to averages over the whole flight:</p>
      <table class="data">
        <tr><td>average velocity</td><td>Δ<i>y</i>/Δ<i>t</i> = 0 / ${f(M.T)} = 0 m/s</td></tr>
        <tr><td>average speed</td><td>distance/Δ<i>t</i> = ${f(2 * M.H)} / ${f(M.T)} = ${f(2 * M.H / M.T)} m/s</td></tr>
      </table>`,
    cam: { target: [0.1, 3.0, 0.2], az: 24, el: 8, dist: 18 }, lit: 'vArrow', look: {},
    fig: 'Velocity',
  },
  {
    kicker: '1.3', title: 'Acceleration', sub: 'the rate the velocity changes',
    body: `
      <p class="lede"><b>Acceleration</b> <i>a</i> = Δ<i>v</i>/Δ<i>t</i>. For this ball it is −${f(M.G)} m/s² the whole time: going up, at the top, and coming down. The red arrow never changes.</p>
      <p>The faint balls are a strobe photograph, one every ${f(tau, 1)} s. Going up, the gaps shrink by <i>g</i>τ² = ${f(M.G * tau * tau)} m each time. Coming down, the images land on exactly the same heights.</p>
      <p><b>Speeding up or slowing down?</b> Compare signs. When <i>v</i> and <i>a</i> have opposite signs the ball slows (going up). When they have the same sign it speeds up (coming down). Both are acceleration. There is no separate “deceleration”.</p>
      <p class="live" id="live-sign"></p>`,
    cam: { target: [0.1, 2.75, 0], az: -6, el: 5, dist: 15.5 }, lit: 'aArrow', look: { strobe: 1 },
    fig: 'Strobe, every ' + tau.toFixed(1) + ' s',
  },
  {
    kicker: '1.4', title: 'Motion graphs', sub: 'slopes and areas',
    body: `
      <p class="lede">The three graphs plot the same flight. The position graph is drawn to scale: its heights are the ball’s real heights.</p>
      <ul class="rules">
        <li>slope of <i>x</i>–<i>t</i> = velocity</li>
        <li>slope of <i>v</i>–<i>t</i> = acceleration</li>
        <li>area under <i>v</i>–<i>t</i> = displacement</li>
        <li>area under <i>a</i>–<i>t</i> = change in velocity</li>
      </ul>
      <p>Constant acceleration gives a flat <i>a</i>–<i>t</i> line, a straight <i>v</i>–<i>t</i> line and a parabola for <i>x</i>–<i>t</i>. Each graph is one “power” lower than the one above it.</p>
      <p class="hintline">Click a graph to see its slope and area.</p>`,
    cam: { target: [-7.6, 3.0, -1.0], az: 0, el: 3, dist: 40 }, lit: 'boardX', look: { level: 1 },
    fig: 'Position, velocity and acceleration against time',
  },
  {
    kicker: '1.5', title: 'The kinematic equations', sub: 'for constant acceleration only',
    body: `
      <p class="lede">Five quantities describe this motion: Δ<i>y</i>, <i>v</i><sub>0</sub>, <i>v</i>, <i>a</i>, <i>t</i>. Each equation leaves one out, so pick the one without the quantity you don’t know and don’t need.</p>
      <table class="data eqs">
        <tr><th>equation</th><th>leaves out</th></tr>
        <tr><td><i>v</i> = <i>v</i><sub>0</sub> + <i>at</i></td><td>Δ<i>y</i></td></tr>
        <tr><td>Δ<i>y</i> = <i>v</i><sub>0</sub><i>t</i> + ½<i>at</i>²</td><td><i>v</i></td></tr>
        <tr><td><i>v</i>² = <i>v</i><sub>0</sub>² + 2<i>a</i>Δ<i>y</i></td><td><i>t</i></td></tr>
        <tr><td>Δ<i>y</i> = ½(<i>v</i><sub>0</sub> + <i>v</i>)<i>t</i></td><td><i>a</i></td></tr>
        <tr><td>Δ<i>y</i> = <i>vt</i> − ½<i>at</i>²</td><td><i>v</i><sub>0</sub></td></tr>
      </table>
      <p>How high does it go? At the top <i>v</i> = 0, and <i>t</i> isn’t needed: 0 = ${f(M.VY0)}² + 2(−${f(M.G)})Δ<i>y</i>, so Δ<i>y</i> = ${f(M.H)} m.</p>`,
    cam: { target: [-3.2, 3.1, -0.4], az: 20, el: 15, dist: 34 }, lit: 'ball', look: { level: 1 },
    fig: 'One flight, five quantities',
  },
  {
    kicker: '1.6', title: 'Projectile motion', sub: 'two motions at once',
    body: `
      <p class="lede">A second ball is thrown at the same time with the same upward ${f(M.VY0)} m/s, plus ${f(M.VX)} m/s sideways.</p>
      <p>It stays level with the first ball the whole way and lands at the same moment. The vertical motion is free fall, and the sideways speed doesn’t change it. Its shadow on the floor moves in equal ${f(M.VX * tau)} m steps: the horizontal motion is uniform.</p>
      <table class="data cols">
        <tr><th>horizontal · uniform</th><th>vertical · free fall</th></tr>
        <tr><td><i>v</i><sub>x</sub> = ${f(M.VX)} m/s</td><td><i>v</i><sub>0</sub> = ${f(M.VY0)} m/s, <i>v</i> = −${f(M.VY0)} m/s</td></tr>
        <tr><td>Δ<i>x</i> = <i>v</i><sub>x</sub><i>t</i> = ${f(M.RANGE, 1)} m</td><td><i>a</i> = −${f(M.G)} m/s², Δ<i>y</i> = 0</td></tr>
        <tr><td><i>t</i> = ${f(M.T)} s</td><td><i>t</i> = ${f(M.T)} s</td></tr>
      </table>
      <p>At the top only the vertical part <i>v</i><sub>y</sub> is zero. The ball still moves sideways at ${f(M.VX)} m/s.</p>`,
    cam: { target: [4.6, 2.7, 0.6], az: -16, el: 13, dist: 33 }, lit: 'projV', look: { proj: 1, comp: 1 },
    fig: 'Same height, every instant',
  },
  {
    kicker: '1.7', title: 'Reference frames', sub: 'velocity depends on who is looking',
    body: `
      <p class="lede">Every velocity is measured relative to something. Rain falls ${f(M.RAIN.vr, 1)} m/s straight down relative to the road; from a car doing ${f(M.RAIN.vc, 1)} m/s it slants at ${f(M.vlen(M.V_RC))} m/s.</p>
      <p>Write <i>v</i><sub>AB</sub> for “A relative to B” (R rain, C car, G ground). Velocities chain, inner letters matching:</p>
      <div class="eq"><i>v</i><sub>AC</sub> = <i>v</i><sub>AB</sub> + <i>v</i><sub>BC</sub></div>
      <p>So <i>v</i><sub>RC</sub> = <i>v</i><sub>RG</sub> + <i>v</i><sub>GC</sub>, added tip to tail. Swapping letters flips the arrow: from the car the road moves backward, <i>v</i><sub>GC</sub> = −<i>v</i><sub>CG</sub>. The two parts are at right angles, so |<i>v</i><sub>RC</sub>| = √(${f(M.RAIN.vc, 1)}² + ${f(M.RAIN.vr, 1)}²) = ${f(M.vlen(M.V_RC))} m/s, at tan θ = ${f(M.RAIN.vc, 1)}/${f(M.RAIN.vr, 1)}, θ = ${f(M.RAIN_ANGLE, 1)}° from vertical. Faster car, more slant:</p>
      <div class="charts">${kchart(KR.rain, { xlabel: 'car speed (m/s)', ylabel: 'slant θ from vertical (°)', label: 'The rain’s slant, seen from the car, against the car’s speed',
        series: [{ pts: samples(60, 0, 30, M.rainAngleAt) }], marks: [[M.RAIN.vc, M.RAIN_ANGLE, `${f(M.RAIN_ANGLE, 1)}°`, 8, 16]] })}</div>
      <p class="hintline">Drawn 1:1. Arrows ${(RAIN_V * 100).toFixed(0)} cm per m/s. ¼ speed. Click the triangle for the angle.</p>`,
    cam: { target: [ST.rain + 11, 2.3, 0], az: -8, el: 10, dist: 60 }, lit: 'rainSum', look: {}, scene: 'rain',
    fig: 'The same rain, two frames',
  },
  {
    kicker: '1.8', title: 'Crossing a river', sub: 'two velocities, added tip to tail',
    body: `
      <p class="lede">A boat’s velocity relative to the shore is its velocity through the water plus the water’s velocity relative to the shore:</p>
      <div class="eq"><i>v</i><sub>BS</sub> = <i>v</i><sub>BW</sub> + <i>v</i><sub>WS</sub></div>
      <p>Both boats do ${f(M.RIVER.vb, 1)} m/s through water flowing at ${f(M.RIVER.vw, 1)} m/s, across ${M.RIVER.w} m.</p>
      <table class="data">
        <tr><th>m/s, s, m</th><th>aimed straight across</th><th>aimed ${deg(M.AIM_UP)}° upstream</th></tr>
        <tr><td>speed</td><td>√(${f(M.RIVER.vb, 1)}² + ${f(M.RIVER.vw, 1)}²) = ${f(M.vlen(M.vBS(0)))}</td><td>√(${f(M.RIVER.vb, 1)}² − ${f(M.RIVER.vw, 1)}²) = ${f(M.vlen(M.vBS(M.AIM_UP)))}</td></tr>
        <tr><td>time</td><td>${M.RIVER.w}/${f(M.RIVER.vb, 1)} = ${f(M.crossTime(0), 1)} s</td><td>${M.RIVER.w}/${f(M.vBS(M.AIM_UP)[1], 1)} = ${f(M.crossTime(M.AIM_UP), 1)} s</td></tr>
        <tr><td>drift</td><td>${f(M.RIVER.vw, 1)} × ${f(M.crossTime(0), 1)} = ${f(M.drift(0), 1)} m</td><td>0 m</td></tr>
      </table>
      <p>Only the across part gets a boat over, so straight across is fastest; the current just carries it downstream. To land opposite, turn upstream until sin θ = ${f(M.RIVER.vw, 1)}/${f(M.RIVER.vb, 1)}.</p>
      <div class="charts">${kchart(KR.map, { xlabel: 'downstream (m)', ylabel: 'across (m)', label: 'Both boats’ paths seen from above',
        live: CUR('boatA') + CUR('boatB'), series: [{ pts: [[0, 0], [M.drift(0), M.RIVER.w]], tag: [8.6, 12.5, 'straight across'] }, { pts: [[0, 0], [0, M.RIVER.w]], tag: [0.3, 3, 'upstream'] }] })}</div>
      <p class="hintline">Drawn 1 m = ${(RIV.s * 100).toFixed(0)} cm. Arrows ${(RIV.v * 100).toFixed(0)} cm per m/s. Shown at ${M.RIVER.rate}× speed.</p>`,
    cam: { target: [ST.river - 1.7, 0, 0.3], az: -4, el: 44, dist: 40 }, lit: 'boatA', look: {}, scene: 'river',
    fig: 'Pointed one way, carried another',
  },
  {
    kicker: '1.9 · AP Physics C', title: 'Calculus kinematics', sub: 'when the acceleration changes',
    body: `
      <p class="lede">The equations of 1.5 need constant <i>a</i>. This car’s <i>a</i> = ${f(M.PULL.a0, 1)} − ${f(M.PULL.k, 1)}<i>t</i> m/s² fades to zero at <i>t</i><sub>1</sub> = ${f(M.T1)} s, so integrate instead. It starts from rest at the line: <i>v</i><sub>0</sub> = 0, <i>x</i><sub>0</sub> = 0.</p>
      <div class="eq"><i>v</i> = <i>v</i><sub>0</sub> + ∫<i>a</i> d<i>t</i> = ${f(M.PULL.a0, 1)}<i>t</i> − ${f(M.PULL.k / 2)}<i>t</i>² &nbsp;→ ${f(M.V1, 1)} m/s</div>
      <div class="eq"><i>x</i> = <i>x</i><sub>0</sub> + ∫<i>v</i> d<i>t</i> = ${f(M.PULL.a0 / 2, 1)}<i>t</i>² − ${f(M.PULL.k / 6)}<i>t</i>³ &nbsp;→ ${f(M.X1, 1)} m</div>
      <div class="charts">
        ${kchart(KR.pa, { xlabel: 't (s)', ylabel: 'a (m/s²) · area = Δv', label: 'Acceleration against time, area shaded', live: AREA('pa') + CUR('pa'), series: [{ pts: samples(100, 0, 5, M.pa) }] })}
        ${kchart(KR.pv, { xlabel: 't (s)', ylabel: 'v (m/s) · area = Δx, slope = a', label: 'Velocity against time, area shaded', live: AREA('pv') + TAN('pv') + CUR('pv'), series: [{ pts: samples(100, 0, 5, M.pv) }] })}
        ${kchart(KR.px, { xlabel: 't (s)', ylabel: 'x (m) · slope = v', label: 'Position against time with its tangent', live: TAN('px') + CUR('px'), series: [{ pts: samples(100, 0, 5, M.px) }] })}
      </div>
      <p class="hintline">Shaded = integrals, red = derivatives. 1 m drawn as ${(PULLS.s * 100).toFixed(0)} cm.</p>`,
    cam: { target: [ST.pull + 4.4, 0.3, 0], az: -8, el: 24, dist: 22 }, lit: 'pull', look: {}, scene: 'pull',
    fig: 'a = ' + M.PULL.a0.toFixed(1) + ' − ' + M.PULL.k.toFixed(1) + 't',
  },
  {
    kicker: '1.10 · AP Physics C', title: 'Motion from x(t)', sub: 'differentiate down, integrate up',
    body: `
      <p class="lede">Given <i>x</i>(<i>t</i>), differentiate. For <i>x</i> = <i>t</i>³ − 3<i>t</i>:</p>
      <div class="eq"><i>v</i> = 3<i>t</i>² − 3 &nbsp;&nbsp; <i>a</i> = 6<i>t</i></div>
      <p>It starts left at ${f(-M.cv(0))} m/s and turns at <i>t</i> = ${f(M.T_TURN)} s, <i>x</i> = ${f(M.cx(M.T_TURN))} m. Over 2 s: displacement ${f(M.cx(2))} m, distance ${f(M.cdist(2))} m.</p>
      <p><b>Going back up</b> needs initial conditions: from <i>a</i> = 6<i>t</i>, <i>v</i> = 3<i>t</i>² + <i>C</i><sub>1</sub> and <i>x</i> = <i>t</i>³ + <i>C</i><sub>1</sub><i>t</i> + <i>C</i><sub>2</sub>; <i>v</i>(0) = −3 and <i>x</i>(0) = 0 give <i>C</i><sub>1</sub> = −3, <i>C</i><sub>2</sub> = 0.</p>
      <div class="charts">
        ${kchart(KR.cx, { xlabel: 't (s)', ylabel: 'x (m) · slope = v', label: 'Position against time', live: TAN('cx') + CUR('cx'), series: [{ pts: samples(100, 0, 2, M.cx) }] })}
        ${kchart(KR.cv, { xlabel: 't (s)', ylabel: 'v (m/s) · area = Δx', label: 'Velocity against time, signed area shaded', live: AREA('cv') + CUR('cv'), series: [{ pts: samples(100, 0, 2, M.cv) }] })}
        ${kchart(KR.ca, { xlabel: 't (s)', ylabel: 'a (m/s²) · area = Δv', label: 'Acceleration against time, area shaded', live: AREA('ca') + CUR('ca'), series: [{ pts: samples(100, 0, 2, M.ca) }] })}
      </div>
      <p class="hintline">Every 0.2 s; the trip back is drawn in front.</p>`,
    cam: { target: [ST.cube + 0.25, 0.25, 0], az: -6, el: 28, dist: 19.5 }, lit: 'bead', look: {}, scene: 'cube',
    fig: 'x = t³ − 3t',
  },
];

// ---------- click a concept: what it breaks into ----------
const sign = v => v > 1e-9 ? '+' : v < -1e-9 ? '−' : '';
export const PLATES = {
  ball: { text: `A ball in free fall. Nothing pushes it up after launch; it rises only because it is still moving up, and gravity changes that velocity by ${M.G.toFixed(2)} m/s every second.`,
    facts: t => [['time', `${t.toFixed(2)} s`], ['position y', `${M.y(t).toFixed(2)} m`], ['velocity v', `${sign(M.vy(t))}${Math.abs(M.vy(t)).toFixed(2)} m/s`], ['acceleration a', `−${M.G.toFixed(2)} m/s²`]] },
  staff: { text: `The vertical line is the position axis. Its zero is the launch point. The short mark rides at the ball’s height; the black arrow is the displacement from zero, and it returns to nothing when the ball lands, though the ball has travelled ${(2 * M.H).toFixed(2)} m.`,
    facts: t => [['position y', `${M.y(t).toFixed(2)} m`], ['displacement', `${sign(M.y(t))}${Math.abs(M.y(t)).toFixed(2)} m`], ['distance so far', `${M.distance(t).toFixed(2)} m`]] },
  vArrow: { text: `The arrow’s length is the speed and its direction is the sign of the velocity. It is drawn at a fixed scale, so twice as fast is twice as long.`,
    facts: t => [['velocity', `${sign(M.vy(t))}${Math.abs(M.vy(t)).toFixed(2)} m/s`], ['speed', `${Math.abs(M.vy(t)).toFixed(2)} m/s`], ['direction', M.vy(t) > 1e-9 ? 'up' : M.vy(t) < -1e-9 ? 'down' : 'none, for an instant']] },
  aArrow: { text: `The acceleration is the same at every instant, so this arrow never changes. Whether the ball speeds up or slows down depends on how the velocity’s sign compares with it.`,
    facts: t => [['acceleration', `−${M.G.toFixed(2)} m/s²`], ['velocity', `${sign(M.vy(t))}${Math.abs(M.vy(t)).toFixed(2)} m/s`], ['so the ball is', M.vy(t) > 1e-9 ? 'slowing down' : M.vy(t) < -1e-9 ? 'speeding up' : 'at the top']] },
  boardX: { text: `The red line is the tangent at this instant. Its slope (rise over run) is the velocity: steep at launch, flat at the top, steep the other way at landing.`,
    facts: t => [['slope = v', `${sign(M.vy(t))}${Math.abs(M.vy(t)).toFixed(2)} m/s`]] },
  boardV: { text: `A straight line, so the slope (the acceleration) is constant. The shaded area between the line and zero is the displacement so far. Area below zero counts as negative, so by landing the two halves cancel.`,
    facts: t => [['slope = a', `−${M.G.toFixed(2)} m/s²`], ['area = Δy', `${sign(M.areaUnderV(t))}${Math.abs(M.areaUnderV(t)).toFixed(2)} m`]] },
  boardA: { text: `A flat line: constant acceleration. The shaded area is the change in velocity so far, a·t.`,
    facts: t => [['area = Δv', `${t > 0 ? '−' : ''}${(M.G * t).toFixed(2)} m/s`], ['v = v₀ + Δv', `${sign(M.vy(t))}${Math.abs(M.vy(t)).toFixed(2)} m/s`]] },
  proj: { text: `Two independent motions at once: uniform sideways, free fall up and down. Each one is a one-dimensional problem with its own equations. They share only the time.`,
    facts: t => [['x', `${M.x(t).toFixed(2)} m`], ['y', `${M.y(t).toFixed(2)} m`], ['time', `${t.toFixed(2)} s`]] },
  projV: { text: `The velocity arrow breaks into a horizontal part that never changes and a vertical part that behaves exactly like the first ball’s velocity. Add them tip to tail and you get the arrow back.`,
    facts: t => [['vₓ', `${M.VX.toFixed(2)} m/s`], ['v_y', `${sign(M.vy(t))}${Math.abs(M.vy(t)).toFixed(2)} m/s`], ['speed √(vₓ² + v_y²)', `${Math.hypot(M.VX, M.vy(t)).toFixed(2)} m/s`]] },
  shadow: { text: `Light from straight above flattens the motion onto the floor. What is left is the horizontal motion: equal steps in equal times, because nothing acts sideways.`,
    facts: t => [['Δx so far', `${M.x(t).toFixed(2)} m`], ['step per ' + M.STROBE.toFixed(1) + ' s', `${(M.VX * M.STROBE).toFixed(2)} m`]] },
  rainRoad: { text: `From the road, each drop falls straight down at ${M.RAIN.vr.toFixed(1)} m/s and the car drives under it at ${M.RAIN.vc.toFixed(1)} m/s. Nothing here is slanted.`,
    facts: () => [['car, v_CG', `${M.RAIN.vc.toFixed(2)} m/s forward`], ['rain, v_RG', `${M.RAIN.vr.toFixed(2)} m/s down`], ['a drop’s path', 'vertical']] },
  rainCar: { text: `From the car, the car is at rest. The road streams backward at ${M.RAIN.vc.toFixed(1)} m/s, and every drop keeps its downward motion while also moving backward with the road, so its streak slants.`,
    facts: () => [['rain, v_RC', `${M.vlen(M.V_RC).toFixed(2)} m/s`], ['slant from vertical', `${M.RAIN_ANGLE.toFixed(1)}°`], ['road, v_GC', `${M.RAIN.vc.toFixed(2)} m/s backward`], ['car', '0 m/s']] },
  rainSum: { text: `Tip to tail: start with the rain’s velocity over the ground, then add the ground’s velocity relative to the car. The arrow from the first tail to the last tip is the rain seen from the car.`,
    facts: () => [['forward part', `${M.V_RC[0].toFixed(2).replace('-', '−')} m/s`], ['up part', `${M.V_RC[1].toFixed(2).replace('-', '−')} m/s`], ['|v_RC|', `${M.vlen(M.V_RC).toFixed(2)} m/s`], ['tan θ = 10.0 / 7.0', `θ = ${M.RAIN_ANGLE.toFixed(1)}°`]] },
  river: { text: `The water moves at ${M.RIVER.vw.toFixed(1)} m/s relative to the shore. Anything floating, like these leaves or a boat, is carried along at that speed on top of its own motion through the water.`,
    facts: (t, s) => [['current, v_WS', `${M.RIVER.vw.toFixed(2)} m/s downstream`], ['width', `${M.RIVER.w} m`], ['time', `${s.river.t.toFixed(1)} s`]] },
  boatA: { text: `Pointed straight across, it reaches the far side in w/v_b = ${M.crossTime(0).toFixed(1)} s, the fastest possible, but the current carries it ${M.drift(0).toFixed(1)} m downstream. The boat points one way and moves another.`,
    facts: (t, s) => boatFacts(0, s.river.t) },
  boatB: { text: `Turned ${deg(M.AIM_UP)}° upstream, its upstream part (${M.RIVER.vb.toFixed(1)} sin θ = ${M.RIVER.vw.toFixed(1)} m/s) cancels the current. It lands straight across, but only ${M.vBS(M.AIM_UP)[1].toFixed(1)} m/s is left to cross with, so it takes ${M.crossTime(M.AIM_UP).toFixed(1)} s.`,
    facts: (t, s) => boatFacts(M.AIM_UP, s.river.t) },
  pull: { text: `Its acceleration is not constant, so the kinematic equations of 1.5 don’t apply. Its velocity is the area under a–t so far, and its position the area under v–t. Gaps between the outlines keep growing, but by less each time, until they are equal once a = 0.`,
    facts: (t, s) => { const u = s.pull.t; return [['time', `${u.toFixed(2)} s`], ['x = ∫v dt', `${M.px(u).toFixed(2)} m`], ['v = ∫a dt', `${M.pv(u).toFixed(2)} m/s`], ['a', `${M.pa(u).toFixed(2)} m/s²`]]; } },
  pullA: { text: `a = ${M.PULL.a0.toFixed(1)} − ${M.PULL.k.toFixed(1)}t: the slope of the v–t graph, falling steadily to zero at t₁ = ${M.T1.toFixed(2)} s. Its rate of change, da/dt = −${M.PULL.k.toFixed(1)} m/s³, is called the jerk.`,
    facts: (t, s) => { const u = s.pull.t; return [['a = dv/dt', `${M.pa(u).toFixed(2)} m/s²`], ['da/dt', u < M.T1 ? `−${M.PULL.k.toFixed(2)} m/s³` : '0'], ['area so far = v', `${M.pv(u).toFixed(2)} m/s`]]; } },
  bead: { text: `x = t³ − 3t. Differentiate once for the velocity, twice for the acceleration. At the turn, v = 0 but a = ${M.ca(M.T_TURN).toFixed(1)} m/s²: zero velocity does not mean zero acceleration.`,
    facts: (t, s) => { const u = s.cube.t, v = M.cv(u), a = M.ca(u); return [['time', `${u.toFixed(2)} s`], ['x', `${f(M.cx(u))} m`], ['v = 3t² − 3', `${f(v)} m/s`], ['a = 6t', `${f(a)} m/s²`], ['so it is', Math.abs(v) < 0.02 ? 'turning around' : v * a > 0 ? 'speeding up' : a === 0 ? 'a = 0, for an instant' : 'slowing down']]; } },
  cubeLine: { text: `The black arrow is the displacement from the start. The particle goes 2 m left and then 4 m right: the displacement at 2 s is +2 m, but the distance travelled is 6 m.`,
    facts: (t, s) => { const u = s.cube.t; return [['position x', `${f(M.cx(u))} m`], ['displacement', `${f(M.cx(u))} m`], ['distance so far', `${M.cdist(u).toFixed(2)} m`]]; } },
};
function boatFacts(phi, t) {
  const tt = Math.min(t, M.crossTime(phi)), [dx, dy] = M.boatPos(phi, t);
  return [['time', `${tt.toFixed(1)} s`], ['across', `${dy.toFixed(1)} of ${M.RIVER.w} m`], ['downstream', `${Math.abs(dx) < 0.05 ? '0.0' : dx.toFixed(1)} m`], ['speed |v_BS|', `${M.vlen(M.vBS(phi)).toFixed(2)} m/s`], ['lands', `${M.crossTime(phi).toFixed(1)} s, ${Math.abs(M.drift(phi)) < 0.05 ? '0.0' : M.drift(phi).toFixed(1)} m down`]];
}

