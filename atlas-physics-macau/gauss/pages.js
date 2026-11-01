// Chapter 10, page by page (after the AP Physics C E&M organizer, Unit 2). Text and an E(r) chart on
// the left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, SC, Y0 } from './world.js';

const f = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const nC = q => f(q * 1e9, 2);
const arrowNote = s => `Arrows: ${f(s, 1)} square${s === 1 ? '' : 's'} per kN/C. One grid square is 10 cm.`;

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], vlines = [], zero = false, cursor, cursors = [], label }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(Math.min(Math.max(y, y0), y1)).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const vl = vlines.map(([x, t]) => `<line class="grid" x1="${sx(x)}" x2="${sx(x)}" y1="${P.t}" y2="${H - P.b}"/><text class="ax" x="${sx(x)}" y="${H - 9}" text-anchor="middle">${t}</text>`).join('');
  const mk = marks.map(([x, y, t]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + 6}" y="${sy(y) + 14}">${t}</text>`).join('');
  const z = zero ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  const cs = [cursor, ...cursors].filter(Boolean).map(c => `<circle class="cursor" r="4.5" cx="-20" cy="-20" data-cursor="${c}"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${z}${vl}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2 + 40}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cs}
  </svg>`;
}
const curve = (fn, a, b, n = 80) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });
// chart ranges, shared with main.js for the live cursors
export const R = {
  flux: { x0: 0, x1: 180, y0: -80, y1: 80 },
  point: { x0: 0, x1: 26, y0: 0, y1: 2 },
  line: { x0: 0, x1: 22, y0: 0, y1: 0.8 },
  sheet: { x0: -15, x1: 15, y0: -0.5, y1: 0.5 },
  sphere: { x0: 0, x1: 26, y0: 0, y1: 2 },
  rod: { x0: 0, x1: 17, y0: 0, y1: 0.8 },
  cage: { x0: -40, x1: 40, y0: 0, y1: 3.2 },
};
const kE = fn => r => fn(r / 100) / 1000;     // r in cm → E in kN/C
const sphereChart = (fn, cursor, extra = []) => chart({ ...R.sphere, xlabel: 'r (cm)', ylabel: 'E (kN/C)', cursor, label: 'Field strength against distance from the centre',
  vlines: [[10, 'R']], series: [...extra, { pts: curve(kE(fn), 0.001, 26, 120) }] });

export const PAGES = [
  {
    kicker: 'Chapter 10', title: 'Electric flux', sub: 'how much field passes through',
    body: `
      <p class="lede">The <b>flux</b> Φ of a field through a surface measures how much of the field passes through it. Count the field lines that pierce the surface.</p>
      <div class="eq">Φ = <b>E</b> · <b>A</b> = <i>EA</i> cos θ</div>
      <p>The area vector <b>A</b> is perpendicular to the surface, as long as its area; θ is the angle between <b>E</b> and <b>A</b>. Bigger field, bigger area, or more face-on: more flux. Units: N·m²/C.</p>
      <p>This ${f(M.FLUX.side * 100, 0)} cm square turns in a uniform ${f(M.FLUX.E / 1000, 1)} kN/C field. Face on, Φ = ${f(M.FLUX.max, 0)} N·m²/C; edge on, 0; turned past 90°, negative. Through any <i>closed</i> surface a uniform field’s flux is 0.</p>
      <div class="charts">${chart({ ...R.flux, zero: true, xlabel: 'θ (°)', ylabel: 'Φ (N·m²/C)', cursor: 'flux', label: 'Flux against angle', series: [{ pts: curve(M.flux, 0, 180) }] })}</div>
      <p class="hintline">Click the square to split <b>E</b>. ${arrowNote(SC.flux)}</p>`,
    cam: { target: [STATIONS.flux + 0.3, Y0 - 0.2, 0], az: -16, el: 26, dist: 17 }, lit: 'flux', scene: 'flux', look: {},
    fig: 'A square turning in a uniform field',
  },
  {
    kicker: '10.1', title: 'Gauss’s law', sub: 'flux out = charge inside',
    body: `
      <p class="lede">Through any <b>closed</b> surface, the total flux out is the charge enclosed divided by ε<sub>0</sub>.</p>
      <div class="eq">∮ <b>E</b> · d<b>A</b> = <i>q</i><sub>enc</sub> / ε<sub>0</sub></div>
      <p>d<b>A</b> points outward. The sphere breathes, but Φ stays ${f(M.POINT.flux, 0)} N·m²/C: <i>E</i> falls as 1/<i>r</i>², the area 4π<i>r</i>² grows as <i>r</i>². On it <b>E</b> ∥ d<b>A</b> and <i>E</i> is constant, so</p>
      <div class="eq"><i>E</i> · 4π<i>r</i>² = <i>q</i>/ε<sub>0</sub> &nbsp;→&nbsp; <i>E</i> = <i>kq</i>/<i>r</i>²</div>
      <p>which is Coulomb’s law. The box holds no charge: every line that enters it leaves, so its flux is zero.</p>
      <div class="charts">${chart({ ...R.point, xlabel: 'r (cm)', ylabel: 'E (kN/C)', cursor: 'point', label: 'Point charge field against distance', series: [{ pts: curve(kE(M.pointE), 6.5, 26) }] })}</div>
      <p class="hintline">Click the sphere for d<b>A</b>, the box for each face. ${arrowNote(SC.point)}</p>`,
    cam: { target: [STATIONS.gauss + 1.2, Y0, 0], az: -10, el: 14, dist: 29 }, lit: 'gauss', scene: 'gauss', look: {},
    fig: `q = ${nC(M.POINT.q)} nC, two closed surfaces`,
  },
  {
    kicker: '10.2', title: 'A line of charge', sub: 'a cylinder around it',
    body: `
      <p class="lede">An infinite line with charge λ per metre. By symmetry <b>E</b> points straight out from the line, so wrap it in a coaxial cylinder of radius <i>r</i> and length <i>L</i>.</p>
      <p>Split the surface into two caps and a curved side. On the caps <b>E</b> ⊥ d<b>A</b>: no flux. On the side <b>E</b> ∥ d<b>A</b> and <i>E</i> is constant:</p>
      <div class="eq"><i>E</i> · 2π<i>rL</i> = λ<i>L</i>/ε<sub>0</sub> &nbsp;→&nbsp; <i>E</i> = 2<i>k</i>λ/<i>r</i></div>
      <p><i>L</i> cancels, and the field falls as 1/<i>r</i>, slower than a point charge’s. Here λ = ${nC(M.LINE.lam)} nC/m, so <i>E</i> = ${f(M.lineE(0.1), 0)} N/C at 10 cm.</p>
      <div class="charts">${chart({ ...R.line, xlabel: 'r (cm)', ylabel: 'E (kN/C)', cursor: 'line', label: 'Line charge field against distance', series: [{ pts: curve(kE(M.lineE), 4.5, 22) }] })}</div>
      <p class="hintline">Click the cylinder to take its caps off. ${arrowNote(SC.line)}</p>`,
    cam: { target: [STATIONS.line, Y0, 0], az: -32, el: 18, dist: 23 }, lit: 'line', scene: 'line', look: {},
    fig: 'Caps and side',
  },
  {
    kicker: '10.3', title: 'Sheets and plates', sub: 'a pillbox through the surface',
    body: `
      <p class="lede">A pillbox straddles each surface. Its side is parallel to <b>E</b>, so only the caps carry flux, and the enclosed charge is σ<i>A</i>.</p>
      <table class="data">
        <tr><th></th><th>non-conducting sheet</th><th>metal plate</th></tr>
        <tr><td>flux out of</td><td>both caps: 2<i>EA</i></td><td>one cap: <i>EA</i></td></tr>
        <tr><td>so <i>E</i> =</td><td>σ/2ε<sub>0</sub> = ${f(M.SHEET.E, 0)} N/C</td><td>σ/ε<sub>0</sub> = ${f(M.PLATE.E, 0)} N/C</td></tr>
      </table>
      <p>Inside the metal <i>E</i> = 0, so the plate’s inner cap carries nothing. Here σ = ${nC(M.SHEET.sigma)} nC/m² is the charge per area on the sheet and on <i>each face</i> of the plate. Neither field depends on distance: it is uniform.</p>
      <div class="charts">${chart({ ...R.sheet, zero: true, xlabel: 'height above the middle (cm)', ylabel: 'E (kN/C, up)', label: 'Field against height for the sheet and the plate',
        series: [{ cls: 'trend', pts: [[-15, -M.SHEET.E / 1000], [0, -M.SHEET.E / 1000], [0, M.SHEET.E / 1000], [15, M.SHEET.E / 1000]], tag: [-14, -M.SHEET.E / 1000 + 0.1, 'sheet'] },
          { pts: [[-15, -M.PLATE.E / 1000], [-3, -M.PLATE.E / 1000], [-3, 0], [3, 0], [3, M.PLATE.E / 1000], [15, M.PLATE.E / 1000]], tag: [5, M.PLATE.E / 1000 - 0.16, 'plate'] }] })}</div>
      <p class="hintline">Click either to open its pillbox. ${arrowNote(SC.sheet)}</p>`,
    cam: { target: [(STATIONS.sheet + STATIONS.plate) / 2, Y0, 0], az: -10, el: 24, dist: 30 }, lit: 'sheet', scene: 'sheet', look: {},
    fig: 'A sheet, and a metal plate',
  },
  {
    kicker: '10.4', title: 'A metal sphere', sub: 'inside and out',
    body: `
      <p class="lede">On a conductor, the charge spreads to the <b>surface</b>. A Gaussian sphere inside the metal encloses none of it.</p>
      <table class="data">
        <tr><td><i>r</i> &lt; <i>R</i></td><td><i>q</i><sub>enc</sub> = 0</td><td><i>E</i> = 0</td></tr>
        <tr><td><i>r</i> &gt; <i>R</i></td><td><i>q</i><sub>enc</sub> = <i>Q</i></td><td><i>E</i> · 4π<i>r</i>² = <i>Q</i>/ε<sub>0</sub> → <i>E</i> = <i>kQ</i>/<i>r</i>²</td></tr>
      </table>
      <p>Outside, the sphere acts like a point charge at its centre. The field jumps from 0 to <i>kQ</i>/<i>R</i>² = ${f(M.cSphere.E(M.SPH.R), 0)} N/C at the surface. Here <i>Q</i> = ${nC(M.SPH.Q)} nC and <i>R</i> = ${f(M.SPH.R * 100, 0)} cm. The wedge is cut away so you can see in.</p>
      <div class="charts">${sphereChart(M.cSphere.E, 'csphere')}</div>
      <p class="hintline">Click the sphere to see what the Gaussian sphere encloses. ${arrowNote(SC.sphere)}</p>`,
    cam: { target: [STATIONS.csphere, Y0, 0], az: -24, el: 16, dist: 16 }, lit: 'csphere', scene: 'csphere', look: {},
    fig: 'Charge on the surface only',
  },
  {
    kicker: '10.5', title: 'Insulating sphere', sub: 'charge all the way through',
    body: `
      <p class="lede">In an insulator charge stays put: here spread evenly through the volume, ρ = <i>Q</i>/(⁴⁄₃π<i>R</i>³) = ${f(M.SPH.rho * 1e6, 3)} μC/m³.</p>
      <p>Inside, <i>q</i><sub>enc</sub> = ρ⁴⁄₃π<i>r</i>³: use small <i>r</i> inside, big <i>R</i> outside.</p>
      <table class="data eqs">
        <tr><td><i>E</i> · 4π<i>r</i>² = ρ⁴⁄₃π<i>r</i>³/ε<sub>0</sub></td><td><i>E</i> = ρ<i>r</i>/3ε<sub>0</sub>, inside</td></tr>
        <tr><td><i>E</i> · 4π<i>r</i>² = ρ⁴⁄₃π<i>R</i>³/ε<sub>0</sub></td><td><i>E</i> = <i>kQ</i>/<i>r</i>², outside</td></tr>
      </table>
      <p><i>E</i> grows linearly to a peak at the surface, then falls as 1/<i>r</i>². Outside, it matches the metal sphere (same <i>Q</i>, <i>R</i>). If hollow, <i>E</i> = 0 in the hollow.</p>
      <div class="charts">${sphereChart(M.iSphere.E, 'isphere')}</div>
      <p class="hintline">Click the sphere to see the enclosed charge. ${arrowNote(SC.sphere)}</p>`,
    cam: { target: [STATIONS.isphere, Y0, 0], az: -24, el: 16, dist: 16 }, lit: 'isphere', scene: 'isphere', look: {},
    fig: 'E ∝ r inside, 1/r² outside',
  },
  {
    kicker: '10.6', title: 'Charged rods', sub: 'metal and insulating',
    body: `
      <p class="lede">Two long rods of radius <i>R</i> = ${f(M.ROD.R * 100, 0)} cm, each with λ = ${nC(M.ROD.lam)} nC per metre. Each gets a coaxial cylinder; its caps carry no flux.</p>
      <table class="data">
        <tr><th></th><th>metal (σ on the surface)</th><th>insulator (ρ inside)</th></tr>
        <tr><td><i>r</i> &lt; <i>R</i></td><td><i>E</i> = 0</td><td><i>E</i> = ρ<i>r</i>/2ε<sub>0</sub></td></tr>
        <tr><td><i>r</i> &gt; <i>R</i></td><td><i>E</i> = σ<i>R</i>/ε<sub>0</sub><i>r</i></td><td><i>E</i> = ρ<i>R</i>²/2ε<sub>0</sub><i>r</i></td></tr>
      </table>
      <p>Inside the insulator, <i>q</i><sub>enc</sub> = ρπ<i>r</i>²<i>L</i> and <i>E</i> · 2π<i>rL</i> = <i>q</i><sub>enc</sub>/ε<sub>0</sub>. Outside, both are just 2<i>k</i>λ/<i>r</i>, the line of charge again. A hollow insulating rod or sphere has <i>E</i> = 0 in its hollow.</p>
      <div class="charts">${chart({ ...R.rod, xlabel: 'r (cm)', ylabel: 'E (kN/C)', cursors: ['crod', 'irod'], label: 'Rod fields against distance', vlines: [[5, 'R']],
        series: [{ cls: 'trend', pts: curve(kE(M.cRod.E), 0.001, 17, 120), tag: [1.2, 0.07, 'metal'] }, { pts: curve(kE(M.iRod.E), 0.001, 17, 120), tag: [1.6, 0.36, 'insulator'] }] })}</div>
      <p class="hintline">Click a rod to see what its cylinder encloses. ${arrowNote(SC.rod)}</p>`,
    cam: { target: [(STATIONS.crod + STATIONS.irod) / 2, Y0 + 0.3, 0], az: -12, el: 14, dist: 19 }, lit: 'irod', scene: 'rods', look: {},
    fig: 'Metal left, insulator right',
  },
  {
    kicker: '10.7', title: 'Uneven charge', sub: 'ρ(r) = br',
    body: `
      <p class="lede">When ρ changes with <i>r</i>, add up thin shells, each holding ρ(<i>r</i>) · 4π<i>r</i>² d<i>r</i>.</p>
      <div class="eq"><i>q</i><sub>enc</sub> = ∫<sub>0</sub><sup><i>r</i></sup> <i>br</i>′ · 4π<i>r</i>′² d<i>r</i>′ = π<i>br</i>⁴</div>
      <p>Inside, <i>E</i> · 4π<i>r</i>² = π<i>br</i>⁴/ε<sub>0</sub> → <i>E</i> = <i>br</i>²/4ε<sub>0</sub>. Outside, <i>E</i> = <i>bR</i>⁴/4ε<sub>0</sub><i>r</i>². Here <i>b</i> = ${f(M.SPH.b * 1e6, 2)} μC/m⁴: the same ${nC(M.SPH.Q)} nC.</p>
      <table class="data"><tr><th>ρ(r)</th><td>C</td><td>br</td><td>br²</td><td>br³</td></tr><tr><th>E inside ∝</th><td>r</td><td>r²</td><td>r³</td><td>r⁴</td></tr></table>
      <div class="charts">${sphereChart(M.nSphere.E, 'nsphere', [{ cls: 'trend', pts: curve(kE(M.iSphere.E), 0.001, 10, 40), tag: [3.5, 0.95, 'uniform'] }])}</div>
      <p class="hintline">The charge dots thin toward the centre. ${arrowNote(SC.sphere)}</p>`,
    cam: { target: [STATIONS.nsphere, Y0, 0], az: -24, el: 16, dist: 16 }, lit: 'nsphere', scene: 'nsphere', look: {},
    fig: 'Denser toward the surface',
  },
  {
    kicker: '10.8', title: 'Conductors', sub: 'in equilibrium: the Faraday cage',
    body: `
      <p class="lede">Once the charges in a conductor stop moving:</p>
      <ol class="rules">
        <li><i>E</i> = 0 everywhere inside the metal.</li>
        <li>Any excess charge sits on the surface.</li>
        <li>Just outside, <b>E</b> is perpendicular to the surface, with <i>E</i> = σ/ε<sub>0</sub>.</li>
        <li>A hollow inside, with no charge in it, has no field: a <b>Faraday cage</b>.</li>
      </ol>
      <p>This uncharged shell sits in a uniform ${f(M.CAGE.E0 / 1000, 1)} kN/C field. Electrons crowd to the left, leaving the right positive; their field cancels <b>E</b><sub>0</sub> inside and bends the lines to meet the surface square-on. (With a current flowing, <i>E</i> in a wire is not zero.)</p>
      <div class="charts">${chart({ ...R.cage, xlabel: 'x (cm)', ylabel: 'E (kN/C)', label: 'Field along the axis through the shell', vlines: [[-14, '−R'], [14, 'R']],
        series: [{ pts: curve(x => M.len(M.cageField([x / 100, 0, 0])) / 1000, -40, 40, 400) }] })}</div>
      <p class="hintline">Click the shell for a Gaussian surface in the metal. ${arrowNote(SC.cage)}</p>`,
    cam: { target: [STATIONS.cage, Y0, 0], az: -18, el: 14, dist: 21 }, lit: 'cage', scene: 'cage', look: {},
    fig: 'No field inside the shell',
  },
];

// ---------- click a scene: what it breaks into ----------
const rNow = (s, sc) => M.breathe(s.clock, sc.rMin, sc.rMax, sc.T);
const sphereFacts = model => s => { const r = rNow(s, M.SPH); return [['Gaussian radius r', `${f(r * 100, 1)} cm (R = ${f(M.SPH.R * 100, 0)} cm)`], ['q<sub>enc</sub>', `${nC(model.qenc(r))} nC`], ['flux q<sub>enc</sub>/ε<sub>0</sub>', `${f(model.qenc(r) / M.EPS0, 1)} N·m²/C`], ['E = flux / 4πr²', `${f(model.E(r), 0)} N/C`]]; };
const rodFacts = model => s => { const r = rNow(s, M.ROD); return [['Gaussian radius r', `${f(r * 100, 1)} cm (R = ${f(M.ROD.R * 100, 0)} cm)`], ['cylinder length L', `${f(M.ROD.L * 100, 0)} cm`], ['q<sub>enc</sub>', `${f(model.qenc(r) * 1e12, 0)} pC`], ['E = q<sub>enc</sub>/(ε<sub>0</sub> 2πrL)', `${f(model.E(r), 0)} N/C`]]; };
export const PLATES = {
  flux: { text: `<b>E</b> splits into a part along <b>A</b>, <i>E</i> cos θ, and a part lying in the surface, <i>E</i> sin θ, that skims past without going through. Only the first carries flux. Equally: the square’s shadow along the field has area <i>A</i> cos θ (dashed).`,
    facts: s => { const d = M.fluxAngle(s.clock); return [['θ', `${f(d, 1)}°`], ['E cos θ', `${f(M.FLUX.E * Math.cos(d * Math.PI / 180), 0)} N/C`], ['A', `${f(M.FLUX.A, 3)} m²`], ['Φ = EA cos θ', `${f(M.flux(d), 1)} N·m²/C`]]; } },
  gauss: { text: `Each small patch d<b>A</b> (black) points straight out, along <b>E</b> (blue). So <b>E</b> · d<b>A</b> = <i>E</i> d<i>A</i> on every patch, and with <i>E</i> the same everywhere on the sphere, ∮ <i>E</i> d<i>A</i> = <i>E</i> · 4π<i>r</i>².`,
    facts: s => { const r = rNow(s, M.POINT); return [['r', `${f(r * 100, 1)} cm`], ['E = kq/r²', `${f(M.pointE(r), 0)} N/C`], ['4πr²', `${f(4 * Math.PI * r * r, 4)} m²`], ['Φ = E · 4πr²', `${f(M.pointE(r) * 4 * Math.PI * r * r, 1)} N·m²/C`], ['q/ε<sub>0</sub>', `${f(M.POINT.flux, 1)} N·m²/C`]]; } },
  box: { text: `The six faces pulled apart, each labelled with its own flux in N·m²/C, summed numerically from the charge’s field. Flux in (−) through the face nearest the charge, flux out (+) through the other five. They add to zero: the box encloses no charge.`,
    facts: () => { const b = M.boxFaces(); return [['near face (in)', `${f(b[1], 1)} N·m²/C`], ['far face', `${f(b[0], 1)} N·m²/C`], ['four sides', `${f(b[2] + b[3] + b[4] + b[5], 1)} N·m²/C`], ['total', `${f(Math.abs(b.reduce((a, c) => a + c)) < 0.05 ? 0 : b.reduce((a, c) => a + c), 1)} N·m²/C`]]; } },
  line: { text: `The caps come off. On a cap the field lies flat in it (grey arrows), so <b>E</b> ⊥ d<b>A</b> and no flux crosses. All the flux leaves through the curved side, where <b>E</b> ∥ d<b>A</b>.`,
    facts: s => { const r = rNow(s, M.LINE); return [['r', `${f(r * 100, 1)} cm`], ['side area 2πrL', `${f(2 * Math.PI * r * M.LINE.L, 4)} m²`], ['E = 2kλ/r', `${f(M.lineE(r), 0)} N/C`], ['flux through side', `${f(M.lineE(r) * 2 * Math.PI * r * M.LINE.L, 2)} N·m²/C`], ['λL/ε<sub>0</sub>', `${f(M.LINE.lam * M.LINE.L / M.EPS0, 2)} N·m²/C`]]; } },
  sheet: { text: `The caps lift off. Each carries <i>EA</i> outward; the side carries none. 2<i>EA</i> = σ<i>A</i>/ε<sub>0</sub>, so <i>E</i> = σ/2ε<sub>0</sub>, whatever the height of the pillbox.`,
    facts: () => [['σ', `${nC(M.SHEET.sigma)} nC/m²`], ['cap area A', `${f(M.SHEET.Abox * 1e4, 1)} cm²`], ['q<sub>enc</sub> = σA', `${f(M.SHEET.sigma * M.SHEET.Abox * 1e12, 1)} pC`], ['E = σ/2ε<sub>0</sub>', `${f(M.SHEET.E, 0)} N/C`]] },
  plate: { text: `The inner cap sits in the metal, where <i>E</i> = 0, so only the outer cap carries flux: <i>EA</i> = σ<i>A</i>/ε<sub>0</sub>. Same σ as the sheet, twice the field.`,
    facts: () => [['σ on each face', `${nC(M.PLATE.sigma)} nC/m²`], ['E in the metal', '0'], ['E outside = σ/ε<sub>0</sub>', `${f(M.PLATE.E, 0)} N/C`]] },
  csphere: { text: `The metal fades. Inside, the Gaussian sphere encloses nothing: no flux, no field. Once it is bigger than the metal it encloses all of <i>Q</i> (red shell) and <i>E</i> = <i>kQ</i>/<i>r</i>².`, facts: sphereFacts(M.cSphere) },
  isphere: { text: `The red ball is the charge the Gaussian sphere encloses. Inside, it grows as <i>r</i>³ while the area grows as <i>r</i>², so <i>E</i> grows as <i>r</i>. Outside, it stops at <i>Q</i>.`, facts: sphereFacts(M.iSphere) },
  nsphere: { text: `The red ball is the enclosed charge, now π<i>br</i>⁴: the outer shells hold more, so it grows fast as <i>r</i>⁴, and <i>E</i> = <i>q</i><sub>enc</sub>/(4π<i>r</i>²ε<sub>0</sub>) grows as <i>r</i>².`, facts: sphereFacts(M.nSphere) },
  crod: { text: `The metal fades. A Gaussian cylinder inside the metal encloses no charge. Outside it encloses σ · 2π<i>RL</i> (red), and <i>E</i> · 2π<i>rL</i> = σ2π<i>RL</i>/ε<sub>0</sub>.`, facts: rodFacts(M.cRod) },
  irod: { text: `The red core is the charge inside the Gaussian cylinder, ρπ<i>r</i>²<i>L</i> while <i>r</i> &lt; <i>R</i>. Divide by ε<sub>0</sub> and by the side area 2π<i>rL</i>: <i>E</i> = ρ<i>r</i>/2ε<sub>0</sub>.`, facts: rodFacts(M.iRod) },
  cage: { text: `A Gaussian sphere drawn inside the metal (dashed). <i>E</i> = 0 on it, so it encloses no net charge: no charge on the inner wall, and no field in the hollow. The arrows at the surface are perpendicular to it: in on the − side, out on the + side.`,
    facts: () => [['E<sub>0</sub>', `${f(M.CAGE.E0, 0)} N/C`], ['σ at the + pole', `${f(M.cageSigma(1) * 1e9, 2)} nC/m²`], ['E at the pole = σ/ε<sub>0</sub>', `${f(M.cageSigma(1) / M.EPS0, 0)} N/C`], ['E in the hollow', '0'], ['net charge on the shell', '0']] },
};
