// Battle results: stars, rewards, hero EXP, level-ups and the mistake review (learning reinforcement).
import { register, replace, go, back, modal, current } from '../app.js';
import { bindActions, esc } from '../dom.js';
import { icon } from '../../art/icons.js';
import { heroImageURL } from '../../art/hero.js';
import { heroArt } from '../../art/assets.js';
import { HERO_MAP } from '../../core/data/heroes.js';
import { S } from '../../core/state.js';
import { heroExpToNext } from '../../core/economy.js';
import { rewardList, bar, gearChip } from '../widgets.js';
import { speak, sfx, music } from '../sound.js';
import { fmt } from '../../core/util.js';
import { mergeRewards } from './mail.js';
import { playStory } from '../story.js';
import { STORY } from '../../core/data/story.js';

register({
  id: 'results', tab: 'adventure', chrome: false, title: '戰鬥結果',
  mount(el, { setup, summary, result }) {
    music('menu');
    const R = result || {};
    const win = summary.win;
    const acc = summary.answered ? Math.round((summary.correct / summary.answered) * 100) : 0;
    const stars = R.stars || 0;
    const list = mergeRewards(R.list || []).filter((x) => x.k === 'gear' || x.k === 'hero' || x.k === 'shard' || x.n);
    const gear = list.filter((x) => x.k === 'gear');
    const other = list.filter((x) => x.k !== 'gear');
    const heroRows = (R.team || []).map((id) => {
      const st = S.d.heroes[id];
      const up = R.heroUps && R.heroUps[id];
      return `<div class="rs-hero"><img src="${heroImageURL(HERO_MAP[id], { crop: 'face', skin: st.skin })}"><div class="grow"><div class="row"><b>${esc(HERO_MAP[id].zh)}</b><span class="dim">Lv.${st.lv}</span>${up && up.ups ? `<span class="lvup">升級！</span>` : ''}</div>${bar(st.exp / heroExpToNext(st.lv), 'blue')}</div><span class="dim">+${fmt(R.heroExp || 0)}</span></div>`;
    }).join('');
    // MVP: most damage + healing among the player's heroes; shown large on a win with a voiced line
    const mvpU = win ? (summary.units || []).filter((u) => HERO_MAP[u.key]).sort((a, b) => (b.dmg + b.heal * 0.8) - (a.dmg + a.heal * 0.8))[0] : null;
    const mvp = mvpU && HERO_MAP[mvpU.key];
    const mvpSkin = mvp && S.d.heroes[mvp.id] && S.d.heroes[mvp.id].skin;
    const mvpPainted = mvp && heroArt(mvp.id, mvpSkin);
    const mvpLine = mvp ? mvp.lines[1 % mvp.lines.length] : null;
    const pl = R.playerLevel;
    const mistakes = summary.mistakes || [];
    el.innerHTML = `<div class="results ${win ? 'win' : 'lose'}">
<div class="rs-head ${mvpPainted ? 'has-mvp' : ''}">
  ${mvpPainted ? `<div class="rs-mvp"><img src="${heroImageURL(mvp, { skin: mvpSkin })}" alt=""><span class="rs-mvp-tag">最佳</span><div class="rs-mvp-line"><b>${esc(mvpLine[0])}</b><small>${esc(mvpLine[1])}</small></div></div>` : ''}
  <div class="rs-title">${win ? (setup.raid ? '討伐完成' : '勝利') : summary.draw ? '平手' : '敗北'}</div>
  ${setup.raid ? `<div class="rs-raid">本次傷害 <b>${fmt(R.raidDamage || 0)}</b></div>` : `<div class="rs-stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}" style="animation-delay:${0.3 + i * 0.25}s">${icon('star')}</i>`).join('')}</div>`}
  <div class="rs-stage">${esc(setup.title || '')}</div>
  ${R.firstClear ? '<div class="rs-first">首次通關獎勵！</div>' : ''}${R.chapterClear ? `<div class="rs-first">第 ${R.chapterClear} 章 完全攻略！</div>` : ''}
</div>
<div class="pad">
<div class="panel rs-stats">
  <div><small>答對</small><b>${summary.correct}<span>/${summary.answered}</span></b></div>
  <div><small>正確率</small><b class="${acc >= 80 ? 'good' : ''}">${acc}%</b></div>
  <div><small>最高連擊</small><b>${summary.maxCombo}</b></div>
  <div><small>完美</small><b>${summary.perfect}</b></div>
</div>
${!setup.raid && win ? `<div class="star-rules dim"><span class="${stars >= 1 ? 'ok' : ''}">★ 通關</span><span class="${summary.deaths === 0 ? 'ok' : ''}">★ 無人倒下</span><span class="${acc >= 80 ? 'ok' : ''}">★ 正確率 80%</span></div>` : ''}
${pl && pl.ups ? `<div class="panel ornate center rs-plv">玩家等級提升至 <b class="gold-text">Lv.${pl.level}</b>！角色等級上限提高，並獲得魔晶石</div>` : ''}
${R.merchant ? `<div class="panel center rs-merchant" data-act="merchant">${icon('merchant')} 神秘商人出現了！（1 小時內有效）點此前往</div>` : ''}
<div class="sec-title">獲得獎勵</div>
<div class="panel">${rewardList(other, { big: true })}${gear.length ? `<div class="rewards" style="margin-top:8px">${gear.map((g) => gearChip(g.g)).join('')}</div>` : ''}</div>
${heroRows ? `<div class="sec-title">角色經驗</div><div class="panel">${heroRows}</div>` : ''}
${mistakes.length ? `<div class="sec-title">本場錯題複習 <span class="more">已加入錯題本</span></div><div class="panel">${mistakes.map((q, i) => `<div class="rs-miss"><div class="row"><div class="grow"><div class="rm-q">${esc(q.main || q.sentence || '')}</div><div class="rm-a">✔ ${esc(q.options[q.answer])}</div></div>${q.speak ? `<button class="mini-say" data-act="say" data-i="${i}">${icon('speaker')}</button>` : ''}</div>${(q.reveal || []).slice(0, 2).map((r) => `<div class="dim">${esc(r)}</div>`).join('')}${q.explain ? `<div class="rm-ex">${esc(q.explain)}</div>` : ''}</div>`).join('')}</div>` : summary.answered ? '<div class="panel center good-msg">全部答對！太厲害了！</div>' : ''}
<div class="rs-btns">
  <button class="btn" data-act="home">返回</button>
  ${setup.retry ? '<button class="btn blue" data-act="retry">再戰一次</button>' : ''}
  ${win && setup.next ? '<button class="btn primary" data-act="next">下一關</button>' : ''}
</div>
</div></div>`;
    sfx(win ? 'reward' : 'tap');
    if (mvpPainted && S.d.settings.tts) setTimeout(() => speak(mvpLine[0]), 700);
    if (R.chapterClear === 12) setTimeout(() => playStory(STORY.ending, { bg: 'tower', title: '終章　詞語回歸之日' }), 1600);
    bindActions(el, {
      home: () => back(),
      retry: () => replace('battle', setup.retry()),
      next: () => { const n = setup.next(); if (n) replace('battle', n); else back(); },
      say: (b) => speak(mistakes[+b.dataset.i].speak, { force: true }),
      merchant: () => go('shop', { tab: 'merchant' }),
    });
    void modal; void current;
    return {};
  },
});
