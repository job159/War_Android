// Guest side of an online duel: a mirror of the host's Battle with the same surface the battle screen
// uses. The host streams events (reliable, batched) and snapshots (unreliable); inputs go to the host.
import { ENERGY_MAX } from './sim.js';

export class RemoteBattle {
  /** @param {{ units: object[], timeLimit: number, send: (type, data, opts?) => void }} o */
  constructor({ units, timeLimit, send }) {
    this.timeLimit = timeLimit;
    this.send = send;
    this.t = 0;
    this.cutin = 0;
    this.over = false;
    this.winner = -1;
    this.sudden = false;
    this.queue = [];
    this.lastEv = 0;
    this.sums = null;
    this.units = units.map((u) => ({ ...u, hp: u.maxHp, energy: 0, shield: 0, alive: true, statuses: [] }));
    this.sides = [0, 1].map((i) => ({ i, combo: 0, maxCombo: 0, fever: 0, dazed: 0, correct: 0, answered: 0, perfect: 0 }));
  }

  unit(id) { return this.units.find((u) => u.id === id); }
  alive(side) { return this.units.filter((u) => u.side === side && u.alive); }
  timeLeft() { return Math.max(0, this.timeLimit - this.t); }
  isFever(side) { return this.sides[side].fever > this.t; }

  step(dt) {
    if (this.over) return;
    if (this.cutin > 0) { this.cutin -= dt; return; }
    this.t = Math.min(this.timeLimit, this.t + dt);
  }

  input(side, cmd) {
    if (this.over) return false;
    if (cmd.type === 'ult') {
      const u = this.unit(cmd.unit);
      if (!u || !u.alive || u.energy < ENERGY_MAX) return false;
    }
    this.send('in', cmd);
    if (cmd.type === 'answer') {
      // optimistic HUD: combo / counters (the next snapshot is authoritative)
      const S = this.sides[side];
      S.answered++;
      if (cmd.ok) { S.correct++; S.combo++; S.maxCombo = Math.max(S.maxCombo, S.combo); } else S.combo = 0;
    }
    return true;
  }

  takeEvents() {
    const q = this.queue;
    this.queue = [];
    return q;
  }

  /** Host messages: ev {list}, snap, end. */
  onMessage(type, data) {
    if (type === 'ev') {
      for (const e of data.list || []) {
        if (e.id <= this.lastEv) continue;
        this.lastEv = e.id;
        this._apply(e);
        this.queue.push(e);
      }
    } else if (type === 'snap') this._snap(data);
    else if (type === 'end') {
      this.sums = data.sums;
      if (!this.over) {
        this.over = true;
        this.winner = data.winner;
        this.queue.push({ id: ++this.lastEv, k: 'end', winner: data.winner, reason: data.reason });
      }
    }
  }

  _apply(e) {
    const u = e.u ? this.unit(e.u) : null;
    switch (e.k) {
      case 'dmg': if (u) u.hp = e.hp; break;
      case 'heal': if (u) u.hp = e.hp; break;
      case 'death': if (u) { u.alive = false; u.hp = 0; u.energy = 0; } break;
      case 'revive': if (u) { u.alive = true; u.hp = e.hp; } break;
      case 'status': if (u) u.statuses = e.list || []; break;
      case 'shield': if (u) u.shield = e.total; break;
      case 'ult': this.cutin = 1.15; if (u) u.energy = 0; break;
      case 'sudden': this.sudden = true; break;
      default:
    }
  }

  _snap(s) {
    // never let the clock run backwards visibly; adopt the host's time when it is ahead or far off
    if (s.t > this.t || this.t - s.t > 0.5) this.t = s.t;
    this.cutin = Math.max(this.cutin, s.c || 0);
    s.u.forEach((a, i) => {
      const u = this.units[i];
      if (!u) return;
      u.hp = a[0]; u.energy = a[1]; u.shield = a[2]; u.alive = !!a[3];
      u.statuses = a[4] ? a[4].split(',') : [];
    });
    s.s.forEach((a, i) => {
      const S = this.sides[i];
      S.combo = a[0]; S.fever = this.t + a[1]; S.dazed = this.t + a[2]; S.correct = a[3]; S.answered = a[4]; S.maxCombo = a[5];
    });
    this.sudden = !!s.sd;
  }

  summary(side) {
    if (this.sums && this.sums[side]) return this.sums[side];
    const S = this.sides[side];
    return { winner: this.winner, reason: 'net', time: this.t, answered: S.answered, correct: S.correct, maxCombo: S.maxCombo, perfect: 0, fevers: 0, dmg: 0, deaths: this.units.filter((u) => u.side === side && !u.alive).length, units: [] };
  }

  /** Ends locally (e.g. the host disconnected). */
  forceEnd(winner, reason) {
    if (this.over) return;
    this.over = true;
    this.winner = winner;
    this.queue.push({ id: ++this.lastEv, k: 'end', winner, reason });
  }
}
