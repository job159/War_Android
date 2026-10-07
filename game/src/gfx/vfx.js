// Skill visual effects for the WebGL renderer. playVfx(name, c) where c = {
//   fx (GFX), view (BattleStage: shake / flash / dim / punch / hitStop / shockwave / aberrate / radialBlur),
//   src (unit), tg (target units), el (attacker element), kind ('normal'|'skill'|'ult'|'charge'), impact, hits }
// Unit geometry: x (center), y (feet), h (height), w, cy (body center), side (0 left / 1 right).
//
// Layers of a big effect, back to front: ground (magic circles, cracks) -> body (beams, crystals, waves)
// -> particles (sparks, embers, shards) -> painted bursts / flares (additive, bloomed) -> camera & post.
import { Container, Sprite, Graphics, Mesh, MeshGeometry } from 'pixi.js';
import * as T from './tex.js';
import { ease, lightningPath } from '../fx/particles.js';
import { fxAssets } from '../art/assets.js';

export const PAL = {
  fire: ['#ff5a3c', '#ffb35c', '#fff2c0'], water: ['#3ca8ff', '#9ee0ff', '#e8fbff'], wind: ['#36d68a', '#b6ffd8', '#f0fff8'],
  earth: ['#d39a45', '#ffd99a', '#fff0d0'], light: ['#ffd84a', '#fff6c4', '#ffffff'], dark: ['#a45cff', '#dcb8ff', '#ffffff'],
  heal: ['#4ade80', '#bbf7d0', '#ffffff'], poison: ['#9ad83a', '#d8ff9a', '#ffffff'], blood: ['#ff3a5a', '#ff9aaa', '#ffffff'],
};
const R = Math.random;
const hx = T.hexNum;
const dirOf = (c) => (c.src && c.src.side === 1 ? -1 : 1);
const P = (el) => PAL[el] || PAL.light;

// ------------------------------------------------------------------ painted effect art (SDXL, black bg)
const ART = {};
const ART_KEYS = ['circle_holy', 'circle_fire', 'circle_water', 'circle_wind', 'circle_earth', 'circle_dark', 'sigil_star',
  'burst_fire', 'burst_ice', 'burst_light', 'burst_dark', 'burst_water', 'burst_wind', 'burst_earth', 'slash_arc', 'lightning', 'beam', 'meteor', 'feather_burst', 'petals'];
let artLoading = null;
export function preloadFxArt() {
  const have = new Set(fxAssets());
  if (!artLoading) artLoading = Promise.all(ART_KEYS.filter((k) => have.has(k)).map((k) => T.loadTex(`assets/fx/${k}.webp`).then((t) => { if (t) ART[k] = t; })));
  return artLoading;
}
const CIRCLE = { fire: 'circle_fire', water: 'circle_water', wind: 'circle_wind', earth: 'circle_earth', light: 'circle_holy', dark: 'circle_dark' };
const BURST = { fire: 'burst_fire', water: 'burst_water', wind: 'burst_wind', earth: 'burst_earth', light: 'burst_light', dark: 'burst_dark', ice: 'burst_ice' };
function elOfColor(color) {
  for (const k of ['fire', 'water', 'wind', 'earth', 'light', 'dark']) if (PAL[k].includes(color)) return k;
  return null;
}

// ------------------------------------------------------------------ primitives

const sprite = (tex, x, y, ax = 0.5, ay = 0.5, add = true) => {
  const s = new Sprite(tex);
  s.anchor.set(ax, ay);
  s.position.set(x, y);
  if (add) s.blendMode = 'add';
  return s;
};

export function glowBurst(c, x, y, color, n = 14, speed = 220, size = 9, delay = 0, life = 0.45, kind = 'glow') {
  c.fx.burst(x, y, n, { color, speed, size, size1: 1, life, drag: 3, delay, kind });
  c.fx.emit({ x, y, tex: T.glowTex(color), size: size * 3.4, size1: size * 5.2, life: 0.3, delay, a0: 1, a1: 0 });
}

export function sparks(c, x, y, color, n = 10, speed = 420, delay = 0) {
  c.fx.burst(x, y, n, { kind: 'spark', color, speed, size: 6, size1: 2, life: 0.34, drag: 4, stretch: 0.05, delay });
}

export function ring(c, x, y, color, r0 = 6, r1 = 60, dur = 0.4, delay = 0, width = 5, flat = 0.45) {
  const col = hx(color);
  c.fx.add({ dur, delay, make(node) { const g = new Graphics(); node.addChild(g); return { g }; },
    update(k, s) {
      const r = r0 + (r1 - r0) * ease.outCubic(k);
      const a = 1 - k;
      const w = width * (1 - k * 0.6);
      s.g.clear()
        .ellipse(x, y, r, r * flat).stroke({ width: w * 2.6, color: col, alpha: 0.3 * a })
        .ellipse(x, y, r, r * flat).stroke({ width: w, color: col, alpha: 0.95 * a })
        .ellipse(x, y, r, r * flat).stroke({ width: w * 0.35, color: 0xffffff, alpha: 0.75 * a });
    } });
}

export function slashArc(c, x, y, color, { angle = -0.6, r = 46, delay = 0, width = 14, dur = 0.26, flip = false, sweep = 2.4 } = {}) {
  const col = hx(color);
  c.fx.add({ dur, delay, make(node) {
    node.position.set(x, y);
    if (flip) node.scale.x = -1;
    const g = new Graphics();
    const tr = sprite(ART.slash_arc || T.slashTex(color), 0, 0, 0.5, 0.98);
    tr.rotation = angle + Math.PI / 2;
    tr.tint = ART.slash_arc ? col : 0xffffff;
    node.addChild(tr, g);
    return { g, tr };
  }, update(k, s) {
    const a0 = angle - sweep / 2;
    const prog = ease.out(Math.min(1, k * 1.6));
    const fade = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
    const a1 = a0 + sweep * prog;
    const from = Math.max(a0, a1 - 1.6);
    const arc = (w, color, alpha) => s.g.moveTo(Math.cos(from) * r, Math.sin(from) * r).arc(0, 0, r, from, a1).stroke({ width: w, color, alpha, cap: 'round' });
    s.g.clear();
    arc(width * 2.4, col, 0.3 * fade);
    arc(width, col, 0.9 * fade);
    arc(width * 0.35, 0xffffff, fade);
    s.tr.alpha = 0.85 * fade * Math.min(1, k * 4);
    const sc = (r * (0.9 + 0.25 * prog)) / 236;
    s.tr.scale.set(sc, sc * 0.9);
  } });
  sparks(c, x, y, color, 7, 340, delay + 0.08);
}

/**
 * Weapon trail: a tapered ribbon mesh swept along `path(u) -> [x, y]` (u 0..1 = start..end of the swing). The
 * head races ahead (eased), the tail chases it, so the crescent grows, then thins away; sparks peel off the head.
 * Two passes: a wide body in the element colour (normal blend, so it reads on bright scenes too) and a
 * white-hot additive cutting edge on top (bloomed).
 * o: { width, dur, delay, lead (fraction of dur the head needs), lag (max tail distance in u; 1 = whole path),
 *      center ([x, y] the bright edge faces away from), segs, sparkle, glow, color2 (body colour) }
 */
export function swoosh(c, color, path, o = {}) {
  const { width = 22, dur = 0.2, delay = 0, lead = 0.42, lag = 1, center = null, segs = 30, sparkle = true, glow = true, color2 = null } = o;
  const N = segs + 1;
  const mk = () => {
    const positions = new Float32Array(N * 4), uvs = new Float32Array(N * 4), indices = new Uint32Array(segs * 6);
    for (let i = 0; i < N; i++) { const u = i / segs; uvs[i * 4] = u; uvs[i * 4 + 1] = 0; uvs[i * 4 + 2] = u; uvs[i * 4 + 3] = 1; }
    for (let i = 0; i < segs; i++) { const a = i * 2; indices.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6); }
    return new MeshGeometry({ positions, uvs, indices });
  };
  // shared sampling of the ribbon at progress k: fills P with (outer, inner) pairs; w = width multiplier
  const shape = (k, P, wMul, outer) => {
    const head = ease.outCubic(Math.min(1, k / lead));
    const tailK = Math.max(0, (k - 0.1) / 0.9);
    const tail = Math.max(0, head - lag, head * ease.inOut(tailK));
    let hx0 = 0, hy0 = 0;
    for (let i = 0; i < N; i++) {
      const q = i / segs;
      const u = tail + (head - tail) * q;
      const [x, y] = path(u);
      const [xa, ya] = path(Math.max(0, u - 0.01)), [xb, yb] = path(Math.min(1, u + 0.01));
      let nx = -(yb - ya), ny = xb - xa;
      const L = Math.hypot(nx, ny) || 1;
      nx /= L; ny /= L;
      if (center && (x - center[0]) * nx + (y - center[1]) * ny < 0) { nx = -nx; ny = -ny; }
      const w = width * wMul * Math.pow(q, 0.7) * (1 - 0.55 * Math.pow(q, 7));
      P[i * 4] = x + nx * w * outer; P[i * 4 + 1] = y + ny * w * outer;
      P[i * 4 + 2] = x - nx * w * (1 - outer); P[i * 4 + 3] = y - ny * w * (1 - outer);
      if (i === N - 1) { hx0 = x; hy0 = y; }
    }
    return [hx0, hy0];
  };
  const fade = (k) => (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3);
  if (glow) {
    c.fx.add({ dur, delay, layer: 'normal', make(node) {
      const geom = mk();
      const m = new Mesh({ geometry: geom, texture: T.trailTex('#ffffff') });
      m.tint = hx(color2 || color);
      node.addChild(m);
      return { geom, m };
    }, update(k, s) {
      shape(k, s.geom.positions, 1.9, 0.55);
      s.geom.getBuffer('aPosition').update();
      s.m.alpha = 0.62 * fade(k);
    }, done(s) { s.geom.destroy(); } });
  }
  c.fx.add({ dur, delay, make(node) {
    const geom = mk();
    const m = new Mesh({ geometry: geom, texture: T.trailTex(color) });
    m.blendMode = 'add';
    node.addChild(m);
    return { geom, m, last: null };
  }, update(k, s) {
    const [hx0, hy0] = shape(k, s.geom.positions, 1, 0.62);
    s.geom.getBuffer('aPosition').update();
    s.m.alpha = fade(k);
    if (sparkle && k < lead * 1.1 && s.last) {
      const vx = (hx0 - s.last[0]) * 30, vy = (hy0 - s.last[1]) * 30;
      for (let j = 0; j < 3; j++) c.fx.emit({ x: hx0, y: hy0, vx: vx * (0.2 + R() * 0.5) + (R() - 0.5) * 140, vy: vy * (0.2 + R() * 0.5) + (R() - 0.5) * 140, kind: j ? 'spark' : 'star', color: j ? color : '#ffffff', size: j ? 5 : 6, size1: 1, life: 0.3, drag: 3, stretch: j ? 0.04 : 0 });
    }
    s.last = [hx0, hy0];
  }, done(s) { s.geom.destroy(); } });
}

/** Path helpers for swoosh(): elliptical arc and quadratic bezier. */
export const arcPath = (cx, cy, rx, ry, a0, a1) => (u) => { const a = a0 + (a1 - a0) * u; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; };
export const bezPath = (x0, y0, x1, y1, x2, y2) => (u) => { const v = 1 - u; return [v * v * x0 + 2 * v * u * x1 + u * u * x2, v * v * y0 + 2 * v * u * y1 + u * u * y2]; };

/** The flash of a blade connecting: a thin streak along the cut, a compact cross-star, small white pop, sparks. */
export function hitSpark(c, x, y, color, { size = 60, angle = 0, delay = 0, power = 1 } = {}) {
  c.fx.add({ dur: 0.18, delay, make(node) {
    const streak = sprite(T.beamTex(color), x, y);
    const f = sprite(T.flareTex(color), x, y);
    const pop = sprite(T.glowTex('#ffffff', 0.3), x, y);
    node.addChild(pop, streak, f);
    return { f, pop, streak };
  }, update(k, s) {
    const g = k < 0.3 ? ease.outCubic(k / 0.3) : 1;
    const a = k < 0.3 ? 1 : 1 - (k - 0.3) / 0.7;
    s.streak.rotation = angle;
    s.streak.scale.set(((size * 2.6) / 256) * (0.3 + 0.9 * g) * power, ((size * 0.22) / 64) * (1 - k * 0.6) * power);
    s.streak.alpha = a;
    s.f.scale.set(((size * 0.95) / 256) * (0.5 + 0.7 * g) * power);
    s.f.rotation = angle + 0.4;
    s.f.alpha = a;
    s.pop.scale.set((size * 0.42 * power * (0.6 + 0.6 * g)) / 128);
    s.pop.alpha = 0.55 * Math.max(0, 1 - k * 3);
  } });
  c.fx.burst(x, y, Math.round(9 * power), { kind: 'spark', color: '#ffffff', speed: 560 * power, size: 6, size1: 1, life: 0.26, drag: 4, stretch: 0.05, delay, angle, spread: 1.4 });
  c.fx.burst(x, y, Math.round(6 * power), { kind: 'spark', color, speed: 380 * power, size: 7, size1: 2, life: 0.32, drag: 3, stretch: 0.04, delay, angle: angle + Math.PI, spread: 1.2 });
  ring(c, x, y, color, 4, size * 0.75 * power, 0.18, delay, 2.5, 0.8);
}

/** Ground dust kicked up by a step / dash / landing. dir: 0 = both ways, +-1 = thrown that way. */
export function dust(c, x, y, color = '#d8ccb0', { n = 8, power = 1, dir = 0, delay = 0 } = {}) {
  for (let i = 0; i < n; i++) {
    const side = dir || (i % 2 ? 1 : -1);
    const sp = (50 + R() * 130) * power;
    c.fx.emit({ x: x + (R() - 0.5) * 16, y: y - R() * 6, vx: side * sp, vy: -(15 + R() * 45) * power, drag: 3.2, kind: 'smoke', color,
      size: (9 + R() * 7) * Math.sqrt(power), size1: (24 + R() * 14) * Math.sqrt(power), life: 0.45 + R() * 0.35, a0: 0.55, a1: 0, blend: 'normal', delay, layer: 'under' });
  }
}

/** Glowing cracks spidering out on the ground (smashes, slams). */
export function groundCrack(c, x, y, color, { size = 80, delay = 0, dur = 0.8, n = 6 } = {}) {
  const col = hx(color);
  c.fx.add({ dur, delay, layer: 'under', make(node) {
    const g = new Graphics(); node.addChild(g);
    const paths = [];
    for (let i = 0; i < n; i++) {
      let px = x, py = y;
      const a = (i / n) * 6.28 + R() * 0.6;
      const p = [px, py];
      for (let j = 0; j < 5; j++) { px += Math.cos(a + (R() - 0.5) * 0.9) * size * 0.2; py += Math.sin(a + (R() - 0.5) * 0.9) * size * 0.07; p.push(px, py); }
      paths.push(p);
    }
    return { g, paths };
  }, update(k, s) {
    const a = 1 - Math.max(0, k - 0.5) / 0.5;
    const m = Math.ceil(ease.out(Math.min(1, k * 4)) * 6);
    s.g.clear();
    for (const p of s.paths) {
      const q = p.slice(0, m * 2);
      if (q.length < 4) continue;
      s.g.poly(q, false).stroke({ width: 6, color: col, alpha: 0.3 * a }).poly(q, false).stroke({ width: 2, color: 0xfff0d0, alpha: a });
    }
  } });
}

/** Projectile flying src -> dst with a trail. o: { kind, color, size, dur, arc, spin, trail, delay, tex } */
export function projectile(c, x1, y1, x2, y2, o = {}) {
  const dur = o.dur ?? 0.3;
  const color = o.color || '#ffffff';
  const kind = o.kind || 'core';
  const size = o.size || 12;
  const arc = o.arc || 0;
  const pos = (k) => { const e = ease.in(k) * 0.4 + k * 0.6; return [x1 + (x2 - x1) * e, y1 + (y2 - y1) * e - arc * Math.sin(Math.PI * e)]; };
  const fiery = kind === 'flame' || o.trailKind === 'flame';
  let last = 0;
  c.fx.add({ dur, delay: o.delay || 0, make(node) {
    // comet tail (along the flight direction), glow, the projectile itself, a white-hot core
    const tail = sprite(T.beamTex(color), 0, 0, 0.92, 0.5);
    const glow = sprite(T.glowTex(color), 0, 0);
    glow.scale.set((size * 4.2) / 128);
    const body = sprite(o.tex || T.ptex(kind, color), 0, 0);
    body.scale.set((size * (o.tex ? 4.4 : 2.5)) / (o.tex ? o.tex.width : 64));
    const core = sprite(T.glowTex('#ffffff', 0.4), 0, 0);
    core.scale.set((size * 1.4) / 128);
    node.addChild(tail, glow, body, core);
    return { tail, glow, body, core };
  }, update(k, s) {
    const [x, y] = pos(k);
    const [xp, yp] = pos(Math.max(0, k - 0.04));
    const dirA = k > 0.001 ? Math.atan2(y - yp, x - xp) : Math.atan2(y2 - y1, x2 - x1);
    s.glow.position.set(x, y); s.body.position.set(x, y); s.core.position.set(x, y); s.tail.position.set(x, y);
    s.tail.rotation = dirA;
    s.tail.scale.set((size * 6.5 * Math.min(1, k * 4 + 0.2)) / 256, (size * 1.15) / 64);
    s.tail.alpha = 0.85;
    s.glow.alpha = 0.85 + 0.15 * Math.sin(k * 40);
    if (o.align !== false) s.body.rotation = kind === 'arrow' || kind === 'spark' || kind === 'shard' ? dirA + (kind === 'shard' ? Math.PI / 2 : 0) : o.spin ? k * 18 : o.tex ? dirA : 0;
    if (o.trail !== false && k - last > 0.012) {
      last = k;
      c.fx.emit({ x: x + (R() - 0.5) * size * 0.4, y: y + (R() - 0.5) * size * 0.4, kind: o.trailKind || 'glow', color, size: size * 0.9, size1: 1, life: 0.32, vx: (R() - 0.5) * 40, vy: (R() - 0.5) * 40 });
      if (R() < 0.5) c.fx.emit({ x, y, kind: 'spark', color: '#ffffff', size: 4, size1: 1, life: 0.25, vx: (R() - 0.5) * 160, vy: (R() - 0.5) * 160, stretch: 0.03, drag: 3 });
      // a dark smoke ribbon behind fire keeps it readable against bright skies
      if (fiery) c.fx.emit({ x, y, kind: 'smoke', color: '#4a2416', size: size * 0.7, size1: size * 1.7, life: 0.45, a0: 0.35, a1: 0, blend: 'normal', vx: (R() - 0.5) * 20, vy: -24 });
    }
  } });
}

export function pillar(c, x, yBottom, color, { delay = 0, width = 36, dur = 0.6, top = -40 } = {}) {
  c.fx.add({ dur, delay, make(node) {
    const p = sprite(T.pillarTex(color), x, yBottom + 4, 0.5, 1);
    const core = sprite(T.pillarTex('#ffffff'), x, yBottom + 4, 0.5, 1);
    node.addChild(p, core);
    return { p, core };
  }, update(k, s) {
    const w = width * (k < 0.15 ? ease.out(k / 0.15) : 1 - ((k - 0.15) / 0.85) * 0.8);
    const a = k < 0.12 ? k / 0.12 : 1 - Math.max(0, k - 0.3) / 0.7;
    const hgt = yBottom - top + 8;
    s.p.scale.set((w * 2.2) / 64, hgt / 256);
    s.core.scale.set((w * 0.7) / 64, hgt / 256);
    s.p.alpha = a; s.core.alpha = a * 0.9;
  } });
  ring(c, x, yBottom, color, 6, width * 1.8, 0.5, delay + 0.05, 4);
}

export function beam(c, x1, y1, x2, y2, color, { delay = 0, width = 26, dur = 0.5 } = {}) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  c.fx.add({ dur, delay, make(node) {
    const b = sprite(T.beamTex(color), x1, y1, 0, 0.5);
    b.rotation = ang;
    const head = sprite(T.flareTex(color), x1, y1);
    node.addChild(b, head);
    return { b, head };
  }, update(k, s) {
    const grow = Math.min(1, k * 4);
    const a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    const w = width * (0.85 + 0.15 * Math.sin(k * 60)) * a;
    s.b.scale.set((len * grow) / 256, (w * 2.4) / 64);
    s.b.alpha = a;
    s.head.position.set(x1 + Math.cos(ang) * len * grow, y1 + Math.sin(ang) * len * grow);
    s.head.scale.set((width * 2.6) / 256);
    s.head.alpha = a * (grow < 1 ? 1 : 0.6);
  } });
}

export function magicCircle(c, x, y, r, color, { delay = 0, dur = 1.0, flat = 0.42, spin = 1.5, layer = 'under', el = null } = {}) {
  const key = CIRCLE[el || elOfColor(color)];
  const painted = key && ART[key];
  c.fx.add({ dur, delay, layer, make(node) {
    node.position.set(x, y);
    node.scale.y = flat;
    const glow = sprite(T.glowTex(color, 0.02), 0, 0);
    const circ = sprite(painted || T.circleTex(color), 0, 0);
    const inner = sprite(T.circleTex(color), 0, 0);
    node.addChild(glow, circ, inner);
    return { glow, circ, inner };
  }, update(k, s) {
    const a = k < 0.2 ? k / 0.2 : k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
    const rr = r * (0.6 + 0.4 * ease.backOut(Math.min(1, k * 2.5)));
    s.circ.rotation = k * spin * Math.PI * 2;
    s.circ.scale.set((rr * 2) / s.circ.texture.width);
    s.circ.alpha = a;
    s.inner.rotation = -k * spin * Math.PI * 3;
    s.inner.scale.set((rr * 1.05) / 512);
    s.inner.alpha = a * (painted ? 0.55 : 0.8);
    s.glow.scale.set((rr * 2.6) / 128);
    s.glow.alpha = a * 0.5;
  } });
}

export function lightning(c, x1, y1, x2, y2, color, { delay = 0, dur = 0.3, width = 4, segs = 9, amp = 22 } = {}) {
  let pts = lightningPath(x1, y1, x2, y2, segs, amp);
  let flick = 0;
  const col = hx(color);
  c.fx.add({ dur, delay, make(node) { const g = new Graphics(); node.addChild(g); return { g }; },
    update(k, s) {
      if (++flick % 3 === 0) pts = lightningPath(x1, y1, x2, y2, segs, amp);
      const a = 1 - k;
      const flat = pts.flat();
      s.g.clear()
        .poly(flat, false).stroke({ width: width * 4.5, color: col, alpha: 0.3 * a, join: 'round', cap: 'round' })
        .poly(flat, false).stroke({ width, color: col, alpha: 0.95 * a, join: 'round', cap: 'round' })
        .poly(flat, false).stroke({ width: width * 0.4, color: 0xffffff, alpha: a, join: 'round', cap: 'round' });
    } });
}

export function rising(c, x, y, kind, color, n = 12, { delay = 0, spread = 40, speed = 90, size = 7, life = 0.9 } = {}) {
  for (let i = 0; i < n; i++) {
    c.fx.emit({ x: x + (R() - 0.5) * spread, y: y - R() * 20, vx: (R() - 0.5) * 20, vy: -speed * (0.5 + R() * 0.8), kind, color, size: size * (0.6 + R() * 0.8), size1: size * 0.2, life: life * (0.6 + R() * 0.6), delay: delay + R() * 0.25, drag: 0.6 });
  }
}

/** Things falling from the sky onto points (meteors, arrows, ice...). */
export function fallOn(c, x, y, kind, color, { delay = 0, dur = 0.32, size = 16, from = 160, slant = 60, trail = true, tex = null } = {}) {
  projectile(c, x - slant, y - from, x, y, { kind, color, size, dur, delay, trail, tex, trailKind: kind === 'flame' ? 'flame' : 'glow' });
}

export function smoke(c, x, y, color, n = 8, delay = 0) {
  for (let i = 0; i < n; i++) c.fx.emit({ x: x + (R() - 0.5) * 34, y: y + (R() - 0.5) * 16, vx: (R() - 0.5) * 60, vy: -20 - R() * 40, kind: 'smoke', color, size: 16 + R() * 12, size1: 36, life: 0.8 + R() * 0.4, a0: 0.7, a1: 0, blend: 'normal', delay });
}

/** Painted burst (or procedural glow + rays) blooming out at a point. */
export function burst(c, x, y, el, { size = 160, delay = 0, dur = 0.55, rot = R() * 6.28, color = null, art: artKey = null } = {}) {
  const art = (artKey && ART[artKey]) || ART[BURST[el]];
  const col = color || P(el === 'ice' ? 'water' : el)[0];
  c.fx.add({ dur, delay, make(node) {
    node.position.set(x, y);
    const glow = sprite(T.glowTex(col, 0.08), 0, 0);
    const main = sprite(art || T.raysTex(col, 16), 0, 0);
    main.rotation = rot;
    node.addChild(glow, main);
    return { glow, main };
  }, update(k, s) {
    const g = ease.outCubic(Math.min(1, k * 1.8));
    const a = k < 0.15 ? k / 0.15 : 1 - ease.in((k - 0.15) / 0.85);
    s.main.scale.set(((0.35 + 0.75 * g) * size * 2) / s.main.texture.width);
    s.main.alpha = a;
    s.main.rotation = rot + k * 0.4;
    s.glow.scale.set((size * 2.4 * (0.5 + 0.5 * g)) / 128);
    s.glow.alpha = a * 0.8;
  } });
}

export function flare(c, x, y, color, { size = 120, delay = 0, dur = 0.4 } = {}) {
  c.fx.add({ dur, delay, make(node) { const f = sprite(T.flareTex(color), x, y); node.addChild(f); return { f }; },
    update(k, s) {
      const p = k < 0.2 ? ease.backOut(k / 0.2) : 1;
      s.f.scale.set(((size * 2) / 256) * p * (1 + k * 0.3));
      s.f.alpha = k < 0.2 ? 1 : 1 - (k - 0.2) / 0.8;
      s.f.rotation = k * 0.5;
    } });
}

export function godRays(c, x, y, color, { size = 260, delay = 0, dur = 1.0, spin = 0.25 } = {}) {
  c.fx.add({ dur, delay, make(node) { const r = sprite(T.raysTex(color, 20), x, y); node.addChild(r); return { r }; },
    update(k, s) {
      s.r.scale.set(((size * 2) / 512) * (0.6 + 0.4 * ease.outCubic(Math.min(1, k * 3))));
      s.r.alpha = (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8) * 0.8;
      s.r.rotation = k * spin * Math.PI;
    } });
}

/** The heavy-hit package: burst art + flare + ring + sparks + camera & post (shockwave, punch, hit-stop). */
export function impact(c, x, y, el, { power = 1, delay = 0, color = null } = {}) {
  const col = color || P(el === 'ice' ? 'water' : el)[1];
  burst(c, x, y, el, { size: 130 * power, delay });
  flare(c, x, y, col, { size: 90 * power, delay });
  ring(c, x, y + 10, col, 10, 120 * power, 0.5, delay, 6, 0.45);
  sparks(c, x, y, col, Math.round(14 * power), 520 * power, delay);
  glowBurst(c, x, y, col, Math.round(16 * power), 300 * power, 11, delay, 0.6);
  const v = c.view;
  if (v.shockwave) {
    v.shockwave(x, y, { amp: 18 * power, wave: 100 + 40 * power, delay });
    if (power >= 1) v.hitStop(0.05 * power, delay);
    v.aberrate(4 * power, 0.3, delay);
  }
  v.shake(5 + 5 * power, 0.25, delay);
}

/** Particles streaming into a point (charge-up). */
export function converge(c, x, y, color, { n = 40, radius = 160, dur = 0.5, delay = 0 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = R() * 6.28, d = radius * (0.6 + R() * 0.6);
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.7;
    const life = dur * (0.6 + R() * 0.4);
    c.fx.emit({ x: px, y: py, vx: (x - px) / life, vy: (y - py) / life, kind: 'spark', color, size: 7, life, stretch: 0.03, delay: delay + R() * dur * 0.5 });
  }
}

function tornado(c, x, y, color, delay, dur) {
  const col = hx(color);
  c.fx.add({ dur, delay, make(node) {
    const g = new Graphics();
    const art = ART.burst_wind ? sprite(ART.burst_wind, x, y - 60) : null;
    if (art) node.addChild(art);
    node.addChild(g);
    return { g, art };
  }, update(k, s) {
    const a = k < 0.15 ? k / 0.15 : 1 - Math.max(0, k - 0.6) / 0.4;
    s.g.clear();
    for (let i = 0; i < 8; i++) {
      const yy = y - i * 17;
      const rr = 13 + i * 8;
      const a0 = k * 30 + i, a1 = a0 + 4.4;
      const cx = x + Math.sin(k * 20 + i) * 6;
      const pts = [];
      for (let j = 0; j <= 16; j++) { const t = a0 + ((a1 - a0) * j) / 16; pts.push(cx + Math.cos(t) * rr, yy + Math.sin(t) * rr * 0.3); }
      s.g.poly(pts, false).stroke({ width: 5, color: col, alpha: 0.25 * a }).poly(pts, false).stroke({ width: 2.2, color: 0xffffff, alpha: 0.7 * a });
    }
    if (s.art) { s.art.alpha = a * 0.6; s.art.rotation = k * 8; s.art.scale.set(150 / s.art.texture.width); }
  } });
  for (let i = 0; i < 12; i++) c.fx.emit({ x: x + (R() - 0.5) * 40, y: y - R() * 100, vx: (R() - 0.5) * 140, vy: -60 - R() * 90, kind: 'leaf', color: '#b6ffd8', size: 6, life: 0.8, delay: delay + R() * dur * 0.6, vr: 10 });
}

function shieldOn(c, color) {
  const col = hx(color);
  for (const t of c.tg) {
    c.fx.add({ dur: 0.8, delay: c.impact, make(node) {
      const g = new Graphics();
      const hexs = sprite(T.circleTex(color), t.x, t.cy);
      node.addChild(hexs, g);
      return { g, hexs };
    }, update(k, s) {
      const a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      const r = t.h * 0.46 * ease.backOut(Math.min(1, k * 3));
      s.g.clear().circle(t.x, t.cy, r).fill({ color: col, alpha: 0.14 * a }).stroke({ width: 3, color: col, alpha: 0.9 * a })
        .circle(t.x, t.cy, r * 0.94).stroke({ width: 1.2, color: 0xffffff, alpha: 0.7 * a });
      s.hexs.scale.set((r * 2) / 512);
      s.hexs.alpha = a * 0.35;
      s.hexs.rotation = k * 1.5;
    } });
  }
}

// ------------------------------------------------------------------ composite recipes (normal attacks & skills)

function hitPoint(t) { return [t.x + (R() - 0.5) * t.h * 0.2, t.cy + (R() - 0.5) * t.h * 0.25]; }
function muzzle(c) { return [c.src.x + dirOf(c) * c.src.h * 0.18, c.src.cy - c.src.h * 0.05]; }
const shake = (c, a, d = 0.25, delay = 0) => c.view.shake(a, d, delay);
const flash = (c, color, a = 0.5, d = 0.25, delay = 0) => c.view.flash(color, a, d, delay);

function boltAttack(c, kind, color, { size = 11, dur, arc = 0, burst: doBurst = true, n = 1 } = {}) {
  const [sx, sy] = muzzle(c);
  // leave the hand exactly when the actor's release pose snaps (c.release), arrive on the impact
  const d = dur ?? Math.max(0.1, c.impact - (c.release || 0.12));
  for (const t of c.tg) {
    for (let i = 0; i < n; i++) {
      const [hx2, hy] = hitPoint(t);
      projectile(c, sx, sy, hx2, hy, { kind, color, size, dur: d, arc, delay: c.impact - d + i * 0.13 });
      if (doBurst) glowBurst(c, hx2, hy, color, 10, 190, 7, c.impact + i * 0.13);
    }
  }
}

function meleeSlash(c, color, { n = 1, width = 12, r = 44, spacing = 0.13 } = {}) {
  if (c.actorSwings) {
    // the attacker's own weapon trails do the cutting; add an elemental flicker on each connecting blow
    for (const t of c.tg) for (let i = 0; i < n; i++) c.fx.burst(t.x, t.cy, 6, { kind: 'star', color, speed: 170, size: 5, size1: 1, life: 0.35, drag: 3, delay: c.impact + i * spacing });
    return;
  }
  for (const t of c.tg) {
    for (let i = 0; i < n; i++) {
      const ang = (i % 2 ? 0.5 : -0.7) + (R() - 0.5) * 0.4;
      slashArc(c, t.x, t.cy, color, { angle: ang, r: r + i * 3, delay: c.impact - 0.06 + i * spacing, width, flip: dirOf(c) < 0 });
    }
  }
}

function aoeBlast(c, color, { size = 1, delay = 0, kind = 'glow' } = {}) {
  for (const t of c.tg) {
    glowBurst(c, t.x, t.cy, color, 18, 260 * size, 10 * size, (delay || c.impact) + R() * 0.06, 0.5, kind);
    ring(c, t.x, t.y, color, 8, 50 * size, 0.45, delay || c.impact);
  }
}

function heal(c, color = PAL.heal[0]) {
  for (const t of c.tg) {
    rising(c, t.x, t.y, 'glow', color, 12, { delay: c.impact - 0.05 });
    rising(c, t.x, t.y, 'star', '#ffffff', 5, { delay: c.impact, size: 6 });
    ring(c, t.x, t.y, color, 6, 44, 0.5, c.impact - 0.05, 3);
    c.fx.emit({ x: t.x, y: t.cy, tex: T.glowTex(color, 0.05), size: t.h * 0.5, size1: t.h * 0.7, life: 0.5, delay: c.impact, a0: 0.6, a1: 0 });
  }
}

function buff(c, color) {
  for (const t of c.tg) {
    rising(c, t.x, t.y, 'spark', color, 9, { delay: c.impact - 0.05, speed: 170, size: 7, life: 0.6 });
    ring(c, t.x, t.y, color, 50, 6, 0.5, c.impact - 0.1, 3);
  }
}

function vine(c, t, color, n, delay, dur) {
  const col = hx(color);
  c.fx.add({ dur, delay, layer: 'normal', make(node) { const g = new Graphics(); node.addChild(g); return { g }; },
    update(k, s) {
      const a = 1 - Math.max(0, k - 0.6) / 0.4;
      const gk = ease.out(Math.min(1, k * 3));
      s.g.clear();
      for (let i = 0; i < n; i++) {
        const o = i - (n - 1) / 2;
        s.g.moveTo(t.x + o * 16, t.y + 4).quadraticCurveTo(t.x + o * 30, t.y - 30 * gk, t.x + o * 6, t.cy - 10 * gk).stroke({ width: 7, color: col, alpha: a, cap: 'round' });
        s.g.moveTo(t.x + o * 16, t.y + 4).quadraticCurveTo(t.x + o * 30, t.y - 30 * gk, t.x + o * 6, t.cy - 10 * gk).stroke({ width: 2, color: 0xd8ff9a, alpha: a * 0.6, cap: 'round' });
      }
    } });
}

const RECIPES = {
  // ---------- basic projectiles
  holyBolt: (c) => boltAttack(c, 'star', PAL.light[0], { size: 11 }),
  holyFlame: (c) => boltAttack(c, 'flame', '#ffb04a', { size: 13 }),
  fireball: (c) => boltAttack(c, 'flame', PAL.fire[0], { size: 14, arc: 18 }),
  fireballBig: (c) => { boltAttack(c, 'flame', PAL.fire[0], { size: 21, arc: 30 }); for (const t of c.tg) { burst(c, t.x, t.cy, 'fire', { size: 70, delay: c.impact }); smoke(c, t.x, t.cy, '#5a3a2a', 6, c.impact); shake(c, 4, 0.2, c.impact); } },
  iceShard: (c) => boltAttack(c, 'shard', PAL.water[1], { size: 12 }),
  iceBolt: (c) => boltAttack(c, 'shard', PAL.water[1], { size: 11 }),
  iceBoltBig: (c) => { boltAttack(c, 'shard', PAL.water[1], { size: 18 }); for (const t of c.tg) { sparks(c, t.x, t.cy, '#e8fbff', 12, 380, c.impact); burst(c, t.x, t.cy, 'ice', { size: 60, delay: c.impact }); } },
  iceLance: (c) => {
    const [sx, sy] = muzzle(c);
    for (const t of c.tg) {
      projectile(c, sx, sy, t.x, t.cy, { kind: 'shard', color: PAL.water[1], size: 20, dur: Math.max(0.15, c.impact - 0.1), delay: 0.1 });
      c.fx.burst(t.x, t.cy, 14, { kind: 'shard', color: PAL.water[1], speed: 320, size: 8, life: 0.6, ay: 300, delay: c.impact });
      burst(c, t.x, t.cy, 'ice', { size: 70, delay: c.impact });
    }
    shake(c, 4, 0.2, c.impact);
  },
  darkArrow: (c) => boltAttack(c, 'arrow', PAL.dark[0], { size: 16 }),
  arrow: (c) => boltAttack(c, 'arrow', '#e8d8a8', { size: 16, arc: 10 }),
  darkBolt: (c) => boltAttack(c, 'core', PAL.dark[0], { size: 13 }),
  darkSpark: (c) => boltAttack(c, 'star', '#ff4ab0', { size: 11 }),
  noteBolt: (c) => boltAttack(c, 'note', '#7ae0ff', { size: 13, arc: 14 }),
  runeBolt: (c) => boltAttack(c, 'rune', '#ffe08a', { size: 12 }),
  waterBolt: (c) => boltAttack(c, 'bubble', PAL.water[0], { size: 12 }),
  leafBolt: (c) => boltAttack(c, 'leaf', '#7ad84a', { size: 11, arc: 12 }),
  pebbleShot: (c) => boltAttack(c, 'rock', '#c8a878', { size: 9, arc: 20 }),
  wispBolt: (c) => boltAttack(c, 'core', P(c.el)[0], { size: 11, arc: 10 }),
  spore: (c) => boltAttack(c, 'glow', PAL.poison[0], { size: 12, arc: 20 }),
  feather: (c) => boltAttack(c, 'feather', '#e8f0ff', { size: 12 }),
  boneThrow: (c) => boltAttack(c, 'bone', '#f0ead8', { size: 12, arc: 26 }),
  piercingArrow: (c) => { const [sx, sy] = muzzle(c); for (const t of c.tg) { beam(c, sx, sy, t.x + dirOf(c) * 80, t.cy, PAL.wind[0], { delay: c.impact - 0.08, width: 10, dur: 0.35 }); sparks(c, t.x, t.cy, PAL.wind[1], 12, 400, c.impact); } },
  quickShot: (c) => boltAttack(c, 'rock', '#e8d8a8', { size: 8, n: 1 }),
  shadowVolley: (c) => boltAttack(c, 'arrow', PAL.dark[0], { size: 15 }),
  voidGrasp: (c) => {
    for (const t of c.tg) {
      magicCircle(c, t.x, t.y, 50, PAL.dark[0], { dur: 0.7, delay: Math.max(0, c.impact - 0.3), el: 'dark' });
      c.fx.add({ dur: 0.55, delay: Math.max(0, c.impact - 0.2), layer: 'normal', make(node) { const g = new Graphics(); node.addChild(g); return { g }; },
        update(k, s) {
          const a = 1 - Math.max(0, k - 0.6) / 0.4;
          s.g.clear();
          for (let i = 0; i < 4; i++) {
            const o = (i - 1.5) * 14, hgt = t.h * 0.7 * ease.out(Math.min(1, k * 3));
            s.g.moveTo(t.x + o, t.y + 4).quadraticCurveTo(t.x + o * 2.2 + Math.sin(k * 10 + i) * 8, t.y - hgt * 0.6, t.x + o * 0.4, t.y - hgt).stroke({ width: 6, color: 0x2a0a40, alpha: a, cap: 'round' });
          }
        } });
      glowBurst(c, t.x, t.cy, PAL.dark[1], 12, 200, 9, c.impact);
    }
  },

  // ---------- melee
  slash: (c) => meleeSlash(c, P(c.el)[1]),
  doubleSlash: (c) => meleeSlash(c, PAL.wind[1], { n: 2, spacing: 0.13 }),
  tripleSlash: (c) => { meleeSlash(c, PAL.wind[0], { n: 3, width: 14, spacing: 0.12 }); for (const t of c.tg) ring(c, t.x, t.y, PAL.wind[0], 10, 64, 0.4, c.impact + 0.2); },
  daggerSlash: (c) => meleeSlash(c, '#c8b8ff', { n: 2, width: 8, r: 34 }),
  claw: (c) => { for (const t of c.tg) for (let i = 0; i < 3; i++) slashArc(c, t.x + (i - 1) * 8, t.cy, '#ff8a8a', { angle: -1.2, r: 30, sweep: 1.4, width: 5, delay: c.impact - 0.05 + i * 0.03 }); },
  bite: (c) => { for (const t of c.tg) { slashArc(c, t.x, t.cy - 10, '#ffffff', { angle: Math.PI / 2, r: 26, sweep: 2, width: 7, delay: c.impact - 0.05 }); slashArc(c, t.x, t.cy + 10, '#ffffff', { angle: -Math.PI / 2, r: 26, sweep: 2, width: 7, delay: c.impact - 0.05 }); glowBurst(c, t.x, t.cy, PAL.blood[0], 10, 200, 7, c.impact); } },
  bump: (c) => { for (const t of c.tg) { glowBurst(c, t.x, t.cy, P(c.el)[1], 10, 160, 8, c.impact); ring(c, t.x, t.cy, '#ffffff', 4, 28, 0.25, c.impact, 4, 1); } },
  lanceThrust: (c) => { for (const t of c.tg) { beam(c, t.x - dirOf(c) * 50, t.cy, t.x + dirOf(c) * 30, t.cy, PAL.light[0], { delay: c.impact - 0.05, width: 8, dur: 0.24 }); sparks(c, t.x, t.cy, '#ffffff', 10, 380, c.impact); } },
  tridentThrust: (c) => { for (const t of c.tg) { for (const o of [-10, 0, 10]) beam(c, t.x - dirOf(c) * 50, t.cy + o, t.x + dirOf(c) * 24, t.cy + o, PAL.water[0], { delay: c.impact - 0.05, width: 4, dur: 0.22 }); rising(c, t.x, t.cy + 20, 'bubble', PAL.water[1], 6, { delay: c.impact }); } },
  hammerSmash: (c) => { for (const t of c.tg) { glowBurst(c, t.x, t.cy, PAL.earth[1], 16, 240, 10, c.impact); ring(c, t.x, t.y, PAL.earth[0], 8, 74, 0.45, c.impact, 6); smoke(c, t.x, t.y, '#8a6a4a', 6, c.impact); burst(c, t.x, t.y - 10, 'earth', { size: 60, delay: c.impact }); shake(c, 6, 0.22, c.impact); } },
  maceStrike: (c) => { for (const t of c.tg) { glowBurst(c, t.x, t.cy, '#ffe0a0', 12, 200, 9, c.impact); shake(c, 3, 0.15, c.impact); } },
  axeChop: (c) => { meleeSlash(c, '#ffb04a', { width: 16, r: 50 }); for (const t of c.tg) shake(c, 4, 0.15, c.impact); },
  shieldBash: (c) => { for (const t of c.tg) { glowBurst(c, t.x, t.cy, PAL.light[0], 18, 280, 10, c.impact); ring(c, t.x, t.cy, '#ffffff', 6, 48, 0.3, c.impact, 6, 1); rising(c, t.x, t.y - t.h, 'star', '#fff6c4', 5, { delay: c.impact + 0.1, speed: 40 }); shake(c, 5, 0.2, c.impact); } },
  fireSlash: (c) => { meleeSlash(c, PAL.fire[0], { width: 16 }); for (const t of c.tg) c.fx.burst(t.x, t.cy, 14, { kind: 'flame', color: PAL.fire[0], speed: 150, size: 13, life: 0.5, delay: c.impact, ay: -200 }); },
  darkSlash: (c) => { meleeSlash(c, PAL.dark[0], { width: 18, r: 56 }); },
  rockBreaker: (c) => { for (const t of c.tg) { c.fx.burst(t.x, t.y, 14, { kind: 'rock', color: '#a8865a', speed: 260, size: 9, life: 0.7, ay: 700, delay: c.impact, angle: -Math.PI / 2, spread: 2, blend: 'normal' }); glowBurst(c, t.x, t.cy, PAL.earth[1], 14, 240, 10, c.impact); shake(c, 7, 0.25, c.impact); } },
  shadowStep: (c) => { for (const t of c.tg) { smoke(c, t.x, t.cy, '#2a1a3a', 10, c.impact - 0.15); meleeSlash(c, PAL.dark[1], { n: 2, width: 10 }); } },
  tentacle: (c) => {
    for (const t of c.tg) {
      c.fx.add({ dur: 0.5, delay: Math.max(0, c.impact - 0.15), layer: 'normal', make(node) { const g = new Graphics(); node.addChild(g); return { g }; },
        update(k, s) { s.g.clear().moveTo(t.x, t.y + 20).quadraticCurveTo(t.x + 30 * Math.sin(k * 8), t.y - 40, t.x, t.cy - 30 * ease.out(k)).stroke({ width: 13 * (1 - k * 0.5), color: 0x8a3aa8, alpha: 1 - k, cap: 'round' }); } });
      glowBurst(c, t.x, t.cy, '#c87aff', 10, 180, 8, c.impact);
    }
  },

  // ---------- heals / buffs / shields
  healSingle: (c) => heal(c),
  leafHeal: (c) => { heal(c, '#7ad84a'); for (const t of c.tg) rising(c, t.x, t.y, 'leaf', '#7ad84a', 5, { delay: c.impact }); },
  buffAll: (c) => buff(c, '#ffb04a'),
  energyAll: (c) => { buff(c, '#7ae0ff'); for (const t of c.tg) rising(c, t.x, t.y, 'rune', '#9fe8ff', 3, { delay: c.impact, speed: 70 }); },
  waterShield: (c) => { shieldOn(c, PAL.water[0]); for (const t of c.tg) rising(c, t.x, t.y, 'bubble', PAL.water[1], 8, { delay: c.impact }); },
  stoneWall: (c) => { shieldOn(c, PAL.earth[0]); for (const t of c.tg) c.fx.burst(t.x, t.y, 8, { kind: 'rock', color: '#9a8a7a', speed: 120, size: 7, life: 0.5, ay: 500, angle: -Math.PI / 2, spread: 1.6, delay: c.impact, blend: 'normal' }); },
  howl: (c) => { ring(c, c.src.x, c.src.cy, '#ffaaaa', 10, 90, 0.5, Math.max(0, c.impact - 0.25), 4, 1); ring(c, c.src.x, c.src.cy, '#ffaaaa', 10, 120, 0.6, Math.max(0, c.impact - 0.15), 3, 1); meleeSlash(c, '#ff6a6a', { n: 2 }); },
  drain: (c) => { boltAttack(c, 'glow', PAL.blood[0], { size: 10 }); const [sx, sy] = [c.src.x, c.src.cy]; for (const t of c.tg) projectile(c, t.x, t.cy, sx, sy, { kind: 'glow', color: PAL.blood[1], size: 8, dur: 0.35, delay: c.impact + 0.05 }); },

  // ---------- AoE skills
  flameBurst: (c) => { for (const t of c.tg) { c.fx.burst(t.x, t.cy, 16, { kind: 'flame', color: PAL.fire[0], speed: 190, size: 15, life: 0.55, ay: -260, delay: c.impact + R() * 0.08 }); glowBurst(c, t.x, t.cy, PAL.fire[1], 10, 220, 9, c.impact); burst(c, t.x, t.cy, 'fire', { size: 70, delay: c.impact }); } shake(c, 4, 0.2, c.impact); },
  poisonCloud: (c) => { for (const t of c.tg) { smoke(c, t.x, t.cy, '#7ab83a', 10, c.impact - 0.1); rising(c, t.x, t.y, 'glow', PAL.poison[0], 7, { delay: c.impact }); } },
  splash: (c) => { for (const t of c.tg) { c.fx.burst(t.x, t.cy, 18, { kind: 'bubble', color: P(c.el)[1], speed: 230, size: 7, life: 0.5, ay: 500, delay: c.impact }); } },
  screech: (c) => { for (let i = 0; i < 3; i++) ring(c, c.src.x, c.src.cy, '#ff9aaa', 10, 280, 0.6, Math.max(0, c.impact - 0.3 + i * 0.1), 4, 1); if (c.view.shockwave) c.view.shockwave(c.src.x, c.src.cy, { amp: 12, wave: 80 }); },
  mischief: (c) => { for (const t of c.tg) { rising(c, t.x, t.y, 'heart', '#ff4ab0', 5, { delay: c.impact, speed: 60 }); glowBurst(c, t.x, t.cy, '#ff4ab0', 8, 160, 7, c.impact); } },
  featherStorm: (c) => boltAttack(c, 'feather', '#e8f0ff', { size: 12 }),
  roots: (c) => { for (const t of c.tg) { vine(c, t, '#5a8a2a', 3, Math.max(0, c.impact - 0.2), 0.8); c.fx.burst(t.x, t.y, 6, { kind: 'leaf', color: '#7ad84a', speed: 120, size: 6, life: 0.6, delay: c.impact }); } },
  petrify: (c) => { for (const t of c.tg) { beam(c, c.src.x, c.src.cy - c.src.h * 0.2, t.x, t.cy, '#c8b88a', { delay: Math.max(0, c.impact - 0.2), width: 8, dur: 0.4 }); smoke(c, t.x, t.cy, '#9a9a8a', 8, c.impact); } },
  blizzard: (c) => { for (const t of c.tg) for (let i = 0; i < 4; i++) fallOn(c, t.x + (R() - 0.5) * 40, t.cy + (R() - 0.5) * 30, 'snow', PAL.water[1], { size: 9, delay: Math.max(0, c.impact - 0.3 + i * 0.07), slant: 40 }); },
  flameBreath: (c) => { const [sx, sy] = muzzle(c); for (let i = 0; i < 30; i++) { const t = c.tg[i % c.tg.length]; if (!t) break; c.fx.emit({ x: sx, y: sy, vx: (t.x - sx) * (2 + R()), vy: (t.cy - sy) * (2 + R()) + (R() - 0.5) * 60, kind: 'flame', color: P(c.el)[0], size: 11 + R() * 9, size1: 28, life: 0.45, delay: Math.max(0, c.impact - 0.4) + i * 0.012, drag: 1 }); } aoeBlast(c, P(c.el)[1]); },
  boneStorm: (c) => { for (const t of c.tg) for (let i = 0; i < 3; i++) fallOn(c, t.x + (R() - 0.5) * 30, t.cy, 'bone', '#f0ead8', { size: 11, delay: Math.max(0, c.impact - 0.3 + i * 0.1), slant: 80 * dirOf(c) }); },
  cyclone: (c) => { for (const t of c.tg) tornado(c, t.x, t.y, PAL.wind[1], Math.max(0, c.impact - 0.25), 0.9); },
  slimeRain: (c) => { for (const t of c.tg) for (let i = 0; i < 3; i++) fallOn(c, t.x + (R() - 0.5) * 36, t.cy, 'bubble', P(c.el)[1], { size: 12, delay: Math.max(0, c.impact - 0.3 + i * 0.09), slant: 20 }); },
  arrowRain: (c) => { for (const t of c.tg) for (let i = 0; i < 5; i++) fallOn(c, t.x + (R() - 0.5) * 40, t.cy + (R() - 0.5) * 20, 'arrow', PAL.wind[1], { size: 15, delay: Math.max(0, c.impact - 0.2 + i * 0.16), slant: 60 * dirOf(c), from: 200 }); shake(c, 3, 0.8, c.impact); },
  musicStorm: (c) => { for (const t of c.tg) { for (let i = 0; i < 6; i++) projectile(c, c.src.x, c.src.cy, t.x + (R() - 0.5) * 30, t.cy + (R() - 0.5) * 30, { kind: 'note', color: ['#7ae0ff', '#ffd84a', '#ff8ac8'][i % 3], size: 12, dur: 0.4, arc: 40 + R() * 40, delay: Math.max(0, c.impact - 0.4 + i * 0.05) }); } },
  sparkBurst: (c) => { for (const t of c.tg) { sparks(c, t.x, t.cy, PAL.fire[1], 18, 440, c.impact); glowBurst(c, t.x, t.cy, PAL.fire[0], 14, 260, 10, c.impact); } shake(c, 5, 0.25, c.impact); },
  rollingStone: (c) => { const t = c.tg[0]; if (!t) return; projectile(c, c.src.x, c.src.y - 18, t.x, t.y - 18, { kind: 'rock', color: '#a8865a', size: 22, dur: Math.max(0.2, c.impact), spin: true }); c.fx.burst(t.x, t.y, 14, { kind: 'rock', color: '#a8865a', speed: 260, size: 8, life: 0.7, ay: 700, angle: -Math.PI / 2, spread: 2.2, delay: c.impact, blend: 'normal' }); shake(c, 8, 0.3, c.impact); },
  windBarrage: (c) => boltAttack(c, 'rock', PAL.wind[1], { size: 8 }),
  blizzardBolts: (c) => boltAttack(c, 'shard', PAL.water[1], { size: 16 }),
  quick: (c) => boltAttack(c, 'glow', '#ffffff', { size: 8 }),
};

// ------------------------------------------------------------------ ultimates

function enemyArea(c) {
  if (!c.tg.length) return [c.src.x + dirOf(c) * 120, c.src.y];
  return [c.tg.reduce((a, t) => a + t.x, 0) / c.tg.length, c.tg.reduce((a, t) => a + t.y, 0) / c.tg.length];
}
const W = (c) => c.view.w;
const H = (c) => c.view.h;

/** Opening beat shared by every hero ultimate: caster circle + converging light + light pillar. */
function opening(c, el) {
  const col = P(el)[0];
  magicCircle(c, c.src.x, c.src.y, c.src.h * 0.75, col, { dur: 1.1, el, spin: 1.2 });
  converge(c, c.src.x, c.src.cy, P(el)[1], { n: 26, radius: c.src.h, dur: 0.3 });
  flare(c, c.src.x, c.src.cy, P(el)[1], { size: 70, dur: 0.35 });
}

const ULTS = {
  sanctuary: (c) => {
    opening(c, 'light');
    const col = PAL.light[0];
    const [ax, ay] = enemyArea(c);
    flash(c, '#fff6c4', 0.6, 0.45);
    godRays(c, ax, -40, '#fff2c0', { size: H(c) * 1.1, dur: 1.4, spin: 0.15 });
    magicCircle(c, ax, ay, 170, col, { dur: 1.5, el: 'light' });
    for (const t of c.tg) {
      const d = 0.05 + R() * 0.15;
      pillar(c, t.x, t.y, col, { delay: d, width: 34, dur: 1.0 });
      impact(c, t.x, t.cy, 'light', { power: 0.8, delay: d + 0.12 });
      rising(c, t.x, t.y, 'star', '#ffffff', 12, { delay: 0.2, speed: 130 });
    }
    for (let i = 0; i < 26; i++) c.fx.emit({ x: R() * W(c), y: -20, vx: (R() - 0.5) * 40, vy: 60 + R() * 60, kind: 'feather', color: '#ffffff', size: 8, life: 2, delay: R() * 0.6, vr: 3, a0: 0.9 });
    burst(c, ax, ay - 90, 'light', { size: 170, delay: 0.25, dur: 1.2, color: '#fff6c4', art: 'feather_burst' });
    c.view.punch?.(ax, ay - 40, 0.1, 0.6, 0.15);
  },
  goldenDome: (c) => {
    opening(c, 'light');
    const [ax, ay] = [c.src.side ? W(c) * 0.75 : W(c) * 0.27, c.src.y];
    flash(c, '#ffe9a0', 0.5, 0.35);
    c.fx.add({ dur: 1.4, delay: 0.05, make(node) {
      const g = new Graphics(); const sig = sprite(ART.sigil_star || T.circleTex('#ffd84a'), ax, ay - 70);
      node.addChild(sig, g); return { g, sig };
    }, update(k, s) {
      const a = k < 0.2 ? k / 0.2 : 1 - Math.max(0, k - 0.5) / 0.5;
      const r = 170 * ease.backOut(Math.min(1, k * 2.5));
      s.g.clear();
      for (let i = 0; i < 6; i++) s.g.ellipse(ax, ay, r * (1 - i * 0.08), r * 0.88 * (1 - i * 0.08)).stroke({ width: i ? 1.5 : 4, color: i ? 0xffd84a : 0xffffff, alpha: (i ? 0.35 : 0.9) * a });
      s.g.ellipse(ax, ay, r, r * 0.88).fill({ color: 0xffd84a, alpha: 0.1 * a });
      s.sig.scale.set((r * 1.3) / s.sig.texture.width); s.sig.alpha = a * 0.7; s.sig.rotation = k * 2;
    } });
    shieldOn(c, PAL.light[0]);
    rising(c, ax, ay, 'star', '#fff6c4', 24, { spread: 240, delay: 0.2, speed: 110 });
    c.view.punch?.(ax, ay - 50, 0.08, 0.5, 0.1);
  },
  meteorRain: (c) => {
    opening(c, 'fire');
    flash(c, '#ff5a3c', 0.4, 0.35);
    c.view.dim(0.35, 1.4);
    const [ax, ay] = enemyArea(c);
    magicCircle(c, ax, ay, 180, PAL.fire[0], { dur: 1.7, el: 'fire', spin: 0.8 });
    const n = Math.max(5, c.hits);
    for (let h = 0; h < n; h++) {
      const t = c.tg[h % c.tg.length];
      if (!t) break;
      const d = Math.max(0, 0.18 + h * 0.16 - 0.3);
      const x = t.x + (R() - 0.5) * 40, y = t.cy + (R() - 0.5) * 24;
      fallOn(c, x, y, 'flame', PAL.fire[0], { size: 26, delay: d, dur: 0.3, from: 300, slant: 140 * dirOf(c), tex: ART.meteor || null });
      impact(c, x, y, 'fire', { power: 0.75 + (h === n - 1 ? 0.6 : 0), delay: d + 0.3 });
      c.fx.burst(x, y, 10, { kind: 'flame', color: PAL.fire[0], speed: 220, size: 14, life: 0.6, ay: -260, delay: d + 0.3 });
      if (h % 2 === 0) smoke(c, x, t.y, '#4a2a1a', 5, d + 0.32);
    }
    for (let i = 0; i < 40; i++) c.fx.emit({ x: R() * W(c), y: H(c) + 10, vx: (R() - 0.5) * 40, vy: -80 - R() * 120, kind: 'glow', color: '#ff8a3a', size: 3 + R() * 3, life: 1.6, delay: R() * 1.2 });
    c.view.punch?.(ax, ay - 40, 0.12, 0.9, 0.2);
  },
  seraphHymn: (c) => {
    opening(c, 'fire');
    flash(c, '#ffd08a', 0.55, 0.45);
    const [sx, sy] = [c.src.x, c.src.cy];
    godRays(c, sx, sy, '#ffd08a', { size: 300, dur: 1.2 });
    for (let i = 0; i < 8; i++) {
      const ang = -Math.PI / 2 + (i - 3.5) * 0.3;
      beam(c, sx, sy, sx + Math.cos(ang) * 520, sy + Math.sin(ang) * 520, i % 2 ? '#ffb04a' : '#fff2c0', { delay: 0.02 * i, width: 18, dur: 0.7 });
    }
    for (const t of c.tg) {
      beam(c, t.x, -40, t.x, t.y, '#ffb04a', { delay: 0.22, width: 26, dur: 0.5 });
      impact(c, t.x, t.cy, 'fire', { power: 0.9, delay: 0.3, color: '#ffd08a' });
    }
    rising(c, sx, c.src.y, 'feather', '#fff0d0', 22, { spread: 200, speed: 45, life: 1.7, delay: 0.1 });
  },
  galeBlades: (c) => {
    opening(c, 'wind');
    flash(c, '#b6ffd8', 0.35, 0.2);
    for (let h = 0; h < c.hits; h++) {
      const t = c.tg[h % c.tg.length];
      if (!t) break;
      const d = 0.18 + h * 0.16;
      slashArc(c, t.x, t.cy, PAL.wind[0], { angle: R() * 6.28, r: 70, width: 20, delay: Math.max(0, d - 0.05), sweep: 2.9, dur: 0.3 });
      beam(c, t.x - 110, t.cy + (R() - 0.5) * 60, t.x + 110, t.cy + (R() - 0.5) * 60, '#e8fff4', { delay: Math.max(0, d - 0.04), width: 5, dur: 0.2 });
      sparks(c, t.x, t.cy, '#f0fff8', 10, 520, d);
      shake(c, 5, 0.1, d);
      c.view.aberrate?.(5, 0.12, d);
    }
    const last = 0.18 + c.hits * 0.16;
    const [ax, ay] = enemyArea(c);
    slashArc(c, ax, ay - 50, '#ffffff', { angle: -0.8, r: 150, width: 28, delay: last, sweep: 3.2, dur: 0.4 });
    impact(c, ax, ay - 40, 'wind', { power: 1.2, delay: last + 0.05 });
    for (let i = 0; i < 46; i++) c.fx.emit({ x: R() * W(c), y: H(c) * (0.2 + R() * 0.7), vx: 1000 * dirOf(c), vy: (R() - 0.5) * 40, kind: 'spark', color: PAL.wind[1], size: 11, life: 0.35, stretch: 0.03, delay: R() * (last + 0.2) });
    c.view.radialBlur?.(ax, ay - 40, 0.1, 0.4, last);
  },
  absoluteZero: (c) => {
    opening(c, 'water');
    const [ax, ay] = enemyArea(c);
    flash(c, '#e8fbff', 0.75, 0.55);
    c.view.dim(0.35, 1.3);
    magicCircle(c, ax, ay, 190, PAL.water[1], { dur: 1.5, spin: -1, el: 'water' });
    c.fx.add({ dur: 1.15, delay: 0, make(node) { const g = new Graphics(); node.addChild(g); return { g }; },
      update(k, s) {
        const grow = ease.backOut(Math.min(1, k * 2.2));
        const a = k < 0.72 ? 1 : 1 - (k - 0.72) / 0.28;
        s.g.clear();
        for (let i = -3; i <= 3; i++) {
          const hgt = (150 - Math.abs(i) * 28) * grow, x = ax + i * 34, wd = 18 - Math.abs(i) * 2;
          const pts = [x, ay - hgt, x + wd, ay - hgt * 0.35, x, ay + 4, x - wd, ay - hgt * 0.35];
          s.g.poly(pts).fill({ color: 0x9ee0ff, alpha: 0.55 * a }).stroke({ width: 2, color: 0xffffff, alpha: 0.95 * a });
          s.g.poly([x, ay - hgt, x + wd * 0.35, ay - hgt * 0.4, x, ay - hgt * 0.1]).fill({ color: 0xffffff, alpha: 0.7 * a });
        }
      } });
    for (const t of c.tg) {
      c.fx.burst(t.x, t.cy, 24, { kind: 'shard', color: PAL.water[1], speed: 420, size: 10, life: 0.9, ay: 400, delay: 0.85 });
      impact(c, t.x, t.cy, 'ice', { power: 1, delay: 0.85, color: '#e8fbff' });
    }
    flash(c, '#ffffff', 0.6, 0.3, 0.85);
    for (let i = 0; i < 60; i++) c.fx.emit({ x: R() * W(c), y: -10, vx: (R() - 0.5) * 40, vy: 120 + R() * 120, kind: 'snow', color: '#e8fbff', size: 5, life: 1.8, delay: R() * 0.9, vr: 3 });
    c.view.punch?.(ax, ay - 50, 0.14, 0.7, 0.7);
  },
  tectonic: (c) => {
    if (c.kind === 'ult' && c.src.side === 0) opening(c, 'earth');
    flash(c, '#ffd99a', 0.45, 0.25, 0.15);
    const [ax, ay] = enemyArea(c);
    shake(c, 16, 0.7, 0.15);
    // glowing cracks racing across the ground
    c.fx.add({ dur: 1.0, delay: 0.05, layer: 'under', make(node) { const g = new Graphics(); node.addChild(g); const paths = []; for (let i = 0; i < 7; i++) { let x = ax, y = ay; const a = R() * 6.28; const p = [x, y]; for (let j = 0; j < 7; j++) { x += Math.cos(a + (R() - 0.5)) * 26; y += Math.sin(a + (R() - 0.5)) * 9; p.push(x, y); } paths.push(p); } return { g, paths }; },
      update(k, s) { const a = 1 - Math.max(0, k - 0.6) / 0.4; s.g.clear(); const n = Math.ceil(ease.out(Math.min(1, k * 3)) * 8); for (const p of s.paths) { const q = p.slice(0, n * 2); if (q.length < 4) continue; s.g.poly(q, false).stroke({ width: 7, color: 0xff8a2a, alpha: 0.35 * a }).poly(q, false).stroke({ width: 2.5, color: 0xffe0a0, alpha: a }); } } });
    for (const t of c.tg) {
      c.fx.add({ dur: 1.0, delay: 0.15, layer: 'normal', make(node) { const g = new Graphics(); node.addChild(g); return { g }; },
        update(k, s) {
          const a = 1 - Math.max(0, k - 0.6) / 0.4;
          const hgt = 90 * ease.backOut(Math.min(1, k * 3));
          s.g.clear();
          for (let i = -2; i <= 2; i++) {
            const x = t.x + i * 16, hh = hgt * (1 - Math.abs(i) * 0.22);
            s.g.poly([x - 13, t.y + 6, x + i * 4, t.y - hh, x + 13, t.y + 6]).fill({ color: 0x8a6a3a, alpha: a }).stroke({ width: 2, color: 0x3a2a14, alpha: a });
            s.g.poly([x + i * 4, t.y - hh, x + 13, t.y + 6, x + 4, t.y + 6]).fill({ color: 0x5a4024, alpha: a * 0.8 });
          }
        } });
      c.fx.burst(t.x, t.y, 16, { kind: 'rock', color: '#a8865a', speed: 360, size: 9, life: 0.9, ay: 800, angle: -Math.PI / 2, spread: 2, delay: 0.18, blend: 'normal' });
      smoke(c, t.x, t.y, '#7a5a3a', 9, 0.2);
      impact(c, t.x, t.cy, 'earth', { power: 0.9, delay: 0.2 });
    }
    ring(c, ax, ay, PAL.earth[1], 10, 300, 0.75, 0.15, 9);
    c.view.punch?.(ax, ay - 30, 0.1, 0.6, 0.15);
  },
  eclipse: (c) => {
    c.view.dim(0.82, 1.3);
    const t = c.tg[0];
    if (!t) return;
    if (c.kind === 'ult' && c.src.side === 0) opening(c, 'dark');
    const mx = t.x, my = t.cy - 90;
    c.fx.add({ dur: 1.25, delay: 0, make(node) {
      const glow = sprite(T.glowTex('#e0c8ff', 0.3), mx, my); const rays = sprite(T.raysTex('#c8a0ff', 24), mx, my);
      const g = new Graphics(); node.addChild(rays, glow, g); return { glow, rays, g };
    }, update(k, s) {
      const a = k < 0.2 ? k / 0.2 : 1 - Math.max(0, k - 0.65) / 0.35;
      s.glow.scale.set(220 / 128); s.glow.alpha = a;
      s.rays.scale.set(380 / 512); s.rays.alpha = a * 0.7; s.rays.rotation = k;
      s.g.clear().circle(mx + 16 - k * 14, my - 6, 40).fill({ color: 0x0a0414, alpha: a });
    } });
    slashArc(c, t.x, t.cy, '#e0c8ff', { angle: -0.8, r: 100, width: 28, delay: 0.12, dur: 0.38, sweep: 3 });
    slashArc(c, t.x, t.cy, PAL.dark[0], { angle: 2.2, r: 80, width: 18, delay: 0.2, dur: 0.32, sweep: 2.6 });
    impact(c, t.x, t.cy, 'dark', { power: 1.3, delay: 0.18 });
    flash(c, '#dcb8ff', 0.6, 0.22, 0.17);
    c.view.punch?.(t.x, t.cy, 0.16, 0.5, 0.12);
  },
  blackHole: (c) => {
    const [ax, ay0] = enemyArea(c);
    const ay = ay0 - 60;
    if (c.kind === 'ult' && c.src.side === 0) opening(c, 'dark');
    c.view.dim(0.65, 1.4);
    c.fx.add({ dur: 1.4, delay: 0, make(node) {
      const halo = sprite(T.glowTex('#b05cff', 0.2), ax, ay); const g = new Graphics(); const art = ART.burst_dark ? sprite(ART.burst_dark, ax, ay) : null;
      if (art) node.addChild(art); node.addChild(halo, g); return { halo, g, art };
    }, update(k, s) {
      const grow = ease.backOut(Math.min(1, k * 2));
      const a = 1 - Math.max(0, k - 0.78) / 0.22;
      const r = 62 * grow;
      s.halo.scale.set((r * 5) / 128); s.halo.alpha = a * 0.9;
      if (s.art) { s.art.scale.set((r * 4.2) / s.art.texture.width); s.art.rotation = -k * 9; s.art.alpha = a * 0.75; }
      s.g.clear();
      for (let i = 0; i < 4; i++) s.g.ellipse(ax, ay, r * (1.35 + i * 0.35), r * (0.42 + i * 0.12)).stroke({ width: 2.2, color: 0xe0c8ff, alpha: 0.55 * a });
      s.g.circle(ax, ay, r).fill({ color: 0x000000, alpha: a }).circle(ax, ay, r * 1.04).stroke({ width: 3, color: 0xffffff, alpha: 0.6 * a });
    } });
    for (let i = 0; i < 70; i++) {
      const ang = R() * 6.28, d = 160 + R() * 120;
      const x = ax + Math.cos(ang) * d, y = ay + Math.sin(ang) * d * 0.6;
      c.fx.emit({ x, y, vx: (ax - x) * 1.7, vy: (ay - y) * 1.7, kind: 'spark', color: '#c87aff', size: 9, life: 0.6, stretch: 0.04, delay: R() * 0.8 });
    }
    c.view.radialBlur?.(ax, ay, 0.14, 1.0, 0.1);
    impact(c, ax, ay, 'dark', { power: 1.5, delay: 1.05 });
    for (const t of c.tg) glowBurst(c, t.x, t.cy, PAL.dark[0], 18, 320, 11, 0.25);
    shake(c, 9, 1.0, 0.15);
    c.view.punch?.(ax, ay, 0.12, 0.9, 0.1);
  },
  tidalWave: (c) => {
    const dir = dirOf(c);
    if (c.kind === 'ult' && c.src.side === 0) opening(c, 'water');
    flash(c, '#9ee0ff', 0.4, 0.3);
    c.fx.add({ dur: 1.1, delay: 0, make(node) { const g = new Graphics(); const crest = sprite(T.glowTex('#e8fbff', 0.2), 0, 0); node.addChild(g, crest); return { g, crest }; },
      update(k, s) {
        const w = W(c), h = H(c);
        const x = dir > 0 ? -120 + (w + 240) * ease.inOut(k) : w + 120 - (w + 240) * ease.inOut(k);
        const a = 1 - Math.max(0, k - 0.8) / 0.2;
        s.g.clear();
        for (let layer = 0; layer < 3; layer++) {
          const off = layer * 50 * dir, top = h * (0.12 + layer * 0.1);
          const pts = [x - dir * 260 - off, h + 10, x - dir * 260 - off, h * 0.4 + layer * 20];
          for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(x - off - dir * 220 * (1 - t), top + (h * 0.3) * (1 - Math.sin(t * Math.PI * 0.5)) + Math.sin(k * 20 + i + layer) * 6); }
          pts.push(x - off + dir * 24, h + 10);
          s.g.poly(pts).fill({ color: [0x1a6ad8, 0x3ca8ff, 0x9ee0ff][layer], alpha: [0.55, 0.45, 0.4][layer] * a });
        }
        s.crest.position.set(x, h * 0.18); s.crest.scale.set(2.2, 1.2); s.crest.alpha = a;
        if (R() < 0.9) c.fx.emit({ x, y: h * (0.15 + R() * 0.7), vx: dir * 220, vy: -120 - R() * 160, ay: 520, kind: 'bubble', color: '#e8fbff', size: 6, life: 0.6 });
      } });
    for (const t of c.tg) impact(c, t.x, t.cy, 'water', { power: 0.9, delay: 0.3 + R() * 0.15 });
    shake(c, 7, 0.7, 0.15);
  },
  phoenixSlash: (c) => {
    opening(c, 'fire');
    const t = c.tg[0];
    if (!t) return;
    flash(c, '#ffb35c', 0.55, 0.25, 0.1);
    beam(c, c.src.x, t.cy, t.x + dirOf(c) * 140, t.cy, PAL.fire[0], { delay: 0.08, width: 34, dur: 0.45 });
    slashArc(c, t.x, t.cy, PAL.fire[1], { angle: -0.4, r: 95, width: 30, delay: 0.14, sweep: 3.1, dur: 0.42 });
    slashArc(c, t.x, t.cy, '#ffffff', { angle: 2.4, r: 70, width: 16, delay: 0.24, sweep: 2.6, dur: 0.32 });
    c.fx.burst(t.x, t.cy, 36, { kind: 'flame', color: PAL.fire[0], speed: 320, size: 17, life: 0.75, ay: -300, delay: 0.18 });
    rising(c, t.x, t.y, 'feather', '#ffb35c', 16, { spread: 100, speed: 130, delay: 0.2 });
    impact(c, t.x, t.cy, 'fire', { power: 1.4, delay: 0.2 });
    c.view.punch?.(t.x, t.cy, 0.18, 0.45, 0.12);
  },
  oceanAria: (c) => {
    opening(c, 'water');
    const [ax, ay] = enemyArea(c);
    magicCircle(c, ax, ay, 150, PAL.water[1], { dur: 1.4, el: 'water' });
    godRays(c, ax, ay - 120, '#c8f4ff', { size: 240, dur: 1.2 });
    for (const t of c.tg) { rising(c, t.x, t.y, 'note', '#9ee0ff', 8, { delay: 0.1, speed: 80, size: 12 }); rising(c, t.x, t.y, 'bubble', '#9ee0ff', 10, { delay: 0.15 }); }
    heal({ ...c, impact: 0.2 });
  },
  runeCircle: (c) => {
    opening(c, 'light');
    const [ax, ay] = enemyArea(c);
    flash(c, '#fff2c8', 0.4, 0.3);
    magicCircle(c, ax, ay, 180, '#ffe08a', { dur: 1.5, spin: 0.8, el: 'light' });
    magicCircle(c, ax, ay, 115, '#9fe8ff', { dur: 1.5, spin: -1.2, delay: 0.1, el: 'water' });
    c.fx.add({ dur: 1.2, delay: 0.1, make(node) { const s = sprite(ART.sigil_star || T.circleTex('#ffe08a'), ax, ay - 110); node.addChild(s); return { s }; },
      update(k, s) { const a = k < 0.2 ? k / 0.2 : 1 - Math.max(0, k - 0.6) / 0.4; s.s.scale.set((160 * ease.backOut(Math.min(1, k * 2))) / s.s.texture.width); s.s.alpha = a; s.s.rotation = k * 3; } });
    for (const t of c.tg) { rising(c, t.x, t.y, 'rune', '#ffe08a', 8, { delay: 0.2, speed: 100 }); beam(c, ax, ay - 110, t.x, t.cy, '#ffe08a', { delay: 0.5, width: 14, dur: 0.4 }); impact(c, t.x, t.cy, 'light', { power: 0.8, delay: 0.55 }); }
  },
  stoneFortress: (c) => {
    opening(c, 'earth');
    const [ax, ay] = [c.src.side ? W(c) * 0.75 : W(c) * 0.27, c.src.y];
    shake(c, 7, 0.45, 0.1);
    for (const t of c.tg) {
      c.fx.burst(t.x, t.y, 12, { kind: 'rock', color: '#5a5a66', speed: 220, size: 9, life: 0.6, ay: 600, angle: -Math.PI / 2, spread: 1.8, delay: 0.1, blend: 'normal' });
      c.fx.add({ dur: 1.0, delay: 0.1, layer: 'normal', make(node) { const g = new Graphics(); node.addChild(g); return { g }; },
        update(k, s) { const a = 1 - Math.max(0, k - 0.7) / 0.3; const hh = t.h * 0.55 * ease.backOut(Math.min(1, k * 3)); s.g.clear(); for (const o of [-1, 1]) s.g.rect(t.x + o * t.w * 0.55 - 8, t.y - hh, 16, hh).fill({ color: 0x6a6a76, alpha: a }).stroke({ width: 2, color: 0xe0a02a, alpha: a * 0.8 }); } });
    }
    shieldOn({ ...c, impact: 0.2 }, PAL.earth[0]);
    ring(c, ax, ay, '#e0a02a', 20, 220, 0.6, 0.1, 6);
  },
  chaosParty: (c) => {
    opening(c, 'dark');
    flash(c, '#ff8ad8', 0.4, 0.22);
    for (let h = 0; h < 3; h++) for (const t of c.tg) {
      const d = 0.18 + h * 0.16;
      burst(c, t.x + (R() - 0.5) * 30, t.cy + (R() - 0.5) * 30, ['fire', 'light', 'water'][h], { size: 60, delay: d, color: ['#ff4ab0', '#ffd02a', '#7ae0ff'][h] });
      glowBurst(c, t.x + (R() - 0.5) * 30, t.cy + (R() - 0.5) * 30, ['#ff4ab0', '#ffd02a', '#7ae0ff'][h], 14, 280, 9, d);
      rising(c, t.x, t.y, 'heart', '#ff8ad8', 3, { delay: d, speed: 90 });
    }
    for (let i = 0; i < 50; i++) c.fx.emit({ x: R() * W(c), y: -10, vx: (R() - 0.5) * 80, vy: 180 + R() * 120, kind: 'star', color: ['#ff4ab0', '#ffd02a', '#7ae0ff', '#b6ffd8'][i % 4], size: 7, life: 1.3, delay: R() * 0.7, vr: 6 });
    shake(c, 6, 0.5, 0.2);
  },
  healingRain: (c) => {
    opening(c, 'water');
    const w = W(c);
    for (let i = 0; i < 60; i++) c.fx.emit({ x: (c.src.side ? w * 0.5 : 0) + R() * w * 0.5, y: -10, vx: 0, vy: 280 + R() * 120, kind: 'spark', color: '#9ee0ff', size: 8, life: 0.9, stretch: 0.02, delay: R() * 0.7 });
    for (const t of c.tg) magicCircle(c, t.x, t.y, 44, PAL.heal[0], { dur: 1.0, delay: 0.15 });
    heal({ ...c, impact: 0.25 });
  },
  bloom: (c) => {
    opening(c, 'earth');
    for (const t of c.tg) { c.fx.burst(t.x, t.y - 10, 18, { kind: 'petal', color: ['#ff8ab0', '#ffd84a', '#ffffff'][Math.floor(R() * 3)], speed: 150, size: 7, life: 1.1, ay: 120, delay: 0.15, vr: 8 }); }
    heal({ ...c, impact: 0.2 }, '#7ad84a');
    const [ax, ay] = enemyArea(c);
    magicCircle(c, ax, ay, 140, '#7ad84a', { dur: 1.3, el: 'wind' });
    burst(c, ax, ay - 60, 'wind', { size: 150, delay: 0.1, dur: 1.1, color: '#ffb0c8', art: 'petals' });
  },
  holyLight: (c) => {
    opening(c, 'light');
    for (const t of c.tg) pillar(c, t.x, t.y, PAL.light[0], { delay: 0.05 + R() * 0.1, width: 26, dur: 0.85 });
    heal({ ...c, impact: 0.2 }, PAL.light[0]);
    godRays(c, W(c) * (c.src.side ? 0.75 : 0.25), -20, '#fff6c4', { size: 300, dur: 1.1 });
  },
  shadowStrike: (c) => {
    const t = c.tg[0];
    if (!t) return;
    c.view.dim(0.6, 0.8);
    smoke(c, c.src.x, c.src.cy, '#1a0a24', 14, 0);
    for (let i = 0; i < 7; i++) slashArc(c, t.x, t.cy, i % 2 ? PAL.dark[1] : '#ffffff', { angle: R() * 6.28, r: 52 + i * 7, width: 13, delay: 0.08 + i * 0.045, dur: 0.24 });
    impact(c, t.x, t.cy, 'dark', { power: 1.2, delay: 0.38 });
    c.view.punch?.(t.x, t.cy, 0.15, 0.45, 0.08);
  },
  fireCleave: (c) => {
    if (c.kind === 'ult' && c.src.side === 0) opening(c, 'fire');
    flash(c, '#ffb35c', 0.35, 0.2, 0.1);
    for (const t of c.tg) {
      slashArc(c, t.x, t.cy, PAL.fire[0], { angle: 0, r: 80, width: 26, sweep: 3.6, delay: 0.12, dur: 0.38 });
      c.fx.burst(t.x, t.cy, 18, { kind: 'flame', color: PAL.fire[0], speed: 220, size: 14, life: 0.6, ay: -250, delay: 0.16 });
      impact(c, t.x, t.cy, 'fire', { power: 0.8, delay: 0.16 });
    }
  },
  dragonBreath: (c) => {
    flash(c, P(c.el)[0], 0.45, 0.35);
    const [sx, sy] = [c.src.x + dirOf(c) * c.src.w * 0.3, c.src.cy - c.src.h * 0.1];
    for (let i = 0; i < 70; i++) {
      const t = c.tg[i % c.tg.length];
      if (!t) break;
      c.fx.emit({ x: sx, y: sy, vx: (t.x - sx) * (2 + R()), vy: (t.cy - sy) * (2 + R()) + (R() - 0.5) * 80, kind: c.el === 'water' ? 'snow' : 'flame', color: P(c.el)[0], size: 14 + R() * 12, size1: 38, life: 0.5, delay: 0.05 + i * 0.01, drag: 1 });
    }
    beam(c, sx, sy, sx + dirOf(c) * W(c) * 0.75, sy + 40, P(c.el)[1], { delay: 0.05, width: 50, dur: 0.75 });
    for (const t of c.tg) impact(c, t.x, t.cy, c.el === 'water' ? 'ice' : 'fire', { power: 0.9, delay: 0.45 });
    shake(c, 12, 0.7, 0.3);
  },
  bossSlam: (c) => {
    flash(c, '#ffffff', 0.5, 0.22, 0.25);
    for (const t of c.tg) { impact(c, t.x, t.cy, c.el === 'water' ? 'water' : 'earth', { power: 1.1, delay: 0.3 }); smoke(c, t.x, t.y, '#5a4a3a', 7, 0.3); }
    const [ax, ay] = enemyArea(c);
    ring(c, ax, ay, '#ffffff', 10, 320, 0.7, 0.3, 10);
    shake(c, 18, 0.55, 0.28);
    c.view.punch?.(ax, ay - 40, 0.12, 0.5, 0.28);
  },

  // ---------- hero ultimates that used to borrow skill recipes: full productions now
  arrowRain: (c) => {
    opening(c, 'wind');
    const [ax, ay] = enemyArea(c);
    magicCircle(c, ax, ay - 160, 120, PAL.wind[0], { dur: 1.3, el: 'wind', layer: 'top', flat: 0.3 });
    for (const t of c.tg) for (let i = 0; i < 9; i++) fallOn(c, t.x + (R() - 0.5) * 50, t.cy + (R() - 0.5) * 24, 'arrow', PAL.wind[1], { size: 17, delay: Math.max(0, 0.05 + i * 0.09), slant: 70 * dirOf(c), from: 240 });
    for (const t of c.tg) impact(c, t.x, t.cy, 'wind', { power: 0.8, delay: 0.85 });
    shake(c, 4, 0.9, 0.2);
  },
  musicStorm: (c) => {
    opening(c, 'wind');
    const [ax, ay] = enemyArea(c);
    for (const t of c.tg) for (let i = 0; i < 9; i++) projectile(c, c.src.x, c.src.cy, t.x + (R() - 0.5) * 34, t.cy + (R() - 0.5) * 34, { kind: 'note', color: ['#7ae0ff', '#ffd84a', '#ff8ac8'][i % 3], size: 14, dur: 0.45, arc: 50 + R() * 50, delay: i * 0.06 });
    for (let i = 0; i < 3; i++) ring(c, ax, ay - 40, ['#7ae0ff', '#ffd84a', '#ff8ac8'][i], 10, 220, 0.6, 0.4 + i * 0.12, 5, 0.6);
    for (const t of c.tg) impact(c, t.x, t.cy, 'wind', { power: 0.7, delay: 0.55, color: '#ffd84a' });
  },
  blizzardBolts: (c) => {
    opening(c, 'water');
    const [ax, ay] = enemyArea(c);
    c.view.dim(0.3, 1.0);
    for (const t of c.tg) for (let i = 0; i < 6; i++) fallOn(c, t.x + (R() - 0.5) * 40, t.cy + (R() - 0.5) * 20, 'shard', PAL.water[1], { size: 18, delay: i * 0.1, slant: 50 * dirOf(c), from: 260 });
    for (const t of c.tg) impact(c, t.x, t.cy, 'ice', { power: 0.9, delay: 0.65, color: '#e8fbff' });
    for (let i = 0; i < 40; i++) c.fx.emit({ x: R() * W(c), y: -10, vx: 60 * dirOf(c), vy: 160 + R() * 100, kind: 'snow', color: '#e8fbff', size: 5, life: 1.4, delay: R() * 0.6, vr: 3 });
    c.view.punch?.(ax, ay - 40, 0.1, 0.5, 0.6);
  },
  rollingStone: (c) => {
    opening(c, 'earth');
    const t = c.tg[0];
    if (!t) return;
    if (!c.actorMoves) projectile(c, c.src.x, c.src.y - 26, t.x, t.y - 26, { kind: 'rock', color: '#a8865a', size: 34, dur: 0.45, spin: true, trailKind: 'smoke' });
    else for (let i = 0; i < 12; i++) c.fx.emit({ x: c.src.x + (t.x - c.src.x) * (i / 12), y: t.y - 4, vx: (R() - 0.5) * 40, vy: -30 - R() * 40, kind: 'smoke', color: '#a8865a', size: 12, size1: 30, life: 0.6, a0: 0.5, a1: 0, blend: 'normal', delay: 0.1 + i * 0.03 });
    impact(c, t.x, t.y - 26, 'earth', { power: 1.3, delay: 0.45 });
    c.fx.burst(t.x, t.y, 20, { kind: 'rock', color: '#a8865a', speed: 300, size: 9, life: 0.8, ay: 760, angle: -Math.PI / 2, spread: 2.2, delay: 0.45, blend: 'normal' });
  },
  sparkBurst: (c) => {
    if (c.kind === 'ult' && c.src.side === 0) opening(c, 'fire');
    for (const t of c.tg) { sparks(c, t.x, t.cy, PAL.fire[1], 26, 520, 0.2); impact(c, t.x, t.cy, 'fire', { power: 0.9, delay: 0.2 }); }
    shake(c, 6, 0.3, 0.2);
  },
  windBarrage: (c) => {
    opening(c, 'wind');
    for (const t of c.tg) for (let i = 0; i < 7; i++) projectile(c, c.src.x, c.src.cy, t.x + (R() - 0.5) * 30, t.cy + (R() - 0.5) * 30, { kind: 'rock', color: PAL.wind[1], size: 9, dur: 0.25, delay: i * 0.07 });
    for (const t of c.tg) { tornado(c, t.x, t.y, PAL.wind[1], 0.3, 0.7); impact(c, t.x, t.cy, 'wind', { power: 0.8, delay: 0.55 }); }
  },
};

/** Plays the effect for a skill. Unknown names fall back by kind (projectile / slash / burst). */
export function playVfx(name, c) {
  const isBig = c.kind === 'ult' || c.kind === 'charge';
  const f = (isBig ? ULTS[name] : null) || RECIPES[name] || ULTS[name];
  if (f) {
    f(c);
    if (isBig && !ULTS[name]) {
      // a monster ultimate built from a skill recipe: add the cinematic package around it
      const [ax, ay] = enemyArea(c);
      magicCircle(c, c.src.x, c.src.y, c.src.h * 0.7, P(c.el)[0], { dur: 1.0, el: c.el });
      flash(c, P(c.el)[1], 0.35, 0.25);
      shake(c, 7, 0.35, 0.15);
      for (const t of c.tg) impact(c, t.x, t.cy, c.el, { power: 0.7, delay: c.impact });
      c.view.punch?.(ax, ay - 40, 0.08, 0.4, c.impact);
    }
    return;
  }
  if (c.src && c.tg.length) {
    if (c.melee) meleeSlash(c, P(c.el)[1]);
    else boltAttack(c, 'core', P(c.el)[0]);
  }
}

/** Slow-motion charge-up behind the cut-in (the field runs at 1/4 speed while it plays). */
export function ultCharge(c) {
  const col = P(c.el);
  magicCircle(c, c.src.x, c.src.y, c.src.h * 0.9, col[0], { dur: 0.45, el: c.el, spin: 2 });
  converge(c, c.src.x, c.src.cy, col[1], { n: 40, radius: c.src.h * 1.4, dur: 0.3 });
  c.fx.add({ dur: 0.45, make(node) { const g = sprite(T.glowTex(col[0], 0.1), c.src.x, c.src.cy); node.addChild(g); return { g }; },
    update(k, s) { s.g.scale.set((c.src.h * (1 + k * 1.4)) / 128); s.g.alpha = k < 0.7 ? k / 0.7 : 1 - (k - 0.7) / 0.3; } });
}
