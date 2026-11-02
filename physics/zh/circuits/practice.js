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
    { q: `銅線<b>直徑</b> ${p(P0.D * 1e3, 1)} mm，載流 ${p(P0.I, 1)} A（<i>n</i> = 8.5 × 10<sup>28</sup> m<sup>−3</sup>）。電子漂移速率為`,
      choices: P0.nums.map(x => `${p(x, 4)} mm/s`), answer: 0, nums: P0.nums,
      why: `<p>由<b>半徑</b>求截面積： <i>A</i> = π(${p(P0.D / 2 * 1e3, 1)} mm)<sup>2</sup> = ${p(Math.PI * (P0.D / 2) ** 2 * 1e6, 3)} mm². 於是</p><div class="eq"><i>v</i><sub>d</sub> = <i>I</i>/<i>neA</i> = ${P0.I} / (8.5×10<sup>28</sup> × 1.60×10<sup>−19</sup> × ${p(Math.PI * (P0.D / 2) ** 2 * 1e6, 3)}×10<sup>−6</sup>) = ${p(P0.v * 1e3, 4)} mm/s</div><p>誤把直徑當半徑會得到 ${p(P0.nums[1], 4)} mm/s，約慢四倍。</p>` },
    { q: `導線電流 <i>I</i>(<i>t</i>) = ${p(P0b.a, 1)}<i>t</i> − ${p(P0b.b, 1)}<i>t</i><sup>2</sup>（單位 A，<i>t</i> 以 s 計），自 <i>t</i> = 0 至 ${p(P0b.T, 1)} s。通過某一截面的電荷為`,
      choices: P0b.nums.map(x => `${p(x, 1)} C`), answer: 2, nums: P0b.nums,
      why: `<div class="eq"><i>q</i> = ∫<i>I dt</i> = ∫<sub>0</sub><sup>${P0b.T}</sup> (${P0b.a}<i>t</i> − <i>t</i><sup>2</sup>) <i>dt</i> = ${p(P0b.a / 2, 0)}(${P0b.T})<sup>2</sup> − (${P0b.T})<sup>3</sup>/3 = ${p(P0b.a * P0b.T ** 2 / 2, 0)} − ${p(P0b.b * P0b.T ** 3 / 3, 2)} = ${p(P0b.q, 1)} C</div><p><i>I</i>(<i>t</i>) 曲線下的面積為峰值 ${p(P0b.Imax, 0)} A 的拋物線。峰值×時間（${p(P0b.nums[0], 1)} C）偏大；三角形近似（${p(P0b.nums[1], 1)} C）偏小。</p>` },
  ],
  1: [
    { q: `本頁細鎳鉻線（ρ = 1.10 × 10<sup>−6</sup> Ω·m，<b>直徑</b> ${p(M.RES.dThin * 1e3, 1)} mm）長 ${p(L1, 1)} m。電阻為`,
      choices: P1.nums.map(x => `${p(x, 2)} Ω`), answer: 2, nums: P1.nums,
      why: `<div class="eq"><i>R</i> = ρ<i>L</i>/<i>A</i> = ρ<i>L</i>/π<i>r</i><sup>2</sup> = 1.10×10<sup>−6</sup> × ${L1} / (π × (${p(rA * 1e3, 2)}×10<sup>−3</sup>)<sup>2</sup>) = ${p(P1.R, 2)} Ω</div><p>半徑為直徑之半；誤用直徑會得到答案的四分之一，即 ${p(P1.nums[0], 2)} Ω。</p>` },
    { q: `長 ${p(L1, 1)} m 的鎳鉻棒兩端半徑由 ${p(rA * 1e3, 2)} mm 線性增至 ${p(rB * 1e3, 2)} mm。端到端電阻為`,
      choices: P1b.nums.map(x => `${p(x, 2)} Ω`), answer: 3, nums: P1b.nums,
      why: `<p>薄片 <i>dx</i> 串聯；各片 <i>dR</i> = ρ <i>dx</i>/π<i>r</i>(<i>x</i>)<sup>2</sup>，且 <i>r</i> = <i>a</i> + (<i>b</i> − <i>a</i>)<i>x</i>/<i>L</i>，故 <i>dx</i> = <i>L dr</i>/(<i>b</i> − <i>a</i>)：</p><div class="eq"><i>R</i> = (ρ<i>L</i>/π(<i>b</i> − <i>a</i>)) ∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>dr</i>/<i>r</i><sup>2</sup> = ρ<i>L</i>/π<i>ab</i> = ${p(P1b.R, 2)} Ω</div><p>不是平均半徑（${p(P1b.nums[0], 2)} Ω），也不是兩端電阻平均（${p(P1b.nums[1], 2)} Ω）：細端影響較大，但並非完全主導。</p>` },
  ],
  2: [
    { q: '本頁電路（6 V 電池、3 Ω 電阻、理想導線）中，連接電池正極與電阻的那段導線兩端電位差為多少？',
      choices: ['6 V', '3 V', '2 V', '0 V'], answer: 3,
      why: '<p>理想導線 <i>R</i> = 0，故沿線 Δ<i>V</i> = <i>IR</i> = 0，與電流無關。該導線各點皆為電池正極電位；全部 6 V 降落在電阻上。</p>' },
    { q: `碳管（ρ = ${p(P2.rho * 1e5, 1)} × 10<sup>−5</sup> Ω·m）內半徑 ${p(P2.a * 100, 0)} cm、外半徑 ${p(P2.b * 100, 0)} cm、長 ${p(P2.L * 100, 0)} cm，電流由內表面<b>徑向</b>流向外壁。電阻為`,
      choices: P2.nums.map(x => `${p(x, 2)} × 10<sup>−5</sup> Ω`), answer: 1, nums: P2.nums,
      why: `<p>薄圓柱殼串聯；沿電流方向厚度為 <i>dr</i>，面積為 2π<i>rL</i>：</p><div class="eq"><i>R</i> = ∫<sub><i>a</i></sub><sup><i>b</i></sup> ρ <i>dr</i>/2π<i>rL</i> = (ρ/2π<i>L</i>) ln(<i>b</i>/<i>a</i>) = ${p(P2.R * 1e5, 2)} × 10<sup>−5</sup> Ω</div><p>面積隨 <i>r</i> 增大，故僅用內面積（${p(P2.nums[0], 2)}）或僅用外面積（${p(P2.nums[2], 2)}）皆不正確。</p>` },
  ],
  3: [
    { q: `本頁兩燈泡（各 ${RB} Ω）<b>串聯</b>接在 ${VB} V 電池上。它們消耗的總功率為`,
      choices: P3.nums.map(x => `${p(x, 1)} W`), answer: 2, nums: P3.nums,
      why: `<p>串聯時 <i>R</i><sub>eq</sub> = ${2 * RB} Ω，故</p><div class="eq"><i>P</i> = Δ<i>V</i><sup>2</sup>/<i>R</i><sub>eq</sub> = ${VB}<sup>2</sup>/${2 * RB} = ${p(P3.P, 1)} W</div><p>為單燈功率（${p(P3.nums[1], 1)} W）的一半：電流減半，每燈功率為原單燈的四分之一（${p(P3.nums[3], 1)} W）。若並聯則總功率為 ${p(P3.nums[0], 1)} W。</p>` },
    { q: `跨過 ${RB} Ω 電阻的電壓在 ${P3b.T} s 內由 0 勻速升至 ${VB} V。這段時間轉為熱的能量為`,
      choices: P3b.nums.map(x => `${p(x, 1)} J`), answer: 1, nums: P3b.nums,
      why: `<p>因 Δ<i>V</i> = (${VB}/${P3b.T})<i>t</i>，<i>P</i> = Δ<i>V</i><sup>2</sup>/<i>R</i> 隨 <i>t</i><sup>2</sup> 增長：</p><div class="eq"><i>E</i> = ∫<i>P dt</i> = ∫<sub>0</sub><sup><i>T</i></sup> (${VB}<i>t</i>/${P3b.T})<sup>2</sup>/${RB} <i>dt</i> = (${VB}<sup>2</sup>/${RB})·<i>T</i>/3 = ${p(P3b.E, 1)} J</div><p>對 <i>P</i> 作線性平均（${p(P3b.nums[0], 1)} J）或用平均電壓（${p(P3b.nums[3], 1)} J）都不對，因為 <i>P</i> 與 Δ<i>V</i> 成二次關係。</p>` },
  ],
  4: [
    { q: `本頁電池（ℰ = ${EC} V，<i>r</i> = ${rC} Ω）驅動 ${RL4} Ω 燈泡。電池兩端電位差為`,
      choices: P4.nums.map(x => `${p(x, 1)} V`), answer: 2, nums: P4.nums,
      why: `<div class="eq"><i>I</i> = ℰ/(<i>R</i> + <i>r</i>) = ${EC}/${RL4 + rC} = ${p(EC / (RL4 + rC), 1)} A, &nbsp; Δ<i>V</i> = ℰ − <i>Ir</i> = ${EC} − ${p(EC / (RL4 + rC) * rC, 1)} = ${p(P4.V, 1)} V</div><p>電動勢僅在無電流時等於端電壓；${p(P4.nums[1], 1)} V 是電池<i>內部</i>壓降。</p>` },
    { q: `燈泡固定 <i>R</i> = ${RL4} Ω，可選擇電池內阻 <i>r</i>（ℰ 不變）。哪個 <i>r</i> 使燈泡最亮？`,
      choices: [`<i>r</i> = ${2 * RL4} Ω`, `<i>r</i> = ${RL4} Ω, 與負載匹配`, `<i>r</i> = ${RL4 / 2} Ω`, '<i>r</i> = 0'], answer: 3,
      why: `<p><i>P</i> = ℰ<sup>2</sup><i>R</i>/(<i>R</i> + <i>r</i>)<sup>2</sup>, 此時變量為 <i>r</i>：</p><div class="eq"><i>dP</i>/<i>dr</i> = −2ℰ<sup>2</sup><i>R</i>/(<i>R</i> + <i>r</i>)<sup>3</sup> < 0</div><p>對任意 <i>r</i> 皆成立，故 <i>P</i> 在最小 <i>r</i>（即零）時最大。<i>R</i> = <i>r</i> 是在電池固定而改<b>負載</b>時使功率最大的條件，與此相反。</p>` },
  ],
  5: [
    { q: '在理想 9 V 電池上，與本頁 2、4、6 Ω 再並聯第四個電阻。(i) 2 Ω 支路電流與 (ii) 電池總電流如何變化？',
      choices: ['(i) 增大；(ii) 增大', '(i) 不變；(ii) 增大', '(i) 減小；(ii) 增大', '(i) 減小；(ii) 不變'], answer: 1,
      why: '<p>各支路仍跨全部 9 V，故 2 Ω 支路仍為 9/2 = 4.5 A。新支路另加電流，電池供給總和：路徑增多、<i>R</i><sub>eq</sub> 降低、總電流增大。（若有內阻，端電壓會略降，支路電流亦略减。）</p>' },
    { q: `均勻電導率 σ<sub>0</sub> 的棒端到端電阻本為 ${P5.R0} Ω。現電導率<b>沿寬度</b>由一邊的 σ<sub>0</sub> 線性增至另一邊的 3σ<sub>0</sub>。端到端電阻為`,
      choices: P5.nums.map(x => `${p(x, 2)} Ω`), answer: 2, nums: P5.nums,
      why: `<p>寬度 <i>dy</i> 的縱向細條兩端相同：它們<b>並聯</b>，電導相加：</p><div class="eq">1/<i>R</i> = ∫<sub>0</sub><sup><i>w</i></sup> σ(<i>y</i>)<i>t dy</i>/<i>L</i> = (σ<sub>0</sub><i>wt</i>/<i>L</i>)·∫<sub>0</sub><sup>1</sup>(1 + 2<i>u</i>) <i>du</i> = 2/<i>R</i><sub>0</sub></div><p><i>R</i> = ${P5.R0}/2 = ${p(P5.R, 2)} Ω. 若誤當串聯相加則得 (ln 3/2)<i>R</i><sub>0</sub> = ${p(P5.nums[0], 2)} Ω。</p>` },
  ],
  6: [
    { q: `本頁組合（9 V；R<sub>1</sub> = 2 Ω，R<sub>3</sub> = 2 Ω，R<sub>2</sub> + R<sub>4</sub> + R<sub>5</sub> = ${CB.R245} Ω）中 R<sub>3</sub> 燒斷（開路）。通過 R<sub>1</sub> 的電流變為`,
      choices: P6.nums.map(x => `${p(x, 2)} A`), answer: 1, nums: P6.nums,
      why: `<p>R<sub>3</sub> 消失後，R<sub>1</sub> 與 ${CB.R245} Ω 串聯：</p><div class="eq"><i>I</i> = 9 V / (2 + ${CB.R245}) Ω = ${p(P6.I, 2)} A</div><p>小於原先的 ${p(P6.nums[0], 2)} A：去掉並聯路徑會<i>提高</i> <i>R</i><sub>eq</sub>。</p>` },
    { q: 'R<sub>3</sub> 改為可變電阻 <i>x</i>，其餘不變。哪個 <i>x</i> 使其功率最大？',
      choices: P6b.nums.map(x => `${p(x, 1)} Ω`), answer: 0, nums: P6b.nums,
      why: `<p>從 <i>x</i> 看，其餘為帶電池的 R<sub>1</sub> 與 ${CB.R245} Ω 串聯支路並聯。去掉 <i>x</i> 時開路電壓 ℰ<sub>th</sub> = 9 × ${CB.R245}/${CB.R1 + CB.R245} = ${p(9 * CB.R245 / (CB.R1 + CB.R245), 1)} V，等效電阻 <i>R</i><sub>th</sub> = 2 × ${CB.R245}/(2 + ${CB.R245}) = ${p(P6b.R, 1)} Ω。於是</p><div class="eq"><i>P</i>(<i>x</i>) = ℰ<sub>th</sub><sup>2</sup><i>x</i>/(<i>R</i><sub>th</sub> + <i>x</i>)<sup>2</sup>, &nbsp; <i>dP</i>/<i>dx</i> = 0 → <i>x</i> = <i>R</i><sub>th</sub> = ${p(P6b.R, 1)} Ω</div><p>僅取 R<sub>1</sub>（2 Ω）忽略了 ${CB.R245} Ω 串聯支路也跨接在 <i>x</i> 兩端。</p>` },
  ],
  7: [
    { q: `本頁網路中 ${K7.E2} V 電池改為普通導線。通過 ${K7.E1} V 電池的電流（<i>I</i><sub>1</sub>）變為`,
      choices: P7.nums.map(x => `${p(x, 0)} mA`), answer: 1, nums: P7.nums,
      why: `<p>只剩一電池時網路簡化：R<sub>3</sub> + R<sub>4</sub> = ${K7.R3 + K7.R4} Ω 與 R<sub>5</sub> = ${K7.R5} Ω 並聯得 ${p(R345, 3)} Ω，再與 R<sub>1</sub> + R<sub>2</sub> = ${K7.R1 + K7.R2} Ω 串聯：</p><div class="eq"><i>I</i><sub>1</sub> = ${K7.E1} V / ${p(K7.R1 + K7.R2 + R345, 3)} Ω = ${p(P7.I * 1e3, 0)} mA</div><p>低於原先 ${p(I1now * 1e3, 0)} mA：由疊加原理，6 V 電池（正極在下方）曾為 <i>I</i><sub>1</sub> 貢獻 ${p((I1now - P7.I) * 1e3, 0)} mA。把 R<sub>5</sub> 當短路得 ${p(P7.nums[2], 0)} mA；完全忽略則得 ${p(P7.nums[3], 0)} mA。</p>` },
    { q: `開放作答。本頁網路中，視第二電池電動勢 ℰ<sub>2</sub>（正極在下方，如圖）為變量。利用兩迴路方程與 <i>I</i><sub>1</sub> = <i>I</i><sub>2</sub> + <i>I</i><sub>3</sub>，求 <i>dI</i><sub>3</sub>/<i>d</i>ℰ<sub>2</sub>，以及使 <i>I</i><sub>3</sub> = 0 的 ℰ<sub>2</sub>。`,
      solution: `<p>迴路 1： 20<i>I</i><sub>1</sub> + 5<i>I</i><sub>2</sub> = 12. 迴路 2： 40<i>I</i><sub>3</sub> − 5<i>I</i><sub>2</sub> = ℰ<sub>2</sub>. 將 <i>I</i><sub>1</sub> = <i>I</i><sub>2</sub> + <i>I</i><sub>3</sub> 代入迴路 1：</p><div class="eq">25<i>I</i><sub>2</sub> + 20<i>I</i><sub>3</sub> = 12 &nbsp;→&nbsp; <i>I</i><sub>2</sub> = (12 − 20<i>I</i><sub>3</sub>)/25</div><div class="eq">40<i>I</i><sub>3</sub> − (12 − 20<i>I</i><sub>3</sub>)/5 = ℰ<sub>2</sub> &nbsp;→&nbsp; <i>I</i><sub>3</sub> = (ℰ<sub>2</sub> + 2.4)/44</div><p>故 <i>dI</i><sub>3</sub>/<i>d</i>ℰ<sub>2</sub> = 1/44 A/V = ${p(P7b.dI * 1e3, 1)} mA/V：電路線性，對任意 ℰ<sub>2</sub> 成立。ℰ<sub>2</sub> = 6 V 時 <i>I</i><sub>3</sub> = 8.4/44 = ${p(8.4 / 44, 3)} A（本頁數值）。<i>I</i><sub>3</sub> = 0 時 ℰ<sub>2</sub> = ${p(P7b.E2zero, 1)} V：相當於正極在<b>上方</b>的 2.4 V 電池，恰好抵消 12 V 電池對 R<sub>5</sub> 的推動。</p>`, val: P7b },
  ],
  8: [
    { q: `本頁 RC 電路（ℰ = ${ER} V，τ = <i>RC</i> = ${p(tau, 1)} s）自空電容開始，電容器電壓達 ${p(V8, 1)} V 需時多久？`,
      choices: P8.nums.map(x => `${p(x, 2)} s`), answer: 1, nums: P8.nums,
      why: `<div class="eq">Δ<i>V</i><sub>C</sub> = ℰ(1 − e<sup>−<i>t</i>/τ</sup>) &nbsp;→&nbsp; <i>t</i> = −τ ln(1 − Δ<i>V</i><sub>C</sub>/ℰ) = ${p(tau, 1)} s × ln ${p(ER / (ER - V8), 0)} = ${p(P8.t, 2)} s</div><p>並非線性（${p(P8.nums[2], 2)} s）：充電隨電容充實而變慢。一個 τ 只達 ${ER} V 的 63%。</p>` },
    { q: '充滿的電容器經 <i>R</i> 放電。經過一個時間常數後，貯存能量有多少比例已在 <i>R</i> 中轉為熱？',
      choices: P8b.nums.map(x => `${p(x, 1)} %`), answer: 1, nums: P8b.nums,
      why: `<p>電流為 <i>I</i><sub>0</sub>e<sup>−<i>t</i>/τ</sup>，故功率 <i>I</i><sup>2</sup><i>R</i> 衰減快一倍：</p><div class="eq"><i>E</i> = ∫<sub>0</sub><sup>τ</sup> <i>I</i><sub>0</sub><sup>2</sup><i>R</i> e<sup>−2<i>t</i>/τ</sup> <i>dt</i> = ½<i>I</i><sub>0</sub><sup>2</sup><i>R</i>τ(1 − e<sup>−2</sup>) = <i>U</i><sub>0</sub>(1 − e<sup>−2</sup>)</div><p>(½<i>I</i><sub>0</sub><sup>2</sup><i>R</i>τ = <i>Q</i><sup>2</sup>/2<i>C</i> = <i>U</i><sub>0</sub>.) So ${p(P8b.f * 100, 1)} %. 電荷降至 36.8%，但能量與 <i>q</i><sup>2</sup> 成正比：僅剩 e<sup>−2</sup> = ${p(Math.exp(-2) * 100, 1)} %。</p>` },
  ],
};
