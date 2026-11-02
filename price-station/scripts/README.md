# 鏡像拉數腳本（ADM-3）

## 點解唔喺 Pages／Box 跑？

- `consumer-api03.dsedt.gov.mo` 喺多數雲端／Box egress 會 **HTTP 405**（Tengine WAF）。
- 官方 API **無** `Access-Control-Allow-Origin` → 瀏覽器由 GitHub Pages 直接 `fetch` 會被 CORS 擋。
- 因此：**只喺 ADM-3（或其他可得 200 嘅機）跑本腳本**，產出寫入 repo 嘅 `data/`，再部署靜態站。

## 依賴

- Python 3.9+
- 標準庫即可（`urllib`）
- 若已安裝 `requests` 會優先使用

```bash
# 可選
python3 -m pip install requests
```

## 輸出檔

| 指令 | 輸出 |
|------|------|
| `--search 牛奶` | `data/search/牛奶.json`；合併更新 `data/search_index.json`；刷新 `data/meta.json` |
| `--item 115` | `data/items/115.json`（含 `item`／`groups`／`updateDate`） |
| `--market-veg` | `data/market/detail_veg.json`、`data/market/catalog.json` |
| `--all-search-items` | 對索引內每品逐一 `--item`（請加 `--sleep`） |

## 喺 ADM-3 點跑

```bash
cd /path/to/macau-price-station-2026-11-02   # 或部署用嘅 physics 旁之 price-station 工作樹

# 搜尋並更新索引
python3 scripts/fetch_mirror.py --search 牛奶

# 分店價（先抓 HTML 解 buildId，再打 _next/data）
python3 scripts/fetch_mirror.py --item 115

# 街市菜心
python3 scripts/fetch_mirror.py --market-veg

# 一次做齊示範
python3 scripts/fetch_mirror.py --search 牛奶 --item 115 --market-veg
```

若出現 **405**：換 ADM-3 或家用寬頻出口再試，唔好喺 GitHub Actions／一般雲端硬打。

## 合規

非商業；頁腳須署名「消費者委員會」並顯示資料／鏡像日期。勿高頻打爆官方。
