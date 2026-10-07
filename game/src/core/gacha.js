// Summoning. Rates: SSR 3% / SR 18% / R 79%; a ten-pull guarantees SR or better; the very first
// ten-pull guarantees an SSR; 90 pulls without an SSR guarantee one; every pull adds a contract point
// (200 points = any SSR of your choice).
import { HEROES, heroesByRarity } from './data/heroes.js';
import { makeRng, randomSeed } from './rng.js';
import { makeGear, rollRarity, tierForLevel } from './gear.js';
import { weekKey } from './util.js';

export const RATES = { SSR: 0.03, SR: 0.18, R: 0.79 };
export const PITY = 90;

export function featuredHero(t = Date.now()) {
  const ssr = heroesByRarity('SSR');
  const wk = weekKey(t);
  const n = parseInt(wk.slice(-2), 10) + parseInt(wk.slice(0, 4), 10) * 53;
  return ssr[n % ssr.length].id;
}

export const BANNERS = {
  standard: { id: 'standard', zh: '常駐召喚', en: 'Covenant Summon', desc: '所有詞靈皆可能出現。SSR 機率 3%。' },
  featured: { id: 'featured', zh: '精選召喚', en: 'Spotlight Summon', desc: '本週精選 SSR 機率提升！（SSR 3%，其中一半為精選角色）' },
  gold: { id: 'gold', zh: '金幣召喚', en: 'Gold Summon', desc: '使用金幣召喚裝備、材料與角色碎片。' },
};

function rollRarityHero(rng, forceMin) {
  let r = rng();
  let rar = r < RATES.SSR ? 'SSR' : r < RATES.SSR + RATES.SR ? 'SR' : 'R';
  if (forceMin === 'SR' && rar === 'R') rar = rng() < RATES.SSR / (RATES.SSR + RATES.SR) ? 'SSR' : 'SR';
  if (forceMin === 'SSR') rar = 'SSR';
  return rar;
}

/**
 * Hero pulls. Mutates the gacha state (pulls, spark, pity, firstTen); the caller grants heroes.
 * @returns {Array<{id:string, rarity:string}>}
 */
export function pullHeroes(gstate, bannerId, count, seed = randomSeed()) {
  const rng = makeRng(seed);
  const out = [];
  const firstTen = count === 10 && gstate.firstTen;
  const feat = featuredHero();
  for (let i = 0; i < count; i++) {
    let force = null;
    if (count === 10 && i === 9 && !out.some((x) => x.rarity !== 'R')) force = 'SR';
    if (firstTen && i === 9 && !out.some((x) => x.rarity === 'SSR')) force = 'SSR';
    if (gstate.pity + 1 >= PITY) force = 'SSR';
    const rar = rollRarityHero(rng, force);
    let id;
    if (rar === 'SSR' && bannerId === 'featured' && rng() < 0.5) id = feat;
    else {
      const pool = heroesByRarity(rar);
      id = pool[rng.int(pool.length)].id;
    }
    out.push({ id, rarity: rar });
    gstate.pulls++;
    gstate.spark++;
    gstate.pity = rar === 'SSR' ? 0 : gstate.pity + 1;
  }
  if (firstTen) gstate.firstTen = false;
  // dramatic order: keep the best for last in a ten-pull? No - shuffle so a reveal can surprise.
  gstate.history = [...out.map((x) => x.id), ...(gstate.history || [])].slice(0, 60);
  return out;
}

/** Gold summon: gear, potions, stones, gifts or hero shards. */
export function pullGold(count, playerLevel, seed = randomSeed()) {
  const rng = makeRng(seed);
  const out = [];
  const tier = tierForLevel(playerLevel);
  const rs = heroesByRarity('R');
  const srs = heroesByRarity('SR');
  for (let i = 0; i < count; i++) {
    const k = rng.weighted({ gear: 38, expS: 16, expM: 9, stone: 15, gift: 10, rShard: 9, srShard: 3 });
    if (k === 'gear') out.push({ gear: makeGear(rng, { tier, rarity: rollRarity(rng, 'forge') }) });
    else if (k === 'expS') out.push({ item: 'expS', n: 2 });
    else if (k === 'expM') out.push({ item: 'expM', n: 1 });
    else if (k === 'stone') out.push({ item: 'stone', n: 3 });
    else if (k === 'gift') out.push({ item: rng.pick(['gift_cake', 'gift_flower', 'gift_book']), n: 1 });
    else if (k === 'rShard') out.push({ shard: rs[rng.int(rs.length)].id, n: 5 });
    else out.push({ shard: srs[rng.int(srs.length)].id, n: 3 });
  }
  return out;
}

export const allSSR = () => HEROES.filter((h) => h.rarity === 'SSR');
