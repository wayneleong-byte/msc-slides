// Chapter 8, page by page (AP Physics 1, Unit 8: fluids). Text and charts on the left page; on the
// right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, SC, PY6, PY7 } from './world.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const kPa = (p, n = 1) => `${f(p / 1000, n)} kPa`;

// ---------- small SVG charts for the left page, with live cursors ----------
const W = 420, P = { l: 44, r: 14, t: 16, b: 30 };
export const CURSORS = {};       // key → (x, y) → [cx, cy]
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], cursors = [], label, h = 170, ylabels, xlabels }) {
  const H = h;
  const sx = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy = y => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b);
  for (const c of cursors) CURSORS[c] = (x, y) => [sx(x), sy(y)];
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  const [yt, yb] = ylabels || [y1, y0], [xl, xr] = xlabels || [x0, x1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${yt}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${yb}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${xl}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${xr}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(c => `<circle class="cursor" r="4.5" cx="-20" cy="-20" data-cursor="${c}"/>`).join('')}
  </svg>`;
}
const sample = (fn, a, b, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });

// Bernoulli's energy per volume at the three points, as stacked bars
function bernBars() {
  const H = 150, top = 85, sy = v => P.t + (1 - v / top) * (H - P.t - P.b), bw = 60;
  const cols = M.BERN.pts.map((p, k) => {
    const x = P.l + 40 + k * 120; let y0 = 0, out = '';
    for (const [val, fill] of [[p.P, '#ecece8'], [p.K / 1000 * 1000, '#8fb0f0'], [p.U, '#9c9ca2']]) {
      const v = val / 1000; if (v > 0.01) out += `<rect x="${x}" y="${sy(y0 + v)}" width="${bw}" height="${sy(y0) - sy(y0 + v)}" fill="${fill}" stroke="#8a8a8f" stroke-width=".8"/>`; y0 += v;
    }
    return out + `<text class="lab" x="${x + bw / 2}" y="${H - 9}" text-anchor="middle">第 ${k + 1} 點</text>`;
  }).join('');
  const tot = sy(M.BERN.E / 1000);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="三點的每單位體積能量：壓強、動能與勢能部分總和不變">
    <line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>${cols}
    <line class="trend" x1="${P.l}" x2="${W - P.r}" y1="${tot}" y2="${tot}"/><text class="lab" x="${W - P.r}" y="${tot - 6}" text-anchor="end">總計 ${f(M.BERN.E / 1000, 0)} kPa</text>
    <text class="ax" x="${P.l - 6}" y="${sy(top) + 4}" text-anchor="end">${top}</text><text class="ax" x="${P.l - 6}" y="${sy(0) + 4}" text-anchor="end">0</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">kPa = kJ/m³：P（淺色）+ ½ρv²（藍）+ ρgy（灰）</text>
  </svg>`;
}

const at = (k, dx = 0, dy = 0.5, dz = 0) => [STATIONS[k] + dx, dy, dz];
const Bp = M.BERN.pts;

export const PAGES = [
  {
    levels: ['junior', 'senior'],
    kicker: '第 8 章', title: '流體', sub: '密度',
    body: `
      <p class="lede">凡會流動的都是<b>流體</b>：液體或氣體都算。它的分子不被鎖在原位，所以會隨容器變形。我們用<b>密度</b>來描述它，即每單位體積的質量：</p>
      <div class="eq">ρ = <i>m</i> / <i>V</i></div>
      <p>這五個立方體每邊都是 10 cm，容積各為 1.0 L：體積相同，質量卻大不相同，由 ${f(M.MATERIALS[0].mass)} kg 的軟木到 ${f(M.MATERIALS[4].mass)} kg 的鐵。在質量對體積的圖上，每種材料都是一條直線，斜率正是它的密度。</p>
      <p>密度屬於材料本身，不屬於物件：把立方體切半，<i>m</i> 和 <i>V</i> 都減半。<b>理想流體</b>不可壓縮（密度永不改變），流動時又無摩擦。水就非常接近一種理想流體。</p>
      <div class="charts">${chart({ x0: 0, x1: 1, y0: 0, y1: 3, xlabel: '體積 (L)', ylabel: '質量 (kg)：斜率 = ρ', label: '五種材料的質量對體積：直線的斜率就是密度', h: 150,
        series: M.MATERIALS.map(m => ({ pts: [[0, 0], [Math.min(1, 3 / m.mass), Math.min(m.mass, 3)]], tag: { cork: [0.78, 0.24, '軟木'], ice: [0.62, 0.95, '冰、水'], water: null, al: [0.66, 1.8, '鋁'], iron: [0.4, 2.3, '鐵'] }[m.key] })) })}</div>
      <p class="hintline">點擊立方體，把每個切成八份。</p>`,
    cam: { target: at('density', 0, 0.06), az: -14, el: 16, dist: 3.4 }, lit: 'blocks', scene: 'density', look: {},
    fig: '五個 1 升的立方體',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.1', title: '壓強', sub: '力分散在面積上',
    body: `
      <p class="lede"><b>壓強</b>是垂直壓在一個面上的力，除以該面積：</p>
      <div class="eq"><i>P</i> = <i>F</i><sub>⊥</sub> / <i>A</i></div>
      <p>壓強是標量，以帕斯卡量度：1 Pa = 1 N/m²。同一個 ${M.PERSON.m} kg 的人（${f(M.PERSON.W, 0)} N）兩次踏在雪上：</p>
      <table class="data">
        <tr><th></th><th>面積</th><th>壓強</th></tr>
        <tr><td>皮鞋</td><td>${f(M.SHOE.A, 3)} m²</td><td>${kPa(M.P_SHOE)}</td></tr>
        <tr><td>雪鞋</td><td>${f(M.SNOWSHOE.A, 2)} m²</td><td>${kPa(M.P_SNOW, 2)}</td></tr>
      </table>
      <p>面積大八倍，壓強便只有八分之一，雪面就承得住。鐵釘正正相反：用 ${M.NAIL.F} N 壓 1 cm² 的釘帽，0.5 mm² 的釘尖就以 ${f(M.NAIL.F / M.NAIL.tip / 1e6, 0)} MPa 壓進木頭。</p>
      <div class="charts">${chart({ x0: 0, x1: 0.5, y0: 0, y1: 30, xlabel: '接觸面積 (m²)', ylabel: 'P = W/A (kPa)', label: '相同重量下壓強對接觸面積：P 隨 1/A 減小', h: 118,
        series: [{ pts: sample(A => Math.min(M.PERSON.W / A / 1000, 30), 0.0229, 0.5) }], marks: [[M.SHOE.A, M.P_SHOE / 1000, '皮鞋'], [M.SNOWSHOE.A, M.P_SNOW / 1000, '雪鞋', -40, -10]] })}</div>
      <p class="hintline">箭嘴：雪面上的推力，每 125 cm² 一支，每 kPa ${f(SC.shoeP * 1e5, 1)} cm。點擊可升起人像。</p>`,
    cam: { target: at('pressure', 0, 0.9), az: -18, el: 12, dist: 10.5 }, lit: 'feet', scene: 'pressure', look: {},
    fig: '重量相同，面積更大',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.2', title: '壓強與深度', sub: '液體柱的重量',
    body: `
      <p class="lede">在水下，壓強來自上方水柱的重量。高 <i>h</i>、面積 <i>A</i> 的水柱重 ρ<i>Ah g</i>，所以它在原有壓強之上再加上 ρ<i>gh</i>：</p>
      <div class="eq"><i>P</i> = <i>P</i><sub>0</sub> + ρ<i>gh</i></div>
      <p><i>P</i><sub>0</sub> = ${kPa(M.P0)} 是壓在水面上的大氣。<i>P</i> 是<b>絕對壓強</b>；單算 ρ<i>gh</i> 的部分是<b>錶壓</b>，即在大氣壓之上的部分。水每加深 ${f(M.P0 / (M.RHO * M.G), 1)} m 就多約一個大氣壓：在 10 m 深處，潛水員感到 ${kPa(M.pAt(10), 0)}。</p>
      <p>同一深度，不論周圍水的形狀如何，各方向的壓強都相同。</p>
      <div class="charts">${chart({ x0: 0, x1: 12, y0: 0, y1: 240, xlabel: '深度 h (m)', ylabel: '壓強 (kPa)', cursors: ['depth', 'gauge'], label: '絕對壓強與錶壓對深度：兩條平行直線', h: 150,
        series: [{ pts: [[0, M.P0 / 1000], [12, M.pAt(12) / 1000]], tag: [7.4, M.pAt(7.4) / 1000 + 4, '絕對壓強'] }, { cls: 'trend', pts: [[0, 0], [12, M.gauge(12) / 1000]], tag: [8.6, M.gauge(8.6) / 1000 - 32, '錶壓 ρgh'] }] })}</div>
      <p class="hintline">箭嘴每 kPa ${f(SC.lakeP * 1e5, 1)} cm。點擊潛水員可看其上方的水柱。</p>`,
    cam: { target: at('depth', 0.2, 6.4), az: -12, el: 6, dist: 44 }, lit: 'diver', scene: 'depth', look: {},
    fig: '潛水員，水深 1 至 10 m',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.3', title: '帕斯卡原理', sub: '密閉液體傳壓',
    body: `
      <p class="lede">推一下封閉在容器內的液體，多出來的壓強會毫不減弱地傳到液體的每一處和每一道壁。這就是<b>帕斯卡原理</b>。</p>
      <p>以 ${M.PASCAL.F1} N 下壓小活塞，Δ<i>P</i> = <i>F</i><sub>1</sub>/<i>A</i><sub>1</sub> = ${kPa(M.PASCAL.dP, 2)} 傳遍各處。大活塞的下面積大 ${f(M.PASCAL.A2 / M.PASCAL.A1, 0)} 倍，同樣的 Δ<i>P</i> 就產生 ${f(M.PASCAL.F2, 0)} N，足以承起 ${f(M.PASCAL.load, 1)} kg：</p>
      <div class="eq"><i>F</i><sub>1</sub>/<i>A</i><sub>1</sub> = <i>F</i><sub>2</sub>/<i>A</i><sub>2</sub></div>
      <p>天下無免費午餐。水擠不扁，左邊壓下去的體積必在右邊升上來：<i>A</i><sub>1</sub><i>d</i><sub>1</sub> = <i>A</i><sub>2</sub><i>d</i><sub>2</sub>。大活塞移動的距離細 ${f(M.PASCAL.A2 / M.PASCAL.A1, 0)} 倍，所以輸入的功等於輸出的功，<i>F</i><sub>1</sub><i>d</i><sub>1</sub> = <i>F</i><sub>2</sub><i>d</i><sub>2</sub>。</p>
      <table class="data">
        <tr><th></th><th>面積</th><th>力</th><th>位移</th></tr>
        <tr><td>小活塞</td><td>${f(M.PASCAL.A1 * 1e4, 0)} cm²</td><td>${M.PASCAL.F1} N</td><td>${f(M.PASCAL.stroke * 100, 0)} cm</td></tr>
        <tr><td>大活塞</td><td>${f(M.PASCAL.A2 * 1e4, 0)} cm²</td><td>${f(M.PASCAL.F2, 0)} N</td><td>${f(M.PASCAL.stroke * 100 * M.PASCAL.A1 / M.PASCAL.A2, 0)} cm</td></tr>
      </table>
      <p class="hintline">每支小箭嘴代表一個 ${f(M.PASCAL.A1 * 1e4, 0)} cm² 小面上的 Δ<i>P</i>：小活塞下一支，大活塞下十六支。點擊可看每道內壁上的 Δ<i>P</i>。</p>`,
    cam: { target: at('pascal', -0.15, 0.8), az: -18, el: 14, dist: 7.2 }, lit: 'pascal', scene: 'pascal', look: {},
    fig: '相同的 ΔP，十六倍面積',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.4', title: '浮力', sub: '阿基米德',
    body: `
      <p class="lede">水推在浸沒物件的每個面上，而且越深推得越用力。側面的推力互相抵消；底面向上的推力勝過頂面向下的推力。之差就是<b>浮力</b>。</p>
      <p>對邊長 <i>s</i> 的立方體：(<i>P</i><sub>bottom</sub> − <i>P</i><sub>top</sub>)<i>s</i>² = ρ<i>gs</i>·<i>s</i>² = ρ<i>Vg</i>，即它排開的水的重量：</p>
      <div class="eq"><i>F</i><sub>b</sub> = ρ<sub>fluid</sub> <i>V</i><sub>displaced</sub> <i>g</i></div>
      <p>立方體沒入時浮力隨之增大，之後不論多深都停在 ${f(M.BUOY.Fb, 0)} N。繩子承住餘下的，即<b>視重</b> <i>T</i> = <i>W</i> − <i>F</i><sub>b</sub> = ${f(M.BUOY.W - M.BUOY.Fb, 0)} N，而不是 ${f(M.BUOY.W, 0)} N。</p>
      <div class="charts">${chart({ x0: -0.35, x1: 0.75, y0: 0, y1: 900, xlabel: '底面深度 (m)', ylabel: '力 (N)', cursors: ['fb', 'T'], label: '浮力與繩的張力對立方體沒入的深度', h: 140, xlabels: ['−0.35', '0.75'],
        series: [{ pts: sample(d => M.buoy(M.BUOY.L0 - d).Fb, -0.35, 0.75), tag: [0.45, M.BUOY.Fb + 10, 'F_b'] }, { pts: sample(d => M.buoy(M.BUOY.L0 - d).T, -0.35, 0.75), tag: [0.45, M.BUOY.W - M.BUOY.Fb + 10, 'T = W − F_b'] }, { cls: 'trend', pts: [[-0.35, M.BUOY.W], [0.75, M.BUOY.W]], tag: [0.6, M.BUOY.W + 10, 'W'] }] })}</div>
      <p class="hintline">錶壓每 kPa ${f(SC.buoyP * 1e5, 1)} cm；力每 N ${f(SC.buoyF * 1000, 1)} mm。點擊可看每個面的總推力。</p>`,
    cam: { target: at('buoy', 0, 0.95), az: -20, el: 8, dist: 6.8 }, lit: 'cube', scene: 'buoy', look: {},
    fig: `繩吊着的 ${f(M.BUOY.s * 100, 0)} cm 鋁立方體`,
  },
  {
    levels: ['junior', 'senior'],
    kicker: '8.5', title: '浮或沉', sub: '密度比較',
    body: `
      <p class="lede">若物體的密度小於水，它只會沉到排開的水與自己同重為止：ρ<sub>fluid</sub><i>V</i><sub>under</sub><i>g</i> = ρ<sub>obj</sub><i>Vg</i>，所以</p>
      <div class="eq"><i>V</i><sub>under</sub> / <i>V</i> = ρ<sub>obj</sub> / ρ<sub>fluid</sub></div>
      <table class="data">
        <tr><th></th><th>ρ (kg/m³)</th><th>結果</th></tr>
        <tr><td>木塊</td><td>${M.WOOD.rho}</td><td>浮，浸入 ${f(100 * M.WOOD.draft / M.WOOD.s, 0)}%</td></tr>
        <tr><td>冰</td><td>${M.ICE.rho}</td><td>浮，浸入 ${f(100 * M.ICE.draft / M.ICE.s, 1)}%</td></tr>
        <tr><td>鋼珠</td><td>${M.BALL.rho}</td><td>沉</td></tr>
        <tr><td>鋼船（平均）</td><td>${f(M.SHIP.avg, 0)}</td><td>浮，吃水 ${f(M.SHIP.draft * 100, 1)} cm</td></tr>
      </table>
      <p>海中的冰山有 ${f(100 * M.fractionUnder(917, M.RHO_SEA), 0)}% 在水下。鋼珠的 <i>F</i><sub>b</sub> = ${f(M.BALL.Fb, 0)} N 敵不過它的 ${f(M.BALL.W, 0)} N；其餘由池底承住。鋼船是造得能載住空氣的鋼殼。</p>
      <div class="charts">${chart({ x0: 0, x1: 1.5, y0: 0, y1: 1.15, xlabel: 'ρ_object / ρ_water', ylabel: '浸入水下的比例', label: '浸入比例對密度比：在 1 之前與比值相等，之後便沉', h: 104, ylabels: ['', '0'],
        series: [{ pts: [[0, 0], [1, 1], [1.5, 1]], tag: [1.02, 1.0, '沉沒 →'] }], marks: [[M.SHIP.avg / 1000, M.SHIP.avg / 1000, '船'], [0.6, 0.6, '木'], [0.917, 0.917, '冰', -26, -8]] })}</div>
      <p class="hintline">力每 N ${f(SC.floatF * 1000, 1)} mm。點擊可把排開的水拿出來。</p>`,
    cam: { target: at('float', 0.15, 0.55), az: -10, el: 9, dist: 12.5 }, lit: 'float', scene: 'float', look: {},
    fig: '木、冰、鋼珠、鋼船',
  },
  {
    levels: ['senior'],
    kicker: '8.6', title: '連續方程', sub: '流量守恆',
    body: `
      <p class="lede">水擠不扁，水管又不漏水，所以每一秒鐘經過任何截面的體積都相同。這就是<b>體積流量</b>，<i>Q</i> = <i>Av</i>：</p>
      <div class="eq"><i>A</i><sub>1</sub><i>v</i><sub>1</sub> = <i>A</i><sub>2</sub><i>v</i><sub>2</sub></div>
      <p>水管收窄到半徑一半，面積變成四分之一，水便加速四倍：由 ${f(M.FLOW.v1, 1)} m/s 到 ${f(M.FLOW.v2, 1)} m/s。到處都是 <i>Q</i> = ${f(M.FLOW.Q * 1000, 0)} L/s。</p>
      <p>跟着那深色切片的水走：在闊管段它又短又闊；在窄管段，同樣的體積變得又長又幼。用指頭按住水管口也是這個原理。</p>
      <div class="charts">${chart({ x0: 0, x1: 0.3, y0: 0, y1: 3, xlabel: '截面積 A (m²)', ylabel: '流速 v = Q/A (m/s)', cursors: ['flow'], label: '流速對截面積：v 隨 1/A 減小', h: 150,
        series: [{ pts: sample(A => Math.min(M.FLOW.Q / A, 3), M.FLOW.Q / 3, 0.3) }], marks: [[M.FLOW.A1, M.FLOW.v1, 'A₁', -6, -10], [M.FLOW.A2, M.FLOW.v2, 'A₂']] })}</div>
      <p class="hintline">流速每 m/s ${f(SC.flowV * 100, 0)} cm。點擊水管可拉出它的兩個截面。</p>`,
    cam: { target: at('continuity', 0, PY6 + 0.1), az: -12, el: 14, dist: 14 }, lit: 'pipe', scene: 'continuity', look: {},
    fig: '四分之一面積，四倍流速',
  },
  {
    levels: ['senior'],
    kicker: '8.7', title: '白努利方程', sub: '能量沿流線',
    body: `
      <p class="lede">跟着一小片的水沿管而行。它加速之處，必有東西在前面推它：它後方的壓強必須比前方的高。所以<b>流得快就是壓強低</b>。</p>
      <p>沿流線每單位體積的能量守恆（理想流體、穩定流動）：</p>
      <div class="eq"><i>P</i> + ½ρ<i>v</i>² + ρ<i>gy</i> = constant</div>
      <table class="data">
        <tr><th></th><th><i>v</i></th><th><i>y</i></th><th><i>P</i> (錶壓)</th></tr>
        ${Bp.map((p, k) => `<tr><td>${k + 1} ${['闊，低', '窄，低', '闊，高'][k]}</td><td>${f(p.v, 1)} m/s</td><td>${f(p.y, 1)} m</td><td>${kPa(p.P)}</td></tr>`).join('')}
      </table>
      <div class="charts">${bernBars()}</div>
      <p class="hintline">半速播放。壓強每 kPa ${f(SC.bernP * 1e5, 1)} cm。點擊可把長條立在水管旁。</p>`,
    cam: { target: at('bernoulli', 0.8, PY7 + 0.6), az: -12, el: 10, dist: 24.5 }, lit: 'bernoulli', scene: 'bernoulli', look: {},
    fig: '窄處快，高處慢',
  },
  {
    levels: ['senior'],
    kicker: '8.8', title: '托里切利定律', sub: '孔口流速',
    body: `
      <p class="lede">水從液面以下 <i>h</i> 的孔流出。由開放的液面（大氣壓、幾乎靜止）算到水柱（同是大氣壓）：兩項壓強相消，剩下 ρ<i>gh</i> = ½ρ<i>v</i>²，所以</p>
      <div class="eq"><i>v</i> = √(2<i>gh</i>)</div>
      <p>速度與一滴水自由下落 <i>h</i> 距離相同。這裏 <i>h</i> 由 ${f(M.TANK.h0, 1)} m 起，所以 <i>v</i> = ${f(M.torricelli(M.TANK.h0))} m/s。水箱放水時，<i>h</i> 與 <i>v</i> 一起下降。</p>
      <p>一出孔，每滴水都是拋體：橫向 <i>v</i>，在 ${f(M.jetFlight, 3)} s 內落下 ${f(M.TANK.yh, 2)} m。射程是 <i>v t</i> = 2√(<i>h y</i><sub>hole</sub>)，滿水時 ${f(M.jetRange(M.TANK.h0))} m。</p>
      <div class="charts">${chart({ x0: 0, x1: 1.2, y0: 0, y1: 5, xlabel: '孔以上的水深 h (m)', ylabel: '水柱流速 v (m/s)', cursors: ['tank'], label: '水柱流速對水深：即 2gh 的平方根', h: 150,
        series: [{ pts: sample(h => M.torricelli(h), 0, 1.2) }] })}</div>
      <p class="hintline">流速每 m/s ${f(SC.jetV * 100, 0)} cm。點擊水箱可分解一滴水的速度。</p>`,
    cam: { target: at('torricelli', -0.05, 1.15), az: -14, el: 10, dist: 10 }, lit: 'tank', scene: 'torricelli', look: {},
    fig: '水箱從孔口放水',
  },
];

// ---------- click a scene: what it breaks into ----------
const b4 = s => s.st4;
export const PLATES = {
  blocks: {
    title: '五個立方體，同一大小', sub: '體積相同，質量不同', text: `每個立方體可拆成八個較小的立方體。每一塊的質量只有八分之一，體積也只有八分之一，因此密度相同。密度是物質本身的性質，與擁有的數量多寡無關。`,
    facts: () => M.MATERIALS.map(m => [`${m.name}: ${f(m.mass / 8, 3)} kg / 0.125 L`, `${m.rho} kg/m³`]) },
  feet: {
    title: '鞋與雪鞋', sub: '重量相同，分散於更大面積', text: `人移開後，在雪上留下各自的接觸面。兩者的總力相同，均為 ${f(M.PERSON.W, 0)} N；雪鞋把力分散到八倍的面積上，因此每個接觸面所受的壓力只有八分之一。`,
    facts: () => [['weight W', `${f(M.PERSON.W, 0)} N`], ['shoes: W / A', `${f(M.PERSON.W, 0)} / ${f(M.SHOE.A, 3)} = ${kPa(M.P_SHOE)}`], ['snowshoes: W / A', `${f(M.PERSON.W, 0)} / ${f(M.SNOWSHOE.A, 2)} = ${kPa(M.P_SNOW, 2)}`], ['ratio', `${f(M.P_SHOE / M.P_SNOW, 0)}×`]] },
  diver: {
    title: '下潛的潛水員', sub: '越深，上方的水越多', text: `顏色較深的水柱位於潛水員的正上方，截面為 1 m²。把它的重量攤分在這 1 m² 上，就是計示壓強 ρgh。再加上大氣壓強，便得到絕對壓強。來自下方的小箭比來自上方的稍長：因為潛水員的腳比頭更深。`,
    facts: s => { const d = M.diveDepth(s.clock); return [['depth h', `${f(d, 2)} m`], ['column weight ρ(1 m²)h g', `${f(M.gauge(d) / 1000, 1)} kN`], ['gauge ρgh', kPa(M.gauge(d))], ['absolute P₀ + ρgh', kPa(M.pAt(d))], ['in atmospheres', `${f(M.pAt(d) / M.P0, 2)} atm`]]; } },
  pascal: {
    title: '兩個活塞，一根水柱', sub: '推力傳遞到每一部分', text: `推壓所產生的額外壓強，在每一面壁及兩個活塞上都相同。不同的是它作用的面積：大活塞下方的面積大了十六倍，所以力也大了十六倍。`,
    facts: s => { const p = M.pascal(s.clock); return [['ΔP everywhere', kPa(M.PASCAL.dP, 2)], ['F₁ = ΔP·A₁', `${M.PASCAL.F1} N`], ['F₂ = ΔP·A₂', `${f(M.PASCAL.F2, 0)} N`], ['small piston down d₁', `${f(p.d1 * 100, 1)} cm`], ['large piston up d₂', `${f(p.d2 * 100, 2)} cm`], ['work F₁d₁ = F₂d₂', `${f(M.PASCAL.F1 * p.d1, 2)} J`]]; } },
  cube: {
    title: '水中的立方體', sub: '下方推得比上方更用力', text: `每個面上的箭號改由該面的總推力取代，即在該面中心記上 <i>P</i>·<i>A</i>。四個側面的作用成對抵消。底部推力減去頂部推力就是浮力，其大小與立方體排開的水的重量相等。`,
    facts: s => { const b = b4(s), A = M.BUOY.s ** 2, top = M.gaugeAtY(b.yb + M.BUOY.s, b.L) * A, bot = M.gaugeAtY(b.yb, b.L) * A;
      return [['up on the bottom', `${f(bot, 1)} N`], ['down on the top', `${f(top, 1)} N`], ['F_b = bottom − top', `${f(bot - top, 1)} N`], ['ρ V_under g', `${f(b.Fb, 1)} N`], ['tension T = W − F_b', `${f(b.T, 1)} N`], ['water level rise', `${f((b.L - M.BUOY.L0) * 1000, 1)} mm`]]; } },
  float: {
    title: '浮或沉', sub: 'F_b=W，只要它辦得到', text: `每個藍色方塊是該物體排開的水被提出水面後的形狀。對會浮的物體而言，其重量恰好等於物體的重量。鋼球排開了它的全部體積，這仍然不夠。`,
    facts: () => [['wood: W = F_b', `${f(M.WOOD.W, 0)} N`], ['ice: W = F_b', `${f(M.ICE.W, 0)} N`], ['steel ball: W, F_b', `${f(M.BALL.W, 0)} N, ${f(M.BALL.Fb, 0)} N`], ['ship: W = F_b', `${f(M.SHIP.W, 0)} N (${f(M.SHIP.m, 1)} kg of steel)`]] },
  pipe: {
    title: '變窄的管', sub: '進來多少，就要出去多少', text: `兩個橫截面滑出。每秒流過兩處的水量相同，均為 ${f(M.FLOW.Q * 1000, 0)} L：以 ${f(M.FLOW.v1, 1)} m/s 的速度通過 ${f(M.FLOW.A1, 3)} m²，又以 ${f(M.FLOW.v2, 1)} m/s 的速度通過 ${f(M.FLOW.A2, 3)} m²。`,
    facts: s => { const A = M.PIPE1.area(s.slab6); return [['A₁v₁', `${f(M.FLOW.A1, 4)} × ${f(M.FLOW.v1, 1)} = ${f(M.FLOW.Q, 4)} m³/s`], ['A₂v₂', `${f(M.FLOW.A2, 4)} × ${f(M.FLOW.v2, 1)} = ${f(M.FLOW.Q, 4)} m³/s`], ['the dark slice: A', `${f(A, 4)} m²`], ['its speed Q/A', `${f(M.FLOW.Q / A, 2)} m/s`]]; } },
  bernoulli: {
    title: '伯努利管', sub: 'P+½ρv²+ρgy，全程處處相同', text: `每個點背後是其單位體積的能量：壓強（淺色）、動能 ½ρv²（藍色）及勢能 ρgy（灰色）。這幾部分彼此交換，但整串的高度始終相同。同樣的交換把機翼抬升：流過弧形上表面的空氣速度較快，因此從上方向下施壓比從下方來得小。`,
    facts: () => Bp.map((p, k) => [`point ${k + 1}: P + ½ρv² + ρgy`, `${f(p.P / 1000, 1)} + ${f(p.K / 1000, 1)} + ${f(p.U / 1000, 1)} = ${f((p.P + p.K + p.U) / 1000, 1)} kPa`]) },
  tank: {
    title: '正在排水的水箱', sub: 'v=√(2gh)，其後就是拋體運動', text: `虛線是按現時速度畫出的路徑。圖中那一滴在離開 0.25 s 後，仍保有離開時的水平速度 v（灰色，指向橫向），並向下累積了 g·t（灰色，指向下方）。`,
    facts: s => { const h = s.h8, v = M.torricelli(h); return [['h', `${f(h)} m`], ['v = √(2gh)', `${f(v)} m/s`], ['½v² = gh', `${f(0.5 * v * v, 2)} = ${f(M.G * h, 2)} J/kg`], ['time to fall', `${f(M.jetFlight, 3)} s`], ['range', `${f(M.jetRange(h))} m`]]; } },
};
