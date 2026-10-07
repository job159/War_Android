// Headless balance simulation: a bot answers questions with a given accuracy and speed.
//   node tools/sim-battle.mjs --chapter 1 --stage 1 --level 3 --acc 0.8 --n 50
//   node tools/sim-battle.mjs --sweep          (every boss + a few stages, typical player levels)
//   node tools/sim-battle.mjs --pvp            (mirror PvP with different accuracies)
import { Battle } from '../game/src/core/battle/sim.js';
import { heroSpec, enemySpec } from '../game/src/core/battle/setup.js';
import { buildStage } from '../game/src/core/data/stages.js';
import { makeRng } from '../game/src/core/rng.js';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : null)).filter(Boolean));

const DT = 1 / 30;

function botRun(battle, sides, seed) {
  const rng = makeRng(seed);
  const next = sides.map((s) => (s ? 1 + rng() * s.mean : Infinity));
  let steps = 0;
  while (!battle.over && steps < 30 * 400) {
    battle.step(DT);
    steps++;
    for (let i = 0; i < sides.length; i++) {
      const s = sides[i];
      if (!s) continue;
      if (battle.real >= next[i]) {
        const took = Math.max(0.8, s.mean + (rng() - 0.5) * s.mean);
        const ok = rng() < s.acc;
        const tier = took < s.par * 0.5 ? 'perfect' : took < s.par ? 'great' : 'good';
        battle.input(i, { type: 'answer', ok, tier });
        next[i] = battle.real + took + (ok ? 0.35 : 1.6);
      }
    }
    battle.takeEvents();
  }
  return battle.summary(0);
}

// Gear approximation: a level-appropriate set adds ~0.5% atk/hp/def per hero level.
function fakeGear(lv) {
  const v = lv * 0.005;
  return { g1: { main: { k: 'atkP', v }, subs: [], lvl: 0 }, g2: { main: { k: 'hpP', v }, subs: [], lvl: 0 }, g3: { main: { k: 'defP', v }, subs: [], lvl: 0 } };
}
function team(ids, lv, star) {
  const gear = fakeGear(lv);
  return ids.map((id) => heroSpec(id, { lv, star, bond: 1, skill: { skill: Math.min(10, 1 + Math.floor(lv / 10)), ult: Math.min(10, 1 + Math.floor(lv / 10)) }, equip: { a: 'g1', b: 'g2', c: 'g3' } }, gear));
}

function stageTest(c, n, lv, star, acc, N, ids) {
  const st = buildStage(c, n);
  let wins = 0, time = 0, deaths = 0, breaks = 0;
  for (let k = 0; k < N; k++) {
    const b = new Battle({
      seed: 1000 + k, mode: 'pve', timeLimit: st.timeLimit,
      sides: [{ name: 'P', units: team(ids, lv, star), auto: true }, { name: 'E', units: st.enemies.map(enemySpec), auto: true, enemyEnergy: true }],
    });
    let br = 0;
    const origTake = b.takeEvents.bind(b);
    b.takeEvents = () => { const e = origTake(); br += e.filter((x) => x.k === 'break').length; return e; };
    const s = botRun(b, [{ acc, mean: 4, par: 6 }, null], 77 + k);
    if (s.winner === 0) wins++;
    time += s.time; deaths += s.deaths; breaks += br;
  }
  return { stage: st.id, kind: st.kind, elv: st.level, lv, acc, win: (wins / N * 100).toFixed(0) + '%', time: (time / N).toFixed(1), deaths: (deaths / N).toFixed(2), breaks: (breaks / N).toFixed(1) };
}

const R_TEAM = ['pebble', 'flint', 'spark', 'dew'];
const MID_TEAM = ['onyx', 'ember', 'zephyr', 'marina'];
const TOP_TEAM = ['valor', 'tempest', 'inferno', 'aurora'];

if (args.pvp) {
  for (const [a, b] of [[0.9, 0.9], [0.9, 0.7], [0.8, 0.6], [0.95, 0.5]]) {
    let w = 0, time = 0;
    const N = 60;
    for (let k = 0; k < N; k++) {
      const bt = new Battle({ seed: 5 + k, mode: 'pvp', timeLimit: 90, sides: [{ units: team(TOP_TEAM, 40, 4), auto: true }, { units: team(TOP_TEAM, 40, 4), auto: true }] });
      const s = botRun(bt, [{ acc: a, mean: 3.5, par: 6 }, { acc: b, mean: 3.5, par: 6 }], 9 + k);
      if (s.winner === 0) w++;
      time += s.time;
    }
    console.log(`pvp acc ${a} vs ${b}: left wins ${(w / N * 100).toFixed(0)}%  avg ${(time / N).toFixed(1)}s`);
  }
} else if (args.sweep) {
  const rows = [];
  const plan = [[1, 1, 1, 1, R_TEAM], [1, 5, 4, 1, R_TEAM], [1, 10, 7, 1, R_TEAM], [2, 5, 13, 2, R_TEAM], [2, 10, 15, 2, R_TEAM], [3, 5, 20, 2, MID_TEAM], [3, 10, 23, 2, MID_TEAM], [4, 10, 31, 3, MID_TEAM],
    [6, 3, 42, 3, MID_TEAM], [6, 10, 48, 3, MID_TEAM], [8, 10, 64, 3, TOP_TEAM], [10, 10, 82, 4, TOP_TEAM], [12, 10, 98, 5, TOP_TEAM]];
  for (const [c, n, lv, star, ids] of plan) for (const acc of [0.6, 0.8, 0.95]) rows.push(stageTest(c, n, lv, star, acc, 30, ids));
  console.table(rows);
} else {
  const c = +(args.chapter || 1), n = +(args.stage || 1), lv = +(args.level || 3), acc = +(args.acc || 0.8), N = +(args.n || 40);
  console.table([stageTest(c, n, lv, +(args.star || 1), acc, N, R_TEAM)]);
}
