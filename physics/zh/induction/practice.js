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
    { q: `一個${P0.N}匝線圈，面積為${p(P0.A*1e4,0)}平方厘米，平放於與其垂直的均勻磁場中。磁場由${p(P0.B1,2)}T穩定增強至${p(P0.B2,2)}T，歷時${p(P0.dt,2)}秒。感應電動勢的大小為`,
      choices: P0.nums.map(x => `${p(x, 3)} V`), answer: 1, nums: P0.nums,
      why: `<p>每一匝的磁通量為 Φ=<i>BA</i>，而全部${P0.N}匝會相加：</p><div class="eq">|ε|=<i>NA</i>Δ<i>B</i>/Δ<i>t</i>=${P0.N}×${P0.A}m²×${p(P0.B2-P0.B1,2)}T/${P0.dt}s=${p(P0.emf,3)}V</div><p>只有 <i>B</i> 的<b>變化</b>才計入：單獨使用${P0.B2}T 會得到${p(P0.nums[2],3)}V，而略去 <i>N</i> 則得到單匝的${p(P0.nums[0],3)}V。</p>` },
    { q: `通過一迴路的磁通量為 Φ<sub><i>B</i></sub>(<i>t</i>)=${p(P0b.a,1)}<i>t</i><sup>3</sup>−${p(P0b.b,1)}<i>t</i>（mWb，<i>t</i> 以秒為單位）。感應電動勢在何時（<i>t</i> > 0）為零？`,
      choices: P0b.nums.map(x => `${p(x, 2)} s`), answer: 3, nums: P0b.nums,
      why: `<p>電動勢是 Φ 的<b>斜率</b>取負值，而非 Φ 本身：</p><div class="eq">ε=−<i>d</i>Φ/<i>dt</i>=−(${p(3*P0b.a,0)}<i>t</i><sup>2</sup>−${p(P0b.b,0)})=0&nbsp;→&nbsp;<i>t</i>=√(${p(P0b.b,0)}/${p(3*P0b.a,0)})=${p(P0b.t,2)}s</div><p>在${p(P0b.nums[0],2)}s 時，磁通量為零，但仍在變化，所以電動勢不為零。</p>` },
  ],
  1: [
    { q: '將棒磁鐵的 N 極沿其軸線筆直拉離一個迴路。從磁鐵看去，迴路中的感應電流是',
      choices: ['逆時針方向，且線圈排斥磁鐵', '順時針方向，且線圈排斥磁鐵', '逆時針方向，且線圈吸引磁鐵', '順時針方向，且線圈吸引磁鐵'], answer: 3,
      why: '<p>N 極的磁場穿過迴路並遠離觀看者，且正在減弱。感應磁場指向同一方向，即遠離觀看者，以彌補這項損失：根據右手定則，從磁鐵看去，這是一股<b>順時針</b>電流。磁場線進入迴路靠近磁鐵的一面，因此該面為 S 極，會把 N 極拉回：迴路阻礙運動。</p>' },
    { q: `在本頁的迴路（<i>R</i>=${p(M.LENZ.R*1e3,0)}mΩ）中，當 N 極在 ${p(M.LENZ.run,1)} s 內移入時，磁通量由 ${p(M.lenzCase(M.CASES[0],0).Phi*1e6,2)} µWb 增至 ${p(M.lenzCase(M.CASES[0],M.LENZ.run).Phi*1e6,2)} µWb。流經該迴路的總電荷為`,
      choices: L1.nums.map(x => `${p(x, 2)} mC`), answer: 3, nums: L1.nums,
      why: `<p>對電流積分；時間會消去：</p><div class="eq"><i>Q</i>=∫<i>Idt</i>=∫(ε/<i>R</i>)<i>dt</i>=(1/<i>R</i>)∫|<i>d</i>Φ|=ΔΦ/<i>R</i>=${p(L1.dPhi*1e6,2)}µWb/${M.LENZ.R}Ω=${p(L1.Q*1e3,2)}mC</div><p>磁鐵移動得多快並不重要。${p(L1.nums[1],2)} 是以 mA 為單位的平均電流，而非電荷。</p>` },
  ],
  2: [
    { q: '兩個線圈共用一個鐵芯。若<b>次級</b>線圈的匝數加倍，則互感 <i>M</i>',
      choices: ['加倍', '不變', '變為四倍', '減半'], answer: 0,
      why: '<p><i>M</i>=<i>N</i><sub>2</sub>Φ<sub>2</sub>/<i>I</i><sub>1</sub>。每匝磁通量由初級的電流與匝數決定，維持不變；次級匝數加倍，磁通鏈也加倍。<i>M</i>=μ<sub>r</sub>μ<sub>0</sub><i>N</i><sub>1</sub><i>N</i><sub>2</sub><i>A</i>/ℓ 對每個 <i>N</i> 皆為線性；隨 <i>N</i><sup>2</sup> 變化的是自感。</p>' },
    { q: `在本頁的鐵芯（<i>M</i>=${p(M.CORE.M*1e3,1)}mH，<i>L</i><sub>1</sub>=${p(M.CORE.L1*1e3,1)}mH）上，初級線圈通有 <i>I</i><sub>1</sub>=${p(P2.c,1)}<i>t</i><sup>2</sup>（單位 A，<i>t</i> 的單位為 s）。在 <i>t</i>=${p(P2.t,2)}s 時，次級電動勢的大小為`,
      choices: P2.nums.map(x => `${p(x, 1)} mV`), answer: 1, nums: P2.nums,
      why: `<div class="eq">ε<sub>2</sub>=−<i>MdI</i><sub>1</sub>/<i>dt</i>=−<i>M</i>(${p(2*P2.c,1)}<i>t</i>)=−${p(M.CORE.M*1e3,1)}mH×${p(P2.dI,2)}A/s=−${p(P2.nums[1],1)}mV</div><p>需要的是變化率，而非 <i>I</i><sub>1</sub> 本身（${p(P2.nums[0],1)}mV）；對次級而言，起作用的是 <i>M</i>，而非初級本身的 <i>L</i><sub>1</sub>。</p>` },
  ],
  3: [
    { q: '一矩形迴路有邊 <i>b</i> 平行於載有電流 <i>I</i> 的長直導線；其近側距導線 <i>r</i>，遠側距 <i>r</i>+<i>a</i>。通過它的磁通量為',
      choices: ['(μ<sub>0</sub><i>Ib</i>/2π<i>r</i>)<i>a</i>', '(μ<sub>0</sub><i>Ib</i>/2π) ln((<i>r</i> + <i>a</i>)/<i>r</i>)', '(μ<sub>0</sub><i>Ia</i>/2π) ln((<i>r</i> + <i>b</i>)/<i>r</i>)', '(μ<sub>0</sub><i>Ib</i>/2π)(1/<i>r</i> − 1/(<i>r</i> + <i>a</i>))'], answer: 1,
      why: '<p><i>B</i>=μ<sub>0</sub><i>I</i>/2π<i>s</i> 隨距離 <i>s</i> 而變，因此將迴路切成平行於導線的細條 <i>bds</i>：</p><div class="eq">Φ=∫<sub><i>r</i></sub><sup><i>r</i>+<i>a</i></sup>(μ<sub>0</sub><i>I</i>/2π<i>s</i>)<i>bds</i>=(μ<sub>0</sub><i>Ib</i>/2π)ln((<i>r</i>+<i>a</i>)/<i>r</i>)</div><p>選項 A 將 <i>B</i> 視為均勻，並取其近側值；選項 D 是導數的形狀，而非積分的形狀。</p>' },
    { q: `頁面上的迴路（沿導線方向 <i>b</i>=${p(M.WIRE.b*100,0)} cm，橫跨方向 <i>a</i>=${p(M.WIRE.a*100,0)} cm）以 ${p(M.WIRE.v*100,0)} cm/s 沿直線遠離一根載有 ${M.WIRE.I} A 電流的導線。當其近側距導線 ${p(M.WIRE.r0*100,0)} cm 時，|ε| 為`,
      choices: P3.nums.map(x => `${p(x, 3)} µV`), answer: 3, nums: P3.nums,
      why: `<p>只有平行於導線的兩邊會切割磁力線。每邊的動生電動勢為 <i>Bbv</i>，且沿迴路繞行時兩者方向相反：</p><div class="eq">ε=(<i>B</i><sub>near</sub>−<i>B</i><sub>far</sub>)<i>bv</i>=μ<sub>0</sub><i>Iabv</i>/2π<i>r</i>(<i>r</i>+<i>a</i>)=${p(P3.emf*1e6,3)}µV</div><p>與該對數式的 −<i>d</i>Φ/<i>dt</i> 相同。僅近側即給出 ${p(P3.nums[0],3)} µV；將兩側相加，則為 ${p(P3.nums[1],3)} µV。</p>` },
  ],
  4: [
    { q: '一根垂直金屬棒在指向頁面內的均勻磁場中向右運動，且未構成迴路。片刻之後，',
      choices: ['上端處於較高電位，且無電流流動', '下端處於較高電位，且有電流流動', '下端處於較高電位，且無電流流動', '上端處於較高電位，且電流沿棒向下流動'], answer: 0,
      why: '<p><i>F</i>=<i>qv</i>×<i>B</i>：向右 × 指向頁面內 = 向上，因此正電荷聚集於頂端。其電場會反推，直到 <i>qE</i>=<i>qvB</i>；此後沿棒便無移動。由於沒有閉合路徑，雖有電動勢 <i>BLv</i>，卻沒有穩定電流。</p>' },
    { q: `一根長 ${p(P4.l*100,0)} cm 的金屬棒，繞一端以 ${P4.w} rad/s 轉動，其轉動平面垂直於均勻的 ${p(P4.B,2)} T 磁場。其兩端之間的電動勢為`,
      choices: P4.nums.map(x => `${p(x, 2)} V`), answer: 1, nums: P4.nums,
      why: `<p>每一小段 <i>dr</i> 以 <i>v</i> = ω<i>r</i> 運動，因此其電動勢為 <i>B</i>ω<i>r dr</i>。沿棒將它們累加：</p><div class="eq">ε=∫<sub>0</sub><sup>ℓ</sup><i>B</i>ω<i>r dr</i>=½<i>B</i>ωℓ<sup>2</sup>=½×${P4.B}×${P4.w}×${P4.l}<sup>2</sup>=${p(P4.emf,2)} V</div><p>若以整根棒的末端速度 ωℓ 計算，會得到 ${p(P4.nums[0],2)} V，為正確值的兩倍：平均速度只有末端速度的一半。</p>` },
  ],
  5: [
    { q: `線圈（高 <i>h</i> = ${p(M.CROSS.h*100,0)} cm、寬 ${p(M.CROSS.w*100,0)} cm、<i>R</i> = ${M.CROSS.R} Ω）以穩定速度 ${M.CROSS.v} m/s 被拉入 ${M.CROSS.B} T 磁場中。當其前緣位於磁場內、後緣位於磁場外時，所需的拉力為`,
      choices: P5.nums.map(x => `${p(x, 1)} mN`), answer: 2, nums: P5.nums,
      why: `<div class="eq"><i>I</i>=<i>Bhv</i>/<i>R</i>,&nbsp;<i>F</i>=<i>IhB</i>=<i>B</i><sup>2</sup><i>h</i><sup>2</sup><i>v</i>/<i>R</i>=${p(P5.F*1e3,1)} mN</div><p>只有前緣在磁場中載流（上邊與下邊所受的力互相抵消），且只有高度 <i>h</i> 的部分切割磁力線。驗算：<i>Fv</i>=${p(P5.F*M.CROSS.v*1e3,1)} mW=ε<sup>2</sup>/<i>R</i>。</p>` },
    { q: '一個質量為 <i>m</i>、電阻為 <i>R</i>、高度為 <i>h</i> 的線圈，以速度 <i>v</i><sub>0</sub> <b>自由</b>滑入均勻磁場 <i>B</i> 中（無拉力）。求當其後緣仍在磁場外時，其速度作為前緣進入磁場距離 <i>x</i> 的函數。',
      solution: `<p>當只有前緣在磁場中時，電流為 <i>Bhv</i>/<i>R</i>，而磁場對它施加 <i>IhB</i> 的反向力：</p><div class="eq"><i>mdv</i>/<i>dt</i>=−<i>B</i><sup>2</sup><i>h</i><sup>2</sup><i>v</i>/<i>R</i></div><p>將 <i>dv</i>/<i>dt</i>=<i>vdv</i>/<i>dx</i> 寫出，並消去 <i>v</i>：</p><div class="eq"><i>mdv</i>/<i>dx</i>=−<i>B</i><sup>2</sup><i>h</i><sup>2</sup>/<i>R</i>&nbsp;→&nbsp;<i>v</i>(<i>x</i>)=<i>v</i><sub>0</sub>−<i>B</i><sup>2</sup><i>h</i><sup>2</sup><i>x</i>/<i>mR</i></div><p>速度會<b>隨距離線性</b>下降（隨時間則呈指數下降）。若 <i>v</i> 在 <i>x</i>=線圈寬度之前就降到 0，線圈會在中途停下。</p>` },
  ],
  6: [
    { q: `頁面上的金屬棒（τ = <i>mR</i>/<i>B</i><sup>2</sup><i>L</i><sup>2</sup> = ${p(M.RAIL.tau,2)} 秒）在 ${p(M.RAIL.v0,2)} 米/秒的速度下被釋放，沒有任何東西推動它。它在停下來之前會走多遠？`,
      choices: [`${p(P6.nums[0], 2)} m`, `${p(P6.nums[1], 2)} m`, '永不停止，因此距離不斷增大', `${p(P6.nums[2], 2)} m`], answer: 3, nums: [P6.nums[0], P6.nums[1], NaN, P6.nums[2]],
      why: `<p>速度按指數衰減，但其積分為有限值：</p><div class="eq"><i>x</i>=∫<sub>0</sub><sup>∞</sup><i>v</i><sub>0</sub><i>e</i><sup>−<i>t</i>/τ</sup><i>dt</i>=<i>v</i><sub>0</sub>τ=${p(P6.d,2)} 米</div><p>${p(P6.nums[1],2)} 米只是它在 <i>t</i>=τ 之前所走的距離；${p(P6.nums[0],2)} 米則假設了恆定的減速度。</p>` },
    { q: '連接兩條軌道的電阻器被替換為阻值加倍的電阻器，而金屬棒以相同的速度發射。它靜止時所產生的總熱量',
      choices: ['加倍', '減半', '不變', '變為四倍'], answer: 2,
      why: '<p>無論 <i>R</i> 是多少，金屬棒全部的動能 ½<i>mv</i><sub>0</sub><sup>2</sup> 最終都變成熱量。較大的 <i>R</i> 意味著較小的電流和較弱的制動，因此 τ 加倍，金屬棒滑行兩倍的距離，但總熱量相同。</p>' },
  ],
  7: [
    { q: `一個螺線管在 ${p(P7.l*100,0)} 厘米上有 ${P7.N} 匝，半徑為 ${p(P7.r*100,1)} 厘米。其電感約為`,
      choices: P7.nums.map(x => x < 0.01 ? `${p(x * 1e3, 2)} µH` : `${p(x, 3)} mH`), answer: 0, nums: P7.nums,
      why: `<p>穿過每一匝的 <i>B</i>=μ<sub>0</sub><i>nI</i>，因此 <i>N</i>Φ=<i>N</i>(μ<sub>0</sub><i>NI</i>/ℓ)π<i>r</i><sup>2</sup>，並且</p><div class="eq"><i>L</i>=μ<sub>0</sub><i>N</i><sup>2</sup>π<i>r</i><sup>2</sup>/ℓ=${p(P7.L*1e3,3)} mH</div><p>用直徑代替 <i>r</i> 會使結果大 4 倍；用 <i>N</i> 代替 <i>N</i><sup>2</sup> 則忽略了更多匝既產生更多磁場，又捕捉到更多磁場。</p>` },
    { q: `頁面中的螺線管（<i>L</i>=${p(M.SOL.L*1e3,2)} mH）載有 <i>I</i>(<i>t</i>)=(${p(P7b.I0,1)} A) sin(${P7b.w}<i>t</i>)。其反電動勢的最大量值為`,
      choices: P7b.nums.map(x => x < 1 ? `${p(x, 3)} mV` : x < 10 ? `${p(x, 2)} mV` : x < 1000 ? `${p(x, 1)} mV` : `${p(x / 1e3, 1)} V`), answer: 2, nums: P7b.nums,
      why: `<div class="eq">ε<sub><i>L</i></sub> = −<i>L dI</i>/<i>dt</i> = −<i>LI</i><sub>0</sub>ω cos ω<i>t</i>, &nbsp; 最大值 <i>LI</i><sub>0</sub>ω = ${p(M.SOL.L*1e3,2)} mH × ${P7b.I0} A × ${P7b.w} s<sup>−1</sup> = ${p(P7b.emf*1e3,1)} mV</div><p>峰值出現於 <i>I</i>=0 且變化最快時；<i>LI</i><sub>0</sub>=${p(P7b.nums[0],2)} mV 是以 mWb 為單位的磁通鏈，並非電動勢。</p>` },
  ],
  8: [
    { q: `在頁面的電路中（ε=${M.RL.E} V、<i>R</i>=${M.RL.R} Ω、<i>L</i>=${M.RL.L} H），從 <i>I</i>=0 開始，電流要到達 ${p(P8.I,1)} A 需要多久？`,
      choices: P8.nums.map(x => `${p(x, 3)} s`), answer: 1, nums: P8.nums,
      why: `<p>由 <i>I</i>=0 解 <i>L dI</i>/<i>dt</i>=ε−<i>IR</i>：<i>I</i>=(ε/<i>R</i>)(1−<i>e</i><sup>−<i>t</i>/τ</sup>)，τ=<i>L</i>/<i>R</i>=${p(M.RL.tau,2)} s。</p><div class="eq"><i>t</i> = −τ ln(1−<i>IR</i>/ε) = −${p(M.RL.tau,2)} ln(1−${p(P8.I,1)}/${p(M.RL.Imax,1)}) = ${p(P8.t,3)} s</div><p>${p(P8.I,1)} A 是 ${p(M.RL.Imax,0)} A 的 ${p(P8.I/M.RL.Imax*100,0)}%，高於在 τ 時所達到的 63%，因此所需時間比 τ 更長。</p>` },
    { q: '帶電池的 RL 電路已通電很長時間，此時電池突然被移出迴路（迴路仍透過電阻保持閉合）。緊接著，',
      choices: ['電流為 ε/<i>R</i>，正在減小，且電感器充當電源', '電流為零', '電流為 ε/<i>R</i> 且恆定', '電流方向反轉'], answer: 0,
      why: '<p>電感器不允許電流突然跳變，因此 <i>I</i> 從 ε/<i>R</i> 開始，方向相同。沒有電池時，<i>L dI</i>/<i>dt</i>=−<i>IR</i>：電感器的電動勢此時驅動電流流經 <i>R</i>，而電流以 <i>e</i><sup>−<i>t</i>/τ</sup> 衰減，將 ½<i>LI</i><sup>2</sup> 轉化為熱。</p>' },
  ],
  9: [
    { q: `本頁電路中的電容器（${p(M.LC.C*1e6,0)} µF，${p(M.LC.Q*1e6,0)} µC）在 <i>t</i>=0 時連接至 ${p(M.LC.L*1e3,0)} mH 線圈。電流首次達到最大值是在`,
      choices: [`<i>t</i> = ${p(M.LC.T / 2 * 1e3, 2)} ms, ${p(P9.I * 1e3, 0)} mA`, `<i>t</i> = ${p(P9.t * 1e3, 2)} ms, ${p(M.LC.f * M.LC.Q * 1e3, 1)} mA`, `<i>t</i> = ${p(P9.t * 1e3, 2)} ms, ${p(P9.I * 1e3, 0)} mA`, `<i>t</i> = 0, ${p(P9.I * 1e3, 0)} mA`], answer: 2,
      nums: [M.LC.T / 2 * 1e3, P9.t * 1e3, P9.t * 1e3, 0], nums2: [P9.I * 1e3, M.LC.f * M.LC.Q * 1e3, P9.I * 1e3, P9.I * 1e3],
      why: `<p>ω=1/√(<i>LC</i>)=${p(M.LC.w,0)}rad/s，<i>T</i>=2π/ω=${p(M.LC.T*1e3,2)}ms。由 <i>q</i>=<i>Q</i>cosω<i>t</i> 可知，<i>I</i>=−ω<i>Q</i>sinω<i>t</i> 首次達到最大值是在 ω<i>t</i>=π/2，即經過四分之一週期後，此時極板上無電荷：</p><div class="eq"><i>t</i>=<i>T</i>/4=${p(P9.t*1e3,2)}ms，&nbsp;|<i>I</i>|=ω<i>Q</i>=${p(P9.I*1e3,0)}mA</div><p>在 <i>t</i>=0 時，電流為零：線圈會阻止電流驟變。${p(M.LC.f*M.LC.Q*1e3,1)}mA 以 <i>f</i> 代替 ω。</p>` },
    { q: '對於無電阻的 LC 電路，證明 <i>U</i>=<i>q</i><sup>2</sup>/2<i>C</i>+½<i>LI</i><sup>2</sup> 為常數，並利用能量求電容器上的電荷為 <i>Q</i>/2 時的電流（其最大電荷為 <i>Q</i>）。',
      solution: `<p>對時間微分，其中 <i>I</i>=<i>dq</i>/<i>dt</i>：</p><div class="eq"><i>dU</i>/<i>dt</i>=(<i>q</i>/<i>C</i>)<i>I</i>+<i>LIdI</i>/<i>dt</i>=<i>I</i>(<i>q</i>/<i>C</i>+<i>LdI</i>/<i>dt</i>)</div><p>括號內即迴路定律，於任一時刻均為零，因此整個過程中 <i>U</i>=<i>Q</i><sup>2</sup>/2<i>C</i>。當 <i>q</i>=<i>Q</i>/2 時：</p><div class="eq">½<i>LI</i><sup>2</sup>=<i>Q</i><sup>2</sup>/2<i>C</i>−<i>Q</i><sup>2</sup>/8<i>C</i>=3<i>Q</i><sup>2</sup>/8<i>C</i>&nbsp;→&nbsp;|<i>I</i>|=(√3/2)<i>Q</i>/√(<i>LC</i>)=(√3/2)ω<i>Q</i></div><p>就本頁的電路而言，其值為 ${p(Math.sqrt(3)/2*M.LC.Imax*1e3,1)}mA。當電荷只剩下一半時，四分之三的能量位於線圈中。</p>` },
  ],
};
