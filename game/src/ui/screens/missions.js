// Missions: daily, weekly and achievements.
import { register, modal } from '../app.js';
import { bindActions, esc } from '../dom.js';
import { changed } from '../../core/state.js';
import { dailyState, weeklyState, achievementState, claimDaily, claimWeekly, claimAchievement, dailyBonusReady, DAILY_BONUS, syncCounters } from '../../core/missions.js';
import { rewardList, bar } from '../widgets.js';
import { sfx } from '../sound.js';
import { mergeRewards } from './mail.js';

const rlist = (r) => Object.entries(r).filter(([, n]) => n).map(([k, n]) => ({ k, n }));

register({
  id: 'missions', tab: 'home', title: '任務',
  mount(el, params) {
    let tab = params.tab || 'daily';
    syncCounters();
    const row = (x, kind) => `<div class="mission ${x.claimed ? 'claimed' : x.done ? 'ready' : ''}">
<div class="grow"><div class="ms-t">${esc(x.zh)}</div>${bar(x.prog / x.need, x.done ? 'green' : '')}<div class="dim">${Math.min(x.prog, x.need)} / ${x.need}</div></div>
<div class="ms-r">${rewardList(rlist(x.reward))}</div>
<button class="btn small ${x.done && !x.claimed ? 'primary' : ''}" data-act="claim" data-kind="${kind}" data-id="${x.id}" ${x.done && !x.claimed ? '' : 'disabled'}>${x.claimed ? '已領取' : x.done ? '領取' : '未完成'}</button></div>`;
    const render = () => {
      let body = '';
      if (tab === 'daily') {
        const list = dailyState();
        const all = list.filter((x) => x.claimed).length;
        body = `<div class="panel ornate daily-bonus"><div class="row"><div class="grow"><b>完成全部每日任務</b><div class="dim">${all} / ${list.length}</div>${bar(all / list.length)}</div>${rewardList(rlist(DAILY_BONUS))}
<button class="btn small ${dailyBonusReady() ? 'primary' : ''}" data-act="claim" data-kind="bonus" data-id="bonus" ${dailyBonusReady() ? '' : 'disabled'}>領取</button></div></div>
<div class="panel">${list.map((x) => row(x, 'daily')).join('')}</div>`;
      } else if (tab === 'weekly') {
        body = `<div class="panel">${weeklyState().map((x) => row(x, 'weekly')).join('')}</div>`;
      } else {
        body = `<div class="panel">${achievementState().map((a) => `<div class="mission ${a.done ? 'claimed' : a.ready ? 'ready' : ''}">
<div class="grow"><div class="ms-t">🏆 ${esc(a.zh)} ${a.done ? '（完成）' : `· 第 ${a.tier + 1} 階`}</div><div class="dim">${esc(a.text)}</div>${bar(a.v / a.need, a.ready ? 'green' : '')}<div class="dim">${Math.min(a.v, a.need)} / ${a.need}</div></div>
<div class="ms-r">${a.done ? '' : rewardList([{ k: 'gems', n: a.gemsNow }])}</div>
<button class="btn small ${a.ready ? 'primary' : ''}" data-act="claim" data-kind="ach" data-id="${a.id}" ${a.ready ? '' : 'disabled'}>${a.done ? '完成' : a.ready ? '領取' : '進行中'}</button></div>`).join('')}</div>`;
      }
      el.innerHTML = `<div class="pad"><div class="tabs">
<button class="tab-b ${tab === 'daily' ? 'on' : ''}" data-act="tab" data-t="daily">每日</button>
<button class="tab-b ${tab === 'weekly' ? 'on' : ''}" data-act="tab" data-t="weekly">每週</button>
<button class="tab-b ${tab === 'ach' ? 'on' : ''}" data-act="tab" data-t="ach">成就</button>
<button class="btn small primary" style="margin-left:auto" data-act="all">一鍵領取</button></div>${body}</div>`;
    };
    render();
    const claimOne = (kind, id) => (kind === 'daily' || kind === 'bonus' ? claimDaily(id) : kind === 'weekly' ? claimWeekly(id) : claimAchievement(id));
    bindActions(el, {
      tab: (b) => { tab = b.dataset.t; sfx('tab'); render(); },
      claim: (b) => {
        const got = claimOne(b.dataset.kind, b.dataset.id);
        if (!got) return;
        sfx('reward');
        changed('missions');
        modal({ title: '獲得獎勵', body: rewardList(got, { big: true }), buttons: [{ label: '好', cls: 'primary', value: 1 }] });
      },
      all: () => {
        const got = [];
        for (const x of dailyState()) if (x.done && !x.claimed) got.push(...(claimDaily(x.id) || []));
        if (dailyBonusReady()) got.push(...(claimDaily('bonus') || []));
        for (const x of weeklyState()) if (x.done && !x.claimed) got.push(...(claimWeekly(x.id) || []));
        for (let k = 0; k < 20; k++) { const a = achievementState().find((y) => y.ready); if (!a) break; got.push(...(claimAchievement(a.id) || [])); }
        if (!got.length) return;
        sfx('reward');
        changed('missions');
        modal({ title: '獲得獎勵', body: rewardList(mergeRewards(got), { big: true }), buttons: [{ label: '好', cls: 'primary', value: 1 }] });
      },
    });
    return { refresh: render };
  },
});
