// Adventure hub (campaign, tower, dungeons, raid) and the campaign chapter map.
import { register, go, modal, toast } from '../app.js';
import { bindActions, esc, h } from '../dom.js';
import { icon, elemIcon } from '../../art/icons.js';
import { monsterImageURL } from '../../art/monster.js';
import { ENEMIES } from '../../core/data/enemies.js';
import { CHAPTERS, STAGES_PER_CHAPTER, buildStage } from '../../core/data/stages.js';
import { BOOKS } from '../../core/quiz/content.js';
import { S, grant, changed } from '../../core/state.js';
import { setBgTheme } from '../../fx/bg.js';
import { campaignSetup, sweepParams, SWEEP_Q, stageUnlocked, towerSetup, towerFloor, DUNGEONS, dungeonSetup, dungeonRunsLeft, raidState, raidSetup, raidTiers, RAID_BOSS, RAID_TICKETS, bookList } from '../battleSetup.js';
import { teamPower, rewardList } from '../widgets.js';
import { sceneStyle } from '../../art/assets.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../sound.js';
import { playStory } from '../story.js';
import { STORY } from '../../core/data/story.js';

const GLV = ['', '基礎', '進階', '精熟'];
export const tierText = (tier) => bookList().map((b) => `${BOOKS[b].zh.split(' ')[0]} ${BOOKS[b].levels[tier]}`).join('／');

function chapterStars(c) {
  let s = 0;
  for (let n = 1; n <= STAGES_PER_CHAPTER; n++) s += S.d.campaign.stars[`${c}-${n}`] || 0;
  return s;
}

function startBattle(setup) {
  if (!S.d.team.pve.filter((id) => S.d.heroes[id]).length) { toast('請先編組隊伍', 'bad'); go('team', { mode: 'pve' }); return; }
  sfx('battleStart');
  go('battle', setup);
}

register({
  id: 'adventure', tab: 'adventure', title: '冒險',
  mount(el) {
    setBgTheme('adventure');
    const render = () => {
      const d = S.d;
      let cleared = 0;
      for (const k in d.campaign.cleared) cleared++;
      const R = raidState();
      el.innerHTML = `<div class="pad adv">
<button class="adv-card main" data-act="campaign"><div class="ac-bg bg-plains"${sceneStyle('plains')}></div><div class="ac-t"><small>主線劇情</small><b>主線冒險</b><span>12 章 · 120 關　已通關 ${cleared} 關</span></div>${icon('adventure')}</button>
<div class="adv-grid">
<button class="adv-card" data-act="tower"><div class="ac-bg bg-tower"${sceneStyle('tower')}></div><div class="ac-t"><small>爬塔挑戰</small><b>試煉之塔</b><span>第 ${d.tower.floor} 層</span></div>${icon('tower')}</button>
<button class="adv-card" data-act="raid"><div class="ac-bg bg-battlefield"${sceneStyle('battlefield')}></div><div class="ac-t"><small>團隊討伐</small><b>每週首領</b><span>今日 ${RAID_TICKETS - (R.used || 0)}/${RAID_TICKETS} 次</span></div>${icon('dragon')}</button>
</div>
<div class="sec-title">每日地下城 <span class="more">每天各 2 次，午夜重置</span></div>
<div class="dun-list">${Object.entries(DUNGEONS).map(([id, D]) => `<button class="dun" data-act="dungeon" data-id="${id}"><div class="dun-ic">${icon(D.icon)}</div><div class="grow"><b>${D.zh}</b><div class="dim">${D.desc}</div></div><span class="dun-n">${dungeonRunsLeft(id)}/2</span></button>`).join('')}</div>
<div class="sec-title">隊伍</div>
<button class="panel row team-row" data-act="team"><div class="grow"><b>冒險隊伍</b><div class="dim">戰力 ${fmt(teamPower(d.team.pve))}</div></div>${icon('swords')}<span>編隊</span></button>
</div>`;
    };
    render();
    bindActions(el, {
      campaign: () => go('campaign'),
      tower: () => towerPrompt(),
      raid: () => go('raid'),
      dungeon: (b) => dungeonPrompt(b.dataset.id),
      team: () => go('team', { mode: 'pve' }),
    });
    return { refresh: render };
  },
});

function towerPrompt() {
  const f = S.d.tower.floor;
  const fl = towerFloor(f);
  const body = `<div class="center"><div class="tower-floor">第 <b>${f}</b> 層</div><p class="dim">${fl.kind === 'boss' ? '首領層' : fl.kind === 'elite' ? '菁英層' : '一般層'}　敵人等級 ${fl.lv}</p>
${enemyRow(fl.enemies)}<p class="dim">題目：${tierText(fl.tier)} 單字＋${GLV[fl.glv]}文法</p><p class="dim">首次通過：試煉徽章${f % 5 === 0 ? '＋魔晶石' : ''}${f % 10 === 0 ? '＋召喚券' : ''}</p><p class="dim">最高紀錄：第 ${S.d.tower.best || 0} 層</p></div>`;
  modal({ title: '試煉之塔', body, buttons: [{ label: '編隊', value: 'team' }, { label: '挑戰', cls: 'primary', value: 'go' }] }).then((v) => {
    if (v === 'team') go('team', { mode: 'pve' });
    if (v === 'go') startBattle(towerSetup(f));
  });
}

function dungeonPrompt(id) {
  const D = DUNGEONS[id];
  const left = dungeonRunsLeft(id);
  const body = `<div class="center"><p>${D.desc}</p><p class="dim">今日剩餘 ${left} 次（僅勝利時消耗）</p></div>`;
  modal({ title: D.zh, body, buttons: [1, 2, 3].map((k) => ({ label: ['', '普通', '困難', '地獄'][k], cls: k === 3 ? 'red' : k === 2 ? 'blue' : '', value: k })) }).then((v) => {
    if (!v) return;
    if (left <= 0) { toast('今天的次數已用完', 'bad'); return; }
    if (v === 3 && S.d.profile.level < 20) { toast('地獄難度需要玩家等級 20', 'bad'); return; }
    startBattle(dungeonSetup(id, v));
  });
}

export function enemyRow(enemies) {
  return `<div class="enemy-row">${enemies.map((e) => { const def = ENEMIES[e.id]; return `<div class="er ${e.boss ? 'boss' : ''}"><img src="${monsterImageURL(def.kind === 'queen' ? 'demon' : def.kind, e.element, { crown: !!def.crown, id: e.id })}">${elemIcon(e.element)}<small>${esc(def.zh)}</small></div>`; }).join('')}</div>`;
}

// ------------------------------------------------------------------ campaign map

let lastChapter = 0;
let storyPlaying = false;

register({
  id: 'campaign', tab: 'adventure', title: '主線冒險',
  mount(el) {
    setBgTheme('adventure');
    let c = lastChapter || (() => {
      for (let k = 1; k <= CHAPTERS.length; k++) if (!S.d.campaign.cleared[`${k}-${STAGES_PER_CHAPTER}`]) return k;
      return CHAPTERS.length;
    })();
    const render = () => {
      lastChapter = c;
      const ch = CHAPTERS[c - 1];
      const unlockedCh = c === 1 || !!S.d.campaign.cleared[`${c - 1}-${STAGES_PER_CHAPTER}`];
      const nodes = [];
      for (let n = 1; n <= STAGES_PER_CHAPTER; n++) {
        const key = `${c}-${n}`;
        const st = buildStage(c, n);
        const open = stageUnlocked(c, n);
        const stars = S.d.campaign.stars[key] || 0;
        const col = n % 2 ? 'l' : 'r';
        nodes.push(`<button class="node ${col} ${st.kind} ${open ? '' : 'locked'} ${S.d.campaign.cleared[key] ? 'clear' : ''}" data-act="stage" data-n="${n}">
<span class="nd-ring">${st.kind === 'boss' ? icon('dragon') : st.kind === 'elite' ? icon('swords') : `<b>${n}</b>`}</span>
<span class="nd-stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}">${icon('star')}</i>`).join('')}</span><small>${c}-${n}</small></button>`);
      }
      el.innerHTML = `<div class="camp">
<div class="camp-head bg-${ch.bg}"${sceneStyle(ch.bg, 'center 70%')}>
  <button class="ch-nav" data-act="prev" ${c <= 1 ? 'disabled' : ''}>${icon('back')}</button>
  <div class="grow center"><small class="kicker">第 ${c} 章</small><h2>${esc(ch.zh)}</h2><div class="dim">${tierText(ch.tier)} 單字 · ${GLV[ch.glv]}文法 · ★ ${chapterStars(c)}/30</div></div>
  <button class="ch-nav" data-act="next" ${c >= CHAPTERS.length ? 'disabled' : ''}>${icon('back', 'flip')}</button>
</div>
<p class="camp-story">${esc(ch.story)}${unlockedCh ? ` <button class="story-b" data-act="story">${icon('scroll')}劇情</button>` : ''}</p>
${unlockedCh ? `<div class="path">${nodes.join('')}</div>` : `<div class="panel center" style="margin:20px">${icon('lock')} 通關第 ${c - 1} 章首領後解鎖</div>`}
</div>`;
    };
    const playChapter = (k) => {
      if (storyPlaying) return Promise.resolve();
      storyPlaying = true;
      const ch = CHAPTERS[k - 1];
      return playStory(STORY[k] || [], { bg: ch.bg, boss: { id: ch.boss[0], element: ch.boss[1] }, title: `第 ${k} 章　${ch.zh}` }).finally(() => { storyPlaying = false; });
    };
    const autoStory = () => {
      const seen = (S.d.campaign.seen = S.d.campaign.seen || {});
      const unlocked = c === 1 || !!S.d.campaign.cleared[`${c - 1}-${STAGES_PER_CHAPTER}`];
      if (storyPlaying || !unlocked || seen[c] || !STORY[c]) return;
      const k = c;
      setTimeout(() => {
        if (c !== k || !el.isConnected || storyPlaying) return; // moved on: it plays next time
        seen[k] = true;
        changed('campaign');
        playChapter(k);
      }, 350);
    };
    render();
    autoStory();
    bindActions(el, {
      story: () => playChapter(c),
      prev: () => { if (c > 1) { c--; sfx('tab'); render(); autoStory(); } },
      next: () => { if (c < CHAPTERS.length) { c++; sfx('tab'); render(); autoStory(); } },
      stage: (b) => {
        const n = +b.dataset.n;
        if (!stageUnlocked(c, n)) { toast('請先通過前一關', 'bad'); return; }
        stagePrompt(c, n);
      },
    });
    return { refresh: render };
  },
});

function stagePrompt(c, n) {
  const st = buildStage(c, n);
  const key = `${c}-${n}`;
  const stars = S.d.campaign.stars[key] || 0;
  const cleared = !!S.d.campaign.cleared[key];
  const power = teamPower(S.d.team.pve);
  const rec = Math.round(Math.pow(st.level, 1.12) * 260 + 800);
  const body = h(`<div class="stage-info">
<div class="row"><b class="grow">${st.kind === 'boss' ? '<span class="kind-tag boss">首領</span>首領戰' : st.kind === 'elite' ? '<span class="kind-tag elite">菁英</span>菁英戰' : '一般戰鬥'}</b><span class="dim">敵人 Lv.${st.level}</span></div>
${enemyRow(st.enemies)}
<div class="si-row"><span>題目</span><b>${tierText(st.tier)} 單字＋${GLV[st.glv]}文法（文法 ${Math.round(st.grammarShare * 100)}%）</b></div>
<div class="si-row"><span>時間</span><b>${st.timeLimit} 秒</b></div>
<div class="si-row"><span>隊伍戰力</span><b class="${power >= rec ? 'good' : 'warnc'}">${fmt(power)}</b><span class="dim">建議 ${fmt(rec)}</span></div>
<div class="si-stars">${['通關', '無人倒下', '正確率 80%'].map((t, i) => `<span class="${i < stars ? 'ok' : ''}">${icon('star')}${t}</span>`).join('')}</div>
${st.kind === 'boss' ? '<div class="si-tip">首領蓄力時，限時內連續答對題目可以「打斷」它！</div>' : ''}
${!cleared ? `<div class="si-tip gold">首次通關：魔晶石 ×${st.kind === 'boss' ? 100 : st.kind === 'elite' ? 40 : 20}${n === 10 ? '＋章節獎勵 300 魔晶石' : ''}</div>` : ''}
<div class="si-tip">${stars >= 3 ? `已三星：可用「${SWEEP_Q} 題複習掃蕩」直接領取獎勵，答對越多拿越多！` : '三星通關後可解鎖「複習掃蕩」'}</div>
</div>`);
  const buttons = [{ label: '編隊', value: 'team' }];
  if (stars >= 3) buttons.push({ label: `掃蕩（${SWEEP_Q}題）`, cls: 'blue', value: 'sweep' });
  buttons.push({ label: '出擊！', cls: 'primary', value: 'go' });
  modal({ title: `${c}-${n} ${CHAPTERS[c - 1].zh}`, body, buttons }).then((v) => {
    if (v === 'team') go('team', { mode: 'pve' });
    if (v === 'go') startBattle(campaignSetup(c, n));
    if (v === 'sweep') { sfx('tap'); go('quiz', sweepParams(c, n)); }
  });
}

// ------------------------------------------------------------------ raid screen

register({
  id: 'raid', tab: 'adventure', title: '每週首領',
  mount(el) {
    setBgTheme('pvp');
    const render = () => {
      const R = raidState();
      {
        const tiers = raidTiers();
        el.innerHTML = `<div class="pad">
<div class="panel ornate center raid-head"><img src="${monsterImageURL('demon', 'dark', { id: 'demonGeneral' })}"><div><small class="kicker">每週首領</small><h2>${esc(RAID_BOSS.zh)}</h2><p class="dim">本週累積傷害越高，獎勵越豐厚。每天可挑戰 ${RAID_TICKETS} 次，首領不會倒下——盡情輸出吧！</p></div></div>
<div class="panel"><div class="row"><div class="grow"><small class="dim">本週累積傷害</small><div class="raid-total">${fmt(R.total)}</div></div><div><small class="dim">單場最高</small><div><b>${fmt(R.best)}</b></div></div></div></div>
<div class="sec-title">累積獎勵</div>
<div class="panel">${tiers.map((t, i) => { const done = R.total >= t.need; const claimed = R.claimed.includes(i); return `<div class="mission ${claimed ? 'claimed' : done ? 'ready' : ''}"><div class="grow"><b>第 ${i + 1} 階 · ${fmt(t.need)}</b></div><div class="ms-r">${rewardList(Object.entries(t.reward).map(([k, n]) => ({ k, n })))}</div><button class="btn small ${done && !claimed ? 'primary' : ''}" data-act="claim" data-i="${i}" ${done && !claimed ? '' : 'disabled'}>${claimed ? '已領' : '領取'}</button></div>`; }).join('')}</div>
<button class="btn primary big block" data-act="go" ${R.used >= RAID_TICKETS ? 'disabled' : ''}>挑戰（今日剩 ${RAID_TICKETS - (R.used || 0)} 次）</button>
</div>`;
      }
    };
    render();
    bindActions(el, {
      go: () => startBattle(raidSetup()),
      claim: (b) => {
        const i = +b.dataset.i;
        const R = raidState();
        const t = raidTiers()[i];
        if (R.total < t.need || R.claimed.includes(i)) return;
        R.claimed.push(i);
        const got = grant(t.reward);
        changed('raid');
        sfx('reward');
        modal({ title: '獲得獎勵', body: rewardList(got, { big: true }), buttons: [{ label: '好', cls: 'primary', value: 1 }] });
      },
    });
    return { refresh: render };
  },
});
