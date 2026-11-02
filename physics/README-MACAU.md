# Atlas of Physics｜澳門基力繁中／英文雙語版（MVP）

基於上游 [nathanliow/atlas-of-physics](https://github.com/nathanliow/atlas-of-physics)（**MIT**，Copyright (c) 2026 Nathan Liow）。本目錄為本地 fork：`zh/` 與 `en/` 分開瀏覽；介面與課文語言各自一致。互動補充資源，**非**官方教材。

**澳門科學館 Oscar 製作 · Produced by Oscar, Macao Science Center**

## 本地開啟

```bash
cd /workspace/deliverables/atlas-physics-macau/macau-zh
python3 -m http.server 8765
```

瀏覽器：http://127.0.0.1:8765/

| 路徑 | 說明 |
| --- | --- |
| `/` | 語言選擇 |
| `/zh/` · `/zh/index-junior.html` · `/zh/index-senior.html` | 中文入口 |
| `/en/` · `/en/index-junior.html` · `/en/index-senior.html` | English |
| `/zh/baseli.html` | 基力對照 |
| `/zh/optics/` · `/en/optics/` | 光學新章（自製） |
| `/equations/` | 公式表（共用） |

章內可加 `?level=junior` 或 `?level=senior` 過濾頁面。

## MVP 章

| 入口 | 章 |
| --- | --- |
| 初中 | fluids、energy、circuits、**optics**、magnetism（選） |
| 高中 | newton、energy、momentum、induction、**optics**、magnetism |

## 光學章（上游無）

目錄：`zh/optics/`、`en/optics/`（model／world／pages／practice／main／index）。

主題：直線傳播與影子、反射定律、平面鏡、折射／斯涅爾簡介、色散與顏色；凸透鏡成像為加深（senior）。

## 授權

保留上游 MIT 與 Copyright (c) 2026 Nathan Liow。繁中文案、光學章與入口為本地新增。

## 光學3D實驗室（六站·本地原創）

目錄：`optics-3d/`（Three.js CDN；與 `zh/optics` 2D 章並列）。公開建議：`…/physics/optics-3d/`。
