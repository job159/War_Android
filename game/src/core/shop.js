// Shops: general store (daily stock, gold), mysterious merchant (timed discounts), heart / arena /
// tower exchanges, boutique (skins). Purchases: pay(cost) then grant(bundle).
import { S, pay, grant, canPay } from './state.js';
import { HEROES, HERO_MAP, heroesByRarity } from './data/heroes.js';
import { makeRng, randomSeed } from './rng.js';
import { makeGear, rollRarity, tierForLevel } from './gear.js';
import { dayKey, weekKey } from './util.js';

// ------------------------------------------------------------------ general store
const STORE_POOL = [
  { give: { expS: 5 }, cost: { gold: 3000 }, w: 10 }, { give: { expM: 3 }, cost: { gold: 8000 }, w: 8 }, { give: { expL: 1 }, cost: { gold: 15000 }, w: 4 },
  { give: { stone: 5 }, cost: { gold: 5000 }, w: 9 }, { give: { stone: 12 }, cost: { gold: 11000 }, w: 4 }, { give: { skillBook: 2 }, cost: { gold: 9000 }, w: 6 },
  { give: { lucky: 1 }, cost: { gold: 12000 }, w: 3 }, { give: { protect: 1 }, cost: { gems: 80 }, w: 2 },
  { give: { gift_cake: 2 }, cost: { gold: 4000 }, w: 5 }, { give: { gift_flower: 2 }, cost: { gold: 6000 }, w: 4 }, { give: { gift_book: 1 }, cost: { gold: 6000 }, w: 4 },
  { give: { shardR: 5 }, cost: { gold: 6000 }, w: 6 }, { give: { shardSR: 3 }, cost: { gold: 18000 }, w: 3 }, { give: { gearBox: 1 }, cost: { gold: 10000 }, w: 5 },
];
export const STORE_SIZE = 8;
export const refreshCost = (n) => [20, 40, 60, 100, 150][Math.min(4, n)];

function resolveSpecial(give, rng) {
  // shardR / shardSR / gearBox are rolled when the stock is generated so the player sees what they buy
  const out = { ...give };
  if (out.shardR) { const id = rng.pick(heroesByRarity('R')).id; out.shards = { [id]: out.shardR }; delete out.shardR; }
  if (out.shardSR) { const id = rng.pick(heroesByRarity('SR')).id; out.shards = { [id]: out.shardSR }; delete out.shardSR; }
  if (out.gearBox) { out.gear = [makeGear(rng, { tier: tierForLevel(S.d.profile.level), rarity: rollRarity(rng, 'forge') })]; delete out.gearBox; }
  return out;
}

export function storeStock() {
  const sh = S.d.shop;
  if (sh.day !== dayKey() || !sh.stock) { sh.day = dayKey(); sh.refresh = 0; sh.stock = rollStore(); }
  return sh.stock;
}

function rollStore() {
  const rng = makeRng(randomSeed());
  const out = [];
  const pool = STORE_POOL.slice();
  for (let i = 0; i < STORE_SIZE && pool.length; i++) {
    const total = pool.reduce((a, x) => a + x.w, 0);
    let r = rng() * total;
    let k = 0;
    for (; k < pool.length - 1; k++) { r -= pool[k].w; if (r <= 0) break; }
    const it = pool.splice(k, 1)[0];
    out.push({ give: resolveSpecial(it.give, rng), cost: it.cost, sold: false });
  }
  return out;
}

export function refreshStore() {
  const sh = S.d.shop;
  storeStock();
  const c = refreshCost(sh.refresh);
  if (!pay({ gems: c })) return false;
  sh.refresh++;
  sh.stock = rollStore();
  return true;
}

export function buyStore(i) {
  const it = storeStock()[i];
  if (!it || it.sold) return null;
  if (!pay(it.cost)) return null;
  it.sold = true;
  return grant(it.give);
}

// ------------------------------------------------------------------ mysterious merchant (1 hour, discounts)
export function rollMerchant() {
  const rng = makeRng(randomSeed());
  const tier = tierForLevel(S.d.profile.level);
  const ssr = heroesByRarity('SSR');
  const offers = [
    { give: { shards: { [rng.pick(ssr).id]: 10 } }, cost: { gems: 300 }, was: { gems: 600 } },
    { give: { gear: [makeGear(rng, { tier, rarity: 4 })] }, cost: { gems: 400 }, was: { gems: 800 } },
    { give: { gear: [makeGear(rng, { tier, rarity: 3 })] }, cost: { gold: 60000 }, was: { gold: 120000 } },
    { give: { expL: 5 }, cost: { gold: 45000 }, was: { gold: 75000 } },
    { give: { crystal: 1 }, cost: { gems: 250 }, was: { gems: 500 } },
    { give: { ticket: 1 }, cost: { gems: 100 }, was: { gems: 150 } },
    { give: { protect: 2, lucky: 2 }, cost: { gems: 120 }, was: { gems: 240 } },
    { give: { gift_gem: 1 }, cost: { gems: 150 }, was: { gems: 300 } },
  ];
  rng.shuffle(offers);
  S.d.merchant = { until: Date.now() + 3600e3, stock: offers.slice(0, 6).map((o) => ({ ...o, sold: false })) };
}

export function merchantActive() {
  return S.d.merchant.until > Date.now() && S.d.merchant.stock;
}

export function buyMerchant(i) {
  if (!merchantActive()) return null;
  const it = S.d.merchant.stock[i];
  if (!it || it.sold || !pay(it.cost)) return null;
  it.sold = true;
  return grant(it.give);
}

// ------------------------------------------------------------------ exchanges
export const HEART_PRICE = { R: 2, SR: 6, SSR: 15 }; // hearts per shard

export function heartShopList() {
  return HEROES.map((h) => ({ id: h.id, rarity: h.rarity, price: HEART_PRICE[h.rarity] }));
}

export function buyShards(id, n, currency = 'hearts') {
  const def = HERO_MAP[id];
  const price = (currency === 'hearts' ? HEART_PRICE[def.rarity] : currency === 'arena' ? HEART_PRICE[def.rarity] * 8 : HEART_PRICE[def.rarity] * 6) * n;
  if (!pay({ [currency]: price })) return null;
  return grant({ shards: { [id]: n } });
}

/** Weekly arena / tower stock (fixed items + 3 featured SSR shards). */
export function exchangeList(currency) {
  const rng = makeRng(weekKey() + currency);
  const ssr = rng.shuffle(heroesByRarity('SSR').slice()).slice(0, 3);
  if (currency === 'arena') {
    return [
      ...ssr.map((h) => ({ id: 'a_' + h.id, give: { shards: { [h.id]: 5 } }, cost: { arena: 600 }, limit: 4 })),
      { id: 'a_gems', give: { gems: 100 }, cost: { arena: 400 }, limit: 5 },
      { id: 'a_crystal', give: { crystal: 1 }, cost: { arena: 1200 }, limit: 2 },
      { id: 'a_protect', give: { protect: 1 }, cost: { arena: 500 }, limit: 3 },
      { id: 'a_expL', give: { expL: 2 }, cost: { arena: 300 }, limit: 10 },
      { id: 'a_ticket', give: { ticket: 1 }, cost: { arena: 900 }, limit: 2 },
    ];
  }
  return [
    ...ssr.map((h) => ({ id: 'm_' + h.id, give: { shards: { [h.id]: 5 } }, cost: { medal: 500 }, limit: 4 })),
    { id: 'm_book', give: { skillBook: 3 }, cost: { medal: 200 }, limit: 10 },
    { id: 'm_lucky', give: { lucky: 2 }, cost: { medal: 250 }, limit: 5 },
    { id: 'm_gift', give: { gift_gem: 1 }, cost: { medal: 400 }, limit: 3 },
    { id: 'm_crystal', give: { crystal: 1 }, cost: { medal: 1000 }, limit: 2 },
    { id: 'm_stone', give: { stone: 10 }, cost: { medal: 150 }, limit: 10 },
  ];
}

export function exchangeBought(id) {
  const b = S.d.shop.bought;
  const wk = weekKey();
  if (b.__week !== wk) { for (const k in b) delete b[k]; b.__week = wk; }
  return b[id] || 0;
}

export function buyExchange(item) {
  if (exchangeBought(item.id) >= item.limit) return null;
  if (!pay(item.cost)) return null;
  S.d.shop.bought[item.id] = exchangeBought(item.id) + 1;
  return grant(item.give);
}

// ------------------------------------------------------------------ boutique
export const SKIN_PRICE = { R: 300, SR: 500, SSR: 800 };
export function buySkin(heroId) {
  const def = HERO_MAP[heroId];
  if (!def || S.d.skins.includes(def.skin.id)) return false;
  if (!pay({ gems: SKIN_PRICE[def.rarity] })) return false;
  S.d.skins.push(def.skin.id);
  return true;
}

export { canPay };
