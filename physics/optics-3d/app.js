/**
 * 光學3D實驗室｜六站完整
 * 澳門科學館 · Oscar · 教育科技小組
 *
 * 單頁 Three.js 幾何光學實驗室，依固定順序包含六站：
 *   1. shadow     直線傳播與影子
 *   2. reflection 反射定律
 *   3. mirror     平面鏡虛像
 *   4. refraction 折射（斯涅爾定律）
 *   5. dispersion 稜鏡色散
 *   6. lens       凸透鏡成像
 *
 * 光路一律在同一入射平面（XY 平面，z＝0）內計算，3D 只提供檢視空間感。
 * 均勻介質內光線為直線；所有角度、折射與成像均由前台物理純函數即時求得。
 * 本頁不含任何 explode／拆解動畫。
 */

import * as THREE from 'three';
import { t, applyDomI18n, LANG } from './i18n.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

applyDomI18n();

/* ---------------------------------------------------------------- *
 * 全域旗標：禁止任何 explode／拆解動畫
 * ---------------------------------------------------------------- */
window.OPTICS_FLAGS = { noExplode: true, ex: 0 };
const OPTICS_FLAGS = window.OPTICS_FLAGS;

/* ================================================================
 * 一、物理核心（純函數；角度單位為度）
 * ================================================================ */
const DEG = Math.PI / 180;

/** 反射定律：反射角恆等於入射角（自法線量起）。 */
function reflectAngle(iDeg) {
  return iDeg;
}

/** 斯涅爾定律：r ＝ asin((n1/n2)·sin i)；超出定義域（全內反射）時回傳 null。 */
function refractAngle(iDeg, n1 = 1.0, n2 = 1.5) {
  const sinR = (n1 / n2) * Math.sin(iDeg * DEG);
  if (Math.abs(sinR) > 1 + 1e-12) return null;
  return Math.asin(Math.max(-1, Math.min(1, sinR))) / DEG;
}

/** 別名：教材與程式內均以斯涅爾定律稱之。 */
function snellAngle(iDeg, n1 = 1.0, n2 = 1.5) {
  return refractAngle(iDeg, n1, n2);
}

/** 平面鏡：像距等於物距（虛像位於鏡後對稱位置）。 */
function mirrorImageDistance(objectDistance) {
  return Math.abs(objectDistance);
}

/**
 * 薄透鏡公式：1/f ＝ 1/u ＋ 1/v，故 v ＝ fu/(u−f)。
 * 符號約定：凸透鏡 f＞0、實物距 u＞0、實像距 v＞0；放大率 m ＝ −v/u。
 */
function thinLens(f, u) {
  if (Math.abs(u - f) < 1e-12) {
    return { v: Infinity, magnification: -Infinity };
  }
  const v = (f * u) / (u - f);
  return { v, magnification: -v / u };
}

/* --- 二維向量小工具（供稜鏡兩個界面使用） --- */
function vec2(x, y) { return { x, y }; }
function add2(a, b) { return vec2(a.x + b.x, a.y + b.y); }
function sub2(a, b) { return vec2(a.x - b.x, a.y - b.y); }
function scale2(a, s) { return vec2(a.x * s, a.y * s); }
function dot2(a, b) { return a.x * b.x + a.y * b.y; }
function cross2(a, b) { return a.x * b.y - a.y * b.x; }
function normalize2(a) {
  const len = Math.hypot(a.x, a.y) || 1;
  return vec2(a.x / len, a.y / len);
}

/**
 * 二維向量形式的斯涅爾折射。
 * incident 為入射行進方向；normal 指向第二介質。回傳單位向量或 null（全內反射）。
 * 同一函數可直接用於稜鏡的第一、第二界面。
 */
function refractVector2D(incident, normal, n1, n2) {
  const I = normalize2(incident);
  let N = normalize2(normal);
  let cosI = dot2(I, N);

  // 容許法線方向反向輸入；統一為指向第二介質。
  if (cosI < 0) {
    N = vec2(-N.x, -N.y);
    cosI = -cosI;
  }

  const eta = n1 / n2;
  const tangent = vec2(I.x - N.x * cosI, I.y - N.y * cosI);
  const transmitted = scale2(tangent, eta);
  const tangentSq = dot2(transmitted, transmitted);

  if (tangentSq > 1 + 1e-12) return null;

  const normalComp = Math.sqrt(Math.max(0, 1 - tangentSq));
  return normalize2(add2(transmitted, scale2(N, normalComp)));
}

/** 射線 P＋tD（t＞0）與線段 A→B（0≤u≤1）的交點。 */
function raySegmentIntersect2D(origin, direction, a, b) {
  const edge = sub2(b, a);
  const denom = cross2(direction, edge);
  if (Math.abs(denom) < 1e-10) return null;

  const ap = sub2(a, origin);
  const t = cross2(ap, edge) / denom;
  const u = cross2(ap, direction) / denom;

  if (t < 1e-6 || u < -1e-7 || u > 1 + 1e-7) return null;

  return {
    t,
    u,
    point: vec2(origin.x + direction.x * t, origin.y + direction.y * t)
  };
}

/* ================================================================
 * 二、場景骨架
 * ================================================================ */
const canvas = document.getElementById('view-3d');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8e9ec); // atlas-aligned stage

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
camera.position.set(10, 11, 30);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495; // 不讓相機沉到地面之下
controls.minDistance = 6;
controls.maxDistance = 120;
controls.target.set(0, 0, 0);
/* 拖曳相機只改變檢視方位，不觸碰任何物理量 */

scene.add(new THREE.HemisphereLight(0xffffff, 0xc8ccd2, 0.95));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.55);
dirLight.position.set(16, 28, 20);
scene.add(dirLight);

/* 低處參考格線：只作空間感，不參與任何光路 */
const grid = new THREE.GridHelper(90, 45, 0xb8bcc4, 0xd0d3d8);
grid.position.y = -11.5;
grid.material.transparent = true;
grid.material.opacity = 0.42;
scene.add(grid);

/* ---------------------------------------------------------------- *
 * 材質與共用光線工具
 * ---------------------------------------------------------------- */
const RAY_R = 0.075;

const MAT = {
  incident: new THREE.MeshBasicMaterial({ color: 0xff8647 }),          // 入射線：暖橙
  reflected: new THREE.MeshBasicMaterial({ color: 0x57b7ff }),         // 反射線：冷藍
  refracted: new THREE.MeshBasicMaterial({ color: 0x35e0c0 }),         // 折射線：青綠
  white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  red: new THREE.MeshBasicMaterial({ color: 0xff5555 }),
  green: new THREE.MeshBasicMaterial({ color: 0x55e07a }),
  blue: new THREE.MeshBasicMaterial({ color: 0x5b8cff }),
  shadowRay: new THREE.MeshBasicMaterial({ color: 0xffb45e }),
  shadowRayDim: new THREE.MeshBasicMaterial({ color: 0xffa24a, transparent: true, opacity: 0.50 }),
  object: new THREE.MeshBasicMaterial({ color: 0xffc266 }),
  image: new THREE.MeshBasicMaterial({ color: 0xc9a7ff }),
  arc: new THREE.MeshBasicMaterial({ color: 0xdce3ec, transparent: true, opacity: 0.88 }),
  normal: new THREE.LineDashedMaterial({ color: 0xe8eef6, dashSize: 0.45, gapSize: 0.30 }),
  virtual: new THREE.LineDashedMaterial({ color: 0x8fc8ff, dashSize: 0.36, gapSize: 0.26, transparent: true, opacity: 0.95 }),
  axis: new THREE.LineBasicMaterial({ color: 0x60758c, transparent: true, opacity: 0.82 }),
  axisDim: new THREE.LineDashedMaterial({ color: 0x4a5d70, dashSize: 0.42, gapSize: 0.30, transparent: true, opacity: 0.75 }),
  warmEdge: new THREE.LineBasicMaterial({ color: 0xffc266, transparent: true, opacity: 0.9 }),
  coolEdge: new THREE.LineBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.9 })
};

/** 建立從 o 沿 dir 方向、長度 L、半徑 R 的圓柱光線段。 */
function raySegment(o, dir, L, R = RAY_R, material = MAT.incident) {
  const geo = new THREE.CylinderGeometry(R, R, L, 10);
  geo.translate(0, L / 2, 0); // 沿 +Y 延伸，原點在底部
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(o);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

/** 光線末端箭頭：Cone 沿 dir。 */
function rayArrow(o, dir, S = 0.45, material = MAT.incident) {
  const geo = new THREE.ConeGeometry(0.20, S, 12);
  const mesh = new THREE.Mesh(geo, material);
  const d = dir.clone().normalize();
  mesh.position.copy(o).addScaledVector(d, S / 2 - 0.02);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  return mesh;
}

/** 虛線段：以 LineDashedMaterial 呈現（computeLineDistances 必須呼叫）。 */
function dashedLine(p1, p2, material = MAT.normal) {
  const geo = new THREE.BufferGeometry().setFromPoints([p1.clone(), p2.clone()]);
  const line = new THREE.Line(geo, material);
  line.computeLineDistances();
  return line;
}

/** 細實線段（光軸、鏡面亮線等）。 */
function thinLine(p1, p2, material = MAT.axis) {
  const geo = new THREE.BufferGeometry().setFromPoints([p1.clone(), p2.clone()]);
  return new THREE.Line(geo, material);
}

/** 以多段細管繪製角弧；角度由 +X 軸逆時針量起。 */
function arcMesh(center, radius, aFrom, aTo, material = MAT.arc, tube = 0.032) {
  const steps = 28;
  const pts = [];
  for (let k = 0; k <= steps; k += 1) {
    const t = aFrom + (aTo - aFrom) * (k / steps);
    pts.push(new THREE.Vector3(
      center.x + radius * Math.cos(t),
      center.y + radius * Math.sin(t),
      center.z || 0
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, steps, tube, 6, false), material);
}

/** 繪製一條帶中段箭頭的光線（a→b），可指定箭頭位置比例。 */
function addRay(dyn, a, b, material, radius = 0.058, arrowAt = 0.58, arrowSize = 0.38) {
  const delta = b.clone().sub(a);
  const L = delta.length();
  if (L < 1e-4) return;
  const dir = delta.clone().normalize();
  dyn.add(raySegment(a, dir, L, radius, material));
  const t = Math.min(Math.max(arrowAt, 0.06), 0.94);
  const p = a.clone().addScaledVector(dir, L * t);
  dyn.add(rayArrow(p, dir, arrowSize, material));
}

/** 清空動態光線群組並釋放幾何。 */
function clearDynamic(group) {
  const dyn = group.userData.dyn;
  if (!dyn) return;
  for (const obj of [...dyn.children]) {
    dyn.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
  }
}

/* ---------------------------------------------------------------- *
 * 文字標籤（Sprite）
 * ---------------------------------------------------------------- */
function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function labelSprite(text, color = '#dce3ec', size = 1.1, options = {}) {
  const fontSize = 46;
  const padX = 26;
  const boxH = 96;
  const dpr = 2;
  const font = `600 ${fontSize}px "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif`;

  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  const textWidth = Math.ceil(measure.measureText(text).width);
  const boxW = Math.max(86, textWidth + padX * 2);

  const cn = document.createElement('canvas');
  cn.width = Math.ceil(boxW * dpr);
  cn.height = Math.ceil(boxH * dpr);
  const ctx = cn.getContext('2d');
  ctx.scale(dpr, dpr);

  if (options.bg !== false) {
    ctx.fillStyle = options.bg || 'rgba(10,14,20,0.80)';
    roundRectPath(ctx, 1, 1, boxW - 2, boxH - 2, 13);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, boxW / 2, boxH / 2 + 2);

  const tex = new THREE.CanvasTexture(cn);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size * (boxW / boxH), size, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function addLabel(parent, text, pos, color = '#dce3ec', size = 1.1, options = {}) {
  const sp = labelSprite(text, color, size, options);
  sp.position.copy(pos);
  parent.add(sp);
  return sp;
}

/** 點光源的柔光暈（只是視覺提示，不是物理光線）。 */
function makeGlowSprite() {
  const cn = document.createElement('canvas');
  cn.width = cn.height = 128;
  const ctx = cn.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,240,180,0.95)');
  g.addColorStop(0.35, 'rgba(255,196,90,0.45)');
  g.addColorStop(1, 'rgba(255,170,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(cn);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(3.2, 3.2, 1);
  return sp;
}

/* ================================================================
 * 三、六站建構
 * ================================================================ */

/* ---------------------------------------------------------------- *
 * 站1：直線傳播與影子
 * 點光源固定於左側 S＝(-10, 0)；擋板為薄盒；光屏為豎直面 x＝9。
 * 影界由 S 經擋板上／下緣的直線延長到屏決定。
 * ---------------------------------------------------------------- */
function buildShadowStation() {
  const group = new THREE.Group();
  const dyn = new THREE.Group();
  group.add(dyn);
  group.userData.dyn = dyn;

  const SOURCE = new THREE.Vector3(-10, 0, 0);
  const SCREEN_X = 9;
  const SCREEN_H = 16;
  const SCREEN_D = 6;

  // 點光源
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.30, 24, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffdc8a,
      emissive: 0xffb347,
      emissiveIntensity: 2.8,
      roughness: 0.35
    })
  );
  bulb.position.copy(SOURCE);
  group.add(bulb);

  const glow = makeGlowSprite();
  glow.position.copy(SOURCE);
  group.add(glow);

  const light = new THREE.PointLight(0xffd27a, 22, 34, 2);
  light.position.copy(SOURCE);
  group.add(light);

  // 光屏
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, SCREEN_H, SCREEN_D),
    new THREE.MeshStandardMaterial({ color: 0xd5dee8, roughness: 0.88, metalness: 0.04 })
  );
  screen.position.set(SCREEN_X, 0, 0);
  group.add(screen);

  const screenEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(screen.geometry),
    new THREE.LineBasicMaterial({ color: 0x7f95ac, transparent: true, opacity: 0.8 })
  );
  screenEdges.position.copy(screen.position);
  group.add(screenEdges);

  // 不透明擋板（高度與位置由滑桿更新）
  const barrier = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 1, 3.1),
    new THREE.MeshStandardMaterial({ color: 0x2f4358, roughness: 0.58, metalness: 0.28 })
  );
  group.add(barrier);

  // 靜態標籤
  addLabel(group, t('lbl.pointSource'), SOURCE.clone().add(new THREE.Vector3(0, 1.15, 0)), '#ffd27a', 1.05);
  addLabel(group, t('lbl.screen'), new THREE.Vector3(SCREEN_X, SCREEN_H / 2 + 0.85, 0), '#dce3ec', 1.05);

  const barrierLabel = addLabel(group, t('lbl.barrier'), new THREE.Vector3(0, 0, 0), '#9fc6ff', 1.0);
  const shadowLabel = addLabel(group, t('lbl.shadowZone'), new THREE.Vector3(0, 0, 0), '#c6d4e6', 1.0);
  const boundaryLabel = addLabel(group, t('lbl.boundaryRay'), new THREE.Vector3(0, 0, 0), '#ffca8a', 0.95);

  group.userData.update = function ({ height, x }) {
    clearDynamic(group);

    barrier.scale.set(1, height, 1);
    barrier.position.set(x, 0, 0);
    barrierLabel.position.set(x, height / 2 + 0.85, 0);

    const topEdge = new THREE.Vector3(x, height / 2, 0);
    const botEdge = new THREE.Vector3(x, -height / 2, 0);

    const projectToScreen = (edge) => {
      const t = (SCREEN_X - SOURCE.x) / (edge.x - SOURCE.x);
      return new THREE.Vector3(
        SCREEN_X,
        SOURCE.y + t * (edge.y - SOURCE.y),
        0
      );
    };

    const shadowTop = projectToScreen(topEdge);
    const shadowBottom = projectToScreen(botEdge);
    const shadowHeight = Math.abs(shadowTop.y - shadowBottom.y);

    // 屏上的暗帶（幾何影區）
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, Math.max(shadowHeight, 0.01), SCREEN_D * 0.92),
      new THREE.MeshBasicMaterial({
        color: 0x060a10,
        transparent: true,
        opacity: 0.84,
        depthWrite: false
      })
    );
    band.position.set(SCREEN_X - 0.115, (shadowTop.y + shadowBottom.y) / 2, 0);
    dyn.add(band);

    // 半透明影區多邊形（擋板上／下緣 → 屏上影界）
    const shadowGeo = new THREE.BufferGeometry().setFromPoints([
      topEdge, shadowTop, shadowBottom, botEdge
    ]);
    shadowGeo.setIndex([0, 1, 2, 0, 2, 3]);
    shadowGeo.computeVertexNormals();
    const shadowMesh = new THREE.Mesh(
      shadowGeo,
      new THREE.MeshBasicMaterial({
        color: 0x41546b,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    shadowMesh.position.z = -0.05;
    dyn.add(shadowMesh);

    // 影界光線：由光源經擋板邊緣，直線延長到屏
    addRay(dyn, SOURCE, shadowTop, MAT.shadowRay, 0.062, 0.78, 0.42);
    addRay(dyn, SOURCE, shadowBottom, MAT.shadowRay, 0.062, 0.78, 0.42);

    // 其他直線光線：被擋板截住者停在擋板前，未被截住者直達光屏
    const targets = [-7.4, -5.4, -3.4, -1.4, 1.4, 3.4, 5.4, 7.4];
    for (const yTarget of targets) {
      const tBarrier = (x - SOURCE.x) / (SCREEN_X - SOURCE.x);
      const yAtBarrier = SOURCE.y + (yTarget - SOURCE.y) * tBarrier;
      let end;

      if (Math.abs(yAtBarrier) <= height / 2) {
        const stopX = x - 0.20;
        const tStop = (stopX - SOURCE.x) / (SCREEN_X - SOURCE.x);
        end = new THREE.Vector3(stopX, SOURCE.y + (yTarget - SOURCE.y) * tStop, 0);
      } else {
        end = new THREE.Vector3(SCREEN_X, yTarget, 0);
      }

      addRay(dyn, SOURCE, end, MAT.shadowRayDim, 0.038, 0.82, 0.30);
    }

    shadowLabel.position.set((x + SCREEN_X) / 2, 0.25, 0);
    const boundaryX = SOURCE.x + (SCREEN_X - SOURCE.x) * 0.85;
    const boundaryY = SOURCE.y + (shadowTop.y - SOURCE.y) * 0.85;
    boundaryLabel.position.set(boundaryX, boundaryY + 0.60, 0);

    const ratio = (SCREEN_X - SOURCE.x) / (x - SOURCE.x);

    return {
      barrierHeight: height,
      barrierX: x,
      sourceToBarrier: x - SOURCE.x,
      sourceToScreen: SCREEN_X - SOURCE.x,
      shadowHeight,
      ratio
    };
  };

  return group;
}

/* ---------------------------------------------------------------- *
 * 站2：反射定律
 * 水平鏡面 y＝0，法線沿 +Y；入射線自左上方射向原點。
 * ---------------------------------------------------------------- */
function buildReflectionStation() {
  const group = new THREE.Group();
  const dyn = new THREE.Group();
  group.add(dyn);
  group.userData.dyn = dyn;

  const L = 12;

  // 鏡面：薄盒桌面式，上表面貼齊 y＝0
  const mirror = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.30, 9),
    new THREE.MeshStandardMaterial({
      color: 0x33414f,
      metalness: 0.90,
      roughness: 0.20
    })
  );
  mirror.position.y = -0.15;
  group.add(mirror);

  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(22.3, 0.06, 9.3),
    new THREE.MeshBasicMaterial({ color: 0x6f8aa8 })
  );
  rim.position.y = 0.02;
  group.add(rim);

  // 法線（固定，⊥ 鏡面）
  group.add(dashedLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 8.7, 0)));
  addLabel(group, t('lbl.normal'), new THREE.Vector3(0.85, 8.95, 0), '#e8eef6', 1.0);
  addLabel(group, t('lbl.mirror'), new THREE.Vector3(-8.2, 0.85, 0), '#9fc6ff', 1.05);

  const iLabel = addLabel(group, 'i', new THREE.Vector3(0, 0, 0), '#ffb45e', 0.95);
  const rLabel = addLabel(group, 'r', new THREE.Vector3(0, 0, 0), '#8fc8ff', 0.95);
  const inLabel = addLabel(group, t('lbl.incident'), new THREE.Vector3(0, 0, 0), '#ffb45e', 0.95);
  const outLabel = addLabel(group, t('lbl.reflected'), new THREE.Vector3(0, 0, 0), '#8fc8ff', 0.95);

  group.userData.update = function (iDeg) {
    clearDynamic(group);

    const iRad = iDeg * DEG;
    const sinI = Math.sin(iRad);
    const cosI = Math.cos(iRad);

    const origin = new THREE.Vector3(0, 0, 0);
    const dirInAway = new THREE.Vector3(-sinI, cosI, 0); // 由入射點指向入射光源側
    const dirOut = new THREE.Vector3(sinI, cosI, 0);      // 反射方向（X 同號、Y 翻轉）
    const pin = origin.clone().addScaledVector(dirInAway, L);

    addRay(dyn, pin, origin, MAT.incident, RAY_R, 0.66, 0.48);
    addRay(dyn, origin, dirOut.clone().multiplyScalar(L), MAT.reflected, RAY_R, 0.46, 0.48);

    // 角弧：一律自 +Y 法線量起
    dyn.add(arcMesh(origin, 3.2, Math.PI / 2, Math.PI / 2 + iRad));
    dyn.add(arcMesh(origin, 3.2, Math.PI / 2 - iRad, Math.PI / 2));

    const aI = Math.PI / 2 + iRad / 2;
    const aR = Math.PI / 2 - iRad / 2;
    iLabel.position.set(4.15 * Math.cos(aI), 4.15 * Math.sin(aI), 0);
    rLabel.position.set(4.15 * Math.cos(aR), 4.15 * Math.sin(aR), 0);

    inLabel.position.copy(pin).multiplyScalar(0.56).add(new THREE.Vector3(-0.55, 0, 0));
    outLabel.position.copy(dirOut).multiplyScalar(L * 0.56).add(new THREE.Vector3(0.55, 0, 0));

    return { i: iDeg, r: reflectAngle(iDeg) };
  };

  return group;
}

/* ---------------------------------------------------------------- *
 * 站3：平面鏡虛像
 * 豎直平面鏡位於 YZ 平面 x＝0；物點在鏡前左側，虛像在鏡後對稱位置。
 * ---------------------------------------------------------------- */
function buildMirrorStation() {
  const group = new THREE.Group();
  const dyn = new THREE.Group();
  group.add(dyn);
  group.userData.dyn = dyn;

  const OBJECT_Y = 1.5;
  const HIT_1 = new THREE.Vector3(0, 0.0, 0);
  const HIT_2 = new THREE.Vector3(0, 3.0, 0);

  // 半透明鏡面，讓鏡後虛線與虛像可見
  const mirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 10, 7),
    new THREE.MeshPhysicalMaterial({
      color: 0x7896b8,
      metalness: 0.85,
      roughness: 0.16,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  group.add(mirror);

  const mirrorEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 10.1, 0.07),
    new THREE.MeshBasicMaterial({ color: 0xbfe0ff })
  );
  mirrorEdge.position.set(-0.145, 0, 0);
  group.add(mirrorEdge);

  addLabel(group, t('lbl.planeMirror'), new THREE.Vector3(0.9, 5.65, 0), '#9fc6ff', 1.05);

  // 物點與虛像標記（位置隨物距更新）
  const objectMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 14),
    new THREE.MeshStandardMaterial({
      color: 0xffc266,
      emissive: 0xff9f2e,
      emissiveIntensity: 1.4,
      roughness: 0.4
    })
  );
  group.add(objectMarker);

  const imageRing = (() => {
    const pts = [];
    const r = 0.58;
    for (let k = 0; k <= 64; k += 1) {
      const a = (k / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, MAT.virtual);
    line.computeLineDistances();
    return line;
  })();
  group.add(imageRing);

  const objectLabel = addLabel(group, t('lbl.object'), new THREE.Vector3(0, 0, 0), '#ffc266', 1.0);
  const imageLabel = addLabel(group, t('lbl.virtualImage'), new THREE.Vector3(0, 0, 0), '#c9a7ff', 1.05);
  const extLabel = addLabel(group, t('lbl.extension'), new THREE.Vector3(0, 0, 0), '#8fc8ff', 0.9);

  group.userData.update = function (u) {
    clearDynamic(group);

    const object = new THREE.Vector3(-u, OBJECT_Y, 0);
    const image = new THREE.Vector3(mirrorImageDistance(u), OBJECT_Y, 0);

    objectMarker.position.copy(object);
    objectLabel.position.set(object.x - 1.15, object.y + 0.65, 0);

    imageRing.position.copy(image);
    imageLabel.position.set(image.x + 1.25, image.y + 0.65, 0);

    const hits = [HIT_1, HIT_2];

    for (const hit of hits) {
      // 入射光：物點 → 鏡面
      addRay(dyn, object, hit, MAT.incident, 0.060, 0.62, 0.38);

      // 反射光：X 分量翻轉，留在鏡前（x ≤ 0）
      const incoming = hit.clone().sub(object);
      const outgoing = new THREE.Vector3(-incoming.x, incoming.y, 0).normalize();
      const tEdge = (-9.5 - hit.x) / outgoing.x;
      const reflectedEnd = hit.clone().addScaledVector(outgoing, tEdge);
      addRay(dyn, hit, reflectedEnd, MAT.reflected, 0.060, 0.50, 0.38);

      // 鏡後反向延長：虛線，光線本體沒有進入鏡後
      dyn.add(dashedLine(hit, image, MAT.virtual));

      // 入射點小標記
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 14, 10),
        MAT.reflected
      );
      dot.position.copy(hit);
      dyn.add(dot);
    }

    extLabel.position.set(u * 0.52, OBJECT_Y + 2.15, 0);

    return {
      u,
      v: mirrorImageDistance(u),
      ratio: mirrorImageDistance(u) / u
    };
  };

  return group;
}

/* ---------------------------------------------------------------- *
 * 站4：折射（斯涅爾定律）
 * 水平界面 y＝0；上方空氣 n1＝1.00，下方玻璃 n2＝1.50。
 * ---------------------------------------------------------------- */
function buildRefractionStation() {
  const group = new THREE.Group();
  const dyn = new THREE.Group();
  group.add(dyn);
  group.userData.dyn = dyn;

  const L = 12;

  // 玻璃塊（半透明）
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(24, 9, 10),
    new THREE.MeshPhysicalMaterial({
      color: 0x8fd4ff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.06,
      metalness: 0,
      transmission: 0.32,
      thickness: 1.2,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  glass.position.set(0, -4.5, 0);
  group.add(glass);

  // 界面亮帶
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(24.2, 0.06, 10.2),
    new THREE.MeshBasicMaterial({ color: 0x9ecbe8, transparent: true, opacity: 0.70 })
  );
  face.position.y = 0;
  group.add(face);

  // 法線（貫穿界面上方與玻璃內部）
  group.add(dashedLine(new THREE.Vector3(0, 8.6, 0), new THREE.Vector3(0, -8.6, 0)));
  addLabel(group, t('lbl.normal'), new THREE.Vector3(0.85, 9.0, 0), '#e8eef6', 1.0);

  addLabel(group, t('lbl.air'), new THREE.Vector3(-7.8, 6.0, 0), '#c8d8ef', 1.0);
  addLabel(group, t('lbl.glass'), new THREE.Vector3(-7.8, -5.7, 0), '#7fe6d2', 1.0);

  const iLabel = addLabel(group, 'i', new THREE.Vector3(0, 0, 0), '#ffb45e', 0.95);
  const rLabel = addLabel(group, 'r', new THREE.Vector3(0, 0, 0), '#7fe6d2', 0.95);
  const inLabel = addLabel(group, t('lbl.incident'), new THREE.Vector3(0, 0, 0), '#ffb45e', 0.95);
  const refLabel = addLabel(group, t('lbl.refracted'), new THREE.Vector3(0, 0, 0), '#7fe6d2', 0.95);

  group.userData.update = function (iDeg) {
    clearDynamic(group);

    const iRad = iDeg * DEG;
    const rDeg = refractAngle(iDeg, 1.00, 1.50);
    const rRad = (rDeg === null ? 0 : rDeg) * DEG;

    const origin = new THREE.Vector3(0, 0, 0);
    const dirInAway = new THREE.Vector3(-Math.sin(iRad), Math.cos(iRad), 0);
    const dirRefr = new THREE.Vector3(-Math.sin(rRad), -Math.cos(rRad), 0);
    const pin = origin.clone().addScaledVector(dirInAway, L);

    addRay(dyn, pin, origin, MAT.incident, RAY_R, 0.66, 0.48);
    addRay(dyn, origin, dirRefr.clone().multiplyScalar(L), MAT.refracted, RAY_R, 0.47, 0.48);

    // 角弧
    dyn.add(arcMesh(origin, 3.2, Math.PI / 2, Math.PI / 2 + iRad));
    const angRefr = Math.atan2(dirRefr.y, dirRefr.x);
    dyn.add(arcMesh(origin, 3.2, -Math.PI / 2, angRefr));

    const aI = Math.PI / 2 + iRad / 2;
    const aR = (-Math.PI / 2 + angRefr) / 2;
    iLabel.position.set(4.15 * Math.cos(aI), 4.15 * Math.sin(aI), 0);
    rLabel.position.set(4.15 * Math.cos(aR), 4.15 * Math.sin(aR), 0);

    inLabel.position.copy(pin).multiplyScalar(0.56).add(new THREE.Vector3(-0.55, 0, 0));
    refLabel.position.copy(dirRefr).multiplyScalar(L * 0.52).add(new THREE.Vector3(-0.45, 0, 0));

    return {
      i: iDeg,
      r: rDeg,
      n1sini: 1.00 * Math.sin(iRad),
      n2sinr: 1.50 * Math.sin(rRad)
    };
  };

  return group;
}

/* ---------------------------------------------------------------- *
 * 站5：稜鏡色散
 * 等腰三角稜鏡 A(0,4)、B(-3.5,-3)、C(3.5,-3)，水平白光自左射入。
 * 每個顏色在左、右界面各做一次斯涅爾折射（refractVector2D）。
 * ---------------------------------------------------------------- */
function buildDispersionStation() {
  const group = new THREE.Group();
  const dyn = new THREE.Group();
  group.add(dyn);
  group.userData.dyn = dyn;

  const A = vec2(0, 4);
  const B = vec2(-3.5, -3);
  const C = vec2(3.5, -3);

  const COLORS = [
    { key: 'red', label: t('lbl.red'), n: 1.490, material: MAT.red, color: '#ff7777' },
    { key: 'green', label: t('lbl.green'), n: 1.510, material: MAT.green, color: '#7cf29a' },
    { key: 'blue', label: t('lbl.blue'), n: 1.530, material: MAT.blue, color: '#8fb3ff' }
  ];

  // 二維多邊形以 ExtrudeGeometry 長出厚度，光路仍取 z＝0 剖面
  const shape = new THREE.Shape();
  shape.moveTo(A.x, A.y);
  shape.lineTo(B.x, B.y);
  shape.lineTo(C.x, C.y);
  shape.closePath();

  const prismGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 2.4,
    bevelEnabled: false,
    steps: 1
  });
  prismGeo.translate(0, 0, -1.2);

  const prism = new THREE.Mesh(
    prismGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xa9dcff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.40,
      thickness: 1.2,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  group.add(prism);

  const prismEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(prismGeo, 18),
    new THREE.LineBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.9 })
  );
  group.add(prismEdges);

  addLabel(group, t('lbl.prism'), new THREE.Vector3(0, 0.35, 2.1), '#9fdcff', 1.05);
  addLabel(group, t('lbl.nVary'), new THREE.Vector3(0, -4.75, 0), '#c6d4e6', 0.95);

  const whiteLabel = addLabel(group, t('lbl.white'), new THREE.Vector3(0, 0, 0), '#ffffff', 1.0);

  // 出射色光圖例（固定在右上方，避免三色標籤互相重疊）
  addLabel(group, t('lbl.exitColors'), new THREE.Vector3(11.25, 7.15, 0), '#c6d4e6', 0.92);
  const legendY = [6.15, 5.10, 4.05];
  COLORS.forEach((c, i) => {
    const y = legendY[i];
    const swatch = thinLine(
      new THREE.Vector3(9.65, y, 0),
      new THREE.Vector3(10.45, y, 0),
      new THREE.LineBasicMaterial({ color: c.material.color })
    );
    group.add(swatch);
    addLabel(group, c.label, new THREE.Vector3(11.05, y, 0), c.color, 0.92);
  });

  // 左表面 A→B 的內向法線；多邊形為逆時針，內側在行進方向左方。
  const leftEdge = sub2(B, A);
  const inwardNormal = normalize2(vec2(-leftEdge.y, leftEdge.x));

  // 右表面 C→A 的外向法線，以及底面 B→C 的外向法線。
  const rightEdge = sub2(A, C);
  const outRight = normalize2(vec2(rightEdge.y, -rightEdge.x));
  const baseEdge = sub2(C, B);
  const outBase = normalize2(vec2(baseEdge.y, -baseEdge.x));

  const incidentDirection = vec2(1, 0);

  group.userData.update = function (entryY) {
    clearDynamic(group);

    // 水平白光與左表面的交點
    const entry = vec2(
      A.x + ((entryY - A.y) / (B.y - A.y)) * (B.x - A.x),
      entryY
    );
    const source = vec2(entry.x - 8.5, entry.y);

    const entry3 = new THREE.Vector3(entry.x, entry.y, 0);
    const source3 = new THREE.Vector3(source.x, source.y, 0);

    addRay(dyn, source3, entry3, MAT.white, 0.070, 0.72, 0.42);
    whiteLabel.position.set(source.x - 0.85, source.y + 0.80, 0);

    const deviations = {};

    for (const c of COLORS) {
      const insideDir = refractVector2D(incidentDirection, inwardNormal, 1.0, c.n);
      if (!insideDir) continue;

      const hitRight = raySegmentIntersect2D(entry, insideDir, A, C);
      const hitBase = raySegmentIntersect2D(entry, insideDir, B, C);

      let hit = null;
      let outwardNormal = null;

      if (hitRight && (!hitBase || hitRight.t <= hitBase.t)) {
        hit = hitRight;
        outwardNormal = outRight;
      } else if (hitBase) {
        hit = hitBase;
        outwardNormal = outBase;
      }

      if (!hit || !outwardNormal) continue;

      const exitDir = refractVector2D(insideDir, outwardNormal, c.n, 1.0);
      if (!exitDir) continue;

      const entryPoint = new THREE.Vector3(entry.x, entry.y, 0);
      const exitPoint = new THREE.Vector3(hit.point.x, hit.point.y, 0);
      const outEnd = new THREE.Vector3(
        exitPoint.x + exitDir.x * 8.0,
        exitPoint.y + exitDir.y * 8.0,
        0
      );

      // 稜鏡內部：三色幾乎重疊，以細線顯示
      dyn.add(raySegment(entryPoint, exitPoint.clone().sub(entryPoint).normalize(),
        entryPoint.distanceTo(exitPoint), 0.046, c.material));

      // 出射光：各色分開
      addRay(dyn, exitPoint, outEnd, c.material, 0.068, 0.68, 0.40);

      const deviation = Math.abs(Math.atan2(exitDir.y, exitDir.x)) / DEG;
      deviations[c.key] = deviation;
    }

    return {
      entryY,
      redDeviation: deviations.red ?? null,
      greenDeviation: deviations.green ?? null,
      blueDeviation: deviations.blue ?? null
    };
  };

  return group;
}

/* ---------------------------------------------------------------- *
 * 站6：凸透鏡成像
 * 光軸沿 X；透鏡位於 x＝0；f 固定 4.0；u 滑桿範圍 6–12（u＞f）。
 * ---------------------------------------------------------------- */
function buildLensStation() {
  const group = new THREE.Group();
  const dyn = new THREE.Group();
  group.add(dyn);
  group.userData.dyn = dyn;

  const F = 4.0;
  const OBJECT_HEIGHT = 2.2;
  const LENS_HALF_HEIGHT = 5.2;
  const END_X = 14.6;

  // 雙凸透鏡剖面：兩段二次曲線，沿 Z 長出厚度
  const lensShape = new THREE.Shape();
  lensShape.moveTo(0, LENS_HALF_HEIGHT);
  lensShape.quadraticCurveTo(0.62, 0, 0, -LENS_HALF_HEIGHT);
  lensShape.quadraticCurveTo(-0.62, 0, 0, LENS_HALF_HEIGHT);
  lensShape.closePath();

  const lensGeo = new THREE.ExtrudeGeometry(lensShape, {
    depth: 1.8,
    bevelEnabled: false,
    steps: 1
  });
  lensGeo.translate(0, 0, -0.9);

  const lens = new THREE.Mesh(
    lensGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xa7ddff,
      transparent: true,
      opacity: 0.30,
      roughness: 0.04,
      metalness: 0,
      transmission: 0.48,
      thickness: 1.0,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  group.add(lens);

  const lensEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(lensGeo, 18),
    new THREE.LineBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.9 })
  );
  group.add(lensEdges);

  // 主光軸
  group.add(thinLine(new THREE.Vector3(-15, 0, 0), new THREE.Vector3(15, 0, 0), MAT.axis));
  addLabel(group, t('lbl.axis'), new THREE.Vector3(14.1, 0.75, 0), '#8a97a8', 0.9);

  // 焦點與光心
  const focusMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  const mkPoint = (x, y, label, color) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), focusMat);
    dot.position.set(x, y, 0);
    group.add(dot);
    addLabel(group, label, new THREE.Vector3(x, y + 0.72, 0), color, 0.95);
  };
  mkPoint(-F, 0, 'F', '#ffd166');
  mkPoint(F, 0, 'F′', '#ffd166');
  mkPoint(0, 0, 'O', '#dce3ec');

  // 焦距標註
  group.add(thinLine(new THREE.Vector3(0, -6.05, 0), new THREE.Vector3(F, -6.05, 0), MAT.axisDim));
  group.add(thinLine(new THREE.Vector3(0, -6.32, 0), new THREE.Vector3(0, -5.78, 0), MAT.axisDim));
  group.add(thinLine(new THREE.Vector3(F, -6.32, 0), new THREE.Vector3(F, -5.78, 0), MAT.axisDim));
  addLabel(group, 'f = 4.0', new THREE.Vector3(F / 2, -6.95, 0), '#ffd166', 0.95);

  const objectLabel = addLabel(group, t('lbl.obj'), new THREE.Vector3(0, 0, 0), '#ffc266', 1.0);
  const imageLabel = addLabel(group, t('lbl.realImage'), new THREE.Vector3(0, 0, 0), '#c9a7ff', 1.05);

  const extendToX = (from, dir, xTarget) => {
    const t = (xTarget - from.x) / dir.x;
    return from.clone().addScaledVector(dir, t);
  };

  group.userData.update = function (u) {
    clearDynamic(group);

    const result = thinLens(F, u);
    const v = result.v;
    const m = result.magnification;

    const objectBase = new THREE.Vector3(-u, 0, 0);
    const objectTip = new THREE.Vector3(-u, OBJECT_HEIGHT, 0);
    const imageBase = new THREE.Vector3(v, 0, 0);
    const imageTip = new THREE.Vector3(v, m * OBJECT_HEIGHT, 0);

    // 物箭頭
    const objDir = objectTip.clone().sub(objectBase).normalize();
    dyn.add(raySegment(objectBase, objDir, OBJECT_HEIGHT, 0.075, MAT.object));
    dyn.add(rayArrow(objectBase.clone().addScaledVector(objDir, OBJECT_HEIGHT - 0.48), objDir, 0.48, MAT.object));

    // 像箭頭（實像以細實線表示）
    const imageHeight = m * OBJECT_HEIGHT;
    const imageDir = new THREE.Vector3(0, Math.sign(imageHeight) || 1, 0);
    dyn.add(raySegment(imageBase, imageDir, Math.abs(imageHeight), 0.055, MAT.image));
    dyn.add(rayArrow(imageBase.clone().addScaledVector(imageDir, Math.abs(imageHeight) - 0.46), imageDir, 0.46, MAT.image));

    // 標準作圖光線一：平行光軸 → 通過 F′
    const hitParallel = new THREE.Vector3(0, OBJECT_HEIGHT, 0);
    const dirParallel = new THREE.Vector3(F, -OBJECT_HEIGHT, 0).normalize();
    const endParallel = extendToX(hitParallel, dirParallel, END_X);
    addRay(dyn, objectTip, hitParallel, MAT.incident, 0.055, 0.62, 0.36);
    addRay(dyn, hitParallel, endParallel, MAT.reflected, 0.055, 0.58, 0.36);

    // 標準作圖光線二：通過光心 O，方向不變
    const center = new THREE.Vector3(0, 0, 0);
    const dirCenter = new THREE.Vector3(u, -OBJECT_HEIGHT, 0).normalize();
    const endCenter = extendToX(center, dirCenter, END_X);
    addRay(dyn, objectTip, center, MAT.incident, 0.055, 0.62, 0.36);
    addRay(dyn, center, endCenter, MAT.reflected, 0.055, 0.58, 0.36);

    // 標準作圖光線三：通過 F → 折射後平行光軸
    const hitFocus = new THREE.Vector3(0, -F * OBJECT_HEIGHT / (u - F), 0);
    const endFocus = new THREE.Vector3(END_X, hitFocus.y, 0);
    addRay(dyn, objectTip, hitFocus, MAT.incident, 0.055, 0.62, 0.36);
    addRay(dyn, hitFocus, endFocus, MAT.reflected, 0.055, 0.58, 0.36);

    objectLabel.position.set(-u - 0.95, OBJECT_HEIGHT + 0.55, 0);
    imageLabel.position.set(v + 1.15, m * OBJECT_HEIGHT - 0.65, 0);

    return {
      f: F,
      u,
      v,
      m,
      imageHeight,
      real: v > 0,
      inverted: m < 0
    };
  };

  return group;
}

/* ================================================================
 * 四、站別實例、相機視角與 UI
 * ================================================================ */
const STATION_ORDER = ['shadow', 'reflection', 'mirror', 'refraction', 'dispersion', 'lens'];

const STATION_VIEWS = {
  shadow: {
    position: new THREE.Vector3(10, 11, 30),
    target: new THREE.Vector3(0, 0, 0)
  },
  reflection: {
    position: new THREE.Vector3(16, 13, 27),
    target: new THREE.Vector3(0, 3.2, 0)
  },
  mirror: {
    position: new THREE.Vector3(15, 10, 31),
    target: new THREE.Vector3(0, 1.2, 0)
  },
  refraction: {
    position: new THREE.Vector3(17, 13, 28),
    target: new THREE.Vector3(0, 0, 0)
  },
  dispersion: {
    position: new THREE.Vector3(9, 7, 30),
    target: new THREE.Vector3(0, 0.2, 0)
  },
  lens: {
    position: new THREE.Vector3(10, 8, 32),
    target: new THREE.Vector3(0, 0, 0)
  }
};

const builders = {
  shadow: buildShadowStation,
  reflection: buildReflectionStation,
  mirror: buildMirrorStation,
  refraction: buildRefractionStation,
  dispersion: buildDispersionStation,
  lens: buildLensStation
};

const stations = {};
for (const key of STATION_ORDER) {
  const group = builders[key]();
  group.visible = key === 'shadow';
  group.userData.stationKey = key;
  group.userData.ex = 0; // 全域禁止 explode：每站爆炸位移固定為 0
  scene.add(group);
  stations[key] = group;
}

function focusStation(key) {
  const view = STATION_VIEWS[key];
  if (!view) return;
  camera.position.copy(view.position);
  controls.target.copy(view.target);
  controls.update();
}

const ui = {
  shadowH: document.getElementById('s-shadow-h'),
  shadowX: document.getElementById('s-shadow-x'),
  reflectI: document.getElementById('s-reflect-i'),
  mirrorU: document.getElementById('s-mirror-u'),
  refractI: document.getElementById('s-refract-i'),
  dispY: document.getElementById('s-disp-y'),
  lensU: document.getElementById('s-lens-u')
};

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function refreshShadow() {
  const height = parseFloat(ui.shadowH.value);
  const x = parseFloat(ui.shadowX.value);
  const data = stations.shadow.userData.update({ height, x });
  setText('ro-shadow-h', height.toFixed(1));
  setText('ro-shadow-x', x.toFixed(1));
  setText('ro-shadow-sh', data.shadowHeight.toFixed(1));
  setText('ro-shadow-ratio', data.ratio.toFixed(2) + ' ' + t('unit.x'));
}

function refreshReflection() {
  const i = parseFloat(ui.reflectI.value);
  const data = stations.reflection.userData.update(i);
  setText('ro-reflect-i', data.i.toFixed(1) + '°');
  setText('ro-reflect-r', data.r.toFixed(1) + '°');
}

function refreshMirror() {
  const u = parseFloat(ui.mirrorU.value);
  const data = stations.mirror.userData.update(u);
  setText('ro-mirror-u', data.u.toFixed(1));
  setText('ro-mirror-v', data.v.toFixed(1));
  setText('ro-mirror-ratio', data.ratio.toFixed(2));
}

function refreshRefraction() {
  const i = parseFloat(ui.refractI.value);
  const data = stations.refraction.userData.update(i);
  setText('ro-refract-i', data.i.toFixed(1) + '°');
  setText('ro-refract-r', data.r === null ? '—' : data.r.toFixed(1) + '°');
  setText('ro-n1sini', data.n1sini.toFixed(3));
  setText('ro-n2sinr', data.n2sinr.toFixed(3));
}

function refreshDispersion() {
  const entryY = parseFloat(ui.dispY.value);
  const data = stations.dispersion.userData.update(entryY);
  setText('ro-disp-y', entryY.toFixed(1));
  setText('ro-disp-red', data.redDeviation === null ? '—' : data.redDeviation.toFixed(1) + '°');
  setText('ro-disp-blue', data.blueDeviation === null ? '—' : data.blueDeviation.toFixed(1) + '°');
}

function refreshLens() {
  const u = parseFloat(ui.lensU.value);
  const data = stations.lens.userData.update(u);
  setText('ro-lens-f', data.f.toFixed(2));
  setText('ro-lens-u', data.u.toFixed(2));
  setText('ro-lens-v', Number.isFinite(data.v) ? data.v.toFixed(2) : '∞');
  setText('ro-lens-m', Number.isFinite(data.m) ? data.m.toFixed(2).replace('-', '−') : '—');
  setText('ro-lens-type', data.real && data.inverted ? t('lens.invReal') : data.real ? t('lens.upReal') : t('lens.virtual'));
}

ui.shadowH.addEventListener('input', refreshShadow);
ui.shadowX.addEventListener('input', refreshShadow);
ui.reflectI.addEventListener('input', refreshReflection);
ui.mirrorU.addEventListener('input', refreshMirror);
ui.refractI.addEventListener('input', refreshRefraction);
ui.dispY.addEventListener('input', refreshDispersion);
ui.lensU.addEventListener('input', refreshLens);

const tabs = [...document.querySelectorAll('.tab')];

function selectStation(key) {
  if (!stations[key]) return;

  for (const btn of tabs) {
    const active = btn.dataset.station === key;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  }

  for (const stationKey of STATION_ORDER) {
    stations[stationKey].visible = stationKey === key;
    const panel = document.getElementById('panel-' + stationKey);
    if (panel) panel.hidden = stationKey !== key;
  }

  focusStation(key);
}

for (const btn of tabs) {
  btn.addEventListener('click', () => selectStation(btn.dataset.station));
}

/* ================================================================
 * 五、Resize、渲染迴圈與初始化
 * ================================================================ */
function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;

  let needsUpdate = false;

  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) ||
      canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    needsUpdate = true;
  }

  // 橫向且矮的視窗（例如平板橫放、視窗高度不足）適度放大，避免六站物件過小。
  const wantZoom = (h < 520 && w / h > 1.6) ? 1.18 : 1;
  if (Math.abs(camera.zoom - wantZoom) > 1e-6) {
    camera.zoom = wantZoom;
    needsUpdate = true;
  }

  if (needsUpdate) camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);
  resize();
  controls.update();
  renderer.render(scene, camera);
}

/* ================================================================
 * 六、自檢（載入時 console.assert）
 * ================================================================ */
function runSelfChecks() {
  let pass = 0;
  let fail = 0;

  const check = (condition, message) => {
    console.assert(condition, message);
    if (condition) pass += 1;
    else fail += 1;
  };

  // 反射定律：r ≡ i
  [10, 25, 40, 55, 70].forEach((i) => {
    const r = reflectAngle(i);
    check(Math.abs(r - i) < 1e-12,
      `[反射自檢] i=${i}° 時 r 應等於 i，實得 r=${r}°`);
  });

  // 斯涅爾定律：空氣 → 玻璃（n1=1.00, n2=1.50）
  [
    { i: 30, r: 19.47122063449069 },
    { i: 45, r: 28.125505702055736 }
  ].forEach(({ i, r }) => {
    const got = refractAngle(i, 1.00, 1.50);
    check(got !== null && Math.abs(got - r) < 1e-9,
      `[折射自檢] i=${i}° 時 r 應 ≈ ${r.toFixed(4)}°，實得 r=${got}`);
    const gotAlias = snellAngle(i, 1.00, 1.50);
    check(gotAlias !== null && Math.abs(gotAlias - got) < 1e-12,
      `[折射自檢] snellAngle 與 refractAngle 應一致（i=${i}°）`);
  });

  // 平面鏡：像距 ＝ 物距
  [3, 5, 6, 9].forEach((u) => {
    check(Math.abs(mirrorImageDistance(u) - u) < 1e-12,
      `[平面鏡自檢] u=${u} 時像距應等於物距，實得 v=${mirrorImageDistance(u)}`);
  });

  // 薄透鏡公式：1/f ＝ 1/u ＋ 1/v；m ＝ −v/u
  [
    { f: 4, u: 6 },
    { f: 4, u: 8 },
    { f: 4, u: 12 }
  ].forEach(({ f, u }) => {
    const result = thinLens(f, u);
    const lhs = 1 / f;
    const rhs = 1 / u + 1 / result.v;
    check(Math.abs(lhs - rhs) < 1e-10,
      `[薄透鏡自檢] f=${f}, u=${u} 時 1/f 應等於 1/u＋1/v`);
    check(Math.abs(result.magnification + result.v / u) < 1e-12,
      `[薄透鏡自檢] f=${f}, u=${u} 時 m 應等於 −v/u`);
  });

  // 向量折射與角度公式一致（法線入射）
  const normalRefract = refractVector2D(vec2(0, -1), vec2(0, -1), 1.0, 1.5);
  check(normalRefract !== null &&
    Math.abs(normalRefract.x) < 1e-12 &&
    Math.abs(normalRefract.y + 1) < 1e-12,
    '[向量折射自檢] 法線入射時方向應不偏折');

  // 全域旗標
  check(OPTICS_FLAGS.noExplode === true, 'OPTICS_FLAGS.noExplode 應為 true');
  check(OPTICS_FLAGS.ex === 0, 'OPTICS_FLAGS.ex 應為 0');
  check(
    STATION_ORDER.every((key) => stations[key] && stations[key].userData.ex === 0),
    '[explode 自檢] 六站的 userData.ex 均應為 0'
  );

  console.info(`[光學3D自檢] 六站物理核心：${pass} 項通過，${fail} 項失敗。`);
  return { pass, fail };
}

window.runOpticsSelfChecks = runSelfChecks;

/* 初始化 */
refreshShadow();
refreshReflection();
refreshMirror();
refreshRefraction();
refreshDispersion();
refreshLens();
selectStation('shadow');
resize();
runSelfChecks();
animate();
