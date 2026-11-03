# EAST 東方超環｜教學頁 Round 1

澳門科學館／Oscar · 繁體中文 · 本地預覽用（**未部署**、**未 git push**、**未 GitHub Pages**）。

## 檔案

- `index.html` — 自包含教學頁（Three.js + OrbitControls via unpkg CDN）
- `assets/` — 預留；本回合僅程序幾何，無嵌入版權照片

## 預覽（選定埠）

先以 `ss`／`lsof` 確認 **8765–8771 以外**的空埠。本回合選定：

**埠：`8780`**

```bash
cd /workspace/slides/2026-11-03-east-tokamak-r1/build-r1
python3 -m http.server 8780 --bind 127.0.0.1
```

瀏覽器開啟：http://127.0.0.1:8780/

（若 8780 已被佔用，另選例如 8782／8820，並更新本 README。）

## 內容對齊

- 事實來源：`/workspace/deliverables/east-tokamak-edu-2026-11-03/`（`science-spec.md`、`SPEC.md`、`sources.md`）
- 洋葱層：杜瓦 → 外冷屏 → TF+PF/CS → 內冷屏 → 真空室 → 偏濾器／電漿；底座支撐
- 允許 fade／切層／復位；**禁止**打亂層次的 explode
- 1066 秒／一億度：標 2025-01-20 並附官方來源連結

## 取用日期

2026-11-03（Asia/Macau）
