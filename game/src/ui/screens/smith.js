// Blacksmith (鐵匠鋪): enhance gear +1..+15, forge new gear, dismantle for gold and stones.
import { modal, toast, confirmBox } from '../app.js';
import { bindActions, esc, h, sleep } from '../dom.js';
import { icon } from '../../art/icons.js';
import { heroImageURL } from '../../art/hero.js';
import { HERO_MAP } from '../../core/data/heroes.js';
import { GEAR_RARITY, SLOT_INFO, GEAR_SLOTS, MAX_ENHANCE, ENHANCE_DOWNGRADE_FROM } from '../../core/data/items.js';
import { S, changed, pay, item, findGear, gearOwner, removeGear, grant } from '../../core/state.js';
import { enhanceCost, enhanceChance, rollEnhance, makeGear, rollRarity, tierForLevel, dismantleValue, gearScore } from '../../core/gear.js';
import { STAT_ZH, fmtStat, gearStats } from '../../core/stats.js';
import { makeRng, randomSeed } from '../../core/rng.js';
import { track } from '../../core/missions.js';
import { gearChip, gearLines, costLabel, emptyState, rewardList } from '../widgets.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../sound.js';

let sel = null;
let mode = 'enhance';

export function smithTab(el) {
  let useLucky = false, useProtect = false;
  let busy = false;
  const picked = new Set();

  const render = () => {
    const gear = S.d.gear.slice().sort((a, b) => b.rarity - a.rarity || b.lvl - a.lvl || gearScore(b) - gearScore(a));
    if (sel && !findGear(sel)) sel = null;
    if (!sel && gear.length) sel = gear[0].uid;
    let body = '';
    if (mode === 'enhance') body = enhanceView(gear);
    else if (mode === 'forge') body = forgeView();
    else body = dismantleView(gear);
    el.innerHTML = `<div class="smith">
<div class="tabs" style="margin-bottom:10px"><button class="tab-b ${mode === 'enhance' ? 'on' : ''}" data-act="mode" data-m="enhance">強化</button><button class="tab-b ${mode === 'forge' ? 'on' : ''}" data-act="mode" data-m="forge">鍛造</button><button class="tab-b ${mode === 'dismantle' ? 'on' : ''}" data-act="mode" data-m="dismantle">分解</button>
<span class="smith-res">${icon('stone')}${item('stone')}　${icon('clover')}${item('lucky')}　${icon('charm')}${item('protect')}</span></div>${body}</div>`;
  };

  const enhanceView = (gear) => {
    if (!gear.length) return emptyState('還沒有裝備。關卡掉落、金幣召喚或「鍛造」都能取得裝備。');
    const g = findGear(sel);
    const R = GEAR_RARITY[g.rarity];
    const c = enhanceCost(g);
    const p = enhanceChance(g, { lucky: useLucky });
    const owner = gearOwner(g.uid);
    const maxed = g.lvl >= MAX_ENHANCE;
    const risky = g.lvl >= ENHANCE_DOWNGRADE_FROM;
    const nextMain = g.main.v * (1 + 0.06 * (g.lvl + 1));
    return `<div class="panel ornate anvil-panel" style="--gc:${R.color}">
  <div class="anvil-stage"><div class="anvil-glow"></div><div class="anvil-item">${icon(SLOT_INFO[g.slot].icon)}</div><div class="hammer">${icon('hammer')}</div><div class="anvil-base"></div><div class="anvil-fx"></div></div>
  <div class="center"><b style="color:${R.color};font-size:17px">${esc(g.name)} <span class="gold-text">+${g.lvl}</span></b><div class="dim">${R.zh} · ${SLOT_INFO[g.slot].zh} · T${g.tier}${owner ? ` · 裝備中：${esc(HERO_MAP[owner].zh)}` : ''}</div></div>
  <div class="gs-lines" style="justify-content:center;margin:6px 0">${gearLines(g)}</div>
  ${maxed ? '<div class="center gold-text" style="font-weight:900">已強化至最高等級 +15！</div>' : `
  <div class="enh-info"><div><small>主屬性</small><b>${STAT_ZH[g.main.k]} ${fmtStat(g.main.k, g.main.v * (1 + 0.06 * g.lvl))} → <span class="good">${fmtStat(g.main.k, nextMain)}</span></b></div>
  <div><small>成功率</small><b class="${p >= 0.7 ? 'good' : p >= 0.4 ? 'warnc' : 'bad'}">${Math.round(p * 100)}%</b>${g.bless ? `<span class="bless">祝福 +${Math.round(g.bless * 100)}%</span>` : ''}</div></div>
  ${risky ? `<div class="enh-warn">⚠ +${ENHANCE_DOWNGRADE_FROM} 以上強化失敗會降 1 級（可用保護符避免）</div>` : ''}
  <div class="row enh-opts"><label class="chk ${item('lucky') ? '' : 'off'}"><input type="checkbox" data-opt="lucky" ${useLucky ? 'checked' : ''} ${item('lucky') ? '' : 'disabled'}>${icon('clover')} 幸運符 +15%</label>
  <label class="chk ${item('protect') && risky ? '' : 'off'}"><input type="checkbox" data-opt="protect" ${useProtect && risky ? 'checked' : ''} ${item('protect') && risky ? '' : 'disabled'}>${icon('charm')} 保護符</label></div>
  <div class="center" style="margin:6px 0">${costLabel({ gold: c.gold, stone: c.stone })}</div>
  <button class="btn primary big block" data-act="enhance">${icon('hammer')} 強化</button>`}
</div>
<div class="sec-title">選擇裝備</div>
<div class="gear-grid">${gear.map((x) => gearChip(x, { act: 'sel', sel: x.uid === sel, owner: gearOwner(x.uid) })).join('')}</div>`;
  };

  const forgeView = () => {
    const tier = tierForLevel(S.d.profile.level);
    const costN = { gold: 6000 * tier, stone: 6 };
    const costH = { gold: 20000 * tier, stone: 20, gems: 60 };
    return `<div class="panel ornate center"><div class="anvil-stage small"><div class="anvil-glow"></div><div class="anvil-item">${icon('hammer')}</div><div class="anvil-base"></div><div class="anvil-fx"></div></div>
<p>以強化石與金幣鍛造 <b>T${tier}</b>（依玩家等級）裝備。</p>
<div class="forge-slots">${GEAR_SLOTS.map((s) => `<button class="tab-b ${forgeSlot === s ? 'on' : ''}" data-act="fslot" data-s="${s}">${icon(SLOT_INFO[s].icon)} ${SLOT_INFO[s].zh}</button>`).join('')}<button class="tab-b ${forgeSlot === 'any' ? 'on' : ''}" data-act="fslot" data-s="any">隨機</button></div>
<div class="forge-opts">
<div class="fo"><b>普通鍛造</b><div class="dim">優良 45%・稀有 38%・史詩 14%・傳說 3%</div><div>${costLabel(costN)}</div><button class="btn primary" data-act="forge" data-q="n">鍛造</button></div>
<div class="fo high"><b>大師鍛造</b><div class="dim">稀有 50%・史詩 40%・傳說 10%</div><div>${costLabel(costH)}</div><button class="btn red" data-act="forge" data-q="h">鍛造</button></div>
</div></div>`;
  };
  let forgeSlot = 'any';

  const dismantleView = (gear) => {
    const free = gear.filter((g) => !gearOwner(g.uid) && !g.locked);
    let gold = 0, stone = 0;
    for (const uid of picked) { const g = findGear(uid); if (!g) continue; const v = dismantleValue(g); gold += v.gold; stone += v.stone; }
    return `<div class="panel"><div class="row"><div class="grow">已選 <b>${picked.size}</b> 件　可得 ${icon('coin')}${fmt(gold)}　${icon('stone')}${stone}</div><button class="btn red small" data-act="dismantle" ${picked.size ? '' : 'disabled'}>分解</button></div>
<div class="row" style="margin-top:6px;gap:6px"><button class="btn small ghost" data-act="pickr" data-r="0">全選普通</button><button class="btn small ghost" data-act="pickr" data-r="1">全選優良</button><button class="btn small ghost" data-act="pickr" data-r="-1">取消全選</button></div></div>
${free.length ? `<div class="gear-grid" style="margin-top:10px">${free.map((x) => gearChip(x, { act: 'pick', sel: picked.has(x.uid) })).join('')}</div>` : emptyState('沒有可分解的裝備（已裝備的不能分解）')}`;
  };

  const strike = async (ok, down) => {
    const st = el.querySelector('.anvil-stage');
    if (!st) return;
    st.classList.remove('success', 'fail', 'striking');
    void st.offsetWidth;
    st.classList.add('striking');
    for (let i = 0; i < 3; i++) { sfx('anvil'); await sleep(260); }
    st.classList.remove('striking');
    st.classList.add(ok ? 'success' : 'fail');
    sfx(ok ? 'enhanceOk' : 'enhanceFail');
    await sleep(700);
    void down;
  };

  render();
  const off = bindActions(el, {
    mode: (b) => { mode = b.dataset.m; picked.clear(); sfx('tab'); render(); },
    sel: (b) => { sel = b.dataset.uid; sfx('tap'); render(); },
    enhance: async () => {
      if (busy) return;
      const g = findGear(sel);
      if (!g || g.lvl >= MAX_ENHANCE) return;
      const c = enhanceCost(g);
      const risky = g.lvl >= ENHANCE_DOWNGRADE_FROM;
      const cost = { gold: c.gold, stone: c.stone };
      if (useLucky && item('lucky')) cost.lucky = 1;
      if (useProtect && risky && item('protect')) cost.protect = 1;
      if (!pay(cost)) { sfx('error'); toast('金幣或強化石不足', 'bad'); return; }
      busy = true;
      const r = rollEnhance(g, makeRng(randomSeed()), { lucky: !!cost.lucky, protect: !!cost.protect });
      track('enhance', 1);
      S.d.stats.enhanceMax = Math.max(S.d.stats.enhanceMax || 0, g.lvl);
      await strike(r.ok, r.down);
      busy = false;
      toast(r.ok ? `強化成功！+${r.lvl}` : r.down ? `強化失敗… 降為 +${r.lvl}` : `強化失敗（祝福值 +5%）`, r.ok ? 'gold' : 'bad');
      changed('gear');
    },
    fslot: (b) => { forgeSlot = b.dataset.s; sfx('tap'); render(); },
    forge: async (b) => {
      if (busy) return;
      const tier = tierForLevel(S.d.profile.level);
      const high = b.dataset.q === 'h';
      const cost = high ? { gold: 20000 * tier, stone: 20, gems: 60 } : { gold: 6000 * tier, stone: 6 };
      if (!pay(cost)) { sfx('error'); toast('材料不足', 'bad'); return; }
      busy = true;
      const rng = makeRng(randomSeed());
      const g = makeGear(rng, { slot: forgeSlot === 'any' ? null : forgeSlot, tier, rarity: rollRarity(rng, high ? 'forgeHigh' : 'forge') });
      await strike(true);
      grant({ gear: [g] });
      busy = false;
      changed('gear');
      const R = GEAR_RARITY[g.rarity];
      modal({ title: g.rarity >= 3 ? '✨ 鍛造出稀世珍品！' : '鍛造完成', body: `<div class="center forge-res" style="--gc:${R.color}"><div class="fr-ic">${icon(SLOT_INFO[g.slot].icon)}</div><b style="color:${R.color}">${R.zh}・${esc(g.name)}</b><div class="gs-lines" style="justify-content:center">${gearLines(g)}</div></div>`, buttons: [{ label: '好', cls: 'primary', value: 1 }] });
      if (g.rarity >= 3) sfx('ssr');
    },
    pick: (b) => { const u = b.dataset.uid; if (picked.has(u)) picked.delete(u); else picked.add(u); render(); },
    pickr: (b) => {
      const r = +b.dataset.r;
      if (r < 0) picked.clear();
      else for (const g of S.d.gear) if (g.rarity === r && !gearOwner(g.uid) && !g.locked) picked.add(g.uid);
      render();
    },
    dismantle: async () => {
      if (!picked.size) return;
      if (!(await confirmBox(`分解 ${picked.size} 件裝備？此動作無法復原。`))) return;
      let gold = 0, stone = 0;
      for (const uid of picked) { const g = findGear(uid); if (!g || gearOwner(uid)) continue; const v = dismantleValue(g); gold += v.gold; stone += v.stone; removeGear(uid); }
      picked.clear();
      const got = grant({ gold, stone });
      sfx('coin');
      changed('gear');
      modal({ title: '分解完成', body: rewardList(got, { big: true }), buttons: [{ label: '好', cls: 'primary', value: 1 }] });
    },
  });
  el.addEventListener('change', (e) => {
    const o = e.target.dataset && e.target.dataset.opt;
    if (o === 'lucky') useLucky = e.target.checked;
    if (o === 'protect') useProtect = e.target.checked;
    render();
  });
  return { refresh: render, destroy: off };
  void heroImageURL; void gearStats; void h;
}
