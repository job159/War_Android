// 對戰 PvP: online duels by 5-digit room code (MQTT relay, host-authoritative), practice vs AI and the
// arena ladder (AI opponents). Both phones answer the same seeded question sequence.
import { register, go, back, modal, toast, confirmBox, pop } from '../app.js';
import { bindActions, esc, h } from '../dom.js';
import { icon, elemIcon } from '../../art/icons.js';
import { heroImageURL } from '../../art/hero.js';
import { HERO_MAP } from '../../core/data/heroes.js';
import { S, changed, grant, addCur } from '../../core/state.js';
import { heroSpec } from '../../core/battle/setup.js';
import { Battle } from '../../core/battle/sim.js';
import { RemoteBattle } from '../../core/battle/remote.js';
import { heroStats } from '../../core/stats.js';
import { createRoom, joinRoom } from '../../net/room.js';
import { loadBook, BOOKS } from '../../core/quiz/content.js';
import { track } from '../../core/missions.js';
import { makeRng, randomSeed } from '../../core/rng.js';
import { dayKey, fmt } from '../../core/util.js';
import { teamPower, heroCard } from '../widgets.js';
import { practiceSetup, aiTeam, AI_NAMES, teamUnits } from '../battleSetup.js';
import { setBgTheme } from '../../fx/bg.js';
import { sfx } from '../sound.js';
import { gearById } from '../../core/state.js';

export const NET_VERSION = 'lexica-1';

export const POOLS = {
  c12: { zh: '學測 Level 1–2', books: ['c'], levels: [1, 2], glv: 1 },
  c34: { zh: '學測 Level 3–4', books: ['c'], levels: [3, 4], glv: 2 },
  c56: { zh: '學測 Level 5–6', books: ['c'], levels: [5, 6], glv: 3 },
  t12: { zh: '多益 350–500', books: ['t'], levels: [1, 2], glv: 1 },
  t34: { zh: '多益 650–750', books: ['t'], levels: [3, 4], glv: 2 },
  t56: { zh: '多益 850–900+', books: ['t'], levels: [5, 6], glv: 3 },
};

// ------------------------------------------------------------------ team wire format

function myTeamWire() {
  const ids = (S.d.team.pvp.length ? S.d.team.pvp : S.d.team.pve).filter((id) => S.d.heroes[id]).slice(0, 4);
  const gb = gearById();
  return ids.map((id) => {
    const st = S.d.heroes[id];
    const stats = heroStats(HERO_MAP[id], st, gb);
    return { id, lv: st.lv, star: st.star, bond: st.bond, skill: st.skill, skin: st.skin || null, stats };
  });
}

function specFromWire(w, fair) {
  const st = { lv: w.lv, star: w.star, bond: w.bond, skill: w.skill, equip: {}, skin: w.skin };
  const spec = heroSpec(w.id, st, {}, fair ? { fairLevel: 50 } : {});
  if (!fair && w.stats) spec.stats = { ...w.stats };
  if (fair) spec.stats.lv = 50;
  spec.skin = w.skin || null;
  return spec;
}

const wirePower = (team) => team.reduce((a, w) => a + Math.round((w.stats.hp * 0.12 + w.stats.atk * 3.2 + w.stats.def * 2.4) * (w.stats.spd / 100)), 0);

// ------------------------------------------------------------------ session

class Session {
  constructor(room, isHost) {
    this.room = room;
    this.isHost = isHost;
    this.ev = new Map();
    this.me = { name: S.d.profile.name || '契約者', level: S.d.profile.level, avatar: S.d.profile.avatar, team: myTeamWire(), ready: isHost };
    this.peer = null;
    this.settings = { pool: S.d.learn.book === 't' ? 't12' : 'c12', fair: false };
    this.engine = null;
    this.inBattle = false;
    this.pendingEv = [];
    this.lastFlush = 0;
    this.lastSnap = 0;
    room.on('message', ({ type, data }) => this._msg(type, data));
    room.on('peer', () => this._hello());
    room.on('peer-left', () => { this.peer = null; this._battleAbort('peer'); this.emit('lobby'); toast('對手離開了房間', 'bad'); });
    room.on('closed', (reason) => { this._battleAbort('closed'); this.emit('closed', reason); });
    room.on('status', (s) => this.emit('status', s));
    if (!isHost) this._hello();
  }

  on(k, fn) { (this.ev.get(k) || this.ev.set(k, new Set()).get(k)).add(fn); return () => this.ev.get(k).delete(fn); }
  emit(k, ...a) { for (const fn of [...(this.ev.get(k) || [])]) { try { fn(...a); } catch (e) { console.error(e); } } }

  _hello() { this.room.send('hello2', { me: this.me, settings: this.isHost ? this.settings : undefined }); }

  _msg(type, data) {
    if (type === 'hello2') {
      this.peer = data.me;
      if (!this.isHost && data.settings) this.settings = data.settings;
      if (this.isHost) { this.me.ready = true; this.room.send('lobby', { me: this.me, settings: this.settings }); }
      this.emit('lobby');
    } else if (type === 'lobby') {
      this.peer = data.me;
      if (!this.isHost && data.settings) this.settings = data.settings;
      this.emit('lobby');
    } else if (type === 'ready') {
      if (this.peer) this.peer.ready = data.ready;
      this.emit('lobby');
    } else if (type === 'emote') this.emit('emote', data.e, false);
    else if (type === 'start' && !this.isHost) this._guestStart(data);
    else if (type === 'in' && this.isHost && this.engine) {
      if (data.type === 'surrender') this.engine.surrender(1);
      else this.engine.input(1, data);
    } else if ((type === 'ev' || type === 'snap' || type === 'end') && !this.isHost && this.engine) this.engine.onMessage(type, data);
  }

  setSettings(s) { this.settings = { ...this.settings, ...s }; if (this.peer) this.room.send('lobby', { me: this.me, settings: this.settings }); this.emit('lobby'); }
  setReady(r) { this.me.ready = r; this.room.send('ready', { ready: r }); this.emit('lobby'); }
  emote(e) { this.room.send('emote', { e }); this.emit('emote', e, true); }
  refreshTeam() { this.me.team = myTeamWire(); if (this.peer) this.room.send(this.isHost ? 'lobby' : 'hello2', this.isHost ? { me: this.me, settings: this.settings } : { me: this.me }); this.emit('lobby'); }

  // ---------------------------------------------------------------- battle
  async hostStart() {
    if (!this.peer || !this.peer.ready) return;
    const P = POOLS[this.settings.pool];
    const seed = randomSeed();
    const deck = { books: P.books, levels: P.levels, glv: P.glv, grammarShare: 0.3, pool: true, seed };
    await Promise.all(P.books.map((b) => loadBook(b)));
    const fair = this.settings.fair;
    const hostUnits = this.me.team.map((w) => specFromWire(w, fair));
    const guestUnits = this.peer.team.map((w) => specFromWire(w, fair));
    const engine = new Battle({ seed, mode: 'pvp', timeLimit: 90, sides: [{ name: this.me.name, units: hostUnits, auto: !!S.d.settings.autoUlt }, { name: this.peer.name, units: guestUnits, auto: false }] });
    this.engine = engine;
    this.room.send('start', { seed, deck, fair, timeLimit: 90, host: this.me.team, guest: this.peer.team, names: [this.me.name, this.peer.name], maxHp: engine.units.map((u) => u.maxHp) });
    this._enter(engine, 0, deck);
  }

  async _guestStart(d) {
    await Promise.all(d.deck.books.map((b) => loadBook(b)));
    const hostUnits = d.host.map((w) => specFromWire(w, d.fair));
    const guestUnits = d.guest.map((w) => specFromWire(w, d.fair));
    const units = [...hostUnits.map((s, i) => toUnit(s, 0, i)), ...guestUnits.map((s, i) => toUnit(s, 1, i))];
    if (Array.isArray(d.maxHp)) units.forEach((u, i) => { if (d.maxHp[i]) u.maxHp = d.maxHp[i]; });
    const engine = new RemoteBattle({ units, timeLimit: d.timeLimit, send: (t, x) => this.room.send(t, x) });
    engine.setAuto = (side, on) => this.room.send('in', { type: 'auto', on });
    this.engine = engine;
    this._enter(engine, 1, d.deck);
  }

  _enter(engine, mySide, deck) {
    this.inBattle = true;
    const me = this;
    go('battle', {
      mode: 'online', simMode: 'pvp', engine, mySide, online: true,
      title: `線上對戰 vs ${this.peer ? this.peer.name : ''}`, subtitle: `ROOM ${this.room.code}`, bg: 'arena', timeLimit: 90, level: S.d.profile.level,
      deck, goldMult: 0.5, startText: 'DUEL START', music: 'battle',
      onEvents(evs) { if (me.isHost) me.pendingEv.push(...evs); },
      onTick() { if (me.isHost) me._hostFlush(); },
      onSurrender() { if (me.isHost) engine.surrender(0); else me.room.send('in', { type: 'surrender' }); },
      onEnd: (summary) => { me.inBattle = false; me.engine = null; me.me.ready = me.isHost; if (me.peer) me.peer.ready = !me.isHost; return onlineRewards(summary); },
      onDestroy() { me.inBattle = false; },
    });
  }

  _hostFlush() {
    const e = this.engine;
    if (!e) return;
    const now = performance.now();
    if (this.pendingEv.length && (now - this.lastFlush > 120 || this.pendingEv.some((x) => x.k === 'end'))) {
      const list = this.pendingEv.splice(0);
      const end = list.find((x) => x.k === 'end');
      this.room.send('ev', { list: list.filter((x) => x.k !== 'end') });
      this.lastFlush = now;
      if (end) this.room.send('end', { winner: end.winner, reason: end.reason, sums: [e.summary(0), e.summary(1)] });
    }
    if (now - this.lastSnap > 280) {
      this.room.send('snap', e.snapshot(), { reliable: false });
      this.lastSnap = now;
    }
  }

  _battleAbort(why) {
    const e = this.engine;
    if (!e || !this.inBattle || e.over) return;
    if (this.isHost) e.surrender(1);
    else e.forceEnd(1, why);
  }

  leave() { this.room.close('left'); }
}

function toUnit(spec, side, slot) {
  // max HP (with the host's passives applied) arrives in the start message
  return { id: (side ? 'R' : 'L') + slot, side, slot, spec, key: spec.key, kind: spec.kind, name: spec.name, element: spec.element, role: spec.role, boss: false, maxHp: Math.round(spec.stats.hp) };
}

function onlineRewards(summary) {
  const d = S.d;
  const win = summary.win;
  track('pvp', 1);
  const list = [];
  if (win) { d.pvp.wins++; track('pvpWin', 1); } else if (summary.draw) d.pvp.draws++; else d.pvp.losses++;
  const coins = win ? 120 : 40;
  addCur('arena', coins);
  list.push({ k: 'arena', n: coins });
  if (win && d.pvp.lastWinDay !== dayKey()) { d.pvp.lastWinDay = dayKey(); list.push(...grant({ gems: 80 })); }
  list.push({ k: 'gold', n: summary.gold || 0 });
  changed('pvp');
  return { list, stars: 0, team: [] };
}

let session = null;

// ------------------------------------------------------------------ hub
register({
  id: 'pvp', tab: 'pvp', title: '對戰',
  mount(el) {
    setBgTheme('pvp');
    const render = () => {
      const d = S.d;
      const A = arenaState();
      el.innerHTML = `<div class="pad pvp">
<div class="panel ornate pvp-head"><div class="ph-rank"><small>競技場排名</small><b>${fmt(A.rank)}</b><span class="dim">最佳 ${fmt(A.best)}</span></div><div class="grow"><div>戰績 <b class="good">${d.pvp.wins}</b> 勝 <b class="bad">${d.pvp.losses}</b> 敗</div><div class="dim">競技幣 ${fmt(d.cur.arena)}　隊伍戰力 ${fmt(teamPower(d.team.pvp.length ? d.team.pvp : d.team.pve))}</div></div></div>
<div class="sec-title">線上對戰 <span class="more">輸入相同房號即可對戰，任何網路皆可</span></div>
<div class="pvp-online">
  <button class="pvp-big create" data-act="create">${icon('globe')}<b>建立房間</b><span>取得 5 位數房號</span></button>
  <button class="pvp-big join" data-act="join">${icon('swords')}<b>加入房間</b><span>輸入朋友的房號</span></button>
</div>
<div class="sec-title">競技場 <span class="more">今日剩餘 ${A.left}/5 次</span></div>
<div class="arena-list">${A.opponents.map((o, i) => `<div class="arena-opp"><div class="ao-rank">#${fmt(o.rank)}</div><div class="grow"><b>${esc(o.name)}</b> <span class="dim">Lv.${o.level}</span><div class="ao-team">${o.team.map((id) => `<img src="${heroImageURL(HERO_MAP[id], { crop: 'face' })}">`).join('')}</div></div><button class="btn small ${A.left ? 'primary' : ''}" data-act="arena" data-i="${i}" ${A.left ? '' : 'disabled'}>挑戰</button></div>`).join('')}</div>
<button class="btn small ghost block" data-act="reroll" style="margin-top:6px">${icon('refresh')} 更換對手</button>
<div class="sec-title">練習對戰（對電腦）</div>
<div class="row" style="gap:8px"><button class="btn grow" data-act="practice" data-d="easy">簡單</button><button class="btn blue grow" data-act="practice" data-d="normal">普通</button><button class="btn red grow" data-act="practice" data-d="hard">困難</button></div>
<button class="panel row team-row" style="margin-top:12px" data-act="team"><div class="grow"><b>對戰隊伍</b><div class="dim">線上對戰、競技場與練習使用</div></div>${icon('swords')}<span>編隊</span></button>
<div class="dim center" style="margin-top:10px">線上對戰：雙方題目完全相同，答對越快越多，能量越多。奧義可以手動施放，也可開啟 AUTO。</div>
</div>`;
    };
    render();
    bindActions(el, {
      create: () => openRoom(true),
      join: () => askCode(),
      practice: (b) => { ensurePvpTeam(); go('battle', practiceSetup(b.dataset.d)); },
      team: () => go('team', { mode: 'pvp' }),
      arena: (b) => { ensurePvpTeam(); go('battle', arenaSetup(+b.dataset.i)); },
      reroll: () => { S.d.arena.opponents = null; arenaState(); changed('arena'); },
    });
    return { refresh: render };
  },
});

function ensurePvpTeam() {
  if (!S.d.team.pvp.filter((id) => S.d.heroes[id]).length) S.d.team.pvp = S.d.team.pve.slice();
}

function askCode() {
  const body = h(`<div><p class="center dim">請輸入朋友房間的 5 位數房號</p><input class="inp code-inp" inputmode="numeric" maxlength="5" placeholder="例如 18342"></div>`);
  modal({
    title: '加入房間', body, buttons: [{ label: '取消', value: null }, { label: '加入', cls: 'primary', value: 'go' }],
    onMount(m) { setTimeout(() => m.querySelector('input').focus(), 100); },
  }).then((v) => {
    if (v !== 'go') return;
    const code = body.querySelector('input').value.trim();
    if (!/^\d{5}$/.test(code)) { toast('房號需為 5 位數字', 'bad'); return; }
    openRoom(false, code);
  });
}

async function openRoom(isHost, code) {
  ensurePvpTeam();
  const wait = h(`<div class="center"><div class="spinner"></div><p class="net-msg">連線中…</p></div>`);
  let cancelled = false;
  const mp = modal({ title: isHost ? '建立房間' : `加入房間 ${code}`, body: wait, buttons: [{ label: '取消', value: 'x' }], closable: false }).then(() => { cancelled = true; });
  const say = (t) => { const m = wait.querySelector('.net-msg'); if (m) m.textContent = t; };
  try {
    const room = isHost ? await createRoom({ version: NET_VERSION, name: S.d.profile.name, onStatus: say }) : await joinRoom(code, { version: NET_VERSION, name: S.d.profile.name, onStatus: say });
    if (cancelled) { room.close('left'); return; }
    document.querySelectorAll('.modal-wrap').forEach((m) => m.remove());
    if (session) session.leave();
    session = new Session(room, isHost);
    go('pvpRoom', {});
  } catch (e) {
    say(e.message || '連線失敗');
    toast(e.message || '連線失敗', 'bad');
  }
  void mp;
}

// ------------------------------------------------------------------ room lobby
const EMOTES = ['👍', '😂', '😮', '💪', '🔥', '🙏'];

register({
  id: 'pvpRoom', tab: 'pvp', title: '對戰房間',
  mount(el) {
    setBgTheme('pvp');
    const s = session;
    if (!s) { el.innerHTML = '<div class="pad">房間已關閉</div>'; return {}; }
    const card = (p, me) => p ? `<div class="pr-card ${p.ready ? 'ready' : ''}"><img class="pr-av" src="${heroImageURL(HERO_MAP[p.avatar] || HERO_MAP.pebble, { crop: 'face' })}"><div class="grow"><b>${esc(p.name)}</b>${me ? ' <span class="dim">（你）</span>' : ''}<div class="dim">Lv.${p.level}　戰力 ${fmt(wirePower(p.team))}</div>
<div class="ao-team">${p.team.map((w) => `<img src="${heroImageURL(HERO_MAP[w.id], { crop: 'face', skin: w.skin })}">`).join('')}</div></div><span class="pr-ready">${p.ready ? 'READY' : '準備中'}</span></div>`
      : '<div class="pr-card empty"><div class="spinner small"></div><span>等待對手加入…</span></div>';
    const render = () => {
      const P = POOLS[s.settings.pool];
      el.innerHTML = `<div class="pad">
<div class="panel ornate center room-code"><small>房間號碼</small><b>${s.room.code}</b><div class="dim">${s.isHost ? '把房號告訴朋友，請他在「加入房間」輸入' : '已加入房間'}</div></div>
${card(s.me, true)}<div class="vs-mark">VS</div>${card(s.peer, false)}
<div class="panel room-set"><div class="row"><b class="grow">題庫</b>${s.isHost ? `<select data-set="pool">${Object.entries(POOLS).map(([k, v]) => `<option value="${k}" ${k === s.settings.pool ? 'selected' : ''}>${v.zh}</option>`).join('')}</select>` : `<span>${P.zh}</span>`}</div>
<div class="row" style="margin-top:6px"><b class="grow">公平模式（全員 Lv.50、無裝備）</b>${s.isHost ? `<input type="checkbox" data-set="fair" ${s.settings.fair ? 'checked' : ''}>` : `<span>${s.settings.fair ? '開啟' : '關閉'}</span>`}</div></div>
<div class="emotes">${EMOTES.map((e) => `<button data-act="emote" data-e="${e}">${e}</button>`).join('')}</div>
<div class="row" style="gap:8px;margin-top:10px">
<button class="btn grow" data-act="leave">離開</button><button class="btn grow" data-act="team">編隊</button>
${s.isHost ? `<button class="btn primary grow" data-act="start" ${s.peer && s.peer.ready ? '' : 'disabled'}>開始對戰</button>` : `<button class="btn ${s.me.ready ? '' : 'primary'} grow" data-act="ready">${s.me.ready ? '取消準備' : '準備！'}</button>`}
</div><div class="dim center" style="margin-top:8px">連線：${s.room.status === 'connected' ? `良好（${s.room.rtt || '-'} ms）` : s.room.status === 'lagging' ? '不穩定…' : s.room.status === 'waiting' ? '等待中' : s.room.status}</div>
</div>`;
    };
    render();
    const offs = [s.on('lobby', render), s.on('status', render), s.on('emote', (e, mine) => floatEmote(el, e, mine)), s.on('closed', (r) => { toast(r === 'left' || r === 'local' ? '已離開房間' : '房間已關閉', ''); session = null; })];
    bindActions(el, {
      leave: async () => { if (await confirmBox('離開房間？')) { s.leave(); session = null; pop(); } },
      team: () => go('team', { mode: 'pvp' }),
      start: () => s.hostStart(),
      ready: () => s.setReady(!s.me.ready),
      emote: (b) => s.emote(b.dataset.e),
    });
    el.addEventListener('change', (e) => {
      const k = e.target.dataset.set;
      if (k === 'pool') s.setSettings({ pool: e.target.value });
      if (k === 'fair') s.setSettings({ fair: e.target.checked });
    });
    return {
      refresh: () => { if (session === s) { s.refreshTeam(); render(); } },
      back: () => { confirmBox('離開房間？').then((ok) => { if (ok) { s.leave(); session = null; pop(); } }); return true; },
      destroy: () => offs.forEach((f) => f()),
    };
  },
});

function floatEmote(el, e, mine) {
  const f = h(`<div class="emote-float ${mine ? 'mine' : ''}">${e}</div>`);
  el.appendChild(f);
  setTimeout(() => f.remove(), 1600);
  sfx('tap');
}

// ------------------------------------------------------------------ arena ladder (AI opponents)

export function arenaState() {
  const A = S.d.arena;
  if (A.day !== dayKey()) { A.day = dayKey(); A.tries = 0; }
  if (!A.opponents) {
    const rng = makeRng(randomSeed());
    const pl = S.d.profile.level;
    A.opponents = [0.55, 0.75, 0.92].map((f) => {
      const rank = Math.max(1, Math.round(A.rank * f - rng.int(20)));
      const quality = Math.min(1, 0.25 + (1 - rank / 3000) * 0.8);
      const level = Math.max(1, Math.round(pl * (0.9 + quality * 0.25)));
      const ids = aiTeam(rng, level, quality).map((s) => s.key);
      return { rank, name: rng.pick(AI_NAMES), level, quality, team: ids, seed: randomSeed() };
    });
  }
  return { ...A, left: Math.max(0, 5 - A.tries) };
}

function arenaSetup(i) {
  const A = S.d.arena;
  const o = A.opponents[i];
  const rng = makeRng(o.seed);
  const enemy = aiTeam(rng, o.level, o.quality);
  const units = teamUnits('pvp').length ? teamUnits('pvp') : teamUnits('pve');
  return {
    mode: 'arena', simMode: 'arena', title: `競技場 vs ${o.name}`, subtitle: `RANK #${o.rank}`, bg: 'arena', timeLimit: 90, level: S.d.profile.level,
    seed: randomSeed(), playerUnits: units, enemyUnits: enemy, enemyEnergy: false, oppName: o.name,
    opponentAI: { acc: 0.55 + o.quality * 0.38, mean: 5.2 - o.quality * 2.2, par: 6, seed: o.seed },
    deck: { books: S.d.learn.book === 'both' ? ['c', 't'] : [S.d.learn.book || 'c'], levels: [Math.min(6, 1 + Math.floor(S.d.profile.level / 16))], glv: Math.min(3, 1 + Math.floor(S.d.profile.level / 30)), grammarShare: 0.3, seed: randomSeed() },
    goldMult: 0.5, startText: 'ARENA', music: 'battle',
    onEnd: (summary) => {
      A.tries++;
      track('pvp', 1);
      const list = [];
      if (summary.win) {
        const before = A.rank;
        A.rank = Math.min(A.rank, o.rank);
        const climbed = Math.max(0, before - A.rank);
        if (A.rank < A.best) { const g = Math.min(150, Math.round((A.best - A.rank) * 0.1) + 20); A.best = A.rank; list.push(...grant({ gems: g })); }
        list.push(...grant({ arena: 60 + Math.round(climbed / 10) }));
        track('pvpWin', 1);
        S.d.pvp.wins++;
      } else {
        list.push(...grant({ arena: 15 }));
        S.d.pvp.losses++;
      }
      list.push({ k: 'gold', n: summary.gold || 0 });
      A.opponents = null;
      changed('arena');
      return { list, stars: 0, team: [], rankNow: A.rank };
    },
  };
}

export { Session, back, heroCard, elemIcon, BOOKS };
