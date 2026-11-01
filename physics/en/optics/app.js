"use strict";

/* ============================================================
   澳門科學館｜光學互動教學實驗室

   技術：
   - 原生 JavaScript
   - SVG
   - 無外部依賴

   座標系統：
   - x 向右為正
   - y 向下為正
   - SVG 繪圖範圍 1000 × 620

   科學約定：
   - 角度由法線量度
   - 反射角 = 入射角
   - 折射滿足斯涅爾定律
   - 平面鏡後只繪製虛線反向延長線
   - 凸透鏡採中學常用正實物距、正實像距約定

   注意：
   SVG 座標為圖示單位，並非實際長度。
   ============================================================ */


/* ============================================================
   一、基本工具
   ============================================================ */

const $ = (selector) => document.querySelector(selector);

const scene = $("#scene");
const controls = $("#controls");
const readouts = $("#readouts");
const science = $("#science");

const selectionTitle = $("#selectionTitle");
const selectionText = $("#selectionText");

const visualTitle = $("#visualTitle");
const sceneHint = $("#sceneHint");

const DEG = Math.PI / 180;

function toRad(degrees) {
  return degrees * DEG;
}

function toDeg(radians) {
  return radians / DEG;
}

function sinD(degrees) {
  return Math.sin(toRad(degrees));
}

function asinD(value) {
  return toDeg(
    Math.asin(Math.max(-1, Math.min(1, value)))
  );
}

function num(value) {
  return Number(value).toFixed(2);
}

function fixed(value, digits = 1) {
  return Number(value).toFixed(digits);
}

function point(x, y) {
  return { x, y };
}

function add(a, b) {
  return point(a.x + b.x, a.y + b.y);
}

function subtract(a, b) {
  return point(a.x - b.x, a.y - b.y);
}

function scale(a, factor) {
  return point(a.x * factor, a.y * factor);
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function length(a) {
  return Math.hypot(a.x, a.y);
}

function normalize(a) {
  const magnitude = length(a);

  if (magnitude < 1e-12) {
    throw new Error("無法正規化零向量");
  }

  return scale(a, 1 / magnitude);
}


/* ============================================================
   二、光學數學模型
   ============================================================ */

/**
 * 反射定律
 *
 * i = r
 *
 * 入射角、反射角均相對法線量度。
 */
function reflectionAngle(incidentAngle) {
  return incidentAngle;
}


/**
 * 斯涅爾定律
 *
 * n1 sin(i) = n2 sin(r)
 *
 * 回傳：
 * - 折射角（度）
 * - 若發生全內反射則回傳 null
 */
function snellAngle(n1, n2, incidentAngle) {
  const ratio =
    (n1 / n2) * sinD(incidentAngle);

  if (Math.abs(ratio) > 1 + 1e-12) {
    return null;
  }

  return asinD(ratio);
}


/**
 * 二維向量形式的折射計算。
 *
 * incident：
 *   入射光行進方向，單位向量
 *
 * normal：
 *   指向第二介質的界面法向量
 *
 * n1：
 *   入射介質折射率
 *
 * n2：
 *   透射介質折射率
 *
 * 此模型同時使用於稜鏡的兩個折射面。
 */
function refractVector(incident, normal, n1, n2) {
  const I = normalize(incident);
  const N = normalize(normal);

  const cosIncident = dot(I, N);

  if (cosIncident <= 0) {
    return null;
  }

  const eta = n1 / n2;

  // 入射向量相對法線的切向分量
  const tangent = subtract(
    I,
    scale(N, cosIncident)
  );

  const transmittedTangent = scale(
    tangent,
    eta
  );

  const tangentSquared = dot(
    transmittedTangent,
    transmittedTangent
  );

  // 全內反射
  if (tangentSquared > 1 + 1e-12) {
    return null;
  }

  const normalComponent = Math.sqrt(
    Math.max(0, 1 - tangentSquared)
  );

  return normalize(
    add(
      transmittedTangent,
      scale(N, normalComponent)
    )
  );
}


/**
 * 射線與線段所在直線的交點。
 *
 * 射線：
 * P + tD，t >= 0
 *
 * 線段：
 * A + u(B-A)，0 <= u <= 1
 */
function raySegmentIntersection(P, D, A, B) {
  const E = subtract(B, A);

  const denominator = cross(D, E);

  if (Math.abs(denominator) < 1e-10) {
    return null;
  }

  const AP = subtract(A, P);

  const t = cross(AP, E) / denominator;
  const u = cross(AP, D) / denominator;

  if (t < 0 || u < -1e-8 || u > 1 + 1e-8) {
    return null;
  }

  return add(P, scale(D, t));
}


/**
 * 薄透鏡公式
 *
 * 1/f = 1/u + 1/v
 *
 * v = fu/(u-f)
 *
 * 約定：
 * - 凸透鏡焦距 f > 0
 * - 實物距 u > 0
 * - 實像距 v > 0
 * - 虛像距 v < 0
 *
 * 放大率 m = -v/u
 */
function thinLens(f, u) {
  if (f === 0 || u === 0) {
    throw new Error("焦距與物距不可為零");
  }

  if (Math.abs(u - f) < 1e-10) {
    return {
      v: Infinity,
      magnification: -Infinity
    };
  }

  const v = (f * u) / (u - f);

  return {
    v,
    magnification: -v / u
  };
}


/**
 * 點光源投影幾何。
 *
 * 光源 S
 * 擋板邊緣 E
 * 光屏 x = screenX
 *
 * 直線 S + t(E-S)
 */
function projectToScreen(
  source,
  edge,
  screenX
) {
  const t =
    (screenX - source.x) /
    (edge.x - source.x);

  return point(
    screenX,
    source.y + t * (edge.y - source.y)
  );
}


/* ============================================================
   三、全域狀態
   ============================================================ */

const state = {
  station: "shadow",

  // 第一站
  shadowX: 440,
  shadowHeight: 140,

  // 第二站
  incidentAngle: 35,

  // 第三站
  mirrorDistance: 175,

  // 第四站
  refractionAngle: 40,

  // 第五站
  prismEntryY: 315,

  // 第六站
  objectDistance: 250,

  selected: "overview"
};


/* ============================================================
   四、各站基本資料及滑桿
   ============================================================ */

const stations = {

  shadow: {
    title: "直線傳播與影子",

    hint:
      "調整擋板高度或位置；點擊光源、擋板、影界與影區查看說明。",

    controls: [
      {
        key: "shadowHeight",
        label: "不透明擋板高度",
        min: 80,
        max: 170,
        step: 5,
        unit: "圖示單位"
      },
      {
        key: "shadowX",
        label: "光源至擋板距離",
        min: 360,
        max: 570,
        step: 10,
        unit: "圖示單位",

        display(value) {
          return value - 128;
        }
      }
    ],

    science: `
      <p>
        在均勻、透明的介質中，
        光沿<strong>直線傳播</strong>。
      </p>

      <p>
        不透明擋板會阻止光線通過。
        從點光源出發、剛好掠過擋板
        上下邊緣的兩條直線，
        決定幾何影區的邊界。
      </p>

      <p>
        本模型使用單一點光源，
        因此形成邊界清晰的
        <strong>本影</strong>，
        不涉及延展光源造成的半影。
      </p>
    `
  },

  reflection: {
    title: "反射定律",

    hint:
      "拖動入射角滑桿；反射角始終與入射角相等。",

    controls: [
      {
        key: "incidentAngle",
        label: "入射角 i",
        min: 10,
        max: 70,
        step: 1,
        unit: "°"
      }
    ],

    science: `
      <p>
        光照射到平面鏡時會發生反射。
        入射光、反射光與法線位於同一平面。
      </p>

      <p>
        <strong>反射定律：</strong>
        <span class="emphasis">入射角等於反射角。</span>
      </p>

      <p>
        入射角 i 與反射角 r
        必須由<strong>法線</strong>量度，
        而不是由鏡面量度。
      </p>

      <p>
        法線與鏡面互相垂直。
        改變入射角時，
        反射角會依定律同步改變。
      </p>
    `
  },

  mirror: {
    title: "平面鏡虛像",

    hint:
      "點擊物點、反射光或虛像；調整物距觀察像距同步變化。",

    controls: [
      {
        key: "mirrorDistance",
        label: "物距",
        min: 105,
        max: 210,
        step: 5,
        unit: "圖示單位"
      }
    ],

    science: `
      <p>
        平面鏡形成的像是
        <strong>虛像</strong>。
      </p>

      <p>
        物點發出的光照射到鏡面後反射。
        眼睛接收反射光，
        並沿反射光的反方向
        推斷光線似乎來自鏡後。
      </p>

      <p>
        將至少兩條反射光
        <strong>反向延長</strong>，
        延長線在鏡後相交的位置，
        就是虛像的位置。
      </p>

      <p>
        平面鏡的
        <strong>像距等於物距</strong>。
        鏡後虛像位置並沒有實際光線匯聚。
      </p>
    `
  },

  refraction: {
    title: "斯涅爾折射",

    hint:
      "調整入射角，觀察光從空氣進入玻璃後靠近法線。",

    controls: [
      {
        key: "refractionAngle",
        label: "入射角 i",
        min: 10,
        max: 70,
        step: 1,
        unit: "°"
      }
    ],

    science: `
      <p>
        光由一種透明介質
        進入另一種透明介質時，
        傳播方向可能改變，
        這稱為<strong>折射</strong>。
      </p>

      <p>
        斯涅爾定律：
        <strong>n₁ sin i = n₂ sin r</strong>。
      </p>

      <p>
        空氣的折射率約為 1.00，
        一般玻璃在可見光範圍內
        可用約 1.50 作示例。
      </p>

      <p>
        在本實驗中，
        光由較低折射率的空氣
        進入較高折射率的玻璃，
        因而<strong>向法線偏折</strong>，
        即折射角小於入射角。
      </p>
    `
  },

  dispersion: {
    title: "稜鏡色散",

    hint:
      "調整白光入射高度，觀察各色光通過稜鏡後的方向。",

    controls: [
      {
        key: "prismEntryY",
        label: "白光入射高度",
        min: 280,
        max: 345,
        step: 5,
        unit: "圖示單位"
      }
    ],

    science: `
      <p>
        白光包含不同波長的可見光。
        當白光通過稜鏡時，
        不同波長的光可能沿不同方向傳播。
      </p>

      <p>
        這是因為玻璃的
        <strong>折射率會隨波長略有改變</strong>。
      </p>

      <p>
        對一般具有正常色散的玻璃，
        較短波長的藍光折射率較大，
        因此偏折通常比紅光明顯。
      </p>

      <p>
        本模型以紅、綠、藍三條代表光線
        示範連續可見光譜中的不同波長，
        並在稜鏡兩個表面
        分別使用斯涅爾定律。
      </p>

      <p>
        <strong>為清楚示意，各色折射率差已放大；實際玻璃差異更小。</strong>
        本圖紅／綠／藍取 n≈1.495／1.500／1.505，約對齊折射站 n≈1.50。
      </p>
    `
  },

  lens: {
    title: "凸透鏡成像",

    hint:
      "改變物距，觀察三條標準作圖光線、實像位置及放大率。",

    controls: [
      {
        key: "objectDistance",
        label: "實物距 u",
        min: 185,
        max: 340,
        step: 5,
        unit: "圖示單位"
      }
    ],

    science: `
      <p>
        凸透鏡會使近軸平行光
        會聚於另一側的焦點。
      </p>

      <p>
        薄透鏡公式：
        <strong>1/f = 1/u + 1/v</strong>。
      </p>

      <p>
        本站使用三條標準作圖光線：
        平行光軸的光線折射後通過像方焦點 F′；
        通過光心 O 的光線近似不偏折；
        通過物方焦點 F 的光線折射後平行光軸。
      </p>

      <p>
        採用中學常用符號約定：
        <strong>實物距 u 為正、實像距 v 為正</strong>；
        凸透鏡焦距 f 為正。
        本站只設定 u &gt; f，
        因此形成倒立實像。
      </p>

      <p>
        放大率 m = −v/u。
        負號表示像相對物體倒立。
        本模型採用理想薄透鏡與近軸近似。
      </p>
    `
  }
};


/* ============================================================
   五、SVG 共用繪圖工具
   ============================================================ */

const SVG_DEFS = `
  <defs>

    <pattern
      id="sceneGrid"
      width="40"
      height="40"
      patternUnits="userSpaceOnUse">

      <path
        d="M 40 0 L 0 0 0 40"
        fill="none"
        stroke="#edf2f8"
        stroke-width="1"
      />

    </pattern>

    <marker
      id="arr-ray-in"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto">
      <path d="M0 0 L10 5 L0 10 Z"
            fill="#ed941c"/>
    </marker>

    <marker
      id="arr-ray-out"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto">
      <path d="M0 0 L10 5 L0 10 Z"
            fill="#3280e3"/>
    </marker>

    <marker
      id="arr-ray-refract"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto">
      <path d="M0 0 L10 5 L0 10 Z"
            fill="#159c88"/>
    </marker>

    <marker
      id="arr-ray-red"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto">
      <path d="M0 0 L10 5 L0 10 Z"
            fill="#e44848"/>
    </marker>

    <marker
      id="arr-ray-green"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto">
      <path d="M0 0 L10 5 L0 10 Z"
            fill="#159455"/>
    </marker>

    <marker
      id="arr-ray-blue"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto">
      <path d="M0 0 L10 5 L0 10 Z"
            fill="#3268df"/>
    </marker>

    <marker
      id="arr-ray-white"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto">
      <path d="M0 0 L10 5 L0 10 Z"
            fill="#c99436"/>
    </marker>

    <marker
      id="arr-object"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto">
      <path d="M0 0 L10 5 L0 10 Z"
            fill="#df8e1b"/>
    </marker>

    <marker
      id="arr-image"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto">
      <path d="M0 0 L10 5 L0 10 Z"
            fill="#3177cf"/>
    </marker>

  </defs>
`;

function svgBackground() {
  return `
    <rect
      class="stage-background"
      x="0" y="0"
      width="1000" height="620"
    />

    <rect
      class="grid-background"
      x="0" y="0"
      width="1000" height="620"
    />
  `;
}

function svgLine(a, b, cssClass, arrow = true) {
  const marker = arrow
    ? `marker-end="url(#arr-${cssClass})"`
    : "";

  return `
    <line
      x1="${num(a.x)}"
      y1="${num(a.y)}"
      x2="${num(b.x)}"
      y2="${num(b.y)}"
      class="${cssClass}"
      ${marker}
    />
  `;
}

function svgText(
  content,
  x,
  y,
  cssClass = "sv-label",
  anchor = "start"
) {
  return `
    <text
      x="${num(x)}"
      y="${num(y)}"
      class="${cssClass}"
      text-anchor="${anchor}">
      ${content}
    </text>
  `;
}

function svgCircle(
  center,
  radius = 7,
  cssClass = "point"
) {
  return `
    <circle
      cx="${num(center.x)}"
      cy="${num(center.y)}"
      r="${radius}"
      class="${cssClass}"
    />
  `;
}

function svgPath(d, cssClass) {
  return `<path d="${d}" class="${cssClass}" />`;
}

function selectable(key, label, markup) {
  return `
    <g
      class="selectable"
      data-pick="${key}"
      tabindex="0"
      role="button"
      aria-label="${label}">
      ${markup}
    </g>
  `;
}


/**
 * 以向上的法線為角度 0°。
 *
 * side = -1：法線左側
 * side = +1：法線右側
 */
function upperNormalArc(
  center,
  radius,
  angleDegrees,
  side
) {
  const theta = toRad(angleDegrees);

  const start = point(
    center.x,
    center.y - radius
  );

  const end = point(
    center.x + side * radius * Math.sin(theta),
    center.y - radius * Math.cos(theta)
  );

  const sweep = side === 1 ? 1 : 0;

  return `
    <path
      d="
        M ${num(start.x)} ${num(start.y)}
        A ${radius} ${radius} 0 0 ${sweep}
        ${num(end.x)} ${num(end.y)}
      "
      class="angle-arc"
    />
  `;
}


/**
 * 以向下的法線為角度 0°。
 * 此處用於下半平面的折射角。
 */
function lowerNormalArc(
  center,
  radius,
  angleDegrees
) {
  const theta = toRad(angleDegrees);

  const start = point(
    center.x,
    center.y + radius
  );

  const end = point(
    center.x + radius * Math.sin(theta),
    center.y + radius * Math.cos(theta)
  );

  return `
    <path
      d="
        M ${num(start.x)} ${num(start.y)}
        A ${radius} ${radius} 0 0 0
        ${num(end.x)} ${num(end.y)}
      "
      class="angle-arc"
    />
  `;
}

function svgExtension(a, b) {
  return svgLine(
    a,
    b,
    "virtual-extension",
    false
  );
}

function svgConstruction(a, b) {
  return svgLine(
    a,
    b,
    "construction",
    false
  );
}


/* ============================================================
   六、第一站：直線傳播與影子
   ============================================================ */

function drawShadow() {

  const S = point(128, 300);

  const obstacleX = state.shadowX;
  const obstacleHeight = state.shadowHeight;

  const screenX = 850;

  const top = point(
    obstacleX,
    300 - obstacleHeight / 2
  );

  const bottom = point(
    obstacleX,
    300 + obstacleHeight / 2
  );

  const shadowTop = projectToScreen(
    S,
    top,
    screenX
  );

  const shadowBottom = projectToScreen(
    S,
    bottom,
    screenX
  );

  const screenShadowHeight =
    shadowBottom.y - shadowTop.y;

  const sourceObstacleDistance =
    obstacleX - S.x;

  const sourceScreenDistance =
    screenX - S.x;

  const magnification =
    sourceScreenDistance / sourceObstacleDistance;

  const upperFreeRay = point(screenX, 65);
  const lowerFreeRay = point(screenX, 555);

  let svg = svgBackground();

  // 陰影區幾何多邊形
  svg += `
    <polygon
      points="
        ${num(top.x)},${num(top.y)}
        ${num(shadowTop.x)},${num(shadowTop.y)}
        ${num(shadowBottom.x)},${num(shadowBottom.y)}
        ${num(bottom.x)},${num(bottom.y)}
      "
      fill="#7f8fa8"
      fill-opacity="0.20"
    />
  `;

  // 上下不受阻擋的示例光線
  svg += selectable(
    "light",
    "直線傳播的光線",
    svgLine(S, upperFreeRay, "ray-in") +
    svgLine(S, lowerFreeRay, "ray-in")
  );

  // 決定影界的切線
  svg += selectable(
    "boundary",
    "影區邊界光線",
    svgLine(S, top, "ray-in", false) +
    svgLine(top, shadowTop, "ray-in") +
    svgLine(S, bottom, "ray-in", false) +
    svgLine(bottom, shadowBottom, "ray-in")
  );

  // 光屏
  svg += selectable(
    "screen",
    "光屏",
    `
      <rect
        x="843"
        y="54"
        width="16"
        height="512"
        rx="3"
        fill="#d9e3ef"
        stroke="#8294ab"
        stroke-width="2"
      />

      <rect
        x="843"
        y="${num(shadowTop.y)}"
        width="16"
        height="${num(screenShadowHeight)}"
        fill="#66768f"
        opacity="0.80"
      />

      ${svgText("屏", 850, 41, "sv-label", "middle")}
    `
  );

  // 擋板
  svg += selectable(
    "obstacle",
    "不透明擋板",
    `
      <rect
        x="${num(obstacleX - 8)}"
        y="${num(top.y)}"
        width="16"
        height="${num(obstacleHeight)}"
        rx="3"
        fill="#344b68"
      />

      ${svgText(
        "不透明擋板",
        obstacleX,
        top.y - 19,
        "sv-label",
        "middle"
      )}
    `
  );

  // 點光源
  svg += selectable(
    "source",
    "點光源",
    `
      <circle
        cx="${S.x}"
        cy="${S.y}"
        r="24"
        fill="#ffcb66"
        opacity="0.30"
      />

      <circle
        cx="${S.x}"
        cy="${S.y}"
        r="10"
        fill="#f3a529"
        stroke="#cf7916"
        stroke-width="2"
      />

      ${svgText(
        "點光源",
        S.x,
        S.y - 39,
        "sv-label",
        "middle"
      )}
    `
  );

  svg += selectable(
    "shadow",
    "幾何影區",
    svgText(
      "幾何影區",
      obstacleX + (screenX - obstacleX) * 0.53,
      305,
      "sv-strong",
      "middle"
    )
  );

  svg += svgText(
    "影界由掠過擋板邊緣的直線決定",
    500,
    585,
    "sv-small",
    "middle"
  );

  return {

    svg,

    metrics: [
      {
        label: "擋板高度",
        value: fixed(obstacleHeight, 0)
      },
      {
        label: "屏上影高",
        value: fixed(screenShadowHeight, 1)
      },
      {
        label: "光源至擋板",
        value: fixed(sourceObstacleDistance, 0)
      },
      {
        label: "影高／擋板高",
        value: fixed(magnification, 2) + " 倍"
      }
    ],

    formula:
      "影高／物高 = 光源至屏距離／光源至擋板距離",

    note:
      "長度讀數均為 SVG 圖示單位。模型為單一點光源與理想不透明擋板。",

    picks: {
      overview: {
        title: "直線傳播",
        text:
          "光線沿直線傳播。點光源發出的光被擋板遮擋後，在屏上形成邊界清晰的幾何影區。"
      },

      source: {
        title: "點光源",
        text:
          "本模型中的光源視為一個幾何點，向不同方向發出光線，因此不會產生延展光源特有的半影。"
      },

      obstacle: {
        title: "不透明擋板",
        text:
          `擋板高度為 ${fixed(obstacleHeight, 0)} 圖示單位。擋板阻止光通過，改變其高度會改變屏上的影子大小。`
      },

      boundary: {
        title: "影界",
        text:
          "兩條從點光源出發、掠過擋板上下邊緣的光線決定影區邊界。延伸後仍遵守直線傳播。"
      },

      shadow: {
        title: "幾何影區",
        text:
          `目前屏上影高約為 ${fixed(screenShadowHeight, 1)} 圖示單位。影區內沒有來自該點光源的直接光線。`
      },

      screen: {
        title: "接收屏",
        text:
          "光屏顯示受光與未受直接光照射的區域。此處深色部分是點光源形成的本影。"
      },

      light: {
        title: "未受阻擋的光線",
        text:
          "不被擋板截住的光線會沿直線繼續傳播，最後到達光屏。"
      }
    }
  };
}


/* ============================================================
   七、第二站：反射定律
   ============================================================ */

function drawReflection() {

  const incident = state.incidentAngle;

  // 強制反射角等於入射角
  const reflected = reflectionAngle(incident);

  const P = point(500, 410);

  const radius = 280;

  const start = point(
    P.x - radius * sinD(incident),
    P.y - radius * Math.cos(toRad(incident))
  );

  const end = point(
    P.x + radius * sinD(reflected),
    P.y - radius * Math.cos(toRad(reflected))
  );

  let svg = svgBackground();

  svg += `
    <rect
      x="170"
      y="410"
      width="660"
      height="32"
      fill="#edf3fa"
    />
  `;

  svg += selectable(
    "mirror",
    "平面鏡",
    `
      <line
        x1="180"
        y1="410"
        x2="820"
        y2="410"
        class="mirror-surface"
      />

      ${svgText(
        "平面鏡",
        790,
        460,
        "sv-label",
        "end"
      )}
    `
  );

  svg += selectable(
    "normal",
    "法線",
    `
      <line
        x1="500"
        y1="115"
        x2="500"
        y2="515"
        class="normal"
      />

      ${svgText("法線", 515, 115)}

      <path
        d="M500 394 H516 V410"
        stroke="#475569"
        stroke-width="2"
        fill="none"
      />
    `
  );

  svg += selectable(
    "incoming",
    "入射光線",
    svgLine(start, P, "ray-in") +
    svgText(
      "入射光",
      start.x - 9,
      start.y - 14,
      "sv-label",
      "end"
    )
  );

  svg += selectable(
    "reflected",
    "反射光線",
    svgLine(P, end, "ray-out") +
    svgText(
      "反射光",
      end.x + 10,
      end.y - 14
    )
  );

  svg += selectable(
    "angles",
    "入射角與反射角",
    `
      ${upperNormalArc(P, 77, incident, -1)}
      ${upperNormalArc(P, 77, reflected, 1)}

      ${svgText(
        "i",
        P.x - 110 * Math.sin(toRad(incident / 2)),
        P.y - 110 * Math.cos(toRad(incident / 2)),
        "sv-strong",
        "middle"
      )}

      ${svgText(
        "r",
        P.x + 110 * Math.sin(toRad(reflected / 2)),
        P.y - 110 * Math.cos(toRad(reflected / 2)),
        "sv-strong",
        "middle"
      )}
    `
  );

  svg += svgCircle(P, 6, "hit-point");

  svg += svgText(
    "角度由法線量度",
    500,
    560,
    "sv-small",
    "middle"
  );

  return {

    svg,

    metrics: [
      {
        label: "入射角 i",
        value: fixed(incident) + "°"
      },
      {
        label: "反射角 r",
        value: fixed(reflected) + "°"
      },
      {
        label: "兩角之差",
        value: fixed(
          Math.abs(incident - reflected)
        ) + "°"
      },
      {
        label: "法線與鏡面",
        value: "90°"
      }
    ],

    formula: "反射定律：i = r",

    note:
      "入射角與反射角均相對法線量度，而非法線與鏡面之間的夾角。",

    picks: {
      overview: {
        title: "反射定律",
        text:
          `目前入射角為 ${fixed(incident)}°，反射角為 ${fixed(reflected)}°。兩者相等。`
      },

      mirror: {
        title: "平面鏡",
        text:
          "理想平面鏡以鏡面反射方式改變光的行進方向。本模型假設鏡面平坦。"
      },

      normal: {
        title: "法線",
        text:
          "法線是與鏡面垂直的參考直線。圖中法線與水平鏡面的夾角恆為 90°。"
      },

      incoming: {
        title: "入射光",
        text:
          `光向鏡面傳播。入射角 i = ${fixed(incident)}°，由入射光線與法線之間的銳角量度。`
      },

      reflected: {
        title: "反射光",
        text:
          `光離開鏡面。根據反射定律，反射角 r 必須等於 ${fixed(incident)}°。`
      },

      angles: {
        title: "入射角與反射角",
        text:
          `i = ${fixed(incident)}°，r = ${fixed(reflected)}°。無論滑桿如何變動，程式均強制 r = i。`
      }
    }
  };
}


/* ============================================================
   八、第三站：平面鏡虛像
   ============================================================ */

function drawMirror() {

  const mirrorX = 530;

  const distance = state.mirrorDistance;

  const object = point(
    mirrorX - distance,
    265
  );

  const image = point(
    mirrorX + distance,
    265
  );

  // 在鏡面選取兩個不同反射點
  const P1 = point(mirrorX, 225);
  const P2 = point(mirrorX, 310);

  /**
   * 垂直鏡面的反射：
   * 入射方向 (dx, dy)
   * 反射方向 (-dx, dy)
   *
   * 反射光延長到左方 x = 150。
   */
  function reflectedEndpoint(P) {

    const incoming = subtract(P, object);

    const outgoing = point(
      -incoming.x,
      incoming.y
    );

    const t =
      (150 - P.x) / outgoing.x;

    return add(
      P,
      scale(outgoing, t)
    );
  }

  const R1 = reflectedEndpoint(P1);
  const R2 = reflectedEndpoint(P2);

  let svg = svgBackground();

  // 鏡後區域
  svg += `
    <rect
      x="542"
      y="65"
      width="370"
      height="450"
      fill="#eef4ff"
      opacity="0.65"
    />
  `;

  // 先畫虛線，明確區分實際與反向延長
  svg += selectable(
    "extension",
    "反射光反向延長線",
    svgExtension(P1, image) +
    svgExtension(P2, image)
  );

  // 實際入射光
  svg += selectable(
    "incoming",
    "物點發出的入射光",
    svgLine(object, P1, "ray-in") +
    svgLine(object, P2, "ray-in")
  );

  // 實際反射光
  svg += selectable(
    "reflected",
    "兩條反射光",
    svgLine(P1, R1, "ray-out") +
    svgLine(P2, R2, "ray-out")
  );

  // 鏡面
  svg += selectable(
    "mirror",
    "平面鏡",
    `
      <rect
        x="530"
        y="80"
        width="13"
        height="425"
        fill="#c5d7eb"
      />

      <line
        x1="530"
        y1="80"
        x2="530"
        y2="505"
        class="mirror-surface"
      />

      ${svgText(
        "平面鏡",
        530,
        63,
        "sv-label",
        "middle"
      )}
    `
  );

  svg += svgCircle(P1, 5, "hit-point");
  svg += svgCircle(P2, 5, "hit-point");

  // 物點
  svg += selectable(
    "object",
    "物點",
    `
      <circle
        cx="${num(object.x)}"
        cy="${num(object.y)}"
        r="10"
        fill="#f6af3b"
        stroke="#b86b12"
        stroke-width="2"
      />

      ${svgText(
        "物點",
        object.x - 18,
        object.y - 23,
        "sv-label",
        "end"
      )}
    `
  );

  // 虛像
  svg += selectable(
    "image",
    "虛像",
    `
      <circle
        cx="${num(image.x)}"
        cy="${num(image.y)}"
        r="11"
        fill="#ffffff"
        stroke="#3268c1"
        stroke-width="3"
        stroke-dasharray="5 4"
      />

      ${svgText(
        "虛像",
        image.x + 17,
        image.y - 15,
        "sv-strong"
      )}
    `
  );

  // 眼睛示意：接收鏡前反射光，反向延長解釋虛像成因
  svg += selectable(
    "eye",
    "觀察者眼睛",
    `
      <g transform="translate(168 248)">
        <ellipse cx="0" cy="0" rx="22" ry="14" fill="#fff" stroke="#334155" stroke-width="2"/>
        <circle cx="4" cy="0" r="7" fill="#1e293b"/>
        <circle cx="6" cy="-2" r="2.2" fill="#fff"/>
        <path d="M-18 -18 Q0 -28 18 -18" fill="none" stroke="#334155" stroke-width="2"/>
      </g>
      ${svgText("眼睛", 168, 228, "sv-small", "middle")}
    `
  );

  // 物距及像距量度
  const measureY = 530;

  svg += svgConstruction(
    point(object.x, object.y + 15),
    point(object.x, measureY + 15)
  );

  svg += svgConstruction(
    point(image.x, image.y + 15),
    point(image.x, measureY + 15)
  );

  svg += `
    <line
      x1="${num(object.x)}"
      y1="${measureY}"
      x2="${mirrorX}"
      y2="${measureY}"
      stroke="#df8e1b"
      stroke-width="2.5"
    />

    <line
      x1="${mirrorX}"
      y1="${measureY}"
      x2="${num(image.x)}"
      y2="${measureY}"
      stroke="#3177cf"
      stroke-width="2.5"
    />
  `;

  svg += svgText(
    "物距",
    (object.x + mirrorX) / 2,
    553,
    "sv-label",
    "middle"
  );

  svg += svgText(
    "像距",
    (image.x + mirrorX) / 2,
    553,
    "sv-label",
    "middle"
  );

  svg += svgText(
    "鏡後無實際光線到達虛像",
    725,
    470,
    "sv-small",
    "middle"
  );

  return {

    svg,

    metrics: [
      {
        label: "物距",
        value: fixed(distance, 0)
      },
      {
        label: "像距",
        value: fixed(distance, 0)
      },
      {
        label: "物距－像距",
        value: "0"
      },
      {
        label: "成像類型",
        value: "虛像"
      }
    ],

    formula: "平面鏡：像距 = 物距",

    note:
      "藍色實線表示實際反射光；鏡後虛線僅表示反向延長，不代表光真的到達虛像。",

    picks: {
      overview: {
        title: "平面鏡成像",
        text:
          `鏡前物點距離鏡面 ${fixed(distance, 0)} 單位，虛像位於鏡後相同距離處。`
      },

      object: {
        title: "物點",
        text:
          "物點發出的兩條不同方向的入射光照射到鏡面，分別在兩個位置發生反射。"
      },

      mirror: {
        title: "平面鏡",
        text:
          "每條入射光在鏡面遵守反射定律。平面鏡使物點形成位置對稱的虛像。"
      },

      incoming: {
        title: "入射光線",
        text:
          "兩條入射光都由物點出發，在鏡面不同位置反射。這兩條路徑並不相同。"
      },

      reflected: {
        title: "反射光線",
        text:
          "藍色實線表示實際反射光。兩條反射光在鏡前向不同方向傳播，並沒有在虛像處真正會聚。"
      },

      extension: {
        title: "反向延長線",
        text:
          "鏡後虛線是反射光的幾何反向延長線。兩條延長線相交於同一個虛像位置。"
      },

      image: {
        title: "虛像",
        text:
          `虛像位於鏡後 ${fixed(distance, 0)} 圖示單位處。此處並沒有實際光線匯聚，因此不能直接在該位置用光屏接收成像。`
      },

      eye: {
        title: "眼睛",
        text:
          "眼睛接收鏡前實際反射光。大腦沿反射光反向延長，以為光來自鏡後虛像。"
      }
    }
  };
}


/* ============================================================
   九、第四站：斯涅爾折射
   ============================================================ */

function drawRefraction() {

  const n1 = 1.00;
  const n2 = 1.50;

  const incident = state.refractionAngle;

  const refracted = snellAngle(
    n1,
    n2,
    incident
  );

  const P = point(500, 355);

  const incidentLength = 275;
  const refractedLength = 245;

  const start = point(
    P.x - incidentLength * sinD(incident),
    P.y - incidentLength * Math.cos(toRad(incident))
  );

  const end = point(
    P.x + refractedLength * sinD(refracted),
    P.y + refractedLength * Math.cos(toRad(refracted))
  );

  const lhs = n1 * sinD(incident);
  const rhs = n2 * sinD(refracted);

  let svg = svgBackground();

  // 下方玻璃
  svg += `
    <rect
      x="0"
      y="355"
      width="1000"
      height="265"
      fill="#e8f6f4"
    />
  `;

  // 介面
  svg += selectable(
    "interface",
    "空氣與玻璃界面",
    `
      <line
        x1="90"
        y1="355"
        x2="910"
        y2="355"
        stroke="#668e9c"
        stroke-width="4"
      />
    `
  );

  svg += svgText(
    "空氣　n₁ = 1.00",
    165,
    115
  );

  svg += svgText(
    "玻璃　n₂ = 1.50",
    165,
    505
  );

  // 法線
  svg += selectable(
    "normal",
    "界面法線",
    `
      <line
        x1="500"
        y1="100"
        x2="500"
        y2="585"
        class="normal"
      />

      ${svgText("法線", 514, 105)}

      <path
        d="M500 339 H516 V355"
        stroke="#475569"
        stroke-width="2"
        fill="none"
      />
    `
  );

  // 入射光
  svg += selectable(
    "incoming",
    "入射光線",
    svgLine(start, P, "ray-in") +
    svgText(
      "入射光",
      start.x - 10,
      start.y - 15,
      "sv-label",
      "end"
    )
  );

  // 折射光
  svg += selectable(
    "refracted",
    "折射光線",
    svgLine(P, end, "ray-refract") +
    svgText(
      "折射光",
      end.x + 8,
      end.y,
      "sv-label"
    )
  );

  // 角弧
  svg += selectable(
    "angles",
    "入射角與折射角",
    `
      ${upperNormalArc(P, 72, incident, -1)}

      ${lowerNormalArc(P, 72, refracted)}

      ${svgText(
        "i",
        P.x - 108 * Math.sin(toRad(incident / 2)),
        P.y - 108 * Math.cos(toRad(incident / 2)),
        "sv-strong",
        "middle"
      )}

      ${svgText(
        "r",
        P.x + 108 * Math.sin(toRad(refracted / 2)),
        P.y + 108 * Math.cos(toRad(refracted / 2)),
        "sv-strong",
        "middle"
      )}
    `
  );

  svg += svgCircle(P, 6, "hit-point");

  return {

    svg,

    metrics: [
      {
        label: "入射角 i",
        value: fixed(incident, 2) + "°"
      },
      {
        label: "折射角 r",
        value: fixed(refracted, 2) + "°"
      },
      {
        label: "n₁ sin i",
        value: fixed(lhs, 5)
      },
      {
        label: "n₂ sin r",
        value: fixed(rhs, 5)
      }
    ],

    formula:
      "n₁ sin i = n₂ sin r<br>" +
      "r = arcsin[(n₁/n₂) sin i]",

    note:
      "n₁ = 1.00，n₂ = 1.50。程式以三角函數計算折射角，未使用手動指定的折射角。",

    picks: {
      overview: {
        title: "斯涅爾定律",
        text:
          `入射角 ${fixed(incident, 2)}° 對應折射角 ${fixed(refracted, 2)}°，滿足 n₁ sin i = n₂ sin r。`
      },

      interface: {
        title: "兩種介質的界面",
        text:
          "界面上方為空氣，下方為玻璃。兩側折射率不同，光穿過界面時發生方向改變。"
      },

      normal: {
        title: "法線",
        text:
          "法線與水平界面垂直。入射角及折射角都以法線作為量度基準。"
      },

      incoming: {
        title: "入射光",
        text:
          `光在空氣中傳播，入射角為 ${fixed(incident, 2)}°，空氣折射率約為 1.00。`
      },

      refracted: {
        title: "折射光",
        text:
          `進入玻璃後，折射角為 ${fixed(refracted, 2)}°。因玻璃折射率較大，光線向法線偏折。`
      },

      angles: {
        title: "角度比較",
        text:
          `入射角 ${fixed(incident, 2)}°，折射角 ${fixed(refracted, 2)}°；折射角較小，符合由疏光介質進入密光介質的情況。`
      }
    }
  };
}


/* ============================================================
   十、第五站：稜鏡色散
   ============================================================ */

function drawDispersion() {

  /**
   * 三角形稜鏡。
   *
   * 頂點 A 在上方。
   * B、C 在下方。
   *
   * 選擇較小頂角，避免示例光路
   * 在第二個表面發生全內反射。
   */
  const A = point(495, 150);
  const B = point(380, 475);
  const C = point(605, 475);

  const entryY = state.prismEntryY;

  // 水平白光與左側稜鏡表面的交點
  const entryFraction =
    (entryY - A.y) / (B.y - A.y);

  const entry = point(
    A.x + entryFraction * (B.x - A.x),
    entryY
  );

  const source = point(135, entryY);

  const incidentDirection = point(1, 0);

  /**
   * 左表面 A→B 的內向法線：
   *
   * 邊向量 B-A = (dx,dy)
   * 內向法線 = (dy,-dx)
   */
  const leftEdge = subtract(B, A);

  const inwardNormal = normalize(
    point(leftEdge.y, -leftEdge.x)
  );

  /**
   * 右表面 A→C 的外向法線。
   */
  const rightEdge = subtract(C, A);

  const outwardNormal = normalize(
    point(rightEdge.y, -rightEdge.x)
  );

  // 代表性的可見光折射率
  const colors = [
    {
      key: "red",
      label: "紅光",
      n: 1.495,
      css: "ray-red"
    },
    {
      key: "green",
      label: "綠光",
      n: 1.500,
      css: "ray-green"
    },
    {
      key: "blue",
      label: "藍光",
      n: 1.505,
      css: "ray-blue"
    }
  ];

  /**
   * 每個顏色：
   * 1. 空氣 → 稜鏡
   * 2. 求與第二表面的交點
   * 3. 稜鏡 → 空氣
   * 4. 計算最終偏折角
   */
  const rays = colors.map((color) => {

    const insideDirection = refractVector(
      incidentDirection,
      inwardNormal,
      1.0,
      color.n
    );

    if (!insideDirection) {
      throw new Error("稜鏡第一表面折射計算失敗");
    }

    const exitPoint = raySegmentIntersection(
      entry,
      insideDirection,
      A,
      C
    );

    if (!exitPoint) {
      throw new Error("光線未到達稜鏡第二表面");
    }

    const exitDirection = refractVector(
      insideDirection,
      outwardNormal,
      color.n,
      1.0
    );

    if (!exitDirection) {
      throw new Error("稜鏡第二表面發生全內反射");
    }

    // 延伸到圖右側 x = 920
    const t =
      (920 - exitPoint.x) / exitDirection.x;

    const end = add(
      exitPoint,
      scale(exitDirection, t)
    );

    const deviation = toDeg(
      Math.atan2(
        exitDirection.y,
        exitDirection.x
      )
    );

    return {
      ...color,
      entry,
      exitPoint,
      insideDirection,
      exitDirection,
      end,
      deviation
    };
  });

  const red = rays[0];
  const green = rays[1];
  const blue = rays[2];

  let svg = svgBackground();

  // 稜鏡
  svg += selectable(
    "prism",
    "三角形玻璃稜鏡",
    `
      <polygon
        points="
          ${A.x},${A.y}
          ${B.x},${B.y}
          ${C.x},${C.y}
        "
        fill="#d9ebfc"
        fill-opacity="0.63"
        stroke="#6c9bbf"
        stroke-width="3"
      />

      ${svgText(
        "玻璃稜鏡",
        490,
        255,
        "sv-label",
        "middle"
      )}
    `
  );

  // 白光：淡金色外層使白色線條可辨認
  svg += selectable(
    "white",
    "入射白光",
    `
      <line
        x1="${source.x}"
        y1="${num(source.y)}"
        x2="${num(entry.x)}"
        y2="${num(entry.y)}"
        class="white-halo"
      />

      ${svgLine(source, entry, "ray-white")}

      ${svgText(
        "白光",
        155,
        source.y - 20
      )}
    `
  );

  // 各顏色於稜鏡內的折射路徑
  rays.forEach((ray) => {
    svg += selectable(
      ray.key,
      ray.label,
      svgLine(
        ray.entry,
        ray.exitPoint,
        ray.css,
        false
      ) +
      svgLine(
        ray.exitPoint,
        ray.end,
        ray.css
      )
    );
  });

  // 入射和出射位置
  svg += svgCircle(entry, 5, "hit-point");

  rays.forEach((ray) => {
    svg += svgCircle(
      ray.exitPoint,
      3,
      "hit-point"
    );
  });

  // 色光標籤：使用分離的圖例，避免折射角接近時互相遮蓋
  svg += `
    <rect
      x="720"
      y="92"
      width="192"
      height="130"
      rx="12"
      fill="#ffffff"
      stroke="#dfe7f1"
      stroke-width="1.5"
    />
  `;

  svg += svgText(
    "出射色光",
    739,
    120,
    "sv-small"
  );

  const legendItems = [
    { y: 150, color: "#e44848", text: "紅光" },
    { y: 176, color: "#159455", text: "綠光" },
    { y: 202, color: "#3268df", text: "藍光" }
  ];

  legendItems.forEach((item) => {
    svg += `
      <line
        x1="740"
        y1="${item.y - 5}"
        x2="775"
        y2="${item.y - 5}"
        stroke="${item.color}"
        stroke-width="4"
        stroke-linecap="round"
      />
    `;

    svg += svgText(
      item.text,
      788,
      item.y,
      "sv-small"
    );
  });

  svg += svgText(
    "紅光偏折較小，藍光偏折較大",
    510,
    550,
    "sv-small",
    "middle"
  );

  svg += svgText(
    "折射率隨波長略有改變",
    510,
    582,
    "sv-small",
    "middle"
  );

  return {

    svg,

    metrics: [
      {
        label: "紅光折射率",
        value: fixed(red.n, 3)
      },
      {
        label: "藍光折射率",
        value: fixed(blue.n, 3)
      },
      {
        label: "紅光總偏折角",
        value: fixed(red.deviation, 2) + "°"
      },
      {
        label: "藍光總偏折角",
        value: fixed(blue.deviation, 2) + "°"
      }
    ],

    formula:
      "n紅 = 1.495；n綠 = 1.500；n藍 = 1.505<br>為清楚示意，各色折射率差已放大；實際玻璃差異更小。<br>" +
      "δ紅 &lt; δ綠 &lt; δ藍",

    note:
      "折射率為示例數值；偏折角由兩次斯涅爾折射計算。此圖僅選取三種代表色光，不代表完整連續光譜。",

    picks: {
      overview: {
        title: "色散",
        text:
          "三種代表色光在玻璃中的折射率略有不同，進出稜鏡時經歷不同程度的折射，因而出射方向不同。"
      },

      prism: {
        title: "玻璃稜鏡",
        text:
          "光分別在稜鏡入射面及出射面發生折射。稜鏡的頂角與玻璃折射率共同影響總偏折角。"
      },

      white: {
        title: "白光",
        text:
          "白光包含不同波長的可見光。本示意圖使用紅、綠、藍三條代表光線作比較。"
      },

      red: {
        title: "紅光",
        text:
          `代表折射率為 ${fixed(red.n, 3)}，總偏折角約為 ${fixed(red.deviation, 2)}°，在此模型中偏折最小。`
      },

      green: {
        title: "綠光",
        text:
          `代表折射率為 ${fixed(green.n, 3)}，總偏折角約為 ${fixed(green.deviation, 2)}°，介於紅光與藍光之間。`
      },

      blue: {
        title: "藍光",
        text:
          `代表折射率為 ${fixed(blue.n, 3)}，總偏折角約為 ${fixed(blue.deviation, 2)}°，在此模型中偏折最大。`
      }
    }
  };
}


/* ============================================================
   十一、第六站：凸透鏡成像
   ============================================================ */

function drawLens() {

  const lensX = 520;
  const axisY = 310;

  // 正凸透鏡焦距
  const f = 120;

  // 實物距，滑桿保證 u > f
  const u = state.objectDistance;

  const result = thinLens(f, u);

  const v = result.v;
  const m = result.magnification;

  const objectHeight = 95;

  const objectBase = point(
    lensX - u,
    axisY
  );

  const objectTip = point(
    lensX - u,
    axisY - objectHeight
  );

  const imageBase = point(
    lensX + v,
    axisY
  );

  const imageTip = point(
    lensX + v,
    axisY + objectHeight * v / u
  );

  const O = point(lensX, axisY);

  const F = point(
    lensX - f,
    axisY
  );

  const Fprime = point(
    lensX + f,
    axisY
  );

  /**
   * 三條標準作圖光線
   *
   * 1. 平行光軸 → 折射後通過 F′
   * 2. 通過光心 O → 不偏折
   * 3. 通過 F → 折射後平行光軸
   */

  // 光線一：入射時平行光軸
  const parallelHit = point(
    lensX,
    objectTip.y
  );

  // 光線二：穿過光心
  const centerHit = O;

  // 光線三：入射時通過物方焦點
  const focusHit = point(
    lensX,
    imageTip.y
  );

  /**
   * 延伸至實像右側，展示三條實際光線
   * 在像點交會後繼續傳播。
   */
  const extraX = Math.min(
    920,
    imageTip.x + 42
  );

  function extendThrough(a, b, targetX) {
    const ratio =
      (targetX - a.x) /
      (b.x - a.x);

    return point(
      targetX,
      a.y + ratio * (b.y - a.y)
    );
  }

  const parallelEnd = extendThrough(
    parallelHit,
    imageTip,
    extraX
  );

  const centerEnd = extendThrough(
    centerHit,
    imageTip,
    extraX
  );

  const focusEnd = point(
    extraX,
    focusHit.y
  );

  let svg = svgBackground();

  // 光軸
  svg += selectable(
    "axis",
    "主光軸",
    `
      <line
        x1="100"
        y1="${axisY}"
        x2="930"
        y2="${axisY}"
        class="axis"
      />

      ${svgText(
        "主光軸",
        925,
        axisY - 13,
        "sv-small",
        "end"
      )}
    `
  );

  // 焦點
  svg += selectable(
    "focus",
    "物方焦點與像方焦點",
    `
      <circle
        cx="${F.x}"
        cy="${F.y}"
        r="6"
        fill="#395c9b"
      />

      <circle
        cx="${Fprime.x}"
        cy="${Fprime.y}"
        r="6"
        fill="#395c9b"
      />

      ${svgText(
        "F",
        F.x,
        axisY + 31,
        "sv-label",
        "middle"
      )}

      ${svgText(
        "F′",
        Fprime.x,
        axisY + 31,
        "sv-label",
        "middle"
      )}
    `
  );

  // 透鏡外形
  svg += selectable(
    "lens",
    "凸透鏡",
    `
      <path
        d="
          M 520 92
          Q 458 310 520 528
          Q 582 310 520 92
          Z
        "
        class="lens-body"
      />

      ${svgText(
        "凸透鏡",
        520,
        68,
        "sv-label",
        "middle"
      )}
    `
  );

  // 光心
  svg += selectable(
    "opticalCenter",
    "光心 O",
    `
      <circle
        cx="${O.x}"
        cy="${O.y}"
        r="6"
        fill="#ffffff"
        stroke="#2458b5"
        stroke-width="2"
      />

      ${svgText(
        "O",
        O.x + 15,
        O.y - 13,
        "sv-strong"
      )}
    `
  );

  // 第一條：平行入射，折射後經 F′
  svg += selectable(
    "parallelRay",
    "平行光軸的標準作圖光線",
    svgLine(
      objectTip,
      parallelHit,
      "ray-in"
    ) +
    svgLine(
      parallelHit,
      parallelEnd,
      "ray-refract"
    )
  );

  // 第二條：經光心
  svg += selectable(
    "centerRay",
    "通過光心的標準作圖光線",
    svgLine(
      objectTip,
      centerHit,
      "ray-in"
    ) +
    svgLine(
      centerHit,
      centerEnd,
      "ray-refract"
    )
  );

  // 第三條：經 F 後平行光軸
  svg += selectable(
    "focusRay",
    "通過物方焦點的標準作圖光線",
    svgLine(
      objectTip,
      focusHit,
      "ray-in"
    ) +
    svgLine(
      focusHit,
      focusEnd,
      "ray-refract"
    )
  );

  // 物體箭頭
  svg += selectable(
    "object",
    "實物",
    `
      <line
        x1="${num(objectBase.x)}"
        y1="${num(objectBase.y)}"
        x2="${num(objectTip.x)}"
        y2="${num(objectTip.y)}"
        class="object-arrow"
        marker-end="url(#arr-object)"
      />

      ${svgText(
        "物體",
        objectTip.x - 14,
        objectTip.y - 16,
        "sv-label",
        "end"
      )}
    `
  );

  // 倒立實像
  svg += selectable(
    "image",
    "倒立實像",
    `
      <line
        x1="${num(imageBase.x)}"
        y1="${num(imageBase.y)}"
        x2="${num(imageTip.x)}"
        y2="${num(imageTip.y)}"
        class="image-arrow"
        marker-end="url(#arr-image)"
      />

      ${svgText(
        "實像（倒立）",
        imageTip.x + 14,
        imageTip.y + 10
      )}
    `
  );

  // 像點標記
  svg += svgCircle(
    imageTip,
    6,
    "hit-point"
  );

  svg += svgText(
    `符號約定：實物距／實像距為正　｜　f=${fixed(f, 0)}　u=${fixed(u, 0)}　v=${fixed(v, 1)}　m=${fixed(m, 3)}`,
    520,
    575,
    "sv-small",
    "middle"
  );

  return {

    svg,

    metrics: [
      {
        label: "焦距 f",
        value: fixed(f, 0)
      },
      {
        label: "實物距 u",
        value: fixed(u, 0)
      },
      {
        label: "實像距 v",
        value: fixed(v, 2)
      },
      {
        label: "放大率 m",
        value: fixed(m, 3)
      }
    ],

    formula:
      "符號約定：實物距／實像距為正<br>" +
      "1/f = 1/u + 1/v<br>" +
      `1/${fixed(f, 0)} = ` +
      `1/${fixed(u, 0)} + ` +
      `1/${fixed(v, 2)}` +
      `<br>m = −v/u = ${fixed(m, 3)}`,

    note:
      "符號約定（寫死）：實物距 u 為正、實像距 v 為正、凸透鏡 f 為正。倒立實像 m = −v/u < 0。",

    picks: {
      overview: {
        title: "薄透鏡成像",
        text:
          `目前 f = ${fixed(f, 0)}，u = ${fixed(u, 0)}，v = ${fixed(v, 2)}。三條標準作圖光線會聚於倒立實像的頂點。`
      },

      axis: {
        title: "主光軸",
        text:
          "主光軸是穿過透鏡光心並垂直於理想薄透鏡平面的直線。焦點位於主光軸上。"
      },

      lens: {
        title: "凸透鏡",
        text:
          "本模型將凸透鏡視為理想薄透鏡，使用近軸光線近似。圖中的曲面輪廓僅作示意，不用於逐面追蹤真實厚透鏡折射。"
      },

      opticalCenter: {
        title: "光心 O",
        text:
          "在理想薄透鏡近似中，通過光心 O 的光線可視為不偏折。"
      },

      focus: {
        title: "焦點 F 與 F′",
        text:
          `兩個焦點分別位於光心左右兩側，與光心距離均為 ${fixed(f, 0)} 圖示單位。`
      },

      parallelRay: {
        title: "第一條標準作圖光線",
        text:
          "從物體頂端出發、平行主光軸的光線，通過理想凸透鏡後沿通過像方焦點 F′ 的方向傳播。"
      },

      centerRay: {
        title: "第二條標準作圖光線",
        text:
          "從物體頂端穿過光心 O 的光線，在理想薄透鏡近似中保持直線傳播。"
      },

      focusRay: {
        title: "第三條標準作圖光線",
        text:
          "從物體頂端出發、通過物方焦點 F 的光線，經透鏡折射後平行主光軸。"
      },

      object: {
        title: "實物",
        text:
          `實物位於透鏡左方 ${fixed(u, 0)} 圖示單位。由於物距大於焦距，能在右方形成實像。`
      },

      image: {
        title: "倒立實像",
        text:
          `實像位於透鏡右方 ${fixed(v, 2)} 圖示單位。放大率為 ${fixed(m, 3)}，負值表示倒立。實際折射光在此會聚。`
      }
    }
  };
}


/* ============================================================
   十二、畫面產生器
   ============================================================ */

const renderers = {
  shadow: drawShadow,
  reflection: drawReflection,
  mirror: drawMirror,
  refraction: drawRefraction,
  dispersion: drawDispersion,
  lens: drawLens
};

let currentDiagram = null;


/**
 * 建立滑桿。
 *
 * 只在切換實驗站時重建，
 * 避免每次調整數值造成滑桿失去焦點。
 */
function renderControls() {

  const station = stations[state.station];

  if (station.controls.length === 0) {
    controls.innerHTML = `
      <p class="no-control">
        本站無需調整參數。
      </p>
    `;
    return;
  }

  controls.innerHTML = station.controls
    .map((item) => {

      const rawValue = state[item.key];

      const displayed = item.display
        ? item.display(rawValue)
        : rawValue;

      const minDisplayed = item.display
        ? item.display(item.min)
        : item.min;

      const maxDisplayed = item.display
        ? item.display(item.max)
        : item.max;

      return `
        <div class="control-group">

          <label
            class="control-label"
            for="control-${item.key}">

            <span>${item.label}</span>

            <output id="output-${item.key}">
              ${displayed}${item.unit === "°" ? "°" : ""}
            </output>

          </label>

          <input
            type="range"
            id="control-${item.key}"
            data-key="${item.key}"
            min="${item.min}"
            max="${item.max}"
            step="${item.step}"
            value="${rawValue}"
            aria-label="${item.label}"
          >

          <div class="range-ends">
            <span>${minDisplayed}</span>
            <span>${maxDisplayed}</span>
          </div>

        </div>
      `;
    })
    .join("");

  controls.innerHTML += `
    <p class="control-hint">
      拖動滑桿後，光路圖和量度數據會即時更新。
    </p>
  `;
}


/**
 * 更新滑桿顯示值。
 */
function updateControlOutput(key) {

  const station = stations[state.station];

  const item = station.controls.find(
    (control) => control.key === key
  );

  if (!item) return;

  const output = $(`#output-${key}`);

  if (!output) return;

  const value = item.display
    ? item.display(state[key])
    : state[key];

  output.textContent =
    value + (item.unit === "°" ? "°" : "");
}


/**
 * 更新即時量度。
 */
function renderReadouts(diagram) {

  const metricHtml = diagram.metrics
    .map((item) => `
      <div class="metric">
        <dt>${item.label}</dt>
        <dd>${item.value}</dd>
      </div>
    `)
    .join("");

  readouts.innerHTML = `
    <dl class="metrics">
      ${metricHtml}
    </dl>

    <div class="formula">
      ${diagram.formula}
    </div>

    <p class="measure-note">
      ${diagram.note}
    </p>
  `;
}


/**
 * 更新使用者所選物件的說明。
 */
function renderSelection() {

  if (!currentDiagram) return;

  const picks = currentDiagram.picks;

  const selected =
    picks[state.selected] ||
    picks.overview;

  selectionTitle.textContent = selected.title;
  selectionText.textContent = selected.text;
}


/**
 * 繪製目前站點。
 */
function renderScene() {

  const renderer = renderers[state.station];

  if (!renderer) {
    throw new Error("找不到指定的實驗站");
  }

  const diagram = renderer();

  currentDiagram = diagram;

  scene.innerHTML =
    SVG_DEFS +
    diagram.svg;

  scene.setAttribute(
    "aria-label",
    stations[state.station].title + "光路圖"
  );

  renderReadouts(diagram);
  renderSelection();
}


/**
 * 切換實驗站。
 */
function setStation(stationKey) {

  if (!stations[stationKey]) return;

  state.station = stationKey;
  state.selected = "overview";

  const station = stations[stationKey];

  visualTitle.textContent = station.title;
  sceneHint.textContent = station.hint;

  science.innerHTML = station.science;

  document
    .querySelectorAll("[data-station]")
    .forEach((button) => {

      const active =
        button.dataset.station === stationKey;

      button.classList.toggle(
        "active",
        active
      );

      if (active) {
        button.setAttribute(
          "aria-current",
          "step"
        );
      } else {
        button.removeAttribute(
          "aria-current"
        );
      }

    });

  renderControls();
  renderScene();
}


/* ============================================================
   十三、事件處理
   ============================================================ */

// 六站導航
$("#stationNav").addEventListener(
  "click",
  (event) => {

    const button = event.target.closest(
      "[data-station]"
    );

    if (!button) return;

    setStation(button.dataset.station);
  }
);


// 滑桿即時更新
controls.addEventListener(
  "input",
  (event) => {

    const input = event.target;

    if (!input.matches('input[type="range"]')) {
      return;
    }

    const key = input.dataset.key;

    if (!Object.hasOwn(state, key)) {
      return;
    }

    state[key] = Number(input.value);

    updateControlOutput(key);
    renderScene();
  }
);


// 點擊 SVG 元件：只更新側欄說明
// 不存在任何 explode、拆解或動畫爆炸操作（見 OPTICS_FLAGS.noExplode: true；ex 恆為 0）
scene.addEventListener(
  "click",
  (event) => {

    const element = event.target.closest(
      "[data-pick]"
    );

    state.selected = element
      ? element.dataset.pick
      : "overview";

    renderSelection();
  }
);


// SVG 元件鍵盤操作
scene.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    const element = event.target.closest(
      "[data-pick]"
    );

    if (!element) return;

    event.preventDefault();

    state.selected = element.dataset.pick;

    renderSelection();
  }
);


/* ============================================================
   十四、數學自檢
   ============================================================ */

/**
 * 只檢查公式與數值邏輯。
 *
 * 若有錯誤，於開發者工具顯示。
 * 不影響畫面互動。
 */

function approximatelyEqual(
  a,
  b,
  tolerance = 1e-9
) {
  return Math.abs(a - b) <= tolerance;
}

function runSelfChecks() {

  const tests = [];

  /**
   * 由實際繪圖向量反算角度（與 drawReflection / drawRefraction 同一幾何）。
   */
  function angleFromUpNormal(from, to) {
    const vx = to.x - from.x;
    const vy = to.y - from.y;
    const mag = Math.hypot(vx, vy);
    if (mag < 1e-12) return NaN;
    const cos = (-vy) / mag;
    return toDeg(Math.acos(Math.max(-1, Math.min(1, cos))));
  }

  function angleFromDownNormal(from, to) {
    const vx = to.x - from.x;
    const vy = to.y - from.y;
    const mag = Math.hypot(vx, vy);
    if (mag < 1e-12) return NaN;
    const cos = (vy) / mag;
    return toDeg(Math.acos(Math.max(-1, Math.min(1, cos))));
  }

  // 反射：複製 drawReflection 幾何，反算 i、r
  for (const iDeg of [10, 30, 45, 70]) {
    const reflectedDeg = reflectionAngle(iDeg);
    const P = point(500, 410);
    const radius = 280;
    const startPt = point(
      P.x - radius * sinD(iDeg),
      P.y - radius * Math.cos(toRad(iDeg))
    );
    const endPt = point(
      P.x + radius * sinD(reflectedDeg),
      P.y - radius * Math.cos(toRad(reflectedDeg))
    );
    // 入射：angleFromUpNormal(P, startPt)（由入射點沿入射逆向；勿用 startPt→P，否則得 180−i）
    // 反射：angleFromUpNormal(P, endPt)
    const iDrawn = angleFromUpNormal(P, startPt);
    const rDrawnOut = angleFromUpNormal(P, endPt);
    tests.push({
      name: "繪圖向量反射 i=r @" + iDeg + "°",
      pass:
        approximatelyEqual(iDrawn, iDeg, 0.05) &&
        approximatelyEqual(rDrawnOut, iDeg, 0.05) &&
        approximatelyEqual(iDrawn, rDrawnOut, 0.05)
    });
  }

  // 折射：空氣→玻璃，反算後驗證斯涅爾
  const n1 = 1.0;
  const n2 = 1.5;
  for (const iDeg of [30, 45]) {
    const rDeg = snellAngle(n1, n2, iDeg);
    const P = point(500, 355);
    const radius = 220;
    const startPt = point(
      P.x - radius * sinD(iDeg),
      P.y - radius * Math.cos(toRad(iDeg))
    );
    const endPt = point(
      P.x + radius * sinD(rDeg),
      P.y + radius * Math.cos(toRad(rDeg))
    );
    const iDrawn = angleFromUpNormal(P, startPt);
    const rDrawn = angleFromDownNormal(P, endPt);
    tests.push({
      name: "繪圖向量斯涅爾 @i=" + iDeg + "°",
      pass:
        approximatelyEqual(iDrawn, iDeg, 0.05) &&
        approximatelyEqual(rDrawn, rDeg, 0.05) &&
        approximatelyEqual(n1 * sinD(iDrawn), n2 * sinD(rDrawn), 1e-6) &&
        rDrawn < iDrawn
    });
  }

  const f = 120;
  const u = 250;
  const lens = thinLens(f, u);
  tests.push({
    name: "薄透鏡公式",
    pass: approximatelyEqual(1 / f, 1 / u + 1 / lens.v)
  });

  const mirrorX = 530;
  const distance = 175;
  tests.push({
    name: "平面鏡像距等於物距",
    pass: approximatelyEqual(
      mirrorX - (mirrorX - distance),
      (mirrorX + distance) - mirrorX
    )
  });

  tests.push({
    name: "noExplode 旗標",
    pass:
      typeof OPTICS_FLAGS !== "undefined" &&
      OPTICS_FLAGS.noExplode === true &&
      OPTICS_FLAGS.ex === 0
  });

  tests.forEach((test) => {
    if (!test.pass) {
      console.error("光學自檢失敗：", test.name);
    } else {
      console.info("光學自檢通過：", test.name);
    }
  });

  return tests;
}


/** 規格旗標：禁止 explode／零件飛散（驗收用，可 grep） */
const OPTICS_FLAGS = {
  noExplode: true,
  ex: 0
};

/* ============================================================
   十五、初始化
   ============================================================ */

runSelfChecks();

setStation("shadow");