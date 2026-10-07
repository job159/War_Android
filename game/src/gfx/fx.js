// WebGL particle + animated-effect system. Same particle API as fx/particles.js (emit / burst / update),
// so every recipe written for the Canvas2D engine runs unchanged; `add()` replaces Canvas2D shape callbacks
// with real display objects (sprites, graphics) that are animated per frame.
import { Container, Sprite } from 'pixi.js';
import { ptex } from './tex.js';

export class GFX {
  /** layers: { under, add, normal } containers (under = ground level, add = additive above units) */
  constructor(layers) {
    this.L = layers;
    this.parts = [];
    this.effects = [];
    this.pool = [];
    this.max = 1600;
    this.high = true;
    this.time = 0;
  }

  setQuality(high) {
    this.high = high;
    this.max = high ? 1600 : 500;
  }

  /** p: { x, y, vx, vy, ax, ay, drag, life, size, size1, rot, vr, a0, a1, kind, color, blend, stretch, delay, fadeIn, layer } */
  emit(o) {
    if (this.parts.length >= this.max) return null;
    let p = this.pool.pop();
    if (!p) {
      p = { sp: new Sprite() };
      p.sp.anchor.set(0.5);
    }
    p.x = o.x; p.y = o.y; p.vx = o.vx || 0; p.vy = o.vy || 0; p.ax = o.ax || 0; p.ay = o.ay || 0;
    p.drag = o.drag ?? 0; p.life = 0; p.max = o.life || 0.6; p.size = o.size || 10; p.size1 = o.size1 ?? p.size * 0.3;
    p.rot = o.rot || 0; p.vr = o.vr || 0; p.a0 = o.a0 ?? 1; p.a1 = o.a1 ?? 0;
    p.stretch = o.stretch || 0; p.delay = o.delay || 0; p.fadeIn = o.fadeIn || 0;
    const normal = o.blend === 'source-over' || o.blend === 'normal';
    const sp = p.sp;
    sp.texture = o.tex || ptex(o.kind || 'glow', o.color || '#ffffff');
    sp.blendMode = normal ? 'normal' : 'add';
    sp.visible = false;
    sp.tint = 0xffffff;
    sp.rotation = 0;
    const layer = o.layer === 'under' ? this.L.under : normal ? this.L.normal : this.L.add;
    layer.addChild(sp);
    this.parts.push(p);
    return p;
  }

  burst(x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = (o.angle ?? 0) + (o.spread ?? Math.PI * 2) * (Math.random() - (o.spread != null ? 0.5 : 0));
      const sp = (o.speed || 200) * (0.35 + Math.random() * 0.65);
      this.emit({ ...o, x: x + (Math.random() - 0.5) * (o.jitter || 0), y: y + (Math.random() - 0.5) * (o.jitter || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        size: (o.size || 10) * (0.6 + Math.random() * 0.8), life: (o.life || 0.5) * (0.7 + Math.random() * 0.6), rot: Math.random() * 6.28, vr: (o.vr ?? 0) * (Math.random() - 0.5) });
    }
  }

  /**
   * Animated effect: { dur, delay, layer: 'top'|'under'|'normal', make(container, fx) -> state, update(k, state, dt), done(state) }
   * k runs 0..1 over `dur`; the container (and everything in it) is destroyed afterwards.
   */
  add(e) {
    this.effects.push({ t: 0, delay: e.delay || 0, started: false, ...e });
  }

  update(dt) {
    this.time += dt;
    const P = this.parts;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.life += dt;
      if (p.life >= p.max) {
        p.sp.removeFromParent();
        P[i] = P[P.length - 1];
        P.pop();
        this.pool.push(p);
        continue;
      }
      p.vx += p.ax * dt; p.vy += p.ay * dt;
      if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const k = p.life / p.max;
      let a = p.a0 + (p.a1 - p.a0) * k;
      if (p.fadeIn && p.life < p.fadeIn) a *= p.life / p.fadeIn;
      const sp = p.sp;
      if (a <= 0.01) { sp.visible = false; continue; }
      sp.visible = true;
      sp.alpha = Math.min(1, a);
      const s = p.size + (p.size1 - p.size) * k;
      sp.position.set(p.x, p.y);
      if (p.stretch) {
        const v = Math.hypot(p.vx, p.vy);
        const len = s + v * p.stretch;
        sp.rotation = Math.atan2(p.vy, p.vx);
        sp.scale.set((len * 2) / 64, s / 64);
      } else {
        sp.rotation = p.rot;
        sp.scale.set((s * 2) / 64);
      }
    }
    const E = this.effects;
    for (let i = E.length - 1; i >= 0; i--) {
      const e = E[i];
      if (e.delay > 0) { e.delay -= dt; continue; }
      if (!e.started) {
        e.started = true;
        e.node = new Container();
        (e.layer === 'under' ? this.L.under : e.layer === 'normal' ? this.L.normal : this.L.add).addChild(e.node);
        try { e.state = e.make ? e.make(e.node, this) : {}; } catch (err) { console.error(err); e.t = e.dur; }
      }
      e.t += dt;
      const k = Math.min(1, e.t / e.dur);
      try { if (e.update) e.update(k, e.state, dt); } catch (err) { console.error(err); e.t = e.dur; }
      if (e.t >= e.dur) {
        if (e.done) e.done(e.state);
        e.node.destroy({ children: true });
        E.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.parts) { p.sp.removeFromParent(); this.pool.push(p); }
    this.parts.length = 0;
    for (const e of this.effects) if (e.node) e.node.destroy({ children: true });
    this.effects.length = 0;
  }

  destroy() {
    this.clear();
    for (const p of this.pool) p.sp.destroy();
    this.pool.length = 0;
  }
}
