# 排一排（九九乘法表）

澳門小學數學科表內乘法（乘法口訣）的鏡頭互動練習，對象以小學二年級為主，三年級複習亦可。
用手把格子拉開，看見「幾個幾」，再把乘法事實蓋到九九表上。**影像永不離機**：鏡頭畫面只在本機用 MediaPipe 處理，不上傳、不錄製、不追蹤。
這不是官方教材，沒有使用任何機構標誌。

## 主頁與兩種玩法

進入網站先見主頁（標題「排一排」）。鏡頭只會在你按下「開啟鏡頭」之後才開啟，不會自動開。授權成功後，再選擇玩法：

1. **聽一聽，排一排**：題目只規定要排哪一行、哪一列（例如「排成 3 行，每行 4 個」），排好後蓋印。蓋對時自動點亮交換格（3×4 與 4×3；平方數只一格）。沒有自由探索，也沒有「做出一共 N 個」。
2. **九九乘法大挑戰**：題目列出九九表內的一個積（例如 12），請打滿所有行、列都在 1–9、乘積等於該數的格子（12 要蓋 2×6、6×2、3×4、4×3；不含 1×12）。互動區域與乘數表在蓋印前都不顯示乘積；蓋對後該格才展示乘積，並顯示綠色、播「叮」的音效。蓋錯會閃紅並播錯誤音效，錯格不算完成，也不會永久揭開錯誤答案。還沒打滿就顯示「請繼續」。這一玩法不會自動點亮交換格。打滿後會有完成回饋，接著進入下一題。題目用可重現的亂數（可用 `?seed=` 固定），優先選有多個因子對的乘積，並避免連續重複同一題。

若鏡頭被拒絕或不可用，主頁仍會顯示兩種玩法，並說明可用滑鼠／觸控／鍵盤。模式進行中與結果畫面都有「回主頁」。

## 手勢與備用操作

| 動作 | 鏡頭 | 滑鼠／觸控 | 鍵盤 |
| --- | --- | --- | --- |
| 改行列 | 張開手掌：向右＝列變多（1–9），向下＝行變多（1–9）。要在新位置穩定約 200ms 才改 | 拖曳格子右下角圓點；或按行／列的 ＋ − 鈕 | ↑↓ 改行，←→ 改列 |
| 蓋到表上 | 拇指與食指捏合 | 點一下陣列；或按「蓋到表上」 | 空白鍵或 Enter |
| 開始／再玩 | 結果畫面捏合（再玩同一種玩法） | 按鈕，或結果畫面點一下陣列 | 結果畫面按空白鍵再玩；主頁請用 Tab 選按鈕 |
| 靜音 | 按鈕 | 按鈕 | M |

- 手離開畫面後，陣列保持上次大小，可以放手休息。畫面持續顯示「已讀到：3 行 × 4 列」。
- 「聽一聽，排一排」蓋印時自動點亮交換格，並用虛線疊出「換過來」的陣列。不做拍手或 F 鍵快捷。「九九乘法大挑戰」不自動點亮交換格。
- 拒絕鏡頭、沒有鏡頭、不是 https／localhost：直白說明，仍可選玩法，用同一個遊戲的滑鼠／鍵盤版本。不要因沒鏡頭就鎖在主頁。
- 一回最多 4 分鐘，約 90 秒舉手會提示可以放下手。

## 指令

```bash
npm install
npm run dev        # http://localhost:5173（鏡頭只在 localhost 或 https 可用）；會先拷貝 MediaPipe wasm 並下載手部模型
npm test           # vitest：規則、口訣、跳數、因數對、讀數滯後、聽一聽與大挑戰判定
npm run build      # tsc 類型檢查 + 建置到 dist/（相對路徑，可放在任何資料夾）
npm run preview
npm run capture    # 需先 dev；bot 玩一回並截圖（先 npx playwright install chromium）
npm run fps        # DPR 2 的幀率（目標 p95 < 16.8ms）
npm run loud       # 響度
```

## URL 旗標

| 旗標 | 作用 |
| --- | --- |
| `?bot=1` | 合成玩家，走真正的 gesture engine；跳過主頁，直接開始玩法（預設聽一聽），但不會開啟鏡頭 |
| `?mode=listen｜challenge` | 預設玩法。舊的 `explore`、`pattern` 已取消，會被忽略 |
| `?autostart=1` | 略過鏡頭授權步驟，進入玩法選擇（滑鼠／鍵盤）。若同時有 `?mode=`，直接開始該玩法。不會自動開鏡頭 |
| `?mute=1` | 無聲 |
| `?seed=N` | 固定題目（聽一聽的行列題，以及大挑戰的乘積） |
| `?round=S` | 一回最長秒數（預設 240） |
| `?speed=K` | 遊戲時間加快 K 倍 |

`window.__game` 提供 `{ phase, score, caught, time, motes, mode, hand, fps, dpr, best, homeStep, rows, cols, modeId, lit, question, qIndex, solved, challengeTotal, challengeSolved }`。
`score` 在聽一聽是去重後點亮的格數，在大挑戰是已打滿的題數；`caught` 是蓋印次數；`motes` 保留為空陣列（相容舊工具）。

## 檔案地圖

| 檔案 | 負責 |
| --- | --- |
| `src/main.ts` | 接線：輸入 → 規則 → 畫面與聲音；主頁／結果；鏡頭預覽；旗標；`window.__game` |
| `src/rules.ts` | 純函數：81 積、口訣、交換、跳數、因數對、聽一聽題目、大挑戰判定、`Stepper` 滯後 |
| `src/input.ts` | 鏡頭、bot、滑鼠、觸控、鍵盤 → 同一組 `InputEvent` |
| `src/bot.ts` | `?bot=1` 的合成玩家 |
| `src/scene.ts` | 2D Canvas：木桌、陣列、九九表；靜態背景快取；大挑戰隱藏未揭開的乘積 |
| `src/audio.ts` | 程序化 Web Audio（含叮與錯誤音） |
| `src/style.css` | rem 字級、focus-visible、forced-colors |
| `src/pinch.ts` | 模板原有，本專案未使用（捏合門檻改在 `input.ts`） |
| `src/hand-gesture-kit/` | kit 原樣拷貝，不改 |
| `scripts/assets.mjs` | 拷貝 wasm、下載模型 |
| `tests/rules.test.ts` | 單元測試 |

## 可調常數

- `src/input.ts`：`REGION`（鏡頭哪一部分對到全螢幕）、`PINCH_ON`／`PINCH_OFF`、`PINCH_PREPARE`、`FREEZE_MS`、`OPEN_MIN`
- `src/rules.ts`：`STABLE_MS`（200）、`HYST`（0.15 格）、`ROUND_MAX_S`、`QUESTION_COUNT`、`PREFERRED_CHALLENGE_MIN_PAIRS`
- `src/main.ts`：`REST_AFTER_S`（90）、`SESSION_SOFT_S`（480）、`END_DELAY_MS`、`NEXT_Q_DELAY_MS`
- `src/scene.ts`：`ROW_S`（跳數每行秒數）及各色

## 派發時的標頭

`vite.config.ts` 只替 dev／preview 設標頭。正式主機請送：

```
Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=()
Referrer-Policy: strict-origin-when-cross-origin
```

鏡頭只在 https 或 localhost 可用。
