# 生態網｜熱帶稀樹草原（Phase C 試水 build-r2）

靜態教學互動頁：只做 **savanna** 一系。資料驅動，無 npm 建置。

**build-r2（R2b）**：主區淺色稀樹草原日景（暖米黄／淺赭草地＋淡藍天光＋樹冠綠強調）；頂欄／側欄可深色對比。自研色板，唔抄 DEMO／Lutra。功能沿用 r1；缺相片仍用占位。

## 教學簡化免責

本頁物種與連線為**課堂可見模型**，刻意控層級與數量，**唔等於**真實完整生態系或完整食物網。請以課本與教師說明為準。

## 如何開啟

必須用本機 HTTP 伺服器（`fetch` 讀 JSON，勿直接雙擊開檔）：

```bash
cd /workspace/deliverables/ecoweb-own-2026-11-03/build-r2
python3 -m http.server 8771 --bind 127.0.0.1
```

瀏覽器開啟：`http://127.0.0.1:8771/`

開前請確認 **8771** 空閒。本試水約定 port 為 8771（避開 DEMO clone 慣用 port）。

## 功能摘要

- 拖曳物種節點；幼線連線；取食／碎屑箭頭指向獲能方（`to`）
- 競爭＝雙向虛線、無能量箭頭
- 實驗室多選物種；少於 2 生產者警告；全選／清空／重設
- 關係篩選芯片；側欄 L1＋可展開 L2；名詞表深鏈；通識自評
- 約 60 秒無操作後磨砂「點一下繼續」（不改邊、不擋教學可讀性）
- 缺圖用幾何占位＋物種名（相片之後補）

## 資料路徑

- `data/ecosystems/savanna.json`
- `data/glossary.json`
- `data/quiz/bank-v1.json`

## 自檢清單（build-r2 色板）

| # | 項目 | 狀態 |
|---|---|---|
| C1 | 配色貼熱帶稀樹草原（暖塵／金褐／樹冠綠） | done |
| C2 | 自研色板；唔抄 DEMO／Lutra | done |
| C3 | 相片占位保留 | done |
| C4 | 只 savanna；未擴其餘三系 | done |
| C5 | 教學簡化免責仍在 | done |

功能自檢沿用 build-r1 1–11（見該版 README）。

## 不做

- 不部署 GitHub Pages（需 Oscar 明示准許）
- 不抄 DEMO／Lutra 資產或程式
- 本回合不擴其餘三生態系
- 不加未授權相片

## 產出日期

2026-11-03 Asia/Macau｜build-r2 color pass
