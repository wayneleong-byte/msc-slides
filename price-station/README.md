# 澳門物價站（靜態 MVP）

繁中超市＋街市＋優惠＋專項比價前端；資料讀本目錄 `data/` 鏡像，**唔**喺瀏覽器直連官方 API。

- **建議公開路徑**：`https://wayneleong-byte.github.io/msc-slides/price-station/`
- **部署源**：本目錄整份拷入 `msc-slides` 嘅 `price-station/`（交互動簡報部署；本交付唔自行 push）

## 本地預覽

```bash
cd /workspace/deliverables/macau-price-station-2026-11-02
python3 -m http.server 18081 --bind 127.0.0.1
# 開 http://127.0.0.1:18081/
```

自測：超市搜貨品 → 揀分店入清單；街市入清單；主頁磚進 **優惠情報站**／**專項物價**；頁腳有 Open Data／消委會署名同鏡像時間。

## 範圍

**做**：超市搜尋／分店價／清單、街市、優惠情報（主線 `data/promo-leaflet` leaflet＋OCR；舊 `data/promo` 折扣唔再主展示／唔載入 UI）、專項物價（`data/special`；價表可入清單）、主頁磚。  
**唔做**：條碼／拍照、地圖／路線、燃油／石油氣、龍虎榜／價差（官方常 500）、商業變現。

## 更新資料

見 `scripts/README.md`。主拉機：**LAPTOP-7JUE4FNQ**（Windows）跑：

```bat
python scripts\fetch_mirror.py --full --sleep 0.6
```

Box／雲端對 `consumer-api03` 常 **405**，唔好喺度跑 full。
