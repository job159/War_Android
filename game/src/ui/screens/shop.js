// 商城 Mall: summon hall, general store, mysterious merchant, blacksmith, boutique, exchanges, study pass.
import { register, go, modal, toast, confirmBox } from '../app.js';
import { bindActions, esc, h } from '../dom.js';
import { icon, elemIcon, itemIcon } from '../../art/icons.js';
import { heroImageURL } from '../../art/hero.js';
import { HERO_MAP, HEROES } from '../../core/data/heroes.js';
import { ITEMS } from '../../core/data/items.js';
import { S, changed, pay, canPay, addHero, grant, cur, item } from '../../core/state.js';
import { pullHeroes, pullGold, featuredHero, BANNERS, RATES, allSSR } from '../../core/gacha.js';
import { GACHA_COST, SPARK_POINTS } from '../../core/economy.js';
import { storeStock, refreshStore, refreshCost, buyStore, merchantActive, buyMerchant, heartShopList, buyShards, exchangeList, exchangeBought, buyExchange, SKIN_PRICE, buySkin } from '../../core/shop.js';
import { passState, claimPass, PASS_TIERS, PASS_POINTS_PER_TIER, passReward, track } from '../../core/missions.js';
import { rewardList, rewardChip, costLabel, bar, stars, emptyState } from '../widgets.js';
import { fmt, dayKey, msToClock } from '../../core/util.js';
import { playSummon } from '../gachaAnim.js';
import { sfx } from '../sound.js';
import { setBgTheme } from '../../fx/bg.js';
import { smithTab } from './smith.js';
import { mergeRewards } from './mail.js';
import { RARITY } from '../../core/data/elements.js';

const TABS = [['summon', '召喚'], ['store', '商店'], ['merchant', '神秘商人'], ['smith', '鐵匠鋪'], ['boutique', '時裝'], ['exchange', '兌換所'], ['pass', '通行證']];
let lastTab = 'summon';

const bundleList = (b) => {
  const out = [];
  for (const k in b) {
    if (k === 'shards') for (const id in b.shards) out.push({ k: 'shard', id, n: b.shards[id] });
    else if (k === 'gear') for (const g of b.gear) out.push({ k: 'gear', g });
    else out.push({ k, n: b[k] });
  }
  return out;
};

register({
  id: 'shop', tab: 'shop', title: '商城',
  mount(el, params) {
    setBgTheme('shop');
    let tab = params.tab || lastTab;
    let exCur = 'hearts';
    let smith = null;
    const timer = setInterval(() => { const t = el.querySelector('[data-countdown]'); if (t) t.textContent = msToClock(Math.max(0, +t.dataset.countdown - Date.now())); }, 1000);

    const render = () => {
      lastTab = tab;
      if (smith && tab !== 'smith') { smith.destroy && smith.destroy(); smith = null; }
      const tabs = TABS.filter(([k]) => k !== 'merchant' || merchantActive());
      el.innerHTML = `<div class="shop">
<div class="tabs shop-tabs">${tabs.map(([k, v]) => `<button class="tab-b ${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${v}${k === 'summon' && (S.d.gacha.freeDay !== dayKey()) ? '<i class="dot"></i>' : ''}</button>`).join('')}</div>
<div class="pad shop-body"></div></div>`;
      const body = el.querySelector('.shop-body');
      if (tab === 'summon') body.innerHTML = summonTab();
      else if (tab === 'store') body.innerHTML = storeTab();
      else if (tab === 'merchant') body.innerHTML = merchantTab();
      else if (tab === 'smith') smith = smithTab(body);
      else if (tab === 'boutique') body.innerHTML = boutiqueTab();
      else if (tab === 'exchange') body.innerHTML = exchangeTab();
      else body.innerHTML = passTab();
    };

    // ---------------------------------------------------------------- summon
    const summonTab = () => {
      const g = S.d.gacha;
      const feat = HERO_MAP[featuredHero()];
      const free = g.freeDay !== dayKey();
      const t = item('ticket');
      const btns = (banner) => `<div class="sm-btns">
<button class="sm-b" data-act="pull" data-b="${banner}" data-n="1"><small>單抽</small><span>${t >= 1 ? `${icon('ticket')}1` : `${icon('gem')}${GACHA_COST.single}`}</span></button>
<button class="sm-b ten" data-act="pull" data-b="${banner}" data-n="10"><small>十連${g.firstTen ? '（必得SSR）' : '（保底SR）'}</small><span>${t >= 10 ? `${icon('ticket')}10` : `${icon('gem')}${GACHA_COST.ten}`}</span></button></div>`;
      const wkEnd = (() => { const d = new Date(); d.setHours(24, 0, 0, 0); d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); return d.getTime(); })();
      return `<div class="sm-res"><span>${icon('gem')}${fmt(cur('gems'))}</span><span>${icon('ticket')}${item('ticket')} 召喚券</span><span class="spark" data-act="spark">${icon('star')}契約點數 ${g.spark}/${SPARK_POINTS}</span></div>
<div class="banner-card feat">
  <div class="bc-rays"></div><img class="bc-art" src="${heroImageURL(feat, { aura: true })}">
  <div class="bc-info"><span class="bc-up">PICK UP</span><small class="en-title">SPOTLIGHT SUMMON</small><h3>精選召喚</h3><div class="bc-hero">${elemIcon(feat.element)} ${esc(feat.title)}<br><b>${esc(feat.zh)}</b> <span class="en-title">${esc(feat.name)}</span></div>
  <div class="dim">本週 SSR 中一半機率為精選角色<br>剩餘 <span data-countdown="${wkEnd}">${msToClock(wkEnd - Date.now())}</span></div></div>
  ${btns('featured')}
</div>
<div class="banner-card std">
  <div class="bc-info"><small class="en-title">COVENANT SUMMON</small><h3>常駐召喚</h3><div class="dim">全部 ${HEROES.length} 位詞靈皆可能出現<br>SSR ${RATES.SSR * 100}% · SR ${RATES.SR * 100}% · R ${RATES.R * 100}%</div>
  ${free ? '<button class="btn primary small free-b" data-act="free">✨ 每日免費單抽</button>' : '<div class="dim">今日免費單抽已使用</div>'}</div>
  <div class="bc-trio">${allSSR().slice(0, 3).map((x) => `<img src="${heroImageURL(x, { crop: 'bust' })}">`).join('')}</div>
  ${btns('standard')}
</div>
<div class="banner-card gold">
  <div class="bc-info"><small class="en-title">GOLD SUMMON</small><h3>金幣召喚</h3><div class="dim">裝備、經驗藥水、強化石、禮物、角色碎片</div></div>
  <div class="sm-btns"><button class="sm-b" data-act="gold" data-n="1"><small>單抽</small><span>${icon('coin')}${fmt(GACHA_COST.goldSingle)}</span></button><button class="sm-b ten" data-act="gold" data-n="10"><small>十連</small><span>${icon('coin')}${fmt(GACHA_COST.goldTen)}</span></button></div>
</div>
<button class="btn ghost block" data-act="rates">${icon('info')} 機率與保底說明</button>`;
    };

    const doPull = async (bannerId, n, free = false) => {
      const g = S.d.gacha;
      if (free) {
        if (g.freeDay === dayKey()) return;
        g.freeDay = dayKey();
      } else {
        const tk = item('ticket');
        const ok = n === 1 ? (tk >= 1 ? pay({ ticket: 1 }) : pay({ gems: GACHA_COST.single })) : (tk >= 10 ? pay({ ticket: 10 }) : pay({ gems: GACHA_COST.ten }));
        if (!ok) { sfx('error'); toast('魔晶石不足！完成每日任務與學習可以獲得魔晶石', 'bad'); return; }
      }
      const res = pullHeroes(g, bannerId, n);
      const shown = res.map((r) => ({ ...r, ...addHero(r.id) }));
      S.d.stats.gachaSSR = (S.d.stats.gachaSSR || 0) + res.filter((r) => r.rarity === 'SSR').length;
      track('gacha', n);
      changed('gacha');
      await playSummon(shown, { title: BANNERS[bannerId].zh });
      render();
    };

    const doGold = async (n) => {
      if (!pay({ gold: n === 1 ? GACHA_COST.goldSingle : GACHA_COST.goldTen })) { sfx('error'); toast('金幣不足', 'bad'); return; }
      const res = pullGold(n, S.d.profile.level);
      const got = [];
      for (const r of res) {
        if (r.gear) got.push(...grant({ gear: [r.gear] }));
        else if (r.item) got.push(...grant({ [r.item]: r.n }));
        else if (r.shard) got.push(...grant({ shards: { [r.shard]: r.n } }));
      }
      track('gacha', n);
      changed('gacha');
      sfx('reward');
      modal({ title: '金幣召喚結果', body: rewardList(mergeRewards(got), { big: true }), buttons: [{ label: '確定', cls: 'primary', value: 1 }] });
    };

    const sparkExchange = () => {
      const g = S.d.gacha;
      const body = h(`<div><p class="center">累積 ${SPARK_POINTS} 契約點數可兌換任一 SSR 詞靈（重複則轉為碎片）。<br>目前：<b class="gold-text">${g.spark}</b></p>
<div class="hero-grid">${allSSR().map((x) => `<button class="spark-pick" data-id="${x.id}" ${g.spark >= SPARK_POINTS ? '' : 'disabled'}><img src="${heroImageURL(x, { crop: 'bust' })}"><small>${esc(x.zh)}</small></button>`).join('')}</div></div>`);
      modal({
        title: '契約點數兌換', body,
        onMount(m, close) {
          m.addEventListener('click', async (e) => {
            const b = e.target.closest('.spark-pick');
            if (!b || g.spark < SPARK_POINTS) return;
            const id = b.dataset.id;
            if (!(await confirmBox(`使用 ${SPARK_POINTS} 契約點數兌換「${HERO_MAP[id].zh}」？`))) return;
            g.spark -= SPARK_POINTS;
            const r = addHero(id);
            changed('gacha');
            close(1);
            await playSummon([{ id, rarity: 'SSR', ...r }], { title: '契約兌換' });
            render();
          });
        },
      });
    };

    // ---------------------------------------------------------------- store / merchant
    const storeTab = () => {
      const stock = storeStock();
      return `<div class="row" style="margin-bottom:8px"><div class="grow dim">每日 00:00 更新商品</div><button class="btn small" data-act="refresh">${icon('refresh')} 刷新 ${icon('gem')}${refreshCost(S.d.shop.refresh)}</button></div>
<div class="store-grid">${stock.map((it, i) => offerCard(it, i, 'buy')).join('')}</div>`;
    };
    const offerCard = (it, i, act, extra = '') => {
      const list = bundleList(it.give);
      return `<div class="offer ${it.sold ? 'sold' : ''}">${extra}<div class="of-items">${list.map(rewardChip).join('')}</div>
<button class="btn small ${it.sold ? '' : canPay(it.cost) ? 'primary' : ''} block" data-act="${act}" data-i="${i}" ${it.sold ? 'disabled' : ''}>${it.sold ? '已售出' : costLabel(it.cost)}</button></div>`;
    };
    const merchantTab = () => {
      if (!merchantActive()) return `<div class="panel center merchant-away">${icon('merchant')}<p>神秘商人目前不在。<br><span class="dim">戰鬥勝利後有機率遇到他，帶來限時折扣的稀有商品！</span></p></div>`;
      const m = S.d.merchant;
      return `<div class="panel ornate merchant-head"><div class="mh-ic">${icon('merchant')}</div><div class="grow"><b>神秘商人 Marco</b><div class="dim">「嘿嘿，好東西可不等人喔。」</div></div><div class="mh-t">剩餘<br><b data-countdown="${m.until}">${msToClock(m.until - Date.now())}</b></div></div>
<div class="store-grid">${m.stock.map((it, i) => offerCard(it, i, 'mbuy', `<span class="disc">-${Math.round((1 - Object.values(it.cost)[0] / Object.values(it.was)[0]) * 100)}%</span>`)).join('')}</div>`;
    };

    // ---------------------------------------------------------------- boutique
    const boutiqueTab = () => `<p class="dim">時裝會改變角色的配色與光環，在角色「時裝」分頁更換。</p><div class="skin-grid">${HEROES.map((x) => {
      const owned = S.d.skins.includes(x.skin.id);
      return `<div class="skin-item r-${x.rarity} ${owned ? 'owned' : ''}"><img src="${heroImageURL(x, { skin: x.skin.id, aura: true })}"><div class="si-name"><b>${esc(x.skin.zh)}</b><small>${esc(x.zh)}</small></div>
<button class="btn small ${owned ? '' : 'primary'} block" data-act="skin" data-id="${x.id}" ${owned ? 'disabled' : ''}>${owned ? '已擁有' : `${icon('gem')}${SKIN_PRICE[x.rarity]}`}</button></div>`;
    }).join('')}</div>`;

    // ---------------------------------------------------------------- exchange
    const exchangeTab = () => {
      const curTabs = [['hearts', '契約之心', 'heart'], ['arena', '競技幣', 'medal'], ['medal', '試煉徽章', 'badge']];
      let body;
      if (exCur === 'hearts') {
        body = `<p class="dim">契約之心：抽到重複角色時獲得。可兌換任意角色碎片。</p><div class="heart-list">${heartShopList().map((x) => {
          const def = HERO_MAP[x.id];
          return `<div class="hl-row"><img src="${heroImageURL(def, { crop: 'face' })}"><div class="grow"><b>${esc(def.zh)}</b><span class="r-tag r-${x.rarity}">${x.rarity}</span><div class="dim">持有碎片 ${S.d.shards[x.id] || 0}</div></div>
<button class="btn small" data-act="hshard" data-id="${x.id}" data-n="5">×5 ${icon('heart')}${x.price * 5}</button><button class="btn small" data-act="hshard" data-id="${x.id}" data-n="10">×10 ${icon('heart')}${x.price * 10}</button></div>`;
        }).join('')}</div>`;
      } else {
        const list = exchangeList(exCur);
        body = `<p class="dim">${exCur === 'arena' ? '競技幣：競技場與線上對戰獲得。' : '試煉徽章：試煉之塔首次通關獲得。'}每週一更新，部分商品有購買次數限制。</p>
<div class="store-grid">${list.map((it, i) => { const left = it.limit - exchangeBought(it.id); return offerCard({ ...it, sold: left <= 0 }, i, 'ex', `<span class="lim">剩 ${left}</span>`); }).join('')}</div>`;
      }
      return `<div class="tabs" style="margin-bottom:8px">${curTabs.map(([k, v, ic]) => `<button class="tab-b ${exCur === k ? 'on' : ''}" data-act="excur" data-c="${k}">${icon(ic)} ${v} ${fmt(cur(k))}</button>`).join('')}</div>${body}`;
    };

    // ---------------------------------------------------------------- pass
    const passTab = () => {
      const p = passState();
      const rows = [];
      for (let t = 1; t <= PASS_TIERS; t++) {
        const r = passReward(t);
        const claimed = p.claimed.includes(t);
        const ready = t <= p.tier && !claimed;
        rows.push(`<div class="pass-row ${claimed ? 'claimed' : ready ? 'ready' : t <= p.tier ? '' : 'locked'}"><div class="pr-t">${t}</div><div class="grow">${rewardList(bundleList(r).filter((x) => x.n !== 0))}</div><button class="btn small ${ready ? 'primary' : ''}" data-act="pclaim" data-t="${t}" ${ready ? '' : 'disabled'}>${claimed ? '已領' : ready ? '領取' : icon('lock')}</button></div>`);
      }
      return `<div class="panel ornate pass-head"><small class="en-title">STUDY PASS · ${S.d.pass.season}</small><h3>學習通行證</h3>
<div class="row"><div class="pass-lv">Lv.<b>${p.tier}</b></div><div class="grow">${bar((p.points % PASS_POINTS_PER_TIER) / PASS_POINTS_PER_TIER)}<div class="dim">${p.points} 點 · 下一階 ${p.next}</div></div></div>
<p class="dim">答對一題 +2 點、完成複習 +1、閱讀文法課 +20。每月重置，全部免費！</p></div>
<button class="btn primary block" data-act="pall" style="margin:8px 0">一鍵領取</button>
<div class="pass-list">${rows.join('')}</div>`;
    };

    render();
    bindActions(el, {
      tab: (b) => { tab = b.dataset.t; sfx('tab'); render(); },
      pull: (b) => doPull(b.dataset.b, +b.dataset.n),
      free: () => doPull('standard', 1, true),
      gold: (b) => doGold(+b.dataset.n),
      spark: () => sparkExchange(),
      rates: () => modal({ title: '機率說明', body: `<div class="rates">
<p>★ SSR <b>${RATES.SSR * 100}%</b>　★ SR <b>${RATES.SR * 100}%</b>　★ R <b>${RATES.R * 100}%</b></p>
<p>・十連召喚保底至少 1 位 SR 以上。<br>・首次十連召喚必定獲得 SSR。<br>・連續 90 抽未出 SSR，第 90 抽必定為 SSR。<br>・每次召喚獲得 1 契約點數，${SPARK_POINTS} 點可兌換任一 SSR。<br>・精選召喚：抽中 SSR 時有 50% 為本週精選角色。<br>・重複角色轉為碎片（R 5／SR 20／SSR 50）與契約之心。</p>
<p class="dim">本作沒有任何真實金錢付費，魔晶石全部來自遊玩與學習。</p></div>`, buttons: [{ label: '了解', cls: 'primary', value: 1 }] }),
      refresh: () => { if (refreshStore()) { sfx('buy'); changed('shop'); } else { sfx('error'); toast('魔晶石不足', 'bad'); } },
      buy: (b) => {
        const got = buyStore(+b.dataset.i);
        if (!got) { sfx('error'); toast('貨幣不足', 'bad'); return; }
        sfx('buy'); changed('shop'); toast('購買成功', 'good');
      },
      mbuy: (b) => {
        const got = buyMerchant(+b.dataset.i);
        if (!got) { sfx('error'); toast('貨幣不足', 'bad'); return; }
        sfx('buy'); changed('shop');
        modal({ title: '購買成功', body: rewardList(got, { big: true }), buttons: [{ label: '好', cls: 'primary', value: 1 }] });
      },
      skin: async (b) => {
        const def = HERO_MAP[b.dataset.id];
        if (!(await confirmBox(`以 ${SKIN_PRICE[def.rarity]} 魔晶石購買「${def.skin.zh}」（${def.zh}）？`))) return;
        if (!buySkin(def.id)) { sfx('error'); toast('魔晶石不足', 'bad'); return; }
        sfx('buy'); changed('shop');
        if (S.d.heroes[def.id]) S.d.heroes[def.id].skin = def.skin.id;
        modal({ title: '獲得時裝！', body: `<div class="celeb"><img src="${heroImageURL(def, { skin: def.skin.id, aura: true, expr: 'happy' })}"><p><b>${esc(def.skin.zh)}</b></p></div>`, buttons: [{ label: '太棒了', cls: 'primary', value: 1 }] });
      },
      excur: (b) => { exCur = b.dataset.c; sfx('tab'); render(); },
      hshard: (b) => {
        const got = buyShards(b.dataset.id, +b.dataset.n, 'hearts');
        if (!got) { sfx('error'); toast('契約之心不足', 'bad'); return; }
        sfx('buy'); changed('shop'); toast(`獲得 ${HERO_MAP[b.dataset.id].zh} 碎片 ×${b.dataset.n}`, 'good');
      },
      ex: (b) => {
        const it = exchangeList(exCur)[+b.dataset.i];
        const got = buyExchange(it);
        if (!got) { sfx('error'); toast('貨幣不足或已達購買上限', 'bad'); return; }
        sfx('buy'); changed('shop'); toast('兌換成功', 'good');
      },
      pclaim: (b) => {
        const got = claimPass(+b.dataset.t);
        if (!got) return;
        sfx('reward'); changed('pass');
        modal({ title: '通行證獎勵', body: rewardList(got, { big: true }), buttons: [{ label: '好', cls: 'primary', value: 1 }] });
      },
      pall: () => {
        const p = passState();
        const got = [];
        for (let t = 1; t <= p.tier; t++) if (!p.claimed.includes(t)) got.push(...(claimPass(t) || []));
        if (!got.length) return;
        sfx('reward'); changed('pass');
        modal({ title: '通行證獎勵', body: rewardList(mergeRewards(got), { big: true }), buttons: [{ label: '好', cls: 'primary', value: 1 }] });
      },
    });
    return {
      refresh: () => { if (tab === 'smith' && smith) smith.refresh(); else render(); },
      destroy: () => { clearInterval(timer); if (smith && smith.destroy) smith.destroy(); },
    };
    void ITEMS; void itemIcon; void stars; void emptyState; void go; void RARITY;
  },
});
