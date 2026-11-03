# 物價站｜leaflet t516 全頁 OCR＋擴店試探

- **時間**：2026-11-03（Asia/Macau）
- **任務**：Oscar t516 — 全頁 OCR；hybrid 五店維持；試擴新苗／新花城／南光Mart／百佳
- **交付根**：`/workspace/deliverables/macau-price-station-2026-11-02/`

## 1. 全頁 OCR

| 店 | pages | ocrItems（可入清單品名） | 備註 |
|----|-------|--------------------------|------|
| 來來 Royal | **8**（DM1–DM8） | **111** | `tesseract 5 chi_tra+eng`；價全 `null`（美術字）；`ocr/royal-DM{1-8}.txt` |
| 泰豐 Tai Fung | **6** | **16** | 海報1＝分店電話橫額→0 品名；其餘縮圖 800×600 OCR 偏弱；`ocr/taifung-0{1-6}.txt` |

- **index**：`data/promo-leaflet/index.json`（`ocrItems[].page` 關聯頁）
- **引擎**：箱上 `/usr/bin/tesseract` + `chi_tra` + `eng`
- **原則**：圖為準；OCR 品名可入購物清單；唔造價

## 2. Hybrid（未改壞）

消委會／DSEDT 折扣五店維持：`0124` Tmart、`0108` 利豐、`0110` 福倡、`0122` 南華、`0107` 宏基（`promo.html` `DISCOUNT_SCODES`）。

## 3. 擴 leaflet 店試探（唔假填）

| 店 | 結果 | 原因 |
|----|------|------|
| 新苗 Sanmiu | **未掛** | 來源表＝FB；`http://www.sanmiu.com/` 箱上 **500**；官網優惠頁僅見 **2023-04** 舊海報（過期，唔鏡像當本期） |
| 新花城 | **未掛** | 來源表＝IG `sunscosupermarket`（login）；`suncitysupermarket.com`＝空白 WP Hello World，**無海報** |
| 南光Mart | **未掛** | 來源表＝FB；`namkwong.com.mo`＝集團站，**非**超市 leaflet |
| 百佳 ParknShop | **未掛** | 無澳門獨立可 curl 傳單站；優惠走易賞錢 App／門市；`parknshop.com` 箱 403／`.mo` TLS 失敗 |

### 要 browser／筆電清單（P1）

1. FB 優惠群組 `groups/1442310116447639`
2. 新苗 FB Page（最新貼文海報）
3. 新花城 IG `@sunscosupermarket`
4. 南光Mart FB `@NamKwongMart`
5. 百佳：門市 App／人手影傳單或官方電子傳單渠道（若有）後匯入同目錄結構
6. （另）宏基 FB、Tmark IG — 屬 hybrid 折扣五店／P1，今次未做

## 4. 改檔

- `data/promo-leaflet/index.json` — 全頁 ocrItems
- `data/promo-leaflet/2026-11-03/ocr/royal-DM{1-8}.txt`（+ logs）
- `data/promo-leaflet/2026-11-03/ocr/taifung-0{1-6}.txt`（+ logs）
- `docs/promo-leaflet-t516-ocr-2026-11-03.md`（本檔）
- 幕僚長筆記同步（見 bot-archives）
- **未改** `promo.html` hybrid 五店邏輯；**未 Pages push**

## 5. 部署

請總管交 html ppt 同 URL 部署（含更新後 `index.json`＋ocr 產物）。
