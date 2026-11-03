# 優惠「最新消息」試探（Oscar t493／C）

探測機：LAPTOP-7JUE4FNQ（Asia/Macau）。唔假造消息；FB／需登入入口跳過。

## 樣本結果

| scode | 店 | 結果 | 原因／入口 |
|-------|----|------|-----------|
| 0102 | 新苗 | **可 scrape，資產壞** | `http://www.sanmiu.com/news.asp?sortid=25`（about ID=25 優惠促銷）。列表僅 1 條「2023 4月份 促销海报」；本站 PicFiles 200 空 body；明細 CDN `xy.ideawork.cn` SSL 憑證過期。內容過時，只作 schema／UI 樣本。 |
| 0105 | 百佳 | **無穩定公開入口** | `pns.hk/zh-hk/promotions`、`/offers` 404；主站香港電商 SPA／MoneyBack App；未硬登 FB。 |

## 其餘 promo 店（未做完整爬蟲；快速判斷）

| scode | 店 | 初步 |
|-------|----|------|
| 0124 | Tmart | 無已知穩定澳門公開海報列表（待查） |
| 0121 | 南光 Mart | 待查 |
| 0103 | 新花城 | 待查 |
| 0108 | 利豐 | 待查 |
| 0104 | 泰豐 | 待查 |
| 0107 | 宏基 | 待查 |
| 0110 | 福倡 | 待查 |
| 0122 | 南華美式貨場 | 待查 |

## 交付檔

- Schema：`data/promo/news/schema.json`
- Index：`data/promo/news/index.json`
- 樣本：`data/promo/news/0102.json`、`0105.json`
- UI 草位：`promo.html`「最新消息」卡（讀 index；壞圖顯示狀態字）
- 可選腳本：`scripts/fetch_promo_news_sanmiu.py`（只拉新苗列表，唔下載壞圖）

## 結論

「最新消息」對多數超市**唔係**穩定長期公開頁；新苗有入口但內容／圖不可用。建議 UI 保留草位＋明確 status，唔當主優惠來源（主源仍係官方 discount_price 鏡像）。
