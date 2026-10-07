# VOCA 單字書 · 學測 4000 + 多益 3000 高頻單字學習系統

### 🔗 線上使用：<https://job159.github.io/VocabularyBook/>

> 📱 手機請用 **Chrome / Safari** 開啟才能發音；勿在 LINE、FB、IG 等 App 內建瀏覽器直接開（不支援語音朗讀）。

一個**商業等級、可離線使用**的英文單字學習網頁，內含**兩本完整單字書**，一鍵切換：

| 單字書 | 字數 | 對象 | 等級標示 |
|--------|------|------|----------|
| 🎓 **學測 4000** | 4,353 字 | 國中～高中（學測/指考） | Level 1–6 |
| 💼 **多益 3000** | 3,000 字 | TOEIC 考生 | 目標分數帶 350+ ～ 900+（金色證書） |

## ✨ 特色

- **雙單字書架構** — 學測與多益一鍵切換，**收藏與學習進度各自獨立儲存**
- **完整單字書配置**，每字包含：
  - 📖 **意思**（繁體中文，多義呈現）
  - 🔤 **詞性**（n./v./adj./adv. …）
  - 🔊 **KK 音標**（台灣通用）＋ **一鍵發音朗讀**
  - 💬 **英文釋義**
  - 🔗 **常見搭配**（多益書為商務情境搭配）
  - ✍️ **例句 ×2~3**（每字 2～3 句中英對照，涵蓋常見用法與多重詞義；多益書為職場/商務/旅遊情境）＋ **每句一鍵朗讀** 🔊
  - 🟰 **同義詞** ＆ 🔁 **反義詞**
  - 🌳 **詞形變化 / 同根詞家族**（如 analyze → analysis／analyst／analytical，強化多益 Part 5 詞性題）
  - ⚠️ **易混淆字辨析**（如 affect／effect、assure／ensure／insure，附中文辨析與記憶提示）
  - 🏷️ **主題分類**（多益書含辦公室、人事、財會、行銷、物流、旅遊、合約等 17 類商務主題）
- **五種題型的隨堂測驗**（兩本書皆適用，開始前可選題型）
  - 🔤 看英選中、🀄 看中選英、✍️ 例句克漏字、🔊 聽音選字、⌨️ 拼字聽寫
  - 自動發音、即時計分、成績回饋；依當前單字書出題，篩選後可針對特定範圍測驗
  - 🔍 即時搜尋（單字 / 中文意思）＋ 多維篩選（等級、主題、詞性、排序）
  - 🃏 **字卡背誦**（翻卡、洗牌、標記學會、鍵盤操作）
- **📕 錯題本**（自動收錄）— **五種題型**任一種答錯,單字都會自動加入錯題本並累計錯誤次數；答對即「訂正」（次數 −1，歸零自動移出）。首頁一鍵檢視、「✕ 錯題本」篩選、卡片/詳解徽章一鍵移除，選單/結算頁可 **「只測錯題」** 並自選題型複習。依書本分開儲存。
- **學習進度追蹤** — 收藏 ♥、「已學會」✓ 與錯題本 ✕ 依書本分開自動儲存，含完成度圓環
- **手機優化** — 44px 觸控目標、防 iOS 聚焦縮放、safe-area 支援、背景捲動鎖定、行動裝置語音解鎖
- **精緻 UI** — 漸層主視覺、玻璃質感工具列、卡片動畫、**深色 / 淺色模式**
- **完全離線** — 純靜態檔案，無需網路、無需後端

## 🚀 使用方式

**方法一（最簡單）：** 直接開啟線上版 <https://job159.github.io/VocabularyBook/>（手機請用 Chrome / Safari，發音才會正常）。

**方法二（本機）：** 直接用瀏覽器開啟 `index.html` 即可使用。

**方法三（本機伺服器，建議開發用）：**
```bash
# 於本資料夾執行
python -m http.server 8777
# 再開啟瀏覽器前往 http://localhost:8777
```

## 📁 檔案結構

| 檔案 | 說明 |
|------|------|
| `index.html` | 主程式（介面 + 所有功能邏輯，含 CSS/JS） |
| `words.js`   | 學測 4000 詞庫（`window.VOCAB` 陣列，4,353 筆） |
| `toeic.js`   | 多益 3000 詞庫（`window.TOEIC` 陣列，3,000 筆） |
| `README.md`  | 本說明文件 |

## ⌨️ 快捷鍵

| 按鍵 | 功能 |
|------|------|
| `/` | 快速聚焦搜尋框 |
| `Space` | 字卡模式翻面 |
| `← / →` | 字卡上一張 / 下一張 |
| `Esc` | 關閉視窗 / 退出模式 |

## 🎨 客製化

- **換色**：編輯 `index.html` 中 `:root` 的 CSS 變數（`--primary`、`--accent` 等）。
- **改資料**：`words.js` / `toeic.js` 為標準 JSON 陣列，可自行增修單字欄位。
- **品牌**：於 `index.html` 的 `BOOKS` 設定物件中修改各書的標題、副標與等級標籤。

## 📝 資料欄位格式

```json
{
  "word": "reimburse",
  "pos": "v.",
  "phonetic": "[ˌriɪmˈbɝs]",
  "meaning": "報銷；償還（費用）",
  "definition": "to pay back money someone has spent for you",
  "collocations": ["reimburse expenses", "fully reimbursed"],
  "example": "The company will reimburse employees for approved travel expenses.",
  "exampleZh": "公司會報銷員工經核准的差旅費用。",
  "examples": [
    { "en": "The company will reimburse employees for approved travel expenses.", "zh": "公司會報銷員工經核准的差旅費用。" },
    { "en": "Please keep your receipts so we can reimburse your expenses.", "zh": "請保留收據，以便我們報銷你的費用。" },
    { "en": "She was fully reimbursed for the cost of the damaged goods.", "zh": "她因損壞的貨品獲得了全額償還。" }
  ],
  "synonyms": ["repay", "refund"],
  "antonyms": ["charge", "withhold"],
  "family": [
    { "w": "reimbursement", "pos": "n.", "zh": "報銷；償還" },
    { "w": "reimbursable", "pos": "adj.", "zh": "可報銷的" }
  ],
  "confusables": [
    { "w": "refund", "zh": "(n./v.) 退款：把已收的錢退回。" }
  ],
  "level": 5,
  "theme": "財務與會計"
}
```

> - **例句（`examples`）** 為 `{ en, zh }` 陣列，每字 **2～3 句**；第一句沿用原 `example`／`exampleZh`（兩欄位仍保留，前端優先讀 `examples`，向下相容）。
> - **`antonyms`** 反義詞字串陣列；**`family`** 詞形變化/同根詞（`{ w, pos, zh }`）；**`confusables`** 易混淆字（`{ w, zh }`，附中文辨析）。三者皆為選填，無適合內容時省略或為空陣列，前端自動隱藏該區塊。

多益書的 `level` 對應目標分數帶：1=350+、2=500+、3=650+、4=750+、5=850+、6=900+（金色證書）。

## ⚠️ 說明

單字資料經 AI 生成並多重驗證（結構檢查、簡體字掃描、去重、覆蓋率核對）。KK 音標為自動標註，若作正式出版用途，建議再經母語者 / 專業編輯校訂。

---

© VOCA 單字書 · 可自由用於教學與商業用途
# Contriburor
**`Eason周`**
- [Eason](https://github.com/easonzh824-droid)