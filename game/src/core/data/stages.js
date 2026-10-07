// Campaign: 12 chapters x 10 stages. Chapter tier (1-6) picks the vocabulary level of the selected
// book (學測 Level N / 多益 Level N); grammar level rises 1 -> 3. Stage 5 is an elite, stage 10 a boss.

export const CHAPTERS = [
  { id: 1, scale: 0.8, zh: '翠綠平原', en: 'Verdant Plains', bg: 'plains', tier: 1, glv: 1,
    pool: [['slime', 'water'], ['slime', 'wind'], ['mushroom', 'earth'], ['wolf', 'wind'], ['slime', 'fire']], boss: ['slimeKing', 'water'],
    story: '平原上的史萊姆突然變得狂暴，牠們吞掉了路標上的字——旅人們再也找不到回家的路。' },
  { id: 2, scale: 0.72, zh: '低語森林', en: 'Whispering Woods', bg: 'forest', tier: 1, glv: 1,
    pool: [['wolf', 'wind'], ['mushroom', 'earth'], ['treant', 'earth'], ['wisp', 'light'], ['bat', 'dark']], boss: ['treantElder', 'earth'],
    story: '森林裡的樹木曾經會說話，如今只剩下沙沙的低語。古樹長老被噬詞獸的黑霧侵蝕了心智。' },
  { id: 3, scale: 0.95, zh: '熔岩峽谷', en: 'Ember Canyon', bg: 'canyon', tier: 2, glv: 1,
    pool: [['salamander', 'fire'], ['goblin', 'earth'], ['golem', 'fire'], ['wisp', 'fire'], ['goblin', 'fire']], boss: ['flameDrake', 'fire'],
    story: '峽谷深處傳來龍的咆哮。哥布林們說，炎龍吞下了一整本字典，現在只會噴出亂碼般的火焰。' },
  { id: 4, scale: 1.05, zh: '霜語冰原', en: 'Frostspeak Tundra', bg: 'tundra', tier: 2, glv: 2,
    pool: [['sprite', 'water'], ['wolf', 'water'], ['golem', 'water'], ['slime', 'water'], ['harpy', 'wind']], boss: ['frostWyrm', 'water'],
    story: '在冰原上，說出口的話會被凍結在空中。霜龍把所有被凍住的話語都收藏在牠的巢穴裡。' },
  { id: 5, scale: 1.1, zh: '天空神殿', en: 'Sky Temple', bg: 'sky', tier: 3, glv: 2,
    pool: [['harpy', 'wind'], ['wisp', 'light'], ['gargoyle', 'earth'], ['armor', 'light'], ['harpy', 'light']], boss: ['harpyQueen', 'wind'],
    story: '漂浮在雲端的神殿保存著最古老的文法石碑。鳥妖女王佔據了這裡，把石碑一塊塊打碎。' },
  { id: 6, scale: 1.15, zh: '亡語墓園', en: 'Necropolis', bg: 'graveyard', tier: 3, glv: 2,
    pool: [['skeleton', 'dark'], ['bat', 'dark'], ['armor', 'dark'], ['wisp', 'dark'], ['skeleton', 'earth']], boss: ['lich', 'dark'],
    story: '這裡埋葬著被遺忘的詞語。巫妖想用它們建立一支不會說話的亡者大軍。' },
  { id: 7, scale: 1.2, zh: '沉沒港灣', en: 'Sunken Harbor', bg: 'harbor', tier: 4, glv: 2,
    pool: [['slime', 'water'], ['sprite', 'water'], ['mimic', 'water'], ['harpy', 'water'], ['armor', 'water']], boss: ['kraken', 'water'],
    story: '繁華的商港一夜沉入海底。據說海妖克拉肯把所有的合約與帳本都捲進了漩渦。' },
  { id: 8, scale: 1.22, zh: '機巧遺跡', en: 'Clockwork Ruins', bg: 'ruins', tier: 4, glv: 3,
    pool: [['golem', 'earth'], ['armor', 'earth'], ['mimic', 'earth'], ['gargoyle', 'earth'], ['golem', 'light']], boss: ['colossus', 'earth'],
    story: '古代文明留下的機械仍在運轉，但它們的指令早已錯亂。巨像守護著遺跡的核心。' },
  { id: 9, scale: 1.26, zh: '幻影迷宮', en: 'Mirage Labyrinth', bg: 'labyrinth', tier: 5, glv: 3,
    pool: [['wisp', 'dark'], ['mimic', 'light'], ['gargoyle', 'dark'], ['sprite', 'wind'], ['bat', 'dark']], boss: ['demonGeneral', 'dark'],
    story: '迷宮的每一道牆上都寫著似是而非的句子。只有分得清對錯的人，才能找到出口。' },
  { id: 10, scale: 1.3, zh: '黃昏戰場', en: 'Twilight Front', bg: 'battlefield', tier: 5, glv: 3,
    pool: [['armor', 'dark'], ['skeleton', 'fire'], ['salamander', 'fire'], ['harpy', 'dark'], ['golem', 'dark']], boss: ['demonGeneral', 'fire'],
    story: '詞靈聯軍與噬詞獸大軍在此決戰。夕陽下，每一個正確的答案都是一支射向敵陣的箭。' },
  { id: 11, scale: 1.35, zh: '緘默城塞', en: 'Silent Citadel', bg: 'citadel', tier: 6, glv: 3,
    pool: [['armor', 'dark'], ['gargoyle', 'dark'], ['wisp', 'dark'], ['skeleton', 'dark'], ['bat', 'dark']], boss: ['lich', 'dark'],
    story: '城塞裡沒有任何聲音。腳步聲、心跳聲，連你自己的思緒都被吞沒了。' },
  { id: 12, scale: 1.4, zh: '巴別之塔', en: 'Tower of Babel', bg: 'tower', tier: 6, glv: 3,
    pool: [['armor', 'dark'], ['wisp', 'light'], ['gargoyle', 'dark'], ['harpy', 'dark'], ['golem', 'dark'], ['sprite', 'dark']], boss: ['silentia', 'dark'],
    story: '一切的起點。緘默女王在塔頂等待著——她曾經也是一位詞靈，名字叫做 Silence。' },
];

export const STAGES_PER_CHAPTER = 10;

export function enemyLevel(chapter, n) {
  return Math.max(1, Math.round(1 + (chapter - 1) * 8.2 + (n - 1) * 0.85));
}

/** Builds stage `n` (1-10) of chapter `c`; deterministic. */
export function buildStage(c, n) {
  const ch = CHAPTERS[c - 1];
  const lv = enemyLevel(c, n);
  const pick = (i) => ch.pool[(i * 7 + n * 3 + c) % ch.pool.length];
  const enemies = [];
  let kind = 'normal';
  if (n === STAGES_PER_CHAPTER) {
    kind = 'boss';
    enemies.push({ id: ch.boss[0], element: ch.boss[1], level: lv + 2, boss: true, scale: ch.scale });
    enemies.push({ id: pick(1)[0], element: pick(1)[1], level: lv, scale: ch.scale });
    enemies.push({ id: pick(2)[0], element: pick(2)[1], level: lv, scale: ch.scale });
  } else if (n === 5) {
    kind = 'elite';
    enemies.push({ id: pick(0)[0], element: pick(0)[1], level: lv + 2, elite: true, scale: ch.scale });
    for (let i = 1; i < 4; i++) enemies.push({ id: pick(i)[0], element: pick(i)[1], level: lv, scale: ch.scale });
  } else {
    const count = n <= 2 && c === 1 ? 3 : 4;
    for (let i = 0; i < count; i++) enemies.push({ id: pick(i)[0], element: pick(i)[1], level: lv, scale: ch.scale });
  }
  return {
    id: `${c}-${n}`, chapter: c, n, kind, level: lv, enemies,
    name: kind === 'boss' ? `${ch.zh} · 首領戰` : kind === 'elite' ? `${ch.zh} · 菁英` : `${ch.zh} ${c}-${n}`,
    tier: ch.tier, glv: ch.glv, bg: ch.bg,
    grammarShare: kind === 'boss' ? 0.45 : kind === 'elite' ? 0.35 : 0.25,
    timeLimit: kind === 'boss' ? 120 : 90,
  };
}

export const stageKey = (c, n) => `${c}-${n}`;
