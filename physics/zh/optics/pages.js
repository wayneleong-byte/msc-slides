// Chapter 16 · Optics — Macao junior/senior Natural Science aligned MVP (written Traditional Chinese).
import * as M from './model.js';
import { STATIONS } from './world.js';

const f = (x, n = 1) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const at = (k, dx = 0, dy = 0.8, dz = 0) => [STATIONS[k] + dx, dy, dz];
const sn = M.snell();
const L = M.thinLens();

export const PAGES = [
  {
    levels: ['junior', 'senior'],
    kicker: '第 16 章', title: '光學', sub: '光的傳播',
    body: `
      <p class="lede">在均勻介質中，光近似沿<b>直線</b>前進。燈光發出的光線若被不透明物體擋住，後方的屏上便出現<b>影子</b>。</p>
      <p>影子的大小與形狀，取決於光源、物體與屏的相對位置：物體越靠近光源，影子通常越大。日常觀察（日影、手影戲）都建立在直線傳播之上。</p>
      <p class="hintline">點擊場景可拆開燈、擋板與影。</p>`,
    cam: { target: at('shadow', 0.3, 0.9), az: -18, el: 14, dist: 7.5 }, lit: 'shadow', scene: 'shadow', look: {},
    fig: '點光源、擋板與影子',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.1', title: '反射定律', sub: '入射角等於反射角',
    body: `
      <p class="lede">光線射到光滑表面（如平面鏡）時發生<b>反射</b>。過入射點作法線（垂直於鏡面）：</p>
      <div class="eq"><i>i</i> = <i>r</i></div>
      <p>即<b>入射角等於反射角</b>；入射光線、法線與反射光線在同一平面內。本例取 <i>i</i> = ${M.REFL.iDeg}°，故 <i>r</i> = ${M.REFL.iDeg}°。</p>
      <p class="hintline">點擊鏡面組合，可分開入射線、反射線與法線。</p>`,
    cam: { target: at('reflect', 0, 0.9), az: -22, el: 12, dist: 6.8 }, lit: 'reflect', scene: 'reflect', look: {},
    fig: '平面鏡上的反射',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.2', title: '平面鏡成像', sub: '正立虛像',
    body: `
      <p class="lede">平面鏡所成的像是<b>虛像</b>：光線並未真正在鏡後會聚，但人眼沿反射線反向延長，覺得像在鏡後。</p>
      <p>物與像對鏡面<b>對稱</b>：物距等於像距，像與物等高，且左右相反（鏡像）。本圖物距 |<i>u</i>| = ${f(Math.abs(M.MIRROR.objX), 1)}，像距相同。</p>
      <p class="hintline">點擊可分開物、虛像與眼睛位置。</p>`,
    cam: { target: at('mirror', 0, 0.9), az: -16, el: 12, dist: 7.2 }, lit: 'mirror', scene: 'mirror', look: {},
    fig: '平面鏡前的物與虛像',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.3', title: '折射', sub: '斯涅爾定律簡介',
    body: `
      <p class="lede">光從一種透明介質進入另一種時，傳播方向通常會改變，稱為<b>折射</b>。空氣折射率約 <i>n</i><sub>1</sub> = ${M.REFR.n1}，玻璃約 <i>n</i><sub>2</sub> = ${M.REFR.n2}。</p>
      <div class="eq"><i>n</i><sub>1</sub> sin <i>i</i> = <i>n</i><sub>2</sub> sin <i>r</i></div>
      <p>本例入射角 <i>i</i> = ${f(sn.iDeg, 0)}°，折射角 <i>r</i> ≈ ${f(sn.rDeg, 0)}°。光由疏入密（<i>n</i> 變大）時，折射線靠近法線。</p>
      <p class="hintline">初中重點在現象與定性比較；公式可作高中銜接。</p>`,
    cam: { target: at('refract', 0.2, 0.8), az: -20, el: 10, dist: 7.0 }, lit: 'refract', scene: 'refract', look: {},
    fig: '空氣進入玻璃的折射',
  },
  {
    levels: ['junior', 'senior'],
    kicker: '16.4', title: '色散與顏色', sub: '白光與稜鏡',
    body: `
      <p class="lede">太陽光或白光是多種顏色的混合。通過透明<b>稜鏡</b>時，不同顏色的光折射率略有不同，偏折程度也不同，於是在屏上展開成色帶，稱為<b>色散</b>。</p>
      <p>通常紅光偏折較少，藍紫光偏折較多。所見的「彩虹色序」即由此而來。物體呈現的顏色，與它反射或透射哪些波段有關。</p>
      <p class="hintline">點擊稜鏡可拆開入射白光與紅、綠、藍出射線。</p>`,
    cam: { target: at('prism', 0.2, 0.85), az: -14, el: 12, dist: 7.5 }, lit: 'prism', scene: 'prism', look: {},
    fig: '稜鏡色散示意',
  },
  {
    levels: ['senior'],
    kicker: '16.5', title: '凸透鏡成像', sub: '定性（加深）',
    body: `
      <p class="lede">凸透鏡使平行光會聚於焦點。薄透鏡公式（符號採常見笛卡兒約定）：</p>
      <div class="eq">1/<i>v</i> − 1/<i>u</i> = 1/<i>f</i></div>
      <p>本例焦距 <i>f</i> = ${f(M.LENS.f, 1)}，物距 <i>u</i> = ${f(L.u, 1)}，得像距 <i>v</i> ≈ ${f(L.v, 1)}，放大率 <i>m</i> ≈ ${f(L.m, 2)}。物在兩倍焦距以外時，常成倒立、縮小的實像——屬高中／分科加深，初中基力不強制。</p>
      <p class="hintline">點擊透鏡組可分開物、像與焦點標記。</p>`,
    cam: { target: at('lens', 0, 0.9), az: -12, el: 10, dist: 9.5 }, lit: 'lens', scene: 'lens', look: {},
    fig: '凸透鏡成實像（示意）',
  },
];

export const PLATES = {
  shadow: {
    title: '直線傳播與影子', sub: '光線遇障礙物',
    text: `燈可看作近似點光源。擋板遮住部分光線後，屏上較暗的區域就是影子。光線沿直線前進，因此影子的邊緣大致可由燈與擋板邊緣的連線延長得到。`,
    facts: () => [['模型', '點光源 + 不透明擋板'], ['現象', '直線傳播 → 影子'], ['基力', '光的傳播（初中）']],
  },
  reflect: {
    title: '反射定律', sub: '入射角等於反射角',
    text: `紅色為入射線，藍色為反射線，深色為法線。量度時角從法線算起：本場景 <i>i</i> = <i>r</i> = ${M.REFL.iDeg}°。光滑平面鏡接近理想反射。`,
    facts: () => [['入射角 i', `${M.REFL.iDeg}°`], ['反射角 r', `${M.REFL.iDeg}°`], ['關係', 'i = r']],
  },
  mirror: {
    title: '平面鏡成像', sub: '虛像與物對稱',
    text: `物在鏡前，虛像在鏡後對稱位置。光線並未到達虛像處；人眼根據反射線的反向延長線「以為」光從鏡後而來。物距與像距相等，像與物等高。`,
    facts: () => [['物距 |u|', f(Math.abs(M.MIRROR.objX), 1)], ['像距 |v|', f(Math.abs(M.mirrorImageX()), 1)], ['像的性質', '正立、虛像']],
  },
  refract: {
    title: '折射', sub: '斯涅爾定律',
    text: `光由空氣進入玻璃（n 由 ${M.REFR.n1} 增至 ${M.REFR.n2}）時，折射線靠近法線。定量關係為 n₁ sin i = n₂ sin r。初中可先觀察「彎折」現象，再認識公式。`,
    facts: () => [['n₁（空氣）', `${M.REFR.n1}`], ['n₂（玻璃）', `${M.REFR.n2}`], ['i', `${f(sn.iDeg, 0)}°`], ['r', `${f(sn.rDeg, 0)}°`]],
  },
  prism: {
    title: '色散與顏色', sub: '白光分開成多色',
    text: `白光含多種顏色。稜鏡對不同顏色的折射率略有差別，使各色光偏折不同而分開。紅光通常偏折較少，藍光偏折較多。這是認識顏色與光組成的重要實驗。`,
    facts: () => [['頂角 A', `${M.PRISM.A}°`], ['傾向', 'n_藍 > n_紅'], ['現象', '色散']],
  },
  lens: {
    title: '凸透鏡成像', sub: '定性加深',
    text: `平行於主軸的近軸光線經凸透鏡後通過焦點。本圖物距大於焦距，形成實像。薄透鏡公式 1/v − 1/u = 1/f 可估算像距；屬高中加深內容。`,
    facts: () => [['f', f(M.LENS.f, 1)], ['u', f(L.u, 1)], ['v', f(L.v, 1)], ['m', f(L.m, 2)]],
  },
};
