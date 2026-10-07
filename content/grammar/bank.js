/* =========================================================
   GRAMMAR PRO — 大型題庫產生器（3,000+ 題）
   以「文法模板 × 詞彙變化」生成，答案由規則決定（保證正確）
   每題含：cat（分類）、lesson（主題）、lv（難度 1/2/3）、ex（詳解）
   ========================================================= */
(function(){
  const B = [];
  const rand = a => a[Math.floor(Math.random()*a.length)];
  let LV = 1;                                   // 目前難度：1 基礎 / 2 進階 / 3 精熟
  function mk(cat, topic, q, correct, distractors, ex){
    const seen=new Set(), opts=[];
    [String(correct), ...distractors.map(String)].forEach(o=>{ if(!seen.has(o)){ seen.add(o); opts.push(o); } });
    if(opts.length<2) return;
    for(let i=opts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [opts[i],opts[j]]=[opts[j],opts[i]]; }
    B.push({ cat, lesson:topic, lv:LV, q, opts, a:opts.indexOf(String(correct)), ex });
  }

  /* =====================================================
     難度 1：基礎
     ===================================================== */
  LV = 1;

  // 現在簡單式（第三人稱 -s，習慣）＋否定
  const S3=['My brother','She','The teacher','Mr. Chen','Our manager','His sister','The nurse','Tom','The engineer','My father','Her friend','The student','My mother','The doctor','The chef','Nina'];
  const VP=[
    {t:'plays',b:'play',i:'playing',o:'basketball'},{t:'watches',b:'watch',i:'watching',o:'the news'},
    {t:'cleans',b:'clean',i:'cleaning',o:'the kitchen'},{t:'checks',b:'check',i:'checking',o:'emails'},
    {t:'drinks',b:'drink',i:'drinking',o:'coffee'},{t:'reads',b:'read',i:'reading',o:'the newspaper'},
    {t:'feeds',b:'feed',i:'feeding',o:'the cat'},{t:'locks',b:'lock',i:'locking',o:'the door'},
    {t:'washes',b:'wash',i:'washing',o:'the car'},{t:'writes',b:'write',i:'writing',o:'a report'},
    {t:'cooks',b:'cook',i:'cooking',o:'dinner'},{t:'walks',b:'walk',i:'walking',o:'the dog'},
    {t:'waters',b:'water',i:'watering',o:'the plants'},{t:'answers',b:'answer',i:'answering',o:'calls'},
    {t:'teaches',b:'teach',i:'teaching',o:'English'},{t:'fixes',b:'fix',i:'fixing',o:'computers'}
  ];
  S3.forEach(s=>VP.forEach(v=>{
    mk('tense','現在簡單式',`${s} ___ every day.`, `${v.t} ${v.o}`,
      [`${v.b} ${v.o}`,`is ${v.i} ${v.o}`,`${v.i} ${v.o}`],
      'every day 表習慣性動作；主詞為第三人稱單數，動詞字尾加 -s/-es。其餘為進行式或原形，時態不符。');
    mk('tense','現在簡單式',`${s} doesn't ___ every day.`, `${v.b} ${v.o}`,
      [`${v.t} ${v.o}`,`${v.i} ${v.o}`,`to ${v.b} ${v.o}`],
      'does/doesn’t 之後動詞一律用原形（第三人稱的 -s 已由 does 表現）。');
  }));

  // 現在進行式（is / are / 否定）
  const VC=[
    {i:'sleeping',t:'sleeps',b:'sleep'},{i:'crying',t:'cries',b:'cry'},{i:'running',t:'runs',b:'run'},
    {i:'eating',t:'eats',b:'eat'},{i:'reading',t:'reads',b:'read'},{i:'cooking',t:'cooks',b:'cook'},
    {i:'singing',t:'sings',b:'sing'},{i:'working',t:'works',b:'work'},{i:'playing',t:'plays',b:'play'},
    {i:'talking',t:'talks',b:'talk'},{i:'studying',t:'studies',b:'study'},{i:'writing',t:'writes',b:'write'}
  ];
  const S1=['The baby','My brother','The dog','The teacher','She','He','The manager','Tom','My sister','The cat','The nurse','Nina'];
  const S1p=['The children','My parents','The students','The dogs','They','The workers','The kids','My friends','The players','The birds'];
  S1.forEach(s=>VC.forEach(v=>{
    mk('tense','現在進行式',`Look! ${s} ___ right now.`, `is ${v.i}`, [v.t, v.b, `was ${v.i}`],
      'right now 表此刻正在進行，用現在進行式 is + V-ing。');
    mk('tense','現在進行式',`${s} isn't ___ right now.`, v.i, [v.t, v.b, `is ${v.i}`],
      'be 動詞（isn’t）之後接現在分詞 V-ing 構成進行式否定。');
  }));
  S1p.forEach(s=>VC.forEach(v=>mk('tense','現在進行式',
    `Look! ${s} ___ right now.`, `are ${v.i}`, [v.t, v.b, `were ${v.i}`],
    '複數主詞的現在進行式用 are + V-ing。')));

  // 過去簡單式（不規則動詞）
  const IRR=[
    {b:'go',past:'went',pp:'gone',ing:'going',o:'to Japan'},{b:'eat',past:'ate',pp:'eaten',ing:'eating',o:'sushi'},
    {b:'see',past:'saw',pp:'seen',ing:'seeing',o:'a movie'},{b:'buy',past:'bought',pp:'bought',ing:'buying',o:'a new car'},
    {b:'take',past:'took',pp:'taken',ing:'taking',o:'the train'},{b:'write',past:'wrote',pp:'written',ing:'writing',o:'a letter'},
    {b:'give',past:'gave',pp:'given',ing:'giving',o:'a speech'},{b:'drink',past:'drank',pp:'drunk',ing:'drinking',o:'coffee'},
    {b:'make',past:'made',pp:'made',ing:'making',o:'a cake'},{b:'break',past:'broke',pp:'broken',ing:'breaking',o:'the window'},
    {b:'sing',past:'sang',pp:'sung',ing:'singing',o:'a song'},{b:'swim',past:'swam',pp:'swum',ing:'swimming',o:'in the sea'},
    {b:'drive',past:'drove',pp:'driven',ing:'driving',o:'to work'},{b:'meet',past:'met',pp:'met',ing:'meeting',o:'an old friend'}
  ];
  IRR.forEach(v=>{
    mk('tense','過去簡單式',`Yesterday they ___ ${v.o}.`, v.past, [v.b, v.pp, `have ${v.pp}`],
      `yesterday 表明確過去時間，用過去簡單式；${v.b} 的過去式為 ${v.past}。`);
    mk('tense','過去簡單式',`They didn't ___ ${v.o} last night.`, v.b, [v.past, v.pp, v.ing],
      'did / didn’t 之後接原形動詞。');
  });

  // 介系詞（時間 in/on/at）
  const PREP=[
    {list:['Monday','Tuesday','Friday','Sunday','March 3rd','May 5th','July 20th','my birthday','New Year’s Day','Christmas Day'], ans:'on', ex:'星期、日期、特定節日用 on。'},
    {list:['3 p.m.','noon','midnight','7 o’clock','9:30 a.m.','night','dawn','6 a.m.','sunrise','lunchtime'], ans:'at', ex:'精確時刻、at night、at noon 用 at。'},
    {list:['July','2025','the morning','winter','the afternoon','April','the evening','2030','summer','the 1990s'], ans:'in', ex:'月份、年份、季節、the morning/afternoon/evening 用 in。'}
  ];
  const PF=['The meeting is','The class begins','The store opens','The train leaves','We will meet','The party starts','The flight departs','The show starts','The bank closes','The event is'];
  PREP.forEach(g=>g.list.forEach(t=>PF.forEach(f=>mk('word','介系詞',
    `${f} ___ ${t.replace(/\.$/,'')}.`, g.ans, ['in','on','at','by'].filter(x=>x!==g.ans), g.ex))));

  // 介系詞（地點 in/on/at）
  const PLACE=[
    {list:['the bus stop','the door','the station','the airport','the entrance','the reception','the crossroads','the gate','the corner','the front desk'], ans:'at', frames:['Let’s meet ___','I’ll wait for you ___','We arrived ___','Someone is standing ___'], ex:'某一點（門口、車站、入口）用 at。'},
    {list:['the wall','the shelf','the roof','the ceiling','the table','the floor','the desk','the counter','the window','the balcony'], ans:'on', frames:['There is dust ___','I saw a mark ___','A spider is ___','Please put the vase ___'], ex:'接觸表面（牆上、桌上、地板上）用 on。'},
    {list:['the box','the drawer','the fridge','the bag','the wardrobe','the cupboard','the closet','the pocket','the basement','the garage'], ans:'in', frames:['I keep it ___','I found it ___','It is ___','Put the money ___'], ex:'在容器或範圍內部（盒子裡、抽屜裡）用 in。'}
  ];
  PLACE.forEach(g=>g.list.forEach(p=>g.frames.forEach(f=>mk('word','介系詞',
    `${f} ${p}.`, g.ans, ['in','on','at'].filter(x=>x!==g.ans).concat('to'), g.ex))));

  // 冠詞 a / an
  const ART=[
    ['honest man','an'],['umbrella','an'],['apple','an'],['egg','an'],['orange','an'],['old friend','an'],
    ['engineer','an'],['elephant','an'],['ant','an'],['ID card','an'],['hour-long class','an'],['MBA degree','an'],
    ['university student','a'],['European tourist','a'],['uniform','a'],['house','a'],['car','a'],
    ['dog','a'],['banana','a'],['yellow taxi','a'],['big city','a'],['unicorn','a'],['one-way ticket','a'],['useful tool','a']
  ];
  ART.forEach(([w,ans])=>mk('word','冠詞',
    `I saw ___ ${w} yesterday.`, ans, ['a','an','the','(none)'].filter(x=>x!==ans),
    `冠詞看「發音」而非拼字：${w} 開頭發${ans==='an'?'母音':'子音'}，用 ${ans}。`));

  // 數量詞 many / much
  const CNT=['books','cars','friends','apples','students','chairs','tickets','questions','ideas','emails'];
  const UNC=['money','time','water','information','advice','furniture','homework','coffee','luggage','equipment'];
  CNT.forEach(n=>mk('word','數量詞',`How ___ ${n} do you need?`,'many',['much','little','a little'],`${n} 為可數名詞（複數），數量用 many。`));
  UNC.forEach(n=>mk('word','數量詞',`How ___ ${n} do you need?`,'much',['many','few','a few'],`${n} 為不可數名詞，數量用 much。`));

  // 比較級
  const CADJ=[
    ['fast','faster'],['big','bigger'],['small','smaller'],['cheap','cheaper'],['light','lighter'],
    ['strong','stronger'],['quick','quicker'],['old','older'],['young','younger'],['tall','taller'],
    ['expensive','more expensive'],['popular','more popular'],['powerful','more powerful'],
    ['reliable','more reliable'],['modern','more modern'],['comfortable','more comfortable'],
    ['useful','more useful'],['efficient','more efficient'],['durable','more durable'],['practical','more practical']
  ];
  const CF=['The new model is','This version is','My phone is','Her laptop is','The latest design is','This camera is','The new engine is','Today is','The premium version is','Our new product is','This upgrade is','The updated design is'];
  CADJ.forEach(([base,comp])=>CF.forEach(f=>mk('compare','比較級',
    `${f} ___ than the old one.`, comp, [base, `most ${base}`, `as ${base}`],
    'than 表兩者相比，形容詞用比較級（-er 或 more）。不可 -er 與 more 並用。')));

  // 最高級
  const SUP=[
    ['fast','fastest'],['big','biggest'],['small','smallest'],['cheap','cheapest'],['old','oldest'],
    ['tall','tallest'],['strong','strongest'],['light','lightest'],['high','highest'],['long','longest'],
    ['expensive','most expensive'],['popular','most popular'],['powerful','most powerful'],
    ['reliable','most reliable'],['modern','most modern'],['comfortable','most comfortable']
  ];
  const SF=['It is the ___ one in the shop.','This is the ___ product here.','He is the ___ player on the team.','She is the ___ student in the class.','It is the ___ building in the city.'];
  SUP.forEach(([base,sup])=>SF.forEach(f=>mk('compare','最高級',
    f, sup, [base, base.match(/^(fast|big|small|cheap|old|tall|strong|light|high|long)$/)?base+'er':'more '+base, `the ${base}`],
    '三者以上比較用最高級（the + -est 或 the most），句中已含 the。')));

  // 形容詞 vs 副詞（curated）
  [
    [`She sings ___.`,'beautifully',['beautiful','beauty','more beautiful'],'sings 是一般動詞，修飾它用副詞（-ly）。'],
    [`Drive ___; the road is icy.`,'carefully',['careful','care','carefulness'],'修飾動詞 drive 用副詞。'],
    [`The soup tastes ___.`,'delicious',['deliciously','deliciousness','to taste'],'taste 為連綴動詞，後面接形容詞當補語。'],
    [`He speaks English ___.`,'fluently',['fluent','fluency','fluentness'],'修飾動詞 speaks 用副詞。'],
    [`These flowers smell ___.`,'sweet',['sweetly','sweetness','sweeten'],'smell 為連綴動詞，後接形容詞。'],
    [`She is a ___ driver.`,'careful',['carefully','care','caringly'],'修飾名詞 driver 用形容詞。'],
    [`The team worked ___.`,'hard',['hardly','harder','hardness'],'work hard=「努力」；hardly=「幾乎不」，意思不同。'],
    [`I ___ ever watch TV.`,'hardly',['hard','harder','hardness'],'hardly ever=「幾乎不」。'],
    [`He looked ___ at the news.`,'surprised',['surprisingly','surprise','surprising'],'描述「人的感受」用 -ed 分詞形容詞。'],
    [`The result was ___.`,'surprising',['surprised','surprise','surprisingly'],'描述「令人……的事物」用 -ing 分詞形容詞。'],
    [`The lecture was so ___ that I fell asleep.`,'boring',['bored','bore','to bore'],'令人無聊的事物用 boring（-ing）。'],
    [`She was ___ about the trip.`,'excited',['exciting','excite','excitement'],'人的感受用 excited（-ed）。'],
    [`They arrived ___.`,'late',['lately','later','lateness'],'late=「遲」（副詞同形）；lately=「最近」。'],
    [`Health is ___ than wealth.`,'more important',['important','importanter','most important'],'多音節形容詞比較級用 more。'],
    [`He runs as ___ as a cheetah.`,'fast',['faster','fastest','more fast'],'as … as 同級比較，中間用原級。'],
    [`This is ___ movie I've ever seen.`,'the best',['best','better','good'],'最高級要加 the；good 的最高級為 best。']
  ].forEach(([q,c,d,e])=>mk('compare','形容詞與副詞',q,c,d,e));

  // there be（現在／過去、單數／複數）
  const NPs=['a book on the desk','a problem with the plan','an error in the report','a message for you','one apple left','a car outside','a mistake here','a good reason','a spider on the wall','a call for you','a new student','a gift for you'];
  const NPp=['two books on the desk','many people here','several errors','some apples left','three cars outside','a few mistakes','lots of reasons','many problems','two calls for you','some new students','several gifts','many options'];
  NPs.forEach(np=>mk('syntax','there be',`There ___ ${np}.`,'is',['are','be','being'],'there be 依後面第一個名詞決定單複數；單數用 is。'));
  NPp.forEach(np=>mk('syntax','there be',`There ___ ${np}.`,'are',['is','be','being'],'後面名詞為複數，用 are。'));
  NPs.forEach(np=>mk('syntax','there be',`There ___ ${np} yesterday.`,'was',['were','been','being'],'過去且後接單數名詞，用 was。'));
  NPp.forEach(np=>mk('syntax','there be',`There ___ ${np} yesterday.`,'were',['was','been','being'],'過去且後接複數名詞，用 were。'));

  // 附加問句（curated）
  [
    [`You are a student, ___?`,`aren't you`,['are you',`don't you`,`isn't it`],'前肯後否；be 動詞的附加問句用 aren’t you。'],
    [`She can swim, ___?`,`can't she`,['can she',`doesn't she`,`isn't she`],'助動詞 can 的附加問句用 can’t she。'],
    [`He works here, ___?`,`doesn't he`,[`don't he`,`isn't he`,`won't he`],'一般動詞現在式肯定 → doesn’t he。'],
    [`They didn't come, ___?`,'did they',[`didn't they`,'do they',`don't they`],'前否後肯 → did they。'],
    [`Let's go, ___?`,'shall we',['will we','do we','shall you'],'Let’s 開頭的附加問句用 shall we。'],
    [`Open the window, ___?`,'will you',['do you','shall you',`won't it`],'祈使句的附加問句用 will you。'],
    [`I am late, ___?`,`aren't I`,['am not I',`amn't I`,`isn't I`],'I am 的附加問句慣用 aren’t I。'],
    [`She has finished, ___?`,`hasn't she`,[`didn't she`,`doesn't she`,`isn't she`],'完成式助動詞 has → hasn’t she。'],
    [`You won't tell him, ___?`,'will you',[`won't you`,'do you',`don't you`],'前否後肯 → will you。'],
    [`There is a problem, ___?`,`isn't there`,[`isn't it`,`aren't there`,'is there'],'there is 的附加問句用 isn’t there。']
  ].forEach(([q,c,d,e])=>mk('syntax','附加問句',q,c,d,e));

  /* =====================================================
     難度 2：進階
     ===================================================== */
  LV = 2;

  // 現在完成式（since）
  const S2=[['She','has'],['He','has'],['My uncle','has'],['Ms. Lin','has'],['The director','has'],['Our teacher','has'],['I','have'],['They','have'],['We','have'],['You','have']];
  const PP=[
    {pp:'lived',past:'lived',pres:'lives',ing:'living',c:'in Tokyo'},{pp:'worked',past:'worked',pres:'works',ing:'working',c:'at this company'},
    {pp:'studied',past:'studied',pres:'studies',ing:'studying',c:'English'},{pp:'known',past:'knew',pres:'knows',ing:'knowing',c:'the manager'},
    {pp:'taught',past:'taught',pres:'teaches',ing:'teaching',c:'math'},{pp:'owned',past:'owned',pres:'owns',ing:'owning',c:'this shop'},
    {pp:'played',past:'played',pres:'plays',ing:'playing',c:'the violin'},{pp:'led',past:'led',pres:'leads',ing:'leading',c:'the team'}
  ];
  const YR=['2015','2018','last year','2010','2020'];
  S2.forEach(([s,aux])=>PP.forEach(v=>mk('tense','現在完成式',
    `${s} ___ ${v.c} since ${rand(YR)}.`, `${aux} ${v.pp}`, [v.past, v.pres, `is ${v.ing}`],
    'since + 時間起點，表動作從過去持續到現在，用現在完成式 have/has + p.p.。')));

  // 現在完成式（just，不規則）
  const PPj=[
    {pp:'eaten',past:'ate',base:'eat',ing:'eating',o:'lunch'},{pp:'seen',past:'saw',base:'see',ing:'seeing',o:'the film'},
    {pp:'done',past:'did',base:'do',ing:'doing',o:'the task'},{pp:'written',past:'wrote',base:'write',ing:'writing',o:'the email'},
    {pp:'taken',past:'took',base:'take',ing:'taking',o:'the exam'},{pp:'gone',past:'went',base:'go',ing:'going',o:'home'},
    {pp:'given',past:'gave',base:'give',ing:'giving',o:'a talk'},{pp:'drunk',past:'drank',base:'drink',ing:'drinking',o:'the coffee'},
    {pp:'broken',past:'broke',base:'break',ing:'breaking',o:'the record'},{pp:'spoken',past:'spoke',base:'speak',ing:'speaking',o:'to him'}
  ];
  S2.forEach(([s,aux])=>PPj.forEach(v=>mk('tense','現在完成式',
    `${s} ${aux} just ___ ${v.o}.`, v.pp, [v.past, v.base, v.ing],
    'have/has (just) 之後接過去分詞 p.p.，表剛完成。')));

  // 被動語態（現在／過去／未來）
  const PV=[
    {n:'office',pp:'cleaned',act:'cleans',ing:'cleaning'},{n:'report',pp:'reviewed',act:'reviews',ing:'reviewing'},
    {n:'machine',pp:'inspected',act:'inspects',ing:'inspecting'},{n:'door',pp:'locked',act:'locks',ing:'locking'},
    {n:'garden',pp:'watered',act:'waters',ing:'watering'},{n:'system',pp:'updated',act:'updates',ing:'updating'},
    {n:'room',pp:'painted',act:'paints',ing:'painting'},{n:'store',pp:'opened',act:'opens',ing:'opening'},
    {n:'data',pp:'stored',act:'stores',ing:'storing'},{n:'pool',pp:'maintained',act:'maintains',ing:'maintaining'},
    {n:'bridge',pp:'repaired',act:'repairs',ing:'repairing'},{n:'website',pp:'redesigned',act:'redesigns',ing:'redesigning'},
    {n:'contract',pp:'signed',act:'signs',ing:'signing'},{n:'package',pp:'delivered',act:'delivers',ing:'delivering'}
  ];
  const ADV=['regularly','every day','once a week','every morning','routinely','frequently'];
  PV.forEach(v=>{
    ADV.forEach(a=>mk('voice','被動語態',`The ${v.n} ___ ${a}.`, `is ${v.pp}`, [v.act, `is ${v.ing}`, v.pp],
      `the ${v.n} 是動作的接受者（被……），用被動語態 is + p.p.。`));
    mk('voice','被動語態',`The ${v.n} ___ yesterday.`, `was ${v.pp}`, [v.act, `was ${v.ing}`, v.pp],
      '過去被動語態用 was/were + p.p.。');
    mk('voice','被動語態',`The ${v.n} ___ tomorrow.`, `will be ${v.pp}`, [`will ${v.pp}`, v.act, `will be ${v.act}`],
      '未來被動語態用 will be + p.p.。');
  });

  // 關係子句
  const PERSON=['man','woman','teacher','doctor','student','writer','singer','boy','girl','engineer','artist','nurse'];
  const THING=['book','car','house','phone','movie','song','painting','shop','watch','laptop','camera','bag'];
  const PVERB=['helped me','called you','won the award','lives next door','fixed my car','teaches history'];
  const TVERB=['I bought','you recommended','we watched','she chose','he ordered','they made'];
  PERSON.forEach(n=>PVERB.forEach(v=>mk('clause','關係子句',
    `The ${n} ___ ${v} is very kind.`, 'who', ['which','whose','where'],
    '先行詞指「人」且在子句中當主詞，用關係代名詞 who。')));
  THING.forEach(n=>TVERB.forEach(v=>mk('clause','關係子句',
    `The ${n} ___ ${v} was expensive.`, 'which', ['who','whose','when'],
    '先行詞指「物」，用關係代名詞 which（或 that）。')));
  PERSON.forEach(n=>mk('clause','關係子句',
    `I know a ${n} ___ car is red.`, 'whose', ['who','which','where'],
    '表「某人的……」，所有格關係代名詞用 whose。'));

  // 關係副詞 where / when
  const WHERE=['city','house','school','office','country','town','village','hotel'];
  const WHEN=['day','year','moment','summer','morning','season','week','time'];
  WHERE.forEach(p=>{
    mk('clause','關係副詞',`That is the ${p} ___ we met.`,'where',['which','who','when'],`先行詞是地點（${p}）且子句完整，用關係副詞 where。`);
    mk('clause','關係副詞',`This is the ${p} ___ I grew up.`,'where',['which','that','when'],'地點 + 完整句，用 where（＝in which）。');
  });
  WHEN.forEach(t=>{
    mk('clause','關係副詞',`I remember the ${t} ___ we first met.`,'when',['where','which','who'],`先行詞是時間（${t}），用關係副詞 when。`);
    mk('clause','關係副詞',`Summer is the ${t} ___ we go swimming.`,'when',['where','which','why'],'時間 + 完整句，用 when。');
  });

  // 不定詞 vs 動名詞
  const TOV=['want','decide','hope','plan','agree','promise','refuse','offer','expect','need','choose','learn'];
  const VING=['enjoy','finish','avoid','mind','keep','practice','suggest','admit','consider','deny','miss','quit'];
  const SUBJv=['I','We','They','People','Students'];
  const ACT=[
    {to:'to travel',ing:'traveling',base:'travel',past:'traveled',tail:'abroad'},
    {to:'to help',ing:'helping',base:'help',past:'helped',tail:'others'},
    {to:'to exercise',ing:'exercising',base:'exercise',past:'exercised',tail:'daily'},
    {to:'to join',ing:'joining',base:'join',past:'joined',tail:'the club'},
    {to:'to start',ing:'starting',base:'start',past:'started',tail:'early'},
    {to:'to work',ing:'working',base:'work',past:'worked',tail:'harder'},
    {to:'to cook',ing:'cooking',base:'cook',past:'cooked',tail:'at home'},
    {to:'to study',ing:'studying',base:'study',past:'studied',tail:'abroad'},
    {to:'to save',ing:'saving',base:'save',past:'saved',tail:'money'},
    {to:'to volunteer',ing:'volunteering',base:'volunteer',past:'volunteered',tail:'on weekends'},
    {to:'to relax',ing:'relaxing',base:'relax',past:'relaxed',tail:'on Sundays'},
    {to:'to organize',ing:'organizing',base:'organize',past:'organized',tail:'the event'}
  ];
  TOV.forEach(mv=>ACT.forEach(a=>mk('verb','不定詞/動名詞',
    `${rand(SUBJv)} ${mv} ___ ${a.tail}.`, a.to, [a.ing, a.base, a.past],
    `${mv} 屬於「接不定詞」的動詞，後面用 to + 原形（to V）。`)));
  VING.forEach(mv=>ACT.forEach(a=>mk('verb','不定詞/動名詞',
    `${rand(SUBJv)} ${mv} ___ ${a.tail}.`, a.ing, [a.to, a.base, a.past],
    `${mv} 屬於「接動名詞」的動詞，後面用 V-ing。`)));

  // 介系詞 + 動名詞
  const PADJ=['good at','interested in','tired of','afraid of','capable of','fond of','keen on'];
  const GACT=[
    {ing:'cooking',to:'to cook',base:'cook',past:'cooked'},{ing:'swimming',to:'to swim',base:'swim',past:'swam'},
    {ing:'writing',to:'to write',base:'write',past:'wrote'},{ing:'driving',to:'to drive',base:'drive',past:'drove'},
    {ing:'singing',to:'to sing',base:'sing',past:'sang'},{ing:'dancing',to:'to dance',base:'dance',past:'danced'},
    {ing:'painting',to:'to paint',base:'paint',past:'painted'},{ing:'traveling',to:'to travel',base:'travel',past:'traveled'}
  ];
  PADJ.forEach(adj=>GACT.forEach(a=>mk('verb','動名詞',
    `She is ${adj} ___.`, a.ing, [a.to, a.base, a.past],
    `介系詞（${adj.split(' ').pop()}）之後的動詞一律用動名詞 V-ing。`)));

  // 情態助動詞
  [
    [`You ___ touch that; it's dangerous.`,`mustn't`,[`don't have to`,'may','might'],'表「禁止」用 mustn’t。'],
    [`We ___ hurry; there's plenty of time.`,`don't have to`,[`mustn't`,`can't`,`shouldn't`],'表「不必」用 don’t have to（≠ mustn’t 禁止）。'],
    [`The lights are off; they ___ be out.`,'must',['can’t','would','may'],'依證據做強烈推測「一定」用 must。'],
    [`It ___ be true; I saw it myself.`,'can’t',['must','should','may'],'表「不可能」的否定推測用 can’t。'],
    [`You ___ wear a seatbelt by law.`,'must',['may','could','would'],'法律義務用 must。'],
    [`___ I open the window?`,'May',['Would','Should','Will'],'請求許可用 May/Can I。'],
    [`She ___ be at home; her car is here.`,'must',['can’t','would','shall'],'有明確證據時推測用 must。'],
    [`We ___ leave now, or we'll miss it.`,'should',['may','might','could'],'提出建議用 should。'],
    [`He ___ have worked late; the office was lit.`,'must',['can','would','shall'],'對過去的強烈推測用 must have + p.p.。'],
    [`You ___ have told me earlier!`,'should',['must','can','would'],'should have + p.p. 表「早該……卻沒」。']
  ].forEach(([q,c,d,e])=>mk('word','情態助動詞',q,c,d,e));

  // 連接詞與子句（curated）
  [
    [`___ it was raining, we went out.`,'Although',['Because','So','Unless'],'前後語意轉折，用讓步連接詞 Although。'],
    [`He stayed home ___ he was sick.`,'because',['because of','although','so'],'後接子句（S+V）用 because。'],
    [`The flight was delayed ___ the storm.`,'because of',['because','although','so'],'後接名詞用 because of。'],
    [`We'll wait ___ the rain stops.`,'until',['unless','although','because'],'until 表「直到……為止」。'],
    [`___ you hurry, you'll be late.`,'Unless',['Although','Because','So'],'unless = if … not（除非）。'],
    [`She was tired, ___ she kept working.`,'but',['so','because','although'],'語意轉折用對等連接詞 but。'],
    [`Study hard, ___ you'll pass.`,'and',['or','but','so'],'祈使句 + and =「就會……」。'],
    [`Hurry up, ___ you'll miss the bus.`,'or',['and','so','but'],'祈使句 + or =「否則……」。'],
    [`It was ___ hot that we stayed in.`,'so',['such','very','too'],'so + 形容詞 + that（如此……以致於）。'],
    [`It was ___ a hot day that we stayed in.`,'such',['so','very','too'],'such + a + 形容詞 + 名詞 + that。'],
    [`___ he is rich, he isn't happy.`,'Although',['Despite','Because','So'],'後接子句用 Although（Despite 接名詞）。'],
    [`Speak louder ___ everyone can hear you.`,'so that',['such that','because','though'],'表目的用 so that。'],
    [`Can you tell me ___ the meeting starts?`,'when',['when does','that when','does when'],'間接問句用直述語序：when + S + V。'],
    [`___ you need is a good rest.`,'What',['That','Which','It'],'缺少先行詞當主詞，用複合關代 What。'],
    [`___ wins the game gets a prize.`,'Whoever',['Whatever','However','Whichever'],'指人「無論誰」用 Whoever。'],
    [`This is the reason ___ she quit.`,'why',['which','that','how'],'先行詞為 reason，用關係副詞 why。']
  ].forEach(([q,c,d,e])=>mk('clause','連接詞與子句',q,c,d,e));

  // 使役 / 感官 / 特殊句型（curated）
  [
    [`My mom made me ___ my room.`,'clean',['to clean','cleaning','cleaned'],'make + 受詞 + 原形動詞。'],
    [`The teacher had us ___ the poem.`,'memorize',['to memorize','memorized','memorizing'],'have + 受詞 + 原形動詞。'],
    [`Please let me ___.`,'go',['to go','going','gone'],'let + 受詞 + 原形動詞。'],
    [`I got him ___ my car.`,'to fix',['fix','fixed','fixing'],'get + 受詞 + to V（get 是例外）。'],
    [`I had my hair ___ yesterday.`,'cut',['to cut','cutting','cuts'],'受詞被動作時用 p.p.：have + O + p.p.。'],
    [`I need to get my computer ___.`,'fixed',['fix','to fix','fixing'],'電腦「被」修，用 get + O + p.p.。'],
    [`We watched the sun ___ behind the hills.`,'set',['to set','sets','to setting'],'感官動詞看到「全程」用原形。'],
    [`Right now I can hear the birds ___ outside.`,'singing',['sing','to sing','sang'],'感官動詞看到「正在進行」用 V-ing。'],
    [`I saw him ___ the street.`,'cross',['to cross','crossed','crosses'],'感官動詞 + 受詞 + 原形（看到全程）。'],
    [`It ___ me twenty minutes to walk there.`,'takes',['spends','costs','pays'],'It takes + 人 + 時間 + to V。'],
    [`She spent all day ___ for the exam.`,'studying',['to study','study','studied'],'spend + 時間 + V-ing。'],
    [`It was ___ a hot day that we stayed inside.`,'such',['so','very','too'],'such + a + 形容詞 + 名詞 + that。'],
    [`He is ___ tired to work.`,'too',['so','very','enough'],'too … to V =「太……以致於不能」。'],
    [`She is old ___ to vote.`,'enough',['too','so','very'],'形容詞 + enough + to V。'],
    [`The rain prevented us ___ going out.`,'from',['to','of','for'],'prevent / stop + 受詞 + from + V-ing。'],
    [`Would you mind ___ the door?`,'opening',['to open','open','opened'],'mind 後面接動名詞 V-ing。']
  ].forEach(([q,c,d,e])=>mk('verb','動詞句型',q,c,d,e));

  // 主詞動詞一致（curated）
  [
    [`Each of the students ___ a book.`,'has',['have','are','were'],'each of + 複數名詞，動詞用單數 has。'],
    [`Everyone ___ happy today.`,'is',['are','were','be'],'everyone / everybody 視為單數。'],
    [`The number of tourists ___ rising.`,'is',['are','were','have'],'主詞是 the number（單數）；of 片語不影響。'],
    [`Neither of them ___ correct.`,'is',['are','were','have'],'neither of + 複數，動詞用單數。'],
    [`The news ___ good.`,'is',['are','were','have'],'news 為不可數名詞，用單數。'],
    [`Mathematics ___ my favorite subject.`,'is',['are','were','have'],'學科名（-ics）視為單數。'],
    [`Ten dollars ___ enough.`,'is',['are','were','have'],'金額、時間視為一個整體，用單數。'],
    [`Every boy and girl ___ a gift.`,'has',['have','are','were'],'every … and … 視為單數。'],
    [`A lot of information ___ available.`,'is',['are','were','have'],'a lot of + 不可數，動詞看不可數（單數）。'],
    [`Both of them ___ ready.`,'are',['is','was','has'],'both 為複數，用 are。'],
    [`Neither the players nor the coach ___ happy.`,'is',['are','were','being'],'neither…nor 採就近原則，配 coach（單數）。'],
    [`The quality of these products ___ excellent.`,'is',['are','were','being'],'主詞是 quality（單數）。']
  ].forEach(([q,c,d,e])=>mk('syntax','主詞動詞一致',q,c,d,e));

  // 詞性變化 word family（TOEIC 高頻）
  const FAM=[
    {n:'decision',v:'decide',adj:'decisive',adv:'decisively'},
    {n:'success',v:'succeed',adj:'successful',adv:'successfully'},
    {n:'creation',v:'create',adj:'creative',adv:'creatively'},
    {n:'production',v:'produce',adj:'productive',adv:'productively'},
    {n:'competition',v:'compete',adj:'competitive',adv:'competitively'},
    {n:'selection',v:'select',adj:'selective',adv:'selectively'}
  ];
  const NF=[`They announced the ___.`,`We discussed the ___ in detail.`];
  const VF=[`We must ___ quickly.`,`The team will ___ soon.`];
  const AJF=[`We need a ___ approach.`,`It was a ___ choice.`];
  const AVF=[`The team handled it ___.`,`She responded ___.`];
  FAM.forEach(f=>{
    const forms=[f.n,f.v,f.adj,f.adv];
    NF.forEach(fr=>mk('biz','詞性變化',fr, f.n, forms.filter(x=>x!==f.n),`冠詞 the 之後應填名詞：${f.n}。`));
    VF.forEach(fr=>mk('biz','詞性變化',fr, f.v, forms.filter(x=>x!==f.v),`助動詞之後應填原形動詞：${f.v}。`));
    AJF.forEach(fr=>mk('biz','詞性變化',fr, f.adj, forms.filter(x=>x!==f.adj),`名詞前應填形容詞：${f.adj}。`));
    AVF.forEach(fr=>mk('biz','詞性變化',fr, f.adv, forms.filter(x=>x!==f.adv),`修飾動詞應填副詞：${f.adv}。`));
  });

  // 商用文法（curated）
  [
    [`___ you please send me the file?`,'Could',['Must','Should','Did'],'商用禮貌請求用 Could / Would you。'],
    [`___ you mind sending the invoice again?`,'Would',['Should','Must','May'],'Would you mind + V-ing 為禮貌請求。'],
    [`Applicants ___ submit the form before the deadline.`,'must',['might','could','would'],'規定與義務用 must。'],
    [`I ___ appreciate a prompt reply.`,'would',['will','am','have'],'I would appreciate … 為商用客套語。'],
    [`The product is popular; ___, it's expensive.`,'however',['because','so','and'],'連接兩獨立句表轉折用副詞 however。'],
    [`We missed the train; ___, we took a taxi.`,'therefore',['moreover','however','otherwise'],'表因果結果用 therefore。'],
    [`The plan is cheap; ___, it's fast.`,'moreover',['however','therefore','otherwise'],'表遞進（而且）用 moreover。'],
    [`Hurry, ___ you'll miss the meeting.`,'otherwise',['moreover','therefore','however'],'otherwise =「否則」。'],
    [`The manager reviewed the plan ___.`,'carefully',['careful','care','caring'],'修飾動詞 reviewed 用副詞。'],
    [`We value honesty, teamwork, and ___.`,'creativity',['creative','creatively','create'],'平行結構須為相同詞性（名詞）。'],
    [`Each of the employees ___ a badge.`,'has',['have','are','were'],'Each 為單數，動詞用 has。'],
    [`Our order ___ shipped this morning.`,'has been',['has','have been','is being'],'完成式被動用 has been + p.p.。'],
    [`The report ___ by Friday.`,'will be submitted',['will submit','submits','is submitting'],'報告「被」遞交，用未來被動 will be + p.p.。'],
    [`Please reply ___ your earliest convenience.`,'at',['in','on','by'],'固定用語 at your earliest convenience。'],
    [`We look forward ___ hearing from you.`,'to',['for','at','on'],'look forward to 的 to 是介系詞，後接 V-ing。'],
    [`The meeting has been ___ until next week.`,'postponed',['postpone','postponing','postpones'],'被延期，用被動 has been + p.p.。']
  ].forEach(([q,c,d,e])=>mk('biz','商用文法',q,c,d,e));

  /* =====================================================
     難度 3：精熟
     ===================================================== */
  LV = 3;

  // 過去完成式（過去的過去）
  const PSUB=['they','she','he','the team','the guests','the staff','we','the students'];
  const PPP=[
    {pp:'gone home',past:'went home'},{pp:'finished the meal',past:'finished the meal'},
    {pp:'left the office',past:'left the office'},{pp:'started dinner',past:'started dinner'},
    {pp:'closed the shop',past:'closed the shop'},{pp:'sold out',past:'sold out'},
    {pp:'fallen asleep',past:'fell asleep'},{pp:'eaten everything',past:'ate everything'},
    {pp:'booked the room',past:'booked the room'},{pp:'boarded the plane',past:'boarded the plane'}
  ];
  PSUB.forEach(s=>PPP.forEach(v=>mk('tense','過去完成式',
    `By the time we arrived, ${s} ___.`, `had ${v.pp}`, [v.past, `have ${v.pp}`, v.pp],
    '兩件過去的事，「更早發生」的那件用過去完成式 had + p.p.。')));

  // 現在完成進行式（強調持續）
  const PCS=[['She','has'],['He','has'],['I','have'],['They','have'],['We','have'],['My brother','has'],['The kids','have'],['Tom','has']];
  const PCV=['studying','working','waiting','running','reading','cooking','driving','playing'];
  PCS.forEach(([s,aux])=>PCV.forEach(ing=>mk('tense','現在完成進行式',
    `${s} ___ for two hours.`, `${aux} been ${ing}`, [`${aux} ${ing}`, `is ${ing}`, `was ${ing}`],
    'for + 一段時間、強調動作「持續進行」，用現在完成進行式 have/has been + V-ing。')));

  // 假設語氣（curated）
  [
    [`If it ___ tomorrow, we'll stay home.`,'rains',['rained','will rain','would rain'],'第一類真實條件：if 子句用現在式，主句用 will。'],
    [`If I ___ you, I would apologize.`,'were',['am','was','will be'],'與現在相反的假設，be 動詞一律用 were。'],
    [`If she had studied, she ___ passed.`,'would have',['would','will have','had'],'與過去相反：主句用 would have + p.p.。'],
    [`If you heat ice, it ___.`,'melts',['melted','would melt','will melting'],'恆真事實（零條件句）兩邊都用現在式。'],
    [`If I had known, I ___ come earlier.`,'would have',['will have','would','had'],'與過去相反，主句用 would have + p.p.。'],
    [`I wish I ___ taller.`,'were',['am','will be','be'],'wish 表與現在相反的願望，be 用 were。'],
    [`I wish I ___ harder last year.`,'had studied',['studied','study','have studied'],'wish 對過去的遺憾用 had + p.p.。'],
    [`He talks as if he ___ everything.`,'knew',['knows','know','has known'],'as if 表與現實相反，動詞退為過去式。'],
    [`If I ___ rich, I would travel the world.`,'were',['am','will be','have been'],'與現在相反的假設，be 用 were。'],
    [`If they ___ earlier, they would have caught the train.`,'had left',['left','leave','have left'],'與過去相反，if 子句用 had + p.p.。'],
    [`It's high time we ___ home.`,'went',['go','will go','have gone'],'It’s high time + 過去式（早該……了）。'],
    [`I'd rather you ___ smoke here.`,`didn't`,[`don't`,`won't`,`not`],'would rather + S + 過去式（表寧願某人別……）。'],
    [`Without your help, I ___ have failed.`,'would',['will','had','was'],'without = if not，主句用 would have + p.p.。'],
    [`Were I you, I ___ take the offer.`,'would',['will','had','am'],'省略 if 的倒裝假設（Were I you = If I were you）。']
  ].forEach(([q,c,d,e])=>mk('voice','假設語氣',q,c,d,e));

  // 倒裝與強調（curated）
  [
    [`Never ___ such a mess before.`,'have I seen',['I have seen','I saw','did I saw'],'否定副詞 Never 置句首，主詞與助動詞倒裝。'],
    [`Seldom ___ late for work.`,'is he',['he is','does he','he does'],'頻率否定副詞置句首要倒裝。'],
    [`"I can't swim." "___."`,'Neither can I',['So can I','Neither do I','So do I'],'否定的呼應用 Neither + 助動詞 + 主詞。'],
    [`"I'm tired." "___."`,'So am I',['Neither am I','So do I','Neither do I'],'肯定的呼應用 So + 助動詞 + 主詞。'],
    [`___ Tom who broke the window.`,'It was',['There was','That was','It is'],'強調句 It is/was + 強調部分 + that/who。'],
    [`It was in Paris ___ they first met.`,'that',['which','when','where'],'強調句的連接詞一律用 that。'],
    [`Not only ___ smart, but he is also kind.`,'is he',['he is','does he','he has'],'Not only 置句首，主詞與 be 倒裝。'],
    [`Here ___ the bus!`,'comes',['come','is coming','came'],'地方副詞置句首、名詞主詞時動詞在前。'],
    [`Hardly ___ when the phone rang.`,'had I arrived',['I had arrived','I arrived','did I arrive'],'Hardly … when 句型，句首否定副詞要倒裝。'],
    [`Only then ___ the truth.`,'did he realize',['he realized','he did realize','realized he'],'Only + 副詞置句首時，主句倒裝。']
  ].forEach(([q,c,d,e])=>mk('syntax','倒裝與強調',q,c,d,e));

  // 名詞子句 / 轉述（curated）
  [
    [`I don't know where ___.`,'the station is',['is the station','the station','does the station'],'名詞子句用直述語序：S + V。'],
    [`Can you tell me what time ___?`,'it is',['is it','does it','it does'],'間接問句用直述語序 S + V。'],
    [`He asked me if I ___ ready.`,'was',['am','is','were'],'轉述句主句過去，子句時態往過去退（am→was）。'],
    [`She said she ___ come the next day.`,'would',['will','can','shall'],'轉述：主句過去，will 改為 would。'],
    [`Tom told me he ___ finished the report.`,'had',['has','have','was'],'轉述較早發生的動作，用過去完成式 had + p.p.。'],
    [`The teacher said the earth ___ round.`,'is',['was','were','had been'],'恆真的事實不退時態，維持現在式。'],
    [`___ he passed the exam surprised everyone.`,'That',['What','Which','Who'],'that 子句當主詞，敘述事實。'],
    [`Whether we win ___ on teamwork.`,'depends',['depend','depending','to depend'],'名詞子句當主詞視為單數，動詞用 depends。'],
    [`I'm not sure ___ he will come.`,'whether',['that','what','which'],'表「是否」用 whether / if。'],
    [`Do you know ___ she lives?`,'where',['where does','that where','does where'],'間接問句用直述語序 where + S + V。']
  ].forEach(([q,c,d,e])=>mk('clause','名詞子句',q,c,d,e));

  // 分詞構句（curated）
  [
    [`___ tired, he took a nap.`,'Feeling',['Felt','To feel','Feel'],'主動語態的分詞構句用現在分詞 V-ing。'],
    [`___ in 1990, the building is old.`,'Built',['Building','To build','Build'],'被動語態的分詞構句用過去分詞 p.p.。'],
    [`___ down the street, I met an old friend.`,'Walking',['Walked','To walk','Walk'],'主動同時進行的動作用現在分詞。'],
    [`___ the answer, he stayed silent.`,'Not knowing',['Not know','Don’t know','Not known'],'否定分詞構句：Not + V-ing。'],
    [`___ his work, he went home.`,'Having finished',['Finish','Finished','To finish'],'表先後：先完成用 Having + p.p.。'],
    [`___ by the news, she couldn't speak.`,'Shocked',['Shocking','Shock','To shock'],'表「人被……」用過去分詞（被動）。'],
    [`Generally ___, the plan is sound.`,'speaking',['speak','spoken','to speak'],'獨立片語 generally speaking（一般而言）。'],
    [`___ from here, the view is amazing.`,'Seen',['Seeing','See','To see'],'景色「被看」，用過去分詞 Seen（= When it is seen）。']
  ].forEach(([q,c,d,e])=>mk('syntax','分詞構句',q,c,d,e));

  // 進階比較（curated）
  [
    [`This box is twice ___ heavy as that one.`,'as',['more','so','than'],'倍數 + as + 形容詞 + as。'],
    [`The more you practice, the ___ you get.`,'better',['good','best','more good'],'The 比較級 …, the 比較級 …（越……越……）。'],
    [`Nothing is ___ precious than health.`,'more',['most','as','so'],'否定主詞 + 比較級 + than = 最高級意味。'],
    [`She is not ___ tall as her sister.`,'as',['more','so than','than'],'not as/so + 原級 + as（不如……）。'],
    [`This is ___ the two.`,'the better of',['better of','the best of','best of'],'兩者中「較……的」用 the + 比較級 + of the two。'],
    [`He runs ___ faster than me.`,'much',['very','more','so'],'比較級可用 much / far / a lot 加強（不可用 very）。'],
    [`The harder he tried, the ___ he became.`,'more confident',['confident','most confident','confidenter'],'the 比較級句型，多音節用 more。'],
    [`No other student is ___ than Amy.`,'smarter',['smart','smartest','more smart'],'no other + 比較級 + than = 最高級意味。']
  ].forEach(([q,c,d,e])=>mk('compare','進階比較',q,c,d,e));

  // 過去進行式（背景動作被打斷）
  const PCB=[['I','was'],['She','was'],['He','was'],['We','were'],['They','were'],['The kids','were'],['My sister','was'],['The workers','were']];
  const PCBV=[
    {i:'cooking',past:'cooked',base:'cook',o:'dinner'},{i:'reading',past:'read',base:'read',o:'a book'},
    {i:'watching',past:'watched',base:'watch',o:'TV'},{i:'driving',past:'drove',base:'drive',o:'home'},
    {i:'cleaning',past:'cleaned',base:'clean',o:'the house'},{i:'studying',past:'studied',base:'study',o:'for the test'},
    {i:'writing',past:'wrote',base:'write',o:'an email'},{i:'having',past:'had',base:'have',o:'lunch'}
  ];
  PCB.forEach(([s,aux])=>PCBV.forEach(v=>mk('tense','過去進行式',
    `${s} ___ ${v.o} when the phone rang.`, `${aux} ${v.i}`, [v.past, v.base, `had ${v.i}`],
    'when 引導的短暫動作發生時，正在進行的背景動作用過去進行式 was/were + V-ing。')));

  // 指派 qid / lessonId（供錯題本與交卷使用）
  B.forEach((q,i)=>{ q.qid='bank#'+i; q.lessonId='bank'; });

  window.QUESTION_BANK = B;
})();
