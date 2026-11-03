# EAST 東方超環｜教學頁 Round 1

澳門科學館／Oscar · 繁體中文 · GitHub Pages：`https://wayneleong-byte.github.io/msc-slides/east/`

## 檔案

- `index.html` — 自包含教學頁（Three.js + OrbitControls via unpkg CDN）
- `assets/` — 預留；本回合僅程序幾何，無嵌入版權照片

## 本地預覽

```bash
cd /workspace/slides/ai2027-cHSQoP/site/east
python3 -m http.server 8780 --bind 127.0.0.1
```

瀏覽器：http://127.0.0.1:8780/

## 內容對齊

- 事實來源：`/workspace/deliverables/east-tokamak-edu-2026-11-03/`（`science-spec.md`、`SPEC.md`、`sources.md`）
- 洋葱層：杜瓦 → 外冷屏 → TF+PF/CS → 內冷屏 → 真空室 → 偏濾器／電漿；底座支撐
- 允許 fade／切層／復位；**禁止**打亂層次的 explode
- 1066 秒／一億度：標 2025-01-20 並附官方來源連結

## 取用／上線日期

2026-11-03（Asia/Macau）
