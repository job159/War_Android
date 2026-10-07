// Consumables, materials and gear definitions.

export const ITEMS = {
  expS: { zh: '經驗藥水（小）', icon: 'potion', color: '#6ad0ff', exp: 300, desc: '角色經驗 +300', rarity: 1 },
  expM: { zh: '經驗藥水（中）', icon: 'potion', color: '#5a8aff', exp: 1500, desc: '角色經驗 +1,500', rarity: 2 },
  expL: { zh: '經驗藥水（大）', icon: 'potion', color: '#b45cff', exp: 6000, desc: '角色經驗 +6,000', rarity: 3 },
  expXL: { zh: '經驗藥水（特大）', icon: 'potion', color: '#ffb84a', exp: 24000, desc: '角色經驗 +24,000', rarity: 4 },
  stone: { zh: '強化石', icon: 'stone', color: '#8ad4ff', desc: '鐵匠鋪強化裝備的材料', rarity: 1 },
  protect: { zh: '保護符', icon: 'charm', color: '#ffd84a', desc: '強化失敗時不會降級（消耗一張）', rarity: 3 },
  lucky: { zh: '幸運符', icon: 'clover', color: '#4ade80', desc: '強化成功率 +15%（消耗一張）', rarity: 2 },
  skillBook: { zh: '技能書', icon: 'book', color: '#ff9a5a', desc: '提升角色技能等級的材料', rarity: 2 },
  ticket: { zh: '召喚券', icon: 'ticket', color: '#ff7ad9', desc: '可進行一次常駐召喚', rarity: 3 },
  crystal: { zh: '覺醒結晶', icon: 'crystal', color: '#ff7ad9', desc: 'SSR 角色覺醒至 ★6 的材料', rarity: 4 },
  gift_cake: { zh: '星空蛋糕', icon: 'cake', color: '#ff9ac8', bond: 60, desc: '羈絆經驗 +60（喜歡的角色 ×1.5）', rarity: 1, likes: ['fire', 'wind'] },
  gift_flower: { zh: '晨露花束', icon: 'flower', color: '#ff7a9a', bond: 100, desc: '羈絆經驗 +100（喜歡的角色 ×1.5）', rarity: 2, likes: ['water', 'earth'] },
  gift_book: { zh: '古老珍本', icon: 'tome', color: '#c89a5a', bond: 160, desc: '羈絆經驗 +160（喜歡的角色 ×1.5）', rarity: 2, likes: ['light', 'dark'] },
  gift_gem: { zh: '詞靈寶石', icon: 'gem', color: '#7ae0ff', bond: 400, desc: '羈絆經驗 +400（所有角色都喜歡）', rarity: 4, likes: ['fire', 'water', 'wind', 'earth', 'light', 'dark'] },
};

export const CURRENCY = {
  gold: { zh: '金幣', icon: 'coin', color: '#ffd84a' },
  gems: { zh: '魔晶石', icon: 'gem', color: '#7ae0ff' },
  hearts: { zh: '契約之心', icon: 'heart', color: '#ff6a9a' },
  arena: { zh: '競技幣', icon: 'medal', color: '#ff9a4a' },
  medal: { zh: '試煉徽章', icon: 'badge', color: '#b8a0ff' },
};

// ------------------------------------------------------------------ gear
export const GEAR_SLOTS = ['weapon', 'armor', 'accessory', 'rune'];
export const SLOT_INFO = {
  weapon: { zh: '武器', suffix: '之刃', icon: 'sword' },
  armor: { zh: '護甲', suffix: '護甲', icon: 'armor' },
  accessory: { zh: '飾品', suffix: '護符', icon: 'amulet' },
  rune: { zh: '符石', suffix: '符石', icon: 'rune' },
};
export const GEAR_RARITY = [
  { id: 'N', zh: '普通', color: '#b8bcc8', mult: 1.0, subs: 0 },
  { id: 'R', zh: '優良', color: '#5ad87a', mult: 1.25, subs: 1 },
  { id: 'SR', zh: '稀有', color: '#4aa8ff', mult: 1.55, subs: 2 },
  { id: 'SSR', zh: '史詩', color: '#c86aff', mult: 1.9, subs: 3 },
  { id: 'UR', zh: '傳說', color: '#ffb02a', mult: 2.35, subs: 4 },
];
export const TIER_NAMES = ['', '見習', '鐵製', '精鋼', '秘銀', '符文', '龍鱗', '星辰', '聖輝', '神諭', '創世'];
export const MAX_TIER = 10;
export const MAX_ENHANCE = 15;
/** Base success chance to go from +n to +n+1. */
export const ENHANCE_RATE = [1, 1, 1, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.42, 0.36, 0.3, 0.25, 0.2, 0.16];
export const ENHANCE_DOWNGRADE_FROM = 7;
export const BLESS_PER_FAIL = 0.05;
