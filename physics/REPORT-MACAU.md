# 總管短報｜雙語主線＋光學（2026-11-01 Asia/Macau）

## 光學章
- 路徑：`macau-zh/zh/optics/`、`macau-zh/en/optics/`
- 檔案：model.js／world.js／pages.js／practice.js／main.js／index.html（無 checks）
- 主題（6 頁）：直線傳播與影子；反射定律；平面鏡成像；折射／斯涅爾簡介；色散與顏色；凸透鏡成像（僅 `senior`）
- 入口：初中／高中均掛 optics（`?level=junior|senior`）
- 署名：澳門科學館 Oscar 製作／Produced by Oscar, Macao Science Center

## 雙語主線
- 根：`index.html` 語言選擇；`zh/`、`en/` 各有 hub＋junior／senior
- MVP 章已分語系；`engine/book.js` 已修 ROOT／ZH chrome／PLATES.title|sub
- 中文：PAGES 正文（含磁學）＋PLATES 課文＋asm 標題／副題為書面語繁中
- 基力：`zh/BASELI.md`、`zh/baseli.html`

## 本地開啟
```bash
cd /workspace/deliverables/atlas-physics-macau/macau-zh
python3 -m http.server 8765
```
http://127.0.0.1:8765/ → 語言 → zh／en → 初中或高中 → 章（含光學）

## 未做／可續
- 各章 PLATES `facts` 列標仍多為英文；非光學章 `practice.js` 多仍英文
- 光學無 `checks.mjs`；透鏡僅定性
- 未推 GitHub Pages；正式展教前建議術語簽核
- 部分磁學 `fig` 以外之圖說／練習可再潤
