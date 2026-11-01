// node fluids/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// density
check('density: m = ρV, and ρ = m/V gives it back', M.MATERIALS.every(m => near(M.density(m.mass, M.CUBE_V), m.rho)), M.MATERIALS.map(m => `${m.name} ${m.mass.toFixed(2)} kg`).join(', '));
check('density: cut into 8 pieces, each has the same density', M.MATERIALS.every(m => near(M.density(m.mass / 8, M.CUBE_V / 8), m.rho)));
check('density: less dense than water floats', M.MATERIALS.filter(m => m.floats).map(m => m.key).join() === 'cork,ice');

// pressure
check('pressure: P = F/A on two shoes', near(M.P_SHOE * M.SHOE.A, M.PERSON.W), `${(M.P_SHOE / 1000).toFixed(2)} kPa`);
check('pressure: snowshoes, 8× the area, 1/8 the pressure', near(M.P_SHOE / M.P_SNOW, M.SNOWSHOE.A / M.SHOE.A) && near(M.SNOWSHOE.A / M.SHOE.A, 8), `${(M.P_SNOW / 1000).toFixed(3)} kPa`);
check('pressure: same force through a nail, 200× more pressure at the tip', near((M.NAIL.F / M.NAIL.tip) / (M.NAIL.F / M.NAIL.head), 200));

// hydrostatic pressure
check('depth: P0 + ρgh against a slab-by-slab column sum', [0, 1, 5, 10, 12].every(d => near(M.columnSum(d), M.pAt(d), 1e-9)), `P(10 m) = ${(M.pAt(10) / 1000).toFixed(1)} kPa`);
check('depth: the column sum does not depend on the column’s area', [0.01, 1, 50].every(A => near(M.columnSum(7, A), M.pAt(7), 1e-9)));
check('depth: about 10 m of water adds one atmosphere', Math.abs(M.gauge(10) / M.P0 - 1) < 0.04, `${(M.gauge(10) / M.P0).toFixed(3)} atm`);
check('depth: dP/dh = ρg', near((M.pAt(5 + 1e-3) - M.pAt(5 - 1e-3)) / 2e-3, M.RHO * M.G, 1e-6));
check('diver stays between 1 m and 10 m', [...Array(181).keys()].every(i => { const d = M.diveDepth(i / 10); return d >= 1 - 1e-9 && d <= 10 + 1e-9; }));

// Pascal
const Pa = M.PASCAL;
check('Pascal: same pressure under both pistons, F2/F1 = A2/A1', near(Pa.F1 / Pa.A1, Pa.F2 / Pa.A2) && near(Pa.F2 / Pa.F1, Pa.A2 / Pa.A1), `${Pa.F2.toFixed(0)} N, ${(Pa.A2 / Pa.A1).toFixed(0)}×`);
check('Pascal: volume pushed in = volume pushed out', [1, 2.5, 3.9].every(t => { const s = M.pascal(t); return near(s.d1 * Pa.A1, s.d2 * Pa.A2); }));
check('Pascal: work in = work out (F1 d1 = F2 d2)', [1, 2.5, 3.9].every(t => { const s = M.pascal(t); return near(Pa.F1 * s.d1, Pa.F2 * s.d2); }));

// buoyancy: integrate gauge pressure over the cube's six faces numerically
function faceSum(st, n = 120) {
  const s = M.BUOY.s, dA = (s / n) ** 2;
  let Fy = 0, Fx = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    Fy += M.gaugeAtY(st.yb, st.L) * dA;                                  // bottom face, pushed up
    Fy -= M.gaugeAtY(st.yb + s, st.L) * dA;                              // top face, pushed down
    const y = st.yb + (j + 0.5) * s / n;
    Fx += M.gaugeAtY(y, st.L) * dA - M.gaugeAtY(y, st.L) * dA;           // opposite sides
  }
  return { Fy, Fx };
}
const deep = M.buoy(M.BUOY.L0 - 0.6), half = M.buoy(M.BUOY.L0 - 0.1);
check('buoyancy: ∮P dA over the faces = ρ V g (fully under)', near(faceSum(deep).Fy, deep.Fb, 1e-9), `${deep.Fb.toFixed(2)} N`);
check('buoyancy: ∮P dA = ρ V_sub g (partly under)', near(faceSum(half).Fy, half.Fb, 1e-9), `${half.Fb.toFixed(2)} N`);
check('buoyancy: the sideways pushes cancel', Math.abs(faceSum(deep).Fx) < 1e-9);
check('buoyancy: (P_bottom − P_top)·A = ρ g s³', near((M.gaugeAtY(deep.yb, deep.L) - M.gaugeAtY(deep.yb + M.BUOY.s, deep.L)) * M.BUOY.s ** 2, M.BUOY.Fb));
check('buoyancy: does not grow once fully under', near(M.buoy(M.BUOY.L0 - 0.4).Fb, M.buoy(M.BUOY.L0 - 0.7).Fb));
check('buoyancy: the water level rises by V_sub / A_tank', [0.05, 0.15, 0.4].every(d => { const b = M.buoy(M.BUOY.L0 - d); return near((b.L - M.BUOY.L0) * M.BUOY.Atank, b.Vsub); }));
check('apparent weight: T = W − F_b', near(deep.T + deep.Fb, M.BUOY.W), `${M.BUOY.W.toFixed(1)} N → ${deep.T.toFixed(1)} N`);
{ const w = 2 * Math.PI / M.BUOY.T, amax = 0.55 * w * w;
  check('lowered slowly: m·a stays under 2% of the weight', M.BUOY.m * amax < 0.02 * M.BUOY.W, `${(M.BUOY.m * amax).toFixed(2)} N`); }
check('cube never touches the tank floor', M.buoyBottom(M.BUOY.T / 2) > 0.1);

// floating
for (const [name, c] of [['wood', M.WOOD], ['ice', M.ICE]])
  check(`floats: ${name} sinks until F_b = W`, near(c.Fb, c.W), `${(100 * c.draft / c.s).toFixed(1)}% under`);
check('floats: fraction under = ρ_object/ρ_water', near(M.WOOD.draft / M.WOOD.s, M.fractionUnder(M.WOOD.rho)) && near(M.ICE.draft / M.ICE.s, M.fractionUnder(M.ICE.rho)));
check('iceberg in sea water: 89% under', Math.abs(M.fractionUnder(917, M.RHO_SEA) - 0.895) < 0.001);
check('steel ball: F_b < W, the floor supplies the rest', M.BALL.Fb < M.BALL.W && near(M.BALL.N + M.BALL.Fb, M.BALL.W), `N = ${M.BALL.N.toFixed(0)} N`);
check('ship: average density below water, so it floats', M.SHIP.avg < M.RHO && near(M.SHIP.Fb, M.SHIP.W) && M.SHIP.draft < M.SHIP.h, `${M.SHIP.avg.toFixed(0)} kg/m³, draft ${(M.SHIP.draft * 100).toFixed(1)} cm`);

// continuity: move the water through the pipe by volume and differentiate the position
const P1 = M.PIPE1;
check('pipe volume table matches π r² for the straight ends', near(P1.VOL[100] - P1.VOL[0], Math.PI * M.FLOW.r1 ** 2 * (P1.S[100] - P1.S[0]), 1e-9));
check('continuity: A₁v₁ = A₂v₂', near(M.FLOW.A1 * M.FLOW.v1, M.FLOW.A2 * M.FLOW.v2) && near(M.FLOW.v2 / M.FLOW.v1, 4), `${M.FLOW.v1} → ${M.FLOW.v2} m/s`);
check('continuity: moved by volume, every slice moves at Q/A(x)', [-2, -0.3, 0.2, 2].every(x => {
  const s0 = P1.sOfX(x), V = P1.volOfS(s0), dt = 0.004;
  const v = (P1.sOfVol(V + M.FLOW.Q * dt) - P1.sOfVol(V - M.FLOW.Q * dt)) / (2 * dt);
  return near(v, M.FLOW.Q / P1.area(s0), 5e-3);
}), 'numeric d(position)/dt against Q/A');

// Bernoulli: integrate Euler's equation dP = −ρ v dv − ρ g dy along the pipe, numerically
{ const P2 = M.PIPE2, n = 20000; let P = M.BERN.P1; const ends = M.BERN.xs.map(x => P2.sOfX(x));
  const got = [P];
  for (let k = 1; k < 3; k++) {
    const a = ends[k - 1], b = ends[k];
    for (let i = 0; i < n; i++) {
      const s1 = a + (b - a) * i / n, s2 = a + (b - a) * (i + 1) / n, A = M.bern(s1), B = M.bern(s2);
      P += -M.RHO * (A.v + B.v) / 2 * (B.v - A.v) - M.RHO * M.G * (B.y - A.y);
    }
    got.push(P);
  }
  check('Bernoulli: Euler’s equation integrated along the pipe matches at points 2 and 3', got.every((p, k) => near(p, M.BERN.pts[k].P, 1e-6)), got.map(p => `${(p / 1000).toFixed(2)} kPa`).join(', '));
}
check('Bernoulli: P + ½ρv² + ρgy is the same at all three points', M.BERN.pts.every(p => near(p.P + p.K + p.U, M.BERN.E)), `${(M.BERN.E / 1000).toFixed(2)} kPa`);
check('Bernoulli: narrow part is fast and at low pressure', M.BERN.pts[1].v > M.BERN.pts[0].v && M.BERN.pts[1].P < M.BERN.pts[0].P, `${M.BERN.pts[1].v.toFixed(1)} m/s`);
check('Bernoulli: the high wide part, same speed, ρgH less pressure', near(M.BERN.pts[2].v, M.BERN.v1, 1e-6) && near(M.BERN.pts[0].P - M.BERN.pts[2].P, M.RHO * M.G * M.BERN.H, 1e-6));
check('Bernoulli: pressure stays positive (no cavitation)', [...Array(201).keys()].every(i => M.bern(M.PIPE2.len * i / 200).P > 0));

// Torricelli
check('Torricelli: ½mv² = mgh', [0.35, 0.8, 1.2].every(h => near(0.5 * M.torricelli(h) ** 2, M.G * h)), `v(1.2 m) = ${M.torricelli(1.2).toFixed(2)} m/s`);
check('Torricelli: the falling surface’s own speed changes v by < 0.1%', 1 / Math.sqrt(1 - M.TANK.ratio ** 2) - 1 < 1e-3);
{ let h = M.TANK.h0; const dt = 1e-3, T = 6;     // RK4 on A dh/dt = −a √(2gh)
  const f = h => -M.TANK.ratio * M.torricelli(h);
  for (let t = 0; t < T - 1e-12; t += dt) { const k1 = f(h), k2 = f(h + dt / 2 * k1), k3 = f(h + dt / 2 * k2), k4 = f(h + dt * k3); h += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); }
  check('draining: h(t) closed form against the ODE', near(h, M.tankH(T), 1e-8), `h(6 s) = ${h.toFixed(4)} m`); }
check('draining: reaches the bottom of the loop at T_drain', near(M.tankH(M.TANK.Tdrain), M.TANK.h1, 1e-9), `${M.TANK.Tdrain.toFixed(1)} s`);
{ const v = M.torricelli(1.0); let x = 0, y = M.TANK.yh, vy = 0; const dt = 1e-5;
  while (y > 0) { x += v * dt; vy -= M.G * dt; y += vy * dt; }
  check('jet: projectile range from kinematics = 2√(h·y_hole)', near(x, 2 * Math.sqrt(1.0 * M.TANK.yh), 1e-3) && near(M.jetRange(1.0), 2 * Math.sqrt(M.TANK.yh)), `${x.toFixed(3)} m`); }

// ---------- practice (practice.js) ----------
const { PRACTICE } = await import('./practice.js');
const NPAGES = 9;   // pages.js imports world.js (three.js, browser-only), so the page count is hardcoded
{ const bad = [];
  for (let i = 0; i < NPAGES; i++) {
    const qs = PRACTICE[i];
    if (!Array.isArray(qs) || qs.length < 1 || qs.length > 2) { bad.push(`page ${i}: ${qs ? qs.length : 0} items`); continue; }
    qs.forEach((it, n) => {
      const mcq = Array.isArray(it.choices) && it.choices.length === 4 && new Set(it.choices).size === 4 && Number.isInteger(it.answer) && it.answer >= 0 && it.answer < 4 && typeof it.why === 'string' && it.why.trim();
      const frq = !it.choices && typeof it.solution === 'string' && it.solution.trim();
      if (!(typeof it.q === 'string' && it.q.trim() && (mcq || frq))) bad.push(`${i}.${n + 1}`);
    });
  }
  const extra = Object.keys(PRACTICE).filter(k => !(+k >= 0 && +k < NPAGES));
  check('practice: every page has 1–2 well-formed items', !bad.length && !extra.length, bad.concat(extra).join(', ') || `${Object.values(PRACTICE).flat().length} items`); }
// the first number in a choice's text (HTML stripped, − read as minus)
const pnum = c => { const s = c.replace(/<[^>]+>/g, ' ').replace(/−/g, '-'); return Number(s.match(/-?\d+(\.\d+)?/)[0]); };
// keyed choice equals the independent value (to its printed precision), every distractor is > 2 % away
const keyed = (p, n, want, name) => {
  const it = PRACTICE[p][n], v = it.choices.map(pnum), k = v[it.answer], scale = Math.abs(want) || 1;
  const ok = Math.abs(k - want) <= 0.005 * scale && v.every((x, i) => i === it.answer || Math.abs(x - want) > 0.02 * scale);
  check(`practice ${p}.${n + 1}: ${name}`, ok, `keyed ${k}, recomputed ${+want.toPrecision(5)}`);
};
const pIntegral = (fn, a, b, n = 20000) => { let s = 0; const dx = (b - a) / n; for (let i = 0; i < n; i++) s += fn(a + (i + 0.5) * dx) * dx; return s; };
const pBisect = (fn, a, b) => { for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (fn(a) * fn(m) <= 0) b = m; else a = m; } return (a + b) / 2; };
{ const al = M.MATERIALS.find(m => m.key === 'al'); keyed(0, 0, (al.mass / 8) / (M.CUBE_V / 8), 'one eighth of the mass over one eighth of the volume'); }
{ const ice = M.MATERIALS.find(m => m.key === 'ice'); keyed(0, 1, ice.mass / 8, 'half the side: one eighth of the 10 cm cube'); }
keyed(1, 0, 2 * M.P_SHOE / 1000, 'one shoe: half the area of two, twice the pressure (kPa)');
keyed(2, 0, M.columnSum(M.LAKE.depth) / 1000, 'P0 + weight of the column, slab by slab (kPa)');
{ // 3.1 work in = work out: F1 d1 = F2 d2 with d2 = d1 A1/A2 from the volume
  const A1 = Math.PI * 0.02 ** 2, A2 = Math.PI * 0.1 ** 2, d1 = 0.1, d2 = d1 * A1 / A2;
  keyed(3, 0, 12000 * d2 / d1, 'F1 from equal work, F1 d1 = F2 d2'); }
keyed(3, 1, M.pascal(M.PASCAL.T / 2).d2 * 100, 'model press at full stroke (cm)');
{ // 4.1 the pressure difference across top and bottom faces, times the area
  const q = M.buoy(M.BUOY.L0 - 0.7), dF = (M.gaugeAtY(q.yb, q.L) - M.gaugeAtY(q.yb + M.BUOY.s, q.L)) * M.BUOY.s ** 2;
  keyed(4, 0, M.BUOY.W - dF, 'T = W − (P_bottom − P_top)s²'); }
keyed(5, 0, 100 * pBisect(h => M.RHO_SEA * M.G * M.WOOD.s ** 2 * h - M.WOOD.W, 0, M.WOOD.s) / M.WOOD.s, 'draft in sea water by bisection, as % of the block');
{ // 5.2 displaced volume as a stack of discs
  const r = M.BALL.r, V = pIntegral(z => Math.PI * (r * r - z * z), -r, r);
  keyed(5, 1, M.BALL.m * M.G - M.RHO * V * M.G, 'F_N = W − ρgV, V summed as discs'); }
keyed(6, 0, M.FLOW.Q / (Math.PI * 0.1 ** 2), 'v = Q/A with the 10 cm radius');
keyed(6, 1, 1.0 / (M.PIPE1.area(0) * M.FLOW.v1), 'fill time from the model pipe’s inlet area');
{ // 7.x the work–energy theorem on a parcel: ΔP = Δ(½ρv²) + Δ(ρgy), points read off the model pipe
  const q2 = M.bern(M.PIPE2.sOfX(0)), q3 = M.bern(M.PIPE2.sOfX(3.9));
  keyed(7, 0, (M.BERN.P1 - 0.5 * M.RHO * (q2.v ** 2 - M.BERN.v1 ** 2)) / 1000, 'P2 from ΔK per volume at the narrow point (kPa)');
  keyed(7, 1, (M.BERN.P1 - 0.5 * M.RHO * (q3.v ** 2 - M.BERN.v1 ** 2) - M.RHO * M.G * q3.y) / 1000, 'P3 from ΔK and ΔU per volume (kPa)'); }
check('practice 8.1: √(2g·4h) = 2√(2gh)', near(M.torricelli(4 * 0.7), 2 * M.torricelli(0.7)));
{ // 8.2 step the drop as a projectile from the hole
  const dt = 1e-6; let x = 0, y = M.TANK.yh, vy = 0; const vx = M.torricelli(0.6);
  while (y > 0) { vy -= M.G * dt; y += vy * dt; x += vx * dt; }
  keyed(8, 1, x, 'stepped projectile from the hole'); }

for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
