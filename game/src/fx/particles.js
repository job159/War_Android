// Particle + shape effect engine for the battle canvas.
// Sprites are pre-rendered once per color (glow dots, sparks, stars, shards...) so drawing thousands of
// additive particles stays cheap on phones (no shadowBlur at runtime).

const spriteCache = new Map();

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Cached sprite canvas: kind in glow | core | spark | star | ring | shard | feather | leaf | note | petal | smoke | flame | bubble | snow | heart | rune */
export function sprite(kind, color = '#ffffff') {
  const key = kind + color;
  let c = spriteCache.get(key);
  if (c) return c;
  const S = 64;
  c = makeCanvas(S, S);
  const g = c.getContext('2d');
  const [r, gg, b] = rgb(color);
  const col = (a) => `rgba(${r},${gg},${b},${a})`;
  g.translate(S / 2, S / 2);
  switch (kind) {
    case 'glow': {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 32);
      gr.addColorStop(0, col(1)); gr.addColorStop(0.25, col(0.6)); gr.addColorStop(1, col(0));
      g.fillStyle = gr; g.fillRect(-32, -32, 64, 64);
      break;
    }
    case 'core': {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, col(1)); gr.addColorStop(0.5, col(0.35)); gr.addColorStop(1, col(0));
      g.fillStyle = gr; g.fillRect(-32, -32, 64, 64);
      break;
    }
    case 'spark': { // horizontal streak (drawn rotated along velocity)
      const gr = g.createLinearGradient(-32, 0, 32, 0);
      gr.addColorStop(0, col(0)); gr.addColorStop(0.7, col(1)); gr.addColorStop(1, 'rgba(255,255,255,1)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(0, 0, 30, 3.5, 0, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'star': {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 30);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, col(0.9)); gr.addColorStop(1, col(0));
      g.fillStyle = gr;
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rr = i % 2 ? 6 : 30;
        g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath(); g.fill();
      break;
    }
    case 'ring': {
      g.strokeStyle = col(1); g.lineWidth = 4;
      g.beginPath(); g.arc(0, 0, 26, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = col(0.35); g.lineWidth = 9;
      g.beginPath(); g.arc(0, 0, 26, 0, Math.PI * 2); g.stroke();
      break;
    }
    case 'shard': {
      const gr = g.createLinearGradient(0, -28, 0, 28);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, col(0.9));
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, -28); g.lineTo(9, 0); g.lineTo(0, 28); g.lineTo(-9, 0); g.closePath(); g.fill();
      break;
    }
    case 'feather': {
      g.fillStyle = col(0.95);
      g.beginPath(); g.ellipse(0, 0, 9, 26, 0.3, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(-6, 22); g.lineTo(6, -22); g.stroke();
      break;
    }
    case 'leaf': {
      g.fillStyle = col(1);
      g.beginPath(); g.moveTo(0, -26); g.quadraticCurveTo(18, 0, 0, 26); g.quadraticCurveTo(-18, 0, 0, -26); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, -24); g.lineTo(0, 24); g.stroke();
      break;
    }
    case 'note': {
      g.fillStyle = col(1);
      g.font = 'bold 44px serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('♪', 0, 2);
      break;
    }
    case 'petal': {
      g.fillStyle = col(1);
      g.beginPath(); g.ellipse(0, 0, 12, 20, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.4)';
      g.beginPath(); g.ellipse(-3, -5, 4, 9, 0, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'smoke': {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 30);
      gr.addColorStop(0, col(0.55)); gr.addColorStop(0.6, col(0.25)); gr.addColorStop(1, col(0));
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'flame': {
      const gr = g.createRadialGradient(0, 8, 0, 0, 8, 28);
      gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.3, col(1)); gr.addColorStop(1, col(0));
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, -30); g.quadraticCurveTo(22, 0, 14, 20); g.quadraticCurveTo(0, 32, -14, 20); g.quadraticCurveTo(-22, 0, 0, -30); g.fill();
      break;
    }
    case 'bubble': {
      g.strokeStyle = col(0.9); g.lineWidth = 2.5;
      g.beginPath(); g.arc(0, 0, 22, 0, Math.PI * 2); g.stroke();
      g.fillStyle = col(0.15); g.fill();
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.beginPath(); g.ellipse(-8, -9, 5, 3, -0.6, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'snow': {
      g.strokeStyle = col(1); g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        g.rotate(Math.PI / 3);
        g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.stroke();
      }
      break;
    }
    case 'heart': {
      g.fillStyle = col(1);
      g.beginPath(); g.moveTo(0, 20); g.bezierCurveTo(-30, 0, -14, -26, 0, -10); g.bezierCurveTo(14, -26, 30, 0, 0, 20); g.fill();
      break;
    }
    case 'rune': {
      g.strokeStyle = col(1); g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-10, -20); g.lineTo(-10, 20); g.moveTo(-10, -8); g.lineTo(10, -20); g.moveTo(-10, 4); g.lineTo(12, 18); g.stroke();
      break;
    }
    case 'rock': {
      g.fillStyle = col(1); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-18, -8); g.lineTo(-4, -20); g.lineTo(16, -12); g.lineTo(20, 8); g.lineTo(2, 20); g.lineTo(-16, 12); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(-10, -8); g.lineTo(-2, -15); g.lineTo(6, -9); g.fill();
      break;
    }
    case 'bone': {
      g.fillStyle = col(1);
      g.fillRect(-18, -4, 36, 8);
      for (const x of [-18, 18]) for (const y of [-5, 5]) { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); }
      break;
    }
    case 'arrow': {
      g.strokeStyle = col(1); g.lineWidth = 3;
      g.beginPath(); g.moveTo(-28, 0); g.lineTo(24, 0); g.stroke();
      g.fillStyle = 'rgba(255,255,255,1)';
      g.beginPath(); g.moveTo(30, 0); g.lineTo(18, -7); g.lineTo(18, 7); g.closePath(); g.fill();
      g.fillStyle = col(1);
      g.beginPath(); g.moveTo(-28, 0); g.lineTo(-20, -7); g.lineTo(-16, 0); g.lineTo(-20, 7); g.closePath(); g.fill();
      break;
    }
    default: {
      g.fillStyle = col(1); g.beginPath(); g.arc(0, 0, 20, 0, Math.PI * 2); g.fill();
    }
  }
  spriteCache.set(key, c);
  return c;
}

// ------------------------------------------------------------------ particles

const pool = [];
function alloc() { return pool.pop() || {}; }

export class FX {
  constructor() {
    this.parts = [];
    this.shapes = [];
    this.max = 900;
    this.time = 0;
  }

  setQuality(high) { this.max = high ? 900 : 350; }

  /** p: { x, y, vx, vy, ax, ay, drag, life, size, size1, rot, vr, a0, a1, kind, color, blend, stretch, delay, grav } */
  emit(o) {
    if (this.parts.length >= this.max) return null;
    const p = alloc();
    p.x = o.x; p.y = o.y; p.vx = o.vx || 0; p.vy = o.vy || 0; p.ax = o.ax || 0; p.ay = o.ay || 0;
    p.drag = o.drag ?? 0; p.life = 0; p.max = o.life || 0.6; p.size = o.size || 10; p.size1 = o.size1 ?? p.size * 0.3;
    p.rot = o.rot || 0; p.vr = o.vr || 0; p.a0 = o.a0 ?? 1; p.a1 = o.a1 ?? 0; p.img = sprite(o.kind || 'glow', o.color || '#ffffff');
    p.blend = o.blend || 'lighter'; p.stretch = o.stretch || 0; p.delay = o.delay || 0; p.fadeIn = o.fadeIn || 0;
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

  /** Shape effect: { t, dur, draw(g, k, fx), delay } where k = 0..1 progress */
  shape(o) {
    this.shapes.push({ t: 0, delay: o.delay || 0, ...o });
  }

  update(dt) {
    this.time += dt;
    const P = this.parts;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.life += dt;
      if (p.life >= p.max) { P[i] = P[P.length - 1]; P.pop(); pool.push(p); continue; }
      p.vx += p.ax * dt; p.vy += p.ay * dt;
      if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const s = this.shapes[i];
      if (s.delay > 0) { s.delay -= dt; continue; }
      s.t += dt;
      if (s.t >= s.dur) this.shapes.splice(i, 1);
    }
  }

  draw(g, layer = 'all') {
    for (const s of this.shapes) {
      if (s.delay > 0) continue;
      if (layer !== 'all' && (s.layer || 'top') !== layer) continue;
      g.save();
      try { s.draw(g, Math.min(1, s.t / s.dur), s); } catch (e) { /* bad shape: skip */ }
      g.restore();
    }
    if (layer === 'under') return;
    let blend = '';
    for (const p of this.parts) {
      if (p.delay > 0) continue;
      const k = p.life / p.max;
      let a = p.a0 + (p.a1 - p.a0) * k;
      if (p.fadeIn && p.life < p.fadeIn) a *= p.life / p.fadeIn;
      if (a <= 0.01) continue;
      if (blend !== p.blend) { g.globalCompositeOperation = p.blend; blend = p.blend; }
      g.globalAlpha = Math.min(1, a);
      const s = p.size + (p.size1 - p.size) * k;
      if (p.stretch) {
        const sp = Math.hypot(p.vx, p.vy);
        const ang = Math.atan2(p.vy, p.vx);
        const len = s + sp * p.stretch;
        g.setTransform(g.__base[0] * Math.cos(ang), g.__base[0] * Math.sin(ang), -g.__base[0] * Math.sin(ang), g.__base[0] * Math.cos(ang), g.__base[4] + p.x * g.__base[0], g.__base[5] + p.y * g.__base[0]);
        g.drawImage(p.img, -len, -s * 0.5, len * 2, s);
      } else if (p.rot) {
        g.setTransform(g.__base[0] * Math.cos(p.rot), g.__base[0] * Math.sin(p.rot), -g.__base[0] * Math.sin(p.rot), g.__base[0] * Math.cos(p.rot), g.__base[4] + p.x * g.__base[0], g.__base[5] + p.y * g.__base[0]);
        g.drawImage(p.img, -s, -s, s * 2, s * 2);
      } else {
        g.setTransform(g.__base[0], 0, 0, g.__base[0], g.__base[4], g.__base[5]);
        g.drawImage(p.img, p.x - s, p.y - s, s * 2, s * 2);
      }
    }
    g.setTransform(g.__base[0], 0, 0, g.__base[0], g.__base[4], g.__base[5]);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  clear() {
    for (const p of this.parts) pool.push(p);
    this.parts.length = 0;
    this.shapes.length = 0;
  }
}

// ------------------------------------------------------------------ shape helpers (used by vfx.js)

export const ease = {
  out: (k) => 1 - (1 - k) * (1 - k),
  outCubic: (k) => 1 - Math.pow(1 - k, 3),
  in: (k) => k * k,
  inOut: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  backOut: (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
};

export function rgba(hex, a) {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Jagged lightning path between two points. */
export function lightningPath(x1, y1, x2, y2, segs = 8, amp = 18) {
  const pts = [[x1, y1]];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const nx = -(y2 - y1), ny = x2 - x1;
    const L = Math.hypot(nx, ny) || 1;
    const off = (Math.random() - 0.5) * amp * 2 * Math.sin(Math.PI * t);
    pts.push([x1 + (x2 - x1) * t + (nx / L) * off, y1 + (y2 - y1) * t + (ny / L) * off]);
  }
  pts.push([x2, y2]);
  return pts;
}

export function strokePath(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke();
}
