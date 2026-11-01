// AP-style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here from model.js; checks.mjs recomputes each answer another way.
import * as M from './model.js';

const p3 = x => (x < 0 ? '−' : '') + (Math.abs(x) >= 1000 ? Math.abs(x).toFixed(0) : Math.abs(x).toPrecision(3));   // 3 significant figures
const f = (x, n = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);
const G = M.G, sin = d => Math.sin(d * Math.PI / 180), cos = d => Math.cos(d * Math.PI / 180), tan = d => Math.tan(d * Math.PI / 180);
const W = M.WHEEL, DS = M.DISC, DR = M.DOOR, PL = M.PLANK, LD = M.LADDER, SH = M.SHAPES, RD = M.ROD, WR = M.WRENCH, B = M.BOWL, WL = M.WELL, IM = M.IMP, SK = M.SKATE, HT = M.HIT;

// 0 · turns while speeding up
const Q0 = { th: 0.5 * W.alpha * W.tUp ** 2 };
Q0.rev = Q0.th / (2 * Math.PI);
// 1 · the edge rider at 1.6 s
const Q1 = { t: 1.6 };
Q1.p = M.pointAt(DS.r2, M.disc(Q1.t));
// 2 · the handle push at 30°, and α from the square push
const Q2 = { phi: 30 };
Q2.tau = M.torque(DR.cases[0].r, DR.F, Q2.phi);
Q2.alpha = DR.cases[0].tau / DR.I;
// 3 · crate 1.0 m from A
const Q3 = { x: 1.0 };
Q3.q = M.plank(Q3.x);
// 4 · ladder at 60°
const Q4 = { th: 60 };
Q4.f = M.ladder(Q4.th * Math.PI / 180).f;
// 5 · the disc after 2.0 s
const Q5 = { t: 2.0, disc: SH.list[1] };
Q5.w = Q5.disc.alpha * Q5.t;
// 6 · a rod whose density grows from one end, λ = Cx: I = ½ML²; an annulus R/2 → R: ⅝MR²
const Q6 = { I: 0.5 * RD.M * RD.L ** 2, Iann: 5 / 8 * SH.M * SH.R ** 2 };
// 7 · rod axis 0.30 m from one end; the end-pinned rod released from horizontal
const Q7 = { e: 0.30 };
Q7.d = RD.L / 2 - Q7.e;
Q7.I = RD.Icm + RD.M * Q7.d ** 2;
Q7.wBot = Math.sqrt(3 * G / RD.L);
// 8 · one 120° stroke
const Q8 = { W: WR.tau * WR.stroke };
// 9 · the disc at the bottom; h from the ramp
const Q9 = { h: M.RACE.h };
Q9.v = Math.sqrt(2 * G * Q9.h / 1.5);
// 10 · the bowling ball
const Q10 = { vf: 5 * B.v0 / 7, xStar: 12 * B.v0 ** 2 / (49 * B.muK * G) };
// 11 · bucket after the full 2.0 m
const Q11 = { v: Math.sqrt(2 * WL.a * WL.h) };
// 12 · a 100 N rim push for 0.90 s; a triangular torque pulse
const Q12 = { F: 100, dt: 0.9, peak: 200, T: 1.2 };
Q12.w = Q12.F * IM.R * Q12.dt / IM.I;
Q12.J = 0.5 * Q12.peak * Q12.T;
// 13 · the skater
const Q13 = { I0: M.inertia(SK.rOut), I1: M.inertia(SK.rIn) };
Q13.w = Q13.I0 * SK.w0 / Q13.I1;
Q13.wNoBody = (2 * SK.m * SK.rOut ** 2) * SK.w0 / (2 * SK.m * SK.rIn ** 2);
// 14 · the ball sticks to the rod; a ball dropped beside O
const Q14 = { w: HT.m * HT.v0 * HT.d / (HT.I + HT.m * HT.d ** 2), dLdt: HT.m * G * HT.d };

const eq = s => `<div class="eq">${s}</div>`;

export const PRACTICE = {
  0: [
    { q: `The wheel starts from rest and speeds up at ${f(W.alpha, 1)} rad/s² for ${f(W.tUp, 1)} s. How many revolutions does it make in that time?`,
      choices: [`${p3(Q0.th / Math.PI)} rev`, `${p3(Q0.th)} rev`, `${p3(Q0.rev)} rev`, `${p3(Q0.th * 2 * Math.PI)} rev`], answer: 2,
      why: `<p>Constant α from rest: Δθ = ½αt², in radians. Then divide by 2π rad per revolution.</p>${eq(`Δθ = ½ × ${f(W.alpha, 1)} × ${f(W.tUp, 1)}² = ${f(Q0.th)} rad = ${f(Q0.th)} / 2π = ${p3(Q0.rev)} rev`)}<p>${p3(Q0.th)} rev forgets that ½αt² comes out in radians; ${p3(Q0.th / Math.PI)} rev drops the ½.</p>` },
    { q: 'Counter-clockwise is positive. The wheel turns counter-clockwise while it brakes. The signs of ω and α are',
      choices: ['ω > 0, α > 0', 'ω < 0, α < 0', 'ω < 0, α > 0', 'ω > 0, α < 0'], answer: 3,
      why: '<p>It turns counter-clockwise, so ω > 0. It is slowing down, so α points against ω: α < 0. The sign of ω gives the direction of turning; α only tells you which way ω is changing.</p>' },
  ],
  1: [
    { q: `The merry-go-round turns at a steady ω. The rider at ${DS.r2} m has how many times the centripetal acceleration of the rider at ${DS.r1} m?`,
      choices: ['1 (same ω, same acceleration)', '4', '2', '½'], answer: 2,
      why: '<p>Both share ω, and <i>a</i><sub>c</sub> = <i>v</i>²/<i>r</i> = <i>r</i>ω². At fixed ω it is proportional to <i>r</i>: twice the radius, twice the acceleration.</p><p>4 comes from <i>v</i>²/<i>r</i> with <i>v</i> doubled but <i>r</i> forgotten in the denominator.</p>' },
    { q: `The ride speeds up from rest at α = ${f(DS.alpha, 1)} rad/s². What is the size of the total acceleration of the rider at ${DS.r2} m when <i>t</i> = ${f(Q1.t, 1)} s?`,
      choices: [`${p3(Q1.p.at)} m/s²`, `${p3(Q1.p.ac)} m/s²`, `${p3(Q1.p.a)} m/s²`, `${p3(Q1.p.at + Q1.p.ac)} m/s²`], answer: 2,
      why: `<p>ω = αt = ${f(DS.alpha * Q1.t)} rad/s. Two perpendicular parts:</p>${eq(`<i>a</i><sub>t</sub> = rα = ${f(Q1.p.at)} m/s², <i>a</i><sub>c</sub> = rω² = ${f(Q1.p.ac)} m/s²`)}${eq(`<i>a</i> = √(${f(Q1.p.at)}² + ${f(Q1.p.ac)}²) = ${p3(Q1.p.a)} m/s²`)}<p>They are at right angles, so they add as vectors, not as numbers (${p3(Q1.p.at + Q1.p.ac)}).</p>` },
  ],
  2: [
    { q: `The ${f(DR.F, 0)} N push acts at the handle, ${f(DR.cases[0].r, 2)} m from the hinge, at ${Q2.phi}° to the door. What torque does it make about the hinge?`,
      choices: [`${p3(DR.F * DR.cases[0].r)} N·m`, `${p3(Q2.tau)} N·m`, `${p3(DR.F * DR.cases[0].r * cos(Q2.phi))} N·m`, '0 N·m'], answer: 1,
      why: `<p>φ is the angle between <b>r</b> (along the door) and <b>F</b>, here ${Q2.phi}°.</p>${eq(`τ = rF sin φ = ${f(DR.cases[0].r)} × ${f(DR.F, 0)} × sin ${Q2.phi}° = ${p3(Q2.tau)} N·m`)}<p>${p3(DR.F * DR.cases[0].r * cos(Q2.phi))} N·m uses cos: that is the part of F along the door, which pushes into the hinge.</p>` },
    { q: `The door (${DR.M} kg, ${f(DR.W, 1)} m wide, I = ⅓MW²) is pushed square on at the handle with τ = ${f(DR.cases[0].tau, 1)} N·m. Its angular acceleration is`,
      choices: [`${p3(DR.cases[0].tau / (DR.M * DR.W ** 2))} rad/s²`, `${p3(DR.cases[0].tau / (DR.M * DR.W ** 2 / 2))} rad/s²`, `${p3(DR.cases[0].tau / (DR.M * DR.W ** 2 / 12))} rad/s²`, `${p3(Q2.alpha)} rad/s²`], answer: 3,
      why: `${eq(`I = ⅓MW² = ⅓ × ${DR.M} × ${f(DR.W, 1)}² = ${f(DR.I)} kg·m²`)}${eq(`α = τ/I = ${f(DR.cases[0].tau, 1)} / ${f(DR.I)} = ${p3(Q2.alpha)} rad/s²`)}<p>A door turns about its edge, not its middle, so <sup>1</sup>⁄<sub>12</sub>MW² (about the centre) gives far too big an α.</p>` },
  ],
  3: [
    { q: `The ${PL.m} kg crate sits ${f(Q3.x, 1)} m from support A on the ${f(PL.L, 1)} m, ${PL.M} kg plank. What force does support B exert?`,
      choices: [`${p3(Q3.q.FA)} N`, `${p3((PL.Wp + PL.Wc) / 2)} N`, `${p3(Q3.x * PL.Wc / PL.L)} N`, `${p3(Q3.q.FB)} N`], answer: 3,
      why: `<p>Torques about A, where <i>F</i><sub>A</sub> has no lever arm:</p>${eq(`${f(PL.L, 1)}·<i>F</i><sub>B</sub> = ${f(PL.L / 2, 1)} × ${f(PL.Wp, 0)} + ${f(Q3.x, 1)} × ${f(PL.Wc, 0)} → <i>F</i><sub>B</sub> = ${p3(Q3.q.FB)} N`)}<p>The crate is nearer A, so A holds more (${p3(Q3.q.FA)} N) and B less. ${p3(Q3.x * PL.Wc / PL.L)} N forgets the plank’s own weight.</p>` },
    { q: 'The crate slides slowly from A toward B. What happens to the support forces?',
      choices: ['<i>F</i><sub>A</sub> falls, <i>F</i><sub>B</sub> rises, their sum stays the same', '<i>F</i><sub>A</sub> rises, <i>F</i><sub>B</sub> falls', 'both stay the same: the total weight does not change', '<i>F</i><sub>A</sub> falls, <i>F</i><sub>B</sub> rises, their sum rises'], answer: 0,
      why: '<p>Σ<i>F</i> = 0 fixes the sum at (M + m)g. Στ about A = 0 gives <i>F</i><sub>B</sub> = [(L/2)Mg + x·mg]/L, which grows with x. So <i>F</i><sub>B</sub> rises and <i>F</i><sub>A</sub> falls by the same amount.</p>' },
  ],
  4: [
    { q: `The ${LD.m} kg ladder leans at ${Q4.th}° to the floor against the smooth wall. How much friction must the floor supply?`,
      choices: [`${p3(LD.W / tan(Q4.th))} N`, `${p3(Q4.f)} N`, `${p3(LD.muS * LD.W)} N`, `${p3(LD.W * tan(Q4.th) / 2)} N`], answer: 1,
      why: `<p>Torques about the foot: (L sin θ)<i>F</i><sub>w</sub> = (½L cos θ)mg, so <i>F</i><sub>w</sub> = mg / (2 tan θ). ΣF<sub>x</sub> = 0 makes friction equal <i>F</i><sub>w</sub>:</p>${eq(`<i>f</i> = ${f(LD.W, 0)} / (2 tan ${Q4.th}°) = ${p3(Q4.f)} N`)}<p>${p3(LD.muS * LD.W)} N is the <b>most</b> static friction can give, not what it does give.</p>` },
    { q: 'The ladder is replaced by one twice as heavy, the same length, on the same floor. The smallest angle at which it can stand is',
      choices: ['larger', 'smaller', 'the same', 'larger only if it is also longer'], answer: 2,
      why: '<p>Friction needed, mg/(2 tan θ), and friction available, μ<sub>s</sub>mg, both scale with m. Setting them equal gives tan θ<sub>min</sub> = 1/(2μ<sub>s</sub>): no m, no L.</p>' },
  ],
  5: [
    { q: 'A ring, a disc and a solid sphere have the same mass and radius and the same torque on them. Rank their angular accelerations, largest first.',
      choices: ['ring, disc, sphere', 'sphere, disc, ring', 'disc, sphere, ring', 'all equal'], answer: 1,
      why: '<p>α = τ/I with I = MR² (ring), ½MR² (disc), ⅖MR² (sphere). The sphere has its mass closest to the axis, smallest I, largest α.</p>' },
    { q: `The disc (${f(SH.M, 1)} kg, ${f(SH.R, 1)} m) starts from rest with a ${f(SH.F, 1)} N pull on a string round its rim. Its ω after ${f(Q5.t, 1)} s is`,
      choices: [`${p3(SH.F / Q5.disc.I * Q5.t)} rad/s`, `${p3(SH.tau / (SH.M * SH.R ** 2) * Q5.t)} rad/s`, `${p3(SH.tau / (0.4 * SH.M * SH.R ** 2) * Q5.t)} rad/s`, `${p3(Q5.w)} rad/s`], answer: 3,
      why: `${eq(`τ = FR = ${f(SH.tau)} N·m, I = ½MR² = ${f(Q5.disc.I)} kg·m²`)}${eq(`α = τ/I = ${f(Q5.disc.alpha)} rad/s², ω = αt = ${p3(Q5.w)} rad/s`)}<p>${p3(SH.F / Q5.disc.I * Q5.t)} rad/s uses the force as if it were the torque.</p>` },
  ],
  6: [
    { q: `A ${f(RD.M, 1)} kg rod, ${f(RD.L, 1)} m long, gets denser toward one end: λ = Cx, with x from the light end O. Its I about a perpendicular axis through O is`,
      choices: [`${p3(RD.M * RD.L ** 2 / 3)} kg·m²`, `${p3(Q6.I)} kg·m²`, `${p3(RD.M * RD.L ** 2 / 4)} kg·m²`, `${p3(RD.M * RD.L ** 2)} kg·m²`], answer: 1,
      why: `<p>First fix C from the mass, then integrate r² dm with dm = Cx dx:</p>${eq(`M = ∫<sub>0</sub><sup>L</sup> Cx dx = ½CL² → C = 2M/L²`)}${eq(`I = ∫<sub>0</sub><sup>L</sup> x²·Cx dx = ¼CL⁴ = ½ML² = ${p3(Q6.I)} kg·m²`)}<p>More than the uniform rod’s ⅓ML² (${p3(RD.M * RD.L ** 2 / 3)}): the mass sits farther out. ¼ML² forgets to replace C with 2M/L².</p>` },
    { q: `A flat washer (an annulus) of mass M has inner radius R/2 and outer radius R. Using I = ∫r² dm, show that I = ⅝MR² about its centre, and evaluate it for M = ${f(SH.M, 1)} kg, R = ${f(SH.R, 1)} m.`,
      solution: `<p>Mass per area σ = M / [π(R² − R²/4)] = 4M / (3πR²). A ring at r of width dr has dm = σ·2πr dr.</p>${eq(`I = ∫<sub>R/2</sub><sup>R</sup> r²·σ2πr dr = 2πσ [r⁴/4]<sub>R/2</sub><sup>R</sup> = 2πσ · (15/64)R⁴`)}${eq(`I = 2π · 4M/(3πR²) · 15R⁴/64 = (120/192)MR² = ⅝MR²`)}${eq(`I = ⅝ × ${f(SH.M, 1)} × ${f(SH.R, 1)}² = ${p3(Q6.Iann)} kg·m²`)}<p>Between a disc (½MR²) and a ring (MR²), as it should be: the hole moved mass outward.</p>` },
  ],
  7: [
    { q: `The ${f(RD.M, 1)} kg, ${f(RD.L, 1)} m rod (I<sub>cm</sub> = ${f(RD.Icm)} kg·m²) turns about a perpendicular axis ${f(Q7.e, 2)} m from one end. Its moment of inertia is`,
      choices: [`${p3(RD.Icm + RD.M * Q7.d)} kg·m²`, `${p3(RD.M * Q7.d ** 2)} kg·m²`, `${p3(RD.Iend + RD.M * Q7.e ** 2)} kg·m²`, `${p3(Q7.I)} kg·m²`], answer: 3,
      why: `<p>The theorem works from the centre-of-mass axis, so d is measured from the centre: d = ${f(RD.L / 2, 2)} − ${f(Q7.e, 2)} = ${f(Q7.d, 2)} m.</p>${eq(`I = I<sub>cm</sub> + Md² = ${f(RD.Icm)} + ${f(RD.M, 1)} × ${f(Q7.d, 2)}² = ${p3(Q7.I)} kg·m²`)}<p>${p3(RD.Iend + RD.M * Q7.e ** 2)} adds Md² to the end value, but the end is not the centre of mass.</p>` },
    { q: `The rod is pinned at one end and released from rest horizontal. Use the parallel-axis theorem to find I, write Στ = Iα as a differential equation for its angle θ below the horizontal, and integrate it to find ω as it swings through the bottom.`,
      solution: `<p>I = <sup>1</sup>⁄<sub>12</sub>ML² + M(L/2)² = ⅓ML². Gravity acts at the centre, L/2 from the pin, with lever arm (L/2)cos θ:</p>${eq(`⅓ML² · d²θ/dt² = Mg(L/2) cos θ`)}${eq(`d²θ/dt² = (3g / 2L) cos θ`)}<p>Write d²θ/dt² = ω dω/dθ and integrate from θ = 0, ω = 0:</p>${eq(`∫<sub>0</sub><sup>ω</sup> ω dω = (3g/2L) ∫<sub>0</sub><sup>θ</sup> cos θ dθ → ω² = (3g/L) sin θ`)}${eq(`at the bottom, θ = 90°: ω = √(3g/L) = √(3 × ${f(G)} / ${f(RD.L, 1)}) = ${p3(Q7.wBot)} rad/s`)}<p>Check by energy: the centre drops L/2, so Mg(L/2) = ½(⅓ML²)ω², the same result. α is not constant, so ω² = 2αΔθ does not apply.</p>` },
  ],
  8: [
    { q: `A ${f(WR.F, 0)} N push square to a ${f(WR.r, 2)} m wrench turns the nut through one 120° stroke. The work done is`,
      choices: [`${p3(WR.tau)} J`, `${p3(WR.F * WR.stroke)} J`, `${p3(Q8.W)} J`, `${p3(WR.tau * 120)} J`], answer: 2,
      why: `${eq(`W = τΔθ = (${f(WR.r, 2)} × ${f(WR.F, 0)}) × 2π/3 = ${f(WR.tau, 0)} × ${f(WR.stroke, 3)} = ${p3(Q8.W)} J`)}<p>Δθ must be in radians. ${p3(WR.tau * 120)} J multiplies by 120 degrees.</p>` },
    { q: 'The same nut needs the same torque. With a wrench twice as long, the push needed and the work per 120° stroke are',
      choices: ['half the push, half the work', 'half the push, the same work', 'the same push, twice the work', 'half the push, twice the work'], answer: 1,
      why: '<p>τ = rF: double r, halve F. W = τΔθ: same τ, same angle, same work. The hand travels twice as far with half the force.</p>' },
  ],
  9: [
    { q: `The disc (I = ½mR²) rolls from rest without slipping down the ${f(M.RACE.len, 1)} m ramp at ${(M.RACE.theta * 180 / Math.PI).toFixed(0)}°. Its speed at the bottom is`,
      choices: [`${p3(Math.sqrt(2 * G * Q9.h))} m/s`, `${p3(Math.sqrt(2 * G * Q9.h / 1.4))} m/s`, `${p3(Math.sqrt(G * Q9.h))} m/s`, `${p3(Q9.v)} m/s`], answer: 3,
      why: `<p>h = ${f(M.RACE.len, 1)} sin ${(M.RACE.theta * 180 / Math.PI).toFixed(0)}° = ${f(Q9.h, 3)} m. With ω = v/R:</p>${eq(`mgh = ½mv² + ½(½mR²)(v/R)² = ¾mv² → v = √(4gh/3) = ${p3(Q9.v)} m/s`)}<p>${p3(Math.sqrt(2 * G * Q9.h))} m/s is the sliding box, which spends nothing on spin.</p>` },
    { q: 'A solid sphere (⅖MR²), a hollow sphere (⅔MR²) and a ring (MR²) roll from rest down the same ramp. In which order do they arrive?',
      choices: ['ring, hollow sphere, solid sphere', 'all together', 'solid sphere, hollow sphere, ring', 'hollow sphere, solid sphere, ring'], answer: 2,
      why: '<p>a = g sin θ / (1 + f) with I = fMR². Smallest f, least energy spent on spin, fastest: solid (0.4), then hollow (0.67), then ring (1). Mass and radius cancel.</p>' },
  ],
  10: [
    { q: `The bowling ball leaves the hand at ${f(B.v0, 1)} m/s without spin and skids until it rolls. How fast is it moving when it starts to roll?`,
      choices: [`${p3(B.v0)} m/s`, `${p3(Q10.vf)} m/s`, `${p3(B.v0 / Math.sqrt(1.4))} m/s`, `${p3(2 * B.v0 / 7)} m/s`], answer: 1,
      why: `<p>About the contact line friction has no torque, so mvR + Iω stays at mv<sub>0</sub>R. Rolling, ω = v/R:</p>${eq(`mv<sub>0</sub>R = mvR + ⅖mR²(v/R) → v = <sup>5</sup>⁄<sub>7</sub>v<sub>0</sub> = ${p3(Q10.vf)} m/s`)}<p>${p3(B.v0 / Math.sqrt(1.4))} m/s assumes kinetic energy is conserved, but kinetic friction turns some of it into heat while the ball skids.</p>` },
    { q: `Write v(t) and ω(t) while it skids (μ<sub>k</sub> = ${f(B.muK, 1)}), find the time t* at which v = Rω, and integrate v(t) to find how far the ball skids.`,
      solution: `<p>Friction μ<sub>k</sub>mg acts backward at the bottom:</p>${eq(`m dv/dt = −μ<sub>k</sub>mg → v = v<sub>0</sub> − μ<sub>k</sub>g t`)}${eq(`⅖mR² dω/dt = μ<sub>k</sub>mgR → ω = (5μ<sub>k</sub>g / 2R) t`)}${eq(`v<sub>0</sub> − μ<sub>k</sub>g t* = <sup>5</sup>⁄<sub>2</sub>μ<sub>k</sub>g t* → t* = 2v<sub>0</sub> / 7μ<sub>k</sub>g = ${f(B.tStar, 3)} s`)}${eq(`x* = ∫<sub>0</sub><sup>t*</sup> (v<sub>0</sub> − μ<sub>k</sub>g t) dt = v<sub>0</sub>t* − ½μ<sub>k</sub>g t*²`)}${eq(`x* = 12v<sub>0</sub>² / 49μ<sub>k</sub>g = ${p3(Q10.xStar)} m`)}<p>Neither depends on R or m.</p>` },
  ],
  11: [
    { q: `The ${f(WL.m, 1)} kg bucket falls from rest, unwinding the ${f(WL.M, 1)} kg drum (solid cylinder). Its speed after falling ${f(WL.h, 1)} m is`,
      choices: [`${p3(Math.sqrt(2 * G * WL.h))} m/s`, `${p3(Math.sqrt(2 * WL.m * G / (WL.m + WL.M) * WL.h))} m/s`, `${p3(Q11.v)} m/s`, `${p3(Math.sqrt(WL.a * WL.h))} m/s`], answer: 2,
      why: `${eq(`a = mg / (m + ½M) = ${f(WL.m * G, 1)} / ${f(WL.m + WL.M / 2, 1)} = ${f(WL.a)} m/s²`)}${eq(`v = √(2ah) = √(2 × ${f(WL.a)} × ${f(WL.h, 1)}) = ${p3(Q11.v)} m/s`)}<p>${p3(Math.sqrt(2 * G * WL.h))} m/s is free fall, ignoring the energy the drum takes; ${p3(Math.sqrt(2 * WL.m * G / (WL.m + WL.M) * WL.h))} m/s treats the drum like a hoop (I = MR²).</p>` },
    { q: 'While the bucket falls, the rope tension is',
      choices: ['equal to the bucket’s weight', 'greater than the bucket’s weight', 'less than the bucket’s weight but more than zero', 'zero, since the bucket is falling'], answer: 2,
      why: `<p>The bucket accelerates downward, so mg − T = ma > 0: T < mg. But the rope must pull on the drum to spin it up (rT = Iα), so T > 0. Here T = ${f(WL.T)} N against mg = ${f(WL.m * G, 1)} N.</p>` },
  ],
  12: [
    { q: `The merry-go-round (I = ${f(IM.I, 0)} kg·m², R = ${f(IM.R, 1)} m) starts at rest. A ${Q12.F} N push tangent to the rim lasts ${f(Q12.dt, 2)} s. Its final ω is`,
      choices: [`${p3(Q12.F * Q12.dt / IM.I)} rad/s`, `${p3(Q12.w)} rad/s`, `${p3(Q12.F * IM.R * Q12.dt / (IM.M * IM.R ** 2))} rad/s`, `${p3(Q12.F * IM.R / IM.I)} rad/s`], answer: 1,
      why: `${eq(`ΔL = τΔt = (${Q12.F} × ${f(IM.R, 1)}) × ${f(Q12.dt, 2)} = ${f(Q12.F * IM.R * Q12.dt, 0)} kg·m²/s`)}${eq(`ω = ΔL / I = ${f(Q12.F * IM.R * Q12.dt, 0)} / ${f(IM.I, 0)} = ${p3(Q12.w)} rad/s`)}<p>${p3(Q12.F * Q12.dt / IM.I)} rad/s uses FΔt (linear impulse) instead of τΔt; ${p3(Q12.F * IM.R / IM.I)} is τ/I, the angular acceleration, not ω.</p>` },
    { q: `A torque on a wheel rises steadily from 0 to ${Q12.peak} N·m in ${f(Q12.T / 2, 1)} s, then falls steadily back to 0 at ${f(Q12.T, 1)} s. The change in the wheel’s angular momentum is`,
      choices: [`${p3(Q12.peak)} kg·m²/s`, `${p3(Q12.peak * Q12.T)} kg·m²/s`, `${p3(Q12.peak / Q12.T)} kg·m²/s`, `${p3(Q12.J)} kg·m²/s`], answer: 3,
      why: `<p>ΔL is the area under the τ–t graph, here a triangle:</p>${eq(`ΔL = ½ × ${f(Q12.T, 1)} s × ${Q12.peak} N·m = ${p3(Q12.J)} kg·m²/s`)}<p>${p3(Q12.peak * Q12.T)} treats it as a rectangle; ${p3(Q12.peak / Q12.T)} is a slope, not an area.</p>` },
  ],
  13: [
    { q: `The skater (I<sub>body</sub> = ${f(SK.Ib, 1)} kg·m²) spins at ${f(SK.w0, 1)} rad/s with ${f(SK.m, 1)} kg weights at ${f(SK.rOut, 2)} m and pulls them in to ${f(SK.rIn, 2)} m. Her new ω is`,
      choices: [`${p3(SK.w0 * SK.rOut / SK.rIn)} rad/s`, `${p3(Q13.wNoBody)} rad/s`, `${p3(Q13.w)} rad/s`, `${p3(SK.w0)} rad/s`], answer: 2,
      why: `${eq(`I<sub>0</sub> = ${f(SK.Ib, 1)} + 2 × ${f(SK.m, 1)} × ${f(SK.rOut, 2)}² = ${f(Q13.I0)} kg·m², I<sub>f</sub> = ${f(SK.Ib, 1)} + 2 × ${f(SK.m, 1)} × ${f(SK.rIn, 2)}² = ${f(Q13.I1, 3)} kg·m²`)}${eq(`ω<sub>f</sub> = I<sub>0</sub>ω<sub>0</sub> / I<sub>f</sub> = ${p3(Q13.w)} rad/s`)}<p>${p3(Q13.wNoBody)} rad/s leaves out her body’s ${f(SK.Ib, 1)} kg·m², which does not change.</p>` },
    { q: 'As she pulls the weights in, her rotational kinetic energy',
      choices: ['stays the same, because L is conserved', 'decreases, because I decreases', 'increases, because the ice exerts a torque', 'increases, because her arms do work on the weights'], answer: 3,
      why: `<p>K = L²/2I. L is fixed and I falls, so K rises: here from ${f(M.skater(0.5).K)} J to ${f(M.skater(3.5).K)} J. The energy comes from her muscles pulling the weights inward against their tendency to fly out. The ice gives (almost) no torque, which is why L holds.</p>` },
  ],
  14: [
    { q: `The ${f(HT.m, 1)} kg ball at ${f(HT.v0, 1)} m/s hits the rod (I = ⅓ML² = ${f(HT.I, 2)} kg·m²) ${f(HT.d, 1)} m from the pin O and <b>sticks</b>. The rod’s ω just after is`,
      choices: [`${p3(HT.m * HT.v0 * HT.d / HT.I)} rad/s`, `${p3(Q14.w)} rad/s`, `${p3(HT.m * HT.v0 * HT.d / (HT.M * HT.L ** 2 / 12 + HT.m * HT.d ** 2))} rad/s`, `${p3(HT.m * HT.v0 / (HT.m + HT.M) / HT.d)} rad/s`], answer: 1,
      why: `<p>The pin pushes, so linear momentum is not conserved; but the pin has no torque about O, so L about O is:</p>${eq(`mv<sub>0</sub>d = (I + md²)ω → ω = ${f(HT.m * HT.v0 * HT.d, 2)} / (${f(HT.I, 2)} + ${f(HT.m * HT.d ** 2, 2)}) = ${p3(Q14.w)} rad/s`)}<p>${p3(HT.m * HT.v0 * HT.d / HT.I)} forgets the ball now turns with the rod; ${p3(HT.m * HT.v0 / (HT.m + HT.M) / HT.d)} conserves linear momentum, which the pin spoils.</p>` },
    { q: `A ${f(HT.m, 1)} kg ball is dropped from rest at a point ${f(HT.d, 1)} m to the side of O, in the same vertical plane. As it falls, at what rate does its angular momentum about O change?`,
      choices: [`${p3(Q14.dLdt / 2)} kg·m²/s²`, `${p3(2 * Q14.dLdt)} kg·m²/s²`, `${p3(Q14.dLdt)} kg·m²/s²`, '0: it moves in a straight line'], answer: 2,
      why: `<p>With O at the origin and the ball at (d, y), p = (0, −mgt). Then</p>${eq(`L = xp<sub>y</sub> − yp<sub>x</sub> = −d·mgt → |dL/dt| = mgd = ${f(HT.m, 1)} × ${f(G)} × ${f(HT.d, 1)} = ${p3(Q14.dLdt)} kg·m²/s²`)}<p>That is the torque of gravity about O, d·mg. A straight line keeps L constant only when no force acts: here the speed grows.</p>` },
  ],
};
