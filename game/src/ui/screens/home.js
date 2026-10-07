// Home lobby: the secretary hero (tap to talk - English lines with TTS), side menus, event banners,
// the daily study card and a quick "continue adventure" button.
import { register, go, modal, toast } from '../app.js';
import { bindActions, esc, h } from '../dom.js';
import { icon } from '../../art/icons.js';
import { heroImageURL } from '../../art/hero.js';
import { heroArt, sceneStyle } from '../../art/assets.js';
import { HERO_MAP } from '../../core/data/heroes.js';
import { S, changed, studyStreak } from '../../core/state.js';
import { dueItems, mistakeItems, counts } from '../../core/quiz/srs.js';
import { badges, dailyState, loginCalendarState, claimLogin, LOGIN_CAL } from '../../core/missions.js';
import { featuredHero } from '../../core/gacha.js';
import { CHAPTERS, STAGES_PER_CHAPTER } from '../../core/data/stages.js';
import { speak, sfx } from '../sound.js';
import { setBgTheme } from '../../fx/bg.js';
import { rewardList } from '../widgets.js';
import { grantMail } from './mail.js';
import { LiveFigure } from '../../gfx/live2d.js';
import { PAL } from '../../gfx/vfx.js';

function nextStage() {
  const cl = S.d.campaign.cleared;
  for (let c = 1; c <= CHAPTERS.length; c++) {
    for (let n = 1; n <= STAGES_PER_CHAPTER; n++) if (!cl[`${c}-${n}`]) return { c, n };
  }
  return { c: CHAPTERS.length, n: STAGES_PER_CHAPTER };
}

register({
  id: 'home', tab: 'home', title: '主頁',
  mount(el) {
    setBgTheme('default');
    let blinkTimer = 0, talkTimer = 0, lineIdx = 0;
    // the painted secretary as a live, touchable figure (WebGL mesh); the <img> stays as the fallback
    let live = null, liveKey = '', liveCanvas = null, destroyed = false;
    const mountLive = async () => {
      const wrap = el.querySelector('.sec-wrap');
      const sec = HERO_MAP[S.d.profile.secretary] || HERO_MAP.pebble;
      const art = heroArt(sec.id, (S.d.heroes[sec.id] || {}).skin);
      if (!wrap || !art || S.d.settings.fx === 'low') return;
      if (live && liveKey === art.url) { wrap.appendChild(liveCanvas); wrap.classList.add('live'); return; }
      if (live) { live.destroy(); live = null; }
      liveKey = art.url;
      liveCanvas = document.createElement('canvas');
      liveCanvas.className = 'sec-live';
      wrap.appendChild(liveCanvas);
      const rim = parseInt(((PAL[sec.element] || PAL.light)[1]).slice(1), 16);
      const f = await LiveFigure.create(liveCanvas, { url: art.url, face: art.face, rim });
      if (!f) return;
      if (destroyed || liveKey !== art.url) { f.destroy(); return; }
      live = f;
      live.onTap = (part) => talk(part);
      if (__DEV__) window.__lxLive = live;
      const w2 = el.querySelector('.sec-wrap');
      if (w2) { if (liveCanvas.parentNode !== w2) w2.appendChild(liveCanvas); w2.classList.add('live'); }
    };
    const render = () => {
      const d = S.d;
      const sec = HERO_MAP[d.profile.secretary] || HERO_MAP.pebble;
      const st = d.heroes[sec.id] || {};
      const b = badges();
      const due = dueItems(d.learn).length;
      const mist = mistakeItems(d.learn).length;
      const streak = studyStreak();
      const cnt = counts(d.learn);
      const ns = nextStage();
      const ch = CHAPTERS[ns.c - 1];
      const feat = HERO_MAP[featuredHero()];
      const dailyLeft = dailyState().filter((x) => !x.claimed).length;
      const painted = heroArt(sec.id, st.skin);
      el.innerHTML = `<div class="home ${painted ? 'painted' : ''}">
<div class="home-stage">
  <div class="home-glow el-${sec.element}"></div>
  <div class="home-rays el-${sec.element}"></div>
  <div class="sec-wrap" data-act="talk">
    <img class="sec" src="${heroImageURL(sec, { skin: st.skin })}" alt="">
    ${painted ? '' : `<img class="sec blink" src="${heroImageURL(sec, { skin: st.skin, expr: 'blink' })}" alt="">
    <img class="sec happy" src="${heroImageURL(sec, { skin: st.skin, expr: 'happy' })}" alt="">`}
  </div>
  <div class="bubble"><div class="bb-en"></div><div class="bb-zh"></div></div>
  <div class="sec-plate"><small>${esc(sec.title)}</small><b>${esc(sec.zh)}</b><span class="en-title">${esc(sec.name)}</span></div>
</div>
<div class="home-left">
  <button class="side-b" data-act="missions">${icon('scroll')}<span>任務</span>${b.missions ? '<i class="dot"></i>' : ''}</button>
  <button class="side-b" data-act="login">${icon('calendar')}<span>簽到</span>${!d.login.claimedToday ? '<i class="dot"></i>' : ''}</button>
  <button class="side-b" data-act="mail">${icon('mail')}<span>信箱</span>${d.mail.length ? `<i class="dot n">${d.mail.length}</i>` : ''}</button>
  <button class="side-b" data-act="secretary">${icon('heroes')}<span>秘書</span></button>
</div>
<div class="home-right">
  <button class="banner b-gacha" data-act="gacha"><img src="${heroImageURL(feat, { crop: 'bust' })}" alt=""><div><small>精選召喚</small><b>${esc(feat.zh)}</b><span>本週限定 UP</span></div></button>
  <button class="banner b-raid" data-act="raid"><div><small>每週首領</small><b>深淵討伐</b><span>累積傷害領大獎</span></div>${icon('dragon')}</button>
  <button class="banner b-pass" data-act="pass"><div><small>學習通行證</small><b>Lv.${Math.min(50, Math.floor(d.pass.points / 100))}</b><span>答題即可升級</span></div>${icon('pass')}</button>
</div>
<div class="home-bottom">
  <div class="study-card panel ornate">
    <div class="sc-l"><div class="sc-big">${due}</div><small>到期複習</small></div>
    <div class="sc-m"><div class="sc-stats"><span>${icon('flame')}連續 <b>${streak}</b> 天</span><span>${icon('bookmark')}錯題 <b>${mist}</b></span></div><div class="dim sc-sub">掌握 ${cnt.mastered} · 學習中 ${cnt.learned} · 任務剩 ${dailyLeft}</div></div>
    <button class="btn primary small" data-act="review">${due + mist ? '開始複習' : '去學習'}</button>
  </div>
  <button class="adv-btn" data-act="adventure"><div class="ab-bg bg-${ch.bg}"${sceneStyle(ch.bg, 'center 65%')}></div><div class="ab-t"><small>繼續冒險 · 第 ${ns.c} 章</small><b>${esc(ch.zh)}</b><span>${ns.c}-${ns.n}${ns.n === 10 ? ' · 首領戰' : ns.n === 5 ? ' · 菁英' : ''}</span></div><div class="ab-go">出擊</div></button>
</div>
</div>`;
    };
    render();
    mountLive();

    const blink = () => {
      const img = el.querySelector('.sec.blink');
      if (img && !el.querySelector('.sec-wrap.talking')) {
        img.classList.add('on');
        setTimeout(() => img.classList.remove('on'), 130);
      }
      blinkTimer = setTimeout(blink, 2500 + Math.random() * 3000);
    };
    blinkTimer = setTimeout(blink, 1800);

    const talk = (part) => {
      if (live && typeof part !== 'string') {
        if (performance.now() - (live.tapAt || 0) < 700) return; // already handled by the figure's own pointerdown
        live.react('body');
      }
      const sec = HERO_MAP[S.d.profile.secretary] || HERO_MAP.pebble;
      const lines = sec.lines;
      const [en, zh] = lines[lineIdx++ % lines.length];
      const wrap = el.querySelector('.sec-wrap');
      const bub = el.querySelector('.bubble');
      if (!wrap || !bub) return;
      bub.querySelector('.bb-en').textContent = en;
      bub.querySelector('.bb-zh').textContent = zh;
      bub.classList.remove('show');
      void bub.offsetWidth;
      bub.classList.add('show');
      wrap.classList.add('talking', 'bounce');
      setTimeout(() => wrap.classList.remove('bounce'), 400);
      clearTimeout(talkTimer);
      talkTimer = setTimeout(() => { wrap.classList.remove('talking'); bub.classList.remove('show'); }, 4200);
      speak(en);
      sfx('tap');
    };

    bindActions(el, {
      talk,
      missions: () => go('missions'),
      mail: () => go('mail'),
      login: () => showLogin(),
      secretary: () => go('heroes', { pickSecretary: true }),
      gacha: () => go('shop', { tab: 'summon' }),
      raid: () => go('raid'),
      pass: () => go('shop', { tab: 'pass' }),
      review: () => go('study'),
      adventure: () => go('campaign'),
    });

    // first visit of the day: show the login calendar
    const loginTimer = S.d.login.claimedToday ? 0 : setTimeout(showLogin, 500);

    return {
      refresh: () => { render(); mountLive(); },
      destroy() { destroyed = true; clearTimeout(blinkTimer); clearTimeout(talkTimer); clearTimeout(loginTimer); if (live) live.destroy(); live = null; },
    };
  },
});

export function showLogin() {
  const st = loginCalendarState();
  const body = h(`<div class="login-cal">${LOGIN_CAL.map((r, i) => {
    const k = Object.keys(r)[0];
    const done = i < st.day || (i === st.day && st.claimedToday);
    const today = i === st.day && !st.claimedToday;
    return `<div class="lc ${done ? 'done' : ''} ${today ? 'today' : ''}"><small>第${i + 1}天</small>${rewardList([{ k, n: r[k] }])}${done ? `<i class="lc-ok">${icon('check')}</i>` : ''}</div>`;
  }).join('')}</div>`);
  modal({
    title: '每日簽到', body, cls: 'wide',
    buttons: st.claimedToday ? [{ label: '明天再來', value: null }] : [{ label: '領取今日獎勵', cls: 'primary', value: 'claim' }],
  }).then((v) => {
    if (v !== 'claim') return;
    const got = claimLogin();
    if (got) {
      sfx('reward');
      changed('login');
      modal({ title: '簽到成功！', body: rewardList(got, { big: true }), buttons: [{ label: '太棒了', cls: 'primary', value: 1 }] });
    }
  });
  void grantMail; void toast;
}
