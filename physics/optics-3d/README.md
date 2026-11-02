# 光學3D實驗室｜六站完整（上線包）

澳門科學館 · Oscar · 教育科技小組

## 原創說明

本實驗室六站互動（直線傳播與影子、反射定律、平面鏡虛像、斯涅爾折射、稜鏡色散、凸透鏡成像）為**澳門科學館展教／教育科技本地原創**幾何光學教學素材；點擊僅開科學說明，**禁止 explode／零件拆解**。Three.js 僅作 3D 渲染（jsDelivr CDN `three@0.187.0`）。物理圖集其餘章之上游授權見主站 `LICENSE`（Nathan Liow／MIT）。

## 建議公開路徑

`https://wayneleong-byte.github.io/msc-slides/physics/optics-3d/`

本目錄位於部署源 `macau-zh/optics-3d/`。

## 檔案

- `index.html` — UI 殼＋ importmap（CDN，無本地 node_modules）
- `app.js` — 六站物理與 Three.js 場景
- `styles.css` — 樣式
- `README.md` — 本說明

## 本地預覽

```bash
cd /workspace/deliverables/atlas-physics-macau/macau-zh
python3 -m http.server 8770
```

開啟：http://127.0.0.1:8770/optics-3d/

## 來源

由 `optics-redesign-2026-11-02/build-3d-pilot` 轉為上線包（去掉 symlink、改 CDN、加原創說明）。
