/* =========================================================
   GRAMMAR PRO — 課程資料（完整版）
   國高中 / 學測 / 多益 英文文法教學
   8 大主題 · 44 堂課，涵蓋學測與多益核心文法考點
   ========================================================= */

const CATEGORIES = [
  { id: "tense",   name: "動詞時態",   en: "Tenses",           icon: "⏱",  c1: "#0ea5e9", c2: "#38bdf8", desc: "掌握時間軸，說對每一個動作" },
  { id: "voice",   name: "語態與語氣", en: "Voice & Mood",     icon: "🔁", c1: "#8b5cf6", c2: "#a855f7", desc: "被動、假設，讓句子更成熟" },
  { id: "clause",  name: "子句與連接", en: "Clauses",          icon: "🔗", c1: "#6366f1", c2: "#818cf8", desc: "把短句串成有層次的長句" },
  { id: "word",    name: "詞類與用法", en: "Word Usage",       icon: "🧩", c1: "#f97316", c2: "#fb923c", desc: "冠詞、介系詞、代名詞、助動詞" },
  { id: "compare", name: "比較與修飾", en: "Comparison",       icon: "📊", c1: "#10b981", c2: "#34d399", desc: "比較級、形容詞副詞與分詞" },
  { id: "syntax",  name: "句型結構",   en: "Sentence Syntax",  icon: "🏗", c1: "#06b6d4", c2: "#22d3ee", desc: "倒裝、強調、附加問句、句型" },
  { id: "verb",    name: "動詞句型",   en: "Verb Patterns",    icon: "⚡", c1: "#f59e0b", c2: "#fbbf24", desc: "使役、感官、片語與特殊句型" },
  { id: "biz",     name: "多益商用",   en: "Business / TOEIC", icon: "💼", c1: "#f43f5e", c2: "#fb7185", desc: "職場情境與高頻文法陷阱" },
];

const LESSONS = [
  /* =====================================================
     ① 動詞時態 TENSES
     ===================================================== */
  {
    id: "present-simple-cont",
    cat: "tense", level: "基礎",
    title: "現在簡單式 vs 現在進行式",
    en: "Present Simple vs Continuous",
    summary: "「習慣事實」用簡單式，「此刻正在」用進行式。分清楚，時態就穩了一半。",
    structure: [
      { label: "現在簡單式", formula: "S + V(-s/es) + …", tone: "a" },
      { label: "現在進行式", formula: "S + am/is/are + V-ing", tone: "b" },
    ],
    examples: [
      { en: "She works at a bank.", zh: "她在銀行上班。（長期事實）" },
      { en: "She is working from home today.", zh: "她今天在家工作。（此刻／暫時）", note: "today 暗示暫時狀態" },
      { en: "Water boils at 100°C.", zh: "水在攝氏 100 度沸騰。（科學真理，恆用簡單式）" },
      { en: "Look! The bus is coming.", zh: "看！公車來了。（眼前正在發生）" },
    ],
    tips: [
      "頻率副詞 always / usually / often / every day → 現在簡單式。",
      "now / right now / at the moment / Look! / Listen! → 現在進行式。",
      "感官與狀態動詞（know, like, want, believe, own）通常不用進行式。",
    ],
    pitfalls: [
      { wrong: "I am knowing the answer.", right: "I know the answer.", why: "know 是狀態動詞，不用進行式。" },
      { wrong: "He go to school every day.", right: "He goes to school every day.", why: "第三人稱單數要加 -es。" },
    ],
    quiz: [
      { q: "My brother ___ tennis every weekend.", opts: ["plays", "is playing", "play", "playing"], a: 0, ex: "every weekend 是習慣，用現在簡單式；第三人稱單數 → plays。" },
      { q: "Be quiet! The baby ___.", opts: ["sleeps", "sleep", "is sleeping", "slept"], a: 2, ex: "此刻正在睡，用現在進行式。" },
      { q: "I ___ what you mean.", opts: ["am understanding", "understand", "understands", "understanding"], a: 1, ex: "understand 為狀態動詞，用簡單式。" },
    ],
  },
  {
    id: "present-perfect",
    cat: "tense", level: "進階",
    title: "現在完成式",
    en: "Present Perfect",
    summary: "連接「過去」與「現在」：做過的事影響到現在，或從過去持續到現在。",
    structure: [
      { label: "肯定", formula: "S + have/has + p.p.", tone: "a" },
      { label: "否定", formula: "S + have/has + not + p.p.", tone: "b" },
      { label: "疑問", formula: "Have/Has + S + p.p. ?", tone: "c" },
    ],
    examples: [
      { en: "I have finished my homework.", zh: "我（已經）寫完功課了。（結果影響現在）" },
      { en: "She has lived here for ten years.", zh: "她住這裡十年了。（持續到現在）", note: "for + 一段時間" },
      { en: "Have you ever been to Japan?", zh: "你去過日本嗎？（人生經驗）", note: "ever 用於疑問" },
      { en: "They have just arrived.", zh: "他們剛到。（just = 剛剛）" },
    ],
    tips: [
      "常見時間詞：already, yet, just, ever, never, since, for, recently, so far。",
      "for + 一段時間（for 3 years）；since + 時間起點（since 2020）。",
      "have been to = 去過（回來了）；have gone to = 去了（還沒回來）。",
    ],
    pitfalls: [
      { wrong: "I have seen him yesterday.", right: "I saw him yesterday.", why: "yesterday 是明確過去時間，要用過去簡單式。" },
      { wrong: "She has went home.", right: "She has gone home.", why: "完成式用過去分詞 gone，不是 went。" },
    ],
    quiz: [
      { q: "We ___ each other since high school.", opts: ["know", "knew", "have known", "are knowing"], a: 2, ex: "since 表從過去持續到現在，用現在完成式。" },
      { q: "___ you ever ___ sushi?", opts: ["Did / eat", "Have / eaten", "Have / ate", "Do / eat"], a: 1, ex: "ever 問經驗，用 Have + p.p.（eaten）。" },
      { q: "He isn't home. He ___ to the office.", opts: ["has been", "has gone", "went", "goes"], a: 1, ex: "人不在家＝去了還沒回，用 has gone to。" },
    ],
  },
  {
    id: "perfect-continuous",
    cat: "tense", level: "精熟",
    title: "完成進行式",
    en: "Perfect Continuous",
    summary: "強調動作「持續進行、尚未結束」，特別點出「已經做了多久」。",
    structure: [
      { label: "現在完成進行式", formula: "S + have/has + been + V-ing", tone: "a" },
      { label: "過去完成進行式", formula: "S + had + been + V-ing", tone: "b" },
    ],
    examples: [
      { en: "I have been studying for three hours.", zh: "我已經讀了三個小時了。（現在仍在讀）" },
      { en: "She has been working here since 2018.", zh: "她從 2018 年起一直在這裡工作。" },
      { en: "My eyes hurt. I've been reading all day.", zh: "我眼睛好痛，我讀了一整天。", note: "強調過程留下的結果" },
      { en: "They had been waiting for an hour when the bus came.", zh: "公車來時，他們已經等了一小時。", note: "過去某時之前持續" },
    ],
    tips: [
      "完成進行式強調「持續的過程」；完成式強調「完成的結果」。",
      "常搭配 for / since / all day / how long。",
      "狀態動詞（know, believe）不用進行式，改用完成式。",
    ],
    pitfalls: [
      { wrong: "I am studying for three hours.", right: "I have been studying for three hours.", why: "表持續一段時間到現在，用現在完成進行式。" },
    ],
    quiz: [
      { q: "How long ___ you ___ English?", opts: ["have / learned", "have / been learning", "are / learning", "did / learn"], a: 1, ex: "問持續多久且仍在學，用現在完成進行式。" },
      { q: "He was tired because he ___ all night.", opts: ["drove", "has driven", "had been driving", "drives"], a: 2, ex: "累的原因是「一直開車到那時」，用過去完成進行式。" },
    ],
  },
  {
    id: "past-continuous",
    cat: "tense", level: "基礎",
    title: "過去進行式",
    en: "Past Continuous",
    summary: "描述「過去某時間點正在進行」的動作，常當另一動作發生時的背景。",
    structure: [
      { label: "過去進行式", formula: "S + was/were + V-ing", tone: "a" },
      { label: "中斷句型", formula: "When + 過去式, S + was/were + V-ing", tone: "b" },
    ],
    examples: [
      { en: "I was watching TV at 8 p.m.", zh: "我晚上八點在看電視。" },
      { en: "While she was cooking, the phone rang.", zh: "她在煮飯時電話響了。", note: "長動作用進行式，短動作用過去式" },
      { en: "They were playing when it started to rain.", zh: "開始下雨時他們正在玩。" },
    ],
    tips: [
      "when + 過去簡單式（短、突發）；while + 過去進行式（長、背景）。",
      "兩個同時進行的長動作都用過去進行式：While I was reading, she was cooking.",
      "表過去某時刻正在進行的狀態，一定用過去進行式。",
    ],
    pitfalls: [
      { wrong: "When she called, I cooked dinner.", right: "When she called, I was cooking dinner.", why: "電話打來時「正在」煮飯，背景動作用過去進行式。" },
    ],
    quiz: [
      { q: "What ___ you ___ at 9 last night?", opts: ["did / do", "were / doing", "are / doing", "was / do"], a: 1, ex: "問過去某時正在做什麼，用過去進行式。" },
      { q: "While we ___ dinner, the lights went out.", opts: ["had", "were having", "have", "are having"], a: 1, ex: "用餐中途燈熄了，背景長動作用過去進行式。" },
    ],
  },
  {
    id: "past-perfect",
    cat: "tense", level: "進階",
    title: "過去式 vs 過去完成式",
    en: "Past Simple vs Past Perfect",
    summary: "兩件過去的事，「更早發生」的那件用過去完成式（had + p.p.）。",
    structure: [
      { label: "過去簡單式", formula: "S + V-ed", tone: "a" },
      { label: "過去完成式", formula: "S + had + p.p.", tone: "b" },
    ],
    examples: [
      { en: "The train had left when we arrived.", zh: "我們到的時候火車已經開走了。", note: "先走(had left) 再到(arrived)" },
      { en: "She had studied French before she moved to Paris.", zh: "她搬去巴黎前就學過法文了。" },
      { en: "I realized I had forgotten my keys.", zh: "我發現我把鑰匙忘了。（忘在先，發現在後）" },
    ],
    tips: [
      "時間標記：before, after, by the time, already, when。",
      "「過去的過去」用 had + p.p.，讓時間先後一目了然。",
      "by the time + 過去式，主句常搭配過去完成式。",
    ],
    pitfalls: [
      { wrong: "After I have eaten, I went out.", right: "After I had eaten, I went out.", why: "兩件都在過去，較早的用過去完成式。" },
    ],
    quiz: [
      { q: "By the time the movie started, we ___ our popcorn.", opts: ["finish", "finished", "had finished", "have finished"], a: 2, ex: "電影開始前就吃完，較早動作用過去完成式。" },
      { q: "He told me he ___ the report already.", opts: ["sent", "had sent", "sends", "has sent"], a: 1, ex: "告訴我(過去) 之前就寄了(更早)，用 had sent。" },
    ],
  },
  {
    id: "future",
    cat: "tense", level: "基礎",
    title: "未來式的三種表達",
    en: "Talking about the Future",
    summary: "will、be going to、現在進行式各有語感：臨時決定、計畫預期、已排定安排。",
    structure: [
      { label: "臨時決定／預測", formula: "S + will + V", tone: "a" },
      { label: "計畫／有跡象", formula: "S + be going to + V", tone: "b" },
      { label: "已安排行程", formula: "S + be + V-ing", tone: "c" },
    ],
    examples: [
      { en: "The phone is ringing. I'll get it.", zh: "電話響了，我去接。（當下決定 → will）" },
      { en: "I'm going to start a business.", zh: "我打算創業。（既定計畫 → be going to）" },
      { en: "Look at those clouds! It's going to rain.", zh: "看那些雲！要下雨了。（有跡象 → be going to）" },
      { en: "We're meeting the client at 3 p.m.", zh: "我們下午三點要見客戶。（已排定 → 進行式）" },
    ],
    tips: [
      "will：說話當下才決定、或單純預測。",
      "be going to：先前就有的打算，或眼前有徵兆的預測。",
      "現在進行式表未來：時間地點都定好的安排（多用於行程）。",
    ],
    pitfalls: [
      { wrong: "I will can help you.", right: "I will be able to help you.", why: "will 後面接原形，不能兩個助動詞疊用。" },
    ],
    quiz: [
      { q: "A: The bags look heavy. B: I ___ you.", opts: ["help", "am helping", "'ll help", "helped"], a: 2, ex: "看到才決定幫忙，臨時決定用 will。" },
      { q: "Careful! You ___ fall!", opts: ["will", "are going to", "would", "won't"], a: 1, ex: "眼前有徵兆的預測，用 be going to。" },
    ],
  },
  {
    id: "future-perfect",
    cat: "tense", level: "進階",
    title: "未來完成式與未來進行式",
    en: "Future Perfect & Continuous",
    summary: "「未來某時之前會完成」用未來完成式；「未來某時正在進行」用未來進行式。",
    structure: [
      { label: "未來完成式", formula: "S + will have + p.p.", tone: "a" },
      { label: "未來進行式", formula: "S + will be + V-ing", tone: "b" },
    ],
    examples: [
      { en: "By 2030, I will have graduated.", zh: "到 2030 年我就畢業了。", note: "by + 未來時間" },
      { en: "This time tomorrow, I will be flying to Tokyo.", zh: "明天此時我正在飛往東京。" },
      { en: "She will have finished the report by Friday.", zh: "她週五前會把報告寫完。" },
    ],
    tips: [
      "未來完成式常搭 by + 未來時間 / by the time。",
      "未來進行式：this time tomorrow / at 5 p.m. tomorrow「正在進行」。",
      "by the time + 現在式（不用未來式），主句用未來完成式。",
    ],
    pitfalls: [
      { wrong: "By next year, I will finish the course.", right: "By next year, I will have finished the course.", why: "by + 未來時間表「之前完成」，用未來完成式。" },
    ],
    quiz: [
      { q: "By the time you arrive, we ___ dinner.", opts: ["will finish", "will have finished", "finish", "finished"], a: 1, ex: "你到達之前已完成，用未來完成式。" },
      { q: "Don't call at 8; I ___ then.", opts: ["will study", "will be studying", "study", "am studying"], a: 1, ex: "那個時間點正在讀書，用未來進行式。" },
    ],
  },
  {
    id: "tense-agreement",
    cat: "tense", level: "精熟",
    title: "時態一致與轉述",
    en: "Sequence of Tenses",
    summary: "主要子句是過去式時，從屬子句時態通常「往過去退一步」（轉述句最常考）。",
    structure: [
      { label: "直述改間接", formula: "say “I am busy” → said (that) S + was busy", tone: "a" },
      { label: "助動詞後退", formula: "will→would · can→could · may→might", tone: "b" },
    ],
    examples: [
      { en: "He said (that) he was tired.", zh: "他說他累了。", note: "is → was" },
      { en: "She told me she would come.", zh: "她告訴我她會來。", note: "will → would" },
      { en: "The teacher said the earth is round.", zh: "老師說地球是圓的。", note: "恆真事實不退時態" },
    ],
    tips: [
      "主句過去 → 子句現在改過去、過去改過去完成、will 改 would。",
      "不變的真理／科學事實維持現在式。",
      "時間地點詞也要換：now→then, today→that day, here→there。",
    ],
    pitfalls: [
      { wrong: "She said she is happy.", right: "She said she was happy.", why: "主句過去，子句時態要一致往過去退。" },
    ],
    quiz: [
      { q: "Tom said he ___ finish it the next day.", opts: ["will", "would", "can", "shall"], a: 1, ex: "主句過去，will 要改成 would。" },
      { q: "Mom told me that honesty ___ the best policy.", opts: ["was", "is", "were", "had been"], a: 1, ex: "恆真的道理維持現在式 is。" },
    ],
  },

  /* =====================================================
     ② 語態與語氣 VOICE & MOOD
     ===================================================== */
  {
    id: "passive",
    cat: "voice", level: "進階",
    title: "被動語態",
    en: "Passive Voice",
    summary: "當「動作的對象」比「誰做的」更重要時，用被動：be + 過去分詞。",
    structure: [
      { label: "現在被動", formula: "S + am/is/are + p.p.", tone: "a" },
      { label: "過去被動", formula: "S + was/were + p.p.", tone: "b" },
      { label: "帶動作者", formula: "… + p.p. + by + 人", tone: "c" },
    ],
    examples: [
      { en: "The report was written by Amy.", zh: "報告是 Amy 寫的。" },
      { en: "English is spoken all over the world.", zh: "全世界都說英語。（不需點明誰說）" },
      { en: "The bridge is being repaired.", zh: "橋正在修繕中。（現在進行被動）" },
      { en: "Our order has been shipped.", zh: "我們的訂單已寄出。（完成被動，商用常見）" },
    ],
    tips: [
      "主動改被動三步驟：受詞移到句首 → 動詞改 be + p.p. → 原主詞放 by 後面。",
      "不知道／不重要誰做的，就省略 by 片語。",
      "商用信件常用被動顯客觀：「will be processed」「has been approved」。",
    ],
    pitfalls: [
      { wrong: "The window was broke.", right: "The window was broken.", why: "被動要用過去分詞 broken，不是 broke。" },
      { wrong: "This book wrote by him.", right: "This book was written by him.", why: "缺少 be 動詞就不是被動。" },
    ],
    quiz: [
      { q: "The new policy ___ next month.", opts: ["will announce", "will be announced", "announces", "is announcing"], a: 1, ex: "政策被宣布，用未來被動 will be + p.p.。" },
      { q: "Many trees ___ down last year.", opts: ["cut", "were cut", "were cutting", "have cut"], a: 1, ex: "去年被砍，過去被動 were + p.p.。" },
    ],
  },
  {
    id: "passive-advanced",
    cat: "voice", level: "精熟",
    title: "進階被動語態",
    en: "Advanced Passive",
    summary: "使役／感官動詞、雙受詞、慣用介系詞的被動，以及 by 以外的搭配。",
    structure: [
      { label: "使役被動", formula: "be + made + to V", tone: "a" },
      { label: "雙受詞被動", formula: "S + be + p.p. + sth（人當主詞）", tone: "b" },
      { label: "慣用介系詞", formula: "be known for / as / to · be covered with", tone: "c" },
    ],
    examples: [
      { en: "He was made to apologize.", zh: "他被迫道歉。", note: "make 被動要補 to" },
      { en: "I was given a gift.", zh: "我收到一份禮物。", note: "雙受詞取其一當主詞" },
      { en: "The mountain is covered with snow.", zh: "山被雪覆蓋。", note: "慣用 with，不用 by" },
      { en: "She is known for her kindness.", zh: "她以善良聞名。" },
    ],
    tips: [
      "使役 make 主動接原形，被動要加 to：be made to V。",
      "慣用被動介系詞：be interested in / worried about / covered with / known for。",
      "片語動詞被動要保留介副詞：was looked after（被照顧）。",
    ],
    pitfalls: [
      { wrong: "He was made apologize.", right: "He was made to apologize.", why: "make 被動後要加 to。" },
      { wrong: "The room was filled by smoke.", right: "The room was filled with smoke.", why: "be filled with 為慣用搭配。" },
    ],
    quiz: [
      { q: "The children were made ___ their homework first.", opts: ["do", "to do", "doing", "done"], a: 1, ex: "make 被動接 to do。" },
      { q: "This song is known ___ everyone.", opts: ["for", "as", "to", "with"], a: 2, ex: "be known to sb =「為……所熟知」。" },
    ],
  },
  {
    id: "conditionals",
    cat: "voice", level: "精熟",
    title: "假設語氣（If 條件句）",
    en: "Conditionals",
    summary: "從「可能成真」到「與事實相反」，用時態表達不同程度的假設。",
    structure: [
      { label: "第一類（可能）", formula: "If + 現在式, S + will + V", tone: "a" },
      { label: "第二類（與現在相反）", formula: "If + 過去式, S + would + V", tone: "b" },
      { label: "第三類（與過去相反）", formula: "If + had p.p., S + would have p.p.", tone: "c" },
    ],
    examples: [
      { en: "If it rains, we will stay home.", zh: "如果下雨，我們就待在家。（有可能發生）" },
      { en: "If I were you, I would take the job.", zh: "如果我是你，我會接下這份工作。", note: "與現在相反，be 一律用 were" },
      { en: "If she had studied, she would have passed.", zh: "她要是有讀書，就會及格了。（過去沒發生）" },
    ],
    tips: [
      "與現在事實相反：if 子句用過去式，be 動詞一律用 were。",
      "與過去事實相反：if 子句用 had + p.p.，主句用 would have + p.p.。",
      "第一類是真實可能；第二、三類是虛擬（不太可能／已成定局）。",
    ],
    pitfalls: [
      { wrong: "If I will have time, I will call you.", right: "If I have time, I will call you.", why: "if 子句不用 will，用現在式。" },
      { wrong: "If I was rich, I would travel.", right: "If I were rich, I would travel.", why: "與現在相反的假設，be 用 were。" },
    ],
    quiz: [
      { q: "If I ___ the lottery, I would buy a house.", opts: ["win", "won", "had won", "will win"], a: 1, ex: "與現在相反的假設，if 用過去式 won。" },
      { q: "If you had told me earlier, I ___ helped.", opts: ["would", "will have", "would have", "had"], a: 2, ex: "與過去相反，主句用 would have + p.p.。" },
      { q: "If it ___ tomorrow, the game will be canceled.", opts: ["rains", "rained", "will rain", "would rain"], a: 0, ex: "第一類真實條件，if 子句用現在式。" },
    ],
  },
  {
    id: "subjunctive-wish",
    cat: "voice", level: "精熟",
    title: "wish / as if / would rather",
    en: "Wish & As If",
    summary: "表達「與現實相反的願望或想像」，動詞往過去退，be 一律用 were。",
    structure: [
      { label: "對現在的遺憾", formula: "wish + S + 過去式", tone: "a" },
      { label: "對過去的遺憾", formula: "wish + S + had + p.p.", tone: "b" },
      { label: "彷彿", formula: "as if / as though + 過去式", tone: "c" },
    ],
    examples: [
      { en: "I wish I were taller.", zh: "我希望我高一點。（現實並不高）" },
      { en: "I wish I had studied harder.", zh: "真希望我當初更用功。（過去沒有）" },
      { en: "He talks as if he knew everything.", zh: "他講得好像什麼都懂。（其實不懂）" },
      { en: "I'd rather you didn't smoke here.", zh: "我寧願你別在這抽菸。" },
    ],
    tips: [
      "wish + 過去式 = 對現在不滿；wish + had p.p. = 對過去後悔。",
      "would rather + S + 過去式 表「寧願某人（現在／未來）……」。",
      "It's (high) time + S + 過去式：「早該……了」。",
    ],
    pitfalls: [
      { wrong: "I wish I am rich.", right: "I wish I were rich.", why: "wish 表與現在相反，動詞退為過去、be 用 were。" },
    ],
    quiz: [
      { q: "I wish I ___ what to do.", opts: ["know", "knew", "had known", "knows"], a: 1, ex: "對現在的遺憾，wish + 過去式 knew。" },
      { q: "She acts as if she ___ the boss.", opts: ["is", "was", "were", "be"], a: 2, ex: "as if 與現實相反，be 用 were。" },
      { q: "It's high time we ___ home.", opts: ["go", "went", "going", "will go"], a: 1, ex: "It's high time + 過去式。" },
    ],
  },
  {
    id: "imperatives",
    cat: "voice", level: "基礎",
    title: "祈使句與建議句型",
    en: "Imperatives",
    summary: "用原形動詞開頭表命令、指示、邀請；否定用 Don't，一起做用 Let's。",
    structure: [
      { label: "肯定祈使", formula: "V + …（原形開頭）", tone: "a" },
      { label: "否定祈使", formula: "Don't + V", tone: "b" },
      { label: "提議", formula: "Let's + V", tone: "c" },
    ],
    examples: [
      { en: "Close the door, please.", zh: "請關門。" },
      { en: "Don't be late.", zh: "別遲到。", note: "be 也要用原形" },
      { en: "Let's take a break.", zh: "我們休息一下吧。" },
      { en: "Study hard, and you'll pass.", zh: "用功讀書，你就會及格。", note: "祈使句 + and 表條件" },
    ],
    tips: [
      "祈使句 + and →「就會……」；祈使句 + or →「否則……」。",
      "Let's 的否定：Let's not …。",
      "加 please 或改用 Would you… 更客氣。",
    ],
    pitfalls: [
      { wrong: "Don't to worry.", right: "Don't worry.", why: "否定祈使 Don't 後直接接原形。" },
    ],
    quiz: [
      { q: "Study hard, ___ you'll pass the exam.", opts: ["or", "and", "but", "so"], a: 1, ex: "祈使句 + and =「就會」。" },
      { q: "___ waste your time on it.", opts: ["Not", "No", "Don't", "Doesn't"], a: 2, ex: "否定祈使用 Don't + 原形。" },
    ],
  },

  /* =====================================================
     ③ 子句與連接 CLAUSES
     ===================================================== */
  {
    id: "relative",
    cat: "clause", level: "進階",
    title: "關係子句",
    en: "Relative Clauses",
    summary: "用 who / which / that 把「補充說明」接進句子，避免一句一句短短的。",
    structure: [
      { label: "指人", formula: "… 人 + who/that + V …", tone: "a" },
      { label: "指物", formula: "… 物 + which/that + V …", tone: "b" },
      { label: "所有格", formula: "… 人/物 + whose + N …", tone: "c" },
    ],
    examples: [
      { en: "The man who called you is my uncle.", zh: "打電話給你的那個人是我叔叔。" },
      { en: "This is the phone that I bought yesterday.", zh: "這是我昨天買的手機。" },
      { en: "I have a friend whose father is a pilot.", zh: "我有個朋友，他爸爸是機師。" },
      { en: "Taipei, which is in the north, is crowded.", zh: "台北位於北部，很擁擠。", note: "逗號＝非限定，補充用" },
    ],
    tips: [
      "指人用 who、指物用 which，that 兩者皆可（但非限定子句不用 that）。",
      "關係代名詞當受詞時可省略：the book (that) I read。",
      "有逗號的非限定子句只是「補充」，拿掉句子仍完整。",
    ],
    pitfalls: [
      { wrong: "The girl which sings is my sister.", right: "The girl who sings is my sister.", why: "指人要用 who，不用 which。" },
      { wrong: "Rome, that is old, is beautiful.", right: "Rome, which is old, is beautiful.", why: "非限定子句（有逗號）不能用 that。" },
    ],
    quiz: [
      { q: "The house ___ we live in is small.", opts: ["who", "which", "whose", "where"], a: 1, ex: "指物且當受詞，用 which/that。" },
      { q: "She's the teacher ___ helped me a lot.", opts: ["which", "whose", "who", "whom"], a: 2, ex: "指人當主詞，用 who。" },
      { q: "I met a boy ___ mother is a doctor.", opts: ["who", "which", "whose", "that"], a: 2, ex: "表『他的』媽媽，所有格用 whose。" },
    ],
  },
  {
    id: "relative-adverb",
    cat: "clause", level: "進階",
    title: "關係副詞 where / when / why",
    en: "Relative Adverbs",
    summary: "先行詞是地點、時間、原因時，用 where / when / why 引導（＝介系詞 + 關代）。",
    structure: [
      { label: "地點", formula: "… place + where + S + V …", tone: "a" },
      { label: "時間", formula: "… time + when + S + V …", tone: "b" },
      { label: "原因", formula: "the reason + why + S + V …", tone: "c" },
    ],
    examples: [
      { en: "This is the house where I grew up.", zh: "這是我長大的房子。", note: "where = in which" },
      { en: "I remember the day when we met.", zh: "我記得我們相遇的那天。" },
      { en: "Tell me the reason why you're late.", zh: "告訴我你遲到的原因。" },
    ],
    tips: [
      "where = 介系詞 + which（in / at which），後面接完整句子。",
      "關代後缺主詞或受詞 → 用 which/that；句子完整 → 用關係副詞。",
      "the way 與 how 不並用：the way S V 或 how S V（擇一）。",
    ],
    pitfalls: [
      { wrong: "This is the city which I was born.", right: "This is the city where I was born.", why: "句子完整（不缺受詞），地點用 where。" },
    ],
    quiz: [
      { q: "Summer is the season ___ we go swimming.", opts: ["which", "where", "when", "why"], a: 2, ex: "先行詞是季節（時間），用 when。" },
      { q: "Do you know the reason ___ she quit?", opts: ["why", "where", "which", "when"], a: 0, ex: "先行詞 reason，用 why。" },
    ],
  },
  {
    id: "noun-clause",
    cat: "clause", level: "精熟",
    title: "名詞子句",
    en: "Noun Clauses",
    summary: "一整個子句當名詞用，可當主詞、受詞或補語，常用 that / whether / wh- 引導。",
    structure: [
      { label: "that 子句", formula: "… that + S + V（敘述事實）", tone: "a" },
      { label: "whether/if", formula: "… whether/if + S + V（是否）", tone: "b" },
      { label: "wh- 子句", formula: "… what/where/why + S + V", tone: "c" },
    ],
    examples: [
      { en: "I think that he is right.", zh: "我認為他是對的。（that 子句當受詞）" },
      { en: "Whether we win depends on you.", zh: "我們能否贏取決於你。（當主詞）" },
      { en: "Do you know where she lives?", zh: "你知道她住哪裡嗎？", note: "間接問句用直述語序" },
    ],
    tips: [
      "間接問句用「直述語序」：不是 where does she live，而是 where she lives。",
      "that 當受詞時常可省略：I know (that) you're busy。",
      "whether 可接 or not；if 通常不放句首當主詞。",
    ],
    pitfalls: [
      { wrong: "I don't know where is the station.", right: "I don't know where the station is.", why: "名詞子句用直述語序，主詞在動詞前。" },
    ],
    quiz: [
      { q: "Can you tell me ___ the meeting starts?", opts: ["when does", "when", "does when", "that when"], a: 1, ex: "間接問句用直述語序：when the meeting starts。" },
      { q: "___ he passed the exam surprised everyone.", opts: ["That", "What", "Which", "Who"], a: 0, ex: "陳述事實當主詞，用 That 子句。" },
    ],
  },
  {
    id: "conjunctions",
    cat: "clause", level: "基礎",
    title: "對等與從屬連接詞",
    en: "Conjunctions",
    summary: "FANBOYS 連接對等結構；because / although 等引導從屬子句表原因、讓步。",
    structure: [
      { label: "對等 FANBOYS", formula: "…, for/and/nor/but/or/yet/so …", tone: "a" },
      { label: "從屬（原因/讓步）", formula: "because / although / while + S + V", tone: "b" },
    ],
    examples: [
      { en: "I was tired, so I went to bed.", zh: "我很累，所以去睡了。（so 表結果）" },
      { en: "Although it was raining, we went out.", zh: "雖然下雨，我們還是出門。（讓步）" },
      { en: "He stayed home because he was sick.", zh: "他因為生病待在家。（原因）" },
    ],
    tips: [
      "although / though 已經有『雖然』，不可再加 but（中式英文陷阱）。",
      "because 接子句（S+V）；because of 接名詞。",
      "so ... that 表『如此……以致於』：so tired that I slept.",
    ],
    pitfalls: [
      { wrong: "Although he is rich, but he is unhappy.", right: "Although he is rich, he is unhappy.", why: "although 與 but 不能同時使用。" },
      { wrong: "He was late because of he overslept.", right: "He was late because he overslept.", why: "接子句用 because，不是 because of。" },
    ],
    quiz: [
      { q: "___ she was nervous, she gave a great speech.", opts: ["Because", "So", "Although", "But"], a: 2, ex: "前後轉折，用讓步連接詞 Although。" },
      { q: "The flight was delayed ___ the storm.", opts: ["because", "because of", "although", "so"], a: 1, ex: "後接名詞 the storm，用 because of。" },
    ],
  },
  {
    id: "adverb-clause",
    cat: "clause", level: "進階",
    title: "副詞子句（時間・原因・讓步・目的）",
    en: "Adverbial Clauses",
    summary: "用從屬連接詞引導，修飾主句，表時間、原因、條件、讓步、目的或結果。",
    structure: [
      { label: "時間", formula: "when/while/after/before/until + S + V", tone: "a" },
      { label: "條件/讓步", formula: "unless / although + S + V", tone: "b" },
      { label: "目的/結果", formula: "so that / so … that + S + V", tone: "c" },
    ],
    examples: [
      { en: "Wait here until I come back.", zh: "在這等到我回來。" },
      { en: "Unless you hurry, you'll be late.", zh: "除非你快點，否則會遲到。", note: "unless = if … not" },
      { en: "He saved money so that he could travel.", zh: "他存錢是為了能去旅行。", note: "目的" },
      { en: "It was so hot that we stayed inside.", zh: "天氣太熱，我們待在室內。", note: "結果" },
    ],
    tips: [
      "時間／條件副詞子句中，用現在式代替未來式：When he comes（非 will come）。",
      "unless = if … not；so that + 助動詞（can/could/will）表目的。",
      "so + 形容詞 + that = 「如此……以致於」。",
    ],
    pitfalls: [
      { wrong: "I'll call you when I will arrive.", right: "I'll call you when I arrive.", why: "時間副詞子句用現在式表未來。" },
    ],
    quiz: [
      { q: "We'll wait ___ the rain stops.", opts: ["until", "unless", "although", "so"], a: 0, ex: "until 表「直到……」。" },
      { q: "Speak louder ___ everyone can hear you.", opts: ["so that", "such that", "because", "though"], a: 0, ex: "表目的用 so that。" },
    ],
  },
  {
    id: "compound-relative",
    cat: "clause", level: "精熟",
    title: "複合關係代名詞 what / whatever",
    en: "Compound Relatives",
    summary: "what = the thing that；whatever / whoever 表「無論……」，本身已含先行詞。",
    structure: [
      { label: "what（所…的事物）", formula: "what + S + V …", tone: "a" },
      { label: "無論何事／何人", formula: "whatever / whoever + V …", tone: "b" },
    ],
    examples: [
      { en: "What he said is true.", zh: "他說的話是真的。", note: "what = the thing that" },
      { en: "Whatever you decide, I'll support you.", zh: "無論你決定什麼，我都支持。" },
      { en: "Whoever breaks the rule will be punished.", zh: "違規者將受罰。" },
    ],
    tips: [
      "what 已含先行詞，不可再加 the thing、也不與 that 並用。",
      "whatever = no matter what；可引導名詞子句或讓步副詞子句。",
      "選 what 還是 that：缺先行詞用 what，有先行詞用 that/which。",
    ],
    pitfalls: [
      { wrong: "The thing what you need is rest.", right: "What you need is rest.", why: "what 已含先行詞，不能與 the thing 並用。" },
    ],
    quiz: [
      { q: "___ you need is a good rest.", opts: ["That", "What", "Which", "It"], a: 1, ex: "缺先行詞當主詞，用 What。" },
      { q: "___ wins the game gets a prize.", opts: ["Whoever", "Whatever", "However", "Whichever"], a: 0, ex: "指人「無論誰」用 Whoever。" },
    ],
  },

  /* =====================================================
     ④ 詞類與用法 WORD USAGE
     ===================================================== */
  {
    id: "gerund-infinitive",
    cat: "word", level: "進階",
    title: "不定詞 vs 動名詞",
    en: "Infinitive vs Gerund",
    summary: "有些動詞後面只能接 to V，有些只能接 V-ing，記住高頻動詞就穩了。",
    structure: [
      { label: "接不定詞 to V", formula: "want / decide / hope / plan + to V", tone: "a" },
      { label: "接動名詞 V-ing", formula: "enjoy / finish / avoid / mind + V-ing", tone: "b" },
      { label: "介系詞後", formula: "prep. + V-ing（如 good at V-ing）", tone: "c" },
    ],
    examples: [
      { en: "I decided to quit.", zh: "我決定辭職。（decide + to V）" },
      { en: "She enjoys reading novels.", zh: "她喜歡讀小說。（enjoy + V-ing）" },
      { en: "He is good at cooking.", zh: "他很會煮飯。（介系詞 at + V-ing）" },
      { en: "Stop smoking. / Stop to smoke.", zh: "戒菸／停下來去抽菸。", note: "stop 後兩者意思不同！" },
    ],
    tips: [
      "接 to V 常見：want, hope, plan, decide, agree, offer, promise, refuse。",
      "接 V-ing 常見：enjoy, finish, avoid, mind, keep, practice, suggest, admit。",
      "介系詞（at, of, in, about）後面動詞一律用 V-ing。",
    ],
    pitfalls: [
      { wrong: "I enjoy to swim.", right: "I enjoy swimming.", why: "enjoy 後面接動名詞。" },
      { wrong: "She is interested in learn English.", right: "She is interested in learning English.", why: "介系詞 in 後接 V-ing。" },
    ],
    quiz: [
      { q: "Would you mind ___ the window?", opts: ["to open", "opening", "open", "opened"], a: 1, ex: "mind 後接動名詞 opening。" },
      { q: "They agreed ___ the contract.", opts: ["signing", "sign", "to sign", "signed"], a: 2, ex: "agree 後接不定詞 to sign。" },
      { q: "I'm looking forward to ___ you.", opts: ["see", "seeing", "seen", "saw"], a: 1, ex: "look forward to 的 to 是介系詞，接 V-ing。" },
    ],
  },
  {
    id: "infinitive-usage",
    cat: "word", level: "進階",
    title: "不定詞句型（too…to / enough）",
    en: "Infinitive Patterns",
    summary: "too…to（太……而不能）、enough to（足以）、in order to（為了）、疑問詞 + to V。",
    structure: [
      { label: "too … to", formula: "too + adj + to V（含否定意味）", tone: "a" },
      { label: "enough", formula: "adj + enough + to V", tone: "b" },
      { label: "疑問詞 + to V", formula: "how / what / where + to V", tone: "c" },
    ],
    examples: [
      { en: "He is too young to drive.", zh: "他太年輕不能開車。", note: "too…to 已含否定" },
      { en: "She is old enough to vote.", zh: "她夠大可以投票了。", note: "enough 放形容詞後" },
      { en: "I don't know what to say.", zh: "我不知道該說什麼。" },
      { en: "We study hard in order to pass.", zh: "我們努力讀書以求及格。" },
    ],
    tips: [
      "too…to V = so…that…not（本身含否定，不再加 not）。",
      "enough 修飾形容詞放後面（tall enough）；修飾名詞放前面（enough money）。",
      "疑問詞 + to V 可當名詞：how to swim, where to go。",
    ],
    pitfalls: [
      { wrong: "He is too tired to not work.", right: "He is too tired to work.", why: "too…to 本身已含否定，不再加 not。" },
      { wrong: "She is enough tall to reach it.", right: "She is tall enough to reach it.", why: "enough 修飾形容詞要放後面。" },
    ],
    quiz: [
      { q: "The coffee is too hot ___.", opts: ["to drink", "to not drink", "drinking", "drink"], a: 0, ex: "too…to V，本身已含否定。" },
      { q: "He isn't strong ___ lift it.", opts: ["enough to", "to enough", "enough for", "so to"], a: 0, ex: "adj + enough + to V。" },
      { q: "Can you tell me ___ get to the station?", opts: ["how to", "how can", "to how", "how"], a: 0, ex: "疑問詞 how + to V。" },
    ],
  },
  {
    id: "articles",
    cat: "word", level: "基礎",
    title: "冠詞 a / an / the",
    en: "Articles",
    summary: "第一次提到用 a/an（不特定），再次提到或雙方都知道用 the（特定）。",
    structure: [
      { label: "不定冠詞", formula: "a + 子音音 / an + 母音音", tone: "a" },
      { label: "定冠詞", formula: "the + 特定／獨一無二的名詞", tone: "b" },
    ],
    examples: [
      { en: "I saw a dog. The dog was cute.", zh: "我看到一隻狗，那隻狗很可愛。（先 a 後 the）" },
      { en: "She is an honest person.", zh: "她是個誠實的人。", note: "honest 的 h 不發音，用 an" },
      { en: "The sun rises in the east.", zh: "太陽從東方升起。（獨一無二用 the）" },
    ],
    tips: [
      "a/an 看『發音』不是拼字：a university（發 you 音）、an hour（h 不發音）。",
      "獨一無二（the sun, the moon）、樂器（play the piano）用 the。",
      "泛指複數或不可數常不加冠詞：I like music. Dogs are loyal.",
    ],
    pitfalls: [
      { wrong: "He is a honest man.", right: "He is an honest man.", why: "honest 開頭是母音，用 an。" },
      { wrong: "I play piano.", right: "I play the piano.", why: "樂器前要加 the。" },
    ],
    quiz: [
      { q: "It took me ___ hour to finish.", opts: ["a", "an", "the", "×"], a: 1, ex: "hour 的 h 不發音，母音開頭用 an。" },
      { q: "She wants to be ___ engineer.", opts: ["a", "an", "the", "×"], a: 1, ex: "engineer 母音開頭，用 an。" },
      { q: "Can you pass me ___ salt?", opts: ["a", "an", "the", "×"], a: 2, ex: "餐桌上雙方都知道的那罐鹽，用 the。" },
    ],
  },
  {
    id: "prepositions",
    cat: "word", level: "基礎",
    title: "時間與地點介系詞",
    en: "Prepositions of Time & Place",
    summary: "in / on / at 由大到小：大範圍用 in，特定日子用 on，精確點用 at。",
    structure: [
      { label: "大範圍", formula: "in + 月份/年份/季節/國家城市", tone: "a" },
      { label: "特定日", formula: "on + 星期/日期/特定日子", tone: "b" },
      { label: "精確點", formula: "at + 時刻/地點的點", tone: "c" },
    ],
    examples: [
      { en: "in 2024 / in July / in Taipei", zh: "在 2024 年／七月／台北（大範圍）" },
      { en: "on Monday / on May 5th", zh: "在星期一／五月五日（特定日）" },
      { en: "at 7 o'clock / at the door", zh: "在七點／在門口（精確點）" },
      { en: "See you at the weekend.", zh: "週末見。", note: "英式 at / 美式 on the weekend" },
    ],
    tips: [
      "時間：in（月/年/季）→ on（日）→ at（時刻）由大到小。",
      "地點：in（範圍內）、on（表面上）、at（某一點）。",
      "at night, in the morning/afternoon/evening 要背下來。",
    ],
    pitfalls: [
      { wrong: "I was born in May 5th.", right: "I was born on May 5th.", why: "特定日期用 on。" },
      { wrong: "Meet me on 3 p.m.", right: "Meet me at 3 p.m.", why: "精確時刻用 at。" },
    ],
    quiz: [
      { q: "The meeting is ___ Friday morning.", opts: ["in", "on", "at", "by"], a: 1, ex: "特定星期幾用 on。" },
      { q: "The store opens ___ 9 a.m.", opts: ["in", "on", "at", "for"], a: 2, ex: "精確時刻用 at。" },
      { q: "It gets cold ___ winter.", opts: ["in", "on", "at", "by"], a: 0, ex: "季節用 in。" },
    ],
  },
  {
    id: "pronouns",
    cat: "word", level: "基礎",
    title: "代名詞（反身・虛主詞 it・there be）",
    en: "Pronouns",
    summary: "反身代名詞、虛主詞 it、以及 there is/are 的用法與一致性。",
    structure: [
      { label: "反身代名詞", formula: "-self / -selves（myself, themselves）", tone: "a" },
      { label: "虛主詞 it", formula: "It is + adj + to V / that …", tone: "b" },
      { label: "存在句", formula: "There + be + N", tone: "c" },
    ],
    examples: [
      { en: "She hurt herself.", zh: "她弄傷了自己。", note: "主受詞同一人用反身" },
      { en: "It is important to exercise.", zh: "運動很重要。", note: "It 代替後面 to V" },
      { en: "There are three books on the desk.", zh: "桌上有三本書。", note: "be 依後面名詞" },
    ],
    tips: [
      "by oneself = 獨自；enjoy oneself = 玩得開心（慣用反身）。",
      "It 當虛主詞代替不定詞或 that 子句：It is + adj + (for sb) to V。",
      "there be 的 be 與「後面第一個名詞」一致。",
    ],
    pitfalls: [
      { wrong: "There is many people here.", right: "There are many people here.", why: "there be 依後面名詞（people 複數）用 are。" },
      { wrong: "He did it by his self.", right: "He did it by himself.", why: "反身代名詞是一個字 himself。" },
    ],
    quiz: [
      { q: "___ takes two hours to get there.", opts: ["There", "It", "That", "This"], a: 1, ex: "虛主詞 It 代替 to get there。" },
      { q: "There ___ a pen and two erasers on the desk.", opts: ["is", "are", "be", "have"], a: 0, ex: "there be 依最近名詞 pen（單數）用 is。" },
      { q: "The kids enjoyed ___ at the party.", opts: ["them", "themselves", "theirselves", "they"], a: 1, ex: "enjoy oneself 用反身 themselves。" },
    ],
  },
  {
    id: "quantifiers",
    cat: "word", level: "基礎",
    title: "數量詞 some/any・many/much・few/little",
    en: "Quantifiers",
    summary: "依可數／不可數與句型選擇：many/few 配可數，much/little 配不可數。",
    structure: [
      { label: "可數名詞", formula: "many / (a) few + 複數N", tone: "a" },
      { label: "不可數名詞", formula: "much / (a) little + 不可數N", tone: "b" },
      { label: "通用", formula: "some（肯定）/ any（否定疑問）", tone: "c" },
    ],
    examples: [
      { en: "I have many friends.", zh: "我有很多朋友。", note: "friends 可數" },
      { en: "There isn't much time.", zh: "沒有多少時間。", note: "time 不可數" },
      { en: "She has a few coins but little money.", zh: "她有幾個硬幣但幾乎沒錢。", note: "a few 可數 / little 不可數" },
      { en: "Would you like some tea?", zh: "要喝點茶嗎？", note: "邀請用 some" },
    ],
    tips: [
      "a few / a little =「有一些」（肯定）；few / little =「幾乎沒有」（否定意味）。",
      "some 用於肯定句與邀請／請求；any 用於否定與疑問。",
      "much 多用於否定疑問；肯定常用 a lot of。",
    ],
    pitfalls: [
      { wrong: "I don't have much friends.", right: "I don't have many friends.", why: "friends 可數，用 many。" },
      { wrong: "There are a little apples.", right: "There are a few apples.", why: "apples 可數，用 a few。" },
    ],
    quiz: [
      { q: "How ___ money do you need?", opts: ["many", "much", "few", "little"], a: 1, ex: "money 不可數，用 much。" },
      { q: "I have ___ time, so let's hurry.", opts: ["little", "a little", "few", "many"], a: 0, ex: "little =「幾乎沒有」，呼應「趕快」。" },
      { q: "There are ___ students in the hall.", opts: ["much", "a little", "many", "little"], a: 2, ex: "students 可數且肯定，用 many。" },
    ],
  },
  {
    id: "modals",
    cat: "word", level: "進階",
    title: "情態助動詞（能力・許可・推測）",
    en: "Modal Verbs",
    summary: "can/could（能力許可）、may/might（許可推測）、must（義務／強推測）、should（應該）。",
    structure: [
      { label: "能力/許可", formula: "can / could + V（原形）", tone: "a" },
      { label: "義務/禁止", formula: "must / must not + V", tone: "b" },
      { label: "推測", formula: "must / may / might / can't + V", tone: "c" },
    ],
    examples: [
      { en: "You must wear a seatbelt.", zh: "你必須繫安全帶。", note: "義務" },
      { en: "You mustn't smoke here.", zh: "這裡禁止抽菸。", note: "mustn't = 禁止" },
      { en: "He may be at home.", zh: "他可能在家。", note: "推測（可能）" },
      { en: "It can't be true.", zh: "這不可能是真的。", note: "can't = 否定推測「不可能」" },
    ],
    tips: [
      "義務否定：mustn't =「禁止」；don't have to =「不必」，意思完全不同！",
      "推測強度：must（一定）> may/might/could（也許）> can't（不可能）。",
      "對過去的推測：must / may / can't + have + p.p.。",
    ],
    pitfalls: [
      { wrong: "You mustn't come if you're busy.", right: "You don't have to come if you're busy.", why: "mustn't 是禁止，「不必」要用 don't have to。" },
    ],
    quiz: [
      { q: "You ___ touch that; it's dangerous.", opts: ["mustn't", "don't have to", "may", "might"], a: 0, ex: "禁止用 mustn't。" },
      { q: "The lights are off; they ___ be out.", opts: ["must", "can't", "would", "may"], a: 0, ex: "由證據強烈推測「一定」用 must。" },
      { q: "We ___ hurry; there's plenty of time.", opts: ["mustn't", "don't have to", "can't", "shouldn't"], a: 1, ex: "「不必」用 don't have to。" },
    ],
  },

  /* =====================================================
     ⑤ 比較與修飾 COMPARISON & MODIFIERS
     ===================================================== */
  {
    id: "comparison",
    cat: "compare", level: "基礎",
    title: "比較級與最高級",
    en: "Comparatives & Superlatives",
    summary: "兩者相比用比較級（-er / more），三者以上用最高級（the -est / the most）。",
    structure: [
      { label: "比較級", formula: "adj-er / more adj + than", tone: "a" },
      { label: "最高級", formula: "the adj-est / the most adj", tone: "b" },
      { label: "同級", formula: "as + adj + as", tone: "c" },
    ],
    examples: [
      { en: "Taipei is bigger than Tainan.", zh: "台北比台南大。（兩者比較）" },
      { en: "This is the most expensive phone.", zh: "這是最貴的手機。（三者以上）" },
      { en: "She is as tall as her brother.", zh: "她跟她哥哥一樣高。（同級比較）" },
      { en: "The more you practice, the better you get.", zh: "越練習就越厲害。", note: "the 比較級, the 比較級" },
    ],
    tips: [
      "單音節加 -er/-est；多音節用 more/most；good→better→best 為不規則。",
      "比較級可用 much / far / a lot 加強：much better（強調差很多）。",
      "『越……越……』句型：The 比較級 …, the 比較級 …。",
    ],
    pitfalls: [
      { wrong: "She is more taller than me.", right: "She is taller than me.", why: "-er 與 more 不能同時用。" },
      { wrong: "This is the better one of the three.", right: "This is the best one of the three.", why: "三者以上用最高級 best。" },
    ],
    quiz: [
      { q: "Health is ___ than wealth.", opts: ["important", "more important", "most important", "importanter"], a: 1, ex: "兩者比較且多音節，用 more important。" },
      { q: "This is ___ movie I've ever seen.", opts: ["good", "better", "the best", "best"], a: 2, ex: "最高級要加 the：the best。" },
      { q: "He runs ___ fast ___ a cheetah.", opts: ["so / as", "as / as", "more / than", "as / than"], a: 1, ex: "同級比較用 as … as。" },
    ],
  },
  {
    id: "comparison-advanced",
    cat: "compare", level: "精熟",
    title: "進階比較句型",
    en: "Advanced Comparison",
    summary: "倍數比較、the 比較級 the 比較級、否定比較＝最高級意味等高階句型。",
    structure: [
      { label: "倍數", formula: "… times + as adj as / 比較級 than", tone: "a" },
      { label: "越…越…", formula: "The 比較級 …, the 比較級 …", tone: "b" },
      { label: "同級否定", formula: "not as / so + adj + as", tone: "c" },
    ],
    examples: [
      { en: "This box is twice as heavy as that one.", zh: "這箱是那箱的兩倍重。" },
      { en: "The older he gets, the wiser he becomes.", zh: "他越老越有智慧。" },
      { en: "Nothing is more precious than health.", zh: "沒有什麼比健康更珍貴。", note: "否定 + 比較 = 最高級意味" },
      { en: "She is not as tall as her sister.", zh: "她沒有姊姊高。" },
    ],
    tips: [
      "倍數放在 as…as 或比較級前：three times as big / three times bigger。",
      "「否定主詞 + 比較級 than」= 最高級：No one is taller than Tom = Tom is the tallest。",
      "the more…the more… 兩個 the 都不能少。",
    ],
    pitfalls: [
      { wrong: "This is more heavier than that.", right: "This is heavier than that.", why: "-er 與 more 不可並用。" },
    ],
    quiz: [
      { q: "___ you practice, the better you become.", opts: ["More", "The more", "Much", "As more"], a: 1, ex: "「越…越…」用 The more …, the better …。" },
      { q: "This car is three times ___ that one.", opts: ["as expensive as", "more expensive", "expensive as", "so expensive as"], a: 0, ex: "倍數 + as adj as。" },
    ],
  },
  {
    id: "adj-adv",
    cat: "compare", level: "基礎",
    title: "形容詞 vs 副詞",
    en: "Adjectives vs Adverbs",
    summary: "形容詞修飾名詞；副詞修飾動詞、形容詞或另一副詞。連綴動詞後用形容詞。",
    structure: [
      { label: "形容詞", formula: "修飾名詞 / be 動詞後", tone: "a" },
      { label: "副詞", formula: "修飾動詞、形容詞、副詞", tone: "b" },
    ],
    examples: [
      { en: "She is a careful driver.", zh: "她是個小心的駕駛。", note: "修飾名詞 driver" },
      { en: "She drives carefully.", zh: "她開車很小心。", note: "修飾動詞 drives" },
      { en: "The soup tastes good.", zh: "湯嚐起來很好。", note: "連綴動詞 taste 後用形容詞" },
      { en: "He runs really fast.", zh: "他跑得真快。", note: "fast 形副同形" },
    ],
    tips: [
      "連綴動詞（be, become, seem, look, taste, smell, sound, feel）後接形容詞。",
      "hard（努力／硬）vs hardly（幾乎不）；late vs lately（最近）意思不同。",
      "good 是形容詞，well 是副詞（well 也可指「身體好」的形容詞）。",
    ],
    pitfalls: [
      { wrong: "The soup tastes well.", right: "The soup tastes good.", why: "taste 為連綴動詞，後接形容詞 good。" },
      { wrong: "He speaks English good.", right: "He speaks English well.", why: "修飾動詞 speaks 用副詞 well。" },
    ],
    quiz: [
      { q: "Drive ___! The road is icy.", opts: ["careful", "carefully", "care", "caring"], a: 1, ex: "修飾動詞 drive 用副詞。" },
      { q: "These flowers smell ___.", opts: ["sweetly", "sweet", "sweetness", "sweeten"], a: 1, ex: "smell 連綴動詞後接形容詞 sweet。" },
      { q: "I ___ ever eat fast food.", opts: ["hard", "hardly", "hardness", "harder"], a: 1, ex: "hardly ever =「幾乎不」。" },
    ],
  },
  {
    id: "participle-adj",
    cat: "compare", level: "進階",
    title: "分詞形容詞 -ing vs -ed",
    en: "Participial Adjectives",
    summary: "-ing 表「令人……的」（主動）；-ed 表「感到……的」（被動、描述人的感受）。",
    structure: [
      { label: "令人…的（主動）", formula: "V-ing（boring, exciting）", tone: "a" },
      { label: "感到…的（被動）", formula: "V-ed（bored, excited）", tone: "b" },
    ],
    examples: [
      { en: "The movie is boring.", zh: "這電影很無聊。", note: "電影令人無聊" },
      { en: "I am bored.", zh: "我覺得無聊。", note: "人的感受用 -ed" },
      { en: "The news is surprising.", zh: "這消息令人驚訝。" },
      { en: "We were surprised at the news.", zh: "我們對這消息感到驚訝。" },
    ],
    tips: [
      "修飾「事物／原因」用 -ing；描述「人的感受」用 -ed。",
      "常考組：interesting/interested、exciting/excited、tiring/tired、confusing/confused。",
      "感受形容詞常搭介系詞：interested in、worried about、surprised at。",
    ],
    pitfalls: [
      { wrong: "I am boring in class.", right: "I am bored in class.", why: "表「我覺得無聊」用 -ed（-ing 會變成「我很無趣」）。" },
    ],
    quiz: [
      { q: "The lecture was so ___ that I fell asleep.", opts: ["bored", "boring", "bore", "to bore"], a: 1, ex: "演講「令人」無聊，用 -ing。" },
      { q: "She was ___ about the trip.", opts: ["exciting", "excited", "excite", "excitement"], a: 1, ex: "描述人的感受用 -ed。" },
    ],
  },

  /* =====================================================
     ⑥ 句型結構 SENTENCE SYNTAX
     ===================================================== */
  {
    id: "sentence-patterns",
    cat: "syntax", level: "基礎",
    title: "五大基本句型",
    en: "Five Sentence Patterns",
    summary: "英文句子的五種骨架：SV / SVC / SVO / SVOO / SVOC，掌握就能拆解任何句子。",
    structure: [
      { label: "SV / SVC", formula: "主詞 + 動詞 (+ 主詞補語)", tone: "a" },
      { label: "SVO", formula: "主詞 + 及物動詞 + 受詞", tone: "b" },
      { label: "SVOO / SVOC", formula: "… + 受詞 + 受詞/受詞補語", tone: "c" },
    ],
    examples: [
      { en: "Birds fly.", zh: "鳥飛。", note: "S + V（完全不及物）" },
      { en: "She is a nurse.", zh: "她是護士。", note: "S + V + C（主詞補語）" },
      { en: "He gave me a book.", zh: "他給我一本書。", note: "S + V + O + O（雙受詞）" },
      { en: "We call him Tom.", zh: "我們叫他 Tom。", note: "S + V + O + C（受詞補語）" },
    ],
    tips: [
      "連綴動詞（be, become, seem）走 SVC；補語補充「主詞」。",
      "授與動詞（give, send, buy）走 SVOO；可改 give sth to sb。",
      "使役／感官動詞常走 SVOC，補語補充「受詞」。",
    ],
    pitfalls: [
      { wrong: "He gave to me a pen.", right: "He gave me a pen.", why: "雙受詞語序：give sb sth 或 give sth to sb。" },
    ],
    quiz: [
      { q: "哪一句是 S+V+O+C（受詞補語）？", opts: ["They elected her captain.", "She sings well.", "I have a dog.", "He is tall."], a: 0, ex: "elected her(O) captain(C) 為 SVOC。" },
      { q: "「The soup smells delicious.」的句型是？", opts: ["SVO", "SVC", "SVOO", "SV"], a: 1, ex: "smell 為連綴動詞 + 形容詞補語 = SVC。" },
    ],
  },
  {
    id: "inversion",
    cat: "syntax", level: "精熟",
    title: "倒裝句",
    en: "Inversion",
    summary: "否定副詞、only、so/neither 置句首時，主詞與（助）動詞要倒裝。",
    structure: [
      { label: "否定副詞句首", formula: "Never/Seldom/Hardly + aux + S + V", tone: "a" },
      { label: "So/Neither 呼應", formula: "So / Neither + aux + S", tone: "b" },
      { label: "地方副詞句首", formula: "Here / There + V + S（名詞主詞）", tone: "c" },
    ],
    examples: [
      { en: "Never have I seen such a mess.", zh: "我從沒見過這麼亂。", note: "Never 句首 → 倒裝" },
      { en: "Not only is he smart, but he is also kind.", zh: "他不僅聰明還善良。" },
      { en: "“I'm tired.” “So am I.”", zh: "「我累了。」「我也是。」", note: "肯定呼應用 So" },
      { en: "Here comes the bus.", zh: "公車來了。", note: "地方副詞倒裝" },
    ],
    tips: [
      "否定副詞（never, seldom, hardly, no sooner, not until）置句首要倒裝。",
      "So + aux + S =「也」（肯定）；Neither / Nor + aux + S =「也不」。",
      "代名詞主詞的地方副詞句不倒裝：Here it comes（非 Here comes it）。",
    ],
    pitfalls: [
      { wrong: "Never I have seen it.", right: "Never have I seen it.", why: "否定副詞置句首，助動詞要移到主詞前。" },
    ],
    quiz: [
      { q: "Seldom ___ late for work.", opts: ["he is", "is he", "he does", "does he is"], a: 1, ex: "Seldom 置句首 → 倒裝 is he。" },
      { q: "“I can't swim.” “___.”", opts: ["So can I", "Neither can I", "So do I", "Neither do I"], a: 1, ex: "否定呼應用 Neither + can + I。" },
    ],
  },
  {
    id: "cleft",
    cat: "syntax", level: "進階",
    title: "強調句 It is … that",
    en: "Cleft Sentences",
    summary: "用 It is/was … that/who … 把想強調的部分拉到句首，凸顯重點。",
    structure: [
      { label: "強調句型", formula: "It is/was + 強調部分 + that/who + 其餘", tone: "a" },
    ],
    examples: [
      { en: "It was Tom who broke the window.", zh: "打破窗戶的是 Tom。", note: "強調人可用 who" },
      { en: "It is money that he cares about.", zh: "他在乎的是錢。", note: "強調受詞" },
      { en: "It was yesterday that I met her.", zh: "我遇見她是昨天。", note: "強調時間" },
    ],
    tips: [
      "強調人可用 who，其餘用 that；不能省略 that/who。",
      "可強調主詞、受詞、時間、地點，但不強調動詞。",
      "判斷法：拿掉 It is … that 後仍是完整句子。",
    ],
    pitfalls: [
      { wrong: "It was Tom broke the window.", right: "It was Tom who broke the window.", why: "強調句不可省略 that/who。" },
    ],
    quiz: [
      { q: "___ my keys that I lost, not my wallet.", opts: ["It was", "There was", "That was", "It is"], a: 0, ex: "強調句 It was … that；過去事件用 was。" },
      { q: "It was in Paris ___ they first met.", opts: ["which", "when", "that", "where"], a: 2, ex: "強調句連接詞一律用 that。" },
    ],
  },
  {
    id: "tag-question",
    cat: "syntax", level: "基礎",
    title: "附加問句",
    en: "Tag Questions",
    summary: "句尾加簡短問句確認：「前肯後否、前否後肯」，助動詞與主詞要呼應。",
    structure: [
      { label: "前肯定 → 後否定", formula: "…, aux + not + S ?", tone: "a" },
      { label: "前否定 → 後肯定", formula: "…, aux + S ?", tone: "b" },
    ],
    examples: [
      { en: "You're a student, aren't you?", zh: "你是學生，對吧？" },
      { en: "She can't swim, can she?", zh: "她不會游泳，對吧？" },
      { en: "Let's go, shall we?", zh: "我們走吧，好嗎？", note: "Let's → shall we" },
      { en: "Open the door, will you?", zh: "開個門，好嗎？", note: "祈使句 → will you" },
    ],
    tips: [
      "前肯後否、前否後肯；時態與助動詞要一致。",
      "Let's → shall we；祈使句 → will you / won't you。",
      "I am … 的附加問句用 aren't I。",
    ],
    pitfalls: [
      { wrong: "You are tired, don't you?", right: "You are tired, aren't you?", why: "主句用 be 動詞，附加問句也用 be（aren't）。" },
    ],
    quiz: [
      { q: "He works hard, ___?", opts: ["doesn't he", "isn't he", "won't he", "does he"], a: 0, ex: "一般動詞肯定 → doesn't he。" },
      { q: "Let's take a photo, ___?", opts: ["will we", "shall we", "do we", "don't we"], a: 1, ex: "Let's → shall we。" },
    ],
  },
  {
    id: "sv-agreement",
    cat: "syntax", level: "進階",
    title: "主詞動詞一致",
    en: "Subject-Verb Agreement",
    summary: "動詞單複數要與「真正的主詞」一致，小心 of 片語、each/every、就近原則等陷阱。",
    structure: [
      { label: "each/every + 單數", formula: "each / every + N + 單數V", tone: "a" },
      { label: "A of B（看 A）", formula: "The number of … + is", tone: "b" },
      { label: "就近原則", formula: "either/neither … or/nor → 配最近主詞", tone: "c" },
    ],
    examples: [
      { en: "Each student has a locker.", zh: "每位學生都有置物櫃。", note: "each 視為單數" },
      { en: "The list of names is long.", zh: "名單很長。", note: "主詞是 list（單數）" },
      { en: "Either you or he is wrong.", zh: "不是你就是他錯。", note: "就近原則，動詞配 he" },
      { en: "Ten years is a long time.", zh: "十年是很長的時間。", note: "時間金錢視為整體用單數" },
    ],
    tips: [
      "each / every / everyone / something 視為單數。",
      "「A of B」主詞在 of 前；但 a lot of / some of + 名詞則看 of 後名詞。",
      "either…or / neither…nor / not only…but also：動詞與「最近的主詞」一致。",
    ],
    pitfalls: [
      { wrong: "Everyone are happy.", right: "Everyone is happy.", why: "everyone 為單數。" },
      { wrong: "The number of students are rising.", right: "The number of students is rising.", why: "主詞是 the number（單數）。" },
    ],
    quiz: [
      { q: "Neither the players nor the coach ___ happy.", opts: ["are", "is", "were", "being"], a: 1, ex: "就近原則，配 coach（單數）用 is。" },
      { q: "Every boy and girl ___ a gift.", opts: ["have", "has", "are", "were"], a: 1, ex: "every … and … 視為單數用 has。" },
      { q: "A lot of information ___ available online.", opts: ["are", "is", "were", "have"], a: 1, ex: "a lot of + 不可數 information，用 is。" },
    ],
  },
  {
    id: "participial-construction",
    cat: "syntax", level: "精熟",
    title: "分詞構句",
    en: "Participial Constructions",
    summary: "把副詞子句簡化：省略連接詞與主詞，動詞改分詞（主動 -ing、被動 -ed）。",
    structure: [
      { label: "主動", formula: "V-ing …, S + V", tone: "a" },
      { label: "被動", formula: "(Being) + p.p. …, S + V", tone: "b" },
    ],
    examples: [
      { en: "Walking down the street, I met an old friend.", zh: "走在街上時，我遇到老朋友。", note: "= While I was walking" },
      { en: "Finished with work, she went home.", zh: "工作做完後她回家了。", note: "被動/完成，Being 常省略" },
      { en: "Not knowing the answer, he stayed silent.", zh: "因為不知道答案，他保持沉默。", note: "否定放 Not 於句首" },
    ],
    tips: [
      "主詞相同才能簡化；分詞的邏輯主詞＝主句主詞。",
      "主動用 V-ing，被動用 (being) p.p.，Being 常省略。",
      "否定分詞構句：Not + V-ing。",
    ],
    pitfalls: [
      { wrong: "Walking down the street, a dog barked at me.", right: "Walking down the street, I saw a dog.", why: "分詞邏輯主詞須與主句一致（走路的是我，不是狗）。" },
    ],
    quiz: [
      { q: "___ tired, he took a nap.", opts: ["Feeling", "Felt", "To feel", "Feel"], a: 0, ex: "主動感受用現在分詞 Feeling。" },
      { q: "___ in 1990, the building is old.", opts: ["Building", "Built", "To build", "Build"], a: 1, ex: "建築物「被建造」，用過去分詞 Built。" },
    ],
  },

  /* =====================================================
     ⑦ 動詞句型 VERB PATTERNS
     ===================================================== */
  {
    id: "causative",
    cat: "verb", level: "進階",
    title: "使役動詞 make / let / have / get",
    en: "Causative Verbs",
    summary: "「要某人做某事」：make/let/have + O + 原形；get + O + to V；受詞被動則接 p.p.。",
    structure: [
      { label: "make/let/have", formula: "make/let/have + O + 原形V", tone: "a" },
      { label: "get", formula: "get + O + to V", tone: "b" },
      { label: "受詞被動", formula: "have/get + O + p.p.", tone: "c" },
    ],
    examples: [
      { en: "My mom made me clean my room.", zh: "我媽要我打掃房間。", note: "make + O + 原形" },
      { en: "Let me help you.", zh: "讓我幫你。", note: "let + O + 原形" },
      { en: "I had my hair cut.", zh: "我去剪了頭髮。", note: "頭髮被剪，用 p.p." },
      { en: "I got him to fix my car.", zh: "我請他修我的車。", note: "get + O + to V" },
    ],
    tips: [
      "make / let / have + 受詞 + 原形動詞（不加 to）。",
      "get 例外：get + 受詞 + to V。",
      "受詞是「被動作」時用 p.p.：have/get + sth + p.p.（have the car washed）。",
    ],
    pitfalls: [
      { wrong: "She made me to wait.", right: "She made me wait.", why: "make 後受詞接原形，不加 to。" },
      { wrong: "I had my car repair.", right: "I had my car repaired.", why: "車被修，用過去分詞 repaired。" },
    ],
    quiz: [
      { q: "The teacher had us ___ the poem.", opts: ["memorize", "to memorize", "memorized", "memorizing"], a: 0, ex: "have + O + 原形 memorize。" },
      { q: "I need to get my computer ___.", opts: ["fix", "to fix", "fixed", "fixing"], a: 2, ex: "電腦被修，get + O + p.p.。" },
      { q: "Please let me ___.", opts: ["to go", "go", "going", "gone"], a: 1, ex: "let + O + 原形 go。" },
    ],
  },
  {
    id: "perception",
    cat: "verb", level: "進階",
    title: "感官動詞 see / hear / watch",
    en: "Verbs of Perception",
    summary: "感官動詞 + 受詞 + 原形（看到全程）或 -ing（看到正在進行的片段）。",
    structure: [
      { label: "看到全程", formula: "see/hear/watch + O + 原形V", tone: "a" },
      { label: "看到進行中", formula: "see/hear/watch + O + V-ing", tone: "b" },
    ],
    examples: [
      { en: "I saw him cross the street.", zh: "我看見他過馬路（全程）。", note: "原形＝完整動作" },
      { en: "I saw him crossing the street.", zh: "我看見他正在過馬路。", note: "-ing＝進行片段" },
      { en: "I heard someone knocking.", zh: "我聽見有人在敲門。" },
      { en: "She felt the ground shake.", zh: "她感覺地面震動。" },
    ],
    tips: [
      "原形＝看／聽到「完整動作」；-ing＝看／聽到「進行中的片段」。",
      "感官動詞被動時要還原 to：He was seen to cross。",
      "常見感官動詞：see, watch, notice, hear, listen to, feel。",
    ],
    pitfalls: [
      { wrong: "I heard her to sing.", right: "I heard her sing. / …singing.", why: "感官動詞主動後接原形或 -ing，不加 to。" },
    ],
    quiz: [
      { q: "We watched the sun ___ behind the hills.", opts: ["to set", "set", "sets", "to setting"], a: 1, ex: "感官動詞 + O + 原形 set。" },
      { q: "Right now I can hear the birds ___ outside.", opts: ["sing", "to sing", "singing", "sang"], a: 2, ex: "正在進行的片段用 V-ing singing。" },
    ],
  },
  {
    id: "phrasal-verbs",
    cat: "verb", level: "進階",
    title: "動詞片語",
    en: "Phrasal Verbs",
    summary: "動詞 + 介副詞形成新義；可分離片語的受詞若是代名詞，必須放中間。",
    structure: [
      { label: "可分離", formula: "turn + it + on（代名詞放中間）", tone: "a" },
      { label: "不可分離", formula: "look after + O", tone: "b" },
    ],
    examples: [
      { en: "Turn off the light. / Turn it off.", zh: "關燈／關掉它。", note: "代名詞 it 放中間" },
      { en: "Please look after my dog.", zh: "請照顧我的狗。", note: "不可分離" },
      { en: "I ran into an old friend.", zh: "我巧遇一位老朋友。", note: "run into = 偶遇" },
      { en: "We need to carry out the plan.", zh: "我們得執行這個計畫。" },
    ],
    tips: [
      "可分離片語：受詞為代名詞時必須放中間（turn it on，非 turn on it）。",
      "不可分離片語：受詞一律放片語後（look after her）。",
      "多益 Part 5 高頻：come up with, put off, take over, look forward to。",
    ],
    pitfalls: [
      { wrong: "Turn on it.", right: "Turn it on.", why: "可分離片語，代名詞受詞須放中間。" },
    ],
    quiz: [
      { q: "The meeting was ___ until Friday.", opts: ["put off", "put on", "put up", "put in"], a: 0, ex: "put off =「延期」。" },
      { q: "I'll pick you ___ at seven.", opts: ["on", "up", "off", "in"], a: 1, ex: "pick sb up =「接某人」。" },
      { q: "This jacket is dirty; I need to take ___.", opts: ["it off", "off it", "out it", "it out"], a: 0, ex: "可分離片語，代名詞放中間 take it off。" },
    ],
  },
  {
    id: "verb-patterns",
    cat: "verb", level: "進階",
    title: "常考動詞句型",
    en: "Special Verb Patterns",
    summary: "spend/take 花費、It takes、so…that、such…that、prevent…from 等高頻句型。",
    structure: [
      { label: "花時間", formula: "S + spend + 時間 + (in) V-ing", tone: "a" },
      { label: "虛主詞花費", formula: "It takes + sb + 時間 + to V", tone: "b" },
      { label: "阻止", formula: "prevent/stop + O + from + V-ing", tone: "c" },
    ],
    examples: [
      { en: "I spent two hours doing homework.", zh: "我花兩小時寫功課。", note: "spend + 時間 + V-ing" },
      { en: "It took me an hour to finish.", zh: "我花了一小時完成。", note: "It takes sb 時間 to V" },
      { en: "The rain prevented us from going out.", zh: "雨讓我們無法出門。", note: "prevent … from V-ing" },
      { en: "He is such a kind man that everyone likes him.", zh: "他是如此善良的人，大家都喜歡他。", note: "such + a + adj + N + that" },
    ],
    tips: [
      "spend 主詞是人：spend 時間/金錢 + (on N) / (in) V-ing。",
      "It takes + 人 + 時間 + to V（花時間做某事）。",
      "so + adj/adv + that；such + (a) + adj + N + that。",
    ],
    pitfalls: [
      { wrong: "I spent two hours to do it.", right: "I spent two hours doing it.", why: "spend 後接 V-ing，不接 to V。" },
      { wrong: "It took me to finish two hours.", right: "It took me two hours to finish.", why: "It takes sb 時間 to V 語序固定。" },
    ],
    quiz: [
      { q: "It ___ me twenty minutes to walk there.", opts: ["spends", "costs", "takes", "pays"], a: 2, ex: "It takes sb 時間 to V。" },
      { q: "She spent all day ___ for the exam.", opts: ["to study", "study", "studying", "studied"], a: 2, ex: "spend + 時間 + V-ing。" },
      { q: "It was ___ a hot day that we stayed inside.", opts: ["so", "such", "very", "too"], a: 1, ex: "such + a + adj + N + that。" },
    ],
  },

  /* =====================================================
     ⑧ 多益商用 BUSINESS / TOEIC
     ===================================================== */
  {
    id: "modals-biz",
    cat: "biz", level: "進階",
    title: "情態助動詞（商用語氣）",
    en: "Modal Verbs at Work",
    summary: "would / could / should / might 讓職場英文更禮貌、更專業、更有分寸。",
    structure: [
      { label: "禮貌請求", formula: "Could / Would you + V …?", tone: "a" },
      { label: "建議", formula: "You should / might want to + V", tone: "b" },
      { label: "推測", formula: "may / might / must + V", tone: "c" },
    ],
    examples: [
      { en: "Could you send me the file, please?", zh: "可以請你把檔案寄給我嗎？（比 Can 更客氣）" },
      { en: "We should finalize the budget today.", zh: "我們今天應該把預算敲定。（建議）" },
      { en: "The client must be very satisfied.", zh: "客戶一定很滿意。（must 表強烈推測）" },
      { en: "I would appreciate a prompt reply.", zh: "若能盡快回覆，我將感激。（商用客套）" },
    ],
    tips: [
      "Could / Would 比 Can / Will 更禮貌，商用信件與會議首選。",
      "推測強度：must（一定）> may/might/could（可能）。",
      "should have + p.p.＝『早該……卻沒』，帶懊悔語氣。",
    ],
    pitfalls: [
      { wrong: "Would you to help me?", right: "Would you help me?", why: "情態助動詞後接原形，不加 to。" },
      { wrong: "He must worked late.", right: "He must have worked late.", why: "對過去推測用 must have + p.p.。" },
    ],
    quiz: [
      { q: "___ you mind sending the invoice again?", opts: ["Would", "Should", "Must", "May"], a: 0, ex: "禮貌請求 Would you mind + V-ing。" },
      { q: "The office is empty. Everyone ___ gone home.", opts: ["must have", "should", "can", "would"], a: 0, ex: "對過去的強烈推測用 must have + p.p.。" },
    ],
  },
  {
    id: "toeic-traps",
    cat: "biz", level: "精熟",
    title: "多益高頻文法陷阱",
    en: "Common TOEIC Traps",
    summary: "主詞動詞一致、平行結構、詞性選擇——這三類是多益 Part 5 的常客。",
    structure: [
      { label: "主謂一致", formula: "單數主詞 + 單數動詞", tone: "a" },
      { label: "平行結構", formula: "A, B, and C 詞性一致", tone: "b" },
      { label: "詞性判斷", formula: "空格前後決定 名/動/形/副", tone: "c" },
    ],
    examples: [
      { en: "The list of items is on the desk.", zh: "物品清單在桌上。", note: "主詞是 list（單數），動詞用 is" },
      { en: "The job requires planning, writing, and speaking.", zh: "這工作需要企劃、寫作與口說。（三個 V-ing 平行）" },
      { en: "The report was submitted successfully.", zh: "報告成功遞交了。", note: "修飾動詞用副詞 successfully" },
    ],
    tips: [
      "『of + 名詞』常是陷阱，真正主詞在 of 前面：The number of students is …。",
      "and / or 連接的成分詞性要一致（平行結構）。",
      "看空格前後判詞性：冠詞後→名詞、be 後→形容詞、動詞後→副詞。",
    ],
    pitfalls: [
      { wrong: "Each of the employees have a badge.", right: "Each of the employees has a badge.", why: "Each 是單數，動詞用 has。" },
      { wrong: "She is smart and works hard-working.", right: "She is smart and hard-working.", why: "and 前後要對等，皆為形容詞。" },
    ],
    quiz: [
      { q: "The quality of these products ___ excellent.", opts: ["are", "is", "were", "being"], a: 1, ex: "主詞是 quality（單數），動詞用 is。" },
      { q: "The manager reviewed the plan ___.", opts: ["careful", "carefully", "care", "caring"], a: 1, ex: "修飾動詞 reviewed 用副詞 carefully。" },
      { q: "We value honesty, teamwork, and ___.", opts: ["creative", "creatively", "creativity", "create"], a: 2, ex: "平行結構要名詞：creativity。" },
    ],
  },
  {
    id: "transitions",
    cat: "biz", level: "進階",
    title: "連接副詞（轉折・因果・遞進）",
    en: "Transitions",
    summary: "however、therefore、moreover 連接兩個完整句子，前面通常用分號或另起一句。",
    structure: [
      { label: "轉折", formula: "… ; however, …", tone: "a" },
      { label: "因果", formula: "… ; therefore, …", tone: "b" },
      { label: "遞進", formula: "… ; moreover / in addition, …", tone: "c" },
    ],
    examples: [
      { en: "It was raining; however, we went out.", zh: "下著雨，然而我們還是出門。" },
      { en: "He was sick; therefore, he stayed home.", zh: "他生病了，因此待在家。" },
      { en: "The plan is cheap; moreover, it's fast.", zh: "這方案便宜，而且快速。" },
      { en: "Sales rose. In addition, costs fell.", zh: "業績上升，此外成本下降。" },
    ],
    tips: [
      "連接副詞連接兩個獨立句，前面用分號或句號，後面常加逗號。",
      "however ≠ but：however 是副詞，不能像連接詞直接連兩句。",
      "多益高頻：nevertheless, otherwise, meanwhile, as a result, on the other hand。",
    ],
    pitfalls: [
      { wrong: "I was tired, however I kept working.", right: "I was tired; however, I kept working.", why: "however 為副詞，兩句間需用分號（或句號）。" },
    ],
    quiz: [
      { q: "The product is popular; ___, it's expensive.", opts: ["however", "because", "so", "and"], a: 0, ex: "前後轉折用 however。" },
      { q: "We missed the train; ___, we took a taxi.", opts: ["moreover", "therefore", "however", "otherwise"], a: 1, ex: "因果結果用 therefore。" },
    ],
  },
  {
    id: "word-forms",
    cat: "biz", level: "精熟",
    title: "多益詞性變化（word family）",
    en: "Word Forms",
    summary: "同字根的名詞／動詞／形容詞／副詞變化，靠「空格位置」判斷該填哪種詞性。",
    structure: [
      { label: "冠詞/形容詞後", formula: "the / adj + 名詞", tone: "a" },
      { label: "主詞後/ be 後", formula: "S + 動詞 · be + 形容詞", tone: "b" },
      { label: "修飾動詞形容詞", formula: "… + 副詞", tone: "c" },
    ],
    examples: [
      { en: "We need your decision.", zh: "我們需要你的決定。", note: "your 後用名詞 decision" },
      { en: "Please decide soon.", zh: "請盡快決定。", note: "主詞後用動詞 decide" },
      { en: "It was a decisive moment.", zh: "那是決定性的一刻。", note: "名詞前用形容詞 decisive" },
      { en: "He acted decisively.", zh: "他果斷地行動。", note: "修飾動詞用副詞 decisively" },
    ],
    tips: [
      "常見字尾：名詞 -tion/-ment/-ness/-ity；形容詞 -ive/-ful/-ous/-al；副詞 -ly。",
      "空格前是 the / a / 所有格 / 形容詞 → 多半填名詞。",
      "be 後、名詞前 → 填形容詞；修飾動詞或形容詞 → 填副詞。",
    ],
    pitfalls: [
      { wrong: "The company made a success decision.", right: "The company made a successful decision.", why: "名詞 decision 前要用形容詞 successful。" },
    ],
    quiz: [
      { q: "The manager gave a ___ presentation.", opts: ["success", "successful", "succeed", "successfully"], a: 1, ex: "名詞 presentation 前用形容詞 successful。" },
      { q: "Sales grew ___ this quarter.", opts: ["significant", "significance", "significantly", "signify"], a: 2, ex: "修飾動詞 grew 用副詞 significantly。" },
      { q: "We value your ___.", opts: ["contribute", "contribution", "contributive", "contributively"], a: 1, ex: "所有格 your 後用名詞 contribution。" },
    ],
  },
];

// 匯出到全域
window.CATEGORIES = CATEGORIES;
window.LESSONS = LESSONS;
