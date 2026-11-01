// Chapter 13, page by page (after the AP Physics C E&M organizer, Units 5 and 6). Text and a chart
// on the left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, HS, MAG, SPEEDUP, LEN_SCALE, K_DOT } from './world.js';

const f = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const sci = (x, n = 2) => { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(n)} × 10<sup>${e < 0 ? '−' : ''}${Math.abs(e)}</sup>`; };
const heightNote = `高度：每 ${f(1 / HS, 0)} V 一格。`;

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], vlines = [], cursors = [], label }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(Math.min(Math.max(y, y0), y1)).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const vl = vlines.map(([x, t]) => `<line class="grid" x1="${sx(x)}" x2="${sx(x)}" y1="${P.t}" y2="${H - P.b}"/><text class="ax" x="${sx(x)}" y="${H - 9}" text-anchor="middle">${t}</text>`).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const cs = cursors.map(c => `<circle class="cursor" r="4.5" cx="-20" cy="-20" data-cursor="${c}"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${vl}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2 + 40}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cs}
  </svg>`;
}
const curve = (fn, a, b, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });
// chart ranges, shared with main.js for the live cursors
export const R = {
  drude: { x0: 0, x1: 4, y0: 0, y1: 2.4 },
  res: { x0: 0, x1: 2, y0: 0, y1: 12 },
  energy: { x0: 0, x1: M.BULB.run, y0: 0, y1: 60 },
  term: { x0: 0, x1: 6, y0: 0, y1: 12 },
  pload: { x0: 0, x1: 8, y0: 0, y1: 20 },
  rc: { x0: 0, x1: M.RC.cycle, y0: -100, y1: 100 },
};

const { CU, RC } = M;
const ohmI = M.OHM.E / M.OHM.R, bulbI = M.BULB.E / M.BULB.R, bulbP = bulbI * M.BULB.E;
const kr = M.solve(M.KIRCH.edges, 'bl'), kI = n => M.edgeI(M.KIRCH, kr, n), kd = M.solve(M.kirchEdges(false), 'bl');

export const PAGES = [
  {
    levels: ['junior', 'senior'],
    kicker: '第 13 章', title: '電流', sub: '電荷的流動',
    body: `
      <p class="lede">電池把兩個端子保持固定的電位差。用導線一接，金屬內部的電場便推着自由電荷沿線前進：這就是<b>電流</b>。</p>
      <div class="eq"><i>I</i> = d<i>q</i>/d<i>t</i> = <i>nqAv</i><sub>d</sub>,  <i>J</i> = <i>I</i>/<i>A</i> = <i>nqv</i><sub>d</sub> = σ<i>E</i></div>
      <p>1 A = 1 C/s，按<i>正</i>電荷移動的方向計算，電子實際向反方向漂移。長 Δ<i>x</i> = <i>v</i><sub>d</sub>Δ<i>t</i> 的一段金屬容有 <i>nqA</i>Δ<i>x</i> 的電荷，這些電荷在 Δ<i>t</i> 內全部跨過 <i>A</i>。一般而言 <i>I</i> = ∫<b>J</b>·d<b>A</b>。</p>
      <table class="data">
        <tr><td>1 mm² 銅線中的 1 A：<i>n</i></td><td>${sci(CU.n, 1)} m⁻³</td></tr>
        <tr><td>漂移速度 <i>v</i><sub>d</sub></td><td>${f(CU.vd * 1e3, 3)} mm/s</td></tr>
      </table>
      <p>每顆電子不斷加速，撞上離子便停，再重新啟動（德魯德模型），平均成 <i>v</i><sub>d</sub>：每米要 ${f(CU.hours, 1)} 小時。電燈仍是一亮即亮，因為電場沿導線疾走。</p>
      <div class="charts">${chart({ ...R.drude, xlabel: '時間（碰撞次數）', ylabel: '單一電子的速率 ÷ v_d', cursors: ['drude'], label: '一顆電子的鋸齒狀速率，平均即漂移速度',
        series: [{ pts: curve(t => M.drudeV(t, 1, 1), 0, 3.999, 400) }, { cls: 'trend', pts: [[0, 1], [4, 1]], tag: [3.25, 1, 'v_d'] }] })}</div>
      <p class="hintline">點擊導線可看跨過 <i>A</i> 的那段。按 ${MAG} 倍實物繪畫；漂移快 ${SPEEDUP} 倍。</p>`,
    cam: { target: [STATIONS.wire, 0.95, 0], az: -16, el: 14, dist: 21 }, lit: 'wire', scene: 'wire', look: {},
    fig: '電子漂移方向與電流相反',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '13.1', title: '電阻', sub: '阻礙電流',
    body: `
      <p class="lede"><b>電阻</b> <i>R</i> = Δ<i>V</i>/<i>I</i>，單位歐姆（V/A），量度把電流推過一件東西有多難。</p>
      <div class="eq"><i>R</i> = ρ<i>L</i>/<i>A</i> = <i>L</i>/σ<i>A</i></div>
      <p>材料決定<b>電阻率</b> ρ = 1/σ（銅 ${sci(M.RHO.copper, 2)}，鎳鉻合金 ${sci(M.RHO.nichrome, 2)} Ω·m）；形狀決定 <i>L</i>/<i>A</i>。長兩倍：兩段串聯，<i>R</i> 兩倍。直徑兩倍：四股並排，<i>R</i> 是四分之一。</p>
      <p>兩條鎳鉻線直徑 ${f(M.RES.dThin * 1e3, 1)} 和 ${f(M.RES.dThick * 1e3, 1)} mm，各受 1.5 V。兩線的載流子漂移同樣快（<i>E</i> = Δ<i>V</i>/<i>L</i> 相同）；粗的那條有四倍之多。</p>
      <div class="charts">${chart({ ...R.res, xlabel: '長度 L (m)', ylabel: 'R (Ω)', cursors: ['thin', 'thick'], label: '兩種直徑下電阻對長度',
        series: [{ pts: curve(M.rThin, 0, 2, 4), tag: [1.15, M.rThin(1.15), 'd'] }, { pts: curve(M.rThick, 0, 2, 4), tag: [1.5, M.rThick(1.5), '2d'] }] })}</div>
      <p class="hintline">點擊可把粗線分成四股。長度每米 ${LEN_SCALE * 100} cm；粗細經放大。</p>`,
    cam: { target: [STATIONS.resist - 0.5, 0.35, 0], az: -14, el: 30, dist: 15 }, lit: 'wires', scene: 'wires', look: {},
    fig: '同樣 1.5 V，形狀不同',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '13.2', title: '歐姆定律', sub: 'V = IR',
    body: `
      <p class="lede">歐姆導體的電流與其兩端電壓成正比；比率就是它的電阻。</p>
      <p>由金屬內的歐姆定律 <i>J</i> = σ<i>E</i> 出發，沿導線 <i>E</i> = Δ<i>V</i>/<i>L</i>：</p>
      <div class="eq"><i>I</i> = <i>JA</i> = σ<i>A</i>Δ<i>V</i>/<i>L</i>  ⟹  Δ<i>V</i> = <i>IR</i></div>
      <p>${M.OHM.E} V 加於 ${M.OHM.R} Ω，得 ${f(ohmI, 1)} A。圖上每一點按其電位畫出高度：電池把電荷抬升 ${M.OHM.E} V，理想導線保持水平，電阻器是一道向下斜坡。順電流通過電阻器，你會<i>失去</i>電位。</p>
      <div class="charts">${chart({ x0: 0, x1: 9, y0: 0, y1: 3, xlabel: 'ΔV (V)', ylabel: 'I (A)', label: '3 Ω 電阻器的電流對電壓：一條直線',
        series: [{ pts: [[0, 0], [9, 3]], tag: [6.6, 2.15, '斜率 1/R'] }], marks: [[M.OHM.E, ohmI, `${M.OHM.E} V, ${f(ohmI, 1)} A`, 8, 14]] })}</div>
      <p class="hintline">點擊可看電阻器內的電場。${heightNote}</p>`,
    cam: { target: [STATIONS.ohm, 0.8, 0.1], az: -34, el: 16, dist: 14 }, lit: 'ohm', scene: 'ohm', look: { ohm: 1 },
    fig: '上經電池，下經電阻',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '13.3', title: '電功率', sub: '電能轉換快慢',
    body: `
      <p class="lede">每庫侖在電池中獲得 Δ<i>V</i> J 的能量，再在電阻器中以熱釋出；在燈泡裏則部分化為光。</p>
      <div class="eq"><i>P</i> = d<i>U</i>/d<i>t</i> = <i>I</i>Δ<i>V</i> = <i>I</i>²<i>R</i> = Δ<i>V</i>²/<i>R</i></div>
      <p>後兩條用到 Δ<i>V</i> = <i>IR</i>：知道電流（串聯）時用 <i>I</i>²<i>R</i>；知道電壓（並聯）時用 Δ<i>V</i>²/<i>R</i>。單位：瓦特，J/s。</p>
      <table class="data">
        <tr><td><i>I</i>Δ<i>V</i></td><td>${f(bulbI, 2)} A × ${M.BULB.E} V = ${f(bulbP, 1)} W</td></tr>
        <tr><td><i>I</i>²<i>R</i></td><td>(${f(bulbI, 2)} A)² × ${M.BULB.R} Ω = ${f(bulbI ** 2 * M.BULB.R, 1)} W</td></tr>
        <tr><td>Δ<i>V</i>²/<i>R</i></td><td>(${M.BULB.E} V)² / ${M.BULB.R} Ω = ${f(M.BULB.E ** 2 / M.BULB.R, 1)} W</td></tr>
      </table>
      <p>能量 <i>E</i> = <i>Pt</i>：每 ${M.BULB.run} s 用 ${f(bulbP * M.BULB.run, 0)} J。</p>
      <div class="charts">${chart({ ...R.energy, xlabel: '時間 (s)', ylabel: '能量 (J)', cursors: ['energy'], label: '輸出能量對時間：斜率為 P 的直線', series: [{ pts: [[0, 0], [M.BULB.run, bulbP * M.BULB.run]], tag: [5.2, 25, '斜率 P = 6 W'] }] })}</div>
      <p class="hintline">點擊燈泡可揭開玻璃罩。</p>`,
    cam: { target: [STATIONS.power, 0.25, 0.05], az: -14, el: 42, dist: 12.5 }, lit: 'bulb', scene: 'bulb', look: {},
    fig: '六瓦特的熱與光',
  },
  {
    levels: ['senior'],
    kicker: '13.4', title: '電動勢', sub: '電池如何推電流',
    body: `
      <p class="lede"><b>電動勢</b> ℰ 是電池的化學作用給每庫侖的能量。名字雖有「力」，它卻不是力。</p>
      <p>實際的電池有<b>內阻</b> <i>r</i>，電流在電池內部先損失 <i>Ir</i>：</p>
      <div class="eq">Δ<i>V</i><sub>terminal</sub> = ℰ − <i>Ir</i>,  <i>I</i> = ℰ/(<i>R</i> + <i>r</i>)</div>
      <p>這裏 ℰ = ${M.CELL.E} V，<i>r</i> = ${M.CELL.r} Ω，燈泡的 <i>R</i> 則掃過 ${M.CELL.Rmin}–${M.CELL.Rmax} Ω。電流越大，端電壓越低，<i>I</i>²<i>r</i> 令電池發熱。燈泡得到 ℰ²<i>R</i>/(<i>R</i> + <i>r</i>)²；d<i>P</i>/d<i>R</i> = 0 於 <i>R</i> = <i>r</i>，那時最亮：ℰ²/4<i>r</i> = ${f(M.CELL.E ** 2 / (4 * M.CELL.r), 0)} W。</p>
      <div class="charts">${chart({ ...R.pload, xlabel: '負載 R (Ω)', ylabel: '燈泡功率 (W)', cursors: ['pload'], vlines: [[M.CELL.r, 'r']], label: '負載功率對負載電阻：在 R = r 處最大',
        series: [{ pts: curve(M.loadP, 0, 8) }] })}</div>
      <p class="hintline">點擊電池可打開它。${heightNote}</p>`,
    cam: { target: [STATIONS.cell, 0.2, 0.05], az: -14, el: 42, dist: 14 }, lit: 'cell', scene: 'cell', look: {},
    fig: '電動勢 12 V，內阻 2 Ω',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '13.5', title: '串聯與並聯', sub: '兩種接法',
    body: `
      <p class="lede"><b>串聯</b>時電流只有一條路，所以流過每個電阻器的電流相同，而各段的電壓相加。<b>並聯</b>時每條支路跨着同樣的兩點，所以電壓相同，電流相加。</p>
      <div class="eq"><i>R</i><sub>s</sub> = <i>R</i><sub>1</sub> + <i>R</i><sub>2</sub>,  1/<i>R</i><sub>p</sub> = 1/<i>R</i><sub>1</sub> + 1/<i>R</i><sub>2</sub> + …</div>
      <table class="data cols">
        <tr><th>串聯，9 V</th><th>並聯，9 V</th></tr>
        <tr><td><i>R</i><sub>eq</sub> = 2 + 4 = 6 Ω</td><td><i>R</i><sub>eq</sub> = ${f(M.parallelR([2, 4, 6]), 3)} Ω</td></tr>
        <tr><td><i>I</i> = 9/6 = 1.5 A</td><td><i>I</i><sub>1</sub> = 9/2 = 4.5 A</td></tr>
        <tr><td>Δ<i>V</i><sub>1</sub> = 1.5 × 2 = 3 V</td><td><i>I</i><sub>2</sub> = 9/4 = 2.25 A</td></tr>
        <tr><td>Δ<i>V</i><sub>2</sub> = 1.5 × 4 = 6 V</td><td><i>I</i><sub>3</sub> = 9/6 = 1.5 A</td></tr>
        <tr><td>3 + 6 = 9 V ✓</td><td><i>I</i> = 8.25 A ✓</td></tr>
      </table>
      <p>串聯愈多，<i>R</i><sub>eq</sub> 越大；並聯愈多，<i>R</i><sub>eq</sub> 越小，甚至低於最小的支路。並聯圖中，圓點沿軌道的速度對應電流：支路電流就在軌道上匯合。</p>
      <p class="hintline">點擊任一電路可升起它。圓點速度 ∝ 電流（並聯時每安培快 ${f(K_DOT.parallel / K_DOT.series, 1)} 倍）。</p>`,
    cam: { target: [STATIONS.sp + 0.07, 0.1, 0.1], az: -5, el: 50, dist: 20.5 }, lit: null, scene: 'sp', look: {},
    fig: '2 Ω 與 4 Ω；2、4、6 Ω',
  },
  {
    levels: ['senior'],
    kicker: '13.6', title: '混聯', sub: '串並組合',
    body: `
      <p class="lede">一步步把串聯並聯混合的電路化成一個等效電阻，然後逐級逆行，求每個電壓和電流。</p>
      <ol class="rules">
        <li>R<sub>2</sub>、R<sub>4</sub>、R<sub>5</sub> 載同一電流：串聯，4 + 2 + 2 = ${M.COMBO.R245} Ω。</li>
        <li>R<sub>3</sub> 與那 ${M.COMBO.R245} Ω 跨着同樣兩點：並聯，1/(½ + ⅛) = ${f(M.COMBO.R2345, 1)} Ω。</li>
        <li>R<sub>1</sub> 與它串聯：<i>R</i><sub>eq</sub> = 2 + ${f(M.COMBO.R2345, 1)} = ${f(M.COMBO.Req, 1)} Ω，所以 <i>I</i> = 9/${f(M.COMBO.Req, 1)} = ${f(9 / M.COMBO.Req, 1)} A。</li>
      </ol>
      <table class="data">
        <tr><th>逐級還原</th><th>Δ<i>V</i></th><th><i>I</i></th></tr>
        <tr><td>R<sub>1</sub></td><td>2.5 × 2 = 5 V</td><td>2.5 A</td></tr>
        <tr><td>R<sub>3</sub>（並聯部分）</td><td>9 − 5 = 4 V</td><td>4/2 = 2.0 A</td></tr>
        <tr><td>R<sub>2</sub>、R<sub>4</sub>、R<sub>5</sub></td><td>2, 1, 1 V</td><td>4/8 = 0.5 A</td></tr>
      </table>
      <p>每一級都取同一 2.5 A：「等效」正是這個意思。（整理表的寫法是 R<sub>245</sub> = 10 Ω 和 3.667 Ω；照圖上標示，4 + 2 + 2 = 8 Ω。）</p>
      <p class="hintline">點擊完整電路（1）可升起它。</p>`,
    cam: { target: [STATIONS.combo, 0.1, 0.15], az: -4, el: 56, dist: 27 }, lit: 'combo', scene: 'combo', look: {},
    fig: '五個電阻合成一個',
  },
  {
    levels: ['senior'],
    kicker: '13.7', title: '基爾霍夫定則', sub: '節點與迴路',
    body: `
      <p class="lede">兩個電池在不同支路時，不能簡化成一個電阻。基爾霍夫兩條定則一定行得通。</p>
      <ul class="rules"><li><b>節點定則</b>（電荷守恆）：流入 = 流出。在 A，<i>I</i><sub>1</sub> = <i>I</i><sub>2</sub> + <i>I</i><sub>3</sub>。</li>
        <li><b>迴路定則</b>（能量守恆）：沿任何迴路 ΣΔ<i>V</i> = 0。順電流方向過電阻器記 −<i>IR</i>；由電池的 − 端到 + 端記 +ℰ。</li></ul>
      <div class="eq">1:  −10<i>I</i><sub>1</sub> − 5<i>I</i><sub>2</sub> − 10<i>I</i><sub>1</sub> + 12 = 0</div>
      <div class="eq">2:  −20<i>I</i><sub>3</sub> + 6 − 20<i>I</i><sub>3</sub> + 5<i>I</i><sub>2</sub> = 0</div>
      <p>結果 <i>I</i><sub>1</sub> = ${f(kI('R1'), 2)} A，<i>I</i><sub>2</sub> = ${f(kI('R5'), 2)} A，<i>I</i><sub>3</sub> = ${f(kI('R3'), 2)} A，與整理表的答案相同。它們需要把 6 V 電池的 + 端放在下面，正如這裏所畫。它的頁面把 + 畫在上端：那時迴路 2 有 −6，<i>I</i><sub>3</sub> = ${f(kd.I[2], 3)} A，電流沿另一方向。</p>
      <p class="hintline">點擊可升起電路，逐個迴路走一趟。${heightNote}</p>`,
    cam: { target: [STATIONS.kirch, 0.3, 0.1], az: -8, el: 46, dist: 16 }, lit: 'kirch', scene: 'kirch', look: {},
    fig: 'I₁ = I₂ + I₃；每個迴路 ΣΔV = 0',
  },
  {
    levels: ['senior'],
    kicker: '13.8', title: 'RC 電路', sub: '充電與放電',
    body: `
      <p class="lede">在 <b>a</b>，電池經 <i>R</i> 給電容充電；在 <b>b</b>，電容把電流推回經 <i>R</i>，直至放完。</p>
      <div class="eq">ℰ − <i>IR</i> − <i>q</i>/<i>C</i> = 0, <i>I</i> = d<i>q</i>/d<i>t</i></div><div class="eq"><i>q</i> = ℰ<i>C</i>(1 − e<sup>−<i>t</i>/<i>RC</i></sup>)</div>
      <p>（分離變數：∫d<i>q</i>/(ℰ<i>C</i> − <i>q</i>) = ∫d<i>t</i>/<i>RC</i>。）<i>I</i> = (ℰ/<i>R</i>)e<sup>−<i>t</i>/<i>RC</i></sup>。τ = <i>RC</i> = ${f(RC.tau, 1)} s：一個 τ 後，<i>q</i> 達 ℰ<i>C</i> = ${f(RC.Qmax * 1e3, 1)} mC 的 63.2%，<i>I</i> 剩 ℰ/<i>R</i> = ${f(RC.Imax * 1e3, 1)} mA 的 36.8%。放電時，<i>q</i> = <i>Q</i><sub>max</sub>e<sup>−<i>t</i>/<i>RC</i></sup>。</p>
      <p>空的電容如同一段導線；充滿時像一處斷口。電池送出的 <i>Q</i>ℰ = ${f(RC.Qmax * RC.E * 1e3, 1)} mJ，一半儲存，一半化熱。</p>
      <div class="charts">${chart({ ...R.rc, xlabel: '時間 (s)', ylabel: '最大值的百分比', cursors: ['rcq', 'rci'], vlines: [[RC.tau, 'τ'], [RC.Tch, 'b'], [RC.Tch + RC.tau, 'τ']],
        label: '充放電時電量與電流對時間',
        series: [{ cls: 'zero', pts: [[0, 0], [RC.cycle, 0]] }, { pts: curve(t => 100 * M.rc(t).Q / RC.Qmax, 0, RC.cycle - 1e-6, 400), tag: [3.5, 92, 'q'] },
          { cls: 'curve total', pts: curve(t => 100 * M.rc(t).I / RC.Imax, 0, RC.cycle - 1e-6, 400), tag: [3.4, 14, 'I'] }],
        marks: [[RC.tau, 63.2, '63.2%'], [RC.tau, 36.8, '36.8%', 6, -6]] })}</div>
      <p class="hintline">點擊可升起電路：Δ<i>V</i><sub>R</sub> 收縮，Δ<i>V</i><sub>C</sub> 增長。</p>`,
    cam: { target: [STATIONS.rc, 0.25, 0.1], az: -10, el: 44, dist: 15 }, lit: 'rc', scene: 'rc', look: {},
    fig: '20 kΩ, 100 µF: τ = 2.0 s',
  },
];

// ---------- click a scene: what it breaks into ----------
const vC = n => n.toFixed(2);
export const PLATES = {
  wire: {
    title: '導線中電荷的漂移', sub: 'I=nqAv_d', text: `藍色平板是<i>A</i>上游一段長Δ<i>x</i> = <i>v</i><sub>d</sub>Δ<i>t</i>的導線。其中的每個電子都會在Δ<i>t</i>內越過<i>A</i>，因此通過<i>A</i>的電荷為<i>nqA</i>Δ<i>x</i>，而電流則為<i>nqAv</i><sub>d</sub>。`,
    facts: () => { const dx = 1.5 / MAG, dt = dx / CU.vd, Q = CU.n * M.E_CH * CU.A * dx; return [['slab length Δx', `${f(dx * 1e3, 2)} mm (drawn 1.5 units)`], ['time to cross Δt = Δx/v_d', `${f(dt, 1)} s`], ['charge in it nqAΔx', `${f(Q, 1)} C`], ['I = Q/Δt', `${f(Q / dt, 2)} A`], ['time between collisions', `${f(CU.tauC * 1e15, 0)} fs`]]; } },
  wires: {
    title: '兩條鎳鉻合金線', sub: 'R=ρL/A', text: `粗導線可拆分為四股幼細的導線，每股都與幼導線完全相同。四條相同路徑並列接通，在相同電壓下載送四倍電流：電阻因而只有四分之一。`,
    facts: s => { const L = M.resLength(s.clock); return [['length L', `${f(L)} m`], ['thin: R = ρL/A', `${f(M.rThin(L))} Ω, I ${f(1.5 / M.rThin(L))} A`], ['thick: R/4', `${f(M.rThick(L))} Ω, I ${f(1.5 / M.rThick(L))} A`], ['ρ (nichrome)', `${sci(M.RES.rho, 2)} Ω·m`]]; } },
  ohm: {
    title: '一電池一電阻器', sub: '以高度表示電勢', text: `藍色箭頭表示電阻器內的電場，沿斜坡指向下方。理想導線內沒有斜坡，因此無需電場：電阻為零，電壓為零。整個${M.OHM.E} V電壓均降落在電阻器兩端。`,
    facts: () => [['battery rise', `+${M.OHM.E} V`], ['wires', '0 V'], ['resistor drop IR', `−${f(ohmI * M.OHM.R, 1)} V`], ['current', `${f(ohmI, 1)} A`], ['round the loop', '0 V']] },
  bulb: {
    title: '12 V下的24 Ω燈泡', sub: '燈泡就是會發光的電阻器', text: `玻璃外殼之內是一卷幼細的鎢絲：這是一個受熱至足以發光的電阻器。燈泡在電路中其實只不過是一個${M.BULB.R} Ω的電阻器。`,
    facts: s => { const t = s.clock % M.BULB.run; return [['P = IΔV', `${f(bulbP, 1)} W`], ['P = I²R', `${f(bulbI ** 2 * M.BULB.R, 1)} W`], ['P = ΔV²/R', `${f(M.BULB.E ** 2 / M.BULB.R, 1)} W`], ['energy so far E = Pt', `${f(bulbP * t, 1)} J`]]; } },
  cell: {
    title: '真實電池', sub: '內藏電阻器的理想電動勢', text: `內部：一個理想電動勢${M.CELL.E} V與一個${M.CELL.r} Ω電阻器串聯。提升後，電池把電荷升高${M.CELL.E} V，而內電阻則在到達端鈕之前取回<i>Ir</i>。`,
    facts: s => { const R = M.cellLoad(s.clock), I = M.cellI(R); return [['load R', `${f(R)} Ω`], ['current I = ℰ/(R + r)', `${f(I)} A`], ['lost inside Ir', `${f(I * M.CELL.r)} V`], ['terminal ΔV = ℰ − Ir', `${f(M.terminalV(I))} V`], ['bulb power', `${f(M.loadP(R))} W`], ['wasted inside I²r', `${f(I * I * M.CELL.r)} W`]]; } },
  series: {
    title: '串聯', sub: '單一路徑：電流相同，電壓相加', text: `提升後，電池升高9 V，電流依次沿兩個斜坡下降：沿2 Ω下降3 V，沿4 Ω下降6 V。電阻越大，分得的電壓越大。`,
    facts: () => [['R_eq', '6 Ω'], ['I (everywhere)', '1.5 A'], ['ΔV₁', '3.0 V'], ['ΔV₂', '6.0 V'], ['sum', '9.0 V']] },
  parallel: {
    title: '並聯', sub: '並列分支：電壓相同，電流相加', text: `提升後，左側軌道電勢為9 V，右側為0 V，因此每一分支都降下整整9 V。各分支取其自身的電流ΔV/R；軌道則載送電流之和。`,
    facts: () => [['ΔV on each branch', '9.0 V'], ['I₁ (2 Ω)', '4.50 A'], ['I₂ (4 Ω)', '2.25 A'], ['I₃ (6 Ω)', '1.50 A'], ['battery', '8.25 A'], ['R_eq', `${f(M.parallelR([2, 4, 6]), 3)} Ω`]] },
  combo: {
    title: '完整電路', sub: '五個電阻器、一個電池', text: `提升後：沿R<sub>1</sub>下降5 V，其餘的4 V則同時分兩路：或沿R<sub>3</sub>一次降至盡，或沿R<sub>2</sub>、R<sub>4</sub>、R<sub>5</sub>分別以2、1和1 V的短降分段下降。`,
    facts: () => [['R_eq', `${f(M.COMBO.Req, 1)} Ω`], ['battery current', '2.5 A'], ['across R₁', '5.0 V'], ['across R₃', '4.0 V, 2.0 A'], ['R₂, R₄, R₅', '2.0, 1.0, 1.0 V at 0.5 A']] },
  kirch: {
    title: '兩個電池、兩個迴路', sub: '節點定律與迴路定律', text: `提升後，每一點都位於其電勢高度。藍色小球沿迴路1行走，再沿迴路2行走——累加每一次的升與降。它總會回到起點：ΣΔV=0。`,
    facts: s => [['V at A', `${f(kr.V.a)} V`], ['V at B', `${f(kr.V.b)} V`], ['I₁ = I₂ + I₃', `${f(kI('R1'), 3)} = ${f(kI('R5'), 3)} + ${f(kI('R3'), 3)} A`], ['walking loop', `${s.walk.loop}`], ['ΣΔV so far', `${f(s.walk.sum)} V`]] },
  rc: {
    title: 'RC電路', sub: '先充電，後放電', text: `提升後：電池升高12 V——前段為電阻器的斜坡<i>IR</i>，後段為電容器的階躍<i>q</i>/<i>C</i>。充電時，電阻器所佔的部份隨電容器所佔部份的增加而縮小——兩者之和始終為12 V。放電時，電池被斷開，並由電容器的階躍驅動電流反向。`,
    facts: s => { const r = s.rc; return [['switch', r.charging ? 'a: charging' : 'b: discharging'], ['t since switching', `${f(r.s, 1)} s = ${f(r.s / RC.tau, 2)} τ`], ['q', `${vC(r.Q * 1e3)} mC (${f(100 * r.Q / RC.Qmax, 1)}%)`], ['I', `${f(r.I * 1e3, 3)} mA`], ['ΔV_R', `${f(Math.abs(r.VR))} V`], ['ΔV_C', `${f(r.Vc)} V`], ['stored q²/2C', `${f(r.Q ** 2 / (2 * RC.C) * 1e3)} mJ`]]; } },
};
