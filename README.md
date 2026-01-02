# Teleprompter Pro

一個專業的 Web 提詞器應用程式，支援手機遙控功能。專為內容創作者、演講者和專業錄製者設計。

## 線上演示 (Demo)

[https://teleprompter-pro.zeabur.app/](https://teleprompter-pro.zeabur.app/)

## ✨ 功能特色

### 核心功能
- **直覺編輯**：直接在網頁上貼上或編輯講稿
- **快速操作**：提供「貼上」與「清除」按鈕
- **字體調整**：可隨意調整文字大小
- **滾動速度**：可調整文字向上滾動的速度
- **邊距調整**：可自訂左右邊距

### 專業錄製支援
- **畫面反轉 (Flip)**：支援上下反轉，適用於搭配分光鏡的專業提詞機
- **倒數計時**：播放前 3 秒倒數緩衝
- **全螢幕模式**：沉浸式全螢幕播放
- **視線引導**：水平視線引導線

### 📱 手機遙控
- **QR Code 連線**：掃描即可用手機連線
- **遠端控制**：播放/暫停/倒播
- **速度調整**：即時加速或減速
- **內容編輯**：手機端可即時修改提詞稿（滿屏編輯模式）
- **狀態同步**：即時顯示播放中/倒播中/已暫停
- **防休眠**：自動啟用 NoSleep 防止螢幕關閉

## 🚀 使用方式

### 線上使用
直接開啟 [Demo 網址](https://teleprompter-pro.zeabur.app/)

### 本地運行

```bash
# 1. 複製專案
git clone https://github.com/mch000534/teleprompter_pro.git
cd teleprompter_pro

# 2. 安裝依賴
npm install

# 3. 啟動伺服器
npm start

# 4. 開啟瀏覽器
# 提詞器：http://localhost:4000
# 遙控器：http://[你的IP]:4000/remote.html
```

### 手機遙控連線
1. 確保手機與電腦在同一 Wi-Fi
2. 在提詞器設定頁掃描 QR Code
3. 或直接輸入畫面顯示的網址

## 🛠 技術架構

- **前端**：HTML5, CSS3, Vanilla JavaScript
- **後端**：Node.js + WebSocket (ws)
- **功能**：
  - WebSocket 即時通訊
  - QR Code 動態生成
  - PWA 支援

## 📁 專案結構

```
teleprompter_pro/
├── assets/
│   ├── css/
│   │   ├── style.css      # 主樣式
│   │   └── remote.css     # 遙控器樣式
│   └── js/
│       ├── app.js         # 主應用邏輯
│       └── remote.js      # 遙控器邏輯
├── docs/
│   ├── requirements.md    # 需求文件
│   ├── spec.md           # 規格文件
│   └── todolist.md       # 待辦事項
├── index.html            # 主頁面
├── remote.html           # 遙控器頁面
├── server.js             # WebSocket 伺服器
├── package.json          # 專案設定
├── manifest.json         # PWA 設定
└── zeabur.yaml          # 部署設定
```



## 授權

本專案採用 MIT 授權。
