// node circular/checks.mjs — invariants of the model. Exit 1 on any failure.
import * as M from './model.js';

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const h = 1e-6;
const T = [0.1, 0.7, 1.9];

// uniform circular motion: closed forms against numeric derivatives
const u = t => M.uniform(M.BALL.r, M.V1, t);
check('circle: |r| constant', T.every(t => near(Math.hypot(u(t).x, u(t).z), M.BALL.r)));
check('circle: v = dr/dt', T.every(t => near((u(t + h).x - u(t - h).x) / (2 * h), u(t).vx, 1e-6) && near((u(t + h).z - u(t - h).z) / (2 * h), u(t).vz, 1e-6)));
check('circle: a = dv/dt', T.every(t => near((u(t + h).vx - u(t - h).vx) / (2 * h), u(t).ax, 1e-5) && near((u(t + h).vz - u(t - h).vz) / (2 * h), u(t).az, 1e-5)));
check('circle: speed constant, v ⟂ a', T.every(t => near(Math.hypot(u(t).vx, u(t).vz), M.V1) && near(u(t).vx * u(t).ax + u(t).vz * u(t).az, 0)));
check('circle: a points to the centre, |a| = v²/r', T.every(t => near(u(t).ax * u(t).x + u(t).az * u(t).z, -u(t).a * M.BALL.r) && near(u(t).a, M.V1 ** 2 / M.BALL.r)), `${M.ac(M.V1, M.BALL.r).toFixed(2)} m/s²`);
check('circle: one lap takes T = 2πr/v', near(u(M.period(M.V1, M.BALL.r)).x, u(0).x, 1e-9) && near(u(M.period(M.V1, M.BALL.r)).z, u(0).z, 1e-9));
check('Δv/Δt → v²/r as Δt → 0', near(M.avgAccel(M.V1, M.BALL.r, 1e-4), M.ac(M.V1, M.BALL.r), 1e-6) && M.avgAccel(M.V1, M.BALL.r, M.DPHI) < M.ac(M.V1, M.BALL.r), `${M.avgAccel(M.V1, M.BALL.r, M.DPHI).toFixed(2)} at 50°`);
check('double the speed, 4× the tension', near(M.tension(M.V2) / M.tension(M.V1), 4), `${M.tension(M.V1).toFixed(2)} → ${M.tension(M.V2).toFixed(2)} N`);
check('half the radius, 2× the tension', near(M.tension(M.V1, M.BALL.r / 2) / M.tension(M.V1), 2));

// flat curve
check('flat curve: friction needed below μs·mg', M.CAR.f < M.CAR.fmax, `${M.CAR.f.toFixed(0)} N < ${M.CAR.fmax.toFixed(0)} N`);
check('flat curve: at v_max, m v²/r = μs m g', near(M.CAR.m * M.CAR.vmax ** 2 / M.CAR.r, M.CAR.fmax), `${M.CAR.vmax.toFixed(2)} m/s`);

// cone
check('cone: T sin θ = m v²/r', near(M.CONE.Tx, M.CONE.m * M.CONE.v ** 2 / M.CONE.r));
check('cone: T cos θ = mg', near(M.CONE.Ty, M.CONE.m * M.G));
check('cone: components add back to T', near(Math.hypot(M.CONE.Tx, M.CONE.Ty), M.CONE.T), `${M.CONE.T.toFixed(2)} N`);

// loop
const L = M.LOOP;
check('loop: v_top above v_min = √(gr)', L.vTop > L.vmin && near(M.loopN(Math.PI), L.m * (L.vTop ** 2 / L.r - M.G)), `${L.vmin.toFixed(2)} m/s`);
check('loop: at v_min the normal force at the top is zero', near(L.m * L.vmin ** 2 / L.r - L.W, 0, 1e-9));
check('loop: bottom F_N = m(v²/r + g), top F_N = m(v²/r − g)', near(M.loopN(0), L.m * (M.loopV(0) ** 2 / L.r + M.G)) && near(M.loopN(Math.PI), L.m * (M.loopV(Math.PI) ** 2 / L.r - M.G)));
check('loop: energy ½mv² + mgh conserved', [0, 1, 2, 3, 4, 5, 6].every(p => near(0.5 * M.loopV(p) ** 2 + M.G * L.r * (1 - Math.cos(p)), 0.5 * M.loopV(0) ** 2)));
check('loop: dv/dt = −g sin φ (only gravity is along the track)', [0.4, 1.7, 2.9, 4.4].every(t => { const s = M.loopState(t); return near((M.loopState(t + 1e-5).v - M.loopState(t - 1e-5).v) / 2e-5, s.at, 1e-4); }));
check('loop: dφ/dt = v/r', [0.3, 1.1, 2.2].every(t => near((M.loopPhi(t + 1e-5) - M.loopPhi(t - 1e-5)) / 2e-5, M.loopV(M.loopPhi(t)) / L.r, 1e-5)), `lap ${L.T.toFixed(2)} s`);
check('loop: net force = (m v²/r inward, m a_t along)', [0.5, 1.5, 2.5].every(t => { const s = M.loopState(t); const inward = s.net[0] * s.n[0] + s.net[1] * s.n[1], along = s.net[0] * s.tan[0] + s.net[1] * s.tan[1]; return near(inward, L.m * s.ac, 1e-9) && near(along, L.m * s.at, 1e-9); }));

// banked curve
check('bank: F_N sin θ = m v²/r', near(M.BANK.Nx, M.BANK.m * M.BANK.v ** 2 / M.BANK.r), `v ${M.BANK.v.toFixed(2)} m/s`);
check('bank: F_N cos θ = mg', near(M.BANK.Ny, M.BANK.W));
check('bank: flat road needs v = 0', near(M.bankSpeed(0), 0));

// disc
check('disc: v = rω, double r doubles v', near(M.DISC.v2 / M.DISC.v1, M.DISC.r2 / M.DISC.r1) && near(M.DISC.v1, M.DISC.r1 * M.DISC.w));
check('disc: every point has the same period 2πr/v', near(M.period(M.DISC.v1, M.DISC.r1), M.period(M.DISC.v2, M.DISC.r2)) && near(M.DISC.T, M.period(M.DISC.v1, M.DISC.r1)));
check('rpm ↔ rad/s', near(M.rpmToRad(5000), 523.6, 1e-4) && near(M.radToRpm(M.rpmToRad(33)), 33), '5000 rpm = 523.6 rad/s');

// gravitation
check('g = GM/R² = 9.80 at Earth’s surface', near(M.EARTH.g, 9.80, 2e-3), `${M.EARTH.g.toFixed(3)} m/s²`);
check('person: GMm/R² = mg = 784 N', near(M.gravF(M.EARTH.M, M.PERSON, M.EARTH.R), 784, 2e-3));
check('inverse square: 3× the distance, 1/9 the force', near(M.gravF(1, 1, 3) / M.gravF(1, 1, 1), 1 / 9));
check('proportional reasoning: 2m, 2m, 3r → 4/9; 4m, m, r/2 → 16', near(M.ratio(2, 2, 3), 4 / 9) && near(M.ratio(4, 1, 0.5), 16));
check('spheres stay apart', M.SPHERES.rMin > M.radiusOf(M.SPHERES.m1) + M.radiusOf(M.SPHERES.m2));
check('separation swings rMin → rMax', near(M.sep(0), M.SPHERES.rMin) && near(M.sep(M.SPHERES.period / 2), M.SPHERES.rMax));

// orbits
const { r1, r2 } = M.SAT;
check('orbit: GMm/r² = m v²/r', [r1, r2].every(r => near(M.GM / r ** 2, M.orbitV(r) ** 2 / r)));
check('orbit: v = 2πr/T', [r1, r2].every(r => near(M.orbitV(r), 2 * Math.PI * r / M.orbitT(r))));
check('Kepler 3: T²/r³ = 4π²/GM for both', near(M.orbitT(r1) ** 2 / r1 ** 3, M.orbitT(r2) ** 2 / r2 ** 3) && near(M.orbitT(r1) ** 2 / r1 ** 3, 4 * Math.PI ** 2 / M.GM), `T ${(M.orbitT(r1) / 3600).toFixed(2)} h, ${(M.orbitT(r2) / 3600).toFixed(2)} h`);
check('twice the radius: v / √2, T × 2√2', near(M.orbitV(r2) / M.orbitV(r1), 1 / Math.SQRT2) && near(M.orbitT(r2) / M.orbitT(r1), 2 * Math.SQRT2));

// ellipse: RK4 against Kepler and the conservation laws
const E1 = M.ELL, tr = E1.track, mid = Math.floor(tr.S.length / 2);
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
check('ellipse: energy ½v² − GM/r constant along the RK4 path', tr.S.every(s => rel(M.energyPerKg(s), M.energyPerKg(tr.S[0])) < 1e-9), `E ${(E1.E / 1e9).toFixed(2)} GJ`);
check('ellipse: angular momentum r × v constant (Kepler 2)', tr.S.every(s => rel(M.angMomPerKg(s), M.angMomPerKg(tr.S[0])) < 1e-9));
check('ellipse: E = −GMm/2a', near(M.energyPerKg(tr.S[0]) * M.SAT_M, E1.E, 1e-12));
check('ellipse: halfway round is apogee, 6 R_E at v_a', near(-tr.S[mid][0], E1.ra, 1e-6) && near(Math.abs(tr.S[mid][3]), E1.va, 1e-6), `${(E1.va / 1000).toFixed(2)} km/s`);
check('ellipse: r_p v_p = r_a v_a', near(E1.rp * E1.vp, E1.ra * E1.va), `v_p/v_a = ${(E1.vp / E1.va).toFixed(2)}`);
check('ellipse: closes after T = 2π√(a³/GM) (Kepler 3 with a)', Math.hypot(tr.S.at(-1)[0] - E1.rp, tr.S.at(-1)[1]) / E1.rp < 1e-7, `${(E1.T / 3600).toFixed(2)} h`);
check('Kepler 3: same a, same period as the 4 R_E circle', near(E1.T, M.orbitT(M.SAT.r2)));
check('ellipse: RK4 speed matches the vis-viva ellipse', [0.07, 0.31, 0.55, 0.83].every(u => { const q = tr.at(u * E1.T); return rel(q.v, M.ellV(q.th)) < 1e-6 && rel(q.r, M.ellR(q.th)) < 1e-6; }));
const Ap = M.swept(-M.SWEEP / 2, M.SWEEP / 2), Aa = M.swept(E1.T / 2 - M.SWEEP / 2, E1.T / 2 + M.SWEEP / 2), Ax = M.swept(0.3 * E1.T, 0.3 * E1.T + M.SWEEP);
check('Kepler 2: equal areas in equal times (perigee, apogee, between)', rel(Ap, Aa) < 1e-5 && rel(Ax, Aa) < 1e-5 && rel(Ap, M.angMomPerKg(tr.S[0]) * M.SWEEP / 2) < 1e-5, `${(Ap / 1e12).toFixed(1)} × 10¹² m² per hour`);

// potential energy
const m = M.SAT_M, R = M.EARTH.R;
const workFromInfinity = r => {     // W by gravity bringing m in from ∞ to r: ∫ GMm/r'² dr', Simpson on a log grid out to 10⁸ r
  const n = 4000, L = Math.log(1e8); let s = 0;
  for (let i = 0; i <= n; i++) { const u = L * i / n, x = r * Math.exp(u), w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w * M.GM * m / (x * x) * x; }
  return s * L / n / 3;
};
check('U = −W from ∞ = −GMm/r (numeric integral)', [R, 2 * R, 6 * R].every(r => rel(-workFromInfinity(r), M.Ugrav(r)) < 1e-7), `U(R_E) ${(M.Ugrav(R) / 1e9).toFixed(1)} GJ`);
check('F = −dU/dr = −GMm/r² (numeric derivative)', [R, 3 * R].every(r => rel((M.Ugrav(r + 1) - M.Ugrav(r - 1)) / 2, M.GM * m / r ** 2) < 1e-7));
check('near the surface ΔU → mgh', rel(M.Ugrav(R + 10) - M.Ugrav(R), m * M.EARTH.g * 10) < 1e-5 && rel(M.Ugrav(R + 1e5) - M.Ugrav(R), m * M.EARTH.g * 1e5 / (1 + 1e5 / R)) < 1e-12, '100 km: mgh 1.6% high');
check('U is negative everywhere and rises to 0 at ∞', M.Ugrav(R) < M.Ugrav(7 * R) && M.Ugrav(7 * R) < 0 && Math.abs(M.Ugrav(1e15)) < 1e-6 * Math.abs(M.Ugrav(R)));
check('well: the carried mass sweeps 1.1 R_E → 5 R_E', near(M.wellR(0), 1.1 * R) && near(M.wellR(M.WELL.period / 2), 5 * R));

// circular-orbit energy
check('circular orbit: K = −U/2, E = U/2 = −GMm/2r', [r1, r2].every(r => near(0.5 * m * M.orbitV(r) ** 2, M.circK(r)) && near(M.circK(r), -M.Ugrav(r) / 2) && near(M.circK(r) + M.Ugrav(r), M.circE(r))));
check('raising 2 → 4 R_E costs energy, yet v drops', M.circE(r2) > M.circE(r1) && M.orbitV(r2) < M.orbitV(r1), `ΔE +${((M.circE(r2) - M.circE(r1)) / 1e9).toFixed(1)} GJ`);
check('the circular launch track stays at r0 (RK4)', M.LAUNCH.list[0].track.S.every(s => rel(Math.hypot(s[0], s[1]), M.LAUNCH.r0) < 1e-8));

// escape
const [, Lb, Lp, Lh] = M.LAUNCH.list;
check('escape speed √(2GM/R): 11.2 km/s from the surface', near(M.vEsc(R), 11.2e3, 2e-3) && near(M.vEsc(R) ** 2 / 2, M.GM / R), `${(M.vEsc(R) / 1000).toFixed(2)} km/s; ${(M.LAUNCH.vesc / 1000).toFixed(2)} at 2 R_E`);
check('below escape: E < 0, RK4 turns at the closed-form apogee and comes back', Lb.E < 0 && rel(Math.max(...Lb.track.S.map(s => Math.hypot(s[0], s[1]))), M.apogeeOf(M.LAUNCH.r0, Lb.v0)) < 1e-6 && Math.hypot(Lb.track.S.at(-1)[0] - M.LAUNCH.r0, Lb.track.S.at(-1)[1]) / M.LAUNCH.r0 < 1e-7, `apogee ${(M.apogeeOf(M.LAUNCH.r0, Lb.v0) / R).toFixed(2)} R_E`);
check('at escape: E = 0, v² r = 2GM all the way out', near(Lp.E, 0, 1e-6) && Lp.track.S.every(s => rel(s[2] ** 2 + s[3] ** 2, 2 * M.GM / Math.hypot(s[0], s[1])) < 1e-8));
check('above escape: E > 0, v² − 2GM/r = v₀² − v_esc² stays', Lh.E > 0 && Lh.track.S.every(s => rel(s[2] ** 2 + s[3] ** 2 - 2 * M.GM / Math.hypot(s[0], s[1]), Lh.v0 ** 2 - M.LAUNCH.vesc ** 2) < 1e-8), `v∞ ${(Math.sqrt(Lh.v0 ** 2 - M.LAUNCH.vesc ** 2) / 1000).toFixed(2)} km/s`);
check('escaping paths keep moving outward and leave', [Lp, Lh].every(o => o.track.S.every((s, i, S) => i === 0 || Math.hypot(s[0], s[1]) >= Math.hypot(S[i - 1][0], S[i - 1][1]))) && Math.hypot(...Lp.track.S.at(-1).slice(0, 2)) >= M.LAUNCH.rStop);

// ---------- practice (practice.js) ----------
{
const { PRACTICE } = await import('./practice.js');
const NPAGES = 13;   // pages.js imports world.js (three.js, browser-only), so the page count is hardcoded
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
// the first number in a choice's text (HTML stripped, − read as minus, a × 10ⁿ read as aEn)
const pnum = c => { const s = c.replace(/\s*×\s*10<sup>([−-]?\d+)<\/sup>/g, 'e$1').replace(/<[^>]+>/g, ' ').replace(/−/g, '-'); return Number(s.match(/-?\d+(\.\d+)?(e-?\d+)?/)[0]); };
// keyed choice equals the independent value (to its printed precision), every distractor is > 2 % away
const keyed = (p, n, want, name) => {
  const it = PRACTICE[p][n], v = it.choices.map(pnum), k = v[it.answer], scale = Math.abs(want) || 1;
  const ok = Math.abs(k - want) <= 0.005 * scale && v.every((d, i) => i === it.answer || Math.abs(d - want) > 0.02 * scale);
  check(`practice ${p}.${n + 1}: ${name}`, ok, `keyed ${k}, recomputed ${+want.toPrecision(5)}`);
};
const bisect = (fn, a, b) => { for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (fn(a) * fn(m) <= 0) b = m; else a = m; } return (a + b) / 2; };
const pint = (fn, a, b, n = 100000) => { let s = 0; const d = (b - a) / n; for (let i = 0; i < n; i++) s += fn(a + (i + 0.5) * d) * d; return s; };
const pder = (fn, t, e = 1e-6) => (fn(t + e) - fn(t - e)) / (2 * e);
const g = M.G, d2r = d => d * Math.PI / 180, RE_ = M.EARTH.R, GM_ = M.GM, mS = M.SAT_M;
{ // 0.2 average acceleration |Δv|/Δt over a tiny arc of the uniform motion at 4.0 m/s
  const dt = 1e-6, a0 = M.uniform(M.BALL.r, M.V2, 0), a1 = M.uniform(M.BALL.r, M.V2, dt);
  keyed(0, 1, Math.hypot(a1.vx - a0.vx, a1.vz - a0.vz) / dt, '|Δv|/Δt over a tiny arc at 4.0 m/s'); }
keyed(1, 0, M.tension(M.V1, M.BALL.r / 2), 'model tension(v, r/2)');
keyed(2, 0, bisect(v => M.CAR.m * v * v / M.CAR.r - 0.40 * M.CAR.m * g, 0, 50), 'speed where friction needed = μs mg, by bisection');
{ const th = d2r(60), r = M.CONE.L * Math.sin(th), T = M.CONE.m * g / Math.cos(th), v = Math.sqrt(T * Math.sin(th) * r / M.CONE.m);
  keyed(3, 0, v, 'v from the tension’s horizontal part, T sin θ = mv²/r');
  keyed(3, 1, Math.hypot(M.CONE.m * g, M.CONE.m * v * v / r), 'T = |(mg, mv²/r)| as a vector'); }
{ const L = M.LOOP, Ntop = v => L.m * v * v / L.r - L.W;   // net inward force minus gravity's share
  keyed(4, 0, (M.loopN(Math.PI) - L.m * (L.vTop ** 2 - 81) / L.r) / 1000, 'model’s N at the top, rescaled from 10 m/s to 9 m/s');
  keyed(4, 1, bisect(Ntop, 0.1, 50), 'speed where N_top = 0, by bisection'); }
{ const th = M.BANK.th, N = M.BANK.m * g / Math.cos(th);
  keyed(5, 0, bisect(v => N * Math.sin(th) - M.BANK.m * v * v / 40, 0.1, 100), 'speed where N sin θ = mv²/r on a 40 m curve'); }
keyed(6, 0, 2 * Math.PI * 0.15 * (100 / 3) / 60, 'circumference × revolutions per second');
{ const s = M.SPHERES; keyed(7, 0, M.gravF(3 * s.m1, s.m2, 2 * s.rMin) / M.gravF(s.m1, s.m2, s.rMin), 'ratio of two model gravF evaluations'); }
keyed(7, 1, M.GRAV_G * M.EARTH.M / (2 * RE_) ** 2, 'GM/(2R)² from G and M_E');
keyed(8, 0, M.orbitT(M.SAT.r2) / M.orbitT(M.SAT.r1), 'ratio of model periods at 4 and 2 R_E');
keyed(8, 1, 2 * Math.PI * 3 * RE_ / M.orbitT(3 * RE_) / 1000, 'circumference / model period at 3 R_E');
{ // 9.1 integrate the orbit (RK4) from perigee for a full period; slowest speed on it
  const a = 3 * RE_, vp = M.visViva(2 * RE_, a), tr = M.track(2 * RE_, vp, { tEnd: 2 * Math.PI * Math.sqrt(a ** 3 / GM_), dt: 2 });
  const vmin = Math.min(...tr.S.map(s => Math.hypot(s[2], s[3]))), rmax = Math.max(...tr.S.map(s => Math.hypot(s[0], s[1])));
  check('practice 9.1: integrated orbit reaches 4 R_E', Math.abs(rmax / (4 * RE_) - 1) < 1e-4, `${(rmax / RE_).toFixed(4)} R_E`);
  keyed(9, 0, vmin / 1000, 'slowest speed on the RK4-integrated orbit'); }
{ const tr = M.ELL.track, i = tr.S.reduce((b, s, k) => Math.hypot(s[0], s[1]) > Math.hypot(tr.S[b][0], tr.S[b][1]) ? k : b, 0), s = tr.S[i];
  keyed(10, 0, 0.5 * mS * (s[2] ** 2 + s[3] ** 2) / 1e9, 'K at the farthest point of the integrated orbit'); }
{ const F = r => -GM_ * mS / (r * r); let W = 0; const n = 200000, a = 4 * RE_, b = 2 * RE_, d = (b - a) / n;
  for (let k = 0; k < n; k++) W += F(a + (k + 0.5) * d) * d;
  keyed(11, 0, W / 1e9, 'Σ F_r dr from 4 R_E in to 2 R_E');
  const h = 100e3, du = pint(r => GM_ * mS / (r * r), RE_, RE_ + h);
  check('practice 11.2: ΔU = ∫GMm/r² dr to 100 km; mgh/ΔU = 1 + h/R', near(du, GM_ * mS * (1 / RE_ - 1 / (RE_ + h)), 1e-9) && near(mS * M.EARTH.g * h / du, 1 + h / RE_, 1e-9), `${(du / 1e9).toFixed(4)} GJ, ${(100 * h / RE_).toFixed(2)}%`); }
{ // 12.1 ½v² = ∫_r^∞ GM/r'² dr' (substitute u = 1/r' so the range is finite)
  const work = pint(u => GM_, 0, 1 / (4 * RE_));
  keyed(12, 0, Math.sqrt(2 * work) / 1000, '½v² = ∫ GM/r² dr out to ∞ (u = 1/r)');
  const r = 2 * RE_, vc = 2 * Math.PI * r / M.orbitT(r), E = 0.5 * mS * vc * vc + M.Ugrav(r);
  check('practice 12.2: circular K = −U/2; escape needs −E; boost = v_esc − v_c', near(0.5 * mS * vc * vc, -M.Ugrav(r) / 2, 1e-9) && near(0.5 * mS * M.vEsc(r) ** 2, -M.Ugrav(r), 1e-9) && near(-E, -M.circE(r), 1e-9),
    `add ${(-E / 1e9).toFixed(2)} GJ, boost ${((M.vEsc(r) - vc) / 1000).toFixed(2)} km/s`); }
}

for (const r of rows) console.log(r.filter(Boolean).join('  '));
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
