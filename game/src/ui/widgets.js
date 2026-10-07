// Reusable UI fragments (HTML strings).
import { esc } from './dom.js';
import { icon, elemIcon, roleIcon, itemIcon } from '../art/icons.js';
import { heroImageURL } from '../art/hero.js';
import { HERO_MAP } from '../core/data/heroes.js';
import { ELEMENTS, ROLES } from '../core/data/elements.js';
import { ITEMS, CURRENCY, GEAR_RARITY, SLOT_INFO } from '../core/data/items.js';
import { fmt } from '../core/util.js';
import { heroStats, power, STAT_ZH, fmtStat, gearStats } from '../core/stats.js';
import { S, gearById } from '../core/state.js';

export function stars(n, max = 0) {
  let s = '';
  for (let i = 0; i < Math.max(n, max); i++) s += `<i class="st ${i < n ? 'on' : ''} ${i >= 5 ? 'aw' : ''}">${icon('star')}</i>`;
  return `<span class="stars">${s}</span>`;
}

export function elemChip(el) {
  const e = ELEMENTS[el];
  return `<span class="chip el-${el}">${elemIcon(el)}${e.zh}</span>`;
}

export function roleChip(role) {
  return `<span class="chip role">${roleIcon(role)}${ROLES[role].zh}</span>`;
}

/** Square hero card. opts: { st (hero state), lv, star, owned, act, name, small, sel, extra } */
export function heroCard(id, o = {}) {
  const def = HERO_MAP[id];
  const st = o.st;
  const owned = o.owned !== false && !!st;
  const star = st ? st.star : o.star || 0;
  const lv = st ? st.lv : o.lv;
  return `<div class="hcard r-${def.rarity} el-${def.element} ${owned ? '' : 'locked'} ${o.small ? 'small' : ''} ${o.sel ? 'sel' : ''}" ${o.act ? `data-act="${o.act}" data-id="${id}"` : ''}>
<div class="hc-in"><img loading="lazy" src="${heroImageURL(def, { crop: 'bust', skin: st && st.skin })}" alt="">
<span class="hc-el">${elemIcon(def.element)}</span><span class="hc-role">${roleIcon(def.role)}</span>
${owned ? `<span class="hc-lv">Lv.${lv}</span>` : ''}${star ? `<span class="hc-stars">${stars(star)}</span>` : ''}
${o.extra || ''}</div>${o.name !== false ? `<div class="hc-name">${esc(def.zh)}</div>` : ''}</div>`;
}

export function heroPower(id) {
  const st = S.d.heroes[id];
  if (!st) return 0;
  return power(heroStats(HERO_MAP[id], st, gearById()));
}

export function teamPower(ids) {
  return ids.reduce((a, id) => a + heroPower(id), 0);
}

export function rewardList(list, { big = false } = {}) {
  return `<div class="rewards ${big ? 'big' : ''}">${list.map(rewardChip).join('')}</div>`;
}

export function rewardChip(r) {
  if (r.k === 'gear') return gearChip(r.g);
  if (r.k === 'shard') {
    const def = HERO_MAP[r.id];
    return `<div class="rw shard r-${def.rarity}"><img src="${heroImageURL(def, { crop: 'face' })}"><b>×${r.n}</b><small>${esc(def.zh)}碎片</small></div>`;
  }
  if (r.k === 'hero') {
    const def = HERO_MAP[r.id];
    return `<div class="rw hero r-${def.rarity}"><img src="${heroImageURL(def, { crop: 'face' })}"><small>${esc(def.zh)}${r.dupe ? '→碎片' : ''}</small></div>`;
  }
  if (r.k === 'heroExp') return `<div class="rw"><span class="ic-wrap">${icon('heroes')}</span><b>+${fmt(r.n)}</b><small>角色經驗</small></div>`;
  if (r.k === 'playerExp') return `<div class="rw"><span class="ic-wrap">${icon('star')}</span><b>+${fmt(r.n)}</b><small>玩家經驗</small></div>`;
  const name = CURRENCY[r.k] ? CURRENCY[r.k].zh : ITEMS[r.k] ? ITEMS[r.k].zh : r.k;
  return `<div class="rw"><span class="ic-wrap">${itemIcon(r.k, ITEMS)}</span><b>${r.n > 0 ? '×' : ''}${fmt(r.n)}</b><small>${esc(name)}</small></div>`;
}

export function gearChip(g, o = {}) {
  const R = GEAR_RARITY[g.rarity];
  return `<div class="rw gear g-${R.id} ${o.sel ? 'sel' : ''}" ${o.act ? `data-act="${o.act}" data-uid="${g.uid}"` : ''} style="--gc:${R.color}">
<span class="ic-wrap">${icon(SLOT_INFO[g.slot].icon)}</span>${g.lvl ? `<b class="g-lvl">+${g.lvl}</b>` : ''}<small>${esc(g.name)}</small>${o.owner ? `<img class="g-owner" src="${heroImageURL(HERO_MAP[o.owner], { crop: 'face' })}">` : ''}</div>`;
}

export function gearLines(g) {
  return gearStats(g).map((s, i) => `<div class="gl ${i === 0 ? 'main' : ''}"><span>${STAT_ZH[s.k]}</span><b>${fmtStat(s.k, s.v)}</b></div>`).join('');
}

export function costLabel(cost) {
  return Object.entries(cost).filter(([, v]) => v).map(([k, v]) => {
    const have = k in S.d.cur ? S.d.cur[k] : S.d.items[k] || 0;
    return `<span class="cost ${have < v ? 'short' : ''}">${itemIcon(k, ITEMS)}${fmt(v)}</span>`;
  }).join('');
}

export function bar(frac, cls = '') {
  return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(1, frac)) * 100}%"></i></div>`;
}

export function emptyState(text) {
  return `<div class="empty">${text}</div>`;
}
