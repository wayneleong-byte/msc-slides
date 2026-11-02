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
    { q: '一個封閉盒子僅包圍頁面上條形磁鐵的N端。離開盒子的淨磁通量為',
      choices: ['零：進入的通量與離開的通量相等', '正：磁力線離開 N 極', '負：磁體內部的磁場流入盒內', '正值，且盒子越大，該值越大'], answer: 0,
      why: '<p>對每一個封閉曲面，∮<b>B</b>·<i>d</i><b>A</b>=0：不存在磁荷。磁力線從外側面離開，但同樣多的磁力線從切開磁鐵的那個面進入；在該處，磁鐵內部的場由S指向N，即朝向N端。磁極不是<b>B</b>的源，不像電荷是<b>E</b>的源那樣。</p>' },
    { q: `一個均勻的${p(P0.B,2)} T磁場垂直向上。一個半徑為${p(P0.R*100,0)} cm的開口半球形圓頂置於平坦桌面上，圓頂朝上。穿過曲面的向外磁通量為`,
      choices: P0.nums.map(x => `${p(x, 2)} mWb`), answer: 2, nums: P0.nums,
      why: `<p>圓頂加上其下方的平圓盤構成一個封閉曲面，因此兩者的磁通量互相抵消：穿出圓頂的磁通量等於穿入圓盤的磁通量，<i>B</i>π<i>R</i><sup>2</sup>。或者以θ自垂直方向起算進行積分：</p><div class="eq">Φ=∫<i>B</i>cosθ·2π<i>R</i><sup>2</sup>sinθ<i>d</i>θ（0到π/2）=<i>B</i>π<i>R</i><sup>2</sup>=${p(P0.phi*1e3,2)} mWb</div><p><i>B</i>×2π<i>R</i><sup>2</sup>（${p(P0.nums[0],2)} mWb）忽略了<b>B</b>對圓頂的大部分區域並非法向。</p>` },
  ],
  1: [
    { q: '一個電子沿+<i>x</i>方向運動，穿過一個指向+<i>y</i>方向的均勻磁場。作用於它的磁力指向',
      choices: ['沿 +<i>z</i> 方向', '沿 −<i>y</i> 方向', '無處：力為零', '沿 −<i>z</i> 方向'], answer: 3,
      why: '<p><b>F</b>=<i>q</i><b>v</b>×<b>B</b>，且<i>x̂</i>×<i>ŷ</i>=+<i>ẑ</i>。電子的電荷為負，這會使其反向：−<i>z</i>。此力永遠不會沿著<b>B</b>；它同時垂直於<b>v</b>和<b>B</b>。</p>' },
    { q: `頁面上，質子的 θ 角在 <b>v</b> 與 <b>B</b> 之間，以穩定速率由 0° 掃至 180°（<i>F</i><sub>max</sub>=<i>qvB</i>=${p(F1/1e-14,2)}×10<sup>−14</sup>N）。整個掃掠過程中，力的量值平均值為`,
      choices: P1.nums.map(x => `${p(x, 2)} × 10<sup>−14</sup> N`), answer: 1, nums: P1.nums,
      why: `<p>θ 隨時間均勻增大，故時間平均值即為對 θ 的平均值：</p><div class="eq">⟨<i>F</i>⟩=(1/π)∫<sub>0</sub><sup>π</sup><i>qvB</i> sinθ<i>d</i>θ=(2/π)<i>qvB</i>=${p(P1.avg/1e-14,2)}×10<sup>−14</sup>N</div><p>並非峰值的一半（${p(P1.nums[0],2)}）：sinθ 不是直線，它在接近頂部處停留的時間較長。</p>` },
  ],
  2: [
    { q: `一氘核（電荷 +<i>e</i>、質量 2<i>m</i><sub>p</sub>）由靜止經頁面上的 ${P2.V}V 加速後，進入相同的 ${p(M.CYC.B,2)}T 磁場；在該磁場中，經 ${P2.V}V 加速的質子以 <i>r</i>=${p(rp*100,2)}cm 作圓周運動。氘核的半徑為`,
      choices: P2.nums.map(x => `${p(x, 2)} cm`), answer: 3, nums: P2.nums,
      why: `<p>電荷與 Δ<i>V</i> 相同，因此動能 <i>e</i>Δ<i>V</i> 也相同；於是 <i>mv</i>=√(2<i>m</i>·<i>e</i>Δ<i>V</i>)，且</p><div class="eq"><i>r</i>=<i>mv</i>/<i>qB</i>=√(2<i>m</i>Δ<i>V</i>/<i>q</i>)/<i>B</i>∝√<i>m</i>&nbsp;→&nbsp;√2×${p(rp*100,2)}cm=${p(P2.r*100,2)}cm</div><p>質量加倍並不代表半徑加倍（${p(P2.nums[0],2)}cm）：氘核的速度也較慢，為原來的 1/√2。</p>` },
    { q: `自由作答。一電荷為 <i>q</i>、質量為 <i>m</i> 的粒子，以速度 <b>v</b> 垂直於均勻磁場 <b>B</b>=<i>B</i><i>ẑ</i> 運動。由牛頓第二定律出發，寫出 <i>v<sub>x</sub></i> 與 <i>v<sub>y</sub></i> 的微分方程，求解並求週期。並就頁面上的質子（<i>B</i>=${p(M.CYC.B,2)}T）計算其值。`,
      solution: `<p><b>F</b>=<i>q</i><b>v</b>×<b>B</b>，其中 <b>v</b>×<i>ẑ</i>=(<i>v<sub>y</sub></i>,−<i>v<sub>x</sub></i>,0)：</p><div class="eq"><i>mdv<sub>x</sub></i>/<i>dt</i>=<i>qBv<sub>y</sub></i>,&nbsp;<i>mdv<sub>y</sub></i>/<i>dt</i>=−<i>qBv<sub>x</sub></i></div><p>將第一式微分並利用第二式：<i>d</i><sup>2</sup><i>v<sub>x</sub></i>/<i>dt</i><sup>2</sup>=−ω<sup>2</sup><i>v<sub>x</sub></i>，ω=<i>qB</i>/<i>m</i>。故</p><div class="eq"><i>v<sub>x</sub></i>=<i>v</i>cosω<i>t</i>,&nbsp;<i>v<sub>y</sub></i>=−<i>v</i>sinω<i>t</i></div><p>速率維持為 <i>v</i>；再積分一次可得半徑 <i>v</i>/ω=<i>mv</i>/<i>qB</i> 的圓，當 <i>q</i>>0 時，從 +<i>z</i> 方向看去為順時針。週期不依賴 <i>v</i>：</p><div class="eq"><i>T</i>=2π/ω=2π<i>m</i>/<i>qB</i>=2π×1.67×10<sup>−27</sup>/(1.60×10<sup>−19</sup>×${p(M.CYC.B,2)})=${p(M.CYC.T*1e6,3)}μs</div><p>這就是頁面上 50V 與 200V 的質子每圈都在起點再次相遇的原因。</p>`, val: M.CYC.T },
  ],
  3: [
    { q: `在頁面的選擇器中（<i>E</i> = ${p(SE,0)} V/m 向下，<i>B</i> = ${p(SB,3)} T 指向頁面內），質子以 1.25<i>E</i>/<i>B</i> = ${p(P3.v/1e5,3)}×10<sup>5</sup> m/s 進入。它進入時所受的合力大小為`,
      choices: P3.nums.map(x => `${p(x, 1)} × 10<sup>−17</sup> N`), answer: 1, nums: P3.nums,
      why: `<p>這兩個力方向相反：<i>qE</i> 向下，<i>qvB</i> 向上。當速度快於 <i>E</i>/<i>B</i> 時，磁力勝出：</p><div class="eq"><i>F</i> = <i>q</i>(<i>vB</i> − <i>E</i>) = 1.60×10<sup>−19</sup> × (${p(P3.v*SB,0)} − ${p(SE,0)}) = ${p(P3.F/1e-17,1)}×10<sup>−17</sup> N，向上</div><p>把它們相加（${p(P3.nums[3],1)}）忽略了它們方向相反；而這正是此裝置的要點。</p>` },
    { q: `頁面中的慢質子以 ${p(P3b.vi/1e4,1)}×10<sup>4</sup> m/s 進入，離開極板時比進入時低 ${p(P3b.dy*100,3)} cm（朝向 − 極板）。它離開時的速度為`,
      choices: P3b.nums.map(x => `${p(x, 2)} × 10<sup>4</sup> m/s`), answer: 2, nums: P3b.nums,
      why: `<p>功為 ∫<b>F</b>·<i>d</i><b>s</b>。磁力始終 ⊥<i>d</i><b>s</b>，因此不做功；質子下降時，電場力做功 <i>qE</i>Δ<i>y</i>：</p><div class="eq">½<i>mv</i><sup>2</sup> = ½<i>mv</i><sub>i</sub><sup>2</sup> + <i>qE</i>Δ<i>y</i>&nbsp;→&nbsp;<i>v</i> = √(<i>v</i><sub>i</sub><sup>2</sup> + 2<i>qE</i>Δ<i>y</i>/<i>m</i>) = ${p(P3b.v/1e4,2)}×10<sup>4</sup> m/s</div><p>它加速，朝較低電位下落。它不會達到 <i>E</i>/<i>B</i> = ${p(v0/1e4,1)}×10<sup>4</sup> m/s；那不是任何物體會被驅使趨向的速度。</p>` },
  ],
  4: [
    { q: `頁面中的線圈（μ = ${p(mu,2)} A·m²，<i>B</i> = ${p(LB,2)} T）由 θ = 0（μ 沿 <b>B</b> 方向）緩慢轉至 θ = 180°。轉動它的人所做的功為`,
      choices: P4.nums.map(x => `${p(x, 3)} J`), answer: 3, nums: P4.nums,
      why: `<p>克服恢復力矩 μ<i>B</i> sinθ：</p><div class="eq"><i>W</i> = ∫<sub>0</sub><sup>π</sup>μ<i>B</i> sinθ<i>d</i>θ = 2μ<i>B</i> = ${p(P4.W,3)} J</div><p>與 Δ<i>U</i> = (−μ<i>B</i> cos180°) − (−μ<i>B</i> cos0) = 2μ<i>B</i> 相同。若停在 90°，則僅得到 μ<i>B</i>；τ<sub>max</sub>×π（${p(P4.nums[1],3)} J）把力矩視為恆定。</p>` },
    { q: `一條彎成半徑為 ${p(P4b.R*100,0)} cm 的半圓形導線，通有 ${p(P4b.I,1)} A 的電流，置於與其平面垂直的均勻 ${p(P4b.B,2)} T 磁場中。該半圓所受的淨磁力為`,
      choices: P4b.nums.map(x => `${p(x, 3)} N`), answer: 1, nums: P4b.nums,
      why: `<p>將 <i>d</i><b>F</b> = <i>Id</i><b>s</b> × <b>B</b> 相加。由於 <b>B</b> 均勻，可將其提出積分之外，而 ∫<i>d</i><b>s</b> 正是由一端指向另一端的直線向量，長度為 2<i>R</i>：</p><div class="eq"><i>F</i> = <i>I</i>(2<i>R</i>)<i>B</i> = ${P4b.I} × ${p(2*P4b.R,2)} × ${P4b.B} = ${p(P4b.F,3)} N</div><p>各小段的側向部分相互抵消，因此以弧長 π<i>R</i>（${p(P4b.nums[0],3)} N）計算會高估。</p>` },
  ],
  5: [
    { q: `本頁的導線（半徑 ${p(Aa*100,0)} cm，${AI} A 均勻分佈於其橫截面）。其<b>內部</b>距軸線 ${p(r5*1000,0)} mm 處的磁場為`,
      choices: P5.nums.map(x => `${p(x, 0)} μT`), answer: 3, nums: P5.nums,
      why: `<p>半徑為 <i>r</i> <<i>a</i> 的安培環路只包圍了電流的 <i>r</i><sup>2</sup>/<i>a</i><sup>2</sup> 這一比例：</p><div class="eq"><i>B</i>(2π<i>r</i>) = μ<sub>0</sub><i>I</i><i>r</i><sup>2</sup>/<i>a</i><sup>2</sup> &nbsp;→&nbsp; <i>B</i> = μ<sub>0</sub><i>Ir</i>/2π<i>a</i><sup>2</sup> = ${p(P5.B*1e6,0)} μT</div><p>μ<sub>0</sub><i>I</i>/2π<i>r</i>（${p(P5.nums[0],0)} μT）把圓外的電流也計算在內。</p>` },
    { q: `本頁的矩形（其 ${p(Fb*100,0)} cm 的邊與 ${AI} A 導線平行，近邊相距 ${p(Fa*100,0)} cm，寬為 ${p(Fc*100,0)} cm）。通過它的磁通量為`,
      choices: P5.fnums.map(x => `${p(x, 2)} μWb`), answer: 2, nums: P5.fnums,
      why: `<p><i>B</i> 在矩形上各處不同，因此加入細條 <i>bdr</i>：</p><div class="eq">Φ = ∫<sub><i>a</i></sub><sup><i>a</i>+<i>c</i></sup>(μ<sub>0</sub><i>I</i>/2π<i>r</i>)<i>bdr</i> = (μ<sub>0</sub><i>Ib</i>/2π) ln(${p((Fa+Fc)/Fa,0)}) = ${p(M.FLUX.phi*1e6,2)} μWb</div><p>以中間的 <i>B</i> 乘以面積得到 ${p(P5.fnums[0],2)} μWb：此值太低，因為 1/<i>r</i> 呈曲線變化，且最靠近的細條貢獻更多。</p>` },
  ],
  6: [
    { q: `本頁的圓環（<i>R</i>=${p(RR*100,0)} cm，圓心處 <i>B</i>=${p(Bc*1e6,1)} μT）。在其軸線上，距圓心 <i>z</i>=<i>R</i> 處，磁場為`,
      choices: P6.nums.map(x => `${p(x, 1)} μT`), answer: 0, nums: P6.nums,
      why: `<div class="eq"><i>B</i>=μ<sub>0</sub><i>IR</i><sup>2</sup>/2(<i>R</i><sup>2</sup>+<i>z</i><sup>2</sup>)<sup>3/2</sup>=(μ<sub>0</sub><i>I</i>/2<i>R</i>)·1/2<sup>3/2</sup>=${p(Bc*1e6,1)}/${p(2**1.5,3)}=${p(P6.B*1e6,1)}μT</div><p>並非一半：每一小段都遠了 √2 倍（1/<i>r</i><sup>2</sup>→½），而且其 d<b>B</b> 只有 cos45° 沿軸線方向（又一個 1/√2）。</p>` },
    { q: `一條載有 ${RI} A 電流的導線，沿著一條指向半徑 ${p(RR*100,0)} cm 的半圓圓心的直導線引入，繞過半圓後，再沿著一條筆直背離圓心的導線引出。圓心處的磁場為`,
      choices: P6b.nums.map(x => `${p(x, 1)} μT`), answer: 2, nums: P6b.nums,
      why: `<p>在直導線上，<i>d</i><b>l</b> 沿著 <b>r̂</b>，所以 <i>d</i><b>l</b>×<b>r̂</b>=0：它們毫無貢獻。在圓弧上，每一小段都垂直於 <b>r̂</b>，且距圓心 <i>R</i>：</p><div class="eq"><i>B</i>=(μ<sub>0</sub><i>I</i>/4π<i>R</i><sup>2</sup>)∫<i>dl</i>=(μ<sub>0</sub><i>I</i>/4π<i>R</i><sup>2</sup>)(π<i>R</i>)=μ<sub>0</sub><i>I</i>/4<i>R</i>=${p(P6b.B*1e6,1)}μT</div><p>是完整圓環的一半。把兩側的直導線當成半無限長導線來計入（${p(P6b.nums[1],1)} μT）正是陷阱。</p>` },
  ],
  7: [
    { q: '兩條長直平行導線分別載有 20 A 與 10 A 的電流，方向<b>相反</b>。與 20 A 導線所受的力相比，10 A 導線所受的力',
      choices: ['大小為兩倍，且導線互相吸引', '大小相同，且導線互相吸引', '大小相同，且導線互相排斥', '大小為一半，且導線互相排斥'], answer: 2,
      why: '<p><i>F</i>/<i>L</i>=μ<sub>0</sub><i>I</i><sub>1</sub><i>I</i><sub>2</sub>/2π<i>d</i> 對兩電流對稱（牛頓第三定律）：大小相等。方向相反的電流互相排斥。10 A 導線所處的磁場強一倍，但載流只有一半。</p>' },
    { q: `一根直棒在同一平面內<b>垂直</b>於一根長導線，距導線由${p(P7.r1*100,0)} cm 至 ${p(P7.r2*100,0)} cm。兩者皆載有本頁的${P7.I1} A。作用於直棒上的磁力為`,
      choices: P7.nums.map(x => `${p(x, 3)} mN`), answer: 0, nums: P7.nums,
      why: `<p>導線的磁場在各處均⊥直棒，但沿棒方向逐漸減弱，因此積分 <i>dF</i>=<i>I</i><sub>2</sub><i>B</i>(<i>r</i>)<i>dr</i>：</p><div class="eq"><i>F</i>=∫<sub><i>r</i><sub>1</sub></sub><sup><i>r</i><sub>2</sub></sup>(μ<sub>0</sub><i>I</i><sub>1</sub>/2π<i>r</i>)<i>I</i><sub>2</sub><i>dr</i>=(μ<sub>0</sub><i>I</i><sub>1</sub><i>I</i><sub>2</sub>/2π)ln(${p(P7.r2/P7.r1,0)})=${p(P7.F*1e3,3)}mN</div><p>以直棒中點處的<i>B</i>（${p(P7.nums[1],3)} mN）計算，會低估導線附近的強磁場。</p>` },
  ],
  8: [
    { q: `本頁的環形線圈（${TN} 匝，${TI} A；其核心距中心 ${p((R0-M.TOR.a)*100,0)} 至 ${p((R0+M.TOR.a)*100,0)} cm）。核心內在 <i>r</i>=${p(r8*100,0)} cm 處的磁場為`,
      choices: P8.nums.map(x => `${p(x, 1)} μT`), answer: 3, nums: P8.nums,
      why: `<p>核心內半徑為 <i>r</i> 的安培迴路與每一匝各交鏈一次：</p><div class="eq"><i>B</i>(2π<i>r</i>)=μ<sub>0</sub><i>NI</i>&nbsp;→&nbsp;<i>B</i>=μ<sub>0</sub><i>NI</i>/2π<i>r</i>=2×10<sup>−7</sup>×${TN}×${TI}/${r8}=${p(P8.B*1e6,1)}μT</div><p><i>B</i> 取決於 <i>r</i>：平均半徑 ${p(R0*100,0)} cm 給出 ${p(P8.nums[2],1)} μT，這僅是 ${p(R0*100,0)} cm 處的數值。</p>` },
    { q: `沿本頁螺線管將各電流環相加（<i>n</i>=${p(M.SOL.n,0)} 匝/米，<i>I</i>=${M.SOL.I} A，<i>L</i>=${p(SL*100,0)} cm，<i>R</i>=${p(SR*100,0)} cm），可得軸線上的 <i>B</i>=(μ<sub>0</sub><i>nI</i>/2)(cosθ<sub>1</sub>−cosθ<sub>2</sub>)。其中一個<b>端</b>的中心處磁場為`,
      choices: P8b.nums.map(x => `${p(x, 1)} μT`), answer: 0, nums: P8b.nums,
      why: `<p>每個薄片 <i>dx</i> 都是載有 <i>nIdx</i> 的圓環；其軸向磁場疊加如下：</p><div class="eq"><i>B</i>=∫<sub>0</sub><sup><i>L</i></sup>μ<sub>0</sub><i>nIR</i><sup>2</sup><i>dx</i>/2(<i>R</i><sup>2</sup>+<i>x</i><sup>2</sup>)<sup>3/2</sup>=(μ<sub>0</sub><i>nI</i>/2)·<i>L</i>/√(<i>L</i><sup>2</sup>+<i>R</i><sup>2</sup>)=${p(P8b.B*1e6,1)}μT</div><p>這幾乎正好是 μ<sub>0</sub><i>nI</i>=${p(M.SOL.B*1e6,1)} μT 的一半：從端點算起，線圈僅向一側延伸。</p>` },
  ],
};
