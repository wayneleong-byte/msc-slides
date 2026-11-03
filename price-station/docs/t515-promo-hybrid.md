# t515 優惠 hybrid（2026-11-03）

## 改檔
- `promo.html`：hybrid（leaflet UI + 五店折扣列表／品類／價表＋入清單）
- `index.html`：優惠磚／說明改 hybrid 文案
- `cart.html`：`promo-discount` 清單徽章
- `app.css`：`.kind-badge.promo-discount`
- `README.md`、`docs/promo-leaflet-p0-2026-11-03.md`：政策一句

## 五店 scode
| scode | 顯示 |
|------|------|
| 0124 | Tmart |
| 0108 | 利豐 |
| 0110 | 福倡 |
| 0122 | 南華美式貨場 |
| 0107 | 宏基 |

資料：`data/promo/index.json`＋`stores/{scode}.json`＋`prices/{scode}_{C00x}.json`

## 切換
- 點 leaflet 店 → 海報／OCR；藏折扣品類／價表
- 點五店 → 品類 chip＋折扣表（標「消委會／官方折扣資料」）；藏海報／OCR
- 其餘 promo 店（新苗／新花城／南光／百佳等）列「待補 leaflet」，唔載舊折扣主展示
- 泰豐／來來：leaflet 主線（泰豐 scode 0104 唔入五店折扣主展示）

## 部署
未 push；請總管交 html ppt 同 URL。

## 限制
- 五店折扣同步日仍多為 2026-10（鏡像如實）
- 來來無 promo scode；泰豐有 leaflet 故唔回退折扣主線
- OCR 價錢仍弱，唔造價
