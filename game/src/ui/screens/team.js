// Team formation: 4 slots (front row 0-1, back row 2-3). Tap a roster hero to add/remove, tap two
// slots to swap them. Used for campaign (pve), online/practice duels (pvp) and arena defense.
import { register, back, toast } from '../app.js';
import { bindActions, esc } from '../dom.js';
import { HERO_MAP } from '../../core/data/heroes.js';
import { ROLES } from '../../core/data/elements.js';
import { S, changed } from '../../core/state.js';
import { heroCard, heroPower, teamPower } from '../widgets.js';
import { icon, roleIcon } from '../../art/icons.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../sound.js';

const MODE_ZH = { pve: '冒險隊伍', pvp: '對戰隊伍', arena: '競技場防守隊伍' };

export function autoTeam(n = 4) {
  const ids = Object.keys(S.d.heroes).sort((a, b) => heroPower(b) - heroPower(a));
  const pick = [];
  const want = ['guardian', 'healer'];
  for (const r of want) {
    const h = ids.find((id) => HERO_MAP[id].role === r && !pick.includes(id));
    if (h) pick.push(h);
  }
  for (const id of ids) if (pick.length < n && !pick.includes(id)) pick.push(id);
  return arrange(pick.slice(0, n));
}

/** Front-liners first: guardians and strikers take slots 0-1. */
export function arrange(ids) {
  const front = ids.filter((id) => ROLES[HERO_MAP[id].role].row === 'front');
  const backRow = ids.filter((id) => ROLES[HERO_MAP[id].role].row !== 'front');
  const out = [...front, ...backRow];
  // keep at least someone in front
  return out;
}

register({
  id: 'team', tab: 'heroes', title: (p) => MODE_ZH[p.mode || 'pve'] || '編隊',
  mount(el, params) {
    const mode = params.mode || 'pve';
    let team = (S.d.team[mode] || []).filter((id) => S.d.heroes[id]).slice(0, 4);
    if (params.add && S.d.heroes[params.add] && !team.includes(params.add)) {
      if (team.length < 4) team.push(params.add);
      else team[3] = params.add;
    }
    let swapFrom = -1;
    const save = () => { S.d.team[mode] = team.slice(); changed('team'); };
    save();

    const render = () => {
      const roles = new Set(team.map((id) => HERO_MAP[id].role));
      const hints = [];
      if (!roles.has('guardian')) hints.push('沒有「守護」：前排容易被擊倒');
      if (!roles.has('healer')) hints.push('沒有「治癒」：長期戰較吃力');
      if (team.length < 4) hints.push(`還有 ${4 - team.length} 個空位`);
      const slot = (i) => {
        const id = team[i];
        return `<button class="tslot ${swapFrom === i ? 'swap' : ''}" data-act="slot" data-i="${i}">${id ? heroCard(id, { st: S.d.heroes[id], name: true }) : `<div class="ts-empty">${icon('plus')}</div>`}<span class="ts-pos">${i < 2 ? '前排' : '後排'}</span></button>`;
      };
      const owned = Object.keys(S.d.heroes).sort((a, b) => heroPower(b) - heroPower(a));
      el.innerHTML = `<div class="pad">
<div class="panel ornate formation">
  <div class="row"><b class="grow">${MODE_ZH[mode]}</b><span class="dim">戰力</span><b class="gold-text" style="font-size:18px">${fmt(teamPower(team))}</b></div>
  <div class="form-rows"><div class="form-row back"><small>後排</small>${slot(2)}${slot(3)}</div><div class="form-row front"><small>前排</small>${slot(0)}${slot(1)}</div></div>
  <div class="dim center">${swapFrom >= 0 ? '點選另一個位置交換' : '點選位置可交換站位；敵人會優先攻擊前排'}</div>
  ${hints.length ? `<div class="hints">${hints.map((x) => `<span>${icon('info')} ${x}</span>`).join('')}</div>` : ''}
  <div class="row" style="margin-top:8px"><button class="btn small grow" data-act="auto">自動編隊</button><button class="btn small grow" data-act="clear">清空</button>${params.done ? `<button class="btn small primary grow" data-act="done">確定</button>` : ''}</div>
</div>
<div class="sec-title">選擇角色 <span class="more">點擊加入／移出</span></div>
<div class="hero-grid">${owned.map((id) => heroCard(id, { st: S.d.heroes[id], act: 'pick', sel: team.includes(id), extra: team.includes(id) ? `<span class="sel-n">${team.indexOf(id) + 1}</span>` : '' })).join('')}</div>
<div class="role-legend">${Object.values(ROLES).map((r) => `<span>${roleIcon(r.id)}${r.zh}：${esc(r.desc)}</span>`).join('')}</div>
</div>`;
    };
    render();
    bindActions(el, {
      pick: (b) => {
        const id = b.dataset.id;
        const i = team.indexOf(id);
        if (i >= 0) team.splice(i, 1);
        else if (team.length < 4) team.push(id);
        else { toast('隊伍已滿（4 人）', 'bad'); return; }
        swapFrom = -1;
        sfx('tap');
        save();
        render();
      },
      slot: (b) => {
        const i = +b.dataset.i;
        if (swapFrom < 0) { swapFrom = i; sfx('tap'); render(); return; }
        if (swapFrom !== i) {
          const a = team[swapFrom], c = team[i];
          const arr = [team[0], team[1], team[2], team[3]];
          arr[swapFrom] = c; arr[i] = a;
          team = arr.filter(Boolean);
          // keep explicit positions: compact but preserve order of filled slots
          save();
        }
        swapFrom = -1;
        sfx('equip');
        render();
      },
      auto: () => { team = autoTeam(); save(); sfx('equip'); render(); },
      clear: () => { team = []; save(); render(); },
      done: () => { if (!team.length) { toast('至少需要 1 位角色', 'bad'); return; } back(); },
    });
    return { refresh: render };
  },
});
