# 澳門物價站（靜態 MVP）

繁中超市＋街市比價前端；資料讀本目錄 `data/` 鏡像，**唔**喺瀏覽器直連官方 API。

- **建議公開路徑**：`https://wayneleong-byte.github.io/msc-slides/price-station/`
- **部署源**：本目錄整份拷入 `msc-slides` 嘅 `price-station/`（交互動簡報部署；本交付唔自行 push）

## 本地預覽

```bash
cd /workspace/deliverables/macau-price-station-2026-11-02
python3 -m http.server 18081 --bind 127.0.0.1
# 開 http://127.0.0.1:18081/
```

自測：超市搜「牛奶」→ 開 Cowhead #115 → 入清單 → 睇最平店／一間店買齊；街市睇菜心分街市價；頁腳有消委會署名同鏡像時間。

## 範圍

**做**：搜尋、分店價、清單、最平／一間店買齊、街市、主頁磚（除燃料）、優惠／專項殼、龍虎榜／價差「暫不可用」。  
**唔做**：條碼／拍照、地圖／路線、燃油／石油氣、商業變現。

## 更新資料

見 `scripts/README.md`（ADM-3 跑 `fetch_mirror.py`）。
