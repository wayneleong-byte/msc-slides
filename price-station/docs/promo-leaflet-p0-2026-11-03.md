# 優惠 leaflet P0（來來／泰豐）— 前端

- **時間**：2026-11-03 Asia/Macau
- **方針**：官網 leaflet 原圖為主；OCR 品名可入清單（價可空）；**唔用**消委會優惠 API 作主展示。

## 資產
- Index：`data/promo-leaflet/index.json`
- 圖：`data/promo-leaflet/2026-11-03/royal/DM1–8.jpg`（8）、`…/taifung/tf-01…06.jpg`（6）
- OCR：`…/ocr/` + index 內 `ocrItems`（來來 DM1 約 12 品；泰豐暫 0）

## UI
- `promo.html`：揀店 → 縮圖翻頁 → 點主圖 lightbox；來源連官網；OCR「加入清單」
- 舊 `data/promo` 折扣價表收喺 details「已停用主展示」

## 限制
- 價錢 OCR 弱，唔造價
- FB／IG／其他店未做（P1）
