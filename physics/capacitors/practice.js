// capacitors/practice.js — AP Physics C style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here; a quantitative item keeps its choices' numbers in `nums` (in the units shown),
// and checks.mjs recomputes the keyed one by another route.
import * as M from './model.js';

const p = (x, d) => x.toFixed(d);
const { EPS0, K, C0, V0, Q0, U0, PLATE } = M;
const A = PLATE.A, d = PLATE.d;

// ---- page 0: the battery turned up steadily from 20 V to 100 V in 4.0 s ----
const P0 = { V1: 20, V2: 100, dt: 4.0 };
P0.I = C0 * (P0.V2 - P0.V1) / P0.dt;
P0.nums = [C0 * P0.V2 / P0.dt, P0.I, P0.I / 2, C0 * P0.V1 / P0.dt].map(x => x * 1e12);   // final V not ΔV · right · halved · starting V
// ---- page 1: isolated plates pulled from 5 cm to 8 cm; the force between them ----
const P1 = { d2: 0.08 };
P1.V = Q0 / M.cPlate(A, P1.d2);
P1.nums = [V0 * d / P1.d2, V0, V0 * (P1.d2 / d) ** 2, P1.V];        // ΔV ∝ 1/d · battery's · ∝ d² · right
P1.F = Q0 * Q0 / (2 * EPS0 * A);
P1.fnums = [Q0 * M.E0, P1.F, K * Q0 * Q0 / d ** 2, P1.F / 2].map(x => x * 1e6);   // full field σ/ε₀ · right · point charges · ¼
// ---- page 2: the page's spheres, a = 10 cm, b = 20 cm, 100 V ----
const { a: sa, b: sb } = M.SPH, r2 = 0.15;
const P2 = { E: K * M.SPH.Q / r2 ** 2 };
P2.nums = [V0 / (sb - sa), K * M.SPH.Q / sb ** 2, P2.E, K * M.SPH.Q / sa ** 2];   // as if plates · used b · right · used a
P2.dV = V0 * (1 / sa - 1 / r2) / (1 / sa - 1 / sb);
P2.vnums = [P2.dV, V0 * (r2 - sa) / (sb - sa), V0 - P2.dV, V0 * (1 / sa ** 2 - 1 / r2 ** 2) / (1 / sa ** 2 - 1 / sb ** 2)];   // right · linear · the other part · 1/r² for V
// ---- page 3: the page's coax; the tube widened to 16 cm; where the energy is ----
const { a: ca, b: cb, L: cL } = M.CYL, cb2 = 2 * cb;
const P3 = { C: 2 * Math.PI * EPS0 * cL / Math.log(cb2 / ca) };
P3.nums = [M.CYL.C / 2, M.CYL.C, P3.C, M.CYL.C / 4].map(x => x * 1e12);   // C ∝ 1/b · unchanged · right · 1/b²
P3.frac = Math.log(2) / Math.log(cb / ca);
P3.fnums = [((2 * ca) ** 2 - ca ** 2) / (cb ** 2 - ca ** 2), ca / (cb - ca), (1 / ca ** 2 - 1 / (2 * ca) ** 2) / (1 / ca ** 2 - 1 / cb ** 2), P3.frac].map(x => x * 100);   // by volume · by radius · E² not E²r · right
// ---- page 4: the second half of the charge; the gap halved on the battery ----
const P4 = { frac: 1 - 0.25 };
P4.nums = [25, 50, P4.frac * 100, 87.5];
const P4b = { d2: d / 2 };
P4b.U = 0.5 * M.cPlate(A, P4b.d2) * V0 * V0;
P4b.nums = [U0 / 2, U0, 4 * U0, P4b.U].map(x => x * 1e9);           // as if Q fixed · unchanged · ×4 · right
// ---- page 5: 2 µF and 4 µF in series on 9 V ----
const { C1, C2, V: CV } = M.CIRC, S = M.SER;
const P5 = { V1: S.Q / C1 };
P5.nums = [P5.V1, CV * C1 / (C1 + C2), CV, CV / 2];                // right · split the wrong way · all of it · halves
P5.U = S.Q * S.Q / 2 * (1 / C1 + 1 / C2);
P5.unums = [S.Q * CV, M.PAR.U, S.Q * S.Q / (2 * C1), P5.U].map(x => x * 1e6);   // forgot ½ · parallel · C₁ only · right
// ---- page 6: the κ = 3 slab, plates isolated; a graded dielectric ----
const KA = M.KAPPA;
const P6 = { V: V0 / KA };
P6.nums = [V0 * KA, P6.V, V0, V0 / KA ** 2];
const P6b = { k1: 1, k2: 3 };
P6b.C = EPS0 * A * (P6b.k2 - P6b.k1) / (d * Math.log(P6b.k2 / P6b.k1));      // the free-response answer
// ---- page 7: slab fully in, battery on; half in, battery off ----
const P7 = { dQ: (KA - 1) * Q0 };
P7.nums = [KA * Q0, Q0, Q0 * (1 - 1 / KA), P7.dQ].map(x => x * 1e12);  // total not added · Q₀ · wrong way · right
const P7b = { x: 0.5, side: PLATE.side };
P7b.F = U0 * (KA - 1) / (P7b.side * (1 + (KA - 1) * P7b.x) ** 2);
P7b.nums = [U0 * (KA - 1) / P7b.side, P7b.F, U0 * (KA - 1) / (P7b.side * (1 + (KA - 1) * P7b.x)), U0 / (P7b.side * (1 + (KA - 1) * P7b.x) ** 2)].map(x => x * 1e9);   // V held · right · C not C² · no (κ − 1)
// ---- page 8: the induced charge on one half of the sphere ----
const { R: cR, E0: cE } = M.COND, sMax = 3 * EPS0 * cE;
const P8 = { q: sMax * Math.PI * cR * cR };
P8.nums = [sMax * 2 * Math.PI * cR * cR, 0, sMax * 4 * Math.PI * cR * cR, P8.q].map(x => x * 1e9);   // σ_max × half the area · total · whole area · right

const pF = x => `${p(x, 1)} pF`;

export const PRACTICE = {
  0: [
    { q: 'The battery across a capacitor is turned up from Δ<i>V</i> to 3Δ<i>V</i>. Which is true of the capacitance <i>C</i> and the charge <i>Q</i> on each plate?',
      choices: ['<i>C</i> triples; <i>Q</i> is unchanged', '<i>C</i> is unchanged; <i>Q</i> triples', '<i>C</i> is unchanged; <i>Q</i> becomes 9 times larger', '<i>C</i> falls to a third; <i>Q</i> is unchanged'], answer: 1,
      why: '<p><i>C</i> = ε<sub>0</sub><i>A</i>/<i>d</i> depends only on the plates and the gap, so it stays put. Then <i>Q</i> = <i>C</i>Δ<i>V</i> grows in proportion: 3 times. The <b>energy</b> ½<i>C</i>Δ<i>V</i><sup>2</sup> is what goes up 9 times.</p>' },
    { q: `The page’s plates (<i>C</i> = ${p(C0 * 1e12, 2)} pF) are on a battery turned up steadily from ${P0.V1} V to ${P0.V2} V in ${p(P0.dt, 1)} s. The current onto the + plate meanwhile is`,
      choices: P0.nums.map(x => `${p(x, 1)} pA`), answer: 1, nums: P0.nums,
      why: `<p>Differentiate <i>Q</i> = <i>C</i>Δ<i>V</i> with <i>C</i> constant:</p><div class="eq"><i>I</i> = <i>dQ</i>/<i>dt</i> = <i>C</i> <i>d</i>(Δ<i>V</i>)/<i>dt</i> = ${p(C0 * 1e12, 2)} pF × ${p((P0.V2 - P0.V1) / P0.dt, 0)} V/s = ${p(P0.I * 1e12, 1)} pA</div><p>Only the <b>rate of change</b> of the voltage counts: ${P0.V2} V / ${p(P0.dt, 1)} s (${p(P0.nums[0], 1)} pA) mixes up the voltage with its change.</p>` },
  ],
  1: [
    { q: `The page’s plates are charged to ${V0} V with a ${p(d * 100, 0)} cm gap, then disconnected. The plates are pulled apart to ${p(P1.d2 * 100, 0)} cm. The potential difference is now`,
      choices: P1.nums.map(x => `${p(x, 1)} V`), answer: 3, nums: P1.nums,
      why: `<p>Disconnected, <i>Q</i> is fixed, so σ and <i>E</i> = σ/ε<sub>0</sub> = ${p(M.E0, 0)} V/m stay the same. Only the distance grows:</p><div class="eq">Δ<i>V</i> = <i>Ed</i> = ${p(M.E0, 0)} V/m × ${p(P1.d2, 2)} m = ${p(P1.V, 1)} V</div><p>Equivalently <i>C</i> falls to ${p(d * 100, 0)}/${p(P1.d2 * 100, 0)} of its value and Δ<i>V</i> = <i>Q</i>/<i>C</i> rises by the inverse. The ${V0} V stays only if the battery is still connected.</p>` },
    { q: `With <i>Q</i> fixed, the energy of the page’s plates is <i>U</i>(<i>x</i>) = <i>Q</i><sup>2</sup><i>x</i>/2ε<sub>0</sub><i>A</i> at gap <i>x</i>. With <i>Q</i> = ${p(Q0 * 1e12, 0)} pC and <i>A</i> = ${p(A, 2)} m², the attractive force between the plates is`,
      choices: P1.fnums.map(x => `${p(x, 3)} µN`), answer: 1, nums: P1.fnums,
      why: `<p>The force is minus the slope of the energy at fixed charge:</p><div class="eq"><i>F</i> = −<i>dU</i>/<i>dx</i> = −<i>Q</i><sup>2</sup>/2ε<sub>0</sub><i>A</i> = −(${p(Q0 * 1e12, 0)}×10<sup>−12</sup> C)<sup>2</sup> / (2 × ${EPS0} × ${p(A, 2)}) = −${p(P1.F * 1e6, 3)} µN</div><p>The minus sign means it pulls the gap shut. Each plate sits in the <b>other</b> plate’s field, σ/2ε<sub>0</sub>, so <i>F</i> = <i>Q</i>(σ/2ε<sub>0</sub>); using the full gap field σ/ε<sub>0</sub> doubles it to ${p(P1.fnums[0], 3)} µN.</p>` },
  ],
  2: [
    { q: `On the page’s spherical capacitor (<i>a</i> = ${sa * 100} cm, <i>b</i> = ${sb * 100} cm, Δ<i>V</i> = ${V0} V), the field magnitude at <i>r</i> = ${r2 * 100} cm is`,
      choices: P2.nums.map(x => `${p(x, 0)} V/m`), answer: 2, nums: P2.nums,
      why: `<p><i>Q</i> = <i>C</i>Δ<i>V</i> = ${p(M.SPH.C * 1e12, 1)} pF × ${V0} V = ${p(M.SPH.Q * 1e9, 3)} nC, and Gauss gives the point-charge field between the spheres:</p><div class="eq"><i>E</i> = <i>kQ</i>/<i>r</i><sup>2</sup> = ${p(K / 1e9, 2)}×10<sup>9</sup> × ${p(M.SPH.Q * 1e9, 3)}×10<sup>−9</sup> / ${r2}<sup>2</sup> = ${p(P2.E, 0)} V/m</div><p>Δ<i>V</i>/(<i>b</i> − <i>a</i>) = ${p(P2.nums[0], 0)} V/m would be right only for a uniform field; here <i>E</i> falls as 1/<i>r</i><sup>2</sup>.</p>` },
    { q: `Of the ${V0} V between the spheres, how much is across the inner half of the gap, from <i>r</i> = ${sa * 100} cm to ${r2 * 100} cm?`,
      choices: P2.vnums.map(x => `${p(x, 1)} V`), answer: 0, nums: P2.vnums,
      why: `<p>Integrate <i>E</i> = <i>kQ</i>/<i>r</i><sup>2</sup> over each part; <i>kQ</i> cancels in the ratio:</p><div class="eq">Δ<i>V</i><sub>inner</sub> / Δ<i>V</i> = ∫<sub><i>a</i></sub><sup><i>r</i></sup> <i>dr</i>/<i>r</i><sup>2</sup> ÷ ∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>dr</i>/<i>r</i><sup>2</sup> = (1/<i>a</i> − 1/<i>r</i>)/(1/<i>a</i> − 1/<i>b</i>) = (${p(1 / sa, 2)} − ${p(1 / r2, 2)})/(${p(1 / sa, 2)} − ${p(1 / sb, 2)}) =${p(P2.dV / V0, 3)}</div><p>So ${p(P2.dV, 1)} V. The field is strongest near the ball, so the inner half takes more than half; ${p(P2.vnums[1], 1)} V assumes a uniform field.</p>` },
  ],
  3: [
    { q: `The page’s coax (<i>a</i> = ${ca * 100} cm, <i>b</i> = ${cb * 100} cm, <i>L</i> = ${cL * 100} cm, <i>C</i> = ${p(M.CYL.C * 1e12, 1)} pF) gets a wider tube, <i>b</i> = ${cb2 * 100} cm. Its capacitance becomes`,
      choices: P3.nums.map(pF), answer: 2, nums: P3.nums,
      why: `<div class="eq"><i>C</i> = 2πε<sub>0</sub><i>L</i>/ln(<i>b</i>/<i>a</i>) = 2π × ${EPS0} × ${cL} / ln(${cb2 * 100}/${ca * 100}) = ${p(P3.C * 1e12, 1)} pF</div><p>ln 4 → ln 8 is only 3/2 as large, so <i>C</i> falls to 2/3 of ${p(M.CYL.C * 1e12, 1)} pF, not to half: <i>C</i> depends on <i>b</i> only through the logarithm.</p>` },
    { q: `The page’s coax (<i>a</i> = ${ca * 100} cm, <i>b</i> = ${cb * 100} cm) is charged. What fraction of its stored energy lies within ${2 * ca * 100} cm of the axis (between <i>r</i> = ${ca * 100} and ${2 * ca * 100} cm)?`,
      choices: P3.fnums.map(x => `${p(x, 1)} %`), answer: 3, nums: P3.fnums,
      why: `<p>Energy density times a thin shell of volume 2π<i>rL dr</i>, with <i>E</i> = λ/2πε<sub>0</sub><i>r</i>:</p><div class="eq"><i>dU</i> = ½ε<sub>0</sub><i>E</i><sup>2</sup> · 2π<i>rL dr</i> = (λ<sup>2</sup><i>L</i>/4πε<sub>0</sub>) <i>dr</i>/<i>r</i></div><div class="eq">fraction = ln(2<i>a</i>/<i>a</i>) / ln(<i>b</i>/<i>a</i>) = ln 2 / ln 4 = ${p(P3.frac, 3)}</div><p>Each doubling of <i>r</i> holds the same energy. By volume it would be only ${p(P3.fnums[0], 1)} %; the field is far stronger near the rod.</p>` },
  ],
  4: [
    { q: 'A capacitor is charged from 0 to <i>Q</i> by carrying small bits <i>dq</i> across. What fraction of the total work is spent moving the <b>second</b> half of the charge, from <i>Q</i>/2 to <i>Q</i>?',
      choices: P4.nums.map(x => `${p(x, 1)} %`), answer: 2, nums: P4.nums,
      why: '<p>Each <i>dq</i> costs Δ<i>V</i> <i>dq</i> = (<i>q</i>/<i>C</i>) <i>dq</i>, so</p><div class="eq"><i>W</i> = ∫<sub><i>Q</i>/2</sub><sup><i>Q</i></sup> (<i>q</i>/<i>C</i>) <i>dq</i> = (<i>Q</i><sup>2</sup> − <i>Q</i><sup>2</sup>/4)/2<i>C</i> = ¾ · <i>Q</i><sup>2</sup>/2<i>C</i></div><p>75 %. The later bits are carried against a larger voltage, so they cost more; 50 % treats every bit alike.</p>' },
    { q: `The page’s plates stay on the ${V0} V battery (<i>U</i> = ${p(U0 * 1e9, 1)} nJ) while the gap is halved to ${p(P4b.d2 * 100, 1)} cm. The stored energy becomes`,
      choices: P4b.nums.map(x => `${p(x, 1)} nJ`), answer: 3, nums: P4b.nums,
      why: `<p>Connected, Δ<i>V</i> is fixed; <i>C</i> = ε<sub>0</sub><i>A</i>/<i>d</i> doubles:</p><div class="eq"><i>U</i> = ½<i>C</i>Δ<i>V</i><sup>2</sup> = 2<i>U</i><sub>0</sub> = ${p(P4b.U * 1e9, 1)} nJ</div><p>Or by density: <i>E</i> = Δ<i>V</i>/<i>d</i> doubles, ½ε<sub>0</sub><i>E</i><sup>2</sup> goes ×4, the volume halves. ${p(P4b.nums[0], 1)} nJ is the answer with <i>Q</i> fixed instead (battery off).</p>` },
  ],
  5: [
    { q: `The page’s ${C1 * 1e6} µF and ${C2 * 1e6} µF capacitors are in <b>series</b> on ${CV} V. The voltage across the ${C1 * 1e6} µF capacitor is`,
      choices: P5.nums.map(x => `${p(x, 1)} V`), answer: 0, nums: P5.nums,
      why: `<p>In series both carry the same <i>Q</i> = <i>C</i><sub>eq</sub>Δ<i>V</i> = ${p(S.C * 1e6, 3)} µF × ${CV} V = ${p(S.Q * 1e6, 0)} µC, so</p><div class="eq">Δ<i>V</i><sub>1</sub> = <i>Q</i>/<i>C</i><sub>1</sub> = ${p(S.Q * 1e6, 0)} µC / ${C1 * 1e6} µF = ${p(P5.V1, 1)} V</div><p>The <b>smaller</b> capacitor takes the larger share; ${p(P5.nums[1], 1)} V splits it the wrong way round.</p>` },
    { q: `Charging that series pair from empty, the work done is ∫ (<i>q</i>/<i>C</i><sub>1</sub> + <i>q</i>/<i>C</i><sub>2</sub>) <i>dq</i> from 0 to the final charge. The total energy stored is`,
      choices: P5.unums.map(x => `${p(x, 0)} µJ`), answer: 3, nums: P5.unums,
      why: `<p>The same <i>q</i> is on both at every moment, so the voltages add inside the integral:</p><div class="eq"><i>U</i> = (<i>Q</i><sup>2</sup>/2)(1/<i>C</i><sub>1</sub> + 1/<i>C</i><sub>2</sub>) = <i>Q</i><sup>2</sup>/2<i>C</i><sub>eq</sub> = (${p(S.Q * 1e6, 0)} µC)<sup>2</sup>/(2 × ${p(S.C * 1e6, 3)} µF) = ${p(P5.U * 1e6, 0)} µJ</div><p><i>Q</i>Δ<i>V</i> = ${p(P5.unums[0], 0)} µJ is what the battery supplies; half of it is lost as heat in the wires. ${p(P5.unums[1], 0)} µJ is the parallel pair.</p>` },
  ],
  6: [
    { q: `The page’s plates are charged to ${V0} V and disconnected, then a κ = ${KA} slab fills the gap. The potential difference becomes`,
      choices: P6.nums.map(x => `${p(x, 1)} V`), answer: 1, nums: P6.nums,
      why: `<p>Isolated, <i>Q</i> stays. The bound charge on the slab’s faces cancels part of the field: <i>E</i> = <i>E</i><sub>0</sub>/κ, so</p><div class="eq">Δ<i>V</i> = <i>Ed</i> = Δ<i>V</i><sub>0</sub>/κ = ${V0}/${KA} = ${p(P6.V, 1)} V</div><p>Equivalently <i>C</i> rises κ times and Δ<i>V</i> = <i>Q</i>/<i>C</i> falls κ times. It stays ${V0} V only while the battery is connected.</p>` },
    { q: `Free response. The page’s plates (<i>A</i> = ${p(A, 2)} m², <i>d</i> = ${p(d * 100, 0)} cm) are filled with a dielectric whose constant rises linearly across the gap, κ(<i>x</i>) = 1 + 2<i>x</i>/<i>d</i>, from 1 at one plate to 3 at the other. Derive the capacitance and evaluate it.`,
      solution: `<p>The free charge ±<i>Q</i> sits on the plates; by Gauss’s law with the dielectric, the field at depth <i>x</i> is <i>E</i>(<i>x</i>) = σ/κ(<i>x</i>)ε<sub>0</sub>, σ = <i>Q</i>/<i>A</i>. Integrate across the gap:</p><div class="eq">Δ<i>V</i> = ∫<sub>0</sub><sup><i>d</i></sup> σ <i>dx</i> / ε<sub>0</sub>(1 + 2<i>x</i>/<i>d</i>) = (σ<i>d</i>/2ε<sub>0</sub>) ln 3</div><div class="eq"><i>C</i> = <i>Q</i>/Δ<i>V</i> = 2ε<sub>0</sub><i>A</i>/(<i>d</i> ln 3) = (2/ln 3)<i>C</i><sub>0</sub> = ${p(P6b.C / C0, 3)} × ${p(C0 * 1e12, 2)} pF = ${p(P6b.C * 1e12, 2)} pF</div><p>Check: between <i>C</i><sub>0</sub> (κ = 1) and 3<i>C</i><sub>0</sub> (κ = 3), and less than the simple average 2<i>C</i><sub>0</sub>, since thin layers stacked across the gap add in <b>series</b>.</p>`, val: P6b.C },
  ],
  7: [
    { q: `The page’s plates stay on the ${V0} V battery (<i>Q</i><sub>0</sub> = ${p(Q0 * 1e12, 0)} pC) as the κ = ${KA} slab slides fully in. How much charge does the battery move onto the + plate?`,
      choices: P7.nums.map(x => `${p(x, 0)} pC`), answer: 3, nums: P7.nums,
      why: `<p>Connected, Δ<i>V</i> stays ${V0} V and <i>C</i> becomes κ<i>C</i><sub>0</sub>, so the charge becomes κ<i>Q</i><sub>0</sub> = ${p(P7.nums[0], 0)} pC. What flows on is the difference:</p><div class="eq">Δ<i>Q</i> = (κ − 1)<i>Q</i><sub>0</sub> = ${KA - 1} × ${p(Q0 * 1e12, 0)} pC = ${p(P7.dQ * 1e12, 0)} pC</div><p>${p(P7.nums[0], 0)} pC is the final total, not what was added.</p>` },
    { q: `The page’s plates (side ${p(P7b.side * 100, 0)} cm, <i>U</i><sub>0</sub> = ${p(U0 * 1e9, 1)} nJ with no slab) are charged and disconnected. With the κ = ${KA} slab halfway in, <i>C</i>(<i>s</i>) = <i>C</i><sub>0</sub>(1 + (κ − 1)<i>s</i>/ℓ) for depth <i>s</i>. The force pulling the slab in is`,
      choices: P7b.nums.map(x => `${p(x, 1)} nN`), answer: 1, nums: P7b.nums,
      why: `<p>With <i>Q</i> fixed, <i>U</i> = <i>Q</i><sup>2</sup>/2<i>C</i>(<i>s</i>) and the force is down the energy slope:</p><div class="eq"><i>F</i> = −<i>dU</i>/<i>ds</i> = (<i>Q</i><sup>2</sup>/2<i>C</i><sup>2</sup>) <i>dC</i>/<i>ds</i> = <i>U</i><sub>0</sub>(κ − 1) / ℓ(1 + (κ − 1)<i>s</i>/ℓ)<sup>2</sup> = ${p(U0 * 1e9, 1)} nJ × ${KA - 1} / (${P7b.side} m × ${p((1 + (KA - 1) * P7b.x) ** 2, 0)}) = ${p(P7b.F * 1e9, 1)} nN</div><p>Positive: <i>U</i> falls as the slab goes in, so it is pulled in. ${p(P7b.nums[0], 1)} nN is the answer with Δ<i>V</i> held at ${V0} V, which is not the case once the battery is off.</p>` },
  ],
  8: [
    { q: 'A point charge +<i>q</i> sits at the centre of the cavity in a neutral, hollow conducting sphere. In equilibrium, the charge on the inner surface and on the outer surface is',
      choices: ['inner 0, outer 0', 'inner −<i>q</i>, outer 0', 'inner −<i>q</i>, outer +<i>q</i>', 'inner +<i>q</i>, outer −<i>q</i>'], answer: 2,
      why: '<p>A Gaussian surface inside the metal has <i>E</i> = 0 on it, so it encloses zero charge: the inner surface must hold −<i>q</i>. The shell is neutral, so +<i>q</i> is left on the outer surface. Outside, the field is that of +<i>q</i> at the centre.</p>' },
    { q: `The page’s neutral sphere (<i>R</i> = ${p(cR * 100, 0)} cm, <i>E</i><sub>0</sub> = ${cE} V/m) carries σ = 3ε<sub>0</sub><i>E</i><sub>0</sub> cos θ. The total charge on the half facing downfield (0 ≤ θ ≤ 90°) is`,
      choices: P8.nums.map(x => `${p(x, 3)} nC`), answer: 3, nums: P8.nums,
      why: `<p>Rings of width <i>R dθ</i> have area 2π<i>R</i><sup>2</sup> sin θ <i>dθ</i>:</p><div class="eq"><i>q</i> = ∫<sub>0</sub><sup>π/2</sup> 3ε<sub>0</sub><i>E</i><sub>0</sub> cos θ · 2π<i>R</i><sup>2</sup> sin θ <i>dθ</i> = 3ε<sub>0</sub><i>E</i><sub>0</sub>π<i>R</i><sup>2</sup> = ${p(P8.q * 1e9, 3)} nC</div><p>The average of cos θ over the hemisphere’s area is ½, so σ<sub>max</sub> × 2π<i>R</i><sup>2</sup> (${p(P8.nums[0], 3)} nC) is twice too much. Over the <b>whole</b> sphere it sums to zero.</p>` },
  ],
};
