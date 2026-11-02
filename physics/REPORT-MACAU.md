# 總管短報｜緊急修正 t274u（2026-11-02 Asia/Macau）

路徑：`/workspace/deliverables/atlas-physics-macau/macau-zh/`  
**未推 GitHub Pages／未部署。**

## 1. 改動摘要（三項）

1. **公式中文化**：`equations/index.html` 為書面語繁中主版（符號旁說明、方程表標題、單位／字首說明）；`equations/index-en.html` 保留英文。中文章內「公式表」鏈結進繁中版，英文章進 `index-en.html`。
2. **練習題中文**：`zh/{fluids,energy,circuits,newton,momentum,induction,magnetism,optics}/practice.js` 題幹／選項／解析已改書面語繁體（禁粵語口語）；`en/**/practice.js` 保持英文；數值與 model 計算未改。
3. **光學重做**：`zh/optics/` 與 `en/optics/` 取消機械 explode（`noExplode: true`，無非零 `ex`）；改為光線／法線／角度教學場景，反射與折射可用滑桿調入射角並即時更新。

## 2. 本地開啟

```bash
cd /workspace/deliverables/atlas-physics-macau/macau-zh
python3 -m http.server 8765
```

- 根入口：http://127.0.0.1:8765/
- 中文光學：http://127.0.0.1:8765/zh/optics/
- 英文光學：http://127.0.0.1:8765/en/optics/
- 繁中公式：http://127.0.0.1:8765/equations/
- 英文公式：http://127.0.0.1:8765/equations/index-en.html

（本機已抽查上述路徑 HTTP 200。）

## 3. 光學而家點擊／拖曳做咩

| 操作 | 行為 |
|------|------|
| 翻頁／導航 | 六站：影子 → 反射 → 平面鏡 → 折射 → 色散 → 凸透鏡（僅 senior） |
| **點擊物件** | 開左欄「說明」plate：光學原理與即時量度（i、r、n、物距像距等）；**不會**零件爆炸拆解 |
| **反射／折射頁滑桿** | 改變入射角（約 10°–70°）；反射角自動跟上（i＝r）；折射角依斯涅爾更新；畫面光線與 readout 同步 |
| 畫面標籤 | 入射線／反射線／折射線／法線／影子等書面語（或英文版對應）標示 |
| 右下 readout | 顯示當頁 θᵢ、θᵣ（或 θₜ）、n、f／u／v 等 |

## 4. 未完成／可續

- 光學無 `checks.mjs`；透鏡為定性＋薄透鏡公式 readout，未做完整物像動畫拖曳。
- 非光學章部分圖軸／PLATES `facts` 列標偶有英文殘留（練習題正文已中文化）。
- 練習題選項中純公式字串（如 `${f(...)} N`）維持符號，屬預期。
- 未做公開部署；展教前建議術語與基力對照再簽核。

## 署名與授權

各入口／頁腳：澳門科學館 Oscar 製作／Produced by Oscar, Macao Science Center；保留 MIT／上游 Nathan Liow 版權聲明。
