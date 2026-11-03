# 鏡像拉數腳本（主拉機：LAPTOP-7JUE4FNQ）

## 點解唔喺 Pages／Box 跑？

- `consumer-api03.dsedt.gov.mo` 喺多數雲端／Box egress 會 **HTTP 405**（Tengine WAF）。
- 官方 API **無** `Access-Control-Allow-Origin` → 瀏覽器由 GitHub Pages 直接 `fetch` 會被 CORS 擋。
- 因此：**只喺可得 HTTP 200 嘅機跑本腳本**（現主拉機：**LAPTOP-7JUE4FNQ**／Windows；machineId `a31b43c0-6d8a-4d2b-ba15-1a8897dfa708`）。舊 ADM-3 已退役。產出寫入 repo 嘅 `data/`，再部署靜態站。

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
| **`--promo --sleep 0.6`** | `data/promo/index.json`、`meta.json`、`stores/{scode}.json`、`prices/{scode}_{gtcode}.json` |
| **`--special --sleep 0.6`** | `data/special/categories.json`、`detail/{coid}.json`（spe_type3＝nss `table`；0／2＝`itemlist`+storelist；PDF 404 唔阻）；相容 `data/special_categories.json` |
| **`--full --sleep 0.6`** | 超市＋街市 **＋ promo ＋ special**；`meta.coverage=full`；失敗寫 `data/logs/` |

## 喺 Windows（LAPTOP-7JUE4FNQ）點跑

```bat
cd C:\path\to\macau-price-station-2026-11-02

REM 完整鏡像（慢；約數十分鐘起，視貨品數）
python scripts\fetch_mirror.py --full --sleep 0.6

REM 只拉優惠／專項
python scripts\fetch_mirror.py --promo --sleep 0.6
python scripts\fetch_mirror.py --special --sleep 0.6

REM 小量示範
python scripts\fetch_mirror.py --search 牛奶 --item 115 --market-veg
```

Linux／macOS 可用 `python3` 代替 `python`。

失敗品會記 log **唔中斷**。出現 **405** 請換可 200 嘅機（如 LAPTOP-7JUE4FNQ），唔好喺 GitHub Actions／Box 硬打。

## 合規

非商業；頁腳署名澳門特別行政區政府／消費者委員會「澳門物價情報站」Open Data；慢速（`--sleep`≥0.6）。
