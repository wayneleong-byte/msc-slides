// Chapter 2, page by page (after the AP Physics 1 organizer, Unit 3). Text and a chart on the
// left page; on the right, the camera, the lit scene and what is shown. Numbers from model.js.
import * as M from './model.js';
import { STATIONS, KN_SCALE, F_SCALE, TUG_SCALE, DRAG_SCALE, HONEY_SCALE } from './world.js';

const f = (x, n = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(n);
const at = (k, dy = 0.5) => [STATIONS[k], dy, 0];
const TG = M.TUG, BD = M.BOARD, DR = M.DRAG, HN = M.HONEY;

// ---------- small SVG charts for the left page ----------
const W = 420, H = 170, P = { l: 44, r: 14, t: 16, b: 30 };
function chart({ x0, x1, y0, y1, series, xlabel, ylabel, marks = [], cursor, label }) {
  const sx = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy = y => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b);
  const paths = series.map(s => `<path class="${s.cls || 'curve'}" d="${s.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')}"/>` + (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + 4}" y="${sy(s.tag[1]) - 6}">${s.tag[2]}</text>` : '')).join('');
  const mk = marks.map(([x, y, t]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + 6}" y="${sy(y) + 14}">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/>${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${y1}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${String(y0).replace('-', '−')}</text>
    <text class="ax" x="${P.l}" y="${H - 9}">${x0}</text><text class="ax" x="${W - P.r}" y="${H - 9}" text-anchor="end">${x1}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + W - P.r) / 2}" y="${H - 9}" text-anchor="middle">${xlabel}</text>
    ${cursor ? `<circle class="cursor" r="4.5" data-cursor="${cursor}"/>` : ''}
  </svg>`;
}
export const CH = { sx: (x, x0, x1) => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), sy: (y, y0, y1) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b) };

const frictionChart = chart({
  x0: 0, x1: 12, y0: 0, y1: 12, xlabel: '施加的力 (N)', ylabel: '摩擦力 (N)', cursor: 'friction', label: '摩擦力對施加的力',
  series: [{ pts: [[0, 0], [M.F_SMAX, M.F_SMAX]], tag: [2.2, 2.2, '靜摩擦：f = F'] }, { pts: [[M.F_SMAX, M.F_K], [12, M.F_K]], tag: [5.6, M.F_K - 1.6, '動摩擦：μk·FN →'] }, { cls: 'trend', pts: [[M.F_SMAX, M.F_SMAX], [M.F_SMAX, M.F_K]] }],
  marks: [[M.F_SMAX, M.F_SMAX, `${f(M.F_SMAX)} N`]],
});

export const PAGES = [
  {
    levels: ['senior'],
    kicker: '第 2 章', title: '牛頓運動定律', sub: '什麼改變運動',
    body: `
      <p class="lede">運動學描述運動；動力學解釋運動：<b>力</b>就是推或拉，改變運動的是力。</p>
      <p>力是向量，由物體的中心畫一枝箭嘴來表示。1 牛頓是令 1 kg 得到 1 m/s² 加速度的力。這個 ${f(M.M1, 1)} kg 的木塊感受到兩種力：</p>
      <table class="data">
        <tr><th>力</th><th>符號</th><th>本例</th></tr>
        <tr><td>重量（重力）</td><td><i>F</i><sub>g</sub> = <i>mg</i></td><td>向下 ${f(M.W1, 1)} N</td></tr>
        <tr><td>法向力（承托面）</td><td><i>F</i><sub>N</sub></td><td>向上 ${f(M.FN, 1)} N</td></tr>
        <tr><td>張力（繩）</td><td><i>T</i></td><td>—</td></tr>
        <tr><td>摩擦力</td><td><i>f</i></td><td>—</td></tr>
        <tr><td>阻力（空氣）</td><td><i>F</i><sub>d</sub></td><td>—</td></tr>
      </table>
      <p>永遠先畫<b>受力圖</b>（free-body diagram）：物件畫成一點，它受的每一個力畫成一枝箭嘴。點擊木塊可看。</p>`,
    cam: { target: at('rest', 0.45), az: -30, el: 12, dist: 9 }, lit: 'rest', scene: 'rest', look: {},
    fig: '靜止的木塊',
  },
  {
    levels: ['senior'],
    kicker: '2.1', title: '張力', sub: '繩上的力',
    body: `
      <p class="lede"><b>張力</b> <i>T</i> 是繩或線的拉力，沿繩的方向。繩只能拉，不能推。</p>
      <p>左邊的 ${f(M.M1, 1)} kg 木塊由一根繩吊住。它處於平衡，所以 <i>T</i> = <i>mg</i> = ${f(M.W1, 1)} N。</p>
      <p>右邊兩根繩分擔負載。只有它們的豎直分量承着木塊，所以 2<i>T</i> sin θ = <i>mg</i>，而</p>
      <div class="eq"><i>T</i> = <i>mg</i> / (2 sin θ)</div>
      <p>繩越放平，θ 越細、張力越大：70° 時 ${f(M.tension2(70), 1)} N，30° 時 ${f(M.tension2(30), 1)} N，20° 時 ${f(M.tension2(20), 1)} N。所以晾衣繩永遠不可能完全拉直。水平分量互相抵消。</p>
      <div class="charts">${chart({ x0: 10, x1: 90, y0: 0, y1: 60, xlabel: '繩角 θ (°)', ylabel: '每根繩的張力 (N)', cursor: 'tension', label: '張力對繩角',
        series: [{ pts: Array.from({ length: 41 }, (_, i) => { const d = 12 + i * 1.95; return [d, Math.min(M.tension2(d), 60)]; }) }] })}</div>
      <p class="hintline">點擊繩子可把每條張力分解成分量。</p>`,
    cam: { target: [STATIONS.tension, 1.5, 0], az: -10, el: 5, dist: 11 }, lit: 'tension', scene: 'tension', look: {},
    fig: '先一根繩，再兩根',
  },
  {
    levels: ['senior'],
    kicker: '2.2', title: '第一定律', sub: '慣性',
    body: `
      <p class="lede">靜者恆靜；沿直線運動者保持同一速度，除非有非零的<b>淨力</b>作用其上。</p>
      <p>這個木塊在無摩擦面上以 ${f(M.V_GLIDE, 1)} m/s 滑行。它的重量與法向力相消，所以 Σ<i>F</i> = 0，沒有什麼改變它的運動。頻閃影像的間距均勻。</p>
      <p><b>平衡</b>就是 Σ<i>F</i> = 0。它不只包括靜止，也包括以等速度運動。要<i>維持</i>運動，什麼都不需要。</p>
      <div class="charts">${chart({ x0: 0, x1: 2.4, y0: 0, y1: 3.6, xlabel: '時間 (s)', ylabel: '位置 (m)', label: '位置對時間：一條直線', series: [{ pts: [[0, 0], [2.4, 3.6]] }] })}</div>`,
    cam: { target: at('glide', 0.45), az: -18, el: 14, dist: 12 }, lit: 'glide', scene: 'glide', look: {},
    fig: '等速度，零淨力',
  },
  {
    levels: ['senior'],
    kicker: '2.3', title: '水平飛行', sub: '合力為零',
    body: `
      <p class="lede">一架 ${M.PLANE.m} kg 的飛機以穩定的 ${M.PLANE.v} m/s 平飛，沿直線。它的速度不變，所以按第一定律淨力為零。</p>
      <table class="data">
        <tr><td>升力（向上，機翼所生）</td><td>${(M.PLANE.L / 1000).toFixed(2)} kN</td></tr>
        <tr><td>重量（向下）</td><td>${(M.PLANE.W / 1000).toFixed(2)} kN</td></tr>
        <tr><td>推力（向前，螺旋槳所生）</td><td>${(M.PLANE.T / 1000).toFixed(2)} kN</td></tr>
        <tr><td><b>阻力</b>（向後，來自空氣）</td><td>${(M.PLANE.D / 1000).toFixed(2)} kN</td></tr>
      </table>
      <p><b>阻力</b>是流體對穿過它的運動所施之力。它隨速度增大，大致如 <i>F</i><sub>d</sub> = ½<i>DρAv</i>²（<i>D</i> 為阻力係數，<i>A</i> 為迎流面積）。引擎不需要令飛機維持移動；它只需要抵消阻力。</p>
      <p class="hintline">本頁箭嘴每千牛頓 ${(KN_SCALE * 100).toFixed(0)} cm。</p>`,
    cam: { target: [STATIONS.plane, 3.0, 0], az: -26, el: 9, dist: 34 }, lit: 'plane', scene: 'plane', look: {},
    fig: '升力 = 重量，推力 = 阻力',
  },
  {
    levels: ['senior'],
    kicker: '2.4', title: '第二定律', sub: 'F = ma',
    body: `
      <p class="lede">淨力沿其自己的方向產生加速度，大小為 Σ<i>F</i>/<i>m</i>。</p>
      <p>兩個木塊在無摩擦面上同受 ${f(M.PUSH, 1)} N 推力。${f(M.M1, 1)} kg 那塊得 ${f(M.A1, 1)} m/s²；${f(M.M2, 1)} kg 那塊質量大一倍，只好一半：${f(M.A2, 1)} m/s²。</p>
      <p>力越大，加速度越大。質量越大，加速度越細。</p>
      <div class="charts">${chart({ x0: 0, x1: 12, y0: 0, y1: 6, xlabel: '淨力 (N)', ylabel: '加速度 (m/s²)', label: '2 kg 與 4 kg 的加速度對淨力', series: [{ pts: [[0, 0], [12, 6]], tag: [9, 4.5, '2 kg'] }, { pts: [[0, 0], [12, 3]], tag: [9.6, 2.4, '4 kg'] }], marks: [[M.PUSH, M.A1, '3.0'], [M.PUSH, M.A2, '1.5']] })}</div>`,
    cam: { target: [STATIONS.second + 1.2, 0.4, 0], az: -22, el: 20, dist: 12 }, lit: 'second', scene: 'second', look: {},
    fig: '同樣的 6.0 N 作用於 2 kg 與 4 kg',
  },
  {
    levels: ['senior'],
    kicker: '2.5', title: '什麼推動汽車？', sub: '作用與反作用',
    body: `
      <p class="lede">引擎轉動車輪，但引擎是汽車的一部分，什麼都不能推動自己。令汽車向前的力來自<b>路面</b>：作用在輪胎上的靜摩擦。</p>
      <p>輪胎向後推路面。按第三定律，路面以 ${f(M.CAR.F / 1000, 1)} kN 向前推輪胎。輪胎不會打滑，所以這是<i>靜</i>摩擦，即使汽車在動。</p>
      <p>空氣阻力向後，隨 <i>v</i>² 增長：在 ${f(M.car(M.CAR.run).v, 1)} m/s 只不過 ${f(M.car(M.CAR.run).D, 0)} N，但在公路速度（30 m/s）卻是 ${f(M.CAR.k * 30 * 30, 0)} N。車子越快，淨力以至加速度越小。</p>
      <div class="charts">${chart({ x0: 0, x1: 3.2, y0: 0, y1: 10, xlabel: '時間 (s)', ylabel: '速率 (m/s)', cursor: 'car', label: '車速對時間',
        series: [{ pts: Array.from({ length: 33 }, (_, i) => [i * 0.1, M.car(i * 0.1).v]) }] })}</div>
      <p class="hintline">箭嘴每千牛頓 ${(KN_SCALE * 100).toFixed(0)} cm。</p>`,
    cam: { target: [STATIONS.car + 0.5, 1.2, 0], az: -20, el: 14, dist: 36 }, lit: 'car', scene: 'car', look: {},
    fig: '摩擦力向前，阻力向後',
  },
  {
    levels: ['senior'],
    kicker: '2.6', title: '摩擦力', sub: '接觸面的力',
    body: `
      <p class="lede">在粗糙地板上，推力每秒漸增 ${f(M.RAMP, 1)} N。起初木塊不動：<b>靜摩擦</b>與推力恰好相抵。</p>
      <p>靜摩擦有上限：μ<sub>s</sub><i>F</i><sub>N</sub> = ${f(M.MU_S)} × ${f(M.FN, 1)} = ${f(M.F_SMAX)} N。推得再大力，木塊便掙脫。<b>動摩擦</b>接手，維持較小的定值 μ<sub>k</sub><i>F</i><sub>N</sub> = ${f(M.F_K)} N，不論推多大力。紅箭嘴是淨力，只在推力勝出後才出現。</p>
      <div class="charts">${frictionChart}</div>`,
    cam: { target: [STATIONS.friction + 0.4, 0.45, 0], az: -26, el: 13, dist: 9 }, lit: 'friction', scene: 'friction', look: {},
    fig: '粗糙地板上漸增的推力',
  },
  {
    levels: ['senior'],
    kicker: '2.7', title: '第三定律', sub: '成對出現',
    body: `
      <p class="lede">若 A 推 B，B 便在同一瞬間以同大反向的力推回 A。</p>
      <p>以 ${f(M.PUSH, 1)} N 推動，兩個木塊一同以 ${f(M.A_PAIR, 1)} m/s² 加速。要令 B（${f(M.M2, 1)} kg）有這個加速度，A 必須以 ${f(M.CONTACT, 1)} N 推它。B 以 ${f(M.CONTACT, 1)} N 反推 A，所以 A 上的淨力是 ${f(M.PUSH - M.CONTACT, 1)} N，正是 ${f(M.M1, 1)} kg × ${f(M.A_PAIR, 1)} m/s²。</p>
      <p>一對作用力與反作用力作用在<b>不同物件</b>上，所以永不互相抵消。重量與法向力<i>不是</i>一對：兩者都作用在同一木塊上。木塊重量的搭檔，是木塊把地球向上拉的力。</p>`,
    cam: { target: [STATIONS.third + 0.9, 0.45, 0], az: -24, el: 12, dist: 9 }, lit: 'third', scene: 'third', look: {},
    fig: 'A 推 B，B 推 A',
  },

  {
    levels: ['senior'],
    kicker: '2.8', title: '選擇系統', sub: '受力分析範圍',
    body: `
      <p class="lede">圍着你喜歡的任意物件畫一條邊界，叫它做<b>系統</b>。系統內部之間的力是<b>內力</b>；系統之外任何東西施予的是<b>外力</b>。</p>
      <p>滑冰者 A（${TG.mA} kg）與滑冰者 B（${TG.mB} kg）站在無摩擦冰面上，用力收攏一條輕繩。繩以 ${TG.T} N 拉住各人，所以 A 以 ${f(TG.aA, 1)} m/s²、B 以 ${f(TG.aB, 1)} m/s² 向對方加速。</p>
      <p>把滑冰者 + 繩視為系統。兩條張力是內力，各自等大反向，總和為零。重量與法向力是外力，但也相消。系統整體不能加速度。它的<b>質心</b>留在原地：</p>
      <div class="eq"><i>x</i><sub>cm</sub> = Σ<i>m</i><i>x</i> / Σ<i>m</i></div>
      <div class="eq">= (<i>m</i><sub>A</sub><i>x</i><sub>A</sub> + <i>m</i><sub>B</sub><i>x</i><sub>B</sub>) / (<i>m</i><sub>A</sub> + <i>m</i><sub>B</sub>)</div>
      <table class="data">
        <tr><th></th><th><i>x</i><sub>A</sub></th><th><i>x</i><sub>B</sub></th><th><i>x</i><sub>cm</sub></th></tr>
        <tr><td>開始時</td><td>${f(M.tug(0).xA)} m</td><td>${f(M.tug(0).xB)} m</td><td>0.00 m</td></tr>
        <tr><td>${f(TG.run, 2)} 秒後</td><td>${f(M.tug(TG.run).xA)} m</td><td>${f(M.tug(TG.run).xB)} m</td><td>0.00 m</td></tr>
      </table>
      <p>較輕的滑冰者滑過更遠的冰面，${f(M.tug(TG.run).xA - TG.xA0, 1)} m 對 ${f(TG.xB0 - M.tug(TG.run).xB, 1)} m，比例恰好維持 <i>x</i><sub>cm</sub> 不動。若兩人本來一起滑行，<i>x</i><sub>cm</sub> 便會以原速度繼續滑。</p>
      <div class="charts">${chart({ x0: 0, x1: 1.7, y0: -3, y1: 2, xlabel: '時間 (s)', ylabel: '位置 (m)', cursor: 'tug', label: '兩位滑冰者與質心的位置對時間',
        series: [{ pts: Array.from({ length: 21 }, (_, i) => [i * TG.run / 20, M.tug(i * TG.run / 20).xA]), tag: [0.15, TG.xA0 + 0.25, 'A'] }, { pts: Array.from({ length: 21 }, (_, i) => [i * TG.run / 20, M.tug(i * TG.run / 20).xB]), tag: [0.75, M.tug(0.75).xB - 0.75, 'B'] }, { cls: 'curve total', pts: [[0, 0], [TG.run, 0]], tag: [1.2, 0.1, 'x<tspan dy="3" font-size="8">cm</tspan>'] }] })}</div>
      <p class="hintline">本頁箭嘴每牛頓 ${(TUG_SCALE * 100).toFixed(1)} cm。點擊滑冰者可看系統邊界。</p>`,
    cam: { target: [STATIONS.tug - 0.45, 0.95, 0], az: -8, el: 9, dist: 18 }, lit: 'tug', scene: 'tug', look: {},
    fig: '在冰上收繩',
  },
  {
    levels: ['senior'],
    kicker: '2.9', title: '質心加速度', sub: '系統整體',
    body: `
      <p class="lede">對系統的每一部分寫 <i>F</i> = <i>ma</i>，再全部相加。內力成對相消，剩下的就是整個系統的第二定律：</p>
      <div class="eq">Σ<i>F</i><sub>ext</sub> = <i>M</i> <i>a</i><sub>cm</sub>, &nbsp; <i>M</i> = Σ<i>m</i></div>
      <p>一個 ${f(BD.m, 1)} kg 木塊放在冰面上的 ${f(BD.Mb, 1)} kg 木板上，繩以 ${BD.F} N 拉木板。這超過靜摩擦所能分擔的（μ<sub>s</sub><i>Mg</i> = ${f(BD.Fslip)} N），所以木塊滑動。動摩擦 ${f(BD.f)} N 把木塊向前拽，把木板向後拽。</p>
      <table class="data">
        <tr><td>木塊：<i>f</i>/<i>m</i></td><td>${f(BD.aBlock)} m/s²</td></tr>
        <tr><td>木板：(<i>F</i> − <i>f</i>)/<i>M</i><sub>board</sub></td><td>${f(BD.aBoard)} m/s²</td></tr>
        <tr><td><b>系統</b>：<i>F</i>/(<i>m</i> + <i>M</i><sub>board</sub>)</td><td>${f(BD.aCm)} m/s²</td></tr>
      </table>
      <p>驗算：(${f(BD.m, 1)} × ${f(BD.aBlock)} + ${f(BD.Mb, 1)} × ${f(BD.aBoard)}) / ${f(BD.M, 1)} = ${f(BD.aCm)} m/s²。<i>a</i><sub>cm</sub> 跟摩擦力全不相干。把桌布從碗碟底下猛然一抽，同樣的事就會發生：拖動碗碟的只有摩擦力，而它最多只能給碗碟 μ<i>g</i>。</p>
      <div class="charts">${chart({ x0: 0, x1: 1.1, y0: 0, y1: 4.5, xlabel: '時間 (s)', ylabel: '速度 (m/s)', cursor: 'board', label: '木塊、木板與質心的速度對時間',
        series: [{ pts: [[0, 0], [1.1, BD.aBoard * 1.1]], tag: [0.86, BD.aBoard * 0.86 + 0.2, '木板'] }, { cls: 'curve total', pts: [[0, 0], [1.1, BD.aCm * 1.1]], tag: [0.92, BD.aCm * 0.92 - 0.95, '質心'] }, { pts: [[0, 0], [1.1, BD.aBlock * 1.1]], tag: [0.8, BD.aBlock * 0.8 - 0.75, '木塊'] }] })}</div>
      <p class="hintline">箭嘴每牛頓 ${(F_SCALE * 100).toFixed(0)} cm。點擊可提起木塊，看那對摩擦力。</p>`,
    cam: { target: [STATIONS.board + 0.4, 0.5, 0], az: -16, el: 15, dist: 13.5 }, lit: 'board', scene: 'board', look: {},
    fig: '從木塊底下抽出的木板',
  },
  {
    levels: ['senior'],
    kicker: '2.10', title: '斜面', sub: '分解重力',
    body: `
      <p class="lede">在斜面上，沿斜面和垂直斜面量度。重量便分成兩部分。</p>
      <table class="data">
        <tr><td>沿斜面</td><td><i>mg</i> sin θ = ${f(M.W_PAR)} N</td></tr>
        <tr><td>壓向斜面</td><td><i>mg</i> cos θ = ${f(M.W_PERP)} N</td></tr>
      </table>
      <p>沿垂直斜面方向沒有加速度，所以法向力抵消第二部分：<i>F</i><sub>N</sub> = <i>mg</i> cos θ = ${f(M.FN_INC)} N。剩下的只有沿斜面的部分：<i>a</i> = <i>g</i> sin θ = ${f(M.A_INC)} m/s²。</p>
      <p>加上摩擦力，當 tan θ = μ<sub>k</sub> 時木塊以等速下滑。取 μ<sub>k</sub> = ${f(M.MU_K)}，即 ${f(M.critical(M.MU_K), 1)}°。</p>
      <p class="hintline">點擊木塊可分解其重量。</p>`,
    cam: { target: [STATIONS.incline - 0.2, 1.0, 0], az: -8, el: 12, dist: 12 }, lit: 'incline', scene: 'incline', look: {},
    fig: `${M.THETA_DEG}° 斜面`,
  },
  {
    levels: ['senior'],
    kicker: '2.11', title: '與速度成正比的阻力', sub: '線性阻力',
    body: `
      <p class="lede">阻力指向速度的反方向，隨速率增大。對細小、緩慢、處身黏稠流體的物體，它簡單地與速率成正比：<i>F</i><sub>d</sub> = −<i>bv</i>。</p>
      <p>一個 ${f(DR.m, 2)} kg 的球，<i>b</i> = ${f(DR.b)} kg/s，由靜止放下。取向下為正：</p>
      <div class="eq"><i>m</i> d<i>v</i>/d<i>t</i> = <i>mg</i> − <i>bv</i></div>
      <p>起初 <i>v</i> = 0、<i>a</i> = <i>g</i>。球加速時阻力隨之增長，淨力便縮小。當 <i>bv</i> = <i>mg</i>，淨力為零：<b>終端速度</b> <i>v</i><sub>t</sub> = <i>mg</i>/<i>b</i> = ${f(DR.vt)} m/s。分離變數，取 τ = <i>m</i>/<i>b</i>：</p>
      <div class="eq">d<i>v</i> / (<i>v</i><sub>t</sub> − <i>v</i>) = d<i>t</i> / τ</div>
      <div class="eq">∫<sub>0</sub><sup><i>v</i></sup> d<i>v</i>′/(<i>v</i><sub>t</sub> − <i>v</i>′) = ∫<sub>0</sub><sup><i>t</i></sup> d<i>t</i>′/τ</div>
      <div class="eq">−ln(1 − <i>v</i>/<i>v</i><sub>t</sub>) = <i>t</i>/τ</div>
      <div class="eq"><i>v</i>(<i>t</i>) = <i>v</i><sub>t</sub> (1 − e<sup>−<i>t</i>/τ</sup>)</div>
      <p>這裏 τ = ${f(DR.tau)} s。一個 τ 後，球達 <i>v</i><sub>t</sub> 的 1 − 1/e = 63.2%；3τ 後 95%；5τ 後 99.3%。它永不真正到達。</p>
      <div class="charts">${chart({ x0: 0, x1: 2, y0: 0, y1: 4.5, xlabel: '時間 (s)', ylabel: '速率 (m/s)', cursor: 'drag', label: '速率對時間：趨近終端速度',
        series: [{ cls: 'trend', pts: [[0, DR.vt], [2, DR.vt]], tag: [1.62, DR.vt, 'v<tspan dy="3" font-size="8">t</tspan>'] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.linDrag(i * 0.05).v]) }, { cls: 'trend', pts: [[DR.tau, 0], [DR.tau, M.linDrag(DR.tau).v]] }],
        marks: [[DR.tau, M.linDrag(DR.tau).v, `τ = ${f(DR.tau, 1)} s 時 63.2%`]] })}
        ${chart({ x0: 0, x1: 2, y0: 0, y1: 6, xlabel: '時間 (s)', ylabel: '力 (N)', cursor: 'dragF', label: '阻力與重量對時間',
        series: [{ cls: 'trend', pts: [[0, DR.W], [2, DR.W]], tag: [1.2, DR.W, '重量 <tspan font-style="italic">mg</tspan>'] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.linDrag(i * 0.05).D]), tag: [0.5, M.linDrag(0.5).D - 2.2, '阻力 <tspan font-style="italic">bv</tspan>'] }] })}</div>
      <p class="hintline">本頁箭嘴每牛頓 ${(DRAG_SCALE * 100).toFixed(0)} cm。點擊小球可看其即時受力圖。</p>`,
    cam: { target: [STATIONS.drag, 2.8, 0], az: -10, el: 5, dist: 23 }, lit: 'drag', scene: 'drag', look: {},
    fig: '受阻力 −bv 下落的小球',
  },
  {
    levels: ['senior'],
    kicker: '2.12', title: '真實流體', sub: '更複雜的阻力',
    body: `
      <p class="lede">再積分一次便得下落的位置：</p>
      <div class="eq"><i>x</i>(<i>t</i>) = ∫<sub>0</sub><sup><i>t</i></sup> <i>v</i> d<i>t</i>′ = <i>v</i><sub>t</sub> [ <i>t</i> − τ (1 − e<sup>−<i>t</i>/τ</sup>) ]</div>
      <p>過幾個 τ 之後就是 <i>v</i><sub>t</sub>(<i>t</i> − τ)：球彷彿一直以 <i>v</i><sub>t</sub> 下落，只是遲了 τ 才開始（下圖虛線）。</p>
      <p>線性阻力適用於細小、緩慢、處身黏稠流體的物體。大而快的物體把流體撥開，阻力變成 <i>kv</i>²，如第 2.5 頁的汽車。那時 <i>v</i><sub>t</sub> = √(<i>mg</i>/<i>k</i>)。</p>
      <table class="data">
        <tr><th>下落物</th><th><i>v</i><sub>t</sub></th><th>τ</th><th>阻力</th></tr>
        <tr><td>霧滴，20 µm</td><td>${f(M.drop(1e-5).vLin * 100, 1)} cm/s</td><td>${f(M.drop(1e-5).tau * 1000, 1)} ms</td><td><i>bv</i></td></tr>
        <tr><td>鋼珠在蜜糖中，10 mm</td><td>${f(HN.vt * 100, 1)} cm/s</td><td>${f(HN.tau * 1000, 1)} ms</td><td><i>bv</i></td></tr>
        <tr><td>雨點，2 mm</td><td>${f(M.drop(1e-3).vQuad, 1)} m/s</td><td>—</td><td><i>kv</i>²</td></tr>
      </table>
      <p>以 <i>bv</i> 預測雨點得 ${f(M.drop(1e-3).vLin, 0)} m/s。實際它以約 6.5 m/s 落下，正如 <i>kv</i>² 所言。</p>
      <p>蜜糖中的鋼珠（放大 10 倍繪畫）還受浮力 <i>B</i>，所以 <i>mg</i> 變成 <i>mg</i> − <i>B</i>，而 <i>v</i><sub>t</sub> = (<i>mg</i> − <i>B</i>)/<i>b</i>。τ 只有 ${f(HN.tau * 1000, 1)} ms，它不出半個毫米便達終端速度，所以看來從一開始就在等速下沉。</p>
      <div class="charts">${chart({ x0: 0, x1: 2, y0: 0, y1: 7, xlabel: '時間 (s)', ylabel: '已下落距離 (m)', label: '下落距離對時間，連其漸近線',
        series: [{ cls: 'trend', pts: [[DR.tau, 0], [2, DR.vt * (2 - DR.tau)]], tag: [1.25, DR.vt * 0.85 - 0.4, 'v<tspan dy="3" font-size="8">t</tspan><tspan dy="-3">(t − τ)</tspan>'] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.linDrag(i * 0.05).x]) }] })}
        ${chart({ x0: 0, x1: 2, y0: 0, y1: 4.5, xlabel: '時間 (s)', ylabel: '速率 (m/s)，同一 v_t', label: '線性與二次阻力，相同終端速度',
        series: [{ cls: 'trend', pts: [[0, DR.vt], [2, DR.vt]] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.quadV(i * 0.05)]), tag: [0.18, M.quadV(0.3), 'kv²'] }, { pts: Array.from({ length: 41 }, (_, i) => [i * 0.05, M.linDrag(i * 0.05).v]), tag: [0.5, M.linDrag(0.4).v - 1.3, 'bv'] }] })}</div>
      <p><i>kv</i>² 在 <i>v</i><sub>t</sub> 之下弱於 <i>bv</i>，所以同一 <i>v</i><sub>t</sub> 之下它更早接近終端：在 <i>t</i> = τ 已達 ${(100 * M.quadV(DR.tau) / DR.vt).toFixed(0)}%，而非 63%。</p>
      <p class="hintline">本頁箭嘴每牛頓 ${HONEY_SCALE} m。點擊小球可看它受的力。</p>`,
    cam: { target: [STATIONS.honey, 0.68, 0], az: -12, el: 8, dist: 5.6 }, lit: 'honey', scene: 'honey', look: {},
    fig: '鋼珠在蜜糖中下沉',
  },
];

// ---------- click a scene: what it breaks into ----------
export const PLATES = {
  tug: { text: `The pale box is the system: both skaters and the rope. The tension on A and the tension on B are internal; they are equal and opposite, so they add to zero. Each skater’s weight is cancelled by the ice’s normal force. With no net external force, the centre of mass (the quartered disc) cannot move.`,
    facts: s => { const r = M.tug(s.tug.t), xc = M.xcm([TG.mA, TG.mB], [r.xA, r.xB]); return [['x<sub>A</sub>, v<sub>A</sub>', `${f(r.xA)} m, ${f(r.vA)} m/s`], ['x<sub>B</sub>, v<sub>B</sub>', `${f(r.xB)} m, ${f(r.vB)} m/s`], ['x<sub>cm</sub> = Σmx/Σm', `${f(Math.abs(xc) < 5e-3 ? 0 : xc)} m`], ['internal: T on A + T on B', `${TG.T} − ${TG.T} = 0 N`], ['external: ΣF<sub>ext</sub>', '0 N']]; } },
  board: { text: `Lifted apart, the friction pair shows: the board drags the block forward, the block drags the board back, ${f(BD.f)} N each. Inside the block + board system they cancel. Only the pull F is external, so the centre of mass accelerates at F/M, between the block’s and the board’s accelerations.`,
    facts: s => { const t = s.board.t, r = M.board(t); return [['ΣF<sub>ext</sub> = F', `${BD.F} N`], ['M = m + M<sub>board</sub>', `${f(BD.M, 1)} kg`], ['a<sub>cm</sub> = ΣF<sub>ext</sub>/M', `${f(BD.aCm)} m/s²`], ['v<sub>block</sub>, v<sub>board</sub>', `${f(r.vBlock)}, ${f(r.vBoard)} m/s`], ['v<sub>cm</sub>', `${f(M.xcm([BD.m, BD.Mb], [r.vBlock, r.vBoard]))} m/s`]]; } },
  drag: { text: `The ball shrinks to its free-body diagram: weight down, drag up. The drag is bv, so it grows with the speed until it matches the weight, and the net force (red) dies away. Acceleration is g e<sup>−t/τ</sup>: largest at the start, zero at terminal speed.`,
    facts: s => { const r = M.linDrag(s.drag.t); return [['time', `${f(s.drag.t)} s = ${f(s.drag.t / DR.tau, 1)} τ`], ['speed v', `${f(r.v)} m/s = ${(100 * r.v / DR.vt).toFixed(1)}% of v<sub>t</sub>`], ['drag bv', `${f(r.D)} N`], ['weight mg', `${f(DR.W)} N`], ['net force, a', `${f(DR.W - r.D)} N, ${f(r.a)} m/s²`]]; } },
  honey: { text: `Three forces, already balanced: weight down; drag and buoyancy up. The ball is at terminal speed, so the strobe images are evenly spaced. Drag is linear here because the Reynolds number ρvd/η, which compares pushing fluid aside with its stickiness, is far below 1.`,
    facts: () => [['weight mg', `${f(HN.W * 1000, 1)} mN`], ['buoyancy B', `${f(HN.B * 1000, 1)} mN`], ['drag bv<sub>t</sub> (b = 6πηr)', `${f(HN.b * HN.vt * 1000, 1)} mN`], ['net force', '0 N'], ['v<sub>t</sub>, τ', `${f(HN.vt * 100, 2)} cm/s, ${f(HN.tau * 1000, 1)} ms`], ['Reynolds number', f(HN.Re, 3)]] },
  tension: { text: `Each tension splits into a horizontal part and a vertical part (grey). The horizontal parts are equal and opposite, so they cancel. The two vertical parts add up to the weight. The flatter the strings, the smaller each vertical part, so the larger the tension has to be.`,
    facts: s => { const th = M.hangAngle(s.clock * M.SLOW), T = M.tension2(th), r = th * Math.PI / 180; return [['angle θ', `${th.toFixed(1)}°`], ['each tension T', `${f(T)} N`], ['vertical part T sin θ', `${f(T * Math.sin(r))} N × 2 = ${f(2 * T * Math.sin(r))} N`], ['horizontal part T cos θ', `${f(T * Math.cos(r))} N, cancelling`]]; } },
  plane: { text: `Four forces, two balanced pairs. Notice they are not third-law pairs: all four act on the plane. Lift and weight balance because the plane isn’t climbing or sinking; thrust and drag balance because its speed isn’t changing.`,
    facts: () => [['lift − weight', '0 N'], ['thrust − drag', '0 N'], ['acceleration', '0 m/s²'], ['speed', `${M.PLANE.v} m/s, constant`]] },
  car: { text: `Weight and the normal force cancel. Sideways there are two forces: static friction from the road, forward, and air drag, backward. Their difference is the net force (red).`,
    facts: s => { const c = M.car(s.car.t); return [['road friction (forward)', `${f(M.CAR.F)} N`], ['air drag (back)', `${f(c.D)} N`], ['net force', `${f(M.CAR.F - c.D)} N`], ['acceleration', `${f(c.a)} m/s²`], ['speed', `${f(c.v)} m/s`]]; } },
  rest: { text: `The block shrinks to a dot, leaving only the forces on it: its free-body diagram. Two equal and opposite forces, so the net force is zero and it stays at rest.`,
    facts: () => [['weight F<sub>g</sub>', `${f(M.W1)} N down`], ['normal F<sub>N</sub>', `${f(M.FN)} N up`], ['net force', '0 N']] },
  glide: { text: `The free-body diagram is the same as the block at rest. Σ<i>F</i> = 0 doesn’t mean “not moving”. It means “velocity not changing”.`,
    facts: s => [['velocity', `${f(M.V_GLIDE)} m/s, constant`], ['net force', '0 N'], ['acceleration', '0 m/s²']] },
  second: { text: `The red arrows are the net force on each block: the same 6.0 N. Divide by each mass to get its acceleration.`,
    facts: s => [['2.0 kg: a = 6.0/2.0', `${f(M.A1)} m/s²`], ['4.0 kg: a = 6.0/4.0', `${f(M.A2)} m/s²`], ['time', `${f(s.second.t)} s`]] },
  friction: { text: `The four forces on the block, live. Up and down cancel. Sideways, friction matches the push until the push passes ${f(M.F_SMAX)} N. After that friction drops to ${f(M.F_K)} N and the difference accelerates the block.`,
    facts: s => { const r = M.friction(s.friction.t); return [['push F<sub>app</sub>', `${f(r.F)} N`], [`friction (${r.kind})`, `${f(r.f)} N`], ['net force', `${f(r.F - r.f)} N`], ['acceleration', `${f(r.a)} m/s²`]]; } },
  third: { text: `Pulled apart for a moment, the pair is easy to see: A pushes B forward with ${f(M.CONTACT, 1)} N and B pushes A back with ${f(M.CONTACT, 1)} N. Same size, opposite direction, on different blocks.`,
    facts: () => [['F on A (outside push)', `${f(M.PUSH, 1)} N →`], ['F<sub>B on A</sub>', `${f(M.CONTACT, 1)} N ←`], ['F<sub>A on B</sub>', `${f(M.CONTACT, 1)} N →`], ['both accelerate at', `${f(M.A_PAIR, 1)} m/s²`]] },
  incline: { text: `The weight (straight down) is replaced by its two parts along the tilted axes. The normal force cancels the part into the slope. The part along the slope is the net force, so the block speeds up down the ramp.`,
    facts: () => [['mg sin θ', `${f(M.W_PAR)} N`], ['mg cos θ = F<sub>N</sub>', `${f(M.W_PERP)} N`], ['a = g sin θ', `${f(M.A_INC)} m/s²`]] },
};
