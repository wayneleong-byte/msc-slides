// potential/practice.js — AP Physics C style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here; a quantitative item keeps its choices' numbers in `nums` (in the units shown),
// and checks.mjs recomputes the keyed one by another route.
import * as M from './model.js';

const p = (x, d) => x.toFixed(d);
const g = (x, n = 3) => x.toPrecision(n);
const s = x => (x < 0 ? '−' : x > 0 ? '+' : '') + Math.abs(x);   // signed, with a real minus
const K = M.K, nC = M.nC;

// ---- page 0: the page's pair brought from 40 cm to 10 cm ----
const { q1, q2, r0, r1 } = M.PAIR;
const P0 = { W: K * q1 * q2 * (1 / r1 - 1 / r0) };
P0.nums = [K * q1 * q2 / r1, P0.W, K * q1 * q2 / r1 ** 2 * (r0 - r1), K * q1 * q2 / (r0 - r1)].map(x => x * 1e6);   // from ∞ · right · F(r₁)Δr · 1/Δr
// ---- page 1: the page's square; charging a sphere ----
const P1 = { U: M.SQ.U, a: M.SQ.a, q: M.SQ.q };
P1.nums = [4 * K * P1.q ** 2 / P1.a, 2 * P1.U, P1.U, (4 + 2 * Math.SQRT2) * K * P1.q ** 2 / P1.a].map(x => x * 1e6);   // sides only · every pair twice · right · diagonal a/√2
const P1b = { Q: 2 * nC, R: 0.15 };
P1b.U = K * P1b.Q ** 2 / (2 * P1b.R);
P1b.nums = [2 * P1b.U, P1b.U / 2, P1b.U, P1b.U / P1b.R].map(x => x * 1e6);   // Q × final V · ¼ · right · extra 1/R
// ---- page 2: the page's A → C; E = 3x² ----
const P2 = { W: -M.UNI.q * (M.Vuni(M.UNI.C) - M.Vuni(M.UNI.A)) };
P2.L = Math.hypot(M.UNI.C[0] - M.UNI.A[0], M.UNI.C[2] - M.UNI.A[2]);
P2.nums = [-P2.W, 0, M.UNI.q * M.UNI.E * P2.L, P2.W].map(x => x * 1e9);   // sign · "path ⟂ somewhere" · full length · right
const P2b = { c: 3, x: 2 };
P2b.dV = -P2b.c * P2b.x ** 3 / 3;
P2b.nums = [-P2b.dV, -P2b.c * P2b.x ** 2 * P2b.x, P2b.dV, -P2b.c * P2b.x ** 2 * P2b.x / 2];   // sign · E(x)·x · right · mean of end fields
// ---- page 3: the page's hill where V = 90 V; V = 3x²y − y³ ----
const P3 = { V: 90 };
P3.r = K * M.HILL.Q / P3.V;
P3.E = P3.V / P3.r;
P3.nums = [P3.V, P3.E, P3.E / 2, 2 * P3.E];
const P3b = { x: 1, y: 2 };
P3b.Ex = -6 * P3b.x * P3b.y; P3b.Ey = -(3 * P3b.x ** 2 - 3 * P3b.y ** 2);
P3b.E = Math.hypot(P3b.Ex, P3b.Ey);
P3b.nums = [Math.abs(P3b.Ex) + Math.abs(P3b.Ey), Math.abs(P3b.Ex), P3b.E, Math.abs(P3b.Ey)];
// ---- page 4: the page's dipole at P ----
const P4 = { V: M.VdipAxis(M.DIP.axisX) };
P4.nums = [-P4.V, 0, P4.V, -2 * M.DIP.a * K * M.DIP.q / M.DIP.axisX ** 2];   // sign · bisector habit · right · far-field
// ---- page 5: the page's rod at a = 10 cm ----
const { L: rL, Q: rQ, lam: rlam } = M.ROD;
const P5 = { a: 0.10 };
P5.V = M.VrodAxis(P5.a);
P5.nums = [K * rQ / P5.a, K * rQ / (P5.a + rL / 2), K * rlam * Math.log10((P5.a + rL) / P5.a), P5.V];   // all at the end · all at the middle · log₁₀ · right
P5.E = K * rQ / (P5.a * (P5.a + rL));
P5.nums2 = [P5.E, P5.V / P5.a, K * rQ / P5.a ** 2, K * rlam / P5.a];   // right · V/a · point at the end · kλ/a
// ---- page 6: the page's ring at z = 20 cm; the half-ring's field at its centre ----
const P6 = { z: 0.20 };
P6.V = M.Vring(P6.z);
P6.nums = [K * M.RING.Q / P6.z, P6.V, K * M.RING.Q * P6.z / (M.RING.R ** 2 + P6.z ** 2) ** 1.5, K * M.RING.Q / M.RING.R];   // point · right · that's E · centre
const P6b = { E: 2 * K * M.ARC.Q / (Math.PI * M.ARC.R ** 2) };
P6b.nums = [K * M.ARC.Q / M.ARC.R ** 2, P6b.E / 2, P6b.E, 0];   // as a point · lost 2 · right · ring symmetry
// ---- page 7: the page's insulating sphere at R/2; two connected spheres ----
const P7 = { r: M.SPH.R / 2 };
P7.V = M.Vins(P7.r);
P7.nums = [K * M.SPH.Q / P7.r, P7.V, M.Vcond(P7.r), M.Vins(0)];   // point · right · conductor · centre
const P7b = { nums: [1 / 3, 3, 1, 1 / 9] };
// ---- page 8: the page's proton; an electron falling toward +1 nC ----
const P8 = { v: M.ACC.vp };
P8.nums = [Math.sqrt(M.E_CH * M.ACC.dV / M.M_P), M.speed(M.E_CH, M.ACC.Vhi, M.M_P), P8.v, M.speed(M.E_CH, M.ACC.dV, M.M_E)].map(v => v / 1e3);   // lost 2 · used 7 V · right · electron
const P8b = { Q: 1 * nC, ra: 0.10, rb: 0.05 };
P8b.dV = K * P8b.Q * (1 / P8b.rb - 1 / P8b.ra);
P8b.v = M.speed(M.E_CH, P8b.dV, M.M_E);
P8b.nums = [M.speed(M.E_CH, K * P8b.Q / P8b.rb, M.M_E), P8b.v, P8b.v / Math.SQRT2, M.speed(M.E_CH, P8b.dV, M.M_P)].map(v => v / 1e6);   // V at the end only · right · lost 2 · proton mass

const frac = x => ({ [1 / 3]: '1/3', 3: '3', 1: '1', [1 / 9]: '1/9' })[x];

export const PRACTICE = {
  0: [
    { q: `How much work must you do to bring the page’s +${q2 / nC} nC charge from ${p(r0 * 100, 0)} cm to ${p(r1 * 100, 0)} cm from the fixed +${q1 / nC} nC charge (starting and ending at rest)?`,
      choices: P0.nums.map(x => `${p(x, 3)} μJ`), answer: 1, nums: P0.nums,
      why: `<p>You push against <i>F</i> = <i>kq</i><sub>1</sub><i>q</i><sub>2</sub>/<i>r</i>², which grows as you go, so integrate:</p><div class="eq"><i>W</i> = −∫<sub><i>r</i><sub>0</sub></sub><sup><i>r</i><sub>1</sub></sup> <i>kq</i><sub>1</sub><i>q</i><sub>2</sub>/<i>r</i>² d<i>r</i> = <i>kq</i><sub>1</sub><i>q</i><sub>2</sub>(1/<i>r</i><sub>1</sub> − 1/<i>r</i><sub>0</sub>) = Δ<i>U</i> = ${p(P0.W * 1e6, 3)} μJ</div><p><i>kq</i><sub>1</sub><i>q</i><sub>2</sub>/<i>r</i><sub>1</sub> (${p(P0.nums[0], 3)} μJ) is the work from infinity, not from ${p(r0 * 100, 0)} cm.</p>` },
    { q: 'Two particles interact with potential energy <i>U</i>(<i>r</i>) = <i>A</i>/<i>r</i>² − <i>B</i>/<i>r</i> (<i>A</i>, <i>B</i> &gt; 0). At what separation is the force between them zero?',
      choices: ['<i>A</i>/<i>B</i>', '√(<i>A</i>/<i>B</i>)', '<i>B</i>/2<i>A</i>', '2<i>A</i>/<i>B</i>'], answer: 3,
      why: '<p><i>F</i> = −d<i>U</i>/d<i>r</i>, so set the slope to zero:</p><div class="eq">d<i>U</i>/d<i>r</i> = −2<i>A</i>/<i>r</i>³ + <i>B</i>/<i>r</i>² = 0 &nbsp;→&nbsp; <i>r</i> = 2<i>A</i>/<i>B</i></div><p><i>A</i>/<i>B</i> is where <i>U</i> = 0, not where its slope is. At 2<i>A</i>/<i>B</i> <i>U</i> has its minimum, so the separation is stable.</p>' },
  ],
  1: [
    { q: `The page’s four +${P1.q / nC} nC charges sit on the corners of a square of side ${p(P1.a * 100, 0)} cm. The electric potential energy of the group is`,
      choices: P1.nums.map(x => `${p(x, 3)} μJ`), answer: 2, nums: P1.nums,
      why: `<p>Six pairs: four sides at <i>a</i>, two diagonals at √2<i>a</i>.</p><div class="eq"><i>U</i> = 4<i>kq</i>²/<i>a</i> + 2<i>kq</i>²/√2<i>a</i> = (4 + √2)<i>kq</i>²/<i>a</i> = ${p(P1.U * 1e6, 3)} μJ</div><p>Summing <i>qV</i> over each charge counts every pair twice (${p(P1.nums[1], 3)} μJ); the diagonal is √2<i>a</i>, not <i>a</i>/√2.</p>` },
    { q: `A metal sphere of radius ${p(P1b.R * 100, 0)} cm is charged to ${p(P1b.Q / nC, 1)} nC by bringing tiny charges d<i>q</i> in from infinity. The total work needed is`,
      choices: P1b.nums.map(x => `${p(x, 3)} μJ`), answer: 2, nums: P1b.nums,
      why: `<p>When the sphere holds <i>q</i> its potential is <i>kq</i>/<i>R</i>, and bringing d<i>q</i> costs (<i>kq</i>/<i>R</i>) d<i>q</i>:</p><div class="eq"><i>W</i> = ∫<sub>0</sub><sup><i>Q</i></sup> (<i>kq</i>/<i>R</i>) d<i>q</i> = <i>kQ</i>²/2<i>R</i> = ${p(P1b.U * 1e6, 3)} μJ</div><p><i>Q</i> × the final potential (${p(P1b.nums[0], 3)} μJ) charges every d<i>q</i> the full price; early ones met almost no repulsion.</p>` },
  ],
  2: [
    { q: `On the page, a +${M.UNI.q / nC} nC charge moves from A to C in the uniform ${M.UNI.E} N/C field, where <i>V</i><sub>C</sub> − <i>V</i><sub>A</sub> = −10 V. The work done on it by the field is`,
      choices: P2.nums.map(x => `${s(+p(x, 1))} nJ`), answer: 3, nums: P2.nums,
      why: `<div class="eq"><i>W</i><sub>field</sub> = −Δ<i>U</i> = −<i>q</i>Δ<i>V</i> = −(${M.UNI.q / nC} nC)(−10 V) = +${p(P2.W * 1e9, 1)} nJ</div><p>Path doesn’t matter: only the ${p(M.UNI.C[0] * 100, 0)} cm along <b>E</b> counts, not the ${p(P2.L * 100, 1)} cm straight path (${p(P2.nums[2], 1)} nJ). A + charge moving with <b>E</b> loses <i>U</i>, so the field does positive work.</p>` },
    { q: `A field points along +<i>x</i> with <i>E</i> = ${P2b.c}<i>x</i>² (N/C, <i>x</i> in m). <i>V</i>(${P2b.x} m) − <i>V</i>(0) is`,
      choices: P2b.nums.map(x => `${s(x)} V`), answer: 2, nums: P2b.nums,
      why: `<div class="eq">Δ<i>V</i> = −∫<sub>0</sub><sup>${P2b.x}</sup> ${P2b.c}<i>x</i>² d<i>x</i> = −<i>x</i>³ |<sub>0</sub><sup>${P2b.x}</sup> = ${s(P2b.dV)} V</div><p>Moving with <b>E</b>, <i>V</i> falls, so the answer is negative. <i>E</i>(${P2b.x}) × ${P2b.x} m = ${-P2b.nums[1]} V treats the largest field as if it held all the way.</p>` },
  ],
  3: [
    { q: `On the page’s hill (+${M.HILL.Q / nC} nC), at the point where <i>V</i> = ${P3.V} V, the field has magnitude`,
      choices: P3.nums.map(x => `${p(x, 0)} N/C`), answer: 1, nums: P3.nums,
      why: `<p>First the distance: <i>r</i> = <i>kQ</i>/<i>V</i> = ${p(K * M.HILL.Q, 2)}/${P3.V} = ${p(P3.r * 100, 2)} cm. Then the slope:</p><div class="eq"><i>E</i> = −d<i>V</i>/d<i>r</i> = <i>kQ</i>/<i>r</i>² = <i>V</i>/<i>r</i> = ${p(P3.E, 0)} N/C</div><p><i>V</i> and <i>E</i> have different units and sizes: ${P3.V} V is the height of the hill, ${p(P3.E, 0)} N/C its steepness.</p>` },
    { q: 'In a region <i>V</i>(<i>x</i>, <i>y</i>) = 3<i>x</i>²<i>y</i> − <i>y</i>³ (volts, metres). The magnitude of <b>E</b> at (1 m, 2 m) is',
      choices: P3b.nums.map(x => `${p(x, 1)} N/C`), answer: 2, nums: P3b.nums,
      why: `<p><b>E</b> = −∇<i>V</i>, component by component:</p><div class="eq"><i>E<sub>x</sub></i> = −∂<i>V</i>/∂<i>x</i> = −6<i>xy</i> = ${s(P3b.Ex)} N/C, &nbsp;<i>E<sub>y</sub></i> = −(3<i>x</i>² − 3<i>y</i>²) = ${s(P3b.Ey)} N/C</div><div class="eq">|<b>E</b>| = √(${P3b.Ex ** 2} + ${P3b.Ey ** 2}) = ${p(P3b.E, 1)} N/C</div><p>Components add as vectors, not as numbers (${p(P3b.nums[0], 1)}).</p>` },
  ],
  4: [
    { q: `For the page’s dipole (+${M.DIP.q / nC} nC at <i>x</i> = −${p(M.DIP.a * 100, 0)} cm, −${M.DIP.q / nC} nC at +${p(M.DIP.a * 100, 0)} cm), the potential at P, <i>x</i> = ${p(M.DIP.axisX * 100, 0)} cm on the axis, is`,
      choices: P4.nums.map(x => `${x === 0 ? '0' : s(+p(x, 1))} V`), answer: 2, nums: P4.nums,
      why: `<p>Add the two <i>kq</i>/<i>r</i> with their signs:</p><div class="eq"><i>V</i> = <i>kq</i>/${p((M.DIP.axisX + M.DIP.a), 2)} − <i>kq</i>/${p((M.DIP.axisX - M.DIP.a), 2)} = ${p(K * M.DIP.q / (M.DIP.axisX + M.DIP.a), 1)} − ${p(K * M.DIP.q / (M.DIP.axisX - M.DIP.a), 1)} = ${s(+p(P4.V, 1))} V</div><p>P is nearer the − charge, so <i>V</i> &lt; 0. <i>V</i> = 0 holds on the bisector, not here; the far-field −2<i>akq</i>/<i>x</i>² (${p(P4.nums[3], 1)} V) needs <i>x</i> ≫ <i>a</i>.</p>` },
    { q: 'Far out on that dipole’s axis, on the side of the −<i>q</i> charge, <i>V</i> ≈ −2<i>akq</i>/<i>x</i>². The field there is',
      choices: ['4<i>akq</i>/<i>x</i>³, pointing away from the dipole', '2<i>akq</i>/<i>x</i>³, pointing toward the dipole', '4<i>akq</i>/<i>x</i>³, pointing toward the dipole', '2<i>akq</i>/<i>x</i>², pointing away from the dipole'], answer: 2,
      why: '<div class="eq"><i>E<sub>x</sub></i> = −d<i>V</i>/d<i>x</i> = −d/d<i>x</i>(−2<i>akq x</i><sup>−2</sup>) = −4<i>akq</i>/<i>x</i>³</div><p>Negative: toward −<i>x</i>, back toward the dipole. That fits: the nearer −<i>q</i> pulls a positive test charge in harder than the farther +<i>q</i> pushes it out. <b>E</b> points from high to low <i>V</i>, and <i>V</i> is lower (more negative) closer in.</p>' },
  ],
  5: [
    { q: `The page’s rod (+${rQ / nC} nC over ${p(rL * 100, 0)} cm). The potential on its axis ${p(P5.a * 100, 0)} cm past one end is`,
      choices: P5.nums.map(x => `${p(x, 1)} V`), answer: 3, nums: P5.nums,
      why: `<div class="eq"><i>V</i> = ∫<sub><i>a</i></sub><sup><i>a</i>+<i>L</i></sup> <i>k</i>λ d<i>x</i>/<i>x</i> = <i>k</i>λ ln((<i>a</i> + <i>L</i>)/<i>a</i>) = ${p(K * rlam, 1)} × ln ${p((P5.a + rL) / P5.a, 0)} = ${p(P5.V, 1)} V</div><p>The integral of 1/<i>x</i> is the natural log; log₁₀ gives ${p(P5.nums[2], 1)} V. Putting all the charge at the middle (${p(P5.nums[1], 1)} V) only works far away.</p>` },
    { q: `From <i>V</i>(<i>a</i>) on that axis, the field ${p(P5.a * 100, 0)} cm past the end is`,
      choices: P5.nums2.map(x => `${p(x, 0)} N/C`), answer: 0, nums: P5.nums2,
      why: `<div class="eq"><i>E</i> = −d<i>V</i>/d<i>a</i> = −<i>k</i>λ[1/(<i>a</i> + <i>L</i>) − 1/<i>a</i>] = <i>kQ</i>/(<i>a</i>(<i>a</i> + <i>L</i>)) = ${p(P5.E, 0)} N/C</div><p>pointing away from the rod. <i>V</i>/<i>a</i> (${p(P5.nums2[1], 0)} N/C) would be right only for <i>V</i> ∝ 1/<i>a</i>; take the derivative.</p>` },
  ],
  6: [
    { q: `The page’s ring (+${M.RING.Q / nC} nC, <i>R</i> = ${p(M.RING.R * 100, 0)} cm). The potential on its axis ${p(P6.z * 100, 0)} cm from the centre is`,
      choices: P6.nums.map(x => `${p(x, 1)} V`), answer: 1, nums: P6.nums,
      why: `<p>Every d<i>q</i> is √(<i>R</i>² + <i>z</i>²) = ${p(Math.hypot(M.RING.R, P6.z) * 100, 0)} cm away, and <i>V</i> is a scalar, so no components:</p><div class="eq"><i>V</i> = <i>kQ</i>/√(<i>R</i>² + <i>z</i>²) = ${p(K * M.RING.Q, 2)}/${p(Math.hypot(M.RING.R, P6.z), 2)} = ${p(P6.V, 1)} V</div><p>${p(P6.nums[2], 1)} is the field <i>kQz</i>/(<i>R</i>² + <i>z</i>²)<sup>3/2</sup> in N/C; the cos factor belongs to <b>E</b>, not <i>V</i>.</p>` },
    { q: `The page’s half-ring (+${M.ARC.Q / nC} nC, <i>R</i> = ${p(M.ARC.R * 100, 0)} cm) has <i>V</i> = <i>kQ</i>/<i>R</i> at its centre. The <b>field</b> there has magnitude`,
      choices: P6b.nums.map(x => `${x ? p(x, 0) : '0'} N/C`), answer: 2, nums: P6b.nums,
      why: `<p>With λ = <i>Q</i>/π<i>R</i>, each d<i>q</i> = λ<i>R</i> dθ gives <i>k</i>λ dθ/<i>R</i>. Measure θ from the line of symmetry; the sideways parts cancel and the rest add:</p><div class="eq"><i>E</i> = ∫<sub>−π/2</sub><sup>π/2</sup> (<i>k</i>λ/<i>R</i>) cos θ dθ = 2<i>k</i>λ/<i>R</i> = 2<i>kQ</i>/π<i>R</i>² = ${p(P6b.E, 0)} N/C</div><p>Unlike <i>V</i>, <b>E</b> is not just <i>kQ</i>/<i>R</i>² (${p(P6b.nums[0], 0)} N/C): the pieces point different ways. It is zero only for a full ring.</p>` },
  ],
  7: [
    { q: `The page’s insulating sphere (+${M.SPH.Q / nC} nC spread evenly, <i>R</i> = ${p(M.SPH.R * 100, 0)} cm). The potential ${p(P7.r * 100, 0)} cm from its centre is`,
      choices: P7.nums.map(x => `${p(x, 1)} V`), answer: 1, nums: P7.nums,
      why: `<p>Walk in from infinity: −∫<i>E</i> d<i>r</i> outside gives <i>kQ</i>/<i>R</i>; inside, <i>E</i> = <i>kQr</i>/<i>R</i>³ adds more:</p><div class="eq"><i>V</i>(<i>r</i>) = <i>kQ</i>/<i>R</i> + ∫<sub><i>r</i></sub><sup><i>R</i></sup> <i>kQr</i>′/<i>R</i>³ d<i>r</i>′ = (<i>kQ</i>/<i>R</i>)(3/2 − <i>r</i>²/2<i>R</i>²) = ${p(P7.V, 1)} V</div><p><i>kQ</i>/<i>r</i> (${p(P7.nums[0], 1)} V) acts as if all the charge were inside <i>r</i>; ${p(P7.nums[2], 1)} V is the metal sphere, where <i>E</i> = 0 inside.</p>` },
    { q: 'Two metal spheres, radii <i>R</i><sub>1</sub> = 3<i>R</i><sub>2</sub>, are far apart and joined by a thin wire, then charged. The ratio of surface charge densities σ<sub>1</sub>/σ<sub>2</sub> is',
      choices: P7b.nums.map(frac), answer: 0, nums: P7b.nums,
      why: '<p>Joined, they are one conductor at one potential: <i>kQ</i><sub>1</sub>/<i>R</i><sub>1</sub> = <i>kQ</i><sub>2</sub>/<i>R</i><sub>2</sub>, so <i>Q</i><sub>1</sub>/<i>Q</i><sub>2</sub> = <i>R</i><sub>1</sub>/<i>R</i><sub>2</sub> = 3. Then</p><div class="eq">σ<sub>1</sub>/σ<sub>2</sub> = (<i>Q</i><sub>1</sub>/<i>R</i><sub>1</sub>²)/(<i>Q</i><sub>2</sub>/<i>R</i><sub>2</sub>²) = 3 × (1/3)² = 1/3</div><p>The big sphere holds more charge but spreads it thinner: charge crowds where a conductor is sharply curved.</p>' },
  ],
  8: [
    { q: `The page’s proton starts from rest at the ${M.ACC.Vhi} V plate and crosses to the ${M.ACC.Vlo} V plate. It arrives at`,
      choices: P8.nums.map(x => `${p(x, 1)} km/s`), answer: 2, nums: P8.nums,
      why: `<div class="eq"><i>e</i>Δ<i>V</i> = ½<i>mv</i>² &nbsp;→&nbsp; <i>v</i> = √(2<i>e</i>Δ<i>V</i>/<i>m</i><sub>p</sub>) = √(2 × ${M.E_CH.toExponential(2).replace('e-', ' × 10<sup>−')}</sup> × ${M.ACC.dV}/${M.M_P.toExponential(2).replace('e-', ' × 10<sup>−')}</sup>) = ${p(P8.v / 1e3, 1)} km/s</div><p>Only the <b>difference</b>, ${M.ACC.dV} V, counts, not the ${M.ACC.Vhi} V of the start plate. ${p(P8.nums[3], 0)} km/s is the electron’s speed for the same 6 eV.</p>` },
    { q: `An electron starts at rest ${p(P8b.ra * 100, 0)} cm from a fixed +${P8b.Q / nC} nC charge and is pulled in. Its speed when ${p(P8b.rb * 100, 0)} cm away is`,
      choices: P8b.nums.map(x => `${p(x, 2)} × 10<sup>6</sup> m/s`), answer: 1, nums: P8b.nums,
      why: `<p>The force grows as it falls in, so use energy, which already holds the integral ∫<i>F</i> d<i>r</i>:</p><div class="eq">Δ<i>V</i> = <i>kQ</i>(1/<i>r</i><sub>b</sub> − 1/<i>r</i><sub>a</sub>) = ${p(P8b.dV, 1)} V, &nbsp;<i>v</i> = √(2<i>e</i>Δ<i>V</i>/<i>m</i><sub>e</sub>) = ${p(P8b.v / 1e6, 2)} × 10<sup>6</sup> m/s</div><p>Using <i>V</i> at ${p(P8b.rb * 100, 0)} cm alone (${p(K * P8b.Q / P8b.rb, 0)} V) forgets that it started at ${p(K * P8b.Q / P8b.ra, 0)} V, not 0.</p>` },
  ],
};
