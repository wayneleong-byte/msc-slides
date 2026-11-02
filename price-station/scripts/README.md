# 鏡像拉數腳本（ADM-3）

## 點解唔喺 Pages／Box 跑？

- `consumer-api03.dsedt.gov.mo` 喺多數雲端／Box egress 會 **HTTP 405**（Tengine WAF）。
- 官方 API **無** `Access-Control-Allow-Origin` → 瀏覽器由 GitHub Pages 直接 `fetch` 會被 CORS 擋。
- 因此：**只喺 ADM-3（或其他可得 200 嘅機）跑本腳本**，產出寫入 repo 嘅 `data/`，再部署靜態站。

## 依賴

- Python 3.9+
- 標準庫即可（`urllib`）
- 若已安裝 `requests` 會優先使用

## 輸出檔

| 指令 | 輸出 |
|------|------|
| `--search 牛奶` | `data/search/牛奶.json`；合併更新 `data/search_index.json`；刷新 `data/meta.json` |
| `--item 115` | `data/items/115.json` |
| `--market-veg` | `data/market/detail_veg.json`、`catalog.json` |
| `--all-search-items` | 對索引內每品逐一拉分店價 |
| **`--full --sleep 0.6`** | 掃齊超市分類 → `data/catalog/`＋全量 `search_index.json`；逐品 `data/items/{id}.json`；街市 6 類 lowest＋每品 detail → `data/market/`；`meta.coverage=full`；失敗寫 `data/logs/` |

## 喺 ADM-3 點跑

```bash
cd /path/to/macau-price-station-2026-11-02

# 完整鏡像（慢；約數十分鐘起，視貨品數）
python3 scripts/fetch_mirror.py --full --sleep 0.6

# 小量示範
python3 scripts/fetch_mirror.py --search 牛奶 --item 115 --market-veg
```

失敗品會記 log **唔中斷**。出現 **405** 請換 ADM-3／家用出口，唔好喺 GitHub Actions 硬打。

## 合規

非商業；頁腳署名「消費者委員會」；慢速（`--sleep`≥0.6）。
