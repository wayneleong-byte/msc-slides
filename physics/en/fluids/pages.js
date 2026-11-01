// Chapter 8, page by page (AP Physics 1, Unit 8: fluids). Text and charts on the left page; on the
// right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, SC, PY6, PY7 } from './world.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const kPa = (p, n = 1) => `${f(p / 1000, n)} kPa`;

// ---------- small SVG charts for the left page, with live cursors ----------
const W = 420, P = { l: 44, r: 14, t: 16, b: 30 };
export const CURSORS = {};       // key → (x, y) → [cx, cy]
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], cursors = [], label, h = 170, ylabels, xlabels }) {
  const H = h;
  const sx = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy = y => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b);
  for (const c of cursors) CURSORS[c] = (x, y) => [sx(x), sy(y)];
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const [yt, yb] = ylabels || [y1, y0], [xl, xr] = xlabels || [x0, x1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${yt}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${yb}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${xl}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${xr}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(c => `<circle class="cursor" r="4.5" cx="-20" cy="-20" data-cursor="${c}"/>`).join('')}
  </svg>`;
}
const sample = (fn, a, b, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });

// Bernoulli's energy per volume at the three points, as stacked bars
function bernBars() {
  const H = 150, top = 85, sy = v => P.t + (1 - v / top) * (H - P.t - P.b), bw = 60;
  const cols = M.BERN.pts.map((p, k) => {
    const x = P.l + 40 + k * 120; let y0 = 0, out = '';
    for (const [val, fill] of [[p.P, '#ecece8'], [p.K / 1000 * 1000, '#8fb0f0'], [p.U, '#9c9ca2']]) {
      const v = val / 1000; if (v > 0.01) out += `<rect x="${x}" y="${sy(y0 + v)}" width="${bw}" height="${sy(y0) - sy(y0 + v)}" fill="${fill}" stroke="#8a8a8f" stroke-width=".8"/>`; y0 += v;
    }
    return out + `<text class="lab" x="${x + bw / 2}" y="${H - 9}" text-anchor="middle">point ${k + 1}</text>`;
  }).join('');
  const tot = sy(M.BERN.E / 1000);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Energy per volume at three points: pressure, kinetic and potential parts always add to the same total">
    <line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>${cols}
    <line class="trend" x1="${P.l}" x2="${W - P.r}" y1="${tot}" y2="${tot}"/><text class="lab" x="${W - P.r}" y="${tot - 6}" text-anchor="end">total ${f(M.BERN.E / 1000, 0)} kPa</text>
    <text class="ax" x="${P.l - 6}" y="${sy(top) + 4}" text-anchor="end">${top}</text><text class="ax" x="${P.l - 6}" y="${sy(0) + 4}" text-anchor="end">0</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">kPa = kJ/m³: P (pale) + ½ρv² (blue) + ρgy (grey)</text>
  </svg>`;
}

const at = (k, dx = 0, dy = 0.5, dz = 0) => [STATIONS[k] + dx, dy, dz];
const Bp = M.BERN.pts;

export const PAGES = [
  {
    levels: ['junior', 'senior'],
    kicker: 'Chapter 8', title: 'Fluids', sub: 'density',
    body: `
      <p class="lede">A <b>fluid</b> is anything that flows: a liquid or a gas. Its molecules are not locked in place, so it takes the shape of its container. We describe it by its <b>density</b>, mass per volume:</p>
      <div class="eq">ρ = <i>m</i> / <i>V</i></div>
      <p>These five cubes are all 10 cm on a side, 1.0 L each: the same volume, very different masses, from ${f(M.MATERIALS[0].mass)} kg of cork to ${f(M.MATERIALS[4].mass)} kg of iron. On a graph of mass against volume each material is a straight line whose slope is its density.</p>
      <p>Density belongs to the material, not the object: cut a cube in half and both <i>m</i> and <i>V</i> halve. An <b>ideal fluid</b> is incompressible (its density never changes) and flows without friction. Water is very nearly one.</p>
      <div class="charts">${chart({ x0: 0, x1: 1, y0: 0, y1: 3, xlabel: 'volume (L)', ylabel: 'mass (kg): slope = ρ', label: 'Mass against volume for five materials: straight lines whose slope is the density', h: 150,
        series: M.MATERIALS.map(m => ({ pts: [[0, 0], [Math.min(1, 3 / m.mass), Math.min(m.mass, 3)]], tag: { cork: [0.78, 0.24, 'cork'], ice: [0.62, 0.95, 'ice, water'], water: null, al: [0.66, 1.8, 'aluminium'], iron: [0.4, 2.3, 'iron'] }[m.key] })) })}</div>
      <p class="hintline">Click the cubes to cut each into eight.</p>`,
    cam: { target: at('density', 0, 0.06), az: -14, el: 16, dist: 3.4 }, lit: 'blocks', scene: 'density', look: {},
    fig: 'Five 1-litre cubes',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.1', title: 'Pressure', sub: 'force spread over an area',
    body: `
      <p class="lede"><b>Pressure</b> is the force pushing straight onto a surface, per area:</p>
      <div class="eq"><i>P</i> = <i>F</i><sub>⊥</sub> / <i>A</i></div>
      <p>It is a scalar, measured in pascals: 1 Pa = 1 N/m². The same ${M.PERSON.m} kg person (${f(M.PERSON.W, 0)} N) stands on snow twice:</p>
      <table class="data">
        <tr><th></th><th>area</th><th>pressure</th></tr>
        <tr><td>shoes</td><td>${f(M.SHOE.A, 3)} m²</td><td>${kPa(M.P_SHOE)}</td></tr>
        <tr><td>snowshoes</td><td>${f(M.SNOWSHOE.A, 2)} m²</td><td>${kPa(M.P_SNOW, 2)}</td></tr>
      </table>
      <p>Eight times the area, one eighth of the pressure, so the snow holds. A nail works the other way: push its 1 cm² head with ${M.NAIL.F} N and its 0.5 mm² tip presses on the wood at ${f(M.NAIL.F / M.NAIL.tip / 1e6, 0)} MPa.</p>
      <div class="charts">${chart({ x0: 0, x1: 0.5, y0: 0, y1: 30, xlabel: 'contact area (m²)', ylabel: 'P = W/A (kPa)', label: 'Pressure against contact area for the same weight: P falls as 1/A', h: 118,
        series: [{ pts: sample(A => Math.min(M.PERSON.W / A / 1000, 30), 0.0229, 0.5) }], marks: [[M.SHOE.A, M.P_SHOE / 1000, 'shoes'], [M.SNOWSHOE.A, M.P_SNOW / 1000, 'snowshoes', -40, -10]] })}</div>
      <p class="hintline">Arrows: the push on the snow, one per 125 cm², ${f(SC.shoeP * 1e5, 1)} cm per kPa. Click to lift the people.</p>`,
    cam: { target: at('pressure', 0, 0.9), az: -18, el: 12, dist: 10.5 }, lit: 'feet', scene: 'pressure', look: {},
    fig: 'Same weight, more area',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.2', title: 'Pressure and depth', sub: 'the weight of the water above',
    body: `
      <p class="lede">Under water, pressure comes from the weight of the water above. A column of height <i>h</i> and area <i>A</i> weighs ρ<i>Ah g</i>, so it adds ρ<i>gh</i> to the pressure on top:</p>
      <div class="eq"><i>P</i> = <i>P</i><sub>0</sub> + ρ<i>gh</i></div>
      <p><i>P</i><sub>0</sub> = ${kPa(M.P0)} is the atmosphere pressing on the surface. <i>P</i> is the <b>absolute</b> pressure; ρ<i>gh</i> alone is the <b>gauge</b> pressure, the part above atmospheric. Every ${f(M.P0 / (M.RHO * M.G), 1)} m of water adds about one more atmosphere: at 10 m the diver feels ${kPa(M.pAt(10), 0)}.</p>
      <p>At one depth the pressure is the same in every direction, whatever the shape of the water around.</p>
      <div class="charts">${chart({ x0: 0, x1: 12, y0: 0, y1: 240, xlabel: 'depth h (m)', ylabel: 'pressure (kPa)', cursors: ['depth', 'gauge'], label: 'Absolute and gauge pressure against depth: parallel straight lines', h: 150,
        series: [{ pts: [[0, M.P0 / 1000], [12, M.pAt(12) / 1000]], tag: [7.4, M.pAt(7.4) / 1000 + 4, 'absolute'] }, { cls: 'trend', pts: [[0, 0], [12, M.gauge(12) / 1000]], tag: [8.6, M.gauge(8.6) / 1000 - 32, 'gauge ρgh'] }] })}</div>
      <p class="hintline">Arrows ${f(SC.lakeP * 1e5, 1)} cm per kPa. Click the diver to see the column of water above.</p>`,
    cam: { target: at('depth', 0.2, 6.4), az: -12, el: 6, dist: 44 }, lit: 'diver', scene: 'depth', look: {},
    fig: 'A diver, 1 m to 10 m down',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.3', title: 'Pascal’s principle', sub: 'a push felt everywhere',
    body: `
      <p class="lede">Push on a liquid shut in a container and the extra pressure reaches every part of it, and every wall, undiminished. That is <b>Pascal’s principle</b>.</p>
      <p>A ${M.PASCAL.F1} N push on the small piston adds Δ<i>P</i> = <i>F</i><sub>1</sub>/<i>A</i><sub>1</sub> = ${kPa(M.PASCAL.dP, 2)} everywhere. Under the large piston, ${f(M.PASCAL.A2 / M.PASCAL.A1, 0)} times the area, the same Δ<i>P</i> gives ${f(M.PASCAL.F2, 0)} N, enough to hold up ${f(M.PASCAL.load, 1)} kg:</p>
      <div class="eq"><i>F</i><sub>1</sub>/<i>A</i><sub>1</sub> = <i>F</i><sub>2</sub>/<i>A</i><sub>2</sub></div>
      <p>Nothing is free. Water can’t be squeezed, so the volume pushed down on the left comes up on the right: <i>A</i><sub>1</sub><i>d</i><sub>1</sub> = <i>A</i><sub>2</sub><i>d</i><sub>2</sub>. The big piston moves ${f(M.PASCAL.A2 / M.PASCAL.A1, 0)} times less, so the work in equals the work out, <i>F</i><sub>1</sub><i>d</i><sub>1</sub> = <i>F</i><sub>2</sub><i>d</i><sub>2</sub>.</p>
      <table class="data">
        <tr><th></th><th>area</th><th>force</th><th>moves</th></tr>
        <tr><td>small piston</td><td>${f(M.PASCAL.A1 * 1e4, 0)} cm²</td><td>${M.PASCAL.F1} N</td><td>${f(M.PASCAL.stroke * 100, 0)} cm</td></tr>
        <tr><td>large piston</td><td>${f(M.PASCAL.A2 * 1e4, 0)} cm²</td><td>${f(M.PASCAL.F2, 0)} N</td><td>${f(M.PASCAL.stroke * 100 * M.PASCAL.A1 / M.PASCAL.A2, 0)} cm</td></tr>
      </table>
      <p class="hintline">Each small arrow is Δ<i>P</i> on one ${f(M.PASCAL.A1 * 1e4, 0)} cm² patch: one under the small piston, sixteen under the large. Click to see Δ<i>P</i> on every wall.</p>`,
    cam: { target: at('pascal', -0.15, 0.8), az: -18, el: 14, dist: 7.2 }, lit: 'pascal', scene: 'pascal', look: {},
    fig: 'Same ΔP, sixteen times the area',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.4', title: 'Buoyancy', sub: 'Archimedes’ principle',
    body: `
      <p class="lede">Water pushes on every face of a submerged object, and it pushes harder lower down. The sideways pushes cancel; the push up on the bottom beats the push down on the top. The difference is the <b>buoyant force</b>.</p>
      <p>For a cube of side <i>s</i>: (<i>P</i><sub>bottom</sub> − <i>P</i><sub>top</sub>)<i>s</i>² = ρ<i>gs</i>·<i>s</i>² = ρ<i>Vg</i>, the weight of the water it pushes aside:</p>
      <div class="eq"><i>F</i><sub>b</sub> = ρ<sub>fluid</sub> <i>V</i><sub>displaced</sub> <i>g</i></div>
      <p>It grows as the cube goes in, then stays at ${f(M.BUOY.Fb, 0)} N however deep. The string holds the rest, the <b>apparent weight</b> <i>T</i> = <i>W</i> − <i>F</i><sub>b</sub> = ${f(M.BUOY.W - M.BUOY.Fb, 0)} N instead of ${f(M.BUOY.W, 0)} N.</p>
      <div class="charts">${chart({ x0: -0.35, x1: 0.75, y0: 0, y1: 900, xlabel: 'depth of the bottom face (m)', ylabel: 'force (N)', cursors: ['fb', 'T'], label: 'Buoyant force and string tension against how deep the cube is', h: 140, xlabels: ['−0.35', '0.75'],
        series: [{ pts: sample(d => M.buoy(M.BUOY.L0 - d).Fb, -0.35, 0.75), tag: [0.45, M.BUOY.Fb + 10, 'F_b'] }, { pts: sample(d => M.buoy(M.BUOY.L0 - d).T, -0.35, 0.75), tag: [0.45, M.BUOY.W - M.BUOY.Fb + 10, 'T = W − F_b'] }, { cls: 'trend', pts: [[-0.35, M.BUOY.W], [0.75, M.BUOY.W]], tag: [0.6, M.BUOY.W + 10, 'W'] }] })}</div>
      <p class="hintline">Gauge pressure, ${f(SC.buoyP * 1e5, 1)} cm per kPa; forces ${f(SC.buoyF * 1000, 1)} mm per N. Click for each face’s total push.</p>`,
    cam: { target: at('buoy', 0, 0.95), az: -20, el: 8, dist: 6.8 }, lit: 'cube', scene: 'buoy', look: {},
    fig: `A ${f(M.BUOY.s * 100, 0)} cm aluminium cube on a string`,
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.5', title: 'Float or sink', sub: 'compare densities',
    body: `
      <p class="lede">If an object is less dense than water it sinks only until the water it displaces weighs as much as it does: ρ<sub>fluid</sub><i>V</i><sub>under</sub><i>g</i> = ρ<sub>obj</sub><i>Vg</i>, so</p>
      <div class="eq"><i>V</i><sub>under</sub> / <i>V</i> = ρ<sub>obj</sub> / ρ<sub>fluid</sub></div>
      <table class="data">
        <tr><th></th><th>ρ (kg/m³)</th><th>result</th></tr>
        <tr><td>wooden block</td><td>${M.WOOD.rho}</td><td>floats, ${f(100 * M.WOOD.draft / M.WOOD.s, 0)}% under</td></tr>
        <tr><td>ice</td><td>${M.ICE.rho}</td><td>floats, ${f(100 * M.ICE.draft / M.ICE.s, 1)}% under</td></tr>
        <tr><td>steel ball</td><td>${M.BALL.rho}</td><td>sinks</td></tr>
        <tr><td>steel ship, average</td><td>${f(M.SHIP.avg, 0)}</td><td>floats, ${f(M.SHIP.draft * 100, 1)} cm deep</td></tr>
      </table>
      <p>An iceberg in sea water is ${f(100 * M.fractionUnder(917, M.RHO_SEA), 0)}% under. The ball’s <i>F</i><sub>b</sub> = ${f(M.BALL.Fb, 0)} N can’t match its ${f(M.BALL.W, 0)} N; the floor pushes up the rest. The ship is steel shaped to hold air.</p>
      <div class="charts">${chart({ x0: 0, x1: 1.5, y0: 0, y1: 1.15, xlabel: 'ρ_object / ρ_water', ylabel: 'fraction under water', label: 'Fraction submerged against density ratio: equal to it, up to 1, where things sink', h: 104, ylabels: ['', '0'],
        series: [{ pts: [[0, 0], [1, 1], [1.5, 1]], tag: [1.02, 1.0, 'sinks →'] }], marks: [[M.SHIP.avg / 1000, M.SHIP.avg / 1000, 'ship'], [0.6, 0.6, 'wood'], [0.917, 0.917, 'ice', -26, -8]] })}</div>
      <p class="hintline">Forces ${f(SC.floatF * 1000, 1)} mm per N. Click to lift out the displaced water.</p>`,
    cam: { target: at('float', 0.15, 0.55), az: -10, el: 9, dist: 12.5 }, lit: 'float', scene: 'float', look: {},
    fig: 'Wood, ice, a steel ball, a steel ship',
  },
  {
    levels: ['senior'],
    kicker: '8.6', title: 'Continuity', sub: 'what goes in comes out',
    body: `
      <p class="lede">Water can’t be squeezed and the pipe doesn’t leak, so every second the same volume passes every cross-section. That is the <b>volume flow rate</b>, <i>Q</i> = <i>Av</i>:</p>
      <div class="eq"><i>A</i><sub>1</sub><i>v</i><sub>1</sub> = <i>A</i><sub>2</sub><i>v</i><sub>2</sub></div>
      <p>The pipe narrows to half the radius, a quarter of the area, so the water speeds up four times: from ${f(M.FLOW.v1, 1)} m/s to ${f(M.FLOW.v2, 1)} m/s. <i>Q</i> = ${f(M.FLOW.Q * 1000, 0)} L/s everywhere.</p>
      <p>Follow the dark slice of water: in the wide part it is short and fat; in the narrow part the same volume is long and thin. A thumb over a hose does the same thing.</p>
      <div class="charts">${chart({ x0: 0, x1: 0.3, y0: 0, y1: 3, xlabel: 'cross-section area A (m²)', ylabel: 'speed v = Q/A (m/s)', cursors: ['flow'], label: 'Speed against cross-section area: v falls as 1/A', h: 150,
        series: [{ pts: sample(A => Math.min(M.FLOW.Q / A, 3), M.FLOW.Q / 3, 0.3) }], marks: [[M.FLOW.A1, M.FLOW.v1, 'A₁', -6, -10], [M.FLOW.A2, M.FLOW.v2, 'A₂']] })}</div>
      <p class="hintline">Velocity ${f(SC.flowV * 100, 0)} cm per m/s. Click the pipe to pull out its two cross-sections.</p>`,
    cam: { target: at('continuity', 0, PY6 + 0.1), az: -12, el: 14, dist: 14 }, lit: 'pipe', scene: 'continuity', look: {},
    fig: 'Quarter the area, four times the speed',
  },
  {
    levels: ['senior'],
    kicker: '8.7', title: 'Bernoulli', sub: 'energy conservation for a fluid',
    body: `
      <p class="lede">Follow a bit of water along the pipe. Where it speeds up, something has to push it forward: the pressure behind it must be higher than ahead. So <b>fast flow means low pressure</b>.</p>
      <p>Energy per volume is conserved along the flow (ideal fluid, steady flow):</p>
      <div class="eq"><i>P</i> + ½ρ<i>v</i>² + ρ<i>gy</i> = constant</div>
      <table class="data">
        <tr><th></th><th><i>v</i></th><th><i>y</i></th><th><i>P</i> (gauge)</th></tr>
        ${Bp.map((p, k) => `<tr><td>${k + 1} ${['wide, low', 'narrow, low', 'wide, high'][k]}</td><td>${f(p.v, 1)} m/s</td><td>${f(p.y, 1)} m</td><td>${kPa(p.P)}</td></tr>`).join('')}
      </table>
      <div class="charts">${bernBars()}</div>
      <p class="hintline">Half speed. Pressure ${f(SC.bernP * 1e5, 1)} cm per kPa. Click to stand the bars beside the pipe.</p>`,
    cam: { target: at('bernoulli', 0.8, PY7 + 0.6), az: -12, el: 10, dist: 24.5 }, lit: 'bernoulli', scene: 'bernoulli', look: {},
    fig: 'Fast where narrow, slow where high',
  },
  {
    levels: ['senior'],
    kicker: '8.8', title: 'Torricelli’s law', sub: 'a jet from a hole',
    body: `
      <p class="lede">Water leaves a hole <i>h</i> below the surface. Apply Bernoulli from the open surface (atmospheric, nearly still) to the jet (atmospheric again): the pressure terms cancel, leaving ρ<i>gh</i> = ½ρ<i>v</i>², so</p>
      <div class="eq"><i>v</i> = √(2<i>gh</i>)</div>
      <p>The same speed as a drop falling freely through <i>h</i>. Here <i>h</i> starts at ${f(M.TANK.h0, 1)} m, so <i>v</i> = ${f(M.torricelli(M.TANK.h0))} m/s. As the tank drains, <i>h</i> and <i>v</i> fall together.</p>
      <p>Once out, every drop is a projectile: <i>v</i> across, falling ${f(M.TANK.yh, 2)} m in ${f(M.jetFlight, 3)} s. Its range is <i>v t</i> = 2√(<i>h y</i><sub>hole</sub>), ${f(M.jetRange(M.TANK.h0))} m when full.</p>
      <div class="charts">${chart({ x0: 0, x1: 1.2, y0: 0, y1: 5, xlabel: 'water height above the hole h (m)', ylabel: 'jet speed v (m/s)', cursors: ['tank'], label: 'Jet speed against water height: the square root of 2gh', h: 150,
        series: [{ pts: sample(h => M.torricelli(h), 0, 1.2) }] })}</div>
      <p class="hintline">Velocity ${f(SC.jetV * 100, 0)} cm per m/s. Click the tank to split a drop’s velocity.</p>`,
    cam: { target: at('torricelli', -0.05, 1.15), az: -14, el: 10, dist: 10 }, lit: 'tank', scene: 'torricelli', look: {},
    fig: 'A tank draining through a hole',
  },
];

// ---------- click a scene: what it breaks into ----------
const b4 = s => s.st4;
export const PLATES = {
  blocks: { text: `Each cube comes apart into eight smaller cubes. Each piece has one eighth of the mass and one eighth of the volume, so the same density. Density is a property of the stuff, not of how much you have.`,
    facts: () => M.MATERIALS.map(m => [`${m.name}: ${f(m.mass / 8, 3)} kg / 0.125 L`, `${m.rho} kg/m³`]) },
  feet: { text: `The people lift away, leaving their contact patches on the snow. The total force is the same ${f(M.PERSON.W, 0)} N for both; the snowshoes spread it over eight times the area, so each patch is pushed eight times less hard.`,
    facts: () => [['weight W', `${f(M.PERSON.W, 0)} N`], ['shoes: W / A', `${f(M.PERSON.W, 0)} / ${f(M.SHOE.A, 3)} = ${kPa(M.P_SHOE)}`], ['snowshoes: W / A', `${f(M.PERSON.W, 0)} / ${f(M.SNOWSHOE.A, 2)} = ${kPa(M.P_SNOW, 2)}`], ['ratio', `${f(M.P_SHOE / M.P_SNOW, 0)}×`]] },
  diver: { text: `The darker column is the water straight above the diver, 1 m² across. Its weight, spread over that 1 m², is the gauge pressure ρgh. Add the atmosphere on top and you have the absolute pressure. The arrows from below are a little longer than from above: the diver’s feet are deeper than the head.`,
    facts: s => { const d = M.diveDepth(s.clock); return [['depth h', `${f(d, 2)} m`], ['column weight ρ(1 m²)h g', `${f(M.gauge(d) / 1000, 1)} kN`], ['gauge ρgh', kPa(M.gauge(d))], ['absolute P₀ + ρgh', kPa(M.pAt(d))], ['in atmospheres', `${f(M.pAt(d) / M.P0, 2)} atm`]]; } },
  pascal: { text: `The extra pressure from the push is the same on every wall and both pistons. What differs is the area it acts on: sixteen times the area under the large piston, so sixteen times the force.`,
    facts: s => { const p = M.pascal(s.clock); return [['ΔP everywhere', kPa(M.PASCAL.dP, 2)], ['F₁ = ΔP·A₁', `${M.PASCAL.F1} N`], ['F₂ = ΔP·A₂', `${f(M.PASCAL.F2, 0)} N`], ['small piston down d₁', `${f(p.d1 * 100, 1)} cm`], ['large piston up d₂', `${f(p.d2 * 100, 2)} cm`], ['work F₁d₁ = F₂d₂', `${f(M.PASCAL.F1 * p.d1, 2)} J`]]; } },
  cube: { text: `The arrows on each face are replaced by that face’s total push, <i>P</i>·<i>A</i> at the face’s centre. The four sides cancel in pairs. Bottom minus top is the buoyant force, the same as the weight of the water the cube pushes aside.`,
    facts: s => { const b = b4(s), A = M.BUOY.s ** 2, top = M.gaugeAtY(b.yb + M.BUOY.s, b.L) * A, bot = M.gaugeAtY(b.yb, b.L) * A;
      return [['up on the bottom', `${f(bot, 1)} N`], ['down on the top', `${f(top, 1)} N`], ['F_b = bottom − top', `${f(bot - top, 1)} N`], ['ρ V_under g', `${f(b.Fb, 1)} N`], ['tension T = W − F_b', `${f(b.T, 1)} N`], ['water level rise', `${f((b.L - M.BUOY.L0) * 1000, 1)} mm`]]; } },
  float: { text: `Each blue block is the water that object pushes aside, lifted out. For the floaters it weighs exactly what the object weighs. The steel ball pushes aside its whole volume and that still isn’t enough.`,
    facts: () => [['wood: W = F_b', `${f(M.WOOD.W, 0)} N`], ['ice: W = F_b', `${f(M.ICE.W, 0)} N`], ['steel ball: W, F_b', `${f(M.BALL.W, 0)} N, ${f(M.BALL.Fb, 0)} N`], ['ship: W = F_b', `${f(M.SHIP.W, 0)} N (${f(M.SHIP.m, 1)} kg of steel)`]] },
  pipe: { text: `The two cross-sections slide out. Each second ${f(M.FLOW.Q * 1000, 0)} L passes both: through ${f(M.FLOW.A1, 3)} m² at ${f(M.FLOW.v1, 1)} m/s, and through ${f(M.FLOW.A2, 3)} m² at ${f(M.FLOW.v2, 1)} m/s.`,
    facts: s => { const A = M.PIPE1.area(s.slab6); return [['A₁v₁', `${f(M.FLOW.A1, 4)} × ${f(M.FLOW.v1, 1)} = ${f(M.FLOW.Q, 4)} m³/s`], ['A₂v₂', `${f(M.FLOW.A2, 4)} × ${f(M.FLOW.v2, 1)} = ${f(M.FLOW.Q, 4)} m³/s`], ['the dark slice: A', `${f(A, 4)} m²`], ['its speed Q/A', `${f(M.FLOW.Q / A, 2)} m/s`]]; } },
  bernoulli: { text: `Behind each point stands its energy per volume: pressure (pale), kinetic ½ρv² (blue) and potential ρgy (grey). The pieces trade with each other but the stacks are always the same height. The same trade lifts a wing: air over its curved top moves faster, so it presses less from above than from below.`,
    facts: () => Bp.map((p, k) => [`point ${k + 1}: P + ½ρv² + ρgy`, `${f(p.P / 1000, 1)} + ${f(p.K / 1000, 1)} + ${f(p.U / 1000, 1)} = ${f((p.P + p.K + p.U) / 1000, 1)} kPa`]) },
  tank: { text: `The dashed line is the path for the present speed. The drop shown 0.25 s after leaving has the same horizontal speed v it left with (grey, across) and has gained g·t downward (grey, down).`,
    facts: s => { const h = s.h8, v = M.torricelli(h); return [['h', `${f(h)} m`], ['v = √(2gh)', `${f(v)} m/s`], ['½v² = gh', `${f(0.5 * v * v, 2)} = ${f(M.G * h, 2)} J/kg`], ['time to fall', `${f(M.jetFlight, 3)} s`], ['range', `${f(M.jetRange(h))} m`]]; } },
};
