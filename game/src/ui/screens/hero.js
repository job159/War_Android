// Hero detail: growth (level / potions), skills, gear, stars, bond & stories, profile word card, skins.
import { register, go, modal, toast, confirmBox } from '../app.js';
import { bindActions, esc, h } from '../dom.js';
import { icon, elemIcon } from '../../art/icons.js';
import { heroImageURL } from '../../art/hero.js';
import { HERO_MAP } from '../../core/data/heroes.js';
import { ELEMENTS, ROLES, RARITY, STAR_MULT, maxStarFor, weakAgainst, strongAgainst } from '../../core/data/elements.js';
import { ITEMS, GEAR_SLOTS, SLOT_INFO, GEAR_RARITY } from '../../core/data/items.js';
import { S, changed, addHeroExp, heroExpToCap, item, upgradeSkill, starUp, giveGift, gearById, equip, unequip, gearOwner, addItem, pay } from '../../core/state.js';
import { heroStats, power, STAT_ZH, fmtStat } from '../../core/stats.js';
import { heroExpToNext, heroLevelCap, skillCap, skillCost, starCost, bondExpToNext, MAX_BOND } from '../../core/economy.js';
import { gearScore } from '../../core/gear.js';
import { content } from '../../core/quiz/content.js';
import { stars, elemChip, roleChip, bar, costLabel, gearChip, gearLines, emptyState } from '../widgets.js';
import { fmt } from '../../core/util.js';
import { speak, sfx } from '../sound.js';
import { setBgTheme } from '../../fx/bg.js';
import { describeSkill } from '../skilltext.js';

const TABS = [['grow', '培養'], ['skill', '技能'], ['gear', '裝備'], ['star', '星級'], ['bond', '羈絆'], ['info', '檔案'], ['skin', '時裝']];
const UNLOCK_SHARDS = { R: 20, SR: 50, SR2: 50, SSR: 100 };
const POTIONS = ['expS', 'expM', 'expL', 'expXL'];
const GIFTS = ['gift_cake', 'gift_flower', 'gift_book', 'gift_gem'];
const STORY_AT = [3, 6, 9];
let lastTab = 'grow';

register({
  id: 'hero', tab: 'heroes', title: (p) => (HERO_MAP[p.id] ? `${HERO_MAP[p.id].zh}` : '角色'),
  mount(el, params) {
    setBgTheme('heroes');
    let id = params.id;
    let tab = lastTab;
    const list = params.list && params.list.length ? params.list : [id];

    const render = () => {
      const def = HERO_MAP[id];
      const st = S.d.heroes[id];
      const stats = st ? heroStats(def, st, gearById()) : heroStats(def, { lv: 1, star: RARITY[def.rarity].stars });
      const idx = list.indexOf(id);
      el.innerHTML = `<div class="hd">
<div class="hd-top el-${def.element}">
  <div class="hd-rays"></div>
  <img class="hd-art" src="${heroImageURL(def, { skin: st && st.skin, aura: true })}">
  ${list.length > 1 ? `<button class="hd-nav l" data-act="prev" ${idx <= 0 ? 'disabled' : ''}>${icon('back')}</button><button class="hd-nav r" data-act="next" ${idx >= list.length - 1 ? 'disabled' : ''}>${icon('back', 'flip')}</button>` : ''}
  <div class="hd-head">
    <div class="hd-rar r-${def.rarity}">${def.rarity}</div>
    <div class="hd-title">${esc(def.title)}</div>
    <div class="hd-name">${esc(def.zh)} <span class="en-title">${esc(def.name)}</span></div>
    <div class="row wrap" style="gap:5px;margin-top:4px">${elemChip(def.element)}${roleChip(def.role)}${st ? stars(st.star, maxStarFor(def.rarity)) : ''}</div>
  </div>
  <div class="hd-power">${st ? `<small>戰力</small><b>${fmt(power(stats))}</b>` : '<small>未擁有</small>'}</div>
  <button class="hd-voice" data-act="voice">${icon('speaker')}</button>
</div>
${st ? `<div class="tabs hd-tabs">${TABS.map(([k, v]) => `<button class="tab-b ${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${v}</button>`).join('')}</div>
<div class="pad hd-body">${body(def, st, stats)}</div>` : `<div class="pad">${lockedBody(def)}</div>`}
</div>`;
    };

    const body = (def, st, stats) => {
      if (tab === 'grow') return growTab(def, st, stats);
      if (tab === 'skill') return skillTab(def, st);
      if (tab === 'gear') return gearTab(def, st);
      if (tab === 'star') return starTab(def, st, stats);
      if (tab === 'bond') return bondTab(def, st);
      if (tab === 'info') return infoTab(def);
      return skinTab(def, st);
    };

    const growTab = (def, st, stats) => {
      const need = heroExpToNext(st.lv);
      const cap = heroLevelCap(S.d.profile.level);
      const capped = st.lv >= cap;
      return `<div class="panel">
<div class="row"><div class="lvl-big">Lv.<b>${st.lv}</b><small>/${cap}</small></div><div class="grow">${bar(st.exp / need, 'blue')}<div class="dim">${fmt(st.exp)} / ${fmt(need)} EXP${capped ? '　·　已達等級上限（玩家等級 +4）' : ''}</div></div></div>
<div class="potions">${POTIONS.map((k) => `<button class="potion ${item(k) ? '' : 'none'}" data-act="potion" data-k="${k}" ${item(k) && !capped ? '' : 'disabled'}><span style="color:${ITEMS[k].color}">${icon('potion')}</span><b>×${item(k)}</b><small>+${fmt(ITEMS[k].exp)}</small></button>`).join('')}</div>
<button class="btn primary block" data-act="autolv" ${capped ? 'disabled' : ''}>一鍵升級</button>
</div>
<div class="panel"><div class="stat-grid">
${[['hp', '生命', stats.hp], ['atk', '攻擊', stats.atk], ['def', '防禦', stats.def], ['spd', '速度', stats.spd], ['crit', '爆擊率', (stats.crit * 100).toFixed(1) + '%'], ['critDmg', '爆擊傷害', (stats.critDmg * 100).toFixed(0) + '%'], ['energy', '充能效率', (stats.energy * 100).toFixed(0) + '%']].map(([k, n, v]) => `<div class="sg"><span>${n}</span><b>${typeof v === 'number' ? fmt(v) : v}</b></div>`).join('')}
</div><div class="dim" style="margin-top:6px">屬性剋制：${elemIcon(def.element)}${ELEMENTS[def.element].zh} 剋 ${elemIcon(strongAgainst(def.element))}${ELEMENTS[strongAgainst(def.element)].zh}，被 ${elemIcon(weakAgainst(def.element))}${ELEMENTS[weakAgainst(def.element)].zh} 剋制</div></div>
<div class="row" style="margin-top:10px"><button class="btn grow" data-act="secretary">${icon('home')}設為秘書</button><button class="btn grow" data-act="team">${icon('swords')}編入隊伍</button></div>`;
    };

    const skillTab = (def, st) => {
      const cap = skillCap(st.lv);
      const row = (key, sk, lv, label) => {
        const c = lv != null ? skillCost(lv) : null;
        return `<div class="skill-row ${key}"><div class="sk-ic">${key === 'ult' ? icon('bolt') : key === 'passive' ? icon('star') : key === 'skill' ? icon('swords') : icon('sword')}</div>
<div class="grow"><div class="row"><b>${esc(sk.zh || '普通攻擊')}</b>${sk.en ? `<span class="dim en-title" style="font-size:11px">${esc(sk.en)}</span>` : ''}<span class="sk-tag">${label}</span>${lv != null ? `<span class="sk-lv">Lv.${lv}</span>` : ''}</div>
<div class="sk-desc">${esc(sk.desc || describeSkill(sk))}</div>
${lv != null ? `<div class="row" style="margin-top:6px"><span class="dim grow">效果 +${(lv - 1) * 5}%　上限 Lv.${cap}</span>${lv < cap ? `${costLabel({ gold: c.gold, skillBook: c.book })}<button class="btn small primary" data-act="skillup" data-k="${key}">升級</button>` : '<span class="dim">已達上限</span>'}</div>` : ''}
</div></div>`;
      };
      return `<div class="panel">${row('ult', def.ult, st.skill.ult, '奧義')}${row('skill', def.skill, st.skill.skill, `每 ${def.skill.every} 次行動`)}${row('normal', { zh: '普通攻擊', desc: describeSkill(def.normal) }, null, def.normal.range === 'melee' ? '近戰' : '遠程')}${row('passive', { zh: def.passive.zh, desc: def.passive.desc }, null, '被動')}</div>
<div class="dim center">奧義：戰鬥中能量充滿後點擊角色卡施放。答對題目能為全隊充能！</div>`;
    };

    const gearTab = (def, st) => {
      const gb = gearById();
      return `<div class="gear-slots">${GEAR_SLOTS.map((slot) => {
        const g = gb[st.equip[slot]];
        return `<button class="gslot ${g ? 'has' : ''}" data-act="slot" data-slot="${slot}" style="--gc:${g ? GEAR_RARITY[g.rarity].color : 'rgba(255,255,255,.2)'}">
<div class="gs-ic">${icon(SLOT_INFO[slot].icon)}</div><div class="grow" style="text-align:left">${g ? `<b>${esc(g.name)}${g.lvl ? ` +${g.lvl}` : ''}</b><div class="gs-lines">${gearLines(g)}</div>` : `<b class="dim">${SLOT_INFO[slot].zh}（空）</b><div class="dim">點擊裝備</div>`}</div></button>`;
      }).join('')}</div>
<div class="row" style="margin-top:10px"><button class="btn primary grow" data-act="autoequip">一鍵裝備最佳</button><button class="btn grow" data-act="unequipall">全部卸下</button></div>
<button class="btn block" style="margin-top:8px" data-act="smith">${icon('hammer')}前往鐵匠鋪強化</button>`;
    };

    const starTab = (def, st) => {
      const maxS = maxStarFor(def.rarity);
      const have = S.d.shards[id] || 0;
      if (st.star >= maxS) return `<div class="panel center"><div class="big-stars">${stars(st.star, maxS)}</div><p>已達最高星級！</p></div>`;
      const c = starCost(st.star);
      const next = st.star + 1;
      const gain = ((STAR_MULT[next] / STAR_MULT[st.star] - 1) * 100).toFixed(0);
      return `<div class="panel center"><div class="big-stars">${stars(st.star, maxS)}</div>
<p>升至 <b class="gold-text">★${next}</b>：全屬性 +${gain}%${next === 6 ? '，<b>覺醒：奧義效果 +25%</b>' : ''}</p>
<div class="row" style="justify-content:center;gap:10px"><img class="shard-ic" src="${heroImageURL(def, { crop: 'face' })}"><div style="min-width:160px">${bar(have / c.shards, 'pink')}<div class="dim">碎片 ${have} / ${c.shards}</div></div></div>
<div style="margin:10px 0">${costLabel({ gold: c.gold, crystal: c.crystal })}</div>
<button class="btn primary big" data-act="starup" ${have >= c.shards ? '' : 'disabled'}>${next === 6 ? '覺醒' : '升星'}</button>
<p class="dim">碎片來源：重複召喚、心之商店（契約之心兌換）、競技場商店、金幣召喚</p></div>`;
    };

    const bondTab = (def, st) => {
      const need = bondExpToNext(st.bond);
      return `<div class="panel"><div class="row"><div class="bond-heart">${icon('heart')}<b>${st.bond}</b></div><div class="grow">${st.bond < MAX_BOND ? `${bar(st.bondExp / need, 'pink')}<div class="dim">${st.bondExp} / ${need}　羈絆每級全屬性 +1%</div>` : '<b class="gold-text">羈絆已滿！</b>'}</div></div>
<div class="gifts">${GIFTS.map((k) => { const g = ITEMS[k]; const liked = g.likes.includes(def.element); return `<button class="gift ${item(k) ? '' : 'none'}" data-act="gift" data-k="${k}" ${item(k) && st.bond < MAX_BOND ? '' : 'disabled'}><span style="color:${g.color}">${icon(g.icon)}</span><b>×${item(k)}</b><small>${liked ? '❤ 喜歡' : '+' + g.bond}</small></button>`; }).join('')}</div></div>
<div class="sec-title">角色故事</div>
${def.stories.map((s, i) => st.bond >= STORY_AT[i] ? `<div class="panel story"><b>第 ${i + 1} 話</b><p>${esc(s)}</p></div>` : `<div class="panel story locked">${icon('lock')} 羈絆 Lv.${STORY_AT[i]} 解鎖第 ${i + 1} 話</div>`).join('')}
<div class="sec-title">語音台詞</div>
<div class="panel">${def.lines.map((l, i) => `<button class="line-b" data-act="line" data-i="${i}">${icon('speaker')}<div><div>${esc(l[0])}</div><small class="dim">${esc(l[1])}</small></div></button>`).join('')}
<button class="line-b" data-act="ultline">${icon('bolt')}<div><div>${esc(def.ultLine[0])}</div><small class="dim">${esc(def.ultLine[1])}（奧義）</small></div></button></div>`;
    };

    const infoTab = (def) => {
      const w = def.word;
      const inBook = [];
      for (const b of ['c', 't']) {
        const bk = content.books[b];
        const hit = bk && bk.map.get(`${b}:${def.name.toLowerCase()}`);
        if (hit) inBook.push(`${b === 'c' ? '學測' : '多益'} Level ${hit.l}`);
      }
      return `<div class="panel word-card ornate"><div class="row"><div class="wc-word en-title">${esc(def.name)}</div><button class="btn small" data-act="sayword">${icon('speaker')}</button></div>
<div class="wc-pos">${esc(w.pos)}　${esc(w.zh)}</div>
<div class="wc-ex">${esc(w.ex)}<button class="mini-say" data-act="sayex">${icon('speaker')}</button></div><div class="dim">${esc(w.exZh)}</div>
${inBook.length ? `<div class="wc-book">📖 收錄於：${inBook.join('、')}</div>` : ''}</div>
<div class="panel"><b>角色檔案</b><p class="muted" style="line-height:1.7">${esc(def.profile)}</p>
<div class="dim">定位：${ROLES[def.role].zh}——${ROLES[def.role].desc}</div></div>`;
    };

    const skinTab = (def, st) => {
      const owns = S.d.skins.includes(def.skin.id);
      return `<div class="skins">
<button class="skin-card ${!st.skin ? 'on' : ''}" data-act="skin" data-v=""><img src="${heroImageURL(def, {})}"><b>原初之姿</b></button>
<button class="skin-card ${st.skin === def.skin.id ? 'on' : ''} ${owns ? '' : 'locked'}" data-act="skin" data-v="${def.skin.id}"><img src="${heroImageURL(def, { skin: def.skin.id, aura: true })}"><b>${esc(def.skin.zh)}</b>${owns ? '' : `<small>${icon('lock')} 時裝店購買</small>`}</button>
</div>`;
    };

    const lockedBody = (def) => {
      const have = S.d.shards[id] || 0;
      const need = UNLOCK_SHARDS[def.rarity];
      return `<div class="panel center"><p>尚未與 <b>${esc(def.zh)}</b> 締結契約。</p>
<div class="row" style="justify-content:center;gap:10px"><img class="shard-ic" src="${heroImageURL(def, { crop: 'face' })}"><div style="min-width:160px">${bar(have / need, 'pink')}<div class="dim">碎片 ${have} / ${need}</div></div></div>
<button class="btn primary" style="margin-top:10px" data-act="unlock" ${have >= need ? '' : 'disabled'}>以碎片締結契約</button>
<p class="dim">取得方式：召喚之間、心之商店兌換碎片</p></div>${infoTab(def)}
<div class="panel">${['ult', 'skill'].map((k) => `<b>${esc(def[k].zh)}</b><p class="dim">${esc(def[k].desc)}</p>`).join('')}</div>`;
    };

    render();

    const usePotion = (k, n = 1) => {
      let ups = 0;
      for (let i = 0; i < n && item(k) > 0 && heroExpToCap(id) > 0; i++) {
        addItem(k, -1);
        ups += addHeroExp(id, ITEMS[k].exp);
      }
      return ups;
    };

    bindActions(el, {
      tab: (b) => { tab = lastTab = b.dataset.t; sfx('tab'); render(); },
      prev: () => { const i = list.indexOf(id); if (i > 0) { id = list[i - 1]; sfx('tap'); render(); } },
      next: () => { const i = list.indexOf(id); if (i < list.length - 1) { id = list[i + 1]; sfx('tap'); render(); } },
      voice: () => { const def = HERO_MAP[id]; const l = def.lines[Math.floor(Math.random() * def.lines.length)]; speak(l[0]); toast(`「${l[0]}」<br><small>${l[1]}</small>`); },
      potion: (b) => {
        const ups = usePotion(b.dataset.k, 1);
        sfx(ups ? 'levelup' : 'tap');
        if (ups) toast(`等級提升！Lv.${S.d.heroes[id].lv}`, 'gold');
        changed('hero');
      },
      autolv: () => {
        let ups = 0;
        for (const k of POTIONS) ups += usePotion(k, 999);
        sfx(ups ? 'levelup' : 'error');
        toast(ups ? `等級提升 ${ups} 級！Lv.${S.d.heroes[id].lv}` : '經驗藥水不足或已達上限', ups ? 'gold' : 'bad');
        changed('hero');
      },
      secretary: () => { S.d.profile.secretary = id; S.d.profile.avatar = id; changed('profile'); toast('已設為秘書', 'gold'); },
      team: () => go('team', { mode: 'pve', add: id }),
      skillup: (b) => {
        const r = upgradeSkill(id, b.dataset.k);
        if (!r.ok) { sfx('error'); toast(r.why, 'bad'); return; }
        sfx('levelup');
        toast(`技能提升至 Lv.${r.lv}！`, 'gold');
        changed('hero');
      },
      starup: async (b) => {
        const def = HERO_MAP[id];
        const st = S.d.heroes[id];
        const c = starCost(st.star);
        if (!(await confirmBox(`消耗 ${c.shards} 碎片與 ${fmt(c.gold)} 金幣${c.crystal ? `、${c.crystal} 覺醒結晶` : ''}，將 ${def.zh} 提升至 ★${st.star + 1}？`))) return;
        const r = starUp(id);
        if (!r.ok) { sfx('error'); toast(r.why, 'bad'); return; }
        sfx('starup');
        changed('hero');
        celebrate(def, r.star);
        void b;
      },
      gift: (b) => {
        const r = giveGift(id, b.dataset.k);
        if (!r.ok) { if (r.why) toast(r.why, 'bad'); return; }
        sfx(r.ups ? 'levelup' : 'heart');
        toast(r.ups ? `羈絆提升！Lv.${r.bond}${STORY_AT.includes(r.bond) ? '　解鎖新故事！' : ''}` : `羈絆 +${r.xp}${r.liked ? '（喜歡的禮物！）' : ''}`, r.ups ? 'gold' : '');
        changed('hero');
      },
      line: (b) => speak(HERO_MAP[id].lines[+b.dataset.i][0], { force: true }),
      ultline: () => speak(HERO_MAP[id].ultLine[0], { force: true }),
      sayword: () => speak(HERO_MAP[id].name, { force: true }),
      sayex: () => speak(HERO_MAP[id].word.ex, { force: true }),
      slot: (b) => pickGear(id, b.dataset.slot),
      autoequip: () => { autoEquip(id); sfx('equip'); changed('gear'); },
      unequipall: () => { for (const s of GEAR_SLOTS) unequip(id, s); changed('gear'); },
      smith: () => go('shop', { tab: 'smith' }),
      skin: (b) => {
        const def = HERO_MAP[id];
        const v = b.dataset.v || null;
        if (v && !S.d.skins.includes(v)) { go('shop', { tab: 'boutique' }); return; }
        S.d.heroes[id].skin = v;
        sfx('equip');
        changed('hero');
        void def;
      },
      unlock: () => {
        const def = HERO_MAP[id];
        const need = UNLOCK_SHARDS[def.rarity];
        if ((S.d.shards[id] || 0) < need) return;
        S.d.shards[id] -= need;
        S.d.heroes[id] = { lv: 1, exp: 0, star: RARITY[def.rarity].stars, bond: 1, bondExp: 0, skill: { skill: 1, ult: 1 }, equip: {}, skin: null, got: Date.now() };
        sfx('starup');
        changed('hero');
        celebrate(def, S.d.heroes[id].star, true);
      },
    });
    void pay;
    return { refresh: render };
  },
});

function celebrate(def, star, isNew = false) {
  modal({
    title: isNew ? '締結契約！' : '星級提升！', cls: 'celebrate',
    body: `<div class="celeb"><img src="${heroImageURL(def, { expr: 'happy', aura: true })}"><div class="big-stars">${stars(star, maxStarFor(def.rarity))}</div><p><b>${esc(def.zh)}</b>：「${esc(def.lines[0][0])}」</p></div>`,
    buttons: [{ label: '太好了', cls: 'primary', value: 1 }],
  });
  speak(def.ultLine[0]);
}

function autoEquip(heroId) {
  const st = S.d.heroes[heroId];
  for (const slot of GEAR_SLOTS) {
    const cur = st.equip[slot];
    const cands = S.d.gear.filter((g) => g.slot === slot && (!gearOwner(g.uid) || g.uid === cur));
    if (!cands.length) continue;
    cands.sort((a, b) => gearScore(b) - gearScore(a));
    if (cands[0].uid !== cur) equip(heroId, cands[0].uid);
  }
}

function pickGear(heroId, slot) {
  const st = S.d.heroes[heroId];
  const cur = st.equip[slot];
  const list = S.d.gear.filter((g) => g.slot === slot).sort((a, b) => gearScore(b) - gearScore(a));
  const body = h(`<div class="gear-pick">${list.length ? list.map((g) => {
    const owner = gearOwner(g.uid);
    return `<div class="gp-row ${g.uid === cur ? 'cur' : ''}" style="--gc:${GEAR_RARITY[g.rarity].color}">${gearChip(g, { owner })}
<div class="grow"><b style="color:${GEAR_RARITY[g.rarity].color}">${esc(g.name)}${g.lvl ? ` +${g.lvl}` : ''}</b><div class="gs-lines">${gearLines(g)}</div></div>
<button class="btn small ${g.uid === cur ? '' : 'primary'}" data-uid="${g.uid}">${g.uid === cur ? '卸下' : owner ? '奪取' : '裝備'}</button></div>`;
  }).join('') : emptyState(`沒有${SLOT_INFO[slot].zh}。可從關卡掉落、金幣召喚或鐵匠鋪鍛造取得。`)}</div>`);
  modal({
    title: `選擇${SLOT_INFO[slot].zh}`, body,
    onMount(m, close) {
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-uid]');
        if (!b) return;
        if (b.dataset.uid === cur) unequip(heroId, slot);
        else equip(heroId, b.dataset.uid);
        sfx('equip');
        changed('gear');
        close(1);
      });
    },
  });
  void STAT_ZH; void fmtStat;
}
