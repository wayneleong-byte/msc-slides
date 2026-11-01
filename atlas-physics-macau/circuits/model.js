// Circuits model: current in a wire, resistance, and DC and RC circuits. Pure functions, SI units.
// Every dot speed, arrow length, height and number on the page comes from here.

export const E_CH = 1.60e-19;          // C
export const SLOW = 1;                 // the clock runs at life speed unless a scene says otherwise

// ---------- current in a copper wire ----------
// 1.0 A in a 1.0 mm² copper wire
export const CU = { n: 8.5e28, sigma: 5.96e7, A: 1.0e-6, I: 1.0, m: 9.11e-31 };
CU.vd = CU.I / (CU.n * E_CH * CU.A);               // 7.35e-5 m/s
CU.J = CU.I / CU.A;                                // 1.0e6 A/m²
CU.E = CU.J / CU.sigma;                            // 0.0168 V/m
CU.r = Math.sqrt(CU.A / Math.PI);                  // 0.564 mm
CU.tauC = CU.m * CU.sigma / (CU.n * E_CH * E_CH);  // Drude time between collisions, 2.5e-14 s
CU.hours = 1 / CU.vd / 3600;                       // time to drift 1 m
// Drude: each electron speeds up from rest, hits an ion, stops, and starts again. A sawtooth whose
// average is the drift speed: v = 2 v_d (t mod T)/T, so x = v_d T per collision.
export const drudeV = (t, T, vd) => { const r = ((t % T) + T) % T; return 2 * vd * r / T; };
export const drudeX = (t, T, vd) => { const n = Math.floor(t / T), r = t - n * T; return n * vd * T + vd * r * r / T; };

// ---------- resistance of a wire: R = ρL/A ----------
export const RHO = { copper: 1.68e-8, aluminium: 2.65e-8, tungsten: 5.6e-8, nichrome: 1.10e-6 };
export const area = d => Math.PI * d * d / 4;
export const resistance = (rho, L, A) => rho * L / A;
export const RES = { rho: RHO.nichrome, V: 1.5, dThin: 0.5e-3, dThick: 1.0e-3, Lmin: 0.5, Lmax: 2.0, T: 12 };
export const resLength = t => (RES.Lmin + RES.Lmax) / 2 - (RES.Lmax - RES.Lmin) / 2 * Math.cos(2 * Math.PI * t / RES.T);
export const rThin = L => resistance(RES.rho, L, area(RES.dThin));
export const rThick = L => resistance(RES.rho, L, area(RES.dThick));

// ---------- circuits: modified nodal analysis ----------
// edge: { n, a, b, R } a resistor (current a→b = (Va − Vb)/R)
//       { n, a, b, E } an ideal battery, b is its + end: Vb − Va = E (current a→b through it)
//       { a, b }       an ideal wire: a 0 V source, so its current comes out of the solve too
// Returns V (by point) and I (by edge index, a→b).
export function solve(edges, ground) {
  const pts = [...new Set(edges.flatMap(e => [e.a, e.b]))].filter(p => p !== ground);
  const idx = new Map(pts.map((p, i) => [p, i]));
  const src = edges.map((e, i) => (e.R === undefined ? i : -1)).filter(i => i >= 0);
  const n = pts.length, N = n + src.length;
  const A = Array.from({ length: N }, () => new Array(N).fill(0)), z = new Array(N).fill(0);
  const at = p => (p === ground ? -1 : idx.get(p));
  edges.forEach(e => {
    if (e.R === undefined) return;
    const g = 1 / e.R, i = at(e.a), j = at(e.b);
    if (i >= 0) A[i][i] += g; if (j >= 0) A[j][j] += g;
    if (i >= 0 && j >= 0) { A[i][j] -= g; A[j][i] -= g; }
  });
  src.forEach((ei, k) => {
    const e = edges[ei], i = at(e.a), j = at(e.b), r = n + k;
    if (i >= 0) { A[i][r] += 1; A[r][i] -= 1; }
    if (j >= 0) { A[j][r] -= 1; A[r][j] += 1; }
    z[r] = e.E || 0;
  });
  const x = gauss(A, z);
  const V = { [ground]: 0 }; pts.forEach((p, i) => { V[p] = x[i]; });
  const I = edges.map((e, i) => (e.R === undefined ? x[n + src.indexOf(i)] : (V[e.a] - V[e.b]) / e.R));
  return { V, I };
}
function gauss(A, b) {
  const N = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < N; c++) {
    let p = c; for (let r = c + 1; r < N; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < N; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= N; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[N] / r[i]);
}
export const edgeI = (C, sol, name) => sol.I[C.edges.findIndex(e => e.n === name)];
const W = (a, b) => ({ a, b });

// Ohm's law: 6 V across 3 Ω
export const OHM = { E: 6, R: 3, ground: 'bl' };
OHM.edges = [{ n: 'bat', a: 'bl', b: 'tl', E: OHM.E }, W('tl', 'tr'), { n: 'R', a: 'tr', b: 'br', R: OHM.R }, W('br', 'bl')];
// power: a 24 Ω bulb on 12 V
export const BULB = { E: 12, R: 24, ground: 'bl', run: 10 };
BULB.edges = [{ n: 'bat', a: 'bl', b: 'tl', E: BULB.E }, { n: 'bulb', a: 'tl', b: 'tr', R: BULB.R, kind: 'bulb' }, W('tr', 'br'), W('br', 'bl')];
// a real battery: emf 12 V with 2 Ω inside, driving a bulb whose resistance sweeps 0.5–8 Ω
export const CELL = { E: 12, r: 2, ground: 'n0', Rmin: 0.5, Rmax: 8, T: 14 };
export const cellLoad = t => CELL.Rmin * (CELL.Rmax / CELL.Rmin) ** (0.5 - 0.5 * Math.cos(2 * Math.PI * t / CELL.T));
export const cellEdges = RL => [{ n: 'emf', a: 'n0', b: 'm', E: CELL.E }, { n: 'r', a: 'm', b: 'p', R: CELL.r, small: true }, W('p', 'tr'), { n: 'load', a: 'tr', b: 'br', R: RL, kind: 'bulb' }, W('br', 'n0')];
export const cellI = RL => CELL.E / (RL + CELL.r);
export const terminalV = I => CELL.E - I * CELL.r;
export const loadP = RL => cellI(RL) ** 2 * RL;
// series: 2 Ω and 4 Ω on 9 V (the organizer's)
export const SERIES = { E: 9, R1: 2, R2: 4, ground: 'br' };
SERIES.edges = [{ n: 'bat', a: 'br', b: 'bl', E: 9 }, W('bl', 'tl'), { n: 'R1', a: 'tl', b: 'tm', R: 2 }, { n: 'R2', a: 'tm', b: 'tr', R: 4 }, W('tr', 'br')];
// parallel: 2, 4 and 6 Ω on 9 V
export const PARALLEL = { E: 9, R: [2, 4, 6], ground: 'r3' };
PARALLEL.edges = [{ n: 'R1', a: 'l0', b: 'r0', R: 2 }, { n: 'R2', a: 'l1', b: 'r1', R: 4 }, { n: 'R3', a: 'l2', b: 'r2', R: 6 }, { n: 'bat', a: 'r3', b: 'l3', E: 9 },
  W('l3', 'l2'), W('l2', 'l1'), W('l1', 'l0'), W('r0', 'r1'), W('r1', 'r2'), W('r2', 'r3')];
export const seriesR = rs => rs.reduce((s, r) => s + r, 0);
export const parallelR = rs => 1 / rs.reduce((s, r) => s + 1 / r, 0);
// a combination circuit, reduced in three steps (the organizer's, with 2 + 4 + 2... = 8 Ω)
export const COMBO = { E: 9, R1: 2, R2: 4, R3: 2, R4: 2, R5: 2, ground: 'b' };
COMBO.R245 = seriesR([COMBO.R2, COMBO.R4, COMBO.R5]);   // 8 Ω
COMBO.R2345 = parallelR([COMBO.R3, COMBO.R245]);         // 1.6 Ω
COMBO.Req = COMBO.R1 + COMBO.R2345;                      // 3.6 Ω
export const COMBO_STAGES = [
  [{ n: 'R1', a: 'tl', b: 'a', R: 2 }, { n: 'R2', a: 'a', b: 'tr', R: 4 }, { n: 'R4', a: 'tr', b: 'br', R: 2 }, { n: 'R5', a: 'br', b: 'b', R: 2 }, { n: 'R3', a: 'a', b: 'b', R: 2 }, { n: 'bat', a: 'b', b: 'bl', E: 9 }, W('bl', 'tl')],
  [{ n: 'R1', a: 'tl', b: 'a', R: 2 }, W('a', 'tr'), { n: 'R245', a: 'tr', b: 'br', R: COMBO.R245 }, W('br', 'b'), { n: 'R3', a: 'a', b: 'b', R: 2 }, { n: 'bat', a: 'b', b: 'bl', E: 9 }, W('bl', 'tl')],
  [{ n: 'R1', a: 'tl', b: 'tr', R: 2 }, { n: 'R2345', a: 'tr', b: 'br', R: COMBO.R2345 }, W('br', 'b'), { n: 'bat', a: 'b', b: 'bl', E: 9 }, W('bl', 'tl')],
  [{ n: 'Req', a: 'tl', b: 'tr', R: COMBO.Req }, W('tr', 'br'), W('br', 'b'), { n: 'bat', a: 'b', b: 'bl', E: 9 }, W('bl', 'tl')],
];
// Kirchhoff: two batteries, five resistors (the organizer's). Its answers I1 0.52, I2 0.33, I3 0.19 A
// hold with the 6 V battery's + end at the bottom (flip = true); drawn + at the top, I3 comes out negative.
export const KIRCH = { E1: 12, E2: 6, R1: 10, R2: 10, R3: 20, R4: 20, R5: 5, ground: 'bl' };
export const kirchEdges = (flip = true) => [
  { n: 'E1', a: 'bl', b: 'z', E: 12 }, { n: 'R1', a: 'z', b: 'a', R: 10 }, { n: 'R3', a: 'a', b: 'tr', R: 20 },
  flip ? { n: 'E2', a: 'tr', b: 'br', E: 6 } : { n: 'E2', a: 'br', b: 'tr', E: 6 },
  { n: 'R4', a: 'br', b: 'b', R: 20 }, { n: 'R5', a: 'a', b: 'b', R: 5 }, { n: 'R2', a: 'b', b: 'bl', R: 10 }];
KIRCH.edges = kirchEdges(true);
KIRCH.loops = [['z', 'a', 'b', 'bl', 'z'], ['a', 'tr', 'br', 'b', 'a']];

// ---------- RC: charge through R, then flip the switch and discharge ----------
export const RC = { E: 12, R: 20e3, C: 100e-6 };
RC.tau = RC.R * RC.C;                 // 2.0 s
RC.Qmax = RC.E * RC.C;                // 1.2 mC
RC.Imax = RC.E / RC.R;                // 0.6 mA
RC.Tch = 5 * RC.tau;                  // charge for 5τ, then discharge for 5τ
RC.cycle = 2 * RC.Tch;
export const qCharge = t => RC.Qmax * (1 - Math.exp(-t / RC.tau));
export const iCharge = t => RC.Imax * Math.exp(-t / RC.tau);
export const Q0 = qCharge(RC.Tch);    // what the capacitor holds when the switch flips
export const qDischarge = t => Q0 * Math.exp(-t / RC.tau);
export const iDischarge = t => -Q0 / (RC.R * RC.C) * Math.exp(-t / RC.tau);   // reversed
// the circuit (switch drawn separately): bat bl→sa (+ at sa), blade sa|sb → pv, R pv→ct, C ct→cb, wires
export const RC_EDGES = [{ n: 'bat', a: 'bl', b: 'sa', E: RC.E }, { n: 'R', a: 'pv', b: 'ct', R: RC.R }, { n: 'C', a: 'ct', b: 'cb', kind: 'cap' }, W('cb', 'pm'), W('pm', 'bl'), W('pm', 'sb')];
export function rc(t) {
  const c = ((t % RC.cycle) + RC.cycle) % RC.cycle, charging = c < RC.Tch, s = charging ? c : c - RC.Tch;
  const Q = charging ? qCharge(s) : qDischarge(s), I = charging ? iCharge(s) : iDischarge(s);   // I: pv → ct
  const Vc = Q / RC.C, VR = I * RC.R;
  // potentials, bottom wire = 0
  const V = { bl: 0, cb: 0, pm: 0, sb: 0, sa: RC.E, ct: Vc, pv: charging ? RC.E : 0 };
  // currents a→b for each edge: the loop is bat-R-C-bottom while charging, R-C-rung while discharging
  const Ie = charging ? [I, I, I, I, I, 0] : [0, I, I, I, 0, I];
  return { c, s, charging, Q, I, Vc, VR, V, I_e: Ie };
}
