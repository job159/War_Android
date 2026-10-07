// Elements, roles and rarities.
// Elemental wheel: 火 > 風 > 地 > 水 > 火 ; 光 ⇄ 闇 hit each other hard.

export const ELEMENTS = {
  fire: { id: 'fire', zh: '火', en: 'Fire', color: '#ff5a3c', glow: '#ffb35c', dark: '#7a1608' },
  water: { id: 'water', zh: '水', en: 'Water', color: '#3ca8ff', glow: '#9ee0ff', dark: '#0b3a7a' },
  wind: { id: 'wind', zh: '風', en: 'Wind', color: '#36d68a', glow: '#b6ffd8', dark: '#0b5a33' },
  earth: { id: 'earth', zh: '地', en: 'Earth', color: '#d39a45', glow: '#ffd99a', dark: '#5a3510' },
  light: { id: 'light', zh: '光', en: 'Light', color: '#ffd84a', glow: '#fff6c4', dark: '#8a6a06' },
  dark: { id: 'dark', zh: '闇', en: 'Dark', color: '#a45cff', glow: '#dcb8ff', dark: '#33105e' },
};
export const ELEMENT_IDS = Object.keys(ELEMENTS);

const BEATS = { fire: 'wind', wind: 'earth', earth: 'water', water: 'fire' };
export const ADV_MULT = 1.25;
export const DISADV_MULT = 0.8;

/** Damage multiplier for an attack of element `atk` against a target of element `def`. */
export function elementMult(atk, def) {
  if (!atk || !def) return 1;
  if ((atk === 'light' && def === 'dark') || (atk === 'dark' && def === 'light')) return ADV_MULT;
  if (BEATS[atk] === def) return ADV_MULT;
  if (BEATS[def] === atk) return DISADV_MULT;
  return 1;
}

/** Element this one is strong against (for UI hints). */
export const strongAgainst = (el) => (el === 'light' ? 'dark' : el === 'dark' ? 'light' : BEATS[el]);
export const weakAgainst = (el) => {
  if (el === 'light') return 'dark';
  if (el === 'dark') return 'light';
  return Object.keys(BEATS).find((k) => BEATS[k] === el);
};

// Base stats per role at level 1 before rarity / star multipliers. spd 100 = one action per 1.6 s.
export const ROLES = {
  guardian: { id: 'guardian', zh: '守護', en: 'Guardian', icon: '🛡', row: 'front', base: { hp: 4600, atk: 72, def: 62, spd: 92 }, desc: '高血量高防禦，站在前排保護隊友' },
  striker: { id: 'striker', zh: '斬擊', en: 'Striker', icon: '⚔', row: 'front', base: { hp: 3400, atk: 112, def: 38, spd: 106 }, desc: '近戰物理輸出，攻速快、爆發高' },
  caster: { id: 'caster', zh: '魔導', en: 'Caster', icon: '✦', row: 'back', base: { hp: 2700, atk: 124, def: 26, spd: 94 }, desc: '後排魔法輸出，擅長範圍攻擊' },
  ranger: { id: 'ranger', zh: '射手', en: 'Ranger', icon: '➶', row: 'back', base: { hp: 2900, atk: 108, def: 30, spd: 112 }, desc: '遠程狙擊，優先打擊脆弱目標' },
  healer: { id: 'healer', zh: '治癒', en: 'Healer', icon: '✚', row: 'back', base: { hp: 3100, atk: 92, def: 33, spd: 96 }, desc: '治療與護盾，延長隊伍的生存' },
  support: { id: 'support', zh: '輔助', en: 'Support', icon: '♪', row: 'back', base: { hp: 3300, atk: 88, def: 40, spd: 100 }, desc: '增益隊友、削弱敵人、加速充能' },
};
export const ROLE_IDS = Object.keys(ROLES);

export const RARITY = {
  R: { id: 'R', stars: 1, zh: 'R', mult: 1.0, color: '#a9c1d9', shardsOnDupe: 5, heartsOnDupe: 1 },
  SR: { id: 'SR', stars: 2, zh: 'SR', mult: 1.12, color: '#ffcf4d', shardsOnDupe: 20, heartsOnDupe: 10 },
  SSR: { id: 'SSR', stars: 3, zh: 'SSR', mult: 1.25, color: '#ff7ad9', shardsOnDupe: 50, heartsOnDupe: 50 },
};

/** Stat multiplier by star level ★1..★6. */
export const STAR_MULT = [0, 1.0, 1.1, 1.22, 1.36, 1.52, 1.72];
/** Shards needed to go from star s to s+1. */
export const STAR_COST = [0, 20, 40, 80, 150, 220];
export const STAR_GOLD = [0, 2000, 8000, 30000, 80000, 200000];
export const MAX_STAR = 6; // ★6 = awakening, SSR only
export const maxStarFor = (rarity) => (rarity === 'SSR' ? 6 : 5);

export const STATUS_INFO = {
  burn: { zh: '燃燒', icon: '🔥', bad: true },
  poison: { zh: '中毒', icon: '☠', bad: true },
  stun: { zh: '暈眩', icon: '💫', bad: true },
  freeze: { zh: '冰凍', icon: '❄', bad: true },
  atkUp: { zh: '攻擊↑', icon: '⚔', bad: false },
  atkDown: { zh: '攻擊↓', icon: '⚔', bad: true },
  defUp: { zh: '防禦↑', icon: '🛡', bad: false },
  defDown: { zh: '防禦↓', icon: '🛡', bad: true },
  spdUp: { zh: '速度↑', icon: '➚', bad: false },
  spdDown: { zh: '速度↓', icon: '➘', bad: true },
  regen: { zh: '再生', icon: '✚', bad: false },
  taunt: { zh: '嘲諷', icon: '❗', bad: false },
  silence: { zh: '沉默', icon: '🔇', bad: true },
  broken: { zh: '破防', icon: '💥', bad: true },
  critUp: { zh: '爆擊↑', icon: '✦', bad: false },
};
