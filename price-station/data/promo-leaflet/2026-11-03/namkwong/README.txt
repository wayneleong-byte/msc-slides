南光Mart（Nam Kwong Mart／NK Mart）leaflet 落圖目錄
==================================================
檔名慣例：01.jpg、02.jpg、03.jpg…（兩位數字、按海報頁序；可用 .png／.webp，但優先 .jpg）
來源（要 browser／手動另存，箱上 curl 唔得）：
  Facebook：https://www.facebook.com/NamKwongMart
  （page 亦可 https://www.facebook.com/104528335151831）
  未見公開官網 DM／PDF 入口。

總管／browser 落圖後：通知「編程」跑 tesseract chi_tra+eng → 寫入
data/promo-leaflet/index.json（stores[].id=namkwong）＋必要 ocrItems。
未落圖前唔好加空 stores 條目入 index（免 UI 壞）。
