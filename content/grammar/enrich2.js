/* =========================================================
   GRAMMAR PRO — 課程增強內容 Part 2（詞類・比較・句型・動詞・商用）
   ========================================================= */
Object.assign(window.ENRICH, {

/* ============ 詞類與用法 ============ */
"gerund-infinitive": {
  hook: "enjoy to swim 為什麼是錯的？因為英文動詞很挑食：有的只吃 to V，有的只吃 V-ing。挑食其實有邏輯——指向「未來、還沒做」的動詞配 to V；描述「經驗、已在進行」的動詞配 V-ing。",
  keywords: ["want / plan / decide / hope → to V","enjoy / finish / avoid / mind → V-ing","介系詞後 → 一律 V-ing","stop / remember / forget ✧ 接哪個意思不同"],
  visual: { type:"table", title:"動詞菜單一覽表", note:"記憶邏輯：to V 有「向前指」的箭頭感（還沒做）；V-ing 有「進行中」的畫面感（已發生）。", head:["後面接","高頻動詞","記憶邏輯"], rows:[
    ["to V","want, hope, plan, decide, agree, promise, refuse, offer, expect","<b>未來導向</b>：決定／希望去做（還沒做）"],
    ["V-ing","enjoy, finish, avoid, mind, keep, practice, suggest, admit, consider","<b>經驗導向</b>：正在做或做過的事"],
    ["兩者皆可・意思不變","like, love, start, begin, continue","like to swim ≈ like swimming"],
    ["兩者皆可・<span class='no'>意思改變</span>","stop, remember, forget, try","stop <b>to smoke</b> 停下來去抽 / stop <b>smoking</b> 戒菸"]
  ]},
  faq: [
    { q: "remember to do 和 remember doing 差在哪？", a: "to do＝記得「去做」（還沒做）：Remember to lock the door.；doing＝記得「做過」（已發生）：I remember locking the door. 口訣：to 向前看、-ing 向後看。" },
    { q: "為什麼 look forward to 後面接 V-ing？", a: "因為這個 to 是「介系詞」不是不定詞！介系詞後面的動詞一律 V-ing：look forward to seeing you、be used to getting up early。" }
  ],
  recap: ["未來導向動詞（want, plan, decide）→ to V","經驗導向動詞（enjoy, finish, avoid）→ V-ing","介系詞後一律 V-ing（含 look forward to）","stop/remember/forget：to V＝還沒做、V-ing＝已發生"]
},

"infinitive-usage": {
  hook: "too…to 是個「隱形否定」陷阱：句子裡一個 not 都沒有，中文卻要翻成「不能」。The coffee is too hot to drink.＝咖啡燙到「沒法喝」。看懂這個隱形負號，這類考題就是送分題。",
  visual: { type:"table", title:"不定詞句型四天王", head:["句型","意思","例句"], rows:[
    ["too + adj + to V","太…而<b>不能</b>…（隱含否定）","He is <b>too</b> young <b>to drive</b>."],
    ["adj + enough + to V","夠…可以…","She is old <b>enough to vote</b>.（enough 放形容詞<b>後面</b>）"],
    ["in order to / so as to","為了…（表目的）","We left early <b>in order to</b> catch the train."],
    ["疑問詞 + to V","該…（當名詞用）","I don't know <b>what to say</b> / <b>how to start</b>."]
  ]},
  faq: [
    { q: "too…to 已經有否定意味，還能再加 not 嗎？", a: "不行，會變成雙重否定：He is too tired to work.（✗ to not work）。改寫成 so…that 時才把 not 補回來：so tired that he can't work。" },
    { q: "enough 到底放哪裡？", a: "修飾「形容詞」放後面：tall enough；修飾「名詞」放前面：enough money。位置放反是經典陷阱。" }
  ],
  recap: ["too…to ＝ 太…而不能（不再加 not）","adj + enough + to V（enough 在形容詞後）","too…to ↔ so…that…not 互相改寫","疑問詞 + to V 可當名詞用"]
},

"articles": {
  hook: "a university 但 an umbrella——同樣是 u 開頭，冠詞卻不同。因為冠詞看的是「耳朵」不是「眼睛」：university 唸 /juː/（子音）、umbrella 唸 /ʌ/（母音）。記住：發音決定一切。",
  keywords: ["第一次提到 → a / an","再次提到・雙方都知道 → the","看發音不看拼字","獨一無二（the sun）→ the"],
  visual: { type:"table", title:"冠詞決策表", head:["情況","用","例子"], rows:[
    ["不特定・第一次提到（單數可數）","a / an（看發音）","I saw <b>a</b> dog. / <b>an</b> hour（h 不發音）"],
    ["特定・再次提到・雙方都知道","the","<b>The</b> dog was cute. / Pass me <b>the</b> salt."],
    ["獨一無二・樂器・序數・最高級","the","<b>the</b> sun, play <b>the</b> piano, <b>the</b> first, <b>the</b> best"],
    ["泛指複數・不可數・三餐・球類","不加冠詞","Dogs are loyal. / have lunch / play basketball"]
  ]},
  faq: [
    { q: "為什麼樂器要加 the、球類不用？", a: "慣用法：play the piano / the violin，但 play basketball / tennis。這組對比是選擇題常客，直接背。" },
    { q: "an hour、a university 怎麼判斷？", a: "唸出來！hour 的 h 不發音，開頭是母音 /aʊ/ → an；university 開頭發 /juː/ 子音 → a。同理：an MBA（M 唸 /em/）、a European trip。" }
  ],
  recap: ["a/an 看發音：母音 an、子音 a","先 a/an（初次）後 the（再提）","獨一無二、樂器、最高級前 → the","泛指複數、不可數、三餐球類 → 不加"]
},

"prepositions": {
  hook: "in → on → at 是一顆鏡頭從遠拉近的過程：年份（in 2025）→ 日期（on May 5th）→ 時刻（at 3 p.m.）；國家（in Japan）→ 街道（on the street）→ 門牌（at No. 5）。範圍越小，介系詞越「尖」。",
  keywords: ["in ✧ 大範圍（月/年/季/城市）","on ✧ 特定日／表面","at ✧ 精確時刻／地點","at night / in the morning ✧ 慣用"],
  visual: { type:"table", title:"in / on / at 大三格", note:"衝突時「小的贏」：morning 用 in，但指定星期幾的早上升級成 on → on Friday morning。", head:["","in（大範圍）","on（特定日/面）","at（精確點）"], rows:[
    ["<b>時間</b>","月份・年份・季節<br>in July / in 2025","星期・日期・節日<br>on Monday / on May 5th","時刻・時間點<br>at 3 p.m. / at noon"],
    ["<b>地點</b>","範圍內<br>in Taipei / in the box","表面上<br>on the wall / on the desk","某一點<br>at the door / at the bus stop"],
    ["<b>慣用</b>","in the morning /<br>afternoon / evening","on Friday morning<br>（指定星期幾就升級）","at night / at noon /<br>at midnight"]
  ]},
  faq: [
    { q: "為什麼是 in the morning 卻是 at night？", a: "純慣用法，沒有道理可講：in the morning/afternoon/evening，但 at night/at noon/at midnight。這組是介系詞題的頭號考點，直接背熟。" },
    { q: "on the weekend 還是 at the weekend？", a: "都對！美式用 on、英式用 at。台灣的考試以美式 on the weekend 為主。" }
  ],
  recap: ["時間：in（月年季）→ on（日）→ at（時刻）","地點：in（範圍）→ on（表面）→ at（點）","at night / in the morning 直接背","指定星期幾的早上 → on Friday morning"]
},

"pronouns": {
  hook: "It takes two hours to get there. 這個 It 什麼都不是——它只是「佔位子」的假主詞，真正的主詞（to get there）太長，先請 It 坐在前面撐場面。英文最愛這種「先佔位、後補述」的排版。",
  visual: { type:"table", title:"三大代名詞句型", head:["句型","用途","例句"], rows:[
    ["It is + adj + to V","虛主詞（真主詞在後）","<b>It</b> is important <b>to exercise</b>."],
    ["It takes + 人 + 時間 + to V","花時間","<b>It took</b> me an hour <b>to finish</b>."],
    ["There + be + N","存在「有」","<b>There are</b> three books.（be 看後面名詞）"],
    ["-self / -selves","反身（主受同人）","She hurt <b>herself</b>. / enjoy <b>oneself</b>"]
  ]},
  faq: [
    { q: "There is a pen and two books. 為什麼用 is？", a: "there be 的 be 動詞只看「最靠近的第一個名詞」：a pen（單數）→ is。反過來 There are two books and a pen. 用 are。這是就近原則。" },
    { q: "by oneself 和 for oneself 差在哪？", a: "by oneself＝獨自（alone）：He lives by himself.；for oneself＝為自己：Think for yourself. 另外 enjoy oneself＝玩得開心，是固定用法。" }
  ],
  recap: ["It ＝ 虛主詞，代替後面的 to V / that 子句","It takes + 人 + 時間 + to V","there be 看「最近的名詞」決定單複數","主詞受詞同一人 → 反身代名詞 -self"]
},

"quantifiers": {
  hook: "a little money 是「還有一點錢」，little money 是「幾乎沒錢」——差一個 a，語氣從樂觀變絕望。數量詞考的從來不只是可數不可數，還有這種「半杯水心理學」。",
  visual: { type:"table", title:"數量詞矩陣", note:"口訣：有 a 是樂觀（有一些），沒 a 是悲觀（幾乎沒有）。", head:["語意","可數名詞","不可數名詞"], rows:[
    ["很多","<b>many</b> books / a lot of","<b>much</b> time / a lot of"],
    ["一些（肯定・邀請）","<b>some</b> apples","<b>some</b> water"],
    ["任何（否定・疑問）","<b>any</b> questions","<b>any</b> money"],
    ["有一點（樂觀）","<b>a few</b> friends","<b>a little</b> hope"],
    ["幾乎沒有（悲觀）","<b>few</b> friends","<b>little</b> hope"]
  ]},
  faq: [
    { q: "some 不是只能用在肯定句嗎？", a: "疑問句表「邀請或請求」時也用 some：Would you like some tea?（期待對方說好）。真正的開放疑問才用 any：Do you have any questions?" },
    { q: "money 到底可不可數？", a: "money 不可數（much money）；但 dollar、coin 可數（many dollars）。同類陷阱：furniture、information、advice、luggage 全都不可數。" }
  ],
  recap: ["many/few + 可數；much/little + 不可數","a few / a little ＝ 有一些（正面）","few / little ＝ 幾乎沒有（負面）","some 肯定與邀請；any 否定與疑問"]
},

"modals": {
  hook: "助動詞是句子的「語氣音量鈕」：must（99% 確定）→ may / might（50% 也許）→ can't（0% 不可能）。同一件事，選不同的助動詞，就是在告訴對方你有多少把握。",
  keywords: ["must ✧ 一定（義務／強推測）","may / might ✧ 也許","can't ✧ 不可能","mustn't 禁止 ≠ don't have to 不必","must have p.p. ✧ 對過去推測"],
  visual: { type:"table", title:"助動詞強度表", head:["助動詞","語意","確定度／注意"], rows:[
    ["must","一定是・必須","推測 99%／義務「必須」"],
    ["should","應該","建議；should have p.p.＝早該卻沒"],
    ["may / might / could","也許","推測 50% 上下"],
    ["can't","不可能","否定推測 0%（不是「不會」）"],
    ["<span class='no'>mustn't</span> vs <span class='ok'>don't have to</span>","禁止 vs 不必","意思完全相反，頭號陷阱！"]
  ]},
  faq: [
    { q: "mustn't 和 don't have to 為什麼差這麼多？", a: "mustn't＝禁止（不准做）：You mustn't smoke here.；don't have to＝不必（做不做隨你）：You don't have to come. 中文都有「不」，意思卻相反——多益最愛考。" },
    { q: "怎麼對「過去」做推測？", a: "助動詞 + have + p.p.：He must have missed the bus.（一定是錯過公車了）／She can't have said that.（不可能說過那種話）。" }
  ],
  recap: ["推測強度：must > may/might > can't","mustn't＝禁止；don't have to＝不必","對過去推測：must/may/can't + have p.p.","should have p.p.＝早該做卻沒做"]
},

/* ============ 比較與修飾 ============ */
"comparison": {
  hook: "比較級的鐵律：兩者比用 -er，三者以上才輪到 the -est。而 more taller 這種「疊加強化」，正是閱卷老師最愛抓的錯——-er 和 more 只能選一個，永遠不能雙拼。",
  visual: { type:"table", title:"三級變化規則表", head:["規則","原級 → 比較級 → 最高級"], rows:[
    ["單音節：+er / +est","tall → tall<b>er</b> → the tall<b>est</b>"],
    ["短母音+子音：重複字尾","big → big<b>ger</b> → the big<b>gest</b>"],
    ["子音+y：y→i","happy → happ<b>ier</b> → the happ<b>iest</b>"],
    ["多音節：more / most","expensive → <b>more</b> expensive → the <b>most</b> expensive"],
    ["不規則","good→<b>better</b>→<b>best</b>／bad→<b>worse</b>→<b>worst</b>／little→<b>less</b>→<b>least</b>"]
  ]},
  faq: [
    { q: "比較級想說「大很多」怎麼加強？", a: "用 much / far / a lot / even：much better、far more expensive。絕對不能用 very（✗ very better）——這是選擇題高頻陷阱。" },
    { q: "as…as 中間放比較級可以嗎？", a: "不行！as…as 是「同級」比較，中間永遠放原級：as tall as（✗ as taller as）。否定 not as/so tall as＝不如…高。" }
  ],
  recap: ["兩者比 -er/more；三者以上 the -est/most","-er 與 more 絕不並用","加強比較級用 much/far/a lot（不用 very）","as + 原級 + as（同級比較）"]
},

"comparison-advanced": {
  hook: "「沒有什麼比健康更重要。」——英文用否定主詞＋比較級，繞一圈表達出最高級：Nothing is more precious than health. 這種「隱藏版最高級」是學測閱讀與翻譯的常客。",
  visual: { type:"table", title:"進階比較句型表", head:["句型","意思","例句"], rows:[
    ["倍數 + as … as","…的 N 倍","twice <b>as heavy as</b> / three times <b>as big as</b>"],
    ["The 比較級, the 比較級","越…越…","<b>The more</b> you practice, <b>the better</b> you get."],
    ["否定詞 + 比較級 + than","＝最高級","<b>Nothing</b> is <b>more precious than</b> health."],
    ["比較級 + and + 比較級","越來越…","It's getting <b>colder and colder</b>."],
    ["the + 比較級 + of the two","兩者中較…的","This is <b>the better of the two</b>."]
  ]},
  faq: [
    { q: "倍數要放在哪個位置？", a: "放在 as…as 或比較級「前面」：three times as big as ＝ three times bigger than。位置移到後面就錯了。" },
    { q: "The more…the more 後面要倒裝嗎？", a: "不用，維持正常語序：The more you read, the more you know. 但注意兩個 the 都不能省。" }
  ],
  recap: ["倍數放最前面：X times as … as","The 比較級, the 比較級（越…越…）","否定 + 比較級 ＝ 最高級意味","兩者中較…的 → the + 比較級 + of the two"]
},

"adj-adv": {
  hook: "The soup tastes well. 聽起來很怪——因為 taste 是連綴動詞，它後面接的不是「怎麼嚐」，而是「湯是什麼樣子」，所以要用形容詞 good。判斷訣竅：能把動詞換成 be 而句意不變的，就接形容詞。",
  visual: { type:"table", title:"形容詞 vs 副詞判斷表", head:["情況","用","例句"], rows:[
    ["修飾名詞","形容詞","a <b>careful</b> driver"],
    ["連綴動詞後<br>(be, look, sound, smell, taste, feel, seem, become)","形容詞","The soup tastes <b>good</b>. / She looks <b>happy</b>."],
    ["修飾一般動詞","副詞","She drives <b>carefully</b>."],
    ["修飾形容詞・副詞","副詞","<b>really</b> fast / <b>very</b> good"],
    ["易混字","—","hard 努力 / <b>hardly</b> 幾乎不；late 遲 / <b>lately</b> 最近；good 形 / <b>well</b> 副"]
  ]},
  faq: [
    { q: "怎麼快速認出連綴動詞？", a: "把動詞換成 be，句意不變就是連綴動詞：The soup tastes good → The soup is good ✓。清單：look、sound、smell、taste、feel、seem、become、stay。" },
    { q: "friendly 是副詞嗎？", a: "不是！它是 -ly 結尾的「形容詞」：friendly、lovely、lonely、costly、weekly。想修飾動詞得繞路：in a friendly way。" }
  ],
  recap: ["連綴動詞後接形容詞（換成 be 測試）","修飾動詞、形容詞 → 副詞","hardly＝幾乎不；lately＝最近","friendly/lovely 是形容詞不是副詞"]
},

"participle-adj": {
  hook: "I am boring. 說出口的瞬間，你告訴全世界「我是個無趣的人」——想說「我覺得無聊」得用 I am bored. 一個字尾之差，就是社交災難與正常表達的距離。-ing 給事物，-ed 給感受。",
  visual: { type:"table", title:"-ing vs -ed 感受對照表", note:"口訣：事物「發出」刺激（-ing），人心「接收」感受（-ed）。", head:["字對","令人…的（修飾事物）","感到…的（描述人）"], rows:[
    ["bore","a <b>boring</b> movie 無聊的電影","I'm <b>bored</b>. 我好無聊"],
    ["excite","<b>exciting</b> news 令人興奮的消息","We're <b>excited</b>. 我們很興奮"],
    ["interest","an <b>interesting</b> book","I'm <b>interested</b> in art."],
    ["surprise","a <b>surprising</b> result","We were <b>surprised</b> at it."],
    ["tire / confuse","a <b>tiring</b> day / <b>confusing</b> rules","<b>tired</b> 累的 / <b>confused</b> 困惑的"]
  ]},
  faq: [
    { q: "有沒有一句口訣可以記牢？", a: "「事物發出（-ing），人心接收（-ed）」：The game is exciting → We are excited. 刺激的來源用 -ing，感受的承受者用 -ed。" },
    { q: "-ing 可以拿來形容人嗎？", a: "可以，但意思是「這個人給別人的感覺」：He is a boring speaker.（他演講讓人想睡）≠ He is bored.（他自己覺得無聊）。" }
  ],
  recap: ["-ing ＝ 令人…的（刺激來源）","-ed ＝ 感到…的（人的感受）","搭配介系詞：interested in / surprised at / worried about","形容人用 -ing 時＝「他讓別人覺得…」"]
},

/* ============ 句型結構 ============ */
"sentence-patterns": {
  hook: "英文千萬句，骨架只有五種。學會拆 S、V、O、C，再長的句子都是這五種積木的組合——這是閱讀長難句的第一把鑰匙，也是寫作不再寫出破句的保險。",
  visual: { type:"table", title:"五大句型總表", head:["句型","結構","例句"], rows:[
    ["第 1 型","S + V（完全不及物）","Birds <b>fly</b>."],
    ["第 2 型","S + V + <b>C</b>（主詞補語）","She <b>is a nurse</b>. / The soup <b>tastes good</b>."],
    ["第 3 型","S + V + <b>O</b>（及物）","I <b>have a dog</b>."],
    ["第 4 型","S + V + <b>O + O</b>（雙受詞）","He gave <b>me a book</b>.（= a book <b>to</b> me）"],
    ["第 5 型","S + V + <b>O + C</b>（受詞補語）","We call <b>him Tom</b>. / They elected <b>her captain</b>."]
  ]},
  faq: [
    { q: "補語和受詞怎麼分？", a: "補語跟主詞或受詞「畫等號」：She is a nurse（she＝nurse，補語）；受詞是動作的「對象」：She helped me（me 是被幫的人，受詞）。畫得了等號就是補語。" },
    { q: "give me a book 可以改寫嗎？", a: "可以：give a book to me。大部分授與動詞用 to（give/send/show），少數用 for（buy/make/cook）：buy a gift for me。" }
  ],
  recap: ["五骨架：SV・SVC・SVO・SVOO・SVOC","補語與主詞/受詞畫等號","SVOO 改寫：to（give/send）、for（buy/make）","連綴動詞走 SVC，使役感官常走 SVOC"]
},

"inversion": {
  hook: "Never have I seen such a mess! 聽起來像莎士比亞在講話？其實是學測作文的加分神器：否定副詞一放句首，主詞和助動詞立刻互換位置。會用倒裝，作文檔次直接上一層。",
  keywords: ["Never / Seldom / Hardly 句首 → 倒裝","Not only … but also","Only + 副詞 句首 → 倒裝","So / Neither + aux + S ✧ 我也是/也不"],
  visual: { type:"table", title:"倒裝觸發器一覽", head:["觸發詞（放句首）","倒裝形式","例句"], rows:[
    ["Never / Seldom / Hardly","aux + S + V","<b>Never have I seen</b> such a mess."],
    ["Not only","aux + S … but also","<b>Not only is he</b> smart, but he is also kind."],
    ["Only + 時間/條件","aux + S + V","<b>Only then did he realize</b> the truth."],
    ["So（我也是）","So + aux + S","\"I'm tired.\" \"<b>So am I</b>.\""],
    ["Neither / Nor（我也不）","Neither + aux + S","\"I can't swim.\" \"<b>Neither can I</b>.\""],
    ["Here / There","V + S（名詞主詞）","<b>Here comes the bus</b>!（代名詞不倒裝：Here it comes）"]
  ]},
  faq: [
    { q: "倒裝到底「倒」什麼？", a: "只把「助動詞」搬到主詞前面。句子若沒有助動詞，要先請出 do/does/did：Seldom does he cook.（✗ Seldom cooks he）" },
    { q: "So am I 和 So I am 一樣嗎？", a: "完全不同！So am I＝「我也是」（倒裝）；So I am＝「我的確是」（附和）。語序決定意思，聽力和閱讀都考。" }
  ],
  recap: ["否定副詞句首 → 助動詞提前","無助動詞先請出 do/does/did","So + aux + S＝也是；Neither + aux + S＝也不","Here comes the bus（名詞倒裝；代名詞不倒）"]
},

"cleft": {
  hook: "同一句話，想強調誰，就把誰塞進 It was ___ that … 的空格——像舞台聚光燈，打在哪裡，觀眾就看哪裡。It was Tom who broke the window.（就是 Tom！不是別人。）",
  visual: { type:"flow", title:"強調句三步驟", note:"驗證法：把 It is/was 和 that 拿掉，剩下的部分必須還是一個完整句子。", steps:[
    { t:"找出要強調的部分", d:"Tom broke the window yesterday. → 強調 Tom" },
    { t:"套入 It is/was ___", d:"It was Tom ..." },
    { t:"其餘接在 that/who 後", d:"It was Tom who broke the window yesterday." }
  ]},
  faq: [
    { q: "怎麼檢查強調句寫對了沒？", a: "刪掉 It is/was 和 that，剩下的要能還原成完整句：It was yesterday that I met her. → I met her yesterday ✓。" },
    { q: "動詞可以放進 It is…that 強調嗎？", a: "不行，強調句只能強調主詞、受詞、時間、地點。想強調動詞用助動詞 do：I did call you!（我真的打了！）" }
  ],
  recap: ["It is/was + 強調部分 + that + 其餘","強調人可用 who 代替 that","可強調主詞/受詞/時間/地點，不可強調動詞","驗證：拿掉框架後仍是完整句"]
},

"tag-question": {
  hook: "中文句尾隨口一句「對吧？」，英文卻有一套精密公式：前肯後否、前否後肯，助動詞與主詞原樣照抄。更麻煩的是回答——「你不喜歡，對吧？」英文的 Yes/No 跟中文的「對/不對」剛好相反。",
  visual: { type:"table", title:"附加問句速查表", head:["主句","附加問句","規則"], rows:[
    ["You <b>are</b> a student,","aren't you?","be 動詞照抄"],
    ["He <b>works</b> here,","doesn't he?","一般動詞請出 do/does/did"],
    ["They <b>didn't</b> come,","did they?","前否 → 後肯"],
    ["<b>Let's</b> go,","shall we?","Let's 固定配 shall we"],
    ["<b>Open</b> the window,","will you?","祈使句配 will you"],
    ["<b>I am</b> late,","aren't I?","I am 慣用 aren't I"]
  ]},
  faq: [
    { q: "附加問句怎麼回答才不會錯？", a: "照「事實」回答，別管問句是肯定還否定：You don't like it, do you? 不喜歡就答 No, I don't.（中文習慣說「對，我不喜歡」，英文卻是 No——這是聽力大殺器。）" },
    { q: "There is a problem 的附加問句是？", a: "isn't there?（不是 isn't it）——there be 句型的「主詞」就是 there，要照抄。" }
  ],
  recap: ["前肯後否、前否後肯","助動詞與主詞照抄（一般動詞用 do/does/did）","Let's → shall we；祈使句 → will you","回答照事實：No, I don't.（≠中文的「對」）"]
},

"sv-agreement": {
  hook: "The list of items is on the desk.——動詞跟的是 list，不是 items。of 後面的名詞是出題老師放的「干擾彈」，真正的主詞永遠在 of 前面。抓對主詞，這類題目十秒解決。",
  keywords: ["each / every / everyone → 單數","A of B → 動詞看 A","時間・金錢 → 單數","either…or → 就近原則"],
  visual: { type:"table", title:"主謂一致陷阱表", head:["陷阱","規則","例句"], rows:[
    ["A <b>of</b> B","看 A 不看 B","The list of items <b>is</b> …"],
    ["each / every / -one / -body","一律單數","Everyone <b>is</b> happy. / Each <b>has</b> …"],
    ["the number of vs a number of","the→單數；a→複數","The number of cars <b>is</b> rising. / A number of cars <b>are</b> parked."],
    ["時間・金錢・距離","視為整體 → 單數","Ten years <b>is</b> a long time."],
    ["either…or / neither…nor","就近原則","Either you or he <b>is</b> wrong."],
    ["news / mathematics","形複實單","The news <b>is</b> good."]
  ]},
  faq: [
    { q: "the number of 和 a number of 差在哪？", a: "the number of + 複數名詞＝「…的數量」，主詞是數量本身 → 單數動詞；a number of + 複數名詞＝many → 複數動詞。一字之差，動詞相反。" },
    { q: "為什麼 Ten years is…？", a: "時間、金錢、距離當作「一個整體」看待：Ten years is a long time. / Five hundred dollars is enough. 不要被複數字尾騙了。" }
  ],
  recap: ["of 片語是干擾彈，主詞在 of 前","each/every/everyone 一律單數","the number of → 單數；a number of → 複數","either…or 就近；時間金錢視為單數"]
},

"participial-construction": {
  hook: "把 While I was walking down the street 瘦身成 Walking down the street——分詞構句是句子的減法藝術：砍掉連接詞、砍掉重複的主詞，動詞換上分詞。但有個鐵律：分詞的主詞必須＝主句的主詞，否則就是懸在半空的「懸垂分詞」。",
  visual: { type:"flow", title:"副詞子句瘦身三步", note:"主動用 V-ing、被動用 (being) p.p.、否定加 Not、先發生用 Having p.p.。", steps:[
    { t:"確認前後主詞相同", d:"While I was walking, I met a friend. ✓ 同是 I" },
    { t:"刪連接詞與主詞", d:"(While I was) walking …" },
    { t:"動詞改分詞", d:"Walking down the street, I met a friend." }
  ]},
  faq: [
    { q: "最常見的錯誤長什麼樣？", a: "懸垂分詞：Walking down the street, a dog barked at me.（✗ 狗不會逛街！）分詞的邏輯主詞必須是主句主詞：Walking down the street, I saw a dog." },
    { q: "Having finished 和 Finishing 差在哪？", a: "Having + p.p. 強調「先做完才…」的先後順序：Having finished work, he went home.；同時發生用 V-ing 就好：Feeling tired, he took a nap." }
  ],
  recap: ["前提：分詞主詞＝主句主詞","主動 V-ing；被動 (being) p.p.","否定：Not + V-ing","先發生：Having + p.p."]
},

/* ============ 動詞句型 ============ */
"causative": {
  hook: "同樣是「叫人做事」，make 是強迫（老媽叫你打掃）、have 是交辦（老師叫你背詩）、let 是允許（讓我去嘛）、get 是說服（拜託朋友修車）——四個使役動詞，四種人際關係，兩套接法。",
  visual: { type:"table", title:"使役動詞接法表", note:"分水嶺在受詞與動作的關係：受詞「主動做」接原形／to V；受詞「被動作」一律接 p.p.。", head:["動詞","受詞主動做","受詞被動作"], rows:[
    ["make（強迫）","make + O + <b>原形</b>","be made <b>to V</b>（被動補 to）"],
    ["have（交辦）","have + O + <b>原形</b>","have + O + <b>p.p.</b>（have my hair cut）"],
    ["let（允許）","let + O + <b>原形</b>","—"],
    ["get（說服）","get + O + <b>to V</b>（例外！）","get + O + <b>p.p.</b>（get it fixed）"]
  ]},
  faq: [
    { q: "為什麼 have my hair cut 用 cut 不用 to cut？", a: "看受詞跟動作的關係：頭髮是「被剪」的（被動）→ 用 p.p.。O 主動做 → 原形；O 被動作 → p.p.。這一條判斷準則吃遍所有使役題。" },
    { q: "help 算使役動詞嗎？", a: "算半個：help + O + (to) V，to 可加可省：She helped me (to) carry the boxes. 考試兩種都算對。" }
  ],
  recap: ["make / have / let + O + 原形","get + O + to V（唯一例外）","受詞被動作 → have/get + O + p.p.","make 被動 → be made to V"]
},

"perception": {
  hook: "I saw him cross the street.（我看著他過完馬路）vs I saw him crossing the street.（我瞄到他正在過）——感官動詞給你選鏡頭：原形是「完整長鏡頭」，V-ing 是「進行中的快照」。",
  visual: { type:"table", title:"感官動詞鏡頭表", head:["接法","鏡頭","例句"], rows:[
    ["感官 V + O + <b>原形</b>","看/聽到「全程」","I saw him <b>cross</b> the street.（過完了）"],
    ["感官 V + O + <b>V-ing</b>","看/聽到「進行中片段」","I saw him <b>crossing</b> the street.（正在過）"],
    ["感官 V + O + <b>p.p.</b>","受詞「被…」","I heard my name <b>called</b>.（名字被叫）"],
    ["被動語態","<span class='no'>補回 to</span>","He was seen <b>to enter</b> the building."]
  ]},
  faq: [
    { q: "常見的感官動詞有哪些？", a: "see、watch、notice、observe（看）；hear、listen to（聽）；feel（感覺）。它們都走「感官 + O + 原形/V-ing」這套接法。" },
    { q: "hear 和 listen to 差在哪？", a: "listen to＝主動去聽（過程）：I'm listening to music.；hear＝聽見（結果）：I heard a noise. 一個是行為、一個是結果。" }
  ],
  recap: ["原形＝完整全程；V-ing＝進行片段","受詞被動作 → p.p.（heard my name called）","感官動詞被動語態要補 to","高頻：see, watch, notice, hear, feel"]
},

"phrasal-verbs": {
  hook: "turn on the light ✓、turn the light on ✓、turn on it ✗、turn it on ✓——可分離片語遇到「代名詞」，只有一個合法位置：夾在中間。這條規則是多益 Part 5 的固定班底。",
  visual: { type:"table", title:"動詞片語分類表", head:["類型","規則","例子"], rows:[
    ["可分離","名詞兩可；<b>代名詞必夾中間</b>","turn <b>it</b> off / put <b>it</b> off / pick <b>her</b> up"],
    ["不可分離","受詞一律在後","look after <b>her</b> / run into <b>him</b> / look for <b>it</b>"],
    ["三字片語","整組不拆","look forward <b>to</b> / come up <b>with</b> / put up <b>with</b>"],
    ["多益高頻","—","put off 延期・carry out 執行・take over 接管・set up 設立・turn down 拒絕"]
  ]},
  faq: [
    { q: "怎麼判斷片語可不可分離？", a: "大原則：動詞+副詞（turn on/put off）多可分離；動詞+介系詞（look after/run into）不可分離。拿不準時記住：代名詞測試——能說 turn it on 的就是可分離。" },
    { q: "多益最常考哪些片語？", a: "call off（取消）、put off（延期）、carry out（執行）、come up with（想出）、take over（接管）、fill out（填寫）、hand in（繳交）。這幾個出現率極高，優先背。" }
  ],
  recap: ["可分離片語：代名詞必放中間（turn it on）","介系詞開頭的片語不可分離（look after her）","三字片語整組不拆（look forward to）","高頻：put off, carry out, come up with, take over"]
},

"verb-patterns": {
  hook: "「花時間」有三個動詞，主詞決定用哪個：人花 → spend、事花 → take、物花（錢）→ cost。搞混主詞，句子就散架——這是翻譯與選擇題的常年考點。",
  visual: { type:"table", title:"花費三兄弟＋高頻句型", head:["句型","主詞","例句"], rows:[
    ["spend + 時間/錢 + V-ing / on N","人","I <b>spent</b> two hours <b>doing</b> homework."],
    ["It takes + 人 + 時間 + to V","虛主詞 It","<b>It took</b> me an hour <b>to finish</b>."],
    ["cost + 人 + 錢","物","The ticket <b>cost</b> me $500."],
    ["so + adj + that / such + N + that","—","<b>so</b> hot <b>that</b>… / <b>such a</b> hot day <b>that</b>…"],
    ["prevent / stop + O + from V-ing","—","The rain <b>prevented</b> us <b>from going</b> out."]
  ]},
  faq: [
    { q: "spend 後面接 to V 還是 V-ing？", a: "V-ing！I spent two hours doing it.（✗ to do）。花在東西上用 on：spend $100 on books。" },
    { q: "so…that 和 such…that 怎麼分？", a: "看後面接什麼：so + 形容詞（so hot that…）；such + (a) + 形容詞 + 名詞（such a hot day that…）。有名詞就用 such。" }
  ],
  recap: ["人 spend／It takes／物 cost","spend + V-ing（不接 to V）","so + adj + that；such + N + that","prevent/stop + O + from + V-ing"]
},

/* ============ 多益商用 ============ */
"modals-biz": {
  hook: "對主管說 Can you…? 不算失禮，但說 Could you possibly…? 會讓你聽起來專業三倍。商用英文的高下，不在字彙多深，而在助動詞選得多準——它是職場語氣的調音旋鈕。",
  visual: { type:"table", title:"禮貌度階梯（由低到高）", head:["等級","說法","場合"], rows:[
    ["直接","Can you send it?","熟同事・急件"],
    ["客氣","<b>Could / Would</b> you send it?","一般商務往來"],
    ["更客氣","Would you <b>mind sending</b> it?（+V-ing）","對客戶・對上級"],
    ["最正式","I <b>would appreciate</b> it if you could…","正式信件・催件"],
    ["建議","You <b>might want to</b> check…","委婉提醒（比 should 軟）"]
  ]},
  faq: [
    { q: "would like 和 want 有什麼不同？", a: "意思相同、溫度不同：want 直接（小孩要糖果）；would like 客氣（商務標配）：I'd like a refund, please. 職場信件一律用 would like。" },
    { q: "should have + p.p. 在商用信怎麼用？", a: "委婉指出「早該發生卻沒發生」：The package should have arrived by now.（包裹現在早該到了）——不指責人，只陳述狀況，是客訴信的高級寫法。" }
  ],
  recap: ["Could / Would 比 Can / Will 客氣","Would you mind + V-ing（更客氣）","I would appreciate it if…（最正式）","should have p.p. ＝ 早該…卻沒（委婉）"]
},

"toeic-traps": {
  hook: "多益 Part 5 有一半題目根本不用讀完整句——看「空格前後兩個字」判斷詞性，十秒作答。這一課教你那套位置判讀法：冠詞後面必是名詞、be 後面常是形容詞、完整句後面放副詞。",
  keywords: ["冠詞／所有格後 → 名詞","be 動詞後 → 形容詞","完整句後 → 副詞","A of B → 動詞看 A","平行結構 → 詞性一致"],
  visual: { type:"table", title:"位置判讀速查表", head:["空格位置","填什麼","例子"], rows:[
    ["the / a / your + ___","名詞","your <b>decision</b>"],
    ["___ + 名詞","形容詞","a <b>successful</b> meeting"],
    ["be 動詞 + ___","形容詞","The plan is <b>effective</b>."],
    ["完整句 + ___ / 動詞前後","副詞","reviewed the plan <b>carefully</b>"],
    ["助動詞 + ___","原形動詞","will <b>attend</b> the meeting"],
    ["A, B, and ___","與 A、B 同詞性","honesty, teamwork, and <b>creativity</b>"]
  ]},
  faq: [
    { q: "詞性題最快的解題流程是？", a: "先掃選項：如果是同字根的四種變化（decide/decision/decisive/decisively）→ 純詞性題，直接看空格前後兩個字定位，不用讀整句。" },
    { q: "主詞動詞一致題的陷阱在哪？", a: "「of + 名詞」插在主詞和動詞中間：The quality of these products is excellent.——動詞跟 quality，不跟 products。先把 of 片語括號起來再找動詞。" }
  ],
  recap: ["同字根選項 → 純詞性題，看前後兩字","冠詞後名詞、be 後形容詞、完整句後副詞","of 片語先括起來再判斷主謂一致","and 前後詞性必須對稱（平行結構）"]
},

"transitions": {
  hook: "however 不是 but——它是「副詞」，沒有黏合兩句話的能力，中間必須隔著分號或句號：…; however, …。用逗號直接連，就是俗稱的「逗號拼接」，這是多益文法題與寫作扣分的頭號陷阱。",
  keywords: ["however ✧ 轉折","therefore ✧ 因果","moreover / in addition ✧ 遞進","otherwise ✧ 否則","前面要分號或句號"],
  visual: { type:"table", title:"連接副詞功能分類", note:"標準格式：完整句 + 分號(;) + 連接副詞 + 逗號(,) + 完整句。", head:["功能","成員","例句"], rows:[
    ["轉折","however, nevertheless, on the other hand","It's popular; <b>however,</b> it's expensive."],
    ["因果","therefore, as a result, consequently","He was sick; <b>therefore,</b> he stayed home."],
    ["遞進","moreover, in addition, furthermore","It's cheap; <b>moreover,</b> it's fast."],
    ["條件","otherwise","Hurry; <b>otherwise,</b> you'll be late."],
    ["時間","meanwhile, afterwards","<b>Meanwhile,</b> sales kept rising."]
  ]},
  faq: [
    { q: "however 和 but 到底差在哪？", a: "詞性不同：but 是連接詞，可以用逗號直接連兩句；however 是副詞，必須靠分號或句號隔開：I was tired, but I kept working. ↔ I was tired; however, I kept working." },
    { q: "otherwise 怎麼用最自然？", a: "「否則」：Leave now; otherwise, you'll miss the train. 相當於 or 的正式版，多益信件題常見。" }
  ],
  recap: ["連接副詞前用分號或句號，後加逗號","however（轉折）≠ but（連接詞）","therefore 因果／moreover 遞進／otherwise 否則","逗號拼接（comma splice）是扣分大忌"]
},

"word-forms": {
  hook: "看不懂單字沒關係，看「字尾」就夠了：-tion 是名詞、-ive 是形容詞、-ly 是副詞、-ize 是動詞——這是多益考場上的 X 光眼，讓你在不認識單字的情況下照樣選對答案。",
  keywords: ["-tion / -ment / -ness / -ity → 名詞","-ive / -ful / -ous / -al → 形容詞","-ly → 副詞","-ize / -ify / -en → 動詞"],
  visual: { type:"table", title:"字尾 X 光表", head:["詞性","常見字尾","例子"], rows:[
    ["名詞","-tion, -ment, -ness, -ity, -ance, -er/-or","decision, development, kindness, ability"],
    ["動詞","-ize, -ify, -en, -ate","organize, simplify, widen, motivate"],
    ["形容詞","-ive, -ful, -ous, -al, -able, -ent","creative, useful, famous, reliable"],
    ["副詞","-ly（多數）","carefully, successfully, significantly"],
    ["<span class='no'>例外注意</span>","-ly 形容詞","friendly, lovely, costly, weekly（是形容詞！）"]
  ]},
  faq: [
    { q: "選項四個字尾都認得，還是選錯怎麼辦？", a: "回到位置判讀：冠詞/所有格後→名詞、名詞前→形容詞、be 後→形容詞、完整句尾→副詞。字尾認詞性＋位置定答案，兩步走完。" },
    { q: "名詞可以修飾名詞嗎？", a: "可以！複合名詞很常見：safety regulations（安全規範）、application form（申請表）。看到「名詞+名詞」選項別急著改成形容詞。" }
  ],
  recap: ["-tion/-ment/-ness → 名詞；-ive/-ful → 形容詞","-ly 多為副詞，但 friendly/costly 是形容詞","字尾判詞性 + 位置定答案","名詞可修飾名詞（safety regulations）"]
}

});
