// Builds battle unit specs from hero / enemy definitions.
import { HERO_MAP } from '../data/heroes.js';
import { ENEMIES } from '../data/enemies.js';
import { heroStats, enemyStats } from '../stats.js';

export function heroSpec(heroId, st, gearById = {}, { fairLevel = 0 } = {}) {
  const def = HERO_MAP[heroId];
  const state = fairLevel ? { ...st, lv: fairLevel, equip: {}, skill: { skill: Math.min(10, Math.ceil(fairLevel / 6)), ult: Math.min(10, Math.ceil(fairLevel / 6)) } } : st;
  const stats = heroStats(def, state, fairLevel ? {} : gearById);
  const awakened = (st.star || 0) >= 6;
  return {
    key: heroId, kind: 'hero', name: def.name, zh: def.zh, element: def.element, role: def.role,
    stats, passive: def.passive,
    skills: { normal: def.normal, skill: def.skill, ult: awakened ? awakenUlt(def.ult) : def.ult },
    startEnergy: 0, skin: st.skin || null,
  };
}

/** ★6 awakening: ultimate damage / healing +25%. */
function awakenUlt(ult) {
  return {
    ...ult,
    parts: ult.parts.map((p) => ({
      ...p,
      fx: p.fx.map((f) => {
        const o = { ...f };
        for (const k of ['dmg', 'heal', 'shield', 'shieldPct']) if (o[k] != null) o[k] = +(o[k] * 1.25).toFixed(3);
        return o;
      }),
    })),
  };
}

export function enemySpec({ id, element, level, elite, boss, scale = 1 }) {
  const def = ENEMIES[id];
  const stats = enemyStats(def, level, { elite, boss, scale });
  return {
    key: id, kind: 'enemy', name: def.en, zh: def.zh, element: element || def.element || 'dark', role: def.role,
    stats, passive: null, boss: !!boss || !!def.boss, elite: !!elite,
    skills: { normal: def.normal, skill: def.skill, ult: def.ult, charge: boss || def.boss ? def.charge : null },
    startEnergy: 0,
  };
}

/** A team as unit specs, with guardians and strikers moved to the front row when slots allow. */
export function orderTeam(specs) {
  return specs.filter(Boolean);
}
