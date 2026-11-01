// Chapter 14, page by page (after the AP Physics C E&M organizer, Unit 7). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, SC } from './world.js';

const f = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sci = (x, n = 2) => { const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${f(m, n)}×10${String(e).split('').map(c => SUP[c]).join('')}`; };
const uT = x => f(x * 1e6, 1);

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], vlines = [], zero = false, cursor, label }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(Math.min(Math.max(y, y0), y1)).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const vl = vlines.map(([x, t]) => `<line class="grid" x1="${sx(x)}" x2="${sx(x)}" y1="${P.t}" y2="${H - P.b}"/><text class="ax" x="${sx(x) + 4}" y="${H - P.b - 6}">${t}</text>`).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const z = zero ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${z}${vl}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2 + 40}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursor ? `<circle class="cursor" r="4.5" cx="-20" cy="-20" data-cursor="${cursor}"/>` : ''}
  </svg>`;
}
const curve = (fn, a, b, n = 80) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });
// chart ranges, shared with main.js for the live cursors
export const R = {
  magnet: { x0: -40, x1: 40, y0: 0, y1: 300 },
  rhr: { x0: 0, x1: 180, y0: 0, y1: 2 },
  cyclo: { x0: 0, x1: 2.5, y0: 0, y1: 3 },
  selector: { x0: 0, x1: 2, y0: -2, y1: 2 },
  loop: { x0: 0, x1: 180, y0: -0.08, y1: 0.08 },
  ampere: { x0: 0, x1: 15, y0: 0, y1: 400 },
  ring: { x0: 0, x1: 36, y0: 0, y1: 45 },
  wires: { x0: 0, x1: 40, y0: 0, y1: 2 },
  solenoid: { x0: -40, x1: 40, y0: 0, y1: 300 },
};

// the closed surface round the magnet's N end, summed once
export const MAGFLUX = M.boxFlux(M.magnetB, M.MAG_BOX.c, M.MAG_BOX.h, 60);
const BC = M.magnetB([0, 0, 0])[0], SOLC = M.solB([0, 0, 0])[0];
const slow = c => sci(c, 1);

export const PAGES = [
{
    
    levels: ['junior', 'senior'],
    kicker: '第 14 章', title: '磁場', sub: '由運動電荷產生',
    body: `
      <p class="lede"><b>磁場</b> <b>B</b> 由運動電荷產生：電流，或磁鐵內部電子的自旋。單位是特斯拉（1 T = 10<sup>4</sup> 高斯）。</p>
      <p>磁鐵外部磁力線由 N 極指向 S 極；內部由 S 回到 N，因此每條線都自行閉合。不存在磁單極（把磁鐵切開會得到兩塊磁鐵），所以穿過任意封閉曲面</p>
      <div class="eq">∮ <b>B</b> · d<b>A</b> = 0</div>
      <p>這塊 ${f(M.MAG.L * 100, 0)} cm 的磁鐵，按安培的圖像畫成側面一層電流。每條磁力線都由該電流的畢奧－薩伐爾疊加描出。</p>
      <div class="charts">${chart({ ...R.magnet, xlabel: '沿軸 x (cm)', ylabel: 'B (mT)', label: '磁鐵軸上的磁場', vlines: [[-10, 'S'], [10, 'N']],
        series: [{ pts: curve(x => M.magnetB([x / 100, 0, 0])[0] * 1000, -40, 40, 120) }] })}</div>
      <p class="hintline">點擊磁鐵，可在 N 極端套上封閉盒子。一格為 10 cm。</p>
`,
    cam: { target: [STATIONS.magnet, 2.0, 0], az: -18, el: 20, dist: 20 }, lit: 'magnet', scene: 'magnet', look: {},
    fig: '磁力線由 N 出、由 S 入',
  },
{
    
    levels: ['senior'],
    kicker: '14.1', title: '磁場力', sub: 'F = qv × B',
    body: `
      <p class="lede">磁場只對<b>運動</b>電荷施力，且方向側向：垂直於 <b>v</b> 與 <b>B</b>。</p>
      <div class="eq"><b>F</b> = <i>q</i> <b>v</b> × <b>B</b>, &nbsp; <i>F</i> = <i>qvB</i> sin θ</div>
      <p><b>右手定則：</b>拇指沿 <b>v</b>，食指沿 <b>B</b>；中指指向正電荷所受的 <b>F</b>，負電荷則反向。若沿 <b>B</b> 運動，則無力。</p>
      <p><b>F</b> 永遠垂直於 <b>v</b>，因此 <b>B</b> <b>不做功</b>：它會改變方向，卻不改變速率。若同時有電場，則 <b>F</b> = <i>q</i><b>E</b> + <i>q</i><b>v</b> × <b>B</b>（勞侖茲力）。</p>
      <div class="charts">${chart({ ...R.rhr, xlabel: 'v 與 B 的夾角 θ (°)', ylabel: 'F (10⁻¹⁴ N)', cursor: 'rhr', label: '力隨角度變化', series: [{ pts: curve(d => M.RHR.Fmax * Math.sin(d * Math.PI / 180) / 1e-14, 0, 180) }] })}</div>
      <p class="hintline">點擊可把 <b>v</b> 拆成沿 <b>B</b> 與垂直於 <b>B</b> 的分量。<i>v</i> = ${sci(M.RHR.v, 1)} m/s，<i>B</i> = ${f(M.RHR.B)} T；最大 <b>F</b> 為 ${sci(M.RHR.Fmax, 1)} N（圖上約 1.5 格）。</p>
`,
    cam: { target: [STATIONS.rhr, 1.9, 0], az: -36, el: 22, dist: 17 }, lit: 'rhr', scene: 'rhr', look: {},
    fig: '質子與電子，速率相同',
  },
{
    
    levels: ['senior'],
    kicker: '14.2', title: '在磁場中繞圈', sub: 'r = mv/qB',
    body: `
      <p class="lede">在均勻 <b>B</b> 中，力始終垂直於速度，成為向心力：電荷以恆定速率繞圈。</p>
      <div class="eq"><i>qvB</i> = <i>mv</i>²/<i>r</i> → <i>r</i> = <i>mv</i>/<i>qB</i>, &nbsp;ω = <i>qB</i>/<i>m</i></div>
      <p>兩個質子分別經 50 V 與 200 V 由靜止加速（動能 50 eV 與 200 eV，滿足 <i>q</i>Δ<i>V</i> = ½<i>mv</i>²）。能量為四倍，速率為兩倍，半徑亦為兩倍：${f(M.CYC.r[0] * 100)} cm 與 ${f(M.CYC.r[1] * 100)} cm。</p>
      <p>但週期 <i>T</i> = 2π<i>m</i>/<i>qB</i> = ${f(M.CYC.T * 1e6, 3)} μs 兩者相同，因此每圈都在起點相遇。<b>迴旋加速器</b>正利用此點，以 ${f(M.CYC.f / 1e6)} MHz 在縫隙處加速。</p>
      <div class="charts">${chart({ ...R.cyclo, xlabel: 'v (10⁵ m/s)', ylabel: 'r (cm)', label: '半徑隨速率', series: [{ pts: curve(v => M.MP * v * 1e5 / (M.QE * M.CYC.B) * 100, 0, 2.5) }],
        marks: M.CYC.v.map((v, i) => [v / 1e5, M.CYC.r[i] * 100, M.CYC.dV[i] + ' V']) })}</div>
      <p class="hintline">點擊可看力與半徑。<i>B</i> = ${f(M.CYC.B)} T，向下。一格為 1 cm；時間以 ${slow(M.CYC.show / M.CYC.T)}× 放慢。</p>
`,
    cam: { target: [STATIONS.cyclo, 0.8, 0], az: -14, el: 40, dist: 17 }, lit: 'cyclo', scene: 'cyclo', look: {},
    fig: '速率加倍，半徑加倍，週期相同',
  },
{
    
    levels: ['senior'],
    kicker: '14.3', title: '正交的 E 與 B', sub: '速度選擇器',
    body: `
      <p class="lede">平行板間的 <b>E</b> 以 <i>qE</i> 把質子推向 − 極板；垂直紙面的 <b>B</b> 以 <i>qvB</i> 把它推回。二者在某一速率下抵消：</p>
      <div class="eq"><i>qE</i> = <i>qvB</i> &nbsp;→&nbsp; <i>v</i> = <i>E</i>/<i>B</i></div>
      <p>此處 <i>E</i> = ${f(M.SEL.E, 0)} V/m，<i>B</i> = ${f(M.SEL.B, 3)} T，故 ${sci(M.SEL.v0, 1)} m/s 時走直線。較慢時 <i>qE</i> 勝出而向下彎；較快時 <i>qvB</i> 勝出而向上彎。</p>
      <p><b>霍爾效應</b>是導線中的同一平衡：電荷堆積到一邊，直至 <i>qE</i> = <i>qv</i><sub>d</sub><i>B</i>，留下 Δ<i>V</i><sub>H</sub> = <i>v</i><sub>d</sub><i>Bd</i> = <i>IBd</i>/<i>nqA</i>。</p>
      <div class="charts">${chart({ ...R.selector, zero: true, xlabel: 'v (10⁵ m/s)', ylabel: 'qvB − qE，向上 (10⁻¹⁶ N)', label: '淨力隨速率',
        series: [{ pts: curve(v => M.QE * (v * 1e5 * M.SEL.B - M.SEL.E) / 1e-16, 0, 2) }], marks: M.SEL.k.map((k, i) => [k, M.QE * M.SEL.E * (k - 1) / 1e-16, ['0.8', 'E/B', '1.25'][i], i === 1 ? -26 : 6, i === 1 ? -8 : 14]) })}</div>
      <p class="hintline">點擊可看每個質子上的 <i>q</i><b>E</b> 與 <i>q</i><b>v</b> × <b>B</b>。一格為 1 cm。</p>
`,
    cam: { target: [STATIONS.selector + 0.4, 2.5, 0], az: -22, el: 13, dist: 31 }, lit: 'selector', scene: 'selector', look: {},
    fig: '僅 v = E/B 走直線',
  },
{
    
    levels: ['senior'],
    kicker: '14.4', title: '電流所受的力', sub: '與線圈力矩',
    body: `
      <p class="lede">電流是大量運動電荷。以 <i>I</i> = <i>nqAv</i><sub>d</sub>，導線中電荷 <i>nqAL</i> 所受的力成為</p>
      <div class="eq"><b>F</b> = <i>I</i> <b>L</b> × <b>B</b></div>
      <p>均勻場中的線圈，相對兩邊的力互相抵消，但兩條豎邊沿不同作用線反向推，於是產生力矩：</p>
      <div class="eq"><b>τ</b> = <b>μ</b> × <b>B</b>, &nbsp; <b>μ</b> = <i>I</i><b>A</b></div>
      <p>正如電偶極有 <i>U</i> = −<b>p</b> · <b>E</b>，此處 <i>U</i> = −<b>μ</b> · <b>B</b>：沿 <b>B</b> 最低（穩定），反向最高（不穩定）。本圖 μ = ${f(M.LOOP.mu, 2)} A·m²。</p>
      <div class="charts">${chart({ ...R.loop, zero: true, xlabel: 'μ 與 B 的夾角 θ (°)', ylabel: 'τ (N·m), U (J)', cursor: 'loop', label: '力矩與能量隨角度',
        series: [{ pts: curve(d => M.LOOP.tmax * Math.sin(d * Math.PI / 180), 0, 180), tag: [80, M.LOOP.tmax, 'τ'] }, { cls: 'trend', pts: curve(M.loopU, 0, 180), tag: [150, M.loopU(150), 'U'] }] })}</div>
      <p class="hintline">線圈緩慢轉過各角度。點擊可看各邊受力（每 N 佔 4 格）。</p>
`,
    cam: { target: [STATIONS.loop, 2.3, 0], az: -32, el: 16, dist: 20 }, lit: 'loop', scene: 'loop', look: {},
    fig: `${f(M.LOOP.a * 100, 0)} × ${f(M.LOOP.b * 100, 0)} cm, ${f(M.LOOP.I, 1)} A, B = ${f(M.LOOP.B)} T`,
  },
{
    
    levels: ['senior'],
    kicker: '14.5', title: '安培定律', sub: '長直導線周圍的 B',
    body: `
      <p class="lede">長直導線周圍磁力線成圓：拇指沿 <i>I</i>，其餘手指捲曲方向即 <b>B</b>。</p>
      <div class="eq">∮ <b>B</b> · d<b>s</b> = μ<sub>0</sub><i>I</i><sub>enc</sub></div>
      <p>在圓周上 <b>B</b> ∥ d<b>s</b> 且 <i>B</i> 恆定：<i>B</i>(2π<i>r</i>) = μ<sub>0</sub><i>I</i>，故 <i>B</i> = μ<sub>0</sub><i>I</i>/2π<i>r</i>。粗導線內部則為 <i>B</i> = μ<sub>0</sub><i>Ir</i>/2π<i>a</i>²。</p>
      <p>穿過長方形區域，把場分成細條積分：∫<sub><i>a</i></sub><sup><i>a</i>+<i>c</i></sup> (μ<sub>0</sub><i>I</i>/2π<i>r</i>) <i>b</i> d<i>r</i>，即</p>
      <div class="eq">Φ = (μ<sub>0</sub><i>Ib</i>/2π) ln((<i>a</i> + <i>c</i>)/<i>a</i>)</div>
      <div class="charts">${chart({ ...R.ampere, xlabel: 'r (cm)', ylabel: 'B (μT)', cursor: 'ampere', label: '粗導線旁 B 隨距離', vlines: [[1, 'a']],
        series: [{ pts: curve(r => M.ampereB(r / 100) * 1e6, 0, 15, 150) }] })}</div>
      <p class="hintline">點擊導線看 d<b>s</b>，點擊長方形看細條。<b>B</b>：每 100 μT 約 0.8 格。</p>
`,
    cam: { target: [STATIONS.ampere + 0.7, 3.3, 0], az: 34, el: 21, dist: 24 }, lit: 'ampere', scene: 'ampere', look: {},
    fig: `${f(M.AMP.I, 0)} A up a long wire`,
  },
{
    
    levels: ['senior'],
    kicker: '14.6', title: '畢奧－薩伐爾定律', sub: '逐段疊加',
    body: `
      <p class="lede">沒有對稱性時，像庫侖定律疊加電荷一樣，把導線每一小段 d<b>l</b> 的場加起來。<b>r̂</b> 由 d<b>l</b> 指向 P：</p>
      <div class="eq">d<b>B</b> = (μ<sub>0</sub><i>I</i>/4π) d<b>l</b> × <b>r̂</b> / <i>r</i>²</div>
      <p>在圓環軸上，每段 d<b>l</b> ⊥ <b>r</b>。d<b>B</b> 的側向分量沿環抵消；沿軸分量（cos θ = <i>R</i>/<i>r</i>）相加：</p>
      <div class="eq"><i>B</i> = μ<sub>0</sub><i>IR</i>² / 2(<i>R</i>² + <i>z</i>²)<sup>3/2</sup></div>
      <p>在圓心，μ<sub>0</sub><i>I</i>/2<i>R</i> = ${uT(M.RING.Bc)} μT。遠處近似 μ<sub>0</sub><i>IR</i>²/2<i>z</i>³：偶極的 1/<i>z</i>³。</p>
      <div class="charts">${chart({ ...R.ring, xlabel: '沿軸 z (cm)', ylabel: 'B (μT)', cursor: 'ring', label: '圓環軸上的磁場',
        series: [{ cls: 'trend', pts: curve(z => M.ringFar(z / 100) * 1e6, 12, 36), tag: [24, 13, 'μ₀IR²/2z³'] }, { pts: curve(z => M.ringAxis(z / 100) * 1e6, 0, 36) }] })}</div>
      <p class="hintline">點擊圓環可看 ${M.RING.pieces} 段 d<b>l</b> 及其 d<b>B</b>（畫長 5×）。<b>B</b>：每 20 μT 一格。</p>
`,
    cam: { target: [STATIONS.ring + 1.0, 2.5, 0], az: -38, el: 14, dist: 22 }, lit: 'ring', scene: 'ring', look: {},
    fig: `R = ${f(M.RING.R * 100, 0)} cm, I = ${f(M.RING.I, 0)} A`,
  },
{
    
    levels: ['senior'],
    kicker: '14.7', title: '平行導線', sub: '同向電流相吸',
    body: `
      <p class="lede">每根導線都處在另一根的磁場中，因此各受 <b>F</b> = <i>I</i> <b>L</b> × <b>B</b>。</p>
      <div class="eq"><i>B</i><sub>1</sub> = μ<sub>0</sub><i>I</i><sub>1</sub>/2π<i>d</i> &nbsp;→&nbsp; <i>F</i>/<i>L</i> = μ<sub>0</sub><i>I</i><sub>1</sub><i>I</i><sub>2</sub>/2π<i>d</i></div>
      <p>各通 ${f(M.WIRES.I, 0)} A、相距 ${f(M.WIRES.d * 100, 0)} cm 時，每米受力 ${f(M.WIRES.FL * 1000)} mN。<b>同向</b>電流相吸；<b>反向</b>電流相斥——與電荷相反。</p>
      <p>磁力線亦顯示此點：同向時兩線之間場抵消（中點 <i>B</i> = 0），外側線包住兩者；反向時場線擠在中間。</p>
      <div class="charts">${chart({ ...R.wires, xlabel: 'd (cm)', ylabel: 'F/L (mN/m)', label: '單位長度受力隨距離',
        series: [{ pts: curve(d => M.MU0 * M.WIRES.I ** 2 / (2 * Math.PI * d / 100) * 1000, 2, 40) }], marks: [[M.WIRES.d * 100, M.WIRES.FL * 1000, f(M.WIRES.FL * 1000) + ' mN/m']] })}</div>
      <p class="hintline">點擊一對導線，可看彼此感受到的磁場。力：每 mN/m 佔 2 格。</p>
`,
    cam: { target: [(STATIONS.same + STATIONS.opposite) / 2, 2.0, 0], az: -10, el: 30, dist: 34 }, lit: 'same', scene: 'wires', look: {},
    fig: '先同向，後反向',
  },
{
    
    levels: ['junior', 'senior'],
    kicker: '14.8', title: '螺線管', sub: '與螺繞環：均勻磁場',
    body: `
      <p class="lede">把許多圓環疊起來：內部場相加，外部近乎抵消。這就是<b>螺線管</b>。</p>
      <p>取半在管內的長方形迴路：只有內側邊有貢獻（兩端 <b>B</b> ⊥ d<b>s</b>，外側 <i>B</i> ≈ 0），故 <i>BL</i> = μ<sub>0</sub><i>NI</i>。以每米匝數 <i>n</i> = <i>N</i>/<i>L</i>：</p>
      <div class="eq"><i>B</i> = μ<sub>0</sub><i>nI</i> &nbsp;&nbsp; 螺繞環： <i>B</i> = μ<sub>0</sub><i>NI</i>/2π<i>r</i></div>
      <p>此處 μ<sub>0</sub><i>nI</i> = ${uT(M.SOL.B)} μT；畢奧－薩伐爾疊加得 ${uT(SOLC)} μT，因線圈長度僅約 ${f(M.SOL.L / M.SOL.R, 1)} 個半徑。彎成環即為<b>螺繞環</b>：內部 <i>B</i>(2π<i>r</i>) = μ<sub>0</sub><i>NI</i>，孔洞與外部為 0。</p>
      <div class="charts">${chart({ ...R.solenoid, xlabel: '沿軸 x (cm)', ylabel: 'B (μT)', label: '螺線管軸上的磁場', vlines: [[-20, '端'], [20, '端']],
        series: [{ cls: 'trend', pts: [[-20, M.SOL.B * 1e6], [20, M.SOL.B * 1e6]], tag: [-6, M.SOL.B * 1e6 + 6, 'μ₀nI'] }, { pts: curve(x => M.solB([x / 100, 0, 0])[0] * 1e6, -40, 40, 100) }] })}</div>
      <p class="hintline">點擊螺線管看安培長方形，點擊螺繞環看內部。<b>B</b>：每 100 μT 一格。</p>
`,
    cam: { target: [(STATIONS.solenoid + STATIONS.toroid) / 2 - 0.4, 1.8, 0], az: -10, el: 30, dist: 31 }, lit: 'solenoid', scene: 'solenoid', look: {},
    fig: `${M.SOL.N} turns and ${M.TOR.N} turns, ${f(M.SOL.I, 1)} A`,
  }
];

// ---------- click a scene: what it breaks into ----------
const deg = Math.PI / 180;
export const PLATES = {
  magnet: {
    title: '條形磁鐵', sub: '每條磁力線自行閉合', text: `磁鐵漸隱，使內部磁力線顯現，並在其北極（N極）端套上一個封閉盒子。磁力線從盒子的外表面離開，並經過切割磁鐵的那個面折返。出與入相互抵消：磁極不會單獨存在。`,
    facts: () => [['flux out', `${sci(MAGFLUX.out)} Wb`], ['flux in', `${sci(MAGFLUX.in)} Wb`], ['total ∮B·dA', `${f(Math.abs(MAGFLUX.total / MAGFLUX.out) * 100, 3)}% of the flux out: 0`], ['B at the centre', `${f(BC * 1000, 0)} mT`]] },
  rhr: {
    title: '電荷在B中運動', sub: 'F=qv×B', text: `<b>v</b>分解為沿<b>B</b>方向的分量與垂直於它的分量（灰色）。只有垂直分量受力：<i>F</i>=<i>qv</i><sub>⊥</sub><i>B</i>=<i>qvB</i>sinθ。<b>F</b>同時垂直於<b>v</b>與<b>B</b>。電子帶負電荷，受力方向相反。`,
    facts: s => { const d = M.rhrAngle(s.clock), v = M.RHR.v; return [['θ', `${f(d, 0)}°`], ['v along B', `${sci(Math.max(Math.abs(v * Math.cos(d * deg)), 1), 2)} m/s`], ['v across B', `${sci(Math.max(v * Math.sin(d * deg), 1), 2)} m/s`], ['F = qv⊥B', `${sci(Math.max(M.RHR.Fmax * Math.sin(d * deg), 1e-30), 2)} N`], ['work done by F', '0']]; } },
  cyclo: {
    title: '質子繞圈', sub: '任何速率下週期相同', text: `力（紅色）指向圓的圓心，垂直於<b>v</b>，因此速率永不改變。較快的質子需要較大的圓，但以相同時間走完一圈。`,
    facts: s => { const t = M.cycTime(s.clock) % M.CYC.T; return [['t in this turn', `${f(t * 1e6, 3)} μs of ${f(M.CYC.T * 1e6, 3)} μs`], ['F on the 50 V proton', `${sci(M.QE * M.CYC.v[0] * M.CYC.B)} N`], ['F on the 200 V proton', `${sci(M.QE * M.CYC.v[1] * M.CYC.B)} N`], ['ω = qB/m', `${sci(M.CYC.omega)} rad/s`]]; } },
  selector: {
    title: '正交的E與B', sub: '僅v=E/B經直線前進', text: `對兩板之間的每個質子：<i>q</i><b>E</b>向下，對所有質子相同；<i>q</i><b>v</b>×<b>B</b>向上，隨速率增大。兩者之和（紅色）僅在<i>v</i>=<i>E</i>/<i>B</i>時為零。只有<b>E</b>做功，因此較慢的質子在落向−板時加速。`,
    facts: () => [['qE (all three)', `${sci(M.QE * M.SEL.E)} N`], ['qvB at 0.8 E/B', `${sci(0.8 * M.QE * M.SEL.E)} N`], ['qvB at E/B', `${sci(M.QE * M.SEL.E)} N`], ['qvB at 1.25 E/B', `${sci(1.25 * M.QE * M.SEL.E)} N`]] },
  loop: {
    title: '磁場B中的電流環', sub: '淨力為零，但有轉矩', text: `每一邊受力<b>F</b>=<i>I</i><b>L</b>×<b>B</b>。豎直兩邊的<b>F</b><sub>1</sub>與<b>F</b><sub>3</sub>恆為<i>IbB</i>，但作用在不同線上，因此使線圈扭轉。上邊與下邊的<b>F</b><sub>2</sub>與<b>F</b><sub>4</sub>大小相等、方向相反且作用在同一線上：只會拉伸或壓縮線圈。彎曲導線亦無不同：半徑為<i>R</i>的半圓受力∫<i>I</i>d<b>s</b>×<b>B</b>=2<i>IRB</i>，與其直弦所得相同。`,
    facts: s => { const d = M.loopAngle(s.clock), S = M.loopSides(d); return [['θ', `${f(d, 0)}°`], ['F₁, F₃ (vertical sides)', `${f(M.len(S[0].F), 3)} N each`], ['F₂, F₄ (top, bottom)', `${f(M.len(S[1].F), 3)} N each`], ['ΣF', '0 N'], ['τ = μB sin θ', `${f(M.len(M.loopTorque(d)), 4)} N·m`]]; } },
  ampere: {
    title: '載流長直導線', sub: '∮B·ds=μ₀I', text: `安培環路被分割成若干小段d<b>s</b>。在每一段上，<b>B</b>的方向與d<b>s</b>相同且大小不變，因此∮<b>B</b>·d<b>s</b>正為<i>B</i>×2π<i>r</i>。當環路擴大時，<i>B</i>相應減小：總值保持為μ<sub>0</sub><i>I</i>。`,
    facts: s => { const r = M.ampR(s.clock), B = M.ampereB(r); return [['r', `${f(r * 100, 1)} cm`], ['B', `${uT(B)} μT`], ['2πr', `${f(2 * Math.PI * r * 100, 1)} cm`], ['B · 2πr', `${sci(B * 2 * Math.PI * r)} T·m`], ['μ₀I', `${sci(M.MU0 * M.AMP.I)} T·m`]]; } },
  flux: {
    title: '導線旁的長方形', sub: 'Φ=∫Bbdr', text: `長方形被分割成${M.FLUX.strips}條寬度為d<i>r</i>的窄條。<i>B</i>在每條上近乎不變，故每條的磁通量為<i>B</i>(<i>r</i>)<i>b</i>d<i>r</i>。越近的窄條貢獻越多。把它們相加便是積分。`,
    facts: () => { const s = M.fluxStrips(); return [...s.map((x, i) => [`strip ${i + 1} (r ${f((M.FLUX.a + (i + 0.5) * M.FLUX.c / M.FLUX.strips) * 100, 1)} cm)`, `${f(x * 1e9, 0)} nWb`]), ['sum', `${f(s.reduce((a, b) => a + b, 0) * 1e9, 0)} nWb`], ['(μ₀Ib/2π) ln((a+c)/a)', `${f(M.FLUX.phi * 1e9, 0)} nWb`]]; } },
  ring: {
    title: '圓形載流環', sub: '每段dl貢獻一個dB', text: `線圈分成十二小段d<b>l</b>，每段在P點有其d<b>B</b>（灰色）。每個d<b>B</b>同時垂直於d<b>l</b>與<b>r</b>，故合起來構成一個圓錐。沿環路繞行，側向分量成對抵消，沿軸的分量相加成<b>B</b>。`,
    facts: s => { const z = M.ringZ(s.clock), p = M.ringPieces(z), one = M.len(p[0].dB); return [['z', `${f(z * 100, 1)} cm`], ['each |dB|', `${f(one * 1e6, 2)} μT`], ['each along the axis', `${f(p[0].dB[0] * 1e6, 2)} μT`], [`sum of ${p.length}`, `${uT(p.reduce((a, q) => a + q.dB[0], 0))} μT`], ['μ₀IR²/2(R²+z²)^{3/2}', `${uT(M.ringAxis(z))} μT`]]; } },
  same: { text: `在導線2處，導線1的磁場<b>B</b><sub>1</sub>垂直於該導線。<i>I</i><sub>2</sub><b>L</b>×<b>B</b><sub>1</sub>指向導線1。反之亦然，構成一對大小相等、方向相反的力。`,
    facts: () => [['B₁ at wire 2', `${uT(M.ampereB(M.WIRES.d))} μT`], ['F/L on each', `${f(M.WIRES.FL * 1000)} mN/m`], ['B midway', '0'], ['direction', 'toward each other']] },
  opposite: { text: `把<i>I</i><sub>2</sub>反向後，<i>I</i><sub>2</sub><b>L</b>×<b>B</b><sub>1</sub>亦隨之反向：兩導線互相排斥。兩者之間的兩個磁場現在相加。`,
    facts: () => [['B₁ at wire 2', `${uT(M.ampereB(M.WIRES.d))} μT`], ['F/L on each', `${f(M.WIRES.FL * 1000)} mN/m`], ['B midway', `${uT(2 * M.ampereB(M.WIRES.d / 2))} μT`], ['direction', 'apart']] },
  solenoid: {
    title: '螺線管', sub: '內部B=μ₀nI，均勻', text: `各匝漸隱以顯示內部磁場：近乎均勻、近乎平行。虛線安培長方形包圍${M.rectTurns()}匝。只有沿軸的一邊對∮<b>B</b>·d<b>s</b>有貢獻。`,
    facts: () => { const L = 2 * M.SOL_RECT.h, N = M.rectTurns(); return [['turns enclosed N', `${N}`], ['side inside, L', `${f(L * 100, 0)} cm`], ['μ₀NI / L', `${uT(M.MU0 * N * M.SOL.I / L)} μT`], ['∮B·ds, summed from the model', `${sci(M.lineIntegral(M.solB, M.rectPath(M.SOL_RECT.h, M.SOL_RECT.Y, 200)))} T·m`], ['μ₀NI', `${sci(M.MU0 * N * M.SOL.I)} T·m`]]; } },
  toroid: {
    title: '螺繞環', sub: 'B=μ₀NI/2πr，僅存在於內部', text: `各匝漸隱。虛線圓從孔中出發，穿過環芯，再伸至外部。其<b>B</b>箭頭僅在處於繞組內部時出現，該處它恰好包圍全部${M.TOR.N}匝。`,
    facts: s => { const r = M.torR(s.clock); return [['r', `${f(r * 100, 1)} cm`], ['current enclosed', r > M.TOR.R0 - M.TOR.a && r < M.TOR.R0 + M.TOR.a ? `NI = ${f(M.TOR.N * M.TOR.I, 0)} A` : '0'], ['μ₀NI/2πr', `${uT(M.torIdeal(r))} μT`], ['from the model', `${uT(M.len(M.torB([r, 0, 0])))} μT`]]; } },
};
