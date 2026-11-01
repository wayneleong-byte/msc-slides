// induction/practice.js — AP Physics C style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here; a quantitative item keeps its choices' numbers in `nums` (in the units shown),
// and checks.mjs recomputes the keyed one by another route.
import * as M from './model.js';

const p = (x, d) => x.toFixed(d);
const MU0 = M.MU0;

// ---- page 0: average emf of a coil in a growing field; when a polynomial flux has zero emf ----
const P0 = { N: 200, A: 0.0050, B1: 0.10, B2: 0.50, dt: 0.20 };
P0.emf = P0.N * P0.A * (P0.B2 - P0.B1) / P0.dt;
P0.nums = [P0.A * (P0.B2 - P0.B1) / P0.dt, P0.emf, P0.N * P0.A * P0.B2 / P0.dt, P0.N * P0.A * (P0.B2 - P0.B1) * P0.dt];   // forgot N · right · used B₂ not ΔB · ×Δt
const P0b = { a: 4.0, b: 6.0 };                      // Φ = a t³ − b t (mWb)
P0b.t = Math.sqrt(P0b.b / (3 * P0b.a));
P0b.nums = [Math.sqrt(P0b.b / P0b.a), P0b.b / (3 * P0b.a), Math.sqrt(3 * P0b.a / P0b.b), P0b.t];   // where Φ = 0 · forgot the root · upside down · right

// ---- page 1: charge through the loop as the N pole comes in (page's magnet and loop) ----
const L1 = (() => { const c = M.CASES[0], a = M.lenzCase(c, 0), b = M.lenzCase(c, M.LENZ.run), dPhi = b.Phi - a.Phi;
  return { dPhi, Q: dPhi / M.LENZ.R, nums: [dPhi / M.LENZ.R / 2, dPhi / (M.LENZ.R * M.LENZ.run), dPhi * M.LENZ.run / M.LENZ.R, dPhi / M.LENZ.R].map(x => x * 1e3) }; })();
// ---- page 2: the iron core, I₁ = c t² ----
const P2 = { c: 2.0, t: 0.50 };
P2.dI = 2 * P2.c * P2.t;
P2.nums = [M.CORE.M * P2.c * P2.t ** 2, M.CORE.M * P2.dI, M.CORE.L1 * P2.dI, M.CORE.M * P2.c * P2.t].map(x => x * 1e3);   // M·I · right · L₁ · lost the 2
// ---- page 3: the page's loop leaving the wire, at r = 2 cm ----
const P3 = (() => { const { I, a, b, r0: r, v } = M.WIRE, k = MU0 * I / (2 * Math.PI);
  return { emf: k * a * b * v / (r * (r + a)), nums: [k / r * b * v, k * (1 / r + 1 / (r + a)) * b * v, k * (1 / r - 1 / (r + a)) * a * v, k * (1 / r - 1 / (r + a)) * b * v].map(x => x * 1e6) }; })();
// ---- page 4: a rod turning about one end ----
const P4 = { l: 0.50, w: 20, B: 0.40 };
P4.emf = 0.5 * P4.B * P4.w * P4.l ** 2;
P4.nums = [P4.B * P4.w * P4.l ** 2, P4.emf, P4.B * P4.w * P4.l, P4.emf / 2];   // tip speed for the whole rod · right · dropped an ℓ · ¼
// ---- page 5: pulling the page's loop into the field at constant speed ----
const P5 = (() => { const { B, h, w, v, R } = M.CROSS, F = B * B * h * h * v / R;
  return { F, nums: [B * B * h * w * v / R, 2 * F, F, B * h * h * v / R].map(x => x * 1e3) }; })();   // used w · both sides · right · one B only
// ---- page 6: how far the page's bar coasts ----
const P6 = (() => { const { v0, tau } = M.RAIL; return { d: v0 * tau, nums: [v0 * tau / 2, v0 * tau * (1 - 1 / Math.E), v0 * tau] }; })();
// ---- page 7: a solenoid's inductance; the page's solenoid driven sinusoidally ----
const P7 = { N: 500, l: 0.25, r: 0.010 };
P7.L = MU0 * P7.N ** 2 * Math.PI * P7.r ** 2 / P7.l;
P7.nums = [P7.L, MU0 * P7.N ** 2 * Math.PI * (2 * P7.r) ** 2 / P7.l, MU0 * P7.N * Math.PI * P7.r ** 2 / P7.l, MU0 * P7.N ** 2 * P7.r ** 2 / P7.l].map(x => x * 1e3);   // right · diameter · N not N² · forgot π
const P7b = { I0: 2.0, w: 50 };
P7b.emf = M.SOL.L * P7b.I0 * P7b.w;
P7b.nums = [M.SOL.L * P7b.I0, M.SOL.L * P7b.I0 / P7b.w, P7b.emf, M.SOL.L * P7b.I0 * P7b.w ** 2].map(x => x * 1e3);
// ---- page 8: the page's RL circuit reaching 2.0 A ----
const P8 = { I: 2.0 };
P8.t = -M.RL.tau * Math.log(1 - P8.I / M.RL.Imax);
P8.nums = [M.RL.tau, P8.t, M.RL.tau * Math.log(M.RL.Imax / P8.I), M.RL.tau * P8.I / M.RL.Imax];   // assumed τ · right · ln upside down · linear
// ---- page 9: the page's LC circuit, first maximum of the current ----
const P9 = { t: M.LC.T / 4, I: M.LC.Imax };

export const PRACTICE = {
  0: [
    { q: `A ${P0.N}-turn coil of area ${p(P0.A * 1e4, 0)} cm² lies flat in a uniform field perpendicular to it. The field grows steadily from ${p(P0.B1, 2)} T to ${p(P0.B2, 2)} T in ${p(P0.dt, 2)} s. The magnitude of the induced emf is`,
      choices: P0.nums.map(x => `${p(x, 3)} V`), answer: 1, nums: P0.nums,
      why: `<p>Each turn has Φ = <i>BA</i>, and all ${P0.N} turns add:</p><div class="eq">|ε| = <i>NA</i> Δ<i>B</i>/Δ<i>t</i> = ${P0.N} × ${P0.A} m² × ${p(P0.B2 - P0.B1, 2)} T / ${P0.dt} s = ${p(P0.emf, 3)} V</div><p>Only the <b>change</b> in <i>B</i> counts: using ${P0.B2} T alone gives ${p(P0.nums[2], 3)} V, and leaving out <i>N</i> gives one turn’s ${p(P0.nums[0], 3)} V.</p>` },
    { q: `The flux through a loop is Φ<sub><i>B</i></sub>(<i>t</i>) = ${p(P0b.a, 1)}<i>t</i><sup>3</sup> − ${p(P0b.b, 1)}<i>t</i> (mWb, <i>t</i> in s). At what time <i>t</i> > 0 is the induced emf zero?`,
      choices: P0b.nums.map(x => `${p(x, 2)} s`), answer: 3, nums: P0b.nums,
      why: `<p>The emf is minus the <b>slope</b> of Φ, not Φ itself:</p><div class="eq">ε = −<i>d</i>Φ/<i>dt</i> = −(${p(3 * P0b.a, 0)}<i>t</i><sup>2</sup> − ${p(P0b.b, 0)}) = 0 &nbsp;→&nbsp; <i>t</i> = √(${p(P0b.b, 0)}/${p(3 * P0b.a, 0)}) = ${p(P0b.t, 2)} s</div><p>At ${p(P0b.nums[0], 2)} s the flux is zero but still changing, so the emf is not.</p>` },
  ],
  1: [
    { q: 'A bar magnet’s N pole is pulled straight away from a loop along its axis. Seen from the magnet, the induced current in the loop is',
      choices: ['counterclockwise, and the loop repels the magnet', 'clockwise, and the loop repels the magnet', 'counterclockwise, and the loop attracts the magnet', 'clockwise, and the loop attracts the magnet'], answer: 3,
      why: '<p>The N pole’s field runs through the loop away from the viewer, and it is shrinking. The induced field points the same way, away from the viewer, to make up the loss: by the right-hand rule that is a <b>clockwise</b> current as seen from the magnet. Field lines enter the loop’s near face, so that face is an S pole and pulls the N pole back: the loop opposes the motion.</p>' },
    { q: `In the page’s loop (<i>R</i> = ${p(M.LENZ.R * 1e3, 0)} mΩ) the flux grows from ${p(M.lenzCase(M.CASES[0], 0).Phi * 1e6, 2)} µWb to ${p(M.lenzCase(M.CASES[0], M.LENZ.run).Phi * 1e6, 2)} µWb as the N pole comes in over ${p(M.LENZ.run, 1)} s. The total charge that flows round the loop is`,
      choices: L1.nums.map(x => `${p(x, 2)} mC`), answer: 3, nums: L1.nums,
      why: `<p>Integrate the current; the time drops out:</p><div class="eq"><i>Q</i> = ∫<i>I dt</i> = ∫(ε/<i>R</i>) <i>dt</i> = (1/<i>R</i>)∫|<i>d</i>Φ| = ΔΦ/<i>R</i> = ${p(L1.dPhi * 1e6, 2)} µWb / ${M.LENZ.R} Ω = ${p(L1.Q * 1e3, 2)} mC</div><p>It does not matter how fast the magnet moves. ${p(L1.nums[1], 2)} is the average current in mA, not a charge.</p>` },
  ],
  2: [
    { q: 'Two coils share an iron core. If the number of turns on the <b>secondary</b> is doubled, the mutual inductance <i>M</i>',
      choices: ['doubles', 'is unchanged', 'quadruples', 'halves'], answer: 0,
      why: '<p><i>M</i> = <i>N</i><sub>2</sub>Φ<sub>2</sub>/<i>I</i><sub>1</sub>. The flux per turn, set by the primary’s current and turns, is unchanged; twice as many secondary turns hold twice the flux linkage. <i>M</i> = μ<sub>r</sub>μ<sub>0</sub><i>N</i><sub>1</sub><i>N</i><sub>2</sub><i>A</i>/ℓ is linear in each <i>N</i>; it is a self-inductance that goes as <i>N</i><sup>2</sup>.</p>' },
    { q: `On the page’s iron core (<i>M</i> = ${p(M.CORE.M * 1e3, 1)} mH, <i>L</i><sub>1</sub> = ${p(M.CORE.L1 * 1e3, 1)} mH) the primary carries <i>I</i><sub>1</sub> = ${p(P2.c, 1)}<i>t</i><sup>2</sup> (A, <i>t</i> in s). The magnitude of the secondary emf at <i>t</i> = ${p(P2.t, 2)} s is`,
      choices: P2.nums.map(x => `${p(x, 1)} mV`), answer: 1, nums: P2.nums,
      why: `<div class="eq">ε<sub>2</sub> = −<i>M dI</i><sub>1</sub>/<i>dt</i> = −<i>M</i>(${p(2 * P2.c, 1)}<i>t</i>) = −${p(M.CORE.M * 1e3, 1)} mH × ${p(P2.dI, 2)} A/s = −${p(P2.nums[1], 1)} mV</div><p>It takes the rate of change, not <i>I</i><sub>1</sub> itself (${p(P2.nums[0], 1)} mV); and the secondary sees <i>M</i>, not the primary’s own <i>L</i><sub>1</sub>.</p>` },
  ],
  3: [
    { q: 'A rectangular loop has sides <i>b</i> parallel to a long wire carrying <i>I</i>; its near side is at distance <i>r</i> and its far side at <i>r</i> + <i>a</i>. The flux through it is',
      choices: ['(μ<sub>0</sub><i>Ib</i>/2π<i>r</i>)<i>a</i>', '(μ<sub>0</sub><i>Ib</i>/2π) ln((<i>r</i> + <i>a</i>)/<i>r</i>)', '(μ<sub>0</sub><i>Ia</i>/2π) ln((<i>r</i> + <i>b</i>)/<i>r</i>)', '(μ<sub>0</sub><i>Ib</i>/2π)(1/<i>r</i> − 1/(<i>r</i> + <i>a</i>))'], answer: 1,
      why: '<p><i>B</i> = μ<sub>0</sub><i>I</i>/2π<i>s</i> varies with distance <i>s</i>, so cut the loop into strips <i>b ds</i> parallel to the wire:</p><div class="eq">Φ = ∫<sub><i>r</i></sub><sup><i>r</i>+<i>a</i></sup> (μ<sub>0</sub><i>I</i>/2π<i>s</i>) <i>b ds</i> = (μ<sub>0</sub><i>Ib</i>/2π) ln((<i>r</i> + <i>a</i>)/<i>r</i>)</div><p>Choice A treats <i>B</i> as uniform at its near-side value; choice D is the derivative’s shape, not the integral’s.</p>' },
    { q: `The page’s loop (<i>b</i> = ${p(M.WIRE.b * 100, 0)} cm along the wire, <i>a</i> = ${p(M.WIRE.a * 100, 0)} cm across) moves straight away from a ${M.WIRE.I} A wire at ${p(M.WIRE.v * 100, 0)} cm/s. When its near side is ${p(M.WIRE.r0 * 100, 0)} cm from the wire, |ε| is`,
      choices: P3.nums.map(x => `${p(x, 3)} µV`), answer: 3, nums: P3.nums,
      why: `<p>Only the two sides parallel to the wire cut field lines. Each has motional emf <i>Bbv</i>, and round the loop they oppose:</p><div class="eq">ε = (<i>B</i><sub>near</sub> − <i>B</i><sub>far</sub>)<i>bv</i> = μ<sub>0</sub><i>Iabv</i> / 2π<i>r</i>(<i>r</i> + <i>a</i>) = ${p(P3.emf * 1e6, 3)} µV</div><p>The same as −<i>d</i>Φ/<i>dt</i> of the logarithm. The near side alone gives ${p(P3.nums[0], 3)} µV; adding the two sides, ${p(P3.nums[1], 3)} µV.</p>` },
  ],
  4: [
    { q: 'A vertical metal bar moves to the right through a uniform field pointing into the page, on no circuit. After a moment,',
      choices: ['the top end is at higher potential, and no current flows', 'the bottom end is at higher potential, and current flows', 'the bottom end is at higher potential, and no current flows', 'the top end is at higher potential, and current flows down the bar'], answer: 0,
      why: '<p><i>F</i> = <i>qv</i>×<i>B</i>: right × into the page = up, so positive charge collects at the top. Its field pushes back until <i>qE</i> = <i>qvB</i>; then nothing moves along the bar. With no closed path there is an emf <i>BLv</i> but no steady current.</p>' },
    { q: `A ${p(P4.l * 100, 0)} cm metal rod turns at ${P4.w} rad/s about one end, in a plane perpendicular to a uniform ${p(P4.B, 2)} T field. The emf between its ends is`,
      choices: P4.nums.map(x => `${p(x, 2)} V`), answer: 1, nums: P4.nums,
      why: `<p>Each piece <i>dr</i> moves at <i>v</i> = ω<i>r</i>, so its emf is <i>B</i>ω<i>r dr</i>. Add them along the rod:</p><div class="eq">ε = ∫<sub>0</sub><sup>ℓ</sup> <i>B</i>ω<i>r dr</i> = ½<i>B</i>ωℓ<sup>2</sup> = ½ × ${P4.B} × ${P4.w} × ${P4.l}<sup>2</sup> = ${p(P4.emf, 2)} V</div><p>Using the tip speed ωℓ for the whole rod gives ${p(P4.nums[0], 2)} V, twice too much: the average speed is half the tip’s.</p>` },
  ],
  5: [
    { q: `The loop (height <i>h</i> = ${p(M.CROSS.h * 100, 0)} cm, width ${p(M.CROSS.w * 100, 0)} cm, <i>R</i> = ${M.CROSS.R} Ω) is pulled into the ${M.CROSS.B} T field at a steady ${M.CROSS.v} m/s. While its leading side is in and its trailing side out, the pulling force needed is`,
      choices: P5.nums.map(x => `${p(x, 1)} mN`), answer: 2, nums: P5.nums,
      why: `<div class="eq"><i>I</i> = <i>Bhv</i>/<i>R</i>, &nbsp;<i>F</i> = <i>IhB</i> = <i>B</i><sup>2</sup><i>h</i><sup>2</sup><i>v</i>/<i>R</i> = ${p(P5.F * 1e3, 1)} mN</div><p>Only the leading side carries current in the field (the top and bottom forces cancel), and only the height <i>h</i> cuts field lines. Check: <i>Fv</i> = ${p(P5.F * M.CROSS.v * 1e3, 1)} mW = ε<sup>2</sup>/<i>R</i>.</p>` },
    { q: 'A loop of mass <i>m</i>, resistance <i>R</i> and height <i>h</i> slides <b>freely</b> (no pulling force) into a uniform field <i>B</i> at speed <i>v</i><sub>0</sub>. Find its speed as a function of the distance <i>x</i> its leading side has gone into the field, while the trailing side is still outside.',
      solution: `<p>With only the leading side in the field, the current is <i>Bhv</i>/<i>R</i> and the field pushes back on it with <i>IhB</i>:</p><div class="eq"><i>m dv</i>/<i>dt</i> = −<i>B</i><sup>2</sup><i>h</i><sup>2</sup><i>v</i>/<i>R</i></div><p>Write <i>dv</i>/<i>dt</i> = <i>v dv</i>/<i>dx</i> and cancel <i>v</i>:</p><div class="eq"><i>m dv</i>/<i>dx</i> = −<i>B</i><sup>2</sup><i>h</i><sup>2</sup>/<i>R</i> &nbsp;→&nbsp; <i>v</i>(<i>x</i>) = <i>v</i><sub>0</sub> − <i>B</i><sup>2</sup><i>h</i><sup>2</sup><i>x</i>/<i>mR</i></div><p>Speed falls <b>linearly with distance</b> (exponentially with time). If <i>v</i> would reach 0 before <i>x</i> = the loop’s width, the loop stops part-way in.</p>` },
  ],
  6: [
    { q: `The page’s bar (τ = <i>mR</i>/<i>B</i><sup>2</sup><i>L</i><sup>2</sup> = ${p(M.RAIL.tau, 2)} s) is let go at ${p(M.RAIL.v0, 2)} m/s with nothing pushing it. How far does it travel before stopping?`,
      choices: [`${p(P6.nums[0], 2)} m`, `${p(P6.nums[1], 2)} m`, 'it never stops, so the distance grows without limit', `${p(P6.nums[2], 2)} m`], answer: 3, nums: [P6.nums[0], P6.nums[1], NaN, P6.nums[2]],
      why: `<p>The speed decays exponentially, but its integral is finite:</p><div class="eq"><i>x</i> = ∫<sub>0</sub><sup>∞</sup> <i>v</i><sub>0</sub><i>e</i><sup>−<i>t</i>/τ</sup> <i>dt</i> = <i>v</i><sub>0</sub>τ = ${p(P6.d, 2)} m</div><p>${p(P6.nums[1], 2)} m is only how far it gets by <i>t</i> = τ; ${p(P6.nums[0], 2)} m assumes a constant deceleration.</p>` },
    { q: 'The resistor joining the rails is replaced by one of twice the resistance, and the bar is launched at the same speed. The total heat produced as it comes to rest',
      choices: ['doubles', 'halves', 'is unchanged', 'quadruples'], answer: 2,
      why: '<p>All the bar’s kinetic energy ½<i>mv</i><sub>0</sub><sup>2</sup> ends as heat whatever <i>R</i> is. A larger <i>R</i> means a smaller current and weaker braking, so τ doubles and the bar coasts twice as far, but the total heat is the same.</p>' },
  ],
  7: [
    { q: `A solenoid has ${P7.N} turns on ${p(P7.l * 100, 0)} cm, with radius ${p(P7.r * 100, 1)} cm. Its inductance is about`,
      choices: P7.nums.map(x => x < 0.01 ? `${p(x * 1e3, 2)} µH` : `${p(x, 3)} mH`), answer: 0, nums: P7.nums,
      why: `<p><i>B</i> = μ<sub>0</sub><i>nI</i> through each turn, so <i>N</i>Φ = <i>N</i>(μ<sub>0</sub><i>NI</i>/ℓ)π<i>r</i><sup>2</sup> and</p><div class="eq"><i>L</i> = μ<sub>0</sub><i>N</i><sup>2</sup>π<i>r</i><sup>2</sup>/ℓ = ${p(P7.L * 1e3, 3)} mH</div><p>Using the diameter for <i>r</i> gives 4× too much; <i>N</i> instead of <i>N</i><sup>2</sup> forgets that more turns both make more field and catch more of it.</p>` },
    { q: `The page’s solenoid (<i>L</i> = ${p(M.SOL.L * 1e3, 2)} mH) carries <i>I</i>(<i>t</i>) = (${p(P7b.I0, 1)} A) sin(${P7b.w}<i>t</i>). The largest magnitude of its back emf is`,
      choices: P7b.nums.map(x => x < 1 ? `${p(x, 3)} mV` : x < 10 ? `${p(x, 2)} mV` : x < 1000 ? `${p(x, 1)} mV` : `${p(x / 1e3, 1)} V`), answer: 2, nums: P7b.nums,
      why: `<div class="eq">ε<sub><i>L</i></sub> = −<i>L dI</i>/<i>dt</i> = −<i>LI</i><sub>0</sub>ω cos ω<i>t</i>, &nbsp;max <i>LI</i><sub>0</sub>ω = ${p(M.SOL.L * 1e3, 2)} mH × ${P7b.I0} A × ${P7b.w} s<sup>−1</sup> = ${p(P7b.emf * 1e3, 1)} mV</div><p>The peak comes when <i>I</i> = 0 and changes fastest; <i>LI</i><sub>0</sub> = ${p(P7b.nums[0], 2)} mV is a flux linkage in mWb, not an emf.</p>` },
  ],
  8: [
    { q: `In the page’s circuit (ε = ${M.RL.E} V, <i>R</i> = ${M.RL.R} Ω, <i>L</i> = ${M.RL.L} H), starting from <i>I</i> = 0, how long until the current reaches ${p(P8.I, 1)} A?`,
      choices: P8.nums.map(x => `${p(x, 3)} s`), answer: 1, nums: P8.nums,
      why: `<p>Solve <i>L dI</i>/<i>dt</i> = ε − <i>IR</i> from <i>I</i> = 0: <i>I</i> = (ε/<i>R</i>)(1 − <i>e</i><sup>−<i>t</i>/τ</sup>), τ = <i>L</i>/<i>R</i> = ${p(M.RL.tau, 2)} s.</p><div class="eq"><i>t</i> = −τ ln(1 − <i>IR</i>/ε) = −${p(M.RL.tau, 2)} ln(1 − ${p(P8.I, 1)}/${p(M.RL.Imax, 1)}) = ${p(P8.t, 3)} s</div><p>${p(P8.I, 1)} A is ${p(P8.I / M.RL.Imax * 100, 0)} % of ${p(M.RL.Imax, 0)} A, more than the 63 % reached at τ, so it takes longer than τ.</p>` },
    { q: 'An RL circuit with a battery has been switched on for a long time when the battery is suddenly taken out of the loop (the loop stays closed through the resistor). Just afterwards,',
      choices: ['the current is ε/<i>R</i>, falling, and the inductor acts as the source', 'the current is zero', 'the current is ε/<i>R</i> and steady', 'the current reverses direction'], answer: 0,
      why: '<p>An inductor forbids a sudden jump in current, so <i>I</i> starts at ε/<i>R</i> in the same direction. With no battery, <i>L dI</i>/<i>dt</i> = −<i>IR</i>: the inductor’s emf now drives the current through <i>R</i> while it decays as <i>e</i><sup>−<i>t</i>/τ</sup>, turning ½<i>LI</i><sup>2</sup> into heat.</p>' },
  ],
  9: [
    { q: `The page’s capacitor (${p(M.LC.C * 1e6, 0)} µF, ${p(M.LC.Q * 1e6, 0)} µC) is connected to the ${p(M.LC.L * 1e3, 0)} mH coil at <i>t</i> = 0. The current is first at its largest at`,
      choices: [`<i>t</i> = ${p(M.LC.T / 2 * 1e3, 2)} ms, ${p(P9.I * 1e3, 0)} mA`, `<i>t</i> = ${p(P9.t * 1e3, 2)} ms, ${p(M.LC.f * M.LC.Q * 1e3, 1)} mA`, `<i>t</i> = ${p(P9.t * 1e3, 2)} ms, ${p(P9.I * 1e3, 0)} mA`, `<i>t</i> = 0, ${p(P9.I * 1e3, 0)} mA`], answer: 2,
      nums: [M.LC.T / 2 * 1e3, P9.t * 1e3, P9.t * 1e3, 0], nums2: [P9.I * 1e3, M.LC.f * M.LC.Q * 1e3, P9.I * 1e3, P9.I * 1e3],
      why: `<p>ω = 1/√(<i>LC</i>) = ${p(M.LC.w, 0)} rad/s, <i>T</i> = 2π/ω = ${p(M.LC.T * 1e3, 2)} ms. With <i>q</i> = <i>Q</i> cos ω<i>t</i>, <i>I</i> = −ω<i>Q</i> sin ω<i>t</i> is largest first at ω<i>t</i> = π/2, a quarter period in, when the plates are empty:</p><div class="eq"><i>t</i> = <i>T</i>/4 = ${p(P9.t * 1e3, 2)} ms, &nbsp;|<i>I</i>| = ω<i>Q</i> = ${p(P9.I * 1e3, 0)} mA</div><p>At <i>t</i> = 0 the current is zero: the coil will not let it jump. ${p(M.LC.f * M.LC.Q * 1e3, 1)} mA uses <i>f</i> in place of ω.</p>` },
    { q: 'For an LC circuit with no resistance, show that <i>U</i> = <i>q</i><sup>2</sup>/2<i>C</i> + ½<i>LI</i><sup>2</sup> is constant, and use energy to find the current when the charge on the capacitor is <i>Q</i>/2 (its largest charge is <i>Q</i>).',
      solution: `<p>Differentiate, with <i>I</i> = <i>dq</i>/<i>dt</i>:</p><div class="eq"><i>dU</i>/<i>dt</i> = (<i>q</i>/<i>C</i>)<i>I</i> + <i>LI dI</i>/<i>dt</i> = <i>I</i>(<i>q</i>/<i>C</i> + <i>L dI</i>/<i>dt</i>)</div><p>The bracket is the loop rule, zero at every instant, so <i>U</i> = <i>Q</i><sup>2</sup>/2<i>C</i> throughout. At <i>q</i> = <i>Q</i>/2:</p><div class="eq">½<i>LI</i><sup>2</sup> = <i>Q</i><sup>2</sup>/2<i>C</i> − <i>Q</i><sup>2</sup>/8<i>C</i> = 3<i>Q</i><sup>2</sup>/8<i>C</i> &nbsp;→&nbsp; |<i>I</i>| = (√3/2) <i>Q</i>/√(<i>LC</i>) = (√3/2)ω<i>Q</i></div><p>For the page’s circuit that is ${p(Math.sqrt(3) / 2 * M.LC.Imax * 1e3, 1)} mA. Three quarters of the energy is in the coil when only half the charge has left.</p>` },
  ],
};
