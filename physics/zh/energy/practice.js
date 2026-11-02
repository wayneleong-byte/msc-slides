// energy/practice.js — AP-style practice, one or two questions per page (keys are page indices, as in PAGES).
// Every number is computed here from the model or from the givens; checks.mjs recomputes each answer another way.
import * as M from './model.js';

const G = M.G, D2R = Math.PI / 180;
const f = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);

// 0 · work: the page's pull, 20 N at 30°, over 3.0 m
const P = M.PULL, d0 = 3.0, W0 = P.F * d0 * Math.cos(P.th);
// 1 · the toss
const T = M.TOSS, Wup = -0.5 * T.m * T.v0 ** 2;
// 2 · the whirl, half a lap
const Wh = M.WHIRL, halfArc = Math.PI * Wh.r;
// 3 · the car over 12 m from rest
const C = M.CAR, d3 = 12, v3 = Math.sqrt(2 * C.F * d3 / C.m);
// 4 · the drop, 零 on the 1.0 m tabletop; speed 1.0 m above the ground
const Dr = M.DROP, y4 = 1.0, U4 = Dr.m * G * (Dr.h - Dr.ref2), v4 = Math.sqrt(2 * G * (Dr.h - y4));
// 5 · the spring, compression when the block has slowed to 1.0 m/s
const S = M.SPRING, v5 = 1.0, x5 = Math.sqrt(S.m * (S.v0 ** 2 - v5 ** 2) / S.k);
// 6 · the changing push (Physics C)
const Pu = M.PUSH, v6 = Math.sqrt(2 * Pu.W / Pu.m), Whalf = Pu.F0 * Pu.L * 13 / 24;
// 7 · the pendulum at 20°
const Pd = M.PEND, th7 = 20 * D2R, v7 = Math.sqrt(2 * G * Pd.L * (Math.cos(th7) - Math.cos(Pd.th0)));
const vb = Math.sqrt(2 * G * Pd.L * (1 - Math.cos(Pd.th0))), Tb = Pd.m * G + Pd.m * vb ** 2 / Pd.L;
// 8 · U(x) = 3x² − 2x³ (Physics C)
const U8 = x => 3 * x * x - 2 * x ** 3, F8 = x => -(6 * x - 6 * x * x), x8 = 2.0;
// 9 · the bond (Physics C)
const B = M.BOND, kB = 72 * B.eps / B.r0 ** 2, TB = 2 * Math.PI * Math.sqrt(B.m / kB);
// 10 · the slide, from 8.0 m/s; heat after 1.0 m from 4.0 m/s
const Sl = M.SLIDE, v10 = 8.0, d10 = v10 ** 2 / (2 * Sl.mu * G), x10 = 1.0, Q10 = Sl.mu * Sl.m * G * x10;
// 11 · a student on the stairs
const m11 = 70, h11 = 3.0, t11 = 4.2, P11 = m11 * G * h11 / t11;

export const PRACTICE = {
  0: [
    { q: `繩以與水平成 ${P.deg}° 向上、大小 ${f(P.F, 0)} N 的力拉質量 ${f(P.m, 1)} kg 的箱子，箱子沿無摩擦地面滑行 ${f(d0, 1)} m。繩做的功是多少？`,
      choices: [`${f(P.F * d0 * Math.sin(P.th), 1)} J`, `${f(P.F * d0, 1)} J`, `${f(W0, 1)} J`, `${f(P.F * d0 / Math.cos(P.th), 1)} J`], answer: 2,
      why: `<p>只有沿位移方向的分力做功：</p><div class="eq"><i>W</i> = <i>F</i>Δ<i>x</i> cos θ = ${f(P.F, 0)} × ${f(d0, 1)} × cos ${P.deg}° = ${f(W0, 1)} J</div><p>${f(P.F * d0 * Math.sin(P.th), 1)} J 誤用了 sin θ（垂直於運動方向的分量）； ${f(P.F * d0, 1)} J 未考慮角度。</p>` },
    { q: '同一次拉動中，地面的法向力對箱子做多少功？',
      choices: ['負功，因法向力小於 <i>mg</i>', '零，因法向力垂直於位移', '正功，因法向力向上', '與繩做的功等大反向'], answer: 1,
      why: '<p>法向力豎直、箱子水平移動：θ = 90°，cos 90° = 0，故 <i>W</i> = 0。法向力大小（因繩略微上提而小於 <i>mg</i>）不影響結論。</p>' },
  ],
  1: [
    { q: `質量 ${f(T.m)} kg 的球以 ${f(T.v0, 1)} m/s 豎直上拋離手。從離手到最高點，重力對球做多少功？`,
      choices: [`${f(-Wup)} J`, `${f(0)} J`, `${f(2 * Wup)} J`, `${f(Wup)} J`], answer: 3,
      why: `<p>重力與運動方向相反（θ = 180°），故做負功；由功能定理，重力做功使動能完全消失：</p><div class="eq"><i>W</i><sub>g</sub> = Δ<i>K</i> = 0 − ½ × ${f(T.m)} × ${f(T.v0, 1)}² = ${f(Wup)} J</div><p>${f(2 * Wup)} J 漏了 ½；+${f(-Wup)} J 符號錯誤。</p>` },
    { q: '整個過程——從離手到回到同一高度——重力對球做的總功為',
      choices: ['正', '負', '零', '等於 <i>mgh</i>，其中 <i>h</i> 為最大高度'], answer: 2,
      why: '<p>上升時做負功，下降時做等量正功，總功為零。因此（無空氣阻力時）球回到出手高度時速率與出手相同。</p>' },
  ],
  2: [
    { q: `繩上旋轉小球所受張力為 ${f(Wh.T, 1)} N，圓半徑 ${f(Wh.r, 1)} m。半圈過程中張力做多少功？`,
      choices: [`${f(Wh.T * halfArc, 1)} J`, `${f(Wh.T * 2 * Wh.r, 1)} J`, `${f(-Wh.T * halfArc, 1)} J`, '0 J'], answer: 3,
      why: `<p>任一瞬間張力指向圓心、速度沿切線，二者夾角 90°，故每一步 <i>T</i> d<i>s</i> cos 90° = 0。總功為 0 J，速率不變。</p><p>${f(Wh.T * halfArc, 1)} J 把力與弧長相乘，彷彿二者平行； ${f(Wh.T * 2 * Wh.r, 1)} J 用了直徑（淨位移），但每一時刻力仍不沿位移。</p>` },
    { q: '同一繩上以兩倍速率旋轉。張力與小球動能各變為原來的幾倍？',
      choices: ['張力 ×2，動能 ×4', '張力 ×4，動能 ×4', '張力 ×4，動能 ×2', '張力 ×2，動能 ×2'], answer: 1,
      why: '<p><i>T</i> = <i>mv</i>²/<i>r</i> 與 <i>K</i> = ½<i>mv</i>² 皆與 <i>v</i>² 成正比，故皆變為 4 倍。張力仍不做功：較大動能來自使球加速的其他作用。</p>' },
  ],
  3: [
    { q: `淨力 ${f(C.F / 1000, 1)} kN 使質量 ${C.m} kg 的汽車自靜止前進 ${d3} m。此時速率為多少？`,
      choices: [`${f(Math.sqrt(C.F * d3 / C.m))} m/s`, `${f(v3)} m/s`, `${f(C.F * d3 / C.m, 1)} m/s`, `${f(2 * C.F * d3 / C.m, 1)} m/s`], answer: 1,
      why: `<div class="eq"><i>W</i><sub>net</sub> = <i>F</i>Δ<i>x</i> = ${f(C.F * d3 / 1000, 1)} kJ = ½<i>mv</i>² &nbsp;⇒&nbsp; <i>v</i> = √(2 × ${f(C.F * d3, 0)} / ${C.m}) = ${f(v3)} m/s</div><p>${f(Math.sqrt(C.F * d3 / C.m))} m/s 漏了 ½；其餘兩者未取平方根。</p>` },
    { q: '同一淨力使汽車自靜止加速至 <i>v</i>，再由 <i>v</i> 至 2<i>v</i>。第二段淨功是第一段的幾倍？',
      choices: ['1', '2', '4', '3'], answer: 3,
      why: '<p>由 0 至 <i>v</i> 的 Δ<i>K</i> 為 ½<i>mv</i>²；由 <i>v</i> 至 2<i>v</i> 為 ½<i>m</i>(4<i>v</i>² − <i>v</i>²) = 3 × ½<i>mv</i>²。動能隨 <i>v</i>² 增長，故相等的速率增量需要越來越多的功（與距離）。</p>' },
  ],
  4: [
    { q: `取距地面 ${f(Dr.ref2, 1)} m 的桌面為 <i>U</i><sub>g</sub> = 0。質量 ${f(Dr.m)} kg、離地 ${f(Dr.h, 1)} m 的球，其重力勢能為多少？`,
      choices: [`${f(Dr.m * G * Dr.h)} J`, `${f(Dr.m * G * Dr.ref2)} J`, `${f(U4)} J`, `${f(Dr.m * G * (Dr.h + Dr.ref2))} J`], answer: 2,
      why: `<p>自選定零點量度 Δ<i>y</i>： ${f(Dr.h, 1)} − ${f(Dr.ref2, 1)} = ${f(Dr.h - Dr.ref2, 1)} m.</p><div class="eq"><i>U</i><sub>g</sub> = <i>mg</i>Δ<i>y</i> = ${f(Dr.m)} × ${f(G)} × ${f(Dr.h - Dr.ref2, 1)} = ${f(U4)} J</div><p>${f(Dr.m * G * Dr.h)} J 僅在零點取在地面時才正確。</p>` },
    { q: `球自 ${f(Dr.h, 1)} m 處自由落下。離地 ${f(y4, 1)} m 時速率為多少？`,
      choices: [`${f(Math.sqrt(2 * G * y4))} m/s`, `${f(Math.sqrt(2 * G * Dr.h))} m/s`, `${f(2 * G * (Dr.h - y4), 1)} m/s`, `${f(v4)} m/s`], answer: 3,
      why: `<p>已下降 ${f(Dr.h - y4, 1)} m，失去的 <i>U</i><sub>g</sub> 轉為 <i>K</i>：</p><div class="eq"><i>mg</i>Δ<i>y</i> = ½<i>mv</i>² &nbsp;⇒&nbsp; <i>v</i> = √(2 × ${f(G)} × ${f(Dr.h - y4, 1)}) = ${f(v4)} m/s</div><p>${f(Math.sqrt(2 * G * y4))} m/s 誤用了離地高度而非已下落距離。</p>` },
  ],
  5: [
    { q: `質量 ${f(S.m, 1)} kg 的滑塊以 ${f(S.v0, 1)} m/s 撞擊勁度 ${S.k} N/m 的彈簧。當滑塊減速至 ${f(v5, 1)} m/s 時，彈簧壓縮了多少？`,
      choices: [`${f(x5, 3)} m`, `${f(S.xmax / 2, 3)} m`, `${f(S.m * (S.v0 ** 2 - v5 ** 2) / S.k, 3)} m`, `${f(Math.sqrt(S.m * (S.v0 ** 2 - v5 ** 2) / (2 * S.k)), 3)} m`], answer: 0,
      why: `<div class="eq">½<i>mv</i><sub>0</sub>² = ½<i>mv</i>² + ½<i>k</i>Δ<i>x</i>² &nbsp;⇒&nbsp; Δ<i>x</i> = √(<i>m</i>(<i>v</i><sub>0</sub>² − <i>v</i>²)/<i>k</i>) = √(${f(S.m, 1)} × ${f(S.v0 ** 2 - v5 ** 2, 1)} / ${S.k}) = ${f(x5, 3)} m</div><p>速率減半並非壓縮減半：四分之三動能已貯存，故 Δ<i>x</i> 為 ${f(S.xmax)} m 的 √¾。</p>` },
    { q: '若入射速率加倍，彈簧最大壓縮量為',
      choices: ['相同', '變為 √2 倍', '變為兩倍', '變為四倍'], answer: 2,
      why: '<p>½<i>kx</i><sub>max</sub>² = ½<i>mv</i><sub>0</sub>², so <i>x</i><sub>max</sub> = <i>v</i><sub>0</sub>√(<i>m</i>/<i>k</i>): proportional to <i>v</i><sub>0</sub>. 能量為四倍，但能量與 <i>x</i>² 成正比，故壓縮為兩倍。</p>' },
  ],
  6: [
    { q: `推力 <i>F</i>(<i>x</i>) = <i>F</i><sub>0</sub>(1 − <i>x</i>/<i>L</i>)(1 + 2<i>x</i>/<i>L</i>)，其中 <i>F</i><sub>0</sub> = ${Pu.F0} N、<i>L</i> = ${f(Pu.L, 1)} m，作用於靜止、質量 ${f(Pu.m, 1)} kg 的木箱。在 <i>x</i> = <i>L</i> 處速率為？`,
      choices: [`${f(Math.sqrt(2 * Pu.F0 * Pu.L / Pu.m))} m/s`, `${f(Math.sqrt(Pu.W / Pu.m))} m/s`, `${f(Math.sqrt(2 * (Pu.F0 / 2) * Pu.L / Pu.m))} m/s`, `${f(v6)} m/s`], answer: 3,
      why: `<p>展開並積分：</p><div class="eq"><i>W</i> = ∫<sub>0</sub><sup><i>L</i></sup> <i>F</i><sub>0</sub>(1 + <i>x</i>/<i>L</i> − 2<i>x</i>²/<i>L</i>²) d<i>x</i> = <i>F</i><sub>0</sub><i>L</i>(1 + ½ − ⅔) = ⅚<i>F</i><sub>0</sub><i>L</i> = ${f(Pu.W, 1)} J</div><div class="eq"><i>v</i> = √(2<i>W</i>/<i>m</i>) = √(2 × ${f(Pu.W, 1)} / ${f(Pu.m, 1)}) = ${f(v6)} m/s</div><p>${f(Math.sqrt(2 * Pu.F0 * Pu.L / Pu.m))} m/s 把推力當成恆定 ${Pu.F0} N； ${f(Math.sqrt(2 * (Pu.F0 / 2) * Pu.L / Pu.m))} m/s 只取兩端平均值，忽略了中段峰值。</p>` },
    { q: `開放作答。求同一推力在前半程（<i>x</i> = 0 至 <i>x</i> = <i>L</i>/2）做的功。它比總功 ${f(Pu.W, 1)} J 的一半大還是小？為什麼？`,
      solution: `<p>展開： <i>F</i> = <i>F</i><sub>0</sub>(1 + <i>x</i>/<i>L</i> − 2<i>x</i>²/<i>L</i>²). 逐項積分：</p><div class="eq"><i>W</i> = <i>F</i><sub>0</sub>[<i>x</i> + <i>x</i>²/2<i>L</i> − 2<i>x</i>³/3<i>L</i>²]<sub>0</sub><sup><i>L</i>/2</sup> = <i>F</i><sub>0</sub><i>L</i>(½ + ⅛ − 1/12) = (13/24)<i>F</i><sub>0</sub><i>L</i></div><div class="eq"><i>W</i> = (13/24) × ${Pu.F0} × ${f(Pu.L, 1)} = ${f(Whalf, 1)} J</div><p>大於 ${f(Pu.W, 1)} J 的一半：推力在 <i>x</i> = <i>L</i>/4 達峰，<i>F</i>(<i>x</i>) 曲線下面積集中在前半，後半只剩衰減尾部。</p>` },
  ],
  7: [
    { q: `質量 ${f(Pd.m, 1)} kg 的擺錘掛在長 ${f(Pd.L, 1)} m 的繩上，自與豎直成 ${Pd.deg0}° 處由靜止釋放。繩與豎直成 20° 時速率為多少？`,
      choices: [`${f(v7)} m/s`, `${f(Math.sqrt(2 * G * Pd.L * (1 - Math.cos(th7))))} m/s`, `${f(vb)} m/s`, `${f(vb / Math.SQRT2)} m/s`], answer: 0,
      why: `<p>只計兩角度間的高度差： Δ<i>y</i> = <i>L</i>(cos 20° − cos ${Pd.deg0}°) = ${f(Pd.L * (Math.cos(th7) - Math.cos(Pd.th0)), 3)} m.</p><div class="eq"><i>v</i> = √(2<i>g</i>Δ<i>y</i>) = √(2 × ${f(G)} × ${f(Pd.L * (Math.cos(th7) - Math.cos(Pd.th0)), 3)}) = ${f(v7)} m/s</div><p>${f(Math.sqrt(2 * G * Pd.L * (1 - Math.cos(th7))))} m/s 用了 20° 處相對最低點的高度，而非自 ${Pd.deg0}° 下落的高度差。角度減半並非能量減半。</p>` },
    { q: '擺錘經過最低點時，繩的張力為多少？',
      choices: [`${f(Pd.m * G * Math.cos(Pd.th0))} N`, `${f(Pd.m * G)} N`, `${f(Tb)} N`, `${f(Pd.m * G - Pd.m * vb ** 2 / Pd.L)} N`], answer: 2,
      why: `<p>在最低點擺錘以 <i>v</i> = ${f(vb)} m/s 做圓周運動，淨力向上指向支點：</p><div class="eq"><i>T</i> − <i>mg</i> = <i>mv</i>²/<i>L</i> &nbsp;⇒&nbsp; <i>T</i> = ${f(Pd.m * G)} + ${f(Pd.m * vb ** 2 / Pd.L)} = ${f(Tb)} N</div><p><i>T</i> = <i>mg</i> 僅在擺錘靜止於該處時才正確。</p>` },
  ],
  8: [
    { q: '質點沿 <i>x</i> 運動，勢能 <i>U</i>(<i>x</i>) = 3<i>x</i>² − 2<i>x</i>³（<i>U</i> 單位 J，<i>x</i> 單位 m）。在 <i>x</i> = 2.0 m 處所受的力為？',
      choices: [`${f(-U8(x8), 1)} N`, `${f(-F8(x8), 1)} N`, `${f(U8(x8), 1)} N`, `+${f(F8(x8), 1)} N`], answer: 3,
      why: `<div class="eq"><i>F</i><sub>x</sub> = −d<i>U</i>/d<i>x</i> = −(6<i>x</i> − 6<i>x</i>²) = −(12 − 24) = +${f(F8(x8), 1)} N</div><p>該處 <i>U</i> 的斜率為負（沿 +<i>x</i> 勢能下降），故力指向 +<i>x</i>（下坡方向）。 −${f(F8(x8), 1)} N 漏了負號； ±${f(-U8(x8), 1)} N 誤用了 <i>U</i> 本身而非其斜率。</p>` },
    { q: '同一 <i>U</i>(<i>x</i>) = 3<i>x</i>² − 2<i>x</i>³，質點可在 <i>x</i> = 0 與 <i>x</i> = 1 m 平衡。何者為穩定／不穩定？',
      choices: ['皆穩定', '<i>x</i> = 0 不穩定，<i>x</i> = 1 m 穩定', '<i>x</i> = 0 穩定，<i>x</i> = 1 m 不穩定', '皆不穩定'], answer: 2,
      why: '<p>d<i>U</i>/d<i>x</i> = 6<i>x</i> − 6<i>x</i>² = 0 於 <i>x</i> = 0 與 1。 由二階導數判斷：<i>U</i>″ = 6 − 12<i>x</i> 在 <i>x</i> = 0 為 +6（谷底，穩定），在 <i>x</i> = 1 m 為 −6（峰頂，不穩定）。</p>' },
  ],
  9: [
    { q: `開放作答。鍵勢能 <i>U</i>(<i>r</i>) = ε[(<i>r</i><sub>0</sub>/<i>r</i>)¹² − 2(<i>r</i><sub>0</sub>/<i>r</i>)⁶]，ε = ${f(B.eps / M.EV, 1)} eV，<i>r</i><sub>0</sub> = ${f(B.r0 * 1e9)} nm。證明 <i>r</i><sub>0</sub> 為平衡位置，求等效勁度 <i>k</i> = <i>U</i>″(<i>r</i><sub>0</sub>)，以及質量 ${f(B.m / M.AMU, 1)} u 原子小振動的週期。`,
      solution: `<p>微分：</p><div class="eq"><i>U</i>′ = ε[−12<i>r</i><sub>0</sub>¹²/<i>r</i>¹³ + 12<i>r</i><sub>0</sub>⁶/<i>r</i>⁷]</div><p>在 <i>r</i> = <i>r</i><sub>0</sub> 括號內為 −12/<i>r</i><sub>0</sub> + 12/<i>r</i><sub>0</sub> = 0：無力，為平衡。</p><div class="eq"><i>U</i>″ = ε[156<i>r</i><sub>0</sub>¹²/<i>r</i>¹⁴ − 84<i>r</i><sub>0</sub>⁶/<i>r</i>⁸] &nbsp;⇒&nbsp; <i>U</i>″(<i>r</i><sub>0</sub>) = 72ε/<i>r</i><sub>0</sub>²</div><p>為正，故為穩定極小。取 ε = ${B.eps.toExponential(3).replace('e-', '×10<sup>−')}</sup> J 與 <i>r</i><sub>0</sub> = ${f(B.r0 * 1e9)}×10<sup>−9</sup> m:</p><div class="eq"><i>k</i> = 72 × ${f(B.eps * 1e19, 3)}×10<sup>−19</sup> / (${f(B.r0 * 1e9)}×10<sup>−9</sup>)² = ${f(kB, 0)} N/m</div><div class="eq"><i>T</i> = 2π√(<i>m</i>/<i>k</i>) = 2π√(${f(B.m * 1e27, 3)}×10<sup>−27</sup> / ${f(kB, 0)}) = ${f(TB * 1e15, 1)} fs</div>` },
    { q: '勢阱中質點總能 <i>E</i> 低於阱緣。在任一轉折點，',
      choices: ['速率為零且受力為零', '速率最大且受力為零', '勢能為零', '速率為零且力指向阱內'], answer: 3,
      why: '<p>轉折點處 <i>U</i> = <i>E</i>，故 <i>K</i> = 0，質點暫停。但該處 <i>U</i> 有斜率（是阱壁而非阱底），故 <i>F</i> = −d<i>U</i>/d<i>x</i> ≠ 0 且指向下坡、朝向極小，因而折返。</p>' },
  ],
  10: [
    { q: `滑塊改以 ${f(v10, 1)} m/s（而非 ${f(Sl.v0, 1)} m/s）滑上同一地面（μ<sub>k</sub> = ${f(Sl.mu)}）。它能滑多遠？`,
      choices: [`${f(2 * Sl.d)} m`, `${f(d10)} m`, `${f(Sl.d)} m`, `${f(v10 ** 2 / (Sl.mu * G), 1)} m`], answer: 1,
      why: `<div class="eq">½<i>mv</i><sub>0</sub>² = μ<sub>k</sub><i>mgd</i> &nbsp;⇒&nbsp; <i>d</i> = <i>v</i><sub>0</sub>²/(2μ<sub>k</sub><i>g</i>) = ${f(v10, 1)}² / (2 × ${f(Sl.mu)} × ${f(G)}) = ${f(d10)} m</div><p>速率加倍則動能四倍、距離四倍（原先滑了 ${f(Sl.d)} m）。 ${f(2 * Sl.d)} m 誤當成 <i>d</i> ∝ <i>v</i> 而加倍。</p>` },
    { q: `回到 ${f(Sl.v0, 1)} m/s（動能 ${f(Sl.E, 1)} J）：滑行最初 ${f(x10, 1)} m 後，摩擦產生多少熱能？`,
      choices: [`${f(Sl.E / 2)} J`, `${f(Sl.mu * G * x10)} J`, `${f(Q10)} J`, `${f(Sl.E)} J`], answer: 2,
      why: `<div class="eq"><i>E</i><sub>th</sub> = <i>f</i><i>d</i> = μ<sub>k</sub><i>mg</i> × <i>d</i> = ${f(Sl.mu)} × ${f(Sl.m, 1)} × ${f(G)} × ${f(x10, 1)} = ${f(Q10)} J</div><p>滑塊仍有動能 ${f(Sl.E - Q10)} J。 ${f(Sl.mu * G * x10)} J 漏了質量。</p>` },
  ],
  11: [
    { q: `質量 ${m11} kg 的學生以勻速在 ${f(t11, 1)} s 內登上高 ${f(h11, 1)} m 的樓梯。她用於抬升自身的平均功率為多少？`,
      choices: [`${f(m11 * h11 / t11, 1)} W`, `${f(P11, 0)} W`, `${f(m11 * G * h11, 0)} W`, `${f(m11 * G * h11 * t11, 0)} W`], answer: 1,
      why: `<div class="eq"><i>P</i> = <i>W</i>/<i>t</i> = <i>mgh</i>/<i>t</i> = ${m11} × ${f(G)} × ${f(h11, 1)} / ${f(t11, 1)} = ${f(P11, 0)} W</div><p>${f(m11 * G * h11, 0)} 是以焦耳計的功，不是功率； ${f(m11 * h11 / t11, 1)} W 誤用質量而非重量。</p>` },
    { q: '起重機以勻速 0.5 m/s 將木箱升高 <i>h</i>，再以勻速 1.0 m/s 升起相同高度的另一相同木箱。與慢速相比，快速提升需要',
      choices: ['兩倍功與兩倍功率', '相同功與相同功率', '相同功與兩倍功率', '一半功與兩倍功率'], answer: 2,
      why: '<p>勻速時鋼纜拉力皆為 <i>mg</i>，故功 <i>mgh</i> 相同。快速提升時間減半，故 <i>P</i> = <i>W</i>/<i>t</i> = <i>Fv</i> 加倍。</p>' },
  ],
};
