// Chapter 2, page by page (after the AP Physics 1 organizer, Unit 3). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, KN_SCALE, F_SCALE, TUG_SCALE, DRAG_SCALE, HONEY_SCALE } from './world.js';

const f = (x, n = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);
const at = (k, dy = 0.5) => [STATIONS[k], dy, 0];
const TG = M.TUG, BD = M.BOARD, DR = M.DRAG, HN = M.HONEY;

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], cursor, label }) {
  const sx = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy = y => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + 6}" y="${sy(y) + 14}">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${String(y0).replace('-', '−')}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursor ? `<circle class="cursor" r="4.5" data-cursor="${cursor}"/>` : ''}
  </svg>`;
}
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };

const frictionChart = chart({
  x0: 0, x1: 12, y0: 0, y1: 12, xlabel: 'applied force (N)', ylabel: 'friction (N)', cursor: 'friction', label: 'Friction against applied force',
  series: [{ pts: [[0, 0], [M.F_SMAX, M.F_SMAX]], tag: [2.2, 2.2, 'static: f = F'] }, { pts: [[M.F_SMAX, M.F_K], [12, M.F_K]], tag: [5.6, M.F_K - 1.6, 'kinetic: μk·FN →'] }, { cls: 'trend', pts: [[M.F_SMAX, M.F_SMAX], [M.F_SMAX, M.F_K]] }],
  marks: [[M.F_SMAX, M.F_SMAX, `${f(M.F_SMAX)} N`]],
});

export const PAGES = [
  {
    levels: ['senior'],
    kicker: 'Chapter 2', title: 'Newton’s laws', sub: 'what changes motion',
    body: `
      <p class="lede">Kinematics described motion. Dynamics explains it: a <b>force</b> is a push or a pull, and forces are what change motion.</p>
      <p>A force is a vector, drawn as an arrow from the object’s centre. 1 newton is the force that gives 1 kg an acceleration of 1 m/s². This ${f(M.M1, 1)} kg block feels two:</p>
      <table class="data">
        <tr><th>force</th><th>symbol</th><th>here</th></tr>
        <tr><td>weight (gravity)</td><td><i>F</i><sub>g</sub> = <i>mg</i></td><td>${f(M.W1, 1)} N down</td></tr>
        <tr><td>normal (the surface)</td><td><i>F</i><sub>N</sub></td><td>${f(M.FN, 1)} N up</td></tr>
        <tr><td>tension (a string)</td><td><i>T</i></td><td>—</td></tr>
        <tr><td>friction</td><td><i>f</i></td><td>—</td></tr>
        <tr><td>drag (air)</td><td><i>F</i><sub>d</sub></td><td>—</td></tr>
      </table>
      <p>Always start by drawing a <b>free-body diagram</b>: the object as a dot, every force on it as an arrow. Click the block to see it.</p>`,
    cam: { target: at('rest', 0.45), az: -30, el: 12, dist: 9 }, lit: 'rest', scene: 'rest', look: {},
    fig: 'A block at rest',
  },
  {
    levels: ['senior'],
    kicker: '2.1', title: 'Tension', sub: 'a string can only pull',
    body: `
      <p class="lede"><b>Tension</b> <i>T</i> is the pull of a string or rope, along the string. A string can pull, never push.</p>
      <p>On the left the ${f(M.M1, 1)} kg block hangs from one string. It is in equilibrium, so <i>T</i> = <i>mg</i> = ${f(M.W1, 1)} N.</p>
      <p>On the right two strings share the load. Only their vertical parts hold the block up, so 2<i>T</i> sin θ = <i>mg</i> and</p>
      <div class="eq"><i>T</i> = <i>mg</i> / (2 sin θ)</div>
      <p>As the strings flatten, θ shrinks and the tension grows: ${f(M.tension2(70), 1)} N at 70°, ${f(M.tension2(30), 1)} N at 30°, ${f(M.tension2(20), 1)} N at 20°. That is why a washing line can never be pulled perfectly straight. The horizontal parts cancel each other.</p>
      <div class="charts">${chart({ x0: 10, x1: 90, y0: 0, y1: 60, xlabel: 'string angle θ (°)', ylabel: 'tension in each string (N)', cursor: 'tension', label: 'Tension against string angle',
        series: [{ pts: Array.from({ length: 41 }, (_, i) => { const d = 12 + i * 1.95; return [d, Math.min(M.tension2(d), 60)]; }) }] })}</div>
      <p class="hintline">Click the strings to split each tension into parts.</p>`,
    cam: { target: [STATIONS.tension, 1.5, 0], az: -10, el: 5, dist: 11 }, lit: 'tension', scene: 'tension', look: {},
    fig: 'One string, then two',
  },
  {
    levels: ['senior'],
    kicker: '2.2', title: 'The first law', sub: 'inertia',
    body: `
      <p class="lede">An object at rest stays at rest, and an object moving in a straight line keeps moving at the same velocity, unless a nonzero <b>net force</b> acts on it.</p>
      <p>This block slides across a frictionless surface at ${f(M.V_GLIDE, 1)} m/s. Its weight and the normal force cancel, so Σ<i>F</i> = 0 and nothing changes its motion. The strobe images are evenly spaced.</p>
      <p><b>Equilibrium</b> means Σ<i>F</i> = 0. That includes moving at constant velocity, not just being at rest. Nothing is needed to <i>keep</i> it moving.</p>
      <div class="charts">${chart({ x0: 0, x1: 2.4, y0: 0, y1: 3.6, xlabel: 'time (s)', ylabel: 'position (m)', label: 'Position against time: a straight line', series: [{ pts: [[0, 0], [2.4, 3.6]] }] })}</div>`,
    cam: { target: at('glide', 0.45), az: -18, el: 14, dist: 12 }, lit: 'glide', scene: 'glide', look: {},
    fig: 'Constant velocity, zero net force',
  },
  {
    levels: ['senior'],
    kicker: '2.3', title: 'Level flight', sub: 'moving, but in equilibrium',
    body: `
      <p class="lede">A ${M.PLANE.m} kg plane cruising at a steady ${M.PLANE.v} m/s, level, in a straight line. Its velocity isn’t changing, so by the first law the net force is zero.</p>
      <table class="data">
        <tr><td>lift (up, from the wings)</td><td>${(M.PLANE.L / 1000).toFixed(2)} kN</td></tr>
        <tr><td>weight (down)</td><td>${(M.PLANE.W / 1000).toFixed(2)} kN</td></tr>
        <tr><td>thrust (forward, from the propeller)</td><td>${(M.PLANE.T / 1000).toFixed(2)} kN</td></tr>
        <tr><td><b>drag</b> (back, from the air)</td><td>${(M.PLANE.D / 1000).toFixed(2)} kN</td></tr>
      </table>
      <p><b>Drag</b> is the force a fluid exerts against motion through it. It grows with speed, roughly as <i>F</i><sub>d</sub> = ½<i>DρAv</i>² (<i>D</i> the drag coefficient, <i>A</i> the area facing the flow). The engine doesn’t need to keep the plane moving; it needs to cancel the drag.</p>
      <p class="hintline">Here arrows are drawn at ${(KN_SCALE * 100).toFixed(0)} cm per kilonewton.</p>`,
    cam: { target: [STATIONS.plane, 3.0, 0], az: -26, el: 9, dist: 34 }, lit: 'plane', scene: 'plane', look: {},
    fig: 'Lift = weight, thrust = drag',
  },
  {
    levels: ['senior'],
    kicker: '2.4', title: 'The second law', sub: 'ΣF = ma',
    body: `
      <p class="lede">A net force causes an acceleration in its direction, of size Σ<i>F</i>/<i>m</i>.</p>
      <p>Both blocks get the same ${f(M.PUSH, 1)} N push on a frictionless surface. The ${f(M.M1, 1)} kg block accelerates at ${f(M.A1, 1)} m/s². The ${f(M.M2, 1)} kg block, with twice the mass, gets half: ${f(M.A2, 1)} m/s².</p>
      <p>More force, more acceleration. More mass, less acceleration.</p>
      <div class="charts">${chart({ x0: 0, x1: 12, y0: 0, y1: 6, xlabel: 'net force (N)', ylabel: 'acceleration (m/s²)', label: 'Acceleration against net force for 2 kg and 4 kg', series: [{ pts: [[0, 0], [12, 6]], tag: [9, 4.5, '2 kg'] }, { pts: [[0, 0], [12, 3]], tag: [9.6, 2.4, '4 kg'] }], marks: [[M.PUSH, M.A1, '3.0'], [M.PUSH, M.A2, '1.5']] })}</div>`,
    cam: { target: [STATIONS.second + 1.2, 0.4, 0], az: -22, el: 20, dist: 12 }, lit: 'second', scene: 'second', look: {},
    fig: 'The same 6.0 N on 2 kg and on 4 kg',
  },
  {
    levels: ['senior'],
    kicker: '2.5', title: 'What pushes a car?', sub: 'the road does',
    body: `
      <p class="lede">The engine turns the wheels, but the engine is part of the car, and nothing can push itself. The forward force on the car comes from the <b>road</b>: static friction on the tyres.</p>
      <p>The tyres push back on the road. By the third law the road pushes the tyres forward, here with ${f(M.CAR.F / 1000, 1)} kN. The tyre doesn’t slip, so this is <i>static</i> friction, even though the car moves.</p>
      <p>Air drag pushes back and grows with <i>v</i>²: just ${f(M.car(M.CAR.run).D, 0)} N at ${f(M.car(M.CAR.run).v, 1)} m/s, but ${f(M.CAR.k * 30 * 30, 0)} N at highway speed (30 m/s). The net force, and so the acceleration, shrinks as the car speeds up.</p>
      <div class="charts">${chart({ x0: 0, x1: 3.2, y0: 0, y1: 10, xlabel: 'time (s)', ylabel: 'speed (m/s)', cursor: 'car', label: 'Car speed against time',
        series: [{ pts: Array.from({ length: 33 }, (_, i) => [i * 0.1, M.car(i * 0.1).v]) }] })}</div>
      <p class="hintline">Arrows: ${(KN_SCALE * 100).toFixed(0)} cm per kilonewton.</p>`,
    cam: { target: [STATIONS.car + 0.5, 1.2, 0], az: -20, el: 14, dist: 36 }, lit: 'car', scene: 'car', look: {},
    fig: 'Friction forward, drag back',
  },
  {
    levels: ['senior'],
    kicker: '2.6', title: 'Friction', sub: 'static, then kinetic',
    body: `
      <p class="lede">On a rough floor the push grows steadily, ${f(M.RAMP, 1)} N every second. At first the block doesn’t move: <b>static friction</b> matches the push exactly.</p>
      <p>Static friction has a limit, μ<sub>s</sub><i>F</i><sub>N</sub> = ${f(M.MU_S)} × ${f(M.FN, 1)} = ${f(M.F_SMAX)} N. Push harder and the block breaks free. <b>Kinetic friction</b> then takes over at a smaller, steady μ<sub>k</sub><i>F</i><sub>N</sub> = ${f(M.F_K)} N, whatever the push. The red arrow, the net force, appears only once the push wins.</p>
      <div class="charts">${frictionChart}</div>`,
    cam: { target: [STATIONS.friction + 0.4, 0.45, 0], az: -26, el: 13, dist: 9 }, lit: 'friction', scene: 'friction', look: {},
    fig: 'A growing push on a rough floor',
  },
  {
    levels: ['senior'],
    kicker: '2.7', title: 'The third law', sub: 'forces come in pairs',
    body: `
      <p class="lede">If A pushes on B, B pushes on A with a force of the same size in the opposite direction, at the same instant.</p>
      <p>A ${f(M.PUSH, 1)} N push moves both blocks together at ${f(M.A_PAIR, 1)} m/s². To give B (${f(M.M2, 1)} kg) that acceleration, A must push it with ${f(M.CONTACT, 1)} N. B pushes A back with ${f(M.CONTACT, 1)} N, so the net force on A is ${f(M.PUSH - M.CONTACT, 1)} N, which is exactly ${f(M.M1, 1)} kg × ${f(M.A_PAIR, 1)} m/s².</p>
      <p>The two forces of a pair act on <b>different objects</b>, so they never cancel each other. Weight and normal force are <i>not</i> a pair: both act on the same block. The partner of the block’s weight is the block pulling the Earth up.</p>`,
    cam: { target: [STATIONS.third + 0.9, 0.45, 0], az: -24, el: 12, dist: 9 }, lit: 'third', scene: 'third', look: {},
    fig: 'A pushes B, B pushes A',
  },

  {
    levels: ['senior'],
    kicker: '2.8', title: 'Choosing a system', sub: 'internal forces cancel',
    body: `
      <p class="lede">Draw a boundary around any objects you like and call them the <b>system</b>. Forces between things inside it are <b>internal</b>. Forces from anything outside are <b>external</b>.</p>
      <p>Skater A (${TG.mA} kg) and skater B (${TG.mB} kg) stand on frictionless ice and haul in a light rope. The rope pulls each of them with ${TG.T} N, so A accelerates at ${f(TG.aA, 1)} m/s² and B at ${f(TG.aB, 1)} m/s², toward each other.</p>
      <p>Take skaters + rope as the system. The tensions are internal, and they come in equal and opposite pairs, so they add to zero. Weight and the normal force are external, but they cancel. The system as a whole can’t accelerate. Its <b>centre of mass</b> stays put:</p>
      <div class="eq"><i>x</i><sub>cm</sub> = Σ<i>m</i><i>x</i> / Σ<i>m</i></div>
      <div class="eq">= (<i>m</i><sub>A</sub><i>x</i><sub>A</sub> + <i>m</i><sub>B</sub><i>x</i><sub>B</sub>) / (<i>m</i><sub>A</sub> + <i>m</i><sub>B</sub>)</div>
      <table class="data">
        <tr><th></th><th><i>x</i><sub>A</sub></th><th><i>x</i><sub>B</sub></th><th><i>x</i><sub>cm</sub></th></tr>
        <tr><td>at the start</td><td>${f(M.tug(0).xA)} m</td><td>${f(M.tug(0).xB)} m</td><td>0.00 m</td></tr>
        <tr><td>after ${f(TG.run, 2)} s</td><td>${f(M.tug(TG.run).xA)} m</td><td>${f(M.tug(TG.run).xB)} m</td><td>0.00 m</td></tr>
      </table>
      <p>The lighter skater covers more ice, ${f(M.tug(TG.run).xA - TG.xA0, 1)} m against ${f(TG.xB0 - M.tug(TG.run).xB, 1)} m, in just the ratio that keeps <i>x</i><sub>cm</sub> fixed. Had they been gliding together, <i>x</i><sub>cm</sub> would keep gliding at the same velocity.</p>
      <div class="charts">${chart({ x0: 0, x1: 1.7, y0: -3, y1: 2, xlabel: 'time (s)', ylabel: 'position (m)', cursor: 'tug', label: 'Positions of both skaters and of the centre of mass against time',
        series: [{ pts: Array.from({ length: 21 }, (_, i) => [i * TG.run / 20, M.tug(i * TG.run / 20).xA]), tag: [0.15, TG.xA0 + 0.25, 'A'] }, { pts: Array.from({ length: 21 }, (_, i) => [i * TG.run / 20, M.tug(i * TG.run / 20).xB]), tag: [0.75, M.tug(0.75).xB - 0.75, 'B'] }, { cls: 'curve total', pts: [[0, 0], [TG.run, 0]], tag: [1.2, 0.1, 'x<tspan dy="3" font-size="8">cm</tspan>'] }] })}</div>
      <p class="hintline">Arrows here: ${(TUG_SCALE * 100).toFixed(1)} cm per newton. Click the skaters to see the system boundary.</p>`,
    cam: { target: [STATIONS.tug - 0.45, 0.95, 0], az: -8, el: 9, dist: 18 }, lit: 'tug', scene: 'tug', look: {},
    fig: 'Hauling in a rope on ice',
  },
  {
    levels: ['senior'],
    kicker: '2.9', title: 'The centre of mass accelerates', sub: 'ΣF_ext = M a_cm',
    body: `
      <p class="lede">Write <i>F</i> = <i>ma</i> for every piece of a system and add them up. The internal forces cancel in pairs, and what is left is the second law for the whole system:</p>
      <div class="eq">Σ<i>F</i><sub>ext</sub> = <i>M</i> <i>a</i><sub>cm</sub>, &nbsp; <i>M</i> = Σ<i>m</i></div>
      <p>A ${f(BD.m, 1)} kg block rests on a ${f(BD.Mb, 1)} kg board on ice, and a rope pulls the board with ${BD.F} N. That is more than static friction can share out (μ<sub>s</sub><i>Mg</i> = ${f(BD.Fslip)} N), so the block slips. Kinetic friction, ${f(BD.f)} N, drags the block forward and the board back.</p>
      <table class="data">
        <tr><td>block: <i>f</i>/<i>m</i></td><td>${f(BD.aBlock)} m/s²</td></tr>
        <tr><td>board: (<i>F</i> − <i>f</i>)/<i>M</i><sub>board</sub></td><td>${f(BD.aBoard)} m/s²</td></tr>
        <tr><td><b>system</b>: <i>F</i>/(<i>m</i> + <i>M</i><sub>board</sub>)</td><td>${f(BD.aCm)} m/s²</td></tr>
      </table>
      <p>Check: (${f(BD.m, 1)} × ${f(BD.aBlock)} + ${f(BD.Mb, 1)} × ${f(BD.aBoard)}) / ${f(BD.M, 1)} = ${f(BD.aCm)} m/s². The friction never mattered to <i>a</i><sub>cm</sub>. Yank a tablecloth from under the dishes and the same thing happens: friction is all that drags the dishes, and it can give them only μ<i>g</i>.</p>
      <div class="charts">${chart({ x0: 0, x1: 1.1, y0: 0, y1: 4.5, xlabel: 'time (s)', ylabel: 'velocity (m/s)', cursor: 'board', label: 'Velocity of block, board and centre of mass against time',
        series: [{ pts: [[0, 0], [1.1, BD.aBoard * 1.1]], tag: [0.86, BD.aBoard * 0.86 + 0.2, 'board'] }, { cls: 'curve total', pts: [[0, 0], [1.1, BD.aCm * 1.1]], tag: [0.92, BD.aCm * 0.92 - 0.95, 'cm'] }, { pts: [[0, 0], [1.1, BD.aBlock * 1.1]], tag: [0.8, BD.aBlock * 0.8 - 0.75, 'block'] }] })}</div>
      <p class="hintline">Arrows: ${(F_SCALE * 100).toFixed(0)} cm per newton. Click to lift the block and see the friction pair.</p>`,
    cam: { target: [STATIONS.board + 0.4, 0.5, 0], az: -16, el: 15, dist: 13.5 }, lit: 'board', scene: 'board', look: {},
    fig: 'A board pulled out from under a block',
  },
  {
    levels: ['senior'],
    kicker: '2.10', title: 'The inclined plane', sub: 'tilt the axes',
    body: `
      <p class="lede">On a slope, measure along it and perpendicular to it. Then the weight splits into two parts.</p>
      <table class="data">
        <tr><td>along the slope</td><td><i>mg</i> sin θ = ${f(M.W_PAR)} N</td></tr>
        <tr><td>into the slope</td><td><i>mg</i> cos θ = ${f(M.W_PERP)} N</td></tr>
      </table>
      <p>Nothing accelerates into the slope, so the normal force cancels the second part: <i>F</i><sub>N</sub> = <i>mg</i> cos θ = ${f(M.FN_INC)} N. Only the part along the slope is left: <i>a</i> = <i>g</i> sin θ = ${f(M.A_INC)} m/s².</p>
      <p>Add friction and the block slides at constant speed when tan θ = μ<sub>k</sub>. For μ<sub>k</sub> = ${f(M.MU_K)} that is ${f(M.critical(M.MU_K), 1)}°.</p>
      <p class="hintline">Click the block to split its weight.</p>`,
    cam: { target: [STATIONS.incline - 0.2, 1.0, 0], az: -8, el: 12, dist: 12 }, lit: 'incline', scene: 'incline', look: {},
    fig: `A ${M.THETA_DEG}° ramp`,
  },
  {
    levels: ['senior'],
    kicker: '2.11 · AP Physics C', title: 'Drag proportional to v', sub: 'terminal velocity',
    body: `
      <p class="lede">Drag points against the velocity and grows with speed. For small, slow objects in thick fluids it is simply proportional to speed: <i>F</i><sub>d</sub> = −<i>bv</i>.</p>
      <p>A ${f(DR.m, 2)} kg ball with <i>b</i> = ${f(DR.b)} kg/s is let go from rest. Take down as positive:</p>
      <div class="eq"><i>m</i> d<i>v</i>/d<i>t</i> = <i>mg</i> − <i>bv</i></div>
      <p>At first <i>v</i> = 0 and <i>a</i> = <i>g</i>. Drag grows as it speeds up, so the net force shrinks. When <i>bv</i> = <i>mg</i> it is zero: the <b>terminal velocity</b> <i>v</i><sub>t</sub> = <i>mg</i>/<i>b</i> = ${f(DR.vt)} m/s. Separate the variables, with τ = <i>m</i>/<i>b</i>:</p>
      <div class="eq">d<i>v</i> / (<i>v</i><sub>t</sub> − <i>v</i>) = d<i>t</i> / τ</div>
      <div class="eq">∫<sub>0</sub><sup><i>v</i></sup> d<i>v</i>′/(<i>v</i><sub>t</sub> − <i>v</i>′) = ∫<sub>0</sub><sup><i>t</i></sup> d<i>t</i>′/τ</div>
      <div class="eq">−ln(1 − <i>v</i>/<i>v</i><sub>t</sub>) = <i>t</i>/τ</div>
      <div class="eq"><i>v</i>(<i>t</i>) = <i>v</i><sub>t</sub> (1 − e<sup>−<i>t</i>/τ</sup>)</div>
      <p>Here τ = ${f(DR.tau)} s. After one τ the ball has 1 − 1/e = 63.2% of <i>v</i><sub>t</sub>; after 3τ, 95%; after 5τ, 99.3%. It never quite gets there.</p>
      <div class="charts">${chart({ x0: 0, x1: 2, y0: 0, y1: 4.5, xlabel: 'time (s)', ylabel: 'speed (m/s)', cursor: 'drag', label: 'Speed against time approaching terminal velocity',
        series: [{ cls: 'trend', pts: [[0, DR.vt], [2, DR.vt]], tag: [1.62, DR.vt, 'v<tspan dy="3" font-size="8">t</tspan>'] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.linDrag(i * 0.05).v]) }, { cls: 'trend', pts: [[DR.tau, 0], [DR.tau, M.linDrag(DR.tau).v]] }],
        marks: [[DR.tau, M.linDrag(DR.tau).v, `63.2% at τ = ${f(DR.tau, 1)} s`]] })}
        ${chart({ x0: 0, x1: 2, y0: 0, y1: 6, xlabel: 'time (s)', ylabel: 'force (N)', cursor: 'dragF', label: 'Drag and weight against time',
        series: [{ cls: 'trend', pts: [[0, DR.W], [2, DR.W]], tag: [1.2, DR.W, 'weight <tspan font-style="italic">mg</tspan>'] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.linDrag(i * 0.05).D]), tag: [0.5, M.linDrag(0.5).D - 2.2, 'drag <tspan font-style="italic">bv</tspan>'] }] })}</div>
      <p class="hintline">Arrows here: ${(DRAG_SCALE * 100).toFixed(0)} cm per newton. Click the ball for its live free-body diagram.</p>`,
    cam: { target: [STATIONS.drag, 2.8, 0], az: -10, el: 5, dist: 23 }, lit: 'drag', scene: 'drag', look: {},
    fig: 'A ball falling with drag −bv',
  },
  {
    levels: ['senior'],
    kicker: '2.12 · AP Physics C', title: 'Real fluids', sub: 'position, and which drag law',
    body: `
      <p class="lede">Integrate once more for the position fallen:</p>
      <div class="eq"><i>x</i>(<i>t</i>) = ∫<sub>0</sub><sup><i>t</i></sup> <i>v</i> d<i>t</i>′ = <i>v</i><sub>t</sub> [ <i>t</i> − τ (1 − e<sup>−<i>t</i>/τ</sup>) ]</div>
      <p>After a few τ this is <i>v</i><sub>t</sub>(<i>t</i> − τ): the ball falls as if it had been at <i>v</i><sub>t</sub> all along but started τ late (dashed below).</p>
      <p>Linear drag holds for small, slow objects in thick fluids. Big or fast ones push fluid aside, and drag grows as <i>kv</i>², like the car’s on page 2.5. Then <i>v</i><sub>t</sub> = √(<i>mg</i>/<i>k</i>).</p>
      <table class="data">
        <tr><th>falling</th><th><i>v</i><sub>t</sub></th><th>τ</th><th>drag</th></tr>
        <tr><td>fog droplet, 20 µm</td><td>${f(M.drop(1e-5).vLin * 100, 1)} cm/s</td><td>${f(M.drop(1e-5).tau * 1000, 1)} ms</td><td><i>bv</i></td></tr>
        <tr><td>steel ball in honey, 10 mm</td><td>${f(HN.vt * 100, 1)} cm/s</td><td>${f(HN.tau * 1000, 1)} ms</td><td><i>bv</i></td></tr>
        <tr><td>raindrop, 2 mm</td><td>${f(M.drop(1e-3).vQuad, 1)} m/s</td><td>—</td><td><i>kv</i>²</td></tr>
      </table>
      <p>For the raindrop, <i>bv</i> would predict ${f(M.drop(1e-3).vLin, 0)} m/s. It really falls at about 6.5 m/s, as <i>kv</i>² says.</p>
      <p>The steel ball in honey (drawn 10× life size) also feels buoyancy <i>B</i>, so <i>mg</i> becomes <i>mg</i> − <i>B</i> and <i>v</i><sub>t</sub> = (<i>mg</i> − <i>B</i>)/<i>b</i>. With τ only ${f(HN.tau * 1000, 1)} ms it is at terminal speed within a fraction of a millimetre, so it seems to sink steadily from the start.</p>
      <div class="charts">${chart({ x0: 0, x1: 2, y0: 0, y1: 7, xlabel: 'time (s)', ylabel: 'distance fallen (m)', label: 'Distance fallen against time, with its asymptote',
        series: [{ cls: 'trend', pts: [[DR.tau, 0], [2, DR.vt * (2 - DR.tau)]], tag: [1.25, DR.vt * 0.85 - 0.4, 'v<tspan dy="3" font-size="8">t</tspan><tspan dy="-3">(t − τ)</tspan>'] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.linDrag(i * 0.05).x]) }] })}
        ${chart({ x0: 0, x1: 2, y0: 0, y1: 4.5, xlabel: 'time (s)', ylabel: 'speed (m/s), same v_t', label: 'Linear and quadratic drag, same terminal speed',
        series: [{ cls: 'trend', pts: [[0, DR.vt], [2, DR.vt]] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.quadV(i * 0.05)]), tag: [0.18, M.quadV(0.3), 'kv²'] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.linDrag(i * 0.05).v]), tag: [0.5, M.linDrag(0.4).v - 1.3, 'bv'] }] })}</div>
      <p><i>kv</i>² is weaker than <i>bv</i> below <i>v</i><sub>t</sub>, so with the same <i>v</i><sub>t</sub> it gets close sooner: ${(100 * M.quadV(DR.tau) / DR.vt).toFixed(0)}% at <i>t</i> = τ, not 63%.</p>
      <p class="hintline">Arrows here: ${HONEY_SCALE} m per newton. Click the ball for its forces.</p>`,
    cam: { target: [STATIONS.honey, 0.68, 0], az: -12, el: 8, dist: 5.6 }, lit: 'honey', scene: 'honey', look: {},
    fig: 'A steel ball sinking in honey',
  },
];

// ---------- click a scene: what it breaks into ----------
export const PLATES = {
  tug: { text: `The pale box is the system: both skaters and the rope. The tension on A and the tension on B are internal; they are equal and opposite, so they add to zero. Each skater’s weight is cancelled by the ice’s normal force. With no net external force, the centre of mass (the quartered disc) cannot move.`,
    facts: s => { const r = M.tug(s.tug.t), xc = M.xcm([TG.mA, TG.mB], [r.xA, r.xB]); return [['x<sub>A</sub>, v<sub>A</sub>', `${f(r.xA)} m, ${f(r.vA)} m/s`], ['x<sub>B</sub>, v<sub>B</sub>', `${f(r.xB)} m, ${f(r.vB)} m/s`], ['x<sub>cm</sub> = Σmx/Σm', `${f(Math.abs(xc) < 5e-3 ? 0 : xc)} m`], ['internal: T on A + T on B', `${TG.T} − ${TG.T} = 0 N`], ['external: ΣF<sub>ext</sub>', '0 N']]; } },
  board: { text: `Lifted apart, the friction pair shows: the board drags the block forward, the block drags the board back, ${f(BD.f)} N each. Inside the block + board system they cancel. Only the pull F is external, so the centre of mass accelerates at F/M, between the block’s and the board’s accelerations.`,
    facts: s => { const t = s.board.t, r = M.board(t); return [['ΣF<sub>ext</sub> = F', `${BD.F} N`], ['M = m + M<sub>board</sub>', `${f(BD.M, 1)} kg`], ['a<sub>cm</sub> = ΣF<sub>ext</sub>/M', `${f(BD.aCm)} m/s²`], ['v<sub>block</sub>, v<sub>board</sub>', `${f(r.vBlock)}, ${f(r.vBoard)} m/s`], ['v<sub>cm</sub>', `${f(M.xcm([BD.m, BD.Mb], [r.vBlock, r.vBoard]))} m/s`]]; } },
  drag: { text: `The ball shrinks to its free-body diagram: weight down, drag up. The drag is bv, so it grows with the speed until it matches the weight, and the net force (red) dies away. Acceleration is g e<sup>−t/τ</sup>: largest at the start, zero at terminal speed.`,
    facts: s => { const r = M.linDrag(s.drag.t); return [['time', `${f(s.drag.t)} s = ${f(s.drag.t / DR.tau, 1)} τ`], ['speed v', `${f(r.v)} m/s = ${(100 * r.v / DR.vt).toFixed(1)}% of v<sub>t</sub>`], ['drag bv', `${f(r.D)} N`], ['weight mg', `${f(DR.W)} N`], ['net force, a', `${f(DR.W - r.D)} N, ${f(r.a)} m/s²`]]; } },
  honey: { text: `Three forces, already balanced: weight down; drag and buoyancy up. The ball is at terminal speed, so the strobe images are evenly spaced. Drag is linear here because the Reynolds number ρvd/η, which compares pushing fluid aside with its stickiness, is far below 1.`,
    facts: () => [['weight mg', `${f(HN.W * 1000, 1)} mN`], ['buoyancy B', `${f(HN.B * 1000, 1)} mN`], ['drag bv<sub>t</sub> (b = 6πηr)', `${f(HN.b * HN.vt * 1000, 1)} mN`], ['net force', '0 N'], ['v<sub>t</sub>, τ', `${f(HN.vt * 100, 2)} cm/s, ${f(HN.tau * 1000, 1)} ms`], ['Reynolds number', f(HN.Re, 3)]] },
  tension: { text: `Each tension splits into a horizontal part and a vertical part (grey). The horizontal parts are equal and opposite, so they cancel. The two vertical parts add up to the weight. The flatter the strings, the smaller each vertical part, so the larger the tension has to be.`,
    facts: s => { const th = M.hangAngle(s.clock * M.SLOW), T = M.tension2(th), r = th * Math.PI / 180; return [['angle θ', `${th.toFixed(1)}°`], ['each tension T', `${f(T)} N`], ['vertical part T sin θ', `${f(T * Math.sin(r))} N × 2 = ${f(2 * T * Math.sin(r))} N`], ['horizontal part T cos θ', `${f(T * Math.cos(r))} N, cancelling`]]; } },
  plane: { text: `Four forces, two balanced pairs. Notice they are not third-law pairs: all four act on the plane. Lift and weight balance because the plane isn’t climbing or sinking; thrust and drag balance because its speed isn’t changing.`,
    facts: () => [['lift − weight', '0 N'], ['thrust − drag', '0 N'], ['acceleration', '0 m/s²'], ['speed', `${M.PLANE.v} m/s, constant`]] },
  car: { text: `Weight and the normal force cancel. Sideways there are two forces: static friction from the road, forward, and air drag, backward. Their difference is the net force (red).`,
    facts: s => { const c = M.car(s.car.t); return [['road friction (forward)', `${f(M.CAR.F)} N`], ['air drag (back)', `${f(c.D)} N`], ['net force', `${f(M.CAR.F - c.D)} N`], ['acceleration', `${f(c.a)} m/s²`], ['speed', `${f(c.v)} m/s`]]; } },
  rest: { text: `The block shrinks to a dot, leaving only the forces on it: its free-body diagram. Two equal and opposite forces, so the net force is zero and it stays at rest.`,
    facts: () => [['weight F<sub>g</sub>', `${f(M.W1)} N down`], ['normal F<sub>N</sub>', `${f(M.FN)} N up`], ['net force', '0 N']] },
  glide: { text: `The free-body diagram is the same as the block at rest. Σ<i>F</i> = 0 doesn’t mean “not moving”. It means “velocity not changing”.`,
    facts: s => [['velocity', `${f(M.V_GLIDE)} m/s, constant`], ['net force', '0 N'], ['acceleration', '0 m/s²']] },
  second: { text: `The red arrows are the net force on each block: the same 6.0 N. Divide by each mass to get its acceleration.`,
    facts: s => [['2.0 kg: a = 6.0/2.0', `${f(M.A1)} m/s²`], ['4.0 kg: a = 6.0/4.0', `${f(M.A2)} m/s²`], ['time', `${f(s.second.t)} s`]] },
  friction: { text: `The four forces on the block, live. Up and down cancel. Sideways, friction matches the push until the push passes ${f(M.F_SMAX)} N. After that friction drops to ${f(M.F_K)} N and the difference accelerates the block.`,
    facts: s => { const r = M.friction(s.friction.t); return [['push F<sub>app</sub>', `${f(r.F)} N`], [`friction (${r.kind})`, `${f(r.f)} N`], ['net force', `${f(r.F - r.f)} N`], ['acceleration', `${f(r.a)} m/s²`]]; } },
  third: { text: `Pulled apart for a moment, the pair is easy to see: A pushes B forward with ${f(M.CONTACT, 1)} N and B pushes A back with ${f(M.CONTACT, 1)} N. Same size, opposite direction, on different blocks.`,
    facts: () => [['F on A (outside push)', `${f(M.PUSH, 1)} N →`], ['F<sub>B on A</sub>', `${f(M.CONTACT, 1)} N ←`], ['F<sub>A on B</sub>', `${f(M.CONTACT, 1)} N →`], ['both accelerate at', `${f(M.A_PAIR, 1)} m/s²`]] },
  incline: { text: `The weight (straight down) is replaced by its two parts along the tilted axes. The normal force cancels the part into the slope. The part along the slope is the net force, so the block speeds up down the ramp.`,
    facts: () => [['mg sin θ', `${f(M.W_PAR)} N`], ['mg cos θ = F<sub>N</sub>', `${f(M.W_PERP)} N`], ['a = g sin θ', `${f(M.A_INC)} m/s²`]] },
};
