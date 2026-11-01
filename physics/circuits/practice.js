// circuits/practice.js — AP Physics C style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here; a quantitative item keeps its choices' numbers in `nums` (in the units shown),
// and checks.mjs recomputes the keyed one by another route.
import * as M from './model.js';

const p = (x, d) => x.toFixed(d);
const { CU, E_CH } = M;

// ---- page 0: drift speed in a round copper wire; charge from a changing current ----
const P0 = { I: 3.0, D: 2.0e-3 };
const vd = A => P0.I / (CU.n * E_CH * A);
P0.v = vd(Math.PI * (P0.D / 2) ** 2);
P0.nums = [P0.v, vd(Math.PI * P0.D ** 2), vd(P0.D ** 2), vd((P0.D / 2) ** 2)].map(x => x * 1e3);   // right · diameter as radius · A = D² · forgot π
const P0b = { a: 4.0, b: 1.0, T: 4.0 };                     // I = a t − b t² (A), 0 to T
P0b.q = P0b.a * P0b.T ** 2 / 2 - P0b.b * P0b.T ** 3 / 3;
P0b.Imax = P0b.a ** 2 / (4 * P0b.b);
P0b.nums = [P0b.Imax * P0b.T, P0b.Imax * P0b.T / 2, P0b.q, P0b.a * P0b.T ** 2 / 2];   // peak × time · triangle · right · dropped the t² term
// ---- page 1: the page's thin nichrome wire; a tapered one ----
const { rho } = M.RES, L1 = 2.0, rA = M.RES.dThin / 2, rB = M.RES.dThick / 2;
const P1 = { R: M.rThin(L1) };
P1.nums = [rho * L1 / (Math.PI * M.RES.dThin ** 2), rho * L1 / rA ** 2, P1.R, rho * L1 / M.RES.dThin ** 2];   // diameter as radius · forgot π · right · A = d²
const P1b = { R: rho * L1 / (Math.PI * rA * rB) };
P1b.nums = [rho * L1 / (Math.PI * ((rA + rB) / 2) ** 2), (M.rThin(L1) + M.rThick(L1)) / 2, M.rThin(L1), P1b.R];   // mean radius · mean of the ends · thin end only · right
// ---- page 2: a hollow carbon cylinder, current flowing radially ----
const P2 = { rho: 3.5e-5, a: 0.010, b: 0.020, L: 0.050 };
P2.R = P2.rho * Math.log(P2.b / P2.a) / (2 * Math.PI * P2.L);
P2.nums = [P2.rho * (P2.b - P2.a) / (2 * Math.PI * P2.a * P2.L), P2.R, P2.rho * (P2.b - P2.a) / (2 * Math.PI * P2.b * P2.L), P2.rho * P2.L / (Math.PI * (P2.b ** 2 - P2.a ** 2))].map(x => x * 1e5);
// inner area only · right · outer area only · current along the axis instead
// ---- page 3: two of the page's bulbs in series; a ramped voltage ----
const { E: VB, R: RB } = M.BULB;
const P3 = { P: VB ** 2 / (2 * RB) };
P3.nums = [2 * VB ** 2 / RB, VB ** 2 / RB, P3.P, VB ** 2 / (4 * RB)];   // parallel · one bulb · right · each bulb
const P3b = { T: 10 };
P3b.E = VB ** 2 / RB * P3b.T / 3;
P3b.nums = [VB ** 2 / RB * P3b.T / 2, P3b.E, VB ** 2 / RB * P3b.T, (VB / 2) ** 2 / RB * P3b.T];   // average P linear · right · full P · P at the average V
// ---- page 4: the page's cell on 4 Ω; what r is best ----
const { E: EC, r: rC } = M.CELL, RL4 = 4;
const P4 = { V: EC * RL4 / (RL4 + rC) };
P4.nums = [EC, EC * rC / (RL4 + rC), P4.V, EC / 2];                 // ideal · the Ir drop · right · half
// ---- page 5: strips side by side ----
const P5 = { R0: 12 };
P5.R = P5.R0 / 2;                                                    // σ averages 2σ₀ across the width
P5.nums = [P5.R0 * Math.log(3) / 2, P5.R0 / 3, P5.R, P5.R0];         // strips in series · edge at 3σ₀ · right · σ₀ throughout
// ---- page 6: the page's combination with R₃ broken; R₃ as a variable resistor ----
const CB = M.COMBO;
const P6 = { I: CB.E / (CB.R1 + CB.R245) };
P6.nums = [CB.E / CB.Req, P6.I, CB.E / CB.R1, CB.E / CB.R245];      // unchanged · right · R₁ only · the 8 Ω only
const P6b = { R: CB.R1 * CB.R245 / (CB.R1 + CB.R245) };
P6b.nums = [P6b.R, CB.R1, CB.R245, CB.R1 + CB.R245];                 // right · R₁ only · the branch only · in series
// ---- page 7: the page's network with the 6 V battery replaced by a wire ----
const K7 = M.KIRCH, R345 = 1 / (1 / K7.R5 + 1 / (K7.R3 + K7.R4));
const P7 = { I: K7.E1 / (K7.R1 + K7.R2 + R345) };
const I1now = M.edgeI(K7, M.solve(K7.edges, 'bl'), 'R1');
P7.nums = [I1now, P7.I, K7.E1 / (K7.R1 + K7.R2), K7.E1 / (K7.R1 + K7.R2 + K7.R3 + K7.R4)].map(x => x * 1e3);   // unchanged · right · R₅ a short · R₅ ignored
const P7b = { dI: 1 / 44, E2zero: -2.4 };                            // from the solution below; checked numerically
// ---- page 8: the page's RC circuit ----
const { E: ER, tau } = M.RC, V8 = 9.0;
const P8 = { t: -tau * Math.log(1 - V8 / ER) };
P8.nums = [tau * Math.log(ER / V8), P8.t, tau * V8 / ER, tau];   // ln upside down · right · linear · τ
const P8b = { f: 1 - Math.exp(-2) };
P8b.nums = [(1 - Math.exp(-1)) * 100, P8b.f * 100, Math.exp(-1) * 100, 50];   // used e^(−t/RC) for the energy · right · what's left of q · half

export const PRACTICE = {
  0: [
    { q: `A copper wire of <b>diameter</b> ${p(P0.D * 1e3, 1)} mm carries ${p(P0.I, 1)} A (<i>n</i> = 8.5 × 10<sup>28</sup> m<sup>−3</sup>). The drift speed of its electrons is`,
      choices: P0.nums.map(x => `${p(x, 4)} mm/s`), answer: 0, nums: P0.nums,
      why: `<p>Area from the <b>radius</b>: <i>A</i> = π(${p(P0.D / 2 * 1e3, 1)} mm)<sup>2</sup> = ${p(Math.PI * (P0.D / 2) ** 2 * 1e6, 3)} mm². Then</p><div class="eq"><i>v</i><sub>d</sub> = <i>I</i>/<i>neA</i> = ${P0.I} / (8.5×10<sup>28</sup> × 1.60×10<sup>−19</sup> × ${p(Math.PI * (P0.D / 2) ** 2 * 1e6, 3)}×10<sup>−6</sup>) = ${p(P0.v * 1e3, 4)} mm/s</div><p>Using the diameter as the radius gives ${p(P0.nums[1], 4)} mm/s, four times too slow.</p>` },
    { q: `The current in a wire is <i>I</i>(<i>t</i>) = ${p(P0b.a, 1)}<i>t</i> − ${p(P0b.b, 1)}<i>t</i><sup>2</sup> (A, <i>t</i> in s) from <i>t</i> = 0 to ${p(P0b.T, 1)} s. The charge that passes a cross-section is`,
      choices: P0b.nums.map(x => `${p(x, 1)} C`), answer: 2, nums: P0b.nums,
      why: `<div class="eq"><i>q</i> = ∫<i>I dt</i> = ∫<sub>0</sub><sup>${P0b.T}</sup> (${P0b.a}<i>t</i> − <i>t</i><sup>2</sup>) <i>dt</i> = ${p(P0b.a / 2, 0)}(${P0b.T})<sup>2</sup> − (${P0b.T})<sup>3</sup>/3 = ${p(P0b.a * P0b.T ** 2 / 2, 0)} − ${p(P0b.b * P0b.T ** 3 / 3, 2)} = ${p(P0b.q, 1)} C</div><p>The area under <i>I</i>(<i>t</i>), a parabola peaking at ${p(P0b.Imax, 0)} A. Peak × time (${p(P0b.nums[0], 1)} C) overcounts; a triangle (${p(P0b.nums[1], 1)} C) undercounts.</p>` },
  ],
  1: [
    { q: `The page’s thin nichrome wire (ρ = 1.10 × 10<sup>−6</sup> Ω·m, <b>diameter</b> ${p(M.RES.dThin * 1e3, 1)} mm) is ${p(L1, 1)} m long. Its resistance is`,
      choices: P1.nums.map(x => `${p(x, 2)} Ω`), answer: 2, nums: P1.nums,
      why: `<div class="eq"><i>R</i> = ρ<i>L</i>/<i>A</i> = ρ<i>L</i>/π<i>r</i><sup>2</sup> = 1.10×10<sup>−6</sup> × ${L1} / (π × (${p(rA * 1e3, 2)}×10<sup>−3</sup>)<sup>2</sup>) = ${p(P1.R, 2)} Ω</div><p>The radius is half the diameter; using the diameter gives a quarter of the answer, ${p(P1.nums[0], 2)} Ω.</p>` },
    { q: `A ${p(L1, 1)} m nichrome rod is tapered: its radius grows linearly from ${p(rA * 1e3, 2)} mm at one end to ${p(rB * 1e3, 2)} mm at the other. Its resistance end to end is`,
      choices: P1b.nums.map(x => `${p(x, 2)} Ω`), answer: 3, nums: P1b.nums,
      why: `<p>Slices <i>dx</i> are in series; each has <i>dR</i> = ρ <i>dx</i>/π<i>r</i>(<i>x</i>)<sup>2</sup>, with <i>r</i> = <i>a</i> + (<i>b</i> − <i>a</i>)<i>x</i>/<i>L</i>, so <i>dx</i> = <i>L dr</i>/(<i>b</i> − <i>a</i>):</p><div class="eq"><i>R</i> = (ρ<i>L</i>/π(<i>b</i> − <i>a</i>)) ∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>dr</i>/<i>r</i><sup>2</sup> = ρ<i>L</i>/π<i>ab</i> = ${p(P1b.R, 2)} Ω</div><p>Not the mean radius (${p(P1b.nums[0], 2)} Ω) nor the mean of the end values (${p(P1b.nums[1], 2)} Ω): the thin end dominates, but not entirely.</p>` },
  ],
  2: [
    { q: 'In the page’s circuit (6 V battery, 3 Ω resistor, ideal wires), what is the potential difference between the two ends of the wire joining the battery’s + terminal to the resistor?',
      choices: ['6 V', '3 V', '2 V', '0 V'], answer: 3,
      why: '<p>An ideal wire has <i>R</i> = 0, so Δ<i>V</i> = <i>IR</i> = 0 along it, whatever the current. Every point of that wire is at the battery’s + potential; the whole 6 V drop happens across the resistor.</p>' },
    { q: `A carbon tube (ρ = ${p(P2.rho * 1e5, 1)} × 10<sup>−5</sup> Ω·m), inner radius ${p(P2.a * 100, 0)} cm, outer ${p(P2.b * 100, 0)} cm, length ${p(P2.L * 100, 0)} cm, has current flowing <b>radially</b> from the inner surface to the outer. Its resistance is`,
      choices: P2.nums.map(x => `${p(x, 2)} × 10<sup>−5</sup> Ω`), answer: 1, nums: P2.nums,
      why: `<p>Thin cylindrical shells are in series; each has length <i>dr</i> along the current and area 2π<i>rL</i>:</p><div class="eq"><i>R</i> = ∫<sub><i>a</i></sub><sup><i>b</i></sup> ρ <i>dr</i>/2π<i>rL</i> = (ρ/2π<i>L</i>) ln(<i>b</i>/<i>a</i>) = ${p(P2.R * 1e5, 2)} × 10<sup>−5</sup> Ω</div><p>The area grows with <i>r</i>, so neither the inner area (${p(P2.nums[0], 2)}) nor the outer (${p(P2.nums[2], 2)}) is right.</p>` },
  ],
  3: [
    { q: `Two of the page’s bulbs (${RB} Ω each) are connected in <b>series</b> across the ${VB} V battery. The total power they use is`,
      choices: P3.nums.map(x => `${p(x, 1)} W`), answer: 2, nums: P3.nums,
      why: `<p>In series <i>R</i><sub>eq</sub> = ${2 * RB} Ω, so</p><div class="eq"><i>P</i> = Δ<i>V</i><sup>2</sup>/<i>R</i><sub>eq</sub> = ${VB}<sup>2</sup>/${2 * RB} = ${p(P3.P, 1)} W</div><p>Half of one bulb alone (${p(P3.nums[1], 1)} W): the current halves, and each bulb gets a quarter of its power (${p(P3.nums[3], 1)} W). In parallel they would use ${p(P3.nums[0], 1)} W.</p>` },
    { q: `The voltage across a ${RB} Ω resistor rises steadily from 0 to ${VB} V over ${P3b.T} s. The energy it turns to heat in that time is`,
      choices: P3b.nums.map(x => `${p(x, 1)} J`), answer: 1, nums: P3b.nums,
      why: `<p>With Δ<i>V</i> = (${VB}/${P3b.T})<i>t</i>, <i>P</i> = Δ<i>V</i><sup>2</sup>/<i>R</i> grows as <i>t</i><sup>2</sup>:</p><div class="eq"><i>E</i> = ∫<i>P dt</i> = ∫<sub>0</sub><sup><i>T</i></sup> (${VB}<i>t</i>/${P3b.T})<sup>2</sup>/${RB} <i>dt</i> = (${VB}<sup>2</sup>/${RB})·<i>T</i>/3 = ${p(P3b.E, 1)} J</div><p>Averaging <i>P</i> linearly (${p(P3b.nums[0], 1)} J) or using the average voltage (${p(P3b.nums[3], 1)} J) misses that <i>P</i> is quadratic in Δ<i>V</i>.</p>` },
  ],
  4: [
    { q: `The page’s battery (ℰ = ${EC} V, <i>r</i> = ${rC} Ω) drives a ${RL4} Ω bulb. The potential difference across the battery’s terminals is`,
      choices: P4.nums.map(x => `${p(x, 1)} V`), answer: 2, nums: P4.nums,
      why: `<div class="eq"><i>I</i> = ℰ/(<i>R</i> + <i>r</i>) = ${EC}/${RL4 + rC} = ${p(EC / (RL4 + rC), 1)} A, &nbsp; Δ<i>V</i> = ℰ − <i>Ir</i> = ${EC} − ${p(EC / (RL4 + rC) * rC, 1)} = ${p(P4.V, 1)} V</div><p>The emf is the terminal voltage only when no current flows; ${p(P4.nums[1], 1)} V is the drop <i>inside</i> the battery.</p>` },
    { q: `Now the bulb is fixed at <i>R</i> = ${RL4} Ω and you may choose the battery’s internal resistance <i>r</i> (same ℰ). Which <i>r</i> makes the bulb brightest?`,
      choices: [`<i>r</i> = ${2 * RL4} Ω`, `<i>r</i> = ${RL4} Ω, matching the load`, `<i>r</i> = ${RL4 / 2} Ω`, '<i>r</i> = 0'], answer: 3,
      why: `<p><i>P</i> = ℰ<sup>2</sup><i>R</i>/(<i>R</i> + <i>r</i>)<sup>2</sup>, and now <i>r</i> is the variable:</p><div class="eq"><i>dP</i>/<i>dr</i> = −2ℰ<sup>2</sup><i>R</i>/(<i>R</i> + <i>r</i>)<sup>3</sup> < 0</div><p>for every <i>r</i>, so <i>P</i> is largest at the smallest <i>r</i>: zero. <i>R</i> = <i>r</i> maximises the power when the <b>load</b> is varied with the battery fixed, not the other way round.</p>` },
  ],
  5: [
    { q: 'A fourth resistor is added in parallel with the page’s 2, 4 and 6 Ω on the ideal 9 V battery. What happens to (i) the current in the 2 Ω branch and (ii) the current from the battery?',
      choices: ['(i) increases; (ii) increases', '(i) stays the same; (ii) increases', '(i) decreases; (ii) increases', '(i) decreases; (ii) stays the same'], answer: 1,
      why: '<p>Each branch still spans the full 9 V, so the 2 Ω branch keeps 9/2 = 4.5 A. The new branch adds its own current, and the battery supplies the sum: more paths, lower <i>R</i><sub>eq</sub>, more total current. (With internal resistance the terminal voltage would sag and the branch current fall slightly.)</p>' },
    { q: `A bar made of uniform conductivity σ<sub>0</sub> would have resistance ${P5.R0} Ω end to end. Instead its conductivity rises linearly <b>across its width</b>, from σ<sub>0</sub> at one edge to 3σ<sub>0</sub> at the other. Its resistance end to end is`,
      choices: P5.nums.map(x => `${p(x, 2)} Ω`), answer: 2, nums: P5.nums,
      why: `<p>Lengthwise strips of width <i>dy</i> all span the same two ends: they are in <b>parallel</b>, so their conductances add:</p><div class="eq">1/<i>R</i> = ∫<sub>0</sub><sup><i>w</i></sup> σ(<i>y</i>)<i>t dy</i>/<i>L</i> = (σ<sub>0</sub><i>wt</i>/<i>L</i>)·∫<sub>0</sub><sup>1</sup>(1 + 2<i>u</i>) <i>du</i> = 2/<i>R</i><sub>0</sub></div><p><i>R</i> = ${P5.R0}/2 = ${p(P5.R, 2)} Ω. Adding the strips as if in series gives (ln 3/2)<i>R</i><sub>0</sub> = ${p(P5.nums[0], 2)} Ω.</p>` },
  ],
  6: [
    { q: `In the page’s combination (9 V; R<sub>1</sub> = 2 Ω, R<sub>3</sub> = 2 Ω, R<sub>2</sub> + R<sub>4</sub> + R<sub>5</sub> = ${CB.R245} Ω), R<sub>3</sub> burns out (open). The current through R<sub>1</sub> becomes`,
      choices: P6.nums.map(x => `${p(x, 2)} A`), answer: 1, nums: P6.nums,
      why: `<p>With R<sub>3</sub> gone, R<sub>1</sub> and the ${CB.R245} Ω string are simply in series:</p><div class="eq"><i>I</i> = 9 V / (2 + ${CB.R245}) Ω = ${p(P6.I, 2)} A</div><p>Less than the ${p(P6.nums[0], 2)} A before: removing a parallel path <i>raises</i> <i>R</i><sub>eq</sub>.</p>` },
    { q: 'R<sub>3</sub> is replaced by a variable resistor <i>x</i>; everything else stays. For what <i>x</i> is the power in it largest?',
      choices: P6b.nums.map(x => `${p(x, 1)} Ω`), answer: 0, nums: P6b.nums,
      why: `<p>Seen from <i>x</i>, the rest is R<sub>1</sub> with the battery, in parallel with the ${CB.R245} Ω string. Its voltage with <i>x</i> removed is ℰ<sub>th</sub> = 9 × ${CB.R245}/${CB.R1 + CB.R245} = ${p(9 * CB.R245 / (CB.R1 + CB.R245), 1)} V, its resistance <i>R</i><sub>th</sub> = 2 × ${CB.R245}/(2 + ${CB.R245}) = ${p(P6b.R, 1)} Ω. Then</p><div class="eq"><i>P</i>(<i>x</i>) = ℰ<sub>th</sub><sup>2</sup><i>x</i>/(<i>R</i><sub>th</sub> + <i>x</i>)<sup>2</sup>, &nbsp; <i>dP</i>/<i>dx</i> = 0 → <i>x</i> = <i>R</i><sub>th</sub> = ${p(P6b.R, 1)} Ω</div><p>R<sub>1</sub> alone (2 Ω) ignores that the ${CB.R245} Ω string also connects across <i>x</i>.</p>` },
  ],
  7: [
    { q: `In the page’s network the ${K7.E2} V battery is replaced by a plain wire. The current through the ${K7.E1} V battery (<i>I</i><sub>1</sub>) becomes`,
      choices: P7.nums.map(x => `${p(x, 0)} mA`), answer: 1, nums: P7.nums,
      why: `<p>With one battery left the network reduces: R<sub>3</sub> + R<sub>4</sub> = ${K7.R3 + K7.R4} Ω in parallel with R<sub>5</sub> = ${K7.R5} Ω gives ${p(R345, 3)} Ω, in series with R<sub>1</sub> + R<sub>2</sub> = ${K7.R1 + K7.R2} Ω:</p><div class="eq"><i>I</i><sub>1</sub> = ${K7.E1} V / ${p(K7.R1 + K7.R2 + R345, 3)} Ω = ${p(P7.I * 1e3, 0)} mA</div><p>Down from ${p(I1now * 1e3, 0)} mA: by superposition, the 6 V battery (+ end at the bottom) had been adding ${p((I1now - P7.I) * 1e3, 0)} mA to <i>I</i><sub>1</sub>. Treating R<sub>5</sub> as a short gives ${p(P7.nums[2], 0)} mA; leaving it out, ${p(P7.nums[3], 0)} mA.</p>` },
    { q: `Free response. In the page’s network, treat the second battery’s emf ℰ<sub>2</sub> (+ end at the bottom, as drawn) as a variable. Using the page’s two loop equations and <i>I</i><sub>1</sub> = <i>I</i><sub>2</sub> + <i>I</i><sub>3</sub>, find <i>dI</i><sub>3</sub>/<i>d</i>ℰ<sub>2</sub>, and the ℰ<sub>2</sub> for which <i>I</i><sub>3</sub> = 0.`,
      solution: `<p>Loop 1: 20<i>I</i><sub>1</sub> + 5<i>I</i><sub>2</sub> = 12. Loop 2: 40<i>I</i><sub>3</sub> − 5<i>I</i><sub>2</sub> = ℰ<sub>2</sub>. Put <i>I</i><sub>1</sub> = <i>I</i><sub>2</sub> + <i>I</i><sub>3</sub> into loop 1:</p><div class="eq">25<i>I</i><sub>2</sub> + 20<i>I</i><sub>3</sub> = 12 &nbsp;→&nbsp; <i>I</i><sub>2</sub> = (12 − 20<i>I</i><sub>3</sub>)/25</div><div class="eq">40<i>I</i><sub>3</sub> − (12 − 20<i>I</i><sub>3</sub>)/5 = ℰ<sub>2</sub> &nbsp;→&nbsp; <i>I</i><sub>3</sub> = (ℰ<sub>2</sub> + 2.4)/44</div><p>So <i>dI</i><sub>3</sub>/<i>d</i>ℰ<sub>2</sub> = 1/44 A/V = ${p(P7b.dI * 1e3, 1)} mA per volt: the circuit is linear, so this holds for every ℰ<sub>2</sub>. At ℰ<sub>2</sub> = 6 V, <i>I</i><sub>3</sub> = 8.4/44 = ${p(8.4 / 44, 3)} A, the page’s value. <i>I</i><sub>3</sub> = 0 at ℰ<sub>2</sub> = ${p(P7b.E2zero, 1)} V: a 2.4 V battery with its + end on <b>top</b>, which exactly balances the 12 V battery’s push across R<sub>5</sub>.</p>`, val: P7b },
  ],
  8: [
    { q: `In the page’s RC circuit (ℰ = ${ER} V, τ = <i>RC</i> = ${p(tau, 1)} s), starting empty, how long until the capacitor’s voltage reaches ${p(V8, 1)} V?`,
      choices: P8.nums.map(x => `${p(x, 2)} s`), answer: 1, nums: P8.nums,
      why: `<div class="eq">Δ<i>V</i><sub>C</sub> = ℰ(1 − e<sup>−<i>t</i>/τ</sup>) &nbsp;→&nbsp; <i>t</i> = −τ ln(1 − Δ<i>V</i><sub>C</sub>/ℰ) = ${p(tau, 1)} s × ln ${p(ER / (ER - V8), 0)} = ${p(P8.t, 2)} s</div><p>Not linear (${p(P8.nums[2], 2)} s): the charging slows as the capacitor fills. One τ only reaches 63 % of ${ER} V.</p>` },
    { q: 'Now the full capacitor discharges through <i>R</i>. What fraction of its stored energy has become heat in <i>R</i> after one time constant?',
      choices: P8b.nums.map(x => `${p(x, 1)} %`), answer: 1, nums: P8b.nums,
      why: `<p>The current is <i>I</i><sub>0</sub>e<sup>−<i>t</i>/τ</sup>, so the power <i>I</i><sup>2</sup><i>R</i> decays twice as fast:</p><div class="eq"><i>E</i> = ∫<sub>0</sub><sup>τ</sup> <i>I</i><sub>0</sub><sup>2</sup><i>R</i> e<sup>−2<i>t</i>/τ</sup> <i>dt</i> = ½<i>I</i><sub>0</sub><sup>2</sup><i>R</i>τ(1 − e<sup>−2</sup>) = <i>U</i><sub>0</sub>(1 − e<sup>−2</sup>)</div><p>(½<i>I</i><sub>0</sub><sup>2</sup><i>R</i>τ = <i>Q</i><sup>2</sup>/2<i>C</i> = <i>U</i><sub>0</sub>.) So ${p(P8b.f * 100, 1)} %. The charge has fallen to 36.8 %, but the energy goes as <i>q</i><sup>2</sup>: only e<sup>−2</sup> = ${p(Math.exp(-2) * 100, 1)} % is left.</p>` },
  ],
};
