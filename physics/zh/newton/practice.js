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
    { q: `質量 ${f(M.M1, 1)} kg 的物塊放在地面上，你以 ${f(PRESS, 1)} N 垂直向下壓。地面的法向力為多少？`,
      choices: [`${p3(M.W1 + PRESS)} N`, `${p3(M.W1)} N`, `${p3(M.W1 - PRESS)} N`, `${p3(PRESS)} N`], answer: 0,
      why: `<p>受力圖：重力 ${f(M.W1, 1)} N 向下、你的推力 ${f(PRESS, 1)} N 向下、法向力向上。物塊靜止，故 Σ<i>F</i> = 0：</p><div class="eq"><i>F</i><sub>N</sub> = <i>mg</i> + <i>F</i><sub>push</sub> = ${f(M.W1, 1)} + ${f(PRESS, 1)} = ${p3(M.W1 + PRESS)} N</div><p>法向力不必等於重力；它等於所有向下力之和，使淨力為零。</p>` },
    { q: '物塊在無摩擦地面上以恆定速度滑行（無視空氣阻力）。其受力圖應包含哪些力？',
      choices: ['重力、法向力，以及維持運動的向前力', '僅重量', '法向力與向前力', '僅重力與法向力'], answer: 3,
      why: `<p>只有接觸物塊的物體（以及重力）對它施力。地面提供法向力；地球提供重力。沒有東西向前推它：速率不變是因為淨力為零，而非有力驅動。</p>` },
  ],
  1: [
    { q: `質量 ${f(M.M1, 1)} kg 的物塊由兩條繩懸掛靜止，每條繩與水平成 ${TH1}°。每條繩的張力為多少？`,
      choices: [`${p3(M.W1 / (2 * cos(TH1)))} N`, `${p3(M.W1 / (2 * sin(TH1)))} N`, `${p3(M.W1 / sin(TH1))} N`, `${p3(M.W1 / 2)} N`], answer: 1,
      why: `<p>水平分量相消。兩個豎直分量托住重力：</p><div class="eq">2<i>T</i> sin θ = <i>mg</i> &nbsp;→ <i>T</i> = ${f(M.W1, 1)} / (2 sin ${TH1}°) = ${p3(M.W1 / (2 * sin(TH1)))} N</div><p>角度自水平量起，故豎直分量為 <i>T</i> sin θ，而非 <i>T</i> cos θ。</p>` },
    { q: '兩條繩越拉越平、趨向水平，物塊仍靜止懸掛。張力如何變化？',
      choices: ['趨近於零。', '維持在重力的一半。', '無限增大；完全水平的繩不可能。', '趨近於全部重力。'], answer: 2,
      why: `<p><i>T</i> = <i>mg</i>/(2 sin θ)。當 θ → 0，sin θ → 0，<i>T</i> → ∞。水平繩沒有豎直分量，任何有限張力都無法托住物塊。</p>` },
  ],
  2: [
    { q: `質量 ${f(M.M1, 1)} kg 的物塊掛在電梯內的繩上，電梯以<b>恆定 ${f(VEL2, 1)} m/s 向上</b>運動。繩的張力為多少？`,
      choices: [`${p3(M.W1 + M.M1 * VEL2)} N`, `${p3(M.M1 * VEL2)} N`, `${p3(M.W1 - M.M1 * VEL2)} N`, `${p3(M.W1)} N`], answer: 3,
      why: `<p>勻速意味 <i>a</i> = 0，物塊平衡：Σ<i>F</i> = <i>T</i> − <i>mg</i> = 0。</p><div class="eq"><i>T</i> = <i>mg</i> = ${f(M.M1, 1)} × ${f(G)} = ${p3(M.W1)} N</div><p>速率從不進入方程；力改變速度，維持勻速並不需要額外的力。</p>` },
    { q: '冰球在無摩擦冰面上以恆定速率滑行。要維持運動需要什麼？',
      choices: ['什麼都不需要；淨力為零時速度保持不變。', '等於其重力的恆定向前力', '逐漸減小的向前力', '「慣性力」，會隨時間消失'], answer: 0,
      why: `<p>第一定律：Σ<i>F</i> = 0 時速度保持不變，無論是否運動。慣性是性質（抗拒速度改變），不是力，也不會「用完」。</p>` },
  ],
  3: [
    { q: `質量 ${M.PLANE.m} kg 的飛機水平巡航，阻力 ${M.PLANE.D} N。飛行員把推力提高到 ${THRUST3} N。在阻力尚未改變的瞬間，飛機加速度為多少？`,
      choices: [`${p3(THRUST3 / M.PLANE.m)} m/s²`, `${p3(M.PLANE.D / M.PLANE.m)} m/s²`, `${p3((THRUST3 - M.PLANE.D) / M.PLANE.m)} m/s²`, `${p3((THRUST3 + M.PLANE.D) / M.PLANE.m)} m/s²`], answer: 2,
      why: `<p>升力仍與重力平衡。沿航向淨力為推力減阻力：</p><div class="eq"><i>a</i> = (${THRUST3} − ${M.PLANE.D}) / ${M.PLANE.m} = ${p3((THRUST3 - M.PLANE.D) / M.PLANE.m)} m/s² 向前</div><p>只用推力會忽略仍然存在的阻力。</p>` },
    { q: `以 ${M.PLANE.v} m/s 作穩定水平飛行時，向前推力與阻力如何比較？`,
      choices: ['推力較大，否則飛機會減速。', '二者相等。', '推力比阻力大一個飛機重力。', '阻力較大，因為飛機在運動。'], answer: 1,
      why: `<p>勻速表示淨力為零（第一定律），故推力 = 阻力 = ${M.PLANE.D} N。推力大於阻力會使飛機加速，而非僅維持飛行。</p>` },
  ],
  4: [
    { q: `大小 ${f(M.PUSH, 1)} N 的推力作用於靜止、質量 ${f(M.M1, 1)} kg、置於無摩擦面的物塊。在 ${f(M.PUSH_T, 1)} s 內它移動多遠？`,
      choices: [`${p3(2 * X4)} m`, `${p3(0.5 * M.A2 * M.PUSH_T ** 2)} m`, `${p3(M.A1 * M.PUSH_T)} m`, `${p3(X4)} m`], answer: 3,
      why: `<p><i>a</i> = Σ<i>F</i>/<i>m</i> = ${f(M.PUSH, 1)}/${f(M.M1, 1)} = ${f(M.A1, 2)} m/s²，恆定，故</p><div class="eq">Δ<i>x</i> = ½<i>at</i>² = ½ × ${f(M.A1, 2)} × (${f(M.PUSH_T, 1)})² = ${p3(X4)} m</div><p>${p3(2 * X4)} m 漏了 ½；${p3(M.A1 * M.PUSH_T)} 是達到的速率（單位 m/s）。</p>` },
    { q: '小車所受淨力加倍，質量亦加倍。加速度變為',
      choices: ['變為四分之一', '相同', '變為兩倍', '變為四倍'], answer: 1,
      why: `<p><i>a</i> = Σ<i>F</i>/<i>m</i> = (2Σ<i>F</i>)/(2<i>m</i>)：倍數相消。</p>` },
  ],
  5: [
    { q: '汽車在水平路面加速。推動汽車向前的外力是什麼？',
      choices: ['引擎對汽車的力', '輪胎對路面的力', '路面對輪胎的靜摩擦力', '路面對輪胎的動摩擦力'], answer: 2,
      why: `<p>引擎是汽車的一部分；內力不能加速汽車。輪胎向後推路面，由第三定律，路面向前推輪胎。胎面不在路面上滑動，故為<b>靜</b>摩擦。輪胎對路面的力作用於路面，而非汽車。</p>` },
    { q: `路面仍提供向前 ${f(M.CAR.F / 1000, 1)} kN 的推力，質量 ${M.CAR.m} kg 的汽車達 ${V5} m/s，此時阻力 ${f(D5, 0)} N。加速度為多少？`,
      choices: [`${p3(M.CAR.F / M.CAR.m)} m/s²`, `${p3(A5)} m/s²`, `${p3((M.CAR.F + D5) / M.CAR.m)} m/s²`, `${p3(D5 / M.CAR.m)} m/s²`], answer: 1,
      why: `<p>阻力向後，與運動相反：</p><div class="eq"><i>a</i> = (<i>F</i> − <i>F</i><sub>d</sub>)/<i>m</i> = (${M.CAR.F} − ${f(D5, 0)}) / ${M.CAR.m} = ${p3(A5)} m/s²</div><p>${p3(M.CAR.F / M.CAR.m)} m/s² 忽略了阻力，這也是實際汽車高速時加速變慢的原因。</p>` },
  ],
  6: [
    { q: `質量 ${f(M.M1, 1)} kg 的物塊放在粗糙地面（μ<sub>s</sub> = ${f(M.MU_S)}，μ<sub>k</sub> = ${f(M.MU_K)}）。你以 ${f(P6, 1)} N 側向推它。摩擦力為多少？`,
      choices: [`${p3(M.F_SMAX)} N`, `${p3(M.F_K)} N`, `${p3(P6)} N`, '0 N'], answer: 2,
      why: `<p>上限為 μ<sub>s</sub><i>F</i><sub>N</sub> = ${f(M.MU_S)} × ${f(M.FN, 1)} = ${f(M.F_SMAX)} N。${f(P6, 1)} N 低於此值，物塊不動，靜摩擦恰平衡推力：${p3(P6)} N。μ<sub>s</sub><i>F</i><sub>N</sub> 是<b>最大值</b>，不是當前值。</p>` },
    { q: `開始滑動後，推力增至 ${f(P6b, 1)} N。物塊加速度為多少？`,
      choices: [`${p3((P6b - M.F_SMAX) / M.M1)} m/s²`, `${p3(P6b / M.M1)} m/s²`, `${p3((P6b + M.F_K) / M.M1)} m/s²`, `${p3(A6)} m/s²`], answer: 3,
      why: `<p>已滑動，故動摩擦 μ<sub>k</sub><i>mg</i> = ${f(M.F_K)} N 向後：</p><div class="eq"><i>a</i> = (${f(P6b, 1)} − ${f(M.F_K)}) / ${f(M.M1, 1)} = ${p3(A6)} m/s²</div><p>靜摩擦上限 ${f(M.F_SMAX)} N 在滑動後不再適用。</p>` },
  ],
  7: [
    { q: `同一 ${f(M.PUSH, 1)} N 推力改作用於 B（${f(M.M2, 1)} kg），把它推向 A（${f(M.M1, 1)} kg），地面無摩擦。兩物塊彼此推力多大？`,
      choices: [`${p3(C7)} N`, `${p3(M.CONTACT)} N`, `${p3(M.PUSH)} N`, `${p3(M.PUSH / 2)} N`], answer: 0,
      why: `<p>整體：<i>a</i> = ${f(M.PUSH, 1)}/(${f(M.M1, 1)} + ${f(M.M2, 1)}) = ${f(M.A_PAIR, 2)} m/s²。接觸力是 A 所受唯一水平力，故</p><div class="eq"><i>F</i><sub>BA</sub> = <i>m</i><sub>A</sub><i>a</i> = ${f(M.M1, 1)} × ${f(M.A_PAIR, 2)} = ${p3(C7)} N</div><p>推較輕者時接觸力較大。</p>` },
    { q: '物塊靜置於桌上。物塊重力（地球向下拉物塊）的第三定律配對力是什麼？',
      choices: ['桌子向上推物塊', '物塊向上拉地球', '物塊向下推桌子', '桌子向下推地面'], answer: 1,
      why: `<p>第三定律配對是同一相互作用的兩面：地球拉物塊、物塊拉地球，等大反向、作用於不同物體。桌子的法向力也作用於物塊，故不能是配對力，即使此處大小相等。</p>` },
  ],
  8: [
    { q: `滑冰者 A（${TG.mA} kg）與 B（${TG.mB} kg）在無摩擦冰上相距 ${f(TG.d0, 1)} m，拉輕繩直至相遇。相遇點距 A 起點多遠？`,
      choices: [`${p3(TG.d0 / 2)} m`, `${p3(TG.d0 * TG.mA / TG.M)} m`, `${p3(MEET)} m`, `${p3(TG.d0 * TG.mA / TG.mB)} m`], answer: 2,
      why: `<p>水平方向只有內力，質心不動；他們在質心相遇。自 A 起：</p><div class="eq"><i>x</i><sub>cm</sub> = (<i>m</i><sub>A</sub> · 0 + <i>m</i><sub>B</sub> · <i>d</i>) / (<i>m</i><sub>A</sub> + <i>m</i><sub>B</sub>) = ${TG.mB} × ${f(TG.d0, 1)} / ${TG.M} = ${p3(MEET)} m</div>` },
    { q: '對兩滑冰者與繩組成的系統，他們拉繩時下列何者正確？',
      choices: ['質心移向較重的滑冰者。', '繩的張力加速系統質心。', '作用於 A、B 的張力僅在質量相等時才抵消。', '質心保持靜止，因為張力是內力。'], answer: 3,
      why: `<p>繩對 A、B 施等大反向的力，皆為系統內力，無論質量如何皆相消。重力與法向力抵消。Σ<i>F</i><sub>ext</sub> = 0，故 <i>a</i><sub>cm</sub> = 0，且由靜止開始。</p>` },
  ],
  9: [
    { q: `板上拉力增至 ${F9} N；質量 ${f(BD.m, 1)} kg 的物塊仍在質量 ${f(BD.Mb, 1)} kg 的板上滑動（μ<sub>k</sub> = ${f(BD.mu_k)}）。物塊加速度為多少？`,
      choices: [`${p3(ACM9)} m/s²`, `${p3(BD.aBlock)} m/s²`, `${p3(BD.mu_s * G)} m/s²`, `${p3(ABOARD9)} m/s²`], answer: 1,
      why: `<p>物塊所受唯一水平力是動摩擦 μ<sub>k</sub><i>mg</i> = ${f(BD.f)} N，與拉力無關：</p><div class="eq"><i>a</i> = μ<sub>k</sub><i>g</i> = ${f(BD.mu_k)} × ${f(G)} = ${p3(BD.aBlock)} m/s²</div><p>繩拉的是板，不是物塊。${p3(ACM9)} m/s² 是質心加速度。</p>` },
    { q: `同一 ${F9} N 拉力。物塊＋板系統質心加速度為多少？`,
      choices: [`${p3(F9 / BD.Mb)} m/s²`, `${p3(ABOARD9)} m/s²`, `${p3((F9 - BD.f) / BD.M)} m/s²`, `${p3(ACM9)} m/s²`], answer: 3,
      why: `<p>物塊與板之間的摩擦是內力，互相抵消。唯一水平外力是拉力：</p><div class="eq"><i>a</i><sub>cm</sub> = Σ<i>F</i><sub>ext</sub>/<i>M</i> = ${F9} / ${f(BD.M, 1)} = ${p3(ACM9)} m/s²</div><p>驗算：(${f(BD.m, 1)} × ${f(BD.aBlock)} + ${f(BD.Mb, 1)} × ${f(BD.aBoard)}) / ${f(BD.M, 1)} 得同一結果。</p>` },
  ],
  10: [
    { q: `物塊自靜止沿無摩擦 ${M.THETA_DEG}° 斜面下滑 ${f(M.INC_LEN, 1)} m。到達底部時速率為多少？`,
      choices: [`${p3(Math.sqrt(2 * G * M.INC_LEN))} m/s`, `${p3(Math.sqrt(G * sin(M.THETA_DEG) * M.INC_LEN))} m/s`, `${p3(V10)} m/s`, `${p3(Math.sqrt(2 * G * cos(M.THETA_DEG) * M.INC_LEN))} m/s`], answer: 2,
      why: `<p>沿斜面 <i>a</i> = <i>g</i> sin θ = ${f(M.A_INC)} m/s²。自靜止且未給時間：</p><div class="eq"><i>v</i> = √(2<i>aL</i>) = √(2 × ${f(M.A_INC)} × ${f(M.INC_LEN, 1)}) = ${p3(V10)} m/s</div><p>${p3(Math.sqrt(2 * G * M.INC_LEN))} m/s 誤用了全部 <i>g</i>，彷彿自由落下 ${f(M.INC_LEN, 1)} m。</p>` },
    { q: `斜面改為粗糙，μ<sub>k</sub> = ${f(M.MU_K)}。沿斜面下滑的加速度為多少？`,
      choices: [`${p3(M.A_INC)} m/s²`, `${p3(G * (sin(M.THETA_DEG) + M.MU_K * cos(M.THETA_DEG)))} m/s²`, `${p3(A10)} m/s²`, `${p3(G * (sin(M.THETA_DEG) - M.MU_K))} m/s²`], answer: 2,
      why: `<p>摩擦力為 μ<sub>k</sub><i>F</i><sub>N</sub>，斜面上 <i>F</i><sub>N</sub> = <i>mg</i> cos θ。方向沿斜面向上，與滑動相反：</p><div class="eq"><i>a</i> = <i>g</i>(sin θ − μ<sub>k</sub> cos θ) = ${f(G)}(${f(sin(M.THETA_DEG), 3)} − ${f(M.MU_K)} × ${f(cos(M.THETA_DEG), 3)}) = ${p3(M.A_ROUGH)} m/s²</div>` },
  ],
  11: [
    { q: `質量 ${f(DR.m, 2)} kg 的球（<i>b</i> = ${f(DR.b)} kg/s）自靜止釋放。達終端速率一半需時多久？`,
      choices: [`${p3(DR.tau / 2)} s`, `${p3(THALF)} s`, `${p3(DR.tau)} s`, `${p3(Math.log(2))} s`], answer: 1,
      why: `<p>由 <i>m</i> d<i>v</i>/d<i>t</i> = <i>mg</i> − <i>bv</i>，分離變量積分得 <i>v</i> = <i>v</i><sub>t</sub>(1 − e<sup>−<i>t</i>/τ</sup>)，τ = <i>m</i>/<i>b</i> = ${f(DR.tau)} s。令 <i>v</i> = <i>v</i><sub>t</sub>/2：</p><div class="eq">e<sup>−<i>t</i>/τ</sup> = ½ &nbsp;→ <i>t</i> = τ ln 2 = ${p3(DR.tau * Math.LN2)} s</div>` },
    { q: `同一球（自靜止，<i>m</i> d<i>v</i>/d<i>t</i> = <i>mg</i> − <i>bv</i>），對 <i>v</i>(<i>t</i>) 微分得 <i>a</i>(<i>t</i>)。再求 <i>a</i> = <i>g</i>/4 瞬間的阻力與發生時間。`,
      solution: `<p>1. <i>v</i> = <i>v</i><sub>t</sub>(1 − e<sup>−<i>t</i>/τ</sup>)，故 <i>a</i> = d<i>v</i>/d<i>t</i> = (<i>v</i><sub>t</sub>/τ) e<sup>−<i>t</i>/τ</sup> = <i>g</i> e<sup>−<i>t</i>/τ</sup>，因為 <i>v</i><sub>t</sub>/τ = (<i>mg</i>/<i>b</i>)(<i>b</i>/<i>m</i>) = <i>g</i>。</p><p>2. 由微分方程，當 <i>a</i> = <i>g</i>/4 時阻力 <i>bv</i> = <i>mg</i> − <i>ma</i> = (3/4)<i>mg</i>；時間滿足 e<sup>−<i>t</i>/τ</sup> = 1/4。</p>` },
  ],
  12: [
    { q: `球（<i>v</i><sub>t</sub> = ${f(DR.vt)} m/s，τ = ${f(DR.tau)} s）自靜止釋放後 ${f(T12)} s，下落了多遠？`,
      choices: [`${p3(DR.vt * T12)} m`, `${p3(X12)} m`, `${p3(DR.vt * (T12 - DR.tau))} m`, `${p3(0.5 * G * T12 ** 2)} m`], answer: 1,
      why: `<p>對速度積分：</p><div class="eq"><i>x</i> = ∫<sub>0</sub><sup><i>t</i></sup> <i>v</i><sub>t</sub>(1 − e<sup>−<i>t</i>′/τ</sup>) d<i>t</i>′ = <i>v</i><sub>t</sub>[<i>t</i> − τ(1 − e<sup>−<i>t</i>/τ</sup>)]</div><div class="eq">= ${f(DR.vt)} × [${f(T12)} − ${f(DR.tau)}(1 − e<sup>−${f(T12)}/${f(DR.tau)}</sup>)] = ${p3(X12)} m</div>` },
    { q: '兩球大小形狀相同，一球質量為另一球的 4 倍，皆達終端速率。在線性阻力（<i>bv</i>）與二次阻力（<i>kv</i>²）下，重球終端速率分別為輕球的幾倍？',
      choices: ['線性 2×，二次 4×', '線性 4×，二次 4×', '線性 2×，二次 2×', '線性 4×，二次 2×'], answer: 3,
      why: `<p>終端速率時阻力 = <i>mg</i>。線性：<i>bv</i><sub>t</sub> = <i>mg</i>，<i>v</i><sub>t</sub> = <i>mg</i>/<i>b</i> ∝ <i>m</i>，故 4×。二次：<i>kv</i><sub>t</sub>² = <i>mg</i>，<i>v</i><sub>t</sub> = √(<i>mg</i>/<i>k</i>) ∝ √<i>m</i>，故 2×。大小形狀相同則 <i>b</i>、<i>k</i> 不變。</p>` },
  ],
};
