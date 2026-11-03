# 圖像來源署名｜EcoWeb 自家版（savanna 試水）

- 狀態：**落檔完成**（14／14）
- 下載日時：2026-11-03 15:44 Asia/Macau
- 來源規則：Wikimedia Commons；授權僅 CC BY／CC BY-SA／CC0／Public Domain
- 目標路徑：`assets/savanna/<species_id>.png`（build-r4 與 content 同步；webp 備份仍在同目錄）
- 禁止：Lutra／DEMO 資產；未授權商圖；未標示之 AI 亂真標本圖

---

| species id | 中文 | 本地路徑 | 作者 | 授權 | 來源頁 | 下載日時 | 備註 |
|---|---|---|---|---|---|---|---|
| `grass` | 禾草 | `assets/savanna/grass.png` | Bjørn Christian Tørrissen | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Serengeti-Landscape-2012.JPG | 2026-11-03 15:44 Asia/Macau | 稀樹草原草海景觀示意，非單一禾本科標本。 |
| `acacia` | 金合歡類喬木 | `assets/savanna/acacia.png` | Michelle Maria | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Acacia_Tree_in_the_Serengeti,_Tanzania_-_panoramio.jpg | 2026-11-03 15:44 Asia/Macau | — |
| `zebra` | 平原斑馬 | `assets/savanna/zebra.png` | David Dennis | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Zebra_in_the_Serengeti_Wildebeest_Migration.jpg | 2026-11-03 15:44 Asia/Macau | — |
| `thomson_gazelle` | 湯氏瞪羚 | `assets/savanna/thomson_gazelle.png` | Stig Nygaard | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Gazella_thomsonii_Serengeti.jpg | 2026-11-03 15:44 Asia/Macau | — |
| `giraffe` | 長頸鹿 | `assets/savanna/giraffe.png` | Christoph Strässler | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Giraffe,_Tarangire_National_Park,_Tanzania.jpg | 2026-11-03 15:44 Asia/Macau | — |
| `termite` | 白蟻 | `assets/savanna/termite.png` | Maximilian Staub | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Termite_Mound_in_Serengeti_National_Park.jpg | 2026-11-03 15:44 Asia/Macau | 白蟻丘示意（塞倫蓋蒂）；非單一白蟻個體特寫。 |
| `cheetah` | 獵豹 | `assets/savanna/cheetah.png` | Giles Laurent | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:037_Cheetah_close-up_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg | 2026-11-03 15:44 Asia/Macau | — |
| `spotted_hyena` | 斑鬣狗 | `assets/savanna/spotted_hyena.png` | Christoph Strässler | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Hyena_near_Ndutu_Lodge,_Serengeti_(16847282167).jpg | 2026-11-03 15:44 Asia/Macau | — |
| `lion` | 非洲獅 | `assets/savanna/lion.png` | Charles J Sharp | CC BY 2.5 | https://commons.wikimedia.org/wiki/File:Lioness-in-the-Serengeti.JPG | 2026-11-03 15:44 Asia/Macau | — |
| `white_backed_vulture` | 白背兀鷲 | `assets/savanna/white_backed_vulture.png` | Charles J. Sharp | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:White-backed_vulture_(Gyps_africanus)_Kruger.jpg | 2026-11-03 15:44 Asia/Macau | 真實 Gyps africanus（Kruger）。 |
| `red_billed_oxpecker` | 紅嘴牛椋鳥 | `assets/savanna/red_billed_oxpecker.png` | Charles J. Sharp | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Red-billed_oxpecker_(Buphagus_erythrorhynchus)_on_impala_(Aepyceros_melampus).jpg | 2026-11-03 15:44 Asia/Macau | — |
| `tick` | 壁蝨 | `assets/savanna/tick.png` | Alan R Walker | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Rhipicephalus-appendiculatus-female-male.jpg | 2026-11-03 15:44 Asia/Macau | 非洲褐耳蜱 Rhipicephalus appendiculatus 標本圖；示意壁蝨節點。 |
| `dung_beetle` | 蜣螂 | `assets/savanna/dung_beetle.png` | AmyAbroad | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Dung_Beetle_Tanzania_2025.jpg | 2026-11-03 15:44 Asia/Macau | — |
| `saprophyte_fungi` | 腐生真菌（示意） | `assets/savanna/saprophyte_fungi.png` | Caine Barlow | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Ganoderma_sp._as_saprophytic_fungus_in_Florentine_Valley.JPG | 2026-11-03 15:44 Asia/Macau | 腐生真菌示意（Ganoderma sp.）；非東非特有種標本。 |

---


## 格式更新（iPad Safari）

- 2026-11-03：為修正 iOS Safari 對 SVG `<image href="…webp">` 常顯示佔位圖嘅問題，教學頁改用 **PNG**（`assets/savanna/<id>.png`，最長邊約 800px）。原 `.webp` 仍保留作來源備份。
- 節點頭像改以 SVG `foreignObject` 內嵌 HTML `<img>`（`object-fit: cover`、圓形）載入；lab 縮圖與詳情面板本來已用 HTML `<img>`，路徑跟 JSON。

## 授權注意（給 Oscar）

1. **CC BY-SA** 圖佔多數：若再散布衍生作品，整體署名＋相同授權條款需可追。
2. **lion**：Commons 頁面標示為 **CC BY 2.5**（非先前候選表寫的 3.0）；以頁面為準。
3. **grass**：塞倫蓋蒂草海景觀示意，非單一禾本科標本近攝。
4. **termite**：白蟻丘示意，非白蟻個體顯微／特寫。
5. **saprophyte_fungi**：Ganoderma 腐生示意（塔斯馬尼亞拍攝），非東非特有種；教學節點允許示意。
6. **tick**：東非相關褐耳蜱 *Rhipicephalus appendiculatus* 標本圖（Alan R Walker）。
7. **white_backed_vulture**：已用真實 *Gyps africanus*（Kruger），非 Hooded Vulture。

## 檢查

- [x] 每物種 1 張 webp 於 build-r4／content
- [x] 本檔已由候選改為落檔完成表
- [x] 詳情／標題層連到本檔

