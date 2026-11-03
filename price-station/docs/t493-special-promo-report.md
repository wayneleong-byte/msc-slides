# t493 專項 B/A + 優惠 C 短報

時間：2026-11-03（Asia/Macau）。未 Pages push。

## 改檔
- `scripts/fetch_mirror.py` — `--special`：nss `price_by_item` 價表（B）+ PDF 本地下載（A）
- `special.html` / `app.css` — 站內表／PDF iframe，唔 `target=_blank` 跳走
- `promo.html` —「最新消息」試探卡
- `data/promo/news/schema.json`、`index.json`、`0102.json`、`0105.json`
- `scripts/fetch_promo_news_sanmiu.py`
- `docs/promo-news-probe.md`
- `data/special/categories.json` + `detail/{9,16,31,34,35,38,40,45}.json`（筆電 `--special` 覆蓋）
- `data/special_categories.json`、`data/meta.json`

## 專項（筆電跑完 modes table=3 pdf=0 none=5）

| coid | 名 | 結果 |
|------|----|------|
| 40 | 麵包 | **B** table；378 筆價／5 品 |
| 45 | 嬰兒尿片 | **B** table；23 筆／8 品 |
| 38 | 冰鮮雞 | **B** table；27 筆／3 品 |
| 34 | 新鮮豬肉(公斤) | **A 失敗**：有 PDF URL 但官方 export 全 404 |
| 35 | 冰鮮豬肉(公斤) | **無**：get_category_pdf success=-1；無 nss／PDF |
| 9 | 非處方成藥 | **無**：同上 spe_type 0 |
| 16 | 嬰兒奶粉 | **無** |
| 31 | 個人護理用品 | **無** |

## 優惠 C
- 新苗 0102：可 scrape `news.asp?sortid=25`，但僅 1 條過時海報、圖 empty_body／CDN SSL 過期 → status `broken_assets`
- 百佳 0105：pns.hk promotions/offers 404；無穩定免登入公開入口 → `no_stable_entry`
- Schema／UI：`data/promo/news/*` + `promo.html#news-card`

## 筆電再跑（若要刷新）
```
cd C:\Users\Oscar\Documents\macau-price-station
D:\pinokio\bin\miniconda\python.exe scripts\fetch_mirror.py --special --sleep 0.6
```
（腳本來源箱：`/workspace/deliverables/.../scripts/fetch_mirror.py`；CopyFromBox 須落 `C:\Users\Oscar\Documents\...`，D: 根被拒。）

## 限制
- 箱 egress 對 API 常 405；真拉數只用 LAPTOP-7JUE4FNQ
- spe_type 2 豬肉 PDF 官方 404；spe_type 0 無內容可鏡
- 未 push GitHub Pages；部署交總管→html ppt
