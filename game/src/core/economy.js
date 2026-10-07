// Progression curves, costs and battle rewards.
import { RARITY, STAR_COST, STAR_GOLD } from './data/elements.js';

export const MAX_LEVEL = 100;
/** Heroes can be at most 4 levels above the account (keeps potions useful from the first minute). */
export const heroLevelCap = (playerLv) => Math.min(MAX_LEVEL, playerLv + 4);
export const MAX_SKILL = 10;
export const MAX_BOND = 10;

export const playerExpToNext = (lv) => Math.round(40 + 4 * Math.pow(lv, 1.55));
export const heroExpToNext = (lv) => Math.round(30 + 5 * Math.pow(lv, 1.65));
export const bondExpToNext = (b) => 80 + b * 70;

/** Skill level is capped by hero level: 1 + floor(lv / 10), max 10. */
export const skillCap = (heroLv) => Math.min(MAX_SKILL, 1 + Math.floor(heroLv / 10));
export const skillCost = (lv) => ({ gold: 600 * lv * lv, book: lv <= 2 ? 1 : lv <= 5 ? 2 : lv <= 8 ? 4 : 6 });

export const starCost = (star) => ({ shards: STAR_COST[star] || 999, gold: STAR_GOLD[star] || 0, crystal: star === 5 ? 3 : 0 });
export const dupeShards = (rarity) => RARITY[rarity].shardsOnDupe;
export const dupeHearts = (rarity) => RARITY[rarity].heartsOnDupe;

/** Battle rewards before item drops. */
export function battleRewards({ level, kind = 'normal', correct = 0, stars = 0, firstClear = false, win = true, mult = 1 }) {
  const kindMult = kind === 'boss' ? 2.2 : kind === 'elite' ? 1.5 : 1;
  const perAnswer = Math.round(4 + level * 0.35);
  // per-answer gold is paid live during the battle (goldPerAnswer); this is the victory bonus only
  const gold = win ? Math.round((60 + level * 6) * kindMult * mult) : 0;
  const heroExp = win ? Math.round((40 + level * 6) * kindMult * mult) : Math.round((20 + level * 2) * mult);
  const playerExp = win ? Math.round((20 + level * 1.6) * kindMult + correct * 2) : Math.round(correct * 2);
  let gems = 0;
  if (win && firstClear) gems += kind === 'boss' ? 100 : kind === 'elite' ? 40 : 20;
  return { gold, heroExp, playerExp, gems, perAnswer, stars };
}

/** Gold paid out as coins fly from each correct answer during battle. */
export const goldPerAnswer = (level) => Math.round(4 + level * 0.35);

export const GACHA_COST = { single: 150, ten: 1500, goldSingle: 5000, goldTen: 45000 };
export const SPARK_POINTS = 200;

export function playerLevelReward(lv) {
  return { gems: 50 + (lv % 10 === 0 ? 250 : 0), gold: 1000 * lv };
}
