// Chapter 3, page by page (after the AP Physics 1 organizer, Units 4 and 6, and AP Physics C
// gravitation and orbits). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, V_SCALE, A_SCALE, F_SCALE, ROAD, COASTER, SPACE, ORBIT, WELLS } from './world.js';

const f = (x, n = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);
const cm = x => (x * 100).toFixed(x * 100 < 1 ? 1 : 0);
const deg = r => r * 180 / Math.PI;

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
const curve = (x0, x1, fn, n = 60) => Array.from({ length: n + 1 }, (_, i) => { const x = x0 + (x1 - x0) * i / n; return [x, fn(x)]; });

const lapW = M.period(M.V1, M.BALL.r);
const vb = M.loopV(0), Nb = M.loopN(0), Nt = M.loopN(Math.PI);
const r1 = M.SAT.r1, r2 = M.SAT.r2, RE = M.EARTH.R;
const Kp = 0.5 * M.SAT_M * M.ELL.vp ** 2, Ka = 0.5 * M.SAT_M * M.ELL.va ** 2;
const dE = M.circE(M.SAT.r2) - M.circE(M.SAT.r1), dU = M.Ugrav(M.SAT.r2) - M.Ugrav(M.SAT.r1);
const F1 = M.gravF(M.SPHERES.m1, M.SPHERES.m2, M.SPHERES.rMin), F3 = M.gravF(M.SPHERES.m1, M.SPHERES.m2, M.SPHERES.rMax);

export const PAGES = [
  {
    kicker: 'Chapter 3', title: 'Circular motion', sub: 'steady speed, still accelerating',
    body: `
      <p class="lede">A ball whirled round on a string keeps the same speed, yet it is accelerating the whole time. Its velocity changes <b>direction</b> at every point on the circle.</p>
      <p>Velocity is a vector: it changes if its size <i>or</i> its direction changes. This ball circles a smooth table at ${f(M.V1, 1)} m/s on a ${f(M.BALL.r)} m string; the faint images, every ⅛ lap, are evenly spaced.</p>
      <table class="data">
        <tr><td><i>v</i> (blue)</td><td>tangent to the circle</td></tr>
        <tr><td><i>a</i><sub>c</sub> = <i>v</i>²/<i>r</i> (red)</td><td>${f(M.ac(M.V1, M.BALL.r))} m/s², to the centre, ⟂ <i>v</i></td></tr>
        <tr><td><i>T</i> = 2π<i>r</i>/<i>v</i></td><td>${f(lapW)} s per lap</td></tr>
      </table>
      <div class="charts">${chart({ x0: 0, x1: 5, y0: -3, y1: 3, xlabel: 'time (s)', ylabel: 'velocity (m/s)', cursor: 'whirl', label: 'One component of the velocity swings while the speed stays constant',
        series: [{ pts: curve(0, 5, t => M.uniform(M.BALL.r, M.V1, t).vx, 120), tag: [0.15, -2.2, 'v<tspan dy="3" font-size="8">x</tspan>'] }, { cls: 'trend', pts: [[0, M.V1], [5, M.V1]], tag: [3.6, M.V1 + 0.1, 'speed'] }] })}</div>
      <p class="hintline">Click the ball to find Δv. ${cm(V_SCALE)} cm per m/s, ${cm(A_SCALE)} cm per m/s².</p>`,
    cam: { target: [STATIONS.whirl, 0.1, 0.05], az: -18, el: 40, dist: 5.2 }, lit: 'whirl', scene: 'whirl', look: {},
    fig: 'A ball on a string, seen from above',
  },
  {
    kicker: '3.1', title: 'Centripetal force', sub: 'a job, not a new force',
    body: `
      <p class="lede">Acceleration toward the centre needs a net force toward the centre: Σ<i>F</i> = <i>ma</i><sub>c</sub> = <i>mv</i>²/<i>r</i>. That is not a new kind of force, just whichever real force points inward:</p>
      <table class="data">
        <tr><td>ball on a string</td><td>tension <i>T</i></td></tr>
        <tr><td>water in a swung pail</td><td>normal force from the pail</td></tr>
        <tr><td>car on a flat curve</td><td>static friction <i>f</i><sub>s</sub></td></tr>
        <tr><td>car on a banked curve</td><td>part of the normal force</td></tr>
        <tr><td>Moon round the Earth</td><td>gravity <i>F</i><sub>g</sub></td></tr>
      </table>
      <p>Here <i>F</i><sub>N</sub> = <i>mg</i>, and <i>T</i> = <i>mv</i>²/<i>r</i>: ${f(M.tension(M.V1))} N at ${f(M.V1, 1)} m/s, <b>${f(M.tension(M.V2))} N</b> at ${f(M.V2, 1)} m/s. Double the speed, four times the tension; halve the radius, double it.</p>
      <div class="charts">${chart({ x0: 0, x1: 5, y0: 0, y1: 6, xlabel: 'speed v (m/s)', ylabel: 'tension T (N)', label: 'Tension grows as speed squared',
        series: [{ pts: curve(0, 5, v => Math.min(M.tension(v), 6)) }], marks: [[M.V1, M.tension(M.V1), `${f(M.tension(M.V1), 1)} N`], [M.V2, M.tension(M.V2), `${f(M.tension(M.V2), 1)} N`, -44, 4]] })}</div>
      <p class="hintline">Click a ball: free-body diagram. ${cm(F_SCALE)} cm per N.</p>`,
    cam: { target: [STATIONS.double, 0.1, 0.1], az: -10, el: 38, dist: 11.5 }, lit: 'double', scene: 'double', look: {},
    fig: '2.0 m/s and 4.0 m/s on the same string',
  },
  {
    kicker: '3.2', title: 'A car on a curve', sub: 'friction does the turning',
    body: `
      <p class="lede">On a flat curve the only sideways force on the car is the road’s <b>static friction</b>, toward the centre. Static, because the tyres don’t slide sideways; it can be at most μ<sub>s</sub><i>F</i><sub>N</sub>.</p>
      <table class="data eqs">
        <tr><td>Σ<i>F</i><sub>y</sub> = 0</td><td><i>F</i><sub>N</sub> = <i>mg</i> = ${f(M.CAR.W / 1000)} kN</td></tr>
        <tr><td>Σ<i>F</i><sub>x</sub> = <i>ma</i><sub>c</sub></td><td><i>f</i><sub>s</sub> = <i>mv</i>²/<i>r</i> = ${f(M.CAR.f / 1000)} of ${f(M.CAR.fmax / 1000)} kN</td></tr>
      </table>
      <p>μ<sub>s</sub><i>mg</i> = <i>mv</i>²/<i>r</i>; the mass cancels:</p>
      <div class="eq"><i>v</i><sub>max</sub> = √(μ<sub>s</sub><i>gr</i>) = ${f(M.CAR.vmax)} m/s</div>
      <p>Faster than that, the car slides off along the tangent: straight on, not flung outward.</p>
      <div class="charts">${chart({ x0: 0, x1: 12, y0: 0, y1: 16, xlabel: 'speed v (m/s)', ylabel: 'friction needed (kN)', cursor: 'flatcar', label: 'Friction needed against speed, and the most the road can give',
        series: [{ pts: curve(0, 12, v => Math.min(M.CAR.m * v * v / M.CAR.r / 1000, 16)) }, { cls: 'trend', pts: [[0, M.CAR.fmax / 1000], [12, M.CAR.fmax / 1000]], tag: [0.3, M.CAR.fmax / 1000 + 0.3, 'μs·mg'] }],
        marks: [[M.CAR.vmax, M.CAR.fmax / 1000, `v<tspan dy="3" font-size="8">max</tspan><tspan dy="-3"> ${f(M.CAR.vmax, 1)}</tspan>`, 8, 18]] })}</div>
      <p class="hintline">Click the car for its free-body diagram. Drawn 1:4; ${cm(ROAD.kN)} cm per kN, ${cm(ROAD.v)} cm per m/s.</p>`,
    cam: { target: [STATIONS.flatcar, 0.2, 0.3], az: -14, el: 48, dist: 21 }, lit: 'flatcar', scene: 'flatcar', look: {},
    fig: `A ${M.CAR.r} m curve at ${f(M.CAR.v, 1)} m/s`,
  },
  {
    kicker: '3.3', title: 'Swung in a cone', sub: 'the string tilts',
    body: `
      <p class="lede">Whirl a ball on a string and the string can’t stay level: something must hold the ball up against gravity. The string tilts down until its pull does both jobs.</p>
      <p>Measure θ from the vertical. Then the horizontal part uses sin θ and the vertical part uses cos θ:</p>
      <table class="data eqs">
        <tr><td>Σ<i>F</i><sub>y</sub> = 0</td><td><i>T</i> cos θ = <i>mg</i>, so <i>T</i> = <i>mg</i>/cos θ = ${f(M.CONE.T)} N</td></tr>
        <tr><td>Σ<i>F</i><sub>x</sub> = <i>ma</i><sub>c</sub></td><td><i>T</i> sin θ = <i>mv</i>²/<i>r</i> = ${f(M.CONE.Tx)} N</td></tr>
      </table>
      <p>Divide one by the other and the tension cancels:</p>
      <div class="eq"><i>g</i> tan θ = <i>v</i>²/<i>r</i> = <i>a</i><sub>c</sub></div>
      <p>Here a ${f(M.CONE.L, 1)} m string at θ = ${M.CONE.thetaDeg}° traces a circle of <i>r</i> = ${f(M.CONE.r)} m, so the ball must go ${f(M.CONE.v)} m/s, once round every ${f(M.period(M.CONE.v, M.CONE.r))} s. A perfectly level string is impossible: nothing would balance <i>mg</i>.</p>
      <p class="hintline">Click the ball to split the tension. Forces ${cm(F_SCALE)} cm per newton.</p>`,
    cam: { target: [STATIONS.cone, 1.25, 0], az: -14, el: 24, dist: 5.6 }, lit: 'cone', scene: 'cone', look: {},
    fig: `A ${f(M.CONE.L, 1)} m string at ${M.CONE.thetaDeg}° from the vertical`,
  },
  {
    kicker: '3.4', title: 'Vertical circles', sub: 'top and bottom of a loop',
    body: `
      <p class="lede">In a vertical loop gravity joins in. At the bottom and top the centre is straight up or down, so there the net force is vertical: <i>mv</i>²/<i>r</i>.</p>
      <table class="data eqs">
        <tr><td>bottom: <i>F</i><sub>N</sub> − <i>mg</i> = <i>mv</i>²/<i>r</i></td><td><i>F</i><sub>N</sub> = <i>m</i>(<i>v</i>²/<i>r</i> + <i>g</i>) = ${f(Nb / 1000, 1)} kN</td></tr>
        <tr><td>top: <i>F</i><sub>N</sub> + <i>mg</i> = <i>mv</i>²/<i>r</i></td><td><i>F</i><sub>N</sub> = <i>m</i>(<i>v</i>²/<i>r</i> − <i>g</i>) = ${f(Nt / 1000, 1)} kN</td></tr>
      </table>
      <div class="eq"><i>F</i><sub>N top</sub> = 0: <i>v</i><sub>min</sub> = √(<i>gr</i>) = ${f(M.LOOP.vmin)} m/s</div>
      <p>Same for a pail of water swung overhead. This ${M.LOOP.m} kg cart tops the loop at ${f(M.LOOP.vTop, 1)} m/s and reaches ${f(vb, 1)} m/s at the bottom; in between, part of the net force speeds it up or slows it down.</p>
      <div class="charts">${chart({ x0: 0, x1: 360, y0: 0, y1: 35, xlabel: 'angle round the loop from the bottom (°)', ylabel: 'normal force (kN)', cursor: 'loop', label: 'Normal force round the loop',
        series: [{ pts: curve(0, 360, d => M.loopN(d * Math.PI / 180) / 1000, 90) }, { cls: 'trend', pts: [[0, M.LOOP.W / 1000], [360, M.LOOP.W / 1000]], tag: [8, M.LOOP.W / 1000 + 0.5, 'mg'] }],
        marks: [[180, Nt / 1000, `top ${f(Nt / 1000, 1)}`, 10, -10]] })}</div>
      <p class="hintline">Click the cart for the free-body diagrams. Drawn 1:5, forces ${cm(COASTER.kN)} cm per kN.</p>`,
    cam: { target: [STATIONS.loop + 0.75, 1.3, 0], az: -8, el: 6, dist: 12 }, lit: 'loop', scene: 'loop', look: {},
    fig: `A ${f(M.LOOP.r, 0)} m loop, ${f(M.LOOP.vTop, 0)} m/s over the top`,
  },
  {
    kicker: '3.5', title: 'Banked curves', sub: 'tilt the road',
    body: `
      <p class="lede">Tilt the road and the normal force tilts with it, by the bank angle θ. Its horizontal part turns the car, with no friction at all.</p>
      <table class="data eqs">
        <tr><td>Σ<i>F</i><sub>y</sub> = 0</td><td><i>F</i><sub>N</sub> cos θ = <i>mg</i>, <i>F</i><sub>N</sub> = ${f(M.BANK.N / 1000)} kN</td></tr>
        <tr><td>Σ<i>F</i><sub>x</sub> = <i>ma</i><sub>c</sub></td><td><i>F</i><sub>N</sub> sin θ = <i>mv</i>²/<i>r</i> = ${f(M.BANK.Nx / 1000)} kN</td></tr>
      </table>
      <div class="eq">tan θ = <i>v</i>²/(<i>rg</i>)</div>
      <p>Each bank has one proper speed, √(<i>rg</i> tan θ): ${f(M.BANK.v)} m/s here. Faster, the car drifts up the bank; slower, it slides down.</p>
      <div class="charts">${chart({ x0: 0, x1: 45, y0: 0, y1: 10, xlabel: 'bank angle θ (°)', ylabel: 'proper speed (m/s)', label: 'Proper speed against bank angle for a 10 m curve',
        series: [{ pts: curve(0, 45, d => M.bankSpeed(d)) }], marks: [[M.BANK.thetaDeg, M.BANK.v, `${M.BANK.thetaDeg}°: ${f(M.BANK.v)} m/s`]] })}</div>
      <p class="hintline">Click the car to split the normal force. Drawn 1:4, forces ${cm(ROAD.kN)} cm per kN.</p>`,
    cam: { target: [STATIONS.bank, 0.3, 0.3], az: -14, el: 30, dist: 21 }, lit: 'bank', scene: 'bank', look: {},
    fig: `Banked at ${M.BANK.thetaDeg}°, no friction`,
  },
  {
    kicker: '3.6', title: 'Angular velocity', sub: 'v = rω',
    body: `
      <p class="lede">Every point on a spinning disc turns through the same angle in the same time: one <b>angular velocity</b> ω. Points farther out cover more distance, so they move faster.</p>
      <table class="data eqs">
        <tr><td>ω = Δθ/<i>t</i></td><td>rad/s (or rpm)</td></tr>
        <tr><td><i>s</i> = <i>r</i>Δθ</td><td>arc length; 1 rad when <i>s</i> = <i>r</i></td></tr>
        <tr><td><i>v</i> = <i>r</i>ω</td><td>tangential speed; <i>T</i> = 2π/ω</td></tr>
      </table>
      <p>At ω = ${f(M.DISC.w)} rad/s (${f(M.radToRpm(M.DISC.w), 1)} rpm; rpm × 2π/60 = rad/s) the block at ${f(M.DISC.r1)} m moves at ${f(M.DISC.v1)} m/s, the one twice as far out at ${f(M.DISC.v2)} m/s. Both take ${f(M.DISC.T)} s per turn; mass doesn’t matter.</p>
      <div class="charts">${chart({ x0: 0, x1: 1, y0: 0, y1: 3, xlabel: 'distance from the centre r (m)', ylabel: 'speed v (m/s)', label: 'Speed grows in proportion to radius',
        series: [{ pts: [[0, 0], [1, M.DISC.w]], tag: [0.06, 1.0, 'slope = ω'] }], marks: [[M.DISC.r1, M.DISC.v1, 'v₁'], [M.DISC.r2, M.DISC.v2, 'v₂']] })}</div>
      <p class="hintline">Click the disc to see one radian swept.</p>`,
    cam: { target: [STATIONS.disc, 0.05, 0.05], az: -16, el: 40, dist: 5.6 }, lit: 'disc', scene: 'disc', look: {},
    fig: `ω = ${f(M.DISC.w, 1)} rad/s`,
  },
  {
    kicker: '3.7', title: 'Gravitation', sub: 'every mass pulls every other',
    body: `
      <p class="lede">Every mass attracts every other with a force proportional to both masses and inversely proportional to the square of the distance between their centres.</p>
      <div class="eq"><i>F</i><sub>g</sub> = <i>G m</i><sub>1</sub><i>m</i><sub>2</sub> / <i>r</i>²</div>
      <p><i>G</i> = 6.67 × 10⁻¹¹ N·m²/kg². These spheres pull with ${f(F1 * 1e6, 0)} μN at ${f(M.SPHERES.rMin, 1)} m (the weight of half a grain of rice); three times as far, a ninth: ${f(F3 * 1e6, 1)} μN. The Earth gives <i>g</i> = <i>GM</i><sub>E</sub>/<i>R</i><sub>E</sub>² = ${f(M.EARTH.g)} m/s²: ${f(M.gravF(M.EARTH.M, M.PERSON, M.EARTH.R), 0)} N on an ${M.PERSON} kg person, just <i>mg</i>.</p>
      <table class="data">
        <tr><td>2<i>m</i><sub>1</sub>, 2<i>m</i><sub>2</sub>, 3<i>r</i></td><td>2 × 2 / 3²</td><td>4/9 <i>F</i></td></tr>
        <tr><td>4<i>m</i><sub>1</sub>, <i>m</i><sub>2</sub>, ½<i>r</i></td><td>4 × 1 / 0.5²</td><td>${f(M.ratio(4, 1, 0.5), 0)} <i>F</i></td></tr>
      </table>
      <div class="charts">${chart({ x0: 0.8, x1: 3.2, y0: 0, y1: 220, xlabel: 'distance between centres r (m)', ylabel: 'force (μN)', cursor: 'gravity', label: 'Gravitational force against distance: inverse square',
        series: [{ pts: curve(0.8, 3.2, r => M.gravF(M.SPHERES.m1, M.SPHERES.m2, r) * 1e6, 80) }] })}</div>
      <p class="hintline">Click to compare accelerations. ${f(SPACE.uN * 1000, 0)} mm per μN.</p>`,
    cam: { target: [STATIONS.gravity + 0.15, 0.85, 0], az: -10, el: 12, dist: 14 }, lit: 'gravity', scene: 'gravity', look: {},
    fig: `${M.SPHERES.m1} kg and ${M.SPHERES.m2} kg of iron`,
  },
  {
    kicker: '3.8', title: 'Orbits', sub: 'gravity on a string',
    body: `
      <p class="lede">A satellite in a circular orbit is a ball on a string, with gravity as the string. For any problem in space, start from <i>F</i><sub>g</sub> = <i>F</i><sub>c</sub>:</p>
      <div class="eq"><i>GMm</i>/<i>r</i>² = <i>mv</i>²/<i>r</i> &nbsp;→&nbsp; <i>v</i> = √(<i>GM</i>/<i>r</i>)</div>
      <p>The satellite’s own mass cancels. Put in <i>v</i> = 2π<i>r</i>/<i>T</i> and out comes Kepler’s third law, <i>T</i>² ∝ <i>r</i>³:</p>
      <div class="eq"><i>T</i>² = (4π²/<i>GM</i>) <i>r</i>³</div>
      <table class="data">
        <tr><th>orbit radius</th><th><i>v</i></th><th><i>T</i></th><th><i>a</i></th></tr>
        <tr><td>2 <i>R</i><sub>E</sub> = ${f(r1 / 1e6 * 1000, 0)} km</td><td>${f(M.orbitV(r1) / 1000)} km/s</td><td>${f(M.orbitT(r1) / 3600)} h</td><td>${f(M.orbitA(r1))} m/s²</td></tr>
        <tr><td>4 <i>R</i><sub>E</sub> = ${f(r2 / 1e6 * 1000, 0)} km</td><td>${f(M.orbitV(r2) / 1000)} km/s</td><td>${f(M.orbitT(r2) / 3600)} h</td><td>${f(M.orbitA(r2))} m/s²</td></tr>
      </table>
      <p>Higher orbit: longer period, <b>slower</b> speed. That is the opposite of the disc, where every point shares one ω and the outside moves fastest. Real orbits are ellipses with the planet at one focus (Kepler’s first law), sweeping equal areas in equal times (his second). The next page draws one.</p>
      <p class="hintline">Shown 3600× faster: a second here is an hour. 1 m per ${f(1 / ORBIT.draw / 1e6 * 1000, 0)} km; ${cm(ORBIT.v)} cm per km/s, ${cm(ORBIT.a)} cm per m/s².</p>`,
    cam: { target: [STATIONS.orbit, 1.6, 0.2], az: -14, el: 36, dist: 34 }, lit: 'orbit', scene: 'orbit', look: {},
    fig: 'Orbits at 2 and 4 Earth radii',
  },
  {
    kicker: '3.9', title: 'Elliptical orbits', sub: 'equal areas in equal times',
    body: `
      <p class="lede">Most orbits are ellipses, with the Earth at one focus (Kepler’s first law). Gravity has no torque about the Earth’s centre, so angular momentum <i>mvr</i><sub>⊥</sub> is conserved. At perigee and apogee <i>v</i> ⟂ <i>r</i>:</p>
      <div class="eq"><i>r</i><sub>p</sub><i>v</i><sub>p</sub> = <i>r</i><sub>a</sub><i>v</i><sub>a</sub></div>
      <table class="data">
        <tr><td>perigee, 2 <i>R</i><sub>E</sub></td><td><i>v</i><sub>p</sub> = ${f(M.ELL.vp / 1000)} km/s</td></tr>
        <tr><td>apogee, 6 <i>R</i><sub>E</sub></td><td><i>v</i><sub>a</sub> = ${f(M.ELL.va / 1000)} km/s</td></tr>
      </table>
      <p>Three times as far, a third as fast. The radius sweeps equal areas in equal times (Kepler’s second law); his third holds with the semi-major axis <i>a</i> for <i>r</i>.</p>
      <div class="charts">${chart({ x0: 0, x1: 360, y0: 0, y1: 8, xlabel: 'angle from perigee (°)', ylabel: 'speed (km/s)', cursor: 'kepler', label: 'Speed round the ellipse: fastest at perigee, slowest at apogee',
        series: [{ pts: curve(0, 360, d => M.ellV(d * Math.PI / 180) / 1000, 120) }],
        marks: [[180, M.ELL.va / 1000, `apogee ${f(M.ELL.va / 1000)}`, -36, -12]] })}</div>
      <p class="hintline">Click for perigee and apogee. Wedges: an hour each (blue: the last). 3600×; ${cm(ORBIT.v)} cm per km/s.</p>`,
    cam: { target: [STATIONS.kepler + 0.6, 1.8, 0.3], az: -6, el: 62, dist: 41 }, lit: 'kepler', scene: 'kepler', look: {},
    fig: 'Perigee 2, apogee 6 Earth radii',
  },
  {
    kicker: '3.10', title: 'Energy on an orbit', sub: 'kinetic and potential trade',
    body: `
      <p class="lede">Only gravity acts, and gravity is conservative, so the satellite–Earth system keeps its mechanical energy:</p>
      <div class="eq">½<i>mv</i>² − <i>GMm</i>/<i>r</i> = <i>E</i>, constant</div>
      <p>Falling toward perigee, gravity has a part along <i>v</i>. It does positive work: <i>U</i> = −<i>GMm</i>/<i>r</i> drops and <i>K</i> grows by as much. Climbing out, the same part slows it.</p>
      <table class="data">
        <tr><th>${M.SAT_M} kg</th><th><i>K</i></th><th><i>U</i></th><th><i>E</i></th></tr>
        <tr><td>perigee</td><td>${f(Kp / 1e9, 1)} GJ</td><td>${f(M.Ugrav(M.ELL.rp) / 1e9, 1)} GJ</td><td>${f(M.ELL.E / 1e9, 1)} GJ</td></tr>
        <tr><td>apogee</td><td>${f(Ka / 1e9, 1)} GJ</td><td>${f(M.Ugrav(M.ELL.ra) / 1e9, 1)} GJ</td><td>${f(M.ELL.E / 1e9, 1)} GJ</td></tr>
      </table>
      <div class="charts">${chart({ x0: 0, x1: 360, y0: -35, y1: 25, xlabel: 'angle from perigee (°)', ylabel: 'energy (GJ)', label: 'Kinetic, potential and total energy round the ellipse',
        series: [{ pts: curve(0, 360, d => 0.5 * M.SAT_M * M.ellV(d * Math.PI / 180) ** 2 / 1e9, 120), tag: [172, 5, 'K'] },
                 { pts: curve(0, 360, d => M.Ugrav(M.ellR(d * Math.PI / 180)) / 1e9, 120), tag: [172, -20, 'U'] },
                 { cls: 'curve total', pts: [[0, M.ELL.E / 1e9], [360, M.ELL.E / 1e9]], tag: [262, M.ELL.E / 1e9 + 0.5, 'E = K + U'] }] }).replace('</svg>', '<circle class="cursor" r="4.5" data-cursor="orbitK"/><circle class="cursor" r="4.5" data-cursor="orbitU"/></svg>')}</div>
      <p class="hintline">Click the satellite to split gravity along and across <i>v</i>. ${f(ORBIT.kN * 100, 0)} cm per kN; bars ${f(ORBIT.GJ * 100, 0)} cm per GJ.</p>`,
    cam: { target: [STATIONS.orbitE + 0.1, 1.9, 0.3], az: -6, el: 36, dist: 36 }, lit: 'orbitE', scene: 'orbitE', look: {},
    fig: `A ${M.SAT_M} kg satellite, K + U = E`,
  },
  {
    kicker: '3.11 · AP Physics C', title: 'Potential energy', sub: 'U = −GMm/r, zero at infinity',
    body: `
      <p class="lede">Far from the ground <i>g</i> changes and <i>mgh</i> fails. Set <i>U</i> = 0 at infinity; integrate <i>F</i><sub>r</sub> = −<i>GMm</i>/<i>r</i>²:</p>
      <div class="eq"><i>U</i> = −∫<sub>∞</sub><sup><i>r</i></sup> <i>F</i><sub>r</sub> d<i>r</i>′ = <i>GMm</i>[−1/<i>r</i>′]<sub>∞</sub><sup><i>r</i></sup> = −<i>GMm</i>/<i>r</i></div>
      <p>Negative, because gravity does positive work pulling <i>m</i> in from infinity. Only differences matter, and −d<i>U</i>/d<i>r</i> gives <i>F</i><sub>r</sub> back. Near the ground, <i>r</i> = <i>R</i> + <i>h</i> with <i>h</i> ≪ <i>R</i>:</p>
      <div class="eq">Δ<i>U</i> ≈ (<i>GMm</i>/<i>R</i>²) <i>h</i> = <i>mgh</i></div>
      <div class="charts">${chart({ x0: 0, x1: 2, y0: 0, y1: 130, xlabel: 'height h (Earth radii)', ylabel: 'ΔU from the ground (GJ)', label: 'mgh against the exact change in potential energy, 1000 kg',
        series: [{ pts: curve(0, 2, h => (M.Ugrav(RE * (1 + h)) - M.Ugrav(RE)) / 1e9), tag: [1.5, 34, 'exact'] }, { cls: 'trend', pts: curve(0, 2, h => M.SAT_M * M.EARTH.g * h * RE / 1e9, 2), tag: [1.25, 96, 'mgh'] }] })}</div>
      <p class="hintline"><i>mgh</i> is ${f(100e3 / M.EARTH.R * 100, 1)}% high at 100 km; click the curve. 1 m per ${f(1 / ORBIT.draw / 1e6 * 1000, 0)} km across, ${cm(WELLS.GJ)} cm per GJ down, ${cm(WELLS.kN)} cm per kN.</p>`,
    cam: { target: [STATIONS.well + 3.8, 1.3, 0], az: -8, el: 10, dist: 30 }, lit: 'well', scene: 'well', look: {},
    fig: `U(r) for a ${M.SAT_M} kg satellite`,
  },
  {
    kicker: '3.12 · AP Physics C', title: 'Escape', sub: 'bound below zero',
    body: `
      <p class="lede">In a circular orbit <i>mv</i>² = <i>GMm</i>/<i>r</i>, so <i>K</i> = −<i>U</i>/2 and</p>
      <div class="eq"><i>E</i> = <i>K</i> + <i>U</i> = −<i>GMm</i>/2<i>r</i></div>
      <p>Raising ${M.SAT_M} kg from 2 to 4 <i>R</i><sub>E</sub> costs ${f(dE / 1e9, 1)} GJ, yet it ends up slower: <i>U</i> gains ${f(dU / 1e9, 1)} GJ, <i>K</i> loses ${f(dE / 1e9, 1)}. To reach <i>r</i> → ∞ at all takes <i>E</i> ≥ 0:</p>
      <div class="eq">½<i>mv</i>² = <i>GMm</i>/<i>R</i> → <i>v</i><sub>esc</sub> = √(2<i>GM</i>/<i>R</i>)</div>
      <p>${f(M.vEsc(M.EARTH.R) / 1000, 1)} km/s from the ground, in any direction; ${f(M.LAUNCH.vesc / 1000)} km/s = √2 <i>v</i><sub>c</sub> from 2 <i>R</i><sub>E</sub>. Below it, an ellipse; at it, a parabola; above, a hyperbola.</p>
      <div class="charts">${chart({ x0: 1.6, x1: 8, y0: -40, y1: 10, xlabel: 'circular orbit radius (Earth radii)', ylabel: 'energy (GJ)', label: 'U(r) with the total energy and kinetic energy of circular orbits at 2 and 4 Earth radii',
        series: [{ pts: curve(1.6, 8, x => M.Ugrav(x * RE) / 1e9, 90), tag: [5.6, -17, 'U(r)'] },
          ...[2, 4].flatMap(x => [{ cls: 'curve total', pts: [[x - 0.35, M.circE(x * RE) / 1e9], [x + 0.35, M.circE(x * RE) / 1e9]], tag: [x + 0.35, M.circE(x * RE) / 1e9 - 1, 'E'] },
            { cls: 'trend', pts: [[x, M.Ugrav(x * RE) / 1e9], [x, M.circE(x * RE) / 1e9]], tag: [x - 0.02, (M.Ugrav(x * RE) + M.circE(x * RE)) / 2e9 - 2, 'K'] }]),
          { cls: 'trend', pts: [[6.3, 0], [8, 0]], tag: [5.2, 1, 'escape: E ≥ 0'] }],
        marks: [[2, M.Ugrav(2 * RE) / 1e9, '2 R<tspan dy="3" font-size="8">E</tspan>', 6, 12], [4, M.Ugrav(4 * RE) / 1e9, '4 R<tspan dy="3" font-size="8">E</tspan>', 6, 12]] })}</div>
      <p class="hintline">Click a launch to compare speeds. Shown ${M.ESC_TIME}×; ${cm(ORBIT.v)} cm per km/s.</p>`,
    cam: { target: [STATIONS.escape - 0.8, 1.4, -2.4], az: -8, el: 52, dist: 42 }, lit: 'escape', scene: 'escape', look: {},
    fig: 'Launched sideways from 2 Earth radii',
  },
];

// ---------- click a scene: what it breaks into ----------
export const PLATES = {
  whirl: { text: `Take the velocity at two moments, ${f(deg(M.DPHI), 0)}° of the circle apart, and draw both from one point. The change Δ<i>v</i> = <i>v</i><sub>f</sub> − <i>v</i><sub>0</sub> (red) points toward the centre of the circle. Shrink the time between them and Δ<i>v</i>/Δ<i>t</i> becomes exactly <i>v</i>²/<i>r</i>, always aimed at the centre.`,
    facts: () => { const dt = M.DPHI * M.BALL.r / M.V1; return [['Δv = 2v sin(Δθ/2)', `${f(M.deltaV(M.V1, M.DPHI))} m/s`], ['Δt', `${f(dt, 3)} s`], ['Δv / Δt', `${f(M.avgAccel(M.V1, M.BALL.r, M.DPHI))} m/s²`], ['v²/r (Δt → 0)', `${f(M.ac(M.V1, M.BALL.r))} m/s²`]]; } },
  double: { text: `Each ball shrinks to a dot: its free-body diagram. Up and down, the table’s push cancels the weight. The only sideways force is the string, so the tension <i>is</i> the net force (red), pointing at the pin.`,
    facts: () => [['F<sub>N</sub> = mg', `${f(M.BALL.m * M.G)} N, both`], [`T at ${f(M.V1, 1)} m/s`, `${f(M.tension(M.V1))} N`], [`T at ${f(M.V2, 1)} m/s`, `${f(M.tension(M.V2))} N`], ['ratio', `(${f(M.V2 / M.V1, 0)})² = ${f(M.tension(M.V2) / M.tension(M.V1), 0)}`]] },
  flatcar: { text: `The car shrinks to a dot: weight and normal force cancel; static friction, toward the centre, is the net force. The dashed line is where the car would go if the friction vanished, on ice: straight along the tangent.`,
    facts: () => [['f<sub>s</sub> = mv²/r', `${f(M.CAR.f)} N`], ['μ<sub>s</sub> F<sub>N</sub> (the limit)', `${f(M.CAR.fmax)} N`], ['a<sub>c</sub> = v²/r', `${f(M.CAR.v ** 2 / M.CAR.r)} m/s²`], ['v<sub>max</sub> = √(μ<sub>s</sub> g r)', `${f(M.CAR.vmax)} m/s`]] },
  cone: { text: `The tension splits into a vertical part, which holds the ball up against <i>mg</i>, and a horizontal part, which points to the centre of the circle. The horizontal part is the whole net force (red).`,
    facts: () => [['T', `${f(M.CONE.T)} N`], ['T cos θ = mg', `${f(M.CONE.Ty)} N`], ['T sin θ = mv²/r', `${f(M.CONE.Tx)} N`], ['tan θ = v²/(rg)', `${f(Math.tan(M.CONE.th), 3)}`]] },
  loop: { text: `Free-body diagrams at the top and bottom. At the bottom the track pushes up and must also beat gravity: ${f(Nb / M.LOOP.W, 1)} × the weight. At the top the track and gravity both push down, toward the centre; together they make <i>mv</i>²/<i>r</i>.`,
    facts: () => [['bottom: F<sub>N</sub>', `${f(Nb / 1000)} kN at ${f(vb)} m/s`], ['top: F<sub>N</sub>', `${f(Nt / 1000)} kN at ${f(M.LOOP.vTop)} m/s`], ['weight mg', `${f(M.LOOP.W / 1000)} kN`], ['v<sub>min</sub> = √(gr)', `${f(M.LOOP.vmin)} m/s`]] },
  bank: { text: `The normal force splits into a vertical part, which exactly balances the weight, and a horizontal part toward the centre. That horizontal part is the net force (red). No friction is needed at the proper speed.`,
    facts: () => [['F<sub>N</sub> = mg / cos θ', `${f(M.BANK.N)} N`], ['F<sub>N</sub> cos θ = mg', `${f(M.BANK.Ny)} N`], ['F<sub>N</sub> sin θ = mv²/r', `${f(M.BANK.Nx)} N`], ['proper speed', `${f(M.BANK.v)} m/s`]] },
  disc: { text: `In the same moment both blocks turn through one radian. The outer arc is twice as long, because <i>s</i> = <i>r</i>θ. Same time, twice the distance: twice the speed.`,
    facts: () => [['Δθ', '1 rad = 57.3°'], ['s₁ = r₁ × 1 rad', `${f(M.DISC.r1)} m`], ['s₂ = r₂ × 1 rad', `${f(M.DISC.r2)} m`], ['time for 1 rad', `${f(1 / M.DISC.w)} s`]] },
  gravity: { text: `The two pulls are a third-law pair: equal in size, opposite in direction, even though one sphere has twice the mass. Their accelerations (red, <i>a</i> = <i>F</i>/<i>m</i>) are not equal: the lighter sphere gets twice as much.`,
    facts: s => { const r = M.sep(s.clock), F = M.gravF(M.SPHERES.m1, M.SPHERES.m2, r); return [['r', `${f(r)} m`], ['F<sub>12</sub> = F<sub>21</sub>', `${f(F * 1e6, 1)} μN`], ['a₁ (1000 kg)', `${f(F / M.SPHERES.m1 * 1e9, 1)} × 10⁻⁹ m/s²`], ['a₂ (2000 kg)', `${f(F / M.SPHERES.m2 * 1e9, 1)} × 10⁻⁹ m/s²`]]; } },
  orbit: { text: `The arcs show how far each satellite goes in the same hour. The inner one sweeps ${f(deg(3600 * M.orbitV(r1) / r1), 0)}°; the outer one, only ${f(deg(3600 * M.orbitV(r2) / r2), 0)}°. Unlike points on a disc, orbits don’t share an angular velocity: farther out is slower in every way.`,
    facts: () => [['T₁², T₂² ÷ r³', `${(M.orbitT(r1) ** 2 / r1 ** 3).toExponential(3)} s²/m³, both`], ['4π² / GM', `${(4 * Math.PI ** 2 / M.GM).toExponential(3)} s²/m³`], ['T₂ / T₁', `${f(M.orbitT(r2) / M.orbitT(r1))} = 2√2`], ['v₂ / v₁', `${f(M.orbitV(r2) / M.orbitV(r1), 3)} = 1/√2`]] },
  kepler: { text: `The satellite at perigee and at apogee. At both, <i>v</i> is ⟂ <i>r</i>, so <i>L</i> = <i>mvr</i>. Three times as far out, it moves a third as fast. The hour-long wedges have equal areas: a short, wide one near the Earth, a long, thin one far out.`,
    facts: () => [['r<sub>p</sub> v<sub>p</sub>', `${f(M.ELL.rp * M.ELL.vp / 1e10, 3)} × 10¹⁰ m²/s`], ['r<sub>a</sub> v<sub>a</sub>', `${f(M.ELL.ra * M.ELL.va / 1e10, 3)} × 10¹⁰ m²/s`], ['area per hour (RK4)', `${f(M.swept(0, M.SWEEP) / 1e12, 1)} × 10¹² m²`], ['T = 2π√(a³/GM)', `${f(M.ELL.T / 3600)} h`]] },
  orbitE: { text: `Gravity (red) splits into a part along the velocity and a part across it. Only the part along <i>v</i> does work: it speeds the satellite up on the way in and slows it on the way out. At perigee and apogee it vanishes, and the speed is at its extremes.`,
    facts: s => { const p = M.ELL.track.at(s.clock * M.ORBIT_TIME), K = 0.5 * M.SAT_M * p.v ** 2, U = M.Ugrav(p.r); return [['r', `${f(p.r / RE)} R<sub>E</sub>`], ['K = ½mv²', `${f(K / 1e9)} GJ`], ['U = −GMm/r', `${f(U / 1e9)} GJ`], ['E = K + U', `${f((K + U) / 1e9)} GJ`]]; } },
  well: { text: `The red line is <i>U</i>(<i>R</i>) + <i>mgh</i>, the tangent to the curve at the ground with slope <i>mg</i>. It is right for small <i>h</i>; higher up the true curve flattens as <i>g</i> weakens, and it never reaches zero, while the line crosses zero at one Earth radius up.`,
    facts: s => { const r = M.wellR(s.clock); return [['r', `${f(r / RE)} R<sub>E</sub>`], ['U = −GMm/r', `${f(M.Ugrav(r) / 1e9)} GJ`], ['F = GMm/r²', `${f(M.GM * M.SAT_M / r ** 2 / 1000)} kN`], ['U(R) + mgh', `${f((M.Ugrav(RE) + M.SAT_M * M.EARTH.g * (r - RE)) / 1e9)} GJ`]]; } },
  escape: { text: `The four launch speeds side by side, all sideways from the same point. The sign of <i>E</i> decides: below zero the ball is bound and comes back round; at zero it just escapes, its speed tending to zero far away; above zero it leaves with speed to spare.`,
    facts: () => M.LAUNCH.list.map(o => [`${o.name}: ${f(o.v0 / 1000)} km/s`, `E ${Math.abs(o.E) < 1 ? '0' : f(o.E * M.SAT_M / 1e9, 1)} GJ`]) },
};
