// Battle screen: canvas battlefield + hero cards (ultimates) + question panel.
// The engine is either a local Battle (PvE, arena, practice, online host) or a RemoteBattle mirror
// (online guest); both expose the same surface. setup comes from ui/battleSetup.js.
import { register, replace, modal, back, pushBack } from '../app.js';
import { h, esc, sleep } from '../dom.js';
import { icon } from '../../art/icons.js';
import { heroImage, heroImageURL } from '../../art/hero.js';
import { monsterImage } from '../../art/monster.js';
import { HERO_MAP } from '../../core/data/heroes.js';
import { ENEMIES } from '../../core/data/enemies.js';
import { Battle, ENERGY_MAX, CUTIN_TIME } from '../../core/battle/sim.js';
import { QuestionDeck, speedTier } from '../../core/quiz/gen.js';
import { record } from '../../core/quiz/srs.js';
import { S, changed, addCur, markStudyDay } from '../../core/state.js';
import { track } from '../../core/missions.js';
import { goldPerAnswer } from '../../core/economy.js';
import { BattleView } from '../../fx/battleView.js';
import { playCutin } from '../cutin.js';
import { speak, sfx, music, intensity, stinger, stopSpeak } from '../sound.js';
import { setBgPaused } from '../../fx/bg.js';
import { fmt, msToClock } from '../../core/util.js';
import { makeRng } from '../../core/rng.js';

const STEP = 1 / 60;

register({
  id: 'battle', tab: 'adventure', chrome: false, title: '戰鬥',
  mount(el, setup) {
    setBgPaused(true);
    const mySide = setup.mySide || 0;
    const learn = S.d.learn;
    const settings = S.d.settings;
    let engine = setup.engine || null;
    let destroyed = false;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let paused = false;
    let ended = false;
    let gold = 0;
    let q = null;
    let qShown = 0;
    let qLocked = false;
    let nextQTimer = 0;
    let lastFrameAt = 0;
    const mistakes = [];
    const answered = [];
    const seenDue = new Set(setup.dueSet || []);
    const ai = setup.opponentAI ? makeAI(setup.opponentAI) : null;

    el.innerHTML = `<div class="bt">
<div class="bt-hud">
  <button class="bt-pause" data-a="pause">${icon('pause')}</button>
  <div class="bt-stage"><small>${esc(setup.subtitle || '')}</small><b>${esc(setup.title || '')}</b></div>
  <div class="bt-gold">${icon('coin')}<b>0</b></div>
  <div class="bt-time">1:30</div>
  <button class="bt-auto ${settings.autoUlt ? 'on' : ''}" data-a="auto">${icon('auto')}<span>AUTO</span></button>
</div>
<div class="bt-field"><canvas></canvas>
  <div class="bt-combo"><b>0</b><small>COMBO</small></div>
  <div class="bt-fever">FEVER!</div>
  <div class="bt-banner"></div>
  <div class="bt-opp"></div>
</div>
<div class="bt-cards"></div>
<div class="bt-quiz">
  <div class="q-head"><span class="q-label"></span><span class="q-speed"><i></i></span><span class="q-n"></span></div>
  <div class="q-prompt"></div>
  <div class="q-opts"></div>
  <div class="q-fb"></div>
</div>
<div class="bt-overlay"></div>
</div>`;
    const $ = (s) => el.querySelector(s);
    const field = $('.bt-field');
    const canvas = $('canvas');
    const cardsEl = $('.bt-cards');
    const overlay = $('.bt-overlay');
    const timeEl = $('.bt-time');
    const goldEl = $('.bt-gold b');
    const comboEl = $('.bt-combo');
    const feverEl = $('.bt-fever');
    const qLabel = $('.q-label'), qPrompt = $('.q-prompt'), qOpts = $('.q-opts'), qFb = $('.q-fb'), qSpeed = $('.q-speed i'), qN = $('.q-n');

    const view = new BattleView(canvas, { bg: setup.bg || 'plains', quality: settings.fx });

    // ---------------------------------------------------------------- setup engine + sprites
    if (!engine) {
      engine = new Battle({
        seed: setup.seed || (Date.now() & 0xffffff), mode: setup.simMode || 'pve', timeLimit: setup.timeLimit || 90, raid: !!setup.raid,
        sides: [
          { name: setup.myName || 'Player', units: setup.playerUnits, auto: !!settings.autoUlt },
          { name: setup.oppName || 'Enemy', units: setup.enemyUnits, auto: true, enemyEnergy: !!setup.enemyEnergy },
        ],
      });
    } else if (engine.setAuto) engine.setAuto(mySide, !!settings.autoUlt);

    const deck = new QuestionDeck({ ...setup.deck, learn: setup.deck.pool ? null : learn, listen: settings.listen, tts: settings.tts });
    const viewSide = (simSide) => (simSide === mySide ? 0 : 1);
    const myUnits = () => engine.units.filter((u) => u.side === mySide);

    async function loadSprites() {
      const jobs = [];
      for (const u of engine.units) {
        const vs = viewSide(u.side);
        const info = { id: u.id, side: vs, slot: u.slot, boss: u.boss, scale: u.boss ? (ENEMIES[u.key] && ENEMIES[u.key].scale) || 1.7 : 1, element: u.element, maxHp: u.maxHp, imgs: {}, flip: false, monster: false };
        if (u.kind === 'hero') {
          const def = HERO_MAP[u.key];
          const skin = u.spec && u.spec.skin;
          info.flip = vs === 1;
          jobs.push(Promise.all([heroImage(def, { skin }), heroImage(def, { skin, expr: 'hurt' }), heroImage(def, { skin, expr: 'angry' })]).then(([a, b, c]) => { info.imgs = { normal: a, hurt: b, attack: c }; }));
        } else {
          const def = ENEMIES[u.key];
          info.monster = def.kind !== 'queen';
          info.flip = vs === 0;
          const crown = !!def.crown;
          jobs.push(Promise.all([monsterImage(def.kind, u.element, { crown }), monsterImage(def.kind, u.element, { crown, expr: 'hurt' })]).then(([a, b]) => { info.imgs = { normal: a, hurt: b, attack: a }; }));
        }
        view.addUnit(info);
        jobs[jobs.length - 1].then(() => { const vu = view.unit(u.id); if (vu) vu.imgs = info.imgs; });
      }
      await Promise.all(jobs);
    }

    // ---------------------------------------------------------------- cards
    const renderCards = () => {
      cardsEl.innerHTML = myUnits().map((u) => {
        const def = HERO_MAP[u.key];
        return `<button class="bc el-${u.element}" data-u="${u.id}"><img src="${heroImageURL(def, { crop: 'face', skin: u.spec && u.spec.skin })}"><div class="bc-en"><i></i></div><div class="bc-hp"><i></i></div><span class="bc-ready">奧義</span><span class="bc-ko">KO</span></button>`;
      }).join('');
    };
    const updateCards = () => {
      for (const c of cardsEl.children) {
        const u = engine.unit(c.dataset.u);
        if (!u) continue;
        const en = Math.min(1, u.energy / ENERGY_MAX);
        c.querySelector('.bc-en i').style.width = en * 100 + '%';
        c.querySelector('.bc-hp i').style.width = Math.max(0, u.hp / u.maxHp) * 100 + '%';
        c.classList.toggle('ready', u.alive && en >= 1);
        c.classList.toggle('dead', !u.alive);
        c.classList.toggle('low', u.alive && u.hp / u.maxHp < 0.3);
      }
    };
    cardsEl.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.bc');
      if (!c || paused || ended) return;
      const ok = engine.input(mySide, { type: 'ult', unit: c.dataset.u });
      if (ok) { sfx('ultReady'); c.classList.add('fire'); setTimeout(() => c.classList.remove('fire'), 400); }
      else sfx('error');
    });

    // ---------------------------------------------------------------- questions
    const showQuestion = () => {
      if (ended || destroyed) return;
      q = deck.next();
      if (!q) return;
      qShown = performance.now();
      qLocked = false;
      qLabel.textContent = q.label;
      qN.textContent = `#${q.n}`;
      const speakBtn = q.speak && !q.speakOnShow && q.type !== 'listen' ? '' : q.speak ? `<button class="q-say" data-say="1">${icon('speaker')}</button>` : '';
      if (q.sentence) qPrompt.innerHTML = `<div class="q-sent ${q.sentence.length > 90 ? 'long' : ''}">${fmtBlank(q.sentence)}</div>`;
      else qPrompt.innerHTML = `<div class="q-main ${q.main.length > 14 ? 'long' : ''} ${/[一-鿿]/.test(q.main) ? 'zh' : ''}">${esc(q.main)}${speakBtn}</div>${q.sub ? `<div class="q-sub">${esc(q.sub)}</div>` : ''}`;
      qOpts.className = `q-opts n${q.options.length} ${q.options.some((o) => o.length > 22) ? 'long' : ''}`;
      qOpts.innerHTML = q.options.map((o, i) => `<button class="q-opt" data-i="${i}"><span>${esc(o)}</span></button>`).join('');
      qFb.innerHTML = '';
      qFb.className = 'q-fb';
      el.querySelector('.bt-quiz').classList.remove('wrong', 'right');
      if (q.speakOnShow && settings.tts) speak(q.speak);
      if (q.type === 'listen' && !settings.tts) speak(q.speak, { force: true });
    };
    const fmtBlank = (s) => esc(s).replace(/_{2,}/g, '<span class="blank">　　　</span>');

    qPrompt.addEventListener('click', (e) => { if (e.target.closest('[data-say]') && q) speak(q.speak, { force: true }); });
    qOpts.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.q-opt');
      if (!b || qLocked || !q || paused || ended) return;
      answer(+b.dataset.i, b);
    });

    const answer = (i, btn) => {
      qLocked = true;
      const ms = performance.now() - qShown;
      const ok = i === q.answer;
      const tier = speedTier(ms, q.par);
      engine.input(mySide, { type: 'answer', ok, tier });
      const rec = record(learn, q.item, ok);
      answered.push({ item: q.item, ok, ms });
      S.d.stats.answered++;
      if (seenDue.has(q.item)) track('review', 1);
      if (rec.mastered) track('mastered', 1);
      if (markStudyDay()) track('studyDay', 1);
      const opts = qOpts.children;
      opts[q.answer].classList.add('right');
      if (ok) {
        S.d.stats.correct++;
        track('correct', 1);
        const g = Math.round(goldPerAnswer(setup.level || 1) * (setup.goldMult ?? 1) * (tier === 'perfect' ? 1.5 : 1));
        if (setup.goldMult !== 0) { gold += g; addCur('gold', g); flyCoins(btn, g); }
        el.querySelector('.bt-quiz').classList.add('right');
        qFb.innerHTML = `<span class="tier ${tier}">${tier === 'perfect' ? 'PERFECT!' : tier === 'great' ? 'GREAT!' : 'GOOD'}</span>`;
        sfx(tier === 'perfect' ? 'perfect' : 'correct');
        flyEnergy(btn);
        if (q.speakOnReveal && settings.tts && q.type !== 'gram' && q.type !== 'passage') speak(q.speak);
        nextQTimer = setTimeout(showQuestion, tier === 'perfect' ? 380 : 520);
      } else {
        btn.classList.add('wrong');
        el.querySelector('.bt-quiz').classList.add('wrong');
        mistakes.push(q);
        sfx('wrong');
        vib(60);
        qFb.className = 'q-fb show';
        qFb.innerHTML = `<div class="fb-ans">✔ ${esc(q.options[q.answer])}</div>${q.explain ? `<div class="fb-ex">${esc(q.explain)}</div>` : ''}`;
        if (q.speak && settings.tts) speak(q.speak);
        nextQTimer = setTimeout(showQuestion, 1900);
      }
      changed('battleAnswer');
    };

    const flyCoins = (from, g) => {
      const r1 = from.getBoundingClientRect(), r2 = $('.bt-gold').getBoundingClientRect(), r0 = el.getBoundingClientRect();
      for (let k = 0; k < 3; k++) {
        const c = h(`<i class="fly-coin">${icon('coin')}</i>`);
        c.style.left = r1.left - r0.left + r1.width / 2 + 'px';
        c.style.top = r1.top - r0.top + r1.height / 2 + 'px';
        c.style.setProperty('--dx', r2.left - r1.left - r1.width / 2 + 'px');
        c.style.setProperty('--dy', r2.top - r1.top - r1.height / 2 + 'px');
        c.style.animationDelay = k * 70 + 'ms';
        overlay.appendChild(c);
        setTimeout(() => c.remove(), 900);
      }
      setTimeout(() => { goldEl.textContent = fmt(gold); goldEl.parentElement.classList.remove('pop'); void goldEl.offsetWidth; goldEl.parentElement.classList.add('pop'); sfx('coin'); }, 600);
      void g;
    };
    const flyEnergy = (from) => {
      const r1 = from.getBoundingClientRect(), r0 = el.getBoundingClientRect();
      for (const c of cardsEl.children) {
        if (c.classList.contains('dead')) continue;
        const r2 = c.getBoundingClientRect();
        const o = h('<i class="fly-orb"></i>');
        o.style.left = r1.left - r0.left + r1.width / 2 + 'px';
        o.style.top = r1.top - r0.top + 10 + 'px';
        o.style.setProperty('--dx', r2.left - r1.left - r1.width / 2 + r2.width / 2 + 'px');
        o.style.setProperty('--dy', r2.top - r1.top + r2.height * 0.7 - 10 + 'px');
        overlay.appendChild(o);
        setTimeout(() => o.remove(), 600);
      }
    };

    // ---------------------------------------------------------------- events
    let lastCombo = 0;
    const handleEvents = (events) => {
      for (const e of events) {
        view.event(e, viewSide(mySide) === 0 ? 0 : 1);
        switch (e.k) {
          case 'ult': {
            const u = engine.unit(e.u);
            if (!u) break;
            const enemy = u.side !== mySide;
            view.frozen = true;
            setTimeout(() => { view.frozen = false; }, CUTIN_TIME * 1000);
            if (u.kind === 'hero') {
              const def = HERO_MAP[u.key];
              playCutin(field, { hero: def, skin: u.spec && u.spec.skin, element: u.element, name: e.name, en: e.en, enemy, dur: CUTIN_TIME });
              if (!enemy && settings.tts) speak(def.ultLine[0], { rate: 1.05 });
              S.d.stats.ults = (S.d.stats.ults || 0) + (enemy ? 0 : 1);
            } else {
              const def = ENEMIES[u.key];
              playCutin(field, { monster: { kind: def.kind, element: u.element }, element: u.element, name: e.name, en: def.en, enemy: true, dur: CUTIN_TIME });
            }
            sfx(enemy ? 'enemyUlt' : 'ult');
            vib(40);
            break;
          }
          case 'ultFire': sfx('ultHit'); break;
          case 'dmg': if (!e.dot) sfx(e.crit ? 'crit' : 'hit', { pan: 0 }); break;
          case 'act': if (e.a === 'skill') sfx('skill'); else sfx(e.melee ? 'slash' : 'shoot'); break;
          case 'heal': if (!e.regen) sfx('heal'); break;
          case 'death': sfx('death'); break;
          case 'answer':
            if (e.side === mySide) {
              if (e.ok && e.fever) { banner('FEVER TIME!', 'fever'); sfx('fever'); vib(30); }
              if (!e.ok && e.broke >= 5) banner(`COMBO 中斷`, 'bad');
            }
            break;
          case 'charge': {
            const u = engine.unit(e.u);
            if (u && u.side !== mySide) { banner(`⚠ ${e.name}！連續答對 ${e.need} 題打斷它！`, 'warn', 2.6); sfx('alarm'); music('boss'); }
            break;
          }
          case 'break': banner('BREAK!! 首領暈眩', 'break'); sfx('break'); vib(80); break;
          case 'chargeBlast': sfx('bossBlast'); vib(120); break;
          case 'sudden': banner('SUDDEN DEATH　傷害 ×1.5', 'warn'); break;
          case 'end': onEnd(e); break;
          default:
        }
      }
    };

    let bannerTimer = 0;
    const banner = (text, cls = '', secs = 1.6) => {
      const b = $('.bt-banner');
      b.className = 'bt-banner show ' + cls;
      b.textContent = text;
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => { b.className = 'bt-banner'; }, secs * 1000);
    };
    const vib = (ms) => { if (settings.vib) try { window.NativeBridge && window.NativeBridge.vibrate(ms); } catch { /* ignore */ } };

    // ---------------------------------------------------------------- loop
    const hudTick = () => {
      const S0 = engine.sides[mySide];
      const tl = engine.timeLeft();
      timeEl.textContent = msToClock(tl * 1000);
      timeEl.classList.toggle('low', tl < 15);
      if (S0.combo !== lastCombo) {
        comboEl.querySelector('b').textContent = S0.combo;
        comboEl.classList.toggle('show', S0.combo >= 2);
        comboEl.classList.remove('bump'); void comboEl.offsetWidth; comboEl.classList.add('bump');
        lastCombo = S0.combo;
      }
      const fever = engine.isFever(mySide);
      feverEl.classList.toggle('show', fever);
      el.querySelector('.bt').classList.toggle('fever', fever);
      el.querySelector('.bt').classList.toggle('dazed', S0.dazed > engine.t);
      if (q && !qLocked) {
        const s = (performance.now() - qShown) / 1000;
        const k = Math.min(1, s / q.par);
        qSpeed.style.width = (1 - k) * 100 + '%';
        qSpeed.className = s < q.par * 0.45 ? 'perfect' : s < q.par ? 'great' : 'good';
      }
      const foeAlive = engine.units.filter((u) => u.side !== mySide && u.alive);
      const total = engine.units.filter((u) => u.side !== mySide).reduce((a, u) => a + u.maxHp, 0);
      const now = foeAlive.reduce((a, u) => a + Math.max(0, u.hp), 0);
      intensity(Math.min(1, 0.3 + (1 - now / total) * 0.5 + (fever ? 0.3 : 0)));
      updateCards();
    };

    const frame = (ts) => {
      if (destroyed) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (ts - last) / 1000 || 0);
      last = ts;
      lastFrameAt = performance.now();
      if (!paused) {
        acc += dt;
        let n = 0;
        while (acc >= STEP && n < 8) {
          engine.step(STEP);
          if (ai) ai.tick(STEP, engine);
          acc -= STEP;
          n++;
        }
        if (n >= 8) acc = 0;
        const evs = engine.takeEvents();
        if (evs.length && setup.onEvents) setup.onEvents(evs);
        if (evs.length) handleEvents(evs);
        if (setup.onTick) setup.onTick(dt);
        for (const u of engine.units) view.sync(u.id, u.hp, u.alive, u.energy, u.shield, null);
        view.update(dt);
      }
      const fev = [engine.isFever(mySide), engine.isFever(1 - mySide)];
      view.draw(fev);
      hudTick();
    };

    // ---------------------------------------------------------------- end
    const onEnd = async (e) => {
      if (ended) return;
      ended = true;
      clearTimeout(nextQTimer);
      stopSpeak();
      const win = setup.raid ? true : e.winner === mySide;
      const draw = e.winner === -1;
      await sleep(500);
      const ov = h(`<div class="bt-result ${win ? 'win' : draw ? 'draw' : 'lose'}"><div class="br-rays"></div><div class="br-text">${win ? 'VICTORY' : draw ? 'DRAW' : 'DEFEAT'}</div><div class="br-sub">${win ? '勝利' : draw ? '平手' : '敗北'}</div></div>`);
      overlay.appendChild(ov);
      stinger(win ? 'victory' : 'defeat');
      sfx(win ? 'victory' : 'defeat');
      if (win) speak(win ? 'Victory!' : '');
      await sleep(2000);
      if (destroyed) return;
      const summary = engine.summary(mySide);
      summary.win = win;
      summary.draw = draw;
      summary.gold = gold;
      summary.mistakes = mistakes;
      summary.answeredList = answered;
      const result = setup.onEnd ? await setup.onEnd(summary) : { summary };
      replace('results', { setup, summary, result });
    };

    // ---------------------------------------------------------------- controls
    el.querySelector('.bt-hud').addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'pause') openPause();
      if (b.dataset.a === 'auto') {
        settings.autoUlt = !settings.autoUlt;
        b.classList.toggle('on', settings.autoUlt);
        engine.input(mySide, { type: 'auto', on: settings.autoUlt });
        sfx('tap');
        changed('settings');
      }
    });

    const openPause = async () => {
      if (ended || setup.noPause) return;
      if (setup.online) {
        const v = await modal({ title: '線上對戰中', body: '<p class="confirm-text">線上對戰無法暫停。要投降嗎？</p>', buttons: [{ label: '投降', cls: 'red', value: 'quit' }, { label: '繼續戰鬥', cls: 'primary', value: 'go' }] });
        if (v === 'quit' && !ended && setup.onSurrender) setup.onSurrender();
        return;
      }
      paused = true;
      music('pause');
      const v = await modal({
        title: '暫停', closable: true,
        body: `<div class="pause-info"><div>${esc(setup.title || '')}</div><div class="dim">答對 ${engine.sides[mySide].correct} / ${engine.sides[mySide].answered}　最高連擊 ${engine.sides[mySide].maxCombo}</div></div>`,
        buttons: [{ label: '撤退', cls: 'red', value: 'quit' }, { label: '繼續戰鬥', cls: 'primary', value: 'go' }],
      });
      if (v === 'quit') {
        ended = true;
        if (setup.onQuit) setup.onQuit();
        back();
        return;
      }
      paused = false;
      last = performance.now();
      music(setup.music || 'battle');
    };

    // ---------------------------------------------------------------- start
    renderCards();
    (async () => {
      await loadSprites();
      if (destroyed) return;
      if (!S.d.flags.tutBattle && !setup.online) {
        view.resize();
        view.update(0);
        view.draw([false, false]);
        await tutorial(overlay);
        S.d.flags.tutBattle = true;
        changed('flags');
        if (destroyed) return;
      }
      view.resize();
      music(setup.music || 'battle');
      banner(setup.startText || 'BATTLE START', 'start', 1.4);
      sfx('battleStart');
      last = performance.now();
      lastFrameAt = last;
      raf = requestAnimationFrame(frame);
      setTimeout(showQuestion, 700);
      if (setup.onStart) setup.onStart({ engine, view });
    })();
    // dev: a hidden preview pane never fires requestAnimationFrame, so drive the loop by timer there
    const watchdog = __DEV__ ? setInterval(() => { if (!destroyed && lastFrameAt && performance.now() - lastFrameAt > 250) frame(performance.now()); }, 50) : 0;
    if (__DEV__) {
      window.__lxBattle = {
        engine: () => engine,
        answer: (ok = true) => { if (!q || qLocked) return false; const i = ok ? q.answer : (q.answer + 1) % q.options.length; answer(i, qOpts.children[i]); return true; },
        ult: (k = 0) => engine.input(mySide, { type: 'ult', unit: myUnits()[k].id }),
      };
    }
    const onResize = () => view.resize();
    window.addEventListener('resize', onResize);

    return {
      back() { openPause(); return true; },
      destroy() {
        destroyed = true;
        cancelAnimationFrame(raf);
        clearInterval(watchdog);
        clearTimeout(nextQTimer);
        clearTimeout(bannerTimer);
        window.removeEventListener('resize', onResize);
        stopSpeak();
        setBgPaused(false);
        music('menu');
        if (setup.onDestroy) setup.onDestroy();
        changed('battle');
      },
    };
  },
});

/** First battle: how answering, ultimates, FEVER and BREAK work. Resolves when dismissed. */
function tutorial(host) {
  return new Promise((resolve) => {
    const tips = [
      ['bolt', '答題＝充能', '答對題目，全隊獲得能量。答得越快（PERFECT／GREAT）能量越多，還會掉金幣！'],
      ['star', '施放奧義', '角色卡發光並顯示「奧義」時點擊它！右上角 AUTO 可以自動施放。'],
      ['swords', '連擊與 FEVER', '連續答對 5 題進入 FEVER：傷害 +25%、充能 ×1.5。答錯會中斷連擊並短暫暈眩，正解會立刻告訴你。'],
      ['dragon', '打斷首領', '首領蓄力大招時，限時內連續答對指定題數就能 BREAK，讓它暈眩又破防！'],
    ];
    const el = h(`<div class="tut"><div class="tut-box panel ornate"><div class="tut-title">戰鬥教學</div>${tips.map(([ic, t, d]) => `<div class="tut-row"><span class="tut-ic">${icon(ic)}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}<button class="btn primary big block">開始戰鬥！</button></div></div>`);
    const close = () => { popBack(); el.remove(); resolve(); };
    const popBack = pushBack(close);
    el.querySelector('button').onclick = close;
    host.appendChild(el);
  });
}

/** Opponent bot: answers on its own clock (practice duels, arena). */
export function makeAI({ acc = 0.75, mean = 4, par = 6, side = 1, seed = 99 }) {
  const rng = makeRng(seed);
  let next = 1.5 + rng() * mean;
  let t = 0;
  return {
    tick(dt, engine) {
      t += dt;
      if (t < next || engine.over) return;
      const took = Math.max(0.9, mean + (rng() - 0.5) * mean);
      const ok = rng() < acc;
      engine.input(side, { type: 'answer', ok, tier: took < par * 0.45 ? 'perfect' : took < par ? 'great' : 'good' });
      next = t + took + (ok ? 0.35 : 1.6);
    },
  };
}
