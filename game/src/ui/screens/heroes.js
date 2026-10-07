// Hero roster: owned heroes first (sortable / filterable), then the ones still to be collected.
import { register, go, back, toast } from '../app.js';
import { bindActions } from '../dom.js';
import { HEROES, HERO_MAP } from '../../core/data/heroes.js';
import { ELEMENT_IDS, ELEMENTS, ROLE_IDS, ROLES, RARITY, STAR_COST } from '../../core/data/elements.js';
import { S, changed } from '../../core/state.js';
import { heroCard, heroPower } from '../widgets.js';
import { elemIcon, roleIcon, icon } from '../../art/icons.js';
import { setBgTheme } from '../../fx/bg.js';
import { sfx } from '../sound.js';

const SORTS = { power: '戰力', level: '等級', rarity: '稀有度', star: '星級' };
const view = { el: 'all', role: 'all', sort: 'power' };
const RANK = { SSR: 3, SR: 2, R: 1 };

register({
  id: 'heroes', tab: 'heroes', title: (p) => (p.pickSecretary ? '選擇秘書' : '角色'),
  mount(el, params) {
    setBgTheme('heroes');
    const render = () => {
      const d = S.d;
      const list = HEROES.filter((h) => (view.el === 'all' || h.element === view.el) && (view.role === 'all' || h.role === view.role));
      const owned = list.filter((h) => d.heroes[h.id]);
      const missing = list.filter((h) => !d.heroes[h.id]);
      const key = {
        power: (h) => heroPower(h.id), level: (h) => d.heroes[h.id].lv * 10 + RANK[h.rarity], rarity: (h) => RANK[h.rarity] * 1000 + d.heroes[h.id].star * 100 + d.heroes[h.id].lv,
        star: (h) => d.heroes[h.id].star * 1000 + RANK[h.rarity] * 100 + d.heroes[h.id].lv,
      }[view.sort];
      owned.sort((a, b) => key(b) - key(a));
      missing.sort((a, b) => RANK[b.rarity] - RANK[a.rarity]);
      const shardTag = (h) => {
        const n = d.shards[h.id] || 0;
        const need = STAR_COST[RARITY[h.rarity].stars] * 2;
        return n ? `<span class="hc-shard">${n}/${need}</span>` : '';
      };
      el.innerHTML = `<div class="pad">
${params.pickSecretary ? '<div class="panel center" style="margin-bottom:10px">選擇要在主頁陪伴你的角色</div>' : `<div class="row" style="margin-bottom:10px">
  <div class="grow"><b class="gold-text" style="font-size:18px">${Object.keys(d.heroes).length}</b><span class="dim"> / ${HEROES.length} 位詞靈</span></div>
  <button class="btn small" data-act="team">${icon('swords')}編隊</button>
</div>`}
<div class="filters">
  <div class="tabs">${['all', ...ELEMENT_IDS].map((e) => `<button class="tab-b fl ${view.el === e ? 'on' : ''}" data-act="el" data-v="${e}">${e === 'all' ? '全部' : elemIcon(e) + ELEMENTS[e].zh}</button>`).join('')}</div>
  <div class="tabs" style="margin-top:6px">${['all', ...ROLE_IDS].map((r) => `<button class="tab-b fl ${view.role === r ? 'on' : ''}" data-act="role" data-v="${r}">${r === 'all' ? '全部定位' : roleIcon(r) + ROLES[r].zh}</button>`).join('')}</div>
  <div class="tabs" style="margin-top:6px">${Object.entries(SORTS).map(([k, v]) => `<button class="tab-b fl ${view.sort === k ? 'on' : ''}" data-act="sort" data-v="${k}">依${v}</button>`).join('')}</div>
</div>
<div class="hero-grid" style="margin-top:12px">${owned.map((h) => heroCard(h.id, { st: d.heroes[h.id], act: 'open', sel: params.pickSecretary && d.profile.secretary === h.id })).join('')}</div>
${missing.length && !params.pickSecretary ? `<div class="sec-title">尚未締結契約</div><div class="hero-grid">${missing.map((h) => heroCard(h.id, { owned: false, act: 'open', extra: shardTag(h) })).join('')}</div>` : ''}
</div>`;
    };
    render();
    bindActions(el, {
      el: (b) => { view.el = b.dataset.v; sfx('tap'); render(); },
      role: (b) => { view.role = b.dataset.v; sfx('tap'); render(); },
      sort: (b) => { view.sort = b.dataset.v; sfx('tap'); render(); },
      team: () => go('team', { mode: 'pve' }),
      open: (b) => {
        const id = b.dataset.id;
        if (params.pickSecretary) {
          if (!S.d.heroes[id]) return;
          S.d.profile.secretary = id;
          S.d.profile.avatar = id;
          changed('profile');
          toast(`${HERO_MAP[id].zh} 成為你的秘書了！`, 'gold');
          back();
          return;
        }
        go('hero', { id, list: currentOrder() });
      },
    });
    const currentOrder = () => Array.from(el.querySelectorAll('.hcard[data-id]')).map((c) => c.dataset.id);
    return { refresh: render };
  },
});
