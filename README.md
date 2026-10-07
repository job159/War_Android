# 詞靈幻想 LEXICA

> 答對英文題目，喚醒詞靈的力量。
> 一款以**角色收集與養成**為賣點、以**英文作答**驅動戰鬥的 Android 角色扮演遊戲（直版、離線可玩、雙人連線對戰）。

題庫來自兩個開源專案：

- [job159/VocabularyBook](https://github.com/job159/VocabularyBook)：學測 4000（4,353 字）＋多益 3000（3,000 字），含音標、例句、同反義詞、詞形變化
- [job159/Grammar](https://github.com/job159/Grammar)：44 堂文法課、3,100+ 題實戰題庫、252 篇克漏字題組

完整的需求審視與設計說明見 [docs/DESIGN.md](docs/DESIGN.md)。

## 下載與遊玩

<p align="center"><img src="docs/download-qr.png" width="220" alt="掃描 QR Code 開啟下載頁"></p>

- **手機下載頁**（掃上方 QR Code，任何網路皆可）：https://job159.github.io/War_Android/
- **直接下載最新 APK**：https://github.com/job159/War_Android/releases/latest/download/Lexica.apk
- **在瀏覽器直接玩**（免安裝）：https://job159.github.io/War_Android/play/

安裝：下載 → 開啟 `Lexica.apk` → 依提示允許「安裝未知應用程式」→ 若 Play 安全防護詢問，選「更多詳細資料 → 仍要安裝」。需要 Android 8.0 以上；日後更新直接覆蓋安裝，遊戲進度會保留。
發音使用系統的文字轉語音（TTS）；若沒有聲音，請到系統設定安裝／啟用 Google 文字轉語音的英文語音。

---

## 遊戲特色

| | |
| --- | --- |
| ⚔️ **答題＝戰鬥** | 4 人隊伍自動戰鬥（類似公主連結），**答對題目替全隊充能**，能量滿就點角色卡放奧義（全螢幕 Cut-in）。答得快有 PERFECT／GREAT 加成，連對 5 題進入 FEVER，答錯會暈眩並立刻顯示正解 |
| 👑 **首領破防** | 首領蓄力大招時，限時內答對指定題數就能 **BREAK**：讓它暈眩又破防 |
| 🧚 **26 位詞靈** | 10 SSR／8 SR／8 R，名字本身就是英文單字（Aurora 曙光、Tempest 暴風、Eclipse 日蝕⋯）。六屬性 × 六定位，各有被動、技能、奧義、台詞（英文語音＋中文）、羈絆故事與時裝 |
| 📈 **深度養成** | 等級、★1→★6 升星與覺醒、技能等級、4 格裝備（+15 強化、隨機副屬性、保護符與祝福值）、羈絆送禮、時裝 |
| 🏪 **豪華商城** | 召喚之間（保底、天井、首次十連必得 SSR、每日免費單抽）、雜貨店、神秘商人、鐵匠鋪（強化／鍛造／分解）、時裝店、兌換所（契約之心／競技幣／試煉徽章）、學習通行證 |
| 🗺️ **大量內容** | 主線 12 章 120 關、試煉之塔、3 種每日地下城（三種難度）、每週首領、競技場、練習對戰 |
| ⚡ **複習掃蕩** | 三星關卡可用「5 題複習」代替整場戰鬥直接領獎：刷素材＝複習單字 |
| 🌐 **雙人連線對戰** | 建立 5 位數房號，好友輸入房號即可 4v4 即時 PvP；同一題庫、同一亂數種子，公平比拚答題速度與正確率 |
| 📚 **學習系統** | 間隔重複（SRS）每日複習、錯題本、單字圖鑑、44 課文法講堂＋隨堂測驗、三種模擬考（詞彙／多益 Part 5／學測綜合），全程可用原生 TTS 朗讀 |
| 🎵 **可選配樂** | 程式即時合成的原創配樂：**冒險**、**莊嚴**、**快感**、靜謐四種風格；戰鬥時鼓組進場、FEVER 與首領戰主旋律全開；44 種音效 |
| ✨ **華麗特效** | 70+ 種技能特效、25+ 種奧義演出：加法混色光暈、流星雨、雷鏈、冰晶、黑洞、龍息⋯⋯配合命中停頓、畫面震動與閃光 |
| 🔁 **長期遊玩** | 簽到月曆、每日／每週任務、成就、通行證 50 階、單字掌握里程碑、連續學習天數、存檔匯出／匯入 |

**不含任何真實金錢付費**：魔晶石（鑽石）全部靠學習與遊玩取得。

---

## 怎麼玩

1. **第一次開啟**：輸入名字、選擇詞之書（學測／多益／兩本都要，之後可在設定更換）。
2. **領取見面禮**：主頁左側「信箱」有魔晶石與召喚券，接著到 **商城 → 召喚之間** 做第一次十連，**必得 SSR**。
3. **冒險 → 主線冒險**：第一場戰鬥會有教學。
   - 下方題目答對 → 全隊能量上升；角色卡發光時點擊施放奧義（右上角 AUTO 可自動施放）
   - 答錯會中斷連擊並暈眩，正解與詳解會馬上顯示
   - 三星條件：通關／無人倒下／正確率 80%
4. **角色**：用經驗藥水升級、碎片升星、技能書升技能、穿裝備、送禮提升羈絆。
5. **學習**：每天清掉「到期複習」（主頁的學習卡片會提醒），考模擬考賺大量金幣與魔晶石。
6. **對戰 → 線上對戰**：一人「建立房間」把 5 位數房號給對方，對方「輸入房號」加入，雙方準備好就開打。

---

## 開發

### 環境需求

| 工具 | 用途 |
| --- | --- |
| Node.js 18+ | 打包網頁、開發伺服器、測試 |
| JDK 17 | 編譯 Android 外殼（預設路徑 `%LOCALAPPDATA%\Programs\jdk-17`，或設定 `JAVA_HOME`） |
| Android SDK | build-tools 35.0.0、platforms;android-35（預設 `%LOCALAPPDATA%\Android\Sdk`） |

打包 APK **不需要 Gradle**：`scripts/build-apk.ps1` 直接用 aapt2 → javac → d8 → zipalign → apksigner。

### 常用指令

```bash
npm install          # 安裝開發依賴（esbuild、qrcode）
npm run dev          # 開發伺服器 http://localhost:5180（加 ?frame 以手機寬度顯示）
npm run test         # 核心邏輯測試（出題、SRS、PvP 出題一致性、戰鬥）
npm run sim          # 戰鬥平衡模擬（--sweep 掃全部關卡、--pvp 對戰）
npm run net-test     # 實際連線公開 MQTT 中繼測試房間對戰
npm run build        # 打包網頁 → dist/www，再打包簽署 APK → dist/Lexica.apk
npm run serve        # 區網下載頁（APK＋瀏覽器試玩＋QR Code）
npm run build:site   # 產生公開下載頁＋網頁版 dist/site/（GitHub Pages 用，平常由 GitHub Actions 自動執行）
npm run release      # 把 dist/Lexica.apk 上傳成 GitHub Release v<版本>（-- --notes "更新內容"）
npm run data         # 由 content/ 重新產生題庫 JSON（game/data/）
```

開發測試時也可以不經過 GitHub 直接裝到手機：`npm run serve` 會印出區網網址與 QR Code（手機連同一個 Wi-Fi 掃描即可下載），或用 USB 執行 `adb install -r dist/Lexica.apk`。

除錯版 APK（可用 `chrome://inspect` 檢查 WebView）：

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-apk.ps1 -Debug
```

### ⚠️ 簽章金鑰

第一次打包時會自動產生 `android/keystore/release.jks` 與 `keystore.properties`。

- **請務必備份這兩個檔案**：之後的更新版必須用同一把金鑰簽章，手機才能直接覆蓋安裝（不會清掉存檔）。
- **不要上傳到 GitHub 或任何公開位置**（`.gitignore` 已排除）。

### 發佈新版本

1. 修改 `package.json` 的 `version`（例如 0.2.0；次版號與修訂號須 ≤ 99，會換算成 Android 的 versionCode）。
2. `npm run build`：建置網頁版並用本機金鑰簽署 APK。
3. `git commit` ＋ `git push`：GitHub Actions 會自動重建並部署下載頁與網頁版（GitHub Pages）。
4. `npm run release -- --notes "更新內容"`：用 GitHub CLI 把 APK 上傳成新的 Release。下載頁、QR Code 與 `releases/latest/download/Lexica.apk` 永遠指向最新版，不需要改任何連結。

APK 只在本機簽署（GitHub Actions 只建網頁版），簽署金鑰永遠不會上傳。修改 `game/src/audio/` 的合成或編曲後，要把 `audio/cache.js` 的 `AUDIO_VERSION` 改版，玩家端才會重新合成音樂。

### 專案結構

```
content/            原始題庫（兩個 GitHub 專案的資料檔，含來源 commit）
scripts/            build-data（題庫轉換）、dev、build-web、build-apk.ps1、serve（區網）、build-site（公開下載頁）、release
game/
  index.html, style.css, fonts/
  data/             產生的題庫 JSON（學測、多益、文法）
  src/
    core/           純邏輯，可在 Node 執行：戰鬥模擬、出題、SRS、經濟、扭蛋、任務、存檔
      data/         角色、敵人、關卡、道具、屬性資料
      battle/       戰鬥引擎（sim）、單位建構（setup）、線上鏡像（remote）
      quiz/         題庫、出題器、間隔重複
    art/            程序化 SVG 角色／怪物／圖示
    fx/             粒子引擎、技能特效、戰場繪製、背景
    audio/          合成器、配樂、音效、音訊引擎（離線渲染＋IndexedDB 快取）
    net/            MQTT over WebSocket、房間層
    ui/             畫面路由、彈窗、各畫面（screens/）
android/            WebView 外殼（虛擬 https 來源、原生 TTS、震動、返回鍵、安全區）
tools/              測試、平衡模擬、連線測試、CDP 除錯
docs/               設計文件（DESIGN.md）、README 用的下載 QR Code
.github/workflows/  推送到 main 時自動部署下載頁與網頁版（GitHub Pages）
```

### 技術重點

- 原生 JavaScript（ES modules）＋ esbuild，零執行期依賴；Canvas 2D 戰鬥與粒子特效，DOM/CSS 介面
- 全部美術與音樂都是程式產生，沒有任何外部素材（字型 Cinzel 為 SIL OFL 授權）
- 戰鬥是固定 60Hz、可重播的決定性模擬；線上對戰由房主權威模擬，客人端鏡像
- 線上對戰透過公開 MQTT 中繼（EMQX／HiveMQ／Mosquitto 三台備援），不需要自架伺服器
- 存檔在裝置本機（localStorage），可在「設定」匯出成一段文字、在新手機匯入

---

## 注意事項

- **線上對戰**經由公開的 MQTT 中繼伺服器傳輸，只會送出暱稱、隊伍、表情與對戰資料；房號是唯一的「密碼」，請只分享給要對戰的人。
- 公開中繼伺服器偶爾會不穩定，連線失敗時遊戲會自動換下一台；若都失敗，可以改玩「練習對戰」或「競技場」（不需連線）。
- 單字與文法資料由原專案作者以 AI 生成並驗證，若用於正式出版建議再經專業校訂。

## 授權與致謝

本專案以 [MIT 授權](LICENSE) 開源；建置工具使用 esbuild（MIT）與 qrcode（MIT），所有角色、特效、音效與音樂皆由程式即時生成，沒有第三方素材。

- 單字資料：[job159/VocabularyBook](https://github.com/job159/VocabularyBook)（commit `beaf84a`）
- 文法資料：[job159/Grammar](https://github.com/job159/Grammar)（commit `19fe15d`）
- 字型：[Cinzel](https://fonts.google.com/specimen/Cinzel)（SIL Open Font License，見 `game/fonts/OFL-Cinzel.txt`）

## 關於側載安裝的提醒

Google 已宣布 Android 將要求「側載安裝的 App 也必須來自已驗證的開發者」：2026 年 9 月起先在巴西、印尼、新加坡、泰國實施，2027 年起逐步全球實施（Google 表示會保留給進階使用者的安裝方式）。屆時若無法直接安裝，可改用下載頁的「在瀏覽器直接玩」，或註冊 Google 開發者帳號進行驗證／上架。
