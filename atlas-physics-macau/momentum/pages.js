// Chapter 5, page by page (after the AP Physics 1 organizer, Unit 6). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, P_SCALE, F_WALL, F_EGG, EGG_ZOOM, CRASH_SCALE, W_SCALE, W_PLATE } from './world.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const k = (x, n = 0) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const cm = s => `${(s * 100).toFixed(0)} cm`;

// ---------- small SVG charts for the left page ----------
const W = 420, H = 140, P = { l: 44, r: 14, t: 16, b: 30 };
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], cursors = [], label }) {
  const sx = x => CH.sx(x, x0, x1), sy = y => CH.sy(y, y0, y1);
  const d = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('');
  const paths = series.map(s => (s.fill ? `<path class="area" d="${d(s.pts)}L${sx(s.pts.at(-1)[0]).toFixed(1)},${sy(0).toFixed(1)}L${sx(s.pts[0][0]).toFixed(1)},${sy(0).toFixed(1)}Z"/>` : '') +
    `<path class="${s.cls || 'curve'}" d="${d(s.pts)}"/>` + (s.tag ? `<text class="lab${s.cls === 'total' ? ' blue' : ''}" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}"${s.tag[3] ? ' text-anchor="end"' : ''}>${s.tag[2]}</text>` : '')).join('');
  const zero = y0 < 0 && y1 > 0 ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  const mk = marks.map(([x, y, t]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + 6}" y="${sy(y) + 14}">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${zero}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${y0}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(c => `<circle class="cursor" r="4.5" data-cursor="${c}"/>`).join('')}
  </svg>`;
}
const samples = (a, b, n, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });

// collision pages: momentum of each cart and the total, against time
export const COLL_T = { y0: -3, y1: 7 };
const momChart = (c, key, tags) => chart({
  x0: 0, x1: c.run, ...COLL_T, xlabel: '時間 (s)', ylabel: '動量 (kg·m/s)', cursors: [key], label: '兩車各自的動量與總動量對時間',
  series: [
    { pts: [[0, c.m1 * c.u1], [c.tc, c.m1 * c.u1], [c.tc, c.m1 * c.v1], [c.run, c.m1 * c.v1]], tag: [tags[0][0], tags[0][1], 'p₁'] },
    { pts: [[0, c.m2 * c.u2], [c.tc, c.m2 * c.u2], [c.tc, c.m2 * c.v2], [c.run, c.m2 * c.v2]], tag: [tags[1][0], tags[1][1], 'p₂'] },
    { cls: 'total', pts: [[0, c.m1 * c.u1 + c.m2 * c.u2], [c.run, c.m1 * c.u1 + c.m2 * c.u2]], tag: [c.run - 0.03, c.m1 * c.u1 + c.m2 * c.u2, 'P 總計', 1] },
  ] });
const collTable = c => { const K0 = M.ke(c.m1, c.u1) + M.ke(c.m2, c.u2), K1 = M.ke(c.m1, c.v1) + M.ke(c.m2, c.v2); return `
  <table class="data">
    <tr><th>kg·m/s, J</th><th><i>p</i>₁</th><th><i>p</i>₂</th><th><i>P</i> 總計</th><th><i>KE</i></th></tr>
    <tr><td>碰前</td><td>${f(c.m1 * c.u1, 1)}</td><td>${f(c.m2 * c.u2, 1)}</td><td>${f(c.m1 * c.u1 + c.m2 * c.u2, 1)}</td><td>${f(K0)}</td></tr>
    <tr><td>碰後</td><td>${f(c.m1 * c.v1, 1)}</td><td>${f(c.m2 * c.v2, 1)}</td><td>${f(c.m1 * c.v1 + c.m2 * c.v2, 1)}</td><td>${f(K1)}</td></tr>
  </table>`; };

const Wl = M.WALL, Eg = M.EGG, S = M.STICK, B = M.BOUNCE, X = M.BURST, Pd = M.PEND, C = M.CRASH, Sh = M.SHELL;
const deg = r => (r * 180 / Math.PI).toFixed(1);
// a real bullet: 10 g into 2.0 kg, swinging to the same angle
export const BULLET = ((0.01 + 2.0) / 0.01) * Math.sqrt(2 * M.G * Pd.L * (1 - Math.cos(Pd.theta)));

// tip-to-tail sketch of the crash momenta, to scale
const vecSketch = (() => {
  const s = 0.0016, ox = 190, oy = 128, ax = ox + C.px * s, ay = oy - C.py * s;
  const head = (x1, y1, x2, y2, cls) => { const a = Math.atan2(y2 - y1, x2 - x1), L = 9; return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2 - 6 * Math.cos(a)}" y2="${y2 - 6 * Math.sin(a)}"/><path class="${cls}h" d="M${x2},${y2}L${x2 - L * Math.cos(a - 0.4)},${y2 - L * Math.sin(a - 0.4)}L${x2 - L * Math.cos(a + 0.4)},${y2 - L * Math.sin(a + 0.4)}Z"/>`; };
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="頭尾相接相加的動量向量">
    ${head(ox, oy, ax, oy, 'vk')}${head(ax, oy, ax, ay, 'vk')}${head(ox, oy, ax, ay, 'vb')}
    <text class="lab" x="${ox - 4}" y="${oy + 6}" text-anchor="end">p_car ${k(C.px)}</text>
    <text class="lab" x="${ax + 8}" y="${(oy + ay) / 2}">p_truck ${k(C.py)}</text>
    <text class="lab blue" x="${(ox + ax) / 2 - 8}" y="${(oy + ay) / 2 - 6}" text-anchor="end">P ${k(C.P)}</text>
    <text class="ax" x="${W - 14}" y="20" text-anchor="end">kg·m/s · 東 → 北 ↑</text>
  </svg>`;
})();

const shellChart = chart({
  x0: 0, x1: 14, y0: 0, y1: 5, xlabel: 'x (m)', ylabel: '高度 (m)', cursors: ['shell'], label: '炮殼、兩半與質心的軌跡',
  series: [
    { cls: 'trend', pts: samples(0, Sh.run, 40, t => 0).map(([t]) => M.shell(t).cm), tag: [Sh.R * 0.62, Sh.H * 0.55, '質心'] },
    { pts: samples(0, Sh.ta, 20, t => 0).map(([t]) => M.shell(t).cm) },
    { pts: samples(Sh.ta, Sh.run, 20, t => 0).map(([t]) => M.shell(t).a), tag: [Sh.R / 2 - 0.15, 0.9, '後半', 1] },
    { pts: samples(Sh.ta, Sh.run, 20, t => 0).map(([t]) => M.shell(t).b), tag: [10.3, 3.0, '前半'] },
  ],
  marks: [[Sh.R / 2, 0, 'R/2'], [Sh.R, 0, 'R'], [1.5 * Sh.R, 0, '3R/2']],
});


// continuous bodies: λ(x) with the moment x·λ(x) shaded; strip sums converging
const Rd = M.ROD, Tr = M.TRI, Se = M.SEMI, Ll = M.ELL, Ho = M.HOLE;
const rodChart = chart({
  x0: 0, x1: Rd.L, y0: 0, y1: 3, xlabel: '沿棒的 x (m)', ylabel: 'λ (kg/m) 與 x·λ (kg)', cursors: ['rodL', 'rodM'], label: '沿棒的線密度及其矩；並標出平衡點',
  series: [
    { fill: true, pts: samples(0, Rd.L, 40, x => x * M.lam('N', x)), tag: [0.95, 1.25, 'x·λ：面積 = ∫x dm', 1] },
    { pts: samples(0, Rd.L, 2, x => M.lam('N', x)), tag: [1.97, 1.02, 'λ：面積 = M', 1] },
    { cls: 'trend', pts: [[Rd.xN, 0], [Rd.xN, 3]] },
  ],
  marks: [[Rd.xN, 2.92, 'x_cm = 2L/3']] });
const NS = Array.from({ length: 12 }, (_, i) => i + 1);
const stripChart = chart({
  x0: 1, x1: 12, y0: 0.95, y1: 1.55, xlabel: '窄條數 n', ylabel: '窄條和 ÷ 精確值', label: '窄條和對質心的估計隨 n 增大逼近積分值',
  series: [
    { pts: NS.map(n => [n, M.stripSum(M.triW, Tr.h, n) / Tr.ucm]), tag: [11.8, 1.44, '上：三角形', 1] },
    { pts: NS.map(n => [n, M.stripSum(M.semiW, Se.R, n) / Se.ucm]), tag: [11.8, 1.36, '下：半圓', 1] },
    { cls: 'trend', pts: [[1, 1], [12, 1]], tag: [11.8, 1.0, '積分值', 1] },
  ],
  });
const xy = c => `(${f(c[0])}, ${f(c[1])})`;

export const PAGES = [
  {
    levels: ['senior'],
    kicker: '第 5 章', title: '動量', sub: '質量乘速度',
    body: `
      <p class="lede"><b>動量</b>量度要停下一個運動中的物體有多難：它的質量乘速度，是向量，單位 kg·m/s。</p>
      <div class="eq"><i>p</i> = <i>mv</i></div>
      <p>輕而快的球與重而慢的車可以帶同樣的動量：</p>
      <table class="data">
        <tr><th></th><th>質量</th><th>速度</th><th>動量</th><th>動能</th></tr>
        <tr><td>小球</td><td>${f(M.BALL.m, 1)} kg</td><td>${f(M.BALL.v, 1)} m/s</td><td>${f(M.p(M.BALL.m, M.BALL.v), 1)} kg·m/s</td><td>${f(M.ke(M.BALL.m, M.BALL.v), 1)} J</td></tr>
        <tr><td>小車</td><td>${f(M.CART.m, 1)} kg</td><td>${f(M.CART.v, 1)} m/s</td><td>${f(M.p(M.CART.m, M.CART.v), 1)} kg·m/s</td><td>${f(M.ke(M.CART.m, M.CART.v), 1)} J</td></tr>
      </table>
      <p>動能卻不相同：<i>K</i> = <i>p</i>²/2<i>m</i>，所以輕的帶得更多。動量的變化是 Δ<i>p</i> = <i>m</i>Δ<i>v</i>。</p>
      <div class="charts">${chart({ x0: 0, x1: 5, y0: 0, y1: 4, xlabel: '速度 (m/s)', ylabel: '動量 (kg·m/s)', label: '0.5 kg 與 2 kg 的動量對速度',
        series: [{ pts: [[0, 0], [2, 4]], tag: [1.75, 3.0, '2.0 kg', 1] }, { pts: [[0, 0], [5, 2.5]], tag: [4.1, 2.05, '0.5 kg'] }, { cls: 'trend', pts: [[0, 2], [5, 2]] }],
        marks: [[M.CART.v, 2, '小車'], [M.BALL.v, 2, '小球']] })}</div>
      <p class="hintline">動量箭嘴每 kg·m/s ${cm(P_SCALE)}。點擊可叠加速度。</p>`,
    cam: { target: [STATIONS.mom + 0.3, 0.4, 0], az: -14, el: 16, dist: 16 }, lit: 'mom', scene: 'mom', look: {},
    fig: '相同的 p，不同的 m 與 v',
  },
  {
    levels: ['senior'],
    kicker: '5.1', title: '衝量', sub: '力對時間的累積',
    body: `
      <p class="lede">推一件物件一段時間，它的動量就改變。推力乘時間就是<b>衝量</b>。</p>
      <div class="eq"><i>J</i> = <i>F</i>Δ<i>t</i> = Δ<i>p</i></div>
      <p>那個 ${f(Wl.m, 1)} kg 的球以 +${f(Wl.v, 1)} m/s 到達，再以 −${f(Wl.v, 1)} m/s 離開：Δ<i>p</i> = −${f(Wl.J, 1)} kg·m/s，是它動量的兩倍，因為它既要停下<i>又</i>要反彈。</p>
      <p>磚牆的推力在 ${f(Wl.tau, 2)} s 內先升後降，高峰 ${f(Wl.Fpk, 0)} N。<b>力–時間圖下的面積</b>就是衝量 ${f(Wl.J, 1)} N·s：相當於以 ${f(Wl.Favg, 0)} N 穩定推 ${f(Wl.tau, 2)} s。它沿力的方向，即離開磚牆的方向。</p>
      <div class="charts">${chart({ x0: 0.15, x1: 0.35, y0: 0, y1: 50, xlabel: '時間 (s)', ylabel: '磚牆的推力 (N)', cursors: ['wall'], label: '球所受的力對時間；陰影面積就是衝量',
        series: [{ fill: true, pts: samples(0.15, 0.35, 80, t => -M.wall(t).F), tag: [0.287, 30, `面積 = ${f(Wl.J, 1)} N·s`] }] })}</div>
      <p>AP Physics C：力變化時，衝量就是積分 <i>J</i> = ∫<i>F</i> d<i>t</i>。對這個脈衝：</p>
      <div class="eq">∫<sub>0</sub><sup>τ</sup> <i>F</i><sub>pk</sub> sin(π<i>t</i>/τ) d<i>t</i> = 2<i>F</i><sub>pk</sub>τ/π = ${f(Wl.J, 1)} N·s</div>
      <p class="hintline">${M.SLOW_HIT}× 慢放。力每牛頓 ${cm(F_WALL)}。點擊可看 Δp。</p>`,
    cam: { target: [STATIONS.wall - 0.55, 0.6, 0], az: -14, el: 12, dist: 7.2 }, lit: 'wall', scene: 'wall', look: {},
    fig: '磚牆的推力令小球反向',
  },
  {
    levels: ['senior'],
    kicker: '5.2', title: '較小的力', sub: '拉長作用時間',
    body: `
      <p class="lede">兩隻雞蛋從 ${f(Eg.h * 100, 0)} cm 落下，以 ${f(Eg.v0, 1)} m/s 着地。每隻都要失去 ${f(Eg.J, 2)} kg·m/s，所以都需要同樣的衝量。</p>
      <p>枕頭會讓開，用時 ${f(Eg.tauSoft, 2)} s；地板只用 ${f(Eg.tauHard, 2)} s。<i>F</i>Δ<i>t</i> 不變，時間細六倍，力便大六倍：</p>
      <table class="data">
        <tr><th></th><th>停下時間</th><th>平均淨力</th><th>峰值</th></tr>
        <tr><td>枕頭</td><td>${f(Eg.tauSoft, 2)} s</td><td>${f(Eg.J / Eg.tauSoft)} N</td><td>${f(Math.PI * Eg.J / (2 * Eg.tauSoft))} N</td></tr>
        <tr><td>地板</td><td>${f(Eg.tauHard, 2)} s</td><td>${f(Eg.J / Eg.tauHard)} N</td><td>${f(Math.PI * Eg.J / (2 * Eg.tauHard))} N</td></tr>
      </table>
      <div class="charts">${chart({ x0: 0, x1: 0.2, y0: 0, y1: 8, xlabel: '着地後時間 (s)', ylabel: '淨力 (N)', cursors: ['eggS', 'eggH'], label: '兩個面積相同的力脈衝',
        series: [{ fill: true, pts: samples(0, Eg.tauSoft, 60, t => M.pulse(t, Eg.J, Eg.tauSoft, Eg.m).F).concat([[0.2, 0]]), tag: [0.075, 1.4, '枕頭'] },
                 { fill: true, pts: samples(0, Eg.tauHard, 30, t => M.pulse(t, Eg.J, Eg.tauHard, Eg.m).F).concat([[0.2, 0]]), tag: [0.034, 5.2, '地板：同一面積'] }] })}</div>
      <p>安全氣袋、潰縮區、屈膝都不能改變 Δ<i>p</i>；它們拉長的是 Δ<i>t</i>。</p>
      <p class="hintline">放大 ${EGG_ZOOM} 倍、慢放 ${M.SLOW_HIT} 倍繪畫。紅色：淨力，每牛頓 ${cm(F_EGG * EGG_ZOOM)}。點擊可對比。</p>`,
    cam: { target: [STATIONS.eggs, 1.05, 0], az: -10, el: 10, dist: 10.5 }, lit: 'eggs', scene: 'eggs', look: {},
    fig: '相同的 Δp，時間拉長',
  },
  {
    levels: ['senior'],
    kicker: '5.3', title: '動量守恆', sub: '無外力時',
    body: `
      <p class="lede">把兩車視為一個<b>封閉系統</b>，沒有外部淨力。它的總動量不可能改變。</p>
      <p>兩車互施等大反向的衝量：一方失去多少，另一方就得多少。</p>
      <div class="eq"><i>m</i>₁<i>v</i>₁ + <i>m</i>₂<i>v</i>₂ = (<i>m</i>₁ + <i>m</i>₂)<i>v</i>′</div>
      <p>${f(S.m1, 1)} kg 以 ${f(S.u1, 1)} m/s 撞上 ${f(S.m2, 1)} kg 的 ${f(S.u2, 1)} m/s。兩車黏住，<i>v</i>′ = ${f(S.m1 * S.u1 + S.m2 * S.u2, 1)}/${f(S.m1 + S.m2, 1)} = ${f(S.v1, 1)} m/s。<b>完全非彈性</b>：動能化為熱、聲與凹痕。</p>
      ${collTable(S)}
      <div class="charts">${momChart(S, 'stick', [[0.05, 6.1], [0.05, -1.5]])}</div>
      <p class="hintline">藍色：總動量 <i>P</i>。圓餅：質心。點擊可對比。</p>`,
    cam: { target: [STATIONS.stick - 0.4, 0.6, 0], az: -12, el: 14, dist: 17 }, lit: 'stick', scene: 'stick', look: {},
    fig: 'Δp = 0, ΔKE < 0',
  },
  {
    levels: ['senior'],
    kicker: '5.4', title: '彈性碰撞', sub: '動能亦守恆',
    body: `
      <p class="lede">若兩車彈開而能量毫無損失，碰撞便是<b>彈性</b>的：動量<i>和</i>動能都守恆。</p>
      <p>${f(B.m1, 1)} kg 以 ${f(B.u1, 1)} m/s 撞上靜止的 ${f(B.m2, 1)} kg。兩個未知數，兩條方程：</p>
      <table class="data eqs">
        <tr><td><i>m</i>₁<i>v</i>₁ + <i>m</i>₂<i>v</i>₂ = <i>m</i>₁<i>v</i>₁′ + <i>m</i>₂<i>v</i>₂′</td><td>Δ<i>p</i> = 0</td></tr>
        <tr><td>½<i>m</i>₁<i>v</i>₁² + ½<i>m</i>₂<i>v</i>₂² = ½<i>m</i>₁<i>v</i>₁′² + ½<i>m</i>₂<i>v</i>₂′²</td><td>Δ<i>KE</i> = 0</td></tr>
      </table>
      <p>所以 <i>v</i>₁′ = ${f(B.v1, 1)} m/s，<i>v</i>₂′ = ${f(B.v2, 1)} m/s。等大反向的 ${f(B.m2 * B.v2, 1)} N·s 衝量：質量小的得較大的 Δ<i>v</i>。</p>
      ${collTable(B)}
      <div class="charts">${momChart(B, 'bounce', [[0.05, 4.1], [0.05, -1.0]])}</div>`,
    cam: { target: [STATIONS.bounce - 0.5, 0.6, 0], az: -12, el: 14, dist: 17 }, lit: 'bounce', scene: 'bounce', look: {},
    fig: 'Δp = 0, ΔKE = 0',
  },
  {
    levels: ['senior'],
    kicker: '5.5', title: '爆炸', sub: '內力分離',
    body: `
      <p class="lede">兩車相連在一起靜止；中間的彈簧被釋放。總動量原為零，所以仍是零。</p>
      <div class="eq">(<i>m</i>₁ + <i>m</i>₂)<i>v</i> = <i>m</i>₁<i>v</i>₁′ + <i>m</i>₂<i>v</i>₂′</div>
      <p>取 <i>v</i> = 0，兩車的動量等大反向，所以 ${f(X.m1, 1)} kg 的車以三倍於 ${f(X.m2, 1)} kg 車的速度走。彈簧的 ${f(X.Q, 1)} J 變成動能：動能<i>增加</i>。</p>
      ${collTable(X)}
      <table class="data">
        <tr><th>碰撞</th><th>Δ<i>p</i></th><th>Δ<i>KE</i></th><th>線索</th></tr>
        <tr><td>非彈性</td><td>0</td><td>&lt; 0</td><td>動能損失；黏住時最多</td></tr>
        <tr><td>彈性</td><td>0</td><td>0</td><td>彈開，分毫不失</td></tr>
        <tr><td>爆炸</td><td>0</td><td>&gt; 0</td><td>同源出發，四散分飛</td></tr>
      </table>
      <p class="hintline">質心不動。點擊可看碰前與碰後。</p>`,
    cam: { target: [STATIONS.burst - 0.8, 0.6, 0], az: -12, el: 14, dist: 17 }, lit: 'burst', scene: 'burst', look: {},
    fig: 'Δp = 0, ΔKE > 0',
  },
  {
    levels: ['senior'],
    kicker: '5.6', title: '彈道擺', sub: '碰撞加擺動',
    body: `
      <p class="lede">一團 ${f(Pd.m, 1)} kg 黏土以 ${f(Pd.u, 0)} m/s 黏上 ${f(Pd.M, 1)} kg 木塊，木塊掛在 ${f(Pd.L, 1)} m 繩上，之後擺高。兩步，兩條定律：</p>
      <table class="data">
        <tr><th>步驟</th><th>定律</th><th>本例</th></tr>
        <tr><td>撞擊</td><td>Δ<i>p</i> = 0: <i>mv</i> = (<i>m</i>+<i>M</i>)<i>v</i>′</td><td><i>v</i>′ = ${f(Pd.v)} m/s</td></tr>
        <tr><td>擺動</td><td>Δ<i>E</i> = 0: ½<i>v</i>′² = <i>g</i>Δ<i>y</i></td><td>Δ<i>y</i> = ${f(Pd.dy * 100, 1)} cm</td></tr>
      </table>
      <p>能量在撞擊中不守恆（${f(M.ke(Pd.m, Pd.u), 1)} J → ${f(M.ke(Pd.m + Pd.M, Pd.v))} J），動量在擺動中不守恆（繩與重力是外力）。取 Δ<i>y</i> = <i>L</i>(1 − cos θ)，θ = ${deg(Pd.theta)}°：</p>
      <div class="eq"><i>v</i> = ((<i>m</i> + <i>M</i>)/<i>m</i>) √(2<i>gL</i>(1 − cos θ))</div>
      <div class="charts">${chart({ x0: 0, x1: 2.4, y0: 0, y1: 2, xlabel: '撞擊後時間 (s)', ylabel: '能量 (J)', cursors: ['pendK', 'pendU'], label: '擺動時的動能與勢能',
        series: [{ pts: samples(0, Pd.T, 60, t => M.pend(Pd.lead + t).K), tag: [0.1, 1.15, 'KE'] }, { pts: samples(0, Pd.T, 60, t => M.pend(Pd.lead + t).U), tag: [Pd.T / 4 - 0.12, 1.15, 'Ug'] }, { cls: 'trend', pts: [[0, M.ke(Pd.m + Pd.M, Pd.v)], [2.4, M.ke(Pd.m + Pd.M, Pd.v)]], tag: [2.36, 1.72, '總計', 1] }] })}</div>
      <p class="hintline">點擊可標出 Δy、L 與 θ，以及其他求 <i>v</i>′ 的方法。</p>`,
    cam: { target: [STATIONS.pend + 0.2, 1.25, 0], az: -10, el: 8, dist: 7.4 }, lit: 'pend', scene: 'pend', look: {},
    fig: '撞擊 Δp = 0，擺動 ΔE = 0',
  },
  {
    levels: ['senior'],
    kicker: '5.7', title: '二維碰撞', sub: '向量動量',
    body: `
      <p class="lede">一輛 ${k(C.m1)} kg 的汽車向東以 ${f(C.v1, 0)} m/s 行駛，一輛 ${k(C.m2)} kg 的貨車向北以 ${f(C.v2, 0)} m/s 行駛，相撞後鎖在一起。動量在每個方向分別守恆。</p>
      <table class="data">
        <tr><th>向東 (<i>x</i>)</th><th>向北 (<i>y</i>)</th></tr>
        <tr><td><i>m</i>₁<i>v</i>₁ = (<i>m</i>₁+<i>m</i>₂)<i>v</i>′<sub>x</sub></td><td><i>m</i>₂<i>v</i>₂ = (<i>m</i>₁+<i>m</i>₂)<i>v</i>′<sub>y</sub></td></tr>
        <tr><td>${k(C.px)} = ${k(C.m1 + C.m2)} <i>v</i>′<sub>x</sub></td><td>${k(C.py)} = ${k(C.m1 + C.m2)} <i>v</i>′<sub>y</sub></td></tr>
        <tr><td><i>v</i>′<sub>x</sub> = ${f(C.vx)} m/s</td><td><i>v</i>′<sub>y</sub> = ${f(C.vy)} m/s</td></tr>
      </table>
      <p>把動量頭尾相接：<i>P</i> = √(<i>p</i><sub>x</sub>² + <i>p</i><sub>y</sub>²) = ${k(C.P)} kg·m/s，所以 <i>v</i>′ = <i>P</i>/(<i>m</i>₁+<i>m</i>₂) = ${f(C.v)} m/s，方位東偏北 ${C.angle.toFixed(1)}°。速率永不可直接相加。</p>
      <div class="charts">${vecSketch}</div>
      <p class="hintline">本頁箭嘴每 1000 kg·m/s ${cm(CRASH_SCALE)}。點擊可把它們頭尾相接。</p>`,
    cam: { target: [STATIONS.crash + 0.5, 0, -1.5], az: -10, el: 50, dist: 58 }, lit: 'crash', scene: 'crash', look: {},
    fig: 'p_car + p_truck = P',
  },
  {
    levels: ['senior'],
    kicker: '5.8', title: '質心', sub: '質量中心',
    body: `
      <p class="lede"><b>質心</b>是系統按質量加權的平均位置。內部推力改變不了它怎樣運動：碰撞幾頁上它一直直線滑過每次碰撞。</p>
      <div class="eq"><i>x</i><sub>cm</sub> = (<i>m</i>₁<i>x</i>₁ + <i>m</i>₂<i>x</i>₂) / (<i>m</i>₁ + <i>m</i>₂)</div>
      <p>一個 ${f(Sh.m, 1)} kg 炮殼以 ${f(Sh.v0, 0)} m/s、${Sh.deg}° 仰角射出，在頂點裂成等重的兩半。後半留在原地，落到 <i>R</i>/2。前半取得全部動量，<i>v</i>₂′ = ((<i>m</i>₁+<i>m</i>₂)/<i>m</i>₂)<i>v</i><sub>x</sub> = ${f(Sh.v2, 1)} m/s，落在 3<i>R</i>/2。質心落在 <i>R</i> = ${f(Sh.R)} m，彷彿從未爆開。</p>
      <div class="charts">${shellChart}</div>
      <p>貼士：兩塊碎片總互得等大反向的衝量，所以較輕的得較大的 Δ<i>v</i>。</p>`,
    cam: { target: [STATIONS.shell + 0.2, 2.4, 0], az: -6, el: 8, dist: 44 }, lit: 'shell', scene: 'shell', look: {},
    fig: '質心落在 R 處',
  },
  {
    levels: ['senior'],
    kicker: '5.9', title: '剛體', sub: '轉動與平動',
    body: `
      <p class="lede">把實心棒切成 d<i>m</i> = λ d<i>x</i> 的小片（λ：每米的質量），按其位置加權，再積分。</p>
      <div class="eq"><i>x</i><sub>cm</sub> = (1/<i>M</i>) ∫ <i>x</i> d<i>m</i></div>
      <table class="data">
        <tr><th>${f(Rd.L, 1)} m 棒</th><th><i>M</i> = ∫λ d<i>x</i></th><th><i>x</i><sub>cm</sub></th></tr>
        <tr><td>λ = ${f(Rd.lamU, 1)} kg/m</td><td>λ<i>L</i> = ${f(Rd.MU, 1)} kg</td><td><i>L</i>/2 = ${f(Rd.xU)} m</td></tr>
        <tr><td>λ = λ₀<i>x</i>/<i>L</i>, λ₀ = ${f(Rd.lam0, 1)}</td><td>λ₀<i>L</i>/2 = ${f(Rd.MN, 1)} kg</td><td>2<i>L</i>/3 = ${f(Rd.xN)} m</td></tr>
      </table>
      <div class="eq">∫<i>x</i> d<i>m</i> = ∫<sub>0</sub><sup><i>L</i></sup> λ<sub>0</sub><i>x</i>²/<i>L</i> d<i>x</i> = λ<sub>0</sub><i>L</i>²/3</div>
      <p>除以 <i>M</i> = λ₀<i>L</i>/2，得 2<i>L</i>/3，在中點之外。每根棒都放在其 <i>x</i><sub>cm</sub> 處的刀口上，那裏的淨轉矩 ∫(<i>x</i> − <i>x</i><sub>cm</sub>)<i>g</i> d<i>m</i> = 0。</p>
      <div class="charts">${rodChart}</div>
      <p class="hintline">越深色越密。點擊可切片（每牛頓 ${cm(W_SCALE)}）。</p>`,
    cam: { target: [STATIONS.rods + 0.1, 0.4, 0], az: -14, el: 22, dist: 9.4 }, lit: 'rods', scene: 'rods', look: {},
    fig: '在 x_cm 處平衡',
  },
  {
    levels: ['senior'],
    kicker: '5.10', title: '板塊', sub: '連續體',
    body: `
      <p class="lede">把板材（σ = ${f(M.SIGMA, 1)} kg/m²）沿平行於一邊的方向切成窄條。離邊 <i>u</i>、闊 <i>w</i>(<i>u</i>) 的窄條，有 d<i>m</i> = σ<i>w</i> d<i>u</i>。</p>
      <div class="eq"><i>u</i><sub>cm</sub> = (1/<i>M</i>) ∫ <i>u</i> σ<i>w</i>(<i>u</i>) d<i>u</i></div>
      <table class="data">
        <tr><th>板材</th><th><i>w</i>(<i>u</i>)</th><th><i>u</i><sub>cm</sub></th></tr>
        <tr><td>三角形，<i>h</i> = ${f(Tr.h, 1)} m</td><td><i>b</i>(1 − <i>u</i>/<i>h</i>)</td><td><i>h</i>/3 = ${f(Tr.ucm)} m</td></tr>
        <tr><td>半圓，<i>R</i> = ${f(Se.R, 1)} m</td><td>2√(<i>R</i>² − <i>u</i>²)</td><td>4<i>R</i>/3π = ${f(Se.ucm)} m</td></tr>
      </table>
      <div class="eq">∫<sub>0</sub><sup><i>R</i></sup> 2<i>u</i>√(<i>R</i>² − <i>u</i>²) d<i>u</i> = 2<i>R</i>³/3</div>
      <p>÷ 面積 π<i>R</i>²/2 = 4<i>R</i>/3π。三角形正是上頁的棒橫過來：由頂點起，窄條像 λ₀<i>x</i>/<i>L</i> 般長闊。窄條和逐步收斂：</p>
      <div class="charts">${stripChart}</div>
      <p class="hintline">大頭針釘在各質心。點擊可分開窄條（每牛頓 ${cm(W_PLATE)}）。</p>`,
    cam: { target: [STATIONS.plates + 0.05, 0.3, 0], az: -10, el: 22, dist: 10.6 }, lit: 'plates', scene: 'plates', look: {},
    fig: 'u_cm = (1/M)∫u dm',
  },
  {
    levels: ['senior'],
    kicker: '5.11', title: '部件與孔洞', sub: '質量分佈',
    body: `
      <p class="lede">物體由簡單部件組成時，把每個部件的質量放在它自己的質心上再相加。孔洞就是一件帶負質量的部件。</p>
      <div class="eq"><i>x</i><sub>cm</sub> = (<i>m</i><sub>A</sub><i>x</i><sub>A</sub> + <i>m</i><sub>B</sub><i>x</i><sub>B</sub>)/(<i>m</i><sub>A</sub> + <i>m</i><sub>B</sub>)</div>
      <table class="data">
        <tr><th>L 形（由內角量起）</th><th>質量</th><th>(<i>x</i>, <i>y</i>), m</th></tr>
        <tr><td>臂 A，${f(Ll.A.a1 - Ll.A.a0, 1)} × ${f(Ll.A.b1 - Ll.A.b0, 1)} m</td><td>${f(Ll.pA.m)} kg</td><td>${xy(Ll.pA.c)}</td></tr>
        <tr><td>臂 B，${f(Ll.B.a1 - Ll.B.a0, 1)} × ${f(Ll.B.b1 - Ll.B.b0, 1)} m</td><td>${f(Ll.pB.m)} kg</td><td>${xy(Ll.pB.c)}</td></tr>
        <tr><td>整個 L</td><td>${f(Ll.M)} kg</td><td>${xy(Ll.cm)}</td></tr>
      </table>
      <p>那一點落在空位裏，不在 L 上。它像環或回力鏢一樣，無法放在釘上平衡；但用繩吊住時會轉動，直到其質心正好在結之下。</p>
      <div class="eq"><i>x</i><sub>cm</sub> = (<i>m</i><sub>full</sub><i>x</i><sub>full</sub> − <i>m</i><sub>plug</sub><i>x</i><sub>plug</sub>)/<i>M</i></div>
      <p>一塊 ${f(Ho.s, 1)} m 正方形（${f(Ho.mFull)} kg）在 ${xy(Ho.c)} 處挖去半徑 ${f(Ho.r, 1)} m 的圓塞（${f(Ho.mPlug)} kg）：<i>x</i><sub>cm</sub> = <i>y</i><sub>cm</sub> = −${f(Ho.mPlug)}×${f(Ho.c[0])}/${f(Ho.M)} = ${f(Ho.cm[0], 3)} m，即離中心 ${f(Math.hypot(...Ho.cm) * 100, 1)} cm，偏向孔的相反方向。</p>
      <p class="hintline">點擊可拆開 L，並取出圓塞。</p>`,
    cam: { target: [STATIONS.parts + 0.05, 1.22, 0], az: -12, el: 14, dist: 10.2 }, lit: 'parts', scene: 'parts', look: {},
    fig: '在材料之外',
  },
];

// ---------- click a scene: what it breaks into ----------
const collFacts = c => s => { const r = M.track(c, s[c === S ? 'stick' : c === B ? 'bounce' : 'burst'].t); return [
  ['p₁', `${f(r.p1)} kg·m/s`], ['p₂', `${f(r.p2)} kg·m/s`], ['total P', `${f(r.P)} kg·m/s`], ['kinetic energy', `${f(r.K)} J`], ['centre of mass velocity', `${f(r.P / (c.m1 + c.m2))} m/s`]]; };
export const PLATES = {
  mom: { text: `The grey arrows are the velocities: the ball’s is four times longer. The black momentum arrows are the same length, because the cart has four times the mass. Momentum is mass and velocity together.`,
    facts: () => [['ball: 0.5 kg × 4.0 m/s', `${f(M.p(M.BALL.m, M.BALL.v))} kg·m/s`], ['cart: 2.0 kg × 1.0 m/s', `${f(M.p(M.CART.m, M.CART.v))} kg·m/s`], ['ball KE = p²/2m', `${f(M.ke(M.BALL.m, M.BALL.v))} J`], ['cart KE = p²/2m', `${f(M.ke(M.CART.m, M.CART.v))} J`]] },
  wall: { text: `Momentum before (right) and after (left). The change Δp = p<sub>after</sub> − p<sub>before</sub> is twice as long as either and points away from the wall, the same way as the wall’s push. That change is the impulse.`,
    facts: s => { const w = M.wall(s.wall.t); return [['p before', `+${f(Wl.m * Wl.v)} kg·m/s`], ['p after', `−${f(Wl.m * Wl.v)} kg·m/s`], ['Δp = J', `−${f(Wl.J)} N·s`], ['contact time', `${f(Wl.tau)} s`], ['force now', `${f(Math.abs(w.F), 1)} N`]]; } },
  eggs: { text: `The grey arrows are the two impulses: identical, because both eggs lose the same momentum. What differs is how long that takes, and so how hard the push has to be.`,
    facts: () => [['impulse, each', `${f(Eg.J, 3)} N·s`], ['pillow: J / Δt', `${f(Eg.J / Eg.tauSoft)} N for ${f(Eg.tauSoft)} s`], ['floor: J / Δt', `${f(Eg.J / Eg.tauHard)} N for ${f(Eg.tauHard)} s`], ['force ratio', `${f(Eg.tauSoft / Eg.tauHard, 1)}×`]] },
  stick: { text: `Above, the momenta before and after, laid tip to tail. Each row adds up to the same blue total. Cart 2’s momentum even changes sign; the total doesn’t change at all.`, facts: collFacts(S) },
  bounce: { text: `Before: all the momentum is in cart 1. After: cart 1’s is negative and cart 2’s is bigger than the total. Tip to tail, both rows still add up to the same blue arrow.`, facts: collFacts(B) },
  burst: { text: `Before: nothing. After: two equal and opposite arrows that add up to nothing. The total momentum is zero throughout, so the centre of mass never moves.`, facts: collFacts(X) },
  pend: { text: `The dashed lines mark the bottom and top of the swing, Δy apart. From the triangle, cos θ = (L − Δy)/L, so Δy = L(1 − cos θ). Other ways to find v′ after a hit: the block slides to a stop on a rough floor, v′ = √(2μ<sub>k</sub>gΔx); it squeezes a spring, v′ = √(kΔx²/(m+M)); it flies off a table, v′ = Δx/√(2Δy/g).`,
    facts: s => { const q = M.pend(s.pend.t); return [['v′ after the hit', `${f(Pd.v)} m/s`], ['Δy = v′²/2g', `${f(Pd.dy * 100, 1)} cm`], ['θ max', `${deg(Pd.theta)}°`], ['angle now', `${deg(q.th)}°`], ['KE + Ug now', `${f(q.K + q.U)} J`], ['a 10 g bullet into 2.0 kg, same θ', `${f(BULLET, 0)} m/s`]]; } },
  crash: { text: `The car’s momentum points east, the truck’s north. Placed tip to tail they make a right triangle; the blue hypotenuse is the total, which the wreck carries away at ${C.angle.toFixed(1)}° north of east.`,
    facts: () => [['p car (east)', `${k(C.px)} kg·m/s`], ['p truck (north)', `${k(C.py)} kg·m/s`], ['total P', `${k(C.P)} kg·m/s`], ['v′ = P/(m₁+m₂)', `${f(C.v)} m/s`], ['direction', `${C.angle.toFixed(1)}° north of east`], ['KE', `${k(C.K0 / 1000)} kJ → ${k(C.K1 / 1000)} kJ`]] },
  shell: { text: `Gravity, an outside force, bends everyone’s path, so the vertical momentum keeps changing. The burst is internal: at that instant the total momentum (blue) is the same before and after, all of it now in the front half.`,
    facts: s => { const q = M.shell(s.shell.t); return [['x of the centre of mass', `${f(q.cm[0])} m`], ['before the burst: m·vx', `${f(Sh.m * Sh.vx)} kg·m/s`], ['after: (m/2)·v₂′', `${f(Sh.m / 2 * Sh.v2)} kg·m/s`], ['lands at', `${f(Sh.R / 2)} m and ${f(1.5 * Sh.R)} m`]]; } },

  rods: { text: `Each slice is drawn at its own centre of mass with its weight d<i>m</i>·<i>g</i> (${cm(W_SCALE)} per newton). On the uniform rod the ten weights are equal; on the other they grow with <i>x</i>, so fewer, heavier slices on the right balance more, lighter ones on the left. About the knife edge the two sides’ torques are equal.`,
    facts: () => { const sl = M.rodSlices('N'), g = M.G, L = sl.filter(q => q.x < Rd.xN).reduce((a, q) => a + (Rd.xN - q.x) * q.dm * g, 0), Rr = sl.filter(q => q.x >= Rd.xN).reduce((a, q) => a + (q.x - Rd.xN) * q.dm * g, 0);
      return [['uniform: each slice', `${f(M.rodSlices('U')[0].dm, 3)} kg`], ['λ₀x/L: first and last slice', `${f(sl[0].dm, 3)} kg, ${f(sl.at(-1).dm, 3)} kg`], ['x_cm, uniform / λ₀x/L', `${f(Rd.xU)} m / ${f(Rd.xN)} m`], ['torque of the left slices', `${f(L, 3)} N·m`], ['torque of the right slices', `${f(Rr, 3)} N·m`]]; } },
  plates: { text: `Eight strips each, every one drawn at its own centre of mass with its weight (${cm(W_PLATE)} per newton). The wide strips near the base or diameter are heaviest, which is why the balance point sits closer to that edge than to the far tip.`,
    facts: () => { const t = M.plateStrips(Tr), c = M.plateStrips(Se); return [['triangle: M = σbh/2', `${f(Tr.M)} kg`], ['triangle: heaviest / lightest strip', `${f(t[0].dm, 3)} / ${f(t.at(-1).dm, 3)} kg`], ['semicircle: M = σπR²/2', `${f(Se.M)} kg`], ['semicircle: heaviest / lightest strip', `${f(c[0].dm, 3)} / ${f(c.at(-1).dm, 3)} kg`], ['8 rectangles: triangle, semicircle', `${f(M.stripSum(M.triW, Tr.h, 8), 3)}, ${f(M.stripSum(M.semiW, Se.R, 8), 3)} m`], ['the integrals: h/3, 4R/3π', `${f(Tr.ucm, 3)}, ${f(Se.ucm, 3)} m`]]; } },
  parts: { text: `Pulled apart, each arm is a point mass at its own centre (the small discs). The L’s centre of mass lies on the line between them, closer to the heavier arm, and it stays put as they part. Lifted out, the plug is the negative mass: the square’s centre, the plug’s centre and the plate’s centre of mass lie on one line, with the balance point on the far side from the hole.`,
    facts: () => [['arm A', `${f(Ll.pA.m)} kg at ${xy(Ll.pA.c)} m`], ['arm B', `${f(Ll.pB.m)} kg at ${xy(Ll.pB.c)} m`], ['the L', `${f(Ll.M)} kg at ${xy(Ll.cm)} m`], ['full square − plug', `${f(Ho.mFull)} − ${f(Ho.mPlug)} = ${f(Ho.M)} kg`], ['holed plate x_cm, y_cm', `${f(Ho.cm[0], 3)}, ${f(Ho.cm[1], 3)} m`]] },
};
