// Battle renderer: region background, unit sprites (idle / lunge / hit / death), status visuals,
// floating numbers, camera shake / flash / dim, and the skill VFX (vfx.js) driven by sim events.
import { FX, rgba, ease, sprite } from './particles.js';
import { playVfx, PAL, glowBurst, ring, rising } from './vfx.js';
import { makeRng } from '../core/rng.js';

export const BG = {
  plains: { sky: ['#5aa8e8', '#bfe8ff'], far: '#6a9ac8', mid: '#4a9a5a', ground: ['#5ab85a', '#2a6a2a'], amb: 'leaf', ambC: '#a8e86a', deco: 'trees' },
  forest: { sky: ['#1a3a4a', '#4a8a7a'], far: '#1a3a2a', mid: '#2a5a2a', ground: ['#3a6a2a', '#1a3a14'], amb: 'glow', ambC: '#d8ff9a', deco: 'pines' },
  canyon: { sky: ['#3a0a10', '#c84a1a'], far: '#5a1a10', mid: '#7a2a14', ground: ['#8a3a1a', '#3a1008'], amb: 'glow', ambC: '#ffb04a', deco: 'lava' },
  tundra: { sky: ['#4a6a9a', '#d8ecff'], far: '#a8c8e8', mid: '#d8ecff', ground: ['#e8f4ff', '#9ab8d8'], amb: 'snow', ambC: '#ffffff', deco: 'crystals' },
  sky: { sky: ['#4a7ad8', '#ffe8c8'], far: '#ffffff', mid: '#e8f0ff', ground: ['#f4f0e0', '#c8b890'], amb: 'feather', ambC: '#ffffff', deco: 'pillars' },
  graveyard: { sky: ['#0a0614', '#3a2a5a'], far: '#1a1430', mid: '#2a2040', ground: ['#3a3048', '#14101c'], amb: 'glow', ambC: '#9a7aff', deco: 'graves' },
  harbor: { sky: ['#0a2a4a', '#3a8aa8'], far: '#1a4a6a', mid: '#2a6a8a', ground: ['#3a7a9a', '#0a2a3a'], amb: 'bubble', ambC: '#9ee0ff', deco: 'masts' },
  ruins: { sky: ['#3a2a14', '#c8a86a'], far: '#6a5a3a', mid: '#8a7a5a', ground: ['#9a8a6a', '#4a3a24'], amb: 'glow', ambC: '#ffe0a0', deco: 'gears' },
  labyrinth: { sky: ['#1a0a2a', '#6a3aa8'], far: '#2a1a4a', mid: '#4a2a7a', ground: ['#5a3a8a', '#1a0a2a'], amb: 'star', ambC: '#e0c8ff', deco: 'walls' },
  battlefield: { sky: ['#3a0a14', '#ff8a3a'], far: '#4a1a1a', mid: '#6a2a1a', ground: ['#7a4a2a', '#2a1008'], amb: 'glow', ambC: '#ff9a4a', deco: 'banners' },
  citadel: { sky: ['#06060c', '#2a2a4a'], far: '#14141e', mid: '#20202e', ground: ['#2a2a3a', '#0a0a12'], amb: 'glow', ambC: '#6a6aff', deco: 'pillars' },
  tower: { sky: ['#140414', '#7a2a8a'], far: '#2a0a2a', mid: '#4a1a4a', ground: ['#5a2a5a', '#14041a'], amb: 'star', ambC: '#ff8ad8', deco: 'runes' },
  arena: { sky: ['#1a0a2a', '#8a3a5a'], far: '#3a1a3a', mid: '#5a2a4a', ground: ['#6a4a5a', '#1a0a14'], amb: 'star', ambC: '#ffd84a', deco: 'banners' },
};

export class BattleView {
  constructor(canvas, { bg = 'plains', quality = 'high' } = {}) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.fx = new FX();
    this.fx.setQuality(quality !== 'low');
    this.ambFx = new FX();
    this.bgKey = BG[bg] ? bg : 'plains';
    this.units = new Map();
    this.floats = [];
    this.shakeA = 0; this.shakeT = 0; this.shakeDur = 0;
    this.flashes = [];
    this.dimA = 0; this.dimT = 0;
    this.time = 0;
    this.fever = [0, 0];
    this.frozen = false; // cut-in: units stop animating
    this.rng = makeRng(7);
    this.dpr = Math.min(2, window.devicePixelRatio || 1) * (quality === 'low' ? 0.75 : 1);
    this.resize();
  }

  resize() {
    const r = this.c.getBoundingClientRect();
    this.w = Math.max(10, r.width);
    this.h = Math.max(10, r.height);
    this.c.width = Math.round(this.w * this.dpr);
    this.c.height = Math.round(this.h * this.dpr);
    this.bgCanvas = null;
    for (const u of this.units.values()) this._place(u);
  }

  // ---------------------------------------------------------------- units

  /** info: { id, side, slot, boss, scale, imgs: {normal, hurt, attack}, flip, element, name, n (units on side), maxHp } */
  addUnit(info) {
    const u = { ...info, hp: info.maxHp, maxHp: info.maxHp, alive: true, energy: 0, shield: 0, statuses: [], phase: Math.random() * 6, off: [0, 0], lunge: null, hitT: 0, hurtT: 0, flashT: 0,
      castT: 0, deathT: 0, charge: 0, chargeProg: 0, chargeNeed: 0, cache: {} };
    this.units.set(u.id, u);
    this._place(u);
  }

  _place(u) {
    const W = this.w, H = this.h;
    const bossSide = [...this.units.values()].some((x) => x.side === u.side && x.boss);
    let fx, fy;
    if (bossSide) {
      const pos = u.boss ? [0.74, 0.86] : u.slot === 1 ? [0.56, 0.94] : [0.92, 0.6];
      [fx, fy] = pos;
    } else {
      const P = [[0.37, 0.6], [0.37, 0.92], [0.15, 0.55], [0.15, 0.86]];
      [fx, fy] = P[u.slot] || P[0];
      if (u.side === 1) fx = 1 - fx;
    }
    u.x = W * fx;
    u.y = H * fy;
    const base = Math.min(H * 0.34, W * 0.3);
    u.h = base * (u.boss ? u.scale || 1.7 : 1) * (u.monster ? 0.92 : 1);
    u.w = u.monster ? u.h : u.h * 0.74;
    u.cy = u.y - u.h * 0.45;
  }

  unit(id) { return this.units.get(id); }

  sync(id, hp, alive, energy, shield, statuses) {
    const u = this.units.get(id);
    if (!u) return;
    u.hp = hp; u.energy = energy; u.shield = shield;
    if (statuses) u.statuses = statuses;
    if (u.alive && !alive) this._die(u);
    if (!u.alive && alive) { u.alive = true; u.deathT = 0; }
  }

  _die(u) {
    u.alive = false;
    u.deathT = 0.001;
    rising({ fx: this.fx }, u.x, u.y - 10, 'glow', '#ffffff', 16, { spread: u.w * 0.6, speed: 120, size: 8 });
    glowBurst({ fx: this.fx }, u.x, u.cy, PAL[u.element] ? PAL[u.element][1] : '#fff', 18, 200, 9, 0, 0.6);
  }

  // ---------------------------------------------------------------- camera
  shake(a, dur = 0.25, delay = 0) {
    if (delay > 0) { setTimeout(() => this.shake(a, dur), delay * 1000); return; }
    if (a >= this.shakeA * (this.shakeT / (this.shakeDur || 1))) { this.shakeA = a; this.shakeT = dur; this.shakeDur = dur; }
  }
  flash(color, a = 0.5, dur = 0.25, delay = 0) { this.flashes.push({ color, a, dur, t: -delay }); }
  dim(a = 0.6, dur = 1) { this.dimA = Math.max(this.dimA, a); this.dimT = Math.max(this.dimT, dur); }

  // ---------------------------------------------------------------- events

  /** Reacts to one battle event (from the sim or the network). */
  event(e, sideOfViewer = 0) {
    const U = (id) => this.units.get(id);
    switch (e.k) {
      case 'act': {
        const u = U(e.u);
        if (!u) return;
        const tg = (e.tg || []).map(U).filter(Boolean);
        if (e.melee && tg[0]) u.lunge = { tx: tg[0].x - (tg[0].x > u.x ? 1 : -1) * tg[0].w * 0.55, ty: tg[0].y + 2, t: 0, hit: e.impact, back: e.impact + 0.3 };
        else u.castT = 0.45;
        if (e.a === 'skill') { u.castT = 0.6; this._skillName(u, e.name); }
        playVfx(e.vfx, { fx: this.fx, view: this, src: u, tg, el: u.element, kind: e.a, impact: e.impact, hits: e.hits || 1, melee: e.melee });
        break;
      }
      case 'ultFire': {
        const u = U(e.u);
        if (!u) return;
        const tg = (e.tg || []).map(U).filter(Boolean);
        u.castT = 0.9;
        playVfx(e.vfx, { fx: this.fx, view: this, src: u, tg, el: u.element, kind: 'ult', impact: 0.18, hits: e.hits || 1 });
        break;
      }
      case 'chargeBlast': {
        const u = U(e.u);
        if (!u) return;
        const tg = [...this.units.values()].filter((x) => x.side !== u.side && x.alive);
        u.charge = 0;
        playVfx(e.vfx, { fx: this.fx, view: this, src: u, tg, el: u.element, kind: 'charge', impact: 0.35, hits: 1 });
        this.flash('#ff2a2a', 0.35, 0.3, 0.3);
        break;
      }
      case 'dmg': {
        const u = U(e.u);
        if (!u) return;
        u.hp = e.hp;
        if (e.dot) {
          this._float(u, e.v, e.dot === 'burn' ? '#ffa04a' : '#b8e85a', 0.8);
          break;
        }
        u.flashT = 0.1;
        u.hurtT = 0.28;
        const src = U(e.s);
        u.hitT = 0.18;
        u.hitDir = src ? (src.x < u.x ? 1 : -1) : (u.side === 0 ? -1 : 1);
        const foe = u.side !== sideOfViewer;
        this._float(u, e.v, e.crit ? '#ffd84a' : foe ? '#ffffff' : '#ff8a8a', e.crit ? 1.35 : 1, e.crit ? '暴擊' : foe && e.el > 0 ? '弱點' : foe && e.el < 0 ? '抵抗' : '');
        if (e.sh) this._float(u, e.sh, '#7ae0ff', 0.8, '吸收');
        if (e.crit) this.shake(3, 0.12);
        break;
      }
      case 'heal': {
        const u = U(e.u);
        if (!u || e.v <= 0) return;
        u.hp = e.hp;
        if (!e.regen || e.v > u.maxHp * 0.03) this._float(u, '+' + e.v, '#5aff9a', e.regen ? 0.75 : 1);
        break;
      }
      case 'shield': {
        const u = U(e.u);
        if (u) u.shield = e.total;
        break;
      }
      case 'status': {
        const u = U(e.u);
        if (!u) return;
        u.statuses = e.list || [];
        if (e.add === 'stun' || e.add === 'freeze') ring({ fx: this.fx }, u.x, u.y - u.h, e.add === 'freeze' ? '#9ee0ff' : '#ffd84a', 4, 24, 0.4, 0, 3, 0.4);
        break;
      }
      case 'death': {
        const u = U(e.u);
        if (u && u.alive) this._die(u);
        break;
      }
      case 'revive': {
        const u = U(e.u);
        if (u) { u.alive = true; u.deathT = 0; u.hp = e.hp; rising({ fx: this.fx }, u.x, u.y, 'star', '#fff6c4', 16); }
        break;
      }
      case 'charge': {
        const u = U(e.u);
        if (u) { u.charge = e.dur; u.chargeNeed = e.need; u.chargeProg = 0; }
        break;
      }
      case 'chargeProg': {
        const u = U(e.u);
        if (u) u.chargeProg = e.n;
        break;
      }
      case 'break': {
        const u = U(e.u);
        if (!u) return;
        u.charge = 0;
        this.flash('#ffffff', 0.7, 0.3);
        this.shake(12, 0.4);
        glowBurst({ fx: this.fx }, u.x, u.cy, '#ffd84a', 40, 500, 14, 0, 0.8);
        ring({ fx: this.fx }, u.x, u.cy, '#ffffff', 10, 200, 0.6, 0, 10, 0.8);
        this._float(u, '破防！', '#ffd84a', 1.8);
        break;
      }
      default:
    }
  }

  _skillName(u, name) {
    if (!name) return;
    this.floats.push({ x: u.x, y: u.y - u.h - 20, text: name, color: '#fff2c4', size: 13, t: 0, life: 1.1, label: '', banner: true });
  }

  _float(u, v, color, size = 1, label = '') {
    const n = this.floats.filter((f) => f.u === u && f.t < 0.3).length;
    this.floats.push({ u, x: u.x + (Math.random() - 0.5) * u.w * 0.5, y: u.cy - u.h * 0.15 - n * 16, text: String(v), color, size, t: 0, life: 0.9 + size * 0.2, label });
  }

  // ---------------------------------------------------------------- per-frame

  update(dt) {
    this.time += dt;
    const unitDt = this.frozen ? dt * 0.08 : dt;
    this.fx.update(this.frozen ? dt * 0.25 : dt);
    this.ambFx.update(dt);
    for (const u of this.units.values()) {
      if (u.lunge) {
        u.lunge.t += unitDt;
        if (u.lunge.t > u.lunge.back + 0.25) u.lunge = null;
      }
      u.castT = Math.max(0, u.castT - unitDt);
      u.hitT = Math.max(0, u.hitT - unitDt);
      u.hurtT = Math.max(0, u.hurtT - unitDt);
      u.flashT = Math.max(0, u.flashT - unitDt);
      if (u.charge > 0) {
        u.charge = Math.max(0, u.charge - unitDt);
        if (Math.random() < 0.5) {
          const a = Math.random() * 6.28, d = u.w * (0.6 + Math.random() * 0.4);
          this.fx.emit({ x: u.x + Math.cos(a) * d, y: u.cy + Math.sin(a) * d * 0.7, vx: -Math.cos(a) * d * 2, vy: -Math.sin(a) * d * 1.4, kind: 'spark', color: '#ff4a3a', size: 6, life: 0.45, stretch: 0.04 });
        }
      }
      if (!u.alive && u.deathT > 0) u.deathT += unitDt;
    }
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter((f) => f.t < f.life);
    this.shakeT = Math.max(0, this.shakeT - dt);
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < f.dur);
    this.dimT = Math.max(0, this.dimT - dt);
    if (this.dimT <= 0) this.dimA = Math.max(0, this.dimA - dt * 2);
    this._ambient(dt);
  }

  _ambient(dt) {
    const B = BG[this.bgKey];
    if (this.ambFx.parts.length > 40 || Math.random() > dt * 14) return;
    const W = this.w, H = this.h;
    const k = B.amb;
    if (k === 'snow' || k === 'feather' || k === 'leaf') this.ambFx.emit({ x: Math.random() * W, y: -8, vx: -10 + Math.random() * 20, vy: 30 + Math.random() * 30, kind: k, color: B.ambC, size: k === 'snow' ? 3 : 5, size1: 3, life: H / 40, a0: 0.8, a1: 0.4, vr: 2, blend: 'source-over' });
    else this.ambFx.emit({ x: Math.random() * W, y: H * (0.4 + Math.random() * 0.6), vx: (Math.random() - 0.5) * 10, vy: -12 - Math.random() * 18, kind: k === 'bubble' ? 'bubble' : k === 'star' ? 'star' : 'glow', color: B.ambC, size: 3 + Math.random() * 3, size1: 1, life: 3 + Math.random() * 2, a0: 0.7, a1: 0, fadeIn: 0.6 });
  }

  draw(sideFever = [false, false]) {
    const g = this.g;
    const d = this.dpr;
    let ox = 0, oy = 0;
    if (this.shakeT > 0) {
      const k = this.shakeT / (this.shakeDur || 1);
      ox = (Math.random() - 0.5) * this.shakeA * 2 * k;
      oy = (Math.random() - 0.5) * this.shakeA * 2 * k;
    }
    g.setTransform(d, 0, 0, d, 0, 0);
    g.__base = [d, 0, 0, d, ox * d, oy * d];
    if (!this.bgCanvas) this._renderBg();
    g.drawImage(this.bgCanvas, ox - 8, oy - 8, this.w + 16, this.h + 16);
    g.setTransform(d, 0, 0, d, ox * d, oy * d);
    this.ambFx.draw(g);
    // fever glow on the player's half
    for (let s = 0; s < 2; s++) {
      if (!sideFever[s]) continue;
      const x0 = s === 0 ? 0 : this.w * 0.5;
      const gr = g.createLinearGradient(s === 0 ? 0 : this.w, 0, this.w * 0.5, 0);
      const a = 0.25 + 0.1 * Math.sin(this.time * 8);
      gr.addColorStop(0, rgba('#ffb84a', a)); gr.addColorStop(1, rgba('#ffb84a', 0));
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = gr; g.fillRect(x0, 0, this.w * 0.5, this.h);
      g.globalCompositeOperation = 'source-over';
    }
    this.fx.draw(g, 'under');
    const list = [...this.units.values()].sort((a, b) => a.y - b.y);
    for (const u of list) this._drawUnit(g, u);
    this.fx.draw(g, 'top');
    if (this.dimA > 0.01) {
      g.fillStyle = `rgba(4,2,12,${this.dimA * (this.dimT > 0 ? 1 : 0.6)})`;
      g.fillRect(-20, -20, this.w + 40, this.h + 40);
      // the dim layer sits under the next effects frame; redraw particles on top
      this.fx.draw(g, 'top');
    }
    for (const f of this.floats) this._drawFloat(g, f);
    for (const f of this.flashes) {
      if (f.t < 0) continue;
      const k = f.t / f.dur;
      g.fillStyle = rgba(f.color, f.a * (1 - k));
      g.fillRect(-20, -20, this.w + 40, this.h + 40);
    }
  }

  _unitPos(u) {
    let x = u.x, y = u.y;
    if (u.lunge) {
      const L = u.lunge;
      const t = L.t;
      let k;
      if (t < L.hit - 0.05) k = ease.out(Math.min(1, t / Math.max(0.05, L.hit - 0.05)));
      else if (t < L.back) k = 1;
      else k = 1 - ease.inOut(Math.min(1, (t - L.back) / 0.25));
      x = u.x + (L.tx - u.x) * k;
      y = u.y + (L.ty - u.y) * k - Math.sin(Math.PI * Math.min(1, k)) * 10;
    }
    if (u.hitT > 0) x += u.hitDir * 7 * (u.hitT / 0.18);
    if (u.castT > 0 && !u.lunge) y -= Math.sin((u.castT / 0.6) * Math.PI) * 6;
    return [x, y];
  }

  _sprite(u, which) {
    const img = u.imgs[which] || u.imgs.normal;
    if (!img) return null;
    const key = which + Math.round(u.h);
    if (u.cache[key]) return u.cache[key];
    const d = this.dpr;
    const w = Math.ceil(u.w * d), h = Math.ceil(u.h * d);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    if (u.flip) { g.translate(w, 0); g.scale(-1, 1); }
    g.drawImage(img, 0, 0, w, h);
    const white = document.createElement('canvas');
    white.width = w; white.height = h;
    const wg = white.getContext('2d');
    wg.drawImage(c, 0, 0);
    wg.globalCompositeOperation = 'source-in';
    wg.fillStyle = '#ffffff';
    wg.fillRect(0, 0, w, h);
    u.cache[key] = { c, white };
    return u.cache[key];
  }

  _drawUnit(g, u) {
    const [x, y] = this._unitPos(u);
    let alpha = 1;
    let sink = 0;
    if (!u.alive) {
      if (u.deathT <= 0) return;
      alpha = Math.max(0, 1 - u.deathT / 0.9);
      sink = u.deathT * 20;
      if (alpha <= 0) return;
    }
    const t = this.time + u.phase;
    const bob = this.frozen ? 0 : Math.sin(t * 2.2) * 1.6;
    const breathe = 1 + Math.sin(t * 2.2) * 0.012;
    // shadow
    g.fillStyle = `rgba(0,0,0,${0.3 * alpha})`;
    g.beginPath(); g.ellipse(x, y + 2, u.w * 0.32, u.w * 0.08, 0, 0, Math.PI * 2); g.fill();
    // boss charge aura
    if (u.charge > 0 && u.alive) {
      const p = 0.5 + 0.5 * Math.sin(this.time * 12);
      const gr = g.createRadialGradient(x, u.cy, 0, x, u.cy, u.w * 0.8);
      gr.addColorStop(0, `rgba(255,40,40,${0.35 + p * 0.2})`); gr.addColorStop(1, 'rgba(255,40,40,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - u.w, u.cy - u.w, u.w * 2, u.w * 2); g.globalCompositeOperation = 'source-over';
    }
    const st = u.statuses || [];
    const frozen = st.includes('freeze');
    const which = !u.alive || u.hurtT > 0 ? 'hurt' : u.castT > 0 || u.lunge || u.charge > 0 ? 'attack' : 'normal';
    const sp = this._sprite(u, which) || this._sprite(u, 'normal');
    if (sp) {
      g.save();
      g.globalAlpha = alpha;
      const hh = u.h * breathe;
      const ww = u.w * (2 - breathe);
      g.drawImage(sp.c, x - ww / 2, y - hh + bob + sink, ww, hh);
      if (u.flashT > 0) { g.globalAlpha = alpha * (u.flashT / 0.1) * 0.85; g.drawImage(sp.white, x - ww / 2, y - hh + bob + sink, ww, hh); }
      if (frozen) { g.globalAlpha = alpha * 0.45; g.globalCompositeOperation = 'source-atop'; }
      g.restore();
      if (frozen) {
        g.save(); g.globalAlpha = 0.4; g.globalCompositeOperation = 'lighter';
        g.drawImage(sprite('glow', '#7fd4ff'), x - u.w * 0.6, u.cy - u.h * 0.55, u.w * 1.2, u.h * 1.1);
        g.restore();
      }
    }
    if (!u.alive) return;
    // shield bubble
    if (u.shield > 1) {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.strokeStyle = `rgba(122,224,255,${0.45 + 0.15 * Math.sin(t * 4)})`; g.lineWidth = 2;
      g.beginPath(); g.ellipse(x, u.cy, u.w * 0.5, u.h * 0.55, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    // status particles
    if (st.includes('burn') && Math.random() < 0.25) this.fx.emit({ x: x + (Math.random() - 0.5) * u.w * 0.5, y: u.cy + u.h * 0.2, vy: -60, kind: 'flame', color: '#ff7a2a', size: 6, life: 0.5 });
    if (st.includes('poison') && Math.random() < 0.15) this.fx.emit({ x: x + (Math.random() - 0.5) * u.w * 0.5, y: u.cy, vy: -40, kind: 'bubble', color: '#9ad83a', size: 4, life: 0.7 });
    if (st.includes('regen') && Math.random() < 0.1) this.fx.emit({ x: x + (Math.random() - 0.5) * u.w * 0.5, y: u.y - 10, vy: -50, kind: 'glow', color: '#5aff9a', size: 4, life: 0.8 });
    if (st.includes('stun')) {
      for (let i = 0; i < 3; i++) {
        const a = this.time * 5 + (i * Math.PI * 2) / 3;
        g.drawImage(sprite('star', '#ffd84a'), x + Math.cos(a) * u.w * 0.25 - 6, y - u.h - 2 + Math.sin(a) * 4 - 6, 12, 12);
      }
    }
    // no HP bar over the character (hero cards + the enemy gauge show HP); status icons only
    const by = y - u.h - (u.boss ? 4 : 8) + bob;
    const icons = st.filter((s) => s !== 'regen').slice(0, 4);
    icons.forEach((s, i) => this._statusIcon(g, s, x - (icons.length * 13) / 2 + i * 13, by - 6));
    // boss break pips
    if (u.charge > 0 && u.chargeNeed) {
      const n = u.chargeNeed;
      for (let i = 0; i < n; i++) {
        const px = x - (n - 1) * 11 + i * 22, py = by - 22;
        g.fillStyle = i < u.chargeProg ? '#ffd84a' : 'rgba(0,0,0,.6)';
        g.strokeStyle = '#ffd84a'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(px, py - 8); g.lineTo(px + 7, py); g.lineTo(px, py + 8); g.lineTo(px - 7, py); g.closePath(); g.fill(); g.stroke();
      }
    }
  }

  _statusIcon(g, s, x, y) {
    const C = { burn: '#ff7a2a', poison: '#9ad83a', stun: '#ffd84a', freeze: '#7fd4ff', atkUp: '#ff5a5a', atkDown: '#7a7aff', defUp: '#4aa8ff', defDown: '#ff8a4a', spdUp: '#4ade80', spdDown: '#a8a8a8', taunt: '#ff3a3a', silence: '#b05cff', broken: '#ffd84a', critUp: '#ff7ad9' };
    const T = { burn: '火', poison: '毒', stun: '暈', freeze: '冰', atkUp: '攻', atkDown: '攻', defUp: '防', defDown: '防', spdUp: '速', spdDown: '速', taunt: '!', silence: '默', broken: '破', critUp: '爆' };
    g.fillStyle = C[s] || '#fff';
    g.beginPath(); g.arc(x + 6, y + 6, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#10081c';
    g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(T[s] || '?', x + 6, y + 6.5);
    if (/Down$/.test(s)) { g.fillStyle = '#fff'; g.fillText('↓', x + 12, y + 2); }
    else if (/Up$/.test(s)) { g.fillStyle = '#fff'; g.fillText('↑', x + 12, y + 2); }
  }

  _drawFloat(g, f) {
    const k = f.t / f.life;
    const pop = f.t < 0.12 ? ease.backOut(f.t / 0.12) : 1;
    const y = f.y - ease.out(k) * 34;
    const a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    g.save();
    g.globalAlpha = a;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (f.banner) {
      g.font = `900 ${f.size}px "Noto Sans TC", sans-serif`;
      const w = g.measureText(f.text).width + 16;
      g.fillStyle = 'rgba(10,6,28,.8)';
      g.fillRect(f.x - w / 2, f.y - 11, w, 22);
      g.strokeStyle = 'rgba(246,210,122,.8)'; g.lineWidth = 1;
      g.strokeRect(f.x - w / 2, f.y - 11, w, 22);
      g.fillStyle = f.color;
      g.fillText(f.text, f.x, f.y);
      g.restore();
      return;
    }
    const size = 17 * f.size * pop;
    g.font = `900 ${size}px "Cinzel", "Noto Sans TC", sans-serif`;
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(20,6,20,.9)';
    g.strokeText(f.text, f.x, y);
    g.fillStyle = f.color;
    g.fillText(f.text, f.x, y);
    if (f.label) {
      g.font = `900 ${10 + f.size * 2}px "Noto Sans TC", sans-serif`;
      g.lineWidth = 3;
      g.strokeText(f.label, f.x, y - size * 0.8);
      g.fillStyle = f.label === '暴擊' ? '#ffb84a' : f.label === '弱點' ? '#ff6a4a' : '#9ad8ff';
      g.fillText(f.label, f.x, y - size * 0.8);
    }
    g.restore();
  }

  // ---------------------------------------------------------------- background

  _renderBg() {
    this.bgCanvas = paintBattleBg(this.bgKey, this.w + 16, this.h + 16, this.dpr);
  }
}

/** Procedural battlefield painting (fallback when the region's painted background is missing). */
export function paintBattleBg(bgKey, W, H, d) {
  return new BgPainter(bgKey).paint(W, H, d);
}

class BgPainter {
  constructor(bgKey) { this.bgKey = BG[bgKey] ? bgKey : 'plains'; }

  paint(W, H, d) {
    const B = BG[this.bgKey];
    const c = document.createElement('canvas');
    c.width = Math.round(W * d);
    c.height = Math.round(H * d);
    const g = c.getContext('2d');
    g.scale(d, d);
    const rng = makeRng(this.bgKey.length * 97 + 13);
    const horizon = H * 0.42;
    const sky = g.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, B.sky[0]); sky.addColorStop(1, B.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, W, horizon + 2);
    // sun / moon glow
    const sg = g.createRadialGradient(W * 0.7, horizon * 0.45, 0, W * 0.7, horizon * 0.45, W * 0.5);
    sg.addColorStop(0, 'rgba(255,255,255,.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, horizon);
    // far mountains
    const ridge = (base, amp, color, n) => {
      g.fillStyle = color;
      g.beginPath(); g.moveTo(0, horizon + 4);
      for (let i = 0; i <= n; i++) g.lineTo((W * i) / n, base - rng() * amp);
      g.lineTo(W, horizon + 4); g.closePath(); g.fill();
    };
    ridge(horizon, H * 0.16, B.far, 10);
    ridge(horizon + 2, H * 0.09, B.mid, 16);
    // ground
    const gr = g.createLinearGradient(0, horizon, 0, H);
    gr.addColorStop(0, B.ground[0]); gr.addColorStop(1, B.ground[1]);
    g.fillStyle = gr; g.fillRect(0, horizon, W, H - horizon);
    // perspective lines
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
    for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(W / 2 + i * 12, horizon); g.lineTo(W / 2 + i * 90, H); g.stroke(); }
    for (let i = 1; i < 6; i++) { const y = horizon + (H - horizon) * Math.pow(i / 6, 1.6); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    this._deco(g, B, W, H, horizon, rng);
    // vignette
    const v = g.createRadialGradient(W / 2, H * 0.6, H * 0.3, W / 2, H * 0.6, H);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    return c;
  }

  _deco(g, B, W, H, hz, rng) {
    const kind = B.deco;
    const at = (n, f) => { for (let i = 0; i < n; i++) f(rng() * W, hz + rng() * (H - hz) * 0.25, 0.5 + rng() * 0.6); };
    g.save();
    if (kind === 'trees' || kind === 'pines') {
      at(9, (x, y, s) => {
        g.fillStyle = kind === 'pines' ? '#123a1e' : '#2a7a3a';
        if (kind === 'pines') { g.beginPath(); g.moveTo(x, y - 46 * s); g.lineTo(x + 16 * s, y); g.lineTo(x - 16 * s, y); g.closePath(); g.fill(); }
        else { g.beginPath(); g.arc(x, y - 22 * s, 16 * s, 0, Math.PI * 2); g.fill(); g.fillStyle = '#5a3a1a'; g.fillRect(x - 2 * s, y - 8 * s, 4 * s, 10 * s); }
      });
    } else if (kind === 'lava') {
      g.strokeStyle = 'rgba(255,140,40,.7)'; g.lineWidth = 2;
      for (let i = 0; i < 8; i++) { let x = rng() * W, y = hz + rng() * (H - hz); g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rng() - 0.5) * 40; y += rng() * 16; g.lineTo(x, y); } g.stroke(); }
    } else if (kind === 'crystals') {
      at(8, (x, y, s) => { g.fillStyle = 'rgba(180,230,255,.75)'; g.beginPath(); g.moveTo(x, y - 34 * s); g.lineTo(x + 8 * s, y); g.lineTo(x - 8 * s, y); g.closePath(); g.fill(); });
    } else if (kind === 'pillars') {
      for (let i = 0; i < 5; i++) { const x = (W * (i + 0.5)) / 5, s = 0.8; g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 8 * s, hz - 70, 16 * s, 74); g.fillRect(x - 12, hz - 74, 24, 6); }
    } else if (kind === 'graves') {
      at(9, (x, y, s) => { g.fillStyle = '#4a4058'; g.beginPath(); g.moveTo(x - 9 * s, y); g.lineTo(x - 9 * s, y - 16 * s); g.arc(x, y - 16 * s, 9 * s, Math.PI, 0); g.lineTo(x + 9 * s, y); g.closePath(); g.fill(); });
    } else if (kind === 'masts') {
      at(4, (x, y, s) => { g.strokeStyle = '#2a3a4a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 70 * s); g.stroke(); g.fillStyle = 'rgba(220,230,240,.5)'; g.beginPath(); g.moveTo(x + 2, y - 66 * s); g.lineTo(x + 30 * s, y - 30 * s); g.lineTo(x + 2, y - 26 * s); g.closePath(); g.fill(); });
    } else if (kind === 'gears') {
      at(5, (x, y, s) => { g.strokeStyle = 'rgba(80,60,30,.6)'; g.lineWidth = 5 * s; g.beginPath(); g.arc(x, y - 20 * s, 16 * s, 0, Math.PI * 2); g.stroke(); });
    } else if (kind === 'walls') {
      at(6, (x, y, s) => { g.fillStyle = 'rgba(40,20,70,.7)'; g.fillRect(x - 20 * s, y - 40 * s, 40 * s, 40 * s); });
    } else if (kind === 'banners') {
      at(5, (x, y, s) => { g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 60 * s); g.stroke(); g.fillStyle = '#a82a2a'; g.fillRect(x, y - 60 * s, 18 * s, 26 * s); });
    } else if (kind === 'runes') {
      g.strokeStyle = 'rgba(255,140,220,.25)'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(W / 2, H * 0.78, W * 0.45, H * 0.12, 0, 0, Math.PI * 2); g.stroke();
    }
    g.restore();
  }
}
