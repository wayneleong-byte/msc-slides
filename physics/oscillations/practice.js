// oscillations/practice.js — AP-style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here from the model or from the givens; checks.mjs recomputes each answer another way.
import * as M from './model.js';

const G = M.G, TAU = 2 * Math.PI;
const f = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const sg = (x, n = 2) => (x > 1e-12 ? '+' : '') + f(x, n);

// 1 · Hooke: the block at x = −0.20 m and at +0.25 m
const x1 = -0.20, x1b = 0.25;
// 2 · speed at x = 0.30 m
const x2 = 0.30, v2 = M.W * Math.sqrt(M.A ** 2 - x2 ** 2);
// 3 · energy at x = A/2
const K3 = 0.5 * M.K * (M.A ** 2 - (M.A / 2) ** 2);
// 4 · a 0.50 kg block on the same spring; the 1.0 kg block's spring force at the bottom
const m4 = 0.50, d4 = m4 * G / M.K, Fbot = M.K * (M.D + M.HANG.A);
// 5 · the 1.5 m pendulum on the Moon; its fastest speed
const gMoon = 1.62, Tmoon = TAU * Math.sqrt(M.PEND.L / gMoon), vmax5 = M.vmaxPendulum(M.PEND.L, M.PEND.th0);
// 6 · doubling the period; a pendulum for 3.0 s
const k6 = M.K / 4, T6 = 3.0, L6 = G * (T6 / TAU) ** 2, TL = M.periodPendulum(M.DOUBLE.L);
// 8 · the pushed start (Physics C)
const St = M.STARTS[1], t8 = (Math.PI / 2 - St.phi) / M.W;
// 9 · the rod and the hoop (Physics C)
const R = M.ROD, H = M.HOOP;
// 10 · the torsion pendulum (Physics C)
const Ts = M.TORS, wT = TAU / Ts.T;
// 11 · the car with 300 kg aboard; the swing
const C = M.CAR, m11 = C.m + 300, T11 = M.periodSpring(m11, C.k), Sw = M.SWING;

export const PRACTICE = {
  0: [
    { q: `The block oscillates with amplitude <i>A</i> = ${f(M.A)} m. How far does it travel during one full period?`,
      choices: ['0 m', `${f(M.A)} m`, `${f(2 * M.A)} m`, `${f(4 * M.A)} m`], answer: 3,
      why: `<p>From +<i>A</i> to −<i>A</i> is 2<i>A</i>, and back again is another 2<i>A</i>: 4<i>A</i> = ${f(4 * M.A)} m. Its <i>displacement</i> over a period is 0, since it ends where it started.</p>` },
    { q: `The period is ${f(M.T0, 3)} s. What is the frequency?`,
      choices: [`${f(M.T0)} Hz`, `${f(M.F0, 3)} Hz`, `${f(M.W)} Hz`, `${f(1 / M.W, 3)} Hz`], answer: 1,
      why: `<div class="eq"><i>f</i> = 1/<i>T</i> = 1/${f(M.T0, 3)} = ${f(M.F0, 3)} Hz</div><p>${f(M.W)} is ω = 2π<i>f</i> in rad/s, the angular frequency, not cycles per second.</p>` },
  ],
  1: [
    { q: `Take + to the right of equilibrium. The block (<i>k</i> = ${M.K} N/m) is at <i>x</i> = ${f(x1)} m. What is the spring force on it?`,
      choices: [`${sg(-M.K * x1)} N`, `${sg(M.K * x1)} N`, `${sg(-M.K / x1, 1)} N`, `${sg(-0.5 * M.K * x1)} N`], answer: 0,
      why: `<div class="eq"><i>F</i><sub>s</sub> = −<i>k</i>Δ<i>x</i> = −${M.K} × (${f(x1)}) = ${sg(-M.K * x1)} N</div><p>Squashed to the left, the spring pushes right, toward equilibrium. ${sg(M.K * x1)} N drops the minus sign.</p>` },
    { q: `What is the ${f(M.M1, 1)} kg block’s acceleration at <i>x</i> = ${sg(x1b)} m?`,
      choices: [`${sg(M.K * x1b / M.M1)} m/s²`, `${sg(-M.W * x1b)} m/s²`, `${sg(-M.AMAX)} m/s²`, `${sg(-M.K * x1b / M.M1)} m/s²`], answer: 3,
      why: `<div class="eq"><i>a</i> = −(<i>k</i>/<i>m</i>)<i>x</i> = −(${M.K}/${f(M.M1, 1)}) × ${f(x1b)} = ${sg(-M.K * x1b / M.M1)} m/s²</div><p>The acceleration is not constant: ${sg(-M.AMAX)} m/s² is its value only at <i>x</i> = +<i>A</i>. −ω<i>x</i> forgets to square ω.</p>` },
  ],
  2: [
    { q: 'At the instant the block is at <i>x</i> = +<i>A</i>,',
      choices: ['<i>v</i> = 0 and <i>a</i> = 0', '<i>v</i> is greatest and <i>a</i> = 0', '<i>v</i> = 0 and <i>a</i> is greatest, toward −<i>x</i>', '<i>v</i> = 0 and <i>a</i> is greatest, toward +<i>x</i>'], answer: 2,
      why: '<p>The <i>x</i>–<i>t</i> graph has a peak there: zero slope, so <i>v</i> = 0. And <i>a</i> = −ω²<i>x</i> is largest in size and points back toward equilibrium, −<i>x</i>.</p>' },
    { q: `With <i>A</i> = ${f(M.A)} m and ω = ${f(M.W, 1)} rad/s, how fast is the block moving at <i>x</i> = ${f(x2)} m?`,
      choices: [`${f(M.VMAX)} m/s`, `${f(M.W * x2)} m/s`, `${f(v2)} m/s`, `${f(M.W * (M.A - x2))} m/s`], answer: 2,
      why: `<p>From energy, ½<i>mv</i>² = ½<i>k</i>(<i>A</i>² − <i>x</i>²), so</p><div class="eq"><i>v</i> = ω√(<i>A</i>² − <i>x</i>²) = ${f(M.W, 1)} × √(${f(M.A ** 2)} − ${f(x2 ** 2)}) = ${f(v2)} m/s</div><p>${f(M.VMAX)} m/s is the speed only at <i>x</i> = 0.</p>` },
  ],
  3: [
    { q: `Total energy ½<i>kA</i>² = ${f(M.E)} J. What is the block’s kinetic energy at <i>x</i> = <i>A</i>/2?`,
      choices: [`${f(M.E / 2)} J`, `${f(K3)} J`, `${f(M.E - K3)} J`, `${f(M.E)} J`], answer: 1,
      why: `<div class="eq"><i>U</i> = ½<i>k</i>(<i>A</i>/2)² = ¼ × ½<i>kA</i>² = ${f(M.E - K3)} J &nbsp;⇒&nbsp; <i>K</i> = ${f(M.E)} − ${f(M.E - K3)} = ${f(K3)} J</div><p>Halfway out is not half the energy: <i>U</i> grows as <i>x</i>². ${f(M.E - K3)} J is the spring’s share.</p>` },
    { q: 'The amplitude is doubled. The total energy and the maximum speed become',
      choices: ['energy ×2, max speed ×2', 'energy ×4, max speed ×2', 'energy ×4, max speed ×4', 'energy ×2, max speed ×√2'], answer: 1,
      why: '<p><i>E</i> = ½<i>kA</i>² grows 4×. <i>v</i><sub>max</sub> = ω<i>A</i>, and ω = √(<i>k</i>/<i>m</i>) does not change, so it doubles (4× the kinetic energy ⇒ 2× the speed).</p>' },
  ],
  4: [
    { q: `A ${f(m4)} kg block hangs from the same ${M.K} N/m spring. How far does the spring stretch to the new equilibrium?`,
      choices: [`${f(m4 / M.K, 4)} m`, `${f(M.D, 3)} m`, `${f(M.K / (m4 * G), 2)} m`, `${f(d4, 3)} m`], answer: 3,
      why: `<div class="eq"><i>kd</i> = <i>mg</i> &nbsp;⇒&nbsp; <i>d</i> = ${f(m4)} × ${f(G)} / ${M.K} = ${f(d4, 3)} m</div><p>Half the mass, half the sag (${f(M.D, 3)} m was for ${f(M.M1, 1)} kg). ${f(m4 / M.K, 4)} m forgets <i>g</i>: it uses mass, not weight; ${f(M.K / (m4 * G), 2)} m turns the formula upside down.</p>` },
    { q: `The ${f(M.M1, 1)} kg block bobs ${f(M.HANG.A)} m about its equilibrium (sag ${f(M.D, 3)} m). What is the spring’s force on it at the lowest point?`,
      choices: [`${f(M.WEIGHT)} N`, `${f(Fbot)} N`, `${f(M.K * M.HANG.A)} N`, `${f(M.K * (M.D - M.HANG.A))} N`], answer: 1,
      why: `<p>At the bottom the spring is stretched <i>d</i> + <i>A</i> = ${f(M.D + M.HANG.A, 4)} m:</p><div class="eq"><i>F</i><sub>s</sub> = <i>k</i>(<i>d</i> + <i>A</i>) = ${M.K} × ${f(M.D + M.HANG.A, 4)} = ${f(Fbot)} N</div><p>That is ${f(M.K * M.HANG.A)} N more than the weight: a net ${f(M.K * M.HANG.A)} N upward, back toward equilibrium. ${f(M.K * (M.D - M.HANG.A))} N is the force at the top.</p>` },
  ],
  5: [
    { q: `The ${f(M.PEND.L, 1)} m pendulum (period ${f(M.P_T)} s on Earth) is taken to the Moon, where <i>g</i> = ${f(gMoon)} m/s². Its period there?`,
      choices: [`${f(Tmoon)} s`, `${f(M.P_T)} s`, `${f(M.P_T * G / gMoon, 1)} s`, `${f(M.P_T * Math.sqrt(gMoon / G), 3)} s`], answer: 0,
      why: `<div class="eq"><i>T</i> = 2π√(<i>L</i>/<i>g</i>) = 2π√(${f(M.PEND.L, 1)}/${f(gMoon)}) = ${f(Tmoon)} s</div><p>Weaker gravity, slower swing, but only by √(${f(G)}/${f(gMoon)}) = ${f(Math.sqrt(G / gMoon))}, not by the full ratio ${f(G)}/${f(gMoon)} = ${f(G / gMoon)}, which gives ${f(M.P_T * G / gMoon, 1)} s.</p>` },
    { q: `The same pendulum is released from rest at ${(M.PEND.th0 / M.DEG).toFixed(0)}°. How fast is the bob moving at the bottom?`,
      choices: [`${f(Math.sqrt(2 * G * M.PEND.L * Math.sin(M.PEND.th0)))} m/s`, `${f(Math.sqrt(2 * G * M.PEND.L))} m/s`, `${f(Math.sqrt(G * M.PEND.L * (1 - Math.cos(M.PEND.th0))), 3)} m/s`, `${f(vmax5, 3)} m/s`], answer: 3,
      why: `<p>It drops Δ<i>y</i> = <i>L</i>(1 − cos θ<sub>0</sub>) = ${f(M.PEND.L * (1 - Math.cos(M.PEND.th0)) * 100, 2)} cm.</p><div class="eq"><i>v</i> = √(2<i>g</i>Δ<i>y</i>) = ${f(vmax5, 3)} m/s</div><p>√(2<i>gL</i>) would need a drop of the whole string length; sin θ<sub>0</sub> gives a sideways distance, not a height.</p>` },
  ],
  6: [
    { q: `The ${f(M.DOUBLE.m, 1)} kg block on the ${M.K} N/m spring has period ${f(M.periodSpring(M.DOUBLE.m, M.K))} s. Which spring constant doubles the period?`,
      choices: [`${f(M.K / 2, 1)} N/m`, `${f(2 * M.K, 1)} N/m`, `${f(k6, 1)} N/m`, `${f(4 * M.K, 1)} N/m`], answer: 2,
      why: `<p><i>T</i> ∝ 1/√<i>k</i>. For 2<i>T</i>, √(<i>k</i><sub>new</sub>) must be half of √<i>k</i>, so <i>k</i><sub>new</sub> = <i>k</i>/4 = ${f(k6, 1)} N/m. Halving <i>k</i> only gives √2 × the period; a stiffer spring makes it shorter.</p>` },
    { q: `A ${f(M.DOUBLE.L)} m pendulum has period ${f(TL)} s. How long must it be for a period of ${f(T6, 1)} s?`,
      choices: [`${f(M.DOUBLE.L * T6 / TL)} m`, `${f(G * T6 / TAU)} m`, `${f(G * T6 ** 2 / 4, 1)} m`, `${f(L6)} m`], answer: 3,
      why: `<div class="eq"><i>L</i> = <i>g</i>(<i>T</i>/2π)² = ${f(G)} × (${f(T6, 1)}/2π)² = ${f(L6)} m</div><p>Or by proportion: <i>L</i> ∝ <i>T</i>², so ${f(M.DOUBLE.L)} × (${f(T6, 1)}/${f(TL)})² = ${f(L6)} m. Scaling <i>L</i> by the time ratio itself gives ${f(M.DOUBLE.L * T6 / TL)} m.</p>` },
  ],
  7: [
    { q: 'The block on the horizontal spring is pulled out twice as far before release. Compared with before, its period and maximum speed are',
      choices: ['period the same, max speed doubled', 'period doubled, max speed the same', 'both the same', 'period ×√2, max speed doubled'], answer: 0,
      why: '<p><i>T</i> = 2π√(<i>m</i>/<i>k</i>) has no <i>A</i> in it. Twice the distance, twice the force, twice the acceleration: it covers twice the ground in the same time, so <i>v</i><sub>max</sub> = ω<i>A</i> doubles.</p>' },
    { q: 'Which change would alter the period of a simple pendulum clock?',
      choices: ['a bob four times as heavy', 'a swing of 4° instead of 8°', 'moving it to the Moon', 'starting it with a push instead of from rest'], answer: 2,
      why: '<p><i>T</i> = 2π√(<i>L</i>/<i>g</i>) depends only on <i>L</i> and <i>g</i>. Mass cancels (<i>ma</i> = −<i>mg</i> sin θ), small amplitudes all give the same period, and a push only changes the amplitude.</p>' },
  ],
  8: [
    { q: `The ${f(M.M1, 1)} kg block on the ${M.K} N/m spring starts at <i>x</i><sub>0</sub> = ${f(St.x0)} m with <i>v</i><sub>0</sub> = ${f(St.v0, 1)} m/s. What is its amplitude?`,
      choices: [`${f(St.A, 3)} m`, `${f(St.x0, 3)} m`, `${f(St.x0 + Math.abs(St.v0) / M.W, 3)} m`, `${f(Math.hypot(St.x0, St.v0), 3)} m`], answer: 0,
      why: `<p>ω = √(<i>k</i>/<i>m</i>) = ${f(M.W, 1)} rad/s. From energy, ½<i>kA</i>² = ½<i>kx</i><sub>0</sub>² + ½<i>mv</i><sub>0</sub>²:</p><div class="eq"><i>A</i> = √(<i>x</i><sub>0</sub>² + (<i>v</i><sub>0</sub>/ω)²) = √(${f(St.x0)}² + ${f(Math.abs(St.v0) / M.W)}²) = ${f(St.A, 3)} m</div><p>The push adds energy, so <i>A</i> &gt; <i>x</i><sub>0</sub>. The two parts add as squares, not directly; √(<i>x</i><sub>0</sub>² + <i>v</i><sub>0</sub>²) mixes metres with metres per second.</p>` },
    { q: `Free response. Show that <i>x</i> = <i>A</i> cos(ω<i>t</i> + φ) solves <i>m</i> d²<i>x</i>/d<i>t</i>² = −<i>kx</i>. For the pushed block above, find φ and the first time it passes <i>x</i> = 0.`,
      solution: `<p>Differentiate twice: d<i>x</i>/d<i>t</i> = −<i>A</i>ω sin(ω<i>t</i> + φ), d²<i>x</i>/d<i>t</i>² = −<i>A</i>ω² cos(ω<i>t</i> + φ) = −ω²<i>x</i>. This equals −(<i>k</i>/<i>m</i>)<i>x</i> for every <i>t</i> if ω = √(<i>k</i>/<i>m</i>) = ${f(M.W, 1)} rad/s.</p><p>At <i>t</i> = 0: <i>A</i> cos φ = ${f(St.x0)} m and −<i>A</i>ω sin φ = ${f(St.v0, 1)} m/s, so tan φ = −<i>v</i><sub>0</sub>/ω<i>x</i><sub>0</sub> = ${f(-St.v0 / (M.W * St.x0), 3)} with cos φ &gt; 0:</p><div class="eq">φ = ${f(St.phi / M.DEG, 1)}° = ${f(St.phi, 3)} rad, &nbsp; <i>A</i> = ${f(St.A, 3)} m</div><p>It first reaches <i>x</i> = 0 when ω<i>t</i> + φ = π/2:</p><div class="eq"><i>t</i> = (π/2 − φ)/ω = (${f(Math.PI / 2, 3)} − ${f(St.phi, 3)})/${f(M.W, 1)} = ${f(t8, 3)} s</div><p>Sooner than a quarter period (${f(M.T0 / 4, 3)} s), because it starts closer and already moving toward equilibrium.</p>` },
  ],
  9: [
    { q: `A uniform rod ${f(R.L, 1)} m long swings about one end. What is its period for small swings?`,
      choices: [`${f(M.periodPendulum(R.L))} s`, `${f(M.periodPendulum(R.L / 2))} s`, `${f(R.T)} s`, `${f(M.periodPhysical(R.m, R.d, R.Icm))} s`], answer: 2,
      why: `<p><i>I</i> about the end = <i>I</i><sub>cm</sub> + <i>m</i>(<i>L</i>/2)² = <i>mL</i>²/12 + <i>mL</i>²/4 = <i>mL</i>²/3, and <i>d</i> = <i>L</i>/2:</p><div class="eq"><i>T</i> = 2π√(<i>I</i>/<i>mgd</i>) = 2π√(2<i>L</i>/3<i>g</i>) = ${f(R.T)} s</div><p>${f(M.periodPendulum(R.L / 2))} s treats it as a bob at its centre of mass; ${f(M.periodPhysical(R.m, R.d, R.Icm))} s uses <i>I</i><sub>cm</sub> instead of <i>I</i> about the pivot.</p>` },
    { q: `Free response. A thin hoop of radius <i>R</i> = ${f(H.R)} m hangs on a nail by its rim. Find its moment of inertia about the nail, write the equation of motion for small swings in its plane, and find the period.`,
      solution: `<p>About its centre every bit of a hoop is at distance <i>R</i>: <i>I</i><sub>cm</sub> = ∫<i>R</i>² d<i>m</i> = <i>mR</i>². The nail is <i>d</i> = <i>R</i> from the centre, so by parallel axes <i>I</i> = <i>mR</i>² + <i>mR</i>² = 2<i>mR</i>².</p><p>Gravity acts at the centre: τ = −<i>mgR</i> sin θ ≈ −<i>mgR</i>θ. With τ = <i>I</i>α:</p><div class="eq">d²θ/d<i>t</i>² = −(<i>mgR</i>/2<i>mR</i>²)θ = −(<i>g</i>/2<i>R</i>)θ</div><p>SHM with ω = √(<i>g</i>/2<i>R</i>), independent of mass:</p><div class="eq"><i>T</i> = 2π√(2<i>R</i>/<i>g</i>) = 2π√(${f(2 * H.R)}/${f(G)}) = ${f(H.T)} s</div><p>The same as a simple pendulum as long as the hoop is wide (${f(2 * H.R)} m).</p>` },
  ],
  10: [
    { q: `The ${f(Ts.M, 1)} kg disc on the wire has period ${f(Ts.T)} s. It is replaced by a disc of the same mass but twice the radius. The new period?`,
      choices: [`${f(Ts.T)} s`, `${f(Ts.T * Math.SQRT2)} s`, `${f(2 * Ts.T)} s`, `${f(4 * Ts.T, 1)} s`], answer: 2,
      why: `<p><i>I</i> = ½<i>MR</i>² grows 4× with twice the radius, and <i>T</i> = 2π√(<i>I</i>/κ) grows √4 = 2×: ${f(2 * Ts.T)} s. Same wire, same κ.</p>` },
    { q: `Free response. The disc (<i>I</i> = ${f(Ts.I, 3)} kg·m², κ = ${Ts.kappa} N·m/rad) is twisted ${(Ts.th0 / M.DEG).toFixed(0)}° and released from rest. Write θ(<i>t</i>) and find the largest torque and the largest angular speed.`,
      solution: `<p><i>I</i> d²θ/d<i>t</i>² = −κθ, so θ = θ<sub>0</sub> cos(ω<i>t</i>) with ω = √(κ/<i>I</i>) = √(${Ts.kappa}/${f(Ts.I, 3)}) = ${f(wT, 3)} rad/s and θ<sub>0</sub> = ${(Ts.th0 / M.DEG).toFixed(0)}° = ${f(Ts.th0, 3)} rad (released from rest, so φ = 0). No small-angle step: τ = −κθ holds at any twist.</p><div class="eq">|τ|<sub>max</sub> = κθ<sub>0</sub> = ${Ts.kappa} × ${f(Ts.th0, 3)} = ${f(Ts.kappa * Ts.th0, 3)} N·m &nbsp;(at the ends)</div><div class="eq">|dθ/d<i>t</i>|<sub>max</sub> = θ<sub>0</sub>ω = ${f(Ts.th0, 3)} × ${f(wT, 3)} = ${f(Ts.th0 * wT, 2)} rad/s &nbsp;(passing θ = 0)</div><p>θ must be in radians: the torque law and ω both assume it.</p>` },
  ],
  11: [
    { q: `The ${C.m} kg car bounces with period ${f(C.T, 3)} s on its springs (shock absorbers off). Passengers totalling 300 kg get in. The new period?`,
      choices: [`${f(C.T, 3)} s`, `${f(C.T * m11 / C.m, 3)} s`, `${f(C.T * Math.sqrt(C.m / m11), 3)} s`, `${f(T11, 3)} s`], answer: 3,
      why: `<div class="eq"><i>T</i> = 2π√(<i>m</i>/<i>k</i>) = 2π√(${m11}/${C.k}) = ${f(T11, 3)} s</div><p>Heavier car, slower bounce, by √(${m11}/${C.m}) = ${f(Math.sqrt(m11 / C.m), 3)}, not by the mass ratio itself.</p>` },
    { q: `To push a child on a ${f(Sw.L, 1)} m swing once per swing (once each full cycle), how long should you wait between pushes?`,
      choices: [`${f(Sw.T / 2)} s`, `${f(Sw.T)} s`, `${f(TAU * Math.sqrt(G / Sw.L), 1)} s`, `${f(Math.sqrt(Sw.L / G), 3)} s`], answer: 1,
      why: `<div class="eq"><i>T</i> = 2π√(<i>L</i>/<i>g</i>) = 2π√(${f(Sw.L, 1)}/${f(G)}) = ${f(Sw.T)} s</div><p>The child returns to your hands once per full period. Half of it, ${f(Sw.T / 2)} s, is when the child is at the far end. The child’s mass and (small) amplitude don’t matter.</p>` },
  ],
};
