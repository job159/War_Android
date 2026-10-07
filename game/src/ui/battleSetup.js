// Builds the `setup` object the battle screen runs, plus the reward / progress logic for each mode.
import { S, gearById, addHeroExp, addPlayerExp, grant, addItem, addCur } from '../core/state.js';
import { heroSpec, enemySpec } from '../core/battle/setup.js';
import { buildStage, CHAPTERS, STAGES_PER_CHAPTER, enemyLevel } from '../core/data/stages.js';
import { HEROES, HERO_MAP } from '../core/data/heroes.js';
import { battleRewards, goldPerAnswer } from '../core/economy.js';
import { makeGear, rollRarity, tierForLevel } from '../core/gear.js';
import { makeRng, randomSeed } from '../core/rng.js';
import { dueItems } from '../core/quiz/srs.js';
import { track, setCounter } from '../core/missions.js';
import { dayKey, weekKey } from '../core/util.js';
import { rollMerchant } from '../core/shop.js';

export const bookList = () => (S.d.learn.book === 'both' ? ['c', 't'] : [S.d.learn.book || 'c']);

export function teamUnits(mode = 'pve') {
  const gb = gearById();
  return (S.d.team[mode] || []).filter((id) => S.d.heroes[id]).slice(0, 4).map((id) => heroSpec(id, S.d.heroes[id], gb));
}

function baseSetup(extra) {
  return {
    seed: randomSeed(), playerUnits: teamUnits('pve'), enemyEnergy: true, dueSet: dueItems(S.d.learn), myName: S.d.profile.name || '契約者',
    ...extra,
  };
}

// ------------------------------------------------------------------ shared reward logic

function grantBattle({ level, kind, summary, firstClear, mult = 1, extra = {} }) {
  const d = S.d;
  const win = summary.win;
  const rw = battleRewards({ level, kind, correct: summary.correct, firstClear, win, mult });
  const list = [];
  const goldTotal = rw.gold + (summary.gold || 0);
  if (rw.gold) addCur('gold', rw.gold);
  list.push({ k: 'gold', n: goldTotal });
  if (rw.gems) { addCur('gems', rw.gems); list.push({ k: 'gems', n: rw.gems }); }
  const team = (summary.teamIds || d.team.pve).filter((id) => d.heroes[id]);
  const heroUps = {};
  for (const id of team) heroUps[id] = { before: d.heroes[id].lv, ups: addHeroExp(id, rw.heroExp) };
  const pl = addPlayerExp(rw.playerExp);
  list.push({ k: 'playerExp', n: rw.playerExp });
  if (extra.items) list.push(...grant(extra.items));
  d.stats.battles++;
  if (win) d.stats.wins++;
  d.stats.maxCombo = Math.max(d.stats.maxCombo || 0, summary.maxCombo);
  setCounter('maxCombo', d.stats.maxCombo);
  track('battle', 1);
  return { list, heroUps, heroExp: rw.heroExp, playerLevel: pl, team };
}

function rollDrops(rng, level, kind, win) {
  if (!win) return {};
  const items = {};
  const gear = [];
  const tier = tierForLevel(level);
  const gearChance = kind === 'boss' ? 1 : kind === 'elite' ? 0.7 : 0.32;
  if (rng() < gearChance) gear.push(makeGear(rng, { tier, rarity: rollRarity(rng, kind) }));
  if (kind === 'boss' && rng() < 0.45) gear.push(makeGear(rng, { tier, rarity: rollRarity(rng, 'elite') }));
  items.expS = 1 + rng.int(kind === 'normal' ? 2 : 4);
  if (level >= 15 && rng() < 0.4) items.expM = 1;
  if (level >= 40 && rng() < 0.25) items.expL = 1;
  if (rng() < 0.5) items.stone = 1 + rng.int(kind === 'boss' ? 4 : 2);
  if (rng() < (kind === 'boss' ? 0.8 : 0.15)) items.skillBook = 1;
  if (rng() < 0.12) items[rng.pick(['gift_cake', 'gift_flower', 'gift_book'])] = 1;
  if (kind === 'boss' && level >= 30 && rng() < 0.08) items.crystal = 1;
  if (gear.length) items.gear = gear;
  return items;
}

function maybeMerchant(rng) {
  const m = S.d.merchant;
  if (m.until > Date.now()) return false;
  if (rng() < 0.12) { rollMerchant(); return true; }
  return false;
}

// ------------------------------------------------------------------ campaign

export function stageStars(summary) {
  if (!summary.win) return 0;
  let s = 1;
  if (summary.deaths === 0) s++;
  if (summary.answered > 0 && summary.correct / summary.answered >= 0.8) s++;
  return s;
}

export function campaignSetup(c, n) {
  const stage = buildStage(c, n);
  const ch = CHAPTERS[c - 1];
  return baseSetup({
    mode: 'campaign', stage, title: n === 10 ? `${ch.zh}・首領戰` : `${ch.zh} ${c}-${n}`, subtitle: `CHAPTER ${c}  ${ch.en}`,
    bg: stage.bg, timeLimit: stage.timeLimit, level: stage.level,
    enemyUnits: stage.enemies.map(enemySpec),
    deck: { books: bookList(), levels: [stage.tier], glv: stage.glv, grammarShare: stage.grammarShare, seed: randomSeed() },
    music: stage.kind === 'boss' ? 'boss' : 'battle',
    startText: stage.kind === 'boss' ? 'BOSS BATTLE' : 'BATTLE START',
    retry: () => campaignSetup(c, n),
    next: () => (n < STAGES_PER_CHAPTER ? campaignSetup(c, n + 1) : c < CHAPTERS.length ? campaignSetup(c + 1, 1) : null),
    onEnd: (summary) => {
      const key = `${c}-${n}`;
      const d = S.d;
      const stars = stageStars(summary);
      const firstClear = summary.win && !d.campaign.cleared[key];
      const rng = makeRng(randomSeed());
      const drops = rollDrops(rng, stage.level, stage.kind, summary.win);
      const res = grantBattle({ level: stage.level, kind: stage.kind, summary, firstClear, extra: { items: drops } });
      if (summary.win) {
        d.campaign.cleared[key] = true;
        d.campaign.stars[key] = Math.max(d.campaign.stars[key] || 0, stars);
        if (stage.kind === 'boss') track('bossKill', 1);
        if (firstClear && n === STAGES_PER_CHAPTER) {
          res.list.push(...grant({ gems: 300, ticket: 1 }));
          res.chapterClear = c;
        }
      }
      res.stars = stars;
      res.firstClear = firstClear;
      res.merchant = summary.win && maybeMerchant(rng);
      return res;
    },
  });
}

/**
 * 3-star stages can be swept with a 5-question review instead of a full battle. Rewards scale with the
 * number of correct answers; 3+ correct counts as a win (victory bonus and drops).
 */
export const SWEEP_Q = 5;
export const SWEEP_WIN = 3;
export function sweepParams(c, n) {
  const stage = buildStage(c, n);
  return {
    title: `掃蕩 ${c}-${n}`, mode: 'sweep', count: SWEEP_Q, navTab: 'adventure',
    deck: { books: bookList(), levels: [stage.tier], glv: stage.glv, grammarShare: stage.grammarShare },
    grantRewards: (q) => {
      const win = q.correct >= SWEEP_WIN;
      const live = goldPerAnswer(stage.level) * q.correct;
      addCur('gold', live);
      const rng = makeRng(randomSeed());
      const drops = rollDrops(rng, stage.level, stage.kind, win);
      const summary = { win, correct: q.correct, maxCombo: q.maxCombo, gold: live };
      const res = grantBattle({ level: stage.level, kind: stage.kind, summary, firstClear: false, mult: Math.max(0.2, q.correct / SWEEP_Q), extra: { items: drops } });
      if (win) maybeMerchant(rng);
      if (res.team.length) res.list.splice(1, 0, { k: 'heroExp', n: res.heroExp });
      return res.list;
    },
    endNote: (q) => (q.correct >= SWEEP_WIN ? '掃蕩成功！' : `掃蕩失敗⋯⋯答對 ${SWEEP_WIN} 題以上才有勝利獎勵與掉落`),
    again: () => sweepParams(c, n),
  };
}

/** Unlocked if the previous stage is cleared. */
export function stageUnlocked(c, n) {
  if (c === 1 && n === 1) return true;
  const prev = n > 1 ? `${c}-${n - 1}` : `${c - 1}-${STAGES_PER_CHAPTER}`;
  return !!S.d.campaign.cleared[prev];
}

// ------------------------------------------------------------------ tower

export function towerFloor(f) {
  const lv = Math.min(130, Math.round(2 + f * 1.05));
  const chapterIdx = Math.min(CHAPTERS.length - 1, Math.floor((f - 1) / 9) % CHAPTERS.length);
  const ch = CHAPTERS[chapterIdx];
  const kind = f % 10 === 0 ? 'boss' : f % 5 === 0 ? 'elite' : 'normal';
  const rng = makeRng(f * 7919);
  const enemies = [];
  const scale = 0.85 + Math.min(0.75, f * 0.006);
  if (kind === 'boss') {
    enemies.push({ id: ch.boss[0], element: ch.boss[1], level: lv + 2, boss: true, scale });
    for (let i = 0; i < 2; i++) { const p = rng.pick(ch.pool); enemies.push({ id: p[0], element: p[1], level: lv, scale }); }
  } else {
    for (let i = 0; i < 4; i++) { const p = rng.pick(ch.pool); enemies.push({ id: p[0], element: p[1], level: lv + (kind === 'elite' && i === 0 ? 2 : 0), elite: kind === 'elite' && i === 0, scale }); }
  }
  return { f, lv, kind, enemies, bg: ch.bg, tier: Math.min(6, 1 + Math.floor(f / 12)), glv: Math.min(3, 1 + Math.floor(f / 25)) };
}

export function towerSetup(f) {
  const fl = towerFloor(f);
  return baseSetup({
    mode: 'tower', title: `試煉之塔 第 ${f} 層`, subtitle: 'TRIAL TOWER', bg: fl.bg, timeLimit: fl.kind === 'boss' ? 120 : 90, level: fl.lv,
    enemyUnits: fl.enemies.map(enemySpec),
    deck: { books: bookList(), levels: [fl.tier], glv: fl.glv, grammarShare: 0.35, seed: randomSeed() },
    music: fl.kind === 'boss' ? 'boss' : 'battle',
    retry: () => towerSetup(f),
    next: () => towerSetup(f + 1),
    onEnd: (summary) => {
      const d = S.d;
      const first = summary.win && f >= d.tower.floor;
      const res = grantBattle({ level: fl.lv, kind: fl.kind, summary, firstClear: false, mult: 0.8 });
      if (first) {
        d.tower.floor = f + 1;
        d.tower.best = Math.max(d.tower.best || 0, f);
        setCounter('tower', f);
        const bonus = { medal: 10 + Math.floor(f / 2) };
        if (f % 5 === 0) bonus.gems = 50 + f;
        if (f % 10 === 0) { bonus.ticket = 1; bonus.stone = 5; }
        res.list.push(...grant(bonus));
      }
      res.stars = summary.win ? stageStars(summary) : 0;
      res.firstClear = first;
      return res;
    },
  });
}

// ------------------------------------------------------------------ daily dungeons

export const DUNGEONS = {
  gold: { zh: '黃金礦坑', en: 'Gold Mine', desc: '大量金幣。題型：單字速答', icon: 'coin', bg: 'ruins', enemies: [['mimic', 'earth'], ['goblin', 'earth'], ['goblin', 'fire'], ['mimic', 'light']], only: 'vocab' },
  exp: { zh: '經驗神殿', en: 'EXP Temple', desc: '經驗藥水。題型：文法', icon: 'potion', bg: 'sky', enemies: [['wisp', 'light'], ['sprite', 'water'], ['wisp', 'fire'], ['harpy', 'wind']], only: 'grammar' },
  gear: { zh: '符石遺跡', en: 'Rune Ruins', desc: '裝備與強化石。題型：混合', icon: 'rune', bg: 'labyrinth', enemies: [['golem', 'earth'], ['armor', 'dark'], ['gargoyle', 'dark'], ['armor', 'light']], only: null },
};
export const DUNGEON_RUNS = 2;

export function dungeonRunsLeft(id) {
  const D = S.d.dungeon;
  if (D.day !== dayKey()) { D.day = dayKey(); D.runs = {}; }
  return DUNGEON_RUNS - (D.runs[id] || 0);
}

export function dungeonSetup(id, diff = 1) {
  const D = DUNGEONS[id];
  const pl = S.d.profile.level;
  const lv = Math.max(1, Math.round(pl * (0.75 + diff * 0.2)));
  const tier = Math.min(6, 1 + Math.floor(pl / 16));
  return baseSetup({
    mode: 'dungeon', title: `${D.zh}（${['', '普通', '困難', '地獄'][diff]}）`, subtitle: D.en.toUpperCase(), bg: D.bg, timeLimit: 90, level: lv,
    enemyUnits: D.enemies.map(([e, el]) => enemySpec({ id: e, element: el, level: lv, scale: 0.85 + diff * 0.1 })),
    deck: { books: bookList(), levels: [tier, Math.max(1, tier - 1)], glv: Math.min(3, 1 + Math.floor(pl / 30)), grammarShare: 0.3, only: D.only, seed: randomSeed() },
    goldMult: id === 'gold' ? 2.5 : 1,
    onEnd: (summary) => {
      const S0 = S.d.dungeon;
      if (S0.day !== dayKey()) { S0.day = dayKey(); S0.runs = {}; }
      if (summary.win) S0.runs[id] = (S0.runs[id] || 0) + 1;
      const rng = makeRng(randomSeed());
      const items = {};
      if (summary.win) {
        const m = diff;
        if (id === 'gold') items.gold = Math.round((3000 + pl * 260) * m);
        if (id === 'exp') { items.expM = 2 + m; if (pl >= 20) items.expL = m; if (pl >= 50 && diff >= 2) items.expXL = 1; }
        if (id === 'gear') {
          items.stone = 4 + m * 3;
          items.gear = [makeGear(rng, { tier: tierForLevel(lv), rarity: rollRarity(rng, diff >= 3 ? 'forgeHigh' : 'forge') }), makeGear(rng, { tier: tierForLevel(lv), rarity: rollRarity(rng, 'elite') })];
          if (rng() < 0.3 * m) items.protect = 1;
        }
      }
      const res = grantBattle({ level: lv, kind: 'normal', summary, firstClear: false, mult: 0.6, extra: { items } });
      res.stars = stageStars(summary);
      return res;
    },
  });
}

// ------------------------------------------------------------------ weekly raid

export const RAID_BOSS = { id: 'demonGeneral', element: 'dark', zh: '深淵魔將・阿斯莫德', en: 'Asmodeus' };
export const RAID_TICKETS = 2;
export function raidState() {
  const R = S.d.raid;
  const wk = weekKey();
  if (R.week !== wk) { R.week = wk; R.best = 0; R.total = 0; R.claimed = []; R.day = ''; R.used = 0; }
  if (R.day !== dayKey()) { R.day = dayKey(); R.used = 0; }
  return R;
}
export function raidTiers() {
  const pl = S.d.profile.level;
  const base = 4000 + pl * pl * 22;
  return [1, 3, 6, 10, 16, 25].map((m, i) => ({ need: Math.round(base * m), reward: [{ gems: 100 }, { gems: 150, expM: 3 }, { gems: 200, stone: 10 }, { gems: 300, ticket: 1 }, { gems: 400, crystal: 1, expL: 2 }, { gems: 600, ticket: 2, protect: 2 }][i] }));
}
export function raidSetup() {
  const pl = S.d.profile.level;
  const lv = Math.max(5, pl + 5);
  return baseSetup({
    mode: 'raid', raid: true, title: RAID_BOSS.zh, subtitle: 'WEEKLY RAID', bg: 'citadel', timeLimit: 90, level: lv,
    enemyUnits: [enemySpec({ id: RAID_BOSS.id, element: RAID_BOSS.element, level: lv, boss: true, scale: 1.4 })],
    deck: { books: bookList(), levels: [Math.min(6, 1 + Math.floor(pl / 16))], glv: Math.min(3, 1 + Math.floor(pl / 30)), grammarShare: 0.4, seed: randomSeed() },
    music: 'boss', startText: 'RAID BATTLE',
    onEnd: (summary) => {
      const R = raidState();
      R.used = (R.used || 0) + 1;
      R.best = Math.max(R.best, summary.dmg);
      R.total += summary.dmg;
      track('raid', 1);
      const res = grantBattle({ level: lv, kind: 'elite', summary: { ...summary, win: true }, firstClear: false, mult: 0.7 });
      res.raidDamage = summary.dmg;
      res.stars = 0;
      return res;
    },
  });
}

// ------------------------------------------------------------------ AI opponents (arena / practice)

const NAMES = ['星語者', 'Lumina', '風之旅人', 'Kai', '單字獵人', 'Mira', '文法魔導士', 'Leo', '夜行貓', 'Nova', '晨曦', 'Rex', '知識之塔', 'Iris', '小書蟲', 'Orion'];

export function aiTeam(rng, level, quality = 0.5) {
  const pool = HEROES.filter((h) => (quality > 0.7 ? true : quality > 0.4 ? h.rarity !== 'SSR' || rng() < 0.4 : h.rarity === 'R' || rng() < 0.3));
  const pick = [];
  const want = ['guardian', 'healer'];
  for (const r of want) { const c = pool.filter((h) => h.role === r); if (c.length) pick.push(rng.pick(c).id); }
  while (pick.length < 4) { const h = rng.pick(pool).id; if (!pick.includes(h)) pick.push(h); }
  const front = pick.filter((id) => ['guardian', 'striker'].includes(HERO_MAP[id].role));
  const backRow = pick.filter((id) => !front.includes(id));
  return [...front, ...backRow].map((id) => {
    const def = HERO_MAP[id];
    const star = Math.min(def.rarity === 'SSR' ? 6 : 5, ({ R: 1, SR: 2, SSR: 3 })[def.rarity] + Math.floor(quality * 2.2));
    return heroSpec(id, { lv: Math.max(1, level), star, bond: 1 + Math.floor(quality * 5), skill: { skill: Math.min(10, 1 + Math.floor(level / 10)), ult: Math.min(10, 1 + Math.floor(level / 10)) }, equip: {} });
  });
}

export function practiceSetup(diff = 'normal') {
  const pl = S.d.profile.level;
  const D = { easy: { acc: 0.6, mean: 5.5, lv: -3, q: 0.3 }, normal: { acc: 0.75, mean: 4.2, lv: 0, q: 0.5 }, hard: { acc: 0.9, mean: 3.2, lv: 3, q: 0.8 } }[diff];
  const rng = makeRng(randomSeed());
  const units = teamUnits('pvp').length ? teamUnits('pvp') : teamUnits('pve');
  return {
    mode: 'practice', simMode: 'pvp', title: `練習對戰（${{ easy: '簡單', normal: '普通', hard: '困難' }[diff]}）`, subtitle: 'PRACTICE DUEL', bg: 'arena', timeLimit: 90, level: pl,
    seed: randomSeed(), playerUnits: units, enemyUnits: aiTeam(rng, Math.max(1, pl + D.lv), D.q), enemyEnergy: false,
    oppName: rng.pick(NAMES), opponentAI: { acc: D.acc, mean: D.mean, par: 6, seed: randomSeed() },
    deck: { books: bookList(), levels: [Math.min(6, 1 + Math.floor(pl / 16))], glv: Math.min(3, 1 + Math.floor(pl / 30)), grammarShare: 0.3, seed: randomSeed() },
    goldMult: 0.5, music: 'battle', startText: 'DUEL START',
    retry: () => practiceSetup(diff),
    onEnd: (summary) => {
      track('pvp', 1);
      const res = grantBattle({ level: pl, kind: 'normal', summary, firstClear: false, mult: 0.3, extra: {} });
      res.stars = 0;
      return res;
    },
  };
}

export { NAMES as AI_NAMES, enemyLevel, addItem };
