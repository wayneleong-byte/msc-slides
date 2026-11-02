// Chapter 4, page by page (after the AP Physics 1 organizer, Unit 5). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, SC, BAR_COLORS } from './world.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const ST = STATIONS;
const INK = '#2c2c30', BLUE = '#4f7cbd', AMBER = '#bf9030', GREY = '#86868c';

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1, h = H) => P.t + (1 - (y - y0) / (y1 - y0)) * (h - P.t - P.b) };   // h: a chart may be shorter
function chart({ x0, x1, y0, y1, h: H = 170, series, xlabel, ylabel, marks = [], cursors = [], label, under = '', zero = false }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1, H);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}"${s.color ? ` style="stroke:${s.color}"` : ''} d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}"${s.color ? ` style="fill:${s.color}"` : ''}>${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t, dx = 6, dy = 14]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + dx}" y="${sy(y) + dy}">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    ${under}<rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>
    ${zero ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/><text class="ax" x="${P.l - 6}" y="${sy(0) + 4}" text-anchor="end">0</text>` : ''}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(([key, color]) => `<circle class="cursor" r="4.5" data-cursor="${key}"${color ? ` style="fill:${color}"` : ''}/>`).join('')}
  </svg>`;
}
const samples = (n, a, b, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });

// live energy bars on the left page (the pendulum): heights set in main.js
export const BARS = { x: 70, w: 64, gap: 46, base: 150, top: 20 };
const barChart = (key, items, Emax) => `<svg class="chart" viewBox="0 0 ${W} ${H + 10}" role="img" aria-label="能量長條圖（即時）">
  <line class="zero" x1="${BARS.x - 20}" x2="${BARS.x + items.length * (BARS.w + BARS.gap)}" y1="${BARS.base}" y2="${BARS.base}"/>
  <line class="grid" x1="${BARS.x - 20}" x2="${BARS.x + items.length * (BARS.w + BARS.gap)}" y1="${BARS.top}" y2="${BARS.top}"/>
  <text class="ax" x="${BARS.x - 26}" y="${BARS.top + 4}" text-anchor="end">${f(Emax)} J</text><text class="ax" x="${BARS.x - 26}" y="${BARS.base + 4}" text-anchor="end">0</text>
  ${items.map(([k, name, color], i) => `<rect data-bar="${key}-${k}" x="${BARS.x + i * (BARS.w + BARS.gap)}" width="${BARS.w}" y="${BARS.base}" height="0" style="fill:${color};stroke:#6c6c72;stroke-width:.8"/>
    <text class="lab" x="${BARS.x + i * (BARS.w + BARS.gap) + BARS.w / 2}" y="${BARS.base + 18}" text-anchor="middle">${name}</text>
    <text class="ax" data-val="${key}-${k}" x="${BARS.x + i * (BARS.w + BARS.gap) + BARS.w / 2}" y="${BARS.base - 6}" text-anchor="middle"></text>`).join('')}
</svg>`;

// chart ranges, shared with the live cursors in main.js
export const R = {
  pull: { x0: 0, x1: 3.2, y0: 0, y1: 70 },
  toss: { x0: 0, x1: 1.25, y0: -10, y1: 10 },
  car: { x0: 0, x1: 8, y0: 0, y1: 25 },
  drop: { x0: 0, x1: 3, y0: 0, y1: 16 },
  spring: { x0: 0, x1: 0.5, y0: 0, y1: 25 },
  slide: { x0: 0, x1: 2.2, y0: 0, y1: 18 },
  lift: { x0: 0, x1: 4.2, y0: 0, y1: 250 },
  push: { x0: 0, x1: 4, y0: 0, y1: 20, h: 140 },
  beadU: { x0: 0, x1: 6, y0: 0, y1: 4, h: 125 },
  beadF: { x0: 0, x1: 6, y0: -2, y1: 2, h: 110 },
  bondU: { x0: 0.13, x1: 0.34, y0: -1.2, y1: 0.4, h: 135 },
};
const P0 = M.pull(M.PULL.run), XS = M.SPRING.xmax;

export const PAGES = [
  {
    levels: ['junior', 'senior'],
    kicker: '第 4 章', title: '功', sub: '力沿位移做的事',
    body: `
      <p class="lede"><b>功</b>是力把能量傳入或傳出物體。只有物件在力作用期間移動，力才算做了功。</p>
      <div class="eq"><i>W</i> = |<i>F</i>| |Δ<i>x</i>| cos θ</div>
      <p>θ 是力與位移之間的夾角。功以焦耳量度：1 J 即 1 N 的力沿位移作用 1 m。</p>
      <p>一條繩以 ${f(M.PULL.F, 0)} N、${M.PULL.deg}° 角拉這個 ${f(M.PULL.m, 1)} kg 的貨箱，橫過無摩擦地板。只有 <i>F</i> cos θ = ${f(M.PULL.Fx, 1)} N 沿運動方向；<i>F</i> sin θ = ${f(M.PULL.Fy, 1)} N 垂直於運動，不做功。移過 ${f(P0.x)} m，繩做功 ${f(P0.W, 1)} J，少於水平拉動的 ${f(M.PULL.F * P0.x, 1)} J。</p>
      <div class="charts">${chart({ ...R.pull, xlabel: '位移 Δx (m)', ylabel: '繩做的功 (J)', cursors: [['pull']], label: '功對位移',
        series: [{ cls: 'trend', pts: [[0, 0], [3.2, M.PULL.F * 3.2]], tag: [1.7, M.PULL.F * 1.7 + 3, 'θ = 0°'] }, { pts: [[0, 0], [3.2, M.PULL.Fx * 3.2]], tag: [2.45, M.PULL.Fx * 2.45 - 13, 'θ = 30°'] }] })}</div>
      <p class="hintline">點擊貨箱可分解拉力。箭嘴每牛頓 ${SC.pull.F * 100} cm。</p>`,
    cam: { target: [ST.pull + 0.75, 0.6, 0], az: -20, el: 12, dist: 17 }, lit: 'pull', scene: 'pull', look: {},
    fig: '與水平成 30° 的拉力',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.1', title: '正功與負功', sub: '能量增減',
    body: `
      <p class="lede">沿運動方向的力（θ &lt; 90°）做<b>正功</b>：物體增加動能。逆着運動的力（θ &gt; 90°）做<b>負功</b>：物體失去動能。</p>
      <p>一個 ${f(M.TOSS.m)} kg 的小球以 ${f(M.TOSS.v0, 1)} m/s 上拋：上升時重力與運動相反（θ = 180°），到頂點前做了 ${f(-M.TOSS.m * M.G * M.TOSS.h, 1)} J 的功，球在那裏停下。下落時（θ = 0°），重力把 ${f(M.TOSS.m * M.G * M.TOSS.h, 1)} J 還回來。長條合起來看：<i>K</i><sub>0</sub> + <i>W</i><sub>g</sub> = <i>K</i>。</p>
      <div class="charts">${chart({ ...R.toss, zero: true, xlabel: '時間 (s)', ylabel: '能量 (J)', cursors: [['tossK', BLUE], ['tossW']], label: '動能與重力做的功對時間',
        series: [{ color: BLUE, pts: samples(40, 0, M.TOSS.run, t => M.toss(t).K), tag: [0.02, 7.2, 'K'] }, { pts: samples(40, 0, M.TOSS.run, t => M.toss(t).Wg), tag: [0.5, -9.6, '重力做的功'] }] })}</div>
      <p class="hintline">箭嘴：<b>v</b> 每 m/s ${SC.toss.v * 100} cm，<i>F</i><sub>g</sub> 每 N ${SC.toss.F * 100} cm。長條：每 J ${SC.toss.E * 100} cm。</p>`,
    cam: { target: [ST.toss + 0.8, 1.25, 0], az: -16, el: 7, dist: 12 }, lit: 'toss', scene: 'toss', look: {},
    fig: '向上逆重力，向下順重力',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.2', title: '不做功的力', sub: '垂直於位移',
    body: `
      <p class="lede">與位移成 90° 的力不做功，因為 cos 90° = 0。它可以改變運動方向，但永遠改不了速率。</p>
      <p>一個 ${f(M.WHIRL.m)} kg 的小球拴在 ${f(M.WHIRL.r, 1)} m 繩上，以 ${f(M.WHIRL.v, 1)} m/s 繞光滑枱面轉圈。繩以 <i>T</i> = ${f(M.WHIRL.T, 1)} N 把球拉向圓心，方向永遠垂直於其速度。它的動能維持 ${f(M.WHIRL.K)} J。</p>
      <p>圓軌道上的衛星同理：重力指向行星、垂直於速度，所以對它不做功。水平地板上的法向力也一樣。</p>
      <div class="charts">${chart({ x0: 0, x1: 180, y0: -10, y1: 10, zero: true, xlabel: '角度 θ (°)', ylabel: '10 N 移動 1 m 做的功 (J)', label: '功對角度',
        series: [{ pts: samples(60, 0, 180, d => M.work(10, 1, d)) }, { cls: 'trend', pts: [], tag: [20, 2.5, '正功'] }, { cls: 'trend', pts: [], tag: [120, -8, '負功'] }], marks: [[90, 0, '90° 處為零', 8, -8]] })}</div>
      <p class="hintline">點擊小球可看較早的時刻。<b>v</b>：每 m/s ${SC.whirl.v * 100} cm；<i>T</i>：每 N ${SC.whirl.F * 100} cm。</p>`,
    cam: { target: [ST.whirl, 0.1, 0], az: -14, el: 36, dist: 8.8 }, lit: 'whirl', scene: 'whirl', look: {},
    fig: '張力垂直於速度',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.3', title: '動能', sub: '運動的能量',
    body: `
      <p class="lede"><b>動能</b>是運動的能量，<i>K</i> = ½<i>mv</i>²。它是標量，以焦耳計，永不為負。</p>
      <p><b>功能定理</b>：淨功等於動能的變化。</p>
      <div class="eq"><i>W</i><sub>net</sub> = Δ<i>K</i> = ½<i>mv</i><sub>f</sub>² − ½<i>mv</i><sub>0</sub>²</div>
      <p>路面以 ${f(M.CAR.F / 1000, 1)} kN 推着這輛 ${M.CAR.m} kg 的車前進（略去阻力）。走過 ${f(M.car(M.CAR.run).x)} m 後做功 ${f(M.car(M.CAR.run).Wnet / 1000)} kJ，車速達 ${f(M.car(M.CAR.run).v, 1)} m/s：½ × ${M.CAR.m} × ${f(M.car(M.CAR.run).v, 1)}² = ${f(M.car(M.CAR.run).K / 1000)} kJ。兩支長條一同增長。</p>
      <div class="charts">${chart({ ...R.car, xlabel: '距離 (m)', ylabel: 'K = W_net (kJ)', cursors: [['car', BLUE]], label: '動能對距離',
        series: [{ color: BLUE, pts: [[0, 0], [8, M.CAR.F * 8 / 1000]], tag: [3.2, M.CAR.F * 3.2 / 1000 + 3, '斜率 = F = 3.0 kN'] }] })}</div>
      <p class="hintline">點擊汽車：重量與法向力不做功。箭嘴：每 kN 25 cm。長條：每 kJ 7.5 cm。</p>`,
    cam: { target: [ST.car + 4.6, 1.0, 0], az: -16, el: 12, dist: 36 }, lit: 'car', scene: 'car', look: {},
    fig: '淨功輸入，動能輸出',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.4', title: '重力勢能', sub: '位置的能量',
    body: `
      <p class="lede"><b>勢能</b>是儲起來、取決於位置的能量。在地球表面附近</p>
      <div class="eq"><i>U</i><sub>g</sub> = <i>mg</i>Δ<i>y</i></div>
      <p>Δ<i>y</i> 由你選定 <i>U</i><sub>g</sub> = 0 的地方量起。它等於把物體逆着重力搬到那裏所需的最少功。</p>
      <p>這個 ${f(M.DROP.m)} kg 的小球由 ${f(M.DROP.h, 1)} m 高放下：初時 <i>U</i><sub>g</sub> = ${f(M.DROP.E, 1)} J、<i>K</i> = 0。下落時 <i>U</i><sub>g</sub> 化為 <i>K</i>；着地前一刻 <i>K</i> = ${f(M.DROP.E, 1)} J，所以 <i>v</i> = ${f(Math.sqrt(2 * M.G * M.DROP.h))} m/s。由高度落下的結果：<i>U</i><sub>g0</sub> = <i>K</i><sub>f</sub>。</p>
      <div class="charts">${chart({ ...R.drop, xlabel: '離地高度 (m)', ylabel: '能量 (J)', cursors: [['dropU', AMBER], ['dropK', BLUE]], label: '勢能與動能對高度',
        series: [{ cls: 'trend', pts: [[0, M.DROP.E], [3, M.DROP.E]], tag: [1.25, M.DROP.E - 1, 'E'] }, { color: AMBER, pts: [[0, 0], [3, M.DROP.E]], tag: [2.2, 8.5, 'U<tspan dy="3" font-size="8">g</tspan>'] }, { color: BLUE, pts: [[0, M.DROP.E], [3, 0]], tag: [0.35, 10.0, 'K'] }] })}</div>
      <p class="hintline">點擊小球可移動零點。長條每 J ${SC.drop.E * 100} cm。</p>`,
    cam: { target: [ST.drop + 0.7, 1.5, 0], az: -14, el: 6, dist: 14 }, lit: 'drop', scene: 'drop', look: {},
    fig: '高度變成速度',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.5', title: '彈簧勢能', sub: '形變的能量',
    body: `
      <p class="lede">彈簧總是向自然長度的方向彈回，壓得越扁或拉得越長，彈得越大力。</p>
      <table class="data eqs"><tr><td><i>F</i><sub>s</sub> = −<i>k</i>Δ<i>x</i></td><td>與 Δx 相反；<i>k</i> 單位為 N/m</td></tr><tr><td><i>U</i><sub>s</sub> = ½<i>k</i>Δ<i>x</i>²</td><td>儲存的能量</td></tr></table>
      <p>取 <i>k</i> = ${M.SPRING.k} N/m，那個 ${f(M.SPRING.m, 1)} kg 的滑塊（<i>K</i> = ${f(M.SPRING.E, 1)} J）在 Δ<i>x</i> = ${f(XS)} m 停下：全部 ${f(M.SPRING.E, 1)} J 儲進彈簧，再全部奉還。功是<b>力–位移圖下的面積</b>；在 <i>kx</i> 之下是三角形，½ · Δ<i>x</i> · <i>k</i>Δ<i>x</i>。</p>
      <div class="charts">${chart({ ...R.spring, xlabel: '壓縮量 Δx (m)', ylabel: '彈簧力 (N)', cursors: [['spring']], label: '彈簧力對壓縮量：陰影面積即儲存的能量',
        under: `<path data-area="spring" style="fill:${BAR_COLORS.U};opacity:.45" d=""/>`, series: [{ pts: [[0, 0], [0.5, M.SPRING.k * 0.5]] }] })}</div>
      <p class="live" id="springlive"></p>
      <p class="hintline">無摩擦。箭嘴每 N ${SC.spring.F * 100} cm。長條每 J ${SC.spring.E * 100} cm。</p>`,
    cam: { target: [ST.spring - 0.05, 0.6, 0], az: -14, el: 20, dist: 14 }, lit: 'spring', scene: 'spring', look: {},
    fig: '壓縮彈簧',
  },
  {
    levels: ['senior'],
    kicker: '4.6', title: '變力做功', sub: '曲線下面積',
    body: `
      <p class="lede">力沿路途變化時，把路徑切成幼窄條，每條加 <i>F</i>Δ<i>x</i>，再讓窄條收窄。總和便成<b>F(x) 圖下的面積</b>：</p>
      <div class="eq"><i>W</i> = lim Σ <i>F</i>(<i>x</i><sub>i</sub>)Δ<i>x</i> = ∫ <i>F</i>(<i>x</i>) d<i>x</i></div>
      <p>一個 ${f(M.PUSH.m, 1)} kg 的貨箱在光滑地板上受到 <i>F</i> = <i>F</i><sub>0</sub>(1 − <i>x</i>/<i>L</i>)(1 + 2<i>x</i>/<i>L</i>)，由 ${M.PUSH.F0} N 在 <i>L</i> = ${f(M.PUSH.L, 1)} m 處遞減到 0。積分得 <i>W</i> = ⅚<i>F</i><sub>0</sub><i>L</i> = ${f(M.PUSH.W, 1)} J，全部成為動能。</p>
      <div class="charts">${chart({ ...R.push, xlabel: '位置 x (m)', ylabel: '推力 F(x) (N)', cursors: [['push']], label: '推力對位置：陰影為到貨箱為止的面積，並畫出六條窄帶',
        under: `<path data-area="push" style="fill:#86868c;opacity:.35" d=""/>` + Array.from({ length: 6 }, (_, i) => { const dx = M.PUSH.L / 6, x = i * dx, F = M.pushF(x + dx / 2), X = v => CH.sx(v, R.push.x0, R.push.x1), Y = v => CH.sy(v, R.push.y0, R.push.y1, R.push.h); return `<rect class="trend" x="${X(x)}" y="${Y(F)}" width="${X(dx) - X(0)}" height="${Y(0) - Y(F)}"/>`; }).join(''),
        series: [{ pts: [...samples(60, 0, M.PUSH.L, M.pushF), [R.push.x1, 0]] }] })}</div>
      <p class="hintline">6 條窄帶（虛線）得 ${f(M.pushStrips(6))} J；64 條得 ${f(M.pushStrips(64), 3)} J。${SC.push.F * 100} cm/N。</p>`,
    cam: { target: [ST.push + 0.1, 0.8, 0], az: -12, el: 9, dist: 14.5 }, lit: 'push', scene: 'push', look: {},
    fig: '功就是 F(x) 圖下的面積',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.7', title: '能量守恆', sub: '形式轉換',
    body: `
      <p class="lede">機械能 <i>E</i> = <i>K</i> + <i>U</i><sub>g</sub> + <i>U</i><sub>s</sub>，在無摩擦、無阻力時保持不變。</p>
      <div class="eq"><i>U</i><sub>g0</sub> + <i>U</i><sub>s0</sub> + <i>K</i><sub>0</sub> = <i>U</i><sub>gf</sub> + <i>U</i><sub>sf</sub> + <i>K</i><sub>f</sub></div>
      <p>一個 ${f(M.PEND.m, 1)} kg 的擺錘拴在 ${f(M.PEND.L, 1)} m 繩上，由 ${M.PEND.deg0}° 放開。兩端全是 <i>U</i><sub>g</sub>，${f(M.PEND.E)} J。底端全是 <i>K</i>，速度 ${f(Math.sqrt(2 * M.PEND.E / M.PEND.m))} m/s。繩的拉力垂直於運動，不做功。貼士：先找出為零的項（端點 <i>v</i> = 0，底端 Δ<i>y</i> = 0）。</p>
            <div class="charts">${barChart('pend', [['K', 'K', BAR_COLORS.K], ['U', 'U<tspan dy="3" font-size="8">g</tspan>', BAR_COLORS.U], ['E', 'E', BAR_COLORS.E]], M.PEND.E)}</div>
      <p class="hintline">點擊擺錘可分解其重量。箭嘴每 N ${SC.pendulum.F * 100} cm。長條每 J ${SC.pendulum.E * 100} cm。</p>`,
    cam: { target: [ST.pendulum + 0.7, 1.8, 0], az: -10, el: 6, dist: 14 }, lit: 'pendulum', scene: 'pendulum', look: {},
    fig: 'K 與 U 互相轉換',
  },
  {
    levels: ['senior'],
    kicker: '4.8', title: '由勢能求力', sub: '斜率為力',
    body: `
      <p class="lede">由於 d<i>W</i> = <i>F</i> d<i>x</i> = −d<i>U</i>，保守力等於 <i>U</i>(<i>x</i>) 斜率的負值：指向下坡，<i>U</i> 平坦之處為零。</p>
      <div class="eq"><i>F</i><sub>x</sub> = −d<i>U</i>/d<i>x</i></div>
      <p>一顆 ${f(M.BEAD.m)} kg 的珠子穿在光滑鐵線上，<i>x</i> 沿線量度：<i>U</i> = <i>mgh</i>(<i>x</i>)。</p>
      <div class="charts">${chart({ ...R.beadU, xlabel: '沿線的 x (m)', ylabel: 'U (J) 及其切線', cursors: [['beadU']], label: '珠子沿線的勢能及其切線',
        under: `<line data-tangent="bead" class="curve" style="stroke:#e5484d;stroke-width:1.3"/>`,
        series: [{ cls: 'trend', pts: [[0, M.BEAD.E], [R.beadU.x1, M.BEAD.E]], tag: [5.3, M.BEAD.E - 0.55, 'E'] }, { pts: samples(120, 0, M.BEAD.len, M.beadU) }] })}
        ${chart({ ...R.beadF, zero: true, xlabel: '沿線的 x (m)', ylabel: 'F = −dU/dx (N)', cursors: [['beadF']], label: '沿線的力',
        series: [{ pts: samples(120, 0, M.BEAD.len, M.beadF) }], marks: [[M.BEAD.stable, 0, '穩定', -16, 14], [M.BEAD.unstable, 0, '不穩定', 6, -6]] })}</div>
      <p class="hintline">點擊珠子可看切線。${SC.bead.F * 100} cm/N。</p>`,
    cam: { target: [ST.bead - 0.1, 0.85, 0], az: -10, el: 8, dist: 14.5 }, lit: 'bead', scene: 'bead', look: {},
    fig: '沿 U 圖下坡',
  },
  {
    levels: ['senior'],
    kicker: '4.9', title: '能量圖', sub: '能量井',
    body: `
      <p class="lede">在總能量 <i>E</i> 處畫一條水平線：<i>U</i>(<i>x</i>) 以上的空隙就是 <i>K</i>。粒子在<b>折返點</b>回頭，那裏 <i>U</i> = <i>E</i>。</p>
      <table class="data eqs"><tr><td>穩定</td><td>U 最低，U″ &gt; 0：F 往回推</td></tr><tr><td>不穩定</td><td>U 最高，U″ &lt; 0：F 往外推（駝峰）</td></tr><tr><td>隨遇</td><td>U 平坦：無力（鐵線右端）</td></tr></table>
      <p>一顆輕原子縛在重原子上，<i>E</i> = ${f(M.BOND.E / M.EV, 1)} eV。阱底附近，阱像彈簧一樣作用，<i>k</i> = <i>U</i>″：</p>
      <div class="eq">ω² = <i>U</i>″(<i>x</i><sub>0</sub>)/<i>m</i> → <i>T</i> = ${f(2 * Math.PI / M.BOND.w * 1e15, 1)} fs</div>
      <div class="charts">${chart({ ...R.bondU, xlabel: '間距 r (nm)', ylabel: 'U (eV)', cursors: [['bondU']], zero: true, label: '鍵的勢能曲線，連總能量線與折返點',
        series: [{ cls: 'trend', pts: [[R.bondU.x0, M.BOND.E / M.EV], [R.bondU.x1, M.BOND.E / M.EV]], tag: [0.315, M.BOND.E / M.EV + 0.06, 'E'] }, { pts: samples(120, 0.1355, R.bondU.x1, r => M.bondU(r * 1e-9) / M.EV) }],
        marks: [[M.BOND.r1 * 1e9, M.BOND.E / M.EV, '折返', -32, 4], [M.BOND.r2 * 1e9, M.BOND.E / M.EV, '折返', 6, 14]] })}</div>
      <p class="hintline">按 0.1 nm = 1 m 繪畫，<i>F</i> ${SC.bond.F * 100} cm/nN，慢放 ${(() => { const [a, e] = (1 / (M.SLOW * M.BOND.tscale)).toExponential(1).split('e+'); return `${a}×10<sup>${e}</sup>`; })()} 倍。</p>`,
    cam: { target: [ST.bond - 0.45, 1.25, 0], az: -10, el: 6, dist: 12.5 }, lit: 'bond', scene: 'bond', look: {},
    fig: '能量阱中的粒子',
  },
  {
    levels: ['senior'],
    kicker: '4.10', title: '不守恆之時', sub: '耗散',
    body: `
      <p class="lede">摩擦力與阻力都是<b>耗散力</b>。它們指向運動的反方向，做的功永遠是負的。它們抽走的機械能變成熱能。</p>
      <div class="eq"><i>E</i><sub>mech,i</sub> = <i>E</i><sub>mech,f</sub> + |<i>W</i><sub>resistive</sub>|</div>
      <p>那個 ${f(M.SLIDE.m, 1)} kg 的滑塊以 ${f(M.SLIDE.v0, 1)} m/s 滑上粗糙地板。μ<sub>k</sub> = ${f(M.SLIDE.mu)}，摩擦力 <i>f</i> = μ<sub>k</sub><i>mg</i> = ${f(M.SLIDE.f)} N。它滑 ${f(M.SLIDE.d)} m 後停下：|<i>W</i><sub>f</sub>| = <i>f</i>·<i>d</i> = ${f(M.SLIDE.E, 1)} J，正是全部的 <i>K</i>。<i>E</i><sub>mech</sub> 跌回零；連熱在內的總能則永不改變。</p>
      <div class="charts">${chart({ ...R.slide, xlabel: '滑行距離 (m)', ylabel: '能量 (J)', cursors: [['slideK', BLUE], ['slideT', GREY]], label: '動能與熱能對距離',
        series: [{ cls: 'trend', pts: [[0, M.SLIDE.E], [M.SLIDE.d, M.SLIDE.E]], tag: [0.85, M.SLIDE.E - 0.2, '總計'] }, { color: BLUE, pts: [[0, M.SLIDE.E], [M.SLIDE.d, 0]], tag: [0.2, 11.5, 'K'] }, { color: GREY, pts: [[0, 0], [M.SLIDE.d, M.SLIDE.E]], tag: [1.45, 8.0, '熱能'] }] })}</div>
      <p class="hintline">點擊滑塊。箭嘴每 N ${SC.slide.F * 100} cm。長條每 J ${SC.slide.E * 100} cm。</p>`,
    cam: { target: [ST.slide + 0.3, 0.55, 0], az: -16, el: 12, dist: 14 }, lit: 'slide', scene: 'slide', look: {},
    fig: '動能化為熱',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '4.11', title: '功率', sub: '做功的快慢',
    body: `
      <p class="lede"><b>功率</b>是做功的快慢，或能量由一種形式轉成另一種的快慢。以瓦特量度：1 W = 1 J/s，而 1 馬力 = ${M.HP} W。</p>
      <div class="eq"><i>P</i> = <i>W</i>/<i>t</i> = <i>F</i>Δ<i>x</i>/<i>t</i> = <i>Fv</i></div>
      <p>兩個各 ${M.LIFT.m} kg 的貨箱以等速升高 ${f(M.LIFT.h, 1)} m，所以每條繩的拉力 <i>T</i> = <i>mg</i> = ${f(M.LIFT.W, 0)} N，做功 ${f(M.LIFT.work, 0)} J。快的一條用 ${f(M.LIFT.tFast, 1)} s：${f(M.LIFT.Pfast, 0)} W。慢的一條用 ${f(M.LIFT.tSlow, 1)} s：${f(M.LIFT.Pslow, 0)} W。功相同，功率差一倍。已知速率與時間時，<i>P</i> = Δ<i>E</i>/<i>t</i> 往往最快。</p>
            <div class="charts">${chart({ ...R.lift, xlabel: '時間 (s)', ylabel: '已做的功 (J)', cursors: [['liftF'], ['liftS']], label: '功對時間：快與慢',
        series: [{ pts: [[0, 0], [M.LIFT.tFast, M.LIFT.work], [4.2, M.LIFT.work]], tag: [0.25, 160, '快：斜率 98 W'] }, { cls: 'trend', pts: [[0, 0], [M.LIFT.tSlow, M.LIFT.work]], tag: [2.45, 95, '慢：49 W'] }] })}</div>
      <p class="hintline">起動與停止的瞬間略去。箭嘴每牛頓 ${SC.lift.F * 100} cm。</p>`,
    cam: { target: [ST.lift, 1.7, 0], az: -12, el: 6, dist: 14 }, lit: 'lift', scene: 'lift', look: {},
    fig: '相同的功，一半的時間',
  },
];

// ---------- click a scene: what it breaks into ----------
export const PLATES = {
  pull: {
    title: '繩拉木箱', sub: '只有 F 沿 Δx 方向的分量做功', text: `拉力分為兩部分（灰色）。<i>F</i> cos θ 沿位移方向，做了全部的功；<i>F</i> sin θ 豎直向上，與運動方向成90°角，一點功也不做：它只是令地板向上的承托力減小。繩做的功等於木箱的動能，因為沒有其他力做功。`,
    facts: s => { const r = M.pull(s.pull.t); return [['F cos θ (along Δx)', `${f(M.PULL.Fx)} N`], ['F sin θ (across)', `${f(M.PULL.Fy)} N, no work`], ['Δx', `${f(r.x)} m`], ['W = F Δx cos θ', `${f(r.W)} J`], ['K = ½mv²', `${f(r.K)} J`]]; } },
  toss: {
    title: '豎直上拋的小球', sub: '重力先取走能量，再把它送回', text: `留意重力與速度之間的夾角。上升時兩者方向相反（180°）：重力做的功為負，K 棒縮短。下降時兩者同向（0°）：功為正，K 重新增大。在每一瞬間，K = K<sub>0</sub> + W<sub>g</sub>。`,
    facts: s => { const r = M.toss(s.toss.t); return [['高度', `${f(r.y)} m`], ['velocity', `${f(r.v)} m/s`], ['W by gravity so far', `${f(r.Wg)} J`], ['K = K₀ + W_g', `${f(M.toss(0).K)} + (${f(r.Wg)}) = ${f(r.K)} J`]]; } },
  whirl: {
    title: '繩上的小球', sub: '拉力恆與運動方向垂直', text: `圖中為較早的幾個時刻，彼此相隔四分之一圈：每一時刻，張力（指向釘）與速度（沿圓周方向）都相交成90°。在任一小步中，位移沿 <b>v</b> 方向，所以 T·Δx·cos90° = 0。重力與桌面的承托力都是豎直方向，同樣不做功。`,
    facts: () => [['tension T', `${f(M.WHIRL.T)} N`], ['angle between T and v', '90°'], ['work by T', '0 J'], ['speed', `${f(M.WHIRL.v)} m/s, constant`], ['K', `${f(M.WHIRL.K)} J, constant`]] },
  car: {
    title: '加速中的汽車', sub: '輸入淨功，轉化為動能', text: `重力與法向力都是豎直方向，與運動方向成90°角，因此不做功，可以擱在一邊。沿 Δx 方向唯一的力是路面的推力，而它同時也是淨力（紅色）。它做的功 F·Δx 就是動能的全部變化。`,
    facts: s => { const r = M.car(s.car.t); return [['F (road, forward)', `${f(M.CAR.F / 1000)} kN`], ['Δx', `${f(r.x)} m`], ['W_net = F Δx', `${f(r.Wnet / 1000)} kJ`], ['v', `${f(r.v)} m/s`], ['K = ½mv²', `${f(r.K / 1000)} kJ`]]; } },
  drop: {
    title: '下落的小球', sub: '高度轉化為速率', text: `把零點移高至 ${f(M.DROP.ref2,1)} m，每一個 U<sub>g</sub> 值都減少了 mg×${f(M.DROP.ref2,1)} = ${f(M.DROP.m * M.G * M.DROP.ref2)} J。在新零點以下，U<sub>g</sub> 為負值。但在下落過程中，U<sub>g</sub> 的<i>變化</i>保持不變，因此所預測的速率也一樣。選取令計算最簡便的零點即可。`,
    facts: s => { const r = M.drop(s.drop.t), m = M.DROP.m * M.G; return [['高度', `${f(r.y)} m`], ['U_g，零點在地面', `${f(r.U)} J`], [`U_g，零點在 ${f(M.DROP.ref2, 1)} m`, `${f(m * (r.y - M.DROP.ref2))} J`], ['自釋放起 ΔU_g', `${f(r.U - M.DROP.E)} J（兩種零點皆然）`], ['動能 K', `${f(r.K)} J`]]; } },
  spring: {
    title: '木塊與彈簧', sub: '動能先被儲存，其後歸還', text: `灰色箭號表示壓縮量 Δx，由彈簧的原長起量度。彈簧力 F<sub>s</sub> = −kΔx 指向相反方向。木塊減速時，其 K 棒的能量逐漸流入 U<sub>s</sub> 棒；壓縮至最大時，全部變成 U<sub>s</sub>。總能量永不改變。`,
    facts: s => { const r = M.spring(s.spring.t); return [['compression Δx', `${f(r.x, 3)} m`], ['F_s = −kΔx', `${f(r.F)} N`], ['U_s = ½kΔx²', `${f(r.U)} J`], ['K = ½mv²', `${f(r.K)} J`], ['K + U_s', `${f(r.K + r.U)} J`]]; } },
  push: {
    title: '變力推動的貨箱', sub: '功是 F(x) 曲線下的面積', text: `F(x) 曲線下的面積分割成 ${6} 條窄條。每條為 F(x<sub>i</sub>)·Δx，即在推力幾乎不變的一小步中所做的功。各條之和 ${f(M.pushStrips(6))} J 已經很接近積分值 ${f(M.PUSH.W)} J；窄條越薄，兩者越接近。地板水平而光滑，故重力與法向力不做功，該面積全部是動能。`,
    facts: s => { const r = M.push(s.push.t); return [['x', `${f(r.x)} m`], ['F(x)', `${f(r.F)} N`], ['W = ∫F dx so far', `${f(r.W)} J`], ['K = ½mv²', `${f(r.K)} J`], ['6-strip sum, whole push', `${f(M.pushStrips(6))} J`], ['∫₀ᴸ F dx', `${f(M.PUSH.W)} J`]]; } },
  bead: {
    title: '波形導線上的珠子', sub: '力等於 U 斜率的負值', text: `虛線是導線的切線。重力分解為沿導線的分量 mg sinθ，以及垂直於導線的分量，後者由導線的承托力抵消。由於 U = mgh，而沿導線 dh/dx = sinθ，沿線方向的分量正好是 −dU/dx。在谷底與峰頂處切線成水平：沒有沿線的力，處於平衡。`,
    facts: s => { const r = M.bead(s.bead.t); return [['x along the wire', `${f(r.x)} m`], ['U = mgh', `${f(r.U)} J`], ['dU/dx (slope)', `${f(r.slope)} J/m`], ['F = −dU/dx', `${f(r.F)} N`], ['K + U', `${f(r.K + r.U, 3)} J`]]; } },
  bond: {
    title: '兩個原子與其鍵', sub: '勢阱中的粒子', text: `鍵採用 Lennard-Jones（蘭納–瓊斯）模型，U = ε[(r<sub>0</sub>/r)¹²−2(r<sub>0</sub>/r)⁶]，其中 r<sub>0</sub> = ${f(M.BOND.r0 * 1e9)} nm；重的原子幾乎不動。殘影標出轉向點，該處 U = E，原子靜止。藍色虛線拋物線為 ½k(r−r<sub>0</sub>)²，其中 k = U″(r<sub>0</sub>) = ${f(M.BOND.k,0)} N/m：它與勢阱底部吻合，這正是小振動呈簡諧運動、且 ω² = U″/m 的原因。在較高處，真實的勢阱並不對稱：阱的內側陡峭、外側平緩，所以這次振盪較慢，而且在拉伸的一段停留較久。`,
    facts: s => { const r = M.bond(s.bond.t); return [['r', `${f(r.r * 1e9, 4)} nm`], ['U', `${f(r.U / M.EV, 3)} eV`], ['K = E − U', `${f(r.K / M.EV, 3)} eV`], ['F = −dU/dr', `${f(r.F * 1e9)} nN`], ['k = U″(r₀)', `${f(M.BOND.k, 0)} N/m`], ['小振動／今次週期', `${f(2 * Math.PI / M.BOND.w * 1e15)} / ${f(M.BOND.period * 1e15)} fs`]]; } },
  pendulum: {
    title: '單擺', sub: 'K 與 U 互相轉換，總和保持不變', text: `重力分解為沿路徑的 mg sinθ，以及沿繩方向的 mg cosθ。只有 mg sinθ 做功：上升時它使擺錘減速，下降時使其加快。張力與 mg cosθ 都與運動方向垂直，一點功也不做，因此 K + U<sub>g</sub> 保持不變。`,
    facts: s => { const r = M.pendulum(s.pendulum.t); return [['angle θ', `${f(r.th * 180 / Math.PI, 1)}°`], ['mg sin θ (along path)', `${f(r.Ftan)} N`], ['tension T', `${f(r.T)} N, no work`], ['動能 K', `${f(r.K)} J`], ['U_g', `${f(r.U)} J`], ['K + U_g', `${f(r.K + r.U)} J`]]; } },
  slide: {
    title: '滑行至停止的木塊', sub: '摩擦力把 K 轉化為熱', text: `重力與法向力不做功，可擱在一邊。摩擦力是沿運動方向唯一的力，而且指向後方：θ = 180°，所以它做的功是 −f·Δx。這份負功正好等於失去的動能，並以熱的形式重現在木塊和地板之中。`,
    facts: s => { const r = M.slide(s.slide.t); return [['friction f = μk mg', `${f(M.SLIDE.f)} N`], ['Δx', `${f(r.x)} m`], ['W_f = −f Δx', `${f(r.Wf)} J`], ['動能 K', `${f(r.K)} J`], ['thermal energy', `${f(r.Eth)} J`], ['K + thermal', `${f(r.K + r.Eth)} J`]]; } },
  lift: {
    title: '吊起貨箱', sub: '功相同，功率不同', text: `灰色箭號表示每個貨箱上升的 Δy。勻速上升時，繩的拉力等於重力，所以每條繩做功 W = mgΔy。上升高度相同，做功便相同；較快的貨箱用一半的時間到達，因此它的繩輸出的功率是兩倍。`,
    facts: s => { const a = M.lift(s.lift.t, M.LIFT.vFast), b = M.lift(s.lift.t, M.LIFT.vSlow); return [['T = mg', `${f(M.LIFT.W, 1)} N`], ['fast: work so far', `${f(a.W, 0)} J, P ${f(a.P, 0)} W`], ['slow: work so far', `${f(b.W, 0)} J, P ${f(b.P, 0)} W`], ['P = Fv (fast)', `${f(M.LIFT.W, 0)} × ${f(M.LIFT.vFast, 1)} = ${f(M.LIFT.Pfast, 0)} W`]]; } },
};
