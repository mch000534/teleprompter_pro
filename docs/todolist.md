# 待辦事項清單 (To-Do List)

基於 `requirements.md` 與 `spec.md` 的實作拆解。

## Phase 1: 專案基底與靜態結構 (Project Setup & Static UI)
- [x] **建立專案結構**
    - [x] 建立 `index.html`, `assets/css/style.css`, `assets/js/app.js`。
    - [x] 設定 HTML5 基礎模板與 Meta tags (RWD viewport)。
- [x] **實作 UI 佈局 (Layout)**
    - [x] 建立主要容器：`.app-container`。
    - [x] 建立控制面板區塊：`.control-panel` (包含 Textarea, Sliders, Buttons)。
    - [x] 建立提詞顯示區塊：`.teleprompter-display` 與內部滾動層 `.scroll-content`。
- [x] **基礎樣式 (CSS)**
    - [x] 定義 CSS Variables (Colors, Fonts)。
    - [x] 實作 Flexbox/Grid 佈局，將控制面板置底或置側。
    - [x] 設定顯示區的全黑背景與高對比文字樣式。

## Phase 2: 核心邏輯開發 (Core Logic Development)
- [x] **狀態管理模組 (State Store)**
    - [x] 實作 `State` 物件 (isPlaying, text, fontSize, speed, etc.)。
    - [x] 實作 `updateState()` 輔助函式 (integrated into updateUI)。
- [x] **UI 事件綁定 (Event Binding)**
    - [x] 監聽 `textarea` 輸入，即時更新顯示區文字。
    - [x] 監聽 `font-size` Slider，改變顯示區 CSS `font-size`。
    - [x] 監聽 `speed` Slider，更新 State 中的速度值。
- [x] **滾動引擎 (Scroll Engine)**
    - [x] 實作 `renderLoop()` 與 `requestAnimationFrame` 迴圈。
    - [x] 實作滾動位置計算邏輯 (`scrollTop += speed * multiplier`)。
    - [x] 實作 播放/暫停 按鈕邏輯。
    - [x] 實作 重置 (Reset) 邏輯 (按鈕已移除，由退出功能觸發)。

## Phase 3: 進階功能與視覺效果 (Advanced Features & Visuals)
- [x] **畫面反轉功能 (Flip Feature)**
    - [x] 實作「上下反轉」Toggle 按鈕。
    - [x] 在 CSS 中新增 `.flipped` class (`transform: scaleY(-1)`).
    - [x] 綁定按鈕事件以切換 `.teleprompter-display` 的 class。
- [x] **鍵盤快捷鍵 (Keyboard Shortcuts)**
    - [x] 實作 `Space` 鍵切換播放/暫停。
    - [x] 實作 `Esc` 鍵重置或退出。
    - [x] (選用) `Up/Down` 鍵微調位置。

## Phase 3.5: 沉浸式體驗優化 (Immersive Experience)
- [x] **視線引導線**
    - [x] 新增 HTML `.guide-line` 元素。
    - [x] CSS 設定絕對定位於螢幕中央，半透明白色。
- [x] **播放模式 UI 切換**
    - [x] 在 `togglePlay()` (via `updateUI`) 中切換 Body class `.is-playing`。
    - [x] CSS 實作 `.is-playing` 狀態下的控制面板隱藏與顯示區全螢幕化。
    - [x] 確保暫停/重置時能恢復原狀。

## Phase 3.6: UI Refinements (Exit Button, Margins, Styling)
- [x] **Flip Indicator 樣式調整**
    - [x] 修改背景色為深灰色。
- [x] **退出播放按鈕**
    - [x] 在 HTML 新增 `#btnExit`。
    - [x] CSS 定位與反轉樣式 (`scaleY(-1)` when flipped)。
    - [x] JS 綁定點擊事件 (停止播放)。
- [x] **邊距控制 (Margin Control)**
    - [x] 新增 HTML Slider `#marginSlider`。
    - [x] JS `State.margin` 邏輯與 `updateUI` 連動 (控制 `.scroll-content` 寬度)。

    - [x] JS `State.margin` 邏輯與 `updateUI` 連動 (控制 `.scroll-content` 寬度)。
    - [x] **全頁設定模式 (Full Page Settings)**
        - [x] 修改 CSS 使 `.control-panel` 預設佔滿全螢幕。
        - [x] 播放時隱藏 `.control-panel` 並顯示 `.teleprompter-display`。
        - [x] 調整按鈕佈局：播放按鈕置頂，反轉按鈕改為 Toggle Switch。
    - [x] **快速操作按鈕 (Paste & Clear)**
        - [x] 新增貼上按鈕於輸入框旁。
        - [x] JS 實作剪貼簿讀取功能。
        - [x] 新增清除按鈕與相關邏輯。
    - [x] **倒數計時功能**
        - [x] 新增倒數覆蓋層 (3-2-1 Animation)。
        - [x] 新增設定開關 (Toggle Switch)。
        - [x] 實作播放前倒數邏輯。

## Phase 3.7: Touch Interaction & Native Fullscreen Support
- [x] **觸控滾動 (Touch Scroll)**
    - [x] 監聽 `touchstart`, `touchmove`, `touchend`。
    - [x] 實作手動拖曳滾動邏輯。
    - [x] 解決與自動播放的衝突 (手勢時暫停)。
- [x] **全螢幕按鈕**
    - [x] HTML 新增 `#btnFullscreen`。
    - [x] JS 實作 `toggleFullscreen` 邏輯。
    - [x] CSS 樣式 (與 Exit 按鈕排版)。
    - [x] 連動邏輯：退出播放時自動退出全螢幕。

## Phase 4: 測試與優化 (Testing & Optimization)
- [ ] **功能驗收**
    - 驗證 AC 1.1 (文字輸入無卡頓)。
    - 驗證 AC 2.1 (字體大小即時預覽)。
    - 驗證 AC 3.1 (速度控制有效)。
    - 驗證 AC 4.1 & 4.2 (反轉顯示與反轉時的滾動方向正確性)。
- [ ] **邊界測試**
    - 測試空文字或極短文字的行為。
    - 測試滾動到底部的停止行為。

## Phase 5: WebSocket 手機遙控 (Remote Control via WebSocket)
- [x] **伺服器端**
    - [x] 建立 `package.json` (依賴 ws, qrcode)
    - [x] 建立 `server.js` (HTTP + WebSocket 伺服器)
- [x] **提詞器整合**
    - [x] 修改 `index.html` 新增 QR Code 區塊
    - [x] 修改 `app.js` 新增 WebSocket 客戶端
    - [x] 新增 QR Code 樣式至 `style.css`
- [x] **手機遙控器**
    - [x] 建立 `remote.html` 遙控器頁面
    - [x] 建立 `remote.css` 遙控器樣式
    - [x] 建立 `remote.js` 遙控器邏輯
- [x] **功能實作**
    - [x] 播放/暫停/停止控制
    - [x] 速度調整 (加速/減速)
    - [x] 手動滾動 (上/下)
    - [x] 即時修改提詞內容
    - [x] 狀態同步顯示

## Phase 6: 遙控器增強功能 (Remote Control Enhancement)
- [x] **倒播功能**
    - [x] 新增 `isReversing` 狀態管理
    - [x] 修改 `renderLoop` 支援反向滾動
    - [x] 到達頂部/底部自動停止
    - [x] 遙控器顯示「倒播中」狀態
- [x] **暫停功能優化**
    - [x] 空白鍵暫停/繼續而非退出全屏
    - [x] 倒播按鈕支援暫停倒播
    - [x] 播放按鈕支援暫停播放
- [x] **遙控器 UI 優化**
    - [x] 深灰色主題
    - [x] 禁用音點選取（編輯器除外）
    - [x] 禁用雙指縮放
    - [x] 橫向螢幕警告（請轉為直向）
    - [x] 按鈕佔滿畫面寬度
- [x] **滿屏編輯功能**
    - [x] 新增展開/收起按鈕
    - [x] 點擊展開後顯示全屏編輯器
    - [x] 預設隱藏輸入框，簡化主介面
- [x] **NoSleep.js 整合**
    - [x] 防止手機螢幕休眠
    - [x] 頁面載入時啟用
- [x] **電腦端狀態指示標優化**
    - [x] 連線狀態圓點樣式（紅/綠）
    - [x] 未連線時紅燈閃爍動畫

## Phase 7: 手勢控制 (Gesture Control)
- [x] **手勢控制頁面**
    - [x] 建立 `gesture.html` 頁面
    - [x] 建立 `gesture.css` 樣式
    - [x] 建立 `gesture.js` 邏輯
    - [x] 在 `remote.html` 新增入口按鈕
- [x] **手勢功能實作**
    - [x] 上滑加速 (+5)
    - [x] 下滑減速 (-5，最小值為 5)
    - [x] 右滑正向播放
    - [x] 左滑倒播
    - [x] 單擊暫停/繼續（保持原有方向）
    - [x] 進入頁面自動開始播放
    - [x] 加減速後自動按原方向恢復播放
- [x] **UI 與穩定性優化**
    - [x] 返回按鈕
    - [x] 狀態顯示區
    - [x] 全螢幕觸控區域
    - [x] 操作說明移至手勢區域內部
    - [x] 整合 NoSleep.js 防止休眠
    - [x] 視覺回饋動畫
    - [x] 更新全域預設速度為 5
