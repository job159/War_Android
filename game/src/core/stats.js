// Unit stats: heroes (level, stars, gear, bond) and enemies (level, elite/boss).
import { ROLES, RARITY, STAR_MULT } from './data/elements.js';

export const levelMult = (lv) => 1 + 0.08 * (Math.max(1, lv) - 1);

/** Gear stat keys: flat hp/atk/def, percentages hpP/atkP/defP/spd/energy, crit and critDmg as fractions. */
export const STAT_ZH = {
  hp: '生命', atk: '攻擊', def: '防禦', hpP: '生命%', atkP: '攻擊%', defP: '防禦%', spd: '速度%', crit: '爆擊率', critDmg: '爆擊傷害', energy: '充能效率',
};
export const PCT_KEYS = new Set(['hpP', 'atkP', 'defP', 'spd', 'crit', 'critDmg', 'energy']);

export function fmtStat(k, v) {
  return PCT_KEYS.has(k) ? `+${(v * 100).toFixed(1).replace(/\.0$/, '')}%` : `+${Math.round(v)}`;
}

/**
 * @param def hero definition (data/heroes.js)
 * @param st  saved hero state { lv, star, bond, skill: {skill, ult}, equip: {slot: gearUid} }
 * @param gearById  map uid -> gear item (for equip lookups)
 */
export function heroStats(def, st, gearById = {}) {
  const role = ROLES[def.role];
  const m = def.mods || {};
  const lv = st.lv || 1;
  const star = st.star || RARITY[def.rarity].stars;
  const k = RARITY[def.rarity].mult * STAR_MULT[star] * levelMult(lv);
  const bond = 1 + 0.01 * Math.max(0, (st.bond || 1) - 1);
  const add = { hp: 0, atk: 0, def: 0, hpP: 0, atkP: 0, defP: 0, spd: 0, crit: 0, critDmg: 0, energy: 0 };
  if (st.equip) {
    for (const slot in st.equip) {
      const g = gearById[st.equip[slot]];
      if (!g) continue;
      for (const s of gearStats(g)) add[s.k] = (add[s.k] || 0) + s.v;
    }
  }
  const hp = Math.round((role.base.hp * (m.hp || 1) * k * bond + add.hp) * (1 + add.hpP));
  const atk = Math.round((role.base.atk * (m.atk || 1) * k * bond + add.atk) * (1 + add.atkP));
  const dfn = Math.round((role.base.def * (m.def || 1) * k * bond + add.def) * (1 + add.defP));
  const spd = Math.round(role.base.spd * (m.spd || 1) * (1 + add.spd));
  return {
    hp, atk, def: dfn, spd,
    crit: Math.min(0.75, 0.05 + add.crit),
    critDmg: 1.5 + add.critDmg,
    energy: 1 + add.energy,
    lv, star,
    skillLv: (st.skill && st.skill.skill) || 1,
    ultLv: (st.skill && st.skill.ult) || 1,
  };
}

export function power(stats) {
  const p = stats.hp * 0.12 + stats.atk * 3.2 + stats.def * 2.4;
  const mult = (1 + stats.crit * (stats.critDmg - 1)) * (stats.spd / 100) * (1 + 0.04 * ((stats.skillLv || 1) + (stats.ultLv || 1) - 2));
  return Math.round(p * mult);
}

// ------------------------------------------------------------------ gear
// main stat grows +6% per enhancement level; +10 / +15 also boost substats.
export function gearStats(g) {
  const out = [{ k: g.main.k, v: g.main.v * (1 + 0.06 * (g.lvl || 0)) }];
  const subMult = 1 + ((g.lvl || 0) >= 10 ? 0.25 : 0) + ((g.lvl || 0) >= 15 ? 0.35 : 0);
  for (const s of g.subs || []) out.push({ k: s.k, v: s.v * subMult });
  return out;
}

// ------------------------------------------------------------------ enemies
// `scale` is the per-chapter difficulty knob (data/stages.js); balance with `npm run sim -- --sweep`.
export function enemyStats(def, level, { elite = false, boss = false, scale = 1 } = {}) {
  const role = ROLES[def.role] || ROLES.striker;
  const m = def.mods || {};
  // prog() tracks the stars / rarity / gear a player is expected to have at this point of the game
  const prog = 1 + 0.024 * level;
  const k = levelMult(level) * prog * scale;
  // bosses are tanky whatever their role; regular mobs a little softer so normal stages stay short
  const hpBase = boss ? ROLES.guardian.base.hp : role.base.hp;
  let hp = hpBase * (m.hp || 1) * k * (boss ? 0.95 * 3.2 : elite ? 0.95 * 1.6 : 0.72);
  let atk = role.base.atk * (m.atk || 1) * k * 1.3;
  let dfn = role.base.def * (m.def || 1) * k * 0.9;
  if (elite) { atk *= 1.15; dfn *= 1.1; }
  if (boss) { atk *= 1.2; dfn *= 1.1; }
  return {
    hp: Math.round(hp), atk: Math.round(atk), def: Math.round(dfn), spd: Math.round(role.base.spd * (m.spd || 1)),
    crit: 0.05, critDmg: 1.5, energy: 1, lv: level, skillLv: 1 + Math.floor(level / 15), ultLv: 1 + Math.floor(level / 15),
  };
}
