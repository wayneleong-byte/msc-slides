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


<!-- AUTO:eco-assets -->

# 其他生態系圖像（2026-11-03 18:00 Asia/Macau）

## `temperate_forest`（13／13）
| species id | 中文 | 本地路徑 | 作者 | 授權 | 來源頁 | 備註 |
|---|---|---|---|---|---|---|
| `oak` | 櫟樹 | `assets/temperate_forest/oak.png` | NickShaforostoff | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3AQuercus_robur.jpg | — |
| `pine` | 松樹 | `assets/temperate_forest/pine.png` | Lakkahillo | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3APinus_sylvestris.jpg | — |
| `birch` | 樺樹 | `assets/temperate_forest/birch.png` | Willow | CC BY 2.5 | https://commons.wikimedia.org/wiki/File%3ABetula_pendula_001.jpg | — |
| `understory_herb` | 林下草本／漿果 | `assets/temperate_forest/understory_herb.png` | T. Kebert | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3AVaccinium_myrtillus_fruits_TK_2021-07-10_2.jpg | 林下漿果／草本示意 |
| `deer` | 鹿 | `assets/temperate_forest/deer.png` | Tiia Monto | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3ACapreolus_capreolus.jpg | Cervidae 示意 |
| `hare` | 野兔 | `assets/temperate_forest/hare.png` | For use outside of Wikimedia projects, you have to credit also with hyperlink. For other licenses or terms of use contac | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3AEuropean_Hare.jpg | — |
| `squirrel` | 松鼠 | `assets/temperate_forest/squirrel.png` | D. Gordon E. Robertson | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3ARed_squirrel.jpg | — |
| `woodpecker` | 啄木鳥 | `assets/temperate_forest/woodpecker.png` | Andy Morffew | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3AGreat_Spotted_Woodpecker.jpg | — |
| `fox` | 狐 | `assets/temperate_forest/fox.png` | Böhringer Friedrich | CC BY-SA 2.5 | https://commons.wikimedia.org/wiki/File%3ARotfuchs.jpg | — |
| `owl` | 貓頭鷹 | `assets/temperate_forest/owl.png` | Dean Eades BirdMad | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3ATawny_owl.jpg | — |
| `bark_beetle` | 樹皮甲蟲 | `assets/temperate_forest/bark_beetle.png` | Daniel Adam, Office National des Forêts, Bugwood.org | CC BY 3.0 us | https://commons.wikimedia.org/wiki/File%3AIps_typographus.jpg | 樹皮甲蟲示意（Ips／Scolytinae） |
| `earthworm` | 蚯蚓 | `assets/temperate_forest/earthworm.png` | Kulmalukko | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3ALumbricus_terrestris.jpg | — |
| `forest_fungi` | 林木真菌 | `assets/temperate_forest/forest_fungi.png` | Strobilomyces | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3ABoletus_edulis_EtgHollande_041031_091.jpg | 林木真菌示意 |

## `mangrove`（12／12）
| species id | 中文 | 本地路徑 | 作者 | 授權 | 來源頁 | 備註 |
|---|---|---|---|---|---|---|
| `red_mangrove` | 紅樹 | `assets/mangrove/red_mangrove.png` | Bob Peterson | CC BY 2.0 | https://commons.wikimedia.org/wiki/File%3ABaby_red_mangrove_%28Rhizophora_mangle%29.jpg | — |
| `mangrove_algae` | 附生藻類／底藻 | `assets/mangrove/mangrove_algae.png` | Raquel Sánchez de Pedro | CC BY-SA 3.0 es | https://commons.wikimedia.org/wiki/File%3ABostrychia_scorpioides.JPG | 紅樹附生紅藻 Bostrychia scorpioides（真附生） |
| `fiddler_crab` | 招潮蟹 | `assets/mangrove/fiddler_crab.png` | xpda | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3ALeptuca_pugilator_P1010521a.jpg | — |
| `mudskipper` | 彈塗魚 | `assets/mangrove/mudskipper.png` | 9old9 | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3AMudskipper.jpg | — |
| `shrimp` | 蝦類 | `assets/mangrove/shrimp.png` | self | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3APenaeus_monodon.jpg | 蝦類示意 |
| `snail` | 紅樹林螺 | `assets/mangrove/snail.png` | self | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3ATerebralia_palustris.jpg | 紅樹林螺示意 |
| `mangrove_fish` | 河口雜食魚 | `assets/mangrove/mangrove_fish.png` | AVNJ | CC BY 4.0 | https://commons.wikimedia.org/wiki/File%3ALutjanus_apodus_405810893.jpg | 河口／紅樹林雜食魚示意 |
| `egret` | 鷺鳥 | `assets/mangrove/egret.png` | El Golli Mohamed | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3AAigrette_garzette_au_lac_sud_de_Tunis_%28site_RAMSAR%29.jpg | — |
| `kingfisher` | 翠鳥 | `assets/mangrove/kingfisher.png` | Pkuczynski | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3AAlcedo_atthis_3_%28Lukasz_Lukasik%29.jpg | — |
| `barnacle` | 藤壺 | `assets/mangrove/barnacle.png` | J. C. McConnell | Public domain | https://commons.wikimedia.org/wiki/File%3ABalanus.jpg | — |
| `mangrove_fungi` | 紅樹林真菌 | `assets/mangrove/mangrove_fungi.png` | Achim Lammerts (Syntaxys) | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3A2025-10-30_D500-1400_Achim-Lammerts_Schizophyllum-commune.jpg | 木材腐生真菌示意（紅樹林碎屑鏈） |
| `polychaete` | 多毛類 | `assets/mangrove/polychaete.png` | No machine-readable author provided. M.Buschmann assumed (based on copyright claims). | Public domain | https://commons.wikimedia.org/wiki/File%3ANereis_diversicolor.jpg | 多毛類示意 |

## `freshwater_lake`（11／11）
| species id | 中文 | 本地路徑 | 作者 | 授權 | 來源頁 | 備註 |
|---|---|---|---|---|---|---|
| `phytoplankton` | 浮游植物 | `assets/freshwater_lake/phytoplankton.png` | Onco p53 | Public domain | https://commons.wikimedia.org/wiki/File%3AAsterionella_formosa.jpg | 浮游植物／藻類示意 |
| `aquatic_plant` | 沉水／挺水植物 | `assets/freshwater_lake/aquatic_plant.png` | MPF | Public domain | https://commons.wikimedia.org/wiki/File%3AElodea_canadensis.jpg | 水生植物示意 |
| `zooplankton` | 浮游動物 | `assets/freshwater_lake/zooplankton.png` | AnastasiaObradovych | CC BY 4.0 | https://commons.wikimedia.org/wiki/File%3ADaphnia_magna.jpg | 浮游動物（水蚤等）示意 |
| `benthic_invert` | 底棲無脊椎 | `assets/freshwater_lake/benthic_invert.png` | Jasper Nance (via lamiot) | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3ABloodworm.jpg | 搖蚊幼蟲／底棲無脊椎示意 |
| `snail_lake` | 淡水螺 | `assets/freshwater_lake/snail_lake.png` | Ayodele Adeniji | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3AFreshwater_snail.jpg | — |
| `omnivore_fish` | 雜食魚 | `assets/freshwater_lake/omnivore_fish.png` | Dezidor | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File%3ACyprinus_carpio.jpeg | 雜食魚（鯉科）示意 |
| `piscivore_fish` | 肉食魚 | `assets/freshwater_lake/piscivore_fish.png` | Gunter Küchler / Berlin ( Masturbius ) | Public domain | https://commons.wikimedia.org/wiki/File%3ASmall_Pike.jpg | 肉食魚（梭魚／鱸）示意 |
| `waterbird` | 水鳥 | `assets/freshwater_lake/waterbird.png` | Andreas Trepte | CC BY-SA 2.5 | https://commons.wikimedia.org/wiki/File%3AAnas_platyrhynchos_male.jpg | 水鳥示意 |
| `amphipod` | 端足類 | `assets/freshwater_lake/amphipod.png` | JG Coleman | CC BY 3.0 | https://commons.wikimedia.org/wiki/File%3AGammarus.jpg | 淡水端足類示意 |
| `lake_fungi` | 湖泊真菌 | `assets/freshwater_lake/lake_fungi.png` | Lamiot | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File%3AVoile_blanch%C3%A2tre_champignon_aquatique%2C_bact%C3%A9ries_Bois_de_la_Citadelle%2C_Lille%2C_d%C3%A9cembre_03.jpg | 水生／沉木真菌示意 |
| `fish_parasite` | 魚寄生蟲 | `assets/freshwater_lake/fish_parasite.png` | Robert Taylor | CC BY 4.0 | https://commons.wikimedia.org/wiki/File%3AGenus_Argulus_Fish_Louse_Rob_Taylor.jpg | 魚虱 Argulus 示意 |
