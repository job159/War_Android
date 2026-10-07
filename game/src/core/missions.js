// Daily / weekly missions, achievements, login calendar and the study pass.
// Gameplay calls track(event, n); progress resets at local midnight (daily) and Monday (weekly).
import { S, grant, studyStreak } from './state.js';
import { dayKey, weekKey, daysBetween } from './util.js';
import { counts } from './quiz/srs.js';

export const DAILY = [
  { id: 'login', zh: '登入遊戲', ev: 'login', need: 1, reward: { gems: 30 } },
  { id: 'answer', zh: '戰鬥或練習中答對 30 題', ev: 'correct', need: 30, reward: { gems: 50, gold: 3000 } },
  { id: 'battle', zh: '完成 3 場戰鬥', ev: 'battle', need: 3, reward: { gems: 40, expS: 3 } },
  { id: 'review', zh: '完成 10 題到期複習或錯題', ev: 'review', need: 10, reward: { gems: 50 } },
  { id: 'lesson', zh: '閱讀文法講堂或完成一次模擬考', ev: 'lesson', need: 1, reward: { gems: 50, skillBook: 1 } },
  { id: 'gacha', zh: '進行 1 次召喚', ev: 'gacha', need: 1, reward: { gems: 20, gold: 2000 } },
  { id: 'enhance', zh: '在鐵匠鋪強化裝備 1 次', ev: 'enhance', need: 1, reward: { stone: 3, gold: 2000 } },
  { id: 'pvp', zh: '進行 1 場對戰（競技場／線上／練習）', ev: 'pvp', need: 1, reward: { gems: 30, arena: 50 } },
];
export const DAILY_BONUS = { gems: 100, ticket: 1 };

export const WEEKLY = [
  { id: 'w_answer', zh: '本週答對 300 題', ev: 'correct', need: 300, reward: { gems: 300 } },
  { id: 'w_boss', zh: '本週擊敗 3 個首領', ev: 'bossKill', need: 3, reward: { gems: 200, expM: 3 } },
  { id: 'w_days', zh: '本週學習 5 天', ev: 'studyDay', need: 5, reward: { ticket: 2 } },
  { id: 'w_raid', zh: '挑戰每週首領 3 次', ev: 'raid', need: 3, reward: { gems: 200, crystal: 1 } },
  { id: 'w_master', zh: '本週新掌握 30 個單字', ev: 'mastered', need: 30, reward: { gems: 300 } },
];

// achievements: tiers of a running counter
export const ACHIEVEMENTS = [
  { id: 'a_correct', zh: '博學者', desc: '累計答對 {n} 題', counter: 'correct', tiers: [100, 500, 1000, 3000, 6000, 10000, 20000, 40000], gems: [50, 100, 150, 200, 300, 400, 600, 1000] },
  { id: 'a_master', zh: '詞彙大師', desc: '掌握 {n} 個單字', counter: 'mastered', tiers: [25, 50, 100, 250, 500, 1000, 2000, 4000, 7000], gems: [100, 100, 150, 250, 400, 600, 800, 1200, 2000] },
  { id: 'a_heroes', zh: '契約收藏家', desc: '擁有 {n} 位詞靈', counter: 'heroes', tiers: [6, 10, 15, 20, 26], gems: [100, 200, 300, 500, 1000] },
  { id: 'a_chapter', zh: '開拓者', desc: '通關第 {n} 章', counter: 'chapter', tiers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], gems: [200, 200, 250, 250, 300, 300, 350, 350, 400, 400, 500, 1000] },
  { id: 'a_combo', zh: '連擊之王', desc: '單場最高連擊達 {n}', counter: 'maxCombo', tiers: [10, 20, 30, 50], gems: [50, 100, 200, 400] },
  { id: 'a_tower', zh: '登塔者', desc: '試煉之塔到達第 {n} 層', counter: 'tower', tiers: [10, 20, 30, 50, 75, 100], gems: [100, 150, 200, 300, 400, 800] },
  { id: 'a_pvp', zh: '競技之星', desc: '對戰勝利 {n} 場', counter: 'pvpWins', tiers: [1, 10, 30, 100], gems: [50, 150, 300, 600] },
  { id: 'a_enhance', zh: '名匠', desc: '將裝備強化至 +{n}', counter: 'enhanceMax', tiers: [5, 10, 13, 15], gems: [50, 150, 300, 600] },
  { id: 'a_streak', zh: '持之以恆', desc: '連續學習 {n} 天', counter: 'streak', tiers: [3, 7, 14, 30, 60, 100, 365], gems: [50, 100, 200, 400, 600, 1000, 3000] },
  { id: 'a_lessons', zh: '文法學者', desc: '讀完 {n} 堂文法課', counter: 'lessons', tiers: [5, 15, 30, 44], gems: [100, 200, 300, 600] },
];

export const LOGIN_CAL = [
  { gold: 5000 }, { gems: 100 }, { expM: 3 }, { stone: 10 }, { gems: 150 }, { skillBook: 3 }, { ticket: 1 },
  { gold: 10000 }, { gems: 150 }, { expM: 5 }, { protect: 1 }, { gems: 200 }, { gift_gem: 1 }, { ticket: 2 },
  { gold: 15000 }, { gems: 200 }, { expL: 2 }, { lucky: 2 }, { gems: 250 }, { skillBook: 5 }, { crystal: 1 },
  { gold: 20000 }, { gems: 250 }, { expL: 3 }, { protect: 2 }, { gems: 300 }, { gift_gem: 2 }, { ticket: 5 },
];

// ------------------------------------------------------------------ study pass (free season track)
export const PASS_TIERS = 50;
export const PASS_POINTS_PER_TIER = 100;
export function passReward(tier) {
  if (tier % 10 === 0) return { ticket: 3, gems: 300 };
  if (tier % 5 === 0) return { crystal: tier >= 30 ? 1 : 0, gems: 150, expL: 1 };
  const cycle = [{ gold: 5000 }, { expM: 2 }, { stone: 5 }, { gems: 50 }, { skillBook: 1 }, { gift_flower: 1 }, { lucky: 1 }, { gold: 8000 }, { gems: 80 }];
  return cycle[tier % cycle.length];
}
export function passSeason(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ------------------------------------------------------------------ bookkeeping

export function ensureDay() {
  const d = S.d;
  const today = dayKey();
  const m = d.missions;
  if (m.day !== today) { m.day = today; m.prog = {}; m.claimed = []; }
  const wk = weekKey();
  if (m.week !== wk) { m.week = wk; m.wprog = {}; m.wclaimed = []; }
  const season = passSeason();
  if (d.pass.season !== season) { d.pass.season = season; d.pass.points = 0; d.pass.claimed = []; }
  // login streak + calendar
  const L = d.login;
  if (L.last !== today) {
    const gap = L.last ? daysBetween(L.last, today) : 99;
    L.streak = gap === 1 ? L.streak + 1 : 1;
    L.total++;
    L.last = today;
    L.claimedToday = false;
    track('login', 1);
    return true; // new day
  }
  return false;
}

export function track(ev, n = 1) {
  const d = S.d;
  const m = d.missions;
  for (const x of DAILY) if (x.ev === ev) m.prog[x.id] = Math.min(x.need, (m.prog[x.id] || 0) + n);
  for (const x of WEEKLY) if (x.ev === ev) m.wprog[x.id] = Math.min(x.need, (m.wprog[x.id] || 0) + n);
  const c = d.achievements.counters;
  if (ev === 'correct') { c.correct = (c.correct || 0) + n; d.pass.points += n * 2; }
  if (ev === 'pvpWin') c.pvpWins = (c.pvpWins || 0) + n;
  if (ev === 'review') d.pass.points += n;
  if (ev === 'lesson') d.pass.points += 20;
}

export function setCounter(k, v) {
  const c = S.d.achievements.counters;
  c[k] = Math.max(c[k] || 0, v);
}

/** Refreshes counters derived from the save (heroes owned, mastered words, streak...). */
export function syncCounters() {
  const d = S.d;
  setCounter('heroes', Object.keys(d.heroes).length);
  setCounter('mastered', counts(d.learn).mastered);
  setCounter('streak', studyStreak());
  setCounter('lessons', d.learn.lessonsRead.length);
  setCounter('maxCombo', d.stats.maxCombo || 0);
  setCounter('enhanceMax', d.stats.enhanceMax || 0);
  setCounter('tower', (d.tower.best || 0));
  let ch = 0;
  for (let c = 1; c <= 12; c++) if (d.campaign.cleared[`${c}-10`]) ch = c;
  setCounter('chapter', ch);
}

export function dailyState() {
  const m = S.d.missions;
  return DAILY.map((x) => ({ ...x, prog: m.prog[x.id] || 0, done: (m.prog[x.id] || 0) >= x.need, claimed: m.claimed.includes(x.id) }));
}
export function weeklyState() {
  const m = S.d.missions;
  return WEEKLY.map((x) => ({ ...x, prog: m.wprog[x.id] || 0, done: (m.wprog[x.id] || 0) >= x.need, claimed: m.wclaimed.includes(x.id) }));
}
export function achievementState() {
  const c = S.d.achievements.counters;
  const claimed = S.d.achievements.claimed;
  return ACHIEVEMENTS.map((a) => {
    let tier = 0;
    while (tier < a.tiers.length && claimed.includes(`${a.id}:${tier}`)) tier++;
    const done = tier >= a.tiers.length;
    const need = done ? a.tiers[a.tiers.length - 1] : a.tiers[tier];
    const v = c[a.counter] || 0;
    return { ...a, tier, need, v, done, ready: !done && v >= need, gemsNow: done ? 0 : a.gems[tier], text: a.desc.replace('{n}', need) };
  });
}

export function dailyBonusReady() {
  const m = S.d.missions;
  return DAILY.every((x) => m.claimed.includes(x.id)) && !m.claimed.includes('bonus');
}

export function claimDaily(id) {
  const m = S.d.missions;
  if (id === 'bonus') {
    if (!dailyBonusReady()) return null;
    m.claimed.push('bonus');
    return grant(DAILY_BONUS);
  }
  const x = DAILY.find((y) => y.id === id);
  if (!x || m.claimed.includes(id) || (m.prog[id] || 0) < x.need) return null;
  m.claimed.push(id);
  return grant(x.reward);
}
export function claimWeekly(id) {
  const m = S.d.missions;
  const x = WEEKLY.find((y) => y.id === id);
  if (!x || m.wclaimed.includes(id) || (m.wprog[id] || 0) < x.need) return null;
  m.wclaimed.push(id);
  return grant(x.reward);
}
export function claimAchievement(id) {
  const a = achievementState().find((x) => x.id === id);
  if (!a || !a.ready) return null;
  S.d.achievements.claimed.push(`${a.id}:${a.tier}`);
  return grant({ gems: a.gemsNow });
}

export function loginCalendarState() {
  const L = S.d.login;
  return { day: L.calDay % LOGIN_CAL.length, claimedToday: L.claimedToday, list: LOGIN_CAL };
}
export function claimLogin() {
  const L = S.d.login;
  if (L.claimedToday) return null;
  const r = LOGIN_CAL[L.calDay % LOGIN_CAL.length];
  L.calDay++;
  L.claimedToday = true;
  return grant(r);
}

export function passState() {
  const p = S.d.pass;
  const tier = Math.min(PASS_TIERS, Math.floor(p.points / PASS_POINTS_PER_TIER));
  return { points: p.points, tier, claimed: p.claimed, next: (tier + 1) * PASS_POINTS_PER_TIER };
}
export function claimPass(tier) {
  const p = S.d.pass;
  const st = passState();
  if (tier > st.tier || p.claimed.includes(tier)) return null;
  p.claimed.push(tier);
  return grant(passReward(tier));
}

/** Every 25 newly mastered words: a gem gift in the mailbox. Returns the number of new milestones. */
export function checkMilestones() {
  const L = S.d.learn;
  const m = Math.floor(counts(L).mastered / 25);
  let n = 0;
  while ((L.milestones || 0) < m) {
    L.milestones = (L.milestones || 0) + 1;
    const k = L.milestones;
    S.d.mail.push({ id: 'ms' + k + '_' + Date.now().toString(36), title: `單字里程碑：掌握 ${k * 25} 字！`, body: `恭喜！你已經掌握了 ${k * 25} 個單字。詞靈們因你而變得更強了。`, gift: { gems: 50 + Math.min(150, k * 10), ...(k % 4 === 0 ? { ticket: 1 } : {}) }, at: Date.now() });
    n++;
  }
  return n;
}

/** Red-dot sources for the navigation. */
export function badges() {
  const d = S.d;
  if (!d) return {};
  const missions = dailyState().some((x) => x.done && !x.claimed) || weeklyState().some((x) => x.done && !x.claimed) || dailyBonusReady() || achievementState().some((a) => a.ready);
  const home = missions || !d.login.claimedToday || d.mail.length > 0;
  const shop = d.gacha.freeDay !== dayKey() || (d.items.ticket || 0) > 0;
  return { home, shop, missions };
}
