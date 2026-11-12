/* 本機設定範本（選用，切勿把填有金鑰的版本提交）。
 *
 * 用法：
 *   1. 複製本檔為同目錄的 config.local.js
 *   2. 依需要修改內容
 *   3. config.local.js 已被 .gitignore 忽略，不會進入版本庫
 *
 * 本站預設完全可用：內建 OpenStreetMap、簡約街道（CARTO）、街道圖（CARTO Voyager）
 * 三層免金鑰公開底圖，於地圖右上方圖層選單切換。沒有這個檔也不影響任何功能。
 *
 * ── 若日後要加入官方高德／Google 底圖 ──
 * 需要什麼金鑰：
 *   · 高德：自行向高德開放平台申請的 JS API／Web 服務金鑰，並依其服務條款
 *     取得合法、可公開使用的瓦片來源。
 *   · Google：自行向 Google Maps Platform 申請的 API 金鑰，並啟用對應地圖服務。
 * 如何設定：
 *   在 extraTileLayers 填入「你自己依法取得」的官方瓦片 URL 模板
 *   （須含 {z}／{x}／{y}，金鑰只放在這個本機檔），以及供應商規定的署名文字。
 *
 * 請勿填入來路不明、爬取所得或違反服務條款的瓦片網址；本專案不會內建、
 * 不會推測、也不會硬編碼任何金鑰或非官方瓦片 URL。
 */
window.__MACAU_FOOD_MAP_CONFIG__ = {
  // 預設底圖名稱，須對應 app.js 內建圖層或下方 extraTileLayers 的 name
  defaultBaseLayer: 'OpenStreetMap',

  // 額外的官方／已授權底圖；沒有就保留空陣列
  extraTileLayers: [
    // {
    //   name: '高德地圖（自行授權）',
    //   url: '在此填入你依法取得的官方瓦片 URL 模板，含 {z}/{x}/{y} 與你的金鑰',
    //   attribution: '依供應商規定填寫署名',
    //   maxZoom: 19,
    //   subdomains: 'abcd',
    // },
  ],
};
