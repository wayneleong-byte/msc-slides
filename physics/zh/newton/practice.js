// AP-style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here from model.js; checks.mjs recomputes each answer another way.
import * as M from './model.js';

const p3 = x => (x < 0 ? '−' : '') + Math.abs(x).toPrecision(3);   // 3 significant figures
const f = (x, n = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);
const G = M.G, sin = d => Math.sin(d * Math.PI / 180), cos = d => Math.cos(d * Math.PI / 180);
const TG = M.TUG, BD = M.BOARD, DR = M.DRAG;

// 0 · pressing down on the resting block
const PRESS = 5.0;
// 1 · strings at 25°
const TH1 = 25;
// 2 · hanging in an elevator moving up at constant speed
const VEL2 = 3.0;
// 3 · more thrust
const THRUST3 = 2400;
// 4 · distance in the push time
const X4 = 0.5 * M.A1 * M.PUSH_T ** 2;
// 5 · the car at highway speed, same forward push
const V5 = 30, D5 = M.CAR.k * V5 ** 2, A5 = (M.CAR.F - D5) / M.CAR.m;
// 6 · an 8.0 N push at rest; a 12.0 N push while sliding
const P6 = 8.0, P6b = 12.0, A6 = (P6b - M.F_K) / M.M1;
// 7 · the push moved to B's side
const C7 = M.M1 * M.PUSH / (M.M1 + M.M2);
// 8 · where the skaters meet, measured from A's start
const MEET = TG.d0 * TG.mB / TG.M;
// 9 · a harder pull on the board
const F9 = 24, ACM9 = F9 / BD.M, ABOARD9 = (F9 - BD.f) / BD.Mb;
// 10 · down the slope; with friction
const V10 = Math.sqrt(2 * M.A_INC * M.INC_LEN), A10 = G * (sin(M.THETA_DEG) - M.MU_K * cos(M.THETA_DEG));
// 11 · half of terminal speed; drag when a = g/4
const THALF = DR.tau * Math.log(2), D11 = 0.75 * DR.W;
// 12 · distance fallen in 1.00 s
const T12 = 1.00, X12 = M.linDrag(T12).x;

export const PRACTICE = {
  0: [
    { q: `The ${f(M.M1, 1)} kg block rests on the floor while you press straight down on it with ${f(PRESS, 1)} N. What is the normal force from the floor?`,
      choices: [`${p3(M.W1 + PRESS)} N`, `${p3(M.W1)} N`, `${p3(M.W1 - PRESS)} N`, `${p3(PRESS)} N`], answer: 0,
      why: `<p>Free-body diagram: weight ${f(M.W1, 1)} N down, your push ${f(PRESS, 1)} N down, normal force up. The block stays at rest, so Σ<i>F</i> = 0:</p><div class="eq"><i>F</i><sub>N</sub> = <i>mg</i> + <i>F</i><sub>push</sub> = ${f(M.W1, 1)} + ${f(PRESS, 1)} = ${p3(M.W1 + PRESS)} N</div><p>The normal force is whatever the surface must supply; it equals <i>mg</i> only when nothing else pushes vertically.</p>` },
    { q: 'A block slides at constant velocity across a frictionless floor (no air resistance). Which forces belong on its free-body diagram?',
      choices: ['weight, normal force, and a forward force that keeps it moving', 'weight only', 'normal force and a forward force', 'weight and normal force only'], answer: 3,
      why: `<p>Only things touching the block (and gravity) exert forces on it. The floor gives a normal force; Earth gives the weight. Nothing pushes it forward: its velocity stays the same because the net force is zero, not because something drives it.</p>` },
  ],
  1: [
    { q: `The ${f(M.M1, 1)} kg block hangs at rest from two strings, each at ${TH1}° above the horizontal. What is the tension in each string?`,
      choices: [`${p3(M.W1 / (2 * cos(TH1)))} N`, `${p3(M.W1 / (2 * sin(TH1)))} N`, `${p3(M.W1 / sin(TH1))} N`, `${p3(M.W1 / 2)} N`], answer: 1,
      why: `<p>The horizontal parts cancel. The two vertical parts hold the weight up:</p><div class="eq">2<i>T</i> sin θ = <i>mg</i> &nbsp;→ <i>T</i> = ${f(M.W1, 1)} / (2 sin ${TH1}°) = ${p3(M.W1 / (2 * sin(TH1)))} N</div><p>The angle is measured from the horizontal, so the vertical part is <i>T</i> sin θ, not <i>T</i> cos θ. Each string carries more than half the weight, ${p3(M.W1 / 2)} N.</p>` },
    { q: 'The two strings are pulled flatter and flatter, toward horizontal, with the block still hanging at rest. What happens to the tension?',
      choices: ['It falls toward zero.', 'It stays at half the weight.', 'It grows without limit; perfectly horizontal strings are impossible.', 'It approaches the full weight.'], answer: 2,
      why: `<p><i>T</i> = <i>mg</i>/(2 sin θ). As θ → 0, sin θ → 0 and <i>T</i> → ∞. Horizontal strings would have no vertical part at all, so no finite tension could hold the block up.</p>` },
  ],
  2: [
    { q: `The ${f(M.M1, 1)} kg block hangs from a string inside an elevator that is moving <b>upward at a constant ${f(VEL2, 1)} m/s</b>. What is the tension in the string?`,
      choices: [`${p3(M.W1 + M.M1 * VEL2)} N`, `${p3(M.M1 * VEL2)} N`, `${p3(M.W1 - M.M1 * VEL2)} N`, `${p3(M.W1)} N`], answer: 3,
      why: `<p>Constant velocity means <i>a</i> = 0, so the block is in equilibrium: Σ<i>F</i> = <i>T</i> − <i>mg</i> = 0.</p><div class="eq"><i>T</i> = <i>mg</i> = ${f(M.M1, 1)} × ${f(G)} = ${p3(M.W1)} N</div><p>The speed never enters; a force changes velocity, it isn’t needed to keep it. (<i>mv</i> isn’t even a force.)</p>` },
    { q: 'A puck slides across frictionless ice at a steady speed. What is needed to keep it moving?',
      choices: ['Nothing; with zero net force its velocity stays the same.', 'A steady forward force equal to its weight', 'A forward force that slowly decreases', 'Its “force of inertia”, which wears off over time'], answer: 0,
      why: `<p>The first law: with Σ<i>F</i> = 0 the velocity stays constant, moving or not. Inertia is a property (resistance to changes in velocity), not a force, and it doesn’t wear off.</p>` },
  ],
  3: [
    { q: `The ${M.PLANE.m} kg plane is cruising level with drag ${M.PLANE.D} N. The pilot raises the thrust to ${THRUST3} N. Just after, before the drag changes, what is the plane’s acceleration?`,
      choices: [`${p3(THRUST3 / M.PLANE.m)} m/s²`, `${p3(M.PLANE.D / M.PLANE.m)} m/s²`, `${p3((THRUST3 - M.PLANE.D) / M.PLANE.m)} m/s²`, `${p3((THRUST3 + M.PLANE.D) / M.PLANE.m)} m/s²`], answer: 2,
      why: `<p>Lift still cancels weight. Along the flight path the net force is thrust minus drag:</p><div class="eq"><i>a</i> = (${THRUST3} − ${M.PLANE.D}) / ${M.PLANE.m} = ${p3((THRUST3 - M.PLANE.D) / M.PLANE.m)} m/s² forward</div><p>Using the thrust alone ignores the drag that still acts.</p>` },
    { q: `In steady level flight at ${M.PLANE.v} m/s, how does the forward thrust compare with the drag?`,
      choices: ['Thrust is larger, or the plane would slow down.', 'They are equal.', 'Thrust is larger by the plane’s weight.', 'Drag is larger, because the plane is moving.'], answer: 1,
      why: `<p>Constant velocity means zero net force (first law), so thrust = drag = ${M.PLANE.D} N. Thrust larger than drag would make the plane speed up, not merely keep moving.</p>` },
  ],
  4: [
    { q: `The ${f(M.PUSH, 1)} N push acts on the ${f(M.M1, 1)} kg block, from rest, on a frictionless surface. How far does it go in ${f(M.PUSH_T, 1)} s?`,
      choices: [`${p3(2 * X4)} m`, `${p3(0.5 * M.A2 * M.PUSH_T ** 2)} m`, `${p3(M.A1 * M.PUSH_T)} m`, `${p3(X4)} m`], answer: 3,
      why: `<p><i>a</i> = Σ<i>F</i>/<i>m</i> = ${f(M.PUSH, 1)}/${f(M.M1, 1)} = ${f(M.A1, 2)} m/s², constant, so</p><div class="eq">Δ<i>x</i> = ½<i>at</i>² = ½ × ${f(M.A1, 2)} × (${f(M.PUSH_T, 1)})² = ${p3(X4)} m</div><p>${p3(2 * X4)} m forgets the ½; ${p3(M.A1 * M.PUSH_T)} is the speed reached, in m/s.</p>` },
    { q: 'The net force on a cart is doubled and its mass is also doubled. Its acceleration becomes',
      choices: ['one quarter as large', 'the same', 'twice as large', 'four times as large'], answer: 1,
      why: `<p><i>a</i> = Σ<i>F</i>/<i>m</i> = (2Σ<i>F</i>)/(2<i>m</i>): the factors cancel.</p>` },
  ],
  5: [
    { q: 'A car speeds up on a level road. What external force pushes the car forward?',
      choices: ['the engine’s force on the car', 'the force of the tyres on the road', 'static friction from the road on the tyres', 'kinetic friction from the road on the tyres'], answer: 2,
      why: `<p>The engine is part of the car; internal forces can’t accelerate it. The tyres push back on the road and, by the third law, the road pushes the tyres forward. The tyre surface doesn’t slip on the road, so it is <b>static</b> friction. The tyres’ force on the road acts on the road, not the car.</p>` },
    { q: `With the same ${f(M.CAR.F / 1000, 1)} kN forward push from the road, the ${M.CAR.m} kg car reaches ${V5} m/s, where drag is ${f(D5, 0)} N. What is its acceleration then?`,
      choices: [`${p3(M.CAR.F / M.CAR.m)} m/s²`, `${p3(A5)} m/s²`, `${p3((M.CAR.F + D5) / M.CAR.m)} m/s²`, `${p3(D5 / M.CAR.m)} m/s²`], answer: 1,
      why: `<p>Drag points backward, against the motion:</p><div class="eq"><i>a</i> = (<i>F</i> − <i>F</i><sub>d</sub>)/<i>m</i> = (${M.CAR.F} − ${f(D5, 0)}) / ${M.CAR.m} = ${p3(A5)} m/s²</div><p>${p3(M.CAR.F / M.CAR.m)} m/s² ignores the drag, which is why real cars accelerate more slowly at speed.</p>` },
  ],
  6: [
    { q: `The ${f(M.M1, 1)} kg block sits on the rough floor (μ<sub>s</sub> = ${f(M.MU_S)}, μ<sub>k</sub> = ${f(M.MU_K)}). You push it sideways with ${f(P6, 1)} N. What is the friction force on it?`,
      choices: [`${p3(M.F_SMAX)} N`, `${p3(M.F_K)} N`, `${p3(P6)} N`, '0 N'], answer: 2,
      why: `<p>The limit is μ<sub>s</sub><i>F</i><sub>N</sub> = ${f(M.MU_S)} × ${f(M.FN, 1)} = ${f(M.F_SMAX)} N. ${f(P6, 1)} N is below it, so the block stays put and static friction is just what balances the push: ${p3(P6)} N. μ<sub>s</sub><i>F</i><sub>N</sub> is the <b>maximum</b>, not the value.</p>` },
    { q: `Once it is sliding, the push has grown to ${f(P6b, 1)} N. What is the block’s acceleration?`,
      choices: [`${p3((P6b - M.F_SMAX) / M.M1)} m/s²`, `${p3(P6b / M.M1)} m/s²`, `${p3((P6b + M.F_K) / M.M1)} m/s²`, `${p3(A6)} m/s²`], answer: 3,
      why: `<p>Sliding, so kinetic friction μ<sub>k</sub><i>mg</i> = ${f(M.F_K)} N acts backward:</p><div class="eq"><i>a</i> = (${f(P6b, 1)} − ${f(M.F_K)}) / ${f(M.M1, 1)} = ${p3(A6)} m/s²</div><p>Static friction’s ${f(M.F_SMAX)} N limit no longer applies once it slides.</p>` },
  ],
  7: [
    { q: `The same ${f(M.PUSH, 1)} N push is now applied to B (${f(M.M2, 1)} kg), pushing it into A (${f(M.M1, 1)} kg) on the frictionless floor. How hard do the blocks push on each other?`,
      choices: [`${p3(C7)} N`, `${p3(M.CONTACT)} N`, `${p3(M.PUSH)} N`, `${p3(M.PUSH / 2)} N`], answer: 0,
      why: `<p>Together: <i>a</i> = ${f(M.PUSH, 1)}/(${f(M.M1, 1)} + ${f(M.M2, 1)}) = ${f(M.A_PAIR, 2)} m/s². The contact force is the only horizontal force on A, so</p><div class="eq"><i>F</i><sub>BA</sub> = <i>m</i><sub>A</sub><i>a</i> = ${f(M.M1, 1)} × ${f(M.A_PAIR, 2)} = ${p3(C7)} N</div><p>Pushing the lighter block from behind needs only a small contact force; ${p3(M.CONTACT)} N was the answer with the push on A.</p>` },
    { q: 'The block rests on a table. What is the third-law partner of the block’s weight (Earth pulling the block down)?',
      choices: ['the table pushing the block up', 'the block pulling Earth up', 'the block pushing down on the table', 'the table pushing down on the floor'], answer: 1,
      why: `<p>A third-law pair is the same interaction seen from both sides: Earth pulls block, block pulls Earth, same size, opposite directions, on different objects. The table’s normal force also acts on the block, so it can’t be the partner, even though here it is equal in size.</p>` },
  ],
  8: [
    { q: `Skaters A (${TG.mA} kg) and B (${TG.mB} kg) stand ${f(TG.d0, 1)} m apart on frictionless ice and pull a light rope until they meet. How far from A’s starting point do they meet?`,
      choices: [`${p3(TG.d0 / 2)} m`, `${p3(TG.d0 * TG.mA / TG.M)} m`, `${p3(MEET)} m`, `${p3(TG.d0 * TG.mA / TG.mB)} m`], answer: 2,
      why: `<p>Only internal forces act horizontally, so the centre of mass stays put; they meet there. From A:</p><div class="eq"><i>x</i><sub>cm</sub> = (<i>m</i><sub>A</sub> · 0 + <i>m</i><sub>B</sub> · <i>d</i>) / (<i>m</i><sub>A</sub> + <i>m</i><sub>B</sub>) = ${TG.mB} × ${f(TG.d0, 1)} / ${TG.M} = ${p3(MEET)} m</div><p>The lighter skater moves farther. ${p3(TG.d0 * TG.mA / TG.M)} m swaps the masses.</p>` },
    { q: 'For the system of both skaters and the rope, which statement is true while they pull?',
      choices: ['The centre of mass moves toward the heavier skater.', 'The rope tension accelerates the system’s centre of mass.', 'The tensions on A and B cancel only if A and B have equal mass.', 'The centre of mass stays at rest, because the tensions are internal.'], answer: 3,
      why: `<p>The rope pulls A and B with equal and opposite forces, both inside the system, so they add to zero whatever the masses. Weight and normal force cancel. With Σ<i>F</i><sub>ext</sub> = 0, <i>a</i><sub>cm</sub> = 0, and it started at rest.</p>` },
  ],
  9: [
    { q: `The pull on the board rises to ${F9} N; the ${f(BD.m, 1)} kg block still slips on the ${f(BD.Mb, 1)} kg board (μ<sub>k</sub> = ${f(BD.mu_k)}). What is the block’s acceleration?`,
      choices: [`${p3(ACM9)} m/s²`, `${p3(BD.aBlock)} m/s²`, `${p3(BD.mu_s * G)} m/s²`, `${p3(ABOARD9)} m/s²`], answer: 1,
      why: `<p>The only horizontal force on the block is kinetic friction, μ<sub>k</sub><i>mg</i> = ${f(BD.f)} N, whatever the pull:</p><div class="eq"><i>a</i> = μ<sub>k</sub><i>g</i> = ${f(BD.mu_k)} × ${f(G)} = ${p3(BD.aBlock)} m/s²</div><p>The rope pulls the board, not the block. ${p3(ACM9)} m/s² is the centre of mass.</p>` },
    { q: `Same ${F9} N pull. What is the acceleration of the centre of mass of block + board?`,
      choices: [`${p3(F9 / BD.Mb)} m/s²`, `${p3(ABOARD9)} m/s²`, `${p3((F9 - BD.f) / BD.M)} m/s²`, `${p3(ACM9)} m/s²`], answer: 3,
      why: `<p>Friction between block and board is internal and cancels. The only horizontal external force is the pull:</p><div class="eq"><i>a</i><sub>cm</sub> = Σ<i>F</i><sub>ext</sub>/<i>M</i> = ${F9} / ${f(BD.M, 1)} = ${p3(ACM9)} m/s²</div><p>Check: (${f(BD.m, 1)} × ${f(BD.aBlock)} + ${f(BD.Mb, 1)} × ${f(ABOARD9)}) / ${f(BD.M, 1)} = ${f(ACM9)} m/s².</p>` },
  ],
  10: [
    { q: `The block slides from rest ${f(M.INC_LEN, 1)} m down the frictionless ${M.THETA_DEG}° slope. How fast is it going at the bottom?`,
      choices: [`${p3(Math.sqrt(2 * G * M.INC_LEN))} m/s`, `${p3(Math.sqrt(G * sin(M.THETA_DEG) * M.INC_LEN))} m/s`, `${p3(V10)} m/s`, `${p3(Math.sqrt(2 * G * cos(M.THETA_DEG) * M.INC_LEN))} m/s`], answer: 2,
      why: `<p>Along the slope <i>a</i> = <i>g</i> sin θ = ${f(M.A_INC)} m/s². From rest, with no time given:</p><div class="eq"><i>v</i> = √(2<i>aL</i>) = √(2 × ${f(M.A_INC)} × ${f(M.INC_LEN, 1)}) = ${p3(V10)} m/s</div><p>${p3(Math.sqrt(2 * G * M.INC_LEN))} m/s uses the full <i>g</i>, as if it fell ${f(M.INC_LEN, 1)} m straight down; cos θ is the part <b>into</b> the slope.</p>` },
    { q: `Now the slope is rough, μ<sub>k</sub> = ${f(M.MU_K)}. What is the acceleration of the block sliding down it?`,
      choices: [`${p3(M.A_INC)} m/s²`, `${p3(G * (sin(M.THETA_DEG) + M.MU_K * cos(M.THETA_DEG)))} m/s²`, `${p3(A10)} m/s²`, `${p3(G * (sin(M.THETA_DEG) - M.MU_K))} m/s²`], answer: 2,
      why: `<p>Friction is μ<sub>k</sub><i>F</i><sub>N</sub>, and on a slope <i>F</i><sub>N</sub> = <i>mg</i> cos θ. It points up the slope, against the sliding:</p><div class="eq"><i>a</i> = <i>g</i>(sin θ − μ<sub>k</sub> cos θ) = ${f(G)}(${f(sin(M.THETA_DEG), 3)} − ${f(M.MU_K)} × ${f(cos(M.THETA_DEG), 3)}) = ${p3(A10)} m/s²</div><p>${p3(G * (sin(M.THETA_DEG) - M.MU_K))} m/s² uses <i>F</i><sub>N</sub> = <i>mg</i>, true only on level ground.</p>` },
  ],
  11: [
    { q: `The ${f(DR.m, 2)} kg ball (<i>b</i> = ${f(DR.b)} kg/s) is released from rest. How long until it reaches half its terminal speed?`,
      choices: [`${p3(DR.tau / 2)} s`, `${p3(THALF)} s`, `${p3(DR.tau)} s`, `${p3(Math.log(2))} s`], answer: 1,
      why: `<p>From <i>m</i> d<i>v</i>/d<i>t</i> = <i>mg</i> − <i>bv</i>, separating and integrating gives <i>v</i> = <i>v</i><sub>t</sub>(1 − e<sup>−<i>t</i>/τ</sup>), τ = <i>m</i>/<i>b</i> = ${f(DR.tau)} s. Set <i>v</i> = <i>v</i><sub>t</sub>/2:</p><div class="eq">e<sup>−<i>t</i>/τ</sup> = ½ &nbsp;→ <i>t</i> = τ ln 2 = ${f(DR.tau)} × ${f(Math.log(2), 3)} = ${p3(THALF)} s</div><p>Speed doesn’t grow linearly, so it isn’t τ/2; and at τ it already has 63%.</p>` },
    { q: `For the same ball (<i>m</i> d<i>v</i>/d<i>t</i> = <i>mg</i> − <i>bv</i>, from rest), differentiate <i>v</i>(<i>t</i>) to find <i>a</i>(<i>t</i>). Then find the drag force at the instant <i>a</i> = <i>g</i>/4, and the time it happens.`,
      solution: `<p>1. <i>v</i> = <i>v</i><sub>t</sub>(1 − e<sup>−<i>t</i>/τ</sup>), so <i>a</i> = d<i>v</i>/d<i>t</i> = (<i>v</i><sub>t</sub>/τ) e<sup>−<i>t</i>/τ</sup> = <i>g</i> e<sup>−<i>t</i>/τ</sup>, since <i>v</i><sub>t</sub>/τ = (<i>mg</i>/<i>b</i>)(<i>b</i>/<i>m</i>) = <i>g</i>.</p><p>2. From the ODE, <i>ma</i> = <i>mg</i> − <i>F</i><sub>d</sub>. With <i>a</i> = <i>g</i>/4:</p><div class="eq"><i>F</i><sub>d</sub> = <i>mg</i> − <i>mg</i>/4 = ¾<i>mg</i> = ¾ × ${f(DR.W, 2)} = ${f(D11, 2)} N</div><p>3. e<sup>−<i>t</i>/τ</sup> = ¼ gives <i>t</i> = τ ln 4 = ${f(DR.tau)} × ${f(Math.log(4), 3)} = ${f(DR.tau * Math.log(4), 3)} s. Check: <i>v</i> = ¾<i>v</i><sub>t</sub> = ${f(0.75 * DR.vt)} m/s and <i>bv</i> = ${f(DR.b * 0.75 * DR.vt, 2)} N.</p>` },
  ],
  12: [
    { q: `How far has the ball (<i>v</i><sub>t</sub> = ${f(DR.vt)} m/s, τ = ${f(DR.tau)} s) fallen ${f(T12)} s after release from rest?`,
      choices: [`${p3(DR.vt * T12)} m`, `${p3(X12)} m`, `${p3(DR.vt * (T12 - DR.tau))} m`, `${p3(0.5 * G * T12 ** 2)} m`], answer: 1,
      why: `<p>Integrate the velocity:</p><div class="eq"><i>x</i> = ∫<sub>0</sub><sup><i>t</i></sup> <i>v</i><sub>t</sub>(1 − e<sup>−<i>t</i>′/τ</sup>) d<i>t</i>′ = <i>v</i><sub>t</sub>[<i>t</i> − τ(1 − e<sup>−<i>t</i>/τ</sup>)]</div><div class="eq">= ${f(DR.vt)} × [${f(T12)} − ${f(DR.tau)}(1 − e<sup>−${f(T12 / DR.tau, 1)}</sup>)] = ${p3(X12)} m</div><p>${p3(DR.vt * (T12 - DR.tau))} m is the late-time asymptote <i>v</i><sub>t</sub>(<i>t</i> − τ); at <i>t</i> = ${f(T12 / DR.tau, 1)}τ the e<sup>−<i>t</i>/τ</sup> term is not yet negligible. ${p3(0.5 * G * T12 ** 2)} m ignores drag.</p>` },
    { q: 'Two balls, one with 4 times the mass of the other but the same size and shape, fall to terminal speed. How many times larger is the heavier ball’s <i>v</i><sub>t</sub> under linear drag (<i>bv</i>) and under quadratic drag (<i>kv</i>²)?',
      choices: ['linear 2×, quadratic 4×', 'linear 4×, quadratic 4×', 'linear 2×, quadratic 2×', 'linear 4×, quadratic 2×'], answer: 3,
      why: `<p>At terminal speed drag = <i>mg</i>. Linear: <i>bv</i><sub>t</sub> = <i>mg</i>, <i>v</i><sub>t</sub> = <i>mg</i>/<i>b</i> ∝ <i>m</i>, so 4×. Quadratic: <i>kv</i><sub>t</sub>² = <i>mg</i>, <i>v</i><sub>t</sub> = √(<i>mg</i>/<i>k</i>) ∝ √<i>m</i>, so 2×. Same size and shape keeps <i>b</i> and <i>k</i> the same.</p>` },
  ],
};
