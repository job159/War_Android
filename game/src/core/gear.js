// Gear generation, enhancement and dismantling.
import { GEAR_SLOTS, SLOT_INFO, GEAR_RARITY, TIER_NAMES, ENHANCE_RATE, ENHANCE_DOWNGRADE_FROM, BLESS_PER_FAIL, MAX_ENHANCE, MAX_TIER } from './data/items.js';
import { uid } from './util.js';

const SUB_POOL = {
  atk: (t) => 4 + t * 3.2, hp: (t) => 50 + t * 42, def: (t) => 3 + t * 2.4,
  atkP: (t) => 0.015 + t * 0.004, hpP: (t) => 0.015 + t * 0.004, defP: (t) => 0.018 + t * 0.004,
  crit: (t) => 0.012 + t * 0.002, critDmg: (t) => 0.03 + t * 0.005, spd: (t) => 0.01 + t * 0.002, energy: (t) => 0.015 + t * 0.003,
};

function mainFor(slot, t, rm, rng) {
  const g = Math.pow(t, 1.25);
  if (slot === 'weapon') return { k: 'atk', v: Math.round(14 * g * rm) };
  if (slot === 'armor') return { k: 'hp', v: Math.round(190 * g * rm) };
  if (slot === 'accessory') {
    const k = rng.pick(['crit', 'critDmg', 'spd']);
    const s = Math.sqrt(rm);
    return { k, v: +((k === 'crit' ? 0.03 + 0.006 * t : k === 'critDmg' ? 0.08 + 0.016 * t : 0.03 + 0.005 * t) * s).toFixed(4) };
  }
  const k = rng.pick(['atkP', 'hpP', 'defP', 'energy']);
  const s = Math.pow(rm, 0.6);
  return { k, v: +((k === 'energy' ? 0.04 + 0.006 * t : 0.04 + 0.008 * t) * s).toFixed(4) };
}

export function makeGear(rng, { slot, tier = 1, rarity = 0 } = {}) {
  slot = slot || rng.pick(GEAR_SLOTS);
  const t = Math.max(1, Math.min(MAX_TIER, tier));
  const R = GEAR_RARITY[rarity];
  const main = mainFor(slot, t, R.mult, rng);
  const keys = Object.keys(SUB_POOL).filter((k) => k !== main.k);
  rng.shuffle(keys);
  const subs = keys.slice(0, R.subs).map((k) => {
    const base = SUB_POOL[k](t) * (0.8 + rng() * 0.45);
    return { k, v: k === 'atk' || k === 'hp' || k === 'def' ? Math.round(base) : +base.toFixed(4) };
  });
  return { uid: uid('g'), slot, tier: t, rarity, lvl: 0, main, subs, bless: 0, locked: false, name: TIER_NAMES[t] + SLOT_INFO[slot].suffix };
}

/** Drop rarity weights by source. */
export const DROP_TABLES = {
  normal: [60, 30, 9, 1, 0],
  elite: [30, 42, 22, 5.5, 0.5],
  boss: [5, 35, 40, 17, 3],
  forge: [0, 45, 38, 14, 3],
  forgeHigh: [0, 0, 50, 40, 10],
  merchant: [0, 0, 30, 55, 15],
};

export function rollRarity(rng, table) {
  const w = DROP_TABLES[table] || DROP_TABLES.normal;
  const total = w.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return 0;
}

export const tierForLevel = (lv) => Math.max(1, Math.min(MAX_TIER, Math.ceil(lv / 10)));

// ------------------------------------------------------------------ enhancement
export function enhanceCost(g) {
  return { gold: Math.round(150 * g.tier * (g.lvl + 1) * (1 + g.rarity * 0.25)), stone: 1 + Math.floor(g.lvl / 3) + (g.lvl >= 10 ? 2 : 0) };
}

export function enhanceChance(g, { lucky = false } = {}) {
  if (g.lvl >= MAX_ENHANCE) return 0;
  return Math.min(1, ENHANCE_RATE[g.lvl] + (g.bless || 0) + (lucky ? 0.15 : 0));
}

/** Rolls one enhancement attempt (costs are paid by the caller). Returns { ok, down, lvl }. */
export function rollEnhance(g, rng, { lucky = false, protect = false } = {}) {
  const p = enhanceChance(g, { lucky });
  if (rng() < p) {
    g.lvl++;
    g.bless = 0;
    return { ok: true, down: false, lvl: g.lvl };
  }
  g.bless = +((g.bless || 0) + BLESS_PER_FAIL).toFixed(3);
  let down = false;
  if (g.lvl >= ENHANCE_DOWNGRADE_FROM && !protect) { g.lvl--; down = true; }
  return { ok: false, down, lvl: g.lvl };
}

export function dismantleValue(g) {
  return { gold: Math.round(80 * g.tier * (1 + g.rarity) + 120 * g.lvl * g.tier), stone: g.rarity + Math.floor(g.lvl * 0.6) + (g.rarity >= 3 ? 2 : 0) };
}

export function gearScore(g) {
  // rough value for sorting / auto-equip
  const w = { atk: 3, hp: 0.25, def: 2.5, atkP: 900, hpP: 700, defP: 600, crit: 1200, critDmg: 500, spd: 1100, energy: 800 };
  let s = (w[g.main.k] || 1) * g.main.v * (1 + 0.06 * g.lvl);
  for (const x of g.subs) s += (w[x.k] || 1) * x.v * 0.8;
  return Math.round(s);
}
