// AP-style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here from model.js; checks.mjs recomputes each answer another way.
import * as M from './model.js';

const p3 = x => (x < 0 ? '−' : '') + Math.abs(x).toPrecision(3);   // 3 significant figures
const f = (x, n = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);
const dg = r => r * 180 / Math.PI;

// 0 · a faster throw
const H2 = (2 * M.VY0) ** 2 / (2 * M.G);
// 1 · caught on the way down, below the launch point
const DROP = 1.50, DIST1 = 2 * M.H + DROP;
// 2 · averages over the first 1.50 s
const T2 = 1.50, Y2 = M.y(T2), D2 = 2 * M.H - Y2;
// 3 · strobe gaps shrink by gτ²
const TAU = M.STROBE;
// 5 · speed at 3.00 m up
const Y5 = 3.00, V5 = Math.sqrt(M.VY0 ** 2 - 2 * M.G * Y5);
// 6 · twice the sideways speed
const R6 = 2 * M.VX * M.T;
// 7 · a faster car
const VC7 = 20.0, A7 = dg(Math.atan2(VC7, M.RAIN.vr));
// 8 · a stronger current, aimed straight across
const VW8 = 2.0;
// 9 · the fading pull, at 2.00 s
const T9 = 2.00, V9 = M.PULL.a0 * T9 - 0.5 * M.PULL.k * T9 ** 2;

export const PRACTICE = {
  0: [
    { q: `The ball is thrown straight up at ${f(2 * M.VY0, 1)} m/s instead of ${f(M.VY0)} m/s. How high does it rise? (No air resistance.)`,
      choices: [`${p3(2 * M.H)} m`, `${p3(Math.SQRT2 * M.H)} m`, `${p3(H2)} m`, `${p3(8 * M.H)} m`], answer: 2,
      why: `<p>At the top <i>v</i> = 0, so <i>h</i> = <i>v</i><sub>0</sub>²/2<i>g</i>. Height goes as the <b>square</b> of the launch speed: doubling <i>v</i><sub>0</sub> gives 4 × ${f(M.H)} m.</p><div class="eq"><i>h</i> = (${f(2 * M.VY0, 1)})² / (2 × ${f(M.G)}) = ${p3(H2)} m</div><p>${p3(2 * M.H)} m assumes height is proportional to speed.</p>` },
    { q: 'At the instant the ball is at its highest point, its acceleration is',
      choices: ['zero', `${f(M.G)} m/s² downward`, `${f(M.G)} m/s² upward`, 'undefined, because it is changing direction'], answer: 1,
      why: `<p>Gravity is the only force at every instant, so <i>a</i> = <i>g</i> = ${f(M.G)} m/s² down the whole flight. At the top the <b>velocity</b> is zero, but it is still changing: a moment later it points down.</p>` },
  ],
  1: [
    { q: `A ball is thrown straight up at ${f(M.VY0)} m/s from a ledge and caught on the way down ${f(DROP)} m <b>below</b> the launch point. What total distance did it travel?`,
      choices: [`${p3(DROP)} m`, `${p3(2 * M.H - DROP)} m`, `${p3(M.H + DROP)} m`, `${p3(DIST1)} m`], answer: 3,
      why: `<p>Distance adds up every leg of the path. It rises <i>h</i> = <i>v</i><sub>0</sub>²/2<i>g</i> = ${f(M.H)} m, falls ${f(M.H)} m back to the launch point, then ${f(DROP)} m more:</p><div class="eq">${f(M.H)} + ${f(M.H)} + ${f(DROP)} = ${p3(DIST1)} m</div><p>${p3(DROP)} m is the size of the <b>displacement</b> (−${f(DROP)} m, up positive), not the distance.</p>` },
    { q: 'For an object moving along a straight line, how does the size of its displacement compare with the distance it travels?',
      choices: ['They are always equal.', 'The displacement can be larger than the distance.', 'The displacement is never larger; they are equal only if the object never reverses.', 'The displacement is always smaller than the distance.'], answer: 2,
      why: `<p>Distance counts every metre of path; displacement only the net change. Any reversal cancels part of the displacement but adds to the distance (the round trip: 0 m against ${f(2 * M.H)} m). With no reversal they are equal, so “always smaller” is wrong too.</p>` },
  ],
  2: [
    { q: `What is the ball’s average <b>speed</b> from launch to <i>t</i> = ${f(T2)} s? (It is thrown up at ${f(M.VY0)} m/s and tops out at ${f(M.H)} m at ${f(M.T / 2)} s.)`,
      choices: [`${p3(D2 / T2)} m/s`, `${p3(Y2 / T2)} m/s`, `${p3(M.H / T2)} m/s`, `${p3((M.VY0 + Math.abs(M.vy(T2))) / 2)} m/s`], answer: 0,
      why: `<p>Average speed = distance / time. At ${f(T2)} s the ball is at <i>y</i> = ${f(M.VY0)}(${f(T2)}) − ½(${f(M.G)})(${f(T2)})² = ${f(Y2, 3)} m, on the way down. Distance = up ${f(M.H)} m + down ${f(M.H - Y2, 3)} m = ${f(D2, 3)} m.</p><div class="eq">${f(D2, 3)} m / ${f(T2)} s = ${p3(D2 / T2)} m/s</div><p>${p3(Y2 / T2)} m/s is the average <b>velocity</b> (displacement / time).</p>` },
    { q: 'Compare the ball’s velocity just after it leaves the hand with its velocity just before it returns to the hand.',
      choices: ['They are the same.', 'The landing velocity is larger, because gravity has been acting longer.', 'Both are zero on average, so they cannot be compared.', 'Same speed, opposite directions.'], answer: 3,
      why: `<p>The motion is symmetric: +${f(M.VY0)} m/s at launch, −${f(M.VY0)} m/s at the same height coming down (<i>v</i>² = <i>v</i><sub>0</sub>² + 2<i>a</i>Δ<i>y</i> with Δ<i>y</i> = 0). Equal speeds, but velocity includes direction, so the velocities differ.</p>` },
  ],
  3: [
    { q: 'Take up as positive. During which part of the flight is the ball speeding up?',
      choices: ['Going up, because its velocity is positive', 'At the top, because its acceleration is largest there', 'Coming down, because v and a have the same sign', 'Never: a negative acceleration always slows an object'], answer: 2,
      why: `<p>Speeding up means <i>v</i> and <i>a</i> point the same way. <i>a</i> = −${f(M.G)} m/s² throughout; on the way down <i>v</i> is also negative, so the speed grows. A negative <i>a</i> slows the ball only while <i>v</i> is positive.</p>` },
    { q: `The strobe flashes every ${f(TAU, 3)} s. On the way up, by how much does each gap between successive images shrink compared with the one before?`,
      choices: [`${p3(0.5 * M.G * TAU ** 2)} m`, `${p3(M.G * TAU ** 2)} m`, `${p3(M.G * TAU)} m`, `${p3(2 * M.G * TAU ** 2)} m`], answer: 1,
      why: `<p>Each gap is the distance covered in one interval, <i>v</i>τ − ½<i>g</i>τ², where <i>v</i> is the speed at its start. From one gap to the next <i>v</i> drops by <i>g</i>τ, so the gap drops by (<i>g</i>τ)τ:</p><div class="eq">Δ(gap) = <i>g</i>τ² = ${f(M.G)} × (${f(TAU, 3)})² = ${p3(M.G * TAU ** 2)} m</div><p>The ½ belongs to a single gap, not to the difference between two.</p>` },
  ],
  4: [
    { q: `On the ball’s <i>v</i>–<i>t</i> graph (up positive, <i>v</i><sub>0</sub> = ${f(M.VY0)} m/s), what is the net area between the line and the time axis from 0 to ${f(T2)} s?`,
      choices: [`${p3(D2)} m`, `${p3(M.VY0 * T2)} m`, `${p3(M.H)} m`, `${p3(Y2)} m`], answer: 3,
      why: `<p>Area under <i>v</i>–<i>t</i> is displacement; area below the axis counts negative. Above the axis, a triangle to ${f(M.T / 2)} s: +½(${f(M.VY0)})(${f(M.T / 2)}) = +${f(M.H)} m. Below, from ${f(M.T / 2)} to ${f(T2)} s: −½(${f(T2 - M.T / 2)})(${f(-M.vy(T2))}) = −${f(M.H - Y2, 3)} m.</p><div class="eq">net = ${f(M.H)} − ${f(M.H - Y2, 3)} = ${p3(Y2)} m</div><p>${p3(D2)} m adds the part below the axis instead of subtracting it: that is the distance.</p>` },
    { q: 'At the instant the ball is at its highest point, which of these is zero?',
      choices: ['the slope of the <i>y</i>–<i>t</i> graph', 'the slope of the <i>v</i>–<i>t</i> graph', 'the value read off the <i>a</i>–<i>t</i> graph', 'the area under the <i>a</i>–<i>t</i> graph since launch'], answer: 0,
      why: `<p>The slope of <i>y</i>–<i>t</i> is the velocity, which is zero at the top. The slope of <i>v</i>–<i>t</i> and the <i>a</i>–<i>t</i> value are both −${f(M.G)} m/s². The area under <i>a</i>–<i>t</i> since launch is Δ<i>v</i> = −${f(M.VY0)} m/s, not zero.</p>` },
  ],
  5: [
    { q: `How fast is the ball moving when it is ${f(Y5)} m above the launch point? (<i>v</i><sub>0</sub> = ${f(M.VY0)} m/s up.)`,
      choices: [`${p3(Math.sqrt(M.VY0 ** 2 + 2 * M.G * Y5))} m/s`, `${p3(V5)} m/s`, `${p3(Math.sqrt(M.VY0 ** 2 - M.G * Y5))} m/s`, `${p3(V5 ** 2)} m/s`], answer: 1,
      why: `<p>No time is given or needed, so use the equation that leaves out <i>t</i>, with <i>a</i> = −${f(M.G)} m/s²:</p><div class="eq"><i>v</i>² = ${f(M.VY0)}² + 2(−${f(M.G)})(${f(Y5)}) = ${f(V5 ** 2)} m²/s², &nbsp;<i>v</i> = ${p3(V5)} m/s</div><p>${p3(Math.sqrt(M.VY0 ** 2 + 2 * M.G * Y5))} m/s comes from taking <i>a</i> as +<i>g</i>: the ball must be slower up there, not faster. (It passes ${f(Y5)} m twice, at this same speed.)</p>` },
    { q: `You want the time for the ball to first reach ${f(Y5)} m, knowing only <i>v</i><sub>0</sub>, <i>a</i> and Δ<i>y</i>. Which equation gets it in one step?`,
      choices: ['<i>v</i> = <i>v</i><sub>0</sub> + <i>at</i>', '<i>v</i>² = <i>v</i><sub>0</sub>² + 2<i>a</i>Δ<i>y</i>', 'Δ<i>y</i> = <i>v</i><sub>0</sub><i>t</i> + ½<i>at</i>²', 'Δ<i>y</i> = ½(<i>v</i><sub>0</sub> + <i>v</i>)<i>t</i>'], answer: 2,
      why: `<p>The unknown you don’t need is the final velocity <i>v</i>, so pick the equation that leaves out <i>v</i>: Δ<i>y</i> = <i>v</i><sub>0</sub><i>t</i> + ½<i>at</i>². It is quadratic in <i>t</i>; the smaller root is the way up. The other three either contain <i>v</i> or contain no <i>t</i>.</p>` },
  ],
  6: [
    { q: `The second ball leaves with ${f(M.VX)} m/s sideways and ${f(M.VY0)} m/s up. What is its speed at the top of its path?`,
      choices: ['0 m/s', `${p3(M.VY0)} m/s`, `${p3(M.V0P)} m/s`, `${p3(M.VX)} m/s`], answer: 3,
      why: `<p>At the top only <i>v</i><sub>y</sub> is zero. Nothing acts sideways, so <i>v</i><sub>x</sub> stays ${f(M.VX)} m/s, and the speed is √(<i>v</i><sub>x</sub>² + 0²) = ${p3(M.VX)} m/s. “0 m/s” is true only for the ball thrown straight up.</p>` },
    { q: `Thrown again with the same ${f(M.VY0)} m/s upward but <b>twice</b> the sideways speed, ${f(2 * M.VX)} m/s, from level ground. How far away does it land?`,
      choices: [`${p3(M.RANGE)} m`, `${p3(R6)} m`, `${p3(4 * M.RANGE)} m`, `${p3(Math.SQRT2 * M.RANGE)} m`], answer: 1,
      why: `<p>The time in the air depends only on the vertical motion: <i>t</i> = 2<i>v</i><sub>0y</sub>/<i>g</i> = ${f(M.T)} s, unchanged. The horizontal motion is uniform:</p><div class="eq">Δ<i>x</i> = <i>v</i><sub>x</sub><i>t</i> = ${f(2 * M.VX)} × ${f(M.T)} = ${p3(R6)} m</div><p>${p3(4 * M.RANGE)} m would follow from doubling the whole launch speed, which also doubles the time.</p>` },
  ],
  7: [
    { q: `Rain falls straight down at ${f(M.RAIN.vr, 1)} m/s. The car speeds up to ${f(VC7, 1)} m/s. At what angle from vertical do the streaks slant, seen from the car?`,
      choices: [`${p3(dg(Math.atan2(M.RAIN.vr, VC7)))}°`, `${p3(M.RAIN_ANGLE)}°`, `${p3(A7)}°`, `${p3(dg(Math.atan2(M.RAIN.vr, M.RAIN.vc)))}°`], answer: 2,
      why: `<p><i>v</i><sub>RC</sub> = <i>v</i><sub>RG</sub> + <i>v</i><sub>GC</sub>: ${f(M.RAIN.vr, 1)} m/s down plus ${f(VC7, 1)} m/s backward, at right angles. From vertical, the opposite side is the horizontal part:</p><div class="eq">tan θ = ${f(VC7, 1)} / ${f(M.RAIN.vr, 1)}, &nbsp;θ = ${p3(A7)}°</div><p>${p3(dg(Math.atan2(M.RAIN.vr, VC7)))}° is the angle from the <b>horizontal</b>.</p>` },
    { q: `To a passenger in the car moving forward at ${f(M.RAIN.vc, 1)} m/s, what is the velocity of the road?`,
      choices: [`${f(M.RAIN.vc, 1)} m/s backward`, `${f(M.RAIN.vc, 1)} m/s forward`, 'zero: the road is the reference', `${f(M.vlen(M.V_RC))} m/s, slanted`], answer: 0,
      why: `<p>Swapping the letters flips the vector: <i>v</i><sub>GC</sub> = −<i>v</i><sub>CG</sub>. The car moves ${f(M.RAIN.vc, 1)} m/s forward relative to the road, so the road moves ${f(M.RAIN.vc, 1)} m/s backward relative to the car. Which object is the reference is a choice, not a fact.</p>` },
  ],
  8: [
    { q: `The current rises to ${f(VW8, 1)} m/s. The boat still does ${f(M.RIVER.vb, 1)} m/s through the water, aimed straight across the ${M.RIVER.w} m river. How long does it take to cross?`,
      choices: [`${p3(M.RIVER.w / Math.hypot(M.RIVER.vb, VW8))} s`, `${p3(M.RIVER.w / Math.sqrt(M.RIVER.vb ** 2 - VW8 ** 2))} s`, `${p3(M.RIVER.w / (M.RIVER.vb + VW8))} s`, `${p3(M.RIVER.w / M.RIVER.vb)} s`], answer: 3,
      why: `<p>Only the across part of the velocity carries the boat to the far bank, and the current has no across part. So</p><div class="eq"><i>t</i> = <i>w</i> / <i>v</i><sub>b</sub> = ${M.RIVER.w} / ${f(M.RIVER.vb, 1)} = ${p3(M.RIVER.w / M.RIVER.vb)} s</div><p>the same as before; the stronger current only carries it farther downstream (${f(VW8 * M.RIVER.w / M.RIVER.vb, 1)} m). Dividing by the full speed ${f(Math.hypot(M.RIVER.vb, VW8))} m/s uses the slanted path’s speed for a straight-across distance.</p>` },
    { q: `Back at a ${f(M.RIVER.vw, 1)} m/s current: how far upstream of straight across must the ${f(M.RIVER.vb, 1)} m/s boat point to land directly opposite?`,
      choices: [`${p3(dg(Math.atan(M.RIVER.vw / M.RIVER.vb)))}°`, `${p3(dg(M.AIM_UP))}°`, `${p3(dg(Math.acos(M.RIVER.vw / M.RIVER.vb)))}°`, `${p3(dg(Math.atan(M.RIVER.vb / M.RIVER.vw)))}°`], answer: 1,
      why: `<p>The boat’s upstream part must cancel the current. The boat’s own velocity is the hypotenuse:</p><div class="eq"><i>v</i><sub>b</sub> sin θ = <i>v</i><sub>w</sub> &nbsp;→ sin θ = ${f(M.RIVER.vw, 1)} / ${f(M.RIVER.vb, 1)}, θ = ${p3(dg(M.AIM_UP))}°</div><p>tan θ = ${f(M.RIVER.vw, 1)}/${f(M.RIVER.vb, 1)} treats ${f(M.RIVER.vb, 1)} m/s as the across side, but that is the boat’s whole speed through the water.</p>` },
  ],
  9: [
    { q: `The car starts from rest with <i>a</i> = ${f(M.PULL.a0, 1)} − ${f(M.PULL.k, 1)}<i>t</i> (m/s², <i>t</i> in s). What is its speed at <i>t</i> = ${f(T9)} s?`,
      choices: [`${p3(M.PULL.a0 * T9 - M.PULL.k * T9 ** 2)} m/s`, `${p3(M.PULL.a0 * T9)} m/s`, `${p3(V9)} m/s`, `${p3(M.pa(T9))} m/s`], answer: 2,
      why: `<p><i>a</i> is not constant, so integrate:</p><div class="eq"><i>v</i>(<i>t</i>) = ∫<sub>0</sub><sup><i>t</i></sup> (${f(M.PULL.a0, 1)} − ${f(M.PULL.k, 1)}<i>t</i>′) d<i>t</i>′ = ${f(M.PULL.a0, 1)}<i>t</i> − ${f(M.PULL.k / 2)}<i>t</i>²</div><div class="eq"><i>v</i>(${f(T9)}) = ${f(M.PULL.a0 * T9, 1)} − ${f(M.PULL.k / 2 * T9 ** 2, 1)} = ${p3(V9)} m/s</div><p>${p3(M.PULL.a0 * T9 - M.PULL.k * T9 ** 2)} m/s forgets the ½ from integrating <i>t</i>; ${p3(M.PULL.a0 * T9)} m/s treats <i>a</i> as constant at ${f(M.PULL.a0, 1)} m/s².</p>` },
    { q: `For the same car (<i>a</i> = <i>a</i><sub>0</sub> − <i>kt</i> until it reaches zero, then 0; from rest at <i>x</i> = 0), show that it has gone <i>x</i><sub>1</sub> = <i>a</i><sub>0</sub>³/3<i>k</i>² when the acceleration reaches zero, and find where it is at <i>t</i> = 5.00 s.`,
      solution: `<p>1. <i>a</i> = 0 at <i>t</i><sub>1</sub> = <i>a</i><sub>0</sub>/<i>k</i> = ${f(M.T1)} s.</p><p>2. <i>v</i> = ∫<sub>0</sub><sup><i>t</i></sup><i>a</i> d<i>t</i>′ = <i>a</i><sub>0</sub><i>t</i> − ½<i>kt</i>², so <i>v</i><sub>1</sub> = <i>a</i><sub>0</sub>²/2<i>k</i> = ${f(M.V1, 1)} m/s.</p><p>3. <i>x</i> = ∫<sub>0</sub><sup><i>t</i></sup><i>v</i> d<i>t</i>′ = ½<i>a</i><sub>0</sub><i>t</i>² − <i>kt</i>³/6. At <i>t</i><sub>1</sub>:</p><div class="eq"><i>x</i><sub>1</sub> = <i>a</i><sub>0</sub>³/2<i>k</i>² − <i>a</i><sub>0</sub>³/6<i>k</i>² = <i>a</i><sub>0</sub>³/3<i>k</i>² = ${f(M.PULL.a0, 1)}³ / (3 × ${f(M.PULL.k, 1)}²) = ${f(M.X1, 1)} m</div><p>4. After <i>t</i><sub>1</sub>, <i>a</i> = 0, so <i>v</i> stays ${f(M.V1, 1)} m/s:</p><div class="eq"><i>x</i>(5.00) = ${f(M.X1, 1)} + ${f(M.V1, 1)} × (5.00 − ${f(M.T1)}) = ${f(M.px(5), 1)} m</div>` },
  ],
  10: [
    { q: `A particle moves as <i>x</i> = <i>t</i>³ − 3<i>t</i> (m, s). What is its acceleration at the instant its velocity is zero (<i>t</i> &gt; 0)?`,
      choices: [`${p3(M.ca(M.T_TURN))} m/s²`, '0 m/s²', `${p3(M.cx(M.T_TURN))} m/s²`, `${p3(3 * M.CUBE.A * M.T_TURN)} m/s²`], answer: 0,
      why: `<p><i>v</i> = d<i>x</i>/d<i>t</i> = 3<i>t</i>² − 3 = 0 at <i>t</i> = ${f(M.T_TURN)} s. <i>a</i> = d<i>v</i>/d<i>t</i> = 6<i>t</i> = ${p3(M.ca(M.T_TURN))} m/s².</p><p>Zero velocity does not mean zero acceleration: the particle is turning around, so its velocity is changing. (${p3(M.cx(M.T_TURN))} is its position there, in m.)</p>` },
    { q: 'A particle has <i>a</i> = 6<i>t</i> (m/s²), with <i>v</i>(0) = −3 m/s and <i>x</i>(0) = 0. Find <i>x</i>(<i>t</i>), the time <i>t</i> &gt; 0 when it is back at <i>x</i> = 0, and its velocity then.',
      solution: `<p>1. Integrate once: <i>v</i> = 3<i>t</i>² + <i>C</i><sub>1</sub>; <i>v</i>(0) = −3 gives <i>C</i><sub>1</sub> = −3.</p><p>2. Integrate again: <i>x</i> = <i>t</i>³ − 3<i>t</i> + <i>C</i><sub>2</sub>; <i>x</i>(0) = 0 gives <i>C</i><sub>2</sub> = 0.</p><p>3. <i>x</i> = <i>t</i>(<i>t</i>² − 3) = 0 at <i>t</i> = √3 = ${f(Math.sqrt(3))} s.</p><div class="eq"><i>v</i>(√3) = 3(3) − 3 = ${f(M.cv(Math.sqrt(3)))} m/s</div><p>It went left to <i>x</i> = −2 m at 1 s, then came back moving right, faster than it started.</p>` },
  ],
};
