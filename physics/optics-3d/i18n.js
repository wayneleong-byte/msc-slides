/**
 * Optics 3D lab i18n — ?lang=en switches UI; physics math untouched.
 */
const params = new URLSearchParams(location.search);
const ref = document.referrer || '';
export const LANG = (params.get('lang') === 'en' || (!params.get('lang') && /\/en(\/|$)/.test(ref)))
  ? 'en'
  : 'zh';

const ZH = {
  'doc.title': '光學3D實驗室｜六站完整',
  'nav.back': '← 返回圖集',
  'nav.junior': '初中入口',
  'nav.senior': '高中入口',
  'nav.other': 'English',
  'nav.baseli': '基力 · B-3-15～18（高中加深：幾何光學延伸）',
  'brand.h1': '光學3D實驗室｜六站完整',
  'brand.sub': '澳門科學館 · Oscar　教育科技小組',
  'brand.orig': '本實驗室六站互動為<strong>澳門科學館展教／教育科技本地原創</strong>（幾何光學教學用）；禁 explode／零件拆解。上游 Atlas 其他章另見站內授權說明。',
  'tab.shadow': '站1：影子',
  'tab.reflection': '站2：反射',
  'tab.mirror': '站3：平面鏡',
  'tab.refraction': '站4：折射',
  'tab.dispersion': '站5：色散',
  'tab.lens': '站6：凸透鏡',
  'gl.hint': '拖曳旋轉視角；滑鼠滾輪縮放；右鍵平移。<br />拖曳相機僅改變檢視方位，不會改變任何物理量。',
  'p1.h2': '站1　直線傳播與影子',
  'p1.desc': '點光源位於左側，向右發出光線。不透明擋板阻擋部分光線，於右側光屏上形成幾何影區。影界由「光源 → 擋板上／下邊緣 → 光屏」的直線延長決定；均勻介質中光線始終沿直線傳播。',
  'p1.l1': '擋板高度（場景單位）',
  'p1.l2': '擋板位置 X（沿光軸）',
  'p1.r1': '擋板高度',
  'p1.r2': '擋板位置 X',
  'p1.r3': '屏上影高',
  'p1.r4': '影高／擋板高',
  'p1.law': '影高／擋板高 ＝ 光源至屏距離／光源至擋板距離',
  'p1.hint': '影區內沒有來自該點光源的直接光線；圖中暗帶為光屏上的幾何影區，半透明多邊形標示影的邊界。',
  'p2.h2': '站2　反射定律',
  'p2.desc': '光線射向水平鏡面，入射線、反射線與法線位於同一入射平面。入射角 <i>i</i> 與反射角 <i>r</i> 均自法線量起，且恆有 <i>r</i> ＝ <i>i</i>；反射角由定律強制得出，不能獨立拖動。',
  'p2.l1': '入射角 i（度）',
  'p2.r1': '入射角 i',
  'p2.r2': '反射角 r',
  'p2.law': 'i ＝ r（反射定律）',
  'p2.hint': '入射線為暖橙色，反射線為冷藍色；白色虛線為法線，垂直於鏡面。角弧皆夾在法線與對應光線之間。',
  'p3.h2': '站3　平面鏡虛像',
  'p3.desc': '物點位於豎直平面鏡前方，兩條不同方向的入射光射到鏡面後反射。將反射光向鏡後作反向延長，延長線以虛線表示，交於鏡後一點，該點即虛像；像距等於物距，像與物關於鏡面對稱。',
  'p3.l1': '物距 u（場景單位）',
  'p3.r1': '物距 u',
  'p3.r2': '像距 v',
  'p3.r3': 'u ： v',
  'p3.r4': '像的性質',
  'p3.virtual': '虛像',
  'p3.law': '像距 ＝ 物距（v ＝ u）',
  'p3.hint': '鏡後只有虛線反向延長線，沒有實線光線到達虛像；反射光始終留在鏡前。',
  'p4.h2': '站4　折射（斯涅爾定律）',
  'p4.desc': '光線由上方空氣（n₁＝1.00）斜射入下方玻璃（n₂＝1.50）。由疏介質進入密介質時，折射線靠近法線，故 <i>r</i> ＜ <i>i</i>；折射角由 n₁·sin <i>i</i> ＝ n₂·sin <i>r</i> 即時求得。',
  'p4.l1': '入射角 i（度）',
  'p4.r1': '入射角 i',
  'p4.r2': '折射角 r',
  'p4.r3': '介質 n₁（空氣）',
  'p4.r4': '介質 n₂（玻璃）',
  'p4.r5': 'n₁·sin i',
  'p4.r6': 'n₂·sin r',
  'p4.law': 'n₁ sin i ＝ n₂ sin r（斯涅爾定律）',
  'p4.preset': '參考值：i＝30° 時 r≈19.5°；i＝45° 時 r≈28.1°。',
  'p4.hint': '入射線為暖橙色，折射線為青綠色；白色虛線為法線，貫穿界面上方與玻璃內部。',
  'p5.h2': '站5　稜鏡色散',
  'p5.desc': '水平白光射入等腰三角玻璃稜鏡，在左、右兩個界面各依斯涅爾定律折射一次。紅、綠、藍三色取不同教學折射率，出射方向因而分開；紅光偏折較小，藍光偏折較大。',
  'p5.l1': '白光入射高度（場景單位）',
  'p5.r1': '紅光 n',
  'p5.r2': '綠光 n',
  'p5.r3': '藍光 n',
  'p5.r4': '入射高度',
  'p5.r5': '紅光偏折',
  'p5.r6': '藍光偏折',
  'p5.law': 'n<sub>紅</sub> ＜ n<sub>綠</sub> ＜ n<sub>藍</sub> ⇒ 藍光偏折較大',
  'p5.hint': 'n 隨波長略變：本模型採紅 1.490、綠 1.510、藍 1.530，屬定性教學示意，未模擬光強、吸收與稜鏡色散曲線。',
  'p6.h2': '站6　凸透鏡成像',
  'p6.desc': '物體置於凸透鏡左側焦點之外，圖中繪出三條標準作圖光線：平行光軸後通過像方焦點 F′、通過光心 O 不偏折、通過物方焦點 F 後平行光軸。三線交於鏡後一點，形成倒立實像。',
  'p6.l1': '物距 u（場景單位）',
  'p6.r1': '焦距 f',
  'p6.r2': '物距 u',
  'p6.r3': '像距 v',
  'p6.r4': '放大率 m',
  'p6.r5': '像的性質',
  'p6.law': '1/f ＝ 1/u ＋ 1/v；m ＝ −v/u',
  'p6.hint': '符號約定：實物距 u ＞ 0、實像距 v ＞ 0。本模型固定 f＝4.0，u 的滑桿範圍為 6.0–12.0（均大於 f），因此只展示倒立實像。',
  'aside.foot': '六站共用一套前台物理核心：直線投影、反射定律、斯涅爾定律、平面鏡成像與薄透鏡公式均在瀏覽器即時計算，不涉及後端。',
  'footer': '原創說明：本「光學3D實驗室」六站（直線傳播與影子、反射、平面鏡虛像、斯涅爾折射、稜鏡色散、凸透鏡成像）之互動光路與介面，為<strong>澳門科學館 Oscar／教育科技小組本地原創</strong>教學素材。Three.js 僅作渲染引擎（CDN）。物理圖集其他章之上游授權見主站 LICENSE。',
  'unit.x': '×',
  'lens.invReal': '倒立實像（u ＞ f）',
  'lens.upReal': '正立實像',
  'lens.virtual': '虛像',
  'lbl.pointSource': '點光源',
  'lbl.screen': '光屏',
  'lbl.barrier': '不透明擋板',
  'lbl.shadowZone': '幾何影區',
  'lbl.boundaryRay': '影界光線',
  'lbl.normal': '法線',
  'lbl.mirror': '鏡面',
  'lbl.incident': '入射線',
  'lbl.reflected': '反射線',
  'lbl.planeMirror': '平面鏡',
  'lbl.object': '物點',
  'lbl.virtualImage': '虛像',
  'lbl.extension': '反向延長線',
  'lbl.air': '空氣 n₁ = 1.00',
  'lbl.glass': '玻璃 n₂ = 1.50',
  'lbl.refracted': '折射線',
  'lbl.prism': '玻璃稜鏡',
  'lbl.nVary': 'n 隨波長略變',
  'lbl.white': '白光',
  'lbl.exitColors': '出射色光',
  'lbl.red': '紅光',
  'lbl.green': '綠光',
  'lbl.blue': '藍光',
  'lbl.axis': '主光軸',
  'lbl.obj': '物',
  'lbl.realImage': '實像'
};

const EN = {
  'doc.title': 'Optics 3D Lab · Six Stations',
  'nav.back': '← Atlas home',
  'nav.junior': 'Junior',
  'nav.senior': 'Senior',
  'nav.other': '中文',
  'nav.baseli': 'Baseli · B-3-15–18 (Senior: geometric optics extension)',
  'brand.h1': 'Optics 3D Lab · Six Stations',
  'brand.sub': 'Macao Science Center · Oscar · EdTech',
  'brand.orig': 'These six interactive stations are a <strong>local original</strong> by Macao Science Center exhibition / EdTech (geometric optics teaching). No explode / part teardown. Other Atlas chapters follow their own licences.',
  'tab.shadow': '1 · Shadow',
  'tab.reflection': '2 · Reflection',
  'tab.mirror': '3 · Plane mirror',
  'tab.refraction': '4 · Refraction',
  'tab.dispersion': '5 · Dispersion',
  'tab.lens': '6 · Convex lens',
  'gl.hint': 'Drag to orbit; scroll to zoom; right-drag to pan.<br />Camera motion changes view only — no physical quantities.',
  'p1.h2': 'Station 1 · Straight-line propagation & shadow',
  'p1.desc': 'A point source on the left sends rays rightward. An opaque barrier blocks some rays and casts a geometric shadow on the screen. Shadow edges follow the straight line from source through the barrier’s top/bottom edges to the screen; in a uniform medium, light travels in straight lines.',
  'p1.l1': 'Barrier height (scene units)',
  'p1.l2': 'Barrier position X (along optic axis)',
  'p1.r1': 'Barrier height',
  'p1.r2': 'Barrier X',
  'p1.r3': 'Shadow height on screen',
  'p1.r4': 'Shadow / barrier height',
  'p1.law': 'Shadow height / barrier height = source–screen distance / source–barrier distance',
  'p1.hint': 'No direct rays from this point source reach the umbra; the dark band is the geometric shadow on the screen; the translucent polygon marks the boundary.',
  'p2.h2': 'Station 2 · Law of reflection',
  'p2.desc': 'A ray hits a horizontal mirror. Incident ray, reflected ray and normal lie in one plane of incidence. Angles <i>i</i> and <i>r</i> are measured from the normal, with <i>r</i> = <i>i</i> always; reflection angle is forced by the law and cannot be dragged independently.',
  'p2.l1': 'Incident angle i (degrees)',
  'p2.r1': 'Incident angle i',
  'p2.r2': 'Reflection angle r',
  'p2.law': 'i = r (law of reflection)',
  'p2.hint': 'Incident ray warm orange, reflected cool blue; white dashed line is the normal, perpendicular to the mirror. Arcs sit between the normal and each ray.',
  'p3.h2': 'Station 3 · Plane-mirror virtual image',
  'p3.desc': 'An object point sits in front of a vertical plane mirror. Two incident rays reflect. Extending the reflected rays behind the mirror (dashed) meets at the virtual image; image distance equals object distance; object and image are symmetric about the mirror.',
  'p3.l1': 'Object distance u (scene units)',
  'p3.r1': 'Object distance u',
  'p3.r2': 'Image distance v',
  'p3.r3': 'u : v',
  'p3.r4': 'Image type',
  'p3.virtual': 'Virtual image',
  'p3.law': 'Image distance = object distance (v = u)',
  'p3.hint': 'Behind the mirror only dashed extensions exist — no solid rays reach the virtual image; reflected light stays in front of the mirror.',
  'p4.h2': 'Station 4 · Refraction (Snell’s law)',
  'p4.desc': 'A ray goes from air above (n₁ = 1.00) into glass below (n₂ = 1.50). Entering a denser medium, the refracted ray bends toward the normal so <i>r</i> &lt; <i>i</i>; the angle follows n₁·sin <i>i</i> = n₂·sin <i>r</i> live.',
  'p4.l1': 'Incident angle i (degrees)',
  'p4.r1': 'Incident angle i',
  'p4.r2': 'Refraction angle r',
  'p4.r3': 'Medium n₁ (air)',
  'p4.r4': 'Medium n₂ (glass)',
  'p4.r5': 'n₁·sin i',
  'p4.r6': 'n₂·sin r',
  'p4.law': 'n₁ sin i = n₂ sin r (Snell’s law)',
  'p4.preset': 'Reference: i = 30° → r ≈ 19.5°; i = 45° → r ≈ 28.1°.',
  'p4.hint': 'Incident warm orange, refracted teal; white dashed normal crosses the interface into the glass.',
  'p5.h2': 'Station 5 · Prism dispersion',
  'p5.desc': 'Horizontal white light enters an isosceles triangular glass prism and refracts once at each face by Snell’s law. Red, green and blue use slightly different teaching refractive indices, so exit directions split; red bends less, blue more.',
  'p5.l1': 'White-light entry height (scene units)',
  'p5.r1': 'Red n',
  'p5.r2': 'Green n',
  'p5.r3': 'Blue n',
  'p5.r4': 'Entry height',
  'p5.r5': 'Red deviation',
  'p5.r6': 'Blue deviation',
  'p5.law': 'n<sub>red</sub> &lt; n<sub>green</sub> &lt; n<sub>blue</sub> ⇒ blue bends more',
  'p5.hint': 'n varies slightly with wavelength: this model uses red 1.490, green 1.510, blue 1.530 — qualitative teaching only; no intensity, absorption or full dispersion curve.',
  'p6.h2': 'Station 6 · Convex-lens imaging',
  'p6.desc': 'An object sits beyond the left focus of a convex lens. Three standard construction rays are drawn: parallel to the axis then through F′, through optical centre O undeviated, through F then parallel to the axis. They meet behind the lens as an inverted real image.',
  'p6.l1': 'Object distance u (scene units)',
  'p6.r1': 'Focal length f',
  'p6.r2': 'Object distance u',
  'p6.r3': 'Image distance v',
  'p6.r4': 'Magnification m',
  'p6.r5': 'Image type',
  'p6.law': '1/f = 1/u + 1/v; m = −v/u',
  'p6.hint': 'Sign convention: real object distance u &gt; 0, real image distance v &gt; 0. This model fixes f = 4.0 with u in 6.0–12.0 (all &gt; f), so only inverted real images are shown.',
  'aside.foot': 'All six stations share one front-end physics core: straight-line projection, reflection, Snell, plane-mirror imaging and the thin-lens equation — computed live in the browser with no backend.',
  'footer': 'Attribution: the Optics 3D Lab six stations (shadow, reflection, plane-mirror virtual image, Snell refraction, prism dispersion, convex-lens imaging) are a <strong>local original</strong> by Macao Science Center Oscar / EdTech. Three.js is CDN rendering only. Other Atlas chapters: see site LICENSE.',
  'unit.x': '×',
  'lens.invReal': 'Inverted real image (u > f)',
  'lens.upReal': 'Upright real image',
  'lens.virtual': 'Virtual image',
  'lbl.pointSource': 'Point source',
  'lbl.screen': 'Screen',
  'lbl.barrier': 'Opaque barrier',
  'lbl.shadowZone': 'Geometric shadow',
  'lbl.boundaryRay': 'Boundary ray',
  'lbl.normal': 'Normal',
  'lbl.mirror': 'Mirror',
  'lbl.incident': 'Incident',
  'lbl.reflected': 'Reflected',
  'lbl.planeMirror': 'Plane mirror',
  'lbl.object': 'Object',
  'lbl.virtualImage': 'Virtual image',
  'lbl.extension': 'Backward extension',
  'lbl.air': 'Air n₁ = 1.00',
  'lbl.glass': 'Glass n₂ = 1.50',
  'lbl.refracted': 'Refracted',
  'lbl.prism': 'Glass prism',
  'lbl.nVary': 'n varies with λ',
  'lbl.white': 'White light',
  'lbl.exitColors': 'Exit colours',
  'lbl.red': 'Red',
  'lbl.green': 'Green',
  'lbl.blue': 'Blue',
  'lbl.axis': 'Principal axis',
  'lbl.obj': 'Object',
  'lbl.realImage': 'Real image'
};

const DICT = LANG === 'en' ? EN : ZH;

export function t(key) {
  return DICT[key] ?? ZH[key] ?? key;
}

export function applyDomI18n() {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-Hant';
  document.title = t('doc.title');

  const nav = document.getElementById('atlas-nav');
  if (nav) {
    const links = nav.querySelectorAll('a');
    // expected order: back, junior, senior, other-lang
    if (links[0]) {
      links[0].textContent = t('nav.back');
      links[0].href = LANG === 'en' ? '../en/' : '../zh/';
    }
    if (links[1]) {
      links[1].textContent = t('nav.junior');
      links[1].href = LANG === 'en' ? '../en/index-junior.html' : '../zh/index-junior.html';
    }
    if (links[2]) {
      links[2].textContent = t('nav.senior');
      links[2].href = LANG === 'en' ? '../en/index-senior.html' : '../zh/index-senior.html';
    }
    if (links[3]) {
      links[3].textContent = t('nav.other');
      links[3].href = LANG === 'en' ? './' : './?lang=en';
    }
    let badge = document.getElementById('baseli-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'baseli-badge';
      badge.className = 'baseli-badge';
      nav.appendChild(document.createElement('span')).className = 'sep';
      nav.lastChild.textContent = '·';
      nav.appendChild(badge);
    }
    badge.textContent = t('nav.baseli');
  }

  const setHtml = (sel, key) => {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = t(key);
  };
  const setText = (sel, key) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = t(key);
  };

  setText('#brand h1', 'brand.h1');
  setText('#brand .subtitle', 'brand.sub');
  setHtml('#brand .orig-note', 'brand.orig');

  const tabKeys = ['shadow', 'reflection', 'mirror', 'refraction', 'dispersion', 'lens'];
  tabKeys.forEach((k) => {
    const btn = document.getElementById('btn-' + k);
    if (btn) btn.textContent = t('tab.' + k);
  });

  setHtml('#gl-info', 'gl.hint');

  // panels
  const map = [
    ['#panel-shadow h2', 'p1.h2', 'text'],
    ['#panel-shadow .desc', 'p1.desc', 'text'],
    ['label[for="s-shadow-h"]', 'p1.l1', 'text'],
    ['label[for="s-shadow-x"]', 'p1.l2', 'text'],
    ['#panel-shadow .readitem:nth-child(1) .rl', 'p1.r1', 'text'],
    ['#panel-shadow .readitem:nth-child(2) .rl', 'p1.r2', 'text'],
    ['#panel-shadow .readitem:nth-child(3) .rl', 'p1.r3', 'text'],
    ['#panel-shadow .readitem:nth-child(4) .rl', 'p1.r4', 'text'],
    ['#panel-shadow .law-note', 'p1.law', 'text'],
    ['#panel-shadow .hint', 'p1.hint', 'text'],

    ['#panel-reflection h2', 'p2.h2', 'text'],
    ['#panel-reflection .desc', 'p2.desc', 'html'],
    ['label[for="s-reflect-i"]', 'p2.l1', 'text'],
    ['#panel-reflection .readitem:nth-child(1) .rl', 'p2.r1', 'text'],
    ['#panel-reflection .readitem:nth-child(2) .rl', 'p2.r2', 'text'],
    ['#panel-reflection .law-note', 'p2.law', 'text'],
    ['#panel-reflection .hint', 'p2.hint', 'text'],

    ['#panel-mirror h2', 'p3.h2', 'text'],
    ['#panel-mirror .desc', 'p3.desc', 'text'],
    ['label[for="s-mirror-u"]', 'p3.l1', 'text'],
    ['#panel-mirror .readitem:nth-child(1) .rl', 'p3.r1', 'text'],
    ['#panel-mirror .readitem:nth-child(2) .rl', 'p3.r2', 'text'],
    ['#panel-mirror .readitem:nth-child(3) .rl', 'p3.r3', 'text'],
    ['#panel-mirror .readitem:nth-child(4) .rl', 'p3.r4', 'text'],
    ['#panel-mirror .readitem:nth-child(4) .rv', 'p3.virtual', 'text'],
    ['#panel-mirror .law-note', 'p3.law', 'text'],
    ['#panel-mirror .hint', 'p3.hint', 'text'],

    ['#panel-refraction h2', 'p4.h2', 'text'],
    ['#panel-refraction .desc', 'p4.desc', 'html'],
    ['label[for="s-refract-i"]', 'p4.l1', 'text'],
    ['#panel-refraction .readitem:nth-child(1) .rl', 'p4.r1', 'text'],
    ['#panel-refraction .readitem:nth-child(2) .rl', 'p4.r2', 'text'],
    ['#panel-refraction .readitem:nth-child(3) .rl', 'p4.r3', 'text'],
    ['#panel-refraction .readitem:nth-child(4) .rl', 'p4.r4', 'text'],
    ['#panel-refraction .readitem:nth-child(5) .rl', 'p4.r5', 'text'],
    ['#panel-refraction .readitem:nth-child(6) .rl', 'p4.r6', 'text'],
    ['#panel-refraction .law-note', 'p4.law', 'text'],
    ['#refract-preset', 'p4.preset', 'text'],
    ['#panel-refraction .hint:not(#refract-preset)', 'p4.hint', 'text'],

    ['#panel-dispersion h2', 'p5.h2', 'text'],
    ['#panel-dispersion .desc', 'p5.desc', 'text'],
    ['label[for="s-disp-y"]', 'p5.l1', 'text'],
    ['#panel-dispersion .readitem:nth-child(1) .rl', 'p5.r1', 'text'],
    ['#panel-dispersion .readitem:nth-child(2) .rl', 'p5.r2', 'text'],
    ['#panel-dispersion .readitem:nth-child(3) .rl', 'p5.r3', 'text'],
    ['#panel-dispersion .readitem:nth-child(4) .rl', 'p5.r4', 'text'],
    ['#panel-dispersion .readitem:nth-child(5) .rl', 'p5.r5', 'text'],
    ['#panel-dispersion .readitem:nth-child(6) .rl', 'p5.r6', 'text'],
    ['#panel-dispersion .law-note', 'p5.law', 'html'],
    ['#panel-dispersion .hint', 'p5.hint', 'text'],

    ['#panel-lens h2', 'p6.h2', 'text'],
    ['#panel-lens .desc', 'p6.desc', 'text'],
    ['label[for="s-lens-u"]', 'p6.l1', 'text'],
    ['#panel-lens .readitem:nth-child(1) .rl', 'p6.r1', 'text'],
    ['#panel-lens .readitem:nth-child(2) .rl', 'p6.r2', 'text'],
    ['#panel-lens .readitem:nth-child(3) .rl', 'p6.r3', 'text'],
    ['#panel-lens .readitem:nth-child(4) .rl', 'p6.r4', 'text'],
    ['#panel-lens .readitem.wide .rl', 'p6.r5', 'text'],
    ['#panel-lens .law-note', 'p6.law', 'text'],
    ['#panel-lens .hint', 'p6.hint', 'text'],
  ];

  for (const [sel, key, mode] of map) {
    const el = document.querySelector(sel);
    if (!el) continue;
    if (mode === 'html') el.innerHTML = t(key);
    else el.textContent = t(key);
  }

  const foot = document.querySelector('#sidebar > .footnote');
  if (foot) foot.textContent = t('aside.foot');
  const credit = document.querySelector('#site-credit p');
  if (credit) credit.innerHTML = t('footer');
}
