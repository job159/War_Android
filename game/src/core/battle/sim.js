// Battle engine (pure logic, no rendering). PvE, arena and PvP all run this; in online PvP only the
// host runs it and streams events + snapshots to the guest.
//
// Time model: step(dt) advances real time. While an ultimate's cut-in plays (`cutin` > 0) battle time
// is frozen: nobody acts, statuses and the clock pause. Answers are processed at any time.
//
// Side 0 is the player (left), side 1 the opponent (right).
import { makeRng } from '../rng.js';
import { elementMult } from '../data/elements.js';

export const ENERGY_MAX = 1000;
export const CUTIN_TIME = 1.15;
const ACT_BASE = 1.6; // seconds between actions at spd 100
const ENERGY_ACT = 60;
const ENERGY_ANSWER = 150;
const ENERGY_PASSIVE_ENEMY = 22; // per second, PvE enemies only (they cannot answer questions)
const TIER_MULT = { perfect: 1.6, great: 1.3, good: 1 };
export const FEVER_TIME = 8;
export const FEVER_EVERY = 5;
const DAZE_TIME = 1.2;
const SUDDEN_DEATH = 20;

const ALLY_TG = new Set(['self', 'allyLowest', 'allies', 'alliesOther']);

export class Battle {
  /**
   * @param {object} o
   * @param {number} o.seed
   * @param {'pve'|'pvp'|'arena'|'tower'|'raid'|'dungeon'} o.mode
   * @param {number} o.timeLimit seconds
   * @param {Array<{name:string, units:object[], auto?:boolean, enemyEnergy?:boolean}>} o.sides
   */
  constructor(o) {
    this.mode = o.mode || 'pve';
    this.rng = makeRng(o.seed || 1);
    this.timeLimit = o.timeLimit || 90;
    this.t = 0; // battle time (frozen during cut-ins)
    this.real = 0;
    this.cutin = 0;
    this.cutinUnit = null;
    this.ultQueue = [];
    this.pending = []; // scheduled effect applications
    this.events = [];
    this.evSeq = 0;
    this.over = false;
    this.winner = -1;
    this.endReason = '';
    this.sudden = false;
    this.raid = !!o.raid; // raid boss: survive the clock, damage dealt is the score
    this.sides = o.sides.map((s, i) => ({
      i, name: s.name || (i ? 'Enemy' : 'Player'), auto: !!s.auto, enemyEnergy: !!s.enemyEnergy,
      combo: 0, maxCombo: 0, fever: 0, feverCount: 0, dazed: 0,
      answered: 0, correct: 0, perfect: 0, dmgDealt: 0, lastUlt: -9,
    }));
    this.units = [];
    o.sides.forEach((s, side) => s.units.forEach((spec, slot) => this.units.push(this._makeUnit(spec, side, slot))));
    this._applyPassives();
    for (const u of this.units) {
      u.hp = u.maxHp;
      u.nextAct = 0.35 + this.rng() * 0.6 + (u.row === 'back' ? 0.25 : 0);
      if (u.charge) u.nextCharge = u.charge.every * 0.55;
    }
    this.emit('start', {});
  }

  // ---------------------------------------------------------------- setup
  _makeUnit(spec, side, slot) {
    const st = spec.stats;
    return {
      id: (side ? 'R' : 'L') + slot, side, slot, row: slot < 2 ? 'front' : 'back',
      spec, key: spec.key, kind: spec.kind, name: spec.name, element: spec.element, role: spec.role,
      boss: !!spec.boss, elite: !!spec.elite,
      base: { hp: st.hp, atk: st.atk, def: st.def, spd: st.spd, crit: st.crit, critDmg: st.critDmg, energy: st.energy || 1, heal: 0 },
      maxHp: st.hp, hp: st.hp, atk: st.atk, def: st.def, spd: st.spd, crit: st.crit, critDmg: st.critDmg, energyRate: st.energy || 1, healRecv: 0,
      lv: st.lv || 1, skillMult: 1 + 0.05 * ((st.skillLv || 1) - 1), ultMult: 1 + 0.05 * ((st.ultLv || 1) - 1),
      skills: spec.skills, charge: spec.skills.charge || null,
      energy: spec.startEnergy || 0, shield: 0, alive: true, statuses: [],
      nextAct: 0, actCount: 0, busy: 0, readyAt: -1, dmgDone: 0, healDone: 0,
      chargeUntil: 0, chargeProg: 0, nextCharge: 0,
    };
  }

  _applyPassives() {
    for (const u of this.units) {
      const p = u.spec.passive;
      if (!p) continue;
      if (p.self) this._bonus(u, p.self);
      if (p.team) for (const a of this.units) {
        if (a.side !== u.side) continue;
        if (p.teamEl && a.element !== p.teamEl) continue;
        if (p.teamRole && a.role !== p.teamRole) continue;
        this._bonus(a, p.team);
      }
    }
    for (const u of this.units) {
      const b = u.base;
      u.maxHp = Math.round(b.hp);
      u.atk = b.atk; u.def = b.def; u.spd = b.spd; u.crit = Math.min(0.85, b.crit); u.critDmg = b.critDmg; u.energyRate = b.energy; u.healRecv = b.heal;
    }
  }

  _bonus(u, mods) {
    const b = u.base;
    if (mods.hp) b.hp *= 1 + mods.hp;
    if (mods.atk) b.atk *= 1 + mods.atk;
    if (mods.def) b.def *= 1 + mods.def;
    if (mods.spd) b.spd *= 1 + mods.spd;
    if (mods.crit) b.crit += mods.crit;
    if (mods.critDmg) b.critDmg += mods.critDmg;
    if (mods.energy) b.energy += mods.energy;
    if (mods.heal) b.heal += mods.heal;
  }

  emit(k, data) {
    const e = { id: ++this.evSeq, t: +this.t.toFixed(3), k, ...data };
    this.events.push(e);
    return e;
  }

  takeEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }

  // ---------------------------------------------------------------- queries
  alive(side) { return this.units.filter((u) => u.side === side && u.alive); }
  unit(id) { return this.units.find((u) => u.id === id); }
  timeLeft() { return Math.max(0, this.timeLimit - this.t); }
  has(u, st) { return u.statuses.some((s) => s.id === st && s.until > this.t); }
  stat(u, st) { let v = 0; for (const s of u.statuses) if (s.id === st && s.until > this.t) v = Math.max(v, s.p || 0); return v; }
  canAct(u) {
    if (!u.alive || this.has(u, 'stun') || this.has(u, 'freeze')) return false;
    return this.sides[u.side].dazed <= this.t;
  }
  effAtk(u) { return u.atk * Math.max(0.3, 1 + this.stat(u, 'atkUp') - this.stat(u, 'atkDown')); }
  effDef(u) { return u.def * Math.max(0.2, 1 + this.stat(u, 'defUp') - this.stat(u, 'defDown') - (this.has(u, 'broken') ? 0.3 : 0)); }
  effSpd(u) { return u.spd * Math.max(0.4, 1 + this.stat(u, 'spdUp') - this.stat(u, 'spdDown')); }
  effCrit(u) { return Math.min(0.9, u.crit + this.stat(u, 'critUp')); }
  isFever(side) { return this.sides[side].fever > this.t; }
  ultReady(u) { return u.alive && u.energy >= ENERGY_MAX && !this.ultQueue.includes(u) && this.cutinUnit !== u; }

  // ---------------------------------------------------------------- input
  /** Player input: { type: 'answer', ok, tier: 'perfect'|'great'|'good' } or { type: 'ult', unit: id } */
  input(side, cmd) {
    if (this.over) return false;
    if (cmd.type === 'answer') return this._answer(side, cmd);
    if (cmd.type === 'ult') {
      const u = this.unit(cmd.unit);
      if (!u || u.side !== side || !this.ultReady(u)) return false;
      if (this.has(u, 'stun') || this.has(u, 'freeze')) return false;
      this.ultQueue.push(u);
      return true;
    }
    if (cmd.type === 'auto') { this.sides[side].auto = !!cmd.on; return true; }
    return false;
  }

  _answer(side, { ok, tier = 'good' }) {
    const S = this.sides[side];
    S.answered++;
    const boss = this.units.find((u) => u.alive && u.side !== side && u.chargeUntil > this.t);
    if (ok) {
      S.correct++;
      S.combo++;
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      if (tier === 'perfect') S.perfect++;
      let feverStart = false;
      if (S.combo % FEVER_EVERY === 0) {
        feverStart = S.fever <= this.t;
        S.fever = Math.max(S.fever, this.t) + FEVER_TIME * (feverStart ? 1 : 0.6);
        if (feverStart) S.feverCount++;
      }
      const gain = ENERGY_ANSWER * (TIER_MULT[tier] || 1) * (this.isFever(side) ? 1.5 : 1);
      for (const u of this.alive(side)) this._gainEnergy(u, gain * u.energyRate);
      this.emit('answer', { side, ok: true, tier, combo: S.combo, fever: feverStart, gain: Math.round(gain) });
      if (boss) {
        boss.chargeProg++;
        this.emit('chargeProg', { u: boss.id, n: boss.chargeProg, need: boss.charge.need });
        if (boss.chargeProg >= boss.charge.need) this._break(boss);
      }
    } else {
      const broke = S.combo;
      S.combo = 0;
      S.dazed = this.t + DAZE_TIME;
      this.emit('answer', { side, ok: false, broke });
      if (boss && boss.chargeProg > 0) {
        boss.chargeProg--;
        this.emit('chargeProg', { u: boss.id, n: boss.chargeProg, need: boss.charge.need });
      }
    }
    return true;
  }

  _gainEnergy(u, n) {
    if (!u.alive) return;
    const was = u.energy;
    u.energy = Math.min(ENERGY_MAX, u.energy + n);
    if (was < ENERGY_MAX && u.energy >= ENERGY_MAX) u.readyAt = this.t;
  }

  // ---------------------------------------------------------------- main loop
  step(dt) {
    if (this.over) return;
    this.real += dt;
    if (this.cutin > 0) {
      this.cutin -= dt;
      if (this.cutin <= 0) this._fireUlt();
      return;
    }
    // start a queued ultimate (manual or AI) before anything else this frame
    this._autoUlt();
    if (this.ultQueue.length) {
      const u = this.ultQueue.shift();
      if (u.alive && u.energy >= ENERGY_MAX && !this.has(u, 'stun') && !this.has(u, 'freeze')) {
        u.energy = 0;
        u.readyAt = -1;
        this.cutin = CUTIN_TIME;
        this.cutinUnit = u;
        this.sides[u.side].lastUlt = this.t;
        this.emit('ult', { u: u.id, name: u.skills.ult.zh, en: u.skills.ult.en });
        return;
      }
    }
    this.t += dt;
    const t = this.t;
    if (!this.sudden && this.mode === 'pvp' && this.timeLeft() <= SUDDEN_DEATH) {
      this.sudden = true;
      this.emit('sudden', {});
    }
    // scheduled impacts
    if (this.pending.length) {
      this.pending.sort((a, b) => a.at - b.at);
      while (this.pending.length && this.pending[0].at <= t) {
        const p = this.pending.shift();
        this._resolve(p);
        if (this.over) return;
      }
    }
    this._tickStatuses(dt);
    if (this.over) return;
    for (const u of this.units) {
      if (!u.alive) continue;
      if (u.charge) this._tickCharge(u);
      if (this.sides[u.side].enemyEnergy) this._gainEnergy(u, ENERGY_PASSIVE_ENEMY * dt * u.energyRate);
      if (u.busy > t || u.chargeUntil > t) continue;
      if (t >= u.nextAct && this.canAct(u)) this._act(u);
    }
    if (t >= this.timeLimit) this._timeUp();
  }

  _tickStatuses(dt) {
    const t = this.t;
    for (const u of this.units) {
      if (!u.alive) continue;
      for (const s of u.statuses) {
        if (s.until <= t) continue;
        if (s.id === 'burn' || s.id === 'poison' || s.id === 'regen') {
          s.acc = (s.acc || 0) + dt;
          while (s.acc >= 1) {
            s.acc -= 1;
            if (s.id === 'regen') this._heal(null, u, s.p * s.srcAtk, true);
            else this._dot(u, s.p * s.srcAtk, s.id, s.src);
            if (!u.alive) break;
          }
        }
      }
      const before = u.statuses.length;
      u.statuses = u.statuses.filter((s) => s.until > t);
      if (u.statuses.length !== before) this.emit('status', { u: u.id, list: this.statusList(u) });
    }
  }

  statusList(u) {
    return [...new Set(u.statuses.filter((s) => s.until > this.t).map((s) => s.id))];
  }

  // ---------------------------------------------------------------- actions
  _act(u) {
    const sk = u.skills;
    u.actCount++;
    const silenced = this.has(u, 'silence');
    const useSkill = sk.skill && sk.skill.every && u.actCount % sk.skill.every === 0 && !silenced;
    const def = useSkill ? sk.skill : sk.normal;
    const kind = useSkill ? 'skill' : 'normal';
    const ranged = def.range === 'ranged' || useSkill;
    const impact = useSkill ? 0.5 : ranged ? 0.42 : 0.3;
    const planned = this._plan(u, def, this.t + impact, useSkill ? 0.12 : 0.13, useSkill ? u.skillMult : 1);
    if (!planned.targets.length) {
      u.nextAct = this.t + 0.3;
      return;
    }
    u.busy = this.t + (useSkill ? 0.95 : 0.7);
    u.nextAct = this.t + (ACT_BASE * 100) / this.effSpd(u);
    this._gainEnergy(u, ENERGY_ACT * u.energyRate);
    this.emit('act', { u: u.id, a: kind, vfx: def.vfx, tg: planned.targets, impact, hits: planned.hits, name: useSkill ? def.zh : undefined, melee: !ranged });
  }

  /** Schedules every part of a skill; returns the first part's targets (for the animation). */
  _plan(u, def, at, spacing, mult) {
    let first = null;
    let hits = 1;
    for (const part of def.parts) {
      const tg = this._targets(u, part.tg);
      if (!tg.length) continue;
      if (!first) first = tg.map((x) => x.id);
      for (const fx of part.fx) {
        if (fx.dmg != null) {
          const n = fx.hits || 1;
          hits = Math.max(hits, n);
          for (let h = 0; h < n; h++) {
            const targets = fx.rnd ? null : tg;
            this.pending.push({ at: at + h * spacing, src: u, fx, targets, tg: part.tg, mult, hit: h });
          }
        } else {
          this.pending.push({ at: at + 0.02, src: u, fx, targets: tg, tg: part.tg, mult });
        }
      }
    }
    return { targets: first || [], hits };
  }

  _targets(u, tg) {
    const foes = this.units.filter((x) => x.side !== u.side && x.alive);
    const allies = this.units.filter((x) => x.side === u.side && x.alive);
    if (ALLY_TG.has(tg)) {
      if (tg === 'self') return u.alive ? [u] : [];
      if (tg === 'allies') return allies;
      if (tg === 'alliesOther') return allies.filter((x) => x !== u);
      if (tg === 'allyLowest') return allies.length ? [allies.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a))] : [];
    }
    if (!foes.length) return [];
    if (tg === 'all') return foes;
    if (tg === 'frontRow') {
      const f = foes.filter((x) => x.row === 'front');
      return f.length ? f : foes;
    }
    const taunt = foes.filter((x) => this.has(x, 'taunt'));
    if (taunt.length) return [taunt[0]];
    if (tg === 'front') {
      const f = foes.filter((x) => x.row === 'front');
      const pool = f.length ? f : foes;
      return [pool.reduce((a, b) => (b.slot < a.slot ? b : a))];
    }
    if (tg === 'back') {
      const b = foes.filter((x) => x.row === 'back');
      const pool = b.length ? b : foes;
      return [pool[this.rng.int(pool.length)]];
    }
    if (tg === 'lowest') return [foes.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a))];
    return [foes[this.rng.int(foes.length)]]; // random
  }

  _resolve(p) {
    const { src, fx } = p;
    // a dead caster's queued hits still land (the projectile is in the air) unless it is a heal/buff
    let targets = p.targets ? p.targets.filter((x) => x.alive) : this._targets(src, p.tg);
    if (!targets.length && p.targets && fx.dmg != null && !ALLY_TG.has(p.tg)) targets = this._targets(src, p.tg === 'all' || p.tg === 'frontRow' ? p.tg : 'random');
    if (!targets.length) return;
    if (fx.revive != null) {
      for (const x of this.units.filter((y) => y.side === src.side && !y.alive)) {
        x.alive = true; x.hp = Math.round(x.maxHp * fx.revive); x.statuses = []; x.nextAct = this.t + 1;
        this.emit('revive', { u: x.id, hp: x.hp });
      }
      return;
    }
    for (const x of targets) {
      if (!x.alive && fx.dmg == null) continue;
      if (fx.dmg != null) this._damage(src, x, fx, p.mult, p.hit || 0);
      else if (fx.heal != null) this._heal(src, x, this.effAtk(src) * fx.heal * p.mult);
      else if (fx.healPct != null) this._heal(src, x, x.maxHp * fx.healPct);
      else if (fx.shield != null || fx.shieldPct != null) {
        const v = fx.shield != null ? this.effAtk(src) * fx.shield * p.mult : src.maxHp * fx.shieldPct * p.mult;
        x.shield = Math.min(x.maxHp * 0.6, x.shield + v);
        this.emit('shield', { u: x.id, v: Math.round(v), total: Math.round(x.shield) });
      } else if (fx.st) this._applyStatus(src, x, fx);
      else if (fx.en != null) { this._gainEnergy(x, fx.en); this.emit('energy', { u: x.id, v: fx.en }); }
      else if (fx.cleanse) {
        const before = x.statuses.length;
        x.statuses = x.statuses.filter((s) => !BAD.has(s.id));
        if (x.statuses.length !== before) this.emit('status', { u: x.id, list: this.statusList(x), cleanse: true });
      }
    }
  }

  _applyStatus(src, x, fx) {
    if (fx.ch != null && this.rng() > fx.ch) return;
    let d = fx.d || 3;
    if ((fx.st === 'stun' || fx.st === 'freeze') && x.boss) d *= 0.4; // bosses shrug off control
    const until = this.t + d;
    const old = x.statuses.find((s) => s.id === fx.st);
    const srcAtk = this.effAtk(src);
    if (old) { old.until = Math.max(old.until, until); old.p = Math.max(old.p || 0, fx.p || 0); old.srcAtk = Math.max(old.srcAtk || 0, srcAtk); }
    else x.statuses.push({ id: fx.st, p: fx.p || 0, until, srcAtk, src: src.id });
    if (fx.st === 'stun' || fx.st === 'freeze') {
      x.busy = 0;
      if (x.chargeUntil > this.t && x.boss) { /* control does not cancel a boss charge */ }
    }
    this.emit('status', { u: x.id, list: this.statusList(x), add: fx.st, by: src.id });
  }

  _damage(src, x, fx, mult, hit) {
    if (!x.alive) return;
    const S = this.sides[src.side];
    const atk = this.effAtk(src);
    let def = this.effDef(x);
    if (fx.pierce) def *= 1 - fx.pierce;
    const mitig = def / (def + 20 * src.lv + 200);
    let dmg = atk * fx.dmg * mult * (1 - mitig);
    const em = elementMult(src.element, x.element);
    dmg *= em;
    const crit = this.rng() < this.effCrit(src);
    if (crit) dmg *= src.critDmg;
    dmg *= 1 + 0.02 * Math.min(S.combo, 20);
    if (this.isFever(src.side)) dmg *= 1.25;
    if (this.has(x, 'broken')) dmg *= 1.3;
    if (this.sudden) dmg *= 1.5;
    if (fx.ex && x.hp / x.maxHp < 0.3) dmg *= 1 + fx.ex;
    dmg *= 0.95 + this.rng() * 0.1;
    dmg = Math.max(1, Math.round(dmg));
    let absorbed = 0;
    if (x.shield > 0) {
      absorbed = Math.min(x.shield, dmg);
      x.shield -= absorbed;
    }
    const real = dmg - absorbed;
    x.hp -= real;
    src.dmgDone += dmg;
    S.dmgDealt += dmg;
    this._gainEnergy(x, (400 * real) / x.maxHp * x.energyRate);
    const kill = x.hp <= 0;
    this.emit('dmg', { u: x.id, s: src.id, v: dmg, crit, el: em > 1 ? 1 : em < 1 ? -1 : 0, sh: absorbed, hit, hp: Math.max(0, Math.round(x.hp)) });
    if (kill) this._kill(x, src);
  }

  _dot(x, amount, kind, srcId) {
    let dmg = Math.max(1, Math.round(amount * (this.sudden ? 1.5 : 1)));
    if (x.boss) dmg = Math.round(dmg * 0.7);
    x.hp -= dmg;
    const src = this.unit(srcId);
    if (src) { src.dmgDone += dmg; this.sides[src.side].dmgDealt += dmg; }
    this.emit('dmg', { u: x.id, s: srcId, v: dmg, dot: kind, hp: Math.max(0, Math.round(x.hp)) });
    if (x.hp <= 0) this._kill(x, src);
  }

  _heal(src, x, amount, regen = false) {
    if (!x.alive) return;
    const v = Math.round(amount * (1 + (x.healRecv || 0)));
    const real = Math.min(v, x.maxHp - x.hp);
    x.hp += real;
    if (src) src.healDone += real;
    this.emit('heal', { u: x.id, v: Math.max(real, 0), regen, hp: Math.round(x.hp) });
  }

  _kill(x, src) {
    if (this.raid && x.boss) { x.hp = 1; return; } // raid bosses cannot die; the clock ends the fight
    x.alive = false;
    x.hp = 0;
    x.shield = 0;
    x.energy = 0;
    x.statuses = [];
    x.chargeUntil = 0;
    this.ultQueue = this.ultQueue.filter((u) => u !== x);
    this.emit('death', { u: x.id, by: src ? src.id : null });
    this._checkEnd();
  }

  _checkEnd() {
    const a = this.alive(0).length;
    const b = this.alive(1).length;
    if (a && b) return;
    this._end(a ? 0 : b ? 1 : 1, 'wipe');
  }

  _timeUp() {
    if (this.raid) { this._end(0, 'time'); return; }
    if (this.mode === 'pvp' || this.mode === 'arena') {
      const ratio = (s) => {
        const us = this.units.filter((u) => u.side === s);
        return us.reduce((acc, u) => acc + Math.max(0, u.hp) / u.maxHp, 0) / us.length;
      };
      const r0 = ratio(0), r1 = ratio(1);
      this._end(Math.abs(r0 - r1) < 0.001 ? -1 : r0 > r1 ? 0 : 1, 'time');
    } else this._end(1, 'time');
  }

  /** The given side gives up (online duels, or a disconnected peer). */
  surrender(side) {
    this._end(1 - side, 'surrender');
  }

  _end(winner, reason) {
    if (this.over) return;
    this.over = true;
    this.winner = winner;
    this.endReason = reason;
    this.emit('end', { winner, reason });
  }

  // ---------------------------------------------------------------- ultimates
  _fireUlt() {
    const u = this.cutinUnit;
    this.cutin = 0;
    this.cutinUnit = null;
    if (!u || !u.alive) return;
    const def = u.skills.ult;
    const planned = this._plan(u, def, this.t + 0.18, 0.16, u.ultMult);
    u.busy = this.t + 1.0;
    u.nextAct = Math.max(u.nextAct, this.t + 0.8);
    this.emit('ultFire', { u: u.id, vfx: def.vfx, tg: planned.targets, hits: planned.hits });
  }

  _autoUlt() {
    for (const S of this.sides) {
      if (!S.auto) continue;
      if (this.t - S.lastUlt < 0.9) continue; // stagger a side's ultimates
      for (const u of this.alive(S.i)) {
        if (!this.ultReady(u) || this.has(u, 'stun') || this.has(u, 'freeze')) continue;
        const waited = this.t - u.readyAt;
        if (waited < 0.35) continue;
        if (u.role === 'healer') {
          const hurt = this.alive(S.i).some((a) => a.hp / a.maxHp < 0.62);
          if (!hurt && waited < 7) continue;
        }
        this.ultQueue.push(u);
        S.lastUlt = this.t;
        break;
      }
    }
  }

  // ---------------------------------------------------------------- boss charge (BREAK)
  _tickCharge(u) {
    const t = this.t;
    if (u.chargeUntil > 0 && t >= u.chargeUntil) {
      // not broken in time: unleash
      u.chargeUntil = 0;
      u.nextCharge = t + u.charge.every;
      this._plan(u, u.charge, t + 0.35, 0.15, 1);
      u.busy = t + 1.2;
      this.emit('chargeBlast', { u: u.id, vfx: u.charge.vfx, name: u.charge.zh });
      return;
    }
    if (u.chargeUntil === 0 && t >= u.nextCharge && this.canAct(u) && u.busy <= t) {
      const other = this.units.some((x) => x !== u && x.chargeUntil > t);
      if (other) { u.nextCharge = t + 3; return; }
      u.chargeUntil = t + u.charge.dur;
      u.chargeProg = 0;
      this.emit('charge', { u: u.id, name: u.charge.zh, need: u.charge.need, dur: u.charge.dur });
    }
  }

  _break(u) {
    u.chargeUntil = 0;
    u.chargeProg = 0;
    u.nextCharge = this.t + u.charge.every;
    u.statuses.push({ id: 'stun', p: 0, until: this.t + 3.5, srcAtk: 0, src: null });
    u.statuses.push({ id: 'broken', p: 0, until: this.t + 7, srcAtk: 0, src: null });
    u.busy = 0;
    this.emit('break', { u: u.id });
    this.emit('status', { u: u.id, list: this.statusList(u) });
  }

  // ---------------------------------------------------------------- PvP sync
  /** Compact state for the guest (sent unreliably several times a second). */
  snapshot() {
    return {
      t: +this.t.toFixed(2), c: +Math.max(0, this.cutin).toFixed(2), cu: this.cutinUnit ? this.cutinUnit.id : null,
      u: this.units.map((u) => [Math.round(u.hp), Math.round(u.energy), Math.round(u.shield), u.alive ? 1 : 0, this.statusList(u).join(','), u.chargeUntil > this.t ? +(u.chargeUntil - this.t).toFixed(1) : 0, u.chargeProg]),
      s: this.sides.map((S) => [S.combo, +Math.max(0, S.fever - this.t).toFixed(2), +Math.max(0, S.dazed - this.t).toFixed(2), S.correct, S.answered, S.maxCombo]),
      sd: this.sudden ? 1 : 0,
    };
  }

  /** Summary for results screens. */
  summary(side = 0) {
    const S = this.sides[side];
    return {
      winner: this.winner, reason: this.endReason, time: this.t,
      answered: S.answered, correct: S.correct, maxCombo: S.maxCombo, perfect: S.perfect, fevers: S.feverCount, dmg: S.dmgDealt,
      deaths: this.units.filter((u) => u.side === side && !u.alive).length,
      units: this.units.filter((u) => u.side === side).map((u) => ({ key: u.key, dmg: u.dmgDone, heal: u.healDone, alive: u.alive })),
    };
  }
}

const BAD = new Set(['burn', 'poison', 'stun', 'freeze', 'atkDown', 'defDown', 'spdDown', 'silence']);
