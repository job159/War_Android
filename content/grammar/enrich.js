/* =========================================================
   GRAMMAR PRO — 課程增強內容 Part 1（時態・語態・子句）
   每課：hook 開場鉤子 / keywords 訊號字 / visual 圖解 / faq 師生問答 / recap 重點回顧
   visual.type: timeline（時間軸）| table（對照表）| flow（流程圖）
   ========================================================= */
window.ENRICH = {

/* ============ 時態 ============ */
"present-simple-cont": {
  hook: "中文說「我在銀行上班」和「我今天在家上班」，動詞一模一樣；英文卻硬要分成兩種時態。判斷只需要問一個問題：這件事是「一直如此」，還是「此刻、暫時」？答對這一題，兩大時態就分完了。",
  keywords: ["always / usually / every day → 簡單式","now / right now / at the moment → 進行式","Look! / Listen! → 進行式","know / like / want（狀態動詞）→ 不用進行式"],
  visual: { type:"timeline", title:"一張時間軸看懂", note:"藍點＝天天重複的「習慣」，散佈在整條時間軸上；紫條＝只發生在「此刻」的暫時動作。", items:[
    { row:0, kind:"dots", from:10, to:90, step:10, color:"#0ea5e9", label:"現在簡單式：習慣重複發生", lx:10 },
    { row:1, kind:"bar", from:44, to:57, color:"#8b5cf6", label:"現在進行式：此刻正在", lx:38 }
  ]},
  faq: [
    { q: "為什麼 I am knowing the answer 是錯的？", a: "know 是「狀態」不是「動作」——狀態沒有『正在進行』的過程。know、like、want、believe、own 這些狀態動詞，幾乎永遠用簡單式。" },
    { q: "看到 always 就一定選簡單式嗎？", a: "九成是。但有個進階用法：be always V-ing 表「老是……」的抱怨語氣，例如 He is always losing his keys.（他老是掉鑰匙）。學測進階選項會考。" }
  ],
  recap: ["習慣、事實、真理 → 現在簡單式（第三人稱單數 +s/es）","此刻、暫時、變化中 → am/is/are + V-ing","狀態動詞（know, like, want, believe）不用進行式","be always V-ing ＝ 帶抱怨的「老是」"]
},

"present-perfect": {
  hook: "「他去了日本。」——人還在日本，還是已經回來了？中文其實說不清楚，英文卻用 has gone / has been 一秒分清。現在完成式的本質只有一句話：把「過去發生的事」和「現在的狀態」綁在一起。",
  keywords: ["already ✧ 已經","yet ✧ 疑問／否定句尾","just ✧ 剛剛","ever / never ✧ 經驗","since + 時間起點","for + 一段時間","so far / recently"],
  visual: { type:"timeline", title:"一張時間軸看懂", note:"事情在過去發生（藍點），但箭頭一路延伸到「現在」——影響還在、或動作持續到現在，這就是完成式。", items:[
    { row:0, kind:"dot", at:20, color:"#0ea5e9", label:"過去發生", lx:13 },
    { row:1, kind:"arrow", from:20, to:50, color:"#8b5cf6", label:"影響／持續到現在：have + p.p.", lx:18 },
    { row:1, kind:"dot", at:50, color:"#10b981" }
  ]},
  faq: [
    { q: "I have seen him yesterday. 到底哪裡錯？", a: "yesterday 是「明確的過去時間」，而完成式強調的是「現在」——兩者互相矛盾。只要句中出現過去時間（yesterday, last week, in 2020），一律改用過去簡單式：I saw him yesterday." },
    { q: "have been to 和 have gone to 怎麼分？", a: "been＝去過、已經回來（經驗）；gone＝去了、人還沒回來。所以「He has gone to Japan.」代表他現在人在日本或路上。" }
  ],
  recap: ["結構：have/has + 過去分詞（p.p.）","for + 一段時間；since + 時間起點","有明確過去時間（yesterday…）→ 改用過去式","been = 去過回來了；gone = 去了沒回來"]
},

"perfect-continuous": {
  hook: "朋友滿頭大汗走進來，你想說：「你是不是一直在跑步？」——重點不是跑完沒有，而是「持續了一段時間、痕跡就在眼前」。這正是完成進行式的主場：強調過程，而不是結果。",
  keywords: ["for + 一段時間","since + 起點","all day / all night","How long … ?","lately / recently"],
  visual: { type:"timeline", title:"一張時間軸看懂", note:"實心長條＝動作從過去持續到現在；虛線＝很可能還會繼續下去。完成進行式看的是「這一整段」。", items:[
    { row:0, kind:"bar", from:22, to:50, dashTo:60, color:"#8b5cf6", label:"have been V-ing：持續進行中（可能繼續）", lx:14 }
  ]},
  faq: [
    { q: "完成式和完成進行式差在哪？", a: "完成式看「結果」：I've read the book.（讀完了）；完成進行式看「過程」：I've been reading all day.（讀了一整天，不一定讀完）。想強調做了多久、多累、多久沒停，就用完成進行式。" },
    { q: "所有動詞都能用完成進行式嗎？", a: "狀態動詞不行。know、own、believe 這類要改用完成式：I have known him for years.（✗ have been knowing）" }
  ],
  recap: ["結構：have/has been + V-ing","強調「持續的過程」與「做了多久」","常搭 for / since / all day / How long","狀態動詞改用現在完成式"]
},

"past-continuous": {
  hook: "說故事的黃金時態：先鋪背景，再放事件。「當時雨正下著（was raining），突然有人敲門（knocked）。」長動作是舞台，短動作是主角——舞台用過去進行式，主角用過去簡單式。",
  keywords: ["while + 過去進行式","when + 過去簡單式","at 8 p.m. last night","all evening ✧ 整段時間"],
  visual: { type:"timeline", title:"一張時間軸看懂", note:"藍色長條＝正在進行的背景動作；紅點＝突然發生、把背景「切一刀」的短動作。", items:[
    { row:0, kind:"bar", from:14, to:42, color:"#0ea5e9", label:"背景長動作：was/were + V-ing", lx:10 },
    { row:1, kind:"dot", at:28, color:"#f43f5e", label:"短動作打斷（過去簡單式）", lx:21 }
  ]},
  faq: [
    { q: "while 和 when 有什麼不一樣？", a: "while 後面通常接「長」動作（過去進行式）：While I was cooking, …；when 後面通常接「短」動作（過去簡單式）：…, when the phone rang. 記住「while 長 when 短」就能秒選。" },
    { q: "兩個動作同時進行怎麼寫？", a: "兩邊都用過去進行式：While I was reading, my sister was cooking.（我看書的同時，姊姊在煮飯。）" }
  ],
  recap: ["結構：was/were + V-ing","背景長動作用進行式，突發短動作用過去式","while 接長動作、when 接短動作","過去某時刻正在做 → 過去進行式"]
},

"past-perfect": {
  hook: "「我到車站時，火車開走了。」——火車是在你到「之前」開走的。中文靠一個「了」字打混過去，英文卻要用 had left 把先後排清楚。過去完成式的功能就一個：替兩件過去的事排出先後順序。",
  keywords: ["by the time + 過去式","before / after","already ✧ 早已","when ✧ 兩事並陳"],
  visual: { type:"timeline", title:"一張時間軸看懂", note:"兩件事都在過去：較早的（紫點）用 had + p.p.，較晚的（藍點）用過去簡單式。", items:[
    { row:0, kind:"dot", at:16, color:"#8b5cf6", label:"先發生：had left", lx:8 },
    { row:0, kind:"dot", at:38, color:"#0ea5e9", label:"後發生：arrived", lx:33 },
    { row:1, kind:"arrow", from:16, to:38, color:"#94a3b8", label:"過去的過去 → 過去", lx:17 }
  ]},
  faq: [
    { q: "一定要用過去完成式嗎？用兩個過去式不行嗎？", a: "如果 before / after 已經把先後講清楚，兩個過去簡單式也可以接受。但考試句型「By the time + 過去式」出現時，主句幾乎都在考 had + p.p.，看到就選。" },
    { q: "had had 是什麼東西？", a: "have 的過去完成式！第一個 had 是助動詞，第二個 had 是「吃、有」：I had had lunch before the meeting.（開會前我已吃過午餐。）" }
  ],
  recap: ["兩件過去的事，較早的用 had + p.p.","by the time + 過去式 → 主句配過去完成式","before/after 已表明先後時，過去式亦可","「過去的過去」＝過去完成式"]
},

"future": {
  hook: "同樣講未來，說 I'll get it. 是「（電話響了）我來接」，說 I'm going to quit. 是「我打算辭職（想很久了）」，說 We're meeting at 3. 是「三點見（行事曆都寫好了）」。英文用三種未來式，標記你的決定是幾秒前、幾天前、還是早已敲定。",
  keywords: ["tomorrow / next week","I think … will ✧ 主觀預測","Look at …! → be going to ✧ 有跡象","時刻表・課表 → 現在簡單式"],
  visual: { type:"table", title:"一張表比完三種未來", note:"考題給的「情境線索」決定答案：當下反應選 will，早有打算選 be going to，行程敲定選現在進行式。", head:["句型","使用時機","例句"], rows:[
    ["<b>will + V</b>","說話當下才決定／單純預測","The phone is ringing—I'<b>ll get</b> it."],
    ["<b>be going to + V</b>","先前就有的打算／眼前有徵兆","I'<b>m going to</b> start a business. / It'<b>s going to</b> rain."],
    ["<b>現在進行式</b>","時間地點已敲定的安排","We'<b>re meeting</b> the client at 3 p.m."],
    ["<b>現在簡單式</b>","時刻表、課表等固定時程","The train <b>leaves</b> at 9."]
  ]},
  faq: [
    { q: "will 和 be going to 都能表「預測」，怎麼分？", a: "will＝主觀看法（I think it will rain. 我覺得會下雨）；be going to＝眼前有證據（烏雲密布 → It's going to rain. 就要下了）。看到 Look at those clouds! 就選 be going to。" },
    { q: "為什麼火車時刻表用現在式？", a: "時刻表、課表是「固定不變的事實」，即使講未來也用現在簡單式：The movie starts at 8." }
  ],
  recap: ["當下決定／預測 → will","既定計畫／有跡象 → be going to","已敲定的行程 → 現在進行式","時刻表 → 現在簡單式"]
},

"future-perfect": {
  hook: "「到 2030 年，我就畢業十年了。」——想像把自己傳送到未來某個時間點，回頭一看，事情已經完成。這種「未來回望」的視角，就是 will have + p.p.。",
  keywords: ["by + 未來時間","by the time + 現在式","this time tomorrow → 未來進行式"],
  visual: { type:"timeline", title:"一張時間軸看懂", note:"從現在（綠點）出發，在期限（橘點）之前完成——箭頭涵蓋的就是 will have + p.p. 的範圍。", items:[
    { row:0, kind:"dot", at:50, color:"#10b981", label:"現在", lx:46 },
    { row:0, kind:"dot", at:82, color:"#f59e0b", label:"期限 by 2030", lx:74 },
    { row:1, kind:"arrow", from:50, to:82, color:"#8b5cf6", label:"期限前完成：will have + p.p.", lx:42 }
  ]},
  faq: [
    { q: "by the time 後面要接什麼時態？", a: "接「現在式」而不是 will（時間子句不用未來式）：By the time you arrive, we will have finished dinner." },
    { q: "那未來進行式什麼時候用？", a: "表達未來某個時刻「正在做某事」：This time tomorrow, I'll be flying to Tokyo.（明天此時我正飛往東京。）" }
  ],
  recap: ["by + 未來時間 → will have + p.p.","by the time + 現在式，主句用未來完成式","未來某時「正在」→ will be + V-ing","時間子句一律用現在式代未來"]
},

"tense-agreement": {
  hook: "直接引述像播錄音檔，間接轉述像主播轉播——說話的時間點變了，時態就得跟著往回撥一格。He said, \"I am tired.\" 變成 He said he was tired.，這個「倒退嚕」就是時態一致。",
  keywords: ["said (that) …","told sb (that) …","asked if / whether","now → then ✧ today → that day"],
  visual: { type:"table", title:"時態倒退對照表", note:"主句是過去式（said / told）時，子句時態整體往過去退一格；唯一例外：不變的真理。", head:["直述句裡是","轉述後變成","例句"], rows:[
    ["am / is / are","was / were","\"I <b>am</b> busy.\" → He said he <b>was</b> busy."],
    ["V / V-s（現在式）","V-ed（過去式）","\"I <b>like</b> it.\" → She said she <b>liked</b> it."],
    ["V-ed（過去式）","had + p.p.","\"I <b>sent</b> it.\" → He said he <b>had sent</b> it."],
    ["will / can / may","would / could / might","\"I <b>will</b> come.\" → She said she <b>would</b> come."],
    ["恆真事實","<span class='ok'>不變</span>","The teacher said the earth <b>is</b> round."]
  ]},
  faq: [
    { q: "為什麼「地球是圓的」不用退時態？", a: "科學事實、不變的真理不隨說話時間改變，保持現在式：Mom told me that honesty is the best policy." },
    { q: "只有時態要改嗎？", a: "時間、地點詞也要跟著搬家：now→then、today→that day、here→there、tomorrow→the next day、yesterday→the day before。" }
  ],
  recap: ["主句過去 → 子句時態退一格","will→would、can→could、may→might","恆真事實維持現在式","now→then、today→that day 也要換"]
},

/* ============ 語態與語氣 ============ */
"passive": {
  hook: "「報告寫完了。」——誰寫的根本不重要，重要的是報告本身。當焦點落在「承受動作的東西」上，英文就把它拉到句首當主角，動詞換上 be + p.p. 的制服：這就是被動語態。",
  keywords: ["be + p.p.（時態全看 be）","by + 動作者（可省略）","進行被動 be being + p.p.","完成被動 have been + p.p."],
  visual: { type:"flow", title:"主動改被動，三步完成", note:"時態不會消失，只是全部搬到 be 動詞上：is written（現在）→ was written（過去）→ will be written（未來）。", steps:[
    { t:"受詞搬到句首", d:"Amy wrote the report. → The report ..." },
    { t:"動詞改 be + p.p.", d:"The report was written ..." },
    { t:"原主詞放 by 後（可省）", d:"The report was written (by Amy)." }
  ]},
  faq: [
    { q: "什麼時候可以把 by … 整個刪掉？", a: "動作者「未知、不重要、或大家都知道」的時候：English is spoken here.（誰說的不重要）／My bike was stolen.（不知道誰偷的）。" },
    { q: "進行式的被動長什麼樣子？", a: "把 be 拆成「be + being」：The bridge is being repaired.（橋正在被修。）完成式被動則是 have/has been + p.p.：Our order has been shipped." }
  ],
  recap: ["公式：be + 過去分詞（p.p.）","時態變化全部發生在 be 動詞上","動作者不重要 → 省略 by 片語","進行被動 being + p.p.；完成被動 been + p.p."]
},

"passive-advanced": {
  hook: "主動說 make him go，被動卻要說 be made to go——那個憑空冒出來的 to 是哪來的？進階被動考的全是這種「變形細節」：使役感官要補 to、雙受詞挑一個當主詞、慣用搭配不用 by。",
  visual: { type:"table", title:"進階被動對照表", head:["主動","被動","關鍵"], rows:[
    ["make him <b>go</b>","be made <b>to go</b>","使役被動要補 to"],
    ["see him <b>cross</b>","be seen <b>to cross</b>","感官被動也補 to"],
    ["give <b>me</b> a gift","<b>I</b> was given a gift","雙受詞：人當主詞最常見"],
    ["Snow covers the hill","be covered <b>with</b> snow","慣用搭配不用 by"],
    ["look after the dog","be <b>looked after</b>","片語動詞整組保留"]
  ]},
  faq: [
    { q: "為什麼被動要把 to 補回來？", a: "使役／感官動詞在主動句裡其實「吃掉」了不定詞的 to（make him (to) go）；一變被動，吃掉 to 的框架消失，to 就得還原。" },
    { q: "be known to / for / as 差在哪？", a: "to＝為「誰」所知（對象）：known to everyone；for＝因「什麼」聞名（原因）：known for her kindness；as＝以「什麼身分」聞名：known as a poet。" }
  ],
  recap: ["be made / seen + to V（補回 to）","雙受詞被動：人當主詞最自然","慣用介系詞：covered with、interested in、known for/to/as","片語動詞被動要整組保留（be looked after）"]
},

"conditionals": {
  hook: "同一句「如果我有錢」，可能是真的在存錢（If I save enough, I will…），也可能是躺著做白日夢（If I were rich, I would…）。英文用時態當「現實度儀表板」——時態退得越後面，事情越不可能發生。",
  keywords: ["If + 現在式 → will（可能成真）","If + 過去式 → would（與現在相反）","If + had p.p. → would have p.p.（與過去相反）","unless = if … not"],
  visual: { type:"table", title:"四類條件句一表掌握", note:"口訣：時態越「倒退」，現實度越低。第 2、3 類是虛擬語氣，be 動詞一律用 were。", head:["類型","If 子句","主句","什麼時候用"], rows:[
    ["第 0 類・恆真","現在式","現在式","科學事實：If you heat ice, it <b>melts</b>."],
    ["第 1 類・可能","現在式","will + V","真的可能發生：If it rains, we <b>will stay</b> home."],
    ["第 2 類・與現在相反","過去式（be→<b>were</b>）","would + V","白日夢：If I <b>were</b> you, I <b>would</b> take it."],
    ["第 3 類・與過去相反","had + p.p.","would have + p.p.","悔不當初：If she <b>had studied</b>, she <b>would have passed</b>."]
  ]},
  faq: [
    { q: "為什麼 if 子句不能用 will？", a: "if 子句是「條件」不是「預測」，英文規定條件用現在式代替未來：If I have time(✓) / If I will have time(✗), I will call you." },
    { q: "If I was rich 到底行不行？", a: "口語聽得到，但考試一律選 were——與現在事實相反的假設，be 動詞不分人稱全用 were：If I were you…" }
  ],
  recap: ["第 1 類：If 現在式 → will（可能）","第 2 類：If 過去式 → would（與現在相反，be 用 were）","第 3 類：If had p.p. → would have p.p.（與過去相反）","if 子句永遠不放 will"]
},

"subjunctive-wish": {
  hook: "wish 後面的時態是一台時光機：往回撥「一格」＝對現在不滿（wish I were taller），往回撥「兩格」＝對過去後悔（wish I had studied）。撥錯格數，遺憾就表錯了時空。",
  keywords: ["wish + 過去式 ✧ 現在的遺憾","wish + had p.p. ✧ 過去的懊悔","as if / as though + 過去式","It's high time + 過去式"],
  visual: { type:"table", title:"虛擬句型對照表", head:["想表達","句型","例句"], rows:[
    ["對現在不滿","wish + <b>過去式</b>","I wish I <b>were</b> taller.（其實不高）"],
    ["對過去後悔","wish + <b>had p.p.</b>","I wish I <b>had studied</b> harder.（當時沒有）"],
    ["講得好像…（其實不是）","as if + <b>過去式</b>","He talks as if he <b>knew</b> everything."],
    ["寧願某人…","would rather + S + <b>過去式</b>","I'd rather you <b>didn't</b> smoke here."],
    ["早該…了","It's high time + S + <b>過去式</b>","It's high time we <b>went</b> home."]
  ]},
  faq: [
    { q: "wish 和 hope 差在哪？", a: "hope＝有機會實現的希望，接正常時態：I hope you pass the exam.；wish＝與事實相反的願望，時態要倒退：I wish I were taller.（但我就是不高）" },
    { q: "would rather 後面到底接什麼？", a: "接「人 + 過去式」表寧願對方（現在/未來）做或不做某事：I'd rather you didn't tell him.（我寧願你別跟他說。）" }
  ],
  recap: ["wish + 過去式 → 對「現在」的遺憾","wish + had p.p. → 對「過去」的懊悔","as if + 過去式 → 與現實相反的「彷彿」","It's high time + 過去式 → 早該……了"]
},

"imperatives": {
  hook: "廣告標語、食譜、路標、健身教練的口號——全是祈使句。它是英文最短的完整句：主詞 You 直接隱形，動詞原形開場。而它跟 and / or 的組合，是學測翻譯的常勝考點。",
  visual: { type:"table", title:"祈使句全家福", head:["句型","用途","例句"], rows:[
    ["V + …","命令・指示","<b>Close</b> the door, please."],
    ["Don't + V","禁止・提醒","<b>Don't be</b> late.（be 也用原形）"],
    ["Let's + V","提議一起做","<b>Let's take</b> a break."],
    ["祈使句, <b>and</b> …","做了就會…","Study hard, <b>and</b> you'll pass."],
    ["祈使句, <b>or</b> …","否則就會…","Hurry up, <b>or</b> you'll miss the bus."]
  ]},
  faq: [
    { q: "祈使句 + and 和 + or 怎麼快速判斷？", a: "看後果是「好事」還是「壞事」：好事用 and（做了就會成功），壞事用 or（不做就會倒楣）。" },
    { q: "想更有禮貌怎麼說？", a: "句尾加 please、或升級成疑問句：Would you close the door? / Could you help me? 商用場合一律用後者。" }
  ],
  recap: ["動詞原形開頭，主詞 You 隱形","否定：Don't + 原形（Don't be late）","祈使句 + and ＝ 就會；+ or ＝ 否則","Let's 的否定是 Let's not"]
},

/* ============ 子句與連接 ============ */
"relative": {
  hook: "兩句合一句的魔法：The man called you. ＋ He is my uncle. → The man who called you is my uncle. 關係代名詞就是那個「接頭零件」——先行詞是人用 who、是物用 which，「誰的」用 whose。",
  keywords: ["人 → who","物 → which / that","所有格 → whose","逗號（非限定）→ 不可用 that","關代當受詞 → 可省略"],
  visual: { type:"table", title:"關係代名詞選擇表", note:"非限定子句（有逗號）＝純補充，不能用 that，也不能省略關代。", head:["先行詞","主格","受格","所有格"], rows:[
    ["人","who","whom / who<br><span class='ok'>可省略</span>","whose"],
    ["物・動物","which","which<br><span class='ok'>可省略</span>","whose / of which"],
    ["人或物皆可","that","that<br><span class='ok'>可省略</span>","—"],
    ["非限定（逗號）","who / which","who(m) / which","<span class='no'>不可用 that</span>"]
  ]},
  faq: [
    { q: "什麼時候關係代名詞可以直接刪掉？", a: "當它在子句裡當「受詞」時：the book (that) I read、the man (whom) I met。當主詞時不能刪：the man who called you。" },
    { q: "有逗號跟沒逗號差在哪？", a: "沒逗號＝限定（幫你鎖定是哪一個）：The students who studied passed.（只有讀書的過）；有逗號＝補充（拿掉句子還是完整）：Taipei, which is in the north, is crowded." }
  ],
  recap: ["人 who、物 which、that 通吃（限定用法）","whose ＝ 誰的（人物皆可）","關代當受詞可省略","非限定子句（逗號）不可用 that"]
},

"relative-adverb": {
  hook: "where 其實是 in which 的縮寫。判斷用 where 還是 which，只看一件事：後面的句子「完整」還是「缺角」？完整就用關係副詞，缺主詞或受詞就用關係代名詞。一個口訣考遍天下。",
  keywords: ["地點 → where","時間 → when","the reason → why","子句完整 → 關係副詞","子句缺角 → which / that"],
  visual: { type:"table", title:"關係副詞對照表", note:"驗證法：把 where 還原成 in/at which，句子通就對了。", head:["關係副詞","先行詞","等於","例句"], rows:[
    ["where","地點","in / at which","the house <b>where</b> I grew up"],
    ["when","時間","on / in which","the day <b>when</b> we met"],
    ["why","the reason","for which","the reason <b>why</b> she quit"]
  ]},
  faq: [
    { q: "the city which 和 the city where，怎麼判斷？", a: "看子句缺不缺東西：I was born in the city.（句子完整→where）；I visited the city.（visited 缺受詞→which）。「缺角用 which，完整用 where」。" },
    { q: "the way how 為什麼是錯的？", a: "the way 和 how 功能重複，只能擇一：the way she talks 或 how she talks，兩個不能同時出現。" }
  ],
  recap: ["where＝in/at which（地點）","when＝on/in which（時間）","why 只配 the reason","子句完整→關係副詞；缺主/受詞→which"]
},

"noun-clause": {
  hook: "把一整句話「打包」成一個名詞，塞進另一個句子裡——I know ＋ He is right. → I know that he is right. 打包用的膠帶有三種：that（事實）、whether/if（是否）、wh-（什麼/哪裡/為何）。",
  keywords: ["that + 完整敘述","whether / if ✧ 是否","wh- 疑問詞 + 直述語序","間接問句不倒裝"],
  visual: { type:"table", title:"三種名詞子句", note:"最大陷阱：間接問句要用「直述語序」——疑問詞後面直接接主詞＋動詞，不要倒裝。", head:["引導詞","意思","例句"], rows:[
    ["that","敘述一件事實","I think <b>that he is right</b>.（that 可省）"],
    ["whether / if","是否","I wonder <b>whether it will rain</b>."],
    ["what / where / why…","疑問內容","Do you know <b>where she lives</b>?<br><span class='no'>✗ where does she live</span>"]
  ]},
  faq: [
    { q: "為什麼間接問句不能倒裝？", a: "因為它已經不是問句，而是一個「名詞」（當受詞用）。名詞子句一律回到直述語序：I don't know where the station is.（✗ where is the station）" },
    { q: "whether 和 if 可以互換嗎？", a: "當「是否」時多半可換，但三個位置只能用 whether：句首當主詞、介系詞後面、以及接 or not 之前。" }
  ],
  recap: ["名詞子句＝把句子打包當名詞用","間接問句用直述語序：疑問詞 + S + V","that 當受詞引導詞時可省略","句首主詞、介系詞後 → 用 whether"]
},

"conjunctions": {
  hook: "中文「雖然……但是……」成對出現，英文的 although 和 but 卻是單打選手——同一句只能派一個上場。這條「不能雙打」規則，加上 because vs because of，就是連接詞考題的兩大殺手。",
  visual: { type:"table", title:"連接詞分類表", note:"對等連接詞口訣 FANBOYS：for, and, nor, but, or, yet, so。", head:["類型","成員","規則"], rows:[
    ["對等連接詞","and, but, or, so, yet…","連接兩個對等的句子或詞"],
    ["從屬・原因","because, since, as","<b>because</b> + 子句；<b>because of</b> + 名詞"],
    ["從屬・讓步","although, though","<span class='no'>不可再加 but</span>"],
    ["配對連接詞","not only…but also / both…and / either…or","前後結構要對稱"]
  ]},
  faq: [
    { q: "Although…, but… 為什麼不行？", a: "although 和 but 都是連接詞，一句話兩個連接詞會「超載」。保留一個就好：Although he is rich, he is unhappy. 或 He is rich, but he is unhappy." },
    { q: "because 和 because of 怎麼秒選？", a: "看後面：有主詞＋動詞（子句）→ because；只有名詞 → because of。The game was canceled because it rained / because of the rain." }
  ],
  recap: ["although 與 but 只能擇一","because + 子句；because of + 名詞","FANBOYS 連接對等結構","so…that（如此…以致於）：so + adj + that"]
},

"adverb-clause": {
  hook: "副詞子句是句子的「時空設定選單」：什麼時候（when）、什麼條件（if/unless）、雖然如何（although）、為了什麼（so that）。設定放句首要加逗號，放句尾就不用——這是寫作扣分的隱形地雷。",
  keywords: ["when / while / until / before / after","if / unless ✧ 條件","although ✧ 讓步","so that ✧ 目的","時間條件子句 → 現在式代未來"],
  visual: { type:"table", title:"副詞子句功能表", head:["功能","連接詞","注意"], rows:[
    ["時間","when, while, until, before, after, as soon as","用<b>現在式代替未來式</b>"],
    ["條件","if, unless, as long as","unless = if … not"],
    ["讓步","although, though, even though","不與 but 並用"],
    ["目的","so that + S + can/could","「為了能夠…」"],
    ["結果","so + adj + that / such + N + that","如此…以致於"]
  ]},
  faq: [
    { q: "I'll call you when I will arrive. 錯在哪？", a: "時間副詞子句（when/until/before/as soon as）要用現在式代替未來式：I'll call you when I arrive. 這是學測、多益共同的高頻考點。" },
    { q: "so that 和 so…that 一樣嗎？", a: "不一樣！so that＝目的（為了）：He saved money so that he could travel.；so…that＝結果（太…以致於）：It was so hot that we stayed in." }
  ],
  recap: ["時間／條件子句：現在式代未來式","unless ＝ if not","so that + can/could ＝ 表目的","副詞子句放句首要加逗號"]
},

"compound-relative": {
  hook: "what 是「自帶先行詞」的關係代名詞：What you need ＝ The thing that you need。既然先行詞已經內建，前面就永遠不需要名詞——這正是它跟 that / which 最大的不同。",
  visual: { type:"table", title:"複合關代對照表", head:["字","等於","例句"], rows:[
    ["what","the thing(s) that","<b>What</b> he said is true.（他說的話）"],
    ["whatever","anything that / no matter what","<b>Whatever</b> you decide, I'll support you."],
    ["whoever","anyone who / no matter who","<b>Whoever</b> breaks the rule will be punished."],
    ["whichever","任一個（有限範圍）","Choose <b>whichever</b> you like."]
  ]},
  faq: [
    { q: "句首的 What 和 That 怎麼分？", a: "看子句缺不缺角：That he passed surprised us.（he passed 完整→That）；What he said is true.（said 缺受詞→What）。「完整 That、缺角 What」。" },
    { q: "whoever 可以用 anyone who 代替嗎？", a: "可以，意思完全相同：Whoever comes is welcome. ＝ Anyone who comes is welcome. 考試常互相改寫。" }
  ],
  recap: ["what ＝ the thing that（自帶先行詞）","前面有名詞就不能用 what","whatever/whoever ＝ no matter what/who","句首判斷：子句完整用 That，缺角用 What"]
}

};
