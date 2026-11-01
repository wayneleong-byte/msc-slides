// Practice — written Traditional Chinese; keys = page indices.
import * as M from './model.js';
const f = (x, n = 0) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const sn = M.snell();
const eq = s => `<div class="eq">${s}</div>`;

export const PRACTICE = {
  0: [
    { q: '在均勻空氣中，手電筒的光束可近似看成：',
      choices: ['沿曲線前進', '沿直線前進', '只向上傳播', '繞過一切障礙物'], answer: 1,
      why: '<p>在均勻介質中，光近似沿直線傳播；遇不透明物體才形成影子。</p>' },
  ],
  1: [
    { q: `若入射角為 ${M.REFL.iDeg}°，則反射角為：`,
      choices: [`${M.REFL.iDeg / 2}°`, `${90 - M.REFL.iDeg}°`, `${M.REFL.iDeg}°`, `${2 * M.REFL.iDeg}°`], answer: 2,
      why: `<p>反射定律：入射角等於反射角。</p>${eq('i = r')}` },
  ],
  2: [
    { q: '平面鏡所成的像通常是：',
      choices: ['倒立實像', '正立虛像', '倒立虛像', '正立實像（光線會聚於鏡後）'], answer: 1,
      why: '<p>平面鏡成像為正立虛像；物與像對鏡面對稱，光線並未在鏡後會聚。</p>' },
  ],
  3: [
    { q: `光由空氣（n≈1）進入玻璃（n≈1.5），入射角 ${f(sn.iDeg)}°。折射角與入射角相比：`,
      choices: ['折射角更大', '折射角更小', '二者必定相等', '無法判斷'], answer: 1,
      why: `<p>由疏入密時折射線靠近法線，故 r &lt; i。本例 r ≈ ${f(sn.rDeg)}°。</p>${eq('n₁ sin i = n₂ sin r')}` },
  ],
  4: [
    { q: '白光通過透明稜鏡後在屏上展開成彩色帶，主要因為：',
      choices: ['稜鏡發光', '不同顏色光的折射率不同', '反射定律失效', '影子被放大'], answer: 1,
      why: '<p>色散：不同顏色光在介質中的折射率略有差異，偏折角不同而分開。</p>' },
  ],
  5: [
    { q: '關於凸透鏡，下列何者較合理（加深）？',
      choices: ['只能成虛像', '平行光可會聚於焦點附近', '物距等於零時放大率最大且為實像', '折射率與顏色無關故無色散'], answer: 1,
      why: '<p>凸透鏡對近軸平行光有會聚作用，焦點是重要特徵；成像種類取決於物距與焦距。</p>' },
  ],
};
