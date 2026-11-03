# 新苗 priced OCR（vision）2026-11-03

來源：`data/promo-leaflet/2026-11-03/sanmiu/sanmiu-01.jpg`…`08.jpg` + `SOURCES.txt`
方法：Read 視覺讀圖（非純 tesseract）；只收有可讀 **salePrice** 嘅品項。
輸出：`…/sanmiu/ocr-priced.json`；已寫入 `data/promo-leaflet/index.json` 嘅 sanmiu.ocrItems。

- **總數（有 salePrice）**：44
- **有原價／可算折扣率**：25
- **只有特價（原價 null）**：19

## 分頁
- `sanmiu-01`：12 項
- `sanmiu-02`：13 項
- `sanmiu-03`：1 項
- `sanmiu-04`：2 項
- `sanmiu-05`：1 項
- `sanmiu-06`：8 項
- `sanmiu-07`：4 項
- `sanmiu-08`：3 項

## 參考核對
- sanmiu-01：冰鮮文昌雞 65.8／79.9；明治牛奶 2件均價21（2件42）／29.9
- sanmiu-02：維他九包裝檸檬茶／菊花茶 22.9／31.3；御品皇香米 88／109；多芬套裝 68／78
- sanmiu-05：ROKEBY 蛋白奶昔 25.9（無原價）
- sanmiu-06：指定精選烘焙 8 款各 9.9／份
- sanmiu-07：指定精選葉菜 4 款各 5／包（加量不加價）
- sanmiu-08：ASAHI Wonda 咖啡 2件均價 6.9／標準價 10.5

## 備註
- 2／3 件優惠以「均價」作 salePrice，unit 註明件數同總價。
- 沙糖桔海報標 11.7／磅 vs 標準價 25.6／kg，單位不同，不計折扣。
- sanmiu-03／04 為專題放大海報，品項與 02 重疊但保留（方便對海報頁）。
- 滿額贈品（維他 $55 送 6 盒）唔當可買品寫入。
- **唔 push**；請總管交 html ppt 部署。
