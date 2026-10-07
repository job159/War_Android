// Save data and every mutation of it. The UI reads `S.d` and calls these helpers; `changed(topic)`
// notifies subscribers and schedules a debounced save to localStorage.
import { HERO_MAP } from './data/heroes.js';
import { RARITY, maxStarFor } from './data/elements.js';
import { ITEMS } from './data/items.js';
import { MAX_LEVEL, heroLevelCap, playerExpToNext, heroExpToNext, bondExpToNext, MAX_BOND, dupeShards, dupeHearts, playerLevelReward, skillCap, skillCost, starCost } from './economy.js';
import { dayKey } from './util.js';

export const SAVE_KEY = 'lexica.save.v1';
export const SAVE_VERSION = 1;

export function newSave() {
  const now = Date.now();
  return {
    v: SAVE_VERSION,
    created: now,
    profile: { name: '', level: 1, exp: 0, avatar: 'pebble', title: 'novice', frame: 'basic', secretary: 'pebble', onboarded: false },
    cur: { gold: 8000, gems: 3000, hearts: 0, arena: 0, medal: 0 },
    items: { expS: 10, expM: 2, stone: 10, skillBook: 3, gift_cake: 3, ticket: 1 },
    heroes: {
      pebble: heroState('pebble'), flint: heroState('flint'), spark: heroState('spark'), dew: heroState('dew'),
    },
    shards: {},
    skins: [],
    gear: [],
    team: { pve: ['pebble', 'flint', 'spark', 'dew'], pvp: ['pebble', 'flint', 'spark', 'dew'], arena: ['pebble', 'flint', 'spark', 'dew'] },
    campaign: { stars: {}, cleared: {} },
    tower: { floor: 1, best: 0 },
    dungeon: { day: '', runs: {} },
    raid: { week: '', best: 0, total: 0, claimed: [] },
    arena: { rank: 3000, best: 3000, day: '', tries: 0, log: [], opponents: null, oppDay: '' },
    pvp: { wins: 0, losses: 0, draws: 0, lastWinDay: '' },
    gacha: { pulls: 0, spark: 0, firstTen: true, freeDay: '', pity: 0, history: [] },
    shop: { day: '', stock: null, refresh: 0, bought: {} },
    merchant: { until: 0, stock: null },
    missions: { day: '', prog: {}, claimed: [], week: '', wprog: {}, wclaimed: [] },
    login: { last: '', streak: 0, total: 0, calDay: 0, claimedToday: false },
    achievements: { claimed: [], counters: {} },
    pass: { season: '', points: 0, claimed: [] },
    learn: { book: 'c', srs: {}, mistakes: {}, lessonsRead: [], examBest: {}, studyDays: [], milestones: 0, wordsSeen: 0 },
    stats: { battles: 0, wins: 0, answered: 0, correct: 0, maxCombo: 0, ults: 0, gachaSSR: 0, enhanceMax: 0 },
    flags: {},
    settings: { bgm: 'adventure', music: 0.6, sfx: 0.8, tts: true, ttsRate: 0.9, vib: true, fx: 'high', autoUlt: false, listen: false, speedHint: true },
    mail: [{ id: 'welcome', title: '歡迎來到萊克西卡！', body: '契約者，歡迎你。這是見面禮，請收下。\n每一個學會的單字，都會讓詞靈們變得更強。', gift: { gems: 1500, ticket: 10 }, at: now }],
  };
}

export function heroState(id) {
  const def = HERO_MAP[id];
  return { lv: 1, exp: 0, star: RARITY[def.rarity].stars, bond: 1, bondExp: 0, skill: { skill: 1, ult: 1 }, equip: {}, skin: null, got: Date.now() };
}

// ------------------------------------------------------------------ store

const listeners = new Set();
export const S = { d: null, dirty: false, saveTimer: 0, storage: null };

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function changed(topic = 'all') {
  for (const fn of [...listeners]) {
    try { fn(topic); } catch (e) { console.error(e); }
  }
  scheduleSave();
}

function scheduleSave() {
  S.dirty = true;
  clearTimeout(S.saveTimer);
  S.saveTimer = setTimeout(saveNow, 400);
}

export function saveNow() {
  clearTimeout(S.saveTimer);
  if (!S.d) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(S.d));
    S.dirty = false;
  } catch (e) {
    console.warn('save failed', e);
  }
}

export function loadSave() {
  let d = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) d = JSON.parse(raw);
  } catch (e) {
    console.warn('corrupt save, starting fresh', e);
  }
  S.d = migrate(d || newSave());
  return S.d;
}

/** Fills any field added in later versions so old saves keep working. */
function migrate(d) {
  const base = newSave();
  for (const k in base) {
    if (d[k] === undefined) d[k] = base[k];
    else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      for (const k2 in base[k]) if (d[k][k2] === undefined) d[k][k2] = base[k][k2];
    }
  }
  for (const id in d.heroes) {
    if (!HERO_MAP[id]) { delete d.heroes[id]; continue; }
    const h = d.heroes[id];
    const b = heroState(id);
    for (const k in b) if (h[k] === undefined) h[k] = b[k];
  }
  for (const k of ['pve', 'pvp', 'arena']) d.team[k] = (d.team[k] || []).filter((id) => d.heroes[id]);
  d.v = SAVE_VERSION;
  return d;
}

export function exportSave() {
  const json = JSON.stringify(S.d);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return 'LXC1' + btoa(bin);
}

export function importSave(code) {
  const s = String(code || '').trim();
  if (!s.startsWith('LXC1')) throw new Error('存檔代碼格式不正確');
  const bin = atob(s.slice(4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const d = JSON.parse(new TextDecoder().decode(bytes));
  if (!d || !d.profile || !d.heroes) throw new Error('存檔內容不完整');
  S.d = migrate(d);
  saveNow();
  changed('all');
}

export function resetSave() {
  S.d = newSave();
  saveNow();
  changed('all');
}

// ------------------------------------------------------------------ currency & items

export const cur = (k) => S.d.cur[k] || 0;
export const item = (k) => S.d.items[k] || 0;

export function addCur(k, n) {
  S.d.cur[k] = Math.max(0, (S.d.cur[k] || 0) + Math.round(n));
  if (k === 'gems' && n > 0) S.d.stats.gemsEarned = (S.d.stats.gemsEarned || 0) + n;
}

export function canPay(cost) {
  for (const k in cost) {
    if (!cost[k]) continue;
    if (k in S.d.cur) { if (cur(k) < cost[k]) return false; } else if (item(k) < cost[k]) return false;
  }
  return true;
}

/** Pays {gold: 100, stone: 2, ...}; returns false (and pays nothing) if anything is short. */
export function pay(cost) {
  if (!canPay(cost)) return false;
  for (const k in cost) {
    if (!cost[k]) continue;
    if (k in S.d.cur) S.d.cur[k] -= cost[k];
    else S.d.items[k] = item(k) - cost[k];
  }
  if (cost.gold) S.d.stats.goldSpent = (S.d.stats.goldSpent || 0) + cost.gold;
  return true;
}

export function addItem(k, n = 1) {
  S.d.items[k] = Math.max(0, item(k) + n);
  if (!S.d.items[k]) delete S.d.items[k];
}

/** Grants a reward bundle {gold, gems, hearts, arena, medal, <item>: n, shards: {heroId: n}, hero: id, gear: [...]}; returns a list for display. */
export function grant(bundle) {
  const out = [];
  if (!bundle) return out;
  for (const k in bundle) {
    const v = bundle[k];
    if (!v) continue;
    if (k in S.d.cur) { addCur(k, v); out.push({ k, n: v }); }
    else if (ITEMS[k]) { addItem(k, v); out.push({ k, n: v }); }
    else if (k === 'shards') for (const id in v) { addShards(id, v[id]); out.push({ k: 'shard', id, n: v[id] }); }
    else if (k === 'gear') for (const g of v) { S.d.gear.push(g); out.push({ k: 'gear', g }); }
    else if (k === 'hero') { const r = addHero(v); out.push({ k: 'hero', id: v, ...r }); }
    else if (k === 'playerExp') { const r = addPlayerExp(v); out.push({ k, n: v, ...r }); }
  }
  return out;
}

// ------------------------------------------------------------------ heroes

export const owned = (id) => !!S.d.heroes[id];
export const heroSt = (id) => S.d.heroes[id];

/** Adds a hero; a duplicate converts into shards + hearts. */
export function addHero(id) {
  const def = HERO_MAP[id];
  if (!def) return { dupe: false };
  if (S.d.heroes[id]) {
    const sh = dupeShards(def.rarity);
    const he = dupeHearts(def.rarity);
    addShards(id, sh);
    addCur('hearts', he);
    return { dupe: true, shards: sh, hearts: he };
  }
  S.d.heroes[id] = heroState(id);
  return { dupe: false, isNew: true };
}

export function addShards(id, n) {
  S.d.shards[id] = (S.d.shards[id] || 0) + n;
}

export function addHeroExp(id, n) {
  const h = S.d.heroes[id];
  if (!h) return 0;
  const cap = heroLevelCap(S.d.profile.level);
  let ups = 0;
  if (h.lv >= cap) { h.exp = Math.min(h.exp + n, heroExpToNext(h.lv) - 1); return 0; }
  h.exp += n;
  while (h.lv < cap && h.exp >= heroExpToNext(h.lv)) {
    h.exp -= heroExpToNext(h.lv);
    h.lv++;
    ups++;
  }
  if (h.lv >= cap) h.exp = Math.min(h.exp, heroExpToNext(h.lv) - 1);
  return ups;
}

/** EXP needed to reach the level cap from the current state. */
export function heroExpToCap(id) {
  const h = S.d.heroes[id];
  const cap = heroLevelCap(S.d.profile.level);
  let need = -h.exp;
  for (let l = h.lv; l < cap; l++) need += heroExpToNext(l);
  return Math.max(0, need);
}

export function addPlayerExp(n) {
  const p = S.d.profile;
  let ups = 0;
  const rewards = [];
  if (p.level >= MAX_LEVEL) return { ups: 0, rewards };
  p.exp += n;
  while (p.level < MAX_LEVEL && p.exp >= playerExpToNext(p.level)) {
    p.exp -= playerExpToNext(p.level);
    p.level++;
    ups++;
    const r = playerLevelReward(p.level);
    addCur('gems', r.gems);
    addCur('gold', r.gold);
    rewards.push({ level: p.level, ...r });
  }
  return { ups, rewards, level: p.level };
}

export function upgradeSkill(id, which) {
  const h = S.d.heroes[id];
  const lv = h.skill[which];
  if (lv >= skillCap(h.lv)) return { ok: false, why: '技能等級已達上限（提升角色等級可解鎖）' };
  const c = skillCost(lv);
  if (!pay({ gold: c.gold, skillBook: c.book })) return { ok: false, why: '材料不足' };
  h.skill[which]++;
  return { ok: true, lv: h.skill[which] };
}

export function starUp(id) {
  const h = S.d.heroes[id];
  const def = HERO_MAP[id];
  if (h.star >= maxStarFor(def.rarity)) return { ok: false, why: '已達最高星級' };
  const c = starCost(h.star);
  if ((S.d.shards[id] || 0) < c.shards) return { ok: false, why: `碎片不足（${S.d.shards[id] || 0}/${c.shards}）` };
  if (!pay({ gold: c.gold, crystal: c.crystal })) return { ok: false, why: c.crystal ? '金幣或覺醒結晶不足' : '金幣不足' };
  S.d.shards[id] -= c.shards;
  h.star++;
  return { ok: true, star: h.star };
}

export function giveGift(id, giftKey) {
  const h = S.d.heroes[id];
  const def = HERO_MAP[id];
  const g = ITEMS[giftKey];
  if (!g || !g.bond || item(giftKey) <= 0) return { ok: false };
  if (h.bond >= MAX_BOND) return { ok: false, why: '羈絆已達上限' };
  addItem(giftKey, -1);
  const liked = g.likes && g.likes.includes(def.element);
  let xp = Math.round(g.bond * (liked ? 1.5 : 1));
  h.bondExp += xp;
  let ups = 0;
  while (h.bond < MAX_BOND && h.bondExp >= bondExpToNext(h.bond)) {
    h.bondExp -= bondExpToNext(h.bond);
    h.bond++;
    ups++;
  }
  if (h.bond >= MAX_BOND) h.bondExp = 0;
  return { ok: true, xp, liked, ups, bond: h.bond };
}

// ------------------------------------------------------------------ gear

export const gearById = () => Object.fromEntries(S.d.gear.map((g) => [g.uid, g]));
export const findGear = (uid) => S.d.gear.find((g) => g.uid === uid);
export function gearOwner(uid) {
  for (const id in S.d.heroes) for (const slot in S.d.heroes[id].equip) if (S.d.heroes[id].equip[slot] === uid) return id;
  return null;
}

export function equip(heroId, uid) {
  const g = findGear(uid);
  if (!g) return;
  const prev = gearOwner(uid);
  if (prev) delete S.d.heroes[prev].equip[g.slot];
  S.d.heroes[heroId].equip[g.slot] = uid;
}

export function unequip(heroId, slot) {
  delete S.d.heroes[heroId].equip[slot];
}

export function removeGear(uid) {
  const owner = gearOwner(uid);
  if (owner) for (const s in S.d.heroes[owner].equip) if (S.d.heroes[owner].equip[s] === uid) delete S.d.heroes[owner].equip[s];
  S.d.gear = S.d.gear.filter((g) => g.uid !== uid);
}

// ------------------------------------------------------------------ daily bookkeeping

export function today() { return dayKey(); }

/** Records study activity for streaks; returns true the first time today. */
export function markStudyDay() {
  const t = today();
  const days = S.d.learn.studyDays;
  if (days[days.length - 1] === t) return false;
  days.push(t);
  if (days.length > 400) days.splice(0, days.length - 400);
  return true;
}

export function studyStreak() {
  const days = S.d.learn.studyDays;
  if (!days.length) return 0;
  let streak = 0;
  let d = new Date(today() + 'T00:00:00');
  const set = new Set(days);
  if (!set.has(today())) d.setDate(d.getDate() - 1);
  for (;;) {
    const k = dayKey(d.getTime());
    if (!set.has(k)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
