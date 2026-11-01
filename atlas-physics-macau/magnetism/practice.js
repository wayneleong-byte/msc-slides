// magnetism/practice.js — AP Physics C style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here; a quantitative item keeps its choices' numbers in `nums` (in the units shown),
// and checks.mjs recomputes the keyed one by another route.
import * as M from './model.js';

const p = (x, d) => x.toFixed(d);
const { MU0, QE, MP } = M;
const k2 = MU0 / (2 * Math.PI);                                       // μ₀/2π = 2×10⁻⁷ T·m/A

// ---- page 0: flux through a dome in a uniform field ----
const P0 = { B: 0.40, R: 0.050 };
P0.phi = P0.B * Math.PI * P0.R ** 2;
P0.nums = [P0.B * 2 * Math.PI * P0.R ** 2, 0, P0.phi, P0.B * 4 * Math.PI * P0.R ** 2].map(x => x * 1e3);   // dome's area · closed-surface zero · right · whole sphere
// ---- page 1: the force averaged over the page's sweep of θ ----
const F1 = M.RHR.Fmax;
const P1 = { avg: 2 / Math.PI * F1 };
P1.nums = [F1 / 2, P1.avg, F1, F1 / Math.SQRT2].map(x => x / 1e-14);    // linear in θ · right · peak · rms
// ---- page 2: a deuteron through the page's 200 V ----
const rp = M.CYC.r[1];
const P2 = { m: 2 * MP, V: M.CYC.dV[1] };
P2.r = Math.sqrt(2 * P2.m * QE * P2.V) / (QE * M.CYC.B);
P2.nums = [2 * rp, rp, rp / Math.SQRT2, P2.r].map(x => x * 100);       // r ∝ m · unchanged · upside down · right
// ---- page 3: the page's selector ----
const { E: SE, B: SB, v0 } = M.SEL;
const P3 = { v: 1.25 * v0 };
P3.F = QE * (P3.v * SB - SE);
P3.nums = [QE * SE, P3.F, QE * P3.v * SB, QE * (P3.v * SB + SE)].map(x => x / 1e-17);   // qE only · right · qvB only · added
const S0 = M.SEL.paths[0], s0 = S0[S0.length - 1];
const P3b = { vi: M.SEL.k[0] * v0, dy: +Math.abs(s0.p[1] * 100).toFixed(3) / 100 };   // the drop as shown, from the model's path
P3b.v = Math.sqrt(P3b.vi ** 2 + 2 * QE * SE * P3b.dy / MP);
P3b.nums = [P3b.vi, Math.sqrt(P3b.vi ** 2 - 2 * QE * SE * P3b.dy / MP), P3b.v, v0].map(x => x / 1e4);   // unchanged · sign · right · E/B
// ---- page 4: turning the page's loop over; a semicircular wire ----
const { mu, B: LB } = M.LOOP;
const P4 = { W: 2 * mu * LB };
P4.nums = [mu * LB, Math.PI * mu * LB, 0, P4.W];                      // only to 90° · τ_max × π · start = end? · right
const P4b = { I: 2.0, R: 0.10, B: 0.50 };
P4b.F = 2 * P4b.I * P4b.R * P4b.B;
P4b.nums = [Math.PI * P4b.I * P4b.R * P4b.B, P4b.F, 0, P4b.I * P4b.R * P4b.B];   // arc length · right · cancels · radius
// ---- page 5: inside the page's thick wire; the page's rectangle ----
const { I: AI, a: Aa } = M.AMP, r5 = 0.005;
const P5 = { B: MU0 * AI * r5 / (2 * Math.PI * Aa ** 2) };
P5.nums = [k2 * AI / r5, k2 * AI / Aa, k2 * AI * r5 ** 2 / Aa ** 3, P5.B].map(x => x * 1e6);   // outside formula · surface value · ∝ r² · right
const { a: Fa, c: Fc, b: Fb } = M.FLUX, area5 = Fb * Fc;
P5.fnums = [k2 * AI / (Fa + Fc / 2) * area5, k2 * AI / Fa * area5, M.FLUX.phi, k2 * AI / (Fa + Fc) * area5].map(x => x * 1e6);   // B at the middle · near side · right · far side
// ---- page 6: the page's ring on its axis; a semicircle with radial leads ----
const { R: RR, I: RI, Bc } = M.RING;
const P6 = { B: M.ringAxis(RR) };
P6.nums = [P6.B, Bc / 2, Bc, Bc / 4].map(x => x * 1e6);              // right · halved · centre · 1/z²
const P6b = { B: Bc / 2 };
P6b.nums = [Bc, Bc / 2 + k2 * RI / RR, P6b.B, k2 * RI / RR].map(x => x * 1e6);   // whole loop · leads added · right · leads only
// ---- page 7: a rod perpendicular to a long wire ----
const P7 = { I1: M.WIRES.I, I2: M.WIRES.I, r1: 0.05, r2: 0.25 };
P7.F = k2 * P7.I1 * P7.I2 * Math.log(P7.r2 / P7.r1);
const L7 = P7.r2 - P7.r1;
P7.nums = [P7.F, k2 * P7.I1 / ((P7.r1 + P7.r2) / 2) * P7.I2 * L7, k2 * P7.I1 / P7.r1 * P7.I2 * L7, k2 * P7.I1 / P7.r2 * P7.I2 * L7].map(x => x * 1e3);   // right · B at the middle · near end · far end
// ---- page 8: the page's toroid at 12 cm; the end of the page's solenoid ----
const { N: TN, I: TI, R0 } = M.TOR, r8 = 0.12;
const P8 = { B: MU0 * TN * TI / (2 * Math.PI * r8) };
P8.nums = [MU0 * TN * TI / (2 * Math.PI * M.TOR.a), 0, MU0 * TN * TI / (2 * Math.PI * R0), P8.B].map(x => x * 1e6);   // used the tube radius · "outside" · mean radius · right
const { L: SL, R: SR } = M.SOL;
const P8b = { B: M.SOL.B / 2 * SL / Math.hypot(SL, SR) };
P8b.nums = [P8b.B, M.SOL.B, M.SOL.B / 4, 0].map(x => x * 1e6);       // right · the long-solenoid value · quarter · "outside"

export const PRACTICE = {
  0: [
    { q: 'A closed box surrounds only the N end of the page’s bar magnet. The net magnetic flux out of the box is',
      choices: ['zero: as much flux enters as leaves', 'positive: field lines leave the N pole', 'negative: the field inside the magnet runs into the box', 'positive, and larger for a bigger box'], answer: 0,
      why: '<p>∮<b>B</b>·<i>d</i><b>A</b> = 0 through every closed surface: there are no magnetic charges. Lines leave through the outer faces, but just as many come in through the face that cuts the magnet, where the field inside runs from S to N, toward the N end. A pole is not a source of <b>B</b> the way a charge is of <b>E</b>.</p>' },
    { q: `A uniform ${p(P0.B, 2)} T field points straight up. An open hemispherical dome of radius ${p(P0.R * 100, 0)} cm sits on a flat table, dome up. The magnetic flux out through the curved surface is`,
      choices: P0.nums.map(x => `${p(x, 2)} mWb`), answer: 2, nums: P0.nums,
      why: `<p>Dome plus the flat disc beneath it is a closed surface, so their fluxes cancel: the flux out of the dome equals the flux in through the disc, <i>B</i>π<i>R</i><sup>2</sup>. Or integrate, with θ from the vertical:</p><div class="eq">Φ = ∫ <i>B</i> cos θ · 2π<i>R</i><sup>2</sup> sin θ <i>d</i>θ (0 to π/2) = <i>B</i>π<i>R</i><sup>2</sup> = ${p(P0.phi * 1e3, 2)} mWb</div><p><i>B</i> × 2π<i>R</i><sup>2</sup> (${p(P0.nums[0], 2)} mWb) ignores that <b>B</b> is not normal to most of the dome.</p>` },
  ],
  1: [
    { q: 'An electron moves in the +<i>x</i> direction through a uniform magnetic field that points in the +<i>y</i> direction. The magnetic force on it points',
      choices: ['in the +<i>z</i> direction', 'in the −<i>y</i> direction', 'nowhere: the force is zero', 'in the −<i>z</i> direction'], answer: 3,
      why: '<p><b>F</b> = <i>q</i><b>v</b> × <b>B</b>, and <i>x̂</i> × <i>ŷ</i> = +<i>ẑ</i>. The electron’s charge is negative, which flips it: −<i>z</i>. The force is never along <b>B</b>; it is perpendicular to both <b>v</b> and <b>B</b>.</p>' },
    { q: `On the page, θ between <b>v</b> and <b>B</b> sweeps at a steady rate from 0 to 180° for the proton (<i>F</i><sub>max</sub> = <i>qvB</i> = ${p(F1 / 1e-14, 2)} × 10<sup>−14</sup> N). The force magnitude averaged over the sweep is`,
      choices: P1.nums.map(x => `${p(x, 2)} × 10<sup>−14</sup> N`), answer: 1, nums: P1.nums,
      why: `<p>θ grows uniformly in time, so the time-average is the average over θ:</p><div class="eq">⟨<i>F</i>⟩ = (1/π) ∫<sub>0</sub><sup>π</sup> <i>qvB</i> sin θ <i>d</i>θ = (2/π)<i>qvB</i> = ${p(P1.avg / 1e-14, 2)} × 10<sup>−14</sup> N</div><p>Not half the peak (${p(P1.nums[0], 2)}): sin θ is not a straight line, it spends longer near its top.</p>` },
  ],
  2: [
    { q: `A deuteron (charge +<i>e</i>, mass 2<i>m</i><sub>p</sub>) is accelerated from rest through the page’s ${P2.V} V and enters the same ${p(M.CYC.B, 2)} T field, where the ${P2.V} V proton circles at <i>r</i> = ${p(rp * 100, 2)} cm. The deuteron’s radius is`,
      choices: P2.nums.map(x => `${p(x, 2)} cm`), answer: 3, nums: P2.nums,
      why: `<p>Same charge and Δ<i>V</i>, so the same kinetic energy <i>e</i>Δ<i>V</i>; then <i>mv</i> = √(2<i>m</i> · <i>e</i>Δ<i>V</i>) and</p><div class="eq"><i>r</i> = <i>mv</i>/<i>qB</i> = √(2<i>m</i>Δ<i>V</i>/<i>q</i>)/<i>B</i> ∝ √<i>m</i> &nbsp;→&nbsp; √2 × ${p(rp * 100, 2)} cm = ${p(P2.r * 100, 2)} cm</div><p>Twice the mass does not mean twice the radius (${p(P2.nums[0], 2)} cm): the deuteron is also slower, by √2.</p>` },
    { q: `Free response. A particle of charge <i>q</i> and mass <i>m</i> moves with velocity <b>v</b> perpendicular to a uniform field <b>B</b> = <i>B</i><i>ẑ</i>. Starting from Newton’s second law, write the differential equations for <i>v<sub>x</sub></i> and <i>v<sub>y</sub></i>, solve them, and find the period. Evaluate it for the page’s protons (<i>B</i> = ${p(M.CYC.B, 2)} T).`,
      solution: `<p><b>F</b> = <i>q</i><b>v</b> × <b>B</b> with <b>v</b> × <i>ẑ</i> = (<i>v<sub>y</sub></i>, −<i>v<sub>x</sub></i>, 0):</p><div class="eq"><i>m dv<sub>x</sub></i>/<i>dt</i> = <i>qBv<sub>y</sub></i>, &nbsp; <i>m dv<sub>y</sub></i>/<i>dt</i> = −<i>qBv<sub>x</sub></i></div><p>Differentiate the first and use the second: <i>d</i><sup>2</sup><i>v<sub>x</sub></i>/<i>dt</i><sup>2</sup> = −ω<sup>2</sup><i>v<sub>x</sub></i>, ω = <i>qB</i>/<i>m</i>. So</p><div class="eq"><i>v<sub>x</sub></i> = <i>v</i> cos ω<i>t</i>, &nbsp; <i>v<sub>y</sub></i> = −<i>v</i> sin ω<i>t</i></div><p>The speed stays <i>v</i>; integrating once more gives a circle of radius <i>v</i>/ω = <i>mv</i>/<i>qB</i>, traced clockwise seen from +<i>z</i> for <i>q</i> > 0. The period does not depend on <i>v</i>:</p><div class="eq"><i>T</i> = 2π/ω = 2π<i>m</i>/<i>qB</i> = 2π × 1.67×10<sup>−27</sup> / (1.60×10<sup>−19</sup> × ${p(M.CYC.B, 2)}) = ${p(M.CYC.T * 1e6, 3)} μs</div><p>That is why the 50 V and 200 V protons on the page meet again at the start every turn.</p>`, val: M.CYC.T },
  ],
  3: [
    { q: `In the page’s selector (<i>E</i> = ${p(SE, 0)} V/m down, <i>B</i> = ${p(SB, 3)} T into the page), a proton enters at 1.25<i>E</i>/<i>B</i> = ${p(P3.v / 1e5, 3)} × 10<sup>5</sup> m/s. The net force on it as it enters has magnitude`,
      choices: P3.nums.map(x => `${p(x, 1)} × 10<sup>−17</sup> N`), answer: 1, nums: P3.nums,
      why: `<p>The two forces are opposite: <i>qE</i> down, <i>qvB</i> up. Faster than <i>E</i>/<i>B</i>, the magnetic one wins:</p><div class="eq"><i>F</i> = <i>q</i>(<i>vB</i> − <i>E</i>) = 1.60×10<sup>−19</sup> × (${p(P3.v * SB, 0)} − ${p(SE, 0)}) = ${p(P3.F / 1e-17, 1)} × 10<sup>−17</sup> N, up</div><p>Adding them (${p(P3.nums[3], 1)}) misses that they point opposite ways; that is the whole point of the device.</p>` },
    { q: `The page’s slow proton enters at ${p(P3b.vi / 1e4, 1)} × 10<sup>4</sup> m/s and leaves the plates ${p(P3b.dy * 100, 3)} cm lower than it entered (toward the − plate). Its speed as it leaves is`,
      choices: P3b.nums.map(x => `${p(x, 2)} × 10<sup>4</sup> m/s`), answer: 2, nums: P3b.nums,
      why: `<p>Work is ∫<b>F</b>·<i>d</i><b>s</b>. The magnetic force is always ⊥ <i>d</i><b>s</b>, so it does none; the electric force does <i>qE</i>Δ<i>y</i> as the proton drops:</p><div class="eq">½<i>mv</i><sup>2</sup> = ½<i>mv</i><sub>i</sub><sup>2</sup> + <i>qE</i>Δ<i>y</i> &nbsp;→&nbsp; <i>v</i> = √(<i>v</i><sub>i</sub><sup>2</sup> + 2<i>qE</i>Δ<i>y</i>/<i>m</i>) = ${p(P3b.v / 1e4, 2)} × 10<sup>4</sup> m/s</div><p>It speeds up, falling toward lower potential. It does not reach <i>E</i>/<i>B</i> = ${p(v0 / 1e4, 1)} × 10<sup>4</sup> m/s; that is not a speed anything is driven toward.</p>` },
  ],
  4: [
    { q: `The page’s loop (μ = ${p(mu, 2)} A·m², <i>B</i> = ${p(LB, 2)} T) is turned slowly from θ = 0 (μ along <b>B</b>) to θ = 180°. The work done by whoever turns it is`,
      choices: P4.nums.map(x => `${p(x, 3)} J`), answer: 3, nums: P4.nums,
      why: `<p>Against the restoring torque μ<i>B</i> sin θ:</p><div class="eq"><i>W</i> = ∫<sub>0</sub><sup>π</sup> μ<i>B</i> sin θ <i>d</i>θ = 2μ<i>B</i> = ${p(P4.W, 3)} J</div><p>The same as Δ<i>U</i> = (−μ<i>B</i> cos 180°) − (−μ<i>B</i> cos 0) = 2μ<i>B</i>. Stopping at 90° gives only μ<i>B</i>; τ<sub>max</sub> × π (${p(P4.nums[1], 3)} J) treats the torque as constant.</p>` },
    { q: `A wire bent into a semicircle of radius ${p(P4b.R * 100, 0)} cm carries ${p(P4b.I, 1)} A in a uniform ${p(P4b.B, 2)} T field perpendicular to its plane. The net magnetic force on the semicircle is`,
      choices: P4b.nums.map(x => `${p(x, 3)} N`), answer: 1, nums: P4b.nums,
      why: `<p>Add <i>d</i><b>F</b> = <i>I d</i><b>s</b> × <b>B</b>. Since <b>B</b> is uniform, it comes out of the integral, and ∫<i>d</i><b>s</b> is just the straight vector from one end to the other, length 2<i>R</i>:</p><div class="eq"><i>F</i> = <i>I</i>(2<i>R</i>)<i>B</i> = ${P4b.I} × ${p(2 * P4b.R, 2)} × ${P4b.B} = ${p(P4b.F, 3)} N</div><p>The sideways parts of the pieces cancel, so the arc length π<i>R</i> (${p(P4b.nums[0], 3)} N) overcounts.</p>` },
  ],
  5: [
    { q: `The page’s wire (radius ${p(Aa * 100, 0)} cm, ${AI} A spread evenly over its cross-section). The field <b>inside</b> it, ${p(r5 * 1000, 0)} mm from the axis, is`,
      choices: P5.nums.map(x => `${p(x, 0)} μT`), answer: 3, nums: P5.nums,
      why: `<p>An Amperian circle of radius <i>r</i> < <i>a</i> encloses only the fraction <i>r</i><sup>2</sup>/<i>a</i><sup>2</sup> of the current:</p><div class="eq"><i>B</i>(2π<i>r</i>) = μ<sub>0</sub><i>I</i><i>r</i><sup>2</sup>/<i>a</i><sup>2</sup> &nbsp;→&nbsp; <i>B</i> = μ<sub>0</sub><i>Ir</i>/2π<i>a</i><sup>2</sup> = ${p(P5.B * 1e6, 0)} μT</div><p>μ<sub>0</sub><i>I</i>/2π<i>r</i> (${p(P5.nums[0], 0)} μT) counts current that is outside the circle.</p>` },
    { q: `The page’s rectangle (sides ${p(Fb * 100, 0)} cm parallel to the ${AI} A wire, the near side ${p(Fa * 100, 0)} cm away, ${p(Fc * 100, 0)} cm wide). The magnetic flux through it is`,
      choices: P5.fnums.map(x => `${p(x, 2)} μWb`), answer: 2, nums: P5.fnums,
      why: `<p><i>B</i> varies across the rectangle, so add strips <i>b dr</i>:</p><div class="eq">Φ = ∫<sub><i>a</i></sub><sup><i>a</i>+<i>c</i></sup> (μ<sub>0</sub><i>I</i>/2π<i>r</i>) <i>b dr</i> = (μ<sub>0</sub><i>Ib</i>/2π) ln(${p((Fa + Fc) / Fa, 0)}) = ${p(M.FLUX.phi * 1e6, 2)} μWb</div><p><i>B</i> at the middle × area gives ${p(P5.fnums[0], 2)} μWb: too low, since 1/<i>r</i> is curved and the near strips count more.</p>` },
  ],
  6: [
    { q: `The page’s loop (<i>R</i> = ${p(RR * 100, 0)} cm, <i>B</i> = ${p(Bc * 1e6, 1)} μT at its centre). On its axis, a distance <i>z</i> = <i>R</i> from the centre, the field is`,
      choices: P6.nums.map(x => `${p(x, 1)} μT`), answer: 0, nums: P6.nums,
      why: `<div class="eq"><i>B</i> = μ<sub>0</sub><i>IR</i><sup>2</sup>/2(<i>R</i><sup>2</sup> + <i>z</i><sup>2</sup>)<sup>3/2</sup> = (μ<sub>0</sub><i>I</i>/2<i>R</i>) · 1/2<sup>3/2</sup> = ${p(Bc * 1e6, 1)}/${p(2 ** 1.5, 3)} = ${p(P6.B * 1e6, 1)} μT</div><p>Not half: each piece is √2 farther away (1/<i>r</i><sup>2</sup> → ½) and only cos 45° of its d<b>B</b> lies along the axis (another 1/√2).</p>` },
    { q: `A wire carrying ${RI} A comes in along a straight lead pointing at the centre of a semicircle of radius ${p(RR * 100, 0)} cm, goes round the semicircle, and leaves along a lead pointing straight away from the centre. The field at the centre is`,
      choices: P6b.nums.map(x => `${p(x, 1)} μT`), answer: 2, nums: P6b.nums,
      why: `<p>On the straight leads, <i>d</i><b>l</b> is along <b>r̂</b>, so <i>d</i><b>l</b> × <b>r̂</b> = 0: they add nothing. On the arc every piece is ⊥ <b>r̂</b> at distance <i>R</i>:</p><div class="eq"><i>B</i> = (μ<sub>0</sub><i>I</i>/4π<i>R</i><sup>2</sup>) ∫<i>dl</i> = (μ<sub>0</sub><i>I</i>/4π<i>R</i><sup>2</sup>)(π<i>R</i>) = μ<sub>0</sub><i>I</i>/4<i>R</i> = ${p(P6b.B * 1e6, 1)} μT</div><p>Half a full loop. Counting the leads like half-infinite wires off to the side (${p(P6b.nums[1], 1)} μT) is the trap.</p>` },
  ],
  7: [
    { q: 'Two long parallel wires carry 20 A and 10 A in <b>opposite</b> directions. Compared with the force on the 20 A wire, the force on the 10 A wire is',
      choices: ['twice as large, and the wires attract', 'the same size, and the wires attract', 'the same size, and the wires repel', 'half as large, and the wires repel'], answer: 2,
      why: '<p><i>F</i>/<i>L</i> = μ<sub>0</sub><i>I</i><sub>1</sub><i>I</i><sub>2</sub>/2π<i>d</i> is symmetric in the two currents (Newton’s third law): equal sizes. Opposite currents repel. The 10 A wire sits in a field twice as strong, but carries half the current.</p>' },
    { q: `A straight rod lies <b>perpendicular</b> to a long wire, in the same plane, from ${p(P7.r1 * 100, 0)} cm to ${p(P7.r2 * 100, 0)} cm away. Both carry the page’s ${P7.I1} A. The magnetic force on the rod is`,
      choices: P7.nums.map(x => `${p(x, 3)} mN`), answer: 0, nums: P7.nums,
      why: `<p>The wire’s field is ⊥ the rod everywhere but weakens along it, so integrate <i>dF</i> = <i>I</i><sub>2</sub><i>B</i>(<i>r</i>) <i>dr</i>:</p><div class="eq"><i>F</i> = ∫<sub><i>r</i><sub>1</sub></sub><sup><i>r</i><sub>2</sub></sup> (μ<sub>0</sub><i>I</i><sub>1</sub>/2π<i>r</i>) <i>I</i><sub>2</sub> <i>dr</i> = (μ<sub>0</sub><i>I</i><sub>1</sub><i>I</i><sub>2</sub>/2π) ln(${p(P7.r2 / P7.r1, 0)}) = ${p(P7.F * 1e3, 3)} mN</div><p>Using <i>B</i> at the rod’s middle (${p(P7.nums[1], 3)} mN) undercounts the strong field near the wire.</p>` },
  ],
  8: [
    { q: `The page’s toroid (${TN} turns, ${TI} A; its core runs from ${p((R0 - M.TOR.a) * 100, 0)} to ${p((R0 + M.TOR.a) * 100, 0)} cm from the centre). The field inside the core at <i>r</i> = ${p(r8 * 100, 0)} cm is`,
      choices: P8.nums.map(x => `${p(x, 1)} μT`), answer: 3, nums: P8.nums,
      why: `<p>An Amperian circle of radius <i>r</i> inside the core links every turn once:</p><div class="eq"><i>B</i>(2π<i>r</i>) = μ<sub>0</sub><i>NI</i> &nbsp;→&nbsp; <i>B</i> = μ<sub>0</sub><i>NI</i>/2π<i>r</i> = 2×10<sup>−7</sup> × ${TN} × ${TI} / ${r8} = ${p(P8.B * 1e6, 1)} μT</div><p><i>B</i> depends on <i>r</i>: the mean radius ${p(R0 * 100, 0)} cm gives ${p(P8.nums[2], 1)} μT, the value at ${p(R0 * 100, 0)} cm only.</p>` },
    { q: `Summing rings of current along the page’s solenoid (<i>n</i> = ${p(M.SOL.n, 0)} turns/m, <i>I</i> = ${M.SOL.I} A, <i>L</i> = ${p(SL * 100, 0)} cm, <i>R</i> = ${p(SR * 100, 0)} cm) gives <i>B</i> = (μ<sub>0</sub><i>nI</i>/2)(cos θ<sub>1</sub> − cos θ<sub>2</sub>) on the axis. The field at the centre of one <b>end</b> is`,
      choices: P8b.nums.map(x => `${p(x, 1)} μT`), answer: 0, nums: P8b.nums,
      why: `<p>Each slice <i>dx</i> is a ring carrying <i>nI dx</i>; its axial field adds:</p><div class="eq"><i>B</i> = ∫<sub>0</sub><sup><i>L</i></sup> μ<sub>0</sub><i>nI R</i><sup>2</sup> <i>dx</i> / 2(<i>R</i><sup>2</sup> + <i>x</i><sup>2</sup>)<sup>3/2</sup> = (μ<sub>0</sub><i>nI</i>/2) · <i>L</i>/√(<i>L</i><sup>2</sup> + <i>R</i><sup>2</sup>) = ${p(P8b.B * 1e6, 1)} μT</div><p>Very nearly half of μ<sub>0</sub><i>nI</i> = ${p(M.SOL.B * 1e6, 1)} μT: from the end, the coil extends only one way.</p>` },
  ],
};
