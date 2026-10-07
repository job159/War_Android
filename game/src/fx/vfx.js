// Skill visual effects. playVfx(name, c) where c = {
//   fx (FX), view (BattleView: shake / flash / zoom / hitStop), src (unit view), tg (target views),
//   el (attacker element), kind ('normal'|'skill'|'ult'), impact (s until the first hit lands), hits }
// Unit view geometry: x (center), y (feet), h (height), cy (body center), side (0 left / 1 right).
import { ease, rgba, lightningPath, strokePath, sprite } from './particles.js';

export const PAL = {
  fire: ['#ff5a3c', '#ffb35c', '#fff2c0'], water: ['#3ca8ff', '#9ee0ff', '#e8fbff'], wind: ['#36d68a', '#b6ffd8', '#f0fff8'],
  earth: ['#d39a45', '#ffd99a', '#fff0d0'], light: ['#ffd84a', '#fff6c4', '#ffffff'], dark: ['#a45cff', '#dcb8ff', '#ffffff'],
  heal: ['#4ade80', '#bbf7d0', '#ffffff'], poison: ['#9ad83a', '#d8ff9a', '#ffffff'], blood: ['#ff3a5a', '#ff9aaa', '#ffffff'],
};
const R = Math.random;
const dirOf = (c) => (c.src && c.src.side === 1 ? -1 : 1);

// ------------------------------------------------------------------ primitives

export function glowBurst(c, x, y, color, n = 14, speed = 220, size = 9, delay = 0, life = 0.45, kind = 'glow') {
  c.fx.burst(x, y, n, { color, speed, size, size1: 1, life, drag: 3, delay, kind });
  c.fx.emit({ x, y, kind: 'core', color, size: size * 3.2, size1: size * 5, life: 0.28, delay, a0: 1, a1: 0 });
}

export function sparks(c, x, y, color, n = 10, speed = 420, delay = 0) {
  c.fx.burst(x, y, n, { kind: 'spark', color, speed, size: 6, size1: 2, life: 0.32, drag: 4, stretch: 0.045, delay });
}

export function ring(c, x, y, color, r0 = 6, r1 = 60, dur = 0.4, delay = 0, width = 5, flat = 0.45) {
  c.fx.shape({ dur, delay, draw(g, k) {
    const r = r0 + (r1 - r0) * ease.outCubic(k);
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = rgba(color, (1 - k) * 0.95);
    g.lineWidth = width * (1 - k * 0.6);
    g.beginPath(); g.ellipse(x, y, r, r * flat, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = rgba('#ffffff', (1 - k) * 0.6);
    g.lineWidth = width * 0.35;
    g.stroke();
  } });
}

export function slashArc(c, x, y, color, { angle = -0.6, r = 46, delay = 0, width = 14, dur = 0.26, flip = false, sweep = 2.4 } = {}) {
  c.fx.shape({ dur, delay, draw(g, k) {
    const a0 = angle - sweep / 2;
    const prog = ease.out(Math.min(1, k * 1.6));
    const fade = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
    const a1 = a0 + sweep * prog;
    g.globalCompositeOperation = 'lighter';
    g.translate(x, y);
    if (flip) g.scale(-1, 1);
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = i === 0 ? rgba(color, 0.35 * fade) : i === 1 ? rgba(color, 0.9 * fade) : rgba('#ffffff', fade);
      g.lineWidth = width * (i === 0 ? 2.2 : i === 1 ? 1 : 0.35);
      g.lineCap = 'round';
      g.beginPath(); g.arc(0, 0, r, Math.max(a0, a1 - 1.6), a1); g.stroke();
    }
  } });
  sparks(c, x, y, color, 6, 320, delay + 0.08);
}

/** Projectile flying src -> dst with a trail. o: { kind, color, size, dur, arc, spin, trail } */
export function projectile(c, x1, y1, x2, y2, o = {}) {
  const dur = o.dur ?? 0.3;
  const delay = o.delay || 0;
  const color = o.color || '#ffffff';
  const kind = o.kind || 'core';
  const size = o.size || 12;
  const arc = o.arc || 0;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  let last = 0;
  c.fx.shape({ dur, delay, draw(g, k) {
    const e = ease.in(k) * 0.4 + k * 0.6;
    const x = x1 + (x2 - x1) * e;
    const y = y1 + (y2 - y1) * e - arc * Math.sin(Math.PI * e);
    g.globalCompositeOperation = 'lighter';
    const img = sprite(kind, color);
    const s = size;
    g.translate(x, y);
    if (o.align !== false) g.rotate(kind === 'arrow' || kind === 'spark' || kind === 'shard' ? ang + (kind === 'shard' ? Math.PI / 2 : 0) : (o.spin ? k * 18 : 0));
    g.drawImage(img, -s, -s, s * 2, s * 2);
    g.globalCompositeOperation = 'lighter';
    const glow = sprite('glow', color);
    g.drawImage(glow, -s * 1.6, -s * 1.6, s * 3.2, s * 3.2);
    if (o.trail !== false && k - last > 0.02) {
      last = k;
      c.fx.emit({ x, y, kind: o.trailKind || 'glow', color, size: s * 0.8, size1: 1, life: 0.28, vx: (R() - 0.5) * 30, vy: (R() - 0.5) * 30 });
    }
  } });
}

export function pillar(c, x, yBottom, color, { delay = 0, width = 36, dur = 0.6, top = -40 } = {}) {
  c.fx.shape({ dur, delay, draw(g, k) {
    const w = width * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8 * 0.85);
    const a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(x - w, 0, x + w, 0);
    gr.addColorStop(0, rgba(color, 0)); gr.addColorStop(0.35, rgba(color, 0.7 * a)); gr.addColorStop(0.5, rgba('#ffffff', a)); gr.addColorStop(0.65, rgba(color, 0.7 * a)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(x - w, top, w * 2, yBottom - top);
  } });
  ring(c, x, yBottom, color, 6, width * 1.6, 0.5, delay + 0.05, 4);
}

export function beam(c, x1, y1, x2, y2, color, { delay = 0, width = 26, dur = 0.5 } = {}) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  c.fx.shape({ dur, delay, draw(g, k) {
    const grow = Math.min(1, k * 4);
    const a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    const w = width * (0.6 + 0.4 * Math.sin(k * 40) * 0.2 + 0.4) * a;
    g.translate(x1, y1); g.rotate(ang);
    g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(0, -w, 0, w);
    gr.addColorStop(0, rgba(color, 0)); gr.addColorStop(0.3, rgba(color, 0.8 * a)); gr.addColorStop(0.5, rgba('#ffffff', a)); gr.addColorStop(0.7, rgba(color, 0.8 * a)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(0, -w, len * grow, w * 2);
  } });
}

export function magicCircle(c, x, y, r, color, { delay = 0, dur = 1.0, flat = 0.42, spin = 1.5, layer = 'under' } = {}) {
  c.fx.shape({ dur, delay, layer, draw(g, k) {
    const a = k < 0.2 ? k / 0.2 : k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
    const rr = r * (0.6 + 0.4 * ease.backOut(Math.min(1, k * 2.5)));
    g.translate(x, y);
    g.scale(1, flat);
    g.rotate(k * spin * Math.PI * 2);
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = rgba(color, 0.9 * a);
    g.lineWidth = 3;
    g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(0, 0, rr * 0.78, 0, Math.PI * 2); g.stroke();
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2;
      const t2 = ((i + 2) / 6) * Math.PI * 2;
      g.moveTo(Math.cos(t) * rr * 0.78, Math.sin(t) * rr * 0.78);
      g.lineTo(Math.cos(t2) * rr * 0.78, Math.sin(t2) * rr * 0.78);
    }
    g.stroke();
    g.fillStyle = rgba(color, 0.9 * a);
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      g.fillRect(Math.cos(t) * rr * 0.89 - 2, Math.sin(t) * rr * 0.89 - 2, 4, 4);
    }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rr);
    gr.addColorStop(0, rgba(color, 0.35 * a)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.beginPath(); g.arc(0, 0, rr, 0, Math.PI * 2); g.fill();
  } });
}

export function lightning(c, x1, y1, x2, y2, color, { delay = 0, dur = 0.3, width = 4, segs = 9, amp = 22 } = {}) {
  let pts = lightningPath(x1, y1, x2, y2, segs, amp);
  let flick = 0;
  c.fx.shape({ dur, delay, draw(g, k) {
    if (++flick % 3 === 0) pts = lightningPath(x1, y1, x2, y2, segs, amp);
    const a = 1 - k;
    g.globalCompositeOperation = 'lighter';
    g.lineJoin = 'round';
    g.strokeStyle = rgba(color, 0.35 * a); g.lineWidth = width * 4; strokePath(g, pts);
    g.strokeStyle = rgba(color, 0.9 * a); g.lineWidth = width; strokePath(g, pts);
    g.strokeStyle = rgba('#ffffff', a); g.lineWidth = width * 0.4; strokePath(g, pts);
  } });
}

export function rising(c, x, y, kind, color, n = 12, { delay = 0, spread = 40, speed = 90, size = 7, life = 0.9 } = {}) {
  for (let i = 0; i < n; i++) {
    c.fx.emit({ x: x + (R() - 0.5) * spread, y: y - R() * 20, vx: (R() - 0.5) * 20, vy: -speed * (0.5 + R() * 0.8), kind, color, size: size * (0.6 + R() * 0.8), size1: size * 0.2, life: life * (0.6 + R() * 0.6), delay: delay + R() * 0.25, drag: 0.6 });
  }
}

/** Things falling from the sky onto points (meteors, arrows, ice...). */
export function fallOn(c, x, y, kind, color, { delay = 0, dur = 0.32, size = 16, from = 160, slant = 60, trail = true } = {}) {
  projectile(c, x - slant, y - from, x, y, { kind, color, size, dur, delay, trail, trailKind: kind === 'flame' ? 'flame' : 'glow' });
}

export function smoke(c, x, y, color, n = 8, delay = 0) {
  for (let i = 0; i < n; i++) c.fx.emit({ x: x + (R() - 0.5) * 30, y: y + (R() - 0.5) * 16, vx: (R() - 0.5) * 50, vy: -20 - R() * 40, kind: 'smoke', color, size: 14 + R() * 10, size1: 30, life: 0.7 + R() * 0.4, a0: 0.7, a1: 0, blend: 'source-over', delay });
}

function hitPoint(t) { return [t.x + (R() - 0.5) * t.h * 0.2, t.cy + (R() - 0.5) * t.h * 0.25]; }
function muzzle(c) { return [c.src.x + dirOf(c) * c.src.h * 0.18, c.src.cy - c.src.h * 0.05]; }
const shake = (c, a, d = 0.25, delay = 0) => c.view.shake(a, d, delay);
const flash = (c, color, a = 0.5, d = 0.25, delay = 0) => c.view.flash(color, a, d, delay);

// ------------------------------------------------------------------ composite recipes

function boltAttack(c, kind, color, { size = 11, dur, arc = 0, burst = true, n = 1 } = {}) {
  const [sx, sy] = muzzle(c);
  const d = dur ?? Math.max(0.12, c.impact - 0.12);
  for (const t of c.tg) {
    for (let i = 0; i < n; i++) {
      const [hx, hy] = hitPoint(t);
      projectile(c, sx, sy, hx, hy, { kind, color, size, dur: d, arc, delay: c.impact - d + i * 0.13 });
      if (burst) glowBurst(c, hx, hy, color, 10, 180, 7, c.impact + i * 0.13);
    }
  }
}

function meleeSlash(c, color, { n = 1, width = 12, r = 44, spacing = 0.13 } = {}) {
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
    rising(c, t.x, t.y, 'glow', color, 10, { delay: c.impact - 0.05 });
    rising(c, t.x, t.y, 'star', '#ffffff', 4, { delay: c.impact, size: 6 });
    ring(c, t.x, t.y, color, 6, 40, 0.5, c.impact - 0.05, 3);
  }
}

function buff(c, color) {
  for (const t of c.tg) {
    rising(c, t.x, t.y, 'spark', color, 8, { delay: c.impact - 0.05, speed: 160, size: 7, life: 0.6 });
    ring(c, t.x, t.y, color, 50, 6, 0.5, c.impact - 0.1, 3);
  }
}

function shieldOn(c, color) {
  for (const t of c.tg) {
    c.fx.shape({ dur: 0.7, delay: c.impact, draw(g, k) {
      const a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = rgba(color, 0.9 * a);
      g.lineWidth = 3;
      const r = t.h * 0.42 * ease.backOut(Math.min(1, k * 3));
      g.beginPath(); g.arc(t.x, t.cy, r, 0, Math.PI * 2); g.stroke();
      g.fillStyle = rgba(color, 0.15 * a); g.fill();
    } });
  }
}

const P = (el) => PAL[el] || PAL.light;

const RECIPES = {
  // ---------- basic projectiles
  holyBolt: (c) => boltAttack(c, 'star', PAL.light[0], { size: 10 }),
  holyFlame: (c) => boltAttack(c, 'flame', '#ffb04a', { size: 12 }),
  fireball: (c) => boltAttack(c, 'flame', PAL.fire[0], { size: 13, arc: 18 }),
  fireballBig: (c) => { boltAttack(c, 'flame', PAL.fire[0], { size: 20, arc: 30 }); for (const t of c.tg) { smoke(c, t.x, t.cy, '#5a3a2a', 6, c.impact); shake(c, 4, 0.2, c.impact); } },
  iceShard: (c) => boltAttack(c, 'shard', PAL.water[1], { size: 12 }),
  iceBolt: (c) => boltAttack(c, 'shard', PAL.water[1], { size: 11 }),
  iceBoltBig: (c) => { boltAttack(c, 'shard', PAL.water[1], { size: 18 }); for (const t of c.tg) sparks(c, t.x, t.cy, '#e8fbff', 12, 380, c.impact); },
  darkArrow: (c) => boltAttack(c, 'arrow', PAL.dark[0], { size: 16 }),
  arrow: (c) => boltAttack(c, 'arrow', '#e8d8a8', { size: 16, arc: 10 }),
  darkBolt: (c) => boltAttack(c, 'core', PAL.dark[0], { size: 12 }),
  darkSpark: (c) => boltAttack(c, 'star', '#ff4ab0', { size: 10 }),
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

  // ---------- melee
  slash: (c) => meleeSlash(c, P(c.el)[1]),
  doubleSlash: (c) => meleeSlash(c, PAL.wind[1], { n: 2, spacing: 0.13 }),
  tripleSlash: (c) => { meleeSlash(c, PAL.wind[0], { n: 3, width: 14, spacing: 0.12 }); for (const t of c.tg) ring(c, t.x, t.y, PAL.wind[0], 10, 60, 0.4, c.impact + 0.2); },
  daggerSlash: (c) => meleeSlash(c, '#c8b8ff', { n: 2, width: 8, r: 34 }),
  claw: (c) => { for (const t of c.tg) for (let i = 0; i < 3; i++) slashArc(c, t.x + (i - 1) * 8, t.cy, '#ff8a8a', { angle: -1.2, r: 30, sweep: 1.4, width: 5, delay: c.impact - 0.05 + i * 0.03 }); },
  bite: (c) => { for (const t of c.tg) { slashArc(c, t.x, t.cy - 10, '#ffffff', { angle: Math.PI / 2, r: 26, sweep: 2, width: 7, delay: c.impact - 0.05 }); slashArc(c, t.x, t.cy + 10, '#ffffff', { angle: -Math.PI / 2, r: 26, sweep: 2, width: 7, delay: c.impact - 0.05 }); glowBurst(c, t.x, t.cy, PAL.blood[0], 10, 200, 7, c.impact); } },
  bump: (c) => { for (const t of c.tg) { glowBurst(c, t.x, t.cy, P(c.el)[1], 10, 160, 8, c.impact); ring(c, t.x, t.cy, '#ffffff', 4, 26, 0.25, c.impact, 4, 1); } },
  lanceThrust: (c) => { for (const t of c.tg) { beam(c, t.x - dirOf(c) * 50, t.cy, t.x + dirOf(c) * 30, t.cy, PAL.light[0], { delay: c.impact - 0.05, width: 7, dur: 0.22 }); sparks(c, t.x, t.cy, '#ffffff', 10, 380, c.impact); } },
  tridentThrust: (c) => { for (const t of c.tg) { for (const o of [-10, 0, 10]) beam(c, t.x - dirOf(c) * 50, t.cy + o, t.x + dirOf(c) * 24, t.cy + o, PAL.water[0], { delay: c.impact - 0.05, width: 4, dur: 0.22 }); rising(c, t.x, t.cy + 20, 'bubble', PAL.water[1], 6, { delay: c.impact }); } },
  hammerSmash: (c) => { for (const t of c.tg) { glowBurst(c, t.x, t.cy, PAL.earth[1], 16, 240, 10, c.impact); ring(c, t.x, t.y, PAL.earth[0], 8, 70, 0.45, c.impact, 6); smoke(c, t.x, t.y, '#8a6a4a', 6, c.impact); shake(c, 6, 0.22, c.impact); } },
  maceStrike: (c) => { for (const t of c.tg) { glowBurst(c, t.x, t.cy, '#ffe0a0', 12, 200, 9, c.impact); shake(c, 3, 0.15, c.impact); } },
  axeChop: (c) => { meleeSlash(c, '#ffb04a', { width: 16, r: 50 }); for (const t of c.tg) shake(c, 4, 0.15, c.impact); },
  shieldBash: (c) => { for (const t of c.tg) { glowBurst(c, t.x, t.cy, PAL.light[0], 18, 280, 10, c.impact); ring(c, t.x, t.cy, '#ffffff', 6, 46, 0.3, c.impact, 6, 1); rising(c, t.x, t.y - t.h, 'star', '#fff6c4', 5, { delay: c.impact + 0.1, speed: 40 }); shake(c, 5, 0.2, c.impact); } },
  fireSlash: (c) => { meleeSlash(c, PAL.fire[0], { width: 16 }); for (const t of c.tg) c.fx.burst(t.x, t.cy, 12, { kind: 'flame', color: PAL.fire[0], speed: 140, size: 12, life: 0.5, delay: c.impact, ay: -200 }); },
  darkSlash: (c) => { meleeSlash(c, PAL.dark[0], { width: 18, r: 56 }); },
  rockBreaker: (c) => { for (const t of c.tg) { c.fx.burst(t.x, t.y, 12, { kind: 'rock', color: '#a8865a', speed: 260, size: 9, life: 0.7, ay: 700, delay: c.impact, angle: -Math.PI / 2, spread: 2 }); glowBurst(c, t.x, t.cy, PAL.earth[1], 14, 240, 10, c.impact); shake(c, 7, 0.25, c.impact); } },
  shadowStep: (c) => { for (const t of c.tg) { smoke(c, t.x, t.cy, '#2a1a3a', 10, c.impact - 0.15); meleeSlash(c, PAL.dark[1], { n: 2, width: 10 }); } },
  tentacle: (c) => { for (const t of c.tg) { c.fx.shape({ dur: 0.5, delay: c.impact - 0.15, draw(g, k) { g.strokeStyle = rgba('#8a3aa8', 1 - k); g.lineWidth = 12 * (1 - k * 0.5); g.lineCap = 'round'; g.beginPath(); g.moveTo(t.x, t.y + 20); g.quadraticCurveTo(t.x + 30 * Math.sin(k * 8), t.y - 40, t.x, t.cy - 30 * ease.out(k)); g.stroke(); } }); glowBurst(c, t.x, t.cy, '#c87aff', 10, 180, 8, c.impact); } },

  // ---------- heals / buffs / shields
  healSingle: (c) => heal(c),
  leafHeal: (c) => { heal(c, '#7ad84a'); for (const t of c.tg) rising(c, t.x, t.y, 'leaf', '#7ad84a', 4, { delay: c.impact }); },
  buffAll: (c) => buff(c, '#ffb04a'),
  energyAll: (c) => { buff(c, '#7ae0ff'); for (const t of c.tg) rising(c, t.x, t.y, 'rune', '#9fe8ff', 3, { delay: c.impact, speed: 70 }); },
  waterShield: (c) => { shieldOn(c, PAL.water[0]); for (const t of c.tg) rising(c, t.x, t.y, 'bubble', PAL.water[1], 8, { delay: c.impact }); },
  stoneWall: (c) => { shieldOn(c, PAL.earth[0]); for (const t of c.tg) c.fx.burst(t.x, t.y, 8, { kind: 'rock', color: '#9a8a7a', speed: 120, size: 7, life: 0.5, ay: 500, angle: -Math.PI / 2, spread: 1.6, delay: c.impact }); },
  howl: (c) => { ring(c, c.src.x, c.src.cy, '#ffaaaa', 10, 80, 0.5, c.impact - 0.25, 4, 1); ring(c, c.src.x, c.src.cy, '#ffaaaa', 10, 110, 0.6, c.impact - 0.15, 3, 1); meleeSlash(c, '#ff6a6a', { n: 2 }); },
  drain: (c) => { boltAttack(c, 'glow', PAL.blood[0], { size: 10 }); const [sx, sy] = [c.src.x, c.src.cy]; for (const t of c.tg) projectile(c, t.x, t.cy, sx, sy, { kind: 'glow', color: PAL.blood[1], size: 8, dur: 0.35, delay: c.impact + 0.05 }); },

  // ---------- AoE skills
  flameBurst: (c) => { for (const t of c.tg) { c.fx.burst(t.x, t.cy, 14, { kind: 'flame', color: PAL.fire[0], speed: 180, size: 14, life: 0.55, ay: -260, delay: c.impact + R() * 0.08 }); glowBurst(c, t.x, t.cy, PAL.fire[1], 10, 220, 9, c.impact); } shake(c, 4, 0.2, c.impact); },
  poisonCloud: (c) => { for (const t of c.tg) { smoke(c, t.x, t.cy, '#7ab83a', 9, c.impact - 0.1); rising(c, t.x, t.y, 'glow', PAL.poison[0], 6, { delay: c.impact }); } },
  splash: (c) => { for (const t of c.tg) { c.fx.burst(t.x, t.cy, 16, { kind: 'bubble', color: P(c.el)[1], speed: 220, size: 7, life: 0.5, ay: 500, delay: c.impact }); } },
  screech: (c) => { for (let i = 0; i < 3; i++) ring(c, c.src.x, c.src.cy, '#ff9aaa', 10, 260, 0.6, c.impact - 0.3 + i * 0.1, 4, 1); },
  mischief: (c) => { for (const t of c.tg) { rising(c, t.x, t.y, 'heart', '#ff4ab0', 4, { delay: c.impact, speed: 60 }); glowBurst(c, t.x, t.cy, '#ff4ab0', 8, 160, 7, c.impact); } },
  featherStorm: (c) => boltAttack(c, 'feather', '#e8f0ff', { size: 12 }),
  roots: (c) => { for (const t of c.tg) { c.fx.shape({ dur: 0.8, delay: c.impact - 0.2, draw(g, k) { g.strokeStyle = rgba('#5a8a2a', 1 - Math.max(0, k - 0.6) / 0.4); g.lineWidth = 6; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(t.x + (i - 1) * 16, t.y + 4); g.quadraticCurveTo(t.x + (i - 1) * 30, t.y - 30 * ease.out(Math.min(1, k * 3)), t.x + (i - 1) * 6, t.cy - 10 * ease.out(Math.min(1, k * 3))); g.stroke(); } } }); } },
  petrify: (c) => { for (const t of c.tg) { beam(c, c.src.x, c.src.cy - c.src.h * 0.2, t.x, t.cy, '#c8b88a', { delay: c.impact - 0.2, width: 8, dur: 0.4 }); smoke(c, t.x, t.cy, '#9a9a8a', 8, c.impact); } },
  blizzard: (c) => { for (const t of c.tg) for (let i = 0; i < 4; i++) fallOn(c, t.x + (R() - 0.5) * 40, t.cy + (R() - 0.5) * 30, 'snow', PAL.water[1], { size: 9, delay: c.impact - 0.3 + i * 0.07, slant: 40 }); },
  flameBreath: (c) => { const [sx, sy] = muzzle(c); for (let i = 0; i < 26; i++) { const t = c.tg[i % c.tg.length]; c.fx.emit({ x: sx, y: sy, vx: (t.x - sx) * (2 + R()), vy: (t.cy - sy) * (2 + R()) + (R() - 0.5) * 60, kind: 'flame', color: PAL.fire[0], size: 10 + R() * 8, size1: 26, life: 0.45, delay: c.impact - 0.4 + i * 0.012, drag: 1 }); } aoeBlast(c, PAL.fire[1]); },
  boneStorm: (c) => { for (const t of c.tg) for (let i = 0; i < 3; i++) fallOn(c, t.x + (R() - 0.5) * 30, t.cy, 'bone', '#f0ead8', { size: 11, delay: c.impact - 0.3 + i * 0.1, slant: 80 * dirOf(c) }); },
  cyclone: (c) => { for (const t of c.tg) tornado(c, t.x, t.y, PAL.wind[1], c.impact - 0.25, 0.9); },
  slimeRain: (c) => { for (const t of c.tg) for (let i = 0; i < 3; i++) fallOn(c, t.x + (R() - 0.5) * 36, t.cy, 'bubble', P(c.el)[1], { size: 12, delay: c.impact - 0.3 + i * 0.09, slant: 20 }); },
  arrowRain: (c) => { for (const t of c.tg) for (let i = 0; i < 5; i++) fallOn(c, t.x + (R() - 0.5) * 40, t.cy + (R() - 0.5) * 20, 'arrow', PAL.wind[1], { size: 15, delay: c.impact - 0.2 + i * 0.16, slant: 60 * dirOf(c), from: 200 }); shake(c, 3, 0.8, c.impact); },
  musicStorm: (c) => { for (const t of c.tg) { for (let i = 0; i < 6; i++) projectile(c, c.src.x, c.src.cy, t.x + (R() - 0.5) * 30, t.cy + (R() - 0.5) * 30, { kind: 'note', color: ['#7ae0ff', '#ffd84a', '#ff8ac8'][i % 3], size: 12, dur: 0.4, arc: 40 + R() * 40, delay: c.impact - 0.4 + i * 0.05 }); } },
  sparkBurst: (c) => { for (const t of c.tg) { sparks(c, t.x, t.cy, PAL.fire[1], 16, 420, c.impact); glowBurst(c, t.x, t.cy, PAL.fire[0], 14, 260, 10, c.impact); } shake(c, 5, 0.25, c.impact); },
  rollingStone: (c) => { const t = c.tg[0]; if (!t) return; projectile(c, c.src.x, c.src.y - 18, t.x, t.y - 18, { kind: 'rock', color: '#a8865a', size: 22, dur: Math.max(0.2, c.impact), spin: true }); c.fx.burst(t.x, t.y, 14, { kind: 'rock', color: '#a8865a', speed: 260, size: 8, life: 0.7, ay: 700, angle: -Math.PI / 2, spread: 2.2, delay: c.impact }); shake(c, 8, 0.3, c.impact); },
  windBarrage: (c) => boltAttack(c, 'rock', PAL.wind[1], { size: 8 }),
  blizzardBolts: (c) => boltAttack(c, 'shard', PAL.water[1], { size: 16 }),
  quick: (c) => boltAttack(c, 'glow', '#ffffff', { size: 8 }),
};

function tornado(c, x, y, color, delay, dur) {
  c.fx.shape({ dur, delay, draw(g, k) {
    const a = k < 0.15 ? k / 0.15 : 1 - Math.max(0, k - 0.6) / 0.4;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const yy = y - i * 16;
      const rr = 12 + i * 7;
      g.strokeStyle = rgba(color, 0.6 * a);
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(x + Math.sin(k * 20 + i) * 6, yy, rr, rr * 0.3, 0, k * 30 + i, k * 30 + i + 4.4);
      g.stroke();
    }
  } });
  for (let i = 0; i < 10; i++) c.fx.emit({ x: x + (R() - 0.5) * 40, y: y - R() * 90, vx: (R() - 0.5) * 120, vy: -60 - R() * 80, kind: 'leaf', color: '#b6ffd8', size: 6, life: 0.7, delay: delay + R() * dur * 0.6, vr: 10 });
}

// ------------------------------------------------------------------ ultimates (big, screen-wide)

function enemyArea(c) {
  // center of the target group
  if (!c.tg.length) return [c.src.x + dirOf(c) * 120, c.src.y];
  const x = c.tg.reduce((a, t) => a + t.x, 0) / c.tg.length;
  const y = c.tg.reduce((a, t) => a + t.y, 0) / c.tg.length;
  return [x, y];
}

const ULTS = {
  sanctuary: (c) => {
    const col = PAL.light[0];
    flash(c, '#fff6c4', 0.55, 0.4);
    for (const t of c.tg) { pillar(c, t.x, t.y, col, { delay: 0.05 + R() * 0.15, width: 30, dur: 0.9 }); rising(c, t.x, t.y, 'star', '#ffffff', 10, { delay: 0.2, speed: 120 }); rising(c, t.x, t.y, 'feather', '#ffffff', 4, { delay: 0.25, speed: 50, size: 9, life: 1.4 }); }
    const [ax, ay] = enemyArea(c); magicCircle(c, ax, ay, 140, col, { dur: 1.3 });
  },
  goldenDome: (c) => {
    const [ax, ay] = enemyArea(c);
    flash(c, '#ffe9a0', 0.45, 0.35);
    c.fx.shape({ dur: 1.2, delay: 0.05, draw(g, k) {
      const a = k < 0.2 ? k / 0.2 : 1 - Math.max(0, k - 0.5) / 0.5;
      const r = 150 * ease.backOut(Math.min(1, k * 2.5));
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(ax, ay, r * 0.2, ax, ay, r);
      gr.addColorStop(0, rgba('#ffd84a', 0)); gr.addColorStop(0.85, rgba('#ffd84a', 0.25 * a)); gr.addColorStop(1, rgba('#fff6c4', 0.8 * a));
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(ax, ay, r, r * 0.85, 0, Math.PI, 0); g.fill();
      g.strokeStyle = rgba('#ffffff', 0.8 * a); g.lineWidth = 3; g.stroke();
      for (let i = 1; i < 5; i++) { g.beginPath(); g.ellipse(ax, ay, r * i / 5, r * 0.85, 0, Math.PI, 0); g.strokeStyle = rgba('#ffd84a', 0.35 * a); g.lineWidth = 1.5; g.stroke(); }
    } });
    shieldOn(c, PAL.light[0]);
    rising(c, ax, ay, 'star', '#fff6c4', 18, { spread: 220, delay: 0.2, speed: 100 });
  },
  meteorRain: (c) => {
    flash(c, '#ff5a3c', 0.35, 0.3);
    const [ax, ay] = enemyArea(c);
    magicCircle(c, ax, ay, 150, PAL.fire[0], { dur: 1.4 });
    for (let h = 0; h < Math.max(4, c.hits); h++) {
      for (const t of c.tg) {
        const d = 0.18 + h * 0.16 - 0.3;
        fallOn(c, t.x + (R() - 0.5) * 30, t.cy + (R() - 0.5) * 20, 'flame', PAL.fire[0], { size: 22, delay: Math.max(0, d), dur: 0.3, from: 260, slant: 120 * dirOf(c) });
        glowBurst(c, t.x, t.cy, PAL.fire[1], 14, 300, 11, Math.max(0, d + 0.3));
        if (h % 2 === 0) smoke(c, t.x, t.y, '#5a2a1a', 4, d + 0.32);
      }
      shake(c, 8, 0.18, Math.max(0, 0.18 + h * 0.16));
    }
  },
  seraphHymn: (c) => {
    flash(c, '#ffd08a', 0.5, 0.4);
    const [sx, sy] = [c.src.x, c.src.cy];
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + (i - 2.5) * 0.35;
      beam(c, sx, sy, sx + Math.cos(ang) * 400, sy + Math.sin(ang) * 400, '#ffb04a', { delay: 0.02 * i, width: 16, dur: 0.6 });
    }
    for (const t of c.tg) { glowBurst(c, t.x, t.cy, '#ffb04a', 14, 260, 10, 0.2); c.fx.burst(t.x, t.cy, 8, { kind: 'flame', color: PAL.fire[0], speed: 160, size: 12, life: 0.6, ay: -200, delay: 0.2 }); }
    rising(c, sx, c.src.y, 'feather', '#fff0d0', 16, { spread: 160, speed: 40, life: 1.5, delay: 0.1 });
  },
  galeBlades: (c) => {
    flash(c, '#b6ffd8', 0.3, 0.2);
    for (let h = 0; h < c.hits; h++) {
      const t = c.tg[h % c.tg.length];
      if (!t) break;
      const d = 0.18 + h * 0.16;
      slashArc(c, t.x, t.cy, PAL.wind[0], { angle: R() * 6.28, r: 60, width: 18, delay: Math.max(0, d - 0.05), sweep: 2.8 });
      beam(c, t.x - 90, t.cy + (R() - 0.5) * 60, t.x + 90, t.cy + (R() - 0.5) * 60, '#e8fff4', { delay: Math.max(0, d - 0.04), width: 4, dur: 0.18 });
      shake(c, 4, 0.1, d);
    }
    for (let i = 0; i < 30; i++) c.fx.emit({ x: R() * c.view.w, y: c.view.h * (0.3 + R() * 0.6), vx: 900 * dirOf(c), vy: (R() - 0.5) * 40, kind: 'spark', color: PAL.wind[1], size: 10, life: 0.35, stretch: 0.03, delay: R() * 1.0 });
  },
  absoluteZero: (c) => {
    const [ax, ay] = enemyArea(c);
    flash(c, '#e8fbff', 0.7, 0.5);
    magicCircle(c, ax, ay, 160, PAL.water[1], { dur: 1.3, spin: -1 });
    c.fx.shape({ dur: 1.0, delay: 0.0, draw(g, k) {
      const grow = ease.backOut(Math.min(1, k * 2.2));
      const a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      g.globalCompositeOperation = 'lighter';
      for (let i = -2; i <= 2; i++) {
        const hgt = (120 - Math.abs(i) * 25) * grow;
        const x = ax + i * 34;
        const gr = g.createLinearGradient(x, ay - hgt, x, ay);
        gr.addColorStop(0, rgba('#ffffff', 0.95 * a)); gr.addColorStop(1, rgba('#7fd4ff', 0.4 * a));
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(x, ay - hgt); g.lineTo(x + 16, ay - hgt * 0.35); g.lineTo(x, ay); g.lineTo(x - 16, ay - hgt * 0.35); g.closePath(); g.fill();
      }
    } });
    for (const t of c.tg) { c.fx.burst(t.x, t.cy, 18, { kind: 'shard', color: PAL.water[1], speed: 380, size: 9, life: 0.8, ay: 400, delay: 0.85 }); sparks(c, t.x, t.cy, '#ffffff', 14, 500, 0.85); }
    shake(c, 10, 0.35, 0.85);
    for (let i = 0; i < 40; i++) c.fx.emit({ x: R() * c.view.w, y: -10, vx: (R() - 0.5) * 40, vy: 120 + R() * 120, kind: 'snow', color: '#e8fbff', size: 5, life: 1.6, delay: R() * 0.8, vr: 3 });
  },
  tectonic: (c) => {
    flash(c, '#ffd99a', 0.4, 0.25, 0.15);
    const [ax, ay] = enemyArea(c);
    shake(c, 14, 0.6, 0.15);
    for (const t of c.tg) {
      c.fx.shape({ dur: 0.9, delay: 0.15, draw(g, k) {
        const a = 1 - Math.max(0, k - 0.6) / 0.4;
        const hgt = 70 * ease.backOut(Math.min(1, k * 3));
        g.fillStyle = rgba('#8a6a3a', a);
        g.strokeStyle = rgba('#3a2a14', a);
        g.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
          const x = t.x + i * 18;
          g.beginPath(); g.moveTo(x - 12, t.y + 6); g.lineTo(x + i * 4, t.y - hgt * (1 - Math.abs(i) * 0.3)); g.lineTo(x + 12, t.y + 6); g.closePath(); g.fill(); g.stroke();
        }
      } });
      c.fx.burst(t.x, t.y, 14, { kind: 'rock', color: '#a8865a', speed: 340, size: 9, life: 0.9, ay: 800, angle: -Math.PI / 2, spread: 2, delay: 0.18 });
      smoke(c, t.x, t.y, '#7a5a3a', 8, 0.2);
    }
    ring(c, ax, ay, PAL.earth[1], 10, 260, 0.7, 0.15, 8);
  },
  eclipse: (c) => {
    c.view.dim(0.75, 1.2);
    const t = c.tg[0];
    if (!t) return;
    c.fx.shape({ dur: 1.1, delay: 0, draw(g, k) {
      const a = k < 0.2 ? k / 0.2 : 1 - Math.max(0, k - 0.6) / 0.4;
      const x = t.x, y = t.cy - 70;
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(x, y, 20, x, y, 90);
      gr.addColorStop(0, rgba('#e0c8ff', 0.9 * a)); gr.addColorStop(1, rgba('#a45cff', 0));
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 90, 0, Math.PI * 2); g.fill();
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = rgba('#0a0414', a);
      g.beginPath(); g.arc(x + 14 - k * 10, y - 6, 34, 0, Math.PI * 2); g.fill();
    } });
    slashArc(c, t.x, t.cy, '#e0c8ff', { angle: -0.8, r: 90, width: 26, delay: 0.12, dur: 0.35, sweep: 3 });
    slashArc(c, t.x, t.cy, PAL.dark[0], { angle: 2.2, r: 70, width: 16, delay: 0.2, dur: 0.3, sweep: 2.6 });
    glowBurst(c, t.x, t.cy, PAL.dark[1], 24, 360, 12, 0.18);
    flash(c, '#dcb8ff', 0.6, 0.2, 0.17);
    shake(c, 10, 0.3, 0.18);
  },
  blackHole: (c) => {
    const [ax, ay0] = enemyArea(c);
    const ay = ay0 - 50;
    c.view.dim(0.55, 1.3);
    c.fx.shape({ dur: 1.3, delay: 0, draw(g, k) {
      const grow = ease.backOut(Math.min(1, k * 2));
      const a = 1 - Math.max(0, k - 0.75) / 0.25;
      const r = 54 * grow;
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(ax, ay, r * 0.6, ax, ay, r * 2.2);
      gr.addColorStop(0, rgba('#b05cff', 0.9 * a)); gr.addColorStop(1, rgba('#5a1aa8', 0));
      g.fillStyle = gr; g.beginPath(); g.arc(ax, ay, r * 2.2, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 3; i++) {
        g.strokeStyle = rgba('#e0c8ff', 0.6 * a); g.lineWidth = 2;
        g.beginPath(); g.ellipse(ax, ay, r * (1.3 + i * 0.35), r * (0.45 + i * 0.12), k * 6 + i, 0, Math.PI * 1.6); g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = rgba('#000000', a); g.beginPath(); g.arc(ax, ay, r, 0, Math.PI * 2); g.fill();
    } });
    for (let i = 0; i < 50; i++) {
      const ang = R() * 6.28, d = 140 + R() * 90;
      const x = ax + Math.cos(ang) * d, y = ay + Math.sin(ang) * d * 0.6;
      c.fx.emit({ x, y, vx: (ax - x) * 1.6, vy: (ay - y) * 1.6, kind: 'spark', color: '#c87aff', size: 8, life: 0.6, stretch: 0.04, delay: R() * 0.7 });
    }
    for (const t of c.tg) glowBurst(c, t.x, t.cy, PAL.dark[0], 16, 300, 11, 0.2);
    shake(c, 9, 0.9, 0.15);
  },
  tidalWave: (c) => {
    const dir = dirOf(c);
    const W = c.view.w;
    flash(c, '#9ee0ff', 0.35, 0.3);
    c.fx.shape({ dur: 1.0, delay: 0, draw(g, k) {
      const x = dir > 0 ? -100 + (W + 200) * ease.inOut(k) : W + 100 - (W + 200) * ease.inOut(k);
      const H = c.view.h;
      const a = 1 - Math.max(0, k - 0.8) / 0.2;
      g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(x - dir * 160, 0, x, 0);
      gr.addColorStop(0, rgba('#3ca8ff', 0)); gr.addColorStop(0.7, rgba('#3ca8ff', 0.55 * a)); gr.addColorStop(1, rgba('#e8fbff', 0.9 * a));
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(x - dir * 200, H);
      g.lineTo(x - dir * 200, H * 0.35);
      g.quadraticCurveTo(x - dir * 40, H * 0.12, x, H * 0.4);
      g.lineTo(x + dir * 20, H);
      g.closePath(); g.fill();
      if (Math.random() < 0.8) c.fx.emit({ x, y: H * (0.3 + Math.random() * 0.6), vx: dir * 200, vy: -100 - Math.random() * 150, ay: 500, kind: 'bubble', color: '#9ee0ff', size: 6, life: 0.6 });
    } });
    for (const t of c.tg) glowBurst(c, t.x, t.cy, PAL.water[1], 12, 260, 9, 0.25);
    shake(c, 6, 0.6, 0.15);
  },
  phoenixSlash: (c) => {
    const t = c.tg[0];
    if (!t) return;
    flash(c, '#ffb35c', 0.5, 0.25, 0.1);
    beam(c, c.src.x, t.cy, t.x + dirOf(c) * 120, t.cy, PAL.fire[0], { delay: 0.08, width: 30, dur: 0.4 });
    slashArc(c, t.x, t.cy, PAL.fire[1], { angle: -0.4, r: 80, width: 26, delay: 0.14, sweep: 3, dur: 0.4 });
    c.fx.burst(t.x, t.cy, 30, { kind: 'flame', color: PAL.fire[0], speed: 300, size: 16, life: 0.7, ay: -300, delay: 0.18 });
    rising(c, t.x, t.y, 'feather', '#ffb35c', 12, { spread: 80, speed: 120, delay: 0.2 });
    shake(c, 9, 0.3, 0.18);
  },
  oceanAria: (c) => {
    const [ax, ay] = enemyArea(c);
    magicCircle(c, ax, ay, 130, PAL.water[1], { dur: 1.3 });
    for (const t of c.tg) { rising(c, t.x, t.y, 'note', '#9ee0ff', 6, { delay: 0.1, speed: 70, size: 11 }); rising(c, t.x, t.y, 'bubble', '#9ee0ff', 8, { delay: 0.15 }); heal({ ...c, impact: 0.2 }); }
  },
  runeCircle: (c) => {
    const [ax, ay] = enemyArea(c);
    flash(c, '#fff2c8', 0.35, 0.3);
    magicCircle(c, ax, ay, 150, '#ffe08a', { dur: 1.4, spin: 0.8 });
    magicCircle(c, ax, ay, 100, '#9fe8ff', { dur: 1.4, spin: -1.2, delay: 0.1 });
    for (const t of c.tg) rising(c, t.x, t.y, 'rune', '#ffe08a', 6, { delay: 0.2, speed: 90 });
  },
  stoneFortress: (c) => {
    const [ax, ay] = enemyArea(c);
    shake(c, 6, 0.4, 0.1);
    for (const t of c.tg) c.fx.burst(t.x, t.y, 10, { kind: 'rock', color: '#5a5a66', speed: 200, size: 9, life: 0.6, ay: 600, angle: -Math.PI / 2, spread: 1.8, delay: 0.1 });
    shieldOn({ ...c, impact: 0.2 }, PAL.earth[0]);
    ring(c, ax, ay, '#e0a02a', 20, 200, 0.6, 0.1, 6);
  },
  chaosParty: (c) => {
    flash(c, '#ff8ad8', 0.35, 0.2);
    for (let h = 0; h < 3; h++) for (const t of c.tg) {
      const d = 0.18 + h * 0.16;
      glowBurst(c, t.x + (R() - 0.5) * 30, t.cy + (R() - 0.5) * 30, ['#ff4ab0', '#ffd02a', '#7ae0ff'][h], 12, 260, 9, d);
      rising(c, t.x, t.y, 'heart', '#ff8ad8', 2, { delay: d, speed: 80 });
    }
    for (let i = 0; i < 30; i++) c.fx.emit({ x: R() * c.view.w, y: -10, vx: (R() - 0.5) * 80, vy: 180 + R() * 120, kind: 'star', color: ['#ff4ab0', '#ffd02a', '#7ae0ff', '#b6ffd8'][i % 4], size: 7, life: 1.2, delay: R() * 0.6, vr: 6 });
  },
  healingRain: (c) => {
    const W = c.view.w;
    for (let i = 0; i < 40; i++) c.fx.emit({ x: (c.src.side ? W * 0.5 : 0) + R() * W * 0.5, y: -10, vx: 0, vy: 260 + R() * 120, kind: 'spark', color: '#9ee0ff', size: 8, life: 0.9, stretch: 0.02, delay: R() * 0.6 });
    heal({ ...c, impact: 0.25 });
  },
  bloom: (c) => {
    for (const t of c.tg) { c.fx.burst(t.x, t.y - 10, 14, { kind: 'petal', color: ['#ff8ab0', '#ffd84a', '#ffffff'][Math.floor(R() * 3)], speed: 140, size: 7, life: 1.0, ay: 120, delay: 0.15, vr: 8 }); }
    heal({ ...c, impact: 0.2 }, '#7ad84a');
    const [ax, ay] = enemyArea(c); magicCircle(c, ax, ay, 120, '#7ad84a', { dur: 1.2 });
  },
  holyLight: (c) => { for (const t of c.tg) pillar(c, t.x, t.y, PAL.light[0], { delay: 0.05 + R() * 0.1, width: 22, dur: 0.7 }); heal({ ...c, impact: 0.2 }, PAL.light[0]); },
  shadowStrike: (c) => {
    const t = c.tg[0];
    if (!t) return;
    c.view.dim(0.5, 0.7);
    smoke(c, c.src.x, c.src.cy, '#1a0a24', 12, 0);
    for (let i = 0; i < 5; i++) slashArc(c, t.x, t.cy, i % 2 ? PAL.dark[1] : '#ffffff', { angle: R() * 6.28, r: 50 + i * 6, width: 12, delay: 0.1 + i * 0.05, dur: 0.22 });
    glowBurst(c, t.x, t.cy, PAL.dark[0], 20, 320, 11, 0.18);
    shake(c, 8, 0.25, 0.2);
  },
  fireCleave: (c) => {
    flash(c, '#ffb35c', 0.3, 0.2, 0.1);
    for (const t of c.tg) { slashArc(c, t.x, t.cy, PAL.fire[0], { angle: 0, r: 70, width: 22, sweep: 3.6, delay: 0.12, dur: 0.35 }); c.fx.burst(t.x, t.cy, 14, { kind: 'flame', color: PAL.fire[0], speed: 200, size: 13, life: 0.6, ay: -250, delay: 0.16 }); }
    shake(c, 8, 0.25, 0.16);
  },
  dragonBreath: (c) => { flash(c, P(c.el)[0], 0.4, 0.3); RECIPES.flameBreath({ ...c, impact: 0.45 }); shake(c, 10, 0.6, 0.3); },
  bossSlam: (c) => { flash(c, '#ffffff', 0.45, 0.2, 0.25); for (const t of c.tg) { glowBurst(c, t.x, t.cy, P(c.el)[1], 16, 320, 12, 0.3); smoke(c, t.x, t.y, '#5a4a3a', 6, 0.3); } shake(c, 16, 0.5, 0.28); },
};
ULTS.blizzard = (c) => { ULTS.absoluteZero(c); };

/** Plays the effect for a skill. Unknown names fall back by kind (projectile / slash / burst). */
export function playVfx(name, c) {
  const f = (c.kind === 'ult' || c.kind === 'charge' ? ULTS[name] : null) || RECIPES[name] || ULTS[name];
  if (f) {
    f(c);
    if (c.kind === 'ult' && !ULTS[name]) { flash(c, P(c.el)[1], 0.35, 0.25); shake(c, 6, 0.3, 0.15); }
    return;
  }
  if (c.src && c.tg.length) {
    if (c.melee) meleeSlash(c, P(c.el)[1]);
    else boltAttack(c, 'core', P(c.el)[0]);
  }
}
