/* =========================================================
   GRAMMAR PRO — 克漏字題組（多益 Part 6 / 學測綜合測驗）
   每篇短文 4 個空格；{1}~{4} 為空格位置
   kind: toeic（商用）/ ceec（學測）；lv: 1 基礎 / 2 進階 / 3 精熟
   ========================================================= */
window.CLOZE = [

/* ============ 多益 Part 6 風格 ============ */
{
  id:"cl-01", kind:"toeic", cat:"biz", lv:1, title:"訂單出貨通知",
  text:"Dear Ms. Carter,\n\nThank you for your order. Your package {1} yesterday and should arrive within three business days. Once it arrives, please check the items {2}. If anything is missing or damaged, contact our service team {3} 24 hours. {4}\n\nBest regards,\nSwift Shopping Team",
  blanks:[
    { opts:["was shipped","has been shipped","is shipped","will be shipped"], a:0, ex:"yesterday 是明確過去時間，包裹「被寄出」用過去式被動 was shipped。完成式與 yesterday 互斥。" },
    { opts:["careful","carefully","carefulness","more careful"], a:1, ex:"修飾動詞 check（檢查的方式）用副詞 carefully。" },
    { opts:["within","until","since","at"], a:0, ex:"within + 一段時間＝「在…之內」：within 24 hours 24 小時內。" },
    { opts:["We appreciate your business and hope to serve you again.","The weather has been lovely this week.","Our office dog is very friendly.","Please turn off the lights when leaving."], a:0, ex:"整句插入題：結尾應呼應主旨（感謝惠顧、期待再次服務）。其他選項與購物情境無關。" }
  ]
},
{
  id:"cl-02", kind:"toeic", cat:"biz", lv:2, title:"內部會議通知",
  text:"To: All Staff\n\nPlease note that the monthly sales meeting {1} to Friday, June 12, at 10 a.m. because the conference room is {2} renovated. Kindly review the attached report before {3} the meeting. Employees {4} have questions should email Mr. Lopez in advance.\n\nManagement Office",
  blanks:[
    { opts:["has been moved","has moved","moving","moves"], a:0, ex:"會議是「被移動」時間的，用現在完成式被動 has been moved。" },
    { opts:["being","been","be","to be"], a:0, ex:"現在進行式被動：is being + p.p.（正在被整修）。" },
    { opts:["attending","attend","to attend","attended"], a:0, ex:"這裡的 before 是介系詞，介系詞後面的動詞一律用動名詞 V-ing：before attending。誘答拆解：attend 原形與 attended 過去式都不能直接接在介系詞後；to attend 是不定詞——介系詞後面永遠不接 to V。" },
    { opts:["who","whose","which","whom"], a:0, ex:"先行詞 Employees 指人且在子句中當主詞（have questions），用 who。" }
  ]
},
{
  id:"cl-03", kind:"toeic", cat:"biz", lv:2, title:"賣場公告",
  text:"Attention Shoppers:\n\nStarting next month, Green Mart {1} open until 11 p.m. on weekends. We have also expanded our organic section, {2} now offers over 200 items. Customers {3} spend more than $50 will receive a free tote bag. Thank you for shopping {4} us!",
  blanks:[
    { opts:["will be","be","being","is being"], a:0, ex:"Starting next month 指未來；open 在此是形容詞（營業中），用 will be open。" },
    { opts:["which","who","where","what"], a:0, ex:"非限定關係子句（逗號後）補充說明 section（物），用 which。" },
    { opts:["who","which","whose","whom"], a:0, ex:"先行詞 Customers 指「人」，且在關係子句中當主詞（___ spend more than $50），用主格 who。誘答拆解：which 只能指物；whose 是所有格，後面要接名詞；whom 是受格，不能接動詞 spend 當主詞。" },
    { opts:["with","at","on","to"], a:0, ex:"慣用語 shop with us＝「與我們消費／光顧本店」。" }
  ]
},
{
  id:"cl-04", kind:"toeic", cat:"biz", lv:3, title:"面試邀請信",
  text:"Dear Mr. Reed,\n\nThank you for applying for the marketing position. We were impressed by your resume and {1} to invite you to an interview on May 3. Please bring two copies of your portfolio and arrive ten minutes early. Should you {2} to reschedule, contact our HR office at least 48 hours in advance. We look forward to {3} you. {4}\n\nSincerely,\nTalent Team",
  blanks:[
    { opts:["would like","are liking","would rather","had liked"], a:0, ex:"商用客氣語 would like to V＝想要…。like 為狀態動詞不用進行式。" },
    { opts:["need","needed","needing","to need"], a:0, ex:"Should you need…＝If you should need… 的倒裝假設句，should 後接原形。" },
    { opts:["meeting","meet","to meet","met"], a:0, ex:"look forward to 的 to 是介系詞，後接 V-ing。" },
    { opts:["Please confirm your attendance by Friday.","Our cafeteria serves lunch at noon.","The position has already been filled.","We regret to inform you of our decision."], a:0, ex:"整句插入題：邀請面試後合理的收尾是「請於週五前確認出席」。C、D 與邀約語意矛盾。" }
  ]
},
{
  id:"cl-05", kind:"toeic", cat:"biz", lv:3, title:"共享辦公室廣告",
  text:"Looking for a quiet place to work? Cowork Hub, {1} in the heart of the city, offers modern desks, fast Wi-Fi, and free coffee. Members {2} sign up before July 1 will get 20% off their first month. {3} our website to book a free tour. Hurry—seats {4} quickly!",
  blanks:[
    { opts:["located","locating","locates","to locate"], a:0, ex:"分詞片語修飾 Cowork Hub：辦公室「被設立」在市中心，用過去分詞 located（= which is located）。" },
    { opts:["who","which","whose","where"], a:0, ex:"先行詞 Members 指「人」，且在子句中當主詞（___ sign up before July 1），用主格 who。誘答拆解：which 指物；whose 後面要接名詞表「誰的」；where 是關係副詞，只能接完整句子——但這裡子句缺主詞，必須用關係代名詞。" },
    { opts:["Visit","Visiting","Visited","To visiting"], a:0, ex:"廣告指示語為祈使句：動詞原形開頭 Visit our website。" },
    { opts:["are filling up","are filled up by","fills up","filled"], a:0, ex:"座位正在快速被搶訂＝進行中的狀態，慣用主動進行式 are filling up。" }
  ]
},
{
  id:"cl-06", kind:"toeic", cat:"biz", lv:2, title:"客訴回覆信",
  text:"Dear Mr. Yang,\n\nWe are sorry to hear that your coffee maker stopped working. Since the product is still under warranty, we {1} replace it free of charge. Please complete the attached form and send the item back {2} its original box. A new unit {3} within five business days after we receive the defective one. We apologize again for the {4}.\n\nCustomer Care Team",
  blanks:[
    { opts:["will","would have","used to","had better"], a:0, ex:"依據保固條件向客戶承諾「接下來會做」的事，用未來式 will replace。誘答拆解：would have 是與過去相反的假設（後面要接 p.p.）；used to 是「過去習慣」；had better 是「最好…」的建議語氣——客服承諾必須用確定的 will。" },
    { opts:["in","on","at","for"], a:0, ex:"裝「在盒子裡面」＝容器內部，用 in：in its original box。誘答拆解：on 是接觸表面（放在盒子上面）；at 是某個定點；for 表目的或對象——只有 in 能表達「在…內部」的空間關係。" },
    { opts:["will be delivered","will deliver","delivers","is delivering"], a:0, ex:"新品是「被寄送」的，用未來被動 will be delivered。" },
    { opts:["inconvenience","inconvenient","inconveniently","convenient"], a:0, ex:"冠詞 the 後面要接名詞：apologize for the inconvenience 為商用信固定收尾。" }
  ]
},

/* ============ 學測綜合測驗風格 ============ */
{
  id:"cl-07", kind:"ceec", cat:"tense", lv:1, title:"校外教學記趣",
  text:"Last Friday, our class visited the science museum. We {1} many interesting exhibits about space and the human body. My favorite part was the robot show, {2} made everyone laugh. Before we left, our teacher told us {3} a short report about the trip. It was {4} a fun day that nobody wanted to go home.",
  blanks:[
    { opts:["saw","see","have seen","were seen"], a:0, ex:"Last Friday 明確過去時間，用過去簡單式 saw。" },
    { opts:["which","who","what","where"], a:0, ex:"非限定關係子句補充說明 the robot show（物），用 which。" },
    { opts:["to write","writing","write","wrote"], a:0, ex:"tell + 受詞 + to V＝「叫某人去做…」：told us to write。誘答拆解：writing／write／wrote 都不能接在「tell + 人」後面構成這個句型。同類動詞：ask、advise、encourage、allow + O + to V，整組一起記。" },
    { opts:["such","so","very","too"], a:0, ex:"such + a + 形容詞 + 名詞 + that：such a fun day that…。so 後面直接接形容詞。" }
  ]
},
{
  id:"cl-08", kind:"ceec", cat:"word", lv:1, title:"睡眠與學習",
  text:"Getting enough sleep is important for teenagers. Studies show that students who sleep less than six hours {1} to have trouble concentrating in class. {2}, using phones late at night makes it even harder to fall asleep. Doctors suggest {3} screens at least one hour before bedtime. If you follow this advice, you {4} more energetic in the morning.",
  blanks:[
    { opts:["tend","tends","tending","tended"], a:0, ex:"主詞是 students（複數；who 子句只是修飾），動詞用原形 tend。" },
    { opts:["Moreover","However","Otherwise","Instead"], a:0, ex:"前後都在說「睡不好的原因」，語意遞進用 Moreover（而且）。" },
    { opts:["turning off","to turn off","turn off","turned off"], a:0, ex:"suggest 屬於「只接動名詞」的動詞：suggest + V-ing（建議做…）。誘答拆解：suggest to V 是最經典的錯誤搭配；turn off 原形、turned off 過去式都不能當 suggest 的受詞。同類動詞：enjoy、finish、avoid、consider、recommend。" },
    { opts:["will feel","felt","have felt","would have felt"], a:0, ex:"第一類（真實）條件句：If + 現在式（follow），主句用 will + V：will feel。誘答拆解：felt 過去式時態錯位；have felt 完成式不符「未來的結果」；would have felt 是第三類（與過去相反）的假設——但養成好習慣是真實可能發生的事。" }
  ]
},
{
  id:"cl-09", kind:"ceec", cat:"tense", lv:2, title:"公園裡的善意",
  text:"Yesterday afternoon, while I {1} home from school, I saw an old woman drop her groceries near the park. I hurried over to help her pick everything up. She smiled and said such helpful students {2} rare when she was young. Her words made me {3} proud of myself. Small actions, I realized, can mean {4} more than we think.",
  blanks:[
    { opts:["was walking","am walking","have walked","will walk"], a:0, ex:"while + 過去進行式表背景動作：正走在回家路上時（看到事件發生）。" },
    { opts:["were","are","is","been"], a:0, ex:"when she was young 把時間錨定在過去，時態一致用 were。" },
    { opts:["feel","to feel","feeling","felt"], a:0, ex:"使役動詞 make + 受詞 + 原形動詞：made me feel proud。" },
    { opts:["much","very","so","too"], a:0, ex:"修飾比較級 more 用 much（much more）；very 不能修飾比較級。" }
  ]
},
{
  id:"cl-10", kind:"ceec", cat:"clause", lv:2, title:"台灣夜市文化",
  text:"Night markets are one of the most popular attractions in Taiwan. Visitors come not only for the delicious food {1} for the lively atmosphere. Walking through a night market, you can hear vendors {2} their goods and smell dozens of tasty snacks. {3} many stalls stay open past midnight, the streets are always full of energy. No trip to Taiwan is complete {4} a visit to a night market.",
  blanks:[
    { opts:["but also","and also","but too","also but"], a:0, ex:"配對連接詞 not only … but also「不但…而且」。" },
    { opts:["calling out","to call out","to calling","having called"], a:0, ex:"感官動詞 hear + 受詞 + V-ing：聽到攤販「正在」叫賣。" },
    { opts:["Because","Although","Unless","However"], a:0, ex:"攤位開到半夜「因此」街上充滿活力，因果關係用 Because。However 是副詞，不能這樣接子句。" },
    { opts:["without","with","for","about"], a:0, ex:"No trip is complete without…＝「少了…就不算完整」，雙重否定表必要。" }
  ]
},
{
  id:"cl-11", kind:"ceec", cat:"voice", lv:3, title:"人工智慧的兩面",
  text:"Artificial intelligence has changed the way we live and work. Tasks that {1} hours to finish can now be completed in seconds. {2}, this convenience comes with new challenges. Experts warn that personal data {3} carefully, or it may be misused. The more we depend on smart machines, {4} it becomes to think about the rules that should guide them.",
  blanks:[
    { opts:["used to take","are used to take","use to take","were used to taking"], a:0, ex:"used to + V＝過去慣常（現在不再）：以前要花好幾小時。be used to + V-ing 是「習慣於」，語意不合。" },
    { opts:["However","Therefore","Moreover","For example"], a:0, ex:"前句講 AI 帶來便利、後句話鋒一轉講新挑戰，語意「轉折」用 However（然而）。誘答拆解：Therefore 表因果（便利所以有挑戰？不通）；Moreover 表遞進（前後方向要一致）；For example 是舉例——只有 However 能完成「好處歸好處，但…」的轉彎。" },
    { opts:["must be protected","must protect","protecting","protects"], a:0, ex:"個資是「被保護」的對象，情態助動詞後接被動：must be + p.p.。" },
    { opts:["the more important","more important","the most important","most important"], a:0, ex:"「越…越…」句型：The more …, the more important …，兩個 the 都不能少。" }
  ]
},
{
  id:"cl-12", kind:"ceec", cat:"verb", lv:3, title:"克服上台恐懼",
  text:"When I first joined the debate club, I was too nervous {1} in front of others. My hands would shake every time I stood up to speak. {2} the encouragement of my teammates, I would have given up long ago. After months of practice, I finally won my first competition last spring. Looking back, I am glad that I chose to face my fear {3} running away from it. The experience taught me that confidence is something {4} through effort.",
  blanks:[
    { opts:["to speak","speaking","spoke","for speaking"], a:0, ex:"too + 形容詞 + to V＝「太…而無法…」：too nervous to speak（緊張到說不出口）。注意句中沒有 not，否定意味藏在 too…to 結構裡。誘答拆解：speaking／spoke 都不符合 too…to 的固定結構；for speaking 介系詞用法在此不成立。" },
    { opts:["Without","With","Despite","Through"], a:0, ex:"Without…＝「要不是…」的假設語氣（= If it had not been for…），主句用 would have + p.p.。" },
    { opts:["instead of","because of","in spite of","in case of"], a:0, ex:"面對恐懼「而不是」逃避，用 instead of + V-ing。" },
    { opts:["built","building","to build","builds"], a:0, ex:"something (that is) built through effort：過去分詞片語修飾 something，表「被建立」。" }
  ]
},

];
